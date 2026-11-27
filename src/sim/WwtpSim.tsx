"use client";
// @ts-nocheck
// Mô phỏng dòng chảy xử lý nước thải: đầu vào → HTXLNT 120 m³/ngày.đêm → sông Vàm Cỏ Đông.
import { useEffect, useRef, useState } from "react";
import { createWw, stepWw, settle, setInfluent, injectTracer, STAGES, PARAMS, INFLUENT, STANDARDS, exceedances, mixRiver, Q_DESIGN } from "./wwtp.ts";

const K = { bg: "#0b1220", panel: "#0f1a2c", line: "#22314a", txt: "#e6edf7", dim: "#8fa3bf", green: "#35e08a", amber: "#f2c200", red: "#ef4444", blue: "#3b9eff" };
const CSS = `.wb{background:#16233a;color:${K.txt};border:1px solid ${K.line};border-radius:6px;padding:6px 10px;font:600 12px system-ui;cursor:pointer;white-space:nowrap}.wb:hover{background:#1e3050}.wb.on{background:#1f4e8c;border-color:#3b9eff}.wb.go{background:#12603c;border-color:#1f9d62}.wb.stp{background:#7a2226;border-color:#c0392b}
.wcard{background:${K.panel};border:1px solid ${K.line};border-radius:10px;padding:12px;min-width:0}.wh{font:700 12px system-ui;color:${K.txt};margin-bottom:8px}`;
const fmt = (v, d = 1) => (v >= 1000 ? Math.round(v).toLocaleString("vi-VN") : Number(v).toFixed(v >= 100 ? 0 : d));
const clock = h => `${Math.floor(h / 24)} ngày ${String(Math.floor(h % 24)).padStart(2, "0")}:${String(Math.floor((h * 60) % 60)).padStart(2, "0")}`;

function colorFor(key, v, inf) {
  if (key === "do") return v >= 2 ? `hsl(160,55%,${22 + Math.min(v, 7) * 2}%)` : `hsl(${v * 20},70%,38%)`;
  if (key === "ph") { const d = Math.max(0, Math.abs(v - 7.5) - 1.5); return `hsl(${Math.max(0, 140 - d * 60)},55%,32%)`; }
  if (key === "tracer") return `hsl(205,80%,${18 + Math.min(1, v / 40) * 40}%)`;
  const r = Math.min(1, v / Math.max(inf[key], 1e-6)); return `hsl(${Math.round(140 - 140 * Math.pow(r, 0.6))},60%,33%)`;
}

