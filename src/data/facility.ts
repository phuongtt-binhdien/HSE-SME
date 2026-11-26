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
    ["Diện tích nhà máy (giới thiệu Cty)", "16 ha, có cảng sông, thuận tiện đường bộ"],
    ["Số dây chuyền (giới thiệu Cty)", "3 dây chuyền tạo hạt (công nghệ một hạt) + 4 dây chuyền trộn; công suất 600.000 tấn/năm"],
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
  { no: "BC khảo sát cải tạo HTXLNT", date: "14/10/2026", title: "Global Green — khảo sát 09/09/2026, Jar test 10/09/2026, phương án cải tạo HTXLNT 120 m³/ngày.đêm (kèm bản vẽ mặt bằng trước/sau cải tạo 12/10/2026)", area: "Môi trường" },
  { no: "BOQ xử lý NH₃", date: "2026", title: "Dự toán hệ thống tháp hấp thụ NH₃ + bồn axit + quạt + bơm + điện điều khiển/DCS — tổng 23.037.659.200 đồng (nhiều hạng mục “cần khảo sát thực tế”)", area: "Dự án" },
  { no: "Bảng so sánh lò đốt sinh khối", date: "29/06/2026", title: "Dây chuyền tạo hạt thùng quay urê hóa lỏng số 2: hiện hữu (than) → điều chỉnh 2026 (sinh khối)", area: "Dự án" },
  { no: "BVHC lọc bụi LB55-00-00", date: "2019–2026", title: "Bản vẽ hoàn công lọc bụi lò sấy 55.000 m³/h — CME (22 tờ): 576 túi Ø130 × L4.200, ~742 m², cầu thang, ống chia hơi, venturi", area: "Môi trường" },
  { no: "BVHC CEMS P19061", date: "2026", title: "Bản vẽ hoàn công hệ thống quan trắc khí thải tự động, liên tục — Công nghệ Thành Thiên (13 tờ): ống khói Ø2.200, nhà trạm, thiết bị phân tích N1A/N1B, đo bụi", area: "Môi trường" },
  { no: "BVHC lò hơi GB-GT-NL.00.00", date: "2026", title: "Bản vẽ nguyên lý lò hơi ghi tĩnh — Greenboiler: buồng đốt, đối lưu, bộ lọc bụi ướt, bể lọc bụi, ống khói", area: "Môi trường" },
  { no: "BVHC HTXLNT 0516.BDW", date: "29/09/2016", title: "Bản vẽ hoàn công cải tạo HTXLNT 120 m³/ngày — Kinh Bố (18 tờ): sơ đồ công nghệ, mặt bằng, bể điều hòa, lắng hóa lý, tuyển nổi", area: "Môi trường" },
  { no: "BV CN-04-01/02", date: "10/2026", title: "Sơ đồ đường ống công nghệ, bảng thống kê thiết bị hệ thống xử lý bụi, khí thải lò sấy nóng — Nguồn số 04 (kèm bản vẽ lò đốt sấy nóng, cyclone đơn, lọc bụi tay áo 432 túi)", area: "Môi trường" },
  { no: "Sổ tay ATHC VINACHEM (v05)", date: "10/2026", title: "Bản đề xuất hoàn thiện của Nhà máy trên dự thảo v05, tích hợp 40 góp ý — TÀI LIỆU GÓP Ý, KHÔNG PHẢI BẢN BAN HÀNH", area: "Hóa chất" },
  { no: "Nghị định 283/2026/NĐ-CP", date: "2026", title: "Xử phạt vi phạm hành chính về lao động, bảo hiểm xã hội, người lao động đi làm việc ở nước ngoài (tập huấn của Cục Việc làm — Trung tâm quốc gia về ATVSLĐ)", area: "ATVSLĐ" },
  { no: "BCNCKT, TKCS NPK", date: "05/2016", title: "Thuyết minh báo cáo nghiên cứu khả thi và thiết kế cơ sở dự án NPK 100.000 tấn/năm", area: "Dự án" },
] as const;

