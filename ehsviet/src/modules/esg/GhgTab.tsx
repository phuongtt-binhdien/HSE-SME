// Kiểm kê khí nhà kính cấp cơ sở: số liệu hoạt động × hệ số → tCO₂e theo phạm vi 1, 2, 3
import { useQueryClient } from '@tanstack/react-query'
import { Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Kpi,
  Loading,
  Modal,
  Note,
  Select,
  Table,
  Tabs,
  Td,
  Textarea,
} from '../../components/UI'
import {
  emissionT,
  GRID_EF,
  gridEfFor,
  GWP,
  presetByKey,
  presetFactors,
  SCOPE3_CATEGORY_LABELS,
  SCOPE_LABELS,
  SOURCE_PRESETS,
  summarize,
  type GhgActivity,
} from '../../lib/ghg'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtFixed, fmtNum } from '../../lib/utils'
import { saveMetric, type useEsgData } from './useEsgData'

type EsgData = ReturnType<typeof useEsgData>

/** Màu phạm vi — bảng màu phân loại đã kiểm định mù màu (thứ tự cố định) */
export const SCOPE_COLORS: Record<number, string> = { 1: '#2a78d6', 2: '#eb6834', 3: '#1baf7a' }
const GRID = '#E6E9E6'
const TICK = { fontSize: 11, fill: '#6F7470' }

const t1 = (v: number) => fmtNum(v, 1)
const periodLabel = (a: GhgActivity) => (a.month ? `T${a.month}/${a.year}` : `Cả năm ${a.year}`)

