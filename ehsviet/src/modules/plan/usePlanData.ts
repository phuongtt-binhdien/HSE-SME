// Số liệu bước P: hạng mục kế hoạch (năm, 5 năm, Net Zero), mục tiêu lộ trình theo năm, số liệu KNK thực tế để so với lộ trình.
import { useMemo } from 'react'
import { useList } from '../../hooks/useCrud'
import { summarize, type GhgActivity } from '../../lib/ghg'
import type { PlanItem, RoadmapTarget } from '../../lib/plan'

export function usePlanData(fid: string) {
  const on = !!fid
  const match = { facility_id: fid }
  const items = useList<PlanItem>('hse_plan_items', { match, order: 'due_date', ascending: true, enabled: on })
  const targets = useList<RoadmapTarget>('roadmap_targets', { match, order: 'year', ascending: true, enabled: on })
  const activities = useList<GhgActivity>('ghg_activities', { match, order: 'year', ascending: true, enabled: on })
  const acts = activities.data ?? []

  /** Năm có số liệu KNK: tổng PV1+2, tỷ lệ năng lượng tái tạo, số tháng có số liệu (null = số liệu năm) */
  const ghgYears = useMemo(() => {
    const ys = [...new Set(acts.map((a) => Number(a.year)))].sort((a, b) => a - b)
    return ys.map((y) => {
      const s = summarize(acts, y)
      const months = new Set(acts.filter((a) => Number(a.year) === y && a.month != null).map((a) => Number(a.month)))
      const annual = acts.some((a) => Number(a.year) === y && a.month == null)
      return {
        year: y,
        total12: s.total12,
        renewablePct: s.gj > 0 ? (s.renewableGJ / s.gj) * 100 : null,
        /** đủ 12 tháng: có số liệu năm hoặc đủ 12 tháng */
        complete: annual || months.size >= 12,
        months: months.size,
      }
    })
  }, [acts])

  return {
    items: items.data ?? [],
    targets: targets.data ?? [],
    ghgYears,
    loading: items.isLoading || targets.isLoading || activities.isLoading,
    error: items.error || targets.error || activities.error,
  }
}

export type PlanData = ReturnType<typeof usePlanData>
