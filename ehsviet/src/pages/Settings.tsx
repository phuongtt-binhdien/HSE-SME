import { Plus } from 'lucide-react'
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
