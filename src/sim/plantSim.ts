// Mô phỏng vận hành Nhà máy Phân bón Bình Điền – Long An (dây chuyền NPK tạo hạt 20 tấn/h).
// Phần logic thuần (không phụ thuộc đồ họa): thiết bị, khóa liên động, đại lượng quá trình, sự cố, báo động, bài tập.
// Số liệu tham chiếu: MT-HD04 (nước thải: QCVN 40:2011 cột A × Kq 1,2 × Kf 1,1), MT-HD05/MT-QP.01 (ΔP túi lọc 150–260 mmH₂O,
// NH₃ 40 mg/Nm³ theo QCVN 21:2009, bụi 160 mg/Nm³), GPMT 2986 (hai lò hơi không vận hành đồng thời).

export interface EqDef {
  id: string; name: string; zone: Zone; kw: number; desc: string;
  /** Thiết bị phía hạ lưu phải chạy trước khi khởi động (khóa liên động). */
  requires: string[];
  /** Không được chạy đồng thời. */
  excludes?: string[];
  actions?: { id: string; label: string; hint: string }[];
}
export type Zone = "raw" | "granulation" | "drying" | "air" | "boiler" | "wwtp" | "bagging";

export const ZONES: Record<Zone, string> = {
  raw: "Nguyên liệu, nghiền, trộn", granulation: "Tạo hạt", drying: "Sấy – làm nguội", air: "Xử lý bụi, khí thải",
  boiler: "Lò hơi", wwtp: "Xử lý nước thải", bagging: "Sàng, đóng bao",
};

