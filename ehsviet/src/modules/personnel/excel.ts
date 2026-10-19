// Đọc danh sách nhân sự + cột huấn luyện (Khóa – Ngày – Quyết định) từ Excel/CSV và xuất ma trận ra Excel.
import { ATVSLD_GROUP_LABELS, TRAINING_CATEGORY_SHORT, TRAINING_STATE_LABELS } from '../../lib/constants'
import { MATRIX_CATEGORIES, type Employee, type MatrixRow } from '../../lib/training'
import { fmtDate } from '../../lib/utils'

export type Cell = string | number | boolean | Date | null | undefined

/** Bỏ dấu, chữ thường, gộp khoảng trắng — dùng so khớp tiêu đề cột */
export const normalize = (s: unknown) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const pad = (n: number) => String(n).padStart(2, '0')
const validYmd = (y: number, m: number, d: number) => {
  if (y < 1950 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCMonth() === m - 1 ? `${y}-${pad(m)}-${pad(d)}` : null
}

/** Ngày từ ô Excel: Date, số seri Excel, "dd/mm/yyyy", "yyyy-mm-dd" → yyyy-MM-dd */
export function parseDateCell(v: Cell): string | null {
  if (v == null || v === '') return null
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null
    return validYmd(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate())
  }
  if (typeof v === 'number') {
    if (v < 20000 || v > 80000) return null
    const dt = new Date(Math.round((v - 25569) * 86400000))
    return validYmd(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
  }
  const s = String(v).trim()
  let m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/)
  if (m) {
    let y = Number(m[3])
    if (y < 100) y += 2000
    return validYmd(y, Number(m[2]), Number(m[1]))
  }
  m = s.match(/^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})/)
  if (m) return validYmd(Number(m[1]), Number(m[2]), Number(m[3]))
  if (/^\d{5}$/.test(s)) return parseDateCell(Number(s))
  return null
}

const text = (v: Cell) => {
  if (v == null) return ''
  if (v instanceof Date) return parseDateCell(v) ?? ''
  return String(v).trim()
}

// ---------------- Nhận diện cột ----------------

type Field = 'code' | 'full_name' | 'gender' | 'department' | 'position' | 'atvsld_group' | 'hire_date' | 'status'
/** mark = cột chỉ ghi tên loại (vd "PCCC"): ô là ngày → ngày huấn luyện, là chữ → tên khóa */
type TrainField = 'course' | 'date' | 'decision' | 'decision_date' | 'cert' | 'expiry' | 'hours' | 'provider' | 'mark'

const FIELD_ALIASES: [Field, string[]][] = [
  ['code', ['ma nv', 'ma nhan vien', 'msnv', 'ma so nv', 'ma so', 'ma']],
  ['full_name', ['ho ten', 'ho va ten', 'ho ten nhan vien', 'ten nhan vien', 'nhan vien', 'ten']],
  ['gender', ['gioi tinh', 'phai']],
  ['department', ['bo phan', 'phong ban', 'don vi', 'phan xuong', 'xuong', 'to', 'bo phan don vi']],
  ['position', ['chuc danh', 'chuc vu', 'cong viec', 'vi tri']],
  ['hire_date', ['ngay vao lam', 'ngay vao', 'ngay nhan viec', 'ngay tuyen dung']],
  ['status', ['trang thai', 'tinh trang lam viec']],
]

/** Thứ tự kiểm tra: loại cụ thể trước loại chung ("an toàn hóa chất" trước "an toàn") */
const CATEGORY_KEYWORDS: [string, string[]][] = [
  ['hoa_chat', ['hoa chat']],
  ['so_cap_cuu', ['so cap cuu', 'so cuu', 'cap cuu']],
  ['pccc', ['pccc', 'phong chay', 'chua chay', 'cnch']],
  ['su_co_chat_thai', ['su co chat thai', 'ung pho su co', 'su co', 'scct', 'sccct', 'chat thai']],
  ['atvsld', ['atvsld', 'atld', 'an toan ve sinh lao dong', 'an toan lao dong', 'an toan', 'attlvs']],
]

