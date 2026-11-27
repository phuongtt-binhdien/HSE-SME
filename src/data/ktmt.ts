// Kiểm toán môi trường (KTMT) — dữ liệu từ 5 tài liệu người dùng cung cấp:
//  [A] Đề cương báo cáo của Tập đoàn/Tổng công ty (Kế hoạch 688/KH-ĐGS ngày 23/01/2025 của Đoàn giám sát Quốc hội, NQ 131/2024/QH15)
//  [B] "Kế hoạch dự báo kiểm toán môi trường năm 2025" (Phòng KT-SX, thực hiện dự kiến 01–30/11/2025)
//  [C] Ke_hoach_KTMT2025.docx — kế hoạch thu thập số liệu cân bằng vật chất – năng lượng 2025
//  [D] Giáo trình "Kiểm toán môi trường" (HV Nông nghiệp VN, 2020) — quy trình, kiểm toán chất thải
//  [E] Bài giảng "Kiểm toán môi trường – tổng hợp 4 chương" (mô tả học phần, Võ Đình Long)
// Số liệu [B] nhập nguyên văn; mọi ô "—" là tài liệu không nêu.

export const KTMT_SOURCES = [
  { id: "A", name: "Đề cương báo cáo Tập đoàn/Tổng công ty (KH 688/KH-ĐGS, 23/01/2025)", use: "Khung báo cáo gửi Đoàn giám sát Quốc hội" },
  { id: "B", name: "Kế hoạch dự báo KTMT năm 2025 (Phòng KT-SX)", use: "Số liệu cơ sở 2023–2024, dự báo 2025, cân bằng vật chất, giải pháp" },
  { id: "C", name: "Ke_hoach_KTMT2025.docx", use: "Kế hoạch thu thập số liệu cân bằng vật chất – năng lượng" },
  { id: "D", name: "Giáo trình Kiểm toán môi trường (2020)", use: "Quy trình 3 giai đoạn, kiểm toán chất thải" },
  { id: "E", name: "Kiểm toán MT – tổng hợp 4 chương", use: "Cấu trúc học phần, công cụ – kỹ thuật" },
] as const;

export type StageId = "pre" | "onsite" | "post";
/** Quy trình KTMT theo giáo trình [D] (Hình 3.1, 3.2): 3 khâu, 3 giai đoạn. */
export const STAGES: { id: StageId; name: string; steps: { id: string; label: string; plant: string }[] }[] = [
  { id: "pre", name: "1. Trước kiểm toán (lập kế hoạch)", steps: [
    { id: "pre1", label: "Cam kết của lãnh đạo", plant: "Giấy đề nghị/quyết định của PTGĐ (Võ Văn Phu) cho KTMT — chưa có trong app" },
    { id: "pre2", label: "Xác định quy mô, địa điểm kiểm toán", plant: "Toàn bộ NM Long An: tạo hạt 1–3, trộn hữu cơ, lò hơi, HTXLNT 120 m³/ngày đêm, kho CTNH" },
    { id: "pre3", label: "Lập nhóm kiểm toán (≥ 3 người: kỹ thuật, sản xuất, chuyên gia MT)", plant: "Phòng KT-SX phối hợp Sản xuất, Cơ điện" },
    { id: "pre4", label: "Gửi bảng hỏi trước kiểm toán, thu thập tài liệu", plant: "Danh mục dữ liệu ở mục “Hồ sơ dữ liệu” bên dưới" },
    { id: "pre5", label: "Tổng hợp thông tin, thăm quan trước địa điểm", plant: "Hồ Sơ Nhà Máy, Mô Phỏng 3D, bản vẽ hoàn công" },
    { id: "pre6", label: "Lập bảng hỏi khảo sát, checklist; rà soát kế hoạch & hậu cần", plant: "Checklist tuân thủ theo NĐ 45/2022 (kỹ năng HSE), phụ lục 2 [B]" },
  ] },
  { id: "onsite", name: "2. Kiểm toán tại cơ sở", steps: [
    { id: "on1", label: "Họp mở đầu", plant: "" },
    { id: "on2", label: "Xem xét, kiểm tra tài liệu (GPMT 2986, nhật ký vận hành, chứng từ CTNH)", plant: "Tab Văn Bản · Quy Định; Báo Cáo BVMT" },
    { id: "on3", label: "Thanh tra hiện trường (lò hơi, lọc bụi, HTXLNT, kho CTNH, kho hóa chất)", plant: "" },
    { id: "on4", label: "Phỏng vấn cán bộ, công nhân", plant: "" },
    { id: "on5", label: "Đo đạc, lấy mẫu nước thải, khí thải, chất thải rắn (nếu cần)", plant: "Theo kế hoạch quan trắc định kỳ GPMT" },
    { id: "on6", label: "Tổng hợp bằng chứng kiểm toán; họp kết thúc", plant: "" },
  ] },
  { id: "post", name: "3. Sau kiểm toán & kế hoạch hành động", steps: [
    { id: "po1", label: "Đối chiếu thông tin, cân bằng vật chất – năng lượng", plant: "Mục “Cân bằng vật chất” bên dưới" },
    { id: "po2", label: "Chuẩn bị báo cáo kiểm toán, lấy ý kiến tham khảo", plant: "" },
    { id: "po3", label: "Báo cáo kiểm toán cuối cùng", plant: "" },
    { id: "po4", label: "Lập kế hoạch hành động (giải pháp giảm thiểu, chi phí, thời hạn)", plant: "Mục “Giải pháp” bên dưới" },
    { id: "po5", label: "Thực hiện, theo dõi & hiệu chỉnh, tổng kết kế hoạch hành động", plant: "Hành động khắc phục ISO 14001 mục 10.2" },
  ] },
];

/** Giáo trình [D] §4.3 §4.3.2, Hình 4.4 — 9 bước kiểm toán rác thải sinh hoạt (áp dụng cho CTRSH của NM). */
export const WASTE_AUDIT_STEPS = [
  { n: 1, name: "Xác định sự cam kết của lãnh đạo cấp trên", phase: "Trước kiểm toán" },
  { n: 2, name: "Thiết lập nhóm làm việc", phase: "Trước kiểm toán" },
  { n: 3, name: "Lập kế hoạch kiểm toán (số mẫu, tần suất, phương pháp phân loại, người thực hiện)", phase: "Trước kiểm toán" },
  { n: 4, name: "Họp mở đầu (phát bảng câu hỏi về hệ thống quản lý rác hiện tại)", phase: "Tại hiện trường" },
  { n: 5, name: "Thực hiện kiểm toán: tập kết, phân loại, cân từng nhóm theo điểm thu mẫu", phase: "Tại hiện trường" },
  { n: 6, name: "Phân tích dữ liệu (thu phiếu công tác, tổng hợp)", phase: "Tại hiện trường" },
  { n: 7, name: "Họp lần 2 (thảo luận kết quả, kế hoạch giảm thiểu)", phase: "Tại hiện trường" },
  { n: 8, name: "Viết báo cáo sơ bộ", phase: "Sau kiểm toán" },
  { n: 9, name: "Họp kết thúc", phase: "Sau kiểm toán" },
] as const;

export const PLAN = {
  title: "Kế hoạch dự báo kiểm toán môi trường năm 2025", unit: "Phòng Kỹ thuật Sản xuất", window: "01–30/11/2025",
  address: "CCN Long Định – Long Cang, Ấp 4, Xã Long Định, Huyện Cần Đước, Tỉnh Long An",
  schedule: [["Chuẩn bị dữ liệu", "Tháng 9–10/2025"], ["Kiểm tra thực địa", "01–15/11/2025"], ["Phân tích dữ liệu", "16–25/11/2025"], ["Hoàn thiện báo cáo", "26–30/11/2025"]],
} as const;

