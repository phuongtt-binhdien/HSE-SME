import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Modal,
  Note,
  Select,
  Table,
  Tabs,
  Td,
  Textarea,
} from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { useList, useRemove, useSave } from '../../hooks/useCrud'
import {
  CAPA_STATUS_LABELS,
  EQUIPMENT_STATUS_LABELS,
  FIRE_TYPE_LABELS,
  INCIDENT_KIND_LABELS,
  INCIDENT_STATUS_LABELS,
  SEVERITY_LABELS,
} from '../../lib/constants'
import type { Employee } from '../../lib/training'
import { daysUntil, errMsg, fmtDate, todayISO } from '../../lib/utils'
import DrillsManager from '../drills/DrillsManager'

/* ================= Thiết bị PCCC ================= */
function FireTab({ fid, base, canEdit }: any) {
  const list = useList('fire_equipment', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })
  const save = useSave('fire_equipment')
  const remove = useRemove('fire_equipment')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!form.name?.trim()) return setErr('Nhập tên thiết bị.')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        name: form.name.trim(),
        type: form.type || 'binh_bot',
        location: form.location || null,
        quantity: Number(form.quantity || 1),
        last_inspection: form.last_inspection || null,
        next_inspection: form.next_inspection || null,
        status: form.status || 'tot',
        note: form.note || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const inspBadge = (d: string | null) => {
    if (!d) return <span className="text-pine-800/40">—</span>
    const n = daysUntil(d)
    if (n < 0) return <Badge tone="red">Quá hạn {-n} ngày</Badge>
    if (n <= 15) return <Badge tone="amber">Còn {n} ngày</Badge>
    return <span className="text-pine-800/60">{fmtDate(d)}</span>
  }

  return (
    <Card>
      <CardHeader
        title="Thiết bị PCCC"
        hint="Theo dõi số lượng, vị trí và hạn kiểm tra định kỳ"
        action={
          canEdit && (
            <Button onClick={() => setForm({ type: 'binh_bot', status: 'tot', quantity: 1 })}>
              <Plus size={15} /> Thêm thiết bị
            </Button>
          )
        }
      />
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có thiết bị" />
      ) : (
        <Table head={['Thiết bị', 'Loại', 'Vị trí', 'SL', 'Tình trạng', 'Hạn kiểm tra', '']}>
          {(list.data as any[]).map((e) => (
            <tr key={e.id}>
              <Td className="font-medium">{e.name}</Td>
              <Td className="text-pine-800/60">{FIRE_TYPE_LABELS[e.type]}</Td>
              <Td className="text-pine-800/60">{e.location ?? '—'}</Td>
              <Td>{e.quantity}</Td>
              <Td>
                <Badge tone={e.status === 'tot' ? 'green' : e.status === 'can_bao_tri' ? 'amber' : 'red'}>
                  {EQUIPMENT_STATUS_LABELS[e.status]}
                </Badge>
              </Td>
              <Td>{inspBadge(e.next_inspection)}</Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...e })}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa thiết bị này?') && remove.mutate(e.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa thiết bị' : 'Thêm thiết bị PCCC'}
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
        <div className="space-y-3">
          <Field label="Tên thiết bị" required>
            <Input value={form?.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Loại">
              <Select value={form?.type ?? 'binh_bot'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {Object.entries(FIRE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Số lượng">
              <Input
                type="number"
                min={1}
                value={form?.quantity ?? 1}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Vị trí">
            <Input value={form?.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kiểm tra gần nhất">
              <Input
                type="date"
                value={form?.last_inspection ?? ''}
                onChange={(e) => setForm({ ...form, last_inspection: e.target.value })}
              />
            </Field>
            <Field label="Hạn kiểm tra tiếp theo">
              <Input
                type="date"
                value={form?.next_inspection ?? ''}
                onChange={(e) => setForm({ ...form, next_inspection: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Tình trạng">
            <Select value={form?.status ?? 'tot'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(EQUIPMENT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ghi chú">
            <Textarea value={form?.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Nhà thầu ================= */
function PermitsTab({ fid, base, canEdit }: any) {
  const list = useList('contractor_permits', {
    match: { facility_id: fid },
    order: 'created_at',
    enabled: !!fid,
  })
  const save = useSave('contractor_permits')
  const remove = useRemove('contractor_permits')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!form.contractor_name?.trim()) return setErr('Nhập tên nhà thầu.')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        contractor_name: form.contractor_name.trim(),
        work_description: form.work_description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        commitment_signed: !!form.commitment_signed,
        safety_briefing: !!form.safety_briefing,
        note: form.note || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const statusBadge = (p: any) => {
    if (p.end_date && daysUntil(p.end_date) < 0) return <Badge tone="gray">Hết hiệu lực</Badge>
    if (!p.commitment_signed || !p.safety_briefing) return <Badge tone="red">Thiếu điều kiện</Badge>
    return <Badge tone="green">Đủ điều kiện</Badge>
  }

  return (
    <Card>
      <CardHeader
        title="Nhà thầu & khách vào làm việc"
        hint="Điều kiện vào nhà máy: ký cam kết BVMT–AT–PCCC và huấn luyện an toàn đầu vào"
        action={
          canEdit && (
            <Button onClick={() => setForm({})}>
              <Plus size={15} /> Thêm
            </Button>
          )
        }
      />
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có nhà thầu" />
      ) : (
        <Table head={['Nhà thầu', 'Công việc', 'Thời gian', 'Cam kết', 'Huấn luyện', 'Trạng thái', '']}>
          {(list.data as any[]).map((p) => (
            <tr key={p.id}>
              <Td className="font-medium">{p.contractor_name}</Td>
              <Td className="max-w-[220px] text-pine-800/60">{p.work_description ?? '—'}</Td>
              <Td className="text-pine-800/60">
                {fmtDate(p.start_date)} → {fmtDate(p.end_date)}
              </Td>
              <Td>{p.commitment_signed ? <Badge tone="green">Đã ký</Badge> : <Badge tone="red">Chưa</Badge>}</Td>
              <Td>{p.safety_briefing ? <Badge tone="green">Đã HL</Badge> : <Badge tone="red">Chưa</Badge>}</Td>
              <Td>{statusBadge(p)}</Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...p })}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa bản ghi này?') && remove.mutate(p.id)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa nhà thầu' : 'Thêm nhà thầu'}
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
        <div className="space-y-3">
          <Field label="Tên nhà thầu / khách" required>
            <Input
              value={form?.contractor_name ?? ''}
              onChange={(e) => setForm({ ...form, contractor_name: e.target.value })}
            />
          </Field>
          <Field label="Nội dung công việc">
            <Textarea
              value={form?.work_description ?? ''}
              onChange={(e) => setForm({ ...form, work_description: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Từ ngày">
              <Input
                type="date"
                value={form?.start_date ?? ''}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </Field>
            <Field label="Đến ngày">
              <Input
                type="date"
                value={form?.end_date ?? ''}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-pine-800">
            <input
              type="checkbox"
              className="h-4 w-4 accent-viridian-600"
              checked={!!form?.commitment_signed}
              onChange={(e) => setForm({ ...form, commitment_signed: e.target.checked })}
            />
            Đã ký cam kết BVMT – An toàn – PCCC
          </label>
          <label className="flex items-center gap-2 text-sm text-pine-800">
            <input
              type="checkbox"
              className="h-4 w-4 accent-viridian-600"
              checked={!!form?.safety_briefing}
              onChange={(e) => setForm({ ...form, safety_briefing: e.target.checked })}
            />
            Đã huấn luyện an toàn đầu vào
          </label>
          <Field label="Ghi chú">
            <Textarea value={form?.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Sự cố & CAPA ================= */
function IncidentsTab({ fid, base, canEdit }: any) {
  const list = useList('incidents', { match: { facility_id: fid }, order: 'incident_date', enabled: !!fid })
  const save = useSave('incidents')
  const remove = useRemove('incidents')
  const saveCapa = useSave('capa_actions')
  const removeCapa = useRemove('capa_actions')
  const [form, setForm] = useState<any>(null)
  const [sel, setSel] = useState<any>(null) // sự cố đang mở CAPA
  const [capaForm, setCapaForm] = useState<any>({ action: '', owner: '', due_date: '' })
  const [err, setErr] = useState('')

  const capa = useList('capa_actions', {
    match: { incident_id: sel?.id ?? '' },
    order: 'created_at',
    ascending: true,
    enabled: !!sel,
  })

  const submit = async () => {
    setErr('')
    if (!form.title?.trim()) return setErr('Nhập tiêu đề sự cố.')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        incident_date: form.incident_date || todayISO(),
        kind: form.kind || 'moi_truong',
        severity: form.severity || 'nhe',
        title: form.title.trim(),
        description: form.description || null,
        immediate_action: form.immediate_action || null,
        root_cause: form.root_cause || null,
        status: form.status || 'open',
        reporter: form.reporter || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const addCapa = async () => {
    if (!capaForm.action?.trim()) return
    await saveCapa.mutateAsync({
      org_id: base.org_id,
      facility_id: base.facility_id,
      incident_id: sel.id,
      source: 'su_co',
      source_ref: sel.id,
      source_label: sel.title,
      root_cause: sel.root_cause || null,
      action: capaForm.action.trim(),
      owner: capaForm.owner || null,
      due_date: capaForm.due_date || null,
      status: 'open',
    })
    setCapaForm({ action: '', owner: '', due_date: '' })
  }

  const sevTone = (s: string) => (s === 'nghiem_trong' ? 'red' : s === 'trung_binh' ? 'amber' : 'gray') as any
  const stTone = (s: string) => (s === 'closed' ? 'green' : s === 'investigating' ? 'amber' : 'red') as any

  return (
    <Card>
      <CardHeader
        title="Sự cố & hành động khắc phục (CAPA)"
        hint="Ghi nhận, điều tra nguyên nhân gốc và theo dõi hành động khắc phục – phòng ngừa"
        action={
          canEdit && (
            <Button onClick={() => setForm({ incident_date: todayISO(), kind: 'moi_truong', severity: 'nhe', status: 'open' })}>
              <Plus size={15} /> Ghi nhận sự cố
            </Button>
          )
        }
      />
      {(list.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có sự cố" hint="Một tin tốt — nhưng hãy ghi nhận đầy đủ khi xảy ra" />
      ) : (
        <Table head={['Ngày', 'Sự cố', 'Loại', 'Mức độ', 'Trạng thái', '']}>
          {(list.data as any[]).map((i) => (
            <tr key={i.id}>
              <Td>{fmtDate(i.incident_date)}</Td>
              <Td>
                <div className="font-medium">{i.title}</div>
                {i.root_cause && (
                  <div className="text-xs text-pine-800/45">Nguyên nhân: {i.root_cause}</div>
                )}
              </Td>
              <Td className="text-pine-800/60">{INCIDENT_KIND_LABELS[i.kind]}</Td>
              <Td>
                <Badge tone={sevTone(i.severity)}>{SEVERITY_LABELS[i.severity]}</Badge>
              </Td>
              <Td>
                <Badge tone={stTone(i.status)}>{INCIDENT_STATUS_LABELS[i.status]}</Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1">
                  <Button variant="outline" onClick={() => setSel(i)}>
                    CAPA
                  </Button>
                  {canEdit && (
                    <>
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...i })}>
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        aria-label="Xóa"
                        onClick={() => window.confirm('Xóa sự cố này?') && remove.mutate(i.id)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {/* Form sự cố */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa sự cố' : 'Ghi nhận sự cố'}
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
        <div className="space-y-3">
          <Field label="Tiêu đề sự cố" required>
            <Input value={form?.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Ngày xảy ra">
              <Input
                type="date"
                value={form?.incident_date ?? ''}
                onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
              />
            </Field>
            <Field label="Loại">
              <Select value={form?.kind ?? 'moi_truong'} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {Object.entries(INCIDENT_KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Mức độ">
              <Select value={form?.severity ?? 'nhe'} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Trạng thái">
              <Select value={form?.status ?? 'open'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(INCIDENT_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Diễn biến">
            <Textarea
              value={form?.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Xử lý ban đầu">
              <Textarea
                value={form?.immediate_action ?? ''}
                onChange={(e) => setForm({ ...form, immediate_action: e.target.value })}
              />
            </Field>
            <Field label="Nguyên nhân gốc">
              <Textarea
                value={form?.root_cause ?? ''}
                onChange={(e) => setForm({ ...form, root_cause: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Người báo cáo">
            <Input value={form?.reporter ?? ''} onChange={(e) => setForm({ ...form, reporter: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>

      {/* CAPA */}
      <Modal open={!!sel} onClose={() => setSel(null)} title={'CAPA: ' + (sel?.title ?? '')} wide>
        <div className="space-y-3">
          <div className="text-sm text-pine-800/60">
            {fmtDate(sel?.incident_date)} · {INCIDENT_KIND_LABELS[sel?.kind] ?? ''} ·{' '}
            {SEVERITY_LABELS[sel?.severity] ?? ''}
          </div>
          {(capa.data ?? []).length === 0 ? (
            <EmptyState title="Chưa có hành động khắc phục" hint="Thêm hành động bên dưới" />
          ) : (
            <div className="space-y-2">
              {(capa.data as any[]).map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border border-pine-800/10 p-2.5">
                  <div className="flex-1">
                    <div className="text-sm text-pine-800">{c.action}</div>
                    <div className="text-xs text-pine-800/45">
                      {c.owner ?? '—'} · hạn {fmtDate(c.due_date)}
                    </div>
                  </div>
                  <Select
                    value={c.status}
                    onChange={(e) => saveCapa.mutate({ id: c.id, status: e.target.value, completed_date: e.target.value === 'done' ? todayISO() : null })}
                    className="max-w-[160px]"
                  >
                    {Object.entries(CAPA_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                  {canEdit && (
                    <Button variant="ghost" aria-label="Xóa" onClick={() => removeCapa.mutate(c.id)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          {canEdit && (
            <div className="flex flex-wrap items-end gap-2 rounded-lg bg-pine-800/5 p-2.5">
              <Field label="Hành động khắc phục" className="min-w-[200px] flex-1">
                <Input
                  value={capaForm.action}
                  onChange={(e) => setCapaForm({ ...capaForm, action: e.target.value })}
                />
              </Field>
              <Field label="Người phụ trách">
                <Input
                  value={capaForm.owner}
                  onChange={(e) => setCapaForm({ ...capaForm, owner: e.target.value })}
                  className="w-36"
                />
              </Field>
              <Field label="Hạn">
                <Input
                  type="date"
                  value={capaForm.due_date}
                  onChange={(e) => setCapaForm({ ...capaForm, due_date: e.target.value })}
                  className="w-40"
                />
              </Field>
              <Button onClick={addCapa}>
                <Plus size={15} /> Thêm
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  )
}

/* ================= Trang ================= */
export default function SafetyPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('thiet-bi')
  const employees = useList<Employee>('employees', { match: { facility_id: fid }, order: 'code', ascending: true, enabled: !!fid })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">PCCC & An toàn</h1>
        <p className="text-sm text-pine-800/50">Thiết bị PCCC · diễn tập theo người · nhà thầu · sự cố</p>
      </div>
      <Tabs
        tabs={[
          { key: 'thiet-bi', label: 'Thiết bị PCCC' },
          { key: 'dien-tap', label: 'Diễn tập' },
          { key: 'nha-thau', label: 'Nhà thầu' },
          { key: 'su-co', label: 'Sự cố' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'thiet-bi' && <FireTab fid={fid} base={base} canEdit={canEdit} />}
      {tab === 'dien-tap' && <DrillsManager fid={fid} base={base} canEdit={canEdit} employees={employees.data ?? []} />}
      {tab === 'nha-thau' && <PermitsTab fid={fid} base={base} canEdit={canEdit} />}
      {tab === 'su-co' && <IncidentsTab fid={fid} base={base} canEdit={canEdit} />}
      <Note>
        Checklist kiểm tra PCCC hằng tuần, tự kiểm tra định kỳ: <Link to="/kiem-tra" className="font-medium text-viridian-700 hover:underline">Kiểm tra định kỳ</Link>.
        Hành động khắc phục của mọi nguồn: <Link to="/khac-phuc" className="font-medium text-viridian-700 hover:underline">Hành động khắc phục</Link>.
        Hóa chất, PATHH: <Link to="/hoa-chat" className="font-medium text-viridian-700 hover:underline">Hóa chất</Link>.
      </Note>
    </div>
  )
}
