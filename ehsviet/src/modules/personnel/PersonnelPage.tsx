import { useState } from 'react'
import { ErrorNote, Tabs } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { errMsg } from '../../lib/utils'
import CoursesTab from './CoursesTab'
import EmployeesTab from './EmployeesTab'
import ImportTab from './ImportTab'
import MatrixTab from './MatrixTab'
import { usePersonnelData } from './shared'

export default function PersonnelPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('ma-tran')
  const data = usePersonnelData(fid)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Nhân sự & Huấn luyện</h1>
        <p className="text-sm text-pine-800/50">
          Ai đã được huấn luyện an toàn – phòng cháy – ứng phó sự cố chất thải · Khóa – Ngày – Quyết định · cảnh báo hết hạn
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'ma-tran', label: 'Ma trận huấn luyện' },
          { key: 'nhan-su', label: 'Danh sách nhân sự' },
          { key: 'khoa', label: 'Khóa huấn luyện' },
          { key: 'nhap', label: 'Nhập từ Excel' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {data.error && <ErrorNote message={'Không tải được dữ liệu: ' + errMsg(data.error)} />}
      {tab === 'ma-tran' && <MatrixTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'nhan-su' && <EmployeesTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'khoa' && <CoursesTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'nhap' && <ImportTab data={data} base={base} canEdit={canEdit} />}
    </div>
  )
}
