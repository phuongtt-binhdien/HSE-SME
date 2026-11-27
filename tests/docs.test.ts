import test from "node:test";
import assert from "node:assert/strict";
import { daysUntil, reviewState, matches } from "../src/lib/docs.ts";
import { LEGAL_DOCS, INTERNAL_DOCS } from "../src/data/documents.ts";
test("hạn soát xét: ISO 14001 còn 30 ngày vào 24/11/2026", () => {
  const t = new Date(2026, 10, 24); assert.equal(daysUntil("2026-12-24", t), 30); assert.equal(reviewState("2026-12-24", t), "soon");
  assert.equal(reviewState("2026-11-01", t), "overdue"); assert.equal(reviewState("2027-12-01", t), "ok"); assert.equal(reviewState(undefined, t), "none");
});
test("tìm không dấu", () => { assert.ok(matches("Hướng dẫn quản lý chất thải nguy hại", "chat thai nguy")); assert.ok(!matches("Luật Hóa chất", "nuoc thai")); assert.ok(matches("Đóng quỹ", "dong quy")); });
test("dữ liệu: không trùng số hiệu, có đủ nhóm", () => {
  const nos = LEGAL_DOCS.map(d => d.no), codes = INTERNAL_DOCS.map(d => d.code);
  assert.equal(new Set(nos).size, nos.length); assert.equal(new Set(codes).size, codes.length);
  for (const a of ["Môi trường", "PCCC", "Hóa chất", "ATVSLĐ", "Xử phạt"]) assert.ok(LEGAL_DOCS.some(d => d.area === a), a);
  for (const d of INTERNAL_DOCS) if (d.reviewDue) assert.match(d.reviewDue, /^\d{4}-\d{2}-\d{2}$/);
});
