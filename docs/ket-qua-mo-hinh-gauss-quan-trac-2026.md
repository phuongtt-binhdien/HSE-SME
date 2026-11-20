# Kết quả chạy mô hình Gauss — số liệu quan trắc khí thải định kỳ 2026

Nhà máy Phân bón Bình Điền – Long An. Số liệu: TT Kỹ thuật Tài nguyên và Môi trường Tây Ninh (VILAS 269).

- Đợt 1: phiếu 0331/2026/DV (lấy mẫu 30/3), 0424/2026/DV (06/4), 0731/2026/DV (28/4).
- Đợt 2: phiếu 1461/2026/DV (30/6), 1537/2026/DV (06/7), 1662/2026/DV (17/7).

Phương pháp (cập nhật 20/11/2026 theo EPA ISC3 Volume II): mô hình vệt khói Gauss; σy, σz Pasquill–Gifford (công thức ISC3, nông thôn); gió quy đổi về độ cao ống khói theo hàm mũ; cuốn xuống đỉnh ống khói (stack-tip downwash); độ nâng Briggs do lực nổi hoặc động lượng (chọn theo chênh nhiệt điểm giao ΔTc); phản xạ mặt đất và lớp xáo trộn theo SCREEN3 (max(320·u₁₀, Hₑ + 1) m với lớp A–D). Sàng lọc 54 tổ hợp lớp ổn định × tốc độ gió theo SCREEN3; với tổ hợp nhiều nguồn thêm 36 hướng gió và lưới tiếp nhận 2 × 2 km bước 25 m, độ cao 1,5 m. Nm³ ở 25 °C theo QCVN 19:2009. So sánh với giới hạn 1 giờ QCVN 05:2023/BTNMT; **chưa cộng nồng độ nền**.

## 1. Lò hơi — nguồn số 01 (ống khói 18 m, Ø700 mm)

| Đợt | Lưu lượng (m³/h) | Bụi | SO₂ | NOₓ | CO (mg/Nm³) |
|---|---|---|---|---|---|
| 1 (28/4) | 19.636 | 16 | 55 | 34 | 68 |
| 2 (30/6, 86 °C) | 18.544 | 19 | 49 | 28 | 79 |

Nồng độ 1 giờ lớn nhất tại mặt đất (giá trị lớn nhất 2 đợt): lớp C, gió 2,5 m/s, cách ống khói ≈ 370 m.

| Thông số | Cmax (μg/m³) | % QCVN 05:2023 (1 giờ) |
|---|---|---|
| Bụi TSP | 3,7 | 1,2 % |
| SO₂ | 10,8 | 3,1 % |
| NO₂ | 6,7 | 3,3 % |
| CO | 15,5 | 0,1 % |

NOₓ thực đo 28–34 mg/Nm³, chỉ khoảng 5 % giới hạn QCVN 19:2009 cột B (680 mg/Nm³). Kịch bản giả định "lò than xả bằng giới hạn GPMT" cho kết quả cao hơn khoảng 20 lần; xem tab GPMT Nguồn 01 trong app.

## 2. Toàn nhà máy — 6 ống khói cùng hoạt động

Giá trị lớn nhất mỗi chất trong 2 đợt × lưu lượng lớn nhất của mỗi ống (bảo thủ); ống sấy giả định cao 15 m.

| Thông số | Cmax tổng (μg/m³) | % QCVN 05 | Vị trí, điều kiện | Nguồn đóng góp chính |
|---|---|---|---|---|
| Bụi TSP | 43,4 | 14 % | 317 m từ lò hơi; lớp C, gió 2,5 m/s | Sấy DC1 (48 %), DC2 (35 %) |
| SO₂ | 33,4 | 10 % | 334 m; lớp C, 2,5 m/s | Lò hơi 32 %, DC1 35 % |
| NO₂ | 70,1 | 35 % | 538 m; lớp C, 2,5 m/s | Sấy nóng + nguội DC2 (73 %) |
| CO | 154,4 | 0,5 % | 284 m; lớp C, 2,5 m/s | Sấy nóng DC2 (55 %) |
| NH₃ | 1,9 | 0,9 % | 271 m; lớp C, 3 m/s | Các lò sấy |

