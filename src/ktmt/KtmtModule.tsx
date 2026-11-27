"use client";
// @ts-nocheck
// Kiểm toán môi trường: quy trình (giáo trình), dự báo 2025 vs thực tế, đối chiếu nguồn số liệu, cân bằng vật chất, giải pháp, đề cương 688/KH-ĐGS.
import { useState, useEffect } from "react";
import { KTMT_SOURCES, STAGES, WASTE_AUDIT_STEPS, PLAN, BALANCE, DATA_CHECKLIST, OUTLINE_688, LEGAL_NOTES, WASTE_SOURCES, KNK } from "../data/ktmt.ts";
import { crossCheck, forecastVsActual, balanceCheck, impliedFactors, solutionsSummary, progress } from "../lib/ktmt.ts";

const C = { card: "#0d1320", line: "#1d2d40", txt: "#e6edf7", sub: "#9fb0c6", dim: "#6b7f99", green: "#00e5a0", amber: "#ffb020", red: "#ff3860" };
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, minWidth: 0 };
const h = { font: "700 14px 'Syne','Outfit',system-ui", color: C.txt, marginBottom: 10 };
const th = { textAlign: "right", color: C.dim, fontWeight: 500, padding: "4px 8px", whiteSpace: "nowrap" };
const td = { padding: "4px 8px", borderTop: `1px solid ${C.line}`, color: C.sub, textAlign: "right" };
const tdl = { ...td, textAlign: "left" };
const f = (v, d = 0) => (typeof v === "number" && isFinite(v) ? v.toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—");
const sgn = (v, d = 1) => (v == null ? "—" : (v > 0 ? "+" : "") + f(v, d) + " %");
const chip = on => ({ cursor: "pointer", padding: "5px 12px", borderRadius: 999, fontSize: 12, border: `1px solid ${on ? C.green : C.line}`, color: on ? C.green : C.sub, background: on ? C.green + "18" : "transparent" });
const Wrap = ({ children, min = 640 }) => <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: min }}>{children}</table></div>;
const Note = ({ c = C.amber, children }) => <div style={{ borderLeft: `3px solid ${c}`, padding: "6px 10px", color: C.sub, fontSize: 12, background: c + "10", borderRadius: 6 }}>{children}</div>;
const STATUS = { in: ["Trong khoảng", C.green], below: ["Thấp hơn dự báo", C.amber], above: ["Cao hơn dự báo", C.red], na: ["Chưa có số liệu", C.dim] };
const OUT = { ok: ["Đã có", C.green], part: ["Một phần", C.amber], gap: ["Chưa có", C.red] };
const TABS = [["tq", "Quy trình"], ["dub", "Dự báo – thực tế"], ["cb", "Cân bằng vật chất"], ["gp", "Giải pháp"], ["dc", "Đề cương 688/KH-ĐGS"], ["hs", "Hồ sơ dữ liệu"], ["ln", "Lưu ý nguồn"]];
const KEY = "hse_ktmt_done_v1";

