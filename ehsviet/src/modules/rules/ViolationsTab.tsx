// Ghi nhận vi phạm nội quy: đơn vị, cá nhân người lao động, nhà thầu – khách
import { useQueryClient } from '@tanstack/react-query'
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
  Kpi,
  Loading,
  Modal,
  Note,
  Select,
  Table,
  Td,
  Textarea,
  type Tone,
} from '../../components/UI'
import {
  MEASURE_LABELS,
  RULE_CATEGORY_LABELS,
  SEVERITY_LABELS,
  SUBJECT_TYPE_LABELS,
  VIOLATION_KIND_LABELS,
  VIOLATION_STATUS_LABELS,
} from '../../lib/constants'
import { repeatCount, subjectKey, suggestMeasure, type Violation } from '../../lib/rules'
import { supabase } from '../../lib/supabase'
import { daysUntil, errMsg, fmtDate, todayISO } from '../../lib/utils'
import { DepartmentInput } from '../personnel/shared'
import { currentMonth, monthLabel, monthRange, type RulesData } from './shared'

const STATUS_TONE: Record<string, Tone> = { open: 'red', fixing: 'amber', closed: 'green' }
/** Tên ngắn của nội quy để hiện trong bảng */
const ruleShort = (r: any) => (!r ? null : r.code ? r.code : r.title.length > 42 ? r.title.slice(0, 40) + '…' : r.title)
const KIND_TONE: Record<string, Tone> = { thong_so: 'red', khu_vuc: 'amber', diem_thu_gom: 'blue', hanh_vi: 'gray' }