export type Key = "prod" | "kwh" | "coal" | "oil" | "water" | "ww" | "co2" | "ctrsh" | "ctrcntt" | "ctnh";
/** [B] §5.1: số liệu 2023–2024 và dự báo 2025 (khoảng min–max; điểm đơn lẻ: min = max). */
export const FORECAST: { key: Key; label: string; unit: string; p2023: number; p2024: number; lo: number; hi: number; note?: string }[] = [
  { key: "prod", label: "Sản lượng", unit: "tấn", p2023: 261967, p2024: 411773, lo: 473540, hi: 494128, note: "2023 = 10 tháng; ước cả năm ~314.360 t; dự báo tăng 15–20 %" },
  { key: "kwh", label: "Điện", unit: "kWh", p2023: 6811767, p2024: 9455800, lo: 11000000, hi: 11000000, note: "dự báo điểm ~11.000.000" },
  { key: "coal", label: "Than", unit: "tấn", p2023: 2971, p2024: 4178.3, lo: 4800, hi: 5000 },
  { key: "oil", label: "Dầu", unit: "lít", p2023: 72490, p2024: 81780, lo: 90000, hi: 90000, note: "~76,5 t" },
  { key: "water", label: "Nước", unit: "m³", p2023: 54523, p2024: 90982, lo: 100000, hi: 110000 },
  { key: "ww", label: "Nước thải", unit: "m³", p2023: 6240, p2024: 18000, lo: 20000, hi: 22000 },
  { key: "co2", label: "Khí thải (CO₂)", unit: "tấn", p2023: 8984.94, p2024: 12591.25, lo: 14500, hi: 15000 },
  { key: "ctrsh", label: "CTRSH", unit: "tấn", p2023: 91.33, p2024: 75.19, lo: 70, hi: 80 },
  { key: "ctrcntt", label: "CTRCNTT", unit: "tấn", p2023: 122.42 + 360.81, p2024: 7346.43, lo: 7500, hi: 8000, note: "2023 = 122,42 + 360,81 (xỉ than)" },
  { key: "ctnh", label: "CTNH", unit: "tấn", p2023: 1.89, p2024: 0.84, lo: 0.8, hi: 1.0 },
];
/** Dung sai áp cho dự báo điểm (lo = hi) khi đánh giá "trong khoảng": giả định của app, không có trong [B]. */
export const POINT_TOLERANCE = 0.1;

/** [B] §5.2: cân bằng vật chất ước tính với sản lượng 485.000 tấn. */
export const BALANCE = {
  productT: 485000,
  inputs: [
    { label: "Nguyên liệu (hao hụt 1 %)", t: 489850 },
    { label: "Nước", t: 106700 },
    { label: "Than", t: 4850 },
    { label: "Dầu", t: 76.5 },
    { label: "Không khí (đốt cháy)", t: 49265 },
  ],
  statedInputTotal: 650691.5,
  outputs: [
    { label: "Sản phẩm", t: 485000 },
    { label: "Nước thải", t: 21000 },
    { label: "Khí thải", t: 5400000 },
    { label: "CTR (CTRSH 75 + CTRCNTT 7.800 + CTNH 0,9)", t: 7900 },
  ],
  statedOutputTotal: 5913900,
  solid: { ctrsh: 75, ctrcntt: 7800, ctnh: 0.9 },
  co2: { coalT: 4850, coalCO2: 14404.5, oilT: 76.5, oilCO2: 199.97, statedTotal: 14700 },
} as const;

/** [B] §6: giải pháp giảm thiểu dự kiến. */
export const SOLUTIONS = [
  { id: "s1", target: "Nước thải", action: "Tuần hoàn nước xử lý khí thải", effect: "Giảm 6.000 m³/năm", co2e: 31.6, costM: 60, qty: 6000, qtyUnit: "m³" },
  { id: "s2", target: "Khí thải", action: "Cải tiến lò hơi, giảm 250 tấn than", effect: "Giảm 250 tấn than/năm", co2e: 742.5, costM: 120, qty: 250, qtyUnit: "tấn than" },
  { id: "s3", target: "CTRSH", action: "Phân loại tại nguồn, tái chế", effect: "Giảm 20 tấn/năm", co2e: 6.5, costM: 15, qty: 20, qtyUnit: "tấn" },
  { id: "s4", target: "CTRCNTT", action: "Tăng tái sử dụng bao bì", effect: "Giảm 400 tấn/năm", co2e: 10, costM: 20, qty: 400, qtyUnit: "tấn" },
  { id: "s5", target: "KNK", action: "Lắp hệ thống đo khí nhà kính", effect: "Kiểm soát phát thải", co2e: 0, costM: 50, qty: 0, qtyUnit: "" },
] as const;
export const SOLUTIONS_STATED = { costM: 265, co2e: 790 };

/** Đối chiếu số liệu 2023–2025 giữa kế hoạch [B] và các hồ sơ đã có trong app (BC BVMT 2024/2025, Kiểm kê KNK 2023–2024). Nguồn khác gán ở lib. */
export const KNK = {
  y2023: { coalT: 3538.6, kWh: 8310100, coalCO2t: 9287.314, scope1: 9637.528, scope2: 5622.614, total: 15260.14 },
  y2024: { coalT: 4179.3, kWh: 9455800 },
} as const;

/** Danh mục dữ liệu cần chuẩn bị [B] — phân công theo phòng ban. */
export const DATA_CHECKLIST = [
  { group: "Sản xuất & năng lượng", owner: "Phòng Sản xuất / Kỹ thuật", items: ["Sản lượng NPK, phân hữu cơ 01/01–31/10", "Điện (kWh) — hóa đơn / báo cáo", "Than (tấn) — nhật ký lò hơi, lò sấy", "Dầu (lít) — kho nhiên liệu", "Nước (m³) — đồng hồ", "Nguyên liệu DAP, Urea, KCl, SA…"] },
  { group: "Chất thải", owner: "Phòng KT-SX (Môi trường)", items: ["Lưu lượng nước thải m³/ngày — nhật ký HTXLNT", "Kết quả quan trắc nước thải, khí thải (4 đợt 3/6/9/12)", "Số liệu CEMS (nếu có)", "CTRSH kg/tháng + hợp đồng thu gom", "CTRCNTT, xỉ than + hợp đồng, báo cáo tái sử dụng", "CTNH kg + chứng từ chuyển giao"] },
  { group: "Hồ sơ pháp lý", owner: "Phòng KT-SX (Môi trường)", items: ["GPMT 2986/GPMT-STNMT — kiểm tra hiệu lực", "Kế hoạch ứng phó sự cố, biên bản diễn tập", "Báo cáo kiểm kê KNK", "ISO 14001:2015 — đánh giá nội bộ, nhật ký công trình xử lý"] },
  { group: "Bổ sung", owner: "Kỹ thuật / Kế toán", items: ["Hóa chất xử lý NaOH, PAC, polymer (kg/tháng)", "Bảo trì, nâng cấp lò hơi, lò sấy, chiếu sáng", "Chi phí thực hiện giải pháp giảm thiểu từ 2024"] },
] as const;