export function KtmtModule() {
  const [tab, setTab] = useState("tq");
  const [done, setDone] = useState({});
  const [price, setPrice] = useState("");
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); if (v && typeof v === "object") setDone(v); } catch (e) {} }, []);
  const toggle = id => setDone(d => { const n = { ...d, [id]: !d[id] }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch (e) {} return n; });
  const pr = progress(done), cross = crossCheck(), fc = forecastVsActual(), bal = balanceCheck(), fac = impliedFactors();
  const sol = solutionsSummary(Number(String(price).replace(/\D/g, "")) || 0);
  const nIn = fc.filter(x => x.status === "in").length, nOut = fc.filter(x => x.status === "below" || x.status === "above").length;

  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
      {[["Kế hoạch dự báo KTMT 2025", PLAN.window, "Phòng KT-SX · 5 tài liệu nguồn"], ["Dự báo 2025 vs thực tế", `${nIn} trong khoảng · ${nOut} lệch`, "so với Báo cáo BVMT 2025 (12/01/2026)"], ["Cân bằng vật chất [B]", `Lệch ${f(bal.inDiff, 1)} t ở tổng đầu vào`, "tổng ghi 650.691,5 · cộng ra 650.741,5"], ["Giải pháp dự kiến", `${f(sol.costM)} triệu · ${f(sol.co2e, 1)} tCO₂e/năm`, "5 giải pháp, chưa có đơn giá tiết kiệm"]].map(([a, b, c], i) =>
        <div key={i} style={card}><div style={{ color: C.dim, fontSize: 11 }}>{a}</div><div style={{ font: "700 17px 'Syne',system-ui", color: i === 0 ? C.txt : C.amber, margin: "4px 0" }}>{b}</div><div style={{ color: C.sub, fontSize: 11 }}>{c}</div></div>)}
    </div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{TABS.map(([id, l]) => <span key={id} style={chip(tab === id)} onClick={() => setTab(id)}>{l}</span>)}</div>

    {tab === "tq" && <div style={{ display: "grid", gap: 14 }}>
      <Note c={C.green}>KTMT là hoạt động khuyến khích, không bắt buộc (Điều 74 Luật BVMT 2020). Quy trình theo giáo trình HVNN 2020: 3 khâu khép kín — lập kế hoạch → thực hiện (trước / tại cơ sở / sau kiểm toán) → kế hoạch hành động. Tích vào bước đã hoàn thành (lưu trên trình duyệt này).</Note>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
        {STAGES.map((st, i) => <div key={st.id} style={card}>
          <div style={h}>{st.name} <span style={{ color: C.dim, fontWeight: 400, fontSize: 12 }}>· {pr[i].done}/{pr[i].total}</span></div>
          {st.steps.map(s => <label key={s.id} style={{ display: "flex", gap: 8, padding: "5px 0", borderTop: `1px solid ${C.line}`, cursor: "pointer", alignItems: "flex-start" }}>
            <input type="checkbox" checked={!!done[s.id]} onChange={() => toggle(s.id)} style={{ marginTop: 3 }} />
            <span style={{ fontSize: 12, color: done[s.id] ? C.dim : C.txt }}>{s.label}{s.plant && <div style={{ color: C.dim, fontSize: 11, marginTop: 2 }}>↳ {s.plant}</div>}</span>
          </label>)}
        </div>)}
      </div>
      <div style={card}><div style={h}>Lịch thực hiện theo kế hoạch [B] (đã qua — dùng làm khung cho kỳ kiểm toán tiếp theo)</div>
        <Wrap min={420}><tbody>{PLAN.schedule.map(([a, b]) => <tr key={a}><td style={tdl}>{a}</td><td style={td}>{b}</td></tr>)}</tbody></Wrap></div>
      <div style={card}><div style={h}>Nguồn thải cần cân bằng tại NM (theo hướng kiểm toán chất thải)</div>
        <Wrap><thead><tr><th style={{ ...th, textAlign: "left" }}>Nguồn</th><th style={{ ...th, textAlign: "left" }}>Chất thải</th><th style={{ ...th, textAlign: "left" }}>Công trình kiểm soát</th></tr></thead>
          <tbody>{WASTE_SOURCES.map(w => <tr key={w.src}><td style={tdl}>{w.src}</td><td style={tdl}>{w.waste}</td><td style={tdl}>{w.control}</td></tr>)}</tbody></Wrap></div>
      <div style={card}><div style={h}>9 bước kiểm toán rác thải sinh hoạt (giáo trình §4.3.2)</div>
        <Wrap min={480}><tbody>{WASTE_AUDIT_STEPS.map(s => <tr key={s.n}><td style={{ ...td, width: 30 }}>{s.n}</td><td style={tdl}>{s.name}</td><td style={td}>{s.phase}</td></tr>)}</tbody></Wrap></div>
    </div>}

    {tab === "dub" && <div style={{ display: "grid", gap: 14 }}>
      <div style={card}><div style={h}>Dự báo 2025 [B] so với thực tế 2025 (Báo cáo BVMT 12/01/2026)</div>
        <Wrap><thead><tr><th style={{ ...th, textAlign: "left" }}>Chỉ tiêu</th><th style={th}>Dự báo thấp</th><th style={th}>Dự báo cao</th><th style={th}>Thực tế 2025</th><th style={th}>Lệch so với giữa khoảng</th><th style={{ ...th, textAlign: "left" }}>Đánh giá</th></tr></thead>
          <tbody>{fc.map(x => { const [t, c] = STATUS[x.status]; return <tr key={x.key}><td style={tdl}>{x.label} ({x.unit})</td><td style={td}>{f(x.lo, x.lo < 100 ? 1 : 0)}</td><td style={td}>{f(x.hi, x.hi < 100 ? 1 : 0)}</td><td style={td}>{f(x.actual, x.actual != null && x.actual < 100 ? 2 : 0)}</td><td style={td}>{sgn(x.dev)}</td><td style={{ ...tdl, color: c }}>{t}{x.pointForecast && x.status !== "na" ? " (±10 %)" : ""}</td></tr>; })}</tbody></Wrap>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Dự báo điểm ([B] chỉ ghi “~”) được chấp nhận ±10 % — giả định của app, không có trong [B]. Dầu: báo cáo gốc ghi “tấn/năm” nhưng số trùng với [B] tính bằng lít/1000, nên quy đổi ×1.000 lít. CO₂: báo cáo BVMT không có số liệu; chờ kiểm kê KNK 2025.</div></div>
      <div style={card}><div style={h}>Đối chiếu số liệu cơ sở 2023–2024 giữa kế hoạch [B], Báo cáo BVMT và Kiểm kê KNK</div>
        <Wrap min={820}><thead><tr><th style={{ ...th, textAlign: "left" }}>Chỉ tiêu</th><th style={th}>[B] 2023</th><th style={th}>BC BVMT 2023</th><th style={th}>KNK 2023</th><th style={th}>Lệch</th><th style={th}>[B] 2024</th><th style={th}>BC BVMT 2024</th><th style={th}>Lệch</th></tr></thead>
          <tbody>{cross.map(x => <tr key={x.key}><td style={{ ...tdl, color: x.flag ? C.amber : C.sub }}>{x.label} ({x.unit})</td><td style={td}>{f(x.plan2023, x.plan2023 < 100 ? 2 : 0)}</td><td style={td}>{f(x.bc2023, x.bc2023 != null && x.bc2023 < 100 ? 2 : 0)}</td><td style={td}>{f(x.knk2023)}</td><td style={{ ...td, color: x.d2023 != null && Math.abs(x.d2023) > 2 ? C.amber : C.sub }}>{sgn(x.d2023)}</td><td style={td}>{f(x.plan2024, x.plan2024 < 100 ? 2 : 0)}</td><td style={td}>{f(x.bc2024, x.bc2024 != null && x.bc2024 < 100 ? 2 : 0)}</td><td style={{ ...td, color: x.d2024 != null && Math.abs(x.d2024) > 2 ? C.amber : C.sub }}>{sgn(x.d2024)}</td></tr>)}</tbody></Wrap>
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          <Note>Số 2024 của điện, than khớp hoàn toàn giữa [B], Báo cáo BVMT và Kiểm kê KNK; số 2023 của [B] thấp hơn cả hai nguồn còn lại (điện 6,81 triệu kWh so với 8,25 – 8,31 triệu; than 2.971 t so với 3.563 – 3.539 t). Sản lượng 2023 trong [B] chỉ gồm 10 tháng (261.967 t) so với 333.675 t cả năm trong báo cáo.</Note>
          <Note>CTRCNTT 2024: [B] ghi 7.346,43 t; cộng các dòng trong Báo cáo BVMT 2024 chỉ ra {f(cross.find(x => x.key === "ctrcntt").bc2024, 1)} t. CO₂ 2023: [B] 8.984,94 t; Kiểm kê KNK 2023 — Phạm vi 1 là {f(KNK.y2023.scope1, 1)} t, riêng than {f(KNK.y2023.coalCO2t, 1)} t. Cần xác định phạm vi của con số trong [B].</Note>
        </div></div>
    </div>}

    {tab === "cb" && <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
        <div style={card}><div style={h}>Đầu vào (ước tính, sản lượng 485.000 t)</div>
          <Wrap min={300}><tbody>{BALANCE.inputs.map(i => <tr key={i.label}><td style={tdl}>{i.label}</td><td style={td}>{f(i.t, 1)}</td></tr>)}
            <tr><td style={{ ...tdl, color: C.txt }}>Tổng (cộng lại)</td><td style={{ ...td, color: C.txt }}>{f(bal.inSum, 1)}</td></tr>
            <tr><td style={tdl}>Tổng ghi trong [B]</td><td style={{ ...td, color: C.amber }}>{f(bal.inStated, 1)}</td></tr></tbody></Wrap></div>
        <div style={card}><div style={h}>Đầu ra</div>
          <Wrap min={300}><tbody>{BALANCE.outputs.map(i => <tr key={i.label}><td style={tdl}>{i.label}</td><td style={td}>{f(i.t, 1)}</td></tr>)}
            <tr><td style={{ ...tdl, color: C.txt }}>Tổng (cộng lại)</td><td style={{ ...td, color: C.txt }}>{f(bal.outSum, 1)}</td></tr>
            <tr><td style={tdl}>Tổng ghi trong [B]</td><td style={td}>{f(bal.outStated, 1)}</td></tr></tbody></Wrap></div>
      </div>
      <div style={card}><div style={h}>Kiểm tra cân bằng</div><div style={{ display: "grid", gap: 6 }}>
        <Note>Tổng đầu vào [B] ghi 650.691,5 t nhưng cộng các dòng ra {f(bal.inSum, 1)} t (lệch {f(bal.inDiff, 1)} t).</Note>
        <Note>Đầu ra gấp {f(bal.outInRatio, 1)} lần đầu vào: dòng khí thải ~5,4 triệu t chủ yếu là không khí đốt/làm khô, trong khi đầu vào chỉ tính 49.265 t không khí đốt cháy. Cân bằng tổng không đóng — nên tách cân bằng chất rắn, nước, năng lượng và cân bằng khí (theo lưu lượng đo) thay vì một bảng tổng.</Note>
        <Note c={C.green}>Chất rắn: vào {f(bal.solidIn, 1)} t (nguyên liệu + than + dầu) · ra {f(bal.solidOut, 1)} t (sản phẩm + CTR {f(bal.solidsOut, 1)} t). CTRCNTT 7.800 t phần lớn là vật liệu dùng lại tại cơ sở nên có nguy cơ tính trùng với nguyên liệu; hao hụt nguyên liệu 1 % khớp (489.850 → 485.000).</Note>
        <Note>Nước: vào 106.700 t, nước thải ra 21.000 t — phần chênh {f(bal.waterUnaccounted)} t (bay hơi, ẩm trong sản phẩm, rửa khí thải) không có dòng riêng. Cần dòng “bay hơi/ẩm sản phẩm” để cân bằng nước. Lượng nước thải 21.000 t cũng khác 18.000 m³ ghi ở Báo cáo BVMT và công suất HTXLNT 120 m³/ngày đêm theo GPMT.</Note>
        <Note>CO₂ nhiên liệu: than 14.404,5 t (hệ số ngầm định {f(fac.coalPlan, 2)} t/t) + dầu 199,97 t ({f(fac.oilPlan, 3)} t/t) = {f(fac.co2Sum, 1)} t; [B] ghi ~14.700 t. Kiểm kê KNK 2023 dùng hệ số than ≈ {f(fac.coalKnk2023, 3)} t CO₂/t — nên thống nhất một hệ số (QĐ 2626/QĐ-BTNMT theo báo cáo KNK).</Note>
      </div></div>
    </div>}

    {tab === "gp" && <div style={{ display: "grid", gap: 14 }}>
      <div style={card}><div style={h}>Giải pháp giảm thiểu dự kiến [B] §6</div>
        <Wrap min={760}><thead><tr><th style={{ ...th, textAlign: "left" }}>Đối tượng</th><th style={{ ...th, textAlign: "left" }}>Giải pháp</th><th style={{ ...th, textAlign: "left" }}>Hiệu quả</th><th style={th}>Giảm tCO₂e/năm</th><th style={th}>Chi phí (triệu đ)</th><th style={th}>Hệ số ngầm định</th></tr></thead>
          <tbody>{sol.rows.map(s => <tr key={s.id}><td style={tdl}>{s.target}</td><td style={tdl}>{s.action}</td><td style={tdl}>{s.effect}</td><td style={td}>{s.co2e ? f(s.co2e, 1) : "—"}</td><td style={td}>{f(s.costM)}</td><td style={{ ...td, color: s.id === "s1" ? C.amber : C.sub }}>{s.kgPerUnit != null ? `${f(s.kgPerUnit, s.kgPerUnit < 100 ? 2 : 0)} kg CO₂e/${s.qtyUnit}` : "—"}</td></tr>)}
            <tr><td style={{ ...tdl, color: C.txt }} colSpan={3}>Tổng</td><td style={{ ...td, color: C.txt }}>{f(sol.co2e, 1)}</td><td style={{ ...td, color: C.txt }}>{f(sol.costM)}</td><td style={td}></td></tr></tbody></Wrap></div>
      <Note>Tuần hoàn 6.000 m³ nước quy ra 31,6 tCO₂e (≈ 5,3 kg/m³) — cao so với phần điện bơm/xử lý nước nên cần kiểm tra phương pháp quy đổi. Giải pháp giảm than 250 t khớp hệ số 2,97 t CO₂/t trong [B]; nếu dùng hệ số KNK ≈ 2,62 thì giảm ≈ {f(250 * fac.coalKnk2023, 1)} tCO₂e. Giải pháp lắp hệ thống đo KNK không giảm phát thải trực tiếp.</Note>
      <div style={card}><div style={h}>Hoàn vốn giải pháp giảm than (nhập đơn giá thực tế)</div>
        <label style={{ fontSize: 12, color: C.sub }}>Đơn giá than (VNĐ/tấn): <input value={price} onChange={e => setPrice(e.target.value)} placeholder="nhập theo hóa đơn" style={{ marginLeft: 8, background: "#0a0f1a", border: `1px solid ${C.line}`, color: C.txt, borderRadius: 8, padding: "5px 8px", width: 160 }} /></label>
        <div style={{ color: C.sub, fontSize: 12, marginTop: 8 }}>{sol.coalSavingM != null ? <>Tiết kiệm {f(sol.coalSavingM, 1)} triệu đ/năm (250 t) → hoàn vốn chi phí 120 triệu đ sau <b style={{ color: C.green }}>{f(sol.coalPaybackYears, 2)} năm</b>. Chưa tính chi phí vận hành thêm.</> : "Kế hoạch [B] không nêu đơn giá — app không tự giả định. Nhập đơn giá để tính."}</div></div>
    </div>}

    {tab === "dc" && <div style={card}><div style={h}>Đối chiếu đề cương báo cáo Tập đoàn/Tổng công ty — KH 688/KH-ĐGS (23/01/2025) ↔ dữ liệu hiện có</div>
      <div style={{ color: C.dim, fontSize: 11, marginBottom: 8 }}>Đoàn giám sát chuyên đề Quốc hội (NQ 131/2024/QH15) — giám sát việc thực hiện chính sách, pháp luật BVMT từ khi Luật BVMT 2020 có hiệu lực. Mỗi nội dung yêu cầu số liệu, bảng biểu minh chứng.</div>
      <Wrap min={820}><thead><tr><th style={{ ...th, textAlign: "left" }}>Mục</th><th style={{ ...th, textAlign: "left" }}>Nội dung yêu cầu</th><th style={{ ...th, textAlign: "left" }}>Dữ liệu có sẵn</th><th style={{ ...th, textAlign: "left" }}>Tình trạng</th><th style={{ ...th, textAlign: "left" }}>Còn thiếu</th></tr></thead>
        <tbody>{OUTLINE_688.map((o, i) => { const [t, c] = OUT[o.status]; return <tr key={i}><td style={tdl}>{o.part}</td><td style={tdl}>{o.item}</td><td style={tdl}>{o.source}</td><td style={{ ...tdl, color: c }}>{t}</td><td style={tdl}>{o.gap}</td></tr>; })}</tbody></Wrap></div>}

    {tab === "hs" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 12 }}>
      {DATA_CHECKLIST.map(g => <div key={g.group} style={card}><div style={h}>{g.group}</div><div style={{ color: C.dim, fontSize: 11, marginBottom: 6 }}>Phụ trách: {g.owner}</div>
        {g.items.map(it => <div key={it} style={{ fontSize: 12, color: C.sub, padding: "4px 0", borderTop: `1px solid ${C.line}` }}>▫ {it}</div>)}</div>)}
      <div style={{ ...card, gridColumn: "1 / -1" }}><div style={h}>Nguồn tài liệu</div>
        <Wrap min={500}><tbody>{KTMT_SOURCES.map(s => <tr key={s.id}><td style={{ ...td, width: 30 }}>[{s.id}]</td><td style={tdl}>{s.name}</td><td style={tdl}>{s.use}</td></tr>)}</tbody></Wrap></div>
    </div>}

    {tab === "ln" && <div style={card}><div style={h}>Điểm cần cập nhật / thận trọng khi dùng tài liệu nguồn</div>
      <div style={{ display: "grid", gap: 6 }}>{LEGAL_NOTES.map((n, i) => <Note key={i}>{n}</Note>)}</div></div>}
  </div>;
}
