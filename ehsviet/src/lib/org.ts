// Tổ chức bộ máy HSE theo quy định: tính số người tối thiểu phải bố trí theo số lao động, ngành nghề
// và so với phân công thực tế (Luật ATVSLĐ 2015 Điều 72–75; NĐ 39/2016/NĐ-CP Điều 36–38; Luật PCCC và CNCH 2024,
// NĐ 105/2025/NĐ-CP; Luật Sử dụng năng lượng tiết kiệm và hiệu quả sửa đổi bởi Luật 77/2025/QH15).
// Mức "(đối chiếu)" là điểm chưa đọc toàn văn – kiểm tra trước khi dùng làm căn cứ chính thức.
import type { Tone } from '../components/UI'
import { isValid, type CellStatus, type Employee } from './training'

export interface HseRole {
  id: string
  employee_id: string
  role: HseRoleKey
  decision_no: string | null
  decision_date: string | null
  start_date: string | null
  end_date: string | null
  qualification: string | null
  note: string | null
}

export type HseRoleKey =
  | 'atvsld_chuyen_trach'
  | 'atvsld_ban_chuyen_trach'
  | 'y_te'
  | 'hoi_dong_atvsld'
  | 'atvsv'
  | 'moi_truong'
  | 'van_hanh_xlmt'
  | 'pccc_chi_huy'
  | 'pccc_doi_vien'
  | 'so_cuu'
  | 'ung_pho_su_co'
  | 'hoa_chat'
  | 'nang_luong'

export const HSE_ROLE_LABELS: Record<HseRoleKey, string> = {
  atvsld_chuyen_trach: 'Người làm công tác ATVSLĐ chuyên trách',
  atvsld_ban_chuyen_trach: 'Người làm công tác ATVSLĐ bán chuyên trách',
  y_te: 'Người làm công tác y tế',
  hoi_dong_atvsld: 'Thành viên Hội đồng ATVSLĐ cơ sở',
  atvsv: 'An toàn, vệ sinh viên',
  moi_truong: 'Cán bộ phụ trách môi trường',
  van_hanh_xlmt: 'Người vận hành công trình xử lý chất thải',
  pccc_chi_huy: 'Đội trưởng / đội phó đội PCCC cơ sở',
  pccc_doi_vien: 'Đội viên đội PCCC cơ sở',
  so_cuu: 'Lực lượng sơ cứu, cấp cứu',
  ung_pho_su_co: 'Đội ứng phó sự cố môi trường – hóa chất',
  hoa_chat: 'Người phụ trách an toàn hóa chất',
  nang_luong: 'Người quản lý năng lượng',
}

/** Nhóm hiển thị sơ đồ tổ chức */
export const ROLE_GROUPS: { key: string; label: string; roles: HseRoleKey[] }[] = [
  { key: 'atvsld', label: 'An toàn – vệ sinh lao động', roles: ['atvsld_chuyen_trach', 'atvsld_ban_chuyen_trach', 'hoi_dong_atvsld', 'atvsv'] },
  { key: 'y_te', label: 'Y tế – sơ cứu', roles: ['y_te', 'so_cuu'] },
  { key: 'moi_truong', label: 'Môi trường – ứng phó sự cố', roles: ['moi_truong', 'van_hanh_xlmt', 'ung_pho_su_co'] },
  { key: 'pccc', label: 'PCCC & CNCH', roles: ['pccc_chi_huy', 'pccc_doi_vien'] },
  { key: 'khac', label: 'Hóa chất – năng lượng', roles: ['hoa_chat', 'nang_luong'] },
]

/** Loại huấn luyện phải còn hiệu lực với người đảm nhiệm vai trò */
export const ROLE_TRAINING: Partial<Record<HseRoleKey, string>> = {
  atvsld_chuyen_trach: 'atvsld',
  atvsld_ban_chuyen_trach: 'atvsld',
  hoi_dong_atvsld: 'atvsld',
  atvsv: 'atvsld',
  pccc_chi_huy: 'pccc',
  pccc_doi_vien: 'pccc',
  so_cuu: 'so_cap_cuu',
  ung_pho_su_co: 'su_co_chat_thai',
  van_hanh_xlmt: 'su_co_chat_thai',
  hoa_chat: 'hoa_chat',
}

