// Hóa chất theo vòng đời: mua – nhập kho – xuất dùng (sản xuất, phòng thí nghiệm, HTXLNT, cơ điện) – thải bỏ.
// Luật Hóa chất 69/2025/QH15; NĐ 25/2026/NĐ-CP, NĐ 26/2026/NĐ-CP; TT 02/2026/TT-BCT (đối chiếu danh mục, mẫu báo cáo).
// Tồn = tồn đầu (khi đăng ký hóa chất) + nhập − xuất − thải bỏ ± điều chỉnh − lượng dùng ghi trong nhật ký HTXLNT (nếu liên kết).
import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns'
import type { Tone } from '../components/UI'
import { daysUntil } from './utils'

export interface Chemical {
  id: string
  code: string | null
  name: string
  cas_no: string | null
  formula: string | null
  supplier: string | null
  storage_location: string | null
  /** tồn đầu kỳ tại thời điểm đăng ký (created_at) */
  quantity: number | null
  unit: string | null
  pathh_available: boolean
  pathh_url: string | null
  hazard_classes: string[] | null
  legal_group: string
  use_area: string
  min_stock: number | null
  max_stock: number | null
  sds_date: string | null
  expiry_date: string | null
  log_key: string | null
  active: boolean
  note: string | null
  created_at: string
}

export interface ChemicalTxn {
  id: string
  chemical_id: string
  txn_date: string
  kind: 'nhap' | 'xuat' | 'dieu_chinh' | 'thai_bo'
  quantity: number
  area: string | null
  purpose: string | null
  supplier: string | null
  supplier_license: string | null
  invoice_no: string | null
  batch_no: string | null
  person: string | null
  note: string | null
}

export interface OperationLog {
  log_date: string
  chemical_usage: Record<string, number> | null
}

export const HAZARD_CLASS_LABELS: Record<string, string> = {
  an_mon: 'Ăn mòn',
  doc: 'Độc cấp tính',
  doc_man: 'Độc mãn tính, CMR',
  oxi_hoa: 'Oxi hóa',
  de_chay: 'Dễ cháy',
  kich_ung: 'Kích ứng',
  moi_truong: 'Nguy hại môi trường',
  ap_suat: 'Khí chịu áp',
}

export const LEGAL_GROUP_LABELS: Record<string, string> = {
  thong_thuong: 'Thông thường',
  nguy_hiem: 'Hóa chất nguy hiểm',
  co_dieu_kien: 'Hóa chất có điều kiện',
  kiem_soat_dac_biet: 'Cần kiểm soát đặc biệt',
  tien_chat: 'Tiền chất công nghiệp',
  cam: 'Hóa chất cấm',
}

export const LEGAL_GROUP_TONE: Record<string, Tone> = {
  thong_thuong: 'gray',
  nguy_hiem: 'amber',
  co_dieu_kien: 'amber',
  kiem_soat_dac_biet: 'red',
  tien_chat: 'red',
  cam: 'red',
}

/** Nhóm cần lưu chứng từ mua bán và giấy phép / giấy chứng nhận của bên bán */
export const CONTROLLED_GROUPS = ['co_dieu_kien', 'kiem_soat_dac_biet', 'tien_chat']

export const USE_AREA_LABELS: Record<string, string> = {
  san_xuat: 'Sản xuất',
  phong_thi_nghiem: 'Phòng thí nghiệm',
  htxlnt: 'HTXLNT',
  co_dien: 'Cơ điện – bảo trì',
  kho: 'Kho',
  khac: 'Khác',
}

export const TXN_KIND_LABELS: Record<string, string> = {
  nhap: 'Nhập (mua)',
  xuat: 'Xuất sử dụng',
  dieu_chinh: 'Điều chỉnh kiểm kê',
  thai_bo: 'Thải bỏ (CTNH)',
}

export const TXN_KIND_TONE: Record<string, Tone> = { nhap: 'green', xuat: 'blue', dieu_chinh: 'gray', thai_bo: 'amber' }

export const CHEMICAL_BASIS =
  'Luật Hóa chất 69/2025/QH15 (hiệu lực 01/01/2026); NĐ 25/2026, NĐ 26/2026; TT 02/2026/TT-BCT. Phiếu an toàn hóa chất (PATHH) tiếng Việt tại nơi lưu trữ, sử dụng; nhãn trên bao bì, can sang chiết; huấn luyện an toàn hóa chất; biện pháp / kế hoạch phòng ngừa, ứng phó sự cố. Danh mục hóa chất có điều kiện, cần kiểm soát đặc biệt, tiền chất: đối chiếu phụ lục của nghị định hướng dẫn.'

const day = (iso: string) => iso.slice(0, 10)

export interface StockInfo {
  opening: number
  inQty: number
  outQty: number
  disposed: number
  adjust: number
  /** lượng dùng theo nhật ký vận hành HTXLNT (từ ngày đăng ký hóa chất) */
  logUsed: number
  stock: number
  /** lượng dùng bình quân/ngày trong 30 ngày gần nhất */
  dailyUse: number
  /** số ngày còn dùng được với mức dùng bình quân */
  daysLeft: number | null
}