/** [A] Đề cương 688/KH-ĐGS ↔ dữ liệu có trong app. status: ok = đã có số liệu; part = có một phần; gap = chưa có. */
export const OUTLINE_688 = [
  { part: "Phần I", item: "Văn bản QPPL, chiến lược, quy hoạch BVMT ảnh hưởng tới doanh nghiệp; tính kịp thời, khả thi; khó khăn – nguyên nhân", status: "part", source: "Tab Văn Bản · Quy Định (30 văn bản pháp luật)", gap: "Cần ý kiến vướng mắc thực tế (GPMT điều chỉnh, EPR, KNK, quy chuẩn mới)" },
  { part: "II.I.1.1", item: "Đầu tư kinh phí BVMT, giảm phát thải KNK 2022–2024 so với 2016–2021; chi thường xuyên hằng năm", status: "gap", source: "—", gap: "Cần Kế toán: vốn đầu tư HTXLNT, lọc bụi, CEMS; phí BVMT, quan trắc, thu gom CTR; dữ liệu 2016–2021" },
  { part: "II.I.1.2", item: "Tổ chức bộ máy, nhân lực BVMT", status: "gap", source: "—", gap: "Sơ đồ tổ chức, số cán bộ chuyên trách/kiêm nhiệm (HĐ ATVSLĐ, Phòng KT-SX)" },
  { part: "II.I.2", item: "Kiểm soát ô nhiễm: đầu tư hạ tầng kỹ thuật, ứng phó sự cố, chấp hành pháp luật", status: "ok", source: "Hồ Sơ Nhà Máy; DCS Khí/Nước thải; Báo Cáo BVMT 2024–2025", gap: "Biên bản diễn tập ứng phó sự cố và kế hoạch cập nhật" },
  { part: "II.I.3", item: "Quản lý chất thải rắn công nghiệp thông thường, CTNH, CTRSH; tồn tại, hạn chế", status: "ok", source: "Báo Cáo BVMT 2024–2025 (CTRSH, CTRCNTT, CTNH 2023–2025); Chất Thải", gap: "Mâu thuẫn dầu nhớt thải (CTNH vs “làm nhiên liệu”) cần xử lý trước khi nộp" },
  { part: "II.I.4", item: "Kết quả thanh tra, kiểm tra, kiểm toán và việc khắc phục", status: "part", source: "Kết luận 2721/KL-STNMT (28/08/2023); QĐ 162/QĐ-XPVPHC (30/12/2019)", gap: "Báo cáo 2025 ghi “chưa có cơ quan kiểm tra đến 31/12/…” — thống nhất với 2 văn bản trên" },
  { part: "II.I.5", item: "Cam kết giảm phát thải KNK: kiểm kê, giảm nhẹ, tín chỉ các-bon", status: "part", source: "Kiểm Kê Khí Nhà Kính (năm 2023: 15.260 tCO₂e; 2024)", gap: "Chưa có dự án tín chỉ các-bon; cần số liệu giảm nhẹ thực tế" },
  { part: "II.II", item: "Tồn tại, hạn chế; nguyên nhân khách quan – chủ quan; trách nhiệm", status: "part", source: "Mục “Mâu thuẫn số liệu”; Đối chiếu BC BVMT", gap: "Nhận định nguyên nhân do lãnh đạo thống nhất" },
  { part: "II.III", item: "Đánh giá chung triển khai Luật BVMT 2020", status: "gap", source: "—", gap: "Soạn sau khi hoàn thiện các mục trên" },
  { part: "Phần III", item: "Kiến nghị, giải pháp (hoàn thiện pháp luật, tổ chức thực hiện, thị trường các-bon)", status: "part", source: "Mục “Giải pháp giảm thiểu”", gap: "Kiến nghị chính sách do lãnh đạo quyết" },
  { part: "Phụ lục", item: "Bảng biểu, số liệu, sơ đồ, biểu đồ minh chứng", status: "ok", source: "Các tab BVMT, KNK, Sản xuất, GPMT", gap: "—" },
] as const;

/** Điểm tài liệu nguồn cần cập nhật / thận trọng (so với pháp luật hiện hành tại ngày soạn 11/2026). */
export const LEGAL_NOTES = [
  "[B] ghi “kiểm kê KNK bắt buộc từ 2025 theo NĐ 06/2022 — nộp trước 31/3/2025”. NM đã có báo cáo kiểm kê năm 2023 (ECC Bách Khoa, ký 29/07/2024) và số liệu 2024; kỳ tiếp theo theo NĐ 119/2025 và QĐ 42/2026: nộp trước 31/3/2027 — cần đối chiếu lại điều khoản trước khi trích.",
  "[B] ghi địa chỉ “Huyện Cần Đước, Tỉnh Long An” — đơn vị hành chính hiện hành: xã Long Cang, tỉnh Tây Ninh; cơ quan cấp GPMT nay là Sở Nông nghiệp và Môi trường Tây Ninh.",
  "[B] viện dẫn “Khoản 7 Điều 124 Luật BVMT 2020” cho diễn tập ứng phó sự cố — điều khoản chưa được kiểm chứng trong app; kiểm tra lại văn bản trước khi trích dẫn.",
  "[C] nêu QCVN 14:2008/BTNMT hoặc QCVN 40:2011/BTNMT cho nước thải; quy chuẩn áp dụng của NM theo GPMT 2986 là QCVN 40:2011/BTNMT cột A (Kq 1,2; Kf 1,1).",
  "[C] soạn “báo cáo kiểm toán năng lượng năm 2025”: KTNL gần nhất do ECC Bách Khoa thực hiện 06–08/2024; chu kỳ 3 năm → kỳ tới 2027 (cơ sở sử dụng năng lượng trọng điểm). Số liệu cân bằng vật chất 2025 dùng được cho cả hai.",
  "KTMT là hoạt động khuyến khích, không bắt buộc (Điều 74 Luật BVMT 2020); Tập đoàn yêu cầu theo công văn nội bộ — văn bản nộp lên cần ghi rõ tính chất tự nguyện.",
  "[F] Phụ lục 2 (19/07/2024) còn dẫn TT 36/2015/TT-BTNMT (giấy phép xử lý CTNH), NĐ 38/2015/NĐ-CP (giấy phép xả khí thải), “QCVN 40:2021/BTNMT” (đúng là QCVN 40:2011/BTNMT) và Luật Tài nguyên nước 2012 — cần thay bằng văn bản hiện hành (TT 02/2022/TT-BTNMT, Luật Tài nguyên nước 2023) khi lập kỳ kiểm toán mới.",
  "[G] ghi giới hạn BOD₅ 24 mg/L; QCVN 40:2011 cột A (30 mg/L) × Kq 1,2 × Kf 1,1 = 39,6 mg/L. Các giới hạn COD 99, TSS 66, TN 26,4, TP 5,28 đúng công thức này; riêng BOD₅ cần kiểm tra lại.",
  "Thời gian thực hiện dự kiến của [B] (01–30/11/2025) đã qua; báo cáo công tác BVMT năm 2025 (12/01/2026) đã có số liệu thực tế để đối chiếu với dự báo.",
] as const;

/** Trọng tâm giáo trình [D] dùng cho NM: nguồn thải chính cần cân bằng. */
export const WASTE_SOURCES = [
  { src: "Lò hơi 8 t/h, lò sấy", waste: "Khí thải (bụi, SO₂, NOx, CO), xỉ than", control: "Lọc bụi túi vải, cyclone, tháp hấp thụ tại ống khói lò hơi (GPMT 2986)" },
  { src: "Tạo hạt 1–3, trộn hữu cơ", waste: "Bụi NPK, NH₃", control: "Lọc bụi, tháp hấp thụ theo từng nguồn khí thải của GPMT 2986" },
  { src: "Đóng bao, kho", waste: "Bao bì thải, thành phẩm rơi vãi (dùng lại)", control: "Thu hồi, tái sử dụng làm nguyên liệu / bao bì" },
  { src: "HTXLNT 120 m³/ngày đêm", waste: "Nước thải sinh hoạt + nước rửa; bùn", control: "Anoxic – MBBR – Aerotank; xả sông Vàm Cỏ Đông (QCVN 40 cột A)" },
  { src: "Cơ điện, bảo trì", waste: "Dầu nhớt thải, giẻ lau dính dầu, bóng đèn (CTNH)", control: "Kho CTNH 75 m²; chuyển giao Cao Gia Quý" },
  { src: "Văn phòng, nhà ăn", waste: "CTRSH (45 thùng phân loại)", control: "Thu gom theo hợp đồng" },
] as const;

