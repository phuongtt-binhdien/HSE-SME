import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createSim, step, start, stop, canStart, presetRunning, runSequence, action, ack, injectFault, emergencyStop,
  START_ORDER, STOP_ORDER, EQUIP, EXERCISES, LIMITS, beginExercise, updateExercise, nextHint, CHAIN,
} from "../src/sim/plantSim.ts";

const run = (s: any, sec: number, dt = 1) => { for (let i = 0; i < sec / dt; i++) step(s, dt); };

test("Khóa liên động: không khởi động khi thiếu thiết bị hạ lưu; bỏ khóa thì cho phép", () => {
  const s = createSim();
  const r = canStart(s, "BT01");
  assert.equal(r.ok, false); assert.deepEqual(r.missing, ["MN01"]);
  assert.equal(start(s, "BT01").ok, false); assert.equal(s.mistakes, 1);
  assert.equal(canStart(s, "QH01").ok, false);      // cần LB01 và HT01
  s.bypass = true; assert.equal(canStart(s, "BT01").ok, true);
});

test("Hai lò hơi không vận hành đồng thời (cam kết GPMT)", () => {
  const s = createSim(); assert.equal(start(s, "LH01").ok, true);
  const r = start(s, "LH02"); assert.equal(r.ok, false); assert.match(r.reason!, /đồng thời/);
  s.bypass = true; assert.equal(canStart(s, "LH02").ok, false); // bỏ khóa cũng không được
});

test("Khởi động tự động theo trình tự chuẩn đưa dây chuyền về trạng thái ổn định, không dừng liên động", () => {
  const s = createSim(); runSequence(s, "start"); run(s, 120);
  for (const id of START_ORDER) assert.equal(s.eq[id].on, true, id);
  assert.equal(s.events.filter(e => e.kind === "trip").length, 0);
  run(s, 600);
  assert.ok(s.pv.dp > 150 && s.pv.dp < LIMITS.dp, `dp ${s.pv.dp}`);
  assert.ok(s.pv.dryerOut > 70 && s.pv.dryerOut < 100, `out ${s.pv.dryerOut}`);
  assert.ok(s.pv.nh3 < LIMITS.nh3 && s.pv.tsp < LIMITS.tsp);
  assert.ok(Math.abs(s.pv.tph - 20) < 0.5);
  assert.equal(s.alarms.filter(a => a.level === "crit").length, 0);
});

test("Dừng khi đã chạy: thiết bị phía thượng lưu dừng liên động theo dây chuyền", () => {
  const s = createSim(); presetRunning(s); stop(s, "DB01"); step(s, 1);
  for (const id of CHAIN) assert.equal(s.eq[id].on, false, id);
  assert.ok(s.eq.BT01.tripped); assert.match(s.eq.BT01.reason, /Mất/);
  assert.equal(s.eq.QH01.on, true);
});

test("Mất quạt hút làm dừng lò đốt, thùng sấy, thùng làm nguội", () => {
  const s = createSim(); presetRunning(s); stop(s, "QH01"); step(s, 1);
  for (const id of ["LD01", "SY01", "LN01"]) assert.equal(s.eq[id].on, false, id);
});

test("Dừng tự động theo trình tự chuẩn: không có dừng liên động, thùng sấy chỉ dừng khi < 60 °C", () => {
  const s = createSim(); presetRunning(s); runSequence(s, "stop"); run(s, 400);
  for (const id of STOP_ORDER) assert.equal(s.eq[id].on, false, id);
  assert.equal(s.events.filter(e => e.kind === "trip").length, 0);
  const sy = s.events.find(e => e.kind === "stop" && e.id === "SY01")!; assert.ok(sy.info!.dryerOut <= 60, `${sy.info!.dryerOut}`);
});

test("ΔP túi lọc ổn định ở vận hành bình thường; bết túi thì tăng và dừng liên động sau 30 giây trên 300", () => {
  const s = createSim(); presetRunning(s); run(s, 900);
  assert.ok(s.pv.dp < LIMITS.dp, `${s.pv.dp}`);
  injectFault(s, "bagBlind"); run(s, 1200);
  assert.ok(s.eq.LB01.tripped || s.pv.dp > LIMITS.dp, `${s.pv.dp}`);
  assert.equal(s.eq.QH01.on, false);
});

