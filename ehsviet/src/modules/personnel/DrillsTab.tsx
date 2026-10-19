// Diễn tập theo từng người: lần tham gia gần nhất (ngày, loại) với PCCC & CNCH, sự cố môi trường – chất thải, sự cố hóa chất
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, EmptyState, ErrorNote, Input, Kpi, Loading, Select, type Tone } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { buildDrillMatrix, DRILL_COLUMNS, DRILL_KIND_LABELS, DRILL_STATE_LABELS, DRILL_STATE_TONE, isDrillOk, type DrillCell } from '../../lib/drills'
import { cls, errMsg, fmtDate, todayISO } from '../../lib/utils'
import DrillsManager, { useDrillData } from '../drills/DrillsManager'
import { byDeptThenCode, matchesSearch, type PersonnelData } from './shared'

const pctTone = (p: number): Tone => (p >= 90 ? 'green' : p >= 70 ? 'amber' : 'red')

function CellView({ c }: { c: DrillCell }) {
  if (!c.last)
    return (
      <Badge tone={DRILL_STATE_TONE[c.state]}>{DRILL_STATE_LABELS[c.state]}</Badge>
    )
  return (
    <div>
      <div className="text-sm text-pine-800">{fmtDate(c.last.drill_date)}</div>
      <div className="text-[11px] text-pine-800/45">{DRILL_KIND_LABELS[c.last.kind]}</div>
      {c.state !== 'dat' && (
        <div className="mt-0.5">
          <Badge tone={DRILL_STATE_TONE[c.state]}>{c.state === 'sap_het' ? `Đến hạn ${fmtDate(c.due)}` : DRILL_STATE_LABELS[c.state]}</Badge>
        </div>
      )}
    </div>
  )
}

export default function DrillsTab({ data, base, canEdit }: { data: PersonnelData; base: Record<string, string>; canEdit: boolean }) {
  const { facility } = useAuth()
  const fid = base.facility_id
  const { employees, departments, loading } = data
  const drill = useDrillData(fid)
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [filter, setFilter] = useState('')
  const [err, setErr] = useState('')

  const active = useMemo(() => employees.filter((e) => e.status === 'active'), [employees])
  const matrix = useMemo(() => buildDrillMatrix(active.map((e) => e.id), drill.drills, drill.participants), [active, drill.drills, drill.participants])

  const cover = DRILL_COLUMNS.map((col) => {
    const ok = active.filter((e) => isDrillOk(matrix.get(e.id)![col.key])).length
    return { col, ok, pct: active.length ? Math.round((ok / active.length) * 100) : 0 }
  })
  const upcoming = drill.drills.filter((d) => d.status === 'planned' && d.drill_date >= todayISO()).sort((a, b) => a.drill_date.localeCompare(b.drill_date))

  const rows = useMemo(
    () =>
      active
        .filter((e) => !dept || e.department === dept)
        .filter((e) => matchesSearch(e, q))
        .filter((e) => !filter || !isDrillOk(matrix.get(e.id)![filter]))
        .sort(byDeptThenCode),
    [active, dept, q, filter, matrix]
  )

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const cols = ['STT', 'Mã NV', 'Họ tên', 'Bộ phận', 'Chức danh', ...DRILL_COLUMNS.flatMap((c) => [`${c.short} – ngày gần nhất`, `${c.short} – tình trạng`])]
      const sheet: any[][] = [
        [{ value: `THEO DÕI THAM GIA DIỄN TẬP · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        [`Lần tham gia gần nhất trong các đợt đã diễn tập; xuất ngày ${fmtDate(todayISO())}`],
        [],
        cols.map(head),
        ...rows.map((e, i) => {
          const r = matrix.get(e.id)!
          return [
            i + 1, e.code ?? '', e.full_name, e.department ?? '', e.position ?? '',
            ...DRILL_COLUMNS.flatMap((c) => [r[c.key].last ? fmtDate(r[c.key].last!.drill_date) : '', DRILL_STATE_LABELS[r[c.key].state]]),
          ].map((value) => ({ value }))
        }),
      ]
      const columns = [6, 9, 24, 24, 20, 13, 16, 13, 16, 13, 16].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`Tham_gia_dien_tap_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading || drill.loading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {cover.map(({ col, ok, pct }) => (
          // PCCC: toàn bộ người lao động cần biết phương án; sự cố môi trường, hóa chất: lực lượng ứng phó theo kế hoạch
          <Kpi key={col.key} label={`Diễn tập ${col.short} (12 tháng)`} value={pct + '%'} sub={`${ok}/${active.length} người đã tham gia`} tone={col.key === 'pccc' ? pctTone(pct) : 'blue'} />
        ))}
        <Kpi
          label="Đợt sắp tới"
          value={upcoming.length ? fmtDate(upcoming[0].drill_date) : '—'}
          sub={upcoming.length ? DRILL_KIND_LABELS[upcoming[0].kind] : 'chưa có kế hoạch'}
          tone="blue"
        />
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
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[280px]" aria-label="Lọc">
            <option value="">Tất cả người lao động</option>
            {DRILL_COLUMNS.map((c) => (
              <option key={c.key} value={c.key}>
                Chưa tham gia 12 tháng: {c.label}
              </option>
            ))}
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-pine-800/50">{rows.length} người</span>
            <Button variant="outline" onClick={exportXlsx} disabled={rows.length === 0}>
              <Download size={15} /> Xuất Excel
            </Button>
          </div>
        </div>
        {err && (
          <div className="px-4 pt-3">
            <ErrorNote message={err} />
          </div>
        )}
        {rows.length === 0 ? (
          <EmptyState title="Không có người phù hợp bộ lọc" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-pine-800/10 text-xs uppercase tracking-wide text-pine-800/50">
                  <th className="px-4 py-2.5 font-medium">Người lao động</th>
                  <th className="px-4 py-2.5 font-medium">Bộ phận</th>
                  {DRILL_COLUMNS.map((c) => (
                    <th key={c.key} className="px-4 py-2.5 font-medium">
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pine-800/5">
                {rows.map((e) => {
                  const r = matrix.get(e.id)!
                  return (
                    <tr key={e.id}>
                      <td className="min-w-[190px] px-4 py-2.5 align-top">
                        <div className="font-medium text-pine-800">{e.full_name}</div>
                        <div className="text-xs text-pine-800/45">
                          {e.code ?? '—'}
                          {e.position ? ' · ' + e.position : ''}
                        </div>
                      </td>
                      <td className="min-w-[150px] px-4 py-2.5 align-top text-pine-800/70">{e.department ?? '—'}</td>
                      {DRILL_COLUMNS.map((c) => (
                        <td key={c.key} className={cls('min-w-[150px] px-4 py-2.5 align-top', !isDrillOk(r[c.key]) && 'bg-amber-50/40')}>
                          <CellView c={r[c.key]} />
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <DrillsManager fid={fid} base={base} canEdit={canEdit} employees={employees} />
    </div>
  )
}
