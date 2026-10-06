import {
  CalendarClock,
  Droplets,
  Flame,
  Gavel,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Recycle,
  Settings,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS } from '../lib/constants'
import { isDemo } from '../lib/supabase'
import { cls } from '../lib/utils'

const NAV_GROUPS = [
  {
    label: '',
    items: [{ to: '/', label: 'Tổng quan', short: 'Tổng quan', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Môi trường',
    items: [
      { to: '/chat-thai', label: 'Chất thải & CTNH', short: 'Chất thải', icon: Recycle },
      { to: '/van-hanh', label: 'Vận hành & Quan trắc', short: 'Vận hành', icon: Droplets },
    ],
  },
  {
    label: 'An toàn',
    items: [
      { to: '/nhan-su', label: 'Nhân sự & Huấn luyện', short: 'Nhân sự', icon: Users },
      { to: '/an-toan', label: 'PCCC & An toàn', short: 'An toàn', icon: Flame },
      { to: '/noi-quy', label: 'Nội quy & Vi phạm', short: 'Nội quy', icon: Gavel },
    ],
  },
  {
    label: 'ESG & Tuân thủ',
    items: [
      { to: '/esg', label: 'ESG · GRI · Khí nhà kính', short: 'ESG', icon: Leaf },
      { to: '/tuan-thu', label: 'Hồ sơ & Tuân thủ', short: 'Tuân thủ', icon: CalendarClock },
    ],
  },
]

const ALL = NAV_GROUPS.flatMap((g) => g.items)
/** 4 mục hiện trên thanh dưới điện thoại; còn lại trong "Thêm" */
const BOTTOM = ['/', '/nhan-su', '/an-toan', '/esg']

function Brand() {
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <img src="/favicon.svg" alt="" className="h-8 w-8 rounded-lg" />
      <div>
        <div className="text-sm font-bold tracking-tight text-white">EHSViet</div>
        <div className="text-[10px] uppercase tracking-widest text-white/40">Môi trường · An toàn · ESG</div>
      </div>
    </div>
  )
}

const linkCls = ({ isActive }: { isActive: boolean }) =>
  cls(
    'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
  )

export default function Layout() {
  const { profile, org, facilities, facilityId, setFacilityId, signOut } = useAuth()
  const [menu, setMenu] = useState(false)

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
        <nav className="flex-1 space-y-3 overflow-y-auto px-2">
          {NAV_GROUPS.map((g) => (
            <div key={g.label || 'root'} className="space-y-0.5">
              {g.label && (
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">{g.label}</div>
              )}
              {g.items.map(({ to, label, icon: Icon, end }: any) => (
                <NavLink key={to} to={to} end={end} className={linkCls}>
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
            </div>
          ))}
          <NavLink to="/cai-dat" className={linkCls}>
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
          {isDemo && (
            <div className="mb-4 rounded-lg border border-amber-600/25 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <b>Bản dùng thử</b> — dữ liệu mẫu minh họa, lưu trên trình duyệt này. Kết nối Supabase (xem README) để dùng chung
              cho cả nhà máy.
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-pine-800/10 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {ALL.filter((i) => BOTTOM.includes(i.to)).map(({ to, short, icon: Icon, end }: any) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMenu(false)}
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
        <button
          onClick={() => setMenu(!menu)}
          className={cls('flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium', menu ? 'text-viridian-700' : 'text-pine-800/50')}
          aria-expanded={menu}
        >
          {menu ? <X size={19} /> : <Menu size={19} />}
          Thêm
        </button>
      </nav>

      {/* Menu "Thêm" trên điện thoại */}
      {menu && (
        <div className="fixed inset-0 z-30 bg-pine-950/40 md:hidden" onClick={() => setMenu(false)}>
          <div
            className="absolute inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom))] rounded-t-2xl bg-white p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-2">
              {ALL.map(({ to, short, icon: Icon, end }: any) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMenu(false)}
                  className={({ isActive }) =>
                    cls(
                      'flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-xs font-medium',
                      isActive ? 'bg-viridian-50 text-viridian-700' : 'bg-pine-800/[0.03] text-pine-800/70'
                    )
                  }
                >
                  <Icon size={20} />
                  {short}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
