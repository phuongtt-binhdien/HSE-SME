// Số liệu cho EPR bao bì và kinh tế tuần hoàn: bao bì, dòng tuần hoàn, chất thải theo phương pháp xử lý,
// nước thải (nhật ký HTXLNT, GRI 303-4), quan trắc nước thải, năng lượng (KNK) và sản lượng.
import { useMemo } from 'react'
import { useList } from '../../hooks/useCrud'
import type { CircularFlow, PackagingRecord, WasteMass } from '../../lib/circular'
import { toKg } from '../../lib/circular'
import type { GhgActivity } from '../../lib/ghg'
import type { EsgMetric } from '../esg/useEsgData'

export interface WasteTypeRow {
  id: string
  code: string | null
  name: string
  category: string
  unit: string
  treatment_method: string | null
}

export function useCircularData(fid: string) {
  const on = !!fid
  const match = { facility_id: fid }
  const packaging = useList<PackagingRecord>('packaging_records', { match, order: 'year', enabled: on })
  const flows = useList<CircularFlow>('circular_flows', { match, order: 'year', enabled: on })
  const types = useList<WasteTypeRow>('waste_types', { match, order: 'created_at', ascending: true, enabled: on })
  const wasteLogs = useList<{ log_date: string; quantity: number; waste_type_id: string }>('waste_logs', {
    select: 'log_date, quantity, waste_type_id',
    match,
    order: 'log_date',
    enabled: on,
  })
  const transfers = useList<any>('waste_transfers', {
    select: 'transfer_date, status, waste_transfer_items(quantity, waste_type_id)',
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
  const points = useList<{ id: string; kind: string }>('monitoring_points', { match, select: 'id, kind', enabled: on })
  const results = useList<{ point_id: string; sample_date: string; is_exceeded: boolean }>('monitoring_results', {
    select: 'point_id, sample_date, is_exceeded',
    match,
    order: 'sample_date',
    enabled: on,
  })
  const metrics = useList<EsgMetric>('esg_metrics', { match, order: 'year', ascending: true, enabled: on })
  const activities = useList<GhgActivity>('ghg_activities', { match, order: 'year', ascending: true, enabled: on })

  const typeList = types.data ?? []
  const typeById = useMemo(() => new Map(typeList.map((t) => [t.id, t])), [typeList])

  /** Phát sinh chất thải đã quy đổi kg kèm phương pháp xử lý của loại chất thải */
  const wasteMass = useMemo<WasteMass[]>(
    () =>
      (wasteLogs.data ?? []).map((l) => {
        const t = typeById.get(l.waste_type_id)
        return { date: l.log_date, kg: toKg(Number(l.quantity ?? 0), t?.unit), method: t?.treatment_method ?? null, category: t?.category ?? null, typeId: l.waste_type_id }
      }),
    [wasteLogs.data, typeById]
  )

  /** Khối lượng đã chuyển giao (chứng từ đã ký / hoàn tất) theo loại chất thải và năm, kg */
  const transferredKg = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of transfers.data ?? []) {
      if (t.status !== 'signed' && t.status !== 'completed') continue
      const y = t.transfer_date.slice(0, 4)
      for (const it of t.waste_transfer_items ?? []) {
        const k = y + '|' + it.waste_type_id
        m.set(k, (m.get(k) ?? 0) + toKg(Number(it.quantity ?? 0), typeById.get(it.waste_type_id)?.unit))
      }
    }
    return m
  }, [transfers.data, typeById])

  const wwLogs = useMemo(
    () => (opLogs.data ?? []).filter((l) => l.treatment_systems?.kind === 'nuoc_thai').map((l) => ({ log_date: l.log_date as string, influent_flow: l.influent_flow as number | null })),
    [opLogs.data]
  )
  const wwPointIds = useMemo(() => new Set((points.data ?? []).filter((p) => p.kind === 'nuoc_thai').map((p) => p.id)), [points.data])
  const mets = metrics.data ?? []
  const metric = (year: number, code: string) => {
    const v = mets.find((m) => Number(m.year) === year && m.code === code)?.value
    return v == null ? null : Number(v)
  }

  return {
    packaging: packaging.data ?? [],
    flows: flows.data ?? [],
    types: typeList,
    typeById,
    wasteLogs: wasteLogs.data ?? [],
    wasteMass,
    transferredKg,
    wwLogs,
    wwPointIds,
    results: results.data ?? [],
    activities: activities.data ?? [],
    metric,
    loading: packaging.isLoading || flows.isLoading || types.isLoading || wasteLogs.isLoading,
    error: packaging.error || flows.error || types.error || wasteLogs.error,
  }
}

export type CircularData = ReturnType<typeof useCircularData>
