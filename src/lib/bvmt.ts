import { GAS, PRODUCTS, MATERIALS, PRODUCT_TOTAL, MATERIAL_TOTAL, UTILITIES, NEAREST_IN_2025, AIR_VOLUME_M3, CTNH, CTNH_TOTAL, WASTEWATER, type Cell } from "../data/bvmtReports.ts";

/** Đọc giá trị ô: số → số; "<10" → {lt:10}; "KPH"/null → null. */
export function num(c: Cell): number | null { if (typeof c === "number") return c; if (typeof c === "string") { const m = c.replace(",", ".").match(/^<?\s*([\d.]+)$/); if (m && !c.startsWith("<")) return Number(m[1]); } return null; }
export const lessThan = (c: Cell): number | null => (typeof c === "string" && c.startsWith("<") ? Number(c.slice(1).replace(",", ".")) : null);
/** Cận trên bảo thủ của giá trị: số, hoặc ngưỡng "<x", hoặc 0 (KPH). */
export const upper = (c: Cell): number | null => (c == null ? null : num(c) ?? lessThan(c) ?? (c === "KPH" ? 0 : null));
export const pct = (v: number, limit: number) => (v / limit) * 100;

/** Kiểm tra tuân thủ: danh sách giá trị vượt/giáp giới hạn. */
export function compliance(year: "2024" | "2025") {
  let n = 0, over: string[] = [], max = { id: "", key: "", period: 0, p: 0 };
  for (const pt of GAS[year]) for (const r of pt.rows) if (r.limit) r.v.forEach((c, i) => { const u = upper(c); if (u == null) return; n++; if (u > r.limit!) over.push(`${pt.id} ${r.key} đợt ${i + 1}`); const e = num(c); if (e != null) { const p = pct(e, r.limit!); if (p > max.p) max = { id: pt.id, key: r.key, period: i + 1, p }; } });
  return { n, over, max };
}
/** Các giá trị đo trùng nhau chính xác giữa báo cáo 2024 và 2025 cùng điểm – thông số – đợt. Chỉ xét lưu lượng, nhiệt độ, CO ≥ 20 (số khó trùng ngẫu nhiên); bụi, NH₃ và giá trị nhỏ bị bỏ qua vì dễ trùng. */
export function identicalAcrossYears() {
  const out: { id: string; key: string; period: number; value: number }[] = [];
  for (const p25 of GAS["2025"]) { const p24 = GAS["2024"].find(p => p.id === p25.id); if (!p24) continue;
    for (const r25 of p25.rows) { const r24 = p24.rows.find(r => r.key === r25.key); if (!r24) continue;
      r25.v.forEach((c, i) => { const a = num(c), b = num(r24.v[i]); if (a != null && b != null && a === b && (r25.key === "Lưu lượng" || r25.key === "Nhiệt độ" || (r25.key === "CO" && a >= 20))) out.push({ id: p25.id, key: r25.key, period: i + 1, value: a }); }); } }
  return out;
}
/** Lưu lượng đo vượt hơn `k` lần lưu lượng thiết kế (dấu hiệu nhập nhầm). */
export function flowOutliers(year: "2024" | "2025", k = 1.1) {
  const out: { id: string; period: number; flow: number; design: number }[] = [];
  for (const pt of GAS[year]) { const r = pt.rows.find(r => r.key === "Lưu lượng"); r?.v.forEach((c, i) => { const f = num(c); if (f != null && f > k * pt.designFlow) out.push({ id: pt.id, period: i + 1, flow: f, design: pt.designFlow }); }); }
  return out;
}
/** Mức tăng 2025 so với 2024 của từng dòng; trả về các mức tăng bằng nhau (dấu hiệu cộng đều một số). */
export function uniformIncrements() {
  const inc = (rows: readonly { y2024: number; y2025: number }[]) => rows.map(r => r.y2025 - r.y2024);
  const mode = (a: number[]) => { const c = new Map<number, number>(); a.forEach(x => c.set(x, (c.get(x) ?? 0) + 1)); return [...c.entries()].sort((x, y) => y[1] - x[1])[0]; };
  const p = mode(inc(PRODUCTS.slice(0, 4))), m = mode(inc(MATERIALS.slice(0, 4)));
  return { products: { delta: p[0], count: p[1], of: 4 }, materials: { delta: m[0], count: m[1], of: 4 } };
}
export const sumOf = (rows: readonly { y2023: number; y2024: number; y2025: number }[], y: "y2023" | "y2024" | "y2025") => rows.reduce((a, r) => a + r[y], 0);
/** Tính lại các tổng và so với tổng ghi trong báo cáo. */
export function totalsCheck() {
  const rows = [
    ["Sản lượng sản phẩm 2023", sumOf(PRODUCTS, "y2023"), PRODUCT_TOTAL.y2023], ["Sản lượng sản phẩm 2024", sumOf(PRODUCTS, "y2024"), PRODUCT_TOTAL.y2024], ["Sản lượng sản phẩm 2025", sumOf(PRODUCTS, "y2025"), PRODUCT_TOTAL.y2025],
    ["Nguyên liệu 2023", sumOf(MATERIALS, "y2023"), MATERIAL_TOTAL.y2023], ["Nguyên liệu 2024", sumOf(MATERIALS, "y2024"), MATERIAL_TOTAL.y2024], ["Nguyên liệu 2025", sumOf(MATERIALS, "y2025"), MATERIAL_TOTAL.y2025],
    ["CTNH 2023", sumOf(CTNH, "y2023"), CTNH_TOTAL.y2023], ["CTNH 2024", sumOf(CTNH, "y2024"), CTNH_TOTAL.y2024], ["CTNH 2025", sumOf(CTNH, "y2025"), CTNH_TOTAL.y2025],
  ] as [string, number, number][];
  return rows.map(([name, calc, stated]) => ({ name, calc, stated, ok: Math.abs(calc - stated) < 1 }));
}
/** Cột "năm gần nhất" của báo cáo 2025 lệch so với số liệu năm 2024 trong báo cáo 2024. */
export function nearestMismatch() {
  const out: { key: string; stated: number; expected: number }[] = [];
  for (const k of Object.keys(NEAREST_IN_2025) as (keyof typeof NEAREST_IN_2025)[]) if (NEAREST_IN_2025[k] !== UTILITIES[k].y2024) out.push({ key: k, stated: NEAREST_IN_2025[k], expected: UTILITIES[k].y2024 });
  return out;
}
/** Thời gian vận hành ngụ ý bởi tổng lượng khí 1,628 tỷ m³ ÷ 360.000 m³/h. */
export const impliedHours = () => AIR_VOLUME_M3.y2025 / AIR_VOLUME_M3.designFlowM3h;
/** Nước thải: tất cả thông số đo được (số) so với giới hạn. */
export function wastewaterMax(year: "2024" | "2025") {
  const out: { key: string; value: number; limit: number; pct: number }[] = [];
  const d = WASTEWATER[year];
  for (const k of Object.keys(WASTEWATER.limits)) { const vals = d[k].map(upper).filter((x): x is number => x != null); const m = Math.max(...vals); out.push({ key: k, value: m, limit: WASTEWATER.limits[k], pct: pct(m, WASTEWATER.limits[k]) }); }
  return out;
}
