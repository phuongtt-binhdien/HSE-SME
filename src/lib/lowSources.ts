// Mô hình cho nguồn thấp, nguồn đường, nguồn mặt — theo Giáo trình Kiểm soát ô nhiễm không khí, mục 1.2.3
// (Bảng 1.3 phương pháp Viện NCKH Nhà công nghiệp – Bảo hộ lao động Liên Xô cũ, Nhikitin/Staroverob 1975;
// PT 1.40–1.57). Đơn vị theo giáo trình: M (mg/s), L (m³/s), u (m/s), kích thước (m), C (mg/m³).
import { sigmas, type Stability } from "./gaussPlume.ts";

// ─── Hệ số không thứ nguyên ──────────────────────────────────────────────────

/** Hệ số k theo độ cao tương đối H̄ của nguồn — số hóa biểu đồ Hình 1.6 (sai số đọc đồ thị ≈ ±0,03). */
const K_CURVE: [number, number][] = [
  [0, 1], [0.1, 0.98], [0.2, 0.94], [0.3, 0.85], [0.4, 0.72], [0.5, 0.55],
  [0.6, 0.38], [0.7, 0.22], [0.8, 0.1], [0.9, 0.03], [1, 0],
];
export function kFactor(hBar: number): number {
  if (hBar <= 0) return 1;
  if (hBar >= 1) return 0;
  const i = Math.min(Math.floor(hBar * 10), 9);
  const [x0, y0] = K_CURVE[i], [x1, y1] = K_CURVE[i + 1];
  return y0 + ((y1 - y0) * (hBar - x0)) / (x1 - x0);
}

/** Độ cao tương đối H̄ (Chú thích 1): ngoài vùng gió quẩn trên mái/sau nhà rộng → (h − H_nh)/(H_gh − H_nh);
 *  ngoài vùng gió quẩn chung (nhà hẹp, nhà hẹp đứng đầu gió) → (h − 1,8·H_nh)/(H_gh − 1,8·H_nh). */
export function relHeight(h: number, Hnh: number, Hgh: number, mode: "roof" | "general"): number {
  const base = mode === "general" ? 1.8 * Hnh : Hnh;
  return (h - base) / (Hgh - base);
}

/** S₂ = exp(−30y²/b₂²) — PT (1.42). */
export const S2 = (y: number, b2: number) => Math.exp((-30 * y * y) / (b2 * b2));
/** S₃ = exp(−30y²/(1,4l + x)²) — PT (1.43). */
export const S3 = (y: number, l: number, x: number) => Math.exp((-30 * y * y) / (1.4 * l + x) ** 2);
/** S₁ = exp(−30y²/(1,4l + b + x)²) — PT (1.41). */
export const S1 = (y: number, l: number, b: number, x: number) => Math.exp((-30 * y * y) / (1.4 * l + b + x) ** 2);

// ─── Nguồn thấp cạnh nhà rộng đứng độc lập (Bảng 1.3) ──────────────────────

export interface LowSourceInput {
  /** Tải lượng chất ô nhiễm (mg/s). */
  M: number;
  /** Lưu lượng khí thải (m³/s). */
  L: number;
  /** Chiều cao miệng ống thải (m). */
  h: number;
  /** Chiều cao nhà H_nh (m). */
  Hnh: number;
  /** Chiều cao giới hạn của nguồn thấp H_gh (m). */
  Hgh: number;
  /** Chiều dài nhà, vuông góc hướng gió (m). */
  l: number;
  /** Khoảng cách từ nguồn đến tường khuất gió b₃ (m) — dùng cho điểm trên mái. */
  b2?: number;
  /** Hệ số m (Hình 1.8) — phần khí thải tham gia vùng gió quẩn sau nhà. */
  m: number;
  /** Khoảng cách từ tường khuất gió đến điểm tính (m). */
  x: number;
  /** Khoảng cách ngang trục gió (m). */
  y: number;
  /** Vận tốc gió tính toán (giáo trình: u = 1 m/s). */
  u?: number;
}

