import { format, parseISO, subMonths } from 'date-fns'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge, Card, CardHeader, EmptyState, Progress, type Tone } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { useList } from '../hooks/useCrud'
import { ALERT_LEVEL_LABELS, SEVERITY_LABELS, TRAINING_CATEGORY_LABELS } from '../lib/constants'
import { summarize, type GhgActivity } from '../lib/ghg'
import { evaluateUnits, gradeOf, type Violation } from '../lib/rules'
import { coverage, isValid, MATRIX_CATEGORIES } from '../lib/training'
import { usePersonnelData } from '../modules/personnel/shared'
import { cls, daysUntil, fmtDate, fmtNum } from '../lib/utils'

function Pulse({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const dot: Record<Tone, string> = {
    green: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-red-500',
    gray: 'bg-white/40',
    blue: 'bg-sky-400',
  }
  return (
    <div className="min-w-[150px] flex-1 rounded-xl bg-white/5 px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-white/50">
        <span className={cls('h-2 w-2 rounded-full', dot[tone])} />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, facility, facilityId } = useAuth()
  const fid = facilityId ?? ''
  const on = !!facilityId

  const alerts = useList('alerts', { match: { facility_id: fid }, enabled: on })
  const tasks = useList('compliance_tasks', {
    match: { facility_id: fid },
    order: 'due_date',
    ascending: true,
    enabled: on,
  })
  const incidents = useList('incidents', { match: { facility_id: fid }, enabled: on })
  const inventory = useList('waste_inventory', {
    match: { facility_id: fid },
    order: 'name',
    ascending: true,
    enabled: on,
  })
  const fireEq = useList('fire_equipment', { match: { facility_id: fid }, enabled: on })
  const wasteLogs = useList('waste_logs', {
    select: 'log_date, quantity, waste_types(category)',
    match: { facility_id: fid },
    order: 'log_date',
    ascending: true,
    enabled: on,
  })

  const openAlerts = useMemo(
    () => (alerts.data ?? []).filter((a: any) => a.status === 'open'),
    [alerts.data]
  )
  const pendingTasks = useMemo(
    () => (tasks.data ?? []).filter((t: any) => t.status !== 'done'),
    [tasks.data]
  )
  const overdueTasks = pendingTasks.filter((t: any) => daysUntil(t.due_date) < 0)
  const upcomingTasks = pendingTasks.filter(
    (t: any) => daysUntil(t.due_date) >= 0 && daysUntil(t.due_date) <= (t.remind_days ?? 14)
  )
  const openIncidents = (incidents.data ?? []).filter((i: any) => i.status !== 'closed')
  const ctnhStock = (inventory.data ?? [])
    .filter((w: any) => w.category === 'CTNH')
    .reduce((s: number, w: any) => s + Number(w.stock ?? 0), 0)
  const fireOverdue = (fireEq.data ?? []).filter(
    (e: any) => e.next_inspection && daysUntil(e.next_inspection) < 0
  )

  const monitoringExceeded = openAlerts.some((a: any) => a.source === 'quan_trac')

  // Huấn luyện ATVSLĐ – PCCC – sự cố chất thải
  const people = usePersonnelData(fid)
  const activeEmp = people.employees.filter((e) => e.status === 'active')
  const cov = MATRIX_CATEGORIES.map((c) => ({ c, ...coverage(people.employees, people.matrix, c) }))
  const needTraining = activeEmp.filter((e) => MATRIX_CATEGORIES.some((c) => !isValid(people.matrix.get(e.id)![c]))).length

  // Vi phạm nội quy tháng này
  const violations = useList<Violation>('rule_violations', { match: { facility_id: fid }, order: 'violation_date', enabled: on })
  const now = new Date()
  const monthFrom = format(now, 'yyyy-MM') + '-01'
  const monthTo = format(now, 'yyyy-MM') + '-31'
  const vMonth = (violations.data ?? []).filter((v) => v.violation_date >= monthFrom && v.violation_date <= monthTo)
  const vOpen = (violations.data ?? []).filter((v) => v.status !== 'closed').length
  const unitEval = evaluateUnits(violations.data ?? [], monthFrom, monthTo)

  // Khí nhà kính năm nay (lũy kế)
  const ghg = useList<GhgActivity>('ghg_activities', { match: { facility_id: fid }, order: 'year', enabled: on })
  const ghgYear = summarize(ghg.data ?? [], now.getFullYear())

  const chartData = useMemo(() => {
    const buckets: { key: string; label: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i)
      buckets.push({ key: format(d, 'yyyy-MM'), label: format(d, 'MM/yyyy'), total: 0 })
    }
    for (const row of (wasteLogs.data ?? []) as any[]) {
      if (row.waste_types?.category !== 'CTNH') continue
      const key = format(parseISO(row.log_date), 'yyyy-MM')
      const b = buckets.find((x) => x.key === key)
      if (b) b.total += Number(row.quantity ?? 0)
    }
    return buckets
  }, [wasteLogs.data])

  const dueLabel = (d: string) => {
    const n = daysUntil(d)
    if (n < 0) return <Badge tone="red">Quá hạn {-n} ngày</Badge>
    if (n === 0) return <Badge tone="red">Hôm nay</Badge>
    return <Badge tone={n <= 7 ? 'amber' : 'gray'}>Còn {n} ngày</Badge>
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Tổng quan</h1>
        <p className="text-sm text-pine-800/50">
          {facility?.name ?? 'Chưa có nhà máy'} · Xin chào, {profile?.full_name}
        </p>
      </div>

      {/* Bảng trạng thái tuân thủ */}
      <div className="rounded-2xl bg-pine-900 p-3">
        <div className="px-1 pb-2 text-[11px] font-medium uppercase tracking-widest text-white/40">
          Trạng thái tuân thủ hôm nay
        </div>
        <div className="flex flex-wrap gap-2">
          <Pulse
            label="Quan trắc"
            value={monitoringExceeded ? 'Vượt ngưỡng' : 'Đạt QCVN'}
            tone={monitoringExceeded ? 'red' : 'green'}
          />
          <Pulse
            label="Tuân thủ"
            value={
              overdueTasks.length > 0
                ? overdueTasks.length + ' việc quá hạn'
                : upcomingTasks.length > 0
                  ? upcomingTasks.length + ' việc sắp đến hạn'
                  : 'Đúng hạn'
            }
            tone={overdueTasks.length > 0 ? 'red' : upcomingTasks.length > 0 ? 'amber' : 'green'}
          />
          <Pulse label="CTNH tồn kho" value={fmtNum(ctnhStock) + ' kg'} tone="blue" />
          <Pulse
            label="Sự cố"
            value={openIncidents.length > 0 ? openIncidents.length + ' đang mở' : 'Không có'}
            tone={openIncidents.length > 0 ? 'red' : 'green'}
          />
          <Pulse
            label="Thiết bị PCCC"
            value={fireOverdue.length > 0 ? fireOverdue.length + ' quá hạn kiểm tra' : 'Đạt'}
            tone={fireOverdue.length > 0 ? 'amber' : 'green'}
          />
          <Pulse
            label="Huấn luyện"
            value={activeEmp.length === 0 ? 'Chưa có nhân sự' : needTraining > 0 ? needTraining + ' người cần huấn luyện' : 'Đủ, còn hạn'}
            tone={activeEmp.length === 0 ? 'gray' : needTraining > 0 ? 'red' : 'green'}
          />
          <Pulse
            label="Vi phạm nội quy"
            value={vMonth.length + ' trong tháng · ' + vOpen + ' chưa khắc phục'}
            tone={vOpen > 0 ? 'amber' : 'green'}
          />
          <Pulse
            label={'KNK ' + now.getFullYear()}
            value={ghgYear.hasData ? fmtNum(ghgYear.total12, 0) + ' tCO₂e (PV1+2)' : 'Chưa nhập'}
            tone="blue"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Huấn luyện an toàn – PCCC – sự cố chất thải"
            hint={`Tỷ lệ người lao động còn hiệu lực huấn luyện · ${activeEmp.length} người đang làm việc`}
            action={
              <Link to="/nhan-su" className="text-xs font-medium text-viridian-700 hover:underline">
                Ma trận huấn luyện →
              </Link>
            }
          />
          {activeEmp.length === 0 ? (
            <EmptyState title="Chưa có nhân sự" hint="Nhập danh sách tại Nhân sự & Huấn luyện" />
          ) : (
            <div className="space-y-3 px-4 py-4">
              {cov.map(({ c, pct, ok, total }) => (
                <div key={c}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-pine-800">{TRAINING_CATEGORY_LABELS[c]}</span>
                    <span className="text-pine-800/60">
                      {ok}/{total} · <b className="text-pine-800">{pct}%</b>
                    </span>
                  </div>
                  <Progress value={pct} tone={pct >= 95 ? 'green' : pct >= 80 ? 'amber' : 'red'} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Xếp loại đơn vị tháng này"
            hint="Theo số lần không đạt (thông số, khu vực, điểm thu gom, hành vi)"
            action={
              <Link to="/noi-quy" className="text-xs font-medium text-viridian-700 hover:underline">
                Nội quy & Vi phạm →
              </Link>
            }
          />
          {unitEval.length === 0 ? (
            <EmptyState title="Chưa có vi phạm trong tháng" hint="Các đơn vị được xếp loại A" />
          ) : (
            <ul className="divide-y divide-pine-800/5">
              {unitEval.slice(0, 5).map((u) => {
                const g = gradeOf(u.total).grade
                return (
                  <li key={u.department} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div>
                      <div className="text-sm font-medium text-pine-800">{u.department}</div>
                      <div className="text-xs text-pine-800/45">
                        {u.total} lần không đạt{u.open ? ' · ' + u.open + ' chưa khắc phục' : ''}
                      </div>
                    </div>
                    <Badge tone={g === 'A' ? 'green' : g === 'B' ? 'blue' : g === 'C' ? 'amber' : 'red'}>Loại {g}</Badge>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Hạn tuân thủ sắp đến" hint="Báo cáo, quan trắc, phí, giấy phép" />
          {pendingTasks.length === 0 ? (
            <EmptyState title="Không có việc đang chờ" hint="Thêm việc tại mục Hồ sơ & Tuân thủ" />
          ) : (
            <ul className="divide-y divide-pine-800/5">
              {pendingTasks.slice(0, 5).map((t: any) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-pine-800">{t.title}</div>
                    <div className="text-xs text-pine-800/45">Hạn: {fmtDate(t.due_date)}</div>
                  </div>
                  {dueLabel(t.due_date)}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Cảnh báo đang mở" hint="Vượt ngưỡng quan trắc, thiết bị, tuân thủ" />
          {openAlerts.length === 0 ? (
            <EmptyState title="Không có cảnh báo" />
          ) : (
            <ul className="divide-y divide-pine-800/5">
              {openAlerts.slice(0, 5).map((a: any) => (
                <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div className="text-sm text-pine-800">{a.message}</div>
                  <Badge tone={a.level === 'critical' ? 'red' : a.level === 'warning' ? 'amber' : 'gray'}>
                    {ALERT_LEVEL_LABELS[a.level] ?? a.level}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Sự cố đang xử lý" hint="Môi trường, cháy nổ, tai nạn lao động" />
          {openIncidents.length === 0 ? (
            <EmptyState title="Không có sự cố đang mở" />
          ) : (
            <ul className="divide-y divide-pine-800/5">
              {openIncidents.slice(0, 5).map((i: any) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div>
                    <div className="text-sm font-medium text-pine-800">{i.title}</div>
                    <div className="text-xs text-pine-800/45">{fmtDate(i.incident_date)}</div>
                  </div>
                  <Badge tone={i.severity === 'nghiem_trong' ? 'red' : i.severity === 'trung_binh' ? 'amber' : 'gray'}>
                    {SEVERITY_LABELS[i.severity] ?? i.severity}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="CTNH phát sinh 6 tháng gần nhất" hint="Tổng khối lượng ghi nhận (kg)" />
          <div className="px-2 py-3">
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#14261F14" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [fmtNum(Number(v)) + ' kg', 'CTNH']} />
                <Bar dataKey="total" fill="#16694A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
