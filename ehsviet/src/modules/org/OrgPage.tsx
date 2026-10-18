// Tổ chức bộ máy HSE theo quy định: số người tối thiểu theo số lao động và ngành nghề, so với phân công thực tế
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Kpi, Loading, Modal, Note, Select, Table, Td, Textarea } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { HSE_ROLE_LABELS, isActiveRole, reqLabel, reqTone, ROLE_GROUPS, ROLE_TRAINING, type HseRole, type HseRoleKey } from '../../lib/org'
import { supabase } from '../../lib/supabase'
import { isValid } from '../../lib/training'
import { cls, errMsg, fmtDate } from '../../lib/utils'
import { byDeptThenCode } from '../personnel/shared'
import { useOrgRequirements } from './useOrgRequirements'

export default function OrgPage() {
  const qc = useQueryClient()
  const { profile, facilityId, facility, role, refresh } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const { people, roles, active, training, headcount, headcountEntered, reqs } = useOrgRequirements(fid)
  const [params, setParams] = useState<any>({})
  const [open, setOpen] = useState<string | null>(null)
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState('')

  useEffect(() => {
    setParams({ headcount: facility?.headcount ?? '', hazardous_sector: !!facility?.hazardous_sector, shifts: facility?.shifts ?? '' })
  }, [facility])

  const stats = useMemo(() => {
    const mandatory = reqs.filter((r) => r.required != null && r.key !== 'so_cuu')
    const ok = mandatory.filter((r) => r.ok).length
    const missing = mandatory.reduce((s, r) => s + Math.max(0, (r.required ?? 0) - r.actual), 0)
    const activeRoles = (roles.data ?? []).filter((r) => isActiveRole(r))
    const untrained = new Set(
      activeRoles
        .filter((r) => {
          const cat = ROLE_TRAINING[r.role]
          const s = cat ? training.get(r.employee_id)?.[cat] : null
          return cat && (!s || !isValid(s))
        })
        .map((r) => r.employee_id)
    ).size
    return { mandatory: mandatory.length, ok, missing, untrained, assigned: new Set(activeRoles.map((r) => r.employee_id)).size }
  }, [reqs, roles.data, training])

  const saveParams = async () => {
    setErr('')
    setSaved('')
    setBusy(true)
    try {
      const { error } = await supabase
        .from('facilities')
        .update({
          headcount: params.headcount === '' ? null : Math.max(0, Math.round(Number(params.headcount))),
          hazardous_sector: !!params.hazardous_sector,
          shifts: params.shifts === '' ? null : Number(params.shifts),
        })
        .eq('id', fid)
      if (error) throw error
      await refresh()
      setSaved('Đã lưu thông số cơ sở.')
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const submitRole = async () => {
    setErr('')
    const ids: string[] = form.id ? [form.employee_id] : Object.keys(form.picked ?? {}).filter((k) => form.picked[k])
    if (!form.role) return setErr('Chọn vai trò.')
    if (!ids.length || !ids[0]) return setErr('Chọn người được phân công.')
    if (form.end_date && form.start_date && form.end_date < form.start_date) return setErr('Ngày kết thúc trước ngày bắt đầu.')
    setBusy(true)
    try {
      const values = {
        role: form.role,
        decision_no: form.decision_no?.trim() || null,
        decision_date: form.decision_date || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        qualification: form.qualification?.trim() || null,
        note: form.note?.trim() || null,
      }
      if (form.id) {
        const { error } = await supabase.from('hse_roles').update({ ...values, employee_id: form.employee_id }).eq('id', form.id)
        if (error) throw error
      } else {
        const existing = new Set((roles.data ?? []).filter((r) => r.role === form.role && isActiveRole(r)).map((r) => r.employee_id))
        const rows = ids.filter((id) => !existing.has(id)).map((employee_id) => ({ ...base, employee_id, ...values }))
        if (rows.length) {
          const { error } = await supabase.from('hse_roles').insert(rows)
          if (error) throw error
        }
      }
      await qc.invalidateQueries()
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const removeRole = async (r: HseRole) => {
    if (!window.confirm('Xóa phân công này? Nếu người đó thôi đảm nhiệm, nên ghi "Đến ngày" để giữ lịch sử.')) return
    const { error } = await supabase.from('hse_roles').delete().eq('id', r.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const empById = useMemo(() => new Map(people.employees.map((e) => [e.id, e])), [people.employees])
  const roleRows = useMemo(
    () =>
      (roles.data ?? [])
        .map((r) => ({ r, e: empById.get(r.employee_id) }))
        .filter((x) => x.e)
        .sort((a, b) => Object.keys(HSE_ROLE_LABELS).indexOf(a.r.role) - Object.keys(HSE_ROLE_LABELS).indexOf(b.r.role) || byDeptThenCode(a.e!, b.e!)),
    [roles.data, empById]
  )

  const trainedDot = (employeeId: string, roleKey: HseRoleKey) => {
    const cat = ROLE_TRAINING[roleKey]
    if (!cat) return null
    const s = training.get(employeeId)?.[cat]
    const ok = !!s && isValid(s)
    return <span title={ok ? 'Huấn luyện còn hiệu lực' : 'Huấn luyện chưa còn hiệu lực'} className={cls('inline-block h-2 w-2 rounded-full', ok ? 'bg-viridian-500' : 'bg-red-500')} />
  }

  if (people.loading || roles.isLoading) return <Loading />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Tổ chức bộ máy HSE</h1>
        <p className="text-sm text-pine-800/50">
          Người làm công tác ATVSLĐ, y tế, Hội đồng ATVSLĐ, an toàn vệ sinh viên, đội PCCC cơ sở, môi trường, quản lý năng lượng — theo số lao động và ngành nghề
        </p>
      </div>
      {err && !form && <ErrorNote message={err} />}

      <div className="flex flex-wrap gap-3">
        <Kpi label="Tổng số lao động" value={headcount} sub={headcountEntered ? `nhập tay · phần mềm có ${active.length} người` : 'đếm từ danh sách nhân sự'} tone="blue" />
        <Kpi label="Yêu cầu bắt buộc đạt" value={`${stats.ok}/${stats.mandatory}`} tone={stats.ok === stats.mandatory ? 'green' : 'red'} />
        <Kpi label="Còn thiếu" value={stats.missing + ' người'} sub="theo mức tối thiểu" tone={stats.missing ? 'red' : 'green'} />
        <Kpi label="Người được phân công" value={stats.assigned} sub={stats.untrained ? `${stats.untrained} người chưa còn hạn huấn luyện` : 'huấn luyện còn hiệu lực'} tone={stats.untrained ? 'amber' : 'green'} />
      </div>

      <Card>
        <CardHeader title="Thông số cơ sở" hint="Dùng để tính số người tối thiểu phải bố trí" />
        <div className="flex flex-wrap items-end gap-3 px-4 py-4">
          <Field label="Tổng số lao động thực tế" className="w-48">
            <Input
              type="number"
              min={0}
              value={params.headcount ?? ''}
              onChange={(e) => setParams({ ...params, headcount: e.target.value })}
              placeholder={`Trống = ${active.length} (theo danh sách)`}
              disabled={!canEdit}
            />
          </Field>
          <Field label="Số ca làm việc" className="w-36">
            <Select value={params.shifts ?? ''} onChange={(e) => setParams({ ...params, shifts: e.target.value })} disabled={!canEdit}>
              <option value="">—</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} ca
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex max-w-xl items-start gap-2 pb-2 text-sm text-pine-800">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 accent-viridian-600"
              checked={!!params.hazardous_sector}
              onChange={(e) => setParams({ ...params, hazardous_sector: e.target.checked })}
              disabled={!canEdit}
            />
            <span>
              Ngành nghề thuộc điểm a khoản 1 Điều 36 NĐ 39/2016/NĐ-CP (khai khoáng, sản xuất hóa chất – gồm phân bón, kim loại, khoáng phi kim, xây dựng, đóng tàu, điện)
            </span>
          </label>
          {canEdit && (
            <Button onClick={saveParams} disabled={busy}>
              Lưu thông số
            </Button>
          )}
          {saved && <span className="pb-2 text-sm text-viridian-700">{saved}</span>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Yêu cầu bộ máy theo quy định" hint="Bấm từng dòng để xem người đảm nhiệm và các điểm cần lưu ý" />
        <ul className="divide-y divide-pine-800/5">
          {reqs.map((r) => {
            const isOpen = open === r.key
            return (
              <li key={r.key}>
                <button type="button" onClick={() => setOpen(isOpen ? null : r.key)} className="flex w-full flex-wrap items-start gap-3 px-4 py-3 text-left hover:bg-pine-800/[0.02]">
                  <span className="mt-0.5 text-pine-800/40">{isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
                  <div className="min-w-[200px] flex-1">
                    <div className="font-medium text-pine-800">{r.title}</div>
                    <div className="text-xs text-pine-800/55">{r.requiredText}</div>
                  </div>
                  <div className="w-24 text-sm text-pine-800">
                    Hiện có <b>{r.actual}</b>
                    {r.required != null && <span className="text-pine-800/50">/{r.required}</span>}
                  </div>
                  <Badge tone={reqTone(r)}>{reqLabel(r)}</Badge>
                </button>
                {isOpen && (
                  <div className="space-y-2 px-11 pb-3 text-sm">
                    <div className="text-xs text-pine-800/60">
                      <b>Căn cứ:</b> {r.basis}
                    </div>
                    {r.penalty && (
                      <div className="text-xs text-pine-800/60">
                        <b>Chế tài:</b> {r.penalty}
                      </div>
                    )}
                    {r.issues.map((x) => (
                      <div key={x} className="text-xs text-amber-800">
                        • {x}
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-1">
                      {r.people.length ? (
                        r.people.map((e) => (
                          <Badge key={e.id} tone="gray">
                            {e.full_name} · {e.department ?? '—'}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-pine-800/45">Chưa phân công</span>
                      )}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Sơ đồ bộ máy HSE" hint="Chấm xanh: huấn luyện bắt buộc của vai trò còn hiệu lực; chấm đỏ: cần huấn luyện" />
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          {ROLE_GROUPS.map((g) => (
            <div key={g.key} className="rounded-lg border border-pine-800/10 p-3">
              <div className="text-sm font-semibold text-pine-800">{g.label}</div>
              {g.roles.map((rk) => {
                const list = roleRows.filter(({ r }) => r.role === rk && isActiveRole(r))
                return (
                  <div key={rk} className="mt-2">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-pine-800/45">
                      {HSE_ROLE_LABELS[rk]} ({list.length})
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {list.length ? (
                        list.map(({ r, e }) => (
                          <span key={r.id} className="inline-flex items-center gap-1 rounded-full border border-pine-800/10 px-2 py-0.5 text-xs text-pine-800">
                            {trainedDot(e!.id, rk)}
                            {e!.full_name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-pine-800/35">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Phân công vai trò"
          hint="Theo quyết định phân công / thành lập; ghi ngày kết thúc khi thôi đảm nhiệm để giữ lịch sử"
          action={
            canEdit && (
              <Button onClick={() => setForm({ role: 'pccc_doi_vien', picked: {} })} disabled={active.length === 0}>
                <Plus size={15} /> Phân công
              </Button>
            )
          }
        />
        {roleRows.length === 0 ? (
          <EmptyState title="Chưa phân công vai trò HSE" />
        ) : (
          <Table head={['Vai trò', 'Người đảm nhiệm', 'Quyết định', 'Thời gian', 'Trình độ, chứng chỉ', '']}>
            {roleRows.map(({ r, e }) => (
              <tr key={r.id} className={isActiveRole(r) ? '' : 'opacity-50'}>
                <Td className="min-w-[200px] text-pine-800/80">{HSE_ROLE_LABELS[r.role]}</Td>
                <Td className="min-w-[180px]">
                  <div className="flex items-center gap-1.5 font-medium text-pine-800">
                    {trainedDot(e!.id, r.role)}
                    {e!.full_name}
                  </div>
                  <div className="text-xs text-pine-800/45">{e!.department ?? '—'}</div>
                </Td>
                <Td className="whitespace-nowrap text-pine-800/70">
                  {r.decision_no ?? '—'}
                  {r.decision_date && <div className="text-xs text-pine-800/45">{fmtDate(r.decision_date)}</div>}
                </Td>
                <Td className="whitespace-nowrap text-pine-800/70">
                  {fmtDate(r.start_date)} → {r.end_date ? fmtDate(r.end_date) : 'nay'}
                </Td>
                <Td className="min-w-[160px] text-xs text-pine-800/60">
                  {r.qualification ?? '—'}
                  {r.note && <div>{r.note}</div>}
                </Td>
                <Td className="text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...r })}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" aria-label="Xóa" onClick={() => removeRole(r)}>
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

      <Note>
        Môi trường: pháp luật không định biên số người chuyên trách; cơ sở phải có bộ phận hoặc nhân sự phụ trách BVMT và người vận hành công trình xử lý được
        đào tạo. PCCC: không bắt buộc chuyên trách – đội PCCC cơ sở gồm người kiêm nhiệm, được huấn luyện nghiệp vụ; biên chế đội đối chiếu NĐ 105/2025/NĐ-CP.
        Mức "(đối chiếu)" là điểm cần kiểm tra nguyên văn trước khi dùng làm căn cứ chính thức.
      </Note>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa phân công' : 'Phân công vai trò HSE'}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submitRole} disabled={busy}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Vai trò" required>
            <Select value={form?.role ?? ''} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {Object.entries(HSE_ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          {form?.id ? (
            <Field label="Người đảm nhiệm" required>
              <Select value={form?.employee_id ?? ''} onChange={(e) => setForm({ ...form, employee_id: e.target.value })}>
                {people.employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.full_name} · {e.department ?? '—'}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <Field label="Người được phân công (chọn một hoặc nhiều người)" required>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-pine-800/15 p-2">
                {[...active].sort(byDeptThenCode).map((e) => {
                  const has = (roles.data ?? []).some((r) => r.employee_id === e.id && r.role === form?.role && isActiveRole(r))
                  return (
                    <label key={e.id} className={cls('flex items-center gap-2 py-0.5 text-sm', has ? 'text-pine-800/40' : 'text-pine-800')}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-viridian-600"
                        checked={has || !!form?.picked?.[e.id]}
                        disabled={has}
                        onChange={(ev) => setForm({ ...form, picked: { ...(form?.picked ?? {}), [e.id]: ev.target.checked } })}
                      />
                      {e.full_name} <span className="text-xs text-pine-800/45">· {e.department ?? '—'}</span>
                      {has && <span className="text-xs">(đã có vai trò này)</span>}
                    </label>
                  )
                })}
              </div>
            </Field>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Số quyết định">
              <Input value={form?.decision_no ?? ''} onChange={(e) => setForm({ ...form, decision_no: e.target.value })} />
            </Field>
            <Field label="Ngày quyết định">
              <Input type="date" value={form?.decision_date ?? ''} onChange={(e) => setForm({ ...form, decision_date: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Từ ngày">
              <Input type="date" value={form?.start_date ?? ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </Field>
            <Field label="Đến ngày (thôi đảm nhiệm)">
              <Input type="date" value={form?.end_date ?? ''} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </Field>
          </div>
          <Field label="Trình độ, chứng chỉ">
            <Input value={form?.qualification ?? ''} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="VD: trung cấp y; chứng chỉ quản lý năng lượng số…" />
          </Field>
          <Field label="Ghi chú">
            <Textarea rows={2} value={form?.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>
    </div>
  )
}
