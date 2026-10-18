// Thực hiện, xem, in lượt kiểm tra theo checklist; tạo hành động khắc phục từ mục không đạt
import { useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { Plus, Printer } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Button, ErrorNote, Field, Input, Modal, Note, Select, Textarea, type Tone } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { capaItemLabel, capaState, CAPA_STATE_LABELS, CAPA_STATE_TONE, DEFAULT_CAPA_DAYS, isCapaForItem, type CapaAction } from '../../lib/capa'
import { CHECKLIST_CATEGORY_LABELS, FREQUENCY_LABELS } from '../../lib/constants'
import { periodKey, periodLabel, runScore, type ChecklistRun, type Frequency, type InspectionPlan } from '../../lib/inspection'
import { blank, docHeader, esc, printDocument, signBlock } from '../../lib/print'
import { supabase } from '../../lib/supabase'
import { cls, errMsg, fmtDate, todayISO } from '../../lib/utils'
import { DepartmentInput } from '../personnel/shared'
import type { ChecklistTemplate } from './useInspectionData'

export const scoreTone = (s: number): Tone => (s >= 90 ? 'green' : s >= 70 ? 'amber' : 'red')

/* ---------- Đạt / K.đạt / N/A ---------- */
export function Seg({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts: [string, string, string][] = [
    ['dat', 'Đạt', 'bg-viridian-600 text-white'],
    ['khong_dat', 'K.đạt', 'bg-red-600 text-white'],
    ['na', 'N/A', 'bg-pine-800/60 text-white'],
  ]
  return (
    <div className="flex shrink-0 overflow-hidden rounded-lg border border-pine-800/15">
      {opts.map(([k, l, activeCls]) => (
        <button key={k} type="button" onClick={() => onChange(k)} className={cls('px-2 py-1 text-xs font-medium', value === k ? activeCls : 'text-pine-800/50')}>
          {l}
        </button>
      ))}
    </div>
  )
}

/** Tiền tố mô tả nguồn của hành động khắc phục: "<chương trình> – <kỳ>" hoặc "<checklist> – <ngày>" */
export function runPrefix(run: Pick<ChecklistRun, 'period' | 'run_date'>, plan: InspectionPlan | null | undefined, tpl: ChecklistTemplate | null | undefined) {
  if (plan && run.period) return `${plan.name} – ${periodLabel(plan.frequency, run.period)}`
  return `${tpl?.name ?? 'Kiểm tra'} – ${fmtDate(run.run_date)}`
}

const capaRow = (base: Record<string, string>, runId: string, prefix: string, r: { label: string; note?: string }, fix: string | undefined, department: string | null, due: string) => ({
  org_id: base.org_id,
  facility_id: base.facility_id,
  incident_id: null,
  source: 'kiem_tra',
  source_ref: runId,
  source_label: capaItemLabel(prefix, r.label),
  kind: 'khac_phuc',
  action: r.note?.trim() ? `Khắc phục: ${r.note.trim()}` : `Khắc phục: ${r.label}`,
  department,
  owner: null,
  due_date: due,
  status: 'open',
  note: fix ? `Gợi ý: ${fix}` : null,
})

/* ================= Thực hiện kiểm tra ================= */
export function RunModal({
  open,
  template,
  plan,
  period,
  base,
  onClose,
}: {
  open: boolean
  template: ChecklistTemplate | null
  plan?: InspectionPlan | null
  period?: string | null
  base: Record<string, string>
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [f, setF] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open || !template) return
    setErr('')
    setF({
      run_date: todayISO(),
      inspector: plan?.team?.split(',')[0]?.trim() ?? '',
      note: '',
      makeCapa: true,
      capaDept: '',
      capaDue: format(addDays(new Date(), DEFAULT_CAPA_DAYS), 'yyyy-MM-dd'),
      results: (template.items ?? []).map((i) => ({ label: i.label, hint: i.hint, fix: i.fix, status: 'dat', note: '' })),
    })
  }, [open, template, plan])

  if (!open || !template || !f) return null
  const score = runScore(f.results)
  const fails = f.results.filter((r: any) => r.status === 'khong_dat')
  const key = plan ? period ?? periodKey(plan.frequency, new Date(f.run_date + 'T12:00:00')) : null

  const setResult = (i: number, patch: any) => {
    const results = [...f.results]
    results[i] = { ...results[i], ...patch }
    setF({ ...f, results })
  }

  const submit = async () => {
    setErr('')
    if (!f.run_date) return setErr('Nhập ngày kiểm tra.')
    if (fails.some((r: any) => !r.note?.trim())) return setErr('Ghi tồn tại cụ thể cho từng mục không đạt (vị trí, hiện trạng).')
    setBusy(true)
    try {
      const results = f.results.map((r: any) => ({ label: r.label, status: r.status, note: r.status === 'khong_dat' ? r.note.trim() : '' }))
      const { data, error } = await supabase
        .from('checklist_runs')
        .insert({
          ...base,
          template_id: template.id,
          plan_id: plan?.id ?? null,
          period: key,
          run_date: f.run_date,
          inspector: f.inspector?.trim() || null,
          results,
          score,
          note: f.note?.trim() || null,
        })
        .select()
        .single()
      if (error) throw error
      if (f.makeCapa && fails.length) {
        const prefix = runPrefix({ period: key, run_date: f.run_date }, plan, template)
        const rows = fails.map((r: any) => capaRow(base, (data as any).id, prefix, r, r.fix, f.capaDept?.trim() || null, f.capaDue || todayISO()))
        const r2 = await supabase.from('capa_actions').insert(rows)
        if (r2.error) throw r2.error
      }
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
      open={open}
      onClose={onClose}
      title={'Thực hiện: ' + template.name}
      wide
      footer={
        <>
          <div className="mr-auto text-sm font-medium text-pine-800/70">
            Điểm: <Badge tone={scoreTone(score)}>{score}%</Badge> · {fails.length} mục không đạt
          </div>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={busy}>
            Lưu kết quả
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {plan && key && (
          <div className="text-sm text-pine-800/60">
            Chương trình: <b className="text-pine-800">{plan.name}</b> · {periodLabel(plan.frequency, key)}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ngày kiểm tra" required>
            <Input type="date" value={f.run_date} onChange={(e) => setF({ ...f, run_date: e.target.value })} />
          </Field>
          <Field label="Người / đoàn kiểm tra">
            <Input value={f.inspector} onChange={(e) => setF({ ...f, inspector: e.target.value })} />
          </Field>
        </div>
        <div className="space-y-2">
          {f.results.map((r: any, i: number) => (
            <div key={i} className={cls('rounded-lg border p-2.5', r.status === 'khong_dat' ? 'border-red-600/30 bg-red-50/40' : 'border-pine-800/10')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-pine-800">{r.label}</div>
                  {r.hint && <div className="mt-0.5 text-[11px] text-pine-800/45">{r.hint}</div>}
                </div>
                <Seg value={r.status} onChange={(v) => setResult(i, { status: v })} />
              </div>
              {r.status === 'khong_dat' && (
                <Input
                  className="mt-2"
                  placeholder={r.fix ? 'Tồn tại cụ thể (vị trí, hiện trạng) — gợi ý khắc phục: ' + r.fix : 'Tồn tại cụ thể (vị trí, hiện trạng)'}
                  value={r.note}
                  onChange={(e) => setResult(i, { note: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
        <Field label="Nhận xét chung">
          <Textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        </Field>
        {fails.length > 0 && (
          <div className="space-y-2 rounded-lg bg-pine-800/[0.04] p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-pine-800">
              <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={f.makeCapa} onChange={(e) => setF({ ...f, makeCapa: e.target.checked })} />
              Tạo {fails.length} hành động khắc phục cho các mục không đạt
            </label>
            {f.makeCapa && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Đơn vị thực hiện">
                  <DepartmentInput value={f.capaDept} onChange={(v) => setF({ ...f, capaDept: v })} departments={[]} />
                </Field>
                <Field label="Hạn khắc phục">
                  <Input type="date" value={f.capaDue} onChange={(e) => setF({ ...f, capaDue: e.target.value })} />
                </Field>
              </div>
            )}
          </div>
        )}
        {err && <ErrorNote message={err} />}
      </div>
    </Modal>
  )
}

/* ================= Xem lượt kiểm tra ================= */
export function printRun(run: ChecklistRun, tpl: ChecklistTemplate | null | undefined, plan: InspectionPlan | null | undefined, org: string, unit: string) {
  const rows = (run.results ?? [])
    .map(
      (r, i) =>
        `<tr><td style="width:5%;text-align:center">${i + 1}</td><td>${esc(r.label)}</td><td style="width:12%;text-align:center">${
          r.status === 'dat' ? 'Đạt' : r.status === 'khong_dat' ? '<b>Không đạt</b>' : 'N/A'
        }</td><td style="width:30%">${esc(r.note ?? '')}</td></tr>`
    )
    .join('')
  printDocument(
    'Phiếu kiểm tra',
    `${docHeader(org, unit)}
    <h1>Phiếu kiểm tra ${esc(tpl?.name ?? '')}</h1>
    <div class="sub">${plan && run.period ? esc(`${plan.name} – ${periodLabel(plan.frequency, run.period)}`) : ''}</div>
    <p>Ngày kiểm tra: ${fmtDate(run.run_date)} · Người / đoàn kiểm tra: ${blank(run.inspector, 30)} · Điểm đạt: <b>${run.score ?? '—'}%</b></p>
    <table class="grid"><tr><th>TT</th><th>Nội dung kiểm tra</th><th>Kết quả</th><th>Tồn tại, yêu cầu khắc phục</th></tr>${rows}</table>
    ${run.note ? `<p><b>Nhận xét chung:</b> ${esc(run.note)}</p>` : ''}
    ${signBlock(['Đại diện đơn vị được kiểm tra', 'Người / đoàn kiểm tra'])}`
  )
}

export function RunViewModal({
  run,
  tpl,
  plan,
  capa,
  base,
  canEdit,
  onClose,
}: {
  run: ChecklistRun | null
  tpl: ChecklistTemplate | null | undefined
  plan: InspectionPlan | null | undefined
  capa: CapaAction[]
  base: Record<string, string>
  canEdit: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const { org, facility } = useAuth()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!run) return null
  const prefix = runPrefix(run, plan, tpl)
  const fails = (run.results ?? []).filter((r) => r.status === 'khong_dat')
  const missing = fails.filter((r) => !capa.some((a) => isCapaForItem(a, run.id, r.label)))
  const fixOf = (label: string) => tpl?.items?.find((i) => i.label === label)?.fix

  const create = async (items: typeof fails) => {
    setErr('')
    setBusy(true)
    try {
      const due = format(addDays(new Date(), DEFAULT_CAPA_DAYS), 'yyyy-MM-dd')
      const { error } = await supabase.from('capa_actions').insert(items.map((r) => capaRow(base, run.id, prefix, r, fixOf(r.label), null, due)))
      if (error) throw error
      await qc.invalidateQueries()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={!!run}
      onClose={onClose}
      title={'Kết quả: ' + (tpl?.name ?? '')}
      wide
      footer={
        <>
          <Button variant="ghost" className="mr-auto" onClick={() => printRun(run, tpl, plan, org?.name ?? '', facility?.name ?? '')}>
            <Printer size={15} /> In phiếu
          </Button>
          {canEdit && missing.length > 0 && (
            <Button variant="outline" onClick={() => create(missing)} disabled={busy}>
              <Plus size={15} /> Tạo hành động cho {missing.length} mục
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        <div className="text-sm text-pine-800/60">
          {plan && run.period ? `${plan.name} – ${periodLabel(plan.frequency, run.period)} · ` : ''}
          Ngày {fmtDate(run.run_date)} · {run.inspector ?? '—'} · Điểm <Badge tone={scoreTone(Number(run.score ?? 0))}>{run.score ?? '—'}%</Badge>
        </div>
        {(run.results ?? []).map((r, i) => {
          const a = r.status === 'khong_dat' ? capa.find((x) => isCapaForItem(x, run.id, r.label)) : undefined
          return (
            <div key={i} className="flex items-start justify-between gap-3 rounded-lg border border-pine-800/10 p-2.5">
              <div className="min-w-0">
                <div className="text-sm text-pine-800">{r.label}</div>
                {r.note && <div className="text-xs text-red-700">→ {r.note}</div>}
                {r.status === 'khong_dat' &&
                  (a ? (
                    <div className="mt-1 text-xs text-pine-800/60">
                      Hành động: {a.action} · hạn {fmtDate(a.due_date)} <Badge tone={CAPA_STATE_TONE[capaState(a)]}>{CAPA_STATE_LABELS[capaState(a)]}</Badge>
                    </div>
                  ) : (
                    canEdit && (
                      <button type="button" className="mt-1 text-xs font-medium text-viridian-700 hover:underline" onClick={() => create([r])} disabled={busy}>
                        + Tạo hành động khắc phục
                      </button>
                    )
                  ))}
              </div>
              <Badge tone={r.status === 'dat' ? 'green' : r.status === 'khong_dat' ? 'red' : 'gray'}>
                {r.status === 'dat' ? 'Đạt' : r.status === 'khong_dat' ? 'Không đạt' : 'N/A'}
              </Badge>
            </div>
          )
        })}
        {run.note && <p className="text-sm text-pine-800/60">Nhận xét: {run.note}</p>}
        {err && <ErrorNote message={err} />}
      </div>
    </Modal>
  )
}

/* ================= Tạo / sửa checklist ================= */
export function TemplateModal({
  form,
  setForm,
  base,
  onClose,
}: {
  form: any
  setForm: (f: any) => void
  base: Record<string, string>
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!form) return null

  const submit = async () => {
    setErr('')
    const previous = new Map<string, any>((form.items ?? []).map((i: any) => [i.label, i]))
    const items = (form.itemsText ?? '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean)
      .map((label: string) => previous.get(label) ?? { label })
    if (!form.name?.trim() || items.length === 0) return setErr('Nhập tên checklist và ít nhất một hạng mục (mỗi dòng một mục).')
    setBusy(true)
    try {
      const payload = { name: form.name.trim(), category: form.category, frequency: form.frequency, items }
      const { error } = form.id
        ? await supabase.from('checklist_templates').update(payload).eq('id', form.id)
        : await supabase.from('checklist_templates').insert({ ...base, ...payload })
      if (error) throw error
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
      open={!!form}
      onClose={onClose}
      title={form.id ? 'Sửa checklist' : 'Tạo checklist'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={submit} disabled={busy}>
            Lưu
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Tên checklist" required>
          <Input value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nhóm">
            <Select value={form.category ?? 'PCCC'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(CHECKLIST_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tần suất">
            <Select value={form.frequency ?? 'monthly'} onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}>
              {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Hạng mục kiểm tra (mỗi dòng một mục)" required>
          <Textarea
            rows={9}
            value={form.itemsText ?? ''}
            onChange={(e) => setForm({ ...form, itemsText: e.target.value })}
            placeholder={'Bình chữa cháy đủ số lượng, còn áp\nLối thoát nạn thông thoáng\n…'}
          />
        </Field>
        <Note>Hạng mục giữ nguyên chữ sẽ giữ căn cứ, gợi ý khắc phục đã có. Kết quả các lần kiểm tra trước không thay đổi.</Note>
        {err && <ErrorNote message={err} />}
      </div>
    </Modal>
  )
}
