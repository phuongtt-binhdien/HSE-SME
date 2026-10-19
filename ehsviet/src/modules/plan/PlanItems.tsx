// Danh sách hạng mục kế hoạch dùng chung cho kế hoạch HSE năm, lộ trình 5 năm và mốc Net Zero:
// nhóm theo lĩnh vực hoặc theo năm, tiến độ, trạng thái (quá hạn tự động), sửa / thêm, nạp bộ mẫu.
import { useQueryClient } from '@tanstack/react-query'
import { Copy, Download, FilePlus2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Field, Input, Kpi, Modal, Progress, Select, Textarea } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { useRemove, useSave } from '../../hooks/useCrud'
import { HORIZON_LABELS, PLAN_AREA_LABELS, PLAN_STATUS_LABELS, planState, type PlanItem } from '../../lib/plan'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'

const num = (v: any) => (v === '' || v == null ? null : Number(v))
const withUnit = (v: number, unit: string | null) => fmtNum(v, 2) + (unit ? (unit === '%' ? '%' : ' ' + unit) : '')

export function planKpis(items: PlanItem[]) {
  const live = items.filter((p) => p.status !== 'huy')
  const done = live.filter((p) => p.status === 'hoan_thanh').length
  const late = live.filter((p) => p.status === 'cham' || planState(p).overdue).length
  const doing = live.filter((p) => p.status === 'dang_thuc_hien' && !planState(p).overdue).length
  const avg = live.length ? live.reduce((s, p) => s + Number(p.progress ?? 0), 0) / live.length : 0
  const budget = live.reduce((s, p) => s + Number(p.budget_mvnd ?? 0), 0)
  return { total: live.length, done, late, doing, avg, budget }
}

