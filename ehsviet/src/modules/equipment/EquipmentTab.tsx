// Danh mục thiết bị: nhóm, bộ phận quản lý, đơn vị bảo trì, thiết bị nghiêm ngặt, hạn kiểm định, trạng thái thực tế
import { useQueryClient } from '@tanstack/react-query'
import { addMonths, format, parseISO } from 'date-fns'
import { Download, Pencil, Plus, Trash2, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Kpi, Loading, Modal, Note, Select, Table, Td, Textarea } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import {
  EQUIPMENT_CATEGORY_LABELS,
  INSPECTION_STATE_TONE,
  inspectionLabel,
  inspectionState,
  MACHINE_STATUS_LABELS,
  MACHINE_STATUS_TONE,
  MAINTAINER_LABELS,
  STRICT_BASIS,
  STRICT_PRESETS,
  type Equipment,
} from '../../lib/equipment'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtDate, todayISO } from '../../lib/utils'
import { DepartmentInput } from '../personnel/shared'
import type { EquipmentData } from './useEquipmentData'
import WorkOrderModal, { newWorkOrder } from './WorkOrderModal'

const nextDue = (last?: string | null, months?: number | string | null) =>
  last && months && Number(months) > 0 ? format(addMonths(parseISO(last), Number(months)), 'yyyy-MM-dd') : ''

