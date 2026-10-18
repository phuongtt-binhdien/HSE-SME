// Hồ sơ HSE cá nhân: diễn tập đã tham gia, sức khỏe nghề nghiệp, vai trò trong bộ máy HSE, vi phạm; in hồ sơ
import { Printer } from 'lucide-react'
import { useMemo } from 'react'
import { Badge, Button, Table, Td, type Tone } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { useList } from '../../hooks/useCrud'
import { ATVSLD_GROUP_LABELS, TRAINING_CATEGORY_LABELS, TRAINING_RESULT_LABELS } from '../../lib/constants'
import { buildDrillMatrix, DRILL_COLUMNS, DRILL_KIND_LABELS, DRILL_STATE_LABELS, DRILL_STATE_TONE } from '../../lib/drills'
import { bnnStatus, DUE_STATE_LABELS, HEALTH_CHECK_KIND_LABELS, periodicStatus, type DueStatus, type HealthCheck } from '../../lib/health'
import { HSE_ROLE_LABELS, isActiveRole, type HseRole } from '../../lib/org'
import { blank, docHeader, esc, printDocument, signBlock } from '../../lib/print'
import type { Employee, TrainingCourse, TrainingRecord } from '../../lib/training'
import { fmtDate, todayISO } from '../../lib/utils'
import { useDrillData } from '../drills/DrillsManager'

const DUE_TONE: Record<string, Tone> = { dung_han: 'green', sap_den: 'amber', qua_han: 'red', chua: 'red', khong_yeu_cau: 'gray' }

export interface HistoryRow {
  r: TrainingRecord
  c: TrainingCourse
  expiry: string | null
}

function dueText(s: DueStatus) {
  if (s.state === 'khong_yeu_cau') return DUE_STATE_LABELS[s.state]
  if (s.state === 'chua') return 'Chưa có kết quả'
  return `${DUE_STATE_LABELS[s.state]}${s.due ? ' – hạn ' + fmtDate(s.due) : ''}`
}

