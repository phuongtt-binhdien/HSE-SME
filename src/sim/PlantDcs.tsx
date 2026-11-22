"use client";
// @ts-nocheck
// Màn hình DCS vận hành dây chuyền tạo hạt số 2 – Nguồn 04: mimic thiết bị, vòng PID TIC-301 (nhiệt độ ra thùng sấy → lò đốt) và PDIC-501 (ΔP túi lọc → rũ bụi),
// báo động, khóa liên động, xu hướng và bài tập đào tạo (khởi động/dừng, ΔP cao, NH₃ vượt, HTXLNT).
import { useEffect, useRef, useState } from "react";
import { createSim, step, start, stop, emergencyStop, action, ack, injectFault, presetRunning, runSequence, nextHint, EQUIP, EQ, ZONES, LIMITS, FAULT_LABELS, EXERCISES, beginExercise, updateExercise, PASSIVE } from "./plantSim.ts";
import { K, fmt, clock, Trend, DCS_CSS } from "./DcsScreen.tsx";

// Vị trí [cột, hàng] — theo dòng vật liệu và đường khí nóng/khí thải của Nguồn 04
const NODES = { BT01: [0, 0], MN01: [1, 0], BT02: [2, 0], SG01: [3, 0], TR01: [4, 0], TH01: [5, 0],
  LD01: [1, 1], CC01: [2, 1], QT01: [3, 1], SY01: [4, 1], BT03: [5, 1],
  HT01: [1, 2], QH01: [2, 2], LB01: [3, 2], XC01: [4, 2], LN01: [5, 2], DB01: [3, 3], BT04: [4, 3], SG02: [5, 3],
  LH01: [0, 4], LH02: [1, 4], BM01: [3, 4], TK01: [4, 4], DL01: [5, 4] };
const FLOW = [["BT01", "MN01", "m"], ["MN01", "BT02", "m"], ["BT02", "SG01", "m"], ["SG01", "TR01", "m"], ["TR01", "TH01", "m"], ["TH01", "BT03", "m"], ["BT03", "SY01", "m"],
  ["LD01", "CC01", "g"], ["CC01", "QT01", "g"], ["QT01", "SY01", "g"], ["SY01", "XC01", "g"], ["XC01", "LB01", "g"], ["LB01", "QH01", "g"], ["QH01", "HT01", "g"],
  ["SY01", "LN01", "m"], ["LN01", "SG02", "m"], ["SG02", "BT04", "m"], ["BT04", "DB01", "m"], ["BM01", "TK01", "w"], ["TK01", "DL01", "w"]];
const PASS = ["CC01", "XC01"];
/** Đo lường (mã tag do mô hình đề xuất — cần kỹ sư duyệt). */
const INS = [
  { tag: "TT-302", desc: "Nhiệt độ khí nóng vào thùng sấy", unit: "°C", node: "LD01", key: "dryerIn", dec: 0, lim: { H: LIMITS.dryerIn } },
  { tag: "TT-301", desc: "Nhiệt độ khí ra thùng sấy", unit: "°C", node: "SY01", key: "dryerOut", dec: 0, lim: { H: LIMITS.dryerOut, HH: LIMITS.dryerOutTrip } },
  { tag: "PDT-501", desc: "ΔP túi lọc LB01", unit: "mmH₂O", node: "LB01", key: "dp", dec: 0, lim: { H: LIMITS.dp, HH: LIMITS.dpTrip } },
  { tag: "AT-601", desc: "Bụi ống khói", unit: "mg/Nm³", node: "HT01", key: "tsp", dec: 0, lim: { H: LIMITS.tsp } },
  { tag: "AT-602", desc: "NH₃ ống khói", unit: "mg/Nm³", node: "HT01", key: "nh3", dec: 1, lim: { H: LIMITS.nh3 } },
  { tag: "PT-801", desc: "Áp suất hơi lò hơi", unit: "bar", node: "LH01", key: "steam", dec: 1, lim: {} },
  { tag: "WT-901", desc: "Sản lượng sau đóng bao", unit: "t/h", node: "DB01", key: "tph", dec: 1, lim: {} },
];
const LOOPS = [
  { id: "tic", tag: "TIC-301", desc: "Điều khiển nhiệt độ ra thùng sấy", pv: "TT-301", key: "dryerOut", unit: "°C", spMin: 60, spMax: 105, outDesc: "Cấp nhiên liệu/gió lò đốt LD01", out: [0.2, 1] },
  { id: "pdic", tag: "PDIC-501", desc: "Rũ bụi túi lọc theo yêu cầu", pv: "PDT-501", key: "dp", unit: "mmH₂O", spMin: 150, spMax: 250, outDesc: "Van xung khí nén (AUTO: tự rũ khi ΔP > SP)", out: [0, 1] },
];
const stateOf = e => (e.tripped ? ["SỰ CỐ", K.crit] : e.on ? (e.load > 0.5 ? ["CHẠY", K.ok] : ["KHỞI ĐỘNG", K.warn]) : ["DỪNG", K.dim]);

