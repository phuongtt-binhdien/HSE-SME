// Kết quả các lượt kiểm tra: điểm đạt, mục không đạt, hành động khắc phục đã tạo
import { useQueryClient } from '@tanstack/react-query'
import { Eye, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Button, Card, CardHeader, EmptyState, ErrorNote, Loading, Select, Table, Td } from '../../components/UI'
import { isCapaForItem } from '../../lib/capa'
import { CHECKLIST_CATEGORY_LABELS } from '../../lib/constants'
import { periodLabel, type ChecklistRun } from '../../lib/inspection'
import { supabase } from '../../lib/supabase'
import { errMsg, fmtDate } from '../../lib/utils'
import { RunViewModal, scoreTone } from './checklist'
import type { InspectionData } from './useInspectionData'

export default function RunsTab({ data, base, canEdit }: { data: InspectionData; base: Record<string, string>; canEdit: boolean }) {
  const qc = useQueryClient()
  const { runs, plans, capa, tplById, planById, loading } = data
  const [plan, setPlan] = useState('')
  const [onlyFail, setOnlyFail] = useState(false)
  const [view, setView] = useState<ChecklistRun | null>(null)
  const [err, setErr] = useState('')

  const rows = useMemo(
    () =>
      runs
        .filter((r) => !plan || (plan === 'none' ? !r.plan_id : r.plan_id === plan))
        .map((r) => {
          const fails = (r.results ?? []).filter((x) => x.status === 'khong_dat')
          const withCapa = fails.filter((x) => capa.some((a) => isCapaForItem(a, r.id, x.label))).length
          return { r, fails: fails.length, withCapa }
        })
        .filter((x) => !onlyFail || x.fails > 0),
    [runs, plan, onlyFail, capa]
  )

  const remove = async (r: ChecklistRun) => {
    if (!window.confirm('Xóa lượt kiểm tra này? Hành động khắc phục đã tạo vẫn giữ lại.')) return
    const { error } = await supabase.from('checklist_runs').delete().eq('id', r.id)
    if (error) setErr(errMsg(error))
    await qc.invalidateQueries()
  }

  if (loading) return <Loading />

  return (
    <Card>
      <CardHeader
        title="Kết quả kiểm tra"
        hint="Điểm đạt = tỷ lệ hạng mục đạt (loại trừ N/A); mục không đạt chuyển thành hành động khắc phục"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={plan} onChange={(e) => setPlan(e.target.value)} className="max-w-[260px]" aria-label="Chương trình">
              <option value="">Tất cả chương trình</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="none">Kiểm tra ngoài chương trình</option>
            </Select>
            <label className="flex items-center gap-1.5 text-xs text-pine-800/60">
              <input type="checkbox" className="h-4 w-4 accent-viridian-600" checked={onlyFail} onChange={(e) => setOnlyFail(e.target.checked)} />
              Chỉ lượt có mục không đạt
            </label>
          </div>
        }
      />
      {err && (
        <div className="px-4 pt-3">
          <ErrorNote message={err} />
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState title="Chưa có lượt kiểm tra" />
      ) : (
        <Table head={['Ngày', 'Checklist / chương trình', 'Người kiểm tra', 'Điểm', 'Không đạt', '']}>
          {rows.slice(0, 200).map(({ r, fails, withCapa }) => {
            const t = tplById.get(r.template_id)
            const p = r.plan_id ? planById.get(r.plan_id) : null
            return (
              <tr key={r.id}>
                <Td className="whitespace-nowrap">{fmtDate(r.run_date)}</Td>
                <Td className="min-w-[240px]">
                  <div className="font-medium text-pine-800">{t?.name ?? '—'}</div>
                  <div className="text-xs text-pine-800/50">
                    {p && r.period ? `${p.name} · ${periodLabel(p.frequency, r.period)}` : t ? CHECKLIST_CATEGORY_LABELS[t.category] : ''}
                  </div>
                </Td>
                <Td className="text-pine-800/70">{r.inspector ?? '—'}</Td>
                <Td>
                  <Badge tone={scoreTone(Number(r.score ?? 0))}>{r.score ?? '—'}%</Badge>
                </Td>
                <Td className="whitespace-nowrap">
                  {fails === 0 ? (
                    <span className="text-pine-800/40">—</span>
                  ) : (
                    <>
                      <Badge tone="red">{fails} mục</Badge>
                      <div className="mt-1 text-xs text-pine-800/50">{withCapa === fails ? 'Đã có hành động' : `${fails - withCapa} chưa có hành động`}</div>
                    </>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" aria-label="Xem kết quả" onClick={() => setView(r)}>
                      <Eye size={15} />
                    </Button>
                    {canEdit && (
                      <Button variant="ghost" aria-label="Xóa lượt kiểm tra" onClick={() => remove(r)}>
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
      <RunViewModal
        run={view}
        tpl={view ? tplById.get(view.template_id) : null}
        plan={view?.plan_id ? planById.get(view.plan_id) : null}
        capa={capa}
        base={base}
        canEdit={canEdit}
        onClose={() => setView(null)}
      />
    </Card>
  )
}
