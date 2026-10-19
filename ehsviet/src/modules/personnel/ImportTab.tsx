// Nhập danh sách nhân sự và cột huấn luyện (Khóa – Ngày – Quyết định) từ Excel / CSV / dán từ Excel
import { useQueryClient } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Badge, Button, Card, CardHeader, ErrorNote, Note, Table, Td, Textarea } from '../../components/UI'
import { TRAINING_CATEGORY_LABELS, TRAINING_CATEGORY_SHORT } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { MATRIX_CATEGORIES, type Employee } from '../../lib/training'
import { errMsg, fmtDate, newId } from '../../lib/utils'
import {
  downloadImportTemplate,
  normalize,
  parseDelimited,
  parseRows,
  readSpreadsheetFile,
  type Cell,
  type ColumnMap,
  type ParsedRow,
} from './excel'
import type { PersonnelData } from './shared'

const FIELD_LABEL: Record<string, string> = {
  code: 'Mã NV',
  full_name: 'Họ tên',
  gender: 'Giới tính',
  department: 'Bộ phận',
  position: 'Chức danh',
  atvsld_group: 'Nhóm ATVSLĐ',
  hire_date: 'Ngày vào làm',
  status: 'Trạng thái',
}
const TRAIN_LABEL: Record<string, string> = {
  course: 'Khóa',
  date: 'Ngày',
  decision: 'Quyết định',
  decision_date: 'Ngày QĐ',
  cert: 'Số chứng nhận',
  expiry: 'Hạn',
  hours: 'Số giờ',
  provider: 'Đơn vị HL',
  mark: 'Ngày / khóa',
}

const colLabel = (c: ColumnMap) =>
  c.kind === 'field' ? FIELD_LABEL[c.field] : c.kind === 'train' ? `${TRAINING_CATEGORY_SHORT[c.category]} · ${TRAIN_LABEL[c.field]}` : null

const chunk = <T,>(arr: T[], n: number) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n))

