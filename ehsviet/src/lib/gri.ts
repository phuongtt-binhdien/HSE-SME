// Chỉ mục GRI (GRI Standards 2021 + chủ đề), ánh xạ nội dung bắt buộc TT 96/2020 PL IV
// và chỉ số tự tính cho mục tiêu ESG. Số liệu tự động lấy từ các module; phần còn lại nhập tay
// theo năm (bảng esg_metrics).
import type { GhgSummary } from './ghg'

export interface GriContext {
  year: number
  ghg: GhgSummary
  /** sản lượng thành phẩm (tấn) — mẫu số của các chỉ số cường độ */
  production: number | null
  employeesActive: number
  employeesFemale: number
  employeesWithGender: number
  training: { hours: number; sessions: number; byCategory: Record<string, number> }
  /** % người lao động còn hiệu lực huấn luyện (hiện tại) */
  coverage: Record<string, number>
  incidents: { tnld: number; tnldSerious: number; env: number }
  waste: { ctnhKg: number; ctrcnKg: number; ctrshKg: number; transferredKg: number }
  wastewaterM3: number | null
  violations: number
  policiesActive: number
}

export interface GriItem {
  code: string
  title: string
  pillar: 'C' | 'E' | 'S' | 'G'
  unit?: string
  /** auto = tính từ module; manual = nhập số theo năm; text = nội dung định tính */
  kind: 'auto' | 'manual' | 'text'
  auto?: (c: GriContext) => number | null
  source?: string
  hint?: string
  /** mục II của Phụ lục IV TT 96/2020/TT-BTC (nội dung bắt buộc trong Báo cáo thường niên) */
  tt96?: number
  /** chuẩn thay thế từ kỳ báo cáo 01/01/2027 */
  transition?: string
}

const ratio = (a: number, b: number | null | undefined) => (b && b > 0 ? a / b : null)
const nz = (v: number) => (v > 0 ? v : null)

