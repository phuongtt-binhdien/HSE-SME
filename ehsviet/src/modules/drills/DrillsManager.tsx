// Diễn tập, thực tập phương án: PCCC & CNCH, ứng phó sự cố môi trường – chất thải, tràn dầu, hóa chất, sơ cứu.
// Ghi danh sách người lao động tham gia (có mặt / vắng, nhiệm vụ) để theo dõi diễn tập theo từng người.
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Modal, Note, Select, Table, Td, Textarea } from '../../components/UI'
import { useList } from '../../hooks/useCrud'
import { DRILL_COLUMNS, DRILL_KIND_LABELS, DRILL_RESULT_LABELS, DRILL_ROLES, DRILL_STATUS_LABELS, type Drill, type DrillParticipant } from '../../lib/drills'
import { supabase } from '../../lib/supabase'
import type { Employee } from '../../lib/training'
import { cls, errMsg, fmtDate, todayISO } from '../../lib/utils'

export function useDrillData(fid: string) {
  const drills = useList<Drill>('drills', { match: { facility_id: fid }, order: 'drill_date', ascending: false, enabled: !!fid })
  const participants = useList<DrillParticipant>('drill_participants', { match: { facility_id: fid }, order: 'created_at', ascending: true, enabled: !!fid })
  return {
    drills: drills.data ?? [],
    participants: participants.data ?? [],
    loading: drills.isLoading || participants.isLoading,
  }
}

const KIND_TONE: Record<string, 'red' | 'blue' | 'amber' | 'green' | 'gray'> = {
  PCCC: 'red',
  su_co_moi_truong: 'green',
  tran_dau: 'green',
  su_co_hoa_chat: 'amber',
  cap_cuu_TNLD: 'blue',
}

