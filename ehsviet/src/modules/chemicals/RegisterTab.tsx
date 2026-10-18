// Danh mục hóa chất và tồn kho: phân loại nguy hại, nhóm pháp lý, PATHH, định mức, cảnh báo
import { useQueryClient } from '@tanstack/react-query'
import { ArrowDownToLine, ArrowUpFromLine, Download, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Input, Kpi, Loading, Note, Select, Table, Td } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { CHEMICAL_BASIS, CONTROLLED_GROUPS, HAZARD_CLASS_LABELS, LEGAL_GROUP_LABELS, LEGAL_GROUP_TONE, USE_AREA_LABELS, type Chemical } from '../../lib/chemicals'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'
import { ChemicalModal, TxnModal } from './modals'
import type { ChemicalData } from './useChemicalData'

export default function RegisterTab({ data, base, canEdit }: { data: ChemicalData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { facility } = useAuth()
  const { rows, chemicals, loading } = data
  const [area, setArea] = useState('')
  const [group, setGroup] = useState('')
  const [q, setQ] = useState('')
  const [onlyAlert, setOnlyAlert] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [txn, setTxn] = useState<any>(null)
  const [err, setErr] = useState('')

  const stats = useMemo(() => {
    const act = rows.filter((r) => r.c.active)
    const has = (label: string) => act.filter((r) => r.alerts.some((a) => a.label.startsWith(label))).length
    return {
      total: act.length,
      noSds: act.filter((r) => !r.c.pathh_available).length,
      low: has('Dưới định mức') + has('Còn khoảng'),
      over: has('Vượt tồn trữ'),
      controlled: act.filter((r) => CONTROLLED_GROUPS.includes(r.c.legal_group)).length,
      expiry: has('Hết hạn'),
    }
  }, [rows])

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return rows
      .filter((r) => showInactive || r.c.active)
      .filter((r) => !area || r.c.use_area === area)
      .filter((r) => !group || r.c.legal_group === group)
      .filter((r) => !onlyAlert || r.alerts.length > 0)
      .filter((r) => !s || [r.c.name, r.c.code, r.c.cas_no, r.c.storage_location].some((x) => (x ?? '').toLowerCase().includes(s)))
      .sort((a, b) => b.alerts.filter((x) => x.tone === 'red').length - a.alerts.filter((x) => x.tone === 'red').length || a.c.name.localeCompare(b.c.name, 'vi'))
  }, [rows, area, group, q, onlyAlert, showInactive])

  const remove = async (c: Chemical) => {
    if (!window.confirm(`Xóa ${c.name} cùng sổ nhập – xuất? Hóa chất thôi sử dụng nên bỏ chọn "Đang sử dụng" để giữ lịch sử.`)) return
    const { error } = await supabase.from('chemicals').delete().eq('id', c.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const cols = ['STT', 'Mã', 'Tên hóa chất', 'CAS', 'Công thức', 'Phân loại nguy hại', 'Nhóm pháp lý', 'Khu sử dụng', 'Nơi bảo quản', 'Tồn', 'Đơn vị', 'Tồn tối thiểu', 'Tồn trữ tối đa', 'PATHH', 'Ngày PATHH', 'Hạn sử dụng', 'Cảnh báo']
      const sheet: any[][] = [
        [{ value: `DANH MỤC HÓA CHẤT SỬ DỤNG · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        [`Tồn tính đến ngày ${fmtDate(todayISO())} (tồn đầu + nhập − xuất − thải bỏ ± điều chỉnh − dùng theo nhật ký HTXLNT)`],
        [],
        cols.map(head),
        ...shown.map(({ c, s, alerts }, i) =>
          [
            i + 1, c.code ?? '', c.name, c.cas_no ?? '', c.formula ?? '', (c.hazard_classes ?? []).map((h) => HAZARD_CLASS_LABELS[h] ?? h).join(', '),
            LEGAL_GROUP_LABELS[c.legal_group] ?? '', USE_AREA_LABELS[c.use_area] ?? '', c.storage_location ?? '', Number(s.stock.toFixed(3)), c.unit ?? '',
            c.min_stock ?? '', c.max_stock ?? '', c.pathh_available ? 'Có' : 'Thiếu', fmtDate(c.sds_date), fmtDate(c.expiry_date), alerts.map((a) => a.label).join('; '),
          ].map((value) => ({ value }))
        ),
      ]
      const columns = [6, 11, 32, 12, 12, 26, 20, 16, 24, 10, 7, 10, 10, 8, 11, 11, 34].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`Danh_muc_hoa_chat_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      {err && <ErrorNote message={err} />}
      <div className="flex flex-wrap gap-3">
        <Kpi label="Hóa chất đang sử dụng" value={stats.total} tone="blue" />
        <Kpi label="Thiếu PATHH" value={stats.noSds} tone={stats.noSds ? 'red' : 'green'} />
        <Kpi label="Cần đặt mua" value={stats.low} sub="dưới định mức / sắp hết" tone={stats.low ? 'amber' : 'green'} />
        <Kpi label="Vượt tồn trữ tối đa" value={stats.over} tone={stats.over ? 'red' : 'green'} />
        <Kpi label="Nhóm kiểm soát" value={stats.controlled} sub="có điều kiện, kiểm soát đặc biệt, tiền chất" />
        <Kpi label="Hết hạn / sắp hết hạn" value={stats.expiry} tone={stats.expiry ? 'amber' : 'gray'} />
      </div>

      <Card>
        <CardHeader
          title="Danh mục hóa chất & tồn kho"
          hint="Tồn = tồn đầu + nhập − xuất − thải bỏ ± điều chỉnh − lượng dùng theo nhật ký HTXLNT"
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportXlsx} disabled={shown.length === 0}>
                <Download size={15} /> Xuất Excel
              </Button>
              {canEdit && (
                <Button onClick={() => setForm({ unit: 'kg', legal_group: 'thong_thuong', use_area: 'san_xuat', hazard_classes: [], pathh_available: false, active: true })}>
                  <Plus size={15} /> Khai báo hóa chất
                </Button>
              )}
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tên, mã, CAS, nơi bảo quản…" className="max-w-[230px]" />
          <Select value={area} onChange={(e) => setArea(e.target.value)} className="max-w-[190px]" aria-label="Khu sử dụng">
            <option value="">Mọi khu sử dụng</option>
            {Object.entries(USE_AREA_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select value={group} onChange={(e) => setGroup(e.target.value)} className="max-w-[210px]" aria-label="Nhóm pháp lý">
            <option value="">Mọi nhóm pháp lý</option>
            {Object.entries(LEGAL_GROUP_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-1.5 text-xs text-pine-800/60">
            <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={onlyAlert} onChange={(e) => setOnlyAlert(e.target.checked)} />
            Chỉ hóa chất có cảnh báo
          </label>
          <label className="flex items-center gap-1.5 text-xs text-pine-800/60">
            <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Hiện hóa chất thôi dùng
          </label>
          <span className="ml-auto text-xs text-pine-800/50">{shown.length} hóa chất</span>
        </div>
        {shown.length === 0 ? (
          <EmptyState title={chemicals.length ? 'Không có hóa chất phù hợp bộ lọc' : 'Chưa khai báo hóa chất'} />
        ) : (
          <Table head={['Hóa chất', 'Phân loại', 'Khu sử dụng', 'Tồn', 'Cảnh báo', '']}>
            {shown.map(({ c, s, alerts }) => (
              <tr key={c.id} className={c.active ? '' : 'opacity-50'}>
                <Td className="min-w-[190px]">
                  <div className="font-medium text-pine-800">{c.name}</div>
                  <div className="text-xs text-pine-800/50">{[c.code, c.cas_no && 'CAS ' + c.cas_no].filter(Boolean).join(' · ') || '—'}</div>
                  {c.pathh_available && (
                    <div className="text-[11px] text-pine-800/45">
                      PATHH{c.sds_date ? ' ' + fmtDate(c.sds_date) : ''}
                      {c.pathh_url && (
                        <a href={c.pathh_url} target="_blank" rel="noreferrer" className="ml-1 text-viridian-700 underline">
                          mở
                        </a>
                      )}
                    </div>
                  )}
                </Td>
                <Td className="min-w-[150px]">
                  <Badge tone={LEGAL_GROUP_TONE[c.legal_group] ?? 'gray'}>{LEGAL_GROUP_LABELS[c.legal_group] ?? c.legal_group}</Badge>
                  {(c.hazard_classes ?? []).length > 0 && (
                    <div className="mt-1 text-[11px] text-pine-800/55">{(c.hazard_classes ?? []).map((h) => HAZARD_CLASS_LABELS[h] ?? h).join(' · ')}</div>
                  )}
                </Td>
                <Td className="min-w-[120px] text-pine-800/70">
                  {USE_AREA_LABELS[c.use_area] ?? c.use_area}
                  {c.storage_location && <div className="text-xs text-pine-800/45">{c.storage_location}</div>}
                </Td>
                <Td className="whitespace-nowrap">
                  <div className="font-medium text-pine-800">
                    {fmtNum(s.stock)} {c.unit}
                  </div>
                  <div className="text-[11px] text-pine-800/45">
                    {c.min_stock != null ? `tối thiểu ${fmtNum(Number(c.min_stock))}` : ''}
                    {c.max_stock != null ? `${c.min_stock != null ? ' · ' : ''}tối đa ${fmtNum(Number(c.max_stock))}` : ''}
                    {c.log_key ? ` · nhật ký "${c.log_key}"` : ''}
                  </div>
                </Td>
                <Td className="min-w-[150px]">
                  <div className="flex flex-col items-start gap-1">
                    {alerts.length ? alerts.map((a) => <Badge key={a.label} tone={a.tone}>{a.label}</Badge>) : <span className="text-xs text-pine-800/35">—</span>}
                  </div>
                </Td>
                <Td className="text-right">
                  {canEdit && (
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" aria-label="Nhập" title="Nhập (mua)" onClick={() => setTxn({ chemical_id: c.id, kind: 'nhap', txn_date: todayISO() })}>
                        <ArrowDownToLine size={15} />
                      </Button>
                      <Button variant="ghost" aria-label="Xuất" title="Xuất sử dụng" onClick={() => setTxn({ chemical_id: c.id, kind: 'xuat', txn_date: todayISO(), area: c.use_area })}>
                        <ArrowUpFromLine size={15} />
                      </Button>
                      <Button variant="ghost" aria-label="Sửa" onClick={() => setForm({ ...c, hazard_classes: c.hazard_classes ?? [] })}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" aria-label="Xóa" onClick={() => remove(c)}>
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

      <Note>{CHEMICAL_BASIS}</Note>

      <ChemicalModal form={form} setForm={setForm} base={base} onClose={() => setForm(null)} />
      <TxnModal form={txn} setForm={setTxn} base={base} chemicals={chemicals} stock={(id) => rows.find((r) => r.c.id === id)?.s} onClose={() => setTxn(null)} />
    </div>
  )
}
