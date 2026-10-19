# Kế hoạch phát triển EHSViet theo chu trình PDCA

- **Phạm vi:** phần mềm quản lý HSE toàn diện cho nhà máy phân bón NPK (mẫu: NM Phân bón Bình Điền – Long An).
- **Thời gian:** 13 tuần, từ 18/10/2026 đến 18/01/2027.
- **Căn cứ pháp lý:** rà soát đến 10/2026. Điểm nào chưa đối chiếu toàn văn thì ghi "(đối chiếu)" ngay tại chỗ.

## 1. Mục tiêu

Một phần mềm dùng chung cho cả nhà máy, quản lý con người, thiết bị, hóa chất, chất thải, năng lượng – KNK và ESG. Các phân hệ chạy khép kín theo vòng PDCA (điều 6–10 của ISO 14001:2015 và ISO 45001:2018).

| Bước | Nội dung quản lý trong phần mềm |
|---|---|
| **P – Kế hoạch** | Kế hoạch HSE năm; lộ trình hồ sơ môi trường 5 năm (2026–2030); lộ trình Net Zero 2050; lịch nghĩa vụ pháp lý; tổ chức bộ máy HSE theo quy định |
| **D – Thực hiện** | Huấn luyện; diễn tập theo từng người; thiết bị (hư hỏng → sửa chữa → nghiệm thu → vận hành hoặc thanh lý); hóa chất (mua → nhập kho → sử dụng tại phòng thí nghiệm, HTXLNT, sản xuất → thải bỏ); chất thải – CTNH; vận hành công trình BVMT; EPR bao bì; kinh tế tuần hoàn |
| **C – Kiểm tra** | Chương trình kiểm tra (tổng thể 03 tháng/lần, hằng tuần theo quy định nhà máy, PCCC hằng tuần, VSCN hằng tháng); quan trắc môi trường; QTMTLĐ và khám sức khỏe; KNK – GRI – ESG |
| **A – Cải tiến** | Hành động khắc phục – phòng ngừa (CAPA) tập trung, có hạn, người chịu trách nhiệm, xác nhận hiệu lực; sự cố; vi phạm nội quy |

**Chỉ tiêu nghiệm thu:**
- 100% người lao động có hồ sơ HSE cá nhân: huấn luyện (khóa – ngày – quyết định – hạn), diễn tập (loại – ngày – có tham gia hay không), sức khỏe. Cảnh báo trước 30 ngày khi hết hạn.
- 100% thiết bị có yêu cầu nghiêm ngặt về ATVSLĐ có hạn kiểm định.
- Mọi biên bản hư hỏng được theo dõi đến khi nghiệm thu (an toàn đạt hoặc không đạt), sau đó đưa vào vận hành hoặc thanh lý. Có cảnh báo quá hạn và ghi rõ đơn vị sửa: Tổ Cơ điện hay thuê ngoài.
- ≥ 95% kỳ kiểm tra trong chương trình làm đúng kỳ. 100% mục không đạt có CAPA.
- Báo cáo năm 2026 lấy số liệu từ phần mềm: BC công tác ATVSLĐ và BC y tế lao động (hạn 10/01/2027), BC công tác BVMT (hạn 15/01/2027).

## 2. Phân hệ

