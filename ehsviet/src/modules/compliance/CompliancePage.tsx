import { useQueryClient } from '@tanstack/react-query'
import { addMonths, addYears, format, parseISO } from 'date-fns'
import { CheckCircle2, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Loading,
  Modal,
  Select,
  Table,
  Tabs,
  Td,
  Textarea,
} from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { useList, useRemove, useSave } from '../../hooks/useCrud'
import {
  DOC_CATEGORY_LABELS,
  RECURRENCE_LABELS,
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
} from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { daysUntil, errMsg, fmtDate, todayISO } from '../../lib/utils'

/* ================= Lịch tuân thủ ================= */
function TasksTab({ fid, base, canEdit }: any) {
  const qc = useQueryClient()
  const tasks = useList('compliance_tasks', {
    match: { facility_id: fid },
    order: 'due_date',
    ascending: true,
    enabled: !!fid,
  })
  const save = useSave('compliance_tasks')
  const remove = useRemove('compliance_tasks')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const rows = (tasks.data ?? []) as any[]
  const pending = useMemo(() => rows.filter((t) => t.status !== 'done'), [rows])
  const overdue = pending.filter((t) => daysUntil(t.due_date) < 0)
  const upcoming = pending.filter(
    (t) => daysUntil(t.due_date) >= 0 && daysUntil(t.due_date) <= (t.remind_days ?? 14)
  )

  const submit = async () => {
    setErr('')
    if (!form.title?.trim() || !form.due_date) return setErr('Nhập tiêu đề và hạn thực hiện.')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        title: form.title.trim(),
        description: form.description || null,
        category: form.category || 'bao_cao',
        due_date: form.due_date,
        recurrence: form.recurrence || 'none',
        remind_days: Number(form.remind_days ?? 14),
        assigned_to: form.assigned_to || null,
        status: form.status || 'pending',
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  /** Hoàn thành: đóng việc hiện tại, tự tạo kỳ tiếp theo nếu có lặp lại. */
  const complete = async (t: any) => {
    try {
      const { error } = await supabase
        .from('compliance_tasks')
        .update({ status: 'done', completed_date: todayISO() })
        .eq('id', t.id)
      if (error) throw error
      if (t.recurrence && t.recurrence !== 'none') {
        const d = parseISO(t.due_date)
        const next =
          t.recurrence === 'monthly'
            ? addMonths(d, 1)
            : t.recurrence === 'quarterly'
              ? addMonths(d, 3)
              : addYears(d, 1)
        const { error: e2 } = await supabase.from('compliance_tasks').insert({
          ...base,
          title: t.title,
          description: t.description,
          category: t.category,
          due_date: format(next, 'yyyy-MM-dd'),
          recurrence: t.recurrence,
          remind_days: t.remind_days,
          assigned_to: t.assigned_to,
          status: 'pending',
        })
        if (e2) throw e2
      }
      await qc.invalidateQueries()
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const duePill = (t: any) => {
    if (t.status === 'done') return <Badge tone="green">Xong {fmtDate(t.completed_date)}</Badge>
    const n = daysUntil(t.due_date)
    if (n < 0) return <Badge tone="red">Quá hạn {-n} ngày</Badge>
    if (n === 0) return <Badge tone="red">Hôm nay</Badge>
    if (n <= (t.remind_days ?? 14)) return <Badge tone="amber">Còn {n} ngày</Badge>
    return <Badge tone="gray">Còn {n} ngày</Badge>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge tone="red">Quá hạn: {overdue.length}</Badge>
        <Badge tone="amber">Sắp đến hạn: {upcoming.length}</Badge>
        <Badge tone="gray">Đang mở: {pending.length}</Badge>
      </div>

      <Card>
        <CardHeader
          title="Lịch tuân thủ"
          hint="Báo cáo, quan trắc định kỳ, phí BVMT, giấy phép — việc lặp lại tự tạo kỳ tiếp theo khi hoàn thành"
          action={
            canEdit && (
              <Button onClick={() => setForm({ category: 'bao_cao', recurrence: 'none', remind_days: 14, status: 'pending' })}>
                <Plus size={15} /> Thêm việc
              </Button>
            )
          }
        />
        {tasks.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState title="Chưa có việc tuân thủ" hint="Thêm hạn báo cáo, quan trắc, nộp phí…" />
        ) : (
          <Table head={['Việc', 'Nhóm', 'Hạn', 'Lặp lại', 'Phụ trách', 'Trạng thái', '']}>
            {rows.map((t) => (
              <tr key={t.id} className={t.status === 'done' ? 'opacity-60' : ''}>
                <Td>
                  <div className="font-medium">{t.title}</div>
                  {t.description && (
                    <div className="max-w-[320px] text-xs text-pine-800/45">{t.description}</div>
                  )}
                </Td>
                <Td>
                  <Badge tone="blue">{TASK_CATEGORY_LABELS[t.category]}</Badge>
                </Td>
                <Td>
                  <div className="text-pine-800/70">{fmtDate(t.due_date)}</div>
                  <div className="mt-0.5">{duePill(t)}</div>
                </Td>
                <Td className="text-pine-800/60">{RECURRENCE_LABELS[t.recurrence]}</Td>
                <Td className="text-pine-800/60">{t.assigned_to ?? '—'}</Td>
                <Td className="text-pine-800/60">{TASK_STATUS_LABELS[t.status]}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    {canEdit && t.status !== 'done' && (
                      <Button variant="outline" onClick={() => complete(t)}>
                        <CheckCircle2 size={15} /> Hoàn thành
                      </Button>
                    )}
                    {canEdit && (
                      <>
                        <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...t })}>
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          aria-label="Xóa"
                          onClick={() => window.confirm('Xóa việc này?') && remove.mutate(t.id)}
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
      </Card>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa việc tuân thủ' : 'Thêm việc tuân thủ'}
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
          <Field label="Tiêu đề" required>
            <Input value={form?.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Mô tả / căn cứ pháp lý">
            <Textarea
              value={form?.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="VD: Theo GPMT 2986/GPMT-STNMT; TT 02/2022/TT-BTNMT…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nhóm">
              <Select
                value={form?.category ?? 'bao_cao'}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(TASK_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Hạn thực hiện" required>
              <Input
                type="date"
                value={form?.due_date ?? ''}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lặp lại">
              <Select
                value={form?.recurrence ?? 'none'}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
              >
                {Object.entries(RECURRENCE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nhắc trước (ngày)">
              <Input
                type="number"
                min={0}
                value={form?.remind_days ?? 14}
                onChange={(e) => setForm({ ...form, remind_days: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Người phụ trách">
            <Input
              value={form?.assigned_to ?? ''}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
            />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
      {err && <ErrorNote message={err} />}
    </div>
  )
}

/* ================= Hồ sơ pháp lý ================= */
function DocsTab({ fid, base, canEdit }: any) {
  const docs = useList('legal_documents', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })
  const save = useSave('legal_documents')
  const remove = useRemove('legal_documents')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    if (!form.title?.trim()) return setErr('Nhập tên hồ sơ.')
    try {
      await save.mutateAsync({
        ...(form.id ? { id: form.id } : base),
        doc_no: form.doc_no || null,
        title: form.title.trim(),
        category: form.category || 'GPMT',
        issuer: form.issuer || null,
        issued_date: form.issued_date || null,
        expiry_date: form.expiry_date || null,
        file_url: form.file_url || null,
        note: form.note || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const expiryBadge = (d: string | null) => {
    if (!d) return <span className="text-pine-800/40">Không thời hạn</span>
    const n = daysUntil(d)
    if (n < 0) return <Badge tone="red">Hết hạn</Badge>
    if (n <= 90) return <Badge tone="amber">Còn {n} ngày</Badge>
    return <span className="text-pine-800/60">{fmtDate(d)}</span>
  }

  return (
    <Card>
      <CardHeader
        title="Kho hồ sơ pháp lý"
        hint="GPMT, sổ đăng ký, hợp đồng, báo cáo đã nộp — lưu liên kết file (Drive/Storage)"
        action={
          canEdit && (
            <Button onClick={() => setForm({ category: 'GPMT' })}>
              <Plus size={15} /> Thêm hồ sơ
            </Button>
          )
        }
      />
      {docs.isLoading ? (
        <Loading />
      ) : (docs.data ?? []).length === 0 ? (
        <EmptyState title="Chưa có hồ sơ" />
      ) : (
        <Table head={['Số hiệu', 'Tên hồ sơ', 'Nhóm', 'Cơ quan cấp', 'Ngày cấp', 'Hiệu lực', 'File', '']}>
          {(docs.data as any[]).map((d) => (
            <tr key={d.id}>
              <Td className="whitespace-nowrap font-mono text-xs">{d.doc_no ?? '—'}</Td>
              <Td className="font-medium">{d.title}</Td>
              <Td>
                <Badge tone={d.category === 'GPMT' ? 'green' : 'gray'}>
                  {DOC_CATEGORY_LABELS[d.category]}
                </Badge>
              </Td>
              <Td className="max-w-[220px] text-pine-800/60">{d.issuer ?? '—'}</Td>
              <Td className="text-pine-800/60">{fmtDate(d.issued_date)}</Td>
              <Td>{expiryBadge(d.expiry_date)}</Td>
              <Td>
                {d.file_url ? (
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-viridian-700 underline"
                  >
                    Mở <ExternalLink size={13} />
                  </a>
                ) : (
                  '—'
                )}
              </Td>
              <Td className="text-right">
                {canEdit && (
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...d })}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      aria-label="Xóa"
                      onClick={() => window.confirm('Xóa hồ sơ này?') && remove.mutate(d.id)}
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
        title={form?.id ? 'Sửa hồ sơ' : 'Thêm hồ sơ pháp lý'}
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số hiệu văn bản">
              <Input
                value={form?.doc_no ?? ''}
                onChange={(e) => setForm({ ...form, doc_no: e.target.value })}
                placeholder="VD: 2986/GPMT-STNMT"
              />
            </Field>
            <Field label="Nhóm">
              <Select
                value={form?.category ?? 'GPMT'}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {Object.entries(DOC_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Tên hồ sơ" required>
            <Input value={form?.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Cơ quan cấp / bên ký">
            <Input value={form?.issuer ?? ''} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày cấp">
              <Input
                type="date"
                value={form?.issued_date ?? ''}
                onChange={(e) => setForm({ ...form, issued_date: e.target.value })}
              />
            </Field>
            <Field label="Ngày hết hiệu lực">
              <Input
                type="date"
                value={form?.expiry_date ?? ''}
                onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Liên kết file">
            <Input
              value={form?.file_url ?? ''}
              onChange={(e) => setForm({ ...form, file_url: e.target.value })}
              placeholder="https://…"
            />
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

/* ================= Trang ================= */
export default function CompliancePage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('lich')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Hồ sơ & Tuân thủ</h1>
        <p className="text-sm text-pine-800/50">
          Lịch tuân thủ có nhắc hạn · kho hồ sơ pháp lý (GPMT, sổ đăng ký, hợp đồng)
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'lich', label: 'Lịch tuân thủ' },
          { key: 'ho-so', label: 'Hồ sơ pháp lý' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'lich' && <TasksTab fid={fid} base={base} canEdit={canEdit} />}
      {tab === 'ho-so' && <DocsTab fid={fid} base={base} canEdit={canEdit} />}
    </div>
  )
}
