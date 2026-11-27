// Mô hình Gauss (ISC3) cho nguồn 01: lò sinh khối 6 t/h và lò than 8 t/h, 4 kịch bản — chạy: node --experimental-strip-types scripts/gpmt01-boilers.ts
import { screenWorstCase, screenAtDistance, actualFlow, normalFlow, exitVelocity, emissionRateFromStack, celsiusToK, buildModel } from "../src/lib/gaussPlume.ts";
const P = ["tsp","so2","nox","co"] as const;
const Q05 = { tsp:300, so2:350, nox:200, co:30000 };
const S = [
  { id:"S1", name:"Lò sinh khối 6 t/h — số liệu thiết kế", flow:7000, mode:"N", tRef:0, t:170, c:{ tsp:3.8, so2:59.5, nox:330, co:null } },
  { id:"S2", name:"Lò sinh khối 6 t/h — xả bằng giới hạn GPMT", flow:25000, mode:"A", tRef:25, t:170, c:{ tsp:160, so2:400, nox:680, co:800 } },
  { id:"S3", name:"Lò than 8 t/h — số liệu quan trắc 2026", flow:19636, mode:"A", tRef:25, t:86, c:{ tsp:19, so2:55, nox:34, co:79 } },
  { id:"S4", name:"Lò than 8 t/h — xả bằng giới hạn GPMT", flow:25000, mode:"A", tRef:25, t:86, c:{ tsp:160, so2:400, nox:680, co:800 } },
];
const D = [100, 200, 300, 500, 1000, 2000];
const out:any[] = [];
for (const s of S) {
  const fN = s.mode==="N" ? s.flow : normalFlow(s.flow, s.t, s.tRef);
  const fA = s.mode==="N" ? actualFlow(s.flow, s.t, s.tRef) : s.flow;
  const vs = exitVelocity(fA, 0.7);
  const src = { terrain:"rural", hs:18, d:0.7, vs, Ts:celsiusToK(s.t), Ta:celsiusToK(30), riseMode:"final", windProfile:true } as any;
  const { worst } = screenWorstCase(src, 1.5);
  const m = buildModel({ ...src, Q:1, u10:worst.u10, stability:worst.stability, mixingHeight:"screen3" } as any);
  const Q:any = {}, C:any = {};
  for (const p of P) { const c = (s.c as any)[p]; Q[p] = c==null?null:emissionRateFromStack(c, fN); C[p] = Q[p]==null?null:Q[p]*worst.cPerQ; }
  const prof = D.map(x => { const r = screenAtDistance(src, x, 1.5); return { x, nox: Q.nox*r.cPerQ, tsp: Q.tsp*r.cPerQ, so2: Q.so2*r.cPerQ }; });
  out.push({ ...s, fN, fA, vs, worst, hsAdj:m.hsAdj, rise:m.rise.final, riseType:m.rise.type, u:m.u, Q, C, prof });
  console.log(`\n${s.id} ${s.name}: QN=${fN.toFixed(0)} Qa=${fA.toFixed(0)} v=${vs.toFixed(1)} u=${m.u.toFixed(2)} h'=${m.hsAdj.toFixed(1)} Δh=${m.rise.final.toFixed(1)}(${m.rise.type}) worst ${worst.stability} u10=${worst.u10} x=${worst.x.toFixed(0)} H=${worst.H.toFixed(1)}`);
  for (const p of P) console.log(`  ${p}: Q=${Q[p]?.toFixed(4)} g/s C=${C[p]?.toFixed(2)} (${C[p]!=null?(C[p]/(Q05 as any)[p]*100).toFixed(1):'-'}%)`);
  console.log('  prof NO2:', prof.map(r=>`${r.x}:${r.nox.toFixed(1)}`).join(' '));
}
// Kết quả điền vào BC điều chỉnh GPMT, mục 2.2.2.d (Bảng 2.2a–2.2c)
