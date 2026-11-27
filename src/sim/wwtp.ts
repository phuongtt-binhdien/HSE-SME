// Mô phỏng dòng chảy xử lý nước thải: đầu vào → HTXLNT 120 m³/ngày.đêm → sông Vàm Cỏ Đông.
// Mô hình chuỗi bể khuấy trộn hoàn toàn (CSTR) có thủy lực (bơm, mực nước, tràn), hóa lý (PAC/polymer/NaOH), sinh học (DO, nitrat hóa theo tải/ khả năng),
// lắng, lọc, khử trùng, bể sinh thái, van xả/hồ sự cố và pha loãng sông.
// LƯU Ý: thể tích bể suy từ thời gian lưu giả định (chưa có bản vẽ kích thước) và các hệ số xử lý là CHỈ THỊ, chưa hiệu chuẩn bằng số liệu vận hành —
// dùng cho huấn luyện và so sánh định tính, không dùng làm căn cứ thiết kế hoặc báo cáo.

export type Kind = "sump" | "oil" | "sed" | "eq" | "coag" | "floc" | "clar_chem" | "anox" | "mbbr" | "aer" | "clar2" | "mid" | "filter" | "disinf" | "eco";
export interface Stage { id: string; name: string; kind: Kind; hrt: number; pumped?: boolean; pump?: string }
export type Mode = "retro" | "exist";
export type ParamKey = "cod" | "bod" | "tss" | "nh4" | "tn" | "tp" | "coli" | "ph" | "do" | "tracer";
export const PARAMS: { key: ParamKey; label: string; unit: string }[] = [
  { key: "cod", label: "COD", unit: "mg/L" }, { key: "bod", label: "BOD₅", unit: "mg/L" }, { key: "tss", label: "TSS", unit: "mg/L" }, { key: "nh4", label: "NH₄⁺-N", unit: "mg/L" },
  { key: "tn", label: "T-N", unit: "mg/L" }, { key: "tp", label: "T-P", unit: "mg/L" }, { key: "coli", label: "Coliform", unit: "MPN/100 mL" }, { key: "ph", label: "pH", unit: "" },
  { key: "do", label: "DO", unit: "mg/L" }, { key: "tracer", label: "Chất chỉ thị", unit: "%" },
];

export const Q_DESIGN = 5; // m³/h = 120 m³/ngày.đêm

export const STAGES: Record<Mode, Stage[]> = {
  retro: [
    { id: "B01", name: "Hố bơm tổng hợp", kind: "sump", hrt: 0.6, pumped: true, pump: "WP01" },
    { id: "B02", name: "Bể tách dầu", kind: "oil", hrt: 1 },
    { id: "B03", name: "Bể lắng sơ bộ", kind: "sed", hrt: 1.5, pumped: true, pump: "WP03" },
    { id: "B04", name: "Bể điều hòa", kind: "eq", hrt: 8, pumped: true, pump: "WP04" },
    { id: "B05A", name: "Bể keo tụ", kind: "coag", hrt: 0.25 },
    { id: "B05B", name: "Bể tạo bông", kind: "floc", hrt: 0.5 },
    { id: "B06", name: "Bể lắng hóa lý", kind: "clar_chem", hrt: 3 },
    { id: "B07", name: "Bể thiếu khí", kind: "anox", hrt: 4 },
    { id: "B08", name: "Bể MBBR", kind: "mbbr", hrt: 3 },
    { id: "B09", name: "Bể hiếu khí", kind: "aer", hrt: 12 },
    { id: "B10", name: "Bể lắng sinh học", kind: "clar2", hrt: 3 },
    { id: "B11", name: "Bể trung gian", kind: "mid", hrt: 2, pumped: true, pump: "WP11" },
    { id: "FT11", name: "Bồn lọc áp lực", kind: "filter", hrt: 0.1 },
    { id: "B12", name: "Bể khử trùng", kind: "disinf", hrt: 0.5 },
    { id: "B13", name: "Bể sinh thái", kind: "eco", hrt: 6 },
  ],
  exist: [
    { id: "H0", name: "Hố thu gom", kind: "sump", hrt: 0.6, pumped: true, pump: "WP01" },
    { id: "L1", name: "Lắng hóa lý 1", kind: "sed", hrt: 1.5 },
    { id: "L2", name: "Lắng hóa lý 2", kind: "sed", hrt: 1 },
    { id: "DH", name: "Bể điều hòa", kind: "eq", hrt: 8, pumped: true, pump: "WP04" },
    { id: "TN", name: "Bể tuyển nổi", kind: "oil", hrt: 0.5 },
    { id: "KT", name: "Bể keo tụ", kind: "coag", hrt: 0.25 },
    { id: "TB", name: "Bể tạo bông", kind: "floc", hrt: 0.5 },
    { id: "L3", name: "Lắng bông bùn 3", kind: "clar_chem", hrt: 3 },
    { id: "A1", name: "Thiếu khí 1", kind: "anox", hrt: 2 },
    { id: "A2", name: "Thiếu khí 2 + MBBR", kind: "mbbr", hrt: 3 },
    { id: "HK", name: "Bể hiếu khí", kind: "aer", hrt: 12 },
    { id: "L4", name: "Lắng hồi lưu 4", kind: "clar2", hrt: 3 },
    { id: "TG", name: "Bể trung gian", kind: "mid", hrt: 2, pumped: true, pump: "WP11" },
    { id: "LAP", name: "Bồn lọc áp lực", kind: "filter", hrt: 0.1 },
    { id: "KTR", name: "Bể khử trùng", kind: "disinf", hrt: 0.5 },
  ],
};