export default function WwtpSim() {
  const sim = useRef(createWw("retro", "typical")); const run = useRef({ speed: 1, paused: false });
  const [, tick] = useState(0); const [ui, setUi] = useState({ param: "cod", speed: 1, paused: false, river: 10 });
  const S = sim.current, stages = STAGES[S.mode], std = STANDARDS[S.std];
  useEffect(() => {
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    const iv = setInterval(() => { const r = run.current; if (!r.paused) for (let i = 0; i < r.speed; i++) stepWw(sim.current, 0.01); }, 100);
    const uv = setInterval(() => tick(t => t + 1), 250);
    return () => { clearInterval(iv); clearInterval(uv); st.remove(); };
  }, []);
  const patch = p => { const n = { ...ui, ...p }; setUi(n); run.current.speed = n.speed; run.current.paused = n.paused; };
  const reset = (mode, inf) => { sim.current = createWw(mode ?? S.mode, inf ?? S.infKey); tick(t => t + 1); };
  const ctl = S.ctl, set = (k, v) => { ctl[k] = v; tick(t => t + 1); };
  const last = S.tanks[S.tanks.length - 1], exc = exceedances(last.c, std);
  const river = mixRiver(S.out.q || Q_DESIGN, last.c, ui.river, { nh4: 0.3, cod: 10, tss: 30 });
  const COLS = 5, CW = 150, RH = 118;
  const pos = i => { const row = Math.floor(i / COLS), col = row % 2 === 0 ? i % COLS : COLS - 1 - (i % COLS); return { x: 20 + col * CW, y: 40 + row * RH, row, col }; };
  const outPos = pos(stages.length - 1);
  const Btn = (txt, on, fn, cls = "") => <button className={`wb ${on ? "on" : ""} ${cls}`} onClick={fn}>{txt}</button>;
  const Tg = (label, key) => <label className="wb" style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={!!ctl[key]} onChange={e => set(key, e.target.checked)} />{label}</label>;
  const hist = S.hist, hx = t => 10 + ((t - (hist[0]?.t ?? 0)) / Math.max(1, (hist[hist.length - 1]?.t ?? 1) - (hist[0]?.t ?? 0))) * 330;
  const line = (key, max, col) => hist.length > 1 && <polyline fill="none" stroke={col} strokeWidth="1.6" points={hist.map(h => `${hx(h.t)},${100 - Math.min(1, h[key] / max) * 90}`).join(" ")} />;

  return <div style={{ color: K.txt, display: "flex", flexDirection: "column", gap: 12 }}>
    <div className="wcard" style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {Btn("Sau cải tạo (B01–B15)", S.mode === "retro", () => reset("retro"))}{Btn("Hiện hữu", S.mode === "exist", () => reset("exist"))}
      <span style={{ width: 8 }} />
      {Object.entries(INFLUENT).map(([k, v]) => Btn(v.name.split(" (")[0], S.infKey === k, () => { setInfluent(S, k); tick(t => t + 1); }))}
      <span style={{ width: 8 }} />
      <button className="wb" onClick={() => patch({ paused: !ui.paused })}>{ui.paused ? "⏵ Tiếp tục" : "⏸ Tạm dừng"}</button>
      {[1, 5, 20].map(v => Btn(`${v}×`, ui.speed === v, () => patch({ speed: v })))}
      <button className="wb go" onClick={() => { settle(S, 72); tick(t => t + 1); }}>⏩ Chạy ổn định 72 h</button>
      <button className="wb" onClick={() => { injectTracer(S); tick(t => t + 1); }}>💧 Thả chất chỉ thị</button>
      <button className="wb" onClick={() => reset()}>↺ Đặt lại</button>
      <span style={{ marginLeft: "auto", fontSize: 12, color: K.dim }}>Thời gian mô phỏng: <b style={{ color: K.txt }}>{clock(S.t)}</b> · Q vào {fmt(S.qIn, 2)} m³/h ({fmt(S.qIn * 24, 0)} m³/ngày)</span>
    </div>

    <div className="wcard">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: K.dim }}>Tô màu theo:</span>{PARAMS.map(p => Btn(p.label, ui.param === p.key, () => patch({ param: p.key })))}
      </div>
      <svg viewBox="0 0 780 470" width="100%" style={{ display: "block", background: "#0a1424", borderRadius: 8 }}>
        <text x="20" y="22" fill={K.dim} fontSize="12" fontWeight="700">Nước thải nhà máy → {S.mode === "retro" ? "sau cải tạo" : "hiện hữu"} → sông Vàm Cỏ Đông (Q thiết kế 120 m³/ngày.đêm)</text>
        {stages.slice(0, -1).map((st, i) => { const a = pos(i), b = pos(i + 1), on = S.tanks[i].q > 0.01; const x1 = a.x + 65, y1 = a.y + 36, x2 = b.x + 65, y2 = b.y + 36;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={on ? "#3fb6d8" : "#334"} strokeWidth="3" strokeDasharray={on ? "7 5" : ""}>{on && <animate attributeName="stroke-dashoffset" from={a.row % 2 === 0 || a.row !== b.row ? "24" : "-24"} to="0" dur={`${Math.max(0.4, 1.6 / Math.max(S.tanks[i].q / Q_DESIGN, 0.2))}s`} repeatCount="indefinite" />}</line>; })}
        {stages.map((st, i) => { const p = pos(i), T = S.tanks[i], c = T.c, v = c[ui.param], hasDO = ui.param === "do" && !["aer", "mbbr"].includes(st.kind);
          const fill = hasDO ? "#1b2433" : colorFor(ui.param, v, S.inf); const pr = PARAMS.find(x => x.key === ui.param);
          return <g key={st.id} transform={`translate(${p.x},${p.y})`}>
            <rect width="130" height="72" rx="6" fill="#16233a" stroke={st.pumped && T.level > 0.85 ? K.red : "#3b4a63"} strokeWidth="1.5" />
            <rect x="3" y={3 + (st.pumped ? (1 - Math.min(1, T.level)) * 66 : 0)} width="124" height={st.pumped ? Math.min(1, T.level) * 66 : 66} rx="4" fill={fill} opacity="0.95" />
            <text x="8" y="16" fill="#fff" fontSize="11" fontWeight="700">{st.id} · {st.name}</text>
            <text x="8" y="36" fill="#fff" fontSize="15" fontWeight="700">{hasDO ? "—" : `${ui.param === "tracer" ? fmt(v, 0) : fmt(v, v < 10 ? 1 : 0)}`}<tspan fontSize="9" fill="#cfe"> {hasDO ? "" : pr.unit}</tspan></text>
            <text x="8" y="52" fill="#cfe" fontSize="9">HRT ≈ {fmt(st.hrt, 1)} h · Q {fmt(T.q, 1)} m³/h</text>
            {st.pumped && <text x="8" y="64" fill="#cfe" fontSize="9">mực nước {Math.round(T.level * 100)} %</text>}
            {st.pumped && <g style={{ cursor: "pointer" }} onClick={() => { ctl.wp[st.pump] = !ctl.wp[st.pump]; tick(t => t + 1); }}><circle cx="118" cy="58" r="9" fill={ctl.wp[st.pump] ? "#12603c" : "#7a2226"} stroke="#fff" /><text x="118" y="61" fill="#fff" fontSize="7" textAnchor="middle" fontWeight="700">{st.pump}</text></g>}
            {["aer", "mbbr"].includes(st.kind) && <text x="82" y="64" fill={c.do < 2 ? "#ffb4b4" : "#bfe"} fontSize="9" fontWeight="700">DO {fmt(c.do, 1)}</text>}
          </g>; })}
        {/* van xả, sông, hồ sự cố */}
        <g transform={`translate(${outPos.x + 65},${outPos.y + 72})`}>
          <line x1="0" y1="0" x2="0" y2="30" stroke={ctl.valveOpen ? "#3fb6d8" : "#334"} strokeWidth="3" strokeDasharray={ctl.valveOpen ? "7 5" : ""}>{ctl.valveOpen && <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1s" repeatCount="indefinite" />}</line>
          <g style={{ cursor: "pointer" }} onClick={() => { ctl.valveAuto = false; set("valveOpen", !ctl.valveOpen); }}><circle cx="0" cy="40" r="10" fill={ctl.valveOpen ? "#12603c" : "#7a2226"} stroke="#fff" /><text x="0" y="43" fill="#fff" fontSize="8" textAnchor="middle" fontWeight="700">{ctl.valveOpen ? "MỞ" : "ĐÓNG"}</text></g>
        </g>
        <rect x="0" y="425" width="780" height="45" fill="#2d6f95" opacity="0.85" />
        <text x="390" y="452" fill="#fff" fontSize="13" fontWeight="700" textAnchor="middle">Sông Vàm Cỏ Đông — Q mô phỏng {ui.river} m³/s · pha loãng ≈ {Math.round(river.dilution).toLocaleString("vi-VN")} lần</text>
        <line x1={outPos.x + 65} y1={outPos.y + 112} x2={outPos.x + 65} y2="425" stroke={ctl.valveOpen && S.out.q > 0 ? "#3fb6d8" : "#334"} strokeWidth="3" strokeDasharray={ctl.valveOpen ? "7 5" : ""} />
        <g transform="translate(20,330)"><rect width="150" height="72" rx="6" fill="#16233a" stroke="#3b4a63" /><rect x="3" y={3 + (1 - Math.min(1, S.pond.vol / S.pond.cap)) * 66} width="144" height={Math.min(1, S.pond.vol / S.pond.cap) * 66} fill="#7a5f2a" rx="4" />
          <text x="8" y="16" fill="#fff" fontSize="11" fontWeight="700">Hồ sự cố</text><text x="8" y="34" fill="#fff" fontSize="12" fontWeight="700">{fmt(S.pond.vol, 1)} / {S.pond.cap} m³</text></g>
        <text x="20" y="418" fill={K.dim} fontSize="9">Thể tích bể suy từ thời gian lưu giả định; hệ số xử lý là chỉ thị, chưa hiệu chuẩn.</text>
      </svg>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
      <div className="wcard">
        <div className="wh">Vận hành thiết bị</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Tg("Máy thổi khí A", "blowerA")}{Tg("Máy thổi khí B", "blowerB")}{Tg("Hỏng thổi khí (sự cố)", "blowerFail")}
          {Tg("Châm PAC", "pac")}{Tg("Châm polymer", "polymer")}{Tg("Hiệu chỉnh pH tự động", "naoh")}{Tg("Châm clorine", "clo")}{Tg("Tự đóng van xả khi vượt chuẩn", "valveAuto")}{Tg("Lưu lượng theo giờ trong ngày", "diurnal")}
        </div>
        <label style={{ display: "block", fontSize: 12, marginTop: 8, color: K.dim }}>Liều PAC: <b style={{ color: K.txt }}>{ctl.pacDose} mg/L</b> (Jar test: 50 mg/L)<input type="range" min="0" max="100" step="5" value={ctl.pacDose} onChange={e => set("pacDose", +e.target.value)} style={{ width: "100%" }} /></label>
        <div style={{ fontSize: 11, color: K.dim, marginTop: 6 }}>Bấm vòng tròn WP… trên sơ đồ để dừng/chạy bơm; bơm dừng làm mực nước bể phía trước dâng và tràn.</div>
        {S.alarms.slice(0, 6).map((a, i) => <div key={i} style={{ fontSize: 11, marginTop: 3, color: "#ffb4b4" }}>⚠ {a}</div>)}
      </div>
      <div className="wcard">
        <div className="wh">Nước thải đầu vào → đầu ra</div>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
          <thead><tr style={{ color: K.dim, textAlign: "left" }}><th>Chỉ tiêu</th><th>Vào</th><th>Ra</th><th>Giới hạn</th></tr></thead>
          <tbody>{[["COD", "cod", std.cod], ["BOD₅", "bod", std.bod], ["TSS", "tss", std.tss], ["NH₄⁺-N", "nh4", std.nh4], ["T-N", "tn", std.tn], ["T-P", "tp", std.tp], ["Coliform", "coli", std.coli], ["pH", "ph", `${std.ph[0]}–${std.ph[1]}`]].map(([l, k, lim]) => {
            const bad = k === "ph" ? last.c.ph < std.ph[0] || last.c.ph > std.ph[1] : last.c[k] > lim; return <tr key={k} style={{ borderTop: `1px solid ${K.line}` }}><td>{l}</td><td>{fmt(S.inf[k], k === "ph" ? 1 : 0)}</td><td style={{ color: bad ? "#ff8a8a" : K.green, fontWeight: 700 }}>{fmt(last.c[k], k === "ph" ? 1 : last.c[k] < 10 ? 1 : 0)}</td><td style={{ color: K.dim }}>{lim}</td></tr>; })}</tbody>
        </table>
        <select value={S.std} onChange={e => { S.std = e.target.value; tick(t => t + 1); }} style={{ width: "100%", marginTop: 8, background: "#16233a", color: K.txt, border: `1px solid ${K.line}`, borderRadius: 6, padding: 5, fontSize: 11 }}>{Object.entries(STANDARDS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select>
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: exc.length ? "#ff8a8a" : K.green }}>{exc.length ? `Vượt: ${exc.join(", ")}` : "Đạt chuẩn tại đầu ra"} · van xả {ctl.valveOpen ? "MỞ" : "ĐÓNG"}</div>
        <div style={{ fontSize: 11, color: K.dim, marginTop: 4 }}>Đã xả {fmt(S.discharged, 1)} m³ · COD {fmt(S.load.cod, 2)} kg · NH₄⁺ {fmt(S.load.nh4, 2)} kg · T-N {fmt(S.load.tn, 2)} kg · T-P {fmt(S.load.tp, 2)} kg · tràn {fmt(S.spill, 1)} m³</div>
      </div>
      <div className="wcard">
        <div className="wh">Diễn biến đầu ra (COD, NH₄⁺, TSS)</div>
        <svg viewBox="0 0 350 110" width="100%" style={{ background: "#0a1424", borderRadius: 6 }}>
          <line x1="10" x2="340" y1={100 - Math.min(1, std.cod / 200) * 90} y2={100 - Math.min(1, std.cod / 200) * 90} stroke="#7a5" strokeDasharray="3 3" />
          {line("cod", 200, K.amber)}{line("nh4", 40, K.red)}{line("tss", 100, K.blue)}
          <text x="12" y="10" fill={K.amber} fontSize="8">COD (0–200)</text><text x="80" y="10" fill={K.red} fontSize="8">NH₄⁺ (0–40)</text><text x="150" y="10" fill={K.blue} fontSize="8">TSS (0–100)</text>
        </svg>
        <div className="wh" style={{ marginTop: 10 }}>Pha loãng tại sông Vàm Cỏ Đông (minh họa)</div>
        <label style={{ fontSize: 12, color: K.dim }}>Lưu lượng sông giả định: <b style={{ color: K.txt }}>{ui.river} m³/s</b><input type="range" min="1" max="200" value={ui.river} onChange={e => patch({ river: +e.target.value })} style={{ width: "100%" }} /></label>
        <div style={{ fontSize: 11, color: K.dim, lineHeight: 1.6 }}>Sau trộn hoàn toàn: COD {fmt(river.cod, 2)} · NH₄⁺-N {fmt(river.nh4, 2)} · TSS {fmt(river.tss, 1)} mg/L (nền giả định COD 10, NH₄⁺ 0,3, TSS 30). <b style={{ color: "#ffd27a" }}>Chuẩn xả áp dụng tại cống xả theo giấy phép; không được pha loãng để đạt chuẩn.</b> Lưu lượng và chất lượng nền thực của sông cần số liệu quan trắc.</div>
      </div>
    </div>

    <div className="wcard" style={{ overflowX: "auto" }}>
      <div className="wh">Thông số theo công đoạn</div>
      <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 640 }}>
        <thead><tr style={{ color: K.dim, textAlign: "left" }}>{["Bể", "Q m³/h", "COD", "BOD₅", "TSS", "NH₄⁺", "T-N", "T-P", "pH", "DO"].map(h => <th key={h} style={{ padding: "3px 6px" }}>{h}</th>)}</tr></thead>
        <tbody>{stages.map((st, i) => { const c = S.tanks[i].c; return <tr key={st.id} style={{ borderTop: `1px solid ${K.line}` }}><td style={{ padding: "3px 6px" }}>{st.id} {st.name}</td><td>{fmt(S.tanks[i].q, 1)}</td><td>{fmt(c.cod, 0)}</td><td>{fmt(c.bod, 0)}</td><td>{fmt(c.tss, 0)}</td><td>{fmt(c.nh4, 1)}</td><td>{fmt(c.tn, 0)}</td><td>{fmt(c.tp, 1)}</td><td>{fmt(c.ph, 1)}</td><td>{["aer", "mbbr"].includes(st.kind) ? fmt(c.do, 1) : "—"}</td></tr>; })}</tbody>
      </table>
      <div style={{ fontSize: 10, color: K.dim, marginTop: 8, lineHeight: 1.6 }}>Cơ sở: sơ đồ công nghệ trước/sau cải tạo (báo cáo khảo sát Global Green 14/10/2026), nước thải đầu vào 2021–2022, Jar test PAC 50 mg/L + PAM 2 mg/L. Mô hình chuỗi bể khuấy trộn hoàn toàn với hiệu suất theo trạng thái (liều PAC, pH, DO, tải nitrat hóa, clorine). Kết quả chỉ mang tính chỉ thị để huấn luyện và so sánh phương án, không thay cho thiết kế hay số liệu quan trắc.</div>
    </div>
  </div>;
}