export const GRI_ITEMS: GriItem[] = [
  // ----- Công bố chung -----
  {
    code: 'GRI 2-1',
    title: 'Thông tin tổ chức',
    pillar: 'C',
    kind: 'text',
    hint: 'Tên, hình thức sở hữu, trụ sở, địa điểm hoạt động của cơ sở báo cáo.',
  },
  {
    code: 'GRI 2-7',
    title: 'Người lao động',
    pillar: 'C',
    unit: 'người',
    kind: 'auto',
    auto: (c) => nz(c.employeesActive),
    source: 'Nhân sự đang làm việc (module Nhân sự & Huấn luyện)',
    tt96: 6,
  },
  {
    code: 'GRI 2-8',
    title: 'Người làm việc không phải nhân viên (nhà thầu thường xuyên)',
    pillar: 'C',
    unit: 'người',
    kind: 'manual',
  },
  {
    code: 'GRI 2-23',
    title: 'Cam kết chính sách',
    pillar: 'C',
    unit: 'chính sách',
    kind: 'auto',
    auto: (c) => nz(c.policiesActive),
    source: 'Chính sách ESG đang hiệu lực',
  },
  {
    code: 'GRI 2-27',
    title: 'Tuân thủ pháp luật – số vụ bị xử phạt về môi trường',
    pillar: 'C',
    unit: 'vụ',
    kind: 'manual',
    hint: 'Ghi tổng tiền phạt vào "Ghi chú" (TT 96/2020 PL IV mục II.5).',
    tt96: 5,
  },
  {
    code: 'GRI 3-2',
    title: 'Danh mục chủ đề trọng yếu',
    pillar: 'C',
    kind: 'text',
    hint: 'Kết quả đánh giá trọng yếu kép, có tham vấn bên liên quan.',
  },
  // ----- Môi trường -----
  {
    code: 'GRI 301-1',
    title: 'Vật liệu sử dụng (nguyên liệu chính + bao bì)',
    pillar: 'E',
    unit: 't',
    kind: 'manual',
    tt96: 2,
  },
  {
    code: 'GRI 301-2',
    title: 'Tỷ lệ vật liệu tái chế, tái sử dụng',
    pillar: 'E',
    unit: '%',
    kind: 'manual',
    tt96: 2,
  },
  {
    code: 'GRI 302-1',
    title: 'Năng lượng tiêu thụ trong tổ chức',
    pillar: 'E',
    unit: 'GJ',
    kind: 'auto',
    auto: (c) => nz(c.ghg.gj),
    source: 'Quy đổi từ số liệu hoạt động KNK (nhiệt trị nhiên liệu; 3,6 MJ/kWh)',
    tt96: 3,
    transition: 'GRI 103: Energy 2025',
  },
  {
    code: 'GRI 302-1 (NLTT)',
    title: 'Tỷ lệ năng lượng tái tạo (sinh khối, điện mặt trời)',
    pillar: 'E',
    unit: '%',
    kind: 'auto',
    auto: (c) => (c.ghg.gj > 0 ? (c.ghg.renewableGJ / c.ghg.gj) * 100 : null),
    source: 'Số liệu KNK: nguồn sinh khối, điện mặt trời',
    tt96: 3,
    transition: 'GRI 103: Energy 2025',
  },
  {
    code: 'GRI 302-3',
    title: 'Cường độ năng lượng',
    pillar: 'E',
    unit: 'GJ/t thành phẩm',
    kind: 'auto',
    auto: (c) => ratio(c.ghg.gj, c.production),
    source: 'Năng lượng ÷ sản lượng thành phẩm',
    transition: 'GRI 103: Energy 2025',
  },
  {
    code: 'SDNL',
    title: 'Năng lượng quy đổi (≥ 1.000 TOE: cơ sở sử dụng năng lượng trọng điểm)',
    pillar: 'E',
    unit: 'TOE',
    kind: 'auto',
    auto: (c) => nz(c.ghg.toe),
    source: 'Than 0,70 TOE/t; DO 0,88 TOE/1.000 L; điện 0,1543 TOE/MWh',
  },
  {
    code: 'GRI 302-4',
    title: 'Năng lượng tiết kiệm được nhờ giải pháp',
    pillar: 'E',
    unit: 'GJ',
    kind: 'manual',
    tt96: 3,
    transition: 'GRI 103: Energy 2025',
  },
  {
    code: 'GRI 303-3',
    title: 'Nước khai thác (nước mặt cấp)',
    pillar: 'E',
    unit: 'm³',
    kind: 'manual',
    tt96: 4,
  },
  {
    code: 'GRI 303-4',
    title: 'Nước thải xả ra sau HTXLNT',
    pillar: 'E',
    unit: 'm³',
    kind: 'auto',
    auto: (c) => c.wastewaterM3,
    source: 'Tổng lưu lượng trong nhật ký vận hành HTXLNT (nhập tay để ghi đè)',
  },
  {
    code: 'GRI 303-5',
    title: 'Nước tiêu thụ',
    pillar: 'E',
    unit: 'm³',
    kind: 'manual',
    tt96: 4,
  },
  {
    code: 'TT96 II.4',
    title: 'Tỷ lệ nước tái chế, tái sử dụng',
    pillar: 'E',
    unit: '%',
    kind: 'manual',
    tt96: 4,
  },
  {
    code: 'GRI 305-1',
    title: 'Phát thải KNK trực tiếp (phạm vi 1)',
    pillar: 'E',
    unit: 'tCO₂e',
    kind: 'auto',
    auto: (c) => (c.ghg.hasData ? c.ghg.s1 : null),
    source: 'Kiểm kê KNK',
    tt96: 1,
    transition: 'GRI 102-5',
  },
  {
    code: 'GRI 305-2',
    title: 'Phát thải KNK gián tiếp từ năng lượng (phạm vi 2, theo vị trí)',
    pillar: 'E',
    unit: 'tCO₂e',
    kind: 'auto',
    auto: (c) => (c.ghg.hasData ? c.ghg.s2 : null),
    source: 'Kiểm kê KNK – điện lưới',
    tt96: 1,
    transition: 'GRI 102-6',
  },
  {
    code: 'GRI 305-3',
    title: 'Phát thải KNK gián tiếp khác (phạm vi 3)',
    pillar: 'E',
    unit: 'tCO₂e',
    kind: 'auto',
    auto: (c) => nz(c.ghg.s3),
    source: 'Kiểm kê KNK – hạng mục phạm vi 3 đã nhập',
    transition: 'GRI 102-7',
  },
  {
    code: 'GRI 305 (CO₂ sinh khối)',
    title: 'CO₂ sinh khối – báo cáo riêng, không cộng phạm vi 1',
    pillar: 'E',
    unit: 'tCO₂',
    kind: 'auto',
    auto: (c) => nz(c.ghg.biogenic),
    source: 'Kiểm kê KNK – nguồn sinh khối',
  },
  {
    code: 'GRI 305-4',
    title: 'Cường độ phát thải KNK (phạm vi 1 + 2)',
    pillar: 'E',
    unit: 'tCO₂e/t thành phẩm',
    kind: 'auto',
    auto: (c) => (c.ghg.hasData ? ratio(c.ghg.total12, c.production) : null),
    source: '(PV1 + PV2) ÷ sản lượng thành phẩm',
    transition: 'GRI 102: Climate Change 2025',
  },
  {
    code: 'GRI 305-5',
    title: 'Giảm phát thải KNK nhờ sáng kiến',
    pillar: 'E',
    unit: 'tCO₂e',
    kind: 'manual',
    tt96: 1,
    transition: 'GRI 102-4',
  },
  {
    code: 'GRI 305-6',
    title: 'Chất làm suy giảm tầng ô-dôn (ODS)',
    pillar: 'E',
    unit: 'kg CFC-11e',
    kind: 'manual',
  },
  {
    code: 'GRI 305-7',
    title: 'NOx, SOx, bụi và khí thải đáng kể khác',
    pillar: 'E',
    unit: 't/năm',
    kind: 'manual',
    hint: 'Khối lượng = nồng độ × lưu lượng × giờ vận hành (không báo cáo nồng độ).',
  },
  {
    code: 'GRI 306-3',
    title: 'Chất thải phát sinh (CTNH + CTRCN + CTRSH)',
    pillar: 'E',
    unit: 't',
    kind: 'auto',
    auto: (c) => nz((c.waste.ctnhKg + c.waste.ctrcnKg + c.waste.ctrshKg) / 1000),
    source: 'Nhật ký phát sinh chất thải',
  },
  {
    code: 'GRI 306-3 (CTNH)',
    title: 'Chất thải nguy hại phát sinh',
    pillar: 'E',
    unit: 'kg',
    kind: 'auto',
    auto: (c) => nz(c.waste.ctnhKg),
    source: 'Nhật ký phát sinh chất thải – nhóm CTNH',
  },
  {
    code: 'GRI 306-4',
    title: 'Chất thải chuyển hướng khỏi thải bỏ (tái sử dụng, tái chế)',
    pillar: 'E',
    unit: 't',
    kind: 'manual',
    hint: 'Hạt nix, phế phẩm, bao bì tái sử dụng tại chỗ; phế liệu bán tái chế.',
  },
  {
    code: 'GRI 306-5',
    title: 'Chất thải chuyển giao xử lý, thải bỏ',
    pillar: 'E',
    unit: 't',
    kind: 'auto',
    auto: (c) => nz(c.waste.transferredKg / 1000),
    source: 'Chứng từ bàn giao đã ký / hoàn tất',
  },
  {
    code: 'GRI 308-1',
    title: 'Nhà cung cấp mới được sàng lọc theo tiêu chí môi trường',
    pillar: 'E',
    unit: '%',
    kind: 'manual',
  },
  // ----- Xã hội -----
  {
    code: 'GRI 403-5',
    title: 'Huấn luyện ATVSLĐ, PCCC, ứng phó sự cố cho người lao động',
    pillar: 'S',
    unit: 'lượt',
    kind: 'auto',
    auto: (c) =>
      nz(
        ['atvsld', 'pccc', 'su_co_chat_thai', 'hoa_chat', 'so_cap_cuu'].reduce(
          (s, k) => s + (c.training.byCategory[k] ?? 0),
          0
        )
      ),
    source: 'Lượt huấn luyện đạt trong năm',
    tt96: 6,
  },
  {
    code: 'GRI 403-9',
    title: 'Tai nạn lao động',
    pillar: 'S',
    unit: 'vụ',
    kind: 'auto',
    auto: (c) => c.incidents.tnld,
    source: 'Sự cố loại "Tai nạn lao động" (module PCCC & An toàn)',
    tt96: 6,
  },
  {
    code: 'GRI 403-9 (nghiêm trọng)',
    title: 'Tai nạn lao động nghiêm trọng',
    pillar: 'S',
    unit: 'vụ',
    kind: 'auto',
    auto: (c) => c.incidents.tnldSerious,
    source: 'Sự cố TNLĐ mức "Nghiêm trọng"',
  },
  {
    code: 'GRI 403-10',
    title: 'Bệnh nghề nghiệp',
    pillar: 'S',
    unit: 'ca',
    kind: 'manual',
  },
  {
    code: 'GRI 404-1',
    title: 'Số giờ đào tạo bình quân',
    pillar: 'S',
    unit: 'giờ/người',
    kind: 'auto',
    auto: (c) => ratio(c.training.hours, c.employeesActive),
    source: 'Tổng giờ các khóa huấn luyện ÷ người lao động',
    tt96: 6,
  },
  {
    code: 'GRI 405-1',
    title: 'Tỷ lệ lao động nữ',
    pillar: 'S',
    unit: '%',
    kind: 'auto',
    auto: (c) =>
      c.employeesWithGender > 0 ? (c.employeesFemale / c.employeesWithGender) * 100 : null,
    source: 'Nhân sự đang làm việc có ghi giới tính',
  },
  {
    code: 'TT96 II.6',
    title: 'Thu nhập bình quân người lao động',
    pillar: 'S',
    unit: 'triệu đ/tháng',
    kind: 'manual',
    tt96: 6,
  },
  {
    code: 'GRI 413-1',
    title: 'Hoạt động gắn kết, đầu tư cộng đồng',
    pillar: 'S',
    kind: 'text',
    tt96: 7,
  },
  // ----- Quản trị -----
  {
    code: 'GRI 205-2',
    title: 'Truyền thông, đào tạo phòng, chống tham nhũng',
    pillar: 'G',
    kind: 'text',
  },
  {
    code: 'GRI 205-3',
    title: 'Vụ việc tham nhũng được xác nhận',
    pillar: 'G',
    unit: 'vụ',
    kind: 'manual',
  },
  {
    code: 'Nội bộ',
    title: 'Vi phạm nội quy nội bộ được lập biên bản',
    pillar: 'G',
    unit: 'vụ',
    kind: 'auto',
    auto: (c) => c.violations,
    source: 'Module Nội quy & tuân thủ',
  },
  {
    code: 'TT96 II.8',
    title: 'Hoạt động trên thị trường vốn xanh',
    pillar: 'G',
    kind: 'text',
    tt96: 8,
  },
]