const TRAIN_FIELD_KEYWORDS: [TrainField, string[]][] = [
  ['decision_date', ['ngay qd', 'ngay quyet dinh']],
  ['decision', ['so qd', 'quyet dinh', 'qd', 'so quyet dinh']],
  ['expiry', ['het han', 'han', 'hieu luc', 'gia tri den']],
  ['cert', ['chung nhan', 'so the', 'the an toan', 'gcn']],
  ['hours', ['so gio', 'gio']],
  ['provider', ['don vi huan luyen', 'don vi hl', 'giang vien']],
  ['date', ['ngay huan luyen', 'ngay hl', 'ngay']],
  ['course', ['ten khoa', 'khoa hoc', 'khoa', 'lop', 'noi dung']],
]

const SUB_HEADER_WORDS = new Set(['khoa', 'ngay', 'qd', 'quyet dinh', 'so qd', 'khoa hoc', 'ten khoa', 'lop', 'han', 'so gio'])

const hasWord = (h: string, kw: string) => (' ' + h + ' ').includes(' ' + kw + ' ')

export type ColumnMap =
  | { kind: 'field'; field: Field }
  | { kind: 'train'; category: string; field: TrainField }
  | { kind: 'ignore' }

export function mapHeader(raw: string): ColumnMap {
  const h = normalize(raw)
  if (!h || h === 'stt' || h === 'tt') return { kind: 'ignore' }
  if (hasWord(h, 'nhom')) return { kind: 'field', field: 'atvsld_group' }
  const cat = CATEGORY_KEYWORDS.find(([, kws]) => kws.some((k) => hasWord(h, k)))?.[0]
  if (cat) {
    const rest = CATEGORY_KEYWORDS.find(([c]) => c === cat)![1]
      .reduce((s, k) => s.replace(k, ' '), h)
      .replace(/\s+/g, ' ')
      .trim()
    if (!rest) return { kind: 'train', category: cat, field: 'mark' }
    const tf = TRAIN_FIELD_KEYWORDS.find(([, kws]) => kws.some((k) => hasWord(rest, k)))?.[0]
    // cột khác cùng nhóm (vd "Tình trạng") → bỏ qua để không ghi đè tên khóa
    return tf ? { kind: 'train', category: cat, field: tf } : { kind: 'ignore' }
  }
  for (const [field, aliases] of FIELD_ALIASES) if (aliases.includes(h)) return { kind: 'field', field }
  for (const [field, aliases] of FIELD_ALIASES) if (aliases.some((a) => a.length > 3 && h.startsWith(a))) return { kind: 'field', field }
  return { kind: 'ignore' }
}

/** Tìm dòng tiêu đề, gộp tiêu đề 2 tầng (ô gộp "ATVSLĐ" phía trên "Khóa | Ngày | QĐ") */
export function detectHeader(rows: Cell[][]): { headers: string[]; dataStart: number } | null {
  const limit = Math.min(rows.length, 15)
  for (let i = 0; i < limit; i++) {
    const r = rows[i] ?? []
    const nameIdx = r.findIndex((c) => {
      const m = mapHeader(text(c))
      return m.kind === 'field' && m.field === 'full_name'
    })
    if (nameIdx < 0) continue
    const next = rows[i + 1] ?? []
    const subCount = next.filter((c) => SUB_HEADER_WORDS.has(normalize(text(c)))).length
    const width = Math.max(r.length, next.length)
    if (subCount >= 2) {
      const headers: string[] = []
      let group = ''
      for (let j = 0; j < width; j++) {
        const top = text(r[j])
        const sub = text(next[j])
        if (top) group = top
        headers.push(sub ? `${group} ${sub}` : top)
      }
      return { headers, dataStart: i + 2 }
    }
    return { headers: Array.from({ length: width }, (_, j) => text(r[j])), dataStart: i + 1 }
  }
  return null
}

