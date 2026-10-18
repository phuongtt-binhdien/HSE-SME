import { useState } from 'react'
import { ErrorNote, Tabs } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { errMsg } from '../../lib/utils'
import EquipmentTab from './EquipmentTab'
import InspectionsTab from './InspectionsTab'
import { useEquipmentData } from './useEquipmentData'
import WorkOrdersTab from './WorkOrdersTab'

export default function EquipmentPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('sua-chua')
  const data = useEquipmentData(fid)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Thiết bị & bảo trì</h1>
        <p className="text-sm text-pine-800/50">
          Biên bản hư hỏng → sửa chữa (Tổ Cơ điện / thuê ngoài) → nghiệm thu an toàn → đưa vào vận hành hoặc thanh lý · kiểm định thiết bị nghiêm ngặt
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'sua-chua', label: 'Sự cố & sửa chữa' },
          { key: 'danh-muc', label: 'Danh mục thiết bị' },
          { key: 'kiem-dinh', label: 'Kiểm định – nghiêm ngặt' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {data.error && <ErrorNote message={'Không tải được dữ liệu: ' + errMsg(data.error)} />}
      {tab === 'sua-chua' && <WorkOrdersTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'danh-muc' && <EquipmentTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'kiem-dinh' && <InspectionsTab data={data} base={base} canEdit={canEdit} />}
    </div>
  )
}
