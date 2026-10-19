// Kiểm kê khí nhà kính (KNK): nguồn phát thải mẫu, hệ số, quy đổi năng lượng, tổng hợp theo năm.
// Hệ số được lưu cố định vào từng dòng số liệu lúc nhập (ef_value, energy_gj, toe, biogenic_co2_t)
// nên sửa bảng dưới không làm thay đổi số liệu các năm đã kiểm kê.

/** GWP 100 năm — IPCC AR6. Đổi tại đây nếu cơ quan quản lý hướng dẫn bộ giá trị khác. */
export const GWP = { CH4: 27, N2O: 273 }

/** GJ trên 1 TOE */
export const GJ_PER_TOE = 41.868

/** Hệ số phát thải lưới điện quốc gia (tCO₂/MWh = kgCO₂/kWh) theo năm số liệu đã công bố */
export const GRID_EF: { dataYear: number; ef: number; source: string }[] = [
  { dataYear: 2022, ef: 0.6766, source: 'EF lưới điện Việt Nam năm 2022 (Bộ TN&MT công bố)' },
  { dataYear: 2023, ef: 0.6592, source: 'EF lưới điện Việt Nam năm 2023 – CV 1726/BĐKH-PTCBT' },
]

/** Hệ số lưới dùng cho năm kiểm kê: hệ số công bố gần nhất có năm số liệu trước năm kiểm kê */
export function gridEfFor(year: number) {
  const list = GRID_EF.filter((g) => g.dataYear < year)
  return list.length ? list[list.length - 1] : GRID_EF[0]
}

export interface SourcePreset {
  key: string
  label: string
  scope: 1 | 2 | 3
  unit: string
  /** nhiệt trị thấp, GJ trên một đơn vị hoạt động (nguồn đốt) */
  ncvGJ?: number
  /** hệ số theo năng lượng, kg/TJ */
  co2?: number
  ch4?: number
  n2o?: number
  /** CO₂ từ sinh khối: báo cáo riêng, không cộng vào phạm vi 1 */
  biogenic?: boolean
  /** hệ số trực tiếp kgCO₂e/đơn vị (nguồn không đốt) */
  ef?: number
  /** quy đổi TOE/đơn vị theo quy ước báo cáo sử dụng năng lượng; trống = tính từ nhiệt trị */
  toePerUnit?: number
  renewable?: boolean
  efSource: string
}

const DIESEL_NCV = 0.83 * 43.0 / 1000 // GJ/lít: ρ 0,83 kg/L × NCV 43,0 TJ/Gg
const GASOLINE_NCV = 0.74 * 44.3 / 1000 // GJ/lít: ρ 0,74 kg/L × NCV 44,3 TJ/Gg

