// Lớp truy cập dữ liệu tài khoản/credit. Hai cài đặt cùng giao diện:
//  - supabaseApi: Supabase Auth + các hàm hse_* (supabase/migrations) — bản chính thức;
//  - localApi: bản thử lưu trong localStorage (?backend=local) để demo và kiểm thử giao diện — KHÔNG an toàn, không dùng thu tiền thật.
import { BACKEND, useLocalBackend, fastInduction } from "./config.ts";

export interface Me { user_id: string; email: string; profile: { full_name: string; phone: string; company: string } | null; balance: number; is_admin: boolean; passes: { service_key: string; expires_at: string }[]; induction: { passed_at: string; expires_at: string; score: number; total: number } | null }
export interface Pkg { vnd: number; credits: number }
export interface Service { key: string; title: string; price: number; pass_hours: number; needs_induction: boolean; active: boolean; sort: number }
export interface Topup { id: number; user_id: string; vnd: number; credits: number; memo: string; status: string; created_at: string; email?: string }
export interface LedgerRow { id: number; delta: number; balance_after: number; reason: string; ref: string; created_at: string }
export interface Question { id: number; section: string; prompt: string; options: string[]; sort: number }
export interface AdminUser { user_id: string; email: string; full_name: string; phone: string; company: string; balance: number; created_at: string; induction_until: string | null; is_admin: boolean }
export interface CodeRow { code: string; credits: number; note: string; created_at: string; expires_at: string | null; used_by: string | null; used_at: string | null }

