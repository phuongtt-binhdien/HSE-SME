"use client";
// @ts-nocheck
// Màn hình DCS vận hành HTXLNT: mimic từ mô hình "P&ID → JSON", faceplate PID, báo động ISA-18.2, nhật ký, xu hướng và bài thử thách xử lý sự cố.
import { useEffect, useRef, useState } from "react";
import { createWw, stepWw, settle, STAGES, STANDARDS, Q_DESIGN } from "./wwtp.ts";
import { INSTRUMENTS, LOOPS, PID_MODEL, CHALLENGES, pv, limits, newRun, updateAlarms, ackAll, operator, startChallenge, tickChallenge } from "./dcs.ts";

export const K = { bg: "#0c1117", panel: "#151c26", line: "#2a3646", txt: "#dbe4ef", dim: "#7d8da3", ok: "#3fae7b", warn: "#e0a526", crit: "#e5484d", blue: "#4c9be8", pipe: "#5a6c82" };
export const DCS_CSS = `.dc-b{background:#1d2735;color:${K.txt};border:1px solid ${K.line};border-radius:5px;padding:5px 10px;font:600 12px 'DM Mono',ui-monospace,monospace;cursor:pointer;white-space:nowrap}.dc-b:hover{background:#26344a}.dc-b.on{background:#1f4e8c;border-color:#4c9be8}.dc-b.go{background:#14543a;border-color:#3fae7b}.dc-b.stp{background:#6e1f23;border-color:#e5484d}
@keyframes dcblink{0%,49%{opacity:1}50%,100%{opacity:.25}}.dc-blink{animation:dcblink 1s steps(1) infinite}@media(min-width:1100px){.dc-grid{grid-template-columns:minmax(0,1.8fr) minmax(300px,1fr)!important}}.dc-card{background:${K.panel};border:1px solid ${K.line};border-radius:8px;padding:10px;min-width:0;color:${K.txt}}`;
export const fmt = (v, d = 1) => (isFinite(v) ? Number(v).toFixed(d) : "—");
export const clock = h => `${String(Math.floor(h / 24)).padStart(1, "0")}d ${String(Math.floor(h % 24)).padStart(2, "0")}:${String(Math.floor((h * 60) % 60)).padStart(2, "0")}`;

export function Trend({ data, series, title, h = 90, unit = "" }) {
  const W = 300; const pts = data.slice(-300); if (pts.length < 2) return <div className="dc-card" style={{ height: h + 28, color: K.dim, fontSize: 11 }}>{title}: chưa có dữ liệu</div>;
  const all = series.flatMap(s => pts.map(p => p[s.key])).filter(isFinite); let lo = Math.min(...all), hi = Math.max(...all); if (series.fixed) { lo = series.fixed[0]; hi = series.fixed[1]; } if (hi - lo < 1e-6) { hi += 1; lo -= 1; } const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
  const t0 = pts[0].t, t1 = pts[pts.length - 1].t; const X = t => 4 + ((t - t0) / Math.max(1e-6, t1 - t0)) * (W - 8), Y = v => h - 4 - ((v - lo) / (hi - lo)) * (h - 8);
  return <div className="dc-card"><div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><b>{title}</b><span style={{ color: K.dim }}>{series.map(s => <span key={s.key} style={{ color: s.color, marginLeft: 8 }}>{s.label} {fmt(pts[pts.length - 1][s.key], s.d ?? 1)}{unit}</span>)}</span></div>
    <svg viewBox={`0 0 ${W} ${h}`} width="100%" style={{ background: "#0a0f15", borderRadius: 4, display: "block" }}>{[0.25, 0.5, 0.75].map(f => <line key={f} x1="0" x2={W} y1={h * f} y2={h * f} stroke="#1b2432" />)}
      {(series.refs || []).map((r, i) => r.v > lo && r.v < hi && <line key={i} x1="0" x2={W} y1={Y(r.v)} y2={Y(r.v)} stroke={r.c} strokeDasharray="4 3" />)}
      {series.map(s => <polyline key={s.key} fill="none" stroke={s.color} strokeWidth="1.5" strokeDasharray={s.dash || ""} points={pts.map(p => `${X(p.t).toFixed(1)},${Y(p[s.key]).toFixed(1)}`).join(" ")} />)}</svg>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: K.dim, marginTop: 2 }}><span>{fmt(lo, 1)}</span><span>{fmt(t1 - t0, 0)} h</span><span>{fmt(hi, 1)}</span></div></div>;
}