export const LEGAL_BASIS = [
  ["Hóa chất", "Luật Hóa chất 69/2025/QH15; NĐ 24/2026, 25/2026, 26/2026/NĐ-CP; TT 01/2026, 02/2026/TT-BCT"],
  ["PCCC & CNCH", "Luật 55/2024/QH15 (VBHN 58/VBHN-VPQH 2026); NĐ 105/2025/NĐ-CP; TT 36/2025/TT-BCA; NĐ 136/2020/NĐ-CP (nghiệm thu)"],
  ["Môi trường", "GPMT 2986/GPMT-STNMT; QCVN 40:2011/BTNMT cột A (nước thải); QCVN 19:2009/BTNMT cột B Kp 0,8 Kv 1,0 (khí thải)"],
  ["Môi trường (đề xuất cải tạo)", "Báo cáo khảo sát cải tạo HTXLNT so sánh với QCVN 14:2025/BTNMT Bảng 2 cột A (nước thải sinh hoạt) — khác QCVN 40:2011 cột A trong GPMT; cần xác định quy chuẩn áp dụng"],
  ["Xử phạt lao động", "Nghị định 283/2026/NĐ-CP (xử phạt vi phạm hành chính lĩnh vực lao động, ATVSLĐ, BHXH): tổ chức bị phạt gấp 2 lần mức phạt đối với cá nhân"],
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
  "Quy chuẩn nước thải: GPMT 2986 áp dụng QCVN 40:2011/BTNMT cột A (× Kq, Kf); báo cáo khảo sát cải tạo (Global Green, 14/10/2026) so với QCVN 14:2025/BTNMT Bảng 2 cột A (BOD₅ 30, COD 80, TSS 50, T-N 25, T-P 4,0, NH₄⁺-N 6,0 mg/L, coliform 3.000 MPN/100 mL) — cần chốt quy chuẩn áp dụng; mô phỏng 3D đang dùng QCVN 40:2011.",
  "Bản vẽ HTXLNT (12/10/2026): tờ 3 ghi “Sơ đồ công nghệ HTXLNT ADC, công suất 35 m³/ngày.đêm” trong khi hạng mục là 120 m³/ngày.đêm — cần kiểm tra tiêu đề bản vẽ.",
  "Quạt hút hệ thống Nguồn 04: CN-04-02 ghi 55.000 m³/h, 350 mmH₂O, 155 HP; Bảng so sánh thiết bị 29/06/2026 ghi hiện hữu 50.000 m³/h (450 mmH₂O) và điều chỉnh 40.000 m³/h, 37 kW (150 mmH₂O); BOQ NH₃ ghi quạt ly tâm 55.000 m³/h, 55 kW, hút −450 mmH₂O — cần thống nhất.",
  "Buồng đốt lò sinh khối: CN-04-02 ghi 1,0 × 1,4 m (1,4 m²) còn Bảng so sánh ghi 1,4 × 2,5 m (3,5 m²).",
  "Tháp hấp thụ NH₃ mới ở giai đoạn dự toán (BOQ còn nhiều hạng mục “cần khảo sát thực tế”: đường ống, xây dựng, lắp đặt; hai phương án vật liệu SUS304 / CS bọc FRP) — chưa có trong bản vẽ CN-04-01.",
  "Nguồn 04 (BV CN-04-01): ống khói cao 22 m, D1 800 / D2 600 mm, Q 55.000 m³/h → vận tốc ra ≈ 54 m/s nếu D2 là đường kính miệng — cao bất thường, cần đối chiếu đường kính đỉnh; số liệu quan trắc 2026 trước đây dùng ống 15 m / Ø1,2 m / 46.000 Nm³/h (khác nguồn) — cần thống nhất trước khi chạy Gauss cho hồ sơ.",
  "Nguồn 04 (CN-04-01) chưa có tháp hấp thụ NH₃ sau túi vải; mô phỏng 3D vẫn đặt tháp HT01 theo BOQ dự án (đang dự toán) và quy trình MT-HD05 — cần xác nhận hiện trạng.",
  "Bản vẽ CN-04-02 còn nhiều mục “… (đo bổ sung)”: quạt thổi khí nóng (lưu lượng, cột áp, công suất), Ø ống cyclone chùm, kích thước ống Ô1, Ô2, Ô5–Ô7.",
  "Mặt bằng 3D: lưới trục 1–19 giả định 6 m/nhịp (≈ 108 × 48 m) và vị trí thiết bị đọc xấp xỉ từ bản vẽ mặt bằng tổng thể — cần đo/đối chiếu bản vẽ gốc trước khi dùng cho mục đích khác ngoài huấn luyện.",
  "Số lò hơi: Biện pháp UPSCHC 2026 ghi 02 lò 8 tấn hơi/h, GPMT 2986 chỉ cấp phép 01 lò hơi (nguồn 01) — trùng với mục C6 ghi chú nội bộ hồ sơ điều chỉnh GPMT (BC BVMT 2022 có điểm KT2 \"lò hơi số 2\").",
  "Lưu lượng nước thải: Biện pháp UPSCHC ghi ≈ 90 m³/ngày, ghi chú nội bộ hồ sơ GPMT (mục B7) ghi thực tế 2025 ≈ 49 m³/ngày, GPMT liệt kê ≈ 25,7 m³/ngày.",
  "Công suất: ≈ 330.000 tấn NPK/năm (UPSCHC) so với 600.000 tấn/năm (GPMT, tổng hai giai đoạn) — ghi rõ phạm vi khi trích dẫn.",
  "Khí thải (GPMT 2986, Phụ lục 2): các dòng thải 01–07 không thuộc diện quan trắc tự động liên tục (Điều 98 NĐ 08/2022); GPMT không nêu hiệu suất xử lý, nồng độ khí thô, số quạt dự phòng hay hóa chất/ pH vận hành của tháp kiềm lò hơi — các giá trị này trong mô hình DCS khí thải là giả định, cần số liệu quan trắc 03 tháng/lần và hồ sơ thiết kế thực tế.",
  "Hồ sơ đề nghị điều chỉnh GPMT (10/11/2026) giải quyết nghi vấn vận tốc ≈ 54 m/s ở ống khói nguồn 04: đề nghị đổi D1/D2 thành 2.000/1.500 mm (≈ 8,6 m/s). Mô phỏng Gauss/3D đã dùng D2 1,5 m — chỉ đúng nếu hồ sơ được chấp thuận; GPMT hiện hành vẫn là D2 600 mm.",
  "Chiều dài túi lọc: chủ cơ sở xác nhận hồ sơ điều chỉnh ghi 3.460 mm; bản vẽ CN-04-02 và Bảng 2.1 của cùng hồ sơ ghi 3.360 mm — cần đo thực tế (432 túi, 556 m²).",
  "Lưu lượng đo thực tế 2026 thấp hơn thiết kế: lò hơi 18,5–19,6 nghìn/25 nghìn m³/h; sấy 1, 2: 30,8–50,9 nghìn/55 nghìn; sấy 3: 77,6–79,1 nghìn/140 nghìn m³/h (≈ 56 %; thiết kế 140.000 m³/h đã được chủ cơ sở xác nhận) — cần xác nhận chế độ chạy khi lấy mẫu.",
  "Quan trắc 06/04/2026 tại G04: CO 172 mg/Nm³ (cao hơn nhiều lần so với các đợt còn lại 14–79; vẫn dưới giới hạn 800) — nên ghi nhận điều kiện đốt khi lấy mẫu.",
  "Phí BVMT khí thải khai theo lưu lượng thiết kế × 1.152 giờ/quý (không theo lưu lượng đo thực tế); phí nước thải Quý I tờ khai ghi TSS = 0 trong khi kết quả \"< 4 mg/L\" nên bị thẩm định lại 3,9 mg/L (+49.140 đ). Dây chuyền phối trộn hữu cơ (G07) hiện không vận hành nên không có phiếu quan trắc.",
  "Kiểm tra theo Giáo trình Kiểm soát ô nhiễm không khí (tab DCS Khí thải → Kiểm tra thiết kế): vận tốc thải ống khói lò sấy theo GPMT (D2 0,6 m) ≈ 40–55 m/s, theo đề nghị điều chỉnh (D2 1,5 m) ≈ 7,5 m/s, đều lệch khoảng ≥ 20 m/s của giáo trình; tải trọng lọc túi Nguồn 04 ≈ 1,65 m/phút (556 m² ở Q 55.000 m³/h) cao hơn mức 0,5–1,5 m/phút, chỉ chấp nhận cho túi thổi xung có khung đỡ (≤ 2,5) — cần số liệu nhà cung cấp.",
  "Thống kê sản xuất 04–08/2026 (tab Sản Xuất · Ca Chạy): máy 2 = tạo hạt 3 (xác nhận); máy 1 = tạo hạt 1 và máy 3 = tạo hạt 2 là suy ra, cần xác nhận. Máy 3 đốt sinh khối (viên nén, than củi, vỏ mắc ca) 56/59 ca tháng 4 và 41–48 ca mỗi tháng sau đó (≈ 477 t cả kỳ) khi hồ sơ điều chỉnh GPMT chưa được chấp thuận — cần đối chiếu văn bản cho phép chạy thử; giờ chạy quý II của máy 2, 3 (1.280 h, 1.351 h) vượt 1.152 h/quý dùng để khai phí khí thải.",
  "Mặt bằng 3D (dựng lại 11/2026 theo Bản vẽ hoàn công TMB-01): ranh đất tính được 141.085 m² (bảng cân bằng đất 140.110 m²), diện tích xây dựng 42.924 m² (bảng 42.844 m²). Hướng bản vẽ suy ra từ ảnh vệ tinh và hướng X/Y bản vẽ: đỉnh bản vẽ = phía Tây (sông Vàm Cỏ Đông), cổng chính và đường Trung Trực ở phía Đông — cần xác nhận. Vị trí HTXLNT, lò hơi, bãi than/sinh khối vẫn theo bản vẽ thiết bị (xoay 90° cho khớp nhà 9A1), chưa có trong bản vẽ hoàn công; công trình \"xin phép/đầu tư mở rộng\" vẽ trong suốt; chiều cao công trình là giả định; nhà dân, NM xi măng Hà Tiên, Gas Thành Tài là bối cảnh gần đúng.",
  "Bản vẽ hoàn công lọc bụi lò sấy 55.000 m³/h (CME, LB55-00-00): 576 túi Ø130 × L4.200 (khung Ø115 × 3.350), ~742 m² vải lọc, 64 van điện từ — KHÁC hồ sơ điều chỉnh GPMT/BV CN-04-02 (432 túi, 556 m², dài 3.360/3.460 mm); tải trọng lọc tính lại 1,24 m/phút (trong khoảng 0,5–1,5). Cần xác nhận bản nào áp dụng cho Nguồn 04 trước khi nộp hồ sơ.",
  "Bản vẽ hoàn công CEMS (Thành Thiên, P19061): ống khói Ø ngoài 2.200 mm (GPMT ghi D2 = 2,0 m, KL 2721 ghi 2,2 m), sàn thao tác +7.500 và +8.000 mm, nhà trạm 3.000 × 2.400 mm (EL +6.900), cửa phân tích khí N1A/N1B — vị trí này tại dòng có CEMS tự nguyện (dòng 06); cần xác nhận tham số quan trắc thực tế đo (bụi, SO₂, NOx, CO, lưu lượng, nhiệt độ).",
  "Bản vẽ hoàn công lò hơi (Greenboiler, GB-GT-NL.00.00 — lò hơi ghi tĩnh): chuỗi buồng đốt → phần đối lưu → bộ tiết kiệm/gia nhiệt → quạt hút → bộ lọc bụi ướt → bể lọc bụi → ống khói, kèm bồn nước tuần hoàn và bơm cấp nước; bản vẽ KHÔNG thể hiện tháp hấp thụ NaOH như GPMT 2986 (lọc bụi ướt → tháp kiềm) và mô hình DCS khí thải — cần đối chiếu thực tế.",
  "Bản vẽ hoàn công HTXLNT (Kinh Bố, 0516.BDW, 18 tờ; sửa chữa cải tạo HTXLNT 120 m³/ngày): hố bơm tổng hợp B01A (nước thải tập trung 50 m³/ngày + XCK-XN 10 m³/ngày), hố bơm nước giặt túi lọc bụi B01B (10 m³/lần, xây mới), hố bơm xưởng cơ khí và xe nâng B01C (xây mới), bể điều hòa B02A, bể lắng hóa lý 2 B02B (xây mới), bể tuyển nổi B03 (cải tạo), ngăn keo tụ/tạo bông, bể lắng hóa lý 1 B04, hệ châm NaOH/PAC/polymer, sau đó sinh học (anoxic, MBBR…) và bể sinh thái — cấu hình khác mô hình HTXLNT trong App (chưa có cụm hóa lý B02B/B03/B04, hố bơm B01B–C).",
  "Quy hoạch tổng thể mặt bằng mới nhất (2026_QUY_HOACH_TONG_THE_MB_UPDATE_NVP2.dwg): chưa đọc được trong môi trường làm việc (không có bộ chuyển DWG) — mặt bằng 3D vẫn theo Bản vẽ hoàn công TMB-01; cần bản xuất PDF/DXF của file DWG để cập nhật.",
  "Danh sách huấn luyện nhóm 3 (an toàn điện, 28/09/2026) chưa có bản PDF — chưa nạp vào app.",
] as const;

