import test from "node:test";
import assert from "node:assert/strict";
import { fundAmount, mandatoryKg, recyclerCost, packagingKg } from "../src/lib/epr.ts";
import { EPR_DECLARATIONS } from "../src/data/epr.ts";
test("F = V×R×Fs khớp 2 kỳ đã kê khai", () => { for (const d of EPR_DECLARATIONS) assert.ok(Math.abs(fundAmount(d.v, d.r, d.fs) - d.f) <= 1, d.label); });
test("ước tính 2026: Quỹ ≈ 925.811.927 đ; thuê tái chế ≈ 660.976.304 đ (111,3 tấn × 5.940 đ/kg)", () => {
  const v = 1_112_754.72; assert.ok(Math.abs(fundAmount(v) - 925_811_927) <= 1); assert.ok(Math.abs(mandatoryKg(v) - 111_275.472) < 0.01);
  assert.ok(Math.abs(recyclerCost(mandatoryKg(v)) - 660_976_304) <= 5); assert.equal(recyclerCost(5500), 32_670_000);
});
test("V từ số bao × khối lượng bao", () => assert.equal(packagingKg([{ qty: 1_000_000, grams: 120 }, { qty: 500_000, grams: 60 }]), 150_000));
