// Bộ mẫu nghiệp vụ cho nhà máy phân bón NPK: chính sách & mục tiêu ESG, danh mục nội quy nội bộ,
// checklist. Nạp vào tổ chức tại Cài đặt → "Bộ mẫu nghiệp vụ" (hoặc dùng ngay ở chế độ dùng thử).
// Nội dung là DỰ THẢO để cán bộ môi trường – an toàn chỉnh sửa, ban hành theo thẩm quyền.
import { COMPLIANCE_CHECKLISTS, VSCN_MONTHLY_CHECKLIST } from './checklistTemplates'

export interface PolicyTemplate {
  pillar: 'E' | 'S' | 'G'
  title: string
  owner: string
  frameworks: string
  commitments: string[]
}

export const ESG_POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    pillar: 'E',
    title: 'Chính sách môi trường (ISO 14001:2015)',
    owner: 'Phòng Kỹ thuật Sản xuất',
    frameworks: 'TCVN ISO 14001:2015 điều 5.2; GRI 2-23; QĐ 46/2026/QĐ-TTg (tiêu chí môi trường)',
    commitments: [
      'Tuân thủ Giấy phép môi trường số 2986/GPMT-STNMT và pháp luật về bảo vệ môi trường; áp dụng QCVN 40:2025/BTNMT, QCVN 19:2024/BTNMT theo lộ trình.',
      'Phòng ngừa ô nhiễm: vận hành liên tục HTXLNT 120 m³/ngày đêm, hệ thống xử lý bụi – khí thải lò hơi, lò sấy tạo hạt.',
      'Phân loại chất thải tại nguồn; chỉ chuyển giao CTNH, CTRCN cho đơn vị có chức năng, có chứng từ.',
      'Sử dụng năng lượng, nước tiết kiệm và hiệu quả; tăng tỷ lệ năng lượng tái tạo.',
      'Bảo vệ lưu vực sông Vàm Cỏ Đông; kiểm soát rơi vãi phân bón theo nước mưa.',
      'Cải tiến liên tục hệ thống quản lý môi trường; phổ biến chính sách tới người lao động và nhà thầu.',
    ],
  },
  {
    pillar: 'E',
    title: 'Cam kết khí hậu – giảm phát thải khí nhà kính',
    owner: 'Phòng Kỹ thuật Sản xuất',
    frameworks:
      'NĐ 06/2022/NĐ-CP (sửa đổi bởi NĐ 119/2025/NĐ-CP); GHG Protocol; ISO 14064-1; GRI 305 → GRI 102: Climate Change 2025 (kỳ báo cáo từ 2027)',
    commitments: [
      'Kiểm kê KNK cấp cơ sở định kỳ (phạm vi 1, 2), hướng tới thẩm định độc lập theo ISO 14064-3.',
      'Thực hiện Kế hoạch giảm nhẹ phát thải KNK cấp cơ sở giai đoạn 2026–2030; báo cáo kết quả hằng năm.',
      'Giảm cường độ phát thải (tCO₂e/tấn thành phẩm) so với năm gốc.',
      'Ưu tiên tiết kiệm năng lượng (khí nén, động cơ, chiếu sáng), đốt kèm sinh khối khi đã điều chỉnh GPMT, điện mặt trời mái nhà.',
      'Từng bước kiểm kê phạm vi 3: nguyên liệu mua vào, vận chuyển, sử dụng sản phẩm.',
      'Không công bố "trung hòa carbon", "không phát thải" khi chưa có kiểm kê và thẩm định.',
    ],
  },
  {
    pillar: 'S',
    title: 'Chính sách an toàn, vệ sinh lao động và PCCC',
    owner: 'Hội đồng ATVSLĐ cơ sở',
    frameworks: 'Luật ATVSLĐ 2015; Luật PCCC và CNCH 2024; GRI 403; QĐ 46/2026/QĐ-TTg (tiêu chí xã hội)',
    commitments: [
      '100% người lao động được huấn luyện ATVSLĐ, PCCC & CNCH, ứng phó sự cố chất thải trước khi bố trí công việc và định kỳ theo quy định.',
      'Nhận diện mối nguy, đánh giá rủi ro: urê nóng chảy, NH₃, bụi phân bón, lò sấy, băng tải, xe nâng, làm việc trên cao, không gian hạn chế, cầu cảng.',
      'Kiểm định thiết bị nghiêm ngặt; cấp phương tiện bảo vệ cá nhân; quan trắc môi trường lao động; khám sức khỏe định kỳ.',
      'Mục tiêu không để xảy ra tai nạn lao động nghiêm trọng, cháy nổ.',
      'Diễn tập PCCC, ứng phó sự cố hóa chất – môi trường hằng năm.',
    ],
  },
  {
    pillar: 'S',
    title: 'Chính sách nhà thầu và nhà cung cấp có trách nhiệm',
    owner: 'Ban Điều hành Nhà máy',
    frameworks: 'MT-HD07; GRI 308-1, 414-1; QĐ 46/2026/QĐ-TTg (đánh giá ESG nhà cung cấp)',
    commitments: [
      'Nhà thầu, khách ký cam kết BVMT – an toàn – PCCC và được hướng dẫn an toàn trước khi vào nhà máy.',
      'Hợp đồng có điều khoản bảo vệ môi trường, an toàn; vi phạm xử lý theo hợp đồng.',
      'Sàng lọc nhà cung cấp mới theo tiêu chí môi trường – xã hội; ưu tiên đơn vị có giấy phép, chứng nhận phù hợp.',
    ],
  },
  {
    pillar: 'S',
    title: 'Chính sách người lao động và quan hệ cộng đồng',
    owner: 'Phòng Tổ chức – Hành chính',
    frameworks: 'Bộ luật Lao động 2019; GRI 401, 404, 405, 413; TT 96/2020/TT-BTC PL IV mục II.6–7',
    commitments: [
      'Tuân thủ pháp luật lao động; không sử dụng lao động trẻ em, lao động cưỡng bức; bảo đảm bình đẳng giới.',
      'Đối thoại định kỳ tại nơi làm việc; có kênh tiếp nhận phản ánh của người lao động và cộng đồng.',
      'Đào tạo, phát triển kỹ năng; công bố thu nhập bình quân, giờ đào tạo trong Báo cáo thường niên.',
      'Đồng hành cùng cộng đồng địa phương; minh bạch thông tin môi trường của nhà máy.',
    ],
  },
  {
    pillar: 'G',
    title: 'Bộ quy tắc ứng xử và phòng, chống tham nhũng',
    owner: 'Công ty (HĐQT, Ban Tổng Giám đốc)',
    frameworks: 'Luật Phòng, chống tham nhũng 2018; GRI 205; QĐ 46/2026/QĐ-TTg (tiêu chí quản trị)',
    commitments: [
      'Không dung thứ tham nhũng, hối lộ; quy định về quà tặng, xung đột lợi ích.',
      'Có kênh tố cáo và cơ chế bảo vệ người tố cáo.',
      'Đào tạo, truyền thông phòng, chống tham nhũng cho cán bộ quản lý và bộ phận mua sắm.',
    ],
  },
  {
    pillar: 'G',
    title: 'Chính sách công bố thông tin ESG',
    owner: 'Công ty (Ban/Tổ phát triển bền vững)',
    frameworks: 'TT 96/2020/TT-BTC PL IV; QĐ 46/2026/QĐ-TTg (PL VI–VII); GRI 1, 2, 3; ISAE 3000/3410',
    commitments: [
      'Một bộ số liệu dùng chung cho Báo cáo thường niên (TT 96/2020), báo cáo áp dụng khung ESG (QĐ 46/2026) và báo cáo phát triển bền vững theo GRI.',
      'Mọi số liệu ESG truy được về sổ gốc (sổ chất thải, hóa đơn năng lượng, phiếu quan trắc, hồ sơ huấn luyện); ghi rõ phạm vi, năm, mẫu số.',
      'Chuẩn bị chuyển đổi sang GRI 102: Climate Change 2025 và GRI 103: Energy 2025 từ kỳ báo cáo 2027.',
      'Hướng tới thẩm định độc lập báo cáo ESG.',
    ],
  },
  {
    pillar: 'G',
    title: 'Chính sách tuân thủ pháp luật và nội quy nội bộ',
    owner: 'Phòng Kỹ thuật Sản xuất',
    frameworks: 'TCVN ISO 14001:2015 điều 6.1.3, 9.1.2; Bộ luật Lao động 2019 Điều 118–127',
    commitments: [
      'Cập nhật yêu cầu pháp luật; tự kiểm tra tuân thủ hằng quý theo bảng đối chiếu các nghị định xử phạt.',
      'Kiểm tra môi trường – vệ sinh công nghiệp hằng tháng; xếp loại đơn vị và công khai kết quả.',
      'Xử lý vi phạm đúng pháp luật: kỷ luật lao động theo Nội quy lao động (không phạt tiền), nhà thầu theo hợp đồng.',
    ],
  },
]