export const EQUIP: EqDef[] = [
  { id: "BT01", name: "Băng tải cấp liệu", zone: "raw", kw: 7.5, desc: "Cấp urê, DAP, KCl, SA từ phễu vào máy nghiền", requires: ["MN01"] },
  { id: "MN01", name: "Máy nghiền", zone: "raw", kw: 37, desc: "Nghiền nguyên liệu rắn trước khi sàng", requires: ["BT02"] },
  { id: "BT02", name: "Băng tải nguyên liệu", zone: "raw", kw: 5.5, desc: "Chuyển nguyên liệu đã nghiền lên sàng", requires: ["SG01"] },
  { id: "SG01", name: "Sàng rung nguyên liệu", zone: "raw", kw: 11, desc: "Loại cục lớn, tạp chất", requires: ["TR01"] },
  { id: "TR01", name: "Máy trộn", zone: "raw", kw: 30, desc: "Phối trộn N–P–K theo công thức", requires: ["TH01"] },
  { id: "TH01", name: "Thùng tạo hạt", zone: "granulation", kw: 33, desc: "Thùng quay Ø2,2 × 9 m, 9 v/ph, nghiêng 1,5°, 45 HP; Tạo hạt NPK bằng hơi và NH₃; phát sinh NH₃ cần hấp thụ", requires: ["BT03"] },
  { id: "BT03", name: "Gầu tải hạt ướt", zone: "granulation", kw: 15, desc: "Đưa hạt ướt từ thùng tạo hạt lên thùng sấy", requires: ["SY01"] },
  { id: "LD01", name: "Lò đốt sinh khối (cấp nhiệt sấy)", zone: "drying", kw: 22, desc: "Lò đốt sinh khối 2.500.000 kcal/h, buồng đốt 1,0×1,4 m, BSKK hiệu suất 85 %, khí nóng 160–250 °C; củi băm, viên nén, vỏ mắc ca… ≈ 2.400 t/năm (CN-04-02)", requires: ["QT01", "QH01"] },
  { id: "QT01", name: "Quạt thổi khí nóng", zone: "drying", kw: 45, desc: "Quạt thổi đưa toàn bộ khí nóng sau cyclone chùm vào máy sấy (ống Ø1.200 → côn Ø1.000). Lưu lượng, cột áp, công suất: chưa có số liệu (đo bổ sung) — kW là ước tính", requires: ["SY01", "QH01"] },
  { id: "SY01", name: "Thùng sấy (máy sấy khô 1)", zone: "drying", kw: 110, desc: "Thùng quay Ø2,2 × 22 m, 4 v/ph, nghiêng 1,5°; nhiệt độ sấy < 180 °C để hạn chế phân hủy urê; khí ra 70–100 °C", requires: ["LN01", "QH01"] },
  { id: "LN01", name: "Thùng làm nguội", zone: "drying", kw: 75, desc: "Làm nguội hạt trước khi sàng", requires: ["SG02", "QH01"] },
  { id: "SG02", name: "Sàng phân loại hạt", zone: "bagging", kw: 15, desc: "Phân loại hạt đạt cỡ; hạt quá cỡ, mịn hồi lưu", requires: ["BT04"] },
  { id: "BT04", name: "Băng tải sản phẩm", zone: "bagging", kw: 7.5, desc: "Chuyển sản phẩm tới máy đóng bao", requires: ["DB01"] },
  { id: "DB01", name: "Máy đóng bao", zone: "bagging", kw: 18, desc: "Cân, đóng bao 50 kg", requires: [] },
  { id: "CC01", name: "Cyclone chùm (16 ống)", zone: "drying", kw: 0, desc: "Nối tiếp giữa lò đốt và máy sấy: toàn bộ khí nóng đi qua, hiệu suất > 95 %; KHÔNG có ống thải ra môi trường; tro xả qua van xoay về khu chứa than – xỉ (thụ động)", requires: [] },
  { id: "XC01", name: "Cyclone đơn", zone: "air", kw: 0, desc: "Cyclone đơn khô Ø2 × 6 m sau máy sấy, hiệu suất > 95 %; bụi thu hồi hồi lưu về tạo hạt (thụ động)", requires: [] },
  { id: "LB01", name: "Lọc bụi túi vải", zone: "air", kw: 7.5, desc: "432 túi Ø130 × 3.360 mm, 556 m², 48 van solenoid; hiệu suất ≥ 99 %; ΔP làm việc 150–260 mmH₂O (MT-QP.01)", requires: [],
    actions: [{ id: "pulse", label: "Rũ bụi (xung khí nén)", hint: "Giảm ΔP khi vượt 260 mmH₂O" }, { id: "replace", label: "Thay túi lọc thủng", hint: "Khắc phục bụi vượt chuẩn do thủng túi" }] },
  { id: "QH01", name: "Quạt hút", zone: "air", kw: 116, desc: "Q = 55.000 m³/h, P = 350 mmH₂O, 155 HP; tạo áp âm cho hệ lò sấy – cyclone – lọc bụi – tháp hấp thụ", requires: ["LB01", "HT01"] },
  { id: "HT01", name: "Tháp hấp thụ NH₃", zone: "air", kw: 22, desc: "Hấp thụ NH₃ bằng dung dịch H₂SO₄; bơm tuần hoàn phải chạy trước quạt hút. Theo BOQ (dự án): tháp ngược dòng Ø3,5 × H10 m, bơm tuần hoàn 150 m³/h, pH 4–5, tỷ trọng dịch SA 28–35 %, cảnh báo ngập tháp ΔP > 120 mmH₂O", requires: [],
    actions: [{ id: "recharge", label: "Thay dung dịch hấp thụ", hint: "Khôi phục hiệu suất khi dung dịch cạn" }] },
  { id: "LH01", name: "Lò hơi sinh khối 6 t/h", zone: "boiler", kw: 45, desc: "Lò tầng sôi 14 bar; chạy ngày thường (T2–T6)", requires: [], excludes: ["LH02"] },
  { id: "LH02", name: "Lò hơi than 8 t/h", zone: "boiler", kw: 55, desc: "Lò hiện hữu, chạy luân phiên cuối tuần; xử lý ướt + hấp thụ kiềm", requires: [], excludes: ["LH01"] },
  { id: "BM01", name: "Bơm nước thải", zone: "wwtp", kw: 11, desc: "Bơm từ hố thu về bể điều hòa; ≈ 90 m³/ngày", requires: [] },
  { id: "TK01", name: "Máy thổi khí Aerotank", zone: "wwtp", kw: 30, desc: "Cấp khí cho bể hiếu khí; DO thiết kế 2–6 mg/L", requires: [],
    actions: [{ id: "swap", label: "Chuyển sang máy thổi khí dự phòng", hint: "Khắc phục khi máy thổi khí hỏng" }] },
  { id: "DL01", name: "Bơm định lượng hóa chất", zone: "wwtp", kw: 1.5, desc: "Châm PAC, polymer, chỉnh pH", requires: ["BM01"],
    actions: [{ id: "prime", label: "Mồi lại bơm định lượng", hint: "Khắc phục khi bơm mất mồi" }] },
];
export const EQ: Record<string, EqDef> = Object.fromEntries(EQUIP.map(e => [e.id, e]));
/** Dây chuyền chính từ đầu đến cuối (thứ tự dòng vật liệu). */
/** Thiết bị thụ động (không có động cơ, luôn ở trạng thái sẵn sàng). */
export const PASSIVE = ["CC01", "XC01"];
export const CHAIN = ["BT01", "MN01", "BT02", "SG01", "TR01", "TH01", "BT03", "SY01", "LN01", "SG02", "BT04", "DB01"];
/** Thứ tự khởi động chuẩn: tháp hấp thụ → lọc bụi → quạt hút → từ cuối dây chuyền ngược lên đầu. */
export const START_ORDER = ["HT01", "LB01", "QH01", "DB01", "BT04", "SG02", "LN01", "SY01", "QT01", "LD01", "BT03", "TH01", "TR01", "SG01", "BT02", "MN01", "BT01"];
/** Thứ tự dừng chuẩn: từ đầu dây chuyền; tắt lò đốt rồi chờ thùng sấy nguội dưới 60 °C. */
export const STOP_ORDER = ["BT01", "MN01", "BT02", "SG01", "TR01", "TH01", "BT03", "LD01", "QT01", "SY01", "LN01", "SG02", "BT04", "DB01", "QH01", "LB01", "HT01"];

