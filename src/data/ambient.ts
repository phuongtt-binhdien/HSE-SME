// Quan trắc không khí xung quanh khu vực Long Định – Long Cang (nay: ấp 4, xã Long Cang, tỉnh Tây Ninh) — dùng làm nồng độ nền và đối chiếu mô hình Gauss.
// NGUỒN: bản tổng hợp do người dùng cung cấp (24/11/2026) dẫn lại Báo cáo đề xuất cấp GPMT năm 2024 của Nhà máy và quan trắc định kỳ của Sở NN&MT/TN&MT.
// CHƯA có phiếu kết quả gốc → coi là dữ liệu tham khảo; các điểm không nhất quán được ghi trong AMBIENT_ISSUES.
export type Range = { lo: number | null; hi: number | null; kph?: boolean };
/** Đơn vị μg/m³ (CO, TSP, SO₂, NO₂, NH₃, H₂S). null/kph = không phát hiện (KPH). */
export const AMBIENT_POINTS: { id: string; name: string; where: string; basis: string; vals: Record<string, Range> }[] = [
  { id: "KK1_KK2", name: "KK1 – KK2 (Nhà máy NPK)", where: "KK1 ngoài hàng rào; KK2 trong khu sản xuất, cách văn phòng ≈ 10 m", basis: "Báo cáo đề xuất cấp GPMT 2024; 2 lần/năm",
    vals: { tsp: { lo: 192, hi: 401 }, so2: { lo: null, hi: null, kph: true }, no2: { lo: null, hi: null, kph: true }, co: { lo: 259, hi: 3660 } } },
  { id: "NH3H2S", name: "Xung quanh nhà máy (một số vị trí)", where: "NH₃, H₂S", basis: "Báo cáo đề xuất cấp GPMT 2024",
    vals: { nh3: { lo: 92, hi: 154 }, h2s: { lo: null, hi: 12 } } },
  { id: "CCN", name: "CCN Long Định – Long Cang (quan trắc cấp tỉnh)", where: "6 đợt/năm, 2023–2024; một số vị trí gần khu dân cư/nhà máy phân bón", basis: "Sở TN&MT Long An (cũ) / Tây Ninh",
    vals: { nh3: { lo: 12, hi: 32 } } },
  { id: "SNN_2KM", name: "Sở NN&MT đo, cách nhà máy ≈ 2 km (3 điểm)", where: "Cầu Rạch Chanh; nhà dân phía Đông KCN Thuận Đạo; cầu Long Bình (ghi \"cầu Ông Bình\")", basis: "Số liệu KKXQ do Sở Nông nghiệp và Môi trường đo (chưa có ngày lấy mẫu)",
    vals: { tsp: { lo: 101, hi: 132 } } },
  { id: "TINH", name: "Tỉnh Tây Ninh (gồm Long An cũ), 2018–2025", where: "Số liệu tổng quan toàn tỉnh", basis: "Quan trắc môi trường tỉnh",
    vals: { tsp: { lo: 55, hi: 178 }, so2: { lo: 30, hi: 136 }, no2: { lo: 10, hi: 70 }, co: { lo: 743, hi: 29780 } } },
];
/** Giới hạn trung bình 1 giờ, μg/m³ (QCVN 05:2023/BTNMT; H₂S: QCVN 06:2009/BTNMT) — theo bản tổng hợp, cần đối chiếu bản gốc. */
export const AMBIENT_LIMIT_1H: Record<string, number> = { tsp: 300, so2: 350, no2: 200, co: 30000, nh3: 200, h2s: 42 };
/** Khí thải ống khói đợt 26/3/2024 (mg/Nm³): bụi 12,8–25,5; CO 31–60; NO, NO₂, SO₂ không phát hiện. Tiếng ồn ranh giới 65,3–69,7 dBA. */
export const STACK_2024 = { date: "26/03/2024", tsp: [12.8, 25.5], co: [31, 60], noise: [65.3, 69.7] } as const;

