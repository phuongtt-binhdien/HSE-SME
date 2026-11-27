// Tính toán Gauss (ISC3/SCREEN3 sàng lọc) cho lò hơi nguồn 01 và toàn bộ nguồn khí thải nhà máy — dùng cùng mô hình src/lib/gaussPlume.ts của ứng dụng.
// Chạy: node --experimental-strip-types --no-warnings scripts/gauss/run.ts <out.json>
import { writeFileSync } from "node:fs";
import { buildModel, screenWorstCase, maxOnCenterline, normalFlow, exitVelocity, celsiusToK, SCREEN_WINDS } from "../../src/lib/gaussPlume.ts";
import { windVector } from "../../src/sim/plume.ts";

export const POLS = ["tsp", "so2", "nox", "co", "nh3"] as const;
const LIM19: Record<string, number> = { tsp: 160, so2: 400, nox: 680, co: 800, nh3: 40 };      // mg/Nm³ — QCVN 19:2009 + QCVN 21:2009 cột B, Kp 0,8
const LIM05: Record<string, number> = { tsp: 300, so2: 350, nox: 200, co: 30000, nh3: 200 };   // μg/m³, trung bình 1 giờ (QCVN 05:2023)
const TA = 30, T_REF = 25;
const common = { terrain: "rural", riseMode: "final", windProfile: true, sigmaScheme: "pg", stackTipDownwash: true, mixingHeight: "screen3", z0: 0.3, riseScheme: "isc3", Ta: celsiusToK(TA) };

type Src = { id: string; name: string; hs: number; d: number; tC: number; flowA: number; c: Record<string, number>; xy: [number, number]; note?: string };
const emis = (s: Src) => { const fN = normalFlow(s.flowA, s.tC, T_REF); const Q: Record<string, number> = {}; for (const p of POLS) Q[p] = ((s.c[p] ?? 0) * fN) / 3.6e6; return { fN, Q }; };
const mk = (s: Src) => ({ hs: s.hs, d: s.d, vs: exitVelocity(s.flowA, s.d), Ts: celsiusToK(s.tC), ...common });

// ── Nguồn 01: hai lò hơi dùng chung ống khói cao 18 m, Ø700 ──
const S01 = { hs: 18, d: 0.7, xy: [1172156, 580206] as [number, number] };
const boilers: Src[] = [
  // Lò sinh khối 6 t/h — thiết kế (Bảng 2.2 báo cáo: 7.000 Nm³/h ở 0 °C ≈ 11.400 m³/h ở 170 °C; tải lượng theo cân bằng chất)
  { id: "LH01-A", name: "Lò sinh khối 6 t/h — số liệu thiết kế (Bảng 2.2)", ...S01, tC: 170, flowA: 11400, c: {}, note: "Tải lượng: bụi 0,0266 kg/h (3,8 mg/Nm³ × 7.000 Nm³/h), SO₂ 0,42 kg/h, NOₓ 2,32 kg/h; CO chưa có số liệu nhà cung cấp" },
  { id: "LH01-B", name: "Lò sinh khối 6 t/h — xả bằng giới hạn GPMT", ...S01, tC: 170, flowA: 25000, c: { tsp: 160, so2: 400, nox: 680, co: 800 }, note: "Kịch bản bảo thủ: lưu lượng xả lớn nhất cấp phép 25.000 m³/h, nồng độ bằng QCVN 19 cột B (Kp 0,8)" },
  { id: "LH02-A", name: "Lò than 8 t/h (dự phòng) — kết quả quan trắc 2026", ...S01, tC: 86, flowA: 19636, c: { tsp: 19, so2: 55, nox: 34, co: 79 }, note: "Giá trị lớn nhất 2 đợt quan trắc 2026 (phiếu 0731/2026/DV và 1461/2026/DV); 86 °C" },
  { id: "LH02-B", name: "Lò than 8 t/h (dự phòng) — xả bằng giới hạn GPMT", ...S01, tC: 86, flowA: 25000, c: { tsp: 160, so2: 400, nox: 680, co: 800 }, note: "Kịch bản bảo thủ: quạt hút hiện hữu 25.000 m³/h, nồng độ bằng QCVN 19 cột B (Kp 0,8)" },
];
const emisBoiler = (s: Src) => {
  if (s.id === "LH01-A") return { fN: 7000 * (273.15 + T_REF) / 273.15, Q: { tsp: 0.0266 / 3.6, so2: 0.42 / 3.6, nox: 2.32 / 3.6, co: 0, nh3: 0 } as Record<string, number> };
  return emis(s);
};