export interface Conc { cod: number; bod: number; tss: number; nh4: number; tn: number; tp: number; coli: number; ph: number; do: number; tracer: number }
export const INFLUENT: Record<string, { name: string; c: Conc; qMul: number }> = {
  typical: { name: "Điển hình (trung bình 2021–2022)", c: { cod: 222.6, bod: 117.5, tss: 97.4, nh4: 101.1, tn: 119, tp: 31, coli: 152875, ph: 7.5, do: 0, tracer: 0 }, qMul: 1 },
  peak: { name: "Đỉnh tải (giá trị lớn nhất 2021–2022)", c: { cod: 1082, bod: 570, tss: 180, nh4: 293, tn: 322, tp: 62, coli: 540000, ph: 7.5, do: 0, tracer: 0 }, qMul: 1 },
  phshock: { name: "Sốc pH 12 (đợt 4/2022)", c: { cod: 222.6, bod: 117.5, tss: 97.4, nh4: 101.1, tn: 119, tp: 31, coli: 152875, ph: 12, do: 0, tracer: 0 }, qMul: 1 },
  light: { name: "Tải nhẹ (giá trị nhỏ nhất)", c: { cod: 36, bod: 20, tss: 30, nh4: 20.7, tn: 23.5, tp: 5.72, coli: 14000, ph: 7, do: 0, tracer: 0 }, qMul: 1 },
};

export interface Standard { name: string; bod: number; cod: number; tss: number; nh4: number; tn: number; tp: number; coli: number; ph: [number, number] }
export const STANDARDS: Record<string, Standard> = {
  qcvn40: { name: "QCVN 40:2011/BTNMT cột A × Kq 1,2 × Kf 1,1 (GPMT 2986)", bod: 39.6, cod: 99, tss: 66, nh4: 6.6, tn: 26.4, tp: 5.28, coli: 3000, ph: [6, 9] },
  qcvn14: { name: "QCVN 14:2025/BTNMT Bảng 2 cột A (báo cáo khảo sát cải tạo)", bod: 30, cod: 80, tss: 50, nh4: 6, tn: 25, tp: 4, coli: 3000, ph: [5, 9] },
};

