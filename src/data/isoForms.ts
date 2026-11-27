// Biểu mẫu và hồ sơ HTQLMT ISO 14001 — Nhà máy Phân bón Bình Điền – Long An.
// Nguồn: Sổ tay MT–AT–PCCC lần 02 (2026, Phụ lục 1, 4, 6); MT-HD04 Kiểm soát nước thải lần 02; MT-HD05 Kiểm soát khí thải
// lần 02; MT-HD07 Kiểm soát nhà thầu lần 02; MT-QT04 Quản lý thay đổi lần 01. Phê duyệt: PTGĐ Võ Văn Phu; xem xét: TP KT-SX
// Võ Anh Tuấn; soạn thảo: Cán bộ phụ trách Môi trường.

export type FieldType = "text" | "textarea" | "number" | "date" | "time" | "select" | "check";
export interface Field {
  k: string; label: string; type: FieldType; unit?: string; options?: string[]; required?: boolean; wide?: boolean;
  /** Trả về cảnh báo nếu giá trị bất thường. */
  warn?: (v: any, rec: Record<string, any>) => string | null;
}
export interface FormDef { code: string; title: string; source: string; purpose: string; fields: Field[]; listCols: string[]; seed?: Record<string, any>[] }

const num = (v: any) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
const outside = (lo: number, hi: number, label: string) => (v: any) => { const n = num(v); return n != null && (n < lo || n > hi) ? `${label} ngoài dải ${lo}–${hi}` : null; };
const above = (lim: number, label: string) => (v: any) => { const n = num(v); return n != null && n > lim ? `${label} vượt ${lim}` : null; };

/** Giới hạn khí thải dòng 01 theo GPMT 2986 (QCVN 19:2009 cột B, Kp 0,8; Kv 1,0), mg/Nm³. */
export const STACK01_LIMITS = { tsp: 160, so2: 400, nox: 680, co: 800 };
export const STREAMS = ["01 — Lò hơi", "02 — Lò sấy (tạo hạt)", "03 — Lò sấy (tạo hạt)", "04 — Lò sấy nóng TH2", "05 — Lò sấy (tạo hạt)", "06 — Lò sấy (CEMS tự nguyện)", "07 — Phối trộn phân hữu cơ"];

