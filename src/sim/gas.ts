// Mô phỏng hệ thống xử lý khí thải — 7 dòng thải có hệ thống xử lý theo Phụ lục 2, GPMT 2986/GPMT-STNMT (28/04/2023).
//  G01  Lò hơi than 8 t/h: bộ lọc bụi ướt → tháp hấp thụ dung dịch kiềm (NaOH) → quạt hút → ống khói 18 m, D700; 25.000 m³/h
//  G02–G05 Lò sấy nóng/nguội của dây chuyền tạo hạt 1, 2: cyclone chùm → lọc bụi túi vải → quạt hút → ống khói 22 m (D1 800 / D2 600); 55.000 m³/h
//  G06  Lò sấy dây chuyền tạo hạt 3: cùng quy trình, 140.000 m³/h, ống khói 22 m (D1 3 m / D2 2 m)
//  G07  Phối trộn phân hữu cơ: lọc bụi túi vải → quạt hút → ống thải 1,2 m, D300; 10.000 m³/h
// Giới hạn: QCVN 19:2009 cột B (Kp 0,8; Kv 1,0): CO 800, NOx 680, SO₂ 400, bụi 160 mg/Nm³; lò sấy thêm QCVN 21:2009 cột B: NH₃ 40; phối trộn hữu cơ: bụi 200 (Kp 1,0).
// LƯU Ý: GPMT ghi các dòng thải này KHÔNG thuộc đối tượng phải lắp quan trắc tự động liên tục (Điều 98 NĐ 08/2022) — các "máy phân tích" AT-xxx trong mô phỏng là tag đề xuất
// để đào tạo, tương đương kết quả đo định kỳ; hằng số động học là gần đúng (không dùng thiết kế). Mã tag do mô hình đề xuất — kỹ sư cần duyệt.
export type Kind = "boiler" | "dryer" | "mixer";
export interface Limits { dust: number; so2?: number; nox?: number; co?: number; nh3?: number }
export interface UnitDef { opFlow: number; id: string; name: string; kind: Kind; flow: number; stack: string; hs: number; d: string; lim: Limits; train: string[]; note?: string }
export const UNITS: UnitDef[] = [
  { opFlow: 0.76, id: "G01", name: "Lò hơi than 8 t/h", kind: "boiler", flow: 25000, stack: "S01", hs: 18, d: "D700", lim: { dust: 160, so2: 400, nox: 680, co: 800 }, train: ["Bộ lọc bụi ướt", "Tháp hấp thụ kiềm (NaOH)", "Quạt hút", "Ống khói"] },
  { opFlow: 0.85, id: "G02", name: "Sấy nóng · tạo hạt 1", kind: "dryer", flow: 55000, stack: "S02", hs: 22, d: "D1 800 / D2 600", lim: { dust: 160, so2: 400, nox: 680, co: 800, nh3: 40 }, train: ["Cyclone chùm", "Lọc bụi túi vải", "Quạt hút", "Ống khói"] },
  { opFlow: 0.85, id: "G03", name: "Sấy nguội · tạo hạt 1", kind: "dryer", flow: 55000, stack: "S03", hs: 22, d: "D1 800 / D2 600", lim: { dust: 160, so2: 400, nox: 680, co: 800, nh3: 40 }, train: ["Cyclone chùm", "Lọc bụi túi vải", "Quạt hút", "Ống khói"] },
  { opFlow: 0.7, id: "G04", name: "Sấy nóng · tạo hạt 2 (Nguồn 04)", kind: "dryer", flow: 55000, stack: "S04", hs: 22, d: "D1 800 / D2 600 (hồ sơ điều chỉnh 10/11/2026: 2.000 / 1.500)", lim: { dust: 160, so2: 400, nox: 680, co: 800, nh3: 40 }, train: ["Cyclone chùm", "Lọc bụi túi vải", "Quạt hút", "Ống khói"] },
  { opFlow: 0.68, id: "G05", name: "Sấy nguội · tạo hạt 2", kind: "dryer", flow: 55000, stack: "S05", hs: 22, d: "D1 800 / D2 600", lim: { dust: 160, so2: 400, nox: 680, co: 800, nh3: 40 }, train: ["Cyclone chùm", "Lọc bụi túi vải", "Quạt hút", "Ống khói"] },
  { opFlow: 0.56, id: "G06", name: "Sấy · tạo hạt 3", kind: "dryer", flow: 140000, stack: "S06", hs: 22, d: "D1 3 m / D2 2 m", lim: { dust: 160, so2: 400, nox: 680, co: 800, nh3: 40 }, train: ["Cyclone chùm", "Lọc bụi túi vải", "Quạt hút", "Ống khói"] },
  { opFlow: 1, id: "G07", name: "Phối trộn phân hữu cơ (hiện không chạy)", kind: "mixer", flow: 10000, stack: "S07", hs: 1.2, d: "D300", lim: { dust: 200 }, train: ["Lọc bụi túi vải", "Quạt hút", "Ống thải"] },
];
export const DP_H = 260, DP_HH = 300, DP_CLEAN = 120, PH_SP = 7.5;

