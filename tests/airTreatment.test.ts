import test from "node:test";
import assert from "node:assert/strict";
import { stokesVelocity, nog, removalFromNog, cycloneSizing, cycloneDp, filtrationVelocity, bagDiameter, bagsArea, bagFilterArea, bagCount, stackExitVelocity, stackDiameterFor, stackMinHeight, towerDiameter, actualPlates, pa2mmH2O, BOOK, STACKS, BAG_G04, BAG_LB55, inRange } from "../src/lib/airTreatment.ts";

test("Stokes: 10 µm, ρ = 1000 kg/m³ ≈ 0,30 cm/s (Bảng 3.1: 3,06·10⁻¹ cm/s)", () => {
  const v = stokesVelocity(10e-6, 1000) * 100; assert.ok(Math.abs(v - 0.306) / 0.306 < 0.03, String(v));
  const v20 = stokesVelocity(20e-6, 1000) * 100; assert.ok(Math.abs(v20 - 1.2) / 1.2 < 0.03);
});
test("N_og → % hấp thụ khớp bảng trang 99", () => {
  const book: [number, number][] = [[0.5, 39.0], [1, 63.0], [2, 86.5], [3, 95.0], [4, 98.2], [5, 99.3]];
  for (const [n, pct] of book) assert.ok(Math.abs(removalFromNog(n) * 100 - pct) < 0.4, `Nog ${n}`);
  assert.ok(Math.abs(nog(1500, 400) - Math.log(3.75)) < 1e-12);
});
test("cyclone PT 3.5–3.8", () => {
  const r = cycloneSizing(55000 / 3600, 3, 1); assert.ok(Math.abs(r.Fx - 5.093) < 0.01); assert.ok(Math.abs(r.Dcalc - 2.547) < 0.01);
  const r2 = cycloneSizing(55000 / 3600, 3, 1, 2.5); assert.ok(Math.abs(r2.devPct) < 5);
  assert.equal(cycloneDp(5, 1, 20), 1000);
});
test("lọc túi G04: 556 m² → 1,65 m/phút tại Q thiết kế; vượt 1,5 nhưng trong 2,5 (túi có khung đỡ)", () => {
  const v = filtrationVelocity(BAG_G04.design, BAG_G04.area); assert.ok(Math.abs(v - 1.648) < 0.005);
  assert.ok(v > BOOK.bagFiltration[1] && v < BOOK.bagFiltrationCage);
  // đường kính suy ra từ 556 m², 432 túi, dài 3,36 m ≈ 0,122 m; dài 3,46 m → diện tích ≈ 573 m²
  const d = bagDiameter(556, 432, 3.36); assert.ok(Math.abs(d - 0.122) < 0.002);
  assert.ok(Math.abs(bagsArea(432, d, 3.46) - 572.6) < 1);
  assert.equal(bagCount(bagFilterArea(900, 0, 1.2, 0), 1.287), 583);
  assert.ok(Math.abs(pa2mmH2O(1350) - 137.7) < 0.2);
});
test("ống khói: D2 0,6 m → ≈ 47 m/s (G04 đo); D2 1,5 m → ≈ 7,5 m/s < 20; D để đạt 20 m/s ≈ 0,92 m", () => {
  assert.ok(Math.abs(stackExitVelocity(47965, 0.6) - 47.1) < 0.2); assert.ok(Math.abs(stackExitVelocity(47965, 1.5) - 7.54) < 0.05);
  assert.ok(Math.abs(stackDiameterFor(47965) - 0.921) < 0.005);
  assert.deepEqual(stackMinHeight(10), [20, 25]); assert.ok(inRange(12, BOOK.cycloneInlet));
  assert.equal(STACKS.length, 6); assert.equal(actualPlates(3), 6); assert.ok(towerDiameter(25000) > 2);
});

test("lọc bụi LB55 hoàn công (CME): 742 m² → 1,24 m/phút tại 55.000 m³/h, trong khoảng 0,5–1,5 của giáo trình", () => {
  const v = filtrationVelocity(BAG_LB55.design, BAG_LB55.area); assert.ok(Math.abs(v - 1.235) < 0.005, String(v)); assert.ok(inRange(v, BOOK.bagFiltration));
  assert.equal(STACKS.find(s => s.id === "G06")!.dAsBuilt, 2.2);
});