export default function EquipmentTab({ data, base, canEdit }: { data: EquipmentData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { facility } = useAuth()
  const { equipment, status, openBy, departments, loading } = data
  const [cat, setCat] = useState('')
  const [st, setSt] = useState('')
  const [q, setQ] = useState('')
  const [form, setForm] = useState<any>(null)
  const [report, setReport] = useState<Record<string, any> | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const stats = useMemo(() => {
    const live = equipment.filter((e) => status.get(e.id) !== 'thanh_ly')
    return {
      total: live.length,
      running: live.filter((e) => status.get(e.id) === 'van_hanh').length,
      broken: live.filter((e) => ['hu_hong', 'sua_chua', 'cho_nghiem_thu'].includes(status.get(e.id) ?? '')).length,
      strict: live.filter((e) => e.strict_safety).length,
      env: live.filter((e) => e.category === 'moi_truong').length,
      retired: equipment.length - live.length,
    }
  }, [equipment, status])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return equipment
      .filter((e) => !cat || e.category === cat)
      .filter((e) => !st || status.get(e.id) === st)
      .filter((e) => !s || [e.name, e.code, e.department, e.location, e.model].some((x) => (x ?? '').toLowerCase().includes(s)))
      .sort((a, b) => (a.department ?? '').localeCompare(b.department ?? '', 'vi') || (a.code ?? '').localeCompare(b.code ?? '', 'vi'))
  }, [equipment, cat, st, q, status])

  const submit = async () => {
    setErr('')
    if (!form.name?.trim()) return setErr('Nhập tên thiết bị.')
    const code = form.code?.trim() || null
    if (code && equipment.some((e) => e.id !== form.id && (e.code ?? '').toLowerCase() === code.toLowerCase())) return setErr(`Mã thiết bị "${code}" đã có.`)
    setBusy(true)
    try {
      const payload = {
        code,
        name: form.name.trim(),
        category: form.category || 'san_xuat',
        strict_safety: !!form.strict_safety,
        department: form.department?.trim() || null,
        location: form.location?.trim() || null,
        manufacturer: form.manufacturer?.trim() || null,
        model: form.model?.trim() || null,
        serial_no: form.serial_no?.trim() || null,
        year_made: form.year_made ? Number(form.year_made) : null,
        commissioned_date: form.commissioned_date || null,
        inspection_cycle_months: form.inspection_cycle_months ? Number(form.inspection_cycle_months) : null,
        last_inspection: form.last_inspection || null,
        next_inspection: form.next_inspection || nextDue(form.last_inspection, form.inspection_cycle_months) || null,
        inspection_org: form.inspection_org?.trim() || null,
        maintainer: form.maintainer || 'to_co_dien',
        status: form.status || 'van_hanh',
        note: form.note?.trim() || null,
      }
      const { error } = form.id
        ? await supabase.from('equipment').update(payload).eq('id', form.id)
        : await supabase.from('equipment').insert({ ...base, ...payload })
      if (error) throw error
      await qc.invalidateQueries()
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (e: Equipment) => {
    if (!window.confirm(`Xóa ${e.name} cùng toàn bộ phiếu sửa chữa, kiểm định? Thiết bị đã thanh lý nên giữ lại để tra cứu.`)) return
    const { error } = await supabase.from('equipment').delete().eq('id', e.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const cols = ['Mã', 'Tên thiết bị', 'Nhóm', 'Nghiêm ngặt ATVSLĐ', 'Bộ phận', 'Vị trí', 'Hãng / model', 'Số chế tạo', 'Năm SX', 'Đơn vị bảo trì', 'Chu kỳ KĐ (tháng)', 'KĐ gần nhất', 'Hạn KĐ', 'Tổ chức KĐ', 'Trạng thái']
      const sheet: any[][] = [
        [{ value: `DANH MỤC THIẾT BỊ · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        [`Xuất ngày ${fmtDate(todayISO())}`],
        [],
        cols.map(head),
        ...rows.map((e) =>
          [
            e.code ?? '', e.name, EQUIPMENT_CATEGORY_LABELS[e.category] ?? e.category, e.strict_safety ? 'Có' : '', e.department ?? '', e.location ?? '',
            [e.manufacturer, e.model].filter(Boolean).join(' / '), e.serial_no ?? '', e.year_made ?? '', MAINTAINER_LABELS[e.maintainer] ?? '',
            e.inspection_cycle_months ?? '', fmtDate(e.last_inspection), fmtDate(e.next_inspection), e.inspection_org ?? '', MACHINE_STATUS_LABELS[status.get(e.id) ?? e.status] ?? '',
          ].map((value) => ({ value }))
        ),
      ]
      const columns = [11, 34, 26, 11, 22, 18, 20, 14, 8, 12, 10, 12, 12, 24, 16].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`Danh_muc_thiet_bi_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      {err && !form && <ErrorNote message={err} />}
      <div className="flex flex-wrap gap-3">
        <Kpi label="Thiết bị đang quản lý" value={stats.total} sub={`${stats.retired} đã thanh lý`} tone="blue" />
        <Kpi label="Đang vận hành" value={stats.running} tone="green" />
        <Kpi label="Hư hỏng / sửa chữa" value={stats.broken} tone={stats.broken ? 'amber' : 'green'} />
        <Kpi label="Nghiêm ngặt ATVSLĐ" value={stats.strict} sub="phải kiểm định" />
        <Kpi label="Công trình, thiết bị BVMT" value={stats.env} />
      </div>
      <Card>
        <CardHeader
          title="Danh mục thiết bị"
          hint="Thiết bị sản xuất, công trình BVMT, thiết bị nghiêm ngặt, PCCC; đơn vị bảo trì mặc định"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportXlsx} disabled={rows.length === 0}>
                <Download size={15} /> Xuất Excel
              </Button>
              {canEdit && (
                <Button onClick={() => setForm({ category: 'san_xuat', maintainer: 'to_co_dien', status: 'van_hanh' })}>
                  <Plus size={15} /> Thêm thiết bị
                </Button>
              )}
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, tên, bộ phận…" className="max-w-[220px]" />
          <Select value={cat} onChange={(e) => setCat(e.target.value)} className="max-w-[240px]" aria-label="Nhóm thiết bị">
            <option value="">Tất cả nhóm</option>
            {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select value={st} onChange={(e) => setSt(e.target.value)} className="max-w-[200px]" aria-label="Trạng thái">
            <option value="">Mọi trạng thái</option>
            {Object.entries(MACHINE_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-xs text-pine-800/50">{rows.length} thiết bị</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState title={equipment.length ? 'Không có thiết bị phù hợp bộ lọc' : 'Chưa có thiết bị'} hint="Bắt đầu từ thiết bị nghiêm ngặt và công trình BVMT" />
        ) : (
          <Table head={['Thiết bị', 'Nhóm', 'Bộ phận', 'Bảo trì', 'Kiểm định', 'Trạng thái', '']}>
            {rows.map((e) => {
              const s = status.get(e.id) ?? e.status
              const insp = inspectionState(e)
              const open = openBy.get(e.id)?.length ?? 0
              return (
                <tr key={e.id}>
                  <Td className="min-w-[210px]">
                    <div className="font-medium text-pine-800">{e.name}</div>
                    <div className="text-xs text-pine-800/50">
                      {[e.code, e.model, e.serial_no].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </Td>
                  <Td className="min-w-[150px] text-pine-800/70">
                    {EQUIPMENT_CATEGORY_LABELS[e.category] ?? e.category}
                    {e.strict_safety && (
                      <div className="mt-1">
                        <Badge tone="red">Nghiêm ngặt</Badge>
                      </div>
                    )}
                  </Td>
                  <Td className="min-w-[150px] text-pine-800/70">
                    {e.department ?? '—'}
                    {e.location && <div className="text-xs text-pine-800/45">{e.location}</div>}
                  </Td>
                  <Td className="whitespace-nowrap text-pine-800/70">{MAINTAINER_LABELS[e.maintainer]}</Td>
                  <Td className="min-w-[130px]">
                    {insp.state === 'khong_ap_dung' ? (
                      <span className="text-pine-800/35">—</span>
                    ) : (
                      <>
                        <Badge tone={INSPECTION_STATE_TONE[insp.state]}>{inspectionLabel(insp)}</Badge>
                        {e.next_inspection && <div className="mt-1 text-xs text-pine-800/50">Hạn {fmtDate(e.next_inspection)}</div>}
                      </>
                    )}
                  </Td>
                  <Td className="min-w-[130px]">
                    <Badge tone={MACHINE_STATUS_TONE[s] ?? 'gray'}>{MACHINE_STATUS_LABELS[s] ?? s}</Badge>
                    {open > 0 && <div className="mt-1 text-xs text-pine-800/50">{open} phiếu đang mở</div>}
                  </Td>
                  <Td className="text-right">
                    {canEdit && (
                      <div className="flex justify-end gap-1">
                        {s !== 'thanh_ly' && (
                          <Button variant="outline" onClick={() => setReport(newWorkOrder(e))}>
                            <Wrench size={14} /> Báo hỏng
                          </Button>
                        )}
                        <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...e })}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" aria-label="Xóa" onClick={() => remove(e)}>
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

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa thiết bị' : 'Thêm thiết bị'}
        wide
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
          {!form?.id && (
            <Field label="Mẫu thiết bị nghiêm ngặt (TT 36/2019/TT-BLĐTBXH)">
              <Select
                value=""
                onChange={(e) => {
                  const p = STRICT_PRESETS.find((x) => x.name === e.target.value)
                  if (p) setForm({ ...form, name: form.name || p.name, category: p.category, strict_safety: true, inspection_cycle_months: p.cycle })
                }}
              >
                <option value="">— Chọn để điền nhanh —</option>
                {STRICT_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} (gợi ý {p.cycle} tháng)
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Mã thiết bị">
              <Input value={form?.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="TB-XN-01" />
            </Field>
            <Field label="Tên thiết bị" required className="sm:col-span-2">
              <Input value={form?.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nhóm">
              <Select value={form?.category ?? 'san_xuat'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Bộ phận quản lý, sử dụng">
              <DepartmentInput value={form?.department ?? ''} onChange={(v) => setForm({ ...form, department: v })} departments={departments} />
            </Field>
            <Field label="Vị trí lắp đặt">
              <Input value={form?.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Hãng sản xuất">
              <Input value={form?.manufacturer ?? ''} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
            </Field>
            <Field label="Model">
              <Input value={form?.model ?? ''} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </Field>
            <Field label="Số chế tạo">
              <Input value={form?.serial_no ?? ''} onChange={(e) => setForm({ ...form, serial_no: e.target.value })} />
            </Field>
            <Field label="Năm sản xuất">
              <Input type="number" value={form?.year_made ?? ''} onChange={(e) => setForm({ ...form, year_made: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Đơn vị bảo trì mặc định">
              <Select value={form?.maintainer ?? 'to_co_dien'} onChange={(e) => setForm({ ...form, maintainer: e.target.value })}>
                {Object.entries(MAINTAINER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ngày đưa vào sử dụng">
              <Input type="date" value={form?.commissioned_date ?? ''} onChange={(e) => setForm({ ...form, commissioned_date: e.target.value })} />
            </Field>
            <Field label="Trạng thái">
              <Select value={form?.status ?? 'van_hanh'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['van_hanh', 'ngung', 'thanh_ly'].map((k) => (
                  <option key={k} value={k}>
                    {MACHINE_STATUS_LABELS[k]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-pine-800">
            <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={!!form?.strict_safety} onChange={(e) => setForm({ ...form, strict_safety: e.target.checked })} />
            Có yêu cầu nghiêm ngặt về ATVSLĐ – phải kiểm định
          </label>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Chu kỳ kiểm định / kiểm tra (tháng)">
              <Input type="number" min={1} value={form?.inspection_cycle_months ?? ''} onChange={(e) => setForm({ ...form, inspection_cycle_months: e.target.value })} />
            </Field>
            <Field label="Lần gần nhất">
              <Input type="date" value={form?.last_inspection ?? ''} onChange={(e) => setForm({ ...form, last_inspection: e.target.value })} />
            </Field>
            <Field label="Hạn tiếp theo">
              <Input
                type="date"
                value={form?.next_inspection ?? ''}
                onChange={(e) => setForm({ ...form, next_inspection: e.target.value })}
                placeholder={nextDue(form?.last_inspection, form?.inspection_cycle_months)}
              />
            </Field>
            <Field label="Tổ chức kiểm định">
              <Input value={form?.inspection_org ?? ''} onChange={(e) => setForm({ ...form, inspection_org: e.target.value })} />
            </Field>
          </div>
          {form?.strict_safety && <Note>{STRICT_BASIS} Hạn kiểm định ghi theo giấy chứng nhận; để trống "Hạn tiếp theo" thì phần mềm tính theo chu kỳ.</Note>}
          <Field label="Ghi chú">
            <Textarea rows={2} value={form?.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>

      <WorkOrderModal open={!!report} onClose={() => setReport(null)} base={base} equipment={equipment} initial={report} canEdit={canEdit} />
    </div>
  )
}
