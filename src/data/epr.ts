// Dữ liệu từ Tờ trình Phòng KT-SX (tháng 11/2026) "Báo cáo tình hình thực hiện trách nhiệm tái chế bao bì (EPR) … theo Nghị định 110/2026/NĐ-CP".
export const EPR_DECLARATIONS = [
  { key: "d2025", label: "Kê khai 28/3/2025 (số liệu năm 2024)", v: 990_699.04, r: 0.1, fs: 8486, f: 840_707_206, status: "Đã ký, nộp đúng hạn 31/3; nộp tiền trước 20/4/2025", paid: true },
  { key: "d2026", label: "Kê khai 24/3/2026 (số liệu năm 2025)", v: 1_112_754.72, r: 0.1, fs: 8486, f: 944_283_656, status: "Đã ký 24/3/2026; cần xác nhận với Phòng Kế toán chứng từ nộp Quỹ trước 20/4/2026", paid: false },
] as const;
export const EPR_QUOTE = { no: "BG171126/10", date: "17/11/2026", valid: "31/12/2026", company: "Công ty CP Tái chế Nhựa Eco Revive", address: "Lô A2-1, đường số 2, KCN Anh Hồng – Đức Hòa III, xã Đức Lập, Tây Ninh", kg: 5500, tol: 0.1, price: 5500, priceVat: 5940, period: "6 tháng đầu 2027", pay: "15 ngày kể từ ngày nhận đủ hồ sơ hợp lệ" } as const;
export const EPR_TIMELINE = [
  ["Trước 01/04/2027", "Kê khai và đăng ký kế hoạch tái chế trên Hệ thống thông tin EPR quốc gia (số liệu năm 2026); nếu đóng góp Quỹ: nộp tiền theo Điều 8 (kỳ trước nộp trước 20/4 — cần xác nhận mốc theo NĐ 110/2026)"],
  ["01/01/2027 – 31/12/2027", "Thực hiện tái chế (nếu chọn Phương án 2 — hợp đồng đơn vị tái chế); báo giá Eco Revive thực hiện trong 6 tháng đầu 2027"],
  ["Trước 01/04/2028", "Báo cáo kết quả tái chế năm 2027 (khi tự tổ chức/thuê đơn vị tái chế); chứng từ giao nhận riêng biệt với chất thải khác (Điều 6 khoản 6)"],
  ["31/12/2026", "Hết hiệu lực báo giá Eco Revive BG171126/10"],
] as const;
export const EPR_CHECKLIST = [
  { key: "gpmt", label: "Hồ sơ Giấy phép môi trường của đơn vị tái chế (Eco Revive) — Điều 6 khoản 4" },
  { key: "handover", label: "Cơ chế xác nhận khối lượng, biên bản giao nhận (mẫu chứng từ CTR công nghiệp thông thường, Điều 6 khoản 6)" },
  { key: "capacity", label: "Khả năng nâng khối lượng nhận lên ≈ 111 tấn/năm, năng lực tiếp nhận bao PP dệt lẫn phân bón" },
  { key: "quotes", label: "Đủ tối thiểu 03 báo giá (hiện 1: Eco Revive; mời thêm Duy Tân Recycling – CCN Đức Hòa Hạ, Tây Ninh, 100.000 t/năm)" },
  { key: "toll", label: "Rà soát hợp đồng gia công — nếu nhận gia công thì bên đặt gia công chịu trách nhiệm EPR (Điều 4 khoản 1 điểm b), tránh kê khai trùng" },
  { key: "v2026", label: "Phòng Kế toán chốt khối lượng bao bì đưa ra thị trường 2026 (số bao theo quy cách × khối lượng bao mẫu) và xác nhận ngưỡng miễn trừ doanh thu 30 tỷ đồng/năm" },
] as const;
export const EPR_NOTES = [
  "Bao PP dệt có lớp lót kê khai mã A.3.4.1 (bao bì đơn vật liệu mềm) — đúng theo Phụ lục I NĐ 110/2026; Fs đơn vật liệu giảm 8.486 → 8.320 đ/kg, đa vật liệu 10.914 → 10.700 đ/kg (≈ −1,96 %); R giữ 10 %.",
  "Báo giá Eco Revive chỉ chào 5.500 kg/năm (±10 %) — chỉ ≈ 5 % khối lượng bắt buộc ≈ 111 tấn; con số tiết kiệm ≈ 264,8 triệu đ/năm của Tờ trình chỉ đúng nếu đơn vị nhận đủ khối lượng.",
  "Tờ trình nêu \"05 nội dung cần làm rõ\" nhưng liệt kê 04 gạch đầu dòng — danh sách kiểm tra bên dưới gộp thêm 02 mục từ phần đề xuất (báo giá, hợp đồng gia công, số liệu 2026).",
  "Mức Fs 8.320 đ/kg là \"dự kiến\" theo Thông tư 24/2026 — số liệu chính thức khi kê khai kỳ 2026.",
] as const;