export const FORMS: FormDef[] = [
  {
    code: "MT-HD04-BM02", title: "Sổ nhật ký vận hành nước thải", source: "MT-HD04 mục 6.4, 6.6",
    purpose: "Ghi mỗi ca: lưu lượng, pH, DO, SV30, hóa chất, sự cố. HTXLNT 120 m³/ngày đêm; điểm xả sông Vàm Cỏ Đông (X 1172302; Y 0580187).",
    fields: [
      { k: "date", label: "Ngày", type: "date", required: true },
      { k: "shift", label: "Ca", type: "select", options: ["Ca 1", "Ca 2", "Ca 3"], required: true },
      { k: "qin", label: "Lưu lượng vào", type: "number", unit: "m³", warn: above(120, "Lưu lượng vượt công suất thiết kế") },
      { k: "qout", label: "Lưu lượng xả", type: "number", unit: "m³" },
      { k: "phEq", label: "pH bể điều hòa", type: "number", warn: outside(5.5, 9, "pH điều hòa") },
      { k: "phOut", label: "pH đầu ra", type: "number", warn: outside(6, 9, "pH đầu ra (QCVN 40 cột A)") },
      { k: "do", label: "DO Aerotank", type: "number", unit: "mg/L", warn: outside(2, 6, "DO Aerotank") },
      { k: "sv30", label: "SV30", type: "number", unit: "mL/L" },
      { k: "clarity", label: "Độ trong đầu ra", type: "select", options: ["Trong", "Hơi đục", "Đục"], warn: v => v === "Đục" ? "Đầu ra đục — kiểm tra keo tụ, lắng" : null },
      { k: "chem", label: "Hóa chất đã châm (loại, lượng)", type: "text", wide: true },
      { k: "event", label: "Sự cố / bất thường, biện pháp", type: "textarea", wide: true },
      { k: "by", label: "Người ghi", type: "text", required: true },
    ],
    listCols: ["date", "shift", "qin", "phOut", "do", "clarity", "by"],
  },
  {
    code: "MT-HD04-BM06", title: "Biên bản dừng xả / xử lý sự cố nước thải", source: "MT-HD04 mục 6.2 (GPMT 2986 Phụ lục 1 B.3.7)",
    purpose: "Lập khi thông số đầu ra không đạt QCVN 40:2011/BTNMT cột A: dừng xả, chuyển nước về bể điều hòa/hồ sự cố, khắc phục và quan trắc lại trước khi xả.",
    fields: [
      { k: "date", label: "Ngày phát hiện", type: "date", required: true },
      { k: "time", label: "Giờ dừng xả", type: "time", required: true },
      { k: "param", label: "Thông số không đạt", type: "select", options: ["pH", "BOD5", "COD", "TSS", "Amoni", "Tổng N", "Tổng P", "Coliform", "Thông số thứ 9 (GPMT)", "Khác"], required: true },
      { k: "value", label: "Giá trị đo", type: "text" },
      { k: "cause", label: "Nguyên nhân", type: "textarea", wide: true },
      { k: "action", label: "Biện pháp khắc phục", type: "textarea", wide: true },
      { k: "to", label: "Nước thải chuyển về", type: "select", options: ["Bể điều hòa", "Hồ sự cố"] },
      { k: "resume", label: "Ngày xả lại", type: "date" },
      { k: "verified", label: "Đã có kết quả quan trắc lại đạt", type: "check" },
      { k: "by", label: "Người lập", type: "text", required: true },
    ],
    listCols: ["date", "time", "param", "value", "to", "resume", "verified"],
  },
  {
    code: "MT-HD05-BM03/04", title: "Sổ nhật ký vận hành nồi hơi / lò đốt và hệ xử lý khí thải", source: "MT-HD05 mục 6.3–6.5",
    purpose: "Ghi riêng cho từng hệ xử lý mỗi ca (tồn tại Phụ lục 4: chưa có nhật ký riêng — NĐ 45/2022 Điều 11 k2 c, 40–60 triệu). Màu khói đầu ca, chênh áp túi lọc 2 lần/ca, số liệu CEMS.",
    fields: [
      { k: "date", label: "Ngày", type: "date", required: true },
      { k: "shift", label: "Ca", type: "select", options: ["Ca 1", "Ca 2", "Ca 3"], required: true },
      { k: "stream", label: "Dòng thải / thiết bị", type: "select", options: STREAMS, required: true },
      { k: "fuel", label: "Nhiên liệu", type: "select", options: ["Than", "Sinh khối", "Không đốt"] , warn: (v, r) => v === "Sinh khối" && String(r.stream).startsWith("04") ? "Lò sấy TH2 đốt sinh khối khi GPMT chưa điều chỉnh — rủi ro pháp lý (MT-HD05 mục 6.1)" : null },
      { k: "smoke", label: "Màu khói đầu ca", type: "select", options: ["Không màu / trắng hơi nước", "Xám nhạt", "Xám đậm", "Đen"], warn: v => v === "Đen" || v === "Xám đậm" ? "Khói đậm — kiểm tra cháy, lọc bụi" : null },
      { k: "dp1", label: "ΔP túi lọc lần 1", type: "number", unit: "mmH₂O", warn: above(260, "ΔP (MT-QP.01: giũ bụi/thay túi)") },
      { k: "dp2", label: "ΔP túi lọc lần 2", type: "number", unit: "mmH₂O", warn: above(260, "ΔP (MT-QP.01: giũ bụi/thay túi)") },
      { k: "steam", label: "Áp suất hơi (nồi hơi)", type: "number", unit: "bar" },
      { k: "tsp", label: "CEMS bụi", type: "number", unit: "mg/Nm³", warn: (v, r) => String(r.stream).startsWith("01") ? above(STACK01_LIMITS.tsp, "Bụi")(v) : above(160, "Bụi")(v) },
      { k: "so2", label: "CEMS SO₂", type: "number", unit: "mg/Nm³", warn: above(STACK01_LIMITS.so2, "SO₂") },
      { k: "nox", label: "CEMS NOₓ", type: "number", unit: "mg/Nm³", warn: above(STACK01_LIMITS.nox, "NOₓ") },
      { k: "co", label: "CEMS CO", type: "number", unit: "mg/Nm³", warn: above(STACK01_LIMITS.co, "CO") },
      { k: "event", label: "Sự cố, bảo trì (thay túi, vệ sinh quạt…)", type: "textarea", wide: true },
      { k: "by", label: "Người vận hành", type: "text", required: true },
    ],
    listCols: ["date", "shift", "stream", "fuel", "smoke", "dp1", "tsp", "by"],
  },
  {
    code: "MT-HD07-06", title: "Sổ theo dõi nhà thầu và khách (kèm cam kết MT-HD07-05)", source: "MT-HD07 mục 5.1",
    purpose: "Phổ biến nội quy MT-HD07-01 và ký cam kết chấp hành BVMT – an toàn – PCCC (MT-HD07-05) trước khi vào Nhà máy.",
    fields: [
      { k: "date", label: "Ngày", type: "date", required: true },
      { k: "name", label: "Họ tên / trưởng nhóm", type: "text", required: true },
      { k: "org", label: "Đơn vị", type: "text", required: true },
      { k: "kind", label: "Loại", type: "select", options: ["Nhà thầu thi công", "Nhà thầu dịch vụ môi trường", "Khách", "Tài xế giao nhận"] },
      { k: "count", label: "Số người", type: "number" },
      { k: "purpose", label: "Công việc / khu vực", type: "text", wide: true },
      { k: "in", label: "Giờ vào", type: "time" },
      { k: "out", label: "Giờ ra", type: "time" },
      { k: "briefed", label: "Đã phổ biến nội quy (MT-HD07-01)", type: "check" },
      { k: "signed", label: "Đã ký cam kết (MT-HD07-05)", type: "check", warn: (v, r) => !v && r.kind?.startsWith("Nhà thầu") ? "Nhà thầu chưa ký cam kết" : null },
      { k: "card", label: "Số thẻ khách (MT-HD07-07)", type: "text" },
      { k: "guide", label: "Người hướng dẫn", type: "text" },
    ],
    listCols: ["date", "name", "org", "kind", "in", "out", "signed"],
  },
  {
    code: "MT-HD07-02", title: "Phiếu giám sát nhà thầu", source: "MT-HD07 mục 5.2",
    purpose: "Giám sát tuân thủ tại hiện trường; phát hiện, lập biên bản và xử lý vi phạm.",
    fields: [
      { k: "date", label: "Ngày", type: "date", required: true },
      { k: "org", label: "Nhà thầu", type: "text", required: true },
      { k: "area", label: "Khu vực", type: "text" },
      { k: "ppe", label: "Đủ PTBVCN", type: "check" },
      { k: "permit", label: "Có giấy phép làm việc (nếu việc đặc biệt)", type: "check" },
      { k: "waste", label: "Chất thải thu gom, phân loại đúng", type: "check" },
      { k: "chem", label: "Hóa chất, dầu có khay chống tràn", type: "check" },
      { k: "fire", label: "Hàn, cắt có giám sát và phương tiện chữa cháy", type: "check" },
      { k: "equip", label: "Thiết bị mang vào đã kiểm tra", type: "check" },
      { k: "violation", label: "Vi phạm phát hiện / xử lý", type: "textarea", wide: true },
      { k: "by", label: "Người giám sát", type: "text", required: true },
    ],
    listCols: ["date", "org", "area", "ppe", "permit", "waste", "fire", "by"],
  },
  {
    code: "MT-QT04-BM01", title: "Phiếu đề xuất thay đổi (MOC)", source: "MT-QT04 mục 5–6",
    purpose: "5 bước: đề xuất → đánh giá rủi ro EHS và rà soát GPMT → TP KT-SX xem xét, PTGĐ phê duyệt → triển khai → xác nhận sau triển khai, cập nhật tài liệu.",
    fields: [
      { k: "date", label: "Ngày đề xuất", type: "date", required: true },
      { k: "group", label: "Nhóm thay đổi", type: "select", options: ["Thiết bị, công nghệ", "Nhiên liệu", "Nguồn năng lượng mới", "Mặt bằng, xây dựng", "Nhà cung cấp dịch vụ thuê ngoài", "Quy trình vận hành"], required: true },
      { k: "content", label: "Nội dung thay đổi", type: "textarea", required: true, wide: true },
      { k: "reason", label: "Lý do", type: "textarea", wide: true },
      { k: "unit", label: "Đơn vị đề xuất", type: "text" },
      { k: "risk", label: "Rủi ro EHS", type: "select", options: ["Thấp", "Trung bình", "Cao"] },
      { k: "permit", label: "Ảnh hưởng GPMT/pháp lý", type: "select", options: ["Không", "Có — phải điều chỉnh GPMT/báo cáo trước khi triển khai", "Cần xác định"], warn: (v, r) => String(v).startsWith("Có") && ["Đang triển khai", "Hoàn tất"].includes(r.status) ? "Đã triển khai khi thay đổi có ảnh hưởng GPMT — kiểm tra đã có GPMT điều chỉnh" : null },
      { k: "env", label: "Ý kiến CB Môi trường", type: "textarea", wide: true },
      { k: "status", label: "Trạng thái", type: "select", options: ["Đề xuất", "Đánh giá rủi ro", "Chờ phê duyệt", "Đã phê duyệt", "Đang triển khai", "Hoàn tất"] },
      { k: "docs", label: "Tài liệu cần cập nhật", type: "text", wide: true },
    ],
    listCols: ["date", "group", "content", "risk", "permit", "status"],
    seed: [
      { date: "2026-01-05", group: "Nhiên liệu", content: "Chuyển lò sấy nóng dây chuyền tạo hạt số 2 (TH2) từ than sang sinh khối", reason: "Giảm phát thải KNK, chi phí nhiên liệu", unit: "Phòng KT-SX", risk: "Cao", permit: "Có — phải điều chỉnh GPMT/báo cáo trước khi triển khai", env: "Đang xử lý điều chỉnh GPMT theo CV 13486/SNNMT-MTBĐKH; đã đốt sinh khối trước khi có GPMT điều chỉnh (rủi ro NĐ 45/2022 Điều 11 k2 a, đ)", status: "Đang triển khai", docs: "MT-HD05 mục 6.2, MT-QT01, MT-QT03" },
      { date: "2026-09-17", group: "Thiết bị, công nghệ", content: "Lò hơi tầng sôi đốt sinh khối 6.000 kg hơi/h (gói IB2600448600), giữ lò than 8 t/h vận hành luân phiên", reason: "Kế hoạch giảm nhẹ KNK 2026–2030", unit: "Phòng KT-SX", risk: "Cao", permit: "Có — phải điều chỉnh GPMT/báo cáo trước khi triển khai", env: "Hồ sơ điều chỉnh GPMT nguồn 01 đang soạn; xem tab GPMT Nguồn 01", status: "Chờ phê duyệt", docs: "MT-HD05, MT-HD04 (nguồn nước thải 05)" },
      { date: "2026-03-01", group: "Nguồn năng lượng mới", content: "Điện mặt trời áp mái 1.124,64 kWp (2 giai đoạn)", reason: "Năng lượng tái tạo", unit: "Phòng KT-SX", risk: "Trung bình", permit: "Cần xác định", env: "Vượt ngưỡng 1.000 kW theo NĐ 58/2025 — cần đăng ký; chưa xác nhận nghiệm thu PCCC", status: "Đang triển khai", docs: "MT-HD06, MT-HD01" },
      { date: "2026-04-01", group: "Thiết bị, công nghệ", content: "Hệ xử lý NH₃ mới (quench + hấp thụ H₂SO₄)", reason: "Giảm phát thải NH₃ khí thải tạo hạt", unit: "Phòng KT-SX", risk: "Trung bình", permit: "Cần xác định", env: "Đánh giá kỹ thuật trước khi phê duyệt đầu tư", status: "Đánh giá rủi ro", docs: "MT-HD05, MT-HD02" },
      { date: "2026-02-01", group: "Mặt bằng, xây dựng", content: "Kho vị số 41–43, nhà văn phòng 2 (vị số 44)", reason: "Mở rộng lưu kho", unit: "Phòng KT-SX", risk: "Trung bình", permit: "Có — phải điều chỉnh GPMT/báo cáo trước khi triển khai", env: "Đưa vào hồ sơ điều chỉnh GPMT; chưa xác nhận thẩm định, nghiệm thu PCCC", status: "Đang triển khai", docs: "MT-HD01, MT-QT01" },
    ],
  },
];