// ======================================================================
// Bổ sung 4 tài liệu KTMT đã lập (người dùng gửi 27/11/2026)
//  [F] Phụ lục 2 (19/07/2024) — danh sách kiểm tra tuân thủ theo Luật BVMT 2020 (mẫu Tập đoàn)
//  [G] Phụ lục 1 (22/07/2024) — số liệu đầu vào/ra năm 2023, kiểm kê KNK phạm vi 1–2, cân bằng vật chất HTXLNT 120 m³/ngày đêm
//  [H] Báo cáo KTMT lập 30/10/2024, ký PTGĐ Võ Văn Phu, số liệu năm 2023 (tên file "Baocao_KTMT_2023", tiêu đề "KTMT năm 2024"), kèm [F], [G]
//  [I] Báo cáo KTMT năm 2024 (nội bộ, thực hiện 01–30/11/2024; Phòng KT-SX)
// ======================================================================
export const SUBMITTED = [
  { id: "F", name: "Phụ lục 2 — Danh sách kiểm tra tuân thủ (Luật BVMT 2020)", date: "19/07/2024", note: "Mẫu Tập đoàn, đã đánh dấu; nhiều dòng dẫn văn bản hết hiệu lực" },
  { id: "G", name: "Phụ lục 1 — Số liệu đầu vào/ra năm 2023, KNK, cân bằng HTXLNT", date: "22/07/2024", note: "Điện, than, nước, hóa chất, KNK phạm vi 1–2, chất lượng nước thải trước xử lý" },
  { id: "H", name: "Báo cáo KTMT gửi Tập đoàn (số liệu 2023)", date: "30/10/2024", note: "Ký PTGĐ Võ Văn Phu; số văn bản để trống; 28 mục hồ sơ môi trường; thanh tra 2023" },
  { id: "I", name: "Báo cáo KTMT năm 2024 (nội bộ)", date: "11/2024", note: "Nhóm: Võ Anh Tuấn, Trình Thiên Phương, Nguyễn Hữu Thông; cân bằng vật chất 2024; 7 chương" },
  { id: "J", name: "Báo cáo KTMT năm 2023 (BFC_KiemtoanMoiTruong_1122023)", date: "11/2023", note: "Số liệu 01–10/2023; nguồn của các số “2023” trong kế hoạch dự báo [B]; 5 chương; 23 giải pháp" },
  { id: "K", name: "Báo cáo KTMT năm 2025 (BCKTMT_BinhDien_LongAn_2025)", date: "2026", note: "Bìa ghi “NĂM 2026”, nội dung 2025 (thực hiện 01–30/11/2025); có kiểm kê KNK 2025 = 18.978,29 tCO₂e" },
  { id: "L", name: "Giáo trình KTMT — Võ Đình Long (10 chương)", date: "—", note: "Quy trình, công cụ – kỹ thuật, kiểm toán CTR–CTNH, không khí, nước, carbon, cấu trúc báo cáo" },
] as const;

/** [G] Bảng 01–06: số liệu 2023 theo quy trình (A = tạo hạt, B = trộn). */
export const PL1_2023 = {
  kWhA: 6674212, kWhB: 1668553, coalT: 3563, waterM3: 86748,
  materialsA: 120000, materialsB: 240000, productA: 120000, productB: 240000,
  wastewaterM3: 14400,
  chemicals: [["PAC", 1717.8], ["Polymer", 121.2], ["NaOH", 2134.8], ["Clorine", 192.6], ["Đường", 1385.3], ["Vi sinh", 158.4], ["Zeolit", 1695]] as [string, number][],
  chemUnitNote: "Phụ lục không ghi đơn vị (giả định kg/năm — cần xác nhận)",
  // Chất lượng nước thải trước xử lý, 4 đợt (mg/L)
  influent: { dot: ["Đợt 1", "Đợt 2", "Đợt 3", "Đợt 4"], COD: [64, 84, 84, 134], BOD: [23, 37, 7, 39], TSS: [135, 31, 59, 242], TN: [68, 350, 67.2, 537.6], TP: [23.4, 153.26, 16.25, 130.75], NH4: [37, 327, 65.7, 480.5] },
  // Mô hình hiệu suất từng bể (đợt 1) và giới hạn QCVN 40 cột A theo [G]
  modelOut: { TN: 20, TP: 2.9, COD: 5, BOD: 1, TSS: 8 }, modelIn: { TN: 68, TP: 23.4, COD: 64, BOD: 23, TSS: 135 },
  limitsA: { COD: 99, BOD: 24, TSS: 66, TN: 26.4, TP: 5.28 },
  // Bảng 11: cân bằng nguyên tố N + P (kg)
  elementBal: { totalIn: 1315, nIn: 979, pIn: 336, out: [255, 67, 993], outLabels: ["Chất ô nhiễm (ô gốc không rõ nhãn)", "Sau xử lý", "Có trong khí thải / bay hơi"] },
  // Kiểm kê KNK phạm vi 1 trong [G] (bản nháp 07/2024)
  ghgDraft: [["Than", 9352.3627], ["DO xe nâng", 239.8746], ["DO máy phát", 7.3275], ["Môi chất lạnh", 23.7801], ["Bình cứu hỏa", 0.6328], ["Nước thải sinh hoạt", 26.2942]] as [string, number][],
  ghgDraftTotalStated: 9650.2719, scope2: 5622.61,
} as const;

/** [I] Báo cáo KTMT 2024: hiện trạng, cân bằng vật chất, giải pháp. */
export const AUDIT2024 = {
  production: 411773, coalT: 4178.3, oilL: 81780, oilT: 69.51, gasM3: 6, waterM3: 90982, kWh: 9455800,
  sec: { kWhPerT: 22.96, coalKgPerT: 10.14, oilLPerT: 0.17, waterM3PerT: 0.22 },
  balanceIn: [["Nguyên liệu (ước tính, hao hụt 1 %)", 415000], ["Nước", 90982], ["Than", 4178.3], ["Dầu", 69.51], ["Không khí đốt cháy", 43000]] as [string, number][],
  balanceInStated: 553229.81,
  airParts: { coal: 41783, oil: 834 },
  balanceOut: [["Sản phẩm", 411773], ["Nước thải", 18000], ["Khí thải (lò hơi 259.200 + lò sấy 4.406.400)", 4665600], ["CTR (CTRSH 75,19 + CTRCNTT 7.346,43 + CTNH 0,84)", 7422.46]] as [string, number][],
  balanceOutStated: 5102795.46, gapStated: 4549565.65,
  flueParts: { boiler: 259200, dryer: 4406400 },
  designFlowM3h: 360000, hoursImplied: 8640, densityImplied: 1.5,
  co2: { coal: 12409.55, oil: 181.70, total: 12591.25 },
  efficiencyStated: 99.2, fluePctStated: 91.5,
  ctrsh: { tpd: 0.26, days: 289, stated: 75.19 }, ctnh: { kgPerMonth: 71.5, stated: 0.84 },
  ctrcntt: { reuse: 5294, transfer: 2052.43, stated: 7346.43, reusePctStated: 72 },
  solutions: [
    { target: "Nước thải", action: "Tuần hoàn nước xử lý khí thải", effect: "Giảm 5.000 m³/năm", co2e: 26, costM: 50 },
    { target: "Khí thải", action: "Tối ưu hóa lò hơi", effect: "Giảm 200 tấn than/năm", co2e: 594, costM: 100 },
    { target: "CTRSH", action: "Phân loại tại nguồn", effect: "Giảm 15 tấn/năm", co2e: 5, costM: 10 },
  ],
  wasteSolutions: [
    { target: "CTRSH", action: "Phân loại tại nguồn, tái chế", effect: "Giảm 20 % (15 tấn/năm)", costM: 10 },
    { target: "CTRCNTT", action: "Tăng tái sử dụng bao bì", effect: "Giảm 5 % (367 tấn/năm)", costM: 15 },
    { target: "CTNH", action: "Giảm sử dụng bóng đèn huỳnh quang", effect: "Giảm 10 % (0,08 tấn/năm)", costM: 5 },
  ],
  recommendCostStated: 170, recommendCo2eStated: 625,
  findings: ["Chưa tổ chức diễn tập ứng phó sự cố (Khoản 7 Điều 124 Luật BVMT 2020)", "Chưa kiểm kê khí nhà kính “không bắt buộc trong 2024”", "CTRSH chưa phân loại tại nguồn"],
  permitExpiryStated: "28/4/2030",
} as const;