/** Nguồn phát sinh khí thải và hệ thống xử lý — Phụ lục 2, GPMT 2986/GPMT-STNMT (28/04/2023); tọa độ VN2000, kinh tuyến trục 105°45', múi chiếu 3°. */
export const EMISSION_SOURCES = [
  { id: "G01", name: "Lò hơi đốt than 8 t/h", flow: 25000, stack: "cao 18 m, D700", xy: "1172156 / 580206", treat: "Bộ lọc bụi ướt → hấp thụ dung dịch kiềm (NaOH) → quạt hút", limit: "QCVN 19:2009 cột B (Kp 0,8; Kv 1,0): CO 800; NOx 680; SO₂ 400; bụi 160 mg/Nm³" },
  { id: "G02", name: "Lò sấy nóng — dây chuyền tạo hạt 1", flow: 55000, stack: "cao 22 m, D1 800 / D2 600", xy: "1172150 / 580263", treat: "Cyclone chùm → lọc bụi túi vải → quạt hút", limit: "QCVN 19 + QCVN 21:2009 cột B (Kp 0,8): CO 800; NOx 680; SO₂ 400; bụi 160; NH₃ 40 mg/Nm³" },
  { id: "G03", name: "Lò sấy nguội — dây chuyền tạo hạt 1", flow: 55000, stack: "cao 22 m, D1 800 / D2 600", xy: "1172132 / 580277", treat: "Cyclone chùm → lọc bụi túi vải → quạt hút", limit: "như G02" },
  { id: "G04", name: "Lò sấy nóng — dây chuyền tạo hạt 2 (Nguồn 04)", flow: 55000, stack: "cao 22 m, D1 800 / D2 600 (đề nghị 2026: D1 2.000 / D2 1.500)", xy: "1172155 / 580357", treat: "Cyclone chùm → lọc bụi túi vải → quạt hút", limit: "như G02" },
  { id: "G05", name: "Lò sấy nguội — dây chuyền tạo hạt 2", flow: 55000, stack: "cao 22 m, D1 800 / D2 600", xy: "1172194 / 580350", treat: "Cyclone chùm → lọc bụi túi vải → quạt hút", limit: "như G02" },
  { id: "G06", name: "Lò sấy — dây chuyền tạo hạt 3", flow: 140000, stack: "cao 22 m, D1 3 m / D2 2 m", xy: "1172157 / 580332", treat: "Cyclone chùm → lọc bụi túi vải → quạt hút", limit: "như G02" },
  { id: "G07", name: "Phối trộn phân hữu cơ", flow: 10000, stack: "cao 1,2 m, D300", xy: "1171990 / 580289", treat: "Lọc bụi túi vải → quạt hút", limit: "QCVN 21:2009 cột B (Kp 1,0): bụi 200 mg/Nm³" },
  { id: "G08", name: "Máy phát điện dự phòng", flow: 0, stack: "—", xy: "1172298 / 580288", treat: "Không có hệ thống xử lý", limit: "—" },
] as const;

