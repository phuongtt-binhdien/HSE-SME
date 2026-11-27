"use client";
// @ts-nocheck
// Văn bản: pháp luật còn hiệu lực + quy định nội bộ nhà máy, tìm kiếm, lọc, hạn soát xét, đánh dấu đã đối chiếu.
import { useEffect, useMemo, useState } from "react";
import { LEGAL_DOCS, INTERNAL_DOCS } from "../data/documents.ts";
import { reviewState, daysUntil, matches } from "../lib/docs.ts";

const C = { card: "#0d1320", line: "#1d2d40", txt: "#e6edf7", sub: "#9fb0c6", dim: "#6b7f99", green: "#00e5a0", amber: "#ffb020", red: "#ff3860" };
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, minWidth: 0 };
const th = { textAlign: "left", color: C.dim, fontWeight: 500, padding: "4px 8px", whiteSpace: "nowrap" }, td = { padding: "6px 8px", borderTop: `1px solid ${C.line}`, color: C.sub, verticalAlign: "top" };
const chip = (on, col = C.green) => ({ cursor: "pointer", padding: "4px 10px", borderRadius: 999, fontSize: 11, border: `1px solid ${on ? col : C.line}`, color: on ? col : C.sub, background: on ? col + "18" : "transparent" });
const KEY = "hse-docs-v1";
const stColor = s => (s === "Hiệu lực" ? C.green : s === "Hết hiệu lực" ? C.red : C.amber);

