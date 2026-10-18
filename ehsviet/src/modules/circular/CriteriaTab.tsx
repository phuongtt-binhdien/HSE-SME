// Đối chiếu tiêu chí dự án tuần hoàn (QĐ 46/2026/QĐ-TTg PL II – I.6, bản tóm tắt) từ số liệu sẵn có:
// sản lượng, nguyên liệu (ESG › GRI 301-1), năng lượng và KNK (Kiểm kê KNK), nước tái sử dụng, quan trắc nước thải.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, CardHeader, Loading, Note, Select } from '../../components/UI'
import { circularCriteria, CRITERION_LABELS, CRITERION_TONE, QD46_NOTE, wastewaterCompliance, waterReuse } from '../../lib/circular'
import { summarize } from '../../lib/ghg'
import { fmtFixed, fmtNum } from '../../lib/utils'
import type { CircularData } from './useCircularData'

export default function CriteriaTab({ data }: { data: CircularData }) {
  const { flows, wwLogs, wwPointIds, results, activities, metric, loading } = data
  const thisYear = new Date().getFullYear()
  const candidates = Array.from({ length: 8 }, (_, i) => thisYear - i)
  const prodYears = candidates.filter((y) => metric(y, 'production_t') != null)
  const [evalYear, setEvalYear] = useState(() => (prodYears.includes(thisYear - 1) ? thisYear - 1 : thisYear))
  const [baseYear, setBaseYear] = useState(() => prodYears[prodYears.length - 1] ?? thisYear - 2)

  const stats = useMemo(() => {
    const at = (y: number) => {
      const production = metric(y, 'production_t')
      const raw = metric(y, 'GRI 301-1')
      const ghg = summarize(activities, y)
      const per = (v: number | null) => (v != null && production ? v / production : null)
      return {
        y,
        production,
        raw,
        rawPerT: per(raw),
        gj: ghg.gj || null,
        gjPerT: per(ghg.gj || null),
        ghg: ghg.hasData ? ghg.total12 : null,
        ghgPerT: ghg.hasData ? per(ghg.total12) : null,
        water: waterReuse(flows, y, metric(y, 'GRI 303-4'), wwLogs),
        ww: wastewaterCompliance(results, wwPointIds, y),
      }
    }
    return { base: at(baseYear), now: at(evalYear) }
  }, [metric, activities, flows, wwLogs, results, wwPointIds, baseYear, evalYear])

  const criteria = useMemo(() => {
    const { base, now } = stats
    const ghgChange = base.ghgPerT && now.ghgPerT != null ? ((base.ghgPerT - now.ghgPerT) / base.ghgPerT) * 100 : null
    return circularCriteria({
      rawPerT: { base: base.rawPerT, now: now.rawPerT, baseYear, year: evalYear },
      energyPerT: { base: base.gjPerT, now: now.gjPerT, baseYear, year: evalYear },
      waterReusePct: now.water.pct,
      wastewaterOkPct: now.ww.pct,
      ghgIntensityChangePct: ghgChange,
    })
  }, [stats, baseYear, evalYear])

  if (loading) return <Loading />

  const count = (s: string) => criteria.filter((c) => c.state === s).length
  const verdict = count('chua_dat') > 0 ? { tone: 'red' as const, text: 'Chưa đạt bộ tiêu chí (có chỉ tiêu không đạt)' } : count('thieu') > 0 ? { tone: 'amber' as const, text: 'Chưa đủ số liệu để kết luận' } : { tone: 'green' as const, text: 'Đạt các chỉ tiêu định lượng' }
  const partial = evalYear === thisYear

  const inputs: [string, (s: typeof stats.base) => string][] = [
    ['Sản lượng thành phẩm', (s) => (s.production != null ? fmtNum(s.production, 0) + ' t' : '—')],
    ['Nguyên liệu, vật liệu sử dụng (GRI 301-1)', (s) => (s.raw != null ? fmtNum(s.raw, 0) + ' t' : '—')],
    ['Nguyên liệu / tấn sản phẩm', (s) => (s.rawPerT != null ? fmtFixed(s.rawPerT, 4) + ' t/t' : '—')],
    ['Năng lượng (GRI 302-1)', (s) => (s.gj != null ? fmtNum(s.gj, 0) + ' GJ' : '—')],
    ['Năng lượng / tấn sản phẩm', (s) => (s.gjPerT != null ? fmtFixed(s.gjPerT, 4) + ' GJ/t' : '—')],
    ['KNK phạm vi 1 + 2', (s) => (s.ghg != null ? fmtNum(s.ghg, 0) + ' tCO₂e' : '—')],
    ['Cường độ KNK', (s) => (s.ghgPerT != null ? fmtFixed(s.ghgPerT, 4) + ' tCO₂e/t' : '—')],
    ['Nước sau xử lý tái sử dụng', (s) => (s.water.reuse ? fmtNum(s.water.reuse, 0) + ' m³' + (s.water.pct != null ? ` (${fmtNum(s.water.pct, 1)}%)` : '') : '—')],
    ['Lượt quan trắc nước thải đạt', (s) => (s.ww.total ? `${s.ww.ok}/${s.ww.total}` : '—')],
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Tiêu chí dự án, phương án sản xuất tuần hoàn – nhóm chế biến, hóa chất"
          hint="QĐ 46/2026/QĐ-TTg Phụ lục II mục I.6 (bản tóm tắt – đối chiếu bản gốc); mỗi chỉ tiêu là ngưỡng bắt buộc"
          action={
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-pine-800/55">Năm cơ sở</span>
              <Select value={baseYear} onChange={(e) => setBaseYear(Number(e.target.value))} className="w-24" aria-label="Năm cơ sở">
                {candidates.filter((y) => y < evalYear).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
              <span className="text-pine-800/55">Năm đánh giá</span>
              <Select value={evalYear} onChange={(e) => setEvalYear(Number(e.target.value))} className="w-24" aria-label="Năm đánh giá">
                {candidates.filter((y) => y > baseYear).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-pine-800/10 px-4 py-3 text-sm">
          <Badge tone={verdict.tone}>{verdict.text}</Badge>
          <span className="text-pine-800/60">
            Đạt {count('dat')} · chưa đạt {count('chua_dat')} · thiếu số liệu {count('thieu')}
          </span>
          {partial && <span className="text-xs text-amber-700">Năm {evalYear} chưa đủ 12 tháng – số liệu lũy kế</span>}
        </div>
        <div className="divide-y divide-pine-800/5">
          {criteria.map((c) => (
            <div key={c.key} className="grid gap-2 px-4 py-3 sm:grid-cols-[1fr_170px_190px_110px] sm:items-start">
              <div>
                <div className="text-sm font-medium text-pine-800">{c.title}</div>
                <div className="mt-0.5 text-xs text-pine-800/50">{c.note}</div>
              </div>
              <div className="text-sm text-pine-800/70">{c.threshold}</div>
              <div className="text-sm font-medium text-pine-800 [font-variant-numeric:tabular-nums]">{c.value}</div>
              <div>
                <Badge tone={CRITERION_TONE[c.state]}>{CRITERION_LABELS[c.state]}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Số liệu đầu vào" hint="Sửa số liệu tại nguồn: ESG › Chỉ số GRI (sản lượng, GRI 301-1, 303-4), Kiểm kê KNK, Vận hành & Quan trắc, Dòng tuần hoàn" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pine-800/10 text-xs uppercase tracking-wide text-pine-800/50">
                <th className="px-4 py-2.5 text-left font-medium">Chỉ số</th>
                <th className="px-4 py-2.5 text-right font-medium">Năm cơ sở {baseYear}</th>
                <th className="px-4 py-2.5 text-right font-medium">Năm đánh giá {evalYear}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-800/5 [font-variant-numeric:tabular-nums]">
              {inputs.map(([label, f]) => (
                <tr key={label}>
                  <td className="px-4 py-2 text-pine-800/80">{label}</td>
                  <td className="px-4 py-2 text-right text-pine-800/70">{f(stats.base)}</td>
                  <td className="px-4 py-2 text-right font-medium text-pine-800">{f(stats.now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Note>
        Nhà máy NPK phối trộn – tạo hạt có tiêu hao nguyên liệu/tấn sát cân bằng vật chất: hồi lưu bụi, hạt ngoài cỡ chủ yếu giảm hao hụt; mức giảm ≥ 10% thường cần thay đổi công thức,
        nguyên liệu hoặc công nghệ. Ưu tiên các chỉ tiêu khả thi: tái sử dụng nước sau xử lý, tiết kiệm năng lượng (biến tần, thu hồi nhiệt lò sấy), nhiên liệu sinh khối. {QD46_NOTE}{' '}
        <Link to="/esg" className="font-medium text-viridian-700 hover:underline">
          Nhập số liệu tại ESG
        </Link>
        .
      </Note>
    </div>
  )
}
