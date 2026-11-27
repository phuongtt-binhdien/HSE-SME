// Tính toán cho tab Kiểm toán môi trường: đối chiếu số liệu giữa các nguồn, dự báo vs thực tế, cân bằng vật chất, giải pháp.
import { FORECAST, BALANCE, SOLUTIONS, SOLUTIONS_STATED, KNK, POINT_TOLERANCE, STAGES } from "../data/ktmt.ts";
import type { Key } from "../data/ktmt.ts";
import { UTILITIES, PRODUCT_TOTAL, CTRSH, CTRCNTT, CTNH_TOTAL } from "../data/bvmtReports.ts";

/** Chênh lệch tương đối (a so với b); null nếu thiếu số. */
export const diffPct = (a: number | null, b: number | null): number | null => (a == null || b == null || b === 0 ? null : ((a - b) / b) * 100);
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/** Tổng CTRCNTT theo báo cáo BVMT (kg → tấn). Gồm cả phần dùng lại tại cơ sở (như cách [B] tính "tăng lớn do tái sử dụng"). */
export const ctrcnttTonnes = (y: "y2023" | "y2024" | "y2025") => sum(CTRCNTT.map(r => r[y])) / 1000;

/** Thực tế 2023–2025 theo báo cáo công tác BVMT (đã nhập ở tab Báo Cáo BVMT). Dầu: bảng gốc ghi "tấn/năm" nhưng số trùng [B] tính bằng lít/1000 → quy đổi ×1000 lít (giả định). */
export function bcActual(key: Key, y: "y2023" | "y2024" | "y2025"): number | null {
  switch (key) {
    case "prod": return PRODUCT_TOTAL[y];
    case "kwh": return UTILITIES.kWh[y];
    case "coal": return UTILITIES.coalT[y];
    case "oil": return UTILITIES.oil[y] * 1000;
    case "water": return UTILITIES.waterM3[y];
    case "ww": return UTILITIES.wastewaterM3[y];
    case "ctrsh": return CTRSH[y];
    case "ctrcntt": return ctrcnttTonnes(y);
    case "ctnh": return CTNH_TOTAL[y] / 1000;
    default: return null; // co2: BC BVMT không có
  }
}

export type CrossRow = { key: Key; label: string; unit: string; plan2023: number; bc2023: number | null; knk2023: number | null; plan2024: number; bc2024: number | null; knk2024: number | null; d2023: number | null; d2024: number | null; flag: boolean };
/** Đối chiếu số liệu cơ sở trong [B] với báo cáo BVMT (và kiểm kê KNK nếu có). flag = lệch > ngưỡng ở ít nhất một năm. */
export function crossCheck(threshold = 2): CrossRow[] {
  const knk = (k: Key, y: "y2023" | "y2024"): number | null => (k === "coal" ? KNK[y].coalT : k === "kwh" ? KNK[y].kWh : null);
  return FORECAST.map(f => {
    const bc23 = bcActual(f.key, "y2023"), bc24 = bcActual(f.key, "y2024");
    const d23 = diffPct(f.p2023, bc23), d24 = diffPct(f.p2024, bc24);
    return { key: f.key, label: f.label, unit: f.unit, plan2023: f.p2023, bc2023: bc23, knk2023: knk(f.key, "y2023"), plan2024: f.p2024, bc2024: bc24, knk2024: knk(f.key, "y2024"), d2023: d23, d2024: d24, flag: [d23, d24].some(d => d != null && Math.abs(d) > threshold) };
  });
}

