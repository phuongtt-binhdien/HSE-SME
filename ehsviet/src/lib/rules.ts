// Đánh giá tuân thủ nội quy: xếp loại tháng của đơn vị, hệ số quỹ lương tham khảo,
// thi đua quý và gợi ý hình thức xử lý theo số lần tái phạm.
import { format, parseISO, subMonths } from 'date-fns'

export interface Violation {
  id: string
  violation_date: string
  rule_id: string | null
  category: string
  kind: string
  subject_type: 'don_vi' | 'ca_nhan' | 'nha_thau'
  department: string | null
  employee_id: string | null
  person_name: string | null
  contractor_name: string | null
  location: string | null
  description: string
  record_no: string | null
  evidence_url: string | null
  severity: string
  community_impact: boolean
  counts_for_unit: boolean
  measure: string | null
  corrective_action: string | null
  responsible: string | null
  due_date: string | null
  status: 'open' | 'fixing' | 'closed'
  closed_date: string | null
}

/** Xếp loại tháng theo số lần không đạt (Quy định tuân thủ môi trường nội bộ – xếp loại hằng tháng) */
export const GRADE_BANDS = [
  { grade: 'A', min: 0, max: 0, note: 'Đạt yêu cầu môi trường – vệ sinh công nghiệp' },
  { grade: 'B', min: 1, max: 1, note: '' },
  { grade: 'C', min: 2, max: 2, note: 'Trưởng đơn vị giải trình, lập kế hoạch khắc phục' },
  { grade: 'D', min: 3, max: Infinity, note: 'Báo cáo Ban Điều hành; kiểm tra lại trong tháng' },
]

export function gradeOf(count: number) {
  return GRADE_BANDS.find((b) => count >= b.min && count <= b.max) ?? GRADE_BANDS[3]
}

/**
 * Hệ số đánh giá trên quỹ lương sản xuất của đơn vị (%), theo bảng thưởng/trừ tiêu chuẩn môi trường.
 * Chỉ dùng làm hệ số trong Quy chế trả lương, thưởng của tập thể — không phạt tiền cá nhân
 * (BLLĐ 2019 Điều 127). Tỷ lệ chính thức do Phòng Tổ chức – Hành chính ban hành.
 */
export const COEF_BANDS = [
  { label: '0 lần', value: '+1% (thưởng)' },
  { label: '1–2 lần', value: '−0,2% mỗi lần' },
  { label: '3–4 lần', value: '−0,5%' },
  { label: '5–6 lần', value: '−1,5%' },
  { label: 'Trên 6 lần', value: '−2,5%' },
  { label: 'Sự cố ảnh hưởng khu dân cư', value: '−4%' },
]

export function salaryCoefficient(count: number, communityImpact: boolean): number {
  if (communityImpact) return -4
  if (count === 0) return 1
  if (count <= 2) return -0.2 * count
  if (count <= 4) return -0.5
  if (count <= 6) return -1.5
  return -2.5
}

/** Thi đua quý theo tổng số lần vi phạm trong quý */
export function quarterEmulation(count: number): { label: string; tone: 'green' | 'amber' | 'red' | 'gray' } {
  if (count <= 1) return { label: 'Đủ điều kiện xét thi đua', tone: 'green' }
  if (count <= 3) return { label: 'Không nhận cờ thi đua', tone: 'amber' }
  if (count <= 5) return { label: 'Không được biểu dương', tone: 'amber' }
  if (count <= 7) return { label: 'Không xếp loại A', tone: 'red' }
  return { label: 'Không xếp loại B', tone: 'red' }
}

export interface UnitEvaluation {
  department: string
  thong_so: number
  khu_vuc: number
  diem_thu_gom: number
  hanh_vi: number
  total: number
  communityImpact: boolean
  open: number
}

/** Tổng hợp theo đơn vị cho các vi phạm trong khoảng [from, to] (yyyy-MM-dd) */
export function evaluateUnits(violations: Violation[], from: string, to: string): UnitEvaluation[] {
  const map = new Map<string, UnitEvaluation>()
  for (const v of violations) {
    if (!v.counts_for_unit || !v.department) continue
    if (v.violation_date < from || v.violation_date > to) continue
    const row =
      map.get(v.department) ??
      ({ department: v.department, thong_so: 0, khu_vuc: 0, diem_thu_gom: 0, hanh_vi: 0, total: 0, communityImpact: false, open: 0 } as UnitEvaluation)
    if (v.kind in row) (row as any)[v.kind] += 1
    row.total += 1
    if (v.community_impact) row.communityImpact = true
    if (v.status !== 'closed') row.open += 1
    map.set(v.department, row)
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.department.localeCompare(b.department))
}

/** Khóa nhận diện đối tượng vi phạm (người lao động / người ngoài / nhà thầu) để đếm tái phạm */
export function subjectKey(v: Pick<Violation, 'subject_type' | 'employee_id' | 'person_name' | 'contractor_name'>) {
  if (v.subject_type === 'ca_nhan') {
    if (v.employee_id) return 'nv:' + v.employee_id
    if (v.person_name) return 'ten:' + v.person_name.trim().toLowerCase()
  }
  if (v.subject_type === 'nha_thau' && v.contractor_name) return 'nt:' + v.contractor_name.trim().toLowerCase()
  return null
}

/** Số lần vi phạm của cùng đối tượng trong 12 tháng tính đến ngày `date` (gồm cả lần này) */
export function repeatCount(violations: Violation[], v: Violation | Partial<Violation>, date: string) {
  const key = subjectKey(v as Violation)
  if (!key) return 0
  const from = format(subMonths(parseISO(date), 12), 'yyyy-MM-dd')
  const prior = violations.filter(
    (x) => x.id !== v.id && subjectKey(x) === key && x.violation_date >= from && x.violation_date <= date
  ).length
  return prior + 1
}

/** Gợi ý hình thức xử lý theo lần vi phạm (MT-HD07 nội quy đối tác; Nội quy lao động) */
export function suggestMeasure(subjectType: string, nth: number): { key: string; note: string } | null {
  if (subjectType === 'nha_thau') {
    if (nth <= 1) return { key: 'nhac_nho', note: 'Lần 1: nhắc nhở' }
    if (nth === 2) return { key: 'canh_cao_vb', note: 'Lần 2: cảnh cáo bằng văn bản' }
    return { key: 'tam_dung', note: `Lần ${nth}: tạm dừng công việc / ra vào theo hợp đồng` }
  }
  if (subjectType === 'ca_nhan') {
    if (nth <= 1) return { key: 'nhac_nho', note: 'Lần 1: nhắc nhở, hướng dẫn lại' }
    if (nth === 2) return { key: 'khien_trach', note: 'Lần 2: xem xét khiển trách theo Nội quy lao động' }
    return {
      key: 'keo_dai_nang_luong',
      note: `Lần ${nth}: xem xét hình thức kỷ luật cao hơn theo Nội quy lao động (trình tự Điều 122 BLLĐ 2019)`,
    }
  }
  return null
}
