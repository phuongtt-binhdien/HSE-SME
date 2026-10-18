// Chương trình kiểm tra định kỳ: lịch kỳ trong năm (đã kiểm tra / bỏ sót / đến kỳ), thực hiện kiểm tra theo kỳ
import { useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Kpi, Loading, Modal, Note, Progress, Select, Textarea, type Tone } from '../../components/UI'
import { isCapaForItem } from '../../lib/capa'
import { FREQUENCY_LABELS } from '../../lib/constants'
import {
  INSPECTION_SCOPE_LABELS,
  planSchedule,
  scheduleCompliance,
  type ChecklistRun,
  type InspectionPlan,
  type PeriodCell,
} from '../../lib/inspection'
import { supabase } from '../../lib/supabase'
import { cls, errMsg, fmtDate, todayISO } from '../../lib/utils'
import { RunModal, RunViewModal } from './checklist'
import type { InspectionData } from './useInspectionData'

const CELL: Record<PeriodCell['state'], string> = {
  done: 'bg-viridian-600 text-white border-viridian-600',
  missed: 'bg-red-50 text-red-700 border-red-600/40',
  current: 'bg-amber-50 text-amber-800 border-amber-500 ring-1 ring-amber-400',
  upcoming: 'bg-white text-pine-800/40 border-pine-800/15',
}

const STATE_TITLE: Record<PeriodCell['state'], string> = {
  done: 'Đã kiểm tra',
  missed: 'Bỏ sót – chưa kiểm tra',
  current: 'Đến kỳ – chưa kiểm tra',
  upcoming: 'Kỳ sau',
}

const pctTone = (p: number): Tone => (p >= 95 ? 'green' : p >= 80 ? 'amber' : 'red')

