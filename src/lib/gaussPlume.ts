// Mô hình lan truyền khí thải Gauss (Gaussian Plume) cho nguồn điểm liên tục, theo thuật toán
// EPA ISC3 (Volume II, 1995): σy, σz Pasquill–Gifford (nông thôn) hoặc Briggs/McElroy–Pooler (đô thị),
// hiệu chỉnh gió theo hàm mũ, cuốn xuống đỉnh ống khói (stack-tip downwash), độ nâng Briggs
// do lực nổi hoặc động lượng (điểm giao ΔTc), số hạng thẳng đứng có phản xạ mặt đất và lớp xáo trộn,
// số hạng phân hủy. Đơn vị SI: m, m/s, K, g/s; nồng độ trả về μg/m³.

export type Stability = "A" | "B" | "C" | "D" | "E" | "F";
export type Terrain = "rural" | "urban";
/** "pg": Pasquill–Gifford theo bảng ISC3 (mặc định cho nông thôn); "briggs": công thức Briggs (1973) vùng trống trải. Đô thị luôn dùng Briggs/McElroy–Pooler. */
export type SigmaScheme = "pg" | "briggs";

export const G = 9.81;
/** Khoảng cách tối thiểu tính toán (m) — tránh chia cho 0 sát nguồn. */
export const X_MIN = 10;
/** Vận tốc gió tối thiểu tại độ cao ống khói (m/s), như ISC3. */
export const U_MIN = 1;

export const STABILITY_LABELS: Record<Stability, string> = {
  A: "A — Rất không ổn định",
  B: "B — Không ổn định vừa",
  C: "C — Ít không ổn định",
  D: "D — Trung tính",
  E: "E — Ít ổn định",
  F: "F — Ổn định",
};

// ISC3 Bảng 1-1: σz = a·x^b (x tính bằng km), theo các khoảng khoảng cách [xMax km, a, b]
const PG_SZ: Record<Stability, [number, number, number][]> = {
  A: [[0.1, 122.8, 0.9447], [0.15, 158.08, 1.0542], [0.2, 170.22, 1.0932], [0.25, 179.52, 1.1262], [0.3, 217.41, 1.2644], [0.4, 258.89, 1.4094], [0.5, 346.75, 1.7283], [3.11, 453.85, 2.1166]],
  B: [[0.2, 90.673, 0.93198], [0.4, 98.483, 0.98332], [Infinity, 109.3, 1.0971]],
  C: [[Infinity, 61.141, 0.91465]],
  D: [[0.3, 34.459, 0.86974], [1, 32.093, 0.81066], [3, 32.093, 0.64403], [10, 33.504, 0.60486], [30, 36.65, 0.56589], [Infinity, 44.053, 0.51179]],
  E: [[0.1, 24.26, 0.8366], [0.3, 23.331, 0.81956], [1, 21.628, 0.7566], [2, 21.628, 0.63077], [4, 22.534, 0.57154], [10, 24.703, 0.50527], [20, 26.97, 0.46713], [40, 35.42, 0.37615], [Infinity, 47.618, 0.29592]],
  F: [[0.2, 15.209, 0.81558], [0.7, 14.457, 0.78407], [1, 13.953, 0.68465], [2, 13.953, 0.63227], [3, 14.823, 0.54503], [7, 16.187, 0.4649], [15, 17.836, 0.41507], [30, 22.651, 0.32681], [60, 27.074, 0.27436], [Infinity, 34.219, 0.21716]],
};
// ISC3 Bảng 1-2: σy = 465,11628·x·tan(TH), TH = 0,017453293·(c − d·ln x), x tính bằng km
const PG_SY: Record<Stability, [number, number]> = {
  A: [24.167, 2.5334], B: [18.333, 1.8096], C: [12.5, 1.0857], D: [8.333, 0.72382], E: [6.25, 0.54287], F: [4.1667, 0.36191],
};

