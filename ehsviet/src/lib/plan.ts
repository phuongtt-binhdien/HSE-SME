// Kế hoạch – bước P của PDCA: kế hoạch HSE năm, lộ trình hồ sơ môi trường 5 năm (2026–2030), lộ trình Net Zero 2050.
// Bộ mẫu là lộ trình tham chiếu cho nhà máy phân bón NPK – mục tiêu chính thức do Ban Giám đốc phê duyệt.
// Bối cảnh quốc gia: cam kết phát thải ròng bằng "0" vào năm 2050 (COP26); QĐ 896/QĐ-TTg ngày 26/7/2022 (Chiến lược quốc gia
// về biến đổi khí hậu đến năm 2050); NDC cập nhật 2022: giảm 15,8% (tự lực) – 43,5% (có hỗ trợ quốc tế) so với BAU năm 2030.
// Nghĩa vụ cơ sở: NĐ 06/2022 sửa đổi bởi NĐ 119/2025, NĐ 83/2026; danh mục cơ sở phải kiểm kê QĐ 42/2026/QĐ-TTg.
import type { Tone } from '../components/UI'
import { daysUntil } from './utils'

export interface PlanItem {
  id: string
  horizon: 'nam' | '5_nam' | 'net_zero'
  year: number
  area: string
  title: string
  description: string | null
  basis: string | null
  kpi: string | null
  target_value: number | null
  actual_value: number | null
  unit: string | null
  owner: string | null
  start_date: string | null
  due_date: string | null
  budget_mvnd: number | null
  status: 'ke_hoach' | 'dang_thuc_hien' | 'hoan_thanh' | 'cham' | 'huy'
  progress: number
  note: string | null
}

export interface RoadmapTarget {
  id: string
  metric: string
  year: number
  value: number
  note: string | null
}

export const HORIZON_LABELS: Record<string, string> = {
  nam: 'Kế hoạch HSE năm',
  '5_nam': 'Lộ trình 5 năm 2026–2030',
  net_zero: 'Lộ trình Net Zero 2050',
}

export const PLAN_AREA_LABELS: Record<string, string> = {
  moi_truong: 'Môi trường',
  atvsld: 'An toàn – vệ sinh lao động',
  pccc: 'PCCC & CNCH',
  hoa_chat: 'Hóa chất',
  suc_khoe: 'Sức khỏe nghề nghiệp',
  nang_luong_knk: 'Năng lượng – KNK',
  chat_thai_tuan_hoan: 'Chất thải – tuần hoàn',
  esg: 'ESG – báo cáo',
  khac: 'Khác',
}

export const PLAN_STATUS_LABELS: Record<string, string> = {
  ke_hoach: 'Kế hoạch',
  dang_thuc_hien: 'Đang thực hiện',
  hoan_thanh: 'Hoàn thành',
  cham: 'Chậm tiến độ',
  huy: 'Hủy',
}

export const PLAN_STATUS_TONE: Record<string, Tone> = {
  ke_hoach: 'gray',
  dang_thuc_hien: 'blue',
  hoan_thanh: 'green',
  cham: 'red',
  huy: 'gray',
}

export const ROADMAP_METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  ghg_total: { label: 'Phát thải KNK phạm vi 1 + 2', unit: 'tCO₂e' },
  ghg_intensity: { label: 'Cường độ phát thải', unit: 'tCO₂e/t SP' },
  renewable_pct: { label: 'Tỷ lệ năng lượng tái tạo', unit: '%' },
  waste_diverted_pct: { label: 'Chất thải được tái chế, thu hồi', unit: '%' },
  water_reuse_pct: { label: 'Nước tái sử dụng', unit: '%' },
}

export type TargetPoint = { year: number; value: number }

/** Nội suy tuyến tính giữa các mốc mục tiêu (đã sắp theo năm); ngoài khoảng mốc → null */
export function interp(points: TargetPoint[], y: number): number | null {
  if (!points.length || y < points[0].year || y > points[points.length - 1].year) return null
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    if (a.year === y) return a.value
    const b = points[i + 1]
    if (b && a.year < y && y < b.year) return a.value + ((b.value - a.value) * (y - a.year)) / (b.year - a.year)
  }
  return null
}

