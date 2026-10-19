// Kiểm định máy, thiết bị có yêu cầu nghiêm ngặt về ATVSLĐ và kiểm tra, bảo dưỡng định kỳ
import { useQueryClient } from '@tanstack/react-query'
import { addMonths, format, parseISO } from 'date-fns'
import { ClipboardCheck, Download, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Kpi, Loading, Modal, Note, Select, Table, Td, Textarea } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import {
  EQUIPMENT_CATEGORY_LABELS,
  INSPECTION_KIND_LABELS,
  INSPECTION_STATE_TONE,
  inspectionLabel,
  inspectionState,
  STRICT_BASIS,
  type Equipment,
} from '../../lib/equipment'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtDate, todayISO } from '../../lib/utils'
import type { EquipmentData } from './useEquipmentData'

const ORDER = { qua_han: 0, chua_co: 1, sap_den: 2, con_han: 3, khong_ap_dung: 4 } as const

export default function InspectionsTab({ data, base, canEdit }: { data: EquipmentData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { facility } = useAuth()
  const { equipment, inspections, byId, loading } = data
  const [onlyStrict, setOnlyStrict] = useState(true)
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const rows = useMemo(
    () =>
      equipment
        .filter((e) => e.status !== 'thanh_ly')
        .filter((e) => (onlyStrict ? e.strict_safety : e.strict_safety || e.inspection_cycle_months || e.next_inspection))
        .map((e) => ({ e, s: inspectionState(e) }))
        .sort((a, b) => ORDER[a.s.state] - ORDER[b.s.state] || (a.e.next_inspection ?? '').localeCompare(b.e.next_inspection ?? '')),
    [equipment, onlyStrict]
  )

  const stats = useMemo(() => {
    const strict = equipment.filter((e) => e.strict_safety && e.status !== 'thanh_ly').map((e) => inspectionState(e))
    return {
      strict: strict.length,
      over: strict.filter((s) => s.state === 'qua_han').length,
      none: strict.filter((s) => s.state === 'chua_co').length,
      soon: strict.filter((s) => s.state === 'sap_den').length,
      ok: strict.filter((s) => s.state === 'con_han').length,
    }
  }, [equipment])

  const open = (e: Equipment) =>
    setForm({
      equipment_id: e.id,
      inspection_date: todayISO(),
      kind: e.strict_safety ? 'kiem_dinh' : 'kiem_tra',
      organization: e.inspection_org ?? '',
      result: 'dat',
      next_due: e.inspection_cycle_months ? format(addMonths(new Date(), e.inspection_cycle_months), 'yyyy-MM-dd') : '',
    })

  const submit = async () => {
    setErr('')
    const e = byId.get(form.equipment_id)
    if (!e) return setErr('Chọn thiết bị.')
    if (!form.inspection_date) return setErr('Nhập ngày kiểm định / kiểm tra.')
    if (form.result === 'dat' && !form.next_due) return setErr('Nhập hạn lần tiếp theo (theo giấy chứng nhận).')
    setBusy(true)
    try {
      const { error } = await supabase.from('equipment_inspections').insert({
        ...base,
        equipment_id: e.id,
        inspection_date: form.inspection_date,
        kind: form.kind || 'kiem_dinh',
        organization: form.organization?.trim() || null,
        certificate_no: form.certificate_no?.trim() || null,
        result: form.result || 'dat',
        next_due: form.next_due || null,
        note: form.note?.trim() || null,
      })
      if (error) throw error
      // kết quả mới nhất cập nhật hạn trên thiết bị; không đạt → ngừng sử dụng
      const latest = !e.last_inspection || form.inspection_date >= e.last_inspection
      if (latest) {
        const patch: Record<string, unknown> = { last_inspection: form.inspection_date, inspection_org: form.organization?.trim() || e.inspection_org }
        if (form.result === 'dat') patch.next_inspection = form.next_due
        else patch.status = 'ngung'
        const r = await supabase.from('equipment').update(patch).eq('id', e.id)
        if (r.error) throw r.error
      }
      await qc.invalidateQueries()
      setForm(null)
    } catch (x) {
      setErr(errMsg(x))
    } finally {
      setBusy(false)
    }
  }

  const removeRecord = async (id: string) => {
    if (!window.confirm('Xóa bản ghi kiểm định này? Hạn trên thiết bị không tự đổi lại.')) return
    const { error } = await supabase.from('equipment_inspections').delete().eq('id', id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const cols = ['STT', 'Tên máy, thiết bị', 'Mã', 'Nhóm', 'Số chế tạo', 'Năm SX', 'Vị trí / bộ phận', 'Ngày kiểm định gần nhất', 'Hạn kiểm định', 'Tổ chức kiểm định', 'Tình trạng']
      const sheet: any[][] = [
        [{ value: `DANH SÁCH MÁY, THIẾT BỊ CÓ YÊU CẦU NGHIÊM NGẶT VỀ ATVSLĐ · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        ['Phục vụ khai báo, theo dõi kiểm định (Luật ATVSLĐ 2015 Điều 30–31; TT 36/2019/TT-BLĐTBXH; NQ 66.18/2026/NQ-CP).'],
        [],
        cols.map(head),
        ...rows.map(({ e, s }, i) =>
          [
            i + 1, e.name, e.code ?? '', EQUIPMENT_CATEGORY_LABELS[e.category] ?? '', e.serial_no ?? '', e.year_made ?? '',
            [e.location, e.department].filter(Boolean).join(' – '), fmtDate(e.last_inspection), fmtDate(e.next_inspection), e.inspection_org ?? '', inspectionLabel(s),
          ].map((value) => ({ value }))
        ),
      ]
      const columns = [6, 34, 11, 24, 14, 8, 28, 14, 12, 26, 18].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`Thiet_bi_nghiem_ngat_${todayISO()}.xlsx`)
    } catch (x) {
      setErr(errMsg(x))
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      {err && !form && <ErrorNote message={err} />}
      <div className="flex flex-wrap gap-3">
        <Kpi label="Thiết bị nghiêm ngặt" value={stats.strict} tone="blue" />
        <Kpi label="Quá hạn kiểm định" value={stats.over} sub="dừng sử dụng, đăng ký kiểm định" tone={stats.over ? 'red' : 'green'} />
        <Kpi label="Chưa có kết quả" value={stats.none} tone={stats.none ? 'red' : 'gray'} />
        <Kpi label="Đến hạn trong 30 ngày" value={stats.soon} tone={stats.soon ? 'amber' : 'gray'} />
        <Kpi label="Còn hạn" value={stats.ok} tone="green" />
      </div>
      <Card>
        <CardHeader
          title="Lịch kiểm định, kiểm tra định kỳ"
          hint="Ghi kết quả theo giấy chứng nhận kiểm định; hạn mới tự cập nhật trên thiết bị"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-pine-800/60">
                <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={onlyStrict} onChange={(e) => setOnlyStrict(e.target.checked)} />
                Chỉ thiết bị nghiêm ngặt
              </label>
              <Button variant="outline" onClick={exportXlsx} disabled={rows.length === 0}>
                <Download size={15} /> Xuất danh sách
              </Button>
            </div>
          }
        />
        {rows.length === 0 ? (
          <EmptyState title="Chưa có thiết bị cần kiểm định" hint='Đánh dấu "Có yêu cầu nghiêm ngặt" ở danh mục thiết bị' />
        ) : (
          <Table head={['Thiết bị', 'Bộ phận', 'Kiểm định gần nhất', 'Hạn', 'Tình trạng', '']}>
            {rows.map(({ e, s }) => (
              <tr key={e.id}>
                <Td className="min-w-[220px]">
                  <div className="font-medium text-pine-800">{e.name}</div>
                  <div className="text-xs text-pine-800/50">
                    {[e.code, EQUIPMENT_CATEGORY_LABELS[e.category]].filter(Boolean).join(' · ')}
                  </div>
                </Td>
                <Td className="min-w-[140px] text-pine-800/70">{e.department ?? '—'}</Td>
                <Td className="whitespace-nowrap text-pine-800/70">
                  {fmtDate(e.last_inspection)}
                  {e.inspection_org && <div className="text-xs text-pine-800/45">{e.inspection_org}</div>}
                </Td>
                <Td className="whitespace-nowrap">{fmtDate(e.next_inspection)}</Td>
                <Td>
                  <Badge tone={INSPECTION_STATE_TONE[s.state]}>{inspectionLabel(s)}</Badge>
                </Td>
                <Td className="text-right">
                  {canEdit && (
                    <Button variant="outline" onClick={() => open(e)}>
                      <ClipboardCheck size={14} /> Ghi kết quả
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Lịch sử kiểm định, bảo dưỡng" hint="Mới nhất trước" />
        {inspections.length === 0 ? (
          <EmptyState title="Chưa có bản ghi" />
        ) : (
          <Table head={['Ngày', 'Thiết bị', 'Loại', 'Tổ chức / đơn vị', 'Số giấy chứng nhận', 'Kết quả', 'Hạn tiếp theo', '']}>
            {inspections.slice(0, 60).map((r) => (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{fmtDate(r.inspection_date)}</Td>
                <Td className="min-w-[200px]">{byId.get(r.equipment_id)?.name ?? '—'}</Td>
                <Td className="text-pine-800/70">{INSPECTION_KIND_LABELS[r.kind]}</Td>
                <Td className="text-pine-800/70">{r.organization ?? '—'}</Td>
                <Td className="text-pine-800/70">{r.certificate_no ?? '—'}</Td>
                <Td>
                  <Badge tone={r.result === 'dat' ? 'green' : 'red'}>{r.result === 'dat' ? 'Đạt' : 'Không đạt'}</Badge>
                </Td>
                <Td className="whitespace-nowrap">{fmtDate(r.next_due)}</Td>
                <Td className="text-right">
                  {canEdit && (
                    <Button variant="ghost" aria-label="Xóa bản ghi" onClick={() => removeRecord(r.id)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Note>{STRICT_BASIS}</Note>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={'Ghi kết quả: ' + (byId.get(form?.equipment_id)?.name ?? '')}
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={busy}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Loại">
              <Select value={form?.kind ?? 'kiem_dinh'} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {Object.entries(INSPECTION_KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ngày thực hiện" required>
              <Input type="date" value={form?.inspection_date ?? ''} onChange={(e) => setForm({ ...form, inspection_date: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tổ chức kiểm định / đơn vị">
              <Input value={form?.organization ?? ''} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
            </Field>
            <Field label="Số giấy chứng nhận / biên bản">
              <Input value={form?.certificate_no ?? ''} onChange={(e) => setForm({ ...form, certificate_no: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kết quả">
              <Select value={form?.result ?? 'dat'} onChange={(e) => setForm({ ...form, result: e.target.value })}>
                <option value="dat">Đạt</option>
                <option value="khong_dat">Không đạt</option>
              </Select>
            </Field>
            <Field label="Hạn lần tiếp theo" required={form?.result === 'dat'}>
              <Input
                type="date"
                value={form?.next_due ?? ''}
                onChange={(e) => setForm({ ...form, next_due: e.target.value })}
                min={form?.inspection_date ? format(parseISO(form.inspection_date), 'yyyy-MM-dd') : undefined}
              />
            </Field>
          </div>
          {form?.result === 'khong_dat' && (
            <Note tone="amber">
              Kết quả không đạt: thiết bị chuyển "Ngừng sử dụng". Sử dụng thiết bị đã kiểm định không đạt bị phạt 50–75 triệu (NĐ 283/2026 Điều 35 k5; tổ chức × 2). Lập phiếu sửa chữa rồi kiểm định lại.
            </Note>
          )}
          <Field label="Ghi chú">
            <Textarea rows={2} value={form?.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </div>
  )
}
