import test from "node:test";
import assert from "node:assert/strict";
import { createWw, stepWw, settle } from "../src/sim/wwtp.ts";
import { exceedances, STANDARDS } from "../src/sim/wwtp.ts";
import { pv, newRun, updateAlarms, ackAll, CHALLENGES, startChallenge, tickChallenge } from "../src/sim/dcs.ts";

const run = (s: any, r: any, hours: number, hook?: (t: number) => void) => { const n = Math.round(hours / 0.01); for (let i = 0; i < n; i++) { stepWw(s, 0.01); updateAlarms(r, s); if (r.challenge) tickChallenge(r, s); hook?.(s.t); } };

test("PID DO (AIC-901): bám SP 2,5 mg/L và đổi SP thì theo SP mới; chế độ MAN giữ OUT", () => {
  const s = createWw("retro", "typical"); settle(s, 40); assert.ok(Math.abs(pv(s, "AIT-901") - 2.5) < 0.25, String(pv(s, "AIT-901")));
  s.ctl.doLoop.sp = 3.5; settle(s, 40); assert.ok(Math.abs(pv(s, "AIT-901") - 3.5) < 0.3, String(pv(s, "AIT-901")));
  s.ctl.doLoop.mode = "MAN"; s.ctl.doLoop.out = 0.3; const o = s.ctl.doLoop.out; settle(s, 20); assert.equal(s.ctl.doLoop.out, o); assert.ok(pv(s, "AIT-901") < 3.5);
});
test("PID pH (AIC-501): giữ pH bể keo tụ gần SP 7,2; MAN không bù", () => {
  const s = createWw("retro", "typical"); settle(s, 30); assert.ok(Math.abs(pv(s, "AIT-501") - 7.2) < 0.15, String(pv(s, "AIT-501")));
  const m = createWw("retro", "typical"); m.ctl.phLoop.mode = "MAN"; m.ctl.phLoop.out = 0; settle(m, 30); assert.ok(Math.abs(pv(m, "AIT-501") - 7.1) < 0.15, String(pv(m, "AIT-501")));
});
test("báo động: máy thổi khí hỏng sinh P1, ghi nhận, rồi trở về bình thường khi khắc phục", () => {
  const s = createWw("retro", "typical"), r = newRun(); run(s, r, 1); assert.equal(Object.keys(r.active).length, 0);
  s.ctl.blowerFail = true; run(s, r, 6); assert.ok(r.active["AB-A:FAIL"] && r.active["AB-A:FAIL"].pri === 1); assert.ok(Object.keys(r.active).some(k => k.startsWith("AIT-901:")));
  ackAll(r, s); assert.ok(Object.values(r.active).every(a => a.acked)); s.ctl.blowerB = true; run(s, r, 20); assert.ok(r.journal.some(j => j.kind === "RTN"));
});
test("thử thách 1 (sốc pH): không làm gì → KHÔNG ĐẠT; đóng van đúng lúc rồi mở lại → ĐẠT", () => {
  const c = CHALLENGES[0]; { const r = newRun(), s = startChallenge(r, c); run(s, r, 72); assert.equal(r.challenge!.state, "fail"); }
  const r = newRun(), s = startChallenge(r, c); let closed = false, reopened = false, peaked = false;
  run(s, r, 72, t => { if (pv(s, "AIT-1301") > 9) peaked = true; if (!closed && Math.abs(pv(s, "AIT-501") - 7.2) > 1.5) { s.ctl.valveOpen = false; closed = true; } if (closed && !reopened && peaked && exceedances(s.tanks[s.tanks.length - 1].c, STANDARDS.qcvn40).filter(x => ["pH", "COD", "NH₄⁺", "TSS"].includes(x)).length === 0) { s.ctl.valveOpen = true; reopened = true; } });
  assert.ok(closed); assert.equal(r.challenge!.state, "pass", r.challenge!.text);
});
test("thử thách 2 (máy thổi khí): bật máy B → ĐẠT; bỏ mặc → KHÔNG ĐẠT", () => {
  const c = CHALLENGES[1]; { const r = newRun(), s = startChallenge(r, c); run(s, r, 48); assert.equal(r.challenge!.state, "fail"); }
  const r = newRun(), s = startChallenge(r, c); let on = false, ropen = false;
  run(s, r, 48, t => { if (!on && t > 1.2) { s.ctl.blowerB = true; on = true; } if (on && !ropen && t > 20 && pv(s, "AIT-1303") < 6.5) { s.ctl.valveOpen = true; ropen = true; } });
  assert.equal(r.challenge!.state, "pass", r.challenge!.text);
});
test("thử thách 3 (WP04): chạy lại bơm → ĐẠT; bỏ mặc → tràn → KHÔNG ĐẠT", () => {
  const c = CHALLENGES[2]; { const r = newRun(), s = startChallenge(r, c); run(s, r, 24); assert.equal(r.challenge!.state, "fail"); }
  const r = newRun(), s = startChallenge(r, c); run(s, r, 24, t => { if (t > 0.8) s.ctl.wp.WP04 = true; }); assert.equal(r.challenge!.state, "pass", r.challenge!.text);
});
test("thử thách 4 (PAC): khôi phục trong 6 giờ → ĐẠT; không → KHÔNG ĐẠT", () => {
  const c = CHALLENGES[3]; { const r = newRun(), s = startChallenge(r, c); run(s, r, 8); assert.equal(r.challenge!.state, "fail"); }
  const r = newRun(), s = startChallenge(r, c); run(s, r, 36, t => { if (t > 2) { s.ctl.pac = true; s.ctl.pacDose = 50; } }); assert.equal(r.challenge!.state, "pass", r.challenge!.text);
});
