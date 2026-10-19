// Sức khỏe nghề nghiệp: đánh giá kết quả quan trắc môi trường lao động (QTMTLĐ), việc phải làm sau đợt đo,
// hạn khám sức khỏe định kỳ – khám phát hiện bệnh nghề nghiệp (BNN), bồi dưỡng bằng hiện vật.
// Căn cứ (rà soát 10/2026): Luật ATVSLĐ 84/2015 (Điều 18, 21); NĐ 44/2016 (Điều 37); NĐ 283/2026 (xử phạt);
// QCVN 22, 24, 26, 27:2016/BYT; QCVN 02, 03:2019/BYT; TT 19/2016, 28/2016, 60/2025/TT-BYT; TT 24, 25/2022/TT-BLĐTBXH.
import { addMonths, differenceInCalendarDays, format, parseISO } from 'date-fns'

// ---------------- Quan trắc môi trường lao động ----------------

export type WemFactor =
  | 'nhiet_do'
  | 'do_am'
  | 'toc_do_gio'
  | 'anh_sang'
  | 'on'
  | 'rung'
  | 'bui_toan_phan'
  | 'bui_ho_hap'
  | 'bui_silic'
  | 'hoi_khi_doc'
  | 'tam_sinh_ly'
  | 'khac'

export interface WemFactorMeta {
  label: string
  unit: string
  basis: string
  /** kiểu giới hạn: khoảng (min–max), trần, sàn, không phân loại */
  limitKind: 'range' | 'max' | 'min' | 'none'
  /** cảnh báo khi đạt từ 80% giới hạn (nồng độ bụi, hơi khí độc) */
  warn80: boolean
  /** yếu tố tiếp xúc tương ứng trên hồ sơ sức khỏe NLĐ */
  exposure?: Exposure
}

export const WEM_FACTORS: Record<WemFactor, WemFactorMeta> = {
  nhiet_do: { label: 'Nhiệt độ', unit: '°C', basis: 'QCVN 26:2016/BYT', limitKind: 'range', warn80: false, exposure: 'nhiet' },
  do_am: { label: 'Độ ẩm', unit: '%', basis: 'QCVN 26:2016/BYT', limitKind: 'range', warn80: false },
  toc_do_gio: { label: 'Tốc độ gió', unit: 'm/s', basis: 'QCVN 26:2016/BYT', limitKind: 'range', warn80: false },
  anh_sang: { label: 'Ánh sáng', unit: 'lux', basis: 'QCVN 22:2016/BYT', limitKind: 'min', warn80: false },
  on: { label: 'Tiếng ồn', unit: 'dBA', basis: 'QCVN 24:2016/BYT', limitKind: 'max', warn80: false, exposure: 'on' },
  rung: { label: 'Rung', unit: 'm/s²', basis: 'QCVN 27:2016/BYT', limitKind: 'max', warn80: true, exposure: 'rung' },
  bui_toan_phan: { label: 'Bụi toàn phần', unit: 'mg/m³', basis: 'QCVN 02:2019/BYT', limitKind: 'max', warn80: true, exposure: 'bui' },
  bui_ho_hap: { label: 'Bụi hô hấp', unit: 'mg/m³', basis: 'QCVN 02:2019/BYT', limitKind: 'max', warn80: true, exposure: 'bui' },
  bui_silic: { label: 'Bụi chứa silic', unit: 'mg/m³', basis: 'QCVN 02:2019/BYT', limitKind: 'max', warn80: true, exposure: 'bui_silic' },
  hoi_khi_doc: { label: 'Hơi khí độc', unit: 'mg/m³', basis: 'QCVN 03:2019/BYT', limitKind: 'max', warn80: true, exposure: 'hoa_chat' },
  tam_sinh_ly: { label: 'Tâm sinh lý – ec-gô-nô-mi', unit: '', basis: 'Phân loại điều kiện lao động (TT 03/2025/TT-BLĐTBXH)', limitKind: 'none', warn80: false },
  khac: { label: 'Yếu tố khác', unit: '', basis: '', limitKind: 'max', warn80: true },
}

export const WORK_INTENSITY_LABELS: Record<string, string> = {
  nhe: 'Lao động nhẹ',
  vua: 'Lao động vừa',
  nang: 'Lao động nặng',
}

