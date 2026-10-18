// Dòng tuần hoàn: vật liệu hồi lưu trong công nghệ, bao bì tái sử dụng, nước sau xử lý tái sử dụng,
// chất thải đưa đi tái chế / đồng xử lý (khi chưa ghi ở module Chất thải). Nhập theo tháng hoặc cả năm.
import { useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Download, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Kpi, Loading, Modal, Note, Select, Table, Td, Textarea } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { useRemove, useSave } from '../../hooks/useCrud'
import {
  CIRCULAR_ROUTE_LABELS,
  CIRCULAR_STREAM_LABELS,
  type CircularFlow,
  streamUnit,
  wasteFate,
  waterReuse,
} from '../../lib/circular'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtNum, todayISO } from '../../lib/utils'
import type { CircularData } from './useCircularData'

const PROCESS = ['bui_hoi_luu', 'hat_ngoai_co', 'phe_pham']
const WASTE_STREAMS = ['xi_than', 'bun_htxlnt', 'dau_thai']
const STREAM_ORDER = Object.keys(CIRCULAR_STREAM_LABELS)
const STREAM_COLORS: Record<string, string> = { bui_hoi_luu: '#2a78d6', hat_ngoai_co: '#1baf7a', phe_pham: '#eb6834', bao_bi_tai_su_dung: '#7a5af8' }
const DEFAULTS: Record<string, { route: string; destination: string }> = {
  bui_hoi_luu: { route: 'tai_su_dung_tai_cho', destination: 'Hồi lưu về băng tải cấp liệu tạo hạt' },
  hat_ngoai_co: { route: 'tai_su_dung_tai_cho', destination: 'Nghiền, hồi lưu tạo hạt' },
  phe_pham: { route: 'tai_su_dung_tai_cho', destination: 'Tái chế phối trộn lại' },
  nuoc_tuan_hoan: { route: 'tai_su_dung_tai_cho', destination: 'Tưới cây, rửa đường nội bộ' },
  nuoc_mua: { route: 'tai_su_dung_tai_cho', destination: 'Bể chứa – tưới cây, dự trữ PCCC' },
  bao_bi_tai_su_dung: { route: 'tai_su_dung_tai_cho', destination: 'Bao jumbo, pallet dùng lại' },
  xi_than: { route: 'tai_che_ben_ngoai', destination: 'Cơ sở sản xuất vật liệu xây dựng' },
  bun_htxlnt: { route: 'dong_xu_ly', destination: '' },
  dau_thai: { route: 'tai_che_ben_ngoai', destination: '' },
  khac: { route: 'tai_su_dung_tai_cho', destination: '' },
}
const GRID = '#E6E9E6'
const TICK = { fontSize: 11, fill: '#6F7470' }
const periodLabel = (m: number | null) => (m ? `T${m}` : 'Cả năm')

