// Nhập kết quả quan trắc môi trường lao động từ Excel/CSV hoặc dán từ bảng tính
import { FACTOR_DEFAULT_LIMITS, gasKey, HEAT_LIMITS, toxicPreset, WEM_FACTORS, type WemFactor } from '../../lib/health'
import { normalize, type Cell } from '../personnel/excel'

export interface ParsedWem {
  department: string | null
  position: string
  factor: WemFactor
  parameter: string | null
  unit: string | null
  value: number | null
  limit_min: number | null
  limit_max: number | null
  work_intensity: string | null
  exposed_count: number | null
  note: string | null
}

export interface ParseIssue {
  row: number
  message: string
}

type Col =
  | 'department'
  | 'position'
  | 'factor'
  | 'parameter'
  | 'unit'
  | 'value'
  | 'limit_min'
  | 'limit_max'
  | 'limit'
  | 'intensity'
  | 'exposed'
  | 'note'
  | null

export function mapWemHeader(raw: string): Col {
  const n = normalize(raw)
  if (!n) return null
  if (/^(don vi tinh|dvt|don vi do)/.test(n)) return 'unit'
  if (/^(bo phan|phan xuong|don vi|xuong|to)\b/.test(n)) return 'department'
  if (/^(vi tri|diem do|noi do)/.test(n)) return 'position'
  if (/^(yeu to|nhom yeu to|loai yeu to)/.test(n)) return 'factor'
  if (/^(thong so|chi tieu|chat|hoa chat)/.test(n)) return 'parameter'
  if (/^(ket qua|gia tri|nong do|muc)/.test(n)) return 'value'
  if (/(gioi han|gh|tieu chuan) (duoi|min|toi thieu)/.test(n)) return 'limit_min'
  if (/(gioi han|gh|tieu chuan) (tren|max|toi da)/.test(n)) return 'limit_max'
  if (/^(gioi han|gh|tieu chuan|qcvn|gia tri cho phep)/.test(n)) return 'limit'
  if (/cuong do/.test(n)) return 'intensity'
  if (/(so nld|nld tiep xuc|so nguoi|tiep xuc)/.test(n)) return 'exposed'
  if (/^(ghi chu|nhan xet|danh gia)/.test(n)) return 'note'
  return null
}

const GASES: Record<string, string> = { nh3: 'NH₃', co: 'CO', so2: 'SO₂', no2: 'NO₂', h2s: 'H₂S', cl2: 'Cl₂', amoniac: 'NH₃' }

/** Nhận dạng yếu tố từ chữ trong ô (nhãn tiếng Việt, mã yếu tố hoặc tên khí) */
export function factorFrom(text: string): { factor: WemFactor; parameter?: string } | null {
  const raw = String(text ?? '').trim()
  if (!raw) return null
  if (raw in WEM_FACTORS) return { factor: raw as WemFactor }
  const n = normalize(raw)
  const tokens = n.split(' ')
  const gas = tokens.find((t) => GASES[t])
  if (gas) return { factor: 'hoi_khi_doc', parameter: GASES[gas] }
  if (/khi doc|hoi doc|hoa chat/.test(n)) return { factor: 'hoi_khi_doc' }
  if (/silic/.test(n)) return { factor: 'bui_silic' }
  if (/bui ho hap/.test(n)) return { factor: 'bui_ho_hap' }
  if (/bui/.test(n)) return { factor: 'bui_toan_phan' }
  if (/nhiet/.test(n)) return { factor: 'nhiet_do' }
  if (/do am|am do/.test(n)) return { factor: 'do_am' }
  if (/gio/.test(n)) return { factor: 'toc_do_gio' }
  if (/anh sang|chieu sang|do roi/.test(n)) return { factor: 'anh_sang' }
  if (/tieng on/.test(n) || tokens.includes('on') || tokens.includes('dba')) return { factor: 'on' }
  if (/rung/.test(n)) return { factor: 'rung' }
  if (/tam sinh ly|ec go|ecgo|ergo|rula|tu the/.test(n)) return { factor: 'tam_sinh_ly' }
  return { factor: 'khac' }
}

/** Số kiểu Việt Nam: "32,4", "1.234,5", "< 0,01" */
export function parseNum(v: Cell): number | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  let s = String(v).trim().replace(/[<>≤≥=]/g, '').replace(/\s/g, '')
  if (!s) return null
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.')
  else s = s.replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** Giới hạn trong một ô: "18–32", "≤ 85", "≥ 300", "0,3" */
export function parseLimit(v: Cell): { min: number | null; max: number | null } {
  if (v === null || v === undefined || v === '') return { min: null, max: null }
  if (typeof v === 'number') return { min: null, max: v }
  const s = String(v).trim()
  const range = s.match(/^\s*([\d.,]+)\s*[-–—÷]\s*([\d.,]+)/)
  if (range) return { min: parseNum(range[1]), max: parseNum(range[2]) }
  if (/^(≥|>=|>)/.test(s)) return { min: parseNum(s), max: null }
  return { min: null, max: parseNum(s) }
}

function intensityFrom(v: Cell): string | null {
  const n = normalize(v)
  if (!n) return null
  if (/nang/.test(n)) return 'nang'
  if (/vua|trung binh/.test(n)) return 'vua'
  if (/nhe/.test(n)) return 'nhe'
  return null
}

const text = (v: Cell) => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s || null
}

