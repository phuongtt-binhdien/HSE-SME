"use client";
// @ts-nocheck

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { buildModel, maxOnCenterline, sigmas, windExponent, emissionRateFromStack, celsiusToK, STABILITY_LABELS, X_MIN, U_MIN,
  screenWorstCase, screenAtDistance, SCREEN_WINDS, actualFlow, normalFlow, exitVelocity, gepHeight,
  AP42_FACTORS, emissionRateFromFactor, pasquillClass, heatEmissionMW } from "../lib/gaussPlume";
import PlantSim from "../sim/PlantSim.tsx";
import WwtpSim from "../sim/WwtpSim.tsx";
import { AuthProvider, AuthGate, useAuth } from "../auth/AuthContext.tsx";
import { PaidGate } from "../auth/PaidGate.tsx";
import { WalletModule } from "../auth/WalletModule.tsx";
import { InductionModule } from "../auth/InductionModule.tsx";
import { AdminModule } from "../auth/AdminModule.tsx";
import { SESSIONS, TRAINEES } from "../data/training2026";
import { FORMS, PROCEDURES, FORM_CATALOG, F_CATALOG, PENALTY_GAPS, OPEN_ITEMS } from "../data/isoForms";
import { WWTP_RETROFIT, NH3_TOWER_BOQ, FURNACE_COMPARE, LINE2_EQUIPMENT, LINE2_LAYOUT, BOILER_TENDER, PLANT, CONTROLLED_CHEMICALS, DOCUMENTS, LEGAL_BASIS, SAFETY_RULES, DATA_GAPS } from "../data/facility";
import { wideBuildingDownwind, wideBuildingWake, lineSource, canyonLeeward, canyonWindward, ppmToMgM3, psi, PSI_TABLE, giffordHanna, boxModel } from "../lib/lowSources";

// ═══════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Industrial Precision
// ═══════════════════════════════════════════════════════════════
const T = {
  bg:      "#05080f",
  surface: "#090d17",
  card:    "#0d1320",
  card2:   "#111827",
  border:  "#162030",
  border2: "#1d2d40",
  // Accents
  green:  "#00e5a0",
  red:    "#ff3860",
  amber:  "#ffb020",
  blue:   "#3b9eff",
  violet: "#8b5cf6",
  cyan:   "#06d6d0",
  orange: "#ff7043",
  // Text
  text:   "#dde8f5",
  sub:    "#7a9ab8",
  dim:    "#3a5068",
  ghost:  "#1a2535",
};

const G = {
  green:  `linear-gradient(135deg, #00e5a0, #00b37d)`,
  red:    `linear-gradient(135deg, #ff3860, #c0143c)`,
  amber:  `linear-gradient(135deg, #ffb020, #e08800)`,
  blue:   `linear-gradient(135deg, #3b9eff, #1a70d4)`,
  violet: `linear-gradient(135deg, #8b5cf6, #6d28d9)`,
  cyan:   `linear-gradient(135deg, #06d6d0, #0598aa)`,
  orange: `linear-gradient(135deg, #ff7043, #d84315)`,
};

// ═══════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════
const initContractors = [
  { id:"CTR-001", name:"Nguyễn Văn Thành", company:"Cơ điện Minh Quang", phone:"0901234567", zone:"Lò hơi", status:"inside", checkin:"07:32", task:"Bảo trì bơm tuần hoàn", permit:"PTW-2026-041", inducted:true, ppe:["helmet","vest","boots","gloves"], riskLevel:"Cao", expiresAt:"17:00",
    safetyTraining:{ passed:true, date:"10/05/2026", score:92, modules:["PCCC","Hóa chất","Sơ cứu","Làm việc trên cao"], trainer:"Nguyễn V.A", expiry:"10/05/2027" } },
  { id:"CTR-002", name:"Trần Thị Lan", company:"Xây dựng Hoà Bình", phone:"0912345678", zone:"Phân xưởng NPK", status:"inside", checkin:"08:15", task:"Sơn tường kho chứa", permit:"PTW-2026-042", inducted:true, ppe:["helmet","vest","mask"], riskLevel:"Thấp", expiresAt:"16:00",
    safetyTraining:{ passed:true, date:"08/05/2026", score:85, modules:["PCCC","Hóa chất","Dung môi"], trainer:"Lê T.C", expiry:"08/05/2027" } },
  { id:"CTR-003", name:"Lê Quốc Hùng", company:"Điện lạnh Nam Bộ", phone:"0923456789", zone:"Văn phòng", status:"pending", checkin:null, task:"Bảo trì điều hoà", permit:null, inducted:false, ppe:[], riskLevel:"—",
    safetyTraining:{ passed:false, date:null, score:null, modules:[], trainer:null, expiry:null } },
  { id:"CTR-004", name:"Phạm Văn Đức", company:"Vệ sinh KCN Long An", phone:"0934567890", zone:"HTXLNT", status:"outside", checkin:"06:00", task:"Hút bùn bể anoxic", permit:"PTW-2026-040", inducted:true, ppe:["helmet","vest","boots","mask"], riskLevel:"Trung bình",
    safetyTraining:{ passed:true, date:"02/04/2026", score:78, modules:["PCCC","Không gian hạn chế","Sơ cứu"], trainer:"Nguyễn V.A", expiry:"02/04/2027" } },
];

const initPTW = [
  { id:"PTW-2026-041", contractor:"Nguyễn Văn Thành", zone:"Lò hơi", task:"Bảo trì bơm tuần hoàn", risk:"Cao", issued:"07:00", expires:"17:00", status:"active", approver:"Phong Nguyen", hazards:["Điện","Nhiệt độ cao"] },
  { id:"PTW-2026-042", contractor:"Trần Thị Lan", zone:"Phân xưởng NPK", task:"Sơn tường kho", risk:"Thấp", issued:"08:00", expires:"16:00", status:"active", approver:"Phong Nguyen", hazards:["Dung môi","Hóa chất"] },
  { id:"PTW-2026-040", contractor:"Phạm Văn Đức", zone:"HTXLNT", task:"Hút bùn bể anoxic", risk:"Trung bình", issued:"06:00", expires:"12:00", status:"closed", approver:"Lê T.C", hazards:["Không gian hạn chế","Khí độc"] },
];

const initIncidents = [
  { id:"INC-001", time:"09:14", date:"16/05", type:"near_miss", severity:"minor", area:"Kho Hóa chất B", desc:"Nhân viên suýt trượt chân do nước đọng gần bồn NaOH", reporter:"Nguyễn V.A", status:"open", source:"internal" },
  { id:"INC-002", time:"14:30", date:"12/05", type:"violation", severity:"moderate", area:"Phân xưởng NPK", desc:"Nhà thầu không mặc PPE đúng quy định tại khu vực bụi NPK", reporter:"Lê T.C", status:"closed", source:"contractor" },
  { id:"INC-003", time:"11:00", date:"08/05", type:"near_miss", severity:"minor", area:"Lò hơi", desc:"Van áp suất phát tín hiệu cảnh báo — kiểm tra định kỳ chưa đến hạn", reporter:"Trần T.B", status:"closed", source:"internal" },
];

const initChecklists = [
  { id:"CL-001", area:"Kho hóa chất A", date:"16/05", shift:"Sáng", total:12, pass:12, done:true, inspector:"Nguyễn V.A", failItems:[] },
  { id:"CL-002", area:"HTXLNT", date:"16/05", shift:"Sáng", total:15, pass:14, done:true, inspector:"Lê T.C", failItems:["Van xả Aerotank rò rỉ nhỏ"] },
  { id:"CL-003", area:"Phân xưởng NPK", date:"16/05", shift:"Chiều", total:18, pass:0, done:false, inspector:"Trần T.B", failItems:[] },
  { id:"CL-004", area:"Lò hơi", date:"16/05", shift:"Sáng", total:10, pass:10, done:true, inspector:"Phạm V.D", failItems:[] },
];

const ENERGY_DATA = [
  { m:"T1", kwh:142000, water:2850, co2:63.3, npk:1850 },
  { m:"T2", kwh:128000, water:2640, co2:57.1, npk:1680 },
  { m:"T3", kwh:155000, water:2990, co2:69.1, npk:2100 },
  { m:"T4", kwh:149000, water:3100, co2:66.4, npk:2020 },
  { m:"T5", kwh:138000, water:2780, co2:61.5, npk:1900 },
];

const WW_DATA = [
  { m:"T1", cod:42, nh4:3.1, bod5:18 },
  { m:"T2", cod:38, nh4:2.8, bod5:21 },
  { m:"T3", cod:44, nh4:4.2, bod5:15 },
  { m:"T4", cod:35, nh4:3.5, bod5:19 },
  { m:"T5", cod:49, nh4:4.8, bod5:22 },
];

const WASTE_DATA = [
  { m:"T1", ctnh:0.85, cn:12.1, sh:4.2 },
  { m:"T2", ctnh:0.62, cn:10.5, sh:3.8 },
  { m:"T3", ctnh:1.10, cn:13.2, sh:4.5 },
  { m:"T4", ctnh:0.78, cn:11.8, sh:4.1 },
  { m:"T5", ctnh:0.91, cn:10.9, sh:3.9 },
];

const CL_ITEMS = [
  "Biển cảnh báo nguy hiểm đầy đủ, rõ ràng","Lối thoát hiểm không bị chặn",
  "Thiết bị chữa cháy trong hạn sử dụng","Vòi xả khẩn cấp hoạt động tốt",
  "Hóa chất dán nhãn GHS đúng quy định","Bao bì không rò rỉ, hở",
  "MSDS có sẵn tại khu vực","Khu vực thông thoáng, không mùi bất thường",
  "PPE sẵn sàng tại lối vào","Sàn không có hóa chất đổ, khô ráo",
  "Phân loại hóa chất đúng tương thích","Sổ theo dõi xuất nhập cập nhật",
];