/** Nồng độ nền áp dụng cho mô hình (μg/m³): "low"/"high" = cận dưới/cận trên của nguồn được chọn; KPH tính 0. */
export function backgroundPreset(src: "KK" | "TINH" | "SNN", side: "lo" | "hi") {
  const pick = (id: string, k: string) => { const r = AMBIENT_POINTS.find(p => p.id === id)?.vals[k]; return r ? (r[side] ?? 0) : null; };
  const kk = (k: string) => pick("KK1_KK2", k), t = (k: string) => pick("TINH", k);
  if (src === "SNN") return { tsp: pick("SNN_2KM", "tsp"), so2: null, nox: null, co: null, nh3: null };   // chỉ có bụi TSP
  return src === "KK" ? { tsp: kk("tsp"), so2: kk("so2"), nox: kk("no2"), co: kk("co"), nh3: pick("NH3H2S", "nh3") }
                      : { tsp: t("tsp"), so2: t("so2"), nox: t("no2"), co: t("co"), nh3: pick("CCN", "nh3") };
}
export const AMBIENT_ISSUES = [
  "NH₃ ghi \"92–154 mg/Nm³\" và H₂S \"< 6–12 mg/Nm³\" so với giới hạn 200 và 42 — đơn vị phải là μg/m³ (giới hạn QCVN 05:2023 cho NH₃ là 200 μg/m³; H₂S 42 μg/m³); đã đọc theo μg/m³.",
  "Bụi TSP tại KK1–KK2 đo được 192–401 μg/m³: cận trên 401 vượt giới hạn 1 giờ 300 μg/m³ (QCVN 05:2023) nhưng bản tổng hợp kết luận \"đạt\" — cần xem phiếu gốc (thời gian lấy mẫu 1 giờ hay 24 giờ, giới hạn 24 giờ là 200 μg/m³).",
  "NH₃ xung quanh: 92–154 μg/m³ (báo cáo GPMT 2024) so với 12–32 μg/m³ (quan trắc cấp tỉnh) — chênh khoảng 5–8 lần, khác vị trí/thời điểm; không dùng chung một giá trị nền.",
  "Tọa độ KK1 (X = 1301974; Y = 571654) khác hệ ghi trong GPMT 2986 (VN2000, kinh tuyến trục 105°45', múi 3°: X ≈ 1172xxx; Y ≈ 580xxx) — chưa thể đặt điểm lên mặt bằng 3D.",
  "CO nền tỉnh cận trên 29.780 μg/m³ sát giới hạn 30.000 — đáng ngờ (nhiều khả năng một số đo cục bộ); nên dùng cận dưới/trung vị khi lập nồng độ nền.",
  "Số liệu tỉnh 2018–2025 là khoảng tổng quan toàn tỉnh, không phải điểm đo tại nhà máy.",
] as const;

/** Quan trắc không khí xung quanh do Sở Nông nghiệp và Môi trường đo, cách nhà máy ≈ 2 km (file "Số liệu KKXQ.docx").
 *  Bảng gốc không ghi ngày giờ lấy mẫu, thời gian trung bình và số hiệu phiếu → coi là tham khảo. TSP ghi "μg/Nm³" (đọc là μg/m³ tại điều kiện lấy mẫu).
 *  Hướng và khoảng cách là ƯỚC LƯỢNG theo mô tả của người dùng (mặt tiền nhà máy quay ra đường Trung Trực, phía Đông; cầu Rạch Chanh bên trái = phía Bắc;
 *  cầu Long Bình bên phải = phía Nam; nhà dân phía Đông KCN Thuận Đạo) — cần xác nhận tọa độ điểm đo. */
export const KKXQ_SNN = {
  stations: [
    { id: "RC", name: "Khu vực cầu Rạch Chanh", dir: "Bắc (bên trái mặt tiền)", bearing: 0, tsp: 132, laeq: 75.9, lamax: 89.9, tC: 37.0, rh: 52.8, wind: 0.9, vib: 52 },
    { id: "TD", name: "Nhà dân phía Đông KCN Thuận Đạo", dir: "Đông (ước)", bearing: 90, tsp: 120, laeq: 64.7, lamax: 75.5, tC: 33.0, rh: 65.6, wind: 1.3, vib: 50 },
    { id: "LB", name: "Khu vực cầu Long Bình (bảng ghi: cầu Ông Bình)", dir: "Nam (bên phải mặt tiền)", bearing: 180, tsp: 101, laeq: 63.7, lamax: 82.3, tC: 34.3, rh: 62.4, wind: 1.2, vib: 52 },
  ],
  distanceKm: 2,
  /** QCVN 05:2023/BTNMT TSP trung bình 1 giờ = 300 μg/m³ (24 giờ: 150) — cần đối chiếu thời gian lấy mẫu. */
  limits: { tsp1h: 300, tsp24h: 150, noiseDay: 70, vibration: 70 },
  notes: [
    "Bảng gốc ghi TSP theo \"μg/Nm³\" — hiểu là μg/m³ ở điều kiện lấy mẫu; thời gian trung bình không ghi nên không so được với giới hạn 24 giờ (150 μg/m³): cả ba điểm (101–132) đều thấp hơn 150 và 300.",
    "Tiếng ồn LAeq: cầu Rạch Chanh 75,9 dBA cao hơn 70 dBA (QCVN 26:2010/BTNMT, khu vực thông thường 6–21 giờ) — điểm sát cầu/đường có xe lưu thông, không phải tiếng ồn của nhà máy; hai điểm còn lại 64,7 và 63,7 dBA ≤ 70. LAmax không có giới hạn.",
    "Độ rung 50–52 dB ≤ 70 dB (QCVN 27:2010/BTNMT, 6–21 giờ).",
    "Tốc độ gió đo tại điểm 0,9–1,3 m/s: nhỏ hơn hoặc xấp xỉ 1 m/s — vùng lặng gió; mô hình Gauss dạng chùm (ISC3, SCREEN3) chỉ nên áp dụng với gió ≥ 1 m/s (Giáo trình KSÔNKK mục 1.2.2.3), nên dùng 1 m/s làm cận dưới trong tính toán.",
    "Nhiệt độ 33–37 °C, độ ẩm 52,8–65,6 % tại thời điểm lấy mẫu (ban ngày).",
  ],
} as const;
