"use client";
// @ts-nocheck
// Kiểm tra thiết kế sơ bộ hệ xử lý khí thải theo Giáo trình Kiểm soát ô nhiễm không khí (Chương 1, 3, 4).
import { useState } from "react";
import { K, fmt } from "./DcsScreen.tsx";
import { BOOK, STACKS, BAG_G04, BAG_LB55, stackExitVelocity, stackDiameterFor, filtrationVelocity, bagDiameter, bagsArea, pa2mmH2O, cycloneSizing, cycloneDp, nog, removalFromNog, towerHeight, actualPlates, towerDiameter, inRange } from "../lib/airTreatment.ts";

const th = { textAlign: "left", color: K.dim, fontWeight: 500, padding: "3px 6px", whiteSpace: "nowrap" }, td = { padding: "3px 6px", borderTop: `1px solid ${K.line}` };
const inp = { width: 84, background: "#0c1117", color: K.txt, border: `1px solid ${K.line}`, borderRadius: 4, padding: "3px 5px", font: "11px 'DM Mono',monospace" };
const Tag = ({ ok, children }) => <span style={{ color: ok === true ? K.ok : ok === false ? K.warn : K.dim }}>{ok === true ? "✔ " : ok === false ? "⚠ " : ""}{children}</span>;
const N = ({ v, set, w }) => <input type="number" value={v} onChange={e => set(Number(e.target.value) || 0)} style={{ ...inp, width: w || 84 }} />;