/** Kết quả quan trắc môi trường định kỳ 2026 — Trung tâm Kỹ thuật Tài nguyên và Môi trường Tây Ninh (VIMCERTS 130, VILAS 269); PKQ 26.0331, 26.0424, 26.0731, 26.1461, 26.1537, 26.1662.
 *  Khí thải: bụi US EPA 5, lưu lượng US EPA 2, NOx/SO₂/CO đo hiện trường, NH₃ JIS K0099 (mg/Nm³; "<" = dưới giới hạn). Q (m³/h) là lưu lượng đo thực tế. */
export const MONITORING_2026 = [
  { date: "30/03/2026", src: "G06 · sấy số 3", dust: "15", Q: 79128, T: "—", nox: "<10", so2: "<10", co: "<10", nh3: "KPH (<0,05)", pkq: "0331" },
  { date: "06/04/2026", src: "G04 · sấy nóng số 2", dust: "18", Q: 47965, T: "—", nox: "21", so2: "<10", co: "172", nh3: "KPH (<0,05)", pkq: "0424" },
  { date: "06/04/2026", src: "G05 · sấy nguội số 2", dust: "18", Q: 42725, T: "—", nox: "<10", so2: "<10", co: "23", nh3: "KPH (<0,05)", pkq: "0424" },
  { date: "28/04/2026", src: "G02 · sấy nóng số 1", dust: "16", Q: 50260, T: "—", nox: "11", so2: "10", co: "22", nh3: "KPH (<0,3)", pkq: "0731" },
  { date: "28/04/2026", src: "G03 · sấy nguội số 1", dust: "17", Q: 50901, T: "—", nox: "<10", so2: "<10", co: "14", nh3: "0,47", pkq: "0731" },
  { date: "28/04/2026", src: "G01 · lò hơi", dust: "16", Q: 19636, T: "—", nox: "34", so2: "55", co: "68", nh3: "—", pkq: "0731" },
  { date: "30/06/2026", src: "G01 · lò hơi", dust: "19", Q: 18544, T: "86", nox: "28", so2: "49", co: "79", nh3: "—", pkq: "1461" },
  { date: "30/06/2026", src: "G06 · sấy số 3", dust: "16", Q: 77554, T: "71", nox: "<10", so2: "<10", co: "<10", nh3: "0,79", pkq: "1461" },
  { date: "06/07/2026", src: "G02 · sấy nóng số 1", dust: "13", Q: 43509, T: "50", nox: "<10", so2: "<10", co: "21", nh3: "0,62", pkq: "1537" },
  { date: "06/07/2026", src: "G03 · sấy nguội số 1", dust: "13", Q: 43503, T: "47", nox: "<10", so2: "<10", co: "25", nh3: "KPH (<0,3)", pkq: "1537" },
  { date: "17/07/2026", src: "G04 · sấy nóng số 2", dust: "13", Q: 30844, T: "57", nox: "55", so2: "<10", co: "62", nh3: "0,59", pkq: "1662" },
  { date: "17/07/2026", src: "G05 · sấy nguội số 2", dust: "14", Q: 31733, T: "57", nox: "59", so2: "<10", co: "74", nh3: "1,6", pkq: "1662" },
] as const;
/** Nước thải sau xử lý (trước khi xả ra sông Vàm Cỏ Đông): COD, TSS (mg/L); Pb, Cd, Hg, As đều KPH (LOD 0,003 / 0,0013 / 0,0002 / 0,0006). */
export const MONITORING_WATER_2026 = [
  { date: "30/03/2026", cod: 15, tss: "<4", pkq: "0331" }, { date: "30/06/2026", cod: 12, tss: "5,3", pkq: "1461" },
] as const;
/** Nội dung đề nghị điều chỉnh GPMT — Báo cáo 10/11/2026 (dây chuyền tạo hạt số 2, nguồn 04). */
export const GPMT_ADJUSTMENT = [
  ["Nhiên liệu lò sấy nóng", "Than đá (GPMT 2986)", "Biomass (trấu, mùn cưa, viên nén, củi băm, vỏ mắc ca…); 2.400 t/năm ≈ 600–660 kg/h; ẩm ≤ 20 %; than dự phòng khi thiếu sinh khối"],
  ["Lò đốt", "Than; hiệu suất trao đổi nhiệt 70 %", "Biomass 2.500.000 kcal/h; hiệu suất 85 %; thêm quạt thổi liệu 3,7 kW"],
  ["Xử lý sau lò đốt", "Không có", "Bổ sung Cyclone 1 (CT3 dày 4 mm; η > 95 %; bảo ôn 50 mm + inox 0,4 mm)"],
  ["Xử lý sau lò sấy", "Cyclone Ø2 m (thân 4,2 + chóp 1,6 m) + túi vải", "Cyclone 2 Ø2 × 6 m (η > 95 %) + túi vải 432 túi, 556 m², vận tốc lọc 1,6 m/phút (Q = 53.376 → chọn 55.000 m³/h)"],
  ["Ống thu gom", "6 mm, CT3, dài 25 m", "Ø1 m, CT3, dài 6,8 m (≈ 19,45 m/s)"],
  ["Ống khói nguồn 04", "Cao 22 m; D1 800 / D2 600 mm", "Cao 22 m; D1 2.000 / D2 1.500 mm (≈ 8,6 m/s)"],
  ["Nồng độ tính toán sau lò sấy", "—", "Bụi 26,67; SO₂ 0,09; NOx 2,06; CO 78,79 mg/m³ (hệ số WHO 2013: bụi 4,4; SO₂ 0,015; NOx 0,34; CO 13 kg/tấn củi)"],
  ["Than đá", "5.486 t/năm (lò hơi + lò đốt)", "4.286 t/năm; thêm biomass 2.400 t/năm; xỉ than 89,2 → 76,46 t/tháng; tro biomass 2,0 t/tháng"],
] as const;

