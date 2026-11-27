import test from "node:test";
import assert from "node:assert/strict";
import { crc16, vietQrPayload } from "../src/auth/vietqr.ts";
test("CRC16/CCITT-FALSE khớp vector chuẩn", () => { assert.equal(crc16("123456789"), "29B1"); });
test("chuỗi VietQR: có tag bắt buộc, số tiền, nội dung và CRC cuối đúng", () => {
  const p = vietQrPayload({ bin: "970422", account: "0123456789", amount: 100000, memo: "HSEAB12CD" });
  assert.ok(p.startsWith("000201010212")); assert.ok(p.includes("A000000727")); assert.ok(p.includes("QRIBFTTA")); assert.ok(p.includes("5406100000")); assert.ok(p.includes("5802VN")); assert.ok(p.includes("0809HSEAB12CD"));
  assert.equal(p.slice(-4), crc16(p.slice(0, -4))); assert.ok(p.slice(-8, -4) === "6304");
});