export interface Api {
  mode: "supabase" | "local";
  getUser(): Promise<{ id: string; email: string; meta: any } | null>;
  onAuth(cb: () => void): () => void;
  signUp(email: string, password: string, meta: { full_name: string; phone: string; company: string }): Promise<{ needsConfirm: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  ensureProfile(meta: { full_name?: string; phone?: string; company?: string }): Promise<Me>;
  me(): Promise<Me>;
  catalog(): Promise<{ packages: Pkg[]; services: Service[]; settings: Record<string, any> }>;
  createTopup(vnd: number): Promise<Topup>;
  cancelTopup(id: number): Promise<void>;
  myTopups(): Promise<Topup[]>;
  ledger(): Promise<LedgerRow[]>;
  redeem(code: string): Promise<{ ok: boolean; error?: string; credits?: number; balance?: number }>;
  unlock(service: string): Promise<{ charged: boolean; expires_at: string; balance: number }>;
  questions(): Promise<Question[]>;
  inductionStart(): Promise<{ attempt_id: number; started_at: string; now: string; required_seconds: number }>;
  inductionSubmit(attempt: number, answers: Record<number, number>): Promise<{ passed: boolean; score: number; total: number; seconds: number; wrong: number[]; pass_pct: number }>;
  admin: {
    pendingTopups(): Promise<Topup[]>; decide(id: number, approve: boolean): Promise<void>; users(search: string): Promise<AdminUser[]>;
    adjust(user: string, delta: number, reason: string): Promise<void>; createCodes(n: number, credits: number, note: string, days: number | null): Promise<string[]>; codes(): Promise<CodeRow[]>;
    updateService(key: string, patch: Partial<Service>): Promise<void>; updateSetting(key: string, value: any): Promise<void>;
  };
}

/** Mã lỗi nghiệp vụ → thông báo tiếng Việt. */
export const ERR: Record<string, string> = {
  INSUFFICIENT_CREDIT: "Không đủ credit — hãy nạp thêm credit.", INDUCTION_REQUIRED: "Cần hoàn thành huấn luyện an ninh – an toàn (15 phút) trước.", TOO_MANY_ATTEMPTS: "Nhập sai quá nhiều lần, thử lại sau 1 giờ.",
  INVALID_CODE: "Mã không đúng, đã dùng hoặc hết hạn.", TOO_FAST: "Chưa đủ thời gian học tối thiểu — hãy xem hết nội dung huấn luyện.", INVALID_PACKAGE: "Gói nạp không hợp lệ.",
  TOO_MANY_PENDING: "Đang có quá nhiều yêu cầu nạp chờ duyệt (tối đa 5).", FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.", ALREADY_DECIDED: "Yêu cầu đã được xử lý.", ATTEMPT_NOT_FOUND: "Phiên huấn luyện không hợp lệ hoặc đã nộp.",
  REASON_REQUIRED: "Cần nhập lý do.", INVALID_AMOUNT: "Số lượng/số tiền không hợp lệ.", SERVICE_NOT_FOUND: "Dịch vụ không tồn tại.", NOT_AUTHENTICATED: "Cần đăng nhập.",
};
export const errText = (e: any): string => {
  const m = String(e?.message || e || "");
  for (const k of Object.keys(ERR)) if (m.includes(k)) return ERR[k];
  if (/Invalid login credentials/i.test(m)) return "Email hoặc mật khẩu không đúng.";
  if (/already registered|already been registered/i.test(m)) return "Email này đã đăng ký.";
  if (/Email not confirmed/i.test(m)) return "Email chưa được xác nhận — kiểm tra hộp thư.";
  if (/Password should be|weak/i.test(m)) return "Mật khẩu quá yếu (tối thiểu 8 ký tự).";
  if (/rate limit/i.test(m)) return "Thao tác quá nhanh, vui lòng thử lại sau ít phút.";
  if (/hse_|relation .* does not exist|schema cache|Could not find the function/i.test(m)) return "BACKEND_NOT_READY";
  return m || "Có lỗi xảy ra.";
};

// ───────────────────────── Supabase ─────────────────────────
async function makeSupabase(): Promise<Api> {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(BACKEND.url, BACKEND.key, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "hse-binhdien-auth" } });
  const rpc = async (fn: string, args?: any) => { const { data, error } = await sb.rpc(fn, args); if (error) throw error; return data; };
  const q = async (p: any) => { const { data, error } = await p; if (error) throw error; return data; };
  const emailOf = async (rows: any[]) => rows; // email chỉ có ở hse_admin_users; danh sách duyệt nạp tiền hiển thị theo user_id rút gọn
  return {
    mode: "supabase",
    async getUser() { const { data } = await sb.auth.getSession(); const u = data.session?.user; return u ? { id: u.id, email: u.email || "", meta: u.user_metadata || {} } : null; },
    onAuth(cb) { const { data } = sb.auth.onAuthStateChange(() => cb()); return () => data.subscription.unsubscribe(); },
    async signUp(email, password, meta) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: meta, emailRedirectTo: typeof location !== "undefined" ? location.origin : undefined } });
      if (error) throw error; return { needsConfirm: !data.session };
    },
    async signIn(email, password) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error; },
    async signOut() { await sb.auth.signOut(); },
    async resetPassword(email) { const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: typeof location !== "undefined" ? location.origin : undefined }); if (error) throw error; },
    ensureProfile: meta => rpc("hse_ensure_profile", { p_name: meta.full_name || "", p_phone: meta.phone || "", p_company: meta.company || "" }),
    me: () => rpc("hse_me"),
    async catalog() {
      const [packages, services, st] = await Promise.all([q(sb.from("hse_packages").select("vnd,credits").order("sort")), q(sb.from("hse_services").select("*").order("sort")), q(sb.from("hse_settings").select("key,value"))]);
      return { packages, services, settings: Object.fromEntries(st.map((r: any) => [r.key, r.value])) };
    },
    async createTopup(vnd) { return rpc("hse_create_topup", { p_vnd: vnd }); },
    async cancelTopup(id) { await rpc("hse_cancel_topup", { p_id: id }); },
    myTopups: () => q(sb.from("hse_topups").select("*").order("created_at", { ascending: false }).limit(30)),
    ledger: () => q(sb.from("hse_ledger").select("id,delta,balance_after,reason,ref,created_at").order("id", { ascending: false }).limit(60)),
    redeem: code => rpc("hse_redeem_code", { p_code: code }),
    unlock: key => rpc("hse_unlock_service", { p_key: key }),
    questions: () => q(sb.from("hse_induction_questions").select("*").order("sort")),
    inductionStart: () => rpc("hse_induction_start"),
    inductionSubmit: (attempt, answers) => rpc("hse_induction_submit", { p_attempt: attempt, p_answers: answers }),
    admin: {
      pendingTopups: () => q(sb.from("hse_topups").select("*").eq("status", "pending").order("created_at")).then(emailOf),
      decide: async (id, approve) => { await rpc("hse_admin_decide_topup", { p_id: id, p_approve: approve }); },
      users: search => rpc("hse_admin_users", { p_search: search || "" }),
      adjust: async (user, delta, reason) => { await rpc("hse_admin_adjust", { p_user: user, p_delta: delta, p_reason: reason }); },
      createCodes: (n, credits, note, days) => rpc("hse_admin_create_codes", { p_n: n, p_credits: credits, p_note: note, p_days: days }),
      codes: () => q(sb.from("hse_codes").select("*").order("created_at", { ascending: false }).limit(200)),
      updateService: async (key, patch) => { await q(sb.from("hse_services").update(patch).eq("key", key)); },
      updateSetting: async (key, value) => { await q(sb.from("hse_settings").upsert({ key, value })); },
    },
  };
}

