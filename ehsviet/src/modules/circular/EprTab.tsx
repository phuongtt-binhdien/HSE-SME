// EPR bao bì: khối lượng bao bì đưa ra thị trường trong nước, nghĩa vụ tái chế V × R, đóng góp tài chính F = V × R × Fs,
// hạn kê khai – nộp và lịch sử thực hiện theo năm.
import { useQueryClient } from '@tanstack/react-query'
import { CalendarCheck, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Kpi, Loading, Modal, Note, Select, Table, Td, Textarea } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { useRemove, useSave } from '../../hooks/useCrud'
import {
  EPR_BASIS,
  EPR_MATERIALS,
  EPR_STEP_LABELS,
  EPR_STEP_TONE,
  eprCalc,
  eprDeadlines,
  eprStep,
  PACKAGING_METHOD_LABELS,
  type PackagingRecord,
} from '../../lib/circular'
import { supabase } from '../../lib/supabase'
import { daysUntil, errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'
import type { CircularData } from './useCircularData'

const FS_DEFAULT = 8486
const vnd = (n: number) => fmtNum(Math.round(n), 0) + ' đ'
const mvnd = (n: number) => fmtNum(n / 1e6, 1) + ' tr đ'
const num = (v: any) => (v === '' || v == null ? null : Number(v))

function sumYear(rows: PackagingRecord[]) {
  return rows.reduce(
    (s, r) => {
      const c = eprCalc(r)
      s.units += Number(r.units_domestic ?? 0)
      s.exportUnits += Number(r.units_export ?? 0)
      s.V += c.V
      s.obligation += c.obligationKg
      s.payable += c.payable
      s.paid += Number(r.paid_amount ?? 0)
      return s
    },
    { units: 0, exportUnits: 0, V: 0, obligation: 0, payable: 0, paid: 0 }
  )
}

export default function EprTab({ data, base, canEdit }: { data: CircularData; base: Record<string, string>; canEdit: boolean }) {
  const { facility } = useAuth()
  const { packaging, loading } = data
  const qc = useQueryClient()
  const save = useSave('packaging_records')
  const remove = useRemove('packaging_records')
  const thisYear = new Date().getFullYear()
  const today = todayISO()

  const years = useMemo(() => {
    const s = new Set<number>([thisYear, thisYear - 1])
    for (const r of packaging) s.add(Number(r.year))
    return [...s].sort((a, b) => b - a)
  }, [packaging, thisYear])
  // mặc định: kỳ số liệu đang đến hạn kê khai (năm trước) nếu chưa hoàn thành, ngược lại năm hiện tại
  const [year, setYear] = useState(() => thisYear - 1)
  const [form, setForm] = useState<any>(null)
  const [declare, setDeclare] = useState<any>(null)
  const [err, setErr] = useState('')

  const rows = useMemo(() => packaging.filter((r) => Number(r.year) === year), [packaging, year])
  const tot = sumYear(rows)
  const step = eprStep(rows, year, today)
  const dl = eprDeadlines(year)

  const history = useMemo(
    () =>
      years
        .map((y) => {
          const rs = packaging.filter((r) => Number(r.year) === y)
          return { y, rs, t: sumYear(rs), step: eprStep(rs, y, today) }
        })
        .filter((h) => h.rs.length),
    [years, packaging, today]
  )

  const deadlineSub = () => {
    if (step === 'chua_den_han') return `Kỳ số liệu ${year}: kê khai ${dl.declareText}, nộp ${dl.payText}`
    if (step === 'can_ke_khai' || step === 'qua_han_ke_khai') {
      const n = daysUntil(dl.declare)
      return n >= 0 ? `Hạn kê khai còn ${n} ngày (${dl.declareText})` : `Quá hạn kê khai ${-n} ngày`
    }
    if (step === 'can_nop' || step === 'qua_han_nop') {
      const n = daysUntil(dl.pay)
      return n >= 0 ? `Hạn nộp còn ${n} ngày (${dl.payText})` : `Quá hạn nộp ${-n} ngày`
    }
    if (step === 'hoan_thanh') {
      const paidDates = rows.map((r) => r.paid_date).filter(Boolean).sort()
      return paidDates.length ? `Nộp ngày ${fmtDate(paidDates[paidDates.length - 1])}` : 'Không phát sinh số phải nộp'
    }
    return 'Thêm bao bì để tính nghĩa vụ'
  }

  const submit = async () => {
    setErr('')
    const f = form
    if (!f.packaging?.trim()) return setErr('Nhập loại bao bì.')
    const y = Number(f.year)
    if (!Number.isInteger(y) || y < 2024 || y > 2100) return setErr('Năm số liệu không hợp lệ (trách nhiệm tái chế bao bì áp dụng từ 01/01/2024).')
    const units = num(f.units_domestic)
    const w = num(f.unit_weight_kg)
    if (units == null || units < 0) return setErr('Nhập số bao đưa ra thị trường trong nước.')
    if (w == null || w <= 0) return setErr('Nhập khối lượng 01 bao (kg) theo kết quả cân mẫu.')
    const R = num(f.recycling_rate)
    if (R == null || R < 0 || R > 100) return setErr('Tỷ lệ tái chế bắt buộc R phải trong khoảng 0–100%.')
    if (f.paid_date && !f.declared_date) return setErr('Có ngày nộp thì phải có ngày kê khai.')
    if (f.method !== 'dong_quy' && num(f.recycled_kg) == null) return setErr('Tự tái chế / ủy quyền: nhập khối lượng đã tái chế có chứng từ (kg).')
    try {
      await save.mutateAsync({
        ...(f.id ? { id: f.id } : base),
        year: y,
        packaging: f.packaging.trim(),
        material_group: f.material_group || null,
        units_domestic: units,
        units_export: num(f.units_export),
        unit_weight_kg: w,
        recycling_rate: R,
        fs_vnd_per_kg: num(f.fs_vnd_per_kg),
        method: f.method || 'dong_quy',
        recycled_kg: f.method === 'dong_quy' ? null : num(f.recycled_kg),
        declared_date: f.declared_date || null,
        paid_date: f.paid_date || null,
        paid_amount: num(f.paid_amount),
        note: f.note || null,
      })
      setYear(y)
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const submitDeclare = async () => {
    setErr('')
    if (!declare.declared_date) return setErr('Nhập ngày kê khai.')
    if (declare.paid_date && declare.paid_date < declare.declared_date) return setErr('Ngày nộp không được trước ngày kê khai.')
    try {
      for (const r of rows) {
        const c = eprCalc(r)
        const patch: Record<string, any> = { declared_date: r.declared_date ?? declare.declared_date }
        if (declare.paid_date && c.payable > 0 && !r.paid_date) {
          patch.paid_date = declare.paid_date
          patch.paid_amount = Math.round(c.payable)
        }
        const { error } = await supabase.from('packaging_records').update(patch).eq('id', r.id)
        if (error) throw error
      }
      await qc.invalidateQueries()
      setDeclare(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true, align: 'center' as const })
      const cols = ['TT', 'Loại bao bì', 'Nhóm bao bì (danh mục EPR)', 'Số bao trong nước', 'Số bao xuất khẩu (loại trừ)', 'KL 01 bao (kg)', 'V (kg)', 'R (%)', 'Phải tái chế V × R (kg)', 'Fs (đ/kg)', 'Hình thức', 'Đã tái chế (kg)', 'Phải nộp (đ)', 'Ngày kê khai', 'Ngày nộp', 'Đã nộp (đ)']
      const sheet: any[][] = [
        [{ value: `BẢNG TÍNH TRÁCH NHIỆM TÁI CHẾ BAO BÌ – SỐ LIỆU NĂM ${year} · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        [`F = V × R × Fs. Kê khai ${dl.declareText}; nộp Quỹ BVMT Việt Nam ${dl.payText}. Đối chiếu mẫu kê khai tại văn bản hiện hành.`],
        [],
        cols.map(head),
        ...rows.map((r, i) => {
          const c = eprCalc(r)
          return [
            i + 1, r.packaging, r.material_group ?? '', Number(r.units_domestic ?? 0), Number(r.units_export ?? 0), Number(r.unit_weight_kg ?? 0), Math.round(c.V), Number(r.recycling_rate ?? 0),
            Math.round(c.obligationKg), Number(r.fs_vnd_per_kg ?? 0), PACKAGING_METHOD_LABELS[r.method] ?? r.method, r.method === 'dong_quy' ? '' : Number(r.recycled_kg ?? 0),
            Math.round(c.payable), fmtDate(r.declared_date), fmtDate(r.paid_date), r.paid_amount == null ? '' : Number(r.paid_amount),
          ].map((value) => ({ value }))
        }),
        [
          { value: 'Cộng', fontWeight: 'bold' }, null, null, { value: tot.units, fontWeight: 'bold' }, { value: tot.exportUnits, fontWeight: 'bold' }, null, { value: Math.round(tot.V), fontWeight: 'bold' }, null,
          { value: Math.round(tot.obligation), fontWeight: 'bold' }, null, null, null, { value: Math.round(tot.payable), fontWeight: 'bold' }, null, null, { value: Math.round(tot.paid), fontWeight: 'bold' },
        ],
      ]
      const columns = [5, 30, 26, 14, 14, 10, 12, 7, 14, 10, 22, 12, 16, 12, 12, 14].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`EPR_bao_bi_${year}_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  const preview = form ? eprCalc({ ...form, units_domestic: num(form.units_domestic), unit_weight_kg: num(form.unit_weight_kg), recycling_rate: num(form.recycling_rate), fs_vnd_per_kg: num(form.fs_vnd_per_kg), recycled_kg: num(form.recycled_kg) }) : null
  const pendingDeclare = rows.some((r) => !r.declared_date) || rows.some((r) => eprCalc(r).payable > 0 && !r.paid_date)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Kpi label={`Bao bì đưa ra thị trường ${year}`} value={fmtNum(tot.V / 1000, 1) + ' t'} sub={`${fmtNum(tot.units, 0)} bao trong nước · loại trừ ${fmtNum(tot.exportUnits, 0)} bao xuất khẩu`} tone="blue" />
        <Kpi label="Phải tái chế (V × R)" value={fmtNum(tot.obligation / 1000, 1) + ' t'} sub={rows.length ? `R ${[...new Set(rows.map((r) => fmtNum(Number(r.recycling_rate ?? 0), 1) + '%'))].join(', ')}` : '—'} />
        <Kpi label="Đóng góp tài chính" value={mvnd(tot.payable)} sub={step === 'hoan_thanh' ? `Đã nộp ${mvnd(tot.paid)}` : 'F = V × R × Fs'} tone={step === 'hoan_thanh' ? 'green' : 'gray'} />
        <Kpi label="Trạng thái nghĩa vụ" value={EPR_STEP_LABELS[step]} sub={deadlineSub()} tone={EPR_STEP_TONE[step]} />
      </div>

      <Card>
        <CardHeader
          title={`Bao bì phân bón – số liệu năm ${year}`}
          hint="Khối lượng 01 bao lấy theo kết quả cân mẫu (lưu biên bản); số bao theo xuất kho bán hàng trong nước"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" aria-label="Năm số liệu">
                {years.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </Select>
              <Button variant="outline" onClick={exportXlsx} disabled={!rows.length}>
                <Download size={15} /> Excel
              </Button>
              {canEdit && year < thisYear && rows.length > 0 && pendingDeclare && (
                <Button variant="outline" onClick={() => setDeclare({ declared_date: todayISO(), paid_date: '' })}>
                  <CalendarCheck size={15} /> Ghi nhận kê khai, nộp
                </Button>
              )}
              {canEdit && (
                <Button onClick={() => setForm({ year, method: 'dong_quy', material_group: EPR_MATERIALS[0].group, recycling_rate: EPR_MATERIALS[0].rate, fs_vnd_per_kg: FS_DEFAULT })}>
                  <Plus size={15} /> Thêm bao bì
                </Button>
              )}
            </div>
          }
        />
        {err && !form && !declare && (
          <div className="px-4 pt-3">
            <ErrorNote message={err} />
          </div>
        )}
        {rows.length === 0 ? (
          <EmptyState title={`Chưa có số liệu bao bì năm ${year}`} hint="Thêm từng loại bao bì: số bao bán trong nước, khối lượng 01 bao, nhóm bao bì" />
        ) : (
          <Table head={['Bao bì', 'Số bao trong nước', 'KL 01 bao', 'V', 'R', 'Phải tái chế', 'Phải nộp', 'Kê khai / nộp', '']}>
            {rows.map((r) => {
              const c = eprCalc(r)
              return (
                <tr key={r.id}>
                  <Td className="min-w-[220px]">
                    <div className="font-medium text-pine-800">{r.packaging}</div>
                    <div className="text-xs text-pine-800/50">
                      {r.material_group ?? '—'} · {PACKAGING_METHOD_LABELS[r.method]}
                    </div>
                    {r.note && <div className="text-xs text-pine-800/40">{r.note}</div>}
                  </Td>
                  <Td className="whitespace-nowrap text-right [font-variant-numeric:tabular-nums]">
                    {fmtNum(Number(r.units_domestic ?? 0), 0)}
                    {Number(r.units_export ?? 0) > 0 && <div className="text-xs text-pine-800/45">XK {fmtNum(Number(r.units_export), 0)}</div>}
                  </Td>
                  <Td className="whitespace-nowrap text-right">{fmtNum(Number(r.unit_weight_kg ?? 0), 3)} kg</Td>
                  <Td className="whitespace-nowrap text-right [font-variant-numeric:tabular-nums]">{fmtNum(c.V / 1000, 1)} t</Td>
                  <Td className="whitespace-nowrap text-right">{fmtNum(Number(r.recycling_rate ?? 0), 1)}%</Td>
                  <Td className="whitespace-nowrap text-right [font-variant-numeric:tabular-nums]">
                    {fmtNum(c.obligationKg / 1000, 2)} t
                    {r.method !== 'dong_quy' && (
                      <div className={'text-xs ' + (c.shortfallKg > 0 ? 'text-red-600' : 'text-pine-800/45')}>
                        {c.shortfallKg > 0 ? `Thiếu ${fmtNum(c.shortfallKg, 0)} kg` : `Đã tái chế ${fmtNum(c.recycled, 0)} kg`}
                      </div>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-right font-medium [font-variant-numeric:tabular-nums]">{vnd(c.payable)}</Td>
                  <Td className="whitespace-nowrap text-xs">
                    <div>{r.declared_date ? <span className="text-pine-800/70">KK {fmtDate(r.declared_date)}</span> : <Badge tone={year < thisYear ? 'amber' : 'gray'}>Chưa kê khai</Badge>}</div>
                    {c.payable > 0 && <div className="mt-1">{r.paid_date ? <span className="text-pine-800/70">Nộp {fmtDate(r.paid_date)}</span> : year < thisYear ? <Badge tone="amber">Chưa nộp</Badge> : null}</div>}
                  </Td>
                  <Td className="text-right">
                    {canEdit && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...r })}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" aria-label="Xóa" onClick={() => window.confirm(`Xóa "${r.packaging}" năm ${r.year}?`) && remove.mutate(r.id)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    )}
                  </Td>
                </tr>
              )
            })}
          </Table>
        )}
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader title="Thực hiện nghĩa vụ theo năm" hint="Bấm một năm để xem chi tiết" />
          <Table head={['Năm số liệu', 'V', 'Phải tái chế', 'Phải nộp', 'Đã nộp', 'Hạn', 'Trạng thái']}>
            {history.map((h) => {
              const d = eprDeadlines(h.y)
              return (
                <tr key={h.y} className={'cursor-pointer hover:bg-pine-800/[0.03] ' + (h.y === year ? 'bg-viridian-50/60' : '')} onClick={() => setYear(h.y)}>
                  <Td className="font-medium">{h.y}</Td>
                  <Td className="whitespace-nowrap">{fmtNum(h.t.V / 1000, 1)} t</Td>
                  <Td className="whitespace-nowrap">{fmtNum(h.t.obligation / 1000, 1)} t</Td>
                  <Td className="whitespace-nowrap">{mvnd(h.t.payable)}</Td>
                  <Td className="whitespace-nowrap">{h.t.paid ? mvnd(h.t.paid) : '—'}</Td>
                  <Td className="whitespace-nowrap text-xs text-pine-800/60">
                    KK {d.declareText.replace(/ \(.*\)$/, '')} · nộp {d.payText}
                  </Td>
                  <Td>
                    <Badge tone={EPR_STEP_TONE[h.step]}>{EPR_STEP_LABELS[h.step]}</Badge>
                  </Td>
                </tr>
              )
            })}
          </Table>
        </Card>
      )}

      <Note>{EPR_BASIS}</Note>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa bao bì' : 'Thêm bao bì'}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <Field label="Năm số liệu" required>
                <Input type="number" value={form.year ?? ''} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Field>
              <Field label="Loại bao bì" required>
                <Input value={form.packaging ?? ''} onChange={(e) => setForm({ ...form, packaging: e.target.value })} placeholder="VD: Bao PP dệt 50 kg tráng, lót PE" />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nhóm bao bì (danh mục EPR)" hint="Bao nhiều lớp: kê theo vật liệu có khối lượng lớn nhất">
                <Select
                  value={form.material_group ?? ''}
                  onChange={(e) => {
                    const m = EPR_MATERIALS.find((x) => x.group === e.target.value)
                    setForm({ ...form, material_group: e.target.value, ...(m?.rate != null ? { recycling_rate: m.rate } : {}) })
                  }}
                >
                  <option value="">—</option>
                  {EPR_MATERIALS.map((m) => (
                    <option key={m.group} value={m.group}>
                      {m.group}
                      {m.rate != null ? ` (R ${m.rate}%)` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Hình thức thực hiện">
                <Select value={form.method ?? 'dong_quy'} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  {Object.entries(PACKAGING_METHOD_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Số bao bán trong nước" required>
                <Input type="number" min={0} value={form.units_domestic ?? ''} onChange={(e) => setForm({ ...form, units_domestic: e.target.value })} />
              </Field>
              <Field label="Số bao xuất khẩu" hint="Loại trừ khỏi V">
                <Input type="number" min={0} value={form.units_export ?? ''} onChange={(e) => setForm({ ...form, units_export: e.target.value })} />
              </Field>
              <Field label="Khối lượng 01 bao (kg)" required>
                <Input type="number" min={0} step="0.001" value={form.unit_weight_kg ?? ''} onChange={(e) => setForm({ ...form, unit_weight_kg: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Tỷ lệ tái chế bắt buộc R (%)" required>
                <Input type="number" min={0} max={100} step="0.1" value={form.recycling_rate ?? ''} onChange={(e) => setForm({ ...form, recycling_rate: e.target.value })} />
              </Field>
              <Field label="Định mức Fs (đ/kg)">
                <Input type="number" min={0} value={form.fs_vnd_per_kg ?? ''} onChange={(e) => setForm({ ...form, fs_vnd_per_kg: e.target.value })} />
              </Field>
              {form.method !== 'dong_quy' && (
                <Field label="Đã tái chế có chứng từ (kg)" required>
                  <Input type="number" min={0} value={form.recycled_kg ?? ''} onChange={(e) => setForm({ ...form, recycled_kg: e.target.value })} />
                </Field>
              )}
            </div>
            {preview && (
              <div className="grid gap-2 rounded-lg bg-pine-800/[0.03] px-3 py-2 text-sm sm:grid-cols-3">
                <div>
                  <span className="text-pine-800/55">V = </span>
                  <b>{fmtNum(preview.V, 0)} kg</b>
                </div>
                <div>
                  <span className="text-pine-800/55">Phải tái chế = </span>
                  <b>{fmtNum(preview.obligationKg, 0)} kg</b>
                </div>
                <div>
                  <span className="text-pine-800/55">Phải nộp = </span>
                  <b>{vnd(preview.payable)}</b>
                </div>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Ngày kê khai">
                <Input type="date" value={form.declared_date ?? ''} onChange={(e) => setForm({ ...form, declared_date: e.target.value })} />
              </Field>
              <Field label="Ngày nộp Quỹ">
                <Input type="date" value={form.paid_date ?? ''} onChange={(e) => setForm({ ...form, paid_date: e.target.value })} />
              </Field>
              <Field label="Số tiền đã nộp (đ)">
                <Input type="number" min={0} value={form.paid_amount ?? ''} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} />
              </Field>
            </div>
            <Field label="Ghi chú">
              <Textarea rows={2} value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Số biên bản cân mẫu, nguồn số liệu xuất kho…" />
            </Field>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>

      <Modal
        open={!!declare}
        onClose={() => setDeclare(null)}
        title={`Ghi nhận kê khai, nộp – số liệu năm ${year}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeclare(null)}>
              Hủy
            </Button>
            <Button onClick={submitDeclare}>Ghi nhận</Button>
          </>
        }
      >
        {declare && (
          <div className="space-y-3">
            <p className="text-sm text-pine-800/70">
              Áp dụng cho {rows.length} loại bao bì năm {year} chưa ghi ngày. Phải nộp: <b>{vnd(tot.payable)}</b>.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ngày kê khai" required>
                <Input type="date" value={declare.declared_date} onChange={(e) => setDeclare({ ...declare, declared_date: e.target.value })} />
              </Field>
              <Field label="Ngày nộp Quỹ" hint="Để trống nếu chưa nộp">
                <Input type="date" value={declare.paid_date} onChange={(e) => setDeclare({ ...declare, paid_date: e.target.value })} />
              </Field>
            </div>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </div>
  )
}