export const LIMITS = { dp: 260, dpTrip: 300, tsp: 160, nh3: 40, dryerOut: 110, dryerOutTrip: 150, dryerIn: 350, DOmin: 2, pHmin: 6, pHmax: 9, cod: 99, nh4: 6.6 };

export interface EqState { on: boolean; load: number; tripped: boolean; reason: string }
export interface Faults { bagBlind: boolean; bagTear: boolean; scrubWeak: boolean; blowerFail: boolean; dosingFail: boolean }
export interface PV {
  dryerIn: number; dryerOut: number; dust: number; dp: number; tsp: number; nh3: number; steam: number;
  DO: number; pH: number; cod: number; nh4: number; discharge: boolean; kw: number; tph: number; dpHigh: number; okFor: number; kwh: number;
}
export interface Alarm { id: string; level: "warn" | "crit"; text: string; since: number }
export interface LogEntry { ts: number; text: string; kind: "op" | "alarm" | "clear" | "info" | "trip" }
export interface Ev { t: number; kind: "start" | "stop" | "trip" | "action" | "ack" | "blocked" | "fault" | "bypass"; id: string; cause?: string; info?: Record<string, number> }
export interface Seq { mode: "start" | "stop"; list: string[]; i: number; nextAt: number }
/** Vòng điều khiển PID dạng vận tốc (đơn vị thời gian: giây mô phỏng). */
export interface PLoop { mode: "AUTO" | "MAN"; sp: number; out: number; kp: number; ti: number; prev: number }
export interface SimState {
  /** TIC-301: nhiệt độ ra thùng sấy → tốc độ cấp nhiên liệu/gió lò đốt (OUT 0,2–1). PDIC-501: ΔP túi lọc → rũ bụi theo yêu cầu (AUTO) hoặc thủ công. */
  loops: { tic: PLoop; pdic: PLoop }; pulseOn: boolean;
  t: number; eq: Record<string, EqState>; pv: PV; faults: Faults; bypass: boolean;
  alarms: Alarm[]; acked: Record<string, boolean>; log: LogEntry[]; events: Ev[]; seq: Seq | null; mistakes: number;
}

const AMBIENT = 32;
const nowMs = () => Date.now();

export function createSim(): SimState {
  const eq: Record<string, EqState> = {};
  for (const e of EQUIP) eq[e.id] = { on: false, load: 0, tripped: false, reason: "" };
  for (const id of PASSIVE) { eq[id].on = true; eq[id].load = 1; }
  // HTXLNT chạy liên tục 24/7, không dừng theo dây chuyền sản xuất
  for (const id of ["BM01", "TK01", "DL01"]) { eq[id].on = true; eq[id].load = 1; }
  return {
    t: 0, loops: { tic: { mode: "AUTO", sp: 85, out: 0.7, kp: 0.012, ti: 60, prev: 0 }, pdic: { mode: "AUTO", sp: 200, out: 0, kp: 0, ti: 0, prev: 0 } }, pulseOn: false, eq, bypass: false, alarms: [], acked: {}, log: [], events: [], seq: null, mistakes: 0,
    faults: { bagBlind: false, bagTear: false, scrubWeak: false, blowerFail: false, dosingFail: false },
    pv: { dryerIn: AMBIENT, dryerOut: AMBIENT, dust: 0.3, dp: 0, tsp: 0, nh3: 0, steam: 0, DO: 3.2, pH: 7.3, cod: 45, nh4: 3, discharge: true, kw: 0, tph: 0, dpHigh: 0, okFor: 99, kwh: 0 },
  };
}

function addLog(s: SimState, text: string, kind: LogEntry["kind"]) { s.log.unshift({ ts: nowMs(), text, kind }); if (s.log.length > 200) s.log.length = 200; }
function addEv(s: SimState, e: Omit<Ev, "t">) { s.events.push({ t: s.t, ...e }); }

export interface StartResult { ok: boolean; reason?: string; missing?: string[] }

/** Điều kiện khởi động: mọi thiết bị `requires` phải đang chạy; không được chạy đồng thời với thiết bị `excludes`. */
export function canStart(s: SimState, id: string): StartResult {
  const d = EQ[id];
  if (s.eq[id].on) return { ok: false, reason: "Đã chạy" };
  const ex = (d.excludes || []).find(x => s.eq[x].on);
  if (ex) return { ok: false, reason: `Không vận hành đồng thời với ${EQ[ex].name} (cam kết GPMT: hai lò hơi không chạy cùng lúc)`, missing: [ex] };
  if (!s.bypass) {
    const missing = d.requires.filter(r => !s.eq[r].on);
    if (missing.length) return { ok: false, reason: `Khóa liên động: cần chạy ${missing.map(m => `${m} ${EQ[m].name}`).join(", ")} trước`, missing };
  }
  return { ok: true };
}

