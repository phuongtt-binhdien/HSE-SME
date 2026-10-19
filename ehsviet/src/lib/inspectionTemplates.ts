// Bộ mẫu chương trình kiểm tra định kỳ của nhà máy phân bón NPK (Kiểm tra – bước C của PDCA):
// tổng thể HSE 03 tháng/lần và kiểm tra hằng tuần theo quy định nhà máy; chạy thử hệ thống PCCC hằng tuần;
// kho hóa chất hằng tuần; VSCN hằng tháng; tự kiểm tra tuân thủ theo nghị định xử phạt hằng quý.
// Tần suất là quy định nội bộ (chỉnh được); căn cứ pháp luật ghi ở từng hạng mục.
import { CHECKLIST_NAMES, VSCN_MONTHLY_CHECKLIST, type ChecklistItemTemplate, type ChecklistTemplateSeed } from './checklistTemplates'
import type { Frequency } from './inspection'

const it = (label: string, hint?: string, fix?: string): ChecklistItemTemplate => ({ label, hint, fix })

const TCVN_PCCC = 'Tần suất mặc định của nhà máy; tần suất kỹ thuật theo TCVN 3890:2023, TCVN 5738:2021 và hướng dẫn nhà sản xuất (đối chiếu)'

/** Kiểm tra tổng thể HSE toàn nhà máy – 03 tháng/lần */
export const QUARTERLY_OVERALL_CHECKLIST: ChecklistTemplateSeed = {
  name: 'Kiểm tra tổng thể HSE toàn nhà máy (03 tháng/lần)',
  category: 'HSE',
  frequency: 'quarterly',
  items: [
    it('[Hồ sơ] GPMT, giấy phép, hợp đồng thu gom chất thải còn hiệu lực; lịch nghĩa vụ không có việc quá hạn', 'Hồ sơ & Tuân thủ › Lịch nghĩa vụ; NĐ 45/2022 Điều 11 k2', 'Lập hồ sơ gia hạn; giao người, hạn'),
    it('[Hồ sơ] Kết quả quan trắc khí thải quý gần nhất đủ dòng thải, đủ thông số và đạt giới hạn GPMT', 'GPMT: quan trắc khí thải 03 tháng/lần; NĐ 45/2022 Điều 16 k3', 'Đối chiếu phiếu kết quả; xử lý thông số vượt'),
    it('[Hồ sơ] Báo cáo định kỳ đã nộp đúng hạn: BVMT, ATVSLĐ, TNLĐ, y tế lao động, phí BVMT quý, EPR, KNK', 'Lịch nghĩa vụ định kỳ HSE', 'Nộp bổ sung; ghi lý do trễ'),
    it('[Môi trường] HTXLNT vận hành ổn định: nhật ký ca đủ, pH và SV30 trong giới hạn, bơm định lượng có dự phòng, bùn được thu gom', 'GPMT; MT-HD04', 'Hiệu chỉnh vận hành; lập phiếu sửa chữa thiết bị'),
    it('[Môi trường] Hệ xử lý khí thải (cyclone, lọc túi, hấp thụ): ΔP trong giới hạn, nhật ký riêng từng hệ, túi lọc thay theo kế hoạch, không khói bất thường', 'GPMT; NĐ 45/2022 Điều 11 k2 g', 'Thay túi lọc; ghi nhật ký sự cố'),
    it('[Môi trường] Kho CTNH: thùng có nắp, nhãn tên – mã CTNH, sổ tiếp nhận, không lưu quá 01 năm; chứng từ chuyển giao đủ', 'NĐ 45/2022 Điều 29; TT 02/2022/TT-BTNMT', 'Dán nhãn; lập lịch chuyển giao'),
    it('[Môi trường] Phân loại CTRSH 03 nhóm tại các điểm thùng; không lẫn CTNH; CTRCN lưu đúng khu', 'Luật BVMT 2020 Điều 75; NĐ 45/2022 Điều 26', 'Bổ sung thùng, nhãn; đào tạo lại'),
    it('[Môi trường] Mương rãnh, hố ga nước mưa không tồn phân bón, dầu; khu than – xỉ, bãi sinh khối được che phủ', 'Quy định MT – VSCN của nhà máy', 'Nạo vét; phủ bạt'),
    it('[ATVSLĐ] Máy, thiết bị nghiêm ngặt còn hạn kiểm định; có quy trình vận hành tại chỗ; người vận hành có thẻ an toàn', 'Luật ATVSLĐ Điều 30–31; NĐ 283/2026 Điều 35', 'Dừng thiết bị quá hạn; đăng ký kiểm định'),
    it('[ATVSLĐ] Che chắn bộ phận chuyển động (băng tải, khớp nối, vành răng thùng sấy); nút dừng khẩn cấp hoạt động', 'QCVN, quy trình vận hành an toàn của thiết bị', 'Lắp che chắn; lập phiếu sửa chữa'),
    it('[ATVSLĐ] Làm việc trên cao, trong không gian hạn chế, hàn cắt: có giấy phép công việc và người giám sát', 'Nội quy ATVSLĐ – PCCC; NĐ 283/2026 Điều 32 k3', 'Tạm dừng công việc đến khi đủ điều kiện'),
    it('[ATVSLĐ] PTBVCN cấp đủ, đúng loại cho vị trí ồn, bụi, hóa chất; người lao động sử dụng đúng', 'TT 25/2022/TT-BLĐTBXH; NĐ 283/2026 Điều 33 k8', 'Cấp bổ sung; nhắc nhở'),
    it('[ATVSLĐ] Huấn luyện ATVSLĐ còn hạn; người lao động mới được huấn luyện trước khi bố trí công việc', 'NĐ 44/2016 Điều 19; NĐ 283/2026 Điều 36', 'Tổ chức huấn luyện bổ sung'),
    it('[Sức khỏe] Kết quả QTMTLĐ đã công khai; biện pháp cải thiện vị trí không đạt đang thực hiện; khám BNN đúng đối tượng', 'Luật ATVSLĐ Điều 18, 21; NĐ 283/2026 Điều 33, 38', 'Công khai; lập CAPA cải thiện điều kiện lao động'),
    it('[Sức khỏe] Túi, tủ sơ cứu đủ cơ số; vòi rửa mắt, tắm khẩn cấp hoạt động; lực lượng sơ cứu bố trí theo ca', 'TT 19/2016/TT-BYT', 'Bổ sung cơ số; sửa vòi rửa mắt'),
    it('[PCCC] Đội PCCC cơ sở đủ biên chế, huấn luyện còn hạn; phân công thường trực theo ca', 'Luật PCCC và CNCH 2024; NĐ 105/2025; NĐ 106/2025 Điều 8', 'Kiện toàn đội; huấn luyện bổ sung'),
    it('[PCCC] Chương trình kiểm tra, chạy thử hệ thống PCCC hằng tuần được thực hiện đủ kỳ; sổ theo dõi đầy đủ', TCVN_PCCC, 'Thực hiện bổ sung; giao trách nhiệm'),
    it('[PCCC] Bình chữa cháy, tủ vách tường đủ, đúng vị trí, còn áp; lối thoát nạn, đèn exit, đường xe chữa cháy thông thoáng', 'NĐ 106/2025 Điều 21, 24, 27', 'Bổ sung, nạp sạc; giải tỏa lối thoát'),
    it('[PCCC] Phương án chữa cháy, CNCH được phê duyệt và thực tập trong năm', 'NĐ 105/2025; NĐ 106/2025 Điều 26 k4, k5', 'Lập kế hoạch thực tập'),
    it('[PCCC] Tủ điện đóng kín, có sơ đồ; không câu móc; hệ thống chống sét được đo kiểm tra định kỳ', 'NĐ 106/2025 Điều 12–13', 'Sửa chữa điện; đo điện trở tiếp địa'),
    it('[Hóa chất] Danh mục hóa chất và PATHH cập nhật; nhãn đầy đủ trên bao bì, bồn chứa, can sang chiết', 'Luật Hóa chất 69/2025; MT-HD02', 'Bổ sung PATHH, nhãn'),
    it('[Hóa chất] Kho, khu lưu chứa có khay chống tràn, thông gió, tách chất không tương thích, bộ ứng phó tràn đổ', 'Luật Hóa chất 69/2025; NĐ 26/2026 (đối chiếu)', 'Bổ sung khay, vật liệu thấm hút'),
    it('[Hóa chất] Phòng thí nghiệm: tủ hút hoạt động; dịch thải phân tích (COD, kim loại nặng) thu gom riêng như CTNH', 'TT 02/2022/TT-BTNMT', 'Bố trí can thu gom riêng; dán nhãn'),
    it('[Thiết bị] Không có phiếu sửa chữa quá hạn; thiết bị BVMT hư hỏng được ưu tiên khắc phục', 'Thiết bị & bảo trì', 'Đôn đốc đơn vị sửa chữa'),
    it('[Nhà thầu] Nhà thầu đang thi công đã ký cam kết, được huấn luyện đầu vào, có người giám sát', 'MT-HD07; NĐ 283/2026 Điều 36', 'Tạm dừng công việc đến khi khắc phục'),
    it('[Cải tiến] Hành động khắc phục của kỳ trước đã hoàn thành và được xác nhận hiệu lực', 'ISO 14001:2015 điều 10.2', 'Gia hạn có lý do; báo cáo Ban Điều hành'),
  ],
}

