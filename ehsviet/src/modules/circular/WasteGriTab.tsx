// Chất thải theo phương pháp xử lý cuối → GRI 306-3 (phát sinh), 306-4 (chuyển hướng khỏi thải bỏ), 306-5 (đưa đi thải bỏ),
// tách nguy hại / không nguy hại và theo hình thức xử lý.
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Card, CardHeader, EmptyState, ErrorNote, Kpi, Loading, Note, Select, Table, Td } from '../../components/UI'
import { WASTE_CATEGORY_LABELS } from '../../lib/constants'
import { DIVERTED_METHODS, isDiverted, TREATMENT_LABELS, wasteFate } from '../../lib/circular'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtNum } from '../../lib/utils'
import type { CircularData } from './useCircularData'

const DISPOSAL_METHODS = ['thu_hoi_nang_luong', 'dot', 'chon_lap', 'xu_ly_khac']
const t = (kg: number) => fmtNum(kg / 1000, 2)

export default function WasteGriTab({ data, canEdit }: { data: CircularData; canEdit: boolean }) {
  const qc = useQueryClient()
  const { types, wasteMass, wasteLogs, transferredKg, loading } = data
  const thisYear = new Date().getFullYear()
  const years = useMemo(() => {
    const s = new Set<number>([thisYear])
    for (const l of wasteLogs) s.add(Number(l.log_date.slice(0, 4)))
    return [...s].sort((a, b) => b - a)
  }, [wasteLogs, thisYear])
  const [year, setYear] = useState(thisYear - 1)
  const [err, setErr] = useState('')
  const fate = useMemo(() => wasteFate(wasteMass, year), [wasteMass, year])

  const byType = useMemo(
    () =>
      types.map((ty) => {
        const generated = wasteMass.filter((m) => m.typeId === ty.id && Number(m.date.slice(0, 4)) === year).reduce((s, m) => s + m.kg, 0)
        return { ty, generated, transferred: transferredKg.get(year + '|' + ty.id) ?? 0 }
      }),
    [types, wasteMass, transferredKg, year]
  )

  // Ma trận hình thức xử lý × nguy hại / không nguy hại (kg)
  const matrix = useMemo(() => {
    const m: Record<string, { haz: number; non: number }> = {}
    for (const it of wasteMass) {
      if (Number(it.date.slice(0, 4)) !== year || !it.method) continue
      const cell = (m[it.method] ??= { haz: 0, non: 0 })
      if (it.category === 'CTNH') cell.haz += it.kg
      else cell.non += it.kg
    }
    return m
  }, [wasteMass, year])

  const setMethod = async (id: string, method: string) => {
    setErr('')
    const { error } = await supabase.from('waste_types').update({ treatment_method: method || null }).eq('id', id)
    if (error) setErr(errMsg(error))
    else qc.invalidateQueries()
  }

  if (loading) return <Loading />

  const missing = types.filter((ty) => !ty.treatment_method).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Kpi label={`GRI 306-3 · Phát sinh ${year}`} value={t(fate.total) + ' t'} sub={`CTNH ${t(fate.hazardous.diverted + fate.hazardous.disposed + fate.hazardous.unknown)} t`} tone="blue" />
        <Kpi
          label="GRI 306-4 · Chuyển hướng"
          value={t(fate.diverted) + ' t'}
          sub={fate.divertedPct != null ? `${fmtNum(fate.divertedPct, 1)}% · tái chế, tái sử dụng, thu hồi` : '—'}
          tone="green"
        />
        <Kpi label="GRI 306-5 · Đưa đi thải bỏ" value={t(fate.disposed) + ' t'} sub="Đốt, chôn lấp, xử lý khác" tone="amber" />
        <Kpi
          label="Chưa xác định phương pháp"
          value={t(fate.unknown) + ' t'}
          sub={missing ? `${missing} loại chất thải chưa khai báo` : 'Đã khai báo đủ'}
          tone={fate.unknown > 0 ? 'red' : 'gray'}
        />
      </div>

      <Card>
        <CardHeader
          title={`Chất thải theo phương pháp xử lý – năm ${year}`}
          hint="Phương pháp xử lý cuối theo hợp đồng, chứng từ của đơn vị tiếp nhận; thay đổi tại đây áp dụng cho mọi năm"
          action={
            <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" aria-label="Năm">
              {years.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </Select>
          }
        />
        {err && (
          <div className="px-4 pt-3">
            <ErrorNote message={err} />
          </div>
        )}
        {types.length === 0 ? (
          <EmptyState title="Chưa khai báo danh mục chất thải" hint="Khai báo tại Chất thải & CTNH › Danh mục" />
        ) : (
          <Table head={['Chất thải', 'Phát sinh', 'Đã chuyển giao', 'Phương pháp xử lý cuối', 'GRI']}>
            {byType.map(({ ty, generated, transferred }) => (
              <tr key={ty.id}>
                <Td className="min-w-[220px]">
                  <div className="font-medium text-pine-800">{ty.name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-pine-800/50">
                    <Badge tone={ty.category === 'CTNH' ? 'red' : ty.category === 'CTRCNTT' ? 'blue' : 'gray'}>{WASTE_CATEGORY_LABELS[ty.category] ?? ty.category}</Badge>
                    {ty.code && <span className="font-mono">{ty.code}</span>}
                  </div>
                </Td>
                <Td className="whitespace-nowrap text-right [font-variant-numeric:tabular-nums]">{generated ? fmtNum(generated, 0) + ' kg' : '—'}</Td>
                <Td className="whitespace-nowrap text-right text-pine-800/70 [font-variant-numeric:tabular-nums]">{transferred ? fmtNum(transferred, 0) + ' kg' : '—'}</Td>
                <Td className="min-w-[200px]">
                  {canEdit ? (
                    <Select value={ty.treatment_method ?? ''} onChange={(e) => setMethod(ty.id, e.target.value)} aria-label={'Phương pháp xử lý ' + ty.name}>
                      <option value="">— Chưa xác định —</option>
                      <optgroup label="Chuyển hướng (GRI 306-4)">
                        {DIVERTED_METHODS.map((k) => (
                          <option key={k} value={k}>
                            {TREATMENT_LABELS[k]}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Thải bỏ (GRI 306-5)">
                        {DISPOSAL_METHODS.map((k) => (
                          <option key={k} value={k}>
                            {TREATMENT_LABELS[k]}
                          </option>
                        ))}
                      </optgroup>
                    </Select>
                  ) : (
                    <span className="text-pine-800/70">{ty.treatment_method ? TREATMENT_LABELS[ty.treatment_method] : '—'}</span>
                  )}
                </Td>
                <Td>
                  {!ty.treatment_method ? (
                    <Badge tone="amber">Chưa xác định</Badge>
                  ) : isDiverted(ty.treatment_method) ? (
                    <Badge tone="green">306-4</Badge>
                  ) : (
                    <Badge tone="gray">306-5</Badge>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title={`Bảng công bố GRI 306-4, 306-5 – năm ${year}`} hint="Khối lượng (t) theo hình thức xử lý, tách chất thải nguy hại / không nguy hại" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pine-800/10 text-xs uppercase tracking-wide text-pine-800/50">
                <th className="px-4 py-2.5 text-left font-medium">Hình thức</th>
                <th className="px-4 py-2.5 text-right font-medium">Nguy hại</th>
                <th className="px-4 py-2.5 text-right font-medium">Không nguy hại</th>
                <th className="px-4 py-2.5 text-right font-medium">Cộng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-800/5 [font-variant-numeric:tabular-nums]">
              {[
                { title: 'GRI 306-4 · Chuyển hướng khỏi thải bỏ', keys: DIVERTED_METHODS, total: fate.diverted, haz: fate.hazardous.diverted, non: fate.nonHazardous.diverted },
                { title: 'GRI 306-5 · Đưa đi thải bỏ', keys: DISPOSAL_METHODS, total: fate.disposed, haz: fate.hazardous.disposed, non: fate.nonHazardous.disposed },
              ].map((g) => (
                <GroupRows key={g.title} g={g} matrix={matrix} />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3">
          <Note>
            Số liệu theo nhật ký phát sinh và phương pháp xử lý khai báo của từng loại chất thải; đối chiếu chứng từ chuyển giao trước khi công bố (cột “Đã chuyển giao”). Toàn bộ là xử lý
            ngoài cơ sở (offsite) qua đơn vị có giấy phép. Bụi, hạt hồi lưu trong công nghệ không phải chất thải nên không có trong bảng này. Số liệu tự động chuyển sang ESG › Chỉ số GRI. Nhập
            phát sinh tại{' '}
            <Link to="/chat-thai" className="font-medium text-viridian-700 hover:underline">
              Chất thải & CTNH
            </Link>
            .
          </Note>
        </div>
      </Card>
    </div>
  )
}

function GroupRows({ g, matrix }: { g: { title: string; keys: string[]; total: number; haz: number; non: number }; matrix: Record<string, { haz: number; non: number }> }) {
  return (
    <>
      <tr className="bg-pine-800/[0.03] font-medium text-pine-800">
        <td className="px-4 py-2">{g.title}</td>
        <td className="px-4 py-2 text-right">{t(g.haz)}</td>
        <td className="px-4 py-2 text-right">{t(g.non)}</td>
        <td className="px-4 py-2 text-right">{t(g.total)}</td>
      </tr>
      {g.keys.map((k) => {
        const c = matrix[k] ?? { haz: 0, non: 0 }
        return (
          <tr key={k} className="text-pine-800/75">
            <td className="py-2 pl-8 pr-4">{TREATMENT_LABELS[k]}</td>
            <td className="px-4 py-2 text-right">{c.haz ? t(c.haz) : '—'}</td>
            <td className="px-4 py-2 text-right">{c.non ? t(c.non) : '—'}</td>
            <td className="px-4 py-2 text-right">{c.haz + c.non ? t(c.haz + c.non) : '—'}</td>
          </tr>
        )
      })}
    </>
  )
}
