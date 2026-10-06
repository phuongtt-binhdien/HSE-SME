"use client";
// @ts-nocheck

import { useState, useEffect, useRef, useCallback } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

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
const NAV_GROUPS = [
  {
    group:"🌍 Môi Trường",
    items:[
      { id:"dashboard", icon:"⬛", label:"Dashboard Tổng hợp" },
      { id:"chemicals",  icon:"🧪", label:"Hóa Chất" },
      { id:"wastewater", icon:"🌊", label:"Nước Thải" },
      { id:"energy",     icon:"⚡", label:"Năng Lượng" },
      { id:"waste",      icon:"🗑", label:"Chất Thải" },
      { id:"gri",        icon:"📄", label:"Báo Cáo GRI" },
    ]
  },
  {
    group:"🛡 An Toàn & Kiểm Soát",
    items:[
      { id:"contractors", icon:"👷", label:"Quản Lý Nhà Thầu", badge:"ctrnew" },
      { id:"safety",      icon:"✅", label:"Kiểm Soát Nội Bộ", badge:"clpending" },
      { id:"incidents",   icon:"🚨", label:"Sự Cố & Vi Phạm", badge:"incopen" },
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
      <KPICard icon="☣" label="CTNH YTD" value={totals.ctnh.toFixed(3)} unit="tấn" color={T.red} sub="GRI 306-2 · TT 02/2022"/>
      <KPICard icon="🗑" label="CN thường YTD" value={totals.cn.toFixed(1)} unit="tấn" color={T.amber} sub="GRI 306-3"/>
      <KPICard icon="♻" label="Sinh hoạt" value={totals.sh.toFixed(1)} unit="tấn" color={T.sub} sub="Phân loại tại nguồn"/>
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

  const render = () => {
    switch(active) {
      case "dashboard":   return <DashboardModule contractors={contractors} incidents={incidents} checklists={checklists} ptw={ptw} setActive={setActive}/>;
      case "chemicals":   return <ChemModuleStub/>;
      case "wastewater":  return <WastewaterModule/>;
      case "energy":      return <EnergyModuleStub/>;
      case "waste":       return <WasteModuleStub/>;
      case "gri":         return <GRIModule/>;
      case "contractors": return <ContractorModule contractors={contractors} setContractors={setContractors} ptw={ptw} setPTW={setPTW}/>;
      case "safety":      return <SafetyModule checklists={checklists} setChecklists={setChecklists} incidents={incidents} setIncidents={setIncidents}/>;
      case "incidents":   return <SafetyModule checklists={checklists} setChecklists={setChecklists} incidents={incidents} setIncidents={setIncidents}/>;
      default:            return <DashboardModule contractors={contractors} incidents={incidents} checklists={checklists} ptw={ptw} setActive={setActive}/>;
    }
  };

  const curNav = NAV_GROUPS.flatMap(g=>g.items).find(n=>n.id===active);
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
          {NAV_GROUPS.map(grp=>(
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
            <div style={{ width:30, height:30, borderRadius:"50%", background:G.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, cursor:"pointer" }}>P</div>
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