| PDCA | Phân hệ (đường dẫn) | Chức năng | Căn cứ chính |
|---|---|---|---|
| P | Kế hoạch & lộ trình (`/ke-hoach`) | Hạng mục kế hoạch năm, 5 năm, Net Zero: KPI, người chủ trì, hạn, kinh phí, tiến độ %. Biểu đồ KNK thực tế so với lộ trình | ISO 14001 điều 6.2; NĐ 06/2022 sửa bởi NĐ 119/2025, NĐ 83/2026; QĐ 896/QĐ-TTg (2022) |
| P | Tổ chức bộ máy (`/to-chuc`) | Tự tính số người phải bố trí theo số lao động và ngành nghề; so với phân công thực tế; cảnh báo người được phân công chưa còn hạn huấn luyện | Luật ATVSLĐ 2015 Điều 72–75; NĐ 39/2016 Điều 36–38; Luật PCCC và CNCH 2024; NĐ 105/2025; Luật SDNL TKHQ sửa bởi Luật 77/2025 |
| P | Hồ sơ & nghĩa vụ (`/tuan-thu`) | Lịch 24 nghĩa vụ định kỳ, giấy phép, hồ sơ pháp lý | Đã có |
| D | Nhân sự & Huấn luyện (`/nhan-su`) | Ma trận huấn luyện; **diễn tập theo người** (PCCC, sự cố môi trường – chất thải, hóa chất); hồ sơ HSE cá nhân | NĐ 44/2016 Điều 19; NĐ 105/2025; NĐ 45/2022 Điều 40 |
| D | Thiết bị & bảo trì (`/thiet-bi`) | Danh mục; biên bản hư hỏng; sửa chữa (Tổ Cơ điện hoặc thuê ngoài, hạn hoàn thành); nghiệm thu an toàn; đưa vào vận hành hoặc thanh lý; kiểm định thiết bị nghiêm ngặt | Luật ATVSLĐ Điều 30–31; TT 36/2019/TT-BLĐTBXH; NĐ 283/2026 Điều 35 |
| D | Hóa chất (`/hoa-chat`) | Danh mục (CAS, phân loại nguy hại, nhóm pháp lý, PATHH); nhập (nhà cung cấp, hóa đơn, giấy phép bên bán); xuất cho PTN, HTXLNT, sản xuất; tồn kho; định mức; báo cáo quý | Luật Hóa chất 69/2025; NĐ 25/2026, 26/2026; TT 02/2026/TT-BCT |
| D | EPR & tuần hoàn (`/tuan-hoan`) | Kê khai EPR (V × R × Fs), hạn kê khai – nộp; dòng tuần hoàn (bụi hồi lưu, hạt ngoài cỡ, nước, xỉ, bao bì); phương pháp xử lý chất thải → GRI 306-4/306-5; đối chiếu tiêu chí tuần hoàn | NĐ 08/2022 sửa bởi NĐ 05/2025; NĐ 110/2026; QĐ 46/2026/QĐ-TTg PL II |
| D | Chất thải, Vận hành, PCCC & An toàn | Đã có, nối thêm vào CAPA và Tổng quan | — |
| C | Kiểm tra định kỳ (`/kiem-tra`) | Chương trình kiểm tra; lịch kỳ (đã làm / bỏ sót / đến kỳ); thực hiện theo checklist; mục không đạt → CAPA | Quy định nội bộ; ISO 14001 điều 9.1; NĐ 106/2025 Điều 10 k3 |
| C | Sức khỏe nghề nghiệp, ESG · GRI · KNK | Đã có; bổ sung GRI 301, 306-4, 306-5 lấy từ phân hệ mới | — |
| A | Hành động khắc phục (`/khac-phuc`) | CAPA từ kiểm tra, sự cố, thiết bị, QTMTLĐ, đánh giá nội bộ; xác nhận hiệu lực | ISO 14001 điều 10.2 |
| A | Nội quy & Vi phạm | Đã có | — |
| — | Tổng quan PDCA (`/`) | 4 khối P – D – C – A; danh sách cảnh báo ưu tiên từ mọi phân hệ | — |

## 3. Trả lời các câu hỏi nghiệp vụ

### 3.1 Bộ máy HSE theo quy định

Phân hệ "Tổ chức bộ máy" tự tính theo **tổng số lao động thực tế** và so với người đã được phân công. Các mức tối thiểu:

