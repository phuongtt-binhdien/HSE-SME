import test from "node:test";
import assert from "node:assert/strict";
import { airVariable, airQuarter, waterQuarter, airVolume, AIR_FIXED_YEAR } from "../src/lib/fees.ts";
import { AIR_STREAMS, AIR_QUARTERS } from "../src/data/fees.ts";

test("phí biến đổi khí thải: khớp 12 giá trị C trong thông báo 25439/TB-SNNMT (±2 đồng)", () => {
  for (const s of AIR_STREAMS) for (let k = 0; k < 2; k++) { const [dust, nox, sox, co] = s.q[k]; const c = airVariable({ volume: s.volume, dust, nox, sox, co }); assert.ok(Math.abs(c - s.decl[k]) <= 2, `${s.id} Q${k + 1}: ${c} vs ${s.decl[k]}`); assert.ok(Math.abs(c * 0.75 - s.appr[k]) <= 2); }
});
test("phí khí thải theo quý: F = f/4 + C; tổng sau thẩm định 1.536.858 đ", () => {
  let tot = 0;
  AIR_QUARTERS.forEach((qt, k) => { const streams = AIR_STREAMS.map(s => { const [dust, nox, sox, co] = s.q[k]; return { volume: s.volume, dust, nox, sox, co }; }); const d = airQuarter(streams), a = airQuarter(streams, true); assert.ok(Math.abs(d.F - qt.declared) <= 12 && Math.abs(a.F - qt.appraised) <= 12, `${qt.q} ${d.F}/${a.F}`); tot += a.F; });
  assert.ok(Math.abs(tot - 1_536_858) <= 24); assert.equal(AIR_FIXED_YEAR / 4, 750_000);
});
test("lượng khí thải khai = lưu lượng thiết kế × 1.152 h", () => { assert.equal(airVolume(25000), 28_800_000); assert.equal(airVolume(55000), 63_360_000); assert.equal(airVolume(140000), 161_280_000); });
test("phí nước thải: Quý I tờ khai 162.000 (TSS 0), thẩm định 211.140 (TSS 3,9), Quý II 196.380", () => {
  assert.equal(waterQuarter(3600, 15, 0), 162_000); assert.equal(waterQuarter(3600, 15, 3.9), 211_140); assert.equal(waterQuarter(3600, 12, 5.3), 196_380);
  assert.equal(211_140 + 196_380, 407_520);
});
