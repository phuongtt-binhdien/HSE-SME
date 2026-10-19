// Dữ liệu dùng thử cho các phân hệ PDCA: tổ chức bộ máy, diễn tập theo người, thiết bị – sửa chữa – kiểm định,
// chương trình kiểm tra, hành động khắc phục, hóa chất nhập – xuất, EPR bao bì, dòng tuần hoàn, kế hoạch – lộ trình.
// Toàn bộ là SỐ LIỆU MINH HỌA (tên người giả định), không phải số liệu nội bộ của nhà máy.
import { format, subWeeks } from 'date-fns'
import { CHECKLIST_NAMES, VSCN_MONTHLY_CHECKLIST } from '../checklistTemplates'
import { capaItemLabel } from '../capa'
import { periodKey, periodLabel, runScore, type Frequency } from '../inspection'
import { INSPECTION_CHECKLISTS, INSPECTION_PLAN_TEMPLATES } from '../inspectionTemplates'
import { annualTemplates, FIVE_YEAR_TEMPLATES, NET_ZERO_TEMPLATES, planRows, roadmapTargetRows } from '../plan'

type Row = Record<string, any>

export interface PdcaSeedCtx {
  uuid: () => string
  now: Date
  year: number
  base: { org_id: string; facility_id: string }
  /** ngày cách hôm nay `n` ngày (yyyy-MM-dd) */
  d: (n: number) => string
  /** ngày `day` của tháng cách hiện tại `m` tháng */
  md: (m: number, day: number) => string
  emp: (code: string) => Row
  employees: Row[]
  checklistTemplates: Row[]
  checklistRuns: Row[]
  incidents: Row[]
  capaActions: Row[]
  chemicals: Row[]
  /** tổng phát thải phạm vi 1 + 2 năm trước (tCO₂e) để dựng đường mục tiêu */
  ghgBase: number
}

const MH = 'Số liệu minh họa'