/** σy, σz Pasquill–Gifford theo các công thức gần đúng của ISC3 (nông thôn); x tính bằng m. σz không vượt 5.000 m. */
export function sigmasPG(x: number, cls: Stability): { sy: number; sz: number } {
  const xk = x / 1000;
  const [c, d] = PG_SY[cls];
  const sy = 465.11628 * xk * Math.tan(0.017453293 * (c - d * Math.log(xk)));
  if (cls === "A" && xk > 3.11) return { sy, sz: 5000 };
  const [, a, b] = PG_SZ[cls].find(([xm]) => xk <= xm)!;
  return { sy, sz: Math.min(a * Math.pow(xk, b), 5000) };
}

/** σy, σz (m) theo Briggs (1973): vùng trống trải hoặc đô thị (McElroy–Pooler); x tính bằng m. */
export function sigmasBriggs(x: number, cls: Stability, terrain: Terrain): { sy: number; sz: number } {
  if (terrain === "rural") {
    const ay = { A: 0.22, B: 0.16, C: 0.11, D: 0.08, E: 0.06, F: 0.04 }[cls];
    const sy = ay * x * Math.pow(1 + 0.0001 * x, -0.5);
    let sz = 0;
    switch (cls) {
      case "A": sz = 0.2 * x; break;
      case "B": sz = 0.12 * x; break;
      case "C": sz = 0.08 * x * Math.pow(1 + 0.0002 * x, -0.5); break;
      case "D": sz = 0.06 * x * Math.pow(1 + 0.0015 * x, -0.5); break;
      case "E": sz = 0.03 * x / (1 + 0.0003 * x); break;
      case "F": sz = 0.016 * x / (1 + 0.0003 * x); break;
    }
    return { sy, sz };
  }
  const ay = { A: 0.32, B: 0.32, C: 0.22, D: 0.16, E: 0.11, F: 0.11 }[cls];
  const sy = ay * x * Math.pow(1 + 0.0004 * x, -0.5);
  let sz = 0;
  switch (cls) {
    case "A": case "B": sz = 0.24 * x * Math.pow(1 + 0.001 * x, 0.5); break;
    case "C": sz = 0.2 * x; break;
    case "D": sz = 0.14 * x * Math.pow(1 + 0.0003 * x, -0.5); break;
    case "E": case "F": sz = 0.08 * x * Math.pow(1 + 0.0015 * x, -0.5); break;
  }
  return { sy, sz };
}

/** σy, σz (m): nông thôn theo sơ đồ chọn (mặc định Pasquill–Gifford ISC3), đô thị theo Briggs/McElroy–Pooler. */
export function sigmas(x: number, cls: Stability, terrain: Terrain, scheme: SigmaScheme = "pg"): { sy: number; sz: number } {
  return terrain === "rural" && scheme === "pg" ? sigmasPG(x, cls) : sigmasBriggs(x, cls, terrain);
}

/** Số mũ hàm mũ profile gió p (EPA ISC3), dùng cho u(h) = u10·(h/10)^p. */
export function windExponent(cls: Stability, terrain: Terrain): number {
  return terrain === "rural"
    ? { A: 0.07, B: 0.07, C: 0.1, D: 0.15, E: 0.35, F: 0.55 }[cls]
    : { A: 0.15, B: 0.15, C: 0.2, D: 0.25, E: 0.3, F: 0.3 }[cls];
}

/** Vận tốc gió tại độ cao h từ gió đo ở 10 m (không giảm dưới mức 10 m). */
export function windAtHeight(u10: number, h: number, cls: Stability, terrain: Terrain): number {
  return u10 * Math.pow(Math.max(h, 10) / 10, windExponent(cls, terrain));
}

/** Thông lượng nổi Fb (m⁴/s³) = g·vs·d²·(Ts − Ta)/(4·Ts). Nguồn không nóng hơn khí quyển → 0. */
export function buoyancyFlux(vs: number, d: number, Ts: number, Ta: number): number {
  if (Ts <= Ta) return 0;
  return (G * vs * d * d * (Ts - Ta)) / (4 * Ts);
}

