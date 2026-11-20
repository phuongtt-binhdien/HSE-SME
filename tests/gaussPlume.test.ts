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
  const { sy, sz } = sigmas(1000, "D", "rural", "briggs");
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
  close(normalFlow(18544, 86, 25), 15394, 1e-3); // phiếu 1461/2026: 18.544 m³/h ở 86 °C → Nm³ ở 25 °C
  close(actualFlow(normalFlow(20000, 60, 25), 60, 25), 20000, 1e-12);
  assert.equal(gepHeight(12, 30), 30);
  assert.equal(gepHeight(12, 6), 21);
});

import { sigmasPG, stackTipDownwash, plumeRiseISC3, momentumFlux, verticalTerm, screen3MixingHeight } from "../src/lib/gaussPlume.ts";

test("σ Pasquill–Gifford (ISC3) khớp đường cong Turner tại 1 km và 100 m", () => {
  // Giá trị đọc từ đồ thị Turner (1970): D 1 km σy≈68, σz≈32; F 1 km σy≈34, σz≈14; A 1 km σy≈210; A 100 m σz≈14
  const d1 = sigmasPG(1000, "D"), f1 = sigmasPG(1000, "F"), a1 = sigmasPG(1000, "A"), a01 = sigmasPG(100, "A");
  close(d1.sy, 68, 0.02); close(d1.sz, 32.1, 0.02);
  close(f1.sy, 34, 0.02); close(f1.sz, 14, 0.02);
  close(a1.sy, 210, 0.02); close(a01.sz, 14, 0.03);
  assert.equal(sigmasPG(5000, "A").sz, 5000); // σz không vượt 5.000 m
  // Mặc định nông thôn là PG; đô thị vẫn là Briggs/McElroy–Pooler
  assert.deepEqual(sigmas(800, "C", "rural"), sigmasPG(800, "C"));
  assert.deepEqual(sigmas(800, "C", "urban"), sigmas(800, "C", "urban", "briggs"));
});

test("Cuốn xuống đỉnh ống khói: chỉ khi vs < 1,5·us, giảm 2d·(1,5 − vs/us)", () => {
  assert.equal(stackTipDownwash(18, 0.7, 14, 5), 18);         // vs ≥ 1,5us
  close(stackTipDownwash(18, 0.7, 6, 5), 18 + 2 * 0.7 * (6 / 5 - 1.5));
  const m = buildModel({ ...base, vs: 3, u10: 8 });           // khí thoát chậm, gió mạnh
  assert.ok(m.hsAdj < base.hs);
  const off = buildModel({ ...base, vs: 3, u10: 8, stackTipDownwash: false });
  assert.equal(off.hsAdj, base.hs);
});

test("Độ nâng ISC3: nguồn nóng → lực nổi; nguồn nguội vận tốc cao → động lượng 3·d·vs/us", () => {
  const hot = plumeRiseISC3(10, 0.8, 423.15, 303.15, 4, "D");
  assert.equal(hot.type, "buoyancy");
  const cold = plumeRiseISC3(15, 1.2, 305, 303.15, 4, "D");
  assert.equal(cold.type, "momentum");
  close(cold.final, 3 * 1.2 * 15 / 4);
  // Ổn định: lấy giá trị nhỏ hơn của công thức ổn định và trung tính
  const st = plumeRiseISC3(15, 1.2, 305, 303.15, 2, "F");
  const s = (9.81 / 303.15) * 0.035;
  close(st.final, Math.min(0.646 * Math.cbrt(momentumFlux(15, 1.2, 305, 303.15) / (2 * Math.sqrt(s))), 3 * 1.2 * 15 / 2));
  // Không nóng hơn khí quyển vẫn có độ nâng động lượng (trước đây = 0)
  assert.ok(plumeRiseISC3(12, 1, 300, 303.15, 3, "C").final > 0);
});

test("Lớp xáo trộn: bảo toàn khối lượng trong lớp 0–L và xáo trộn đều khi σz > 1,6L", () => {
  const L = 300;
  const m = buildModel({ ...base, mixingHeight: L, stability: "B", Q: 2 });
  for (const x of [400, 1500]) {
    const { sy } = sigmas(x, "B", "rural");
    const ny = 300, nz = 600, yMax = 8 * sy, dy = 2 * yMax / ny, dz = L / nz;
    let sum = 0;
    for (let i = 0; i < ny; i++) for (let k = 0; k < nz; k++) sum += m.conc(x, -yMax + (i + 0.5) * dy, (k + 0.5) * dz);
    close(sum * dy * dz * m.u / 1e6, 2, 5e-3);
  }
  close(verticalTerm(1.5, 50, 600, 300), Math.sqrt(2 * Math.PI) * 600 / 300);
  assert.equal(verticalTerm(1.5, 400, 50, 300), 0);           // H > L
  assert.equal(screen3MixingHeight("F", 2, 40), Infinity);
  assert.equal(screen3MixingHeight("D", 0.1, 60), 61);
});