export default function PlanItems({
  horizon,
  items,
  groupBy,
  base,
  canEdit,
  title,
  hint,
  toolbar,
  defaultYear,
  loadTemplates,
  templateLabel,
  copyFrom,
  showKpis = true,
}: {
  horizon: PlanItem['horizon']
  items: PlanItem[]
  groupBy: 'area' | 'year'
  base: Record<string, string>
  canEdit: boolean
  title: string
  hint?: string
  toolbar?: ReactNode
  defaultYear: number
  /** trả về các dòng mẫu để thêm khi danh sách trống */
  loadTemplates?: () => Record<string, any>[]
  templateLabel?: string
  /** sao chép kế hoạch năm trước (chỉ kế hoạch năm) */
  copyFrom?: { year: number; items: PlanItem[] }
  showKpis?: boolean
}) {
  const { facility } = useAuth()
  const qc = useQueryClient()
  const save = useSave('hse_plan_items')
  const remove = useRemove('hse_plan_items')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const k = planKpis(items)

  const groups = (() => {
    const m = new Map<string, PlanItem[]>()
    const keyOf = (p: PlanItem) => (groupBy === 'area' ? p.area : String(p.year))
    for (const p of items) m.set(keyOf(p), [...(m.get(keyOf(p)) ?? []), p])
    const keys = [...m.keys()]
    if (groupBy === 'area') keys.sort((a, b) => Object.keys(PLAN_AREA_LABELS).indexOf(a) - Object.keys(PLAN_AREA_LABELS).indexOf(b))
    else keys.sort((a, b) => Number(a) - Number(b))
    return keys.map((key) => ({
      key,
      label: groupBy === 'area' ? (PLAN_AREA_LABELS[key] ?? key) : `Năm ${key}`,
      rows: m.get(key)!,
    }))
  })()

  const insertRows = async (rows: Record<string, any>[]) => {
    setErr('')
    setBusy(true)
    try {
      const { error } = await supabase.from('hse_plan_items').insert(rows)
      if (error) throw error
      await qc.invalidateQueries()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const copyPrevious = () => {
    if (!copyFrom) return
    const shift = (d: string | null) => (d ? `${Number(d.slice(0, 4)) + (defaultYear - copyFrom.year)}${d.slice(4)}` : null)
    insertRows(
      copyFrom.items
        .filter((p) => p.status !== 'huy')
        .map((p) => ({
          ...base,
          horizon,
          year: defaultYear,
          area: p.area,
          title: p.title,
          description: p.description,
          basis: p.basis,
          kpi: p.kpi,
          target_value: p.target_value,
          actual_value: null,
          unit: p.unit,
          owner: p.owner,
          start_date: shift(p.start_date),
          due_date: shift(p.due_date),
          budget_mvnd: p.budget_mvnd,
          status: 'ke_hoach',
          progress: 0,
          note: null,
        }))
    )
  }

  const submit = async () => {
    setErr('')
    const f = form
    if (!f.title?.trim()) return setErr('Nhập tên hạng mục.')
    const y = Number(f.year)
    if (!Number.isInteger(y) || y < 2000 || y > 2100) return setErr('Năm không hợp lệ.')
    const progress = Math.round(Number(f.progress ?? 0))
    if (!(progress >= 0 && progress <= 100)) return setErr('Tiến độ trong khoảng 0–100%.')
    if (f.start_date && f.due_date && f.due_date < f.start_date) return setErr('Hạn hoàn thành không được trước ngày bắt đầu.')
    const status = progress === 100 && f.status !== 'huy' ? 'hoan_thanh' : f.status
    try {
      await save.mutateAsync({
        ...(f.id ? { id: f.id } : { ...base, horizon }),
        year: y,
        area: f.area,
        title: f.title.trim(),
        description: f.description || null,
        basis: f.basis || null,
        kpi: f.kpi || null,
        target_value: num(f.target_value),
        actual_value: num(f.actual_value),
        unit: f.unit || null,
        owner: f.owner || null,
        start_date: f.start_date || null,
        due_date: f.due_date || null,
        budget_mvnd: num(f.budget_mvnd),
        status,
        progress: status === 'hoan_thanh' ? 100 : progress,
        note: f.note || null,
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
      const head = (v: string) => ({
        value: v,
        fontWeight: 'bold' as const,
        backgroundColor: '#DCE7E1',
        wrap: true,
        align: 'center' as const,
      })
      const cols = [
        'TT',
        'Năm',
        'Lĩnh vực',
        'Hạng mục',
        'Căn cứ',
        'Chỉ tiêu',
        'Mục tiêu',
        'Thực hiện',
        'ĐVT',
        'Chủ trì',
        'Hạn',
        'Kinh phí (tr đ)',
        'Tiến độ (%)',
        'Trạng thái',
        'Ghi chú',
      ]
      const sorted = groups.flatMap((g) => g.rows)
      const sheet: any[][] = [
        [
          {
            value: `${title.toUpperCase()} · ${facility?.name ?? ''}`,
            fontWeight: 'bold',
            columnSpan: cols.length,
          },
          ...Array(cols.length - 1).fill(null),
        ],
        [`Xuất ngày ${fmtDate(todayISO())}`],
        [],
        cols.map(head),
        ...sorted.map((p, i) =>
          [
            i + 1,
            p.year,
            PLAN_AREA_LABELS[p.area] ?? p.area,
            p.title,
            p.basis ?? '',
            p.kpi ?? '',
            p.target_value ?? '',
            p.actual_value ?? '',
            p.unit ?? '',
            p.owner ?? '',
            fmtDate(p.due_date),
            p.budget_mvnd ?? '',
            Number(p.progress ?? 0),
            planState(p).label,
            p.note ?? '',
          ].map((value) => ({ value, wrap: true }))
        ),
      ]
      const columns = [5, 7, 18, 46, 30, 22, 9, 9, 7, 20, 11, 10, 9, 14, 26].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`${title.replace(/[^\p{L}\p{N}]+/gu, '_')}_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  return (
    <div className="space-y-4">
      {showKpis && (
        <div className="flex flex-wrap gap-3">
          <Kpi label="Hạng mục" value={k.total} sub={k.budget ? `Kinh phí ${fmtNum(k.budget, 0)} tr đ` : undefined} tone="blue" />
          <Kpi label="Hoàn thành" value={k.done} sub={k.total ? `${fmtNum((k.done / k.total) * 100, 0)}% · tiến độ bình quân ${fmtNum(k.avg, 0)}%` : '—'} tone="green" />
          <Kpi label="Đang thực hiện" value={k.doing} />
          <Kpi label="Chậm, quá hạn" value={k.late} sub={k.late ? 'Cần xử lý' : 'Không có'} tone={k.late ? 'red' : 'gray'} />
        </div>
      )}

      <Card>
        <CardHeader
          title={showKpis || !k.total ? title : `${title} · ${k.done}/${k.total} hoàn thành`}
          hint={hint}
          action={
            <div className="flex flex-wrap items-center gap-2">
              {toolbar}
              <Button variant="outline" onClick={exportXlsx} disabled={!items.length}>
                <Download size={15} /> Excel
              </Button>
              {canEdit && (
                <Button
                  onClick={() =>
                    setForm({
                      year: defaultYear,
                      area: 'moi_truong',
                      status: 'ke_hoach',
                      progress: 0,
                      due_date: `${defaultYear}-12-31`,
                    })
                  }
                >
                  <Plus size={15} /> Thêm hạng mục
                </Button>
              )}
            </div>
          }
        />
        {err && !form && (
          <div className="px-4 pt-3">
            <ErrorNote message={err} />
          </div>
        )}
        {items.length === 0 ? (
          <div>
            <EmptyState title="Chưa có hạng mục" hint="Thêm từng hạng mục, hoặc nạp bộ mẫu tham chiếu rồi chỉnh theo nhà máy" />
            {canEdit && (loadTemplates || copyFrom?.items.length) && (
              <div className="flex flex-wrap justify-center gap-2 pb-6">
                {copyFrom && copyFrom.items.length > 0 && (
                  <Button variant="outline" disabled={busy} onClick={copyPrevious}>
                    <Copy size={15} /> Sao chép kế hoạch năm {copyFrom.year} ({copyFrom.items.length})
                  </Button>
                )}
                {loadTemplates && (
                  <Button variant="outline" disabled={busy} onClick={() => insertRows(loadTemplates())}>
                    <FilePlus2 size={15} /> {templateLabel ?? 'Nạp bộ mẫu'}
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-pine-800/10">
            {groups.map((g) => (
              <div key={g.key}>
                <div className="flex items-center justify-between bg-pine-800/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-pine-800/60">
                  <span>{g.label}</span>
                  <span className="font-normal normal-case tracking-normal text-pine-800/45">
                    {g.rows.filter((p) => p.status === 'hoan_thanh').length}/{g.rows.filter((p) => p.status !== 'huy').length} hoàn thành
                  </span>
                </div>
                <div className="divide-y divide-pine-800/5">
                  {g.rows.map((p) => (
                    <PlanRow
                      key={p.id}
                      p={p}
                      groupBy={groupBy}
                      canEdit={canEdit}
                      onEdit={() => setForm({ ...p })}
                      onDelete={() => window.confirm(`Xóa hạng mục "${p.title}"?`) && remove.mutate(p.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={(form?.id ? 'Sửa hạng mục – ' : 'Thêm hạng mục – ') + HORIZON_LABELS[horizon]}
        wide
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
            <div className="grid gap-3 sm:grid-cols-[110px_1fr]">
              <Field label="Năm" required>
                <Input type="number" value={form.year ?? ''} onChange={(e) => setForm({ ...form, year: e.target.value })} />
              </Field>
              <Field label="Lĩnh vực">
                <Select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}>
                  {Object.entries(PLAN_AREA_LABELS).map(([key, v]) => (
                    <option key={key} value={key}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Hạng mục" required>
              <Input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Field>
            <Field label="Nội dung thực hiện">
              <Textarea rows={2} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <Field label="Căn cứ pháp lý / yêu cầu">
              <Input value={form.basis ?? ''} onChange={(e) => setForm({ ...form, basis: e.target.value })} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Chỉ tiêu đo" className="sm:col-span-1">
                <Input value={form.kpi ?? ''} onChange={(e) => setForm({ ...form, kpi: e.target.value })} />
              </Field>
              <Field label="Mục tiêu">
                <Input type="number" value={form.target_value ?? ''} onChange={(e) => setForm({ ...form, target_value: e.target.value })} />
              </Field>
              <Field label="Thực hiện">
                <Input type="number" value={form.actual_value ?? ''} onChange={(e) => setForm({ ...form, actual_value: e.target.value })} />
              </Field>
              <Field label="Đơn vị">
                <Input value={form.unit ?? ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="Chủ trì" className="sm:col-span-2">
                <Input value={form.owner ?? ''} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Bộ phận / người chủ trì" />
              </Field>
              <Field label="Bắt đầu">
                <Input type="date" value={form.start_date ?? ''} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </Field>
              <Field label="Hạn hoàn thành">
                <Input type="date" value={form.due_date ?? ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Trạng thái">
                <Select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                      ...(e.target.value === 'hoan_thanh' ? { progress: 100 } : {}),
                    })
                  }
                >
                  {Object.entries(PLAN_STATUS_LABELS).map(([key, v]) => (
                    <option key={key} value={key}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={`Tiến độ: ${form.progress ?? 0}%`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={form.progress ?? 0}
                  onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                  className="mt-2 w-full accent-viridian-600"
                />
              </Field>
              <Field label="Kinh phí (triệu đồng)">
                <Input type="number" min={0} value={form.budget_mvnd ?? ''} onChange={(e) => setForm({ ...form, budget_mvnd: e.target.value })} />
              </Field>
            </div>
            <Field label="Ghi chú, vướng mắc">
              <Textarea rows={2} value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </div>
  )
}

function PlanRow({ p, groupBy, canEdit, onEdit, onDelete }: { p: PlanItem; groupBy: 'area' | 'year'; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const st = planState(p)
  const tone = p.status === 'hoan_thanh' ? 'green' : st.overdue || p.status === 'cham' ? 'red' : p.status === 'dang_thuc_hien' ? 'blue' : 'gray'
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={st.tone}>{st.label}</Badge>
          {groupBy === 'year' && <span className="text-xs text-pine-800/50">{PLAN_AREA_LABELS[p.area] ?? p.area}</span>}
          <span className={'text-sm font-medium ' + (p.status === 'huy' ? 'text-pine-800/40 line-through' : 'text-pine-800')}>{p.title}</span>
        </div>
        {p.description && <p className="mt-1 text-xs text-pine-800/60">{p.description}</p>}
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-pine-800/50">
          {p.basis && <span>Căn cứ: {p.basis}</span>}
          {p.owner && <span>Chủ trì: {p.owner}</span>}
          {p.due_date && <span className={st.overdue ? 'font-medium text-red-600' : ''}>Hạn: {fmtDate(p.due_date)}</span>}
          {p.kpi && (
            <span>
              {p.kpi}
              {p.target_value != null && `: mục tiêu ${withUnit(Number(p.target_value), p.unit)}`}
              {p.actual_value != null && ` · đạt ${withUnit(Number(p.actual_value), p.unit)}`}
            </span>
          )}
          {p.budget_mvnd != null && <span>Kinh phí: {fmtNum(Number(p.budget_mvnd), 0)} tr đ</span>}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="w-40 max-w-[50%]">
            <Progress value={Number(p.progress ?? 0)} tone={tone} />
          </div>
          <span className="text-xs text-pine-800/60 [font-variant-numeric:tabular-nums]">{p.progress ?? 0}%</span>
          {p.note && <span className={'text-xs ' + (st.overdue || p.status === 'cham' ? 'text-red-600' : 'text-pine-800/50')}>{p.note}</span>}
        </div>
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-start gap-1">
          <Button variant="ghost" aria-label="Sửa" onClick={onEdit}>
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" aria-label="Xóa" onClick={onDelete}>
            <Trash2 size={15} />
          </Button>
        </div>
      )}
    </div>
  )
}
