// Lớp "DCS" cho mô phỏng nước thải: mô tả thiết bị/đo lường/vòng điều khiển (dạng JSON, suy ra từ sơ đồ công nghệ HTXLNT sau cải tạo),
// bộ báo động theo phân cấp ưu tiên (ISA-18.2: HH/LL = P1, H/L = P2; ghi nhận, nhật ký), và các bài thử thách xử lý sự cố có chấm điểm.
// LƯU Ý: mã tag (LT-104, AIT-901…) do tôi đề xuất để dựng màn hình — bản vẽ gốc của nhà máy chưa có danh mục thiết bị đo; kỹ sư cần duyệt lại trước khi dùng cho đào tạo chính thức.
import { createWw, settle, setInfluent, STAGES, STANDARDS, type WwState } from "./wwtp.ts";

export interface Instrument { tag: string; desc: string; unit: string; stage: string; dec: number; lim: { LL?: number; L?: number; H?: number; HH?: number } }
export interface LoopDef { id: "doLoop" | "phLoop"; tag: string; desc: string; pvTag: string; outDesc: string; unit: string; spMin: number; spMax: number; outMin: number; outMax: number }

/** "JSON từ P&ID" — thiết bị, đo lường, vòng điều khiển, liên động. */
export const PID_MODEL = {
  plant: "HTXLNT 120 m³/ngày.đêm — sau cải tạo (Global Green, 14/10/2026)", status: "ĐỀ XUẤT — cần kỹ sư duyệt",
  equipment: [
    { id: "WP01", type: "bơm chìm", stage: "B01" }, { id: "WP03", type: "bơm chìm", stage: "B03" }, { id: "WP04", type: "bơm chìm", stage: "B04" }, { id: "WP11", type: "bơm", stage: "B11" },
    { id: "AB-A", type: "máy thổi khí A (biến tần)", stage: "B09" }, { id: "AB-B", type: "máy thổi khí B (dự phòng)", stage: "B09" },
    { id: "DP-PAC", type: "bơm định lượng PAC", stage: "B05A" }, { id: "DP-NaOH", type: "bơm định lượng NaOH/axit", stage: "B05A" }, { id: "DP-CL", type: "bơm định lượng clorine", stage: "B12" },
    { id: "XV-701", type: "van xả ra sông / hồ sự cố", stage: "B13" },
  ],
  loops: [{ id: "doLoop", tag: "AIC-901", pv: "AIT-901", out: "SC-901 (biến tần máy thổi khí)" }, { id: "phLoop", tag: "AIC-501", pv: "AIT-501", out: "DP-NaOH" }],
  interlocks: ["Bơm WP04 dừng → B04 dâng mực → tràn (cảnh báo LT-104 H/HH)", "Máy thổi khí A hỏng → khởi động máy B thủ công", "Nước ra vượt pH/COD/NH₄⁺/TSS → van XV-701 đóng, nước về hồ sự cố (khi bật tự động)"],
} as const;

export const INSTRUMENTS: Instrument[] = [
  { tag: "LT-101", desc: "Mực nước hố bơm B01", unit: "%", stage: "B01", dec: 0, lim: { H: 85, HH: 95 } },
  { tag: "LT-104", desc: "Mực nước bể điều hòa B04", unit: "%", stage: "B04", dec: 0, lim: { H: 85, HH: 95 } },
  { tag: "LT-111", desc: "Mực nước bể trung gian B11", unit: "%", stage: "B11", dec: 0, lim: { H: 85, HH: 95 } },
  { tag: "AIT-501", desc: "pH bể keo tụ B05A", unit: "", stage: "B05A", dec: 2, lim: { LL: 5.5, L: 6.5, H: 8.5, HH: 9.5 } },
  { tag: "AIT-901", desc: "DO bể hiếu khí B09", unit: "mg/L", stage: "B09", dec: 1, lim: { LL: 1, L: 2, H: 6 } },
  { tag: "AIT-1301", desc: "pH nước ra", unit: "", stage: "B13", dec: 2, lim: { LL: 5, L: 6, H: 9, HH: 10 } },
  { tag: "AIT-1302", desc: "COD nước ra", unit: "mg/L", stage: "B13", dec: 0, lim: {} },
  { tag: "AIT-1303", desc: "NH₄⁺-N nước ra", unit: "mg/L", stage: "B13", dec: 1, lim: {} },
  { tag: "AIT-1304", desc: "TSS nước ra", unit: "mg/L", stage: "B13", dec: 0, lim: {} },
];
export const LOOPS: LoopDef[] = [
  { id: "doLoop", tag: "AIC-901", desc: "Điều khiển DO bể hiếu khí", pvTag: "AIT-901", outDesc: "Tốc độ máy thổi khí", unit: "mg/L", spMin: 1, spMax: 6, outMin: 0.15, outMax: 1 },
  { id: "phLoop", tag: "AIC-501", desc: "Điều khiển pH bể keo tụ", pvTag: "AIT-501", outDesc: "Châm NaOH (+) / axit (−)", unit: "", spMin: 6, spMax: 8.5, outMin: -1, outMax: 1 },
];

