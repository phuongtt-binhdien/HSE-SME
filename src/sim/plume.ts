// Nồng độ mặt đất từ các ống khói của nhà máy (mô hình Gauss ISC3 trong src/lib/gaussPlume.ts), phủ lên mặt bằng 3D.
// Hệ tọa độ cảnh: x hướng Đông, z hướng Nam (Bắc = −z), 1 đơn vị = 1 m.
import { buildModel, type Stability } from "../lib/gaussPlume.ts";

export type Pol = "tsp" | "no2" | "nh3";
export const POL_LABEL: Record<Pol, string> = { tsp: "Bụi TSP", no2: "NO₂", nh3: "NH₃" };
/** Giới hạn trung bình 1 giờ QCVN 05:2023/BTNMT (μg/m³) — như tab Gauss: cần đối chiếu bản gốc. */
export const POL_LIMIT: Record<Pol, number> = { tsp: 300, no2: 200, nh3: 200 };

export interface PlumeSource { id: string; x: number; z: number; hs: number; d: number; vs: number; Ts: number; Q: Record<Pol, number> }
export interface PlumeParams { sources: PlumeSource[]; pol: Pol; u10: number; stability: Stability; windFromDeg: number; Ta?: number }
export interface PlumeGrid { n: number; half: number; cx: number; cz: number; data: Float32Array; max: number; maxX: number; maxZ: number }

/** Vector gió thổi tới trong hệ tọa độ cảnh (đơn vị), từ hướng gió thổi TỪ (độ, 0 = Bắc, 90 = Đông). */
export function windVector(fromDeg: number) {
  const to = ((fromDeg + 180) * Math.PI) / 180;
  return { wx: Math.sin(to), wz: -Math.cos(to) };
}

export function makeConcFn(p: PlumeParams) {
  const { wx, wz } = windVector(p.windFromDeg);
  const px = -wz, pz = wx;
  const models = p.sources.map(s => ({ s, m: buildModel({
    Q: s.Q[p.pol], u10: p.u10, stability: p.stability, terrain: "rural", hs: s.hs, d: s.d, vs: s.vs, Ts: s.Ts, Ta: (p.Ta ?? 30) + 273.15,
    riseMode: "final", windProfile: true, mixingHeight: "screen3",
  }) }));
  return (x: number, z: number, h = 1.5) => {
    let c = 0;
    for (const { s, m } of models) {
      if (s.Q[p.pol] <= 0) continue;
      const rx = x - s.x, rz = z - s.z;
      const xd = rx * wx + rz * wz;
      if (xd < 10) continue;
      c += m.conc(xd, rx * px + rz * pz, h);
    }
    return c;
  };
}

export function computePlume(p: PlumeParams, n = 128, half = 450, cx = 0, cz = 0): PlumeGrid {
  const f = makeConcFn(p); const data = new Float32Array(n * n);
  let max = 0, maxX = cx, maxZ = cz;
  for (let j = 0; j < n; j++) {
    const z = cz + ((j + 0.5) / n - 0.5) * 2 * half;
    for (let i = 0; i < n; i++) {
      const x = cx + ((i + 0.5) / n - 0.5) * 2 * half;
      const c = f(x, z); data[j * n + i] = c;
      if (c > max) { max = c; maxX = x; maxZ = z; }
    }
  }
  return { n, half, cx, cz, data, max, maxX, maxZ };
}

/** Bảng màu tuần tự một sắc (hổ phách), thang log 3 bậc dưới giá trị tham chiếu; trả về RGBA (0–255). */
export function colorAt(c: number, ref: number): [number, number, number, number] {
  if (!(c > 0) || !(ref > 0)) return [0, 0, 0, 0];
  const t = 1 + Math.log10(c / ref) / 3;
  if (t <= 0.02) return [0, 0, 0, 0];
  const R = [[40, 30, 10], [150, 80, 10], [235, 140, 20], [255, 200, 70], [255, 240, 200]];
  const s = Math.min(1, t) * (R.length - 1), i = Math.min(Math.floor(s), R.length - 2), f = s - i;
  return [0, 1, 2].map(k => Math.round(R[i][k] + (R[i + 1][k] - R[i][k]) * f)).concat([Math.round(40 + 150 * Math.min(1, t))]) as [number, number, number, number];
}

/** Đổi lưới nồng độ thành ảnh RGBA cho CanvasTexture; ref = thang tham chiếu (giá trị cực đại hoặc giới hạn QCVN). */
export function gridToImage(g: PlumeGrid, ref: number, limit?: number): ImageData | Uint8ClampedArray {
  const px = new Uint8ClampedArray(g.n * g.n * 4);
  for (let k = 0; k < g.data.length; k++) {
    const c = g.data[k]; const [r, gg, b, a] = colorAt(c, ref);
    let R = r, G = gg, B = b, A = a;
    if (limit && c >= limit) { R = 230; G = 40; B = 50; A = Math.max(A, 190); } // vùng vượt giới hạn
    px[k * 4] = R; px[k * 4 + 1] = G; px[k * 4 + 2] = B; px[k * 4 + 3] = A;
  }
  return px;
}

/** Nguồn phát thải của nhà máy ứng với trạng thái mô phỏng. Tọa độ ống khói theo bố trí cảnh 3D. */
// S02: theo Hồ sơ đề nghị điều chỉnh GPMT (10/11/2026) — ống khói dòng 04 đổi D2 600 → 1.500 mm (Q 55.000 m³/h → ≈ 8,6 m/s; GPMT hiện hành D2 600 mm cho ≈ 54 m/s).
export const STACK_POS = { S01: { x: -23, z: 28, hs: 18, d: 0.7 }, S02: { x: 50, z: -38, hs: 22, d: 1.5 } };
const FLOW_N_DRYER = 46000; // Nm³/h — dòng sấy nóng DC1 (số liệu quan trắc 2026)
export function sourcesFromSim(eq: Record<string, { on: boolean; load: number }>, pv: { tsp: number; nh3: number }): PlumeSource[] {
  const out: PlumeSource[] = [];
  const bio = eq.LH01.load, coal = eq.LH02.load;
  if (bio > 0.05) out.push({ id: "S01", ...STACK_POS.S01, vs: 8.2, Ts: 170 + 273.15, Q: { tsp: 0.0074 * bio, no2: 0.6417 * bio, nh3: 0 } });
  else if (coal > 0.05) out.push({ id: "S01", ...STACK_POS.S01, vs: 14.2, Ts: 86 + 273.15, Q: { tsp: 0.086 * coal, no2: 0.154 * coal, nh3: 0 } });
  else out.push({ id: "S01", ...STACK_POS.S01, vs: 1, Ts: 303, Q: { tsp: 0, no2: 0, nh3: 0 } });
  const fan = eq.QH01.load, q = FLOW_N_DRYER / 3.6e6 * fan;
  out.push({ id: "S02", ...STACK_POS.S02, vs: 8.6 * fan + 0.1, Ts: 50 + 273.15, Q: { tsp: pv.tsp * q, nh3: pv.nh3 * q, no2: (eq.LD01.load > 0.2 ? 10 : 0) * q } });
  return out;
}
