"use client";
// @ts-nocheck
// Thống kê sản xuất 04–08/2026: ca chạy, giờ chạy, sản lượng, nhiên liệu (than, sinh khối chạy thử), điện, nguyên liệu; đối chiếu với kê khai phí khí thải.
import { useState } from "react";
import { PROD, MACHINES, PROD_NOTES } from "../data/production2026.ts";
import { STACKS } from "../lib/airTreatment.ts";
import { KEYS, monthsOf, sumMachine, intensity, biomassMassShare, volumeRatio, dailyHours, rawTotals } from "../lib/production.ts";

const C = { card: "#0d1320", line: "#1d2d40", txt: "#e6edf7", sub: "#9fb0c6", dim: "#6b7f99", green: "#00e5a0", amber: "#ffb020", red: "#ff3860", blue: "#4c9be8" };
const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, minWidth: 0 };
const h = { font: "700 14px 'Syne','Outfit',system-ui", color: C.txt, marginBottom: 10 };
const th = { textAlign: "right", color: C.dim, fontWeight: 500, padding: "4px 8px", whiteSpace: "nowrap" }, td = { padding: "4px 8px", borderTop: `1px solid ${C.line}`, color: C.sub, textAlign: "right", whiteSpace: "nowrap" };
const num = (v, d = 0) => (Number.isFinite(v) ? Number(v).toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d }) : "—");
const chip = on => ({ cursor: "pointer", padding: "4px 10px", borderRadius: 999, fontSize: 11, border: `1px solid ${on ? C.green : C.line}`, color: on ? C.green : C.sub, background: on ? C.green + "18" : "transparent" });
const MNAME = { "04": "Tháng 4", "05": "Tháng 5", "06": "Tháng 6", "07": "Tháng 7", "08": "Tháng 8" };
const heat = v => (v <= 0 ? "#111a26" : `rgba(0,229,160,${0.18 + Math.min(1, v / 24) * 0.7})`);

