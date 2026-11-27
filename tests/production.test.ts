import test from "node:test";
import assert from "node:assert/strict";
import { PROD } from "../src/data/production2026.ts";
import { sumMachine, monthsOf, biomassMassShare, volumeRatio, intensity, dailyHours, rawTotals } from "../src/lib/production.ts";

test("tháng 4: tổng sản lượng ba máy khớp tổng 18.997,5 t trên file gốc (J283) và giờ chạy máy 2 = 488,5", () => {
  const t = (["TH1H", "TH2H", "TH3H"] as const).reduce((a, k) => a + sumMachine(k, ["04"]).tons, 0);
  assert.ok(Math.abs(t - 18997.5) < 1, String(t));
  assert.equal(sumMachine("TH2H", ["04"]).hours, 488.5); assert.equal(sumMachine("TH2H", ["04"]).ca, 52);
});
test("quý II: giờ chạy theo máy", () => {
  const q2 = monthsOf("Q2");
  assert.equal(sumMachine("TH1H", q2).hours, 1141); assert.equal(sumMachine("TH2H", q2).hours, 1279.5); assert.equal(sumMachine("TH3H", q2).hours, 1350.5);
});
test("sinh khối chỉ ở máy 3 (và vài ca máy 1 tháng 5)", () => {
  assert.ok(sumMachine("TH3H", monthsOf("ALL")).biomassKg > 450000); assert.equal(sumMachine("TH2H", monthsOf("ALL")).biomassKg, 0);
  assert.equal(sumMachine("TH1H", ["05"]).biomassKg, 5650);
  const s = biomassMassShare(sumMachine("TH3H", ["04"])); assert.ok(s > 0.55 && s < 0.65, String(s));
});
test("suất tiêu hao hợp lý và ngày công tơ lỗi bị loại", () => {
  const x = sumMachine("TH3H", ["08"]); assert.ok(x.kWhRuns < x.ca); const i = intensity(x);
  assert.ok(i.coalPerT > 5 && i.coalPerT < 40); assert.ok(i.kWhPerT > 20 && i.kWhPerT < 60, String(i.kWhPerT));
});
test("so sánh khí thải: Q đo × giờ thực / (Q thiết kế × 1.152 h)", () => {
  assert.ok(Math.abs(volumeRatio(1279.5, 79128, 140000) - 0.628) < 0.002);
});
test("dữ liệu ngày và nguyên liệu", () => {
  assert.equal(dailyHours("TH3H", "04").length, 31); assert.ok(dailyHours("TH3H", "04")[0] === 23);
  assert.equal(rawTotals(monthsOf("ALL"))[0][0], "SA"); assert.ok(Object.keys(PROD).length === 5);
});