/** Vai trò đang đảm nhiệm (chưa có ngày kết thúc hoặc kết thúc sau hôm nay) */
export const isActiveRole = (r: Pick<HseRole, 'end_date'>, today = new Date().toISOString().slice(0, 10)) =>
  !r.end_date || r.end_date >= today

export interface OrgInput {
  headcount: number
  /** đã nhập "Tổng số lao động" hay đang dùng số nhân sự trong phần mềm */
  headcountEntered: boolean
  hazardous: boolean
  shifts: number | null
  employees: Employee[]
  roles: HseRole[]
  /** trạng thái huấn luyện: employee_id → loại → trạng thái */
  training: Map<string, Record<string, CellStatus>>
  /** năng lượng tiêu thụ năm gần nhất có số liệu (TOE), null = chưa có */
  toe: number | null
  toeYear: number | null
}

export interface Requirement {
  key: string
  title: string
  requiredText: string
  /** số người tối thiểu; null = không bắt buộc / chỉ theo dõi */
  required: number | null
  actual: number
  ok: boolean | null
  basis: string
  penalty?: string
  issues: string[]
  people: Employee[]
}

const n2 = (n: number) => String(n).padStart(2, '0')

/** Người làm công tác ATVSLĐ — NĐ 39/2016 Điều 36 k1 */
export function atvsldRule(headcount: number, hazardous: boolean): { count: number; full: boolean; text: string } {
  if (hazardous) {
    if (headcount < 50) return { count: 1, full: false, text: '≥ 01 người bán chuyên trách (< 50 LĐ)' }
    if (headcount < 300) return { count: 1, full: true, text: '≥ 01 người chuyên trách (50 – < 300 LĐ)' }
    if (headcount < 1000) return { count: 2, full: true, text: '≥ 02 người chuyên trách (300 – < 1.000 LĐ)' }
    return { count: 3, full: true, text: '≥ 03 người chuyên trách hoặc phòng ATVSLĐ riêng (≥ 1.000 LĐ)' }
  }
  if (headcount < 300) return { count: 1, full: false, text: '≥ 01 người bán chuyên trách (< 300 LĐ)' }
  if (headcount < 1000) return { count: 1, full: true, text: '≥ 01 người chuyên trách (300 – < 1.000 LĐ)' }
  return { count: 2, full: true, text: '≥ 02 người chuyên trách hoặc phòng ATVSLĐ riêng (≥ 1.000 LĐ)' }
}

/** Người làm công tác y tế — NĐ 39/2016 Điều 37 */
export function medicalRule(headcount: number, hazardous: boolean): { count: number | null; text: string } {
  if (hazardous) {
    if (headcount < 300) return { count: 1, text: '≥ 01 người trình độ trung cấp (< 300 LĐ)' }
    if (headcount < 500) return { count: 2, text: '≥ 01 bác sĩ hoặc y sĩ và 01 người làm công tác y tế (300 – < 500 LĐ)' }
    if (headcount < 1000) return { count: 2, text: '≥ 01 bác sĩ và 01 người làm công tác y tế (500 – < 1.000 LĐ)' }
    return { count: null, text: '≥ 1.000 LĐ: theo Điều 37 (đối chiếu)' }
  }
  if (headcount < 500) return { count: 1, text: '≥ 01 người trình độ trung cấp (< 500 LĐ – đối chiếu)' }
  return { count: null, text: '≥ 500 LĐ: theo Điều 37 (đối chiếu)' }
}

/** Biên chế đội PCCC cơ sở – tham chiếu (đối chiếu NĐ 105/2025) */
export function fireTeamRule(headcount: number): { count: number; leaders: number; text: string } {
  if (headcount < 10) return { count: headcount, leaders: 1, text: 'Toàn bộ người làm việc là đội viên (< 10 người)' }
  if (headcount <= 50) return { count: 10, leaders: 1, text: '≥ 10 người, có đội trưởng (10 – 50 người)' }
  return { count: 15, leaders: 2, text: '≥ 15 người, có đội trưởng và đội phó (> 50 người)' }
}

