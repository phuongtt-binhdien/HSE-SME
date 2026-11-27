// Báo cáo công tác BVMT năm 2024 (10/01/2025, bản scan) và năm 2025 (12/01/2026) của NM Phân bón Bình Điền – Long An, gửi Tập đoàn Hóa chất Việt Nam.
// Số liệu nhập tay từ hai file PDF người dùng gửi (BFC_BVMT2024.pdf — scan; BFC_Bao_cao_BVMT_120126_TDHCVN.pdf). Ô trống/không đọc chắc chắn → null.
// Giá trị "<10", "KPH" lưu nguyên dạng chuỗi; null = không lấy mẫu / trống trong bảng gốc.
export type Cell = number | string | null;
export type Year = "2023" | "2024" | "2025";

export const REPORTS = {
  "2024": { date: "10/01/2025", ref: "Số 29/BC.KS-BĐ", signer: "—", note: "Bản scan. Mẫu: báo cáo gửi Tập đoàn Hóa chất Việt Nam" },
  "2025": { date: "12/01/2026", ref: "Số …/BC.KS-BĐ (để trống)", signer: "PTGĐ Võ Văn Phu", note: "Kỳ báo cáo 2025; hạn nộp 15/01" },
} as const;

/** Sản lượng sản phẩm (tấn). Báo cáo 2025 ghi cột "năm 2024" khớp báo cáo 2024. */
export const PRODUCTS = [
  { name: "NPK 16-8-16", y2023: 53578, y2024: 69197, y2025: 77197 },
  { name: "NPK 20-20-15 TE", y2023: 65124, y2024: 80734, y2025: 88734 },
  { name: "NPK 20-20-15", y2023: 72508, y2024: 87704, y2025: 95704 },
  { name: "NPK 16-16-13 TE", y2023: 30312, y2024: 45508, y2025: 53508 },
  { name: "Sản phẩm khác", y2023: 121153, y2024: 128630, y2025: 135842 },
] as const;
export const PRODUCT_TOTAL = { y2023: 333675, y2024: 411773, y2025: 450985 } as const;

/** Nguyên liệu (tấn). Bảng gốc 2025 ghi tiêu đề cột là "năm 2024 / năm 2023" (lệch một năm). */
export const MATERIALS = [
  { name: "DAP", y2023: 54136, y2024: 69736, y2025: 77736 },
  { name: "Urea", y2023: 65682, y2024: 81282, y2025: 89282 },
  { name: "SA", y2023: 73066, y2024: 88666, y2025: 96666 },
  { name: "KCl", y2023: 30870, y2024: 46470, y2025: 54470 },
  { name: "Khác", y2023: 109954, y2024: 128619, y2025: 135955 },
] as const;
export const MATERIAL_TOTAL = { y2023: 333708, y2024: 414773, y2025: 454109 } as const;

/** Nhiên liệu, điện, nước. Dầu: "Tấn/năm" theo tiêu đề bảng gốc (81,78 và 86,221 — đơn vị cần xác nhận). */
export const UTILITIES = {
  coalT: { y2023: 3563, y2024: 4178.3, y2025: 4594 },
  oil: { y2023: 86.221, y2024: 81.78, y2025: 104 },
  gasM3: { y2023: 5, y2024: 6, y2025: 6 },
  kWh: { y2023: 8251767, y2024: 9455800, y2025: 9913473 },
  waterM3: { y2023: 86748, y2024: 90982, y2025: 76679 },
  wastewaterM3: { y2023: 18000, y2024: 18000, y2025: 18000 },   // 50 m³/ngày — cả ba kỳ ghi 18.000
} as const;
/** Cột "năm gần nhất" mà báo cáo 2025 ghi (để đối chiếu với báo cáo 2024). */
export const NEAREST_IN_2025 = { coalT: 4178.3, oil: 81.78, gasM3: 5, kWh: 9455800, waterM3: 86748, wastewaterM3: 18000 } as const;
export const AIR_VOLUME_M3 = { y2024: 1_628_000_000, y2025: 1_628_000_000, designFlowM3h: 360000 } as const;

/** Mốc lấy mẫu. */
export const SAMPLING = {
  "2024": { ww: ["05/03 & 20/03", "20/06 & 27/06", "30/08 & 19/09", "10/12"], gas: ["05/03 & 20/03", "20/06 & 27/06", "30/08 & 19/09", "10/12"] },
  "2025": { ww: ["03/03 & 13/03", "02/06", "15/09", "24/11"], gas: ["03/03 & 13/03", "02/06", "15/09", "24/11"] },
} as const;

