// Chỉ mục GRI theo năm: số liệu tự động từ các module + nhập tay; đối chiếu nội dung bắt buộc TT 96/2020
import { useQueryClient } from '@tanstack/react-query'
import { Download, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ErrorNote,
  Field,
  Input,
  Kpi,
  Loading,
  Modal,
  Note,
  Progress,
  Select,
  Table,
  Td,
  Tabs,
  Textarea,
} from '../../components/UI'
import { GRI_ITEMS, GRI_PILLAR_LABELS, TT96_GROUPS, type GriItem } from '../../lib/gri'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtNum } from '../../lib/utils'
import { saveMetric, type EsgMetric, type useEsgData } from './useEsgData'

type EsgData = ReturnType<typeof useEsgData>

interface Row {
  item: GriItem
  value: number | null
  text: string | null
  source: 'auto' | 'manual' | null
  manual?: EsgMetric
}

const fmtValue = (v: number | null, unit?: string) => {
  if (v == null) return null
  const digits = unit?.includes('/t') ? 4 : Math.abs(v) < 10 ? 2 : Math.abs(v) < 1000 ? 1 : 0
  return fmtNum(v, digits)
}

export default function GriTab({ data, base, canEdit }: { data: EsgData; base: any; canEdit: boolean }) {
  const qc = useQueryClient()
  const { years, ctxFor, metric, loading } = data
  const [year, setYear] = useState(() => (years.length > 1 ? years[1] : years[0]) ?? new Date().getFullYear())
  const [pillar, setPillar] = useState('all')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const ctx = useMemo(() => ctxFor(year), [ctxFor, year])

  const rows: Row[] = useMemo(
    () =>
      GRI_ITEMS.map((item) => {
        const manual = metric(year, item.code)
        if (manual && (manual.value != null || manual.text_value)) {
          return { item, value: manual.value != null ? Number(manual.value) : null, text: manual.text_value, source: 'manual', manual }
        }
        if (item.kind === 'auto' && item.auto) {
          const v = item.auto(ctx)
          return { item, value: v, text: null, source: v != null ? 'auto' : null, manual }
        }
        return { item, value: null, text: null, source: null, manual }
      }),
    [ctx, metric, year]
  )

  const has = (r: Row) => r.value != null || !!r.text
  const filled = rows.filter(has).length
  const byPillar = (p: string) => rows.filter((r) => r.item.pillar === p)
  const shown = pillar === 'all' ? rows : byPillar(pillar)

  const tt96 = TT96_GROUPS.map((g) => {
    const items = rows.filter((r) => r.item.tt96 === g.no)
    const ok = items.filter(has).length
    return { ...g, items, ok, status: ok === items.length && items.length ? 'du' : ok ? 'mot_phan' : 'thieu' }
  })

  const openEdit = (r: Row) => {
    setErr('')
    setForm({
      item: r.item,
      manual: r.manual,
      value: r.manual?.value ?? (r.source === 'auto' ? '' : ''),
      text_value: r.manual?.text_value ?? '',
      unit: r.manual?.unit ?? r.item.unit ?? '',
      source: r.manual?.source ?? '',
      note: r.manual?.note ?? '',
      autoValue: r.item.kind === 'auto' && r.item.auto ? r.item.auto(ctx) : null,
    })
  }

  const submit = async () => {
    setErr('')
    const isText = form.item.kind === 'text'
    const v = form.value === '' || form.value == null ? null : Number(form.value)
    if (!isText && v != null && !Number.isFinite(v)) return setErr('Giá trị phải là số.')
    try {
      await saveMetric(supabase, base, form.manual, year, form.item.code, {
        value: isText ? null : v,
        text_value: isText ? form.text_value?.trim() || null : null,
        unit: form.unit || null,
        source: form.source?.trim() || null,
        note: form.note?.trim() || null,
      })
      await qc.invalidateQueries()
      setForm(null)
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
        [{ value: `CHỈ MỤC GRI – NĂM ${year}`, fontWeight: 'bold', columnSpan: 4 }, null, null, null],
        [],
        ['Mã', 'Chỉ số', 'Nhóm', 'Giá trị', 'Đơn vị', 'Nguồn số liệu', 'TT 96/2020 (PL IV mục II)', 'Chuẩn thay thế từ 2027', 'Ghi chú'].map(head),
        ...rows.map((r) => [
          r.item.code,
          r.item.title,
          GRI_PILLAR_LABELS[r.item.pillar],
          r.text ?? (r.value != null ? Number(r.value.toFixed(4)) : ''),
          r.item.unit ?? '',
          r.source === 'manual' ? r.manual?.source || 'Nhập tay' : r.source === 'auto' ? r.item.source ?? 'Tự động' : 'Chưa có số liệu',
          r.item.tt96 ? 'Mục ' + r.item.tt96 : '',
          r.item.transition ?? '',
          r.manual?.note ?? '',
        ]),
      ]
      const columns = [{ width: 20 }, { width: 50 }, { width: 14 }, { width: 16 }, { width: 18 }, { width: 44 }, { width: 14 }, { width: 26 }, { width: 30 }]
      await writeXlsxFile(sheet, { columns } as any).toFile(`Chi_muc_GRI_${year}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="max-w-[140px]" aria-label="Năm báo cáo">
          {years.map((y) => (
            <option key={y} value={y}>
              Năm {y}
            </option>
          ))}
        </Select>
        <span className="text-xs text-pine-800/50">
          Năm hiện tại là số liệu lũy kế. Số tự động lấy từ các module; bấm <Pencil size={11} className="inline" /> để nhập hoặc ghi đè.
        </span>
        <Button variant="outline" className="ml-auto" onClick={exportXlsx}>
          <Download size={15} /> Xuất chỉ mục (.xlsx)
        </Button>
      </div>
      {err && !form && <ErrorNote message={err} />}

      <div className="flex flex-wrap gap-2">
        <Kpi label="Chỉ số có số liệu" value={`${filled}/${rows.length}`} sub={`${Math.round((filled / rows.length) * 100)}% chỉ mục`} tone={filled / rows.length >= 0.8 ? 'green' : 'amber'} />
        {(['E', 'S', 'G'] as const).map((p) => {
          const list = byPillar(p)
          const ok = list.filter(has).length
          return <Kpi key={p} label={GRI_PILLAR_LABELS[p]} value={`${ok}/${list.length}`} sub="chỉ số có số liệu" tone={ok === list.length ? 'green' : 'gray'} />
        })}
      </div>

      <Card>
        <CardHeader
          title="Nội dung môi trường – xã hội bắt buộc trong Báo cáo thường niên"
          hint="TT 96/2020/TT-BTC, Phụ lục IV mục II (công ty niêm yết) — một bộ số liệu dùng chung cho BCTN, khung ESG QĐ 46/2026 và báo cáo GRI"
        />
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {tt96.map((g) => (
            <div key={g.no} className="rounded-lg border border-pine-800/10 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-semibold text-pine-800">
                  {g.no}. {g.title}
                </div>
                <Badge tone={g.status === 'du' ? 'green' : g.status === 'mot_phan' ? 'amber' : 'red'}>
                  {g.status === 'du' ? 'Đủ' : g.status === 'mot_phan' ? 'Một phần' : 'Thiếu'}
                </Badge>
              </div>
              <div className="mt-2">
                <Progress value={g.items.length ? (g.ok / g.items.length) * 100 : 0} tone={g.status === 'du' ? 'green' : g.status === 'mot_phan' ? 'amber' : 'red'} />
              </div>
              <div className="mt-1.5 text-[11px] text-pine-800/50">{g.items.map((r) => r.item.code).join(' · ')}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="border-b border-pine-800/10 px-4 py-3">
          <Tabs
            tabs={[
              { key: 'all', label: 'Tất cả' },
              { key: 'C', label: 'Công bố chung' },
              { key: 'E', label: 'Môi trường' },
              { key: 'S', label: 'Xã hội' },
              { key: 'G', label: 'Quản trị' },
            ]}
            active={pillar}
            onChange={setPillar}
          />
        </div>
        <Table head={['Mã', 'Chỉ số', 'Giá trị', 'Nguồn', 'TT 96', '']}>
          {shown.map((r) => (
            <tr key={r.item.code}>
              <Td className="whitespace-nowrap font-mono text-xs">{r.item.code}</Td>
              <Td>
                <div className="font-medium text-pine-800">{r.item.title}</div>
                {r.item.transition && <div className="text-[11px] text-steel-600">Từ kỳ 2027: {r.item.transition}</div>}
                {r.item.hint && !has(r) && <div className="text-[11px] text-pine-800/45">{r.item.hint}</div>}
              </Td>
              <Td className="whitespace-nowrap">
                {r.text ? (
                  <span className="line-clamp-2 max-w-[260px] whitespace-normal text-xs">{r.text}</span>
                ) : r.value != null ? (
                  <span className="font-semibold text-pine-800">
                    {fmtValue(r.value, r.item.unit)} <span className="text-xs font-normal text-pine-800/50">{r.item.unit}</span>
                  </span>
                ) : (
                  <span className="text-xs text-pine-800/35">Chưa có</span>
                )}
              </Td>
              <Td className="max-w-[260px] text-xs text-pine-800/55">
                {r.source === 'manual' ? (
                  <>
                    <Badge tone="blue">Nhập tay</Badge> {r.manual?.source}
                  </>
                ) : r.source === 'auto' ? (
                  <>
                    <Badge tone="green">Tự động</Badge> {r.item.source}
                  </>
                ) : r.item.kind === 'auto' ? (
                  r.item.source
                ) : (
                  'Nhập tay'
                )}
                {r.manual?.note && <div className="mt-0.5 text-pine-800/45">{r.manual.note}</div>}
              </Td>
              <Td className="text-xs text-pine-800/55">{r.item.tt96 ? 'II.' + r.item.tt96 : ''}</Td>
              <Td className="text-right">
                {canEdit && (
                  <Button variant="ghost" aria-label="Nhập số liệu" onClick={() => openEdit(r)}>
                    <Pencil size={15} />
                  </Button>
                )}
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Note>
        Khung: GRI 1, 2, 3 (2021) và chuẩn chủ đề; <b>từ kỳ báo cáo 01/01/2027</b> GRI 102: Climate Change 2025 và GRI 103: Energy 2025 thay
        GRI 305-1…305-5 và GRI 302 (GRI 305-6, 305-7 giữ nguyên). Mỗi chỉ số ghi rõ phạm vi (nhà máy / toàn công ty), năm, mẫu số; số liệu
        công bố phải truy được về sổ gốc. Không dùng "trung hòa carbon", "không phát thải" khi chưa có kiểm kê, thẩm định.
      </Note>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form ? `${form.item.code} – ${form.item.title} (${year})` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={submit}>Lưu</Button>
          </>
        }
      >
        {form && (
          <div className="space-y-3">
            {form.autoValue != null && (
              <Note tone="blue">
                Giá trị tự động: <b>{fmtValue(form.autoValue, form.item.unit)} {form.item.unit}</b> ({form.item.source}). Nhập giá trị dưới đây để
                ghi đè; để trống để dùng số tự động.
              </Note>
            )}
            {form.item.kind === 'text' ? (
              <Field label="Nội dung công bố">
                <Textarea rows={5} value={form.text_value} onChange={(e) => setForm({ ...form, text_value: e.target.value })} />
              </Field>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <Field label="Giá trị" className="col-span-2">
                  <Input type="number" step="any" value={form.value ?? ''} onChange={(e) => setForm({ ...form, value: e.target.value })} />
                </Field>
                <Field label="Đơn vị">
                  <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                </Field>
              </div>
            )}
            {form.item.hint && <Note>{form.item.hint}</Note>}
            <Field label="Nguồn số liệu (sổ, hóa đơn, báo cáo…)">
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            </Field>
            <Field label="Ghi chú">
              <Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
            {err && <ErrorNote message={err} />}
          </div>
        )}
      </Modal>
    </div>
  )
}