/** Tài liệu cấp 2 — Sổ tay Phụ lục 1. */
export const PROCEDURES: [string, string, string, string][] = [
  ["MT-QT01", "Nhận diện khía cạnh môi trường và đánh giá tác động", "6.1.2", "Lần 02 — đã ban hành 2026 (thang H × L × F)"],
  ["[ ]", "Xác định nghĩa vụ tuân thủ và đánh giá sự tuân thủ", "6.1.3, 9.1.2", "Cần lập"],
  ["MT-QT02", "Kế hoạch ứng phó sự cố môi trường", "8.2", "Lần 02 — đã ban hành 2026"],
  ["MT-QT03", "Theo dõi, đo lường; hiệu chuẩn thiết bị đo", "9.1.1", "Lần 02 — đã ban hành 2026"],
  ["MT-QT04", "Quản lý thay đổi (MOC)", "6.1.2, 8.1", "Lần 01 — mới (ISO 14001:2026 điều 6.3)"],
  ["MT-HD01", "Phương án chữa cháy; phương án CNCH", "8.2", "Lần 02 — theo Luật PCCC&CNCH 55/2024"],
  ["MT-HD02", "Kiểm soát hóa chất", "8.1", "Lần 02 — viết lại theo Sổ tay mục 6.4"],
  ["MT-HD03", "Quản lý chất thải", "8.1", "Lần 02 — đã ban hành 2026"],
  ["MT-HD04", "Kiểm soát nước thải (vận hành HTXLNT)", "8.1", "Lần 02 — đã xử lý sai khác điểm xả, thứ tự lọc – khử trùng"],
  ["MT-HD05; MT-QP.01", "Kiểm soát khí thải, CEMS; lọc bụi túi vải", "8.1", "Lần 02 — MT-HD05-03, -04 còn cấu trúc cũ"],
  ["MT-HD06", "Kiểm soát tài nguyên, năng lượng", "8.1", "Lần 02 — đã ban hành 2026"],
  ["MT-HD07", "Kiểm soát nhà thầu và khách", "8.1", "Lần 02 — đã ban hành 2026"],
  ["[ ]", "Danh mục hóa chất đủ 22 trường, nhóm SG (MT-HD02-BM01)", "8.1", "Cần cập nhật"],
  ["[ ]", "Bảng tính tổng tỉ lệ tồn trữ (Phụ lục IV NĐ 24/2026)", "8.2", "Cần lập trước 31/12/2026"],
  ["[ ]", "Quyết định chỉ định người chịu trách nhiệm an toàn hóa chất", "5.3", "Cần lập"],
  ["[ ]", "Sổ đánh giá rủi ro hóa chất (ma trận 5 × 5)", "6.1.2", "Cần lập"],
  ["[ ]", "Cấp giấy phép làm việc", "8.1", "Cần lập (dùng F106–F151)"],
  ["[ ]", "Kiểm soát tài liệu; đào tạo; trao đổi thông tin; đánh giá nội bộ; xem xét lãnh đạo; khắc phục", "7.2–10.2", "Xác nhận"],
];