/** Dây chuyền tạo hạt số 2 – Nguồn số 04 (BV CN-04-01/02, 10/2026; bộ bản vẽ lò đốt sấy nóng, Cty Nguyễn Thành Chung 2025;
 *  bản vẽ hoàn công CME: cyclone đơn CYC-HE23-02,03; lọc bụi túi LTA-432). Mục "…" là số liệu còn thiếu trong bản vẽ (đo bổ sung). */
export const LINE2_EQUIPMENT = [
  { id: "LĐ", name: "Lò đốt sinh khối", spec: "2.500.000 kcal/h; buồng đốt 1,0 × 1,4 m (1,4 m²); BSKK hiệu suất 85 %; khí nóng 160–250 °C; ≈ 2.400 tấn sinh khối/năm; nền lò 5,3 × 2,55 m, cao 5,1 m", status: "Lắp mới, thay lò đốt than" },
  { id: "CL", name: "Hệ thống cấp liệu", spec: "Hố 3 × 1,6 × 2 m; băng tải 8,5 m nghiêng 32°; phễu, vít cấp liệu, quạt thổi liệu", status: "Lắp mới" },
  { id: "CC", name: "Cyclone chùm", spec: "16 ống (4 × 4), thép CT3 dày 4 mm, bảo ôn 50 mm + inox 0,4 mm; hiệu suất > 95 %; nối tiếp giữa lò đốt và máy sấy, KHÔNG có ống thải", status: "Lắp mới" },
  { id: "QT", name: "Quạt thổi khí nóng", spec: "Lưu lượng, cột áp, công suất: … (đo bổ sung); ống Ø1.200 → côn Ø1.000", status: "Lắp mới" },
  { id: "MS", name: "Máy sấy thùng quay (máy sấy khô 1)", spec: "Ø2,2 × 22 m, 4 v/ph, nghiêng 1,5°; nhiệt độ sấy < 180 °C", status: "Hiện hữu" },
  { id: "CĐ", name: "Cyclone đơn", spec: "Ø2 × 6 m (thân 4,2 + chóp 1,6), thép 3 mm; hiệu suất > 95 %; bụi hồi lưu tạo hạt", status: "Theo Bảng 2.1 báo cáo" },
  { id: "TV", name: "Lọc bụi túi vải", spec: "432 túi Ø130 × 3.360 mm; 556 m² vải; 48 van solenoid; khí nén 6–10 kg/cm²", status: "Hiện hữu, không điều chỉnh" },
  { id: "QH", name: "Quạt hút", spec: "55.000 m³/h; 350 mmH₂O; 155 HP", status: "Hiện hữu, không điều chỉnh" },
  { id: "OK", name: "Ống khói – dòng thải 04", spec: "Cao 22 m; D1 800 / D2 600 mm; X 1172155, Y 580357 (VN2000); có vị trí lấy mẫu", status: "Hiện hữu, không điều chỉnh" },
  { id: "TH", name: "Máy tạo hạt thùng quay", spec: "Ø2,2 × 9 m; nghiêng 1,5°; 9 v/ph; 45 HP (giới thiệu Cty)", status: "Hiện hữu" },
] as const;