export default function ProgramTab({ data, base, canEdit }: { data: InspectionData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { plans, templates, runs, capa, tplById, loading } = data
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const [form, setForm] = useState<any>(null)
  const [perform, setPerform] = useState<{ plan: InspectionPlan; period: string } | null>(null)
  const [view, setView] = useState<ChecklistRun | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const years = useMemo(() => {
    const s = new Set<number>([thisYear])
    for (const r of runs) s.add(Number(r.run_date.slice(0, 4)))
    return [...s].sort((a, b) => b - a)
  }, [runs, thisYear])

  const schedules = useMemo(
    () => plans.map((p) => ({ plan: p, cells: p.active || year < thisYear ? planSchedule(p, runs, new Date(), year) : [] })),
    [plans, runs, year, thisYear]
  )

  const stats = useMemo(() => {
    let due = 0
    let done = 0
    let current = 0
    for (const s of schedules) {
      if (!s.plan.active) continue
      const c = scheduleCompliance(s.cells)
      due += c.due
      done += c.done
      if (s.cells.some((x) => x.state === 'current')) current++
    }
    const yearRuns = runs.filter((r) => r.run_date.startsWith(String(year)))
    let fails = 0
    let noCapa = 0
    for (const r of yearRuns)
      for (const it of r.results ?? [])
        if (it.status === 'khong_dat') {
          fails++
          if (!capa.some((a) => isCapaForItem(a, r.id, it.label))) noCapa++
        }
    const openCapa = capa.filter((a) => a.source === 'kiem_tra' && a.status !== 'done').length
    return { due, done, missed: due - done, pct: due ? Math.round((done / due) * 100) : 100, current, fails, noCapa, openCapa, active: plans.filter((p) => p.active).length }
  }, [schedules, runs, capa, year, plans])

  const submit = async () => {
    setErr('')
    if (!form.name?.trim()) return setErr('Nhập tên chương trình kiểm tra.')
    if (!form.template_id) return setErr('Chọn checklist áp dụng.')
    setBusy(true)
    try {
      const payload = {
        name: form.name.trim(),
        scope: form.scope || 'tong_the',
        frequency: form.frequency || 'weekly',
        template_id: form.template_id,
        team: form.team?.trim() || null,
        owner: form.owner?.trim() || null,
        basis: form.basis?.trim() || null,
        start_date: form.start_date || todayISO(),
        active: form.active !== false,
        note: form.note?.trim() || null,
      }
      const { error } = form.id
        ? await supabase.from('inspection_plans').update(payload).eq('id', form.id)
        : await supabase.from('inspection_plans').insert({ ...base, ...payload })
      if (error) throw error
      await qc.invalidateQueries()
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (p: InspectionPlan) => {
    if (!window.confirm(`Xóa chương trình "${p.name}"? Kết quả các lần kiểm tra vẫn giữ lại.`)) return
    const { error } = await supabase.from('inspection_plans').delete().eq('id', p.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const clickCell = (plan: InspectionPlan, c: PeriodCell) => {
    if (c.state === 'done') return setView(c.runs[0])
    if (!canEdit || c.state === 'upcoming') return
    if (!plan.template_id || !tplById.get(plan.template_id)) return setErr(`Chương trình "${plan.name}" chưa gắn checklist.`)
    setPerform({ plan, period: c.key })
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      {err && !form && <ErrorNote message={err} />}
      <div className="flex flex-wrap gap-3">
        <Kpi label="Chương trình đang áp dụng" value={stats.active} tone="blue" />
        <Kpi label={`Kiểm tra đúng kỳ ${year}`} value={stats.pct + '%'} sub={`${stats.done}/${stats.due} kỳ đến hạn`} tone={pctTone(stats.pct)} />
        <Kpi label="Kỳ bỏ sót" value={stats.missed} sub="kỳ đã qua chưa kiểm tra" tone={stats.missed ? 'red' : 'green'} />
        <Kpi label="Đến kỳ chưa kiểm tra" value={stats.current} sub="chương trình" tone={stats.current ? 'amber' : 'green'} />
        <Kpi label="Mục không đạt" value={stats.fails} sub={stats.noCapa ? `${stats.noCapa} mục chưa có hành động` : 'đều đã có hành động'} tone={stats.noCapa ? 'red' : 'gray'} />
        <Kpi label="Hành động từ kiểm tra đang mở" value={stats.openCapa} tone={stats.openCapa ? 'amber' : 'green'} />
      </div>

      <Card>
        <CardHeader
          title="Chương trình kiểm tra định kỳ"
          hint="Tổng thể 03 tháng/lần, hằng tuần theo quy định nhà máy; PCCC hằng tuần; VSCN hằng tháng. Bấm ô kỳ để kiểm tra hoặc xem kết quả."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" aria-label="Năm">
                {years.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </Select>
              {canEdit && (
                <Button onClick={() => setForm({ scope: 'tong_the', frequency: 'weekly', start_date: `${thisYear}-01-01`, active: true })} disabled={templates.length === 0}>
                  <Plus size={15} /> Thêm chương trình
                </Button>
              )}
            </div>
          }
        />
        <div className="flex flex-wrap gap-3 border-b border-pine-800/10 px-4 py-2 text-xs text-pine-800/60">
          {(['done', 'missed', 'current', 'upcoming'] as const).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={cls('inline-block h-3 w-3 rounded border', CELL[k])} />
              {STATE_TITLE[k]}
            </span>
          ))}
        </div>
        {plans.length === 0 ? (
          <EmptyState title="Chưa có chương trình kiểm tra" hint="Nạp bộ mẫu tại Cài đặt › Bộ mẫu nghiệp vụ › Chương trình kiểm tra định kỳ" />
        ) : (
          <ul className="divide-y divide-pine-800/5">
            {schedules.map(({ plan, cells }) => {
              const c = scheduleCompliance(cells)
              const cur = cells.find((x) => x.state === 'current')
              const tpl = plan.template_id ? tplById.get(plan.template_id) : null
              return (
                <li key={plan.id} className={cls('px-4 py-3', !plan.active && 'opacity-55')}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-pine-800">{plan.name}</span>
                        <Badge tone="blue">{FREQUENCY_LABELS[plan.frequency]}</Badge>
                        <Badge tone="gray">{INSPECTION_SCOPE_LABELS[plan.scope] ?? plan.scope}</Badge>
                        {!plan.active && <Badge tone="gray">Tạm dừng</Badge>}
                      </div>
                      <div className="mt-0.5 text-xs text-pine-800/50">
                        {tpl ? `Checklist: ${tpl.name} (${tpl.items?.length ?? 0} mục)` : 'Chưa gắn checklist'} · {plan.team ?? '—'}
                      </div>
                      {plan.basis && <div className="text-[11px] text-pine-800/40">{plan.basis}</div>}
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit && cur && tpl && (
                        <Button onClick={() => setPerform({ plan, period: cur.key })}>
                          <ClipboardCheck size={15} /> Kiểm tra {cur.label.split(' (')[0]}
                        </Button>
                      )}
                      {canEdit && (
                        <>
                          <Button variant="ghost" aria-label="Sửa chương trình" onClick={() => setForm({ ...plan })}>
                            <Pencil size={15} />
                          </Button>
                          <Button variant="ghost" aria-label="Xóa chương trình" onClick={() => remove(plan)}>
                            <Trash2 size={15} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {cells.length > 0 && (
                    <>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cells.map((x) => (
                          <button
                            key={x.key}
                            type="button"
                            onClick={() => clickCell(plan, x)}
                            title={`${x.label} – ${STATE_TITLE[x.state]}${x.runs[0] ? ` (${fmtDate(x.runs[0].run_date)}, điểm ${x.runs[0].score ?? '—'}%)` : ''}`}
                            className={cls(
                              'h-7 min-w-[34px] rounded border px-1 text-[11px] font-medium',
                              CELL[x.state],
                              x.state === 'upcoming' ? 'cursor-default' : 'hover:brightness-95'
                            )}
                          >
                            {x.short}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="w-40">
                          <Progress value={c.pct} tone={pctTone(c.pct)} />
                        </div>
                        <span className="text-xs text-pine-800/60">
                          {c.done}/{c.due} kỳ đúng hạn · <b className="text-pine-800">{c.pct}%</b>
                          {c.missed > 0 && <span className="text-red-700"> · {c.missed} kỳ bỏ sót</span>}
                        </span>
                      </div>
                    </>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Note>
        Tần suất là quy định nội bộ của nhà máy, chỉnh tại từng chương trình. Căn cứ: NĐ 106/2025 (sửa đổi bởi NĐ 69/2026) Điều 10 k3 – không tự kiểm tra
        PCCC định kỳ 10–20 triệu; ISO 14001:2015, ISO 45001:2018 điều 9.1 (theo dõi, đo lường); Hội đồng ATVSLĐ cơ sở kiểm tra VSCN hằng tháng.
        Mục không đạt được chuyển thành hành động khắc phục (bước A của PDCA).
      </Note>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa chương trình kiểm tra' : 'Thêm chương trình kiểm tra'}
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
          <Field label="Tên chương trình" required>
            <Input value={form?.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Kiểm tra tổng thể HSE toàn nhà máy" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phạm vi">
              <Select value={form?.scope ?? 'tong_the'} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                {Object.entries(INSPECTION_SCOPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tần suất">
              <Select value={form?.frequency ?? 'weekly'} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Checklist áp dụng" required>
            <Select value={form?.template_id ?? ''} onChange={(e) => setForm({ ...form, template_id: e.target.value })}>
              <option value="">— Chọn checklist —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.items?.length ?? 0} mục)
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Thành phần kiểm tra">
              <Input value={form?.team ?? ''} onChange={(e) => setForm({ ...form, team: e.target.value })} />
            </Field>
            <Field label="Đơn vị chủ trì">
              <Input value={form?.owner ?? ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
            </Field>
          </div>
          <Field label="Căn cứ">
            <Textarea rows={2} value={form?.basis ?? ''} onChange={(e) => setForm({ ...form, basis: e.target.value })} placeholder="Quy định nội bộ, điều khoản pháp luật" />
          </Field>
          <div className="grid grid-cols-2 items-end gap-3">
            <Field label="Áp dụng từ ngày">
              <Input type="date" value={form?.start_date ?? ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 pb-2 text-sm text-pine-800">
              <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={form?.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Đang áp dụng
            </label>
          </div>
          {err && <ErrorNote message={err} />}
        </div>
      </Modal>

      <RunModal
        open={!!perform}
        template={perform?.plan.template_id ? tplById.get(perform.plan.template_id) ?? null : null}
        plan={perform?.plan}
        period={perform?.period}
        base={base}
        onClose={() => setPerform(null)}
      />
      <RunViewModal
        run={view}
        tpl={view ? tplById.get(view.template_id) : null}
        plan={view?.plan_id ? plans.find((p) => p.id === view.plan_id) : null}
        capa={capa}
        base={base}
        canEdit={canEdit}
        onClose={() => setView(null)}
      />
    </div>
  )
}
