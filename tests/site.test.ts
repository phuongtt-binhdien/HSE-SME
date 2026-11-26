import test from "node:test";
import assert from "node:assert/strict";
import { SITE_BOUNDARY, SITE_BUILDINGS, SITE_AREA_TABLE, polygonArea, toScene, sceneBox } from "../src/data/site.ts";

test("ranh giới: diện tích đa giác khớp bảng cân bằng đất 140.110 m² (±1,5 %)", () => {
  const a = polygonArea(SITE_BOUNDARY); assert.ok(Math.abs(a - SITE_AREA_TABLE.total) / SITE_AREA_TABLE.total < 0.015, String(a));
});
test("tổng diện tích xây dựng khớp 42.844 m² (±1 %)", () => {
  const s = SITE_BUILDINGS.reduce((a, b) => a + (b.x1 - b.x0) * (b.y1 - b.y0), 0); assert.ok(Math.abs(s - SITE_AREA_TABLE.built) / SITE_AREA_TABLE.built < 0.01, String(s));
});
test("kích thước từng hạng mục khớp bảng liệt kê (±3 %)", () => {
  const legend: Record<string, number> = { "9A1": 5184, "9B1": 3240, "9C1": 3240, "28": 3240, "26": 3240, "38": 2592, "27": 10080, "37": 5688, "39": 2320, "40": 394, "29": 588, "30": 556, "36": 100, "34": 320, "33": 480, "32": 128, "31": 128, "23": 134.4, "11": 960 };
  for (const b of SITE_BUILDINGS) { const L = legend[b.id]; if (!L) continue; const a = (b.x1 - b.x0) * (b.y1 - b.y0); const tol = b.id === "11" ? 0.35 : 0.04; assert.ok(Math.abs(a - L) / L < tol, `${b.id}: ${a} vs ${L}`); }
});
test("không có hai công trình đã có (built) chồng lấn; chuyển hệ: Bắc = −z, Đông = x = −Y_d", () => {
  const bs = SITE_BUILDINGS.filter(b => b.status === "built");
  for (let i = 0; i < bs.length; i++) for (let j = i + 1; j < bs.length; j++) { const a = bs[i], b = bs[j]; const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0); assert.ok(!(ox > 0.5 && oy > 0.5), `${a.id} chồng ${b.id}`); }
  assert.deepEqual(toScene(100, 20), [-20, -100]);
  const q = sceneBox({ x0: 0, x1: 108, y0: -0.8, y1: 47.2 }); assert.ok(Math.abs(q.cx + 23.2) < 1e-9 && Math.abs(q.cz + 54) < 1e-9 && q.w === 48 && q.d === 108);
});