/** Lượng dùng của hóa chất theo nhật ký vận hành HTXLNT (operation_logs.chemical_usage) */
export function logUsage(c: Pick<Chemical, 'log_key' | 'created_at'>, logs: OperationLog[], from?: string, to?: string) {
  if (!c.log_key) return 0
  const start = from ?? day(c.created_at)
  let sum = 0
  for (const l of logs) {
    if (l.log_date < start || (to && l.log_date > to)) continue
    const v = Number(l.chemical_usage?.[c.log_key] ?? 0)
    if (Number.isFinite(v)) sum += v
  }
  return sum
}

export function stockOf(c: Chemical, txns: ChemicalTxn[], logs: OperationLog[], today = new Date()): StockInfo {
  const mine = txns.filter((t) => t.chemical_id === c.id)
  const sum = (k: ChemicalTxn['kind']) => mine.filter((t) => t.kind === k).reduce((s, t) => s + Number(t.quantity ?? 0), 0)
  const opening = Number(c.quantity ?? 0)
  const inQty = sum('nhap')
  const outQty = sum('xuat')
  const disposed = sum('thai_bo')
  const adjust = sum('dieu_chinh')
  const logUsed = logUsage(c, logs)
  const stock = opening + inQty - outQty - disposed + adjust - logUsed
  const since = format(subDays(today, 30), 'yyyy-MM-dd')
  const created = day(c.created_at)
  const recentOut =
    mine.filter((t) => t.kind === 'xuat' && t.txn_date >= since).reduce((s, t) => s + Number(t.quantity ?? 0), 0) +
    logUsage(c, logs, since > created ? since : created)
  const window = Math.max(1, Math.min(30, differenceInCalendarDays(today, parseISO(created > since ? created : since))))
  const dailyUse = recentOut / window
  return { opening, inQty, outQty, disposed, adjust, logUsed, stock, dailyUse, daysLeft: dailyUse > 0 ? Math.floor(Math.max(0, stock) / dailyUse) : null }
}

export interface ChemAlert {
  tone: Tone
  label: string
}

/** Cảnh báo theo hóa chất: PATHH, tồn kho, định mức, hạn dùng, nhóm kiểm soát */
export function chemicalAlerts(c: Chemical, s: StockInfo, txns: ChemicalTxn[]): ChemAlert[] {
  const out: ChemAlert[] = []
  if (!c.active) return out
  if (c.legal_group === 'cam') out.push({ tone: 'red', label: 'Hóa chất cấm – không được sử dụng' })
  if (!c.pathh_available) out.push({ tone: 'red', label: 'Thiếu PATHH' })
  if (s.stock < 0) out.push({ tone: 'red', label: 'Tồn âm – kiểm tra sổ nhập xuất' })
  else if (c.min_stock != null && s.stock <= Number(c.min_stock)) out.push({ tone: 'amber', label: 'Dưới định mức – đặt mua' })
  if (c.max_stock != null && s.stock > Number(c.max_stock)) out.push({ tone: 'red', label: 'Vượt lượng tồn trữ tối đa' })
  if (s.daysLeft != null && s.daysLeft < 7 && s.stock >= 0) out.push({ tone: 'amber', label: `Còn khoảng ${s.daysLeft} ngày dùng` })
  if (c.expiry_date) {
    const n = daysUntil(c.expiry_date)
    if (n < 0) out.push({ tone: 'red', label: 'Hết hạn sử dụng' })
    else if (n <= 30) out.push({ tone: 'amber', label: `Hết hạn sau ${n} ngày` })
  }
  if (c.pathh_available && c.sds_date && daysUntil(c.sds_date) < -5 * 365)
    out.push({ tone: 'amber', label: 'PATHH quá 5 năm – nên soát xét' })
  if (CONTROLLED_GROUPS.includes(c.legal_group)) {
    const missing = txns.filter((t) => t.chemical_id === c.id && t.kind === 'nhap' && (!t.supplier_license || !t.invoice_no)).length
    if (missing) out.push({ tone: 'amber', label: `${missing} lần nhập thiếu chứng từ / giấy phép bên bán` })
  }
  return out
}

/** Số liệu theo quý của năm (nhập, sử dụng, tồn cuối quý) – MT-HD02-BM01 */
export function quarterly(c: Chemical, txns: ChemicalTxn[], logs: OperationLog[], year: number) {
  const mine = txns.filter((t) => t.chemical_id === c.id)
  const quarters = [1, 2, 3, 4].map((q) => {
    const from = `${year}-${String((q - 1) * 3 + 1).padStart(2, '0')}-01`
    const to = format(new Date(year, q * 3, 0), 'yyyy-MM-dd')
    const inQ = mine.filter((t) => t.kind === 'nhap' && t.txn_date >= from && t.txn_date <= to).reduce((s, t) => s + Number(t.quantity), 0)
    const useQ =
      mine.filter((t) => (t.kind === 'xuat' || t.kind === 'thai_bo') && t.txn_date >= from && t.txn_date <= to).reduce((s, t) => s + Number(t.quantity), 0) +
      (c.log_key ? logUsage(c, logs, from > day(c.created_at) ? from : day(c.created_at), to) : 0)
    return { q, inQ, useQ }
  })
  return quarters
}
