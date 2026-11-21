// Kiểm thử migration tài khoản/credit bằng PGlite (Postgres WASM) với lược đồ auth giả lập.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const SQL = readFileSync(new URL("../supabase/migrations/20261121000000_hse_accounts_credits.sql", import.meta.url), "utf8");
const A = "00000000-0000-0000-0000-00000000000a", B = "00000000-0000-0000-0000-00000000000b", ADM = "00000000-0000-0000-0000-0000000000ad";

async function setup() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    insert into auth.users values ('${A}', 'a@x.vn'), ('${B}', 'b@x.vn'), ('${ADM}', 'admin@x.vn');`);
  await db.exec(SQL);
  await db.exec(`insert into public.hse_admins values ('${ADM}')`);
  return db;
}
const as = async (db: PGlite, uid: string, q: string, params: any[] = []) => {
  await db.exec(`select set_config('request.jwt.claim.sub', '${uid}', false)`);
  return (await db.query(q, params)).rows as any[];
};
const fails = async (p: Promise<any>, msg: string) => { await assert.rejects(p, (e: any) => String(e.message).includes(msg), msg); };

test("gói nạp: 100k=100, 200k=220, 300k=345, 400k=480, 500k=625 credit", async () => {
  const db = await setup(); const r = await db.query("select vnd, credits from public.hse_packages order by vnd");
  assert.deepEqual((r.rows as any[]).map(x => [x.vnd, x.credits]), [[100000, 100], [200000, 220], [300000, 345], [400000, 480], [500000, 625]]);
});
test("hồ sơ + ví tạo lười; số dư ban đầu 0; không gọi được khi chưa đăng nhập", async () => {
  const db = await setup(); await db.exec(`select set_config('request.jwt.claim.sub', '', false)`);
  await fails(db.query("select public.hse_me()"), "NOT_AUTHENTICATED");
  const me = (await as(db, A, "select public.hse_ensure_profile('Nguyễn A', '0900000000', 'Cty')"))[0].hse_ensure_profile;
  assert.equal(me.balance, 0); assert.equal(me.profile.full_name, "Nguyễn A"); assert.equal(me.is_admin, false);
});
test("nạp tiền: tạo yêu cầu → quản trị duyệt → cộng credit đúng gói, duyệt lần 2 bị chặn", async () => {
  const db = await setup(); await as(db, A, "select public.hse_ensure_profile('A')");
  const t = (await as(db, A, "select * from public.hse_create_topup(200000)"))[0];
  assert.equal(t.credits, 220); assert.match(t.memo, /^HSE[0-9A-F]{6}$/); assert.equal(t.status, "pending");
  await fails(as(db, A, "select public.hse_admin_decide_topup($1, true)", [t.id]), "FORBIDDEN");
  const r = (await as(db, ADM, "select public.hse_admin_decide_topup($1, true) as r", [t.id]))[0].r; assert.equal(r.balance, 220);
  await fails(as(db, ADM, "select public.hse_admin_decide_topup($1, true)", [t.id]), "ALREADY_DECIDED");
  assert.equal((await as(db, A, "select balance from public.hse_wallets"))[0].balance, 220);
  await fails(as(db, A, "select * from public.hse_create_topup(123456)"), "INVALID_PACKAGE");
});
test("mã kích hoạt: dùng một lần, không dùng lại, sai quá 5 lần bị khóa", async () => {
  const db = await setup(); await as(db, A, "select public.hse_ensure_profile('A')"); await as(db, B, "select public.hse_ensure_profile('B')");
  const codes = (await as(db, ADM, "select * from public.hse_admin_create_codes(2, 50, 'thử', 30)")).map(r => r.hse_admin_create_codes);
  assert.equal(codes.length, 2); assert.match(codes[0], /^HSE-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
  const ok = (await as(db, A, "select public.hse_redeem_code($1) as r", [codes[0].toLowerCase() + " "]))[0].r; assert.equal(ok.balance, 50);
  assert.equal((await as(db, B, "select public.hse_redeem_code($1) as r", [codes[0]]))[0].r.error, "INVALID_CODE");
  for (let i = 0; i < 4; i++) assert.equal((await as(db, B, "select public.hse_redeem_code('SAI') as r"))[0].r.error, "INVALID_CODE");
  await fails(as(db, B, "select public.hse_redeem_code($1)", [codes[1]]), "TOO_MANY_ATTEMPTS");
  await fails(as(db, A, "select * from public.hse_admin_create_codes(1, 10)"), "FORBIDDEN");
});
test("mở khóa dịch vụ: thiếu credit bị chặn; trừ đúng giá một lần; mở lại trong thời hạn không trừ", async () => {
  const db = await setup(); await as(db, A, "select public.hse_ensure_profile('A')");
  await fails(as(db, A, "select public.hse_unlock_service('wwsim')"), "INSUFFICIENT_CREDIT");
  await as(db, ADM, "select public.hse_admin_adjust($1, 100, 'thử')", [A]);
  const r1 = (await as(db, A, "select public.hse_unlock_service('wwsim') as r"))[0].r; assert.equal(r1.charged, true); assert.equal(r1.balance, 90);
  const r2 = (await as(db, A, "select public.hse_unlock_service('wwsim') as r"))[0].r; assert.equal(r2.charged, false); assert.equal(r2.balance, 90);
  const led = await as(db, A, "select delta, balance_after from public.hse_ledger order by id"); assert.deepEqual(led.map(x => [x.delta, x.balance_after]), [[100, 100], [-10, 90]]);
  await fails(as(db, A, "select public.hse_unlock_service('khong_co')"), "SERVICE_NOT_FOUND");
  await db.exec(`update public.hse_passes set expires_at = now() - interval '1 minute'`);
  const r3 = (await as(db, A, "select public.hse_unlock_service('wwsim') as r"))[0].r; assert.equal(r3.charged, true); assert.equal(r3.balance, 80);
});
test("điều chỉnh của quản trị cần lý do; số dư không âm", async () => {
  const db = await setup(); await as(db, A, "select public.hse_ensure_profile('A')");
  await fails(as(db, ADM, "select public.hse_admin_adjust($1, 10, '')", [A]), "REASON_REQUIRED");
  await fails(as(db, ADM, "select public.hse_admin_adjust($1, -5, 'trừ')", [A]), "balance");
});
test("huấn luyện 15 phút: nộp sớm bị chặn (đo bằng giờ máy chủ); sau đủ giờ + đủ điểm mới mở 3D", async () => {
  const db = await setup(); await as(db, A, "select public.hse_ensure_profile('A')"); await as(db, ADM, "select public.hse_admin_adjust($1, 100, 'thử')", [A]);
  await fails(as(db, A, "select public.hse_unlock_service('sim3d')"), "INDUCTION_REQUIRED");
  const st = (await as(db, A, "select public.hse_induction_start() as r"))[0].r; assert.equal(st.required_seconds, 900);
  const good = { 1: 1, 2: 1, 3: 1, 4: 0, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1 };
  await fails(as(db, A, "select public.hse_induction_submit($1, $2::jsonb)", [st.attempt_id, JSON.stringify(good)]), "TOO_FAST");
  await db.exec(`update public.hse_induction_attempts set started_at = now() - interval '16 minutes'`);
  const bad = { ...good, 1: 0, 2: 0, 3: 0 };
  const rb = (await as(db, A, "select public.hse_induction_submit($1, $2::jsonb) as r", [st.attempt_id, JSON.stringify(bad)]))[0].r;
  assert.equal(rb.passed, false); assert.equal(rb.score, 7); assert.deepEqual(rb.wrong, [1, 2, 3]);
  await fails(as(db, A, "select public.hse_unlock_service('sim3d')"), "INDUCTION_REQUIRED");
  const st2 = (await as(db, A, "select public.hse_induction_start() as r"))[0].r; assert.notEqual(st2.attempt_id, st.attempt_id);
  await db.exec(`update public.hse_induction_attempts set started_at = now() - interval '20 minutes' where finished_at is null`);
  const rg = (await as(db, A, "select public.hse_induction_submit($1, $2::jsonb) as r", [st2.attempt_id, JSON.stringify(good)]))[0].r;
  assert.equal(rg.passed, true); assert.equal(rg.score, 10);
  const u = (await as(db, A, "select public.hse_unlock_service('sim3d') as r"))[0].r; assert.equal(u.charged, true); assert.equal(u.balance, 85);
  await fails(as(db, A, "select public.hse_induction_submit($1, '{}'::jsonb)", [st2.attempt_id]), "ATTEMPT_NOT_FOUND");
});
test("quản trị xem danh sách người dùng có email; người thường bị chặn", async () => {
  const db = await setup(); await as(db, A, "select public.hse_ensure_profile('Nguyễn A')");
  const rows = await as(db, ADM, "select * from public.hse_admin_users('')"); assert.ok(rows.some(r => r.email === "a@x.vn" && r.balance === 0));
  await fails(as(db, A, "select * from public.hse_admin_users('')"), "FORBIDDEN");
});
