"use client";
// @ts-nocheck
import { useEffect, useState } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { GHG_REPORT, RESULT_2023, MONTHLY_2023, MONTHS, ACTIVITY_2023, GHG_REVIEW } from "../data/ghg.ts";
import { computeYear, EMPTY_YEAR, FUELS, GWP, EF_GRID_2023 } from "../lib/ghg.ts";

const C = { bg: "#05080f", card: "#0d1320", line: "#1d2d40", txt: "#e6edf7", sub: "#9fb0c6", dim: "#6b7f99", green: "#00e5a0", amber: "#ffb020", blue: "#3b9eff", violet: "#8b5cf6", red: "#ff3860", cyan: "#06d6d0" };
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, minWidth: 0 };
const h = { font: "700 14px 'Syne','Outfit',system-ui", color: C.txt, marginBottom: 10 };
const f = (v, d = 1) => Number(v).toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d });
const COLORS = [C.amber, C.green, C.cyan, C.violet, C.red, C.blue, "#c084fc"];
const KEY = "hse-ghg-inputs";

const FIELDS = [["coal", "Than cho lò hơi, lò sấy (tấn)"], ["biomass", "Sinh khối — gỗ/chất thải gỗ (tấn)"], ["doGen", "Dầu DO máy phát (lít)"], ["doVeh", "Dầu DO xe nội bộ, xe nâng (lít)"], ["kwh", "Điện mua lưới EVN (kWh)"], ["efGrid", "Hệ số lưới điện (tCO₂/MWh) — theo công bố của năm"],
  ["refrigerantKg", "Môi chất lạnh R32: tổng lượng gas (kg)"], ["mt3", "Bình CO₂ MT3 (3 kg) dùng/hỏng (bình)"], ["mt5", "Bình CO₂ MT5 (5 kg) dùng/hỏng (bình)"], ["wwFlow", "Nước thải sinh hoạt (m³/ngày — nên dùng số đo thực)"], ["wwDays", "Số ngày làm việc"], ["wwBod", "BOD₅ nước thải (g/m³)"], ["people", "Số người"], ["npkGranulated", "NPK tạo hạt (tấn)"], ["npkBlended", "NPK trộn (tấn)"]];