export interface LowSourceResult {
  hBar: number;
  k: number;
  /** Nồng độ trên trục gió Cx và tại khoảng cách y: Cy (mg/m³). */
  Cx: number;
  Cy: number;
  /** Công thức đã dùng. */
  eq: string;
  /** Vùng: trong (x ≤ 4H_nh) hay ngoài vùng gió quẩn sau nhà. */
  zone: "cavity" | "far";
}

/**
 * Ống thải ngoài vùng gió quẩn trên mái phía đón gió của nhà rộng đứng độc lập; điểm tính ở sau nhà.
 * H̄ < 0,3: PT (1.21) trong vùng gió quẩn (0 < x ≤ 4H_nh), (1.22) ngoài vùng (x > 4H_nh).
 * H̄ > 0,3: PT (1.24), (1.25).
 * Ghi chú phiên dịch: mẫu số của (1.22), (1.25) in "u.l.(1,4l+x)²" — dùng u·(1,4l+x)² cho đúng thứ nguyên (mg/m³);
 * S₃₁ không định nghĩa trong các trang đã có, lấy bằng S₃; l > 10H_nh và y > 5H_nh thì giới hạn theo Chú thích 2.
 */
export function wideBuildingDownwind(p: LowSourceInput): LowSourceResult {
  const u = p.u ?? 1;
  const hBar = relHeight(p.h, p.Hnh, p.Hgh, "roof");
  const k = kFactor(hBar);
  const lEff = Math.min(p.l, 10 * p.Hnh);
  const yS = p.l > 10 * p.Hnh ? Math.min(Math.abs(p.y), 5 * p.Hnh) : Math.abs(p.y);
  const s3 = S3(yS, lEff, p.x);
  const low = hBar < 0.3;
  if (p.x <= 4 * p.Hnh) {
    const a = 0.8 / (lEff * p.Hnh), c = (low ? 42 : 20) / (1.4 * p.l + p.x) ** 2;
    const f = (1.3 * p.M * p.m * k) / u;
    return { hBar, k, Cx: f * (a + c), Cy: f * (a + c * s3), eq: low ? "(1.21)" : "(1.24)", zone: "cavity" };
  }
  const Cx = low
    ? (55 * p.M * p.m * k) / (u * (1.4 * p.l + p.x) ** 2 + 55 * p.L)
    : (23 * p.M * p.m * k) / (u * (1.4 * p.l + p.x) ** 2 + 26 * p.L);
  return { hBar, k, Cx, Cy: Cx * s3, eq: low ? "(1.22)" : "(1.25)", zone: "far" };
}

/** Ống thải bên trong hoặc trên vùng gió quẩn sau nhà rộng (không có hệ số m): PT (1.26) x ≤ 4H_nh, (1.27) x > 4H_nh. */
export function wideBuildingWake(p: Omit<LowSourceInput, "m">): LowSourceResult {
  const u = p.u ?? 1;
  const hBar = relHeight(p.h, p.Hnh, p.Hgh, "roof");
  const k = p.h <= p.Hnh ? 1 : kFactor(hBar); // miệng ống trong vùng gió quẩn → k = 1
  const lEff = Math.min(p.l, 10 * p.Hnh);
  const yS = p.l > 10 * p.Hnh ? Math.min(Math.abs(p.y), 5 * p.Hnh) : Math.abs(p.y);
  const s3 = S3(yS, lEff, p.x);
  if (p.x <= 4 * p.Hnh) {
    const a = 0.8 / (lEff * p.Hnh), c = 42 / (1.4 * p.l + p.x) ** 2, f = (1.3 * p.M * k) / u;
    return { hBar, k, Cx: f * (a + c), Cy: f * (a + c * s3), eq: "(1.26)", zone: "cavity" };
  }
  const Cx = (55 * p.M * k) / (u * (1.4 * p.l + p.x) ** 2);
  return { hBar, k, Cx, Cy: Cx * s3, eq: "(1.27)", zone: "far" };
}

// ─── Nguồn đường ────────────────────────────────────────────────────────────