export default function ViolationsTab({ data, base, canEdit }: { data: RulesData; base: any; canEdit: boolean }) {
  const qc = useQueryClient()
  const { violations, rules, employees, departments, contractors, loading } = data
  const [month, setMonth] = useState(currentMonth())
  const [dept, setDept] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const empById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees])
  const ruleById = useMemo(() => new Map(rules.map((r: any) => [r.id, r])), [rules])

  const rows = useMemo(() => {
    const range = month ? monthRange(month) : null
    const s = q.trim().toLowerCase()
    return violations.filter((v) => {
      if (range && (v.violation_date < range.from || v.violation_date > range.to)) return false
      if (dept && v.department !== dept) return false
      if (kind && v.kind !== kind) return false
      if (status && v.status !== status) return false
      if (s) {
        const who = (v.employee_id ? empById.get(v.employee_id)?.full_name : v.person_name) ?? v.contractor_name ?? ''
        if (![v.description, v.location, who, v.department].some((x) => (x ?? '').toLowerCase().includes(s))) return false
      }
      return true
    })
  }, [violations, month, dept, kind, status, q, empById])

  const openCount = rows.filter((v) => v.status !== 'closed').length
  const unitCount = new Set(rows.filter((v) => v.department && v.counts_for_unit).map((v) => v.department)).size
  const repeaters = useMemo(() => {
    const keys = new Set<string>()
    for (const v of rows) {
      const k = subjectKey(v)
      if (k && repeatCount(violations, v, v.violation_date) >= 2) keys.add(k)
    }
    return keys.size
  }, [rows, violations])

  const who = (v: Violation) => {
    if (v.subject_type === 'ca_nhan') {
      const e = v.employee_id ? empById.get(v.employee_id) : null
      return e ? `${e.full_name}${e.code ? ' (' + e.code + ')' : ''}` : v.person_name ?? 'Cá nhân'
    }
    if (v.subject_type === 'nha_thau') return v.contractor_name ?? 'Nhà thầu'
    return null
  }

  const openCreate = () => {
    setErr('')
    setForm({
      violation_date: todayISO(),
      subject_type: 'don_vi',
      category: 'moi_truong',
      kind: 'khu_vuc',
      severity: 'nhe',
      status: 'open',
      counts_for_unit: true,
      community_impact: false,
    })
  }

  const nth = form ? repeatCount(violations, form, form.violation_date || todayISO()) : 0
  const suggestion = form ? suggestMeasure(form.subject_type, nth) : null

  const submit = async () => {
    setErr('')
    if (!form.description?.trim()) return setErr('Nhập nội dung vi phạm.')
    if (form.subject_type === 'ca_nhan' && !form.employee_id && !form.person_name?.trim()) return setErr('Chọn người lao động hoặc nhập họ tên.')
    if (form.subject_type === 'nha_thau' && !form.contractor_name?.trim()) return setErr('Nhập tên nhà thầu / khách.')
    if (form.counts_for_unit && !form.department?.trim()) return setErr('Nhập đơn vị chịu trách nhiệm (để tính xếp loại tháng) hoặc bỏ chọn "Tính vào xếp loại".')
    setBusy(true)
    try {
      const closing = form.status === 'closed'
      const payload = {
        violation_date: form.violation_date || todayISO(),
        rule_id: form.rule_id || null,
        category: form.category,
        kind: form.kind,
        subject_type: form.subject_type,
        department: form.department?.trim() || null,
        employee_id: form.subject_type === 'ca_nhan' ? form.employee_id || null : null,
        person_name: form.subject_type === 'ca_nhan' && !form.employee_id ? form.person_name?.trim() || null : null,
        contractor_name: form.subject_type === 'nha_thau' ? form.contractor_name?.trim() || null : null,
        location: form.location?.trim() || null,
        description: form.description.trim(),
        record_no: form.record_no?.trim() || null,
        evidence_url: form.evidence_url?.trim() || null,
        severity: form.severity,
        community_impact: !!form.community_impact,
        counts_for_unit: !!form.counts_for_unit,
        measure: form.measure || null,
        corrective_action: form.corrective_action?.trim() || null,
        responsible: form.responsible?.trim() || null,
        due_date: form.due_date || null,
        status: form.status,
        closed_date: closing ? form.closed_date || todayISO() : null,
      }
      const { error } = form.id
        ? await supabase.from('rule_violations').update(payload).eq('id', form.id)
        : await supabase.from('rule_violations').insert({ ...base, ...payload })
      if (error) throw error
      await qc.invalidateQueries()
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const close = async (v: Violation) => {
    const { error } = await supabase.from('rule_violations').update({ status: 'closed', closed_date: todayISO() }).eq('id', v.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const remove = async (v: Violation) => {
    if (!window.confirm('Xóa bản ghi vi phạm này?')) return
    const { error } = await supabase.from('rule_violations').delete().eq('id', v.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const setSubject = (subject_type: string) =>
    setForm({ ...form, subject_type, counts_for_unit: subject_type !== 'nha_thau', measure: '' })

  const pickEmployee = (id: string) => {
    const e = empById.get(id)
    setForm({ ...form, employee_id: id, department: e?.department ?? form.department })
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Kpi label={month ? 'Vi phạm ' + monthLabel(month) : 'Vi phạm (mọi thời gian)'} value={rows.length} tone="blue" />
        <Kpi label="Chưa khắc phục xong" value={openCount} tone={openCount ? 'red' : 'green'} />
        <Kpi label="Đơn vị có vi phạm" value={unitCount} sub="tính vào xếp loại tháng" tone={unitCount ? 'amber' : 'green'} />
        <Kpi label="Đối tượng tái phạm" value={repeaters} sub="≥ 2 lần trong 12 tháng" tone={repeaters ? 'red' : 'green'} />
      </div>

      <Card>
        <CardHeader
          title="Vi phạm nội quy nội bộ"
          hint="Lập biên bản (MT-QT03-BM02), xác định đơn vị chịu trách nhiệm, hình thức xử lý và hạn khắc phục"
          action={
            canEdit && (
              <Button onClick={openCreate}>
                <Plus size={15} /> Ghi nhận vi phạm
              </Button>
            )
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="max-w-[170px]" aria-label="Tháng" />
          <Button variant="ghost" className="px-2 text-xs" onClick={() => setMonth('')}>
            Mọi thời gian
          </Button>
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-[210px]" aria-label="Đơn vị">
            <option value="">Tất cả đơn vị</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select value={kind} onChange={(e) => setKind(e.target.value)} className="max-w-[230px]" aria-label="Loại">
            <option value="">Mọi loại</option>
            {Object.entries(VIOLATION_KIND_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[180px]" aria-label="Trạng thái">
            <option value="">Mọi trạng thái</option>
            {Object.entries(VIOLATION_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm nội dung, người…" className="max-w-[200px]" />
        </div>
        {err && !form && (
          <div className="px-4 pt-3">
            <ErrorNote message={err} />
          </div>
        )}
        {rows.length === 0 ? (
          <EmptyState title="Không có vi phạm trong kỳ" hint="Đơn vị không có lần không đạt nào được xếp loại A" />
        ) : (
          <Table head={['Ngày', 'Đơn vị / đối tượng', 'Nội dung', 'Loại', 'Xử lý', 'Khắc phục', 'Trạng thái', '']}>
            {rows.map((v) => {
              const person = who(v)
              const n = subjectKey(v) ? repeatCount(violations, v, v.violation_date) : 0
              const overdue = v.status !== 'closed' && v.due_date && daysUntil(v.due_date) < 0
              return (
                <tr key={v.id}>
                  <Td className="whitespace-nowrap">{fmtDate(v.violation_date)}</Td>
                  <Td className="min-w-[160px]">
                    <div className="font-medium">{v.department ?? '—'}</div>
                    {person && (
                      <div className="text-xs text-pine-800/60">
                        {v.subject_type === 'nha_thau' ? 'Nhà thầu' : 'Cá nhân'}: {person}
                        {n >= 2 && <span className="ml-1 font-semibold text-red-700">· lần {n}/12 tháng</span>}
                      </div>
                    )}
                    {!v.counts_for_unit && <div className="text-[11px] text-pine-800/40">Không tính xếp loại đơn vị</div>}
                  </Td>
                  <Td className="min-w-[240px] max-w-[340px]">
                    <div>{v.description}</div>
                    <div className="text-xs text-pine-800/45">
                      {[v.location, v.rule_id ? ruleShort(ruleById.get(v.rule_id)) : null, v.record_no ? 'BB ' + v.record_no : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    {v.community_impact && <Badge tone="red">Ảnh hưởng khu dân cư</Badge>}
                    {v.evidence_url && (
                      <a href={v.evidence_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-viridian-700 underline">
                        Biên bản / ảnh <ExternalLink size={12} />
                      </a>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={KIND_TONE[v.kind]}>{VIOLATION_KIND_LABELS[v.kind]}</Badge>
                    <div className="mt-1 text-xs text-pine-800/45">{RULE_CATEGORY_LABELS[v.category]}</div>
                  </Td>
                  <Td className="max-w-[180px] text-xs text-pine-800/70">{v.measure ? MEASURE_LABELS[v.subject_type]?.[v.measure] ?? v.measure : '—'}</Td>
                  <Td className="min-w-[170px] max-w-[240px] text-xs text-pine-800/70">
                    {v.corrective_action ?? '—'}
                    {(v.responsible || v.due_date) && (
                      <div className={overdue ? 'text-red-700' : 'text-pine-800/45'}>
                        {v.responsible}
                        {v.due_date ? ' · hạn ' + fmtDate(v.due_date) : ''}
                        {overdue ? ' (quá hạn)' : ''}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[v.status]}>{VIOLATION_STATUS_LABELS[v.status]}</Badge>
                  </Td>
                  <Td className="text-right">
                    {canEdit && (
                      <div className="flex justify-end gap-1">
                        {v.status !== 'closed' && (
                          <Button variant="ghost" aria-label="Đã khắc phục" title="Đánh dấu đã khắc phục" onClick={() => close(v)}>
                            <CheckCircle2 size={15} />
                          </Button>
                        )}
                        <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...v, measure: v.measure ?? '' })}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" aria-label="Xóa" onClick={() => remove(v)}>
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
        title={form?.id ? 'Sửa vi phạm' : 'Ghi nhận vi phạm nội quy'}
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
        {form && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Ngày" required>
                <Input type="date" value={form.violation_date ?? ''} onChange={(e) => setForm({ ...form, violation_date: e.target.value })} />
              </Field>
              <Field label="Nội quy / quy định vi phạm" className="sm:col-span-3">
                <Select value={form.rule_id ?? ''} onChange={(e) => {
                  const r = rules.find((x: any) => x.id === e.target.value)
                  setForm({ ...form, rule_id: e.target.value, category: r?.category && r.category !== 'lao_dong' ? r.category : form.category })
                }}>
                  <option value="">— Chọn —</option>
                  {rules.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.code ? r.code + ' – ' : ''}
                      {r.title}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Lĩnh vực">
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(RULE_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Loại lần không đạt">
                <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                  {Object.entries(VIOLATION_KIND_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Mức độ">
                <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                  {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="rounded-lg border border-pine-800/10 p-3">
              <div className="mb-2 flex flex-wrap gap-1">
                {Object.entries(SUBJECT_TYPE_LABELS).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setSubject(k)}
                    className={
                      'rounded-lg px-3 py-1.5 text-sm font-medium ' +
                      (form.subject_type === k ? 'bg-pine-900 text-white' : 'text-pine-800/60 hover:bg-pine-800/5')
                    }
                  >
                    {v}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {form.subject_type === 'ca_nhan' && (
                  <>
                    <Field label="Người lao động">
                      <Select value={form.employee_id ?? ''} onChange={(e) => pickEmployee(e.target.value)}>
                        <option value="">— Ngoài danh sách (nhập họ tên) —</option>
                        {employees
                          .filter((e) => e.status === 'active')
                          .map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.full_name} {e.code ? '(' + e.code + ')' : ''} – {e.department ?? ''}
                            </option>
                          ))}
                      </Select>
                    </Field>
                    {!form.employee_id && (
                      <Field label="Họ tên">
                        <Input value={form.person_name ?? ''} onChange={(e) => setForm({ ...form, person_name: e.target.value })} />
                      </Field>
                    )}
                  </>
                )}
                {form.subject_type === 'nha_thau' && (
                  <Field label="Nhà thầu / khách" required>
                    <Input list="ehs-contractors" value={form.contractor_name ?? ''} onChange={(e) => setForm({ ...form, contractor_name: e.target.value })} />
                    <datalist id="ehs-contractors">
                      {contractors.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </Field>
                )}
                <Field label={form.subject_type === 'nha_thau' ? 'Đơn vị quản lý khu vực / giám sát nhà thầu' : 'Đơn vị chịu trách nhiệm'}>
                  <DepartmentInput value={form.department ?? ''} onChange={(v) => setForm({ ...form, department: v })} departments={departments} />
                </Field>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-pine-800">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={!!form.counts_for_unit} onChange={(e) => setForm({ ...form, counts_for_unit: e.target.checked })} />
                  Tính vào xếp loại tháng của đơn vị
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 accent-red-600" checked={!!form.community_impact} onChange={(e) => setForm({ ...form, community_impact: e.target.checked })} />
                  Sự cố ảnh hưởng khu dân cư
                </label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Vị trí">
                <Input value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </Field>
              <Field label="Số biên bản">
                <Input value={form.record_no ?? ''} onChange={(e) => setForm({ ...form, record_no: e.target.value })} placeholder="MT-QT03-BM02 …" />
              </Field>
              <Field label="Liên kết ảnh / biên bản">
                <Input value={form.evidence_url ?? ''} onChange={(e) => setForm({ ...form, evidence_url: e.target.value })} placeholder="https://…" />
              </Field>
            </div>
            <Field label="Nội dung vi phạm" required>
              <Textarea rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Hình thức xử lý">
                <Select value={form.measure ?? ''} onChange={(e) => setForm({ ...form, measure: e.target.value })}>
                  <option value="">— Chưa xác định —</option>
                  {Object.entries(MEASURE_LABELS[form.subject_type] ?? {}).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Hành động khắc phục">
                <Input value={form.corrective_action ?? ''} onChange={(e) => setForm({ ...form, corrective_action: e.target.value })} />
              </Field>
            </div>
            {suggestion && (
              <Note tone="blue">
                Đối tượng này vi phạm <b>lần {nth}</b> trong 12 tháng. Gợi ý: {suggestion.note}.{' '}
                {form.measure !== suggestion.key && (
                  <button className="font-medium underline" onClick={() => setForm({ ...form, measure: suggestion.key })}>
                    Áp dụng gợi ý
                  </button>
                )}
              </Note>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Người chịu trách nhiệm khắc phục">
                <Input value={form.responsible ?? ''} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
              </Field>
              <Field label="Hạn khắc phục">
                <Input type="date" value={form.due_date ?? ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </Field>
              <Field label="Trạng thái">
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {Object.entries(VIOLATION_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Note>
              {form.subject_type === 'nha_thau'
                ? 'Nhà thầu, khách: xử lý theo điều khoản hợp đồng (tạm dừng công việc, yêu cầu thay người, phạt vi phạm hợp đồng trong mức pháp luật cho phép, bồi thường thiệt hại); doanh nghiệp không có thẩm quyền phạt hành chính.'
                : 'Người lao động: xử lý kỷ luật theo Nội quy lao động đã đăng ký (BLLĐ 2019 Điều 124: khiển trách; kéo dài thời hạn nâng lương ≤ 6 tháng; cách chức; sa thải) và đúng trình tự Điều 122. Không phạt tiền, cắt lương (Điều 127). Kết quả xếp loại đơn vị chỉ là căn cứ đánh giá trong Quy chế trả lương, thưởng.'}
            </Note>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </div>
  )
}
