// Văn bản pháp luật và quy định nội bộ — NM Phân bón Bình Điền – Long An. Cập nhật 24/11/2026.
// Nguồn: hồ sơ nhà máy, sổ tay MT–AT–PCCC (10/2026), các văn bản người dùng cung cấp. Mục `verify` = chưa có bản gốc trong repo, cần đối chiếu.
export type DocArea = "Môi trường" | "PCCC" | "Hóa chất" | "ATVSLĐ" | "Năng lượng – KNK" | "Xử phạt" | "Quy chuẩn";
export type DocStatus = "Hiệu lực" | "Sắp thay thế" | "Dự thảo" | "Hết hiệu lực";
export interface LegalDoc { no: string; title: string; area: DocArea; issuer: string; effective?: string; status: DocStatus; note?: string; verify?: boolean }
export interface InternalDoc { code: string; title: string; kind: "GPMT/ĐTM" | "Quy trình" | "Hướng dẫn" | "Quy định" | "Kế hoạch" | "Sổ tay" | "Biểu mẫu"; version: string; date?: string; owner: string; reviewDue?: string; status: "Hiệu lực" | "Cần soát xét" | "Dự thảo"; note?: string; verify?: boolean }

export const LEGAL_DOCS: LegalDoc[] = [
  // Môi trường
  { no: "72/2020/QH14", title: "Luật Bảo vệ môi trường", area: "Môi trường", issuer: "Quốc hội", effective: "01/01/2022", status: "Hiệu lực", note: "Điều 75 phân loại CTRSH 3 nhóm; Điều 74 kiểm toán môi trường (khuyến khích)" },
  { no: "08/2022/NĐ-CP", title: "Quy định chi tiết một số điều Luật BVMT", area: "Môi trường", issuer: "Chính phủ", effective: "10/01/2022", status: "Hiệu lực", note: "Điều 98 quan trắc tự động — dòng thải GPMT 2986 không thuộc diện bắt buộc" },
  { no: "02/2022/TT-BTNMT", title: "Hướng dẫn Luật BVMT (CTNH, quan trắc, báo cáo công tác BVMT)", area: "Môi trường", issuer: "Bộ TN&MT", effective: "10/01/2022", status: "Hiệu lực", note: "Căn cứ CTNH; không dùng TT 36/2015" },
  { no: "153/2024/NĐ-CP", title: "Phí BVMT đối với khí thải", area: "Môi trường", issuer: "Chính phủ", status: "Hiệu lực", note: "Kê khai theo quý, hạn ngày 20 tháng đầu quý sau — xem tab Phí BVMT", verify: true },
  { no: "346/2025/NĐ-CP", title: "Phí BVMT đối với nước thải", area: "Môi trường", issuer: "Chính phủ", status: "Hiệu lực", note: "Kê khai theo quý, hạn ngày 20 tháng đầu quý sau", verify: true },
  { no: "110/2026/NĐ-CP", title: "Trách nhiệm tái chế, xử lý chất thải của nhà sản xuất (EPR bao bì)", area: "Môi trường", issuer: "Chính phủ", status: "Hiệu lực", note: "Kê khai số liệu 2026 trước 01/04/2027; nộp Quỹ trước 20/04; xem tab EPR", verify: true },
  { no: "24/2026/TT", title: "Định mức chi phí tái chế tối thiểu Fs (dự kiến 2026)", area: "Môi trường", issuer: "Bộ", status: "Hiệu lực", note: "Tab EPR đang dùng Fs theo thông tư này — cần đối chiếu số hiệu, cơ quan ban hành", verify: true },
  { no: "119/2025/NĐ-CP; QĐ 42/2026", title: "Giảm nhẹ phát thải, kiểm kê khí nhà kính", area: "Năng lượng – KNK", issuer: "Chính phủ; UBND", status: "Hiệu lực", note: "Kiểm kê 2 năm/lần: kỳ tới (số liệu 2025–2026) nộp UBND tỉnh trước 31/03/2027", verify: true },
  // Năng lượng
  { no: "50/2010/QH12 (sửa bởi 77/2025/QH15)", title: "Luật Sử dụng năng lượng tiết kiệm và hiệu quả", area: "Năng lượng – KNK", issuer: "Quốc hội", effective: "01/01/2026", status: "Hiệu lực", note: "Cơ sở sử dụng năng lượng trọng điểm ≥ 1.000 TOE/năm; kiểm toán năng lượng 3 năm/lần — kỳ tới 2027" },
  { no: "146/2025/NĐ-CP; 53/2025/TT-BCT", title: "Danh sách cơ sở trọng điểm; chứng chỉ kiểm toán viên năng lượng", area: "Năng lượng – KNK", issuer: "Chính phủ; Bộ Công Thương", status: "Hiệu lực", verify: true },
  // PCCC
  { no: "55/2024/QH15 (VBHN 58/VBHN-VPQH 2026)", title: "Luật Phòng cháy, chữa cháy và cứu nạn, cứu hộ", area: "PCCC", issuer: "Quốc hội", effective: "01/07/2025", status: "Hiệu lực" },
  { no: "105/2025/NĐ-CP", title: "Quy định chi tiết một số điều Luật PCCC&CNCH", area: "PCCC", issuer: "Chính phủ", status: "Hiệu lực" },
  { no: "36/2025/TT-BCA", title: "Hướng dẫn Luật PCCC&CNCH và NĐ 105/2025", area: "PCCC", issuer: "Bộ Công an", status: "Hiệu lực" },
  { no: "136/2020/NĐ-CP", title: "Quy định chi tiết Luật PCCC (thẩm duyệt, nghiệm thu)", area: "PCCC", issuer: "Chính phủ", status: "Sắp thay thế", note: "Đối chiếu phần còn hiệu lực sau NĐ 105/2025" },
  // Hóa chất
  { no: "69/2025/QH15", title: "Luật Hóa chất", area: "Hóa chất", issuer: "Quốc hội", status: "Hiệu lực", note: "Thay Luật Hóa chất 2007" },
  { no: "24/2026, 25/2026, 26/2026/NĐ-CP", title: "Nghị định hướng dẫn Luật Hóa chất 2025", area: "Hóa chất", issuer: "Chính phủ", status: "Hiệu lực" },
  { no: "01/2026, 02/2026/TT-BCT", title: "Thông tư hướng dẫn Luật Hóa chất (kế hoạch ứng phó sự cố, phiếu an toàn hóa chất…)", area: "Hóa chất", issuer: "Bộ Công Thương", status: "Hiệu lực", verify: true },
  // ATVSLĐ
  { no: "84/2015/QH13", title: "Luật An toàn, vệ sinh lao động", area: "ATVSLĐ", issuer: "Quốc hội", effective: "01/07/2016", status: "Hiệu lực", note: "Luật sửa đổi trong Chương trình lập pháp 2026 — theo dõi" },
  { no: "39/2016/NĐ-CP", title: "Hướng dẫn Luật ATVSLĐ (khai báo, báo cáo TNLĐ, bộ máy)", area: "ATVSLĐ", issuer: "Chính phủ", status: "Hiệu lực" },
  { no: "44/2016/NĐ-CP (sửa bởi 140/2018/NĐ-CP)", title: "Kiểm định, huấn luyện, quan trắc môi trường lao động", area: "ATVSLĐ", issuer: "Chính phủ", status: "Hiệu lực", note: "Huấn luyện Điều 19; việc phải làm khi KQ QTMTLĐ không đạt — Điều 37" },
  { no: "60/2025/TT-BYT", title: "Danh mục 35 bệnh nghề nghiệp được bảo hiểm", area: "ATVSLĐ", issuer: "Bộ Y tế", effective: "15/02/2026", status: "Hiệu lực", note: "Thay TT 15/2016 và TT 02/2023" },
  { no: "24/2022/TT-BLĐTBXH", title: "Bồi dưỡng bằng hiện vật cho người làm việc trong điều kiện nặng nhọc, độc hại", area: "ATVSLĐ", issuer: "Bộ LĐTBXH", status: "Hiệu lực", verify: true },
  { no: "QCVN 24:2016/BYT; QCVN 26:2016/BYT", title: "Tiếng ồn (85 dBA/8 giờ); vi khí hậu", area: "Quy chuẩn", issuer: "Bộ Y tế", status: "Hiệu lực", note: "Dùng đối chiếu KQ QTMTLĐ 2026" },
  // Xử phạt
  { no: "45/2022/NĐ-CP", title: "Xử phạt vi phạm hành chính trong lĩnh vực BVMT", area: "Xử phạt", issuer: "Chính phủ", status: "Hiệu lực", note: "Dự thảo thay thế (04/2026) chưa ban hành. Thời hiệu 02 năm; tổ chức × 2" },
  { no: "106/2025/NĐ-CP (sửa bởi 69/2026/NĐ-CP)", title: "Xử phạt vi phạm hành chính trong lĩnh vực PCCC&CNCH", area: "Xử phạt", issuer: "Chính phủ", effective: "01/07/2025", status: "Hiệu lực", note: "NĐ 69/2026 hiệu lực 20/04/2026. Tối đa 50 triệu cá nhân, tổ chức × 2" },
  { no: "283/2026/NĐ-CP", title: "Xử phạt vi phạm hành chính về lao động, ATVSLĐ, BHXH", area: "Xử phạt", issuer: "Chính phủ", effective: "10/09/2026", status: "Hiệu lực", note: "Thay NĐ 12/2022. Tổ chức × 2; thời hiệu 01 năm" },
  // Quy chuẩn môi trường
  { no: "QCVN 19:2009/BTNMT", title: "Khí thải công nghiệp đối với bụi và các chất vô cơ", area: "Quy chuẩn", issuer: "Bộ TN&MT", status: "Hiệu lực", note: "GPMT 2986: cột B, Kp 0,8, Kv 1,0 (bụi 160, SO₂ 400, NOx 680, CO 800 mg/Nm³)" },
  { no: "QCVN 21:2009/BTNMT", title: "Khí thải công nghiệp sản xuất phân bón hóa học", area: "Quy chuẩn", issuer: "Bộ TN&MT", status: "Hiệu lực", note: "Dòng 02–07; NH₃ 40 mg/Nm³ (Kp 0,8)" },
  { no: "QCVN 40:2011/BTNMT", title: "Nước thải công nghiệp", area: "Quy chuẩn", issuer: "Bộ TN&MT", status: "Hiệu lực", note: "Cột A × Kq 1,2 × Kf 1,1 theo GPMT. Báo cáo khảo sát cải tạo so với QCVN 14:2025 — cần chốt quy chuẩn" },
  { no: "QCVN 05:2023/BTNMT", title: "Chất lượng không khí xung quanh", area: "Quy chuẩn", issuer: "Bộ TN&MT", status: "Hiệu lực", note: "Dùng trong mô hình Gauss (trung bình 1 giờ)" },
];