/** Tìm dòng tiêu đề trong 10 dòng đầu, đọc các dòng kết quả */
export function parseWemRows(rows: Cell[][]): { parsed: ParsedWem[]; issues: ParseIssue[]; headers: string[] } | null {
  let headerIdx = -1
  let cols: Col[] = []
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const mapped = (rows[i] ?? []).map((c) => mapWemHeader(String(c ?? '')))
    if (mapped.includes('position') && (mapped.includes('value') || mapped.includes('factor')) && mapped.filter(Boolean).length >= 3) {
      headerIdx = i
      cols = mapped
      break
    }
  }
  if (headerIdx < 0) return null
  const headers = (rows[headerIdx] ?? []).map((c) => String(c ?? ''))
  const get = (row: Cell[], key: Exclude<Col, null>) => {
    const i = cols.indexOf(key)
    return i < 0 ? undefined : row[i]
  }
  const parsed: ParsedWem[] = []
  const issues: ParseIssue[] = []
  let lastDept: string | null = null
  let lastPos: string | null = null
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] ?? []
    if (row.every((c) => c === null || c === undefined || String(c).trim() === '')) continue
    // ô gộp trong Excel: bộ phận / vị trí để trống ở các dòng tiếp theo → lấy theo dòng trên
    const department: string | null = text(get(row, 'department')) ?? lastDept
    const position: string | null = text(get(row, 'position')) ?? lastPos
    lastDept = department
    lastPos = position
    const factorCell = text(get(row, 'factor'))
    const paramCell = text(get(row, 'parameter'))
    const f = factorFrom(factorCell ?? paramCell ?? '')
    if (!position) {
      issues.push({ row: i + 1, message: 'Thiếu vị trí đo' })
      continue
    }
    if (!f) {
      issues.push({ row: i + 1, message: 'Không nhận ra yếu tố' })
      continue
    }
    // tên khí viết thường ("NH3") → tên chuẩn ("NH₃")
    const parameter = (paramCell && GASES[gasKey(paramCell)]) || paramCell || f.parameter || null
    let { min, max } = parseLimit(get(row, 'limit') ?? null)
    const lmin = parseNum(get(row, 'limit_min') ?? null)
    const lmax = parseNum(get(row, 'limit_max') ?? null)
    if (lmin !== null) min = lmin
    if (lmax !== null) max = lmax
    const work_intensity = intensityFrom(get(row, 'intensity') ?? null)
    // giới hạn mặc định khi file không ghi
    if (min === null && max === null) {
      if (f.factor === 'nhiet_do' && work_intensity) ({ min, max } = HEAT_LIMITS[work_intensity])
      else if (f.factor === 'hoi_khi_doc' && parameter) {
        const p = toxicPreset(parameter)
        if (p) max = p.max
      } else if (FACTOR_DEFAULT_LIMITS[f.factor]) {
        min = FACTOR_DEFAULT_LIMITS[f.factor]!.min ?? null
        max = FACTOR_DEFAULT_LIMITS[f.factor]!.max ?? null
      }
    }
    const value = parseNum(get(row, 'value') ?? null)
    const rawValue = text(get(row, 'value'))
    const exposed = parseNum(get(row, 'exposed') ?? null)
    parsed.push({
      department,
      position,
      factor: f.factor,
      parameter,
      unit: text(get(row, 'unit')) ?? (WEM_FACTORS[f.factor].unit || null),
      value,
      limit_min: min,
      limit_max: max,
      work_intensity,
      exposed_count: exposed === null ? null : Math.round(exposed),
      note: [text(get(row, 'note')), value === null && rawValue ? `Kết quả: ${rawValue}` : null].filter(Boolean).join('; ') || null,
    })
  }
  return { parsed, issues, headers }
}

/** File mẫu nhập kết quả QTMTLĐ */
export async function downloadWemTemplate() {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const head = ['Bộ phận', 'Vị trí đo', 'Yếu tố', 'Thông số', 'Đơn vị tính', 'Kết quả', 'Giới hạn dưới', 'Giới hạn trên', 'Cường độ lao động', 'Số NLĐ tiếp xúc', 'Ghi chú'].map((value) => ({
    value,
    fontWeight: 'bold' as const,
    backgroundColor: '#DCE7E1',
    wrap: true,
  }))
  const sample: (string | number | null)[][] = [
    ['Xưởng Tạo hạt 1', 'Thùng sấy quay', 'Nhiệt độ', null, '°C', 33.2, null, null, 'Vừa', 3, 'Giới hạn tự lấy theo cường độ lao động'],
    ['Xưởng Tạo hạt 1', 'Thùng sấy quay', 'Tiếng ồn', null, 'dBA', 93.4, null, 85, null, 3, null],
    ['Xưởng Tạo hạt 1', 'Thùng sấy quay', 'Bụi chứa silic', 'Bụi hô hấp chứa silic', 'mg/m³', 0.084, null, 0.1, null, 3, 'Giới hạn theo hàm lượng SiO₂ trên phiếu'],
    ['Xưởng Tạo hạt 1', 'Sàn tạo hạt', 'Hơi khí độc', 'NH3', 'mg/m³', 6.8, null, 17, null, 4, null],
  ]
  const data = [head, ...sample.map((r) => r.map((v) => (v === null ? null : { value: v })))]
  await writeXlsxFile(data as any, { columns: [24, 24, 18, 24, 11, 10, 12, 12, 16, 14, 32].map((width) => ({ width })), stickyRowsCount: 1 } as any).toFile(
    'Mau_nhap_ket_qua_QTMTLD.xlsx'
  )
}
