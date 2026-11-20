// @ts-nocheck
// Cảnh 3D nhà máy NPK Bình Điền – Long An (three.js). Hệ tọa độ: x Đông, z Nam (Bắc = −z), y lên; 1 đơn vị = 1 m.
// Toàn bộ hình khối được dựng bằng primitive; thiết bị đăng ký theo mã trong plantSim.ts.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EQ } from "./plantSim";
import { windVector } from "./plume";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const C = { steel: 0x8e969e, light: 0xd9dde1, white: 0xf1f3f5, blue: 0x2b6cb0, navy: 0x1f4e8c, orange: 0xe08a1e, yellow: 0xf2c200, red: 0xc0392b,
  green: 0x3a8f5c, concrete: 0xc4c6c8, dark: 0x2e3338, cyan: 0x3fb6d8, brick: 0x8b3a2f, sky: 0xdfe7ef };

export const ZONE_VIEWS = {
  all: { name: "TOÀN CẢNH NHÀ MÁY", pos: [135, 115, 130], tgt: [0, 0, -14] },
  raw: { name: "ĐỊNH LƯỢNG – NGHIỀN – SÀNG", pos: [-46,26,6], tgt: [-30,3,-26] },
  gran: { name: "TRỘN – TẠO HẠT", pos: [-4,26,6], tgt: [-8,3,-26] },
  dry: { name: "LÒ ĐỐT – SẤY (NGUỒN 04)", pos: [12,30,6], tgt: [10,3,-39] },
  air: { name: "XỬ LÝ BỤI, KHÍ THẢI", pos: [40,28,6], tgt: [40,5,-36] },
  boiler: { name: "KHU LÒ HƠI", pos: [10, 38, 72], tgt: [-23, 5, 34] },
  bag: { name: "LÀM NGUỘI – SÀNG – ĐÓNG BAO", pos: [56,22,6], tgt: [44,3,-30] },
  wwtp: { name: "HỆ THỐNG XỬ LÝ NƯỚC THẢI", pos: [-52, 40, 88], tgt: [-82, 2, 44] },
  top: { name: "NHÌN TỪ TRÊN", pos: [0, 270, 1], tgt: [0, 0, -10] },
};

const tex = (w, h, draw, repeat) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; if (repeat) t.repeat.set(...repeat); t.anisotropy = 4; return t; };