export function start(s: SimState, id: string, by: "operator" | "auto" = "operator"): StartResult {
  const r = canStart(s, id);
  if (!r.ok) {
    if (r.reason !== "Đã chạy") { addLog(s, `${id}: không khởi động được — ${r.reason}`, "alarm"); addEv(s, { kind: "blocked", id }); if (by === "operator") s.mistakes++; }
    return r;
  }
  const e = s.eq[id]; e.on = true; e.tripped = false; e.reason = "";
  if (s.bypass && EQ[id].requires.some(q => !s.eq[q].on)) addLog(s, `${id}: khởi động khi đã bỏ khóa liên động (thiếu ${EQ[id].requires.filter(q => !s.eq[q].on).join(", ")})`, "alarm");
  addLog(s, `${id} ${EQ[id].name}: đã khởi động`, "op"); addEv(s, { kind: "start", id });
  return r;
}

export function stop(s: SimState, id: string, cause: "operator" | "interlock" | "fault" = "operator", reason = ""): void {
  const e = s.eq[id]; if (!e.on) return;
  e.on = false;
  if (cause === "operator") {
    addLog(s, `${id} ${EQ[id].name}: đã dừng`, "op");
    addEv(s, { kind: "stop", id, info: { dryerOut: s.pv.dryerOut } });
  } else {
    e.tripped = true; e.reason = reason || "Dừng liên động";
    addLog(s, `${id} ${EQ[id].name}: DỪNG LIÊN ĐỘNG — ${e.reason}`, "trip"); addEv(s, { kind: "trip", id, cause });
  }
}

export function emergencyStop(s: SimState) {
  s.seq = null;
  for (const e of EQUIP) if (s.eq[e.id].on && !PASSIVE.includes(e.id) && e.zone !== "wwtp") { s.eq[e.id].on = false; s.eq[e.id].tripped = true; s.eq[e.id].reason = "Dừng khẩn cấp"; }
  addLog(s, "DỪNG KHẨN CẤP khu sản xuất (HTXLNT vẫn chạy)", "trip"); addEv(s, { kind: "stop", id: "ESTOP" });
}

export function action(s: SimState, id: string, act: string) {
  const f = s.faults;
  if (id === "LB01" && act === "pulse") { s.pv.dust = Math.max(0.1, s.pv.dust - 0.55); f.bagBlind = false; addLog(s, "LB01: rũ bụi xung khí nén", "op"); }
  else if (id === "LB01" && act === "replace") { f.bagTear = false; addLog(s, "LB01: đã thay túi lọc thủng", "op"); }
  else if (id === "HT01" && act === "recharge") { f.scrubWeak = false; addLog(s, "HT01: đã thay dung dịch hấp thụ H₂SO₄", "op"); }
  else if (id === "TK01" && act === "swap") { f.blowerFail = false; s.eq.TK01.tripped = false; addLog(s, "TK01: chuyển sang máy thổi khí dự phòng", "op"); }
  else if (id === "DL01" && act === "prime") { f.dosingFail = false; addLog(s, "DL01: mồi lại bơm định lượng", "op"); }
  addEv(s, { kind: "action", id: `${id}:${act}` });
}

export function ack(s: SimState) {
  for (const a of s.alarms) s.acked[a.id] = true;
  addLog(s, "Đã ghi nhận báo động", "op"); addEv(s, { kind: "ack", id: "ALL" });
}

export const FAULT_LABELS: Record<keyof Faults, string> = {
  bagBlind: "Bết túi lọc (ΔP tăng nhanh)", bagTear: "Thủng túi lọc (bụi vượt chuẩn)", scrubWeak: "Dung dịch hấp thụ NH₃ cạn",
  blowerFail: "Hỏng máy thổi khí Aerotank", dosingFail: "Bơm định lượng mất mồi",
};
export function injectFault(s: SimState, f: keyof Faults) {
  s.faults[f] = true; addLog(s, `Sự cố giả lập: ${FAULT_LABELS[f]}`, "alarm"); addEv(s, { kind: "fault", id: f });
  if (f === "bagBlind") s.pv.dust = Math.max(s.pv.dust, 0.78);
  if (f === "blowerFail") { s.eq.TK01.on = false; s.eq.TK01.tripped = true; s.eq.TK01.reason = "Hỏng máy thổi khí"; }
}

