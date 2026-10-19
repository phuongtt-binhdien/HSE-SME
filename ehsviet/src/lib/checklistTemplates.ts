// Bảng tự kiểm tra tuân thủ theo các nghị định xử phạt hiện hành (rà soát 10/2026).
// Mỗi hạng mục: nội dung, căn cứ (điều – khoản), khung phạt, bằng chứng cần xem, gợi ý khắc phục, đơn vị phụ trách.
// Mức tiền ghi theo cá nhân; tổ chức bị phạt gấp 2 lần. Mức phạt chỉ để định hướng mức độ rủi ro —
// đối chiếu nguyên văn trước khi trích vào văn bản.
//   - Môi trường: NĐ 45/2022/NĐ-CP còn hiệu lực (dự thảo thay thế chưa ban hành); thời hiệu 02 năm (Điều 5), tổ chức × 2 (Điều 6 k2).
//   - PCCC & CNCH: NĐ 106/2025/NĐ-CP (hl 01/7/2025) sửa đổi bởi NĐ 69/2026/NĐ-CP (hl 20/4/2026); tối đa 50 triệu với cá nhân,
//     tổ chức × 2 (Điều 4); thời hiệu 01 năm; vi phạm nhiều lần trong một cơ sở: phạt 01 hành vi + tình tiết tăng nặng (NĐ 69/2026).
//   - Lao động – ATVSLĐ: NĐ 283/2026/NĐ-CP (hl 10/9/2026, thay NĐ 12/2022); tổ chức × 2 (Điều 7); thời hiệu 01 năm (Điều 3).
//   - Hóa chất: Luật Hóa chất 69/2025/QH15 và văn bản hướng dẫn (NĐ 25/2026, NĐ 26/2026, TT 02/2026/TT-BCT).

export interface ChecklistItemTemplate {
  label: string
  hint?: string
  fix?: string
  owner?: string
}

export interface ChecklistTemplateSeed {
  name: string
  category: string
  frequency: string
  items: ChecklistItemTemplate[]
}

/** Thời điểm rà soát căn cứ pháp lý của bộ mẫu */
export const LEGAL_REVIEW_DATE = '10/2026'

/** Hạng mục: căn cứ · mức phạt · quy định nội bộ (nếu có) · bằng chứng */
function item(label: string, basis: string, penalty: string, evidence: string, fix: string, owner: string, internal?: string): ChecklistItemTemplate {
  const hint = [`Căn cứ: ${basis}`, `Mức phạt: ${penalty}`, internal && `Quy định nội bộ: ${internal}`, `Bằng chứng: ${evidence}`]
    .filter(Boolean)
    .join(' · ')
  return { label, hint, fix, owner }
}

const MT = 'NĐ 45/2022'
const PC = 'NĐ 106/2025'
const LD = 'NĐ 283/2026'
const HC = 'Luật Hóa chất 69/2025/QH15; NĐ 25/2026, NĐ 26/2026; TT 02/2026/TT-BCT'

export const CHECKLIST_NAMES = {
  MT: 'Tự kiểm tra tuân thủ bảo vệ môi trường (NĐ 45/2022/NĐ-CP)',
  PCCC: 'Tự kiểm tra tuân thủ PCCC & CNCH (NĐ 106/2025, sửa đổi bởi NĐ 69/2026)',
  ATLD: 'Tự kiểm tra tuân thủ lao động – ATVSLĐ (NĐ 283/2026/NĐ-CP)',
  HC: 'Tự kiểm tra tuân thủ an toàn hóa chất (Luật Hóa chất 2025)',
}

/** Tên bộ mẫu cũ → tên mới: khi nạp lại, checklist cũ được cập nhật tại chỗ (giữ lịch sử các lần kiểm tra) */
export const LEGACY_CHECKLIST_NAMES: Record<string, string> = {
  'Tự kiểm tra tuân thủ PCCC & CNCH (NĐ 106/2025/NĐ-CP)': CHECKLIST_NAMES.PCCC,
  'Tự kiểm tra tuân thủ an toàn, vệ sinh lao động (NĐ 12/2022/NĐ-CP)': CHECKLIST_NAMES.ATLD,
  'Tự kiểm tra tuân thủ an toàn hóa chất': CHECKLIST_NAMES.HC,
}

