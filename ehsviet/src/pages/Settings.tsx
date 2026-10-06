import { useQueryClient } from '@tanstack/react-query'
import { Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorNote,
  Field,
  Input,
  Modal,
  Select,
  Table,
  Td,
} from '../components/UI'
import { useAuth } from '../contexts/AuthContext'
import { useList, useSave } from '../hooks/useCrud'
import { ROLE_LABELS } from '../lib/constants'
import { resetDemoData } from '../lib/demo/client'
import { isDemo, supabase } from '../lib/supabase'
import { checklistRows, ESG_POLICY_TEMPLATES, ESG_TARGET_TEMPLATES, INTERNAL_RULE_TEMPLATES, CHECKLIST_TEMPLATES, policyRows, ruleRows, targetRows } from '../lib/templates'
import { errMsg } from '../lib/utils'

export default function SettingsPage() {
  const { profile, org, facilities, role, refresh } = useAuth()
  const isAdmin = role === 'admin'

  const members = useList('profiles', { order: 'created_at', ascending: true })
  const saveOrg = useSave('organizations')
  const saveProfile = useSave('profiles')
  const saveFacility = useSave('facilities')

  const [orgName, setOrgName] = useState(org?.name ?? '')
  const [facForm, setFacForm] = useState<any>(null)
  const [error, setError] = useState('')

  const submitOrg = async () => {
    setError('')
    try {
      await saveOrg.mutateAsync({ id: org!.id, name: orgName.trim() })
      await refresh()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  const submitFacility = async () => {
    setError('')
    if (!facForm?.name?.trim()) {
      setError('Nhập tên nhà máy.')
      return
    }
    try {
      await saveFacility.mutateAsync({
        ...(facForm.id ? { id: facForm.id } : { org_id: profile!.org_id }),
        name: facForm.name.trim(),
        address: facForm.address || null,
        gpmt_number: facForm.gpmt_number || null,
        gpmt_issuer: facForm.gpmt_issuer || null,
      })
      setFacForm(null)
      await refresh()
    } catch (e) {
      setError(errMsg(e))
    }
  }

  const changeRole = async (id: string, newRole: string) => {
    try {
      await saveProfile.mutateAsync({ id, role: newRole })
    } catch (e) {
      setError(errMsg(e))
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Cài đặt</h1>
        <p className="text-sm text-pine-800/50">Tổ chức, nhà máy và thành viên</p>
      </div>

      {error && <ErrorNote message={error} />}

      <Card>
        <CardHeader
          title="Tổ chức"
          action={<Badge tone="blue">Gói: {org?.plan ?? 'trial'}</Badge>}
        />
        <div className="flex flex-wrap items-end gap-3 px-4 py-4">
          <Field label="Tên tổ chức" className="min-w-[240px] flex-1">
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              disabled={!isAdmin}
            />
          </Field>
          {isAdmin && (
            <Button onClick={submitOrg} disabled={saveOrg.isPending}>
              Lưu
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Nhà máy / cơ sở"
          hint="Mỗi tổ chức quản lý nhiều nhà máy; chuyển nhà máy ở thanh điều hướng"
          action={
            isAdmin && (
              <Button variant="outline" onClick={() => setFacForm({})}>
                <Plus size={15} /> Thêm nhà máy
              </Button>
            )
          }
        />
        {facilities.length === 0 ? (
          <EmptyState title="Chưa có nhà máy" />
        ) : (
          <Table head={['Tên', 'Địa chỉ', 'GPMT', '']}>
            {facilities.map((f) => (
              <tr key={f.id}>
                <Td className="font-medium">{f.name}</Td>
                <Td className="text-pine-800/60">{f.address ?? '—'}</Td>
                <Td className="text-pine-800/60">{f.gpmt_number ?? '—'}</Td>
                <Td className="text-right">
                  {isAdmin && (
                    <Button variant="ghost" onClick={() => setFacForm({ ...f })}>
                      Sửa
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Thành viên"
          hint="Thành viên mới: đăng ký tài khoản, sau đó quản trị viên gán vào tổ chức (xem README)"
        />
        <Table head={['Họ tên', 'Vai trò', '']}>
          {(members.data ?? []).map((m: any) => (
            <tr key={m.id}>
              <Td className="font-medium">
                {m.full_name}
                {m.id === profile?.id && (
                  <span className="ml-2 text-xs text-pine-800/40">(bạn)</span>
                )}
              </Td>
              <Td>
                {isAdmin ? (
                  <Select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value)}
                    className="max-w-[190px]"
                  >
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Badge tone="gray">{ROLE_LABELS[m.role] ?? m.role}</Badge>
                )}
              </Td>
              <Td />
            </tr>
          ))}
        </Table>
      </Card>

      {role !== 'viewer' && <TemplatesCard />}

      {isDemo && (
        <Card>
          <CardHeader
            title="Dữ liệu dùng thử"
            hint="Bản dùng thử lưu dữ liệu trên trình duyệt này. Khôi phục để xóa mọi thay đổi và nạp lại dữ liệu mẫu minh họa."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  if (!window.confirm('Xóa toàn bộ dữ liệu đã nhập trong bản dùng thử và nạp lại dữ liệu mẫu?')) return
                  resetDemoData()
                  window.location.reload()
                }}
              >
                <RotateCcw size={15} /> Khôi phục dữ liệu mẫu
              </Button>
            }
          />
        </Card>
      )}

      <Modal
        open={!!facForm}
        onClose={() => setFacForm(null)}
        title={facForm?.id ? 'Sửa nhà máy' : 'Thêm nhà máy'}
        footer={
          <>
            <Button variant="outline" onClick={() => setFacForm(null)}>
              Hủy
            </Button>
            <Button onClick={submitFacility} disabled={saveFacility.isPending}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Tên nhà máy" required>
            <Input
              value={facForm?.name ?? ''}
              onChange={(e) => setFacForm({ ...facForm, name: e.target.value })}
            />
          </Field>
          <Field label="Địa chỉ">
            <Input
              value={facForm?.address ?? ''}
              onChange={(e) => setFacForm({ ...facForm, address: e.target.value })}
            />
          </Field>
          <Field label="Số Giấy phép môi trường">
            <Input
              value={facForm?.gpmt_number ?? ''}
              onChange={(e) => setFacForm({ ...facForm, gpmt_number: e.target.value })}
              placeholder="VD: 2986/GPMT-STNMT"
            />
          </Field>
          <Field label="Cơ quan cấp GPMT">
            <Input
              value={facForm?.gpmt_issuer ?? ''}
              onChange={(e) => setFacForm({ ...facForm, gpmt_issuer: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </div>
  )
}

/** Nạp bộ mẫu nghiệp vụ nhà máy phân bón NPK vào nhà máy đang chọn */
function TemplatesCard() {
  const qc = useQueryClient()
  const { profile, facilityId, facility } = useAuth()
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const base = { org_id: profile!.org_id, facility_id: facilityId ?? '' }

  const run = async (key: string, fn: () => Promise<string>) => {
    if (!facilityId) return
    setBusy(key)
    setMsg('')
    setError('')
    try {
      setMsg(await fn())
      await qc.invalidateQueries()
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy('')
    }
  }

  /** Tên các mục đã có — mẫu trùng tên được bỏ qua để nạp lại không sinh bản trùng */
  const titles = async (table: string) => {
    const { data, error } = await supabase.from(table).select('title').eq('facility_id', facilityId!)
    if (error) throw error
    return new Set((data ?? []).map((r: any) => r.title as string))
  }

  const loadEsg = () =>
    run('esg', async () => {
      const [hp, ht] = await Promise.all([titles('esg_policies'), titles('esg_targets')])
      const policies = policyRows(base).filter((p) => !hp.has(p.title))
      const targets = targetRows(base).filter((t) => !ht.has(t.title))
      if (!policies.length && !targets.length) return 'Bộ chính sách và mục tiêu ESG mẫu đã có sẵn.'
      if (policies.length) {
        const r = await supabase.from('esg_policies').insert(policies)
        if (r.error) throw r.error
      }
      if (targets.length) {
        const r = await supabase.from('esg_targets').insert(targets)
        if (r.error) throw r.error
      }
      return `Đã nạp ${policies.length}/${ESG_POLICY_TEMPLATES.length} chính sách và ${targets.length}/${ESG_TARGET_TEMPLATES.length} mục tiêu ESG (dự thảo).`
    })

  const loadRules = () =>
    run('rules', async () => {
      const have = await titles('internal_rules')
      const rows = ruleRows(base).filter((r) => !have.has(r.title))
      if (!rows.length) return 'Danh mục nội quy mẫu đã có sẵn.'
      const { error } = await supabase.from('internal_rules').insert(rows)
      if (error) throw error
      return `Đã nạp ${rows.length}/${INTERNAL_RULE_TEMPLATES.length} nội quy, quy định nội bộ.`
    })

  const loadChecklists = () =>
    run('checklists', async () => {
      const { data, error } = await supabase.from('checklist_templates').select('name').eq('facility_id', facilityId!)
      if (error) throw error
      const have = new Set((data ?? []).map((t: any) => t.name))
      const rows = checklistRows(base).filter((t) => !have.has(t.name))
      if (!rows.length) return 'Các checklist mẫu đã có sẵn.'
      const r = await supabase.from('checklist_templates').insert(rows)
      if (r.error) throw r.error
      const items = rows.reduce((s, t) => s + t.items.length, 0)
      return `Đã nạp ${rows.length}/${CHECKLIST_TEMPLATES.length} checklist (${items} hạng mục).`
    })

  return (
    <Card>
      <CardHeader
        title="Bộ mẫu nghiệp vụ nhà máy phân bón NPK"
        hint={'Nạp vào: ' + (facility?.name ?? '—') + '. Nội dung là dự thảo — rà soát, chỉnh sửa và ban hành theo thẩm quyền.'}
      />
      <div className="grid gap-3 p-4 md:grid-cols-3">
        <TemplateItem
          title="Chính sách & mục tiêu ESG"
          desc="8 chính sách E – S – G (môi trường ISO 14001, khí hậu, ATVSLĐ – PCCC, nhà thầu, người lao động, PCTN, công bố ESG, tuân thủ) và 11 mục tiêu gắn chỉ số tự tính."
          busy={busy === 'esg'}
          onClick={loadEsg}
        />
        <TemplateItem
          title="Danh mục nội quy nội bộ"
          desc="Quy định tuân thủ MT nội bộ, VSCN mặt bằng, MT-HD01…07, nội quy ATVSLĐ – PCCC, nội quy lao động."
          busy={busy === 'rules'}
          onClick={loadRules}
        />
        <TemplateItem
          title="Checklist kiểm tra & tự kiểm tra tuân thủ"
          desc="VSCN hằng tháng 12 khu vực; bảng tự kiểm tra theo NĐ 45/2022 (34 mục), NĐ 106/2025 (18), NĐ 12/2022 (15), hóa chất (6) — kèm căn cứ, mức phạt, bằng chứng."
          busy={busy === 'checklists'}
          onClick={loadChecklists}
        />
      </div>
      {(msg || error) && <div className="px-4 pb-4">{error ? <ErrorNote message={error} /> : <div className="text-sm text-viridian-700">{msg}</div>}</div>}
    </Card>
  )
}

function TemplateItem({ title, desc, busy, onClick }: { title: string; desc: string; busy: boolean; onClick: () => void }) {
  return (
    <div className="flex flex-col rounded-lg border border-pine-800/10 p-3">
      <div className="text-sm font-semibold text-pine-800">{title}</div>
      <p className="mt-1 flex-1 text-xs text-pine-800/55">{desc}</p>
      <Button variant="outline" className="mt-3 self-start" onClick={onClick} disabled={busy}>
        {busy ? 'Đang nạp…' : 'Nạp vào nhà máy'}
      </Button>
    </div>
  )
}