export function DocsModule() {
  const [tab, setTab] = useState("legal"), [q, setQ] = useState(""), [area, setArea] = useState("Tất cả"), [checked, setChecked] = useState({});
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) setChecked(s); } catch {} }, []);
  const toggle = k => { const n = { ...checked, [k]: checked[k] ? undefined : new Date().toLocaleDateString("vi-VN") }; setChecked(n); try { localStorage.setItem(KEY, JSON.stringify(n)); } catch {} };
  const today = new Date();
  const areas = ["Tất cả", ...Array.from(new Set(LEGAL_DOCS.map(d => d.area)))];
  const legal = useMemo(() => LEGAL_DOCS.filter(d => (area === "Tất cả" || d.area === area) && matches(`${d.no} ${d.title} ${d.note || ""}`, q)), [q, area]);
  const internal = useMemo(() => INTERNAL_DOCS.filter(d => matches(`${d.code} ${d.title} ${d.note || ""} ${d.kind}`, q)), [q]);
  const overdue = INTERNAL_DOCS.filter(d => reviewState(d.reviewDue, today) === "overdue").length, soon = INTERNAL_DOCS.filter(d => reviewState(d.reviewDue, today) === "soon").length;
  const verifyN = LEGAL_DOCS.filter(d => d.verify).length + INTERNAL_DOCS.filter(d => d.verify).length;
  const iso = daysUntil("2026-12-24", today);

  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
      {[["Văn bản pháp luật", LEGAL_DOCS.length, "Môi trường, PCCC, hóa chất, ATVSLĐ, xử phạt, QCVN"], ["Quy định nội bộ", INTERNAL_DOCS.length, "GPMT, MT-QT/HD/QP, quyết định, sổ tay"], ["Cần soát xét ≤ 60 ngày", `${overdue + soon}`, overdue ? `${overdue} đã quá hạn` : "chưa quá hạn"], ["ISO 14001 hết hạn", iso != null ? `${iso} ngày` : "—", "24/12/2026 — đánh giá nội bộ, xem xét lãnh đạo"]].map(([a, b, c], i) =>
        <div key={i} style={card}><div style={{ color: C.dim, fontSize: 11 }}>{a}</div><div style={{ font: "700 22px 'Syne',system-ui", color: i === 2 && overdue + soon ? C.amber : i === 3 ? C.amber : C.txt, margin: "4px 0" }}>{b}</div><div style={{ color: C.dim, fontSize: 11 }}>{c}</div></div>)}
    </div>

    <div style={card}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
        <span onClick={() => setTab("legal")} style={chip(tab === "legal")}>Pháp luật ({legal.length})</span>
        <span onClick={() => setTab("internal")} style={chip(tab === "internal")}>Quy định nội bộ ({internal.length})</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm số hiệu, tên, nội dung (không cần dấu)…" style={{ flex: "1 1 240px", background: "#080c14", color: C.txt, border: `1px solid ${C.line}`, borderRadius: 8, padding: "6px 10px", fontSize: 12 }} />
      </div>
      {tab === "legal" && <>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>{areas.map(a => <span key={a} onClick={() => setArea(a)} style={chip(area === a, C.green)}>{a}</span>)}</div>
        <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 760 }}><thead><tr><th style={th}>Số hiệu</th><th style={th}>Nội dung</th><th style={th}>Lĩnh vực</th><th style={th}>Hiệu lực</th><th style={th}>Tình trạng</th><th style={th}>Đã đối chiếu</th></tr></thead>
          <tbody>{legal.map(d => <tr key={d.no}><td style={{ ...td, color: C.txt, whiteSpace: "nowrap" }}>{d.no}</td>
            <td style={td}>{d.title}{d.note && <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{d.note}</div>}{d.verify && <div style={{ color: C.amber, fontSize: 11 }}>⚠ chưa có bản gốc trong hồ sơ — đối chiếu số hiệu, ngày hiệu lực</div>}</td>
            <td style={td}>{d.area}</td><td style={{ ...td, whiteSpace: "nowrap" }}>{d.effective || "—"}</td><td style={{ ...td, color: stColor(d.status) }}>{d.status}</td>
            <td style={td}><input type="checkbox" checked={!!checked["L" + d.no]} onChange={() => toggle("L" + d.no)} title={checked["L" + d.no] || ""} /></td></tr>)}
            {!legal.length && <tr><td style={td} colSpan={6}>Không có văn bản phù hợp.</td></tr>}</tbody></table></div></>}
      {tab === "internal" && <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 800 }}><thead><tr><th style={th}>Mã / số</th><th style={th}>Nội dung</th><th style={th}>Loại</th><th style={th}>Phiên bản</th><th style={th}>Soát xét đến</th><th style={th}>Tình trạng</th><th style={th}>Đã đối chiếu</th></tr></thead>
        <tbody>{internal.map(d => { const rs = reviewState(d.reviewDue, today), n = daysUntil(d.reviewDue, today); return <tr key={d.code}><td style={{ ...td, color: C.txt, whiteSpace: "nowrap" }}>{d.code}</td>
          <td style={td}>{d.title}{d.note && <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>{d.note}</div>}{d.verify && <div style={{ color: C.amber, fontSize: 11 }}>⚠ tên/ngày ban hành theo hồ sơ ISO — đối chiếu bản gốc</div>}</td>
          <td style={td}>{d.kind}</td><td style={td}>{d.version}</td>
          <td style={{ ...td, whiteSpace: "nowrap", color: rs === "overdue" ? C.red : rs === "soon" ? C.amber : C.sub }}>{d.reviewDue ? `${d.reviewDue.split("-").reverse().join("/")} (${n < 0 ? `quá ${-n} ngày` : `còn ${n} ngày`})` : "—"}</td>
          <td style={{ ...td, color: stColor(d.status === "Cần soát xét" ? "x" : d.status) }}>{d.status}</td>
          <td style={td}><input type="checkbox" checked={!!checked["I" + d.code]} onChange={() => toggle("I" + d.code)} title={checked["I" + d.code] || ""} /></td></tr>; })}</tbody></table></div>}
      <div style={{ color: C.dim, fontSize: 11, marginTop: 10, lineHeight: 1.6 }}>{verifyN} mục đánh dấu ⚠ chưa có bản gốc trong hồ sơ nhà máy. Danh mục lập theo thứ bậc: GPMT 2986 &gt; pháp luật hiện hành &gt; hồ sơ nội bộ. Đánh dấu "đã đối chiếu" lưu trên trình duyệt này. Phải kiểm tra văn bản hợp nhất mới nhất trước khi trích dẫn trong hồ sơ trình ký.</div>
    </div>
  </div>;
}
