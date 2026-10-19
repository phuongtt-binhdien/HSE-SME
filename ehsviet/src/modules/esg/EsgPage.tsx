import { useState } from 'react'
import { Tabs } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import GhgTab from './GhgTab'
import GriTab from './GriTab'
import PoliciesTab from './PoliciesTab'
import { useEsgData } from './useEsgData'

export default function EsgPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('chinh-sach')
  const data = useEsgData(fid)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">ESG · GRI · Khí nhà kính</h1>
        <p className="text-sm text-pine-800/50">
          Chính sách và mục tiêu ESG · kiểm kê KNK phạm vi 1 – 2 – 3 · chỉ mục GRI và nội dung bắt buộc TT 96/2020
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'chinh-sach', label: 'Chính sách & mục tiêu' },
          { key: 'knk', label: 'Khí nhà kính' },
          { key: 'gri', label: 'Chỉ số GRI' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'chinh-sach' && <PoliciesTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'knk' && <GhgTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'gri' && <GriTab data={data} base={base} canEdit={canEdit} />}
    </div>
  )
}