/** Giới hạn nhiệt độ theo cường độ lao động – QCVN 26:2016/BYT */
export const HEAT_LIMITS: Record<string, { min: number; max: number }> = {
  nhe: { min: 20, max: 34 },
  vua: { min: 18, max: 32 },
  nang: { min: 16, max: 30 },
}

/** Giới hạn mặc định gợi ý khi nhập (sửa theo phiếu kết quả nếu khác) */
export const FACTOR_DEFAULT_LIMITS: Partial<Record<WemFactor, { min?: number; max?: number }>> = {
  do_am: { min: 40, max: 80 },
  toc_do_gio: { min: 0.2, max: 1.5 },
  on: { max: 85 },
}

/** Khóa so khớp tên khí: bỏ dấu, chỉ số dưới → số thường (NH3 = NH₃) */
export const gasKey = (s: string) => s.normalize('NFKD').replace(/[^a-z0-9]/gi, '').toLowerCase()

/** Giới hạn mẫu của khí theo tên nhập (NH3, NH₃, so2…) */
export const toxicPreset = (name?: string | null) => (name ? TOXIC_PRESETS.find((t) => gasKey(t.parameter) === gasKey(name)) : undefined)

/** Hơi khí độc thường gặp ở nhà máy NPK, lò hơi than – giới hạn trung bình 8 giờ (TWA), mg/m³ – QCVN 03:2019/BYT */
export const TOXIC_PRESETS: { parameter: string; max: number }[] = [
  { parameter: 'NH₃', max: 17 },
  { parameter: 'CO', max: 20 },
  { parameter: 'SO₂', max: 5 },
  { parameter: 'NO₂', max: 5 },
]

export interface WemCampaign {
  id: string
  sample_date: string
  provider?: string | null
  report_no?: string | null
  report_date?: string | null
  published_date?: string | null
  note?: string | null
}

export interface WemResult {
  id: string
  campaign_id: string
  department?: string | null
  position: string
  factor: WemFactor
  parameter?: string | null
  unit?: string | null
  value?: number | null
  limit_min?: number | null
  limit_max?: number | null
  work_intensity?: string | null
  exposed_count?: number | null
  note?: string | null
}

export type WemStatus = 'dat' | 'canh_bao' | 'khong_dat' | 'khong_phan_loai'

export const WEM_STATUS_LABELS: Record<WemStatus, string> = {
  dat: 'Đạt',
  canh_bao: '≥ 80% giới hạn',
  khong_dat: 'Không đạt',
  khong_phan_loai: 'Không phân loại',
}

const num = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v))

export function wemStatus(r: WemResult): WemStatus {
  const v = num(r.value)
  const lo = num(r.limit_min)
  const hi = num(r.limit_max)
  if (v === null || (lo === null && hi === null)) return 'khong_phan_loai'
  if (hi !== null && v > hi) return 'khong_dat'
  if (lo !== null && v < lo) return 'khong_dat'
  if (WEM_FACTORS[r.factor]?.warn80 && hi !== null && hi > 0 && v >= 0.8 * hi) return 'canh_bao'
  return 'dat'
}

/**
 * % so với giới hạn trên – chỉ cho yếu tố dạng nồng độ, cường độ (bụi, hơi khí độc, rung…).
 * Không áp dụng cho tiếng ồn (dBA là thang logarit – dùng thời gian tiếp xúc cho phép).
 */
export function pctOfLimit(r: WemResult): number | null {
  const v = num(r.value)
  const hi = num(r.limit_max)
  if (v === null || hi === null || hi <= 0) return null
  if (r.factor === 'on' || WEM_FACTORS[r.factor]?.limitKind !== 'max') return null
  return (v / hi) * 100
}

/**
 * Thời gian tiếp xúc ồn cho phép trong ca (phút) – QCVN 24:2016/BYT: 85 dBA cho 8 giờ,
 * mỗi khi tăng 3 dBA thời gian tiếp xúc giảm một nửa. Trả về null khi ≤ 85 dBA.
 */
export function noiseAllowedMinutes(dBA?: number | null): number | null {
  const L = num(dBA)
  if (L === null || L <= 85) return null
  return Math.round((8 * 60) / Math.pow(2, (L - 85) / 3))
}