export interface TargetTemplate {
  pillar: 'E' | 'S' | 'G'
  title: string
  metric_key: string | null
  unit: string
  direction: 'decrease' | 'increase'
  baseline_year: number | null
  target_year: number
  target_value: number | null
  target_pct: number | null
  gri_code: string | null
  note: string | null
}

export const ESG_TARGET_TEMPLATES: TargetTemplate[] = [
  {
    pillar: 'E',
    title: 'Giảm cường độ phát thải KNK (phạm vi 1 + 2) so với năm gốc',
    metric_key: 'ghg_intensity',
    unit: 'tCO₂e/t thành phẩm',
    direction: 'decrease',
    baseline_year: 2024,
    target_year: 2030,
    target_value: null,
    target_pct: -10,
    gri_code: 'GRI 305-4',
    note: 'Đồng bộ với Kế hoạch giảm nhẹ KNK cấp cơ sở 2026–2030',
  },
  {
    pillar: 'E',
    title: 'Giảm cường độ năng lượng',
    metric_key: 'energy_intensity',
    unit: 'kgOE/t thành phẩm',
    direction: 'decrease',
    baseline_year: 2024,
    target_year: 2030,
    target_value: null,
    target_pct: -5,
    gri_code: 'GRI 302-3',
    note: null,
  },
  {
    pillar: 'E',
    title: 'Tỷ lệ năng lượng tái tạo trong tổng năng lượng',
    metric_key: 'renewable_share',
    unit: '%',
    direction: 'increase',
    baseline_year: 2025,
    target_year: 2030,
    target_value: 10,
    target_pct: null,
    gri_code: 'GRI 302-1',
    note: 'Sinh khối đốt kèm + điện mặt trời mái nhà (đề xuất – điều chỉnh theo kế hoạch đầu tư)',
  },
  {
    pillar: 'E',
    title: 'Điểm thu gom đạt phân loại 3 nhóm CTRSH khi kiểm tra tháng',
    metric_key: null,
    unit: '%',
    direction: 'increase',
    baseline_year: null,
    target_year: 2027,
    target_value: 100,
    target_pct: null,
    gri_code: 'GRI 306-2',
    note: 'Nhập tay từ biên bản kiểm tra tháng',
  },
  {
    pillar: 'S',
    title: 'Người lao động còn hiệu lực huấn luyện ATVSLĐ',
    metric_key: 'training_atvsld_pct',
    unit: '%',
    direction: 'increase',
    baseline_year: null,
    target_year: 2026,
    target_value: 100,
    target_pct: null,
    gri_code: 'GRI 403-5',
    note: null,
  },
  {
    pillar: 'S',
    title: 'Người lao động còn hiệu lực huấn luyện PCCC & CNCH',
    metric_key: 'training_pccc_pct',
    unit: '%',
    direction: 'increase',
    baseline_year: null,
    target_year: 2026,
    target_value: 100,
    target_pct: null,
    gri_code: 'GRI 403-5',
    note: null,
  },
  {
    pillar: 'S',
    title: 'Người lao động được tập huấn ứng phó sự cố chất thải trong năm',
    metric_key: 'training_scct_pct',
    unit: '%',
    direction: 'increase',
    baseline_year: null,
    target_year: 2026,
    target_value: 100,
    target_pct: null,
    gri_code: 'GRI 403-5',
    note: 'Quy định tuân thủ môi trường nội bộ: tập huấn lại hằng năm',
  },
  {
    pillar: 'S',
    title: 'Không để xảy ra tai nạn lao động',
    metric_key: 'lti',
    unit: 'vụ',
    direction: 'decrease',
    baseline_year: null,
    target_year: 2026,
    target_value: 0,
    target_pct: null,
    gri_code: 'GRI 403-9',
    note: null,
  },
  {
    pillar: 'S',
    title: 'Giờ đào tạo bình quân mỗi người lao động',
    metric_key: 'training_hours',
    unit: 'giờ/người',
    direction: 'increase',
    baseline_year: null,
    target_year: 2026,
    target_value: 16,
    target_pct: null,
    gri_code: 'GRI 404-1',
    note: null,
  },
  {
    pillar: 'G',
    title: 'Giảm vi phạm nội quy nội bộ so với năm gốc',
    metric_key: 'violations',
    unit: 'vụ',
    direction: 'decrease',
    baseline_year: 2025,
    target_year: 2027,
    target_value: null,
    target_pct: -50,
    gri_code: null,
    note: null,
  },
  {
    pillar: 'G',
    title: 'Số tiêu chí ESG tự nguyện áp dụng (QĐ 46/2026/QĐ-TTg)',
    metric_key: null,
    unit: 'tiêu chí',
    direction: 'increase',
    baseline_year: null,
    target_year: 2027,
    target_value: 18,
    target_pct: null,
    gri_code: null,
    note: 'Doanh nghiệp lớn: tối thiểu 18 tiêu chí, đủ E – S – G',
  },
]