export default function DesignChecks() {
  const [q, setQ] = useState(BAG_G04.design), [area, setArea] = useState(BAG_G04.area), [nb, setNb] = useState(BAG_G04.n), [len, setLen] = useState(BAG_G04.lengths[0]);
  const [cq, setCq] = useState(55000), [vtu, setVtu] = useState(3), [cn, setCn] = useState(1), [cD, setCD] = useState(0), [xi, setXi] = useState(0), [rho, setRho] = useState(0.95);
  const [y1, setY1] = useState(1500), [lim, setLim] = useState(400), [safe, setSafe] = useState(0.8), [hog, setHog] = useState(0.6), [aq, setAq] = useState(25000);

  const v = filtrationVelocity(q, area), d = bagDiameter(area, nb, len), ld = len / d, areaAlt = bagsArea(nb, d, BAG_G04.lengths[1]);
  const cy = cycloneSizing(cq / 3600, vtu, cn, cD || undefined), dp = xi > 0 ? cycloneDp(xi, rho, cy.vTt) : null;
  const y2 = lim * safe, nO = y1 > y2 ? nog(y1, y2) : 0, H = towerHeight(hog, nO), dT = towerDiameter(aq);

  return <div style={{ display: "grid", gap: 10 }}>
    <div style={{ fontSize: 11, color: K.dim, lineHeight: 1.6 }}>Kiểm tra sơ bộ theo khoảng khuyến nghị của Giáo trình <i>Kiểm soát ô nhiễm không khí</i> (ĐHQG TP.HCM, 2007). Không thay thế thiết kế của nhà cung cấp; thông số chưa có trong hồ sơ để ô nhập hoặc ghi rõ là giả định.</div>

    <div className="dc-card"><div style={{ fontWeight: 700, marginBottom: 6 }}>1. Ống khói — vận tốc thải ≥ {BOOK.stackExitMin} m/s (tránh hạ khói đầu ống)</div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", minWidth: 640 }}><thead><tr><th style={th}>Nguồn</th><th style={th}>H (m)</th><th style={th}>D miệng (m)</th><th style={th}>v tại Q đo (m/s)</th><th style={th}>v tại Q thiết kế (m/s)</th><th style={th}>D để đạt 20 m/s (Q đo)</th></tr></thead>
        <tbody>{STACKS.flatMap(s => [[s.id, s.name, s.d, ""], ...(s.dProposed ? [[s.id, s.name + " — đề nghị điều chỉnh GPMT", s.dProposed, "đề nghị"]] : []), ...(s.dAsBuilt ? [[s.id, s.name + " — Ø ngoài theo BV hoàn công CEMS", s.dAsBuilt, "hoàn công"]] : [])].map(([id, name, D, tag], i) => { const v1 = stackExitVelocity(s.qMeasured, D), v2 = stackExitVelocity(s.qDesign, D), ok = v1 >= BOOK.stackExitMin && v1 <= 35;
          return <tr key={id + i}><td style={td}>{id} {name}</td><td style={td}>{s.hs}</td><td style={td}>{D}{tag ? " *" : ""}</td><td style={td}><Tag ok={ok}>{fmt(v1, 1)}{v1 < BOOK.stackExitMin ? " thấp" : v1 > 35 ? " rất cao" : ""}</Tag></td><td style={td}>{fmt(v2, 1)}</td><td style={td}>{fmt(stackDiameterFor(s.qMeasured), 2)}</td></tr>; }))}</tbody></table></div>
      <div style={{ fontSize: 10, color: K.dim, marginTop: 6, lineHeight: 1.6 }}>Q đo = lưu lượng thực tế đo 2026 (m³/h); Q thiết kế theo GPMT. Ống 0,6 m cho v ≈ 40–55 m/s (rất cao, bất thường, hồ sơ nội bộ đã đề nghị đổi D2); D2 = 1,5 m cho v ≈ 7,5 m/s — thấp hơn 20 m/s nên có nguy cơ hạ khói đầu ống và độ nâng thấp (mô hình Gauss của App đã tính downwash đầu ống). Cân nhắc D2 ≈ 0,9–1,0 m khi làm việc với nhà thầu; cần xác nhận ảnh hưởng ΔP quạt. Ống thấp hơn 2–2,5 lần nhà lân cận cũng gây chùm khói bị kéo vào vùng xoáy: nhập chiều cao nhà cao nhất kế cận để đối chiếu ({BOOK.stackHeightOverBuilding.join("–")} × H<sub>nh</sub>).</div></div>

    <div className="dc-card"><div style={{ fontWeight: 700, marginBottom: 6 }}>2. Lọc bụi túi vải — tải trọng lọc (PT 3.13–3.15)</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, alignItems: "center" }}>
        <label>Q (m³/h) <N v={q} set={setQ} /></label><label>Diện tích lọc (m²) <N v={area} set={setArea} /></label><label>Số túi <N v={nb} set={setNb} /></label>
        <label>Chiều dài túi (m) <select value={len} onChange={e => setLen(Number(e.target.value))} style={inp}>{[...BAG_G04.lengths, ...BAG_LB55.lengths].filter((l, i, a) => a.indexOf(l) === i).map(l => <option key={l} value={l}>{l}</option>)}</select></label>
        <button className="dc-b" onClick={() => { setQ(BAG_G04.design); setArea(BAG_G04.area); setNb(BAG_G04.n); setLen(BAG_G04.lengths[0]); }}>Nguồn 04 (hồ sơ điều chỉnh: 432 túi, 556 m²)</button><button className="dc-b" onClick={() => { setQ(BAG_LB55.design); setArea(BAG_LB55.area); setNb(BAG_LB55.n); setLen(BAG_LB55.lengths[0]); }}>LB55 hoàn công (CME: 576 túi, 742 m²)</button></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 8, marginTop: 8, fontSize: 11 }}>
        <div><div style={{ color: K.dim }}>Tải trọng lọc</div><b style={{ fontSize: 18 }}>{fmt(v, 2)} m/phút</b><div><Tag ok={v <= BOOK.bagFiltration[1] ? true : v <= BOOK.bagFiltrationCage ? false : false}>{v <= BOOK.bagFiltration[1] ? "trong 0,5–1,5" : v <= BOOK.bagFiltrationCage ? "vượt 1,5, còn trong 2,5 (túi có khung đỡ, thổi xung)" : "vượt 2,5"}</Tag></div></div>
        <div><div style={{ color: K.dim }}>Đường kính túi suy ra</div><b style={{ fontSize: 18 }}>{fmt(d * 1000, 0)} mm</b><div><Tag ok={d <= BOOK.bagDiameterMax}>≤ 600 mm</Tag> · L/d = {fmt(ld, 1)} <Tag ok={false}>{ld > BOOK.bagLengthOverDiameter[1] ? "dài hơn 16–20 d (thường gặp ở túi thổi xung)" : ""}</Tag></div></div>
        <div><div style={{ color: K.dim }}>Nếu túi dài {BAG_G04.lengths[1]} m</div><b style={{ fontSize: 18 }}>{fmt(areaAlt, 0)} m²</b><div style={{ color: K.dim }}>→ {fmt(filtrationVelocity(q, areaAlt), 2)} m/phút. Chiều dài 3.360 hay 3.460 mm cần đo thực tế.</div></div>
        <div><div style={{ color: K.dim }}>ΔP điển hình (giáo trình)</div><b style={{ fontSize: 18 }}>{fmt(pa2mmH2O(BOOK.bagDp[0]), 0)}–{fmt(pa2mmH2O(BOOK.bagDp[1]), 0)} mmH₂O</b><div style={{ color: K.dim }}>báo động P2 của App: 260</div></div></div>
      <div style={{ fontSize: 10, color: K.dim, marginTop: 6, lineHeight: 1.6 }}>Đường kính túi được suy ra từ 556 m² / 432 túi / chiều dài, chưa phải số liệu đo. Giáo trình: hiệu suất lọc túi vải ≥ 99 %. Với bụi thô giả định 9.000 mg/Nm³ (chưa có số đo trong hồ sơ), kết quả quan trắc 16–18 mg/Nm³ tương ứng η tổng (cyclone + túi) ≈ 99,8 %.</div></div>

    <div className="dc-card"><div style={{ fontWeight: 700, marginBottom: 6 }}>3. Cyclone — cỡ thiết bị (PT 3.5–3.8)</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, alignItems: "center" }}>
        <label>Q (m³/h) <N v={cq} set={setCq} /></label><label>V<sub>tư</sub> (m/s, 1–5) <N v={vtu} set={setVtu} w={60} /></label><label>Số cyclone n <N v={cn} set={setCn} w={50} /></label>
        <label>D chọn (m, 0 = tính) <N v={cD} set={setCD} w={60} /></label><label>ξ (nhà sản xuất) <N v={xi} set={setXi} w={60} /></label><label>ρ khí (kg/m³) <N v={rho} set={setRho} w={60} /></label></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 8, marginTop: 8, fontSize: 11 }}>
        <div><div style={{ color: K.dim }}>Tiết diện F<sub>x</sub></div><b style={{ fontSize: 18 }}>{fmt(cy.Fx, 2)} m²</b></div>
        <div><div style={{ color: K.dim }}>D tính được</div><b style={{ fontSize: 18 }}>{fmt(cy.Dcalc, 2)} m</b></div>
        <div><div style={{ color: K.dim }}>V<sub>tt</sub> thực tế</div><b style={{ fontSize: 18 }}>{fmt(cy.vTt, 2)} m/s</b><div><Tag ok={Math.abs(cy.devPct) <= 15}>lệch {fmt(cy.devPct, 1)} % (≤ 15 %)</Tag></div></div>
        <div><div style={{ color: K.dim }}>ΔP = ξρV²/2</div><b style={{ fontSize: 18 }}>{dp == null ? "—" : `${fmt(dp, 0)} N/m²`}</b><div style={{ color: K.dim }}>{dp == null ? "nhập ξ theo số liệu hãng" : `≈ ${fmt(pa2mmH2O(dp), 0)} mmH₂O`}</div></div></div>
      <div style={{ fontSize: 10, color: K.dim, marginTop: 6, lineHeight: 1.6 }}>Giáo trình: vận tốc vào cửa {BOOK.cycloneInlet.join("–")} m/s, ra ống thoát {BOOK.cycloneOutlet.join("–")} m/s; hiệu quả giảm khi hạt &lt; 5 µm; xyclon tổ hợp (D 100–250 mm) phù hợp lưu lượng lớn. Hệ cyclone chùm của lò sấy chưa có số liệu hãng trong hồ sơ — App dùng η = 95 % (kẹt van xoay: 60 %) làm giả định.</div></div>

    <div className="dc-card"><div style={{ fontWeight: 700, marginBottom: 6 }}>4. Tháp hấp thụ — số đơn vị truyền khối N<sub>og</sub> (mục 4.4)</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, alignItems: "center" }}>
        <label>Nồng độ vào (mg/Nm³) <N v={y1} set={setY1} /></label><label>Giới hạn <N v={lim} set={setLim} /></label><label>Hệ số an toàn (× giới hạn) <N v={safe} set={setSafe} w={60} /></label>
        <label>H<sub>og</sub> (m, giả định) <N v={hog} set={setHog} w={60} /></label><label>Q (m³/h) <N v={aq} set={setAq} /></label></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 8, marginTop: 8, fontSize: 11 }}>
        <div><div style={{ color: K.dim }}>Hiệu suất cần</div><b style={{ fontSize: 18 }}>{fmt(removalFromNog(nO) * 100, 1)} %</b><div style={{ color: K.dim }}>ra {fmt(y2, 0)} mg/Nm³</div></div>
        <div><div style={{ color: K.dim }}>N<sub>og</sub> = ln(y₁/y₂)</div><b style={{ fontSize: 18 }}>{fmt(nO, 2)}</b></div>
        <div><div style={{ color: K.dim }}>Chiều cao lớp đệm h = H<sub>og</sub>·N<sub>og</sub></div><b style={{ fontSize: 18 }}>{fmt(H, 2)} m</b><div style={{ color: K.dim }}>ΔP đệm ≈ {fmt(BOOK.packedDpPerMetre[0] * H, 0)}–{fmt(BOOK.packedDpPerMetre[1] * H, 0)} mmH₂O</div></div>
        <div><div style={{ color: K.dim }}>Đường kính tháp (v = 0,3 m/s)</div><b style={{ fontSize: 18 }}>{fmt(dT, 1)} m</b><div style={{ color: K.dim }}>tháp mâm: số mâm thực ≈ 2 × lý thuyết ({actualPlates(Math.ceil(nO))} mâm nếu {Math.ceil(nO)} lý thuyết)</div></div></div>
      <div style={{ fontSize: 10, color: K.dim, marginTop: 6, lineHeight: 1.6 }}>Mặc định SO₂ lò hơi: 1.500 mg/Nm³ là giá trị "thô" giả định trong mô hình DCS (GPMT không nêu nồng độ khí thô), giới hạn 400 mg/Nm³ (QCVN 19:2009, Kp 0,8). H<sub>og</sub> thường từ vài chục cm đến &gt; 1 m tùy đệm/chất lỏng — thay bằng số của nhà cung cấp. Hệ phản ứng nhanh với kiềm: coi độ dốc cân bằng ≈ 0 (kiểm soát pha khí). Hấp thụ NH₃ bằng nước/axit loãng tính theo cùng cách, dùng nồng độ khí thô đo được.</div></div>
  </div>;
}
