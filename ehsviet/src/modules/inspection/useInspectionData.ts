// Dữ liệu dùng chung của phân hệ Kiểm tra định kỳ (bước C của PDCA)
import { useMemo } from 'react'
import { useList } from '../../hooks/useCrud'
import type { CapaAction } from '../../lib/capa'
import type { ChecklistRun, InspectionPlan } from '../../lib/inspection'

export interface ChecklistTemplate {
  id: string
  name: string
  category: string
  frequency: string
  items: { label: string; hint?: string; fix?: string; owner?: string }[]
}

export function useInspectionData(fid: string) {
  const on = !!fid
  const match = { facility_id: fid }
  const plans = useList<InspectionPlan>('inspection_plans', { match, order: 'created_at', ascending: true, enabled: on })
  const templates = useList<ChecklistTemplate>('checklist_templates', { match, order: 'created_at', ascending: true, enabled: on })
  const runs = useList<ChecklistRun>('checklist_runs', { match, order: 'run_date', ascending: false, enabled: on })
  const capa = useList<CapaAction>('capa_actions', { match, order: 'created_at', ascending: false, enabled: on })

  const tplById = useMemo(() => new Map((templates.data ?? []).map((t) => [t.id, t])), [templates.data])
  const planById = useMemo(() => new Map((plans.data ?? []).map((p) => [p.id, p])), [plans.data])

  return {
    plans: plans.data ?? [],
    templates: templates.data ?? [],
    runs: runs.data ?? [],
    capa: capa.data ?? [],
    tplById,
    planById,
    loading: plans.isLoading || templates.isLoading || runs.isLoading || capa.isLoading,
    error: plans.error || templates.error || runs.error || capa.error,
  }
}

export type InspectionData = ReturnType<typeof useInspectionData>