/** Cùng một nội dung nhưng 4 tài liệu ghi khác nhau. Dòng cuối của mỗi hàng = nhận định của app. */
export const INCONSISTENCIES = [
  { topic: "Kiểm kê khí nhà kính", f: "“x” (tuân thủ) — ghi chú “Năm 2023”", h: "Mục 20: đánh dấu cột “Chưa thực hiện” nhưng bằng chứng ghi “Đã thực hiện”", i: "“Chưa thực hiện trong 2024 — không bắt buộc”; kiến nghị kiểm kê trước 31/12/2025", note: "NM đã có báo cáo kiểm kê năm 2023 (ECC Bách Khoa, ký 29/07/2024). Cần thống nhất: đã kiểm kê 2023; kỳ sau theo NĐ 119/2025, QĐ 42/2026.", sev: "red" },
  { topic: "Quan trắc nước thải định kỳ", f: "“x” — đã thực hiện", h: "Mục 23: thực hiện theo tần suất, thông số, vị trí trong GPMT", i: "Bằng chứng: “Không bắt buộc quan trắc định kỳ”, đánh dấu tuân thủ", note: "Báo cáo BVMT 2024/2025 có 4 đợt nhưng chỉ 6 thông số (COD, TSS, Pb, Cd, Hg, As). Nếu GPMT có quy định thì không thể ghi “không bắt buộc”.", sev: "red" },
  { topic: "Phí BVMT đối với nước thải", f: "“Không yêu cầu”", h: "Mục 19: “Kê khai và nộp phí nước thải Quý 1, 2” — thực hiện", i: "—", note: "Trái nhau: một bản ghi không yêu cầu, một bản ghi đã kê khai và nộp. Đối chiếu tab Phí BVMT.", sev: "amber" },
  { topic: "Quan trắc khí thải tự động (CEMS)", f: "“x” (đáp ứng yêu cầu kỹ thuật, truyền dữ liệu)", h: "Mục 18: 1 hệ tạo hạt 140.000 m³/h — “Không yêu cầu bắt buộc”", i: "“Không bắt buộc, chỉ lắp đặt để theo dõi nội bộ”", note: "Nhất quán là CEMS lắp tự nguyện; riêng PL2 tick “đáp ứng quy định về truyền dữ liệu” như thể bắt buộc — nên sửa thành “Không áp dụng”.", sev: "amber" },
  { topic: "Diễn tập ứng phó sự cố", f: "“Chưa tổ chức”", h: "Mục 25–27 (chất thải, hóa chất, tràn dầu): chưa thực hiện; mục 13: chưa có biện pháp ứng phó tràn dầu", i: "Chưa tổ chức; kiến nghị Quý 1/2025", note: "Nhất quán qua 3 bản; chưa có bằng chứng đã khắc phục. Hồ sơ ứng phó tràn dầu: báo giá BG TV.MT2411.23 (23/11/2024) đã hết hiệu lực, mới có 1 báo giá.", sev: "red" },
  { topic: "Hiệu lực giấy phép môi trường 2986/GPMT-STNMT", f: "“Còn hiệu lực”", h: "Số 2986 ngày 28/04/2023", i: "“Có hiệu lực đến 28/4/2030”", note: "Hồ sơ nội bộ (tab Văn bản) ghi thời hạn 10 năm, đến 27/04/2033. Sửa lại thời hạn trong báo cáo nếu dùng làm hồ sơ nộp.", sev: "red" },
  { topic: "Sản lượng, nguyên liệu 2023", f: "—", h: "[G] Bảng 03, 06: tạo hạt 120.000 + trộn 240.000 = 360.000 t (nguyên liệu = sản phẩm)", i: "[I] 333.675 t (2023) → 411.773 t (2024)", note: "360.000 t lệch +7,9 % so với 333.675 t trong Báo cáo BVMT 2024; số tròn, nguyên liệu bằng đúng sản phẩm (không hao hụt) — giống số công suất, không phải số thực.", sev: "amber" },
  { topic: "Nước thải 2023", f: "—", h: "[G]: 14.400 m³ (= 120 m³/ngày × 120 ngày)", i: "[I]: 18.000 m³ (2024); Báo cáo BVMT: 18.000 m³ cả 3 năm; kế hoạch 2025: 6.240 m³ (2023)", note: "Ba con số khác nhau cho nước thải 2023 (14.400 / 18.000 / 6.240). Chưa có đồng hồ/nhật ký lưu lượng làm gốc.", sev: "amber" },
  { topic: "Khí thải 2024 (khối lượng)", f: "—", h: "—", i: "[I]: 4.665.600 t = 360.000 m³/h × 8.640 h × 1,5 kg/m³ (suy ra)", note: "Báo cáo BVMT 2024/2025 ghi 1.628.000.000 m³ cùng lưu lượng 360.000 m³/h (≈ 4.522 giờ). Hai báo cáo dùng số giờ khác nhau cho cùng lưu lượng; mật độ 1,5 kg/m³ cao hơn không khí nóng.", sev: "amber" },
] as const;

