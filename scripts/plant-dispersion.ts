// Mô hình Gauss nhiều nguồn cho toàn nhà máy — số liệu quan trắc định kỳ 2026 (đợt 1: phiếu 0331, 0424, 0731/2026/DV;
// đợt 2: phiếu 1461, 1537, 1662/2026/DV — TT Kỹ thuật TN&MT Tây Ninh). Chạy:
//   npm run model:plant -- <chiều cao ống sấy, m> <boiler|all> <r1|r2|max>
// Giả định: chiều cao ống khói lò sấy chưa có trong bản vẽ hoàn công (mặc định 15 m); đường kính Ø1,2 m (DC1, DC2 — theo
// ống dẫn Ø1200 của lọc bụi 55.000 m³/h) và Ø1,8 m (DC3 — theo bản vẽ trạm quan trắc tự động); nhiệt độ đợt 1 lấy theo đợt 2;
// "<10" lấy bằng 10, "KPH" lấy bằng LOD; Nm³ ở 25 °C theo QCVN 19:2009. Sàng lọc 54 tổ hợp khí tượng SCREEN3 × 36 hướng gió,
// lưới 2 × 2 km bước 25 m, điểm tiếp nhận cao 1,5 m. Kết quả là phần đóng góp của nhà máy, chưa cộng nồng độ nền.
import { buildModel, screenWorstCase, SCREEN_WINDS, exitVelocity, emissionRateFromStack, celsiusToK, type Stability } from "../src/lib/gaussPlume.ts";
// Nm³ theo QCVN 19:2009: 25 °C, 760 mmHg
const TREF = 25;
const toN = (qa: number, t: number) => qa * (273.15 + TREF) / (273.15 + t);
const P = ["tsp","so2","nox","co","nh3"] as const;
const Q05: Record<string, number> = { tsp:300, so2:350, nox:200, co:30000, nh3:200 };
const NAME: Record<string,string> = { tsp:"Bụi TSP", so2:"SO₂", nox:"NO₂", co:"CO", nh3:"NH₃" };
const HDRY = Number(process.argv[2] ?? 15);
// [tên, X(bắc), Y(đông), h, d, {r1:{flow,t,c}, r2:{...}}]  t của đợt 1 lấy theo đợt 2 (đợt 1 không đo)
const S = [
  { n:"Lò hơi (nguồn 01)", X:1172156, Y:580206, h:18, d:0.7,
    r1:{ q:19636, t:86, c:{ tsp:16, so2:55, nox:34, co:68, nh3:0 } },
    r2:{ q:18544, t:86, c:{ tsp:19, so2:49, nox:28, co:79, nh3:0 } } },
  { n:"Sấy DC3 (140.000)", X:1172157, Y:580332, h:HDRY, d:1.8,
    r1:{ q:79128, t:71, c:{ tsp:15, so2:10, nox:10, co:10, nh3:0.05 } },
    r2:{ q:77554, t:71, c:{ tsp:16, so2:10, nox:10, co:10, nh3:0.79 } } },
  { n:"Sấy nóng DC2", X:1172155, Y:580357, h:HDRY, d:1.2,
    r1:{ q:47965, t:57, c:{ tsp:18, so2:10, nox:21, co:172, nh3:0.05 } },
    r2:{ q:30844, t:57, c:{ tsp:13, so2:10, nox:55, co:62, nh3:0.59 } } },
  { n:"Sấy nguội DC2", X:1172194, Y:580350, h:HDRY, d:1.2,
    r1:{ q:42725, t:57, c:{ tsp:18, so2:10, nox:10, co:23, nh3:0.05 } },
    r2:{ q:31733, t:57, c:{ tsp:14, so2:10, nox:59, co:74, nh3:1.6 } } },
  { n:"Sấy nóng DC1", X:1172150, Y:580263, h:HDRY, d:1.2,
    r1:{ q:50260, t:50, c:{ tsp:16, so2:10, nox:11, co:22, nh3:0.3 } },
    r2:{ q:43509, t:50, c:{ tsp:13, so2:10, nox:10, co:21, nh3:0.62 } } },
  { n:"Sấy nguội DC1", X:1172132, Y:580277, h:HDRY, d:1.2,
    r1:{ q:50901, t:47, c:{ tsp:17, so2:10, nox:10, co:14, nh3:0.47 } },
    r2:{ q:43503, t:47, c:{ tsp:13, so2:10, nox:10, co:25, nh3:0.3 } } },
];
const Ta = celsiusToK(30), z = 1.5;
const round = (k: "r1"|"r2"|"max") => S.map(s => {
  const r = k==="max" ? { q:Math.max(s.r1.q,s.r2.q), t:s.r2.t, c:Object.fromEntries(P.map(p=>[p, Math.max((s.r1.c as any)[p],(s.r2.c as any)[p])])) } : (s as any)[k];
  const vs = exitVelocity(r.q, s.d), QN = toN(r.q, r.t);
  const Q = Object.fromEntries(P.map(p=>[p, emissionRateFromStack(r.c[p], QN)]));
  return { ...s, vs, QN, Q, src:{ terrain:"rural", hs:s.h, d:s.d, vs, Ts:celsiusToK(r.t), Ta, riseMode:"final", windProfile:true } as any };
});

