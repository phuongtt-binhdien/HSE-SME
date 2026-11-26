// Tính kiểm tra thiết bị xử lý khí thải theo Giáo trình "Kiểm soát ô nhiễm không khí" (Nguyễn Đình Tuấn chủ biên, ĐHQG TP.HCM, 2007):
// Chương 1 mục 1.2.2.7 (ống khói), Chương 3 (cyclone PT 3.5–3.12, lọc túi vải PT 3.13–3.15), Chương 4 (hấp thụ, NOG, mục 4.4).
// Đây là kiểm tra sơ bộ theo khoảng khuyến nghị của giáo trình, KHÔNG thay thế thiết kế của nhà cung cấp thiết bị.

/** Khoảng khuyến nghị của giáo trình. */
export const BOOK = {
  stackExitMin: 20,                   // m/s — tốc độ thải tối thiểu tránh hạ khói đầu ống (Chương 1, Hình 1.5)
  stackHeightOverBuilding: [2, 2.5],  // ống khói cao gấp 2–2,5 lần công trình lân cận (Chương 1, mục "Đặc tính chùm khói bất thường")
  cycloneInlet: [10, 25],             // m/s — vận tốc vào cửa cyclone (mục 3.2.4.1)
  cycloneOutlet: [6, 8],              // m/s — vận tốc qua ống thoát
  cycloneBody: [1, 5],                // m/s — vận tốc tối ưu V_tu trong thân (bước 1)
  bagFiltration: [0.5, 1.5],          // m/phút — tải trọng lọc cho phép (mục 3.3.2)
  bagFiltrationCage: 2.5,             // m/phút — túi có khung đỡ bên trong
  bagDiameterMax: 0.6,                // m
  bagLengthOverDiameter: [16, 20],
  bagDp: [1300, 1400],                // N/m² (≈ 133–143 mmH₂O)
  packedGasVelocity: 0.3,             // m/s (≈ 1 ft/s, mục 4.4.7)
  packedDpPerMetre: [20.8, 83.3],     // mmH₂O/m lớp đệm (¼–1 in H₂O / ft)
  actualPlatesFactor: 2,              // số mâm thực ≈ 2 × số mâm lý thuyết (mục 4.4.2)
  lgOverMin: [1.25, 2],               // L/G thực tế = 1,25–2 lần tối thiểu (mục 4.4.6)
} as const;

export type Verdict = "ok" | "warn" | "info";
export const inRange = (v: number, [lo, hi]: readonly [number, number] | readonly number[]) => v >= lo && v <= hi;

/** PT (3.1): vận tốc lắng Stokes, m/s. d (m), ρ hạt (kg/m³), μ động học không khí (N·s/m², 20 °C ≈ 1,81·10⁻⁵). */
export const stokesVelocity = (d: number, rho: number, mu = 1.81e-5, g = 9.81) => (d * d * rho * g) / (18 * mu);

/** PT (3.2): mức độ làm sạch η (%) = (yv − yr)/yv·100. */
export const cleaningEfficiency = (cin: number, cout: number) => (cin > 0 ? ((cin - cout) / cin) * 100 : 0);

// ── Cyclone ──────────────────────────────────────────────────────────────────
/** PT (3.5)–(3.7): Fx = L/V_tu; D = √(Fx/(0,785·n)); V_tt = L/(0,785·n·D²). L (m³/s). */
export function cycloneSizing(Q: number, vOpt: number, n = 1, D?: number) {
  const Fx = Q / vOpt, Dcalc = Math.sqrt(Fx / (0.785 * n)), Dx = D ?? Dcalc;
  const vTt = Q / (0.785 * n * Dx * Dx);
  return { Fx, Dcalc, Dx, vTt, devPct: ((vTt - vOpt) / vOpt) * 100 };
}
/** PT (3.8): ΔP = ξ·ρ·V²/2 (N/m²). */
export const cycloneDp = (xi: number, rho: number, v: number) => (xi * rho * v * v) / 2;
/** PT (3.9)–(3.10): xyclon tổ hợp — số đơn nguyên n = L_k/L_0, L_0 = V_tu·F_0. */
export const multicycloneCount = (Q: number, vOpt: number, F0: number) => Q / (vOpt * F0);

// ── Lọc túi vải ──────────────────────────────────────────────────────────────
/** Tải trọng lọc (m/phút) = Q (m³/h) / 60 / A (m²). */
export const filtrationVelocity = (QM3h: number, area: number) => QM3h / 60 / area;
/** PT (3.13): F = (Q1+Q2)/f + Fc (m²); Q (m³/phút), f (m/phút), Fc: diện tích đơn nguyên đang tái sinh. */
export const bagFilterArea = (Q1: number, Q2: number, f: number, Fc = 0) => (Q1 + Q2) / f + Fc;
/** PT (3.15): số túi N = F/f_túi. */
export const bagCount = (F: number, areaPerBag: number) => Math.ceil(F / areaPerBag);
/** Diện tích lọc của n túi trụ đường kính d, dài L (m²). */
export const bagsArea = (n: number, d: number, L: number) => n * Math.PI * d * L;
/** Đường kính túi suy ra từ tổng diện tích lọc, số túi và chiều dài (m). */
export const bagDiameter = (area: number, n: number, L: number) => area / (n * Math.PI * L);
/** Quy đổi N/m² → mmH₂O. */
export const pa2mmH2O = (pa: number) => pa / 9.80665;

