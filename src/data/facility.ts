// Hồ sơ Nhà máy Phân bón Bình Điền – Long An (tổng hợp 20/11/2026 từ: Biện pháp phòng ngừa, ứng phó sự cố hóa chất 2026;
// Nội quy PCCC&CNCH 2026; QĐ 199/QĐ.KS-BĐ; Biên bản kiểm tra nghiệm thu PCCC bến tàu 3000 DWT; GPMT 2986/GPMT-STNMT;
// Thuyết minh BCNCKT và TKCS dự án NPK 100.000 tấn/năm, 2016).

export const PLANT = {
  name: "Nhà máy Phân bón Bình Điền – Long An",
  company: "Công ty Cổ phần Phân bón Bình Điền",
  address: "CCN Long Định – Long Cang, xã Long Cang, tỉnh Tây Ninh (trước sáp nhập: xã Long Định, huyện Cần Đước, tỉnh Long An)",
  coord: "X 1172180,87 · Y 580534,24 (VN2000)",
  ceo: "Tổng Giám đốc Ngô Văn Đông",
  neighbors: [
    ["Bắc", "Nhà máy xi măng Hà Tiên"],
    ["Tây", "Sông Vàm Cỏ Đông (≈ 500 m) — nguồn tiếp nhận nước thải và nguồn nước chữa cháy"],
    ["Đông", "Đường Nguyễn Trung Trực và khu dân cư"],
    ["Nam", "Công ty Gas Thành Tài"],
  ],
  figures: [
    ["Diện tích các hạng mục chính", "≈ 44.991 m²"],
    ["Khu đất (theo biên bản PCCC cảng)", "≈ 140.110 m²"],
    ["Công suất NPK (Biện pháp UPSCHC)", "≈ 330.000 tấn/năm"],
    ["Công suất theo GPMT 2986", "600.000 tấn/năm (giai đoạn 1 + 2)"],
    ["Dây chuyền", "Trộn 100.000 tấn/năm; tạo hạt 20 tấn/h"],
    ["Xử lý khí thải", "30.000 – 50.000 Nm³/h (NH₃, bụi, SOₓ, NOₓ, CO₂)"],
    ["Lò hơi", "8 tấn hơi/h — đang điều chỉnh GPMT bổ sung lò sinh khối 6 t/h"],
    ["HTXLNT", "Thiết kế 120 m³/ngày, hiện ≈ 90 m³/ngày, đạt QCVN 40:2011/BTNMT cột A, xả sông Vàm Cỏ Đông"],
    ["Cảng", "Bến 1.000 DWT và 3.000 DWT (cầu tàu 15 × 74 m = 1.110 m²)"],
    ["ISO 14001:2015", "Hiệu lực đến 24/12/2026 — tái chứng nhận"],
  ],
} as const;

/** Danh mục hóa chất cần kiểm soát — Biện pháp phòng ngừa, ứng phó sự cố hóa chất 2026. */
export const CONTROLLED_CHEMICALS = [
  { name: "Amoniac (NH₃)", hazard: "Độc cấp tính, ăn mòn; khí hóa lỏng", note: "Kho NH₃ — nguy cơ rò rỉ lớn nhất" },
  { name: "Agrotain", hazard: "Phụ gia ức chế urease", note: "" },
  { name: "Axit citric", hazard: "Kích ứng", note: "" },
  { name: "Axit clohydric (HCl)", hazard: "Nhóm 8 — ăn mòn", note: "" },
  { name: "Axit nitric (HNO₃)", hazard: "Nhóm 8 — ăn mòn; 5.1 — oxy hóa", note: "Tách xa chất hữu cơ, chất khử" },
  { name: "Axit sunfuric (H₂SO₄)", hazard: "Nhóm 8 — ăn mòn", note: "" },
  { name: "Natri hydroxit (NaOH)", hazard: "Nhóm 8 — ăn mòn", note: "Hấp thụ khí thải lò than" },
  { name: "Borax", hazard: "Độc sinh sản (CMR)", note: "Vi lượng" },
  { name: "Clorin / Ca(OH)₂", hazard: "Oxy hóa, ăn mòn", note: "Khử trùng nước thải" },
  { name: "PAC", hazard: "Kích ứng", note: "Keo tụ HTXLNT" },
  { name: "Polymer", hazard: "Trơn trượt khi đổ tràn", note: "Keo tụ HTXLNT" },
] as const;