export interface ParsedTraining {
  category: string
  course: string
  date: string | null
  decision: string
  decision_date: string | null
  cert: string
  expiry: string | null
  hours: number | null
  provider: string
}

export interface ParsedRow {
  line: number
  code: string
  full_name: string
  gender: 'nam' | 'nu' | null
  department: string
  position: string
  atvsld_group: number | null
  hire_date: string | null
  status: 'active' | 'inactive' | null
  trainings: ParsedTraining[]
  warnings: string[]
  errors: string[]
}

const parseGender = (v: string): 'nam' | 'nu' | null => {
  const n = normalize(v)
  if (['nam', 'm', 'male'].includes(n)) return 'nam'
  if (['nu', 'f', 'female'].includes(n)) return 'nu'
  return null
}

const parseGroup = (v: Cell): number | null => {
  const m = text(v).match(/[1-6]/)
  return m ? Number(m[0]) : null
}

export function parseRows(rows: Cell[][]): { parsed: ParsedRow[]; columns: ColumnMap[]; headers: string[] } | null {
  const det = detectHeader(rows)
  if (!det) return null
  const columns = det.headers.map(mapHeader)
  const parsed: ParsedRow[] = []
  for (let i = det.dataStart; i < rows.length; i++) {
    const r = rows[i] ?? []
    if (r.every((c) => text(c) === '')) continue
    const row: ParsedRow = {
      line: i + 1,
      code: '',
      full_name: '',
      gender: null,
      department: '',
      position: '',
      atvsld_group: null,
      hire_date: null,
      status: null,
      trainings: [],
      warnings: [],
      errors: [],
    }
    const tr = new Map<string, ParsedTraining>()
    const marked = new Set<string>()
    columns.forEach((col, j) => {
      const v = r[j]
      if (col.kind === 'field') {
        switch (col.field) {
          case 'code':
            row.code = text(v)
            break
          case 'full_name':
            row.full_name = text(v)
            break
          case 'gender':
            row.gender = parseGender(text(v))
            break
          case 'department':
            row.department = text(v)
            break
          case 'position':
            row.position = text(v)
            break
          case 'atvsld_group':
            row.atvsld_group = parseGroup(v)
            break
          case 'hire_date':
            row.hire_date = parseDateCell(v)
            if (text(v) && !row.hire_date) row.warnings.push('Ngày vào làm không đọc được: ' + text(v))
            break
          case 'status': {
            const n = normalize(text(v))
            row.status = n.includes('nghi') ? 'inactive' : n ? 'active' : null
            break
          }
        }
      } else if (col.kind === 'train') {
        const t =
          tr.get(col.category) ??
          ({ category: col.category, course: '', date: null, decision: '', decision_date: null, cert: '', expiry: null, hours: null, provider: '' } as ParsedTraining)
        const s = text(v)
        if (col.field === 'course') t.course = s
        else if (col.field === 'decision') t.decision = s
        else if (col.field === 'cert') t.cert = s
        else if (col.field === 'provider') t.provider = s
        else if (col.field === 'hours') t.hours = s ? Number(String(s).replace(',', '.')) || null : null
        else if (col.field === 'mark') {
          const dt = parseDateCell(v)
          if (dt) t.date = dt
          else if (s && !['chua', 'khong', 'x', '-', 'co', 'da', 'da hl'].includes(normalize(s))) t.course = s
          else if (s && ['x', 'co', 'da', 'da hl'].includes(normalize(s))) marked.add(col.category)
        } else {
          const dt = parseDateCell(v)
          if (s && !dt) {
            // ô "Ngày" ghi chữ (vd "Chưa", "x") → coi như chưa huấn luyện
            if (col.field === 'date' && !['chua', 'khong', 'x', '-'].includes(normalize(s)))
              row.warnings.push(`${TRAINING_CATEGORY_SHORT[col.category]}: ngày "${s}" không đọc được`)
          }
          if (col.field === 'date') t.date = dt
          else if (col.field === 'decision_date') t.decision_date = dt
          else t.expiry = dt
        }
        tr.set(col.category, t)
      }
    })
    for (const t of tr.values()) {
      const any = t.course || t.date || t.decision || t.cert
      if (!any) {
        if (marked.has(t.category))
          row.warnings.push(`${TRAINING_CATEGORY_SHORT[t.category]}: có đánh dấu nhưng không có ngày – nhập ngày để tính hạn`)
        continue
      }
      if (!t.date) {
        row.warnings.push(`${TRAINING_CATEGORY_SHORT[t.category]}: thiếu ngày huấn luyện – bỏ qua cột này`)
        continue
      }
      row.trainings.push(t)
    }
    if (!row.full_name) row.errors.push('Thiếu họ tên')
    parsed.push(row)
  }
  return { parsed, columns, headers: det.headers }
}