export const SOURCE_PRESETS: SourcePreset[] = [
  {
    key: 'than_lo_hoi',
    label: 'Than đá – lò hơi, lò sấy',
    scope: 1,
    unit: 't',
    ncvGJ: 26.7,
    co2: 98300,
    ch4: 10,
    n2o: 1.5,
    toePerUnit: 0.7,
    efSource:
      'IPCC 2006 Q2 Bảng 2.3 (công nghiệp chế biến): NCV 26,7 GJ/t; CO₂ 98.300; CH₄ 10; N₂O 1,5 kg/TJ. TOE 0,70/t. Thay NCV khi có phiếu nhiệt trị than.',
  },
  {
    key: 'sinh_khoi',
    label: 'Sinh khối (trấu, mùn cưa, củi) – lò sấy',
    scope: 1,
    unit: 't',
    ncvGJ: 12.5,
    co2: 100000,
    ch4: 30,
    n2o: 4,
    biogenic: true,
    renewable: true,
    efSource:
      'IPCC 2006 Q2 Bảng 2.3: CO₂ sinh khối 100.000 kg/TJ (báo cáo riêng); CH₄ 30; N₂O 4 kg/TJ; NCV 12,5 GJ/t (thay theo phiếu nhiệt trị).',
  },
  {
    key: 'do_may_phat',
    label: 'Dầu DO – máy phát, thiết bị cố định',
    scope: 1,
    unit: 'lít',
    ncvGJ: DIESEL_NCV,
    co2: 74100,
    ch4: 3,
    n2o: 0.6,
    toePerUnit: 0.00088,
    efSource: 'IPCC 2006 Q2 Bảng 2.3: ρ 0,83 kg/L; NCV 43,0 TJ/Gg; CO₂ 74.100; CH₄ 3; N₂O 0,6 kg/TJ.',
  },
  {
    key: 'do_xe_nang',
    label: 'Dầu DO – xe nâng, máy công trình (ngoài đường bộ)',
    scope: 1,
    unit: 'lít',
    ncvGJ: DIESEL_NCV,
    co2: 74100,
    ch4: 4.15,
    n2o: 28.6,
    toePerUnit: 0.00088,
    efSource: 'IPCC 2006 Q2 Bảng 3.3.1 (di động ngoài đường bộ – công nghiệp): CO₂ 74.100; CH₄ 4,15; N₂O 28,6 kg/TJ.',
  },
  {
    key: 'do_duong_bo',
    label: 'Dầu DO – xe đưa rước, xe tải (đường bộ)',
    scope: 1,
    unit: 'lít',
    ncvGJ: DIESEL_NCV,
    co2: 74100,
    ch4: 3.9,
    n2o: 3.9,
    toePerUnit: 0.00088,
    efSource: 'IPCC 2006 Q2 Bảng 3.2.1–3.2.2 (đường bộ): CO₂ 74.100; CH₄ 3,9; N₂O 3,9 kg/TJ.',
  },
  {
    key: 'xang',
    label: 'Xăng – xe con',
    scope: 1,
    unit: 'lít',
    ncvGJ: GASOLINE_NCV,
    co2: 69300,
    ch4: 33,
    n2o: 3.2,
    efSource: 'IPCC 2006 Q2 Bảng 3.2.1–3.2.2: ρ 0,74 kg/L; NCV 44,3 TJ/Gg; CO₂ 69.300; CH₄ 33; N₂O 3,2 kg/TJ.',
  },
  {
    key: 'lpg',
    label: 'Khí hóa lỏng LPG – nhà ăn',
    scope: 1,
    unit: 'kg',
    ncvGJ: 0.0473,
    co2: 63100,
    ch4: 5,
    n2o: 0.1,
    efSource: 'IPCC 2006 Q2 Bảng 2.4 (thương mại/dịch vụ): NCV 47,3 TJ/Gg; CO₂ 63.100; CH₄ 5; N₂O 0,1 kg/TJ.',
  },
  {
    key: 'r32',
    label: 'Môi chất lạnh R-32 (nạp bổ sung)',
    scope: 1,
    unit: 'kg',
    ef: 771,
    efSource: 'GWP R-32 = 771 (IPCC AR6). Lượng = khối lượng nạp bổ sung trong năm.',
  },
  {
    key: 'r410a',
    label: 'Môi chất lạnh R-410A (nạp bổ sung)',
    scope: 1,
    unit: 'kg',
    ef: 2256,
    efSource: 'GWP R-410A ≈ 2.256 (50% R-32 + 50% R-125, IPCC AR6).',
  },
  {
    key: 'r134a',
    label: 'Môi chất lạnh R-134a (nạp bổ sung)',
    scope: 1,
    unit: 'kg',
    ef: 1530,
    efSource: 'GWP R-134a = 1.530 (IPCC AR6).',
  },
  {
    key: 'co2_binh',
    label: 'CO₂ thất thoát từ bình chữa cháy',
    scope: 1,
    unit: 'kg CO₂',
    ef: 1,
    efSource: 'Khối lượng CO₂ nạp bù / xả trong năm.',
  },
  {
    key: 'dien_luoi',
    label: 'Điện lưới quốc gia (theo vị trí)',
    scope: 2,
    unit: 'kWh',
    ef: GRID_EF[GRID_EF.length - 1].ef,
    toePerUnit: 0.1543 / 1000,
    efSource: GRID_EF[GRID_EF.length - 1].source,
  },
  {
    key: 'dien_mat_troi',
    label: 'Điện mặt trời mái nhà (tự dùng)',
    scope: 2,
    unit: 'kWh',
    ef: 0,
    toePerUnit: 0.1543 / 1000,
    renewable: true,
    efSource: 'Tự sản xuất – không phát thải; dùng tính tỷ lệ năng lượng tái tạo (GRI 302-1).',
  },
  {
    key: 'khac',
    label: 'Nguồn khác (tự nhập hệ số)',
    scope: 1,
    unit: '',
    ef: 0,
    efSource: '',
  },
]

export const presetByKey = (key?: string | null) => SOURCE_PRESETS.find((p) => p.key === key)

export interface PresetFactors {
  /** kgCO₂e trên một đơn vị hoạt động (không gồm CO₂ sinh khối) */
  ef: number
  /** kg CO₂ sinh khối trên một đơn vị */
  biogenicKg: number
  /** GJ trên một đơn vị (0 nếu không phải nguồn năng lượng) */
  gj: number
  toe: number
}

