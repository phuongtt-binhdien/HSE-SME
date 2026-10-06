// Bảng tự kiểm tra tuân thủ theo các nghị định xử phạt (Phụ lục 6 – Quy định tuân thủ môi trường nội bộ).
// Mỗi hạng mục: nội dung, căn cứ và khung xử phạt, bằng chứng cần xem, gợi ý khắc phục, đơn vị phụ trách.
// Mức phạt chỉ để định hướng mức độ rủi ro — đối chiếu nghị định hiện hành (NĐ 45/2022 đang có dự thảo thay thế).

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

export const COMPLIANCE_CHECKLISTS: ChecklistTemplateSeed[] = [
  {
    "name": "Tự kiểm tra tuân thủ bảo vệ môi trường (NĐ 45/2022/NĐ-CP)",
    "category": "MT",
    "frequency": "quarterly",
    "items": [
      {
        "label": "GPMT 2986 còn hiệu lực; bản sao lưu tại Nhà máy; đã công khai theo quy định",
        "hint": "Căn cứ: Điều 11 · Mức phạt: Theo khung Điều 11 · Quy định nội bộ: Điều 3, 25 · Bằng chứng: GPMT; văn bản công khai GPMT",
        "fix": "Bổ sung bản lưu; công khai lại nếu thiếu",
        "owner": "KT-SX"
      },
      {
        "label": "Thực hiện đúng, đủ các nội dung GPMT (nguồn thải, công trình, lưu lượng xả lớn nhất, quy chuẩn)",
        "hint": "Căn cứ: Điều 11 · Mức phạt: Theo khung Điều 11 (thẩm quyền cấp tỉnh) · Quy định nội bộ: Điều 9, 10 · Bằng chứng: Đối chiếu GPMT PL1–5 với hiện trạng",
        "fix": "Lập danh mục sai khác; khắc phục hoặc báo cáo cơ quan cấp phép",
        "owner": "KT-SX"
      },
      {
        "label": "Không thay đổi nhiên liệu, thiết bị, công suất, nguồn thải khi chưa báo cáo/chưa được điều chỉnh GPMT (vd: chuyển sang đốt sinh khối, lắp lò sấy mới)",
        "hint": "Căn cứ: Điều 11 (không cấp điều chỉnh GPMT) · Mức phạt: Theo khung Điều 11 · Quy định nội bộ: Điều 13 · Bằng chứng: văn bản trao đổi với cơ quan cấp phép; nhật ký nhiên liệu lò sấy",
        "fix": "Dừng thay đổi chưa được phép; hoàn tất hồ sơ điều chỉnh GPMT, VHTN",
        "owner": "KT-SX, Ban Điều hành"
      },
      {
        "label": "Hệ thống xử lý nước thải vận hành thường xuyên, đúng quy trình; có sổ nhật ký vận hành",
        "hint": "Căn cứ: Điều 11 (không vận hành/không thường xuyên công trình xử lý) · Mức phạt: Theo khung Điều 11 · Quy định nội bộ: Điều 10 · Bằng chứng: Sổ nhật ký HTXLNT; kiểm tra hiện trường",
        "fix": "Vận hành lại ngay; bổ sung nhật ký; đào tạo người vận hành",
        "owner": "Tổ vận hành HTXLNT"
      },
      {
        "label": "Có bơm, thiết bị dự phòng HTXLNT để thay thế ngay (GPMT PL1 B.1.5)",
        "hint": "Căn cứ: Điều 11 · Mức phạt: Theo khung Điều 11 · Quy định nội bộ: Điều 10 · Bằng chứng: Danh mục thiết bị dự phòng trong kho",
        "fix": "Lập đề nghị mua sắm thiết bị dự phòng (bơm định lượng, máy thổi khí…)",
        "owner": "KT-SX, Vật tư XNK"
      },
      {
        "label": "Nước thải sau xử lý đạt 9 thông số giới hạn GPMT (pH, BOD5, COD, TSS, amoni, tổng N, tổng P, Clo dư, Coliform)",
        "hint": "Căn cứ: Điều 18 · Mức phạt: Theo lưu lượng và mức vượt · Quy định nội bộ: Điều 10, 21 · Bằng chứng: Phiếu kết quả gần nhất",
        "fix": "Dừng xả, đưa về hồ sự cố; điều chỉnh hóa chất; lấy mẫu lại",
        "owner": "KT-SX"
      },
      {
        "label": "Không có đường ống, cửa xả bỏ qua (bypass) hệ thống xử lý; điểm xả có biển báo",
        "hint": "Căn cứ: NĐ 45/2022 – hành vi xả chất thải không qua xử lý · Mức phạt: Mức cao, có thể đình chỉ · Quy định nội bộ: Điều 3, 10 · Bằng chứng: Kiểm tra mạng thoát nước mưa – nước thải",
        "fix": "Bịt ngay đường xả trái phép; báo cáo Ban TGĐ",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Đo, ghi lưu lượng nước thải bằng đồng hồ Ø114 hằng ngày",
        "hint": "Căn cứ: Điều 11, 16 · Mức phạt: Theo khung · Quy định nội bộ: Điều 10, 20 · Bằng chứng: Sổ chỉ số đồng hồ",
        "fix": "Lập sổ ghi chỉ số; dùng làm căn cứ phí",
        "owner": "Tổ vận hành HTXLNT"
      },
      {
        "label": "Khí thải dòng 01–07 đạt giới hạn GPMT (bụi, NOx, SO2, CO, NH3)",
        "hint": "Căn cứ: Điều 20 · Mức phạt: Theo lưu lượng và mức vượt · Quy định nội bộ: Điều 9, 21 · Bằng chứng: Phiếu kết quả quý",
        "fix": "Dừng dây chuyền, kiểm tra lọc túi; lấy mẫu lại",
        "owner": "KT-SX, xưởng tạo hạt"
      },
      {
        "label": "Lưu lượng khí thải từng dòng không vượt lưu lượng xả lớn nhất trong GPMT",
        "hint": "Căn cứ: Điều 11 · Mức phạt: Theo khung Điều 11 · Quy định nội bộ: Điều 9 · Bằng chứng: Phiếu kết quả (lưu lượng); đối chiếu GPMT PL2",
        "fix": "Điều chỉnh quạt; đề nghị điều chỉnh GPMT nếu cần",
        "owner": "KT-SX"
      },
      {
        "label": "Hệ thống xử lý khí thải vận hành khi dây chuyền chạy; sổ nhật ký vận hành riêng từng hệ (ΔP, sự cố, thay túi)",
        "hint": "Căn cứ: Điều 11 · Mức phạt: Theo khung Điều 11 · Quy định nội bộ: Điều 9 · Bằng chứng: Sổ nhật ký từng hệ XLKT",
        "fix": "Lập sổ theo mẫu; ghi hằng ca",
        "owner": "Xưởng tạo hạt 1–3, lò hơi"
      },
      {
        "label": "Quan trắc khí thải định kỳ 03 tháng/lần đủ dòng, đủ thông số; đơn vị có VIMCERTS; lưu giữ kết quả",
        "hint": "Căn cứ: Điều 16 · Mức phạt: Theo khung Điều 16 · Quy định nội bộ: Điều 21 · Bằng chứng: Hợp đồng quan trắc; phiếu kết quả; lệnh dừng máy khi không lấy mẫu",
        "fix": "Bổ sung đợt thiếu; lưu lệnh dừng máy",
        "owner": "KT-SX"
      },
      {
        "label": "Vị trí lấy mẫu ống khói có lỗ, sàn thao tác đúng quy cách (TT 10/2021)",
        "hint": "Căn cứ: Điều 16 · Mức phạt: Theo khung Điều 16 · Quy định nội bộ: Điều 21 · Bằng chứng: kiểm tra hiện trường các ống khói",
        "fix": "Thi công sàn thao tác, lỗ lấy mẫu đúng quy cách",
        "owner": "KT-SX"
      },
      {
        "label": "Tiếng ồn, độ rung ngoài hàng rào đạt QCVN 26, 27:2010",
        "hint": "Căn cứ: NĐ 45/2022 – vi phạm về tiếng ồn, độ rung · Mức phạt: Theo mức vượt · Quy định nội bộ: Điều 11 · Bằng chứng: Kết quả đo (nếu có)",
        "fix": "Bảo dưỡng, bọc cách âm thiết bị",
        "owner": "Cơ điện"
      },
      {
        "label": "Chất thải rắn sinh hoạt phân loại 3 nhóm tại nguồn; thùng đúng màu, nhãn",
        "hint": "Căn cứ: Điều 26 · Mức phạt: Theo khung Điều 26 · Quy định nội bộ: Điều 14, 15; PL 2, 3 · Bằng chứng: Kiểm tra 100% điểm thu gom",
        "fix": "Bổ sung thùng, nhãn; nhắc nhở, đào tạo lại",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Chuyển giao CTRSH cho đơn vị có chức năng; hợp đồng còn hiệu lực; xác nhận khối lượng",
        "hint": "Căn cứ: Điều 26 · Mức phạt: Theo khung Điều 26 · Quy định nội bộ: Điều 15, 20 · Bằng chứng: Hợp đồng; biên bản/phiếu cân",
        "fix": "Ký/gia hạn hợp đồng",
        "owner": "KT-SX"
      },
      {
        "label": "Phân loại tại nguồn chất thải rắn công nghiệp thông thường; thiết bị, kho lưu giữ đạt yêu cầu",
        "hint": "Căn cứ: Điều 26 · Mức phạt: 20–25 triệu · Quy định nội bộ: Điều 16 · Bằng chứng: Khu CTRCN 216,5 m²; khu gom tại xưởng",
        "fix": "Bố trí khu gom, bao chứa có nhãn",
        "owner": "Các xưởng, kho"
      },
      {
        "label": "Lưu giữ riêng CTRCN đã phân loại; có kho/khu vực theo quy định",
        "hint": "Căn cứ: Điều 26 · Mức phạt: 25–30 triệu · Quy định nội bộ: Điều 16, 19 · Bằng chứng: Hiện trường kho",
        "fix": "Sắp xếp lại, tách khu",
        "owner": "Kho"
      },
      {
        "label": "Có biên bản bàn giao CTRCN cho mỗi lần chuyển giao",
        "hint": "Căn cứ: Điều 26 · Mức phạt: 3–5 triệu · Quy định nội bộ: Điều 20 · Bằng chứng: biên bản giao nhận với đơn vị tiếp nhận",
        "fix": "Lập biên bản cho mọi lần giao",
        "owner": "KT-SX"
      },
      {
        "label": "Không tự tái chế, xử lý CTRCN khi không đáp ứng yêu cầu BVMT; không dùng xỉ, tro san lấp",
        "hint": "Căn cứ: Điều 26 · Mức phạt: 30–50 triệu · Quy định nội bộ: Điều 3, 16 · Bằng chứng: Kiểm tra hiện trường, sổ",
        "fix": "Chuyển giao đơn vị có chức năng",
        "owner": "Ban Điều hành"
      },
      {
        "label": "CTNH phân loại, chứa trong thùng có nắp, nhãn mã CTNH, dấu hiệu cảnh báo; kho đạt yêu cầu",
        "hint": "Căn cứ: Điều 29 · Mức phạt: Theo khung Điều 29 · Quy định nội bộ: Điều 17 · Bằng chứng: Kho CTNH 75 m²",
        "fix": "Dán nhãn, thay thùng, bổ sung vật liệu thấm hút",
        "owner": "KT-SX"
      },
      {
        "label": "CTNH chuyển giao đơn vị có giấy phép; có chứng từ; không tự tái sử dụng, đốt, bán CTNH (dầu nhớt thải)",
        "hint": "Căn cứ: Điều 29 · Mức phạt: Theo khung Điều 29 · Quy định nội bộ: Điều 17 · Bằng chứng: Chứng từ CTNH; sổ giao nhận; hiện trường xưởng cơ điện",
        "fix": "Chuyển giao toàn bộ cho đơn vị có giấy phép; không tự tái sử dụng, đốt",
        "owner": "Ban Điều hành, Cơ điện"
      },
      {
        "label": "Kê khai đủ loại, khối lượng CTNH (gồm dịch thải phòng thí nghiệm, ắc quy, pin) trong báo cáo",
        "hint": "Căn cứ: Điều 29 · Mức phạt: Theo khung Điều 29 · Quy định nội bộ: Điều 17, 20 · Bằng chứng: Sổ CTNH; báo cáo BVMT",
        "fix": "Bổ sung danh mục, mã CTNH",
        "owner": "KT-SX"
      },
      {
        "label": "Kế hoạch phòng ngừa, ứng phó sự cố môi trường được ban hành; có thiết bị ứng phó; diễn tập",
        "hint": "Căn cứ: NĐ 45/2022 – vi phạm về phòng ngừa, ứng phó sự cố chất thải · Mức phạt: Theo khung · Quy định nội bộ: Điều 24 · Bằng chứng: Kế hoạch; biên bản diễn tập",
        "fix": "Ban hành/cập nhật; diễn tập hằng năm",
        "owner": "KT-SX, Ban Điều hành"
      },
      {
        "label": "Phương án ứng phó sự cố tràn dầu tại cầu cảng cập nhật căn cứ hiện hành; có bộ ứng cứu dầu tràn",
        "hint": "Căn cứ: NĐ 45/2022 – sự cố chất thải; quy chế ứng phó sự cố tràn dầu · Mức phạt: Theo khung · Quy định nội bộ: Điều 24 · Bằng chứng: Phương án; kiểm tra bộ ứng cứu tại cảng",
        "fix": "Cập nhật phương án (QĐ 12/2021/QĐ-TTg); trang bị phao, chất thấm dầu",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Báo cáo công tác BVMT nộp trước 15/01; số liệu khớp phiếu kết quả, chứng từ",
        "hint": "Căn cứ: NĐ 45/2022 – vi phạm về báo cáo công tác BVMT · Mức phạt: Theo khung · Quy định nội bộ: Điều 25 · Bằng chứng: Bản nộp có dấu tiếp nhận",
        "fix": "Kiểm tra chéo số liệu; lập đính chính nếu phát hiện sai",
        "owner": "KT-SX"
      },
      {
        "label": "Kê khai, nộp phí BVMT nước thải (NĐ 346/2025) và khí thải (NĐ 153/2024) đúng hạn ngày 20 tháng đầu quý sau",
        "hint": "Căn cứ: Pháp luật phí, quản lý thuế · Mức phạt: Theo pháp luật quản lý thuế · Quy định nội bộ: PL 4 Quy định · Bằng chứng: Tờ khai, chứng từ nộp",
        "fix": "Nộp bổ sung kèm giải trình",
        "owner": "KT-SX, Kế toán"
      },
      {
        "label": "Trách nhiệm tái chế (EPR): kê khai trước 31/3, đóng góp đúng hạn",
        "hint": "Căn cứ: NĐ 45/2022 – vi phạm trách nhiệm tái chế · Mức phạt: Theo khung · Quy định nội bộ: PL 4 Quy định · Bằng chứng: Bản kê khai; chứng từ chuyển khoản",
        "fix": "Kê khai, đóng góp bổ sung",
        "owner": "KT-SX, Kế toán"
      },
      {
        "label": "Kiểm kê khí nhà kính cấp cơ sở; kế hoạch giảm phát thải theo quy định",
        "hint": "Căn cứ: Điều 45 · Mức phạt: Theo khung Điều 45 · Quy định nội bộ: PL 4 Quy định · Bằng chứng: Báo cáo kiểm kê; văn bản nộp",
        "fix": "Hoàn thiện, nộp đúng hạn",
        "owner": "KT-SX"
      },
      {
        "label": "Không để rơi vãi nguyên liệu, thành phẩm khi vận chuyển, bốc xếp (đường nội bộ, cầu cảng); xe che chắn",
        "hint": "Căn cứ: Điều 25 · Mức phạt: Theo khung Điều 25 · Quy định nội bộ: Điều 11 · Bằng chứng: Kiểm tra hiện trường",
        "fix": "Thu dọn ngay; nhắc nhở lái xe, nhà thầu",
        "owner": "Kho, Ban Điều hành"
      },
      {
        "label": "Kho than, xỉ, sinh khối có mái, phủ bạt; không phát tán bụi",
        "hint": "Căn cứ: Điều 11 (GPMT PL4) · Mức phạt: Theo khung Điều 11 · Quy định nội bộ: Điều 16 · Bằng chứng: Kiểm tra hiện trường",
        "fix": "Phủ bạt, che chắn",
        "owner": "Lò hơi"
      },
      {
        "label": "Diện tích cây xanh ≥ 20% (≥ 31.261 m²)",
        "hint": "Căn cứ: Điều 11 (GPMT PL5 D.2) · Mức phạt: Theo khung Điều 11 · Quy định nội bộ: Điều 11 · Bằng chứng: Bản vẽ mặt bằng, đo đạc",
        "fix": "Bổ sung trồng cây",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Nhà thầu, khách ký cam kết BVMT; chất thải của nhà thầu được thu gom",
        "hint": "Căn cứ: Điều 26, 29 (trách nhiệm chủ nguồn thải) · Mức phạt: Theo khung · Quy định nội bộ: Điều 8, 29 · Bằng chứng: Phiếu nhà thầu MT-HD07",
        "fix": "Ký cam kết trước khi thi công",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Hồ sơ môi trường đầy đủ, xuất trình được khi kiểm tra (GPMT, ĐTM, phiếu QT, chứng từ, hợp đồng)",
        "hint": "Căn cứ: NĐ 45/2022 – cản trở, không cung cấp thông tin khi kiểm tra · Mức phạt: Theo khung · Quy định nội bộ: Điều 5, 25 · Bằng chứng: Danh mục hồ sơ",
        "fix": "Bổ sung, số hóa hồ sơ",
        "owner": "KT-SX"
      }
    ]
  },
  {
    "name": "Tự kiểm tra tuân thủ PCCC & CNCH (NĐ 106/2025/NĐ-CP)",
    "category": "PCCC",
    "frequency": "quarterly",
    "items": [
      {
        "label": "Hồ sơ quản lý công tác PCCC và CNCH của cơ sở được lập, cập nhật",
        "hint": "Căn cứ: NĐ 106/2025 · Mức phạt: Theo khung · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Hồ sơ PCCC",
        "fix": "Lập, cập nhật hồ sơ",
        "owner": "Ban Điều hành, ATVSLĐ"
      },
      {
        "label": "Ban hành và niêm yết nội quy, biển cấm, biển báo, biển chỉ dẫn PCCC và CNCH",
        "hint": "Căn cứ: NĐ 106/2025 · Mức phạt: 6–8 triệu · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Kiểm tra hiện trường",
        "fix": "Bổ sung nội quy, biển báo",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Thành lập Đội PCCC và CNCH cơ sở; có quyết định, phân công",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 8 · Mức phạt: 10–20 triệu (khoản 4) · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Quyết định thành lập đội",
        "fix": "Ra quyết định, kiện toàn đội",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Bố trí lực lượng, phương tiện của Đội PCCC cơ sở trực hằng ngày",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 8 · Mức phạt: 8–10 triệu · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Sổ trực",
        "fix": "Lập lịch trực",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Trang bị phương tiện PCCC, CNCH cho Đội PCCC cơ sở theo quy định",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 8 · Mức phạt: 15–20 triệu · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Danh mục trang bị",
        "fix": "Bổ sung trang bị",
        "owner": "Vật tư XNK"
      },
      {
        "label": "Thành viên Đội PCCC cơ sở được huấn luyện, bồi dưỡng nghiệp vụ PCCC và CNCH",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 6 · Mức phạt: Theo khung Điều 6 · Quy định nội bộ: Điều 30 · Bằng chứng: Giấy chứng nhận huấn luyện",
        "fix": "Tổ chức huấn luyện",
        "owner": "ATVSLĐ"
      },
      {
        "label": "Xây dựng phương án chữa cháy, cứu nạn, cứu hộ của cơ sở",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 26 khoản 5 · Mức phạt: 20–25 triệu · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Phương án được phê duyệt",
        "fix": "Xây dựng, trình phê duyệt",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Tổ chức thực tập phương án chữa cháy, CNCH theo quy định",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 26 khoản 4 · Mức phạt: 15–20 triệu · Quy định nội bộ: Điều 24; PL 4 · Bằng chứng: Biên bản thực tập",
        "fix": "Tổ chức thực tập",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Bình chữa cháy, hệ thống báo cháy, chữa cháy, nước chữa cháy được kiểm tra, bảo dưỡng; còn hạn, hoạt động tốt",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 20, 21, 22 · Mức phạt: Theo khung · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Sổ kiểm tra, tem bảo dưỡng",
        "fix": "Nạp lại, sửa chữa, thay thế",
        "owner": "Cơ điện"
      },
      {
        "label": "Kho CTNH, kho dầu, khu hóa chất có bình chữa cháy, cát, biển cấm lửa",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 20, 21 · Mức phạt: Theo khung · Quy định nội bộ: Điều 17; PL 5 · Bằng chứng: Kiểm tra hiện trường",
        "fix": "Bổ sung trang bị",
        "owner": "KT-SX, Kho"
      },
      {
        "label": "Đường giao thông, bãi đỗ cho xe chữa cháy thông thoáng; lối thoát nạn không bị chắn",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 27 · Mức phạt: Theo khung Điều 27 · Quy định nội bộ: PL 5 Quy định · Bằng chứng: Kiểm tra hiện trường",
        "fix": "Dọn chướng ngại ngay",
        "owner": "Kho, Ban Điều hành"
      },
      {
        "label": "Đèn chiếu sáng sự cố, đèn chỉ dẫn thoát nạn hoạt động",
        "hint": "Căn cứ: NĐ 106/2025 · Mức phạt: Theo khung · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Thử đèn",
        "fix": "Thay thế",
        "owner": "Cơ điện"
      },
      {
        "label": "Mua bảo hiểm cháy, nổ bắt buộc (nếu thuộc diện)",
        "hint": "Căn cứ: NĐ 106/2025 – Điều 17 · Mức phạt: Đến 30–40 triệu (khoản 3, cơ sở nhóm 2) · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Hợp đồng bảo hiểm còn hiệu lực",
        "fix": "Mua/gia hạn",
        "owner": "Kế toán"
      },
      {
        "label": "Kiểm soát nguồn nhiệt: hàn, cắt có giấy phép làm việc nóng, người giám sát, bình chữa cháy",
        "hint": "Căn cứ: NĐ 106/2025 · Mức phạt: Theo khung · Quy định nội bộ: Điều 8; MT-HD07 · Bằng chứng: Giấy phép làm việc nóng",
        "fix": "Dừng công việc; cấp giấy phép",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Bãi than, sinh khối: theo dõi nhiệt độ, chống tự cháy; khoảng cách an toàn",
        "hint": "Căn cứ: NĐ 106/2025 · Mức phạt: Theo khung · Quy định nội bộ: Điều 16 · Bằng chứng: Sổ theo dõi nhiệt độ đống",
        "fix": "Đảo trộn, giảm chiều cao đống",
        "owner": "Lò hơi"
      },
      {
        "label": "Hệ thống điện, chống sét, tiếp địa được kiểm tra định kỳ; tủ điện có nắp, không quá tải",
        "hint": "Căn cứ: NĐ 106/2025 · Mức phạt: Theo khung · Quy định nội bộ: Nội quy PCCC Nhà máy · Bằng chứng: Biên bản đo điện trở tiếp địa",
        "fix": "Sửa chữa, đo lại",
        "owner": "Cơ điện"
      },
      {
        "label": "Hạng mục mới (lò sinh khối, điện mặt trời mái nhà) đáp ứng yêu cầu PCCC trước khi đưa vào sử dụng",
        "hint": "Căn cứ: NĐ 106/2025 · Mức phạt: Theo khung · Quy định nội bộ: Điều 13 · Bằng chứng: Hồ sơ thẩm duyệt/nghiệm thu PCCC (nếu thuộc diện)",
        "fix": "Hoàn tất thủ tục PCCC",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Gửi báo cáo kết quả thực hiện công tác PCCC và CNCH đúng thời hạn; khắc phục kiến nghị của cơ quan PCCC",
        "hint": "Căn cứ: NĐ 106/2025 · Mức phạt: Theo khung · Quy định nội bộ: PL 4 Quy định · Bằng chứng: Văn bản báo cáo; biên bản kiểm tra",
        "fix": "Gửi bổ sung; khắc phục",
        "owner": "Ban Điều hành"
      }
    ]
  },
  {
    "name": "Tự kiểm tra tuân thủ an toàn, vệ sinh lao động (NĐ 12/2022/NĐ-CP)",
    "category": "ATLD",
    "frequency": "quarterly",
    "items": [
      {
        "label": "Hội đồng ATVSLĐ cơ sở; người làm công tác ATVSLĐ, y tế được bố trí",
        "hint": "Căn cứ: NĐ 12/2022 · Mức phạt: Theo khung · Quy định nội bộ: Điều 7 · Bằng chứng: Quyết định thành lập, phân công",
        "fix": "Kiện toàn",
        "owner": "Tổ chức – Hành chính"
      },
      {
        "label": "Kế hoạch ATVSLĐ hằng năm được lập và thực hiện",
        "hint": "Căn cứ: NĐ 12/2022 · Mức phạt: Theo khung · Bằng chứng: Kế hoạch năm",
        "fix": "Lập kế hoạch",
        "owner": "ATVSLĐ"
      },
      {
        "label": "Huấn luyện ATVSLĐ đủ 6 nhóm đối tượng; nhóm 3 có thẻ an toàn trước khi làm công việc nghiêm ngặt",
        "hint": "Căn cứ: NĐ 12/2022 · Mức phạt: Theo số người lao động · Quy định nội bộ: Điều 30 · Bằng chứng: Sổ theo dõi huấn luyện, thẻ an toàn",
        "fix": "Tổ chức huấn luyện bổ sung",
        "owner": "ATVSLĐ"
      },
      {
        "label": "Khai báo máy, thiết bị có yêu cầu nghiêm ngặt (nồi hơi, bình khí nén, xe nâng, thiết bị nâng) trong 30 ngày trước/sau khi đưa vào sử dụng",
        "hint": "Căn cứ: NĐ 12/2022 – Điều 24 · Mức phạt: 1–2 triệu · Bằng chứng: Văn bản khai báo",
        "fix": "Khai báo bổ sung",
        "owner": "Cơ điện"
      },
      {
        "label": "Kiểm định trước khi sử dụng và định kỳ máy, thiết bị nghiêm ngặt; không sử dụng thiết bị kiểm định không đạt",
        "hint": "Căn cứ: NĐ 12/2022 – Điều 24 · Mức phạt: 20–75 triệu theo số thiết bị · Bằng chứng: Biên bản, tem kiểm định còn hạn",
        "fix": "Dừng sử dụng; kiểm định ngay",
        "owner": "Cơ điện"
      },
      {
        "label": "Lưu giữ đầy đủ hồ sơ kỹ thuật máy, thiết bị nghiêm ngặt",
        "hint": "Căn cứ: NĐ 12/2022 · Mức phạt: 5–10 triệu · Bằng chứng: Hồ sơ lý lịch thiết bị",
        "fix": "Bổ sung hồ sơ",
        "owner": "Cơ điện"
      },
      {
        "label": "Định kỳ kiểm tra, bảo dưỡng máy, thiết bị, nhà xưởng, kho tàng",
        "hint": "Căn cứ: NĐ 12/2022 – Điều 21 · Mức phạt: 20–25 triệu · Quy định nội bộ: PL 5 Quy định · Bằng chứng: Sổ bảo dưỡng",
        "fix": "Lập kế hoạch bảo dưỡng",
        "owner": "Cơ điện"
      },
      {
        "label": "Trang bị thiết bị an toàn tại nơi làm việc (che chắn bộ phận chuyển động, lan can, khóa – thẻ cách ly năng lượng)",
        "hint": "Căn cứ: NĐ 12/2022 – Điều 21 · Mức phạt: Theo khung Điều 21 · Bằng chứng: Kiểm tra băng tải, thùng quay, gầu tải",
        "fix": "Lắp che chắn; áp dụng khóa – thẻ",
        "owner": "Cơ điện, xưởng"
      },
      {
        "label": "Cấp phương tiện bảo vệ cá nhân bằng hiện vật (khẩu trang bụi, kính, găng, giày, mũ) phù hợp; người lao động sử dụng",
        "hint": "Căn cứ: NĐ 12/2022 · Mức phạt: Theo số người lao động · Bằng chứng: Sổ cấp phát; quan sát",
        "fix": "Cấp bổ sung; nhắc nhở",
        "owner": "ATVSLĐ"
      },
      {
        "label": "Quan trắc môi trường lao động định kỳ (bụi, ồn, nhiệt, hơi khí độc NH3)",
        "hint": "Căn cứ: NĐ 12/2022 · Mức phạt: 20–40 triệu · Bằng chứng: Báo cáo quan trắc MTLĐ",
        "fix": "Hợp đồng quan trắc",
        "owner": "ATVSLĐ"
      },
      {
        "label": "Lập hồ sơ vệ sinh môi trường lao động đối với các yếu tố có hại",
        "hint": "Căn cứ: NĐ 12/2022 · Mức phạt: 0,5–1 triệu · Bằng chứng: Hồ sơ VSMTLĐ",
        "fix": "Lập hồ sơ",
        "owner": "ATVSLĐ"
      },
      {
        "label": "Khám sức khỏe định kỳ; khám phát hiện bệnh nghề nghiệp cho người tiếp xúc bụi, hóa chất",
        "hint": "Căn cứ: NĐ 12/2022 · Mức phạt: Theo khung · Bằng chứng: Hồ sơ khám",
        "fix": "Tổ chức khám",
        "owner": "Tổ chức – Hành chính"
      },
      {
        "label": "Đánh giá nguy cơ rủi ro ATVSLĐ; kế hoạch ứng cứu khẩn cấp; huấn luyện, trang bị sơ cứu, cấp cứu",
        "hint": "Căn cứ: NĐ 12/2022 – Điều 21 · Mức phạt: 15–20 triệu (đánh giá rủi ro, cơ sở nguy cơ cao) · Quy định nội bộ: Điều 24 · Bằng chứng: Bảng đánh giá rủi ro; túi sơ cứu",
        "fix": "Lập đánh giá; bổ sung túi sơ cứu",
        "owner": "ATVSLĐ"
      },
      {
        "label": "Làm việc trong không gian hạn chế (bể HTXLNT, silo, bồn) và trên cao: giấy phép, đo khí, dây an toàn, người giám sát",
        "hint": "Căn cứ: NĐ 12/2022 – Điều 21 · Mức phạt: Theo khung Điều 21 · Quy định nội bộ: Điều 8; MT-HD07 · Bằng chứng: Giấy phép làm việc",
        "fix": "Dừng công việc; cấp giấy phép",
        "owner": "Ban Điều hành"
      },
      {
        "label": "Khai báo, điều tra, thống kê, báo cáo tai nạn lao động; báo cáo công tác ATVSLĐ định kỳ",
        "hint": "Căn cứ: NĐ 12/2022 · Mức phạt: Theo khung · Bằng chứng: Sổ thống kê TNLĐ; báo cáo năm",
        "fix": "Báo cáo bổ sung",
        "owner": "ATVSLĐ"
      }
    ]
  },
  {
    "name": "Tự kiểm tra tuân thủ an toàn hóa chất",
    "category": "HC",
    "frequency": "quarterly",
    "items": [
      {
        "label": "Danh mục hóa chất sử dụng (NaOH, PAC, Polymer, Chlorine, hóa chất PTN) được lập và cập nhật",
        "hint": "Căn cứ: Pháp luật hóa chất – nghị định xử phạt lĩnh vực hóa chất (đối chiếu văn bản hiện hành) · Mức phạt: Theo khung · Quy định nội bộ: Điều 12 · Bằng chứng: Danh mục hóa chất",
        "fix": "Lập, cập nhật",
        "owner": "KT-SX"
      },
      {
        "label": "Phiếu an toàn hóa chất (MSDS) tiếng Việt có tại nơi lưu trữ, sử dụng",
        "hint": "Căn cứ: Như trên · Mức phạt: Theo khung · Quy định nội bộ: Điều 12 · Bằng chứng: Kiểm tra nhà hóa chất, PTN",
        "fix": "Bổ sung MSDS",
        "owner": "KT-SX"
      },
      {
        "label": "Bao bì, thùng chứa hóa chất có nhãn; sang chiết đúng hướng dẫn MT-HD02",
        "hint": "Căn cứ: Như trên · Mức phạt: Theo khung · Quy định nội bộ: Điều 12 · Bằng chứng: Kiểm tra hiện trường",
        "fix": "Dán nhãn; đào tạo lại",
        "owner": "Tổ vận hành HTXLNT"
      },
      {
        "label": "Khu lưu chứa hóa chất có khay chống tràn, thông gió, vật liệu thấm hút, tách chất không tương thích",
        "hint": "Căn cứ: Như trên · Mức phạt: Theo khung · Quy định nội bộ: Điều 12 · Bằng chứng: Kiểm tra hiện trường",
        "fix": "Bổ sung khay, vật liệu",
        "owner": "KT-SX"
      },
      {
        "label": "Người lao động tiếp xúc hóa chất được huấn luyện an toàn hóa chất định kỳ",
        "hint": "Căn cứ: Như trên · Mức phạt: Theo khung · Quy định nội bộ: Điều 30 · Bằng chứng: Hồ sơ huấn luyện",
        "fix": "Tổ chức huấn luyện",
        "owner": "ATVSLĐ"
      },
      {
        "label": "Biện pháp/kế hoạch phòng ngừa, ứng phó sự cố hóa chất theo quy định; thiết bị ứng phó (vòi rửa mắt, bộ xử lý tràn đổ)",
        "hint": "Căn cứ: Như trên · Mức phạt: Theo khung · Quy định nội bộ: Điều 24 · Bằng chứng: Văn bản biện pháp; kiểm tra thiết bị",
        "fix": "Lập, bổ sung thiết bị",
        "owner": "KT-SX"
      }
    ]
  }
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
      label: 'Nhà thầu đang thi công: đã ký cam kết (MT-HD07-05); khu thi công che chắn; rác thi công thu gom; hàn cắt có bình chữa cháy',
      fix: 'Tạm dừng công việc đến khi khắc phục',
    },
  ],
}
