// Đánh giá đơn vị: xếp loại tháng A–D, hệ số quỹ lương tham khảo, thi đua quý
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Input, Loading, Note, Table, Tabs, Td, type Tone } from '../../components/UI'
import { COEF_BANDS, evaluateUnits, GRADE_BANDS, gradeOf, quarterEmulation, salaryCoefficient } from '../../lib/rules'
import { errMsg, fmtNum } from '../../lib/utils'
import { currentMonth, monthLabel, monthRange, type RulesData } from './shared'

const GRADE_TONE: Record<string, Tone> = { A: 'green', B: 'blue', C: 'amber', D: 'red' }
const coefText = (c: number) => (c > 0 ? '+' : '−') + fmtNum(Math.abs(c), 1) + '%'

export default function EvaluationTab({ data }: { data: RulesData }) {
  const { violations, departments, loading } = data
  const [mode, setMode] = useState('thang')
  const [month, setMonth] = useState(currentMonth())
  const [err, setErr] = useState('')

  const monthly = useMemo(() => {
    const { from, to } = monthRange(month)
    const evals = new Map(evaluateUnits(violations, from, to).map((e) => [e.department, e]))
    return departments.map(
      (d) =>
        evals.get(d) ?? { department: d, thong_so: 0, khu_vuc: 0, diem_thu_gom: 0, hanh_vi: 0, total: 0, communityImpact: false, open: 0 }
    )
  }, [violations, departments, month])

  const [y, m] = month.split('-').map(Number)
  const qStart = Math.floor((m - 1) / 3) * 3 + 1
  const qMonths = [qStart, qStart + 1, qStart + 2].map((mm) => `${y}-${String(mm).padStart(2, '0')}`)
  const quarter = useMemo(
    () =>
      departments.map((d) => {
        const counts = qMonths.map((qm) => {
          const { from, to } = monthRange(qm)
          return evaluateUnits(violations, from, to).find((e) => e.department === d)?.total ?? 0
        })
        return { department: d, counts, total: counts.reduce((s, c) => s + c, 0) }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [violations, departments, qMonths.join()]
  )

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const sheet: any[][] = [
        [{ value: `TỔNG HỢP KIỂM TRA MÔI TRƯỜNG – VSCN ${monthLabel(month).toUpperCase()}`, fontWeight: 'bold', columnSpan: 9 }, ...Array(8).fill(null)],
        [],
        ['Đơn vị', 'Thông số vượt', 'Khu vực VSCN', 'Điểm thu gom', 'Hành vi sai', 'Tổng lần không đạt', 'Xếp loại', 'Hệ số quỹ lương (tham khảo)', 'Còn mở'].map(head),
        ...monthly.map((r) => [
          r.department,
          r.thong_so,
          r.khu_vuc,
          r.diem_thu_gom,
          r.hanh_vi,
          r.total,
          gradeOf(r.total).grade,
          coefText(salaryCoefficient(r.total, r.communityImpact)),
          r.open,
        ]),
        [],
        ['Ghi chú: hệ số là căn cứ đánh giá hoàn thành nhiệm vụ trong Quy chế trả lương, thưởng; không phạt tiền người lao động (BLLĐ 2019 Điều 127).'],
      ]
      const columns = [{ width: 32 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 12 }, { width: 10 }, { width: 18 }, { width: 9 }]
      await writeXlsxFile(sheet, { columns } as any).toFile(`Xep_loai_don_vi_${month}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs
          tabs={[
            { key: 'thang', label: 'Xếp loại tháng' },
            { key: 'quy', label: 'Thi đua quý' },
          ]}
          active={mode}
          onChange={setMode}
        />
        <Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="max-w-[170px]" aria-label="Tháng" />
        <Button variant="outline" className="ml-auto" onClick={exportXlsx} disabled={!monthly.length}>
          <Download size={15} /> Xuất bảng tổng hợp tháng
        </Button>
      </div>
      {err && <ErrorNote message={err} />}

      {departments.length === 0 ? (
        <Card>
          <EmptyState title="Chưa có đơn vị" hint="Đơn vị lấy từ danh sách nhân sự và các vi phạm đã ghi nhận" />
        </Card>
      ) : mode === 'thang' ? (
        <Card>
          <CardHeader title={'Xếp loại đơn vị ' + monthLabel(month)} hint="Mỗi lần không đạt: thông số vượt giới hạn, khu vực / điểm thu gom không đạt, hành vi đổ – xả – đốt sai quy định" />
          <Table head={['Đơn vị', 'Thông số', 'Khu vực', 'Điểm thu gom', 'Hành vi', 'Tổng', 'Xếp loại', 'Hệ số tham khảo', 'Còn mở']}>
            {monthly.map((r) => {
              const g = gradeOf(r.total)
              const c = salaryCoefficient(r.total, r.communityImpact)
              return (
                <tr key={r.department}>
                  <Td className="min-w-[150px] font-medium">{r.department}</Td>
                  <Td className="text-center">{r.thong_so || '·'}</Td>
                  <Td className="text-center">{r.khu_vuc || '·'}</Td>
                  <Td className="text-center">{r.diem_thu_gom || '·'}</Td>
                  <Td className="text-center">{r.hanh_vi || '·'}</Td>
                  <Td className="text-center font-semibold">{r.total}</Td>
                  <Td>
                    <Badge tone={GRADE_TONE[g.grade]}>Loại {g.grade}</Badge>
                    {g.note && r.total > 0 && <div className="mt-1 max-w-[200px] text-[11px] text-pine-800/50">{g.note}</div>}
                  </Td>
                  <Td className={'whitespace-nowrap font-medium ' + (c > 0 ? 'text-viridian-700' : 'text-red-700')}>
                    {coefText(c)}
                    {r.communityImpact && <div className="text-[11px] font-normal">Ảnh hưởng khu dân cư</div>}
                  </Td>
                  <Td className="text-center">{r.open ? <Badge tone="red">{r.open}</Badge> : '·'}</Td>
                </tr>
              )
            })}
          </Table>
        </Card>
      ) : (
        <Card>
          <CardHeader
            title={`Thi đua quý ${Math.floor((m - 1) / 3) + 1}/${y}`}
            hint="Theo tổng số lần vi phạm trong quý: 2–3 lần không nhận cờ; 4–5 không biểu dương; 6–7 không xếp loại A; từ 8 không xếp loại B"
          />
          <Table head={['Đơn vị', ...qMonths.map((qm) => 'T' + Number(qm.slice(5))), 'Tổng quý', 'Thi đua quý']}>
            {quarter.map((r) => {
              const e = quarterEmulation(r.total)
              return (
                <tr key={r.department}>
                  <Td className="min-w-[150px] font-medium">{r.department}</Td>
                  {r.counts.map((c, i) => (
                    <Td key={i} className="text-center">
                      {c || '·'}
                    </Td>
                  ))}
                  <Td className="text-center font-semibold">{r.total}</Td>
                  <Td>
                    <Badge tone={e.tone}>{e.label}</Badge>
                  </Td>
                </tr>
              )
            })}
          </Table>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Xếp loại tháng" hint="Quy định tuân thủ môi trường nội bộ" />
          <Table head={['Số lần không đạt', 'Xếp loại', 'Ghi chú']}>
            {GRADE_BANDS.map((b) => (
              <tr key={b.grade}>
                <Td>{b.max === Infinity ? '≥ ' + b.min : b.min}</Td>
                <Td>
                  <Badge tone={GRADE_TONE[b.grade]}>{b.grade}</Badge>
                </Td>
                <Td className="text-xs text-pine-800/60">{b.note}</Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card>
          <CardHeader title="Hệ số thưởng / trừ quỹ lương sản xuất (tham khảo)" hint="Bảng tiêu chuẩn môi trường – áp dụng cho tập thể đơn vị" />
          <Table head={['Số lần vi phạm trong tháng', 'Mức']}>
            {COEF_BANDS.map((b) => (
              <tr key={b.label}>
                <Td>{b.label}</Td>
                <Td className="font-medium">{b.value}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
      <Note tone="amber">
        Hệ số chỉ là <b>căn cứ đánh giá mức độ hoàn thành nhiệm vụ của đơn vị</b> trong Quy chế trả lương, thưởng (Phòng Tổ chức – Hành
        chính ban hành tỷ lệ chính thức, có ý kiến tổ chức đại diện người lao động). Không áp dụng phạt tiền, cắt lương cá nhân người lao
        động (Bộ luật Lao động 2019 Điều 127); cá nhân vi phạm xử lý kỷ luật theo Nội quy lao động.
      </Note>
    </div>
  )
}