/** Kiểm tra môi trường hằng tuần: văn phòng, kho, CTNH, nhà ăn, thiết bị ứng phó (MT-QT02-BM2) */
export const WEEKLY_AREA_CHECKLIST: ChecklistTemplateSeed = {
  name: 'Kiểm tra môi trường hằng tuần – kho, CTNH, nhà ăn, thiết bị ứng phó',
  category: 'MT',
  frequency: 'weekly',
  items: [
    it('Văn phòng: tắt điện, điều hòa khi không sử dụng; phân loại rác đúng thùng; không rò rỉ nước'),
    it('Kho nguyên liệu, thành phẩm: không bao rách, rơi vãi; lối đi, lối thoát nạn thông thoáng'),
    it('Kho CTNH: thùng có nắp, nhãn; sổ tiếp nhận cập nhật; không rò rỉ; có vật liệu thấm hút', 'NĐ 45/2022 Điều 29'),
    it('Khu CTRCN, CTRSH: gọn, đúng khu, không tràn; đơn vị thu gom đến đúng lịch', 'NĐ 45/2022 Điều 26'),
    it('Nhà ăn: bể tách mỡ được nạo vét; thùng thực phẩm thừa có nắp, thu gom trong ngày'),
    it('Thiết bị ứng phó sự cố (bộ tràn đổ, cát, vật liệu thấm hút, vòi rửa mắt): đủ, đúng chỗ, dùng được', 'Kế hoạch ứng phó sự cố môi trường – hóa chất'),
    it('HTXLNT: mức hóa chất trong bồn, bơm định lượng, song chắn rác, mùi bất thường', 'MT-HD04'),
    it('Hệ lọc bụi: cửa thăm kín, không rò bụi; chênh áp được ghi nhận', 'MT-HD05: ΔP > 260 mmH₂O báo cơ điện'),
    it('Mương thoát nước mưa: không tắc, không tồn đọng nguyên liệu, dầu'),
    it('Khu cơ điện, xe nâng: không rò rỉ dầu; giẻ lau dính dầu bỏ đúng thùng CTNH'),
  ],
}