/** Danh mục biểu mẫu theo từng tài liệu. */
export const FORM_CATALOG: [string, string, string, boolean][] = [
  ["MT-HD04", "MT-HD04-BM01", "Lịch theo dõi hoạt động HTXLNT", false],
  ["MT-HD04", "MT-HD04-BM02", "Sổ nhật ký vận hành nước thải", true],
  ["MT-HD04", "MT-HD04-03", "Quy định kiểm soát các thông số chất lượng nước thải", false],
  ["MT-HD04", "MT-HD04-BM04", "Báo cáo kết quả quan trắc nước thải", false],
  ["MT-HD04", "MT-HD04-BM05", "Tờ khai phí BVMT đối với nước thải (NĐ 346/2025)", false],
  ["MT-HD04", "MT-HD04-BM06", "Biên bản dừng xả / xử lý sự cố nước thải", true],
  ["MT-HD05", "MT-QP.01", "Quy định kiểm soát lọc bụi túi vải (thay túi ≥ 3 tháng/lần; ΔP > 260 mmH₂O)", false],
  ["MT-HD05", "MT-HD05-03", "Hướng dẫn vận hành nồi hơi", false],
  ["MT-HD05", "MT-HD05-04", "Quy định kiểm soát thông số khí thải", false],
  ["MT-HD05", "MT-HD05-BM02", "Báo cáo kết quả quan trắc khí thải", false],
  ["MT-HD05", "MT-HD05-BM03", "Sổ nhật ký vận hành nồi hơi", true],
  ["MT-HD05", "MT-HD05-BM04", "Sổ nhật ký vận hành lò đốt", true],
  ["MT-HD05", "MT-HD05-BM05", "Tờ khai phí BVMT đối với khí thải (NĐ 153/2024)", false],
  ["MT-HD07", "MT-HD07-01", "Nội quy làm việc đối với nhà thầu và khách", false],
  ["MT-HD07", "MT-HD07-02", "Phiếu giám sát nhà thầu", true],
  ["MT-HD07", "MT-HD07-03", "Nội quy Công ty CP Phân bón Bình Điền", false],
  ["MT-HD07", "MT-HD07-04", "Nội quy PCCC", false],
  ["MT-HD07", "MT-HD07-05", "Cam kết chấp hành BVMT – an toàn – PCCC", true],
  ["MT-HD07", "MT-HD07-06", "Sổ theo dõi nhà thầu và khách", true],
  ["MT-HD07", "MT-HD07-07", "Mẫu thẻ khách", false],
  ["MT-QT04", "MT-QT04-BM01", "Phiếu đề xuất thay đổi", true],
];

