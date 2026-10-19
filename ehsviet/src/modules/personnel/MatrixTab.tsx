// Ma trận huấn luyện: mỗi người × ATVSLĐ / PCCC / Sự cố chất thải với cột Khóa – Ngày – Quyết định
import { Download, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card, EmptyState, ErrorNote, Input, Kpi, Loading, Select, type Tone } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { TRAINING_CATEGORY_LABELS, TRAINING_CATEGORY_SHORT } from '../../lib/constants'
import { coverage, isValid, MATRIX_CATEGORIES, type CellStatus, type Employee, type TrainingRecord } from '../../lib/training'
import { cls, errMsg, fmtDate } from '../../lib/utils'
import { exportMatrixXlsx } from './excel'
import { byDeptThenCode, matchesSearch, STATE_CELL, StateBadge, type PersonnelData } from './shared'
import TrainingRecordModal from './TrainingRecordModal'

const FILTERS: Record<string, string> = {
  all: 'Tất cả',
  need: 'Cần huấn luyện (chưa / hết hạn)',
  soon: 'Sắp hết hạn (≤ 30 ngày)',
  ok: 'Đủ 3 loại còn hạn',
  ...Object.fromEntries(MATRIX_CATEGORIES.map((c) => ['need_' + c, 'Chưa đạt: ' + TRAINING_CATEGORY_LABELS[c]])),
}

const pctTone = (p: number): Tone => (p >= 95 ? 'green' : p >= 80 ? 'amber' : 'red')

