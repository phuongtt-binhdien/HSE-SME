// Diễn tập theo từng người lao động: PCCC & CNCH, ứng phó sự cố môi trường – chất thải (gồm tràn dầu), sự cố hóa chất.
// Theo dõi lần tham gia gần nhất; cảnh báo khi chưa tham gia trong 12 tháng.
import { addMonths, format, parseISO } from 'date-fns'
import type { Tone } from '../components/UI'
import { daysUntil } from './utils'

export interface Drill {
  id: string
  drill_date: string
  kind: string
  scenario: string | null
  participants: number | null
  organizer: string | null
  evaluation: string | null
  plan_no?: string | null
  location?: string | null
  status?: 'planned' | 'done'
  result?: 'dat' | 'chua_dat' | null
}

export interface DrillParticipant {
  id: string
  drill_id: string
  employee_id: string
  attended: boolean
  role: string | null
  note: string | null
}

export const DRILL_KIND_LABELS: Record<string, string> = {
  PCCC: 'Thực tập phương án PCCC & CNCH',
  su_co_moi_truong: 'Ứng phó sự cố môi trường – chất thải',
  tran_dau: 'Ứng phó sự cố tràn dầu',
  su_co_hoa_chat: 'Ứng phó sự cố hóa chất',
  cap_cuu_TNLD: 'Sơ cứu, cấp cứu tai nạn lao động',
}

export const DRILL_STATUS_LABELS: Record<string, string> = { planned: 'Kế hoạch', done: 'Đã diễn tập' }
export const DRILL_RESULT_LABELS: Record<string, string> = { dat: 'Đạt', chua_dat: 'Chưa đạt – diễn tập lại' }

/** Nhiệm vụ thường gặp trong diễn tập (vẫn nhập tự do được) */
export const DRILL_ROLES = ['Chỉ huy', 'Chữa cháy', 'Cứu nạn, cứu hộ', 'Ứng phó tràn đổ', 'Sơ cứu', 'Hậu cần', 'Bảo vệ, phong tỏa', 'Quan sát, đánh giá', 'Sơ tán']

/** Cột ma trận diễn tập theo người */
export const DRILL_COLUMNS: { key: string; label: string; short: string; kinds: string[]; basis: string }[] = [
  {
    key: 'pccc',
    label: 'PCCC & CNCH',
    short: 'PCCC',
    kinds: ['PCCC'],
    basis: 'Phương án chữa cháy, CNCH của cơ sở được thực tập định kỳ (NĐ 105/2025/NĐ-CP); không thực tập: NĐ 106/2025 Điều 26 k4, 15–20 tr (tổ chức × 2)',
  },
  {
    key: 'moi_truong',
    label: 'Sự cố môi trường – chất thải',
    short: 'Sự cố MT',
    kinds: ['su_co_moi_truong', 'tran_dau'],
    basis: 'Kế hoạch ứng phó sự cố chất thải, tràn dầu (QĐ 09/2020/QĐ-TTg); không diễn tập: NĐ 45/2022 Điều 40 (đối chiếu điểm, khoản)',
  },
  {
    key: 'hoa_chat',
    label: 'Sự cố hóa chất',
    short: 'Hóa chất',
    kinds: ['su_co_hoa_chat'],
    basis: 'Kế hoạch / biện pháp phòng ngừa, ứng phó sự cố hóa chất (Luật Hóa chất 69/2025; NĐ 26/2026 – đối chiếu chu kỳ)',
  },
]

/** Chu kỳ theo dõi tham gia diễn tập (tháng) */
export const DRILL_VALID_MONTHS = 12

export type DrillState = 'dat' | 'sap_het' | 'qua_han' | 'vang' | 'chua'

export interface DrillCell {
  state: DrillState
  /** lần tham gia gần nhất */
  last: Drill | null
  /** hạn tham gia lần kế tiếp */
  due: string | null
  daysLeft: number | null
  /** số lần tham gia (tất cả các năm) */
  count: number
}

export const DRILL_STATE_LABELS: Record<DrillState, string> = {
  dat: 'Đã tham gia',
  sap_het: 'Sắp đến hạn',
  qua_han: 'Quá 12 tháng',
  vang: 'Vắng lần gần nhất',
  chua: 'Chưa tham gia',
}

export const DRILL_STATE_TONE: Record<DrillState, Tone> = {
  dat: 'green',
  sap_het: 'amber',
  qua_han: 'red',
  vang: 'amber',
  chua: 'red',
}

/** employee_id → cột → trạng thái tham gia */
export function buildDrillMatrix(employeeIds: string[], drills: Drill[], participants: DrillParticipant[]) {
  const done = new Map(drills.filter((d) => (d.status ?? 'done') === 'done').map((d) => [d.id, d]))
  const byEmp = new Map<string, DrillParticipant[]>()
  for (const p of participants) {
    if (!done.has(p.drill_id)) continue
    const list = byEmp.get(p.employee_id)
    if (list) list.push(p)
    else byEmp.set(p.employee_id, [p])
  }
  const out = new Map<string, Record<string, DrillCell>>()
  for (const id of employeeIds) {
    const mine = byEmp.get(id) ?? []
    const row: Record<string, DrillCell> = {}
    for (const col of DRILL_COLUMNS) {
      const inCol = mine.filter((p) => col.kinds.includes(done.get(p.drill_id)!.kind))
      const attended = inCol.filter((p) => p.attended).map((p) => done.get(p.drill_id)!)
      attended.sort((a, b) => b.drill_date.localeCompare(a.drill_date))
      const last = attended[0] ?? null
      if (last) {
        const due = format(addMonths(parseISO(last.drill_date), DRILL_VALID_MONTHS), 'yyyy-MM-dd')
        const n = daysUntil(due)
        row[col.key] = { state: n < 0 ? 'qua_han' : n <= 30 ? 'sap_het' : 'dat', last, due, daysLeft: n, count: attended.length }
      } else {
        const absent = inCol.some((p) => !p.attended)
        row[col.key] = { state: absent ? 'vang' : 'chua', last: null, due: null, daysLeft: null, count: 0 }
      }
    }
    out.set(id, row)
  }
  return out
}

export const isDrillOk = (c: DrillCell) => c.state === 'dat' || c.state === 'sap_het'