export interface GasRow { key: string; unit: string; limit: number | null; v: [Cell, Cell, Cell, Cell] }
export interface GasPoint { id: string; name: string; designFlow: number; rows: GasRow[]; note?: string }
const R = (key: string, unit: string, limit: number | null, v: [Cell, Cell, Cell, Cell]): GasRow => ({ key, unit, limit, v });
/** Kết quả quan trắc khí thải định kỳ — giới hạn QCVN 19:2009 cột B (Kp 0,8; Kv 1,0) và QCVN 21:2009 (NH₃ 40). */
export const GAS: Record<"2024" | "2025", GasPoint[]> = {
  "2024": [
    { id: "KK01", name: "Lò hơi 8 t/h", designFlow: 25000, rows: [R("Bụi", "mg/Nm³", 160, [26, 11, 10, 11]), R("SO₂", "mg/Nm³", 400, ["<10", "<10", "<10", "<10"]), R("NOx", "mg/Nm³", 680, ["<10", 39, "<10", 13]), R("CO", "mg/Nm³", 800, [24, 48, 75, 34]), R("Lưu lượng", "m³/h", null, [16478, 15260, 78352, 18015]), R("Nhiệt độ", "°C", null, [97, 89, 99, 96])] },
    { id: "KK02", name: "Sấy nóng · tạo hạt 1", designFlow: 55000, rows: [R("Bụi", "mg/Nm³", 160, [14, 19, 13, 11]), R("CO", "mg/Nm³", 800, [17, 11, "<10", "<10"]), R("Lưu lượng", "m³/h", null, [49596, 44510, 47081, 48136]), R("NH₃", "mg/Nm³", 40, ["KPH", "KPH", "KPH", "KPH"])] },
    { id: "KK03", name: "Sấy nguội · tạo hạt 1", designFlow: 55000, rows: [R("Bụi", "mg/Nm³", 160, [18, 11, 10, 12]), R("CO", "mg/Nm³", 800, [13, 16, 10, "<10"]), R("Lưu lượng", "m³/h", null, [44510, 44104, 45973, 44187]), R("NH₃", "mg/Nm³", 40, ["KPH", "KPH", "KPH", "KPH"])] },
    { id: "KK04", name: "Sấy nóng · tạo hạt 2", designFlow: 55000, note: "Đợt 3: ngừng bảo trì", rows: [R("Bụi", "mg/Nm³", 160, [15, 10, null, 13]), R("CO", "mg/Nm³", 800, [25, 15, null, "<10"]), R("Lưu lượng", "m³/h", null, [45781, 45115, null, 46103]), R("NH₃", "mg/Nm³", 40, ["KPH", "KPH", null, "KPH"])] },
    { id: "KK05", name: "Sấy nguội · tạo hạt 2", designFlow: 55000, note: "Đợt 3: ngừng bảo trì", rows: [R("Bụi", "mg/Nm³", 160, [19, 12, null, 10]), R("CO", "mg/Nm³", 800, [19, 17, null, "<10"]), R("Lưu lượng", "m³/h", null, [47053, 45480, null, 43806]), R("NH₃", "mg/Nm³", 40, ["KPH", "KPH", null, "KPH"])] },
    { id: "KK06", name: "Sấy · tạo hạt 3", designFlow: 140000, note: "Đợt 4: sự cố thiết bị, bảo trì", rows: [R("Bụi", "mg/Nm³", 160, [15, 11, 10, null]), R("CO", "mg/Nm³", 800, [24, 22, 75, null]), R("Lưu lượng", "m³/h", null, [75737, 79128, 78352, null]), R("NH₃", "mg/Nm³", 40, ["KPH", "KPH", "KPH", null]), R("Nhiệt độ", "°C", null, [60, 49, 48, null])] },
  ],
  "2025": [
    { id: "KK01", name: "Lò hơi 8 t/h", designFlow: 25000, rows: [R("Bụi", "mg/Nm³", 160, [12, 19, 10, 12]), R("SO₂", "mg/Nm³", 400, ["<10", "<10", "<10", 85]), R("NOx", "mg/Nm³", 680, [19, 42, "<10", 81]), R("CO", "mg/Nm³", 800, [17, 99, 78, 185]), R("Lưu lượng", "m³/h", null, [16785, 17465, 18429, 16546]), R("Nhiệt độ", "°C", null, [93, 90, 99, 128])] },
    { id: "KK02", name: "Sấy nóng · tạo hạt 1", designFlow: 55000, rows: [R("Bụi", "mg/Nm³", 160, [12, 12, 13, 13]), R("CO", "mg/Nm³", 800, ["<10", "<10", "<10", 25]), R("Lưu lượng", "m³/h", null, [47230, 45650, 47081, 47568]), R("NH₃", "mg/Nm³", 40, [0.78, 0.63, "KPH", "KPH"])] },
    { id: "KK03", name: "Sấy nguội · tạo hạt 1", designFlow: 55000, note: "Bảng gốc lệch cột: đợt 2 thiếu giá trị bụi, có \"15\" ở dòng SO₂, NH₃ ghi \"<10\"", rows: [R("Bụi", "mg/Nm³", 160, [15, null, 10, 13]), R("SO₂", "mg/Nm³", 400, ["<10", 15, "<10", "<10"]), R("CO", "mg/Nm³", 800, ["<10", "<10", "<10", 17]), R("Lưu lượng", "m³/h", null, [47291, 46255, 45973, 47720]), R("NH₃", "mg/Nm³", 40, [0.78, "<10", "KPH", "KPH"])] },
    { id: "KK04", name: "Sấy nóng · tạo hạt 2", designFlow: 55000, note: "Đợt 3: ngừng bảo trì", rows: [R("Bụi", "mg/Nm³", 160, [10, 14, null, 13]), R("CO", "mg/Nm³", 800, ["<10", "<10", null, 27]), R("Lưu lượng", "m³/h", null, [45251, 44850, null, 46215]), R("NH₃", "mg/Nm³", 40, [0.86, 0.71, null, "KPH"])] },
    { id: "KK05", name: "Sấy nguội · tạo hạt 2", designFlow: 55000, note: "Đợt 3: ngừng bảo trì", rows: [R("Bụi", "mg/Nm³", 160, [14, 15, null, 12]), R("CO", "mg/Nm³", 800, ["<10", "<10", null, 14]), R("Lưu lượng", "m³/h", null, [44230, 45452, null, 46824]), R("NH₃", "mg/Nm³", 40, [0.65, 0.74, null, "KPH"])] },
    { id: "KK06", name: "Sấy · tạo hạt 3", designFlow: 140000, note: "Đợt 4: ngừng bảo trì", rows: [R("Bụi", "mg/Nm³", 160, [12, 16, 10, null]), R("CO", "mg/Nm³", 800, ["<10", "<10", 75, null]), R("Lưu lượng", "m³/h", null, [78132, 80125, 78352, null]), R("NH₃", "mg/Nm³", 40, ["KPH", 0.6, "KPH", null]), R("Nhiệt độ", "°C", null, [48, 52, 99, null])] },
  ],
};

