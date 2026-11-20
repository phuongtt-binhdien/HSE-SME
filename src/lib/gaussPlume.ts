// Mô hình lan truyền khí thải Gauss (Gaussian Plume) cho nguồn điểm liên tục.
// Hệ số phân tán: Briggs (1973), Pasquill–Gifford. Độ nâng luồng khói: Briggs
// (dạng EPA ISC3). Đơn vị SI: m, m/s, K, g/s; nồng độ trả về μg/m³.

export type Stability = "A" | "B" | "C" | "D" | "E" | "F";
export type Terrain = "rural" | "urban";

export const G = 9.81;
/** Khoảng cách tối thiểu tính toán (m) — tránh chia cho 0 sát nguồn. */
export const X_MIN = 10;
/** Vận tốc gió tối thiểu (m/s): dưới mức này giả thiết Gauss không còn đúng. */
export const U_MIN = 1;

export const STABILITY_LABELS: Record<Stability, string> = {
  A: "A — Rất không ổn định",
  B: "B — Không ổn định vừa",
  C: "C — Ít không ổn định",
  D: "D — Trung tính",
  E: "E — Ít ổn định",
  F: "F — Ổn định",
};

/** Hệ số phân tán σy, σz (m) theo Briggs (1973); x tính bằng m. */
export function sigmas(x: number, cls: Stability, terrain: Terrain): { sy: number; sz: number } {
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

/** Thông lượng nổi F (m⁴/s³) = g·vs·d²·(Ts − Ta)/(4·Ts). Nguồn không nóng hơn khí quyển → 0. */
export function buoyancyFlux(vs: number, d: number, Ts: number, Ta: number): number {
  if (Ts <= Ta) return 0;
  return (G * vs * d * d * (Ts - Ta)) / (4 * Ts);
}

export interface PlumeRise {
  /** Độ nâng cuối cùng (m). */
  final: number;
  /** Khoảng cách đạt độ nâng cuối cùng (m). */
  xFinal: number;
  /** Độ nâng tại khoảng cách x (m): luật 2/3 của Briggs, chặn trên bởi độ nâng cuối cùng. */
  at: (x: number) => number;
}

/**
 * Độ nâng luồng khói do lực nổi theo Briggs (dạng EPA ISC3).
 * A–D: F < 55 → Δh = 21,425·F^¾/u; F ≥ 55 → Δh = 38,71·F^⅗/u.
 * E–F: Δh = 2,6·(F/(u·s))^⅓ với s = (g/Ta)·dθ/dz, dθ/dz = 0,02 (E), 0,035 K/m (F).
 * Không tính độ nâng do động lượng và hiệu ứng cuốn xuống (downwash).
 */
export function plumeRise(F: number, u: number, cls: Stability, Ta: number): PlumeRise {
  if (F <= 0) return { final: 0, xFinal: 0, at: () => 0 };
  let final: number;
  let xFinal: number;
  if (cls === "E" || cls === "F") {
    const s = (G / Ta) * (cls === "E" ? 0.02 : 0.035);
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
  return { final, xFinal, at };
}

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
}

export interface PlumeModel {
  input: PlumeInput;
  /** Vận tốc gió dùng tính toán, tại độ cao ống khói (m/s). */
  u: number;
  /** true khi gió nhập vào thấp hơn U_MIN và đã bị nâng lên U_MIN. */
  uClamped: boolean;
  F: number;
  rise: PlumeRise;
  /** Chiều cao hiệu dụng H(x) = hs + Δh(x) (m). */
  H: (x: number) => number;
  /** Nồng độ (μg/m³) tại (x xuôi gió, y ngang gió, z độ cao), m. Trả 0 ngược gió hoặc x < X_MIN. */
  conc: (x: number, y: number, z: number) => number;
}

export function buildModel(input: PlumeInput): PlumeModel {
  const { Q, u10, stability, terrain, hs, d, vs, Ts, Ta, riseMode, windProfile } = input;
  const uRaw = windProfile ? windAtHeight(u10, hs, stability, terrain) : u10;
  const u = Math.max(uRaw, U_MIN);
  const F = buoyancyFlux(vs, d, Ts, Ta);
  const rise = riseMode === "none" ? plumeRise(0, u, stability, Ta) : plumeRise(F, u, stability, Ta);
  const H = (x: number) => hs + (riseMode === "gradual" ? rise.at(x) : rise.final);

  const conc = (x: number, y: number, z: number) => {
    if (x < X_MIN || Q <= 0) return 0;
    const { sy, sz } = sigmas(x, stability, terrain);
    const h = H(x);
    const lateral = Math.exp(-(y * y) / (2 * sy * sy));
    const vertical = Math.exp(-((z - h) ** 2) / (2 * sz * sz)) + Math.exp(-((z + h) ** 2) / (2 * sz * sz));
    return ((Q / (2 * Math.PI * u * sy * sz)) * lateral * vertical) * 1e6;
  };

  return { input, u, uClamped: uRaw < U_MIN, F, rise, H, conc };
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

/** Quét mọi tổ hợp khí tượng hợp lệ, trả về cực đại trên trục gió của từng tổ hợp và tổ hợp bất lợi nhất. */
export function screenWorstCase(src: SourceInput, z = 1.5): { cases: ScreenCase[]; worst: ScreenCase } {
  const cases: ScreenCase[] = [];
  for (const stability of Object.keys(SCREEN_WINDS) as Stability[]) {
    for (const u10 of SCREEN_WINDS[stability]) {
      const m = buildModel({ ...src, Q: 1, u10, stability });
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
      const m = buildModel({ ...src, Q: 1, u10, stability });
      const c = m.conc(x, 0, z);
      if (!best || c > best.cPerQ) best = { stability, u10, x, cPerQ: c, H: m.H(x) };
    }
  }
  return best as ScreenCase;
}

// ─── Quy đổi thông số ống khói ─────────────────────────────────────────────

/** Lưu lượng ở điều kiện tiêu chuẩn (Nm³/h, 0 °C) → lưu lượng thực ở nhiệt độ khí thải (m³/h). Bỏ qua chênh áp suất. */
export const actualFlow = (flowNm3h: number, tC: number) => (flowNm3h * (273.15 + tC)) / 273.15;
/** Lưu lượng thực (m³/h) → điều kiện tiêu chuẩn (Nm³/h). */
export const normalFlow = (flowM3h: number, tC: number) => (flowM3h * 273.15) / (273.15 + tC);
/** Vận tốc khí thoát miệng ống khói (m/s) từ lưu lượng thực (m³/h) và đường kính (m). */
export const exitVelocity = (flowM3h: number, d: number) => flowM3h / 3600 / ((Math.PI * d * d) / 4);

/** Chiều cao ống khói theo thực hành kỹ thuật tốt (GEP, EPA): Hg = Hb + 1,5·L, L = min(chiều cao, bề rộng công trình). */
export const gepHeight = (buildingH: number, buildingW: number) => buildingH + 1.5 * Math.min(buildingH, buildingW);
