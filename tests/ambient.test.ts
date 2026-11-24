import test from "node:test";
import assert from "node:assert/strict";
import { AMBIENT_POINTS, AMBIENT_LIMIT_1H, backgroundPreset, AMBIENT_ISSUES } from "../src/data/ambient.ts";
import { screenWorstCase, emissionRateFromStack, normalFlow, exitVelocity, celsiusToK } from "../src/lib/gaussPlume.ts";

test("khoảng quan trắc hợp lệ (lo ≤ hi) và có giới hạn 1 giờ cho mọi thông số", () => {
  for (const p of AMBIENT_POINTS) for (const [k, r] of Object.entries(p.vals)) { assert.ok(AMBIENT_LIMIT_1H[k] > 0, k); if (!r.kph && r.lo != null && r.hi != null) assert.ok(r.lo <= r.hi, `${p.id}.${k}`); }
  assert.ok(AMBIENT_ISSUES.length >= 5);
});
test("nồng độ nền áp dụng: KPH tính 0, cận dưới ≤ cận trên", () => {
  const a = backgroundPreset("KK", "lo"), b = backgroundPreset("KK", "hi"), t = backgroundPreset("TINH", "hi");
  assert.equal(a.so2, 0); assert.equal(b.tsp, 401); assert.equal(a.tsp, 192); assert.ok(a.co <= b.co); assert.equal(t.nox, 70);
});
test("ống khói S01 (quan trắc 2026) đóng góp bụi mặt đất < 5 % bụi đo ở hàng rào (401 μg/m³)", () => {
  const flowA = 19636, tC = 86, src: any = { terrain: "rural", hs: 18, d: 0.7, vs: exitVelocity(flowA, 0.7), Ts: celsiusToK(tC), Ta: celsiusToK(30), riseMode: "final", windProfile: true, sigmaScheme: "pg", stackTipDownwash: true, mixingHeight: "screen3", z0: 0.3, riseScheme: "isc3" };
  const w = screenWorstCase(src, 1.5).worst, Q = emissionRateFromStack(19, normalFlow(flowA, tC, 25)), c = Q * w.cPerQ;
  assert.ok(c > 1 && c < 8, String(c)); assert.ok(c / 401 < 0.05);
});
