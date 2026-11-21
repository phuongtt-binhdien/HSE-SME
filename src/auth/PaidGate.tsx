"use client";
// @ts-nocheck
import { useState } from "react";
import { useAuth } from "./AuthContext.tsx";
import { errText } from "./api.ts";
import { Card, Btn, Msg, C, fmtDate } from "./ui.tsx";

/** Khóa dịch vụ trả phí: mở khóa theo phiên (mặc định 24 giờ) bằng credit; dịch vụ yêu cầu huấn luyện an toàn kiểm tra thêm điều kiện này. */
export function PaidGate({ id, setActive, children }) {
  const a = useAuth(); const s = a.service(id); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  if (!s) return children;                                   // tab miễn phí
  if (a.hasPass(id)) return children;
  const need = s.needs_induction && !a.me?.induction;
  const short = a.me.balance < s.price;
  const unlock = async () => { setBusy(true); setErr(""); try { const r = await a.api.unlock(id); setOk(r.charged ? `Đã mở khóa đến ${fmtDate(r.expires_at)}` : "Đã có quyền truy cập"); await a.refreshMe(); } catch (e) { setErr(errText(e)); } finally { setBusy(false); } };
  return <div style={{ maxWidth: 560, margin: "40px auto" }}><Card title={`🔒 ${s.title}`}>
    <div style={{ color: C.sub, fontSize: 13, lineHeight: 1.7 }}>Tính năng này dùng credit. Mở khóa một lần được dùng không giới hạn trong <b style={{ color: C.txt }}>{s.pass_hours} giờ</b>.</div>
    <div style={{ display: "flex", gap: 24, margin: "14px 0" }}>
      <div><div style={{ color: C.dim, fontSize: 10, textTransform: "uppercase" }}>Giá</div><div style={{ font: "800 26px 'Syne'", color: C.green }}>{s.price} <span style={{ fontSize: 13, color: C.sub }}>credit</span></div></div>
      <div><div style={{ color: C.dim, fontSize: 10, textTransform: "uppercase" }}>Số dư</div><div style={{ font: "800 26px 'Syne'", color: short ? C.red : C.txt }}>{a.me.balance} <span style={{ fontSize: 13, color: C.sub }}>credit</span></div></div>
    </div>
    {need && <Msg kind="err">Dịch vụ này yêu cầu đã hoàn thành <b>huấn luyện an ninh – an toàn trước khi vào nhà máy (15 phút)</b>.</Msg>}
    {err && <Msg kind="err">{err}</Msg>}{ok && <Msg kind="ok">{ok}</Msg>}
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
      {need ? <Btn kind="pri" onClick={() => setActive("induction")}>🦺 Làm huấn luyện 15 phút</Btn>
        : short ? <Btn kind="pri" onClick={() => setActive("wallet")}>💳 Nạp credit</Btn>
        : <Btn kind="pri" disabled={busy} onClick={unlock}>{busy ? "Đang mở…" : `Mở khóa ${s.pass_hours} giờ (${s.price} credit)`}</Btn>}
    </div>
  </Card></div>;
}
