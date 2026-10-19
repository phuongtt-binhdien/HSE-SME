// Tính trạng thái huấn luyện (còn hạn / sắp hết / hết hạn / chưa huấn luyện) cho ma trận nhân sự
import { addMonths, format, parseISO } from 'date-fns'
import { daysUntil } from './utils'

export const MATRIX_CATEGORIES = ['atvsld', 'pccc', 'su_co_chat_thai'] as const
export const ALL_TRAINING_CATEGORIES = [
  'atvsld',
  'pccc',
  'su_co_chat_thai',
  'hoa_chat',
  'so_cap_cuu',
  'khac',
] as const

/** Số ngày trước hạn bắt đầu cảnh báo "sắp hết hạn" */
export const EXPIRING_DAYS = 30

export interface Employee {
  id: string
  code: string | null
  full_name: string
  gender: string | null
  department: string | null
  position: string | null
  atvsld_group: number | null
  hire_date: string | null
  status: 'active' | 'inactive'
  note: string | null
}

export interface TrainingCourse {
  id: string
  category: string
  name: string
  start_date: string
  end_date: string | null
  decision_no: string | null
  decision_date: string | null
  provider: string | null
  hours: number | null
  validity_months: number | null
  note: string | null
}

export interface TrainingRecord {
  id: string
  employee_id: string
  course_id: string
  result: 'dat' | 'khong_dat'
  certificate_no: string | null
  expiry_date: string | null
  note: string | null
}

export type TrainingState = 'con_han' | 'sap_het' | 'het_han' | 'chua'

export interface CellStatus {
  state: TrainingState
  record?: TrainingRecord
  course?: TrainingCourse
  expiry: string | null
  daysLeft: number | null
  /** có lượt huấn luyện nhưng kết quả không đạt */
  failed: boolean
}

/** Chu kỳ mặc định (tháng) khi khóa không ghi hiệu lực. null = không thời hạn. */
export function defaultValidityMonths(category: string, group?: number | null): number | null {
  switch (category) {
    case 'atvsld':
      // NĐ 44/2016: nhóm 4 định kỳ hằng năm; nhóm 1, 2, 3, 5, 6 ít nhất 2 năm/lần
      return group && group !== 4 ? 24 : 12
    case 'pccc':
    case 'su_co_chat_thai':
    case 'hoa_chat':
    case 'so_cap_cuu':
      return 12
    default:
      return null
  }
}

/** Ngày huấn luyện dùng để tính hạn: ngày kết thúc nếu có, nếu không là ngày bắt đầu */
export const courseDate = (c: TrainingCourse) => c.end_date || c.start_date

export function expiryOf(
  rec: TrainingRecord,
  course: TrainingCourse,
  emp?: Pick<Employee, 'atvsld_group'> | null
): string | null {
  if (rec.expiry_date) return rec.expiry_date
  const months = course.validity_months ?? defaultValidityMonths(course.category, emp?.atvsld_group)
  if (!months) return null
  return format(addMonths(parseISO(courseDate(course)), months), 'yyyy-MM-dd')
}

export function stateOf(expiry: string | null): { state: TrainingState; daysLeft: number | null } {
  if (!expiry) return { state: 'con_han', daysLeft: null }
  const n = daysUntil(expiry)
  return { state: n < 0 ? 'het_han' : n <= EXPIRING_DAYS ? 'sap_het' : 'con_han', daysLeft: n }
}

/** Trạng thái của một người với một loại huấn luyện — lấy lượt "Đạt" có ngày huấn luyện mới nhất */
export function statusFor(
  emp: Employee,
  category: string,
  records: TrainingRecord[],
  courses: Map<string, TrainingCourse>
): CellStatus {
  let best: { rec: TrainingRecord; course: TrainingCourse; expiry: string | null } | null = null
  let failed = false
  for (const rec of records) {
    const course = courses.get(rec.course_id)
    if (!course || course.category !== category) continue
    if (rec.result !== 'dat') {
      failed = true
      continue
    }
    const expiry = expiryOf(rec, course, emp)
    const newer =
      !best ||
      courseDate(course) > courseDate(best.course) ||
      (courseDate(course) === courseDate(best.course) && (expiry ?? '9999') > (best.expiry ?? '9999'))
    if (newer) best = { rec, course, expiry }
  }
  if (!best) return { state: 'chua', expiry: null, daysLeft: null, failed }
  return { ...stateOf(best.expiry), record: best.rec, course: best.course, expiry: best.expiry, failed: false }
}

export type MatrixRow = Record<string, CellStatus>

/** Dựng ma trận: employee_id → { loại huấn luyện → trạng thái } */
export function buildMatrix(
  employees: Employee[],
  records: TrainingRecord[],
  courses: TrainingCourse[],
  categories: readonly string[] = MATRIX_CATEGORIES
): Map<string, MatrixRow> {
  const courseMap = new Map(courses.map((c) => [c.id, c]))
  const byEmp = new Map<string, TrainingRecord[]>()
  for (const r of records) {
    const list = byEmp.get(r.employee_id)
    if (list) list.push(r)
    else byEmp.set(r.employee_id, [r])
  }
  const out = new Map<string, MatrixRow>()
  for (const e of employees) {
    const recs = byEmp.get(e.id) ?? []
    const row: MatrixRow = {}
    for (const cat of categories) row[cat] = statusFor(e, cat, recs, courseMap)
    out.set(e.id, row)
  }
  return out
}

export const isValid = (s: CellStatus) => s.state === 'con_han' || s.state === 'sap_het'

/** Tỷ lệ % người đang làm việc còn hiệu lực huấn luyện của một loại */
export function coverage(employees: Employee[], matrix: Map<string, MatrixRow>, category: string) {
  const active = employees.filter((e) => e.status === 'active')
  if (active.length === 0) return { pct: 0, ok: 0, total: 0 }
  const ok = active.filter((e) => {
    const s = matrix.get(e.id)?.[category]
    return s ? isValid(s) : false
  }).length
  return { pct: Math.round((ok / active.length) * 100), ok, total: active.length }
}

/** Tổng giờ và số lượt huấn luyện "Đạt" trong năm (GRI 403-5, 404-1) */
export function trainingStatsForYear(
  records: TrainingRecord[],
  courses: TrainingCourse[],
  year: number
) {
  const courseMap = new Map(courses.map((c) => [c.id, c]))
  let hours = 0
  let sessions = 0
  const byCategory: Record<string, number> = {}
  for (const r of records) {
    const c = courseMap.get(r.course_id)
    if (!c || r.result !== 'dat' || Number(c.start_date.slice(0, 4)) !== year) continue
    sessions += 1
    hours += Number(c.hours ?? 0)
    byCategory[c.category] = (byCategory[c.category] ?? 0) + 1
  }
  return { hours, sessions, byCategory }
}
