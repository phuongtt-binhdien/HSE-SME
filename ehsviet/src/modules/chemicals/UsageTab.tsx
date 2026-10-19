// Sử dụng hóa chất tại phòng thí nghiệm và HTXLNT: lượng dùng 30 ngày, liều dùng theo lưu lượng, số ngày còn dùng được
import { format, subDays } from 'date-fns'
import { ArrowUpFromLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardHeader, EmptyState, Kpi, Loading, Note, Table, Td } from '../../components/UI'
import { logUsage } from '../../lib/chemicals'
import { fmtDate, fmtNum, todayISO } from '../../lib/utils'
import { TxnModal } from './modals'
import type { ChemicalData } from './useChemicalData'

export default function UsageTab({ data, base, canEdit }: { data: ChemicalData; base: Record<string, string>; canEdit: boolean }) {
  const { rows, txns, logs, chemicals, loading } = data
  const [form, setForm] = useState<any>(null)
  const since = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const used30 = (id: string) => txns.filter((t) => t.chemical_id === id && t.kind === 'xuat' && t.txn_date >= since).reduce((s, t) => s + Number(t.quantity), 0)

  const lab = useMemo(() => rows.filter((r) => r.c.use_area === 'phong_thi_nghiem' && r.c.active), [rows])
  const labLog = useMemo(() => {
    const ids = new Set(lab.map((r) => r.c.id))
    return txns.filter((t) => (t.area === 'phong_thi_nghiem' || ids.has(t.chemical_id)) && t.kind !== 'nhap').slice(0, 30)
  }, [txns, lab])

  const wwtp = useMemo(() => rows.filter((r) => r.c.use_area === 'htxlnt' && r.c.active), [rows])
  const flow30 = useMemo(() => logs.filter((l) => l.log_date >= since).reduce((s, l) => s + Number((l as any).influent_flow ?? 0), 0), [logs, since])
  const days30 = useMemo(() => new Set(logs.filter((l) => l.log_date >= since).map((l) => l.log_date)).size, [logs, since])

  if (loading) return <Loading />

  const byId = new Map(chemicals.map((c) => [c.id, c]))

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Phòng thí nghiệm"
          hint="Thuốc thử phân tích sản phẩm, nước thải nội bộ – theo dõi hạn dùng, tồn và lượng dùng"
          action={
            canEdit && (
              <Button onClick={() => setForm({ kind: 'xuat', txn_date: todayISO(), area: 'phong_thi_nghiem', chemical_id: lab[0]?.c.id ?? '' })} disabled={!lab.length}>
                <ArrowUpFromLine size={15} /> Ghi sử dụng
              </Button>
            )
          }
        />
        {lab.length === 0 ? (
          <EmptyState title="Chưa khai báo hóa chất phòng thí nghiệm" hint='Khai báo hóa chất với khu vực sử dụng "Phòng thí nghiệm"' />
        ) : (
          <Table head={['Hóa chất', 'Tồn', 'Dùng 30 ngày', 'Hạn sử dụng', 'Cảnh báo']}>
            {lab.map(({ c, s, alerts }) => (
              <tr key={c.id}>
                <Td className="min-w-[220px]">
                  <div className="font-medium text-pine-800">{c.name}</div>
                  <div className="text-xs text-pine-800/50">{[c.cas_no && 'CAS ' + c.cas_no, c.storage_location].filter(Boolean).join(' · ')}</div>
                </Td>
                <Td className="whitespace-nowrap">
                  {fmtNum(s.stock, 3)} {c.unit}
                </Td>
                <Td className="whitespace-nowrap text-pine-800/70">
                  {fmtNum(used30(c.id), 3)} {c.unit}
                </Td>
                <Td className="whitespace-nowrap">{fmtDate(c.expiry_date)}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">{alerts.length ? alerts.map((a) => <Badge key={a.label} tone={a.tone}>{a.label}</Badge>) : <span className="text-xs text-pine-800/35">—</span>}</div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
        {labLog.length > 0 && (
          <div className="border-t border-pine-800/10">
            <div className="px-4 pt-3 text-xs font-semibold uppercase tracking-wide text-pine-800/50">Sổ sử dụng gần đây</div>
            <Table head={['Ngày', 'Hóa chất', 'Lượng', 'Mục đích', 'Người dùng']}>
              {labLog.map((t) => (
                <tr key={t.id}>
                  <Td className="whitespace-nowrap">{fmtDate(t.txn_date)}</Td>
                  <Td>{byId.get(t.chemical_id)?.name ?? '—'}</Td>
                  <Td className="whitespace-nowrap">
                    {t.kind === 'dieu_chinh' && Number(t.quantity) >= 0 ? '+' : '−'}
                    {fmtNum(Math.abs(Number(t.quantity)), 3)} {byId.get(t.chemical_id)?.unit}
                  </Td>
                  <Td className="text-pine-800/70">{t.purpose ?? t.note ?? '—'}</Td>
                  <Td className="text-pine-800/60">{t.person ?? '—'}</Td>
                </tr>
              ))}
            </Table>
          </div>
        )}
        <div className="px-4 pb-4 pt-2">
          <Note>
            Dịch thải phân tích COD (chứa Cr⁶⁺, Hg, Ag), hóa chất hết hạn và bao bì dính hóa chất là CTNH: thu gom can riêng có nhãn, ghi "Thải bỏ (CTNH)" tại sổ và phát sinh tại Chất thải & CTNH.
          </Note>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Kpi label="Nước thải xử lý 30 ngày" value={flow30 ? fmtNum(flow30, 0) + ' m³' : '—'} sub={days30 ? `${days30} ngày có nhật ký` : 'chưa có nhật ký'} tone="blue" />
        <Kpi label="Lưu lượng bình quân" value={days30 ? fmtNum(flow30 / days30, 1) + ' m³/ngày' : '—'} />
      </div>

      <Card>
        <CardHeader
          title="Hóa chất HTXLNT"
          hint="Hóa chất liên kết cột nhật ký vận hành được trừ tồn tự động; NaOH chỉnh pH ghi phiếu xuất"
          action={
            <Link to="/van-hanh" className="text-xs font-medium text-viridian-700 hover:underline">
              Nhật ký vận hành →
            </Link>
          }
        />
        {wwtp.length === 0 ? (
          <EmptyState title="Chưa khai báo hóa chất HTXLNT" />
        ) : (
          <Table head={['Hóa chất', 'Tồn', 'Dùng 30 ngày', 'Liều dùng', 'Còn dùng được', 'Cảnh báo']}>
            {wwtp.map(({ c, s, alerts }) => {
              const u = used30(c.id) + logUsage(c, logs, since > c.created_at.slice(0, 10) ? since : c.created_at.slice(0, 10))
              const dose = flow30 > 0 && c.unit === 'kg' ? (u * 1000) / flow30 : null
              return (
                <tr key={c.id}>
                  <Td className="min-w-[220px]">
                    <div className="font-medium text-pine-800">{c.name}</div>
                    <div className="text-xs text-pine-800/50">{c.log_key ? `Theo nhật ký: cột "${c.log_key}"` : 'Theo phiếu xuất'}</div>
                  </Td>
                  <Td className="whitespace-nowrap">
                    {fmtNum(s.stock)} {c.unit}
                  </Td>
                  <Td className="whitespace-nowrap text-pine-800/70">
                    {fmtNum(u)} {c.unit}
                  </Td>
                  <Td className="whitespace-nowrap text-pine-800/70">{dose != null ? fmtNum(dose, 0) + ' g/m³' : '—'}</Td>
                  <Td className="whitespace-nowrap">{s.daysLeft != null ? `≈ ${s.daysLeft} ngày` : '—'}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">{alerts.length ? alerts.map((a) => <Badge key={a.label} tone={a.tone}>{a.label}</Badge>) : <span className="text-xs text-pine-800/35">—</span>}</div>
                  </Td>
                </tr>
              )
            })}
          </Table>
        )}
      </Card>

      <TxnModal form={form} setForm={setForm} base={base} chemicals={chemicals} stock={(id) => rows.find((r) => r.c.id === id)?.s} onClose={() => setForm(null)} />
    </div>
  )
}