/** Trạng thái hiển thị: hạng mục chưa xong mà quá hạn → "Quá hạn" */
export function planState(p: Pick<PlanItem, 'status' | 'due_date'>): { label: string; tone: Tone; overdue: boolean } {
  if (p.status !== 'hoan_thanh' && p.status !== 'huy' && p.due_date && daysUntil(p.due_date) < 0)
    return { label: 'Quá hạn', tone: 'red', overdue: true }
  return { label: PLAN_STATUS_LABELS[p.status] ?? p.status, tone: PLAN_STATUS_TONE[p.status] ?? 'gray', overdue: false }
}

interface Tpl {
  year: number
  area: string
  title: string
  description?: string
  basis?: string
  kpi?: string
  target_value?: number
  unit?: string
  owner?: string
  /** mm-dd */
  due?: string
}

const KT = 'Phòng Kỹ thuật Sản xuất'

/** Kế hoạch HSE năm `y` (mẫu) */
export function annualTemplates(y: number): Tpl[] {
  return [
    { year: y, area: 'atvsld', title: 'Lập, phê duyệt kế hoạch ATVSLĐ năm', basis: 'Luật ATVSLĐ 2015 Điều 76', kpi: 'Kế hoạch được phê duyệt', owner: KT, due: '01-31' },
    { year: y, area: 'atvsld', title: 'Huấn luyện ATVSLĐ định kỳ nhóm 4; huấn luyện người mới trước khi bố trí công việc', basis: 'NĐ 44/2016/NĐ-CP Điều 19', kpi: 'NLĐ còn hiệu lực huấn luyện', target_value: 100, unit: '%', owner: KT, due: '03-31' },
    { year: y, area: 'atvsld', title: 'Kiểm định máy, thiết bị có yêu cầu nghiêm ngặt đúng hạn', basis: 'Luật ATVSLĐ Điều 30–31; NĐ 283/2026 Điều 35', kpi: 'Thiết bị còn hạn kiểm định', target_value: 100, unit: '%', owner: 'Tổ Cơ điện', due: '12-31' },
    { year: y, area: 'suc_khoe', title: 'Quan trắc môi trường lao động; công khai kết quả cho người lao động', basis: 'Luật ATVSLĐ Điều 18; NĐ 283/2026 Điều 38', kpi: 'Đợt quan trắc', target_value: 1, unit: 'đợt', owner: KT, due: '04-30' },
    { year: y, area: 'suc_khoe', title: 'Khám sức khỏe định kỳ; khám phát hiện bệnh nghề nghiệp', basis: 'Luật ATVSLĐ Điều 21', kpi: 'NLĐ khám đúng hạn', target_value: 100, unit: '%', owner: 'Phòng Tổ chức – Hành chính', due: '06-30' },
    { year: y, area: 'pccc', title: 'Thực tập phương án chữa cháy, CNCH', basis: 'NĐ 105/2025/NĐ-CP; NĐ 106/2025 Điều 26 k4', kpi: 'Lần thực tập', target_value: 1, unit: 'lần', owner: 'Đội PCCC cơ sở', due: '10-31' },
    { year: y, area: 'moi_truong', title: 'Diễn tập ứng phó sự cố chất thải (tràn hóa chất HTXLNT, tràn dầu)', basis: 'QĐ 09/2020/QĐ-TTg; NĐ 45/2022 Điều 40', kpi: 'Lần diễn tập', target_value: 1, unit: 'lần', owner: KT, due: '09-30' },
    { year: y, area: 'hoa_chat', title: 'Huấn luyện an toàn hóa chất; diễn tập ứng phó sự cố hóa chất', basis: 'Luật Hóa chất 69/2025; NĐ 26/2026 (đối chiếu)', kpi: 'Lần diễn tập', target_value: 1, unit: 'lần', owner: KT, due: '11-30' },
    { year: y, area: 'moi_truong', title: 'Quan trắc khí thải định kỳ 03 tháng/lần theo GPMT', basis: 'GPMT của cơ sở; NĐ 45/2022 Điều 16', kpi: 'Đợt quan trắc', target_value: 4, unit: 'đợt', owner: KT, due: '12-31' },
    { year: y, area: 'moi_truong', title: 'Báo cáo công tác bảo vệ môi trường năm trước', basis: 'TT 02/2022/TT-BTNMT (VBHN 55/VBHN-BNNMT)', kpi: 'Nộp đúng hạn', owner: KT, due: '01-15' },
    { year: y, area: 'chat_thai_tuan_hoan', title: 'Phân loại CTRSH tại nguồn: 100% điểm thùng đạt khi kiểm tra tháng', basis: 'Luật BVMT 2020 Điều 75', kpi: 'Điểm thùng đạt', target_value: 100, unit: '%', owner: KT, due: '12-31' },
    { year: y, area: 'chat_thai_tuan_hoan', title: 'Kê khai, thực hiện trách nhiệm tái chế bao bì (EPR)', basis: 'NĐ 110/2026/NĐ-CP (đối chiếu)', kpi: 'Kê khai, nộp đúng hạn', owner: 'Phòng Kế toán – KT-SX', due: '03-31' },
    { year: y, area: 'nang_luong_knk', title: 'Giảm suất tiêu hao điện năng trên tấn sản phẩm (mục tiêu minh họa)', basis: 'Luật SDNL TKHQ sửa đổi bởi Luật 77/2025; kế hoạch sử dụng năng lượng năm', kpi: 'Giảm so với năm trước', target_value: 3, unit: '%', owner: 'Tổ Cơ điện', due: '12-31' },
    { year: y, area: 'esg', title: 'Thu thập số liệu ESG – GRI – TT 96/2020 cho báo cáo thường niên', basis: 'TT 96/2020/TT-BTC Phụ lục IV; GRI 102/103 từ kỳ 2027', kpi: 'Chỉ số có số liệu', target_value: 100, unit: '%', owner: KT, due: '12-31' },
  ]
}