test("Rũ bụi giảm ΔP và xóa lỗi bết túi", () => {
  const s = createSim(); presetRunning(s); injectFault(s, "bagBlind"); run(s, 60);
  const before = s.pv.dp; action(s, "LB01", "pulse"); run(s, 20);
  assert.ok(s.pv.dp < before - 30, `${before} → ${s.pv.dp}`); assert.equal(s.faults.bagBlind, false);
});

test("Tháp hấp thụ yếu → NH₃ vượt 40 mg/Nm³ và báo động; thay dung dịch thì hết", () => {
  const s = createSim(); presetRunning(s); injectFault(s, "scrubWeak"); run(s, 30);
  assert.ok(s.pv.nh3 > LIMITS.nh3); assert.ok(s.alarms.some(a => a.id === "nh3"));
  action(s, "HT01", "recharge"); run(s, 40); assert.ok(s.pv.nh3 < LIMITS.nh3);
});

test("Thổi khí hỏng → DO giảm, nước thải vượt chuẩn, van xả tự đóng; chuyển dự phòng thì mở lại", () => {
  const s = createSim(); presetRunning(s); injectFault(s, "blowerFail"); run(s, 600);
  assert.ok(s.pv.DO < LIMITS.DOmin); assert.equal(s.pv.discharge, false);
  action(s, "TK01", "swap"); start(s, "TK01"); run(s, 900);
  assert.ok(s.pv.DO >= LIMITS.DOmin); assert.equal(s.pv.discharge, true);
});

test("Bỏ khóa liên động: lò đốt chạy khi thùng sấy không quay gây quá nhiệt", () => {
  const s = createSim(); s.bypass = true; start(s, "QH01"); start(s, "LD01"); run(s, 200);
  assert.ok(s.pv.dryerIn > LIMITS.dryerIn); assert.ok(s.alarms.some(a => a.id === "dryin"));
});

test("Dừng khẩn cấp dừng khu sản xuất, giữ cyclone thụ động và HTXLNT chạy liên tục", () => {
  const s = createSim(); presetRunning(s); emergencyStop(s);
  assert.ok(EQUIP.filter(e => !["XC01", "CC01"].includes(e.id) && e.zone !== "wwtp").every(e => !s.eq[e.id].on));
  assert.ok(["BM01", "TK01", "DL01"].every(id => s.eq[id].on));
});

test("Gợi ý thao tác kế tiếp khi khởi động", () => {
  const s = createSim(); assert.equal(nextHint(s)!.id, "HT01"); start(s, "HT01"); assert.equal(nextHint(s)!.id, "LB01");
});

test("Bài tập 1 giải được bằng thao tác đúng thứ tự, 0 lỗi", () => {
  const ex = EXERCISES[0]; const { sim, run: r0 } = beginExercise(createSim(), ex); let r = r0;
  for (const id of START_ORDER) { assert.equal(start(sim, id).ok, true, id); run(sim, 4); r = updateExercise(sim, ex, r); }
  run(sim, 400); r = updateExercise(sim, ex, r);
  assert.equal(r.finished, true, JSON.stringify(r)); assert.equal(sim.mistakes, 0);
});

test("Bài tập 2: dừng đúng thứ tự hoàn thành; dừng sai (QH01 trước) bị tính lỗi", () => {
  const ex = EXERCISES[1];
  let { sim, run: r } = beginExercise(createSim(), ex);
  for (const id of ["BT01", "MN01", "BT02", "SG01", "TR01", "TH01", "BT03", "LD01"]) { stop(sim, id); run(sim, 3); r = updateExercise(sim, ex, r); }
  run(sim, 200); r = updateExercise(sim, ex, r);
  for (const id of ["QT01", "SY01", "LN01", "SG02", "BT04", "DB01", "QH01", "LB01", "HT01"]) { stop(sim, id); run(sim, 3); r = updateExercise(sim, ex, r); }
  assert.equal(r.finished, true, JSON.stringify(r));
  const b = beginExercise(createSim(), ex); stop(b.sim, "QH01"); step(b.sim, 1); const rb = updateExercise(b.sim, ex, b.run);
  assert.ok(rb.failed, "dừng quạt trước phải thất bại");
});

