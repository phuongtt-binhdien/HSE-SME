// Danh sách nhân sự: thêm / sửa / xóa và hồ sơ huấn luyện từng người
import { useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react'
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
  Note,
  Select,
  Table,
  Td,
  Textarea,
} from '../../components/UI'
import {
  ATVSLD_GROUP_LABELS,
  EMPLOYEE_STATUS_LABELS,
  GENDER_LABELS,
  TRAINING_CATEGORY_LABELS,
  TRAINING_RESULT_LABELS,
} from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { expiryOf, MATRIX_CATEGORIES, stateOf, type Employee, type TrainingRecord } from '../../lib/training'
import { daysUntil, errMsg, fmtDate } from '../../lib/utils'
import { normalize } from './excel'
import { byDeptThenCode, DepartmentInput, matchesSearch, STATE_TONE, StateBadge, type PersonnelData } from './shared'
import TrainingRecordModal from './TrainingRecordModal'

export default function EmployeesTab({ data, base, canEdit }: { data: PersonnelData; base: any; canEdit: boolean }) {
  const qc = useQueryClient()
  const { employees, courses, records, matrix, departments, loading } = data
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [status, setStatus] = useState('active')
  const [form, setForm] = useState<any>(null)
  const [detail, setDetail] = useState<Employee | null>(null)
  const [recEdit, setRecEdit] = useState<{ record: TrainingRecord | null; category?: string } | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const rows = useMemo(
    () =>
      employees
        .filter((e) => !status || e.status === status)
        .filter((e) => !dept || e.department === dept)
        .filter((e) => matchesSearch(e, q))
        .sort(byDeptThenCode),
    [employees, q, dept, status]
  )

  const submit = async () => {
    setErr('')
    if (!form.full_name?.trim()) return setErr('Nhập họ tên.')
    const code = form.code?.trim() || null
    if (code && employees.some((e) => e.id !== form.id && normalize(e.code) === normalize(code)))
      return setErr('Mã nhân viên "' + code + '" đã tồn tại.')
    setBusy(true)
    try {
      const payload = {
        code,
        full_name: form.full_name.trim(),
        gender: form.gender || null,
        department: form.department?.trim() || null,
        position: form.position?.trim() || null,
        atvsld_group: form.atvsld_group ? Number(form.atvsld_group) : null,
        hire_date: form.hire_date || null,
        status: form.status || 'active',
        note: form.note?.trim() || null,
      }
      const { error } = form.id
        ? await supabase.from('employees').update(payload).eq('id', form.id)
        : await supabase.from('employees').insert({ ...base, ...payload })
      if (error) throw error
      await qc.invalidateQueries()
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (e: Employee) => {
    const n = records.filter((r) => r.employee_id === e.id).length
    if (!window.confirm(`Xóa ${e.full_name}${n ? ` cùng ${n} lượt huấn luyện` : ''}? Nếu người lao động đã nghỉ việc, nên chuyển trạng thái "Đã nghỉ" để giữ hồ sơ.`)) return
    const { error } = await supabase.from('employees').delete().eq('id', e.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const history = useMemo(() => {
    if (!detail) return []
    const cmap = new Map(courses.map((c) => [c.id, c]))
    return records
      .filter((r) => r.employee_id === detail.id)
      .map((r) => {
        const c = cmap.get(r.course_id)!
        const expiry = c ? expiryOf(r, c, detail) : null
        return { r, c, expiry, st: stateOf(expiry) }
      })
      .filter((x) => x.c)
      .sort((a, b) => b.c.start_date.localeCompare(a.c.start_date))
  }, [detail, records, courses])

  const isNew = (e: Employee) => e.hire_date && daysUntil(e.hire_date) >= -30

  return (
    <Card>
      <CardHeader
        title="Danh sách nhân sự"
        hint="Thông tin tối thiểu phục vụ quản lý huấn luyện ATVSLĐ – PCCC – ứng phó sự cố chất thải"
        action={
          canEdit && (
            <Button onClick={() => setForm({ status: 'active', atvsld_group: '4' })}>
              <Plus size={15} /> Thêm nhân sự
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, họ tên, chức danh…" className="max-w-[220px]" />
        <Select value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-[220px]" aria-label="Bộ phận">
          <option value="">Tất cả bộ phận</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]" aria-label="Trạng thái">
          <option value="">Mọi trạng thái</option>
          {Object.entries(EMPLOYEE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <span className="ml-auto text-xs text-pine-800/50">{rows.length} người</span>
      </div>
      {err && !form && (
        <div className="px-4 pt-3">
          <ErrorNote message={err} />
        </div>
      )}
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="Chưa có nhân sự" hint="Thêm từng người hoặc nhập danh sách từ Excel" />
      ) : (
        <Table head={['Mã NV', 'Họ tên', 'Bộ phận', 'Chức danh', 'Nhóm', 'Ngày vào làm', 'Huấn luyện', '']}>
          {rows.map((e) => {
            const row = matrix.get(e.id)
            return (
              <tr key={e.id} className={e.status !== 'active' ? 'opacity-60' : ''}>
                <Td className="whitespace-nowrap font-mono text-xs">{e.code ?? '—'}</Td>
                <Td>
                  <div className="font-medium">{e.full_name}</div>
                  <div className="text-xs text-pine-800/45">
                    {e.gender ? GENDER_LABELS[e.gender] : ''}
                    {e.status !== 'active' ? ' · ' + EMPLOYEE_STATUS_LABELS[e.status] : ''}
                    {isNew(e) && e.status === 'active' ? ' · Mới vào làm' : ''}
                  </div>
                </Td>
                <Td className="text-pine-800/70">{e.department ?? '—'}</Td>
                <Td className="text-pine-800/70">{e.position ?? '—'}</Td>
                <Td className="text-pine-800/70">{e.atvsld_group ?? '—'}</Td>
                <Td className="whitespace-nowrap text-pine-800/70">{fmtDate(e.hire_date)}</Td>
                <Td>
                  <div className="flex gap-1">
                    {row &&
                      MATRIX_CATEGORIES.map((c) => (
                        <span
                          key={c}
                          title={TRAINING_CATEGORY_LABELS[c]}
                          className={
                            'inline-block h-2.5 w-2.5 rounded-full ' +
                            (STATE_TONE[row[c].state] === 'green' ? 'bg-viridian-500' : STATE_TONE[row[c].state] === 'amber' ? 'bg-amber-500' : 'bg-red-500')
                          }
                        />
                      ))}
                  </div>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" onClick={() => setDetail(e)}>
                      <ClipboardList size={15} /> Hồ sơ HL
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...e, atvsld_group: e.atvsld_group ? String(e.atvsld_group) : '' })}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" aria-label="Xóa" onClick={() => remove(e)}>
                          <Trash2 size={15} />
                        </Button>
                      </>
                    )}
                  </div>
                </Td>
              </tr>
            )
          })}
        </Table>
      )}

      {/* Thêm / sửa nhân sự */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa thông tin nhân sự' : 'Thêm nhân sự'}
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
          <div className="grid grid-cols-3 gap-3">
            <Field label="Mã NV">
              <Input value={form?.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </Field>
            <Field label="Họ và tên" required className="col-span-2">
              <Input value={form?.full_name ?? ''} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bộ phận">
              <DepartmentInput value={form?.department ?? ''} onChange={(v) => setForm({ ...form, department: v })} departments={departments} />
            </Field>
            <Field label="Chức danh / công việc">
              <Input value={form?.position ?? ''} onChange={(e) => setForm({ ...form, position: e.target.value })} />
            </Field>
          </div>
          <Field label="Nhóm huấn luyện ATVSLĐ (NĐ 44/2016/NĐ-CP)">
            <Select value={form?.atvsld_group ?? ''} onChange={(e) => setForm({ ...form, atvsld_group: e.target.value })}>
              <option value="">— Chưa xác định —</option>
              {Object.entries(ATVSLD_GROUP_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Giới tính">
              <Select value={form?.gender ?? ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">—</option>
                {Object.entries(GENDER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ngày vào làm">
              <Input type="date" value={form?.hire_date ?? ''} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} />
            </Field>
            <Field label="Trạng thái">
              <Select value={form?.status ?? 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(EMPLOYEE_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Ghi chú">
            <Textarea rows={2} value={form?.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          <Note>Chỉ lưu thông tin cần cho quản lý an toàn (không lưu CCCD, địa chỉ…) để hạn chế dữ liệu cá nhân.</Note>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>

      {/* Hồ sơ huấn luyện cá nhân */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={'Hồ sơ huấn luyện – ' + (detail?.full_name ?? '')} wide>
        {detail && (
          <div className="space-y-3">
            <div className="text-sm text-pine-800/60">
              {detail.code ?? '—'} · {detail.department ?? '—'} · {detail.position ?? '—'} ·{' '}
              {detail.atvsld_group ? ATVSLD_GROUP_LABELS[String(detail.atvsld_group)] : 'Chưa xác định nhóm'}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {MATRIX_CATEGORIES.map((c) => {
                const s = matrix.get(detail.id)?.[c]
                return (
                  <div key={c} className="rounded-lg border border-pine-800/10 p-2.5">
                    <div className="text-xs font-semibold text-pine-800">{TRAINING_CATEGORY_LABELS[c]}</div>
                    <div className="mt-1">{s && <StateBadge status={s} />}</div>
                    {canEdit && s && (s.state === 'chua' || s.state === 'het_han' || s.state === 'sap_het') && (
                      <button className="mt-1 text-xs text-viridian-700 hover:underline" onClick={() => setRecEdit({ record: null, category: c })}>
                        + Ghi nhận huấn luyện
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {isNew(detail) && (
              <Note tone="amber">Người lao động mới: phải được huấn luyện ATVSLĐ, PCCC, ứng phó sự cố chất thải trước khi bố trí công việc.</Note>
            )}
            {history.length === 0 ? (
              <EmptyState title="Chưa có lượt huấn luyện" />
            ) : (
              <Table head={['Loại', 'Khóa', 'Ngày', 'Quyết định', 'Kết quả', 'Hạn', '']}>
                {history.map(({ r, c, expiry, st }) => (
                  <tr key={r.id}>
                    <Td className="text-pine-800/70">{TRAINING_CATEGORY_LABELS[c.category]}</Td>
                    <Td className="max-w-[220px]">{c.name}</Td>
                    <Td className="whitespace-nowrap">{fmtDate(c.start_date)}</Td>
                    <Td className="whitespace-nowrap">{c.decision_no ?? '—'}</Td>
                    <Td>
                      <Badge tone={r.result === 'dat' ? 'green' : 'red'}>{TRAINING_RESULT_LABELS[r.result]}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap">
                      {expiry ? <Badge tone={r.result !== 'dat' ? 'gray' : STATE_TONE[st.state]}>{fmtDate(expiry)}</Badge> : '—'}
                    </Td>
                    <Td className="text-right">
                      {canEdit && (
                        <Button variant="ghost" aria-label="Sửa" onClick={() => setRecEdit({ record: r })}>
                          <Pencil size={15} />
                        </Button>
                      )}
                    </Td>
                  </tr>
                ))}
              </Table>
            )}
            {canEdit && (
              <Button variant="outline" onClick={() => setRecEdit({ record: null })}>
                <Plus size={15} /> Thêm lượt huấn luyện
              </Button>
            )}
          </div>
        )}
      </Modal>

      <TrainingRecordModal
        open={!!recEdit}
        onClose={() => setRecEdit(null)}
        base={base}
        employee={detail}
        category={recEdit?.category}
        record={recEdit?.record}
        courses={courses}
        canEdit={canEdit}
      />
    </Card>
  )
}