/** Điều kiện ổn định: toàn bộ dây chuyền, xử lý khí và lò hơi sinh khối đang chạy bình thường. */
export function presetRunning(s: SimState) {
  const run = [...START_ORDER, "LH01", "BM01", "TK01", "DL01"];
  for (const id of run) { s.eq[id].on = true; s.eq[id].load = 1; s.eq[id].tripped = false; }
  Object.assign(s.pv, { dryerIn: 280, dryerOut: 85, dust: 0.3, dp: 175, tsp: 14, nh3: 7.5, steam: 14, DO: 3.2, pH: 7.3, cod: 45, nh4: 3, discharge: true, okFor: 99 });
  s.faults = { bagBlind: false, bagTear: false, scrubWeak: false, blowerFail: false, dosingFail: false };
  s.alarms = []; s.acked = {}; s.seq = null;
}

export function runSequence(s: SimState, mode: "start" | "stop") {
  s.seq = { mode, list: mode === "start" ? START_ORDER.filter(id => !s.eq[id].on) : STOP_ORDER.filter(id => s.eq[id].on), i: 0, nextAt: s.t + 1 };
  addLog(s, mode === "start" ? "Khởi động tự động theo trình tự chuẩn" : "Dừng tự động theo trình tự chuẩn", "info");
}

/** Gợi ý thao tác tiếp theo khi khởi động dây chuyền. */
export function nextHint(s: SimState): { id: string; text: string } | null {
  for (const id of START_ORDER) if (!s.eq[id].on && canStart(s, id).ok) return { id, text: `Khởi động ${id} ${EQ[id].name}` };
  return null;
}

const lag = (cur: number, target: number, rate: number, dt: number) => cur + (target - cur) * Math.min(1, rate * dt);