export const INTERNAL_DOCS: InternalDoc[] = [
  { code: "2986/GPMT-STNMT", title: "Giấy phép môi trường (công suất 600.000 tấn/năm; hiệu lực đến 27/04/2033)", kind: "GPMT/ĐTM", version: "28/04/2023", date: "28/04/2023", owner: "Cán bộ MT", status: "Hiệu lực", note: "Đang hồ sơ điều chỉnh (lò hơi sinh khối, lò sấy TH2) — chưa được chấp thuận; xem tab GPMT" },
  { code: "3383/QĐ-STNMT", title: "Quyết định phê duyệt báo cáo ĐTM", kind: "GPMT/ĐTM", version: "15/10/2020", date: "15/10/2020", owner: "Cán bộ MT", status: "Hiệu lực" },
  { code: "MT-QT01", title: "Quy trình nhận diện khía cạnh môi trường (ISO 6.1.2)", kind: "Quy trình", version: "Chưa soát xét (ban hành 2018)", owner: "Cán bộ MT", reviewDue: "2026-12-24", status: "Cần soát xét", note: "Bảng đánh giá 2017–2018 chưa chấm lò hơi, tạo hạt; đề xuất sửa lần 02", verify: true },
  { code: "MT-QT02", title: "Quy trình kiểm tra hiện trường (ngày BM3, tuần BM2)", kind: "Quy trình", version: "2018", owner: "Cán bộ MT", reviewDue: "2026-12-24", status: "Cần soát xét", verify: true },
  { code: "MT-QT03", title: "Quy trình kiểm soát vi phạm, biên bản MT-QT03-BM02", kind: "Quy trình", version: "2018", owner: "Cán bộ MT", reviewDue: "2026-12-24", status: "Cần soát xét", verify: true },
  { code: "MT-QT04", title: "Quản lý thay đổi (MT-QT04-BM01)", kind: "Quy trình", version: "Lần 01", owner: "Cán bộ MT", status: "Hiệu lực" },
  { code: "MT-HD01", title: "Hướng dẫn tiết kiệm tài nguyên (điện, nước, giấy)", kind: "Hướng dẫn", version: "2018", owner: "Cán bộ MT", reviewDue: "2026-12-24", status: "Cần soát xét", verify: true },
  { code: "MT-HD02", title: "Hướng dẫn quản lý hóa chất (MT-HD02-BM01)", kind: "Hướng dẫn", version: "2018", owner: "Cán bộ MT", reviewDue: "2026-12-24", status: "Cần soát xét", note: "Đối chiếu Luật Hóa chất 69/2025 và NĐ 24–26/2026", verify: true },
  { code: "MT-HD03", title: "Hướng dẫn quản lý chất thải nguy hại (kèm nội quy MT-HD03-NQ)", kind: "Hướng dẫn", version: "2018", owner: "Cán bộ MT", reviewDue: "2026-12-24", status: "Cần soát xét", note: "Căn cứ TT 02/2022/TT-BTNMT; dầu nhớt thải chỉ chuyển giao đơn vị có phép", verify: true },
  { code: "MT-HD04", title: "Kiểm soát nước thải (HTXLNT 120 m³/ngày đêm)", kind: "Hướng dẫn", version: "Lần 02", owner: "Cán bộ MT", status: "Hiệu lực", note: "Biểu mẫu BM01–BM06, MT-HD04-03" },
  { code: "MT-HD05", title: "Kiểm soát khí thải (lọc bụi, tháp hấp thụ, nồi hơi)", kind: "Hướng dẫn", version: "Lần 02", owner: "Cán bộ MT", status: "Hiệu lực", note: "Biểu mẫu BM02–BM05; MT-HD05-03, -04 còn cấu trúc cũ — đồng bộ giới hạn theo GPMT 2986" },
  { code: "MT-HD06", title: "Hướng dẫn ứng phó sự cố môi trường", kind: "Hướng dẫn", version: "2018", owner: "Cán bộ MT", reviewDue: "2026-12-24", status: "Cần soát xét", verify: true },
  { code: "MT-HD07", title: "Kiểm soát nhà thầu (MT-HD07-01…07)", kind: "Hướng dẫn", version: "Lần 02", owner: "Cán bộ MT", status: "Hiệu lực" },
  { code: "MT-QP.01", title: "Quy định thi đua, chấm điểm vệ sinh công nghiệp – môi trường", kind: "Quy định", version: "Chưa ban hành lại", owner: "Cán bộ MT", status: "Dự thảo", note: "Dự thảo 2024 còn 10 lỗi (chép từ đơn vị khác, Kp 0,9 sai, ghi quan trắc tự động bắt buộc) — viết lại; không ghi phạt tiền người lao động", verify: true },
  { code: "Sổ tay MT–AT–PCCC", title: "Sổ tay hệ thống quản lý môi trường – an toàn – PCCC NM Long An", kind: "Sổ tay", version: "Lần 02 (10/10/2026)", date: "10/10/2026", owner: "Cán bộ MT", reviewDue: "2026-12-24", status: "Hiệu lực", note: "Xóa phụ lục ghi chú nội bộ trước khi ban hành" },
  { code: "385/2026/QĐ-KS.BĐ", title: "Biện pháp phòng ngừa, ứng phó sự cố hóa chất (lần 03)", kind: "Quy định", version: "Lần 03 (05/05/2026)", date: "22/04/2026", owner: "P. KT-SX", status: "Hiệu lực", note: "Số lò hơi trong Biện pháp (02 lò 8 t/h) lệch GPMT (01 lò)" },
  { code: "759/QĐ.KS-BĐ", title: "Nội quy phòng cháy, chữa cháy và cứu nạn, cứu hộ", kind: "Quy định", version: "07/09/2026", date: "07/09/2026", owner: "PTGĐ Võ Văn Phu", status: "Hiệu lực" },
  { code: "199/QĐ.KS-BĐ", title: "07 nội quy, hướng dẫn vận hành an toàn thiết bị", kind: "Quy định", version: "14/09/2026", date: "14/09/2026", owner: "PTGĐ Võ Văn Phu", status: "Hiệu lực" },
  { code: "Quy định tuân thủ MT nội bộ", title: "Quyết định + Quy định tuân thủ môi trường, phân loại chất thải tại nguồn", kind: "Quy định", version: "04/10/2026", date: "04/10/2026", owner: "P. KT-SX", status: "Hiệu lực", note: "Màu thùng: xanh lá thực phẩm, xanh dương tái chế, xám khác, đỏ CTNH" },
  { code: "Kế hoạch KTMT–NL–ESG 2026–2030", title: "Kế hoạch kiểm toán môi trường – năng lượng, ESG/GRI/VRCC", kind: "Kế hoạch", version: "04/10/2026", date: "04/10/2026", owner: "P. KT-SX", status: "Hiệu lực" },
  { code: "Bộ bảng kiểm tra tuân thủ", title: "Checklist tuân thủ NĐ 45/2022, NĐ 106/2025 + NĐ 69/2026, NĐ 283/2026 (Phụ lục 4 Sổ tay)", kind: "Biểu mẫu", version: "10/10/2026", date: "10/10/2026", owner: "Cán bộ MT", status: "Hiệu lực" },
  { code: "ISO 14001:2015", title: "Chứng nhận HTQLMT QA-D/VN/14001/0012 (QATECHNIC)", kind: "Sổ tay", version: "Hết hạn 24/12/2026", date: "2026-12-24", owner: "P. KT-SX", reviewDue: "2026-12-24", status: "Cần soát xét", note: "Soát xét tài liệu, đánh giá nội bộ, xem xét lãnh đạo trước mốc này" },
];
