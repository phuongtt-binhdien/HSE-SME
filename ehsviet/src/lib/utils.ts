import { differenceInCalendarDays, format, parseISO } from 'date-fns'

export const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ')

export const fmtDate = (d?: string | null) =>
  d ? format(parseISO(d), 'dd/MM/yyyy') : '—'

export const fmtNum = (n?: number | null, digits = 2) =>
  n === null || n === undefined
    ? '—'
    : new Intl.NumberFormat('vi-VN', { maximumFractionDigits: digits }).format(n)

/** Số với đúng `digits` chữ số thập phân (chỉ số cường độ) */
export const fmtFixed = (n?: number | null, digits = 4) =>
  n === null || n === undefined
    ? '—'
    : new Intl.NumberFormat('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

/** số ngày từ hôm nay đến d (âm = đã quá hạn) */
export const daysUntil = (d: string) => differenceInCalendarDays(parseISO(d), new Date())

export const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : typeof e === 'string' ? e : 'Đã xảy ra lỗi'

/** UUID v4 — dùng được cả ở ngữ cảnh http không bảo mật (truy cập qua IP nội bộ) */
export function newId(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c?.randomUUID) {
    try {
      return c.randomUUID()
    } catch {
      /* ngữ cảnh không bảo mật (http qua IP) → dùng cách dưới */
    }
  }
  const b = new Uint8Array(16)
  if (c?.getRandomValues) c.getRandomValues(b)
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
