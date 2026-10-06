import { useState } from 'react'
import { Button, ErrorNote, Field, Input } from '../components/UI'
import { isDemo, supabase } from '../lib/supabase'
import { errMsg } from '../lib/utils'

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    setInfo('')
    if (!email.trim() || !password) {
      setError('Nhập email và mật khẩu.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (e) throw e
      } else {
        const { data, error: e } = await supabase.auth.signUp({ email: email.trim(), password })
        if (e) throw e
        if (!data.session) setInfo('Đã tạo tài khoản. Kiểm tra email để xác nhận, sau đó đăng nhập.')
      }
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      {/* Panel thương hiệu */}
      <div className="hidden flex-col justify-between bg-pine-900 p-10 md:flex">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="h-10 w-10 rounded-xl" />
          <div>
            <div className="text-lg font-bold text-white">EHSViet</div>
            <div className="text-[11px] uppercase tracking-widest text-white/40">
              Môi trường · PCCC · An toàn
            </div>
          </div>
        </div>
        <div>
          <h1 className="max-w-md text-2xl font-bold leading-snug text-white">
            Một nền tảng cho toàn bộ nghiệp vụ EHS của nhà máy
          </h1>
          <ul className="mt-5 space-y-2 text-sm text-white/60">
            <li>· Chất thải & CTNH: nhật ký, chứng từ, tồn kho lưu giữ</li>
            <li>· Vận hành HTXLNT, khí thải & quan trắc theo QCVN</li>
            <li>· PCCC, checklist hiện trường, sự cố & CAPA</li>
            <li>· Hồ sơ pháp lý, lịch tuân thủ & nhắc hạn báo cáo</li>
          </ul>
        </div>
        <p className="text-xs text-white/35">Đa tổ chức · Phân quyền · Dữ liệu cách ly theo RLS</p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 md:hidden">
            <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-lg" />
            <div className="text-base font-bold text-pine-800">EHSViet</div>
          </div>
          <h2 className="text-lg font-bold text-pine-800">
            {mode === 'signin' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <p className="mt-1 text-sm text-pine-800/50">
            {mode === 'signin'
              ? 'Truy cập không gian làm việc của tổ chức bạn.'
              : 'Tài khoản mới sẽ khởi tạo tổ chức riêng ở bước tiếp theo.'}
          </p>

          {isDemo && (
            <div className="mt-4 space-y-2 rounded-lg border border-amber-600/25 bg-amber-50 px-3 py-3 text-xs text-amber-800">
              <p>
                <b>Bản dùng thử</b> — chưa kết nối máy chủ Supabase. Dữ liệu mẫu nhà máy phân bón NPK (số liệu minh họa) lưu
                ngay trên trình duyệt này. Để cả nhà máy dùng chung, cấu hình <b>VITE_SUPABASE_URL</b>,{' '}
                <b>VITE_SUPABASE_ANON_KEY</b> (xem README).
              </p>
              <Button
                className="w-full"
                onClick={() => supabase.auth.signInWithPassword({ email: 'dungthu', password: 'dungthu' })}
              >
                Vào bản dùng thử
              </Button>
            </div>
          )}

          <div className="mt-5 space-y-3">
            <Field label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@congty.vn"
                autoComplete="email"
              />
            </Field>
            <Field label="Mật khẩu" required>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
              />
            </Field>
            {error && <ErrorNote message={error} />}
            {info && (
              <div className="rounded-lg border border-viridian-600/20 bg-viridian-50 px-3 py-2 text-sm text-viridian-700">
                {info}
              </div>
            )}
            <Button className="w-full" onClick={submit} disabled={busy}>
              {busy ? 'Đang xử lý…' : mode === 'signin' ? 'Đăng nhập' : 'Đăng ký'}
            </Button>
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError('')
                setInfo('')
              }}
              className="w-full text-center text-sm text-viridian-700 hover:underline"
            >
              {mode === 'signin' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
