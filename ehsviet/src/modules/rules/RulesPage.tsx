import { useState } from 'react'
import { ErrorNote, Tabs } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { errMsg } from '../../lib/utils'
import EvaluationTab from './EvaluationTab'
import RulesRegisterTab from './RulesRegisterTab'
import { useRulesData } from './shared'
import ViolationsTab from './ViolationsTab'

export default function RulesPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('vi-pham')
  const data = useRulesData(fid)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Nội quy & Vi phạm</h1>
        <p className="text-sm text-pine-800/50">
          Tuân thủ nội quy nội bộ · biên bản vi phạm · xếp loại đơn vị hằng tháng · thi đua quý
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'vi-pham', label: 'Vi phạm' },
          { key: 'danh-gia', label: 'Đánh giá đơn vị' },
          { key: 'noi-quy', label: 'Danh mục nội quy' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {data.error && <ErrorNote message={'Không tải được dữ liệu: ' + errMsg(data.error)} />}
      {tab === 'vi-pham' && <ViolationsTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'danh-gia' && <EvaluationTab data={data} />}
      {tab === 'noi-quy' && <RulesRegisterTab data={data} base={base} canEdit={canEdit} />}
    </div>
  )
}
