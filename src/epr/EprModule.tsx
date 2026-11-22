"use client";
// @ts-nocheck
// EPR bao bì (Nghị định 110/2026/NĐ-CP): số lượng bao bì → khối lượng V, đóng góp Quỹ BVMT Việt Nam (F = V×R×Fs), so sánh thuê đơn vị tái chế, tiến độ, danh sách kiểm tra.
import { useEffect, useState } from "react";
import { EPR_DECLARATIONS, EPR_QUOTE, EPR_TIMELINE, EPR_CHECKLIST, EPR_NOTES } from "../data/epr.ts";
import { fundAmount, mandatoryKg, recyclerCost, packagingKg, R_SOFT, FS_2026, FS_OLD, VAT } from "../lib/epr.ts";

const C = { card: "#0d1320", line: "#1d2d40", txt: "#e6edf7", sub: "#9fb0c6", dim: "#6b7f99", green: "#00e5a0", amber: "#ffb020", red: "#ff3860" };
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, minWidth: 0 };
const h = { font: "700 14px 'Syne','Outfit',system-ui", color: C.txt, marginBottom: 10 };
const vnd = v => `${Math.round(v).toLocaleString("vi-VN")} đ`, num = (v, d = 0) => Number(v).toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d });
const th = { textAlign: "left", color: C.dim, fontWeight: 500, padding: "4px 8px", whiteSpace: "nowrap" }, td = { padding: "4px 8px", borderTop: `1px solid ${C.line}`, color: C.sub };
const input = { width: 96, background: "#080c14", color: C.txt, border: `1px solid ${C.line}`, borderRadius: 6, padding: "4px 6px", font: "12px 'DM Mono',monospace" };
const KEY = "hse-epr-v1", BASE_V = 1_112_754.72;