export interface RuleTemplate {
  code: string | null
  title: string
  category: string
  status: 'draft' | 'active'
  summary: string
}

export const INTERNAL_RULE_TEMPLATES: RuleTemplate[] = [
  {
    code: null,
    title: 'Quy định tuân thủ môi trường nội bộ và phân loại chất thải tại nguồn',
    category: 'moi_truong',
    status: 'draft',
    summary:
      'Mỗi thông số vượt giới hạn, mỗi khu vực/điểm thu gom không đạt, mỗi hành vi đổ, xả, đốt chất thải sai quy định = 1 lần không đạt. Kiểm tra tháng 100% điểm thu gom; xếp loại A/B/C/D. Người lao động xử lý kỷ luật theo Nội quy lao động (không phạt tiền); nhà thầu theo hợp đồng.',
  },
  {
    code: null,
    title: 'Quy định môi trường – vệ sinh công nghiệp mặt bằng',
    category: 'vscn',
    status: 'draft',
    summary:
      'Giao mặt bằng cho từng đơn vị; kiểm tra ít nhất 01 lần/tháng và đột xuất; xếp loại theo số lần không đạt; tổng hợp tháng chuyển Phòng Tổ chức – Hành chính.',
  },
  {
    code: 'MT-HD03-NQ',
    title: 'Nội quy kho chất thải nguy hại',
    category: 'moi_truong',
    status: 'active',
    summary:
      'Thùng có nắp, nhãn tên – mã CTNH, dấu hiệu cảnh báo; sổ tiếp nhận; vật liệu thấm hút, bình chữa cháy; không lưu giữ quá thời hạn.',
  },
  {
    code: 'MT-HD02',
    title: 'Kiểm soát hóa chất',
    category: 'hoa_chat',
    status: 'active',
    summary:
      'Danh mục hóa chất, phiếu an toàn hóa chất tại nơi sử dụng; nhãn bắt buộc; sang chiết phải dán nhãn mới; kiểm tra khu chứa hằng tuần.',
  },
  {
    code: 'MT-HD04',
    title: 'Kiểm soát nước thải',
    category: 'moi_truong',
    status: 'active',
    summary: 'Nhật ký vận hành HTXLNT; pH hằng ngày; COD, SS 3–5 lần/tuần khi ổn định; nạo vét hố ga định kỳ.',
  },
  {
    code: 'MT-HD05',
    title: 'Kiểm soát khí thải',
    category: 'moi_truong',
    status: 'active',
    summary:
      'Nhật ký vận hành từng hệ xử lý; chênh áp lọc túi > 260 mmH₂O báo cơ điện và Ban Điều hành; thay túi lọc tối thiểu 3 tháng/lần/máy.',
  },
  {
    code: 'MT-HD01',
    title: 'Kiểm soát phòng cháy, chữa cháy',
    category: 'pccc',
    status: 'active',
    summary: 'Bình chữa cháy gắn thẻ, kiểm tra hằng tháng; lối thoát nạn thông thoáng; nội quy, tiêu lệnh PCCC niêm yết.',
  },
  {
    code: 'MT-HD07',
    title: 'Kiểm soát nhà thầu và khách',
    category: 'nha_thau',
    status: 'active',
    summary:
      'Hướng dẫn an toàn trước khi vào; ký cam kết BVMT – AT – PCCC; hàn, cắt, làm việc trên cao ≥ 2 người và có giám sát. Vi phạm: lần 1 nhắc nhở, lần 2 cảnh cáo bằng văn bản, lần 3 tạm dừng.',
  },
  {
    code: null,
    title: 'Nội quy an toàn, vệ sinh lao động – PCCC',
    category: 'atvsld',
    status: 'draft',
    summary:
      'Viết theo rủi ro thực tế: urê nóng chảy, NH₃, bụi phân bón, lò sấy than/sinh khối, băng tải, xe nâng, làm việc trên cao, không gian hạn chế, cầu cảng.',
  },
  {
    code: null,
    title: 'Nội quy lao động',
    category: 'lao_dong',
    status: 'active',
    summary:
      'Căn cứ xử lý kỷ luật lao động (BLLĐ 2019 Điều 124): khiển trách; kéo dài thời hạn nâng lương ≤ 6 tháng; cách chức; sa thải. Không phạt tiền, cắt lương (Điều 127).',
  },
]

export const CHECKLIST_TEMPLATES = [VSCN_MONTHLY_CHECKLIST, ...COMPLIANCE_CHECKLISTS]

/** Dòng dữ liệu để chèn vào bảng (thêm org_id, facility_id khi gọi) */
export function policyRows(base: Record<string, string>) {
  return ESG_POLICY_TEMPLATES.map((p) => ({
    ...base,
    pillar: p.pillar,
    title: p.title,
    owner: p.owner,
    frameworks: p.frameworks,
    commitments: p.commitments.join('\n'),
    status: 'draft',
  }))
}

export function targetRows(base: Record<string, string>) {
  return ESG_TARGET_TEMPLATES.map((t) => ({ ...base, ...t }))
}

export function ruleRows(base: Record<string, string>) {
  return INTERNAL_RULE_TEMPLATES.map((r) => ({ ...base, ...r }))
}

export function checklistRows(base: Record<string, string>) {
  return CHECKLIST_TEMPLATES.map((c) => ({ ...base, ...c }))
}