/** Sổ tay Phụ lục 6 — bộ biểu mẫu HSE mã Fxxx (rà soát 25/10/2026). */
export const F_CATALOG: [string, string, string, string][] = [
  ["7.7", "Tai nạn lao động", "F021–F025", "F021 có sẵn; F022–F025 tự soạn theo NĐ 39/2016"],
  ["7.4", "Phương tiện bảo vệ cá nhân", "F026", "Có sẵn (TT 25/2022/TT-BLĐTBXH)"],
  ["6.4", "Hóa chất (SDS, khai báo, huấn luyện)", "F051–F070, F159–F160", "F159–F160 có sẵn; còn lại tự soạn theo TT 01/2026/TT-BCT"],
  ["7.3", "An toàn điện", "F075–F080", "Chỉ có ghi chú, chưa có file mẫu"],
  ["7.2, 7.3", "Giấy phép làm việc & checklist công trình", "F106–F151", "Đầy đủ nhất — dùng ngay (sàn thao tác, hot work, không gian hạn chế)"],
  ["4.3, 11.1", "Bảng yêu cầu pháp luật", "F115", "Có sẵn — phải sửa Nhóm 7 PCCC trước khi dùng"],
  ["7.6", "Y tế lao động / bệnh nghề nghiệp", "F161–F171", "Có sẵn; F171 chờ chốt TT 56/2025 hay TT 60/2025/TT-BYT"],
  ["—", "An toàn thực phẩm nhà ăn", "F172, F176–F180", "Có sẵn theo NĐ 46/2026 — chưa đưa vào Sổ tay"],
  ["8.3", "Hồ sơ PCCC", "F181–F202", "F181–F182, F187, F190, F198, F201 có sẵn"],
  ["6.3, PL2", "Môi trường ĐTM/GPMT/CTNH", "F215, F220–F233", "Có sẵn; dùng mẫu Đăng ký MT NĐ 08/2022 thay F225 (lỗi thời)"],
  ["Toàn Sổ tay", "Mối nguy, an toàn hiện trường, đào tạo", "F241–F290", "Có sẵn, dùng ngay"],
  ["Không áp dụng", "Bức xạ / năng lượng nguyên tử", "F028–F041", "Không áp dụng (CV trả lời Tập đoàn 16/10/2026)"],
];

