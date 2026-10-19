// Thiết bị: biên bản hư hỏng → sửa chữa (Tổ Cơ điện / thuê ngoài) → nghiệm thu an toàn → đưa vào vận hành / thanh lý;
// kiểm định máy, thiết bị có yêu cầu nghiêm ngặt về ATVSLĐ (Luật ATVSLĐ 2015 Điều 30–31; TT 36/2019/TT-BLĐTBXH;
// khai báo theo NQ 66.18/2026/NQ-CP; xử phạt NĐ 283/2026/NĐ-CP Điều 35).
import { differenceInCalendarDays, parseISO } from 'date-fns'
import type { Tone } from '../components/UI'
import { daysUntil } from './utils'

export interface Equipment {
  id: string
  code: string | null
  name: string
  category: string
  strict_safety: boolean
  department: string | null
  location: string | null
  manufacturer: string | null
  model: string | null
  serial_no: string | null
  year_made: number | null
  commissioned_date: string | null
  inspection_cycle_months: number | null
  last_inspection: string | null
  next_inspection: string | null
  inspection_org: string | null
  maintainer: 'to_co_dien' | 'thue_ngoai'
  status: string
  note: string | null
}

export interface WorkOrder {
  id: string
  equipment_id: string
  report_no: string | null
  report_date: string
  reported_by: string | null
  description: string
  cause: string | null
  priority: string
  env_impact: boolean
  safety_impact: boolean
  assignee: 'to_co_dien' | 'thue_ngoai'
  contractor_name: string | null
  due_date: string | null
  repair_start_date: string | null
  repair_done_date: string | null
  repair_content: string | null
  cost: number | null
  acceptance_date: string | null
  acceptance_no: string | null
  safety_result: 'dat' | 'khong_dat' | null
  outcome: 'van_hanh' | 'thanh_ly' | null
  outcome_date: string | null
  outcome_no: string | null
  status: WoStatus
  note: string | null
}

export interface EquipmentInspection {
  id: string
  equipment_id: string
  inspection_date: string
  kind: 'kiem_dinh' | 'bao_duong' | 'kiem_tra'
  organization: string | null
  certificate_no: string | null
  result: 'dat' | 'khong_dat'
  next_due: string | null
  note: string | null
}

export type WoStatus = 'moi' | 'dang_sua' | 'cho_nghiem_thu' | 'hoan_thanh' | 'thanh_ly' | 'huy'

export const EQUIPMENT_CATEGORY_LABELS: Record<string, string> = {
  san_xuat: 'Thiết bị sản xuất',
  moi_truong: 'Công trình, thiết bị BVMT',
  ap_luc: 'Thiết bị áp lực (nồi hơi, bình, đường ống)',
  dien: 'Điện, máy phát, máy nén',
  nang_ha: 'Thiết bị nâng (cầu trục, cẩu)',
  phuong_tien: 'Xe nâng, phương tiện',
  pccc: 'Hệ thống, thiết bị PCCC',
  phong_thi_nghiem: 'Thiết bị phòng thí nghiệm',
  khac: 'Khác',
}

export const MAINTAINER_LABELS: Record<string, string> = {
  to_co_dien: 'Tổ Cơ điện',
  thue_ngoai: 'Thuê ngoài',
}

export const MACHINE_STATUS_LABELS: Record<string, string> = {
  van_hanh: 'Đang vận hành',
  hu_hong: 'Hư hỏng – chờ sửa',
  sua_chua: 'Đang sửa chữa',
  cho_nghiem_thu: 'Chờ nghiệm thu',
  ngung: 'Ngừng sử dụng',
  thanh_ly: 'Đã thanh lý',
}

export const MACHINE_STATUS_TONE: Record<string, Tone> = {
  van_hanh: 'green',
  hu_hong: 'red',
  sua_chua: 'amber',
  cho_nghiem_thu: 'blue',
  ngung: 'gray',
  thanh_ly: 'gray',
}

export const WO_STATUS_LABELS: Record<WoStatus, string> = {
  moi: 'Mới báo hỏng',
  dang_sua: 'Đang sửa chữa',
  cho_nghiem_thu: 'Chờ nghiệm thu',
  hoan_thanh: 'Đã đưa vào vận hành',
  thanh_ly: 'Đã thanh lý',
  huy: 'Hủy',
}

export const WO_STATUS_TONE: Record<WoStatus, Tone> = {
  moi: 'red',
  dang_sua: 'amber',
  cho_nghiem_thu: 'blue',
  hoan_thanh: 'green',
  thanh_ly: 'gray',
  huy: 'gray',
}