const out: any = { meta: { Ta: TA, tRef: T_REF, LIM19, LIM05 }, boilers: [], plant: {} };
for (const s of boilers) {
  const e = emisBoiler(s), src: any = mk(s), scr = screenWorstCase(src, 1.5);
  const per: any = {}; const w = scr.worst;
  for (const p of POLS) { const Q = e.Q[p]; if (!(Q > 0)) { per[p] = null; continue; } per[p] = { Q, cmax: Q * w.cPerQ }; }
  // nồng độ theo khoảng cách (cực đại trong mọi tổ hợp khí tượng) và cực đại theo lớp ổn định
  const dist = [50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000];
  const atDist = dist.map(x => { let best = 0, bm: any = null; for (const st of Object.keys(SCREEN_WINDS)) for (const u of (SCREEN_WINDS as any)[st]) { const m = buildModel({ mixingHeight: "screen3", ...src, Q: 1, u10: u, stability: st as any }); const c = m.conc(x, 0, 1.5); if (c > best) { best = c; bm = { st, u }; } } return { x, cPerQ: best, met: bm }; });
  const byClass = Object.keys(SCREEN_WINDS).map(st => { const cs = scr.cases.filter(c => c.stability === st), b = cs.reduce((a, c) => (c.cPerQ > a.cPerQ ? c : a)); return { st, u10: b.u10, x: b.x, cPerQ: b.cPerQ, H: b.H }; });
  // profile theo khoảng cách ở điều kiện bất lợi nhất
  const mw = buildModel({ mixingHeight: "screen3", ...src, Q: 1, u10: w.u10, stability: w.stability });
  const prof: any[] = []; for (let x = 30; x <= 3000; x += x < 500 ? 10 : 50) prof.push({ x, cPerQ: mw.conc(x, 0, 1.5) });
  out.boilers.push({ id: s.id, name: s.name, note: s.note, hs: s.hs, d: s.d, tC: s.tC, flowA: s.flowA, vs: exitVelocity(s.flowA, s.d), flowN: e.fN, conc: s.c, Q: e.Q, worst: { st: w.stability, u10: w.u10, x: w.x, H: w.H, cPerQ: w.cPerQ }, per, atDist, byClass, prof });
}

