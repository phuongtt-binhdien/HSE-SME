// Chính sách ESG (E – S – G) và mục tiêu định lượng có theo dõi tiến độ
import { useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react'
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
  Progress,
  Select,
  Textarea,
  type Tone,
} from '../../components/UI'
import { useList } from '../../hooks/useCrud'
import { PILLAR_LABELS, POLICY_STATUS_LABELS } from '../../lib/constants'
import { metricByKey, TARGET_METRICS, type GriContext } from '../../lib/gri'
import { supabase } from '../../lib/supabase'
import { policyRows, targetRows } from '../../lib/templates'
import { cls, daysUntil, errMsg, fmtDate, fmtNum } from '../../lib/utils'
import type { useEsgData } from './useEsgData'

type EsgData = ReturnType<typeof useEsgData>

const PILLAR_TONE: Record<string, Tone> = { E: 'green', S: 'blue', G: 'gray' }
const STATUS_TONE: Record<string, Tone> = { draft: 'amber', active: 'green', review: 'blue', retired: 'gray' }

interface TargetEval {
  baseline: number | null
  target: number | null
  current: number | null
  currentYear: number | null
  progress: number | null
  achieved: boolean | null
}

function evaluate(t: any, ctxFor: (y: number) => GriContext, years: number[]): TargetEval {
  const m = metricByKey(t.metric_key)
  let current: number | null = null
  let currentYear: number | null = null
  if (m?.snapshot) current = m.compute(ctxFor(new Date().getFullYear()))
  else if (m) {
    for (const y of years) {
      const v = m.compute(ctxFor(y))
      if (v != null) {
        current = v
        currentYear = y
        break
      }
    }
  } else if (t.current_value != null) current = Number(t.current_value)
  const baseline = t.baseline_value != null ? Number(t.baseline_value) : m && t.baseline_year ? m.compute(ctxFor(Number(t.baseline_year))) : null
  const target =
    t.target_value != null ? Number(t.target_value) : baseline != null && t.target_pct != null ? baseline * (1 + Number(t.target_pct) / 100) : null
  let progress: number | null = null
  let achieved: boolean | null = null
  if (current != null && target != null) {
    achieved = t.direction === 'decrease' ? current <= target : current >= target
    if (baseline != null && baseline !== target) progress = ((t.direction === 'decrease' ? baseline - current : current - baseline) / Math.abs(baseline - target)) * 100
    else progress = achieved ? 100 : target !== 0 && t.direction === 'increase' ? (current / target) * 100 : 0
    progress = Math.max(0, Math.min(100, progress))
  }
  return { baseline, target, current, currentYear, progress, achieved }
}

const num = (v: number | null, unit?: string) => (v == null ? '—' : fmtNum(v, unit?.includes('/t') ? 4 : Math.abs(v) < 100 ? 1 : 0))