test("Bài tập 3, 4, 5 giải được; bỏ qua thì thất bại hoặc chưa xong", () => {
  { const ex = EXERCISES[2]; const b = beginExercise(createSim(), ex); let r = b.run; const s = b.sim; run(s, 3);
    ack(s); action(s, "LB01", "pulse"); run(s, 30); r = updateExercise(s, ex, r); assert.equal(r.finished, true, JSON.stringify(r)); }
  { const ex = EXERCISES[2]; const b = beginExercise(createSim(), ex); run(b.sim, 400); assert.ok(updateExercise(b.sim, ex, b.run).failed, "không xử lý → dừng liên động"); }
  { const ex = EXERCISES[3]; const b = beginExercise(createSim(), ex); const s = b.sim; let r = b.run; run(s, 3);
    ack(s); stop(s, "BT01"); action(s, "HT01", "recharge"); run(s, 60); start(s, "BT01"); run(s, 3); r = updateExercise(s, ex, r); assert.equal(r.finished, true, JSON.stringify(r)); }
  { const ex = EXERCISES[4]; const b = beginExercise(createSim(), ex); const s = b.sim; let r = b.run; run(s, 3);
    ack(s); action(s, "TK01", "swap"); start(s, "TK01"); run(s, 1500); r = updateExercise(s, ex, r); assert.equal(r.finished, true, JSON.stringify(r)); }
});

import { computePlume, windVector, sourcesFromSim, makeConcFn } from "../src/sim/plume.ts";
import { maxOnCenterline, buildModel } from "../src/lib/gaussPlume.ts";

test("Vệt khói: gió từ Tây thổi về Đông (+x); không có nồng độ ngược gió; cực đại khớp mô hình một nguồn", () => {
  const v = windVector(270); assert.ok(Math.abs(v.wx - 1) < 1e-9 && Math.abs(v.wz) < 1e-9);
  const src = { id: "T", x: 0, z: 0, hs: 18, d: 0.7, vs: 14.2, Ts: 359.15, Q: { tsp: 1, no2: 1, nh3: 1 } };
  const p = { sources: [src], pol: "no2" as const, u10: 3, stability: "C" as const, windFromDeg: 270 };
  const f = makeConcFn(p);
  assert.equal(f(-100, 0), 0); assert.ok(f(300, 0) > 0); assert.ok(Math.abs(f(300, 20) - f(300, -20)) < 1e-9);
  const g = computePlume(p, 120, 450);
  assert.ok(g.maxX > 0 && Math.abs(g.maxZ) < 15);
  const m = buildModel({ Q: 1, u10: 3, stability: "C", terrain: "rural", hs: 18, d: 0.7, vs: 14.2, Ts: 359.15, Ta: 303.15, riseMode: "final", windProfile: true, mixingHeight: "screen3" });
  const mx = maxOnCenterline(m, 1.5);
  assert.ok(Math.abs(g.max - mx.c) / mx.c < 0.12, `${g.max} vs ${mx.c}`);
  assert.ok(Math.abs(g.maxX - mx.x) < 20);
  // Gió từ Bắc thổi về Nam (+z)
  const fN = makeConcFn({ ...p, windFromDeg: 0 }); assert.ok(fN(0, 300) > 0 && fN(0, -300) === 0);
});

test("Nguồn phát thải theo trạng thái nhà máy: quạt hút tắt thì ống khói sấy không phát; lò hơi sinh khối/than chọn đúng", () => {
  const s = createSim(); presetRunning(s);
  let src = sourcesFromSim(s.eq, s.pv);
  assert.ok(src[1].Q.tsp > 0 && src[0].Q.no2 > 0.5);        // sinh khối
  s.eq.LH01.on = false; s.eq.LH01.load = 0; s.eq.LH02.on = true; s.eq.LH02.load = 1;
  src = sourcesFromSim(s.eq, s.pv); assert.ok(Math.abs(src[0].Q.no2 - 0.154) < 1e-9);
  s.eq.QH01.load = 0; src = sourcesFromSim(s.eq, s.pv); assert.equal(src[1].Q.tsp, 0);
});