export default function DcsScreen() {
  const S = useRef(createWw("retro", "typical")); const R = useRef(newRun()); const run = useRef({ speed: 1, paused: false });
  const [, tick] = useState(0); const [sel, setSel] = useState("AIT-901"); const [tab, setTab] = useState("alarms"); const [ui, setUi] = useState({ speed: 1, paused: false, hint: false, chId: "" });
  const s = S.current, r = R.current, stages = STAGES.retro;
  useEffect(() => {
    const st = document.createElement("style"); st.textContent = DCS_CSS; document.head.appendChild(st);
    const iv = setInterval(() => { const q = run.current; if (q.paused) return; const S1 = S.current; for (let i = 0; i < q.speed; i++) { stepWw(S1, 0.01); updateAlarms(R.current, S1); tickChallenge(R.current, S1); if (R.current.challenge && R.current.challenge.state !== "run") { q.paused = false; } } }, 100);
    const uv = setInterval(() => tick(t => t + 1), 250); return () => { clearInterval(iv); clearInterval(uv); st.remove(); };
  }, []);
  const patch = p => { const n = { ...ui, ...p }; setUi(n); run.current.speed = n.speed; run.current.paused = n.paused; };
  const begin = id => { if (!id) { S.current = createWw("retro", "typical"); R.current = newRun(); } else { const c = CHALLENGES.find(x => x.id === id); S.current = startChallenge(R.current = newRun(), c); } patch({ chId: id, hint: false, speed: id ? 20 : 1 }); setTab("alarms"); tick(t => t + 1); };
  const op = (text, fn) => { fn(); operator(R.current, S.current, text); tick(t => t + 1); };
  const act = Object.values(r.active).sort((a, b) => a.pri - b.pri || a.since - b.since); const p1 = act.filter(a => a.pri === 1).length, p2 = act.length - p1, unack = act.filter(a => !a.acked).length;
  const worst = tag => { const m = act.filter(a => a.tag === tag); return m.length ? (m.some(a => a.pri === 1) ? 1 : 2) : 0; };
  const unackTag = tag => act.some(a => a.tag === tag && !a.acked);
  const COLS = 5, CW = 150, RH = 128; const pos = i => { const row = Math.floor(i / COLS), col = row % 2 === 0 ? i % COLS : COLS - 1 - (i % COLS); return { x: 18 + col * CW, y: 46 + row * RH }; };
  const idx = id => stages.findIndex(x => x.id === id);
  const insOf = id => INSTRUMENTS.filter(i => i.stage === id);
  const ctl = s.ctl, ch = r.challenge && CHALLENGES.find(c => c.id === r.challenge.id), std = STANDARDS[s.std];
  const selIns = INSTRUMENTS.find(i => i.tag === sel), selLoop = LOOPS.find(l => l.tag === sel || l.pvTag === sel);
  const color = tag => worst(tag) === 1 ? K.crit : worst(tag) === 2 ? K.warn : K.ok;

  const Pump = ({ id, x, y }) => { const on = ctl.wp[id]; return <g transform={`translate(${x},${y})`} style={{ cursor: "pointer" }} onClick={() => { setSel(id); }}><circle r="10" fill="#101821" stroke={on ? K.ok : K.crit} strokeWidth="2" /><path d="M-5,-5 L6,0 L-5,5 Z" fill={on ? K.ok : K.crit} /><text y="22" fontSize="8" fill={K.dim} textAnchor="middle">{id}</text></g>; };
  const Bubble = ({ ins, x, y }) => { const w = worst(ins.tag), v = pv(s, ins.tag); return <g transform={`translate(${x},${y})`} style={{ cursor: "pointer" }} onClick={() => setSel(ins.tag)} className={unackTag(ins.tag) ? "dc-blink" : ""}>
    <circle r="12" fill={w === 1 ? "#4a1518" : w === 2 ? "#4a3a10" : "#101821"} stroke={sel === ins.tag ? "#fff" : w === 1 ? K.crit : w === 2 ? K.warn : K.pipe} strokeWidth={sel === ins.tag ? 2.5 : 1.5} /><text y="-1" fontSize="6.5" fill={K.txt} textAnchor="middle" fontWeight="700">{ins.tag.split("-")[0]}</text><text y="6.5" fontSize="6" fill={K.dim} textAnchor="middle">{ins.tag.split("-")[1]}</text>
    <text x="16" y="4" fontSize="10" fill={w === 1 ? "#ff9a9d" : w === 2 ? "#f5c451" : K.txt} fontWeight="700">{fmt(v, ins.dec)}</text></g>; };

  return <div style={{ color: K.txt, display: "grid", gap: 10, fontFamily: "'DM Mono',ui-monospace,monospace" }}>
    {/* thanh trên */}
    <div className="dc-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <b style={{ fontSize: 13 }}>DCS · HTXLNT 120 m³/ngày.đêm</b><span style={{ color: K.dim, fontSize: 11 }}>{PID_MODEL.status}</span>
      <select value={ui.chId} onChange={e => begin(e.target.value)} className="dc-b" style={{ maxWidth: 260 }}><option value="">Chế độ vận hành tự do</option>{CHALLENGES.map(c => <option key={c.id} value={c.id}>Thử thách {c.title}</option>)}</select>
      <button className="dc-b" onClick={() => patch({ paused: !ui.paused })}>{ui.paused ? "⏵ Chạy" : "⏸ Dừng"}</button>{[1, 5, 20].map(v => <button key={v} className={`dc-b ${ui.speed === v ? "on" : ""}`} onClick={() => patch({ speed: v })}>{v}×</button>)}
      {!ui.chId && <><button className="dc-b" onClick={() => { settle(S.current, 24); tick(t => t + 1); }}>⏩ +24 h</button><select className="dc-b" onChange={e => { const v = e.target.value; if (v) { import("./wwtp.ts").then(m => { m.setInfluent(S.current, v); operator(R.current, S.current, "Đổi nước thải đầu vào: " + v); }); } e.target.value = ""; }} defaultValue=""><option value="">Đổi nước thải vào…</option><option value="typical">Điển hình</option><option value="peak">Đỉnh tải</option><option value="phshock">Sốc pH 12</option><option value="light">Tải nhẹ</option></select></>}
      <span style={{ marginLeft: "auto", fontSize: 12, color: K.dim }}>{clock(s.t)} · Q {fmt(s.qIn, 1)} m³/h</span>
    </div>
    {/* biểu ngữ báo động */}
    <div className="dc-card" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderColor: p1 ? K.crit : p2 ? K.warn : K.line }}>
      <span className={unack ? "dc-blink" : ""} style={{ fontWeight: 700, color: p1 ? K.crit : p2 ? K.warn : K.ok }}>{act.length ? `⚠ P1 ${p1} · P2 ${p2}` : "● Không có báo động"}</span>
      <span style={{ flex: 1, fontSize: 12, color: K.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{act[0] ? `${act[0].tag} ${act[0].limit} — ${act[0].desc}` : ""}</span>
      <button className="dc-b go" disabled={!unack} onClick={() => { ackAll(R.current, S.current); tick(t => t + 1); }}>ACK ({unack})</button>
    </div>
    {r.challenge && ch && <div className="dc-card" style={{ borderColor: r.challenge.state === "pass" ? K.ok : r.challenge.state === "fail" ? K.crit : K.blue }}>
      <div style={{ fontWeight: 700 }}>🎯 {ch.title} {r.challenge.state === "pass" ? "— ĐẠT ✔" : r.challenge.state === "fail" ? "— KHÔNG ĐẠT ✖" : `— còn ${fmt(Math.max(0, ch.hours - s.t), 0)} h mô phỏng`}</div>
      <div style={{ fontSize: 12, color: K.dim, margin: "4px 0", lineHeight: 1.6 }}>{ch.brief}</div><div style={{ fontSize: 12 }}>{r.challenge.text}</div>
      {ui.hint && <div style={{ fontSize: 12, color: K.warn, marginTop: 4 }}>Gợi ý: {ch.hint}</div>}
      <div style={{ marginTop: 6, display: "flex", gap: 6 }}><button className="dc-b" onClick={() => patch({ hint: !ui.hint })}>💡 Gợi ý</button><button className="dc-b" onClick={() => begin(ui.chId)}>↺ Làm lại</button></div></div>}

    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 10 }} className="dc-grid">
      <div className="dc-card" style={{ padding: 6 }}>
        <svg viewBox="0 0 780 520" width="100%" style={{ background: "#0a0f15", borderRadius: 6, display: "block" }}>
          <text x="14" y="22" fill={K.dim} fontSize="11">Mimic công nghệ — bấm bong bóng đo lường / bơm / máy để mở faceplate</text>
          {stages.slice(0, -1).map((st, i) => { const a = pos(i), b = pos(i + 1), on = s.tanks[i].q > 0.01; return <line key={i} x1={a.x + 65} y1={a.y + 40} x2={b.x + 65} y2={b.y + 40} stroke={on ? K.blue : "#2a3646"} strokeWidth="3" strokeDasharray={on ? "8 5" : ""}>{on && <animate attributeName="stroke-dashoffset" from="26" to="0" dur="1.2s" repeatCount="indefinite" />}</line>; })}
          {stages.map((st, i) => { const p = pos(i), T = s.tanks[i], lvl = st.pumped ? Math.min(1, T.level) : 0.7; return <g key={st.id} transform={`translate(${p.x},${p.y})`}>
            <rect width="130" height="80" rx="4" fill="#111a24" stroke="#3a4a60" /><rect x="3" y={3 + (1 - lvl) * 74} width="124" height={lvl * 74} fill="#1c3a52" opacity="0.8" rx="2" />
            <text x="6" y="13" fontSize="9.5" fill={K.txt} fontWeight="700">{st.id} {st.name}</text>
            {insOf(st.id).map((ins, k) => <Bubble key={ins.tag} ins={ins} x={20 + (k % 2) * 58} y={38 + Math.floor(k / 2) * 24} />)}
            {st.pump && <Pump id={st.pump} x={112} y={62} />}
            {st.id === "B09" && <><g transform="translate(112,22)" style={{ cursor: "pointer" }} onClick={() => setSel("AB-A")}><rect x="-12" y="-9" width="24" height="18" fill="#101821" stroke={ctl.blowerFail ? K.crit : ctl.blowerA ? K.ok : K.pipe} strokeWidth="2" /><text y="3" fontSize="7" fill={K.txt} textAnchor="middle">AB-A</text></g><g transform="translate(112,44)" style={{ cursor: "pointer" }} onClick={() => setSel("AB-B")}><rect x="-12" y="-9" width="24" height="18" fill="#101821" stroke={ctl.blowerB ? K.ok : K.pipe} strokeWidth="2" /><text y="3" fontSize="7" fill={K.txt} textAnchor="middle">AB-B</text></g></>}
            {st.id === "B05A" && <g transform="translate(112,56)" style={{ cursor: "pointer" }} onClick={() => setSel("DP-PAC")}><rect x="-14" y="-8" width="28" height="16" fill="#101821" stroke={ctl.pac ? K.ok : K.crit} strokeWidth="2" /><text y="3" fontSize="7" fill={K.txt} textAnchor="middle">PAC</text></g>}
            {st.id === "B12" && <g transform="translate(112,56)" style={{ cursor: "pointer" }} onClick={() => setSel("DP-CL")}><rect x="-14" y="-8" width="28" height="16" fill="#101821" stroke={ctl.clo ? K.ok : K.crit} strokeWidth="2" /><text y="3" fontSize="7" fill={K.txt} textAnchor="middle">Cl₂</text></g>}
          </g>; })}
          {(() => { const p = pos(stages.length - 1); return <g transform={`translate(${p.x + 65},${p.y + 80})`}><line y2="42" stroke={ctl.valveOpen ? K.blue : "#2a3646"} strokeWidth="3" /><g transform="translate(0,52)" style={{ cursor: "pointer" }} onClick={() => setSel("XV-701")}><path d="M-11,-8 L11,8 L11,-8 L-11,8 Z" fill={ctl.valveOpen ? K.ok : K.crit} stroke="#000" /><text y="22" fontSize="8" fill={K.dim} textAnchor="middle">XV-701 {ctl.valveOpen ? "MỞ" : "ĐÓNG"}</text></g></g>; })()}
          <rect y="486" width="780" height="34" fill="#17405a" /><text x="390" y="507" fill="#cfe9f7" fontSize="11" textAnchor="middle">Sông Vàm Cỏ Đông</text>
          <g transform="translate(18,396)"><rect width="150" height="64" rx="4" fill="#111a24" stroke="#3a4a60" /><rect x="3" y={3 + (1 - Math.min(1, s.pond.vol / s.pond.cap)) * 58} width="144" height={Math.min(1, s.pond.vol / s.pond.cap) * 58} fill="#6b5a2a" /><text x="6" y="13" fontSize="9.5" fill={K.txt} fontWeight="700">Hồ sự cố {fmt(s.pond.vol, 0)}/{s.pond.cap} m³</text></g>
        </svg>
      </div>

      <div className="dc-card">
        {/* faceplate */}
        {selIns && <div><div style={{ fontWeight: 700 }}>{selIns.tag} — {selIns.desc}</div>
          <div style={{ display: "flex", gap: 18, margin: "6px 0", alignItems: "baseline" }}><span style={{ fontSize: 30, fontWeight: 700, color: color(selIns.tag) }}>{fmt(pv(s, selIns.tag), selIns.dec)}</span><span style={{ color: K.dim }}>{selIns.unit}</span>
            <span style={{ color: K.dim, fontSize: 11 }}>{Object.entries(limits(s, selIns)).map(([k, v]) => `${k} ${fmt(v, 1)}`).join(" · ")}</span></div>
          {selLoop && (() => { const L = ctl[selLoop.id]; return <div style={{ borderTop: `1px solid ${K.line}`, paddingTop: 8 }}>
            <div style={{ fontWeight: 700 }}>{selLoop.tag} — {selLoop.desc}</div>
            <div style={{ display: "flex", gap: 6, margin: "6px 0", flexWrap: "wrap", alignItems: "center" }}>
              {["AUTO", "MAN"].map(m => <button key={m} className={`dc-b ${L.mode === m ? "on" : ""}`} onClick={() => op(`${selLoop.tag} → ${m}`, () => { L.mode = m; })}>{m}</button>)}
              <label style={{ fontSize: 11, color: K.dim }}>SP <input type="number" step="0.1" min={selLoop.spMin} max={selLoop.spMax} value={L.sp} onChange={e => op(`${selLoop.tag} SP = ${e.target.value}`, () => { L.sp = Math.min(selLoop.spMax, Math.max(selLoop.spMin, Number(e.target.value))); })} style={{ width: 70, background: "#0a0f15", color: K.txt, border: `1px solid ${K.line}`, borderRadius: 4, padding: 4 }} /> {selLoop.unit}</label>
              <span style={{ fontSize: 11, color: K.dim }}>OUT {fmt(L.out * 100, 0)} % ({selLoop.outDesc})</span></div>
            {L.mode === "MAN" && <input type="range" min={selLoop.outMin} max={selLoop.outMax} step="0.01" value={L.out} onChange={e => { L.out = Number(e.target.value); tick(t => t + 1); }} onMouseUp={() => operator(R.current, S.current, `${selLoop.tag} OUT = ${fmt(L.out * 100, 0)} %`)} style={{ width: "100%" }} />}
            <div style={{ height: 8, background: "#0a0f15", borderRadius: 3 }}><div style={{ height: 8, width: `${Math.max(0, (L.out - selLoop.outMin) / (selLoop.outMax - selLoop.outMin) * 100)}%`, background: K.blue, borderRadius: 3 }} /></div>
            <div style={{ fontSize: 10, color: K.dim, marginTop: 4 }}>PID Kp {L.kp} · Ti {L.ti} h</div></div>; })()}
        </div>}
        {!selIns && <div>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{sel}</div>
          {["WP01", "WP03", "WP04", "WP11"].includes(sel) && <button className={`dc-b ${ctl.wp[sel] ? "stp" : "go"}`} onClick={() => op(`${sel} ${ctl.wp[sel] ? "DỪNG" : "CHẠY"}`, () => { ctl.wp[sel] = !ctl.wp[sel]; })}>{ctl.wp[sel] ? "Dừng bơm" : "Chạy bơm"}</button>}
          {sel === "AB-A" && <><div style={{ fontSize: 12, color: ctl.blowerFail ? K.crit : K.dim, marginBottom: 6 }}>{ctl.blowerFail ? "SỰ CỐ — máy hỏng, không chạy được" : ctl.blowerA ? "Đang chạy" : "Dừng"}</div><button className={`dc-b ${ctl.blowerA ? "stp" : "go"}`} disabled={ctl.blowerFail} onClick={() => op(`AB-A ${ctl.blowerA ? "DỪNG" : "CHẠY"}`, () => { ctl.blowerA = !ctl.blowerA; })}>{ctl.blowerA ? "Dừng" : "Chạy"}</button></>}
          {sel === "AB-B" && <button className={`dc-b ${ctl.blowerB ? "stp" : "go"}`} onClick={() => op(`AB-B ${ctl.blowerB ? "DỪNG" : "CHẠY"}`, () => { ctl.blowerB = !ctl.blowerB; })}>{ctl.blowerB ? "Dừng máy dự phòng" : "Chạy máy dự phòng"}</button>}
          {sel === "DP-PAC" && <div><button className={`dc-b ${ctl.pac ? "stp" : "go"}`} onClick={() => op(`Bơm PAC ${ctl.pac ? "DỪNG" : "CHẠY"}`, () => { ctl.pac = !ctl.pac; })}>{ctl.pac ? "Dừng châm PAC" : "Chạy châm PAC"}</button><label style={{ display: "block", fontSize: 11, color: K.dim, marginTop: 8 }}>Liều PAC {ctl.pacDose} mg/L (Jar test 50)<input type="range" min="0" max="100" step="5" value={ctl.pacDose} onChange={e => op(`Liều PAC = ${e.target.value} mg/L`, () => { ctl.pacDose = Number(e.target.value); })} style={{ width: "100%" }} /></label></div>}
          {sel === "DP-CL" && <button className={`dc-b ${ctl.clo ? "stp" : "go"}`} onClick={() => op(`Bơm clorine ${ctl.clo ? "DỪNG" : "CHẠY"}`, () => { ctl.clo = !ctl.clo; })}>{ctl.clo ? "Dừng châm clorine" : "Chạy châm clorine"}</button>}
          {sel === "XV-701" && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}><button className={`dc-b ${ctl.valveOpen ? "stp" : "go"}`} onClick={() => op(`XV-701 ${ctl.valveOpen ? "ĐÓNG" : "MỞ"} (thủ công)`, () => { ctl.valveAuto = false; ctl.valveOpen = !ctl.valveOpen; })}>{ctl.valveOpen ? "Đóng van (về hồ sự cố)" : "Mở van (xả ra sông)"}</button><button className={`dc-b ${ctl.valveAuto ? "on" : ""}`} onClick={() => op(`XV-701 tự động ${ctl.valveAuto ? "TẮT" : "BẬT"}`, () => { ctl.valveAuto = !ctl.valveAuto; })}>Tự động theo chất lượng: {ctl.valveAuto ? "BẬT" : "TẮT"}</button></div>}
        </div>}
        <div style={{ marginTop: 10, fontSize: 10, color: K.dim }}>Nước ra theo {std.name}</div>
      </div>
    </div>

    <div className="dc-card"><div style={{ display: "flex", gap: 6, marginBottom: 8 }}>{[["alarms", `Báo động (${act.length})`], ["journal", "Nhật ký"], ["trends", "Xu hướng"]].map(([k, l]) => <button key={k} className={`dc-b ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "alarms" && <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 520 }}><thead><tr style={{ color: K.dim, textAlign: "left" }}><th>Ưu tiên</th><th>Tag</th><th>Mức</th><th>Mô tả</th><th>Giá trị</th><th>Từ</th><th></th></tr></thead><tbody>{act.length === 0 && <tr><td colSpan="7" style={{ color: K.dim, padding: 8 }}>Không có báo động đang hoạt động.</td></tr>}{act.map(a => <tr key={a.id} className={a.acked ? "" : "dc-blink"} style={{ borderTop: `1px solid ${K.line}`, color: a.pri === 1 ? "#ff9a9d" : "#f5c451" }}><td>P{a.pri}</td><td>{a.tag}</td><td>{a.limit}</td><td>{a.desc}</td><td>{a.value ? fmt(a.value, 1) : "—"}</td><td>{clock(a.since)}</td><td>{a.acked ? "✔ đã ghi nhận" : ""}</td></tr>)}</tbody></table></div>}
      {tab === "journal" && <div style={{ maxHeight: 260, overflowY: "auto", fontSize: 11 }}>{r.journal.length === 0 && <div style={{ color: K.dim }}>Chưa có sự kiện.</div>}{r.journal.map((j, i) => <div key={i} style={{ padding: "2px 0", color: j.kind === "ALM" ? "#ff9a9d" : j.kind === "RTN" ? K.ok : j.kind === "OP" ? K.blue : K.txt }}><span style={{ color: K.dim }}>{clock(j.t)}</span> [{j.kind}] {j.text}</div>)}</div>}
      {tab === "trends" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 8 }}>
        <Trend title="AIT-901 DO (mg/L)" data={s.hist} series={Object.assign([{ key: "do", label: "PV", color: "#4c9be8" }, { key: "doSp", label: "SP", color: "#3fae7b", dash: "4 3" }], { refs: [{ v: 2, c: K.warn }] })} />
        <Trend title="Tốc độ máy thổi khí (OUT %)" data={s.hist.map(h => ({ ...h, o: h.doOut * 100 }))} series={[{ key: "o", label: "OUT", color: "#e0a526", d: 0 }]} />
        <Trend title="AIT-501 pH keo tụ" data={s.hist} series={Object.assign([{ key: "phPv", label: "PV", color: "#4c9be8", d: 2 }, { key: "phSp", label: "SP", color: "#3fae7b", dash: "4 3", d: 2 }], { refs: [{ v: 8.5, c: K.warn }, { v: 6.5, c: K.warn }] })} />
        <Trend title="Châm NaOH(+)/axit(−) (OUT %)" data={s.hist.map(h => ({ ...h, o: h.phOut * 100 }))} series={[{ key: "o", label: "OUT", color: "#c084fc", d: 0 }]} />
        <Trend title="Nước ra: COD, NH₄⁺ (mg/L)" data={s.hist} series={Object.assign([{ key: "cod", label: "COD", color: "#e0a526", d: 0 }, { key: "nh4", label: "NH₄⁺", color: "#e5484d" }], { refs: [{ v: std.nh4, c: K.crit }] })} />
        <Trend title="LT-104 mực nước bể điều hòa (%)" data={s.hist.map(h => ({ ...h, lv: h.lvEq * 100 }))} series={Object.assign([{ key: "lv", label: "LT-104", color: "#3fae7b", d: 0 }], { refs: [{ v: 85, c: K.warn }] })} />
      </div>}
    </div>
    <div style={{ fontSize: 10, color: K.dim, lineHeight: 1.6 }}>Mã tag (LT-104, AIT-901…) và vòng điều khiển do mô hình đề xuất để dựng màn hình đào tạo — chưa có trong bản vẽ gốc; kỹ sư tự động hóa/vận hành cần duyệt. Thể tích bể suy từ thời gian lưu giả định, hệ số xử lý chỉ thị, pH trộn tuyến tính (không mô phỏng đệm kiềm) — chỉ dùng đào tạo, không dùng để thiết kế hay báo cáo.</div>
  </div>;
}
