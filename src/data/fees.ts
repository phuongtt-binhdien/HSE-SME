// Dữ liệu từ Thông báo nộp phí BVMT Quý I+II/2026 — Sở Nông nghiệp và Môi trường Tây Ninh. Trạng thái nộp: theo xác nhận của chủ cơ sở (đã nộp đến hết Quý II/2026).
export const AIR_FEE_NOTICE = { no: "25439/TB-SNNMT", date: "16/11/2026", account: "3511.0.1020248.00000 — Kho bạc Nhà nước khu vực XVIII", total: 1_536_858, declared: 1_549_147, due: "10 ngày kể từ ngày ban hành" };
export const WATER_FEE_NOTICE = { no: "24989/TB-SNNMT", date: "11/11/2026", account: "35110102024800000 (chương 412, khoản 262, tiểu mục 2618) — Kho bạc Nhà nước khu vực XVIII", total: 407_600, declared: 358_380, due: "10 ngày kể từ ngày ban hành" };
/** Dòng khí thải 1–6 trong tờ khai = G01 (lò hơi), G02–G06 (lò sấy). Lượng khí = lưu lượng thiết kế × 1.152 h. conc: bụi, NOx, SOx, CO (mg/Nm³; "<10" khai 10). C: phí biến đổi theo tờ khai / sau thẩm định (đồng). */
export const AIR_STREAMS = [
  { n: 1, id: "G01", name: "Lò hơi", volume: 28_800_000, q: [[16, 34, 55, 68], [19, 28, 49, 79]], decl: [3240, 3209], appr: [2430, 2406] },
  { n: 2, id: "G02", name: "Sấy nóng · tạo hạt 1", volume: 63_360_000, q: [[16, 11, 10, 22], [13, 10, 10, 21]], decl: [2510, 2275], appr: [1882, 1706] },
  { n: 3, id: "G03", name: "Sấy nguội · tạo hạt 1", volume: 63_360_000, q: [[17, 10, 10, 14], [13, 10, 10, 25]], decl: [2257, 2402], appr: [1692, 1801] },
  { n: 4, id: "G04", name: "Sấy nóng · tạo hạt 2", volume: 63_360_000, q: [[18, 21, 10, 172], [13, 55, 10, 62]], decl: [7869, 5855], appr: [5902, 4391] },
  { n: 5, id: "G05", name: "Sấy nguội · tạo hạt 2", volume: 63_360_000, q: [[18, 10, 10, 23], [14, 59, 10, 74]], decl: [2592, 6489], appr: [1943, 4866] },
  { n: 6, id: "G06", name: "Sấy · tạo hạt 3", volume: 161_280_000, q: [[15, 10, 10, 10], [16, 10, 10, 10]], decl: [5160, 5289], appr: [3871, 3968] },
] as const;
export const AIR_QUARTERS = [
  { q: "Quý I/2026", declared: 773_628, appraised: 767_720, C: [23_628, 17_720] },
  { q: "Quý II/2026", declared: 775_519, appraised: 769_138, C: [25_519, 19_138] },
] as const;
export const WATER_QUARTERS = [
  { q: "Quý I/2026", m3: 3600, cod: 15, tssDecl: 0, tss: 3.9, feeDecl: 162_000, feeAppr: 211_140, note: "Tờ khai ghi TSS = 0 (kết quả < 4 mg/L); Sở thẩm định lấy 3,9 mg/L nên phí tăng 162.000 → 211.140 đ" },
  { q: "Quý II/2026", m3: 3600, cod: 12, tssDecl: 5.3, tss: 5.3, feeDecl: 196_380, feeAppr: 196_380, note: "Khớp tờ khai" },
] as const;
/** Trạng thái nộp phí (mặc định theo xác nhận: đã nộp đến Quý II/2026). Quý III, IV chưa có thông báo. */
export const FEE_STATUS = [
  { key: "air12", label: "Khí thải Quý I+II/2026", amount: 1_536_858, paid: true },
  { key: "water12", label: "Nước thải công nghiệp Quý I+II/2026", amount: 407_600, paid: true },
  { key: "air3", label: "Khí thải Quý III/2026", amount: 0, paid: false },
  { key: "water3", label: "Nước thải công nghiệp Quý III/2026", amount: 0, paid: false },
] as const;