export function pv(s: WwState, tag: string): number {
  const st = STAGES[s.mode], idx = (id: string) => st.findIndex(x => x.id === id), T = (id: string) => s.tanks[idx(id)];
  switch (tag) {
    case "LT-101": return T("B01").level * 100; case "LT-104": return T("B04").level * 100; case "LT-111": return T("B11").level * 100;
    case "AIT-501": return T("B05A").c.ph; case "AIT-901": return T("B09").c.do; case "AIT-1301": return T("B13").c.ph;
    case "AIT-1302": return T("B13").c.cod; case "AIT-1303": return T("B13").c.nh4; case "AIT-1304": return T("B13").c.tss;
  }
  return NaN;
}
/** Giới hạn động cho thông số nước ra theo quy chuẩn đang chọn. */
export function limits(s: WwState, ins: Instrument) {
  const std = STANDARDS[s.std];
  if (ins.tag === "AIT-1302") return { H: std.cod, HH: std.cod * 1.5 }; if (ins.tag === "AIT-1303") return { H: std.nh4, HH: std.nh4 * 1.5 }; if (ins.tag === "AIT-1304") return { H: std.tss, HH: std.tss * 1.5 };
  return ins.lim;
}

export interface Alarm { id: string; tag: string; desc: string; limit: "LL" | "L" | "H" | "HH"; pri: 1 | 2; value: number; since: number; acked: boolean }
export interface JournalRow { t: number; kind: "ALM" | "RTN" | "ACK" | "OP" | "SYS"; text: string }
export interface DcsRun { active: Record<string, Alarm>; journal: JournalRow[]; challenge: ChallengeRun | null }
export const newRun = (): DcsRun => ({ active: {}, journal: [], challenge: null });
const log = (r: DcsRun, t: number, kind: JournalRow["kind"], text: string) => { r.journal.unshift({ t, kind, text }); if (r.journal.length > 300) r.journal.length = 300; };
export const operator = (r: DcsRun, s: WwState, text: string) => log(r, s.t, "OP", text);
export const ackAll = (r: DcsRun, s: WwState) => { let n = 0; for (const a of Object.values(r.active)) if (!a.acked) { a.acked = true; n++; } if (n) log(r, s.t, "ACK", `Ghi nhận ${n} báo động`); };

