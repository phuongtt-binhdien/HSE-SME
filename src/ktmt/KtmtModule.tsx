"use client";
// @ts-nocheck
// Kiểm toán môi trường: quy trình (giáo trình), dự báo 2025 vs thực tế, đối chiếu nguồn số liệu, cân bằng vật chất, giải pháp, đề cương 688/KH-ĐGS.
import { useState, useEffect } from "react";
import { SUBMITTED, AUDIT2024, REPORT_2023, REPORT_2025, INCONSISTENCIES2, VDL, PL1_2023, INCONSISTENCIES, KTMT_SOURCES, STAGES, WASTE_AUDIT_STEPS, PLAN, BALANCE, DATA_CHECKLIST, OUTLINE_688, LEGAL_NOTES, WASTE_SOURCES, KNK } from "../data/ktmt.ts";
import { crossCheck, forecastVsActual, balanceCheck, impliedFactors, solutionsSummary, progress, audit2024Check, pl1Check, report2023Check, report2025Check, coverage } from "../lib/ktmt.ts";

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
const TABS = [["tq", "Quy trình"], ["bc", "Báo cáo đã lập"], ["mt", "Mâu thuẫn hồ sơ"], ["p1", "Phụ lục 1 (2023)"], ["r2", "KTMT 2023 · 2025"], ["vd", "Giáo trình Võ Đình Long"], ["dub", "Dự báo – thực tế"], ["cb", "Cân bằng vật chất"], ["gp", "Giải pháp"], ["dc", "Đề cương 688/KH-ĐGS"], ["hs", "Hồ sơ dữ liệu"], ["ln", "Lưu ý nguồn"]];
const KEY = "hse_ktmt_done_v1";