export interface Unit {
  fan: boolean; fanTrip: boolean; feed: number; feedTgt: number;            // quạt hút, tải sản xuất (0–1) và tải đặt
  holes: number; cake: number; dp: number; airOk: boolean; wet: boolean; pulse: number; pulseAuto: boolean; pulseSp: number; // túi lọc
  jam: boolean;                                                              // van xoay cyclone kẹt
  pumpA: boolean; pumpB: boolean; pumpFail: boolean; dosA: boolean; dosB: boolean; dosLost: boolean; alk: number; phOut: number; phMode: "AUTO" | "MAN"; phSp: number; phI: number; // tháp kiềm lò hơi
  dust: number; so2: number; nox: number; co: number; nh3: number; flow: number; overMin: number; fugitive: number;
}
export interface Gas { t: number; u: Record<string, Unit>; log: { t: number; text: string }[]; alarms: Record<string, { text: string; pri: 1 | 2; since: number; acked: boolean }>; peakDust: Record<string, number> }
const unit = (d: UnitDef): Unit => ({ fan: true, fanTrip: false, feed: 1, feedTgt: 1, holes: 0.002, cake: 0.35, dp: 190, airOk: true, wet: false, pulse: 0, pulseAuto: true, pulseSp: 220, jam: false,
  pumpA: true, pumpB: false, pumpFail: false, dosA: true, dosB: false, dosLost: false, alk: 0.72, phOut: 0.45, phMode: "AUTO", phSp: PH_SP, phI: 0.45,
  dust: 0, so2: 0, nox: 0, co: 0, nh3: 0, flow: d.flow, overMin: 0, fugitive: 0 });
export function createGas(): Gas { const g: Gas = { t: 0, u: {}, log: [], alarms: {}, peakDust: {} }; for (const d of UNITS) { g.u[d.id] = unit(d); g.peakDust[d.id] = 0; } { const m = g.u.G07; m.fan = false; m.feed = 0; m.feedTgt = 0; } for (let i = 0; i < 400; i++) stepGas(g, 1); g.t = 0; g.log = []; g.alarms = {}; for (const d of UNITS) { g.peakDust[d.id] = 0; g.u[d.id].overMin = 0; g.u[d.id].fugitive = 0; } return g; }
const log = (g: Gas, text: string) => { g.log.unshift({ t: g.t, text }); if (g.log.length > 200) g.log.length = 200; };
export const ph = (u: Unit) => 3.5 + 5.5 * Math.max(0, Math.min(1, u.alk));

