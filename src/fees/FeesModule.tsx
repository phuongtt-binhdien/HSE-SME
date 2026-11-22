"use client";
// @ts-nocheck
// Phí bảo vệ môi trường đối với khí thải và nước thải công nghiệp — thông báo của Sở NN&MT Tây Ninh (Quý I+II/2026), trạng thái nộp, bảng tính ước tính các quý sau.
import { useEffect, useState } from "react";
import { AIR_FEE_NOTICE, WATER_FEE_NOTICE, AIR_STREAMS, AIR_QUARTERS, WATER_QUARTERS, FEE_STATUS } from "../data/fees.ts";
import { AIR_RATE, AIR_FIXED_YEAR, AIR_APPRAISAL_FACTOR, WATER_RATE, airVariable, airQuarter, waterQuarter, airVolume } from "../lib/fees.ts";
import { UNITS } from "../sim/gas.ts";

const C = { card: "#0d1320", line: "#1d2d40", txt: "#e6edf7", sub: "#9fb0c6", dim: "#6b7f99", green: "#00e5a0", amber: "#ffb020", red: "#ff3860" };
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, minWidth: 0 };
const h = { font: "700 14px 'Syne','Outfit',system-ui", color: C.txt, marginBottom: 10 };
const vnd = v => `${Math.round(v).toLocaleString("vi-VN")} đ`;
const th = { textAlign: "left", color: C.dim, fontWeight: 500, padding: "4px 8px", whiteSpace: "nowrap" }, td = { padding: "4px 8px", borderTop: `1px solid ${C.line}`, color: C.sub, whiteSpace: "nowrap" };
const input = { width: 72, background: "#080c14", color: C.txt, border: `1px solid ${C.line}`, borderRadius: 6, padding: "4px 6px", font: "12px 'DM Mono',monospace" };
const KEY = "hse-fees-v1";

