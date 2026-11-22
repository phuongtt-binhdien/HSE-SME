// Trách nhiệm tái chế bao bì (EPR) — Nghị định 110/2026/NĐ-CP, Thông tư 24/2026/TT-BNNMT (Phụ lục 1).
// Đóng góp Quỹ BVMT Việt Nam: F = V × R × Fs;  V = khối lượng bao bì đưa ra thị trường (kg);  R = tỷ lệ tái chế bắt buộc (bao bì nhựa mềm mã A.3.4: 10 %);
// Fs = định mức chi phí tái chế (đồng/kg): 8.486 (kỳ trước) → 8.320 (TT 24/2026, dự kiến cho số liệu năm 2026).
export const R_SOFT = 0.1, FS_OLD = 8486, FS_2026 = 8320, VAT = 0.08;
export const fundAmount = (vKg: number, r = R_SOFT, fs = FS_2026) => Math.round(vKg * r * fs);
export const mandatoryKg = (vKg: number, r = R_SOFT) => vKg * r;
/** Phương án 2: thuê đơn vị tái chế — khối lượng hợp đồng (kg) × đơn giá (đồng/kg, chưa VAT) × (1 + VAT). */
export const recyclerCost = (kg: number, price = 5500, vat = VAT) => Math.round(kg * price * (1 + vat));
/** V từ số lượng bao theo quy cách: Σ (số bao × khối lượng 1 bao, gam) / 1000 → kg. */
export const packagingKg = (rows: { qty: number; grams: number }[]) => rows.reduce((a, r) => a + (r.qty * r.grams) / 1000, 0);
