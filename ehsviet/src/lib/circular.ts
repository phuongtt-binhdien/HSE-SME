// EPR bao bì và kinh tế tuần hoàn.
//  - EPR: NĐ 08/2022/NĐ-CP sửa đổi bởi NĐ 05/2025 (số liệu đến hết 2025); NĐ 110/2026/NĐ-CP thay Chương VI từ kỳ số liệu 2026
//    (kê khai trước 01/4, nộp Quỹ BVMT Việt Nam trước 20/4 – theo thông tin phổ biến, đối chiếu toàn văn).
//    Đóng góp tài chính F = V × R × Fs; V = khối lượng bao bì đưa ra thị trường trong nước (loại trừ xuất khẩu).
//  - Chất thải: phương pháp xử lý cuối → GRI 306-4 (chuyển hướng khỏi thải bỏ) / 306-5 (đưa đi thải bỏ).
//  - Tiêu chí tuần hoàn: QĐ 46/2026/QĐ-TTg Phụ lục II (bản tóm tắt – đối chiếu bản gốc trước khi lập hồ sơ).
import type { Tone } from '../components/UI'

export interface PackagingRecord {
  id: string
  year: number
  packaging: string
  material_group: string | null
  units_domestic: number | null
  units_export: number | null
  unit_weight_kg: number | null
  recycling_rate: number | null
  fs_vnd_per_kg: number | null
  method: 'dong_quy' | 'tu_tai_che' | 'uy_quyen'
  recycled_kg: number | null
  declared_date: string | null
  paid_date: string | null
  paid_amount: number | null
  note: string | null
}

export interface CircularFlow {
  id: string
  year: number
  month: number | null
  stream: string
  quantity: number
  unit: string
  route: string
  destination: string | null
  note: string | null
}

export const PACKAGING_METHOD_LABELS: Record<string, string> = {
  dong_quy: 'Đóng góp tài chính vào Quỹ BVMT Việt Nam',
  tu_tai_che: 'Tự tổ chức tái chế',
  uy_quyen: 'Ủy quyền tổ chức trung gian (PRO)',
}

/** Nhóm bao bì và tỷ lệ tái chế bắt buộc R kỳ đầu (đối chiếu văn bản hiện hành trước khi kê khai) */
export const EPR_MATERIALS: { group: string; rate: number | null }[] = [
  { group: 'Bao bì nhựa mềm – đơn vật liệu', rate: 10 },
  { group: 'Bao bì nhựa mềm – đa vật liệu', rate: null },
  { group: 'Bao bì nhựa cứng PET', rate: 22 },
  { group: 'Bao bì nhựa cứng HDPE, LDPE, PP, PS', rate: 15 },
  { group: 'Bao bì giấy, carton', rate: 20 },
  { group: 'Bao bì kim loại', rate: null },
]

export const EPR_BASIS =
  'Bao bì phân bón thuộc danh mục sản phẩm, bao bì phải thực hiện trách nhiệm tái chế từ 01/01/2024. Loại trừ: bao bì sản phẩm xuất khẩu; nhà sản xuất có doanh thu nhóm sản phẩm dưới 30 tỷ đồng/năm. Bao bì PP dệt có lót PE kê theo vật liệu có khối lượng lớn nhất; lưu kết quả cân mẫu làm bằng chứng. Xử phạt: NĐ 45/2022 Điều 32 (không kê khai 150 tr – 1 tỷ; nộp chậm, không nộp 500 tr – 1 tỷ).'

export function eprCalc(r: Pick<PackagingRecord, 'units_domestic' | 'unit_weight_kg' | 'recycling_rate' | 'fs_vnd_per_kg' | 'method' | 'recycled_kg'>) {
  const V = Number(r.units_domestic ?? 0) * Number(r.unit_weight_kg ?? 0)
  const R = Number(r.recycling_rate ?? 0) / 100
  const obligationKg = V * R
  const amount = obligationKg * Number(r.fs_vnd_per_kg ?? 0)
  const recycled = Number(r.recycled_kg ?? 0)
  const shortfallKg = r.method === 'dong_quy' ? 0 : Math.max(0, obligationKg - recycled)
  return { V, obligationKg, amount, recycled, shortfallKg }
}