/** Vòng điều khiển PID dạng vận tốc (chống bão hòa tích phân): AUTO tự điều chỉnh OUT theo sai lệch SP − PV; MAN do vận hành viên đặt OUT. */
export interface Loop { mode: "AUTO" | "MAN"; sp: number; out: number; kp: number; ti: number; prev: number }
export interface Controls {
  doLoop: Loop;   // AIC-901: DO bể hiếu khí → tốc độ máy thổi khí (biến tần), OUT 0,15–1
  phLoop: Loop;   // AIC-501: pH bể keo tụ → châm NaOH (+) / axit (−), OUT −1…+1, quyền hiệu chỉnh ±1,5 đơn vị pH
  wp: Record<string, boolean>; blowerA: boolean; blowerB: boolean; blowerFail: boolean;
  pac: boolean; pacDose: number; polymer: boolean; naoh: boolean; clo: boolean; valveAuto: boolean; valveOpen: boolean; diurnal: boolean;
}
export interface TankState { c: Conc; vol: number; q: number; level: number; stuck?: boolean }
export interface WwState {
  mode: Mode; t: number; tanks: TankState[]; inf: Conc; infKey: string; qIn: number; ctl: Controls; std: string;
  out: { q: number; c: Conc }; pond: { vol: number; cap: number }; spill: number; discharged: number; load: { cod: number; nh4: number; tn: number; tp: number };
  tracerUntil?: number; alarms: string[]; log: { t: number; text: string }[]; hist: { t: number; cod: number; nh4: number; tss: number; ph: number; do: number; doSp: number; doOut: number; phPv: number; phSp: number; phOut: number; lvEq: number; q: number }[]; exceedSince: number | null; violVol: number;
}

const vNom = (st: Stage) => st.hrt * Q_DESIGN;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const zero = (): Conc => ({ cod: 0, bod: 0, tss: 0, nh4: 0, tn: 0, tp: 0, coli: 0, ph: 7, do: 0, tracer: 0 });

export function createWw(mode: Mode = "retro", infKey = "typical"): WwState {
  const stages = STAGES[mode];
  const inf = { ...INFLUENT[infKey].c };
  const wp: Record<string, boolean> = { WP01: true, WP03: true, WP04: true, WP11: true };
  const s: WwState = {
    mode, t: 0, infKey, inf, qIn: Q_DESIGN, std: "qcvn40",
    tanks: stages.map(st => ({ c: { ...inf, do: st.kind === "aer" ? 3 : st.kind === "mbbr" ? 2 : 0 }, vol: vNom(st) * (st.pumped ? 0.4 : 1), q: Q_DESIGN, level: st.pumped ? 0.4 : 0.5 })),
    ctl: { wp, doLoop: { mode: "AUTO", sp: 2.5, out: 0.6, kp: 0.35, ti: 1, prev: 0 }, phLoop: { mode: "AUTO", sp: 7.2, out: 0, kp: 0.6, ti: 0.25, prev: 0 }, blowerA: true, blowerB: false, blowerFail: false, pac: true, pacDose: 50, polymer: true, naoh: true, clo: true, valveAuto: true, valveOpen: true, diurnal: false },
    out: { q: Q_DESIGN, c: { ...inf } }, pond: { vol: 0, cap: 200 }, spill: 0, discharged: 0, load: { cod: 0, nh4: 0, tn: 0, tp: 0 },
    alarms: [], log: [], hist: [], exceedSince: null, violVol: 0,
  };
  // khởi động nóng: chạy ổn định 120 h với van xả mở, rồi đặt lại bộ đếm
  s.ctl.valveAuto = false; settle(s, 120); s.ctl.valveAuto = true;
  s.t = 0; s.violVol = 0; s.spill = 0; s.discharged = 0; s.load = { cod: 0, nh4: 0, tn: 0, tp: 0 }; s.pond.vol = 0; s.hist = []; s.log = []; s.alarms = []; s.ctl.valveOpen = true;
  return s;
}

export function setInfluent(s: WwState, key: string) { s.infKey = key; s.inf = { ...INFLUENT[key].c }; addLog(s, `Nước thải đầu vào: ${INFLUENT[key].name}`); }
export function injectTracer(s: WwState) { s.inf.tracer = 100; s.tracerUntil = s.t + 0.5; addLog(s, "Thả chất chỉ thị (xung 30 phút) tại đầu vào"); }
function addLog(s: WwState, text: string) { s.log.unshift({ t: s.t, text }); if (s.log.length > 80) s.log.length = 80; }