export function EprModule() {
  const [st, setSt] = useState({ paid: Object.fromEntries(EPR_DECLARATIONS.map(d => [d.key, d.paid])), done: {}, rows: [{ name: "Bao PP dệt có lót 50 kg", qty: 0, grams: 120 }, { name: "Bao 25 kg", qty: 0, grams: 80 }, { name: "Bao 10 kg", qty: 0, grams: 40 }, { name: "Bao/túi nhỏ ≤ 5 kg", qty: 0, grams: 15 }] });
  const [fs, setFs] = useState(FS_2026), [quoteKg, setQuoteKg] = useState(EPR_QUOTE.kg), [price, setPrice] = useState(EPR_QUOTE.price);
  useEffect(() => { try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s) setSt(s); } catch {} }, []);
  const save = n => { setSt(n); try { localStorage.setItem(KEY, JSON.stringify(n)); } catch {} };
  const fromRows = packagingKg(st.rows), V = fromRows > 0 ? fromRows : BASE_V, mand = mandatoryKg(V);
  const pa1 = fundAmount(V, R_SOFT, fs), pa2 = recyclerCost(mand, price), cover = Math.min(1, quoteKg / mand), paQ = recyclerCost(quoteKg, price);
  const setRow = (i, k, v) => save({ ...st, rows: st.rows.map((r, j) => (j === i ? { ...r, [k]: k === "name" ? v : Number(v) || 0 } : r)) });
  const paidTotal = EPR_DECLARATIONS.filter(d => st.paid[d.key]).reduce((a, d) => a + d.f, 0), last = EPR_DECLARATIONS[1];

  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
      {[["Kỳ gần nhất (số liệu 2025)", vnd(last.f), `V = ${num(last.v, 2)} kg · R 10 % · Fs ${num(last.fs)} đ/kg`], ["Đã nộp Quỹ (đánh dấu)", vnd(paidTotal), "2 kỳ gần nhất: 2024 và 2025"], ["Ước tính kỳ 2026 — đóng Quỹ", vnd(pa1), `V ≈ ${num(V / 1000, 1)} t · bắt buộc ${num(mand / 1000, 1)} t`], ["Ước tính — thuê tái chế", vnd(pa2), `${num(price)} đ/kg + VAT ${VAT * 100} %`]].map(([a, b, c], i) =>
        <div key={i} style={card}><div style={{ color: C.dim, fontSize: 11 }}>{a}</div><div style={{ font: "700 20px 'Syne',system-ui", color: i === 1 ? C.green : C.txt, margin: "4px 0" }}>{b}</div><div style={{ color: C.dim, fontSize: 11 }}>{c}</div></div>)}
    </div>

    <div style={card}><div style={h}>Đóng góp Quỹ Bảo vệ môi trường Việt Nam — các kỳ đã kê khai</div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 720 }}><thead><tr><th style={th}>Kỳ</th><th style={th}>V (kg)</th><th style={th}>R</th><th style={th}>Fs (đ/kg)</th><th style={th}>F = V×R×Fs</th><th style={th}>Tình trạng</th><th style={th}>Đã nộp</th></tr></thead>
        <tbody>{EPR_DECLARATIONS.map(d => <tr key={d.key}><td style={td}>{d.label}</td><td style={td}>{num(d.v, 2)}</td><td style={td}>{d.r * 100} %</td><td style={td}>{num(d.fs)}</td><td style={{ ...td, color: C.txt }}>{vnd(d.f)}</td><td style={{ ...td, whiteSpace: "normal" }}>{d.status}</td><td style={td}><input type="checkbox" checked={!!st.paid[d.key]} onChange={() => save({ ...st, paid: { ...st.paid, [d.key]: !st.paid[d.key] } })} /></td></tr>)}
          <tr><td style={{ ...td, color: C.amber }}>Kê khai trước 01/04/2027 (số liệu 2026, NĐ 110/2026)</td><td style={td} colSpan={3}>chưa chốt — chờ số liệu bán hàng 2026</td><td style={{ ...td, color: C.amber }}>≈ {vnd(pa1)} (ước tính)</td><td style={td} colSpan={2}>Đang xây dựng phương án</td></tr></tbody></table></div>
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Bao PP dệt có lớp lót kê khai mã A.3.4.1 (bao bì nhựa mềm), R = 10 %. Kỳ 2025: cần xác nhận chứng từ nộp Quỹ với Phòng Kế toán. Trạng thái lưu trên trình duyệt này.</div></div>

    <div style={card}><div style={h}>Số lượng bao bì đưa ra thị trường → khối lượng V</div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 560 }}><thead><tr><th style={th}>Quy cách bao</th><th style={th}>Số bao/năm</th><th style={th}>Khối lượng 1 bao (g)</th><th style={th}>Khối lượng (kg)</th></tr></thead>
        <tbody>{st.rows.map((r, i) => <tr key={i}><td style={td}><input value={r.name} onChange={e => setRow(i, "name", e.target.value)} style={{ ...input, width: 190 }} /></td><td style={td}><input type="number" value={r.qty} onChange={e => setRow(i, "qty", e.target.value)} style={input} /></td><td style={td}><input type="number" value={r.grams} onChange={e => setRow(i, "grams", e.target.value)} style={{ ...input, width: 70 }} /></td><td style={td}>{num((r.qty * r.grams) / 1000, 1)}</td></tr>)}
          <tr><td style={{ ...td, color: C.txt }} colSpan={3}>Tổng V dùng để tính {fromRows > 0 ? "(từ bảng trên)" : "(chưa nhập → lấy số liệu 2025 làm cơ sở minh họa)"}</td><td style={{ ...td, color: C.green }}><b>{num(V, 1)} kg</b></td></tr></tbody></table></div>
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Khối lượng 1 bao ở bảng là <b>giá trị giả định</b> — thay bằng khối lượng bao mẫu cân thực tế (theo yêu cầu của Tờ trình: số bao theo từng quy cách × khối lượng bao mẫu, do Phòng Kế toán chốt sau khi kết thúc năm tài chính). Tham chiếu: kỳ 2024 có V = 990.699 kg trên 411.773 t NPK sản xuất ≈ 2,41 kg bao bì/tấn sản phẩm (nếu toàn bộ là bao 50 kg ≈ 8,2 triệu bao, ≈ 120 g/bao — suy ra, chưa kiểm chứng).</div></div>

    <div style={card}><div style={h}>So sánh phương án kỳ 2026 (kê khai trước 01/04/2027)</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: C.sub, marginBottom: 10, alignItems: "center" }}>
        <label>Fs (đ/kg) <input type="number" value={fs} onChange={e => setFs(Number(e.target.value) || 0)} style={input} /></label><span style={{ color: C.dim }}>{num(FS_OLD)} (kỳ trước) → {num(FS_2026)} (TT 24/2026, dự kiến)</span>
        <label>Đơn giá tái chế (đ/kg, chưa VAT) <input type="number" value={price} onChange={e => setPrice(Number(e.target.value) || 0)} style={input} /></label>
        <label>Khối lượng báo giá (kg) <input type="number" value={quoteKg} onChange={e => setQuoteKg(Number(e.target.value) || 0)} style={input} /></label></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}><div style={{ color: C.txt, fontWeight: 600, fontSize: 13 }}>PA1 — Đóng góp Quỹ BVMT Việt Nam</div><div style={{ font: "700 20px 'Syne',system-ui", color: C.txt, margin: "6px 0" }}>{vnd(pa1)}</div><div style={{ color: C.dim, fontSize: 11, lineHeight: 1.6 }}>F = {num(V, 0)} × 10 % × {num(fs)}. Thủ tục đơn giản, không phải theo dõi chứng từ tái chế.</div></div>
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: 12 }}><div style={{ color: C.txt, fontWeight: 600, fontSize: 13 }}>PA2 — Thuê đơn vị tái chế (toàn bộ {num(mand / 1000, 1)} t)</div><div style={{ font: "700 20px 'Syne',system-ui", color: C.green, margin: "6px 0" }}>{vnd(pa2)}</div><div style={{ color: C.dim, fontSize: 11, lineHeight: 1.6 }}>Thấp hơn PA1 {vnd(pa1 - pa2)} ({num(((pa1 - pa2) / pa1) * 100, 0)} %) <b>nếu</b> đơn vị nhận đủ khối lượng. Cần hợp đồng, chứng từ giao nhận riêng, GPMT của đơn vị tái chế, báo cáo kết quả trước 01/4/2028.</div></div>
        <div style={{ border: `1px solid ${cover < 0.5 ? C.amber : C.line}`, borderRadius: 10, padding: 12 }}><div style={{ color: C.txt, fontWeight: 600, fontSize: 13 }}>Báo giá Eco Revive đúng như chào ({num(quoteKg)} kg)</div><div style={{ font: "700 20px 'Syne',system-ui", color: C.txt, margin: "6px 0" }}>{vnd(paQ)}</div><div style={{ color: cover < 0.5 ? C.amber : C.dim, fontSize: 11, lineHeight: 1.6 }}>Chỉ phủ {num(cover * 100, 1)} % khối lượng bắt buộc ({num(mand)} kg) — phần còn lại {num(Math.max(0, mand - quoteKg))} kg chưa có đơn vị nhận.</div></div></div>
      <div style={{ color: C.dim, fontSize: 11, marginTop: 10, lineHeight: 1.6 }}>Số liệu chính thức 2026 phụ thuộc V chốt và Fs theo Thông tư 24/2026. Công cụ này chỉ minh họa theo Tờ trình; chưa mô hình hóa việc kết hợp hai phương án.</div></div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
      <div style={card}><div style={h}>Mốc thời gian</div>{EPR_TIMELINE.map(([d, t]) => <div key={d} style={{ padding: "6px 0", borderTop: `1px solid ${C.line}`, fontSize: 12, lineHeight: 1.6 }}><b style={{ color: C.txt }}>{d}</b><div style={{ color: C.sub }}>{t}</div></div>)}</div>
      <div style={card}><div style={h}>Việc cần làm rõ trước khi chọn phương án</div>{EPR_CHECKLIST.map(c => <label key={c.key} style={{ display: "flex", gap: 8, padding: "6px 0", borderTop: `1px solid ${C.line}`, fontSize: 12, color: st.done[c.key] ? C.green : C.sub, lineHeight: 1.6 }}><input type="checkbox" checked={!!st.done[c.key]} onChange={() => save({ ...st, done: { ...st.done, [c.key]: !st.done[c.key] } })} />{c.label}</label>)}</div></div>

    <div style={card}><div style={h}>Báo giá thu gom – tái chế bao bì nhựa mềm</div>
      <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.8 }}><b style={{ color: C.txt }}>{EPR_QUOTE.company}</b> · {EPR_QUOTE.address}<br />Số {EPR_QUOTE.no} ({EPR_QUOTE.date}), hiệu lực đến {EPR_QUOTE.valid} · {num(EPR_QUOTE.kg)} kg/năm ± {EPR_QUOTE.tol * 100} % · {num(EPR_QUOTE.price)} đ/kg (chưa VAT), {num(EPR_QUOTE.priceVat)} đ/kg (đã VAT 8 %) · thực hiện trong {EPR_QUOTE.period} · thanh toán trong {EPR_QUOTE.pay}.</div>
      <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: C.dim, fontSize: 11, lineHeight: 1.7 }}>{EPR_NOTES.map((n, i) => <li key={i}>{n}</li>)}</ul></div>
  </div>;
}