export default function ImportTab({ data, base, canEdit }: { data: PersonnelData; base: any; canEdit: boolean }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [paste, setPaste] = useState('')
  const [source, setSource] = useState('')
  const [parsed, setParsed] = useState<{ rows: ParsedRow[]; headers: string[]; columns: ColumnMap[] } | null>(null)
  const [updateExisting, setUpdateExisting] = useState(true)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string[] | null>(null)

  const load = (rows: Cell[][], label: string) => {
    setErr('')
    setResult(null)
    const p = parseRows(rows)
    if (!p) {
      setParsed(null)
      return setErr('Không tìm thấy dòng tiêu đề có cột "Họ tên" / "Họ và tên". Kiểm tra lại file hoặc dùng file mẫu.')
    }
    setParsed({ rows: p.parsed, headers: p.headers, columns: p.columns })
    setSource(label)
  }

  const onFile = async (file?: File | null) => {
    if (!file) return
    try {
      load(await readSpreadsheetFile(file), file.name)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ghép dòng với nhân sự hiện có: theo mã NV, nếu không có mã thì theo họ tên (khi tên là duy nhất)
  const matchInfo = useMemo(() => {
    const byCode = new Map<string, Employee>()
    const byName = new Map<string, Employee[]>()
    for (const e of data.employees) {
      if (e.code) byCode.set(normalize(e.code), e)
      const k = normalize(e.full_name)
      byName.set(k, [...(byName.get(k) ?? []), e])
    }
    const find = (r: ParsedRow): Employee | undefined => {
      if (r.code) return byCode.get(normalize(r.code))
      const list = byName.get(normalize(r.full_name))
      return list && list.length === 1 ? list[0] : undefined
    }
    return { find }
  }, [data.employees])

  const stats = useMemo(() => {
    if (!parsed) return null
    const valid = parsed.rows.filter((r) => r.errors.length === 0)
    const existing = valid.filter((r) => matchInfo.find(r)).length
    return {
      total: parsed.rows.length,
      valid: valid.length,
      errors: parsed.rows.length - valid.length,
      existing,
      fresh: valid.length - existing,
      trainings: valid.reduce((s, r) => s + r.trainings.length, 0),
      warnings: parsed.rows.reduce((s, r) => s + r.warnings.length, 0),
    }
  }, [parsed, matchInfo])

  const runImport = async () => {
    if (!parsed || !stats) return
    setBusy(true)
    setErr('')
    setResult(null)
    const log: string[] = []
    try {
      const valid = parsed.rows.filter((r) => r.errors.length === 0)
      // 1) nhân sự
      const empIdOf = new Map<ParsedRow, string>()
      const newByCode = new Map<string, string>()
      const inserts: any[] = []
      const updates: { id: string; patch: any }[] = []
      for (const r of valid) {
        const e = matchInfo.find(r)
        if (e) {
          empIdOf.set(r, e.id)
          if (!updateExisting) continue
          const patch: any = {}
          if (r.full_name && r.full_name !== e.full_name) patch.full_name = r.full_name
          if (r.department && r.department !== e.department) patch.department = r.department
          if (r.position && r.position !== e.position) patch.position = r.position
          if (r.gender && r.gender !== e.gender) patch.gender = r.gender
          if (r.atvsld_group && r.atvsld_group !== e.atvsld_group) patch.atvsld_group = r.atvsld_group
          if (r.hire_date && r.hire_date !== e.hire_date) patch.hire_date = r.hire_date
          if (r.status && r.status !== e.status) patch.status = r.status
          if (Object.keys(patch).length) updates.push({ id: e.id, patch })
        } else {
          const key = r.code ? normalize(r.code) : ''
          const dupId = key ? newByCode.get(key) : undefined
          if (dupId) {
            empIdOf.set(r, dupId)
            continue
          }
          const id = newId()
          if (key) newByCode.set(key, id)
          empIdOf.set(r, id)
          inserts.push({
            ...base,
            id,
            code: r.code || null,
            full_name: r.full_name,
            gender: r.gender,
            department: r.department || null,
            position: r.position || null,
            atvsld_group: r.atvsld_group,
            hire_date: r.hire_date,
            status: r.status ?? 'active',
          })
        }
      }
      for (const part of chunk(inserts, 300)) {
        const { error } = await supabase.from('employees').insert(part)
        if (error) throw new Error('Thêm nhân sự: ' + error.message)
      }
      for (const u of updates) {
        const { error } = await supabase.from('employees').update(u.patch).eq('id', u.id)
        if (error) throw new Error('Cập nhật nhân sự: ' + error.message)
      }
      log.push(`Thêm mới ${inserts.length} nhân sự; cập nhật ${updates.length} người đã có.`)

      // 2) khóa huấn luyện: gộp theo (loại, tên, ngày, số QĐ)
      const courseKey = (cat: string, name: string, date: string, dec: string) => [cat, normalize(name), date, dec.trim()].join('|')
      const courseId = new Map<string, string>()
      for (const c of data.courses) courseId.set(courseKey(c.category, c.name, c.start_date, c.decision_no ?? ''), c.id)
      const newCourses: any[] = []
      const newRecords: any[] = []
      const haveRecord = new Set(data.records.map((r) => r.employee_id + '|' + r.course_id))
      for (const r of valid) {
        const empId = empIdOf.get(r)!
        for (const t of r.trainings) {
          const name = t.course || 'Huấn luyện ' + TRAINING_CATEGORY_LABELS[t.category].toLowerCase()
          const key = courseKey(t.category, name, t.date!, t.decision)
          let cid = courseId.get(key)
          if (!cid) {
            cid = newId()
            courseId.set(key, cid)
            newCourses.push({
              ...base,
              id: cid,
              category: t.category,
              name,
              start_date: t.date,
              decision_no: t.decision || null,
              decision_date: t.decision_date,
              provider: t.provider || null,
              hours: t.hours,
            })
          }
          const rk = empId + '|' + cid
          if (haveRecord.has(rk)) continue
          haveRecord.add(rk)
          newRecords.push({
            ...base,
            employee_id: empId,
            course_id: cid,
            result: 'dat',
            certificate_no: t.cert || null,
            expiry_date: t.expiry,
          })
        }
      }
      for (const part of chunk(newCourses, 300)) {
        const { error } = await supabase.from('training_courses').insert(part)
        if (error) throw new Error('Thêm khóa huấn luyện: ' + error.message)
      }
      for (const part of chunk(newRecords, 300)) {
        const { error } = await supabase.from('training_records').insert(part)
        if (error) throw new Error('Thêm lượt huấn luyện: ' + error.message)
      }
      log.push(`Tạo ${newCourses.length} khóa huấn luyện mới; ghi ${newRecords.length} lượt huấn luyện.`)
      if (stats.errors) log.push(`Bỏ qua ${stats.errors} dòng lỗi (thiếu họ tên).`)
      await qc.invalidateQueries()
      setResult(log)
      setParsed(null)
      setPaste('')
    } catch (e) {
      setErr(errMsg(e) + (log.length ? ' — Đã thực hiện: ' + log.join(' ') : ''))
      await qc.invalidateQueries()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Nhập nhân sự và huấn luyện từ Excel"
          hint="Một dòng một người; các cột huấn luyện theo dạng Khóa – Ngày – Quyết định cho ATVSLĐ, PCCC, Sự cố chất thải"
          action={
            <Button variant="outline" onClick={() => downloadImportTemplate().catch((e) => setErr(errMsg(e)))}>
              <Download size={15} /> Tải file mẫu (.xlsx)
            </Button>
          }
        />
        <div className="space-y-3 px-4 py-4">
          <Note>
            <b>Cột nhận dạng tự động</b> (không phân biệt hoa thường, có dấu/không dấu): Mã NV · Họ và tên (bắt buộc) · Giới tính · Bộ phận ·
            Chức danh · Nhóm (1–6) · Ngày vào làm · và với mỗi loại <b>ATVSLĐ / PCCC / Sự cố chất thải</b> (cũng nhận An toàn hóa chất, Sơ cứu):
            cột <b>Khóa</b>, <b>Ngày</b>, <b>Quyết định</b> (tùy chọn: Số chứng nhận, Hạn). Tiêu đề 2 tầng (ô gộp "ATVSLĐ" phía trên "Khóa | Ngày | QĐ")
            hoặc 1 tầng ("ATVSLĐ - Ngày") đều được. Ngày dạng dd/mm/yyyy hoặc ô ngày của Excel.
            Người đã có được nhận ra theo <b>Mã NV</b> (không có mã thì theo họ tên); khóa trùng loại – tên – ngày – số QĐ được gộp làm một.
          </Note>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.csv,.tsv,.txt"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={!canEdit}>
              <FileSpreadsheet size={15} /> Chọn file .xlsx / .csv
            </Button>
            <span className="text-xs text-pine-800/50">hoặc dán vùng dữ liệu đã sao chép từ Excel (gồm dòng tiêu đề):</span>
          </div>
          <Textarea
            rows={4}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={'Mã NV\tHọ và tên\tBộ phận\tATVSLĐ - Khóa\tATVSLĐ - Ngày\tATVSLĐ - QĐ\n…'}
            className="font-mono text-xs"
            disabled={!canEdit}
          />
          <div className="flex gap-2">
            <Button variant="outline" disabled={!paste.trim() || !canEdit} onClick={() => load(parseDelimited(paste), 'Dữ liệu dán')}>
              <Upload size={15} /> Đọc dữ liệu dán
            </Button>
          </div>
          {err && <ErrorNote message={err} />}
          {result && (
            <div className="rounded-lg border border-viridian-600/20 bg-viridian-50 px-3 py-2 text-sm text-viridian-700">
              <b>Đã nhập xong.</b> {result.join(' ')}
            </div>
          )}
        </div>
      </Card>

      {parsed && stats && (
        <Card>
          <CardHeader
            title={'Xem trước: ' + source}
            hint={`${stats.total} dòng · ${stats.fresh} người mới · ${stats.existing} người đã có · ${stats.trainings} lượt huấn luyện · ${stats.errors} dòng lỗi · ${stats.warnings} cảnh báo`}
            action={
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-pine-800/70">
                  <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} />
                  Cập nhật thông tin người đã có
                </label>
                <Button onClick={runImport} disabled={busy || stats.valid === 0 || !canEdit}>
                  {busy ? 'Đang nhập…' : `Nhập ${stats.valid} dòng`}
                </Button>
              </div>
            }
          />
          <div className="flex flex-wrap gap-1.5 border-b border-pine-800/10 px-4 py-2.5">
            {parsed.headers.map((h, i) => {
              const l = colLabel(parsed.columns[i])
              if (!h) return null
              return (
                <span key={i} className="text-xs">
                  <Badge tone={l ? 'green' : 'gray'}>
                    {h}
                    {l ? ' → ' + l : ' (bỏ qua)'}
                  </Badge>
                </span>
              )
            })}
          </div>
          <Table head={['Dòng', 'Mã NV', 'Họ tên', 'Bộ phận', 'Nhóm', ...MATRIX_CATEGORIES.map((c) => TRAINING_CATEGORY_SHORT[c]), 'Ghi chú']}>
            {parsed.rows.slice(0, 200).map((r) => {
              const exists = matchInfo.find(r)
              return (
                <tr key={r.line} className={r.errors.length ? 'bg-red-50/60' : ''}>
                  <Td className="text-pine-800/45">{r.line}</Td>
                  <Td className="font-mono text-xs">{r.code || '—'}</Td>
                  <Td>
                    <div className="font-medium">{r.full_name || '—'}</div>
                    {!r.errors.length && <Badge tone={exists ? 'blue' : 'green'}>{exists ? 'Đã có' : 'Mới'}</Badge>}
                  </Td>
                  <Td className="text-pine-800/70">{r.department || '—'}</Td>
                  <Td className="text-pine-800/70">{r.atvsld_group ?? '—'}</Td>
                  {MATRIX_CATEGORIES.map((c) => {
                    const t = r.trainings.find((x) => x.category === c)
                    return (
                      <Td key={c} className="text-xs">
                        {t ? (
                          <>
                            <div>{fmtDate(t.date)}</div>
                            <div className="text-pine-800/50">{t.decision || t.course || ''}</div>
                          </>
                        ) : (
                          <span className="text-pine-800/35">—</span>
                        )}
                      </Td>
                    )
                  })}
                  <Td className="max-w-[260px] text-xs">
                    {r.errors.map((m) => (
                      <div key={m} className="text-red-700">
                        {m}
                      </div>
                    ))}
                    {r.warnings.map((m) => (
                      <div key={m} className="text-amber-700">
                        {m}
                      </div>
                    ))}
                  </Td>
                </tr>
              )
            })}
          </Table>
          {parsed.rows.length > 200 && <div className="px-4 py-2 text-xs text-pine-800/50">Hiển thị 200/{parsed.rows.length} dòng đầu; khi nhập sẽ xử lý toàn bộ.</div>}
        </Card>
      )}
    </div>
  )
}