export type FcRow = { key: Key; label: string; unit: string; lo: number; hi: number; actual: number | null; status: "in" | "below" | "above" | "na"; dev: number | null; pointForecast: boolean };
/** Dự báo 2025 [B] so với thực tế 2025 (báo cáo BVMT). Dự báo điểm (lo=hi) chấp nhận ±POINT_TOLERANCE (giả định của app). */
export function forecastVsActual(): FcRow[] {
  return FORECAST.map(f => {
    const a = bcActual(f.key, "y2025");
    const point = f.lo === f.hi;
    const lo = point ? f.lo * (1 - POINT_TOLERANCE) : f.lo, hi = point ? f.hi * (1 + POINT_TOLERANCE) : f.hi;
    const status = a == null ? "na" : a < lo ? "below" : a > hi ? "above" : "in";
    const mid = (f.lo + f.hi) / 2;
    return { key: f.key, label: f.label, unit: f.unit, lo: f.lo, hi: f.hi, actual: a, status, dev: a == null ? null : diffPct(a, mid), pointForecast: point };
  });
}

/** Cân bằng vật chất trong [B] §5.2. */
export function balanceCheck() {
  const inSum = sum(BALANCE.inputs.map(i => i.t)), outSum = sum(BALANCE.outputs.map(o => o.t));
  const solidsOut = BALANCE.solid.ctrsh + BALANCE.solid.ctrcntt + BALANCE.solid.ctnh;
  const materials = BALANCE.inputs[0].t;
  const waterIn = BALANCE.inputs[1].t, wwOut = BALANCE.outputs[1].t;
  return {
    inSum, inStated: BALANCE.statedInputTotal, inDiff: inSum - BALANCE.statedInputTotal,
    outSum, outStated: BALANCE.statedOutputTotal, outDiff: outSum - BALANCE.statedOutputTotal,
    materialLossPct: ((materials - BALANCE.productT) / BALANCE.productT) * 100,
    solidsOut, solidsOutStatedGap: BALANCE.outputs[3].t - solidsOut,
    outInRatio: outSum / inSum,
    // Chất rắn: nguyên liệu + than + dầu vào so với sản phẩm + CTR ra (không tính nước, không khí).
    solidIn: materials + BALANCE.inputs[2].t + BALANCE.inputs[3].t, solidOut: BALANCE.productT + solidsOut,
    // Nước: nước vào trừ nước thải ra = phần bay hơi/ẩm trong sản phẩm — [B] không liệt kê dòng này.
    waterUnaccounted: waterIn - wwOut,
    airInputShare: BALANCE.inputs[4].t / inSum,
  };
}

/** Hệ số phát thải ngầm định trong [B] và so với kiểm kê KNK 2023 (than). */
export function impliedFactors() {
  const c = BALANCE.co2;
  return { coalPlan: c.coalCO2 / c.coalT, oilPlan: c.oilCO2 / c.oilT, coalKnk2023: KNK.y2023.coalCO2t / KNK.y2023.coalT, co2Sum: c.coalCO2 + c.oilCO2, co2SumStated: c.statedTotal };
}

/** Giải pháp: tổng chi phí/giảm CO₂e; hệ số ngầm định; hoàn vốn theo đơn giá than do người dùng nhập (VNĐ/tấn). */
export function solutionsSummary(coalPriceVndPerT = 0) {
  const costM = sum(SOLUTIONS.map(s => s.costM)), co2e = sum(SOLUTIONS.map(s => s.co2e));
  const rows = SOLUTIONS.map(s => ({ ...s, kgPerUnit: s.qty ? (s.co2e * 1000) / s.qty : null, costPerTco2e: s.co2e ? (s.costM * 1e6) / s.co2e : null }));
  const coal = SOLUTIONS[1];
  const saving = coalPriceVndPerT > 0 ? (coal.qty * coalPriceVndPerT) / 1e6 : null; // triệu VNĐ/năm
  return { costM, co2e, costStatedOk: costM === SOLUTIONS_STATED.costM, co2eDiff: co2e - SOLUTIONS_STATED.co2e, rows, coalSavingM: saving, coalPaybackYears: saving ? coal.costM / saving : null };
}

/** Tiến độ checklist quy trình (done: map stepId → boolean). */
export function progress(done: Record<string, boolean>) {
  return STAGES.map(st => ({ id: st.id, total: st.steps.length, done: st.steps.filter(s => done[s.id]).length }));
}
