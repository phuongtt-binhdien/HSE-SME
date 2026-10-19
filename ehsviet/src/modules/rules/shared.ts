// Dữ liệu dùng chung của module Nội quy & Vi phạm
import { useMemo } from 'react'
import { useList } from '../../hooks/useCrud'
import type { Violation } from '../../lib/rules'
import type { Employee } from '../../lib/training'

export function useRulesData(fid: string) {
  const on = !!fid
  const violations = useList<Violation>('rule_violations', {
    match: { facility_id: fid },
    order: 'violation_date',
    ascending: false,
    enabled: on,
  })
  const rules = useList<any>('internal_rules', { match: { facility_id: fid }, order: 'created_at', ascending: true, enabled: on })
  const employees = useList<Employee>('employees', { match: { facility_id: fid }, order: 'full_name', ascending: true, enabled: on })
  const permits = useList<any>('contractor_permits', { match: { facility_id: fid }, order: 'created_at', enabled: on })

  const vList = violations.data ?? []
  const eList = employees.data ?? []

  /** Đơn vị: từ danh sách nhân sự và các vi phạm đã ghi nhận */
  const departments = useMemo(() => {
    const set = new Set<string>()
    for (const e of eList) if (e.department && e.status === 'active') set.add(e.department)
    for (const v of vList) if (v.department) set.add(v.department)
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [eList, vList])

  const contractors = useMemo(() => {
    const set = new Set<string>()
    for (const p of permits.data ?? []) if (p.contractor_name) set.add(p.contractor_name)
    for (const v of vList) if (v.contractor_name) set.add(v.contractor_name)
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [permits.data, vList])

  return {
    violations: vList,
    rules: rules.data ?? [],
    employees: eList,
    departments,
    contractors,
    loading: violations.isLoading || rules.isLoading || employees.isLoading,
    error: violations.error || rules.error,
  }
}

export type RulesData = ReturnType<typeof useRulesData>

/** Khoảng ngày của tháng "yyyy-MM" */
export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` }
}

export const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const monthLabel = (month: string) => {
  const [y, m] = month.split('-')
  return `tháng ${Number(m)}/${y}`
}
