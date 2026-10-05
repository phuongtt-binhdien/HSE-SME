import { useState } from 'react'
import { Button, Card, ErrorNote, Field, Input } from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { errMsg } from '../lib/utils'

/** Khởi tạo tổ chức + nhà máy đầu tiên cho tài khoản mới (self-serve SaaS). */
export default function Onboarding() {
  const { session, refresh, signOut } = useAuth()
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [facName, setFacName] = useState('')
  const [facAddr, setFacAddr] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError('')
    if (!fullName.trim() || !orgName.trim() || !facName.trim()) {
      setError('Điền họ tên, tên tổ chức và tên nhà máy.')
      return
    }
    setBusy(true)
    try {
      const uid = session!.user.id
      const { data: org, error: e1 } = await supabase
        .from('organizations')
        .insert({ name: orgName.trim() })
        .select()
        .single()
      if (e1) throw e1
      const { error: e2 } = await supabase.from('profiles').insert({
        id: uid,
        org_id: org.id,
        full_name: fullName.trim(),
        role: 'admin',
      })
      if (e2) throw e2
      const { data: fac, error: e3 } = await supabase
        .from('facilities')
        .insert({ org_id: org.id, name: facName.trim(), address: facAddr.trim() || null })
        .select()
        .single()
      if (e3) throw e3
      await supabase.from('profiles').update({ facility_id: fac.id }).eq('id', uid)
      await refresh()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pine-900 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" className="h-9 w-9 rounded-lg" />
          <div className="text-base font-bold text-pine-800">Khởi tạo không gian làm việc</div>
        </div>
        <p className="mt-2 text-sm text-pine-800/55">
          Bạn là người đầu tiên của tổ chức — hệ thống sẽ tạo tổ chức và gán bạn quyền Quản trị.
          Nếu công ty bạn đã dùng EHSViet, đề nghị quản trị viên gán tài khoản của bạn vào tổ chức
          (hướng dẫn trong README).
        </p>
        <div className="mt-5 space-y-3">
          <Field label="Họ và tên" required>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
          </Field>
          <Field label="Tên tổ chức / công ty" required>
            <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Công ty CP ..." />
          </Field>
          <Field label="Tên nhà máy / cơ sở" required>
            <Input value={facName} onChange={(e) => setFacName(e.target.value)} placeholder="Nhà máy ..." />
          </Field>
          <Field label="Địa chỉ nhà máy">
            <Input value={facAddr} onChange={(e) => setFacAddr(e.target.value)} placeholder="KCN ..., tỉnh ..." />
          </Field>
          {error && <ErrorNote message={error} />}
          <Button className="w-full" onClick={submit} disabled={busy}>
            {busy ? 'Đang khởi tạo…' : 'Bắt đầu sử dụng'}
          </Button>
          <button onClick={signOut} className="w-full text-center text-sm text-pine-800/50 hover:underline">
            Đăng xuất
          </button>
        </div>
      </Card>
    </div>
  )
}