export default function PlantDcs() {
  const S = useRef(createSim()); const run = useRef({ speed: 1, paused: false }); const hist = useRef([]); const ex = useRef(null);
  const [, tick] = useState(0); const [sel, setSel] = useState("TT-301"); const [tab, setTab] = useState("alarms"); const [ui, setUi] = useState({ speed: 1, paused: false, exId: "", fault: false, toast: "" }); const toastT = useRef(0);
  const say = m => { setUi(u => ({ ...u, toast: m })); clearTimeout(toastT.current); toastT.current = setTimeout(() => setUi(u => ({ ...u, toast: "" })), 5000); };
  useEffect(() => {
    const st = document.createElement("style"); st.textContent = DCS_CSS; document.head.appendChild(st);
    const iv = setInterval(() => { const q = run.current; if (q.paused) return; const s = S.current; for (let i = 0; i < q.speed; i++) { step(s, 0.1); if (ex.current) ex.current.run = updateExercise(s, ex.current.ex, ex.current.run); }
      const L = hist.current, last = L[L.length - 1]; if (!last || s.t - last.t >= 3) { L.push({ t: s.t / 3600, dryerIn: s.pv.dryerIn, dryerOut: s.pv.dryerOut, tSp: s.loops.tic.sp, fire: s.loops.tic.out * 100, dp: s.pv.dp, dpSp: s.loops.pdic.sp, tsp: s.pv.tsp, nh3: s.pv.nh3, tph: s.pv.tph }); if (L.length > 500) L.shift(); } }, 100);
    const uv = setInterval(() => tick(t => t + 1), 250); return () => { clearInterval(iv); clearInterval(uv); st.remove(); };
  }, []);
  const patch = p => { const n = { ...ui, ...p }; setUi(n); run.current.speed = n.speed; run.current.paused = n.paused; };
  const s = S.current, pv = s.pv, e = s.eq;
  const reset = () => { S.current = createSim(); hist.current = []; ex.current = null; patch({ exId: "" }); tick(t => t + 1); };
  const begin = id => { if (!id) return reset(); const x = EXERCISES.find(z => z.id === id); const r = beginExercise(S.current, x); S.current = r.sim; hist.current = []; ex.current = { ex: x, run: r.run }; patch({ exId: id, speed: 1 }); tick(t => t + 1); };
  const op = fn => { fn(); tick(t => t + 1); };
  const COLS = 6, CW = 126, RH = 100; const pos = n => ({ x: 8 + NODES[n][0] * CW, y: 34 + NODES[n][1] * RH });
  const alarms = s.alarms.slice().sort((a, b) => (a.level === "crit" ? 0 : 1) - (b.level === "crit" ? 0 : 1)); const unack = alarms.filter(a => !s.acked[a.id]).length;
  const tagAlarm = tag => { const k = { "TT-301": "dryout", "TT-302": "dryin", "PDT-501": "dp", "AT-601": "tsp", "AT-602": "nh3" }[tag]; const a = alarms.find(x => x.id === k); return a ? (a.level === "crit" ? 1 : 2) : 0; };
  const selIns = INS.find(i => i.tag === sel), selLoop = LOOPS.find(l => l.tag === sel), selEq = EQ[sel];
  const exr = ex.current; const exDef = exr?.ex;
  const col = a => (a === 1 ? K.crit : a === 2 ? K.warn : K.ok);

  return <div style={{ color: K.txt, display: "grid", gap: 10, fontFamily: "'DM Mono',ui-monospace,monospace" }}>
    <div className="dc-card" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <b style={{ fontSize: 13 }}>DCS · Dây chuyền tạo hạt số 2 — Nguồn 04</b><span style={{ color: K.dim, fontSize: 11 }}>ĐỀ XUẤT — cần kỹ sư duyệt</span>
      <button className="dc-b go" onClick={() => op(() => runSequence(s, "start"))}>▶ Khởi động tự động</button><button className="dc-b" onClick={() => op(() => runSequence(s, "stop"))}>■ Dừng tự động</button>
      <button className="dc-b stp" onClick={() => op(() => emergencyStop(s))}>⛔ Dừng khẩn cấp</button><button className="dc-b" onClick={() => op(() => presetRunning(s))}>⚡ Chạy ổn định</button><button className="dc-b" onClick={reset}>↺ Đặt lại</button>
      <button className="dc-b" onClick={() => patch({ paused: !ui.paused })}>{ui.paused ? "⏵" : "⏸"}</button>{[1, 5, 20].map(v => <button key={v} className={`dc-b ${ui.speed === v ? "on" : ""}`} onClick={() => patch({ speed: v })}>{v}×</button>)}
      <select className="dc-b" value={ui.exId} onChange={e2 => begin(e2.target.value)} style={{ maxWidth: 250 }}><option value="">Vận hành tự do</option>{EXERCISES.map(x => <option key={x.id} value={x.id}>Bài {x.title}</option>)}</select>
      <label className="dc-b" style={{ display: "flex", gap: 5, alignItems: "center" }}><input type="checkbox" checked={s.bypass} onChange={e2 => op(() => { s.bypass = e2.target.checked; })} />Bỏ khóa liên động</label>
      <span style={{ marginLeft: "auto", fontSize: 12, color: K.dim }}>{clock(s.t / 3600)} · {fmt(pv.tph, 1)} t/h · {fmt(pv.kw, 0)} kW</span>
    </div>
    <div className="dc-card" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", borderColor: alarms.some(a => a.level === "crit") ? K.crit : alarms.length ? K.warn : K.line }}>
      <span className={unack ? "dc-blink" : ""} style={{ fontWeight: 700, color: alarms.some(a => a.level === "crit") ? K.crit : alarms.length ? K.warn : K.ok }}>{alarms.length ? `⚠ P1 ${alarms.filter(a => a.level === "crit").length} · P2 ${alarms.filter(a => a.level !== "crit").length}` : "● Không có báo động"}</span>
      <span style={{ flex: 1, fontSize: 12, color: K.dim, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{alarms[0]?.text}</span>
      <button className="dc-b go" disabled={!unack} onClick={() => op(() => ack(s))}>ACK ({unack})</button></div>
    {ui.toast && <div className="dc-card" style={{ borderColor: K.crit, color: "#ffb4b4", fontSize: 12 }}>⚠ {ui.toast}</div>}
    {exDef && <div className="dc-card" style={{ borderColor: exr.run.finished ? K.ok : exr.run.failed ? K.crit : K.blue }}>
      <div style={{ fontWeight: 700 }}>🎯 Bài {exDef.title} {exr.run.finished ? "— ĐẠT ✔" : exr.run.failed ? "— KHÔNG ĐẠT ✖" : ""}</div><div style={{ fontSize: 12, color: K.dim, margin: "4px 0", lineHeight: 1.6 }}>{exDef.goal}</div>
      <div style={{ fontSize: 12, columns: 2 }}>{exDef.steps.map((z, i) => <div key={i} style={{ color: i < exr.run.done ? K.ok : i === exr.run.done ? K.txt : K.dim }}>{i < exr.run.done ? "✔" : i === exr.run.done ? "▶" : "○"} {z.text}</div>)}</div>
      {exr.run.failed && <div style={{ color: K.crit, marginTop: 6, fontSize: 12 }}>{exr.run.failed}</div>}{exr.run.finished && <div style={{ color: K.ok, marginTop: 6, fontSize: 12 }}>Hoàn thành sau {clock(exr.run.durationS / 3600)} — thao tác sai: {s.mistakes}</div>}
    </div>}

    <div className="dc-grid" style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0,1fr)" }}>
      <div className="dc-card" style={{ padding: 6 }}>
        <svg viewBox="0 0 770 552" width="100%" style={{ background: "#0a0f15", borderRadius: 6, display: "block" }}>
          <text x="10" y="20" fill={K.dim} fontSize="11">Mimic — vật liệu (xanh), khí nóng/khí thải (cam), hơi/nước thải (xanh lơ) · bấm thiết bị hoặc bong bóng đo để mở faceplate</text>
          {FLOW.map(([a, b, t], i) => { const A = pos(a), B = pos(b), on = e[a].on && e[b].on || (PASS.includes(a) && e[b].on) || (PASS.includes(b) && e[a].on); const c = t === "g" ? "#d9822b" : t === "w" ? "#3fb6d8" : "#4c9be8";
            return <line key={i} x1={A.x + 56} y1={A.y + 26} x2={B.x + 56} y2={B.y + 26} stroke={on ? c : "#2a3646"} strokeWidth="3" strokeDasharray={on ? "8 5" : ""}>{on && <animate attributeName="stroke-dashoffset" from="26" to="0" dur="1.1s" repeatCount="indefinite" />}</line>; })}
          {Object.keys(NODES).map(id => { const p = pos(id), x = e[id], [st, c] = stateOf(x), sk = !PASS.includes(id); const dis = EQ[id]; return <g key={id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }} onClick={() => setSel(id)}>
            <rect width="112" height="54" rx="4" fill="#111a24" stroke={sel === id ? "#fff" : c} strokeWidth={sel === id ? 2.5 : 1.5} />
            <text x="6" y="14" fontSize="10" fill={K.txt} fontWeight="700">{id}</text><text x="6" y="26" fontSize="7.5" fill={K.dim}>{dis.name.slice(0, 24)}</text>
            <text x="6" y="46" fontSize="9" fill={c} fontWeight="700">{PASS.includes(id) ? "THỤ ĐỘNG" : st}</text><rect x="64" y="40" width="42" height="5" fill="#0a0f15" /><rect x="64" y="40" width={42 * x.load} height="5" fill={c} />
          </g>; })}
          {INS.map(ins => { const p = pos(ins.node), k = INS.filter(z => z.node === ins.node).indexOf(ins), a = tagAlarm(ins.tag), v = pv[ins.key]; const ox = p.x + 12 + k * 56, oy = p.y + 71; return <g key={ins.tag} transform={`translate(${ox},${oy})`} style={{ cursor: "pointer" }} onClick={() => setSel(ins.tag)} className={a && !s.acked[{ "TT-301": "dryout", "TT-302": "dryin", "PDT-501": "dp", "AT-601": "tsp", "AT-602": "nh3" }[ins.tag]] ? "dc-blink" : ""}>
            <circle r="8" fill={a === 1 ? "#4a1518" : a === 2 ? "#4a3a10" : "#101821"} stroke={sel === ins.tag ? "#fff" : a ? col(a) : K.pipe} strokeWidth={sel === ins.tag ? 2.5 : 1.3} /><text y="2.5" fontSize="5.5" fill={K.txt} textAnchor="middle">{ins.tag.split("-")[0]}</text>
            <text x="12" y="3" fontSize="9" fill={a ? (a === 1 ? "#ff9a9d" : "#f5c451") : K.txt} fontWeight="700">{fmt(v, ins.dec)}</text></g>; })}
          <text x="8" y="522" fontSize="9" fill={K.dim}>Hàng 5: lò hơi (chỉ một lò chạy) và hệ thống xử lý nước thải (BM01, TK01, DL01 — xem tab DCS nước thải)</text>
          <text x="8" y="540" fontSize="10" fill={K.txt}>Ống khói S02 (22 m): bụi {fmt(pv.tsp, 0)} mg/Nm³ · NH₃ {fmt(pv.nh3, 1)} mg/Nm³ · thùng sấy vào/ra {fmt(pv.dryerIn, 0)}/{fmt(pv.dryerOut, 0)} °C · ΔP {fmt(pv.dp, 0)} mmH₂O</text>
        </svg>
      </div>

      <div className="dc-card">
        {selIns && <div><div style={{ fontWeight: 700 }}>{selIns.tag} — {selIns.desc}</div><div style={{ display: "flex", gap: 14, alignItems: "baseline", margin: "6px 0" }}><span style={{ fontSize: 30, fontWeight: 700, color: col(tagAlarm(selIns.tag)) }}>{fmt(pv[selIns.key], selIns.dec)}</span><span style={{ color: K.dim }}>{selIns.unit}</span><span style={{ fontSize: 11, color: K.dim }}>{Object.entries(selIns.lim).map(([k, v]) => `${k} ${v}`).join(" · ")}</span></div>
          {LOOPS.filter(l => l.pv === selIns.tag).map(l => { const L = s.loops[l.id]; return <div key={l.id} style={{ borderTop: `1px solid ${K.line}`, paddingTop: 8 }}>
            <div style={{ fontWeight: 700 }}>{l.tag} — {l.desc}</div>
            <div style={{ display: "flex", gap: 6, margin: "6px 0", flexWrap: "wrap", alignItems: "center" }}>{["AUTO", "MAN"].map(m => <button key={m} className={`dc-b ${L.mode === m ? "on" : ""}`} onClick={() => op(() => { L.mode = m; })}>{m}</button>)}
              <label style={{ fontSize: 11, color: K.dim }}>SP <input type="number" value={L.sp} min={l.spMin} max={l.spMax} onChange={e2 => op(() => { L.sp = Math.min(l.spMax, Math.max(l.spMin, Number(e2.target.value))); })} style={{ width: 70, background: "#0a0f15", color: K.txt, border: `1px solid ${K.line}`, borderRadius: 4, padding: 4 }} /> {l.unit}</label></div>
            {l.id === "tic" && <><div style={{ fontSize: 11, color: K.dim }}>OUT {fmt(L.out * 100, 0)} % — {l.outDesc} · PID Kp {L.kp} · Ti {L.ti} s</div>{L.mode === "MAN" && <input type="range" min="0.2" max="1" step="0.01" value={L.out} onChange={e2 => op(() => { L.out = Number(e2.target.value); })} style={{ width: "100%" }} />}<div style={{ height: 8, background: "#0a0f15", borderRadius: 3, marginTop: 4 }}><div style={{ height: 8, width: `${(L.out - 0.2) / 0.8 * 100}%`, background: K.blue, borderRadius: 3 }} /></div></>}
            {l.id === "pdic" && <><div style={{ fontSize: 11, color: s.pulseOn ? K.warn : K.dim }}>Xung khí nén: {s.pulseOn ? "ĐANG RŨ" : "chờ"} — {l.outDesc}</div><button className="dc-b" style={{ marginTop: 6 }} onClick={() => op(() => action(s, "LB01", "pulse"))}>Rũ bụi thủ công</button></>}
          </div>; })}</div>}
        {selEq && !selIns && (() => { const x = e[sel], [st, c] = stateOf(x); return <div><div style={{ fontWeight: 700 }}>{sel} — {selEq.name}</div><div style={{ fontSize: 11, color: K.dim, margin: "4px 0", lineHeight: 1.6 }}>{ZONES[selEq.zone]} · {selEq.kw} kW · {selEq.desc}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: c }}>{PASS.includes(sel) ? "THỤ ĐỘNG (luôn sẵn sàng)" : st}{x.tripped ? ` — ${x.reason}` : ""}</div>
          {selEq.requires.length > 0 && <div style={{ fontSize: 11, color: K.dim, marginTop: 4 }}>Liên động: cần {selEq.requires.join(", ")} chạy trước{selEq.excludes ? ` · không chạy cùng ${selEq.excludes.join(", ")}` : ""}</div>}
          {!PASS.includes(sel) && <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}><button className={`dc-b ${x.on ? "stp" : "go"}`} onClick={() => op(() => { if (x.on) stop(s, sel, "operator"); else { const r = start(s, sel, "operator"); if (!r.ok && r.reason !== "Đã chạy") say(r.reason); } })}>{x.on ? "Dừng" : "Khởi động"}</button>
            {(selEq.actions || []).map(a => <button key={a.id} className="dc-b" title={a.hint} onClick={() => op(() => action(s, sel, a.id))}>{a.label}</button>)}</div>}</div>; })()}
        <div style={{ marginTop: 10 }}><button className="dc-b" onClick={() => patch({ fault: !ui.fault })}>🛠 Gây sự cố (giảng viên)</button>
          {ui.fault && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>{Object.keys(FAULT_LABELS).map(f => <button key={f} className="dc-b" style={{ fontSize: 10 }} onClick={() => op(() => injectFault(s, f))}>{FAULT_LABELS[f]}</button>)}</div>}</div>
      </div>
    </div>

    <div className="dc-card"><div style={{ display: "flex", gap: 6, marginBottom: 8 }}>{[["alarms", `Báo động (${alarms.length})`], ["journal", "Nhật ký"], ["trends", "Xu hướng"]].map(([k, l]) => <button key={k} className={`dc-b ${tab === k ? "on" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "alarms" && <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 480 }}><thead><tr style={{ color: K.dim, textAlign: "left" }}><th>Ưu tiên</th><th>Nội dung</th><th>Từ</th><th></th></tr></thead><tbody>{alarms.length === 0 && <tr><td colSpan="4" style={{ color: K.dim, padding: 8 }}>Không có báo động.</td></tr>}{alarms.map(a => <tr key={a.id} className={s.acked[a.id] ? "" : "dc-blink"} style={{ borderTop: `1px solid ${K.line}`, color: a.level === "crit" ? "#ff9a9d" : "#f5c451" }}><td>{a.level === "crit" ? "P1" : "P2"}</td><td>{a.text}</td><td>{clock(a.since / 3600)}</td><td>{s.acked[a.id] ? "✔" : ""}</td></tr>)}</tbody></table></div>}
      {tab === "journal" && <div style={{ maxHeight: 260, overflowY: "auto", fontSize: 11 }}>{s.log.length === 0 && <div style={{ color: K.dim }}>Chưa có sự kiện.</div>}{s.log.slice(0, 80).map((l, i) => <div key={i} style={{ padding: "2px 0", color: l.kind === "trip" || l.kind === "alarm" ? "#ff9a9d" : l.kind === "clear" ? K.ok : l.kind === "op" ? K.blue : K.txt }}><span style={{ color: K.dim }}>{new Date(l.ts).toTimeString().slice(0, 8)}</span> {l.text}</div>)}</div>}
      {tab === "trends" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 8 }}>
        <Trend title="TT-301 nhiệt độ ra thùng sấy (°C)" data={hist.current} series={Object.assign([{ key: "dryerOut", label: "PV", color: "#4c9be8", d: 0 }, { key: "tSp", label: "SP", color: "#3fae7b", dash: "4 3", d: 0 }], { refs: [{ v: LIMITS.dryerOut, c: K.warn }] })} />
        <Trend title="TIC-301 OUT lò đốt (%) và TT-302 vào (°C)" data={hist.current} series={[{ key: "fire", label: "OUT%", color: "#e0a526", d: 0 }, { key: "dryerIn", label: "TT-302", color: "#d9822b", d: 0 }]} />
        <Trend title="PDT-501 ΔP túi lọc (mmH₂O)" data={hist.current} series={Object.assign([{ key: "dp", label: "ΔP", color: "#4c9be8", d: 0 }, { key: "dpSp", label: "SP", color: "#3fae7b", dash: "4 3", d: 0 }], { refs: [{ v: LIMITS.dp, c: K.warn }, { v: LIMITS.dpTrip, c: K.crit }] })} />
        <Trend title="Ống khói: bụi, NH₃ (mg/Nm³)" data={hist.current} series={Object.assign([{ key: "tsp", label: "Bụi", color: "#e0a526", d: 0 }, { key: "nh3", label: "NH₃", color: "#e5484d" }], { refs: [{ v: LIMITS.nh3, c: K.crit }] })} />
        <Trend title="Sản lượng (t/h)" data={hist.current} series={[{ key: "tph", label: "t/h", color: "#3fae7b" }]} /></div>}
    </div>
    <div style={{ fontSize: 10, color: K.dim, lineHeight: 1.6 }}>Mã tag (TT-301, PDT-501…) và hai vòng PID do mô hình đề xuất — chưa có trong bản vẽ CN-04; kỹ sư tự động hóa/vận hành cần duyệt. Ngưỡng ΔP 260/300 mmH₂O (MT-QP.01), bụi 160 và NH₃ 40 mg/Nm³, nhiệt độ ra thùng sấy 110/150 °C là các giá trị đã dùng trong mô phỏng 3D; mô hình chỉ dùng đào tạo.</div>
  </div>;
}