/** Kiểm tra, chạy thử hệ thống PCCC hằng tuần */
export const WEEKLY_PCCC_CHECKLIST: ChecklistTemplateSeed = {
  name: 'Kiểm tra, chạy thử hệ thống PCCC hằng tuần',
  category: 'PCCC',
  frequency: 'weekly',
  items: [
    it('Tủ trung tâm báo cháy: nguồn chính, ắc quy dự phòng bình thường, không báo lỗi; sổ thường trực cập nhật', TCVN_PCCC, 'Báo đơn vị bảo trì; khắc phục lỗi vùng'),
    it('Chạy thử bơm chữa cháy động cơ điện: khởi động đạt, áp lực đầu đẩy, không rung, ồn bất thường', TCVN_PCCC, 'Lập phiếu sửa chữa'),
    it('Chạy thử bơm chữa cháy động cơ diesel: nhiên liệu đủ mức, ắc quy đề, nước làm mát, dầu bôi trơn', TCVN_PCCC, 'Bổ sung nhiên liệu; sạc, thay ắc quy'),
    it('Bơm bù áp tự đóng – ngắt đúng áp; không rò rỉ phớt, van', TCVN_PCCC, 'Thay phớt; chỉnh rơ le áp suất'),
    it('Áp lực đường ống chữa cháy đạt; van khóa ở trạng thái mở, có niêm; không rò rỉ', TCVN_PCCC),
    it('Bể, nguồn nước chữa cháy đủ trữ lượng; hố hút thông thoáng', 'NĐ 106/2025 Điều 21 k2 (trữ lượng nước chữa cháy)'),
    it('Tủ chữa cháy vách tường, trụ nước ngoài nhà: đủ lăng, vòi, khớp nối; không bị che chắn', 'NĐ 106/2025 Điều 21'),
    it('Bình chữa cháy tại kho, phòng điện, xưởng: còn áp (kim vạch xanh), đúng vị trí, có thẻ kiểm tra', 'MT-HD01: kiểm tra thẻ bình hằng tháng'),
    it('Đèn exit, đèn chiếu sáng sự cố sáng khi ngắt nguồn thử', 'NĐ 106/2025 Điều 24'),
    it('Lối thoát nạn, cửa chống cháy không khóa, không bị chèn chặn', 'NĐ 106/2025 Điều 24'),
  ],
}