export const PRIORITY_LABELS: Record<string, string> = {
  khan_cap: 'Khẩn cấp',
  cao: 'Cao',
  trung_binh: 'Trung bình',
  thap: 'Thấp',
}

export const PRIORITY_TONE: Record<string, Tone> = { khan_cap: 'red', cao: 'amber', trung_binh: 'blue', thap: 'gray' }

/** Hạn hoàn thành gợi ý theo mức ưu tiên (ngày kể từ ngày lập biên bản) */
export const PRIORITY_DUE_DAYS: Record<string, number> = { khan_cap: 1, cao: 3, trung_binh: 7, thap: 15 }

export const INSPECTION_KIND_LABELS: Record<string, string> = {
  kiem_dinh: 'Kiểm định kỹ thuật an toàn',
  bao_duong: 'Bảo dưỡng định kỳ',
  kiem_tra: 'Kiểm tra định kỳ',
}

/**
 * Một số máy, thiết bị có yêu cầu nghiêm ngặt về ATVSLĐ thường gặp tại nhà máy phân bón (TT 36/2019/TT-BLĐTBXH).
 * Chu kỳ chỉ là gợi ý — hạn kiểm định ghi theo giấy chứng nhận và quy trình kiểm định tương ứng.
 */
export const STRICT_PRESETS: { name: string; category: string; cycle: number }[] = [
  { name: 'Nồi hơi', category: 'ap_luc', cycle: 24 },
  { name: 'Bình chịu áp lực (bình khí nén, bình chứa)', category: 'ap_luc', cycle: 36 },
  { name: 'Hệ thống đường ống dẫn hơi nước, nước nóng', category: 'ap_luc', cycle: 36 },
  { name: 'Xe nâng hàng', category: 'phuong_tien', cycle: 24 },
  { name: 'Cầu trục, cổng trục, palăng điện', category: 'nang_ha', cycle: 24 },
  { name: 'Cần trục (cẩu bờ, cẩu tự hành)', category: 'nang_ha', cycle: 24 },
  { name: 'Thang máy, sàn nâng người', category: 'nang_ha', cycle: 24 },
  { name: 'Chai chứa khí (oxy, acetylene, CO₂)', category: 'ap_luc', cycle: 60 },
]

export const STRICT_BASIS =
  'Luật ATVSLĐ 2015 Điều 30–31: kiểm định trước khi đưa vào sử dụng và định kỳ; danh mục TT 36/2019/TT-BLĐTBXH; khai báo theo NQ 66.18/2026/NQ-CP (01/7/2026 – 28/02/2027: khai báo với cơ quan chuyên môn của UBND tỉnh). Xử phạt NĐ 283/2026/NĐ-CP Điều 35: không khai báo 1–2 tr; không kiểm định 20–75 tr; sử dụng thiết bị kiểm định không đạt 50–75 tr (tổ chức × 2).'

export const isOpenWo = (w: Pick<WorkOrder, 'status'>) => w.status === 'moi' || w.status === 'dang_sua' || w.status === 'cho_nghiem_thu'

export interface Alert {
  tone: Tone
  label: string
}

/** Cảnh báo của một phiếu sửa chữa: quá hạn, sắp đến hạn, chờ nghiệm thu lâu, nghiệm thu không đạt an toàn */
export function woAlerts(w: WorkOrder, today = new Date()): Alert[] {
  const out: Alert[] = []
  if (w.status === 'moi' || w.status === 'dang_sua') {
    if (w.safety_result === 'khong_dat') out.push({ tone: 'red', label: 'Nghiệm thu không đạt an toàn – sửa lại' })
    if (!w.due_date) out.push({ tone: 'amber', label: 'Chưa đặt hạn hoàn thành' })
    else {
      const n = differenceInCalendarDays(parseISO(w.due_date), today)
      if (n < 0) out.push({ tone: 'red', label: `Quá hạn ${-n} ngày` })
      else if (n === 0) out.push({ tone: 'red', label: 'Hạn hôm nay' })
      else if (n <= 2) out.push({ tone: 'amber', label: `Còn ${n} ngày` })
    }
  }
  if (w.status === 'cho_nghiem_thu' && w.repair_done_date) {
    const k = differenceInCalendarDays(today, parseISO(w.repair_done_date))
    if (k > 3) out.push({ tone: 'amber', label: `Chờ nghiệm thu ${k} ngày` })
  }
  return out
}

