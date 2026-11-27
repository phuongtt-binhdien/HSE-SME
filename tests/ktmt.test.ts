import { test } from "node:test";
import assert from "node:assert/strict";
import { crossCheck, forecastVsActual, balanceCheck, impliedFactors, solutionsSummary, progress, ctrcnttTonnes, diffPct } from "../src/lib/ktmt.ts";
import { STAGES, OUTLINE_688, WASTE_AUDIT_STEPS } from "../src/data/ktmt.ts";

test("quy trình: 3 giai đoạn, id duy nhất, 9 bước kiểm toán rác", () => {
  const ids = STAGES.flatMap(s => s.steps.map(x => x.id));
  assert.equal(STAGES.length, 3);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(WASTE_AUDIT_STEPS.length, 9);
});

test("đối chiếu: 2024 điện, than khớp BC BVMT; 2023 lệch rõ", () => {
  const r = Object.fromEntries(crossCheck().map(x => [x.key, x]));
  assert.equal(r.kwh.d2024, 0);
  assert.equal(r.coal.d2024, 0);
  assert.ok(r.kwh.d2023! < -15 && r.kwh.flag);          // 6.811.767 vs 8.251.767
  assert.ok(Math.abs(r.water.d2023! + 37.1) < 0.2);      // 54.523 vs 86.748
  assert.ok(r.ww.d2023! < -60);                          // 6.240 vs 18.000
  assert.equal(r.kwh.knk2023, 8310100);
  assert.equal(r.coal.knk2023, 3538.6);
});

test("CTRCNTT theo BC BVMT 2024 ≈ 5.444 t (khác 7.346 t trong kế hoạch)", () => {
  assert.ok(Math.abs(ctrcnttTonnes("y2024") - 5444.309) < 0.01);
  const x = crossCheck().find(c => c.key === "ctrcntt")!;
  assert.ok(x.d2024! > 30 && x.flag);
});

test("dự báo vs thực tế 2025", () => {
  const r = Object.fromEntries(forecastVsActual().map(x => [x.key, x]));
  assert.equal(r.prod.status, "below");   // 450.985 < 473.540
  assert.equal(r.kwh.status, "in");       // dự báo điểm 11 tr ±10 %: 9.913.473 ≥ 9,9 tr
  assert.equal(r.coal.status, "below");   // 4.594 < 4.800
  assert.equal(r.oil.status, "above");    // 104.000 lít > 99.000
  assert.equal(r.ctrsh.status, "above");  // 85,5 > 80
  assert.equal(r.ctnh.status, "above");   // 1,04 > 1,0 (khoảng 0,8–1,0)
  assert.equal(r.co2.status, "na");
  assert.equal(r.kwh.pointForecast, true);
});

test("cân bằng vật chất [B]: tổng đầu vào ghi 650.691,5 nhưng cộng ra 650.741,5", () => {
  const b = balanceCheck();
  assert.equal(b.inSum, 650741.5);
  assert.equal(b.inDiff, 50);
  assert.equal(b.outSum, 5913900);
  assert.equal(b.outDiff, 0);
  assert.ok(Math.abs(b.materialLossPct - 1) < 1e-9);
  assert.ok(b.outInRatio > 9);              // đầu ra gấp ~9 lần đầu vào do khí thải 5,4 triệu t
  assert.ok(Math.abs(b.solidsOut - 7875.9) < 1e-9);
  assert.equal(b.waterUnaccounted, 85700);
});

test("hệ số ngầm định: than 2,97 vs kiểm kê KNK 2023 ≈ 2,62", () => {
  const f = impliedFactors();
  assert.ok(Math.abs(f.coalPlan - 2.97) < 1e-9);
  assert.ok(Math.abs(f.coalKnk2023 - 2.6246) < 0.001);
  assert.ok(Math.abs(f.oilPlan - 2.614) < 0.001);
  assert.ok(Math.abs(f.co2Sum - 14604.47) < 0.01);   // 14.404,5 + 199,97; [B] ghi ~14.700
});

test("giải pháp: tổng chi phí 265 triệu khớp; CO₂e 790,6; hoàn vốn than theo đơn giá nhập", () => {
  const s = solutionsSummary();
  assert.equal(s.costM, 265);
  assert.equal(s.costStatedOk, true);
  assert.ok(Math.abs(s.co2e - 790.6) < 1e-9);
  assert.equal(s.coalPaybackYears, null);
  const s2 = solutionsSummary(2_000_000);          // 250 t × 2 triệu = 500 triệu/năm
  assert.equal(s2.coalSavingM, 500);
  assert.ok(Math.abs(s2.coalPaybackYears! - 0.24) < 1e-9);
  const water = s.rows[0];
  assert.ok(Math.abs(water.kgPerUnit! - 5.267) < 0.01);   // 31,6 t / 6.000 m³ — cao bất thường
  assert.ok(Math.abs(s.rows[1].kgPerUnit! - 2970) < 1e-6); // 742,5 t / 250 t than = 2,97 t/t
});