const ENV_ITEMS: ChecklistItemTemplate[] = [
  // --- Giấy phép môi trường (Điều 11 k2 – GPMT thuộc thẩm quyền cấp tỉnh) ---
  item('Giấy phép môi trường còn hiệu lực; lưu bản sao tại cơ sở; theo dõi hạn để nộp hồ sơ cấp lại trước khi hết hạn', `${MT} Điều 11 k2 e; Luật BVMT sửa đổi bởi Luật 146/2025/QH15 (bỏ cấp đổi GPMT)`, '150–170 tr (không có GPMT cấp lại) – tổ chức ×2', 'GPMT; lịch hạn tại Hồ sơ & Tuân thủ', 'Lập hồ sơ cấp lại sớm; cập nhật hạn vào lịch nghĩa vụ', 'KT-SX', 'Điều 3, 25'),
  item('Công khai GPMT theo quy định', `${MT} Điều 11 k2 b`, '15–20 tr – tổ chức ×2', 'Văn bản, hình thức công khai', 'Công khai bổ sung; lưu bằng chứng', 'KT-SX'),
  item('Báo cáo cơ quan cấp phép khi có thay đổi so với GPMT (trường hợp phải báo cáo)', `${MT} Điều 11 k2 a`, '10–15 tr – tổ chức ×2', 'Danh mục sai khác so với GPMT; văn bản đã gửi', 'Lập danh mục sai khác (nguồn thải, ống khói, khối lượng chất thải); gửi báo cáo', 'KT-SX'),
  item('Thực hiện đúng, đủ nội dung GPMT: nguồn thải, công trình xử lý, lưu lượng xả lớn nhất, quy chuẩn, chương trình quan trắc', `${MT} Điều 11 k2 c`, '20–30 tr – tổ chức ×2', 'Đối chiếu từng phụ lục GPMT với hiện trạng', 'Khắc phục sai khác hoặc đưa vào hồ sơ điều chỉnh GPMT', 'KT-SX', 'Điều 9, 10'),
  item('Thay đổi nhiên liệu, thiết bị, công suất, nguồn thải thuộc diện phải điều chỉnh GPMT (vd chuyển lò sấy sang đốt sinh khối): chỉ thực hiện sau khi được điều chỉnh và vận hành thử nghiệm lại nếu có yêu cầu', `${MT} Điều 11 k2 đ`, '100–150 tr – tổ chức ×2', 'Văn bản của cơ quan cấp phép; nhật ký nhiên liệu', 'Dừng thay đổi chưa được phép; hoàn tất hồ sơ điều chỉnh GPMT', 'KT-SX, Ban Điều hành', 'Điều 13'),
  item('Kết quả quan trắc vượt giới hạn: đã rà soát, cải tạo công trình xử lý theo quy định', `${MT} Điều 11 k2 d`, '80–100 tr – tổ chức ×2', 'Biên bản rà soát; kế hoạch cải tạo', 'Lập kế hoạch cải tạo; quan trắc lại sau cải tạo', 'KT-SX'),
  item('Hệ thống xử lý nước thải vận hành thường xuyên, đúng quy trình được cấp phép', `${MT} Điều 11 k2 g`, '170–200 tr – tổ chức ×2', 'Kiểm tra hiện trường; nhật ký vận hành', 'Vận hành lại ngay; đào tạo người vận hành', 'Tổ vận hành HTXLNT', 'Điều 10'),
  item('Hệ thống xử lý khí thải vận hành đồng bộ khi dây chuyền chạy (cyclone, lọc túi, hấp thụ)', `${MT} Điều 11 k2 g`, '170–200 tr – tổ chức ×2', 'Kiểm tra hiện trường; dữ liệu ΔP, dòng điện quạt', 'Dừng dây chuyền khi hệ xử lý sự cố; sửa chữa', 'Xưởng tạo hạt, lò hơi', 'Điều 9'),
  item('Sổ nhật ký vận hành riêng từng hệ xử lý (khí thải, nước thải): ΔP, hóa chất, sự cố, thay túi lọc', `${MT} Điều 11 k2 c (thực hiện không đúng GPMT)`, '20–30 tr – tổ chức ×2', 'Sổ nhật ký từng hệ', 'Lập sổ theo mẫu; ghi hằng ca', 'Xưởng tạo hạt, lò hơi, HTXLNT'),
  item('Không có đường ống, cửa xả bỏ qua (by-pass) hệ thống xử lý; không pha loãng chất thải', `${MT} Điều 11 k2 h`, '400–500 tr – tổ chức ×2; tước GPMT 03–06 tháng', 'Kiểm tra mạng thoát nước mưa – nước thải, ống khói', 'Bịt ngay đường xả trái phép; báo cáo Ban Giám đốc', 'Ban Điều hành', 'Điều 3, 10'),
  item('Có bơm, thiết bị dự phòng HTXLNT để thay thế ngay khi hư hỏng; đủ kinh phí, nhân lực, hóa chất vận hành', `${MT} Điều 11 k2 c (nội dung GPMT)`, '20–30 tr – tổ chức ×2', 'Danh mục thiết bị dự phòng trong kho', 'Lập giấy đề nghị mua sắm thiết bị dự phòng', 'KT-SX, Vật tư'),
  // --- Quan trắc (Điều 16) ---
  item('Quan trắc khí thải định kỳ đúng tần suất GPMT, đủ dòng thải, đủ thông số; đơn vị quan trắc có chứng nhận VIMCERTS; lưu kết quả', `${MT} Điều 16 k3 a, b (cơ sở có GPMT cấp tỉnh)`, '60–100 tr – tổ chức ×2', 'Hợp đồng quan trắc; phiếu kết quả từng đợt', 'Bổ sung đợt thiếu; ràng buộc đủ thông số trong hợp đồng', 'KT-SX', 'Điều 21'),
  item('Đợt không lấy mẫu được do dây chuyền dừng có lệnh dừng máy, nhật ký làm bằng chứng', `${MT} Điều 16 k3`, '60–100 tr – tổ chức ×2', 'Lệnh dừng máy; nhật ký sản xuất', 'Lưu bằng chứng dừng máy cùng hồ sơ quan trắc', 'KT-SX'),
  item('Nước thải: duy trì quan trắc nội bộ đủ các thông số giới hạn trong GPMT, kể cả khi không thuộc đối tượng quan trắc định kỳ', `${MT} Điều 18 (xả vượt giới hạn); GPMT`, 'Theo lưu lượng và mức vượt – tổ chức ×2', 'Phiếu kết quả nội bộ đủ thông số', 'Bổ sung thông số còn thiếu vào hợp đồng quan trắc', 'KT-SX'),
  item('Quan trắc tự động (bắt buộc hoặc lắp tự nguyện): thiết bị được kiểm định, hiệu chuẩn; dữ liệu lưu giữ đầy đủ', `${MT} Điều 16 k1`, 'Theo khung Điều 16 k1 – tổ chức ×2', 'Biên bản kiểm định, hiệu chuẩn; dữ liệu', 'Hiệu chuẩn định kỳ; sao lưu dữ liệu', 'KT-SX'),
  item('Lỗ lấy mẫu, sàn thao tác trên ống khói đúng quy cách (TT 10/2021/TT-BTNMT); an toàn khi làm việc trên cao', `${MT} Điều 16; TT 10/2021/TT-BTNMT`, 'Theo khung Điều 16 – tổ chức ×2', 'Kiểm tra hiện trường các ống khói', 'Thi công sàn thao tác, lỗ lấy mẫu đúng quy cách', 'KT-SX'),
  // --- Xả thải (Điều 18, 20, 22) ---
  item('Nước thải sau xử lý đạt giới hạn GPMT ở tất cả thông số', `${MT} Điều 18`, 'Theo lưu lượng và mức vượt (vd vượt 1,1–1,5 lần: 40–< 60 m³/ngày 10–20 tr; 100–< 200 m³/ngày 50–60 tr); tăng 10–50% mỗi thông số vượt (k7) – tổ chức ×2', 'Phiếu kết quả gần nhất', 'Dừng xả, đưa về hồ sự cố; điều chỉnh hóa chất; lấy mẫu lại', 'KT-SX', 'Điều 10, 21'),
  item('Đo, ghi lưu lượng nước thải hằng ngày bằng đồng hồ (căn cứ kê khai phí và đối chiếu lưu lượng xả lớn nhất)', `${MT} Điều 11 k2 c; NĐ 346/2025/NĐ-CP`, '20–30 tr – tổ chức ×2', 'Sổ chỉ số đồng hồ', 'Lập sổ ghi chỉ số hằng ngày', 'Tổ vận hành HTXLNT', 'Điều 10, 20'),
  item('Khí thải từng dòng đạt giới hạn GPMT (bụi, NOx, SO₂, CO, NH₃)', `${MT} Điều 20`, 'Theo lưu lượng khí thải và mức vượt (vd vượt 1,1–1,5 lần: 50.000–< 55.000 m³/h 250–300 tr; 55.000–< 60.000 m³/h 300–350 tr) – tổ chức ×2', 'Phiếu kết quả quý', 'Dừng dây chuyền, kiểm tra lọc túi; lấy mẫu lại', 'KT-SX, xưởng tạo hạt', 'Điều 9, 21'),
  item('Lưu lượng khí thải từng dòng không vượt lưu lượng xả lớn nhất trong GPMT', `${MT} Điều 11 k2 c`, '20–30 tr – tổ chức ×2', 'Phiếu kết quả (lưu lượng); đối chiếu phụ lục khí thải GPMT', 'Điều chỉnh quạt; đề nghị điều chỉnh GPMT nếu cần', 'KT-SX', 'Điều 9'),
  item('Không phát tán mùi khó chịu ra ngoài hàng rào (NH₃ khu tạo hạt, HTXLNT, khu chứa chất thải)', `${MT} Điều 20 k1`, 'Cảnh cáo (lần đầu)', 'Kiểm tra hiện trường; phản ánh của cộng đồng', 'Khoanh vùng nguồn mùi; khắc phục, che kín', 'KT-SX'),
  item('Tiếng ồn, độ rung sát hàng rào đạt QCVN 26:2010, 27:2010/BTNMT', `${MT} Điều 22`, 'Theo mức vượt (dBA) – tổ chức ×2', 'Kết quả đo (nếu có)', 'Bảo dưỡng, bọc cách âm thiết bị', 'Cơ điện', 'Điều 11'),
  // --- Chất thải rắn (Điều 26) ---
  item('Chất thải rắn sinh hoạt phân loại 3 nhóm tại nguồn (tái chế – thực phẩm – còn lại, Điều 75 Luật BVMT); thùng đúng màu, nhãn', `${MT} Điều 26`, 'Theo khung Điều 26 – tổ chức ×2', 'Kiểm tra 100% điểm thu gom', 'Bổ sung thùng, nhãn; nhắc nhở, đào tạo lại', 'Ban Điều hành', 'Điều 14, 15'),
  item('CTRSH chuyển giao cho đơn vị có chức năng; có hợp đồng còn hiệu lực (bắt buộc khi phát sinh từ 300 kg/ngày)', `${MT} Điều 26 k3 a`, '15–20 tr – tổ chức ×2', 'Hợp đồng; phiếu cân, xác nhận khối lượng', 'Ký/gia hạn hợp đồng', 'KT-SX', 'Điều 15, 20'),
  item('CTR công nghiệp thông thường: phân loại tại nguồn, lưu chứa đúng; có hợp đồng chuyển giao', `${MT} Điều 26 k2 b`, '20–25 tr – tổ chức ×2', 'Khu lưu giữ CTRCN; hợp đồng', 'Bố trí khu gom, bao chứa có nhãn', 'Các xưởng, kho', 'Điều 16'),
  item('Lưu giữ riêng CTRCN phải xử lý với loại tái sử dụng, tái chế được', `${MT} Điều 26 k2 c`, '25–30 tr – tổ chức ×2', 'Hiện trường khu lưu giữ', 'Sắp xếp lại, tách khu', 'Kho', 'Điều 16, 19'),
  item('Có biên bản bàn giao CTRCN cho mỗi lần chuyển giao', `${MT} Điều 26 k2 a`, '3–5 tr – tổ chức ×2', 'Biên bản giao nhận', 'Lập biên bản cho mọi lần giao', 'KT-SX', 'Điều 20'),
  item('Không tự tái chế, xử lý CTRCN khi không đáp ứng yêu cầu BVMT; không dùng xỉ, tro san lấp', `${MT} Điều 26 k2 d`, '30–50 tr – tổ chức ×2', 'Kiểm tra hiện trường, sổ chất thải', 'Chuyển giao đơn vị có chức năng', 'Ban Điều hành', 'Điều 3, 16'),
  // --- Chất thải nguy hại (Điều 29) ---
  item('Phân định, phân loại, khai báo đủ CTNH (kể cả dịch thải phòng thí nghiệm, ắc quy, pin, bóng đèn); kê khai trong báo cáo', `${MT} Điều 29 k3`, '40–50 tr – tổ chức ×2', 'Sổ CTNH; báo cáo công tác BVMT', 'Bổ sung danh mục, mã CTNH (TT 02/2022 sửa đổi)', 'KT-SX', 'Điều 17'),
  item('Bao bì, thiết bị lưu chứa CTNH có nắp, nhãn tên – mã CTNH, dấu hiệu cảnh báo', `${MT} Điều 29 k3`, '40–50 tr – tổ chức ×2', 'Kiểm tra kho CTNH, điểm gom tại xưởng', 'Thay thùng, dán nhãn', 'KT-SX', 'Điều 17'),
  item('Khu lưu giữ CTNH đạt yêu cầu: mái che, nền chống thấm, gờ/rãnh chống tràn, vật liệu thấm hút, bình chữa cháy, biển cảnh báo', `${MT} Điều 29 k3`, '40–50 tr – tổ chức ×2', 'Kiểm tra hiện trường', 'Bổ sung vật liệu thấm hút, biển cảnh báo', 'KT-SX'),
  item('Không để lẫn CTNH với chất thải thông thường (giẻ lau dính dầu, bóng đèn trong thùng rác sinh hoạt)', `${MT} Điều 29 k4`, 'Theo khung Điều 29 k4 – tổ chức ×2', 'Kiểm tra điểm thùng rác, khu xe nâng, cơ điện', 'Tách ngay; bổ sung thùng CTNH tại nguồn', 'Các đơn vị'),
  item('Thời gian lưu giữ CTNH không quá 01 năm (trừ trường hợp được phép)', `${MT} Điều 29 k1`, '5–10 tr – tổ chức ×2', 'Sổ tiếp nhận kho CTNH', 'Lập lịch chuyển giao', 'KT-SX'),
  item('Hợp đồng chuyển giao CTNH với đơn vị có giấy phép; chứng từ CTNH đầy đủ, lưu giữ', `${MT} Điều 29 k2 (chứng từ), k3 (hợp đồng)`, '10–20 tr (chứng từ); 40–50 tr (hợp đồng) – tổ chức ×2', 'Hợp đồng; chứng từ CTNH từng lần', 'Bổ sung chứng từ; gia hạn hợp đồng', 'KT-SX'),
  item('Không tự tái sử dụng, đốt, cho, bán CTNH (vd dầu nhớt thải dùng làm nhiên liệu)', `${MT} Điều 29 k5`, 'Theo khối lượng: < 100 kg 10–40 tr … 2.000–< 3.000 kg 130–160 tr – tổ chức ×2', 'Sổ CTNH; hiện trường xưởng cơ điện, lò hơi', 'Chấm dứt; chuyển giao toàn bộ cho đơn vị có giấy phép', 'Ban Điều hành, Cơ điện', 'Điều 17'),
  // --- Sự cố (Điều 40) ---
  item('Kế hoạch phòng ngừa, ứng phó sự cố môi trường được ban hành, cập nhật', `${MT} Điều 40 a`, '10–30 tr – tổ chức ×2', 'Kế hoạch đã ban hành', 'Ban hành/cập nhật kế hoạch', 'KT-SX, Ban Điều hành', 'Điều 24'),
  item('Diễn tập ứng phó sự cố chất thải, hóa chất, tràn dầu theo kế hoạch', `${MT} Điều 40 c`, '50–70 tr – tổ chức ×2', 'Biên bản diễn tập', 'Tổ chức diễn tập hằng năm', 'KT-SX, Ban Điều hành'),
  item('Đủ thiết bị, phương tiện ứng phó (bộ ứng cứu tràn dầu cầu cảng, vật liệu thấm hút, hồ sự cố)', `${MT} Điều 40 d`, '80–100 tr – tổ chức ×2', 'Danh mục và kiểm tra thiết bị ứng phó', 'Bổ sung trang bị', 'Ban Điều hành'),
  item('Khi xảy ra sự cố: ứng phó ngay, báo cáo cơ quan có thẩm quyền theo quy định', `${MT} Điều 40 e`, '120–150 tr – tổ chức ×2', 'Hồ sơ sự cố, báo cáo', 'Lập quy trình báo cáo sự cố', 'Ban Điều hành'),
  // --- Báo cáo, phí, EPR, KNK (Điều 32, 42, 43, 45) ---
  item('Báo cáo công tác BVMT năm gửi trước 15/01 (TT 02/2022 sửa đổi – VBHN 55/VBHN-BNNMT); số liệu khớp phiếu kết quả, chứng từ', `${MT} Điều 43 k1 (không báo cáo); k3, k4 (số liệu sai, công khai)`, '5–10 tr (k1) – tổ chức ×2', 'Bản nộp có xác nhận tiếp nhận', 'Kiểm tra chéo số liệu; lập đính chính nếu phát hiện sai', 'KT-SX', 'Điều 25'),
  item('Kê khai, nộp phí BVMT khí thải (NĐ 153/2024) và nước thải (NĐ 346/2025) trước ngày 20 tháng đầu quý sau', `${MT} Điều 42 k1; pháp luật quản lý thuế`, 'Theo pháp luật quản lý thuế', 'Tờ khai, chứng từ nộp', 'Nộp bổ sung kèm giải trình', 'KT-SX, Kế toán'),
  item('EPR bao bì: kê khai đúng hạn (NĐ 110/2026 từ kỳ số liệu 2026: trước 01/4 – đối chiếu toàn văn), đóng góp Quỹ BVMT Việt Nam trước 20/4; công khai thông tin', `${MT} Điều 32 k1 (công khai), k2 (kê khai), k4–k5 (nộp chậm, không nộp)`, '50–100 tr (k1); 150 tr – 1 tỷ (k2); 500 tr – 1 tỷ (k4–k5) – tổ chức ×2', 'Bản kê khai; ủy nhiệm chi', 'Kê khai, đóng góp bổ sung', 'KT-SX, Kế toán'),
  item('Kiểm kê KNK cấp cơ sở 02 năm/lần (Mẫu 06 PL II, gửi UBND tỉnh trước 31/3); kế hoạch và báo cáo giảm nhẹ KNK hằng năm (từ 2027)', `${MT} Điều 45; NĐ 06/2022 sửa bởi NĐ 119/2025; QĐ 42/2026/QĐ-TTg`, 'Theo khung Điều 45 – tổ chức ×2', 'Báo cáo kiểm kê; văn bản nộp', 'Hoàn thiện, nộp đúng hạn', 'KT-SX'),
  item('Bảo hiểm trách nhiệm bồi thường thiệt hại do sự cố môi trường (nếu thuộc đối tượng bắt buộc)', `${MT} Điều 42 k4`, '220–250 tr – tổ chức ×2', 'Hợp đồng bảo hiểm', 'Mua/gia hạn nếu thuộc diện', 'Kế toán'),
  // --- Khác ---
  item('Không rơi vãi nguyên liệu, thành phẩm khi vận chuyển, bốc xếp (đường nội bộ, cầu cảng); xe che chắn', `${MT} Điều 25`, 'Theo khung Điều 25 – tổ chức ×2', 'Kiểm tra hiện trường', 'Thu dọn ngay; nhắc nhở lái xe, nhà thầu', 'Kho, Ban Điều hành', 'Điều 11'),
  item('Kho than, xỉ, sinh khối có mái/phủ bạt; không phát tán bụi', `${MT} Điều 11 k2 c (nội dung GPMT)`, '20–30 tr – tổ chức ×2', 'Kiểm tra hiện trường', 'Phủ bạt, che chắn', 'Lò hơi', 'Điều 16'),
  item('Tỷ lệ cây xanh theo GPMT (≥ 20% diện tích)', `${MT} Điều 11 k2 c (nội dung GPMT)`, '20–30 tr – tổ chức ×2', 'Bản vẽ mặt bằng, đo đạc', 'Bổ sung trồng cây', 'Ban Điều hành'),
  item('Nhà thầu, khách ký cam kết BVMT; chất thải của nhà thầu được thu gom, chuyển giao', `${MT} Điều 26, 29 (trách nhiệm chủ nguồn thải)`, 'Theo khung – tổ chức ×2', 'Phiếu cam kết nhà thầu', 'Ký cam kết trước khi thi công', 'Ban Điều hành', 'Điều 8, 29'),
  item('Hồ sơ môi trường xuất trình được khi kiểm tra; không cản trở đoàn kiểm tra', `${MT} Điều 55 k2`, '10–20 tr – tổ chức ×2', 'Danh mục hồ sơ', 'Bổ sung, số hóa hồ sơ', 'KT-SX', 'Điều 5, 25'),
  item('Thực hiện đầy đủ kết luận, kiến nghị của đoàn thanh tra, kiểm tra', `${MT} Điều 55 k4 b`, '50–80 tr – tổ chức ×2', 'Kết luận kiểm tra; báo cáo khắc phục', 'Lập kế hoạch khắc phục có hạn, người chịu trách nhiệm', 'Ban Điều hành'),
  item('Lộ trình quy chuẩn mới: QCVN 40:2025/BTNMT (cơ sở hiện hữu áp dụng quy chuẩn cũ đến 31/12/2031) và QCVN 19:2024/BTNMT (theo TT 45/2024) – đã đánh giá khoảng cách, lập kế hoạch cải tạo', 'GPMT (điều khoản áp dụng quy chuẩn thay thế); TT 06/2025/TT-BTNMT; TT 45/2024/TT-BTNMT', 'Chưa phát sinh đến hết lộ trình', 'Bảng so sánh giới hạn cũ – mới; kế hoạch đầu tư', 'Đánh giá khoảng cách; đưa vào kế hoạch 2027–2031', 'KT-SX'),
]