/** Sổ tay Phụ lục 4 — 10 tồn tại có chế tài cần xác minh. */
export const PENALTY_GAPS: [string, string, string, string][] = [
  ["Lò sấy TH2 đốt kèm sinh khối khi GPMT chưa điều chỉnh", "NĐ 45/2022 Đ11 k2 a, đ", "20–30 tr; 200–300 tr (không điều chỉnh GPMT)", "Hoàn tất hồ sơ điều chỉnh GPMT"],
  ["Dầu nhớt thải 2.510 kg (2025) dùng làm nhiên liệu tại Nhà máy", "NĐ 45/2022 Đ29 k3, k5", "80–100 tr; đến 320 tr nếu cho, bán", "Chuyển giao toàn bộ cho đơn vị có giấy phép"],
  ["Chưa có nhật ký vận hành riêng từng hệ xử lý khí thải", "NĐ 45/2022 Đ11 k2 c", "40–60 tr", "Ghi MT-HD05-BM03/04 hằng ca (tab này)"],
  ["Thiếu bằng chứng 6 thông số nước thải (BOD5, amoni, tổng N, tổng P, Clo dư, Coliform)", "NĐ 45/2022 Đ18", "Cảnh cáo đến 20–40 tr", "Phân tích nội bộ đủ 9 thông số"],
  ["Báo cáo 498/BC.KS sai số liệu; phí BVMT quý I/2026 nộp trễ", "NĐ 45/2022 Đ43 k1; luật quản lý thuế", "10–20 tr", "Đính chính; lập lịch kê khai"],
  ["Hạng mục mới chưa thẩm định, nghiệm thu PCCC (kho 41–43, văn phòng 2, lò sấy mới, điện mặt trời)", "NĐ 106/2025 Đ18", "60–100 tr, kèm đình chỉ", "Xác định diện; xin nghiệm thu trước"],
  ["Bảo hiểm cháy, nổ bắt buộc chưa xác nhận đủ đối tượng", "NĐ 106/2025 Đ17 (NĐ 69/2026)", "20–30 tr; 60–100 tr nếu không mua", "Đối chiếu hợp đồng cấp Công ty"],
  ["Chưa khám điếc nghề nghiệp, bụi phổi silic cho NLĐ ở vị trí vượt (QTMTLĐ 2026)", "NĐ 283/2026 Đ33 k2", "2–6 tr/NLĐ, tối đa 150 tr", "Hợp đồng khám bệnh nghề nghiệp"],
  ["Chưa có bằng chứng công khai kết quả QTMTLĐ 2026", "NĐ 283/2026 Đ38 k2", "4–10 tr", "Niêm yết, phổ biến"],
  ["Giảm trừ % quỹ lương khi vi phạm nếu áp cho cá nhân", "NĐ 283/2026 Đ25 k3 c", "40–80 tr", "Đưa vào Quy chế lương cho tập thể; cá nhân dùng kỷ luật"],
];