/** 8 nhóm nội dung môi trường – xã hội bắt buộc trong Báo cáo thường niên (TT 96/2020/TT-BTC PL IV mục II) */
export const TT96_GROUPS: { no: number; title: string }[] = [
  { no: 1, title: 'Phát thải KNK trực tiếp, gián tiếp; sáng kiến giảm phát thải' },
  { no: 2, title: 'Nguyên vật liệu sản xuất, đóng gói; % vật liệu tái chế' },
  { no: 3, title: 'Năng lượng tiêu thụ; năng lượng tiết kiệm; năng lượng tái tạo' },
  { no: 4, title: 'Nguồn và lượng nước sử dụng; % nước tái chế, tái sử dụng' },
  { no: 5, title: 'Số lần, tổng tiền bị phạt vi phạm môi trường' },
  { no: 6, title: 'Người lao động: số lượng, thu nhập; an toàn – sức khỏe; giờ đào tạo' },
  { no: 7, title: 'Đầu tư cộng đồng' },
  { no: 8, title: 'Thị trường vốn xanh' },
]

export const PILLAR_ORDER: Record<string, number> = { C: 0, E: 1, S: 2, G: 3 }

export const GRI_PILLAR_LABELS: Record<string, string> = {
  C: 'Công bố chung',
  E: 'Môi trường',
  S: 'Xã hội',
  G: 'Quản trị',
}