| Vị trí | Yêu cầu tối thiểu | Căn cứ |
|---|---|---|
| Người làm công tác ATVSLĐ (ngành sản xuất hóa chất, phân bón) | < 50 LĐ: 01 bán chuyên trách<br>50 – < 300: 01 chuyên trách<br>300 – < 1.000: 02 chuyên trách<br>≥ 1.000: 03 chuyên trách hoặc phòng ATVSLĐ riêng | NĐ 39/2016 Điều 36 k1 a. Chế tài: NĐ 283/2026 Điều 32 k2 |
| Người làm công tác y tế (cùng nhóm ngành) | < 300: 01 người trình độ trung cấp<br>300 – < 500: 01 bác sĩ hoặc y sĩ + 01 người<br>500 – < 1.000: 01 bác sĩ + 01 người | NĐ 39/2016 Điều 37 (đối chiếu mức ≥ 1.000) |
| Hội đồng ATVSLĐ cơ sở | Bắt buộc từ 300 LĐ | Luật ATVSLĐ Điều 75; NĐ 39/2016 |
| An toàn, vệ sinh viên | Mỗi tổ sản xuất ≥ 01 người, kiêm nhiệm | Luật ATVSLĐ Điều 74 |
| Môi trường | Luật không quy định số người. Phải có bộ phận hoặc nhân sự phụ trách BVMT, và người vận hành công trình xử lý được đào tạo | Tiêu chí ESG 1.13 (QĐ 46/2026) |
| PCCC | Không bắt buộc chuyên trách. Phải có đội PCCC cơ sở kiêm nhiệm, được huấn luyện. Biên chế tham chiếu: > 50 người thường xuyên làm việc thì ≥ 15 người, có đội trưởng, đội phó; làm việc theo ca thì mỗi ca có tổ PCCC | Luật PCCC và CNCH 2024; NĐ 105/2025 (đối chiếu biên chế). Không có đội: NĐ 106/2025 Điều 8 k4, phạt 10–20 triệu |
| Năng lượng | Cơ sở sử dụng năng lượng trọng điểm (≥ 1.000 TOE/năm) phải có người quản lý năng lượng có chứng chỉ | Luật 50/2010 sửa bởi Luật 77/2025; TT 53/2025/TT-BCT |

### 3.2 PCCC có phải kiểm tra vận hành hệ thống 01 tuần/lần?

**Không có văn bản quy phạm nào ấn định chung "01 tuần/lần" cho toàn hệ thống.**

- **Luật và nghị định** (Luật PCCC và CNCH 2024, NĐ 105/2025) buộc người đứng đầu cơ sở:
  - tổ chức tự kiểm tra thường xuyên và định kỳ;
  - bảo dưỡng phương tiện PCCC theo tiêu chuẩn và hướng dẫn của nhà sản xuất.
- **Chế tài** (NĐ 106/2025 sửa bởi NĐ 69/2026):
  - không tự kiểm tra định kỳ: Điều 10 k3, phạt 10–20 triệu;
  - không bảo dưỡng phương tiện: Điều 22.
- **Tần suất kỹ thuật** lấy theo:
  - TCVN 3890:2023 (phương tiện PCCC – kiểm tra, bảo dưỡng);
  - TCVN 5738:2021 (báo cháy tự động);
  - tài liệu của nhà sản xuất bơm.

**Mặc định đặt trong phần mềm** (chỉnh được theo quy định nhà máy):

| Tần suất | Nội dung |
|---|---|
| Hằng ngày | Tủ trung tâm báo cháy, thường trực |
| Hằng tuần | Chạy thử bơm chữa cháy (điện, diesel); bơm bù áp; áp lực đường ống; mức nước bể; nhiên liệu diesel |
| Hằng tháng | Bình chữa cháy, tủ vách tường (theo MT-HD01) |
| 03 tháng/lần | Tự kiểm tra PCCC theo checklist NĐ 106/2025 |
| Hằng năm | Bảo dưỡng toàn hệ thống; thực tập phương án chữa cháy |

Cần đối chiếu nguyên văn TCVN 3890:2023 trước khi ban hành tần suất chính thức.

### 3.3 Hồ sơ môi trường: ngắn hạn 5 năm và dài hạn Net Zero 25 năm

Phần mềm có sẵn bộ mẫu. Mỗi hạng mục ghi căn cứ, người chủ trì, hạn và tiến độ.

**5 năm (2026–2030):**