// ═══════════════════════════════════════════════════════════════
// GLOBAL CSS
// ═══════════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:${T.bg};color:${T.text};font-family:'Outfit',sans-serif;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:${T.bg};}
::-webkit-scrollbar-thumb{background:${T.border2};border-radius:2px;}
input,select,textarea{font-family:'Outfit',sans-serif!important;}
input::placeholder,textarea::placeholder{color:${T.dim}!important;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pop{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulseGlow{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
@keyframes ripple{to{transform:scale(2.5);opacity:0}}
@keyframes scanBar{0%{top:10%}50%{top:80%}100%{top:10%}}
@keyframes countUp{from{opacity:0;transform:scale(.88)}to{opacity:1;transform:scale(1)}}
.anim-fade{animation:fadeIn .28s ease-out}
.anim-pop{animation:pop .22s ease-out}
.anim-slide{animation:slideIn .22s ease-out}
.skeleton{background:linear-gradient(90deg,${T.border} 25%,${T.ghost} 50%,${T.border} 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:6px;}
button:active{transform:scale(.97)!important;}
`;

// ═══════════════════════════════════════════════════════════════
// PRIMITIVE COMPONENTS
// ═══════════════════════════════════════════════════════════════
const Mono = ({ c, s=11, w=600, children }) => (
  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:s, color:c||T.sub, fontWeight:w }}>{children}</span>
);

const Syne = ({ s=14, w=700, c, children, style={} }) => (
  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:s, fontWeight:w, color:c||T.text, ...style }}>{children}</span>
);

function Pill({ label, color, bg, size=10 }) {
  return <span style={{ fontSize:size, fontWeight:700, color, background:bg||color+"20", padding:`${size>10?"3px 9px":"2px 7px"}`, borderRadius:20, whiteSpace:"nowrap", letterSpacing:".3px" }}>{label}</span>;
}

function Dot({ color, pulse=false, size=7 }) {
  return <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:color, boxShadow:pulse?`0 0 8px ${color}66`:"none", animation:pulse?"pulseGlow 2s ease-in-out infinite":"none", flexShrink:0 }} />;
}

function Divider({ margin="12px 0" }) {
  return <div style={{ height:1, background:T.border, margin }} />;
}

function Spinner({ size=16, color=T.green }) {
  return <span style={{ display:"inline-block", width:size, height:size, border:`2px solid ${T.border}`, borderTop:`2px solid ${color}`, borderRadius:"50%", animation:"spin .7s linear infinite", flexShrink:0 }} />;
}

function KPICard({ icon, label, value, unit, color, sub, loading, trend, onClick }) {
  return (
    <div onClick={onClick} className="anim-pop" style={{
      background:T.card, border:`1px solid ${T.border}`,
      borderTop:`2px solid ${color}`, borderRadius:14,
      padding:"16px 16px 14px", flex:1, minWidth:130,
      cursor:onClick?"pointer":"default", transition:"border-color .15s",
    }}
    onMouseEnter={e=>onClick&&(e.currentTarget.style.borderColor=color+"88")}
    onMouseLeave={e=>onClick&&(e.currentTarget.style.borderColor=T.border)}>
      {icon && <div style={{ fontSize:20, marginBottom:8 }}>{icon}</div>}
      {loading
        ? <div className="skeleton" style={{ height:28, width:"60%", marginBottom:6 }} />
        : <div style={{ fontSize:26, fontWeight:800, color:T.text, lineHeight:1, animation:"countUp .4s ease-out" }}>
            {value ?? "—"}
            {unit && <span style={{ fontSize:12, color:T.sub, fontWeight:500 }}> {unit}</span>}
          </div>}
      <div style={{ fontSize:10, color:T.sub, marginTop:5, textTransform:"uppercase", letterSpacing:".6px", fontWeight:600 }}>{label}</div>
      {sub && <div style={{ fontSize:10, color, marginTop:4, fontWeight:600 }}>{sub}</div>}
      {trend && <div style={{ fontSize:10, color:trend>0?T.green:T.red, marginTop:3 }}>{trend>0?"▲":"▼"} {Math.abs(trend)}% vs T4</div>}
    </div>
  );
}

function StatusChip({ status }) {
  const m = {
    inside:   { label:"● Trong NM",   color:T.green },
    outside:  { label:"○ Đã ra ngoài",color:T.dim },
    pending:  { label:"◈ Chờ induction",color:T.amber },
    active:   { label:"● Còn hiệu lực",color:T.green },
    closed:   { label:"○ Đã đóng",    color:T.dim },
    open:     { label:"● Đang mở",    color:T.red },
    done:     { label:"✓ Hoàn thành", color:T.green },
  };
  const s = m[status]||m.outside;
  return <Pill label={s.label} color={s.color} />;
}

function SevPill({ sev }) {
  const m = { minor:{c:T.amber,l:"Nhẹ"}, moderate:{c:T.orange,l:"Trung bình"}, major:{c:T.red,l:"Nghiêm trọng"}, critical:{c:"#ff0033",l:"Khẩn cấp"} };
  const s = m[sev]||m.minor;
  return <Pill label={s.l} color={s.c} />;
}

function TypePill({ type }) {
  const m = { near_miss:{c:T.amber,l:"Near Miss"}, violation:{c:T.orange,l:"Vi phạm"}, injury:{c:T.red,l:"Chấn thương"}, spill:{c:T.violet,l:"Tràn HHC"} };
  const s = m[type]||m.near_miss;
  return <Pill label={s.l} color={s.c} />;
}

function ProgressBar({ val, max, color=T.green, h=5 }) {
  const pct = Math.min((val/max)*100, 100);
  return (
    <div style={{ width:"100%", height:h, background:T.border, borderRadius:h/2, overflow:"hidden" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:h/2, transition:"width .5s ease" }} />
    </div>
  );
}

// Input / Form
function Field({ label, hint, error, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:6, textTransform:"uppercase", letterSpacing:".6px" }}>{label}</div>}
      {children}
      {hint && <div style={{ fontSize:10, color:T.dim, marginTop:4 }}>{hint}</div>}
      {error && <div style={{ fontSize:10, color:T.red, marginTop:4 }}>⚠ {error}</div>}
    </div>
  );
}

const inputStyle = (focus) => ({
  width:"100%", background:T.ghost, border:`1.5px solid ${focus?T.green:T.border}`,
  borderRadius:10, padding:"10px 13px", color:T.text, fontSize:13,
  outline:"none", fontFamily:"'Outfit',sans-serif", transition:"border-color .15s",
});

function Input({ label, hint, multiline, ...props }) {
  const [f, setF] = useState(false);
  const s = inputStyle(f);
  return (
    <Field label={label} hint={hint}>
      {multiline
        ? <textarea rows={3} {...props} style={{...s, resize:"none"}} onFocus={()=>setF(true)} onBlur={()=>setF(false)} />
        : <input {...props} style={s} onFocus={()=>setF(true)} onBlur={()=>setF(false)} />}
    </Field>
  );
}

function Select({ label, options, ...props }) {
  return (
    <Field label={label}>
      <select {...props} style={{ ...inputStyle(false), cursor:"pointer" }}>
        {options.map(o=><option key={o.v??o} value={o.v??o}>{o.l??o}</option>)}
      </select>
    </Field>
  );
}

function Btn({ children, onClick, color=T.green, loading, small, outline, full, disabled, variant="solid" }) {
  const s = {
    background: outline||variant==="ghost" ? "transparent" : (loading||disabled ? T.ghost : color),
    color: outline||variant==="ghost" ? color : "#fff",
    border: outline||variant==="ghost" ? `1.5px solid ${color}44` : "none",
    borderRadius: small ? 9 : 12,
    padding: small ? "7px 14px" : "11px 20px",
    fontSize: small ? 11 : 13,
    fontWeight: 700, fontFamily:"'Outfit',sans-serif",
    cursor: loading||disabled ? "not-allowed" : "pointer",
    display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
    width: full ? "100%" : "auto",
    transition:"all .15s",
    opacity: disabled ? .5 : 1,
    letterSpacing:".2px",
  };
  return <button onClick={onClick} disabled={loading||disabled} style={s}>{loading ? <Spinner size={12} color={outline?color:"#fff"} /> : children}</button>;
}

function Table({ heads, rows, emptyMsg="Không có dữ liệu" }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr>
            {heads.map(h=>(
              <th key={h} style={{ textAlign:"left", padding:"8px 12px", color:T.dim, borderBottom:`1px solid ${T.border}`, fontSize:10, textTransform:"uppercase", letterSpacing:".6px", fontWeight:700, whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length===0
            ? <tr><td colSpan={heads.length} style={{ padding:"30px 12px", textAlign:"center", color:T.dim, fontSize:12 }}>{emptyMsg}</td></tr>
            : rows}
        </tbody>
      </table>
    </div>
  );
}

const TD = ({ children, style={} }) => (
  <td style={{ padding:"11px 12px", borderBottom:`1px solid ${T.border}22`, verticalAlign:"middle", fontSize:12, ...style }}>{children}</td>
);

function Modal({ show, title, onClose, children, width=520 }) {
  if (!show) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"#000000bb", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={e=>e.target===e.currentTarget&&onClose?.()}>
      <div className="anim-pop" style={{ background:T.card, borderRadius:20, border:`1px solid ${T.border2}`, width:"100%", maxWidth:width, maxHeight:"90vh", display:"flex", flexDirection:"column", boxShadow:"0 40px 80px #00000088" }}>
        <div style={{ padding:"18px 22px 14px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <Syne s={15}>{title}</Syne>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.sub, fontSize:20, cursor:"pointer", lineHeight:1 }}>×</button>
        </div>
        <div style={{ overflowY:"auto", padding:"18px 22px 22px", flex:1 }}>{children}</div>
      </div>
    </div>
  );
}

function AlertBox({ msg, level="info", compact=false }) {
  const colors = { info:T.blue, warn:T.amber, err:T.red, ok:T.green };
  const icons  = { info:"ℹ", warn:"⚠", err:"🚨", ok:"✓" };
  const c = colors[level]||T.blue;
  return (
    <div style={{ display:"flex", gap:9, padding:compact?"8px 11px":"11px 14px", background:`${c}10`, border:`1px solid ${c}33`, borderRadius:10, marginBottom:compact?8:12, fontSize:compact?11:12, alignItems:"flex-start" }}>
      <span style={{ color:c, flexShrink:0, fontSize:14 }}>{icons[level]}</span>
      <span style={{ color:T.text, lineHeight:1.5 }}>{msg}</span>
    </div>
  );
}

function SectionHeader({ title, sub, action }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
      <div>
        <Syne s={14} style={{ display:"block" }}>{title}</Syne>
        {sub && <div style={{ fontSize:11, color:T.sub, marginTop:3 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

const ChartTip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:"9px 13px", fontSize:11 }}>
      <div style={{ color:T.sub, marginBottom:5 }}>{label}</div>
      {payload.map(p=>(
        <div key={p.dataKey} style={{ color:p.color, fontWeight:600 }}>{p.name||p.dataKey}: <span style={{ color:T.text }}>{typeof p.value==="number"?p.value.toLocaleString():p.value}</span></div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MODULE: DASHBOARD (Unified)
// ═══════════════════════════════════════════════════════════════
function DashboardModule({ contractors, incidents, checklists, ptw, setActive }) {
  const inside = contractors.filter(c=>c.status==="inside").length;
  const pending = contractors.filter(c=>c.status==="pending").length;
  const openInc = incidents.filter(i=>i.status==="open").length;
  const pendingCL = checklists.filter(c=>!c.done).length;
  const activePTW = ptw.filter(p=>p.status==="active").length;
  const totalKwh = ENERGY_DATA.reduce((a,b)=>a+b.kwh,0);
  const scope2 = (totalKwh*0.4457/1000).toFixed(1);
  const nh3N2O = 0.033;
  const totalCO2 = (parseFloat(scope2)+nh3N2O+4.12).toFixed(2);
  const safetyPct = checklists.length ? (checklists.reduce((a,b)=>a+b.pass,0)/checklists.reduce((a,b)=>a+b.total,0)*100).toFixed(1) : 0;

  const RADAR_DATA = [
    { module:"Hóa Chất", score:98 },{ module:"Nước Thải", score:85 },
    { module:"Năng Lượng", score:92 },{ module:"Chất Thải", score:95 },
    { module:"An Toàn", score:Number(safetyPct)||90 },{ module:"Nhà Thầu", score:pending?70:94 },
    { module:"GRI", score:88 },
  ];

  return (
    <div className="anim-fade">
      {/* Alerts */}
      {pending>0 && <AlertBox level="warn" msg={`${pending} nhà thầu chờ Induction HSE — chưa được phép vào khu vực sản xuất`} />}
      {openInc>0 && <AlertBox level="err" msg={`${openInc} sự cố đang mở cần điều tra và đóng trong 48h`} />}
      {pendingCL>0 && <AlertBox level="warn" msg={`${pendingCL} checklist hôm nay chưa hoàn thành — Ca Chiều Phân xưởng NPK`} />}
      <AlertBox level="info" msg="Quan trắc định kỳ Q2/2026 · Hạn nộp: 15/07/2026 · Báo cáo EPR 2026 hạn 31/12" compact />

      {/* KPI row 1 — Environmental */}
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:".7px", marginBottom:10 }}>🌍 Môi Trường & GRI</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <KPICard icon="🌫" label="CO₂e Scope 1+2 YTD" value={totalCO2} unit="tấn" color={T.violet} sub="NH₃+DO+Điện EVN" trend={-3.2} onClick={()=>setActive("gri")} />
          <KPICard icon="⚡" label="Điện YTD" value={(totalKwh/1000).toFixed(0)} unit="MWh" color={T.amber} sub="GRI 302-1 · 2026" onClick={()=>setActive("energy")} />
          <KPICard icon="🌊" label="QCVN 40 T5/2026" value="Cảnh báo" color={T.amber} sub="NH₄⁺ 4.8/5.0 mg/L" onClick={()=>setActive("wastewater")} />
          <KPICard icon="☣" label="CTNH YTD" value="4.26" unit="tấn" color={T.red} sub="Chân Lý + Cao Gia Quý" onClick={()=>setActive("waste")} />
        </div>
      </div>

      {/* KPI row 2 — HSE Control */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:".7px", marginBottom:10 }}>🛡 An Toàn & Kiểm Soát</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <KPICard icon="👷" label="Nhà thầu trong NM" value={inside} color={T.green} sub={`${pending} chờ induction`} onClick={()=>setActive("contractors")} />
          <KPICard icon="📋" label="PTW đang hoạt động" value={activePTW} color={T.blue} sub="Permit to Work" onClick={()=>setActive("ptw")} />
          <KPICard icon="✅" label="Tuân thủ An toàn" value={`${safetyPct}%`} color={Number(safetyPct)>=90?T.green:T.amber} sub="Checklist tháng 5" onClick={()=>setActive("safety")} />
          <KPICard icon="🚨" label="Sự cố đang mở" value={openInc} color={openInc>0?T.red:T.green} sub="INC mở / 30 ngày" onClick={()=>setActive("incidents")} />
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:14, marginBottom:14 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 16px 10px" }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:14 }}>📈 Tổng hợp điện tiêu thụ & CO₂e</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={ENERGY_DATA}>
              <defs>
                <linearGradient id="gKwh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.amber} stopOpacity={.3}/>
                  <stop offset="95%" stopColor={T.amber} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gCo2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.violet} stopOpacity={.25}/>
                  <stop offset="95%" stopColor={T.violet} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="m" tick={{ fontSize:9, fill:T.dim }} />
              <YAxis yAxisId="l" tick={{ fontSize:9, fill:T.dim }} />
              <YAxis yAxisId="r" orientation="right" tick={{ fontSize:9, fill:T.dim }} domain={[50,75]} />
              <Tooltip content={<ChartTip/>}/>
              <Area yAxisId="l" type="monotone" dataKey="kwh" stroke={T.amber} fill="url(#gKwh)" strokeWidth={2} name="kWh" />
              <Area yAxisId="r" type="monotone" dataKey="co2" stroke={T.violet} fill="url(#gCo2)" strokeWidth={2} name="tCO₂e" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 16px 10px" }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:10 }}>🎯 Compliance Score</div>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke={T.border} />
              <PolarAngleAxis dataKey="module" tick={{ fontSize:9, fill:T.sub }} />
              <Radar dataKey="score" stroke={T.green} fill={T.green} fillOpacity={.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom: Contractor status + Recent incidents */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16 }}>
          <SectionHeader title="👷 Nhà thầu hôm nay" action={<span onClick={()=>setActive("contractors")} style={{ fontSize:11, color:T.green, cursor:"pointer", fontWeight:700 }}>Xem tất cả →</span>} />
          {contractors.slice(0,4).map(c=>(
            <div key={c.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${T.border}22` }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{c.name}</div>
                <div style={{ fontSize:10, color:T.sub, marginTop:1 }}>{c.company}</div>
              </div>
              <StatusChip status={c.status} />
            </div>
          ))}
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16 }}>
          <SectionHeader title="🚨 Sự cố gần đây" action={<span onClick={()=>setActive("incidents")} style={{ fontSize:11, color:T.red, cursor:"pointer", fontWeight:700 }}>Xem tất cả →</span>} />
          {incidents.slice(0,3).map(inc=>(
            <div key={inc.id} style={{ padding:"7px 0", borderBottom:`1px solid ${T.border}22` }}>
              <div style={{ display:"flex", gap:6, marginBottom:3 }}>
                <TypePill type={inc.type}/><SevPill sev={inc.severity}/>
                <Pill label={inc.source==="contractor"?"Nhà thầu":"Nội bộ"} color={inc.source==="contractor"?T.orange:T.blue} size={9}/>
              </div>
              <div style={{ fontSize:11, color:T.sub }}>{inc.area} · {inc.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE: CONTRACTOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════
function ContractorModule({ contractors, setContractors, ptw, setPTW }) {
  const [tab, setTab] = useState("list");
  const [selected, setSelected] = useState(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [scanPhase, setScanPhase] = useState("scan"); // scan|found|done
  const [foundCtr, setFoundCtr] = useState(null);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  // PTW form
  const [ptwForm, setPtwForm] = useState({ contractor:"", zone:"", task:"", risk:"Trung bình", date:"", timeStart:"07:00", timeEnd:"17:00", hazards:[], measures:"" });
  const [ptwLoading, setPtwLoading] = useState(false);
  const [ptwDone, setPtwDone] = useState(null);

  const HAZARDS = ["Điện","Hóa chất","Làm việc trên cao","Không gian hạn chế","Cháy nổ","Vận hành thiết bị","Nâng hạ","Bụi độc hại","Áp lực cao","Bức xạ"];
  const ZONES = ["Kho Hóa chất A","Kho Hóa chất B","HTXLNT","Phân xưởng NPK","Lò hơi","Văn phòng","Bãi CTNH","Trạm điện"];

  const filtered = contractors.filter(c=>filter==="all"||c.status===filter);
  const inside = contractors.filter(c=>c.status==="inside").length;
  const pending = contractors.filter(c=>c.status==="pending").length;

  // Simulate QR scan
  const startScan = () => {
    setScanPhase("scan");
    setFoundCtr(null);
    setShowCheckin(true);
    setTimeout(()=>{
      const ctr = contractors.find(c=>c.status==="pending") || contractors[0];
      setFoundCtr(ctr);
      setScanPhase("found");
    }, 2000);
  };

  const doCheckin = () => {
    setCheckinLoading(true);
    setTimeout(()=>{
      if(foundCtr) {
        setContractors(prev=>prev.map(c=>c.id===foundCtr.id?{...c,status:"inside",checkin:new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}),inducted:true}:c));
      }
      setCheckinLoading(false);
      setScanPhase("done");
    }, 900);
  };

  const doCheckout = (ctr) => {
    setContractors(prev=>prev.map(c=>c.id===ctr.id?{...c,status:"outside",checkout:new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}:c));
    setSelected(null);
  };

  const submitPTW = () => {
    setPtwLoading(true);
    setTimeout(()=>{
      const id = `PTW-2026-${String(Math.floor(Math.random()*900+100))}`;
      const newP = { id, contractor:ptwForm.contractor, zone:ptwForm.zone, task:ptwForm.task, risk:ptwForm.risk, issued:new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}), expires:ptwForm.timeEnd, status:"active", approver:"Phong Nguyen", hazards:ptwForm.hazards };
      setPTW(prev=>[newP,...prev]);
      setPtwLoading(false);
      setPtwDone(id);
    }, 1200);
  };

  const toggleH = (h) => setPtwForm(f=>({...f,hazards:f.hazards.includes(h)?f.hazards.filter(x=>x!==h):[...f.hazards,h]}));

  const TABS = [["list","👷 Nhà Thầu"],["add","➕ Nhập Thủ Công"],["ptw","📋 Permit to Work"],["qr","📷 QR Check-in"],["induction","📚 Induction"]];

  // ── Form thêm nhà thầu thủ công ──
  const EMPTY_CTR_FORM = { name:"", company:"", phone:"", zone:"", task:"", riskLevel:"Trung bình", ppe:[], safetyModules:[], trainerName:"", trainingDate:"", trainingScore:"", trainingExpiry:"" };
  const [addForm, setAddForm] = useState(EMPTY_CTR_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [addDone, setAddDone] = useState(null);
  const ST_MODULES = ["PCCC","Hóa chất","Sơ cứu","Làm việc trên cao","Không gian hạn chế","Điện","Dung môi","Thiết bị nâng hạ"];
  const PPE_OPTS = [["helmet","🪖 Mũ bảo hiểm"],["vest","🦺 Áo phản quang"],["boots","👢 Giày bảo hộ"],["gloves","🧤 Găng tay"],["mask","😷 Khẩu trang"]];
  const toggleAddPPE = (p) => setAddForm(f=>({...f,ppe:f.ppe.includes(p)?f.ppe.filter(x=>x!==p):[...f.ppe,p]}));
  const toggleAddST = (m) => setAddForm(f=>({...f,safetyModules:f.safetyModules.includes(m)?f.safetyModules.filter(x=>x!==m):[...f.safetyModules,m]}));
  const submitAdd = () => {
    if (!addForm.name||!addForm.company||!addForm.phone||!addForm.zone) return;
    setAddLoading(true);
    const trainPassed = addForm.safetyModules.length>0 && addForm.trainingDate && +addForm.trainingScore>=70;
    setTimeout(()=>{
      const id = `CTR-${String(contractors.length+1).padStart(3,"0")}`;
      const newC = {
        id, name:addForm.name, company:addForm.company, phone:addForm.phone,
        zone:addForm.zone, status:trainPassed?"pending":"pending",
        checkin:null, task:addForm.task, permit:null,
        inducted:false, ppe:addForm.ppe, riskLevel:addForm.riskLevel,
        safetyTraining:{
          passed:trainPassed,
          date:addForm.trainingDate||null,
          score:addForm.trainingScore?+addForm.trainingScore:null,
          modules:addForm.safetyModules,
          trainer:addForm.trainerName||null,
          expiry:addForm.trainingExpiry||null,
        },
      };
      setContractors(prev=>[newC,...prev]);
      setAddLoading(false);
      setAddDone(newC);
      setAddForm(EMPTY_CTR_FORM);
    },900);
  };

  return (
    <div className="anim-fade">
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        <KPICard icon="👷" label="Trong nhà máy" value={inside} color={T.green} sub="Đang làm việc" />
        <KPICard icon="⏳" label="Chờ induction" value={pending} color={pending?T.amber:T.green} sub={pending?"Chưa được vào":"Tất cả OK"} />
        <KPICard icon="📋" label="PTW đang mở" value={ptw.filter(p=>p.status==="active").length} color={T.blue} sub="Permit to Work" />
        <KPICard icon="🚪" label="Tổng nhà thầu hôm nay" value={contractors.length} color={T.sub} />
      </div>

      {pending>0 && <AlertBox level="warn" msg={`${pending} nhà thầu chưa Induction — CTR-003 Lê Quốc Hùng (Điện lạnh Nam Bộ) cần hoàn thành trước khi vào`} />}

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16, borderBottom:`1px solid ${T.border}`, paddingBottom:0 }}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ background:"none", border:"none", borderBottom:tab===id?`2px solid ${T.green}`:"2px solid transparent", color:tab===id?T.green:T.sub, padding:"9px 14px", fontSize:12, fontWeight:tab===id?700:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all .15s" }}>{label}</button>
        ))}
        <div style={{ marginLeft:"auto" }}>
          <Btn small onClick={startScan} color={T.orange}>📷 QR Check-in</Btn>
        </div>
      </div>

      {tab==="list" && (
        <div>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            {[["all","Tất cả"],["inside","Trong NM"],["pending","Chờ"],["outside","Đã ra"]].map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(v)} style={{ background:filter===v?T.green:T.ghost, color:filter===v?"#fff":T.sub, border:`1px solid ${filter===v?T.green:T.border}`, borderRadius:20, padding:"5px 13px", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{l} {v==="all"?`(${contractors.length})`:v==="inside"?`(${inside})`:v==="pending"?`(${pending})`:""}</button>
            ))}
          </div>
          <Table
            heads={["ID","Họ tên","Công ty","Khu vực","Công việc","PPE","Huấn luyện AT","Permit","Trạng thái","Thao tác"]}
            rows={filtered.map(c=>{
              const st = c.safetyTraining;
              const stColor = !st?.passed ? T.red : (st.score>=90?T.green:st.score>=70?T.amber:T.orange);
              return (
              <tr key={c.id} onClick={()=>setSelected(c)} style={{ cursor:"pointer" }} onMouseEnter={e=>e.currentTarget.style.background=T.ghost} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <TD><Mono c={T.sub}>{c.id}</Mono></TD>
                <TD><div style={{ fontWeight:600, color:T.text }}>{c.name}</div><div style={{ fontSize:10, color:T.sub }}>{c.phone}</div></TD>
                <TD style={{ color:T.sub, fontSize:11 }}>{c.company}</TD>
                <TD><Pill label={c.zone} color={T.blue} size={10}/></TD>
                <TD style={{ color:T.sub, fontSize:11, maxWidth:140 }}>{c.task}</TD>
                <TD>
                  <div style={{ display:"flex", gap:3, flexWrap:"wrap" }}>
                    {["helmet","vest","boots","gloves","mask"].map(p=>(
                      <span key={p} style={{ fontSize:12, opacity:c.ppe.includes(p)?1:.22 }}>{{"helmet":"🪖","vest":"🦺","boots":"👢","gloves":"🧤","mask":"😷"}[p]}</span>
                    ))}
                    {!c.inducted && <Pill label="⚠ Chưa IT" color={T.red} size={9}/>}
                  </div>
                </TD>
                <TD>
                  {st?.passed ? (
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                        <span style={{ fontSize:13, color:stColor, fontWeight:800 }}>{st.score}%</span>
                        <Pill label="✓ Đạt" color={stColor} size={9}/>
                      </div>
                      <div style={{ fontSize:9, color:T.dim }}>{st.date} · {st.trainer}</div>
                      <div style={{ fontSize:9, color:T.dim }}>HH: {st.expiry||"—"}</div>
                    </div>
                  ) : (
                    <div>
                      <Pill label="✗ Chưa huấn luyện" color={T.red} size={9}/>
                      {st?.date && <div style={{ fontSize:9, color:T.red, marginTop:3 }}>Điểm: {st.score||"—"}/100</div>}
                    </div>
                  )}
                </TD>
                <TD>{c.permit ? <Mono c={T.green}>{c.permit}</Mono> : <span style={{ color:T.dim, fontSize:10 }}>—</span>}</TD>
                <TD><StatusChip status={c.status}/></TD>
                <TD>
                  <div style={{ display:"flex", gap:5 }}>
                    {c.status==="inside" && <Btn small onClick={(e)=>{e.stopPropagation();doCheckout(c);}} color={T.red} variant="ghost">Check-out</Btn>}
                    {c.status==="pending" && <Btn small onClick={(e)=>{e.stopPropagation();startScan();}} color={T.green}>Check-in</Btn>}
                  </div>
                </TD>
              </tr>
            );})}
          />
        </div>
      )}

      {tab==="add" && (
        <div>
          {addDone ? (
            <div className="anim-pop" style={{ maxWidth:560, margin:"0 auto" }}>
              <AlertBox level="ok" msg={`✓ Đã thêm nhà thầu ${addDone.name} (${addDone.id}) — ${addDone.safetyTraining.passed?"Đã có chứng chỉ huấn luyện AT":"Chưa huấn luyện AT, cần sắp xếp trước khi vào khu vực sản xuất"}`} />
              <div style={{ display:"flex", gap:10, marginTop:12 }}>
                <Btn onClick={()=>setAddDone(null)} color={T.green} full>+ Nhập nhà thầu tiếp theo</Btn>
                <Btn onClick={()=>{setAddDone(null);setTab("list");}} outline color={T.sub} full>← Về danh sách</Btn>
              </div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              {/* Cột trái: thông tin cơ bản */}
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:16, paddingBottom:8, borderBottom:`1px solid ${T.border}` }}>
                  👷 Thông tin nhà thầu
                </div>
                <Input label="Họ và tên *" placeholder="Nguyễn Văn A" value={addForm.name} onChange={e=>setAddForm(f=>({...f,name:e.target.value}))} />
                <Input label="Công ty / Đơn vị *" placeholder="Công ty Cơ điện ABC" value={addForm.company} onChange={e=>setAddForm(f=>({...f,company:e.target.value}))} />
                <Input label="Số điện thoại *" placeholder="09xxxxxxxx" type="tel" value={addForm.phone} onChange={e=>setAddForm(f=>({...f,phone:e.target.value}))} />
                <Select label="Khu vực làm việc *" value={addForm.zone} onChange={e=>setAddForm(f=>({...f,zone:e.target.value}))} options={[{v:"",l:"-- Chọn khu vực --"},...ZONES.map(z=>({v:z,l:z}))]} />
                <Input label="Mô tả công việc" placeholder="VD: Bảo trì bơm tuần hoàn lò hơi..." value={addForm.task} onChange={e=>setAddForm(f=>({...f,task:e.target.value}))} multiline />
                <Select label="Mức rủi ro công việc" value={addForm.riskLevel} onChange={e=>setAddForm(f=>({...f,riskLevel:e.target.value}))} options={["Thấp","Trung bình","Cao","Rất cao"]} />

                <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:8, textTransform:"uppercase", letterSpacing:".5px" }}>PPE được trang bị</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                  {PPE_OPTS.map(([p,l])=>(
                    <div key={p} onClick={()=>toggleAddPPE(p)} style={{ background:addForm.ppe.includes(p)?T.green+"18":T.ghost, border:`1.5px solid ${addForm.ppe.includes(p)?T.green:T.border}`, borderRadius:10, padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:600, color:addForm.ppe.includes(p)?T.green:T.sub, transition:"all .12s" }}>{l}</div>
                  ))}
                </div>
              </div>

              {/* Cột phải: huấn luyện an toàn */}
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:16, paddingBottom:8, borderBottom:`1px solid ${T.border}` }}>
                  🎓 Đánh giá Huấn luyện An toàn
                </div>
                <AlertBox level="info" msg="Nhà thầu phải đạt ≥70% bài kiểm tra để được xếp loại 'Đã huấn luyện'. Dưới 70% phải học lại trước khi vào khu vực sản xuất." compact />

                <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:8, marginTop:6, textTransform:"uppercase", letterSpacing:".5px" }}>Nội dung đã huấn luyện</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:14 }}>
                  {ST_MODULES.map(m=>(
                    <div key={m} onClick={()=>toggleAddST(m)} style={{ background:addForm.safetyModules.includes(m)?T.violet+"18":T.ghost, border:`1.5px solid ${addForm.safetyModules.includes(m)?T.violet:T.border}`, borderRadius:9, padding:"8px 10px", cursor:"pointer", fontSize:11, fontWeight:addForm.safetyModules.includes(m)?700:400, color:addForm.safetyModules.includes(m)?T.violet:T.sub, transition:"all .12s", textAlign:"center" }}>
                      {addForm.safetyModules.includes(m)?"✓ ":""}{m}
                    </div>
                  ))}
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <Input label="Ngày huấn luyện" type="date" value={addForm.trainingDate} onChange={e=>setAddForm(f=>({...f,trainingDate:e.target.value}))} />
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:6, textTransform:"uppercase", letterSpacing:".5px" }}>Điểm kiểm tra (/100)</div>
                    <div style={{ position:"relative" }}>
                      <input type="number" min={0} max={100} placeholder="0–100" value={addForm.trainingScore} onChange={e=>setAddForm(f=>({...f,trainingScore:e.target.value}))}
                        style={{ width:"100%", background:T.ghost, border:`1.5px solid ${addForm.trainingScore?(+addForm.trainingScore>=70?T.green:T.red):T.border}`, borderRadius:10, padding:"10px 13px", color:T.text, fontSize:13, outline:"none", fontFamily:"'Outfit',sans-serif" }} />
                      {addForm.trainingScore && (
                        <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:700, color:+addForm.trainingScore>=70?T.green:T.red }}>
                          {+addForm.trainingScore>=70?"✓ Đạt":"✗ Trượt"}
                        </div>
                      )}
                    </div>
                    {addForm.trainingScore && +addForm.trainingScore<70 && (
                      <div style={{ fontSize:9, color:T.red, marginTop:3 }}>Cần ≥70% để được phép vào nhà máy</div>
                    )}
                  </div>
                  <Input label="Người huấn luyện" placeholder="Tên CBHSE" value={addForm.trainerName} onChange={e=>setAddForm(f=>({...f,trainerName:e.target.value}))} />
                  <Input label="Ngày hết hạn chứng chỉ" type="date" value={addForm.trainingExpiry} onChange={e=>setAddForm(f=>({...f,trainingExpiry:e.target.value}))} />
                </div>

                {/* Preview */}
                {(addForm.name||addForm.safetyModules.length>0) && (
                  <div style={{ background:T.ghost, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 14px", marginTop:6, marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:8, textTransform:"uppercase", letterSpacing:".5px" }}>Preview hồ sơ</div>
                    <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{addForm.name||"(Chưa nhập tên)"}</div>
                    <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>{addForm.company||"(Chưa nhập công ty)"} · {addForm.zone||"(Chưa chọn khu vực)"}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                      {addForm.safetyModules.length>0
                        ? addForm.safetyModules.map(m=><Pill key={m} label={m} color={T.violet} size={9}/>)
                        : <span style={{ fontSize:10, color:T.dim }}>Chưa chọn nội dung huấn luyện</span>}
                    </div>
                    {addForm.trainingScore && (
                      <div style={{ marginTop:8, display:"flex", gap:8, alignItems:"center" }}>
                        <div style={{ fontSize:20, fontWeight:800, color:+addForm.trainingScore>=70?T.green:T.red }}>{addForm.trainingScore}%</div>
                        <Pill label={+addForm.trainingScore>=70?"✓ Đạt yêu cầu vào nhà máy":"✗ Chưa đủ điều kiện"} color={+addForm.trainingScore>=70?T.green:T.red}/>
                      </div>
                    )}
                  </div>
                )}

                <Btn onClick={submitAdd} loading={addLoading} color={T.green} full disabled={!addForm.name||!addForm.company||!addForm.phone||!addForm.zone}>
                  ✓ Lưu hồ sơ nhà thầu
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="ptw" && (
        <div>
          {ptwDone ? (
            <div className="anim-pop" style={{ textAlign:"center", padding:"30px 20px" }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
              <Syne s={18} c={T.green} style={{ display:"block", marginBottom:6 }}>PTW Đã phát hành!</Syne>
              <Mono c={T.blue} s={14}>{ptwDone}</Mono>
              <div style={{ marginTop:20 }}>
                <Btn onClick={()=>{setPtwDone(null);setPtwForm({contractor:"",zone:"",task:"",risk:"Trung bình",date:"",timeStart:"07:00",timeEnd:"17:00",hazards:[],measures:""}); }} color={T.blue}>+ Tạo PTW mới</Btn>
              </div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              <div>
                <Syne s={13} style={{ display:"block", marginBottom:14 }}>Phát hành Permit to Work mới</Syne>
                <Select label="Nhà thầu *" value={ptwForm.contractor} onChange={e=>setPtwForm(f=>({...f,contractor:e.target.value}))} options={[{v:"",l:"-- Chọn nhà thầu --"},...contractors.map(c=>({v:c.name,l:`${c.name} — ${c.company}`}))]} />
                <Select label="Khu vực *" value={ptwForm.zone} onChange={e=>setPtwForm(f=>({...f,zone:e.target.value}))} options={[{v:"",l:"-- Chọn khu vực --"},...ZONES.map(z=>({v:z,l:z}))]} />
                <Input label="Mô tả công việc *" placeholder="Chi tiết công việc cần thực hiện..." value={ptwForm.task} onChange={e=>setPtwForm(f=>({...f,task:e.target.value}))} multiline />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <Input label="Ngày" type="date" value={ptwForm.date} onChange={e=>setPtwForm(f=>({...f,date:e.target.value}))} />
                  <Select label="Mức rủi ro" value={ptwForm.risk} onChange={e=>setPtwForm(f=>({...f,risk:e.target.value}))} options={["Thấp","Trung bình","Cao","Rất cao"]} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <Input label="Giờ bắt đầu" type="time" value={ptwForm.timeStart} onChange={e=>setPtwForm(f=>({...f,timeStart:e.target.value}))} />
                  <Input label="Giờ kết thúc" type="time" value={ptwForm.timeEnd} onChange={e=>setPtwForm(f=>({...f,timeEnd:e.target.value}))} />
                </div>
                <Btn onClick={submitPTW} loading={ptwLoading} color={T.green} full disabled={!ptwForm.contractor||!ptwForm.zone||!ptwForm.task}>📋 Phát hành PTW</Btn>
              </div>
              <div>
                <Syne s={13} style={{ display:"block", marginBottom:14 }}>Chọn nguy cơ tiềm ẩn</Syne>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:14 }}>
                  {HAZARDS.map(h=>(
                    <div key={h} onClick={()=>toggleH(h)} style={{ background:ptwForm.hazards.includes(h)?T.red+"18":T.ghost, border:`1.5px solid ${ptwForm.hazards.includes(h)?T.red:T.border}`, borderRadius:10, padding:"9px 11px", cursor:"pointer", fontSize:11, fontWeight:ptwForm.hazards.includes(h)?700:500, color:ptwForm.hazards.includes(h)?T.red:T.sub, transition:"all .12s", textAlign:"center" }}>
                      {ptwForm.hazards.includes(h)?"⚠ ":""}{h}
                    </div>
                  ))}
                </div>
                <Input label="Biện pháp kiểm soát" placeholder="LOTO, PPE level, cách ly, v.v..." value={ptwForm.measures} onChange={e=>setPtwForm(f=>({...f,measures:e.target.value}))} multiline />

                <Divider />
                <Syne s={12} style={{ display:"block", marginBottom:10, color:T.sub }}>PTW đang hoạt động</Syne>
                {ptw.filter(p=>p.status==="active").map(p=>(
                  <div key={p.id} style={{ background:T.ghost, borderRadius:10, padding:"10px 12px", marginBottom:8, border:`1px solid ${T.green}33` }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <Mono c={T.green}>{p.id}</Mono>
                      <Pill label={`hết hạn ${p.expires}`} color={T.amber} size={10}/>
                    </div>
                    <div style={{ fontSize:11, fontWeight:600, color:T.text, marginTop:4 }}>{p.contractor} — {p.zone}</div>
                    <div style={{ fontSize:10, color:T.sub, marginTop:2 }}>{p.task}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==="qr" && (
        <div style={{ maxWidth:400, margin:"0 auto", textAlign:"center", padding:"20px 0" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📷</div>
          <Syne s={16} style={{ display:"block", marginBottom:8 }}>QR Check-in Nhà Thầu</Syne>
          <div style={{ fontSize:12, color:T.sub, marginBottom:24 }}>Nhà thầu quét mã QR tại cổng bảo vệ hoặc HSE Staff scan bằng tablet</div>
          <Btn onClick={startScan} color={T.orange} full>📷 Bắt đầu Scan QR</Btn>
        </div>
      )}

      {tab==="induction" && (
        <div>
          <AlertBox level="info" msg="Induction HSE là bắt buộc trước khi nhà thầu vào bất kỳ khu vực sản xuất nào. Bao gồm: Nội quy an toàn, PPE, Thoát hiểm khẩn cấp, Hóa chất nguy hiểm." />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {contractors.map(c=>(
              <div key={c.id} style={{ background:T.card, border:`1px solid ${c.inducted?T.green+"44":T.amber+"44"}`, borderRadius:14, padding:"14px 16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ fontWeight:700, color:T.text }}>{c.name}</div>
                  <Pill label={c.inducted?"✓ Đã IT":"⚠ Chưa IT"} color={c.inducted?T.green:T.amber} />
                </div>
                <div style={{ fontSize:11, color:T.sub, marginBottom:8 }}>{c.company}</div>
                {!c.inducted && (
                  <Btn small onClick={()=>setContractors(prev=>prev.map(x=>x.id===c.id?{...x,inducted:true}:x))} color={T.green} full>✓ Xác nhận đã Induction</Btn>
                )}
                {c.inducted && <div style={{ fontSize:10, color:T.green }}>✓ Đã hoàn thành Induction HSE</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contractor detail modal */}
      <Modal show={!!selected} title={selected?.name||""} onClose={()=>setSelected(null)}>
        {selected && (
          <div>
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <StatusChip status={selected.status}/>
              <Pill label={selected.riskLevel||"—"} color={selected.riskLevel==="Cao"?T.red:selected.riskLevel==="Trung bình"?T.amber:T.green} />
              {selected.inducted?<Pill label="✓ Đã Induction" color={T.green}/>:<Pill label="⚠ Chưa IT" color={T.red}/>}
            </div>
            <Divider margin="0 0 14px"/>
            {[["Công ty",selected.company],["Điện thoại",selected.phone],["Khu vực",selected.zone],["Công việc",selected.task],["Check-in",selected.checkin||"—"],["Permit",selected.permit||"Chưa có PTW"],["PTW hết hạn",selected.expiresAt||"—"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12, color:T.sub }}>{k}</span>
                <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{v}</span>
              </div>
            ))}

            {/* Huấn luyện an toàn */}
            {selected.safetyTraining && (
              <div style={{ marginTop:14, background:selected.safetyTraining.passed?T.green+"0e":T.red+"0e", border:`1px solid ${selected.safetyTraining.passed?T.green+"44":T.red+"33"}`, borderRadius:12, padding:"13px 14px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:".5px", marginBottom:10 }}>🎓 Huấn luyện An toàn</div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <div style={{ fontSize:24, fontWeight:800, color:selected.safetyTraining.passed?T.green:T.red }}>
                      {selected.safetyTraining.score!=null?`${selected.safetyTraining.score}%`:"—"}
                    </div>
                    <Pill label={selected.safetyTraining.passed?"✓ Đạt yêu cầu":"✗ Chưa đủ điều kiện"} color={selected.safetyTraining.passed?T.green:T.red}/>
                  </div>
                  {selected.safetyTraining.passed && (
                    <div style={{ fontSize:10, color:T.sub, textAlign:"right" }}>
                      <div>HH: {selected.safetyTraining.expiry||"—"}</div>
                      <div>PT: {selected.safetyTraining.trainer||"—"}</div>
                    </div>
                  )}
                </div>
                {selected.safetyTraining.modules?.length>0 && (
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                    {selected.safetyTraining.modules.map(m=><Pill key={m} label={m} color={selected.safetyTraining.passed?T.green:T.amber} size={9}/>)}
                  </div>
                )}
                {!selected.safetyTraining.passed && (
                  <div style={{ marginTop:10 }}>
                    <Btn small onClick={()=>{
                      setContractors(prev=>prev.map(c=>c.id===selected.id?{...c,safetyTraining:{...c.safetyTraining,passed:true,date:new Date().toLocaleDateString("vi-VN"),score:80,trainer:"Phong Nguyen",expiry:"năm sau"}}:c));
                      setSelected(prev=>({...prev,safetyTraining:{...prev.safetyTraining,passed:true,score:80,date:new Date().toLocaleDateString("vi-VN"),trainer:"Phong Nguyen"}}));
                    }} color={T.violet} full>🎓 Xác nhận đã hoàn thành huấn luyện AT</Btn>
                  </div>
                )}
              </div>
            )}
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:8, textTransform:"uppercase", letterSpacing:".5px" }}>PPE Đã kiểm tra</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {["helmet","vest","boots","gloves","mask"].map(p=>(
                  <div key={p} style={{ background:selected.ppe.includes(p)?T.green+"18":T.red+"15", border:`1px solid ${selected.ppe.includes(p)?T.green+"44":T.red+"33"}`, borderRadius:10, padding:"7px 12px", fontSize:12, color:selected.ppe.includes(p)?T.green:T.red, fontWeight:600 }}>
                    {{"helmet":"🪖 Mũ","vest":"🦺 Áo","boots":"👢 Bảo hộ","gloves":"🧤 Găng","mask":"😷 Khẩu trang"}[p]}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:18 }}>
              {selected.status==="inside" && <Btn onClick={()=>doCheckout(selected)} color={T.red} full>🚪 Check-out khỏi NM</Btn>}
              <Btn onClick={()=>{setTab("ptw");setSelected(null);}} color={T.blue} full variant={selected.status!=="inside"?"solid":"ghost"}>📋 Tạo PTW</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* QR Scan Modal */}
      <Modal show={showCheckin} title="📷 QR Scan Check-in" onClose={()=>{setShowCheckin(false);setScanPhase("scan");}} width={420}>
        {scanPhase==="scan" && (
          <div style={{ textAlign:"center", padding:"10px 0" }}>
            <div style={{ position:"relative", width:240, height:240, margin:"0 auto 20px", borderRadius:20, overflow:"hidden", background:T.ghost }}>
              <div style={{ position:"absolute", inset:16, border:`2px solid ${T.green}`, borderRadius:14 }}/>
              {[[0,0],[0,1],[1,0],[1,1]].map(([r,c],i)=>(
                <div key={i} style={{ position:"absolute", top:r===0?16:"auto", bottom:r===1?16:"auto", left:c===0?16:"auto", right:c===1?16:"auto", width:22, height:22, borderTop:r===0?`3px solid ${T.green}`:"none", borderBottom:r===1?`3px solid ${T.green}`:"none", borderLeft:c===0?`3px solid ${T.green}`:"none", borderRight:c===1?`3px solid ${T.green}`:"none" }}/>
              ))}
              <div style={{ position:"absolute", left:18, right:18, height:2, background:`linear-gradient(90deg,transparent,${T.green},transparent)`, animation:"scanBar 1.8s ease-in-out infinite", boxShadow:`0 0 8px ${T.green}` }}/>
              <div style={{ position:"absolute", inset:40, display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:4, opacity:.2 }}>
                {Array(36).fill(0).map((_,i)=><div key={i} style={{ background:Math.random()>.5?T.green:"transparent", borderRadius:2 }}/>)}
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:T.green, fontSize:13, fontWeight:600 }}>
              <Spinner color={T.green}/> Đang nhận diện mã QR...
            </div>
          </div>
        )}

        {scanPhase==="found" && foundCtr && (
          <div className="anim-pop">
            <AlertBox level="ok" msg="✓ Nhận diện thành công!" />
            <div style={{ background:T.ghost, borderRadius:14, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:700, color:T.text }}>{foundCtr.name}</div>
              <div style={{ fontSize:12, color:T.sub, marginTop:2 }}>{foundCtr.company}</div>
              <Divider margin="10px 0"/>
              {[["Khu vực",foundCtr.zone],["Công việc",foundCtr.task],["Induction",foundCtr.inducted?"✓ Đã hoàn thành":"⚠ Chưa hoàn thành"],["Permit",foundCtr.permit||"Chưa có PTW"]].map(([k,v])=>(
                <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0" }}>
                  <span style={{ fontSize:11, color:T.sub }}>{k}</span>
                  <span style={{ fontSize:11, fontWeight:600, color:k==="Induction"?(foundCtr.inducted?T.green:T.red):T.text }}>{v}</span>
                </div>
              ))}
            </div>
            {!foundCtr.inducted && <AlertBox level="warn" msg="Nhà thầu chưa Induction HSE — Không được phép vào khu vực sản xuất"/>}
            <div style={{ display:"flex", gap:10 }}>
              <Btn onClick={()=>{setShowCheckin(false);setScanPhase("scan");}} outline color={T.sub} full>Hủy</Btn>
              <Btn onClick={doCheckin} loading={checkinLoading} color={T.green} full disabled={!foundCtr.inducted}>✓ Xác nhận Check-in</Btn>
            </div>
          </div>
        )}

        {scanPhase==="done" && (
          <div className="anim-pop" style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:52, marginBottom:12 }}>🎉</div>
            <Syne s={18} c={T.green} style={{ display:"block", marginBottom:6 }}>Check-in thành công!</Syne>
            <div style={{ fontSize:12, color:T.sub, marginBottom:20 }}>{foundCtr?.name} · {new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})}</div>
            <Btn onClick={()=>{setShowCheckin(false);setScanPhase("scan");}} color={T.green} full>← Đóng</Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE: INTERNAL SAFETY (Checklist + Incidents)
// ═══════════════════════════════════════════════════════════════
function SafetyModule({ checklists, setChecklists, incidents, setIncidents }) {
  const [tab, setTab] = useState("checklist");
  const [activeCheck, setActiveCheck] = useState(null);
  const [answers, setAnswers] = useState({});
  const [notes, setNotes] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  // Incident form
  const [incForm, setIncForm] = useState({ type:"near_miss", severity:"minor", area:"", desc:"", action:"", source:"internal" });
  const [incLoading, setIncLoading] = useState(false);
  const [incDone, setIncDone] = useState(false);

  const avgPct = checklists.length ? (checklists.reduce((a,b)=>a+b.pass/b.total*100,0)/checklists.length).toFixed(1) : 0;
  const totalFail = checklists.reduce((a,b)=>a+(b.total-b.pass),0);
  const openInc = incidents.filter(i=>i.status==="open").length;

  // Form tạo checklist mới
  const [newClForm, setNewClForm] = useState({ area:"", shift:"Sáng", date:new Date().toISOString().slice(0,10), inspector:"" });
  const [newClLoading, setNewClLoading] = useState(false);
  const submitNewCl = () => {
    if (!newClForm.area||!newClForm.inspector||!newClForm.date) return;
    setNewClLoading(true);
    setTimeout(()=>{
      const id = `CL-${String(checklists.length+1).padStart(3,"0")}`;
      const dateStr = new Date(newClForm.date).toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"});
      setChecklists(prev=>[...prev,{ id, area:newClForm.area, date:dateStr, shift:newClForm.shift, total:CL_ITEMS.length, pass:0, done:false, inspector:newClForm.inspector, failItems:[] }]);
      setNewClLoading(false);
      setNewClForm(f=>({...f,area:"",inspector:""}));
    },600);
  };

  const ZONES = ["Kho Hóa chất A","Kho Hóa chất B","HTXLNT","Phân xưởng NPK","Lò hơi","Văn phòng","Bãi CTNH"];

  const submitCheck = () => {
    setSubmitting(true);
    const pass = Object.values(answers).filter(a=>a==="pass").length;
    const failItems = CL_ITEMS.filter((_,i)=>answers[i]==="fail");
    setTimeout(()=>{
      setChecklists(prev=>prev.map(c=>c.id===activeCheck.id?{...c,done:true,pass,failItems}:c));
      setSubmitting(false);
      setCheckDone(true);
    }, 800);
  };

  const submitInc = () => {
    setIncLoading(true);
    setTimeout(()=>{
      const id = `INC-${String(incidents.length+1).padStart(3,"0")}`;
      setIncidents(prev=>[{ id, time:new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"}), date:new Date().toLocaleDateString("vi-VN",{day:"2-digit",month:"2-digit"}), ...incForm, reporter:"Phong Nguyen", status:"open" },...prev]);
      setIncLoading(false);
      setIncDone(true);
      setIncForm({type:"near_miss",severity:"minor",area:"",desc:"",action:"",source:"internal"});
      setTimeout(()=>setIncDone(false),3000);
    }, 1000);
  };

  // Checklist doing
  if (activeCheck && !checkDone) {
    const progress = Object.keys(answers).length / CL_ITEMS.length;
    const passCount = Object.values(answers).filter(a=>a==="pass").length;
    const failCount = Object.values(answers).filter(a=>a==="fail").length;
    return (
      <div className="anim-fade">
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"14px 18px", marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div>
              <Syne s={14}>{activeCheck.area}</Syne>
              <div style={{ fontSize:11, color:T.sub, marginTop:3, display:"flex", gap:10, alignItems:"center" }}>
                <span>Ca {activeCheck.shift} · {activeCheck.date}</span>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5, color:T.green, fontWeight:600 }}>
                  <span style={{ fontSize:13 }}>👤</span>
                  {activeCheck.inspector}
                </span>
              </div>
            </div>
            <Btn small onClick={()=>{setActiveCheck(null);setAnswers({});setNotes({});setCheckDone(false);}} outline color={T.sub}>← Quay lại</Btn>
          </div>
          <ProgressBar val={Object.keys(answers).length} max={CL_ITEMS.length} color={failCount>0?T.amber:T.green} h={6}/>
          <div style={{ display:"flex", gap:14, marginTop:8, fontSize:11 }}>
            <span style={{ color:T.green }}>✓ {passCount} đạt</span>
            {failCount>0&&<span style={{ color:T.red }}>✗ {failCount} không đạt</span>}
            <span style={{ color:T.sub }}>{Object.keys(answers).length}/{CL_ITEMS.length} hạng mục</span>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
          {CL_ITEMS.map((item,i)=>(
            <div key={i} style={{ background:T.card, border:`1.5px solid ${answers[i]==="fail"?T.red+"55":answers[i]==="pass"?T.green+"33":T.border}`, borderRadius:12, padding:"14px 16px" }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:11 }}>
                <Mono c={T.dim} s={10}>{String(i+1).padStart(2,"0")} </Mono>{item}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setAnswers(a=>({...a,[i]:"pass"}))} style={{ flex:1, background:answers[i]==="pass"?T.green:T.ghost, color:answers[i]==="pass"?"#fff":T.sub, border:`1.5px solid ${answers[i]==="pass"?T.green:T.border}`, borderRadius:9, padding:"9px", fontSize:12, fontWeight:700, fontFamily:"inherit", cursor:"pointer", transition:"all .12s" }}>✓ Đạt</button>
                <button onClick={()=>setAnswers(a=>({...a,[i]:"fail"}))} style={{ flex:1, background:answers[i]==="fail"?T.red:T.ghost, color:answers[i]==="fail"?"#fff":T.sub, border:`1.5px solid ${answers[i]==="fail"?T.red:T.border}`, borderRadius:9, padding:"9px", fontSize:12, fontWeight:700, fontFamily:"inherit", cursor:"pointer", transition:"all .12s" }}>✗ Không đạt</button>
                <button onClick={()=>setAnswers(a=>({...a,[i]:"na"}))} style={{ flex:0, background:answers[i]==="na"?T.sub:T.ghost, color:answers[i]==="na"?"#fff":T.dim, border:`1.5px solid ${answers[i]==="na"?T.sub:T.border}`, borderRadius:9, padding:"9px 11px", fontSize:11, fontWeight:700, fontFamily:"inherit", cursor:"pointer" }}>N/A</button>
              </div>
              {answers[i]==="fail" && (
                <input placeholder="Mô tả sự cố và biện pháp khắc phục ngay..." value={notes[i]||""} onChange={e=>setNotes(n=>({...n,[i]:e.target.value}))} style={{ width:"100%", marginTop:8, background:T.bg, border:`1px solid ${T.red}33`, borderRadius:8, padding:"8px 11px", color:T.text, fontSize:11, outline:"none", fontFamily:"'Outfit',sans-serif" }} />
              )}
            </div>
          ))}
        </div>

        <Btn onClick={submitCheck} loading={submitting} color={Object.keys(answers).length===CL_ITEMS.length?T.green:T.dim} full disabled={Object.keys(answers).length<CL_ITEMS.length}>
          {Object.keys(answers).length<CL_ITEMS.length?`Còn ${CL_ITEMS.length-Object.keys(answers).length} hạng mục chưa đánh giá`:"✓ Nộp Checklist"}
        </Btn>
      </div>
    );
  }

  if (checkDone) return (
    <div className="anim-pop" style={{ textAlign:"center", padding:"40px 20px" }}>
      <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
      <Syne s={20} c={T.green} style={{ display:"block", marginBottom:6 }}>Checklist hoàn thành!</Syne>
      <div style={{ fontSize:13, color:T.sub, marginBottom:24 }}>{activeCheck.area} · {Object.values(answers).filter(a=>a==="pass").length}/{CL_ITEMS.length} hạng mục đạt</div>
      <Btn onClick={()=>{setActiveCheck(null);setAnswers({});setNotes({});setCheckDone(false);}} color={T.green}>← Về danh sách</Btn>
    </div>
  );

  return (
    <div className="anim-fade">
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        <KPICard icon="✅" label="Tuân thủ TB" value={`${avgPct}%`} color={Number(avgPct)>=90?T.green:T.amber} sub="GRI 403-9 · T5/2026"/>
        <KPICard icon="❌" label="Hạng mục không đạt" value={totalFail} color={totalFail?T.amber:T.green} sub="Cần khắc phục"/>
        <KPICard icon="🚨" label="Sự cố đang mở" value={openInc} color={openInc?T.red:T.green} sub="INC tháng 5"/>
        <KPICard icon="📋" label="Checklist hoàn thành" value={`${checklists.filter(c=>c.done).length}/${checklists.length}`} color={T.blue}/>
      </div>

      <div style={{ display:"flex", gap:6, marginBottom:16, borderBottom:`1px solid ${T.border}`, paddingBottom:0 }}>
        {[["checklist","✅ Checklist Nội Bộ"],["incidents","🚨 Sự Cố & Vi Phạm"]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ background:"none", border:"none", borderBottom:tab===id?`2px solid ${T.green}`:"2px solid transparent", color:tab===id?T.green:T.sub, padding:"9px 16px", fontSize:12, fontWeight:tab===id?700:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{label}</button>
        ))}
      </div>

      {tab==="checklist" && (
        <div>
          {/* Form tạo checklist mới */}
          <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px", marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:14 }}>+ Tạo lịch kiểm tra mới</div>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 2fr 1fr", gap:10, alignItems:"flex-end" }}>
              <Select label="Khu vực kiểm tra *" value={newClForm.area} onChange={e=>setNewClForm(f=>({...f,area:e.target.value}))} options={[{v:"",l:"-- Chọn khu vực --"},...["Kho hóa chất A","Kho hóa chất B","HTXLNT","Phân xưởng NPK","Lò hơi","Bãi CTNH","Trạm điện"].map(z=>({v:z,l:z}))]} />
              <Select label="Ca *" value={newClForm.shift} onChange={e=>setNewClForm(f=>({...f,shift:e.target.value}))} options={["Sáng","Chiều","Tối"]} />
              <Input label="Ngày *" type="date" value={newClForm.date} onChange={e=>setNewClForm(f=>({...f,date:e.target.value}))} />
              <Input label="Người kiểm tra *" placeholder="Họ tên người thực hiện kiểm tra" value={newClForm.inspector} onChange={e=>setNewClForm(f=>({...f,inspector:e.target.value}))} />
              <div style={{ paddingBottom:14 }}>
                <Btn onClick={submitNewCl} loading={newClLoading} color={T.green} full disabled={!newClForm.area||!newClForm.inspector||!newClForm.date}>+ Tạo</Btn>
              </div>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
          {checklists.map(cl=>(
            <div key={cl.id} style={{ background:T.card, border:`1px solid ${cl.done?T.green+"44":T.border}`, borderRadius:14, padding:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div><div style={{ fontSize:14, fontWeight:700, color:T.text }}>{cl.area}</div><div style={{ fontSize:11, color:T.sub, marginTop:2 }}>Ca {cl.shift} · {cl.date} · {cl.inspector}</div></div>
                <StatusChip status={cl.done?"done":"pending"}/>
              </div>
              {cl.done && (
                <>
                  <ProgressBar val={cl.pass} max={cl.total} color={cl.pass===cl.total?T.green:T.amber} h={5}/>
                  <div style={{ fontSize:11, color:T.sub, marginTop:5 }}>{cl.pass}/{cl.total} hạng mục đạt · {cl.failItems?.length||0} cần khắc phục</div>
                  {cl.failItems?.length>0 && (
                    <div style={{ marginTop:8 }}>
                      {cl.failItems.map((f,i)=><div key={i} style={{ fontSize:10, color:T.red, padding:"3px 0" }}>• {f}</div>)}
                    </div>
                  )}
                </>
              )}
              {!cl.done && <Btn onClick={()=>setActiveCheck(cl)} color={T.green} full style={{ marginTop:4 }}>▶ Bắt đầu kiểm tra</Btn>}
            </div>
          ))}
          </div>
        </div>
      )}

      {tab==="incidents" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
            <div>
              <SectionHeader title="Báo cáo sự cố mới" />
              {incDone && <AlertBox level="ok" msg="✓ Sự cố đã được báo cáo và gửi thông báo cho HSE Manager"/>}
              <Select label="Nguồn sự cố" value={incForm.source} onChange={e=>setIncForm(f=>({...f,source:e.target.value}))} options={[{v:"internal",l:"Nội bộ — Nhân viên công ty"},{v:"contractor",l:"Nhà thầu — Bên ngoài"}]} />
              <Select label="Loại sự cố" value={incForm.type} onChange={e=>setIncForm(f=>({...f,type:e.target.value}))} options={[{v:"near_miss",l:"Near Miss — Gần sự cố"},{v:"violation",l:"Vi phạm an toàn"},{v:"injury",l:"Chấn thương"},{v:"spill",l:"Tràn đổ hóa chất"},{v:"fire",l:"Cháy / Nổ"}]} />
              <Select label="Mức độ" value={incForm.severity} onChange={e=>setIncForm(f=>({...f,severity:e.target.value}))} options={[{v:"minor",l:"Nhẹ"},{v:"moderate",l:"Trung bình"},{v:"major",l:"Nghiêm trọng"},{v:"critical",l:"Khẩn cấp"}]} />
              <Select label="Khu vực" value={incForm.area} onChange={e=>setIncForm(f=>({...f,area:e.target.value}))} options={[{v:"",l:"-- Chọn khu vực --"},...ZONES.map(z=>({v:z,l:z}))]} />
              <Input label="Mô tả chi tiết *" placeholder="Mô tả chính xác những gì xảy ra..." value={incForm.desc} onChange={e=>setIncForm(f=>({...f,desc:e.target.value}))} multiline />
              <Input label="Hành động khắc phục ngay" placeholder="Biện pháp đã/cần thực hiện ngay..." value={incForm.action} onChange={e=>setIncForm(f=>({...f,action:e.target.value}))} multiline />
              {incForm.severity==="critical" && <AlertBox level="err" msg="🆘 KHẨN CẤP — Liên hệ ngay HSE Manager và gọi 115 nếu có thương tích!"/>}
              <Btn onClick={submitInc} loading={incLoading} color={T.red} full disabled={!incForm.area||!incForm.desc}>🚨 Gửi báo cáo sự cố</Btn>
            </div>

            <div>
              <SectionHeader title="Lịch sử sự cố" sub={`${incidents.length} sự cố · ${openInc} đang mở`}/>
              {incidents.map(inc=>(
                <div key={inc.id} style={{ background:T.card, border:`1px solid ${inc.status==="open"?T.red+"33":T.border}`, borderRadius:12, padding:"13px 15px", marginBottom:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:7 }}>
                    <Mono c={T.dim}>{inc.id}</Mono>
                    <div style={{ display:"flex", gap:5 }}>
                      <TypePill type={inc.type}/><SevPill sev={inc.severity}/>
                      <Pill label={inc.source==="contractor"?"Nhà thầu":"Nội bộ"} color={inc.source==="contractor"?T.orange:T.blue} size={9}/>
                    </div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.text, marginBottom:3 }}>📍 {inc.area}</div>
                  <div style={{ fontSize:11, color:T.sub, marginBottom:7 }}>{inc.desc}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:10, color:T.dim }}>{inc.time} · {inc.date} · {inc.reporter}</span>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <StatusChip status={inc.status}/>
                      {inc.status==="open" && <Btn small onClick={()=>setIncidents(prev=>prev.map(i=>i.id===inc.id?{...i,status:"closed"}:i))} color={T.green} variant="ghost">Đóng</Btn>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE: WASTEWATER (compact)
// ═══════════════════════════════════════════════════════════════
function WastewaterModule() {
  const [showForm, setShowForm] = useState(false);
  const latest = WW_DATA[WW_DATA.length-1];
  return (
    <div className="anim-fade">
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
        <KPICard icon="🌊" label="Công suất HTXLNT" value="120" unit="m³/ngày" color={T.cyan} sub="Anoxic–MBBR–Aerotank"/>
        <KPICard icon="⚗" label="COD T5/2026" value={latest.cod} unit="mg/L" color={latest.cod>60?T.amber:T.green} sub="Giới hạn: 75 mg/L"/>
        <KPICard icon="🔬" label="NH₄⁺ T5/2026" value={latest.nh4} unit="mg/L" color={latest.nh4>4?T.amber:T.green} sub="Giới hạn: 5 mg/L"/>
        <KPICard icon="📊" label="Tháng đạt QCVN" value="4/5" color={T.amber} sub="T5 cần theo dõi"/>
      </div>
      {latest.nh4>4 && <AlertBox level="warn" msg={`NH₄⁺ T5/2026 = ${latest.nh4} mg/L (${(latest.nh4/5*100).toFixed(0)}% giới hạn QCVN 40:2011/A ≤5) — Tăng liều PAC, kiểm tra thời gian lưu Aerotank`}/>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 16px 10px" }}>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:12 }}>COD & NH₄⁺ xu hướng (mg/L)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={WW_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
              <XAxis dataKey="m" tick={{ fontSize:9, fill:T.dim }}/>
              <YAxis tick={{ fontSize:9, fill:T.dim }} domain={[0,80]}/>
              <Tooltip content={<ChartTip/>}/>
              <ReferenceLine y={75} stroke={T.red} strokeDasharray="4 4" label={{ value:"COD max", position:"right", fontSize:8, fill:T.red }}/>
              <ReferenceLine y={5} stroke={T.amber} strokeDasharray="4 4" label={{ value:"NH₄ max", position:"right", fontSize:8, fill:T.amber }}/>
              <Line dataKey="cod" stroke={T.cyan} strokeWidth={2} dot={{ r:4, fill:T.cyan }} name="COD"/>
              <Line dataKey="nh4" stroke={T.amber} strokeWidth={2} dot={{ r:4, fill:T.amber }} name="NH₄⁺"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, overflowX:"auto" }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700 }}>Bảng kết quả quan trắc</div>
            <Btn small onClick={()=>setShowForm(s=>!s)} color={T.cyan}>+ Nhập mới</Btn>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
            <thead><tr>{["Kỳ","pH","BOD₅","COD","NH₄⁺","Kết quả"].map(h=><th key={h} style={{ textAlign:"left", padding:"5px 8px", color:T.dim, fontSize:9, textTransform:"uppercase", letterSpacing:".5px", borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
            <tbody>
              {WW_DATA.map((r,i)=>{
                const ok = r.cod<=75&&r.nh4<=5&&r.bod5<=30;
                const warn = !ok||(r.cod>60||r.nh4>4);
                return (
                  <tr key={i}>
                    <td style={{ padding:"6px 8px", fontWeight:600, color:T.text }}>{r.m}/2026</td>
                    <td style={{ padding:"6px 8px", color:T.sub }}>7.{i+1}</td>
                    <td style={{ padding:"6px 8px", color:r.bod5>30?T.red:T.text }}>{r.bod5}</td>
                    <td style={{ padding:"6px 8px", color:r.cod>75?T.red:r.cod>60?T.amber:T.text, fontWeight:r.cod>60?700:400 }}>{r.cod}</td>
                    <td style={{ padding:"6px 8px", color:r.nh4>5?T.red:r.nh4>4?T.amber:T.text, fontWeight:r.nh4>4?700:400 }}>{r.nh4}</td>
                    <td style={{ padding:"6px 8px" }}><Pill label={ok?"ĐẠT":warn?"CẢNH BÁO":"VI PHẠM"} color={ok?T.green:T.amber} size={9}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE: GRI REPORT
// ═══════════════════════════════════════════════════════════════
function GRIModule() {
  const [year, setYear] = useState(2026);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const generate = () => {
    setLoading(true);
    setTimeout(()=>{
      const totalKwh = ENERGY_DATA.reduce((a,b)=>a+b.kwh,0);
      const totalWater = ENERGY_DATA.reduce((a,b)=>a+b.water,0);
      const s2 = totalKwh*0.4457/1000;
      const s1do = ENERGY_DATA.reduce((a,b)=>a+b.kwh*0.00003,0);
      const s1n2o = 0.033;
      const ctnh = WASTE_DATA.reduce((a,b)=>a+b.ctnh,0);
      const cn = WASTE_DATA.reduce((a,b)=>a+b.cn,0);
      setReport({ totalKwh,totalWater,s2,s1do,s1n2o,total:s2+s1do+s1n2o,ctnh,cn });
      setLoading(false);
    }, 1300);
  };

  const fmt = (v,d=3) => v!=null?Number(v).toFixed(d):"—";

  return (
    <div className="anim-fade">
      <AlertBox level="info" msg="GRI NPK: Scope 1 bắt buộc tính N₂O từ NH₃ (GWP=273, IPCC AR6) — đặc trưng ngành phân bón, khác hoàn toàn với semiconductor. Tích hợp tự động từ module Hóa chất & Năng lượng." compact/>
      <div style={{ display:"flex", gap:10, alignItems:"flex-end", marginBottom:20 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:6, textTransform:"uppercase", letterSpacing:".5px" }}>Năm báo cáo</div>
          <input type="number" value={year} onChange={e=>setYear(+e.target.value)} style={{ background:T.ghost, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 13px", color:T.text, fontSize:13, width:100, outline:"none", fontFamily:"inherit" }}/>
        </div>
        <Btn onClick={generate} loading={loading} color={T.violet}>⚡ Tổng hợp GRI từ tất cả module</Btn>
        {report && <Btn onClick={()=>{setExporting(true);setTimeout(()=>{setExporting(false);setExported(true);setTimeout(()=>setExported(false),3000);},1200);}} loading={exporting} color={T.green}>{exported?"✓ File đã tạo!":"⬇ Xuất .docx"}</Btn>}
      </div>

      {!report&&!loading&&(
        <div style={{ textAlign:"center", padding:"60px", color:T.dim }}>
          <div style={{ fontSize:60, marginBottom:16, opacity:.4 }}>📄</div>
          <div style={{ fontSize:14, fontWeight:600 }}>Nhấn "Tổng hợp GRI" để tạo báo cáo</div>
          <div style={{ fontSize:11, marginTop:6 }}>Dữ liệu từ 7 module: Hóa chất · Nước thải · Năng lượng · Chất thải · An toàn · Nhà thầu</div>
        </div>
      )}
      {loading&&<div style={{ textAlign:"center", padding:40 }}><Spinner size={32} color={T.violet}/><div style={{ marginTop:14, color:T.sub }}>Đang tổng hợp từ 7 module...</div></div>}

      {report&&(
        <div className="anim-fade">
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:16 }}>
            <KPICard icon="🌫" label="Tổng CO₂e Scope 1+2" value={fmt(report.total,2)} unit="tCO₂e" color={T.violet}/>
            <KPICard icon="⚡" label="Điện YTD" value={fmt(report.totalKwh/1000,1)} unit="MWh" color={T.amber}/>
            <KPICard icon="☣" label="CTNH" value={fmt(report.ctnh,3)} unit="tấn" color={T.red}/>
            <KPICard icon="🛡" label="Safety" value="96.1%" color={T.green}/>
          </div>
          {[
            { code:"GRI 302-1", title:"Năng lượng tiêu thụ", color:T.amber, rows:[["Điện",`${fmt(report.totalKwh/1000,2)} MWh`,"EVN"],["Nước",`${fmt(report.totalWater,0)} m³`,"GRI 303-1"]] },
            { code:"GRI 305-1&2", title:"Phát thải KNK (NPK-specific)", color:T.violet, rows:[["Scope 1 — NH₃→N₂O",`${fmt(report.s1n2o,6)} tCO₂e`,"GWP=273 IPCC AR6"],["Scope 1 — Dầu DO",`${fmt(report.s1do,4)} tCO₂e`,"2.556 kgCO₂/lít"],["Scope 2 — EVN",`${fmt(report.s2,4)} tCO₂e`,"HF VN 0.4457"],["TỔNG",`${fmt(report.total,4)} tCO₂e`,""]] },
            { code:"GRI 306", title:"Chất thải", color:T.red, rows:[["CTNH",`${fmt(report.ctnh,3)} tấn`,"Chân Lý+Cao Gia Quý"],["CN",`${fmt(report.cn,2)} tấn`,"Tái chế/Chôn lấp"]] },
            { code:"GRI 403-9", title:"An toàn & Nhà thầu", color:T.green, rows:[["Tuân thủ checklist","96.1%","Nội bộ+Nhà thầu"],["Tai nạn/Sự cố","2 (0 nghiêm trọng)","T1–T5/2026"]] },
          ].map(g=>(
            <div key={g.code} style={{ background:T.card, border:`1px solid ${g.color}33`, borderLeft:`4px solid ${g.color}`, borderRadius:12, padding:"14px 18px", marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <div><Mono c={T.dim} s={9}>{g.code}</Mono><div style={{ fontSize:13, fontWeight:700, color:T.text, marginTop:3 }}>{g.title}</div></div>
                <Pill label="✓ Auto-generated" color={g.color} size={9}/>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <tbody>{g.rows.map(([l,v,n])=>(
                  <tr key={l}>
                    <td style={{ padding:"5px 0", fontSize:11, color:T.sub, width:"38%" }}>{l}</td>
                    <td style={{ padding:"5px 10px", fontSize:15, fontWeight:800, color:g.color, textAlign:"right" }}>{v}</td>
                    <td style={{ padding:"5px 0", fontSize:10, color:T.dim }}>{n}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// MODULE: LAN TRUYỀN KHÍ THẢI — MÔ HÌNH GAUSS
// ═══════════════════════════════════════════════════════════════
// Giới hạn trung bình 1 giờ trong không khí xung quanh (μg/m³) — QCVN 05:2023/BTNMT.
// Số liệu phát thải mặc định là VÍ DỤ, cần thay bằng kết quả quan trắc thực tế.
const POLLUTANTS = [
  { id:"nh3", name:"NH₃",       limit:200,   cStack:50,  src:"Tháp hấp thụ khí thải tạo hạt" },
  { id:"tsp", name:"Bụi TSP",   limit:300,   cStack:80,  src:"Lọc bụi túi vải / cyclone" },
  { id:"so2", name:"SO₂",       limit:350,   cStack:300, src:"Ống khói lò hơi" },
  { id:"no2", name:"NO₂ (NOx)", limit:200,   cStack:250, src:"Ống khói lò hơi — coi toàn bộ NOx là NO₂" },
  { id:"co",  name:"CO",        limit:30000, cStack:400, src:"Ống khói lò hơi" },
];

const fmtN = (v, d=1) => Number.isFinite(v) ? v.toLocaleString("vi-VN", { maximumFractionDigits:d, minimumFractionDigits:0 }) : "—";
const fmtC = (v) => !Number.isFinite(v) ? "—" : v>=100 ? fmtN(v,0) : v>=10 ? fmtN(v,1) : v>=1 ? fmtN(v,2) : fmtN(v,3);
const fmtDist = (m) => m>=1000 ? `${fmtN(m/1000, m>=10000?1:2)} km` : `${fmtN(m,0)} m`;

function NumIn({ label, unit, value, onChange, step="any", min, hint }) {
  const [f, setF] = useState(false);
  return (
    <label style={{ display:"block", minWidth:0 }}>
      <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" }}>{label}</div>
      <div style={{ position:"relative" }}>
        <input type="number" step={step} min={min} value={value}
          onChange={e=>onChange(e.target.value===""?"":Number(e.target.value))}
          onFocus={()=>setF(true)} onBlur={()=>setF(false)}
          style={{ ...inputStyle(f), padding:"8px 11px", paddingRight:unit?58:11, fontVariantNumeric:"tabular-nums" }}/>
        {unit && <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", fontSize:10, color:T.dim, pointerEvents:"none", fontFamily:"'DM Mono',monospace" }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontSize:10, color:T.dim, marginTop:3 }}>{hint}</div>}
    </label>
  );
}

function SelIn({ label, value, onChange, options }) {
  return (
    <label style={{ display:"block", minWidth:0 }}>
      <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" }}>{label}</div>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{ ...inputStyle(false), padding:"8px 11px", cursor:"pointer" }}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function InGroup({ title, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:700, color:T.text, marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${T.border}` }}>{title}</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>{children}</div>
    </div>
  );
}

// Thang màu tuần tự một sắc (hổ phách): nền tối → sáng theo log10(C/Cmax), 3 bậc thập phân.
const RAMP = [[13,19,32],[92,58,10],[201,128,20],[255,194,77],[255,236,190]];
function rampColor(t) {
  const s = Math.max(0, Math.min(1, t)) * (RAMP.length-1);
  const i = Math.min(Math.floor(s), RAMP.length-2), f = s - i;
  return RAMP[i].map((c,k)=>Math.round(c + (RAMP[i+1][k]-c)*f));
}
const DECADES = 3;

function PlumeMap({ model, z, cRef, bg, limit, receptor, xPlot, yPlot }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const W = 760, Hc = 300, PAD = { l:58, r:12, t:12, b:28 };
  const pw = W-PAD.l-PAD.r, ph = Hc-PAD.t-PAD.b;
  const toX = px => (px/pw)*xPlot;
  const toY = py => yPlot - (py/ph)*2*yPlot;

  useEffect(()=>{
    const cv = ref.current; if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = W*dpr; cv.height = Hc*dpr;
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.fillStyle = T.card; ctx.fillRect(0,0,W,Hc);
    // Lưới nồng độ (mỗi ô 2 px)
    const step = 2, nx = Math.ceil(pw/step), ny = Math.ceil(ph/step);
    const img = ctx.createImageData(nx, ny);
    const over = new Uint8Array(nx*ny);
    const allow = limit - bg; // nồng độ mô hình được phép trước khi tổng vượt giới hạn
    for (let j=0;j<ny;j++) {
      const y = toY((j+.5)*step);
      for (let i=0;i<nx;i++) {
        const c = model.conc(toX((i+.5)*step), y, z);
        const k = (j*nx+i)*4;
        const t = c>0 && cRef>0 ? 1 + Math.log10(c/cRef)/DECADES : 0;
        const [r,g,b] = rampColor(t);
        img.data[k]=r; img.data[k+1]=g; img.data[k+2]=b; img.data[k+3]=255;
        if (limit>0 && c>=allow) over[j*nx+i]=1;
      }
    }
    const off = document.createElement("canvas"); off.width=nx; off.height=ny;
    off.getContext("2d").putImageData(img,0,0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, PAD.l, PAD.t, pw, ph);
    // Đường bao vùng vượt giới hạn
    ctx.fillStyle = T.red;
    for (let j=0;j<ny;j++) for (let i=0;i<nx;i++) {
      const o = over[j*nx+i];
      if (!o) continue;
      const edge = i===0||j===0||i===nx-1||j===ny-1||!over[j*nx+i-1]||!over[j*nx+i+1]||!over[(j-1)*nx+i]||!over[(j+1)*nx+i];
      if (edge) ctx.fillRect(PAD.l+i*step, PAD.t+j*step, step, step);
    }
    // Trục
    ctx.strokeStyle = T.border2; ctx.lineWidth = 1;
    ctx.strokeRect(PAD.l+.5, PAD.t+.5, pw-1, ph-1);
    ctx.fillStyle = T.dim; ctx.font = "10px 'DM Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (let k=0;k<=5;k++) { const xm = xPlot*k/5, px = PAD.l + pw*k/5; ctx.fillText(fmtDist(xm), Math.min(Math.max(px, PAD.l+18), W-PAD.r-22), PAD.t+ph+7); }
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (let k=0;k<=4;k++) { const ym = yPlot - 2*yPlot*k/4, py = PAD.t + ph*k/4; ctx.fillText(`${fmtN(ym,0)}`, PAD.l-6, py); }
    ctx.save(); ctx.translate(11, PAD.t+ph/2); ctx.rotate(-Math.PI/2); ctx.textAlign="center"; ctx.fillText("y ngang gió (m)", 0, 0); ctx.restore();
    // Ống khói, điểm cực đại, điểm nhận
    const sx = PAD.l, sy = PAD.t + ph/2;
    ctx.fillStyle = T.text; ctx.beginPath(); ctx.arc(sx+4, sy, 4, 0, 2*Math.PI); ctx.fill();
    if (receptor.x>=0 && receptor.x<=xPlot && Math.abs(receptor.y)<=yPlot) {
      const rx = PAD.l + receptor.x/xPlot*pw, ry = PAD.t + (yPlot-receptor.y)/(2*yPlot)*ph;
      ctx.strokeStyle = T.card; ctx.lineWidth = 2; ctx.fillStyle = T.cyan;
      ctx.beginPath(); ctx.arc(rx, ry, 5, 0, 2*Math.PI); ctx.fill(); ctx.stroke();
    }
  }, [model, z, cRef, bg, limit, receptor.x, receptor.y, xPlot, yPlot]);

  const onMove = e => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) * (W/r.width) - PAD.l, py = (e.clientY - r.top) * (Hc/r.height) - PAD.t;
    if (px<0||py<0||px>pw||py>ph) { setHover(null); return; }
    const x = toX(px), y = toY(py);
    setHover({ x, y, c:model.conc(x,y,z), left:(e.clientX-r.left), top:(e.clientY-r.top) });
  };

  return (
    <div style={{ position:"relative" }}>
      <canvas ref={ref} onMouseMove={onMove} onMouseLeave={()=>setHover(null)}
        role="img" aria-label="Bản đồ nồng độ mặt bằng theo hướng gió"
        style={{ width:"100%", height:"auto", aspectRatio:`${W}/${Hc}`, display:"block", borderRadius:10, cursor:"crosshair" }}/>
      {hover && (
        <div style={{ position:"absolute", left:Math.min(hover.left+12, 9999), top:hover.top+12, pointerEvents:"none", background:T.card2, border:`1px solid ${T.border2}`, borderRadius:8, padding:"7px 10px", fontSize:11, whiteSpace:"nowrap", zIndex:2, transform:hover.left>380?"translateX(calc(-100% - 24px))":"none" }}>
          <div style={{ color:T.sub, fontFamily:"'DM Mono',monospace", fontSize:10 }}>x = {fmtDist(hover.x)} · y = {fmtN(hover.y,0)} m</div>
          <div style={{ color:T.text, fontWeight:700, marginTop:3 }}>{fmtC(hover.c + bg)} μg/m³ <span style={{ color:T.sub, fontWeight:500 }}>(mô hình {fmtC(hover.c)} + nền {fmtC(bg)})</span></div>
        </div>
      )}
    </div>
  );
}

function DispersionModule() {
  const [pol, setPol] = useState("nh3");
  const P = POLLUTANTS.find(p=>p.id===pol);
  const [qMode, setQMode] = useState("stack");
  const [p, setP] = useState({
    cStack:50, flow:60000, qDirect:0.833, limit:200, bg:20,
    hs:25, d:1.2, vs:12, tsC:70,
    u10:2.5, taC:30, stability:"D", terrain:"rural", windProfile:true, riseMode:"final",
    sigmaScheme:"pg", z0:0.1, riseScheme:"isc3", avgTime:"", downwash:true, mixMode:"none", mixH:800, halfLife:"", sun:"moderate",
    efId:"urea-drum", efBasis:"unc", prod:20, ce:99,
    rx:500, ry:0, rz:1.5,
  });
  const set = k => v => setP(s=>({ ...s, [k]:v }));
  const n = v => (v===""||!Number.isFinite(v)) ? 0 : v;

  const choosePol = id => {
    const np = POLLUTANTS.find(x=>x.id===id);
    setPol(id); setP(s=>({ ...s, limit:np.limit, cStack:np.cStack }));
  };

  const ef = AP42_FACTORS.find(f=>f.id===p.efId);
  const efIsNH3 = pol==="nh3";
  const efValue = efIsNH3 ? ef.nh3U : (p.efBasis==="ctl" && ef.pmC!=null ? ef.pmC : ef.pmU);
  const efCE = efIsNH3 || p.efBasis==="unc" || ef.pmC==null ? n(p.ce) : 0;
  const Q = qMode==="stack" ? emissionRateFromStack(n(p.cStack), n(p.flow))
    : qMode==="ef" ? emissionRateFromFactor(n(p.prod), efValue, efCE) : n(p.qDirect);
  const model = useMemo(()=>buildModel({
    Q, u10:n(p.u10), stability:p.stability, terrain:p.terrain,
    hs:n(p.hs), d:n(p.d), vs:n(p.vs), Ts:celsiusToK(n(p.tsC)), Ta:celsiusToK(n(p.taC)),
    riseMode:p.riseMode, windProfile:p.windProfile, sigmaScheme:p.sigmaScheme, stackTipDownwash:p.downwash,
    mixingHeight: p.mixMode==="screen3" ? "screen3" : p.mixMode==="set" ? n(p.mixH) : null,
    halfLifeH: n(p.halfLife) || null, z0: n(p.z0) || 0.1, riseScheme:p.riseScheme, avgTimeMin: n(p.avgTime) || null,
  }), [Q, p.u10, p.stability, p.terrain, p.hs, p.d, p.vs, p.tsC, p.taC, p.riseMode, p.windProfile, p.sigmaScheme, p.downwash, p.mixMode, p.mixH, p.halfLife, p.z0, p.riseScheme, p.avgTime]);

  const z = n(p.rz), bg = n(p.bg), limit = n(p.limit);
  const mx = useMemo(()=>maxOnCenterline(model, z), [model, z]);
  const cPoint = model.conc(n(p.rx), n(p.ry), z);
  const totalPoint = cPoint + bg, totalMax = mx.c + bg;
  const pctPoint = limit>0 ? totalPoint/limit*100 : 0;
  const pctMax = limit>0 ? totalMax/limit*100 : 0;
  const sg = n(p.rx)>=X_MIN ? sigmas(n(p.rx), p.stability, p.terrain, p.sigmaScheme, n(p.z0)||0.1) : null;

  // Miền vẽ: tới ~3 lần khoảng cách cực đại, làm tròn đẹp
  const xPlot = useMemo(()=>{
    const raw = Math.min(Math.max(mx.x*3, 1000, n(p.rx)*1.2), 20000);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.ceil(raw/(mag/2))*(mag/2);
  }, [mx.x, p.rx]);
  const yPlot = useMemo(()=>{
    const raw = Math.max(sigmas(xPlot, p.stability, p.terrain, p.sigmaScheme, n(p.z0)||0.1).sy*2.5, 100);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.ceil(raw/(mag/2))*(mag/2);
  }, [xPlot, p.stability, p.terrain, p.sigmaScheme, p.z0]);

  const profile = useMemo(()=>{
    const pts = [];
    for (let i=0;i<=160;i++) {
      const x = X_MIN + (xPlot-X_MIN)*i/160;
      pts.push({ x:Math.round(x), c:+(model.conc(x,0,z)+bg).toPrecision(4) });
    }
    return pts;
  }, [model, z, bg, xPlot]);

  // Cảnh báo phạm vi áp dụng
  const warns = [];
  if (model.uClamped) warns.push(`Gió tại độ cao ống khói < ${U_MIN} m/s: mô hình Gauss không áp dụng cho lặng gió, đã dùng ${U_MIN} m/s.`);
  if ((p.stability==="A" && n(p.u10)>3) || (p.stability==="B" && n(p.u10)>5) || ((p.stability==="E"||p.stability==="F") && n(p.u10)>5))
    warns.push(`Lớp ổn định ${p.stability} ít gặp khi gió 10 m = ${fmtN(n(p.u10),1)} m/s — kiểm tra lại cách chọn lớp (mục 4 tài liệu).`);
  if (n(p.rx)>0 && (n(p.rx)<100 || n(p.rx)>10000)) warns.push("Điểm nhận nằm ngoài khoảng 100 m – 10 km: công thức Briggs kém tin cậy, cân nhắc AERMOD/CALPUFF.");
  if (mx.x<100 || mx.x>10000) warns.push(`Cực đại mặt đất ở ${fmtDist(mx.x)}, ngoài khoảng tin cậy 100 m – 10 km.`);
  if (p.downwash && model.hsAdj < n(p.hs) - 0.05) warns.push(`Cuốn xuống đỉnh ống khói: vₛ = ${fmtN(n(p.vs),1)} m/s < 1,5·u = ${fmtN(1.5*model.u,1)} m/s, chiều cao ống khói tính toán giảm còn ${fmtN(model.hsAdj,1)} m.`);
  if (Number.isFinite(model.L) && model.H(Math.max(mx.x,X_MIN)) > model.L) warns.push("Luồng khói cao hơn lớp xáo trộn: ISC3 coi nồng độ mặt đất bằng 0 — kiểm tra lại chiều cao lớp xáo trộn.");

  const status = limit<=0 ? null : pctMax>=100 ? "err" : pctMax>=80 ? "warn" : "ok";

  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, minWidth:0 };

  return (
    <div className="anim-fade">
      <AlertBox level="info" compact msg="Mô hình Gauss nguồn điểm theo thuật toán EPA ISC3: σy, σz Pasquill–Gifford (nông thôn) hoặc Briggs/McElroy–Pooler (đô thị); cuốn xuống đỉnh ống khói; độ nâng Briggs do lực nổi hoặc động lượng; phản xạ mặt đất và lớp xáo trộn; phân hủy. Kết quả xấp xỉ nồng độ trung bình 1 giờ — dùng để đánh giá nhanh, không thay thế mô hình pháp lý (AERMOD) khi lập ĐTM/GPMT."/>

      <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-start" }}>
        {/* ĐẦU VÀO */}
        <div style={{ ...card, flex:"1 1 300px", maxWidth:380 }}>
          <InGroup title="Chất ô nhiễm & phát thải">
            <div style={{ gridColumn:"1 / -1" }}>
              <SelIn label="Chất ô nhiễm" value={pol} onChange={choosePol} options={POLLUTANTS.map(x=>({ v:x.id, l:`${x.name} — ${x.src}` }))}/>
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <SelIn label="Cách nhập phát thải" value={qMode} onChange={setQMode} options={[{v:"stack",l:"Nồng độ khí thải × lưu lượng"},{v:"direct",l:"Lưu lượng phát thải Q (g/s)"},{v:"ef",l:"Hệ số phát thải AP-42 × sản lượng"}]}/>
            </div>
            {qMode==="stack" ? <>
              <NumIn label="Nồng độ khí thải" unit="mg/Nm³" value={p.cStack} onChange={set("cStack")} min={0}/>
              <NumIn label="Lưu lượng khí" unit="Nm³/h" value={p.flow} onChange={set("flow")} min={0}/>
            </> : qMode==="ef" ? <>
              <div style={{ gridColumn:"1 / -1" }}>
                <SelIn label="Công đoạn (EPA AP-42)" value={p.efId} onChange={set("efId")} options={AP42_FACTORS.map(f=>({ v:f.id, l:`${f.ref} — ${f.name}` }))}/>
              </div>
              <NumIn label="Sản lượng" unit="tấn/h" value={p.prod} onChange={set("prod")} min={0}/>
              {!efIsNH3 && <SelIn label="Hệ số bụi" value={p.efBasis} onChange={set("efBasis")} options={[{v:"unc",l:"Chưa kiểm soát × (1 − CE)"},{v:"ctl",l:ef.pmC!=null?`Đã kiểm soát (${ef.pmC} kg/t)`:"Đã kiểm soát (không có số liệu)"}]}/>}
              {(efIsNH3 || p.efBasis==="unc" || ef.pmC==null) && <NumIn label="Hiệu suất xử lý CE" unit="%" value={p.ce} onChange={set("ce")} min={0}/>}
              <div style={{ gridColumn:"1 / -1", fontSize:10, color:T.dim, lineHeight:1.5 }}>
                {efIsNH3?"NH₃":"Bụi"}: EF = {fmtN(efValue,4)} kg/tấn{efCE?` × (1 − ${fmtN(efCE,1)}%)`:""} — E = A × EF × (1 − CE/100) (NPI Eq. 8). AP-42 không có hệ số riêng cho tạo hạt NPK; chọn công đoạn gần nhất và ưu tiên số liệu quan trắc thực tế. {pol!=="nh3"&&pol!=="tsp"?"Hệ số này chỉ có cho bụi và NH₃.":""}
              </div>
            </> : <div style={{ gridColumn:"1 / -1" }}><NumIn label="Q" unit="g/s" value={p.qDirect} onChange={set("qDirect")} min={0}/></div>}
            <div style={{ gridColumn:"1 / -1", fontSize:11, color:T.sub }}>Q = <b style={{ color:T.text }}>{fmtN(Q,4)} g/s</b> ({fmtN(Q*3.6,3)} kg/h)</div>
          </InGroup>

          <InGroup title="Ống khói">
            <NumIn label="Chiều cao hₛ" unit="m" value={p.hs} onChange={set("hs")} min={0}/>
            <NumIn label="Đường kính d" unit="m" value={p.d} onChange={set("d")} min={0}/>
            <NumIn label="Vận tốc thoát vₛ" unit="m/s" value={p.vs} onChange={set("vs")} min={0}/>
            <NumIn label="Nhiệt độ khí thải" unit="°C" value={p.tsC} onChange={set("tsC")}/>
            <div style={{ gridColumn:"1 / -1" }}>
              <SelIn label="Độ nâng luồng khói Δh" value={p.riseMode} onChange={set("riseMode")} options={[
                {v:"final",l:"Briggs — độ nâng cuối cùng (mặc định EPA)"},
                {v:"gradual",l:"Briggs — tăng dần theo khoảng cách"},
                {v:"none",l:"Bỏ qua (H = hₛ)"},
              ]}/>
            </div>
          </InGroup>

          <InGroup title="Khí tượng">
            <NumIn label="Gió đo ở 10 m" unit="m/s" value={p.u10} onChange={set("u10")} min={0}/>
            <NumIn label="Nhiệt độ không khí" unit="°C" value={p.taC} onChange={set("taC")}/>
            <SelIn label="Lớp ổn định" value={p.stability} onChange={set("stability")} options={Object.entries(STABILITY_LABELS).map(([v,l])=>({v,l}))}/>
            <SelIn label="Địa hình" value={p.terrain} onChange={set("terrain")} options={[{v:"rural",l:"Nông thôn / trống trải"},{v:"urban",l:"Đô thị / công nghiệp"}]}/>
            <div style={{ gridColumn:"1 / -1", background:T.ghost, borderRadius:10, padding:"9px 10px", display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"end" }}>
              <SelIn label="Gợi ý lớp (Bảng 1.1 Pasquill)" value={p.sun} onChange={set("sun")} options={[
                {v:"strong",l:"Ngày — nắng mạnh"},{v:"moderate",l:"Ngày — nắng vừa"},{v:"slight",l:"Ngày — nắng yếu"},
                {v:"overcast",l:"Đêm — mây ≥ 50 %"},{v:"clear",l:"Đêm — ít mây ≤ 3/8"}]}/>
              {(()=>{ const k = pasquillClass(n(p.u10), p.sun); const first = k[0]; return (
                <Btn small outline color={T.green} onClick={()=>set("stability")(first)}>Lớp {k}{k.length>1?` → dùng ${first}`:""}</Btn>); })()}
            </div>
            <label style={{ gridColumn:"1 / -1", display:"flex", gap:8, alignItems:"center", fontSize:11, color:T.sub, cursor:"pointer" }}>
              <input type="checkbox" checked={p.windProfile} onChange={e=>set("windProfile")(e.target.checked)} style={{ accentColor:T.green }}/>
              Quy đổi gió về độ cao ống khói (hàm mũ EPA)
            </label>
          </InGroup>

          <InGroup title="Tùy chọn mô hình (ISC3 · Giáo trình)">
            <div style={{ gridColumn:"1 / -1" }}>
              <SelIn label="Hệ số phân tán σy, σz" value={p.sigmaScheme} onChange={set("sigmaScheme")} options={[{v:"pg",l:"Pasquill–Gifford (ISC3, mặc định)"},{v:"briggs",l:"Briggs (1973) vùng trống trải"},{v:"nl",l:"Hà Lan có độ nhám z₀ (Giáo trình, Bảng 1.2)"}]}/>
            </div>
            {p.sigmaScheme==="nl" && <>
              <NumIn label="Độ nhám z₀" unit="m" value={p.z0} onChange={set("z0")} min={0} hint="0,03 trống trải · 0,1 nông nghiệp · 0,5–1 KCN/đô thị"/>
              <div style={{ fontSize:10, color:T.dim, alignSelf:"center" }}>σy = a·x^b·z₀^0,2; σz = c·x^d·(10z₀)^(0,53x^−0,22)</div>
            </>}
            <div style={{ gridColumn:"1 / -1" }}>
              <SelIn label="Công thức độ nâng" value={p.riseScheme} onChange={set("riseScheme")} options={[{v:"isc3",l:"ISC3 — Briggs lực nổi/động lượng (ΔTc)"},{v:"textbook",l:"Giáo trình — theo hàm nhiệt Q_H (PT 1.9–1.13)"}]}/>
            </div>
            <NumIn label="Thời gian trung bình" unit="phút" value={p.avgTime} onChange={set("avgTime")} min={0} hint="Hiệu chỉnh σy (t/60)^0,3 — để trống = 60 phút"/>
            <div/>
            <SelIn label="Lớp xáo trộn" value={p.mixMode} onChange={set("mixMode")} options={[{v:"none",l:"Không giới hạn"},{v:"screen3",l:"SCREEN3 (320·u₁₀)"},{v:"set",l:"Nhập chiều cao"}]}/>
            {p.mixMode==="set" ? <NumIn label="Chiều cao xáo trộn" unit="m" value={p.mixH} onChange={set("mixH")} min={0}/> : <div/>}
            <NumIn label="Chu kỳ bán hủy" unit="giờ" value={p.halfLife} onChange={set("halfLife")} min={0} hint="Để trống = không phân hủy"/>
            <label style={{ display:"flex", gap:8, alignItems:"center", fontSize:11, color:T.sub, cursor:"pointer", alignSelf:"center" }}>
              <input type="checkbox" checked={p.downwash} onChange={e=>set("downwash")(e.target.checked)} style={{ accentColor:T.green }}/>
              Cuốn xuống đỉnh ống khói
            </label>
          </InGroup>

          <InGroup title="Điểm nhận & so sánh">
            <NumIn label="x xuôi gió" unit="m" value={p.rx} onChange={set("rx")} min={0}/>
            <NumIn label="y ngang gió" unit="m" value={p.ry} onChange={set("ry")}/>
            <NumIn label="Độ cao z" unit="m" value={p.rz} onChange={set("rz")} min={0} hint="1,5 m = vùng thở"/>
            <NumIn label="Nồng độ nền" unit="μg/m³" value={p.bg} onChange={set("bg")} min={0}/>
            <div style={{ gridColumn:"1 / -1" }}>
              <NumIn label="Giới hạn 1 giờ" unit="μg/m³" value={p.limit} onChange={set("limit")} min={0} hint="Theo QCVN 05:2023/BTNMT — đối chiếu bản gốc trước khi dùng"/>
            </div>
          </InGroup>
          <div style={{ fontSize:10, color:T.dim, lineHeight:1.5 }}>Số liệu mặc định là ví dụ minh họa — thay bằng kết quả quan trắc khí thải thực tế của nguồn.</div>
        </div>

        {/* KẾT QUẢ */}
        <div style={{ flex:"999 1 480px", minWidth:0, display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <KPICard label={`Tại điểm nhận (${fmtDist(n(p.rx))})`} value={fmtC(totalPoint)} unit="μg/m³" color={pctPoint>=100?T.red:pctPoint>=80?T.amber:T.green} sub={limit>0?`${fmtN(pctPoint,0)}% giới hạn · nền ${fmtC(bg)}`:undefined}/>
            <KPICard label="Cực đại trên trục gió" value={fmtC(totalMax)} unit="μg/m³" color={status==="err"?T.red:status==="warn"?T.amber:T.green} sub={`tại ${fmtDist(mx.x)} · ${fmtN(pctMax,0)}% giới hạn`}/>
            <KPICard label="Chiều cao hiệu dụng H" value={fmtN(model.H(Math.max(mx.x,X_MIN)),1)} unit="m" color={T.blue} sub={`hₛ ${fmtN(n(p.hs),1)} + Δh ${fmtN(model.H(Math.max(mx.x,X_MIN))-n(p.hs),1)} m`}/>
            <KPICard label="Gió tại ống khói" value={fmtN(model.u,2)} unit="m/s" color={T.cyan} sub={`F = ${fmtN(model.F,2)} m⁴/s³`}/>
          </div>

          {status==="err" && <AlertBox level="err" msg={`${P.name}: nồng độ cực đại (gồm nền) ${fmtC(totalMax)} μg/m³ vượt giới hạn 1 giờ ${fmtN(limit,0)} μg/m³ tại khoảng ${fmtDist(mx.x)} xuôi gió. Đường viền đỏ trên bản đồ là vùng vượt giới hạn.`}/>}
          {status==="warn" && <AlertBox level="warn" msg={`${P.name}: nồng độ cực đại ${fmtC(totalMax)} μg/m³ = ${fmtN(pctMax,0)}% giới hạn — sát ngưỡng, nên theo dõi.`}/>}
          {status==="ok" && <AlertBox level="ok" msg={`${P.name}: nồng độ cực đại (gồm nền) ${fmtC(totalMax)} μg/m³ = ${fmtN(pctMax,0)}% giới hạn 1 giờ — đạt.`}/>}
          {warns.map((w,i)=><AlertBox key={i} level="warn" compact msg={w}/>)}

          <div style={card}>
            <SectionHeader title="Bản đồ nồng độ mặt bằng" sub={`Độ cao z = ${fmtN(z,1)} m · nguồn ở gốc tọa độ, gió thổi theo trục x · rê chuột để đọc nồng độ`}/>
            <PlumeMap model={model} z={z} cRef={mx.c} bg={bg} limit={limit} receptor={{ x:n(p.rx), y:n(p.ry) }} xPlot={xPlot} yPlot={yPlot}/>
            <div style={{ display:"flex", gap:18, flexWrap:"wrap", alignItems:"center", marginTop:10, fontSize:10, color:T.sub }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span>Nồng độ mô hình</span>
                <div>
                  <div style={{ width:160, height:8, borderRadius:4, background:`linear-gradient(90deg, ${RAMP.map(c=>`rgb(${c.join(",")})`).join(",")})` }}/>
                  <div style={{ display:"flex", justifyContent:"space-between", fontFamily:"'DM Mono',monospace", fontSize:9, color:T.dim, marginTop:2 }}>
                    {[3,2,1,0].map(k=><span key={k}>{fmtC(mx.c/Math.pow(10,k))}</span>)}
                  </div>
                </div>
                <span>μg/m³</span>
              </div>
              {limit>0 && <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:14, height:0, borderTop:`2px solid ${T.red}` }}/>Biên vùng vượt giới hạn (gồm nền)</span>}
              <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:8, height:8, borderRadius:"50%", background:T.text }}/>Ống khói</span>
              <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:8, height:8, borderRadius:"50%", background:T.cyan }}/>Điểm nhận</span>
            </div>
          </div>

          <div style={{ ...card, paddingBottom:8 }}>
            <SectionHeader title="Nồng độ trên trục gió (y = 0), gồm nền" sub={`Độ cao z = ${fmtN(z,1)} m · μg/m³ theo khoảng cách xuôi gió`}/>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={profile} margin={{ top:6, right:16, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                <XAxis dataKey="x" type="number" domain={[0, xPlot]} ticks={[0,1,2,3,4,5].map(k=>xPlot*k/5)} tickFormatter={v=>fmtDist(v)} tick={{ fontSize:9, fill:T.dim }} stroke={T.border2}/>
                <YAxis tick={{ fontSize:9, fill:T.dim }} stroke={T.border2} domain={[0, dataMax=>Math.max(dataMax, limit*1.1)]} tickFormatter={v=>fmtN(v,0)}/>
                <Tooltip content={({ active, payload })=>active&&payload?.length ? (
                  <div style={{ background:T.card2, border:`1px solid ${T.border2}`, borderRadius:8, padding:"7px 10px", fontSize:11 }}>
                    <div style={{ color:T.sub, fontSize:10, fontFamily:"'DM Mono',monospace" }}>x = {fmtDist(payload[0].payload.x)}</div>
                    <div style={{ color:T.text, fontWeight:700, marginTop:3 }}>{fmtC(payload[0].value)} μg/m³</div>
                  </div>) : null}/>
                {limit>0 && <ReferenceLine y={limit} stroke={T.red} strokeDasharray="4 4" label={{ value:`Giới hạn ${fmtN(limit,0)}`, position:"insideTopRight", fontSize:9, fill:T.sub }}/>}
                <ReferenceLine x={Math.round(mx.x)} stroke={T.border2} strokeDasharray="2 3"/>
                <Line dataKey="c" type="monotone" stroke={T.amber} strokeWidth={2} dot={false} activeDot={{ r:4, fill:T.amber, stroke:T.card, strokeWidth:2 }} name="Nồng độ" isAnimationActive={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={card}>
            <SectionHeader title="Thông số trung gian" sub="Đối chiếu với tính tay hoặc phần mềm khác"/>
            <Table heads={["Thông số","Giá trị","Ghi chú"]} rows={[
              ["Lưu lượng phát thải Q", `${fmtN(Q,4)} g/s`, qMode==="stack"?`${fmtN(n(p.cStack),1)} mg/Nm³ × ${fmtN(n(p.flow),0)} Nm³/h ÷ 3,6·10⁶`:qMode==="ef"?`${fmtN(n(p.prod),1)} t/h × ${fmtN(efValue,4)} kg/t × (1 − ${fmtN(efCE,1)}%) ÷ 3,6 — ${ef.ref}`:"Nhập trực tiếp"],
              ["Gió tính toán u", `${fmtN(model.u,2)} m/s`, p.windProfile?`u₁₀·(hₛ/10)^p, p = ${windExponent(p.stability,p.terrain)}`:"Dùng gió 10 m"],
              ["Thông lượng nổi Fb · động lượng Fm", `${fmtN(model.F,3)} m⁴/s³ · ${fmtN(model.Fm,2)} m⁴/s²`, "Fb = g·vₛ·d²·ΔT/(4Tₛ); Fm = vₛ²·d²·Tₐ/(4Tₛ)"],
              ["Chiều cao ống sau cuốn xuống h'", `${fmtN(model.hsAdj,1)} m`, p.downwash?(model.hsAdj<n(p.hs)-0.05?"hₛ + 2d·(vₛ/u − 1,5)":"vₛ ≥ 1,5·u — không cuốn xuống"):"Tắt"],
              ["Độ nâng cuối cùng Δh", `${fmtN(model.rise.final,1)} m`, p.riseMode==="none"?"Không dùng":p.riseScheme==="textbook"?`Giáo trình: Q_H = ${fmtN(heatEmissionMW(n(p.vs),n(p.d),celsiusToK(n(p.tsC)),celsiusToK(n(p.taC))),3)} MW — ${model.rise.type==="momentum"?"nguồn lạnh, Stumke 1,5·vₛ·d/U":["E","F"].includes(p.stability)?"65·(Q_H/U)^⅓":"Briggs đơn giản hóa 109·Q_H^¾/U hoặc 143·Q_H^⅗/U"}`:model.rise.type==="momentum"?`Động lượng chi phối (ΔT = ${fmtN(n(p.tsC)-n(p.taC),1)} K < ΔTc = ${fmtN(model.rise.dTc,1)} K)`:model.rise.type==="buoyancy"?`Lực nổi chi phối (ΔTc = ${fmtN(model.rise.dTc,1)} K), đạt tại x ≈ ${fmtDist(model.rise.xFinal)}`:"—"],
              ["Lớp xáo trộn L", Number.isFinite(model.L)?`${fmtN(model.L,0)} m`:"Không giới hạn", p.mixMode==="screen3"?"SCREEN3: max(320·u₁₀, Hₑ + 1); E–F không giới hạn":p.mixMode==="set"?"Nhập":"Chỉ phản xạ mặt đất"],
              ["σy, σz tại điểm nhận", sg?`${fmtN(sg.sy*(n(p.avgTime)?Math.pow(n(p.avgTime)/60,0.3):1),1)} m · ${fmtN(sg.sz,1)} m`:"—", `${p.sigmaScheme==="nl"?`Hà Lan, z₀ = ${fmtN(n(p.z0)||0.1,2)} m`:p.terrain==="urban"?"Briggs/McElroy–Pooler, đô thị":p.sigmaScheme==="pg"?"Pasquill–Gifford (ISC3), nông thôn":"Briggs (1973), nông thôn"}, lớp ${p.stability}${n(p.avgTime)?`, σy × (${fmtN(n(p.avgTime),0)}/60)^0,3`:""}`],
              ["Nồng độ mô hình tại điểm nhận", `${fmtC(cPoint)} μg/m³`, `chưa cộng nền ${fmtC(bg)} μg/m³`],
              ["Cực đại trên trục gió", `${fmtC(mx.c)} μg/m³`, `x = ${fmtDist(mx.x)}, chưa cộng nền`],
            ].map(([a,b,c],i)=>(
              <tr key={i}><TD style={{ color:T.text, fontWeight:600 }}>{a}</TD><TD><Mono c={T.text}>{b}</Mono></TD><TD style={{ color:T.sub, fontSize:11 }}>{c}</TD></tr>
            ))}/>
            <div style={{ marginTop:12, fontSize:10, color:T.dim, lineHeight:1.6 }}>
              C = Q·K·V·D/(2π·uₛ·σy·σz) · exp(−y²/2σy²), K = 10⁶ μg/g; V: số hạng thẳng đứng (phản xạ mặt đất + phản xạ nhiều lần với lớp xáo trộn L); D = exp(−ψ·x/uₛ), ψ = 0,693/T½ (EPA ISC3 Vol. II).
              Không tính: lắng đọng khô/ướt, cuốn xuống do công trình (building downwash), địa hình phức tạp.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE: ĐÁNH GIÁ PHÁT TÁN — HỒ SƠ ĐIỀU CHỈNH GPMT NGUỒN SỐ 01 (LÒ HƠI)
// ═══════════════════════════════════════════════════════════════
// Số liệu mặc định lấy từ "BC_Dieu_chinh_GPMT_Lo_hoi_sinh_khoi_BinhDien_LongAn.docx" và
// "Phu-luc-sua-doi-GPMT-Lo-hoi-sinh-khoi-2026-11-20.docx". Giới hạn khí thải: QCVN 19:2009/BTNMT
// Cmax cột B, Kp = 0,8; Kv = 1,0 (theo GPMT 2986). Giới hạn 1 giờ không khí xung quanh: QCVN 05:2023/BTNMT.
const GP_POLL = [
  { id:"tsp", name:"Bụi tổng",  q19:160, q05:300 },
  { id:"so2", name:"SO₂",       q19:400, q05:350 },
  { id:"nox", name:"NO₂ (NOₓ)", q19:680, q05:200 },
  { id:"co",  name:"CO",        q19:800, q05:30000 },
];
const GP_LIMITS = { tsp:160, so2:400, nox:680, co:800 };
const GP_SCEN_DEFAULT = [
  { id:"s1", name:"Lò sinh khối — số liệu thiết kế", sched:"Thứ Hai – Thứ Sáu", flowMode:"N", tRef:0, flow:7000, tC:170,
    c:{ tsp:3.8, so2:59.5, nox:330, co:"" },
    src:"Bảng 2.2 báo cáo: 1.050 kg/h × 6,72 Nm³/kg ≈ 7.000 Nm³/h (Nm³ ở 0 °C theo tính toán cháy), 170 °C. CO chưa có số liệu nhà thầu (mục B1 ghi chú nội bộ)." },
  { id:"s2", name:"Lò sinh khối — xả bằng giới hạn GPMT", sched:"Thứ Hai – Thứ Sáu", flowMode:"A", tRef:25, flow:25000, tC:170,
    c:{ ...GP_LIMITS },
    src:"Kịch bản bảo thủ: lưu lượng xả lớn nhất cấp phép 25.000 m³/h (quạt 40.000 m³/h khống chế bằng biến tần), nồng độ bằng giới hạn QCVN 19:2009 cột B." },
  { id:"s3", name:"Lò than luân phiên — xả bằng giới hạn GPMT", sched:"Thứ Bảy – Chủ Nhật", flowMode:"A", tRef:25, flow:25000, tC:86,
    c:{ ...GP_LIMITS },
    src:"Quạt hút hiện hữu 25.000 m³/h, nồng độ bằng giới hạn GPMT. Nhiệt độ khí thải 86 °C theo phiếu 1461/2026/DV (30/6/2026)." },
  { id:"s4", name:"Lò than luân phiên — kết quả quan trắc", sched:"Thứ Bảy – Chủ Nhật", flowMode:"A", tRef:25, flow:19636, tC:86,
    c:{ tsp:19, so2:55, nox:34, co:79 },
    src:"Giá trị lớn nhất của 2 đợt quan trắc 2026 (TT Kỹ thuật TN&MT Tây Ninh, VILAS 269): phiếu 0731/2026/DV lấy mẫu 28/4 — bụi 16, NOₓ 34, SO₂ 55, CO 68 mg/Nm³, 19.636 m³/h; phiếu 1461/2026/DV lấy mẫu 30/6 — bụi 19, NOₓ 28, SO₂ 49, CO 79 mg/Nm³, 18.544 m³/h, 86 °C. Bổ sung các quý tiếp theo khi có." },
];
const GP_SHARED_DEFAULT = { taC:30, terrain:"rural", sigmaScheme:"pg", downwash:true, mixMode:"screen3", z:1.5, bg:{ tsp:"", so2:"", nox:"", co:"" }, q05:{ tsp:300, so2:350, nox:200, co:30000 }, recDist:"", bH:"", bW:"" };
const GP_STORE = "hse-gpmt01-v3";
const GPMT_STACK = { hs:18, d:0.7, x:"1172156", y:"580206", flowMax:25000 };

const num = v => (v===""||v===null||v===undefined||!Number.isFinite(Number(v))) ? null : Number(v);
const gpColor = pct => pct==null ? T.dim : pct>=100 ? T.red : pct>=80 ? T.amber : T.green;

function gpDerive(s, shared) {
  const flow = num(s.flow), tC = num(s.tC);
  if (flow==null || flow<=0 || tC==null) return null;
  const tRef = num(s.tRef) ?? 0;
  const flowN = s.flowMode==="N" ? flow : normalFlow(flow, tC, tRef);
  const flowA = s.flowMode==="N" ? actualFlow(flow, tC, tRef) : flow;
  const vs = exitVelocity(flowA, GPMT_STACK.d);
  const src = { terrain:shared.terrain, hs:GPMT_STACK.hs, d:GPMT_STACK.d, vs, Ts:celsiusToK(tC), Ta:celsiusToK(num(shared.taC) ?? 30), riseMode:"final", windProfile:true,
    sigmaScheme:shared.sigmaScheme ?? "pg", stackTipDownwash:shared.downwash ?? true, mixingHeight:(shared.mixMode ?? "screen3")==="screen3" ? "screen3" : null,
    z0: num(shared.z0) ?? 0.3, riseScheme: shared.riseScheme ?? "isc3" };
  const Q = {};
  for (const p of GP_POLL) { const c = num(s.c[p.id]); Q[p.id] = c==null ? null : emissionRateFromStack(c, flowN); }
  return { flowN, flowA, vs, src, Q };
}

function GpmtModule() {
  const load = () => { try { const s = JSON.parse(localStorage.getItem(GP_STORE)||"null"); if (s?.scen?.length===4 && s.shared) return s; } catch(e) {} return null; };
  const [state, setState] = useState(()=>load() || { scen:GP_SCEN_DEFAULT, shared:GP_SHARED_DEFAULT });
  useEffect(()=>{ try { localStorage.setItem(GP_STORE, JSON.stringify(state)); } catch(e) {} }, [state]);
  const { scen, shared } = state;
  const [sel, setSel] = useState("s3");
  const [pol, setPol] = useState("nox");
  const [copied, setCopied] = useState("");
  const textRef = useRef(null);

  const setScen = (id, patch) => setState(st=>({ ...st, scen:st.scen.map(s=>s.id===id?{ ...s, ...patch }:s) }));
  const setScenC = (id, pid, v) => setState(st=>({ ...st, scen:st.scen.map(s=>s.id===id?{ ...s, c:{ ...s.c, [pid]:v } }:s) }));
  const setShared = patch => setState(st=>({ ...st, shared:{ ...st.shared, ...patch } }));
  const reset = () => setState({ scen:GP_SCEN_DEFAULT, shared:GP_SHARED_DEFAULT });

  const z = num(shared.z) ?? 1.5;
  const bgOf = pid => num(shared.bg[pid]) ?? 0;
  const q05Of = pid => num(shared.q05[pid]);
  const recDist = num(shared.recDist);

  // Kết quả sàng lọc cho từng kịch bản (nồng độ tỷ lệ thuận Q → tính 1 lần cho Q = 1 g/s)
  const results = useMemo(()=>scen.map(s=>{
    const d = gpDerive(s, shared);
    if (!d) return { s, d:null };
    const scr = screenWorstCase(d.src, z);
    const rec = recDist && recDist>=X_MIN ? screenAtDistance(d.src, recDist, z) : null;
    const per = {};
    for (const p of GP_POLL) {
      if (d.Q[p.id]==null) { per[p.id]=null; continue; }
      const model = d.Q[p.id]*scr.worst.cPerQ, total = model + bgOf(p.id), lim = q05Of(p.id);
      const recModel = rec ? d.Q[p.id]*rec.cPerQ : null;
      per[p.id] = { model, total, pct: lim ? total/lim*100 : null,
        rec: rec ? { model:recModel, total:recModel+bgOf(p.id), pct: lim ? (recModel+bgOf(p.id))/lim*100 : null } : null,
        stackPct: num(s.c[p.id])/p.q19*100 };
    }
    return { s, d, scr, rec, per };
  }), [scen, shared, z, recDist]);

  const cur = results.find(r=>r.s.id===sel);
  const curPoll = GP_POLL.find(p=>p.id===pol);

  // Biểu đồ: cực đại theo lớp ổn định (đã chọn gió bất lợi nhất của mỗi lớp)
  const byClass = useMemo(()=>{
    if (!cur?.d || cur.d.Q[pol]==null) return [];
    return ["A","B","C","D","E","F"].map(k=>{
      const cs = cur.scr.cases.filter(c=>c.stability===k);
      const w = cs.reduce((a,b)=>b.cPerQ>a.cPerQ?b:a);
      return { cls:k, c:+(w.cPerQ*cur.d.Q[pol] + bgOf(pol)).toPrecision(4), u10:w.u10, x:w.x, worst:k===cur.scr.worst.stability };
    });
  }, [cur, pol, shared.bg]);

  // Bản đồ cho điều kiện bất lợi nhất của kịch bản/chất đang chọn
  const mapModel = useMemo(()=>{
    if (!cur?.d || cur.d.Q[pol]==null) return null;
    return buildModel({ ...cur.d.src, Q:cur.d.Q[pol], u10:cur.scr.worst.u10, stability:cur.scr.worst.stability });
  }, [cur, pol]);
  const mapMax = useMemo(()=>mapModel ? maxOnCenterline(mapModel, z) : null, [mapModel, z]);
  const xPlot = useMemo(()=>{
    if (!mapMax) return 1000;
    const raw = Math.min(Math.max(mapMax.x*4, 600, (recDist||0)*1.2), 10000);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.ceil(raw/(mag/2))*(mag/2);
  }, [mapMax, recDist]);
  const yPlot = useMemo(()=>{
    if (!cur?.d) return 100;
    const raw = Math.max(sigmas(xPlot, cur.scr.worst.stability, shared.terrain, shared.sigmaScheme ?? "pg", num(shared.z0) ?? 0.3).sy*2.5, 60);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.ceil(raw/(mag/2))*(mag/2);
  }, [xPlot, cur, shared.terrain]);

  // GEP
  const bH = num(shared.bH), bW = num(shared.bW);
  const gep = bH!=null && bW!=null && bH>0 && bW>0 ? gepHeight(bH, bW) : null;

  const nCases = Object.values(SCREEN_WINDS).reduce((a,w)=>a+w.length,0);
  const bgMissing = GP_POLL.every(p=>num(shared.bg[p.id])==null);
  const exceed = results.flatMap(r=>r.d ? GP_POLL.filter(p=>r.per[p.id]?.pct>=100).map(p=>({ r, p })) : []);
  const stackExceed = results.flatMap(r=>r.d ? GP_POLL.filter(p=>r.per[p.id] && r.per[p.id].stackPct>100).map(p=>({ r, p })) : []);

  // Văn bản cho hồ sơ
  const reportText = useMemo(()=>{
    const ok = results.filter(r=>r.d);
    const lines = [];
    lines.push(`Đánh giá khả năng phát tán bụi, khí thải từ nguồn số 01 (ống khói cao ${fmtN(GPMT_STACK.hs,0)} m, đường kính ${fmtN(GPMT_STACK.d*1000,0)} mm, tọa độ X = ${GPMT_STACK.x}; Y = ${GPMT_STACK.y}, VN2000) được thực hiện bằng mô hình vệt khói Gauss: thuật toán EPA ISC3: hệ số phân tán σy, σz ${(shared.sigmaScheme ?? "pg")==="nl"?`theo Mô hình quốc gia Hà Lan với độ nhám z₀ = ${fmtN(num(shared.z0) ?? 0.3,2)} m`:shared.terrain==="urban"?"Briggs/McElroy–Pooler (đô thị)":(shared.sigmaScheme ?? "pg")==="pg"?"Pasquill–Gifford (nông thôn)":"Briggs 1973 (nông thôn)"}, tốc độ gió quy đổi về độ cao miệng ống khói theo hàm mũ, ${(shared.downwash ?? true)?"hiệu chỉnh cuốn xuống đỉnh ống khói, ":""}${(shared.riseScheme ?? "isc3")==="textbook"?"độ nâng luồng khói theo hàm nhiệt Q_H (Briggs đơn giản hóa, Stumke cho nguồn lạnh), ":"độ nâng luồng khói Briggs do lực nổi hoặc động lượng (xác định theo chênh nhiệt điểm giao ΔTc), "}${(shared.mixMode ?? "screen3")==="screen3"?"phản xạ mặt đất và lớp xáo trộn theo SCREEN3 (320·u₁₀)":"phản xạ mặt đất"}. Điều kiện khí tượng bất lợi nhất được xác định bằng phương pháp sàng lọc ${nCases} tổ hợp lớp ổn định khí quyển (A–F) – tốc độ gió (1–20 m/s) theo hướng dẫn SCREEN3 của US EPA; nhiệt độ không khí ${fmtN(num(shared.taC)??30,0)} °C; điểm tiếp nhận ở độ cao ${fmtN(z,1)} m. Kết quả được so sánh với giá trị giới hạn trung bình 1 giờ của QCVN 05:2023/BTNMT${bgMissing?" (chưa cộng nồng độ nền)":", đã cộng nồng độ nền khu vực"}.`);
    for (const r of ok) {
      const parts = GP_POLL.filter(p=>r.per[p.id]).map(p=>`${p.name} ${fmtC(r.per[p.id].total)} μg/m³ (${fmtN(r.per[p.id].pct,0)}% giới hạn)`);
      lines.push(`- ${r.s.name} (${r.s.sched}; ${fmtN(r.d.flowN,0)} Nm³/h ở ${num(r.s.tRef)??0} °C, ${fmtN(num(r.s.tC),0)} °C, vận tốc thoát ${fmtN(r.d.vs,1)} m/s): nồng độ 1 giờ lớn nhất tại mặt đất ${parts.join("; ")}; xuất hiện ở khoảng cách ${fmtDist(r.scr.worst.x)} xuôi gió, điều kiện ổn định lớp ${r.scr.worst.stability}, gió 10 m ${fmtN(r.scr.worst.u10,1)} m/s.`);
      if (r.rec) lines.push(`  Tại khu dân cư gần nhất (${fmtDist(recDist)}): ${GP_POLL.filter(p=>r.per[p.id]).map(p=>`${p.name} ${fmtC(r.per[p.id].rec.total)} μg/m³`).join("; ")}.`);
    }
    if (exceed.length) lines.push(`Kết luận: kịch bản ${[...new Set(exceed.map(e=>e.r.s.name))].join(", ")} cho nồng độ ${[...new Set(exceed.map(e=>e.p.name))].join(", ")} vượt giới hạn 1 giờ QCVN 05:2023/BTNMT trong điều kiện khí tượng bất lợi nhất; cần sử dụng số liệu quan trắc thực tế hoặc bổ sung biện pháp giảm thiểu trước khi kết luận.`);
    else if (ok.length) lines.push(`Kết luận: trong mọi kịch bản vận hành và điều kiện khí tượng bất lợi nhất, nồng độ các chất ô nhiễm tại mặt đất đều thấp hơn giới hạn 1 giờ QCVN 05:2023/BTNMT.`);
    lines.push(`Giới hạn của phương pháp: mô hình Gauss sàng lọc cho địa hình bằng phẳng, nguồn liên tục ổn định; không xét cuốn xuống do công trình (building downwash), lắng đọng, chuyển hóa hóa học; NOₓ được coi toàn bộ là NO₂ (bảo thủ).`);
    return lines.join("\n");
  }, [results, shared, z, recDist, exceed.length]);

  const tableTSV = useMemo(()=>{
    const head = ["Kịch bản","Lịch vận hành","Nm³/h","°C","v (m/s)", ...GP_POLL.map(p=>`${p.name} (μg/m³)`), ...GP_POLL.map(p=>`${p.name} (% QCVN 05)`), "x max (m)","Lớp","Gió 10 m (m/s)"];
    const rows = results.filter(r=>r.d).map(r=>[r.s.name, r.s.sched, fmtN(r.d.flowN,0), fmtN(num(r.s.tC),0), fmtN(r.d.vs,1),
      ...GP_POLL.map(p=>r.per[p.id]?fmtC(r.per[p.id].total):"—"), ...GP_POLL.map(p=>r.per[p.id]?fmtN(r.per[p.id].pct,0):"—"),
      fmtN(r.scr.worst.x,0), r.scr.worst.stability, fmtN(r.scr.worst.u10,1)]);
    return [head, ...rows].map(r=>r.join("\t")).join("\n");
  }, [results]);

  const copy = async (txt, key) => {
    try { await navigator.clipboard.writeText(txt); setCopied(key); setTimeout(()=>setCopied(""), 2000); }
    catch(e) { if (textRef.current) { textRef.current.focus(); textRef.current.select(); } setCopied("sel"); }
  };

  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, minWidth:0 };
  const sc = scen.find(s=>s.id===sel), curD = cur?.d;

  return (
    <div className="anim-fade" style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Thông tin nguồn */}
      <div style={{ ...card, display:"flex", gap:20, flexWrap:"wrap", alignItems:"flex-start" }}>
        <div style={{ flex:"1 1 320px", minWidth:0 }}>
          <Syne s={14} style={{ display:"block" }}>Nguồn khí thải số 01 — lò hơi (GPMT 2986/GPMT-STNMT)</Syne>
          <div style={{ fontSize:11, color:T.sub, marginTop:6, lineHeight:1.7 }}>
            02 lò hơi vận hành <b style={{ color:T.text }}>luân phiên, không đồng thời</b>, dùng chung 01 ống khói: lò tầng sôi đốt sinh khối 6.000 kg hơi/h (Thứ Hai – Thứ Sáu) và lò than hiện hữu 8 tấn hơi/h (Thứ Bảy, Chủ Nhật). Mỗi kịch bản dưới đây là một chế độ vận hành, đánh giá riêng.
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(120px, 1fr))", gap:10, flex:"2 1 420px", minWidth:0 }}>
          {[["Ống khói", `${GPMT_STACK.hs} m · Ø${GPMT_STACK.d*1000} mm`],["Tọa độ VN2000", `X ${GPMT_STACK.x} · Y ${GPMT_STACK.y}`],["Lưu lượng xả lớn nhất", "25.000 m³/h"],["Giới hạn khí thải", "QCVN 19:2009 cột B, Kp 0,8; Kv 1,0"]].map(([k,v])=>(
            <div key={k} style={{ background:T.ghost, borderRadius:10, padding:"9px 11px" }}>
              <div style={{ fontSize:9, color:T.dim, textTransform:"uppercase", letterSpacing:".5px", fontWeight:700 }}>{k}</div>
              <div style={{ fontSize:12, color:T.text, fontWeight:600, marginTop:3 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bảng tổng hợp */}
      <div style={card}>
        <SectionHeader title="Kết quả sàng lọc — nồng độ 1 giờ lớn nhất tại mặt đất"
          sub={`${nCases} tổ hợp lớp ổn định × tốc độ gió (SCREEN3) · độ cao ${fmtN(z,1)} m · ${bgMissing?"chưa cộng nồng độ nền":"đã cộng nồng độ nền"} · % so với QCVN 05:2023 (1 giờ)`}
          action={<Btn small outline color={T.cyan} onClick={()=>copy(tableTSV,"tsv")}>{copied==="tsv"?"✓ Đã chép":"Chép bảng (dán vào Word/Excel)"}</Btn>}/>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:720 }}>
            <thead><tr>
              {["Kịch bản vận hành", ...GP_POLL.map(p=>p.name), "Điều kiện bất lợi nhất"].map(h=><th key={h} style={{ textAlign:"left", padding:"8px 10px", color:T.dim, fontSize:10, textTransform:"uppercase", letterSpacing:".5px", borderBottom:`1px solid ${T.border}`, whiteSpace:"nowrap" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {results.map(r=>(
                <tr key={r.s.id} onClick={()=>setSel(r.s.id)} style={{ cursor:"pointer", background:sel===r.s.id?`${T.green}0d`:"transparent" }}>
                  <td style={{ padding:"10px", borderBottom:`1px solid ${T.border}55`, borderLeft:`3px solid ${sel===r.s.id?T.green:"transparent"}` }}>
                    <div style={{ fontWeight:700, color:T.text }}>{r.s.name}</div>
                    <div style={{ fontSize:10, color:T.sub, marginTop:2 }}>{r.s.sched}{r.d?` · ${fmtN(r.d.flowN,0)} Nm³/h · ${fmtN(num(r.s.tC),0)} °C · ${fmtN(r.d.vs,1)} m/s`:""}</div>
                  </td>
                  {GP_POLL.map(p=>{
                    const v = r.per?.[p.id];
                    return <td key={p.id} style={{ padding:"10px", borderBottom:`1px solid ${T.border}55`, fontVariantNumeric:"tabular-nums" }}>
                      {!r.d ? <span style={{ fontSize:11, color:T.dim }}>chưa nhập</span>
                        : !v ? <span style={{ fontSize:11, color:T.dim }}>—</span>
                        : <div>
                            <div style={{ fontWeight:700, color:T.text }}>{fmtC(v.total)} <span style={{ fontSize:10, color:T.sub, fontWeight:500 }}>μg/m³</span></div>
                            <div style={{ marginTop:3 }}><Pill label={`${v.pct>=100?"✕ ":v.pct>=80?"! ":"✓ "}${fmtN(v.pct,0)}%`} color={gpColor(v.pct)} size={9}/></div>
                          </div>}
                    </td>;
                  })}
                  <td style={{ padding:"10px", borderBottom:`1px solid ${T.border}55`, fontSize:11, color:T.sub }}>
                    {r.d ? <>Lớp <b style={{ color:T.text }}>{r.scr.worst.stability}</b>, gió {fmtN(r.scr.worst.u10,1)} m/s<br/>tại {fmtDist(r.scr.worst.x)} · H = {fmtN(r.scr.worst.H,1)} m</> : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {recDist>0 && <div style={{ marginTop:10, fontSize:11, color:T.sub, lineHeight:1.7 }}>Tại khu dân cư gần nhất ({fmtDist(recDist)}, điều kiện bất lợi nhất tại khoảng cách đó): {results.filter(r=>r.rec).map(r=><div key={r.s.id}>• {r.s.name}: {GP_POLL.filter(p=>r.per[p.id]).map(p=>`${p.name} ${fmtC(r.per[p.id].rec.total)} μg/m³ (${fmtN(r.per[p.id].rec.pct,0)}%)`).join(" · ")}</div>)}</div>}
      </div>

      {exceed.length>0 && <AlertBox level="err" msg={`Vượt giới hạn 1 giờ QCVN 05:2023: ${exceed.map(e=>`${e.p.name} — ${e.r.s.name} (${fmtN(e.r.per[e.p.id].pct,0)}%)`).join("; ")}. Kịch bản “xả bằng giới hạn GPMT” là giả thiết bảo thủ; cần đối chiếu số liệu quan trắc thực tế (kịch bản 4) trước khi đưa vào hồ sơ.`}/>}
      {stackExceed.length>0 && <AlertBox level="err" msg={`Nồng độ tại ống khói vượt QCVN 19:2009 cột B: ${stackExceed.map(e=>`${e.p.name} — ${e.r.s.name}`).join("; ")}.`}/>}
      {bgMissing && <AlertBox level="warn" compact msg="Chưa nhập nồng độ nền: kết quả mới là phần đóng góp riêng của nguồn 01. Nhập kết quả quan trắc không khí xung quanh (báo cáo công tác BVMT) ở mục Thông số chung."/>}
      {gep!=null && GPMT_STACK.hs < gep && <AlertBox level="warn" msg={`Ống khói ${GPMT_STACK.hs} m thấp hơn chiều cao GEP ${fmtN(gep,1)} m (nhà xưởng cao ${fmtN(bH,1)} m, rộng ${fmtN(bW,1)} m): có nguy cơ cuốn xuống do công trình (downwash) — mô hình này chưa xét, nồng độ thực tế gần nguồn có thể cao hơn. Cân nhắc chạy AERMOD/SCREEN3 có downwash.`}/>}
      {gep!=null && GPMT_STACK.hs >= gep && <AlertBox level="ok" compact msg={`Ống khói ${GPMT_STACK.hs} m ≥ chiều cao GEP ${fmtN(gep,1)} m: ảnh hưởng cuốn xuống do công trình không đáng kể.`}/>}

      <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-start" }}>
        {/* Nhập liệu kịch bản */}
        <div style={{ ...card, flex:"1 1 320px", maxWidth:420 }}>
          <div style={{ display:"flex", gap:6, marginBottom:14 }}>
            {scen.map((s,i)=>(
              <button key={s.id} onClick={()=>setSel(s.id)} style={{ flex:"1 1 0", minWidth:0, padding:"7px 4px", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:700,
                background:sel===s.id?`${T.green}18`:T.ghost, color:sel===s.id?T.green:T.sub, border:`1px solid ${sel===s.id?T.green+"55":T.border}` }}>KB {i+1}</button>
            ))}
          </div>
          <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{sc.name}</div>
          <div style={{ fontSize:10, color:T.sub, marginTop:4, lineHeight:1.6, marginBottom:14 }}>{sc.src}</div>
          <InGroup title="Lưu lượng & nhiệt độ khí thải">
            <SelIn label="Đơn vị lưu lượng" value={sc.flowMode} onChange={v=>setScen(sc.id,{ flowMode:v })} options={[{v:"N",l:"Nm³/h (tiêu chuẩn)"},{v:"A",l:"m³/h (thực tế)"}]}/>
            <SelIn label="Điều kiện chuẩn Nm³" value={String(sc.tRef ?? 0)} onChange={v=>setScen(sc.id,{ tRef:Number(v) })} options={[{v:"25",l:"25 °C (QCVN 19:2009)"},{v:"0",l:"0 °C (tính toán cháy)"}]}/>
            <NumIn label="Lưu lượng" unit={sc.flowMode==="N"?"Nm³/h":"m³/h"} value={sc.flow} onChange={v=>setScen(sc.id,{ flow:v })} min={0}/>
            <NumIn label="Nhiệt độ khí thải" unit="°C" value={sc.tC} onChange={v=>setScen(sc.id,{ tC:v })}/>
            <div style={{ fontSize:11, color:T.sub, alignSelf:"end", paddingBottom:8 }}>
              {curD ? <>≈ {fmtN(curD.flowA,0)} m³/h · v = <b style={{ color:curD.vs>25?T.amber:T.text }}>{fmtN(curD.vs,1)} m/s</b></> : "—"}
            </div>
            {curD && curD.flowA>GPMT_STACK.flowMax*1.001 && <div style={{ gridColumn:"1 / -1", fontSize:10, color:T.red }}>Lưu lượng thực vượt lưu lượng xả lớn nhất cấp phép 25.000 m³/h.</div>}
          </InGroup>
          <InGroup title="Nồng độ khí thải tại ống khói (mg/Nm³)">
            {GP_POLL.map(p=>{
              const v = num(sc.c[p.id]);
              return <NumIn key={p.id} label={p.name} unit="mg/Nm³" value={sc.c[p.id]} onChange={x=>setScenC(sc.id,p.id,x)} min={0}
                hint={v==null?`QCVN 19: ${p.q19}`:`${fmtN(v/p.q19*100,0)}% QCVN 19 (${p.q19}) · Q = ${fmtN(curD?.Q[p.id]??0,4)} g/s`}/>;
            })}
          </InGroup>
          <div style={{ display:"flex", gap:8 }}>
            {sc.id!=="s4" && <Btn small outline color={T.sub} onClick={()=>setScen(sc.id,{ c:{ ...GP_LIMITS } })}>Điền giới hạn QCVN 19</Btn>}
            <Btn small outline color={T.sub} onClick={reset}>Khôi phục mặc định</Btn>
          </div>
        </div>

        {/* Biểu đồ & bản đồ */}
        <div style={{ flex:"999 1 480px", minWidth:0, display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ ...card, paddingBottom:8 }}>
            <SectionHeader title={`${curPoll.name} — cực đại theo lớp ổn định`} sub={`${sc.name} · mỗi cột là tốc độ gió bất lợi nhất của lớp đó · gồm nền`}
              action={<div style={{ display:"flex", gap:4 }}>{GP_POLL.map(p=>(
                <button key={p.id} onClick={()=>setPol(p.id)} style={{ padding:"5px 9px", borderRadius:8, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                  background:pol===p.id?T.amber+"22":"transparent", color:pol===p.id?T.amber:T.sub, border:`1px solid ${pol===p.id?T.amber+"66":T.border}` }}>{p.name}</button>))}</div>}/>
            {byClass.length ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byClass} margin={{ top:8, right:16, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                  <XAxis dataKey="cls" tick={{ fontSize:10, fill:T.sub }} stroke={T.border2} tickFormatter={v=>`Lớp ${v}`}/>
                  <YAxis tick={{ fontSize:9, fill:T.dim }} stroke={T.border2} domain={[0, dm=>Math.max(dm, (q05Of(pol)||0)*1.1)]} tickFormatter={v=>fmtN(v,0)}/>
                  <Tooltip cursor={{ fill:T.ghost }} content={({ active, payload })=>active&&payload?.length ? (
                    <div style={{ background:T.card2, border:`1px solid ${T.border2}`, borderRadius:8, padding:"7px 10px", fontSize:11 }}>
                      <div style={{ color:T.sub, fontSize:10 }}>Lớp {payload[0].payload.cls} · gió {fmtN(payload[0].payload.u10,1)} m/s · tại {fmtDist(payload[0].payload.x)}</div>
                      <div style={{ color:T.text, fontWeight:700, marginTop:3 }}>{fmtC(payload[0].value)} μg/m³</div>
                    </div>) : null}/>
                  {q05Of(pol) && <ReferenceLine y={q05Of(pol)} stroke={T.red} strokeDasharray="4 4" label={{ value:`QCVN 05: ${fmtN(q05Of(pol),0)}`, position:"insideTopRight", fontSize:9, fill:T.sub }}/>}
                  <Bar dataKey="c" radius={[4,4,0,0]} isAnimationActive={false}>
                    {byClass.map(d=><Cell key={d.cls} fill={d.worst?T.amber:T.amber+"66"}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div style={{ padding:"40px 0", textAlign:"center", fontSize:12, color:T.dim }}>Nhập lưu lượng, nhiệt độ và nồng độ {curPoll.name} cho kịch bản này để xem kết quả.</div>}
          </div>

          <div style={card}>
            <SectionHeader title="Bản đồ nồng độ — điều kiện bất lợi nhất" sub={mapModel ? `${curPoll.name} · lớp ${cur.scr.worst.stability}, gió 10 m ${fmtN(cur.scr.worst.u10,1)} m/s · ống khói ở gốc tọa độ, gió theo trục x · rê chuột để đọc` : "—"}/>
            {mapModel ? <>
              <PlumeMap model={mapModel} z={z} cRef={mapMax.c} bg={bgOf(pol)} limit={q05Of(pol)||0} receptor={{ x:recDist||-1, y:0 }} xPlot={xPlot} yPlot={yPlot}/>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginTop:8, fontSize:10, color:T.sub }}>
                <span>Màu: nồng độ mô hình, 3 bậc logarit dưới cực đại {fmtC(mapMax.c)} μg/m³</span>
                {q05Of(pol) && <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:14, borderTop:`2px solid ${T.red}` }}/>Vùng vượt QCVN 05 (gồm nền)</span>}
                {recDist>0 && <span style={{ display:"flex", alignItems:"center", gap:6 }}><span style={{ width:8, height:8, borderRadius:"50%", background:T.cyan }}/>Khu dân cư gần nhất</span>}
              </div>
            </> : <div style={{ padding:"30px 0", textAlign:"center", fontSize:12, color:T.dim }}>Chưa đủ số liệu.</div>}
          </div>
        </div>
      </div>

      {/* Thông số chung */}
      <div style={card}>
        <SectionHeader title="Thông số chung" sub="Áp dụng cho cả 4 kịch bản · được lưu trên trình duyệt này"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:12 }}>
          <NumIn label="Nhiệt độ không khí" unit="°C" value={shared.taC} onChange={v=>setShared({ taC:v })}/>
          <SelIn label="Địa hình" value={shared.terrain} onChange={v=>setShared({ terrain:v })} options={[{v:"rural",l:"Nông thôn"},{v:"urban",l:"Đô thị / công nghiệp"}]}/>
          <SelIn label="Hệ số phân tán σ" value={shared.sigmaScheme ?? "pg"} onChange={v=>setShared({ sigmaScheme:v })} options={[{v:"pg",l:"Pasquill–Gifford (ISC3)"},{v:"briggs",l:"Briggs (1973)"},{v:"nl",l:"Hà Lan, độ nhám z₀"}]}/>
          {(shared.sigmaScheme ?? "pg")==="nl" && <NumIn label="Độ nhám z₀" unit="m" value={shared.z0 ?? 0.3} onChange={v=>setShared({ z0:v })} min={0}/>}
          <SelIn label="Công thức độ nâng" value={shared.riseScheme ?? "isc3"} onChange={v=>setShared({ riseScheme:v })} options={[{v:"isc3",l:"ISC3 (ΔTc)"},{v:"textbook",l:"Giáo trình (Q_H)"}]}/>
          <SelIn label="Lớp xáo trộn" value={shared.mixMode ?? "screen3"} onChange={v=>setShared({ mixMode:v })} options={[{v:"screen3",l:"SCREEN3 (320·u₁₀)"},{v:"none",l:"Không giới hạn"}]}/>
          <label style={{ display:"flex", gap:8, alignItems:"center", fontSize:11, color:T.sub, cursor:"pointer", alignSelf:"end", paddingBottom:10 }}>
            <input type="checkbox" checked={shared.downwash ?? true} onChange={e=>setShared({ downwash:e.target.checked })} style={{ accentColor:T.green }}/>
            Cuốn xuống đỉnh ống khói
          </label>
          <NumIn label="Độ cao điểm tiếp nhận" unit="m" value={shared.z} onChange={v=>setShared({ z:v })} min={0}/>
          <NumIn label="Khu dân cư gần nhất" unit="m" value={shared.recDist} onChange={v=>setShared({ recDist:v })} min={0} hint="Khoảng cách từ ống khói"/>
          <NumIn label="Nhà xưởng cạnh ống khói — cao" unit="m" value={shared.bH} onChange={v=>setShared({ bH:v })} min={0} hint="Để kiểm tra chiều cao GEP"/>
          <NumIn label="Nhà xưởng — bề rộng" unit="m" value={shared.bW} onChange={v=>setShared({ bW:v })} min={0}/>
        </div>
        <div style={{ marginTop:14, overflowX:"auto" }}>
          <table style={{ borderCollapse:"collapse", fontSize:12, minWidth:520 }}>
            <thead><tr>{["Thông số","Nồng độ nền (μg/m³)","Giới hạn 1 giờ QCVN 05:2023 (μg/m³)","Giới hạn khí thải QCVN 19:2009 cột B (mg/Nm³)"].map(h=><th key={h} style={{ textAlign:"left", padding:"6px 10px", color:T.dim, fontSize:10, textTransform:"uppercase", letterSpacing:".5px", borderBottom:`1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
            <tbody>{GP_POLL.map(p=>(
              <tr key={p.id}>
                <td style={{ padding:"6px 10px", fontWeight:700, color:T.text }}>{p.name}</td>
                <td style={{ padding:"6px 10px", width:170 }}><NumIn value={shared.bg[p.id]} onChange={v=>setShared({ bg:{ ...shared.bg, [p.id]:v } })} unit="μg/m³" min={0}/></td>
                <td style={{ padding:"6px 10px", width:170 }}><NumIn value={shared.q05[p.id]} onChange={v=>setShared({ q05:{ ...shared.q05, [p.id]:v } })} unit="μg/m³" min={0}/></td>
                <td style={{ padding:"6px 10px", color:T.sub, fontFamily:"'DM Mono',monospace" }}>{p.q19}</td>
              </tr>))}
            </tbody>
          </table>
          <div style={{ fontSize:10, color:T.dim, marginTop:6 }}>Giới hạn QCVN 05:2023 điền sẵn theo trí nhớ — đối chiếu bản gốc trước khi dùng. NOₓ coi toàn bộ là NO₂ (bảo thủ).</div>
        </div>
      </div>

      {/* Văn bản cho hồ sơ */}
      <div style={card}>
        <SectionHeader title="Đoạn văn đưa vào hồ sơ (mục 2.2.2.c)" sub="Tự cập nhật theo số liệu ở trên · rà soát trước khi dán"
          action={<Btn small color={T.green} onClick={()=>copy(reportText,"txt")}>{copied==="txt"?"✓ Đã chép":"Chép đoạn văn"}</Btn>}/>
        <textarea ref={textRef} readOnly value={reportText} rows={12}
          style={{ ...inputStyle(false), fontSize:12, lineHeight:1.6, resize:"vertical", fontFamily:"'Outfit',sans-serif" }}/>
        {copied==="sel" && <div style={{ fontSize:10, color:T.amber, marginTop:4 }}>Trình duyệt chặn sao chép tự động — văn bản đã được chọn, nhấn Ctrl+C.</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE: NGUỒN THẤP · NGUỒN ĐƯỜNG · NGUỒN MẶT (Giáo trình, mục 1.2.3)
// ═══════════════════════════════════════════════════════════════
function ResultRow({ label, value, unit, sub, pct }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:10, padding:"7px 0", borderBottom:`1px solid ${T.border}66` }}>
      <div style={{ fontSize:11, color:T.sub, minWidth:0 }}>{label}{sub && <div style={{ fontSize:10, color:T.dim }}>{sub}</div>}</div>
      <div style={{ textAlign:"right", whiteSpace:"nowrap" }}>
        <span style={{ fontWeight:700, color:T.text, fontVariantNumeric:"tabular-nums" }}>{value}</span> <span style={{ fontSize:10, color:T.sub }}>{unit}</span>
        {pct!=null && <div style={{ marginTop:2 }}><Pill label={`${pct>=100?"✕":"✓"} ${fmtN(pct,0)}% QCVN 05`} color={pct>=100?T.red:pct>=80?T.amber:T.green} size={9}/></div>}
      </div>
    </div>
  );
}

function LowSourceModule() {
  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, minWidth:0 };
  const n = v => (v===""||v===null||!Number.isFinite(Number(v))) ? 0 : Number(v);
  const [lim, setLim] = useState(200);

  // 1. Nguồn thấp cạnh nhà rộng
  const [b, setB] = useState({ case:"downwind", Mgs:0.6, L:15, h:12, Hnh:10, Hgh:30, l:60, m:0.3, x:20, y:0, xs:"" });
  const sb = k => v => setB(s=>({ ...s, [k]:v }));
  const bIn = { M:n(b.Mgs)*1000, L:n(b.L), h:n(b.h), Hnh:n(b.Hnh), Hgh:n(b.Hgh), l:n(b.l), m:n(b.m), x:n(b.x), y:n(b.y) };
  const bOk = bIn.Hnh>0 && bIn.Hgh>bIn.Hnh && bIn.l>0;
  const bRes = bOk ? (b.case==="downwind" ? wideBuildingDownwind(bIn) : wideBuildingWake(bIn)) : null;
  const bProfile = useMemo(()=>{
    if (!bOk) return [];
    const pts = [];
    for (let i=1;i<=60;i++) {
      const x = i * Math.max(12*bIn.Hnh, 200) / 60;
      const r = b.case==="downwind" ? wideBuildingDownwind({ ...bIn, x, y:0 }) : wideBuildingWake({ ...bIn, x, y:0 });
      pts.push({ x:Math.round(x), c:+(r.Cx*1000).toPrecision(4) });
    }
    return pts;
  }, [b, bOk]);

  // 2. Nguồn đường
  const [r, setR] = useState({ M:0.002, u:2, H:0.5, x:100, l:500, y:0, cls:"D" });
  const sr = k => v => setR(s=>({ ...s, [k]:v }));
  const rRes = n(r.x)>=X_MIN && n(r.u)>0 ? lineSource(n(r.M), n(r.u), n(r.H), n(r.x), r.cls, n(r.l)>0?n(r.l):Infinity, n(r.y)) : null;

  // 3. Đường phố hẻm
  const [c, setC] = useState({ N:1200, u:1.5, x:5, z:1.5, W:20, bg:0.5, MW:28 });
  const sc = k => v => setC(s=>({ ...s, [k]:v }));
  const lee = canyonLeeward(n(c.N), n(c.u), n(c.x), n(c.z)) + n(c.bg);
  const wind = n(c.W)>0 ? canyonWindward(n(c.N), n(c.u), n(c.W)) + n(c.bg) : null;

  // 4. Nguồn mặt
  const [a, setA] = useState({ Mug:0.5, u:2, cls:"trung bình", halfL:1, bg:30, l:1500, H:600 });
  const sa = k => v => setA(s=>({ ...s, [k]:v }));
  const gh = n(a.u)>0 ? giffordHanna(n(a.Mug), n(a.u), a.cls, Math.max(n(a.halfL),1), n(a.bg)) : null;
  const box = n(a.u)>0 && n(a.H)>0 ? boxModel(n(a.Mug)*1e-6, n(a.l), n(a.u), n(a.H), n(a.bg)/1000)*1000 : null;

  const grid2 = { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10 };

  return (
    <div className="anim-fade" style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <AlertBox level="info" compact msg="Công thức theo Giáo trình Kiểm soát ô nhiễm không khí, mục 1.2.3: nguồn thấp cạnh nhà (Bảng 1.3, phương pháp Viện NCKH Nhà công nghiệp – Bảo hộ lao động Liên Xô cũ), nguồn đường (PT 1.48–1.50), đường phố hẻm (1.52–1.53), nguồn mặt (1.55, 1.57). Dùng để ước tính nhanh; hệ số k số hóa từ đồ thị Hình 1.6, hệ số m (Hình 1.8) nhập tay."/>
      <div style={{ display:"flex", gap:10, alignItems:"center", fontSize:11, color:T.sub }}>
        Giới hạn so sánh (QCVN 05:2023, 1 giờ) <div style={{ width:140 }}><NumIn value={lim} onChange={setLim} unit="μg/m³" min={0}/></div>
      </div>

      {/* 1. Nguồn thấp */}
      <div style={card}>
        <SectionHeader title="1. Nguồn thấp cạnh nhà rộng đứng độc lập (Bảng 1.3)" sub="Ống thải trên mái nhà xưởng; điểm tính sau tường khuất gió · u = 1 m/s theo giáo trình"/>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-start" }}>
          <div style={{ flex:"1 1 320px", minWidth:0 }}>
            <SelIn label="Vị trí ống thải" value={b.case} onChange={sb("case")} options={[
              {v:"downwind",l:"Ngoài vùng gió quẩn trên mái phía đón gió — PT 1.21–1.25 (cần hệ số m)"},
              {v:"wake",l:"Trong hoặc trên vùng gió quẩn sau nhà — PT 1.26–1.27"}]}/>
            <div style={{ ...grid2, marginTop:10 }}>
              <NumIn label="Tải lượng M" unit="g/s" value={b.Mgs} onChange={sb("Mgs")} min={0}/>
              <NumIn label="Lưu lượng L" unit="m³/s" value={b.L} onChange={sb("L")} min={0}/>
              <NumIn label="Cao miệng ống h" unit="m" value={b.h} onChange={sb("h")} min={0}/>
              <NumIn label="Cao nhà Hₙₕ" unit="m" value={b.Hnh} onChange={sb("Hnh")} min={0}/>
              <NumIn label="Cao giới hạn H_gh" unit="m" value={b.Hgh} onChange={sb("Hgh")} min={0} hint="Chiều cao giới hạn của nguồn thấp"/>
              <NumIn label="Dài nhà l (⊥ gió)" unit="m" value={b.l} onChange={sb("l")} min={0}/>
              {b.case==="downwind" && <NumIn label="Hệ số m (Hình 1.8)" value={b.m} onChange={sb("m")} min={0} hint="0,05–0,9 theo b̄ = b₃/Hₙₕ và x₁"/>}
              <NumIn label="x sau tường khuất gió" unit="m" value={b.x} onChange={sb("x")} min={0}/>
              <NumIn label="y ngang trục" unit="m" value={b.y} onChange={sb("y")}/>
            </div>
          </div>
          <div style={{ flex:"1 1 300px", minWidth:0 }}>
            {bRes ? <>
              <ResultRow label={`Trên trục gió Cx ${bRes.eq}`} value={fmtC(bRes.Cx*1000)} unit="μg/m³" pct={lim?bRes.Cx*1000/lim*100:null}
                sub={bRes.zone==="cavity"?`Trong vùng gió quẩn sau nhà (x ≤ 4Hₙₕ = ${fmtN(4*bIn.Hnh,0)} m)`:`Ngoài vùng gió quẩn (x > ${fmtN(4*bIn.Hnh,0)} m)`}/>
              <ResultRow label={`Tại y = ${fmtN(bIn.y,0)} m: Cy`} value={fmtC(bRes.Cy*1000)} unit="μg/m³"/>
              <ResultRow label="Độ cao tương đối H̄" value={fmtN(bRes.hBar,2)} unit="" sub="(h − Hₙₕ)/(H_gh − Hₙₕ)"/>
              <ResultRow label="Hệ số k (Hình 1.6)" value={fmtN(bRes.k,2)} unit="" sub={b.case==="wake"&&bIn.h<=bIn.Hnh?"Miệng ống trong vùng gió quẩn → k = 1":"Số hóa đồ thị, ±0,03"}/>
              <div style={{ marginTop:10 }}>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={bProfile} margin={{ top:6, right:12, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
                    <XAxis dataKey="x" type="number" tick={{ fontSize:9, fill:T.dim }} stroke={T.border2} tickFormatter={v=>`${v} m`}/>
                    <YAxis tick={{ fontSize:9, fill:T.dim }} stroke={T.border2} tickFormatter={v=>fmtN(v,0)}/>
                    <Tooltip content={({ active, payload })=>active&&payload?.length ? (
                      <div style={{ background:T.card2, border:`1px solid ${T.border2}`, borderRadius:8, padding:"6px 9px", fontSize:11 }}>
                        <div style={{ color:T.sub, fontSize:10 }}>x = {payload[0].payload.x} m</div>
                        <div style={{ color:T.text, fontWeight:700 }}>{fmtC(payload[0].value)} μg/m³</div></div>) : null}/>
                    {lim>0 && <ReferenceLine y={lim} stroke={T.red} strokeDasharray="4 4"/>}
                    <ReferenceLine x={4*bIn.Hnh} stroke={T.border2} strokeDasharray="2 3" label={{ value:"4Hₙₕ", position:"insideTopRight", fontSize:9, fill:T.sub }}/>
                    <Line dataKey="c" stroke={T.amber} strokeWidth={2} dot={false} isAnimationActive={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </> : <div style={{ fontSize:12, color:T.dim, padding:"20px 0" }}>Cần Hₙₕ &gt; 0, H_gh &gt; Hₙₕ và l &gt; 0.</div>}
          </div>
        </div>
        <div style={{ fontSize:10, color:T.dim, marginTop:10, lineHeight:1.6 }}>
          Ghi chú phiên dịch: mẫu số PT (1.22), (1.25) in "u.l.(1,4l+x)²" — dùng u·(1,4l+x)² cho đúng thứ nguyên; S₃₁ chưa được định nghĩa trong các trang đã có, lấy bằng S₃; Chú thích 2 (l &gt; 10Hₙₕ, y &gt; 5Hₙₕ) đã áp dụng. Các trường hợp nhà hẹp, cụm nhà chưa lập trình.
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))", gap:14 }}>
        {/* 2. Nguồn đường */}
        <div style={card}>
          <SectionHeader title="2. Nguồn đường (PT 1.48–1.50)" sub="Gió vuông góc nguồn; σy, σz Pasquill–Gifford"/>
          <div style={grid2}>
            <NumIn label="Tải lượng M" unit="g/s·m" value={r.M} onChange={sr("M")} min={0}/>
            <NumIn label="Gió u" unit="m/s" value={r.u} onChange={sr("u")} min={0}/>
            <NumIn label="Cao nguồn H" unit="m" value={r.H} onChange={sr("H")} min={0}/>
            <SelIn label="Lớp ổn định" value={r.cls} onChange={sr("cls")} options={Object.entries(STABILITY_LABELS).map(([v,l])=>({v,l}))}/>
            <NumIn label="Khoảng cách x" unit="m" value={r.x} onChange={sr("x")} min={0}/>
            <NumIn label="Dài nguồn l" unit="m" value={r.l} onChange={sr("l")} min={0} hint="0 hoặc trống = vô hạn"/>
          </div>
          <div style={{ marginTop:10 }}>
            {rRes ? <>
              <ResultRow label="Nồng độ mặt đất" value={fmtC(rRes.C*1000)} unit="μg/m³" pct={lim?rRes.C*1000/lim*100:null}/>
              <ResultRow label="Hệ số B′ (PT 1.49)" value={fmtN(rRes.Bp,4)} unit="" sub="B′ ≈ 1 khi l ≥ 2x → coi là dài vô hạn (Bảng 1.4)"/>
            </> : <div style={{ fontSize:12, color:T.dim }}>x ≥ {X_MIN} m, u &gt; 0.</div>}
          </div>
        </div>

        {/* 3. Đường phố hẻm */}
        <div style={card}>
          <SectionHeader title="3. Đường phố hẻm — CO (PT 1.51–1.53)" sub="Johnson và cs. (1971), gió thổi ngang qua đường"/>
          <div style={grid2}>
            <NumIn label="Số xe / 12 giờ N" value={c.N} onChange={sc("N")} min={0}/>
            <NumIn label="Gió u" unit="m/s" value={c.u} onChange={sc("u")} min={0}/>
            <NumIn label="x đến điểm tính" unit="m" value={c.x} onChange={sc("x")} min={0}/>
            <NumIn label="z độ cao" unit="m" value={c.z} onChange={sc("z")} min={0}/>
            <NumIn label="Rộng đường W" unit="m" value={c.W} onChange={sc("W")} min={0}/>
            <NumIn label="Nền C_nền" unit="ppm" value={c.bg} onChange={sc("bg")} min={0}/>
          </div>
          <div style={{ marginTop:10 }}>
            <ResultRow label="Phía khuất gió (1.52)" value={`${fmtN(lee,2)} ppm`} unit={`= ${fmtN(ppmToMgM3(lee,n(c.MW)),2)} mg/m³`}/>
            {wind!=null && <ResultRow label="Phía đón gió (1.53)" value={`${fmtN(wind,2)} ppm`} unit={`= ${fmtN(ppmToMgM3(wind,n(c.MW)),2)} mg/m³`}/>}
            <div style={{ fontSize:10, color:T.dim, marginTop:6, lineHeight:1.5 }}>Quy đổi ở 25 °C, CO: M = 28 g/mol. Hệ số 0,07 và đơn vị N (xe/12 giờ) chép nguyên giáo trình — với lưu lượng xe lớn kết quả cao bất thường, nên đối chiếu tài liệu gốc (Johnson và cs., 1971) trước khi dùng.</div>
          </div>
        </div>

        {/* 4. Nguồn mặt */}
        <div style={card}>
          <SectionHeader title="4. Nguồn mặt (PT 1.55, 1.57)" sub="Khu vực có nhiều nguồn nhỏ phân bố đều: bãi chứa, khu sản xuất"/>
          <div style={grid2}>
            <NumIn label="Cường độ phát thải M" unit="μg/m²·s" value={a.Mug} onChange={sa("Mug")} min={0}/>
            <NumIn label="Gió u" unit="m/s" value={a.u} onChange={sa("u")} min={0}/>
            <SelIn label="Cấp ổn định (Bảng 1.5)" value={a.cls} onChange={sa("cls")} options={Object.keys(PSI_TABLE).map(k=>({ v:k, l:k }))}/>
            <NumIn label="½ chiều dài khu vực" unit="km" value={a.halfL} onChange={sa("halfL")} min={0} hint="Bảng 1.5 có 1–100 km"/>
            <NumIn label="Dài dọc gió l (hộp)" unit="m" value={a.l} onChange={sa("l")} min={0}/>
            <NumIn label="Cao xáo trộn H (hộp)" unit="m" value={a.H} onChange={sa("H")} min={0}/>
            <NumIn label="Nồng độ nền" unit="μg/m³" value={a.bg} onChange={sa("bg")} min={0}/>
          </div>
          <div style={{ marginTop:10 }}>
            {gh!=null && <ResultRow label="Gifford–Hanna C = ψ·M/u + C_nền" value={fmtC(gh)} unit="μg/m³" pct={lim?gh/lim*100:null} sub={`ψ = ${fmtN(psi(a.cls, Math.max(n(a.halfL),1)),0)}`}/>}
            {box!=null && <ResultRow label="Hộp cố định C = C₀ + 10³·M·l/(u·H)" value={fmtC(box)} unit="μg/m³" pct={lim?box/lim*100:null}/>}
            <div style={{ fontSize:10, color:T.dim, marginTop:6 }}>Kết quả là nồng độ trung bình dài hạn trong khu vực; ψ nội suy theo log(½l), dưới 1 km lấy giá trị 1 km.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE: HUẤN LUYỆN ATVSLĐ 2026
// ═══════════════════════════════════════════════════════════════
const titleCaseVi = s => s.toLocaleLowerCase("vi").split(" ").map(w=>w ? w[0].toLocaleUpperCase("vi")+w.slice(1) : w).join(" ");
const fmtDateVi = iso => { const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; };
const HL_STORE = "hse-training2026-v1";

function TrainingModule() {
  const [sess, setSess] = useState("all");
  const [unit, setUnit] = useState("all");
  const [q, setQ] = useState("");
  const [cycle, setCycle] = useState(2);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(()=>{ try { return JSON.parse(localStorage.getItem(HL_STORE)||"{}"); } catch(e) { return {}; } });
  useEffect(()=>{ try { localStorage.setItem(HL_STORE, JSON.stringify(done)); } catch(e) {} }, [done]);

  const people = useMemo(()=>TRAINEES.map((t,i)=>({ ...t, key:`${t.s}#${i}`, display:titleCaseVi(t.name), session:SESSIONS.find(x=>x.id===t.s) })), []);
  const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/đ/gi,"d").toLowerCase();
  const rows = people.filter(p=>(sess==="all"||p.s===sess) && (unit==="all"||p.unit===unit) && (!q || norm(p.display+" "+p.dept).includes(norm(q))));

  const byDept = useMemo(()=>{
    const m = new Map();
    for (const p of rows) { const k = p.dept.replace(/^Sản xuất – .*/, "Sản xuất (các tổ)"); m.set(k, (m.get(k)||0)+1); }
    return [...m.entries()].sort((a,b)=>b[1]-a[1]);
  }, [rows]);
  const signed = rows.filter(p=>done[p.key]).length;
  const uniqueNames = new Set(people.map(p=>norm(p.display)+p.born)).size;
  const multi = useMemo(()=>{
    const m = new Map();
    for (const p of people) { const k = norm(p.display)+"|"+(p.born??""); m.set(k, [...(m.get(k)||[]), p]); }
    return [...m.values()].filter(v=>new Set(v.map(x=>x.s)).size>1);
  }, [people]);
  const due = s => { const d = new Date(s.date); d.setFullYear(d.getFullYear()+Number(cycle||2)); return d.toISOString().slice(0,10); };
  const today = new Date().toISOString().slice(0,10);

  const tsv = () => [["STT","Họ và tên","Năm sinh","Đơn vị","Bộ phận","Nhóm","Ngày huấn luyện","Hạn huấn luyện lại","Đã ký"],
    ...rows.map((p,i)=>[i+1,p.display,p.born??"",p.unit,p.dept,p.session.group,fmtDateVi(p.session.date),fmtDateVi(due(p.session)),done[p.key]?"x":""])].map(r=>r.join("\t")).join("\n");
  const copy = async () => { try { await navigator.clipboard.writeText(tsv()); setCopied(true); setTimeout(()=>setCopied(false), 2000); } catch(e) {} };

  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, minWidth:0 };
  return (
    <div className="anim-fade" style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <KPICard icon="👥" label="Lượt huấn luyện 2026" value={people.length} color={T.green} sub={`${uniqueNames} người · ${SESSIONS.length} lớp`}/>
        {SESSIONS.map(s=>(
          <KPICard key={s.id} label={`Nhóm ${s.group} · ${s.scope}`} value={people.filter(p=>p.s===s.id).length} unit="người" color={s.group===6?T.violet:s.group===5?T.cyan:T.blue} sub={`${fmtDateVi(s.date)} · ${s.time}`} onClick={()=>setSess(s.id)}/>
        ))}
      </div>

      <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-start" }}>
        <div style={{ ...card, flex:"999 1 560px" }}>
          <SectionHeader title="Danh sách học viên" sub={`${rows.length} người đang hiển thị · đã đánh dấu ký ${signed}/${rows.length}`}
            action={<Btn small outline color={T.cyan} onClick={copy}>{copied?"✓ Đã chép":"Chép danh sách (Excel)"}</Btn>}/>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:10, marginBottom:12 }}>
            <SelIn label="Lớp" value={sess} onChange={setSess} options={[{v:"all",l:"Tất cả"}, ...SESSIONS.map(s=>({ v:s.id, l:`Nhóm ${s.group} — ${s.scope} (${fmtDateVi(s.date)})` }))]}/>
            <SelIn label="Đơn vị" value={unit} onChange={setUnit} options={[{v:"all",l:"Tất cả"},{v:"Công ty",l:"Công ty"},{v:"Nhà máy",l:"Nhà máy"},{v:"Phòng Tổng hợp",l:"Phòng Tổng hợp"}]}/>
            <label style={{ display:"block", minWidth:0 }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" }}>Tìm tên / bộ phận</div>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="vd: nguyen van, bao ve" style={{ ...inputStyle(false), padding:"8px 11px" }}/>
            </label>
          </div>
          <div style={{ overflowX:"auto", maxHeight:520, overflowY:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:620 }}>
              <thead><tr>{["#","Họ và tên","Năm sinh","Bộ phận","Nhóm · ngày","Hạn HL lại","Đã ký"].map(h=>(
                <th key={h} style={{ position:"sticky", top:0, background:T.card, textAlign:"left", padding:"7px 9px", color:T.dim, fontSize:10, textTransform:"uppercase", letterSpacing:".5px", borderBottom:`1px solid ${T.border}` }}>{h}</th>))}</tr></thead>
              <tbody>{rows.map((p,i)=>{ const dd = due(p.session); return (
                <tr key={p.key} style={{ background:done[p.key]?`${T.green}08`:"transparent" }}>
                  <td style={{ padding:"6px 9px", color:T.dim, fontVariantNumeric:"tabular-nums" }}>{i+1}</td>
                  <td style={{ padding:"6px 9px", color:T.text, fontWeight:600 }}>{p.display}</td>
                  <td style={{ padding:"6px 9px", color:T.sub, fontVariantNumeric:"tabular-nums" }}>{p.born ?? <span style={{ color:T.amber }}>thiếu</span>}</td>
                  <td style={{ padding:"6px 9px", color:T.sub }}>{p.dept}</td>
                  <td style={{ padding:"6px 9px" }}><Pill label={`N${p.session.group} · ${fmtDateVi(p.session.date)}`} color={p.session.group===6?T.violet:p.session.group===5?T.cyan:T.blue} size={9}/></td>
                  <td style={{ padding:"6px 9px", color:dd<=today?T.red:T.sub, fontVariantNumeric:"tabular-nums" }}>{fmtDateVi(dd)}</td>
                  <td style={{ padding:"6px 9px" }}><input type="checkbox" aria-label={`Đã ký: ${p.display}`} checked={!!done[p.key]} onChange={e=>setDone(d=>({ ...d, [p.key]:e.target.checked }))} style={{ accentColor:T.green, width:15, height:15, cursor:"pointer" }}/></td>
                </tr>); })}</tbody>
            </table>
          </div>
        </div>

        <div style={{ flex:"1 1 280px", minWidth:0, display:"flex", flexDirection:"column", gap:14 }}>
          <div style={card}>
            <SectionHeader title="Theo bộ phận" sub="Theo bộ lọc hiện tại"/>
            {byDept.map(([k,v])=>(
              <div key={k} style={{ marginBottom:8 }}>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:3 }}><span style={{ color:T.sub }}>{k}</span><b style={{ color:T.text, fontVariantNumeric:"tabular-nums" }}>{v}</b></div>
                <ProgressBar val={v} max={byDept[0][1]} color={T.blue} h={4}/>
              </div>))}
          </div>
          <div style={card}>
            <SectionHeader title="Chu kỳ huấn luyện lại"/>
            <NumIn label="Định kỳ" unit="năm" value={cycle} onChange={setCycle} min={1} hint="Mặc định 2 năm — đối chiếu NĐ 44/2016/NĐ-CP (sửa đổi NĐ 140/2018) theo từng nhóm"/>
          </div>
          <div style={card}>
            <SectionHeader title="Ghi chú dữ liệu"/>
            <div style={{ fontSize:11, color:T.sub, lineHeight:1.6 }}>
              <div>• {multi.length} người có tên ở hơn một lớp (vd: an toàn vệ sinh viên nhóm 6 đồng thời học nhóm 4).</div>
              <div>• Nguyễn Văn Rì (Nhóm Dịch vụ) thiếu năm sinh; Nguyễn Trường Sơn (Nhóm Dịch vụ) chỉ có năm sinh.</div>
              <div>• Danh sách nhóm 6: số CCCD dòng 2 (Hứa Văn Vui) trùng dãy số dòng 1, dòng 5 (Kiều Thanh Truyền) chỉ 11 chữ số — cần kiểm tra lại bản gốc.</div>
              <div>• Danh sách nhóm 3 (an toàn điện, 28/09/2026) chưa có bản scan.</div>
              <div style={{ color:T.dim, marginTop:6 }}>Không lưu số CCCD và ngày sinh đầy đủ. Đánh dấu "đã ký" lưu trên trình duyệt này.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE: HỒ SƠ NHÀ MÁY & KIẾN THỨC
// ═══════════════════════════════════════════════════════════════
function FacilityModule() {
  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, minWidth:0 };
  const AREA_C = { "Môi trường":T.green, "Hóa chất":T.orange, "PCCC":T.red, "An toàn thiết bị":T.amber, "ATVSLĐ":T.violet, "Dự án":T.blue };
  return (
    <div className="anim-fade" style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ ...card, display:"flex", gap:20, flexWrap:"wrap" }}>
        <div style={{ flex:"1 1 320px", minWidth:0 }}>
          <Syne s={16} style={{ display:"block" }}>{PLANT.name}</Syne>
          <div style={{ fontSize:12, color:T.sub, marginTop:6, lineHeight:1.7 }}>{PLANT.company} · {PLANT.ceo}<br/>{PLANT.address}<br/><Mono c={T.text}>{PLANT.coord}</Mono></div>
        </div>
        <div style={{ flex:"1 1 320px", minWidth:0 }}>
          <div style={{ fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>Tiếp giáp</div>
          {PLANT.neighbors.map(([d,v])=>(
            <div key={d} style={{ display:"flex", gap:10, fontSize:12, padding:"4px 0" }}><b style={{ color:T.text, width:40, flexShrink:0 }}>{d}</b><span style={{ color:T.sub }}>{v}</span></div>))}
        </div>
      </div>

      <div style={card}>
        <SectionHeader title="Quy mô và công trình bảo vệ môi trường"/>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:10 }}>
          {PLANT.figures.map(([k,v])=>(
            <div key={k} style={{ background:T.ghost, borderRadius:10, padding:"9px 11px" }}>
              <div style={{ fontSize:9, color:T.dim, textTransform:"uppercase", letterSpacing:".5px", fontWeight:700 }}>{k}</div>
              <div style={{ fontSize:12, color:T.text, fontWeight:600, marginTop:3, lineHeight:1.4 }}>{v}</div>
            </div>))}
        </div>
      </div>

      <div style={card}>
        <SectionHeader title="Dây chuyền tạo hạt số 2 — Nguồn số 04 (hệ thống sấy nóng, xử lý bụi khí thải)" sub="BV CN-04-01/02 (10/2026) · bản vẽ lò đốt sấy nóng, bản vẽ hoàn công cyclone/túi vải · khí: lò đốt → cyclone chùm → quạt thổi → máy sấy → cyclone đơn → túi vải → quạt hút → ống khói 22 m"/>
        <Table heads={["Ký hiệu","Thiết bị","Đặc tính kỹ thuật","Tình trạng"]} rows={LINE2_EQUIPMENT.map(e=>(<tr key={e.id}><TD><Mono c={T.text} s={11}>{e.id}</Mono></TD><TD style={{ color:T.text, fontWeight:600, fontSize:12 }}>{e.name}</TD><TD style={{ color:T.sub, fontSize:11 }}>{e.spec}</TD><TD style={{ color:T.dim, fontSize:11 }}>{e.status}</TD></tr>))}/>
        <div style={{ fontSize:11, color:T.sub, marginTop:10, lineHeight:1.6 }}><b style={{ color:T.text }}>Mặt bằng thiết bị phân xưởng:</b> {LINE2_LAYOUT.join(" · ")}. Bản vẽ ghi 02 máy sấy (khô 1, khô 2); mô phỏng 3D mới đưa máy sấy khô 1 (Nguồn 04) vào vận hành.</div>
      </div>
      <div style={card}>
        <SectionHeader title="So sánh thiết bị lò đốt sinh khối – hệ thống sấy nóng (hiện hữu than → điều chỉnh 2026)" sub="Bảng so sánh cập nhật 29/06/2026 · dây chuyền tạo hạt thùng quay urê hóa lỏng số 2"/>
        <Table heads={["Thiết bị","Hiện hữu","Điều chỉnh 2026"]} rows={FURNACE_COMPARE.map(r=>(<tr key={r[0]}><TD style={{ color:T.text, fontWeight:600, fontSize:12 }}>{r[0]}</TD><TD style={{ color:T.sub, fontSize:11 }}>{r[1]}</TD><TD style={{ color:T.sub, fontSize:11 }}>{r[2]}</TD></tr>))}/>
      </div>
      <div style={card}>
        <SectionHeader title="Cải tạo HTXLNT 120 m³/ngày.đêm — khảo sát Global Green" sub="Khảo sát 09/09/2026 · báo cáo 14/10/2026"/>
        <div style={{ fontSize:11, color:T.sub, lineHeight:1.7 }}>
          <div><b style={{ color:T.text }}>Hiện hữu:</b> {WWTP_RETROFIT.before}</div>
          <div style={{ marginTop:6 }}><b style={{ color:T.text }}>Sau cải tạo:</b> {WWTP_RETROFIT.after}</div>
          {WWTP_RETROFIT.changes.map((c,i)=><div key={i}>• {c}</div>)}
          <div style={{ marginTop:6 }}>{WWTP_RETROFIT.jar}</div>
        </div>
        <div style={{ fontSize:10, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:".5px", margin:"12px 0 4px" }}>Nước thải đầu vào 2021–2022 (08 mẫu) so với QCVN 14:2025/BTNMT Bảng 2 cột A</div>
        <Table heads={["Chỉ tiêu","Đơn vị","Nhỏ nhất","Lớn nhất","Trung bình","Giới hạn"]} rows={WWTP_RETROFIT.influent.map(r=>(<tr key={r[0]}><TD style={{ color:T.text, fontWeight:600 }}>{r[0]}</TD>{r.slice(1).map((v,i)=><TD key={i} style={{ color:T.sub, fontSize:11 }}>{v}</TD>)}</tr>))}/>
      </div>
      <div style={card}>
        <SectionHeader title="Hệ thống tháp hấp thụ NH₃ — BOQ" sub={`Tổng dự toán ${NH3_TOWER_BOQ.total.toLocaleString("vi-VN")} đồng`}/>
        <Table heads={["Hạng mục","Thành tiền (đồng)"]} rows={NH3_TOWER_BOQ.parts.map(([n,v])=>(<tr key={n}><TD style={{ color:T.text, fontSize:12 }}>{n}</TD><TD><Mono c={T.text} s={11}>{Number(v).toLocaleString("vi-VN")}</Mono></TD></tr>))}/>
        <div style={{ fontSize:11, color:T.sub, marginTop:8 }}>{NH3_TOWER_BOQ.notes}</div>
      </div>

      <div style={card}>
        <SectionHeader title="Gói thầu lò hơi sinh khối 6 t/h" sub={`E-TBMT ${BOILER_TENDER.code} · mở thầu ${BOILER_TENDER.opened}`}/>
        <Table heads={["Nhà thầu","Giá chào (gồm VAT, đồng)"]} rows={BOILER_TENDER.bids.map(([n,v])=>(<tr key={n}><TD style={{ color:T.text, fontWeight:600 }}>{n}</TD><TD><Mono c={T.text} s={11}>{Number(v).toLocaleString("vi-VN")}</Mono></TD></tr>))}/>
        <div style={{ fontSize:11, color:T.sub, marginTop:8 }}>{BOILER_TENDER.note}</div>
      </div>

      <AlertBox level="warn" msg={<span><b>Số liệu chưa thống nhất giữa các tài liệu:</b>{DATA_GAPS.map((g,i)=><span key={i} style={{ display:"block", marginTop:4 }}>• {g}</span>)}</span>}/>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(360px, 1fr))", gap:14 }}>
        <div style={card}>
          <SectionHeader title="Văn bản nội bộ và hồ sơ pháp lý" sub={`${DOCUMENTS.length} văn bản`}/>
          {DOCUMENTS.map(d=>(
            <div key={d.no} style={{ padding:"8px 0", borderBottom:`1px solid ${T.border}66` }}>
              <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                <Mono c={T.text} s={11}>{d.no}</Mono><span style={{ fontSize:10, color:T.dim }}>{d.date}</span><Pill label={d.area} color={AREA_C[d.area]||T.sub} size={9}/>
              </div>
              <div style={{ fontSize:11, color:T.sub, marginTop:3, lineHeight:1.5 }}>{d.title}</div>
            </div>))}
        </div>
        <div style={card}>
          <SectionHeader title="Hóa chất cần kiểm soát" sub="Biện pháp phòng ngừa, ứng phó sự cố hóa chất 2026 · nhóm nguy hiểm chính: 8 (ăn mòn), 3 (dễ cháy), 5.1 (oxy hóa)"/>
          <Table heads={["Hóa chất","Đặc tính nguy hiểm","Ghi chú"]} rows={CONTROLLED_CHEMICALS.map(c=>(
            <tr key={c.name}><TD style={{ color:T.text, fontWeight:600 }}>{c.name}</TD><TD style={{ color:T.sub, fontSize:11 }}>{c.hazard}</TD><TD style={{ color:T.dim, fontSize:11 }}>{c.note}</TD></tr>))}/>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:14 }}>
        {SAFETY_RULES.map(r=>(
          <div key={r.title} style={card}>
            <div style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>{r.title}</div>
            {r.items.map((it,i)=><div key={i} style={{ fontSize:11, color:T.sub, lineHeight:1.6 }}>• {it}</div>)}
          </div>))}
      </div>

      <div style={card}>
        <SectionHeader title="Căn cứ pháp lý chính"/>
        {LEGAL_BASIS.map(([k,v])=>(
          <div key={k} style={{ display:"flex", gap:12, padding:"6px 0", borderBottom:`1px solid ${T.border}66`, flexWrap:"wrap" }}>
            <b style={{ fontSize:11, color:T.text, width:110, flexShrink:0 }}>{k}</b><span style={{ fontSize:11, color:T.sub, flex:"1 1 300px" }}>{v}</span>
          </div>))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MODULE: BIỂU MẪU & HỒ SƠ ISO 14001
// ═══════════════════════════════════════════════════════════════
const FORM_STORE = "hse-isoforms-v1";
const fmtCell = (f, v) => f?.type==="check" ? (v ? "✓" : "—") : f?.type==="date" && v ? fmtDateVi(v) : (v ?? "");

function DigitalForm({ def, records, setRecords }) {
  const blank = () => Object.fromEntries(def.fields.map(f=>[f.k, f.type==="check" ? false : f.k==="date" ? new Date().toISOString().slice(0,10) : ""]));
  const [rec, setRec] = useState(blank);
  const [editIdx, setEditIdx] = useState(null);
  const [copied, setCopied] = useState(false);
  useEffect(()=>{ setRec(blank()); setEditIdx(null); }, [def.code]);
  const warns = def.fields.map(f=>f.warn?.(rec[f.k], rec)).filter(Boolean);
  const missing = def.fields.filter(f=>f.required && (rec[f.k]===""||rec[f.k]==null)).map(f=>f.label);
  const save = () => {
    if (missing.length) return;
    const r = { ...rec, _ts: Date.now() };
    setRecords(list => editIdx==null ? [r, ...list] : list.map((x,i)=>i===editIdx ? r : x));
    setRec(blank()); setEditIdx(null);
  };
  const tsv = () => [def.fields.map(f=>f.label), ...records.map(r=>def.fields.map(f=>String(fmtCell(f, r[f.k])).replace(/\s+/g," ")))].map(r=>r.join("\t")).join("\n");
  const copy = async () => { try { await navigator.clipboard.writeText(tsv()); setCopied(true); setTimeout(()=>setCopied(false), 2000); } catch(e) {} };
  const recWarn = r => def.fields.some(f=>f.warn?.(r[f.k], r));
  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, minWidth:0 };

  return (
    <div style={{ display:"flex", gap:14, flexWrap:"wrap", alignItems:"flex-start" }}>
      <div style={{ ...card, flex:"1 1 340px", maxWidth:520 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}><Mono c={T.green} s={12}>{def.code}</Mono><span style={{ fontSize:10, color:T.dim }}>{def.source}</span></div>
        <Syne s={14} style={{ display:"block", marginTop:4 }}>{def.title}</Syne>
        <div style={{ fontSize:11, color:T.sub, lineHeight:1.6, margin:"6px 0 14px" }}>{def.purpose}</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {def.fields.map(f=>{
            const w = f.warn?.(rec[f.k], rec);
            const lab = <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase", letterSpacing:".5px" }}>{f.label}{f.required && <span style={{ color:T.red }}> *</span>}{f.unit && <span style={{ color:T.dim, textTransform:"none" }}> ({f.unit})</span>}</div>;
            const st = { ...inputStyle(false), padding:"8px 11px", borderColor:w?T.amber:T.border };
            const span = f.wide || f.type==="textarea" || f.type==="check" ? { gridColumn:"1 / -1" } : {};
            if (f.type==="check") return (
              <label key={f.k} style={{ ...span, display:"flex", gap:8, alignItems:"center", fontSize:12, color:T.text, cursor:"pointer" }}>
                <input type="checkbox" checked={!!rec[f.k]} onChange={e=>setRec(r=>({ ...r, [f.k]:e.target.checked }))} style={{ accentColor:T.green, width:16, height:16 }}/>{f.label}
              </label>);
            return (
              <label key={f.k} style={{ display:"block", minWidth:0, ...span }}>{lab}
                {f.type==="select" ? <select value={rec[f.k]} onChange={e=>setRec(r=>({ ...r, [f.k]:e.target.value }))} style={{ ...st, cursor:"pointer" }}><option value="">— chọn —</option>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select>
                  : f.type==="textarea" ? <textarea rows={2} value={rec[f.k]} onChange={e=>setRec(r=>({ ...r, [f.k]:e.target.value }))} style={{ ...st, resize:"vertical" }}/>
                  : <input type={f.type} step="any" value={rec[f.k]} onChange={e=>setRec(r=>({ ...r, [f.k]:e.target.value }))} style={st}/>}
                {w && <div style={{ fontSize:10, color:T.amber, marginTop:3 }}>⚠ {w}</div>}
              </label>);
          })}
        </div>
        {warns.length>0 && <div style={{ marginTop:12 }}><AlertBox level="warn" compact msg={`${warns.length} giá trị bất thường — ghi rõ biện pháp xử lý ở ô sự cố; báo Cán bộ phụ trách Môi trường.`}/></div>}
        <div style={{ display:"flex", gap:8, marginTop:12, alignItems:"center", flexWrap:"wrap" }}>
          <Btn small color={T.green} onClick={save} disabled={missing.length>0}>{editIdx==null ? "Lưu bản ghi" : "Cập nhật bản ghi"}</Btn>
          {editIdx!=null && <Btn small outline color={T.sub} onClick={()=>{ setRec(blank()); setEditIdx(null); }}>Hủy sửa</Btn>}
          {missing.length>0 && <span style={{ fontSize:10, color:T.dim }}>Còn thiếu: {missing.join(", ")}</span>}
        </div>
      </div>

      <div style={{ ...card, flex:"999 1 480px" }}>
        <SectionHeader title={`Sổ ghi — ${records.length} bản ghi`} sub="Lưu trên trình duyệt này · bấm một dòng để sửa · ⚠ = có giá trị bất thường"
          action={records.length>0 && <Btn small outline color={T.cyan} onClick={copy}>{copied?"✓ Đã chép":"Chép sổ (Excel)"}</Btn>}/>
        {records.length===0 ? <div style={{ padding:"30px 0", textAlign:"center", fontSize:12, color:T.dim }}>Chưa có bản ghi. Điền phiếu bên trái và bấm "Lưu bản ghi".</div> : (
          <div style={{ overflowX:"auto", maxHeight:520, overflowY:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11.5, minWidth:560 }}>
              <thead><tr>{["", ...def.listCols.map(k=>def.fields.find(f=>f.k===k)?.label), ""].map((h,i)=>(
                <th key={i} style={{ position:"sticky", top:0, background:T.card, textAlign:"left", padding:"6px 8px", color:T.dim, fontSize:9.5, textTransform:"uppercase", letterSpacing:".4px", borderBottom:`1px solid ${T.border}` }}>{h}</th>))}</tr></thead>
              <tbody>{records.map((r,i)=>(
                <tr key={r._ts||i} onClick={()=>{ setRec({ ...blank(), ...r }); setEditIdx(i); }} style={{ cursor:"pointer", background:editIdx===i?`${T.green}10`:"transparent" }}>
                  <td style={{ padding:"6px 8px", color:T.amber }}>{recWarn(r)?"⚠":""}</td>
                  {def.listCols.map(k=>{ const f = def.fields.find(x=>x.k===k); const v = String(fmtCell(f, r[k])); return <td key={k} style={{ padding:"6px 8px", color:T.text, maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={v}>{v}</td>; })}
                  <td style={{ padding:"6px 8px" }}><button onClick={e=>{ e.stopPropagation(); setRecords(list=>list.filter((_,j)=>j!==i)); if (editIdx===i) { setEditIdx(null); setRec(blank()); } }} style={{ background:"none", border:"none", color:T.dim, cursor:"pointer", fontSize:13 }} aria-label="Xóa bản ghi">×</button></td>
                </tr>))}</tbody>
            </table>
          </div>)}
      </div>
    </div>
  );
}

function IsoFormsModule() {
  const [view, setView] = useState(FORMS[0].code);
  const [store, setStore] = useState(()=>{
    let s = {}; try { s = JSON.parse(localStorage.getItem(FORM_STORE)||"{}"); } catch(e) {}
    for (const f of FORMS) if (!s[f.code] && f.seed) s[f.code] = f.seed.map((r,i)=>({ ...r, _ts:i+1 }));
    return s;
  });
  useEffect(()=>{ try { localStorage.setItem(FORM_STORE, JSON.stringify(store)); } catch(e) {} }, [store]);
  const def = FORMS.find(f=>f.code===view);
  const card = { background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:16, minWidth:0 };
  const tabs = [...FORMS.map(f=>({ id:f.code, label:f.code, n:(store[f.code]||[]).length })), { id:"catalog", label:"Danh mục tài liệu & biểu mẫu" }, { id:"gaps", label:"Tồn tại có chế tài" }];
  const STAT_C = s => s.startsWith("Cần") ? T.red : s.startsWith("Xác nhận") ? T.amber : T.green;

  return (
    <div className="anim-fade" style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)} style={{ padding:"7px 12px", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:11, fontWeight:700,
            background:view===t.id?`${T.green}18`:T.card, color:view===t.id?T.green:T.sub, border:`1px solid ${view===t.id?T.green+"55":T.border}` }}>
            {t.label}{t.n!=null && <span style={{ marginLeft:6, color:T.dim, fontWeight:500 }}>{t.n}</span>}
          </button>))}
      </div>

      {def && <DigitalForm def={def} records={store[def.code]||[]} setRecords={fn=>setStore(s=>({ ...s, [def.code]: typeof fn==="function" ? fn(s[def.code]||[]) : fn }))}/>}

      {view==="catalog" && <>
        <div style={card}>
          <SectionHeader title="Tài liệu cấp 2 — quy trình, hướng dẫn" sub="Sổ tay MT–AT–PCCC lần 02, Phụ lục 1"/>
          <Table heads={["Mã","Tên","Điều ISO 14001","Tình trạng"]} rows={PROCEDURES.map(([c,n,iso,s],i)=>(
            <tr key={i}><TD><Mono c={T.text}>{c}</Mono></TD><TD style={{ color:T.text }}>{n}</TD><TD style={{ color:T.sub }}>{iso}</TD><TD><Pill label={s} color={STAT_C(s)} size={9}/></TD></tr>))}/>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(380px, 1fr))", gap:14 }}>
          <div style={card}>
            <SectionHeader title="Biểu mẫu theo tài liệu" sub="● = đã có biểu mẫu điện tử trong tab này"/>
            <Table heads={["Tài liệu","Mã","Tên biểu mẫu"]} rows={FORM_CATALOG.map(([d,c,n,dig])=>(
              <tr key={c}><TD style={{ color:T.sub }}>{d}</TD><TD><Mono c={dig?T.green:T.text}>{dig?"● ":""}{c}</Mono></TD><TD style={{ color:T.text, fontSize:11 }}>{n}</TD></tr>))}/>
          </div>
          <div style={card}>
            <SectionHeader title="Bộ biểu mẫu HSE mã Fxxx" sub="Sổ tay Phụ lục 6 — rà soát 25/10/2026 (80 file)"/>
            <Table heads={["Mục","Nhóm","Mã","Tình trạng"]} rows={F_CATALOG.map(([m,g,c,s])=>(
              <tr key={c}><TD style={{ color:T.sub, fontSize:11 }}>{m}</TD><TD style={{ color:T.text, fontSize:11 }}>{g}</TD><TD><Mono c={T.text}>{c}</Mono></TD><TD style={{ color:T.sub, fontSize:11 }}>{s}</TD></tr>))}/>
          </div>
        </div>
        <div style={card}>
          <SectionHeader title="Việc cần xác minh trước khi trình ký" sub="Từ trang ghi chú nội bộ của từng tài liệu"/>
          {OPEN_ITEMS.map(([d,t],i)=><div key={i} style={{ display:"flex", gap:10, padding:"5px 0", fontSize:11.5, borderBottom:`1px solid ${T.border}55` }}><Mono c={T.sub}>{d}</Mono><span style={{ color:T.text }}>{t}</span></div>)}
        </div>
      </>}

      {view==="gaps" && <div style={card}>
        <SectionHeader title="10 tồn tại có chế tài cần xác minh" sub="Sổ tay Phụ lục 4 — mức phạt là trần đối với tổ chức nếu bị kết luận vi phạm · tự kiểm tra 207 nghĩa vụ 6 tháng/lần"/>
        <Table heads={["Tồn tại","Căn cứ xử phạt","Mức phạt tổ chức","Việc cần làm"]} rows={PENALTY_GAPS.map(([g,b,p,a],i)=>(
          <tr key={i}><TD style={{ color:T.text, fontWeight:600 }}>{g}</TD><TD style={{ color:T.sub, fontSize:11 }}>{b}</TD><TD><Pill label={p} color={T.red} size={9}/></TD><TD style={{ color:T.sub, fontSize:11 }}>{a}</TD></tr>))}/>
      </div>}
    </div>
  );
}

const NAV_GROUPS = [
  {
    group:"🌍 Môi Trường",
    items:[
      { id:"dashboard", icon:"⬛", label:"Dashboard Tổng hợp" },
      { id:"facility",  icon:"🏭", label:"Hồ Sơ Nhà Máy" },
      { id:"chemicals",  icon:"🧪", label:"Hóa Chất" },
      { id:"wastewater", icon:"🌊", label:"Nước Thải" },
      { id:"dispersion", icon:"💨", label:"Lan Truyền Khí Thải" },
      { id:"gpmt01",     icon:"📑", label:"GPMT Nguồn 01 — Lò Hơi" },
      { id:"sim3d",       icon:"🎮", label:"Mô Phỏng 3D Nhà Máy" },
      { id:"wwsim",       icon:"💧", label:"Mô Phỏng Dòng Nước Thải" },
      { id:"lowsrc",     icon:"🏭", label:"Nguồn Thấp · Đường · Mặt" },
      { id:"energy",     icon:"⚡", label:"Năng Lượng" },
      { id:"waste",      icon:"🗑", label:"Chất Thải" },
      { id:"isoforms",   icon:"📋", label:"Biểu Mẫu ISO 14001" },
      { id:"gri",        icon:"📄", label:"Báo Cáo GRI" },
    ]
  },
  {
    group:"🛡 An Toàn & Kiểm Soát",
    items:[
      { id:"contractors", icon:"👷", label:"Quản Lý Nhà Thầu", badge:"ctrnew" },
      { id:"safety",      icon:"✅", label:"Kiểm Soát Nội Bộ", badge:"clpending" },
      { id:"incidents",   icon:"🚨", label:"Sự Cố & Vi Phạm", badge:"incopen" },
      { id:"training",    icon:"🎓", label:"Huấn Luyện ATVSLĐ" },
    ]
  }
];

// Minimal stubs
function EnergyModuleStub() {
  const total = ENERGY_DATA.reduce((a,b)=>a+b.kwh,0);
  return <div className="anim-fade">
    <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:16 }}>
      <KPICard icon="⚡" label="Điện YTD" value={(total/1000).toFixed(0)} unit="MWh" color={T.amber} sub="GRI 302-1"/>
      <KPICard icon="💧" label="Nước YTD" value={(ENERGY_DATA.reduce((a,b)=>a+b.water,0)/1000).toFixed(1)} unit="ngàn m³" color={T.cyan} sub="GRI 303-1"/>
      <KPICard icon="🌫" label="Scope 2" value={(total*0.4457/1000).toFixed(2)} unit="tCO₂e" color={T.violet} sub="HF VN 0.4457"/>
    </div>
    <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 16px 10px" }}>
      <div style={{ fontSize:12,fontWeight:700,marginBottom:12 }}>Điện (kWh) & NPK sản lượng (tấn)</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={ENERGY_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="m" tick={{ fontSize:9,fill:T.dim }}/>
          <YAxis yAxisId="l" tick={{ fontSize:9,fill:T.dim }}/>
          <YAxis yAxisId="r" orientation="right" tick={{ fontSize:9,fill:T.dim }}/>
          <Tooltip content={<ChartTip/>}/>
          <Bar yAxisId="l" dataKey="kwh" fill={T.amber} opacity={.8} radius={[4,4,0,0]} name="kWh"/>
          <Bar yAxisId="r" dataKey="npk" fill={T.green} opacity={.7} radius={[4,4,0,0]} name="NPK tấn"/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>;
}

function ChemModuleStub() {
  const CHEMS = [
    {name:"NH₃",cas:"7664-41-7",stock:3400,min:1000,unit:"kg",ghs:"Toxic",loc:"Bồn NH3-1",cat:"Sản xuất NPK"},
    {name:"H₂SO₄",cas:"7664-93-9",stock:1200,min:400,unit:"lít",ghs:"Corrosive",loc:"Bồn S1",cat:"Sản xuất NPK"},
    {name:"NaOH",cas:"1310-73-2",stock:180,min:250,unit:"kg",ghs:"Corrosive",loc:"Kho B1",cat:"Xử lý nước"},
    {name:"PAC",cas:"1327-41-9",stock:320,min:100,unit:"kg",ghs:"Irritant",loc:"Kho A2",cat:"Xử lý nước"},
    {name:"Borax",cas:"1303-96-4",stock:850,min:200,unit:"kg",ghs:"Harmful",loc:"Kho A1",cat:"Phụ trợ"},
    {name:"K₂Cr₂O₇",cas:"7778-50-9",stock:42,min:30,unit:"kg",ghs:"Toxic/CMR",loc:"Kho C1",cat:"Phân tích"},
  ];
  const GHS_C = {"Toxic":T.red,"Toxic/CMR":T.violet,"Corrosive":T.orange,"Harmful":T.amber,"Irritant":T.blue};
  const low = CHEMS.filter(c=>c.stock<=c.min);
  return <div className="anim-fade">
    <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:16 }}>
      <KPICard icon="🧪" label="Hóa chất" value={CHEMS.length} color={T.green} sub="GHS · Decision 367/2026"/>
      <KPICard icon="⚠" label="Dưới mức min" value={low.length} color={low.length?T.red:T.green} sub={low.map(c=>c.name).join(", ")||"Tất cả OK"}/>
      <KPICard icon="🌍" label="Scope 1 NH₃→N₂O" value="0.033" unit="tCO₂e" color={T.violet} sub="GRI 305-1 · IPCC AR6"/>
    </div>
    {low.length>0&&<AlertBox level="err" msg={`Cần nhập ngay: ${low.map(c=>`${c.name} (còn ${c.stock}${c.unit}, min ${c.min})`).join(" · ")}`}/>}
    <Table heads={["Hóa chất","CAS","Danh mục","GHS","Tồn kho","Vị trí"]} rows={CHEMS.map((c,i)=>(
      <tr key={i} style={{ background:c.stock<=c.min?T.red+"08":"transparent" }}>
        <TD><div style={{ fontWeight:700,color:T.text }}>{c.name}</div></TD>
        <TD><Mono c={T.sub}>{c.cas}</Mono></TD>
        <TD><Pill label={c.cat} color={T.blue} size={10}/></TD>
        <TD><Pill label={c.ghs} color={GHS_C[c.ghs]||T.sub} size={10}/></TD>
        <TD>
          <div style={{ fontWeight:700,color:c.stock<=c.min?T.red:T.green }}>{c.stock.toLocaleString()} <span style={{ fontSize:10,color:T.sub }}>{c.unit}</span></div>
          <ProgressBar val={c.stock} max={c.min*3.5} color={c.stock<=c.min?T.red:T.green} h={3}/>
          <div style={{ fontSize:9,color:T.dim,marginTop:2 }}>Min: {c.min}</div>
        </TD>
        <TD style={{ color:T.sub,fontSize:11 }}>{c.loc}</TD>
      </tr>
    ))}/>
  </div>;
}

function WasteModuleStub() {
  const totals = { ctnh:WASTE_DATA.reduce((a,b)=>a+b.ctnh,0), cn:WASTE_DATA.reduce((a,b)=>a+b.cn,0), sh:WASTE_DATA.reduce((a,b)=>a+b.sh,0) };
  return <div className="anim-fade">
    <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:16 }}>
      <KPICard icon="☣" label="CTNH YTD" value={fmtN(totals.ctnh,3)} unit="tấn" color={T.red} sub="GRI 306-2 · TT 02/2022"/>
      <KPICard icon="🗑" label="CN thường YTD" value={fmtN(totals.cn,1)} unit="tấn" color={T.amber} sub="GRI 306-3"/>
      <KPICard icon="♻" label="Sinh hoạt" value={fmtN(totals.sh,1)} unit="tấn" color={T.sub} sub="Phân loại tại nguồn"/>
    </div>
    <div style={{ background:T.card,border:`1px solid ${T.border}`,borderRadius:14,padding:"16px 16px 10px" }}>
      <div style={{ fontSize:12,fontWeight:700,marginBottom:12 }}>CTNH theo tháng (tấn)</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={WASTE_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
          <XAxis dataKey="m" tick={{ fontSize:9,fill:T.dim }}/>
          <YAxis tick={{ fontSize:9,fill:T.dim }}/>
          <Tooltip content={<ChartTip/>}/>
          <Bar dataKey="ctnh" fill={T.red} opacity={.8} radius={[4,4,0,0]} name="CTNH (tấn)"/>
          <Bar dataKey="cn" fill={T.amber} opacity={.7} radius={[4,4,0,0]} name="CN thường (tấn)"/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>;
}

export default function App() {
  return <AuthProvider><AuthGate><AppInner/></AuthGate></AuthProvider>;
}

function AppInner() {
  const auth = useAuth();
  const [active, setActive] = useState("dashboard");
  const [contractors, setContractors] = useState(initContractors);
  const [incidents, setIncidents] = useState(initIncidents);
  const [checklists, setChecklists] = useState(initChecklists);
  const [ptw, setPTW] = useState(initPTW);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Live badges
  const badges = {
    ctrnew: contractors.filter(c=>c.status==="pending").length,
    clpending: checklists.filter(c=>!c.done).length,
    incopen: incidents.filter(i=>i.status==="open").length,
  };

  const renderRaw = () => {
    switch(active) {
      case "dashboard":   return <DashboardModule contractors={contractors} incidents={incidents} checklists={checklists} ptw={ptw} setActive={setActive}/>;
      case "chemicals":   return <ChemModuleStub/>;
      case "wastewater":  return <WastewaterModule/>;
      case "dispersion":  return <DispersionModule/>;
      case "gpmt01":      return <GpmtModule/>;
      case "sim3d":       return <PlantSim/>;
      case "wwsim":       return <WwtpSim/>;
      case "wallet":      return <WalletModule setActive={setActive}/>;
      case "induction":   return <InductionModule setActive={setActive}/>;
      case "admin":       return auth.me?.is_admin ? <AdminModule/> : null;
      case "lowsrc":      return <LowSourceModule/>;
      case "training":    return <TrainingModule/>;
      case "facility":    return <FacilityModule/>;
      case "isoforms":    return <IsoFormsModule/>;
      case "energy":      return <EnergyModuleStub/>;
      case "waste":       return <WasteModuleStub/>;
      case "gri":         return <GRIModule/>;
      case "contractors": return <ContractorModule contractors={contractors} setContractors={setContractors} ptw={ptw} setPTW={setPTW}/>;
      case "safety":      return <SafetyModule checklists={checklists} setChecklists={setChecklists} incidents={incidents} setIncidents={setIncidents}/>;
      case "incidents":   return <SafetyModule checklists={checklists} setChecklists={setChecklists} incidents={incidents} setIncidents={setIncidents}/>;
      default:            return <DashboardModule contractors={contractors} incidents={incidents} checklists={checklists} ptw={ptw} setActive={setActive}/>;
    }
  };

  const render = () => <PaidGate id={active} setActive={setActive}>{renderRaw()}</PaidGate>;

  const navGroups = [...NAV_GROUPS, { group:"👤 Tài Khoản", items:[
    { id:"wallet", icon:"💳", label:"Ví Credit & Nạp Tiền" },
    { id:"induction", icon:"🦺", label:"Huấn Luyện Vào Nhà Máy (15 phút)" },
    ...(auth.me?.is_admin ? [{ id:"admin", icon:"🛠", label:"Quản Trị" }] : []),
  ] }];
  const curNav = navGroups.flatMap(g=>g.items).find(n=>n.id===active);
  const time = new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"});

  return (
    <div style={{ display:"flex", height:"100vh", background:T.bg, overflow:"hidden" }}>
      <style>{CSS}</style>

      {/* SIDEBAR */}
      <aside style={{ width:sidebarCollapsed?64:220, background:T.surface, borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column", flexShrink:0, transition:"width .25s ease", overflow:"hidden" }}>
        {/* Brand */}
        <div style={{ padding:sidebarCollapsed?"14px 8px":"18px 16px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:G.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>🏭</div>
            {!sidebarCollapsed && (
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:800, color:T.green, letterSpacing:"-.3px" }}>HSE PLATFORM</div>
                <div style={{ fontSize:9, color:T.dim, marginTop:1 }}>Bình Điền · NPK</div>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:6 }}>
              <Dot color={T.green} pulse size={6}/>
              <span style={{ fontSize:9, color:T.green, fontFamily:"'DM Mono',monospace" }}>2986/GPMT-STNMT</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflowY:"auto", padding:"10px 8px" }}>
          {navGroups.map(grp=>(
            <div key={grp.group} style={{ marginBottom:12 }}>
              {!sidebarCollapsed && (
                <div style={{ fontSize:9, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:".8px", padding:"4px 8px 6px" }}>{grp.group}</div>
              )}
              {grp.items.map(item=>{
                const isActive = active===item.id || (item.id==="safety"&&active==="incidents");
                const badgeCount = item.badge ? badges[item.badge] : 0;
                return (
                  <button key={item.id} onClick={()=>setActive(item.id)} style={{
                    width:"100%", display:"flex", alignItems:"center", gap:8,
                    padding:`9px ${sidebarCollapsed?"10px":"12px"}`,
                    borderRadius:10, marginBottom:2,
                    background:isActive?`${T.green}18`:"transparent",
                    border:`1px solid ${isActive?T.green+"33":"transparent"}`,
                    color:isActive?T.green:T.sub,
                    fontSize:12, fontWeight:isActive?700:500,
                    cursor:"pointer", fontFamily:"'Outfit',sans-serif",
                    transition:"all .12s", textAlign:"left",
                    justifyContent:sidebarCollapsed?"center":"flex-start",
                    position:"relative",
                  }}>
                    <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
                    {!sidebarCollapsed && <span style={{ flex:1, overflow:"hidden", whiteSpace:"nowrap" }}>{item.label}</span>}
                    {!sidebarCollapsed && auth.service(item.id) && !auth.hasPass(item.id) && <span title="Dùng credit" style={{ fontSize:10 }}>💎</span>}
                    {!sidebarCollapsed && badgeCount>0 && (
                      <span style={{ background:T.red, color:"#fff", fontSize:9, fontWeight:800, padding:"1px 6px", borderRadius:10, flexShrink:0 }}>{badgeCount}</span>
                    )}
                    {sidebarCollapsed && badgeCount>0 && (
                      <span style={{ position:"absolute", top:4, right:4, width:8, height:8, borderRadius:"50%", background:T.red }}/>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding:"10px 8px 14px", borderTop:`1px solid ${T.border}`, flexShrink:0 }}>
          <button onClick={()=>setSidebarCollapsed(s=>!s)} style={{ width:"100%", background:T.ghost, border:`1px solid ${T.border}`, borderRadius:9, padding:"7px", cursor:"pointer", color:T.sub, fontSize:11, fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {sidebarCollapsed?"→":"← Thu"} {!sidebarCollapsed&&"sidebar"}
          </button>
          {!sidebarCollapsed && (
            <div style={{ marginTop:10, fontSize:9, color:T.dim, paddingLeft:4, lineHeight:1.8, fontFamily:"'DM Mono',monospace" }}>
              <div>ISO 14001:2015 ✓</div>
              <div>QCVN 40:2011/A</div>
              <div>GRI Standards 2021</div>
              <div style={{ color:T.border, marginTop:4 }}>v2.0 · {time}</div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Top bar */}
        <header style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"13px 26px", display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
          <div style={{ flex:1 }}>
            <Syne s={15}>{curNav?.icon} {curNav?.label}</Syne>
            <div style={{ fontSize:10, color:T.sub, marginTop:2, fontFamily:"'DM Mono',monospace" }}>
              Nhà máy Phân bón Bình Điền · Long An · {new Date().toLocaleDateString("vi-VN")}
            </div>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {[{l:"QCVN 40:2011/A",c:T.cyan},{l:"GRI Standards",c:T.violet},{l:"ISO 14001",c:T.green}].map(t=>(
              <Pill key={t.l} label={t.l} color={t.c} size={9}/>
            ))}
            <div style={{ width:1, height:20, background:T.border, margin:"0 4px" }}/>
            <div style={{ fontSize:10, color:T.sub, fontFamily:"'DM Mono',monospace" }}>{time}</div>
            <button onClick={()=>setActive("wallet")} title="Ví credit" style={{ background:T.ghost, border:`1px solid ${T.border}`, borderRadius:16, padding:"4px 10px", color:T.green, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"'DM Mono',monospace" }}>💳 {auth.me?.balance ?? 0} credit</button>
            <div title={auth.me?.email} style={{ width:30, height:30, borderRadius:"50%", background:G.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#04120d" }}>{(auth.me?.profile?.full_name || auth.me?.email || "?").trim().charAt(0).toUpperCase()}</div>
            <button onClick={async()=>{ await auth.api.signOut(); auth.reload(); }} style={{ background:"transparent", border:`1px solid ${T.border}`, borderRadius:8, padding:"4px 9px", color:T.sub, fontSize:11, cursor:"pointer" }}>Đăng xuất</button>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex:1, overflowY:"auto", padding:"22px 26px", background:T.bg }}>
          {render()}
        </main>
      </div>
    </div>
  );
}