export function ProductionModule() {
  const [per, setPer] = useState("ALL"), [mon, setMon] = useState("04");
  const ms = monthsOf(per);
  const sums = Object.fromEntries(KEYS.map(k => [k, sumMachine(k, ms)]));
  const tot = KEYS.reduce((a, k) => ({ t: a.t + sums[k].tons, h: a.h + sums[k].hours, coal: a.coal + sums[k].coalLoKg + sums[k].coalNoiKg, bio: a.bio + sums[k].biomassKg, kwh: a.kwh + sums[k].kWh }), { t: 0, h: 0, coal: 0, bio: 0, kwh: 0 });
  const q2 = monthsOf("Q2"), raw = rawTotals(ms), days = new Date(2026, Number(mon), 0).getDate();
  const bm = PROD[mon];

  return <div style={{ display: "grid", gap: 14 }}>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {[["ALL", "Tháng 4–8/2026"], ["Q2", "Quý II"], ["Q3", "Quý III (T7–T8)"]].map(([k, l]) => <span key={k} onClick={() => setPer(k)} style={chip(per === k)}>{l}</span>)}
      <span style={{ color: C.dim, fontSize: 11 }}>Nguồn: 5 file THONG_KE_NGUYEN_LIEU_THANG_04…08.2026 (sheet Tạo hạt, Trộn, XLNL, Đóng gói)</span></div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
      {[["Sản lượng tạo hạt (gồm BTP)", `${num(tot.t)} t`, `${ms.length} tháng · ${num(tot.t / (tot.h || 1), 1)} t/giờ máy`], ["Giờ chạy máy (cộng 3 máy)", `${num(tot.h)} h`, `${KEYS.reduce((a, k) => a + sums[k].ca, 0)} ca`], ["Than lò đốt + nồi hơi", `${num(tot.coal / 1000)} t`, "theo cột THAN LÒ ĐỐT, THAN NỒI HƠI"], ["Sinh khối chạy thử", `${num(tot.bio / 1000, 1)} t`, "viên nén + than củi + vỏ mắc ca (máy 3, một ít ở máy 1 T5)"]].map(([a, b, c], i) =>
        <div key={i} style={card}><div style={{ color: C.dim, fontSize: 11 }}>{a}</div><div style={{ font: "700 20px 'Syne',system-ui", color: i === 3 ? C.amber : C.txt, margin: "4px 0" }}>{b}</div><div style={{ color: C.dim, fontSize: 11 }}>{c}</div></div>)}</div>

    <div style={card}><div style={h}>Theo máy (hệ máy trong thống kê → dây chuyền trong GPMT 2986)</div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 860 }}><thead><tr><th style={{ ...th, textAlign: "left" }}>Máy</th><th style={th}>Số ca</th><th style={th}>Giờ chạy</th><th style={th}>Hư hỏng (h)</th><th style={th}>Sản lượng (t)</th><th style={th}>t/giờ</th><th style={th}>Than lò đốt (t)</th><th style={th}>kg than/t</th><th style={th}>Than nồi hơi (t)</th><th style={th}>Điện (MWh)</th><th style={th}>kWh/t</th><th style={th}>Sinh khối (t)</th></tr></thead>
        <tbody>{KEYS.map(k => { const x = sums[k], i = intensity(x), m = MACHINES[k]; return <tr key={k}><td style={{ ...td, textAlign: "left", color: C.txt }}>{m.label} <span style={{ color: m.confirmed ? C.green : C.amber, fontSize: 11 }}>= {m.gpmt}{m.confirmed ? "" : " ⚠"}</span></td><td style={td}>{num(x.ca)}</td><td style={td}>{num(x.hours, 1)}</td><td style={td}>{num(x.downH, 1)}</td><td style={{ ...td, color: C.txt }}>{num(x.tons)}</td><td style={td}>{num(i.tPerH, 1)}</td><td style={td}>{num(x.coalLoKg / 1000, 1)}</td><td style={td}>{num(i.coalPerT, 1)}</td><td style={td}>{num(x.coalNoiKg / 1000, 1)}</td><td style={td}>{num(x.kWh / 1000, 1)}</td><td style={td}>{num(i.kWhPerT, 1)}</td><td style={{ ...td, color: x.biomassKg ? C.amber : C.sub }}>{num(x.biomassKg / 1000, 1)}</td></tr>; })}</tbody></table></div>
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Máy 2 = tạo hạt 3 theo xác nhận của Nhà máy. ⚠ Máy 1 = tạo hạt 1 và máy 3 = tạo hạt 2 là suy ra (chạy thử sinh khối ở máy 3 khớp với hồ sơ điều chỉnh GPMT cho tạo hạt 2) — cần xác nhận. Sản lượng = số bao × khối lượng bao (cột LOẠI SP), gồm bán thành phẩm (BTP). Máy 1 không chạy tháng 8. kWh/t chỉ tính các ca có số công tơ hợp lệ.</div></div>

    <div style={card}><div style={h}>Ca chạy theo ngày — giờ chạy máy mỗi ngày</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>{Object.keys(MNAME).map(m => <span key={m} onClick={() => setMon(m)} style={chip(mon === m)}>{MNAME[m]}</span>)}</div>
      <div style={{ overflowX: "auto" }}><div style={{ minWidth: 660 }}>
        {KEYS.map(k => { const hs = dailyHours(k, mon, days), bd = bm?.daily[k] ?? {}; return <div key={k} style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 3 }}>
          <div style={{ width: 120, fontSize: 11, color: C.sub }}>{MACHINES[k].label} · {MACHINES[k].gpmt.replace(" (dòng 06)", "")}</div>
          {hs.map((v, i) => { const b = bd[String(i + 1)]?.bio ?? 0; return <div key={i} title={`${i + 1}/${mon}/2026 · ${v} h · ${num(bd[String(i + 1)]?.t ?? 0)} t${b ? ` · sinh khối ${num(b)} kg` : ""}`} style={{ width: 17, height: 22, borderRadius: 3, background: heat(v), border: b ? `1px solid ${C.amber}` : "1px solid transparent", fontSize: 8, color: C.txt, textAlign: "center", lineHeight: "20px" }}>{v ? Math.round(v) : ""}</div>; })}</div>; })}
        <div style={{ display: "flex", gap: 3, marginLeft: 123 }}>{Array.from({ length: days }, (_, i) => <div key={i} style={{ width: 17, fontSize: 8, color: C.dim, textAlign: "center" }}>{i + 1}</div>)}</div></div></div>
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Ô = số giờ chạy trong ngày (tối đa 24); viền cam = ngày có đốt sinh khối. Rê chuột để xem sản lượng.</div></div>

    <div style={card}><div style={h}>Chạy thử sinh khối (viên nén + than củi, vỏ mắc ca) — máy 3</div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 640 }}><thead><tr><th style={{ ...th, textAlign: "left" }}>Tháng</th><th style={th}>Số ca có sinh khối</th><th style={th}>Sinh khối (t)</th><th style={th}>Vỏ mắc ca (bành)</th><th style={th}>Viên nén (bành)</th><th style={th}>Than lò đốt (t)</th><th style={th}>Sinh khối / (sinh khối + than) theo khối lượng</th></tr></thead>
        <tbody>{monthsOf("ALL").map(m => { const x = sumMachine("TH3H", [m]); return <tr key={m}><td style={{ ...td, textAlign: "left", color: C.txt }}>{MNAME[m]}</td><td style={td}>{x.biomassRuns}/{x.ca}</td><td style={{ ...td, color: C.amber }}>{num(x.biomassKg / 1000, 1)}</td><td style={td}>{num(x.maccaBanh)}</td><td style={td}>{num(x.vienNenBanh)}</td><td style={td}>{num(x.coalLoKg / 1000, 1)}</td><td style={td}>{num(biomassMassShare(x) * 100, 0)} %</td></tr>; })}</tbody></table></div>
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Tỷ lệ theo khối lượng, chưa theo nhiệt lượng (chưa có nhiệt trị thực của than, viên nén, vỏ mắc ca). Quy đổi bành: vỏ mắc ca ≈ 1.130 kg/bành, viên nén ≈ 700–720 kg/bành (suy ra từ cột kg). Hồ sơ điều chỉnh GPMT 2986 cho phép đốt sinh khối ở lò sấy chưa được chấp thuận tại thời điểm các số liệu này — cần đối chiếu văn bản cho phép chạy thử (nếu có) và lưu nhật ký. Tháng 5 có thêm 5,65 t sinh khối ở máy 1.</div></div>

    <div style={card}><div style={h}>Đối chiếu kê khai phí khí thải quý II: thiết kế × 1.152 h so với lưu lượng đo × giờ chạy thực</div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", minWidth: 760 }}><thead><tr><th style={{ ...th, textAlign: "left" }}>Dòng thải</th><th style={th}>Máy</th><th style={th}>Giờ chạy máy Q2</th><th style={th}>Giờ chạy / 1.152</th><th style={th}>Q thiết kế (m³/h)</th><th style={th}>Q đo 2026 (m³/h)</th><th style={th}>Lượng khí thực / khai</th></tr></thead>
        <tbody>{KEYS.flatMap(k => MACHINES[k].stacks.map(sid => { const s = STACKS.find(x => x.id === sid), hrs = sumMachine(k, q2).hours; return <tr key={sid}><td style={{ ...td, textAlign: "left", color: C.txt }}>{sid} {s?.name}</td><td style={td}>{MACHINES[k].label}</td><td style={td}>{num(hrs, 1)}</td><td style={{ ...td, color: hrs > 1152 ? C.amber : C.sub }}>{num((hrs / 1152) * 100, 0)} %</td><td style={td}>{num(s.qDesign)}</td><td style={td}>{num(s.qMeasured)}</td><td style={{ ...td, color: C.green }}>{num(volumeRatio(hrs, s.qMeasured, s.qDesign) * 100, 0)} %</td></tr>; }))}</tbody></table></div>
      <div style={{ color: C.dim, fontSize: 11, marginTop: 8, lineHeight: 1.6 }}>Giả định lò sấy nóng và sấy nguội của một máy chạy cùng giờ với máy (chưa có giờ riêng từng lò sấy). Giờ chạy máy 2 và 3 vượt 1.152 h/quý (111 % và 117 %) nhưng lưu lượng đo thấp hơn thiết kế nên lượng khí thực thấp hơn lượng khai. Cách tính phí theo thông báo thẩm định (NĐ 153/2024) vẫn áp dụng; bảng này chỉ để trao đổi với cơ quan thuế/Sở nếu cần điều chỉnh cách khai.</div></div>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))", gap: 14 }}>
      <div style={card}><div style={h}>Nguyên liệu mới dùng cho tạo hạt (tấn)</div>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}><tbody>{raw.map(([n, v]) => <tr key={n}><td style={{ ...td, textAlign: "left" }}>{n}</td><td style={{ ...td, color: C.txt }}>{num(v)}</td></tr>)}</tbody></table>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Số liệu thống kê tính bằng bao (50 kg), quy đổi tấn. Tổng nguyên liệu mới: {num(raw.reduce((a, [, v]) => a + v, 0))} t.</div></div>
      <div style={card}><div style={h}>Dây chuyền trộn, xử lý nguyên liệu, đóng gói (tấn / giờ)</div>
        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}><thead><tr><th style={{ ...th, textAlign: "left" }}>Tháng</th><th style={th}>Trộn (t)</th><th style={th}>Giờ trộn</th><th style={th}>XLNL (t)</th><th style={th}>Đóng gói (t)</th></tr></thead>
          <tbody>{ms.map(m => { const o = PROD[m].other, sum = (d, f) => Object.values(d ?? {}).reduce((a, x) => a + x[f], 0); return <tr key={m}><td style={{ ...td, textAlign: "left" }}>{MNAME[m]}</td><td style={td}>{num(sum(o["TK TRON"], "tons"))}</td><td style={td}>{num(sum(o["TK TRON"], "hours"))}</td><td style={td}>{o["TK XLNL"] ? num(sum(o["TK XLNL"], "tons")) : "—"}</td><td style={td}>{num(Object.values(o.packing).reduce((a, v) => a + v, 0))}</td></tr>; })}</tbody></table>
        <div style={{ color: C.dim, fontSize: 11, marginTop: 8 }}>Trộn: bốn hệ TR1T–TR4T cộng lại. Tháng 5 không có sheet XLNL. Sheet đóng gói có hai kiểu (CHÍNH / TT); chỉ cộng sản lượng ghi trên sheet.</div></div></div>

    <div style={card}><div style={h}>Ghi chú về dữ liệu</div>
      <div style={{ color: C.sub, fontSize: 12, lineHeight: 1.7 }}>• Ca: mã 11, 33 = ca 12 giờ; mã 1, 2, 3 = ca 8 giờ (theo thời gian chạy máy trong từng ca).<br />• Số công tơ điện bị thiếu hoặc sai ở {PROD_NOTES.length} dòng — đã loại khỏi tổng điện:<br />{PROD_NOTES.filter(n => /công tơ/.test(n)).map((n, i) => <span key={i} style={{ color: C.dim }}>&nbsp;&nbsp;– {n}<br /></span>)}• Tháng 9–10 chưa có thống kê. Bảng thống kê gốc là file Excel nội bộ của Phòng KT-SX; App chỉ nạp số liệu tổng hợp theo ca và ngày.</div></div>
  </div>;
}
