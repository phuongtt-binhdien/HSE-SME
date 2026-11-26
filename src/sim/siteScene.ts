// @ts-nocheck
// Dựng mặt bằng nhà máy theo bản vẽ hoàn công (data/site.ts): nền, ranh giới, sông, bến tàu, đường, nhà xưởng, khu phụ trợ, bối cảnh xung quanh.
// Hệ tọa độ cảnh: x Đông, z Nam (Bắc = −z), y lên, 1 đơn vị = 1 m. Bản vẽ: X_d Bắc, Y_d Tây → x = −Y_d, z = −X_d.
import * as THREE from "three";
import { SITE_BOUNDARY, SITE_BUILDINGS, SITE_ROADS, WHARF, PORT_YARD, WATER_TOWER, MAIN_GATE, toScene, sceneBox } from "../data/site";

export function buildSite({ world, M, tex, anims, label }) {
  const mesh = (geo, mat, x, y, z, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; world.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, shadow = true) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, shadow);
  const P = pts => pts.map(([X, Y]) => toScene(X, Y));            // (X_d,Y_d) → (x,z)
  const shapeOf = pts => { const s = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z))); s.closePath(); return s; };
  // ShapeGeometry nằm trong mặt phẳng XY; xoay −90° quanh X biến y→−z, nên truyền (x, −z) để ra đúng (x, z).

  // ── Nền ngoài ranh: đồng ruộng/vườn ──
  const outside = tex(128, 128, (g, w, h) => { g.fillStyle = "#a9be9c"; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = 140 + Math.random() * 70; g.fillStyle = `rgb(${v - 30},${v},${v - 45})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, [260, 260]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshStandardMaterial({ map: outside, roughness: 1, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.12; ground.receiveShadow = true; world.add(ground);

  // ── Sông Vàm Cỏ Đông (phía Tây): mép kè theo bản vẽ, rộng ≈ 320 m ──
  const bank = [[-700, 80], [-274, 93], [-235, 99], [-100, 102], [100, 108], [232, 112], [700, 124]];
  const far = bank.map(([X, Y]) => [X, Y + 330]);
  const riverTex = tex(128, 128, (g, w, h) => { g.fillStyle = "#4f93b8"; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.15})`; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y - 6, w * 0.6, y + 6, w, y); g.stroke(); } }, null);
  const riverGeo = new THREE.ShapeGeometry(shapeOf(P([...bank, ...far.slice().reverse()])));
  // đặt UV theo tọa độ thế giới để dòng chảy mượt
  { const pos = riverGeo.attributes.position, uv = riverGeo.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 80, pos.getY(i) / 80); uv.needsUpdate = true; }
  const river = new THREE.Mesh(riverGeo, new THREE.MeshStandardMaterial({ map: riverTex, roughness: 0.25, metalness: 0.1 })); river.rotation.x = -Math.PI / 2; river.position.y = 0.02; river.receiveShadow = true; world.add(river);
  anims.push(dt => { riverTex.offset.y -= dt * 0.03; });
  // mép kè bê tông
  for (let i = 1; i < bank.length; i++) { const [x1, z1] = toScene(...bank[i - 1]), [x2, z2] = toScene(...bank[i]); const L = Math.hypot(x2 - x1, z2 - z1); const m = box(L, 0.9, 3, M(0x9a9588, { roughness: 1 }), (x1 + x2) / 2, 0.3, (z1 + z2) / 2, false); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); }
  label("Sông Vàm Cỏ Đông (phía Tây)", -230, 3, -20, true);

  // ── Nền nhà máy (đá cấp phối) theo ranh giới sử dụng đất ──
  const gravel = tex(256, 256, (g, w, h) => { g.fillStyle = "#c8cbce"; g.fillRect(0, 0, w, h); for (let i = 0; i < 3500; i++) { const v = 150 + Math.random() * 90; g.fillStyle = `rgb(${v},${v},${v + 4})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, null);
  const sitePts = P(SITE_BOUNDARY);
  { const g = new THREE.ShapeGeometry(shapeOf(sitePts)); const pos = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 12, pos.getY(i) / 12); uv.needsUpdate = true;
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: gravel, roughness: 1, metalness: 0 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.04; m.receiveShadow = true; world.add(m); }

  // ── Hàng rào theo ranh ──
  const fenceM = M(0x9aa3ab, { transparent: true, opacity: 0.55 }), postM = M(0x8e969e);
  for (let i = 0; i < sitePts.length; i++) { const [x1, z1] = sitePts[i], [x2, z2] = sitePts[(i + 1) % sitePts.length]; const L = Math.hypot(x2 - x1, z2 - z1); if (L < 1) continue;
    const f = box(L, 2.4, 0.2, fenceM, (x1 + x2) / 2, 1.3, (z1 + z2) / 2, false); f.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    const n = Math.floor(L / 10); for (let k = 0; k <= n; k++) { const t = k / Math.max(1, n); box(0.25, 2.8, 0.25, postM, x1 + (x2 - x1) * t, 1.4, z1 + (z2 - z1) * t, false); } }

  // ── Đường nội bộ ──
  const asphalt = M(0x474c52, { roughness: 0.95, metalness: 0 }), stripe = M(0xf4f4f4);
  for (const r of SITE_ROADS) { const b = sceneBox(r); box(b.w, 0.12, b.d, asphalt, b.cx, 0.1, b.cz, false);
    const alongZ = b.d > b.w; const len = alongZ ? b.d : b.w; for (let t = -len / 2 + 6; t < len / 2 - 3; t += 12) box(alongZ ? 0.3 : 4, 0.04, alongZ ? 4 : 0.3, stripe, b.cx + (alongZ ? 0 : t), 0.18, b.cz + (alongZ ? t : 0), false); }
  // đường công cộng phía Đông (Trung Trực) chạy dọc ranh phía Đông
  { const base = SITE_BOUNDARY.slice(2, 9).map(([X, Y]) => [X, Y - 13]); const ext = [[-420, -330], ...base, [700, -190]]; ext.unshift([-193, -262]);
    for (let i = 1; i < ext.length; i++) { const [x1, z1] = toScene(...ext[i - 1]), [x2, z2] = toScene(...ext[i]); const L = Math.hypot(x2 - x1, z2 - z1); const m = box(L, 0.1, 9, asphalt, (x1 + x2) / 2, 0.08, (z1 + z2) / 2, false); m.rotation.y = -Math.atan2(z2 - z1, x2 - x1); }
    const [gx, gz] = toScene(MAIN_GATE.x, MAIN_GATE.y); box(14, 0.12, 14, asphalt, gx, 0.1, gz - 0, false); box(1, 3.4, 8, M(0xb0b6bc), gx - 7.5, 1.8, gz, false); box(1, 3.4, 8, M(0xb0b6bc), gx + 7.5, 1.8, gz, false); label("Cổng chính (đường Trung Trực)", gx, 6, gz, true); }

  // ── Cảng, bến tàu 3000 DWT ──
  { const y = PORT_YARD, b = sceneBox(y); box(b.w, 0.2, b.d, M(0xb7bbbf), b.cx, 0.15, b.cz, false); label("Bãi cảng (17)", b.cx, 5, b.cz);
    const w = sceneBox(WHARF); box(w.w, 1.4, w.d, M(0xaeb2b6, { roughness: 0.9 }), w.cx, 0.7, w.cz); for (let i = 0; i < 6; i++) box(1, 2.2, 1, M(0x59626c), w.cx - w.w / 2 + 3, 1.2, w.cz - w.d / 2 + 6 + i * (w.d - 12) / 5, false);
    // tàu 3000 DWT neo bến
    const ship = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(13, 5, 70), new THREE.MeshStandardMaterial({ color: 0x35506b, roughness: 0.7 })); hull.position.y = 2.5; ship.add(hull);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 10), new THREE.MeshStandardMaterial({ color: 0xe9ebed })); cab.position.set(0, 8.5, 26); ship.add(cab);
    ship.position.set(w.cx - w.w / 2 - 12, 0, w.cz); ship.children.forEach(c => { c.castShadow = true; }); world.add(ship);
    label("Bến tàu 3000 DWT", w.cx, 7, w.cz, true); }

  // ── Nhà xưởng, kho, khu phụ trợ ──
  const wallM = M(0xd7dade, { roughness: 0.8 }), roofM = M(0x9aa7b3, { roughness: 0.6 }), officeM = M(0xe8d9c0, { roughness: 0.9 }), utilM = M(0xc9d2d9, { roughness: 0.8 });
  const ghostWall = new THREE.MeshStandardMaterial({ color: 0x8fb4d6, transparent: true, opacity: 0.32, roughness: 0.8, depthWrite: false });
  const edgeM = new THREE.LineBasicMaterial({ color: 0x4d7fb0 });
  // Nhà hiện hữu trùng vị trí với mô hình HTXLNT tạm (vị trí thật của HTXLNT chưa có trong TMB-00): vẽ trong suốt để nhìn thấy bể bên dưới
  const OVERLAP = new Set(["39", "26", "38"]);
  const seeThrough = new THREE.MeshStandardMaterial({ color: 0xd7dade, transparent: true, opacity: 0.28, roughness: 0.8, depthWrite: false });
  const BIGLABEL = new Set(["9B1", "9C1", "28", "26", "27", "37", "39", "38", "30", "29", "40", "36", "8", "11", "33", "34", "23", "41", "42", "43", "44", "1-5"]);
  const FARLABEL = new Set(["9B1", "9C1", "28", "26", "27", "37"]);
  const shortName = n => n.split(" (")[0].split(" — ")[0];
  for (const b of SITE_BUILDINGS) {
    const q = sceneBox(b); const planned = b.status === "planned";
    if (b.id === "9A1") { label("9A1 · Nhà sản xuất 9A1 (tạo hạt)", q.cx, b.h + 9, q.cz, true); continue; }
    if (b.kind === "shed") {
      const geo = new THREE.BoxGeometry(q.w, b.h, q.d);
      const mat = planned ? ghostWall : OVERLAP.has(b.id) ? seeThrough : wallM; const w = new THREE.Mesh(geo, mat); w.position.set(q.cx, b.h / 2, q.cz); w.castShadow = !planned; w.receiveShadow = true; world.add(w);
      if (planned) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeM); e.position.copy(w.position); world.add(e); }
      else if (!OVERLAP.has(b.id)) { const rf = new THREE.Mesh(new THREE.BoxGeometry(q.w + 1.2, 0.5, q.d + 1.2), roofM); rf.position.set(q.cx, b.h + 0.3, q.cz); rf.castShadow = true; world.add(rf); }
    } else {
      const mat = b.kind === "office" ? officeM : utilM; const w = box(q.w, b.h, q.d, planned ? ghostWall : mat, q.cx, b.h / 2, q.cz, !planned);
      if (planned) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(w.geometry), edgeM); e.position.copy(w.position); world.add(e); }
      box(q.w + 0.8, 0.4, q.d + 0.8, planned ? ghostWall : M(b.kind === "office" ? 0xa85a3c : 0xb8bdc2, { roughness: 0.9 }), q.cx, b.h + 0.2, q.cz, false);
    }
    if (BIGLABEL.has(b.id)) label(`${b.id} · ${shortName(b.name)}${planned ? " [xin phép xây mới]" : ""}${OVERLAP.has(b.id) ? " · HTXLNT (mô hình tạm) nằm trong ô này" : ""}`, q.cx, b.h + 5, q.cz, FARLABEL.has(b.id));
  }
  { const [tx, tz] = toScene(WATER_TOWER.x, WATER_TOWER.y); const c = new THREE.Mesh(new THREE.CylinderGeometry(WATER_TOWER.r, WATER_TOWER.r * 0.7, 4, 20), new THREE.MeshStandardMaterial({ color: 0xdfe6ec })); c.position.set(tx, WATER_TOWER.h, tz); c.castShadow = true; world.add(c);
    for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) box(0.3, WATER_TOWER.h - 2, 0.3, postM, tx + dx, (WATER_TOWER.h - 2) / 2, tz + dz); label("Tháp nước (19)", tx, WATER_TOWER.h + 4, tz); }

  // ── Cây xanh: dải Đông (đường 4A), dọc kè, quanh ranh ──
  const trunkM = M(0x6b4a2f), leafM = M(0x4f8f47, { roughness: 1, metalness: 0 });
  const tree = (x, z, s = 1) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * s, 0.45 * s, 3 * s, 8), trunkM); t.position.set(x, 1.5 * s, z); t.castShadow = true; world.add(t);
    const f = new THREE.Mesh(new THREE.SphereGeometry(2.6 * s, 10, 8), leafM); f.position.set(x, 4.4 * s, z); f.castShadow = true; world.add(f); };
  { let k = 0; for (let Y = -165; Y <= 105; Y += 9) { const [x, z] = toScene(228, Y); tree(x, z, 1 + (k++ % 4) * 0.12); }
    for (let X = -265; X <= 225; X += 11) { const [x, z] = toScene(X, 96 - Math.max(0, (X + 100) * 0.0)); tree(x, z, 1 + (k++ % 3) * 0.15); } }
  

  // ── Bối cảnh xung quanh (vị trí gần đúng): nhà dân phía Đông, NM xi măng Hà Tiên phía Bắc, kho Gas Thành Tài phía Nam ──
  const house = (x, z, c) => { box(8, 4.5, 7, M(c, { roughness: 0.9, metalness: 0 }), x, 2.4, z); const r = new THREE.Mesh(new THREE.ConeGeometry(6.4, 2.8, 4), M(0xa85a3c, { roughness: 0.9, metalness: 0 })); r.position.set(x, 5.9, z); r.rotation.y = Math.PI / 4; r.castShadow = true; world.add(r); };
  { const cols = [0xe8d9c0, 0xd9e3c8, 0xf0e1d0, 0xdcd0e0]; let k = 0;
    for (let X = -330; X <= 280; X += 22) for (const dy of [-215, -236]) { const [x, z] = toScene(X + (k % 3) * 3, dy - ((X + 330) % 44 === 0 ? 0 : 6) - (k % 2) * 4); house(x, z, cols[k++ % 4]); }
    label("Khu dân cư dọc đường Trung Trực (phía Đông)", ...(() => { const [x, z] = toScene(80, -228); return [x, 9, z]; })(), true); }
  { const sx = toScene(380, 40); for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 38, 24), M(0xd8d8d4, { roughness: 0.9 })); c.position.set(sx[0] + i * 20, 19, sx[1]); c.castShadow = true; world.add(c); }
    box(60, 14, 26, M(0xbfc3c6), sx[0] + 30, 7, sx[1] - 40); label("NM xi măng Hà Tiên (phía Bắc, vị trí gần đúng)", sx[0] + 30, 42, sx[1]); }
  { const sx = toScene(-420, 40); for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(9, 18, 14), M(0xe6e8ea, { roughness: 0.4 })); s.position.set(sx[0] + i * 28, 10, sx[1]); s.castShadow = true; world.add(s); }
    label("Cty Gas Thành Tài (phía Nam, vị trí gần đúng)", sx[0] + 28, 24, sx[1]); }

  // ── Xe tải trên đường nội bộ 4B ──
  { const t = new THREE.Group(); const b1 = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 2.4), new THREE.MeshStandardMaterial({ color: 0xe9ebed })); b1.position.set(-1.6, 2.1, 0); const b2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.4), new THREE.MeshStandardMaterial({ color: 0x2b6cb0 })); b2.position.set(2.7, 1.9, 0); t.add(b1, b2);
    for (const x of [-3.5, -1, 2.8]) for (const z of [-1.2, 1.2]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 14), new THREE.MeshStandardMaterial({ color: 0x222629 })); w.position.set(x, 0.6, z); w.rotation.x = Math.PI / 2; t.add(w); }
    t.traverse(o => { if (o.isMesh) o.castShadow = true; });
    const [, z0] = toScene(118, 0); t.position.set(-90, 0.1, z0); world.add(t); let dir = 1; anims.push(dt => { t.position.x += dir * dt * 6; if (t.position.x > 95) { dir = -1; t.rotation.y = Math.PI; } if (t.position.x < -90) { dir = 1; t.rotation.y = 0; } }); }
}
