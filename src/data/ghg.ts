// Số liệu từ "Báo cáo kiểm kê khí nhà kính — Nhà máy Phân bón Bình Điền – Long An" (CP Tiết kiệm năng lượng Bách Khoa, ký 29/07/2024).
// LƯU Ý: báo cáo ghi "Long An – 2024" nhưng số liệu kiểm kê là NĂM 2023 (Bảng 2.1, 3.9, Hình 3.1).
import type { YearInput } from "../lib/ghg.ts";

export const GHG_REPORT = {
  title: "Báo cáo kiểm kê khí nhà kính — Nhà máy Phân bón Bình Điền – Long An", consultant: "Công ty CP Tiết kiệm năng lượng Bách Khoa (ECC Bách Khoa)", signed: "29/07/2024", inventoryYear: 2023,
  basis: ["Luật BVMT 72/2020/QH14", "QĐ 01/2022/QĐ-TTg (danh mục cơ sở phải kiểm kê)", "NĐ 06/2022/NĐ-CP", "TT 01/2022/TT-BTNMT", "QĐ 2626/QĐ-BTNMT (hệ số phát thải)", "TT 17/2022/TT-BTNMT (chất thải)", "TT 38/2023/TT-BCT (ngành Công Thương)"],
  boundary: "Nhà máy Phân bón Bình Điền – Long An (KCN Long Định); 600 công nhân, 3 ca, 345 ngày/năm; 15,6 ha.",
} as const;

export const MONTHS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
/** Phát thải theo tháng 2023 (tấn CO₂e) — Phụ lục 2.1, 2.2, 2.3, 2.7. */
export const MONTHLY_2023 = {
  coal: [260.599, 882.495, 931.126, 737.263, 775.718, 1105.3, 828.578, 878.795, 731.052, 723.916, 773.604, 723.916],
  doGen: [0.252, 0.708, 0.504, 0.504, 0.72, 0.758, 0.694, 0.758, 0.59, 0.422, 0.73, 0.864],
  doVeh: [8.246, 23.164, 16.493, 16.493, 23.565, 24.819, 22.711, 24.819, 19.321, 13.824, 23.912, 28.288],
  elec: [204.67, 380.45, 553.66, 434.38, 464.55, 570.98, 557.86, 618.48, 453.66, 451.22, 462.12, 470.58],
  kwh: [302500, 562300, 818300, 642000, 686600, 843900, 824500, 914100, 670500, 666900, 683000, 695500],
  npkGranulated: [2660, 10799, 12924, 9728, 10663, 14336, 12764, 14263, 11112, 7854, 9021, 11074],
  npkBlended: [17358, 21368, 11528, 22573, 31198, 26543, 37772, 54560, 25554, 15314, 37514, 26235],
};
/** Kết quả năm 2023 (Bảng 3.7–3.9) — tấn. */
export const RESULT_2023 = {
  scope1: 9637.528, scope2: 5622.614, total: 15260.14, scope1Pct: 63.15, scope2Pct: 36.85,
  rows: [
    { label: "Than cho lò hơi, lò đốt", scope: 1, co2: 9287.314, ch4: 0.945, n2o: 0.142, co2e: 9352.363 },
    { label: "DO cho máy phát", scope: 1, co2: 7.479, ch4: 0.0003, n2o: 0.0001, co2e: 7.504 },
    { label: "DO cho di chuyển", scope: 1, co2: 241.825, ch4: 0.013, n2o: 0.013, co2e: 245.655 },
    { label: "Môi chất lạnh (R32)", scope: 1, co2: 0, ch4: 0, n2o: 0, co2e: 5.68 },
    { label: "Bình cứu hỏa CO₂", scope: 1, co2: 0.014, ch4: 0, n2o: 0, co2e: 0.032 },
    { label: "Xử lý nước thải sinh hoạt", scope: 1, co2: 0, ch4: 0.252, n2o: 0.071, co2e: 26.294 },
    { label: "Điện mua từ lưới EVN", scope: 2, co2: 5622.614, ch4: 0, n2o: 0, co2e: 5622.614 },
  ],
  accuracy: { score: 1.63, grade: "B — Tốt", scope1: 2.38, scope2: 1.73 },
} as const;
export const ACTIVITY_2023: YearInput = { coal: 3538.6, biomass: 0, doGen: 2761.5, doVeh: 89288.5, kwh: 8310100, efGrid: 0.6766, refrigerantKg: 56.1, mt3: 53, mt5: 98, wwFlow: 120, wwDays: 345, wwBod: 27, people: 700, npkGranulated: 127198, npkBlended: 327518 };

/** Điểm cần lưu ý khi rà soát báo cáo (không sửa số liệu của báo cáo). */
export const GHG_REVIEW = [
  "Báo cáo ký năm 2024 nhưng kiểm kê NĂM 2023; chưa có báo cáo kiểm kê năm 2024 và 2025 — cần số liệu hoạt động hai năm này (điện, than/sinh khối, DO, môi chất lạnh, nước thải, sản lượng).",
  "Than: hệ số CO₂ 98.300 kg/TJ là của than antraxit (QĐ 2626); nhà máy đang chuyển lò sang đốt sinh khối (lò hơi 6 t/h, lò sấy) nên phát thải Phạm vi 1 các năm sau sẽ giảm mạnh; CO₂ sinh khối là CO₂ sinh học, báo cáo riêng, chỉ tính CH₄ và N₂O.",
  "Phụ lục 2.1: cột “Chuyển đổi (TJ)” theo tháng không khớp lượng than × nhiệt trị (ví dụ tháng 1: 99 tấn × 26,7 = 2,64 TJ), nhưng tổng CO₂ vẫn khớp phép tính theo tổng lượng than 3.538,6 tấn → lỗi trình bày ở cột này.",
  "Phụ lục 2.1: tổng lượng than theo từng tháng cộng lại ≈ 3.541 tấn, Bảng 3.3 ghi 3.538,6 tấn (chênh do làm tròn).",
  "Phụ lục 2.5 (bình cứu hỏa): giá trị rò rỉ của MT3 và MT5 bị đảo (53 bình × 3 kg × 5 % = 7,95 kg; 98 bình × 5 kg × 5 % = 24,5 kg); tổng 0,032 tấn CO₂ vẫn đúng.",
  "Nước thải sinh hoạt tính theo công suất thiết kế 120 m³/ngày × 345 ngày = 41.400 m³; các tài liệu khác ghi lưu lượng thực 25,7–90 m³/ngày — nên dùng lưu lượng đo thực; nguồn nước thải công nghiệp/khí thải lò hơi (HTXLNT) không có trong phạm vi kiểm kê.",
  "Phát thải quá trình sản xuất (NH₃, urê, axit) và Phạm vi 3 không thuộc phạm vi báo cáo; cần xác định lại với danh mục hoạt động của cơ sở theo TT 38/2023/TT-BCT.",
  "Hệ số lưới điện 0,6766 tCO₂/MWh theo công văn 327/BĐKH-PTCBT (dùng cho năm 2023); hệ số mỗi năm do Bộ công bố — cập nhật đúng hệ số của năm kiểm kê 2024, 2025.",
  "Tab Năng Lượng trước đây ước Scope 2 với hệ số 0,4457; đã đổi sang 0,6766 cho thống nhất với báo cáo.",
] as const;