/** Lộ trình hồ sơ môi trường 5 năm 2026–2030 (mẫu) */
export const FIVE_YEAR_TEMPLATES: Tpl[] = [
  { year: 2026, area: 'moi_truong', title: 'Tái chứng nhận ISO 14001:2015', description: 'Soát xét tài liệu (văn bản dẫn chiếu hết hiệu lực), đánh giá nội bộ, xem xét lãnh đạo trước ngày hết hạn chứng chỉ.', basis: 'ISO 14001:2015; tiêu chí ESG 1.7 (QĐ 46/2026)', owner: KT, due: '12-20' },
  { year: 2026, area: 'nang_luong_knk', title: 'Xác nhận kế hoạch giảm nhẹ KNK cấp cơ sở giai đoạn 2026–2030 đã nộp', basis: 'NĐ 06/2022 Điều 13 sửa đổi bởi NĐ 119/2025', owner: KT, due: '12-31' },
  { year: 2027, area: 'nang_luong_knk', title: 'Báo cáo kiểm kê KNK cấp cơ sở (số liệu 2025–2026) – Mẫu 06 PL II', basis: 'NĐ 06/2022 sửa đổi bởi NĐ 119/2025, NĐ 83/2026; QĐ 42/2026/QĐ-TTg', owner: KT, due: '03-31' },
  { year: 2027, area: 'nang_luong_knk', title: 'Báo cáo kết quả giảm nhẹ KNK năm 2026 – Mẫu 02 PL III (hằng năm từ 2027)', basis: 'NĐ 06/2022 sửa đổi bởi NĐ 119/2025', owner: KT, due: '03-31' },
  { year: 2027, area: 'nang_luong_knk', title: 'Kiểm toán năng lượng bắt buộc (03 năm/lần) – có phạm vi hệ nhiệt (lò hơi, lò sấy)', basis: 'Luật 50/2010 sửa đổi bởi Luật 77/2025', owner: 'Tổ Cơ điện', due: '12-31' },
  { year: 2027, area: 'esg', title: 'Báo cáo phát triển bền vững theo GRI 102: Climate Change 2025 và GRI 103: Energy 2025', basis: 'GRI – hiệu lực kỳ báo cáo từ 01/01/2027', owner: KT, due: '12-31' },
  { year: 2028, area: 'moi_truong', title: 'Rà soát GPMT: điều chỉnh khi thay đổi nhiên liệu, công trình, nguồn thải', description: 'Lập danh mục sai khác so với GPMT; thuộc diện điều chỉnh thì lập hồ sơ trước khi thay đổi.', basis: 'Luật BVMT 2020 sửa đổi đến Luật 146/2025; NĐ 08/2022 sửa đổi bởi NĐ 05/2025, NĐ 48/2026', owner: KT, due: '06-30' },
  { year: 2028, area: 'moi_truong', title: 'Cập nhật kế hoạch ứng phó sự cố môi trường – hóa chất – tràn dầu', basis: 'QĐ 09/2020/QĐ-TTg; Luật Hóa chất 69/2025', owner: KT, due: '09-30' },
  { year: 2029, area: 'nang_luong_knk', title: 'Báo cáo kiểm kê KNK cấp cơ sở (số liệu 2027–2028)', basis: 'NĐ 06/2022 sửa đổi bởi NĐ 119/2025', owner: KT, due: '03-31' },
  { year: 2029, area: 'moi_truong', title: 'Tái chứng nhận ISO 14001:2015 (chu kỳ 03 năm)', basis: 'ISO 14001:2015', owner: KT, due: '12-20' },
  { year: 2029, area: 'moi_truong', title: 'Đánh giá lộ trình áp dụng QCVN 19:2024/BTNMT cho nguồn khí thải hiện hữu', basis: 'TT 45/2024/TT-BTNMT (đối chiếu mốc)', owner: KT, due: '06-30' },
  { year: 2030, area: 'nang_luong_knk', title: 'Tổng kết kế hoạch giảm nhẹ KNK 2026–2030; lập kế hoạch giai đoạn 2031–2035', basis: 'NĐ 06/2022 sửa đổi bởi NĐ 119/2025', owner: KT, due: '12-31' },
  { year: 2030, area: 'nang_luong_knk', title: 'Kiểm toán năng lượng bắt buộc kỳ tiếp theo', basis: 'Luật 50/2010 sửa đổi bởi Luật 77/2025', owner: 'Tổ Cơ điện', due: '12-31' },
  { year: 2030, area: 'moi_truong', title: 'Chuẩn bị cải tạo HTXLNT đáp ứng QCVN 40:2025/BTNMT (cơ sở hiện hữu: hạn 31/12/2031)', basis: 'QCVN 40:2025/BTNMT', owner: KT, due: '12-31' },
]

