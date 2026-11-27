// Tính toán cho tab Kiểm toán môi trường: đối chiếu số liệu giữa các nguồn, dự báo vs thực tế, cân bằng vật chất, giải pháp.
import { FORECAST, BALANCE, SOLUTIONS, SOLUTIONS_STATED, KNK, POINT_TOLERANCE, STAGES, PL1_2023, AUDIT2024, REPORT_2023, REPORT_2025, VDL } from "../data/ktmt.ts";
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

export type CrossRow = { key: Key; label: string; unit: string; plan2023: number; bc2023: number | null; knk2023: number | null; pl12023: number | null; plan2024: number; bc2024: number | null; knk2024: number | null; d2023: number | null; d2024: number | null; flag: boolean };
/** Đối chiếu số liệu cơ sở trong [B] với báo cáo BVMT (và kiểm kê KNK nếu có). flag = lệch > ngưỡng ở ít nhất một năm. */
export function crossCheck(threshold = 2): CrossRow[] {
  const knk = (k: Key, y: "y2023" | "y2024"): number | null => (k === "coal" ? KNK[y].coalT : k === "kwh" ? KNK[y].kWh : null);
  const pl1 = (k: Key): number | null => (k === "kwh" ? PL1_2023.kWhA + PL1_2023.kWhB : k === "coal" ? PL1_2023.coalT : k === "water" ? PL1_2023.waterM3 : k === "ww" ? PL1_2023.wastewaterM3 : k === "prod" ? PL1_2023.productA + PL1_2023.productB : null);
  return FORECAST.map(f => {
    const bc23 = bcActual(f.key, "y2023"), bc24 = bcActual(f.key, "y2024");
    const d23 = diffPct(f.p2023, bc23), d24 = diffPct(f.p2024, bc24);
    return { key: f.key, label: f.label, unit: f.unit, plan2023: f.p2023, bc2023: bc23, knk2023: knk(f.key, "y2023"), pl12023: pl1(f.key), plan2024: f.p2024, bc2024: bc24, knk2024: knk(f.key, "y2024"), d2023: d23, d2024: d24, flag: [d23, d24].some(d => d != null && Math.abs(d) > threshold) };
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

/** Kiểm tra số học và nhất quán trong Báo cáo KTMT 2024 [I]. */
export function audit2024Check() {
  const a = AUDIT2024;
  const inSum = sum(a.balanceIn.map(x => x[1])), outSum = sum(a.balanceOut.map(x => x[1]));
  const airSum = a.airParts.coal + a.airParts.oil;
  const flueSum = a.flueParts.boiler + a.flueParts.dryer;
  const flueRebuilt = (a.designFlowM3h * a.hoursImplied * a.densityImplied) / 1000; // tấn
  const bcAirM3 = 1_628_000_000; // báo cáo BVMT 2024/2025
  const bcHours = bcAirM3 / a.designFlowM3h;
  const solutionsCost = sum(a.solutions.map(x => x.costM)), solutionsCo2e = sum(a.solutions.map(x => x.co2e));
  return {
    inSum, inDiff: inSum - a.balanceInStated, outSum, outDiff: outSum - a.balanceOutStated, gap: outSum - inSum, gapDiff: outSum - inSum - a.gapStated,
    airSum, airDiff: airSum - 43000, flueSum, flueDiff: flueSum - 4665600, flueRebuilt, bcHours, bcKgPerM3: (4665600 * 1000) / bcAirM3,
    efficiency: (a.production / a.balanceIn[0][1]) * 100, fluePct: (4665600 / outSum) * 100,
    sec: { kWhPerT: a.kWh / a.production, coalKgPerT: (a.coalT * 1000) / a.production, waterM3PerT: a.waterM3 / a.production },
    ctrsh: a.ctrsh.tpd * a.ctrsh.days, ctrshDiff: a.ctrsh.tpd * a.ctrsh.days - a.ctrsh.stated,
    ctnh: (a.ctnh.kgPerMonth * 12) / 1000, ctnhDiff: (a.ctnh.kgPerMonth * 12) / 1000 - a.ctnh.stated,
    ctrcntt: a.ctrcntt.reuse + a.ctrcntt.transfer, reusePct: (a.ctrcntt.reuse / a.ctrcntt.stated) * 100,
    coalCo2: a.coalT * (a.co2.coal / a.coalT), coalFactor: a.co2.coal / a.coalT, oilFactor: a.co2.oil / a.oilT,
    co2Sum: a.co2.coal + a.co2.oil, co2Diff: a.co2.coal + a.co2.oil - a.co2.total,
    solutionsCost, solutionsCo2e, costVsRecommend: solutionsCost - a.recommendCostStated, co2eVsRecommend: solutionsCo2e - a.recommendCo2eStated,
  };
}

/** Kiểm tra Phụ lục 1 [G]: điện theo quy trình, KNK bản nháp so với báo cáo kiểm kê, nước thải đầu vào so với mô hình hiệu suất, cân bằng nguyên tố. */
export function pl1Check() {
  const g = PL1_2023;
  const kwh = g.kWhA + g.kWhB;
  const ghgSum = sum(g.ghgDraft.map(x => x[1]));
  const ghgFinal = KNK.y2023.scope1;
  const ghgDiffRows = g.ghgDraft.map(([n, v]) => ({ name: n, draft: v }));
  // Hiệu suất ngầm định của mô hình hạ lưu: out/in (đợt 1)
  const factor = (k: "TN" | "TP" | "COD" | "BOD" | "TSS") => g.modelOut[k] / g.modelIn[k];
  const params = ["COD", "BOD", "TSS", "TN", "TP"] as const;
  const design = params.map(k => {
    const inf = g.influent[k] as readonly number[];
    const predicted = inf.map(v => v * factor(k));
    const limit = g.limitsA[k];
    const exceed = predicted.map((v, i) => (v > limit ? g.influent.dot[i] : null)).filter(Boolean) as string[];
    const worstIn = Math.max(...inf);
    return { k, factor: factor(k), removalModelPct: (1 - factor(k)) * 100, limit, predicted, exceed, worstIn, removalNeededPct: Math.max(0, (1 - limit / worstIn) * 100) };
  });
  const el = g.elementBal;
  const elOut = sum([...el.out]);
  const nIn = g.influent.TN[0] * g.wastewaterM3 / 1000, pIn = g.influent.TP[0] * g.wastewaterM3 / 1000;
  return {
    kwh, kwhDiffBc: diffPct(kwh, UTILITIES.kWh.y2023), kwhDiffKnk: diffPct(kwh, KNK.y2023.kWh),
    products: g.productA + g.productB, productDiffBc: diffPct(g.productA + g.productB, PRODUCT_TOTAL.y2023),
    ghgSum, ghgDiffStated: ghgSum - g.ghgDraftTotalStated, ghgFinal, ghgDiffFinal: ghgSum - ghgFinal, ghgDiffRows,
    design, nIn, pIn, elIn: el.nIn + el.pIn, elOut, elClosed: Math.abs(elOut - el.totalIn) < 1e-9, plugPct: (el.out[2] / el.totalIn) * 100,
    bodLimitExpected: 30 * 1.2 * 1.1,
  };
}

/** Kiểm tra số học và đơn vị trong KTMT 2023 [J]. */
export function report2023Check() {
  const r = REPORT_2023;
  const kwh = sum([...r.kWh]), prod = sum([...r.product]);
  const dryer = sum([...r.coalDryerT]), boiler = sum([...r.coalBoilerT]);
  const gran = sum([...r.granulated]), water = sum([...r.waterM3]);
  const toeCoalExpected = r.toeTable.than.qty * 0.7; // 0,70 TOE/tấn than antraxit (hồ sơ KTNL của NM)
  const co2Per = (k: number) => k;
  const s2 = r.solutions[1], s8 = r.solutions[7];
  const chemPerM3 = r.chemicalsKg.map(([n, kg]) => [n, kg / r.flowM3] as [string, number]);
  return {
    kwh, kwhDiff: kwh - r.kWhStatedTotal, prod, prodDiff: prod - r.productStatedTotal,
    sthTrue: kwh / prod, sthStatedAvg: r.sthStatedAvg,
    dryer, boiler, coalSum: dryer + boiler, coalDryerDiff: dryer - r.coalDryerStatedTotal, coalVsStated: dryer + boiler - r.coalStatedTotal,
    gran, granDiff: gran - r.granulatedStated, water, waterDiff: water - r.waterStated, waterPerGranulated: water / gran, waterPerAll: water / prod,
    toe: { coalExpected: toeCoalExpected, swapped: r.toeTable.do.toe > 1000 && r.toeTable.than.toe < 100, totalStated: r.toeTable.total, totalSum: r.toeTable.dien.toe + r.toeTable.do.toe + r.toeTable.than.toe },
    price: { coalPerT: (r.costs.coal.vnd1000 * 1000) / r.toeTable.than.qty, doPerL: (r.costs.do.vnd1000 * 1000) / r.toeTable.do.qty, kWh: (r.costs.kWh.vnd1000 * 1000) / r.toeTable.dien.qty },
    s2KgPerM3: s2.kgCo2 / ((500 * 12)), planAnnualised: (s2.kgCo2 * 12) / 1000, // tCO₂e nếu nhân thêm 12 lần
    s8PerDay: s8.m3PerMonth / 30, s8VsDesign: s8.m3PerMonth / 30 / r.wwDesignM3PerDay, s8PerYear: s8.m3PerMonth * 12,
    chemPerM3, co2Per,
  };
}

/** Kiểm tra KTMT 2025 [K]. */
export function report2025Check() {
  const r = REPORT_2025;
  const prod = sum([...r.production]), kwh = sum([...r.kWh]);
  const sthOk = r.production.every((p, i) => Math.abs(r.kWh[i] / p - r.sthMonthly[i]) < 0.011);
  const coalToe = r.energy.than.qty * 0.7, toeDien = r.energy.dien.qty * 0.0001543, doToeFactor = r.energy.do.toe / r.energy.do.qty;
  const toeRecomputed = r.energy.dien.toe + r.energy.do.toe + coalToe;
  const ww = r.ww.map(([k, u, q1, q2, q3, lim]) => ({ k, u, vals: [q1, q2, q3], lim, over: [q1, q2, q3].filter(v => v > lim).length }));
  const wwOver = sum(ww.map(x => x.over)), wwTotal = ww.length * 3;
  const wwParamsOver = ww.filter(x => x.over > 0).map(x => x.k);
  const g = r.ghg;
  const s1 = sum(g.rows.map(x => x[1])), total = s1 + g.scope2;
  const co2dev = (g.rows[0][1] / g.coalT);
  return {
    prod, prodDiff: prod - r.productionStated, kwh, kwhDiff: kwh - r.kWhStated, sthOk,
    toe: { coalExpected: coalToe, dien: toeDien, doFactor: doToeFactor, recomputed: toeRecomputed, stated: r.energy.totalStated, understate: toeRecomputed - r.energy.totalStated },
    doSum: r.doBreakdown.forklift + r.doBreakdown.shuttle, doDiff: r.doBreakdown.forklift + r.doBreakdown.shuttle - r.energy.do.qty,
    price: { coalPerT: (r.energy.than.costK * 1000) / r.energy.than.qty, doPerL: (r.energy.do.costK * 1000) / r.energy.do.qty, kWh: (r.energy.dien.costK * 1000) / r.energy.dien.qty },
    coalKgPerT: (r.energy.than.qty * 1000) / prod, waterM3PerT: 76679 / prod,
    ww, wwOver, wwTotal, wwParamsOver,
    ghg: { s1, s1Diff: s1 - g.scope1Stated, scope2Calc: g.mwh * g.ef, scope2Diff: g.mwh * g.ef - g.scope2, total, totalDiff: total - g.totalStated, coalFactor: co2dev, doFactor: (g.rows[1][1] * 1000) / g.doL, growth: (g.totalStated / g.y2024 - 1) * 100, int2025: (g.totalStated / prod) * 1000, int2024Used: (g.y2024 / g.prod2024Used) * 1000, int2024True: (g.y2024 / 411773) * 1000 },
    wwPerDay: r.stated.wwM3 / 365,
    pacPerM3: REPORT_2025.chemicalsKg[0][1] / r.stated.wwM3,
  };
}

/** Độ phủ cấu trúc báo cáo theo giáo trình VĐL (chương 10). */
export function coverage() {
  const parts = VDL.reportParts;
  const rows = Object.entries(VDL.reportCoverage).map(([name, m]) => ({ name, score: sum(parts.map(p => m[p.id] ?? 0)), max: parts.length, missing: parts.filter(p => (m[p.id] ?? 0) === 0).map(p => p.name) }));
  return { rows, parts };
}
