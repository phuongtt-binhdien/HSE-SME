// Chương trình kiểm tra định kỳ: kỳ kiểm tra (tuần ISO, tháng, quý, 6 tháng, năm, ngày), lịch đã làm / bỏ sót / đến kỳ
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfISOWeek,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  setISOWeek,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  subDays,
} from 'date-fns'

export type Frequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly'

export interface InspectionPlan {
  id: string
  name: string
  scope: string
  frequency: Frequency
  template_id: string | null
  team: string | null
  owner: string | null
  basis: string | null
  start_date: string
  active: boolean
  note: string | null
}

export interface ChecklistRun {
  id: string
  template_id: string
  plan_id: string | null
  period: string | null
  run_date: string
  inspector: string | null
  results: { label: string; hint?: string; status: 'dat' | 'khong_dat' | 'na'; note?: string }[]
  score: number | null
  note: string | null
}

export const INSPECTION_SCOPE_LABELS: Record<string, string> = {
  tong_the: 'Tổng thể HSE',
  moi_truong: 'Môi trường',
  atvsld: 'An toàn lao động',
  pccc: 'PCCC & CNCH',
  hoa_chat: 'Hóa chất',
  vscn: 'Vệ sinh công nghiệp',
  thiet_bi: 'Thiết bị',
}

const ROMAN = ['I', 'II', 'III', 'IV']

/** Khóa kỳ chứa ngày `d`: 2026-10-18 · 2026-W42 · 2026-10 · 2026-Q4 · 2026-H2 · 2026 */
export function periodKey(freq: Frequency, d: Date): string {
  switch (freq) {
    case 'daily':
      return format(d, 'yyyy-MM-dd')
    case 'weekly':
      return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`
    case 'monthly':
      return format(d, 'yyyy-MM')
    case 'quarterly':
      return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`
    case 'semiannual':
      return `${d.getFullYear()}-H${d.getMonth() < 6 ? 1 : 2}`
    case 'yearly':
      return String(d.getFullYear())
  }
}

/** Ngày đầu – cuối của kỳ */
export function periodRange(freq: Frequency, key: string): { start: Date; end: Date } {
  switch (freq) {
    case 'daily': {
      const d = parseISO(key)
      return { start: startOfDay(d), end: endOfDay(d) }
    }
    case 'weekly': {
      const [y, w] = key.split('-W').map(Number)
      // ngày 04/01 luôn thuộc tuần ISO 01 của năm ISO
      const d = setISOWeek(new Date(y, 0, 4), w)
      return { start: startOfISOWeek(d), end: endOfISOWeek(d) }
    }
    case 'monthly': {
      const d = parseISO(key + '-01')
      return { start: startOfMonth(d), end: endOfMonth(d) }
    }
    case 'quarterly': {
      const [y, q] = key.split('-Q').map(Number)
      const d = new Date(y, (q - 1) * 3, 1)
      return { start: startOfQuarter(d), end: endOfQuarter(d) }
    }
    case 'semiannual': {
      const [y, h] = key.split('-H').map(Number)
      const s = new Date(y, h === 1 ? 0 : 6, 1)
      return { start: s, end: endOfMonth(addMonths(s, 5)) }
    }
    case 'yearly': {
      const d = new Date(Number(key), 0, 1)
      return { start: startOfYear(d), end: endOfYear(d) }
    }
  }
}

/** Nhãn kỳ: "Tuần 42 (12/10–18/10/2026)", "Tháng 10/2026", "Quý IV/2026", "6 tháng cuối năm 2026" */
export function periodLabel(freq: Frequency, key: string, short = false): string {
  const { start, end } = periodRange(freq, key)
  switch (freq) {
    case 'daily':
      return format(start, 'dd/MM/yyyy')
    case 'weekly': {
      const w = key.split('-W')[1]
      return short ? `T${Number(w)}` : `Tuần ${Number(w)} (${format(start, 'dd/MM')}–${format(end, 'dd/MM/yyyy')})`
    }
    case 'monthly':
      return short ? `Th${format(start, 'M')}` : `Tháng ${format(start, 'MM/yyyy')}`
    case 'quarterly': {
      const q = Number(key.split('-Q')[1])
      return short ? `Q${ROMAN[q - 1]}` : `Quý ${ROMAN[q - 1]}/${start.getFullYear()}`
    }
    case 'semiannual': {
      const h = Number(key.split('-H')[1])
      return short ? `6T${h === 1 ? 'Đ' : 'C'}` : `6 tháng ${h === 1 ? 'đầu' : 'cuối'} năm ${start.getFullYear()}`
    }
    case 'yearly':
      return `Năm ${key}`
  }
}