/** Thiết bị trên mặt bằng tổng thể phân xưởng dây chuyền 2 (bản vẽ "Mặt bằng phương án thi công"). */
export const LINE2_LAYOUT = [
  "1 Hệ thống định lượng", "2 Hệ thống máy nghiền", "3 Máy tạo hạt thùng quay", "4 Máy sấy khô 1", "5 Máy sấy khô 2", "6 Sàng quay 2 lưới", "7 Máy làm nguội",
  "8 Máy đánh bóng hạt", "9 Máy nghiền hồi lưu", "10 Cụm lò đốt", "11 Hệ thống lò hơi", "12 Máy đánh trộn liên tục", "13 Hệ thống băng tải", "14 Hệ thống gầu tải",
  "15 Hệ thống vít tải hồi lưu", "16 Hệ thống urê hóa lỏng",
] as const;

/** Gói thầu lò hơi tầng sôi ống nước 1 balong đốt sinh khối 6.000 kg/h (E-TBMT IB2600448600, mở thầu 17/09/2026). */
export const BOILER_TENDER = {
  code: "IB2600448600", opened: "17/09/2026", capacity: "6.000 kg/h",
  bids: [["NTC", 5940000000], ["Hải Âu Việt", 6048000000], ["GreenBoiler", 6600000000], ["Đông Anh", 6889999999], ["DIVI", 6975719780]],
  note: "Bảng chấm thầu còn nhiều ô “Chưa rõ”; cần đối chiếu E-HSMT gốc trước khi kết luận.",
} as const;