export const isOverdueWo = (w: WorkOrder, today = new Date()) =>
  (w.status === 'moi' || w.status === 'dang_sua') && !!w.due_date && differenceInCalendarDays(parseISO(w.due_date), today) < 0

export type InspectionState = 'khong_ap_dung' | 'chua_co' | 'qua_han' | 'sap_den' | 'con_han'

/** Hạn kiểm định / kiểm tra định kỳ của thiết bị */
export function inspectionState(e: Pick<Equipment, 'strict_safety' | 'next_inspection' | 'status'>): { state: InspectionState; daysLeft: number | null } {
  if (e.status === 'thanh_ly') return { state: 'khong_ap_dung', daysLeft: null }
  if (!e.next_inspection) return { state: e.strict_safety ? 'chua_co' : 'khong_ap_dung', daysLeft: null }
  const n = daysUntil(e.next_inspection)
  return { state: n < 0 ? 'qua_han' : n <= 30 ? 'sap_den' : 'con_han', daysLeft: n }
}

export const INSPECTION_STATE_TONE: Record<InspectionState, Tone> = {
  khong_ap_dung: 'gray',
  chua_co: 'red',
  qua_han: 'red',
  sap_den: 'amber',
  con_han: 'green',
}

export function inspectionLabel(s: { state: InspectionState; daysLeft: number | null }) {
  switch (s.state) {
    case 'chua_co':
      return 'Chưa có hạn kiểm định'
    case 'qua_han':
      return `Quá hạn ${-(s.daysLeft ?? 0)} ngày`
    case 'sap_den':
      return `Còn ${s.daysLeft} ngày`
    case 'con_han':
      return 'Còn hạn'
    default:
      return '—'
  }
}

/** Trạng thái thực tế: thiết bị đã thanh lý / ngừng giữ nguyên; còn lại lấy theo phiếu sửa chữa đang mở nặng nhất */
export function liveStatus(e: Equipment, open: WorkOrder[]): string {
  if (e.status === 'thanh_ly' || e.status === 'ngung') return e.status
  if (open.some((w) => w.status === 'moi')) return 'hu_hong'
  if (open.some((w) => w.status === 'dang_sua')) return 'sua_chua'
  if (open.some((w) => w.status === 'cho_nghiem_thu')) return 'cho_nghiem_thu'
  return 'van_hanh'
}

/** Số ngày từ lập biên bản hư hỏng đến khi đưa vào vận hành (MTTR) – phiếu đã hoàn thành */
export function repairDays(w: WorkOrder): number | null {
  const end = w.outcome_date ?? w.acceptance_date ?? w.repair_done_date
  if (!end || w.status !== 'hoan_thanh') return null
  return Math.max(0, differenceInCalendarDays(parseISO(end), parseISO(w.report_date)))
}

/**
 * Trạng thái phiếu suy ra từ các mốc đã ghi (cho phép nhập lại hồ sơ cũ một lần):
 * thanh lý → đưa vào vận hành (an toàn đạt) → nghiệm thu không đạt (sửa lại) → chờ nghiệm thu → đang sửa → mới.
 */
export function deriveWoStatus(
  w: Pick<WorkOrder, 'outcome' | 'safety_result' | 'acceptance_date' | 'repair_done_date' | 'repair_start_date'> & { status?: WoStatus }
): WoStatus {
  if (w.status === 'huy') return 'huy'
  if (w.outcome === 'thanh_ly') return 'thanh_ly'
  if (w.outcome === 'van_hanh' && w.safety_result === 'dat') return 'hoan_thanh'
  if (w.acceptance_date && w.safety_result === 'khong_dat') return 'dang_sua'
  if (w.repair_done_date) return 'cho_nghiem_thu'
  if (w.repair_start_date) return 'dang_sua'
  return 'moi'
}

/** Bước hiện tại của quy trình (1 biên bản – 2 sửa chữa – 3 nghiệm thu – 4 kết thúc) */
export function woStep(w: Pick<WorkOrder, 'status'>): number {
  switch (w.status) {
    case 'moi':
      return 1
    case 'dang_sua':
      return 2
    case 'cho_nghiem_thu':
      return 3
    default:
      return 4
  }
}

export const ENV_IMPACT_NOTE =
  'Hư hỏng công trình, thiết bị BVMT: khắc phục ngay, giảm tải hoặc dừng công đoạn phát thải liên quan; ghi nhật ký sự cố. Không vận hành hoặc vận hành không đúng công trình xử lý chất thải theo GPMT: NĐ 45/2022 Điều 11 k2 g (GPMT cấp tỉnh: 170–200 tr; tổ chức × 2).'
