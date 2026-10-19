// Hành động khắc phục – phòng ngừa (CAPA) tập trung – bước A của PDCA (ISO 14001:2015 / ISO 45001:2018 điều 10.2)
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Kpi, Loading, Modal, Note, Select, Table, Td, Textarea } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { useList } from '../../hooks/useCrud'
import { CAPA_KIND_LABELS, CAPA_SOURCE_LABELS, CAPA_STATE_LABELS, CAPA_STATE_TONE, capaState, type CapaAction, type CapaState } from '../../lib/capa'
import { CAPA_STATUS_LABELS } from '../../lib/constants'
import { isOpenWo, isOverdueWo, type WorkOrder } from '../../lib/equipment'
import { supabase } from '../../lib/supabase'
import { daysUntil, errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'
import { DepartmentInput } from '../personnel/shared'

const VIEWS: Record<string, string> = {
  open: 'Đang mở',
  qua_han: 'Quá hạn',
  cho_xac_nhan: 'Chờ xác nhận hiệu lực',
  chua_hieu_luc: 'Chưa hiệu lực – làm lại',
  hieu_luc: 'Đã xác nhận hiệu lực',
  all: 'Tất cả',
}

const OPEN_STATES: CapaState[] = ['moi', 'dang_lam', 'qua_han', 'chua_hieu_luc']

export default function ActionsPage() {
  const qc = useQueryClient()
  const { profile, facilityId, facility, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const on = !!fid
  const capa = useList<CapaAction>('capa_actions', { match: { facility_id: fid }, order: 'created_at', ascending: false, enabled: on })
  const violations = useList<any>('rule_violations', { match: { facility_id: fid }, order: 'violation_date', enabled: on })
  const orders = useList<WorkOrder>('equipment_work_orders', { match: { facility_id: fid }, order: 'report_date', enabled: on })
  const [view, setView] = useState('open')
  const [source, setSource] = useState('')
  const [dept, setDept] = useState('')
  const [q, setQ] = useState('')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const list = useMemo(() => (capa.data ?? []).map((a) => ({ a, s: capaState(a) })), [capa.data])
  const departments = useMemo(
    () => [...new Set(list.map(({ a }) => a.department).filter((d): d is string => !!d))].sort((a, b) => a.localeCompare(b, 'vi')),
    [list]
  )

  const stats = useMemo(() => {
    const done = list.filter(({ a }) => a.status === 'done')
    const verified = done.filter(({ a }) => a.verified_date)
    // thời gian đóng = ngày hoàn thành − ngày tạo
    const durations = done
      .filter(({ a }) => a.completed_date)
      .map(({ a }) => (new Date(a.completed_date! + 'T00:00:00').getTime() - new Date(a.created_at.slice(0, 10) + 'T00:00:00').getTime()) / 86400000)
      .filter((x) => x >= 0)
    return {
      open: list.filter(({ s }) => OPEN_STATES.includes(s)).length,
      overdue: list.filter(({ s }) => s === 'qua_han').length,
      pending: list.filter(({ s }) => s === 'cho_xac_nhan').length,
      redo: list.filter(({ s }) => s === 'chua_hieu_luc').length,
      effectivePct: verified.length ? Math.round((verified.filter(({ a }) => a.effective).length / verified.length) * 100) : null,
      verified: verified.length,
      avgClose: durations.length ? durations.reduce((s, x) => s + x, 0) / durations.length : null,
    }
  }, [list])

  const elsewhere = useMemo(() => {
    const v = (violations.data ?? []).filter((x: any) => x.status !== 'closed')
    const w = (orders.data ?? []).filter(isOpenWo)
    return {
      violations: v.length,
      violationsOverdue: v.filter((x: any) => x.due_date && daysUntil(x.due_date) < 0).length,
      orders: w.length,
      ordersOverdue: w.filter((x) => isOverdueWo(x)).length,
    }
  }, [violations.data, orders.data])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    const rank: Record<CapaState, number> = { qua_han: 0, chua_hieu_luc: 1, moi: 2, dang_lam: 3, cho_xac_nhan: 4, hieu_luc: 5 }
    return list
      .filter(({ s: st }) => (view === 'all' ? true : view === 'open' ? OPEN_STATES.includes(st) : st === view))
      .filter(({ a }) => !source || a.source === source)
      .filter(({ a }) => !dept || a.department === dept)
      .filter(({ a }) => !s || [a.action, a.source_label, a.owner, a.department].some((x) => (x ?? '').toLowerCase().includes(s)))
      .sort((x, y) => rank[x.s] - rank[y.s] || (x.a.due_date ?? '9999').localeCompare(y.a.due_date ?? '9999'))
  }, [list, view, source, dept, q])

  const save = async (values: Record<string, any>) => {
    const { error } = values.id
      ? await supabase.from('capa_actions').update(values).eq('id', values.id)
      : await supabase.from('capa_actions').insert({ ...base, ...values })
    if (error) throw error
    await qc.invalidateQueries()
  }

  const submit = async () => {
    setErr('')
    if (!form.action?.trim()) return setErr('Nhập nội dung hành động.')
    if (!form.due_date) return setErr('Nhập hạn hoàn thành.')
    if (form.status === 'done' && !form.completed_date) form.completed_date = todayISO()
    if (form.verified_date && form.effective == null) return setErr('Chọn kết quả xác nhận hiệu lực.')
    if (form.verified_date && form.status !== 'done') return setErr('Chỉ xác nhận hiệu lực khi hành động đã hoàn thành.')
    setBusy(true)
    try {
      await save({
        ...(form.id ? { id: form.id } : {}),
        action: form.action.trim(),
        kind: form.kind || 'khac_phuc',
        source: form.source || 'khac',
        source_label: form.source_label?.trim() || null,
        root_cause: form.root_cause?.trim() || null,
        department: form.department?.trim() || null,
        owner: form.owner?.trim() || null,
        due_date: form.due_date,
        status: form.status || 'open',
        completed_date: form.status === 'done' ? form.completed_date : null,
        verified_date: form.status === 'done' ? form.verified_date || null : null,
        verified_by: form.status === 'done' ? form.verified_by?.trim() || null : null,
        effective: form.status === 'done' && form.verified_date ? form.effective : null,
        note: form.note?.trim() || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const complete = async (a: CapaAction) => {
    setErr('')
    try {
      await save({ id: a.id, status: 'done', completed_date: todayISO() })
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const remove = async (a: CapaAction) => {
    if (!window.confirm('Xóa hành động này?')) return
    const { error } = await supabase.from('capa_actions').delete().eq('id', a.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const cols = ['STT', 'Nguồn', 'Mô tả nguồn', 'Nguyên nhân', 'Hành động', 'Loại', 'Đơn vị', 'Người phụ trách', 'Hạn', 'Hoàn thành', 'Xác nhận hiệu lực', 'Người xác nhận', 'Kết quả', 'Trạng thái']
      const sheet: any[][] = [
        [{ value: `SỔ THEO DÕI HÀNH ĐỘNG KHẮC PHỤC – PHÒNG NGỪA · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        [`ISO 14001:2015 / ISO 45001:2018 điều 10.2 · xuất ngày ${fmtDate(todayISO())}`],
        [],
        cols.map(head),
        ...rows.map(({ a, s }, i) =>
          [
            i + 1, CAPA_SOURCE_LABELS[a.source] ?? a.source, a.source_label ?? '', a.root_cause ?? '', a.action, CAPA_KIND_LABELS[a.kind] ?? '', a.department ?? '', a.owner ?? '',
            fmtDate(a.due_date), fmtDate(a.completed_date), fmtDate(a.verified_date), a.verified_by ?? '',
            a.effective == null ? '' : a.effective ? 'Có hiệu lực' : 'Chưa hiệu lực', CAPA_STATE_LABELS[s],
          ].map((value) => ({ value }))
        ),
      ]
      const columns = [6, 16, 36, 26, 40, 11, 22, 18, 11, 11, 12, 18, 13, 20].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`Hanh_dong_khac_phuc_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const loading = capa.isLoading

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Hành động khắc phục – phòng ngừa</h1>
        <p className="text-sm text-pine-800/50">
          Bước A của PDCA: mọi tồn tại từ kiểm tra, sự cố, thiết bị, QTMTLĐ, đánh giá đều có người, hạn và được xác nhận hiệu lực
        </p>
      </div>
      {err && !form && <ErrorNote message={err} />}
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <Kpi label="Đang mở" value={stats.open} tone={stats.open ? 'blue' : 'green'} />
            <Kpi label="Quá hạn" value={stats.overdue} tone={stats.overdue ? 'red' : 'green'} />
            <Kpi label="Chờ xác nhận hiệu lực" value={stats.pending} sub="đã hoàn thành" tone={stats.pending ? 'amber' : 'gray'} />
            <Kpi
              label="Có hiệu lực"
              value={stats.effectivePct == null ? '—' : stats.effectivePct + '%'}
              sub={`${stats.verified} hành động đã xác nhận${stats.redo ? ` · ${stats.redo} phải làm lại` : ''}`}
              tone={stats.redo ? 'amber' : 'green'}
            />
            <Kpi label="Thời gian đóng trung bình" value={stats.avgClose == null ? '—' : fmtNum(stats.avgClose, 1) + ' ngày'} />
          </div>

          <Card>
            <CardHeader
              title="Danh sách hành động"
              hint="Ưu tiên: quá hạn → chưa hiệu lực → chưa thực hiện → đang thực hiện → chờ xác nhận"
              action={
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={exportXlsx} disabled={rows.length === 0}>
                    <Download size={15} /> Xuất Excel
                  </Button>
                  {canEdit && (
                    <Button onClick={() => setForm({ source: 'khac', kind: 'khac_phuc', status: 'open' })}>
                      <Plus size={15} /> Thêm hành động
                    </Button>
                  )}
                </div>
              }
            />
            <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
              <Select value={view} onChange={(e) => setView(e.target.value)} className="max-w-[220px]" aria-label="Trạng thái">
                {Object.entries(VIEWS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Select value={source} onChange={(e) => setSource(e.target.value)} className="max-w-[220px]" aria-label="Nguồn">
                <option value="">Mọi nguồn</option>
                {Object.entries(CAPA_SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              <Select value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-[220px]" aria-label="Đơn vị">
                <option value="">Mọi đơn vị</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm nội dung, người phụ trách…" className="max-w-[220px]" />
              <span className="ml-auto text-xs text-pine-800/50">{rows.length} hành động</span>
            </div>
            {rows.length === 0 ? (
              <EmptyState title="Không có hành động phù hợp" />
            ) : (
              <Table head={['Hành động', 'Nguồn', 'Đơn vị / người', 'Hạn', 'Trạng thái', '']}>
                {rows.map(({ a, s }) => (
                  <tr key={a.id}>
                    <Td className="min-w-[260px]">
                      <div className="text-sm font-medium text-pine-800">{a.action}</div>
                      {a.root_cause && <div className="text-xs text-pine-800/50">Nguyên nhân: {a.root_cause}</div>}
                      {a.note && <div className="text-xs text-pine-800/45">{a.note}</div>}
                    </Td>
                    <Td className="min-w-[180px]">
                      <Badge tone="gray">{CAPA_SOURCE_LABELS[a.source] ?? a.source}</Badge>
                      {a.source_label && <div className="mt-1 line-clamp-2 text-xs text-pine-800/50">{a.source_label}</div>}
                    </Td>
                    <Td className="min-w-[140px] text-pine-800/70">
                      {a.department ?? '—'}
                      {a.owner && <div className="text-xs text-pine-800/45">{a.owner}</div>}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {fmtDate(a.due_date)}
                      {a.completed_date && <div className="text-xs text-pine-800/45">Xong {fmtDate(a.completed_date)}</div>}
                    </Td>
                    <Td className="min-w-[150px]">
                      <Badge tone={CAPA_STATE_TONE[s]}>{s === 'qua_han' && a.due_date ? `Quá hạn ${-daysUntil(a.due_date)} ngày` : CAPA_STATE_LABELS[s]}</Badge>
                      <div className="mt-1 text-[11px] text-pine-800/45">{CAPA_KIND_LABELS[a.kind] ?? ''}</div>
                    </Td>
                    <Td className="text-right">
                      {canEdit && (
                        <div className="flex justify-end gap-1">
                          {a.status !== 'done' && (
                            <Button variant="outline" onClick={() => complete(a)} title="Đánh dấu hoàn thành">
                              <CheckCircle2 size={14} /> Xong
                            </Button>
                          )}
                          {s === 'cho_xac_nhan' && (
                            <Button variant="outline" onClick={() => setForm({ ...a, verified_date: todayISO(), effective: true })}>
                              Xác nhận
                            </Button>
                          )}
                          <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...a })}>
                            <Pencil size={15} />
                          </Button>
                          <Button variant="ghost" aria-label="Xóa" onClick={() => remove(a)}>
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      )}
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title="Khắc phục đang theo dõi ở phân hệ khác" hint="Cùng thuộc bước A – cập nhật tại phân hệ gốc" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <Link to="/noi-quy" className="rounded-lg border border-pine-800/10 p-3 hover:bg-pine-800/[0.03]">
                <div className="text-sm font-medium text-pine-800">Vi phạm nội quy chưa khắc phục</div>
                <div className="mt-1 text-2xl font-bold text-pine-800">{elsewhere.violations}</div>
                <div className="text-xs text-pine-800/50">{elsewhere.violationsOverdue} quá hạn khắc phục · Nội quy & Vi phạm →</div>
              </Link>
              <Link to="/thiet-bi" className="rounded-lg border border-pine-800/10 p-3 hover:bg-pine-800/[0.03]">
                <div className="text-sm font-medium text-pine-800">Phiếu sửa chữa thiết bị đang mở</div>
                <div className="mt-1 text-2xl font-bold text-pine-800">{elsewhere.orders}</div>
                <div className="text-xs text-pine-800/50">{elsewhere.ordersOverdue} quá hạn sửa chữa · Thiết bị & bảo trì →</div>
              </Link>
            </div>
          </Card>

          <Note>
            ISO 14001:2015 và ISO 45001:2018 điều 10.2: xử lý sự không phù hợp, xác định nguyên nhân, thực hiện hành động, xem xét hiệu lực và lưu thông tin dạng
            văn bản. Hành động được đóng khi đã hoàn thành và kiểm tra lại thấy có hiệu lực; lỗi lặp lại → đánh dấu "Chưa hiệu lực" để làm lại.
          </Note>
        </>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Cập nhật hành động' : 'Thêm hành động khắc phục – phòng ngừa'}
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
          <Field label="Hành động" required>
            <Textarea rows={2} value={form?.action ?? ''} onChange={(e) => setForm({ ...form, action: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nguồn">
              <Select value={form?.source ?? 'khac'} onChange={(e) => setForm({ ...form, source: e.target.value })} disabled={!!form?.incident_id}>
                {Object.entries(CAPA_SOURCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mô tả nguồn" className="sm:col-span-2">
              <Input value={form?.source_label ?? ''} onChange={(e) => setForm({ ...form, source_label: e.target.value })} placeholder="VD: Đánh giá nội bộ ISO 14001 tháng 10" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Loại">
              <Select value={form?.kind ?? 'khac_phuc'} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {Object.entries(CAPA_KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nguyên nhân gốc" className="sm:col-span-2">
              <Input value={form?.root_cause ?? ''} onChange={(e) => setForm({ ...form, root_cause: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Đơn vị thực hiện">
              <DepartmentInput value={form?.department ?? ''} onChange={(v) => setForm({ ...form, department: v })} departments={departments} />
            </Field>
            <Field label="Người phụ trách">
              <Input value={form?.owner ?? ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            </Field>
            <Field label="Hạn hoàn thành" required>
              <Input type="date" value={form?.due_date ?? ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Trạng thái">
              <Select value={form?.status ?? 'open'} onChange={(e) => setForm({ ...form, status: e.target.value, completed_date: e.target.value === 'done' ? form?.completed_date || todayISO() : null })}>
                {Object.entries(CAPA_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            {form?.status === 'done' && (
              <Field label="Ngày hoàn thành">
                <Input type="date" value={form?.completed_date ?? ''} onChange={(e) => setForm({ ...form, completed_date: e.target.value })} />
              </Field>
            )}
          </div>
          {form?.status === 'done' && (
            <div className="space-y-3 rounded-lg bg-pine-800/[0.04] p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-pine-800/50">Xác nhận hiệu lực</div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Ngày kiểm tra lại">
                  <Input type="date" value={form?.verified_date ?? ''} onChange={(e) => setForm({ ...form, verified_date: e.target.value })} />
                </Field>
                <Field label="Người xác nhận">
                  <Input value={form?.verified_by ?? ''} onChange={(e) => setForm({ ...form, verified_by: e.target.value })} />
                </Field>
                <Field label="Kết quả">
                  <Select
                    value={form?.effective == null ? '' : form.effective ? 'yes' : 'no'}
                    onChange={(e) => setForm({ ...form, effective: e.target.value === '' ? null : e.target.value === 'yes' })}
                  >
                    <option value="">— Chưa xác nhận —</option>
                    <option value="yes">Có hiệu lực</option>
                    <option value="no">Chưa hiệu lực – làm lại</option>
                  </Select>
                </Field>
              </div>
            </div>
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
