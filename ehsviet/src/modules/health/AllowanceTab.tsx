// Bồi dưỡng bằng hiện vật – TT 24/2022/TT-BLĐTBXH (mức 1–4)
import { useQueryClient } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Input, Kpi, Loading, Note, Select, Table, Td } from '../../components/UI'
import { ALLOWANCE_LABELS, ALLOWANCE_RATES, allowanceMonthly, EXPOSURES, type Exposure } from '../../lib/health'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtNum, todayISO } from '../../lib/utils'
import type { HealthData } from './useHealthData'

const vnd = (n: number) => fmtNum(n, 0) + ' đ'

export default function AllowanceTab({ data, canEdit }: { data: HealthData; canEdit: boolean }) {
  const qc = useQueryClient()
  const { employees, loading } = data
  const [days, setDays] = useState(26)
  const [onlyReceiving, setOnlyReceiving] = useState(false)
  const [err, setErr] = useState('')

  const rows = useMemo(
    () =>
      employees
        .filter((e) => !onlyReceiving || e.allowance_level)
        .sort((a, b) => (a.department ?? '').localeCompare(b.department ?? '', 'vi') || (a.code ?? '').localeCompare(b.code ?? '', 'vi')),
    [employees, onlyReceiving]
  )

  const stats = useMemo(() => {
    const receiving = employees.filter((e) => e.allowance_level)
    const monthly = receiving.reduce((s, e) => s + allowanceMonthly(e.allowance_level, days), 0)
    const byDept = new Map<string, { people: number; monthly: number; levels: Record<number, number> }>()
    for (const e of receiving) {
      const k = e.department ?? '—'
      const v = byDept.get(k) ?? { people: 0, monthly: 0, levels: {} }
      v.people++
      v.monthly += allowanceMonthly(e.allowance_level, days)
      v.levels[e.allowance_level!] = (v.levels[e.allowance_level!] ?? 0) + 1
      byDept.set(k, v)
    }
    // NLĐ có yếu tố tiếp xúc nhưng chưa xác định mức bồi dưỡng → cần rà soát
    const review = employees.filter((e) => !e.allowance_level && (e.exposures ?? []).length > 0).length
    return { receiving: receiving.length, monthly, yearly: monthly * 12, byDept: [...byDept.entries()].sort((a, b) => b[1].monthly - a[1].monthly), review }
  }, [employees, days])

  const setLevel = async (id: string, level: string) => {
    setErr('')
    const { error } = await supabase.from('employees').update({ allowance_level: level ? Number(level) : null }).eq('id', id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  const exportXlsx = async () => {
    setErr('')
    try {
      const { default: writeXlsxFile } = await import('write-excel-file/browser')
      const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#DCE7E1', wrap: true })
      const list = employees.filter((e) => e.allowance_level)
      const sheet: any[][] = [
        [{ value: `DANH SÁCH BỒI DƯỠNG BẰNG HIỆN VẬT (${days} ngày làm việc/tháng)`, fontWeight: 'bold', columnSpan: 8 }, ...Array(7).fill(null)],
        ['Căn cứ: TT 24/2022/TT-BLĐTBXH – mức 1: 13.000 đ; mức 2: 20.000 đ; mức 3: 26.000 đ; mức 4: 32.000 đ/ngày làm việc; cấp bằng hiện vật, không trả tiền thay.'],
        [],
        ['Mã', 'Họ tên', 'Bộ phận', 'Chức danh', 'Yếu tố tiếp xúc', 'Mức', 'Định suất (đ/ngày)', 'Dự kiến (đ/tháng)'].map(head),
        ...list.map((e) =>
          [
            e.code ?? '',
            e.full_name,
            e.department ?? '',
            e.position ?? '',
            (e.exposures ?? []).map((x) => EXPOSURES[x as Exposure]?.label ?? x).join(', '),
            e.allowance_level!,
            ALLOWANCE_RATES[e.allowance_level!],
            allowanceMonthly(e.allowance_level, days),
          ].map((value) => ({ value }))
        ),
        [],
        [{ value: 'Tổng cộng', fontWeight: 'bold' }, null, null, null, null, { value: list.length }, null, { value: stats.monthly, fontWeight: 'bold' }],
      ]
      const columns = [8, 24, 22, 20, 30, 6, 14, 16].map((width) => ({ width }))
      await writeXlsxFile(sheet, { columns } as any).toFile(`Boi_duong_hien_vat_${todayISO()}.xlsx`)
    } catch (e) {
      setErr(errMsg(e))
    }
  }

  if (loading) return <Loading />

  return (
    <div className="space-y-4">
      {err && <ErrorNote message={err} />}
      <div className="flex flex-wrap gap-3">
        <Kpi label="NLĐ hưởng bồi dưỡng" value={stats.receiving} sub={`trên ${employees.length} người đang làm việc`} tone="blue" />
        <Kpi label="Dự kiến mỗi tháng" value={vnd(stats.monthly)} sub={`${days} ngày làm việc`} />
        <Kpi label="Dự kiến cả năm" value={vnd(stats.yearly)} sub="đưa vào kế hoạch ATVSLĐ" />
        <Kpi label="Cần rà soát mức" value={stats.review} sub="có yếu tố tiếp xúc, chưa xác định mức" tone={stats.review ? 'amber' : 'gray'} />
      </div>

      {stats.byDept.length > 0 && (
        <Card>
          <CardHeader title="Theo bộ phận" />
          <Table head={['Bộ phận', 'Số người', 'Theo mức', 'Dự kiến/tháng']}>
            {stats.byDept.map(([d, v]) => (
              <tr key={d}>
                <Td className="min-w-[180px] font-medium">{d}</Td>
                <Td className="text-center">{v.people}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(v.levels).map(([lv, c]) => (
                      <Badge key={lv} tone="gray">
                        Mức {lv}: {c}
                      </Badge>
                    ))}
                  </div>
                </Td>
                <Td className="whitespace-nowrap">{vnd(v.monthly)}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Mức bồi dưỡng từng người"
          hint="Xác định theo yếu tố nguy hiểm, có hại và kết quả quan trắc môi trường lao động"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm text-pine-800/70">
                Ngày làm việc/tháng
                <Input type="number" min={1} max={31} value={days} onChange={(e) => setDays(Math.max(1, Math.min(31, Number(e.target.value) || 26)))} className="w-20" />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-pine-800/70">
                <input type="checkbox" checked={onlyReceiving} onChange={(e) => setOnlyReceiving(e.target.checked)} /> Chỉ người được hưởng
              </label>
              <Button variant="outline" onClick={exportXlsx}>
                <Download size={15} /> Xuất danh sách
              </Button>
            </div>
          }
        />
        {rows.length === 0 ? (
          <EmptyState title="Chưa có người lao động" />
        ) : (
          <Table head={['Người lao động', 'Bộ phận', 'Yếu tố tiếp xúc', 'Mức bồi dưỡng', 'Dự kiến/tháng']}>
            {rows.map((e) => (
              <tr key={e.id}>
                <Td className="min-w-[180px]">
                  <div className="font-medium">{e.full_name}</div>
                  <div className="text-xs text-pine-800/50">
                    {e.code ?? '—'} · {e.position ?? '—'}
                  </div>
                </Td>
                <Td className="min-w-[140px] text-pine-800/70">{e.department ?? '—'}</Td>
                <Td className="min-w-[160px]">
                  <div className="flex flex-wrap gap-1">
                    {(e.exposures ?? []).map((x) => (
                      <Badge key={x} tone="gray">
                        {EXPOSURES[x as Exposure]?.label ?? x}
                      </Badge>
                    ))}
                    {!(e.exposures ?? []).length && <span className="text-xs text-pine-800/40">—</span>}
                  </div>
                </Td>
                <Td className="min-w-[170px]">
                  {canEdit ? (
                    <Select value={e.allowance_level ?? ''} onChange={(ev) => setLevel(e.id, ev.target.value)} aria-label={`Mức bồi dưỡng ${e.full_name}`}>
                      <option value="">Không hưởng</option>
                      {Object.entries(ALLOWANCE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Select>
                  ) : e.allowance_level ? (
                    ALLOWANCE_LABELS[e.allowance_level]
                  ) : (
                    '—'
                  )}
                </Td>
                <Td className="whitespace-nowrap">{e.allowance_level ? vnd(allowanceMonthly(e.allowance_level, days)) : '—'}</Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Note>
        TT 24/2022/TT-BLĐTBXH: bồi dưỡng bằng hiện vật cho người làm việc trong điều kiện có yếu tố nguy hiểm, yếu tố có hại – mức 1: 13.000 đ; mức 2:
        20.000 đ; mức 3: 26.000 đ; mức 4: 32.000 đ/ngày làm việc; cấp bằng hiện vật, không trả tiền thay. Xử phạt khi không thực hiện: NĐ 283/2026 Điều 33
        k8 (3–30 triệu; tổ chức ×2). Định mức thực tế do Phòng Tổ chức – Hành chính xác định theo danh mục công việc và kết quả QTMTLĐ.
      </Note>
    </div>
  )
}