/** Cập nhật danh sách báo động đang hoạt động (HH/LL ưu tiên 1, H/L ưu tiên 2; có trễ 0,02 h để tránh báo giả). */
export function updateAlarms(r: DcsRun, s: WwState) {
  const now: Record<string, Omit<Alarm, "since" | "acked">> = {};
  for (const ins of INSTRUMENTS) {
    const v = pv(s, ins.tag), L = limits(s, ins) as any; if (!isFinite(v)) continue;
    const hit = (lim: "LL" | "L" | "H" | "HH") => L[lim] !== undefined && ((lim === "H" || lim === "HH") ? v > L[lim] : v < L[lim]);
    // chỉ giữ mức nặng nhất của mỗi hướng
    for (const [hi, lo] of [["HH", "H"], ["LL", "L"]] as const) { const lim = hit(hi) ? hi : hit(lo) ? lo : null; if (lim) now[`${ins.tag}:${lim}`] = { id: `${ins.tag}:${lim}`, tag: ins.tag, desc: ins.desc, limit: lim, pri: lim === "HH" || lim === "LL" ? 1 : 2, value: v }; }
  }
  if (s.ctl.blowerFail) now["AB-A:FAIL"] = { id: "AB-A:FAIL", tag: "AB-A", desc: "Máy thổi khí A hỏng", limit: "HH", pri: 1, value: 0 };
  for (const [k, on] of Object.entries(s.ctl.wp)) if (!on) now[`${k}:STOP`] = { id: `${k}:STOP`, tag: k, desc: `Bơm ${k} đang dừng`, limit: "H", pri: 2, value: 0 };
  if (!s.ctl.valveOpen) now["XV-701:CLOSED"] = { id: "XV-701:CLOSED", tag: "XV-701", desc: "Van xả đóng — nước về hồ sự cố", limit: "H", pri: 2, value: 0 };
  if (s.spill > 0.05) now["SPILL"] = { id: "SPILL", tag: "SPILL", desc: `Đã tràn ${s.spill.toFixed(1)} m³`, limit: "HH", pri: 1, value: s.spill };
  for (const id of Object.keys(r.active)) if (!now[id]) { log(r, s.t, "RTN", `${r.active[id].tag} ${r.active[id].desc} — trở về bình thường`); delete r.active[id]; }
  for (const [id, a] of Object.entries(now)) {
    if (!r.active[id]) { r.active[id] = { ...a, since: s.t, acked: false }; log(r, s.t, "ALM", `P${a.pri} ${a.tag} ${a.limit} — ${a.desc}${a.value ? ` (${a.value.toFixed(1)})` : ""}`); }
    else { r.active[id].value = a.value; }
  }
}

