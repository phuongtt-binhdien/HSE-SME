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
