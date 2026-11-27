// Phí bảo vệ môi trường đối với khí thải và nước thải công nghiệp — tính lại theo các Thông báo của Sở Nông nghiệp và Môi trường Tây Ninh:
//  • Khí thải Quý I+II/2026 (số 25439/TB-SNNMT, 16/11/2026): F = f/4 + C
//  • Nước thải công nghiệp Quý I+II/2026 (số 24989/TB-SNNMT, 11/11/2026)
// Các mức phí dưới đây được SUY RA bằng cách khớp ngược 12 giá trị C (6 dòng × 2 quý) và 2 giá trị Fq trong thông báo (sai số ≤ 2 đồng) —
// cần đối chiếu Nghị định phí bảo vệ môi trường hiện hành (NĐ 153/2024/NĐ-CP, NĐ 346/2025/NĐ-CP) trước khi dùng nộp tờ khai.
export const AIR_RATE = { dust: 800, nox: 800, sox: 700, co: 500 } as const;   // đồng / tấn chất ô nhiễm (tấn = lưu lượng m³ × mg/Nm³ / 10⁹)
export const AIR_FIXED_YEAR = 3_000_000;                                        // f: phí cố định, đồng/năm (f/4 = 750.000 đ/quý)
export const AIR_APPRAISAL_FACTOR = 0.75;                                       // C sau thẩm định / C theo tờ khai (quan sát: đúng 0,75 ở cả 12 giá trị)
export const WATER_RATE = { cod: 3000, tss: 3500 } as const;                    // đồng / kg (Hg, Pb, As, Cd đều không phát hiện → 0)

export interface AirStream { volume: number; dust: number; nox: number; sox: number; co: number }
/** Phí biến đổi C của một dòng khí thải trong quý theo tờ khai (đồng). */
export const airVariable = (s: AirStream) => Math.round((s.volume * (s.dust * AIR_RATE.dust + s.nox * AIR_RATE.nox + s.sox * AIR_RATE.sox + s.co * AIR_RATE.co)) / 1e9);
/** Phí khí thải một quý: F = f/4 + C (C có thể nhân hệ số thẩm định). */
export const airQuarter = (streams: AirStream[], appraised = false) => { const C = streams.reduce((a, s) => a + airVariable(s) * (appraised ? AIR_APPRAISAL_FACTOR : 1), 0); return { C: Math.round(C), F: Math.round(AIR_FIXED_YEAR / 4 + C) }; };
/** Phí nước thải công nghiệp một quý (đồng): m³ × mg/L / 1000 = kg. */
export const waterQuarter = (m3: number, cod: number, tss: number) => Math.round((m3 * cod * WATER_RATE.cod + m3 * tss * WATER_RATE.tss) / 1000);
/** Lượng khí thải khai theo quý = lưu lượng thiết kế × số giờ (1.152 h/quý ≈ 12,8 h/ngày × 90 ngày trong tờ khai 2026). */
export const airVolume = (designFlow: number, hours = 1152) => designFlow * hours;