// ---------------- Chỉ số tự tính cho mục tiêu ESG ----------------

export interface TargetMetric {
  key: string
  label: string
  unit: string
  /** true = không phụ thuộc năm (ảnh chụp hiện tại) */
  snapshot?: boolean
  compute: (c: GriContext) => number | null
}

export const TARGET_METRICS: TargetMetric[] = [
  { key: 'ghg_total', label: 'Phát thải KNK phạm vi 1 + 2', unit: 'tCO₂e', compute: (c) => (c.ghg.hasData ? c.ghg.total12 : null) },
  {
    key: 'ghg_intensity',
    label: 'Cường độ phát thải KNK',
    unit: 'tCO₂e/t thành phẩm',
    compute: (c) => (c.ghg.hasData ? ratio(c.ghg.total12, c.production) : null),
  },
  { key: 'energy_toe', label: 'Năng lượng quy đổi', unit: 'TOE', compute: (c) => nz(c.ghg.toe) },
  {
    key: 'energy_intensity',
    label: 'Cường độ năng lượng',
    unit: 'kgOE/t thành phẩm',
    compute: (c) => {
      const r = ratio(c.ghg.toe, c.production)
      return r == null ? null : r * 1000
    },
  },
  {
    key: 'renewable_share',
    label: 'Tỷ lệ năng lượng tái tạo',
    unit: '%',
    compute: (c) => (c.ghg.gj > 0 ? (c.ghg.renewableGJ / c.ghg.gj) * 100 : null),
  },
  { key: 'training_atvsld_pct', label: 'NLĐ còn hiệu lực huấn luyện ATVSLĐ', unit: '%', snapshot: true, compute: (c) => c.coverage.atvsld ?? null },
  { key: 'training_pccc_pct', label: 'NLĐ còn hiệu lực huấn luyện PCCC', unit: '%', snapshot: true, compute: (c) => c.coverage.pccc ?? null },
  {
    key: 'training_scct_pct',
    label: 'NLĐ còn hiệu lực huấn luyện ứng phó sự cố chất thải',
    unit: '%',
    snapshot: true,
    compute: (c) => c.coverage.su_co_chat_thai ?? null,
  },
  { key: 'training_hours', label: 'Giờ đào tạo bình quân', unit: 'giờ/người', compute: (c) => ratio(c.training.hours, c.employeesActive) },
  { key: 'lti', label: 'Tai nạn lao động', unit: 'vụ', compute: (c) => c.incidents.tnld },
  { key: 'violations', label: 'Vi phạm nội quy nội bộ', unit: 'vụ', compute: (c) => c.violations },
  { key: 'ctnh_kg', label: 'CTNH phát sinh', unit: 'kg', compute: (c) => nz(c.waste.ctnhKg) },
]

export const metricByKey = (key?: string | null) => TARGET_METRICS.find((m) => m.key === key)