/* ---------- Danh sách người tham gia ---------- */
function RosterModal({
  drill,
  employees,
  participants,
  base,
  onClose,
}: {
  drill: Drill | null
  employees: Employee[]
  participants: DrillParticipant[]
  base: Record<string, string>
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [sel, setSel] = useState<Record<string, { on: boolean; attended: boolean; role: string }>>({})
  const [q, setQ] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!drill) return
    const init: Record<string, { on: boolean; attended: boolean; role: string }> = {}
    for (const p of participants.filter((x) => x.drill_id === drill.id)) init[p.employee_id] = { on: true, attended: p.attended, role: p.role ?? '' }
    setSel(init)
    setQ('')
    setErr('')
  }, [drill, participants])

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = employees
      .filter((e) => e.status === 'active' || sel[e.id]?.on)
      .filter((e) => !s || e.full_name.toLowerCase().includes(s) || (e.code ?? '').toLowerCase().includes(s) || (e.department ?? '').toLowerCase().includes(s))
    const m = new Map<string, Employee[]>()
    for (const e of list) {
      const k = e.department ?? '—'
      const arr = m.get(k)
      if (arr) arr.push(e)
      else m.set(k, [e])
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], 'vi'))
  }, [employees, q, sel])

  if (!drill) return null
  const planned = drill.status === 'planned'
  const chosen = Object.values(sel).filter((x) => x.on)
  const toggle = (id: string, on: boolean) => setSel({ ...sel, [id]: { on, attended: sel[id]?.attended ?? true, role: sel[id]?.role ?? '' } })
  const setDept = (list: Employee[], on: boolean) => {
    const next = { ...sel }
    for (const e of list) next[e.id] = { on, attended: next[e.id]?.attended ?? true, role: next[e.id]?.role ?? '' }
    setSel(next)
  }

  const save = async () => {
    setErr('')
    setBusy(true)
    try {
      const existing = participants.filter((x) => x.drill_id === drill.id)
      const keep = new Set(Object.entries(sel).filter(([, v]) => v.on).map(([id]) => id))
      const removeIds = existing.filter((p) => !keep.has(p.employee_id)).map((p) => p.id)
      if (removeIds.length) {
        const r = await supabase.from('drill_participants').delete().in('id', removeIds)
        if (r.error) throw r.error
      }
      for (const [employee_id, v] of Object.entries(sel)) {
        if (!v.on) continue
        const cur = existing.find((p) => p.employee_id === employee_id)
        const row = { attended: planned ? true : v.attended, role: v.role.trim() || null }
        const r = cur
          ? await supabase.from('drill_participants').update(row).eq('id', cur.id)
          : await supabase.from('drill_participants').insert({ ...base, drill_id: drill.id, employee_id, ...row })
        if (r.error) throw r.error
      }
      // số người tham gia của đợt = số người có mặt
      const attended = Object.values(sel).filter((v) => v.on && (planned || v.attended)).length
      const r = await supabase.from('drills').update({ participants: planned ? null : attended }).eq('id', drill.id)
      if (r.error) throw r.error
      await qc.invalidateQueries()
      onClose()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={!!drill}
      onClose={onClose}
      title={`Người tham gia: ${DRILL_KIND_LABELS[drill.kind] ?? drill.kind} – ${fmtDate(drill.drill_date)}`}
      wide
      footer={
        <>
          <div className="mr-auto text-sm text-pine-800/60">
            {chosen.length} người{planned ? ' dự kiến' : ` · ${chosen.filter((x) => x.attended).length} có mặt`}
          </div>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={save} disabled={busy}>
            Lưu danh sách
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, mã, bộ phận…" />
        {planned && <Note tone="blue">Đợt diễn tập đang ở trạng thái "Kế hoạch": danh sách là người dự kiến tham gia. Sau khi diễn tập, đổi trạng thái và đánh dấu người vắng.</Note>}
        <datalist id="drill-roles">
          {DRILL_ROLES.map((r) => (
            <option key={r} value={r} />
          ))}
        </datalist>
        {groups.map(([dept, list]) => {
          const allOn = list.every((e) => sel[e.id]?.on)
          return (
            <div key={dept} className="rounded-lg border border-pine-800/10">
              <div className="flex items-center justify-between border-b border-pine-800/10 bg-pine-800/[0.03] px-3 py-1.5">
                <span className="text-xs font-semibold text-pine-800/70">{dept}</span>
                <button type="button" className="text-xs font-medium text-viridian-700 hover:underline" onClick={() => setDept(list, !allOn)}>
                  {allOn ? 'Bỏ chọn cả bộ phận' : 'Chọn cả bộ phận'}
                </button>
              </div>
              <ul className="divide-y divide-pine-800/5">
                {list.map((e) => {
                  const v = sel[e.id]
                  return (
                    <li key={e.id} className="flex flex-wrap items-center gap-2 px-3 py-1.5">
                      <label className="flex min-w-[200px] flex-1 items-center gap-2 text-sm text-pine-800">
                        <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={!!v?.on} onChange={(ev) => toggle(e.id, ev.target.checked)} />
                        <span>
                          {e.full_name} <span className="text-xs text-pine-800/45">{e.code ?? ''}</span>
                        </span>
                      </label>
                      {v?.on && (
                        <>
                          {!planned && (
                            <Select
                              value={v.attended ? 'co_mat' : 'vang'}
                              onChange={(ev) => setSel({ ...sel, [e.id]: { ...v, attended: ev.target.value === 'co_mat' } })}
                              className={cls('w-28 py-1 text-xs', !v.attended && 'text-red-700')}
                              aria-label={`Có mặt ${e.full_name}`}
                            >
                              <option value="co_mat">Có mặt</option>
                              <option value="vang">Vắng</option>
                            </Select>
                          )}
                          <Input
                            list="drill-roles"
                            value={v.role}
                            onChange={(ev) => setSel({ ...sel, [e.id]: { ...v, role: ev.target.value } })}
                            placeholder="Nhiệm vụ"
                            className="w-40 py-1 text-xs"
                          />
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
        {err && <ErrorNote message={err} />}
      </div>
    </Modal>
  )
}

/* ---------- Danh sách đợt diễn tập ---------- */
export default function DrillsManager({
  fid,
  base,
  canEdit,
  employees,
}: {
  fid: string
  base: Record<string, string>
  canEdit: boolean
  employees: Employee[]
}) {
  const qc = useQueryClient()
  const { drills, participants } = useDrillData(fid)
  const [form, setForm] = useState<any>(null)
  const [roster, setRoster] = useState<Drill | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const count = (d: Drill) => {
    const ps = participants.filter((p) => p.drill_id === d.id)
    return { total: ps.length, attended: ps.filter((p) => p.attended).length }
  }

  const submit = async () => {
    setErr('')
    if (!form.drill_date) return setErr('Nhập ngày diễn tập.')
    if (form.status === 'done' && form.drill_date > todayISO()) return setErr('Đợt chưa diễn ra – để trạng thái "Kế hoạch".')
    setBusy(true)
    try {
      const payload = {
        drill_date: form.drill_date,
        kind: form.kind || 'PCCC',
        status: form.status || 'done',
        plan_no: form.plan_no?.trim() || null,
        location: form.location?.trim() || null,
        scenario: form.scenario?.trim() || null,
        organizer: form.organizer?.trim() || null,
        participants: form.participants === '' || form.participants == null ? null : Number(form.participants),
        result: form.status === 'done' ? form.result || null : null,
        evaluation: form.evaluation?.trim() || null,
      }
      const { error } = form.id ? await supabase.from('drills').update(payload).eq('id', form.id) : await supabase.from('drills').insert({ ...base, ...payload })
      if (error) throw error
      await qc.invalidateQueries()
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (d: Drill) => {
    if (!window.confirm('Xóa đợt diễn tập cùng danh sách người tham gia?')) return
    const { error } = await supabase.from('drills').delete().eq('id', d.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  return (
    <Card>
      <CardHeader
        title="Diễn tập & thực tập phương án"
        hint="PCCC & CNCH, sự cố môi trường – chất thải, tràn dầu, hóa chất, sơ cứu. Ghi danh sách người tham gia để theo dõi theo từng người."
        action={
          canEdit && (
            <Button onClick={() => setForm({ kind: 'PCCC', drill_date: todayISO(), status: 'done', result: 'dat' })}>
              <Plus size={15} /> Thêm đợt diễn tập
            </Button>
          )
        }
      />
      {err && !form && (
        <div className="px-4 pt-3">
          <ErrorNote message={err} />
        </div>
      )}
      {drills.length === 0 ? (
        <EmptyState title="Chưa có đợt diễn tập" />
      ) : (
        <Table head={['Ngày', 'Loại', 'Tình huống', 'Người tham gia', 'Kết quả', '']}>
          {drills.map((d) => {
            const c = count(d)
            return (
              <tr key={d.id}>
                <Td className="whitespace-nowrap">
                  {fmtDate(d.drill_date)}
                  {d.status === 'planned' && (
                    <div className="mt-1">
                      <Badge tone="blue">{DRILL_STATUS_LABELS.planned}</Badge>
                    </div>
                  )}
                </Td>
                <Td className="min-w-[170px]">
                  <Badge tone={KIND_TONE[d.kind] ?? 'gray'}>{DRILL_KIND_LABELS[d.kind] ?? d.kind}</Badge>
                  {d.plan_no && <div className="mt-1 text-xs text-pine-800/45">{d.plan_no}</div>}
                </Td>
                <Td className="min-w-[220px] text-pine-800/70">
                  {d.scenario ?? '—'}
                  {d.location && <div className="text-xs text-pine-800/45">Tại: {d.location}</div>}
                </Td>
                <Td className="whitespace-nowrap">
                  {c.total ? (
                    <span className="text-sm text-pine-800">
                      {d.status === 'planned' ? `${c.total} dự kiến` : `${c.attended} có mặt`}
                      {d.status !== 'planned' && c.total > c.attended && <span className="text-red-700"> · {c.total - c.attended} vắng</span>}
                    </span>
                  ) : (
                    <span className="text-pine-800/45">{d.participants != null ? `${d.participants} người (chưa có danh sách)` : '—'}</span>
                  )}
                </Td>
                <Td className="min-w-[160px] text-pine-800/70">
                  {d.result && <Badge tone={d.result === 'dat' ? 'green' : 'red'}>{DRILL_RESULT_LABELS[d.result]}</Badge>}
                  {d.evaluation && <div className="mt-1 text-xs">{d.evaluation}</div>}
                </Td>
                <Td className="text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" onClick={() => setRoster(d)}>
                        <Users size={14} /> Danh sách
                      </Button>
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...d, status: d.status ?? 'done' })}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" aria-label="Xóa" onClick={() => remove(d)}>
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

      <div className="border-t border-pine-800/10 px-4 py-3">
        <Note>
          {DRILL_COLUMNS.map((c) => (
            <div key={c.key}>
              <b>{c.label}:</b> {c.basis}
            </div>
          ))}
        </Note>
      </div>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa đợt diễn tập' : 'Thêm đợt diễn tập'}
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
            <Field label="Loại diễn tập">
              <Select value={form?.kind ?? 'PCCC'} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                {Object.entries(DRILL_KIND_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ngày" required>
              <Input type="date" value={form?.drill_date ?? ''} onChange={(e) => setForm({ ...form, drill_date: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Trạng thái">
              <Select value={form?.status ?? 'done'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(DRILL_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Số kế hoạch / phương án">
              <Input value={form?.plan_no ?? ''} onChange={(e) => setForm({ ...form, plan_no: e.target.value })} />
            </Field>
          </div>
          <Field label="Tình huống giả định">
            <Textarea rows={2} value={form?.scenario ?? ''} onChange={(e) => setForm({ ...form, scenario: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Địa điểm">
              <Input value={form?.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </Field>
            <Field label="Đơn vị chủ trì">
              <Input value={form?.organizer ?? ''} onChange={(e) => setForm({ ...form, organizer: e.target.value })} />
            </Field>
          </div>
          {form?.status === 'done' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Kết quả">
                <Select value={form?.result ?? ''} onChange={(e) => setForm({ ...form, result: e.target.value || null })}>
                  <option value="">—</option>
                  {Object.entries(DRILL_RESULT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Số người (khi chưa có danh sách)">
                <Input type="number" min={0} value={form?.participants ?? ''} onChange={(e) => setForm({ ...form, participants: e.target.value })} />
              </Field>
            </div>
          )}
          <Field label="Đánh giá, rút kinh nghiệm">
            <Textarea rows={2} value={form?.evaluation ?? ''} onChange={(e) => setForm({ ...form, evaluation: e.target.value })} />
          </Field>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>

      <RosterModal drill={roster} employees={employees} participants={participants} base={base} onClose={() => setRoster(null)} />
    </Card>
  )
}
