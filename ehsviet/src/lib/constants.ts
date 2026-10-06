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
  HC: 'Hóa chất',
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

// ---------------- Nhân sự & huấn luyện ----------------

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active: 'Đang làm việc',
  inactive: 'Đã nghỉ',
}

export const GENDER_LABELS: Record<string, string> = {
  nam: 'Nam',
  nu: 'Nữ',
}

/** 6 nhóm đối tượng huấn luyện ATVSLĐ — NĐ 44/2016/NĐ-CP (sửa đổi bởi NĐ 140/2018/NĐ-CP) */
export const ATVSLD_GROUP_LABELS: Record<string, string> = {
  '1': 'Nhóm 1 – Quản lý phụ trách ATVSLĐ',
  '2': 'Nhóm 2 – Người làm công tác ATVSLĐ',
  '3': 'Nhóm 3 – Công việc yêu cầu nghiêm ngặt',
  '4': 'Nhóm 4 – Người lao động khác',
  '5': 'Nhóm 5 – Người làm công tác y tế',
  '6': 'Nhóm 6 – An toàn, vệ sinh viên',
}

export const TRAINING_CATEGORY_LABELS: Record<string, string> = {
  atvsld: 'An toàn, vệ sinh lao động',
  pccc: 'PCCC & CNCH',
  su_co_chat_thai: 'Ứng phó sự cố chất thải',
  hoa_chat: 'An toàn hóa chất',
  so_cap_cuu: 'Sơ cứu, cấp cứu',
  khac: 'Khác',
}

/** Nhãn ngắn dùng cho tiêu đề cột ma trận */
export const TRAINING_CATEGORY_SHORT: Record<string, string> = {
  atvsld: 'ATVSLĐ',
  pccc: 'PCCC',
  su_co_chat_thai: 'Sự cố chất thải',
  hoa_chat: 'Hóa chất',
  so_cap_cuu: 'Sơ cứu',
  khac: 'Khác',
}

/** Căn cứ và chu kỳ mặc định — đối chiếu văn bản hiện hành trước khi dùng làm căn cứ chính thức */
export const TRAINING_CATEGORY_BASIS: Record<string, string> = {
  atvsld:
    'Luật ATVSLĐ 2015; NĐ 44/2016/NĐ-CP (sửa đổi bởi NĐ 140/2018/NĐ-CP). Định kỳ: nhóm 4 hằng năm; nhóm 1, 2, 3, 5, 6 ít nhất 2 năm/lần (nhóm 3 kèm thẻ an toàn).',
  pccc:
    'Luật PCCC và CNCH 2024; NĐ 105/2025/NĐ-CP. Đội PCCC cơ sở được huấn luyện, bồi dưỡng nghiệp vụ; nhà máy bồi dưỡng lại hằng năm. Nhập "Hạn" theo giấy chứng nhận nếu khác.',
  su_co_chat_thai:
    'Luật BVMT 2020; NĐ 08/2022/NĐ-CP; QĐ 09/2020/QĐ-TTg (Quy chế ứng phó sự cố chất thải); Quy định tuân thủ môi trường nội bộ: tập huấn lại hằng năm.',
  hoa_chat:
    'Luật Hóa chất 69/2025/QH15 và văn bản hướng dẫn: huấn luyện an toàn hóa chất cho người tiếp xúc hóa chất (HTXLNT, phòng thí nghiệm, kho).',
  so_cap_cuu: 'TT 19/2016/TT-BYT: lực lượng sơ cứu, cấp cứu tại nơi làm việc.',
  khac: 'Đào tạo khác (nhận thức ISO 14001, phân loại chất thải tại nguồn…).',
}

export const TRAINING_RESULT_LABELS: Record<string, string> = {
  dat: 'Đạt',
  khong_dat: 'Không đạt',
}

export const TRAINING_STATE_LABELS: Record<string, string> = {
  con_han: 'Còn hạn',
  sap_het: 'Sắp hết hạn',
  het_han: 'Hết hạn',
  chua: 'Chưa huấn luyện',
}

