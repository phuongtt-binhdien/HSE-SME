import { useState } from 'react'
import { ErrorNote, Tabs } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { errMsg } from '../../lib/utils'
import CriteriaTab from './CriteriaTab'
import EprTab from './EprTab'
import FlowsTab from './FlowsTab'
import { useCircularData } from './useCircularData'
import WasteGriTab from './WasteGriTab'

export default function CircularPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('epr')
  const data = useCircularData(fid)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">EPR & Kinh tế tuần hoàn</h1>
        <p className="text-sm text-pine-800/50">Trách nhiệm tái chế bao bì · dòng hồi lưu, tái sử dụng · chất thải theo GRI 306 · tiêu chí tuần hoàn</p>
      </div>
      <Tabs
        tabs={[
          { key: 'epr', label: 'EPR bao bì' },
          { key: 'dong', label: 'Dòng tuần hoàn' },
          { key: 'chat-thai', label: 'Chất thải → GRI 306' },
          { key: 'tieu-chi', label: 'Tiêu chí tuần hoàn' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {data.error && <ErrorNote message={'Không tải được dữ liệu: ' + errMsg(data.error)} />}
      {tab === 'epr' && <EprTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'dong' && <FlowsTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'chat-thai' && <WasteGriTab data={data} canEdit={canEdit} />}
      {tab === 'tieu-chi' && <CriteriaTab data={data} />}
    </div>
  )
}