// ───────── Thử thách ─────────
export interface Challenge { id: string; title: string; brief: string; hint: string; hours: number; setup: (s: WwState) => void; tick?: (s: WwState, t: number) => void; verdict: (s: WwState, t: number) => { state: "run" | "pass" | "fail"; text: string } }
export interface ChallengeRun { id: string; startT: number; state: "run" | "pass" | "fail"; text: string; endT?: number }
const base = (s: WwState) => { s.ctl.valveAuto = false; s.violVol = 0; s.spill = 0; s.discharged = 0; s.pond.vol = 0; s.hist = []; };
export const CHALLENGES: Challenge[] = [
  { id: "ph", title: "1. Sốc pH 12 ở đầu vào", brief: "Sau 1 giờ, nước thải pH 12 đổ về trong 10 giờ rồi trở lại bình thường. Van xả đang ở chế độ THỦ CÔNG. Không để nước ngoài pH 6–9 (QCVN) ra sông, đóng van xả đúng lúc và mở lại khi nước ra đạt.", hint: "Theo dõi AIT-501 (pH bể keo tụ): vòng AIC-501 chỉ hiệu chỉnh tối đa ±1,5 pH nên pH vẫn cao. Đóng XV-701 trước khi nước xấu tới B13, mở lại khi AIT-1301 trở về 6–9.", hours: 72,
    setup: s => { base(s); }, tick: (s, t) => { if (t >= 1 && t < 1.05 && s.infKey !== "phshock") setInfluent(s, "phshock"); if (t >= 11 && s.infKey === "phshock") setInfluent(s, "typical"); },
    verdict: (s, t) => s.violVol >= 0.3 ? { state: "fail", text: `Đã xả ${s.violVol.toFixed(2)} m³ nước vượt chuẩn ra sông.` } : t >= 48 && s.ctl.valveOpen && !(pv(s, "AIT-1301") < 6 || pv(s, "AIT-1301") > 9) ? { state: "pass", text: `Không xả vượt chuẩn; nước ra pH ${pv(s, "AIT-1301").toFixed(1)}, van xả mở.` } : t >= 72 ? { state: "fail", text: "Hết giờ: van xả chưa được mở lại hoặc nước ra chưa đạt." } : { state: "run", text: "Đang xử lý…" } },
  { id: "blower", title: "2. Máy thổi khí A hỏng", brief: "Sau 1 giờ máy thổi khí A hỏng. Khởi động máy dự phòng B và giữ DO bể hiếu khí ≥ 2 mg/L, không xả vượt chuẩn ra sông (van xả thủ công).", hint: "AIT-901 giảm nhanh. Bật máy thổi khí B; vòng AIC-901 ở AUTO sẽ điều chỉnh tốc độ về SP.", hours: 48,
    setup: s => { base(s); }, tick: (s, t) => { if (t >= 1 && !s.ctl.blowerFail) s.ctl.blowerFail = true; },
    verdict: (s, t) => s.violVol >= 1.5 ? { state: "fail", text: `Đã xả ${s.violVol.toFixed(1)} m³ nước vượt chuẩn.` } : t >= 40 && pv(s, "AIT-901") >= 2 && s.ctl.valveOpen && s.violVol < 1.5 ? { state: "pass", text: `DO ${pv(s, "AIT-901").toFixed(1)} mg/L, van xả mở, xả vượt chuẩn ${s.violVol.toFixed(2)} m³.` } : t >= 48 ? { state: "fail", text: "Hết giờ: DO chưa phục hồi hoặc van xả chưa mở lại." } : { state: "run", text: "Đang xử lý…" } },
  { id: "pump", title: "3. Bơm WP04 dừng (bể điều hòa dâng mực)", brief: "Sau 30 phút bơm WP04 dừng. Khôi phục dòng chảy trước khi bể điều hòa B04 tràn.", hint: "LT-104 tăng; chạy lại WP04 (bấm bơm trên sơ đồ hoặc faceplate).", hours: 24,
    setup: s => { base(s); s.ctl.valveAuto = true; }, tick: (s, t) => { if (t >= 0.5 && t < 0.55) s.ctl.wp.WP04 = false; },
    verdict: (s, t) => s.spill >= 0.5 ? { state: "fail", text: `Bể điều hòa đã tràn ${s.spill.toFixed(1)} m³.` } : t >= 20 && s.ctl.wp.WP04 && pv(s, "LT-104") < 85 ? { state: "pass", text: `Không tràn; LT-104 = ${pv(s, "LT-104").toFixed(0)} %.` } : t >= 24 ? { state: "fail", text: "Hết giờ: bơm chưa chạy lại hoặc mực nước còn cao." } : { state: "run", text: "Đang xử lý…" } },
  { id: "pac", title: "4. Bơm định lượng PAC mất mồi", brief: "Sau 30 phút châm PAC ngừng. Phát hiện và khôi phục châm PAC (≈ 50 mg/L, kết quả Jar test) trong vòng 6 giờ.", hint: "Không có báo động riêng — theo dõi chất lượng sau bể lắng hóa lý; bật lại 'Châm PAC' và đặt liều 50 mg/L.", hours: 36,
    setup: s => { base(s); s.ctl.valveAuto = true; }, tick: (s, t) => { if (t >= 0.5 && t < 0.55) s.ctl.pac = false; },
    verdict: (s, t) => t >= 6.5 && !s.ctl.pac ? { state: "fail", text: "Quá 6 giờ vẫn chưa khôi phục châm PAC." } : t >= 30 && s.ctl.pac && s.ctl.pacDose >= 40 && s.ctl.pacDose <= 60 ? { state: "pass", text: `PAC được khôi phục (${s.ctl.pacDose} mg/L).` } : t >= 36 ? { state: "fail", text: "Hết giờ: liều PAC chưa về khoảng 40–60 mg/L." } : { state: "run", text: "Đang xử lý…" } },
];

export function startChallenge(r: DcsRun, c: Challenge): WwState {
  const s = createWw("retro", "typical"); c.setup(s); s.t = 0; r.active = {}; r.journal = []; r.challenge = { id: c.id, startT: 0, state: "run", text: "Đang xử lý…" }; log(r, 0, "SYS", `Bắt đầu thử thách: ${c.title}`); return s;
}
export function tickChallenge(r: DcsRun, s: WwState) {
  const cr = r.challenge; if (!cr || cr.state !== "run") return; const c = CHALLENGES.find(x => x.id === cr.id)!; const t = s.t - cr.startT;
  c.tick?.(s, t); const v = c.verdict(s, t); if (v.state !== "run") { cr.state = v.state; cr.text = v.text; cr.endT = t; log(r, s.t, "SYS", `${v.state === "pass" ? "ĐẠT" : "KHÔNG ĐẠT"} — ${v.text}`); } else cr.text = v.text;
}
export { settle };
