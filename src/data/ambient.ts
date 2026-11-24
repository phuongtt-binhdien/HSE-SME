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
  { id: "TINH", name: "Tỉnh Tây Ninh (gồm Long An cũ), 2018–2025", where: "Số liệu tổng quan toàn tỉnh", basis: "Quan trắc môi trường tỉnh",
    vals: { tsp: { lo: 55, hi: 178 }, so2: { lo: 30, hi: 136 }, no2: { lo: 10, hi: 70 }, co: { lo: 743, hi: 29780 } } },
];
/** Giới hạn trung bình 1 giờ, μg/m³ (QCVN 05:2023/BTNMT; H₂S: QCVN 06:2009/BTNMT) — theo bản tổng hợp, cần đối chiếu bản gốc. */
export const AMBIENT_LIMIT_1H: Record<string, number> = { tsp: 300, so2: 350, no2: 200, co: 30000, nh3: 200, h2s: 42 };
/** Khí thải ống khói đợt 26/3/2024 (mg/Nm³): bụi 12,8–25,5; CO 31–60; NO, NO₂, SO₂ không phát hiện. Tiếng ồn ranh giới 65,3–69,7 dBA. */
export const STACK_2024 = { date: "26/03/2024", tsp: [12.8, 25.5], co: [31, 60], noise: [65.3, 69.7] } as const;

/** Nồng độ nền áp dụng cho mô hình (μg/m³): "low"/"high" = cận dưới/cận trên của nguồn được chọn; KPH tính 0. */
export function backgroundPreset(src: "KK" | "TINH", side: "lo" | "hi") {
  const pick = (id: string, k: string) => { const r = AMBIENT_POINTS.find(p => p.id === id)?.vals[k]; return r ? (r[side] ?? 0) : null; };
  const kk = (k: string) => pick("KK1_KK2", k), t = (k: string) => pick("TINH", k);
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