Độ nhạy theo chiều cao ống sấy (chưa có trong bản vẽ hoàn công):

| Chiều cao ống sấy | NO₂ | Bụi TSP | SO₂ |
|---|---|---|---|
| 10 m | 92,0 (46 %) | 58,0 (19 %) | 39,4 (11 %) |
| 15 m | 70,1 (35 %) | 43,4 (14 %) | 33,4 (10 %) |
| 20 m | 57,9 (29 %) | 34,9 (12 %) | 28,9 (8 %) |

Theo từng đợt (ống sấy 15 m): NO₂ đợt 1 = 35,1 μg/m³ (18 %), đợt 2 = 63,6 μg/m³ (32 %) — tăng do NOₓ lò sấy DC2 tăng từ 21/<10 lên 55/59 mg/Nm³.

So với lần chạy trước (σ Briggs 1973, chưa có cuốn xuống đỉnh ống, độ nâng động lượng và lớp xáo trộn), kết quả ISC3 thấp hơn khoảng 20–35 %: σz Pasquill–Gifford lớp A gần nguồn nhỏ hơn Briggs nên điều kiện bất lợi nhất chuyển sang lớp C.

## 3. So sánh các sơ đồ tính (Giáo trình Kiểm soát ô nhiễm không khí, mục 1.2.2)

Nguồn 01, NO₂ 1 giờ lớn nhất (sàng lọc 54 tổ hợp khí tượng), μg/m³ và % QCVN 05:2023:

| Sơ đồ | Lò than @ giới hạn GPMT (NOₓ 680 mg/Nm³) | Lò than thực đo (NOₓ 34 mg/Nm³) |
|---|---|---|
| σ Pasquill–Gifford (ISC3) + độ nâng ISC3 — **mặc định** | 141 (71 %) | 6,7 (3 %) |
| σ Briggs 1973 + độ nâng ISC3 | 219 (109 %) | 10,3 (5 %) |
| σ Hà Lan (Bảng 1.2), z₀ = 0,1–0,3 m + độ nâng ISC3 | 63–64 (31–32 %) | 3,0 (1–2 %) |
| σ Pasquill–Gifford + độ nâng theo Q_H (PT 1.9–1.13) | 137 (69 %) | 6,5 (3 %) |

Công thức độ nâng (ISC3 hay theo hàm nhiệt Q_H) lệch nhau < 3 %; sơ đồ hệ số phân tán quyết định kết quả. σ Hà Lan ứng với thời gian trung bình 1 giờ và có độ nhám nên rộng hơn, cho nồng độ khoảng một nửa so với Pasquill–Gifford. Hồ sơ pháp lý nên dùng Pasquill–Gifford (ISC3) — bảo thủ hơn và là sơ đồ của mô hình pháp quy US EPA; các sơ đồ khác dùng để đánh giá độ nhạy.

## 4. Giả định và hạn chế

- Chiều cao ống khói lò sấy chưa có trong bản vẽ hoàn công → giả định 15 m, có bảng độ nhạy 10–20 m. Đường kính: Ø1,2 m (DC1, DC2) theo ống dẫn của lọc bụi 55.000 m³/h; Ø1,8 m (DC3) theo bản vẽ trạm quan trắc tự động.
- Đợt 1 không đo nhiệt độ → lấy theo đợt 2 cùng ống khói. "<10" lấy bằng 10; "KPH" lấy bằng LOD.
- Tọa độ ống sấy nóng DC1 khác nhau giữa 2 đợt (Y = 580263 ở đợt 1, 580277 ở đợt 2) → dùng đợt 1.
- Chưa cộng nồng độ nền; không xét cuốn xuống do nhà xưởng (building downwash — ống khói ngắn so với mái nhà xưởng cao +9,7 – +10,5 m), lắng đọng, chuyển hóa; NOₓ coi toàn bộ là NO₂.
- Kết quả là sàng lọc 1 giờ trong điều kiện bất lợi nhất, không phải nồng độ trung bình năm.

Chạy lại: `npm run model:plant -- 15 all max` (chiều cao ống sấy, chế độ, đợt).