// ── Toàn bộ nguồn khí thải nhà máy (GPMT 2986, Phụ lục 2) — vị trí theo tọa độ VN2000 ──
const D = (id: string, name: string, hs: number, d: number, tC: number, flowA: number, c: Record<string, number>, xy: [number, number], note = ""): Src => ({ id, name, hs, d, tC, flowA, c, xy, note });
const ld = (n: number) => n; // giữ nguyên
const meas: Record<string, Src> = {
  S02: D("S02", "Lò sấy nóng · tạo hạt 1", 22, 0.6, 50, 50260, { tsp: 16, so2: 10, nox: 11, co: 22, nh3: 0.62 }, [1172150, 580263], "đo 28/4 và 6/7/2026; <10 lấy 10"),
  S03: D("S03", "Lò sấy nguội · tạo hạt 1", 22, 0.6, 47, 50901, { tsp: 17, so2: 10, nox: 10, co: 25, nh3: 0.47 }, [1172132, 580277], "đo 28/4 và 6/7/2026; <10 lấy 10"),
  S04: D("S04", "Lò sấy nóng · tạo hạt 2", 22, 0.6, 57, 47965, { tsp: 18, so2: 10, nox: 55, co: 172, nh3: 0.59 }, [1172155, 580357], "đo 6/4 và 17/7/2026; D2 600 mm theo GPMT hiện hành"),
  S05: D("S05", "Lò sấy nguội · tạo hạt 2", 22, 0.6, 57, 42725, { tsp: 18, so2: 10, nox: 59, co: 74, nh3: 1.6 }, [1172194, 580350], "đo 6/4 và 17/7/2026"),
  S06: D("S06", "Lò sấy · tạo hạt 3", 22, 2.0, 71, 79128, { tsp: 16, so2: 10, nox: 10, co: 10, nh3: 0.79 }, [1172157, 580332], "đo 30/3 và 30/6/2026; lưu lượng đo 79.128 m³/h < thiết kế 140.000"),
  S07: D("S07", "Phối trộn phân hữu cơ", 1.2, 0.3, 30, 0, { tsp: 0, so2: 0, nox: 0, co: 0, nh3: 0 }, [1171990, 580289], "hiện không vận hành (xác nhận của Nhà máy)"),
};
const lim = (s: Src, flowDesign: number, tC: number): Src => (s.id === "S07" ? { ...s, flowA: flowDesign, tC, c: { tsp: 0, so2: 0, nox: 0, co: 0, nh3: 0 } } : { ...s, flowA: flowDesign, tC, c: { tsp: 160, so2: 400, nox: 680, co: 800, nh3: 40 } });
const limFlow: Record<string, number> = { S02: 55000, S03: 55000, S04: 55000, S05: 55000, S06: 140000, S07: 10000 };
const actual: Src[] = Object.values(meas);
const atLimit: Src[] = Object.values(meas).map(s => lim(s, limFlow[s.id], s.id === "S07" ? 30 : s.tC));
const dryers = (arr: Src[]) => arr.map(s => { const e = emis(s); return { ...s, vs: exitVelocity(s.flowA, s.d), flowN: e.fN, Q: e.Q }; });
out.plant.actualSources = dryers(actual); out.plant.limitSources = dryers(atLimit);
out.plant.S01 = { ...S01 };
{ // độ nhạy: nếu dây chuyền phối trộn hữu cơ (S07, ống thải 1,2 m, Ø300) vận hành và xả bằng giới hạn QCVN 21 (bụi 200 mg/Nm³, 10.000 m³/h)
  const s7: Src = { ...meas.S07, flowA: 10000, tC: 30, c: { tsp: 200 } }; const e = emis(s7), scr = screenWorstCase(mk(s7) as any, 1.5);
  out.plant.S07_if_running = { flowA: 10000, vs: exitVelocity(10000, 0.3), Q_tsp: e.Q.tsp, cmax: e.Q.tsp * scr.worst.cPerQ, x: scr.worst.x, st: scr.worst.stability, u10: scr.worst.u10 }; }