/** Hạn kê khai, nộp tiền cho số liệu năm `dataYear` */
export function eprDeadlines(dataYear: number) {
  const y = dataYear + 1
  return {
    declare: `${y}-03-31`,
    declareText: dataYear >= 2026 ? `trước 01/4/${y} (NĐ 110/2026)` : `trước 31/3/${y}`,
    pay: `${y}-04-19`,
    payText: `trước 20/4/${y}`,
  }
}

export const CIRCULAR_STREAM_LABELS: Record<string, string> = {
  bui_hoi_luu: 'Bụi thu hồi (cyclone, lọc túi) hồi lưu',
  hat_ngoai_co: 'Hạt ngoài cỡ hồi lưu tạo hạt',
  phe_pham: 'Phế phẩm, hàng lỗi tái chế',
  nuoc_tuan_hoan: 'Nước tuần hoàn, tái sử dụng',
  nuoc_mua: 'Nước mưa thu gom sử dụng',
  bao_bi_tai_su_dung: 'Bao bì, pallet tái sử dụng',
  xi_than: 'Xỉ than, tro làm vật liệu xây dựng',
  bun_htxlnt: 'Bùn HTXLNT',
  dau_thai: 'Dầu thải tái chế',
  khac: 'Khác',
}

export const CIRCULAR_ROUTE_LABELS: Record<string, string> = {
  tai_su_dung_tai_cho: 'Tái sử dụng tại chỗ',
  tai_che_ben_ngoai: 'Tái chế bên ngoài',
  dong_xu_ly: 'Đồng xử lý',
  thu_hoi_nang_luong: 'Thu hồi năng lượng',
}

export const streamUnit = (stream: string) => (stream === 'nuoc_tuan_hoan' || stream === 'nuoc_mua' ? 'm³' : 't')

export const TREATMENT_LABELS: Record<string, string> = {
  tai_che: 'Tái chế',
  tai_su_dung: 'Chuẩn bị tái sử dụng',
  dong_xu_ly: 'Đồng xử lý (thu hồi khác)',
  thu_hoi_nang_luong: 'Đốt có thu hồi năng lượng',
  dot: 'Đốt không thu hồi năng lượng',
  chon_lap: 'Chôn lấp',
  xu_ly_khac: 'Xử lý khác (hóa rắn, trung hòa…)',
}

/** GRI 306: chuyển hướng khỏi thải bỏ (306-4) hay đưa đi thải bỏ (306-5) */
export const DIVERTED_METHODS = ['tai_che', 'tai_su_dung', 'dong_xu_ly']
export const isDiverted = (m: string | null | undefined) => !!m && DIVERTED_METHODS.includes(m)

export interface WasteFate {
  diverted: number
  disposed: number
  unknown: number
  total: number
  /** % khối lượng được chuyển hướng (trên phần đã xác định phương pháp) */
  divertedPct: number | null
  byMethod: Record<string, number>
}

/** Phân loại khối lượng chất thải phát sinh trong năm theo phương pháp xử lý (kg) */
export function wasteFate(
  logs: { log_date: string; quantity: number; waste_type_id: string }[],
  types: { id: string; treatment_method: string | null }[],
  year: number
): WasteFate {
  const m = new Map(types.map((t) => [t.id, t.treatment_method]))
  const out: WasteFate = { diverted: 0, disposed: 0, unknown: 0, total: 0, divertedPct: null, byMethod: {} }
  for (const l of logs) {
    if (Number(l.log_date.slice(0, 4)) !== year) continue
    const q = Number(l.quantity ?? 0)
    const method = m.get(l.waste_type_id) ?? null
    out.total += q
    if (!method) out.unknown += q
    else {
      out.byMethod[method] = (out.byMethod[method] ?? 0) + q
      if (isDiverted(method)) out.diverted += q
      else out.disposed += q
    }
  }
  const known = out.diverted + out.disposed
  out.divertedPct = known > 0 ? (out.diverted / known) * 100 : null
  return out
}

export type CriterionState = 'dat' | 'chua_dat' | 'thieu'

export interface Criterion {
  key: string
  title: string
  threshold: string
  value: string
  state: CriterionState
  note: string
}

export const CRITERION_TONE: Record<CriterionState, Tone> = { dat: 'green', chua_dat: 'red', thieu: 'gray' }
export const CRITERION_LABELS: Record<CriterionState, string> = { dat: 'Đạt', chua_dat: 'Chưa đạt', thieu: 'Thiếu số liệu' }