export function KtmtModule() {
  const [tab, setTab] = useState("tq");
  const [done, setDone] = useState({});
  const [price, setPrice] = useState("");
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(KEY) || "{}"); if (v && typeof v === "object") setDone(v); } catch (e) {} }, []);
  const toggle = id => setDone(d => { const n = { ...d, [id]: !d[id] }; try { localStorage.setItem(KEY, JSON.stringify(n)); } catch (e) {} return n; });
  const r23 = report2023Check(), r25 = report2025Check(), cov = coverage(), au = audit2024Check(), p1 = pl1Check(), pr = progress(done), cross = crossCheck(), fc = forecastVsActual(), bal = balanceCheck(), fac = impliedFactors();
  const sol = solutionsSummary(Number(String(price).replace(/\D/g, "")) || 0);
  const nIn = fc.filter(x => x.status === "in").length, nOut = fc.filter(x => x.status === "below" || x.status === "above").length;

  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
      {[["Kế hoạch dự báo KTMT 2025", PLAN.window, "Phòng KT-SX · 5 tài liệu nguồn"], ["Dự báo 2025 vs thực tế", `${nIn} trong khoảng · ${nOut} lệch`, "so với Báo cáo BVMT 2025 (12/01/2026)"], ["Mâu thuẫn giữa các hồ sơ KTMT", `${[...INCONSISTENCIES, ...INCONSISTENCIES2].filter(x => x.sev === "red").length} nghiêm trọng · ${[...INCONSISTENCIES, ...INCONSISTENCIES2].filter(x => x.sev === "amber").length} cần rà`, "báo cáo 2023, 2024, 2025, 2 phụ lục, kế hoạch 2025"], ["Giải pháp dự kiến", `${f(sol.costM)} triệu · ${f(sol.co2e, 1)} tCO₂e/năm`, "5 giải pháp, chưa có đơn giá tiết kiệm"]].map(([a, b, c], i) =>
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

    {tab === "bc" && <div style={{ display: "grid", gap: 14 }}>
      <div style={card}><div style={h}>Các văn bản KTMT đã lập</div>
        <Wrap min={640}><thead><tr><th style={th}>Ký hiệu</th><th style={{ ...th, textAlign: "left" }}>Văn bản</th><th style={th}>Ngày</th><th style={{ ...th, textAlign: "left" }}>Ghi chú</th></tr></thead>
          <tbody>{SUBMITTED.map(s => <tr key={s.id}><td style={td}>[{s.id}]</td><td style={tdl}>{s.name}</td><td style={td}>{s.date}</td><td style={tdl}>{s.note}</td></tr>)}</tbody></Wrap></div>
      <div style={card}><div style={h}>Báo cáo KTMT năm 2024 [I] — hiện trạng và cân bằng vật chất (kiểm tra lại số học)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
          <Wrap min={300}><tbody>{AUDIT2024.balanceIn.map(([n, v]) => <tr key={n}><td style={tdl}>{n}</td><td style={td}>{f(v, 2)}</td></tr>)}
            <tr><td style={{ ...tdl, color: C.txt }}>Tổng đầu vào (cộng lại)</td><td style={{ ...td, color: C.txt }}>{f(au.inSum, 2)}</td></tr></tbody></Wrap>
          <Wrap min={300}><tbody>{AUDIT2024.balanceOut.map(([n, v]) => <tr key={n}><td style={tdl}>{n}</td><td style={td}>{f(v, 2)}</td></tr>)}
            <tr><td style={{ ...tdl, color: C.txt }}>Tổng đầu ra (cộng lại)</td><td style={{ ...td, color: C.txt }}>{f(au.outSum, 2)}</td></tr></tbody></Wrap>
        </div>
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          <Note c={C.green}>Các tổng đầu vào, đầu ra và chênh lệch 4.549.565,65 t cộng đúng. Suất tiêu hao: điện {f(au.sec.kWhPerT, 2)} kWh/t, than {f(au.sec.coalKgPerT, 2)} kg/t (báo cáo ghi 10,14), nước {f(au.sec.waterM3PerT, 2)} m³/t; hiệu suất nguyên liệu {f(au.efficiency, 1)} %; CTRCNTT tái sử dụng {f(au.reusePct, 1)} % (khớp 72 %).</Note>
          <Note>Khí thải 4.665.600 t chiếm {f(au.fluePct, 1)} % đầu ra (báo cáo ghi 91,5 %); con số này = 360.000 m³/h × 8.640 h × 1,5 kg/m³ (suy ra) — giả định chạy 8.640 giờ, trong khi Báo cáo BVMT dùng cùng lưu lượng nhưng ≈ {f(au.bcHours)} giờ (1.628 triệu m³). Chênh lệch 4,55 triệu t gần như hoàn toàn là dòng khí chứ không phải “CO₂ và hơi nước từ đốt nhiên liệu” (CO₂ chỉ {f(AUDIT2024.co2.total, 0)} t).</Note>
          <Note>Không khí đốt cháy: than 41.783 + dầu 834 = {f(au.airSum)} t, bảng ghi 43.000 (lệch {f(au.airDiff)}). CTRSH 0,26 t/ngày × 289 ngày = {f(au.ctrsh, 2)} t (ghi 75,19) — NM chạy 345 ngày/năm theo báo cáo KNK. CTNH 71,5 kg/tháng × 12 = {f(au.ctnh * 1000)} kg (ghi 840 kg).</Note>
          <Note>Giải pháp: 3 giải pháp môi trường cộng {f(au.solutionsCost)} triệu đ (kiến nghị ghi {f(AUDIT2024.recommendCostStated)} triệu), giảm {f(au.solutionsCo2e)} tCO₂e (khớp 625). Hệ số than {f(au.coalFactor, 2)} t CO₂/t, dầu {f(au.oilFactor, 3)} t CO₂/t.</Note>
        </div></div>
      <div style={card}><div style={h}>Giải pháp đề xuất 2024 [I] so với kế hoạch 2025 [B]</div>
        <Wrap min={700}><thead><tr><th style={{ ...th, textAlign: "left" }}>Đối tượng</th><th style={{ ...th, textAlign: "left" }}>Giải pháp</th><th style={th}>2024: hiệu quả · CO₂e · chi phí</th><th style={th}>2025: hiệu quả · CO₂e · chi phí</th></tr></thead>
          <tbody>{[["Nước thải", 0, 0], ["Khí thải", 1, 1], ["CTRSH", 2, 2]].map(([n, a, b]) => { const x = AUDIT2024.solutions[a], y = sol.rows[b]; return <tr key={n}><td style={tdl}>{n}</td><td style={tdl}>{x.action}</td><td style={td}>{x.effect} · {f(x.co2e, 1)} t · {f(x.costM)} tr</td><td style={td}>{y.effect} · {f(y.co2e, 1)} t · {f(y.costM)} tr</td></tr>; })}</tbody></Wrap>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Chưa có bằng chứng triển khai các giải pháp 2024 trong hồ sơ; kế hoạch 2025 chỉ tăng quy mô (5.000 → 6.000 m³, 200 → 250 t than, 15 → 20 t) và giữ cùng hệ số quy đổi.</div></div>
      <div style={card}><div style={h}>Giải pháp chất thải rắn đề xuất 2024 [I] §5.3</div>
        <Wrap min={560}><tbody>{AUDIT2024.wasteSolutions.map(w => <tr key={w.target}><td style={tdl}>{w.target}</td><td style={tdl}>{w.action}</td><td style={td}>{w.effect}</td><td style={td}>{f(w.costM)} triệu đ</td></tr>)}</tbody></Wrap></div>
    </div>}

    {tab === "mt" && <div style={card}><div style={h}>Cùng một nội dung — các hồ sơ ghi khác nhau</div>
      <div style={{ color: C.dim, fontSize: 11, marginBottom: 8 }}>[F] Phụ lục 2 (19/07/2024) · [H] Báo cáo gửi Tập đoàn (30/10/2024) · [I] Báo cáo KTMT 2024 (11/2024). Cột “Nhận định” là đối chiếu của app, cần xác minh với văn bản gốc trước khi sửa.</div>
      <Wrap min={980}><thead><tr><th style={{ ...th, textAlign: "left" }}>Nội dung</th><th style={{ ...th, textAlign: "left" }}>[F]</th><th style={{ ...th, textAlign: "left" }}>[H]</th><th style={{ ...th, textAlign: "left" }}>[I]</th><th style={{ ...th, textAlign: "left" }}>Nhận định</th></tr></thead>
        <tbody>{INCONSISTENCIES.map(x => <tr key={x.topic}><td style={{ ...tdl, color: x.sev === "red" ? C.red : C.amber, verticalAlign: "top" }}>{x.topic}</td><td style={{ ...tdl, verticalAlign: "top" }}>{x.f}</td><td style={{ ...tdl, verticalAlign: "top" }}>{x.h}</td><td style={{ ...tdl, verticalAlign: "top" }}>{x.i}</td><td style={{ ...tdl, verticalAlign: "top", color: C.txt }}>{x.note}</td></tr>)}</tbody></Wrap></div>}

    {tab === "p1" && <div style={{ display: "grid", gap: 14 }}>
      <div style={card}><div style={h}>Phụ lục 1 [G] — số liệu 2023 theo quy trình</div>
        <Wrap min={560}><tbody>
          <tr><td style={tdl}>Điện: tạo hạt (A) + trộn (B)</td><td style={td}>{f(PL1_2023.kWhA)} + {f(PL1_2023.kWhB)} = {f(p1.kwh)} kWh</td><td style={td}>{sgn(p1.kwhDiffBc)} so với BC BVMT · {sgn(p1.kwhDiffKnk)} so với KNK</td></tr>
          <tr><td style={tdl}>Than (quy trình A)</td><td style={td}>{f(PL1_2023.coalT)} t</td><td style={td}>BC BVMT 3.563 · KNK 3.538,6</td></tr>
          <tr><td style={tdl}>Nước sạch đầu vào</td><td style={td}>{f(PL1_2023.waterM3)} m³</td><td style={td}>trùng BC BVMT</td></tr>
          <tr><td style={tdl}>Nguyên liệu / sản phẩm: A + B</td><td style={td}>{f(PL1_2023.materialsA)} + {f(PL1_2023.materialsB)} = {f(p1.products)} t</td><td style={{ ...td, color: C.amber }}>{sgn(p1.productDiffBc)} so với 333.675 t (BC BVMT)</td></tr>
          <tr><td style={tdl}>Nước thải</td><td style={td}>{f(PL1_2023.wastewaterM3)} m³</td><td style={td}>BC BVMT 18.000 · kế hoạch 2025: 6.240</td></tr></tbody></Wrap>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Hóa chất xử lý nước thải 2023: {PL1_2023.chemicals.map(([n, v]) => `${n} ${f(v, 1)}`).join(" · ")}. {PL1_2023.chemUnitNote}.</div></div>
      <div style={card}><div style={h}>Kiểm kê KNK phạm vi 1 trong [G] (bản nháp 07/2024) so với báo cáo kiểm kê ký 29/07/2024</div>
        <Wrap min={520}><tbody>{PL1_2023.ghgDraft.map(([n, v]) => <tr key={n}><td style={tdl}>{n}</td><td style={td}>{f(v, 2)} tCO₂e</td></tr>)}
          <tr><td style={{ ...tdl, color: C.txt }}>Tổng (cộng lại)</td><td style={{ ...td, color: C.txt }}>{f(p1.ghgSum, 2)}</td></tr>
          <tr><td style={tdl}>Báo cáo kiểm kê chính thức — Phạm vi 1</td><td style={td}>{f(p1.ghgFinal, 2)}</td></tr></tbody></Wrap>
        <Note>Bản nháp cao hơn bản chính thức {f(p1.ghgDiffFinal, 2)} tCO₂e: DO xe nâng 239,87 so với 245,66; môi chất lạnh 23,78 so với 5,68; bình cứu hỏa 0,63 so với 0,03; DO máy phát 7,33 so với 7,50. Dòng “xử lý nước thải công nghiệp” báo lỗi #DIV/0! trong bản nháp. Số trong báo cáo gửi Tập đoàn cần dùng bản chính thức.</Note></div>
      <div style={card}><div style={h}>Chất lượng nước thải trước xử lý (4 đợt) và kiểm tra thiết kế theo mô hình hiệu suất của [G]</div>
        <Wrap min={820}><thead><tr><th style={{ ...th, textAlign: "left" }}>Thông số (mg/L)</th>{PL1_2023.influent.dot.map(d => <th key={d} style={th}>{d}</th>)}<th style={th}>Hiệu suất mô hình</th><th style={th}>Giới hạn (cột A)</th><th style={th}>Cần xử lý (đợt xấu nhất)</th><th style={{ ...th, textAlign: "left" }}>Dự báo vượt</th></tr></thead>
          <tbody>{p1.design.map(d => <tr key={d.k}><td style={tdl}>{d.k}</td>{PL1_2023.influent[d.k].map((v, i) => <td key={i} style={td}>{f(v, 1)}</td>)}<td style={td}>{f(d.removalModelPct, 1)} %</td><td style={td}>{f(d.limit, 2)}</td><td style={td}>{f(d.removalNeededPct, 1)} %</td><td style={{ ...tdl, color: d.exceed.length ? C.red : C.green }}>{d.exceed.length ? d.exceed.join(", ") : "Không"}</td></tr>)}</tbody></Wrap>
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          <Note>[G] tính hiệu suất từng bể chỉ trên đợt 1 (TN 68, TP 23,4 mg/L). Đợt 2 và 4 có TN 350 và 537,6 mg/L, TP 153 và 131 mg/L, amoni 327 và 480 mg/L; áp cùng hiệu suất, TN đầu ra khoảng {f(PL1_2023.influent.TN[3] * p1.design.find(d => d.k === "TN").factor, 0)} mg/L, vượt giới hạn 26,4 mg/L nhiều lần (cần ≈ {f(p1.design.find(d => d.k === "TN").removalNeededPct, 0)} % thay vì ≈ {f(p1.design.find(d => d.k === "TN").removalModelPct, 0)} %). Đây là ước tính từ số liệu của [G], không phải số đo đầu ra; Báo cáo BVMT chỉ quan trắc đầu ra 6 thông số, không có TN, TP, amoni.</Note>
          <Note>Cân bằng nguyên tố N + P: vào {f(PL1_2023.elementBal.totalIn)} kg (N {f(PL1_2023.elementBal.nIn)} = {f(PL1_2023.influent.TN[0], 0)} mg/L × 14.400 m³; P {f(PL1_2023.elementBal.pIn)}), ra 255 + 67 + 993 = {f(p1.elOut)} kg. Dòng “khí thải/bay hơi” {f(PL1_2023.elementBal.out[2])} kg ({f(p1.plugPct, 1)} %) là số bù để khép cân bằng, không đo. Khó giải thích bằng bay hơi (N, P chủ yếu đi vào bùn và nước thải) — cần cân bằng lại theo lượng bùn thải và nước đầu ra.</Note>
          <Note c={C.dim}>Giới hạn BOD₅ trong [G] = 24 mg/L; theo QCVN 40:2011 cột A × Kq 1,2 × Kf 1,1 phải là {f(p1.bodLimitExpected, 1)} mg/L. COD 99, TSS 66, TN 26,4, TP 5,28 đúng công thức.</Note>
        </div></div>
    </div>}

    {tab === "r2" && <div style={{ display: "grid", gap: 14 }}>
      <Note c={C.dim}>[J] Báo cáo KTMT 2023 (11/2023, số liệu 01–10/2023) là nguồn của các số “2023” trong kế hoạch dự báo [B]; [K] Báo cáo KTMT 2025 (bìa ghi “NĂM 2026”). Các phép tính dưới đây là kiểm tra lại số học và đơn vị trong chính hai báo cáo.</Note>
      <div style={card}><div style={h}>[J] KTMT 2023 — kiểm tra bảng số liệu</div>
        <Wrap min={720}><thead><tr><th style={{ ...th, textAlign: "left" }}>Chỉ tiêu</th><th style={th}>Báo cáo ghi</th><th style={th}>Tính lại</th><th style={th}>Chênh</th></tr></thead><tbody>
          <tr><td style={tdl}>Điện 10 tháng (kWh)</td><td style={td}>{f(REPORT_2023.kWhStatedTotal)}</td><td style={{ ...td, color: C.amber }}>{f(r23.kwh)}</td><td style={td}>{f(-r23.kwhDiff)} (đảo số)</td></tr>
          <tr><td style={tdl}>Sản lượng 10 tháng (t)</td><td style={td}>{f(REPORT_2023.productStatedTotal)}</td><td style={td}>{f(r23.prod)}</td><td style={td}>0</td></tr>
          <tr><td style={tdl}>STH điện (kWh/t)</td><td style={td}>{f(REPORT_2023.sthStatedAvg, 2)}</td><td style={{ ...td, color: C.amber }}>{f(r23.sthTrue, 2)}</td><td style={td}>trung bình các tháng ≠ tỷ số tổng</td></tr>
          <tr><td style={tdl}>Than lò sấy (t)</td><td style={td}>{f(REPORT_2023.coalDryerStatedTotal)}</td><td style={{ ...td, color: C.amber }}>{f(r23.dryer, 1)}</td><td style={td}>lò hơi {f(r23.boiler, 2)} khớp</td></tr>
          <tr><td style={tdl}>Than hai lò (t)</td><td style={td}>{f(REPORT_2023.coalStatedTotal)}</td><td style={td}>{f(r23.coalSum, 2)}</td><td style={td}>{f(r23.coalSum - REPORT_2023.coalStatedTotal, 2)}</td></tr>
          <tr><td style={tdl}>Nước (đơn vị ghi “lít”)</td><td style={td}>{f(REPORT_2023.waterStated)}</td><td style={td}>{f(r23.water)} m³</td><td style={td}>{f(r23.waterPerGranulated, 2)} m³/t tạo hạt (ghi 0,43)</td></tr>
          <tr><td style={tdl}>TOE: dầu DO / than</td><td style={td}>{f(REPORT_2023.toeTable.do.toe)} / {f(REPORT_2023.toeTable.than.toe)}</td><td style={{ ...td, color: C.red }}>than ≈ {f(r23.toe.coalExpected)} TOE</td><td style={td}>hai ô đổi chỗ; tổng {f(r23.toe.totalSum)} khớp</td></tr>
          <tr><td style={tdl}>Đơn giá suy ra: than · dầu · điện</td><td style={td} colSpan={2}>{f(r23.price.coalPerT / 1e6, 2)} triệu đ/t · {f(r23.price.doPerL)} đ/L · {f(r23.price.kWh)} đ/kWh</td><td style={td}>kiểm tra lại số tiền</td></tr>
        </tbody></Wrap>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Hóa chất xử lý nước thải 10 tháng 2023 (đơn vị kg — báo cáo ghi rõ): {REPORT_2023.chemicalsKg.map(([n, v]) => `${n} ${f(v, 1)}`).join(" · ")}. Đơn vị này xác nhận kg cho cùng danh mục ở Phụ lục 1 (2023) và [K] (2025). PAC trên lưu lượng ghi: 2023 (10 tháng) {f(r23.chemPerM3[0][1], 2)} kg/m³ (thiết kế 0,2), 2025 {f(r25.pacPerM3, 3)} kg/m³ — định lượng hóa chất tính theo lưu lượng khác nhau gấp ≈ {f(r23.chemPerM3[0][1] / r25.pacPerM3, 1)} lần giữa hai năm.</div></div>
      <div style={card}><div style={h}>[J] 9 giải pháp đầu tiên (kgCO₂/năm, chi phí nghìn đồng) — nguồn của giải pháp trong [I], [B]</div>
        <Wrap min={720}><thead><tr><th style={th}>#</th><th style={{ ...th, textAlign: "left" }}>Giải pháp</th><th style={{ ...th, textAlign: "left" }}>Hiệu quả</th><th style={th}>kgCO₂/năm</th><th style={th}>Chi phí (nghìn đ)</th></tr></thead>
          <tbody>{REPORT_2023.solutions.map(x => <tr key={x.n}><td style={td}>{x.n}</td><td style={tdl}>{x.what}</td><td style={tdl}>{x.effect}</td><td style={{ ...td, color: x.n === 2 || x.n === 8 ? C.amber : C.sub }}>{f(x.kgCo2)}</td><td style={td}>{f(x.costK)}</td></tr>)}</tbody></Wrap>
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          <Note c={C.red}>Giải pháp 2 là 2.634 kgCO₂/năm (≈ 0,44 kg/m³). 12 × 2,634 = {f(r23.planAnnualised, 3)} tCO₂e — đúng số 31,6 tCO₂e của kế hoạch 2025 [B] cho 6.000 m³: số này nhân thêm 12 lần so với đơn vị “/năm”; tính lại cho 6.000 m³ ≈ 2,6 tCO₂e, và tổng giảm của 5 giải pháp [B] giảm từ 790,6 xuống ≈ {f(790.6 - 31.6 + 2.634, 1)} tCO₂e.</Note>
          <Note c={C.red}>Giải pháp 8 (tuần hoàn nước thải sau xử lý): {f(REPORT_2023.solutions[7].m3PerMonth)} m³/tháng = {f(r23.s8PerDay)} m³/ngày — gấp {f(r23.s8VsDesign, 1)} lần công suất HTXLNT 120 m³/ngày đêm; cả năm {f(r23.s8PerYear)} m³ so với 6.240–18.000 m³/năm nước thải ghi trong các báo cáo.</Note>
        </div></div>
      <div style={card}><div style={h}>[K] KTMT 2025 — kiểm tra</div>
        <Wrap min={720}><thead><tr><th style={{ ...th, textAlign: "left" }}>Chỉ tiêu</th><th style={th}>Báo cáo ghi</th><th style={th}>Tính lại</th><th style={{ ...th, textAlign: "left" }}>Nhận xét</th></tr></thead><tbody>
          <tr><td style={tdl}>Sản lượng 12 tháng (t)</td><td style={td}>{f(REPORT_2025.productionStated)}</td><td style={td}>{f(r25.prod)}</td><td style={tdl}>khớp Báo cáo BVMT 2025</td></tr>
          <tr><td style={tdl}>Điện 12 tháng (kWh)</td><td style={td}>{f(REPORT_2025.kWhStated)}</td><td style={td}>{f(r25.kwh)}</td><td style={tdl}>STH 12 tháng đều khớp</td></tr>
          <tr><td style={tdl}>Dầu DO: xe nâng + xe đưa rước (L)</td><td style={td}>{f(REPORT_2025.energy.do.qty)}</td><td style={td}>{f(r25.doSum)}</td><td style={tdl}>Báo cáo BVMT 2025 chỉ có phần xe nâng (104.020)</td></tr>
          <tr><td style={tdl}>Tổng năng lượng quy đổi (TOE)</td><td style={td}>{f(REPORT_2025.energy.totalStated)}</td><td style={{ ...td, color: C.red }}>{f(r25.toe.recomputed)}</td><td style={tdl}>than 4.594 t ghi 93 TOE, phải ≈ {f(r25.toe.coalExpected)} (hệ số 0,70 TOE/t); thiếu ≈ {f(r25.toe.understate)} TOE</td></tr>
          <tr><td style={tdl}>STH than (kg/t)</td><td style={td}>~3,7</td><td style={{ ...td, color: C.amber }}>{f(r25.coalKgPerT, 2)}</td><td style={tdl}>3,7 là của riêng lò hơi năm 2023</td></tr>
          <tr><td style={tdl}>Nước (m³/t)</td><td style={td}>“0,43 lít/tấn”</td><td style={{ ...td, color: C.amber }}>{f(r25.waterM3PerT, 2)}</td><td style={tdl}>theo 76.679 m³ (Báo cáo BVMT)</td></tr>
          <tr><td style={tdl}>Đơn giá suy ra: than · dầu · điện</td><td style={td} colSpan={2}>{f(r25.price.coalPerT / 1e6, 2)} triệu đ/t · {f(r25.price.doPerL)} đ/L · {f(r25.price.kWh)} đ/kWh</td><td style={tdl}>than, dầu cao bất thường</td></tr>
          <tr><td style={tdl}>Nước thải 2025 (m³)</td><td style={td}>{f(REPORT_2025.stated.wwM3)}</td><td style={td}>{f(r25.wwPerDay, 1)} m³/ngày</td><td style={tdl}>Báo cáo BVMT: 18.000; 2023: 6.240 / 14.400 / 18.000</td></tr>
        </tbody></Wrap></div>
      <div style={card}><div style={h}>[K] Quan trắc nước thải Q1–Q3/2025 — báo cáo ghi “Đạt” cho mọi chỉ tiêu</div>
        <Wrap min={640}><thead><tr><th style={{ ...th, textAlign: "left" }}>Chỉ tiêu</th><th style={th}>Q1</th><th style={th}>Q2</th><th style={th}>Q3</th><th style={th}>Giới hạn trong bảng</th><th style={{ ...th, textAlign: "left" }}>Số lần vượt</th></tr></thead>
          <tbody>{r25.ww.map(x => <tr key={x.k}><td style={tdl}>{x.k} ({x.u})</td>{x.vals.map((v, i) => <td key={i} style={{ ...td, color: v > x.lim ? C.red : C.sub }}>{f(v, 1)}</td>)}<td style={td}>{f(x.lim)}</td><td style={{ ...tdl, color: x.over ? C.red : C.green }}>{x.over}/3</td></tr>)}</tbody></Wrap>
        <div style={{ color: C.red, fontSize: 12, marginTop: 8 }}>{r25.wwOver}/{r25.wwTotal} giá trị vượt giới hạn in trong chính bảng ({r25.wwParamsOver.join(", ")}), nhưng cột đánh giá ghi “Đạt”. Cần đối chiếu phiếu kết quả để biết đây là mẫu đầu vào hay nước sau xử lý; không dùng bảng này làm hồ sơ nộp khi chưa xác minh.</div></div>
      <div style={card}><div style={h}>[K] Kiểm kê KNK 2025 (kiểm tra phép tính)</div>
        <Wrap min={560}><tbody>{REPORT_2025.ghg.rows.map(([n, v]) => <tr key={n}><td style={tdl}>{n}</td><td style={td}>{f(v, 2)} tCO₂e</td></tr>)}
          <tr><td style={{ ...tdl, color: C.txt }}>Phạm vi 1 (cộng lại · ghi {f(REPORT_2025.ghg.scope1Stated, 2)})</td><td style={{ ...td, color: C.txt }}>{f(r25.ghg.s1, 2)}</td></tr>
          <tr><td style={tdl}>Phạm vi 2: {f(REPORT_2025.ghg.mwh, 3)} MWh × {f(REPORT_2025.ghg.ef, 4)}</td><td style={td}>{f(r25.ghg.scope2Calc, 2)} (ghi {f(REPORT_2025.ghg.scope2, 2)})</td></tr>
          <tr><td style={{ ...tdl, color: C.txt }}>Tổng (ghi {f(REPORT_2025.ghg.totalStated, 2)})</td><td style={{ ...td, color: C.txt }}>{f(r25.ghg.total, 2)}</td></tr></tbody></Wrap>
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          <Note c={C.green}>Các phép cộng khớp; tăng {f(r25.ghg.growth, 1)} % so với 2024 (17.655,89 tCO₂e — đúng số trong tab Kiểm Kê KNK). Hệ số than {f(r25.ghg.coalFactor, 3)} tCO₂/t (kiểm kê 2023 ≈ 2,625; kế hoạch [B] và KTMT 2024 dùng 2,97); DO {f(r25.ghg.doFactor, 0)} kgCO₂e/1.000 L.</Note>
          <Note>Cường độ 2024 (44,8 kgCO₂e/t) tính trên 394.000 t; Báo cáo BVMT 2024 ghi 411.773 t → {f(r25.ghg.int2024True, 1)}. Mức giảm 2025 ({f(r25.ghg.int2025, 1)}) chỉ ≈ {f((1 - r25.ghg.int2025 / r25.ghg.int2024True) * 100, 1)} % thay vì 6 %.</Note>
        </div></div>
      <div style={card}><div style={h}>[K] Kế hoạch hành động 2026</div>
        <Wrap min={420}><tbody>{REPORT_2025.actions2026.map((a, i) => <tr key={i}><td style={{ ...td, width: 30 }}>{i + 1}</td><td style={tdl}>{a}</td></tr>)}</tbody></Wrap>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Không có người phụ trách, hạn hoàn thành, kinh phí; mục 8 trùng với kiến nghị diễn tập nêu từ 2024 chưa được xác nhận hoàn thành.</div></div>
      <div style={card}><div style={h}>Mâu thuẫn bổ sung rút ra từ KTMT 2023 và 2025</div>
        <Wrap min={900}><thead><tr><th style={{ ...th, textAlign: "left" }}>Nội dung</th><th style={{ ...th, textAlign: "left" }}>Nguồn</th><th style={{ ...th, textAlign: "left" }}>Nhận định</th></tr></thead>
          <tbody>{INCONSISTENCIES2.map(x => <tr key={x.topic}><td style={{ ...tdl, color: x.sev === "red" ? C.red : C.amber, verticalAlign: "top" }}>{x.topic}</td><td style={{ ...tdl, verticalAlign: "top" }}>{x.src}</td><td style={{ ...tdl, verticalAlign: "top", color: C.txt }}>{x.note}</td></tr>)}</tbody></Wrap></div>
    </div>}

    {tab === "vd" && <div style={{ display: "grid", gap: 14 }}>
      <Note c={C.dim}>Giáo trình KTMT — Võ Đình Long (10 chương). Các chương 4 (ĐTM), 8 (đa dạng sinh học) không áp dụng trực tiếp cho NM; dưới đây là các phần dùng được và cách áp vào nhà máy.</Note>
      <div style={card}><div style={h}>Chương dùng cho NM</div>
        <Wrap min={640}><tbody>{VDL.chapters.map(c => <tr key={c.n}><td style={{ ...td, width: 40 }}>Ch.{c.n}</td><td style={tdl}>{c.name}</td><td style={tdl}>{c.use}</td></tr>)}</tbody></Wrap></div>
      <div style={card}><div style={h}>Giai đoạn kiểm toán chính (Ch.2) — 5 bước</div>
        <Wrap min={640}><tbody>{VDL.mainSteps.map(m => <tr key={m.n}><td style={{ ...td, width: 30 }}>{m.n}</td><td style={tdl}>{m.name}</td><td style={tdl}>{m.plant}</td></tr>)}</tbody></Wrap></div>
      <div style={card}><div style={h}>Phương pháp và kỹ thuật (Ch.3)</div>
        <Wrap min={720}><thead><tr><th style={{ ...th, textAlign: "left" }}>Phương pháp</th><th style={{ ...th, textAlign: "left" }}>Nội dung</th><th style={{ ...th, textAlign: "left" }}>Áp dụng tại NM</th></tr></thead>
          <tbody>{VDL.methods.map(([a, b, c]) => <tr key={a}><td style={tdl}>{a}</td><td style={tdl}>{b}</td><td style={tdl}>{c}</td></tr>)}</tbody></Wrap>
        <div style={{ color: C.dim, fontSize: 12, marginTop: 8 }}>Kỹ thuật: {VDL.techniques.join(" · ")}.</div></div>
      <div style={card}><div style={h}>Kiểm toán quản lý CTR – CTNH (Ch.5)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
          {VDL.wasteStages.map(w => <div key={w.stage}><div style={{ color: C.green, fontSize: 12, marginBottom: 4 }}>{w.stage}</div>{w.steps.map((t, i) => <div key={i} style={{ fontSize: 12, color: C.sub, padding: "4px 0", borderTop: `1px solid ${C.line}` }}>{i + 1}. {t}</div>)}</div>)}</div></div>
      <div style={card}><div style={h}>Độ phủ cấu trúc báo cáo theo Ch.10 — báo cáo KTMT 2023, 2024, 2025 của NM</div>
        <Wrap min={640}><thead><tr><th style={{ ...th, textAlign: "left" }}>Nội dung theo giáo trình</th>{cov.rows.map(r => <th key={r.name} style={th}>{r.name}</th>)}</tr></thead>
          <tbody>{cov.parts.map(p => <tr key={p.id}><td style={tdl}>{p.name}</td>{cov.rows.map(r => { const v = VDL.reportCoverage[r.name][p.id] ?? 0; return <td key={r.name} style={{ ...td, color: v === 1 ? C.green : v === 0.5 ? C.amber : C.red }}>{v === 1 ? "Có" : v === 0.5 ? "Một phần" : "Chưa"}</td>; })}</tr>)}
            <tr><td style={{ ...tdl, color: C.txt }}>Điểm</td>{cov.rows.map(r => <td key={r.name} style={{ ...td, color: C.txt }}>{f(r.score, 1)}/{r.max}</td>)}</tr></tbody></Wrap>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>{VDL.coverageNote}</div></div>
    </div>}

    {tab === "dub" && <div style={{ display: "grid", gap: 14 }}>
      <div style={card}><div style={h}>Dự báo 2025 [B] so với thực tế 2025 (Báo cáo BVMT 12/01/2026)</div>
        <Wrap><thead><tr><th style={{ ...th, textAlign: "left" }}>Chỉ tiêu</th><th style={th}>Dự báo thấp</th><th style={th}>Dự báo cao</th><th style={th}>Thực tế 2025</th><th style={th}>Lệch so với giữa khoảng</th><th style={{ ...th, textAlign: "left" }}>Đánh giá</th></tr></thead>
          <tbody>{fc.map(x => { const [t, c] = STATUS[x.status]; return <tr key={x.key}><td style={tdl}>{x.label} ({x.unit})</td><td style={td}>{f(x.lo, x.lo < 100 ? 1 : 0)}</td><td style={td}>{f(x.hi, x.hi < 100 ? 1 : 0)}</td><td style={td}>{f(x.actual, x.actual != null && x.actual < 100 ? 2 : 0)}</td><td style={td}>{sgn(x.dev)}</td><td style={{ ...tdl, color: c }}>{t}{x.pointForecast && x.status !== "na" ? " (±10 %)" : ""}</td></tr>; })}</tbody></Wrap>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Dự báo điểm ([B] chỉ ghi “~”) được chấp nhận ±10 % — giả định của app, không có trong [B]. Dầu: báo cáo gốc ghi “tấn/năm” nhưng số trùng với [B] tính bằng lít/1000, nên quy đổi ×1.000 lít. CO₂: báo cáo BVMT không có số liệu; chờ kiểm kê KNK 2025.</div></div>
      <div style={card}><div style={h}>Đối chiếu số liệu cơ sở 2023–2024 giữa kế hoạch [B], Báo cáo BVMT và Kiểm kê KNK</div>
        <Wrap min={940}><thead><tr><th style={{ ...th, textAlign: "left" }}>Chỉ tiêu</th><th style={th}>[B] 2023</th><th style={th}>BC BVMT 2023</th><th style={th}>KNK 2023</th><th style={th}>Phụ lục 1 2023</th><th style={th}>Lệch (BC)</th><th style={th}>[B] 2024</th><th style={th}>BC BVMT 2024</th><th style={th}>Lệch</th></tr></thead>
          <tbody>{cross.map(x => <tr key={x.key}><td style={{ ...tdl, color: x.flag ? C.amber : C.sub }}>{x.label} ({x.unit})</td><td style={td}>{f(x.plan2023, x.plan2023 < 100 ? 2 : 0)}</td><td style={td}>{f(x.bc2023, x.bc2023 != null && x.bc2023 < 100 ? 2 : 0)}</td><td style={td}>{f(x.knk2023)}</td><td style={td}>{f(x.pl12023)}</td><td style={{ ...td, color: x.d2023 != null && Math.abs(x.d2023) > 2 ? C.amber : C.sub }}>{sgn(x.d2023)}</td><td style={td}>{f(x.plan2024, x.plan2024 < 100 ? 2 : 0)}</td><td style={td}>{f(x.bc2024, x.bc2024 != null && x.bc2024 < 100 ? 2 : 0)}</td><td style={{ ...td, color: x.d2024 != null && Math.abs(x.d2024) > 2 ? C.amber : C.sub }}>{sgn(x.d2024)}</td></tr>)}</tbody></Wrap>
        <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
          <Note>Số 2024 của điện, than khớp hoàn toàn giữa [B], Báo cáo BVMT và Kiểm kê KNK; số 2023 của [B] thấp hơn cả ba nguồn còn lại (Báo cáo BVMT, KNK, Phụ lục 1 — ba nguồn này lệch nhau ≤ 1,1 %) (điện 6,81 triệu kWh so với 8,25 – 8,31 triệu; than 2.971 t so với 3.563 – 3.539 t). Sản lượng 2023 trong [B] chỉ gồm 10 tháng (261.967 t) so với 333.675 t cả năm trong báo cáo.</Note>
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
      <Note c={C.red}>Tuần hoàn 6.000 m³ nước quy ra 31,6 tCO₂e (≈ 5,3 kg/m³) — nguyên nhân: KTMT 2023 [J] ghi 2.634 kgCO₂/năm cho 500 m³/tháng (≈ 0,44 kg/m³) và 12 × 2,634 = 31,6; con số bị nhân 12 lần. Tính lại ≈ 2,6 tCO₂e (xem mục “KTMT 2023 · 2025”).</Note>
      <Note> Giải pháp giảm than 250 t khớp hệ số 2,97 t CO₂/t trong [B]; nếu dùng hệ số KNK ≈ 2,62 thì giảm ≈ {f(250 * fac.coalKnk2023, 1)} tCO₂e. Giải pháp lắp hệ thống đo KNK không giảm phát thải trực tiếp.</Note>
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