// ── Hấp thụ ─────────────────────────────────────────────────────────────────
/** Hệ đơn giản, dung môi phản ứng (y − yₑ → y): N_og = ln(y1/y2) (= 2,3·log y1/y2, mục 4.4.1). */
export const nog = (y1: number, y2: number) => Math.log(y1 / y2);
/** Phần trăm hấp thụ theo N_og: 1 − e^(−N_og) — khớp bảng trang 99 (0,5 → 39 %; 1 → 63 %; 2 → 86,5 %; 3 → 95 %…). */
export const removalFromNog = (n: number) => 1 - Math.exp(-n);
/** h = H_og · N_og (m). */
export const towerHeight = (hog: number, n: number) => hog * n;
/** Số mâm thực ≈ 2 × số mâm lý thuyết (mục 4.4.2). */
export const actualPlates = (theoretical: number) => Math.ceil(theoretical * BOOK.actualPlatesFactor);
/** Đường kính tháp (m) cho lưu lượng Q (m³/h) với tốc độ khí bề mặt v (m/s). */
export const towerDiameter = (QM3h: number, v = BOOK.packedGasVelocity) => Math.sqrt((4 * QM3h) / 3600 / (Math.PI * v));

// ── Ống khói ─────────────────────────────────────────────────────────────────
export const stackExitVelocity = (QM3h: number, d: number) => QM3h / 3600 / ((Math.PI * d * d) / 4);
/** Đường kính miệng ống để đạt vận tốc thải v (m). */
export const stackDiameterFor = (QM3h: number, v = BOOK.stackExitMin) => Math.sqrt((4 * QM3h) / 3600 / (Math.PI * v));
/** Chiều cao ống khói tối thiểu so với công trình lân cận: 2–2,5 × H_nh. */
export const stackMinHeight = (hBuilding: number) => BOOK.stackHeightOverBuilding.map(k => k * hBuilding) as [number, number];

/** Dữ liệu ống khói: đường kính miệng theo GPMT 2986 hiện hành; Q đo 2026 (m³/h thực tế) và Q thiết kế (GPMT). */
export interface StackRow { id: string; name: string; hs: number; d: number; dProposed?: number; dAsBuilt?: number; qMeasured: number; qDesign: number; tC: number }
export const STACKS: StackRow[] = [
  { id: "G01", name: "Lò hơi 8 t/h", hs: 18, d: 0.7, qMeasured: 19000, qDesign: 25000, tC: 0 },
  { id: "G02", name: "Sấy nóng · TH1", hs: 22, d: 0.6, qMeasured: 50260, qDesign: 55000, tC: 50 },
  { id: "G03", name: "Sấy nguội · TH1", hs: 22, d: 0.6, qMeasured: 50901, qDesign: 55000, tC: 47 },
  { id: "G04", name: "Sấy nóng · TH2 (Nguồn 04)", hs: 22, d: 0.6, dProposed: 1.5, qMeasured: 47965, qDesign: 55000, tC: 57 },
  { id: "G05", name: "Sấy nguội · TH2", hs: 22, d: 0.6, qMeasured: 42725, qDesign: 55000, tC: 57 },
  { id: "G06", name: "Sấy · TH3", hs: 22, d: 2.0, dAsBuilt: 2.2, qMeasured: 79128, qDesign: 140000, tC: 71 },
];

/** Hồ sơ lọc túi Nguồn 04 (BV CN-04-02; hồ sơ điều chỉnh GPMT 10/11/2026): 432 túi, 556 m²; chiều dài 3.360 mm (bản vẽ) hoặc 3.460 mm (chủ cơ sở xác nhận). */
/** Lọc bụi lò sấy 55.000 m³/h theo Bản vẽ hoàn công LB55-00-00 (CME): 576 túi Ø130 × L4.200 (2 × 9 × 32 hàng), khung Ø115 × 3.350, ~742 m² vải lọc, 64 van điện từ, khí nén 6–10 kg/cm². */
export const BAG_LB55 = { n: 576, area: 742, lengths: [4.2, 3.35], design: 55000 };
/** Hồ sơ điều chỉnh GPMT / BV CN-04-02 (Nguồn 04): 432 túi, 556 m² — KHÁC bản vẽ hoàn công LB55. */
export const BAG_G04 = { n: 432, area: 556, lengths: [3.36, 3.46], design: 55000 };