export default function HseProfileSections({ employee, fid, history }: { employee: Employee; fid: string; history: HistoryRow[] }) {
  const { org, facility } = useAuth()
  const drill = useDrillData(fid)
  const roles = useList<HseRole>('hse_roles', { match: { facility_id: fid }, order: 'created_at', ascending: true, enabled: !!fid })
  const checks = useList<HealthCheck>('health_checks', { match: { facility_id: fid }, order: 'exam_date', ascending: false, enabled: !!fid })
  const violations = useList<any>('rule_violations', { match: { facility_id: fid }, order: 'violation_date', enabled: !!fid })

  const drillRow = useMemo(() => buildDrillMatrix([employee.id], drill.drills, drill.participants).get(employee.id)!, [employee.id, drill.drills, drill.participants])
  const myDrills = useMemo(() => {
    const byId = new Map(drill.drills.map((d) => [d.id, d]))
    return drill.participants
      .filter((p) => p.employee_id === employee.id && byId.get(p.drill_id))
      .map((p) => ({ p, d: byId.get(p.drill_id)! }))
      .sort((a, b) => b.d.drill_date.localeCompare(a.d.drill_date))
  }, [drill.drills, drill.participants, employee.id])
  const myRoles = (roles.data ?? []).filter((r) => r.employee_id === employee.id && isActiveRole(r))
  const myChecks = (checks.data ?? []).filter((c) => c.employee_id === employee.id)
  const ksk = periodicStatus(employee as any, checks.data ?? [])
  const bnn = bnnStatus(employee as any, checks.data ?? [])
  const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
  const myViolations = (violations.data ?? []).filter((v: any) => v.employee_id === employee.id && v.violation_date >= yearAgo)

  const print = () =>
    printDocument(
      'Hồ sơ HSE cá nhân',
      `${docHeader(org?.name ?? '', facility?.name ?? '')}
      <h1>Hồ sơ an toàn – sức khỏe – môi trường cá nhân</h1>
      <div class="sub">Lập ngày ${fmtDate(todayISO())}</div>
      <table class="grid">
        <tr><th style="width:28%">Họ và tên</th><td>${esc(employee.full_name)}</td><th style="width:18%">Mã NV</th><td>${blank(employee.code, 10)}</td></tr>
        <tr><th>Bộ phận</th><td>${blank(employee.department, 20)}</td><th>Chức danh</th><td>${blank(employee.position, 20)}</td></tr>
        <tr><th>Nhóm huấn luyện ATVSLĐ</th><td colspan="3">${employee.atvsld_group ? esc(ATVSLD_GROUP_LABELS[String(employee.atvsld_group)]) : 'Chưa xác định'}</td></tr>
        <tr><th>Vai trò trong bộ máy HSE</th><td colspan="3">${myRoles.length ? myRoles.map((r) => esc(HSE_ROLE_LABELS[r.role])).join('; ') : '—'}</td></tr>
      </table>
      <p><b>1. Huấn luyện</b></p>
      <table class="grid"><tr><th>Loại</th><th>Khóa</th><th>Ngày</th><th>Quyết định</th><th>Kết quả</th><th>Hạn</th></tr>
      ${history
        .map(
          ({ r, c, expiry }) =>
            `<tr><td>${esc(TRAINING_CATEGORY_LABELS[c.category])}</td><td>${esc(c.name)}</td><td>${fmtDate(c.start_date)}</td><td>${esc(c.decision_no ?? '')}</td><td>${esc(TRAINING_RESULT_LABELS[r.result])}</td><td>${fmtDate(expiry)}</td></tr>`
        )
        .join('') || '<tr><td colspan="6">Chưa có</td></tr>'}</table>
      <p><b>2. Diễn tập</b></p>
      <table class="grid"><tr><th>Ngày</th><th>Loại diễn tập</th><th>Tham gia</th><th>Nhiệm vụ</th></tr>
      ${myDrills
        .map(({ p, d }) => `<tr><td>${fmtDate(d.drill_date)}</td><td>${esc(DRILL_KIND_LABELS[d.kind] ?? d.kind)}${d.status === 'planned' ? ' (kế hoạch)' : ''}</td><td>${d.status === 'planned' ? 'Dự kiến' : p.attended ? 'Có mặt' : 'Vắng'}</td><td>${esc(p.role ?? '')}</td></tr>`)
        .join('') || '<tr><td colspan="4">Chưa có</td></tr>'}</table>
      <p><b>3. Sức khỏe nghề nghiệp</b>: khám định kỳ – ${esc(dueText(ksk))}; khám phát hiện BNN – ${esc(dueText(bnn))}.</p>
      ${signBlock(['Người lao động', 'Cán bộ phụ trách HSE'])}`
    )

  return (
    <div className="space-y-4 border-t border-pine-800/10 pt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-pine-800/50">Diễn tập đã tham gia</h4>
        <Button variant="ghost" onClick={print}>
          <Printer size={15} /> In hồ sơ HSE
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {DRILL_COLUMNS.map((col) => {
          const c = drillRow[col.key]
          return (
            <div key={col.key} className="rounded-lg border border-pine-800/10 p-2.5">
              <div className="text-xs font-semibold text-pine-800">{col.label}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge tone={DRILL_STATE_TONE[c.state]}>{DRILL_STATE_LABELS[c.state]}</Badge>
                {c.last && <span className="text-xs text-pine-800/60">{fmtDate(c.last.drill_date)}</span>}
              </div>
            </div>
          )
        })}
      </div>
      {myDrills.length > 0 && (
        <Table head={['Ngày', 'Loại diễn tập', 'Tham gia', 'Nhiệm vụ']}>
          {myDrills.map(({ p, d }) => (
            <tr key={p.id}>
              <Td className="whitespace-nowrap">{fmtDate(d.drill_date)}</Td>
              <Td>{DRILL_KIND_LABELS[d.kind] ?? d.kind}</Td>
              <Td>{d.status === 'planned' ? <Badge tone="blue">Dự kiến</Badge> : p.attended ? <Badge tone="green">Có mặt</Badge> : <Badge tone="amber">Vắng</Badge>}</Td>
              <Td className="text-pine-800/60">{p.role ?? '—'}</Td>
            </tr>
          ))}
        </Table>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-pine-800/10 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-pine-800/50">Sức khỏe nghề nghiệp</div>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="text-pine-800/70">Khám định kỳ</span>
              <Badge tone={DUE_TONE[ksk.state]}>{dueText(ksk)}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-pine-800/70">Khám phát hiện BNN</span>
              <Badge tone={DUE_TONE[bnn.state]}>{dueText(bnn)}</Badge>
            </div>
            {myChecks[0] && (
              <div className="text-xs text-pine-800/50">
                Lần gần nhất: {fmtDate(myChecks[0].exam_date)} – {HEALTH_CHECK_KIND_LABELS[myChecks[0].kind]}
                {myChecks[0].disease ? ` · ${myChecks[0].disease}` : ''}
              </div>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-pine-800/10 p-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-pine-800/50">Vai trò HSE · vi phạm 12 tháng</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {myRoles.length ? myRoles.map((r) => <Badge key={r.id} tone="blue">{HSE_ROLE_LABELS[r.role]}</Badge>) : <span className="text-sm text-pine-800/45">Chưa được phân công</span>}
          </div>
          <div className="mt-2 text-sm text-pine-800/70">
            {myViolations.length ? `${myViolations.length} lần vi phạm nội quy trong 12 tháng` : 'Không có vi phạm nội quy trong 12 tháng'}
          </div>
        </div>
      </div>
    </div>
  )
}