/** Khảo sát cải tạo HTXLNT 120 m³/ngày.đêm (Global Green, khảo sát 09/09/2026, báo cáo 14/10/2026). */
export const WWTP_RETROFIT = {
  before: "Hố thu → lắng hóa lý 1 → lắng hóa lý 2 → điều hòa → tuyển nổi → keo tụ → tạo bông → lắng bông bùn 3 → thiếu khí 1 → thiếu khí 2 → MBBR → hiếu khí → lắng hồi lưu 4 → trung gian → lọc áp lực → khử trùng → nguồn tiếp nhận",
  after: "B01 hố bơm tổng hợp → B02 tách dầu → B03 lắng sơ bộ → B04 điều hòa → B05-A keo tụ → B05-B tạo bông → B06 lắng hóa lý → B07 thiếu khí → B08 MBBR → B09 hiếu khí → B10 lắng sinh học → B11 trung gian → FT11 lọc áp lực → B12 khử trùng → B13 bể sinh thái → nguồn tiếp nhận",
  changes: [
    "Loại bỏ công đoạn tuyển nổi (nhiệm vụ tách dầu mỡ, SS chuyển cho B02 tách dầu và B03 lắng sơ bộ); điều hòa bơm thẳng sang keo tụ",
    "B02 cải tạo từ ngăn bơm nước giặt túi lọc bụi; B03 cải tạo từ ngăn bơm nước xưởng CK-XN",
    "B08 MBBR cải tạo từ bể Anoxic hiện hữu, bổ sung giá thể vi sinh và phân phối khí; B10 cải tạo từ bể lắng hồi lưu",
    "B14 bể chứa bùn hóa lý (từ ngăn lắng B02B), B15 bể chứa bùn sinh học; thêm bể sinh thái B13 trước khi xả",
    "Hai máy thổi khí (nhà điều hành) chạy luân phiên; PAC, polymer, NaOH, clorine châm bằng bơm định lượng",
  ],
  jar: "Jar test 10/09/2026: PAC 50 mg/L + PAM 2 mg/L → bông lớn, lắng nhanh; với Q = 120 m³/ngày ≈ 6,0 kg PAC/ngày và 0,24 kg PAM/ngày",
  // Nước thải đầu vào 2021–2022 (08 mẫu): [chỉ tiêu, đơn vị, min, max, trung bình, QCVN 14:2025 cột A]
  influent: [
    ["pH", "–", "6,88", "12", "–", "5–9"], ["BOD₅", "mg/L", "20", "570", "117,5", "30"], ["COD", "mg/L", "36", "1.082", "222,6", "80"],
    ["TSS", "mg/L", "30", "180", "97,4", "50"], ["Tổng nitơ", "mg/L", "23,5", "322", "119,0", "25"], ["Tổng phospho", "mg/L", "5,72", "62,0", "31,0", "4,0"],
    ["Amoni (N)", "mg/L", "20,7", "293", "101,1", "6,0"], ["Coliform", "MPN/100 mL", "14.000", "540.000", "152.875", "3.000"],
  ],
} as const;

