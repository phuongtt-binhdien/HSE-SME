import { useState } from 'react'
import { ErrorNote, Tabs } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { errMsg } from '../../lib/utils'
import ProgramTab from './ProgramTab'
import RunsTab from './RunsTab'
import TemplatesTab from './TemplatesTab'
import { useInspectionData } from './useInspectionData'

export default function InspectionPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('chuong-trinh')
  const data = useInspectionData(fid)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Kiểm tra định kỳ</h1>
        <p className="text-sm text-pine-800/50">
          Chương trình kiểm tra tổng thể 03 tháng/lần, hằng tuần, PCCC, hóa chất, VSCN · lịch kỳ · mục không đạt → hành động khắc phục
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'chuong-trinh', label: 'Chương trình & lịch kỳ' },
          { key: 'ket-qua', label: 'Kết quả kiểm tra' },
          { key: 'checklist', label: 'Bộ checklist' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {data.error && <ErrorNote message={'Không tải được dữ liệu: ' + errMsg(data.error)} />}
      {tab === 'chuong-trinh' && <ProgramTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'ket-qua' && <RunsTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'checklist' && <TemplatesTab data={data} base={base} canEdit={canEdit} />}
    </div>
  )
}
