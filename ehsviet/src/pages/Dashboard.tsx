// Tổng quan PDCA: việc cần xử lý gom từ mọi phân hệ và 4 khối Kế hoạch – Thực hiện – Kiểm tra – Cải tiến.
import { ArrowRight, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, EmptyState, Loading, Progress, type Tone } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { TRAINING_CATEGORY_LABELS } from '../lib/constants'
import { cls, fmtDate, todayISO } from '../lib/utils'
import { usePdcaOverview, type Metric, type Phase, type Priority } from '../modules/dashboard/usePdcaOverview'

const PHASES: { key: Phase; title: string; hint: string; color: string }[] = [
  { key: 'P', title: 'Kế hoạch', hint: 'Kế hoạch năm, lộ trình, bộ máy, hồ sơ – nghĩa vụ', color: 'bg-steel-600' },
  { key: 'D', title: 'Thực hiện', hint: 'Huấn luyện, thiết bị, hóa chất, chất thải, PCCC', color: 'bg-viridian-600' },
  { key: 'C', title: 'Kiểm tra', hint: 'Kiểm tra định kỳ, quan trắc, sức khỏe', color: 'bg-amber-500' },
  { key: 'A', title: 'Cải tiến', hint: 'Khắc phục, sự cố, nội quy', color: 'bg-pine-800' },
]
const PHASE_COLOR = Object.fromEntries(PHASES.map((p) => [p.key, p.color])) as Record<Phase, string>

const DOT: Record<Tone, string> = {
  green: 'bg-viridian-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-pine-800/25',
  blue: 'bg-steel-600',
}

function PhaseBadge({ phase, size = 'sm' }: { phase: Phase; size?: 'sm' | 'lg' }) {
  return (
    <span
      className={cls(
        'inline-flex shrink-0 items-center justify-center rounded-md font-bold text-white',
        PHASE_COLOR[phase],
        size === 'lg' ? 'h-8 w-8 text-base' : 'h-5 w-5 text-[11px]'
      )}
    >
      {phase}
    </span>
  )
}

function MetricRow({ m }: { m: Metric }) {
  return (
    <Link to={m.to} className="group flex items-start gap-3 px-4 py-3 hover:bg-pine-800/[0.03]">
      <span className={cls('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', DOT[m.tone])} />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-pine-800/55">{m.label}</div>
        <div className="text-sm font-semibold text-pine-800">{m.value}</div>
        {m.sub && <div className="text-xs text-pine-800/50">{m.sub}</div>}
        {m.pct != null && (
          <div className="mt-1.5 max-w-xs">
            <Progress value={m.pct} tone={m.tone === 'gray' ? 'gray' : m.tone} />
          </div>
        )}
      </div>
      <ChevronRight size={16} className="mt-1 shrink-0 text-pine-800/25 group-hover:text-pine-800/60" />
    </Link>
  )
}

function PriorityRow({ p }: { p: Priority }) {
  return (
    <Link to={p.to} className="group flex items-start gap-3 px-4 py-2.5 hover:bg-pine-800/[0.03]">
      <span className={cls('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', p.tone === 'red' ? 'bg-red-500' : 'bg-amber-500')} />
      <PhaseBadge phase={p.phase} />
      <div className="min-w-0 flex-1">
        <div className={cls('text-sm', p.tone === 'red' ? 'font-medium text-pine-800' : 'text-pine-800/85')}>{p.title}</div>
        {p.detail && <div className="truncate text-xs text-pine-800/50">{p.detail}</div>}
      </div>
      <ArrowRight size={15} className="mt-1 shrink-0 text-pine-800/25 group-hover:text-viridian-700" />
    </Link>
  )
}

export default function Dashboard() {
  const { profile, facility, facilityId } = useAuth()
  const o = usePdcaOverview(facilityId ?? '')
  const [phase, setPhase] = useState<Phase | ''>('')
  const [all, setAll] = useState(false)

  const list = phase ? o.priorities.filter((p) => p.phase === phase) : o.priorities
  const red = o.priorities.filter((p) => p.tone === 'red').length
  const LIMIT = 8
  const shown = all ? list : list.slice(0, LIMIT)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Tổng quan PDCA</h1>
        <p className="text-sm text-pine-800/50">
          {facility?.name ?? 'Chưa có nhà máy'} · {fmtDate(todayISO())} · Xin chào, {profile?.full_name}
        </p>
      </div>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              Việc cần xử lý
              {o.priorities.length > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {red} đỏ · {o.priorities.length - red} vàng
                </span>
              )}
            </span>
          }
          hint="Gom từ mọi phân hệ – đỏ: quá hạn, vi phạm quy định; vàng: sắp đến hạn, cần theo dõi"
          action={
            <div className="flex flex-wrap gap-1">
              {(['', 'P', 'D', 'C', 'A'] as const).map((k) => {
                const n = k ? o.priorities.filter((p) => p.phase === k).length : o.priorities.length
                return (
                  <button
                    key={k || 'all'}
                    onClick={() => {
                      setPhase(k)
                      setAll(false)
                    }}
                    className={cls(
                      'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                      phase === k ? 'bg-pine-900 text-white' : 'text-pine-800/60 hover:bg-pine-800/5'
                    )}
                  >
                    {k ? `${k} · ${n}` : `Tất cả · ${n}`}
                  </button>
                )
              })}
            </div>
          }
        />
        {o.loading && !o.priorities.length ? (
          <Loading />
        ) : list.length === 0 ? (
          <EmptyState title="Không có việc tồn đọng" hint="Các hạn, kiểm định, kiểm tra và khắc phục đang trong tầm kiểm soát" />
        ) : (
          <>
            <div className="divide-y divide-pine-800/5">
              {shown.map((p) => (
                <PriorityRow key={p.key} p={p} />
              ))}
            </div>
            {list.length > LIMIT && (
              <div className="border-t border-pine-800/10 px-4 py-2 text-center">
                <button onClick={() => setAll(!all)} className="text-xs font-medium text-viridian-700 hover:underline">
                  {all ? 'Thu gọn' : `Xem thêm ${list.length - LIMIT} việc`}
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {PHASES.map((ph) => (
          <Card key={ph.key}>
            <div className="flex items-center gap-3 border-b border-pine-800/10 px-4 py-3">
              <PhaseBadge phase={ph.key} size="lg" />
              <div>
                <h2 className="text-sm font-semibold text-pine-800">{ph.title}</h2>
                <p className="text-xs text-pine-800/50">{ph.hint}</p>
              </div>
            </div>
            <div className="divide-y divide-pine-800/5">
              {o.quadrants[ph.key].map((m) => (
                <MetricRow key={m.label} m={m} />
              ))}
            </div>
            {ph.key === 'D' && o.activeCount > 0 && (
              <div className="space-y-2 border-t border-pine-800/10 px-4 py-3">
                {o.training.map(({ c, pct, ok, total }) => (
                  <div key={c}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-pine-800/70">{TRAINING_CATEGORY_LABELS[c]}</span>
                      <span className="text-pine-800/60">
                        {ok}/{total} · <b className="text-pine-800">{pct}%</b>
                      </span>
                    </div>
                    <Progress value={pct} tone={pct >= 95 ? 'green' : pct >= 80 ? 'amber' : 'red'} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
