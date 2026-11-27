import test from "node:test";
import assert from "node:assert/strict";
import { compliance, identicalAcrossYears, flowOutliers, uniformIncrements, totalsCheck, nearestMismatch, impliedHours, wastewaterMax, upper, num } from "../src/lib/bvmt.ts";

test("đọc ô", () => { assert.equal(upper("<10"), 10); assert.equal(upper("KPH"), 0); assert.equal(num("<10"), null); assert.equal(upper(85), 85); assert.equal(upper(null), null); });
test("tuân thủ: không giá trị nào vượt giới hạn; cực đại 2025 là CO lò hơi đợt 4 = 185/800", () => {
  for (const y of ["2024", "2025"] as const) assert.equal(compliance(y).over.length, 0);
  const m = compliance("2025").max; assert.equal(m.id, "KK01"); assert.equal(m.key, "CO"); assert.equal(m.period, 4); assert.ok(Math.abs(m.p - 23.125) < 0.01);
});
test("báo cáo 2025: sản lượng và nguyên liệu 4 mặt hàng chính đều tăng đúng +8.000 t so với 2024", () => {
  const u = uniformIncrements(); assert.deepEqual([u.products.delta, u.products.count, u.materials.delta, u.materials.count], [8000, 4, 8000, 4]);
});
test("các tổng khớp phép cộng, trừ sản lượng sản phẩm 2023 trong báo cáo 2024 (cộng các dòng = 342.675, ghi 333.675: lệch 9.000)", () => {
  const bad = totalsCheck().filter(c => !c.ok); assert.equal(bad.length, 1); assert.equal(bad[0].name, "Sản lượng sản phẩm 2023"); assert.equal(bad[0].calc - bad[0].stated, 9000);
});
test("cột 'năm gần nhất' của báo cáo 2025 lệch ở nước (86.748 là số 2023; 2024 = 90.982) và gas (5 so với 6)", () => {
  const k = nearestMismatch().map(x => x.key).sort(); assert.deepEqual(k, ["gasM3", "waterM3"]);
});
test("giá trị trùng khít giữa hai báo cáo cùng điểm/đợt (lưu lượng KK02 và KK03 đợt 3, KK06 đợt 3)", () => {
  const same = identicalAcrossYears(); const has = (id: string, key: string, p: number) => same.some(s => s.id === id && s.key === key && s.period === p);
  assert.ok(has("KK02", "Lưu lượng", 3)); assert.ok(has("KK03", "Lưu lượng", 3)); assert.ok(has("KK06", "Lưu lượng", 3)); assert.ok(has("KK06", "CO", 3)); assert.ok(has("KK01", "CO", 3) === false); assert.ok(has("KK01", "Nhiệt độ", 3)); assert.ok(!same.some(x => x.key === "Bụi"));
});
test("lưu lượng lò hơi đợt 3/2024 = 78.352 m³/h (3,1 lần thiết kế 25.000) — dấu hiệu nhập nhầm", () => {
  const o = flowOutliers("2024"); assert.equal(o.length, 1); assert.equal(o[0].id, "KK01"); assert.equal(o[0].period, 3); assert.equal(flowOutliers("2025").length, 0);
});
test("1,628 tỷ m³ ÷ 360.000 m³/h ≈ 4.522 giờ; nước thải: cực đại COD 20/99", () => {
  assert.ok(Math.abs(impliedHours() - 4522) < 1); const c = wastewaterMax("2025").find(x => x.key === "COD")!; assert.equal(c.value, 20); assert.ok(Math.abs(c.pct - 20.2) < 0.1);
});