/** Hệ thống tháp hấp thụ NH₃ — BOQ (tiền VNĐ). Tổng gồm cả phần “hạ nhiệt”: 8.437.576.000 + 14.600.083.200 = 23.037.659.200. */
export const NH3_TOWER_BOQ = {
  total: 23037659200,
  parts: [
    ["Tháp hạ nhiệt (SUS304, Ø3,5 × H10 m, T thiết kế 150 °C)", 8437576000],
    ["Tháp hấp thụ NH₃ ngược dòng (CS bọc FRP, Ø3,5 × H10 m, đệm Cascade Mini-Ring #2 30 m³, 16 vòi phun dịch, 20 vòi rửa)", 10437576000],
    ["Bồn chứa axit 98 % (15 m³) + bơm nạp + 2 bơm định lượng H₂SO₄", 336347200],
    ["Quạt ly tâm 55.000 m³/h, 55 kW, hút −450 / đẩy +50 mmH₂O, 65 °C", 574000000],
    ["Bơm dịch tuần hoàn 2 × (150 m³/h, 50 mH₂O); pH điều khiển 4,0–5,0", 981280000],
    ["Bơm dịch (NH₄)₂SO₄ + bơm tuần hoàn SA", 641880000],
    ["Điện điều khiển tại site (biến tần quạt) + theo dõi DCS", 1209000000],
    ["Chạy thử", 420000000],
  ],
  notes: "Cảnh báo ΔP tháp cao 120 mmH₂O (ngập tháp); tỷ trọng dịch SA mục tiêu 28–35 %. Đường ống nước/hóa chất/khí, xây dựng, lắp đặt: “cần khảo sát thực tế” — chưa có giá.",
} as const;

/** Bảng so sánh thiết bị lò đốt sinh khối – hệ thống sấy nóng (cập nhật 29/06/2026): [thiết bị, hiện hữu (than), điều chỉnh 2026 (sinh khối)]. */
export const FURNACE_COMPARE = [
  ["Quạt đầu vào (gió cấp oxy)", "~20.000 m³/h; cấp liệu thủ công", "5,5 kW, 10.000 m³/h, 150 mmH₂O; thêm quạt thổi liệu 3,7 kW, 6.000 m³/h"],
  ["Lò đốt", "2,5 Mkcal/h; buồng 1,76 × 2,5 = 4,4 m²; than; η 70 %; khí nóng 250–400 °C", "2,5 Mkcal/h; buồng 1,4 × 2,5 = 3,5 m²; sinh khối; η 85 %; khí nóng 160–250 °C"],
  ["Lọc bụi sau lò", "Cyclone đơn Ø2 × 6 m, CT3 4 mm, > 95 %", "Cyclone chùm; ống Ø1.200 → Ø1.000; CT3 4 mm; > 95 %; bảo ôn 50 mm + inox 304"],
  ["Quạt hút sau lọc bụi", "40.000 m³/h, 150 mmH₂O", "37 kW, 40.000 m³/h, 150 mmH₂O"],
  ["Ống cấp nhiệt / cấp liệu", "Inox 304 Ø1.000 và Ø500, dày 4 mm", "Giữ; nâng cấp vật liệu chịu nhiệt, cách nhiệt tốt hơn"],
  ["Lò sấy (máy sấy khô)", "Hiện hữu", "Giữ nguyên; chỉ thay nguồn nhiệt"],
  ["Cyclone đơn sau lò sấy", "Cyclone đơn Ø2 × 6 m", "Giữ (hoặc nâng cấp), kết hợp túi vải phía sau"],
  ["Túi vải (tay áo)", "Hiện hữu (nếu có)", "Bổ sung/nâng cấp sau cyclone đơn, hiệu suất > 99 %"],
  ["Quạt hút cuối hệ thống", "50.000 m³/h, 450 mmH₂O", "Giữ hoặc điều chỉnh theo tổng lưu lượng mới (ưu tiên 40.000 m³/h cho dòng chính)"],
  ["Ống khói", "Hiện hữu", "Giữ; kiểm tra chiều cao và đường kính theo quy chuẩn mới"],
] as const;