export function presetFactors(p: SourcePreset, year?: number): PresetFactors {
  const electricityGJ = p.key === 'dien_luoi' || p.key === 'dien_mat_troi' ? 0.0036 : 0
  if (p.ncvGJ) {
    const tj = p.ncvGJ / 1000
    const fossilCo2 = p.biogenic ? 0 : p.co2 ?? 0
    const ef = tj * (fossilCo2 + (p.ch4 ?? 0) * GWP.CH4 + (p.n2o ?? 0) * GWP.N2O)
    return {
      ef,
      biogenicKg: p.biogenic ? tj * (p.co2 ?? 0) : 0,
      gj: p.ncvGJ,
      toe: p.toePerUnit ?? p.ncvGJ / GJ_PER_TOE,
    }
  }
  const ef = p.key === 'dien_luoi' && year ? gridEfFor(year).ef : p.ef ?? 0
  return { ef, biogenicKg: 0, gj: electricityGJ, toe: p.toePerUnit ?? 0 }
}

export const SCOPE_LABELS: Record<string, string> = {
  '1': 'Phạm vi 1 – trực tiếp',
  '2': 'Phạm vi 2 – gián tiếp từ năng lượng',
  '3': 'Phạm vi 3 – gián tiếp khác',
}

/** 15 hạng mục phạm vi 3 — GHG Protocol */
export const SCOPE3_CATEGORY_LABELS: Record<string, string> = {
  '1': '1. Hàng hóa, dịch vụ mua vào (urê, DAP, KCl…)',
  '2': '2. Tài sản vốn',
  '3': '3. Nhiên liệu, năng lượng (ngoài PV 1, 2)',
  '4': '4. Vận chuyển, phân phối thượng nguồn',
  '5': '5. Chất thải phát sinh trong vận hành',
  '6': '6. Đi công tác',
  '7': '7. Người lao động đi lại',
  '8': '8. Tài sản thuê thượng nguồn',
  '9': '9. Vận chuyển, phân phối hạ nguồn',
  '10': '10. Chế biến sản phẩm đã bán',
  '11': '11. Sử dụng sản phẩm đã bán (N₂O khi bón phân)',
  '12': '12. Xử lý cuối vòng đời sản phẩm',
  '13': '13. Tài sản cho thuê hạ nguồn',
  '14': '14. Nhượng quyền',
  '15': '15. Đầu tư',
}

export interface GhgActivity {
  id: string
  year: number
  month: number | null
  scope: number
  source_key: string | null
  source_name: string
  scope3_category: number | null
  activity_value: number
  activity_unit: string
  ef_value: number
  ef_source: string | null
  biogenic_co2_t: number | null
  energy_gj: number | null
  toe: number | null
  note: string | null
}

/** tCO₂e của một dòng số liệu */
export const emissionT = (a: Pick<GhgActivity, 'activity_value' | 'ef_value'>) =>
  (Number(a.activity_value) * Number(a.ef_value)) / 1000

export interface GhgSummary {
  s1: number
  s2: number
  s3: number
  total12: number
  biogenic: number
  gj: number
  toe: number
  renewableGJ: number
  bySource: { name: string; scope: number; t: number }[]
  byMonth: { month: number; s1: number; s2: number; s3: number }[]
  hasData: boolean
}

export function summarize(activities: GhgActivity[], year: number): GhgSummary {
  const rows = activities.filter((a) => Number(a.year) === year)
  const s = { s1: 0, s2: 0, s3: 0, biogenic: 0, gj: 0, toe: 0, renewableGJ: 0 }
  const src = new Map<string, { name: string; scope: number; t: number }>()
  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, s1: 0, s2: 0, s3: 0 }))
  for (const a of rows) {
    const t = emissionT(a)
    const scope = Number(a.scope)
    if (scope === 1) s.s1 += t
    else if (scope === 2) s.s2 += t
    else s.s3 += t
    s.biogenic += Number(a.biogenic_co2_t ?? 0)
    s.gj += Number(a.energy_gj ?? 0)
    s.toe += Number(a.toe ?? 0)
    if (presetByKey(a.source_key)?.renewable) s.renewableGJ += Number(a.energy_gj ?? 0)
    const key = scope + '|' + a.source_name
    const cur = src.get(key) ?? { name: a.source_name, scope, t: 0 }
    cur.t += t
    src.set(key, cur)
    if (a.month) {
      const m = months[a.month - 1]
      if (scope === 1) m.s1 += t
      else if (scope === 2) m.s2 += t
      else m.s3 += t
    }
  }
  return {
    ...s,
    total12: s.s1 + s.s2,
    bySource: [...src.values()].sort((a, b) => b.t - a.t),
    byMonth: months,
    hasData: rows.length > 0,
  }
}

/** Năm có số liệu KNK, mới nhất trước */
export const ghgYears = (activities: GhgActivity[]) =>
  [...new Set(activities.map((a) => Number(a.year)))].sort((a, b) => b - a)