export default function PoliciesTab({ data, base, canEdit }: { data: EsgData; base: any; canEdit: boolean }) {
  const qc = useQueryClient()
  const fid = base.facility_id
  const policies = useList<any>('esg_policies', { match: { facility_id: fid }, order: 'created_at', ascending: true, enabled: !!fid })
  const targets = useList<any>('esg_targets', { match: { facility_id: fid }, order: 'created_at', ascending: true, enabled: !!fid })
  const [pForm, setPForm] = useState<any>(null)
  const [tForm, setTForm] = useState<any>(null)
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const evals = useMemo(() => {
    const m = new Map<string, TargetEval>()
    for (const t of targets.data ?? []) m.set(t.id, evaluate(t, data.ctxFor, data.years))
    return m
  }, [targets.data, data.ctxFor, data.years])

  const loadTemplates = async (kind: 'policy' | 'target') => {
    setErr('')
    setBusy(true)
    try {
      const { error } =
        kind === 'policy'
          ? await supabase.from('esg_policies').insert(policyRows(base))
          : await supabase.from('esg_targets').insert(targetRows(base))
      if (error) throw error
      await qc.invalidateQueries()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const savePolicy = async () => {
    setErr('')
    if (!pForm.title?.trim()) return setErr('Nhập tên chính sách.')
    const payload = {
      pillar: pForm.pillar || 'E',
      title: pForm.title.trim(),
      doc_no: pForm.doc_no?.trim() || null,
      issued_date: pForm.issued_date || null,
      review_date: pForm.review_date || null,
      owner: pForm.owner?.trim() || null,
      status: pForm.status || 'draft',
      commitments: pForm.commitments?.trim() || null,
      frameworks: pForm.frameworks?.trim() || null,
      file_url: pForm.file_url?.trim() || null,
    }
    const { error } = pForm.id
      ? await supabase.from('esg_policies').update(payload).eq('id', pForm.id)
      : await supabase.from('esg_policies').insert({ ...base, ...payload })
    if (error) return setErr(errMsg(error))
    await qc.invalidateQueries()
    setPForm(null)
  }

  const saveTarget = async () => {
    setErr('')
    if (!tForm.title?.trim()) return setErr('Nhập tên mục tiêu.')
    const n = (v: any) => (v === '' || v == null ? null : Number(v))
    if (n(tForm.target_value) == null && n(tForm.target_pct) == null) return setErr('Nhập giá trị mục tiêu hoặc % thay đổi so với năm gốc.')
    const payload = {
      pillar: tForm.pillar || 'E',
      title: tForm.title.trim(),
      metric_key: tForm.metric_key || null,
      unit: tForm.unit?.trim() || metricByKey(tForm.metric_key)?.unit || null,
      direction: tForm.direction || 'decrease',
      baseline_year: n(tForm.baseline_year),
      baseline_value: n(tForm.baseline_value),
      target_year: n(tForm.target_year),
      target_value: n(tForm.target_value),
      target_pct: n(tForm.target_pct),
      current_value: tForm.metric_key ? null : n(tForm.current_value),
      gri_code: tForm.gri_code?.trim() || null,
      note: tForm.note?.trim() || null,
    }
    const { error } = tForm.id
      ? await supabase.from('esg_targets').update(payload).eq('id', tForm.id)
      : await supabase.from('esg_targets').insert({ ...base, ...payload })
    if (error) return setErr(errMsg(error))
    await qc.invalidateQueries()
    setTForm(null)
  }

  const remove = async (table: string, id: string, label: string) => {
    if (!window.confirm('Xóa ' + label + '?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const toggle = (id: string) => {
    const s = new Set(openIds)
    if (s.has(id)) s.delete(id)
    else s.add(id)
    setOpenIds(s)
  }

  const reviewBadge = (d?: string | null) => {
    if (!d) return null
    const n = daysUntil(d)
    if (n < 0) return <Badge tone="red">Quá hạn soát xét</Badge>
    if (n <= 60) return <Badge tone="amber">Soát xét trong {n} ngày</Badge>
    return <span className="text-xs text-pine-800/45">Soát xét {fmtDate(d)}</span>
  }

  if (policies.isLoading || targets.isLoading) return <Loading />
  const pList = policies.data ?? []
  const tList = targets.data ?? []

  return (
    <div className="space-y-4">
      {err && !pForm && !tForm && <ErrorNote message={err} />}

      <Card>
        <CardHeader
          title="Chính sách ESG"
          hint="Môi trường lập cho nhà máy; Xã hội – Quản trị áp dụng toàn công ty (QĐ 46/2026/QĐ-TTg). Bản mẫu là dự thảo – chỉnh sửa, ban hành theo thẩm quyền."
          action={
            canEdit && (
              <div className="flex gap-2">
                {pList.length === 0 && (
                  <Button variant="outline" disabled={busy} onClick={() => loadTemplates('policy')}>
                    Nạp 8 chính sách mẫu
                  </Button>
                )}
                <Button onClick={() => setPForm({ pillar: 'E', status: 'draft' })}>
                  <Plus size={15} /> Thêm chính sách
                </Button>
              </div>
            )
          }
        />
        {pList.length === 0 ? (
          <EmptyState title="Chưa có chính sách ESG" hint="Nạp bộ mẫu cho nhà máy phân bón NPK rồi chỉnh sửa" />
        ) : (
          <div className="grid gap-3 p-4 md:grid-cols-3">
            {(['E', 'S', 'G'] as const).map((p) => (
              <div key={p} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-pine-800/50">
                  <Badge tone={PILLAR_TONE[p]}>{p}</Badge> {PILLAR_LABELS[p]}
                </div>
                {pList
                  .filter((x) => x.pillar === p)
                  .map((x) => {
                    const open = openIds.has(x.id)
                    const items = (x.commitments ?? '').split('\n').filter(Boolean)
                    return (
                      <div key={x.id} className="rounded-lg border border-pine-800/10 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-semibold text-pine-800">{x.title}</div>
                          <Badge tone={STATUS_TONE[x.status]}>{POLICY_STATUS_LABELS[x.status]}</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-pine-800/50">
                          {x.doc_no && <span>Số {x.doc_no}</span>}
                          {x.issued_date && <span>· ban hành {fmtDate(x.issued_date)}</span>}
                          {x.owner && <span>· {x.owner}</span>}
                          {reviewBadge(x.review_date)}
                        </div>
                        {items.length > 0 && (
                          <>
                            <ul className={cls('mt-2 list-disc space-y-1 pl-4 text-xs text-pine-800/75', !open && 'line-clamp-3')}>
                              {(open ? items : items.slice(0, 2)).map((c: string, i: number) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                            {items.length > 2 && (
                              <button onClick={() => toggle(x.id)} className="mt-1 inline-flex items-center gap-1 text-xs text-viridian-700">
                                {open ? (
                                  <>
                                    Thu gọn <ChevronUp size={12} />
                                  </>
                                ) : (
                                  <>
                                    Xem {items.length} cam kết <ChevronDown size={12} />
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        )}
                        {open && x.frameworks && <div className="mt-2 text-[11px] text-steel-600">Căn cứ / chuẩn mực: {x.frameworks}</div>}
                        {canEdit && (
                          <div className="mt-2 flex justify-end gap-1">
                            <Button variant="ghost" aria-label="Sửa" onClick={() => setPForm({ ...x })}>
                              <Pencil size={14} />
                            </Button>
                            <Button variant="ghost" aria-label="Xóa" onClick={() => remove('esg_policies', x.id, 'chính sách "' + x.title + '"')}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Mục tiêu ESG"
          hint="Chỉ số tự tính từ các module (KNK, huấn luyện, sự cố, vi phạm…) hoặc nhập tay; tiến độ so với năm gốc"
          action={
            canEdit && (
              <div className="flex gap-2">
                {tList.length === 0 && (
                  <Button variant="outline" disabled={busy} onClick={() => loadTemplates('target')}>
                    Nạp mục tiêu mẫu
                  </Button>
                )}
                <Button onClick={() => setTForm({ pillar: 'E', direction: 'decrease', target_year: new Date().getFullYear() + 1 })}>
                  <Plus size={15} /> Thêm mục tiêu
                </Button>
              </div>
            )
          }
        />
        {tList.length === 0 ? (
          <EmptyState title="Chưa có mục tiêu" />
        ) : (
          <ul className="divide-y divide-pine-800/5">
            {tList.map((t) => {
              const ev = evals.get(t.id)!
              const unit = t.unit ?? metricByKey(t.metric_key)?.unit ?? ''
              const tone: Tone = ev.achieved == null ? 'gray' : ev.achieved ? 'green' : (ev.progress ?? 0) >= 50 ? 'amber' : 'red'
              return (
                <li key={t.id} className="grid gap-2 px-4 py-3 md:grid-cols-[1.6fr_1fr_auto] md:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={PILLAR_TONE[t.pillar]}>{t.pillar}</Badge>
                      <span className="text-sm font-medium text-pine-800">{t.title}</span>
                    </div>
                    <div className="mt-1 text-xs text-pine-800/50">
                      {t.gri_code ? t.gri_code + ' · ' : ''}
                      {t.metric_key ? 'Tự tính: ' + (metricByKey(t.metric_key)?.label ?? t.metric_key) : 'Nhập tay'}
                      {t.note ? ' · ' + t.note : ''}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-pine-800/60">
                      <span>
                        Gốc {t.baseline_year ?? ''}: <b className="text-pine-800">{num(ev.baseline, unit)}</b>
                      </span>
                      <span>
                        Hiện tại{ev.currentYear ? ' ' + ev.currentYear : ''}: <b className="text-pine-800">{num(ev.current, unit)}</b>
                      </span>
                      <span>
                        Mục tiêu {t.target_year ?? ''}: <b className="text-pine-800">{num(ev.target, unit)}</b>
                        {t.target_pct != null && t.target_value == null ? ` (${t.target_pct > 0 ? '+' : ''}${t.target_pct}%)` : ''} {unit}
                      </span>
                    </div>
                    <Progress value={ev.progress ?? 0} tone={tone} />
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    {ev.achieved != null && <Badge tone={tone}>{ev.achieved ? 'Đạt' : `${Math.round(ev.progress ?? 0)}%`}</Badge>}
                    {canEdit && (
                      <>
                        <Button variant="ghost" aria-label="Sửa" onClick={() => setTForm({ ...t })}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" aria-label="Xóa" onClick={() => remove('esg_targets', t.id, 'mục tiêu "' + t.title + '"')}>
                          <Trash2 size={14} />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* Chính sách */}
      <Modal
        open={!!pForm}
        onClose={() => setPForm(null)}
        title={pForm?.id ? 'Sửa chính sách ESG' : 'Thêm chính sách ESG'}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setPForm(null)}>
              Hủy
            </Button>
            <Button onClick={savePolicy}>Lưu</Button>
          </>
        }
      >
        {pForm && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Trụ cột">
                <Select value={pForm.pillar} onChange={(e) => setPForm({ ...pForm, pillar: e.target.value })}>
                  {Object.entries(PILLAR_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {k} – {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tên chính sách" required className="sm:col-span-3">
                <Input value={pForm.title ?? ''} onChange={(e) => setPForm({ ...pForm, title: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Số hiệu văn bản">
                <Input value={pForm.doc_no ?? ''} onChange={(e) => setPForm({ ...pForm, doc_no: e.target.value })} />
              </Field>
              <Field label="Ngày ban hành">
                <Input type="date" value={pForm.issued_date ?? ''} onChange={(e) => setPForm({ ...pForm, issued_date: e.target.value })} />
              </Field>
              <Field label="Hạn soát xét">
                <Input type="date" value={pForm.review_date ?? ''} onChange={(e) => setPForm({ ...pForm, review_date: e.target.value })} />
              </Field>
              <Field label="Trạng thái">
                <Select value={pForm.status} onChange={(e) => setPForm({ ...pForm, status: e.target.value })}>
                  {Object.entries(POLICY_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Đơn vị chủ trì">
              <Input value={pForm.owner ?? ''} onChange={(e) => setPForm({ ...pForm, owner: e.target.value })} />
            </Field>
            <Field label="Cam kết (mỗi dòng một cam kết)">
              <Textarea rows={6} value={pForm.commitments ?? ''} onChange={(e) => setPForm({ ...pForm, commitments: e.target.value })} />
            </Field>
            <Field label="Căn cứ / chuẩn mực liên quan">
              <Input value={pForm.frameworks ?? ''} onChange={(e) => setPForm({ ...pForm, frameworks: e.target.value })} placeholder="GRI, ISO 14001, TT 96/2020, QĐ 46/2026…" />
            </Field>
            <Field label="Liên kết file">
              <Input value={pForm.file_url ?? ''} onChange={(e) => setPForm({ ...pForm, file_url: e.target.value })} placeholder="https://…" />
            </Field>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>

      {/* Mục tiêu */}
      <Modal
        open={!!tForm}
        onClose={() => setTForm(null)}
        title={tForm?.id ? 'Sửa mục tiêu ESG' : 'Thêm mục tiêu ESG'}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setTForm(null)}>
              Hủy
            </Button>
            <Button onClick={saveTarget}>Lưu</Button>
          </>
        }
      >
        {tForm && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Trụ cột">
                <Select value={tForm.pillar} onChange={(e) => setTForm({ ...tForm, pillar: e.target.value })}>
                  {Object.entries(PILLAR_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {k} – {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tên mục tiêu" required className="sm:col-span-3">
                <Input value={tForm.title ?? ''} onChange={(e) => setTForm({ ...tForm, title: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Chỉ số theo dõi" className="sm:col-span-2">
                <Select
                  value={tForm.metric_key ?? ''}
                  onChange={(e) => setTForm({ ...tForm, metric_key: e.target.value, unit: metricByKey(e.target.value)?.unit ?? tForm.unit })}
                >
                  <option value="">Nhập tay giá trị hiện tại</option>
                  {TARGET_METRICS.map((m) => (
                    <option key={m.key} value={m.key}>
                      Tự tính: {m.label} ({m.unit})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Chiều mục tiêu">
                <Select value={tForm.direction} onChange={(e) => setTForm({ ...tForm, direction: e.target.value })}>
                  <option value="decrease">Giảm xuống ≤ mục tiêu</option>
                  <option value="increase">Tăng lên ≥ mục tiêu</option>
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Năm gốc">
                <Input type="number" value={tForm.baseline_year ?? ''} onChange={(e) => setTForm({ ...tForm, baseline_year: e.target.value })} />
              </Field>
              <Field label="Giá trị năm gốc">
                <Input
                  type="number"
                  step="any"
                  value={tForm.baseline_value ?? ''}
                  onChange={(e) => setTForm({ ...tForm, baseline_value: e.target.value })}
                  placeholder={tForm.metric_key ? 'Trống = tự tính' : ''}
                />
              </Field>
              <Field label="Đơn vị">
                <Input value={tForm.unit ?? ''} onChange={(e) => setTForm({ ...tForm, unit: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Năm mục tiêu">
                <Input type="number" value={tForm.target_year ?? ''} onChange={(e) => setTForm({ ...tForm, target_year: e.target.value })} />
              </Field>
              <Field label="Giá trị mục tiêu">
                <Input type="number" step="any" value={tForm.target_value ?? ''} onChange={(e) => setTForm({ ...tForm, target_value: e.target.value })} />
              </Field>
              <Field label="hoặc % so với năm gốc">
                <Input type="number" step="any" value={tForm.target_pct ?? ''} onChange={(e) => setTForm({ ...tForm, target_pct: e.target.value })} placeholder="VD: -10" />
              </Field>
            </div>
            {!tForm.metric_key && (
              <Field label="Giá trị hiện tại (nhập tay)">
                <Input type="number" step="any" value={tForm.current_value ?? ''} onChange={(e) => setTForm({ ...tForm, current_value: e.target.value })} />
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Mã GRI">
                <Input value={tForm.gri_code ?? ''} onChange={(e) => setTForm({ ...tForm, gri_code: e.target.value })} />
              </Field>
              <Field label="Ghi chú" className="sm:col-span-2">
                <Input value={tForm.note ?? ''} onChange={(e) => setTForm({ ...tForm, note: e.target.value })} />
              </Field>
            </div>
            <Note>Mục tiêu theo % dùng giá trị năm gốc (nhập hoặc tự tính) để ra giá trị tuyệt đối. Ghi rõ mẫu số khi là chỉ số cường độ.</Note>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </div>
  )
}