/** CSV / dán từ Excel (tab) → mảng dòng */
export function parseDelimited(textIn: string): Cell[][] {
  const src = textIn.replace(/^﻿/, '')
  // nhận dạng dấu phân cách trên vài dòng đầu (dòng tiêu đề tên bảng thường không có dấu phân cách)
  const sample = src.split(/\r?\n/, 8).join('\n')
  const count = (re: RegExp) => sample.match(re)?.length ?? 0
  const delim = count(/\t/g) > 0 ? '\t' : count(/;/g) > count(/,/g) ? ';' : ','
  const rows: Cell[][] = []
  let row: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cur += '"'
          i++
        } else quoted = false
      } else cur += ch
    } else if (ch === '"' && cur === '') quoted = true
    else if (ch === delim) {
      row.push(cur)
      cur = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
    } else cur += ch
  }
  if (cur !== '' || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows
}

export async function readSpreadsheetFile(file: File): Promise<Cell[][]> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv') || name.endsWith('.txt') || name.endsWith('.tsv')) return parseDelimited(await file.text())
  if (name.endsWith('.xls')) throw new Error('Định dạng .xls cũ chưa hỗ trợ — lưu lại thành .xlsx hoặc .csv trong Excel.')
  const { readSheet } = await import('read-excel-file/browser')
  return (await readSheet(file)) as Cell[][]
}

// ---------------- Xuất Excel ----------------

const STATE_FILL: Record<string, string> = {
  con_han: '#E6F2EC',
  sap_het: '#FDF1D6',
  het_han: '#FBE1E1',
  chua: '#FBE1E1',
}

