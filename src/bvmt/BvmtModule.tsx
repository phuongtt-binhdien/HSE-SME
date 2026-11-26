"use client";
// @ts-nocheck
// Báo cáo công tác BVMT năm 2024 và 2025 (gửi Tập đoàn Hóa chất VN): số liệu, kết quả quan trắc, đối chiếu giữa hai báo cáo và các điểm cần rà soát.
import { useState } from "react";
import { REPORTS, PRODUCTS, PRODUCT_TOTAL, MATERIALS, MATERIAL_TOTAL, UTILITIES, GAS, WASTEWATER, SAMPLING, CTRSH, CTRCNTT, CTNH, CTNH_TOTAL, CTNH_RECEIVER, AIR_VOLUME_M3 } from "../data/bvmtReports.ts";
import { compliance, identicalAcrossYears, flowOutliers, uniformIncrements, totalsCheck, nearestMismatch, impliedHours, wastewaterMax, upper, num, pct } from "../lib/bvmt.ts";

const C = { card: "#0d1320", line: "#1d2d40", txt: "#e6edf7", sub: "#9fb0c6", dim: "#6b7f99", green: "#00e5a0", amber: "#ffb020", red: "#ff3860" };
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, minWidth: 0 };
const h = { font: "700 14px 'Syne','Outfit',system-ui", color: C.txt, marginBottom: 10 };
const th = { textAlign: "right", color: C.dim, fontWeight: 500, padding: "4px 8px", whiteSpace: "nowrap" }, td = { padding: "4px 8px", borderTop: `1px solid ${C.line}`, color: C.sub, textAlign: "right", whiteSpace: "nowrap" };
const f = (v, d = 0) => (typeof v === "number" ? v.toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d }) : v ?? "—");
const chip = on => ({ cursor: "pointer", padding: "4px 10px", borderRadius: 999, fontSize: 11, border: `1px solid ${on ? C.green : C.line}`, color: on ? C.green : C.sub, background: on ? C.green + "18" : "transparent" });
const Tbl = ({ head, rows, min = 560, first = "Chỉ tiêu" }) => <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: min }}><thead><tr><th style={{ ...th, textAlign: "left" }}>{first}</th>{head.map(x => <th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{rows}</tbody></table></div>;

export function BvmtModule() {
  const [yr, setYr] = useState("2025");
  const c25 = compliance("2025"), c24 = compliance("2024"), same = identicalAcrossYears(), out24 = flowOutliers("2024"), inc = uniformIncrements(), tot = totalsCheck().filter(t => !t.ok), near = nearestMismatch();
  const NAMES = { coalT: "Than (tấn)", oil: "Dầu (tấn/năm — ghi theo bảng gốc)", gasM3: "Gas (m³)", waterM3: "Nước mặt (m³)" };
  const issues = [
    [`Sản lượng 2025 = 2024 + đúng ${f(inc.products.delta)} t ở ${inc.products.count}/${inc.products.of} sản phẩm chính; nguyên liệu 2025 = 2024 + đúng ${f(inc.materials.delta)} t ở ${inc.materials.count}/${inc.materials.of} loại (DAP, urê, SA, KCl) — dạng số cộng đều, nên đối chiếu với sổ sản xuất / phiếu nhập kho 2025 trước khi nộp.`, "red"],
    [`Báo cáo 2025: cột "năm gần nhất" của nước mặt ghi ${f(near.find(x => x.key === "waterM3")?.stated)} m³ — đó là số 2023; số 2024 là ${f(near.find(x => x.key === "waterM3")?.expected)} m³. Gas "năm gần nhất" ghi 5 (số 2023), số 2024 = 6.`, "amber"],
    [`Báo cáo 2025: bảng nguyên liệu ghi tiêu đề cột "năm 2024 / năm 2023" (phải là 2025 / 2024).`, "amber"],
    [`Báo cáo 2024: tổng sản lượng 2023 ghi ${f(333675)} t, cộng các dòng ra ${f(tot[0]?.calc)} t (lệch ${f((tot[0]?.calc ?? 0) - (tot[0]?.stated ?? 0))} t).`, "amber"],
    [`${same.length} giá trị quan trắc 2025 trùng chính xác với báo cáo 2024 cùng điểm – thông số – đợt: ` + same.map(s => `${s.id} ${s.key} đợt ${s.period} = ${f(s.value)}`).join("; ") + ". Cần đối chiếu phiếu kết quả gốc (khác ngày, khác đợt mà số trùng đến hàng đơn vị).", "red"],
    [`Báo cáo 2024: lưu lượng lò hơi KK01 đợt 3 = ${f(out24[0]?.flow)} m³/h (gấp ${f((out24[0]?.flow ?? 0) / (out24[0]?.design ?? 1), 1)} lần thiết kế ${f(out24[0]?.design)}); trùng số của KK06 đợt 3. Báo cáo 2025 ghi 18.429 — nên có văn bản đính chính số liệu 2024.`, "amber"],
    [`Tổng lượng khí thải ${f(AIR_VOLUME_M3.y2024)} m³ giống hệt ở hai báo cáo (= 360.000 m³/h × ${f(impliedHours())} giờ): tính theo lưu lượng thiết kế, không theo lưu lượng đo hay giờ chạy thực (thống kê 2026: lưu lượng đo thấp hơn thiết kế 30–45 %).`, "amber"],
    ["Nước thải: lượng 18.000 m³/năm (50 m³/ngày) cả 2023–2025 và công suất ghi 50 m³/ngày, trong khi GPMT 2986 cấp 120 m³/ngày đêm; chỉ quan trắc 6 thông số (GPMT liệt kê 9 thông số của QCVN 40:2011) và ghi \"không quy định tần suất\" nhưng thực hiện 4 đợt/năm.", "amber"],
    ["Dầu nhớt thải: CTNH chuyển giao 600 kg (2025) nhưng CTRCNTT lại ghi \"dầu nhớt thải làm nhiên liệu cho bánh răng\" 2.510 kg tại cơ sở — dầu nhớt thải là CTNH, chỉ được chuyển giao đơn vị có phép, không ghi nhận tự dùng làm nhiên liệu.", "red"],
    ["Quan trắc khí thải tự động: báo cáo nêu \"đã lắp CEMS tháng 12/2021 cho tạo hạt 3 nhưng không thuộc đối tượng bắt buộc\" (khớp CV 3286/STNMT-QLMT) — nhưng chưa có số liệu CEMS 2025 trong báo cáo.", "dim"],
    ["Bảng 2.5 (KK03) năm 2025 lệch cột: đợt 2 thiếu giá trị bụi, có \"15\" ở dòng SO₂, NH₃ ghi \"<10\" — phải sửa theo phiếu gốc.", "amber"],
    ["Báo cáo 2025 chưa có số văn bản (\"Số: … / BC.KS-BĐ\"), kỳ báo cáo ghi \"năm báo cáo/năm gần nhất\" lẫn 2023–2024; ghi \"chưa có cơ quan kiểm tra đến 31/12/2025\".", "dim"],
  ];
  const col = c => (c === "red" ? C.red : c === "amber" ? C.amber : C.dim);

  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
      {[["Báo cáo 2025 (12/01/2026)", `${f(PRODUCT_TOTAL.y2025)} t SP`, `Nguyên liệu ${f(MATERIAL_TOTAL.y2025)} t · điện ${f(UTILITIES.kWh.y2025 / 1e6, 2)} GWh`], ["Quan trắc khí thải 2025", `${c25.n} giá trị đo`, `Không vượt: cực đại ${c25.max.id} ${c25.max.key} đợt ${c25.max.period} = ${f(c25.max.p, 1)} % giới hạn`], ["Quan trắc 2024", `${c24.n} giá trị đo`, `Không vượt: cực đại ${c24.max.id} ${c24.max.key} = ${f(c24.max.p, 1)} %`], ["Điểm cần rà soát", `${issues.filter(i => i[1] !== "dim").length}`, `${issues.filter(i => i[1] === "red").length} nghiêm trọng`]].map(([a, b, c], i) =>
        <div key={i} style={card}><div style={{ color: C.dim, fontSize: 11 }}>{a}</div><div style={{ font: "700 20px 'Syne',system-ui", color: i === 3 ? C.amber : C.txt, margin: "4px 0" }}>{b}</div><div style={{ color: C.dim, fontSize: 11 }}>{c}</div></div>)}</div>

    <div style={card}><div style={h}>Đối chiếu báo cáo 2025 với báo cáo 2024 — điểm cần rà soát trước khi nộp / giải trình</div>
      {issues.map(([t, k], i) => <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderTop: i ? `1px solid ${C.line}` : "none", fontSize: 12, lineHeight: 1.6, color: C.sub }}><span style={{ color: col(k), flexShrink: 0 }}>{k === "red" ? "●" : k === "amber" ? "▲" : "○"}</span><span>{t}</span></div>)}
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Các điểm trên do App so sánh trực tiếp số liệu hai báo cáo; không có nghĩa là số liệu sai — chỉ là trùng/lệch cần xác minh với chứng từ gốc. Báo cáo 2024 là bản scan, đọc số theo ảnh.</div></div>

    <div style={card}><div style={h}>Số liệu chung</div>
      <Tbl head={["2023", "2024", "2025", "2025 − 2024"]} min={620} rows={<>
        {PRODUCTS.map(p => <tr key={p.name}><td style={{ ...td, textAlign: "left" }}>{p.name} (t)</td><td style={td}>{f(p.y2023)}</td><td style={td}>{f(p.y2024)}</td><td style={{ ...td, color: C.txt }}>{f(p.y2025)}</td><td style={{ ...td, color: p.y2025 - p.y2024 === 8000 ? C.amber : C.sub }}>{f(p.y2025 - p.y2024)}</td></tr>)}
        <tr><td style={{ ...td, textAlign: "left", color: C.txt }}>Tổng sản lượng (t)</td><td style={td}>{f(PRODUCT_TOTAL.y2023)}</td><td style={td}>{f(PRODUCT_TOTAL.y2024)}</td><td style={{ ...td, color: C.txt }}>{f(PRODUCT_TOTAL.y2025)}</td><td style={td}>{f(PRODUCT_TOTAL.y2025 - PRODUCT_TOTAL.y2024)}</td></tr>
        {MATERIALS.map(p => <tr key={p.name}><td style={{ ...td, textAlign: "left" }}>Nguyên liệu {p.name} (t)</td><td style={td}>{f(p.y2023)}</td><td style={td}>{f(p.y2024)}</td><td style={{ ...td, color: C.txt }}>{f(p.y2025)}</td><td style={{ ...td, color: p.y2025 - p.y2024 === 8000 ? C.amber : C.sub }}>{f(p.y2025 - p.y2024)}</td></tr>)}
        {Object.entries(NAMES).map(([k, n]) => <tr key={k}><td style={{ ...td, textAlign: "left" }}>{n}</td><td style={td}>{f(UTILITIES[k].y2023, 1)}</td><td style={td}>{f(UTILITIES[k].y2024, 1)}</td><td style={{ ...td, color: C.txt }}>{f(UTILITIES[k].y2025, 1)}</td><td style={td}>{f(UTILITIES[k].y2025 - UTILITIES[k].y2024, 1)}</td></tr>)}
        <tr><td style={{ ...td, textAlign: "left" }}>Điện (kWh)</td><td style={td}>{f(UTILITIES.kWh.y2023)}</td><td style={td}>{f(UTILITIES.kWh.y2024)}</td><td style={{ ...td, color: C.txt }}>{f(UTILITIES.kWh.y2025)}</td><td style={td}>{f(UTILITIES.kWh.y2025 - UTILITIES.kWh.y2024)}</td></tr>
        <tr><td style={{ ...td, textAlign: "left" }}>Nước thải xử lý (m³/năm)</td><td style={td}>18.000</td><td style={td}>18.000</td><td style={{ ...td, color: C.txt }}>18.000</td><td style={td}>0</td></tr></>} />
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Tham chiếu thống kê nội bộ 2026 (tab Sản Xuất): sản lượng tạo hạt tháng 4–8/2026 ≈ 80.100 t (gồm BTP), than lò đốt + nồi hơi ≈ 1.682 t trong 5 tháng — cùng bậc với 4.594 t than/năm của báo cáo 2025, nhưng sản lượng "{f(PRODUCT_TOTAL.y2025)} t" gộp cả trộn và đóng gói; phạm vi (tạo hạt, trộn, thành phẩm) chưa được ghi rõ trong báo cáo.</div></div>

    <div style={card}><div style={h}>Kết quả quan trắc khí thải định kỳ — so với QCVN 19:2009 cột B (Kp 0,8; Kv 1,0) và QCVN 21:2009 (NH₃ 40)</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>{["2025", "2024"].map(y => <span key={y} onClick={() => setYr(y)} style={chip(yr === y)}>Năm {y}</span>)}<span style={{ color: C.dim, fontSize: 11, alignSelf: "center" }}>Đợt: {SAMPLING[yr].gas.join(" · ")}</span></div>
      <Tbl head={["Giới hạn", "Đợt 1", "Đợt 2", "Đợt 3", "Đợt 4", "Cực đại / giới hạn"]} first="Điểm · thông số" min={720} rows={GAS[yr].flatMap(pt => [<tr key={pt.id}><td colSpan={7} style={{ ...td, textAlign: "left", color: C.txt, background: "#0a111c" }}>{pt.id} · {pt.name} (thiết kế {f(pt.designFlow)} m³/h){pt.note ? <span style={{ color: C.amber }}> — {pt.note}</span> : null}</td></tr>, ...pt.rows.map(r => { const mx = r.limit ? Math.max(0, ...r.v.map(c => num(c) ?? 0)) : null; return <tr key={pt.id + r.key}><td style={{ ...td, textAlign: "left" }}>{r.key} ({r.unit})</td><td style={td}>{r.limit ?? "—"}</td>{r.v.map((c, i) => { const same2 = yr === "2025" && same.some(s => s.id === pt.id && s.key === r.key && s.period === i + 1); return <td key={i} style={{ ...td, color: same2 ? C.amber : C.txt }} title={same2 ? "Trùng báo cáo 2024" : ""}>{c == null ? "—" : typeof c === "number" ? f(c, c < 1 ? 2 : 0) : c}</td>; })}<td style={td}>{mx != null && mx > 0 ? `${f(pct(mx, r.limit), 1)} %` : "—"}</td></tr>; })])} />
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Ô cam = trùng đến hàng đơn vị với đợt tương ứng của báo cáo kia. "—" = không lấy mẫu (dây chuyền bảo trì; trộn hữu cơ không vận hành). Lưu lượng đo 16–18 nghìn (lò hơi), 44–49 nghìn (sấy 1–2), 75–80 nghìn m³/h (sấy 3) — thấp hơn thiết kế (25 / 55 / 140 nghìn).</div></div>

    <div style={card}><div style={h}>Nước thải sau xử lý — QCVN 40:2011/BTNMT cột A (Kf 1,1; Kq 1,2)</div>
      <Tbl head={["Giới hạn", "2024: đợt 1", "2", "3", "4", "2025: đợt 1", "2", "3", "4"]} first="Thông số (mg/L)" min={820} rows={Object.keys(WASTEWATER.limits).map(k => <tr key={k}><td style={{ ...td, textAlign: "left" }}>{k}</td><td style={td}>{WASTEWATER.limits[k]}</td>{WASTEWATER["2024"][k].map((c, i) => <td key={"a" + i} style={td}>{c}</td>)}{WASTEWATER["2025"][k].map((c, i) => <td key={"b" + i} style={{ ...td, color: C.txt }}>{c}</td>)}</tr>)} />
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Cực đại 2025: COD {f(wastewaterMax("2025").find(x => x.key === "COD").value)} mg/L ({f(wastewaterMax("2025").find(x => x.key === "COD").pct, 1)} % giới hạn). Đợt 2/2024 TSS = 19 mg/L (đợt 2/2025: KPH). Đợt 2025: {SAMPLING["2025"].ww.join(" · ")}; 2024: {SAMPLING["2024"].ww.join(" · ")}.</div></div>

    <div style={card}><div style={h}>Chất thải</div>
      <Tbl head={["2023", "2024", "2025"]} first="Loại" min={560} rows={<>
        <tr><td style={{ ...td, textAlign: "left" }}>CTR sinh hoạt (t) — {CTRSH.receiver["2025"]}</td><td style={td}>{f(CTRSH.y2023, 2)}</td><td style={td}>{f(CTRSH.y2024, 2)}</td><td style={{ ...td, color: C.txt }}>{f(CTRSH.y2025, 1)}</td></tr>
        {CTRCNTT.map(r => <tr key={r.name}><td style={{ ...td, textAlign: "left", whiteSpace: "normal" }}>CTRCNTT: {r.name} (kg)</td><td style={td}>{f(r.y2023)}</td><td style={td}>{f(r.y2024)}</td><td style={{ ...td, color: C.txt }}>{f(r.y2025)}</td></tr>)}
        {CTNH.map(r => <tr key={r.code}><td style={{ ...td, textAlign: "left", whiteSpace: "normal" }}>CTNH {r.code}: {r.name} (kg)</td><td style={td}>{f(r.y2023)}</td><td style={td}>{f(r.y2024)}</td><td style={{ ...td, color: C.txt }}>{f(r.y2025)}</td></tr>)}
        <tr><td style={{ ...td, textAlign: "left", color: C.txt }}>Tổng CTNH (kg) — {CTNH_RECEIVER}</td><td style={td}>{f(CTNH_TOTAL.y2023)}</td><td style={td}>{f(CTNH_TOTAL.y2024)}</td><td style={{ ...td, color: C.txt }}>{f(CTNH_TOTAL.y2025)}</td></tr></>} />
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>CTNH 2025 tăng do dầu nhớt thải 600 kg (2024: 100 kg); khối lượng bao bì dùng lại 2024 ghi 433 kg (2023: 327.000; 2025: 560.000) — chênh nhiều bậc, cần kiểm tra đơn vị/phạm vi. Hồ sơ chứng từ CTNH 2025 nằm ở Phụ lục 7 của báo cáo.</div></div>

    <div style={{ ...card, color: C.dim, fontSize: 11, lineHeight: 1.7 }}>Nguồn: BFC_BVMT2024.pdf ({REPORTS["2024"].date}, {REPORTS["2024"].ref}) và BFC_Bao_cao_BVMT_120126_TDHCVN.pdf ({REPORTS["2025"].date}). Phần mô tả (PCCC, sự cố tràn dầu, hệ thống xử lý) giữa hai báo cáo gần như giống hệt nhau; Phần 2 kiến nghị 2025: lập báo cáo giảm phát thải KNK 2025, báo cáo kiểm toán môi trường 2025, duy trì xử lý cuối đường ống, đóng phí tái chế và phí khí thải. Số liệu được nhập tay — đối chiếu với bản gốc trước khi trích dẫn.</div>
  </div>;
}
