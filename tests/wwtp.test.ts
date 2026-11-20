import test from "node:test";
import assert from "node:assert/strict";
import { createWw, stepWw, settle, setInfluent, STAGES, STANDARDS, exceedances, mixRiver, Q_DESIGN } from "../src/sim/wwtp.ts";

test("bảo toàn lưu lượng: ổn định thì Q ra = Q vào", () => {
  const s = createWw("retro", "typical"); settle(s, 100);
  assert.ok(Math.abs(s.out.q - Q_DESIGN) / Q_DESIGN < 0.05 || s.out.q === 0, String(s.out.q));
  assert.ok(Math.abs(s.tanks[s.tanks.length - 1].q - Q_DESIGN) < 0.3);
});
test("tải nhẹ sau cải tạo đạt QCVN 40 tại đầu ra, van xả mở", () => {
  const s = createWw("retro", "light"); settle(s, 120);
  assert.deepEqual(exceedances(s.out.c, STANDARDS.qcvn40), []); assert.equal(s.ctl.valveOpen, true);
});
test("tải điển hình: sau cải tạo xử lý NH4 tốt hơn hiện hữu", () => {
  const a = createWw("retro", "typical"), b = createWw("exist", "typical"); settle(a, 120); settle(b, 120);
  assert.ok(a.out.c.nh4 < b.out.c.nh4 * 0.5, `${a.out.c.nh4} vs ${b.out.c.nh4}`);
});
test("hỏng máy thổi khí: DO về 0, NH4 đầu ra tăng, van xả tự đóng", () => {
  const s = createWw("retro", "typical"); settle(s, 100); const before = s.out.c.nh4;
  s.ctl.blowerFail = true; settle(s, 40);
  const aer = STAGES.retro.findIndex(x => x.id === "B09");
  assert.ok(s.tanks[aer].c.do < 0.5); assert.ok(s.tanks[s.tanks.length - 1].c.nh4 > before + 10); assert.equal(s.ctl.valveOpen, false);
});
test("ngừng bơm WP04: mực nước B04 dâng, tràn, dòng phía sau về 0", () => {
  const s = createWw("retro", "typical"); settle(s, 20); s.ctl.wp.WP04 = false; settle(s, 20);
  const i = STAGES.retro.findIndex(x => x.id === "B04");
  assert.ok(s.tanks[i].level >= 0.99); assert.ok(s.spill > 0); assert.ok(s.tanks[i].q === 0);
});
test("mất châm PAC làm giảm hiệu quả lắng hóa lý (TP, TSS ra cao hơn)", () => {
  const a = createWw("retro", "typical"), b = createWw("retro", "typical"); b.ctl.pac = false; settle(a, 100); settle(b, 100);
  const i = STAGES.retro.findIndex(x => x.id === "B06");
  assert.ok(b.tanks[i].c.tp > a.tanks[i].c.tp * 1.3, `${b.tanks[i].c.tp} vs ${a.tanks[i].c.tp}`);
});
test("sốc pH 12: hiệu chỉnh pH chỉ giảm tối đa ~1,5 nên pH ra còn cao, vượt chuẩn pH", () => {
  const s = createWw("retro", "typical"); settle(s, 60); setInfluent(s, "phshock"); settle(s, 40);
  assert.ok(s.out.c.ph > 9, String(s.out.c.ph));
});
test("chất chỉ thị xuất hiện dần theo chuỗi bể và có độ trễ", () => {
  const s = createWw("retro", "typical"); settle(s, 100);
  s.inf.tracer = 100; s.tracerUntil = s.t + 0.5; for (let i = 0; i < 100; i++) stepWw(s, 0.01); // 1 h
  assert.ok(s.tanks[0].c.tracer > 1); assert.ok(s.tanks[s.tanks.length - 1].c.tracer < 0.5);
});
test("pha loãng sông bảo toàn khối lượng", () => {
  const c = { cod: 80, bod: 0, tss: 0, nh4: 5, tn: 0, tp: 0, coli: 0, ph: 7, do: 0, tracer: 0 };
  const r = mixRiver(5, c, 10, { nh4: 0.3, cod: 10, tss: 30 });
  const qe = 5 / 3600; assert.ok(Math.abs(r.cod * (qe + 10) - (qe * 80 + 10 * 10)) < 1e-6); assert.ok(r.dilution > 7000);
});
test("tải điển hình sau cải tạo: van xả mở (T-N, T-P chỉ cảnh báo), hồ sự cố trống", () => {
  const s = createWw("retro", "typical"); settle(s, 50);
  assert.equal(s.ctl.valveOpen, true); assert.equal(s.pond.vol, 0); assert.ok(s.discharged > 100);
});
test("khởi động nóng: trạng thái đầu đã ổn định, chưa có xả/tràn", () => {
  const s = createWw("retro", "typical"); assert.equal(s.t, 0); assert.equal(s.discharged, 0); assert.ok(s.out.c.nh4 < 10);
});