export default function GhgTab({ data, base, canEdit }: { data: EsgData; base: any; canEdit: boolean }) {
  const qc = useQueryClient()
  const { activities, years, metric, loading } = data
  const [year, setYear] = useState(() => years.find((y) => activities.some((a) => Number(a.year) === y)) ?? new Date().getFullYear())
  const [form, setForm] = useState<any>(null)
  const [prodForm, setProdForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState(false)

  const sum = useMemo(() => summarize(activities, year), [activities, year])
  const prodRow = metric(year, 'production_t')
  const production = prodRow?.value != null ? Number(prodRow.value) : null
  const intensity = production ? sum.total12 / production : null

  const rows = useMemo(
    () =>
      activities
        .filter((a) => Number(a.year) === year)
        .sort((a, b) => (a.month ?? 0) - (b.month ?? 0) || a.scope - b.scope || a.source_name.localeCompare(b.source_name, 'vi')),
    [activities, year]
  )

  // tổng hợp theo nguồn trong năm (cùng nguồn, cùng phạm vi, cùng đơn vị)
  const aggregated = useMemo(() => {
    const m = new Map<string, { scope: number; name: string; unit: string; value: number; t: number; bio: number; months: number }>()
    for (const a of rows) {
      const k = a.scope + '|' + a.source_name + '|' + a.activity_unit
      const x = m.get(k) ?? { scope: a.scope, name: a.source_name, unit: a.activity_unit, value: 0, t: 0, bio: 0, months: 0 }
      x.value += Number(a.activity_value)
      x.t += emissionT(a)
      x.bio += Number(a.biogenic_co2_t ?? 0)
      x.months += a.month ? 1 : 0
      m.set(k, x)
    }
    return [...m.values()].sort((a, b) => a.scope - b.scope || b.t - a.t)
  }, [rows])
  const totalAll = sum.s1 + sum.s2 + sum.s3

  // cảnh báo tính trùng: cùng nguồn vừa có số liệu cả năm vừa có số liệu tháng
  const doubleCount = useMemo(() => {
    const annual = new Set(rows.filter((a) => !a.month).map((a) => a.source_name))
    return [...new Set(rows.filter((a) => a.month && annual.has(a.source_name)).map((a) => a.source_name))]
  }, [rows])

  const monthly = sum.byMonth.filter((m) => m.s1 + m.s2 + m.s3 > 0)
  const lastMonth = monthly.length ? monthly[monthly.length - 1].month : 0
  const monthData = sum.byMonth.slice(0, lastMonth).map((m) => ({ ...m, label: 'T' + m.month }))

  const yearData = useMemo(
    () =>
      [...years]
        .sort((a, b) => a - b)
        .map((y) => {
          const s = summarize(activities, y)
          const p = metric(y, 'production_t')?.value
          return { year: String(y), s1: s.s1, s2: s.s2, s3: s.s3, total: s.total12, intensity: p ? s.total12 / Number(p) : null, has: s.hasData }
        })
        .filter((r) => r.has),
    [years, activities, metric]
  )

  const bySource = sum.bySource.slice(0, 10).map((s) => ({ ...s, short: s.name.length > 34 ? s.name.slice(0, 33) + '…' : s.name }))

  // ---------- Thêm / sửa số liệu ----------
  const applyPreset = (f: any, key: string, y = Number(f.year)) => {
    const p = presetByKey(key)!
    const fac = presetFactors(p, y)
    return {
      ...f,
      source_key: key,
      source_name: key === 'khac' ? f.source_name ?? '' : p.label,
      scope: key === 'khac' ? f.scope ?? 1 : p.scope,
      activity_unit: key === 'khac' ? f.activity_unit ?? '' : p.unit,
      ef_value: key === 'khac' ? f.ef_value ?? '' : Number(fac.ef.toFixed(4)),
      ef_source: key === 'dien_luoi' ? gridEfFor(y).source + ` (${gridEfFor(y).ef} kgCO₂/kWh)` : p.efSource,
    }
  }
  const openCreate = () => {
    setErr('')
    setForm(applyPreset({ year, month: '' }, 'than_lo_hoi', year))
  }
  const openEdit = (a: GhgActivity) => {
    setErr('')
    setForm({ ...a, month: a.month ?? '', scope3_category: a.scope3_category ?? '' })
  }

  const preview = useMemo(() => {
    if (!form) return null
    const v = Number(form.activity_value)
    const ef = Number(form.ef_value)
    if (!Number.isFinite(v) || !Number.isFinite(ef)) return null
    const p = presetByKey(form.source_key)
    const fac = p && p.key !== 'khac' ? presetFactors(p, Number(form.year)) : null
    return {
      t: (v * ef) / 1000,
      bio: fac?.biogenicKg ? (v * fac.biogenicKg) / 1000 : 0,
      gj: fac?.gj ? v * fac.gj : 0,
      toe: fac?.toe ? v * fac.toe : 0,
    }
  }, [form])

  const submit = async () => {
    setErr('')
    const v = Number(form.activity_value)
    const ef = Number(form.ef_value)
    if (!form.source_name?.trim()) return setErr('Nhập tên nguồn phát thải.')
    if (form.activity_value === '' || !Number.isFinite(v) || v < 0) return setErr('Nhập số liệu hoạt động hợp lệ.')
    if (form.ef_value === '' || !Number.isFinite(ef) || ef < 0) return setErr('Nhập hệ số phát thải hợp lệ.')
    const y = Number(form.year)
    if (!Number.isInteger(y) || y < 2000 || y > 2100) return setErr('Năm không hợp lệ.')
    setBusy(true)
    try {
      const payload = {
        year: y,
        month: form.month === '' || form.month == null ? null : Number(form.month),
        scope: Number(form.scope),
        source_key: form.source_key || 'khac',
        source_name: form.source_name.trim(),
        scope3_category: Number(form.scope) === 3 && form.scope3_category ? Number(form.scope3_category) : null,
        activity_value: v,
        activity_unit: form.activity_unit?.trim() || '',
        ef_value: ef,
        ef_source: form.ef_source?.trim() || null,
        biogenic_co2_t: preview?.bio ? Number(preview.bio.toFixed(3)) : null,
        energy_gj: preview?.gj ? Number(preview.gj.toFixed(2)) : null,
        toe: preview?.toe ? Number(preview.toe.toFixed(3)) : null,
        note: form.note?.trim() || null,
      }
      const { error } = form.id
        ? await supabase.from('ghg_activities').update(payload).eq('id', form.id)
        : await supabase.from('ghg_activities').insert({ ...base, ...payload })
      if (error) throw error
      await qc.invalidateQueries()
      if (y !== year) setYear(y)
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (a: GhgActivity) => {
    if (!window.confirm(`Xóa số liệu "${a.source_name}" (${periodLabel(a)})?`)) return
    const { error } = await supabase.from('ghg_activities').delete().eq('id', a.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const saveProduction = async () => {
    setErr('')
    const v = Number(prodForm.value)
    if (!Number.isFinite(v) || v <= 0) return setErr('Nhập sản lượng thành phẩm > 0.')
    try {
      await saveMetric(supabase, base, prodRow, year, 'production_t', { value: v, unit: 't', source: prodForm.source || null, note: prodForm.note || null })
      await qc.invalidateQueries()
      setProdForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const sheet: any[][] = [
        [{ value: `KIỂM KÊ KHÍ NHÀ KÍNH NĂM ${year} (phạm vi 1, 2${sum.s3 ? ', 3' : ''})`, fontWeight: 'bold', columnSpan: 6 }, null, null, null, null, null],
        ['Phạm vi 1 (tCO₂e)', Number(sum.s1.toFixed(2))],
        ['Phạm vi 2 (tCO₂e)', Number(sum.s2.toFixed(2))],
        ['Phạm vi 3 (tCO₂e)', Number(sum.s3.toFixed(2))],
        ['Tổng phạm vi 1 + 2 (tCO₂e)', Number(sum.total12.toFixed(2))],
        ['CO₂ sinh khối – báo cáo riêng (t)', Number(sum.biogenic.toFixed(2))],
        ['Sản lượng thành phẩm (t)', production ?? ''],
        ['Cường độ (tCO₂e/t thành phẩm)', intensity != null ? Number(intensity.toFixed(4)) : ''],
        ['Năng lượng quy đổi (TOE)', Number(sum.toe.toFixed(1))],
        [`GWP: CH₄ ${GWP.CH4}, N₂O ${GWP.N2O} (IPCC AR6)`],
        [],
        ['Kỳ', 'Phạm vi', 'Hạng mục PV3', 'Nguồn phát thải', 'Số liệu hoạt động', 'Đơn vị', 'Hệ số (kgCO₂e/đơn vị)', 'Nguồn hệ số', 'tCO₂e', 'CO₂ sinh khối (t)', 'GJ', 'TOE', 'Ghi chú'].map(head),
        ...rows.map((a) => [
          periodLabel(a),
          a.scope,
          a.scope3_category ? SCOPE3_CATEGORY_LABELS[String(a.scope3_category)] : '',
          a.source_name,
          Number(a.activity_value),
          a.activity_unit,
          Number(a.ef_value),
          a.ef_source ?? '',
          Number(emissionT(a).toFixed(3)),
          a.biogenic_co2_t ?? '',
          a.energy_gj ?? '',
          a.toe ?? '',
          a.note ?? '',
        ]),
      ]
      const columns = [{ width: 14 }, { width: 8 }, { width: 18 }, { width: 38 }, { width: 14 }, { width: 9 }, { width: 14 }, { width: 50 }, { width: 11 }, { width: 12 }, { width: 11 }, { width: 10 }, { width: 24 }]
      await writeXlsxFile(sheet, { columns } as any).toFile(`Kiem_ke_KNK_${year}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="max-w-[140px]" aria-label="Năm kiểm kê">
          {years.map((y) => (
            <option key={y} value={y}>
              Năm {y}
            </option>
          ))}
        </Select>
        <span className="text-sm text-pine-800/60">
          Sản lượng thành phẩm: <b className="text-pine-800">{production != null ? fmtNum(production, 0) + ' t' : 'chưa nhập'}</b>
          {prodRow?.note ? ` (${prodRow.note})` : ''}
        </span>
        {canEdit && (
          <Button variant="ghost" onClick={() => setProdForm({ value: production ?? '', source: prodRow?.source ?? '', note: prodRow?.note ?? '' })}>
            <Pencil size={14} /> Sản lượng
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportXlsx} disabled={!rows.length}>
            <Download size={15} /> Xuất Excel
          </Button>
          {canEdit && (
            <Button onClick={openCreate}>
              <Plus size={15} /> Nhập số liệu
            </Button>
          )}
        </div>
      </div>

      {err && !form && !prodForm && <ErrorNote message={err} />}

      <div className="flex flex-wrap gap-2">
        <Kpi label="Phạm vi 1" value={t1(sum.s1)} sub="tCO₂e – đốt nhiên liệu, môi chất lạnh…" tone="blue" />
        <Kpi label="Phạm vi 2" value={t1(sum.s2)} sub="tCO₂e – điện lưới" tone="amber" />
        <Kpi label="Tổng PV1 + PV2" value={t1(sum.total12)} sub={sum.s3 ? `+ PV3 ${t1(sum.s3)} t` : 'tCO₂e'} tone="gray" />
        <Kpi
          label="Cường độ phát thải"
          value={intensity != null ? fmtFixed(intensity, 4) : '—'}
          sub={intensity != null ? 'tCO₂e/t thành phẩm' : 'Nhập sản lượng để tính'}
          tone="gray"
        />
        <Kpi
          label="Năng lượng quy đổi"
          value={fmtNum(sum.toe, 0) + ' TOE'}
          sub={sum.toe >= 1000 ? '≥ 1.000 TOE: cơ sở sử dụng NL trọng điểm' : 'TOE trong năm'}
          tone={sum.toe >= 1000 ? 'amber' : 'gray'}
        />
        {sum.biogenic > 0 && <Kpi label="CO₂ sinh khối" value={t1(sum.biogenic)} sub="t – báo cáo riêng, không cộng PV1" tone="green" />}
      </div>

      {doubleCount.length > 0 && (
        <Note tone="amber">
          Có nguồn vừa nhập số liệu <b>cả năm</b> vừa nhập <b>theo tháng</b> trong năm {year}: {doubleCount.join(', ')} — kiểm tra để tránh tính trùng.
        </Note>
      )}

      {!sum.hasData ? (
        <Card>
          <EmptyState title={'Chưa có số liệu KNK năm ' + year} hint="Nhập số liệu hoạt động: than, dầu DO, xăng, điện, môi chất lạnh…" />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Phát thải theo nguồn" hint={`tCO₂e năm ${year} · màu theo phạm vi`} action={<ScopeLegend scopes={[...new Set(bySource.map((s) => s.scope))]} />} />
            <div className="px-2 py-3">
              <ResponsiveContainer width="100%" height={Math.max(140, bySource.length * 34 + 40)}>
                <BarChart data={bySource} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }} barCategoryGap={6}>
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis type="number" tick={TICK} axisLine={{ stroke: '#C9CEC9' }} tickLine={false} tickFormatter={(v) => fmtNum(v, 0)} />
                  <YAxis type="category" dataKey="short" width={220} tick={{ ...TICK, fill: '#3F4642' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(20,38,31,0.04)' }}
                    formatter={(v: any, _n: any, p: any) => [t1(Number(v)) + ' tCO₂e', SCOPE_LABELS[String(p?.payload?.scope)]]}
                    labelFormatter={(_l: any, p: any) => p?.[0]?.payload?.name ?? ''}
                  />
                  <Bar isAnimationActive={false} dataKey="t" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {bySource.map((s) => (
                      <Cell key={s.name + s.scope} fill={SCOPE_COLORS[s.scope]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader
              title={monthData.length ? 'Phát thải theo tháng' : 'Phát thải theo năm'}
              hint={monthData.length ? `tCO₂e năm ${year} (số liệu nhập theo tháng)` : 'tCO₂e – phạm vi 1, 2, 3'}
              action={<ScopeLegend scopes={[1, 2, ...(sum.s3 ? [3] : [])]} />}
            />
            <div className="px-2 py-3">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthData.length ? monthData : yearData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey={monthData.length ? 'label' : 'year'} tick={TICK} axisLine={{ stroke: '#C9CEC9' }} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNum(v, 0)} width={56} />
                  <Tooltip cursor={{ fill: 'rgba(20,38,31,0.04)' }} formatter={(v: any, n: any) => [t1(Number(v)) + ' tCO₂e', n]} />
                  <Bar isAnimationActive={false} dataKey="s1" name="Phạm vi 1" stackId="s" fill={SCOPE_COLORS[1]} stroke="#fff" strokeWidth={2} maxBarSize={40} />
                  <Bar isAnimationActive={false}
                    dataKey="s2"
                    name="Phạm vi 2"
                    stackId="s"
                    fill={SCOPE_COLORS[2]}
                    stroke="#fff"
                    strokeWidth={2}
                    maxBarSize={40}
                    radius={sum.s3 ? undefined : [4, 4, 0, 0]}
                  />
                  {sum.s3 > 0 && <Bar isAnimationActive={false} dataKey="s3" name="Phạm vi 3" stackId="s" fill={SCOPE_COLORS[3]} stroke="#fff" strokeWidth={2} maxBarSize={40} radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {yearData.length > 1 && (
        <Card>
          <CardHeader title="So sánh các năm" hint="Tổng phát thải và cường độ (mẫu số: tấn thành phẩm) – năm hiện tại là số lũy kế" />
          <div className="grid gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yearData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="year" tick={TICK} axisLine={{ stroke: '#C9CEC9' }} tickLine={false} />
                <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNum(v, 0)} width={56} />
                <Tooltip cursor={{ fill: 'rgba(20,38,31,0.04)' }} formatter={(v: any, n: any) => [t1(Number(v)) + ' tCO₂e', n]} />
                <Bar isAnimationActive={false} dataKey="s1" name="Phạm vi 1" stackId="y" fill={SCOPE_COLORS[1]} stroke="#fff" strokeWidth={2} maxBarSize={48} />
                <Bar isAnimationActive={false} dataKey="s2" name="Phạm vi 2" stackId="y" fill={SCOPE_COLORS[2]} stroke="#fff" strokeWidth={2} maxBarSize={48} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid content-start gap-2 sm:grid-cols-2 md:grid-cols-1">
              {yearData.map((r, i) => {
                const prev = yearData[i - 1]
                const delta = prev?.intensity && r.intensity ? ((r.intensity - prev.intensity) / prev.intensity) * 100 : null
                return (
                  <div key={r.year} className="flex items-baseline justify-between rounded-lg border border-pine-800/10 px-3 py-2">
                    <div>
                      <div className="text-xs text-pine-800/50">Năm {r.year}</div>
                      <div className="text-sm font-semibold text-pine-800">{t1(r.total)} tCO₂e</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-pine-800">{r.intensity != null ? fmtFixed(r.intensity, 4) : '—'}</div>
                      <div className="text-[11px] text-pine-800/50">
                        tCO₂e/t
                        {delta != null && (
                          <span className={delta <= 0 ? ' text-viridian-700' : ' text-red-700'}>
                            {' '}
                            {delta <= 0 ? '▼' : '▲'} {fmtNum(Math.abs(delta), 1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title={`Số liệu hoạt động năm ${year}`}
          hint="Hệ số được lưu cố định theo từng dòng; sửa hệ số mẫu không làm đổi số liệu đã kiểm kê"
          action={
            rows.length > 0 && (
              <Tabs
                tabs={[
                  { key: 'tong', label: 'Tổng hợp theo nguồn' },
                  { key: 'chi-tiet', label: `Chi tiết (${rows.length} dòng)` },
                ]}
                active={detail ? 'chi-tiet' : 'tong'}
                onChange={(k) => setDetail(k === 'chi-tiet')}
              />
            )
          }
        />
        {rows.length === 0 ? (
          <EmptyState title="Chưa có số liệu" />
        ) : !detail ? (
          <Table head={['Phạm vi', 'Nguồn phát thải', 'Số liệu hoạt động', 'Hệ số bình quân kgCO₂e/đv', 'tCO₂e', 'Tỷ trọng']}>
            {aggregated.map((a) => (
              <tr key={a.scope + a.name + a.unit}>
                <Td>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-pine-800/70">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SCOPE_COLORS[a.scope] }} />
                    PV{a.scope}
                  </span>
                </Td>
                <Td>
                  <div className="font-medium">{a.name}</div>
                  {a.months > 0 && <div className="text-xs text-pine-800/45">{a.months} kỳ tháng</div>}
                </Td>
                <Td className="whitespace-nowrap">
                  {fmtNum(a.value, 2)} {a.unit}
                </Td>
                <Td className="whitespace-nowrap text-pine-800/70">{a.value ? fmtNum((a.t * 1000) / a.value, 4) : '—'}</Td>
                <Td className="whitespace-nowrap font-semibold">
                  {fmtNum(a.t, 2)}
                  {a.bio ? <div className="text-xs font-normal text-viridian-700">+ {fmtNum(a.bio, 1)} t CO₂ sinh khối</div> : null}
                </Td>
                <Td className="whitespace-nowrap text-pine-800/70">{totalAll ? fmtNum((a.t / totalAll) * 100, 1) + '%' : '—'}</Td>
              </tr>
            ))}
            <tr className="bg-pine-800/[0.03] font-semibold">
              <Td />
              <Td>Tổng phạm vi 1 + 2{sum.s3 ? ' + 3' : ''}</Td>
              <Td />
              <Td />
              <Td className="whitespace-nowrap">{fmtNum(totalAll, 2)}</Td>
              <Td>100%</Td>
            </tr>
          </Table>
        ) : (
          <Table head={['Kỳ', 'Phạm vi', 'Nguồn phát thải', 'Số liệu hoạt động', 'Hệ số kgCO₂e/đv', 'tCO₂e', 'Ghi chú', '']}>
            {rows.map((a) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-pine-800/70">{periodLabel(a)}</Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-pine-800/70">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SCOPE_COLORS[a.scope] }} />
                    PV{a.scope}
                  </span>
                </Td>
                <Td>
                  <div className="font-medium">{a.source_name}</div>
                  {a.scope3_category && <div className="text-xs text-pine-800/45">{SCOPE3_CATEGORY_LABELS[String(a.scope3_category)]}</div>}
                </Td>
                <Td className="whitespace-nowrap">
                  {fmtNum(Number(a.activity_value), 2)} {a.activity_unit}
                </Td>
                <Td className="whitespace-nowrap text-pine-800/70" >
                  <span title={a.ef_source ?? ''}>{fmtNum(Number(a.ef_value), 4)}</span>
                </Td>
                <Td className="whitespace-nowrap font-semibold">
                  {fmtNum(emissionT(a), 2)}
                  {a.biogenic_co2_t ? <div className="text-xs font-normal text-viridian-700">+ {fmtNum(a.biogenic_co2_t, 1)} t CO₂ sinh khối</div> : null}
                </Td>
                <Td className="max-w-[200px] text-xs text-pine-800/50">{a.note ?? ''}</Td>
                <Td className="text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" aria-label="Sửa" onClick={() => openEdit(a)}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" aria-label="Xóa" onClick={() => remove(a)}>
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

      <Note>
        <b>Phương pháp:</b> GHG Protocol / IPCC 2006; phát thải = số liệu hoạt động × hệ số (CO₂ + CH₄×{GWP.CH4} + N₂O×{GWP.N2O}, GWP IPCC AR6).
        Điện lưới: {GRID_EF.map((g) => `${g.ef} kgCO₂/kWh (năm ${g.dataYear})`).join('; ')} — dùng hệ số công bố gần nhất trước năm kiểm kê.
        CO₂ từ sinh khối báo cáo riêng. <b>Nghĩa vụ:</b> kiểm kê KNK cấp cơ sở 2 năm/lần và báo cáo giảm nhẹ hằng năm theo NĐ 06/2022/NĐ-CP (sửa đổi
        bởi NĐ 119/2025/NĐ-CP), nộp trước 31/3; từ kỳ báo cáo 2027 dùng GRI 102: Climate Change 2025 thay GRI 305-1…5.
        Ghi rõ định nghĩa sản lượng (thành phẩm) khi tính cường độ.
      </Note>

      {/* Nhập / sửa số liệu */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? 'Sửa số liệu hoạt động' : 'Nhập số liệu hoạt động KNK'}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={busy}>
              Lưu
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Năm" required>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) =>
                    setForm(form.source_key === 'dien_luoi' ? applyPreset({ ...form, year: e.target.value }, 'dien_luoi', Number(e.target.value)) : { ...form, year: e.target.value })
                  }
                />
              </Field>
              <Field label="Kỳ">
                <Select value={form.month ?? ''} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                  <option value="">Cả năm</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Nguồn mẫu">
                <Select value={form.source_key ?? 'khac'} onChange={(e) => setForm(applyPreset(form, e.target.value))}>
                  {[1, 2].map((sc) => (
                    <optgroup key={sc} label={SCOPE_LABELS[String(sc)]}>
                      {SOURCE_PRESETS.filter((p) => p.scope === sc && p.key !== 'khac').map((p) => (
                        <option key={p.key} value={p.key}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="khac">Nguồn khác / phạm vi 3 (tự nhập hệ số)</option>
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Tên nguồn phát thải" required className="sm:col-span-2">
                <Input value={form.source_name ?? ''} onChange={(e) => setForm({ ...form, source_name: e.target.value })} />
              </Field>
              <Field label="Phạm vi">
                <Select value={form.scope} disabled={form.source_key !== 'khac'} onChange={(e) => setForm({ ...form, scope: Number(e.target.value) })}>
                  {[1, 2, 3].map((s) => (
                    <option key={s} value={s}>
                      {SCOPE_LABELS[String(s)]}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {Number(form.scope) === 3 && (
              <Field label="Hạng mục phạm vi 3 (GHG Protocol)">
                <Select value={form.scope3_category ?? ''} onChange={(e) => setForm({ ...form, scope3_category: e.target.value })}>
                  <option value="">— Chọn —</option>
                  {Object.entries(SCOPE3_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Số liệu hoạt động" required>
                <Input type="number" step="any" min={0} value={form.activity_value ?? ''} onChange={(e) => setForm({ ...form, activity_value: e.target.value })} />
              </Field>
              <Field label="Đơn vị">
                <Input value={form.activity_unit ?? ''} disabled={form.source_key !== 'khac'} onChange={(e) => setForm({ ...form, activity_unit: e.target.value })} />
              </Field>
              <Field label="Hệ số (kgCO₂e / đơn vị)" required>
                <Input type="number" step="any" min={0} value={form.ef_value ?? ''} onChange={(e) => setForm({ ...form, ef_value: e.target.value })} />
              </Field>
            </div>
            <Field label="Nguồn hệ số">
              <Input value={form.ef_source ?? ''} onChange={(e) => setForm({ ...form, ef_source: e.target.value })} />
            </Field>
            <Field label="Ghi chú (nguồn số liệu: hóa đơn, phiếu xuất kho, sổ…)">
              <Textarea rows={2} value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            {preview && (
              <div className="grid gap-2 rounded-lg bg-pine-800/[0.03] px-3 py-2 text-sm sm:grid-cols-4">
                <div>
                  <span className="text-pine-800/50">Phát thải: </span>
                  <b>{fmtNum(preview.t, 3)} tCO₂e</b>
                </div>
                {preview.bio > 0 && (
                  <div>
                    <span className="text-pine-800/50">CO₂ sinh khối: </span>
                    {fmtNum(preview.bio, 2)} t
                  </div>
                )}
                {preview.gj > 0 && (
                  <div>
                    <span className="text-pine-800/50">Năng lượng: </span>
                    {fmtNum(preview.gj, 1)} GJ
                  </div>
                )}
                {preview.toe > 0 && (
                  <div>
                    <span className="text-pine-800/50">Quy đổi: </span>
                    {fmtNum(preview.toe, 2)} TOE
                  </div>
                )}
              </div>
            )}
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>

      {/* Sản lượng thành phẩm */}
      <Modal
        open={!!prodForm}
        onClose={() => setProdForm(null)}
        title={'Sản lượng thành phẩm năm ' + year}
        footer={
          <>
            <Button variant="outline" onClick={() => setProdForm(null)}>
              Hủy
            </Button>
            <Button onClick={saveProduction}>Lưu</Button>
          </>
        }
      >
        {prodForm && (
          <div className="space-y-3">
            <Field label="Sản lượng thành phẩm (tấn)" required>
              <Input type="number" min={0} step="any" value={prodForm.value} onChange={(e) => setProdForm({ ...prodForm, value: e.target.value })} />
            </Field>
            <Field label="Nguồn số liệu">
              <Input value={prodForm.source} onChange={(e) => setProdForm({ ...prodForm, source: e.target.value })} placeholder="VD: Báo cáo sản xuất năm" />
            </Field>
            <Field label="Ghi chú">
              <Input value={prodForm.note} onChange={(e) => setProdForm({ ...prodForm, note: e.target.value })} placeholder="VD: lũy kế 9 tháng" />
            </Field>
            <Note>Mẫu số cường độ phát thải và cường độ năng lượng. Dùng thống nhất một định nghĩa (thành phẩm), không trộn với sản lượng tạo hạt + trộn.</Note>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </div>
  )
}

function ScopeLegend({ scopes }: { scopes: number[] }) {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-pine-800/70">
      {[...scopes].sort().map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SCOPE_COLORS[s] }} />
          Phạm vi {s}
        </span>
      ))}
    </div>
  )
}
