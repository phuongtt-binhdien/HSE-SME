// Lộ trình Net Zero 2050: đường mục tiêu phát thải PV1 + PV2 và tỷ lệ năng lượng tái tạo so với số liệu kiểm kê thực tế,
// bảng mục tiêu theo năm và các mốc thực hiện.
import { useQueryClient } from '@tanstack/react-query'
import { FilePlus2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Kpi, Modal, Note, Select, Table, Td } from '../../components/UI'
import { useRemove, useSave } from '../../hooks/useCrud'
import { interp, NET_ZERO_TEMPLATES, planRows, ROADMAP_METRIC_LABELS, roadmapTargetRows, type RoadmapTarget, type TargetPoint } from '../../lib/plan'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtNum } from '../../lib/utils'
import PlanItems from './PlanItems'
import type { PlanData } from './usePlanData'

const GRID = '#E6E9E6'
const TICK = { fontSize: 11, fill: '#6F7470' }
const END = 2050

const series = (targets: RoadmapTarget[], metric: string): TargetPoint[] =>
  targets
    .filter((t) => t.metric === metric)
    .map((t) => ({ year: Number(t.year), value: Number(t.value) }))
    .sort((a, b) => a.year - b.year)

export default function NetZeroTab({ data, base, canEdit }: { data: PlanData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { items, targets, ghgYears } = data
  const save = useSave('roadmap_targets')
  const remove = useRemove('roadmap_targets')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const thisYear = new Date().getFullYear()

  const ghgT = useMemo(() => series(targets, 'ghg_total'), [targets])
  const reT = useMemo(() => series(targets, 'renewable_pct'), [targets])
  const complete = ghgYears.filter((g) => g.complete && g.year < thisYear)
  const latest = complete[complete.length - 1]
  const current = ghgYears.find((g) => g.year === thisYear && !g.complete)
  const baseYear = ghgT[0]?.year ?? complete[0]?.year
  const baseValue = ghgT[0]?.value ?? complete[0]?.total12

  const chartGhg = useMemo(() => {
    const start = Math.min(...[ghgT[0]?.year, complete[0]?.year].filter((x): x is number => x != null), thisYear)
    const actual = new Map(complete.map((g) => [g.year, g.total12]))
    return Array.from({ length: END - start + 1 }, (_, i) => {
      const y = start + i
      return { year: y, actual: actual.get(y) ?? null, target: interp(ghgT, y) }
    })
  }, [ghgT, complete, thisYear])

  const chartRe = useMemo(() => {
    const withRe = ghgYears.filter((g) => g.renewablePct != null)
    const start = Math.min(...[reT[0]?.year, withRe[0]?.year].filter((x): x is number => x != null), thisYear)
    const actual = new Map(withRe.map((g) => [g.year, g.renewablePct]))
    return Array.from({ length: END - start + 1 }, (_, i) => {
      const y = start + i
      return { year: y, actual: actual.get(y) ?? null, target: interp(reT, y) }
    })
  }, [reT, ghgYears, thisYear])

  const latestTarget = latest ? interp(ghgT, latest.year) : null
  const reLatest = [...ghgYears].reverse().find((g) => g.renewablePct != null)
  const nextRe = reT.find((t) => t.year >= thisYear)

  const submit = async () => {
    setErr('')
    const y = Number(form.year)
    const v = Number(form.value)
    if (!Number.isInteger(y) || y < 2000 || y > 2100) return setErr('Năm không hợp lệ.')
    if (form.value === '' || !Number.isFinite(v) || v < 0) return setErr('Nhập giá trị mục tiêu (≥ 0).')
    if (targets.some((t) => t.metric === form.metric && Number(t.year) === y && t.id !== form.id)) return setErr('Đã có mục tiêu của chỉ số này cho năm ' + y + '.')
    try {
      await save.mutateAsync({ ...(form.id ? { id: form.id } : base), metric: form.metric, year: y, value: v, note: form.note || null })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const loadTargets = async () => {
    if (!latest) return
    setErr('')
    const { error } = await supabase.from('roadmap_targets').insert(roadmapTargetRows(base, latest.year, Math.round(latest.total12)))
    if (error) setErr(errMsg(error))
    else qc.invalidateQueries()
  }

  // nhãn trục: các năm chẵn 5; năm đầu chỉ ghi khi cách mốc chẵn 5 kế tiếp ≥ 3 năm để không chồng chữ
  const tick = (first: number) => (y: number) => (y % 5 === 0 || (y === first && first % 5 <= 2) ? String(y) : '')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Kpi label={baseYear ? `Năm gốc ${baseYear}` : 'Năm gốc'} value={baseValue != null ? fmtNum(baseValue, 0) + ' tCO₂e' : '—'} sub="Phát thải phạm vi 1 + 2" tone="blue" />
        <Kpi
          label={latest ? `Phát thải ${latest.year}` : 'Phát thải năm gần nhất'}
          value={latest ? fmtNum(latest.total12, 0) + ' tCO₂e' : '—'}
          sub={
            latest && baseValue
              ? `${latest.total12 >= baseValue ? '+' : '−'}${fmtNum(Math.abs((latest.total12 / baseValue - 1) * 100), 1)}% so với năm gốc${latestTarget != null ? ` · đường mục tiêu ${fmtNum(latestTarget, 0)}` : ''}`
              : 'Chưa có năm đủ 12 tháng'
          }
          tone={latest && latestTarget != null ? (latest.total12 <= latestTarget ? 'green' : 'amber') : 'gray'}
        />
        <Kpi
          label={current ? `Lũy kế ${current.months} tháng ${thisYear}` : `Năm ${thisYear}`}
          value={current ? fmtNum(current.total12, 0) + ' tCO₂e' : '—'}
          sub={current && current.months ? `Ước cả năm ≈ ${fmtNum((current.total12 / current.months) * 12, 0)} tCO₂e` : 'Nhập tại ESG › Khí nhà kính'}
        />
        <Kpi
          label={reLatest ? `Năng lượng tái tạo ${reLatest.year}` : 'Năng lượng tái tạo'}
          value={reLatest?.renewablePct != null ? fmtNum(reLatest.renewablePct, 1) + '%' : '—'}
          sub={nextRe ? `Mục tiêu ${nextRe.year}: ${fmtNum(nextRe.value, 0)}%` : 'Chưa đặt mục tiêu'}
          tone={reLatest?.renewablePct != null && nextRe && reLatest.renewablePct >= nextRe.value ? 'green' : 'gray'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Phát thải KNK phạm vi 1 + 2 so với lộ trình" hint="Cột: kiểm kê các năm đủ 12 tháng · đường: mục tiêu nội suy giữa các mốc" />
          <div className="px-2 py-3">
            {ghgT.length || complete.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={chartGhg} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="year" tick={TICK} interval={0} tickFormatter={tick(chartGhg[0]?.year)} axisLine={{ stroke: '#C9CEC9' }} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNum(v, 0)} width={56} />
                  <Tooltip formatter={(v: any, n: any) => [v == null ? '—' : fmtNum(Number(v), 0) + ' tCO₂e', n]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar isAnimationActive={false} dataKey="actual" name="Thực tế" fill="#2a78d6" maxBarSize={22} radius={[3, 3, 0, 0]} />
                  <Line isAnimationActive={false} dataKey="target" name="Lộ trình" stroke="#1baf7a" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Chưa có số liệu kiểm kê, mục tiêu" />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Tỷ lệ năng lượng tái tạo" hint="Sinh khối, điện mặt trời / tổng năng lượng (GJ) theo Kiểm kê KNK" />
          <div className="px-2 py-3">
            {reT.length || chartRe.some((d) => d.actual != null) ? (
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={chartRe} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="year" tick={TICK} interval={0} tickFormatter={tick(chartRe[0]?.year)} axisLine={{ stroke: '#C9CEC9' }} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => v + '%'} width={44} />
                  <Tooltip formatter={(v: any, n: any) => [v == null ? '—' : fmtNum(Number(v), 1) + '%', n]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar isAnimationActive={false} dataKey="actual" name="Thực tế" fill="#eb6834" maxBarSize={22} radius={[3, 3, 0, 0]} />
                  <Line isAnimationActive={false} dataKey="target" name="Lộ trình" stroke="#1baf7a" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="Chưa có số liệu năng lượng tái tạo" />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Mục tiêu theo năm"
          hint="Mốc mục tiêu dùng để vẽ lộ trình; Ban Giám đốc phê duyệt giá trị chính thức"
          action={
            canEdit && (
              <div className="flex flex-wrap gap-2">
                {!ghgT.length && latest && (
                  <Button variant="outline" onClick={loadTargets}>
                    <FilePlus2 size={15} /> Lộ trình tham chiếu từ năm gốc {latest.year}
                  </Button>
                )}
                <Button onClick={() => setForm({ metric: 'ghg_total', year: thisYear + 1, value: '' })}>
                  <Plus size={15} /> Thêm mục tiêu
                </Button>
              </div>
            )
          }
        />
        {err && !form && (
          <div className="px-4 pt-3">
            <ErrorNote message={err} />
          </div>
        )}
        {targets.length === 0 ? (
          <EmptyState title="Chưa đặt mục tiêu" hint={latest ? undefined : 'Cần ít nhất một năm kiểm kê KNK đủ 12 tháng để làm năm gốc'} />
        ) : (
          <Table head={['Chỉ số', 'Năm', 'Mục tiêu', 'Ghi chú', '']}>
            {[...targets]
              .sort((a, b) => a.metric.localeCompare(b.metric) || a.year - b.year)
              .map((t) => (
                <tr key={t.id}>
                  <Td>{ROADMAP_METRIC_LABELS[t.metric]?.label ?? t.metric}</Td>
                  <Td>{t.year}</Td>
                  <Td className="whitespace-nowrap [font-variant-numeric:tabular-nums]">
                    {fmtNum(Number(t.value), 2)}
                    {ROADMAP_METRIC_LABELS[t.metric]?.unit === '%' ? '%' : ' ' + (ROADMAP_METRIC_LABELS[t.metric]?.unit ?? '')}
                  </Td>
                  <Td className="text-pine-800/60">{t.note ?? '—'}</Td>
                  <Td className="text-right">
                    {canEdit && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...t })}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" aria-label="Xóa" onClick={() => window.confirm('Xóa mục tiêu này?') && remove.mutate(t.id)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    )}
                  </Td>
                </tr>
              ))}
          </Table>
        )}
      </Card>

      <PlanItems
        horizon="net_zero"
        items={items.filter((p) => p.horizon === 'net_zero')}
        groupBy="year"
        base={base}
        canEdit={canEdit}
        title="Mốc thực hiện lộ trình Net Zero 2050"
        hint="Giải pháp, mốc năm và chỉ tiêu; cập nhật tiến độ hằng năm"
        defaultYear={thisYear + 1}
        loadTemplates={() => planRows(base, 'net_zero', NET_ZERO_TEMPLATES)}
        templateLabel="Nạp lộ trình tham chiếu cho nhà máy NPK"
        showKpis={false}
      />

      <Note>
        Bối cảnh: cam kết phát thải ròng bằng 0 vào năm 2050 (COP26); QĐ 896/QĐ-TTg ngày 26/7/2022; NDC cập nhật 2022 (giảm 15,8% tự lực, 43,5% có hỗ trợ quốc tế so với BAU năm
        2030). Nghĩa vụ cơ sở thuộc danh mục: kiểm kê KNK, kế hoạch và báo cáo giảm nhẹ theo NĐ 06/2022 sửa đổi bởi NĐ 119/2025, NĐ 83/2026. Đường mục tiêu trên là tham chiếu; chỉ công
        bố “trung hòa carbon”, “Net Zero” khi có kiểm kê được thẩm định và bù trừ bằng tín chỉ hợp lệ.
      </Note>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa mục tiêu' : 'Thêm mục tiêu'}
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            <Field label="Chỉ số">
              <Select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })}>
                {Object.entries(ROADMAP_METRIC_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label} ({v.unit})
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Năm" required>
                <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Field>
              <Field label={`Mục tiêu (${ROADMAP_METRIC_LABELS[form.metric]?.unit ?? ''})`} required>
                <Input type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </Field>
            </div>
            <Field label="Ghi chú">
              <Input value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </div>
  )
}