export default function FlowsTab({ data, base, canEdit }: { data: CircularData; base: Record<string, string>; canEdit: boolean }) {
  const { facility } = useAuth()
  const qc = useQueryClient()
  const { flows, wasteMass, wwLogs, metric, loading } = data
  const save = useSave('circular_flows')
  const remove = useRemove('circular_flows')
  const thisYear = new Date().getFullYear()
  const years = useMemo(() => {
    const s = new Set<number>([thisYear])
    for (const f of flows) s.add(Number(f.year))
    return [...s].sort((a, b) => b - a)
  }, [flows, thisYear])
  const [year, setYear] = useState(thisYear)
  const [filter, setFilter] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [batch, setBatch] = useState<any>(null)
  const [err, setErr] = useState('')

  const rows = useMemo(
    () =>
      flows
        .filter((f) => Number(f.year) === year)
        .sort((a, b) => (b.month ?? 13) - (a.month ?? 13) || STREAM_ORDER.indexOf(a.stream) - STREAM_ORDER.indexOf(b.stream)),
    [flows, year]
  )
  const sumOf = (pred: (f: CircularFlow) => boolean) => rows.filter(pred).reduce((s, f) => s + Number(f.quantity ?? 0), 0)
  const processT = sumOf((f) => PROCESS.includes(f.stream))
  const packT = sumOf((f) => f.stream === 'bao_bi_tai_su_dung')
  const production = metric(year, 'production_t')
  const water = waterReuse(rows, year, metric(year, 'GRI 303-4'), wwLogs)
  const fate = useMemo(() => wasteFate(wasteMass, year), [wasteMass, year])

  const monthly = rows.some((f) => f.month != null)
  const chart = useMemo(() => {
    if (monthly)
      return Array.from({ length: 12 }, (_, i) => {
        const o: Record<string, any> = { label: 'T' + (i + 1) }
        for (const s of [...PROCESS, 'bao_bi_tai_su_dung']) o[s] = rows.filter((f) => f.month === i + 1 && f.stream === s).reduce((a, f) => a + Number(f.quantity), 0)
        return o
      }).filter((o) => PROCESS.some((s) => o[s] > 0) || o.bao_bi_tai_su_dung > 0)
    return [...PROCESS, 'bao_bi_tai_su_dung'].map((s) => ({ label: CIRCULAR_STREAM_LABELS[s].split(' (')[0], [s]: sumOf((f) => f.stream === s) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, monthly])

  const pivot = useMemo(() => {
    const streams = STREAM_ORDER.filter((s) => rows.some((f) => f.stream === s))
    return streams.map((s) => {
      const mine = rows.filter((f) => f.stream === s)
      const byMonth = Array.from({ length: 12 }, (_, i) => mine.filter((f) => f.month === i + 1).reduce((a, f) => a + Number(f.quantity), 0))
      const annual = mine.filter((f) => f.month == null).reduce((a, f) => a + Number(f.quantity), 0)
      return { s, unit: mine[0]?.unit ?? streamUnit(s), byMonth, annual, total: byMonth.reduce((a, b) => a + b, 0) + annual }
    })
  }, [rows])

  const openBatch = (month: number | null) => {
    const values: Record<string, any> = {}
    for (const s of STREAM_ORDER) {
      const ex = flows.filter((f) => Number(f.year) === year && (f.month ?? null) === month && f.stream === s)
      values[s] = ex.length
        ? { id: ex[0].id, quantity: String(ex[0].quantity), route: ex[0].route, destination: ex[0].destination ?? '', more: ex.length - 1 }
        : { quantity: '', ...DEFAULTS[s] }
    }
    setErr('')
    setBatch({ month, values })
  }

  const submitBatch = async () => {
    setErr('')
    const entries = Object.entries(batch.values as Record<string, any>).filter(([, v]) => v.quantity !== '' && v.quantity != null)
    for (const [s, v] of entries)
      if (!(Number(v.quantity) >= 0)) return setErr(`Lượng "${CIRCULAR_STREAM_LABELS[s]}" không hợp lệ.`)
    try {
      for (const [s, v] of entries) {
        const payload = { quantity: Number(v.quantity), route: v.route, destination: v.destination || null }
        const { error } = v.id
          ? await supabase.from('circular_flows').update(payload).eq('id', v.id)
          : await supabase.from('circular_flows').insert({ ...base, year, month: batch.month, stream: s, unit: streamUnit(s), note: null, ...payload })
        if (error) throw error
      }
      await qc.invalidateQueries()
      setBatch(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const submit = async () => {
    setErr('')
    const q = Number(form.quantity)
    if (form.quantity === '' || !(q >= 0)) return setErr('Nhập lượng (≥ 0).')
    try {
      await save.mutateAsync({
        id: form.id,
        year: Number(form.year),
        month: form.month === '' || form.month == null ? null : Number(form.month),
        stream: form.stream,
        quantity: q,
        unit: streamUnit(form.stream),
        route: form.route,
        destination: form.destination || null,
        note: form.note || null,
      })
      setForm(null)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true, align: 'center' as const })
      const cols = ['Dòng tuần hoàn', 'ĐVT', ...Array.from({ length: 12 }, (_, i) => 'T' + (i + 1)), 'Cả năm (ghi gộp)', 'Cộng']
      const sheet: any[][] = [
        [{ value: `SỔ THEO DÕI DÒNG TUẦN HOÀN NĂM ${year} · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        [],
        cols.map(head),
        ...pivot.map((p) => [CIRCULAR_STREAM_LABELS[p.s], p.unit, ...p.byMonth.map((v) => (v ? v : '')), p.annual || '', p.total].map((value) => ({ value }))),
      ]
      const columns = [38, 6, ...Array(12).fill(8), 12, 10].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`Dong_tuan_hoan_${year}_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  const filtered = filter ? rows.filter((f) => f.stream === filter) : rows
  const LIMIT = 12
  const list = showAll ? filtered : filtered.slice(0, LIMIT)
  const curMonth = new Date().getMonth() // tháng vừa kết thúc (1–12), 0 = tháng 1 chưa kết thúc

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Kpi
          label="Hồi lưu trong công nghệ"
          value={fmtNum(processT, 0) + ' t'}
          sub={production ? `≈ ${fmtNum((processT / production) * 100, 1)}% sản lượng ${year}` : 'Bụi thu hồi, hạt ngoài cỡ, phế phẩm'}
          tone="green"
        />
        <Kpi label="Bao bì, pallet tái sử dụng" value={fmtNum(packT, 1) + ' t'} />
        <Kpi
          label="Nước sau xử lý tái sử dụng"
          value={fmtNum(water.reuse, 0) + ' m³'}
          sub={water.pct != null ? `${fmtNum(water.pct, 1)}% nước thải · ${water.basis}` : water.basis}
          tone="blue"
        />
        <Kpi
          label="Chất thải chuyển hướng (GRI 306-4)"
          value={fmtNum(fate.diverted / 1000, 1) + ' t'}
          sub={fate.divertedPct != null ? `${fmtNum(fate.divertedPct, 1)}% chất thải phát sinh đã xác định phương pháp` : 'Khai báo phương pháp xử lý tại tab Chất thải → GRI 306'}
        />
      </div>

      <Card>
        <CardHeader
          title={`Dòng tuần hoàn – năm ${year}`}
          hint="Khối lượng hồi lưu, tái sử dụng theo tháng (t; nước: m³)"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" aria-label="Năm">
                {years.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </Select>
              <Button variant="outline" onClick={exportXlsx} disabled={!rows.length}>
                <Download size={15} /> Excel
              </Button>
              {canEdit && (
                <Button onClick={() => openBatch(year === thisYear ? Math.max(curMonth, 1) : null)}>
                  <ClipboardList size={15} /> Nhập số liệu
                </Button>
              )}
            </div>
          }
        />
        {err && !form && !batch && (
          <div className="px-4 pt-3">
            <ErrorNote message={err} />
          </div>
        )}
        {rows.length === 0 ? (
          <EmptyState title={`Chưa ghi nhận dòng tuần hoàn năm ${year}`} hint="Bấm Nhập số liệu để ghi theo tháng hoặc cả năm" />
        ) : (
          <>
            <div className="px-2 pt-3">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chart} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={TICK} axisLine={{ stroke: '#C9CEC9' }} tickLine={false} />
                  <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={(v) => fmtNum(v, 0)} width={52} />
                  <Tooltip cursor={{ fill: 'rgba(20,38,31,0.04)' }} formatter={(v: any, n: any) => [fmtNum(Number(v), 1) + ' t', n]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {[...PROCESS, 'bao_bi_tai_su_dung'].map((s, i, arr) => (
                    <Bar
                      key={s}
                      isAnimationActive={false}
                      dataKey={s}
                      name={CIRCULAR_STREAM_LABELS[s].split(' (')[0]}
                      stackId="t"
                      fill={STREAM_COLORS[s]}
                      stroke="#fff"
                      strokeWidth={2}
                      maxBarSize={40}
                      radius={i === arr.length - 1 ? [4, 4, 0, 0] : undefined}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-pine-800/10 text-xs uppercase tracking-wide text-pine-800/50">
                    <th className="px-4 py-2.5 text-left font-medium">Dòng</th>
                    {Array.from({ length: 12 }, (_, i) => (
                      <th key={i} className="px-2 py-2.5 font-medium">
                        T{i + 1}
                      </th>
                    ))}
                    <th className="px-2 py-2.5 font-medium">Cả năm</th>
                    <th className="px-4 py-2.5 font-medium">Cộng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pine-800/5 [font-variant-numeric:tabular-nums]">
                  {pivot.map((p) => (
                    <tr key={p.s}>
                      <td className="min-w-[220px] px-4 py-2 text-left">
                        <div className="text-pine-800">{CIRCULAR_STREAM_LABELS[p.s]}</div>
                        <div className="text-xs text-pine-800/45">{p.unit}</div>
                      </td>
                      {p.byMonth.map((v, i) => (
                        <td key={i} className="px-2 py-2 text-pine-800/75">
                          {v ? fmtNum(v, 0) : <span className="text-pine-800/25">·</span>}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-pine-800/75">{p.annual ? fmtNum(p.annual, 0) : <span className="text-pine-800/25">·</span>}</td>
                      <td className="px-4 py-2 font-medium text-pine-800">{fmtNum(p.total, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader
            title="Sổ ghi nhận"
            action={
              <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56" aria-label="Lọc dòng">
                <option value="">Tất cả dòng</option>
                {STREAM_ORDER.filter((s) => rows.some((f) => f.stream === s)).map((s) => (
                  <option key={s} value={s}>
                    {CIRCULAR_STREAM_LABELS[s]}
                  </option>
                ))}
              </Select>
            }
          />
          <Table head={['Kỳ', 'Dòng', 'Lượng', 'Hình thức', 'Nơi tái sử dụng / tiếp nhận', '']}>
            {list.map((f) => (
              <tr key={f.id}>
                <Td className="whitespace-nowrap">{periodLabel(f.month)}</Td>
                <Td>{CIRCULAR_STREAM_LABELS[f.stream] ?? f.stream}</Td>
                <Td className="whitespace-nowrap text-right [font-variant-numeric:tabular-nums]">
                  {fmtNum(Number(f.quantity), 1)} {f.unit}
                </Td>
                <Td className="text-pine-800/70">{CIRCULAR_ROUTE_LABELS[f.route] ?? f.route}</Td>
                <Td className="text-pine-800/70">{f.destination ?? '—'}</Td>
                <Td className="text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...f, month: f.month ?? '' })}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" aria-label="Xóa" onClick={() => window.confirm('Xóa bản ghi này?') && remove.mutate(f.id)}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
          {filtered.length > LIMIT && (
            <div className="border-t border-pine-800/10 px-4 py-2 text-center">
              <Button variant="ghost" onClick={() => setShowAll(!showAll)}>
                {showAll ? 'Thu gọn' : `Hiện tất cả ${filtered.length} bản ghi`}
              </Button>
            </div>
          )}
        </Card>
      )}

      <Note>
        Bụi thu hồi, hạt ngoài cỡ, phế phẩm hồi lưu trong công nghệ là vật liệu chưa bị thải bỏ: theo dõi như giảm tiêu hao nguyên liệu (tiêu chí tuần hoàn), không cộng vào chất thải
        GRI 306. Xỉ than, bùn, dầu thải đã ghi ở Chất thải & CTNH thì không nhập lại ở đây để tránh tính trùng. Nước sau xử lý tái sử dụng phải đáp ứng yêu cầu tại giấy phép môi trường.
      </Note>

      <Modal
        open={!!batch}
        onClose={() => setBatch(null)}
        title={`Nhập số liệu tuần hoàn – năm ${year}`}
        wide
        footer={
          <>
            <Button variant="outline" onClick={() => setBatch(null)}>
              Hủy
            </Button>
            <Button onClick={submitBatch}>Lưu</Button>
          </>
        }
      >
        {batch && (
          <div className="space-y-3">
            <Field label="Kỳ số liệu" hint="Chọn tháng để ghi theo tháng; “Cả năm” khi chỉ có số tổng năm">
              <Select value={batch.month ?? ''} onChange={(e) => openBatch(e.target.value === '' ? null : Number(e.target.value))} className="w-40">
                <option value="">Cả năm</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    Tháng {i + 1}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="divide-y divide-pine-800/5 rounded-lg border border-pine-800/10">
              {STREAM_ORDER.map((s) => {
                const v = batch.values[s]
                const set = (patch: any) => setBatch({ ...batch, values: { ...batch.values, [s]: { ...v, ...patch } } })
                return (
                  <div key={s} className="grid items-center gap-2 px-3 py-2 sm:grid-cols-[1fr_120px_170px]">
                    <div className="text-sm text-pine-800">
                      {CIRCULAR_STREAM_LABELS[s]}
                      {WASTE_STREAMS.includes(s) && <span className="block text-xs text-amber-700">Chỉ nhập nếu chưa ghi ở Chất thải & CTNH</span>}
                      {v.more > 0 && <span className="block text-xs text-pine-800/45">Kỳ này có thêm {v.more} bản ghi – sửa tại Sổ ghi nhận</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <Input type="number" min={0} value={v.quantity} onChange={(e) => set({ quantity: e.target.value })} aria-label={'Lượng ' + CIRCULAR_STREAM_LABELS[s]} />
                      <span className="w-6 text-xs text-pine-800/50">{streamUnit(s)}</span>
                    </div>
                    <Select value={v.route} onChange={(e) => set({ route: e.target.value })} aria-label="Hình thức">
                      {Object.entries(CIRCULAR_ROUTE_LABELS).map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </div>
                )
              })}
            </div>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title="Sửa bản ghi tuần hoàn"
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Năm">
                <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Field>
              <Field label="Tháng">
                <Select value={form.month ?? ''} onChange={(e) => setForm({ ...form, month: e.target.value })}>
                  <option value="">Cả năm</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Dòng">
              <Select value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })}>
                {STREAM_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {CIRCULAR_STREAM_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Lượng (${streamUnit(form.stream)})`} required>
                <Input type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </Field>
              <Field label="Hình thức">
                <Select value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })}>
                  {Object.entries(CIRCULAR_ROUTE_LABELS).map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Nơi tái sử dụng / đơn vị tiếp nhận">
              <Input value={form.destination ?? ''} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            </Field>
            <Field label="Ghi chú">
              <Textarea rows={2} value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </div>
  )
}