export const DOCUMENTS = [
  { no: "2986/GPMT-STNMT", date: "28/04/2023", title: "Giấy phép môi trường (Sở TN&MT Long An, nay Sở NN&MT Tây Ninh), 10 năm", area: "Môi trường" },
  { no: "385/2026/QĐ-KS.BĐ", date: "22/04/2026", title: "Ban hành Biện pháp phòng ngừa, ứng phó sự cố hóa chất (lần 03, 05/05/2026) — người soạn Trịnh Thiên Phương, P.KTSX", area: "Hóa chất" },
  { no: "759/QĐ.KS-BĐ", date: "07/09/2026", title: "Nội quy phòng cháy, chữa cháy và cứu nạn, cứu hộ (Luật PCCC&CNCH 55/2024/QH15, NĐ 105/2025, TT 36/2025/TT-BCA)", area: "PCCC" },
  { no: "199/QĐ.KS-BĐ", date: "14/09/2026", title: "Ban hành 07 nội quy, hướng dẫn vận hành an toàn thiết bị (thang nâng, cầu trục xoay, cần trục ô tô 51L-827.19, cần trục KATO KR-25H-V, máy tiện, máy mài 2 đá, máy khoan)", area: "An toàn thiết bị" },
  { no: "Biên bản KT nghiệm thu PCCC", date: "26/01/2026", title: "Bến tàu 3000 DWT — hệ thống cấp nước chữa cháy ngoài nhà (Phòng CS PCCC&CNCH Công an tỉnh Tây Ninh)", area: "PCCC" },
  { no: "164/NT-PCCC", date: "26/05/2025", title: "Nghiệm thu mạng ống chữa cháy DN100 hiện hữu", area: "PCCC" },
  { no: "Danh sách HL ATVSLĐ", date: "02–12/10/2026", title: "Huấn luyện nhóm 4, 5, 6 năm 2026 (328 lượt) — xem tab Huấn luyện ATVSLĐ", area: "ATVSLĐ" },
  { no: "BCNCKT, TKCS NPK", date: "05/2016", title: "Thuyết minh báo cáo nghiên cứu khả thi và thiết kế cơ sở dự án NPK 100.000 tấn/năm", area: "Dự án" },
] as const;

export const LEGAL_BASIS = [
  ["Hóa chất", "Luật Hóa chất 69/2025/QH15; NĐ 24/2026, 25/2026, 26/2026/NĐ-CP; TT 01/2026, 02/2026/TT-BCT"],
  ["PCCC & CNCH", "Luật 55/2024/QH15 (VBHN 58/VBHN-VPQH 2026); NĐ 105/2025/NĐ-CP; TT 36/2025/TT-BCA; NĐ 136/2020/NĐ-CP (nghiệm thu)"],
  ["Môi trường", "GPMT 2986/GPMT-STNMT; QCVN 40:2011/BTNMT cột A (nước thải); QCVN 19:2009/BTNMT cột B Kp 0,8 Kv 1,0 (khí thải)"],
  ["ATVSLĐ", "Huấn luyện theo nhóm 1–6 (Luật ATVSLĐ 2015, NĐ 44/2016/NĐ-CP sửa đổi bởi NĐ 140/2018/NĐ-CP)"],
] as const;

export const SAFETY_RULES = [
  { title: "Cầu trục xoay (Võ Văn Phu, 10/09/2026)", items: ["Chỉ người được huấn luyện vận hành", "Không nâng quá 01 tấn", "Kiểm tra móc, cáp/xích, chốt an toàn, quai bao Jumbo trước khi nâng", "Cấm đứng dưới tải, kéo ngang, nâng tải mắc/lệch"] },
  { title: "Thang nâng kho bao bì", items: ["Không xếp quá 500 kg, không để hàng nhô khỏi sàn", "Không khởi động khi có người trong vùng nguy hiểm", "Báo sự cố ngay cho phụ trách và Cơ điện"] },
  { title: "Máy tiện, máy mài 2 đá, máy khoan", items: ["Người vận hành có chuyên môn và chứng chỉ ATLĐ", "Kiểm tra tiếp đất, chạy thử không tải", "Máy khoan: kẹp chặt phôi, không đeo găng tay, tắt máy trước khi thay mũi"] },
  { title: "PCCC khu vực sản xuất (QĐ 759)", items: ["Không hút thuốc, không đưa nguồn lửa vào", "Hàn, cắt phải có người giám sát an toàn và kiểm tra sau khi kết thúc", "Không che chắn tủ điện, phương tiện PCCC, lối thoát nạn", "Phát hiện cháy: báo động, gọi 114, chữa cháy tại chỗ nếu an toàn"] },
] as const;

/** Điểm số liệu chưa thống nhất giữa các tài liệu — cần đối chiếu trước khi đưa vào hồ sơ. */
export const DATA_GAPS = [
  "Số lò hơi: Biện pháp UPSCHC 2026 ghi 02 lò 8 tấn hơi/h, GPMT 2986 chỉ cấp phép 01 lò hơi (nguồn 01) — trùng với mục C6 ghi chú nội bộ hồ sơ điều chỉnh GPMT (BC BVMT 2022 có điểm KT2 \"lò hơi số 2\").",
  "Lưu lượng nước thải: Biện pháp UPSCHC ghi ≈ 90 m³/ngày, ghi chú nội bộ hồ sơ GPMT (mục B7) ghi thực tế 2025 ≈ 49 m³/ngày, GPMT liệt kê ≈ 25,7 m³/ngày.",
  "Công suất: ≈ 330.000 tấn NPK/năm (UPSCHC) so với 600.000 tấn/năm (GPMT, tổng hai giai đoạn) — ghi rõ phạm vi khi trích dẫn.",
  "Danh sách huấn luyện nhóm 3 (an toàn điện, 28/09/2026) chưa có bản PDF — chưa nạp vào app.",
] as const;
