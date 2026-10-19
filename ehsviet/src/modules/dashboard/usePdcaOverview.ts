// Tổng quan PDCA: gom số liệu các phân hệ thành 4 khối P – D – C – A và danh sách việc cần xử lý ưu tiên.
import { format } from 'date-fns'
import { useMemo } from 'react'
import type { Tone } from '../../components/UI'
import { useList } from '../../hooks/useCrud'
import { capaState, type CapaAction } from '../../lib/capa'
import { EPR_STEP_LABELS, eprDeadlines, eprStep, type PackagingRecord } from '../../lib/circular'
import { DRILL_KIND_LABELS, type Drill } from '../../lib/drills'
import { inspectionState, isOpenWo, isOverdueWo } from '../../lib/equipment'
import { bnnStatus, periodicStatus } from '../../lib/health'
import { planSchedule, scheduleCompliance } from '../../lib/inspection'
import { interp, planState } from '../../lib/plan'
import { coverage, isValid, MATRIX_CATEGORIES } from '../../lib/training'
import { daysUntil, fmtDate, fmtNum } from '../../lib/utils'
import { useChemicalData } from '../chemicals/useChemicalData'
import { useEquipmentData } from '../equipment/useEquipmentData'
import { useHealthData } from '../health/useHealthData'
import { useInspectionData } from '../inspection/useInspectionData'
import { useOrgRequirements } from '../org/useOrgRequirements'
import { usePlanData } from '../plan/usePlanData'

export type Phase = 'P' | 'D' | 'C' | 'A'

export interface Priority {
  key: string
  phase: Phase
  tone: 'red' | 'amber'
  title: string
  detail?: string
  to: string
  /** 3: an toàn, ô nhiễm · 2: nghĩa vụ pháp lý · 1: quản lý nội bộ */
  tier: 1 | 2 | 3
  /** cùng mức: càng lớn càng gấp (vd. số ngày quá hạn) */
  weight: number
}

export interface Metric {
  label: string
  value: string
  sub?: string
  tone: Tone
  to: string
  /** 0–100: hiển thị thanh tiến độ */
  pct?: number
}

const overdueDays = (d: string) => -daysUntil(d)

