import test from "node:test";
import assert from "node:assert/strict";
import { createGas, stepGas, ph, UNITS, CHALLENGES, startChallenge, tickChallenge, setFeed, fan, replaceBags, pulse, restoreAir, primeNaoh, inject, DP_H } from "../src/sim/gas.ts";

const run = (g: any, sec: number, hook?: (t: number) => void, r?: any) => { for (let i = 0; i < sec; i++) { stepGas(g, 1); if (r) tickChallenge(g, r); hook?.(g.t); } };
const play = (id: string, hook: (g: any, t: number) => void) => { const c = CHALLENGES.find(x => x.id === id)!; const { g, run: r } = startChallenge(id); for (let i = 0; i < c.minutes * 60 && r.state === "run"; i++) { stepGas(g, 1); tickChallenge(g, r); hook(g, g.t - r.startT); } return r; };

test("trạng thái nền: 7 dòng thải đều đạt giới hạn GPMT, không báo động", () => {
  const g = createGas(); run(g, 1200);
  for (const d of UNITS) { const u = g.u[d.id]; assert.ok(u.dust < d.lim.dust * 0.85, `${d.id} bụi ${u.dust}`); if (d.lim.so2) assert.ok(u.so2 < d.lim.so2); if (d.lim.nh3) assert.ok(u.nh3 < d.lim.nh3); }
  assert.equal(Object.keys(g.alarms).length, 0, Object.keys(g.alarms).join());
  assert.ok(ph(g.u.G01) > 6.5 && ph(g.u.G01) < 8.5);
});
test("PID pH tháp kiềm giữ SP 7,5 khi tải lò hơi thay đổi", () => {
  const g = createGas(); run(g, 600); setFeed(g, "G01", 0.5); run(g, 1500); const a = ph(g.u.G01); setFeed(g, "G01", 1); run(g, 2500); const b = ph(g.u.G01);
  assert.ok(Math.abs(a - 7.5) < 0.6 && Math.abs(b - 7.5) < 0.6, `${a} ${b}`);
});
test("chẩn đoán: rách túi → ΔP tụt, bụi tăng; bết túi (liệu ẩm, mất khí nén) → ΔP tăng, bụi thấp", () => {
  const g = createGas(); run(g, 600); const dp0 = g.u.G03.dp; inject(g, "G03", "bagTear"); run(g, 120);
  assert.ok(g.u.G03.dust > 160 && g.u.G03.dp < dp0 - 20, `${g.u.G03.dust} ${g.u.G03.dp}`);
  const h = createGas(); run(h, 600); inject(h, "G05", "airLoss"); inject(h, "G05", "wetFeed"); run(h, 150);
  assert.ok(h.u.G05.dp > dp0 + 40 && h.u.G05.dust < 160, `${h.u.G05.dp} ${h.u.G05.dust}`);
});
test("khóa liên động: lò hơi phải có bơm tuần hoàn trước quạt hút; túi quá bết thì không khởi động lại quạt", () => {
  const g = createGas(); fan(g, "G01", false); g.u.G01.pumpA = false; assert.equal(fan(g, "G01", true).ok, false);
  g.u.G04.dp = 340; g.u.G04.fanTrip = true; g.u.G04.fan = false; assert.equal(fan(g, "G04", true).ok, false);
});
test("thử thách 1 (rách túi): bỏ mặc → KHÔNG ĐẠT; dừng tải, thay túi, chạy lại → ĐẠT", () => {
  assert.equal(play("bag", () => {}).state, "fail");
  let stopped = false, replaced = false, restarted = false;
  const r = play("bag", (g, t) => { if (!stopped && g.u.G04.dust > 160) { setFeed(g, "G04", 0); stopped = true; } if (stopped && !replaced && g.u.G04.feed < 0.05) { replaced = replaceBags(g, "G04"); } if (replaced && !restarted) { setFeed(g, "G04", 1); restarted = true; } });
  assert.equal(r.state, "pass", r.text);
});
test("thử thách 2 (NaOH mất mồi): bỏ mặc → KHÔNG ĐẠT; mồi lại bơm → ĐẠT", () => {
  assert.equal(play("scrub", () => {}).state, "fail");
  let done = false; const r = play("scrub", (g, t) => { if (!done && t > 300) { primeNaoh(g, "G01"); done = true; } });
  assert.equal(r.state, "pass", r.text);
});
test("thử thách 3 (quạt trip): bỏ mặc → KHÔNG ĐẠT; giảm tải, chạy lại quạt, nâng tải → ĐẠT", () => {
  assert.equal(play("fan", () => {}).state, "fail");
  let s1 = false, s2 = false, s3 = false; const r = play("fan", (g, t) => { if (!s1 && t > 70) { setFeed(g, "G02", 0); s1 = true; } if (s1 && !s2 && t > 100) { s2 = fan(g, "G02", true).ok; } if (s2 && !s3 && t > 200) { setFeed(g, "G02", 1); s3 = true; } });
  assert.equal(r.state, "pass", r.text);
});
test("thử thách 4 (mất khí nén): bỏ mặc → KHÔNG ĐẠT; khôi phục khí nén + rũ bụi → ĐẠT", () => {
  assert.equal(play("dp", () => {}).state, "fail");
  let a = false; const r = play("dp", (g, t) => { if (!a && t > 120) { restoreAir(g, "G06"); pulse(g, "G06"); a = true; } });
  assert.equal(r.state, "pass", r.text);
});
test("trạng thái nền khớp kết quả quan trắc 2026 (bụi 13–19, SO₂ lò hơi 49–55, NH₃ < 2 mg/Nm³, lưu lượng ≈ 56–85 % thiết kế)", () => {
  const g = createGas(); run(g, 900);
  for (const id of ["G02", "G03", "G04", "G05", "G06"]) { const u = g.u[id]; assert.ok(u.dust >= 12 && u.dust <= 20, `${id} ${u.dust}`); assert.ok(u.nh3 < 2); }
  assert.ok(g.u.G01.so2 >= 45 && g.u.G01.so2 <= 60 && g.u.G01.dust >= 14 && g.u.G01.dust <= 20 && g.u.G01.nox >= 25 && g.u.G01.nox <= 36);
  assert.ok(Math.abs(g.u.G06.flow - 78400) < 1500);
});