// ======================================================================
//  [J] Báo cáo KTMT 2023 (11/2023, số liệu 01–10/2023) và [K] Báo cáo KTMT 2025
// ======================================================================
export const REPORT_2023 = {
  months: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10"],
  kWh: [515200, 416500, 719100, 708300, 645071, 832000, 734200, 936400, 687596, 627300],
  product: [16478, 23133, 18266, 23448, 29204, 28909, 31929, 52324, 23997, 14279],
  kWhStatedTotal: 6811767, productStatedTotal: 261967, sthStatedAvg: 28.13, sthStatedSum: 283.13,
  coalDryerT: [78.6, 278.1, 281.4, 230.4, 239.7, 346.8, 255.9, 276, 232, 233],
  coalBoilerT: [15.7, 52.9, 69.9, 49.9, 49.75, 68.4, 60.6, 56, 47, 41.7],
  coalDryerStatedTotal: 741, coalBoilerStatedTotal: 511.85, coalStatedTotal: 2971,
  granulated: [4476, 14425, 16777, 12153, 12951, 18733, 14388, 19677, 16099, 13043], granulatedStated: 142722,
  waterM3: [5406, 4473, 4433, 3970, 4292, 5196, 7325, 7001, 7627, 4800], waterStated: 54523, waterUnitInReport: "lít",
  toeTable: { dien: { qty: 6811767, toe: 1051 }, do: { qty: 72490, toe: 2080 }, than: { qty: 2971, toe: 64 }, total: 3195 },
  chemicalsKg: [["PAC", 1636], ["Polymer", 101], ["NaOH", 1779], ["Clorine", 160.6], ["Đường", 1154.5], ["Vi sinh", 130.8], ["Zeolit", 1413]] as [string, number][],
  flowM3: 6240, designChemPerM3: 0.2,
  costs: { kWh: { vnd1000: 12995000 }, do: { vnd1000: 1284776 }, coal: { vnd1000: 24000000 } },
  // Giải pháp: kgCO₂/năm và chi phí (nghìn đồng) theo bảng gốc
  solutions: [
    { n: 1, what: "Lắp đồng hồ bơm nhớt cho xe nâng", effect: "Giảm 364 lít dầu/năm", kgCo2: 900, costK: 8500 },
    { n: 2, what: "Sửa các van rò rỉ (cấp nước, nhà vệ sinh)", effect: "Giảm 500 m³/tháng", kgCo2: 2634, costK: 20000 },
    { n: 3, what: "Bảo ôn toàn bộ đường ống cấp hơi", effect: "Giảm 21.457 kg than/năm", kgCo2: 57665, costK: 171656 },
    { n: 4, what: "Bộ từ trường phá cáu cặn nồi hơi", effect: "Tiết kiệm 5 % than (75.000 kg/năm)", kgCo2: 226040, costK: 672880 },
    { n: 5, what: "Tối ưu chế độ đốt lò hơi, đo hiệu suất, đào tạo", effect: "Giảm 5–10 % than", kgCo2: 226040, costK: 672880 },
    { n: 6, what: "Thay 300 đèn compact 18 W bằng LED 9 W", effect: "Tiết kiệm điện", kgCo2: 50, costK: 10000 },
    { n: 7, what: "Tuần hoàn nước ngưng về lò hơi", effect: "Tiết kiệm 5 % điện, than", kgCo2: 226040, costK: 672880 },
    { n: 8, what: "Tuần hoàn nước thải sau xử lý làm nước chạy tạo hạt", effect: "Giảm 18.720 m³/tháng", kgCo2: 197233, costK: 500000, m3PerMonth: 18720 },
    { n: 9, what: "Tối ưu oxy máy thổi khí bể hiếu khí (2 mg O₂/L)", effect: "Giảm 50 % điện máy thổi khí", kgCo2: 2634, costK: 20000 },
  ],
  wwDesignM3PerDay: 120,
} as const;

export const REPORT_2025 = {
  production: [36842, 38124, 39654, 37891, 40123, 38765, 42100, 45210, 38456, 37654, 28456, 27710], productionStated: 450985,
  kWh: [756240, 698120, 840560, 825430, 864250, 882310, 918470, 1056840, 892640, 876540, 620430, 681643], kWhStated: 9913473,
  sthMonthly: [20.53, 18.31, 21.2, 21.78, 21.54, 22.76, 21.82, 23.38, 23.21, 23.28, 21.8, 24.6],
  energy: { dien: { qty: 9913473, costK: 16900000, toe: 1530 }, do: { qty: 116997, costK: 3100000, toe: 97 }, than: { qty: 4594, costK: 60000000, toe: 93 }, totalStated: 1720 },
  doBreakdown: { forklift: 104020, shuttle: 12977 },
  stated: { waterText: "58.000 lít", waterSth: 0.43, coalSthKg: 3.7, wwM3: 21900, wwPerDay: 60 },
  chemicalsKg: [["PAC", 1580], ["Polymer", 95], ["NaOH", 1720], ["Clorine", 148], ["Đường", 1050], ["Vi sinh", 120], ["Zeolit", 1380]] as [string, number][],
  // Bảng quan trắc nước thải Q1–Q3/2025 trong báo cáo: [chỉ tiêu, đơn vị, Q1, Q2, Q3, giới hạn in trong bảng]
  ww: [
    ["BOD₅", "mg/L", 22, 18, 25, 30], ["COD", "mg/L", 58, 61, 54, 75], ["TSS", "mg/L", 128, 115, 138, 50], ["Tổng N", "mg/L", 63, 58, 70, 20],
    ["Amoni", "mg/L", 34, 28, 41, 5], ["Tổng P", "mg/L", 21, 18, 24, 4], ["Clo dư", "mg/L", 4.8, 5.1, 4.5, 1], ["Coliform", "MPN/100mL", 22000, 18500, 25000, 3000],
  ] as [string, string, number, number, number, number][],
  gas: [["Bụi", 7, 12, 9, 200], ["SO₂", 12, 15, 11, 500], ["NOₓ", 11, 13, 10, 850], ["CO", 15, 28, 18, 1000], ["NH₃", 2.8, 1.5, 2.1, 50]] as [string, number, number, number, number][],
  ghg: { rows: [["Than lò hơi, lò sấy", 12111.0], ["DO xe nâng + xe đưa rước", 314.3], ["Xăng xe con", 9.23], ["Môi chất lạnh R32", 6.23], ["Bình cứu hỏa CO₂", 0.01], ["Nước thải sinh hoạt", 2.56]] as [string, number][], scope1Stated: 12443.33, scope2: 6534.96, totalStated: 18978.29, ef: 0.6592, mwh: 9913.473, y2024: 17655.89, prod2024Used: 394000, intensity2025: 42.1, intensity2024: 44.8, coalT: 4594, doL: 116997 },
  actions2026: ["Duy trì ISO 14001 — tái đánh giá trước 24/12/2026", "Sổ nhật ký vận hành riêng cho từng hệ thống khí thải", "Sàn thao tác ống khói tạo hạt 1 và 3 (US EPA Method 1)", "Thay 4 bơm định lượng dự phòng HTXLNT", "Nghiên cứu điện mặt trời mái nhà ~200 kWp", "Bảo dưỡng 98 điều hòa (rò rỉ R32)", "Số hóa hồ sơ năng lượng phục vụ KNK 2026", "Diễn tập ứng phó sự cố ≥ 2 lần/năm"],
  inspections: [["Đoàn Thanh tra Sở NN&MT Tây Ninh", "Quý I/2025"], ["Đoàn làm việc Tập đoàn Hóa chất VN", "Quý II/2025"], ["Kiểm tra nội bộ ISO 14001", "10/2025"]] as [string, string][],
  legalCited: ["Thông tư 38/2023/TT-BCT (nêu là về kiểm kê KNK và kiểm toán năng lượng)", "QĐ 13/2024/QĐ-TTg (danh mục cơ sở phải kiểm kê KNK)", "NĐ 05/2025/NĐ-CP (hướng dẫn Luật BVMT)"],
} as const;

