import { useMemo, useState } from 'react'
import { ErrorNote, Loading, Note, Select, Tabs } from '../../components/UI'
import { useAuth } from '../../contexts/AuthContext'
import { annualTemplates, FIVE_YEAR_TEMPLATES, planRows } from '../../lib/plan'
import { errMsg } from '../../lib/utils'
import NetZeroTab from './NetZeroTab'
import PlanItems from './PlanItems'
import { usePlanData } from './usePlanData'

export default function PlanPage() {
  const { profile, facilityId, role } = useAuth()
  const fid = facilityId ?? ''
  const base = { org_id: profile!.org_id, facility_id: fid }
  const canEdit = role !== 'viewer'
  const [tab, setTab] = useState('nam')
  const data = usePlanData(fid)
  const thisYear = new Date().getFullYear()
  const [year, setYear] = useState(thisYear)

  const annualYears = useMemo(() => {
    const s = new Set<number>([thisYear, thisYear + 1])
    for (const p of data.items) if (p.horizon === 'nam') s.add(Number(p.year))
    return [...s].sort((a, b) => b - a)
  }, [data.items, thisYear])
  const annual = (y: number) => data.items.filter((p) => p.horizon === 'nam' && Number(p.year) === y)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold text-pine-800">Kế hoạch & lộ trình</h1>
        <p className="text-sm text-pine-800/50">Bước P của PDCA: kế hoạch HSE năm · lộ trình hồ sơ 5 năm 2026–2030 · lộ trình Net Zero 2050</p>
      </div>
      <Tabs
        tabs={[
          { key: 'nam', label: 'Kế hoạch HSE năm' },
          { key: '5-nam', label: 'Lộ trình 5 năm' },
          { key: 'net-zero', label: 'Net Zero 2050' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {data.error && <ErrorNote message={'Không tải được dữ liệu: ' + errMsg(data.error)} />}
      {data.loading ? (
        <Loading />
      ) : (
        <>
          {tab === 'nam' && (
            <PlanItems
              key={year}
              horizon="nam"
              items={annual(year)}
              groupBy="area"
              base={base}
              canEdit={canEdit}
              title={`Kế hoạch HSE năm ${year}`}
              hint="Kế hoạch ATVSLĐ (Luật ATVSLĐ Điều 76), BVMT, PCCC, hóa chất, sức khỏe, năng lượng – một bảng theo dõi chung"
              toolbar={
                <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-28" aria-label="Năm kế hoạch">
                  {annualYears.map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </Select>
              }
              defaultYear={year}
              loadTemplates={() => planRows(base, 'nam', annualTemplates(year))}
              templateLabel={`Nạp kế hoạch mẫu năm ${year}`}
              copyFrom={{ year: year - 1, items: annual(year - 1) }}
            />
          )}
          {tab === '5-nam' && (
            <>
              <PlanItems
                horizon="5_nam"
                items={data.items.filter((p) => p.horizon === '5_nam')}
                groupBy="year"
                base={base}
                canEdit={canEdit}
                title="Lộ trình hồ sơ môi trường – HSE 2026–2030"
                hint="Hồ sơ, thủ tục phải hoàn thiện theo mốc: ISO 14001, KNK, kiểm toán năng lượng, GPMT, quy chuẩn mới"
                defaultYear={thisYear}
                loadTemplates={() => planRows(base, '5_nam', FIVE_YEAR_TEMPLATES)}
                templateLabel="Nạp lộ trình mẫu 2026–2030"
              />
              <Note>
                Mốc theo văn bản hiện hành tại thời điểm lập (10/2026): NĐ 06/2022 sửa đổi bởi NĐ 119/2025, NĐ 83/2026 (kiểm kê KNK 02 năm/lần, báo cáo giảm nhẹ hằng năm từ 2027); Luật
                50/2010 sửa đổi bởi Luật 77/2025 (kiểm toán năng lượng); QCVN 40:2025/BTNMT (cơ sở hiện hữu áp dụng từ 01/01/2032); GRI 102, 103 cho kỳ báo cáo từ 2027. Soát xét lộ
                trình mỗi khi văn bản thay đổi.
              </Note>
            </>
          )}
          {tab === 'net-zero' && <NetZeroTab data={data} base={base} canEdit={canEdit} />}
        </>
      )}
    </div>
  )
}