const FIRE_ITEMS: ChecklistItemTemplate[] = [
  item('Hồ sơ quản lý công tác PCCC và CNCH của cơ sở được lập, cập nhật', `${PC} Điều 9 k2`, '5–7 tr – tổ chức ×2', 'Hồ sơ PCCC', 'Lập, cập nhật hồ sơ', 'Ban Điều hành, ATVSLĐ', 'Nội quy PCCC'),
  item('Nội quy, biển cấm, biển báo, chỉ dẫn PCCC và CNCH được ban hành, niêm yết', `${PC} Điều 7 k3`, '6–8 tr – tổ chức ×2', 'Kiểm tra hiện trường', 'Bổ sung nội quy, biển báo', 'Ban Điều hành'),
  item('Tuyên truyền, phổ biến kiến thức PCCC và CNCH cho người lao động', `${PC} Điều 6 k2`, '1–3 tr – tổ chức ×2', 'Kế hoạch, biên bản tuyên truyền', 'Lồng ghép vào họp an toàn đầu ca', 'ATVSLĐ'),
  item('Người thuộc diện được huấn luyện, bồi dưỡng nghiệp vụ PCCC và CNCH', `${PC} Điều 6 k3`, '4–6 tr – tổ chức ×2', 'Danh sách, giấy chứng nhận huấn luyện (xem Nhân sự & Huấn luyện)', 'Tổ chức huấn luyện', 'ATVSLĐ', 'Điều 30'),
  item('Không bố trí người chưa có thông báo kết quả huấn luyện PCCC vào vị trí bắt buộc', `${PC} Điều 6 k4 (sửa đổi bởi NĐ 69/2026)`, '6–8 tr – tổ chức ×2', 'Đối chiếu danh sách đội, vị trí với ma trận huấn luyện', 'Huấn luyện trước khi bố trí', 'ATVSLĐ, Tổ chức – Hành chính'),
  item('Thành lập Đội PCCC và CNCH cơ sở; có quyết định, phân công', `${PC} Điều 8 k4`, '10–20 tr – tổ chức ×2', 'Quyết định thành lập đội', 'Ra quyết định, kiện toàn đội', 'Ban Điều hành'),
  item('Thường trực của Đội PCCC cơ sở; lịch trực hằng ngày', `${PC} Điều 8 k3`, '8–10 tr – tổ chức ×2', 'Sổ trực', 'Lập lịch trực', 'Ban Điều hành'),
  item('Trang bị phương tiện PCCC, CNCH cho Đội PCCC cơ sở theo quy định', `${PC} Điều 8`, 'Theo khung Điều 8 – tổ chức ×2', 'Danh mục trang bị', 'Bổ sung trang bị', 'Vật tư'),
  item('Tự kiểm tra an toàn PCCC định kỳ; lưu biên bản', `${PC} Điều 10 k3 (Điều 10 k1, k2 sửa đổi bởi NĐ 69/2026)`, '10–20 tr – tổ chức ×2', 'Biên bản tự kiểm tra', 'Lập lịch tự kiểm tra hằng quý', 'Ban Điều hành'),
  item('Sử dụng lửa, nguồn nhiệt; hàn, cắt có giấy phép làm việc nóng, người giám sát, bình chữa cháy tại chỗ', `${PC} Điều 11 k2`, '20–25 tr – tổ chức ×2', 'Giấy phép làm việc nóng', 'Dừng công việc; cấp giấy phép', 'Ban Điều hành', 'Điều 8'),
  item('Hệ thống điện, thiết bị điện bảo đảm an toàn PCCC; tủ điện có nắp, không quá tải', `${PC} Điều 12`, 'Theo khung Điều 12 – tổ chức ×2', 'Kiểm tra tủ điện; đo nhiệt (camera nhiệt nếu có)', 'Sửa chữa, cân tải', 'Cơ điện'),
  item('Chống sét, tiếp địa được kiểm tra định kỳ', `${PC} Điều 13`, 'Theo khung Điều 13 – tổ chức ×2', 'Biên bản đo điện trở tiếp địa', 'Sửa chữa, đo lại', 'Cơ điện'),
  item('Hàng hóa, chất nguy hiểm về cháy, nổ (dầu DO, hóa chất, than, sinh khối) bảo quản, vận chuyển đúng quy định', `${PC} Điều 14–16`, 'Theo hành vi – tổ chức ×2', 'Kiểm tra kho dầu, kho hóa chất, bãi than', 'Sắp xếp lại; bổ sung biển cảnh báo', 'Kho, Lò hơi'),
  item('Bãi than, sinh khối: theo dõi nhiệt độ đống, chống tự cháy; khoảng cách an toàn', `${PC} Điều 14–16`, 'Theo hành vi – tổ chức ×2', 'Sổ theo dõi nhiệt độ đống', 'Đảo trộn, giảm chiều cao đống', 'Lò hơi'),
  item('Bảo hiểm cháy, nổ bắt buộc (nếu thuộc diện) còn hiệu lực', `${PC} Điều 17 (NĐ 69/2026 bổ sung biện pháp buộc mua bảo hiểm)`, '10–15 tr (k1); không mua 30–50 tr – tổ chức ×2', 'Hợp đồng bảo hiểm', 'Mua/gia hạn', 'Kế toán'),
  item('Công trình, hạng mục mới hoặc cải tạo (lò sấy sinh khối, điện mặt trời mái nhà): thẩm định, nghiệm thu PCCC trước khi sử dụng (nếu thuộc diện)', `${PC} Điều 18 k3, k4`, '30–50 tr – tổ chức ×2', 'Hồ sơ thẩm duyệt, văn bản nghiệm thu', 'Hoàn tất thủ tục trước khi đưa vào sử dụng', 'Ban Điều hành', 'Điều 13'),
  item('Trang bị đủ phương tiện PCCC: bình chữa cháy, hệ thống báo cháy, chữa cháy theo quy định', `${PC} Điều 20 (k9: không có hệ thống báo cháy, chữa cháy 40–50 tr; k8, k12 sửa đổi bởi NĐ 69/2026)`, 'Theo khung Điều 20 – tổ chức ×2', 'Danh mục phương tiện tại PCCC & An toàn', 'Bổ sung trang bị', 'Cơ điện'),
  item('Duy trì phương tiện PCCC hoạt động; trữ lượng nước chữa cháy đủ theo thiết kế', `${PC} Điều 21 k2 (bổ sung trữ lượng nước – NĐ 69/2026), k9`, 'Theo khung Điều 21 – tổ chức ×2', 'Kiểm tra bể, trạm bơm chữa cháy', 'Sửa chữa, bổ sung nước', 'Cơ điện'),
  item('Bảo dưỡng, kiểm tra định kỳ phương tiện PCCC (bình chữa cháy, máy bơm, đầu báo, tủ trung tâm)', `${PC} Điều 22`, 'Theo khung Điều 22 – tổ chức ×2', 'Sổ bảo dưỡng, tem kiểm tra', 'Nạp lại, sửa chữa, thay thế', 'Cơ điện'),
  item('Kho CTNH, kho dầu, khu hóa chất có bình chữa cháy, cát, biển cấm lửa', `${PC} Điều 20, 21`, 'Theo khung – tổ chức ×2', 'Kiểm tra hiện trường', 'Bổ sung trang bị', 'KT-SX, Kho', 'Điều 17'),
  item('Lối thoát nạn, cửa thoát nạn thông thoáng; đèn chiếu sáng sự cố, chỉ dẫn thoát nạn hoạt động', `${PC} Điều 24 (bãi bỏ k3 – NĐ 69/2026)`, 'Theo khung Điều 24 – tổ chức ×2', 'Thử đèn; kiểm tra lối thoát', 'Dọn chướng ngại; thay đèn', 'Kho, Cơ điện'),
  item('Giải pháp ngăn cháy, chống cháy lan (vách, cửa ngăn cháy, khoảng cách giữa kho) được duy trì', `${PC} Điều 25 (k2, k4, k5 sửa đổi bởi NĐ 69/2026)`, 'Theo khung Điều 25 – tổ chức ×2', 'Kiểm tra hiện trường', 'Khôi phục giải pháp ngăn cháy', 'Ban Điều hành'),
  item('Phương án chữa cháy, CNCH của cơ sở được lập, phê duyệt, cập nhật hạng mục mới', `${PC} Điều 26 k5`, '20–25 tr – tổ chức ×2', 'Phương án được phê duyệt', 'Xây dựng, cập nhật, trình phê duyệt', 'Ban Điều hành'),
  item('Thực tập phương án chữa cháy, CNCH theo quy định', `${PC} Điều 26 k4`, '15–20 tr – tổ chức ×2', 'Biên bản thực tập (xem PCCC & An toàn › Diễn tập)', 'Tổ chức thực tập', 'Ban Điều hành', 'Điều 24'),
  item('Đường giao thông, bãi đỗ cho xe chữa cháy thông thoáng', `${PC} Điều 27 k6`, '30–40 tr – tổ chức ×2', 'Kiểm tra hiện trường', 'Dọn chướng ngại ngay', 'Kho, Ban Điều hành'),
  item('Cập nhật cơ sở dữ liệu PCCC; kết nối truyền tin báo cháy (nếu thuộc diện)', `${PC} Điều 28`, 'Theo khung Điều 28 – tổ chức ×2', 'Tài khoản, dữ liệu đã cập nhật', 'Cập nhật dữ liệu', 'Ban Điều hành'),
  item('Báo cáo công tác PCCC và CNCH theo yêu cầu; khắc phục kiến nghị của cơ quan Công an', PC, 'Theo hành vi – tổ chức ×2', 'Văn bản báo cáo; biên bản kiểm tra', 'Gửi bổ sung; khắc phục có hạn', 'Ban Điều hành'),
]

