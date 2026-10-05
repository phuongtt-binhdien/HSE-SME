import {
  CalendarClock,
  Droplets,
  Flame,
  LayoutDashboard,
  LogOut,
  Recycle,
  Settings,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS } from '../lib/constants'
import { cls } from '../lib/utils'

const NAV = [
  { to: '/', label: 'Tổng quan', short: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: '/chat-thai', label: 'Chất thải & CTNH', short: 'Chất thải', icon: Recycle },
  { to: '/van-hanh', label: 'Vận hành & Quan trắc', short: 'Vận hành', icon: Droplets },
  { to: '/an-toan', label: 'PCCC & An toàn', short: 'An toàn', icon: Flame },
  { to: '/tuan-thu', label: 'Hồ sơ & Tuân thủ', short: 'Tuân thủ', icon: CalendarClock },
]

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <img src="/favicon.svg" alt="" className="h-8 w-8 rounded-lg" />
      <div>
        <div className="text-sm font-bold tracking-tight text-white">EHSViet</div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">
          Môi trường · PCCC · An toàn
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const { profile, org, facilities, facilityId, setFacilityId, signOut } = useAuth()

  const facilitySwitcher = facilities.length > 0 && (
    <select
      value={facilityId ?? ''}
      onChange={(e) => setFacilityId(e.target.value)}
      className="w-full rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs text-white focus:border-viridian-500 md:text-sm"
      aria-label="Chọn nhà máy"
    >
      {facilities.map((f) => (
        <option key={f.id} value={f.id} className="text-pine-800">
          {f.name}
        </option>
      ))}
    </select>
  )

  return (
    <div className="min-h-screen">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-pine-900 md:flex">
        <Brand />
        <div className="px-4 pb-3">{facilitySwitcher}</div>
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cls(
                  'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cls(
                      'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full',
                      isActive ? 'bg-viridian-500' : 'bg-transparent'
                    )}
                  />
                  <Icon size={17} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
          <NavLink
            to="/cai-dat"
            className={({ isActive }) =>
              cls(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <Settings size={17} /> Cài đặt
          </NavLink>
        </nav>
        <div className="border-t border-white/10 px-4 py-3">
          <div className="text-sm font-medium text-white">{profile?.full_name}</div>
          <div className="text-xs text-white/45">
            {ROLE_LABELS[profile?.role ?? ''] ?? profile?.role} · {org?.name}
          </div>
          <button
            onClick={signOut}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white"
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <header className="sticky top-0 z-40 flex items-center gap-2 bg-pine-900 px-3 py-2.5 md:hidden">
        <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-lg" />
        <div className="flex-1">{facilitySwitcher}</div>
        <NavLink to="/cai-dat" aria-label="Cài đặt" className="rounded-lg p-2 text-white/70">
          <Settings size={18} />
        </NavLink>
      </header>

      {/* Nội dung */}
      <main className="px-3 pb-24 pt-4 md:pl-64 md:pr-6 md:pb-10 md:pt-6">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-pine-800/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ to, short, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cls(
                'flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                isActive ? 'text-viridian-700' : 'text-pine-800/50'
              )
            }
          >
            <Icon size={19} />
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
