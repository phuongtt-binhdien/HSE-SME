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
export const ACTIVITY_2023: YearInput = { coal: 3538.6, biomass: 0, doGen: 2761.5, doVeh: 89288.5, gasoline: 0, kwh: 8310100, efGrid: 0.6766, refrigerantKg: 56.1, mt3: 53, mt5: 98, wwFlow: 120, wwDays: 345, wwBod: 27, people: 700, npkGranulated: 127198, npkBlended: 327518, npkTotal: 0, wwMethod: "flow" };

/** Điểm cần lưu ý khi rà soát báo cáo (không sửa số liệu của báo cáo). */
export const GHG_REVIEW = [
  "Báo cáo ký 29/07/2024 là kiểm kê NĂM 2023; báo cáo ký 22/02/2025 là kiểm kê NĂM 2024. Chưa có kiểm kê năm 2025 — cần số liệu hoạt động năm 2025 (điện, than/sinh khối, DO, xăng, môi chất lạnh, nước thải, sản lượng) và hệ số lưới điện 2025.",
  "Than: hệ số CO₂ 98.300 kg/TJ là của than antraxit (QĐ 2626); nhà máy đang chuyển lò sang đốt sinh khối (lò hơi 6 t/h, lò sấy) nên phát thải Phạm vi 1 các năm sau sẽ giảm mạnh; CO₂ sinh khối là CO₂ sinh học, báo cáo riêng, chỉ tính CH₄ và N₂O.",
  "Phụ lục 2.1: cột “Chuyển đổi (TJ)” theo tháng không khớp lượng than × nhiệt trị (ví dụ tháng 1: 99 tấn × 26,7 = 2,64 TJ), nhưng tổng CO₂ vẫn khớp phép tính theo tổng lượng than 3.538,6 tấn → lỗi trình bày ở cột này.",
  "Phụ lục 2.1: tổng lượng than theo từng tháng cộng lại ≈ 3.541 tấn, Bảng 3.3 ghi 3.538,6 tấn (chênh do làm tròn).",
  "Phụ lục 2.5 (bình cứu hỏa): giá trị rò rỉ của MT3 và MT5 bị đảo (53 bình × 3 kg × 5 % = 7,95 kg; 98 bình × 5 kg × 5 % = 24,5 kg); tổng 0,032 tấn CO₂ vẫn đúng.",
  "Nước thải sinh hoạt tính theo công suất thiết kế 120 m³/ngày × 345 ngày = 41.400 m³; các tài liệu khác ghi lưu lượng thực 25,7–90 m³/ngày — nên dùng lưu lượng đo thực; nguồn nước thải công nghiệp/khí thải lò hơi (HTXLNT) không có trong phạm vi kiểm kê.",
  "Phát thải quá trình sản xuất (NH₃, urê, axit) và Phạm vi 3 không thuộc phạm vi báo cáo; cần xác định lại với danh mục hoạt động của cơ sở theo TT 38/2023/TT-BCT.",
  "Hệ số lưới điện 0,6766 tCO₂/MWh theo công văn 327/BĐKH-PTCBT (dùng cho năm 2023); hệ số mỗi năm do Bộ công bố — cập nhật đúng hệ số của năm kiểm kê 2024, 2025.",
  "Tab Năng Lượng trước đây ước Scope 2 với hệ số 0,4457; đã đổi sang 0,6766 (hệ số năm 2023). Với số liệu 2024, hệ số báo cáo là 0,6592.",
] as const;

// ───────── Báo cáo kiểm kê KNK năm 2024 (ECC Bách Khoa, ký 22/02/2025) — Bảng II.1, III.1–III.9, III.13, Phụ lục II ─────────
export const GHG_REPORT_2024 = { title: "Báo cáo kiểm kê khí nhà kính năm 2024 — Nhà máy Phân bón Bình Điền – Long An", consultant: "Công ty CP Tiết kiệm năng lượng Bách Khoa (ECC Bách Khoa)", signed: "22/02/2025", inventoryYear: 2024,
  basis: ["TT 38/2023/TT-BCT (Phụ lục II)", "QĐ 2626/QĐ-BTNMT (hệ số phát thải)", "TT 01/2022/TT-BTNMT (GWP môi chất lạnh)", "TT 17/2022/TT-BTNMT (nước thải)", "Công văn 1726/BĐKH-PTCBT (hệ số lưới điện 0,6592 tCO₂/MWh)"] } as const;