/** Hàm sai số erf (Abramowitz–Stegun 7.1.26, sai số < 1,5·10⁻⁷). */
export function erf(z: number): number {
  const s = Math.sign(z), a = Math.abs(z), t = 1 / (1 + 0.3275911 * a);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
}
/** ∫_{p1}^{p2} e^(−p²/2) dp = √(π/2)·[erf(p2/√2) − erf(p1/√2)]. */
const gaussIntegral = (p1: number, p2: number) => Math.sqrt(Math.PI / 2) * (erf(p2 / Math.SQRT2) - erf(p1 / Math.SQRT2));

/**
 * Nguồn đường chiều dài l, gió vuông góc, điểm trên trục qua trung điểm — PT (1.48) với σy, σz Pasquill–Gifford:
 * C = 10³·M/(π·σz·u)·exp(−H²/2σz²)·∫_{p1}^{p2} e^(−p²/2)dp, p = y/σy. M (g/s·m) → C (mg/m³). l = ∞ → PT (1.50).
 * Ngoài trục: y₁ = y − l/2, y₂ = y + l/2 (dịch hệ trục).
 */
export function lineSource(M: number, u: number, H: number, x: number, cls: Stability, l = Infinity, y = 0): { C: number; Bp: number } {
  const { sy, sz } = sigmas(x, cls, "rural");
  const Bp = Number.isFinite(l) ? gaussIntegral((-l / 2 - y) / sy, (l / 2 - y) / sy) / Math.sqrt(2 * Math.PI) : 1;
  const C = ((2e3 * M) / (Math.sqrt(2 * Math.PI) * sz * u)) * Math.exp(-0.5 * (H / sz) ** 2) * Bp;
  return { C, Bp };
}

/** Đường phố hẻm (street canyon), Johnson và cs. 1971 — PT (1.52) phía khuất gió, (1.53) phía đón gió (ppm). N: xe/12 h. */
export const canyonLeeward = (N: number, u: number, x: number, z: number) => (0.07 * N) / ((u + 0.5) * (2 + Math.hypot(x, z)));
export const canyonWindward = (N: number, u: number, W: number) => (0.07 * N) / ((u + 0.5) * W);
/** Quy đổi ppm → mg/m³ ở 25 °C: C = ppm·MW/24,45. */
export const ppmToMgM3 = (ppm: number, MW: number) => (ppm * MW) / 24.45;

// ─── Nguồn mặt ───────────────────────────────────────────────────────────────

/** Bảng 1.5 — hệ số ψ (Gifford–Hanna 1973) theo ½l = 1, 10, 100 km. */
export const PSI_TABLE = {
  "rất không ổn định": [41, 51, 63],
  "không ổn định": [46, 63, 87],
  "trung bình": [73, 115, 182],
  "cấp 5 Pasquill": [121, 215, 380],
  "ổn định": [341, 662, 1301],
} as const;
export type PsiClass = keyof typeof PSI_TABLE;

/** ψ nội suy tuyến tính theo log₁₀(½l), ½l tính bằng km (chặn trong 1–100 km). */
export function psi(cls: PsiClass, halfLkm: number): number {
  const t = Math.min(Math.max(Math.log10(halfLkm), 0), 2);
  const v = PSI_TABLE[cls], i = Math.min(Math.floor(t), 1);
  return v[i] + (v[i + 1] - v[i]) * (t - i);
}

/** Gifford–Hanna — PT (1.55): C = ψ·M/u + C_nền; M (μg/m²·s) → C (μg/m³). */
export const giffordHanna = (M: number, u: number, cls: PsiClass, halfLkm: number, Cbg = 0) => (psi(cls, halfLkm) * M) / u + Cbg;

/** Mô hình hộp cố định — PT (1.57): C = C₀ + 10³·M·l/(u·H); M (g/m²·s), l chiều dài dọc gió (m), H chiều cao xáo trộn (m) → mg/m³. */
export const boxModel = (M: number, l: number, u: number, H: number, C0 = 0) => C0 + (1e3 * M * l) / (u * H);