export function GhgModule() {
  const [year, setYear] = useState(2024);
  const [inputs, setInputs] = useState({ 2024: { ...EMPTY_YEAR }, 2025: { ...EMPTY_YEAR } });
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) setInputs(s); } catch {} }, []);
  const save = v => { setInputs(v); try { localStorage.setItem(KEY, JSON.stringify(v)); } catch {} };
  const set = (k, v) => save({ ...inputs, [year]: { ...inputs[year], [k]: v === "" ? 0 : Number(v) } });
  const r23 = computeYear(ACTIVITY_2023), ry = computeYear(inputs[year]);
  const monthly = MONTHS.map((m, i) => ({ m, "Than": MONTHLY_2023.coal[i], "DO": MONTHLY_2023.doGen[i] + MONTHLY_2023.doVeh[i], "Điện": MONTHLY_2023.elec[i] }));
  const pie = RESULT_2023.rows.filter(x => x.co2e > 1).map(x => ({ name: x.label, value: x.co2e }));
  const prod23 = ACTIVITY_2023.npkGranulated + ACTIVITY_2023.npkBlended;
  const csv = () => { const rows = [["Hạng mục", "Phạm vi", "2023 (tCO2e)", `${year} (tCO2e)`], ...r23.rows.map((x, i) => [x.label, x.scope, x.co2e.toFixed(3), ry.rows[i].co2e.toFixed(3)]), ["Tổng", "", r23.total.toFixed(3), ry.total.toFixed(3)]];
    const blob = new Blob(["﻿" + rows.map(r => r.join(";")).join("\n")], { type: "text/csv;charset=utf-8" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `kiem-ke-knk-${year}.csv`; a.click(); };
  const KPI = (l, v, u, s, col) => <div style={{ ...card, flex: "1 1 190px" }}><div style={{ color: C.dim, fontSize: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>{l}</div><div style={{ font: "800 26px 'Syne'", color: col, marginTop: 4 }}>{v} <span style={{ fontSize: 12, color: C.sub }}>{u}</span></div><div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{s}</div></div>;
  const th = { textAlign: "left", color: C.dim, fontSize: 10, textTransform: "uppercase", padding: "6px 8px" }, td = { padding: "7px 8px", borderTop: `1px solid ${C.line}`, fontSize: 12 };
  return <div style={{ display: "grid", gap: 14, color: C.txt }}>
    <div style={{ ...card, fontSize: 12, color: C.sub, lineHeight: 1.7 }}><b style={{ color: C.txt }}>{GHG_REPORT.title}</b> — {GHG_REPORT.consultant}, ký {GHG_REPORT.signed}. <b style={{ color: C.amber }}>Số liệu kiểm kê là năm {GHG_REPORT.inventoryYear}</b> (bìa báo cáo ghi 2024). Chưa có báo cáo kiểm kê 2024 và 2025: dùng bảng nhập số liệu bên dưới để tính theo cùng phương pháp.<br />Căn cứ: {GHG_REPORT.basis.join("; ")}.</div>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      {KPI("Tổng phát thải 2023", f(RESULT_2023.total, 0), "tCO₂e", "Phạm vi 1 + 2", C.green)}{KPI("Phạm vi 1 (trực tiếp)", f(RESULT_2023.scope1, 0), "tCO₂e", `${RESULT_2023.scope1Pct} % — than ${f(9352.363 / RESULT_2023.total * 100, 1)} % tổng`, C.amber)}
      {KPI("Phạm vi 2 (điện lưới)", f(RESULT_2023.scope2, 0), "tCO₂e", `${RESULT_2023.scope2Pct} % — 8.310 MWh`, C.cyan)}{KPI("Cường độ phát thải", f(RESULT_2023.total * 1000 / prod23, 1), "kg CO₂e/tấn", `${f(prod23, 0)} t NPK (tạo hạt + trộn)`, C.violet)}{KPI("Độ chính xác dữ liệu", RESULT_2023.accuracy.score.toString().replace(".", ","), "", RESULT_2023.accuracy.grade, C.blue)}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 14 }}>
      <div style={card}><div style={h}>Phát thải theo tháng 2023 (tCO₂e)</div><div style={{ height: 240 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke={C.line} /><XAxis dataKey="m" stroke={C.dim} fontSize={10} /><YAxis stroke={C.dim} fontSize={10} /><Tooltip contentStyle={{ background: "#0a1220", border: `1px solid ${C.line}` }} formatter={v => f(v, 1)} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Than" stackId="a" fill={C.amber} /><Bar dataKey="DO" stackId="a" fill={C.green} /><Bar dataKey="Điện" stackId="a" fill={C.cyan} /></BarChart></ResponsiveContainer></div></div>
      <div style={card}><div style={h}>Cơ cấu nguồn phát thải 2023</div><div style={{ height: 240 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pie} dataKey="value" nameKey="name" outerRadius={85} label={e => `${f(e.value / RESULT_2023.total * 100, 1)}%`} labelLine={false} fontSize={10}>{pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ background: "#0a1220", border: `1px solid ${C.line}` }} formatter={v => f(v, 1) + " tCO₂e"} /><Legend wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer></div></div>
    </div>
    <div style={card}><div style={h}>Kết quả kiểm kê năm 2023 (Bảng 3.7–3.9)</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}><thead><tr><th style={th}>Hạng mục</th><th style={th}>Phạm vi</th><th style={th}>CO₂ (t)</th><th style={th}>CH₄ (t)</th><th style={th}>N₂O (t)</th><th style={th}>CO₂e (t)</th><th style={th}>Tỷ lệ</th></tr></thead><tbody>
      {RESULT_2023.rows.map(x => <tr key={x.label}><td style={td}>{x.label}</td><td style={td}>{x.scope}</td><td style={td}>{x.co2 ? f(x.co2, 3) : "—"}</td><td style={td}>{x.ch4 ? f(x.ch4, 4) : "—"}</td><td style={td}>{x.n2o ? f(x.n2o, 4) : "—"}</td><td style={{ ...td, fontWeight: 700 }}>{f(x.co2e, 3)}</td><td style={td}>{f(x.co2e / RESULT_2023.total * 100, 2)} %</td></tr>)}
      <tr><td style={{ ...td, fontWeight: 700 }} colSpan="5">Tổng</td><td style={{ ...td, fontWeight: 800, color: C.green }}>{f(RESULT_2023.total, 2)}</td><td style={td}>100 %</td></tr></tbody></table></div></div>
    <div style={card}><div style={h}>Tính phát thải năm 2024, 2025 theo cùng phương pháp</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>{[2024, 2025].map(y => <button key={y} onClick={() => setYear(y)} style={{ background: year === y ? "#1f4e8c" : "#16233a", color: C.txt, border: `1px solid ${year === y ? C.blue : C.line}`, borderRadius: 8, padding: "7px 14px", fontWeight: 600, cursor: "pointer" }}>Năm {y}</button>)}<button onClick={csv} style={{ background: "#16233a", color: C.txt, border: `1px solid ${C.line}`, borderRadius: 8, padding: "7px 14px", cursor: "pointer" }}>⬇ Xuất CSV</button></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>{FIELDS.map(([k, l]) => <label key={k} style={{ fontSize: 11, color: C.sub }}>{l}<input type="number" step="any" min="0" value={inputs[year][k] || ""} placeholder={k === "efGrid" ? String(EF_GRID_2023) : "0"} onChange={e => set(k, e.target.value)} style={{ width: "100%", marginTop: 3, background: "#0a1220", color: C.txt, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 10px", fontSize: 13 }} /></label>)}</div>
      <div style={{ overflowX: "auto", marginTop: 14 }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}><thead><tr><th style={th}>Hạng mục</th><th style={th}>2023 (tính lại từ số liệu báo cáo)</th><th style={th}>{year}</th><th style={th}>Thay đổi</th></tr></thead><tbody>
        {r23.rows.map((x, i) => { const y = ry.rows[i].co2e; const d = x.co2e > 0 && y > 0 ? (y / x.co2e - 1) * 100 : null; return <tr key={x.key}><td style={td}>{x.label}</td><td style={td}>{f(x.co2e, 2)}</td><td style={td}>{y ? f(y, 2) : "—"}</td><td style={{ ...td, color: d == null ? C.dim : d > 0 ? C.amber : C.green }}>{d == null ? "—" : `${d > 0 ? "+" : ""}${f(d, 1)} %`}</td></tr>; })}
        <tr><td style={{ ...td, fontWeight: 700 }}>Tổng (tCO₂e)</td><td style={{ ...td, fontWeight: 700 }}>{f(r23.total, 2)}</td><td style={{ ...td, fontWeight: 800, color: C.green }}>{ry.total ? f(ry.total, 2) : "—"}</td><td style={td}>{ry.total ? `${ry.total > r23.total ? "+" : ""}${f((ry.total / r23.total - 1) * 100, 1)} %` : "—"}</td></tr>
        <tr><td style={td}>Cường độ (kg CO₂e/tấn NPK)</td><td style={td}>{f(r23.intensity, 1)}</td><td style={td}>{ry.intensity != null ? f(ry.intensity, 1) : "—"}</td><td style={td}></td></tr>
        {ry.biogenicCo2 > 0 && <tr><td style={td}>CO₂ sinh học từ sinh khối (không tính vào tổng)</td><td style={td}>—</td><td style={td}>{f(ry.biogenicCo2, 1)}</td><td style={td}></td></tr>}</tbody></table></div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 8, lineHeight: 1.6 }}>Hệ số: QĐ 2626/QĐ-BTNMT (than 98.300 kg CO₂/TJ, nhiệt trị 26,7 TJ/Gg; DO 74.100, 43; sinh khối 100.000/30/4 kg/TJ, 15,6 TJ/Gg — IPCC 2006); GWP IPCC AR6: CH₄ {GWP.CH4}, N₂O {GWP.N2O}; R32 GWP 675, rò rỉ 15 %; bình CO₂ rò rỉ 5 %. Số liệu nhập lưu trên trình duyệt này. Kết quả tính toán nội bộ để theo dõi, không thay thế báo cáo kiểm kê được thẩm định.</div>
    </div>
    <div style={card}><div style={h}>Rà soát báo cáo và việc cần làm</div>{GHG_REVIEW.map((t, i) => <div key={i} style={{ fontSize: 12, color: C.sub, lineHeight: 1.7, padding: "3px 0" }}>• {t}</div>)}</div>
  </div>;
}