/** Gợi ý bộ phận / khu vực của nhà máy NPK (vẫn nhập tự do được) */
export const DEPARTMENT_SUGGESTIONS = [
  'Ban Điều hành Nhà máy',
  'Phòng Kỹ thuật Sản xuất',
  'Xưởng Tạo hạt 1',
  'Xưởng Tạo hạt 2',
  'Xưởng Tạo hạt 3',
  'Xưởng Trộn',
  'Tổ Lò hơi',
  'Tổ Cơ điện',
  'Kho nguyên liệu – thành phẩm',
  'Tổ vận hành HTXLNT',
  'Phòng thí nghiệm (KCS)',
  'Tổ Bảo vệ',
  'Nhà ăn',
  'Cầu cảng',
]

// ---------------- ESG ----------------

export const PILLAR_LABELS: Record<string, string> = {
  E: 'Môi trường',
  S: 'Xã hội',
  G: 'Quản trị',
}

export const POLICY_STATUS_LABELS: Record<string, string> = {
  draft: 'Dự thảo',
  active: 'Đang hiệu lực',
  review: 'Đang soát xét',
  retired: 'Hết hiệu lực',
}

// ---------------- Nội quy & tuân thủ nội bộ ----------------

export const RULE_CATEGORY_LABELS: Record<string, string> = {
  moi_truong: 'Môi trường',
  vscn: 'Vệ sinh công nghiệp',
  atvsld: 'An toàn lao động',
  pccc: 'PCCC',
  hoa_chat: 'Hóa chất',
  nha_thau: 'Nhà thầu, khách',
  lao_dong: 'Nội quy lao động',
  khac: 'Khác',
}

export const RULE_STATUS_LABELS: Record<string, string> = {
  draft: 'Dự thảo',
  active: 'Đang áp dụng',
  retired: 'Hết hiệu lực',
}

/** Loại "lần không đạt" — Quy định tuân thủ MT nội bộ (đếm vi phạm, xếp loại tháng) */
export const VIOLATION_KIND_LABELS: Record<string, string> = {
  thong_so: 'Thông số vượt giới hạn',
  khu_vuc: 'Khu vực VSCN không đạt',
  diem_thu_gom: 'Điểm thu gom chất thải không đạt',
  hanh_vi: 'Hành vi sai quy định',
}

export const SUBJECT_TYPE_LABELS: Record<string, string> = {
  don_vi: 'Đơn vị (tập thể)',
  ca_nhan: 'Cá nhân người lao động',
  nha_thau: 'Nhà thầu, khách',
}

/** Hình thức xử lý theo đối tượng. Người lao động: không phạt tiền (BLLĐ 2019 Điều 127). */
export const MEASURE_LABELS: Record<string, Record<string, string>> = {
  don_vi: {
    khac_phuc: 'Yêu cầu khắc phục trong hạn',
    giai_trinh: 'Trưởng đơn vị giải trình, lập kế hoạch khắc phục',
    bao_cao_bdh: 'Báo cáo Ban Điều hành, kiểm tra lại trong tháng',
  },
  ca_nhan: {
    nhac_nho: 'Nhắc nhở, hướng dẫn lại',
    dao_tao_lai: 'Đào tạo lại',
    khien_trach: 'Khiển trách',
    keo_dai_nang_luong: 'Kéo dài thời hạn nâng lương ≤ 6 tháng',
    cach_chuc: 'Cách chức',
    sa_thai: 'Sa thải',
  },
  nha_thau: {
    nhac_nho: 'Nhắc nhở',
    canh_cao_vb: 'Cảnh cáo bằng văn bản',
    tam_dung: 'Tạm dừng công việc / ra vào',
    thay_nguoi: 'Yêu cầu thay người',
    phat_hop_dong: 'Phạt vi phạm hợp đồng',
    boi_thuong: 'Bồi thường thiệt hại',
  },
}

export const VIOLATION_STATUS_LABELS: Record<string, string> = {
  open: 'Chưa khắc phục',
  fixing: 'Đang khắc phục',
  closed: 'Đã khắc phục',
}