/** Thông lượng động lượng Fm (m⁴/s²) = vs²·d²·Ta/(4·Ts). */
export const momentumFlux = (vs: number, d: number, Ts: number, Ta: number) => (vs * vs * d * d * Ta) / (4 * Ts);

/** Chiều cao ống khói sau hiệu chỉnh cuốn xuống đỉnh ống (Briggs): h' = hs + 2d·(vs/us − 1,5) khi vs < 1,5·us. */
export function stackTipDownwash(hs: number, d: number, vs: number, us: number): number {
  return vs < 1.5 * us ? hs + 2 * d * (vs / us - 1.5) : hs;
}

/** Tham số ổn định s = (g/Ta)·dθ/dz, dθ/dz = 0,02 K/m (E), 0,035 K/m (F). */
const stableS = (cls: Stability, Ta: number) => (G / Ta) * (cls === "E" ? 0.02 : 0.035);

export interface PlumeRise {
  /** Độ nâng cuối cùng (m). */
  final: number;
  /** Khoảng cách đạt độ nâng cuối cùng (m); 0 với độ nâng do động lượng. */
  xFinal: number;
  /** Độ nâng tại khoảng cách x (m): luật 2/3 của Briggs (lực nổi), chặn trên bởi độ nâng cuối cùng. */
  at: (x: number) => number;
  /** Cơ chế chi phối theo điểm giao ΔTc của ISC3. */
  type: "buoyancy" | "momentum" | "none";
  /** Chênh nhiệt điểm giao ΔTc (K). */
  dTc?: number;
}

/**
 * Độ nâng luồng khói do lực nổi theo Briggs (dạng EPA ISC3).
 * A–D: F < 55 → Δh = 21,425·F^¾/u; F ≥ 55 → Δh = 38,71·F^⅗/u.
 * E–F: Δh = 2,6·(F/(u·s))^⅓.
 */
export function plumeRise(F: number, u: number, cls: Stability, Ta: number): PlumeRise {
  if (F <= 0) return { final: 0, xFinal: 0, at: () => 0, type: "none" };
  let final: number;
  let xFinal: number;
  if (cls === "E" || cls === "F") {
    const s = stableS(cls, Ta);
    final = 2.6 * Math.cbrt(F / (u * s));
    xFinal = (2.0715 * u) / Math.sqrt(s);
  } else if (F < 55) {
    final = (21.425 * Math.pow(F, 0.75)) / u;
    xFinal = 49 * Math.pow(F, 0.625);
  } else {
    final = (38.71 * Math.pow(F, 0.6)) / u;
    xFinal = 119 * Math.pow(F, 0.4);
  }
  const at = (x: number) =>
    x >= xFinal ? final : Math.min(final, (1.6 * Math.cbrt(F) * Math.pow(Math.max(x, 0), 2 / 3)) / u);
  return { final, xFinal, at, type: "buoyancy" };
}

/**
 * Độ nâng luồng khói theo ISC3: so ΔT = Ts − Ta với ΔTc để chọn lực nổi hay động lượng.
 * A–D: ΔTc = 0,0297·Ts·vs^⅓/d^⅔ (Fb < 55) hoặc 0,00575·Ts·vs^⅔/d^⅓ (Fb ≥ 55); động lượng Δh = 3·d·vs/us.
 * E–F: ΔTc = 0,019582·Ts·vs·√s; động lượng Δh = min(0,646·(Fm/(us·√s))^⅓, 3·d·vs/us).
 */