export default function MatrixTab({ data, base, canEdit }: { data: PersonnelData; base: any; canEdit: boolean }) {
  const { facility } = useAuth()
  const { employees, courses, matrix, departments, loading } = data
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [filter, setFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [edit, setEdit] = useState<{ employee: Employee; category: string; record: TrainingRecord | null } | null>(null)
  const [err, setErr] = useState('')

  const active = employees.filter((e) => e.status === 'active')
  const cov = Object.fromEntries(MATRIX_CATEGORIES.map((c) => [c, coverage(employees, matrix, c)]))
  const needCount = active.filter((e) => MATRIX_CATEGORIES.some((c) => !isValid(matrix.get(e.id)![c]))).length
  const soonCount = active.filter((e) => MATRIX_CATEGORIES.some((c) => matrix.get(e.id)![c].state === 'sap_het')).length

  const rows = useMemo(() => {
    return employees
      .filter((e) => (showInactive ? true : e.status === 'active'))
      .filter((e) => !dept || e.department === dept)
      .filter((e) => matchesSearch(e, q))
      .filter((e) => {
        const row = matrix.get(e.id)
        if (!row) return false
        const cells = MATRIX_CATEGORIES.map((c) => row[c])
        if (filter === 'need') return cells.some((s) => !isValid(s))
        if (filter === 'soon') return cells.some((s) => s.state === 'sap_het')
        if (filter === 'ok') return cells.every(isValid)
        if (filter.startsWith('need_')) return !isValid(row[filter.slice(5)])
        return true
      })
      .sort(byDeptThenCode)
  }, [employees, matrix, q, dept, filter, showInactive])

  const exportXlsx = async () => {
    setErr('')
    try {
      await exportMatrixXlsx(rows, matrix, facility?.name ?? '')
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const open = (employee: Employee, category: string, s: CellStatus) =>
    setEdit({ employee, category, record: s.record ?? null })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Kpi label="Người lao động" value={active.length} sub={`${employees.length - active.length} đã nghỉ`} tone="blue" />
        {MATRIX_CATEGORIES.map((c) => (
          <Kpi
            key={c}
            label={TRAINING_CATEGORY_SHORT[c] + ' còn hiệu lực'}
            value={cov[c].pct + '%'}
            sub={`${cov[c].ok}/${cov[c].total} người`}
            tone={pctTone(cov[c].pct)}
          />
        ))}
        <Kpi label="Cần huấn luyện" value={needCount} sub={`${soonCount} người sắp hết hạn`} tone={needCount ? 'red' : 'green'} />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, họ tên, chức danh…" className="max-w-[220px]" />
          <Select value={dept} onChange={(e) => setDept(e.target.value)} className="max-w-[220px]" aria-label="Bộ phận">
            <option value="">Tất cả bộ phận</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[260px]" aria-label="Lọc trạng thái">
            {Object.entries(FILTERS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-1.5 text-xs text-pine-800/60">
            <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Hiện người đã nghỉ
          </label>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-pine-800/50">{rows.length} người</span>
            <Button variant="outline" onClick={exportXlsx} disabled={rows.length === 0}>
              <Download size={15} /> Xuất Excel
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 px-4 py-2 text-xs text-pine-800/60">
          <Legend cls="bg-viridian-50 border-viridian-600/30" label="Còn hạn" />
          <Legend cls="bg-amber-50 border-amber-600/30" label="Sắp hết hạn (≤ 30 ngày)" />
          <Legend cls="bg-red-50 border-red-600/30" label="Hết hạn / chưa huấn luyện" />
          <span className="text-pine-800/45">Bấm vào ô để ghi nhận hoặc sửa.</span>
        </div>
        {err && (
          <div className="px-4 pb-2">
            <ErrorNote message={err} />
          </div>
        )}
        {loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title={employees.length === 0 ? 'Chưa có nhân sự' : 'Không có người phù hợp bộ lọc'}
            hint={employees.length === 0 ? 'Thêm ở thẻ "Danh sách nhân sự" hoặc nhập từ Excel' : undefined}
          />
        ) : (
          <>
            {/* Bảng – màn hình rộng */}
            <div className="hidden max-h-[70vh] overflow-auto md:block">
              <table className="w-full border-separate border-spacing-0 text-left text-sm">
                <thead className="sticky top-0 z-10 bg-white text-xs text-pine-800/60">
                  <tr>
                    <Th rowSpan={2} className="w-10 text-center">STT</Th>
                    <Th rowSpan={2} className="sticky left-0 z-20 min-w-[190px] bg-white">Họ tên / mã NV</Th>
                    <Th rowSpan={2} className="min-w-[150px]">Bộ phận</Th>
                    <Th rowSpan={2} className="text-center">Nhóm</Th>
                    {MATRIX_CATEGORIES.map((c) => (
                      <Th key={c} colSpan={3} className="border-l border-pine-800/10 text-center font-semibold text-pine-800">
                        {TRAINING_CATEGORY_LABELS[c]}
                      </Th>
                    ))}
                  </tr>
                  <tr>
                    {MATRIX_CATEGORIES.map((c) =>
                      ['Khóa', 'Ngày', 'Quyết định'].map((h, i) => (
                        <Th
                          key={c + h}
                          className={cls(
                            i === 0 ? 'min-w-[170px] border-l border-pine-800/10' : i === 1 ? 'min-w-[110px]' : 'min-w-[125px]',
                            'font-medium'
                          )}
                        >
                          {h}
                        </Th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e, idx) => {
                    const row = matrix.get(e.id)!
                    return (
                      <tr key={e.id} className={cls('group', e.status !== 'active' && 'opacity-50')}>
                        <Td className="text-center text-pine-800/45">{idx + 1}</Td>
                        <Td className="sticky left-0 z-[1] bg-white group-hover:bg-[#FAFBFA]">
                          <div className="font-medium text-pine-800">{e.full_name}</div>
                          <div className="text-xs text-pine-800/45">
                            {e.code ?? '—'}
                            {e.position ? ' · ' + e.position : ''}
                          </div>
                        </Td>
                        <Td className="text-pine-800/70">{e.department ?? '—'}</Td>
                        <Td className="text-center text-pine-800/70">{e.atvsld_group ?? '—'}</Td>
                        {MATRIX_CATEGORIES.map((c) => (
                          <MatrixCells key={c} status={row[c]} canEdit={canEdit} onOpen={() => open(e, c, row[c])} />
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Thẻ – điện thoại */}
            <ul className="divide-y divide-pine-800/5 md:hidden">
              {rows.map((e) => {
                const row = matrix.get(e.id)!
                return (
                  <li key={e.id} className="px-4 py-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-medium text-pine-800">{e.full_name}</div>
                      <div className="text-xs text-pine-800/45">{e.code}</div>
                    </div>
                    <div className="text-xs text-pine-800/50">{e.department ?? '—'}</div>
                    <div className="mt-2 space-y-1.5">
                      {MATRIX_CATEGORIES.map((c) => {
                        const s = row[c]
                        return (
                          <button
                            key={c}
                            onClick={() => canEdit && open(e, c, s)}
                            className={cls('flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left', STATE_CELL[s.state])}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-pine-800">{TRAINING_CATEGORY_SHORT[c]}</div>
                              {s.course && (
                                <div className="truncate text-xs text-pine-800/60">
                                  {fmtDate(s.course.start_date)} · {s.course.decision_no ?? 'chưa có QĐ'}
                                </div>
                              )}
                            </div>
                            <StateBadge status={s} />
                          </button>
                        )
                      })}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>

      <TrainingRecordModal
        open={!!edit}
        onClose={() => setEdit(null)}
        base={base}
        employee={edit?.employee ?? null}
        category={edit?.category}
        record={edit?.record}
        courses={courses}
        canEdit={canEdit}
      />
    </div>
  )
}

function Legend({ cls: c, label }: { cls: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cls('inline-block h-3 w-3 rounded border', c)} />
      {label}
    </span>
  )
}

function Th({ children, className, ...rest }: any) {
  return (
    <th {...rest} className={cls('border-b border-pine-800/10 px-3 py-2 align-bottom font-medium', className)}>
      {children}
    </th>
  )
}

function Td({ children, className, ...rest }: any) {
  return (
    <td {...rest} className={cls('border-b border-pine-800/5 px-3 py-2 align-top', className)}>
      {children}
    </td>
  )
}

function MatrixCells({ status, canEdit, onOpen }: { status: CellStatus; canEdit: boolean; onOpen: () => void }) {
  const bg = STATE_CELL[status.state]
  const clickable = canEdit ? 'cursor-pointer hover:brightness-95' : ''
  if (status.state === 'chua') {
    return (
      <td colSpan={3} onClick={canEdit ? onOpen : undefined} className={cls('border-b border-l border-pine-800/10 px-3 py-2 align-top', bg, clickable)}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-red-700">{status.failed ? 'Không đạt – cần huấn luyện lại' : 'Chưa huấn luyện'}</span>
          {canEdit && (
            <span className="inline-flex items-center gap-1 text-xs text-viridian-700">
              <Plus size={13} /> Ghi nhận
            </span>
          )}
        </div>
      </td>
    )
  }
  const c = status.course!
  const sub =
    status.state === 'het_han'
      ? <span className="text-red-700">Hết hạn {fmtDate(status.expiry)}</span>
      : status.state === 'sap_het'
        ? <span className="text-amber-700">Còn {status.daysLeft} ngày</span>
        : status.expiry
          ? <span className="text-pine-800/45">Hạn {fmtDate(status.expiry)}</span>
          : null
  return (
    <>
      <td onClick={canEdit ? onOpen : undefined} title={c.name} className={cls('max-w-[220px] border-b border-l border-pine-800/10 px-3 py-2 align-top', bg, clickable)}>
        <div className="line-clamp-2 text-xs text-pine-800">{c.name}</div>
      </td>
      <td onClick={canEdit ? onOpen : undefined} className={cls('whitespace-nowrap border-b border-pine-800/5 px-3 py-2 align-top', bg, clickable)}>
        <div className="text-xs text-pine-800">{fmtDate(c.end_date || c.start_date)}</div>
        <div className="text-[11px]">{sub}</div>
      </td>
      <td onClick={canEdit ? onOpen : undefined} className={cls('whitespace-nowrap border-b border-pine-800/5 px-3 py-2 align-top', bg, clickable)}>
        <div className="text-xs text-pine-800">{c.decision_no ?? <span className="text-pine-800/35">—</span>}</div>
        {c.decision_date && <div className="text-[11px] text-pine-800/45">{fmtDate(c.decision_date)}</div>}
      </td>
    </>
  )
}