export function FeesModule() {
  const [paid, setPaid] = useState(Object.fromEntries(FEE_STATUS.map(s => [s.key, s.paid])));
  const [hours, setHours] = useState(1152);
  const [conc, setConc] = useState(AIR_STREAMS.map(s => [...s.q[1]]));   // mặc định theo kết quả quan trắc Quý II
  const [flowPct, setFlowPct] = useState(100);                              // % lưu lượng thiết kế dùng để khai
  const [water, setWater] = useState({ m3: 3600, cod: 12, tss: 5.3 });
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s?.paid) setPaid(s.paid); } catch {} }, []);
  const togglePaid = k => { const n = { ...paid, [k]: !paid[k] }; setPaid(n); try { localStorage.setItem(KEY, JSON.stringify({ paid: n })); } catch {} };
  const design = { G01: 25000, G02: 55000, G03: 55000, G04: 55000, G05: 55000, G06: 140000 };
  const est = AIR_STREAMS.map((s, i) => ({ id: s.id, name: s.name, volume: airVolume(design[s.id] * flowPct / 100, hours), c: conc[i] }));
  const airEst = airQuarter(est.map(e => ({ volume: e.volume, dust: e.c[0], nox: e.c[1], sox: e.c[2], co: e.c[3] })), true), airDecl = airQuarter(est.map(e => ({ volume: e.volume, dust: e.c[0], nox: e.c[1], sox: e.c[2], co: e.c[3] })));
  const wEst = waterQuarter(water.m3, water.cod, water.tss);
  const total = FEE_STATUS.filter(s => paid[s.key]).reduce((a, s) => a + s.amount, 0);

  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
      {[["Khí thải Q1+Q2/2026", vnd(AIR_FEE_NOTICE.total), `TB ${AIR_FEE_NOTICE.no} · ${AIR_FEE_NOTICE.date}`], ["Nước thải Q1+Q2/2026", vnd(WATER_FEE_NOTICE.total), `TB ${WATER_FEE_NOTICE.no} · ${WATER_FEE_NOTICE.date}`], ["Tổng 6 tháng đầu 2026", vnd(AIR_FEE_NOTICE.total + WATER_FEE_NOTICE.total), "khí thải + nước thải"], ["Đã nộp (đánh dấu)", vnd(total), "đến hết Quý II/2026 theo xác nhận"]].map(([a, b, c], i) =>
        <div key={i} style={card}><div style={{ color: C.dim, fontSize: 11 }}>{a}</div><div style={{ font: "700 22px 'Syne',system-ui", color: i === 3 ? C.green : C.txt, margin: "4px 0" }}>{b}</div><div style={{ color: C.dim, fontSize: 11 }}>{c}</div></div>)}
    </div>

    <div style={card}><div style={h}>Trạng thái nộp phí</div>
      {FEE_STATUS.map(s => <label key={s.key} style={{ display: "flex", gap: 10, alignItems: "center", padding: "5px 0", color: C.sub, fontSize: 13 }}><input type="checkbox" checked={!!paid[s.key]} onChange={() => togglePaid(s.key)} /><span style={{ flex: 1 }}>{s.label}</span><b style={{ color: paid[s.key] ? C.green : C.amber }}>{s.amount ? vnd(s.amount) : "chưa có thông báo"}</b><span style={{ color: paid[s.key] ? C.green : C.amber, fontSize: 11, minWidth: 70 }}>{paid[s.key] ? "✔ Đã nộp" : "Chưa nộp"}</span></label>)}
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Thời hạn nộp: {AIR_FEE_NOTICE.due} (khí thải: tới 26/11/2026; nước thải: tới 21/11/2026). Tài khoản khí thải: {AIR_FEE_NOTICE.account}. Tài khoản nước thải: {WATER_FEE_NOTICE.account}; nội dung "Phí BVMTNT + tên công ty, địa chỉ + mã số thuế". Trạng thái lưu trên trình duyệt này.</div></div>

    <div style={card}><div style={h}>Phí khí thải theo dòng — Quý I và Quý II/2026 (số liệu sau thẩm định)</div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 760 }}><thead><tr><th style={th}>Dòng</th><th style={th}>Nguồn</th><th style={th}>Lượng khí/quý (m³)</th><th style={th}>Bụi/NOx/SOx/CO Q1</th><th style={th}>Bụi/NOx/SOx/CO Q2</th><th style={th}>C Q1 (khai → thẩm định)</th><th style={th}>C Q2 (khai → thẩm định)</th></tr></thead>
        <tbody>{AIR_STREAMS.map(s => <tr key={s.n}><td style={td}>{s.n} · {s.id}</td><td style={td}>{s.name}</td><td style={td}>{s.volume.toLocaleString("vi-VN")}</td><td style={td}>{s.q[0].join(" / ")}</td><td style={td}>{s.q[1].join(" / ")}</td><td style={td}>{s.decl[0].toLocaleString("vi-VN")} → {s.appr[0].toLocaleString("vi-VN")}</td><td style={td}>{s.decl[1].toLocaleString("vi-VN")} → {s.appr[1].toLocaleString("vi-VN")}</td></tr>)}
          {AIR_QUARTERS.map(q => <tr key={q.q}><td style={{ ...td, color: C.txt }} colSpan={5}>{q.q}: F = f/4 + C = 750.000 + {q.C[1].toLocaleString("vi-VN")}</td><td style={{ ...td, color: C.txt }} colSpan={2}>khai {vnd(q.declared)} → thẩm định <b style={{ color: C.green }}>{vnd(q.appraised)}</b></td></tr>)}</tbody></table></div>
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Tổng phải nộp sau thẩm định: <b style={{ color: C.txt }}>{vnd(AIR_FEE_NOTICE.total)}</b> (khai {vnd(AIR_FEE_NOTICE.declared)}). Phí cố định f/4 = 750.000 đ/quý chiếm &gt; 97 % số phí; phí biến đổi C chỉ ≈ 18–19 nghìn đ/quý. Lượng khí thải khai = lưu lượng thiết kế × 1.152 giờ (25.000 → 28,8 triệu m³; 55.000 → 63,36 triệu m³; 140.000 → 161,28 triệu m³) — lưu lượng đo thực tế 2026 thấp hơn thiết kế (≈ 56–85 %).</div></div>

    <div style={card}><div style={h}>Phí nước thải công nghiệp — Quý I và Quý II/2026</div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 640 }}><thead><tr><th style={th}>Quý</th><th style={th}>Nước thải (m³)</th><th style={th}>COD (mg/L)</th><th style={th}>TSS khai → thẩm định</th><th style={th}>Phí khai</th><th style={th}>Phí thẩm định</th><th style={th}>Ghi chú</th></tr></thead>
        <tbody>{WATER_QUARTERS.map(q => <tr key={q.q}><td style={td}>{q.q}</td><td style={td}>{q.m3.toLocaleString("vi-VN")}</td><td style={td}>{q.cod}</td><td style={td}>{String(q.tssDecl).replace(".", ",")} → {String(q.tss).replace(".", ",")}</td><td style={td}>{vnd(q.feeDecl)}</td><td style={td}>{vnd(q.feeAppr)}</td><td style={{ ...td, whiteSpace: "normal" }}>{q.note}</td></tr>)}
          <tr><td style={{ ...td, color: C.txt }} colSpan={5}>Tổng thẩm định 211.140 + 196.380 = 407.520 → làm tròn</td><td style={{ ...td, color: C.green }} colSpan={2}><b>{vnd(WATER_FEE_NOTICE.total)}</b></td></tr></tbody></table></div>
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Hg, Pb, As, Cd đều không phát hiện (khai 0). Lưu ý Quý I: kết quả TSS "&lt; 4 mg/L" nhưng tờ khai ghi 0 nên Sở thẩm định lại 3,9 mg/L — khi khai quý sau nên ghi giá trị theo phiếu (hoặc theo LOQ) thay vì 0. Phí tính theo khoản 2 Điều 7 Nghị định 346/2025/NĐ-CP (theo thông báo).</div></div>

    <div style={card}><div style={h}>Ước tính phí quý sau (Quý III/2026 trở đi)</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10, fontSize: 12, color: C.sub, alignItems: "center" }}>
        <label>Giờ khai/quý <input type="number" value={hours} onChange={e => setHours(Number(e.target.value) || 0)} style={input} /></label>
        <label>Lưu lượng khai (% thiết kế) <input type="number" value={flowPct} onChange={e => setFlowPct(Number(e.target.value) || 0)} style={input} /></label>
        <span style={{ color: C.dim }}>mặc định = cách khai 2026 (1.152 h, 100 % thiết kế)</span></div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 680 }}><thead><tr><th style={th}>Dòng</th><th style={th}>Lượng khí (m³)</th><th style={th}>Bụi</th><th style={th}>NOx</th><th style={th}>SOx</th><th style={th}>CO</th><th style={th}>C (đ)</th></tr></thead>
        <tbody>{est.map((e, i) => <tr key={e.id}><td style={td}>{e.id} · {e.name}</td><td style={td}>{Math.round(e.volume).toLocaleString("vi-VN")}</td>{[0, 1, 2, 3].map(k => <td key={k} style={td}><input type="number" value={e.c[k]} onChange={ev => setConc(conc.map((r, j) => (j === i ? r.map((x, m) => (m === k ? Number(ev.target.value) || 0 : x)) : r)))} style={{ ...input, width: 56 }} /></td>)}<td style={td}>{airVariable({ volume: e.volume, dust: e.c[0], nox: e.c[1], sox: e.c[2], co: e.c[3] }).toLocaleString("vi-VN")}</td></tr>)}</tbody></table></div>
      <div style={{ marginTop: 10, fontSize: 13, color: C.sub }}>Khí thải: f/4 {vnd(AIR_FIXED_YEAR / 4)} + C → <b style={{ color: C.txt }}>{vnd(airDecl.F)}</b> theo cách khai · ≈ <b style={{ color: C.green }}>{vnd(airEst.F)}</b> nếu thẩm định như Q1+Q2/2026 (C × {AIR_APPRAISAL_FACTOR}).</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "12px 0 6px", fontSize: 12, color: C.sub, alignItems: "center" }}>
        <label>Nước thải (m³/quý) <input type="number" value={water.m3} onChange={e => setWater({ ...water, m3: Number(e.target.value) || 0 })} style={input} /></label>
        <label>COD (mg/L) <input type="number" value={water.cod} onChange={e => setWater({ ...water, cod: Number(e.target.value) || 0 })} style={input} /></label>
        <label>TSS (mg/L) <input type="number" step="0.1" value={water.tss} onChange={e => setWater({ ...water, tss: Number(e.target.value) || 0 })} style={input} /></label></div>
      <div style={{ fontSize: 13, color: C.sub }}>Nước thải: <b style={{ color: C.green }}>{vnd(wEst)}</b> (COD {WATER_RATE.cod.toLocaleString("vi-VN")} đ/kg, TSS {WATER_RATE.tss.toLocaleString("vi-VN")} đ/kg). Tổng quý: <b style={{ color: C.txt }}>{vnd(airEst.F + wEst)}</b>.</div>
      <div style={{ color: C.amber, fontSize: 11, marginTop: 10, lineHeight: 1.6 }}>Các mức phí (khí thải: bụi {AIR_RATE.dust}, NOx {AIR_RATE.nox}, SOx {AIR_RATE.sox}, CO {AIR_RATE.co} đ/tấn; cố định 3.000.000 đ/năm; hệ số thẩm định 0,75) được suy ra bằng cách khớp ngược 2 thông báo — chính xác ±2 đồng nhưng không phải trích văn bản pháp luật. Chỉ dùng để ước tính; số nộp thực tế theo thông báo của Sở.</div></div>
  </div>;
}
