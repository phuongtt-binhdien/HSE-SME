import { differenceInCalendarDays, format, parseISO } from 'date-fns'

export const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ')

export const fmtDate = (d?: string | null) =>
  d ? format(parseISO(d), 'dd/MM/yyyy') : '—'

export const fmtNum = (n?: number | null, digits = 2) =>
  n === null || n === undefined
    ? '—'
    : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(n)

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

/** số ngày từ hôm nay đến d (âm = đã quá hạn) */
export const daysUntil = (d: string) => differenceInCalendarDays(parseISO(d), new Date())

export const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'Đã xảy ra lỗi'