/** Nồng độ "thô" quy đổi để trạng thái nền khớp kết quả quan trắc 2026 (TTKTTN&MT Tây Ninh: 30/3, 6/4, 28/4, 30/6, 6/7, 17/7/2026): bụi ống khói 13–19; NOx lò hơi 28–34, lò sấy < 10–59; SO₂ lò hơi 49–55, lò sấy < 10; CO lò hơi 68–79, lò sấy 14–74 (một lần 172); NH₃ lò sấy KPH–1,6 mg/Nm³. opFlow = lưu lượng đo/lưu lượng thiết kế. */
const RAW = { boiler: { dust: 450, so2: 1500, nox: 32, co: 70, nh3: 0 }, dryer: { dust: 9000, so2: 8, nox: 25, co: 45, nh3: 0.8 }, mixer: { dust: 1200, so2: 0, nox: 0, co: 0, nh3: 0 } };

export function stepGas(g: Gas, dt: number) {
  g.t += dt;
  for (const d of UNITS) {
    const u = g.u[d.id], raw = RAW[d.kind];
    // tải sản xuất bám tải đặt (xả/đưa liệu thay đổi trong ~30 s); lò sấy dừng nếu không có quạt hút thì vẫn chạy cho tới khi vận hành viên dừng (đó là điều bài tập kiểm tra)
    u.feed += Math.max(-1, Math.min(1, (u.feedTgt - u.feed) / 30)) * dt * 0.5 * (u.feedTgt >= u.feed ? 1 : 1.5); u.feed = Math.max(0, Math.min(1, u.feed));
    // quạt hút: ΔP túi cao làm giảm lưu lượng; trip khi ΔP > DP_HH kéo dài
    const choke = 1 - 0.3 * Math.max(0, Math.min(1, (u.dp - DP_H) / 100));
    u.flow = u.fan && !u.fanTrip ? d.flow * d.opFlow * choke * (0.35 + 0.65 * Math.max(u.feed, d.kind === "boiler" ? 0.4 : 0.15)) : 0; const q = u.flow / (d.flow * d.opFlow);
    // ── túi lọc (dryer, mixer, và không áp dụng cho boiler) ────────────────────────
    const hasBag = d.kind !== "boiler";
    if (hasBag) {
      const cyc = d.kind === "dryer" ? (u.jam ? 0.6 : 0.95) : 0, post = raw.dust * (1 - cyc), loadRate = (post / 600) * u.feed * (u.wet ? 2.6 : 1) * q;
      u.cake += 0.00042 * loadRate * dt;
      if (u.pulse > 0) { u.pulse -= dt; u.cake = Math.max(0.08, u.cake * Math.pow(0.5, dt / 2.5)); }
      else if (u.pulseAuto && u.airOk && u.dp >= u.pulseSp) u.pulse = 6;
      const tgt = (DP_CLEAN + 450 * Math.max(0, u.cake - 0.08)) * Math.max(0.4, 1 - 2.5 * u.holes) * (0.3 + 0.7 * q * q) + 20;
      u.dp += (tgt - u.dp) * Math.min(1, dt / 20);
      if (u.cake > 1.6) u.cake = 1.6;
      const leak = 0.033 + 3 * u.holes, dustOut = post * leak * (u.fan ? 1 : 0);
      u.dust = q > 0 ? dustOut * (0.2 + 0.8 * Math.min(1, u.feed + 0.05)) : 0;
      u.nh3 = q > 0 ? raw.nh3 * Math.min(1, u.feed) * (0.8 + 0.4 * Math.random() * 0) : 0;
      u.nox = q > 0 ? raw.nox * u.feed : 0; u.co = q > 0 ? raw.co * u.feed : 0; u.so2 = q > 0 ? raw.so2 * u.feed : 0;
    } else {
      // ── lò hơi: bộ lọc bụi ướt + tháp kiềm ───────────────────────────────────
      const pumpOn = (u.pumpA || u.pumpB) && !u.pumpFail, circ = pumpOn ? 1 : 0, doseOn = ((u.dosA || u.dosB) && !u.dosLost) ? 1 : 0, f = Math.max(0.25, u.feed);
      const so2in = raw.so2 * f, load = so2in / 1500;
      const eff = circ ? 0.97 / (1 + Math.exp(-(ph(u) - 5.2) * 2.2)) + 0.0 : 0.04;
      const absorbed = eff * load * q;
      // PID pH (dạng vận tốc, anti-windup) — đầu ra 0–1 = % châm NaOH
      if (u.phMode === "AUTO") { const e = u.phSp - ph(u); const kp = 0.12, ti = 90; u.phI += (kp * e / ti) * dt * 6; u.phI = Math.max(0, Math.min(1, u.phI)); u.phOut = Math.max(0, Math.min(1, u.phI + kp * e)); }
      u.alk += ((doseOn * u.phOut * 0.0042 - absorbed * 0.0030 - (circ ? 0.00004 : 0)) * dt) ; u.alk = Math.max(0, Math.min(1, u.alk));
      u.so2 = q > 0 ? so2in * (1 - (q > 0 ? eff : 0)) : 0;
      const dEff = circ ? 0.96 : 0.25; u.dust = q > 0 ? raw.dust * f * (1 - dEff) * (0.9 + 0.2 * (u.wet ? 1 : 0)) : 0;
      u.nox = q > 0 ? raw.nox * f : 0; u.co = q > 0 ? raw.co * (f < 0.5 ? 1.2 : 1) : 0; u.nh3 = 0; u.dp = 0;
    }
    // đo đếm vi phạm / tràn bụi ngoài cửa thu
    const lim = d.lim; const over = u.dust > lim.dust || (lim.so2 && u.so2 > lim.so2) || (lim.nh3 && u.nh3 > lim.nh3) || (lim.nox && u.nox > lim.nox); if (over && u.flow > 0) u.overMin += dt / 60;
    if (!u.fan || u.fanTrip) { if (u.feed > 0.05) u.fugitive += dt / 60; }
    g.peakDust[d.id] = Math.max(g.peakDust[d.id], u.dust);
    // quạt trip khi ΔP vượt HH liên tục
    if (hasBag && u.fan && !u.fanTrip && u.dp > DP_HH + 40) { u.fanTrip = true; u.fan = false; log(g, `${d.id}: quạt hút trip do ΔP túi lọc quá cao`); }
  }
  updateAlarms(g);
}
const raise = (g: Gas, id: string, text: string, pri: 1 | 2) => { if (!g.alarms[id]) { g.alarms[id] = { text, pri, since: g.t, acked: false }; log(g, `BÁO ĐỘNG ${pri === 1 ? "P1" : "P2"} — ${text}`); } };
const clear = (g: Gas, id: string) => { if (g.alarms[id]) { log(g, `Trở về bình thường — ${g.alarms[id].text}`); delete g.alarms[id]; } };
function updateAlarms(g: Gas) {
  for (const d of UNITS) { const u = g.u[d.id];
    const run = u.flow > 0;
    (run && u.dust > d.lim.dust ? raise : (a: Gas, id: string) => clear(a, id))(g, `${d.id}:DUST`, `${d.id} bụi ${u.dust.toFixed(0)} > ${d.lim.dust} mg/Nm³`, 1);
    if (d.lim.so2) (run && u.so2 > d.lim.so2 ? raise : (a: Gas, id: string) => clear(a, id))(g, `${d.id}:SO2`, `${d.id} SO₂ ${u.so2.toFixed(0)} > ${d.lim.so2} mg/Nm³`, 1);
    if (d.kind !== "boiler") { (u.dp > DP_HH ? raise : (a: Gas, id: string) => clear(a, id))(g, `${d.id}:DPHH`, `${d.id} ΔP túi lọc ${u.dp.toFixed(0)} > ${DP_HH} mmH₂O`, 1); (u.dp > DP_H && u.dp <= DP_HH ? raise : (a: Gas, id: string) => clear(a, id))(g, `${d.id}:DPH`, `${d.id} ΔP túi lọc cao ${u.dp.toFixed(0)} mmH₂O`, 2);
      (!u.airOk ? raise : (a: Gas, id: string) => clear(a, id))(g, `${d.id}:AIR`, `${d.id} mất khí nén rũ bụi`, 2); }
    else { (ph(u) < 6 ? raise : (a: Gas, id: string) => clear(a, id))(g, `${d.id}:PH`, `${d.id} pH dung dịch hấp thụ thấp ${ph(u).toFixed(1)}`, 2); (!(u.pumpA || u.pumpB) || u.pumpFail ? raise : (a: Gas, id: string) => clear(a, id))(g, `${d.id}:PUMP`, `${d.id} mất bơm tuần hoàn dung dịch`, 1); }
    ((u.fanTrip || !u.fan) && u.feed > 0.05 ? raise : (a: Gas, id: string) => clear(a, id))(g, `${d.id}:FAN`, `${d.id} mất hút (quạt dừng) khi còn sản xuất — bụi phát tán`, 1);
  }
}
export const ack = (g: Gas) => { for (const a of Object.values(g.alarms)) a.acked = true; };