const LABOR_ITEMS: ChecklistItemTemplate[] = [
  // --- An toàn, vệ sinh lao động ---
  item('Bộ phận ATVSLĐ, y tế; Hội đồng ATVSLĐ cơ sở (bắt buộc từ 300 lao động); an toàn – vệ sinh viên ở mỗi tổ (NĐ 39/2016)', `${LD} Điều 32 k2`, '5–10 tr – tổ chức ×2', 'Quyết định thành lập, phân công', 'Kiện toàn theo quy mô lao động', 'Tổ chức – Hành chính', 'Điều 7'),
  item('Kế hoạch ATVSLĐ năm; tổ chức sơ cứu, cấp cứu (túi sơ cứu, người được huấn luyện)', `${LD} Điều 32 k2`, '5–10 tr – tổ chức ×2', 'Kế hoạch năm; danh sách sơ cứu viên', 'Lập kế hoạch; bổ sung túi sơ cứu', 'ATVSLĐ'),
  item('Hồ sơ vệ sinh lao động được lập, cập nhật sau mỗi đợt quan trắc (TT 19/2016/TT-BYT)', `${LD} Điều 32 k1`, '0,5–1 tr – tổ chức ×2', 'Hồ sơ vệ sinh lao động', 'Cập nhật theo kết quả QTMTLĐ (Sức khỏe nghề nghiệp)', 'ATVSLĐ'),
  item('Kiểm tra, bảo dưỡng máy, thiết bị, nhà xưởng; thiết bị an toàn (che chắn bộ phận chuyển động, lan can, khóa – thẻ cách ly năng lượng)', `${LD} Điều 32 k3`, '20–25 tr – tổ chức ×2', 'Sổ bảo dưỡng; kiểm tra băng tải, thùng quay, gầu tải', 'Lắp che chắn; áp dụng khóa – thẻ', 'Cơ điện, xưởng'),
  item('Phương án xử lý sự cố, ứng cứu khẩn cấp; diễn tập định kỳ', `${LD} Điều 32 k3`, '20–25 tr – tổ chức ×2', 'Phương án; biên bản diễn tập', 'Lập, diễn tập', 'ATVSLĐ', 'Điều 24'),
  item('Khai báo, điều tra TNLĐ đúng quy định (chết người hoặc từ 02 người bị thương nặng: khai báo ngay Sở Nội vụ; chết người báo Công an)', `${LD} Điều 32 k3; NĐ 39/2016; NĐ 129/2025 (Mẫu 01 PL II)`, '20–25 tr – tổ chức ×2', 'Hồ sơ TNLĐ (PCCC & An toàn › Sự cố)', 'Lập quy trình khai báo nhanh', 'ATVSLĐ'),
  item('Chế độ cho người làm nghề, công việc nặng nhọc, độc hại, nguy hiểm (thời giờ, khám 6 tháng/lần, bồi dưỡng)', `${LD} Điều 32 k4`, '5–75 tr theo số NLĐ – tổ chức ×2', 'Danh sách NNĐHNH (TT 11/2020, TT 19/2023); chứng từ', 'Rà soát danh sách, bổ sung chế độ', 'Tổ chức – Hành chính'),
  item('Thống kê, báo cáo TNLĐ: 6 tháng trước 05/7, năm trước 10/01 (PL XII NĐ 39/2016 → Sở Nội vụ)', `${LD} Điều 31 k3`, '5–10 tr – tổ chức ×2', 'Báo cáo đã gửi', 'Gửi bổ sung', 'ATVSLĐ'),
  item('Báo cáo công tác ATVSLĐ năm (PL II TT 07/2016 → Sở Nội vụ, Sở Y tế); báo cáo y tế lao động (PL 8 TT 19/2016/TT-BYT → Trung tâm Y tế)', `${LD} Điều 31 k2`, '1–3 tr – tổ chức ×2', 'Báo cáo đã gửi', 'Gửi bổ sung', 'ATVSLĐ'),
  item('Khám sức khỏe định kỳ ít nhất 01 lần/năm; NLĐ làm nghề NNĐHNH 06 tháng/lần', `${LD} Điều 33 k2–k4; Luật ATVSLĐ Điều 21`, '1–15 tr/NLĐ tùy hành vi – tổ chức ×2', 'Hồ sơ khám (Sức khỏe nghề nghiệp)', 'Lập lịch khám; khám bổ sung', 'Tổ chức – Hành chính'),
  item('Khám phát hiện bệnh nghề nghiệp cho NLĐ tiếp xúc yếu tố có hại (ồn, bụi silic, hóa chất) – danh mục 35 BNN theo TT 60/2025/TT-BYT', `${LD} Điều 33 k2–k4; TT 28/2016/TT-BYT`, '1–15 tr/NLĐ tùy hành vi – tổ chức ×2', 'Danh sách NLĐ tiếp xúc; kết quả khám BNN', 'Tổ chức khám BNN theo vị trí vượt chuẩn', 'Tổ chức – Hành chính'),
  item('Thông tin cho NLĐ về yếu tố nguy hiểm, có hại; đánh giá yếu tố; biển cảnh báo tại nơi làm việc', `${LD} Điều 33 k5`, '10–15 tr – tổ chức ×2', 'Biển cảnh báo; biên bản phổ biến', 'Bổ sung biển cảnh báo vùng ồn, bụi', 'ATVSLĐ'),
  item('Đánh giá nguy cơ rủi ro về ATVSLĐ', `${LD} Điều 33 k6`, '15–20 tr – tổ chức ×2', 'Bảng đánh giá rủi ro', 'Lập, cập nhật đánh giá', 'ATVSLĐ'),
  item('Cấp phương tiện bảo vệ cá nhân phù hợp (TT 25/2022); bồi dưỡng bằng hiện vật cho người làm việc có yếu tố nguy hiểm, độc hại (TT 24/2022)', `${LD} Điều 33 k8`, '3–30 tr – tổ chức ×2', 'Sổ cấp phát PTBVCN; danh sách bồi dưỡng', 'Cấp bổ sung; nhắc nhở sử dụng', 'ATVSLĐ'),
  item('Nơi làm việc đạt quy chuẩn vệ sinh lao động (ồn, vi khí hậu, bụi, hơi khí độc)', `${LD} Điều 33 k9; QCVN 24, 26:2016/BYT; QCVN 02, 03:2019/BYT`, '25–40 tr – tổ chức ×2', 'Kết quả QTMTLĐ', 'Biện pháp kỹ thuật tại vị trí vượt chuẩn', 'ATVSLĐ, Cơ điện'),
  item('Không buộc NLĐ tiếp tục làm việc khi có nguy cơ xảy ra TNLĐ đe dọa nghiêm trọng tính mạng, sức khỏe', `${LD} Điều 33 k10`, '30–40 tr – tổ chức ×2', 'Quy định quyền từ chối làm việc nguy hiểm', 'Phổ biến quyền từ chối; ghi vào nội quy', 'Ban Điều hành'),
  item('Chế độ cho người bị TNLĐ, BNN (chi trả, giám định, bố trí công việc phù hợp)', `${LD} Điều 34 k1`, '2–4 tr/NLĐ – tổ chức ×2', 'Hồ sơ chi trả', 'Chi trả bổ sung', 'Tổ chức – Hành chính'),
  item('Khai báo máy, thiết bị có yêu cầu nghiêm ngặt (nồi hơi, bình chịu áp lực, xe nâng, thiết bị nâng) – từ 01/7/2026 đến 28/02/2027 khai báo với cơ quan chuyên môn UBND tỉnh (NQ 66.18/2026/NQ-CP)', `${LD} Điều 35 k1`, '1–2 tr – tổ chức ×2', 'Văn bản khai báo', 'Khai báo bổ sung', 'Cơ điện'),
  item('Lưu giữ đầy đủ hồ sơ kỹ thuật máy, thiết bị nghiêm ngặt', `${LD} Điều 35 k2`, '5–10 tr – tổ chức ×2', 'Hồ sơ lý lịch thiết bị', 'Bổ sung hồ sơ', 'Cơ điện'),
  item('Kiểm định trước khi đưa vào sử dụng và định kỳ máy, thiết bị nghiêm ngặt', `${LD} Điều 35 k4`, '20–75 tr theo số thiết bị – tổ chức ×2', 'Biên bản, tem kiểm định còn hạn', 'Kiểm định ngay; dừng sử dụng khi quá hạn', 'Cơ điện'),
  item('Không sử dụng máy, thiết bị kiểm định không đạt', `${LD} Điều 35 k5`, '50–75 tr – tổ chức ×2', 'Biên bản kiểm định', 'Dừng sử dụng; sửa chữa, kiểm định lại', 'Cơ điện'),
  item('Huấn luyện ATVSLĐ đủ 6 nhóm (NĐ 44/2016 Điều 19): nhóm 3 có thẻ an toàn trước khi làm công việc nghiêm ngặt; nhóm 4 định kỳ hằng năm', `${LD} Điều 36 k1`, '5–50 tr theo số NLĐ – tổ chức ×2', 'Ma trận huấn luyện (Nhân sự & Huấn luyện); thẻ an toàn', 'Huấn luyện bổ sung người quá hạn', 'ATVSLĐ', 'Điều 30'),
  item('Quan trắc môi trường lao động ít nhất 01 lần/năm do tổ chức đủ điều kiện thực hiện', `${LD} Điều 38 k3`, '20–40 tr – tổ chức ×2', 'Hợp đồng, báo cáo QTMTLĐ', 'Ký hợp đồng quan trắc', 'ATVSLĐ'),
  item('Công khai kết quả QTMTLĐ cho NLĐ', `${LD} Điều 38 k2`, '2–5 tr – tổ chức ×2', 'Bảng tin, biên bản công khai', 'Công khai kết quả tại nơi làm việc', 'ATVSLĐ'),
  item('Làm việc trong không gian hạn chế (bể HTXLNT, silo, bồn) và trên cao: giấy phép, đo khí, dây an toàn, người giám sát', `${LD} Điều 32 k3, Điều 33`, 'Theo hành vi – tổ chức ×2', 'Giấy phép làm việc', 'Dừng công việc; cấp giấy phép', 'Ban Điều hành', 'Điều 8'),
  item('Đóng bảo hiểm TNLĐ – BNN đúng, đủ (0,5% quỹ lương; 0,3% khi đủ điều kiện NĐ 58/2020)', `${LD} Điều 48 k1`, '0,3–0,5 tr/NLĐ – tổ chức ×2', 'Bảng đóng BHXH', 'Đóng bổ sung', 'Kế toán, Tổ chức – Hành chính'),
  // --- Quan hệ lao động liên quan ---
  item('Kỷ luật lao động đúng trình tự (BLLĐ Điều 122, 124); không phạt tiền, cắt lương thay xử lý kỷ luật (BLLĐ Điều 127) – hệ số trong quy chế lương chỉ áp cho tập thể', `${LD} Điều 25 k3`, '20–40 tr – tổ chức ×2', 'Quy định thưởng phạt nội bộ; biên bản xử lý kỷ luật', 'Rà soát quy định nội bộ; bỏ mọi hình thức trừ tiền cá nhân', 'Tổ chức – Hành chính', 'Nội quy lao động'),
  item('Giao kết hợp đồng lao động bằng văn bản đúng loại; không giữ giấy tờ tùy thân, không đặt cọc', `${LD} Điều 15 k1 (2–25 tr theo số NLĐ), k2 (20–25 tr)`, 'Theo hành vi – tổ chức ×2', 'Hồ sơ HĐLĐ', 'Ký bổ sung; trả giấy tờ', 'Tổ chức – Hành chính'),
  item('Trả lương đúng hạn, đủ; không thấp hơn lương tối thiểu vùng', `${LD} Điều 23 k2, k3`, '5–50 tr theo số NLĐ – tổ chức ×2', 'Bảng lương', 'Trả bổ sung kèm lãi', 'Kế toán'),
  item('Thời giờ làm việc, làm thêm giờ trong giới hạn, có sự đồng ý của NLĐ; nghỉ giữa ca, nghỉ tuần đủ', `${LD} Điều 24`, '2–75 tr tùy hành vi và số NLĐ – tổ chức ×2', 'Bảng chấm công, sổ làm thêm giờ', 'Điều chỉnh ca kíp', 'Tổ chức – Hành chính'),
  item('Quy định phòng, chống quấy rối tình dục tại nơi làm việc trong nội quy lao động', `${LD} Điều 17 k3`, '15–30 tr – tổ chức ×2', 'Nội quy lao động đã đăng ký', 'Bổ sung nội quy', 'Tổ chức – Hành chính'),
]