const fpH = (ph: number) => (ph >= 6.8 && ph <= 8 ? 1 : ph < 6.8 ? clamp((ph - 6) / 0.8, 0, 1) : clamp((9.5 - ph) / 1.5, 0, 1));

/** Một bước thời gian dt (giờ mô phỏng, ≤ 0,02). */
export function stepWw(s: WwState, dt: number) {
  const stages = STAGES[s.mode], ctl = s.ctl, retro = s.mode === "retro";
  s.t += dt;
  if (s.tracerUntil && s.t > s.tracerUntil) { s.inf.tracer = 0; s.tracerUntil = undefined; }
  const diur = ctl.diurnal ? 1 + 0.45 * Math.sin(((s.t % 24) - 8) / 24 * 2 * Math.PI) : 1;
  s.qIn = Q_DESIGN * INFLUENT[s.infKey].qMul * diur;
  let qIn = s.qIn, cIn: Conc = s.inf; const qIn0 = s.qIn;
  // vòng điều khiển PID (đo ở bước trước)
  const iAer = stages.findIndex(x => x.kind === "aer"), iCoag = stages.findIndex(x => x.kind === "coag");
  const runLoop = (L: Loop, pv: number, lo: number, hi: number) => { const e = L.sp - pv; if (L.mode === "AUTO") L.out = clamp(L.out + L.kp * ((e - L.prev) + (e * dt) / L.ti), lo, hi); else L.out = clamp(L.out, lo, hi); L.prev = e; };
  runLoop(ctl.doLoop, s.tanks[iAer].c.do, 0.15, 1); runLoop(ctl.phLoop, s.tanks[iCoag].c.ph, -1, 1);
  const blowerRun = (ctl.blowerA && !ctl.blowerFail) || ctl.blowerB;   // máy A hỏng thì chạy máy dự phòng B
  const air = blowerRun ? ctl.doLoop.out : 0;
  const alarms: string[] = [];
  for (let i = 0; i < stages.length; i++) {
    const st = stages[i], T = s.tanks[i], Vn = vNom(st);
    // thủy lực
    let qOut = qIn;
    if (st.pumped) {
      const on = !!ctl.wp[st.pump!];
      qOut = on ? clamp(qIn + (T.vol - 0.4 * Vn) / Math.max(0.2, st.hrt), 0, 2.2 * Q_DESIGN) : 0;
      T.vol += (qIn - qOut) * dt;
      if (T.vol > Vn) { s.spill += T.vol - Vn; T.vol = Vn; alarms.push(`${st.id}: mực nước tràn — ${st.pump} ${on ? "quá tải" : "ngừng"}`); }
      if (T.vol < 0) T.vol = 0;
      T.level = T.vol / Vn;
      if (T.level > 0.85) alarms.push(`${st.id}: mực nước cao ${(T.level * 100).toFixed(0)} %`);
    }
    T.q = qOut;
    const V = Math.max(0.3 * Vn, st.pumped ? Math.max(T.vol, 0.15 * Vn) : Vn);
    const tau = V / Math.max(qIn, 0.05); // h
    const c = T.c;
    // hiệu suất
    const e = { cod: 0, bod: 0, tss: 0, nh4: 0, tn: 0, tp: 0, lg: 0 };
    let phTarget = cIn.ph, phTau = Math.min(0.5, tau);
    switch (st.kind) {
      case "oil": e.tss = 0.15; e.cod = 0.05; e.bod = 0.03; break;
      case "sed": e.tss = 0.3; e.cod = 0.1; e.bod = 0.08; e.tp = 0.03; break;
      case "eq": e.bod = 0.03; break;
      case "coag": phTarget = cIn.ph + (ctl.naoh ? 1.5 * ctl.phLoop.out : 0) - (ctl.pac ? 0.4 : 0); phTau = 0.15; break; // châm NaOH/axit hiệu chỉnh tối đa ±1,5 đơn vị pH pH
      case "floc": phTarget = cIn.ph; break;
      case "clar_chem": {
        const dose = ctl.pac ? ctl.pacDose : 0, f = clamp(dose / 50, 0, 1) * (ctl.polymer ? 1 : 0.6) * fpH(cIn.ph);
        e.tss = 0.2 + 0.65 * f; e.cod = 0.1 + 0.35 * f; e.bod = 0.1 + 0.3 * f; e.tp = 0.1 + 0.65 * f; e.tn = 0.05 + 0.05 * f; break;
      }
      case "anox": e.cod = 0.25; e.bod = 0.3; e.tn = (retro ? 0.35 : 0.2) * (cIn.cod / Math.max(cIn.tn, 1) > 1.2 ? 1 : 0.5); break;
      case "mbbr": case "aer": {
        const rateN = (retro ? 0.30 : 0.12) * (st.kind === "mbbr" ? 1.2 : 1), rateB = (retro ? 0.9 : 0.55) * (st.kind === "mbbr" ? 1.2 : 1); // kg/m³·ngày
        const fDO = clamp(c.do / 2, 0, 1), fp = fpH(cIn.ph), tox = c.tss > 400 ? 0.5 : 1;
        const capN = rateN * 1000 / 24 * V * fDO * fp * tox, capB = rateB * 1000 / 24 * V * clamp(c.do / 1, 0, 1) * (0.5 + 0.5 * fp); // g/h
        e.nh4 = clamp(capN / Math.max(qIn * cIn.nh4, 1e-6), 0, 0.97); e.cod = clamp(capB / Math.max(qIn * cIn.cod, 1e-6), 0, 0.7); e.bod = clamp(capB / Math.max(qIn * cIn.bod, 1e-6), 0, 0.92);
        e.tss = -0.02;
        const kLa = 8 * air * (st.kind === "mbbr" ? 0.8 : 1);
        const removedN = (qIn / V) * cIn.nh4 * e.nh4, removedC = (qIn / V) * cIn.cod * e.cod;
        const our = 0.4 * removedC + 4.3 * removedN + 3;
        c.do = clamp(c.do + dt * (kLa * (7.5 - c.do) - our), 0, 8);
        if (c.do < 2) alarms.push(`${st.id}: DO ${c.do.toFixed(1)} mg/L < 2`);
        break;
      }
      case "clar2": e.tss = 0.85; e.cod = 0.15; e.bod = 0.2; e.tp = 0.1; break;
      case "filter": e.tss = 0.55; e.cod = 0.05; break;
      case "disinf": e.lg = ctl.clo ? 3.5 : 0.3; break;
      case "eco": e.nh4 = 0.08; e.tn = 0.08; e.tp = 0.1; e.cod = 0.1; e.bod = 0.1; e.lg = 0.3; break;
    }
    // phương trình khuấy trộn hoàn toàn: dC/dt = (Cin − C)/τ − k·C
    // hiệu suất ổn định e của CSTR: C/Cin = 1/(1+kτ) ⇒ k = e/((1−e)τ)
    const k = (ee: number) => (ee > 0 ? Math.min(ee, 0.9995) / (1 - Math.min(ee, 0.9995)) / Math.max(tau, 1e-3) : 0);
    const mix = (key: keyof Conc, ee = 0) => { c[key] = Math.max(0, c[key] + dt * ((cIn[key] - c[key]) / tau - k(ee) * c[key])); };
    mix("cod", e.cod); mix("bod", e.bod); mix("tss", e.tss); mix("nh4", e.nh4); mix("tn", e.tn); mix("tp", e.tp); mix("tracer", 0);
    c.coli = Math.max(1, c.coli + dt * ((cIn.coli - c.coli) / tau - k(e.lg > 0 ? 1 - Math.pow(10, -e.lg) : 0) * c.coli));
    c.ph = c.ph + dt * (phTarget - c.ph) / Math.max(phTau, 0.02);
    if (st.kind === "aer" || st.kind === "mbbr") c.ph -= 0; // độ kiềm đủ — bỏ qua
    qIn = qOut; cIn = c;
    if (qOut === 0 && i < stages.length - 1) { /* dòng bị chặn: các bể phía sau không nhận nước */ }
  }
  // van xả → sông / hồ sự cố
  const last = s.tanks[s.tanks.length - 1], std = STANDARDS[s.std];
  const ex = exceedances(last.c, std);
  const bad = ex.length > 0;
  // van tự động chỉ dựa vào các thông số có quan trắc tự động tại đầu ra (pH, COD, NH₄⁺, TSS); T-N, T-P, coliform chỉ cảnh báo theo kết quả phân tích
  const autoEx = ex.filter(x => ["pH", "COD", "NH₄⁺", "TSS"].includes(x));
  if (ctl.valveAuto) { if (autoEx.length && ctl.valveOpen) { ctl.valveOpen = false; addLog(s, `Tự động ĐÓNG van xả — vượt: ${autoEx.join(", ")}`); } else if (!autoEx.length && !ctl.valveOpen) { ctl.valveOpen = true; addLog(s, "Tự động MỞ van xả — nước sau xử lý đạt"); } }
  const qOut = last.q;
  if (ctl.valveOpen) {
    s.out = { q: qOut, c: { ...last.c } }; const m = qOut * dt;
    if (bad) { const crit = autoEx.length > 0; if (crit) s.violVol += m; } s.discharged += m; s.load.cod += m * last.c.cod / 1000; s.load.nh4 += m * last.c.nh4 / 1000; s.load.tn += m * last.c.tn / 1000; s.load.tp += m * last.c.tp / 1000;
    if (bad) alarms.push(`Đang xả vượt chuẩn: ${ex.join(", ")}`);
  } else {
    s.out = { q: 0, c: { ...last.c } }; s.pond.vol += qOut * dt;
    if (s.pond.vol > s.pond.cap) { s.spill += s.pond.vol - s.pond.cap; s.pond.vol = s.pond.cap; alarms.push("Hồ sự cố đầy"); }
    alarms.push("Van xả đóng — nước chuyển về hồ sự cố");
  }
  s.alarms = alarms;
  if (s.hist.length === 0 || s.t - s.hist[s.hist.length - 1].t >= 0.1) {
    const eq = s.tanks.findIndex((_, i) => stages[i].kind === "eq");
    s.hist.push({ t: s.t, cod: last.c.cod, nh4: last.c.nh4, tss: last.c.tss, ph: last.c.ph, do: s.tanks[iAer].c.do, doSp: ctl.doLoop.sp, doOut: ctl.doLoop.out, phPv: s.tanks[iCoag].c.ph, phSp: ctl.phLoop.sp, phOut: ctl.phLoop.out, lvEq: s.tanks[eq].level, q: qIn0 }); if (s.hist.length > 600) s.hist.shift(); }
}