export function createPlantScene(container, hooks) {
  const W = () => container.clientWidth || 800, H = () => container.clientHeight || 500;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W(), H());
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = "block"; renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);
  const labelLayer = document.createElement("div");
  labelLayer.style.cssText = "position:absolute;inset:0;overflow:hidden;pointer-events:none;";
  container.appendChild(labelLayer);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.sky); scene.fog = new THREE.Fog(C.sky, 380, 1100);
  const camera = new THREE.PerspectiveCamera(45, W() / H(), 1, 3000);
  camera.position.set(...ZONE_VIEWS.all.pos);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...ZONE_VIEWS.all.tgt); controls.enableDamping = true; controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI / 2 - 0.03; controls.minDistance = 12; controls.maxDistance = 650;
  controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8b97a3, 1.05));
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(130, 210, 90); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 520 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6;
  scene.add(sun);

  // ── Registry ──
  const eqRoot = {}, anims = [], shells = [], labels = [], lamps = {}, spinners = [];
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.62, metalness: 0.2, ...o });
  const shellM = (c, o = {}) => { const m = M(c, o); shells.push(m); return m; };
  const mesh = (geo, mat, x, y, z, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; p && p.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, p) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, p);
  const cyl = (rt, rb, h, mat, x, y, z, p, seg = 28) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, p);
  const sph = (r, mat, x, y, z, p) => mesh(new THREE.SphereGeometry(r, 16, 12), mat, x, y, z, p);
  const link = (a, b, r, mat, p, seg = 10) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg), mat);
    m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); m.castShadow = true; p.add(m); return m; };
  const pipe = (pts, r, mat, p) => { const v = pts.map(q => V(...q)); for (let i = 1; i < v.length; i++) { link(v[i - 1], v[i], r, mat, p); sph(r, mat, v[i].x, v[i].y, v[i].z, p); } sph(r, mat, v[0].x, v[0].y, v[0].z, p); };
  const infra = new THREE.Group(); scene.add(infra);
  const newEq = id => { const g = new THREE.Group(); g.userData.eq = id; scene.add(g); eqRoot[id] = g; return g; };
  const lampM = id => { const m = new THREE.MeshBasicMaterial({ color: 0x888888 }); lamps[id] = m; return m; };
  const addLamp = (id, x, y, z) => { sph(0.75, lampM(id), x, y, z, eqRoot[id]).castShadow = false; };
  const addLabel = (id, x, y, z, text, always = false) => {
    const el = document.createElement("div"); el.className = "s3l"; el.style.cssText = "position:absolute;left:0;top:0;white-space:nowrap;pointer-events:auto;cursor:pointer;will-change:transform;";
    labelLayer.appendChild(el);
    if (id) el.addEventListener("click", () => hooks.onSelect(id));
    labels.push({ el, pos: V(x, y, z), id, text, always, last: "" });
  };

  // ── Ground, roads, river ──
  const gravel = tex(256, 256, (g, w, h) => { g.fillStyle = "#c8cbce"; g.fillRect(0, 0, w, h); for (let i = 0; i < 3500; i++) { const v = 150 + Math.random() * 90; g.fillStyle = `rgb(${v},${v},${v + 4})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, [60, 40]);
  box(224, 0.3, 144, M(0xffffff, { map: gravel, roughness: 1, metalness: 0 }), 0, 0.15, 0, scene).castShadow = false;
  const outside = tex(128, 128, (g, w, h) => { g.fillStyle = "#b6c4b0"; g.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { const v = 150 + Math.random() * 60; g.fillStyle = `rgb(${v - 30},${v},${v - 40})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } }, [80, 80]);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ map: outside, roughness: 1, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);
  const road = (x, z, w, d) => { box(w, 0.35, d, M(0x474c52, { roughness: 0.95, metalness: 0 }), x, 0.2, z, scene).castShadow = false;
    const horiz = w > d; const n = Math.floor((horiz ? w : d) / 9);
    for (let i = 0; i < n; i++) { const o = -(horiz ? w : d) / 2 + 5 + i * 9; box(horiz ? 4 : 0.35, 0.05, horiz ? 0.35 : 4, M(0xf4f4f4), x + (horiz ? o : 0), 0.4, z + (horiz ? 0 : o), scene).castShadow = false; } };
  road(0, 14, 216, 7); road(104, -10, 7, 116); road(-104, 8, 7, 120);
  const riverTex = tex(128, 128, (g, w, h) => { g.fillStyle = "#4f93b8"; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.15})`; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + 6, w * 0.6, y - 6, w, y); g.stroke(); } }, [6, 40]);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(150, 700), new THREE.MeshStandardMaterial({ map: riverTex, roughness: 0.25, metalness: 0.1 }));
  river.rotation.x = -Math.PI / 2; river.position.set(-190, 0.08, 0); river.receiveShadow = true; scene.add(river);
  anims.push(dt => { riverTex.offset.y -= dt * 0.03; });
  const bank = M(0x8a7a5c, { roughness: 1 }); box(6, 0.6, 700, bank, -114, 0.2, 0, scene);
  labels.push({ el: (() => { const e = document.createElement("div"); e.className = "s3l s3l-ctx"; e.textContent = "Sông Vàm Cỏ Đông"; labelLayer.appendChild(e); return e; })(), pos: V(-150, 3, -20), id: null, text: "Sông Vàm Cỏ Đông", ctx: true, last: "" });

  // Hàng rào
  const fenceM = M(0x9aa3ab, { transparent: true, opacity: 0.55 });
  for (const [x, z, w, d] of [[0, -70, 224, 0.2], [0, 70, 224, 0.2], [-112, 0, 0.2, 140], [112, 0, 0.2, 140]]) { box(w, 2.4, d, fenceM, x, 1.4, z, scene).castShadow = false;
    const n = Math.floor((w > d ? w : d) / 8); for (let i = 0; i <= n; i++) { const o = -(w > d ? w : d) / 2 + i * 8; box(0.25, 2.8, 0.25, M(C.steel), x + (w > d ? o : 0), 1.4, z + (w > d ? 0 : o), scene); } }

  // ── Bối cảnh ──
  const house = (x, z, c) => { box(8, 4.5, 7, M(c, { roughness: 0.9, metalness: 0 }), x, 2.4, z, scene); const r = new THREE.Mesh(new THREE.ConeGeometry(6.4, 2.8, 4), M(0xa85a3c, { roughness: 0.9, metalness: 0 })); r.position.set(x, 5.9, z); r.rotation.y = Math.PI / 4; r.castShadow = true; scene.add(r); };
  [-44, -30, -16, -2, 12, 26, 40, 54].forEach((z, i) => house(128 + (i % 2) * 6, z, [0xe8d9c0, 0xd9e3c8, 0xf0e1d0, 0xdcd0e0][i % 4]));
  addLabel(null, 128, 9, -8, "Khu dân cư (phía Đông)"); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx");
  for (let i = 0; i < 4; i++) { cyl(7, 7, 38, M(0xd8d8d4, { roughness: 0.9 }), -50 + i * 20, 19, -108, scene, 24); cyl(7.2, 7, 3, M(C.steel), -50 + i * 20, 39, -108, scene); }
  box(60, 14, 26, M(0xbfc3c6), 20, 7, -118, scene); addLabel(null, -10, 42, -108, "NM xi măng Hà Tiên (phía Bắc)"); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx");
  for (let i = 0; i < 3; i++) sph(9, M(0xe6e8ea, { roughness: 0.4 }), -40 + i * 28, 10, 118, scene).scale.set(1, 1, 1);
  addLabel(null, -12, 24, 118, "Cty Gas Thành Tài (phía Nam)"); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx");
  const tree = (x, z, s = 1) => { cyl(0.35 * s, 0.45 * s, 3 * s, M(0x6b4a2f), x, 1.5 * s, z, scene, 8); const f = new THREE.Mesh(new THREE.SphereGeometry(2.6 * s, 10, 8), M(0x4f8f47, { roughness: 1, metalness: 0 })); f.position.set(x, 4.4 * s, z); f.castShadow = true; scene.add(f); };
  for (let i = 0; i < 26; i++) tree(-100 + i * 8, 76 + (i % 3) * 3, 1 + (i % 4) * 0.12);
  for (let i = 0; i < 16; i++) tree(118 + (i % 3) * 5, -66 + i * 8.5, 1);

  // ── Băng tải ──
  const stripeTex = (base, bar) => tex(16, 32, (g, w, h) => { g.fillStyle = base; g.fillRect(0, 0, w, h); g.fillStyle = bar; g.fillRect(0, 0, w, h / 4); }, null);
  function belt(id, a, b, w, base, bar, owner) {
    const A = V(...a), B = V(...b), L = A.distanceTo(B); const g = new THREE.Group(); g.position.copy(A).add(B).multiplyScalar(0.5); g.lookAt(B); (owner || infra).add(g);
    box(w + 0.5, 0.3, L, M(C.dark), 0, 0, 0, g); box(w + 0.5, 0.06, L, M(C.dark), 0, 0.2, 0, g);
    for (const s of [-1, 1]) box(0.12, 0.45, L, M(C.yellow), s * (w / 2 + 0.2), 0.3, 0, g);
    const t = stripeTex(base, bar); t.repeat.set(1, Math.max(1, L / 2.2));
    const top = box(w, 0.12, L - 0.2, new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, metalness: 0 }), 0, 0.28, 0, g); top.castShadow = false;
    const n = Math.max(2, Math.round(L / 5));
    for (let i = 0; i <= n; i++) { const p = A.clone().lerp(B, i / n); const h = p.y - 0.2; if (h > 0.4) { box(0.35, h, 0.35, M(C.steel), p.x, h / 2, p.z - 0.0, owner || infra); box(w + 0.9, 0.2, 0.3, M(C.steel), p.x, p.y - 0.1, p.z, owner || infra).rotation.copy(g.rotation); } }
    anims.push((dt, t0, sim) => { const ld = id ? sim.eq[id].load : 1; t.offset.y -= dt * ld * 0.9; });
    return g;
  }
  const hopper = (x, y, z, w, h, owner) => { const m = cyl(w * 0.5, w * 0.12, h, M(C.orange), x, y, z, owner, 4); m.rotation.y = Math.PI / 4; return m; };

  // ── Trống quay ──
  function drum(id, cx, cy, cz, len, r, col, spin, opt = {}) {
    const g = eqRoot[id] || newEq(id);
    const m = cyl(r, r, len, shellM(col, { roughness: 0.5, metalness: 0.35 }), cx, cy, cz, g, 36); m.rotation.z = Math.PI / 2;
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; box(0.18, len * 0.96, 0.22, M(0x555d66), Math.cos(a) * (r + 0.06), 0, Math.sin(a) * (r + 0.06), m).rotation.y = -a; }
    for (const f of opt.rings || [-0.32, 0.32]) { const t = cyl(r + 0.28, r + 0.28, 0.7, M(0x40464d), 0, len * f, 0, m, 36); t.castShadow = true; }
    cyl(r + 0.2, r + 0.2, 0.5, M(0xb5b9bd), 0, len * 0.08, 0, m, 36);
    for (const f of [-0.32, 0.32]) for (const zz of [-1, 1]) { const rl = cyl(0.55, 0.55, 0.8, M(0x40464d), cx + len * f, cy - r - 0.35, cz + zz * r * 0.62, g, 14); rl.rotation.x = Math.PI / 2; spinners.push({ m: rl, axis: "y", k: 1.6, id }); }
    box(len * 0.9, 0.6, r * 2.8, M(C.steel), cx, cy - r - 1.05, cz, g);
    for (const f of [-0.32, 0.32]) box(0.8, cy - r - 1.3, 0.8, M(C.steel), cx + len * f, (cy - r - 1.3) / 2, cz + r * 1.3, g);
    const mot = box(2.4, 1.4, 1.6, M(C.blue), cx + len * 0.18, cy - r - 0.2, cz + r + 1.6, g); box(1.6, 1.0, 1.0, M(C.light), cx + len * 0.18, cy - r - 0.2, cz + r + 0.5, g); void mot;
    if (opt.bed) { const bed = box(len * 0.94, r * 0.5, r * 1.5, M(opt.bed, { roughness: 1, metalness: 0 }), cx, cy - r * 0.55, cz, g); bed.castShadow = false; }
    spinners.push({ m, axis: "x", k: spin, id });
    if (opt.incl) g.rotation.z = opt.incl;
    return g;
  }

  // ═════ KHO NGUYÊN LIỆU ═════
  { const g = infra; const wall = shellM(0xd7dade, { roughness: 0.8 }), roof = shellM(0x9aa7b3, { roughness: 0.6 });
    box(44, 0.35, 28, M(C.concrete), -80, 0.3, -40, g);
    box(44, 8, 0.6, wall, -80, 4.2, -54, g); box(0.6, 8, 28, wall, -102, 4.2, -40, g); box(0.6, 4, 28, wall, -58, 2.4, -40, g);
    for (let i = 0; i <= 6; i++) { box(0.7, 10, 0.7, M(C.steel), -102 + i * 7.3, 5.2, -54, g); box(0.7, 10, 0.7, M(C.steel), -102 + i * 7.3, 5.2, -26, g); }
    const rf = box(46, 0.5, 30, roof, -80, 10.4, -40, g); rf.rotation.x = 0; rf.position.y = 10.4;
    const piles = [[-94, -46, 0xf3f1ea, "Urê"], [-84, -48, 0x5a4535, "DAP"], [-72, -45, 0xc0504d, "KCl"], [-92, -34, 0xe9e4c8, "SA"], [-78, -33, 0xf3f1ea, "Urê"]];
    for (const [x, z, c, n] of piles) { const p = new THREE.Mesh(new THREE.ConeGeometry(6.5, 5.5, 20), M(c, { roughness: 1, metalness: 0 })); p.position.set(x, 3.2, z); p.castShadow = true; p.receiveShadow = true; g.add(p); void n; }
    addLabel(null, -80, 12, -40, "Kho nguyên liệu: urê · DAP · KCl · SA"); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx"); }

  // ═════ PHÂN XƯỞNG DÂY CHUYỀN TẠO HẠT SỐ 2 (mặt bằng tổng thể thiết bị – lưới trục 1–19, ước 6 m/nhịp ⇒ ≈108 × 48 m) ═════
  // Tọa độ phân xưởng (hx, hy) tính từ trục 1 và tường phía Bắc → cảnh: x = hx − 54, z = hy − 52.
  const Hx = (hx, hy) => [hx - 54, hy - 52];
  const ctxLabel = (x, y, z, t) => { addLabel(null, x, y, z, t); const L = labels[labels.length - 1]; L.ctx = true; L.el.classList.add("s3l-ctx"); };
  { const g = infra; const wall = shellM(0xd7dade, { roughness: 0.8 }), roof = shellM(0x9aa7b3, { roughness: 0.6, transparent: true, opacity: 0.28 });
    box(110, 0.3, 50, M(C.concrete), 0, 0.3, -28, g);
    for (let i = 0; i <= 9; i++) for (const z of [-52, -4]) box(0.5, 12, 0.5, M(C.steel), -54 + i * 12, 6.3, z, g);
    box(108, 3, 0.3, wall, 0, 1.8, -52, g); box(108, 3, 0.3, wall, 0, 1.8, -4, g); box(0.3, 3, 48, wall, -54, 1.8, -28, g); box(0.3, 3, 48, wall, 54, 1.8, -28, g);
    box(110, 0.4, 50, roof, 0, 12.3, -28, g);
    ctxLabel(0, 14.5, -28, "Phân xưởng dây chuyền tạo hạt số 2 (≈108 × 48 m, theo mặt bằng tổng thể thiết bị)"); }

  // 1) Hệ thống định lượng – băng tải cấp liệu
  { const g = newEq("BT01"); for (const hx of [10, 12.5, 15]) { const [x, z] = Hx(hx, 29); hopper(x, 3.2, z, 2.4, 2.6, g); box(2.4, 0.3, 2.4, M(C.steel), x, 4.6, z, g); for (const d of [-1, 1]) box(0.25, 3.4, 0.25, M(C.steel), x + d * 1.0, 2, z + d * 1.0, g); }
    const [x0, z0] = Hx(8.5, 29.6), [x1, z1] = Hx(17, 29.6); belt("BT01", [x0, 1.0, z0], [x1, 1.0, z1], 1.2, "#c9c2b0", "#f3f1ea", g);
    const [lx, lz] = Hx(12.5, 29); addLamp("BT01", lx, 6.8, lz); addLabel("BT01", lx, 8.2, lz, "BT01 · Hệ thống định lượng"); }
  // 2) Hệ thống máy nghiền
  { const g = newEq("MN01"); for (const hx of [10, 12.5, 15]) { const [x, z] = Hx(hx, 33.5); box(1.9, 2.6, 2.0, M(C.steel), x, 1.9, z, g); box(1.0, 0.9, 1.0, M(C.blue), x + 1.6, 1.0, z, g); const fw = cyl(0.7, 0.7, 0.3, M(C.red), x, 2.0, z - 1.05, g, 20); fw.rotation.x = Math.PI / 2; spinners.push({ m: fw, axis: "y", k: 8, id: "MN01" }); hopper(x, 4.2, z, 1.8, 1.4, g); }
    const [lx, lz] = Hx(12.5, 33.5); addLamp("MN01", lx, 6.2, lz); addLabel("MN01", lx, 7.6, lz, "MN01 · Hệ thống máy nghiền"); }
  // 13) Băng tải nguyên liệu → 6) sàng quay 2 lưới
  { const g = newEq("BT02"); const [x0, z0] = Hx(17.5, 31), [x1, z1] = Hx(26, 28); belt("BT02", [x0, 1.0, z0], [x1, 4.6, z1], 1.2, "#bdb7a6", "#ece9e0", g); const [lx, lz] = Hx(22, 29.5); addLamp("BT02", lx, 7.2, lz); addLabel("BT02", lx, 8.8, lz, "BT02 · Băng tải nguyên liệu"); }
  { const g = newEq("SG01"); const [x, z] = Hx(29, 28); const body = box(6.4, 1.8, 3.2, M(C.green), x, 5.8, z, g); for (const [dx, dz] of [[-2.6, -1.3], [2.6, -1.3], [-2.6, 1.3], [2.6, 1.3]]) cyl(0.3, 0.3, 5, M(C.steel), x + dx, 2.8, z + dz, g, 10);
    anims.push((dt, t, sim) => { const l = sim.eq.SG01.load; body.position.y = 5.8 + Math.sin(t * 38) * 0.05 * l; });
    addLamp("SG01", x, 8.4, z); addLabel("SG01", x, 9.8, z, "SG01 · Sàng quay 2 lưới"); }
  // 12) Máy đánh trộn liên tục
  { const g = newEq("TR01"); const [x, z] = Hx(38.5, 28); box(6.2, 1.8, 2.4, shellM(C.green, { roughness: 0.5 }), x, 2.2, z, g); box(6.4, 0.3, 2.6, M(0x2a6b45), x, 3.2, z, g);
    const sh = cyl(0.25, 0.25, 6.6, M(C.red), x, 2.4, z, g, 10); sh.rotation.z = Math.PI / 2; spinners.push({ m: sh, axis: "x", k: 3, id: "TR01" });
    box(1.6, 1.2, 1.4, M(C.blue), x + 3.9, 2.0, z, g); addLamp("TR01", x, 5.2, z); addLabel("TR01", x, 6.6, z, "TR01 · Máy đánh trộn liên tục"); }
  // 3) Máy tạo hạt thùng quay Ø2,2 × 9 m (+16: urê hóa lỏng)
  { const [x, z] = Hx(47.5, 28); drum("TH01", x, 3.6, z, 9, 1.1, C.navy, 1.4, { bed: 0xcfd6dd, rings: [-0.3, 0.3] }); const g = eqRoot.TH01;
    pipe([[x - 2, 6.6, z + 2], [x - 2, 4.4, z + 2]], 0.22, M(C.yellow), g); pipe([[x + 1, 6.6, z + 2], [x + 1, 4.4, z + 2]], 0.2, M(0xd9534f), g);
    addLamp("TH01", x, 6.4, z); addLabel("TH01", x, 8, z, "TH01 · Máy tạo hạt thùng quay Ø2,2×9 m");
    cyl(1.4, 1.4, 3.6, shellM(0xe7e9ec, { roughness: 0.5 }), x + 1, 2.1, z + 6, infra, 24); ctxLabel(x + 1, 5.8, z + 6, "Hệ thống urê hóa lỏng"); }
  // 14) Gầu tải hạt ướt → cửa nạp thùng sấy
  { const g = newEq("BT03"); const [x, z] = Hx(55.5, 27); box(1.8, 14, 1.8, M(C.steel), x, 7.3, z, g); box(2.4, 1.4, 2.4, M(0x4a5560), x, 14.6, z, g);
    const bk = []; for (let i = 0; i < 12; i++) bk.push(box(1.0, 0.6, 0.5, M(C.yellow), x, 1 + i * 1.1, z + 0.95, g));
    anims.push((dt, t, sim) => { const l = sim.eq.BT03.load; for (const b of bk) { b.position.y += dt * 1.8 * l; if (b.position.y > 13.5) b.position.y = 1; } });
    const [x2, z2] = Hx(52.5, 14); belt("BT03", [x, 13.6, z - 0.5], [x2, 6.0, z2 + 0.5], 1.1, "#cfc9b8", "#f3f1ea", g);
    addLamp("BT03", x, 17, z); addLabel("BT03", x, 18.4, z, "BT03 · Gầu tải hạt ướt"); }

  // ── Hệ thống sấy khô 1 – Nguồn số 04 (CN-04-01): lò đốt → cyclone chùm → quạt thổi → thùng sấy → cyclone đơn → túi vải → quạt hút → ống khói ──
  { const g = newEq("LD01"); const [x, z] = Hx(39, 11.5); // buồng đốt 5,3 × 2,55 m, cao tổng 5,1 m (BV thế xây)
    box(5.3, 2.4, 2.55, shellM(C.brick, { roughness: 0.9 }), x, 1.5, z, g); box(5.5, 0.4, 2.75, M(0x4a3b36), x, 2.9, z, g);
    box(5.0, 2.0, 2.3, shellM(0x7b848c, { roughness: 0.5 }), x, 4.2, z, g); // BSKK (bộ trao đổi nhiệt)
    for (let k = 0; k < 3; k++) box(1.6, 0.15, 2.35, M(0x5c646b), x - 1.7 + k * 1.7, 5.25, z, g);
    const door = new THREE.MeshBasicMaterial({ color: 0xff8a1e }); box(1.0, 0.9, 0.1, door, x - 0.6, 1.6, z + 1.3, g).castShadow = false;
    box(0.7, 1.0, 0.7, M(0x2c3136), x + 1.6, 1.4, z + 1.3, g); // cửa cào tro
    const lt = new THREE.PointLight(0xff8a30, 0, 18, 2); lt.position.set(x - 0.6, 1.8, z + 2.5); scene.add(lt);
    anims.push((dt, t, sim) => { const l = sim.eq.LD01.load; door.color.setHSL(0.07, 1, 0.3 + 0.25 * l * (0.85 + 0.15 * Math.sin(t * 17))); lt.intensity = l * (24 + 5 * Math.sin(t * 13)); });
    // phễu liệu, vít cấp liệu, băng tải 8,5 m nghiêng 32°, hố cấp liệu 3×1,6×2 m
    hopper(x - 3.4, 3.2, z, 1.6, 1.6, g); box(1.8, 0.6, 0.6, M(C.steel), x - 2.9, 1.9, z, g);
    belt("LD01", [x - 10.5, 0.5, z], [x - 3.6, 4.3, z], 0.9, "#4a4f55", "#6a7078", g);
    box(3, 0.1, 1.6, M(0x3a3f45), x - 11.7, 0.36, z, g); const pile = new THREE.Mesh(new THREE.ConeGeometry(2.6, 2.2, 14), M(0x9c7a4d, { roughness: 1, metalness: 0 })); pile.position.set(x - 12.8, 1.4, z + 0.3); pile.castShadow = true; g.add(pile);
    const blw = cyl(0.55, 0.55, 0.5, M(C.red), x - 3.2, 1.0, z + 1.8, g, 14); blw.rotation.x = Math.PI / 2; spinners.push({ m: blw, axis: "y", k: 10, id: "LD01" });
    addLamp("LD01", x, 7.2, z); addLabel("LD01", x, 8.8, z, "LD01 · Lò đốt sinh khối 2,5 Mkcal/h"); }
  { const g = newEq("CC01"); const [x, z] = Hx(45.5, 11.5); box(2.4, 2.2, 2.4, shellM(0xc9ced3, { roughness: 0.5 }), x, 5.5, z, g); const h = cyl(1.3, 0.25, 2.4, shellM(0xc9ced3, { roughness: 0.5 }), x, 3.2, z, g, 4); h.rotation.y = Math.PI / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) cyl(0.18, 0.18, 0.7, M(0x707a84), x - 0.85 + i * 0.57, 6.9, z - 0.85 + j * 0.57, g, 8);
    cyl(0.4, 0.4, 0.6, M(C.blue), x, 1.7, z, g, 12); for (const dx of [-1, 1]) for (const dz of [-1, 1]) box(0.25, 3.8, 0.25, M(C.steel), x + dx * 1.0, 1.9, z + dz * 1.0, g);
    addLamp("CC01", x, 8.4, z); addLabel("CC01", x, 9.8, z, "CC01 · Cyclone chùm (không có ống thải)"); }
  { const g = newEq("QT01"); const [x, z] = Hx(49, 8.5); cyl(1.4, 1.4, 1.0, M(0x6f7a85), x, 2.2, z, g, 28).rotation.x = Math.PI / 2; box(1.6, 1.3, 1.6, M(C.blue), x, 2.0, z - 1.9, g);
    const wh = new THREE.Group(); wh.position.set(x, 2.2, z + 0.55); g.add(wh); for (let i = 0; i < 8; i++) { const b = box(0.15, 1.2, 0.15, M(0x2a2f34), 0, 0, 0, wh); b.rotation.z = (i / 8) * Math.PI * 2; } spinners.push({ m: wh, axis: "z", k: 12, id: "QT01" });
    box(3.2, 0.4, 2.4, M(C.steel), x, 0.5, z, g); addLamp("QT01", x, 4.4, z); addLabel("QT01", x, 5.8, z, "QT01 · Quạt thổi khí nóng"); }
  { const [x, z] = Hx(63, 14); drum("SY01", x, 3.4, z, 22, 1.1, C.orange, 0.5, { bed: 0xe3d9c4, rings: [-0.32, 0.05, 0.3] }); addLamp("SY01", x, 6.4, z); addLabel("SY01", x, 8, z, "SY01 · Thùng sấy Ø2,2×22 m"); }
  { const g = infra; const duct = M(0x9aa3ab, { roughness: 0.5 }); const a = Hx(39, 11.5), b = Hx(45.5, 11.5), c = Hx(49, 8.5), d = Hx(52, 14);
    pipe([[a[0] + 2.6, 4.2, a[1]], [a[0] + 3.2, 4.2, a[1]], [b[0] - 1.3, 5.5, b[1]]], 0.55, duct, g); pipe([[b[0], 3.0, b[1]], [b[0], 1.6, b[1] + 0], [c[0], 2.2, c[1] + 2.4]], 0.5, duct, g);
    pipe([[c[0] + 1.4, 2.2, c[1]], [d[0] - 1.6, 2.6, d[1] - 1.5], [d[0] - 1.6, 3.4, d[1]]], 0.6, duct, g); }
  { const g = newEq("XC01"); const [x, z] = Hx(78.5, 14); const sh = shellM(0xc9ced3, { roughness: 0.5 }); cyl(1.0, 1.0, 4.2, sh, x, 6.1, z, g, 28); cyl(1.0, 0.25, 1.6, sh, x, 3.2, z, g, 28); box(1.4, 0.8, 1.4, M(C.steel), x, 7.2, z + 1.4, g);
    for (const dx of [-1.1, 1.1]) for (const dz of [-1.1, 1.1]) box(0.25, 3.0, 0.25, M(C.steel), x + dx, 1.6, z + dz, g); cyl(0.3, 0.3, 0.5, M(C.blue), x, 2.0, z, g, 10);
    addLamp("XC01", x, 9.2, z); addLabel("XC01", x, 10.6, z, "XC01 · Cyclone đơn Ø2×6 m"); pipe([[x - 55.5 + 55.5 - 2.0, 3.4, z], [x - 1.0, 7.2, z]], 0.5, M(0x9aa3ab), infra); }
  { const g = newEq("LB01"); const [x, z] = Hx(86.5, 14); sph(0.01, M(0xffffff), x, 0, z, g);
    box(8.7, 3.9, 2.8, shellM(0xb9c0c7, { roughness: 0.5 }), x, 8.2, z, g); box(8.9, 0.4, 3.0, M(0x8a939b), x, 10.4, z, g);
    for (let i = 0; i < 3; i++) { const hp = cyl(1.8, 0.3, 3.2, M(0x9aa3ab), x - 3 + i * 3, 4.6, z, g, 4); hp.rotation.y = Math.PI / 4; cyl(0.3, 0.3, 0.5, M(C.blue), x - 3 + i * 3, 2.7, z, g, 10); }
    for (const dx of [-4.2, 4.2]) for (const dz of [-1.3, 1.3]) box(0.4, 6.4, 0.4, M(C.steel), x + dx, 3.4, z + dz, g);
    const man = cyl(0.3, 0.3, 8.4, M(C.blue), x, 10.9, z - 1.0, g, 12); man.rotation.z = Math.PI / 2; for (let i = 0; i < 8; i++) cyl(0.12, 0.12, 0.9, M(C.yellow), x - 3.6 + i * 1.03, 10.9, z - 0.5, g, 8);
    const pl = new THREE.MeshBasicMaterial({ color: 0x555555 }); sph(0.4, pl, x + 4.6, 10.6, z, g).castShadow = false;
    anims.push((dt, t, sim) => { pl.color.set(sim.eq.LB01.load > 0.5 && (t % 1.6) < 0.25 ? 0x35e08a : 0x555555); });
    box(2.6, 2.4, 1.6, M(C.light), x + 5.8, 5.0, z, g);
    addLamp("LB01", x, 12.4, z); addLabel("LB01", x, 13.8, z, "LB01 · Lọc bụi túi vải 432 túi"); }
  { const g = newEq("QH01"); const [x, z] = Hx(94, 14); cyl(1.7, 1.7, 1.4, M(0x6f7a85), x, 2.4, z, g, 32).rotation.x = Math.PI / 2; box(2.4, 2.0, 2.4, M(C.blue), x, 2.6, z - 2.6, g);
    const wh = new THREE.Group(); wh.position.set(x, 2.4, z + 0.8); g.add(wh); for (let i = 0; i < 10; i++) { const b = box(0.2, 1.6, 0.16, M(0x2a2f34), 0, 0, 0, wh); b.rotation.z = (i / 10) * Math.PI; } spinners.push({ m: wh, axis: "z", k: 14, id: "QH01" });
    box(4, 0.4, 3, M(C.steel), x, 0.5, z, g); addLamp("QH01", x, 5.4, z); addLabel("QH01", x, 6.8, z, "QH01 · Quạt hút 55.000 m³/h"); }
  { const g = newEq("HT01"); const [x, z] = Hx(99, 14); const sh = shellM(0x7fb6d6, { roughness: 0.35, metalness: 0.1 }); cyl(1.4, 1.4, 9, sh, x, 5, z, g, 28); cyl(1.9, 1.9, 1.2, M(0x4d86a8), x, 0.9, z, g, 28); for (const y of [3, 6, 9]) cyl(1.5, 1.5, 0.3, M(0x3d6f8f), x, y, z, g, 28);
    pipe([[x + 1.7, 1.0, z + 1.5], [x + 2.4, 1.0, z + 1.5], [x + 2.4, 7.5, z + 1.5], [x + 1.2, 7.5, z + 0.8]], 0.15, M(C.cyan), g);
    const drops = []; for (let i = 0; i < 50; i++) { const d = sph(0.08, M(0x9fd6ee), x + (Math.random() - 0.5) * 1.8, 2 + Math.random() * 7, z + (Math.random() - 0.5) * 1.8, g); d.castShadow = false; d.userData.sp = 2 + Math.random() * 2; drops.push(d); }
    anims.push((dt, t, sim) => { const l = sim.eq.HT01.load; for (const d of drops) { d.visible = l > 0.2; d.position.y -= dt * d.userData.sp * l; if (d.position.y < 1.8) d.position.y = 8.5; } });
    addLamp("HT01", x, 10.8, z); addLabel("HT01", x, 12.2, z, "HT01 · Tháp hấp thụ NH₃ (dự án BOQ)"); }
  { const g = infra; const [x, z] = Hx(104, 14); const st = cyl(0.3, 0.4, 22, M(0xe9ebed), x, 11.3, z, g, 20); st.castShadow = true; for (const y of [15, 18, 21]) cyl(0.34, 0.34, 1.0, M(C.red), x, y, z, g, 20); sph(0.2, new THREE.MeshBasicMaterial({ color: 0xff3030 }), x, 22.4, z, g);
    box(0.9, 0.5, 0.9, M(C.steel), x + 0.5, 12.5, z, g); ctxLabel(x, 24.6, z, "S02 · Ống khói dòng thải 04 — cao 22 m, D1 800 / D2 600 mm");
    const duct = M(0x9aa3ab, { roughness: 0.5 }); const xc = Hx(78.5, 14), lb = Hx(86.5, 14), qh = Hx(94, 14), ht = Hx(99, 14), sy = Hx(63, 14);
    pipe([[sy[0] + 11.5, 3.4, sy[1]], [xc[0] - 1.0, 3.4, xc[1]]], 0.5, duct, g); pipe([[xc[0] + 1.0, 7.2, xc[1] + 1.4], [lb[0] - 4.3, 7.2, lb[1]]], 0.5, duct, g);
    pipe([[lb[0] + 6.9, 5.0, lb[1]], [qh[0] - 1.7, 2.4, qh[1]]], 0.55, duct, g); pipe([[qh[0] + 1.7, 2.4, qh[1] - 1.0], [ht[0] - 1.4, 3.0, ht[1] - 1.0]], 0.55, duct, g);
    pipe([[ht[0], 9.6, ht[1]], [ht[0], 10.6, ht[1]], [x, 10.6, z], [x, 11.0, z]], 0.4, duct, g);
    const steamM = M(C.yellow, { roughness: 0.4 }); const gx = Hx(47.5, 28);
    pipe([[-23, 7, 24], [-23, 7, 2], [gx[0] - 1.5, 7, 2], [gx[0] - 1.5, 7, gx[1] + 2]], 0.3, steamM, g); for (const [px, pz] of [[-23, 14], [-23, 6], [-12, 2], [-4, 2], [gx[0] - 1.5, -10], [gx[0] - 1.5, -20]]) box(0.4, 7, 0.4, M(C.steel), px, 3.5, pz, g); }

  // ── Làm nguội → sàng → băng tải → đóng bao (hướng Đông) ──
  { const [x, z] = Hx(84, 22); drum("LN01", x, 3.0, z, 16, 1.5, 0x4aa3d6, 0.6, { bed: 0xd9d6cc }); addLamp("LN01", x, 6, z); addLabel("LN01", x, 7.6, z, "LN01 · Thùng làm nguội"); const a = Hx(75, 14), s = Hx(75, 21); pipe([[a[0], 3.0, a[1] + 1.5], [s[0], 3.0, s[1] - 0.5]], 0.5, M(C.steel), infra); }
  { const g = newEq("SG02"); const [x, z] = Hx(95.5, 22); const body = box(5.6, 1.8, 3.0, M(0x3a8fb5), x, 4.6, z, g); for (const [dx, dz] of [[-2.2, -1.2], [2.2, -1.2], [-2.2, 1.2], [2.2, 1.2]]) cyl(0.28, 0.28, 4.4, M(C.steel), x + dx, 2.2, z + dz, g, 10);
    anims.push((dt, t, sim) => { const l = sim.eq.SG02.load; body.position.y = 4.6 + Math.sin(t * 36) * 0.05 * l; }); addLamp("SG02", x, 7.2, z); addLabel("SG02", x, 8.6, z, "SG02 · Sàng phân loại"); }
  { const g = newEq("BT04"); const a = Hx(98.6, 22), b = Hx(102, 22); belt("BT04", [a[0], 3.4, a[1]], [b[0], 2.2, b[1]], 1.2, "#d6d1c3", "#f3f1ea", g); addLamp("BT04", (a[0] + b[0]) / 2, 5.4, a[1]); addLabel("BT04", (a[0] + b[0]) / 2, 6.8, a[1], "BT04 · Băng tải sản phẩm"); }
  { const g = newEq("DB01"); const [x, z] = Hx(105, 22); box(4.6, 5.6, 4.4, M(0x5a7aa0), x, 3.1, z, g); box(3.6, 0.5, 3.4, M(C.light), x, 6.1, z, g); hopper(x, 7.6, z, 3, 2.6, g);
    belt("DB01", [x + 2.3, 1.3, z], [x + 19, 1.3, z], 1.4, "#4a4f55", "#6a7078", g);
    const bags = []; for (let i = 0; i < 9; i++) { const b = box(0.9, 0.3, 0.6, M(0xf5f5f0), x + 3 + i * 1.7, 1.65, z, g); bags.push(b); }
    anims.push((dt, t, sim) => { const l = sim.eq.DB01.load; for (const b of bags) { b.position.x += dt * 1.1 * l; if (b.position.x > x + 18) b.position.x = x + 3; } });
    addLamp("DB01", x, 10.4, z); addLabel("DB01", x, 11.8, z, "DB01 · Máy đóng bao"); }
  { const g = infra; box(36, 0.35, 28, M(C.concrete), 90, 0.3, -30, g);
    box(36, 7.5, 0.6, shellM(0xd7dade), 90, 4, -44, g); box(0.6, 7.5, 28, shellM(0xd7dade), 72, 4, -30, g); box(0.6, 7.5, 28, shellM(0xd7dade), 108, 4, -30, g);
    box(38, 0.5, 30, shellM(0x9aa7b3), 90, 8.2, -30, g);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) for (let h = 0; h < 4; h++) box(2.3, 0.45, 1.6, M(0xf1f0ea), 78 + c * 5, 1 + h * 0.5, -40 + r * 4.4, g).castShadow = false;
    ctxLabel(90, 11.2, -30, "Kho thành phẩm NPK"); }

  // ═════ LÒ HƠI ═════
  const boiler = (id, cx, cz, col, coal) => { const g = newEq(id);
    box(12, 7.4, 8.4, shellM(col, { roughness: 0.55 }), cx, 3.7, cz, g); const drm = cyl(1.2, 1.2, 10.5, M(0xaeb4ba), cx, 8.6, cz, g, 24); drm.rotation.z = Math.PI / 2;
    cyl(0.9, 0.9, 10, M(0xaeb4ba), cx, 7.4, cz + 2.6, g, 20).rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) box(0.5, 4, 0.5, M(C.steel), cx + s * 4.5, 5.6, cz + 3.4, g);
    const flame = new THREE.MeshBasicMaterial({ color: 0xff8a1e }); box(0.1, 1.8, 3.2, flame, cx + 6.06, 2.4, cz, g).castShadow = false;
    if (coal) { box(5, 4.2, 4.2, M(0x2b2f33), cx - 8.6, 4.6, cz, g); box(5.4, 0.5, 4.6, M(C.steel), cx - 8.6, 6.9, cz, g); } else { const sh = cyl(2.8, 1, 3.2, M(0x9c7a4d), cx - 8.2, 6.2, cz, g, 4); sh.rotation.y = Math.PI / 4; box(4, 1.2, 1.2, M(C.steel), cx - 6.6, 2.6, cz, g); }
    const fan = cyl(1, 1, 0.6, M(C.red), cx + 3, 4, cz + 4.5, g, 16); fan.rotation.x = Math.PI / 2; spinners.push({ m: fan, axis: "y", k: 10, id });
    anims.push((dt, t, sim) => { const l = sim.eq[id].load; flame.color.setHSL(0.06, 1, 0.12 + 0.36 * l * (0.8 + 0.2 * Math.sin(t * 11 + cx))); });
    addLamp(id, cx, 12.4, cz); addLabel(id, cx, 14, cz, `${id} · ${coal ? "Lò hơi than 8 t/h" : "Lò hơi sinh khối 6 t/h"}`); };
  boiler("LH01", -38, 38, 0x6b8aa8, false); boiler("LH02", -8, 38, 0x5a5f66, true);
  { const g = infra; cyl(0.5, 0.65, 18, M(0xf1f3f5), -23, 9, 28, g, 20); for (const y of [13, 15.5, 18]) cyl(0.52, 0.52, 1.1, M(C.red), -23, y - 0.5, 28, g, 20).scale.set(1.0, 1, 1);
    sph(0.25, new THREE.MeshBasicMaterial({ color: 0xff3030 }), -23, 18.3, 28, g);
    const duct = M(0x9aa3ab, { roughness: 0.5 }); pipe([[-36, 7.4, 34], [-36, 10, 34], [-36, 10, 28], [-23.6, 10, 28]], 0.6, duct, g); pipe([[-10, 7.4, 34], [-10, 10, 34], [-10, 10, 28], [-22.4, 10, 28]], 0.6, duct, g);
    addLabel(null, -23, 20.4, 28, "S01 · Ống khói chung 18 m, Ø700"); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx");
    const wood = new THREE.Mesh(new THREE.ConeGeometry(9, 6, 18), M(0x9c7a4d, { roughness: 1, metalness: 0 })); wood.position.set(-58, 3, 56); wood.castShadow = true; g.add(wood);
    box(26, 0.4, 20, M(C.concrete), -58, 0.3, 56, g); addLabel(null, -58, 9, 56, "Kho sinh khối"); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx");
    const coalp = new THREE.Mesh(new THREE.ConeGeometry(8, 5, 18), M(0x22262a, { roughness: 1, metalness: 0 })); coalp.position.set(8, 2.6, 58); coalp.castShadow = true; g.add(coalp);
    box(22, 0.4, 18, M(C.concrete), 8, 0.3, 58, g); addLabel(null, 8, 8.4, 58, "Kho than"); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx"); }

  // ═════ HTXLNT ═════
  { const g = infra; box(46, 0.35, 48, M(0xd4d6d8), -81, 0.3, 42, g);
    const waterM = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 });
    const tankR = (x, z, w, d, h, wc, name) => { box(w, h, d, shellM(0xb5bbc0, { roughness: 0.8 }), x, h / 2, z, g); const wt = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.8, d - 0.8), waterM(wc)); wt.rotation.x = -Math.PI / 2; wt.position.set(x, h + 0.02, z); g.add(wt);
      box(w - 0.8, 0.3, d - 0.8, M(0x33383d), x, h - 0.9, z, g).visible = false; if (name) { addLabel(null, x, h + 2, z, name); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx"); } return wt; };
    const tankC = (x, z, r, h, wc, name) => { cyl(r, r, h, shellM(0xb5bbc0, { roughness: 0.8 }), x, h / 2, z, g, 32); const wt = new THREE.Mesh(new THREE.CircleGeometry(r - 0.4, 32), waterM(wc)); wt.rotation.x = -Math.PI / 2; wt.position.set(x, h + 0.02, z); g.add(wt); if (name) { addLabel(null, x, h + 2, z, name); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx"); } return wt; };
    tankR(-96, 28, 12, 7, 4, 0x8a7a55, "Bể điều hòa"); tankR(-85, 28, 6, 6, 3.6, 0x9a8a60, "Keo tụ – tạo bông"); tankC(-76, 28, 3.6, 4, 0x8a8a70, "Tuyển nổi (loại bỏ khi cải tạo)"); tankC(-66, 28, 4, 3.6, 0x7a8a78, "Lắng hóa lý");
    tankR(-96, 46, 10, 7, 4.2, 0x6a7a5a, "Anoxic"); tankR(-84, 46, 10, 7, 4.2, 0x5a7a58, "MBBR"); const aeroW = tankR(-69, 46, 16, 8, 4.6, 0x4a7a55, "Aerotank"); tankC(-96, 60, 5, 3.6, 0x6a8a78, "Lắng sinh học"); tankR(-84, 60, 8, 6, 3.2, 0x7aaa9a, "Khử trùng – lọc");
    const pond = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), waterM(0x5c6f5c)); pond.rotation.x = -Math.PI / 2; pond.position.set(-66, 0.42, 60); g.add(pond); box(21.5, 0.5, 13.5, M(0x6a6f55), -66, 0.2, 60, g).castShadow = false; addLabel(null, -66, 3, 60, "Hồ sự cố"); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx");
    const pm = M(C.cyan, { roughness: 0.4 }); pipe([[-90, 1.5, 28], [-88.2, 1.5, 28]], 0.28, pm, g); pipe([[-82, 1.5, 28], [-79.6, 1.5, 28]], 0.28, pm, g); pipe([[-72.4, 1.5, 28], [-70, 1.5, 28]], 0.28, pm, g);
    pipe([[-62, 1.5, 28], [-60, 1.5, 28], [-60, 1.5, 36], [-104, 1.5, 36], [-104, 1.5, 46], [-101, 1.5, 46]], 0.28, pm, g); pipe([[-91, 1.5, 46], [-89, 1.5, 46]], 0.28, pm, g); pipe([[-79, 1.5, 46], [-77, 1.5, 46]], 0.28, pm, g);
    pipe([[-69, 1.2, 50.2], [-69, 1.2, 54], [-96, 1.2, 54], [-96, 1.2, 57.4]], 0.28, pm, g); pipe([[-91, 1.2, 60], [-88, 1.2, 60]], 0.28, pm, g);
    const outM = M(0x3a8fb5); pipe([[-88, 1.2, 66], [-88, 1.2, 66.6], [-116, 1.2, 66.6]], 0.3, outM, g);
    const valve = new THREE.MeshBasicMaterial({ color: 0x35e08a }); sph(0.7, valve, -108, 2.1, 66.6, g); addLabel(null, -108, 4.6, 66.6, "Van xả ra sông", false); labels[labels.length - 1].ctx = true; labels[labels.length - 1].el.classList.add("s3l-ctx"); labels[labels.length - 1].valve = true;
    // bọt khí Aerotank
    const bub = []; for (let i = 0; i < 90; i++) { const b = sph(0.12, M(0xdff3ff, { transparent: true, opacity: 0.7 }), -76 + Math.random() * 14, 0.5 + Math.random() * 3.6, 46 + (Math.random() - 0.5) * 6, g); b.castShadow = false; b.userData.sp = 0.7 + Math.random() * 0.8; bub.push(b); }
    anims.push((dt, t, sim) => { const on = sim.eq.TK01.load > 0.3 && sim.pv.DO > 1; for (const b of bub) { b.visible = on; b.position.y += dt * b.userData.sp; if (b.position.y > 4.5) b.position.y = 0.6; } valve.color.set(sim.pv.discharge ? 0x35e08a : 0xe53935); aeroW.material.color.setHSL(0.33 - 0.04 * (1 - Math.min(1, sim.pv.DO / 3)), 0.35, 0.36); });
    // cầu gạt bể lắng
    const arm = box(9, 0.2, 0.3, M(C.steel), -96, 4.1, 60, g); anims.push((dt, t, sim) => { arm.rotation.y += dt * 0.3 * sim.eq.BM01.load; }); }
  { const g = newEq("BM01"); box(2.6, 1.3, 1.4, M(C.blue), -104, 0.9, 30, g); const mt = cyl(0.6, 0.6, 1.8, M(C.light), -102, 0.95, 30, g, 16); mt.rotation.z = Math.PI / 2; const sh = cyl(0.25, 0.25, 0.9, M(C.red), -103.3, 0.95, 30, g, 10); sh.rotation.z = Math.PI / 2; spinners.push({ m: sh, axis: "y", k: 20, id: "BM01" });
    pipe([[-104, 1.2, 30], [-104, 1.2, 25], [-97, 1.2, 25]], 0.2, M(C.cyan), g); addLamp("BM01", -103, 3.2, 30); addLabel("BM01", -103, 4.7, 30, "BM01 · Bơm nước thải"); }
  { const g = newEq("TK01"); box(6.4, 3.6, 4.4, shellM(0xe7e9ec, { roughness: 0.7 }), -57, 1.9, 46, g); for (const z of [-1.2, 1.2]) { box(1.6, 1.2, 1.2, M(C.blue), -57.4, 1.0, 46 + z, g); const w = cyl(0.6, 0.6, 0.5, M(C.red), -56, 1.0, 46 + z, g, 16); w.rotation.z = Math.PI / 2; spinners.push({ m: w, axis: "y", k: 18, id: "TK01" }); }
    pipe([[-60.2, 2, 46], [-62, 2, 46], [-62, 5.2, 46]], 0.3, M(C.dark), g); addLamp("TK01", -57, 5, 46); addLabel("TK01", -57, 6.5, 46, "TK01 · Máy thổi khí"); }
  { const g = newEq("DL01"); for (const [x, c] of [[-58, 0xf2c200], [-56, 0xffffff], [-54, 0x3fb6d8]]) cyl(0.9, 0.9, 2.6, M(c, { roughness: 0.6 }), x, 1.6, 28, g, 20); box(1.4, 1, 1, M(C.blue), -56, 0.7, 30.4, g);
    const bl = new THREE.MeshBasicMaterial({ color: 0x555555 }); sph(0.3, bl, -56, 3.5, 28, g); anims.push((dt, t, sim) => { bl.color.set(sim.eq.DL01.load > 0.5 && (t % 1.2) < 0.4 ? 0x35e08a : 0x555555); });
    addLamp("DL01", -56, 4.8, 28); addLabel("DL01", -56, 6.2, 28, "DL01 · Bơm định lượng"); }

  // ── Xe tải, cột gió ──
  { const t = new THREE.Group(); box(6, 2.4, 2.4, M(0xe9ebed), -1.6, 2.1, 0, t); box(2.2, 2.2, 2.4, M(C.blue), 2.7, 1.9, 0, t); for (const x of [-3.5, -1, 2.8]) for (const z of [-1.2, 1.2]) { const w = cyl(0.5, 0.5, 0.35, M(0x222629), x, 0.6, z, t, 14); w.rotation.x = Math.PI / 2; } t.position.set(-100, 0, 14); scene.add(t);
    let dir = 1; anims.push(dt => { t.position.x += dir * dt * 6; if (t.position.x > 100) { dir = -1; t.rotation.y = Math.PI; } if (t.position.x < -100) { dir = 1; t.rotation.y = 0; } }); }
  const sock = new THREE.Group(); cyl(0.12, 0.12, 8, M(C.steel), 0, 4, 0, sock, 8); const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 3.4, 12, 1, true), new THREE.MeshStandardMaterial({ color: 0xff7b2e, side: THREE.DoubleSide })); cone.rotation.z = -Math.PI / 2; cone.position.set(1.8, 8, 0); const sockArm = new THREE.Group(); sockArm.position.set(0, 0, 0); sockArm.add(cone); sock.add(sockArm); sock.position.set(36, 0, 10); scene.add(sock);

  // ── Khói ống khói ──
  const smokeMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uCol: { value: new THREE.Color(0xffffff) }, uScale: { value: 1 } },
    vertexShader: "attribute float aAge; attribute float aSize; varying float vA; uniform float uScale; void main(){ vA = aAge; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * (0.55 + aAge*1.5) * uScale * (260.0 / -mv.z); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "varying float vA; uniform vec3 uCol; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if(d>0.5) discard; float a = (1.0 - vA) * 0.42 * (1.0 - smoothstep(0.05, 0.5, d)); gl_FragColor = vec4(uCol, a); }" });
  const makeSmoke = (pos, col, size) => { const N = 170, geo = new THREE.BufferGeometry(); const P = new Float32Array(N * 3), Age = new Float32Array(N).fill(1), Sz = new Float32Array(N).fill(size);
    geo.setAttribute("position", new THREE.BufferAttribute(P, 3)); geo.setAttribute("aAge", new THREE.BufferAttribute(Age, 1)); geo.setAttribute("aSize", new THREE.BufferAttribute(Sz, 1));
    const m = smokeMat.clone(); m.uniforms.uCol.value = new THREE.Color(col); const pts = new THREE.Points(geo, m); pts.frustumCulled = false; scene.add(pts);
    const vel = Array.from({ length: N }, () => V(0, 0, 0)); let acc = 0;
    return { update(dt, emit, w, u) { acc += dt * emit * 24; for (let i = 0; i < N; i++) { const a = Age[i];
        if (a >= 1) { if (acc >= 1) { acc -= 1; Age[i] = 0; P[i * 3] = pos.x + (Math.random() - 0.5) * 0.4; P[i * 3 + 1] = pos.y; P[i * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.4; vel[i].set(0, 3.2 + Math.random() * 1.2, 0); } continue; }
        Age[i] = a + dt / 14; vel[i].y = Math.max(0.35, vel[i].y - dt * 0.35);
        P[i * 3] += (w.wx * u * 2.6 + (Math.random() - 0.5) * 0.5) * dt * (0.3 + a * 1.2) + vel[i].x * dt; P[i * 3 + 1] += vel[i].y * dt; P[i * 3 + 2] += (w.wz * u * 2.6 + (Math.random() - 0.5) * 0.5) * dt * (0.3 + a * 1.2) + vel[i].z * dt; }
      geo.attributes.position.needsUpdate = true; geo.attributes.aAge.needsUpdate = true; } }; };
  const smokeS01 = makeSmoke(V(-23, 18.4, 28), 0x8f949a, 6), smokeS02 = makeSmoke(V(50, 22.4, -38), 0xffffff, 7);

  // ── Lớp phủ nồng độ Gauss ──
  let plumeMesh = null, plumeTex = null;
  const setPlume = (rgba, n, half, cx, cz, visible) => {
    if (!rgba) { if (plumeMesh) plumeMesh.visible = false; return; }
    if (!plumeMesh) { plumeTex = new THREE.DataTexture(new Uint8Array(n * n * 4), n, n, THREE.RGBAFormat); plumeTex.magFilter = THREE.LinearFilter; plumeTex.minFilter = THREE.LinearFilter; plumeTex.colorSpace = THREE.SRGBColorSpace;
      plumeMesh = new THREE.Mesh(new THREE.PlaneGeometry(2 * half, 2 * half), new THREE.MeshBasicMaterial({ map: plumeTex, transparent: true, depthWrite: false, opacity: 0.9 })); plumeMesh.rotation.x = -Math.PI / 2; plumeMesh.position.set(cx, 0.55, cz); plumeMesh.renderOrder = 2; scene.add(plumeMesh); }
    plumeMesh.visible = !!visible; if (!rgba) return;
    const d = plumeTex.image.data; for (let j = 0; j < n; j++) d.set(rgba.subarray((n - 1 - j) * n * 4, (n - j) * n * 4), j * n * 4); plumeTex.needsUpdate = true; };

  // ── Gợi ý, chọn thiết bị ──
  const hintMesh = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.6, 4), new THREE.MeshBasicMaterial({ color: 0xffc400 })); hintMesh.rotation.x = Math.PI; hintMesh.visible = false; scene.add(hintMesh);
  let selectedId = null; const selBox = new THREE.BoxHelper(new THREE.Object3D(), 0xffc400); selBox.visible = false; scene.add(selBox);
  const flags = { labels: true, xray: false, hints: true, plume: false, shadows: true, windFrom: 270, u10: 3, hintId: null };
  const select = id => { selectedId = id; if (id && eqRoot[id]) { selBox.setFromObject(eqRoot[id]); selBox.visible = true; } else selBox.visible = false; };
  const setFlags = f => { Object.assign(flags, f); renderer.shadowMap.enabled = flags.shadows; sun.castShadow = flags.shadows;
    for (const m of shells) { if (flags.xray) { m.transparent = true; m.opacity = 0.16; m.depthWrite = false; } else { m.transparent = m.userData.t0 || false; m.opacity = m.userData.o0 ?? 1; m.depthWrite = !m.transparent; } m.needsUpdate = true; } };
  for (const m of shells) { m.userData.t0 = m.transparent; m.userData.o0 = m.opacity; }

  // Chọn bằng nhấp chuột
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let down = null;
  const pick = (e) => { const r = renderer.domElement.getBoundingClientRect(); ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(Object.values(eqRoot), true); for (const h of hits) { let o = h.object; while (o && !o.userData.eq) o = o.parent; if (o) return o.userData.eq; } return null; };
  const onDown = e => { down = { x: e.clientX, y: e.clientY }; };
  const onUp = e => { if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 5 && e.button === 0) { const id = pick(e); hooks.onSelect(id); } down = null; };
  const onMove = e => { if (e.buttons) return; renderer.domElement.style.cursor = pick(e) ? "pointer" : "grab"; };
  renderer.domElement.addEventListener("pointerdown", onDown); renderer.domElement.addEventListener("pointerup", onUp); renderer.domElement.addEventListener("pointermove", onMove);

  // ── Camera theo khu vực ──
  let tween = null;
  const focus = key => { const v = ZONE_VIEWS[key]; if (!v) return; tween = { t: 0, p0: camera.position.clone(), t0: controls.target.clone(), p1: V(...v.pos), t1: V(...v.tgt) }; hooks.onZone(v.name); };

  // ── Vòng lặp ──
  const clock = new THREE.Clock(); let raf = 0, tAcc = 0, running = true; const tmp = V(0, 0, 0);
  const frame = () => {
    if (!running) return; raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1); tAcc += dt; const sim = hooks.getSim();
    if (tween) { tween.t = Math.min(1, tween.t + dt / 1.3); const k = tween.t < 0.5 ? 2 * tween.t * tween.t : 1 - Math.pow(-2 * tween.t + 2, 2) / 2; camera.position.lerpVectors(tween.p0, tween.p1, k); controls.target.lerpVectors(tween.t0, tween.t1, k); if (tween.t >= 1) tween = null; }
    controls.update();
    for (const s of spinners) { const l = sim.eq[s.id]?.load ?? 1; if (s.axis === "x") s.m.rotation.x += dt * s.k * l; else if (s.axis === "y") s.m.rotation.y += dt * s.k * l; else s.m.rotation.z += dt * s.k * l; }
    for (const a of anims) a(dt, tAcc, sim);
    for (const id in lamps) { const st = sim.eq[id]; const c = !st ? 0x888888 : st.tripped ? 0xe53935 : st.on ? (st.load > 0.5 ? 0x35e08a : 0xf2c200) : 0x8c9399; lamps[id].color.set(c); }
    const w = windVector(flags.windFrom);
    smokeS01.update(dt, Math.max(sim.eq.LH01.load, sim.eq.LH02.load), w, flags.u10);
    smokeS02.update(dt, sim.eq.QH01.load * (sim.eq.SY01.load > 0.2 ? 1 : 0.35), w, flags.u10);
    smokeMat.uniforms.uScale.value = 1;
    sockArm.rotation.y = Math.atan2(-w.wz, w.wx) + 0; sockArm.rotation.y = -Math.atan2(w.wz, w.wx);
    if (flags.hints && flags.hintId && eqRoot[flags.hintId]) { const b = new THREE.Box3().setFromObject(eqRoot[flags.hintId]); b.getCenter(tmp); hintMesh.position.set(tmp.x, b.max.y + 4.2 + Math.sin(tAcc * 4) * 0.5, tmp.z); hintMesh.visible = true; hintMesh.rotation.y += dt * 2; } else hintMesh.visible = false;
    if (selectedId && selBox.visible) selBox.setFromObject(eqRoot[selectedId]);
    renderer.render(scene, camera);
    // Nhãn
    const rw = W(), rh = H();
    for (const L of labels) {
      const show = L.ctx ? flags.labels : (flags.labels || (!!L.id && L.id === selectedId));
      if (!show) { L.el.style.display = "none"; continue; }
      tmp.copy(L.pos).project(camera);
      if (tmp.z > 1 || tmp.z < -1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1) { L.el.style.display = "none"; continue; }
      const d = camera.position.distanceTo(L.pos); if (d > (L.ctx ? 400 : 175)) { L.el.style.display = "none"; continue; }
      L.el.style.display = "block"; L.el.style.transform = `translate(${((tmp.x + 1) / 2) * rw}px, ${((1 - tmp.y) / 2) * rh}px) translate(-50%, -100%)`;
      L.el.style.opacity = String(Math.max(0.35, Math.min(1, 1.6 - d / 260)));
      const txt = L.valve ? (sim.pv.discharge ? "Van xả ra sông: MỞ" : "Van xả ra sông: ĐÓNG") : (L.id ? labelText(L, sim) : L.text);
      if (txt !== L.last) { L.el.textContent = txt; L.last = txt; }
      L.el.classList.toggle("s3l-sel", !!L.id && L.id === selectedId); L.el.classList.toggle("s3l-trip", !!(L.id && sim.eq[L.id]?.tripped));
    }
  };
  const labelText = (L, sim) => {
    const e = sim.eq[L.id], pv = sim.pv; let extra = "";
    if (L.id === "LB01") extra = ` · ΔP ${pv.dp.toFixed(0)} mmH₂O`;
    else if (L.id === "SY01") extra = ` · ${pv.dryerOut.toFixed(0)} °C`;
    else if (L.id === "LD01") extra = ` · ${pv.dryerIn.toFixed(0)} °C`;
    else if (L.id === "HT01") extra = ` · NH₃ ${pv.nh3.toFixed(0)} mg/Nm³`;
    else if (L.id === "QH01") extra = e.on ? " · chạy" : "";
    else if (L.id === "LH01" || L.id === "LH02") extra = e.on ? ` · ${pv.steam.toFixed(1)} bar` : "";
    else if (L.id === "TK01") extra = ` · DO ${pv.DO.toFixed(1)}`;
    else if (L.id === "DB01") extra = e.on ? ` · ${pv.tph.toFixed(0)} t/h` : "";
    return L.text + extra;
  };
  const resize = () => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(container);
  setFlags({}); frame();

  return {
    focus, select, setFlags, setPlume, resize, flagsRef: () => flags,
    zoomBy: f => { const d = camera.position.clone().sub(controls.target); d.multiplyScalar(f); camera.position.copy(controls.target).add(d); },
    dispose() { running = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.domElement.removeEventListener("pointerdown", onDown); renderer.domElement.removeEventListener("pointerup", onUp); renderer.domElement.removeEventListener("pointermove", onMove);
      controls.dispose(); scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); renderer.dispose(); renderer.domElement.remove(); labelLayer.remove(); },
    screenshot: () => renderer.domElement.toDataURL("image/png"),
    canvas: renderer.domElement,
  };
}