/** Mâu thuẫn bổ sung rút ra từ KTMT 2023 [J] và 2025 [K]. */
export const INCONSISTENCIES2 = [
  { topic: "Nước thải 2025: bảng “Đạt” nhưng nhiều chỉ tiêu vượt", src: "[K] §4.8b", note: "6/8 chỉ tiêu (TSS, TN, amoni, TP, clo dư, coliform) vượt giới hạn in ngay trong bảng ở cả 3 quý — 18/24 giá trị — nhưng cột đánh giá ghi “Đạt” cho tất cả. Tiêu đề ghi Kq 1,2 và Kf 1,1 nhưng giới hạn in là cột A chưa nhân hệ số. Báo cáo BVMT 2025 có COD 10–20 mg/L, TSS “KPH/<5” — không khớp.", sev: "red" },
  { topic: "Số liệu “nước thải” 2023 và 2025 giống số trước xử lý", src: "[J] §4.8.2, [G], [K]", note: "Đợt 1 trong [J] (BOD 23, COD 64, TSS 135, TN 68, TP 23,4, amoni 37, clo dư 5,05, coliform 24.000) trùng từng số với “chỉ tiêu phân tích trước xử lý” của Phụ lục 1 [G]; Q1/2025 trong [K] cùng bậc (TN 63, TP 21, TSS 128). Cần đối chiếu phiếu kết quả để biết điểm lấy mẫu là đầu vào hay sau xử lý.", sev: "red" },
  { topic: "Khí thải 2025: giới hạn và số liệu không khớp Báo cáo BVMT", src: "[K] §4.8a", note: "Bảng dùng QCVN 19 cột B Kp = 1 (bụi 200, SO₂ 500, NOx 850, CO 1.000) trong khi GPMT/Báo cáo BVMT dùng Kp 0,8 (160/400/680/800, NH₃ 40); không ghi điểm lấy mẫu; SO₂ 11–15 mg/Nm³ và NH₃ 1,5–2,8 mg/Nm³ không thấy ở Báo cáo BVMT 2025 (SO₂ phần lớn “<10”, NH₃ phần lớn dưới 1 mg/Nm³). Tiêu đề ghi “Quý I và II” nhưng có 3 đợt.", sev: "amber" },
  { topic: "Quy đổi TOE sai (than, dầu)", src: "[J] §4.1, [K] §4.1", note: "2023: hàng dầu DO ghi 2.080 TOE và hàng than 64 TOE — hai ô đổi chỗ cho nhau (than 2.971 t × 0,7 ≈ 2.080; dầu ≈ 64). 2025: than 4.594 t chỉ ghi 93 TOE (phải ≈ 3.216 TOE) nên tổng 1.720 TOE thấp; tính lại ≈ 4.840 TOE, phù hợp mức 3.800–4.900 TOE/năm ở hồ sơ KTNL.", sev: "red" },
  { topic: "Tổng điện 10 tháng 2023 gõ sai", src: "[J] §4.3", note: "Cộng 10 tháng = 6.821.667 kWh, bảng ghi 6.811.767 (lệch 9.900, đảo số). Con số sai đã đi vào kế hoạch dự báo [B] (6.811.767) và STH trung bình 28,13 kWh/t (tính đúng 26,04). Ô “Tổng STH 283,13” là tổng các STH tháng.", sev: "amber" },
  { topic: "Tổng than 2023 và STH than", src: "[J] §4.4", note: "Tổng than lò sấy ghi 741 t, cộng các tháng = 2.451,9 t (lò hơi 511,85 t khớp); tổng hai lò 2.963,75 t, bảng năng lượng ghi 2.971 t. STH 3,6 kg/t là của riêng lò hơi, [K] chép sang năm 2025 (“~3,7 kg/tấn”) trong khi 4.594 t/450.985 t = 10,19 kg/t.", sev: "amber" },
  { topic: "Nước: đơn vị và suất tiêu hao copy từ 2023", src: "[J] §4.6, [K] §4.6–4.7", note: "[J] ghi “lít” cho 54.523 (là m³) và STH trung bình 0,43 “lít/tấn” (tính đúng 0,38 m³/t trên sản lượng tạo hạt). [K] chép nguyên: “58.000 lít”, “0,43 lít/tấn”, trong khi Báo cáo BVMT 2025 ghi 76.679 m³ (≈ 0,17 m³/tấn).", sev: "amber" },
  { topic: "Dầu DO 2025", src: "[K] §4.5 so với Báo cáo BVMT", note: "[K] 116.997 lít (xe nâng 104.020 + xe đưa rước 12.977). Báo cáo BVMT 2025 ghi 104 (tương đương ≈ 104.000 lít) — bằng đúng phần xe nâng, thiếu xe đưa rước. Xác nhận cách quy đổi đã giả định ở tab Dự báo (×1.000 lít).", sev: "amber" },
  { topic: "Giải pháp tuần hoàn nước: 31,6 tCO₂e là số nhân 12 lần", src: "[J] §5.4 so với [B] §6", note: "[J] giải pháp 2 (500 m³/tháng) = 2.634 kgCO₂/năm (đã tính theo năm). 12 × 2,634 = 31,608 → số 31,6 tCO₂e của [B] (6.000 m³) là nhân thêm 12 lần; tính đúng ≈ 2,6 tCO₂e (0,44 kg/m³).", sev: "red" },
  { topic: "Giải pháp 8 [J]: tuần hoàn 18.720 m³/tháng vượt công suất", src: "[J] §5.4", note: "18.720 m³/tháng ≈ 624 m³/ngày, gấp 5 lần công suất HTXLNT 120 m³/ngày đêm và gấp nhiều lần lượng nước thải ghi 6.240–18.000 m³/năm. Giải pháp này (197.233 kgCO₂, 500 triệu đ) không khả thi như viết.", sev: "red" },
  { topic: "Đơn giá than, dầu suy ra từ bảng chi phí", src: "[J], [K] §4.1", note: "Than: 24 tỷ/2.971 t = 8,08 triệu đ/t (2023); 60 tỷ/4.594 t = 13,06 triệu đ/t (2025). Dầu DO: 17,7 nghìn đ/lít (2023) và 26,5 nghìn đ/lít (2025). Cao bất thường so với biến động giá — rà lại số tiền; dùng đơn giá hóa đơn khi tính hoàn vốn.", sev: "amber" },
  { topic: "Thanh tra, kiểm tra 2025", src: "[K] §1.1 so với Báo cáo BVMT 2025", note: "[K] liệt kê Sở NN&MT Tây Ninh (Quý I/2025), Đoàn Tập đoàn (Quý II/2025), kiểm tra ISO (10/2025). Báo cáo BVMT 2025 ghi chưa có cơ quan kiểm tra. Ngoài ra Quý I/2025 cơ quan còn là Sở TN&MT Long An — Sở NN&MT Tây Ninh chỉ có từ 01/07/2025.", sev: "red" },
  { topic: "Ứng phó sự cố: danh mục 2025 bỏ dòng diễn tập; tràn dầu “✔”", src: "[K] §3.2, §6.2", note: "Danh mục tuân thủ 2025 không còn dòng diễn tập (cả 3 hồ sơ trước đều “chưa”) và ghi kế hoạch tràn dầu “310/CV-KS.BĐ ✔”; 6.2 lại kế hoạch “diễn tập ≥ 2 lần/năm”. Số 310 là ký hiệu công văn; hồ sơ lập kế hoạch ứng phó tràn dầu vẫn đang ở giai đoạn báo giá (BG TV.MT2411.23, hết hiệu lực). Cần chứng từ ban hành.", sev: "red" },
  { topic: "Căn cứ pháp lý trong [K]", src: "[K] §2.1", note: "Nêu TT 38/2023/TT-BCT (kiểm kê KNK và kiểm toán năng lượng) và QĐ 13/2024/QĐ-TTg — chưa kiểm chứng trong app, cần đối chiếu số hiệu, ngày ban hành, nội dung trước khi nộp. Câu “Điều 74 Luật Môi trường số 72/2020/QH14 ngày hiệu lực 01/01/2022” thiếu chữ “Bảo vệ”. Bìa ghi “NĂM 2026” nhưng nội dung năm 2025.", sev: "amber" },
  { topic: "Kiểm kê KNK 2025: cường độ dùng sản lượng 2024 = 394.000 t", src: "[K] §5.3", note: "Cường độ 2024 (44,8 kgCO₂e/t) tính trên 394.000 t; Báo cáo BVMT 2024 ghi 411.773 t → 42,9. Mức giảm 2025 (42,1) vì thế chỉ ≈ 1,8 % thay vì 6 %. Tổng 2025 (18.978,29) và các phép cộng khác khớp.", sev: "amber" },
] as const;

