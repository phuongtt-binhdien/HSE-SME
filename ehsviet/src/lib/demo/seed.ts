// Dữ liệu dùng thử theo bối cảnh Nhà máy Phân bón Bình Điền – Long An.
// Thông tin công khai (GPMT 2986, nguồn thải, giới hạn) giữ đúng; nhân sự là tên giả định,
// số liệu vận hành, chất thải, năng lượng – KNK là SỐ LIỆU MINH HỌA, không phải số liệu chính thức.
// Ngày tháng tính tương đối theo ngày mở ứng dụng để các trạng thái hạn luôn có ý nghĩa.
import { addDays, addMonths, endOfMonth, format, parseISO, startOfMonth } from 'date-fns'
import { presetByKey, presetFactors } from '../ghg'
import { checklistRows, policyRows, ruleRows, targetRows } from '../templates'

export const DEMO_ORG_ID = '11111111-1111-1111-1111-111111111111'
export const DEMO_FACILITY_ID = '22222222-2222-2222-2222-222222222222'
export const DEMO_USER_ID = '33333333-3333-3333-3333-333333333333'

type Row = Record<string, any>
const MINH_HOA = 'Số liệu minh họa'

export function buildSeed(uuid: () => string): Record<string, Row[]> {
  const now = new Date()
  const year = now.getFullYear()
  const iso = (d: Date) => format(d, 'yyyy-MM-dd')
  const d = (offsetDays: number) => iso(addDays(now, offsetDays))
  /** ngày `day` của tháng cách hiện tại `monthOffset` tháng (âm = quá khứ) */
  const md = (monthOffset: number, day: number) => {
    const m = addMonths(startOfMonth(now), monthOffset)
    return iso(addDays(m, Math.min(day, Number(format(endOfMonth(m), 'd'))) - 1))
  }
  const base = { org_id: DEMO_ORG_ID, facility_id: DEMO_FACILITY_ID }
  const withIds = (rows: Row[]): Row[] => rows.map((r) => ({ id: uuid(), created_at: now.toISOString(), ...r }))

  // ---------- Tổ chức ----------
  const organizations = [{ id: DEMO_ORG_ID, name: 'Công ty CP Phân bón Bình Điền (Demo)', tax_code: null, plan: 'pro' }]
  const facilities = [
    {
      ...{ id: DEMO_FACILITY_ID, org_id: DEMO_ORG_ID },
      name: 'Nhà máy Phân bón Bình Điền – Long An',
      address: 'CCN Long Định – Long Cang, xã Long Cang, tỉnh Tây Ninh',
      gpmt_number: '2986/GPMT-STNMT',
      gpmt_issuer: 'Sở TN&MT Long An (nay: Sở NN&MT Tây Ninh)',
      gpmt_issued_date: '2023-04-28',
      gpmt_expiry: '2033-04-27',
    },
  ]
  const profiles = [
    {
      id: DEMO_USER_ID,
      org_id: DEMO_ORG_ID,
      facility_id: DEMO_FACILITY_ID,
      full_name: 'Cán bộ môi trường (dùng thử)',
      phone: null,
      role: 'admin',
    },
  ]

  // ---------- Chất thải ----------
  const wt = (code: string | null, name: string, category: string, state: string, loc: string) => ({
    id: uuid(),
    ...base,
    code,
    name,
    category,
    physical_state: state,
    unit: 'kg',
    storage_location: loc,
  })
  const wDau = wt('17 02 03', 'Dầu động cơ, hộp số, bôi trơn thải', 'CTNH', 'long', 'Kho CTNH 75 m²')
  const wGie = wt('18 02 01', 'Giẻ lau, vải bảo vệ nhiễm thành phần nguy hại', 'CTNH', 'ran', 'Kho CTNH 75 m²')
  const wDen = wt('16 01 06', 'Bóng đèn huỳnh quang thải', 'CTNH', 'ran', 'Kho CTNH 75 m²')
  const wBaoBiKL = wt('18 01 02', 'Bao bì cứng thải bằng kim loại', 'CTNH', 'ran', 'Kho CTNH 75 m²')
  const wMuc = wt('08 02 04', 'Hộp mực in thải', 'CTNH', 'ran', 'Kho CTNH 75 m²')
  const wBaoBi = wt(null, 'Bao bì hỏng, pallet, dây PE, chỉ may', 'CTRCNTT', 'ran', 'Khu CTRCN 216,5 m²')
  const wXi = wt(null, 'Xỉ than lò hơi, lò sấy', 'CTRCNTT', 'ran', 'Khu than – xỉ 51,25 m²')
  const wSH = wt(null, 'Chất thải rắn sinh hoạt', 'CTRSH', 'ran', 'Khu CTRSH 5 m²')
  const waste_types = [wDau, wGie, wDen, wBaoBiKL, wMuc, wBaoBi, wXi, wSH]

  const waste_logs: Row[] = []
  const monthly: [Row, number][] = [
    [wDau, 55],
    [wGie, 3],
    [wDen, 9],
    [wBaoBiKL, 24],
    [wMuc, 2],
    [wBaoBi, 15500],
    [wXi, 41000],
    [wSH, 7100],
  ]
  const firstMonth = -(now.getMonth() + 12) // tháng 1 năm trước
  for (let m = firstMonth; m <= -1; m++) {
    monthly.forEach(([t, q], i) => {
      const factor = 0.85 + ((((m + 24) * 7 + i * 3) % 10) + 10) % 10 / 33
      waste_logs.push({
        id: uuid(),
        ...base,
        waste_type_id: t.id,
        log_date: md(m, 25),
        quantity: Math.round(q * factor),
        source: t.category === 'CTNH' ? 'Tổ Cơ điện' : t === wXi ? 'Tổ Lò hơi' : 'Tổng hợp tháng',
        handler: 'Tổ VSCN',
        note: MINH_HOA,
      })
    })
  }

  const cCaoGiaQuy = { id: uuid(), org_id: DEMO_ORG_ID, name: 'Công ty TNHH Môi trường Cao Gia Quý', license_no: null, license_expiry: null, scope: 'Thu gom, vận chuyển, xử lý chất thải nguy hại', contact_person: null, phone: null }
  const cChanLy = { id: uuid(), org_id: DEMO_ORG_ID, name: 'Công ty TNHH Môi trường Chân Lý', license_no: null, license_expiry: null, scope: 'Thu gom, xử lý chất thải rắn công nghiệp thông thường', contact_person: null, phone: null }
  const waste_contractors = [cCaoGiaQuy, cChanLy]
  const tr1 = { id: uuid(), ...base, contractor_id: cCaoGiaQuy.id, transfer_date: md(-4, 12), manifest_no: 'Chứng từ minh họa', status: 'completed', note: MINH_HOA }
  const tr2 = { id: uuid(), ...base, contractor_id: cChanLy.id, transfer_date: md(-1, 18), manifest_no: null, status: 'signed', note: MINH_HOA }
  const tr0 = { id: uuid(), ...base, contractor_id: cCaoGiaQuy.id, transfer_date: `${year - 1}-11-14`, manifest_no: 'Chứng từ minh họa', status: 'completed', note: MINH_HOA }
  const waste_transfers = [tr0, tr1, tr2]
  const waste_transfer_items = [
    { id: uuid(), org_id: DEMO_ORG_ID, transfer_id: tr0.id, waste_type_id: wDau.id, quantity: 540 },
    { id: uuid(), org_id: DEMO_ORG_ID, transfer_id: tr0.id, waste_type_id: wGie.id, quantity: 30 },
    { id: uuid(), org_id: DEMO_ORG_ID, transfer_id: tr0.id, waste_type_id: wDen.id, quantity: 95 },
    { id: uuid(), org_id: DEMO_ORG_ID, transfer_id: tr0.id, waste_type_id: wBaoBiKL.id, quantity: 230 },
    { id: uuid(), org_id: DEMO_ORG_ID, transfer_id: tr0.id, waste_type_id: wMuc.id, quantity: 20 },
    { id: uuid(), org_id: DEMO_ORG_ID, transfer_id: tr1.id, waste_type_id: wDau.id, quantity: 260 },
    { id: uuid(), org_id: DEMO_ORG_ID, transfer_id: tr1.id, waste_type_id: wDen.id, quantity: 45 },
    { id: uuid(), org_id: DEMO_ORG_ID, transfer_id: tr1.id, waste_type_id: wBaoBiKL.id, quantity: 120 },
    { id: uuid(), org_id: DEMO_ORG_ID, transfer_id: tr2.id, waste_type_id: wBaoBi.id, quantity: 46000 },
  ]

  // ---------- Vận hành & quan trắc ----------
  const sysNT = { id: uuid(), ...base, name: 'HTXLNT tập trung', kind: 'nuoc_thai', capacity: '120 m³/ngày đêm', description: 'Hóa lý – tuyển nổi – keo tụ – thiếu khí – MBBR – hiếu khí – lọc áp lực – khử trùng; xả sông Vàm Cỏ Đông' }
  const treatment_systems = [
    sysNT,
    { id: uuid(), ...base, name: 'Lò hơi 8 t/h – dập bụi ướt + hấp thụ kiềm (dòng 01)', kind: 'khi_thai', capacity: '25.000 m³/h', description: 'Ống khói 18 m' },
    { id: uuid(), ...base, name: 'Tạo hạt 1 – cyclone + lọc túi (dòng 02, 03)', kind: 'khi_thai', capacity: '2 × 55.000 m³/h', description: 'Ống khói 22 m' },
    { id: uuid(), ...base, name: 'Tạo hạt 2 – cyclone + lọc túi (dòng 04, 05)', kind: 'khi_thai', capacity: '2 × 55.000 m³/h', description: 'Ống khói 22 m' },
    { id: uuid(), ...base, name: 'Tạo hạt 3 – cyclone + lọc túi (dòng 06)', kind: 'khi_thai', capacity: '140.000 m³/h', description: 'Ống khói 22 m; quan trắc tự động lắp tự nguyện' },
    { id: uuid(), ...base, name: 'Trộn hữu cơ – lọc túi (dòng 07)', kind: 'khi_thai', capacity: '10.000 m³/h', description: null },
  ]
  const pt = (name: string, kind: string, position: string) => ({ id: uuid(), ...base, name, kind, position })
  const pNT = pt('NT-01 Nước thải sau HTXLNT', 'nuoc_thai', 'Điểm xả ra sông Vàm Cỏ Đông')
  const p01 = pt('Dòng 01 – Ống khói lò hơi', 'khi_thai', 'H = 18 m')
  const p02 = pt('Dòng 02 – Tạo hạt 1 sấy nóng', 'khi_thai', 'H = 22 m')
  const p06 = pt('Dòng 06 – Tạo hạt 3', 'khi_thai', 'H = 22 m')
  const monitoring_points = [pNT, p01, p02, pt('Dòng 03 – Tạo hạt 1 sấy nguội', 'khi_thai', 'H = 22 m'), pt('Dòng 04 – Tạo hạt 2 sấy nóng', 'khi_thai', 'H = 22 m'), pt('Dòng 05 – Tạo hạt 2 sấy nguội', 'khi_thai', 'H = 22 m'), p06, pt('Dòng 07 – Trộn hữu cơ', 'khi_thai', 'H = 1,2 m')]

  const regKT = 'GPMT 2986 – QCVN 19, 21:2009 cột B, Kp 0,8'
  const regNT = 'GPMT 2986 – QCVN 40:2011 cột A, Kq 1,2, Kf 1,1'
  const res = (point: Row, date: string, parameter: string, unit: string, value: number, threshold: number | null, regulation: string, thresholdMin: number | null = null) => ({
    id: uuid(),
    ...base,
    point_id: point.id,
    sample_date: date,
    parameter,
    unit,
    value,
    threshold,
    threshold_min: thresholdMin,
    regulation,
    is_exceeded: (threshold != null && value > threshold) || (thresholdMin != null && value < thresholdMin),
    lab: 'Kết quả minh họa',
    report_no: null,
  })
  const monitoring_results: Row[] = []
  for (const [q, date] of [[-6, md(-6, 20)], [-3, md(-3, 18)]] as [number, string][]) {
    const k = q === -6 ? 1 : 0.9
    monitoring_results.push(
      res(p01, date, 'Bụi tổng', 'mg/Nm³', Math.round(28 * k), 160, regKT),
      res(p01, date, 'SO₂', 'mg/Nm³', Math.round(58 * k), 400, regKT),
      res(p01, date, 'NOₓ (tính theo NO₂)', 'mg/Nm³', Math.round(95 * k), 680, regKT),
      res(p01, date, 'CO', 'mg/Nm³', Math.round(84 * k), 800, regKT),
      res(p02, date, 'Bụi tổng', 'mg/Nm³', Math.round(31 * k), 160, regKT),
      res(p02, date, 'NH₃', 'mg/Nm³', Number((4.2 * k).toFixed(1)), 40, regKT),
      res(p06, date, 'Bụi tổng', 'mg/Nm³', Math.round(36 * k), 160, regKT),
      res(p06, date, 'NH₃', 'mg/Nm³', Number((6.5 * k).toFixed(1)), 40, regKT),
      res(pNT, date, 'pH', '—', 7.3, 9, regNT, 6),
      res(pNT, date, 'BOD₅ (20°C)', 'mg/L', Math.round(18 * k), 39.6, regNT),
      res(pNT, date, 'COD', 'mg/L', Math.round(42 * k), 99, regNT),
      res(pNT, date, 'TSS', 'mg/L', Math.round(21 * k), 66, regNT),
      res(pNT, date, 'Amoni (tính theo N)', 'mg/L', Number((2.4 * k).toFixed(1)), 6.6, regNT),
      res(pNT, date, 'Tổng Nitơ', 'mg/L', Number((9.5 * k).toFixed(1)), 26.4, regNT),
      res(pNT, date, 'Tổng Phốt pho', 'mg/L', Number((1.6 * k).toFixed(1)), 5.28, regNT),
      res(pNT, date, 'Clo dư', 'mg/L', 0.4, 1.32, regNT),
      res(pNT, date, 'Coliform', 'MPN/100mL', 930, 3000, regNT)
    )
  }

  const operation_logs: Row[] = []
  for (let i = 60; i >= 1; i--) {
    const flow = 44 + ((i * 7) % 11)
    operation_logs.push({
      id: uuid(),
      ...base,
      system_id: sysNT.id,
      log_date: d(-i),
      shift: 'Ca 1',
      influent_flow: flow,
      ph: Number((7 + ((i * 3) % 6) / 10).toFixed(1)),
      chemical_usage: { PAC: Math.round(flow * 0.26), Polymer: Number((flow * 0.016).toFixed(1)), Chlorine: Number((flow * 0.026).toFixed(1)) },
      equipment_status: 'Bình thường',
      issues: i === 23 ? 'Bơm định lượng Chlorine lưu lượng thấp' : null,
      actions: i === 23 ? 'Vệ sinh van bi, thay màng bơm' : null,
      operator_name: 'Tổ vận hành HTXLNT',
    })
  }

  const alerts = [
    { id: uuid(), ...base, source: 'thiet_bi', message: 'Chênh áp lọc túi Tạo hạt 2 sấy nóng 270 mmH₂O (> 260) – kiểm tra, thay túi lọc', level: 'warning', status: 'open', related_id: null, created_at: d(-1) + 'T08:30:00.000Z' },
  ]

  // ---------- PCCC & an toàn ----------
  const tplPCCC = {
    id: uuid(),
    ...base,
    name: 'Kiểm tra thiết bị PCCC hằng tháng',
    category: 'PCCC',
    frequency: 'monthly',
    items: [
      'Bình chữa cháy đủ số lượng, đúng vị trí, còn hạn kiểm định',
      'Kim đồng hồ áp suất bình bột ở vạch xanh; thẻ kiểm tra cập nhật',
      'Tủ chữa cháy vách tường đủ lăng, vòi, không rò rỉ',
      'Máy bơm chữa cháy (trạm bờ sông, trạm kho bao bì) chạy thử đạt',
      'Hệ thống báo cháy tự động hoạt động bình thường',
      'Đèn exit, đèn chiếu sáng sự cố hoạt động',
      'Lối thoát nạn thông thoáng, không bị che chắn',
      'Nội quy, tiêu lệnh PCCC đầy đủ, rõ ràng',
    ].map((label) => ({ label })),
  }
  const templates = checklistRows(base).map((t) => ({ id: uuid(), ...t }))
  const tplVSCN = templates[0]
  const checklist_templates = [tplPCCC, ...templates]

  const runResults = (tpl: Row, fails: Record<number, string>) =>
    tpl.items.map((it: Row, i: number) => ({ label: it.label, hint: it.hint, status: fails[i] ? 'khong_dat' : 'dat', note: fails[i] ?? '' }))
  const vscnFails = { 2: 'Sàn thao tác TH1 đóng bụi dày – Xưởng Tạo hạt 1', 7: 'Điểm thùng rác kho thành phẩm lẫn giẻ lau dính dầu' }
  const vscnRes = runResults(tplVSCN, vscnFails)
  const checklist_runs = [
    { id: uuid(), ...base, template_id: tplVSCN.id, run_date: md(-1, 26), inspector: 'Hội đồng ATVSLĐ cơ sở', results: vscnRes, score: Math.round(((vscnRes.length - 2) / vscnRes.length) * 100), note: 'Lập biên bản MT-QT03-BM02, chuyển đơn vị khắc phục' },
    { id: uuid(), ...base, template_id: tplPCCC.id, run_date: md(0, 3), inspector: 'Đội PCCC cơ sở', results: runResults(tplPCCC, {}), score: 100, note: null },
  ]

  const fire_equipment = [
    { id: uuid(), ...base, name: 'Bình bột chữa cháy', type: 'binh_bot', location: 'Các xưởng, kho, văn phòng', quantity: 42, last_inspection: d(-24), next_inspection: d(6), status: 'tot', note: 'Kiểm tra thẻ hằng tháng (MT-HD01)' },
    { id: uuid(), ...base, name: 'Bình CO₂ chữa cháy', type: 'binh_co2', location: 'Phòng điện, tủ điện, phòng máy', quantity: 48, last_inspection: d(-24), next_inspection: d(6), status: 'tot', note: null },
    { id: uuid(), ...base, name: 'Tủ chữa cháy vách tường', type: 'hong_nuoc', location: 'Nhà xưởng, kho', quantity: 76, last_inspection: md(-2, 10), next_inspection: d(12), status: 'tot', note: null },
    { id: uuid(), ...base, name: 'Trạm bơm chữa cháy bờ sông', type: 'may_bom', location: 'Bờ sông Vàm Cỏ Đông', quantity: 1, last_inspection: md(-1, 15), next_inspection: d(-3), status: 'can_bao_tri', note: 'Bơm bù áp rò rỉ phớt' },
    { id: uuid(), ...base, name: 'Trạm bơm chữa cháy kho bao bì', type: 'may_bom', location: 'Kho bao bì', quantity: 1, last_inspection: md(-1, 15), next_inspection: d(20), status: 'tot', note: null },
  ]
  const drills = [
    { id: uuid(), ...base, drill_date: md(-4, 22), kind: 'PCCC', scenario: 'Cháy kho bao bì, cứu người bị nạn tại sàn thao tác TH2', participants: 85, organizer: 'Đội PCCC cơ sở phối hợp Công an PCCC', evaluation: 'Đạt; thời gian triển khai lăng vòi 4 phút' },
    { id: uuid(), ...base, drill_date: md(-6, 12), kind: 'su_co_hoa_chat', scenario: 'Tràn NaOH tại nhà hóa chất HTXLNT', participants: 24, organizer: 'Phòng Kỹ thuật Sản xuất', evaluation: 'Bổ sung bộ ứng phó tràn đổ tại nhà hóa chất' },
  ]
  const contractor_permits = [
    { id: uuid(), ...base, contractor_name: 'Đơn vị thi công sàn thao tác ống khói (minh họa)', work_description: 'Làm việc trên cao, hàn cắt tại ống khói tạo hạt', start_date: d(-5), end_date: d(20), commitment_signed: true, safety_briefing: true, note: null },
    { id: uuid(), ...base, contractor_name: 'Đơn vị bảo trì máy nén khí (minh họa)', work_description: 'Bảo trì máy nén khí trạm số 2', start_date: d(2), end_date: d(6), commitment_signed: true, safety_briefing: false, note: 'Chưa huấn luyện an toàn đầu vào' },
  ]
  const inc1 = { id: uuid(), ...base, incident_date: md(-2, 9), kind: 'moi_truong', severity: 'nhe', title: 'Rò rỉ dầu thủy lực xe nâng tại khu xuất hàng', description: 'Khoảng 3 lít dầu rò rỉ xuống nền bê tông', immediate_action: 'Dùng vật liệu thấm hút, thu gom vào thùng CTNH', root_cause: 'Ống dầu thủy lực lão hóa', status: 'closed', reporter: 'Tổ Cơ điện' }
  const inc2 = { id: uuid(), ...base, incident_date: md(-1, 14), kind: 'tai_nan_ld', severity: 'nhe', title: 'Công nhân bị bỏng nhẹ khi vệ sinh lò sấy', description: 'Bỏng nhẹ cẳng tay, sơ cứu tại chỗ', immediate_action: 'Sơ cứu, đưa đến phòng y tế', root_cause: 'Chưa chờ lò nguội đủ thời gian; găng tay không phù hợp', status: 'investigating', reporter: 'Xưởng Tạo hạt 2' }
  const incidents = [inc1, inc2]
  const capa_actions = [
    { id: uuid(), org_id: DEMO_ORG_ID, incident_id: inc1.id, action: 'Lập kế hoạch thay ống thủy lực định kỳ cho xe nâng', owner: 'Tổ Cơ điện', due_date: md(-1, 30), status: 'done', completed_date: md(-1, 28) },
    { id: uuid(), org_id: DEMO_ORG_ID, incident_id: inc2.id, action: 'Bổ sung bước chờ nguội vào hướng dẫn vệ sinh lò sấy; cấp găng chịu nhiệt', owner: 'Xưởng Tạo hạt 2', due_date: d(10), status: 'in_progress', completed_date: null },
  ]
  const chemicals = [
    { id: uuid(), ...base, name: 'NaOH (xút vảy)', cas_no: '1310-73-2', supplier: null, storage_location: 'Nhà hóa chất HTXLNT', quantity: 150, unit: 'kg', pathh_available: true, pathh_url: null, note: null },
    { id: uuid(), ...base, name: 'PAC (Poly Aluminium Chloride)', cas_no: '1327-41-9', supplier: null, storage_location: 'Nhà hóa chất HTXLNT', quantity: 200, unit: 'kg', pathh_available: true, pathh_url: null, note: null },
    { id: uuid(), ...base, name: 'Polymer anion', cas_no: null, supplier: null, storage_location: 'Nhà hóa chất HTXLNT', quantity: 25, unit: 'kg', pathh_available: true, pathh_url: null, note: null },
    { id: uuid(), ...base, name: 'Calcium hypochlorite 70% (Chlorine)', cas_no: '7778-54-3', supplier: null, storage_location: 'Nhà hóa chất HTXLNT', quantity: 45, unit: 'kg', pathh_available: true, pathh_url: null, note: 'Bơm định lượng chạy luân phiên' },
    { id: uuid(), ...base, name: 'Zeolite', cas_no: null, supplier: null, storage_location: 'Nhà hóa chất HTXLNT', quantity: 300, unit: 'kg', pathh_available: false, pathh_url: null, note: 'Bổ sung phiếu an toàn hóa chất' },
  ]

  // ---------- Hồ sơ & tuân thủ ----------
  const legal_documents = [
    { id: uuid(), ...base, doc_no: '2986/GPMT-STNMT', title: 'Giấy phép môi trường', category: 'GPMT', issuer: 'Sở TN&MT Long An (nay: Sở NN&MT Tây Ninh)', issued_date: '2023-04-28', expiry_date: '2033-04-27', file_url: null, note: 'Công suất 600.000 tấn/năm' },
    { id: uuid(), ...base, doc_no: '3383/QĐ-STNMT', title: 'Quyết định phê duyệt báo cáo ĐTM', category: 'giay_phep', issuer: 'Sở TN&MT Long An', issued_date: '2020-10-15', expiry_date: null, file_url: null, note: null },
    { id: uuid(), ...base, doc_no: null, title: 'Chứng nhận ISO 14001:2015', category: 'giay_phep', issuer: 'Tổ chức chứng nhận', issued_date: null, expiry_date: '2026-12-24', file_url: null, note: 'Đánh giá tái chứng nhận trước ngày hết hạn' },
    { id: uuid(), ...base, doc_no: null, title: 'Hợp đồng thu gom, xử lý CTNH', category: 'hop_dong', issuer: 'Công ty TNHH Môi trường Cao Gia Quý', issued_date: null, expiry_date: `${year}-12-31`, file_url: null, note: null },
  ]
  const task = (title: string, description: string, category: string, due: string, recurrence: string, remind: number) => ({
    id: uuid(),
    ...base,
    title,
    description,
    category,
    due_date: due,
    recurrence,
    remind_days: remind,
    assigned_to: 'Phòng Kỹ thuật Sản xuất',
    status: 'pending',
    completed_date: null,
  })
  const qEnd = md(2 - (now.getMonth() % 3), 31)
  // phí BVMT: hạn ngày 20 tháng đầu quý sau → hạn gần nhất chưa qua
  const feeThisQuarter = md(-(now.getMonth() % 3), 20)
  const feeDue = feeThisQuarter >= d(0) ? feeThisQuarter : md(3 - (now.getMonth() % 3), 20)
  const compliance_tasks = [
    task('Báo cáo công tác bảo vệ môi trường năm', 'Nộp trước 15/01 năm sau: Sở NN&MT Tây Ninh, Tập đoàn Hóa chất Việt Nam.', 'bao_cao', `${year + 1}-01-15`, 'yearly', 30),
    task('Quan trắc khí thải định kỳ quý (dòng 01–07)', 'GPMT 2986: 03 tháng/lần, đủ thông số từng dòng; dừng lấy mẫu phải có lệnh dừng máy.', 'quan_trac', qEnd, 'quarterly', 14),
    task('Kê khai, nộp phí BVMT đối với khí thải', 'NĐ 153/2024/NĐ-CP – hạn ngày 20 tháng đầu quý sau.', 'phi_le_phi', feeDue, 'quarterly', 10),
    task('Kê khai, nộp phí BVMT đối với nước thải', 'NĐ 346/2025/NĐ-CP – hạn ngày 20 tháng đầu quý sau.', 'phi_le_phi', feeDue, 'quarterly', 10),
    task('Báo cáo kiểm kê KNK cấp cơ sở (2 năm/lần)', 'NĐ 06/2022/NĐ-CP sửa đổi bởi NĐ 119/2025/NĐ-CP – gửi UBND tỉnh trước 31/3.', 'bao_cao', `${year + 1}-03-31`, 'none', 60),
    task('Kê khai trách nhiệm tái chế (EPR) bao bì', 'Kê khai trước 31/3, nộp đóng góp Quỹ BVMT Việt Nam theo quy định.', 'bao_cao', `${year + 1}-03-31`, 'yearly', 45),
    task('Tái chứng nhận ISO 14001:2015', 'Soát xét tài liệu, đánh giá nội bộ, xem xét lãnh đạo trước ngày hết hạn chứng chỉ.', 'giay_phep', '2026-12-24' >= d(0) ? '2026-12-24' : `${year + 1}-12-24`, 'none', 60),
    task('Tổng hợp số liệu CTNH, CTRCN, CTRSH tháng', 'Sổ giao nhận, chứng từ chuyển giao, phục vụ báo cáo và chỉ số GRI 306.', 'bao_cao', md(1, 5), 'monthly', 5),
    task('Huấn luyện ATVSLĐ định kỳ – nhóm 4', 'NĐ 44/2016/NĐ-CP: nhóm 4 định kỳ hằng năm. Theo dõi tại Nhân sự & Huấn luyện.', 'dao_tao', d(-6), 'yearly', 30),
  ]

  // ---------- Nhân sự & huấn luyện ----------
  const people: [string, string, string, string, number, string][] = [
    ['NV001', 'Nguyễn Văn An', 'nam', 'Ban Điều hành Nhà máy', 1, 'Giám đốc nhà máy'],
    ['NV002', 'Trần Thị Bích', 'nu', 'Phòng Kỹ thuật Sản xuất', 2, 'Cán bộ môi trường'],
    ['NV003', 'Lê Hoàng Cường', 'nam', 'Phòng Kỹ thuật Sản xuất', 2, 'Cán bộ an toàn'],
    ['NV004', 'Phạm Minh Dũng', 'nam', 'Xưởng Tạo hạt 1', 1, 'Quản đốc'],
    ['NV005', 'Võ Thanh Hải', 'nam', 'Xưởng Tạo hạt 1', 4, 'Công nhân vận hành'],
    ['NV006', 'Đặng Văn Khoa', 'nam', 'Xưởng Tạo hạt 1', 3, 'Vận hành lò sấy'],
    ['NV007', 'Bùi Quốc Lâm', 'nam', 'Xưởng Tạo hạt 2', 4, 'Công nhân vận hành'],
    ['NV008', 'Huỳnh Văn Minh', 'nam', 'Xưởng Tạo hạt 2', 3, 'Vận hành lò sấy'],
    ['NV009', 'Ngô Thị Ngọc', 'nu', 'Xưởng Tạo hạt 2', 6, 'An toàn vệ sinh viên'],
    ['NV010', 'Dương Văn Phúc', 'nam', 'Xưởng Tạo hạt 3', 4, 'Công nhân vận hành'],
    ['NV011', 'Lý Minh Quang', 'nam', 'Xưởng Tạo hạt 3', 4, 'Công nhân vận hành'],
    ['NV012', 'Mai Văn Sơn', 'nam', 'Xưởng Trộn', 4, 'Công nhân phối trộn'],
    ['NV013', 'Trịnh Thị Thu', 'nu', 'Xưởng Trộn', 4, 'Công nhân đóng bao'],
    ['NV014', 'Hồ Văn Tài', 'nam', 'Tổ Lò hơi', 3, 'Vận hành nồi hơi'],
    ['NV015', 'Châu Văn Tuấn', 'nam', 'Tổ Lò hơi', 3, 'Vận hành nồi hơi'],
    ['NV016', 'Tạ Quang Vinh', 'nam', 'Tổ Cơ điện', 3, 'Thợ điện'],
    ['NV017', 'Phan Văn Xuân', 'nam', 'Tổ Cơ điện', 3, 'Thợ hàn'],
    ['NV018', 'Lâm Văn Yên', 'nam', 'Kho nguyên liệu – thành phẩm', 3, 'Lái xe nâng'],
    ['NV019', 'Đỗ Thị Hạnh', 'nu', 'Kho nguyên liệu – thành phẩm', 4, 'Thủ kho'],
    ['NV020', 'Kiều Văn Lực', 'nam', 'Tổ vận hành HTXLNT', 4, 'Vận hành HTXLNT'],
    ['NV021', 'Tôn Thị Mai', 'nu', 'Phòng thí nghiệm (KCS)', 4, 'Kiểm nghiệm viên'],
    ['NV022', 'Vương Văn Nam', 'nam', 'Tổ Bảo vệ', 4, 'Bảo vệ'],
    ['NV023', 'Quách Thị Oanh', 'nu', 'Nhà ăn', 4, 'Cấp dưỡng'],
    ['NV024', 'La Văn Phong', 'nam', 'Cầu cảng', 3, 'Vận hành cẩu bờ'],
    ['NV025', 'Từ Văn Quý', 'nam', 'Xưởng Tạo hạt 3', 4, 'Công nhân vận hành'],
    ['NV026', 'Hà Văn Sang', 'nam', 'Xưởng Trộn', 4, 'Công nhân phối trộn'],
  ]
  const employees = people.map(([code, full_name, gender, department, group, position], i) => ({
    id: uuid(),
    ...base,
    code,
    full_name,
    gender,
    department,
    position,
    atvsld_group: group,
    hire_date: code === 'NV025' ? d(-20) : iso(addMonths(now, -(14 + ((i * 11) % 90)))),
    status: code === 'NV026' ? 'inactive' : 'active',
    note: code === 'NV025' ? 'Người lao động mới – huấn luyện trước khi bố trí công việc' : null,
  }))
  const emp = (code: string) => employees.find((e) => e.code === code)!

  const course = (category: string, name: string, start: string, decision_no: string | null, hours: number, provider: string, validity: number | null = null) => ({
    id: uuid(),
    ...base,
    category,
    name,
    start_date: start,
    end_date: null,
    decision_no,
    decision_date: decision_no ? iso(addDays(parseISO(start), 7)) : null,
    provider,
    hours,
    validity_months: validity,
    note: 'Dữ liệu minh họa',
  })
  const prov = 'Đơn vị huấn luyện ATVSLĐ (minh họa)'
  const cAt4New = course('atvsld', 'Huấn luyện ATVSLĐ định kỳ – nhóm 4', d(-35), '01/QĐ-HL (mẫu)', 8, prov)
  const cAt4Old = course('atvsld', 'Huấn luyện ATVSLĐ định kỳ – nhóm 4 (năm trước)', d(-395), '05/QĐ-HL (mẫu)', 8, prov)
  const cAt12 = course('atvsld', 'Huấn luyện ATVSLĐ – nhóm 1, 2, 6', d(-250), '02/QĐ-HL (mẫu)', 16, prov)
  const cAt3 = course('atvsld', 'Huấn luyện ATVSLĐ – nhóm 3 (thẻ an toàn)', d(-712), '07/QĐ-HL (mẫu)', 24, prov)
  const cAt3New = course('atvsld', 'Huấn luyện ATVSLĐ – nhóm 3 (cấp lại thẻ an toàn)', d(-90), '03/QĐ-HL (mẫu)', 12, prov)
  const cPc = course('pccc', 'Bồi dưỡng nghiệp vụ PCCC & CNCH hằng năm', d(-140), '04/QĐ-PCCC (mẫu)', 16, 'Đội PCCC cơ sở phối hợp Công an PCCC')
  const cPcOld = course('pccc', 'Bồi dưỡng nghiệp vụ PCCC & CNCH (năm trước)', d(-380), '09/QĐ-PCCC (mẫu)', 16, 'Đội PCCC cơ sở phối hợp Công an PCCC')
  const cSc = course('su_co_chat_thai', 'Ứng phó sự cố chất thải: tràn đổ hóa chất, dầu, sự cố HTXLNT', d(-170), '06/QĐ-MT (mẫu)', 4, 'Phòng Kỹ thuật Sản xuất')
  const cScOld = course('su_co_chat_thai', 'Ứng phó sự cố chất thải (năm trước)', d(-352), '11/QĐ-MT (mẫu)', 4, 'Phòng Kỹ thuật Sản xuất')
  const cHc = course('hoa_chat', 'Huấn luyện an toàn hóa chất', d(-120), '08/QĐ-HL (mẫu)', 8, prov)
  const cSoCuu = course('so_cap_cuu', 'Sơ cứu, cấp cứu tại nơi làm việc', d(-200), null, 8, 'Trạm y tế (minh họa)')
  const cIso = course('khac', 'Nhận thức ISO 14001 và phân loại chất thải tại nguồn', d(-60), null, 2, 'Phòng Kỹ thuật Sản xuất')
  const training_courses = [cAt4New, cAt4Old, cAt12, cAt3, cAt3New, cPc, cPcOld, cSc, cScOld, cHc, cSoCuu, cIso]

  const training_records: Row[] = []
  const rec = (c: Row, codes: string[], extra: Row = {}) => {
    for (const code of codes)
      training_records.push({ id: uuid(), ...base, employee_id: emp(code).id, course_id: c.id, result: 'dat', certificate_no: null, expiry_date: null, note: null, ...extra })
  }
  const group4 = employees.filter((e) => e.atvsld_group === 4 && !['NV025', 'NV026'].includes(e.code)).map((e) => e.code)
  rec(cAt4Old, group4)
  rec(cAt4New, group4.filter((c) => !['NV013', 'NV022'].includes(c)))
  rec(cAt12, ['NV001', 'NV002', 'NV003', 'NV004', 'NV009'])
  rec(cAt3, ['NV006', 'NV008', 'NV014', 'NV015', 'NV016', 'NV017', 'NV018', 'NV024'])
  rec(cAt3New, ['NV006', 'NV014', 'NV016', 'NV017', 'NV018'])
  const all = employees.filter((e) => !['NV025', 'NV026'].includes(e.code)).map((e) => e.code)
  rec(cPcOld, all)
  rec(cPc, all.filter((c) => !['NV012', 'NV019', 'NV023', 'NV011'].includes(c)))
  rec(cScOld, all)
  rec(
    cSc,
    all.filter((c) => !['NV022', 'NV023', 'NV013', 'NV001', 'NV012', 'NV019'].includes(c))
  )
  rec(cHc, ['NV002', 'NV020', 'NV021', 'NV014', 'NV015'])
  rec(cSoCuu, ['NV003', 'NV009', 'NV019', 'NV023'])
  rec(cIso, all.filter((c) => c !== 'NV022'))
  // một học viên không đạt
  training_records.push({ id: uuid(), ...base, employee_id: emp('NV023').id, course_id: cSc.id, result: 'khong_dat', certificate_no: null, expiry_date: null, note: 'Kiểm tra lại' })

  // ---------- ESG ----------
  const esg_policies = withIds(policyRows(base)).map((p) =>
    p.title.startsWith('Chính sách môi trường') ? { ...p, status: 'active', review_date: d(80) } : p
  )
  const esg_targets = withIds(targetRows(base))
  const metric = (y: number, code: string, value: number, unit: string, note: string | null = null) => ({
    id: uuid(),
    ...base,
    year: y,
    code,
    value,
    text_value: null,
    unit,
    source: MINH_HOA,
    note,
  })
  const ytdMonths = now.getMonth() // số tháng đã kết thúc trong năm
  const esg_metrics = [
    metric(year - 2, 'production_t', 400000, 't'),
    metric(year - 1, 'production_t', 440000, 't'),
    metric(year, 'production_t', Math.round(37000 * Math.max(ytdMonths, 1)), 't', `Lũy kế ${Math.max(ytdMonths, 1)} tháng`),
    metric(year - 1, 'GRI 303-3', 78000, 'm³'),
    metric(year - 1, 'GRI 2-27', 0, 'vụ', 'Không bị xử phạt vi phạm hành chính về môi trường'),
    metric(year - 1, 'GRI 303-4', 17500, 'm³', 'Theo nhật ký vận hành HTXLNT'),
  ]

  const activity = (y: number, month: number | null, key: string, value: number, note = MINH_HOA) => {
    const p = presetByKey(key)!
    const f = presetFactors(p, y)
    return {
      id: uuid(),
      ...base,
      year: y,
      month,
      scope: p.scope,
      source_key: key,
      source_name: p.label,
      scope3_category: null,
      activity_value: value,
      activity_unit: p.unit,
      ef_value: Number(f.ef.toFixed(4)),
      ef_source: p.key === 'dien_luoi' ? `EF lưới ${f.ef} kgCO₂/kWh` : p.efSource,
      biogenic_co2_t: f.biogenicKg ? Number(((value * f.biogenicKg) / 1000).toFixed(3)) : null,
      energy_gj: f.gj ? Number((value * f.gj).toFixed(2)) : null,
      toe: f.toe ? Number((value * f.toe).toFixed(3)) : null,
      note,
      created_by: null,
    }
  }
  const ghg_activities: Row[] = []
  const annual: [number, Record<string, number>][] = [
    [year - 2, { than_lo_hoi: 4300, do_xe_nang: 95000, do_duong_bo: 12500, xang: 4200, r32: 9, co2_binh: 11, dien_luoi: 9300000 }],
    [year - 1, { than_lo_hoi: 4450, do_xe_nang: 100000, do_duong_bo: 13000, xang: 3900, r32: 9, co2_binh: 10, dien_luoi: 9750000 }],
  ]
  for (const [y, values] of annual) for (const [key, v] of Object.entries(values)) ghg_activities.push(activity(y, null, key, v))
  for (let m = 1; m <= ytdMonths; m++) {
    const k = 0.92 + ((m * 5) % 9) / 50
    ghg_activities.push(
      activity(year, m, 'than_lo_hoi', Math.round(345 * k)),
      activity(year, m, 'sinh_khoi', Math.round(72 * k)),
      activity(year, m, 'dien_luoi', Math.round(815000 * k)),
      activity(year, m, 'do_xe_nang', Math.round(8600 * k)),
      activity(year, m, 'do_duong_bo', Math.round(1080 * k)),
      activity(year, m, 'xang', Math.round(320 * k))
    )
  }

  // ---------- Nội quy & vi phạm ----------
  const internal_rules = withIds(ruleRows(base))
  const ruleBy = (prefix: string) => internal_rules.find((r) => r.title.startsWith(prefix))?.id ?? null
  const rTTMT = ruleBy('Quy định tuân thủ môi trường')
  const rVSCN = ruleBy('Quy định môi trường – vệ sinh')
  const rCTNH = ruleBy('Nội quy kho chất thải')
  const rNT = ruleBy('Kiểm soát nhà thầu')
  const rKT = ruleBy('Kiểm soát khí thải')
  const v = (o: Row) => ({
    id: uuid(),
    ...base,
    rule_id: null,
    category: 'moi_truong',
    kind: 'hanh_vi',
    subject_type: 'don_vi',
    department: null,
    employee_id: null,
    person_name: null,
    contractor_name: null,
    location: null,
    record_no: null,
    evidence_url: null,
    severity: 'nhe',
    community_impact: false,
    counts_for_unit: true,
    measure: null,
    corrective_action: null,
    responsible: null,
    due_date: null,
    status: 'closed',
    closed_date: null,
    created_by: null,
    ...o,
  })
  const rule_violations: Row[] = [
    v({ violation_date: md(0, 2), rule_id: rVSCN, category: 'vscn', kind: 'khu_vuc', department: 'Xưởng Tạo hạt 1', location: 'Sàn thao tác lò sấy TH1', description: 'Sàn thao tác đóng bụi dày, chưa vệ sinh sau ca', record_no: 'BB-01 (mẫu)', measure: 'khac_phuc', corrective_action: 'Vệ sinh sàn, bổ sung lịch vệ sinh cuối ca', responsible: 'Quản đốc TH1', due_date: d(3), status: 'fixing' }),
    v({ violation_date: md(0, 3), rule_id: rTTMT, category: 'moi_truong', kind: 'diem_thu_gom', department: 'Kho nguyên liệu – thành phẩm', location: 'Điểm thùng rác kho thành phẩm', description: 'Giẻ lau dính dầu bỏ lẫn vào thùng CTRSH', measure: 'giai_trinh', corrective_action: 'Thu gom về kho CTNH; nhắc nhở, đào tạo lại', responsible: 'Thủ kho', due_date: d(1), status: 'open' }),
    v({ violation_date: md(0, 3), rule_id: rTTMT, category: 'moi_truong', kind: 'hanh_vi', subject_type: 'ca_nhan', department: 'Tổ Cơ điện', employee_id: emp('NV017').id, location: 'Xưởng cơ khí', description: 'Đổ dầu nhớt thải vào thùng chứa không dán nhãn', measure: 'nhac_nho', corrective_action: 'Chuyển dầu vào phuy CTNH có nhãn tại kho CTNH', responsible: 'Tổ trưởng Cơ điện', status: 'closed', closed_date: md(0, 3) }),
    v({ violation_date: md(0, 4), rule_id: rNT, category: 'pccc', kind: 'hanh_vi', subject_type: 'nha_thau', contractor_name: 'Đơn vị thi công sàn thao tác ống khói (minh họa)', counts_for_unit: false, location: 'Ống khói tạo hạt', description: 'Hàn cắt trên cao không bố trí bình chữa cháy tại chỗ', severity: 'trung_binh', measure: 'nhac_nho', corrective_action: 'Tạm dừng, bố trí bình chữa cháy và người giám sát', responsible: 'Giám sát nhà thầu', status: 'closed', closed_date: md(0, 4) }),
    v({ violation_date: md(-1, 8), rule_id: rVSCN, category: 'vscn', kind: 'khu_vuc', department: 'Tổ Lò hơi', location: 'Khu than – xỉ', description: 'Xỉ than tràn ra ngoài khu chứa, chưa phủ bạt', measure: 'khac_phuc', corrective_action: 'Gom xỉ, phủ bạt', status: 'closed', closed_date: md(-1, 9) }),
    v({ violation_date: md(-1, 16), rule_id: rVSCN, category: 'vscn', kind: 'khu_vuc', department: 'Cầu cảng', location: 'Cầu cảng', description: 'Phân bón rơi vãi khi bốc xếp, chưa thu dọn cuối ca', measure: 'khac_phuc', corrective_action: 'Thu dọn; che chắn băng tải', status: 'closed', closed_date: md(-1, 17) }),
    v({ violation_date: md(-1, 21), rule_id: rKT, category: 'moi_truong', kind: 'hanh_vi', department: 'Xưởng Tạo hạt 2', location: 'Hệ lọc túi TH2 sấy nóng', description: 'Chênh áp lọc túi vượt 260 mmH₂O không báo cơ điện trong ca', measure: 'giai_trinh', corrective_action: 'Thay túi lọc; huấn luyện lại quy trình báo cáo', status: 'closed', closed_date: md(-1, 23) }),
    v({ violation_date: md(-1, 26), rule_id: rTTMT, category: 'moi_truong', kind: 'diem_thu_gom', department: 'Kho nguyên liệu – thành phẩm', location: 'Điểm thùng rác kho thành phẩm', description: 'Thùng rác quá đầy, không phân loại 3 nhóm', measure: 'khac_phuc', status: 'closed', closed_date: md(-1, 27) }),
    v({ violation_date: md(-1, 26), rule_id: rVSCN, category: 'vscn', kind: 'khu_vuc', department: 'Xưởng Tạo hạt 1', location: 'Sàn thao tác TH1', description: 'Sàn thao tác đóng bụi dày', measure: 'khac_phuc', status: 'closed', closed_date: md(-1, 28) }),
    v({ violation_date: md(-2, 11), rule_id: rCTNH, category: 'moi_truong', kind: 'diem_thu_gom', department: 'Nhà ăn', location: 'Khu rửa nhà ăn', description: 'Thùng thực phẩm thừa không có nắp, để qua đêm', measure: 'khac_phuc', status: 'closed', closed_date: md(-2, 12) }),
    v({ violation_date: md(-2, 19), rule_id: rTTMT, category: 'moi_truong', kind: 'hanh_vi', subject_type: 'ca_nhan', department: 'Tổ Cơ điện', employee_id: emp('NV017').id, location: 'Xưởng cơ khí', description: 'Bỏ giẻ lau dính dầu vào thùng rác sinh hoạt', measure: 'nhac_nho', status: 'closed', closed_date: md(-2, 19) }),
    v({ violation_date: md(-3, 6), rule_id: rVSCN, category: 'vscn', kind: 'khu_vuc', department: 'Xưởng Trộn', location: 'Khu xả liệu', description: 'Bao rách, nguyên liệu rơi vãi tại khu xả liệu', measure: 'khac_phuc', status: 'closed', closed_date: md(-3, 7) }),
  ]
  const pastKinds: [string, string, string, string][] = [
    ['vscn', 'khu_vuc', 'Xưởng Tạo hạt 1', 'Sàn thao tác đóng bụi, chưa vệ sinh cuối ca'],
    ['moi_truong', 'diem_thu_gom', 'Kho nguyên liệu – thành phẩm', 'Thùng rác không phân loại 3 nhóm'],
    ['vscn', 'khu_vuc', 'Cầu cảng', 'Phân bón rơi vãi khi bốc xếp'],
    ['moi_truong', 'hanh_vi', 'Tổ Cơ điện', 'Giẻ lau dính dầu bỏ thùng rác sinh hoạt'],
    ['vscn', 'khu_vuc', 'Tổ Lò hơi', 'Xỉ than tràn ra ngoài khu chứa'],
    ['moi_truong', 'diem_thu_gom', 'Nhà ăn', 'Thùng thực phẩm thừa không có nắp'],
    ['vscn', 'khu_vuc', 'Xưởng Trộn', 'Bao rách, nguyên liệu rơi vãi khu xả liệu'],
    ['moi_truong', 'hanh_vi', 'Xưởng Tạo hạt 2', 'Không ghi nhật ký vận hành hệ lọc bụi trong ca'],
  ]
  for (let i = 0; i < 22; i++) {
    const [category, kind, department, description] = pastKinds[i % pastKinds.length]
    rule_violations.push(
      v({
        violation_date: `${year - 1}-${String((i % 12) + 1).padStart(2, '0')}-${String(5 + ((i * 7) % 20)).padStart(2, '0')}`,
        rule_id: category === 'vscn' ? rVSCN : rTTMT,
        category,
        kind,
        department,
        description,
        measure: 'khac_phuc',
        status: 'closed',
      })
    )
  }

  return {
    organizations,
    facilities,
    profiles,
    waste_types,
    waste_logs,
    waste_contractors,
    waste_transfers,
    waste_transfer_items,
    treatment_systems,
    operation_logs,
    monitoring_points,
    monitoring_results,
    alerts,
    checklist_templates,
    checklist_runs,
    fire_equipment,
    drills,
    contractor_permits,
    incidents,
    capa_actions,
    chemicals,
    legal_documents,
    compliance_tasks,
    employees,
    training_courses,
    training_records,
    esg_policies,
    esg_targets,
    esg_metrics,
    ghg_activities,
    internal_rules,
    rule_violations,
  }
}