// Tổng hợp: chồng chập các nguồn theo tọa độ tương đối (x Đông, z Nam), quét khí tượng bất lợi
const toXZ = (xy: [number, number]) => [xy[1] - S01.xy[1], -(xy[0] - S01.xy[0])] as [number, number];
const stackAll = (kind: "actual" | "limit", boiler: Src) => [{ ...boiler, id: "S01" }, ...(kind === "actual" ? actual : atLimit)] as Src[];
const scen = [
  { key: "A_ngay_thuong", label: "Ngày thường — lò sinh khối (thiết kế) + các lò sấy (quan trắc 2026)", kind: "actual", boiler: boilers[0] },
  { key: "A_cuoi_tuan", label: "Cuối tuần — lò than (quan trắc 2026) + các lò sấy (quan trắc 2026)", kind: "actual", boiler: boilers[2] },
  { key: "B_ngay_thuong", label: "Ngày thường — mọi nguồn xả bằng giới hạn GPMT (lò sinh khối)", kind: "limit", boiler: boilers[1] },
  { key: "B_cuoi_tuan", label: "Cuối tuần — mọi nguồn xả bằng giới hạn GPMT (lò than)", kind: "limit", boiler: boilers[3] },
] as const;
const N = 81, HALF = 1500;
const mets: { st: string; u: number }[] = []; for (const st of Object.keys(SCREEN_WINDS)) for (const u of (SCREEN_WINDS as any)[st]) if ([1, 2, 3, 5].includes(u)) mets.push({ st, u });
const dirs = Array.from({ length: 24 }, (_, i) => i * 15);
// nồng độ đơn vị (1 g/s) của từng nguồn cho từng tổ hợp: nhân tuyến tính với Q
const srcs = [{ id: "S01", ...S01, xy: S01.xy, ...mk({ id: "S01", name: "", hs: 18, d: 0.7, tC: 86, flowA: 19636, c: {}, xy: S01.xy } as Src) }];
const allSrcIds = ["S01", ...actual.map(s => s.id)];
const geom: Record<string, any> = { S01: { hs: 18, d: 0.7 } }; for (const s of actual) geom[s.id] = { hs: s.hs, d: s.d };
const best: any = {}; for (const sc of scen) { best[sc.key] = {}; for (const p of POLS) best[sc.key][p] = { c: 0 }; }
const Qs: Record<string, Record<string, Record<string, number>>> = {};
for (const sc of scen) { Qs[sc.key] = {}; for (const s of stackAll(sc.kind, sc.boiler)) Qs[sc.key][s.id] = (s.id === "S01" ? emisBoiler(sc.boiler) : emis(s)).Q; }
const stackSrc: Record<string, Record<string, Src>> = {}; for (const sc of scen) { stackSrc[sc.key] = {}; for (const s of stackAll(sc.kind, sc.boiler)) stackSrc[sc.key][s.id] = s; }
const pos: Record<string, [number, number]> = { S01: [0, 0] }; for (const s of actual) pos[s.id] = toXZ(s.xy);
// hình học nguồn thay đổi theo kịch bản (nhiệt độ/vận tốc) → dựng mô hình theo kịch bản
let evals = 0;
for (const sc of scen) {
  const sources = Object.values(stackSrc[sc.key]);
  for (const m of mets) for (const dir of dirs) {
    const { wx, wz } = windVector(dir); const px = -wz, pz = wx;
    const models = sources.map(s => ({ s, mod: buildModel({ mixingHeight: "screen3", ...mk(s), Q: 1, u10: m.u, stability: m.st as any }) }));
    const fields = models.map(() => new Float32Array(N * N));
    for (let j = 0; j < N; j++) { const z = ((j + 0.5) / N - 0.5) * 2 * HALF; for (let i = 0; i < N; i++) { const x = ((i + 0.5) / N - 0.5) * 2 * HALF;
      models.forEach((mm, k) => { const [sx, sz] = pos[mm.s.id]; const rx = x - sx, rz = z - sz, xd = rx * wx + rz * wz; if (xd >= 10) { fields[k][j * N + i] = mm.mod.conc(xd, rx * px + rz * pz, 1.5); evals++; } }); } }
    for (const p of POLS) { let bc = 0, bi = -1; for (let idx = 0; idx < N * N; idx++) { let c = 0; for (let k = 0; k < models.length; k++) c += fields[k][idx] * (Qs[sc.key][models[k].s.id][p] || 0); if (c > bc) { bc = c; bi = idx; } }
      if (bc > best[sc.key][p].c) { const i = bi % N, j = Math.floor(bi / N); const x = ((i + 0.5) / N - 0.5) * 2 * HALF, z = ((j + 0.5) / N - 0.5) * 2 * HALF;
        const contrib: Record<string, number> = {}; models.forEach((mm, k) => { contrib[mm.s.id] = fields[k][bi] * (Qs[sc.key][mm.s.id][p] || 0); });
        best[sc.key][p] = { c: bc, x, z, st: m.st, u10: m.u, dirFrom: dir, contrib }; } }
  }
}
out.plant.scenarios = scen.map(sc => ({ key: sc.key, label: sc.label, kind: sc.kind, sources: Object.values(stackSrc[sc.key]).map(s => { const e = s.id === "S01" ? emisBoiler(sc.boiler) : emis(s); return { id: s.id, name: s.id === "S01" ? sc.boiler.name : s.name, hs: s.hs, d: s.d, tC: s.tC, flowA: s.flowA, vs: exitVelocity(s.flowA, s.d), flowN: e.fN, conc: s.id === "S01" ? sc.boiler.c : s.c, Q: e.Q, xy: s.xy, rel: pos[s.id], single: (() => { const w = screenWorstCase(mk(s) as any, 1.5).worst; return { st: w.stability, u10: w.u10, x: w.x, cPerQ: w.cPerQ }; })() }; }), best: best[sc.key] }));
out.plant.grid = { N, HALF, mets: mets.length, dirs: dirs.length, evals };
writeFileSync(process.argv[2] || "gauss.json", JSON.stringify(out));
console.log("done", evals, "evals");
