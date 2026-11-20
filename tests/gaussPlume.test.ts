import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildModel, sigmas, plumeRise, buoyancyFlux, maxOnCenterline,
  emissionRateFromStack, windAtHeight, type PlumeInput,
} from "../src/lib/gaussPlume.ts";

const close = (a: number, b: number, rel = 1e-3) =>
  assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} ≉ ${b} (rel ${rel})`);

const base: PlumeInput = {
  Q: 1, u10: 3, stability: "D", terrain: "rural",
  hs: 25, d: 0.8, vs: 10, Ts: 423.15, Ta: 303.15,
  riseMode: "final", windProfile: false,
};

test("σy, σz Briggs nông thôn lớp D tại 1 km khớp tính tay", () => {
  const { sy, sz } = sigmas(1000, "D", "rural");
  close(sy, 80 / Math.sqrt(1.1));   // 76,28 m
  close(sz, 60 / Math.sqrt(2.5));   // 37,95 m
});

test("σ đô thị A–B và E–F dùng chung công thức", () => {
  assert.deepEqual(sigmas(700, "A", "urban"), sigmas(700, "B", "urban"));
  assert.deepEqual(sigmas(700, "E", "urban"), sigmas(700, "F", "urban"));
});

test("Bảo toàn khối lượng: ∬ u·C dy dz = Q ở mọi khoảng cách và lớp ổn định", () => {
  for (const stability of ["A", "C", "D", "F"] as const) {
    for (const terrain of ["rural", "urban"] as const) {
      const m = buildModel({ ...base, stability, terrain, Q: 2.5 });
      for (const x of [200, 1500, 8000]) {
        const { sy, sz } = sigmas(x, stability, terrain);
        const H = m.H(x);
        const ny = 400, nz = 800;
        const yMax = 8 * sy, zMax = H + 8 * sz;
        const dy = (2 * yMax) / ny, dz = zMax / nz;
        let sum = 0;
        for (let i = 0; i < ny; i++) {
          const y = -yMax + (i + 0.5) * dy;
          for (let k = 0; k < nz; k++) sum += m.conc(x, y, (k + 0.5) * dz);
        }
        const flux = (sum * dy * dz * m.u) / 1e6; // μg → g
        close(flux, 2.5, 5e-3);
      }
    }
  }
});

test("Nồng độ mặt đất trùng công thức 2.2: Q/(π·u·σy·σz)·e^(−y²/2σy²)·e^(−H²/2σz²)", () => {
  const m = buildModel(base);
  const x = 1200, y = 40;
  const { sy, sz } = sigmas(x, "D", "rural");
  const H = m.H(x);
  const expected = (base.Q / (Math.PI * m.u * sy * sz)) *
    Math.exp(-(y * y) / (2 * sy * sy)) * Math.exp(-(H * H) / (2 * sz * sz)) * 1e6;
  close(m.conc(x, y, 0), expected, 1e-9);
});

test("Ngược gió và sát nguồn (x < 10 m) trả về 0; đối xứng theo y", () => {
  const m = buildModel(base);
  assert.equal(m.conc(-100, 0, 0), 0);
  assert.equal(m.conc(5, 0, 0), 0);
  assert.equal(m.conc(900, 30, 0), m.conc(900, -30, 0));
});

test("Thông lượng nổi F và quy đổi lưu lượng phát thải", () => {
  close(buoyancyFlux(10, 0.8, 423.15, 303.15), (9.81 * 10 * 0.64 * 120) / (4 * 423.15));
  assert.equal(buoyancyFlux(10, 0.8, 300, 303.15), 0);
  close(emissionRateFromStack(50, 60000), 0.8333333);
});

test("Độ nâng Briggs: luật 2/3 nối liên tục với độ nâng cuối cùng tại xFinal", () => {
  for (const F of [5, 30, 80, 300]) {
    const r = plumeRise(F, 4, "D", 300);
    const gradual = (1.6 * Math.cbrt(F) * Math.pow(r.xFinal, 2 / 3)) / 4;
    close(gradual, r.final, 2e-3);
    assert.equal(r.at(r.xFinal * 2), r.final);
    assert.ok(r.at(r.xFinal / 4) < r.final);
  }
  // F = 55: hai nhánh của công thức gần trùng nhau (lệch < 2 %)
  const below = plumeRise(54.999, 1, "D", 300).final, above = plumeRise(55, 1, "D", 300).final;
  close(below, above, 0.02);
});

test("Khí quyển ổn định cho độ nâng thấp hơn trung tính ở cùng điều kiện", () => {
  const F = 20, u = 2;
  assert.ok(plumeRise(F, u, "F", 300).final < plumeRise(F, u, "E", 300).final);
});

test("Profile gió: lớp F tăng mạnh hơn lớp A theo độ cao; dưới 10 m giữ u10", () => {
  assert.ok(windAtHeight(3, 40, "F", "rural") > windAtHeight(3, 40, "A", "rural"));
  assert.equal(windAtHeight(3, 5, "D", "rural"), 3);
});

test("Cực đại mặt đất: lớn hơn mọi điểm quét và dịch xa khi H tăng", () => {
  const m = buildModel(base);
  const mx = maxOnCenterline(m);
  for (let x = 20; x < 50000; x *= 1.05) assert.ok(m.conc(x, 0, 0) <= mx.c * (1 + 1e-9));
  const taller = maxOnCenterline(buildModel({ ...base, hs: 50 }));
  assert.ok(taller.x > mx.x && taller.c < mx.c);
});

test("Gió dưới 1 m/s bị nâng lên 1 m/s và được đánh dấu", () => {
  const m = buildModel({ ...base, u10: 0.4 });
  assert.equal(m.u, 1);
  assert.equal(m.uClamped, true);
});

import { screenWorstCase, screenAtDistance, SCREEN_WINDS, actualFlow, normalFlow, exitVelocity, gepHeight } from "../src/lib/gaussPlume.ts";

const stack18 = { terrain: "rural" as const, hs: 18, d: 0.7, vs: 8.2, Ts: 443.15, Ta: 303.15, riseMode: "final" as const, windProfile: true };

test("Sàng lọc: tổ hợp bất lợi nhất lớn hơn mọi tổ hợp, đúng số tổ hợp SCREEN3", () => {
  const { cases, worst } = screenWorstCase(stack18);
  const n = Object.values(SCREEN_WINDS).reduce((a, w) => a + w.length, 0);
  assert.equal(cases.length, n);
  for (const c of cases) assert.ok(c.cPerQ <= worst.cPerQ);
  // Kiểm tra chéo một tổ hợp bằng mô hình đơn lẻ
  const one = cases.find(c => c.stability === "D" && c.u10 === 3)!;
  const m = buildModel({ ...stack18, Q: 1, u10: 3, stability: "D" });
  close(one.cPerQ, maxOnCenterline(m, 1.5).c, 1e-9);
});

test("Sàng lọc tại khoảng cách cố định không vượt cực đại toàn miền", () => {
  const { worst } = screenWorstCase(stack18);
  for (const x of [100, 300, 1000, 3000]) assert.ok(screenAtDistance(stack18, x).cPerQ <= worst.cPerQ * (1 + 1e-9));
});

test("Quy đổi lưu lượng và vận tốc: khớp tính tay trong báo cáo (7.000 Nm³/h, 170 °C → ≈11.400 m³/h, ≈8,2 m/s)", () => {
  const qa = actualFlow(7000, 170);
  close(qa, 11357, 1e-3);
  close(normalFlow(qa, 170), 7000, 1e-12);
  close(exitVelocity(11400, 0.7), 8.23, 2e-3);
  assert.equal(gepHeight(12, 30), 30);
  assert.equal(gepHeight(12, 6), 21);
});
