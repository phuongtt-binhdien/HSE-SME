// Dữ liệu và thành phần dùng chung của module Nhân sự & Huấn luyện
import { useMemo } from 'react'
import { Badge, type Tone } from '../../components/UI'
import { useList } from '../../hooks/useCrud'
import { DEPARTMENT_SUGGESTIONS, TRAINING_STATE_LABELS } from '../../lib/constants'
import {
  buildMatrix,
  type CellStatus,
  type Employee,
  type TrainingCourse,
  type TrainingRecord,
  type TrainingState,
} from '../../lib/training'
import { cls, fmtDate } from '../../lib/utils'

export function usePersonnelData(fid: string) {
  const employees = useList<Employee>('employees', {
    match: { facility_id: fid },
    order: 'code',
    ascending: true,
    enabled: !!fid,
  })
  const courses = useList<TrainingCourse>('training_courses', {
    match: { facility_id: fid },
    order: 'start_date',
    ascending: false,
    enabled: !!fid,
  })
  const records = useList<TrainingRecord>('training_records', {
    match: { facility_id: fid },
    order: 'created_at',
    ascending: true,
    enabled: !!fid,
  })
  const empList = employees.data ?? []
  const courseList = courses.data ?? []
  const recordList = records.data ?? []
  const matrix = useMemo(
    () => buildMatrix(empList, recordList, courseList),
    [empList, recordList, courseList]
  )
  const departments = useMemo(() => {
    const set = new Set<string>()
    for (const e of empList) if (e.department) set.add(e.department)
    return [...set].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [empList])
  return {
    employees: empList,
    courses: courseList,
    records: recordList,
    matrix,
    departments,
    loading: employees.isLoading || courses.isLoading || records.isLoading,
    error: employees.error || courses.error || records.error,
  }
}

export type PersonnelData = ReturnType<typeof usePersonnelData>

export const STATE_TONE: Record<TrainingState, Tone> = {
  con_han: 'green',
  sap_het: 'amber',
  het_han: 'red',
  chua: 'red',
}

/** Nền ô trong ma trận theo trạng thái */
export const STATE_CELL: Record<TrainingState, string> = {
  con_han: 'bg-viridian-50/70',
  sap_het: 'bg-amber-50',
  het_han: 'bg-red-50',
  chua: 'bg-red-50/60',
}

export function StateBadge({ status }: { status: CellStatus }) {
  const label =
    status.state === 'sap_het' && status.daysLeft != null
      ? `Còn ${status.daysLeft} ngày`
      : status.state === 'het_han' && status.expiry
        ? `Hết hạn ${fmtDate(status.expiry)}`
        : status.state === 'chua' && status.failed
          ? 'Không đạt'
          : TRAINING_STATE_LABELS[status.state]
  return <Badge tone={STATE_TONE[status.state]}>{label}</Badge>
}

/** Ô nhập bộ phận có gợi ý */
export function DepartmentInput({
  value,
  onChange,
  departments,
  className,
}: {
  value: string
  onChange: (v: string) => void
  departments: string[]
  className?: string
}) {
  const options = useMemo(
    () => [...new Set([...departments, ...DEPARTMENT_SUGGESTIONS])].sort((a, b) => a.localeCompare(b, 'vi')),
    [departments]
  )
  return (
    <>
      <input
        list="ehs-departments"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cls(
          'w-full rounded-lg border border-pine-800/20 bg-white px-3 py-2 text-sm text-pine-800 placeholder:text-pine-800/35 focus:border-viridian-600',
          className
        )}
        placeholder="VD: Xưởng Tạo hạt 1"
      />
      <datalist id="ehs-departments">
        {options.map((d) => (
          <option key={d} value={d} />
        ))}
      </datalist>
    </>
  )
}

/** Lọc nhân sự theo từ khóa (mã, họ tên, chức danh) */
export const matchesSearch = (e: Employee, q: string) => {
  if (!q) return true
  const s = q.toLowerCase()
  return (
    e.full_name.toLowerCase().includes(s) ||
    (e.code ?? '').toLowerCase().includes(s) ||
    (e.position ?? '').toLowerCase().includes(s)
  )
}

/** Sắp xếp: bộ phận → mã → tên */
export const byDeptThenCode = (a: Employee, b: Employee) =>
  (a.department ?? '').localeCompare(b.department ?? '', 'vi') ||
  (a.code ?? '').localeCompare(b.code ?? '', 'vi') ||
  a.full_name.localeCompare(b.full_name, 'vi')