const mode = process.argv[3] ?? "all";
const cx = S.reduce((a,s)=>a+s.Y,0)/S.length, cy = S.reduce((a,s)=>a+s.X,0)/S.length;
for (const k of (mode==="boiler" ? ["r1","r2","max"] : [(process.argv[4] ?? "max")]) as ("r1"|"r2"|"max")[]) {
  const src = round(k);
  if (mode==="boiler") {
    const b = src[0]; const w = screenWorstCase(b.src, z).worst;
    console.log(`\n[${k}] Lò hơi: ${b.QN.toFixed(0)} Nm³/h(25°C) v=${b.vs.toFixed(1)} m/s → lớp ${w.stability} u10=${w.u10} x=${w.x.toFixed(0)} m H=${w.H.toFixed(1)}`);
    for (const p of P.slice(0,4)) { const c = b.Q[p]*w.cPerQ; console.log(`   ${NAME[p]}: Q=${b.Q[p].toFixed(3)} g/s → Cmax=${c.toFixed(1)} μg/m³ (${(c/Q05[p]*100).toFixed(1)}%)`); }
    continue;
  }
  // Tổng hợp nhiều nguồn: lưới 2 km × 2 km, bước 25 m; 36 hướng gió × 54 tổ hợp
  const step = 25, half = 1000, n = 2*half/step+1;
  const best: Record<string,{c:number,x:number,y:number,met:string,contrib:number[]}> = {};
  for (const p of P) best[p] = { c:0, x:0, y:0, met:"", contrib:[] };
  const unit = new Float64Array(S.length);
  for (const st of Object.keys(SCREEN_WINDS) as Stability[]) for (const u10 of SCREEN_WINDS[st]) {
    const models = src.map(s => buildModel({ ...s.src, Q:1, u10, stability:st }));
    for (let dir=0; dir<360; dir+=10) {
      const th = dir*Math.PI/180, wx = Math.sin(th), wy = Math.cos(th); // hướng gió thổi TỚI (đông, bắc)
      for (let i=0;i<n;i++) for (let j=0;j<n;j++) {
        const E = cx - half + i*step, N = cy - half + j*step;
        for (let s=0;s<src.length;s++) {
          const dx = E - src[s].Y, dy = N - src[s].X;
          unit[s] = models[s].conc(dx*wx + dy*wy, -dx*wy + dy*wx, z);
        }
        for (const p of P) {
          let c = 0; for (let s=0;s<src.length;s++) c += unit[s]*src[s].Q[p];
          if (c > best[p].c) best[p] = { c, x:E-src[0].Y, y:N-src[0].X, met:`lớp ${st}, gió ${u10} m/s, thổi về ${dir}°`, contrib:src.map((s,k2)=>unit[k2]*s.Q[p]) };
        }
      }
    }
  }
  console.log(`\nTOÀN NHÀ MÁY [${k}] ống sấy ${HDRY} m:`);
  src.forEach(s=>console.log(`  ${s.n}: h=${s.h} d=${s.d} v=${s.vs.toFixed(1)} QN=${s.QN.toFixed(0)}  Q(g/s): ${P.map(p=>`${p}=${s.Q[p].toFixed(3)}`).join(" ")}`));
  for (const p of P) {
    const b = best[p]; const dist = Math.hypot(b.x,b.y);
    console.log(`  ${NAME[p]}: Cmax tổng = ${b.c.toFixed(1)} μg/m³ (${(b.c/Q05[p]*100).toFixed(1)}% QCVN05) tại ${dist.toFixed(0)} m từ lò hơi; ${b.met}; đóng góp: ${b.contrib.map((v,k2)=>`${S[k2].n.split(" (")[0]} ${(v/b.c*100).toFixed(0)}%`).join(", ")}`);
  }
}
