// Báo cáo hóa chất theo quý (danh mục và lượng sử dụng – MT-HD02-BM01), phục vụ báo cáo định kỳ theo Luật Hóa chất 2025
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card, CardHeader, EmptyState, ErrorNote, Loading, Note, Select } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { LEGAL_GROUP_LABELS, quarterly, USE_AREA_LABELS } from '../../lib/chemicals'
import { errMsg, fmtNum, todayISO } from '../../lib/utils'
import type { ChemicalData } from './useChemicalData'

export default function ReportTab({ data }: { data: ChemicalData }) {
  const { facility } = useAuth()
  const { chemicals, txns, logs, rows, loading } = data
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)
  const [err, setErr] = useState('')

  const years = useMemo(() => {
    const s = new Set<number>([thisYear])
    for (const t of txns) s.add(Number(t.txn_date.slice(0, 4)))
    return [...s].sort((a, b) => b - a)
  }, [txns, thisYear])

  const table = useMemo(
    () =>
      chemicals
        .map((c) => {
          const q = quarterly(c, txns, logs, year)
          return { c, q, totalIn: q.reduce((s, x) => s + x.inQ, 0), totalUse: q.reduce((s, x) => s + x.useQ, 0), stock: rows.find((r) => r.c.id === c.id)?.s.stock ?? 0 }
        })
        .filter((x) => x.c.active || x.totalIn || x.totalUse)
        .sort((a, b) => (a.c.use_area ?? '').localeCompare(b.c.use_area ?? '') || a.c.name.localeCompare(b.c.name, 'vi')),
    [chemicals, txns, logs, year, rows]
  )

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true, align: 'center' as const })
      const cols = ['TT', 'Tên hóa chất', 'Thành phần / CAS', 'Nhóm pháp lý', 'PATHH', 'Bộ phận sử dụng', 'Đơn vị', 'Sử dụng quý I', 'Quý II', 'Quý III', 'Quý IV', 'Tổng sử dụng', 'Tổng nhập', 'Tồn hiện tại']
      const sheet: any[][] = [
        [{ value: `DANH MỤC HÓA CHẤT VÀ LƯỢNG SỬ DỤNG NĂM ${year} · ${facility?.name ?? ''}`, fontWeight: 'bold', columnSpan: cols.length }, ...Array(cols.length - 1).fill(null)],
        ['Theo mẫu MT-HD02-BM01; số liệu từ sổ nhập – xuất và nhật ký vận hành HTXLNT.'],
        [],
        cols.map(head),
        ...table.map(({ c, q, totalIn, totalUse, stock }, i) =>
          [
            i + 1, c.name, [c.formula, c.cas_no && 'CAS ' + c.cas_no].filter(Boolean).join(' · '), LEGAL_GROUP_LABELS[c.legal_group] ?? '', c.pathh_available ? 'Có' : 'Thiếu',
            USE_AREA_LABELS[c.use_area] ?? '', c.unit ?? '', ...q.map((x) => Number(x.useQ.toFixed(3))), Number(totalUse.toFixed(3)), Number(totalIn.toFixed(3)), Number(stock.toFixed(3)),
          ].map((value) => ({ value }))
        ),
      ]
      const columns = [5, 32, 22, 20, 8, 16, 7, 11, 11, 11, 11, 12, 11, 11].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`Bao_cao_hoa_chat_${year}_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  return (
    <Card>
      <CardHeader
        title={`Lượng sử dụng theo quý – năm ${year}`}
        hint="Danh mục hóa chất, lượng sử dụng quý I–IV (MT-HD02-BM01) – số liệu đầu vào cho báo cáo hóa chất định kỳ"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" aria-label="Năm">
              {years.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={exportXlsx} disabled={table.length === 0}>
              <Download size={15} /> Xuất Excel
            </Button>
          </div>
        }
      />
      {err && (
        <div className="px-4 pt-3">
          <ErrorNote message={err} />
        </div>
      )}
      {table.length === 0 ? (
        <EmptyState title="Chưa có số liệu" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-pine-800/10 text-xs uppercase tracking-wide text-pine-800/50">
                <th className="px-4 py-2.5 font-medium">Hóa chất</th>
                <th className="px-3 py-2.5 font-medium">Khu</th>
                {['Q I', 'Q II', 'Q III', 'Q IV'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-right font-medium">
                    {h}
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right font-medium">Tổng dùng</th>
                <th className="px-3 py-2.5 text-right font-medium">Tổng nhập</th>
                <th className="px-4 py-2.5 text-right font-medium">Tồn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-800/5">
              {table.map(({ c, q, totalIn, totalUse, stock }) => (
                <tr key={c.id}>
                  <td className="min-w-[200px] px-4 py-2 align-top">
                    <div className="font-medium text-pine-800">{c.name}</div>
                    <div className="text-xs text-pine-800/45">{c.unit}</div>
                  </td>
                  <td className="px-3 py-2 align-top text-xs text-pine-800/60">{USE_AREA_LABELS[c.use_area] ?? c.use_area}</td>
                  {q.map((x) => (
                    <td key={x.q} className="px-3 py-2 text-right align-top [font-variant-numeric:tabular-nums]">
                      {x.useQ ? fmtNum(x.useQ, 2) : '—'}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right align-top font-medium [font-variant-numeric:tabular-nums]">{fmtNum(totalUse, 2)}</td>
                  <td className="px-3 py-2 text-right align-top text-pine-800/70 [font-variant-numeric:tabular-nums]">{totalIn ? fmtNum(totalIn, 2) : '—'}</td>
                  <td className="px-4 py-2 text-right align-top text-pine-800/70 [font-variant-numeric:tabular-nums]">{fmtNum(stock, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-4 py-3">
        <Note>
          Báo cáo hoạt động hóa chất định kỳ: xác định đối tượng, mẫu và hạn theo Luật Hóa chất 69/2025/QH15 và nghị định hướng dẫn (NĐ 25/2026, NĐ 26/2026 – đối chiếu). Hóa chất nhóm kiểm soát: lưu
          hóa đơn, chứng từ mua bán, giấy phép bên bán và sổ theo dõi sử dụng.
        </Note>
      </div>
    </Card>
  )
}
