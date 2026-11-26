"use client";
// @ts-nocheck
// Mô phỏng vận hành 3D Nhà máy Phân bón Bình Điền – Long An: giao diện (thanh công cụ, sơ đồ công nghệ, báo động, bài tập, khí tượng).
import { useEffect, useRef, useState } from "react";
import { createSim, step, start, stop, emergencyStop, action, ack, injectFault, presetRunning, runSequence, nextHint, EQUIP, EQ, ZONES, LIMITS,
  FAULT_LABELS, EXERCISES, beginExercise, updateExercise } from "./plantSim.ts";
import { computePlume, gridToImage, sourcesFromSim, POL_LABEL, POL_LIMIT } from "./plume.ts";
import { createPlantScene, ZONE_VIEWS, PIPE_SYSTEMS, PLANT_ROT_DEG } from "./scene3d.ts";

const K = { bg: "#0b1220", panel: "rgba(13,19,32,.93)", line: "#22314a", txt: "#e6edf7", dim: "#8fa3bf", green: "#35e08a", amber: "#f2c200", red: "#ef4444", blue: "#3b9eff" };
const CSS = `
.s3l{font:600 11px/1.2 system-ui,sans-serif;background:rgba(255,255,255,.94);color:#14202e;padding:3px 7px;border-radius:5px;border:1px solid #9fb0c4;box-shadow:0 1px 4px rgba(0,0,0,.25)}
.s3l-ctx{background:rgba(30,41,59,.82);color:#dbe6f3;border-color:transparent;font-weight:500;pointer-events:none!important;cursor:default!important}
.s3l-sel{background:#ffc400;border-color:#a87d00}.s3l-trip{background:#ef4444;color:#fff;border-color:#7f1d1d}
.sb{background:#16233a;color:${K.txt};border:1px solid ${K.line};border-radius:6px;padding:6px 10px;font:600 12px system-ui;cursor:pointer;white-space:nowrap}
.sb:hover{background:#1e3050}.sb.on{background:#1f4e8c;border-color:#3b9eff}.sb.go{background:#12603c;border-color:#1f9d62}.sb.stp{background:#7a2226;border-color:#c0392b}.sb[disabled]{opacity:.45;cursor:default}
`;
const fmt = (v, d = 0) => Number(v).toFixed(d);
const clock = t => { const m = Math.floor(t / 60), s = Math.floor(t % 60); return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`; };

// Sơ đồ công nghệ: vị trí [cột, hàng]
const NODES = {
  BT01: [0, 0], MN01: [1, 0], BT02: [2, 0], SG01: [3, 0], TR01: [4, 0], TH01: [5, 0],
  LD01: [1, 1], CC01: [2, 1], QT01: [3, 1], SY01: [4, 1], BT03: [5, 1],
  HT01: [1, 2], QH01: [2, 2], LB01: [3, 2], XC01: [4, 2], LN01: [5, 2],
  DB01: [3, 3], BT04: [4, 3], SG02: [5, 3],
  LH01: [0, 4], LH02: [1, 4], BM01: [3, 4], TK01: [4, 4], DL01: [5, 4],
};
const FLOW = [["BT01", "MN01"], ["MN01", "BT02"], ["BT02", "SG01"], ["SG01", "TR01"], ["TR01", "TH01"], ["TH01", "BT03"], ["BT03", "SY01"],
  ["LD01", "CC01"], ["CC01", "QT01"], ["QT01", "SY01"], ["SY01", "XC01"], ["XC01", "LB01"], ["LB01", "QH01"], ["QH01", "HT01"],
  ["SY01", "LN01"], ["LN01", "SG02"], ["SG02", "BT04"], ["BT04", "DB01"], ["BM01", "TK01"], ["TK01", "DL01"]];
const PASSIVE_IDS = ["CC01", "XC01"];

function Panel({ title, x = 0, y = 0, w, narrow, children, onClose, right }) {
  const [pos, setPos] = useState({ x, y }); const drag = useRef(null);
  const st = narrow ? { position: "static", width: "100%", marginTop: 8 } : { position: "absolute", left: pos.x, top: pos.y, width: w, zIndex: 5 };
  return <div style={{ ...st, background: K.panel, border: `1px solid ${K.line}`, borderRadius: 8, color: K.txt, boxShadow: "0 6px 20px rgba(0,0,0,.4)", backdropFilter: "blur(3px)" }}>
    <div onPointerDown={e => { if (narrow) return; drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }; e.currentTarget.setPointerCapture(e.pointerId); }}
      onPointerMove={e => { if (drag.current) setPos({ x: Math.max(0, e.clientX - drag.current.dx), y: Math.max(0, e.clientY - drag.current.dy) }); }}
      onPointerUp={() => { drag.current = null; }}
      style={{ padding: "6px 10px", font: "700 12px system-ui", cursor: narrow ? "default" : "move", borderBottom: `1px solid ${K.line}`, display: "flex", justifyContent: "space-between", gap: 8, userSelect: "none" }}>
      <span>{title}</span><span style={{ display: "flex", gap: 8 }}>{right}{onClose && <span onClick={onClose} style={{ cursor: "pointer", color: K.dim }}>✕</span>}</span></div>
    <div style={{ padding: 8 }}>{children}</div></div>;
}

export default function PlantSim() {
  const wrap = useRef(null), host = useRef(null), sceneRef = useRef(null), simRef = useRef(createSim()), runRef = useRef({ speed: 1, paused: false });
  const exRef = useRef(null), plumeRef = useRef({ on: false, pol: "tsp", stab: "D", last: 0 }), sel = useRef(null);
  const [, setTick] = useState(0); const [narrow, setNarrow] = useState(false); const [webgl, setWebgl] = useState(true);
  const [pipeOn, setPipeOn] = useState(() => Object.fromEntries(Object.keys(PIPE_SYSTEMS).map(k => [k, true])));
  useEffect(() => { for (const k of Object.keys(pipeOn)) sceneRef.current?.setPipeVisible?.(k, pipeOn[k]); }, [pipeOn, webgl]);
  const [ui, setUi] = useState({ labels: true, xray: false, hints: true, shadows: true, plume: false, pol: "tsp", stab: "D", windFrom: 270, u10: 3, speed: 1, paused: false });
  const [zone, setZone] = useState(ZONE_VIEWS.all.name); const [selected, setSelected] = useState(null);
  const [show, setShow] = useState({ diag: true, info: true, alarm: false, ex: false, met: false });
  const [toast, setToast] = useState(""); const [exId, setExId] = useState(EXERCISES[0].id);
  const toastT = useRef(0);
  const say = m => { setToast(m); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(""), 5000); };
  const S = simRef.current;

  useEffect(() => {
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    const onR = () => setNarrow((wrap.current?.clientWidth || window.innerWidth) < 900); onR(); window.addEventListener("resize", onR); const ro = new ResizeObserver(onR); wrap.current && ro.observe(wrap.current);
    let sc = null;
    try {
      sc = createPlantScene(host.current, { getSim: () => simRef.current, onSelect: id => { sel.current = id; setSelected(id); sceneRef.current?.select(id); }, onZone: setZone });
      sceneRef.current = sc;
    } catch (e) { console.error(e); setWebgl(false); }
    const iv = setInterval(() => {
      const r = runRef.current; if (r.paused) return;
      for (let i = 0; i < r.speed; i++) step(simRef.current, 0.1);
      if (exRef.current) exRef.current.run = updateExercise(simRef.current, exRef.current.ex, exRef.current.run);
      const pl = plumeRef.current;
      if (pl.on && sceneRef.current && Date.now() - pl.last > 1500) {
        pl.last = Date.now(); const f = sceneRef.current.flagsRef();
        const g = computePlume({ sources: sourcesFromSim(simRef.current.eq, simRef.current.pv), pol: pl.pol, u10: f.u10, stability: pl.stab, windFromDeg: f.windFrom + PLANT_ROT_DEG }, 128, 450, 0, 0);
        const img = gridToImage(g, Math.max(g.max, 1e-6), POL_LIMIT[pl.pol]); sceneRef.current.setPlume(img.data || img, g.n, g.half, 0, 0, true);
        pl.max = g.max; pl.maxX = g.maxX; pl.maxZ = g.maxZ;
      }
    }, 100);
    const uv = setInterval(() => setTick(t => t + 1), 250);
    return () => { clearInterval(iv); clearInterval(uv); window.removeEventListener("resize", onR); ro.disconnect(); sc && sc.dispose(); st.remove(); };
  }, []);

  const patch = p => { const n = { ...ui, ...p }; setUi(n); runRef.current.speed = n.speed; runRef.current.paused = n.paused;
    sceneRef.current?.setFlags({ labels: n.labels, xray: n.xray, hints: n.hints, shadows: n.shadows, windFrom: n.windFrom, u10: n.u10 });
    Object.assign(plumeRef.current, { on: n.plume, pol: n.pol, stab: n.stab, last: 0 });
    if (!n.plume) sceneRef.current?.setPlume(null, 0, 0, 0, 0, false); };
  useEffect(() => { patch({}); }, [webgl]);

  // Gợi ý: khi có bài tập khởi động hoặc bật gợi ý, trỏ tới thiết bị cần thao tác kế tiếp
  const prodOn = EQUIP.some(d => d.zone !== "wwtp" && !PASSIVE_IDS.includes(d.id) && S.eq[d.id].on);
  const hint = ui.hints && !S.seq && !prodOn ? nextHint(S) : null;
  const exHint = exRef.current && !exRef.current.run.finished ? nextHint(S) : null;
  const hintId = (exHint || hint)?.id || null;
  useEffect(() => { sceneRef.current?.setFlags({ hintId }); });

  const eqList = EQUIP; const pv = S.pv;
  const act = (kind, id) => {
    if (kind === "tog") { const r = S.eq[id].on ? (stop(S, id, "operator"), { ok: true }) : start(S, id, "operator"); if (!r.ok && r.reason !== "Đã chạy") say(r.reason); }
    setTick(t => t + 1);
  };
  const sev = pv.dp > LIMITS.dpTrip || pv.tsp > LIMITS.tsp || pv.nh3 > LIMITS.nh3;
  const nUnack = S.alarms.filter(a => !S.acked[a.id]).length;
  const focus = k => sceneRef.current?.focus(k);
  const btn = (txt, on, fn, cls = "") => <button className={`sb ${on ? "on" : ""} ${cls}`} onClick={fn}>{txt}</button>;
  const selDef = selected ? EQ[selected] : null, selSt = selected ? S.eq[selected] : null;
  const ex = exRef.current ? EXERCISES.find(e => e.id === exRef.current.run.id) : null;

  const KPI = (l, v, u, bad) => <div style={{ padding: "4px 10px", borderRight: `1px solid ${K.line}`, minWidth: 74 }}><div style={{ fontSize: 10, color: K.dim }}>{l}</div>
    <div style={{ font: "700 14px system-ui", color: bad ? K.red : K.txt }}>{v}<span style={{ fontSize: 10, color: K.dim, marginLeft: 3 }}>{u}</span></div></div>;

  const toolbar = <>
      <div style={narrow ? { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" } : { position: "absolute", left: 8, right: 8, top: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", zIndex: 6 }}>
        <button className="sb go" onClick={() => { runSequence(S, "start"); setTick(t => t + 1); }}>▶ Khởi động máy</button>
        <button className="sb stp" onClick={() => { runSequence(S, "stop"); setTick(t => t + 1); }}>■ Dừng máy</button>
        <button className="sb" onClick={() => patch({ paused: !ui.paused })}>{ui.paused ? "⏵ Tiếp tục" : "⏸ Tạm dừng"}</button>
        <span style={{ display: "flex", gap: 2 }}>{[1, 2, 5].map(v => btn(`${v}×`, ui.speed === v, () => patch({ speed: v })))}</span>
        <span style={{ width: 8 }} />
        {btn("📚 Bài tập", show.ex, () => setShow({ ...show, ex: !show.ex }))}
        {btn("🗺 Sơ đồ", show.diag, () => setShow({ ...show, diag: !show.diag }))}
        {btn("ℹ Thiết bị", show.info, () => setShow({ ...show, info: !show.info }))}
        {btn("🌬 Khí tượng", show.met, () => setShow({ ...show, met: !show.met }))}
        <button className="sb" style={{ position: "relative", background: nUnack ? "#7a2226" : undefined }} onClick={() => { setShow({ ...show, alarm: !show.alarm }); }}>🔔 Báo động{nUnack > 0 && <b style={{ marginLeft: 4, color: "#ffd0d0" }}>{nUnack}</b>}</button>
      </div>
      <div style={narrow ? { display: "flex", gap: 4, flexWrap: "wrap" } : { position: "absolute", left: 8, top: 46, display: "flex", gap: 4, flexWrap: "wrap", zIndex: 6, maxWidth: "70%" }}>
        {[["all", "Toàn cảnh"], ["raw", "Nguyên liệu"], ["gran", "Tạo hạt"], ["dry", "Sấy"], ["air", "Khí thải"], ["boiler", "Lò hơi"], ["bag", "Đóng bao"], ["wwtp", "Nước thải"], ["top", "Từ trên"]].map(([k, l]) => <button key={k} className="sb" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => focus(k)}>{l}</button>)}
      </div>
  </>;
  const kpiBar = () => (<div style={narrow ? { display: "flex", flexWrap: "wrap", background: K.panel, border: `1px solid ${K.line}`, borderRadius: 8, marginTop: 8 } : { position: "absolute", left: 8, bottom: 8, zIndex: 6, display: "flex", flexWrap: "wrap", background: K.panel, border: `1px solid ${K.line}`, borderRadius: 8, maxWidth: "calc(100% - 150px)" }}>
        {KPI("Thời gian", clock(S.t), "")}{KPI("Sản lượng", fmt(pv.tph, 1), "t/h")}{KPI("Công suất", fmt(pv.kw), "kW")}
        {KPI("Sấy vào/ra", `${fmt(pv.dryerIn)}/${fmt(pv.dryerOut)}`, "°C", pv.dryerOut > LIMITS.dryerOut)}{KPI("ΔP lọc bụi", fmt(pv.dp), "mmH₂O", pv.dp > LIMITS.dp)}
        {KPI("Bụi", fmt(pv.tsp), "mg/Nm³", pv.tsp > LIMITS.tsp)}{KPI("NH₃", fmt(pv.nh3, 1), "mg/Nm³", pv.nh3 > LIMITS.nh3)}{KPI("Hơi", fmt(pv.steam, 1), "bar")}
        {KPI("DO", fmt(pv.DO, 1), "mg/L", pv.DO < LIMITS.DOmin)}{KPI("pH", fmt(pv.pH, 1), "", pv.pH < LIMITS.pHmin || pv.pH > LIMITS.pHmax)}{KPI("COD", fmt(pv.cod), "mg/L", pv.cod > LIMITS.cod)}{KPI("NH₄⁺", fmt(pv.nh4, 1), "mg/L", pv.nh4 > LIMITS.nh4)}
      </div>);
  const diagram = (narrow2) => <>
    {show.diag && <Panel title="Sơ đồ công nghệ (bấm để đóng/cắt)" x={12} y={92} w={380} narrow={narrow2} onClose={() => setShow({ ...show, diag: false })}
      right={<label style={{ fontSize: 11, color: S.bypass ? K.amber : K.dim, cursor: "pointer" }}><input type="checkbox" checked={S.bypass} onChange={e => { S.bypass = e.target.checked; setTick(t => t + 1); }} /> Bỏ khóa liên động</label>}>
      <svg viewBox="0 0 420 322" width="100%" style={{ display: "block", background: "#0f1a2c", borderRadius: 6 }}>
        {FLOW.map(([a, b], i) => { const A = NODES[a], B = NODES[b]; const on = S.eq[a].on && S.eq[b].on;
          return <line key={i} x1={A[0] * 68 + 40} y1={A[1] * 62 + 30} x2={B[0] * 68 + 40} y2={B[1] * 62 + 30} stroke={on ? K.green : "#3b4a63"} strokeWidth={on ? 3 : 2} strokeDasharray={on ? "6 4" : ""}>{on && <animate attributeName="stroke-dashoffset" from="20" to="0" dur="0.8s" repeatCount="indefinite" />}</line>; })}
        {Object.entries(NODES).map(([id, [c, r]]) => { const e = S.eq[id], sw = EQ[id].kw > 0 || PASSIVE_IDS.includes(id); const col = e.tripped ? K.red : e.on ? (e.load > 0.5 ? K.green : K.amber) : "#4b5a73";
          return <g key={id} transform={`translate(${c * 68 + 10},${r * 62 + 12})`} style={{ cursor: PASSIVE_IDS.includes(id) ? "default" : "pointer" }} onClick={() => { !PASSIVE_IDS.includes(id) && act("tog", id); sel.current = id; setSelected(id); sceneRef.current?.select(id); }}>
            <rect width="60" height="36" rx="5" fill="#16233a" stroke={selected === id ? "#ffc400" : col} strokeWidth={selected === id ? 3 : 1.6} />
            <text x="30" y="15" textAnchor="middle" fill={K.txt} fontSize="11" fontWeight="700">{id}</text>
            <text x="30" y="29" textAnchor="middle" fill={col} fontSize="9" fontWeight="700">{e.tripped ? "SỰ CỐ" : e.on ? (e.load > 0.5 ? "CHẠY" : "KHỞI ĐỘNG") : sw ? "DỪNG" : "—"}</text>
            <circle cx="54" cy="6" r="3.5" fill={col} /></g>; })}
        <text x="10" y="316" fill={K.dim} fontSize="9">Khí nóng: LD01→CC01→QT01→SY01 · Khí thải: SY01→XC01→LB01→QH01→HT01→ống khói 22 m · Lò hơi: chỉ một lò chạy</text>
      </svg>
      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
        <button className="sb go" onClick={() => { runSequence(S, "start"); setTick(t => t + 1); }}>▶ Khởi động tự động</button>
        <button className="sb" onClick={() => { runSequence(S, "stop"); setTick(t => t + 1); }}>■ Dừng tự động</button>
        <button className="sb stp" onClick={() => { emergencyStop(S); setTick(t => t + 1); }}>⛔ Dừng khẩn cấp</button>
        <button className="sb" onClick={() => { presetRunning(S); setTick(t => t + 1); }}>⚡ Đặt chế độ chạy ổn định</button>
        <button className="sb" onClick={() => { simRef.current = createSim(); exRef.current = null; setTick(t => t + 1); }}>↺ Đặt lại</button></div>
    </Panel>}
  </>;
  const side = () => <>
    {show.info && <Panel title={selDef ? `${selDef.id} · ${selDef.name}` : "Thông tin thiết bị"} w={300} narrow={true} onClose={() => setShow({ ...show, info: false })}>
      {selDef ? <div style={{ fontSize: 12, lineHeight: 1.5 }}>
        <div style={{ color: K.dim }}>{ZONES[selDef.zone]} · {selDef.kw} kW</div><div style={{ margin: "4px 0" }}>{selDef.desc}</div>
        <div>Trạng thái: <b style={{ color: selSt.tripped ? K.red : selSt.on ? K.green : K.dim }}>{selSt.tripped ? `SỰ CỐ — ${selSt.reason}` : selSt.on ? "ĐANG CHẠY" : "DỪNG"}</b></div>
        {selDef.requires.length > 0 && <div style={{ color: K.dim }}>Liên động: cần chạy {selDef.requires.join(", ")} trước</div>}
        {selDef.excludes && <div style={{ color: K.dim }}>Không chạy cùng {selDef.excludes.join(", ")}</div>}
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          {!PASSIVE_IDS.includes(selDef.id) && <button className={`sb ${selSt.on ? "stp" : "go"}`} onClick={() => act("tog", selDef.id)}>{selSt.on ? "Dừng" : "Khởi động"}</button>}
          {(selDef.actions || []).map(a => <button key={a.id} className="sb" title={a.hint} onClick={() => { action(S, selDef.id, a.id); setTick(t => t + 1); }}>{a.label}</button>)}</div></div>
        : <div style={{ fontSize: 12, color: K.dim }}>Bấm vào thiết bị trên cảnh 3D hoặc sơ đồ để xem thông tin và điều khiển.</div>}
    </Panel>}
    {show.alarm && <Panel title={`Báo động & nhật ký ${S.alarms.length ? `(${S.alarms.length})` : ""}`} w={330} narrow={true} onClose={() => setShow({ ...show, alarm: false })}
      right={<button className="sb" style={{ padding: "1px 8px" }} onClick={() => { ack(S); setTick(t => t + 1); }}>Ghi nhận</button>}>
      {S.alarms.map(a => <div key={a.id} style={{ fontSize: 11, padding: "2px 6px", marginBottom: 2, borderRadius: 4, background: a.level === "crit" ? "rgba(239,68,68,.25)" : "rgba(242,192,0,.2)", color: S.acked[a.id] ? K.dim : K.txt }}>{a.level === "crit" ? "⛔" : "⚠"} {a.text}</div>)}
      <div style={{ maxHeight: 150, overflowY: "auto", fontSize: 11, marginTop: 4 }}>
        {S.log.slice(0, 40).map((l, i) => <div key={i} style={{ color: l.kind === "trip" || l.kind === "alarm" ? "#ff8a8a" : l.kind === "clear" ? K.green : l.kind === "info" ? K.blue : K.txt }}>
          <span style={{ color: K.dim }}>{new Date(l.ts).toTimeString().slice(0, 8)}</span> {l.text}</div>)}</div>
      <div style={{ marginTop: 6, fontSize: 11, color: K.dim }}>Gây sự cố để luyện xử lý:</div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 3 }}>{Object.keys(FAULT_LABELS).map(f => <button key={f} className="sb" style={{ fontSize: 10, padding: "3px 6px" }} onClick={() => { injectFault(S, f); setTick(t => t + 1); }}>{FAULT_LABELS[f]}</button>)}</div>
    </Panel>}
    {show.ex && <Panel title="Bài tập thực hành" w={330} narrow={true} onClose={() => setShow({ ...show, ex: false })}>
      <select value={exId} onChange={e => setExId(e.target.value)} style={{ width: "100%", background: "#16233a", color: K.txt, border: `1px solid ${K.line}`, borderRadius: 6, padding: 5, fontSize: 12 }}>
        {EXERCISES.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select>
      <div style={{ fontSize: 11, color: K.dim, margin: "5px 0" }}>{EXERCISES.find(e => e.id === exId).goal}</div>
      <button className="sb go" onClick={() => { const e = EXERCISES.find(x => x.id === exId); const r = beginExercise(S, e); simRef.current = r.sim; exRef.current = { ex: e, run: r.run }; setTick(t => t + 1); }}>Bắt đầu bài tập</button>
      {ex && <div style={{ marginTop: 8, fontSize: 12 }}>
        {ex.steps.map((s, i) => <div key={i} style={{ color: i < exRef.current.run.done ? K.green : i === exRef.current.run.done ? K.txt : K.dim }}>{i < exRef.current.run.done ? "✔" : i === exRef.current.run.done ? "▶" : "○"} {s.text}</div>)}
        {exRef.current.run.finished && <div style={{ marginTop: 6, color: K.green, fontWeight: 700 }}>Hoàn thành sau {clock(exRef.current.run.durationS)} — thao tác sai: {S.mistakes}</div>}
        {exRef.current.run.failed && <div style={{ marginTop: 6, color: K.red, fontWeight: 700 }}>Không đạt: {exRef.current.run.failed}</div>}</div>}
    </Panel>}
    {show.met && <Panel title="Khí tượng & vệt khói (mô hình Gauss)" w={310} narrow={true} onClose={() => setShow({ ...show, met: false })}>
      <div style={{ fontSize: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <label>Gió thổi từ (°)<input type="range" min="0" max="350" step="10" value={ui.windFrom} onChange={e => patch({ windFrom: +e.target.value })} style={{ width: "100%" }} /><b>{ui.windFrom}°</b></label>
        <label>Tốc độ gió (m/s)<input type="range" min="1" max="10" step="0.5" value={ui.u10} onChange={e => patch({ u10: +e.target.value })} style={{ width: "100%" }} /><b>{ui.u10}</b></label>
        <label>Ổn định khí quyển<select value={ui.stab} onChange={e => patch({ stab: e.target.value })} style={{ width: "100%" }}>{"ABCDEF".split("").map(c => <option key={c}>{c}</option>)}</select></label>
        <label>Chất ô nhiễm<select value={ui.pol} onChange={e => patch({ pol: e.target.value })} style={{ width: "100%" }}>{Object.keys(POL_LABEL).map(c => <option key={c} value={c}>{POL_LABEL[c]}</option>)}</select></label></div>
      <label style={{ fontSize: 12, display: "block", marginTop: 6 }}><input type="checkbox" checked={ui.plume} onChange={e => patch({ plume: e.target.checked })} /> Hiển thị nồng độ mặt đất 1 giờ (thang màu theo cực đại; đỏ: vượt {POL_LIMIT[ui.pol]} μg/m³)</label>
      {ui.plume && plumeRef.current.max != null && <div style={{ fontSize: 11, color: K.dim, marginTop: 4 }}>Cực đại: <b style={{ color: plumeRef.current.max > POL_LIMIT[ui.pol] ? K.red : K.green }}>{fmt(plumeRef.current.max, 1)} μg/m³</b> tại ({fmt(plumeRef.current.maxX)}, {fmt(-plumeRef.current.maxZ)}) m Đ–B từ tâm</div>}
      <div style={{ fontSize: 10, color: K.dim, marginTop: 4 }}>Nguồn phát thải lấy từ trạng thái thiết bị đang chạy; giới hạn QCVN 05:2023 cần đối chiếu bản gốc. Bố trí mặt bằng là sơ đồ minh họa, chưa phải bản đồ đo đạc.</div>
    </Panel>}
  </>;

  return <div ref={wrap} style={{ color: K.txt }}>
    {narrow && <div style={{ display: "grid", gap: 6, marginBottom: 8 }}>{toolbar}</div>}
    <div style={{ position: "relative", height: narrow ? "62vh" : "calc(100vh - 150px)", minHeight: 460, background: K.bg, borderRadius: 10, overflow: "hidden", border: `1px solid ${K.line}` }}>
      <div ref={host} style={{ position: "absolute", inset: 0 }} />
      {!webgl && <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: K.amber }}>Trình duyệt không hỗ trợ WebGL — không dựng được cảnh 3D.</div>}
      {!narrow && toolbar}
      <div style={{ position: "absolute", right: 8, bottom: 8, display: "flex", flexDirection: "column", gap: 4, zIndex: 6, alignItems: "flex-end" }}>
        <details className="sb" style={{ padding: "3px 8px", fontSize: 11, maxWidth: 270 }}><summary style={{ cursor: "pointer" }}>Đường ống · chú giải</summary>
          {Object.entries(PIPE_SYSTEMS).map(([k, v]) => <label key={k} style={{ display: "flex", gap: 6, alignItems: "center", padding: "2px 0" }}><input type="checkbox" checked={!!pipeOn[k]} onChange={e => setPipeOn(o => ({ ...o, [k]: e.target.checked }))} /><span style={{ width: 22, height: 9, borderRadius: 3, flex: "none", background: `linear-gradient(90deg,#${v.color.toString(16).padStart(6, "0")} 70%,#${v.band.toString(16).padStart(6, "0")} 70%)`, border: "1px solid #0006" }} />{v.name}</label>)}
          <div style={{ color: "#8fa0b4", marginTop: 3, lineHeight: 1.5 }}>Mũi tên trên ống chạy theo chiều dòng khi thiết bị đang chạy; đai trắng/màu = bảo ôn · mặt bích · van tay quay · gối đỡ.</div></details>
        {[["labels", "Nhãn"], ["xray", "Xuyên thấu"], ["hints", "Gợi ý"], ["shadows", "Bóng đổ"]].map(([k, l]) => <label key={k} className="sb" style={{ display: "flex", gap: 5, alignItems: "center", padding: "3px 8px", fontSize: 11 }}><input type="checkbox" checked={ui[k]} onChange={e => patch({ [k]: e.target.checked })} />{l}</label>)}
      </div>
      <div style={{ position: "absolute", left: "50%", bottom: 10, transform: "translateX(-50%)", zIndex: 6, background: "rgba(255,255,255,.92)", color: "#14202e", font: "700 12px system-ui", padding: "4px 14px", borderRadius: 14 }}>{zone}</div>
      {(hint || exHint) && ui.hints && <div style={{ position: "absolute", left: "50%", top: 84, transform: "translateX(-50%)", zIndex: 6, background: "#ffc400", color: "#3a2a00", font: "700 12px system-ui", padding: "4px 12px", borderRadius: 6 }}>Gợi ý: {(exHint || hint).text}</div>}
      {toast && <div style={{ position: "absolute", left: "50%", top: 116, transform: "translateX(-50%)", zIndex: 7, background: "#7a2226", border: "1px solid #ef4444", color: "#fff", font: "600 12px system-ui", padding: "6px 14px", borderRadius: 8, maxWidth: "80%" }}>⚠ {toast}</div>}
      {sev && <div style={{ position: "absolute", right: 8, top: 46, zIndex: 6, background: "#ef4444", color: "#fff", font: "700 12px system-ui", padding: "4px 10px", borderRadius: 6 }}>VƯỢT NGƯỠNG</div>}
      {!narrow && <div style={{ position: "absolute", right: 8, top: 84, width: 330, zIndex: 5, display: "flex", flexDirection: "column", gap: 8, maxHeight: "calc(100% - 200px)", overflowY: "auto", paddingRight: 2 }}>{side()}</div>}
      {!narrow && kpiBar()}
      {!narrow && diagram(false)}
    </div>
    {narrow && <div>{kpiBar()}{diagram(true)}{side()}</div>}
  </div>;
}