// ── thao tác của vận hành viên ───────────────────────────────────────────────
export function setFeed(g: Gas, id: string, tgt: number) { g.u[id].feedTgt = tgt; log(g, `${id}: tải sản xuất đặt ${Math.round(tgt * 100)} %`); }
export function fan(g: Gas, id: string, on: boolean): { ok: boolean; reason?: string } {
  const u = g.u[id], d = UNITS.find(x => x.id === id)!;
  if (on) { if (u.fanTrip && u.dp > DP_HH) return { ok: false, reason: "ΔP túi lọc còn quá cao — rũ bụi trước khi khởi động lại quạt" }; if (d.kind === "boiler" && !(u.pumpA || u.pumpB)) return { ok: false, reason: "Khóa liên động: phải chạy bơm tuần hoàn dung dịch trước quạt hút" }; if (d.kind === "boiler" && u.pumpFail) return { ok: false, reason: "Bơm tuần hoàn đang sự cố" }; u.fan = true; u.fanTrip = false; log(g, `${id}: khởi động quạt hút`); }
  else { u.fan = false; log(g, `${id}: dừng quạt hút`); }
  return { ok: true };
}
export function pulse(g: Gas, id: string) { const u = g.u[id]; if (!u.airOk) return false; u.pulse = 8; log(g, `${id}: rũ bụi thủ công`); return true; }
export function replaceBags(g: Gas, id: string) { const u = g.u[id]; if (u.feed > 0.05 && u.fan) return false; u.holes = 0.002; u.cake = 0.2; log(g, `${id}: thay túi lọc thủng`); return true; }
export function restoreAir(g: Gas, id: string) { g.u[id].airOk = true; log(g, `${id}: khôi phục khí nén`); }
export function clearJam(g: Gas, id: string) { g.u[id].jam = false; log(g, `${id}: thông van xoay cyclone`); }
export function primeNaoh(g: Gas, id: string) { const u = g.u[id]; u.dosLost = false; u.dosB = true; u.dosA = true; log(g, `${id}: mồi lại bơm định lượng NaOH và bật bơm dự phòng`); }
export function pumpStart(g: Gas, id: string, which: "A" | "B") { const u = g.u[id]; if (which === "A") u.pumpA = true; else u.pumpB = true; u.pumpFail = false; log(g, `${id}: chạy bơm tuần hoàn ${which}`); }
export type Fault = "bagTear" | "fanTrip" | "airLoss" | "wetFeed" | "jam" | "naohLost" | "pumpFail";
export const FAULTS: Record<Fault, string> = { bagTear: "Rách túi lọc", fanTrip: "Quạt hút trip", airLoss: "Mất khí nén rũ bụi", wetFeed: "Liệu ẩm (túi lọc bết)", jam: "Kẹt van xoay cyclone", naohLost: "Bơm NaOH mất mồi", pumpFail: "Bơm tuần hoàn sự cố" };
export function inject(g: Gas, id: string, f: Fault) { const u = g.u[id]; if (f === "bagTear") u.holes = 0.12; else if (f === "fanTrip") { u.fanTrip = true; u.fan = false; } else if (f === "airLoss") { u.airOk = false; } else if (f === "wetFeed") u.wet = true; else if (f === "jam") u.jam = true; else if (f === "naohLost") u.dosLost = true; else if (f === "pumpFail") { u.pumpFail = true; } log(g, `SỰ CỐ (giảng viên) — ${id}: ${FAULTS[f]}`); }

