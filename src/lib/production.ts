// Tính toán từ thống kê sản xuất 2026 (data/production2026.ts).
import type { MachineKey, MachineMonth } from "../data/production2026.ts";
import { PROD } from "../data/production2026.ts";

export const KEYS: MachineKey[] = ["TH1H", "TH2H", "TH3H"];
export const monthsOf = (q: "Q2" | "Q3" | "ALL"): string[] => (q === "Q2" ? ["04", "05", "06"] : q === "Q3" ? ["07", "08", "09"] : ["04", "05", "06", "07", "08"]).filter(m => PROD[m]);
const ZERO = (): MachineMonth => ({ ca: 0, hours: 0, downH: 0, tons: 0, coalLoKg: 0, coalNoiKg: 0, kWh: 0, kWhRuns: 0, biomassKg: 0, biomassRuns: 0, maccaBanh: 0, vienNenBanh: 0, topProducts: [] });
/** Cộng dồn một máy qua các tháng. */
export function sumMachine(k: MachineKey, months: string[]): MachineMonth {
  const a = ZERO();
  for (const m of months) { const x = PROD[m]?.machines[k]; if (!x) continue;
    for (const f of ["ca", "hours", "downH", "tons", "coalLoKg", "coalNoiKg", "kWh", "kWhRuns", "biomassKg", "biomassRuns", "maccaBanh", "vienNenBanh"] as const) a[f] += x[f]; }
  return a;
}
/** Suất tiêu hao: than lò đốt (kg/tấn), điện (kWh/tấn, chỉ tính các ca có số công tơ hợp lệ), sinh khối (kg/tấn). */
export function intensity(x: MachineMonth, validRunsShare = x.ca ? x.kWhRuns / x.ca : 1) {
  const tons = x.tons || NaN;
  return { coalPerT: x.coalLoKg / tons, kWhPerT: validRunsShare ? x.kWh / validRunsShare / tons : NaN, bioPerT: x.biomassKg / tons, tPerH: x.tons / (x.hours || NaN) };
}
/** Tỷ lệ sinh khối trong nhiên liệu lò đốt theo khối lượng (không phải theo nhiệt lượng — chưa có nhiệt trị). */
export const biomassMassShare = (x: MachineMonth) => (x.biomassKg + x.coalLoKg > 0 ? x.biomassKg / (x.biomassKg + x.coalLoKg) : 0);
/** Lượng khí thải kê khai (thiết kế × 1.152 h) so với ước tính theo lưu lượng đo × giờ chạy thực. */
export function volumeRatio(hoursActual: number, qMeasured: number, qDesign: number, hoursDeclared = 1152) {
  return (qMeasured * hoursActual) / (qDesign * hoursDeclared);
}
/** Giờ chạy mỗi ngày (cộng các ca) → mảng 31 phần tử. */
export function dailyHours(k: MachineKey, m: string, days = 31): number[] {
  const d = PROD[m]?.daily[k] ?? {}; return Array.from({ length: days }, (_, i) => d[String(i + 1)]?.h ?? 0);
}
export const rawTotals = (months: string[]) => {
  const t: Record<string, number> = {}; for (const m of months) for (const [k, v] of Object.entries(PROD[m]?.rawTons ?? {})) t[k] = (t[k] ?? 0) + v; return Object.entries(t).sort((a, b) => b[1] - a[1]);
};
