// Tổng hợp số liệu từ các module (KNK, nhân sự – huấn luyện, sự cố, chất thải, nước thải, nội quy)
// thành ngữ cảnh theo năm cho chỉ mục GRI và mục tiêu ESG.
import { useCallback, useMemo } from 'react'
import { useList } from '../../hooks/useCrud'
import { isDiverted, toKg } from '../../lib/circular'
import { summarize, type GhgActivity } from '../../lib/ghg'
import type { GriContext } from '../../lib/gri'
import { coverage, MATRIX_CATEGORIES, trainingStatsForYear } from '../../lib/training'
import { usePersonnelData } from '../personnel/shared'

export interface EsgMetric {
  id: string
  year: number
  code: string
  value: number | null
  text_value: string | null
  unit: string | null
  source: string | null
  note: string | null
}

const yearOf = (d?: string | null) => (d ? Number(d.slice(0, 4)) : NaN)

export function useEsgData(fid: string) {
  const on = !!fid
  const match = { facility_id: fid }
  const activities = useList<GhgActivity>('ghg_activities', { match, order: 'year', ascending: true, enabled: on })
  const metrics = useList<EsgMetric>('esg_metrics', { match, order: 'year', ascending: true, enabled: on })
  const policies = useList<any>('esg_policies', { match, order: 'created_at', ascending: true, enabled: on })
  const incidents = useList<any>('incidents', { match, order: 'incident_date', enabled: on })
  const wasteLogs = useList<any>('waste_logs', {
    select: 'log_date, quantity, waste_types(category, unit, treatment_method)',
    match,
    order: 'log_date',
    enabled: on,
  })
  const transfers = useList<any>('waste_transfers', {
    select: 'transfer_date, status, waste_transfer_items(quantity, waste_types(unit))',
    match,
    order: 'transfer_date',
    enabled: on,
  })
  const opLogs = useList<any>('operation_logs', {
    select: 'log_date, influent_flow, treatment_systems(kind)',
    match,
    order: 'log_date',
    enabled: on,
  })
  const violations = useList<any>('rule_violations', { match, order: 'violation_date', enabled: on })
  const flows = useList<any>('circular_flows', { match, select: 'year, stream, quantity', order: 'year', enabled: on })
  const people = usePersonnelData(fid)

  const acts = activities.data ?? []
  const mets = metrics.data ?? []

  const metric = useCallback(
    (year: number, code: string) => mets.find((m) => Number(m.year) === year && m.code === code),
    [mets]
  )

  const coverageNow = useMemo(
    () =>
      Object.fromEntries(MATRIX_CATEGORIES.map((c) => [c, coverage(people.employees, people.matrix, c).pct])) as Record<
        string,
        number
      >,
    [people.employees, people.matrix]
  )

  const ctxFor = useCallback(
    (year: number): GriContext => {
      const active = people.employees.filter((e) => e.status === 'active')
      const inYear = (d?: string | null) => yearOf(d) === year
      const inc = (incidents.data ?? []).filter((i) => inYear(i.incident_date))
      const waste = { ctnhKg: 0, ctrcnKg: 0, ctrshKg: 0, transferredKg: 0 }
      const wasteFate = { divertedKg: 0, disposedKg: 0, unknownKg: 0 }
      for (const l of wasteLogs.data ?? []) {
        if (!inYear(l.log_date)) continue
        const kg = toKg(Number(l.quantity ?? 0), l.waste_types?.unit)
        if (l.waste_types?.category === 'CTNH') waste.ctnhKg += kg
        else if (l.waste_types?.category === 'CTRCNTT') waste.ctrcnKg += kg
        else if (l.waste_types?.category === 'CTRSH') waste.ctrshKg += kg
        const method = l.waste_types?.treatment_method
        if (!method) wasteFate.unknownKg += kg
        else if (isDiverted(method)) wasteFate.divertedKg += kg
        else wasteFate.disposedKg += kg
      }
      const reuse = (flows.data ?? []).filter((f) => Number(f.year) === year && f.stream === 'nuoc_tuan_hoan')
      const withdrawal = metric(year, 'GRI 303-3')?.value
      for (const t of transfers.data ?? []) {
        if (!inYear(t.transfer_date) || (t.status !== 'signed' && t.status !== 'completed')) continue
        for (const it of t.waste_transfer_items ?? []) waste.transferredKg += toKg(Number(it.quantity ?? 0), it.waste_types?.unit)
      }
      const wwLogs = (opLogs.data ?? []).filter((l) => inYear(l.log_date) && l.treatment_systems?.kind === 'nuoc_thai')
      const production = metric(year, 'production_t')?.value
      return {
        year,
        ghg: summarize(acts, year),
        production: production == null ? null : Number(production),
        employeesActive: active.length,
        employeesFemale: active.filter((e) => e.gender === 'nu').length,
        employeesWithGender: active.filter((e) => e.gender).length,
        training: trainingStatsForYear(people.records, people.courses, year),
        coverage: coverageNow,
        incidents: {
          tnld: inc.filter((i) => i.kind === 'tai_nan_ld').length,
          tnldSerious: inc.filter((i) => i.kind === 'tai_nan_ld' && i.severity === 'nghiem_trong').length,
          env: inc.filter((i) => i.kind === 'moi_truong').length,
        },
        waste,
        wasteFate,
        wastewaterM3: wwLogs.length ? wwLogs.reduce((s, l) => s + Number(l.influent_flow ?? 0), 0) : null,
        waterReuseM3: reuse.length ? reuse.reduce((s, f) => s + Number(f.quantity ?? 0), 0) : null,
        waterWithdrawalM3: withdrawal == null ? null : Number(withdrawal),
        violations: (violations.data ?? []).filter((v) => inYear(v.violation_date)).length,
        policiesActive: (policies.data ?? []).filter((p) => p.status === 'active').length,
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [acts, metric, people.employees, people.records, people.courses, coverageNow, incidents.data, wasteLogs.data, transfers.data, opLogs.data, violations.data, policies.data, flows.data]
  )

  /** Các năm có số liệu (KNK, chỉ số nhập tay) và năm hiện tại, mới nhất trước */
  const years = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()])
    for (const a of acts) set.add(Number(a.year))
    for (const m of mets) set.add(Number(m.year))
    return [...set].sort((a, b) => b - a)
  }, [acts, mets])

  return {
    activities: acts,
    metrics: mets,
    metric,
    ctxFor,
    years,
    loading: activities.isLoading || metrics.isLoading || people.loading,
  }
}

/** Ghi số liệu năm vào esg_metrics: cập nhật dòng (năm, mã) nếu đã có, ngược lại thêm mới */
export async function saveMetric(
  supabase: any,
  base: { org_id: string; facility_id: string },
  existing: EsgMetric | undefined,
  year: number,
  code: string,
  fields: Partial<Pick<EsgMetric, 'value' | 'text_value' | 'unit' | 'source' | 'note'>>
) {
  const { error } = existing
    ? await supabase.from('esg_metrics').update(fields).eq('id', existing.id)
    : await supabase.from('esg_metrics').insert({ ...base, year, code, ...fields })
  if (error) throw error
}
