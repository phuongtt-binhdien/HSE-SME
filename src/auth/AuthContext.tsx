"use client";
// @ts-nocheck
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { getApi, errText } from "./api.ts";
import { AuthStyle, C, Btn, Msg, Card } from "./ui.tsx";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [st, setSt] = useState({ loading: true, user: null, me: null, catalog: null, backendError: false, recovery: false });
  const apiRef = useRef(null);
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("Kết nối máy chủ tài khoản quá chậm — thử tải lại trang hoặc mở bản demo (?demo=1).")), ms))]);
  const load = useCallback(async () => {
    try {
      const api = (apiRef.current ??= await withTimeout(getApi(), 12000)); const u = await withTimeout(api.getUser(), 12000);
      if (!u) { setSt(s => ({ ...s, loading: false, user: null, me: null })); return; }
      const me = await withTimeout(api.ensureProfile({ full_name: u.meta?.full_name, phone: u.meta?.phone, company: u.meta?.company }), 12000);
      const catalog = await withTimeout(api.catalog(), 12000);
      setSt(s => ({ loading: false, user: u, me, catalog, backendError: false, recovery: s.recovery }));
    } catch (e) { const t = errText(e); setSt(s => ({ ...s, loading: false, backendError: t === "BACKEND_NOT_READY" ? true : t, user: s.user })); }
  }, []);
  useEffect(() => {
    let off = () => {}, off2 = () => {};
    (async () => {
      try { const api = (apiRef.current ??= await withTimeout(getApi(), 12000)); off = api.onAuth(load); off2 = api.onRecovery(() => setSt(s => ({ ...s, recovery: true }))); }
      catch (e) { setSt(s => ({ ...s, loading: false, backendError: errText(e) })); return; }
      load();
    })();
    return () => { off(); off2(); };
  }, [load]);
  const endRecovery = useCallback(() => setSt(s => ({ ...s, recovery: false })), []);
  const refreshMe = useCallback(async () => { const api = apiRef.current; if (!api) return; try { const me = await api.me(); setSt(s => ({ ...s, me })); } catch {} }, []);
  const refreshCatalog = useCallback(async () => { const api = apiRef.current; if (!api) return; try { const catalog = await api.catalog(); setSt(s => ({ ...s, catalog })); } catch {} }, []);
  const value = { ...st, api: apiRef.current, reload: load, endRecovery, refreshMe, refreshCatalog,
    hasPass: key => !!st.me?.passes?.some(p => p.service_key === key && new Date(p.expires_at) > new Date()),
    service: key => st.catalog?.services?.find(s => s.key === key && s.active) };
  return <Ctx.Provider value={value}><AuthStyle />{children}</Ctx.Provider>;
}

export function AuthGate({ children }) {
  const a = useAuth();
  if (a.loading) return <div style={{ minHeight: "100vh", background: C.bg, color: C.sub, display: "grid", placeItems: "center", fontFamily: "'Outfit',system-ui" }}>Đang tải…</div>;
  if (a.backendError) return <Screen><Card title="Máy chủ tài khoản chưa sẵn sàng">
    {a.backendError === true ? <Msg kind="err">Chưa thấy các bảng/hàm <code>hse_*</code> trong cơ sở dữ liệu. Quản trị cần chạy tệp <code>supabase/migrations/20261121000000_hse_accounts_credits.sql</code> trong Supabase (SQL Editor) rồi tải lại trang.</Msg> : <Msg kind="err">{a.backendError}</Msg>}
    <div style={{ marginTop: 12, display: "flex", gap: 8 }}><Btn onClick={() => a.reload()}>Thử lại</Btn><Btn onClick={async () => { await a.api?.signOut(); a.reload(); }}>Đăng xuất</Btn></div></Card></Screen>;
  if (a.recovery && a.user) return <NewPasswordScreen />;
  if (!a.user) return <LoginScreen />;
  return children;
}

const Screen = ({ children }) => <div style={{ minHeight: "100vh", background: C.bg, color: C.txt, display: "grid", placeItems: "center", padding: 16, fontFamily: "'Outfit',system-ui" }}><div style={{ width: "100%", maxWidth: 440 }}>{children}</div></div>;

function NewPasswordScreen() {
  const a = useAuth(); const [pw, setPw] = useState(""), [pw2, setPw2] = useState(""), [busy, setBusy] = useState(false), [msg, setMsg] = useState(null);
  const submit = async e => {
    e.preventDefault(); setMsg(null);
    if (pw.length < 8) return setMsg({ kind: "err", text: "Mật khẩu tối thiểu 8 ký tự." });
    if (pw !== pw2) return setMsg({ kind: "err", text: "Hai mật khẩu không khớp." });
    setBusy(true);
    try { await a.api.updatePassword(pw); try { history.replaceState(null, "", location.pathname + location.search); } catch {} a.endRecovery(); }
    catch (err) { setMsg({ kind: "err", text: errText(err) }); } finally { setBusy(false); }
  };
  const inp = { width: "100%", boxSizing: "border-box", background: C.bg, color: C.txt, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10, font: "15px 'Outfit',system-ui" };
  return <Screen><Card title="Đặt mật khẩu mới"><form onSubmit={submit}>
    <div style={{ color: C.sub, fontSize: 13, marginBottom: 12 }}>Tài khoản: {a.user?.email}</div>
    <input type="password" autoComplete="new-password" placeholder="Mật khẩu mới (tối thiểu 8 ký tự)" value={pw} onChange={e => setPw(e.target.value)} style={inp} />
    <input type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" value={pw2} onChange={e => setPw2(e.target.value)} style={inp} />
    {msg && <Msg kind={msg.kind}>{msg.text}</Msg>}
    <Btn type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu mật khẩu mới"}</Btn></form></Card></Screen>;
}

