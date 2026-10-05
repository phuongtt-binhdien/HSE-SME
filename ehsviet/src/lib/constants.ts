// Nhãn tiếng Việt & preset nghiệp vụ dùng chung toàn ứng dụng

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Quản trị',
  manager: 'Trưởng bộ phận',
  officer: 'Cán bộ EHS',
  operator: 'Vận hành',
  viewer: 'Chỉ xem',
}

export const WASTE_CATEGORY_LABELS: Record<string, string> = {
  CTNH: 'Chất thải nguy hại',
  CTRCNTT: 'CTR công nghiệp thông thường',
  CTRSH: 'CTR sinh hoạt',
}

export const PHYSICAL_STATE_LABELS: Record<string, string> = {
  ran: 'Rắn',
  long: 'Lỏng',
  bun: 'Bùn',
}

export const TRANSFER_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  signed: 'Đã ký chứng từ',
  completed: 'Hoàn tất',
}

export const SHIFTS = ['Ca 1', 'Ca 2', 'Ca 3']

export const SYSTEM_KIND_LABELS: Record<string, string> = {
  nuoc_thai: 'Xử lý nước thải',
  khi_thai: 'Xử lý khí thải',
  khac: 'Khác',
}

export const POINT_KIND_LABELS: Record<string, string> = {
  nuoc_thai: 'Nước thải',
  khi_thai: 'Khí thải',
  xung_quanh: 'Không khí xung quanh',
  tieng_on: 'Tiếng ồn',
}

export const CHECKLIST_CATEGORY_LABELS: Record<string, string> = {
  PCCC: 'PCCC',
  VSCN: 'Vệ sinh công nghiệp',
  ATLD: 'An toàn lao động',
  MT: 'Môi trường',
}

export const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
}

export const FIRE_TYPE_LABELS: Record<string, string> = {
  binh_bot: 'Bình bột',
  binh_co2: 'Bình CO₂',
  hong_nuoc: 'Họng nước',
  may_bom: 'Máy bơm chữa cháy',
  den_exit: 'Đèn exit / sự cố',
  bao_chay: 'Báo cháy tự động',
  khac: 'Khác',
}

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  tot: 'Tốt',
  can_bao_tri: 'Cần bảo trì',
  hong: 'Hỏng',
}

export const DRILL_KIND_LABELS: Record<string, string> = {
  PCCC: 'Diễn tập PCCC',
  su_co_hoa_chat: 'Ứng phó sự cố hóa chất',
  su_co_moi_truong: 'Ứng phó sự cố môi trường',
  cap_cuu_TNLD: 'Cấp cứu tai nạn lao động',
}

export const INCIDENT_KIND_LABELS: Record<string, string> = {
  moi_truong: 'Môi trường',
  chay_no: 'Cháy nổ',
  tai_nan_ld: 'Tai nạn lao động',
  thiet_bi: 'Thiết bị',
  khac: 'Khác',
}

export const SEVERITY_LABELS: Record<string, string> = {
  nhe: 'Nhẹ',
  trung_binh: 'Trung bình',
  nghiem_trong: 'Nghiêm trọng',
}

export const INCIDENT_STATUS_LABELS: Record<string, string> = {
  open: 'Mới ghi nhận',
  investigating: 'Đang điều tra',
  closed: 'Đã đóng',
}

export const CAPA_STATUS_LABELS: Record<string, string> = {
  open: 'Chưa thực hiện',
  in_progress: 'Đang thực hiện',
  done: 'Hoàn thành',
}

export const DOC_CATEGORY_LABELS: Record<string, string> = {
  GPMT: 'Giấy phép môi trường',
  giay_phep: 'Giấy phép / chứng nhận',
  so_dang_ky: 'Sổ đăng ký',
  hop_dong: 'Hợp đồng',
  bao_cao: 'Báo cáo',
  khac: 'Khác',
}

export const TASK_CATEGORY_LABELS: Record<string, string> = {
  bao_cao: 'Báo cáo',
  quan_trac: 'Quan trắc',
  phi_le_phi: 'Phí / lệ phí',
  giay_phep: 'Giấy phép',
  dao_tao: 'Đào tạo / diễn tập',
  khac: 'Khác',
}

export const RECURRENCE_LABELS: Record<string, string> = {
  none: 'Một lần',
  monthly: 'Hàng tháng',
  quarterly: 'Hàng quý',
  yearly: 'Hàng năm',
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending: 'Chưa thực hiện',
  in_progress: 'Đang thực hiện',
  done: 'Hoàn thành',
}

export const ALERT_LEVEL_LABELS: Record<string, string> = {
  info: 'Thông tin',
  warning: 'Cảnh báo',
  critical: 'Nghiêm trọng',
}

export const ALERT_STATUS_LABELS: Record<string, string> = {
  open: 'Đang mở',
  ack: 'Đã tiếp nhận',
  resolved: 'Đã xử lý',
}

// ---------------- Preset thông số quan trắc ----------------
// Giá trị C cơ sở theo QCVN; khi nhập có thể sửa lại theo ngưỡng
// đã nhân hệ số Kq, Kf (nước thải) / Kp, Kv (khí thải) quy định tại GPMT.

export interface ParamPreset {
  parameter: string
  unit: string
  threshold?: number
  thresholdMin?: number
  regulation: string
}

export const WATER_PARAMS: ParamPreset[] = [
  { parameter: 'pH', unit: '—', threshold: 9, thresholdMin: 6, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'BOD₅ (20°C)', unit: 'mg/L', threshold: 30, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'COD', unit: 'mg/L', threshold: 75, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'TSS', unit: 'mg/L', threshold: 50, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'Amoni (tính theo N)', unit: 'mg/L', threshold: 5, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'Tổng Nitơ', unit: 'mg/L', threshold: 20, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'Tổng Phốt pho', unit: 'mg/L', threshold: 4, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'Sunfua', unit: 'mg/L', threshold: 0.2, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'Clo dư', unit: 'mg/L', threshold: 1, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'Dầu mỡ khoáng', unit: 'mg/L', threshold: 5, regulation: 'QCVN 40:2011/BTNMT cột A' },
  { parameter: 'Coliform', unit: 'MPN/100mL', threshold: 3000, regulation: 'QCVN 40:2011/BTNMT cột A' },
]

export const AIR_PARAMS: ParamPreset[] = [
  { parameter: 'Bụi tổng', unit: 'mg/Nm³', threshold: 200, regulation: 'QCVN 19:2009/BTNMT cột B' },
  { parameter: 'SO₂', unit: 'mg/Nm³', threshold: 500, regulation: 'QCVN 19:2009/BTNMT cột B' },
  { parameter: 'NOₓ (tính theo NO₂)', unit: 'mg/Nm³', threshold: 850, regulation: 'QCVN 19:2009/BTNMT cột B' },
  { parameter: 'CO', unit: 'mg/Nm³', threshold: 1000, regulation: 'QCVN 19:2009/BTNMT cột B' },
]
