"use client";
// @ts-nocheck
import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext.tsx";
import { errText } from "./api.ts";
import { vietQrPayload, qrDataUrl } from "./vietqr.ts";
import { Card, Btn, Msg, C, fmtVnd, fmtDate } from "./ui.tsx";

const STATUS = { pending: ["Chờ duyệt", C.amber], approved: ["Đã cộng credit", C.green], rejected: ["Từ chối", C.red], cancelled: ["Đã hủy", C.dim] };

export function WalletModule({ setActive }) {
  const a = useAuth(); const cat = a.catalog; const st = cat.settings; const bankReady = !!(st.bank_bin && st.bank_account);
  const [sel, setSel] = useState(null); const [topup, setTopup] = useState(null); const [qr, setQr] = useState(""); const [topups, setTopups] = useState([]); const [ledger, setLedger] = useState([]);
  const [code, setCode] = useState(""); const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  const reload = async () => { try { const [t, l] = await Promise.all([a.api.myTopups(), a.api.ledger()]); setTopups(t); setLedger(l); await a.refreshMe(); } catch (e) { setMsg({ k: "err", t: errText(e) }); } };
  useEffect(() => { reload(); }, []);
  useEffect(() => { let off = false; setQr(""); if (topup && bankReady) qrDataUrl(vietQrPayload({ bin: st.bank_bin, account: st.bank_account, amount: topup.vnd, memo: topup.memo })).then(u => !off && setQr(u)); return () => { off = true; }; }, [topup?.id, bankReady]);
  const create = async () => { setBusy(true); setMsg(null); try { const t = await a.api.createTopup(sel.vnd); setTopup(t); await reload(); } catch (e) { setMsg({ k: "err", t: errText(e) }); } finally { setBusy(false); } };
  const cancel = async id => { try { await a.api.cancelTopup(id); if (topup?.id === id) setTopup(null); await reload(); } catch (e) { setMsg({ k: "err", t: errText(e) }); } };
  const redeem = async () => { setBusy(true); setMsg(null); try { const r = await a.api.redeem(code); if (r.ok) { setMsg({ k: "ok", t: `Đã cộng ${r.credits} credit. Số dư: ${r.balance}.` }); setCode(""); await reload(); } else setMsg({ k: "err", t: errText(r.error) }); } catch (e) { setMsg({ k: "err", t: errText(e) }); } finally { setBusy(false); } };
  return <div style={{ display: "grid", gap: 14, maxWidth: 1000 }}>
    <Card><div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
      <div><div style={{ color: C.dim, fontSize: 11, textTransform: "uppercase" }}>Số dư hiện tại</div><div data-testid="balance" style={{ font: "800 36px 'Syne'", color: C.green }}>{a.me.balance} <span style={{ fontSize: 15, color: C.sub }}>credit</span></div>
        <div style={{ color: C.dim, fontSize: 12 }}>1 credit = {Number(st.credit_vnd || 1000).toLocaleString("vi-VN")}đ · {a.me.email}</div></div>
      <div style={{ color: C.sub, fontSize: 12, lineHeight: 1.8, maxWidth: 420 }}>Tab dữ liệu nội bộ (hồ sơ nhà máy, hóa chất, nước thải, huấn luyện…) miễn phí. Mô phỏng, mô hình Gauss, biểu mẫu/báo cáo mở khóa theo phiên bằng credit:
        <div style={{ marginTop: 6 }}>{cat.services.filter(s => s.active).map(s => <span key={s.key} style={{ display: "inline-block", margin: "2px 6px 2px 0", padding: "2px 8px", borderRadius: 12, background: "#10243d", border: `1px solid ${C.line}`, color: C.txt, fontSize: 11 }}>{s.title}: {s.price}</span>)}</div></div>
    </div></Card>
    {msg && <Msg kind={msg.k}>{msg.t}</Msg>}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 14 }}>
      <Card title="Nạp credit">
        <table className="au-tb"><thead><tr><th>Số tiền</th><th>Credit</th><th>Thưởng</th><th></th></tr></thead><tbody>
          {cat.packages.map(p => { const bonus = Math.round((p.credits / (p.vnd / 1000) - 1) * 100); return <tr key={p.vnd}><td>{fmtVnd(p.vnd)}</td><td style={{ color: C.green, fontWeight: 700 }}>{p.credits}</td><td>{bonus > 0 ? `+${bonus}%` : "—"}</td><td><Btn kind={sel?.vnd === p.vnd ? "pri" : ""} onClick={() => { setSel(p); setTopup(null); }}>Chọn</Btn></td></tr>; })}</tbody></table>
        {sel && !topup && <div style={{ marginTop: 12 }}><Btn kind="pri" disabled={busy} onClick={create}>Tạo mã chuyển khoản {fmtVnd(sel.vnd)} → {sel.credits} credit</Btn></div>}
        {topup && <div style={{ marginTop: 14, textAlign: "center" }}>
          {bankReady ? <>
            {qr ? <img src={qr} alt="Mã QR chuyển khoản" width="240" height="240" style={{ background: "#fff", borderRadius: 10, padding: 6 }} /> : <div style={{ height: 240, display: "grid", placeItems: "center", color: C.dim }}>Đang tạo mã QR…</div>}
            <div style={{ font: "700 18px 'Syne'", margin: "8px 0", color: C.txt }}>{fmtVnd(topup.vnd)} → {topup.credits} credit</div>
            <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.7 }}>{st.bank_name} · STK <b style={{ color: C.txt }}>{st.bank_account}</b><br />{st.bank_account_name}</div>
            <div data-testid="memo" style={{ margin: "8px auto", display: "inline-block", padding: "6px 12px", border: `1px dashed ${C.dim}`, borderRadius: 8, fontFamily: "'DM Mono',monospace", fontSize: 14 }}>{topup.memo}</div>
            <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6 }}>Nhập đúng nội dung chuyển khoản <b>{topup.memo}</b>. Quản trị đối chiếu sao kê và duyệt, credit được cộng ngay sau khi duyệt{st.contact_zalo_phone ? <> — hoặc liên hệ Zalo {st.contact_zalo_name} <b>{st.contact_zalo_phone}</b> kèm ảnh giao dịch để nhận mã kích hoạt.</> : "."}</div>
            {qr && <a href={qr} download={`qr-${topup.memo}.png`} style={{ color: C.blue, fontSize: 12 }}>Lưu ảnh QR</a>}
          </> : <Msg kind="err">Quản trị chưa cấu hình tài khoản nhận tiền. Vui lòng liên hệ quản trị.</Msg>}
          <div style={{ marginTop: 10 }}><Btn onClick={() => cancel(topup.id)}>Hủy yêu cầu này</Btn></div>
        </div>}
      </Card>
      <Card title="Có mã nạp credit?">
        <div style={{ display: "flex", gap: 8 }}><input className="au-in" placeholder="HSE-XXXX-XXXX-XXXX" value={code} onChange={e => setCode(e.target.value)} /><Btn kind="pri" disabled={busy || !code.trim()} onClick={redeem}>Nhập mã</Btn></div>
        <div style={{ fontSize: 11, color: C.dim, marginTop: 8, lineHeight: 1.6 }}>Mã dùng một lần, do quản trị cấp sau khi nhận thanh toán. Nhập sai 5 lần sẽ bị khóa 1 giờ.</div>
        <div className="au-h" style={{ marginTop: 18 }}>Yêu cầu nạp gần đây</div>
        <table className="au-tb"><tbody>{topups.length === 0 && <tr><td style={{ color: C.dim }}>Chưa có.</td></tr>}{topups.slice(0, 8).map(t => <tr key={t.id}><td>{fmtVnd(t.vnd)}<div style={{ color: C.dim, fontSize: 10 }}>{fmtDate(t.created_at)}</div></td><td style={{ fontFamily: "'DM Mono'" }}>{t.memo}</td><td style={{ color: STATUS[t.status][1] }}>{STATUS[t.status][0]}</td><td>{t.status === "pending" && <Btn onClick={() => cancel(t.id)}>Hủy</Btn>}</td></tr>)}</tbody></table>
      </Card>
    </div>
    <Card title="Lịch sử credit"><table className="au-tb"><thead><tr><th>Thời gian</th><th>Nội dung</th><th>+/−</th><th>Số dư</th></tr></thead><tbody>
      {ledger.length === 0 && <tr><td colSpan="4" style={{ color: C.dim }}>Chưa có giao dịch.</td></tr>}
      {ledger.map(l => <tr key={l.id}><td>{fmtDate(l.created_at)}</td><td>{l.reason}</td><td style={{ color: l.delta > 0 ? C.green : C.amber, fontWeight: 700 }}>{l.delta > 0 ? "+" : ""}{l.delta}</td><td>{l.balance_after}</td></tr>)}</tbody></table></Card>
  </div>;
}