/** Bộ phận văn phòng không phải "tổ sản xuất" (Luật ATVSLĐ Điều 74: mỗi tổ sản xuất ≥ 01 ATVSV) */
export const isOfficeUnit = (department: string) => /^(ban|phòng|văn phòng)\b/i.test(department.trim()) && !/thí nghiệm/i.test(department)

export function evaluateOrg(input: OrgInput): Requirement[] {
  const { headcount, hazardous, employees, roles, training } = input
  const active = employees.filter((e) => e.status === 'active')
  const byId = new Map(employees.map((e) => [e.id, e]))
  const holders = (...keys: HseRoleKey[]) => {
    const ids = new Set(roles.filter((r) => keys.includes(r.role) && isActiveRole(r)).map((r) => r.employee_id))
    return [...ids].map((id) => byId.get(id)).filter((e): e is Employee => !!e && e.status === 'active')
  }
  /** người đảm nhiệm vai trò nhưng huấn luyện bắt buộc không còn hiệu lực */
  const untrained = (people: Employee[], category: string) =>
    people.filter((e) => {
      const s = training.get(e.id)?.[category]
      return !s || !isValid(s)
    })
  const trainingIssue = (people: Employee[], category: string, label: string) => {
    const bad = untrained(people, category)
    return bad.length ? [`${bad.length} người chưa còn hiệu lực huấn luyện ${label}: ${bad.map((e) => e.full_name).join(', ')}`] : []
  }
  const out: Requirement[] = []

  // 1. Người làm công tác ATVSLĐ
  const at = atvsldRule(headcount, hazardous)
  const full = holders('atvsld_chuyen_trach')
  const part = holders('atvsld_ban_chuyen_trach')
  const atActual = at.full ? full.length : full.length + part.length
  out.push({
    key: 'atvsld',
    title: 'Người làm công tác ATVSLĐ',
    requiredText: at.text,
    required: at.count,
    actual: atActual,
    ok: atActual >= at.count,
    basis: `NĐ 39/2016/NĐ-CP Điều 36 k1 ${hazardous ? 'a (sản xuất hóa chất – phân bón)' : 'b'}; huấn luyện nhóm 2 (NĐ 44/2016)`,
    penalty: 'NĐ 283/2026 Điều 32 k2: không bố trí bộ phận, người làm công tác ATVSLĐ 5–10 tr (tổ chức × 2)',
    issues: [
      ...(at.full && part.length && full.length < at.count ? [`${part.length} người bán chuyên trách – quy mô này cần chuyên trách`] : []),
      ...trainingIssue([...full, ...part], 'atvsld', 'ATVSLĐ'),
    ],
    people: [...full, ...part],
  })

  // 2. Y tế
  const med = medicalRule(headcount, hazardous)
  const medPeople = holders('y_te')
  out.push({
    key: 'y_te',
    title: 'Người làm công tác y tế',
    requiredText: med.text,
    required: med.count,
    actual: medPeople.length,
    ok: med.count == null ? null : medPeople.length >= med.count,
    basis: 'NĐ 39/2016/NĐ-CP Điều 37; hồ sơ, báo cáo y tế lao động theo TT 19/2016/TT-BYT',
    penalty: 'NĐ 283/2026 Điều 32 k2 (bộ máy, sơ cứu): 5–10 tr (tổ chức × 2)',
    issues: medPeople.some((e) => !roles.find((r) => r.employee_id === e.id && r.role === 'y_te')?.qualification)
      ? ['Ghi trình độ chuyên môn (trung cấp, y sĩ, bác sĩ) của người làm công tác y tế']
      : [],
    people: medPeople,
  })

  // 3. Hội đồng ATVSLĐ cơ sở
  const council = holders('hoi_dong_atvsld')
  const councilRequired = headcount >= 300
  out.push({
    key: 'hoi_dong',
    title: 'Hội đồng ATVSLĐ cơ sở',
    requiredText: councilRequired ? 'Bắt buộc (≥ 300 LĐ)' : 'Không bắt buộc (< 300 LĐ) – nhà máy có thể thành lập',
    required: councilRequired ? 3 : null,
    actual: council.length,
    ok: councilRequired ? council.length >= 3 : council.length > 0 ? true : null,
    basis: 'Luật ATVSLĐ 2015 Điều 75: đại diện NSDLĐ, BCH công đoàn cơ sở, người làm công tác ATVSLĐ, y tế; NĐ 39/2016',
    issues: [
      ...(council.length && !council.some((e) => holders('atvsld_chuyen_trach', 'atvsld_ban_chuyen_trach').includes(e))
        ? ['Hội đồng chưa có người làm công tác ATVSLĐ']
        : []),
    ],
    people: council,
  })

  // 4. An toàn, vệ sinh viên – mỗi tổ sản xuất
  const atvsv = holders('atvsv')
  const units = [...new Set(active.map((e) => e.department).filter((d): d is string => !!d))]
    .filter((d) => !isOfficeUnit(d))
    .sort((a, b) => a.localeCompare(b, 'vi'))
  const missingUnits = units.filter((u) => !atvsv.some((e) => e.department === u))
  const notGroup6 = atvsv.filter((e) => e.atvsld_group !== 6)
  out.push({
    key: 'atvsv',
    title: 'An toàn, vệ sinh viên',
    requiredText: `≥ 01 người mỗi tổ sản xuất (${units.length} tổ)`,
    required: units.length,
    actual: units.length - missingUnits.length,
    ok: missingUnits.length === 0,
    basis: 'Luật ATVSLĐ 2015 Điều 74; huấn luyện nhóm 6 (NĐ 44/2016 Điều 19)',
    issues: [
      ...(missingUnits.length ? [`Chưa có ATVSV: ${missingUnits.join(', ')}`] : []),
      ...(notGroup6.length ? [`${notGroup6.length} ATVSV chưa ghi nhóm huấn luyện 6: ${notGroup6.map((e) => e.full_name).join(', ')}`] : []),
      ...trainingIssue(atvsv, 'atvsld', 'ATVSLĐ'),
    ],
    people: atvsv,
  })

  // 5. Đội PCCC cơ sở
  const fr = fireTeamRule(headcount)
  const leaders = holders('pccc_chi_huy')
  const members = holders('pccc_chi_huy', 'pccc_doi_vien')
  const shifts = input.shifts ?? 1
  out.push({
    key: 'pccc',
    title: 'Đội PCCC cơ sở',
    requiredText: fr.text + (shifts > 1 ? `; mỗi ca có tổ PCCC (${shifts} ca)` : ''),
    required: fr.count,
    actual: members.length,
    ok: members.length >= fr.count && leaders.length >= fr.leaders,
    basis: 'Luật PCCC và CNCH 2024; NĐ 105/2025/NĐ-CP (biên chế: đối chiếu). Không bắt buộc chuyên trách – đội viên kiêm nhiệm, được huấn luyện nghiệp vụ',
    penalty: 'NĐ 106/2025 Điều 8 k4: không thành lập đội PCCC cơ sở 10–20 tr; Điều 6 k4: bố trí người chưa có thông báo kết quả huấn luyện 6–8 tr (tổ chức × 2)',
    issues: [
      ...(leaders.length < fr.leaders ? [`Thiếu ${fr.leaders - leaders.length} người chỉ huy (đội trưởng / đội phó)`] : []),
      ...trainingIssue(members, 'pccc', 'PCCC'),
    ],
    people: members,
  })

  // 6. Môi trường
  const env = holders('moi_truong')
  const ops = holders('van_hanh_xlmt')
  out.push({
    key: 'moi_truong',
    title: 'Bộ phận / nhân sự phụ trách môi trường',
    requiredText: '≥ 01 người phụ trách; luật không quy định định biên',
    required: 1,
    actual: env.length,
    ok: env.length >= 1,
    basis: 'Tiêu chí ESG 1.13 (QĐ 46/2026/QĐ-TTg, Phụ lục VI); vận hành công trình BVMT theo GPMT',
    issues: ops.length === 0 ? ['Chưa phân công người vận hành công trình xử lý chất thải (HTXLNT, xử lý khí thải)'] : trainingIssue(ops, 'su_co_chat_thai', 'ứng phó sự cố chất thải'),
    people: [...env, ...ops.filter((e) => !env.includes(e))],
  })

  // 7. Người quản lý năng lượng
  const energy = holders('nang_luong')
  const key = input.toe != null && input.toe >= 1000
  out.push({
    key: 'nang_luong',
    title: 'Người quản lý năng lượng',
    requiredText:
      input.toe == null
        ? 'Bắt buộc với cơ sở sử dụng năng lượng trọng điểm (≥ 1.000 TOE/năm) – chưa có số liệu năng lượng'
        : key
          ? `Bắt buộc: ${Math.round(input.toe).toLocaleString('vi-VN')} TOE năm ${input.toeYear} (≥ 1.000 TOE – cơ sở trọng điểm)`
          : `Không bắt buộc: ${Math.round(input.toe).toLocaleString('vi-VN')} TOE năm ${input.toeYear} (< 1.000 TOE)`,
    required: key ? 1 : null,
    actual: energy.length,
    ok: key ? energy.length >= 1 : null,
    basis: 'Luật 50/2010/QH12 sửa đổi bởi Luật 77/2025/QH15; chứng chỉ quản lý năng lượng theo TT 53/2025/TT-BCT; KTNL 03 năm/lần',
    issues: energy.some((e) => !roles.find((r) => r.employee_id === e.id && r.role === 'nang_luong')?.qualification)
      ? ['Ghi số chứng chỉ quản lý năng lượng']
      : [],
    people: energy,
  })

  // 8. Theo dõi: sơ cứu, ứng phó sự cố, an toàn hóa chất
  const firstAid = holders('so_cuu')
  out.push({
    key: 'so_cuu',
    title: 'Lực lượng sơ cứu, cấp cứu',
    requiredText: 'Bố trí theo ca, khu vực (đối chiếu số lượng theo TT 19/2016/TT-BYT)',
    required: null,
    actual: firstAid.length,
    ok: firstAid.length ? (untrained(firstAid, 'so_cap_cuu').length ? false : true) : false,
    basis: 'NĐ 39/2016/NĐ-CP; TT 19/2016/TT-BYT',
    penalty: 'NĐ 283/2026 Điều 32 k2: không bố trí lực lượng sơ cứu 5–10 tr (tổ chức × 2)',
    issues: firstAid.length ? trainingIssue(firstAid, 'so_cap_cuu', 'sơ cứu') : ['Chưa phân công lực lượng sơ cứu, cấp cứu'],
    people: firstAid,
  })
  const response = holders('ung_pho_su_co')
  out.push({
    key: 'ung_pho',
    title: 'Đội ứng phó sự cố môi trường – hóa chất',
    requiredText: 'Theo kế hoạch ứng phó sự cố của cơ sở',
    required: null,
    actual: response.length,
    ok: response.length ? untrained(response, 'su_co_chat_thai').length === 0 : null,
    basis: 'Luật BVMT 2020 (phòng ngừa, ứng phó sự cố môi trường); QĐ 09/2020/QĐ-TTg; Luật Hóa chất 69/2025',
    penalty: 'NĐ 45/2022 Điều 40: không lập kế hoạch, không diễn tập, thiếu thiết bị ứng phó sự cố chất thải',
    issues: trainingIssue(response, 'su_co_chat_thai', 'ứng phó sự cố chất thải'),
    people: response,
  })
  const chem = holders('hoa_chat')
  out.push({
    key: 'hoa_chat',
    title: 'Người phụ trách an toàn hóa chất',
    requiredText: 'Theo điều kiện hoạt động hóa chất của cơ sở (đối chiếu NĐ 26/2026)',
    required: null,
    actual: chem.length,
    ok: chem.length ? untrained(chem, 'hoa_chat').length === 0 : null,
    basis: 'Luật Hóa chất 69/2025/QH15; NĐ 25/2026, NĐ 26/2026; TT 02/2026/TT-BCT',
    issues: trainingIssue(chem, 'hoa_chat', 'an toàn hóa chất'),
    people: chem,
  })
  return out
}

export const reqTone = (r: Requirement): Tone => (r.ok === null ? 'gray' : r.ok && r.issues.length === 0 ? 'green' : r.ok ? 'amber' : 'red')

export const reqLabel = (r: Requirement) =>
  r.ok === null ? 'Theo dõi' : r.ok ? (r.issues.length ? 'Đủ – cần lưu ý' : 'Đạt') : r.required != null && r.actual < r.required ? `Thiếu ${n2(r.required - r.actual)}` : 'Chưa đạt'