export function plumeRiseISC3(vs: number, d: number, Ts: number, Ta: number, us: number, cls: Stability): PlumeRise {
  const Fb = buoyancyFlux(vs, d, Ts, Ta);
  const dT = Ts - Ta;
  const stable = cls === "E" || cls === "F";
  const s = stable ? stableS(cls, Ta) : 0;
  const dTc = stable
    ? 0.019582 * Ts * vs * Math.sqrt(s)
    : Fb < 55 ? (0.0297 * Ts * Math.cbrt(vs)) / Math.pow(d, 2 / 3) : (0.00575 * Ts * Math.pow(vs, 2 / 3)) / Math.cbrt(d);
  if (Fb > 0 && dT >= dTc) return { ...plumeRise(Fb, us, cls, Ta), dTc };
  const neutralMomentum = (3 * d * vs) / us;
  const final = stable ? Math.min(0.646 * Math.cbrt(momentumFlux(vs, d, Ts, Ta) / (us * Math.sqrt(s))), neutralMomentum) : neutralMomentum;
  return { final, xFinal: 0, at: () => final, type: "momentum", dTc };
}

/** Chiều cao lớp xáo trộn dùng trong SCREEN3: A–D lấy max(320·u10, He + 1) m; E–F không giới hạn. */
export const screen3MixingHeight = (cls: Stability, u10: number, He: number) =>
  cls === "E" || cls === "F" ? Infinity : Math.max(320 * u10, He + 1);

export interface PlumeInput {
  /** Lưu lượng phát thải (g/s). */
  Q: number;
  /** Vận tốc gió đo ở 10 m (m/s). */
  u10: number;
  /** Lớp ổn định khí quyển Pasquill–Gifford. */
  stability: Stability;
  terrain: Terrain;
  /** Chiều cao ống khói thực tế (m). */
  hs: number;
  /** Đường kính miệng ống khói (m). */
  d: number;
  /** Vận tốc khí thoát (m/s). */
  vs: number;
  /** Nhiệt độ khí thải (K). */
  Ts: number;
  /** Nhiệt độ không khí (K). */
  Ta: number;
  /** "final": dùng độ nâng cuối cùng (mặc định EPA); "gradual": độ nâng tăng dần theo x; "none": bỏ qua. */
  riseMode: "final" | "gradual" | "none";
  /** Hiệu chỉnh gió theo độ cao ống khói (hàm mũ). */
  windProfile: boolean;
  /** Sơ đồ hệ số phân tán cho nông thôn (mặc định "pg" — ISC3). */
  sigmaScheme?: SigmaScheme;
  /** Hiệu chỉnh cuốn xuống đỉnh ống khói (mặc định bật, như ISC3). */
  stackTipDownwash?: boolean;
  /** Chiều cao lớp xáo trộn (m), "screen3" theo quy tắc SCREEN3, hoặc null/bỏ trống = không giới hạn. */
  mixingHeight?: number | "screen3" | null;
  /** Chu kỳ bán hủy chất ô nhiễm (giờ); bỏ trống = không phân hủy (D = 1). */
  halfLifeH?: number | null;
}

export interface PlumeModel {
  input: PlumeInput;
  /** Vận tốc gió dùng tính toán, tại độ cao ống khói (m/s). */
  u: number;
  /** true khi gió nhập vào thấp hơn U_MIN và đã bị nâng lên U_MIN. */
  uClamped: boolean;
  F: number;
  /** Thông lượng động lượng (m⁴/s²). */
  Fm: number;
  /** Chiều cao ống khói sau hiệu chỉnh cuốn xuống đỉnh ống (m). */
  hsAdj: number;
  rise: PlumeRise;
  /** Chiều cao lớp xáo trộn dùng tính toán (m); Infinity nếu không giới hạn. */
  L: number;
  /** Chiều cao hiệu dụng H(x) = h' + Δh(x) (m). */
  H: (x: number) => number;
  /** Nồng độ (μg/m³) tại (x xuôi gió, y ngang gió, z độ cao), m. Trả 0 ngược gió hoặc x < X_MIN. */
  conc: (x: number, y: number, z: number) => number;
}