export function buildPdcaSeed(c: PdcaSeedCtx) {
  const { uuid, now, year, base, d, md, emp } = c
  const iso = (x: Date) => format(x, 'yyyy-MM-dd')
  const ts = (n: number) => `${d(n)}T08:00:00.000Z`

  // ---------- Tổ chức bộ máy HSE ----------
  const role = (code: string, r: string, extra: Row = {}): Row => ({
    id: uuid(),
    ...base,
    employee_id: emp(code).id,
    role: r,
    decision_no: 'QĐ phân công (mẫu)',
    decision_date: `${year}-01-05`,
    start_date: `${year}-01-05`,
    end_date: null,
    qualification: null,
    note: null,
    ...extra,
  })
  const hse_roles: Row[] = [
    role('NV003', 'atvsld_chuyen_trach', { qualification: 'Kỹ sư an toàn lao động; huấn luyện nhóm 2' }),
    role('NV001', 'hoi_dong_atvsld', { note: 'Chủ tịch Hội đồng' }),
    role('NV002', 'hoi_dong_atvsld'),
    role('NV003', 'hoi_dong_atvsld', { note: 'Ủy viên thường trực' }),
    role('NV004', 'hoi_dong_atvsld'),
    role('NV009', 'atvsv'),
    role('NV005', 'atvsv', { note: 'Chưa huấn luyện nhóm 6' }),
    role('NV016', 'atvsv'),
    role('NV014', 'atvsv'),
    role('NV002', 'moi_truong', { qualification: 'Kỹ sư môi trường' }),
    role('NV020', 'van_hanh_xlmt', { note: 'HTXLNT' }),
    role('NV014', 'van_hanh_xlmt', { note: 'Hệ xử lý khí thải lò hơi' }),
    role('NV001', 'pccc_chi_huy', { note: 'Đội trưởng' }),
    role('NV003', 'pccc_chi_huy', { note: 'Đội phó' }),
    ...['NV004', 'NV005', 'NV007', 'NV010', 'NV011', 'NV014', 'NV016', 'NV017', 'NV018', 'NV020', 'NV022', 'NV024'].map((x) => role(x, 'pccc_doi_vien')),
    ...['NV003', 'NV009', 'NV019', 'NV023'].map((x) => role(x, 'so_cuu')),
    ...['NV002', 'NV020', 'NV014', 'NV016', 'NV021'].map((x) => role(x, 'ung_pho_su_co')),
    role('NV002', 'hoa_chat'),
  ]

  // ---------- Diễn tập và người tham gia ----------
  const drill = (o: Row): Row => ({ id: uuid(), ...base, plan_no: null, location: null, status: 'done', result: 'dat', participants: null, organizer: null, evaluation: null, scenario: null, ...o })
  const dPccc = drill({ drill_date: md(-4, 22), kind: 'PCCC', scenario: 'Cháy kho bao bì, cứu người bị nạn tại sàn thao tác Tạo hạt 2', organizer: 'Đội PCCC cơ sở phối hợp Công an PCCC', evaluation: 'Đạt; thời gian triển khai lăng vòi 4 phút', plan_no: 'Phương án chữa cháy cơ sở (mẫu)', location: 'Kho bao bì' })
  const dPcccOld = drill({ drill_date: md(-16, 18), kind: 'PCCC', scenario: 'Cháy tủ điện xưởng Tạo hạt 1', organizer: 'Đội PCCC cơ sở', evaluation: 'Đạt', plan_no: 'Phương án chữa cháy cơ sở (mẫu)', location: 'Xưởng Tạo hạt 1' })
  const dHc = drill({ drill_date: md(-6, 12), kind: 'su_co_hoa_chat', scenario: 'Tràn NaOH tại nhà hóa chất HTXLNT', organizer: 'Phòng Kỹ thuật Sản xuất', evaluation: 'Bổ sung bộ ứng phó tràn đổ tại nhà hóa chất', location: 'Nhà hóa chất HTXLNT' })
  const dMt = drill({ drill_date: md(-9, 15), kind: 'su_co_moi_truong', scenario: 'Sự cố HTXLNT: bơm nước thải đầu vào ngừng, nguy cơ tràn bể điều hòa', organizer: 'Phòng Kỹ thuật Sản xuất', evaluation: 'Đạt; cần bơm dự phòng tại hố thu', location: 'HTXLNT' })
  const dDau = drill({ drill_date: d(20), kind: 'tran_dau', status: 'planned', result: null, scenario: 'Tràn dầu tại cầu cảng khi tiếp nhiên liệu cho phương tiện thủy', organizer: 'Phòng Kỹ thuật Sản xuất', plan_no: 'Kế hoạch ứng phó sự cố tràn dầu (mẫu)', location: 'Cầu cảng' })
  const dCc = drill({ drill_date: md(-3, 8), kind: 'cap_cuu_TNLD', scenario: 'Sơ cứu người bị bỏng nhiệt tại lò sấy', organizer: 'Lực lượng sơ cứu', evaluation: 'Đạt' })
  const drills = [dPccc, dPcccOld, dHc, dMt, dDau, dCc]

  const drill_participants: Row[] = []
  const join = (dr: Row, codes: string[], attended = true, roleName: string | null = null) => {
    for (const code of codes) drill_participants.push({ id: uuid(), ...base, drill_id: dr.id, employee_id: emp(code).id, attended, role: roleName, note: attended ? null : 'Vắng – nghỉ ca' })
  }
  const working = c.employees.filter((e) => e.status === 'active' && e.code !== 'NV025').map((e) => e.code as string)
  join(dPccc, working.filter((x) => !['NV012', 'NV019', 'NV023', 'NV001', 'NV003'].includes(x)), true, 'Chữa cháy')
  join(dPccc, ['NV001'], true, 'Chỉ huy')
  join(dPccc, ['NV003'], true, 'Chỉ huy')
  join(dPccc, ['NV012', 'NV019'], false)
  join(dPcccOld, working, true)
  join(dHc, ['NV002', 'NV003', 'NV020', 'NV021', 'NV014', 'NV015', 'NV016', 'NV019'], true, 'Ứng phó tràn đổ')
  join(dHc, ['NV017'], false)
  join(dMt, ['NV002', 'NV003', 'NV020', 'NV016', 'NV017', 'NV014', 'NV004', 'NV005', 'NV007', 'NV010', 'NV024'], true, 'Ứng phó sự cố')
  join(dMt, ['NV018'], false)
  join(dCc, ['NV003', 'NV009', 'NV019', 'NV023', 'NV005', 'NV013'], true, 'Sơ cứu')
  join(dDau, ['NV024', 'NV018', 'NV020', 'NV002', 'NV003', 'NV016', 'NV017'], true, 'Ứng phó tràn dầu')
  for (const dr of drills) if (dr.status === 'done') dr.participants = drill_participants.filter((p) => p.drill_id === dr.id && p.attended).length

  // ---------- Thiết bị ----------
  const eq = (o: Row): Row => ({
    id: uuid(),
    ...base,
    code: null,
    category: 'san_xuat',
    strict_safety: false,
    department: null,
    location: null,
    manufacturer: null,
    model: null,
    serial_no: null,
    year_made: null,
    commissioned_date: null,
    inspection_cycle_months: null,
    last_inspection: null,
    next_inspection: null,
    inspection_org: null,
    maintainer: 'to_co_dien',
    status: 'van_hanh',
    note: null,
    ...o,
  })
  const KD = 'Tổ chức kiểm định (minh họa)'
  const eBoiler = eq({ code: 'TB-LH-01', name: 'Nồi hơi 8 t/h', category: 'ap_luc', strict_safety: true, department: 'Tổ Lò hơi', location: 'Nhà lò hơi', year_made: 2018, inspection_cycle_months: 24, last_inspection: d(-680), next_inspection: d(50), inspection_org: KD })
  const eAir = eq({ code: 'TB-AL-01', name: 'Bình chứa khí nén 2 m³ – trạm khí nén số 2', category: 'ap_luc', strict_safety: true, department: 'Tổ Cơ điện', location: 'Trạm khí nén số 2', inspection_cycle_months: 36, last_inspection: d(-1100), next_inspection: d(-5), inspection_org: KD })
  const eSteam = eq({ code: 'TB-AL-02', name: 'Đường ống dẫn hơi lò hơi – lò sấy', category: 'ap_luc', strict_safety: true, department: 'Tổ Lò hơi', inspection_cycle_months: 36, last_inspection: d(-400), next_inspection: d(695), inspection_org: KD })
  const eFork1 = eq({ code: 'TB-XN-01', name: 'Xe nâng hàng 3 tấn số 1', category: 'phuong_tien', strict_safety: true, department: 'Kho nguyên liệu – thành phẩm', inspection_cycle_months: 24, last_inspection: d(-715), next_inspection: d(15), inspection_org: KD })
  const eFork2 = eq({ code: 'TB-XN-02', name: 'Xe nâng hàng 3 tấn số 2', category: 'phuong_tien', strict_safety: true, department: 'Kho nguyên liệu – thành phẩm', inspection_cycle_months: 24, last_inspection: d(-200), next_inspection: d(530), inspection_org: KD })
  const eCrane = eq({ code: 'TB-CT-01', name: 'Cầu trục 5 tấn xưởng cơ khí', category: 'nang_ha', strict_safety: true, department: 'Tổ Cơ điện', inspection_cycle_months: 24, last_inspection: d(-300), next_inspection: d(430), inspection_org: KD })
  const eQuay = eq({ code: 'TB-CB-01', name: 'Cẩu bờ cầu cảng 10 tấn', category: 'nang_ha', strict_safety: true, department: 'Cầu cảng', inspection_cycle_months: 24, last_inspection: d(-500), next_inspection: d(230), inspection_org: KD })
  const eDryer = eq({ code: 'TB-SQ-01', name: 'Thùng sấy quay – Tạo hạt 1', category: 'san_xuat', department: 'Xưởng Tạo hạt 1' })
  const eBag = eq({ code: 'TB-LT-04', name: 'Hệ lọc túi sấy nóng – Tạo hạt 2 (dòng 04)', category: 'moi_truong', department: 'Xưởng Tạo hạt 2' })
  const eDose = eq({ code: 'TB-NT-01', name: 'Bơm định lượng Chlorine – HTXLNT', category: 'moi_truong', department: 'Tổ vận hành HTXLNT' })
  const eBlower1 = eq({ code: 'TB-NT-02', name: 'Máy thổi khí bể hiếu khí số 1 – HTXLNT', category: 'moi_truong', department: 'Tổ vận hành HTXLNT', status: 'thanh_ly' })
  const eBlower2 = eq({ code: 'TB-NT-03', name: 'Máy thổi khí bể hiếu khí số 2 – HTXLNT', category: 'moi_truong', department: 'Tổ vận hành HTXLNT' })
  const eComp = eq({ code: 'TB-MN-02', name: 'Máy nén khí trục vít – trạm số 2', category: 'dien', department: 'Tổ Cơ điện', maintainer: 'thue_ngoai' })
  const eGen = eq({ code: 'TB-PD-01', name: 'Máy phát điện dự phòng', category: 'dien', department: 'Tổ Cơ điện', inspection_cycle_months: 6, last_inspection: d(-60), next_inspection: d(120) })
  const eFirePump = eq({ code: 'TB-PC-01', name: 'Bơm chữa cháy diesel – trạm bờ sông', category: 'pccc', department: 'Tổ Cơ điện', maintainer: 'thue_ngoai' })
  const eHood = eq({ code: 'TB-PTN-01', name: 'Tủ hút khí độc – phòng thí nghiệm', category: 'phong_thi_nghiem', department: 'Phòng thí nghiệm (KCS)', inspection_cycle_months: 12, last_inspection: d(-265), next_inspection: d(100) })
  const equipment = [eBoiler, eAir, eSteam, eFork1, eFork2, eCrane, eQuay, eDryer, eBag, eDose, eBlower1, eBlower2, eComp, eGen, eFirePump, eHood]

  const insp = (e: Row, date: string, next: string, kind = 'kiem_dinh', no = 'GCN kiểm định (mẫu)'): Row => ({ id: uuid(), ...base, equipment_id: e.id, inspection_date: date, kind, organization: kind === 'kiem_dinh' ? KD : 'Tổ Cơ điện', certificate_no: no, result: 'dat', next_due: next, note: null })
  const equipment_inspections = [
    ...[eBoiler, eAir, eSteam, eFork1, eFork2, eCrane, eQuay].map((e) => insp(e, e.last_inspection, e.next_inspection)),
    insp(eGen, eGen.last_inspection, eGen.next_inspection, 'bao_duong', 'Biên bản bảo dưỡng (mẫu)'),
    insp(eHood, eHood.last_inspection, eHood.next_inspection, 'kiem_tra', 'Biên bản kiểm tra (mẫu)'),
  ]

  const wo = (o: Row): Row => ({
    id: uuid(),
    ...base,
    report_no: null,
    reported_by: null,
    cause: null,
    priority: 'trung_binh',
    env_impact: false,
    safety_impact: false,
    assignee: 'to_co_dien',
    contractor_name: null,
    due_date: null,
    repair_start_date: null,
    repair_done_date: null,
    repair_content: null,
    cost: null,
    acceptance_date: null,
    acceptance_no: null,
    safety_result: null,
    outcome: null,
    outcome_date: null,
    outcome_no: null,
    status: 'moi',
    note: null,
    created_by: null,
    ...o,
  })
  const woBag = wo({ equipment_id: eBag.id, report_no: 'BB-HH-01 (mẫu)', report_date: d(-2), reported_by: 'Ca trưởng Tạo hạt 2', description: 'Chênh áp lọc túi sấy nóng 270 mmH₂O (> 260); kiểm tra phát hiện 06 túi rách', cause: 'Túi lọc quá thời hạn thay; nhiệt độ khí vào cao', priority: 'cao', env_impact: true, due_date: d(1), repair_start_date: d(-1), status: 'dang_sua', note: 'Giảm tải dây chuyền đến khi thay xong túi lọc' })
  const woPump = wo({ equipment_id: eFirePump.id, report_no: 'BB-HH-02 (mẫu)', report_date: d(-12), reported_by: 'Đội PCCC cơ sở', description: 'Bơm bù áp rò rỉ phớt cơ khí; áp lực hệ thống giảm còn 6 bar khi bơm ngừng', priority: 'cao', safety_impact: true, assignee: 'thue_ngoai', contractor_name: 'Đơn vị bảo trì PCCC (minh họa)', due_date: d(-3), repair_start_date: d(-8), status: 'dang_sua' })
  const woDose = wo({ equipment_id: eDose.id, report_no: 'BB-HH-03 (mẫu)', report_date: d(-9), reported_by: 'Tổ vận hành HTXLNT', description: 'Bơm định lượng Chlorine lưu lượng thấp, màng bơm nứt', priority: 'trung_binh', env_impact: true, due_date: d(-2), repair_start_date: d(-8), repair_done_date: d(-5), repair_content: 'Thay màng bơm, vệ sinh van bi một chiều', cost: 1850000, status: 'cho_nghiem_thu' })
  const woFork = wo({ equipment_id: eFork2.id, report_no: 'BB-HH-04 (mẫu)', report_date: md(-2, 9), reported_by: 'Tổ Cơ điện', description: 'Rò rỉ dầu thủy lực do ống dầu lão hóa', priority: 'cao', env_impact: true, safety_impact: true, due_date: md(-2, 11), repair_start_date: md(-2, 9), repair_done_date: md(-2, 11), repair_content: 'Thay bộ ống dầu thủy lực', cost: 3200000, acceptance_date: md(-2, 12), acceptance_no: 'BB-NT-04 (mẫu)', safety_result: 'dat', outcome: 'van_hanh', outcome_date: md(-2, 12), status: 'hoan_thanh' })
  const woComp = wo({ equipment_id: eComp.id, report_no: 'BB-HH-05 (mẫu)', report_date: d(-15), reported_by: 'Tổ Cơ điện', description: 'Máy nén khí quá nhiệt, dừng bảo vệ khi tải cao', priority: 'trung_binh', assignee: 'thue_ngoai', contractor_name: 'Đơn vị bảo trì máy nén khí (minh họa)', due_date: d(4), repair_start_date: d(-12), repair_done_date: d(-8), repair_content: 'Vệ sinh két làm mát, thay dầu máy nén', acceptance_date: d(-6), acceptance_no: 'BB-NT-05 (mẫu)', safety_result: 'khong_dat', status: 'dang_sua', note: 'Nghiệm thu không đạt: nhiệt độ dầu vẫn vượt 105 °C khi chạy thử có tải – yêu cầu thay két làm mát' })
  const woBlower = wo({ equipment_id: eBlower1.id, report_no: 'BB-HH-06 (mẫu)', report_date: md(-3, 4), reported_by: 'Tổ vận hành HTXLNT', description: 'Cháy cuộn dây động cơ, mòn buồng thổi', priority: 'cao', env_impact: true, due_date: md(-3, 20), acceptance_date: md(-3, 18), acceptance_no: 'BB đánh giá hiện trạng (mẫu)', outcome: 'thanh_ly', outcome_date: md(-3, 25), outcome_no: 'QĐ thanh lý (mẫu)', status: 'thanh_ly', note: 'Chuyển máy thổi khí số 2 sang chạy chính; lập đề nghị mua máy dự phòng' })
  const woDryer = wo({ equipment_id: eDryer.id, report_no: 'BB-HH-07 (mẫu)', report_date: d(-20), reported_by: 'Quản đốc Tạo hạt 1', description: 'Vành răng, con lăn đỡ mòn – tiếng ồn 93–95 dBA tại vị trí vận hành (theo QTMTLĐ)', priority: 'trung_binh', safety_impact: true, due_date: d(25), status: 'moi', note: 'Thực hiện trong đợt dừng máy bảo dưỡng; lắp bao che tiêu âm' })
  const woLight = wo({ equipment_id: eFork1.id, report_no: 'BB-HH-08 (mẫu)', report_date: md(-5, 3), reported_by: 'Thủ kho', description: 'Đèn, còi cảnh báo lùi không hoạt động', priority: 'thap', safety_impact: true, due_date: md(-5, 8), repair_start_date: md(-5, 3), repair_done_date: md(-5, 4), repair_content: 'Thay đèn, còi cảnh báo', cost: 450000, acceptance_date: md(-5, 4), acceptance_no: 'BB-NT-08 (mẫu)', safety_result: 'dat', outcome: 'van_hanh', outcome_date: md(-5, 4), status: 'hoan_thanh' })
  const equipment_work_orders = [woBag, woPump, woDose, woFork, woComp, woBlower, woDryer, woLight]
  eBag.status = 'sua_chua'
  eFirePump.status = 'sua_chua'
  eDose.status = 'cho_nghiem_thu'
  eComp.status = 'sua_chua'
  eDryer.status = 'hu_hong'

  // ---------- Chương trình kiểm tra định kỳ ----------
  const newTemplates = INSPECTION_CHECKLISTS.map((t) => ({ id: uuid(), ...base, ...t }))
  const allTemplates = [...c.checklistTemplates, ...newTemplates]
  const tplByName = (name: string) => allTemplates.find((t) => t.name === name)
  const weeksAgo12 = iso(subWeeks(now, 12))
  const plans = INSPECTION_PLAN_TEMPLATES.map((p) => ({
    id: uuid(),
    ...base,
    name: p.name,
    scope: p.scope,
    frequency: p.frequency,
    template_id: tplByName(p.checklist)?.id ?? null,
    team: p.team,
    owner: p.owner,
    basis: p.basis,
    start_date: p.frequency === 'weekly' ? weeksAgo12 : p.checklist === CHECKLIST_NAMES.MT ? `${year}-04-01` : `${year}-01-01`,
    active: true,
    note: null,
  }))
  const planBy = (name: string) => plans.find((p) => p.name === name)!
  const runs: Row[] = []
  const capa: Row[] = []
  const mkRun = (plan: Row, date: string, fails: Record<number, string>, inspector: string, extraNote: string | null = null) => {
    const tpl = allTemplates.find((t) => t.id === plan.template_id)!
    const results = (tpl.items as Row[]).map((it, i) => ({ label: it.label, status: fails[i] ? 'khong_dat' : 'dat', note: fails[i] ?? '' }))
    const run = { id: uuid(), ...base, template_id: tpl.id, plan_id: plan.id, period: periodKey(plan.frequency as Frequency, new Date(date + 'T12:00:00')), run_date: date, inspector, results, score: runScore(results as any), note: extraNote, created_by: null }
    runs.push(run)
    return run
  }
  const capaFrom = (run: Row, plan: Row, idx: number, o: Row) =>
    capa.push({
      id: uuid(),
      org_id: base.org_id,
      facility_id: base.facility_id,
      incident_id: null,
      source: 'kiem_tra',
      source_ref: run.id,
      source_label: capaItemLabel(`${plan.name} – ${periodLabel(plan.frequency as Frequency, run.period)}`, (run.results[idx] as Row).label),
      kind: 'khac_phuc',
      root_cause: null,
      verified_date: null,
      verified_by: null,
      effective: null,
      note: null,
      completed_date: null,
      created_at: `${run.run_date}T09:00:00.000Z`,
      ...o,
    })

  // Hằng tuần: 12 tuần gần nhất; tuần hiện tại PCCC chưa làm; vài tuần bỏ sót để thấy cảnh báo
  const pWeekPccc = planBy('Kiểm tra, chạy thử hệ thống PCCC hằng tuần')
  const pWeekEnv = planBy('Kiểm tra môi trường hằng tuần')
  const pWeekChem = planBy('Kiểm tra kho, khu sử dụng hóa chất hằng tuần')
  for (let w = 12; w >= 0; w--) {
    const day = subWeeks(now, w)
    // ngày thứ Sáu của tuần ISO (hoặc hôm nay nếu tuần hiện tại chưa tới thứ Sáu)
    const dow = (day.getDay() + 6) % 7
    const fri = new Date(day.getFullYear(), day.getMonth(), day.getDate() - dow + 4)
    const date = iso(fri > now ? now : fri)
    if (w !== 0 && w !== 7) {
      const fails: Record<number, string> = w === 2 ? { 2: 'Ắc quy đề bơm diesel yếu, khởi động lần 2 mới nổ máy' } : w === 5 ? { 3: 'Bơm bù áp chạy liên tục – rò rỉ phớt' } : {}
      const r = mkRun(pWeekPccc, date, fails, 'Đội PCCC cơ sở')
      if (w === 2) capaFrom(r, pWeekPccc, 2, { action: 'Thay ắc quy đề bơm chữa cháy diesel', department: 'Tổ Cơ điện', owner: 'Tổ trưởng Cơ điện', due_date: d(-4), status: 'in_progress' })
    }
    if (w !== 4) {
      const fails: Record<number, string> = w === 1 ? { 5: 'Kho CTNH thiếu vật liệu thấm hút, cát' } : w === 6 ? { 8: 'Mương nước mưa sau kho thành phẩm tồn phân bón' } : {}
      const r = mkRun(pWeekEnv, date, fails, 'Cán bộ môi trường')
      if (w === 1) capaFrom(r, pWeekEnv, 5, { action: 'Bổ sung vật liệu thấm hút, cát tại kho CTNH', department: 'Kho nguyên liệu – thành phẩm', owner: 'Thủ kho', due_date: d(3), status: 'open' })
      if (w === 6) capaFrom(r, pWeekEnv, 8, { action: 'Nạo vét mương nước mưa sau kho thành phẩm; che chắn khu xả liệu', department: 'Kho nguyên liệu – thành phẩm', owner: 'Thủ kho', due_date: d(-35), status: 'done', completed_date: d(-38), verified_date: d(-30), verified_by: 'Cán bộ môi trường', effective: true })
    }
    if (w !== 3 && w !== 9 && w !== 0) {
      const fails: Record<number, string> = w === 1 ? { 0: 'Can sang chiết HCl tại phòng thí nghiệm chưa dán nhãn' } : {}
      const r = mkRun(pWeekChem, date, fails, 'Phòng Kỹ thuật Sản xuất')
      if (w === 1) capaFrom(r, pWeekChem, 0, { action: 'Dán nhãn can sang chiết HCl; nhắc nhở phòng thí nghiệm', department: 'Phòng thí nghiệm (KCS)', owner: 'Trưởng phòng thí nghiệm', due_date: d(-1), status: 'open' })
    }
  }

  // Hằng tháng – VSCN: các tháng đã qua (gắn lượt kiểm tra tháng trước có sẵn vào chương trình)
  const pVscn = planBy('Kiểm tra môi trường – VSCN hằng tháng')
  const vscnTpl = tplByName(VSCN_MONTHLY_CHECKLIST.name)!
  for (const r of c.checklistRuns) {
    if (r.template_id === vscnTpl.id) {
      r.plan_id = pVscn.id
      r.period = periodKey('monthly', new Date(r.run_date + 'T12:00:00'))
    }
  }
  const haveVscn = new Set(c.checklistRuns.filter((r) => r.plan_id === pVscn.id).map((r) => r.period))
  for (let m = 0; m < now.getMonth(); m++) {
    const date = iso(new Date(year, m, 26))
    if (haveVscn.has(periodKey('monthly', new Date(date + 'T12:00:00')))) continue
    const fails: Record<number, string> = m % 3 === 0 ? { 7: 'Điểm thùng rác lẫn giẻ lau dính dầu' } : m % 3 === 1 ? { 2: 'Sàn thao tác đóng bụi' } : {}
    const r = mkRun(pVscn, date, fails, 'Hội đồng ATVSLĐ cơ sở')
    if (m === now.getMonth() - 2 && fails[2])
      capaFrom(r, pVscn, 2, { action: 'Vệ sinh sàn thao tác; bổ sung lịch vệ sinh cuối ca', department: 'Xưởng Tạo hạt 1', owner: 'Quản đốc Tạo hạt 1', due_date: d(-15), status: 'done', completed_date: d(-10) })
    if (m === now.getMonth() - 3 && fails[7])
      capaFrom(r, pVscn, 7, { action: 'Nhắc nhở, đào tạo lại phân loại rác tại kho thành phẩm', department: 'Kho nguyên liệu – thành phẩm', owner: 'Thủ kho', due_date: d(-60), status: 'done', completed_date: d(-62), verified_date: d(-5), verified_by: 'Hội đồng ATVSLĐ cơ sở', effective: false, note: 'Lỗi lặp lại ở kỳ kiểm tra tháng sau' })
  }

  // Hằng quý – tổng thể HSE: quý I, II đã làm; quý III bỏ sót; quý IV đang diễn ra
  const pOverall = planBy('Kiểm tra tổng thể HSE toàn nhà máy')
  const curQ = Math.floor(now.getMonth() / 3)
  for (let q = 0; q < curQ; q++) {
    if (q === 2) continue
    const date = iso(new Date(year, q * 3 + 2, 27))
    const fails: Record<number, string> = q === 1 ? { 4: 'Chưa có nhật ký vận hành riêng cho từng hệ xử lý khí thải', 8: 'Bình khí nén trạm 2 sắp hết hạn kiểm định' } : { 13: 'Chưa công khai kết quả QTMTLĐ cho người lao động' }
    const r = mkRun(pOverall, date, fails, 'Đoàn kiểm tra tổng thể', 'Biên bản kiểm tra tổng thể (mẫu)')
    if (q === 1) {
      capaFrom(r, pOverall, 4, { action: 'Lập sổ nhật ký vận hành riêng cho từng hệ xử lý khí thải', department: 'Xưởng Tạo hạt 1', owner: 'Quản đốc các xưởng', due_date: md(-3, 30), status: 'done', completed_date: md(-3, 25), verified_date: md(-2, 5), verified_by: 'Phòng Kỹ thuật Sản xuất', effective: true })
      capaFrom(r, pOverall, 8, { action: 'Đăng ký kiểm định bình chứa khí nén trạm số 2', department: 'Tổ Cơ điện', owner: 'Tổ trưởng Cơ điện', due_date: d(-10), status: 'in_progress', kind: 'phong_ngua' })
    }
  }

  // Tự kiểm tra tuân thủ PCCC hằng quý: quý I – III
  const pFireSelf = planBy('Tự kiểm tra tuân thủ PCCC & CNCH')
  for (let q = 0; q < curQ; q++) mkRun(pFireSelf, iso(new Date(year, q * 3 + 2, 20)), q === 2 ? { 5: 'Thiếu bằng chứng – bổ sung hồ sơ trước kỳ sau' } : {}, 'Đội PCCC cơ sở')
  const pEnvSelf = planBy('Tự kiểm tra tuân thủ bảo vệ môi trường')
  for (let q = 1; q < curQ; q++) mkRun(pEnvSelf, iso(new Date(year, q * 3 + 2, 22)), {}, 'Phòng Kỹ thuật Sản xuất')

  // ---------- Hành động khắc phục từ nguồn khác ----------
  const inc1 = c.incidents[0]
  const inc2 = c.incidents[1]
  const capaActions = c.capaActions.map((a) => ({
    facility_id: base.facility_id,
    source: 'su_co',
    source_ref: a.incident_id,
    source_label: a.incident_id === inc1?.id ? inc1.title : a.incident_id === inc2?.id ? inc2.title : null,
    kind: 'khac_phuc',
    department: a.owner ?? null,
    root_cause: a.incident_id === inc1?.id ? inc1.root_cause : a.incident_id === inc2?.id ? inc2.root_cause : null,
    verified_date: a.status === 'done' ? a.completed_date : null,
    verified_by: a.status === 'done' ? 'Phòng Kỹ thuật Sản xuất' : null,
    effective: a.status === 'done' ? true : null,
    note: null,
    created_at: now.toISOString(),
    ...a,
  }))
  const other = (o: Row): Row => ({ id: uuid(), org_id: base.org_id, facility_id: base.facility_id, incident_id: null, source_ref: null, kind: 'khac_phuc', root_cause: null, completed_date: null, verified_date: null, verified_by: null, effective: null, note: null, created_at: ts(-20), ...o })
  capa.push(
    other({ source: 'qtmtld', source_label: 'QTMTLĐ: ồn 93,4 dBA tại thùng sấy quay Tạo hạt 1 (minh họa)', action: 'Lắp bao che tiêu âm thùng sấy quay; bắt buộc dùng nút/chụp tai trong vùng ồn', department: 'Xưởng Tạo hạt 1', owner: 'Quản đốc Tạo hạt 1', due_date: d(25), status: 'in_progress', root_cause: 'Vành răng, con lăn đỡ mòn' }),
    other({ source: 'thiet_bi', source_ref: woComp.id, source_label: 'Nghiệm thu không đạt – máy nén khí trạm số 2', action: 'Yêu cầu nhà thầu thay két làm mát máy nén khí; nghiệm thu lại có chạy thử tải', department: 'Tổ Cơ điện', owner: 'Tổ trưởng Cơ điện', due_date: d(4), status: 'in_progress' }),
    other({ source: 'danh_gia', source_label: 'Đánh giá nội bộ ISO 14001 (minh họa)', action: 'Cập nhật văn bản dẫn chiếu hết hiệu lực trong bộ hướng dẫn MT-HD01…07 trước đánh giá tái chứng nhận', department: 'Phòng Kỹ thuật Sản xuất', owner: 'Cán bộ môi trường', due_date: d(30), status: 'in_progress', kind: 'phong_ngua' }),
    other({ source: 'khieu_nai', source_label: 'Phản ánh của người lao động ca 3 (minh họa)', action: 'Bổ sung chiếu sáng lối đi khu xả liệu xưởng Trộn', department: 'Tổ Cơ điện', owner: 'Tổ trưởng Cơ điện', due_date: d(-8), status: 'open', kind: 'cai_tien' })
  )

  // ---------- Hóa chất: phân loại, khu sử dụng, định mức; nhập – xuất ----------
  const created60 = ts(-60)
  const byName = (prefix: string) => c.chemicals.find((x) => x.name.startsWith(prefix))!
  const hcPatch: Record<string, Row> = {
    'NaOH (xút vảy)': { code: 'HC-NT-01', use_area: 'htxlnt', legal_group: 'nguy_hiem', hazard_classes: ['an_mon'], min_stock: 50, sds_date: '2023-05-10', quantity: 150, created_at: created60 },
    'PAC (Poly': { code: 'HC-NT-02', use_area: 'htxlnt', legal_group: 'thong_thuong', hazard_classes: ['kich_ung'], min_stock: 200, log_key: 'PAC', quantity: 300, sds_date: '2022-08-01', created_at: created60 },
    'Polymer anion': { code: 'HC-NT-03', use_area: 'htxlnt', legal_group: 'thong_thuong', hazard_classes: [], min_stock: 20, log_key: 'Polymer', quantity: 30, sds_date: '2019-03-15', created_at: created60 },
    'Calcium hypochlorite': { code: 'HC-NT-04', use_area: 'htxlnt', legal_group: 'nguy_hiem', hazard_classes: ['oxi_hoa', 'an_mon', 'moi_truong'], min_stock: 15, log_key: 'Chlorine', quantity: 45, sds_date: '2024-02-20', created_at: created60 },
    Zeolite: { code: 'HC-NT-05', use_area: 'htxlnt', legal_group: 'thong_thuong', hazard_classes: [], quantity: 300, created_at: created60 },
  }
  const chemicals: Row[] = c.chemicals.map((x) => {
    const key = Object.keys(hcPatch).find((k) => x.name.startsWith(k))
    return { formula: null, hazard_classes: [], legal_group: 'thong_thuong', use_area: 'san_xuat', min_stock: null, max_stock: null, sds_date: null, expiry_date: null, log_key: null, active: true, ...x, ...(key ? hcPatch[key] : {}) }
  })
  const chem = (o: Row): Row => ({ id: uuid(), ...base, code: null, cas_no: null, formula: null, supplier: null, storage_location: null, quantity: 0, unit: 'kg', pathh_available: true, pathh_url: null, hazard_classes: [], legal_group: 'thong_thuong', use_area: 'san_xuat', min_stock: null, max_stock: null, sds_date: null, expiry_date: null, log_key: null, active: true, note: null, created_at: ts(-90), ...o })
  const PTN = 'Phòng thí nghiệm (KCS)'
  const cH2SO4 = chem({ code: 'HC-PTN-01', name: 'Axit sunfuric H₂SO₄ 98%', cas_no: '7664-93-9', formula: 'H₂SO₄', storage_location: 'Tủ axit phòng thí nghiệm', quantity: 10, unit: 'L', hazard_classes: ['an_mon'], legal_group: 'tien_chat', use_area: 'phong_thi_nghiem', min_stock: 5, sds_date: '2024-06-01', note: 'Phân tích N tổng (Kjeldahl), COD' })
  const cHCl = chem({ code: 'HC-PTN-02', name: 'Axit clohydric HCl 37%', cas_no: '7647-01-0', formula: 'HCl', storage_location: 'Tủ axit phòng thí nghiệm', quantity: 5, unit: 'L', hazard_classes: ['an_mon', 'kich_ung'], legal_group: 'tien_chat', use_area: 'phong_thi_nghiem', min_stock: 2, sds_date: '2024-06-01' })
  const cK2 = chem({ code: 'HC-PTN-03', name: 'Kali dicromat K₂Cr₂O₇', cas_no: '7778-50-9', formula: 'K₂Cr₂O₇', storage_location: 'Tủ hóa chất độc có khóa', quantity: 0.5, hazard_classes: ['doc', 'doc_man', 'oxi_hoa', 'moi_truong'], legal_group: 'nguy_hiem', use_area: 'phong_thi_nghiem', sds_date: '2023-09-12', note: 'Dịch thải phân tích COD chứa Cr(VI), Hg, Ag – thu gom riêng như CTNH' })
  const cHg = chem({ code: 'HC-PTN-04', name: 'Thủy ngân(II) sunfat HgSO₄', cas_no: '7783-35-9', formula: 'HgSO₄', storage_location: 'Tủ hóa chất độc có khóa', quantity: 0.1, hazard_classes: ['doc', 'moi_truong'], legal_group: 'nguy_hiem', use_area: 'phong_thi_nghiem', sds_date: '2023-09-12' })
  const cAg = chem({ code: 'HC-PTN-05', name: 'Bạc sunfat Ag₂SO₄', cas_no: '10294-26-5', formula: 'Ag₂SO₄', storage_location: 'Tủ hóa chất độc có khóa', quantity: 0.25, hazard_classes: ['moi_truong'], legal_group: 'nguy_hiem', use_area: 'phong_thi_nghiem', sds_date: '2023-09-12' })
  const cStd = chem({ code: 'HC-PTN-06', name: 'Dung dịch chuẩn NaOH 0,1 N', storage_location: PTN, quantity: 4, unit: 'L', hazard_classes: ['an_mon'], legal_group: 'nguy_hiem', use_area: 'phong_thi_nghiem', expiry_date: d(20), sds_date: '2025-01-10' })
  const cC2H2 = chem({ code: 'HC-CD-01', name: 'Khí acetylene C₂H₂ (chai)', cas_no: '74-86-2', formula: 'C₂H₂', storage_location: 'Kho chai khí xưởng cơ khí', quantity: 4, unit: 'chai', hazard_classes: ['de_chay', 'ap_suat'], legal_group: 'nguy_hiem', use_area: 'co_dien', max_stock: 6, sds_date: '2024-03-01', note: 'Để riêng với chai oxy; xích chống đổ' })
  const cO2 = chem({ code: 'HC-CD-02', name: 'Khí oxy công nghiệp (chai)', cas_no: '7782-44-7', formula: 'O₂', storage_location: 'Kho chai khí xưởng cơ khí', quantity: 4, unit: 'chai', hazard_classes: ['oxi_hoa', 'ap_suat'], legal_group: 'nguy_hiem', use_area: 'co_dien', max_stock: 6, sds_date: '2024-03-01' })
  const cOil = chem({ code: 'HC-CD-03', name: 'Dầu thủy lực ISO VG 68', storage_location: 'Kho vật tư cơ điện', quantity: 200, unit: 'L', hazard_classes: [], legal_group: 'thong_thuong', use_area: 'co_dien', min_stock: 60, sds_date: '2022-11-20' })
  const cCoat = chem({ code: 'HC-SX-01', name: 'Dầu bọc hạt chống đóng cứng (minh họa)', storage_location: 'Kho nguyên liệu', quantity: 2000, hazard_classes: [], legal_group: 'thong_thuong', use_area: 'san_xuat', min_stock: 800, sds_date: '2025-02-01' })
  chemicals.push(cH2SO4, cHCl, cK2, cHg, cAg, cStd, cC2H2, cO2, cOil, cCoat)

  const SUP = 'Công ty kinh doanh hóa chất (minh họa)'
  const CONTROLLED = new Set(['co_dieu_kien', 'kiem_soat_dac_biet', 'tien_chat'])
  const tx = (ch: Row, n: number, kind: string, quantity: number, o: Row = {}): Row => ({ id: uuid(), ...base, chemical_id: ch.id, txn_date: d(n), kind, quantity, area: kind === 'xuat' ? ch.use_area : null, purpose: null, supplier: null, supplier_license: null, invoice_no: null, batch_no: null, person: null, note: null, created_by: null, ...o })
  const buy = (ch: Row, n: number, q: number, o: Row = {}): Row => tx(ch, n, 'nhap', q, { supplier: SUP, invoice_no: `HĐ (mẫu) ${String(1000 + Math.abs(n)).slice(-3)}`, supplier_license: CONTROLLED.has(ch.legal_group) ? 'GCN đủ điều kiện kinh doanh hóa chất (mẫu)' : null, person: 'Thủ kho', ...o })
  const pac = byName('PAC')
  const poly = byName('Polymer')
  const clo = byName('Calcium')
  const naoh = byName('NaOH')
  const chemical_transactions: Row[] = [
    buy(pac, -40, 500),
    buy(pac, -12, 500),
    buy(poly, -35, 25),
    buy(clo, -25, 50),
    tx(naoh, -50, 'xuat', 25, { purpose: 'Chỉnh pH bể điều hòa', person: 'Tổ vận hành HTXLNT' }),
    tx(naoh, -30, 'xuat', 25, { purpose: 'Chỉnh pH bể điều hòa', person: 'Tổ vận hành HTXLNT' }),
    tx(naoh, -10, 'xuat', 25, { purpose: 'Chỉnh pH bể điều hòa', person: 'Tổ vận hành HTXLNT' }),
    buy(cH2SO4, -45, 20),
    ...[-80, -60, -40, -20, -5].map((n) => tx(cH2SO4, n, 'xuat', 2.5, { purpose: 'Phân tích N tổng (Kjeldahl), COD', person: 'Kiểm nghiệm viên' })),
    buy(cHCl, -30, 10, { supplier_license: null }),
    ...[-70, -40, -15].map((n) => tx(cHCl, n, 'xuat', 1, { purpose: 'Phân tích P₂O₅, chuẩn độ', person: 'Kiểm nghiệm viên' })),
    ...[-75, -45, -15].map((n) => tx(cK2, n, 'xuat', 0.02, { purpose: 'Phân tích COD nước thải nội bộ', person: 'Kiểm nghiệm viên' })),
    ...[-75, -45, -15].map((n) => tx(cHg, n, 'xuat', 0.004, { purpose: 'Phân tích COD nước thải nội bộ', person: 'Kiểm nghiệm viên' })),
    ...[-75, -45, -15].map((n) => tx(cAg, n, 'xuat', 0.01, { purpose: 'Phân tích COD nước thải nội bộ', person: 'Kiểm nghiệm viên' })),
    tx(cK2, -16, 'thai_bo', 0.01, { purpose: 'Hóa chất hết hạn chuyển kho CTNH', person: 'Kiểm nghiệm viên' }),
    buy(cC2H2, -10, 4),
    tx(cC2H2, -6, 'xuat', 1, { purpose: 'Hàn cắt sửa chữa sàn thao tác', person: 'Thợ hàn' }),
    buy(cO2, -10, 2),
    tx(cO2, -6, 'xuat', 1, { purpose: 'Hàn cắt sửa chữa sàn thao tác', person: 'Thợ hàn' }),
    tx(cOil, -40, 'xuat', 20, { purpose: 'Thay dầu thủy lực xe nâng số 2', person: 'Tổ Cơ điện' }),
    tx(cOil, -22, 'xuat', 18, { purpose: 'Bổ sung dầu cầu trục', person: 'Tổ Cơ điện' }),
    buy(cCoat, -50, 3000),
    ...[-45, -30, -15, -3].map((n) => tx(cCoat, n, 'xuat', 900, { purpose: 'Bọc hạt NPK chống đóng cứng', person: 'Xưởng Tạo hạt 2' })),
    tx(cStd, -20, 'dieu_chinh', -0.5, { note: 'Kiểm kê: hao hụt do bay hơi, rơi vãi' }),
  ]

  // ---------- EPR bao bì ----------
  const FS = 8486
  const pk = (y: number, packaging: string, units: number, exp: number, w: number, extra: Row = {}): Row => ({ id: uuid(), ...base, year: y, packaging, material_group: 'Bao bì nhựa mềm – đơn vật liệu', units_domestic: units, units_export: exp, unit_weight_kg: w, recycling_rate: 10, fs_vnd_per_kg: FS, method: 'dong_quy', recycled_kg: null, declared_date: null, paid_date: null, paid_amount: null, note: MH, ...extra })
  const ep = (dataYear: number, scale: number, declared: boolean) => {
    const rows = [
      pk(dataYear, 'Bao PP dệt 50 kg tráng, lót PE', Math.round(5400000 * scale), Math.round(450000 * scale), 0.15),
      pk(dataYear, 'Bao PP dệt 25 kg', Math.round(600000 * scale), Math.round(40000 * scale), 0.09),
      pk(dataYear, 'Bao jumbo 1 tấn (PP dệt)', Math.round(3000 * scale), 0, 2.5),
    ]
    if (declared)
      for (const r of rows) {
        r.declared_date = `${dataYear + 1}-03-26`
        r.paid_date = `${dataYear + 1}-04-16`
        r.paid_amount = Math.round(r.units_domestic * r.unit_weight_kg * 0.1 * FS)
      }
    return rows
  }
  const ytd = Math.max(now.getMonth(), 1) / 12
  const packaging_records = [...ep(year - 2, 0.92, true), ...ep(year - 1, 1, true), ...ep(year, ytd, false).map((r) => ({ ...r, note: `Lũy kế ${Math.max(now.getMonth(), 1)} tháng – ${MH}` }))]

  // ---------- Dòng tuần hoàn ----------
  const flow = (y: number, month: number | null, stream: string, quantity: number, route: string, destination: string, unit = 't'): Row => ({ id: uuid(), ...base, year: y, month, stream, quantity, unit, route, destination, note: MH })
  const circular_flows: Row[] = [
    flow(year - 1, null, 'bui_hoi_luu', 2050, 'tai_su_dung_tai_cho', 'Hồi lưu về băng tải cấp liệu tạo hạt'),
    flow(year - 1, null, 'hat_ngoai_co', 2900, 'tai_su_dung_tai_cho', 'Nghiền, hồi lưu tạo hạt'),
    flow(year - 1, null, 'phe_pham', 420, 'tai_su_dung_tai_cho', 'Tái chế phối trộn lại'),
    flow(year - 1, null, 'bao_bi_tai_su_dung', 55, 'tai_su_dung_tai_cho', 'Bao jumbo, pallet dùng lại'),
    flow(year - 1, null, 'nuoc_tuan_hoan', 1650, 'tai_su_dung_tai_cho', 'Nước sau HTXLNT tưới cây, rửa đường nội bộ', 'm³'),
  ]
  for (let m = 1; m <= now.getMonth(); m++) {
    const k = 0.9 + ((m * 7) % 5) / 20
    circular_flows.push(
      flow(year, m, 'bui_hoi_luu', Math.round(180 * k), 'tai_su_dung_tai_cho', 'Hồi lưu về băng tải cấp liệu tạo hạt'),
      flow(year, m, 'hat_ngoai_co', Math.round(250 * k), 'tai_su_dung_tai_cho', 'Nghiền, hồi lưu tạo hạt'),
      flow(year, m, 'phe_pham', Math.round(38 * k), 'tai_su_dung_tai_cho', 'Tái chế phối trộn lại'),
      flow(year, m, 'nuoc_tuan_hoan', Math.round(150 * k), 'tai_su_dung_tai_cho', 'Nước sau HTXLNT tưới cây, rửa đường nội bộ', 'm³')
    )
  }

  // ---------- Kế hoạch HSE năm, lộ trình 5 năm, Net Zero ----------
  const today = d(0)
  const annual = planRows(base, 'nam', annualTemplates(year)).map((p) => {
    const t = p.title
    const doneByNow = p.due_date < today
    let patch: Row = doneByNow ? { status: 'hoan_thanh', progress: 100, actual_value: p.target_value } : { status: 'dang_thuc_hien', progress: 50 }
    if (t.startsWith('Huấn luyện ATVSLĐ định kỳ')) patch = { status: 'cham', progress: 85, actual_value: 92, note: '2 NLĐ chưa huấn luyện lại nhóm 4' }
    if (t.startsWith('Khám sức khỏe')) patch = { status: 'dang_thuc_hien', progress: 90, actual_value: 92, note: 'Còn NLĐ nghề NNĐHNH chưa khám đợt 06 tháng' }
    if (t.startsWith('Quan trắc khí thải')) patch = { status: 'dang_thuc_hien', progress: 75, actual_value: 3 }
    if (t.startsWith('Phân loại CTRSH')) patch = { status: 'dang_thuc_hien', progress: 90, actual_value: 92 }
    if (t.startsWith('Giảm suất tiêu hao điện')) patch = { status: 'dang_thuc_hien', progress: 60, actual_value: 1.8 }
    if (t.startsWith('Kiểm định máy')) patch = { status: 'dang_thuc_hien', progress: 86, actual_value: 86, note: '01 thiết bị quá hạn kiểm định' }
    if (t.startsWith('Huấn luyện an toàn hóa chất')) patch = { status: 'dang_thuc_hien', progress: 60 }
    if (t.startsWith('Thực tập phương án')) patch = { status: 'hoan_thanh', progress: 100, actual_value: 1 }
    return { id: uuid(), ...p, start_date: `${year}-01-01`, budget_mvnd: null, ...patch }
  })
  const five = planRows(base, '5_nam', FIVE_YEAR_TEMPLATES).map((p) => ({
    id: uuid(),
    ...p,
    ...(p.year < year ? { status: 'hoan_thanh', progress: 100 } : p.year === year ? (p.title.startsWith('Tái chứng nhận') ? { status: 'dang_thuc_hien', progress: 60 } : { status: 'hoan_thanh', progress: 100 }) : {}),
  }))
  const nz = planRows(base, 'net_zero', NET_ZERO_TEMPLATES).map((p) => ({
    id: uuid(),
    ...p,
    ...(p.year <= year ? { status: 'dang_thuc_hien', progress: 40 } : p.year === year + 1 ? { status: 'dang_thuc_hien', progress: 15 } : {}),
  }))
  const hse_plan_items = [...annual, ...five, ...nz]
  const roadmap_targets = roadmapTargetRows(base, year - 1, c.ghgBase).map((r) => ({ id: uuid(), ...r }))

  return {
    hse_roles,
    drills,
    drill_participants,
    equipment,
    equipment_inspections,
    equipment_work_orders,
    checklist_templates: allTemplates,
    checklist_runs: [...c.checklistRuns, ...runs],
    inspection_plans: plans,
    capa_actions: [...capaActions, ...capa],
    chemicals,
    chemical_transactions,
    packaging_records,
    circular_flows,
    hse_plan_items,
    roadmap_targets,
  }
}