// ======================================================================
//  [L] Giáo trình Võ Đình Long — phần dùng cho NM
// ======================================================================
export const VDL = {
  chapters: [
    { n: 2, name: "Quy trình KTMT", use: "3 giai đoạn; giai đoạn kiểm toán chính 5 bước" },
    { n: 3, name: "Công cụ và kỹ thuật", use: "Bản kiểm kê, bản điều tra, hình ảnh, phần mềm; phương pháp cân đối, đối chiếu, kiểm kê, điều tra, chọn mẫu, phân tích" },
    { n: 5, name: "Kiểm toán quản lý CTR và CTNH", use: "Quy trình 3 giai đoạn; kiểm tra thu gom – lưu trữ – phân loại tại nguồn — áp dụng kho CTNH 75 m², 45 thùng CTRSH" },
    { n: 6, name: "Kiểm toán kiểm soát ô nhiễm không khí", use: "Tìm hiểu hệ thống quản lý nội bộ, đánh giá điểm mạnh yếu — áp dụng lò hơi, lò sấy" },
    { n: 7, name: "Kiểm toán kiểm soát ô nhiễm nước", use: "Công tác chuẩn bị, kiểm tra — áp dụng HTXLNT 120 m³/ngày đêm" },
    { n: 9, name: "Kiểm toán carbon", use: "Quy trình 3 giai đoạn; hệ số quy đổi KNK; cách tính — áp dụng kiểm kê KNK" },
    { n: 10, name: "Trình tự xây dựng báo cáo", use: "Cấu trúc 6 phần, 5 bước báo cáo, kế hoạch hành động, xác minh khắc phục" },
  ],
  mainSteps: [
    { n: 1, name: "Tìm hiểu quy chế và hệ thống quản lý nội bộ", plant: "MT-QT/HD ISO 14001 (ban hành 2018, chưa soát xét), GPMT 2986" },
    { n: 2, name: "Đánh giá điểm mạnh, yếu của hệ thống quản lý", plant: "Nếu hệ thống đủ → kiểm tra hiệu quả vận hành; nếu chưa đủ → tập trung hiệu quả môi trường thực tế" },
    { n: 3, name: "Thu thập chứng cứ kiểm toán (vật thể, tài liệu, tình huống thực tế)", plant: "Nhật ký vận hành, phiếu kết quả quan trắc, chứng từ CTNH, hợp đồng, ảnh hiện trường" },
    { n: 4, name: "Đánh giá kết quả thu được, tổng hợp quan sát các thành viên", plant: "Bảng mâu thuẫn hồ sơ; đối chiếu số liệu giữa các nguồn" },
    { n: 5, name: "Báo cáo phát hiện (họp cuối, báo cáo bằng văn bản của trưởng đoàn)", plant: "Báo cáo sơ bộ trong 2 tuần sau kiểm toán chính, rồi báo cáo cuối" },
  ],
  methods: [
    ["Cân đối", "Lập chỉ tiêu có quan hệ cân đối → thu thập chứng từ → bảng cân đối thử → tìm nguyên nhân mất cân đối", "Cân bằng vật chất, năng lượng (tab Cân bằng vật chất)"],
    ["Đối chiếu", "Trực tiếp (cùng chỉ tiêu ở các nguồn) và logic (các chỉ tiêu liên quan)", "Bảng đối chiếu 2023–2024 giữa [B], BC BVMT, KNK, Phụ lục 1"],
    ["Kiểm kê", "Cân, đo, đếm hiện vật; so với sổ sách", "Kho CTNH, thùng CTRSH, thiết bị, hóa chất"],
    ["Điều tra", "Phỏng vấn trực tiếp; bảng hỏi gián tiếp", "Bảng hỏi trước kiểm toán gửi các phòng"],
    ["Chọn mẫu", "Chọn mẫu kiểm toán đại diện", "Chọn ngày, điểm thu gom rác; đợt quan trắc"],
    ["Phân tích", "Phân tích xu hướng, tỷ lệ, so sánh", "STH điện, than, nước theo tháng"],
  ] as [string, string, string][],
  techniques: ["Đặt câu hỏi", "Quan sát", "Lấy mẫu sâu", "Nghiên cứu, lập báo cáo", "Sử dụng phần mềm"],
  wasteStages: [
    { stage: "Tiền kiểm toán", steps: ["Xác định phạm vi (mục tiêu, vị trí, loại và lượng chất thải)", "Thu thập thông tin cơ bản (lao động, số lượng, chủng loại, vị trí thùng rác)", "Chuẩn bị (cân, bảng ghi số liệu, bảo hộ, khu vực phân loại)", "Kiểm tra thủ tục và hệ thống quản lý CTR–CTNH", "Đánh giá điểm mạnh, yếu"] },
    { stage: "Tiến hành kiểm toán", steps: ["Thu thập chứng cứ: thu gom – lưu trữ (phương tiện, thùng, thời gian lưu, khu lưu trữ, mùi, nước rỉ, CTNH có dán nhãn đúng không)", "Hoạt động phân loại tại nguồn (đã phân loại chưa, mấy loại, hiệu quả)", "Kiểm toán việc phân loại: thu gom chất thải hằng ngày vào túi có nhãn địa điểm, ngày; ghi số lượng; cân từng nhóm"] },
    { stage: "Hậu kiểm toán", steps: ["Phân tích dữ liệu, đề xuất phương án thu gom, giảm thiểu, kiểm toán lần sau"] },
  ],
  reportParts: [
    { id: "intro", name: "Giới thiệu cuộc kiểm toán và địa điểm" },
    { id: "scope", name: "Quy mô: mục tiêu, phạm vi, giới hạn/loại trừ" },
    { id: "method", name: "Phương pháp và cách tiếp cận" },
    { id: "summary", name: "Tóm tắt kết quả chính và tình trạng tuân thủ (đầu báo cáo)" },
    { id: "findings", name: "Phát hiện kiểm toán kèm bằng chứng, xếp hạng ưu tiên" },
    { id: "reco", name: "Đề xuất, biện pháp khắc phục" },
    { id: "plan", name: "Kế hoạch hành động: người chịu trách nhiệm, ngày hoàn thành" },
    { id: "verify", name: "Xác minh biện pháp khắc phục bằng chứng từ" },
    { id: "concl", name: "Kết luận" },
  ],
  // Đọc từ văn bản: 1 = có, 0.5 = có một phần, 0 = không
  reportCoverage: {
    "2023 [J]": { intro: 1, scope: 0.5, method: 1, summary: 0, findings: 0.5, reco: 1, plan: 0, verify: 0, concl: 1 },
    "2024 [I]": { intro: 1, scope: 0.5, method: 1, summary: 0, findings: 1, reco: 1, plan: 0.5, verify: 0, concl: 1 },
    "2025 [K]": { intro: 1, scope: 0.5, method: 1, summary: 0, findings: 0.5, reco: 1, plan: 0.5, verify: 0, concl: 0 },
  } as Record<string, Record<string, number>>,
  coverageNote: "Cách chấm: 1 = có; 0,5 = có nhưng thiếu ý (scope: có phạm vi, không nêu giới hạn/loại trừ; findings: có bảng nhưng không xếp hạng ưu tiên hoặc không kèm bằng chứng đầy đủ; plan: có danh sách hành động nhưng không có người phụ trách/hạn); 0 = không có. Đánh giá của app sau khi đọc văn bản, cần người soạn báo cáo xác nhận.",
} as const;
