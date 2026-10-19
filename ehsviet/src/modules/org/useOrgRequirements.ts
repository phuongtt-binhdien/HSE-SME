// Đánh giá bộ máy HSE theo quy định (NĐ 39/2016, NĐ 105/2025…) từ thông số cơ sở, nhân sự, phân công và huấn luyện –
// dùng chung cho trang Tổ chức bộ máy và Tổng quan PDCA.
import { useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useList } from '../../hooks/useCrud'
import { summarize, type GhgActivity } from '../../lib/ghg'
import { evaluateOrg, type HseRole } from '../../lib/org'
import { ALL_TRAINING_CATEGORIES, buildMatrix } from '../../lib/training'
import { usePersonnelData } from '../personnel/shared'

export function useOrgRequirements(fid: string) {
  const { facility } = useAuth()
  const people = usePersonnelData(fid)
  const roles = useList<HseRole>('hse_roles', { match: { facility_id: fid }, order: 'created_at', ascending: true, enabled: !!fid })
  const ghg = useList<GhgActivity>('ghg_activities', { match: { facility_id: fid }, order: 'year', enabled: !!fid })

  const active = useMemo(() => people.employees.filter((e) => e.status === 'active'), [people.employees])
  const training = useMemo(
    () => buildMatrix(people.employees, people.records, people.courses, ALL_TRAINING_CATEGORIES),
    [people.employees, people.records, people.courses]
  )

  // năng lượng năm gần nhất đã đủ số liệu (ưu tiên năm trước), để xác định cơ sở sử dụng năng lượng trọng điểm
  const energy = useMemo(() => {
    const acts = ghg.data ?? []
    const y = new Date().getFullYear()
    for (const year of [y - 1, y, y - 2]) {
      const s = summarize(acts, year)
      if (s.toe > 0) return { toe: s.toe, year }
    }
    return { toe: null as number | null, year: null as number | null }
  }, [ghg.data])

  const headcountEntered = facility?.headcount != null
  const headcount = headcountEntered ? Number(facility!.headcount) : active.length
  const reqs = useMemo(
    () =>
      evaluateOrg({
        headcount,
        headcountEntered,
        hazardous: !!facility?.hazardous_sector,
        shifts: facility?.shifts ?? null,
        employees: people.employees,
        roles: roles.data ?? [],
        training,
        toe: energy.toe,
        toeYear: energy.year,
      }),
    [headcount, headcountEntered, facility, people.employees, roles.data, training, energy]
  )

  return { people, roles, active, training, energy, headcount, headcountEntered, reqs, loading: people.loading || roles.isLoading }
}