export function usePdcaOverview(fid: string) {
  const on = !!fid
  const match = { facility_id: fid }
  const org = useOrgRequirements(fid)
  const plan = usePlanData(fid)
  const equip = useEquipmentData(fid)
  const chem = useChemicalData(fid)
  const health = useHealthData(fid)
  const insp = useInspectionData(fid)
  const tasks = useList<any>('compliance_tasks', { match, order: 'due_date', ascending: true, enabled: on })
  const incidents = useList<any>('incidents', { match, order: 'incident_date', enabled: on })
  const alerts = useList<any>('alerts', { match, enabled: on })
  const fireEq = useList<any>('fire_equipment', { match, enabled: on })
  const drills = useList<Drill>('drills', { match, order: 'drill_date', enabled: on })
  const violations = useList<any>('rule_violations', { match, order: 'violation_date', enabled: on })
  const packaging = useList<PackagingRecord>('packaging_records', { match, order: 'year', enabled: on })
  const inventory = useList<any>('waste_inventory', { match, order: 'name', ascending: true, enabled: on })
  const results = useList<any>('monitoring_results', { match, select: 'sample_date, is_exceeded, parameter', order: 'sample_date', enabled: on })

  const loading =
    org.loading || plan.loading || equip.loading || chem.loading || health.loading || insp.loading || tasks.isLoading || incidents.isLoading || drills.isLoading

  return useMemo(() => {
    const today = new Date()
    const todayISO = format(today, 'yyyy-MM-dd')
    const y = today.getFullYear()
    const pr: Priority[] = []
    const P: Metric[] = []
    const D: Metric[] = []
    const C: Metric[] = []
    const A: Metric[] = []

    // ================= P · Kế hoạch =================
    const annual = plan.items.filter((p) => p.horizon === 'nam' && Number(p.year) === y && p.status !== 'huy')
    const aDone = annual.filter((p) => p.status === 'hoan_thanh').length
    const aLate = annual.filter((p) => p.status === 'cham' || planState(p).overdue)
    const aAvg = annual.length ? annual.reduce((s, p) => s + Number(p.progress ?? 0), 0) / annual.length : 0
    P.push({
      label: `Kế hoạch HSE năm ${y}`,
      value: annual.length ? `${aDone}/${annual.length} hoàn thành` : 'Chưa lập',
      sub: annual.length ? `Tiến độ bình quân ${fmtNum(aAvg, 0)}% · ${aLate.length} chậm, quá hạn` : 'Lập kế hoạch tại Kế hoạch & lộ trình',
      tone: !annual.length ? 'amber' : aLate.length ? 'red' : 'green',
      to: '/ke-hoach',
      pct: annual.length ? aAvg : undefined,
    })
    if (!annual.length) pr.push({ key: 'plan-none', tier: 2, phase: 'P', tone: 'amber', title: `Chưa lập kế hoạch HSE năm ${y}`, detail: 'Luật ATVSLĐ Điều 76', to: '/ke-hoach', weight: 0 })
    for (const p of aLate)
      pr.push({
        key: 'plan-' + p.id, tier: 1,
        phase: 'P',
        tone: 'red',
        title: `Kế hoạch chậm: ${p.title}`,
        detail: `${p.due_date ? 'Hạn ' + fmtDate(p.due_date) + ' · ' : ''}tiến độ ${p.progress}%${p.note ? ' · ' + p.note : ''}`,
        to: '/ke-hoach',
        weight: p.due_date ? Math.max(0, overdueDays(p.due_date)) : 0,
      })
    const road = plan.items.filter((p) => p.horizon === '5_nam' && Number(p.year) === y && p.status !== 'huy')
    for (const p of road.filter((x) => planState(x).overdue))
      pr.push({ key: 'road-' + p.id, tier: 1, phase: 'P', tone: 'red', title: `Lộ trình 5 năm quá hạn: ${p.title}`, detail: p.due_date ? 'Hạn ' + fmtDate(p.due_date) : undefined, to: '/ke-hoach', weight: p.due_date ? overdueDays(p.due_date) : 0 })

    // Net Zero: năm gần nhất đủ 12 tháng so với đường mục tiêu
    const ghgT = plan.targets
      .filter((t) => t.metric === 'ghg_total')
      .map((t) => ({ year: Number(t.year), value: Number(t.value) }))
      .sort((a, b) => a.year - b.year)
    const complete = plan.ghgYears.filter((g) => g.complete && g.year < y)
    const latest = complete[complete.length - 1]
    const target = latest ? interp(ghgT, latest.year) : null
    // dung sai 0,5%: mốc năm gốc đã làm tròn
    const onTrack = !!latest && target != null && latest.total12 <= target * 1.005
    P.push({
      label: 'Lộ trình Net Zero 2050',
      value: latest ? `${fmtNum(latest.total12, 0)} tCO₂e (${latest.year})` : 'Chưa có năm kiểm kê đủ',
      sub: !ghgT.length ? 'Chưa đặt đường mục tiêu' : target == null ? 'Ngoài khoảng mục tiêu' : onTrack ? `Trong lộ trình (mục tiêu ${fmtNum(target, 0)})` : `Vượt lộ trình ${fmtNum((latest!.total12 / target - 1) * 100, 1)}%`,
      tone: !latest || !ghgT.length || target == null ? 'gray' : onTrack ? 'green' : 'amber',
      to: '/ke-hoach',
    })

    // Bộ máy HSE theo quy định
    const mandatory = org.reqs.filter((r) => r.required != null && r.key !== 'so_cuu')
    const reqOk = mandatory.filter((r) => r.ok).length
    P.push({
      label: 'Bộ máy HSE theo quy định',
      value: `${reqOk}/${mandatory.length} yêu cầu đạt`,
      sub: org.headcountEntered ? `${org.headcount} lao động` : 'Chưa nhập tổng số lao động',
      tone: mandatory.some((r) => r.ok === false) ? 'red' : org.reqs.some((r) => r.issues.length) ? 'amber' : 'green',
      to: '/to-chuc',
    })
    for (const r of org.reqs.filter((x) => x.ok === false))
      pr.push({ key: 'org-' + r.key, tier: 2, phase: 'P', tone: 'red', title: `Bộ máy: ${r.title}`, detail: `${r.requiredText} · hiện có ${r.actual}`, to: '/to-chuc', weight: 5 })

    // Hồ sơ & nghĩa vụ
    const pending = (tasks.data ?? []).filter((t) => t.status !== 'done')
    const tOver = pending.filter((t) => daysUntil(t.due_date) < 0)
    const tSoon = pending.filter((t) => daysUntil(t.due_date) >= 0 && daysUntil(t.due_date) <= (t.remind_days ?? 14))
    P.push({
      label: 'Hồ sơ & nghĩa vụ',
      value: tOver.length ? `${tOver.length} quá hạn` : tSoon.length ? `${tSoon.length} sắp đến hạn` : 'Đúng hạn',
      sub: `${pending.length} việc đang theo dõi`,
      tone: tOver.length ? 'red' : tSoon.length ? 'amber' : 'green',
      to: '/tuan-thu',
    })
    for (const t of tOver) pr.push({ key: 'task-' + t.id, phase: 'P', tone: 'red', tier: 2, title: t.title, detail: `Quá hạn ${overdueDays(t.due_date)} ngày (hạn ${fmtDate(t.due_date)})`, to: '/tuan-thu', weight: overdueDays(t.due_date) })
    for (const t of tSoon) pr.push({ key: 'task-' + t.id, phase: 'P', tone: 'amber', tier: 2, title: t.title, detail: `Còn ${daysUntil(t.due_date)} ngày (hạn ${fmtDate(t.due_date)})`, to: '/tuan-thu', weight: -daysUntil(t.due_date) })

    // ================= D · Thực hiện =================
    const people = org.people
    const active = people.employees.filter((e) => e.status === 'active')
    const cov = MATRIX_CATEGORIES.map((c) => ({ c, ...coverage(people.employees, people.matrix, c) }))
    const needTraining = active.filter((e) => MATRIX_CATEGORIES.some((c) => !isValid(people.matrix.get(e.id)![c]))).length
    const minPct = cov.length ? Math.min(...cov.map((x) => x.pct)) : 0
    D.push({
      label: 'Huấn luyện ATVSLĐ · PCCC · sự cố chất thải',
      value: !active.length ? 'Chưa có nhân sự' : needTraining ? `${needTraining} người cần huấn luyện bổ sung` : 'Đủ, còn hiệu lực',
      sub: active.length ? `${active.length} người đang làm việc · thấp nhất ${minPct}%` : 'Nhập danh sách tại Nhân sự & Huấn luyện',
      tone: !active.length ? 'gray' : needTraining ? (minPct < 80 ? 'red' : 'amber') : 'green',
      to: '/nhan-su',
    })
    if (needTraining) pr.push({ key: 'training', tier: 2, phase: 'D', tone: 'red', title: `${needTraining} người lao động chưa có hoặc hết hạn huấn luyện bắt buộc`, detail: 'ATVSLĐ, PCCC, ứng phó sự cố chất thải', to: '/nhan-su', weight: needTraining })

    // Thiết bị: kiểm định, sửa chữa
    const liveEq = equip.equipment.filter((e) => e.status !== 'thanh_ly')
    const insStates = liveEq.map((e) => ({ e, s: inspectionState(e) }))
    const insOver = insStates.filter((x) => x.s.state === 'qua_han' || x.s.state === 'chua_co')
    const insSoon = insStates.filter((x) => x.s.state === 'sap_den')
    const openWo = equip.workOrders.filter(isOpenWo)
    const lateWo = openWo.filter((w) => isOverdueWo(w))
    D.push({
      label: 'Thiết bị & bảo trì',
      value: `${openWo.length} phiếu sửa chữa đang mở`,
      sub: `${lateWo.length} quá hạn sửa · ${insOver.length} quá hạn kiểm định · ${insSoon.length} sắp đến hạn`,
      tone: lateWo.length || insOver.length ? 'red' : insSoon.length || openWo.length ? 'amber' : 'green',
      to: '/thiet-bi',
    })
    for (const { e, s } of insOver)
      pr.push({
        key: 'ins-' + e.id,
        phase: 'D',
        tone: 'red', tier: 3,
        title: `${s.state === 'chua_co' ? 'Chưa có hạn kiểm định' : 'Quá hạn kiểm định'}: ${e.code ? e.code + ' – ' : ''}${e.name}`,
        detail: e.strict_safety ? 'Thiết bị có yêu cầu nghiêm ngặt – dừng sử dụng đến khi kiểm định đạt' : undefined,
        to: '/thiet-bi',
        weight: 30 + (s.daysLeft != null ? -s.daysLeft : 0),
      })
    for (const { e, s } of insSoon) pr.push({ key: 'ins-' + e.id, phase: 'D', tone: 'amber', tier: 2, title: `Sắp đến hạn kiểm định: ${e.code ? e.code + ' – ' : ''}${e.name}`, detail: `Còn ${s.daysLeft} ngày`, to: '/thiet-bi', weight: -(s.daysLeft ?? 0) })
    for (const w of lateWo) {
      const e = equip.byId.get(w.equipment_id)
      pr.push({ key: 'wo-' + w.id, tier: 1, phase: 'D', tone: 'red', title: `Sửa chữa quá hạn: ${e?.name ?? 'thiết bị'}`, detail: `${w.description ?? ''}${w.due_date ? ' · hạn ' + fmtDate(w.due_date) : ''}`, to: '/thiet-bi', weight: w.due_date ? overdueDays(w.due_date) : 0 })
    }
    for (const w of openWo.filter((x) => x.safety_result === 'khong_dat' && !isOverdueWo(x))) {
      const e = equip.byId.get(w.equipment_id)
      pr.push({ key: 'wos-' + w.id, tier: 3, phase: 'D', tone: 'red', title: `Nghiệm thu không đạt an toàn: ${e?.name ?? 'thiết bị'}`, detail: 'Sửa lại, không đưa vào vận hành', to: '/thiet-bi', weight: 10 })
    }

    // Hóa chất
    const chemRed = chem.rows.filter((r) => r.alerts.some((a) => a.tone === 'red'))
    const chemAmber = chem.rows.filter((r) => !r.alerts.some((a) => a.tone === 'red') && r.alerts.length)
    D.push({
      label: 'Hóa chất',
      value: chemRed.length + chemAmber.length ? `${chemRed.length + chemAmber.length} hóa chất cần xử lý` : 'Không có cảnh báo',
      sub: `${chem.rows.filter((r) => r.c.active).length} hóa chất đang dùng · ${chemRed.length} cảnh báo đỏ`,
      tone: chemRed.length ? 'red' : chemAmber.length ? 'amber' : 'green',
      to: '/hoa-chat',
    })
    for (const r of chemRed)
      pr.push({ key: 'chem-' + r.c.id, tier: 2, phase: 'D', tone: 'red', title: `Hóa chất: ${r.c.name}`, detail: r.alerts.filter((a) => a.tone === 'red').map((a) => a.label).join(' · '), to: '/hoa-chat', weight: 8 })
    if (chemAmber.length)
      pr.push({
        key: 'chem-amber', tier: 1,
        phase: 'D',
        tone: 'amber',
        title: `${chemAmber.length} hóa chất có cảnh báo định mức, hạn dùng, chứng từ`,
        detail: chemAmber.slice(0, 3).map((r) => r.c.name).join(', ') + (chemAmber.length > 3 ? '…' : ''),
        to: '/hoa-chat',
        weight: 0,
      })

    // Chất thải & EPR
    const ctnh = (inventory.data ?? []).filter((w) => w.category === 'CTNH').reduce((s, w) => s + Number(w.stock ?? 0), 0)
    const eprYear = y - 1
    const eprRows = (packaging.data ?? []).filter((r) => Number(r.year) === eprYear)
    const step = eprStep(eprRows, eprYear, todayISO)
    const dl = eprDeadlines(eprYear)
    D.push({
      label: 'Chất thải & EPR',
      value: `CTNH lưu kho ${fmtNum(ctnh, 0)} kg`,
      sub: `EPR số liệu ${eprYear}: ${EPR_STEP_LABELS[step]}`,
      tone: step === 'qua_han_ke_khai' || step === 'qua_han_nop' ? 'red' : step === 'can_ke_khai' || step === 'can_nop' ? 'amber' : 'green',
      to: '/tuan-hoan',
    })
    if (step === 'qua_han_ke_khai' || step === 'qua_han_nop')
      pr.push({ key: 'epr', phase: 'D', tone: 'red', tier: 2, title: `EPR bao bì số liệu ${eprYear}: ${EPR_STEP_LABELS[step]}`, detail: `Kê khai ${dl.declareText}, nộp ${dl.payText}`, to: '/tuan-hoan', weight: 20 })
    else if ((step === 'can_ke_khai' && daysUntil(dl.declare) <= 45) || (step === 'can_nop' && daysUntil(dl.pay) <= 30))
      pr.push({ key: 'epr', phase: 'D', tone: 'amber', tier: 2, title: `EPR bao bì số liệu ${eprYear}: ${EPR_STEP_LABELS[step]}`, detail: `Kê khai ${dl.declareText}, nộp ${dl.payText}`, to: '/tuan-hoan', weight: 0 })

    // PCCC: thiết bị, thực tập phương án
    const fireOver = (fireEq.data ?? []).filter((e) => e.next_inspection && daysUntil(e.next_inspection) < 0)
    const doneDrills = (drills.data ?? []).filter((d) => (d.status ?? 'done') === 'done')
    const lastPccc = doneDrills.filter((d) => d.kind === 'PCCC').sort((a, b) => b.drill_date.localeCompare(a.drill_date))[0]
    const pcccOld = !lastPccc || daysUntil(lastPccc.drill_date) < -365
    D.push({
      label: 'PCCC & diễn tập',
      value: fireOver.length ? `${fireOver.length} thiết bị PCCC quá hạn kiểm tra` : 'Thiết bị PCCC đạt',
      sub: lastPccc ? `Thực tập PCCC gần nhất ${fmtDate(lastPccc.drill_date)}` : 'Chưa có lần thực tập PCCC',
      tone: pcccOld ? 'red' : fireOver.length ? 'amber' : 'green',
      to: '/an-toan',
    })
    if (fireOver.length) pr.push({ key: 'fire', tier: 2, phase: 'D', tone: 'amber', title: `${fireOver.length} thiết bị PCCC quá hạn kiểm tra, bảo dưỡng`, detail: fireOver.slice(0, 3).map((e) => e.name).join(', '), to: '/an-toan', weight: 2 })
    if (pcccOld) pr.push({ key: 'drill-pccc', tier: 3, phase: 'D', tone: 'red', title: 'Quá 12 tháng chưa thực tập phương án chữa cháy', detail: 'Phương án chữa cháy của cơ sở thực tập ít nhất 01 lần/năm (NĐ 105/2025)', to: '/an-toan', weight: 15 })
    for (const d of (drills.data ?? []).filter((x) => x.status === 'planned' && daysUntil(x.drill_date) >= 0 && daysUntil(x.drill_date) <= 30))
      pr.push({ key: 'drill-' + d.id, tier: 1, phase: 'D', tone: 'amber', title: `Sắp diễn tập: ${DRILL_KIND_LABELS[d.kind] ?? d.kind}`, detail: `${fmtDate(d.drill_date)}${d.location ? ' · ' + d.location : ''} – chuẩn bị danh sách tham gia`, to: '/an-toan', weight: -daysUntil(d.drill_date) })

    // ================= C · Kiểm tra =================
    const plans = insp.plans.filter((p) => p.active)
    let due = 0
    let doneN = 0
    let missedN = 0
    let currentN = 0
    for (const p of plans) {
      const cells = planSchedule(p, insp.runs, today, y)
      const sc = scheduleCompliance(cells)
      due += sc.due
      doneN += sc.done
      missedN += sc.missed
      const cur = cells.find((c) => c.state === 'current')
      if (cur) {
        currentN++
        const left = Math.ceil((cur.end.getTime() - today.getTime()) / 86400000)
        pr.push({ key: 'insp-' + p.id, tier: 1, phase: 'C', tone: 'amber', title: `Đến kỳ kiểm tra: ${p.name}`, detail: `${cur.label} · còn ${Math.max(0, left)} ngày`, to: '/kiem-tra', weight: -left })
      }
      const missedRecent = cells.filter((c) => c.state === 'missed' && today.getTime() - c.end.getTime() < 45 * 86400000)
      if (missedRecent.length)
        pr.push({ key: 'insp-miss-' + p.id, tier: 1, phase: 'C', tone: 'red', title: `Bỏ sót kỳ kiểm tra: ${p.name}`, detail: missedRecent.map((c) => c.label).join(', '), to: '/kiem-tra', weight: 6 })
    }
    const inspPct = due ? Math.round((doneN / due) * 100) : 100
    C.push({
      label: 'Kiểm tra định kỳ',
      value: `${inspPct}% đúng kỳ (${y})`,
      sub: `${missedN} kỳ bỏ sót · ${currentN} chương trình đến kỳ`,
      tone: inspPct >= 95 ? 'green' : inspPct >= 80 ? 'amber' : 'red',
      to: '/kiem-tra',
      pct: inspPct,
    })

    // Quan trắc
    const res = results.data ?? []
    const lastDate = res.reduce((m: string, r: any) => (r.sample_date > m ? r.sample_date : m), '')
    const lastExceeded = res.filter((r: any) => r.sample_date === lastDate && r.is_exceeded)
    const openMon = (alerts.data ?? []).filter((a) => a.status === 'open' && a.source === 'quan_trac')
    C.push({
      label: 'Quan trắc môi trường',
      value: lastExceeded.length || openMon.length ? 'Có thông số vượt ngưỡng' : lastDate ? 'Đạt quy chuẩn' : 'Chưa có kết quả',
      sub: lastDate ? `Lần lấy mẫu gần nhất ${fmtDate(lastDate)}` : undefined,
      tone: lastExceeded.length || openMon.length ? 'red' : lastDate ? 'green' : 'gray',
      to: '/van-hanh',
    })
    for (const a of openMon) pr.push({ key: 'alert-' + a.id, tier: 3, phase: 'C', tone: 'red', title: a.message, detail: 'Cảnh báo quan trắc đang mở', to: '/van-hanh', weight: 25 })

    // Sức khỏe nghề nghiệp
    const ksk = health.employees.map((e) => periodicStatus(e, health.checks))
    const kskDue = ksk.filter((x) => x.state === 'qua_han' || x.state === 'chua').length
    const bnn = health.employees.map((e) => bnnStatus(e, health.checks)).filter((x) => x.state !== 'khong_yeu_cau')
    const bnnDue = bnn.filter((x) => x.state === 'qua_han' || x.state === 'chua').length
    const kskPct = health.employees.length ? Math.round(((health.employees.length - kskDue) / health.employees.length) * 100) : 0
    const lastWem = health.campaigns[0]
    C.push({
      label: 'Sức khỏe nghề nghiệp',
      value: health.employees.length ? `${kskPct}% khám đúng hạn` : 'Chưa có nhân sự',
      sub: `${kskDue} quá hạn khám · ${bnnDue} chưa khám BNN${lastWem && !lastWem.published_date ? ' · QTMTLĐ chưa công khai' : ''}`,
      tone: !health.employees.length ? 'gray' : kskDue + bnnDue ? 'amber' : 'green',
      to: '/suc-khoe',
      pct: health.employees.length ? kskPct : undefined,
    })
    if (kskDue + bnnDue) pr.push({ key: 'health', tier: 2, phase: 'C', tone: 'amber', title: `${kskDue} người quá hạn khám sức khỏe, ${bnnDue} người chưa khám bệnh nghề nghiệp`, to: '/suc-khoe', weight: 1 })
    if (lastWem && !lastWem.published_date) pr.push({ key: 'wem', tier: 2, phase: 'C', tone: 'amber', title: 'Chưa công khai kết quả quan trắc môi trường lao động', detail: `Đợt ${fmtDate(lastWem.sample_date)}`, to: '/suc-khoe', weight: 1 })

    // ================= A · Cải tiến =================
    const capa: CapaAction[] = insp.capa
    const states = capa.map((a) => ({ a, s: capaState(a) }))
    const capaOpen = states.filter((x) => x.s === 'moi' || x.s === 'dang_lam' || x.s === 'qua_han')
    const capaLate = states.filter((x) => x.s === 'qua_han')
    const capaWait = states.filter((x) => x.s === 'cho_xac_nhan')
    const capaFail = states.filter((x) => x.s === 'chua_hieu_luc')
    A.push({
      label: 'Hành động khắc phục',
      value: `${capaOpen.length} đang mở`,
      sub: `${capaLate.length} quá hạn · ${capaWait.length} chờ xác nhận hiệu lực`,
      tone: capaLate.length || capaFail.length ? 'red' : capaOpen.length || capaWait.length ? 'amber' : 'green',
      to: '/khac-phuc',
    })
    for (const { a } of capaLate)
      pr.push({ key: 'capa-' + a.id, tier: 1, phase: 'A', tone: 'red', title: `Khắc phục quá hạn: ${a.action}`, detail: [a.source_label, a.owner, a.due_date && 'hạn ' + fmtDate(a.due_date)].filter(Boolean).join(' · '), to: '/khac-phuc', weight: a.due_date ? overdueDays(a.due_date) : 0 })
    for (const { a } of capaFail) pr.push({ key: 'capa-f-' + a.id, tier: 1, phase: 'A', tone: 'red', title: `Khắc phục chưa hiệu lực: ${a.action}`, detail: 'Lập hành động mới', to: '/khac-phuc', weight: 4 })
    if (capaWait.length) pr.push({ key: 'capa-wait', tier: 1, phase: 'A', tone: 'amber', title: `${capaWait.length} hành động đã xong, chờ xác nhận hiệu lực`, to: '/khac-phuc', weight: 0 })

    // Sự cố
    const openInc = (incidents.data ?? []).filter((i) => i.status !== 'closed')
    A.push({
      label: 'Sự cố',
      value: openInc.length ? `${openInc.length} đang xử lý` : 'Không có sự cố mở',
      sub: `${(incidents.data ?? []).filter((i) => String(i.incident_date).startsWith(String(y))).length} sự cố trong năm ${y}`,
      tone: openInc.some((i) => i.severity === 'nghiem_trong') ? 'red' : openInc.length ? 'amber' : 'green',
      to: '/an-toan',
    })
    for (const i of openInc)
      pr.push({ key: 'inc-' + i.id, tier: i.severity === 'nghiem_trong' ? 3 : 1, phase: 'A', tone: i.severity === 'nghiem_trong' ? 'red' : 'amber', title: `Sự cố đang xử lý: ${i.title}`, detail: fmtDate(i.incident_date), to: '/an-toan', weight: 12 })

    // Nội quy & vi phạm
    const monthFrom = format(today, 'yyyy-MM') + '-01'
    const vMonth = (violations.data ?? []).filter((v) => v.violation_date >= monthFrom).length
    const vOpen = (violations.data ?? []).filter((v) => v.status !== 'closed').length
    A.push({
      label: 'Nội quy & vi phạm',
      value: `${vMonth} vi phạm tháng này`,
      sub: `${vOpen} chưa khắc phục`,
      tone: vOpen ? 'amber' : 'green',
      to: '/noi-quy',
    })
    if (vOpen) pr.push({ key: 'viol', tier: 1, phase: 'A', tone: 'amber', title: `${vOpen} vi phạm nội quy chưa khắc phục`, to: '/noi-quy', weight: 0 })

    // đỏ trước vàng; rồi an toàn → pháp lý → quản lý; cùng mức: gấp hơn trước
    pr.sort((a, b) => (a.tone !== b.tone ? (a.tone === 'red' ? -1 : 1) : a.tier !== b.tier ? b.tier - a.tier : b.weight - a.weight))

    return {
      priorities: pr,
      quadrants: { P, D, C, A },
      training: cov,
      activeCount: active.length,
      loading,
    }
  }, [
    org.reqs,
    org.people,
    org.headcount,
    org.headcountEntered,
    plan.items,
    plan.targets,
    plan.ghgYears,
    equip.equipment,
    equip.workOrders,
    equip.byId,
    chem.rows,
    health.employees,
    health.checks,
    health.campaigns,
    insp.plans,
    insp.runs,
    insp.capa,
    tasks.data,
    incidents.data,
    alerts.data,
    fireEq.data,
    drills.data,
    violations.data,
    packaging.data,
    inventory.data,
    results.data,
    loading,
  ])
}