// ── bài thử thách ────────────────────────────────────────────────────────────
export interface Challenge { id: string; unit: string; title: string; brief: string; hint: string; minutes: number; setup?: (g: Gas) => void; tick?: (g: Gas, t: number) => void; verdict: (g: Gas, t: number) => { state: "run" | "pass" | "fail"; text: string } }
export interface ChRun { id: string; startT: number; state: "run" | "pass" | "fail"; text: string; endT?: number }
const mins = (g: Gas, c: Challenge, t0: number) => (g.t - t0) / 60;
export const CHALLENGES: Challenge[] = [
  { id: "bag", unit: "G04", title: "1. Rách túi lọc — lò sấy nóng tạo hạt 2", minutes: 30,
    brief: "Sau 2 phút, túi lọc G04 bị rách: bụi ống khói vượt 160 mg/Nm³ (ΔP túi tụt thấp). Theo phương án ứng phó của GPMT: tạm ngừng dây chuyền phát sinh bụi, tìm nguyên nhân, khắc phục rồi mới sản xuất lại. Giữ thời gian vượt chuẩn ≤ 5 phút.",
    hint: "ΔP thấp + bụi cao = rách túi (ΔP cao + bụi thấp mới là bết túi). Giảm tải G04 về 0, thay túi, rồi đặt tải 100 %.",
    tick: (g, t) => { if (t >= 120 && t < 121) g.u.G04.holes = 0.12; },
    verdict: (g, t) => { const u = g.u.G04; if (u.overMin > 5) return { state: "fail", text: `Vượt chuẩn ${u.overMin.toFixed(1)} phút (> 5 phút).` }; if (t >= 1500 && u.holes < 0.02 && u.feed > 0.9 && u.dust <= 160) return { state: "pass", text: `Dừng dây chuyền kịp thời (vượt chuẩn ${u.overMin.toFixed(1)} phút), đã thay túi; bụi ${u.dust.toFixed(0)} mg/Nm³.` }; if (t >= 1800) return { state: "fail", text: "Hết giờ: chưa thay túi hoặc chưa sản xuất lại." }; return { state: "run", text: "Đang xử lý…" }; } },
  { id: "scrub", unit: "G01", title: "2. Bơm NaOH mất mồi — tháp hấp thụ lò hơi", minutes: 60,
    brief: "Sau 2 phút, bơm định lượng NaOH của tháp lò hơi G01 mất mồi: pH dung dịch hấp thụ sẽ tụt dần và SO₂ ống khói tăng. Phục hồi châm kiềm trước khi SO₂ vượt 400 mg/Nm³ (nếu cần giảm tải lò hơi).",
    hint: "Theo dõi AIT-102 (pH tháp). Mồi lại bơm định lượng NaOH (bật bơm dự phòng); vòng AIC-102 chỉ hiệu quả khi bơm chạy.",
    tick: (g, t) => { if (t >= 120 && t < 121) g.u.G01.dosLost = true; },
    verdict: (g, t) => { const u = g.u.G01; if (u.overMin > 5) return { state: "fail", text: `SO₂/bụi vượt chuẩn ${u.overMin.toFixed(1)} phút.` }; if (t >= 3000 && !u.dosLost && ph(u) >= 6.5 && u.so2 <= 400) return { state: "pass", text: `Phục hồi châm kiềm: pH ${ph(u).toFixed(1)}, SO₂ ${u.so2.toFixed(0)} mg/Nm³.` }; if (t >= 3600) return { state: "fail", text: "Hết giờ: pH tháp chưa phục hồi." }; return { state: "run", text: "Đang xử lý…" }; } },
  { id: "fan", unit: "G02", title: "3. Quạt hút trip — lò sấy nóng tạo hạt 1", minutes: 20,
    brief: "Sau 1 phút quạt hút G02 trip: mất áp âm, bụi và khí nóng phát tán ra cửa thu. Giảm tải/dừng cấp liệu trong 90 giây, rồi khởi động lại quạt hút và đưa dây chuyền về tải 100 %.",
    hint: "Đặt tải G02 = 0 ngay, khởi động lại quạt (kiểm ΔP, khí nén), chờ ổn định rồi nâng tải lại.",
    tick: (g, t) => { if (t >= 60 && t < 61) { g.u.G02.fanTrip = true; g.u.G02.fan = false; } },
    verdict: (g, t) => { const u = g.u.G02; if (u.fugitive > 1.5) return { state: "fail", text: `Phát tán bụi ${u.fugitive.toFixed(1)} phút khi mất hút (> 1,5 phút).` }; if (t >= 1000 && u.fan && !u.fanTrip && u.feed > 0.9 && u.dust <= 160) return { state: "pass", text: `Dừng cấp liệu kịp (phát tán ${u.fugitive.toFixed(1)} phút), quạt chạy lại, bụi ${u.dust.toFixed(0)} mg/Nm³.` }; if (t >= 1200) return { state: "fail", text: "Hết giờ: quạt chưa chạy lại hoặc dây chuyền chưa về tải." }; return { state: "run", text: "Đang xử lý…" }; } },
  { id: "dp", unit: "G06", title: "4. Mất khí nén rũ bụi — ΔP túi lọc tăng", minutes: 40,
    brief: "Sau 1 phút máy nén khí mất áp (khí nén rũ bụi G06 mất): ΔP túi lọc leo thang, lưu lượng hút giảm. Khôi phục khí nén và rũ bụi trước khi quạt trip do ΔP > 300 mmH₂O.",
    hint: "Khôi phục khí nén (kiểm tra máy nén/bình tích), rũ bụi thủ công rồi để PDIC chạy AUTO; nếu liệu ẩm, giảm tải.",
    setup: g => { g.u.G06.cake = 0.5; },
    tick: (g, t) => { if (t >= 60 && t < 61) g.u.G06.airOk = false; },
    verdict: (g, t) => { const u = g.u.G06; if (u.fanTrip) return { state: "fail", text: "Quạt trip do ΔP túi lọc quá cao." }; if (t >= 2000 && u.airOk && u.dp <= 240) return { state: "pass", text: `ΔP về ${u.dp.toFixed(0)} mmH₂O, quạt vẫn chạy.` }; if (t >= 2400) return { state: "fail", text: "Hết giờ: ΔP vẫn cao." }; return { state: "run", text: "Đang xử lý…" }; } },
];
export function startChallenge(id: string): { g: Gas; run: ChRun } { const c = CHALLENGES.find(x => x.id === id)!, g = createGas(); c.setup?.(g); return { g, run: { id, startT: g.t, state: "run", text: "Đang xử lý…" } }; }
export function tickChallenge(g: Gas, r: ChRun) { if (r.state !== "run") return; const c = CHALLENGES.find(x => x.id === r.id)!, t = g.t - r.startT; c.tick?.(g, t); const v = c.verdict(g, t); r.text = v.text; if (v.state !== "run") { r.state = v.state; r.endT = t; log(g, `${v.state === "pass" ? "ĐẠT" : "KHÔNG ĐẠT"} — ${v.text}`); } }