// ───────────────────────── Bản thử trong trình duyệt ─────────────────────────
const SEED_Q: Question[] = [
  [1, "an_ninh", "Khi đến nhà máy lần đầu với tư cách khách, việc đầu tiên phải làm là gì?", ["Đi thẳng vào khu sản xuất nếu có người quen", "Đăng ký tại cổng/bảo vệ, xuất trình giấy tờ cần thiết và nhận thẻ khách", "Chụp ảnh khu vực để báo cáo", "Đỗ xe trong khu sản xuất"]],
  [2, "an_ninh", "Quay phim, chụp ảnh trong nhà máy:", ["Được phép tự do", "Chỉ khi được người quản lý khu vực cho phép", "Chỉ ở khu kho", "Chỉ vào ban đêm"]],
].map(([id, section, prompt, options]: any) => ({ id, section, prompt, options, sort: id }));
const LOCAL_KEY = "hse-local-db";
async function makeLocal(): Promise<Api> {
  const load = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch { return null; } };
  const base = () => ({ users: [] as any[], session: null as string | null, wallets: {} as any, ledger: [] as any[], topups: [] as any[], codes: [] as any[], passes: [] as any[], inductions: {} as any, attempts: [] as any[], failed: [] as any[], seq: 1,
    services: [["sim3d", "Mô phỏng 3D nhà máy", 15, true], ["wwsim", "Mô phỏng dòng nước thải", 10, false], ["dcs", "Màn hình DCS nước thải", 10, false], ["dcsplant", "Màn hình DCS dây chuyền sản xuất", 15, false], ["dispersion", "Lan truyền khí thải (Gauss ISC3)", 20, false], ["gpmt01", "GPMT Nguồn 01 — lò hơi", 20, false], ["lowsrc", "Nguồn thấp · Đường · Mặt", 15, false], ["isoforms", "Biểu mẫu ISO 14001", 10, false], ["gri", "Báo cáo GRI", 10, false]].map(([key, title, price, ni], i) => ({ key, title, price, pass_hours: 24, needs_induction: ni, active: true, sort: i + 1 })),
    packages: [[100000, 100], [200000, 220], [300000, 345], [400000, 480], [500000, 625]].map(([vnd, credits]) => ({ vnd, credits })),
    settings: { induction_minutes: 15, induction_pass_pct: 80, induction_valid_days: 365, bank_bin: "", bank_name: "", bank_account: "", bank_account_name: "", contact_zalo_name: "", contact_zalo_phone: "" } as any });
  let db = load() || base(); const save = () => localStorage.setItem(LOCAL_KEY, JSON.stringify(db)); const listeners = new Set<() => void>(); const emit = () => listeners.forEach(f => f());
  const user = () => db.users.find((u: any) => u.id === db.session); const need = () => { const u = user(); if (!u) throw new Error("NOT_AUTHENTICATED"); return u; };
  const isAdmin = (u: any) => /^admin/i.test(u.email); const adminOnly = () => { if (!isAdmin(need())) throw new Error("FORBIDDEN"); };
  const now = () => new Date(); const iso = (d: Date) => d.toISOString();
  const apply = (uid: string, delta: number, reason: string, ref = "") => { const nb = (db.wallets[uid] || 0) + delta; if (nb < 0) throw new Error("balance"); db.wallets[uid] = nb; db.ledger.unshift({ id: db.seq++, user_id: uid, delta, balance_after: nb, reason, ref, created_at: iso(now()) }); return nb; };
  const rnd = (n: number) => Array.from({ length: n }, () => "0123456789ABCDEF"[Math.floor(Math.random() * 16)]).join("");
  const meOf = (u: any): Me => ({ user_id: u.id, email: u.email, profile: u.profile, balance: db.wallets[u.id] || 0, is_admin: isAdmin(u),
    passes: db.passes.filter((p: any) => p.user_id === u.id && new Date(p.expires_at) > now()).map((p: any) => ({ service_key: p.service_key, expires_at: p.expires_at })),
    induction: db.inductions[u.id] && new Date(db.inductions[u.id].expires_at) > now() ? db.inductions[u.id] : null });
  const reqSecs = () => (fastInduction() ? 5 : db.settings.induction_minutes * 60);
  return {
    mode: "local",
    async getUser() { db = load() || db; const u = user(); return u ? { id: u.id, email: u.email, meta: u.profile || {} } : null; },
    onAuth(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async signUp(email, password, meta) { if (db.users.some((u: any) => u.email === email)) throw new Error("already registered"); if (password.length < 8) throw new Error("Password should be"); const id = "u" + db.seq++; db.users.push({ id, email, password, profile: meta }); db.session = id; save(); emit(); return { needsConfirm: false }; },
    async signIn(email, password) { const u = db.users.find((x: any) => x.email === email && x.password === password); if (!u) throw new Error("Invalid login credentials"); db.session = u.id; save(); emit(); },
    async signOut() { db.session = null; save(); emit(); }, async resetPassword() {},
    async ensureProfile(meta) { const u = need(); u.profile = { full_name: u.profile?.full_name || meta.full_name || "", phone: u.profile?.phone || meta.phone || "", company: u.profile?.company || meta.company || "" }; db.wallets[u.id] ??= 0; save(); return meOf(u); },
    async me() { return meOf(need()); },
    async catalog() { return { packages: db.packages, services: db.services, settings: db.settings }; },
    async createTopup(vnd) { const u = need(), pk = db.packages.find((p: Pkg) => p.vnd === vnd); if (!pk) throw new Error("INVALID_PACKAGE"); if (db.topups.filter((t: any) => t.user_id === u.id && t.status === "pending").length >= 5) throw new Error("TOO_MANY_PENDING");
      const t = { id: db.seq++, user_id: u.id, vnd, credits: pk.credits, memo: "HSE" + rnd(6), status: "pending", created_at: iso(now()), email: u.email }; db.topups.unshift(t); save(); return t; },
    async cancelTopup(id) { const u = need(), t = db.topups.find((x: any) => x.id === id && x.user_id === u.id && x.status === "pending"); if (!t) throw new Error("NOT_FOUND_OR_NOT_PENDING"); t.status = "cancelled"; save(); },
    async myTopups() { const u = need(); return db.topups.filter((t: any) => t.user_id === u.id); },
    async ledger() { const u = need(); return db.ledger.filter((l: any) => l.user_id === u.id); },
    async redeem(code) { const u = need(); const k = code.replace(/\s/g, "").toUpperCase(); if (db.failed.filter((f: any) => f.u === u.id && Date.now() - f.t < 3600e3).length >= 5) throw new Error("TOO_MANY_ATTEMPTS");
      const c = db.codes.find((x: any) => x.code === k); if (!c || c.used_by || (c.expires_at && new Date(c.expires_at) < now())) { db.failed.push({ u: u.id, t: Date.now() }); save(); return { ok: false, error: "INVALID_CODE" }; }
      const nb = apply(u.id, c.credits, "Mã nạp credit", c.code); c.used_by = u.id; c.used_at = iso(now()); save(); return { ok: true, credits: c.credits, balance: nb }; },
    async unlock(key) { const u = need(), s = db.services.find((x: Service) => x.key === key && x.active); if (!s) throw new Error("SERVICE_NOT_FOUND");
      const p = db.passes.filter((x: any) => x.user_id === u.id && x.service_key === key && new Date(x.expires_at) > now()).sort((a: any, b: any) => b.expires_at.localeCompare(a.expires_at))[0];
      if (p) return { charged: false, expires_at: p.expires_at, balance: db.wallets[u.id] || 0 };
      if (s.needs_induction && !meOf(u).induction) throw new Error("INDUCTION_REQUIRED"); if ((db.wallets[u.id] || 0) < s.price) throw new Error("INSUFFICIENT_CREDIT");
      const nb = apply(u.id, -s.price, "Mở khóa: " + s.title, s.key); const exp = iso(new Date(Date.now() + s.pass_hours * 3600e3)); db.passes.push({ user_id: u.id, service_key: key, expires_at: exp, price_paid: s.price }); save(); return { charged: true, expires_at: exp, balance: nb }; },
    async questions() { return SEED_Q; },
    async inductionStart() { const u = need(); let a = db.attempts.find((x: any) => x.user_id === u.id && !x.finished_at); if (!a) { a = { id: db.seq++, user_id: u.id, started_at: iso(now()) }; db.attempts.push(a); save(); } return { attempt_id: a.id, started_at: a.started_at, now: iso(now()), required_seconds: reqSecs() }; },
    async inductionSubmit(attempt, answers) { const u = need(), a = db.attempts.find((x: any) => x.id === attempt && x.user_id === u.id && !x.finished_at); if (!a) throw new Error("ATTEMPT_NOT_FOUND");
      const secs = Math.floor((Date.now() - new Date(a.started_at).getTime()) / 1000); if (secs < reqSecs()) throw new Error("TOO_FAST"); const key: any = { 1: 1, 2: 1 };
      const wrong = SEED_Q.filter(x => answers[x.id] !== key[x.id]).map(x => x.id); const score = SEED_Q.length - wrong.length; const passed = score * 100 / SEED_Q.length >= db.settings.induction_pass_pct; a.finished_at = iso(now());
      if (passed) db.inductions[u.id] = { passed_at: iso(now()), expires_at: iso(new Date(Date.now() + db.settings.induction_valid_days * 86400e3)), score, total: SEED_Q.length }; save(); return { passed, score, total: SEED_Q.length, seconds: secs, wrong, pass_pct: db.settings.induction_pass_pct }; },
    admin: {
      async pendingTopups() { adminOnly(); return db.topups.filter((t: any) => t.status === "pending"); },
      async decide(id, approve) { adminOnly(); const t = db.topups.find((x: any) => x.id === id); if (!t) throw new Error("NOT_FOUND"); if (t.status !== "pending") throw new Error("ALREADY_DECIDED"); if (approve) apply(t.user_id, t.credits, `Nạp tiền ${t.vnd}đ`, t.memo); t.status = approve ? "approved" : "rejected"; save(); },
      async users() { adminOnly(); return db.users.map((u: any) => ({ user_id: u.id, email: u.email, full_name: u.profile?.full_name || "", phone: u.profile?.phone || "", company: u.profile?.company || "", balance: db.wallets[u.id] || 0, created_at: "", induction_until: db.inductions[u.id]?.expires_at || null, is_admin: isAdmin(u) })); },
      async adjust(user, delta, reason) { adminOnly(); if (!reason.trim()) throw new Error("REASON_REQUIRED"); apply(user, delta, "Quản trị điều chỉnh: " + reason); save(); },
      async createCodes(n, credits, note, days) { adminOnly(); const out: string[] = []; for (let i = 0; i < n; i++) { const code = `HSE-${rnd(4)}-${rnd(4)}-${rnd(4)}`; db.codes.unshift({ code, credits, note, created_at: iso(now()), expires_at: days ? iso(new Date(Date.now() + days * 86400e3)) : null, used_by: null, used_at: null }); out.push(code); } save(); return out; },
      async codes() { adminOnly(); return db.codes; },
      async updateService(key, patch) { adminOnly(); Object.assign(db.services.find((s: Service) => s.key === key), patch); save(); },
      async updateSetting(key, value) { adminOnly(); db.settings[key] = value; save(); },
    },
  };
}

let _api: Promise<Api> | null = null;
export const getApi = () => (_api ??= useLocalBackend() ? makeLocal() : makeSupabase());