function LoginScreen() {
  const a = useAuth(); const [mode, setMode] = useState("in"); const [f, setF] = useState({ email: "", password: "", full_name: "", phone: "", company: "", agree: false });
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(null); const set = k => e => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const submit = async e => {
    e.preventDefault(); setMsg(null); setBusy(true);
    try {
      const api = a.api ?? (await getApi());
      if (mode === "in") await api.signIn(f.email.trim(), f.password);
      else if (mode === "up") {
        if (!f.full_name.trim()) throw new Error("Vui lòng nhập họ tên."); if (!f.agree) throw new Error("Cần đồng ý điều khoản bảo mật để đăng ký.");
        const r = await api.signUp(f.email.trim(), f.password, { full_name: f.full_name.trim(), phone: f.phone.trim(), company: f.company.trim() });
        if (r.needsConfirm) { setMsg({ k: "ok", t: "Đã gửi email xác nhận — mở email, bấm liên kết, rồi đăng nhập." }); setMode("in"); }
      } else { await api.resetPassword(f.email.trim()); setMsg({ k: "ok", t: "Nếu email tồn tại, liên kết đặt lại mật khẩu đã được gửi." }); }
    } catch (err) { const t = errText(err); setMsg({ k: "err", t: t === "BACKEND_NOT_READY" ? "Máy chủ chưa sẵn sàng (chưa chạy migration)." : t }); } finally { setBusy(false); }
  };
  return <Screen>
    <div style={{ textAlign: "center", marginBottom: 18 }}>
      <div style={{ font: "800 26px 'Syne',system-ui", color: C.green }}>HSE PLATFORM</div>
      <div style={{ color: C.sub, fontSize: 13, marginTop: 4 }}>Nhà máy Phân bón Bình Điền · Long An</div>
    </div>
    <Card>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["in", "Đăng nhập"], ["up", "Đăng ký"]].map(([k, l]) => <Btn key={k} kind={mode === k ? "pri" : ""} onClick={() => { setMode(k); setMsg(null); }} style={{ flex: 1 }}>{l}</Btn>)}
      </div>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        {mode === "up" && <><input className="au-in" placeholder="Họ và tên *" value={f.full_name} onChange={set("full_name")} autoComplete="name" /><input className="au-in" placeholder="Số điện thoại" value={f.phone} onChange={set("phone")} autoComplete="tel" /><input className="au-in" placeholder="Công ty / đơn vị" value={f.company} onChange={set("company")} autoComplete="organization" /></>}
        <input className="au-in" type="email" required placeholder="Email" value={f.email} onChange={set("email")} autoComplete="email" />
        {mode !== "reset" && <input className="au-in" type="password" required minLength={8} placeholder="Mật khẩu (tối thiểu 8 ký tự)" value={f.password} onChange={set("password")} autoComplete={mode === "in" ? "current-password" : "new-password"} />}
        {mode === "up" && <label style={{ fontSize: 12, color: C.sub, display: "flex", gap: 8, alignItems: "flex-start" }}><input type="checkbox" checked={f.agree} onChange={set("agree")} style={{ marginTop: 3 }} />Tôi đồng ý để hệ thống lưu họ tên, email, số điện thoại, lịch sử credit và kết quả huấn luyện an toàn của tôi nhằm vận hành dịch vụ.</label>}
        {msg && <Msg kind={msg.k}>{msg.t}</Msg>}
        <Btn kind="pri" type="submit" disabled={busy}>{busy ? "Đang xử lý…" : mode === "in" ? "Đăng nhập" : mode === "up" ? "Tạo tài khoản" : "Gửi liên kết đặt lại"}</Btn>
        {mode === "in" && <button type="button" onClick={() => { setMode("reset"); setMsg(null); }} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 12 }}>Quên mật khẩu?</button>}
        {mode === "reset" && <button type="button" onClick={() => setMode("in")} style={{ background: "none", border: "none", color: C.blue, cursor: "pointer", fontSize: 12 }}>← Quay lại đăng nhập</button>}
      </form>
    </Card>
    <div style={{ color: C.dim, fontSize: 11, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>Các tab dữ liệu nội bộ miễn phí sau khi đăng nhập; mô phỏng, mô hình Gauss và biểu mẫu dùng credit.{a.api?.mode === "local" && <><br /><b style={{ color: C.amber }}>Chế độ thử (lưu trên trình duyệt) — không dùng thu tiền thật.</b></>}</div>
  </Screen>;
}