test("tiến độ checklist & đề cương 688", () => {
  const p = progress({ pre1: true, pre2: true, on1: true });
  assert.equal(p[0].done, 2); assert.equal(p[1].done, 1); assert.equal(p[2].done, 0);
  assert.equal(diffPct(110, 100), 10);
  assert.equal(diffPct(null, 100), null);
  assert.ok(OUTLINE_688.every(o => ["ok", "part", "gap"].includes(o.status)));
  assert.ok(OUTLINE_688.some(o => o.status === "gap"));
});

import { audit2024Check, pl1Check } from "../src/lib/ktmt.ts";
import { SUBMITTED, INCONSISTENCIES } from "../src/data/ktmt.ts";

test("Báo cáo KTMT 2024 [I]: số học cân bằng khớp, dòng khí thải suy ra 360.000 m³/h × 8.640 h × 1,5", () => {
  const a = audit2024Check();
  assert.ok(Math.abs(a.inSum - 553229.81) < 1e-6 && Math.abs(a.inDiff) < 1e-6);
  assert.ok(Math.abs(a.outSum - 5102795.46) < 1e-6 && Math.abs(a.outDiff) < 1e-6);
  assert.ok(Math.abs(a.gapDiff) < 1e-6);                  // chênh lệch 4.549.565,65 đúng
  assert.equal(a.flueSum, 4665600);
  assert.equal(a.flueRebuilt, 4665600);
  assert.ok(Math.abs(a.bcHours - 4522.2) < 0.1);          // BC BVMT dùng ~4.522 giờ cho cùng lưu lượng
  assert.ok(Math.abs(a.efficiency - 99.22) < 0.01);
  assert.ok(Math.abs(a.fluePct - 91.43) < 0.01);          // báo cáo ghi 91,5
  assert.ok(Math.abs(a.sec.kWhPerT - 22.96) < 0.01);
  assert.ok(Math.abs(a.coalFactor - 2.97) < 1e-5);
  assert.ok(Math.abs(a.oilFactor - 2.614) < 0.001);
  assert.ok(Math.abs(a.airDiff + 383) < 1e-9);            // 41.783 + 834 = 42.617 (ghi 43.000)
  assert.ok(Math.abs(a.ctrcntt - 7346.43) < 1e-6);
  assert.ok(Math.abs(a.reusePct - 72.06) < 0.01);
  assert.ok(Math.abs(a.ctrshDiff + 0.05) < 1e-9);         // 260 kg × 289 = 75,14 t (ghi 75,19)
  assert.ok(Math.abs(a.ctnh - 0.858) < 1e-9);             // 71,5 × 12 = 858 kg (ghi 840 kg)
  assert.equal(a.solutionsCost, 160);                      // kiến nghị ghi 170 triệu
  assert.equal(a.costVsRecommend, -10);
  assert.equal(a.solutionsCo2e, 625);                      // khớp
});

test("Phụ lục 1 [G]: điện 2023 sát BC BVMT và KNK; KNK nháp lệch bản chính thức; nước thải đầu vào vượt mô hình", () => {
  const p = pl1Check();
  assert.equal(p.kwh, 8342765);
  assert.ok(Math.abs(p.kwhDiffBc! - 1.1) < 0.05);
  assert.ok(Math.abs(p.kwhDiffKnk! - 0.4) < 0.05);
  assert.equal(p.products, 360000);
  assert.ok(p.productDiffBc! > 7.8 && p.productDiffBc! < 8);
  assert.ok(Math.abs(p.ghgSum - 9650.2719) < 1e-3 && Math.abs(p.ghgDiffStated) < 1e-3);
  assert.ok(Math.abs(p.ghgDiffFinal - 12.7439) < 1e-3);    // 9.650,27 − 9.637,53
  const tn = p.design.find(d => d.k === "TN")!, tp = p.design.find(d => d.k === "TP")!, cod = p.design.find(d => d.k === "COD")!;
  assert.deepEqual(tn.exceed, ["Đợt 2", "Đợt 4"]);
  assert.deepEqual(tp.exceed, ["Đợt 2", "Đợt 4"]);
  assert.deepEqual(cod.exceed, []);
  assert.ok(Math.abs(tn.removalNeededPct - 95.09) < 0.01);
  assert.ok(Math.abs(tn.removalModelPct - 70.59) < 0.01);
  assert.equal(p.elClosed, true);                          // 255 + 67 + 993 = 1.315
  assert.ok(Math.abs(p.plugPct - 75.5) < 0.1);
  assert.ok(Math.abs(p.nIn - 979.2) < 1e-9);
  assert.ok(Math.abs(p.bodLimitExpected - 39.6) < 1e-9);
});

test("đối chiếu có thêm cột Phụ lục 1; danh sách tài liệu và mâu thuẫn", () => {
  const r = Object.fromEntries(crossCheck().map(x => [x.key, x]));
  assert.equal(r.water.pl12023, 86748);
  assert.equal(r.ww.pl12023, 14400);
  assert.equal(r.coal.pl12023, 3563);
  assert.equal(SUBMITTED.length, 4);
  assert.ok(INCONSISTENCIES.length >= 8 && INCONSISTENCIES.every(i => ["red", "amber"].includes(i.sev)));
});
