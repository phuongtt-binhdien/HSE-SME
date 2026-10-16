// Dữ liệu dùng chung của module Sức khỏe nghề nghiệp
import { useMemo } from 'react'
import { useList } from '../../hooks/useCrud'
import type { HealthCheck, WemCampaign, WemResult } from '../../lib/health'

export interface HealthEmployee {
  id: string
  code?: string | null
  full_name: string
  department?: string | null
  position?: string | null
  status?: string | null
  hazardous?: boolean | null
  exposures?: string[] | null
  allowance_level?: number | null
}

export function useHealthData(fid: string) {
  const employees = useList<HealthEmployee>('employees', {
    match: { facility_id: fid },
    order: 'code',
    ascending: true,
    enabled: !!fid,
  })
  const checks = useList<HealthCheck>('health_checks', {
    match: { facility_id: fid },
    order: 'exam_date',
    ascending: false,
    enabled: !!fid,
  })
  const campaigns = useList<WemCampaign>('wem_campaigns', {
    match: { facility_id: fid },
    order: 'sample_date',
    ascending: false,
    enabled: !!fid,
  })
  const results = useList<WemResult>('wem_results', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })
  const tasks = useList<{ id: string; title: string; status: string }>('compliance_tasks', {
    match: { facility_id: fid },
    order: 'due_date',
    ascending: true,
    enabled: !!fid,
  })

  const all = employees.data ?? []
  const active = useMemo(() => all.filter((e) => e.status !== 'inactive'), [all])
  const departments = useMemo(() => {
    const set = new Set<string>()
    for (const e of active) if (e.department) set.add(e.department)
    for (const r of results.data ?? []) if (r.department) set.add(r.department)
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [active, results.data])

  return {
    employees: active,
    checks: checks.data ?? [],
    campaigns: campaigns.data ?? [],
    results: results.data ?? [],
    tasks: tasks.data ?? [],
    departments,
    loading: employees.isLoading || checks.isLoading || campaigns.isLoading || results.isLoading,
    error: employees.error || checks.error || campaigns.error || results.error,
  }
}

export type HealthData = ReturnType<typeof useHealthData>
