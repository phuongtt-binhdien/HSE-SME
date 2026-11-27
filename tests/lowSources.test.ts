import { test } from "node:test";
import assert from "node:assert/strict";
import { kFactor, relHeight, S1, S2, S3, wideBuildingDownwind, wideBuildingWake, erf, lineSource,
  canyonLeeward, canyonWindward, ppmToMgM3, psi, giffordHanna, boxModel } from "../src/lib/lowSources.ts";

const close = (a: number, b: number, rel = 1e-3) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} ≉ ${b}`);

test("k (Hình 1.6): 1 ở H̄ ≤ 0, 0 ở H̄ ≥ 1, đơn điệu giảm", () => {
  assert.equal(kFactor(-0.2), 1); assert.equal(kFactor(1.3), 0);
  for (let h = 0; h < 1; h += 0.05) assert.ok(kFactor(h + 0.05) <= kFactor(h));
  close(relHeight(15, 10, 30, "roof"), 0.25); close(relHeight(25, 10, 40, "general"), 7 / 22);
});

test("S₁–S₃ (PT 1.41–1.43): = 1 trên trục, giảm theo y", () => {
  assert.equal(S3(0, 50, 20), 1);
  close(S3(10, 50, 20), Math.exp(-3000 / 90 ** 2));
  close(S2(5, 20), Math.exp(-750 / 400));
  assert.ok(S1(10, 50, 30, 20) > S3(10, 50, 20));
});

test("Nhà rộng — điểm sau nhà: tính tay PT (1.21), (1.22), (1.26), (1.27)", () => {
  const p = { M: 1000, L: 10, h: 12, Hnh: 10, Hgh: 30, l: 60, m: 0.4, x: 20, y: 0 };
  const r = wideBuildingDownwind(p);           // H̄ = 0,1 < 0,3, x = 20 ≤ 40
  assert.equal(r.eq, "(1.21)");
  close(r.Cx, 1.3 * 1000 * 0.4 * r.k * (0.8 / 600 + 42 / (84 + 20) ** 2));
  const far = wideBuildingDownwind({ ...p, x: 100 });
  assert.equal(far.eq, "(1.22)");
  close(far.Cx, 55 * 1000 * 0.4 * far.k / ((84 + 100) ** 2 + 550));
  const hi = wideBuildingDownwind({ ...p, h: 20 }); // H̄ = 0,5 > 0,3
  assert.equal(hi.eq, "(1.24)");
  const w = wideBuildingWake({ M: 1000, L: 10, h: 8, Hnh: 10, Hgh: 30, l: 60, x: 20, y: 0 });
  assert.equal(w.k, 1); assert.equal(w.eq, "(1.26)");
  close(wideBuildingWake({ M: 1000, L: 10, h: 8, Hnh: 10, Hgh: 30, l: 60, x: 60, y: 0 }).Cx, 55000 / (84 + 60) ** 2);
  // Chú thích 2: l > 10H_nh → l = 10H_nh trong thành phần đầu
  const long = wideBuildingWake({ M: 1000, L: 10, h: 4, Hnh: 5, Hgh: 30, l: 200, x: 10, y: 0 });
  close(long.Cx, 1.3 * 1000 * (0.8 / (50 * 5) + 42 / (280 + 10) ** 2));
});

test("Nguồn đường: erf chính xác, l → ∞ khớp PT (1.50), Bảng 1.4 (B′ ≈ 1 khi l = 2x)", () => {
  close(erf(1), 0.8427007929, 1e-6); close(erf(-0.5), -0.5204998778, 1e-6);
  const inf = lineSource(0.01, 2, 0, 200, "D");
  const { sz } = { sz: 0 }; void sz;
  assert.equal(inf.Bp, 1);
  for (const cls of ["B", "C", "D", "E", "F"] as const) {
    const fin = lineSource(0.01, 2, 0, 150, cls, 300);
    assert.ok(fin.Bp > 0.999, `${cls}: ${fin.Bp}`);
  }
  assert.ok(lineSource(0.01, 2, 0, 150, "A", 300).Bp > 0.99);
  // Nguồn ngắn so với khoảng cách → B′ nhỏ
  assert.ok(lineSource(0.01, 2, 0, 1000, "D", 50).Bp < 0.5);
});

test("Đường phố hẻm (1.52, 1.53) và quy đổi ppm", () => {
  close(canyonLeeward(12000, 1.5, 6, 2), 840 / (2 * (2 + Math.hypot(6, 2))));
  close(canyonWindward(12000, 1.5, 20), 840 / 40);
  close(ppmToMgM3(1, 28), 1.1452, 1e-3);
});

test("Nguồn mặt: ψ Bảng 1.5, Gifford–Hanna (1.55), hộp cố định (1.57)", () => {
  assert.equal(psi("trung bình", 10), 115);
  close(psi("ổn định", Math.sqrt(10)), (341 + 662) / 2);
  close(giffordHanna(0.5, 2, "không ổn định", 1, 10), 46 * 0.5 / 2 + 10);
  close(boxModel(1e-6, 2000, 2, 500, 0.02), 0.02 + 1e3 * 1e-6 * 2000 / 1000);
});
