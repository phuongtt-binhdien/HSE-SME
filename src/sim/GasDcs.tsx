"use client";
// @ts-nocheck
// Màn hình DCS hệ thống xử lý khí thải (7 dòng thải theo Phụ lục 2, GPMT 2986): mimic từng dòng, faceplate, báo động, xu hướng, bài thử thách xử lý sự cố.
import { useEffect, useRef, useState } from "react";
import { createGas, stepGas, ph, UNITS, FAULTS, CHALLENGES, startChallenge, tickChallenge, setFeed, fan, pulse, replaceBags, restoreAir, clearJam, primeNaoh, pumpStart, inject, ack, DP_H, DP_HH, PH_SP } from "./gas.ts";
import { K, fmt, Trend, DCS_CSS } from "./DcsScreen.tsx";

const mm = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const COLS = [10, 150, 292, 434, 566];
export default function GasDcs() {
  const S = useRef(createGas()); const R = useRef(null); const run = useRef({ speed: 1, paused: false }); const hist = useRef({}); const [, tick] = useState(0);
  const [sel, setSel] = useState("G04"); const [tab, setTab] = useState("alarms"); const [ui, setUi] = useState({ speed: 1, paused: false, chId: "", hint: false, fault: false, toast: "" }); const toastT = useRef(0);
  const say = m => { setUi(u => ({ ...u, toast: m })); clearTimeout(toastT.current); toastT.current = setTimeout(() => setUi(u => ({ ...u, toast: "" })), 5000); };
  useEffect(() => {
    const st = document.createElement("style"); st.textContent = DCS_CSS; document.head.appendChild(st);
    const iv = setInterval(() => { const q = run.current; if (q.paused) return; const g = S.current; for (let i = 0; i < q.speed; i++) { stepGas(g, 1); if (R.current) tickChallenge(g, R.current); }
      for (const d of UNITS) { const L = (hist.current[d.id] ||= []), last = L[L.length - 1], u = g.u[d.id]; if (!last || g.t - last.ts >= 15) { L.push({ ts: g.t, t: g.t / 3600, dust: u.dust, dp: u.dp, so2: u.so2, ph: ph(u), nh3: u.nh3, flow: u.flow / 1000, lim: d.lim.dust }); if (L.length > 400) L.shift(); } } }, 100);
    const uv = setInterval(() => tick(t => t + 1), 250); return () => { clearInterval(iv); clearInterval(uv); st.remove(); };
  }, []);
  const patch = p => { const n = { ...ui, ...p }; setUi(n); run.current.speed = n.speed; run.current.paused = n.paused; };
  const g = S.current, def = UNITS.find(x => x.id === sel), u = g.u[sel], r = R.current, ch = r && CHALLENGES.find(c => c.id === r.id);
  const begin = id => { hist.current = {}; if (!id) { S.current = createGas(); R.current = null; } else { const x = startChallenge(id); S.current = x.g; R.current = x.run; setSel(CHALLENGES.find(c => c.id === id).unit); patch({ chId: id, speed: 1, hint: false }); } patch({ chId: id }); tick(t => t + 1); };
  const op = fn => { const x = fn(); if (x === false) say("Thao tác không thực hiện được (điều kiện chưa thỏa)."); else if (x && x.ok === false) say(x.reason); tick(t => t + 1); };
  const al = Object.entries(g.alarms).map(([id, a]) => ({ id, ...a })).sort((a, b) => a.pri - b.pri || a.since - b.since); const unack = al.filter(a => !a.acked).length, p1 = al.filter(a => a.pri === 1).length;
  const unitAl = id => { const m = al.filter(a => a.id.startsWith(id + ":")); return m.length ? (m.some(a => a.pri === 1) ? 1 : 2) : 0; };
  const colr = a => (a === 1 ? K.crit : a === 2 ? K.warn : K.ok); const blink = id => al.some(a => a.id.startsWith(id + ":") && !a.acked);
  const H = hist.current[sel] || [];
  const state = x => (x.fanTrip ? ["SỰ CỐ", K.crit] : !x.fan ? ["DỪNG", K.dim] : ["CHẠY", K.ok]);
  const input = { width: 70, background: "#0a0f15", color: K.txt, border: `1px solid ${K.line}`, borderRadius: 4, padding: 4 };

  return <div style={{ color: K.txt, display: "grid", gap: 10, fontFamily: "'DM Mono',ui-monospace,monospace" }}>
    <div className="dc-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <b style={{ fontSize: 13 }}>DCS · Xử lý khí thải — 7 dòng thải (GPMT 2986)</b><span style={{ color: K.dim, fontSize: 11 }}>ĐỀ XUẤT — cần kỹ sư duyệt</span>
      <button className="dc-b" onClick={() => begin("")}>↺ Đặt lại</button><button className="dc-b" onClick={() => patch({ paused: !ui.paused })}>{ui.paused ? "⏵" : "⏸"}</button>
      {[1, 3, 10].map(v => <button key={v} className={`dc-b ${ui.speed === v ? "on" : ""}`} onClick={() => patch({ speed: v })}>{v * 10}×</button>)}
      <select className="dc-b" value={ui.chId} onChange={e => begin(e.target.value)} style={{ maxWidth: 290 }}><option value="">Vận hành tự do</option>{CHALLENGES.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
      <span style={{ marginLeft: "auto", fontSize: 12, color: K.dim }}>{mm(g.t)} · {UNITS.filter(d => g.u[d.id].flow > 0).length}/7 dòng chạy</span>
    </div>
    <div className="dc-card" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderColor: p1 ? K.crit : al.length ? K.warn : K.line }}>
      <span className={unack ? "dc-blink" : ""} style={{ fontWeight: 700, color: p1 ? K.crit : al.length ? K.warn : K.ok }}>{al.length ? `⚠ P1 ${p1} · P2 ${al.length - p1}` : "● Không có báo động"}</span>
      <span style={{ flex: 1, fontSize: 12, color: K.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{al[0]?.text}</span>
      <button className="dc-b go" disabled={!unack} onClick={() => op(() => ack(g))}>ACK ({unack})</button></div>
    {ui.toast && <div className="dc-card" style={{ borderColor: K.crit, color: "#ffb4b4", fontSize: 12 }}>⚠ {ui.toast}</div>}
    {ch && <div className="dc-card" style={{ borderColor: r.state === "pass" ? K.ok : r.state === "fail" ? K.crit : K.blue }}>
      <div style={{ fontWeight: 700 }}>🎯 {ch.title} {r.state === "pass" ? "— ĐẠT ✔" : r.state === "fail" ? "— KHÔNG ĐẠT ✖" : `— ${mm(g.t - r.startT)} / ${ch.minutes}:00`}</div>
      <div style={{ fontSize: 12, color: K.dim, margin: "4px 0", lineHeight: 1.6 }}>{ch.brief}</div>
      <button className="dc-b" onClick={() => patch({ hint: !ui.hint })}>💡 Gợi ý</button>{ui.hint && <div style={{ fontSize: 12, color: K.warn, marginTop: 6 }}>{ch.hint}</div>}
      <div style={{ marginTop: 6, fontSize: 12, color: r.state === "pass" ? K.ok : r.state === "fail" ? K.crit : K.txt }}>{r.text}</div></div>}

    <div className="dc-card" style={{ padding: 6 }}>
      <svg viewBox="0 0 770 520" width="100%" style={{ background: "#0a0f15", borderRadius: 6, display: "block" }}>
        <text x="10" y="16" fill={K.dim} fontSize="11">Mimic 7 dòng thải — nguồn → xử lý → quạt hút → ống khói · bấm một dòng để mở faceplate</text>
        {UNITS.map((d, i) => { const x = g.u[d.id], y = 28 + i * 69, [st, c] = state(x), flowing = x.flow > 0, a = unitAl(d.id), isSel = sel === d.id, bag = d.kind !== "boiler", dpC = x.dp > DP_HH ? K.crit : x.dp > DP_H ? K.warn : K.ok;
          const over = x.dust > d.lim.dust || (d.lim.so2 && x.so2 > d.lim.so2) || (d.lim.nh3 && x.nh3 > d.lim.nh3);
          const stage = (k, label, sub, col, w = 112) => <g key={k} transform={`translate(${COLS[k]},0)`}><rect width={w} height="44" rx="4" fill="#111a24" stroke={col} strokeWidth="1.5" /><text x="6" y="15" fontSize="10" fill={K.txt} fontWeight="700">{label}</text><text x="6" y="30" fontSize="8.5" fill={col}>{sub}</text></g>;
          return <g key={d.id} transform={`translate(0,${y})`} style={{ cursor: "pointer" }} onClick={() => setSel(d.id)}>
            <rect x="2" y="-4" width="764" height="54" rx="5" fill={isSel ? "#101c2c" : "none"} stroke={isSel ? "#4c9be8" : "none"} />
            {[0, 1, 2, 3].map(k => <line key={k} x1={COLS[k] + (k === 2 ? 112 : 112)} y1="22" x2={COLS[k + 1]} y2="22" stroke={flowing ? (k < 2 ? "#d9822b" : "#9aa7b8") : "#2a3646"} strokeWidth="3" strokeDasharray={flowing ? "8 5" : ""}>{flowing && <animate attributeName="stroke-dashoffset" from="26" to="0" dur={`${0.9 / Math.max(0.3, x.flow / d.flow)}s`} repeatCount="indefinite" />}</line>)}
            <g transform={`translate(${COLS[0]},0)`}><rect width="112" height="44" rx="4" fill="#111a24" stroke={x.feed > 0.05 ? K.ok : K.dim} strokeWidth="1.5" /><text x="6" y="13" fontSize="10" fill={K.txt} fontWeight="700">{d.id} · tải {Math.round(x.feed * 100)} %</text><text x="6" y="26" fontSize="7.5" fill={K.dim}>{d.name.slice(0, 26)}</text><text x="6" y="38" fontSize="7.5" fill={K.dim}>{d.name.slice(26, 52)}</text></g>
            {stage(1, bag ? (d.kind === "dryer" ? "Cyclone chùm" : "—") : "Lọc bụi ướt", bag ? (d.kind === "dryer" ? (x.jam ? "KẸT VAN XOAY" : "η > 95 %") : "(không cyclone)") : (x.pumpA || x.pumpB) && !x.pumpFail ? "bơm tuần hoàn CHẠY" : "MẤT BƠM", bag ? (x.jam ? K.crit : K.pipe) : ((x.pumpA || x.pumpB) && !x.pumpFail ? K.ok : K.crit))}
            {stage(2, bag ? "Lọc bụi túi vải" : "Tháp hấp thụ kiềm", bag ? `ΔP ${fmt(x.dp, 0)} mmH₂O${x.holes > 0.03 ? " · RÁCH" : ""}` : `pH ${fmt(ph(x), 1)} · NaOH ${x.dosLost ? "MẤT MỒI" : Math.round(x.phOut * 100) + " %"}`, bag ? (x.holes > 0.03 ? K.crit : dpC) : (ph(x) < 6 ? K.crit : ph(x) < 6.8 ? K.warn : K.ok))}
            {stage(3, "Quạt hút", `${st} · ${fmt(x.flow / 1000, 0)}k m³/h`, c, 112)}
            <g transform={`translate(${COLS[4]},0)`}><rect width="196" height="44" rx="4" fill="#111a24" stroke={a ? colr(a) : K.pipe} strokeWidth="1.5" className={blink(d.id) ? "dc-blink" : ""} /><text x="6" y="12" fontSize="9" fill={K.dim}>Ống khói {d.stack} · {d.hs} m</text>
              <text x="6" y="26" fontSize="10" fill={over ? "#ff9a9d" : K.txt} fontWeight="700">bụi {fmt(x.dust, 0)}/{d.lim.dust}{d.kind === "boiler" ? ` · SO₂ ${fmt(x.so2, 0)}/${d.lim.so2}` : ""}{d.lim.nh3 ? ` · NH₃ ${fmt(x.nh3, 0)}/${d.lim.nh3}` : ""}</text><text x="6" y="39" fontSize="7.5" fill={K.dim}>mg/Nm³ (đo / giới hạn) · {d.d}</text></g>
            {x.fugitive > 0 && x.feed > 0.05 && !x.fan && <text x="140" y="-6" fontSize="9" fill={K.crit} className="dc-blink">⚠ MẤT HÚT — bụi phát tán</text>}
          </g>; })}
      </svg>
    </div>

    <div className="dc-card">
      <div style={{ fontWeight: 700 }}>{def.id} — {def.name} <span style={{ color: K.dim, fontWeight: 400, fontSize: 11 }}>· Q {def.flow.toLocaleString()} m³/h · {def.train.join(" → ")}</span></div>
      <div style={{ fontSize: 11, color: K.dim, margin: "4px 0" }}>Giới hạn (QCVN 19/21:2009 cột B, Kp 0,8): bụi {def.lim.dust}{def.lim.so2 ? ` · SO₂ ${def.lim.so2} · NOx ${def.lim.nox} · CO ${def.lim.co}` : ""}{def.lim.nh3 ? ` · NH₃ ${def.lim.nh3}` : ""} mg/Nm³ — quan trắc định kỳ 3 tháng/lần; không thuộc diện quan trắc tự động liên tục.</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "6px 0", alignItems: "baseline" }}>
        <span><span style={{ fontSize: 26, fontWeight: 700, color: u.dust > def.lim.dust ? K.crit : K.ok }}>{fmt(u.dust, 0)}</span> <span style={{ color: K.dim, fontSize: 11 }}>bụi AT-{def.id.slice(1)}1</span></span>
        {def.kind === "boiler" && <><span><b style={{ fontSize: 20, color: u.so2 > def.lim.so2 ? K.crit : K.txt }}>{fmt(u.so2, 0)}</b> <span style={{ color: K.dim, fontSize: 11 }}>SO₂ AT-{def.id.slice(1)}2</span></span><span><b style={{ fontSize: 20 }}>{fmt(ph(u), 2)}</b> <span style={{ color: K.dim, fontSize: 11 }}>pH AIT-{def.id.slice(1)}3</span></span></>}
        {def.kind !== "boiler" && <span><b style={{ fontSize: 20, color: u.dp > DP_HH ? K.crit : u.dp > DP_H ? K.warn : K.txt }}>{fmt(u.dp, 0)}</b> <span style={{ color: K.dim, fontSize: 11 }}>ΔP PDT-{def.id.slice(1)}4 (H {DP_H} / HH {DP_HH})</span></span>}
        {def.lim.nh3 && <span><b style={{ fontSize: 20 }}>{fmt(u.nh3, 1)}</b> <span style={{ color: K.dim, fontSize: 11 }}>NH₃</span></span>}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "8px 0", alignItems: "center" }}>
        <label style={{ fontSize: 11, color: K.dim }}>Tải sản xuất <input type="number" min="0" max="100" step="10" value={Math.round(u.feedTgt * 100)} onChange={e => op(() => setFeed(g, sel, Math.min(1, Math.max(0, Number(e.target.value) / 100))))} style={input} /> %</label>
        <button className="dc-b stp" onClick={() => op(() => setFeed(g, sel, 0))}>Dừng cấp liệu</button><button className="dc-b go" onClick={() => op(() => setFeed(g, sel, 1))}>Tải 100 %</button>
        <button className={`dc-b ${u.fan ? "stp" : "go"}`} onClick={() => op(() => fan(g, sel, !u.fan))}>{u.fan ? "Dừng quạt hút" : "Khởi động quạt hút"}</button>
        {def.kind !== "boiler" && <><button className="dc-b" onClick={() => op(() => pulse(g, sel))}>Rũ bụi thủ công</button><button className={`dc-b ${u.pulseAuto ? "on" : ""}`} onClick={() => op(() => { u.pulseAuto = !u.pulseAuto; })}>PDIC rũ bụi {u.pulseAuto ? "AUTO" : "MAN"}</button>
          <button className="dc-b" onClick={() => op(() => replaceBags(g, sel))} title="Chỉ khi đã dừng cấp liệu và quạt">Thay túi lọc thủng</button><button className="dc-b" onClick={() => op(() => restoreAir(g, sel))}>Khôi phục khí nén</button>{def.kind === "dryer" && <button className="dc-b" onClick={() => op(() => clearJam(g, sel))}>Thông van xoay cyclone</button>}</>}
        {def.kind === "boiler" && <><button className={`dc-b ${u.pumpA ? "on" : ""}`} onClick={() => op(() => pumpStart(g, sel, "A"))}>Bơm tuần hoàn A</button><button className={`dc-b ${u.pumpB ? "on" : ""}`} onClick={() => op(() => pumpStart(g, sel, "B"))}>Bơm tuần hoàn B (dự phòng)</button><button className="dc-b" onClick={() => op(() => primeNaoh(g, sel))}>Mồi bơm NaOH / bật dự phòng</button></>}</div>
      {def.kind === "boiler" && <div style={{ borderTop: `1px solid ${K.line}`, paddingTop: 8 }}><div style={{ fontWeight: 700 }}>AIC-{def.id.slice(1)}3 — Điều khiển pH dung dịch hấp thụ (châm NaOH)</div>
        <div style={{ display: "flex", gap: 6, margin: "6px 0", alignItems: "center", flexWrap: "wrap" }}>{["AUTO", "MAN"].map(m => <button key={m} className={`dc-b ${u.phMode === m ? "on" : ""}`} onClick={() => op(() => { u.phMode = m; })}>{m}</button>)}
          <label style={{ fontSize: 11, color: K.dim }}>SP <input type="number" step="0.1" min="6" max="9" value={u.phSp} onChange={e => op(() => { u.phSp = Math.min(9, Math.max(6, Number(e.target.value))); })} style={input} /></label><span style={{ fontSize: 11, color: K.dim }}>OUT {fmt(u.phOut * 100, 0)} %</span>{u.phMode === "MAN" && <input type="range" min="0" max="1" step="0.01" value={u.phOut} onChange={e => op(() => { u.phOut = Number(e.target.value); })} style={{ flex: 1, minWidth: 120 }} />}</div></div>}
      <div style={{ marginTop: 6 }}><button className="dc-b" onClick={() => patch({ fault: !ui.fault })}>🛠 Gây sự cố (giảng viên)</button>
        {ui.fault && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>{Object.keys(FAULTS).filter(f => (def.kind === "boiler") === ["naohLost", "pumpFail"].includes(f) || (f === "fanTrip")).map(f => <button key={f} className="dc-b" style={{ fontSize: 10 }} onClick={() => op(() => inject(g, sel, f))}>{FAULTS[f]}</button>)}</div>}</div>
    </div>

    <div className="dc-card"><div style={{ display: "flex", gap: 6, marginBottom: 8 }}>{[["alarms", `Báo động (${al.length})`], ["journal", "Nhật ký"], ["trends", "Xu hướng " + sel]].map(([k, l]) => <button key={k} className={`dc-b ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "alarms" && <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 480 }}><thead><tr style={{ color: K.dim, textAlign: "left" }}><th>Ưu tiên</th><th>Nội dung</th><th>Từ</th><th></th></tr></thead><tbody>{al.length === 0 && <tr><td colSpan="4" style={{ color: K.dim, padding: 8 }}>Không có báo động.</td></tr>}{al.map(a => <tr key={a.id} className={a.acked ? "" : "dc-blink"} style={{ borderTop: `1px solid ${K.line}`, color: a.pri === 1 ? "#ff9a9d" : "#f5c451" }}><td>P{a.pri}</td><td>{a.text}</td><td>{mm(a.since)}</td><td>{a.acked ? "✔" : ""}</td></tr>)}</tbody></table></div>}
      {tab === "journal" && <div style={{ maxHeight: 260, overflowY: "auto", fontSize: 11 }}>{g.log.length === 0 && <div style={{ color: K.dim }}>Chưa có sự kiện.</div>}{g.log.slice(0, 80).map((l, i) => <div key={i} style={{ padding: "2px 0", color: /BÁO ĐỘNG|SỰ CỐ|KHÔNG ĐẠT/.test(l.text) ? "#ff9a9d" : /Trở về|ĐẠT/.test(l.text) ? K.ok : K.txt }}><span style={{ color: K.dim }}>{mm(l.t)}</span> {l.text}</div>)}</div>}
      {tab === "trends" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 8 }}>
        <Trend title={`${sel} bụi ống khói (mg/Nm³)`} data={H} series={Object.assign([{ key: "dust", label: "bụi", color: "#e0a526", d: 0 }], { refs: [{ v: def.lim.dust, c: K.crit }] })} />
        {def.kind !== "boiler" ? <Trend title={`${sel} ΔP túi lọc (mmH₂O)`} data={H} series={Object.assign([{ key: "dp", label: "ΔP", color: "#4c9be8", d: 0 }], { refs: [{ v: DP_H, c: K.warn }, { v: DP_HH, c: K.crit }] })} /> : <><Trend title="SO₂ ống khói (mg/Nm³)" data={H} series={Object.assign([{ key: "so2", label: "SO₂", color: "#e5484d", d: 0 }], { refs: [{ v: def.lim.so2, c: K.crit }] })} /><Trend title="pH dung dịch hấp thụ" data={H} series={Object.assign([{ key: "ph", label: "pH", color: "#3fb6d8", d: 2 }], { refs: [{ v: PH_SP, c: K.ok }, { v: 6, c: K.warn }] })} /></>}
        <Trend title={`${sel} lưu lượng hút (nghìn m³/h)`} data={H} series={[{ key: "flow", label: "Q", color: "#3fae7b", d: 0 }]} /></div>}
    </div>
    <div style={{ fontSize: 10, color: K.dim, lineHeight: 1.6 }}>Nguồn dữ liệu: Phụ lục 2 GPMT 2986/GPMT-STNMT (28/04/2023) — 8 nguồn, 7 dòng thải có hệ thống xử lý (nguồn 08 máy phát dự phòng không có xử lý, không đưa vào mô hình). Mã tag (AT-/PDT-/AIT-/AIC-) và hằng số động học do mô hình đề xuất để đào tạo, chưa có trong bản vẽ — cần kỹ sư duyệt; khí thô trước xử lý, hiệu suất và các giá trị đo là số giả định, không dùng cho báo cáo hay thiết kế.</div>
  </div>;
}