/** Lộ trình Net Zero 2050 – mốc tham chiếu cho nhà máy phân bón NPK */
export const NET_ZERO_TEMPLATES: Tpl[] = [
  { year: 2026, area: 'nang_luong_knk', title: 'Năm gốc, kịch bản BAU và hệ thống đo đạc – báo cáo – thẩm định (MRV)', description: 'Kiểm kê phạm vi 1, 2 hằng năm; sàng lọc phạm vi 3 (nguyên liệu mua vào, vận chuyển, N₂O khi bón phân).', basis: 'NĐ 06/2022 sửa đổi bởi NĐ 119/2025; GHG Protocol; ISO 14064-1', kpi: 'Kiểm kê được thẩm định' },
  { year: 2027, area: 'nang_luong_knk', title: 'Điện mặt trời mái nhà (khoảng 1 MWp)', basis: 'Cơ chế điện mặt trời mái nhà tự sản, tự tiêu (NĐ 58/2025 – đối chiếu)', kpi: 'Tỷ lệ điện tái tạo', target_value: 10, unit: '%' },
  { year: 2028, area: 'nang_luong_knk', title: 'Hệ thống quản lý năng lượng ISO 50001; biến tần quạt, bơm; khí nén; chiếu sáng LED', basis: 'Luật 77/2025; kết quả KTNL 2027', kpi: 'Giảm điện năng/tấn SP', target_value: 8, unit: '%' },
  { year: 2030, area: 'nang_luong_knk', title: 'Đạt mục tiêu kế hoạch giảm nhẹ KNK 2026–2030; tăng tỷ lệ nhiệt từ sinh khối cho lò hơi, lò sấy', basis: 'Kế hoạch giảm nhẹ KNK cấp cơ sở; GPMT (điều chỉnh khi đổi nhiên liệu)', kpi: 'Giảm so với BAU', target_value: 10, unit: '%' },
  { year: 2030, area: 'chat_thai_tuan_hoan', title: 'Thu hồi NH₃ khí thải tạo hạt dạng dung dịch amoni sunfat quay lại phối trộn', basis: 'QĐ 46/2026/QĐ-TTg (dự án phục hồi tài nguyên – đối chiếu); QCVN 19:2024', kpi: 'NH₃ thu hồi', unit: 't/năm' },
  { year: 2035, area: 'nang_luong_knk', title: 'Lò hơi, lò sấy chuyển hẳn sang nhiên liệu tái tạo hoặc điện hóa nhiệt (bơm nhiệt, lò điện)', kpi: 'Nhiệt từ nguồn tái tạo', target_value: 100, unit: '%' },
  { year: 2035, area: 'nang_luong_knk', title: 'Mua điện tái tạo (DPPA) bổ sung cho điện mặt trời tại chỗ', basis: 'Cơ chế mua bán điện trực tiếp (đối chiếu văn bản hiện hành)', kpi: 'Tỷ lệ điện tái tạo', target_value: 50, unit: '%' },
  { year: 2040, area: 'nang_luong_knk', title: 'Xe nâng, phương tiện nội bộ chạy điện; thu hồi nhiệt thải sấy', kpi: 'Dầu DO sử dụng', target_value: 0, unit: 'L' },
  { year: 2045, area: 'nang_luong_knk', title: 'Điện tái tạo 100%; phát thải phạm vi 1 + 2 còn ≤ 20% năm gốc', kpi: 'Phát thải so với năm gốc', target_value: 20, unit: '%' },
  { year: 2050, area: 'nang_luong_knk', title: 'Phát thải ròng bằng 0 (Net Zero) phạm vi 1 + 2', description: 'Phát thải còn lại bù trừ bằng tín chỉ carbon chất lượng cao hoặc hấp thụ; công bố có thẩm định độc lập. Không dùng cụm "trung hòa carbon" khi chưa kiểm kê, thẩm định.', basis: 'Cam kết quốc gia COP26; QĐ 896/QĐ-TTg ngày 26/7/2022', kpi: 'Phát thải ròng', target_value: 0, unit: 'tCO₂e' },
]

