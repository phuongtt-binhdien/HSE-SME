import { useState } from 'react'
import { ErrorNote, Tabs } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { errMsg } from '../../lib/utils'
import AllowanceTab from './AllowanceTab'
import ChecksTab from './ChecksTab'
import { useHealthData } from './useHealthData'
import WemTab from './WemTab'

export default function HealthPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('qtmtld')
  const data = useHealthData(fid)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Sức khỏe nghề nghiệp</h1>
        <p className="text-sm text-pine-800/50">
          Quan trắc môi trường lao động · khám sức khỏe định kỳ – bệnh nghề nghiệp · bồi dưỡng bằng hiện vật
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'qtmtld', label: 'Quan trắc MTLĐ' },
          { key: 'kham', label: 'Khám sức khỏe – BNN' },
          { key: 'boi-duong', label: 'Bồi dưỡng hiện vật' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {data.error && <ErrorNote message={'Không tải được dữ liệu: ' + errMsg(data.error)} />}
      {tab === 'qtmtld' && <WemTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'kham' && <ChecksTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'boi-duong' && <AllowanceTab data={data} canEdit={canEdit} />}
    </div>
  )
}
