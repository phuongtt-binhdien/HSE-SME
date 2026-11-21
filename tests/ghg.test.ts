import test from "node:test";
import assert from "node:assert/strict";
import { computeYear, fuelEmission, FUELS, electricityEmission, refrigerantEmission, extinguisherEmission, wastewaterEmission, EMPTY_YEAR } from "../src/lib/ghg.ts";
import { ACTIVITY_2023, RESULT_2023, MONTHLY_2023 } from "../src/data/ghg.ts";

const near = (a: number, b: number, tol: number, m: string) => assert.ok(Math.abs(a - b) <= tol, `${m}: ${a} vs ${b}`);
test("tái tạo kết quả báo cáo kiểm kê năm 2023 từ số liệu hoạt động", () => {
  const r = computeYear(ACTIVITY_2023); const by = Object.fromEntries(r.rows.map(x => [x.key, x.co2e]));
  near(by.coal, 9352.363, 1.5, "than"); near(by.doGen, 7.504, 0.05, "DO máy phát"); near(by.doVeh, 245.655, 0.5, "DO xe"); near(by.ref, 5.68, 0.01, "môi chất lạnh");
  near(by.ext, 0.032, 0.001, "bình cứu hỏa"); near(by.ww, 26.294, 0.3, "nước thải"); near(by.elec, 5622.614, 0.5, "điện");
  near(r.scope1, RESULT_2023.scope1, 2, "phạm vi 1"); near(r.scope2, RESULT_2023.scope2, 0.5, "phạm vi 2"); near(r.total, RESULT_2023.total, 2.5, "tổng");
  near(r.intensity!, 33.56, 0.1, "cường độ kg CO2e/t");
});
test("CO₂ của than: 3.538,6 tấn × 26,7 TJ/Gg × 98.300 kg/TJ", () => { near(fuelEmission(FUELS.coal, 3538.6).co2, 9287.3, 0.5, "CO2 than"); });
test("sinh khối: CO₂ sinh học tách riêng, chỉ CH₄ và N₂O vào tổng", () => {
  const r = computeYear({ ...EMPTY_YEAR, biomass: 1000 }); assert.ok(r.biogenicCo2 > 1500 && r.biogenicCo2 < 1600);
  const e = fuelEmission(FUELS.biomass, 1000); near(r.total, e.ch4 * 27.9 + e.n2o * 273, 1e-6, "chỉ CH4+N2O"); assert.ok(r.total < r.biogenicCo2 / 10);
});
test("điện, môi chất lạnh, bình cứu hỏa, nước thải", () => {
  near(electricityEmission(8310100), 5622.6, 0.5, "điện"); near(refrigerantEmission(56.1), 5.68, 0.01, "R32"); near(extinguisherEmission([{ kg: 3, n: 53 }, { kg: 5, n: 98 }]), 0.03245, 1e-5, "CO2 bình");
  const w = wastewaterEmission({ flow: 120, days: 345, bod: 27, people: 700 }); near(w.ch4, 0.2515, 0.005, "CH4"); near(w.n2o, 0.0706, 0.003, "N2O");
});
test("dữ liệu theo tháng 2023 cộng đúng tổng báo cáo", () => {
  const s = (a: number[]) => a.reduce((x, y) => x + y, 0);
  near(s(MONTHLY_2023.coal), 9352.363, 0.01, "than"); near(s(MONTHLY_2023.elec), 5622.61, 0.05, "điện"); near(s(MONTHLY_2023.kwh), 8310100, 0, "kWh");
  near(s(MONTHLY_2023.npkGranulated), 127198, 1, "NPK tạo hạt"); near(s(MONTHLY_2023.npkBlended), 327518, 1, "NPK trộn");
});
test("năm chưa có số liệu: tổng = 0, cường độ không xác định", () => { const r = computeYear(EMPTY_YEAR); assert.equal(r.total, 0); assert.equal(r.intensity, null); });