/** Đường mục tiêu phát thải phạm vi 1 + 2 và tỷ lệ năng lượng tái tạo (tham chiếu) tính từ năm gốc */
export function roadmapTargetRows(base: Record<string, string>, baseYear: number, baseValue: number) {
  const ghg: [number, number, string][] = [
    [baseYear, 1, 'Năm gốc (kiểm kê)'],
    [2030, 0.85, 'Tham chiếu: −15% so với năm gốc'],
    [2035, 0.65, 'Tham chiếu: −35%'],
    [2040, 0.4, 'Tham chiếu: −60%'],
    [2045, 0.2, 'Tham chiếu: −80%'],
    [2050, 0.1, 'Phát thải còn lại ≤ 10%, bù trừ để phát thải ròng bằng 0'],
  ]
  const re: [number, number][] = [
    [2027, 5],
    [2030, 20],
    [2035, 50],
    [2040, 80],
    [2045, 100],
  ]
  return [
    ...ghg.filter(([y]) => y >= baseYear).map(([year, k, note]) => ({ ...base, metric: 'ghg_total', year, value: Math.round(baseValue * k), note })),
    ...re.map(([year, value]) => ({ ...base, metric: 'renewable_pct', year, value, note: 'Tham chiếu' })),
  ]
}

const due = (year: number, mmdd?: string) => (mmdd ? `${year}-${mmdd}` : `${year}-12-31`)

export function planRows(base: Record<string, string>, horizon: PlanItem['horizon'], tpls: Tpl[]) {
  return tpls.map((t) => ({
    ...base,
    horizon,
    year: t.year,
    area: t.area,
    title: t.title,
    description: t.description ?? null,
    basis: t.basis ?? null,
    kpi: t.kpi ?? null,
    target_value: t.target_value ?? null,
    actual_value: null,
    unit: t.unit ?? null,
    owner: t.owner ?? null,
    start_date: null,
    due_date: due(t.year, t.due),
    budget_mvnd: null,
    status: 'ke_hoach',
    progress: 0,
    note: horizon === 'nam' ? null : 'Mẫu tham chiếu – Ban Giám đốc phê duyệt mục tiêu chính thức',
  }))
}