test("Phân hủy: nồng độ giảm một nửa sau thời gian bán hủy (x = u·T½)", () => {
  const m0 = buildModel({ ...base, windProfile: false, u10: 2 });
  const m1 = buildModel({ ...base, windProfile: false, u10: 2, halfLifeH: 1 });
  const x = 2 * 3600; // u = 2 m/s × 1 giờ
  close(m1.conc(x, 0, 0) / m0.conc(x, 0, 0), 0.5, 1e-3);
});

import { emissionRateFromFactor, deutschEfficiency, AP42_FACTORS } from "../src/lib/gaussPlume.ts";

test("Hệ số phát thải (NPI Eq. 8) và phương trình Deutsch", () => {
  // 20 t/h × 120 kg/t × (1 − 99,9 %) = 2,4 kg/h = 0,667 g/s
  close(emissionRateFromFactor(20, 120, 99.9), 2.4 / 3.6);
  assert.equal(AP42_FACTORS.find(f => f.id === "urea-drum")!.pmC, 0.115);
  close(deutschEfficiency(0.1, 300, 30), 1 - Math.exp(-1));
});

import { sigmasNL, averagingTimeFactor, pasquillClass, heatEmissionMW, plumeRiseTextbook } from "../src/lib/gaussPlume.ts";

test("Giáo trình: σ Mô hình quốc gia Hà Lan (Bảng 1.2) tính tay, z₀ = 0,1 m thì C_z0 = 1", () => {
  const r = sigmasNL(1000, "D", 0.1);
  close(r.sy, 0.47 * Math.pow(1000, 0.907) * Math.pow(0.1, 0.2));
  close(r.sz, 0.2 * Math.pow(1000, 0.76));
  // z₀ lớn hơn → phân tán mạnh hơn
  assert.ok(sigmasNL(1000, "D", 1).sz > r.sz && sigmasNL(1000, "D", 1).sy > r.sy);
  // Ổn định → hẹp hơn không ổn định
  assert.ok(sigmasNL(500, "F", 0.1).sz < sigmasNL(500, "A", 0.1).sz);
});

test("Giáo trình: hệ số thời gian trung bình (PT 1.6) và phân loại Pasquill (Bảng 1.1)", () => {
  assert.equal(averagingTimeFactor(60, 60), 1);
  close(averagingTimeFactor(3, 60, 0.3), Math.pow(0.05, 0.3));
  assert.equal(pasquillClass(1.5, "strong"), "A");
  assert.equal(pasquillClass(2.5, "moderate"), "B");
  assert.equal(pasquillClass(4, "slight"), "C");
  assert.equal(pasquillClass(2.5, "clear"), "F");
  assert.equal(pasquillClass(4, "overcast"), "D");
  assert.equal(pasquillClass(7, "strong"), "C");
});

test("Giáo trình: độ nâng theo hàm nhiệt Q_H — liên tục tại 6 MW, khớp Briggs ISC3, nguồn lạnh dùng Stumke", () => {
  // Hai nhánh PT (1.9)/(1.10) gặp nhau tại 6 MW (lệch < 1 %)
  close(109 * Math.pow(6, 0.75), 143 * Math.pow(6, 0.6), 0.01);
  // Q_H = 1,36·10⁻³ × Q_V0 × ΔT
  close(heatEmissionMW(10, 1, 400, 300), 1.36e-3 * (10 * Math.PI / 4) * (273.15 / 400) * 100);
  // Nguồn nóng: cùng bậc độ lớn với Briggs ISC3 (lệch < 25 %)
  const tb = plumeRiseTextbook(12, 1.2, 343.15, 303.15, 3, "D").final;
  const isc = plumeRiseISC3(12, 1.2, 343.15, 303.15, 3, "D").final;
  assert.ok(Math.abs(tb - isc) / isc < 0.25, `${tb} vs ${isc}`);
  // Nguồn lạnh: ΔH = 1,5·vₛ·d/U
  const cold = plumeRiseTextbook(15, 1.2, 304, 303.15, 4, "D");
  assert.equal(cold.type, "momentum"); close(cold.final, 1.5 * 15 * 1.2 / 4);
});