| Năm | Hạng mục |
|---|---|
| 2026 | Tái chứng nhận ISO 14001 (12/2026) |
| 2027 | BC kiểm kê KNK cơ sở, số liệu 2025–2026 (trước 31/3/2027); BC giảm nhẹ KNK hằng năm từ 2027; KTNL bắt buộc (03 năm/lần); chuyển sang báo cáo theo GRI 102/103 từ kỳ 2027 |
| 2028 | Rà soát GPMT khi thay đổi nhiên liệu hoặc công trình (điều chỉnh GPMT nếu thuộc diện); cập nhật kế hoạch ứng phó sự cố |
| 2029 | BC kiểm kê KNK, số liệu 2027–2028; tái chứng nhận ISO 14001; rà soát lộ trình QCVN 19:2024 (TT 45/2024) |
| 2030 | KTNL; tổng kết kế hoạch giảm nhẹ 2026–2030; lập kế hoạch 2031–2035; chuẩn bị đáp ứng QCVN 40:2025 (cơ sở hiện hữu: hạn 31/12/2031) |

**Net Zero 2050 – lộ trình tham chiếu:**

- **Bối cảnh quốc gia:**
  - Việt Nam cam kết phát thải ròng bằng "0" vào năm 2050 (COP26).
  - Chiến lược quốc gia về biến đổi khí hậu đến năm 2050: QĐ 896/QĐ-TTg ngày 26/7/2022.
  - NDC cập nhật 2022: giảm 15,8% (tự lực) đến 43,5% (có hỗ trợ quốc tế) so với BAU vào năm 2030.
- **Các mốc của lộ trình tham chiếu:**

| Giai đoạn | Mốc |
|---|---|
| 2026–2027 | MRV, năm gốc, BAU; thẩm định ISO 14064 |
| 2027–2028 | Điện mặt trời mái nhà; ISO 50001; biến tần, khí nén, chiếu sáng |
| 2030 | Đạt mục tiêu kế hoạch giảm nhẹ; tăng tỷ lệ nhiệt từ sinh khối |
| 2035 | Lò hơi, lò sấy chuyển hẳn sang nhiên liệu tái tạo hoặc điện hóa nhiệt; mua điện tái tạo |
| 2040–2045 | Xe nâng điện; thu hồi nhiệt; điện tái tạo 100% |
| 2050 | Phát thải ròng bằng 0; phần còn lại bù trừ bằng tín chỉ carbon chất lượng cao |

Đây là lộ trình mẫu. Mục tiêu chính thức do Ban Giám đốc phê duyệt; không ghi "trung hòa carbon" khi chưa kiểm kê và thẩm định.

## 4. Lộ trình 13 tuần

| Tuần | Thời gian | Việc | Thực hiện | Nghiệm thu |
|---|---|---|---|---|
| 1–2 | 18/10 – 01/11 | Xây các phân hệ ở mục 2, gồm: migration 004, dữ liệu dùng thử, kiểm thử tự động | Claude | Cập nhật PR; bản dùng thử trên Vercel chạy đủ luồng |
| 3 | 02/11 – 08/11 | Rà soát bản dùng thử. Chốt danh mục thiết bị, hóa chất, chương trình kiểm tra tuần và quý. **Chuyển repo sang private** | Phòng KT-SX, Claude | Danh sách góp ý đã xử lý |
| 4 | 09/11 – 15/11 | Triển khai thật: Supabase production, migration 001–004, tài khoản theo vai trò. Nhập dữ liệu: nhân sự (TCLĐ), thiết bị và giấy kiểm định (Tổ Cơ điện), hóa chất (MT-HD02-BM01), chất thải | Claude hướng dẫn, nhà máy nhập | Dữ liệu nhập ≥ 90% |
| 5–8 | 16/11 – 13/12 | Chạy thử một vòng PDCA tại Phòng KT-SX, Tổ Cơ điện, Xưởng Tạo hạt 1: 04 lần kiểm tra tuần, VSCN tháng, phiếu sửa chữa, nhập – xuất hóa chất. Sửa lỗi hằng tuần. Bổ sung: đính kèm file (Supabase Storage), in biên bản hư hỏng, nghiệm thu, phiếu kiểm tra; email nhắc hạn | Claude, nhà máy | ≥ 95% kỳ kiểm tra đúng hạn; không còn lỗi chặn |
| 9–10 | 14/12 – 27/12 | Mở rộng ra toàn nhà máy. Kiểm tra tổng thể quý IV. Xuất hồ sơ minh chứng tái chứng nhận ISO 14001 và báo cáo xem xét lãnh đạo | Nhà máy, Claude | Hồ sơ ISO đủ minh chứng |
| 11–13 | 28/12/2026 – 18/01/2027 | Chốt số liệu 2026. Xuất: BC ATVSLĐ, BC y tế lao động (10/01); BC công tác BVMT (15/01); BC hóa chất. Chuẩn bị KKK KNK 2025–2026 (31/3/2027) và EPR kỳ 2026. Nghiệm thu, hướng dẫn sử dụng, bàn giao | Nhà máy, Claude | Báo cáo nộp đúng hạn bằng số liệu phần mềm |