const CHEM_ITEMS: ChecklistItemTemplate[] = [
  item('Danh mục hóa chất sử dụng (NaOH, PAC, Polymer, Chlorine, hóa chất phòng thí nghiệm) được lập và cập nhật', HC, 'Theo nghị định xử phạt lĩnh vực hóa chất hiện hành – đối chiếu', 'Danh mục hóa chất (PCCC & An toàn › Hóa chất)', 'Lập, cập nhật', 'KT-SX', 'Điều 12'),
  item('Phiếu an toàn hóa chất (MSDS) tiếng Việt có tại nơi lưu trữ, sử dụng', HC, 'Theo nghị định xử phạt hiện hành', 'Kiểm tra nhà hóa chất, phòng thí nghiệm', 'Bổ sung MSDS', 'KT-SX', 'Điều 12'),
  item('Bao bì, thùng chứa hóa chất có nhãn; sang chiết đúng hướng dẫn nội bộ', HC, 'Theo nghị định xử phạt hiện hành', 'Kiểm tra hiện trường', 'Dán nhãn; đào tạo lại', 'Tổ vận hành HTXLNT', 'Điều 12'),
  item('Khu lưu chứa hóa chất có khay chống tràn, thông gió, vật liệu thấm hút, tách chất không tương thích', HC, 'Theo nghị định xử phạt hiện hành', 'Kiểm tra hiện trường', 'Bổ sung khay, vật liệu', 'KT-SX', 'Điều 12'),
  item('Người lao động tiếp xúc hóa chất được huấn luyện an toàn hóa chất định kỳ', HC, 'Theo nghị định xử phạt hiện hành', 'Ma trận huấn luyện (cột Hóa chất)', 'Tổ chức huấn luyện', 'ATVSLĐ', 'Điều 30'),
  item('Biện pháp/kế hoạch phòng ngừa, ứng phó sự cố hóa chất theo quy định; thiết bị ứng phó (vòi rửa mắt, bộ xử lý tràn đổ)', HC, 'Theo nghị định xử phạt hiện hành', 'Văn bản biện pháp; kiểm tra thiết bị', 'Lập, bổ sung thiết bị', 'KT-SX', 'Điều 24'),
  item('Báo cáo hoạt động hóa chất định kỳ theo quy định hiện hành', HC, 'Theo nghị định xử phạt hiện hành', 'Báo cáo đã gửi', 'Xác định mẫu, hạn theo văn bản hướng dẫn mới', 'KT-SX'),
]