export function fmtMinutes(min: number) {
  if (min < 60) return `${min} phút`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} giờ ${m} phút` : `${h} giờ`
}

export function limitText(r: WemResult): string {
  const lo = num(r.limit_min)
  const hi = num(r.limit_max)
  if (lo !== null && hi !== null) return `${fmtVal(lo)}–${fmtVal(hi)}`
  if (hi !== null) return `≤ ${fmtVal(hi)}`
  if (lo !== null) return `≥ ${fmtVal(lo)}`
  return '—'
}

const fmtVal = (n: number) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 }).format(n)

export function resultLabel(r: WemResult) {
  const meta = WEM_FACTORS[r.factor]
  return r.parameter ? `${meta?.label ?? r.factor} – ${r.parameter}` : meta?.label ?? r.factor
}

/** Khóa so sánh cùng vị trí – yếu tố giữa hai đợt */
export const wemKey = (r: WemResult) =>
  [r.department ?? '', r.position.trim().toLowerCase(), r.factor, (r.parameter ?? '').trim().toLowerCase()].join('|')

export interface WemSummary {
  total: number
  dat: number
  canhBao: number
  khongDat: number
  khongPhanLoai: number
  positionsFailed: number
  exposedFailed: number
  byFactor: { factor: WemFactor; total: number; khongDat: number; canhBao: number }[]
}

export function summarizeWem(results: WemResult[]): WemSummary {
  const s: WemSummary = { total: 0, dat: 0, canhBao: 0, khongDat: 0, khongPhanLoai: 0, positionsFailed: 0, exposedFailed: 0, byFactor: [] }
  const failedPos = new Map<string, number>()
  const byFactor = new Map<WemFactor, { factor: WemFactor; total: number; khongDat: number; canhBao: number }>()
  for (const r of results) {
    const st = wemStatus(r)
    s.total++
    if (st === 'dat') s.dat++
    else if (st === 'canh_bao') s.canhBao++
    else if (st === 'khong_dat') s.khongDat++
    else s.khongPhanLoai++
    const f = byFactor.get(r.factor) ?? { factor: r.factor, total: 0, khongDat: 0, canhBao: 0 }
    f.total++
    if (st === 'khong_dat') f.khongDat++
    if (st === 'canh_bao') f.canhBao++
    byFactor.set(r.factor, f)
    if (st === 'khong_dat') {
      const k = `${r.department ?? ''}|${r.position}`
      failedPos.set(k, Math.max(failedPos.get(k) ?? 0, Number(r.exposed_count ?? 0)))
    }
  }
  s.positionsFailed = failedPos.size
  s.exposedFailed = [...failedPos.values()].reduce((a, b) => a + b, 0)
  s.byFactor = [...byFactor.values()].sort((a, b) => b.khongDat - a.khongDat || b.canhBao - a.canhBao || b.total - a.total)
  return s
}

// ---------------- Việc phải làm sau đợt đo ----------------

export interface WemAction {
  key: string
  title: string
  detail: string
  basis: string
  category: 'khac' | 'quan_trac' | 'dao_tao' | 'bao_cao'
  priority: 'cao' | 'trung_binh'
}

const FACTOR_MEASURES: Partial<Record<WemFactor, string>> = {
  on: 'Bắt buộc nút/chụp tai chống ồn; biển cảnh báo vùng ồn; kiểm tra, bảo dưỡng nguồn ồn (vành răng, con lăn, quạt); bao che tiêu âm; bố trí thời gian tiếp xúc trong giới hạn cho phép.',
  nhiet_do: 'Cải thiện vi khí hậu: thông gió, chống nóng (che chắn bức xạ, quạt, phun sương) hoặc giữ ấm khi dưới giới hạn; nước uống bù điện giải; bố trí nghỉ ngắn trong ca.',
  bui_toan_phan: 'Làm kín thiết bị, hút bụi cục bộ; vệ sinh công nghiệp bằng hút chân không thay quét; khẩu trang lọc bụi mịn.',
  bui_ho_hap: 'Làm kín thiết bị, hút bụi cục bộ; khẩu trang lọc bụi mịn (P2/N95).',
  bui_silic: 'Làm kín khít thiết bị, hút bụi cục bộ; khẩu trang lọc bụi mịn (P2/N95) bắt buộc; hạn chế thời gian tiếp xúc.',
  hoi_khi_doc: 'Thông gió, hút cục bộ; kiểm tra rò rỉ; mặt nạ phòng độc có phin lọc phù hợp.',
  rung: 'Bệ chống rung, cân bằng động thiết bị; găng chống rung; luân phiên công việc.',
  anh_sang: 'Bổ sung, vệ sinh đèn chiếu sáng cục bộ.',
  do_am: 'Điều chỉnh thông gió, hút ẩm.',
  toc_do_gio: 'Điều chỉnh hệ thống thông gió.',
  tam_sinh_ly: 'Luân chuyển vị trí, nghỉ ngắn giữa ca; cải thiện tư thế, cơ giới hóa thao tác lặp lại.',
}

/** Danh sách việc theo Luật ATVSLĐ Điều 18 k4 và NĐ 44/2016 Điều 37 khi có yếu tố không đạt */
export function wemActions(campaign: WemCampaign | null, results: WemResult[]): WemAction[] {
  if (!campaign) return []
  const out: WemAction[] = []
  const failed = results.filter((r) => wemStatus(r) === 'khong_dat')
  const warned = results.filter((r) => wemStatus(r) === 'canh_bao')
  const posText = (rs: WemResult[]) => [...new Set(rs.map((r) => (r.department ? `${r.department} – ${r.position}` : r.position)))].join('; ')

  if (!campaign.published_date) {
    out.push({
      key: 'cong-khai',
      title: 'Công khai kết quả quan trắc môi trường lao động cho người lao động',
      detail: 'Niêm yết tại nơi làm việc, thông báo cho NLĐ ở vị trí có yếu tố không đạt; ghi ngày công khai vào đợt quan trắc.',
      basis: 'Luật ATVSLĐ Điều 18; NĐ 283/2026 Điều 38 k2 (2–5 triệu; tổ chức ×2)',
      category: 'khac',
      priority: 'cao',
    })
  }

  const byFactor = new Map<WemFactor, WemResult[]>()
  for (const r of failed) byFactor.set(r.factor, [...(byFactor.get(r.factor) ?? []), r])
  for (const [factor, rs] of byFactor) {
    const meta = WEM_FACTORS[factor]
    let detail = `${rs.length} mẫu không đạt tại: ${posText(rs)}. ${FACTOR_MEASURES[factor] ?? 'Biện pháp kỹ thuật giảm thiểu tại nguồn.'}`
    if (factor === 'on') {
      const times = rs
        .map((r) => ({ r, m: noiseAllowedMinutes(r.value) }))
        .filter((x) => x.m !== null)
        .map((x) => `${x.r.position} ${fmtVal(Number(x.r.value))} dBA → tối đa ${fmtMinutes(x.m!)}/ca`)
      if (times.length) detail += ` Thời gian tiếp xúc cho phép: ${times.join('; ')}.`
    }
    out.push({
      key: `kt-${factor}`,
      title: `Biện pháp kỹ thuật – ${meta.label.toLowerCase()} không đạt (${rs.length} mẫu)`,
      detail,
      basis: `Luật ATVSLĐ Điều 18; NĐ 44/2016 Điều 37; ${meta.basis}; NĐ 283/2026 Điều 33 k9`,
      category: 'khac',
      priority: 'cao',
    })
  }

  // Khám phát hiện BNN theo yếu tố không đạt (khuyến nghị cả vị trí ≥ 80% giới hạn)
  const bnnFactors = new Map<Exposure, WemResult[]>()
  for (const r of [...failed, ...warned]) {
    const exp = WEM_FACTORS[r.factor]?.exposure
    if (exp && EXPOSURES[exp].disease) bnnFactors.set(exp, [...(bnnFactors.get(exp) ?? []), r])
  }
  for (const [exp, rs] of bnnFactors) {
    const e = EXPOSURES[exp]
    out.push({
      key: `bnn-${exp}`,
      title: `Khám phát hiện BNN: ${e.disease!.toLowerCase()}`,
      detail: `NLĐ tại: ${posText(rs)}. Nội dung khám: ${e.exam}. Gắn yếu tố "${e.label}" vào hồ sơ sức khỏe của NLĐ để theo dõi hạn khám.`,
      basis: 'NĐ 44/2016 Điều 37; TT 28/2016/TT-BYT; danh mục 35 BNN – TT 60/2025/TT-BYT; NĐ 283/2026 Điều 33',
      category: 'khac',
      priority: failed.some((r) => WEM_FACTORS[r.factor]?.exposure === exp) ? 'cao' : 'trung_binh',
    })
  }

  if (failed.length) {
    out.push({
      key: 'boi-duong',
      title: 'Rà soát bồi dưỡng bằng hiện vật cho NLĐ tại vị trí không đạt',
      detail: `Vị trí: ${posText(failed)}. Xác định mức 1–4 theo yếu tố và thời gian tiếp xúc; cập nhật tại tab Bồi dưỡng hiện vật.`,
      basis: 'TT 24/2022/TT-BLĐTBXH; NĐ 283/2026 Điều 33 k8',
      category: 'khac',
      priority: 'trung_binh',
    })
    out.push({
      key: 'ptbvcn',
      title: 'Cấp phương tiện bảo vệ cá nhân phù hợp yếu tố không đạt',
      detail: 'Nút/chụp tai (ồn), khẩu trang lọc bụi mịn (bụi, silic), mặt nạ phin lọc (hơi khí độc); kiểm tra việc sử dụng.',
      basis: 'TT 25/2022/TT-BLĐTBXH; NĐ 283/2026 Điều 33 k8',
      category: 'khac',
      priority: 'trung_binh',
    })
  }

  if (results.some((r) => r.factor === 'tam_sinh_ly')) {
    out.push({
      key: 'dkld',
      title: 'Phân loại điều kiện lao động theo kết quả tâm sinh lý – ec-gô-nô-mi',
      detail: 'Đối chiếu vị trí có nhiều chỉ tiêu ở mức cao (nhịp tim, thao tác lặp lại, tư thế) để xếp loại điều kiện lao động và bố trí chế độ.',
      basis: 'TT 03/2025/TT-BLĐTBXH; TT 11/2020, TT 19/2023/TT-BLĐTBXH (nghề NNĐHNH)',
      category: 'khac',
      priority: 'trung_binh',
    })
  }

  out.push({
    key: 'ho-so-vsld',
    title: 'Cập nhật hồ sơ vệ sinh lao động theo đợt quan trắc',
    detail: 'Danh mục vị trí, yếu tố có hại, số NLĐ tiếp xúc, kết quả đợt đo và biện pháp đã thực hiện; đối chiếu danh mục vị trí với đợt trước.',
    basis: 'TT 19/2016/TT-BYT; NĐ 283/2026 Điều 32 k1',
    category: 'bao_cao',
    priority: 'trung_binh',
  })
  return out
}

// ---------------- Hồ sơ sức khỏe NLĐ ----------------

export type Exposure = 'on' | 'bui_silic' | 'bui' | 'hoa_chat' | 'nhiet' | 'rung'

export const EXPOSURES: Record<Exposure, { label: string; disease: string | null; exam: string }> = {
  on: { label: 'Tiếng ồn', disease: 'Điếc nghề nghiệp do tiếng ồn', exam: 'đo thính lực' },
  bui_silic: { label: 'Bụi chứa silic', disease: 'Bệnh bụi phổi silic nghề nghiệp', exam: 'X-quang phổi, đo chức năng hô hấp' },
  bui: { label: 'Bụi (than, phân bón…)', disease: 'Bệnh bụi phổi, viêm phế quản mạn tính nghề nghiệp', exam: 'X-quang phổi, đo chức năng hô hấp' },
  hoa_chat: { label: 'Hóa chất, hơi khí độc', disease: 'Nhiễm độc nghề nghiệp theo hóa chất tiếp xúc', exam: 'xét nghiệm theo hóa chất tiếp xúc' },
  nhiet: { label: 'Nhiệt độ cao', disease: null, exam: 'theo khám sức khỏe định kỳ' },
  rung: { label: 'Rung', disease: 'Bệnh rung nghề nghiệp', exam: 'theo hướng dẫn khám BNN' },
}

export const HEALTH_CHECK_KIND_LABELS: Record<string, string> = {
  dinh_ky: 'Khám sức khỏe định kỳ',
  bnn: 'Khám phát hiện BNN',
  truoc_bo_tri: 'Khám trước khi bố trí việc làm',
  khac: 'Khám khác',
}

export const HEALTH_CLASS_LABELS: Record<string, string> = {
  I: 'Loại I – Rất khỏe',
  II: 'Loại II – Khỏe',
  III: 'Loại III – Trung bình',
  IV: 'Loại IV – Yếu',
  V: 'Loại V – Rất yếu',
}

export interface HealthCheck {
  id: string
  employee_id: string
  exam_date: string
  kind: 'dinh_ky' | 'bnn' | 'truoc_bo_tri' | 'khac'
  provider?: string | null
  health_class?: string | null
  conclusion?: string | null
  disease?: string | null
  follow_up?: string | null
  note?: string | null
}

export interface HealthProfile {
  id: string
  hazardous?: boolean | null
  exposures?: string[] | null
}

export type DueState = 'dung_han' | 'sap_den' | 'qua_han' | 'chua' | 'khong_yeu_cau'

export const DUE_STATE_LABELS: Record<DueState, string> = {
  dung_han: 'Đúng hạn',
  sap_den: 'Sắp đến hạn',
  qua_han: 'Quá hạn',
  chua: 'Chưa có kết quả',
  khong_yeu_cau: 'Không yêu cầu',
}

export const DUE_SOON_DAYS = 30

export interface DueStatus {
  state: DueState
  last?: HealthCheck
  due?: string
  daysLeft?: number
  intervalMonths: number
}

function dueStatus(last: HealthCheck | undefined, intervalMonths: number, today: Date): DueStatus {
  if (!last) return { state: 'chua', intervalMonths }
  const due = format(addMonths(parseISO(last.exam_date), intervalMonths), 'yyyy-MM-dd')
  const daysLeft = differenceInCalendarDays(parseISO(due), today)
  const state: DueState = daysLeft < 0 ? 'qua_han' : daysLeft <= DUE_SOON_DAYS ? 'sap_den' : 'dung_han'
  return { state, last, due, daysLeft, intervalMonths }
}

const latest = (checks: HealthCheck[], kinds: string[]) =>
  checks.filter((c) => kinds.includes(c.kind)).sort((a, b) => b.exam_date.localeCompare(a.exam_date))[0]

/** Khám sức khỏe định kỳ: 12 tháng; nghề NNĐHNH 06 tháng (Luật ATVSLĐ Điều 21) */
export function periodicStatus(emp: HealthProfile, checks: HealthCheck[], today = new Date()): DueStatus {
  const mine = checks.filter((c) => c.employee_id === emp.id)
  return dueStatus(latest(mine, ['dinh_ky', 'truoc_bo_tri']), emp.hazardous ? 6 : 12, today)
}

/** Yếu tố tiếp xúc của NLĐ có BNN tương ứng phải khám phát hiện */
export function bnnExposures(emp: HealthProfile): Exposure[] {
  return ((emp.exposures ?? []) as Exposure[]).filter((x) => EXPOSURES[x]?.disease)
}

/** Khám phát hiện BNN: hằng năm khi có yếu tố tiếp xúc tương ứng */
export function bnnStatus(emp: HealthProfile, checks: HealthCheck[], today = new Date()): DueStatus {
  if (!bnnExposures(emp).length) return { state: 'khong_yeu_cau', intervalMonths: 12 }
  const mine = checks.filter((c) => c.employee_id === emp.id)
  return dueStatus(latest(mine, ['bnn']), 12, today)
}

/** Phân loại sức khỏe gần nhất (khám định kỳ / trước bố trí) */
export function latestClass(empId: string, checks: HealthCheck[]) {
  return latest(
    checks.filter((c) => c.employee_id === empId && c.health_class),
    ['dinh_ky', 'truoc_bo_tri', 'khac']
  )?.health_class
}

// ---------------- Bồi dưỡng bằng hiện vật ----------------

/** Định suất bồi dưỡng bằng hiện vật (đồng/ngày làm việc) – TT 24/2022/TT-BLĐTBXH */
export const ALLOWANCE_RATES: Record<number, number> = { 1: 13000, 2: 20000, 3: 26000, 4: 32000 }

export const ALLOWANCE_LABELS: Record<number, string> = {
  1: 'Mức 1 – 13.000 đ',
  2: 'Mức 2 – 20.000 đ',
  3: 'Mức 3 – 26.000 đ',
  4: 'Mức 4 – 32.000 đ',
}

export const allowanceMonthly = (level: number | null | undefined, days: number) =>
  level && ALLOWANCE_RATES[level] ? ALLOWANCE_RATES[level] * days : 0