export function step(s: SimState, dt: number): void {
  if (dt <= 0) return;
  s.t += dt;
  const e = s.eq, pv = s.pv, f = s.faults;

  // Trình tự tự động
  if (s.seq && s.t >= s.seq.nextAt) {
    const q = s.seq;
    if (q.i >= q.list.length) { addLog(s, q.mode === "start" ? "Hoàn tất khởi động tự động" : "Hoàn tất dừng tự động", "info"); s.seq = null; }
    else {
      const id = q.list[q.i];
      if (q.mode === "stop" && id === "SY01" && pv.dryerOut > 60) { /* chờ thùng sấy nguội dưới 60 °C */ q.nextAt = s.t + 1; }
      else { if (q.mode === "start") start(s, id, "auto"); else stop(s, id, "operator"); q.i++; q.nextAt = s.t + 2; }
    }
  }

  // Khóa liên động: thiết bị mất điều kiện thì dừng
  if (!s.bypass) {
    for (let pass = 0; pass < 40; pass++) {
      let changed = false;
      for (const d of EQUIP) if (e[d.id].on) { const m = d.requires.find(r => !e[r].on); if (m) { stop(s, d.id, "interlock", `Mất ${m} ${EQ[m].name}`); changed = true; } }
      if (!changed) break;
    }
  }

  // Tải thiết bị (khởi động/dừng êm)
  for (const d of EQUIP) { if (PASSIVE.includes(d.id)) continue; const x = e[d.id]; x.load = lag(x.load, x.on ? 1 : 0, 0.5, dt); if (x.load < 0.002) x.load = 0; }

  // Nhiệt độ sấy
  const burner = e.LD01.load, dryer = e.SY01.load, hot = burner > 0.2;
  const feeding = e.TH01.on && e.BT03.on;
  // TIC-301 (PID): giữ nhiệt độ ra thùng sấy theo SP bằng tốc độ cấp nhiên liệu của lò đốt
  { const L = s.loops.tic, er = L.sp - pv.dryerOut; if (L.mode === "AUTO" && hot) L.out = Math.min(1, Math.max(0.2, L.out + L.kp * ((er - L.prev) + (er * dt) / L.ti))); L.prev = er; L.out = Math.min(1, Math.max(0.2, L.out)); }
  const fire = s.loops.tic.out;
  const inT = hot ? (dryer > 0.2 ? AMBIENT + (120 + 230 * fire - AMBIENT) : 300 + 300 * fire) : AMBIENT;
  const outT = hot && dryer > 0.2 ? AMBIENT + (inT - AMBIENT) * (feeding ? 0.213 : 0.434) : AMBIENT;
  pv.dryerIn = lag(pv.dryerIn, inT, 0.03, dt);
  pv.dryerOut = lag(pv.dryerOut, outT, 0.02, dt);

  // Lọc bụi túi vải: ΔP theo lượng bụi bám
  const fanOn = e.QH01.load > 0.1;
  const accumulate = e.SY01.on && fanOn ? 0.0012 * (f.bagBlind ? 14 : 1) : 0;
  // PDIC-501: rũ bụi theo yêu cầu — AUTO: xung khí nén khi ΔP vượt SP (trễ 10 mmH₂O); MAN: không tự rũ
  { const L = s.loops.pdic; if (L.mode === "AUTO") { if (pv.dp > L.sp) s.pulseOn = true; else if (pv.dp < L.sp - 10) s.pulseOn = false; } else s.pulseOn = false; if (!e.LB01.on) s.pulseOn = false; }
  const clean = e.LB01.on ? 0.0012 + (s.pulseOn ? 0.02 * (f.bagBlind ? 0.05 : 1) : 0)  /* bết túi: xung tự động không đủ, phải rũ/thay thủ công */ : 0;
  pv.dust = Math.min(1.6, Math.max(0.05, pv.dust + (accumulate - clean) * dt));
  pv.dp = lag(pv.dp, fanOn ? e.QH01.load * (130 + 150 * pv.dust) : 0, 0.3, dt);
  if (pv.dp > LIMITS.dpTrip && e.LB01.on) { pv.dpHigh += dt; if (pv.dpHigh > 30) { stop(s, "LB01", "fault", `ΔP ${pv.dp.toFixed(0)} mmH₂O > ${LIMITS.dpTrip}`); pv.dpHigh = 0; } } else pv.dpHigh = Math.max(0, pv.dpHigh - dt);

  // Phát thải ống khói sấy (mg/Nm³)
  const tspT = fanOn ? 14 + Math.max(0, pv.dp - LIMITS.dp) * 0.8 + (f.bagTear ? 260 : 0) : 0;
  pv.tsp = lag(pv.tsp, tspT, 0.3, dt);
  const eff = e.HT01.load > 0.5 ? (f.scrubWeak ? 0.3 : 0.97) : 0;
  const nh3T = fanOn && e.TH01.on ? 250 * (1 - eff) : 0;
  pv.nh3 = lag(pv.nh3, nh3T, 0.3, dt);

  // Lò hơi
  const boiler = Math.max(e.LH01.load, e.LH02.load);
  pv.steam = lag(pv.steam, boiler > 0.2 ? 14 : 0, 0.01, dt);

  // Xử lý nước thải
  const aer = e.TK01.on && !f.blowerFail;
  pv.DO = lag(pv.DO, aer ? 3.2 : 0.4, 0.012, dt);
  pv.pH = lag(pv.pH, e.DL01.on && !f.dosingFail ? 7.3 : 8.9, 0.005, dt);
  if (e.BM01.on) {
    pv.cod = lag(pv.cod, pv.DO >= LIMITS.DOmin ? 45 : 140, 0.008, dt);
    pv.nh4 = lag(pv.nh4, pv.DO >= LIMITS.DOmin ? 3 : 14, 0.008, dt);
  }
  const ok = pv.cod <= LIMITS.cod && pv.nh4 <= LIMITS.nh4 && pv.pH >= LIMITS.pHmin && pv.pH <= LIMITS.pHmax;
  if (!ok) { if (pv.discharge) { pv.discharge = false; addLog(s, "Van xả ra sông tự đóng: nước thải không đạt QCVN 40 cột A (MT-HD04 mục 6.2)", "alarm"); } pv.okFor = 0; }
  else { pv.okFor += dt; if (!pv.discharge && pv.okFor > 20) { pv.discharge = true; addLog(s, "Nước thải đạt chuẩn — mở lại van xả", "info"); } }

  // Năng lượng, sản lượng
  let kw = 0; for (const d of EQUIP) kw += d.kw * e[d.id].load;
  pv.kw = kw; pv.kwh += kw * dt / 3600;
  pv.tph = 20 * Math.min(...CHAIN.map(id => e[id].load));

  // Báo động
  const A: Alarm[] = [];
  const add = (id: string, level: Alarm["level"], text: string) => A.push({ id, level, text, since: s.t });
  if (pv.dp > LIMITS.dpTrip) add("dp", "crit", `ΔP túi lọc ${pv.dp.toFixed(0)} mmH₂O vượt ${LIMITS.dpTrip} — sắp dừng liên động`);
  else if (pv.dp > LIMITS.dp) add("dp", "warn", `ΔP túi lọc ${pv.dp.toFixed(0)} mmH₂O vượt ${LIMITS.dp} (MT-QP.01)`);
  if (pv.tsp > LIMITS.tsp) add("tsp", "crit", `Bụi ống khói ${pv.tsp.toFixed(0)} mg/Nm³ vượt ${LIMITS.tsp}`);
  if (pv.nh3 > LIMITS.nh3) add("nh3", "crit", `NH₃ ống khói ${pv.nh3.toFixed(0)} mg/Nm³ vượt ${LIMITS.nh3} (QCVN 21:2009)`);
  if (pv.dryerOut > LIMITS.dryerOutTrip && e.LD01.on) { add("dryout", "crit", `Nhiệt độ ra thùng sấy ${pv.dryerOut.toFixed(0)} °C — dừng lò đốt`); }
  else if (pv.dryerOut > LIMITS.dryerOut && e.LD01.on) add("dryout", "warn", `Nhiệt độ ra thùng sấy ${pv.dryerOut.toFixed(0)} °C cao hơn 110 (không có vật liệu?)`);
  if (pv.dryerIn > LIMITS.dryerIn) add("dryin", "crit", `Quá nhiệt buồng đốt ${pv.dryerIn.toFixed(0)} °C — thùng sấy không quay`);
  if (e.BM01.on && pv.DO < LIMITS.DOmin) add("do", "warn", `DO Aerotank ${pv.DO.toFixed(1)} mg/L < ${LIMITS.DOmin}`);
  if (pv.pH < LIMITS.pHmin || pv.pH > LIMITS.pHmax) add("ph", "warn", `pH nước thải ${pv.pH.toFixed(1)} ngoài dải ${LIMITS.pHmin}–${LIMITS.pHmax}`);
  if (pv.cod > LIMITS.cod) add("cod", "crit", `COD đầu ra ${pv.cod.toFixed(0)} mg/L vượt ${LIMITS.cod}`);
  if (pv.nh4 > LIMITS.nh4) add("nh4", "crit", `NH₄⁺ đầu ra ${pv.nh4.toFixed(1)} mg/L vượt ${LIMITS.nh4}`);
  if (e.BM01.on && !pv.discharge) add("disc", "warn", "Van xả ra sông đang đóng (nước thải chưa đạt)");
  if (e.SY01.on && !fanOn) add("fug", "warn", "Quạt hút không chạy — bụi, NH₃ thoát ra nhà xưởng");
  for (const d of EQUIP) if (e[d.id].tripped) add(`trip-${d.id}`, "crit", `${d.id} ${d.name}: ${e[d.id].reason}`);
  if (s.bypass) add("bypass", "warn", "Đang bỏ khóa liên động (chỉ để thử nghiệm)");
  const prev = new Set(s.alarms.map(a => a.id));
  for (const a of A) if (!prev.has(a.id)) { addLog(s, `BÁO ĐỘNG: ${a.text}`, "alarm"); delete s.acked[a.id]; }
  for (const a of s.alarms) if (!A.find(x => x.id === a.id)) addLog(s, `Hết báo động: ${a.text}`, "clear");
  s.alarms = A.map(a => ({ ...a, since: s.alarms.find(x => x.id === a.id)?.since ?? s.t }));
}