export const COMPLIANCE_CHECKLISTS: ChecklistTemplateSeed[] = [
  { name: CHECKLIST_NAMES.MT, category: 'MT', frequency: 'quarterly', items: ENV_ITEMS },
  { name: CHECKLIST_NAMES.PCCC, category: 'PCCC', frequency: 'quarterly', items: FIRE_ITEMS },
  { name: CHECKLIST_NAMES.ATLD, category: 'ATLD', frequency: 'quarterly', items: LABOR_ITEMS },
  { name: CHECKLIST_NAMES.HC, category: 'HC', frequency: 'quarterly', items: CHEM_ITEMS },
]

/** Kiểm tra môi trường – vệ sinh công nghiệp hằng tháng của Hội đồng ATVSLĐ cơ sở (12 khu vực NM NPK) */
export const VSCN_MONTHLY_CHECKLIST: ChecklistTemplateSeed = {
  name: 'Kiểm tra môi trường – VSCN hằng tháng (12 khu vực)',
  category: 'VSCN',
  frequency: 'monthly',
  items: [
    {
      label: 'Đường nội bộ, sân, cầu cảng: không rơi vãi nguyên liệu, thành phẩm; xe chở hàng che chắn; không vết dầu',
      hint: 'Phân bón rơi vãi theo nước mưa đưa N, P ra sông Vàm Cỏ Đông',
      fix: 'Thu dọn ngay; nhắc nhở lái xe, đơn vị bốc xếp',
    },
    {
      label: 'Mương rãnh, hố ga nước mưa: không tồn phân bón, bùn, rác; đủ nắp hố ga; nạo vét đúng lịch',
      hint: 'Nạo vét mương, hố ga nước mưa 02 lần/năm và sau mưa lớn',
      fix: 'Nạo vét, thay nắp hố ga',
    },
    {
      label: 'Xưởng tạo hạt 1–3, khu xả liệu: sàn, sàn thao tác, mái không đóng bụi; không rò rỉ urê nóng chảy, dầu; cửa thăm lọc bụi kín; không khói bất thường',
      hint: 'Chênh áp lọc túi > 260 mmH₂O phải báo cơ điện và Ban Điều hành',
      fix: 'Vệ sinh mặt bằng; kiểm tra, thay túi lọc; khắc phục rò rỉ',
    },
    {
      label: 'Xưởng trộn, kho nguyên liệu, kho thành phẩm: không bao rách, rơi vãi; pallet sắp xếp gọn; lối thoát hiểm, lối tiếp cận PCCC không bị chắn',
      fix: 'Sắp xếp lại, thu gom bao rách về khu CTRCN',
    },
    {
      label: 'Lò hơi, khu than – xỉ, bãi sinh khối: có bạt phủ, nền khô; xỉ không tràn khỏi khu chứa; bãi sinh khối có mái',
      hint: 'Không dùng xỉ than, tro san lấp mặt bằng',
      fix: 'Phủ bạt, gom xỉ về khu chứa',
    },
    {
      label: 'HTXLNT, nhà hóa chất: bồn có nhãn, khay chống tràn, bơm định lượng hoạt động, sổ vận hành cập nhật; không mùi bất thường; bùn được thu gom',
      hint: 'SV30 giữ 200–250 ml/L, xả bùn khi > 300 ml/L',
      fix: 'Bổ sung nhãn, khay; ghi sổ; xả bùn',
    },
    {
      label: 'Kho CTNH: thùng có nắp, nhãn tên – mã CTNH, dấu hiệu cảnh báo; sổ tiếp nhận; vật liệu thấm hút, bình chữa cháy; không lưu quá hạn',
      fix: 'Dán nhãn, đóng nắp; lập lịch chuyển giao',
    },
    {
      label: 'Điểm thùng rác: đủ 3 nhóm CTRSH (tái chế – thực phẩm – còn lại), đúng màu, có nhãn; không lẫn CTNH; không tràn',
      hint: 'Quy ước màu: xanh lá – thực phẩm; xanh dương – tái chế; xám – khác; đỏ – CTNH',
      fix: 'Bổ sung thùng, nhãn; nhắc nhở, đào tạo lại',
    },
    {
      label: 'Cơ điện, khu xe nâng: giẻ lau dính dầu bỏ thùng CTNH; ắc quy, dầu thải đặt trên khay hứng',
      fix: 'Thu gom về kho CTNH; bổ sung khay hứng',
    },
    {
      label: 'Nhà ăn, nhà vệ sinh: bể tách mỡ được nạo vét; thùng thực phẩm thừa có nắp, thu gom trong ngày',
      fix: 'Nạo vét bể tách mỡ; vệ sinh thùng',
    },
    {
      label: 'Cây xanh, thảm cỏ: cỏ cao 0,10–0,15 m; cây không bám bụi dày; đảm bảo tỷ lệ cây xanh',
      hint: 'GPMT: diện tích cây xanh ≥ 20% diện tích nhà máy',
      fix: 'Cắt cỏ, rửa cây, trồng bổ sung',
    },
    {
      label: 'Nhà thầu đang thi công: đã ký cam kết bảo vệ môi trường, an toàn; khu thi công che chắn; rác thi công thu gom; hàn cắt có bình chữa cháy',
      fix: 'Tạm dừng công việc đến khi khắc phục',
    },
  ],
}

/** Số hạng mục từng bộ – hiển thị ở Cài đặt › Bộ mẫu nghiệp vụ */
export const CHECKLIST_COUNTS = { MT: ENV_ITEMS.length, PCCC: FIRE_ITEMS.length, ATLD: LABOR_ITEMS.length, HC: CHEM_ITEMS.length }