function nextStart(freq: Frequency, d: Date): Date {
  switch (freq) {
    case 'daily':
      return addDays(d, 1)
    case 'weekly':
      return addWeeks(d, 1)
    case 'monthly':
      return addMonths(d, 1)
    case 'quarterly':
      return addMonths(d, 3)
    case 'semiannual':
      return addMonths(d, 6)
    case 'yearly':
      return addYears(d, 1)
  }
}

/** Các kỳ (theo thứ tự) có giao với khoảng [from, to] */
export function periodsBetween(freq: Frequency, from: Date, to: Date): string[] {
  const out: string[] = []
  let cur = periodRange(freq, periodKey(freq, from)).start
  for (let i = 0; i < 800 && cur <= to; i++) {
    out.push(periodKey(freq, cur))
    cur = nextStart(freq, cur)
  }
  return out
}

export type PeriodState = 'done' | 'missed' | 'current' | 'upcoming'

export interface PeriodCell {
  key: string
  label: string
  short: string
  state: PeriodState
  start: Date
  end: Date
  runs: ChecklistRun[]
}

/**
 * Lịch kỳ của một chương trình từ đầu năm (hoặc ngày bắt đầu chương trình) đến kỳ kế tiếp:
 * done – đã có lượt kiểm tra; missed – kỳ đã qua mà chưa kiểm tra; current – kỳ đang diễn ra, chưa kiểm tra; upcoming – kỳ sau.
 * Kiểm tra hằng ngày chỉ hiển thị 14 ngày gần nhất.
 */
export function planSchedule(plan: InspectionPlan, runs: ChecklistRun[], today = new Date(), year = today.getFullYear()): PeriodCell[] {
  const start = parseISO(plan.start_date)
  const yearStart = new Date(year, 0, 1)
  const yearEnd = endOfYear(yearStart)
  const isCurrentYear = year === today.getFullYear()
  let from = start > yearStart ? start : yearStart
  if (plan.frequency === 'daily' && isCurrentYear) {
    const d14 = subDays(startOfDay(today), 13)
    if (d14 > from) from = d14
  }
  const to = isCurrentYear ? nextStart(plan.frequency, periodRange(plan.frequency, periodKey(plan.frequency, today)).start) : yearEnd
  if (from > to) return []
  const mine = runs.filter((r) => r.plan_id === plan.id && r.period)
  const t0 = startOfDay(today)
  return periodsBetween(plan.frequency, from, to).map((key) => {
    const { start: s, end: e } = periodRange(plan.frequency, key)
    const rs = mine.filter((r) => r.period === key)
    const state: PeriodState = rs.length ? 'done' : e < t0 ? 'missed' : s > today ? 'upcoming' : 'current'
    return { key, label: periodLabel(plan.frequency, key), short: periodLabel(plan.frequency, key, true), state, start: s, end: e, runs: rs }
  })
}

/** Tỷ lệ thực hiện: số kỳ đã kiểm tra / số kỳ đã đến hạn (kỳ đã qua + kỳ hiện tại nếu đã làm) */
export function scheduleCompliance(cells: PeriodCell[]) {
  const due = cells.filter((c) => c.state === 'done' || c.state === 'missed')
  const done = due.filter((c) => c.state === 'done').length
  const missed = due.length - done
  return { due: due.length, done, missed, pct: due.length ? Math.round((done / due.length) * 100) : 100 }
}

/** Kỳ hiện tại của chương trình (để thực hiện kiểm tra) */
export const currentPeriod = (freq: Frequency, today = new Date()) => periodKey(freq, today)

/** Điểm đạt: tỷ lệ hạng mục đạt, loại trừ N/A */
export function runScore(results: ChecklistRun['results']) {
  const scored = results.filter((r) => r.status !== 'na')
  if (scored.length === 0) return 100
  return Math.round((scored.filter((r) => r.status === 'dat').length / scored.length) * 100)
}
