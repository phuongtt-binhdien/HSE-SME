// Sổ nhập – xuất hóa chất: mua (bên bán, hóa đơn, giấy phép), xuất dùng theo khu vực, điều chỉnh kiểm kê, thải bỏ
import { useQueryClient } from '@tanstack/react-query'
import { Download, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Input, Loading, Select, Table, Td } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { CONTROLLED_GROUPS, TXN_KIND_LABELS, TXN_KIND_TONE, USE_AREA_LABELS, type ChemicalTxn } from '../../lib/chemicals'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtDate, fmtNum, todayISO } from '../../lib/utils'
import { TxnModal } from './modals'
import type { ChemicalData } from './useChemicalData'

export default function LedgerTab({ data, base, canEdit }: { data: ChemicalData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { facility } = useAuth()
  const { txns, chemicals, byId, rows: stockRows, loading } = data
  const [kind, setKind] = useState('')
  const [area, setArea] = useState('')
  const [chem, setChem] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [form, setForm] = useState<any>(null)
  const [err, setErr] = useState('')

  const rows = useMemo(
    () =>
      txns
        .filter((t) => !kind || t.kind === kind)
        .filter((t) => !area || t.area === area || (!t.area && byId.get(t.chemical_id)?.use_area === area))
        .filter((t) => !chem || t.chemical_id === chem)
        .filter((t) => (!from || t.txn_date >= from) && (!to || t.txn_date <= to)),
    [txns, kind, area, chem, from, to, byId]
  )

  const remove = async (t: ChemicalTxn) => {
    if (!window.confirm('Xóa dòng sổ này? Tồn kho sẽ tính lại.')) return
    const { error } = await supabase.from('chemical_transactions').delete().eq('id', t.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const sign = (t: ChemicalTxn) => (t.kind === 'nhap' ? 1 : t.kind === 'dieu_chinh' ? 1 : -1)

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const cols = ['Ngày', 'Hóa chất', 'CAS', 'Loại', 'Số lượng', 'Đơn vị', 'Nơi sử dụng', 'Mục đích / nội dung', 'Bên bán', 'Hóa đơn, chứng từ', 'Giấy phép bên bán', 'Số lô', 'Người nhận / giao', 'Ghi chú']
      const sheet: any[][] = [
        [{ value: `SỔ THEO DÕI NHẬP – XUẤT HÓA CHẤT · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        [`${from ? 'Từ ' + fmtDate(from) + ' ' : ''}${to ? 'đến ' + fmtDate(to) : ''} · xuất ngày ${fmtDate(todayISO())}`],
        [],
        cols.map(head),
        ...rows.map((t) => {
          const c = byId.get(t.chemical_id)
          return [
            fmtDate(t.txn_date), c?.name ?? '', c?.cas_no ?? '', TXN_KIND_LABELS[t.kind], sign(t) * Number(t.quantity), c?.unit ?? '', t.area ? USE_AREA_LABELS[t.area] : '',
            t.purpose ?? '', t.supplier ?? '', t.invoice_no ?? '', t.supplier_license ?? '', t.batch_no ?? '', t.person ?? '', t.note ?? '',
          ].map((value) => ({ value }))
        }),
      ]
      const columns = [11, 30, 12, 16, 10, 7, 16, 28, 26, 16, 24, 10, 18, 24].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`So_nhap_xuat_hoa_chat_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  return (
    <Card>
      <CardHeader
        title="Sổ nhập – xuất hóa chất"
        hint="Nhập: lưu bên bán, hóa đơn, giấy phép (bắt buộc với hóa chất nhóm kiểm soát). Xuất: nơi sử dụng, mục đích."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportXlsx} disabled={rows.length === 0}>
              <Download size={15} /> Xuất Excel
            </Button>
            {canEdit && (
              <Button onClick={() => setForm({ kind: 'xuat', txn_date: todayISO() })} disabled={chemicals.length === 0}>
                <Plus size={15} /> Ghi sổ
              </Button>
            )}
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3">
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="max-w-[180px]" aria-label="Loại">
          <option value="">Mọi loại</option>
          {Object.entries(TXN_KIND_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select value={area} onChange={(e) => setArea(e.target.value)} className="max-w-[180px]" aria-label="Khu vực">
          <option value="">Mọi khu vực</option>
          {Object.entries(USE_AREA_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
        <Select value={chem} onChange={(e) => setChem(e.target.value)} className="max-w-[220px]" aria-label="Hóa chất">
          <option value="">Mọi hóa chất</option>
          {chemicals.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label="Từ ngày" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label="Đến ngày" />
        <span className="ml-auto text-xs text-pine-800/50">{rows.length} dòng</span>
      </div>
      {err && (
        <div className="px-4 pt-3">
          <ErrorNote message={err} />
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState title="Chưa có dòng sổ phù hợp" />
      ) : (
        <Table head={['Ngày', 'Hóa chất', 'Loại', 'Số lượng', 'Nơi sử dụng / mục đích', 'Chứng từ', '']}>
          {rows.slice(0, 300).map((t) => {
            const c = byId.get(t.chemical_id)
            const missingDoc = t.kind === 'nhap' && !!c && CONTROLLED_GROUPS.includes(c.legal_group) && (!t.invoice_no || !t.supplier_license)
            return (
              <tr key={t.id}>
                <Td className="whitespace-nowrap">{fmtDate(t.txn_date)}</Td>
                <Td className="min-w-[180px] font-medium text-pine-800">{c?.name ?? '—'}</Td>
                <Td>
                  <Badge tone={TXN_KIND_TONE[t.kind]}>{TXN_KIND_LABELS[t.kind]}</Badge>
                </Td>
                <Td className="whitespace-nowrap font-medium">
                  <span className={sign(t) * Number(t.quantity) < 0 ? 'text-pine-800' : 'text-viridian-700'}>
                    {sign(t) * Number(t.quantity) > 0 ? '+' : ''}
                    {fmtNum(sign(t) * Number(t.quantity), 3)}
                  </span>{' '}
                  <span className="text-xs text-pine-800/50">{c?.unit}</span>
                </Td>
                <Td className="min-w-[180px] text-pine-800/70">
                  {t.area ? USE_AREA_LABELS[t.area] : t.kind === 'nhap' ? 'Nhập kho' : '—'}
                  {t.purpose && <div className="text-xs text-pine-800/50">{t.purpose}</div>}
                  {t.person && <div className="text-xs text-pine-800/45">{t.person}</div>}
                </Td>
                <Td className="min-w-[170px] text-xs text-pine-800/60">
                  {t.supplier && <div>{t.supplier}</div>}
                  {t.invoice_no && <div>HĐ: {t.invoice_no}</div>}
                  {t.supplier_license && <div>GP: {t.supplier_license}</div>}
                  {missingDoc && <Badge tone="amber">Thiếu chứng từ / giấy phép</Badge>}
                  {!t.supplier && !t.invoice_no && !missingDoc && '—'}
                </Td>
                <Td className="text-right">
                  {canEdit && (
                    <Button variant="ghost" aria-label="Xóa dòng" onClick={() => remove(t)}>
                      <Trash2 size={15} />
                    </Button>
                  )}
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
      <TxnModal form={form} setForm={setForm} base={base} chemicals={chemicals} stock={(id) => stockRows.find((r) => r.c.id === id)?.s} onClose={() => setForm(null)} />
    </Card>
  )
}