/** Ghi chú nội bộ của các tài liệu — việc cần xác minh trước khi trình ký. */
export const OPEN_ITEMS: [string, string][] = [
  ["MT-HD04", "Đo, xác nhận dung tích hồ sự cố (GPMT ghi 150 m³; tài liệu cũ 110 m³)"],
  ["MT-HD04", "Xác định liều hóa chất theo vận hành thực tế — không dùng lại số liệu cũ sai (Chlorine, NaOH)"],
  ["MT-HD04", "Đủ 09 thông số nước thải theo Phụ lục GPMT 2986 (dự thảo mới có 8/9)"],
  ["MT-HD04", "Chênh lệch lưu lượng thực tế 2025 ≈ 49 m³/ngày so với GPMT ≈ 25,7 m³/ngày — đưa vào hồ sơ điều chỉnh GPMT"],
  ["MT-HD05", "Mốc áp dụng QCVN 19:2024/BTNMT cho cơ sở đang hoạt động (Điều 3–4 TT 45/2024)"],
  ["MT-HD05", "Xác nhận CEMS thực tế tại dòng 01 (bắt buộc) và dòng 06 (tự nguyện)"],
  ["MT-HD05", "Hoàn thiện MT-HD05-03, MT-HD05-04 theo giới hạn GPMT 2986"],
  ["MT-HD07", "Bổ sung điều khoản tuân thủ môi trường vào hợp đồng Chân Lý, Cao Gia Quý, Hoàng Phúc Tín"],
  ["MT-QT04", "Chọn ban hành độc lập MT-QT04 hay gộp làm phụ lục MT-QT03; số ngày hoàn thiện hồ sơ MOC khẩn cấp"],
  ["MT-QT04", "Lồng Phiếu đề xuất thay đổi vào quy trình Giấy đề nghị nội bộ Phòng KT-SX"],
  ["Tất cả", "Xác nhận với tổ chức chứng nhận (QA-D/VN/14001/0012) lộ trình chuyển sang ISO 14001:2026; điền ngày hiệu lực"],
];