/** Số hạng thẳng đứng ISC3: phản xạ mặt đất và (nếu L hữu hạn) phản xạ nhiều lần với lớp xáo trộn. */
export function verticalTerm(z: number, H: number, sz: number, L: number): number {
  const g = (v: number) => Math.exp(-0.5 * (v / sz) ** 2);
  if (!Number.isFinite(L)) return g(z - H) + g(z + H);
  if (H > L) return 0;                                    // luồng khói xuyên qua lớp nghịch nhiệt
  if (sz > 1.6 * L) return (Math.sqrt(2 * Math.PI) * sz) / L; // xáo trộn đều trong lớp
  let v = g(z - H) + g(z + H);
  for (let i = 1; i <= 50; i++) {
    const t = g(z - (2 * i * L - H)) + g(z + (2 * i * L - H)) + g(z - (2 * i * L + H)) + g(z + (2 * i * L + H));
    v += t;
    if (t < 1e-12) break;
  }
  return v;
}

export function buildModel(input: PlumeInput): PlumeModel {
  const { Q, u10, stability, terrain, hs, d, vs, Ts, Ta, riseMode, windProfile } = input;
  const scheme = input.sigmaScheme ?? "pg";
  const uRaw = windProfile ? windAtHeight(u10, hs, stability, terrain) : u10;
  const u = Math.max(uRaw, U_MIN);
  const F = buoyancyFlux(vs, d, Ts, Ta);
  const Fm = momentumFlux(vs, d, Ts, Ta);
  const hsAdj = input.stackTipDownwash === false ? hs : Math.max(stackTipDownwash(hs, d, vs, u), 0);
  const rise: PlumeRise = riseMode === "none" ? { final: 0, xFinal: 0, at: () => 0, type: "none" } : plumeRiseISC3(vs, d, Ts, Ta, u, stability);
  const H = (x: number) => hsAdj + (riseMode === "gradual" ? rise.at(x) : rise.final);
  const mh = input.mixingHeight;
  const L = mh === "screen3" ? screen3MixingHeight(stability, u10, hsAdj + rise.final) : typeof mh === "number" && mh > 0 ? mh : Infinity;
  const psi = input.halfLifeH && input.halfLifeH > 0 ? 0.693 / (input.halfLifeH * 3600) : 0;

  const conc = (x: number, y: number, z: number) => {
    if (x < X_MIN || Q <= 0) return 0;
    const { sy, sz } = sigmas(x, stability, terrain, scheme);
    const lateral = Math.exp(-(y * y) / (2 * sy * sy));
    const decay = psi ? Math.exp((-psi * x) / u) : 1;
    return ((Q / (2 * Math.PI * u * sy * sz)) * lateral * verticalTerm(z, H(x), sz, L) * decay) * 1e6;
  };

  return { input, u, uClamped: uRaw < U_MIN, F, Fm, hsAdj, rise, L, H, conc };
}

/** Nồng độ cực đại trên trục gió ở độ cao z: quét logarit X_MIN → xMaxSearch rồi tinh chỉnh. */
export function maxOnCenterline(model: PlumeModel, z = 0, xMaxSearch = 50000): { x: number; c: number } {
  const n = 600;
  const lo = Math.log(X_MIN);
  const hi = Math.log(xMaxSearch);
  let best = { x: X_MIN, c: model.conc(X_MIN, 0, z) };
  let bestI = 0;
  for (let i = 1; i <= n; i++) {
    const x = Math.exp(lo + ((hi - lo) * i) / n);
    const c = model.conc(x, 0, z);
    if (c > best.c) { best = { x, c }; bestI = i; }
  }
  // Tinh chỉnh bằng tìm kiếm tỉ lệ vàng giữa hai điểm lưới kề nhau
  let a = Math.exp(lo + ((hi - lo) * Math.max(bestI - 1, 0)) / n);
  let b = Math.exp(lo + ((hi - lo) * Math.min(bestI + 1, n)) / n);
  const r = (Math.sqrt(5) - 1) / 2;
  for (let k = 0; k < 60; k++) {
    const x1 = b - r * (b - a);
    const x2 = a + r * (b - a);
    if (model.conc(x1, 0, z) >= model.conc(x2, 0, z)) b = x2; else a = x1;
  }
  const x = (a + b) / 2;
  const c = model.conc(x, 0, z);
  return c >= best.c ? { x, c } : best;
}