### Tiến độ tuần 1–2 (cập nhật 19/10/2026)

| Hạng mục | Trạng thái |
|---|---|
| Migration 004 (11 bảng mới, mở rộng CAPA, hóa chất, diễn tập, thông số nhà máy) | Xong. Cài mới = nâng cấp v1 → 002 → 003 → 004; chạy lại không lỗi |
| P · Kế hoạch & lộ trình (năm, 2026–2030, Net Zero 2050), Tổ chức bộ máy HSE | Xong |
| D · Thiết bị & bảo trì, Hóa chất, EPR & Tuần hoàn, diễn tập theo người, hồ sơ HSE cá nhân | Xong |
| C · Kiểm tra định kỳ (tổng thể quý, tuần, PCCC, hóa chất, VSCN, tự kiểm tra quý) | Xong |
| A · Hành động khắc phục tập trung | Xong |
| Tổng quan PDCA: việc cần xử lý từ mọi phân hệ, 4 khối P-D-C-A | Xong |
| Chỉ số GRI 306-4, 306-5, TT96 II.4 tự tính; mục tiêu ESG chất thải chuyển hướng, nước tái sử dụng | Xong |
| Bộ mẫu trong Cài đặt: chương trình kiểm tra định kỳ; kế hoạch & lộ trình | Xong |
| Kiểm thử | RLS 118/118 ca (PostgreSQL 16); 13/13 luồng giao diện; 50 màn hình × 2 cỡ (1400 px, 390 px) không lỗi, không tràn ngang; build production OK, tách gói theo trang (gói chính ~216 KB gzip) |

Việc tiếp theo (tuần 3): nhà máy rà soát bản dùng thử, chốt danh mục thiết bị, hóa chất, tần suất kiểm tra; **chuyển repo sang private trước khi nhập dữ liệu thật**.

## 5. Cổng chất lượng cho mỗi lần cập nhật

- Kiểm tra mã:
  - `npm run build` (gồm `tsc`) không lỗi.
  - Kiểm thử e2e các luồng chính, cả trên màn hình 390 px.
- Kiểm tra CSDL (PostgreSQL 16):
  - Cài mới cho kết quả giống nâng cấp (v1 → 002 → 003 → 004).
  - Chạy lại migration không lỗi.
  - RLS: vai trò "Chỉ xem" chỉ đọc; tổ chức khác không thấy dữ liệu.
- Căn cứ pháp lý: điểm chưa đọc toàn văn phải ghi "(đối chiếu)". Không bịa số liệu; dữ liệu dùng thử ghi "minh họa".
- Chỉ nhập dữ liệu thật (họ tên, số liệu nội bộ) sau khi repo đã chuyển sang private.

## 6. Nhà máy cần chuẩn bị

1. Chuyển repo sang private; tạo project Supabase production.
2. Tổng số lao động thực tế và danh sách tổ sản xuất, để tính bộ máy ATVSLĐ, y tế, an toàn vệ sinh viên, đội PCCC.
3. Danh mục thiết bị nghiêm ngặt và giấy chứng nhận kiểm định (Tổ Cơ điện).
4. Danh mục hóa chất MT-HD02-BM01 và bộ PATHH; nhà cung cấp và giấy phép bên bán của hóa chất có điều kiện.
5. Quy định nội bộ về tần suất kiểm tra tuần và quý (MT-QT02-BM2, BM3); bản gốc TCVN 3890:2023.
6. Số liệu bao bì bán nội địa và xuất khẩu, khối lượng bao mẫu (EPR).
