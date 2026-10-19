import { useState } from 'react'
import { ErrorNote, Tabs } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { errMsg } from '../../lib/utils'
import LedgerTab from './LedgerTab'
import RegisterTab from './RegisterTab'
import ReportTab from './ReportTab'
import UsageTab from './UsageTab'
import { useChemicalData } from './useChemicalData'

export default function ChemicalsPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('danh-muc')
  const data = useChemicalData(fid)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Hóa chất</h1>
        <p className="text-sm text-pine-800/50">
          Mua – nhập kho – sử dụng tại sản xuất, phòng thí nghiệm, HTXLNT – thải bỏ · PATHH · tồn kho, định mức · báo cáo quý
        </p>
      </div>
      <Tabs
        tabs={[
          { key: 'danh-muc', label: 'Danh mục & tồn kho' },
          { key: 'so', label: 'Sổ nhập – xuất' },
          { key: 'su-dung', label: 'Phòng thí nghiệm & HTXLNT' },
          { key: 'bao-cao', label: 'Báo cáo quý' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {data.error && <ErrorNote message={'Không tải được dữ liệu: ' + errMsg(data.error)} />}
      {tab === 'danh-muc' && <RegisterTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'so' && <LedgerTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'su-dung' && <UsageTab data={data} base={base} canEdit={canEdit} />}
      {tab === 'bao-cao' && <ReportTab data={data} />}
    </div>
  )
}