/** Quy đổi lưu lượng phát thải: nồng độ khí thải (mg/Nm³) × lưu lượng khí (Nm³/h) → g/s. */
export function emissionRateFromStack(cMgNm3: number, flowNm3h: number): number {
  return (cMgNm3 * flowNm3h) / 3.6e6;
}

export const celsiusToK = (c: number) => c + 273.15;

// ─── Sàng lọc điều kiện khí tượng bất lợi nhất (kiểu SCREEN3) ───────────────

/** Tổ hợp lớp ổn định × gió 10 m hợp lệ theo bảng sàng lọc SCREEN3 (EPA-454/B-95-004). */
export const SCREEN_WINDS: Record<Stability, number[]> = {
  A: [1, 1.5, 2, 2.5, 3],
  B: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
  C: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 8, 10],
  D: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 8, 10, 15, 20],
  E: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
  F: [1, 1.5, 2, 2.5, 3, 3.5, 4],
};

export type SourceInput = Omit<PlumeInput, "Q" | "u10" | "stability">;

export interface ScreenCase {
  stability: Stability;
  u10: number;
  /** Khoảng cách xảy ra cực đại trên trục gió (m). */
  x: number;
  /** Nồng độ cực đại ứng với Q = 1 g/s (μg/m³ trên g/s). Nồng độ tỷ lệ thuận với Q. */
  cPerQ: number;
  /** Chiều cao hiệu dụng tại x (m). */
  H: number;
}

/** Quét mọi tổ hợp khí tượng hợp lệ (lớp xáo trộn mặc định theo SCREEN3), trả về cực đại trên trục gió của từng tổ hợp và tổ hợp bất lợi nhất. */
export function screenWorstCase(src: SourceInput, z = 1.5): { cases: ScreenCase[]; worst: ScreenCase } {
  const cases: ScreenCase[] = [];
  for (const stability of Object.keys(SCREEN_WINDS) as Stability[]) {
    for (const u10 of SCREEN_WINDS[stability]) {
      const m = buildModel({ mixingHeight: "screen3", ...src, Q: 1, u10, stability });
      const mx = maxOnCenterline(m, z);
      cases.push({ stability, u10, x: mx.x, cPerQ: mx.c, H: m.H(mx.x) });
    }
  }
  const worst = cases.reduce((a, b) => (b.cPerQ > a.cPerQ ? b : a));
  return { cases, worst };
}

/** Nồng độ lớn nhất (trên Q = 1 g/s) tại một khoảng cách cố định, xét mọi tổ hợp khí tượng hợp lệ. */
export function screenAtDistance(src: SourceInput, x: number, z = 1.5): ScreenCase {
  let best: ScreenCase | null = null;
  for (const stability of Object.keys(SCREEN_WINDS) as Stability[]) {
    for (const u10 of SCREEN_WINDS[stability]) {
      const m = buildModel({ mixingHeight: "screen3", ...src, Q: 1, u10, stability });
      const c = m.conc(x, 0, z);
      if (!best || c > best.cPerQ) best = { stability, u10, x, cPerQ: c, H: m.H(x) };
    }
  }
  return best as ScreenCase;
}

// ─── Quy đổi thông số ống khói ─────────────────────────────────────────────

