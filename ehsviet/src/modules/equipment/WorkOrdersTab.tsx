// Sự cố & sửa chữa thiết bị: danh sách phiếu, cảnh báo hạn hoàn thành, đơn vị sửa (Tổ Cơ điện / thuê ngoài)
import { useQueryClient } from '@tanstack/react-query'
import { Download, Leaf, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Input, Kpi, Loading, Select, Table, Td } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import {
  inspectionState,
  isOpenWo,
  isOverdueWo,
  MAINTAINER_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONE,
  repairDays,
  WO_STATUS_LABELS,
  WO_STATUS_TONE,
  woAlerts,
  woStep,
  type WorkOrder,
} from '../../lib/equipment'
import { supabase } from '../../lib/supabase'
import { cls, errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'
import { syncEquipmentStatus, type EquipmentData } from './useEquipmentData'
import WorkOrderModal, { newWorkOrder } from './WorkOrderModal'

const FILTERS: Record<string, string> = {
  open: 'Đang mở',
  overdue: 'Quá hạn sửa chữa',
  accept: 'Chờ nghiệm thu',
  done: 'Đã đưa vào vận hành',
  thanh_ly: 'Đã thanh lý',
  all: 'Tất cả',
}

export default function WorkOrdersTab({ data, base, canEdit }: { data: EquipmentData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { facility } = useAuth()
  const { equipment, workOrders, byId, departments, loading } = data
  const [filter, setFilter] = useState('open')
  const [assignee, setAssignee] = useState('')
  const [dept, setDept] = useState('')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<Record<string, any> | null>(null)
  const [err, setErr] = useState('')

  const stats = useMemo(() => {
    const open = workOrders.filter(isOpenWo)
    const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
    const done12 = workOrders.filter((w) => w.status === 'hoan_thanh' && (w.outcome_date ?? w.report_date) >= yearAgo)
    const days = done12.map(repairDays).filter((x): x is number => x != null)
    const strict = equipment.filter((e) => e.strict_safety && e.status !== 'thanh_ly')
    const inspBad = strict.filter((e) => ['qua_han', 'chua_co'].includes(inspectionState(e).state)).length
    const inspSoon = strict.filter((e) => inspectionState(e).state === 'sap_den').length
    return {
      open: open.length,
      outsourced: open.filter((w) => w.assignee === 'thue_ngoai').length,
      overdue: open.filter((w) => isOverdueWo(w)).length,
      accept: open.filter((w) => w.status === 'cho_nghiem_thu').length,
      acceptLate: open.filter((w) => w.status === 'cho_nghiem_thu' && woAlerts(w).length > 0).length,
      env: open.filter((w) => w.env_impact).length,
      safety: open.filter((w) => w.safety_impact).length,
      mttr: days.length ? days.reduce((s, x) => s + x, 0) / days.length : null,
      done12: done12.length,
      inspBad,
      inspSoon,
    }
  }, [workOrders, equipment])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    return workOrders
      .filter((w) => {
        if (filter === 'open') return isOpenWo(w)
        if (filter === 'overdue') return isOverdueWo(w)
        if (filter === 'accept') return w.status === 'cho_nghiem_thu'
        if (filter === 'done') return w.status === 'hoan_thanh'
        if (filter === 'thanh_ly') return w.status === 'thanh_ly'
        return true
      })
      .filter((w) => !assignee || w.assignee === assignee)
      .filter((w) => !dept || byId.get(w.equipment_id)?.department === dept)
      .filter((w) => {
        if (!s) return true
        const e = byId.get(w.equipment_id)
        return [e?.name, e?.code, w.description, w.report_no, w.contractor_name].some((x) => (x ?? '').toLowerCase().includes(s))
      })
      .sort((a, b) => {
        // quá hạn trước, rồi theo hạn hoàn thành, rồi ngày lập mới nhất
        const oa = isOverdueWo(a) ? 0 : 1
        const ob = isOverdueWo(b) ? 0 : 1
        if (oa !== ob) return oa - ob
        if (isOpenWo(a) && isOpenWo(b)) return (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')
        return b.report_date.localeCompare(a.report_date)
      })
  }, [workOrders, filter, assignee, dept, q, byId])

  const remove = async (w: WorkOrder) => {
    if (!window.confirm('Xóa phiếu sửa chữa này?')) return
    setErr('')
    const { error } = await supabase.from('equipment_work_orders').delete().eq('id', w.id)
    if (error) return setErr(errMsg(error))
    try {
      await syncEquipmentStatus(w.equipment_id)
    } catch (e) {
      setErr(errMsg(e))
    }
    await qc.invalidateQueries()
  }

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const cols = [
        'Mã TB', 'Thiết bị', 'Bộ phận', 'Số BB hư hỏng', 'Ngày lập', 'Hiện tượng hư hỏng', 'Nguyên nhân', 'Ưu tiên', 'Ảnh hưởng BVMT', 'Nguy cơ an toàn',
        'Đơn vị sửa', 'Đơn vị thuê ngoài', 'Hạn hoàn thành', 'Bắt đầu', 'Hoàn thành sửa', 'Nội dung sửa chữa', 'Chi phí (đ)', 'Ngày nghiệm thu', 'Số BB nghiệm thu',
        'An toàn', 'Kết quả', 'Ngày', 'Số lệnh / QĐ', 'Trạng thái', 'Cảnh báo',
      ]
      const sheet: any[][] = [
        [{ value: `SỔ THEO DÕI HƯ HỎNG – SỬA CHỮA THIẾT BỊ · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        [`Xuất ngày ${fmtDate(todayISO())}`],
        [],
        cols.map(head),
        ...rows.map((w) => {
          const e = byId.get(w.equipment_id)
          return [
            e?.code ?? '', e?.name ?? '', e?.department ?? '', w.report_no ?? '', fmtDate(w.report_date), w.description, w.cause ?? '', PRIORITY_LABELS[w.priority] ?? '',
            w.env_impact ? 'Có' : '', w.safety_impact ? 'Có' : '', MAINTAINER_LABELS[w.assignee] ?? '', w.contractor_name ?? '', fmtDate(w.due_date), fmtDate(w.repair_start_date),
            fmtDate(w.repair_done_date), w.repair_content ?? '', w.cost ?? '', fmtDate(w.acceptance_date), w.acceptance_no ?? '',
            w.safety_result === 'dat' ? 'Đạt' : w.safety_result === 'khong_dat' ? 'Không đạt' : '',
            w.outcome === 'van_hanh' ? 'Đưa vào vận hành' : w.outcome === 'thanh_ly' ? 'Thanh lý' : '', fmtDate(w.outcome_date), w.outcome_no ?? '',
            WO_STATUS_LABELS[w.status], woAlerts(w).map((a) => a.label).join('; '),
          ].map((value) => ({ value }))
        }),
      ]
      const columns = [10, 30, 22, 14, 11, 36, 24, 10, 10, 10, 12, 24, 11, 11, 11, 32, 12, 11, 14, 10, 16, 11, 16, 18, 26].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`So_sua_chua_thiet_bi_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      {err && <ErrorNote message={err} />}
      <div className="flex flex-wrap gap-3">
        <Kpi label="Đang hư hỏng / sửa chữa" value={stats.open} sub={`${stats.outsourced} phiếu thuê ngoài`} tone={stats.open ? 'amber' : 'green'} />
        <Kpi label="Quá hạn sửa chữa" value={stats.overdue} sub="theo hạn hoàn thành" tone={stats.overdue ? 'red' : 'green'} />
        <Kpi label="Chờ nghiệm thu" value={stats.accept} sub={stats.acceptLate ? `${stats.acceptLate} phiếu chờ quá 03 ngày` : 'đã sửa xong'} tone={stats.acceptLate ? 'amber' : 'blue'} />
        <Kpi label="Ảnh hưởng BVMT / an toàn" value={`${stats.env} / ${stats.safety}`} sub="phiếu đang mở" tone={stats.env ? 'amber' : 'gray'} />
        <Kpi
          label="Thiết bị nghiêm ngặt"
          value={stats.inspBad}
          sub={`quá hạn / chưa kiểm định · ${stats.inspSoon} sắp đến hạn`}
          tone={stats.inspBad ? 'red' : stats.inspSoon ? 'amber' : 'green'}
        />
        <Kpi label="Thời gian sửa trung bình" value={stats.mttr == null ? '—' : fmtNum(stats.mttr, 1) + ' ngày'} sub={`${stats.done12} phiếu hoàn thành 12 tháng`} />
      </div>

      <Card>
        <CardHeader
          title="Sự cố & sửa chữa thiết bị"
          hint="Biên bản hư hỏng → sửa chữa → nghiệm thu an toàn → đưa vào vận hành hoặc thanh lý"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportXlsx} disabled={rows.length === 0}>
                <Download size={15} /> Xuất Excel
              </Button>
              {canEdit && (
                <Button onClick={() => setEdit(newWorkOrder())} disabled={equipment.length === 0}>
                  <Plus size={15} /> Lập biên bản hư hỏng
                </Button>
              )}
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[200px]" aria-label="Lọc trạng thái">
            {Object.entries(FILTERS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="max-w-[170px]" aria-label="Đơn vị sửa">
            <option value="">Mọi đơn vị sửa</option>
            {Object.entries(MAINTAINER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-[220px]" aria-label="Bộ phận">
            <option value="">Tất cả bộ phận</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm thiết bị, số biên bản…" className="max-w-[220px]" />
          <span className="ml-auto text-xs text-pine-800/50">{rows.length} phiếu</span>
        </div>
        {rows.length === 0 ? (
          <EmptyState title={workOrders.length ? 'Không có phiếu phù hợp bộ lọc' : 'Chưa có biên bản hư hỏng'} hint={equipment.length ? undefined : 'Thêm thiết bị ở thẻ "Danh mục thiết bị" trước'} />
        ) : (
          <Table head={['Thiết bị', 'Biên bản hư hỏng', 'Đơn vị sửa', 'Hạn hoàn thành', 'Tiến trình', '']}>
            {rows.map((w) => {
              const e = byId.get(w.equipment_id)
              const alerts = woAlerts(w)
              const step = woStep(w)
              return (
                <tr key={w.id} className="align-top">
                  <Td className="min-w-[170px]">
                    <div className="font-medium text-pine-800">{e?.name ?? '—'}</div>
                    <div className="text-xs text-pine-800/50">
                      {[e?.code, e?.department].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </Td>
                  <Td className="min-w-[210px]">
                    <div className="line-clamp-2 text-sm text-pine-800">{w.description}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-pine-800/50">
                      <span>
                        {w.report_no ? w.report_no + ' · ' : ''}
                        {fmtDate(w.report_date)}
                      </span>
                      <Badge tone={PRIORITY_TONE[w.priority] ?? 'gray'}>{PRIORITY_LABELS[w.priority]}</Badge>
                      {w.env_impact && (
                        <span title="Ảnh hưởng công trình BVMT" className="inline-flex items-center text-viridian-700">
                          <Leaf size={13} />
                        </span>
                      )}
                      {w.safety_impact && (
                        <span title="Nguy cơ mất an toàn" className="inline-flex items-center text-red-600">
                          <ShieldAlert size={13} />
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td className="min-w-[110px]">
                    <div className="text-sm text-pine-800">{MAINTAINER_LABELS[w.assignee]}</div>
                    {w.contractor_name && <div className="text-xs text-pine-800/50">{w.contractor_name}</div>}
                  </Td>
                  <Td className="min-w-[115px] whitespace-nowrap">
                    <div className="text-sm text-pine-800">{fmtDate(w.due_date)}</div>
                    <div className="mt-1 flex flex-col items-start gap-1">
                      {alerts.map((a) => (
                        <Badge key={a.label} tone={a.tone}>
                          {a.label}
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <Td className="min-w-[130px]">
                    <div className="mb-1 flex gap-1" aria-hidden>
                      {[1, 2, 3, 4].map((n) => (
                        <span
                          key={n}
                          className={cls(
                            'h-1.5 w-6 rounded-full',
                            n < step || w.status === 'hoan_thanh' || (w.status === 'thanh_ly' && n <= 4)
                              ? w.status === 'thanh_ly'
                                ? 'bg-pine-800/40'
                                : 'bg-viridian-600'
                              : n === step
                                ? 'bg-amber-500'
                                : 'bg-pine-800/10'
                          )}
                        />
                      ))}
                    </div>
                    <Badge tone={WO_STATUS_TONE[w.status]}>{WO_STATUS_LABELS[w.status]}</Badge>
                    {w.safety_result === 'khong_dat' && w.status === 'dang_sua' && <div className="mt-1 text-[11px] text-red-700">Nghiệm thu không đạt</div>}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant={canEdit && isOpenWo(w) ? 'primary' : 'outline'} onClick={() => setEdit({ ...w })}>
                        {canEdit && isOpenWo(w) ? 'Cập nhật' : 'Xem'}
                      </Button>
                      {canEdit && (
                        <Button variant="ghost" aria-label="Xóa phiếu" onClick={() => remove(w)}>
                          <Trash2 size={15} />
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              )
            })}
          </Table>
        )}
      </Card>

      <WorkOrderModal open={!!edit} onClose={() => setEdit(null)} base={base} equipment={equipment} initial={edit} canEdit={canEdit} />
    </div>
  )
}