/** Kiểm tra kho, khu sử dụng hóa chất hằng tuần (MT-HD02: KT-SX kiểm tra bảo quản, sử dụng hằng tuần) */
export const WEEKLY_CHEM_CHECKLIST: ChecklistTemplateSeed = {
  name: 'Kiểm tra kho, khu sử dụng hóa chất hằng tuần',
  category: 'HC',
  frequency: 'weekly',
  items: [
    it('Nhãn hóa chất trên bao bì, bồn, can sang chiết đầy đủ; PATHH có tại chỗ', 'Luật Hóa chất 69/2025'),
    it('Tách riêng chất không tương thích (axit – kiềm – chất oxi hóa); không đặt trực tiếp xuống nền'),
    it('Khay chống tràn, gờ chặn còn tốt; không rò rỉ, đổ tràn'),
    it('Thông gió tốt; không có nguồn nhiệt, tia lửa gần chất dễ cháy'),
    it('Bộ ứng phó tràn đổ, vòi rửa mắt – tắm khẩn cấp hoạt động; PTBVCN sẵn sàng'),
    it('Sổ nhập – xuất cập nhật; tồn thực tế khớp tồn trên phần mềm; không vượt lượng tồn trữ tối đa', 'Hóa chất › Nhập – xuất'),
    it('Hóa chất hết hạn, bao bì rỗng dính hóa chất được thu gom như CTNH', 'TT 02/2022/TT-BTNMT'),
    it('Phòng thí nghiệm: tủ hút hoạt động; dịch thải phân tích chứa kim loại nặng thu gom riêng'),
  ],
}

/** Các checklist mới của bộ chương trình kiểm tra (nạp cùng chương trình) */
export const INSPECTION_CHECKLISTS: ChecklistTemplateSeed[] = [
  QUARTERLY_OVERALL_CHECKLIST,
  WEEKLY_AREA_CHECKLIST,
  WEEKLY_PCCC_CHECKLIST,
  WEEKLY_CHEM_CHECKLIST,
]

