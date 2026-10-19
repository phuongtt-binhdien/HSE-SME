// Lịch nghĩa vụ định kỳ HSE của nhà máy phân bón (căn cứ rà soát 10/2026).
// Dùng cho: dữ liệu dùng thử và Cài đặt › Bộ mẫu nghiệp vụ › Lịch nghĩa vụ định kỳ.
// Hạn ghi theo văn bản hiện hành; tần suất quan trắc luôn lấy theo GPMT của cơ sở. Đối chiếu văn bản hợp nhất mới nhất trước khi nộp.
import { addYears, format } from 'date-fns'

export type ObligationCategory = 'bao_cao' | 'quan_trac' | 'phi_le_phi' | 'giay_phep' | 'dao_tao' | 'khac'
export type Recurrence = 'none' | 'monthly' | 'quarterly' | 'yearly' | 'biennial'

export interface ObligationTemplate {
  title: string
  description: string
  category: ObligationCategory
  recurrence: Recurrence
  remind_days: number
  /** Hạn kế tiếp tính từ ngày `from` (yyyy-MM-dd) */
  nextDue: (from: Date) => string
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd')

/** Ngày dd/mm gần nhất kể từ `from` (cùng năm nếu chưa qua, ngược lại năm sau) */
function yearly(month: number, day: number, firstYear?: number) {
  return (from: Date) => {
    let y = Math.max(from.getFullYear(), firstYear ?? 0)
    let d = new Date(y, month - 1, day)
    if (d < startOfDay(from)) d = new Date(++y, month - 1, day)
    return iso(d)
  }
}

/** 02 năm/lần: hạn rơi vào các năm cùng chẵn/lẻ với `anchorYear` */
function biennial(month: number, day: number, anchorYear: number) {
  return (from: Date) => {
    let d = new Date(anchorYear, month - 1, day)
    while (d < startOfDay(from)) d = addYears(d, 2)
    return iso(d)
  }
}

/** Ngày `day` của tháng đầu mỗi quý (01, 04, 07, 10) */
function quarterlyFirstMonth(day: number) {
  return (from: Date) => {
    for (let i = 0; i < 5; i++) {
      const q = Math.floor(from.getMonth() / 3) + i
      const d = new Date(from.getFullYear(), q * 3, day)
      if (d >= startOfDay(from)) return iso(d)
    }
    return iso(from)
  }
}

/** Ngày cuối quý hiện tại */
function quarterEnd() {
  return (from: Date) => iso(new Date(from.getFullYear(), Math.floor(from.getMonth() / 3) * 3 + 3, 0))
}

/** Ngày `day` hằng tháng (tháng này nếu chưa qua) */
function monthly(day: number) {
  return (from: Date) => {
    const d = new Date(from.getFullYear(), from.getMonth(), day)
    return iso(d >= startOfDay(from) ? d : new Date(from.getFullYear(), from.getMonth() + 1, day))
  }
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export const OBLIGATION_TEMPLATES: ObligationTemplate[] = [
  // ---------- Môi trường ----------
  {
    title: 'Báo cáo công tác bảo vệ môi trường năm',
    description: 'Gửi trước 15/01 năm sau (TT 02/2022/TT-BTNMT sửa đổi – VBHN 55/VBHN-BNNMT) tới Sở NN&MT và cơ quan theo quy định. Số liệu khớp phiếu quan trắc, chứng từ chất thải.',
    category: 'bao_cao',
    recurrence: 'yearly',
    remind_days: 30,
    nextDue: yearly(1, 15),
  },
  {
    title: 'Quan trắc khí thải định kỳ theo GPMT',
    description: 'Tần suất, dòng thải, thông số theo GPMT (nhà máy NPK thường 03 tháng/lần). Đợt không lấy mẫu được phải có lệnh dừng máy làm bằng chứng. Xử phạt: NĐ 45/2022 Điều 16 k3.',
    category: 'quan_trac',
    recurrence: 'quarterly',
    remind_days: 14,
    nextDue: quarterEnd(),
  },
  {
    title: 'Quan trắc nước thải sau xử lý (định kỳ hoặc nội bộ)',
    description: 'Định kỳ nếu GPMT yêu cầu; nếu không thuộc đối tượng – duy trì quan trắc nội bộ đủ các thông số giới hạn trong GPMT để có bằng chứng tuân thủ.',
    category: 'quan_trac',
    recurrence: 'quarterly',
    remind_days: 14,
    nextDue: quarterEnd(),
  },
  {
    title: 'Kê khai, nộp phí BVMT đối với khí thải',
    description: 'NĐ 153/2024/NĐ-CP – hạn ngày 20 tháng đầu quý sau.',
    category: 'phi_le_phi',
    recurrence: 'quarterly',
    remind_days: 10,
    nextDue: quarterlyFirstMonth(20),
  },
  {
    title: 'Kê khai, nộp phí BVMT đối với nước thải',
    description: 'NĐ 346/2025/NĐ-CP (từ 01/01/2026) – hạn ngày 20 tháng đầu quý sau; căn cứ lưu lượng đo bằng đồng hồ và kết quả quan trắc.',
    category: 'phi_le_phi',
    recurrence: 'quarterly',
    remind_days: 10,
    nextDue: quarterlyFirstMonth(20),
  },
  {
    title: 'EPR bao bì – kê khai trách nhiệm tái chế',
    description: 'NĐ 110/2026/NĐ-CP (thay Chương VI NĐ 08/2022, hiệu lực 25/5/2026): kê khai trên Hệ thống thông tin EPR quốc gia trước 01/4 (từ kỳ số liệu 2026 – đối chiếu toàn văn). Kê khai cấp công ty; giữ bằng chứng số bao, khối lượng bao mẫu.',
    category: 'bao_cao',
    recurrence: 'yearly',
    remind_days: 45,
    nextDue: yearly(3, 31),
  },
  {
    title: 'EPR bao bì – nộp đóng góp Quỹ BVMT Việt Nam',
    description: 'Nộp trước 20/4 (F = V × R × Fs); hoặc báo cáo kết quả tự tổ chức tái chế nếu chọn hình thức này.',
    category: 'phi_le_phi',
    recurrence: 'yearly',
    remind_days: 20,
    nextDue: yearly(4, 20),
  },
  {
    title: 'Báo cáo kiểm kê KNK cấp cơ sở (02 năm/lần)',
    description: 'NĐ 06/2022/NĐ-CP sửa đổi bởi NĐ 119/2025/NĐ-CP và NĐ 83/2026/NĐ-CP; danh mục QĐ 42/2026/QĐ-TTg. Mẫu 06 Phụ lục II, gồm số liệu 02 năm liền trước, gửi UBND tỉnh trước 31/3 (kỳ tới: số liệu 2025–2026, trước 31/3/2027).',
    category: 'bao_cao',
    recurrence: 'biennial',
    remind_days: 60,
    nextDue: biennial(3, 31, 2027),
  },
  {
    title: 'Báo cáo giảm nhẹ phát thải KNK cấp cơ sở hằng năm',
    description: 'Mẫu 02 Phụ lục III (NĐ 06/2022 sửa đổi bởi NĐ 119/2025) – trước 31/3, áp dụng từ năm 2027 cho số liệu năm 2026.',
    category: 'bao_cao',
    recurrence: 'yearly',
    remind_days: 45,
    nextDue: yearly(3, 31, 2027),
  },
  {
    title: 'Kiểm toán năng lượng bắt buộc (03 năm/lần)',
    description: 'Cơ sở sử dụng năng lượng trọng điểm – Luật 50/2010/QH12 sửa đổi bởi Luật 77/2025/QH15. Điều chỉnh hạn theo kỳ kiểm toán gần nhất; phạm vi gồm hệ nhiệt (lò hơi, lò sấy), đốt kèm sinh khối, điện mặt trời mái nhà.',
    category: 'bao_cao',
    recurrence: 'none',
    remind_days: 90,
    nextDue: (from) => iso(new Date(from.getFullYear() + 1, 11, 31)),
  },
  {
    title: 'Tổng hợp số liệu CTNH, CTRCN, CTRSH tháng',
    description: 'Sổ giao nhận, chứng từ chuyển giao; phục vụ báo cáo công tác BVMT và chỉ số GRI 306.',
    category: 'bao_cao',
    recurrence: 'monthly',
    remind_days: 5,
    nextDue: monthly(5),
  },
  {
    title: 'Đánh giá nội bộ, xem xét của lãnh đạo ISO 14001:2015',
    description: 'Điều khoản 9.2, 9.3; cập nhật danh mục văn bản pháp luật áp dụng và đánh giá sự tuân thủ (9.1.2) trước kỳ đánh giá của tổ chức chứng nhận.',
    category: 'khac',
    recurrence: 'yearly',
    remind_days: 45,
    nextDue: yearly(11, 30),
  },
  // ---------- An toàn, vệ sinh lao động ----------
  {
    title: 'Kế hoạch ATVSLĐ năm',
    description: 'Luật ATVSLĐ Điều 76: lập cùng kế hoạch sản xuất – kinh doanh; gồm huấn luyện, QTMTLĐ, khám sức khỏe, PTBVCN, kiểm định thiết bị.',
    category: 'khac',
    recurrence: 'yearly',
    remind_days: 30,
    nextDue: yearly(1, 31),
  },
  {
    title: 'Báo cáo TNLĐ 6 tháng đầu năm',
    description: 'Phụ lục XII NĐ 39/2016/NĐ-CP – gửi trước 05/7 tới Sở Nội vụ nơi đặt trụ sở chính (xác nhận công ty tổng hợp hay chi nhánh tự nộp). Xử phạt: NĐ 283/2026 Điều 31 k3.',
    category: 'bao_cao',
    recurrence: 'yearly',
    remind_days: 20,
    nextDue: yearly(7, 5),
  },
  {
    title: 'Báo cáo TNLĐ năm',
    description: 'Phụ lục XII NĐ 39/2016/NĐ-CP – gửi trước 10/01 năm sau tới Sở Nội vụ.',
    category: 'bao_cao',
    recurrence: 'yearly',
    remind_days: 20,
    nextDue: yearly(1, 10),
  },
  {
    title: 'Báo cáo công tác ATVSLĐ năm',
    description: 'Phụ lục II TT 07/2016/TT-BLĐTBXH – gửi trước 10/01 năm sau tới Sở Nội vụ, Sở Y tế (từ 01/3/2025 Bộ/Sở Nội vụ thay LĐTBXH).',
    category: 'bao_cao',
    recurrence: 'yearly',
    remind_days: 20,
    nextDue: yearly(1, 10),
  },
  {
    title: 'Báo cáo y tế lao động 6 tháng',
    description: 'Phụ lục 8 TT 19/2016/TT-BYT – gửi trước 05/7 tới Trung tâm Y tế.',
    category: 'bao_cao',
    recurrence: 'yearly',
    remind_days: 20,
    nextDue: yearly(7, 5),
  },
  {
    title: 'Báo cáo y tế lao động năm',
    description: 'Phụ lục 8 TT 19/2016/TT-BYT – gửi trước 10/01 năm sau tới Trung tâm Y tế.',
    category: 'bao_cao',
    recurrence: 'yearly',
    remind_days: 20,
    nextDue: yearly(1, 10),
  },
  {
    title: 'Quan trắc môi trường lao động',
    description: 'Ít nhất 01 lần/năm (Luật ATVSLĐ Điều 18; NĐ 44/2016); đo cùng mùa (tháng 3–4) để so sánh giữa các năm. Công khai kết quả cho NLĐ (NĐ 283/2026 Điều 38). Nhập kết quả tại Sức khỏe nghề nghiệp.',
    category: 'quan_trac',
    recurrence: 'yearly',
    remind_days: 45,
    nextDue: yearly(4, 30),
  },
  {
    title: 'Khám sức khỏe định kỳ và khám phát hiện bệnh nghề nghiệp',
    description: 'Luật ATVSLĐ Điều 21: ít nhất 01 lần/năm; NLĐ làm nghề nặng nhọc, độc hại, nguy hiểm 06 tháng/lần. Khám BNN cho NLĐ tiếp xúc yếu tố vượt chuẩn (danh mục 35 BNN – TT 60/2025/TT-BYT).',
    category: 'khac',
    recurrence: 'yearly',
    remind_days: 45,
    nextDue: yearly(6, 30),
  },
  {
    title: 'Huấn luyện ATVSLĐ định kỳ – nhóm 4',
    description: 'NĐ 44/2016/NĐ-CP Điều 19: nhóm 4 định kỳ hằng năm. Theo dõi tại Nhân sự & Huấn luyện. Xử phạt: NĐ 283/2026 Điều 36.',
    category: 'dao_tao',
    recurrence: 'yearly',
    remind_days: 30,
    nextDue: yearly(3, 31),
  },
  {
    title: 'Huấn luyện ATVSLĐ định kỳ – nhóm 1, 2, 3, 5, 6',
    description: 'NĐ 44/2016/NĐ-CP Điều 19: ít nhất 02 năm/lần, thời lượng ≥ 50% lần đầu; nhóm 3 cấp lại thẻ an toàn.',
    category: 'dao_tao',
    recurrence: 'biennial',
    remind_days: 45,
    nextDue: biennial(6, 30, 2027),
  },
  // ---------- PCCC ----------
  {
    title: 'Tự kiểm tra an toàn PCCC định kỳ',
    description: 'NĐ 106/2025 (sửa đổi bởi NĐ 69/2026) Điều 10 k3: không tự kiểm tra định kỳ 10–20 triệu. Dùng checklist PCCC tại PCCC & An toàn.',
    category: 'khac',
    recurrence: 'quarterly',
    remind_days: 10,
    nextDue: quarterEnd(),
  },
  {
    title: 'Thực tập phương án chữa cháy, CNCH',
    description: 'NĐ 105/2025/NĐ-CP; xử phạt NĐ 106/2025 Điều 26 k4 (15–20 triệu) nếu không thực tập. Ghi kết quả tại PCCC & An toàn › Diễn tập.',
    category: 'dao_tao',
    recurrence: 'yearly',
    remind_days: 30,
    nextDue: yearly(10, 31),
  },
]

/** Dòng compliance_tasks để chèn (thêm org_id, facility_id) */
export function obligationRows(base: Record<string, string>, from = new Date(), assignedTo: string | null = null) {
  return OBLIGATION_TEMPLATES.map((o) => ({
    ...base,
    title: o.title,
    description: o.description,
    category: o.category,
    due_date: o.nextDue(from),
    recurrence: o.recurrence,
    remind_days: o.remind_days,
    assigned_to: assignedTo,
    status: 'pending',
  }))
}
