// Khóa huấn luyện: ghi nhận một khóa (một quyết định) cho cả danh sách học viên
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
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
import { TRAINING_CATEGORY_BASIS, TRAINING_CATEGORY_LABELS, TRAINING_CATEGORY_SHORT } from '../../lib/constants'
import { supabase } from '../../lib/supabase'
import { ALL_TRAINING_CATEGORIES, defaultValidityMonths, isValid, type Employee, type TrainingCourse } from '../../lib/training'
import { cls, errMsg, fmtDate, newId, todayISO } from '../../lib/utils'
import { byDeptThenCode, matchesSearch, StateBadge, type PersonnelData } from './shared'

type Picks = Map<string, 'dat' | 'khong_dat'>

export default function CoursesTab({ data, base, canEdit }: { data: PersonnelData; base: any; canEdit: boolean }) {
  const qc = useQueryClient()
  const { employees, courses, records, loading } = data
  const [cat, setCat] = useState('')
  const [year, setYear] = useState('')
  const [form, setForm] = useState<any>(null)
  const [picks, setPicks] = useState<Picks>(new Map())
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const years = useMemo(() => [...new Set(courses.map((c) => c.start_date.slice(0, 4)))].sort().reverse(), [courses])
  const counts = useMemo(() => {
    const m = new Map<string, { total: number; pass: number }>()
    for (const r of records) {
      const x = m.get(r.course_id) ?? { total: 0, pass: 0 }
      x.total += 1
      if (r.result === 'dat') x.pass += 1
      m.set(r.course_id, x)
    }
    return m
  }, [records])

  const rows = courses.filter((c) => (!cat || c.category === cat) && (!year || c.start_date.startsWith(year)))

  const openCreate = () => {
    setErr('')
    setPicks(new Map())
    setForm({ category: 'atvsld', start_date: todayISO() })
  }
  const openEdit = (c: TrainingCourse, withPeople = false) => {
    setErr('')
    const m: Picks = new Map()
    for (const r of records) if (r.course_id === c.id) m.set(r.employee_id, r.result)
    setPicks(m)
    setForm({ ...c, withPeople })
  }

  const submit = async () => {
    setErr('')
    if (!form.name?.trim() || !form.start_date) return setErr('Nhập tên khóa và ngày huấn luyện.')
    const removing = form.id ? records.filter((r) => r.course_id === form.id && !picks.has(r.employee_id)).length : 0
    if (removing && !window.confirm(`Bỏ ${removing} học viên khỏi khóa này?`)) return
    setBusy(true)
    try {
      const payload = {
        category: form.category,
        name: form.name.trim(),
        start_date: form.start_date,
        end_date: form.end_date || null,
        decision_no: form.decision_no?.trim() || null,
        decision_date: form.decision_date || null,
        provider: form.provider?.trim() || null,
        hours: form.hours === '' || form.hours == null ? null : Number(form.hours),
        validity_months: form.validity_months === '' || form.validity_months == null ? null : Number(form.validity_months),
        note: form.note?.trim() || null,
      }
      let courseId = form.id as string | undefined
      if (courseId) {
        const { error } = await supabase.from('training_courses').update(payload).eq('id', courseId)
        if (error) throw error
      } else {
        courseId = newId()
        const { error } = await supabase.from('training_courses').insert({ ...base, id: courseId, ...payload })
        if (error) throw error
      }
      // đồng bộ danh sách học viên
      const current = new Map(records.filter((r) => r.course_id === courseId).map((r) => [r.employee_id, r]))
      const toAdd = [...picks].filter(([id]) => !current.has(id))
      const toRemove = [...current.values()].filter((r) => !picks.has(r.employee_id))
      const toUpdate = [...current.values()].filter((r) => picks.has(r.employee_id) && picks.get(r.employee_id) !== r.result)
      if (toAdd.length) {
        const { error } = await supabase
          .from('training_records')
          .insert(toAdd.map(([employee_id, result]) => ({ ...base, employee_id, course_id: courseId, result })))
        if (error) throw error
      }
      for (const r of toRemove) {
        const { error } = await supabase.from('training_records').delete().eq('id', r.id)
        if (error) throw error
      }
      for (const r of toUpdate) {
        const { error } = await supabase.from('training_records').update({ result: picks.get(r.employee_id) }).eq('id', r.id)
        if (error) throw error
      }
      await qc.invalidateQueries()
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (c: TrainingCourse) => {
    const n = counts.get(c.id)?.total ?? 0
    if (!window.confirm(`Xóa khóa "${c.name}"${n ? ` và ${n} lượt huấn luyện của học viên` : ''}?`)) return
    const { error } = await supabase.from('training_courses').delete().eq('id', c.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  return (
    <Card>
      <CardHeader
        title="Khóa huấn luyện"
        hint="Mỗi khóa ứng với một quyết định tổ chức / công nhận kết quả; chọn học viên một lần cho cả danh sách"
        action={
          canEdit && (
            <Button onClick={openCreate}>
              <Plus size={15} /> Ghi nhận khóa huấn luyện
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
        <Select value={cat} onChange={(e) => setCat(e.target.value)} className="max-w-[240px]" aria-label="Loại">
          <option value="">Tất cả loại huấn luyện</option>
          {ALL_TRAINING_CATEGORIES.map((k) => (
            <option key={k} value={k}>
              {TRAINING_CATEGORY_LABELS[k]}
            </option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => setYear(e.target.value)} className="max-w-[140px]" aria-label="Năm">
          <option value="">Mọi năm</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </Select>
      </div>
      {err && !form && (
        <div className="px-4 pt-3">
          <ErrorNote message={err} />
        </div>
      )}
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState title="Chưa có khóa huấn luyện" />
      ) : (
        <Table head={['Ngày', 'Loại', 'Tên khóa', 'Quyết định', 'Đơn vị HL', 'Giờ', 'Học viên', '']}>
          {rows.map((c) => {
            const n = counts.get(c.id)
            return (
              <tr key={c.id}>
                <Td className="whitespace-nowrap">{fmtDate(c.start_date)}</Td>
                <Td>
                  <Badge tone={c.category === 'pccc' ? 'red' : c.category === 'su_co_chat_thai' ? 'amber' : 'blue'}>
                    {TRAINING_CATEGORY_SHORT[c.category]}
                  </Badge>
                </Td>
                <Td className="max-w-[260px] font-medium">{c.name}</Td>
                <Td className="whitespace-nowrap">
                  <div>{c.decision_no ?? <span className="text-amber-700">Chưa có QĐ</span>}</div>
                  {c.decision_date && <div className="text-xs text-pine-800/45">{fmtDate(c.decision_date)}</div>}
                </Td>
                <Td className="max-w-[180px] text-pine-800/60">{c.provider ?? '—'}</Td>
                <Td className="text-pine-800/60">{c.hours ?? '—'}</Td>
                <Td className="whitespace-nowrap">
                  {n ? (
                    <span>
                      {n.pass}/{n.total} đạt
                    </span>
                  ) : (
                    <span className="text-pine-800/40">0</span>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    {canEdit && (
                      <>
                        <Button variant="outline" onClick={() => openEdit(c, true)}>
                          <Users size={15} /> Học viên
                        </Button>
                        <Button variant="ghost" aria-label="Sửa" onClick={() => openEdit(c)}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" aria-label="Xóa" onClick={() => remove(c)}>
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

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Khóa huấn luyện: ' + (form?.name ?? '') : 'Ghi nhận khóa huấn luyện'}
        wide
        footer={
          <>
            <span className="mr-auto text-sm text-pine-800/60">Đã chọn {picks.size} học viên</span>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={busy}>
              Lưu
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            {!form.withPeople && (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Loại huấn luyện" required>
                    <Select value={form.category} disabled={!!form.id} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {ALL_TRAINING_CATEGORIES.map((k) => (
                        <option key={k} value={k}>
                          {TRAINING_CATEGORY_LABELS[k]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Tên khóa" required className="sm:col-span-2">
                    <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Huấn luyện ATVSLĐ định kỳ – nhóm 4" />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Ngày huấn luyện" required>
                    <Input type="date" value={form.start_date ?? ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </Field>
                  <Field label="Đến ngày">
                    <Input type="date" value={form.end_date ?? ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </Field>
                  <Field label="Số quyết định">
                    <Input value={form.decision_no ?? ''} onChange={(e) => setForm({ ...form, decision_no: e.target.value })} placeholder="15/QĐ-…" />
                  </Field>
                  <Field label="Ngày quyết định">
                    <Input type="date" value={form.decision_date ?? ''} onChange={(e) => setForm({ ...form, decision_date: e.target.value })} />
                  </Field>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Đơn vị huấn luyện" className="sm:col-span-2">
                    <Input value={form.provider ?? ''} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
                  </Field>
                  <Field label="Số giờ">
                    <Input type="number" min={0} step="any" value={form.hours ?? ''} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
                  </Field>
                  <Field label="Hiệu lực (tháng)">
                    <Input
                      type="number"
                      min={0}
                      value={form.validity_months ?? ''}
                      onChange={(e) => setForm({ ...form, validity_months: e.target.value })}
                      placeholder={form.category === 'atvsld' ? 'Theo nhóm' : String(defaultValidityMonths(form.category) ?? 'Không hạn')}
                    />
                  </Field>
                </div>
                <Field label="Ghi chú">
                  <Textarea rows={2} value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
                </Field>
                <Note>{TRAINING_CATEGORY_BASIS[form.category]}</Note>
              </>
            )}
            <ParticipantPicker data={data} category={form.category} picks={picks} onChange={setPicks} />
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </Card>
  )
}

function ParticipantPicker({
  data,
  category,
  picks,
  onChange,
}: {
  data: PersonnelData
  category: string
  picks: Picks
  onChange: (p: Picks) => void
}) {
  const { employees, matrix, departments } = data
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const list = useMemo(
    () =>
      employees
        .filter((e) => e.status === 'active' || picks.has(e.id))
        .filter((e) => !dept || e.department === dept)
        .filter((e) => matchesSearch(e, q))
        .sort(byDeptThenCode),
    [employees, dept, q, picks]
  )
  const statusOf = (e: Employee) => matrix.get(e.id)?.[category]
  const set = (ids: string[], on: boolean) => {
    const m = new Map(picks)
    for (const id of ids) {
      if (on) m.set(id, m.get(id) ?? 'dat')
      else m.delete(id)
    }
    onChange(m)
  }
  const needIds = list.filter((e) => {
    const s = statusOf(e)
    return !s || !isValid(s) || s.state === 'sap_het'
  })

  return (
    <div className="rounded-lg border border-pine-800/10">
      <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 p-2.5">
        <span className="text-sm font-semibold text-pine-800">Học viên</span>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm…" className="max-w-[160px] py-1.5" />
        <Select value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-[200px] py-1.5" aria-label="Bộ phận">
          <option value="">Tất cả bộ phận</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <div className="ml-auto flex flex-wrap gap-1">
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => set(list.map((e) => e.id), true)}>
            Chọn tất cả ({list.length})
          </Button>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => set(needIds.map((e) => e.id), true)}>
            Chọn người cần HL ({needIds.length})
          </Button>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => set(list.map((e) => e.id), false)}>
            Bỏ chọn
          </Button>
        </div>
      </div>
      <ul className="max-h-[320px] divide-y divide-pine-800/5 overflow-y-auto">
        {list.map((e) => {
          const on = picks.has(e.id)
          const s = statusOf(e)
          return (
            <li key={e.id} className={cls('flex items-center gap-2 px-2.5 py-1.5', on && 'bg-viridian-50/50')}>
              <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={on} onChange={(ev) => set([e.id], ev.target.checked)} aria-label={e.full_name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm text-pine-800">
                  {e.full_name} <span className="text-xs text-pine-800/40">{e.code}</span>
                </div>
                <div className="truncate text-xs text-pine-800/45">{e.department ?? '—'}</div>
              </div>
              {s && <StateBadge status={s} />}
              {on && (
                <Select
                  value={picks.get(e.id)}
                  onChange={(ev) => {
                    const m = new Map(picks)
                    m.set(e.id, ev.target.value as 'dat' | 'khong_dat')
                    onChange(m)
                  }}
                  className="w-[110px] py-1 text-xs"
                  aria-label="Kết quả"
                >
                  <option value="dat">Đạt</option>
                  <option value="khong_dat">Không đạt</option>
                </Select>
              )}
            </li>
          )
        })}
        {list.length === 0 && <li className="px-3 py-6 text-center text-sm text-pine-800/45">Không có nhân sự phù hợp</li>}
      </ul>
    </div>
  )
}