export async function exportMatrixXlsx(
  employees: Employee[],
  matrix: Map<string, MatrixRow>,
  facilityName: string
) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const head = (value: string, extra: Record<string, unknown> = {}) => ({
    value,
    fontWeight: 'bold' as const,
    align: 'center' as const,
    alignVertical: 'center' as const,
    wrap: true,
    backgroundColor: '#DCE7E1',
    ...extra,
  })
  const fixed = ['STT', 'Mã NV', 'Họ và tên', 'Bộ phận', 'Chức danh', 'Nhóm ATVSLĐ']
  const sub = ['Khóa', 'Ngày', 'Quyết định', 'Hạn', 'Tình trạng']
  const row1: any[] = fixed.map((h) => head(h, { rowSpan: 2 }))
  const row2: any[] = fixed.map(() => null)
  for (const cat of MATRIX_CATEGORIES) {
    row1.push(head(TRAINING_CATEGORY_SHORT[cat], { columnSpan: sub.length }), ...sub.slice(1).map(() => null))
    row2.push(...sub.map((h) => head(h)))
  }
  const title: any[] = [
    { value: `MA TRẬN HUẤN LUYỆN AN TOÀN – PCCC – ỨNG PHÓ SỰ CỐ CHẤT THẢI · ${facilityName} · ${fmtDate(new Date().toISOString().slice(0, 10))}`, fontWeight: 'bold', columnSpan: fixed.length + sub.length * MATRIX_CATEGORIES.length },
  ]
  const data: any[][] = [title, row1, row2]
  employees.forEach((e, i) => {
    const r: any[] = [
      i + 1,
      e.code ?? '',
      e.full_name,
      e.department ?? '',
      e.position ?? '',
      e.atvsld_group ? ATVSLD_GROUP_LABELS[String(e.atvsld_group)]?.split(' – ')[0] ?? '' : '',
    ]
    for (const cat of MATRIX_CATEGORIES) {
      const s = matrix.get(e.id)?.[cat]
      const fill = s ? STATE_FILL[s.state] : undefined
      const c = (value: string) => ({ value, backgroundColor: fill, wrap: true })
      r.push(
        c(s?.course?.name ?? ''),
        c(s?.course ? fmtDate(s.course.end_date || s.course.start_date) : ''),
        c(s?.course?.decision_no ?? ''),
        c(s?.expiry ? fmtDate(s.expiry) : ''),
        c(s ? TRAINING_STATE_LABELS[s.state] : '')
      )
    }
    data.push(r)
  })
  const columns = [
    { width: 5 },
    { width: 9 },
    { width: 24 },
    { width: 22 },
    { width: 20 },
    { width: 9 },
    ...MATRIX_CATEGORIES.flatMap(() => [{ width: 26 }, { width: 11 }, { width: 14 }, { width: 11 }, { width: 13 }]),
  ]
  await writeXlsxFile(data, { columns, stickyRowsCount: 3, stickyColumnsCount: 3 } as any).toFile(
    `Ma_tran_huan_luyen_${new Date().toISOString().slice(0, 10)}.xlsx`
  )
}

/** File mẫu để nhập: tiêu đề 2 tầng giống sổ theo dõi huấn luyện */
export async function downloadImportTemplate() {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const head = (value: string, extra: Record<string, unknown> = {}) => ({
    value,
    fontWeight: 'bold' as const,
    align: 'center' as const,
    backgroundColor: '#DCE7E1',
    ...extra,
  })
  const fixed = ['Mã NV', 'Họ và tên', 'Giới tính', 'Bộ phận', 'Chức danh', 'Nhóm ATVSLĐ (1-6)', 'Ngày vào làm']
  const sub = ['Khóa', 'Ngày', 'Quyết định']
  const row1: any[] = fixed.map((h) => head(h, { rowSpan: 2 }))
  const row2: any[] = fixed.map(() => null)
  for (const cat of MATRIX_CATEGORIES) {
    row1.push(head(TRAINING_CATEGORY_SHORT[cat], { columnSpan: 3 }), null, null)
    row2.push(...sub.map((h) => head(h)))
  }
  const sample: any[][] = [
    ['NV101', 'Nguyễn Văn A', 'Nam', 'Xưởng Tạo hạt 1', 'Công nhân vận hành', 4, '01/03/2024', 'Huấn luyện ATVSLĐ định kỳ – nhóm 4', '12/03/2026', '15/QĐ-…', 'Bồi dưỡng PCCC & CNCH hằng năm', '20/05/2026', '22/QĐ-…', 'Ứng phó sự cố chất thải', '15/04/2026', '18/QĐ-…'],
    ['NV102', 'Trần Thị B', 'Nữ', 'Kho nguyên liệu – thành phẩm', 'Thủ kho', 4, '15/08/2025', 'Huấn luyện ATVSLĐ định kỳ – nhóm 4', '12/03/2026', '15/QĐ-…', '', '', '', '', '', ''],
  ]
  const columns = [{ width: 9 }, { width: 22 }, { width: 9 }, { width: 22 }, { width: 20 }, { width: 10 }, { width: 12 }, ...MATRIX_CATEGORIES.flatMap(() => [{ width: 30 }, { width: 12 }, { width: 12 }])]
  await writeXlsxFile([row1, row2, ...sample], { columns, stickyRowsCount: 2 } as any).toFile('Mau_nhap_nhan_su_huan_luyen.xlsx')
}