export const RESULT_2024 = {
  scope1: 11422.63, scope2: 6233.26, total: 17655.89, scope1Pct: 64.6958, scope2Pct: 35.3042,
  rows: [
    { label: "Than cho lò hơi, lò sấy", scope: 1, co2e: 11017.74 }, { label: "DO cho xe nâng, xe tải", scope: 1, co2e: 258.46 }, { label: "Xăng cho xe con", scope: 1, co2e: 137.63 },
    { label: "Môi chất lạnh (R32)", scope: 1, co2e: 6.23 }, { label: "Bình cứu hỏa CO₂", scope: 1, co2e: 0.01 }, { label: "Xử lý nước thải sinh hoạt", scope: 1, co2e: 2.56 }, { label: "Điện mua từ lưới EVN", scope: 2, co2e: 6233.26 },
  ],
  accuracy: { score: 1.65, scope1: 2.36, scope2: 1.73 }, npk: 411773, electricityMWh: 9455.8, coalTonnes: 4179.3, efGrid: 0.6592,
} as const;
export const ACTIVITY_2024: YearInput = { coal: 4179.3, biomass: 0, doGen: 0, doVeh: 96210, gasoline: 59078, kwh: 9455800, efGrid: 0.6592, refrigerantKg: 61.51, mt3: 0, mt5: 90, wwFlow: 0, wwDays: 345, wwBod: 27, people: 600, npkGranulated: 0, npkBlended: 0, npkTotal: 411773, wwMethod: "pop" };
export const GHG_REVIEW_2024 = [
  "Năm 2024 phát thải 17.655,89 tCO₂e, tăng 15,7 % so với 2023 (15.260,14): than tăng 18 % (3.538,6 → 4.179,3 tấn), điện tăng 13,8 % (8.310 → 9.456 MWh); sản lượng NPK giảm 9,4 % (454.716 → 411.773 tấn) nên cường độ tăng từ 33,6 lên 42,9 kg CO₂e/tấn.",
  "Hệ số lưới điện giảm từ 0,6766 (CV 327/BĐKH-PTCBT, năm 2023) xuống 0,6592 tCO₂/MWh (CV 1726/BĐKH-PTCBT, năm 2024): nếu dùng hệ số 2023, phát thải điện 2024 sẽ là 6.397,8 tCO₂e (+164,5).",
  "Phương pháp hai báo cáo khác nhau nên so sánh từng hạng mục cần thận trọng: nước thải sinh hoạt giảm từ 26,29 xuống 2,56 tCO₂e không phải do cải thiện thực tế mà do đổi cách tính (theo 600 người, BOD 13,33 g/người/ngày, hệ số hiệu chỉnh 0,59 × 0,67, MCF 0,03; trước đây theo lưu lượng thiết kế 120 m³/ngày); máy phát DO không còn là hạng mục riêng; thêm xăng cho xe con (59.078 lít).",
  "Hệ số CH₄ của than: báo cáo 2023 dùng 10 kg/TJ (công nghiệp sản xuất), báo cáo 2024 dùng 1 kg/TJ (công nghiệp năng lượng) — chênh khoảng 0,25 % tổng than; GWP CH₄ ghi 27,9 (2023, nước thải 2024) và 27,0 (đốt nhiên liệu 2024); tỷ lệ rò rỉ bình CO₂ 5 % (2023) và 2,5 % (2024: 90 bình MT5 × 5 kg → 0,0113 tCO₂). Nên thống nhất cho các kỳ sau.",
  "Bình cứu hỏa 2024 liệt kê 78 bình bột MFZT8 và 90 bình khí MT5; bình bột không tính phát thải. Số liệu than 2024 (4.179,3 tấn) ghi nhận bằng “bộ đếm thời điểm” (điểm M = 2).",
  "Báo cáo ký 22/02/2025 là kiểm kê NĂM 2024. Chưa có kiểm kê năm 2025: bảng nhập bên dưới đã nạp sẵn hệ số của báo cáo 2024 (than CH₄ 1 kg/TJ, GWP CH₄ 27,0, hệ số lưới 0,6592 — cần thay bằng hệ số Bộ công bố cho năm 2025) và nhiên liệu mới (sinh khối) để tính khi có số liệu.",
] as const;