export function exceedances(c: Conc, std: Standard): string[] {
  const r: string[] = [];
  if (c.cod > std.cod) r.push("COD"); if (c.bod > std.bod) r.push("BOD₅"); if (c.tss > std.tss) r.push("TSS"); if (c.nh4 > std.nh4) r.push("NH₄⁺");
  if (c.tn > std.tn) r.push("T-N"); if (c.tp > std.tp) r.push("T-P"); if (c.coli > std.coli) r.push("Coliform"); if (c.ph < std.ph[0] || c.ph > std.ph[1]) r.push("pH");
  return r;
}

/** Chạy nhanh `hours` giờ mô phỏng (đưa hệ thống tới trạng thái ổn định). */
export function settle(s: WwState, hours: number) { const n = Math.ceil(hours / 0.02); for (let i = 0; i < n; i++) stepWw(s, 0.02); }

/** Pha loãng ở sông Vàm Cỏ Đông (trộn hoàn toàn, bảo toàn khối lượng). Chỉ để minh họa — chuẩn xả áp dụng tại cống xả, không được pha loãng để đạt chuẩn. */
export function mixRiver(effQ_m3h: number, effC: Conc, riverQ_m3s: number, bg: { nh4: number; cod: number; tss: number }) {
  const qe = effQ_m3h / 3600, qr = riverQ_m3s, f = qr / Math.max(qe, 1e-9);
  const mixc = (ce: number, cb: number) => (qe * ce + qr * cb) / (qe + qr);
  return { dilution: (qe + qr) / Math.max(qe, 1e-9), cod: mixc(effC.cod, bg.cod), nh4: mixc(effC.nh4, bg.nh4), tss: mixc(effC.tss, bg.tss), f };
}