// ─── Bài tập đào tạo ─────────────────────────────────────────────────────────

export interface ExStep { text: string; done: (s: SimState, ev: Ev[]) => boolean }
export interface Exercise { id: string; title: string; goal: string; setup: (s: SimState) => void; steps: ExStep[]; failIf?: (s: SimState, ev: Ev[]) => string | null }

const running = (id: string) => (s: SimState) => s.eq[id].on;
const stopped = (id: string, maxOut?: number) => (s: SimState, ev: Ev[]) => {
  const e = ev.find(x => x.kind === "stop" && x.id === id);
  if (!e) return false;
  return maxOut == null || (e.info?.dryerOut ?? 0) <= maxOut;
};

export const EXERCISES: Exercise[] = [
  {
    id: "ex-start", title: "1. Khởi động dây chuyền tạo hạt NPK",
    goal: "Khởi động đúng thứ tự: tháp hấp thụ → lọc bụi → quạt hút → từ cuối dây chuyền ngược lên đầu. Mỗi lần khởi động sai bị khóa liên động chặn tính 1 lỗi.",
    setup: s => { Object.assign(s, createSim()); },
    steps: [
      ...START_ORDER.map(id => ({ text: `Khởi động ${id} — ${EQ[id].name}`, done: running(id) })),
      { text: "Dây chuyền ổn định: ΔP túi lọc < 260 mmH₂O, nhiệt độ ra thùng sấy 70–100 °C", done: s => s.pv.dp < LIMITS.dp && s.pv.dryerOut > 70 && s.pv.dryerOut < 100 },
    ],
  },
  {
    id: "ex-stop", title: "2. Dừng dây chuyền đúng thứ tự",
    goal: "Dừng từ đầu dây chuyền, tắt lò đốt trước, chờ thùng sấy nguội dưới 60 °C mới dừng thùng sấy, cuối cùng dừng quạt hút, lọc bụi, tháp hấp thụ. Dừng liên động tính lỗi.",
    setup: s => { Object.assign(s, createSim()); presetRunning(s); },
    steps: STOP_ORDER.map(id => ({ text: `Dừng ${id} — ${EQ[id].name}${id === "SY01" ? " (khi nhiệt độ ra < 60 °C)" : ""}`, done: stopped(id, id === "SY01" ? 60 : undefined) })),
    failIf: (s, ev) => { const t = ev.find(x => x.kind === "trip"); return t ? `Dừng sai thứ tự: ${t.id} bị dừng liên động` : null; },
  },
  {
    id: "ex-dp", title: "3. Xử lý ΔP túi lọc cao",
    goal: "ΔP túi lọc vượt 260 mmH₂O. Ghi nhận báo động, rũ bụi xung khí nén và xác nhận ΔP trở về dưới 240 mmH₂O trước khi quá 300 (dừng liên động).",
    setup: s => { Object.assign(s, createSim()); presetRunning(s); injectFault(s, "bagBlind"); s.pv.dust = 0.92; s.pv.dp = 270; },
    steps: [
      { text: "Ghi nhận báo động ΔP cao (nút Ghi nhận)", done: (_s, ev) => ev.some(e => e.kind === "ack") },
      { text: "Rũ bụi LB01 (Thông tin thiết bị → Rũ bụi)", done: (_s, ev) => ev.some(e => e.kind === "action" && e.id === "LB01:pulse") },
      { text: "ΔP túi lọc trở về dưới 240 mmH₂O", done: s => s.pv.dp < 240 },
    ],
    failIf: (_s, ev) => ev.some(e => e.kind === "trip" && e.id === "LB01") ? "ΔP vượt 300 mmH₂O quá 30 giây — lọc bụi dừng liên động" : null,
  },
  {
    id: "ex-nh3", title: "4. NH₃ ống khói vượt giới hạn",
    goal: "Dung dịch hấp thụ cạn khiến NH₃ ống khói vượt 40 mg/Nm³. Ghi nhận, giảm tải (dừng cấp liệu BT01), thay dung dịch hấp thụ, xác nhận NH₃ < 40 rồi cấp liệu lại.",
    setup: s => { Object.assign(s, createSim()); presetRunning(s); injectFault(s, "scrubWeak"); s.pv.nh3 = 60; },
    steps: [
      { text: "Ghi nhận báo động NH₃ vượt chuẩn", done: (_s, ev) => ev.some(e => e.kind === "ack") },
      { text: "Dừng cấp liệu BT01 để giảm tải", done: (_s, ev) => ev.some(e => e.kind === "stop" && e.id === "BT01") },
      { text: "Thay dung dịch hấp thụ HT01", done: (_s, ev) => ev.some(e => e.kind === "action" && e.id === "HT01:recharge") },
      { text: "NH₃ ống khói trở về dưới 40 mg/Nm³", done: s => s.pv.nh3 < LIMITS.nh3 },
      { text: "Khởi động lại BT01 sau khi đạt chuẩn", done: (s, ev) => s.eq.BT01.on && ev.some(e => e.kind === "start" && e.id === "BT01") },
    ],
  },
  {
    id: "ex-wwtp", title: "5. HTXLNT: DO thấp, nước thải không đạt",
    goal: "Máy thổi khí hỏng, DO giảm, nước thải vượt chuẩn và van xả tự đóng. Chuyển máy thổi khí dự phòng, khởi động lại, chờ nước thải đạt chuẩn và mở lại van xả (MT-HD04 mục 6.2).",
    setup: s => { Object.assign(s, createSim()); presetRunning(s); injectFault(s, "blowerFail"); s.pv.DO = 1.2; s.pv.cod = 120; s.pv.nh4 = 9; s.pv.discharge = false; },
    steps: [
      { text: "Ghi nhận báo động", done: (_s, ev) => ev.some(e => e.kind === "ack") },
      { text: "Chuyển sang máy thổi khí dự phòng (TK01)", done: (_s, ev) => ev.some(e => e.kind === "action" && e.id === "TK01:swap") },
      { text: "Khởi động TK01", done: s => s.eq.TK01.on },
      { text: "DO Aerotank ≥ 2 mg/L", done: s => s.pv.DO >= LIMITS.DOmin },
      { text: "Nước thải đạt chuẩn, van xả mở lại", done: s => s.pv.discharge },
    ],
  },
];

export interface ExRun { id: string; startedAt: number; startMistakes: number; done: number; finished: boolean; failed: string | null; durationS: number }

export function beginExercise(s: SimState, ex: Exercise): { run: ExRun; sim: SimState } {
  const fresh = createSim(); ex.setup(fresh);
  fresh.events = []; fresh.mistakes = 0; fresh.log = [];
  addLog(fresh, `Bắt đầu bài tập: ${ex.title}`, "info");
  void s;
  return { sim: fresh, run: { id: ex.id, startedAt: fresh.t, startMistakes: 0, done: 0, finished: false, failed: null, durationS: 0 } };
}

export function updateExercise(s: SimState, ex: Exercise, run: ExRun): ExRun {
  if (run.finished || run.failed) return run;
  const r = { ...run };
  const f = ex.failIf?.(s, s.events); if (f) { r.failed = f; r.durationS = s.t - r.startedAt; return r; }
  while (r.done < ex.steps.length && ex.steps[r.done].done(s, s.events)) r.done++;
  if (r.done >= ex.steps.length) { r.finished = true; r.durationS = s.t - r.startedAt; }
  return r;
}