const pct = (v: number) => v.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + '%'

/**
 * Đối chiếu nhanh chỉ tiêu định lượng của dự án tuần hoàn ngành chế biến – hóa chất (QĐ 46/2026 PL II – I.6, bản tóm tắt).
 * Chỉ tiêu là ngưỡng cứng: một chỉ tiêu không đạt → "chưa đạt tuần hoàn".
 */
export function circularCriteria(x: {
  rawPerT: { base: number | null; now: number | null; baseYear: number; year: number }
  energyPerT: { base: number | null; now: number | null; baseYear: number; year: number }
  waterReusePct: number | null
  wastewaterOkPct: number | null
  ghgIntensityChangePct: number | null
}): Criterion[] {
  const change = (base: number | null, now: number | null) => (base && now != null && base > 0 ? ((base - now) / base) * 100 : null)
  const raw = change(x.rawPerT.base, x.rawPerT.now)
  const en = change(x.energyPerT.base, x.energyPerT.now)
  return [
    {
      key: 'nguyen_lieu',
      title: 'Giảm tiêu hao nguyên liệu thô / tấn sản phẩm',
      threshold: '≥ 10% so với năm cơ sở',
      value: raw == null ? '—' : `${pct(raw)} (${x.rawPerT.baseYear} → ${x.rawPerT.year})`,
      state: raw == null ? 'thieu' : raw >= 10 ? 'dat' : 'chua_dat',
      note: 'Cần chỉ số "Nguyên liệu thô sử dụng (t)" và sản lượng thành phẩm tại ESG › GRI (nhập theo năm).',
    },
    {
      key: 'nang_luong',
      title: 'Tiết kiệm năng lượng / tấn sản phẩm',
      threshold: '≥ 10% so với năm cơ sở',
      value: en == null ? '—' : `${pct(en)} (${x.energyPerT.baseYear} → ${x.energyPerT.year})`,
      state: en == null ? 'thieu' : en >= 10 ? 'dat' : 'chua_dat',
      note: 'Tính từ năng lượng quy đổi (GJ) ở Kiểm kê KNK chia sản lượng thành phẩm.',
    },
    {
      key: 'nuoc_tai_su_dung',
      title: 'Tái sử dụng nước thải',
      threshold: '> 70%',
      value: x.waterReusePct == null ? '—' : pct(x.waterReusePct),
      state: x.waterReusePct == null ? 'thieu' : x.waterReusePct > 70 ? 'dat' : 'chua_dat',
      note: 'Nước tuần hoàn (dòng tuần hoàn) so với tổng nước thải (GRI 303-4 hoặc nhật ký HTXLNT).',
    },
    {
      key: 'nuoc_thai_dat',
      title: 'Nước thải đạt cột A QCVN 40:2025/BTNMT',
      threshold: '> 95% mẫu đạt',
      value: x.wastewaterOkPct == null ? '—' : pct(x.wastewaterOkPct),
      state: x.wastewaterOkPct == null ? 'thieu' : x.wastewaterOkPct > 95 ? 'dat' : 'chua_dat',
      note: 'Tỷ lệ kết quả quan trắc nước thải không vượt giới hạn trong năm. Kết quả hiện so theo quy chuẩn ghi trong GPMT; đối chiếu lại theo QCVN 40:2025 khi chuyển đổi.',
    },
    {
      key: 'knk',
      title: 'Giảm phát thải KNK cao hơn mức NDC của ngành',
      threshold: 'Cao hơn mức đóng góp NDC ngành (đối chiếu)',
      value: x.ghgIntensityChangePct == null ? '—' : `Cường độ giảm ${pct(x.ghgIntensityChangePct)}`,
      state: 'thieu',
      note: 'Cần mức NDC của ngành công nghiệp – hóa chất để so sánh; phần mềm chỉ tính mức giảm cường độ phát thải.',
    },
  ]
}

export const QD46_NOTE =
  'QĐ 46/2026/QĐ-TTg (hiệu lực 01/11/2026) áp dụng hỗ trợ cho doanh nghiệp khu vực kinh tế tư nhân (Điều 2); doanh nghiệp có vốn nhà nước qua tập đoàn cần xác nhận tư cách trước khi đề nghị hỗ trợ lãi suất. Bộ tiêu chí vẫn dùng được làm chuẩn tự nguyện, phục vụ tín dụng xanh và báo cáo ESG.'