/** Lưu lượng chuẩn (Nm³/h ở tRefC, mặc định 0 °C; QCVN 19:2009 dùng 25 °C) → lưu lượng thực ở nhiệt độ khí thải (m³/h). Bỏ qua chênh áp suất. */
export const actualFlow = (flowNm3h: number, tC: number, tRefC = 0) => (flowNm3h * (273.15 + tC)) / (273.15 + tRefC);
/** Lưu lượng thực (m³/h) → lưu lượng chuẩn (Nm³/h ở tRefC). */
export const normalFlow = (flowM3h: number, tC: number, tRefC = 0) => (flowM3h * (273.15 + tRefC)) / (273.15 + tC);
/** Vận tốc khí thoát miệng ống khói (m/s) từ lưu lượng thực (m³/h) và đường kính (m). */
export const exitVelocity = (flowM3h: number, d: number) => flowM3h / 3600 / ((Math.PI * d * d) / 4);

/** Chiều cao ống khói theo thực hành kỹ thuật tốt (GEP, EPA): Hg = Hb + 1,5·L, L = min(chiều cao, bề rộng công trình). */
export const gepHeight = (buildingH: number, buildingW: number) => buildingH + 1.5 * Math.min(buildingH, buildingW);

// ─── Ước tính phát thải theo hệ số (EPA AP-42 chương 8; Australian NPI, Equation 8) ──────

/** Hệ số phát thải kg/tấn sản phẩm. pmC: hệ số đã kiểm soát (null = không có số liệu). Khoảng giá trị lấy cận trên. */
export const AP42_FACTORS = [
  { id: "urea-sol",   ref: "AP-42 8.2 Urea", name: "Tạo/cô đặc dung dịch urê",            pmU: 0.0105, pmC: null,  nh3U: 9.23 },
  { id: "urea-nfp",   ref: "AP-42 8.2 Urea", name: "Tháp tạo hạt không tầng sôi (NN)",    pmU: 1.9,    pmC: 0.032, nh3U: 0.43 },
  { id: "urea-fp",    ref: "AP-42 8.2 Urea", name: "Tháp tạo hạt tầng sôi (NN)",          pmU: 3.1,    pmC: 0.39,  nh3U: 1.46 },
  { id: "urea-drum",  ref: "AP-42 8.2 Urea", name: "Tạo hạt thùng quay (drum granulation)", pmU: 120,  pmC: 0.115, nh3U: 1.07 },
  { id: "urea-cool",  ref: "AP-42 8.2 Urea", name: "Làm nguội thùng quay",                pmU: 3.89,   pmC: 0.10,  nh3U: 0.0256 },
  { id: "an-neut",    ref: "AP-42 8.3 AN",   name: "Thiết bị trung hòa (cận trên 4,3/18)", pmU: 4.3,    pmC: null,  nh3U: 18.0 },
  { id: "an-hdprill", ref: "AP-42 8.3 AN",   name: "Tháp tạo hạt tỷ trọng cao",            pmU: 1.59,   pmC: null,  nh3U: 28.6 },
  { id: "an-drum",    ref: "AP-42 8.3 AN",   name: "Tạo hạt thùng quay",                   pmU: 146,    pmC: null,  nh3U: 29.7 },
  { id: "an-ldcool",  ref: "AP-42 8.3 AN",   name: "Làm nguội hạt tỷ trọng thấp",          pmU: 25.8,   pmC: null,  nh3U: 0.15 },
] as const;

/** NPI Eq. 8: E (g/s) = A (tấn/h) × EF (kg/tấn) × (1 − CE/100) / 3,6. */
export const emissionRateFromFactor = (tonnesPerHour: number, efKgPerT: number, controlEffPct = 0) =>
  (tonnesPerHour * efKgPerT * (1 - controlEffPct / 100)) / 3.6;

/** Hiệu suất lọc bụi tĩnh điện theo phương trình Deutsch: η = 1 − exp(−ω·A/Q). */
export const deutschEfficiency = (migrationVelocity: number, area: number, flowM3s: number) =>
  1 - Math.exp((-migrationVelocity * area) / flowM3s);