export interface InspectionPlanTemplate {
  name: string
  scope: string
  frequency: Frequency
  /** tên checklist áp dụng */
  checklist: string
  team: string
  owner: string
  basis: string
}

export const INSPECTION_PLAN_TEMPLATES: InspectionPlanTemplate[] = [
  {
    name: 'Kiểm tra tổng thể HSE toàn nhà máy',
    scope: 'tong_the',
    frequency: 'quarterly',
    checklist: QUARTERLY_OVERALL_CHECKLIST.name,
    team: 'Ban Điều hành, Phòng KT-SX, Hội đồng ATVSLĐ, Đội PCCC cơ sở, Công đoàn',
    owner: 'Phòng Kỹ thuật Sản xuất',
    basis: 'Quy định nhà máy: kiểm tra tổng thể 03 tháng/lần; ISO 14001:2015 và ISO 45001:2018 điều 9.1',
  },
  {
    name: 'Kiểm tra môi trường hằng tuần',
    scope: 'moi_truong',
    frequency: 'weekly',
    checklist: WEEKLY_AREA_CHECKLIST.name,
    team: 'Cán bộ môi trường, tổ trưởng khu vực',
    owner: 'Phòng Kỹ thuật Sản xuất',
    basis: 'Quy định nhà máy: kiểm tra hằng tuần (MT-QT02-BM2)',
  },
  {
    name: 'Kiểm tra, chạy thử hệ thống PCCC hằng tuần',
    scope: 'pccc',
    frequency: 'weekly',
    checklist: WEEKLY_PCCC_CHECKLIST.name,
    team: 'Đội PCCC cơ sở, Tổ Cơ điện',
    owner: 'Đội PCCC cơ sở',
    basis: 'Luật PCCC và CNCH 2024; NĐ 105/2025: tự kiểm tra, bảo dưỡng phương tiện; tần suất theo TCVN 3890:2023 (đối chiếu); NĐ 106/2025 Điều 10 k3, Điều 22',
  },
  {
    name: 'Kiểm tra kho, khu sử dụng hóa chất hằng tuần',
    scope: 'hoa_chat',
    frequency: 'weekly',
    checklist: WEEKLY_CHEM_CHECKLIST.name,
    team: 'Phòng KT-SX, thủ kho, tổ vận hành HTXLNT, phòng thí nghiệm',
    owner: 'Phòng Kỹ thuật Sản xuất',
    basis: 'MT-HD02: kiểm tra bảo quản, sử dụng hóa chất hằng tuần; Luật Hóa chất 69/2025',
  },
  {
    name: 'Kiểm tra môi trường – VSCN hằng tháng',
    scope: 'vscn',
    frequency: 'monthly',
    checklist: VSCN_MONTHLY_CHECKLIST.name,
    team: 'Hội đồng ATVSLĐ cơ sở',
    owner: 'Hội đồng ATVSLĐ cơ sở',
    basis: 'Quy định MT – VSCN: Hội đồng ATVSLĐ kiểm tra ≥ 01 lần/tháng, xếp loại đơn vị',
  },
  {
    name: 'Tự kiểm tra tuân thủ PCCC & CNCH',
    scope: 'pccc',
    frequency: 'quarterly',
    checklist: CHECKLIST_NAMES.PCCC,
    team: 'Đội PCCC cơ sở, Phòng KT-SX',
    owner: 'Phòng Kỹ thuật Sản xuất',
    basis: 'NĐ 106/2025 (sửa đổi bởi NĐ 69/2026) Điều 10 k3: không tự kiểm tra định kỳ 10–20 triệu',
  },
  {
    name: 'Tự kiểm tra tuân thủ bảo vệ môi trường',
    scope: 'moi_truong',
    frequency: 'quarterly',
    checklist: CHECKLIST_NAMES.MT,
    team: 'Phòng KT-SX',
    owner: 'Phòng Kỹ thuật Sản xuất',
    basis: 'NĐ 45/2022/NĐ-CP; GPMT của cơ sở',
  },
]
