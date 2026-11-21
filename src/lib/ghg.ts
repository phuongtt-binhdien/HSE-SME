// Kiểm kê khí nhà kính cấp cơ sở — phương pháp theo báo cáo kiểm kê KNK Nhà máy Phân bón Bình Điền – Long An (ECC Bách Khoa, 29/07/2024),
// Thông tư 38/2023/TT-BCT (Phụ lục II), hệ số phát thải theo Quyết định 2626/QĐ-BTNMT (Phụ lục I), GWP theo IPCC AR6 (CH₄ 27,9; N₂O 273)
// và Thông tư 01/2022/TT-BTNMT (môi chất lạnh). Đơn vị phát thải: tấn.
export const GWP = { CH4: 27.9, N2O: 273 };
export interface FuelDef { name: string; unit: "tấn" | "lít"; ncv: number; density?: number; co2: number; ch4: number; n2o: number }
/** ncv: TJ/Gg (IPCC 2006); hệ số kg/TJ; density: kg/lít. */
export const FUELS: Record<string, FuelDef> = {
  coal: { name: "Than (antraxit) — lò hơi, lò sấy", unit: "tấn", ncv: 26.7, co2: 98300, ch4: 10, n2o: 1.5 },
  biomass: { name: "Sinh khối (gỗ/chất thải gỗ) — lò hơi, lò sấy", unit: "tấn", ncv: 15.6, co2: 100000, ch4: 30, n2o: 4 },
  doGen: { name: "Dầu DO — máy phát dự phòng", unit: "lít", ncv: 43, density: 0.85, co2: 74100, ch4: 3, n2o: 0.6 },
  doVeh: { name: "Dầu DO — xe nội bộ, xe nâng", unit: "lít", ncv: 43, density: 0.85, co2: 74100, ch4: 3.9, n2o: 3.9 },
};
export const EF_GRID_2023 = 0.6766; // tấn CO₂/MWh — công văn 327/BĐKH-PTCBT (dùng trong báo cáo)

export interface FuelEm { tj: number; co2: number; ch4: number; n2o: number; co2e: number }
export function fuelEmission(f: FuelDef, amount: number): FuelEm {
  const tonnes = f.unit === "lít" ? (amount * (f.density ?? 0.85)) / 1000 : amount;
  const tj = (tonnes * f.ncv) / 1000;
  const co2 = (tj * f.co2) / 1000, ch4 = (tj * f.ch4) / 1000, n2o = (tj * f.n2o) / 1000;
  return { tj, co2, ch4, n2o, co2e: co2 + ch4 * GWP.CH4 + n2o * GWP.N2O };
}
export const electricityEmission = (kwh: number, ef = EF_GRID_2023) => (kwh / 1000) * ef;
/** Rò rỉ môi chất lạnh: tổng lượng gas × tỷ lệ rò rỉ (mặc định 15 %) × GWP (R32 = 675). Trả về tấn CO₂e. */
export const refrigerantEmission = (totalKg: number, gwp = 675, leak = 0.15) => (totalKg * leak * gwp) / 1000;
/** Bình chữa cháy CO₂ (rò rỉ tối đa 5 %/năm theo TCVN 7026): [{kg mỗi bình, số bình}] → tấn CO₂. */
export const extinguisherEmission = (list: { kg: number; n: number }[], leak = 0.05) => list.reduce((s, b) => s + b.kg * b.n * leak, 0) / 1000;
export interface WwIn { flow: number; days: number; bod: number; people: number }
/** Nước thải sinh hoạt (TT 17/2022/TT-BTNMT như báo cáo): CH₄ từ BOD, N₂O từ nitơ. EF CH₄ = 0,6×0,3; hệ số N₂O 0,01 kg N₂O-N/kg N. */
export function wastewaterEmission(w: WwIn) {
  const tow = ((w.flow * w.days * w.bod) / 1000) * 1.25;                 // kg BOD/năm (hệ số bổ sung công nghiệp 1,25)
  const ch4 = (tow * 0.6 * 0.3) / 1000;                                   // tấn
  const protein = (88.1 / 1000) * w.days * 0.96;                          // kg protein/người/năm
  const nKg = w.people * protein * 0.16 * 1.25 * 1.1;                     // kg N/năm
  const n2o = (nKg * 0.01 * 44) / 28 / 1000;                              // tấn
  return { ch4, n2o, co2e: ch4 * GWP.CH4 + n2o * GWP.N2O };
}

export interface YearInput { coal: number; biomass: number; doGen: number; doVeh: number; kwh: number; efGrid: number; refrigerantKg: number; mt3: number; mt5: number; wwFlow: number; wwDays: number; wwBod: number; people: number; npkGranulated: number; npkBlended: number }
export const EMPTY_YEAR: YearInput = { coal: 0, biomass: 0, doGen: 0, doVeh: 0, kwh: 0, efGrid: EF_GRID_2023, refrigerantKg: 0, mt3: 0, mt5: 0, wwFlow: 0, wwDays: 345, wwBod: 27, people: 700, npkGranulated: 0, npkBlended: 0 };
export interface YearResult { rows: { key: string; label: string; scope: 1 | 2; co2e: number }[]; scope1: number; scope2: number; total: number; product: number; intensity: number | null; biogenicCo2: number }
export function computeYear(i: YearInput): YearResult {
  const coal = fuelEmission(FUELS.coal, i.coal), bio = fuelEmission(FUELS.biomass, i.biomass), g = fuelEmission(FUELS.doGen, i.doGen), v = fuelEmission(FUELS.doVeh, i.doVeh);
  const ww = i.wwFlow > 0 ? wastewaterEmission({ flow: i.wwFlow, days: i.wwDays, bod: i.wwBod, people: i.people }) : { co2e: 0 };
  // CO₂ sinh khối là CO₂ sinh học: báo cáo riêng, không tính vào tổng; chỉ tính CH₄ và N₂O của đốt sinh khối
  const bioCo2e = bio.ch4 * GWP.CH4 + bio.n2o * GWP.N2O;
  const rows = [
    { key: "coal", label: "Than cho lò hơi, lò đốt", scope: 1 as const, co2e: coal.co2e }, { key: "biomass", label: "Sinh khối (CH₄, N₂O)", scope: 1 as const, co2e: bioCo2e },
    { key: "doGen", label: "DO cho máy phát", scope: 1 as const, co2e: g.co2e }, { key: "doVeh", label: "DO cho di chuyển", scope: 1 as const, co2e: v.co2e },
    { key: "ref", label: "Môi chất lạnh", scope: 1 as const, co2e: refrigerantEmission(i.refrigerantKg) },
    { key: "ext", label: "Bình cứu hỏa", scope: 1 as const, co2e: extinguisherEmission([{ kg: 3, n: i.mt3 }, { kg: 5, n: i.mt5 }]) },
    { key: "ww", label: "Xử lý nước thải sinh hoạt", scope: 1 as const, co2e: ww.co2e },
    { key: "elec", label: "Điện mua từ lưới EVN", scope: 2 as const, co2e: electricityEmission(i.kwh, i.efGrid) },
  ];
  const scope1 = rows.filter(r => r.scope === 1).reduce((s, r) => s + r.co2e, 0), scope2 = rows.filter(r => r.scope === 2).reduce((s, r) => s + r.co2e, 0);
  const product = i.npkGranulated + i.npkBlended;
  return { rows, scope1, scope2, total: scope1 + scope2, product, intensity: product > 0 ? ((scope1 + scope2) * 1000) / product : null, biogenicCo2: bio.co2 };
}