/** Nước thải sau xử lý — QCVN 40:2011/BTNMT cột A (Kf 1,1; Kq 1,2). */
export const WASTEWATER = {
  limits: { COD: 99, TSS: 66, Chì: 0.132, Cadimi: 0.066, "Thủy ngân": 0.066, Asen: 0.0066 } as Record<string, number>,
  "2024": { COD: [9, 13, 10, 13], TSS: ["KPH", 19, "<5", "KPH"], Chì: ["KPH", "KPH", "<0,01", "KPH"], Cadimi: ["KPH", "KPH", "KPH", "KPH"], "Thủy ngân": ["KPH", "KPH", "KPH", "KPH"], Asen: ["KPH", "KPH", "KPH", "KPH"] } as Record<string, Cell[]>,
  "2025": { COD: [15, 17, 10, 20], TSS: ["KPH", "KPH", "<5", "KPH"], Chì: ["KPH", "KPH", "<0,01", "KPH"], Cadimi: ["KPH", "KPH", "KPH", "KPH"], "Thủy ngân": ["KPH", "KPH", "KPH", "KPH"], Asen: ["KPH", "KPH", "KPH", "KPH"] } as Record<string, Cell[]>,
};

/** Chất thải. CTRSH: tấn; CTRCNTT: kg; CTNH: kg. */
export const CTRSH = { y2023: 96.45, y2024: 75.19, y2025: 85.5, receiver: { "2024": "DNTN Huỳnh Thị Đẳng", "2025": "Công ty CP Công trình Đô thị Cần Đước" } } as const;
export const CTRCNTT = [
  { name: "Chất thải phải xử lý (Công ty TNHH Môi trường Chân Lý)", y2023: 195810, y2024: 162010, y2025: 192880 },
  { name: "Dùng làm nguyên liệu sản xuất (tại cơ sở)", y2023: 6216000, y2024: 3056000, y2025: 3186000 },
  { name: "Dùng bao bì cho sản xuất (tại cơ sở)", y2023: 327000, y2024: 433, y2025: 560000 },
  { name: "Xỉ than làm nguyên liệu (Cty TNHH Hoàng Phúc Tín)", y2023: 406730, y2024: 387700, y2025: 500480 },
  { name: "Dầu nhớt thải làm nhiên liệu cho bánh răng (tại cơ sở)", y2023: 1950, y2024: 2166, y2025: 2510 },
  { name: "Thành phẩm dùng lại làm nguyên liệu (tại cơ sở)", y2023: 1389000, y2024: 1836000, y2025: 1536000 },
] as const;
export const CTNH = [
  { name: "Dầu nhớt thải", code: "17 02 03", y2023: 260, y2024: 100, y2025: 600 },
  { name: "Chất hấp thụ, vật liệu lọc nhiễm TP nguy hại", code: "18 02 01", y2023: 70, y2024: 40, y2025: 20 },
  { name: "Bóng đèn huỳnh quang hỏng", code: "16 01 06", y2023: 100, y2024: 270, y2025: 100 },
  { name: "Hộp mực in thải có TP nguy hại", code: "08 02 04", y2023: 40, y2024: 30, y2025: 20 },
  { name: "Bao bì cứng kim loại thải (cả bình áp suất rỗng)", code: "18 01 02", y2023: 390, y2024: 400, y2025: 300 },
] as const;
export const CTNH_TOTAL = { y2023: 860, y2024: 840, y2025: 1040 } as const;
export const CTNH_RECEIVER = "Công ty TNHH Môi trường Cao Gia Quý";
