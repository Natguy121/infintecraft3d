// ============================================================================
//  ELEMENTAL LAB — 13 · Procedural item visuals (no model files)
//  Every item is assembled from primitives by a shape template, then all parts
//  are merged into ONE vertex-coloured mesh (+ an unlit glow mesh and a few
//  animated parts) so each item costs ~2 draw calls.
// ============================================================================

const ITEM_SCALE = 0.85;
const _geo = new Map();
function geoCached(key, fn) { let g = _geo.get(key); if (!g) { g = fn(); if (!g.attributes.normal) g.computeVertexNormals(); g.computeBoundingBox(); _geo.set(key, g); } return g; }
const PG = {
  sphere: (w = 18, h = 12) => geoCached(`s${w}_${h}`, () => new THREE.SphereGeometry(1, w, h)),
  hemi: () => geoCached('hemi', () => new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2)),
  bowl: () => geoCached('bowl', () => new THREE.SphereGeometry(1, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)),
  box: () => geoCached('box', () => new THREE.BoxGeometry(1, 1, 1)),
  rbox: () => geoCached('rbox', () => roundedBoxGeo(0.22, 3)),
  cyl: (s = 16) => geoCached('cyl' + s, () => new THREE.CylinderGeometry(1, 1, 1, s)),
  tube: (s = 16) => geoCached('tube' + s, () => new THREE.CylinderGeometry(1, 1, 1, s, 1, true)),
  cone: (s = 16) => geoCached('cone' + s, () => new THREE.ConeGeometry(1, 1, s)),
  frustum: (top, s = 16) => geoCached(`fr${top}_${s}`, () => new THREE.CylinderGeometry(top, 1, 1, s)),
  torus: (tube = 0.25, arc = Math.PI * 2, rs = 24) => geoCached(`to${tube}_${arc.toFixed(3)}_${rs}`, () => new THREE.TorusGeometry(1, tube, 8, rs, arc)),
  ico: (d = 1) => geoCached('ico' + d, () => new THREE.IcosahedronGeometry(1, d)),
  oct: () => geoCached('oct', () => new THREE.OctahedronGeometry(1, 0)),
  capsule: () => geoCached('cap', () => new THREE.CapsuleGeometry(0.5, 1, 4, 12)),
  knot: () => geoCached('knot', () => new THREE.TorusKnotGeometry(0.65, 0.2, 64, 8, 2, 3)),
  star: (n = 5, inner = 0.45, depth = 0.34) => geoCached(`star${n}_${inner}_${depth}`, () => {
    const s = new THREE.Shape();
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? inner : 1;
      i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 2 });
    g.translate(0, 0, -depth / 2); return g;
  }),
  heart: () => geoCached('heart', () => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.9);
    s.bezierCurveTo(0.2, -0.65, 1, -0.3, 1, 0.25); s.bezierCurveTo(1, 0.75, 0.45, 0.95, 0, 0.5);
    s.bezierCurveTo(-0.45, 0.95, -1, 0.75, -1, 0.25); s.bezierCurveTo(-1, -0.3, -0.2, -0.65, 0, -0.9);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.14, bevelSegments: 4, curveSegments: 16 });
    g.translate(0, 0, -0.2); return g;
  }),
  lathe: (key, pts, seg = 20) => geoCached('la' + key, () => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg)),
};

function roundedBoxGeo(r, seg) {
  const g = new THREE.BoxGeometry(1, 1, 1, seg * 2, seg * 2, seg * 2);
  const p = g.attributes.position, v = new THREE.Vector3(), inner = 0.5 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const cx = clamp(v.x, -inner, inner), cy = clamp(v.y, -inner, inner), cz = clamp(v.z, -inner, inner);
    const d = _v3.set(v.x - cx, v.y - cy, v.z - cz);
    if (d.lengthSq() > 1e-9) d.normalize().multiplyScalar(r);
    p.setXYZ(i, cx + d.x, cy + d.y, cz + d.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Icosphere with deterministic per-position displacement (crack-free on non-indexed meshes). */
function displacedIco(detail, seed, amp, freq = 1, flat = false) {
  // faceted shapes use a non-indexed icosphere (+ flat shading); smooth shapes use an
  // indexed UV sphere so computeVertexNormals() yields smooth normals
  const seg = detail >= 3 ? 30 : detail === 2 ? 22 : 14;
  const g = flat ? new THREE.IcosahedronGeometry(1, detail) : new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7));
  const p = g.attributes.position, v = new THREE.Vector3();
  const s1 = (seed % 1000) * 0.013;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let d;
    if (flat) {
      const key = `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
      d = 1 + (hash01(key, seed) - 0.5) * 2 * amp;
    } else {
      d = 1 + amp * (Math.sin(v.x * 3.1 * freq + s1) * Math.cos(v.y * 2.7 * freq + s1 * 2) + 0.6 * Math.sin(v.z * 4.3 * freq + v.x * 1.7 + s1 * 3)) * 0.6
            + amp * 0.35 * Math.sin(v.x * 7.9 * freq + v.z * 3.1 + s1 * 5) * Math.cos(v.y * 8.7 * freq - s1)
            + amp * 0.15 * Math.sin(v.y * 17.3 * freq + v.x * 5.1 + s1 * 7);
    }
    p.setXYZ(i, v.x * d, v.y * d, v.z * d);
  }
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

// ---------------------------------------------------------------- part list
const _eu = new THREE.Euler(), _qq = new THREE.Quaternion(), _pp = new THREE.Vector3(), _ss = new THREE.Vector3();
class Parts {
  constructor(info, rng) { this.list = []; this.info = info; this.rng = rng; }
  add(geo, color, pos = [0, 0, 0], scl = 1, rot = null, opts = {}) {
    const m = new THREE.Matrix4();
    if (rot && rot.isQuaternion) _qq.copy(rot); else if (rot) _qq.setFromEuler(_eu.set(rot[0], rot[1], rot[2])); else _qq.identity();
    _pp.set(pos[0], pos[1], pos[2]);
    if (Array.isArray(scl)) _ss.set(scl[0], scl[1], scl[2]); else _ss.set(scl, scl, scl);
    m.compose(_pp, _qq, _ss);
    this.list.push({ geo, color, matrix: m, glow: !!opts.glow, anim: opts.anim || null, pivot: opts.pivot || null, colorFn: opts.colorFn || null });
    return this;
  }
  s(r, pos, color, scl = null, opts = {}) { return this.add(PG.sphere(opts.seg || 18, opts.seg ? Math.ceil(opts.seg * 0.66) : 12), color, pos, scl ? [r * scl[0], r * scl[1], r * scl[2]] : r, opts.rot, opts); }
  b(w, h, d, pos, color, rot = null, opts = {}) { return this.add(opts.round ? PG.rbox() : PG.box(), color, pos, [w, h, d], rot, opts); }
  c(r, h, pos, color, rot = null, opts = {}) { return this.add(PG.cyl(opts.seg || 16), color, pos, [r, h, r], rot, opts); }
  k(r, h, pos, color, rot = null, opts = {}) { return this.add(PG.cone(opts.seg || 16), color, pos, [r, h, r], rot, opts); }
  f(rt, rb, h, pos, color, rot = null, opts = {}) { const ratio = Math.round((rt / rb) * 20) / 20; return this.add(PG.frustum(ratio, opts.seg || 16), color, pos, [rb, h, rb], rot, opts); }
  t(R, tube, pos, color, rot = null, opts = {}) { const tr = Math.round((tube / R) * 40) / 40; return this.add(PG.torus(tr, opts.arc || Math.PI * 2, opts.rs || 24), color, pos, R, rot, opts); }
  /** cylinder between two points */
  seg(a, b, r, color, opts = {}) {
    const A = _v1.set(a[0], a[1], a[2]), B = _v2.set(b[0], b[1], b[2]);
    const len = A.distanceTo(B);
    const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    const dir = B.sub(A).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(_v3.set(0, 1, 0), dir);
    const geo = opts.cone ? PG.cone(opts.seg || 10) : PG.cyl(opts.seg || 10);
    return this.add(geo, color, mid, [r, len, opts.r2 ? opts.r2 : r], q, opts);
  }
  eyes(x, y, z, r, color = 0xffffff, pupil = 0x15151c, opts = {}) {
    for (const sx of [-1, 1]) {
      this.s(r, [sx * x, y, z], color);
      this.s(r * 0.58, [sx * x * 1.04, y + r * 0.05, z + r * 0.62], pupil, null, opts.glowPupil ? { glow: true } : {});
      this.s(r * 0.18, [sx * x * 1.04 + r * 0.15, y + r * 0.3, z + r * 0.95], 0xffffff);
    }
    return this;
  }
  bbox() {
    const box = new THREE.Box3(), tmp = new THREE.Box3();
    for (const p of this.list) { if (!p.geo.boundingBox) p.geo.computeBoundingBox(); tmp.copy(p.geo.boundingBox).applyMatrix4(p.matrix); box.union(tmp); }
    return box;
  }
}

function mergeParts(list, offset) {
  if (!list.length) return null;
  let nv = 0, ni = 0;
  for (const p of list) { const n = p.geo.attributes.position.count; nv += n; ni += p.geo.index ? p.geo.index.count : n; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
  const idx = nv > 65000 ? new Uint32Array(ni) : new Uint16Array(ni);
  const nm = new THREE.Matrix3(), v = new THREE.Vector3(), c = new THREE.Color(), c2 = new THREE.Color();
  let vo = 0, io = 0;
  for (const p of list) {
    const g = p.geo, P = g.attributes.position, N = g.attributes.normal;
    nm.getNormalMatrix(p.matrix);
    c.setHex(p.color);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i);
      if (p.colorFn) { c2.setHex(p.colorFn(v.x, v.y, v.z)); col[(vo + i) * 3] = c2.r; col[(vo + i) * 3 + 1] = c2.g; col[(vo + i) * 3 + 2] = c2.b; }
      else { col[(vo + i) * 3] = c.r; col[(vo + i) * 3 + 1] = c.g; col[(vo + i) * 3 + 2] = c.b; }
      v.applyMatrix4(p.matrix);
      if (offset) v.sub(offset);
      pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
      v.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
    }
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[io++] = a[i] + vo; }
    else for (let i = 0; i < P.count; i++) idx[io++] = i + vo;
    vo += P.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeBoundingSphere();
  return out;
}

// ---------------------------------------------------------------- colours & keywords
const COL = { wood: 0x9b6b3d, darkwood: 0x6b4423, metal: 0xc3c9d0, steel: 0x8a929c, gold: 0xffc933, dark: 0x22222a, white: 0xf6f6f4,
  skin: 0xf2c6a0, green: 0x4cb84f, leaf: 0x3fa64a, red: 0xe8343a, orange: 0xff8a1f, yellow: 0xffd23a, blue: 0x3a7ad8, pink: 0xff8ac0,
  glass: 0xcfefff, black: 0x15151c, grey: 0x8d8d94, brown: 0x7a4f2a, cream: 0xf6e7c8, sand: 0xe6c98a, soil: 0x6b4a2b };
const dk = (c, a = 0.18) => shiftColor(c, 0, 0, -a);
const lt = (c, a = 0.15) => shiftColor(c, 0, 0.0, a);
function kwOf(info) { const b = (info.base) || (info.headItem) || info; return ' ' + (b.name + (b.like ? ' ' + b.like : '')).toLowerCase() + ' '; }
function hasKw(kw, ...words) { for (const w of words) if (kw.includes(w)) return true; return false; }

// ---------------------------------------------------------------- shape templates
const BUILD = {};

BUILD.orb = (P, I, kw) => {
  P.s(1, [0, 0, 0], I.color, null, { seg: 24 });
  if (hasKw(kw, ' air ', 'wind', 'atmosphere')) {
    P.t(0.8, 0.06, [0, 0, 0], 0xa8d8ff, [0.5, 0.2, 0.3], { glow: true });
    P.t(0.62, 0.05, [0, 0, 0], 0xe8f6ff, [-0.6, 0.8, 0], { glow: true });
    P.t(0.42, 0.05, [0, 0, 0], 0x8ac8ff, [1.2, -0.4, 0.6], { glow: true });
    P.s(0.3, [0, 0, 0], 0xf0faff, null, { glow: true });
  } else if (hasKw(kw, 'disco')) {
    for (let i = 0; i < 40; i++) { const u = P.rng() * 2 - 1, a = P.rng() * 6.28, r = Math.sqrt(1 - u * u); P.b(0.22, 0.22, 0.05, [r * Math.cos(a), u, r * Math.sin(a)], i % 3 ? 0xe8eef8 : 0xb8c4d8, [0, -a, Math.asin(u)]); }
  } else if (hasKw(kw, 'eye')) { P.s(0.5, [0, 0, 0.62], 0x4a8ad8); P.s(0.28, [0, 0, 0.82], COL.black); }
  else if (hasKw(kw, 'balloon')) { P.k(0.14, 0.2, [0, -1.02, 0], I.color, [Math.PI, 0, 0]); P.c(0.012, 0.9, [0, -1.55, 0], 0xf0f0f0); }
  else if (hasKw(kw, 'bubble', 'snow globe', 'crystal ball', 'plasma ball')) {
    if (hasKw(kw, 'snow globe')) { P.s(0.35, [0, -0.25, 0], COL.white); P.f(0.9, 1, 0.35, [0, -0.95, 0], COL.darkwood); }
    if (hasKw(kw, 'crystal ball', 'plasma ball')) { P.s(0.35, [0, 0, 0], lt(I.color, 0.2), null, { glow: true }); P.f(0.7, 0.9, 0.3, [0, -1.0, 0], COL.dark); }
  } else if (hasKw(kw, 'pearl', 'ball', 'soccer', 'tennis', 'golf', 'basketball', 'football', 'baseball')) {
    if (hasKw(kw, 'basketball', 'tennis', 'baseball')) P.t(1.0, 0.025, [0, 0, 0], hasKw(kw, 'baseball') ? COL.red : COL.dark, [Math.PI / 2, 0, 0]);
    if (hasKw(kw, 'football')) { P.list.pop(); P.s(1, [0, 0, 0], I.color, [0.68, 0.68, 1.08]); P.b(0.06, 0.04, 0.7, [0, 0.67, 0], COL.white); }
  } else if (hasKw(kw, 'cell', 'point')) P.s(0.35, [0.15, 0.1, 0], dk(I.color, 0.3));
  else P.s(0.22, [-0.35, 0.42, 0.62], lt(I.color, 0.3));
};

BUILD.flame = (P, I) => {
  const warm = I.color;
  const outer = shiftColor(warm, -0.02, 0.1, -0.04), mid = shiftColor(warm, 0.03, 0.05, 0.06), inner = 0xfff0a0;
  P.s(0.58, [0, -0.38, 0], dk(warm, 0.12), [1, 0.8, 1]);
  P.s(0.62, [0, -0.28, 0], outer, [1, 0.9, 1], { glow: true });
  P.k(0.5, 1.5, [0, 0.5, 0], outer, null, { glow: true, seg: 12 });
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + P.rng() * 0.4, h = 0.75 + P.rng() * 0.6, r = 0.2 + P.rng() * 0.1;
    P.k(r, h, [Math.cos(a) * 0.36, -0.05 + h * 0.35, Math.sin(a) * 0.36], i % 2 ? mid : outer, [Math.sin(a) * 0.32, 0, -Math.cos(a) * 0.32], { glow: true, seg: 10 });
  }
  P.k(0.3, 1.0, [0, 0.2, 0.02], mid, null, { glow: true, seg: 10 });
  P.s(0.34, [0, -0.25, 0.04], inner, [1, 1.3, 1], { glow: true });
};

BUILD.rock = (P, I, kw) => {
  const seed = hashStr(I.id);
  const smooth = hasKw(kw, 'potato', 'pebble', 'egg', 'moon rock');
  const g = displacedIco(2, seed, smooth ? 0.12 : 0.26, smooth ? 1 : 1.25, false);
  const base = I.color;
  const cf = (x, y, z) => shiftColor(base, 0, 0, (hash01(`${(x * 7) | 0}${(y * 7) | 0}${(z * 7) | 0}`, seed) - 0.5) * 0.14);
  if (hasKw(kw, 'gravel', 'catapult ball')) {
    for (let i = 0; i < 6; i++) P.add(displacedIco(0, seed + i, 0.25, 1, true), shiftColor(base, 0, 0, (P.rng() - 0.5) * 0.15), [(P.rng() - 0.5) * 1.1, (P.rng() - 0.5) * 0.6, (P.rng() - 0.5) * 1.1], 0.45);
    return;
  }
  P.add(g, base, [0, 0, 0], smooth ? [1, 0.75, 0.85] : [1, 0.8, 0.92], null, { colorFn: cf });
  if (hasKw(kw, 'ore', 'uranium', 'lodestone', 'meteor', 'sulfur', 'flint', 'thunder')) {
    const ac = hasKw(kw, 'uranium') ? 0x7aff5a : hasKw(kw, 'meteor') ? 0xff6a2a : hasKw(kw, 'ore') ? COL.gold : lt(base, 0.3);
    for (let i = 0; i < 7; i++) { const u = P.rng() * 2 - 1, a = P.rng() * 6.28, r = Math.sqrt(1 - u * u); P.add(PG.oct(), ac, [r * Math.cos(a) * 0.85, u * 0.7, r * Math.sin(a) * 0.8], 0.16, [a, u, 0], { glow: hasKw(kw, 'uranium', 'meteor', 'thunder') }); }
  }
  if (hasKw(kw, 'carbon')) P.s(0.3, [0, 0, 0.7], 0x333333);
};

BUILD.blob = (P, I, kw) => {
  const seed = hashStr(I.id);
  if (hasKw(kw, 'poop', 'fertilizer')) {
    P.t(0.7, 0.32, [0, -0.45, 0], I.color, [Math.PI / 2, 0, 0]); P.t(0.5, 0.3, [0, 0.0, 0], I.color, [Math.PI / 2, 0, 0]); P.t(0.3, 0.26, [0, 0.38, 0], I.color, [Math.PI / 2, 0, 0]); P.k(0.22, 0.35, [0, 0.7, 0], I.color);
    P.eyes(0.22, 0.05, 0.55, 0.13); return;
  }
  if (hasKw(kw, 'octopus', 'squid', 'kraken')) {
    P.s(0.72, [0, 0.35, 0], I.color, [1, 1.15, 1]);
    P.eyes(0.3, 0.25, 0.6, 0.15);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      let x = Math.cos(a) * 0.45, z = Math.sin(a) * 0.45, y = -0.2;
      for (let j = 0; j < 4; j++) {
        const nx = x + Math.cos(a) * 0.22, nz = z + Math.sin(a) * 0.22, ny = y - 0.18 + j * 0.03;
        P.seg([x, y, z], [nx, ny, nz], 0.12 - j * 0.025, j % 2 ? lt(I.color, 0.05) : I.color, { cone: false });
        x = nx; z = nz; y = ny;
      }
    }
    return;
  }
  if (hasKw(kw, 'jellyfish')) { P.add(PG.hemi(), I.color, [0, 0, 0], [0.9, 0.7, 0.9]); for (let i = 0; i < 7; i++) { const a = i * 0.9; P.c(0.04, 1.1, [Math.cos(a) * 0.5, -0.55, Math.sin(a) * 0.5], lt(I.color, 0.1)); } return; }
  const amp = hasKw(kw, 'brain') ? 0.08 : hasKw(kw, 'mud', 'quicksand', 'clay') ? 0.12 : 0.18;
  const g = displacedIco(3, seed, amp, hasKw(kw, 'brain') ? 3 : 1);
  P.add(g, I.color, [0, 0, 0], hasKw(kw, 'mud', 'quicksand', 'sand', 'clay', 'butter', 'dough') ? [1, 0.62, 1] : hasKw(kw, 'arm', 'leg', 'foot', 'back', 'neck', 'wrist') ? [0.5, 1, 0.5] : [1, 0.85, 1]);
  if (hasKw(kw, 'slime', 'primordial', 'acid', 'gum')) for (let i = 0; i < 5; i++) P.s(0.14, [(P.rng() - 0.5) * 1.1, 0.4 + P.rng() * 0.3, (P.rng() - 0.5) * 1.1], lt(I.color, 0.25));
  if (hasKw(kw, 'cell', 'bacteria', 'yeast')) P.s(0.32, [0.1, 0.05, 0.2], dk(I.color, 0.25));
  if (hasKw(kw, 'slime', 'jelly')) P.eyes(0.25, 0.25, 0.75, 0.13);
};

BUILD.liquid = (P, I, kw) => {
  const seed = hashStr(I.id);
  P.add(displacedIco(3, seed, 0.1), I.color, [0, -0.05, 0], [1, 0.82, 1]);
  P.s(0.2, [-0.35, 0.42, 0.55], lt(I.color, 0.35));
  if (hasKw(kw, 'lava', 'magma', 'molten')) for (let i = 0; i < 6; i++) { const a = P.rng() * 6.28, u = P.rng() * 0.8; P.s(0.2, [Math.cos(a) * 0.75, u * 0.5, Math.sin(a) * 0.75], 0x3a1a10, [1, 0.4, 1]); }
  if (hasKw(kw, 'ocean', ' sea ', 'wave', 'tsunami', 'salt')) for (let i = 0; i < 5; i++) { const a = P.rng() * 6.28; P.s(0.16, [Math.cos(a) * 0.7, 0.5, Math.sin(a) * 0.7], 0xffffff, [1.4, 0.5, 1]); }
  if (hasKw(kw, 'primordial', 'acid', 'soup')) for (let i = 0; i < 5; i++) P.s(0.12, [(P.rng() - 0.5), 0.6, (P.rng() - 0.5)], lt(I.color, 0.3));
  if (hasKw(kw, 'water elemental')) P.eyes(0.26, 0.2, 0.7, 0.14);
};

BUILD.gas = (P, I, kw) => {
  const n = hasKw(kw, 'dust', 'ash', 'soot', 'glitter', 'stardust', 'sawdust', 'gunpowder') ? 9 : 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + P.rng(), r = i === 0 ? 0 : 0.45 + P.rng() * 0.2;
    P.s(i === 0 ? 0.62 : 0.32 + P.rng() * 0.22, [Math.cos(a) * r, (P.rng() - 0.5) * 0.5, Math.sin(a) * r], shiftColor(I.color, 0, 0, (P.rng() - 0.5) * 0.1));
  }
  if (hasKw(kw, 'nebula', 'stardust', 'glitter', 'neon', 'helium', 'aurora', 'northern')) for (let i = 0; i < 8; i++) P.s(0.06, [(P.rng() - 0.5) * 1.4, (P.rng() - 0.5) * 1, (P.rng() - 0.5) * 1.4], 0xffffff, null, { glow: true });
  if (hasKw(kw, 'air elemental')) P.eyes(0.22, 0.15, 0.6, 0.12);
};

BUILD.cloud = (P, I, kw) => {
  const dark = hasKw(kw, 'storm', 'thunder', 'nightmare');
  const col = dark ? 0x6a7384 : I.color;
  const pts = [[0, 0, 0, 0.6], [0.55, -0.1, 0.05, 0.45], [-0.55, -0.1, -0.05, 0.47], [0.25, 0.25, -0.2, 0.42], [-0.25, 0.22, 0.2, 0.4], [0, -0.15, 0.35, 0.38], [0, -0.12, -0.38, 0.38]];
  for (const [x, y, z, r] of pts) P.s(r, [x, y, z], shiftColor(col, 0, 0, (P.rng() - 0.5) * 0.06), [1.15, 0.85, 1.05]);
  if (hasKw(kw, 'rain', 'drizzle', 'storm', 'weather')) for (let i = 0; i < 6; i++) P.s(0.06, [(P.rng() - 0.5) * 1, -0.65 - P.rng() * 0.35, (P.rng() - 0.5) * 0.8], 0x6ab0ff, [1, 2, 1]);
  if (hasKw(kw, 'snow', 'blizzard', 'winter', 'hail')) for (let i = 0; i < 7; i++) P.s(0.07, [(P.rng() - 0.5) * 1.1, -0.6 - P.rng() * 0.4, (P.rng() - 0.5) * 0.9], 0xffffff);
  if (hasKw(kw, 'thunder', 'storm')) BUILD.boltParts(P, [0.1, -0.55, 0.1], 0.55, 0xfff36b);
  if (hasKw(kw, 'heaven')) { for (let i = 0; i < 6; i++) { const a = i * 1.05; P.c(0.03, 0.8, [Math.cos(a) * 0.4, 0.75, Math.sin(a) * 0.4], 0xfff2a0, [Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5], { glow: true }); } }
  if (hasKw(kw, 'thought', 'dream', 'idea')) { P.s(0.16, [0.75, -0.6, 0.2], col); P.s(0.1, [0.95, -0.85, 0.3], col); }
  if (hasKw(kw, 'cotton') && !hasKw(kw, 'candy')) P.c(0.04, 0.6, [0, -0.7, 0], COL.leaf);
};

BUILD.boltParts = (P, origin, size, color) => {
  const pts = [[0, 0.5], [-0.22, 0.05], [0.12, 0.02], [-0.12, -0.5]];
  for (let i = 0; i < pts.length - 1; i++) P.seg([origin[0] + pts[i][0] * size, origin[1] + pts[i][1] * size, origin[2]], [origin[0] + pts[i + 1][0] * size, origin[1] + pts[i + 1][1] * size, origin[2]], 0.07 * size / 0.55, color, { glow: true, seg: 6 });
};
BUILD.bolt = (P, I, kw) => {
  P.s(0.25, [0, 0, 0], lt(I.color, 0.2), null, { glow: true });
  if (hasKw(kw, 'laser', 'sunbeam', 'gamma')) { P.c(0.12, 2, [0, 0, 0], I.color, [0, 0, Math.PI / 2], { glow: true }); P.c(0.2, 0.3, [-1.05, 0, 0], COL.dark, [0, 0, Math.PI / 2]); return; }
  BUILD.boltParts(P, [0, 0, 0], 1.7, I.color);
};

BUILD.cube = (P, I, kw) => {
  const c = I.color;
  if (hasKw(kw, 'brick')) { P.b(1.5, 0.62, 0.75, [0, 0, 0], c, null, { round: true }); return; }
  if (hasKw(kw, 'gold bar', 'metal', 'iron', 'steel', 'copper', 'bronze', ' tin ', 'silver', 'gold', 'platinum', 'lead', 'aluminum', 'titanium', 'alloy')) {
    P.add(PG.frustum(0.7, 4), c, [0, 0, 0], [1.05, 0.5, 0.62], [0, Math.PI / 4, 0]); return;
  }
  if (hasKw(kw, 'dice')) { P.b(1.2, 1.2, 1.2, [0, 0, 0], COL.white, null, { round: true }); for (const [x, y, z] of [[0, 0.61, 0], [0.61, 0.3, 0.3], [0.61, -0.3, -0.3], [-0.3, -0.3, 0.61], [0.3, 0.3, 0.61]]) P.s(0.1, [x, y, z], COL.dark, [1, 0.5, 1]); return; }
  if (hasKw(kw, 'gift', 'present')) { P.b(1.2, 1, 1.2, [0, -0.1, 0], c, null, { round: true }); P.b(1.24, 1.02, 0.2, [0, -0.1, 0], COL.yellow); P.b(0.2, 1.02, 1.24, [0, -0.1, 0], COL.yellow); P.t(0.22, 0.07, [-0.18, 0.5, 0], COL.yellow, [0, 0, 0.6]); P.t(0.22, 0.07, [0.18, 0.5, 0], COL.yellow, [0, 0, -0.6]); return; }
  if (hasKw(kw, 'chest', 'treasure', 'coin purse', 'cargo')) { P.b(1.3, 0.8, 0.85, [0, -0.15, 0], hasKw(kw, 'treasure') ? COL.darkwood : c, null, { round: true }); P.c(0.43, 1.3, [0, 0.25, 0], hasKw(kw, 'treasure') ? COL.darkwood : dk(c, 0.05), [0, 0, Math.PI / 2], { seg: 12 }); P.b(0.18, 0.25, 0.1, [0, 0.12, 0.45], COL.gold); if (hasKw(kw, 'treasure')) for (let i = 0; i < 6; i++) P.add(PG.cyl(12), COL.gold, [(P.rng() - 0.5) * 0.8, 0.62, (P.rng() - 0.5) * 0.5], [0.14, 0.04, 0.14], [P.rng(), 0, P.rng()]); return; }
  if (hasKw(kw, 'tnt')) { for (const x of [-0.32, 0, 0.32]) P.c(0.17, 1, [x, 0, 0], COL.red); P.b(1.0, 0.2, 0.38, [0, 0, 0], COL.cream); P.c(0.02, 0.4, [0, 0.65, 0], COL.dark); return; }
  if (hasKw(kw, 'table') && !hasKw(kw, 'vegetable')) { P.b(1.6, 0.12, 1.0, [0, 0.4, 0], c, null, { round: true }); for (const [x, z] of [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]]) P.b(0.12, 0.9, 0.12, [x, -0.1, z], dk(c)); return; }
  if (hasKw(kw, 'chair', 'throne', 'bench')) { const w = hasKw(kw, 'bench') ? 1.6 : 0.9; P.b(w, 0.12, 0.85, [0, -0.05, 0], c, null, { round: true }); P.b(w, hasKw(kw, 'throne') ? 1.4 : 0.85, 0.12, [0, hasKw(kw, 'throne') ? 0.65 : 0.4, -0.38], c, null, { round: true }); for (const [x, z] of [[-w / 2 + 0.07, -0.35], [w / 2 - 0.07, -0.35], [-w / 2 + 0.07, 0.35], [w / 2 - 0.07, 0.35]]) P.b(0.1, 0.65, 0.1, [x, -0.42, z], dk(c)); if (hasKw(kw, 'throne')) { P.b(w + 0.1, 0.1, 0.1, [0, 1.35, -0.38], COL.gold); P.b(0.7, 0.08, 0.6, [0, 0.03, 0.05], 0xb02a4a); } return; }
  if (hasKw(kw, ' bed ', 'cradle')) { P.b(1.5, 0.35, 0.9, [0, -0.3, 0], COL.wood, null, { round: true }); P.b(1.4, 0.2, 0.85, [0, -0.05, 0], COL.white, null, { round: true }); P.b(0.4, 0.18, 0.65, [-0.5, 0.1, 0], c, null, { round: true }); P.b(0.12, 0.8, 0.95, [-0.75, 0, 0], COL.wood); return; }
  if (hasKw(kw, 'sofa', 'furniture')) { P.b(1.6, 0.4, 0.8, [0, -0.25, 0], c, null, { round: true }); P.b(1.6, 0.6, 0.25, [0, 0.15, -0.3], c, null, { round: true }); P.b(0.25, 0.55, 0.8, [-0.75, -0.05, 0], dk(c, 0.05), null, { round: true }); P.b(0.25, 0.55, 0.8, [0.75, -0.05, 0], dk(c, 0.05), null, { round: true }); return; }
  if (hasKw(kw, 'door')) { P.b(0.9, 1.7, 0.14, [0, 0, 0], c, null, { round: true }); P.s(0.07, [0.3, 0, 0.1], COL.gold); return; }
  if (hasKw(kw, 'window', 'frame')) { P.b(1.2, 1.2, 0.12, [0, 0, 0], COL.white, null, { round: true }); P.b(1.0, 1.0, 0.08, [0, 0, 0.02], hasKw(kw, 'frame') ? 0x8ad0ff : COL.glass, null, { glow: !hasKw(kw, 'frame') }); P.b(0.06, 1.0, 0.14, [0, 0, 0], COL.white); P.b(1.0, 0.06, 0.14, [0, 0, 0], COL.white); return; }
  if (hasKw(kw, 'wall', 'great wall', 'hedge', 'concrete', 'marble', 'floor', 'board')) {
    if (hasKw(kw, 'wall')) { for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) P.b(0.48, 0.26, 0.4, [(i - 1) * 0.5 + (r % 2) * 0.25 - 0.12, r * 0.28 - 0.42, 0], shiftColor(c, 0, 0, (P.rng() - 0.5) * 0.08), null, { round: true }); return; }
    P.b(1.3, hasKw(kw, 'floor', 'board') ? 0.18 : 0.9, 1.3, [0, 0, 0], c, null, { round: true }); return;
  }
  if (hasKw(kw, 'battery')) { P.c(0.42, 1.2, [0, 0, 0], c); P.c(0.43, 0.35, [0, 0.42, 0], COL.dark); P.c(0.14, 0.12, [0, 0.66, 0], COL.metal); return; }
  if (hasKw(kw, 'circuit', 'microchip', 'data')) { P.b(1.4, 0.08, 1.0, [0, 0, 0], hasKw(kw, 'data') ? c : 0x2a8a5a); P.b(0.55, 0.12, 0.55, [0, 0.09, 0], COL.dark); for (let i = 0; i < 5; i++) { P.b(0.05, 0.03, 0.18, [-0.2 + i * 0.1, 0.06, 0.36], COL.gold); P.b(0.05, 0.03, 0.18, [-0.2 + i * 0.1, 0.06, -0.36], COL.gold); } P.s(0.05, [0.5, 0.08, 0.3], 0x5aff8a, null, { glow: true }); return; }
  if (hasKw(kw, 'waffle', 'chocolate')) { P.b(1.4, 0.22, 1.0, [0, 0, 0], c, null, { round: true }); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) P.b(0.28, 0.08, 0.26, [-0.52 + i * 0.35, 0.13, -0.32 + j * 0.32], lt(c, 0.05), null, { round: true }); return; }
  if (hasKw(kw, 'sponge')) { P.b(1.3, 0.7, 0.9, [0, 0, 0], c, null, { round: true }); for (let i = 0; i < 10; i++) P.s(0.07, [(P.rng() - 0.5) * 1.2, 0.36, (P.rng() - 0.5) * 0.8], dk(c, 0.2), [1, 0.4, 1]); return; }
  if (hasKw(kw, 'lock', 'cage')) {
    if (hasKw(kw, 'cage')) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; P.c(0.03, 1.4, [Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6], c); } P.c(0.65, 0.08, [0, 0.7, 0], c); P.c(0.65, 0.08, [0, -0.7, 0], c); return; }
    P.b(0.9, 0.8, 0.4, [0, -0.25, 0], c, null, { round: true }); P.t(0.32, 0.08, [0, 0.2, 0], COL.metal, null, { arc: Math.PI }); P.s(0.08, [0, -0.2, 0.21], COL.dark); return;
  }
  if (hasKw(kw, 'anvil')) { P.b(1.4, 0.32, 0.55, [0, 0.35, 0], c); P.k(0.25, 0.5, [0.9, 0.35, 0], c, [0, 0, -Math.PI / 2]); P.b(0.5, 0.5, 0.4, [0, -0.05, 0], c); P.b(1.0, 0.25, 0.6, [0, -0.42, 0], c); return; }
  if (hasKw(kw, 'grill')) { for (let i = -3; i <= 3; i++) P.c(0.025, 1.4, [0, 0.2, i * 0.18], COL.metal, [0, 0, Math.PI / 2]); P.b(1.5, 0.35, 1.3, [0, -0.05, 0], COL.dark, null, { round: true }); P.c(0.04, 0.8, [0.5, -0.6, 0.4], COL.dark); P.c(0.04, 0.8, [-0.5, -0.6, -0.4], COL.dark); return; }
  if (hasKw(kw, 'bag', 'backpack', 'piggy')) { P.b(1.0, 1.2, 0.6, [0, 0, 0], c, null, { round: true }); P.b(0.7, 0.45, 0.2, [0, -0.2, 0.33], dk(c, 0.08), null, { round: true }); P.t(0.3, 0.06, [0, 0.62, 0], dk(c, 0.15), null, { arc: Math.PI }); return; }
  if (hasKw(kw, 'puzzle')) { P.b(1.1, 0.25, 1.1, [0, 0, 0], c, null, { round: true }); P.c(0.22, 0.25, [0.62, 0, 0], c); P.c(0.22, 0.25, [0, 0, 0.62], c); return; }
  if (hasKw(kw, 'chess')) { P.add(PG.lathe('pawn', [[0, -1], [0.6, -1], [0.62, -0.85], [0.35, -0.7], [0.25, -0.1], [0.4, 0.05], [0.2, 0.15], [0.32, 0.45], [0.2, 0.75], [0, 0.8]]), c, [0, 0, 0], 1); P.add(PG.lathe('pawn', [[0, -1], [0.6, -1], [0.62, -0.85], [0.35, -0.7], [0.25, -0.1], [0.4, 0.05], [0.2, 0.15], [0.32, 0.45], [0.2, 0.75], [0, 0.8]]), COL.white, [0.9, -0.2, 0], 0.7); return; }
  if (hasKw(kw, 'trap')) { P.b(1.4, 0.1, 0.8, [0, -0.2, 0], COL.wood); P.t(0.35, 0.03, [0, -0.15, 0], COL.metal, [Math.PI / 2, 0, 0], { arc: Math.PI }); P.b(0.2, 0.1, 0.2, [0.3, -0.1, 0], COL.yellow); return; }
  if (hasKw(kw, 'smart home')) { BUILD.building(P, I, kw); return; }
  P.b(1.2, 1.2, 1.2, [0, 0, 0], c, null, { round: true });
  if (hasKw(kw, 'bento')) { P.b(1.22, 0.1, 1.22, [0, 0.55, 0], COL.red); P.s(0.2, [0.3, 0.62, 0.3], COL.white); }
};

BUILD.crystal = (P, I, kw) => {
  const c = I.color;
  if (hasKw(kw, ' ice ', 'ice cube')) { P.b(1.2, 1.1, 1.2, [0, 0, 0], c, null, { round: true }); P.b(0.5, 0.4, 0.5, [0.2, 0.25, 0.2], lt(c, 0.12), null, { round: true }); return; }
  if (hasKw(kw, 'diamond', 'ruby', 'emerald', 'sapphire', ' gem', 'philosopher', 'silicon', 'element crystal')) {
    P.add(PG.cone(8), c, [0, -0.35, 0], [0.95, 1.0, 0.95], [Math.PI, Math.PI / 8, 0]);
    P.add(PG.frustum(0.6, 8), lt(c, 0.06), [0, 0.32, 0], [0.95, 0.35, 0.95], [0, Math.PI / 8, 0]);
    if (hasKw(kw, 'philosopher', 'element')) P.s(0.3, [0, 0, 0], lt(c, 0.3), null, { glow: true });
    return;
  }
  if (hasKw(kw, 'iceberg')) { P.add(displacedIco(1, hashStr(I.id), 0.3, 1, true), c, [0, 0.1, 0], [1, 1.2, 0.9]); P.add(displacedIco(1, hashStr(I.id) + 3, 0.2, 1, true), dk(c, 0.1), [0.2, -0.5, 0.1], [1.2, 0.6, 1]); return; }
  if (hasKw(kw, 'obsidian')) { P.add(displacedIco(0, hashStr(I.id), 0.35, 1, true), c, [0, 0, 0], [0.8, 1.2, 0.6]); return; }
  const n = 3 + Math.floor(P.rng() * 3);
  P.add(displacedIco(0, hashStr(I.id), 0.2, 1, true), dk(c, 0.12), [0, -0.65, 0], [0.8, 0.3, 0.8]);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + P.rng(), tilt = i === 0 ? 0 : 0.35 + P.rng() * 0.35, h = i === 0 ? 1.2 : 0.6 + P.rng() * 0.5, r = i === 0 ? 0.3 : 0.16 + P.rng() * 0.1;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt));
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
    const base = [Math.cos(a) * (i ? 0.25 : 0), -0.55, Math.sin(a) * (i ? 0.25 : 0)];
    const mid = [base[0] + up.x * h / 2, base[1] + up.y * h / 2, base[2] + up.z * h / 2];
    const tip = [base[0] + up.x * (h + r * 1.2 / 2), base[1] + up.y * (h + r * 0.6), base[2] + up.z * (h + r * 0.6)];
    const col = shiftColor(c, (P.rng() - 0.5) * 0.04, 0, (P.rng() - 0.5) * 0.1);
    P.add(PG.cyl(6), col, mid, [r, h, r], q);
    P.add(PG.cone(6), lt(col, 0.08), tip, [r, r * 1.2, r], q);
  }
};

BUILD.spike = (P, I, kw) => {
  const c = I.color;
  if (hasKw(kw, 'nail', 'screw', ' pin', 'needle')) {
    P.c(0.07, 1.6, [0, 0, 0], c); P.k(0.07, 0.25, [0, -0.92, 0], c, [Math.PI, 0, 0]);
    if (hasKw(kw, 'pin')) P.s(0.2, [0, 0.85, 0], COL.red); else if (hasKw(kw, 'needle')) P.t(0.06, 0.02, [0, 0.75, 0], c); else P.c(0.22, 0.08, [0, 0.82, 0], c);
    if (hasKw(kw, 'screw')) for (let i = 0; i < 6; i++) P.t(0.08, 0.025, [0, -0.6 + i * 0.22, 0], c, [Math.PI / 2 + 0.2, 0, 0]);
    return;
  }
  if (hasKw(kw, 'icicle')) { for (let i = 0; i < 4; i++) P.k(0.18 - i * 0.02, 1.5 - i * 0.25, [(i - 1.5) * 0.28, 0.25 - i * 0.05, (P.rng() - 0.5) * 0.2], c, [Math.PI, 0, 0], { seg: 8 }); P.b(1.3, 0.15, 0.4, [0, 0.95, 0], COL.white, null, { round: true }); return; }
  if (hasKw(kw, 'horn', 'unicorn horn', 'thorn')) { for (let i = 0; i < 5; i++) { const t = i / 5; P.f(0.22 * (1 - t - 0.2) + 0.02, 0.22 * (1 - t) + 0.02, 0.4, [Math.sin(t * 2) * 0.25, -0.8 + i * 0.36, 0], i % 2 && hasKw(kw, 'unicorn') ? 0xffd8f8 : c, [0, 0, -t * 0.6]); } return; }
  if (hasKw(kw, 'virus')) { P.s(0.6, [0, 0, 0], c); for (let i = 0; i < 14; i++) { const u = P.rng() * 2 - 1, a = P.rng() * 6.28, r = Math.sqrt(1 - u * u); const d = [r * Math.cos(a), u, r * Math.sin(a)]; P.seg([d[0] * 0.55, d[1] * 0.55, d[2] * 0.55], [d[0] * 0.95, d[1] * 0.95, d[2] * 0.95], 0.04, lt(c, 0.1)); P.s(0.09, [d[0] * 0.98, d[1] * 0.98, d[2] * 0.98], lt(c, 0.25)); } return; }
  P.s(0.55, [0, 0, 0], c);
  const g = PG.ico(0);
  const pos = g.attributes.position, seen = new Set();
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(pos, i).normalize();
    const key = v.toArray().map(x => x.toFixed(2)).join();
    if (seen.has(key)) continue; seen.add(key);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    P.add(PG.cone(8), lt(c, 0.05), [v.x * 0.75, v.y * 0.75, v.z * 0.75], [0.16, 0.55, 0.16], q);
  }
};

BUILD.tree = (P, I, kw) => {
  const leaf = hasKw(kw, 'maple', 'autumn') ? 0xe0601a : hasKw(kw, 'dead') ? null : hasKw(kw, 'christmas', 'pine') ? 0x1f6b3a : hasKw(kw, 'life', 'world') ? 0x3ad87a : (I.color === COL.brown ? COL.leaf : I.color);
  const trunk = hasKw(kw, 'antler') ? 0xd8c8a8 : COL.wood;
  if (hasKw(kw, 'antler')) { for (const s of [-1, 1]) { P.seg([0, -0.8, 0], [s * 0.4, 0.2, 0], 0.07, trunk); P.seg([s * 0.4, 0.2, 0], [s * 0.7, 0.8, 0], 0.05, trunk); P.seg([s * 0.3, 0, 0], [s * 0.05, 0.6, 0.1], 0.045, trunk); P.seg([s * 0.55, 0.5, 0], [s * 0.95, 0.55, 0.1], 0.04, trunk); } return; }
  if (hasKw(kw, 'broccoli')) { P.c(0.2, 0.8, [0, -0.5, 0], 0x7ac05a); for (let i = 0; i < 9; i++) { const a = P.rng() * 6.28, r = P.rng() * 0.45; P.s(0.32, [Math.cos(a) * r, 0.15 + P.rng() * 0.3, Math.sin(a) * r], shiftColor(0x3a9a4a, 0, 0, (P.rng() - 0.5) * 0.1)); } return; }
  if (hasKw(kw, 'bonsai')) { P.f(0.55, 0.42, 0.35, [0, -0.85, 0], 0x5a6a8a); P.seg([0, -0.7, 0], [0.2, -0.2, 0], 0.1, trunk); P.seg([0.2, -0.2, 0], [-0.15, 0.2, 0], 0.08, trunk); for (const [x, y, z] of [[-0.25, 0.3, 0], [0.35, 0.05, 0.1], [0, 0.45, -0.1]]) P.s(0.3, [x, y, z], leaf, [1.3, 0.55, 1.1]); return; }
  if (hasKw(kw, 'beanstalk')) { for (let i = 0; i < 6; i++) { P.seg([Math.sin(i) * 0.2, -1 + i * 0.35, Math.cos(i) * 0.2], [Math.sin(i + 1) * 0.2, -1 + (i + 1) * 0.35, Math.cos(i + 1) * 0.2], 0.12 - i * 0.012, 0x4ac04a); P.s(0.2, [Math.sin(i + 0.5) * 0.45, -0.85 + i * 0.35, Math.cos(i + 0.5) * 0.45], 0x5ad85a, [1.4, 0.4, 0.9]); } P.s(0.25, [0, 1.15, 0], COL.white, [1.4, 0.6, 1.2]); return; }
  if (hasKw(kw, 'palm')) {
    for (let i = 0; i < 6; i++) P.c(0.11 - i * 0.008, 0.3, [i * 0.06, -0.85 + i * 0.28, 0], i % 2 ? COL.wood : dk(COL.wood, 0.06), [0, 0, -i * 0.05]);
    for (let i = 0; i < 6; i++) { const a = i * 1.05; P.s(0.5, [0.4 + Math.cos(a) * 0.4, 0.82, Math.sin(a) * 0.4], 0x3aa14a, [1, 0.12, 0.3], { rot: [0, -a, -0.35] }); }
    P.s(0.12, [0.4, 0.68, 0.1], COL.brown); P.s(0.12, [0.32, 0.66, -0.08], COL.brown); return;
  }
  P.f(0.09, 0.16, 1.05, [0, -0.47, 0], trunk, null, { seg: 12 });
  P.f(0.16, 0.27, 0.16, [0, -0.92, 0], dk(trunk, 0.04), null, { seg: 12 });
  for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4; P.seg([0, -0.88, 0], [Math.cos(a) * 0.36, -0.99, Math.sin(a) * 0.36], 0.05, dk(trunk, 0.06)); }
  if (!leaf) { for (let i = 0; i < 4; i++) { const a = i * 1.6 + P.rng(); P.seg([0, -0.1 + i * 0.08, 0], [Math.cos(a) * 0.55, 0.45 + P.rng() * 0.3, Math.sin(a) * 0.55], 0.05, trunk); } return; }
  if (hasKw(kw, 'pine', 'christmas')) {
    for (let i = 0; i < 3; i++) P.k(0.75 - i * 0.18, 0.75, [0, -0.15 + i * 0.42, 0], shiftColor(leaf, 0, 0, i * 0.03), null, { seg: 10 });
    if (hasKw(kw, 'christmas')) { P.add(PG.star(5, 0.45, 0.25), COL.yellow, [0, 1.12, 0], 0.22, null, { glow: true }); for (let i = 0; i < 8; i++) { const a = i * 2.4, h = P.rng(); P.s(0.07, [Math.cos(a) * (0.6 - h * 0.45), -0.15 + h * 0.9, Math.sin(a) * (0.6 - h * 0.45)], [COL.red, COL.yellow, COL.blue, 0xff5ad8][i % 4], null, { glow: true }); } }
    return;
  }
  const lc = () => shiftColor(leaf, 0, 0, (P.rng() - 0.5) * 0.12);
  P.s(0.46, [0, 0.62, 0], lc(), [1, 0.85, 1]);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26 + P.rng() * 0.5, y0 = -0.15 + i * 0.07, tip = [Math.cos(a) * 0.48, 0.3 + P.rng() * 0.22, Math.sin(a) * 0.48];
    P.seg([0, y0, 0], tip, 0.045, trunk);
    for (let j = 0; j < 3; j++) P.s(0.2 + P.rng() * 0.1, [tip[0] + (P.rng() - 0.5) * 0.25, tip[1] + 0.05 + P.rng() * 0.15, tip[2] + (P.rng() - 0.5) * 0.25], lc(), [1, 0.8, 1]);
  }
  if (hasKw(kw, 'life', 'world')) for (let i = 0; i < 6; i++) P.s(0.08, [(P.rng() - 0.5) * 1.2, 0.3 + P.rng() * 0.5, (P.rng() - 0.5) * 1.2], 0xfff27a, null, { glow: true });
  if (hasKw(kw, 'treant')) { P.eyes(0.08, -0.35, 0.15, 0.06, 0xfff2a0, 0x15151c, {}); }
  if (hasKw(kw, 'apple', 'fruit')) for (let i = 0; i < 4; i++) P.s(0.09, [(P.rng() - 0.5) * 0.9, 0.2 + P.rng() * 0.3, 0.45], COL.red);
};

BUILD.plant = (P, I, kw) => {
  const c = I.color, stem = 0x3f9a3a;
  if (hasKw(kw, 'cactus')) { P.add(PG.capsule(), c, [0, 0, 0], [0.55, 0.95, 0.55]); P.add(PG.capsule(), c, [0.38, 0.05, 0], [0.22, 0.4, 0.22]); P.add(PG.capsule(), c, [-0.36, 0.2, 0], [0.2, 0.36, 0.2]); P.s(0.12, [0, 0.82, 0], 0xff6ab0); P.f(0.5, 0.4, 0.3, [0, -0.85, 0], 0xc8703a); return; }
  if (hasKw(kw, 'coral')) { for (let i = 0; i < 6; i++) { const a = i * 1.1; P.seg([0, -0.8, 0], [Math.cos(a) * 0.4, 0.1 + P.rng() * 0.4, Math.sin(a) * 0.4], 0.1, c); P.seg([Math.cos(a) * 0.4, 0.1, Math.sin(a) * 0.4], [Math.cos(a) * 0.55, 0.7, Math.sin(a) * 0.55], 0.07, lt(c, 0.06)); } return; }
  if (hasKw(kw, 'grass', 'hay', 'reed', 'wheat', 'marsh', 'prairie')) {
    for (let i = 0; i < 9; i++) { const a = i * 0.7, r = P.rng() * 0.35; P.add(PG.cone(5), shiftColor(c, 0, 0, (P.rng() - 0.5) * 0.12), [Math.cos(a) * r, -0.2, Math.sin(a) * r], [0.07, 1.4, 0.07], [Math.sin(a) * 0.25, 0, Math.cos(a) * 0.25]); }
    if (hasKw(kw, 'wheat')) for (let i = 0; i < 5; i++) P.s(0.1, [(i - 2) * 0.12, 0.6 + (i % 2) * 0.1, 0], 0xe8c050, [0.8, 1.8, 0.8]);
    if (hasKw(kw, 'reed')) P.c(0.06, 0.3, [0, 0.55, 0], COL.brown);
    return;
  }
  if (hasKw(kw, 'bamboo')) { for (let s = 0; s < 3; s++) for (let i = 0; i < 4; i++) { P.c(0.08, 0.38, [(s - 1) * 0.25, -0.8 + i * 0.42, (s % 2) * 0.1], c); P.c(0.09, 0.04, [(s - 1) * 0.25, -0.6 + i * 0.42, (s % 2) * 0.1], dk(c)); } P.s(0.25, [0.3, 0.75, 0], COL.leaf, [1.4, 0.15, 0.4]); return; }
  if (hasKw(kw, 'seaweed', 'kelp', 'vine', 'ivy')) { for (let i = 0; i < 6; i++) P.s(0.22, [Math.sin(i * 1.2) * 0.25, -0.9 + i * 0.34, 0], shiftColor(c, 0, 0, (i % 2) * 0.05), [0.6, 1.1, 0.25], { rot: [0, i * 0.8, Math.sin(i) * 0.4] }); return; }
  if (hasKw(kw, 'clover')) { const n = hasKw(kw, 'four') ? 4 : 3; P.c(0.03, 0.9, [0, -0.45, 0], stem); for (let i = 0; i < n; i++) { const a = i / n * 6.28; P.add(PG.heart(), c, [Math.cos(a) * 0.3, 0.05, Math.sin(a) * 0.3], 0.3, [Math.PI / 2, 0, a + Math.PI / 2]); } return; }
  if (hasKw(kw, 'leaf', 'feather', 'wing', 'phoenix')) {
    const n = hasKw(kw, 'wing') ? 5 : 1;
    for (let i = 0; i < n; i++) P.s(0.9 - i * 0.1, [i * 0.18, -i * 0.08, 0], shiftColor(c, 0, 0, -i * 0.03), [0.42, 1, 0.08], { rot: [0, 0, -0.3 - i * 0.18] });
    P.c(0.03, 1.8, [0, -0.1, 0.06], dk(c, 0.15), [0, 0, -0.3]); return;
  }
  if (hasKw(kw, 'bush', 'hedge', 'herb', 'mint', 'lettuce', 'nature', 'garden')) { for (let i = 0; i < 7; i++) { const a = P.rng() * 6.28, r = P.rng() * 0.45; P.s(0.38, [Math.cos(a) * r, (P.rng() - 0.5) * 0.4, Math.sin(a) * r], shiftColor(c, 0, 0, (P.rng() - 0.5) * 0.1)); } if (hasKw(kw, 'garden')) for (let i = 0; i < 4; i++) P.s(0.1, [(P.rng() - 0.5), 0.35, (P.rng() - 0.5)], [COL.red, COL.yellow, 0xff8ad8, COL.white][i]); return; }
  if (hasKw(kw, 'sprout', 'growth', 'root', 'seedling')) { P.add(PG.hemi(), COL.soil, [0, -0.75, 0], [0.6, 0.3, 0.6]); P.c(0.04, 0.7, [0, -0.4, 0], stem); P.s(0.28, [-0.2, 0.0, 0], COL.leaf, [1, 0.35, 0.6], { rot: [0, 0, 0.5] }); P.s(0.28, [0.2, 0.0, 0], COL.leaf, [1, 0.35, 0.6], { rot: [0, 0, -0.5] }); return; }
  // flowers
  P.c(0.035, 1.1, [0, -0.45, 0], stem);
  P.s(0.24, [0.14, -0.4, 0], COL.leaf, [1, 0.25, 0.5], { rot: [0, 0, -0.5] });
  if (hasKw(kw, 'tulip')) { for (let i = 0; i < 4; i++) { const a = i * 1.57; P.s(0.25, [Math.cos(a) * 0.13, 0.3, Math.sin(a) * 0.13], c, [0.75, 1.3, 0.5], { rot: [Math.sin(a) * 0.25, -a, Math.cos(a) * 0.25] }); } return; }
  if (hasKw(kw, 'rose')) { for (let i = 0; i < 7; i++) { const a = i * 2.4, r = 0.05 + i * 0.03; P.s(0.24 - i * 0.012, [Math.cos(a) * r, 0.25 + i * 0.015, Math.sin(a) * r], shiftColor(c, 0, 0, i * 0.02)); } return; }
  const big = hasKw(kw, 'sunflower');
  const petalCol = big ? 0xffcc00 : c, center = big ? 0x5a3a1a : hasKw(kw, 'lotus', 'lily') ? 0xffe14a : 0xffd84a;
  if (hasKw(kw, 'lotus', 'lily')) P.c(0.55, 0.04, [0, 0.05, 0], 0x3fa64a, null, { seg: 20 });
  const n = big ? 12 : 7;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; P.s(big ? 0.24 : 0.22, [Math.cos(a) * (big ? 0.42 : 0.28), 0.25, Math.sin(a) * (big ? 0.42 : 0.28)], shiftColor(petalCol, 0, 0, (i % 2) * 0.04), [1, 0.22, 0.55], { rot: [0, -a, 0.2] }); }
  P.s(big ? 0.28 : 0.14, [0, 0.29, 0], center, [1, 0.5, 1]);
};

BUILD.mushroom = (P, I, kw) => {
  const glow = hasKw(kw, 'glow', 'fairy');
  P.c(0.2, 0.75, [0, -0.45, 0], 0xf4ecdc);
  P.add(PG.hemi(), I.color, [0, -0.05, 0], [0.85, 0.65, 0.85]);
  for (let i = 0; i < 7; i++) { const a = P.rng() * 6.28, u = 0.25 + P.rng() * 0.55; const r = Math.sqrt(1 - u * u); P.s(0.07, [Math.cos(a) * r * 0.82, -0.05 + u * 0.62, Math.sin(a) * r * 0.82], glow ? 0xc8fff8 : 0xffffff, [1, 0.45, 1], glow ? { glow: true } : {}); }
};

// ---- creatures --------------------------------------------------------------
BUILD.creature = (P, I, kw) => {
  const c = I.color, belly = lt(c, 0.12);
  const K = (...w) => hasKw(kw, ...w);
  if (K('t-rex')) {
    P.s(0.55, [0, 0, -0.1], c, [0.8, 0.9, 1.1]); P.s(0.4, [0, 0.55, 0.45], c, [0.85, 0.75, 1.15]);
    P.b(0.5, 0.06, 0.3, [0, 0.42, 0.75], 0xffffff); P.eyes(0.2, 0.7, 0.62, 0.08);
    P.seg([0.3, -0.25, -0.1], [0.32, -0.9, 0], 0.15, c); P.seg([-0.3, -0.25, -0.1], [-0.32, -0.9, 0], 0.15, c);
    P.seg([0.3, 0.05, 0.35], [0.35, -0.08, 0.55], 0.05, c); P.seg([-0.3, 0.05, 0.35], [-0.35, -0.08, 0.55], 0.05, c);
    P.seg([0, -0.1, -0.6], [0, -0.45, -1.3], 0.22, c, { cone: true, r2: 0.22 }); return;
  }
  if (K('teddy')) { P.s(0.55, [0, -0.25, 0], c); P.s(0.42, [0, 0.45, 0], c); P.s(0.14, [-0.3, 0.75, 0], c); P.s(0.14, [0.3, 0.75, 0], c); P.s(0.15, [0, 0.38, 0.35], belly); P.eyes(0.14, 0.52, 0.34, 0.07, COL.black, COL.black); for (const s of [-1, 1]) { P.s(0.2, [s * 0.5, -0.1, 0.1], c); P.s(0.22, [s * 0.3, -0.72, 0.15], c); } P.t(0.18, 0.05, [0, 0.1, 0.25], COL.red, [0.3, 0, 0]); return; }
  if (/^(monster|demon)\b/i.test(I.name) || / (monster|demon)$/i.test(I.name) && !K('lake')) {
    // hunched horned beast: big shoulders, long clawed arms, fanged maw, red eyes
    const d = dk(c, 0.06);
    P.s(0.55, [0, 0.05, -0.05], c, [1.05, 0.95, 0.8]); P.s(0.4, [0, -0.5, 0], d, [0.8, 0.7, 0.65]);
    P.s(0.3, [0, 0.42, 0.42], c, [1.05, 0.9, 1]);
    P.b(0.36, 0.1, 0.22, [0, 0.27, 0.6], 0x120608);
    for (let i = -2; i <= 2; i++) { P.k(0.025, 0.09, [i * 0.07, 0.33, 0.66], 0xf2ead8, [Math.PI, 0, 0]); P.k(0.022, 0.07, [i * 0.07 + 0.035, 0.21, 0.66], 0xf2ead8); }
    for (const s of [-1, 1]) {
      P.s(0.06, [s * 0.11, 0.52, 0.66], 0xff1a10); P.s(0.025, [s * 0.11, 0.52, 0.71], 0xffe060);
      P.k(0.07, 0.42, [s * 0.24, 0.8, 0.3], 0xd8cbb0, [-0.5, 0, -0.6 * s], { seg: 8 });
      P.s(0.24, [s * 0.55, 0.28, 0], d);
      P.seg([s * 0.6, 0.2, 0.05], [s * 0.72, -0.45, 0.3], 0.12, c); P.seg([s * 0.72, -0.45, 0.3], [s * 0.65, -0.95, 0.45], 0.1, c);
      for (let f = -1; f <= 1; f++) P.k(0.025, 0.16, [s * 0.65 + f * 0.05, -1.05, 0.5], 0xe8dcc0, [Math.PI * 0.85, 0, 0]);
      P.seg([s * 0.25, -0.7, 0], [s * 0.3, -1.05, 0.1], 0.15, d);
      P.k(0.05, 0.2, [0, 0.45 - (s + 1) * 0.2, -0.45], d, [-1.2, 0, 0]);
    }
    return;
  }
  const upright = K('monkey', 'gorilla', 'kangaroo', 'yeti', 'bigfoot', 'minotaur', 'werewolf', 'sloth', 'meerkat');
  const longLeg = K('horse', 'zebra', 'donkey', 'pony', 'unicorn', 'pegasus', 'deer', 'moose', 'reindeer', 'camel', 'llama', 'goat', 'giraffe', 'centaur', 'cow', 'bull', ' ox ', 'bison', 'cheetah');
  const lowLeg = K('lizard', 'gecko', 'iguana', 'chameleon', 'crocodile', 'alligator', 'turtle', 'tortoise', 'dinosaur', 'dragon', 'armadillo', 'platypus', 'salamander', 'hydra', 'basilisk', 'mole', 'hedgehog', 'snail', 'frog', 'toad');
  const reptile = K('lizard', 'gecko', 'iguana', 'chameleon', 'crocodile', 'alligator', 'turtle', 'tortoise', 'dinosaur', 'dragon', 'frog', 'toad', 'snail');
  if (upright) {
    P.s(0.5, [0, -0.15, 0], c, [0.85, 1.05, 0.75]); P.s(0.36, [0, 0.6, 0.05], c);
    P.s(0.24, [0, 0.52, 0.27], belly, [1, 0.8, 0.6]); P.eyes(0.13, 0.68, 0.3, 0.075);
    P.seg([0.4, 0.25, 0], [0.55, -0.45, 0.15], 0.11, c); P.seg([-0.4, 0.25, 0], [-0.55, -0.45, 0.15], 0.11, c);
    P.seg([0.22, -0.6, 0], [0.25, -1.0, 0.05], 0.13, c); P.seg([-0.22, -0.6, 0], [-0.25, -1.0, 0.05], 0.13, c);
    if (K('kangaroo')) { P.seg([0, -0.6, -0.3], [0, -0.95, -1.0], 0.12, c, { cone: true }); P.s(0.13, [-0.2, 1.0, 0], c, [0.6, 1.6, 0.4]); P.s(0.13, [0.2, 1.0, 0], c, [0.6, 1.6, 0.4]); }
    if (K('minotaur', 'werewolf')) { P.k(0.07, 0.35, [0.25, 0.92, 0], 0xf0e8d8, [0, 0, -0.7]); P.k(0.07, 0.35, [-0.25, 0.92, 0], 0xf0e8d8, [0, 0, 0.7]); P.s(0.16, [0, 0.55, 0.35], dk(c, 0.1), [1, 0.8, 1.2]); }
    return;
  }
  const bodyY = longLeg ? 0.15 : lowLeg ? -0.25 : 0;
  const legH = longLeg ? 0.75 : lowLeg ? 0.3 : 0.5;
  const bodyScale = K('elephant', 'mammoth', 'hippo', 'rhino', 'bear', 'bison') ? [0.75, 0.62, 0.95] : K('cat', 'kitten', 'fox', 'cheetah', 'leopard', 'jaguar', 'panther', 'lynx', 'weasel') ? [0.45, 0.42, 0.95] : lowLeg ? [0.55, 0.32, 0.95] : [0.55, 0.48, 0.9];
  const fluffy = K('sheep', 'lamb', 'llama', 'poodle');
  if (fluffy) { for (let i = 0; i < 9; i++) { const a = i * 0.7, u = (i % 3 - 1) * 0.35; P.s(0.34, [Math.cos(a) * 0.32, bodyY + Math.sin(a * 1.3) * 0.15, u * 1.3], 0xf8f6f0); } }
  else {
    const [bx, by, bz] = bodyScale;
    P.s(1, [0, bodyY + by * 0.06, bz * 0.34], c, [bx * 1.02, by * 1.0, bz * 0.6]);     // chest
    P.s(1, [0, bodyY - by * 0.04, 0], c, [bx * 0.86, by * 0.86, bz * 0.6]);            // waist
    P.s(1, [0, bodyY + by * 0.02, -bz * 0.34], c, [bx * 0.96, by * 0.94, bz * 0.58]);  // hips
    P.s(1, [0, bodyY + by * 0.42, bz * 0.42], c, [bx * 0.55, by * 0.35, bz * 0.3]);    // shoulders
  }
  if (!fluffy && !K('turtle', 'tortoise')) P.s(1, [0, bodyY - bodyScale[1] * 0.25, 0.05], belly, [bodyScale[0] * 0.82, bodyScale[1] * 0.7, bodyScale[2] * 0.85]);
  // legs
  const lx = bodyScale[0] * 0.62, lz = bodyScale[2] * 0.58;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const top = [sx * lx, bodyY - bodyScale[1] * 0.4, sz * lz];
    const bot = [sx * lx * (lowLeg ? 1.4 : 1), bodyY - bodyScale[1] * 0.4 - legH, sz * lz];
    const lr = K('elephant', 'mammoth', 'hippo', 'rhino', 'bear') ? 0.15 : longLeg ? 0.075 : 0.1, lc = dk(c, 0.05);
    const hind = sz < 0, knee = [(top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2 + legH * 0.05, top[2] + (hind ? -0.07 : 0.05) * (1 + legH)];
    P.s(lr * 1.45, [top[0], top[1] + lr * 0.4, top[2]], c, [1, 1.3, 1.15]);          // thigh / shoulder muscle
    P.seg(top, knee, lr * 1.1, lc);
    P.s(lr * 0.95, knee, lc);
    P.seg(knee, bot, lr * 0.8, lc);
    if (longLeg) P.c(0.085, 0.08, [bot[0], bot[1] - 0.02, bot[2]], COL.dark);
    else if (!reptile) P.s(lr * 1.15, [bot[0], bot[1] - lr * 0.3, bot[2] + lr * 0.45], lc, [1, 0.55, 1.4]);      // paw
    else for (const d of [-1, 0, 1]) P.seg([bot[0], bot[1], bot[2]], [bot[0] + d * lr * 1.4, bot[1] - lr * 0.4, bot[2] + lr * 1.4], lr * 0.25, lc); // claws
  }
  // neck + head
  let hp = [0, bodyY + bodyScale[1] * 0.55, bodyScale[2] * 0.95];
  if (K('giraffe')) { P.seg([0, bodyY + 0.2, 0.55], [0, bodyY + 1.25, 0.85], 0.12, c); hp = [0, bodyY + 1.3, 0.92]; }
  else if (longLeg || K('dinosaur')) { const up = K('dinosaur') ? 0.9 : 0.42; P.seg([0, bodyY + 0.15, bodyScale[2] * 0.6], [0, bodyY + up, bodyScale[2] * 1.05], K('dinosaur') ? 0.14 : 0.16, c); hp = [0, bodyY + up + 0.05, bodyScale[2] * 1.12]; }
  else if (lowLeg) hp = [0, bodyY + 0.08, bodyScale[2] * 1.02];
  else P.seg([0, bodyY + bodyScale[1] * 0.3, bodyScale[2] * 0.62], [hp[0], hp[1] - 0.05, hp[2] - 0.1], 0.17, c);
  const hr = K('elephant', 'mammoth', 'hippo') ? 0.4 : K('mouse', 'hamster', 'rabbit') ? 0.3 : 0.32;
  const multi = K('cerberus') ? [-0.38, 0, 0.38] : [0];
  for (const dx of multi) {
    const h = [hp[0] + dx, hp[1], hp[2]];
    P.s(hr, h, c, reptile ? [0.9, 0.7, 1.25] : [1, 0.95, 1.05]);
    // snout
    if (K('dog', 'puppy', 'wolf', 'fox', 'hyena', 'cerberus', 'bear', 'horse', 'zebra', 'donkey', 'pony', 'unicorn', 'pegasus', 'deer', 'moose', 'reindeer', 'camel', 'llama', 'goat', 'cow', 'bull', ' ox ', 'bison', 'pig', 'boar', 'crocodile', 'alligator', 'dragon', 'dinosaur', 'lizard', 'iguana', 'kitsune', 'raccoon'))
      P.s(hr * 0.62, [h[0], h[1] - hr * 0.2, h[2] + hr * (K('crocodile', 'alligator') ? 1.3 : 0.85)], K('pig', 'boar', 'cow') ? 0xffb0b8 : lt(c, 0.06), K('crocodile', 'alligator') ? [0.8, 0.5, 2.2] : [0.95, 0.75, 1.1]);
    if (K('pig', 'boar')) P.c(hr * 0.28, 0.05, [h[0], h[1] - hr * 0.2, h[2] + hr * 1.38], 0xff8a98, [Math.PI / 2, 0, 0]);
    P.eyes(hr * 0.45, h[1] + hr * 0.28, h[2] + hr * 0.72, hr * 0.27);
    // ears
    if (K('rabbit', 'bunny', 'kangaroo')) { P.s(0.11, [h[0] - 0.12, h[1] + hr + 0.25, h[2] - 0.05], c, [0.7, 2.6, 0.4]); P.s(0.11, [h[0] + 0.12, h[1] + hr + 0.25, h[2] - 0.05], c, [0.7, 2.6, 0.4]); }
    else if (K('elephant', 'mammoth')) { P.s(0.36, [h[0] - 0.42, h[1], h[2] - 0.1], dk(c, 0.04), [0.25, 1, 0.9]); P.s(0.36, [h[0] + 0.42, h[1], h[2] - 0.1], dk(c, 0.04), [0.25, 1, 0.9]); }
    else if (K('mouse', 'hamster', 'bear', 'panda', 'koala', 'rat', 'mole', 'hippo')) { const er = K('koala', 'mouse') ? 0.16 : 0.11; P.s(er, [h[0] - hr * 0.7, h[1] + hr * 0.75, h[2] - 0.05], K('panda') ? COL.dark : c, [1, 1, 0.45]); P.s(er, [h[0] + hr * 0.7, h[1] + hr * 0.75, h[2] - 0.05], K('panda') ? COL.dark : c, [1, 1, 0.45]); }
    else if (!reptile) { P.k(0.1, 0.24, [h[0] - hr * 0.55, h[1] + hr * 0.85, h[2] - 0.05], dk(c, 0.04), [0, 0, 0.3], { seg: 8 }); P.k(0.1, 0.24, [h[0] + hr * 0.55, h[1] + hr * 0.85, h[2] - 0.05], dk(c, 0.04), [0, 0, -0.3], { seg: 8 }); }
    // horns / antlers / tusks / trunk / mane
    if (K('unicorn')) P.k(0.07, 0.55, [h[0], h[1] + hr + 0.2, h[2] + hr * 0.4], 0xffe08a, [0.45, 0, 0], { seg: 8 });
    if (K('rhino')) { P.k(0.1, 0.4, [h[0], h[1] + 0.05, h[2] + hr * 1.1], 0xe8e0d0, [0.9, 0, 0]); }
    if (K('cow', 'bull', ' ox ', 'bison', 'goat', 'dragon', 'demon', 'chimera')) { P.k(0.06, 0.3, [h[0] - hr * 0.55, h[1] + hr * 0.9, h[2] - 0.05], 0xf0e8d8, [0, 0, 0.6], { seg: 8 }); P.k(0.06, 0.3, [h[0] + hr * 0.55, h[1] + hr * 0.9, h[2] - 0.05], 0xf0e8d8, [0, 0, -0.6], { seg: 8 }); }
    if (K('deer', 'moose', 'reindeer')) for (const s of [-1, 1]) { P.seg([h[0] + s * 0.15, h[1] + hr * 0.8, h[2]], [h[0] + s * 0.4, h[1] + hr + 0.4, h[2] - 0.05], 0.03, 0xd8c8a8); P.seg([h[0] + s * 0.3, h[1] + hr + 0.15, h[2]], [h[0] + s * 0.25, h[1] + hr + 0.45, h[2] + 0.15], 0.025, 0xd8c8a8); }
    if (K('elephant', 'mammoth')) { for (let i = 0; i < 4; i++) P.c(0.11 - i * 0.015, 0.22, [h[0], h[1] - 0.2 - i * 0.18, h[2] + hr * 0.95 + i * 0.03], c); if (K('mammoth')) { P.seg([h[0] - 0.2, h[1] - 0.25, h[2] + 0.3], [h[0] - 0.35, h[1] - 0.55, h[2] + 0.75], 0.05, 0xf4ecd8, { cone: true }); P.seg([h[0] + 0.2, h[1] - 0.25, h[2] + 0.3], [h[0] + 0.35, h[1] - 0.55, h[2] + 0.75], 0.05, 0xf4ecd8, { cone: true }); } }
    if (K('lion', 'chimera')) P.t(hr * 0.95, hr * 0.38, [h[0], h[1], h[2] - 0.08], 0xb8702a);
    if (K('boar')) { P.k(0.04, 0.15, [h[0] - 0.12, h[1] - 0.2, h[2] + 0.45], 0xffffff, [-0.5, 0, 0]); P.k(0.04, 0.15, [h[0] + 0.12, h[1] - 0.2, h[2] + 0.45], 0xffffff, [-0.5, 0, 0]); }
    if (K('panda')) { P.s(0.09, [h[0] - hr * 0.42, h[1] + hr * 0.25, h[2] + hr * 0.68], COL.dark, [1, 1.2, 0.5]); P.s(0.09, [h[0] + hr * 0.42, h[1] + hr * 0.25, h[2] + hr * 0.68], COL.dark, [1, 1.2, 0.5]); }
  }
  // tail
  const tailBase = [0, bodyY + 0.05, -bodyScale[2] * 0.95];
  if (reptile && !K('turtle', 'tortoise', 'frog', 'toad', 'snail')) { let p = tailBase; for (let i = 0; i < 4; i++) { const n = [0, p[1] - 0.05, p[2] - 0.3]; P.seg(p, n, 0.16 - i * 0.035, c); p = n; } }
  else if (K('kitsune')) { for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.45; P.s(0.2, [Math.sin(a) * 0.45, bodyY + 0.35, tailBase[2] - 0.25], i % 2 ? 0xffffff : c, [0.8, 0.8, 2.2], { rot: [0.5, a, 0] }); } }
  else if (K('fox', 'squirrel', 'skunk', 'raccoon')) P.s(0.24, [0, bodyY + 0.3, tailBase[2] - 0.2], K('skunk') ? COL.dark : c, [0.9, 0.9, 2], { rot: [0.7, 0, 0] });
  else if (K('beaver', 'platypus')) P.b(0.35, 0.06, 0.55, [0, bodyY - 0.15, tailBase[2] - 0.2], dk(c, 0.15), null, { round: true });
  else if (K('pig')) P.t(0.08, 0.025, [0, bodyY + 0.1, tailBase[2] - 0.04], 0xff9aa8);
  else if (!K('rabbit', 'bear', 'koala', 'hamster', 'turtle', 'tortoise', 'frog', 'toad', 'snail', 'panda', 'armadillo', 'hedgehog'))
  {
    const up = K('cat', 'kitten', 'dog', 'puppy', 'cheetah', 'leopard', 'wolf', 'husky') ? 1 : -1;
    let p = tailBase, r = K('horse', 'zebra', 'donkey', 'pony', 'unicorn', 'pegasus') ? 0.07 : 0.055;
    for (let i = 0; i < 5; i++) {
      const t = (i + 1) / 5, n = [0, tailBase[1] + up * Math.sin(t * 1.4) * 0.5, tailBase[2] - t * 0.55 + (up > 0 ? t * t * 0.18 : 0)];
      P.seg(p, n, r, dk(c, 0.04)); P.s(r, n, dk(c, 0.04));
      p = n; r *= 0.8;
    }
  }
  // shells, spikes, humps, stripes, spots
  if (K('turtle', 'tortoise', 'armadillo')) { P.add(PG.hemi(), K('armadillo') ? lt(c, 0.06) : 0x5a7a3a, [0, bodyY - 0.05, 0], [bodyScale[0] * 1.25, bodyScale[1] * 1.8, bodyScale[2] * 1.05]); for (let i = 0; i < 5; i++) P.s(0.13, [(i - 2) * 0.17, bodyY + bodyScale[1] * 1.2 - Math.abs(i - 2) * 0.1, 0], 0x7a9a4a, [1, 0.3, 1.4]); }
  if (K('snail')) { P.t(0.38, 0.2, [0, bodyY + 0.35, -0.1], 0xc8904a, [0, Math.PI / 2, 0]); P.t(0.2, 0.12, [0, bodyY + 0.35, -0.1], 0xd8a060, [0, Math.PI / 2, 0]); }
  if (K('hedgehog', 'porcupine', 'dragon', 'dinosaur', 'stegosaurus')) for (let i = 0; i < (K('dragon', 'dinosaur') ? 5 : 14); i++) { const z = 0.6 - i * (K('dragon', 'dinosaur') ? 0.3 : 0.1); const x = K('dragon', 'dinosaur') ? 0 : (P.rng() - 0.5) * 0.6; P.k(0.06, 0.28, [x, bodyY + bodyScale[1] * 0.85, z], K('dragon') ? lt(c, 0.15) : dk(c, 0.2), [-0.5, 0, x * 0.8], { seg: 6 }); }
  if (K('camel')) P.s(0.3, [0, bodyY + bodyScale[1] * 0.85, 0], c);
  if (K('tiger', 'zebra')) for (let i = 0; i < 5; i++) P.t(bodyScale[0] * 0.95, 0.035, [0, bodyY, -0.55 + i * 0.27], COL.dark, [0, 0, 0], { rs: 18 });
  if (K('leopard', 'cheetah', 'jaguar', 'giraffe', 'cow', 'snow leopard')) for (let i = 0; i < 10; i++) { const a = P.rng() * 3.14 - 1.57, z = (P.rng() - 0.5) * 1.4; P.s(0.07, [Math.sin(a) * bodyScale[0] * 0.98, bodyY + Math.cos(a) * bodyScale[1] * 0.95, z * bodyScale[2]], K('cow') ? COL.dark : dk(c, 0.3), [1, 1, 0.4]); }
};

BUILD.bird = (P, I, kw) => {
  const c = I.color, K = (...w) => hasKw(kw, ...w);
  if (K('penguin')) { P.s(0.55, [0, -0.1, 0], c, [1, 1.35, 0.9]); P.s(0.42, [0, -0.15, 0.2], 0xffffff, [1, 1.3, 0.7]); P.s(0.35, [0, 0.75, 0.05], c); P.eyes(0.13, 0.82, 0.28, 0.08); P.k(0.08, 0.2, [0, 0.72, 0.42], COL.orange, [Math.PI / 2, 0, 0]); P.s(0.15, [-0.55, -0.05, 0], c, [0.3, 1.4, 0.7]); P.s(0.15, [0.55, -0.05, 0], c, [0.3, 1.4, 0.7]); P.s(0.13, [-0.2, -0.85, 0.2], COL.orange, [1, 0.4, 1.5]); P.s(0.13, [0.2, -0.85, 0.2], COL.orange, [1, 0.4, 1.5]); return; }
  if (K('owl')) { P.s(0.62, [0, -0.05, 0], c, [1, 1.2, 0.95]); P.s(0.45, [0, -0.1, 0.25], lt(c, 0.15), [1, 1.1, 0.6]); P.eyes(0.22, 0.4, 0.42, 0.17, 0xfff0a0); P.k(0.06, 0.18, [0, 0.28, 0.6], COL.orange, [Math.PI / 2 + 0.4, 0, 0]); P.k(0.08, 0.25, [-0.3, 0.75, 0], c, [0, 0, 0.3]); P.k(0.08, 0.25, [0.3, 0.75, 0], c, [0, 0, -0.3]); }
  else {
    const longNeck = K('flamingo', 'swan', 'ostrich', 'stork', 'goose');
    P.s(0.5, [0, 0, 0], c, [0.82, 0.78, 1.08]);
    P.s(0.36, [0, -0.1, 0.22], K('robin') ? COL.orange : lt(c, 0.1), [1, 1, 0.9]);
    P.s(0.3, [0, 0.12, -0.25], dk(c, 0.05), [1, 0.6, 1.3]);
    let hp = [0, 0.42, 0.42];
    if (!longNeck) P.s(0.22, [0, 0.27, 0.33], c);
    if (longNeck) { P.seg([0, 0.2, 0.35], [0, 0.9, 0.5], 0.09, c); hp = [0, 0.95, 0.55]; }
    P.s(K('hummingbird') ? 0.24 : 0.3, hp, K('eagle') ? 0xffffff : c);
    P.eyes(0.13, hp[1] + 0.06, hp[2] + 0.2, 0.075);
    const beak = K('duck', 'goose', 'platypus', 'swan') ? [0.12, 0.08, 0.35] : K('hummingbird', 'kiwi', 'stork') ? [0.03, 0.03, 0.6] : K('toucan') ? [0.14, 0.18, 0.5] : [0.07, 0.07, 0.3];
    const bc = K('crow', 'raven') ? COL.dark : COL.orange, bz = hp[2] + 0.28 + beak[2] / 2 - 0.12;
    P.k(beak[0], beak[2], [0, hp[1] - 0.02, bz], bc, [Math.PI / 2, 0, 0], { seg: 10 });
    P.k(beak[0] * 0.75, beak[2] * 0.75, [0, hp[1] - 0.07, bz - beak[2] * 0.12], dk(bc, 0.08), [Math.PI / 2 - 0.12, 0, 0], { seg: 10 });
    if (K('chicken', 'rooster', 'turkey', 'chick')) { P.s(0.08, [0, hp[1] + 0.3, hp[2] + 0.05], COL.red, [0.6, 1.2, 1.4]); P.s(0.06, [0, hp[1] - 0.18, hp[2] + 0.22], COL.red, [0.6, 1.2, 0.6]); }
    if (K('peacock', 'turkey')) for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.28; P.s(0.32, [Math.sin(a) * 0.65, 0.45 + Math.cos(a) * 0.4, -0.62], i % 2 ? c : lt(c, 0.15), [0.35, 1.2, 0.1], { rot: [-0.3, 0, -a] }); if (K('peacock')) P.s(0.07, [Math.sin(a) * 0.9, 0.5 + Math.cos(a) * 0.72, -0.66], 0x2a4ad8); }
    else for (let i = -2; i <= 2; i++) P.s(0.24, [Math.sin(i * 0.22) * 0.22, 0.1 - Math.abs(i) * 0.02, -0.62], i % 2 ? dk(c, 0.12) : dk(c, 0.06), [0.32, 0.06, 1.25], { rot: [0.35, i * 0.22, 0] });
    const legL = longNeck && !K('swan', 'goose') ? 0.9 : 0.3;
    if (!K('bat')) for (const s of [-1, 1]) {
      const fy = -0.3 - legL, fx = s * 0.15;
      P.s(0.12, [fx, -0.3, 0.04], c, [1, 1.25, 1]);
      P.seg([fx, -0.38, 0.06], [fx, fy, 0.1], 0.026, COL.orange);
      for (const a of [-0.5, 0, 0.5]) P.seg([fx, fy, 0.1], [fx + Math.sin(a) * 0.15, fy - 0.02, 0.1 + Math.cos(a) * 0.15], 0.018, COL.orange);
      P.seg([fx, fy, 0.1], [fx, fy - 0.02, -0.02], 0.016, COL.orange);
    }
  }
  if (!K('kiwi', 'ostrich', 'penguin', 'chicken', 'turkey', 'chick')) {
    const wc = K('bat', 'pterodactyl') ? dk(c, 0.15) : K('parrot') ? 0x3a6ad8 : dk(c, 0.06);
    const membrane = K('bat', 'pterodactyl');
    for (const s of [-1, 1]) {
      const pv = new THREE.Vector3(s * 0.38, 0.12, 0);
      const sub = new Parts(I, P.rng);
      if (membrane) sub.add(PG.cone(3), wc, [s * 0.55, 0, 0], [0.18, 1.1, 0.5], [0, 0, s * Math.PI / 2]);
      else {
        sub.s(0.42, [s * 0.45, 0.02, 0], wc, [1, 0.14, 0.6]);
        sub.s(0.3, [s * 0.5, 0.05, 0.08], lt(wc, 0.06), [1, 0.1, 0.45]);
        for (let j = 0; j < 5; j++) sub.s(0.3, [s * (0.58 + j * 0.08), -0.01 - j * 0.005, -0.12 - j * 0.05], j % 2 ? dk(wc, 0.05) : wc, [0.8, 0.06, 0.26], { rot: [0, s * (0.2 + j * 0.13), 0] });
      }
      for (const p of sub.list) { p.anim = s < 0 ? 'wingL' : 'wingR'; p.pivot = pv; P.list.push(p); }
    }
  }
  if (K('phoenix', 'thunderbird')) for (let i = 0; i < 4; i++) P.s(0.15, [(i - 1.5) * 0.15, 0.1, -0.8 - i * 0.05], K('phoenix') ? 0xffb03a : 0x8ad8ff, [0.4, 0.3, 1.6], { glow: true });
};

BUILD.fish = (P, I, kw) => {
  const c = I.color, K = (...w) => hasKw(kw, ...w);
  if (K('seahorse')) { P.s(0.35, [0, 0.5, 0], c, [0.8, 0.8, 1.2]); P.c(0.1, 0.4, [0, 0.45, 0.4], c, [Math.PI / 2, 0, 0]); for (let i = 0; i < 6; i++) P.s(0.3 - i * 0.04, [0, 0.1 - i * 0.2, -0.05 + Math.sin(i * 0.9) * 0.2], i % 2 ? c : lt(c, 0.06)); P.eyes(0.2, 0.62, 0.15, 0.08); return; }
  if (K('starfish')) { P.add(PG.star(5, 0.45, 0.3), c, [0, 0, 0], 1, [Math.PI / 2, 0, 0]); return; }
  if (K('pufferfish')) { BUILD.spike(P, I, ' puff '); P.eyes(0.25, 0.15, 0.5, 0.12); return; }
  const big = K('whale', 'orca', 'leviathan');
  P.s(1, [0, 0, 0], c, big ? [0.62, 0.55, 1.05] : [0.38, 0.55, 0.95]);
  P.s(1, [0, -0.15, 0.05], K('orca') ? 0xffffff : lt(c, 0.14), big ? [0.55, 0.38, 0.9] : [0.3, 0.38, 0.8]);
  P.eyes(big ? 0.45 : 0.3, 0.12, big ? 0.65 : 0.6, big ? 0.09 : 0.11);
  if (big) { P.s(0.36, [0, 0.0, -1.05], dk(c, 0.06), [1.5, 0.12, 0.5]); P.s(0.2, [0.62, -0.25, 0.2], dk(c, 0.05), [0.8, 0.12, 0.45], { rot: [0, 0, -0.5] }); P.s(0.2, [-0.62, -0.25, 0.2], dk(c, 0.05), [0.8, 0.12, 0.45], { rot: [0, 0, 0.5] }); if (K('orca')) P.k(0.15, 0.5, [0, 0.65, -0.1], c, [-0.25, 0, 0]); }
  else {
    P.s(1, [0, 0.02, -0.62], c, [0.17, 0.26, 0.45]);
    for (const s of [-1, 1]) P.s(0.36, [0, s * 0.2, -1.12], dk(c, 0.05), [0.07, 0.42, 1], { rot: [s * 0.62, 0, 0] });
    for (const s of [-1, 1]) { P.s(0.2, [s * 0.29, 0.02, 0.42], dk(c, 0.12), [0.12, 1.2, 0.22], { rot: [0, s * 0.45, 0] }); P.s(0.05, [s * 0.1, -0.12, 0.92], dk(c, 0.2), [0.8, 0.4, 0.4]); }
    P.s(0.16, [0, -0.5, -0.45], dk(c, 0.04), [0.08, 0.55, 1], { rot: [-0.5, 0, 0] });
    P.add(PG.cone(4), dk(c, 0.04), [0, K('shark') ? 0.75 : 0.55, -0.05], [0.05, K('shark') ? 0.6 : 0.32, 0.3], [-0.3, 0, 0]);
    P.s(0.14, [0.35, -0.15, 0.25], dk(c, 0.04), [0.2, 0.5, 1.2]); P.s(0.14, [-0.35, -0.15, 0.25], dk(c, 0.04), [0.2, 0.5, 1.2]);
    if (K('shark')) P.b(0.35, 0.05, 0.12, [0, -0.2, 0.85], 0xffffff);
    if (K('dolphin')) P.c(0.1, 0.35, [0, -0.05, 1.0], c, [Math.PI / 2, 0, 0]);
    if (K('tropical', 'clown')) for (let i = 0; i < 3; i++) P.t(0.4 - Math.abs(i - 1) * 0.1, 0.05, [0, 0, -0.4 + i * 0.4], 0xffffff, [0, Math.PI / 2, 0], { rs: 16 });
  }
  if (K('cosmic', 'leviathan')) for (let i = 0; i < 9; i++) P.s(0.04, [(P.rng() - 0.5) * 1.2, (P.rng() - 0.2) * 0.8, (P.rng() - 0.5) * 2], 0xffffff, null, { glow: true });
  if (K('tadpole')) { P.list.length = 0; P.s(0.55, [0, 0, 0.3], c); P.eyes(0.25, 0.18, 0.75, 0.12); P.seg([0, 0, -0.2], [0, 0.05, -1.2], 0.18, c, { cone: true, r2: 0.03 }); }
};

BUILD.snake = (P, I, kw) => {
  const c = I.color, K = (...w) => hasKw(kw, ...w);
  const heads = K('hydra') ? 3 : 1;
  const n = K('worm') ? 7 : 9;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const r = 0.24 - t * 0.12 + (K('caterpillar') ? 0.04 : 0);
    P.s(r, [Math.sin(t * 5) * 0.4, -0.55 + (K('cobra') ? 0 : 0), 0.9 - t * 1.9], i % 2 && K('caterpillar', 'coral snake', 'bee') ? lt(c, 0.12) : shiftColor(c, 0, 0, (i % 2) * 0.04), [1, 0.85, 1.3]);
    if (K('caterpillar') && i > 0) { P.c(0.025, 0.15, [Math.sin(t * 5) * 0.4 + 0.15, -0.75, 0.9 - t * 1.9], dk(c)); P.c(0.025, 0.15, [Math.sin(t * 5) * 0.4 - 0.15, -0.75, 0.9 - t * 1.9], dk(c)); }
  }
  for (let h = 0; h < heads; h++) {
    const x = heads > 1 ? (h - 1) * 0.45 : 0;
    const raise = K('cobra', 'hydra', 'sea serpent', 'basilisk') ? 0.7 : 0;
    if (raise) P.seg([x * 0.4, -0.5, 0.95], [x, -0.5 + raise, 1.1], 0.16, c);
    const hp = [x, -0.5 + raise + 0.05, 1.15];
    P.s(0.28, hp, c, [1, 0.8, 1.3]);
    if (K('cobra')) P.s(0.4, [hp[0], hp[1] - 0.2, hp[2] - 0.15], dk(c, 0.05), [1, 1, 0.2]);
    P.eyes(0.13, hp[1] + 0.12, hp[2] + 0.2, 0.08);
    if (!K('worm', 'caterpillar', 'eel')) P.seg([hp[0], hp[1] - 0.08, hp[2] + 0.3], [hp[0], hp[1] - 0.08, hp[2] + 0.55], 0.02, COL.red);
    if (K('basilisk')) for (let i = 0; i < 3; i++) P.k(0.05, 0.2, [hp[0] + (i - 1) * 0.1, hp[1] + 0.25, hp[2]], COL.gold);
  }
  if (K('caterpillar')) { P.seg([-0.08, -0.35, 1.0], [-0.15, -0.1, 1.05], 0.02, COL.dark); P.seg([0.08, -0.35, 1.0], [0.15, -0.1, 1.05], 0.02, COL.dark); }
  if (K('electric')) for (let i = 0; i < 5; i++) P.s(0.05, [Math.sin(i) * 0.3, -0.35, 0.6 - i * 0.35], 0xfff36b, null, { glow: true });
};

BUILD.insect = (P, I, kw) => {
  const c = I.color, K = (...w) => hasKw(kw, ...w);
  const crab = K('crab', 'lobster', 'shrimp', 'scorpion');
  if (K('ladybug', 'beetle')) { P.add(PG.hemi(), c, [0, -0.3, 0], [0.75, 0.6, 0.9]); P.s(0.3, [0, -0.3, 0.78], COL.dark); P.eyes(0.12, -0.2, 1.0, 0.07); if (K('ladybug')) { for (let i = 0; i < 6; i++) P.s(0.1, [(i % 2 ? 1 : -1) * (0.25 + (i % 3) * 0.1), 0.0 + (i % 3) * 0.05, -0.3 + Math.floor(i / 2) * 0.3], COL.dark, [1, 0.4, 1]); P.b(0.02, 0.05, 1.6, [0, 0.29, 0], COL.dark); } }
  else {
    P.s(0.28, [0, 0, 0.62], dk(c, 0.05));
    P.s(0.32, [0, 0, 0.15], c);
    P.s(0.42, [0, 0.02, -0.5], K('bee') ? COL.yellow : K('firefly') ? 0xe6ff5c : c, [0.85, 0.75, crab && !K('crab') ? 1.6 : 1.25], K('firefly') ? { glow: true } : {});
    P.eyes(0.14, 0.08, 0.82, 0.09);
    if (K('bee', 'wasp')) for (let i = 0; i < 3; i++) P.t(0.33 - i * 0.04, 0.05, [0, 0.02, -0.4 - i * 0.18], COL.dark, [0, 0, 0], { rs: 16 });
  }
  const legN = K('spider') ? 4 : crab ? 4 : 3;
  for (let i = 0; i < legN; i++) for (const s of [-1, 1]) {
    const z = 0.3 - i * (K('spider') ? 0.2 : 0.25);
    const knee = [s * 0.55, 0.12, z], foot = [s * 0.85, -0.45, z + (i - 1) * 0.1];
    P.seg([s * 0.15, 0, z], knee, 0.035, dk(c, 0.15)); P.seg(knee, foot, 0.03, dk(c, 0.15));
  }
  if (!K('spider') && !crab) { P.seg([-0.08, 0.15, 0.82], [-0.25, 0.55, 1.05], 0.02, COL.dark); P.seg([0.08, 0.15, 0.82], [0.25, 0.55, 1.05], 0.02, COL.dark); }
  if (crab) { for (const s of [-1, 1]) { P.seg([s * 0.3, 0, 0.6], [s * 0.55, 0.15, 1.0], 0.06, c); P.s(0.2, [s * 0.6, 0.18, 1.15], c, [0.8, 0.6, 1.2]); P.k(0.08, 0.25, [s * 0.5, 0.2, 1.32], c, [Math.PI / 2, 0, 0]); } }
  if (K('scorpion')) { let p = [0, 0.05, -1.1]; for (let i = 0; i < 5; i++) { const n = [0, p[1] + 0.22, p[2] + (i < 3 ? -0.05 : 0.18)]; P.seg(p, n, 0.08 - i * 0.008, c); p = n; } P.k(0.06, 0.2, p, COL.dark, [1.8, 0, 0]); }
  if (K('lobster', 'shrimp')) for (let i = 0; i < 3; i++) P.s(0.3 - i * 0.05, [0, 0, -1.1 - i * 0.28], dk(c, i * 0.03), [1, 0.6, 0.8]);
  const flying = I.tags.includes('flying');
  if (flying) {
    const big = K('butterfly', 'moth');
    const wc = big ? c : 0xe0f2ff;
    for (const s of [-1, 1]) {
      const sub = new Parts(I, P.rng), pv = new THREE.Vector3(s * 0.2, 0.3, 0.15);
      if (big) { sub.s(0.6, [s * 0.6, 0.35, 0.3], wc, [1, 0.06, 0.8]); sub.s(0.42, [s * 0.5, 0.3, -0.35], lt(wc, 0.1), [1, 0.06, 0.8]); sub.s(0.12, [s * 0.65, 0.39, 0.3], 0xffffff, [1, 0.3, 1]); }
      else if (K('dragonfly')) { sub.s(0.5, [s * 0.6, 0.3, 0.3], wc, [1.4, 0.04, 0.22]); sub.s(0.45, [s * 0.55, 0.3, 0.0], wc, [1.4, 0.04, 0.22]); }
      else sub.s(0.4, [s * 0.35, 0.38, -0.1], wc, [0.55, 0.05, 1.1], { rot: [0, s * 0.4, 0] });
      for (const p of sub.list) { p.anim = s < 0 ? 'wingL' : 'wingR'; p.pivot = pv; P.list.push(p); }
    }
  }
  if (K('software bug', 'computer')) for (let i = 0; i < 4; i++) P.b(0.12, 0.12, 0.12, [(P.rng() - 0.5) * 0.8, 0.45, (P.rng() - 0.5) * 0.8], 0x5aff3a, null, { glow: true });
};

// ---- people -----------------------------------------------------------------
BUILD.humanoid = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w);
  let skin = COL.skin, cloth = I.color, eye = COL.black;
  if (K('alien')) skin = 0x7ee06a;
  if (K('zombie', 'ghoul', 'frankenstein')) skin = 0x8aa87a;
  if (K('vampire')) skin = 0xf0e6ea;
  if (K('skeleton', 'reaper')) skin = 0xf2eee2;
  if (K('mummy')) { skin = 0xe8dcb8; cloth = 0xe8dcb8; }
  if (K('genie', 'nymph')) skin = 0x5aa8ff;
  if (K('statue', 'titan', 'stone')) { skin = I.color; cloth = I.color; }
  if (K('devil')) skin = 0xd8202a;
  if (K('goblin', 'ogre', 'troll', 'elf', 'dryad')) skin = K('elf') ? COL.skin : 0x7aa84a;
  if (K('snowman')) {
    P.s(0.55, [0, -0.5, 0], 0xffffff); P.s(0.4, [0, 0.2, 0], 0xffffff); P.s(0.3, [0, 0.75, 0], 0xffffff);
    P.k(0.06, 0.3, [0, 0.75, 0.38], COL.orange, [Math.PI / 2, 0, 0]); P.s(0.04, [-0.1, 0.85, 0.27], COL.dark); P.s(0.04, [0.1, 0.85, 0.27], COL.dark);
    for (let i = 0; i < 3; i++) P.s(0.04, [0, 0.35 - i * 0.15, 0.4], COL.dark);
    P.t(0.3, 0.07, [0, 0.52, 0], COL.red, [Math.PI / 2, 0, 0]); P.c(0.22, 0.32, [0, 1.15, 0], COL.dark); P.c(0.33, 0.04, [0, 0.99, 0], COL.dark);
    P.seg([0.35, 0.25, 0], [0.75, 0.55, 0], 0.025, COL.wood); P.seg([-0.35, 0.25, 0], [-0.75, 0.55, 0], 0.025, COL.wood); return;
  }
  if (K('crowd', 'family', 'army', 'orchestra', 'band', 'choir', 'tribe', 'twins', 'society', 'friendship')) {
    const n = K('twins') ? 2 : 3;
    for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 0.62, h = i === 1 ? 1 : 0.85; P.c(0.2 * h, 0.55 * h, [x, -0.3, 0], shiftColor(cloth, i * 0.08, 0, 0)); P.s(0.2 * h, [x, 0.12 + 0.1 * h, 0], skin); P.eyes(0.07, 0.15 + 0.1 * h, 0.17, 0.035); }
    return;
  }
  const baby = K('baby', 'child', 'gnome', 'dwarf', 'goblin');
  const headR = baby ? 0.36 : 0.27;
  const merTail = K('mermaid', 'siren');
  const genie = K('genie');
  // torso
  if (K('skeleton', 'reaper') && !K('reaper')) { for (let i = 0; i < 4; i++) P.t(0.2, 0.03, [0, 0.15 - i * 0.12, 0], skin, [Math.PI / 2, 0, 0]); P.c(0.04, 0.6, [0, -0.05, 0], skin); }
  else if (K('reaper', 'priest', 'monk', 'wizard', 'witch', 'warlock', 'sorcerer', 'necromancer', 'angel', 'archangel', 'goddess', 'dress', 'princess', 'queen', 'santa', 'muse', 'odin')) P.f(0.22, 0.48, 1.0, [0, -0.35, 0], cloth);
  else {
    P.s(0.3, [0, 0.0, 0], cloth, [1.1, 0.95, 0.72]);                // chest
    P.c(0.25, 0.42, [0, -0.2, 0], cloth, null, { seg: 20 });         // waist (smooth column joins chest and hips)
    P.s(0.27, [0, -0.38, 0], dk(cloth, 0.06), [1.0, 0.55, 0.72]);   // hips / belt line
    P.seg([-0.27, 0.16, 0], [0.27, 0.16, 0], 0.095, cloth);           // shoulders
  }
  if (K('mummy')) for (let i = 0; i < 5; i++) P.t(0.27, 0.03, [0, 0.15 - i * 0.12, 0], 0xd8c8a0, [Math.PI / 2 + (i % 2 ? 0.2 : -0.2), 0, 0]);
  if (K('doctor', 'scientist', 'nurse', 'chef', 'professor', 'alchemist')) P.b(0.42, 0.55, 0.05, [0, -0.08, 0.2], 0xffffff);
  if (K('surfer')) { P.s(1, [0, -1.12, 0.05], 0xffcf3a, [0.32, 0.04, 1.05]); P.b(0.05, 0.03, 2.0, [0, -1.09, 0.05], 0xffffff); }
  if (K('superhero', 'hero')) P.add(PG.star(5, 0.45, 0.1), COL.yellow, [0, 0.05, 0.24], 0.12);
  // head
  const hy = baby ? 0.6 : 0.52;
  P.c(0.075, 0.16, [0, hy - headR * 0.95, 0], skin);                // neck
  P.s(headR, [0, hy, 0], skin, [0.94, 1.06, 1]);
  if (!K('alien', 'skeleton', 'reaper', 'cyclops', 'astronaut')) {
    P.s(headR * 0.78, [0, hy - headR * 0.32, headR * 0.12], skin, [1, 0.82, 1]);                    // jaw
    P.s(headR * 0.14, [0, hy - headR * 0.06, headR * 0.98], skin, [0.75, 1, 1.1]);                  // nose
    for (const s of [-1, 1]) P.s(headR * 0.2, [s * headR * 0.95, hy - headR * 0.02, -headR * 0.02], skin, [0.45, 1, 0.8]); // ears
  }
  if (K('cyclops')) { P.s(headR * 0.4, [0, hy + 0.05, headR * 0.8], 0xffffff); P.s(headR * 0.22, [0, hy + 0.05, headR * 1.12], COL.dark); }
  else if (K('alien')) { P.s(headR * 0.3, [-headR * 0.38, hy + 0.02, headR * 0.78], COL.dark, [1, 1.5, 0.5]); P.s(headR * 0.3, [headR * 0.38, hy + 0.02, headR * 0.78], COL.dark, [1, 1.5, 0.5]); P.seg([0, hy + headR, 0], [0, hy + headR + 0.25, 0], 0.015, skin); P.s(0.05, [0, hy + headR + 0.27, 0], 0xb8ff5a, null, { glow: true }); }
  else if (K('reaper')) { P.s(headR * 1.25, [0, hy + 0.05, -0.05], 0x1a1a22, [1, 1.1, 1]); P.s(headR * 0.75, [0, hy, headR * 0.45], 0xf2eee2); P.eyes(0.08, hy + 0.03, headR * 1.1, 0.045, COL.dark, 0xff3a3a, { glowPupil: true }); }
  else if (K('skeleton')) { P.eyes(0.09, hy + 0.04, headR * 0.82, 0.07, COL.dark, COL.dark); }
  else P.eyes(headR * 0.36, hy + 0.04, headR * 0.82, headR * 0.2, K('zombie', 'vampire', 'demon') ? 0xffffff : 0xffffff, K('vampire', 'devil') ? 0xc8101a : eye);
  if (K('elf', 'goblin', 'dryad', 'fairy', 'pixie')) { P.k(0.06, 0.22, [-headR, hy + 0.08, 0], skin, [0, 0, 1.2]); P.k(0.06, 0.22, [headR, hy + 0.08, 0], skin, [0, 0, -1.2]); }
  if (K('clown')) { P.s(0.07, [0, hy - 0.02, headR * 0.98], COL.red); P.s(0.16, [-0.24, hy + 0.15, 0], 0xff5ad8); P.s(0.16, [0.24, hy + 0.15, 0], 0x5ad8ff); }
  if (K('santa', 'dwarf', 'gnome', 'old man', 'wizard', 'odin', 'viking', 'caveman', 'beard', 'alchemist')) P.s(0.2, [0, hy - 0.18, headR * 0.55], K('dwarf', 'viking', 'caveman') ? 0xc8702a : 0xf4f4f4, [1.1, 1.3, 0.6]);
  if (K('medusa')) for (let i = 0; i < 7; i++) { const a = i * 0.9; P.seg([Math.cos(a) * 0.18, hy + 0.15, Math.sin(a) * 0.18 - 0.05], [Math.cos(a) * 0.38, hy + 0.32, Math.sin(a) * 0.38 - 0.1], 0.04, 0x4a9a4a); }
  // hats
  const hatY = hy + headR * 0.75;
  if (K('wizard', 'witch', 'warlock', 'sorcerer', 'gnome', 'necromancer', 'magician') && !K('magician')) { P.k(headR * 1.0, 0.65, [0, hatY + 0.3, 0], K('gnome') ? COL.red : dk(cloth, 0.05), [-0.12, 0, 0]); P.c(headR * 1.5, 0.04, [0, hatY - 0.02, 0], dk(cloth, 0.08)); if (!K('gnome', 'witch')) P.add(PG.star(5, 0.45, 0.2), COL.yellow, [0, hatY + 0.25, headR * 0.65], 0.08); }
  else if (K('magician', 'top hat')) { P.c(headR * 0.75, 0.38, [0, hatY + 0.18, 0], COL.dark); P.c(headR * 1.25, 0.04, [0, hatY, 0], COL.dark); P.c(headR * 0.77, 0.07, [0, hatY + 0.05, 0], COL.red); }
  else if (K('chef', 'baker')) { P.c(headR * 0.7, 0.32, [0, hatY + 0.16, 0], 0xffffff); P.s(headR * 0.85, [0, hatY + 0.36, 0], 0xffffff, [1, 0.6, 1]); }
  else if (K('cowboy', 'explorer', 'archaeologist', 'farmer', 'gardener')) { P.c(headR * 1.6, 0.04, [0, hatY, 0], K('farmer', 'gardener') ? 0xe8c060 : 0x8a5a2a); P.c(headR * 0.75, 0.22, [0, hatY + 0.1, 0], K('farmer', 'gardener') ? 0xe8c060 : 0x8a5a2a); }
  else if (K('pirate', 'captain')) { P.add(PG.cone(3), COL.dark, [0, hatY + 0.12, 0], [headR * 1.4, 0.25, headR * 1.4], [0, Math.PI / 6, 0]); if (K('pirate')) P.b(0.12, 0.09, 0.03, [0.1, hy + 0.05, headR * 0.95], COL.dark); }
  else if (K('police', 'pilot', 'sailor')) { P.c(headR * 0.95, 0.12, [0, hatY + 0.05, 0], K('sailor') ? 0xffffff : 0x1f2f6a); P.c(headR * 0.6, 0.02, [0, hatY - 0.02, headR * 0.5], COL.dark); }
  else if (K('firefighter', 'builder', 'engineer', 'miner')) { P.add(PG.hemi(), K('firefighter') ? COL.red : COL.yellow, [0, hatY - 0.05, 0], headR * 1.08); P.c(headR * 1.3, 0.03, [0, hatY - 0.05, 0], K('firefighter') ? COL.red : COL.yellow); if (K('miner')) P.s(0.06, [0, hatY + 0.1, headR], 0xfff6a0, null, { glow: true }); }
  else if (K('knight', 'soldier', 'samurai', 'gladiator', 'viking', 'warrior', 'skeleton warrior')) { P.add(PG.hemi(), K('samurai') ? 0x8a1a1a : COL.metal, [0, hatY - 0.08, 0], headR * 1.12); if (K('viking')) { P.k(0.05, 0.25, [-headR, hatY + 0.05, 0], 0xf0e8d8, [0, 0, 0.8]); P.k(0.05, 0.25, [headR, hatY + 0.05, 0], 0xf0e8d8, [0, 0, -0.8]); } if (K('gladiator', 'knight')) P.b(0.04, 0.2, headR * 1.6, [0, hatY + 0.18, 0], COL.red); }
  else if (K('astronaut')) { P.s(headR * 1.35, [0, hy, 0], 0x9ad8ff, null, { glow: false }); }
  else if (K('student', 'graduate')) { P.b(headR * 2, 0.04, headR * 2, [0, hatY + 0.08, 0], COL.dark); P.c(headR * 0.6, 0.1, [0, hatY + 0.02, 0], COL.dark); }
  else if (K('santa')) { P.k(headR * 0.95, 0.5, [0, hatY + 0.22, 0], COL.red, [0, 0, 0.3]); P.s(0.07, [0.15, hatY + 0.45, 0], 0xffffff); P.t(headR * 0.95, 0.05, [0, hatY, 0], 0xffffff, [Math.PI / 2, 0, 0]); }
  else if (K('ninja')) { P.t(headR * 1.0, 0.04, [0, hy + 0.08, 0], COL.red, [Math.PI / 2, 0, 0]); P.s(headR * 1.03, [0, hy - 0.05, 0.02], COL.dark, [1, 0.6, 1]); }
  else if (K('nurse')) P.b(0.25, 0.1, 0.15, [0, hatY + 0.02, 0.05], 0xffffff);
  else if (K('artist')) P.s(headR * 0.95, [0.05, hatY, 0], 0xc83a3a, [1.1, 0.25, 1.1]);
  else if (!K('alien', 'reaper', 'skeleton', 'mummy', 'zombie', 'statue', 'titan', 'golem', 'bald', 'monk')) {
    const hair = K('old', 'grandma', 'elder', 'professor') ? 0xd8d8e0 : K('vampire', 'witch', 'ninja') ? COL.dark : [0x3a2a1a, 0x7a4a2a, 0xd8a040, 0x1a1a1a, 0xb8502a][hashStr(I.id) % 5];
    P.s(headR * 1.04, [0, hy + 0.06, -0.04], hair, [1, 0.8, 1]);
    if (K('woman', 'princess', 'queen', 'grandma', 'nurse', 'mermaid', 'witch', 'goddess', 'muse', 'dryad', 'nymph', 'fairy', 'medusa')) P.s(headR * 0.85, [0, hy - 0.2, -0.15], hair, [1, 1.2, 0.6]);
  }
  // arms & legs
  if (K('skeleton', 'reaper') && !K('reaper')) { for (const s of [-1, 1]) { P.seg([s * 0.25, 0.2, 0], [s * 0.42, -0.35, 0.05], 0.035, skin); P.seg([s * 0.12, -0.35, 0], [s * 0.15, -1.0, 0.02], 0.04, skin); } return; }
  for (const s of [-1, 1]) {
    const ac = cloth === skin ? skin : lt(cloth, 0.04), sh = [s * 0.3, 0.15, 0], el = [s * 0.38, -0.11, 0.02], wr = [s * 0.42, -0.35, 0.1];
    P.s(0.085, sh, ac); P.seg(sh, el, 0.072, ac); P.s(0.066, el, ac); P.seg(el, wr, 0.056, ac);
    P.s(0.062, [s * 0.43, -0.41, 0.11], skin, [0.75, 1.15, 0.5]);                 // hand
    P.s(0.022, [s * 0.4, -0.38, 0.15], skin, [1, 1.6, 1]);                         // thumb
  }
  if (merTail) { P.seg([0, -0.4, 0], [0, -0.85, 0.05], 0.22, 0x3ac8b8, { cone: true, r2: 0.22 }); P.s(0.22, [0, -1.0, 0.1], 0x3ac8b8, [1.5, 0.3, 0.9]); }
  else if (genie) { P.s(0.25, [0, -0.6, 0], skin, [0.9, 1.4, 0.9]); P.s(0.15, [0.1, -0.95, 0.05], skin, [0.8, 1.2, 0.8]); }
  else if (!K('reaper', 'priest', 'monk', 'wizard', 'witch', 'warlock', 'sorcerer', 'necromancer', 'angel', 'archangel', 'goddess', 'princess', 'queen', 'santa', 'muse', 'odin')) {
    for (const s of [-1, 1]) {
      const lc = dk(cloth, 0.12), hip = [s * 0.13, -0.42, 0], kn = [s * 0.14, -0.69, 0.03], an = [s * 0.15, -0.95, 0.01];
      P.s(0.1, hip, lc); P.seg(hip, kn, 0.095, lc); P.s(0.085, kn, lc); P.seg(kn, an, 0.075, lc);
      P.b(0.13, 0.08, 0.26, [s * 0.15, -1.0, 0.06], COL.dark, null, { round: true });   // shoe
    }
  }
  // props
  if (K('reaper')) { P.c(0.025, 1.8, [0.45, -0.1, 0.1], COL.darkwood); P.add(PG.torus(0.08, Math.PI * 0.7), 0xc8ccd4, [0.6, 0.75, 0.1], 0.35, [0, 0, 1.2]); }
  if (K('wizard', 'sorcerer', 'necromancer', 'odin')) { P.c(0.025, 1.5, [-0.48, -0.2, 0.1], COL.darkwood); P.s(0.08, [-0.48, 0.58, 0.1], K('necromancer') ? 0x7aff5a : 0x7ac8ff, null, { glow: true }); }
  if (K('knight', 'warrior', 'gladiator', 'samurai', 'soldier', 'skeleton warrior')) { P.b(0.04, 0.8, 0.1, [0.5, 0.05, 0.15], COL.metal); P.b(0.2, 0.04, 0.05, [0.5, -0.32, 0.15], COL.gold); }
  if (K('poseidon')) { P.c(0.025, 1.5, [0.48, -0.1, 0.1], COL.gold); for (const d of [-0.1, 0, 0.1]) P.k(0.03, 0.2, [0.48 + d, 0.7, 0.1], COL.gold); }
  if (K('zeus', 'thor')) BUILD.boltParts(P, [0.55, 0.15, 0.1], 0.45, 0xfff36b);
  if (K('caveman')) P.seg([0.45, -0.35, 0.1], [0.55, 0.25, 0.2], 0.09, COL.wood, { cone: true, r2: 0.05 });
  if (K('angel', 'archangel', 'cupid', 'fairy', 'pixie')) {
    for (const s of [-1, 1]) { const sub = new Parts(I, P.rng), pv = new THREE.Vector3(s * 0.12, 0.2, -0.2); sub.s(0.42, [s * 0.4, 0.3, -0.28], K('fairy', 'pixie') ? 0xc8fff0 : 0xffffff, [1, 1.2, 0.12], { rot: [0, s * 0.3, s * -0.4] }); for (const p of sub.list) { p.anim = s < 0 ? 'wingL' : 'wingR'; p.pivot = pv; P.list.push(p); } }
  }
  if (K('devil', 'demon')) { P.k(0.05, 0.2, [-0.12, hy + headR * 0.9, 0], COL.dark, [0, 0, 0.3]); P.k(0.05, 0.2, [0.12, hy + headR * 0.9, 0], COL.dark, [0, 0, -0.3]); }
  if (K('avatar')) P.add(PG.cone(3), 0x5affd8, [0, hy + 0.1, headR * 0.95], [0.08, 0.2, 0.02], [0, 0, Math.PI], { glow: true });
};

BUILD.robot = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w);
  const c = I.color;
  const rocky = K('golem', 'elemental', 'titan', 'gargoyle');
  const eyeCol = K('ice') ? 0x8ae8ff : rocky ? 0xffb03a : 0x5affff;
  if (K('dog')) { P.b(1.0, 0.5, 0.6, [0, 0, 0], c, null, { round: true }); P.b(0.45, 0.4, 0.42, [0, 0.25, 0.6], c, null, { round: true }); for (const [x, z] of [[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]]) P.b(0.12, 0.55, 0.12, [x, -0.45, z], COL.steel); P.s(0.06, [-0.12, 0.3, 0.82], eyeCol, null, { glow: true }); P.s(0.06, [0.12, 0.3, 0.82], eyeCol, null, { glow: true }); P.c(0.02, 0.4, [0, 0.4, -0.45], COL.steel, [0.6, 0, 0]); return; }
  const bf = rocky ? (w, h, d, p) => P.add(displacedIco(0, hashStr(I.id + p.join()), 0.2, 1, true), shiftColor(c, 0, 0, (P.rng() - 0.5) * 0.1), p, [w * 0.6, h * 0.6, d * 0.6]) : (w, h, d, p) => P.b(w, h, d, p, c, null, { round: true });
  bf(0.85, 0.85, 0.6, [0, -0.05, 0]);
  bf(0.55, 0.45, 0.48, [0, 0.62, 0]);
  P.s(0.07, [-0.13, 0.66, 0.25], eyeCol, null, { glow: true }); P.s(0.07, [0.13, 0.66, 0.25], eyeCol, null, { glow: true });
  if (!rocky) { P.b(0.3, 0.05, 0.02, [0, 0.5, 0.25], COL.dark); P.c(0.015, 0.25, [0, 0.98, 0], COL.steel); P.s(0.05, [0, 1.12, 0], COL.red, null, { glow: true }); P.b(0.32, 0.22, 0.02, [0, 0.0, 0.31], 0x2a3a4a); P.s(0.04, [-0.06, 0.02, 0.33], 0x5aff8a, null, { glow: true }); P.s(0.04, [0.06, 0.02, 0.33], 0xffcf3a, null, { glow: true }); }
  for (const s of [-1, 1]) { bf(0.2, 0.62, 0.2, [s * 0.58, -0.05, 0]); bf(0.24, 0.55, 0.26, [s * 0.22, -0.78, 0]); }
  if (K('chef')) { P.c(0.22, 0.25, [0, 0.98, 0], 0xffffff); P.s(0.28, [0, 1.15, 0], 0xffffff, [1, 0.6, 1]); }
};

// ---- tools & weapons ---------------------------------------------------------
BUILD.tool = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  const handle = (len = 1.6, col = COL.wood, r = 0.07) => P.c(r, len, [0, -0.2, 0], col, null, { seg: 10 });
  if (K('telescope', 'microscope')) {
    if (K('microscope')) { P.b(0.8, 0.12, 0.6, [0, -0.85, 0], COL.dark); P.seg([0, -0.8, -0.2], [0, 0.1, -0.1], 0.08, COL.steel); P.seg([0, 0.0, 0.05], [0, 0.85, 0.2], 0.12, c); P.c(0.18, 0.06, [0, -0.35, 0.15], COL.dark); P.c(0.05, 0.2, [0, -0.15, 0.15], COL.steel); return; }
    P.seg([-0.7, -0.2, 0], [0.75, 0.45, 0], 0.17, c); P.seg([0.75, 0.45, 0], [0.95, 0.54, 0], 0.21, COL.gold); for (const a of [0, 2.1, 4.2]) P.seg([0, 0.12, 0], [Math.cos(a) * 0.5, -0.95, Math.sin(a) * 0.5], 0.03, COL.darkwood); return;
  }
  if (K('magnifying')) { P.t(0.42, 0.06, [0, 0.35, 0], COL.dark, [Math.PI / 2, 0, 0]); P.c(0.4, 0.03, [0, 0.35, 0], COL.glass, [Math.PI / 2, 0, 0]); P.seg([0, -0.08, 0], [0, -0.9, 0], 0.07, COL.darkwood); return; }
  if (K('torch')) { handle(1.4); P.f(0.18, 0.12, 0.25, [0, 0.55, 0], COL.darkwood); P.s(0.22, [0, 0.82, 0], 0xff8a2a, [1, 1.4, 1], { glow: true }); P.s(0.12, [0, 0.8, 0], 0xfff2a0, [1, 1.3, 1], { glow: true }); return; }
  if (K('flashlight', 'laser pointer', 'glowstick', 'lightning rod')) { P.c(K('glowstick') ? 0.08 : 0.13, 1.4, [0, 0, 0], c, [0, 0, 0]); if (!K('glowstick', 'rod')) { P.f(0.22, 0.14, 0.3, [0, 0.8, 0], c); P.c(0.2, 0.03, [0, 0.96, 0], 0xfff8c0, null, { glow: true }); } else if (K('glowstick')) P.c(0.07, 1.3, [0, 0, 0], c, null, { glow: true }); else P.k(0.08, 0.4, [0, 0.9, 0], COL.metal); return; }
  if (K('wand', 'scepter', 'staff')) { P.c(K('scepter') ? 0.05 : 0.035, 1.6, [0, -0.2, 0], K('scepter') ? COL.gold : 0x5a3a2a); if (K('scepter')) { P.s(0.16, [0, 0.68, 0], COL.red); P.t(0.12, 0.03, [0, 0.62, 0], COL.gold, [Math.PI / 2, 0, 0]); } else P.add(PG.star(5, 0.45, 0.2), COL.yellow, [0, 0.72, 0], 0.16, null, { glow: true }); return; }
  if (K('fishing')) { P.c(0.03, 2, [0, 0, 0], COL.darkwood, [0, 0, 0.3]); P.t(0.1, 0.03, [0.12, -0.6, 0.05], COL.dark); P.c(0.004, 1.2, [0.35, 0.3, 0], 0xffffff); P.s(0.06, [0.36, -0.32, 0], COL.red); return; }
  if (K('umbrella', 'parachute')) { BUILD.umbrella(P, I, kw); return; }
  if (K('bow') && !K('rainbow')) { P.t(0.85, 0.04, [0, 0, 0], c, [0, 0, Math.PI / 2 + 0.6], { arc: 1.9 }); P.c(0.006, 1.38, [-0.28, 0, 0], 0xf0f0f0); return; }
  if (K('slingshot')) { P.seg([0, -0.9, 0], [0, -0.1, 0], 0.07, c); P.seg([0, -0.1, 0], [-0.35, 0.5, 0], 0.06, c); P.seg([0, -0.1, 0], [0.35, 0.5, 0], 0.06, c); P.c(0.015, 0.75, [0, 0.42, 0], 0xc83a2a, [0, 0, Math.PI / 2]); return; }
  if (K('baseball bat', 'club')) { P.f(0.16, 0.06, 1.8, [0, 0, 0], c); return; }
  if (K('mace')) { handle(1.4, COL.darkwood); P.s(0.3, [0, 0.65, 0], COL.steel); for (let i = 0; i < 8; i++) { const a = i * 0.785; P.k(0.06, 0.2, [Math.cos(a) * 0.33, 0.65 + (i % 2 ? 0.1 : -0.1), Math.sin(a) * 0.33], COL.metal, [Math.sin(a) * 1.57, 0, -Math.cos(a) * 1.57]); } return; }
  if (K('paddle', 'racket')) { P.c(0.06, 1.0, [0, -0.5, 0], COL.wood); if (K('racket')) { P.t(0.42, 0.05, [0, 0.45, 0], c, null, { arc: Math.PI * 2 }); P.c(0.4, 0.01, [0, 0.45, 0], 0xf0f0e8, [Math.PI / 2, 0, 0]); } else P.s(0.4, [0, 0.4, 0], c, [0.9, 1.2, 0.12]); return; }
  if (K('pencil', ' pen', 'quill', 'syringe', 'brush', 'paintbrush', 'broom', 'mop', 'rake', 'screwdriver', 'chisel', 'microphone', 'pole', 'sign', 'bus stop', 'stethoscope', 'jetpack', 'gun', 'laser gun', 'shrink', 'freeze ray', 'drill', 'scale', 'air pump', 'mjolnir', 'hook')) {
    if (K('gun', 'shrink', 'freeze ray')) { P.b(0.9, 0.3, 0.22, [0, 0.2, 0], c, null, { round: true }); P.c(0.08, 0.6, [0.65, 0.22, 0], COL.dark, [0, 0, Math.PI / 2]); P.b(0.22, 0.5, 0.18, [-0.25, -0.2, 0], COL.dark, [0, 0, -0.25], { round: true }); if (K('laser', 'shrink', 'freeze')) { P.s(0.1, [0.98, 0.22, 0], K('freeze') ? 0x8ae8ff : 0x5aff8a, null, { glow: true }); P.t(0.12, 0.03, [0.4, 0.22, 0], 0x5affff, [0, Math.PI / 2, 0], { glow: true }); } return; }
    if (K('drill')) { P.b(0.7, 0.35, 0.3, [0, 0.25, 0], c, null, { round: true }); P.b(0.22, 0.55, 0.25, [-0.15, -0.2, 0], COL.dark, null, { round: true }); P.k(0.08, 0.6, [0.65, 0.25, 0], COL.metal, [0, 0, -Math.PI / 2]); return; }
    if (K('jetpack')) { P.b(0.7, 0.8, 0.35, [0, 0, 0], c, null, { round: true }); for (const x of [-0.22, 0.22]) { P.c(0.15, 0.9, [x, 0, -0.25], COL.metal); P.k(0.12, 0.3, [x, -0.6, -0.25], 0xff8a2a, [Math.PI, 0, 0], { glow: true }); } return; }
    if (K('scale')) { P.c(0.04, 1.3, [0, -0.2, 0], c); P.b(1.4, 0.05, 0.05, [0, 0.45, 0], c); for (const x of [-0.65, 0.65]) { P.seg([x, 0.45, 0], [x, 0.05, 0], 0.01, c); P.c(0.25, 0.04, [x, 0.03, 0], c); } P.c(0.35, 0.06, [0, -0.85, 0], c); return; }
    if (K('stethoscope')) { P.t(0.35, 0.04, [0, 0.3, 0], COL.dark, null, { arc: Math.PI * 1.2 }); P.seg([0, -0.05, 0], [0, -0.6, 0.1], 0.03, COL.dark); P.c(0.12, 0.05, [0, -0.65, 0.1], COL.metal); return; }
    if (K('microphone')) { P.c(0.08, 1.0, [0, -0.35, 0], COL.dark); P.s(0.22, [0, 0.35, 0], COL.steel); return; }
    if (K('pole', 'sign', 'bus stop')) { P.c(0.04, 1.8, [0, -0.1, 0], COL.steel); P.b(0.8, 0.5, 0.05, [0, 0.6, 0], K('bus') ? COL.blue : c, null, { round: true }); return; }
    if (K('hook')) { P.c(0.04, 0.8, [0, 0.35, 0], c); P.t(0.25, 0.04, [0.25, -0.05, 0], c, null, { arc: Math.PI * 1.2 }); return; }
    if (K('mjolnir')) { P.c(0.07, 1.0, [0, -0.35, 0], COL.darkwood); P.b(0.8, 0.45, 0.45, [0, 0.35, 0], COL.steel, null, { round: true }); return; }
    if (K('air pump')) { P.c(0.14, 1.0, [0, 0, 0], c); P.c(0.03, 0.4, [0, 0.7, 0], COL.dark); P.b(0.5, 0.06, 0.06, [0, 0.9, 0], COL.dark); P.b(0.5, 0.06, 0.25, [0, -0.52, 0], COL.dark); return; }
    // long thin tools
    P.c(K('broom', 'mop', 'rake') ? 0.045 : 0.07, 1.6, [0, -0.1, 0], K('pencil') ? COL.yellow : K('broom', 'mop', 'rake') ? COL.wood : c, null, { seg: K('pencil') ? 6 : 10 });
    if (K('pencil')) { P.k(0.07, 0.25, [0, -1.02, 0], 0xf0d0a0, [Math.PI, 0, 0], { seg: 6 }); P.c(0.07, 0.12, [0, 0.74, 0], 0xff8aa8); }
    else if (K('quill')) P.s(0.5, [0.05, 0.55, 0], 0xf8f8f8, [0.35, 1, 0.06], { rot: [0, 0, -0.15] });
    else if (K('broom')) P.f(0.12, 0.38, 0.55, [0, -1.1, 0], 0xd8b060);
    else if (K('mop')) for (let i = 0; i < 8; i++) P.c(0.03, 0.45, [Math.cos(i) * 0.12, -1.1, Math.sin(i) * 0.12], 0xf0f0e8);
    else if (K('rake')) { P.b(0.8, 0.06, 0.06, [0, -0.92, 0], COL.steel); for (let i = 0; i < 7; i++) P.c(0.015, 0.2, [-0.35 + i * 0.116, -1.02, 0.03], COL.steel); }
    else if (K('brush', 'paintbrush')) { P.f(0.12, 0.08, 0.3, [0, 0.82, 0], COL.metal); P.k(0.1, 0.35, [0, 1.1, 0], K('paint') ? c : 0x3a2a1a); }
    else if (K('syringe')) { P.c(0.12, 0.8, [0, 0.1, 0], COL.glass); P.c(0.01, 0.5, [0, -0.55, 0], COL.metal); }
    else if (K('screwdriver', 'chisel')) { P.c(0.12, 0.6, [0, 0.55, 0], K('screwdriver') ? COL.red : COL.wood); P.list[P.list.length - 2].color = COL.metal; }
    else P.k(0.06, 0.25, [0, -1.0, 0], COL.dark, [Math.PI, 0, 0]);
    return;
  }
  // hammer-type tools (handle + head)
  handle(1.6, K('wrench') ? COL.steel : COL.wood);
  if (K('axe', 'lumber')) { P.add(PG.cone(3), COL.metal, [0.3, 0.45, 0], [0.12, 0.6, 0.45], [0, Math.PI / 2, Math.PI / 2]); P.b(0.2, 0.3, 0.14, [0.02, 0.45, 0], COL.steel); }
  else if (K('pickaxe')) { P.t(0.55, 0.06, [0, 0.15, 0], COL.steel, [0, 0, Math.PI * 0.2], { arc: Math.PI * 0.6 }); }
  else if (K('shovel', 'spade')) { P.s(0.36, [0, 0.8, 0], COL.steel, [0.85, 1.1, 0.1]); P.b(0.32, 0.08, 0.08, [0, -1.0, 0], COL.dark); }
  else if (K('wrench')) { P.t(0.2, 0.08, [0, 0.72, 0], COL.steel, [0, 0, -Math.PI / 2], { arc: Math.PI * 1.4 }); }
  else if (K('saw')) { P.list.pop(); P.add(PG.cone(3), COL.metal, [0.2, 0.1, 0], [0.04, 1.5, 0.35], [0, 0, -Math.PI / 2]); P.b(0.3, 0.35, 0.12, [-0.75, 0.1, 0], COL.wood, null, { round: true }); }
  else if (K('scythe', 'sickle')) { P.t(0.5, 0.05, [-0.35, 0.6, 0], COL.metal, [0, 0, 0], { arc: Math.PI * 0.8 }); }
  else if (K('plow')) { P.add(PG.cone(3), COL.steel, [0, -0.9, 0.2], [0.3, 0.5, 0.15], [0.5, 0, 0]); }
  else P.b(0.7, 0.32, 0.32, [0, 0.62, 0], K('hammer') ? COL.steel : c, null, { round: true });
};

BUILD.blade = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w);
  const laser = K('laser', 'light');
  const bc = laser ? I.color : K('excalibur') ? 0xe8f4ff : K('sharp stick', 'arrow', 'spear') ? COL.metal : COL.metal;
  if (K('scissors')) { for (const s of [-1, 1]) { P.add(PG.cone(4), COL.metal, [s * 0.08, 0.45, 0], [0.08, 1.0, 0.02], [0, 0, s * 0.12]); P.t(0.18, 0.05, [s * 0.18, -0.25, 0], I.color, null); } P.s(0.04, [0, 0.0, 0.03], COL.dark); return; }
  if (K('spear', 'trident', 'sharp stick', 'arrow')) {
    P.c(0.04, 2.0, [0, -0.1, 0], K('trident') ? COL.gold : COL.wood);
    if (K('trident')) for (const d of [-0.16, 0, 0.16]) { P.k(0.05, 0.3, [d, 1.05, 0], COL.gold); P.c(0.025, 0.2, [d, 0.82, 0], COL.gold); }
    else P.add(PG.cone(4), K('sharp stick') ? COL.wood : COL.steel, [0, 1.05, 0], [0.09, 0.3, 0.04]);
    if (K('arrow')) { P.add(PG.cone(3), COL.red, [0, -0.95, 0], [0.12, 0.3, 0.01]); P.add(PG.cone(3), COL.red, [0, -0.95, 0], [0.01, 0.3, 0.12]); }
    if (K('trident')) P.b(0.4, 0.05, 0.05, [0, 0.72, 0], COL.gold);
    return;
  }
  if (K('scythe', 'sickle')) { P.c(0.04, 1.4, [0, -0.3, 0], COL.darkwood); P.t(0.45, 0.06, [-0.3, 0.5, 0], COL.metal, [0, 0, 0.3], { arc: Math.PI * 0.75 }); return; }
  const short = K('knife', 'dagger', 'scalpel', 'shuriken');
  const L = short ? 0.95 : 1.6;
  P.b(0.18, L, 0.035, [0, 0.12 + L / 2 - 0.25, 0], bc, null, { glow: laser });
  P.add(PG.cone(4), bc, [0, 0.12 + L - 0.25 + 0.12, 0], [0.13, 0.25, 0.025], [0, Math.PI / 4, 0], { glow: laser });
  if (laser) { P.c(0.08, 0.5, [0, -0.45, 0], COL.steel); P.c(0.1, 0.06, [0, -0.2, 0], COL.dark); return; }
  P.b(short ? 0.3 : 0.55, 0.07, 0.1, [0, -0.15, 0], K('excalibur', 'katana') ? COL.gold : COL.steel, null, { round: true });
  P.c(0.055, 0.42, [0, -0.4, 0], K('katana') ? COL.dark : 0x5a3a1a);
  P.s(0.08, [0, -0.64, 0], K('excalibur') ? 0x3a8aff : COL.gold, null, K('excalibur') ? { glow: true } : {});
};

// ---- buildings ---------------------------------------------------------------
BUILD.building = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  const win = (x, y, z, w = 0.16, h = 0.2, rotY = 0) => P.b(w, h, 0.03, [x, y, z], 0xfff2b0, [0, rotY, 0], { glow: true });
  if (K('skyscraper', 'city', 'metropolis', 'town', 'village', 'el dorado', 'kingdom', 'empire', 'civilization', 'rome')) {
    const towers = K('village') ? [[0, 0.5, 0.5], [-0.5, 0.4, 0.4], [0.5, 0.4, 0.4]] : [[0, 1.6, 0.4], [-0.5, 1.1, 0.35], [0.5, 1.25, 0.35], [-0.15, 0.8, 0.3], [0.3, 0.7, 0.3]];
    for (const [x, h, w] of towers) {
      if (K('village', 'town')) { P.b(w, h * 0.7, w, [x, -0.8 + h * 0.35, (P.rng() - 0.5) * 0.4], 0xf0e0d0); P.add(PG.cone(4), 0xc04a3a, [x, -0.8 + h * 0.7 + 0.15, 0], [w * 0.8, 0.3, w * 0.8], [0, Math.PI / 4, 0]); continue; }
      P.b(w, h, w, [x, -0.8 + h / 2, (x * 3) % 0.4 - 0.15], shiftColor(c, 0, 0, (P.rng() - 0.5) * 0.12));
      for (let j = 0; j < Math.floor(h / 0.22); j++) win(x, -0.68 + j * 0.22, (x * 3) % 0.4 - 0.15 + w / 2 + 0.01, w * 0.7, 0.08);
    }
    if (K('el dorado')) P.list.forEach(p => { if (!p.glow) p.color = COL.gold; });
    return;
  }
  if (K('pyramid')) { P.add(PG.cone(4), c, [0, 0, 0], [1.25, 1.6, 1.25], [0, Math.PI / 4, 0]); return; }
  if (K('igloo')) { P.add(PG.hemi(), c, [0, -0.6, 0], 1.0); P.add(PG.cyl(12), c, [0, -0.35, 0.85], [0.35, 0.6, 0.35], [Math.PI / 2, 0, 0]); P.s(0.25, [0, -0.45, 1.15], COL.dark, [1, 1, 0.2]); return; }
  if (K('tent', 'circus')) { P.add(PG.cone(K('circus') ? 12 : 4), c, [0, 0, 0], [1.1, 1.5, 1.1], [0, Math.PI / 4, 0], { colorFn: K('circus') ? (x, y, z) => (Math.atan2(z, x) * 6 / Math.PI & 1) ? 0xffffff : COL.red : null }); P.add(PG.cone(3), COL.dark, [0, -0.45, 0.6], [0.3, 0.6, 0.1]); if (K('circus')) P.add(PG.cone(3), COL.yellow, [0, 0.85, 0], [0.05, 0.2, 0.15]); return; }
  if (K('hut', 'cabin', 'barn', 'treehouse')) {
    const wall = K('barn') ? 0xb0302a : K('cabin') ? COL.darkwood : 0xc8a060;
    if (K('treehouse')) { P.c(0.15, 1.2, [0, -0.6, 0], COL.wood); }
    const y0 = K('treehouse') ? 0.2 : -0.45;
    if (K('hut')) { P.c(0.75, 0.75, [0, y0, 0], wall); P.k(1.0, 0.75, [0, y0 + 0.75, 0], 0xd8b060); }
    else { P.b(1.4, 0.9, 1.0, [0, y0, 0], wall); P.add(PG.cyl(3), K('barn') ? 0x5a3a3a : 0x7a4a2a, [0, y0 + 0.65, 0], [0.62, 1.45, 0.62], [0, 0, Math.PI / 2]); }
    P.b(0.32, 0.5, 0.04, [0, y0 - 0.2, 0.51], COL.darkwood);
    if (K('barn')) { P.b(0.04, 0.5, 0.05, [0, y0 - 0.2, 0.53], 0xffffff, [0, 0, 0.6]); P.b(0.04, 0.5, 0.05, [0, y0 - 0.2, 0.53], 0xffffff, [0, 0, -0.6]); }
    if (K('treehouse')) { for (let i = 0; i < 4; i++) P.s(0.45, [(P.rng() - 0.5) * 1.2, 1.1 + P.rng() * 0.3, (P.rng() - 0.5) * 0.9], COL.leaf); }
    return;
  }
  if (K('castle', 'palace', 'sandcastle', 'cloud castle', 'valhalla', 'kingdom')) {
    const wc = K('palace') ? 0xf8f0e0 : c;
    P.b(1.3, 0.8, 1.0, [0, -0.4, 0], wc);
    for (const [x, z] of [[-0.7, -0.55], [0.7, -0.55], [-0.7, 0.55], [0.7, 0.55]]) { P.c(0.25, 1.25, [x, -0.2, z], wc, null, { seg: 12 }); if (K('palace')) P.s(0.28, [x, 0.55, z], COL.gold); else P.k(0.32, 0.45, [x, 0.65, z], K('sandcastle') ? lt(c, 0.05) : 0x5a6ad8, null, { seg: 12 }); }
    for (let i = 0; i < 5; i++) P.b(0.16, 0.16, 0.16, [-0.5 + i * 0.25, 0.08, 0.5], wc);
    P.add(PG.cyl(16), COL.darkwood, [0, -0.55, 0.51], [0.2, 0.02, 0.3], [Math.PI / 2, 0, 0]);
    if (K('cloud')) for (let i = 0; i < 6; i++) P.s(0.35, [(P.rng() - 0.5) * 1.6, -0.9, (P.rng() - 0.5) * 1.2], 0xffffff);
    return;
  }
  if (K('tower', 'lighthouse', 'tesla', 'observatory', 'space station')) {
    if (K('space station')) { P.c(0.25, 1.6, [0, 0, 0], COL.metal, [0, 0, Math.PI / 2]); P.t(0.6, 0.08, [0, 0, 0], COL.metal, [0, Math.PI / 2, 0]); for (const x of [-0.95, 0.95]) P.b(0.05, 0.9, 0.5, [x, 0, 0], 0x2a4a8a, null, { glow: false }); return; }
    if (K('observatory')) { P.c(0.75, 0.7, [0, -0.6, 0], c); P.add(PG.hemi(), 0xf0f0f4, [0, -0.25, 0], 0.75); P.seg([0, 0.1, 0], [0.4, 0.75, 0], 0.12, COL.dark); return; }
    const stripes = K('lighthouse');
    P.f(0.3, 0.45, 1.8, [0, -0.1, 0], c, null, { colorFn: stripes ? (x, y) => ((y + 0.5) * 4 | 0) % 2 ? 0xffffff : COL.red : null });
    P.c(0.36, 0.3, [0, 0.95, 0], K('tesla') ? COL.metal : 0x3a3a44); P.s(0.22, [0, 0.95, 0], K('tesla') ? 0xc8a8ff : 0xfff2a0, null, { glow: true }); P.k(0.38, 0.35, [0, 1.28, 0], K('tesla') ? COL.metal : COL.red);
    return;
  }
  if (K('church', 'temple', 'museum', 'bank', 'school', 'library', 'hospital', 'colosseum', 'arena', 'stadium', 'courthouse', 'hotel', 'theater', 'laboratory', 'monument', 'stonehenge', 'ruins', 'atlantis', 'olympus')) {
    if (K('colosseum', 'arena', 'stadium')) { P.add(PG.tube(24), c, [0, -0.3, 0], [1.0, 0.9, 1.0]); P.add(PG.tube(24), dk(c, 0.06), [0, -0.3, 0], [0.92, 0.88, 0.92]); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; P.b(0.1, 0.2, 0.05, [Math.cos(a) * 1.01, -0.15, Math.sin(a) * 1.01], COL.dark, [0, -a + Math.PI / 2, 0]); } P.c(0.85, 0.05, [0, -0.72, 0], K('stadium') ? COL.green : COL.sand); return; }
    if (K('stonehenge', 'ruins')) { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; P.b(0.22, 0.8 - (K('ruins') ? P.rng() * 0.4 : 0), 0.15, [Math.cos(a) * 0.7, -0.4, Math.sin(a) * 0.7], c, [0, -a, 0]); } if (K('stonehenge')) P.b(0.8, 0.14, 0.18, [0.6, 0.05, 0.35], c, [0, -0.5, 0]); return; }
    P.b(1.5, 0.15, 1.0, [0, -0.85, 0], lt(c, 0.06));
    if (K('church')) { P.b(1.0, 0.9, 0.8, [0, -0.35, 0], c); P.add(PG.cyl(3), 0x7a4a3a, [0, 0.25, 0], [0.48, 1.05, 0.48], [0, 0, Math.PI / 2]); P.b(0.35, 0.8, 0.35, [0.0, 0.5, 0.25], c); P.k(0.28, 0.5, [0, 1.15, 0.25], 0x7a4a3a, null, { seg: 4 }); P.b(0.04, 0.25, 0.04, [0, 1.5, 0.25], COL.gold); P.b(0.15, 0.04, 0.04, [0, 1.52, 0.25], COL.gold); return; }
    for (let i = 0; i < 5; i++) P.c(0.07, 0.9, [-0.56 + i * 0.28, -0.32, 0.38], lt(c, 0.08), null, { seg: 10 });
    P.b(1.3, 0.85, 0.6, [0, -0.35, -0.1], c);
    P.add(PG.cyl(3), dk(c, 0.04), [0, 0.22, 0.05], [0.38, 1.45, 0.38], [0, 0, Math.PI / 2]);
    if (K('hospital')) { P.b(0.3, 0.08, 0.02, [0, 0.0, 0.21], COL.red); P.b(0.08, 0.3, 0.02, [0, 0.0, 0.21], COL.red); }
    if (K('bank')) P.add(PG.cyl(16), COL.gold, [0, 0.25, 0.3], [0.12, 0.03, 0.12], [Math.PI / 2, 0, 0]);
    if (K('atlantis', 'olympus')) P.s(0.22, [0, 0.55, 0], K('atlantis') ? 0x3ad8d0 : 0xfff2a0, null, { glow: true });
    return;
  }
  if (K('factory', 'kiln', 'furnace', 'forge', 'mill', 'windmill', 'engine room', 'nuclear')) {
    if (K('windmill')) { P.f(0.4, 0.6, 1.6, [0, -0.2, 0], c); P.k(0.45, 0.4, [0, 0.8, 0], COL.darkwood); const pv = new THREE.Vector3(0, 0.55, 0.45); const sub = new Parts(I, P.rng); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; sub.b(0.18, 0.95, 0.03, [Math.cos(a) * 0.48, 0.55 + Math.sin(a) * 0.48, 0.48], 0xf0e8e0, [0, 0, a - Math.PI / 2]); } for (const p of sub.list) { p.anim = 'spinZ'; p.pivot = pv; P.list.push(p); } return; }
    if (K('nuclear')) { P.add(PG.lathe('cool', [[0.7, -1], [0.5, -0.2], [0.42, 0.4], [0.5, 0.9], [0.48, 0.9], [0.4, 0.4], [0.48, -0.2], [0.68, -1]]), c, [0, 0, 0], 1); P.s(0.2, [0, 0.95, 0], 0xf0f0f0, [1.5, 0.6, 1.5]); return; }
    P.b(1.4, 0.8, 0.9, [0, -0.5, 0], c);
    for (let i = 0; i < 3; i++) P.add(PG.cyl(3), dk(c, 0.06), [-0.45 + i * 0.45, 0.05, 0], [0.25, 0.9, 0.25], [0, 0, Math.PI / 2]);
    P.c(0.13, 0.9, [0.45, 0.4, -0.25], 0x8a8a94); P.c(0.13, 0.7, [0.1, 0.3, -0.25], 0x8a8a94);
    if (K('forge', 'kiln', 'furnace')) P.b(0.4, 0.3, 0.02, [0, -0.55, 0.46], 0xff7a2a, null, { glow: true });
    return;
  }
  if (K('bridge')) { P.t(0.9, 0.1, [0, -0.5, 0], c, null, { arc: Math.PI }); P.b(2.0, 0.1, 0.5, [0, 0.42, 0], c); return; }
  if (K('well')) { P.add(PG.tube(16), COL.grey, [0, -0.6, 0], [0.6, 0.6, 0.6]); P.c(0.55, 0.05, [0, -0.32, 0], 0x3a7ad8); P.c(0.04, 1.0, [-0.55, 0.1, 0], COL.wood); P.c(0.04, 1.0, [0.55, 0.1, 0], COL.wood); P.add(PG.cyl(3), 0xb04a3a, [0, 0.75, 0], [0.4, 1.4, 0.4], [0, 0, Math.PI / 2]); return; }
  if (K('fountain')) { P.c(0.9, 0.25, [0, -0.85, 0], COL.grey); P.c(0.8, 0.05, [0, -0.72, 0], 0x5ab8ff); P.c(0.1, 0.8, [0, -0.35, 0], COL.grey); P.c(0.4, 0.1, [0, 0.05, 0], COL.grey); P.s(0.25, [0, 0.25, 0], 0x8ad8ff, [1, 1.6, 1], { glow: true }); return; }
  if (K('dam', 'prison', 'zoo', 'aquarium', 'park', 'airport', 'harbor', 'train station', 'shop', 'market', 'restaurant', 'kitchen', 'gym', 'arcade', 'beehive', 'moon base', 'smart home', 'haunted', 'house', 'home', 'igloo village')) {
    if (K('beehive')) { for (let i = 0; i < 4; i++) P.t(0.5 - Math.abs(i - 1.5) * 0.12, 0.22, [0, -0.6 + i * 0.33, 0], c, [Math.PI / 2, 0, 0]); P.s(0.12, [0, -0.35, 0.45], COL.dark); return; }
    if (K('moon base')) { P.add(PG.hemi(), c, [0, -0.6, 0], 0.9); P.add(PG.hemi(), c, [0.9, -0.6, 0.3], 0.45); P.seg([0, 0.25, 0], [0, 0.8, 0], 0.02, COL.steel); P.add(PG.bowl(), COL.metal, [0, 0.85, 0], 0.25, [0.5, 0, 0]); return; }
    if (K('aquarium')) { P.b(1.4, 0.9, 0.8, [0, -0.2, 0], 0x6ad0ff, null, { glow: false }); P.b(1.45, 0.08, 0.85, [0, 0.27, 0], COL.dark); P.b(1.45, 0.12, 0.85, [0, -0.68, 0], COL.dark); P.s(0.1, [0.2, -0.1, 0], COL.orange, [1.4, 1, 0.5]); return; }
    // houses & generic buildings
    const wall = K('haunted') ? 0x5a4a6a : K('prison') ? 0x9a9aa4 : lt(c, 0.25);
    P.b(1.3, 0.95, 1.0, [0, -0.45, 0], wall);
    P.add(PG.cone(4), K('haunted') ? 0x2a2030 : dk(c, 0.15), [0, 0.38, 0], [1.08, 0.72, 0.85], [0, Math.PI / 4, 0]);
    P.b(0.3, 0.5, 0.04, [0, -0.67, 0.51], COL.darkwood);
    win(-0.38, -0.35, 0.51); win(0.38, -0.35, 0.51);
    P.b(0.18, 0.45, 0.18, [0.38, 0.45, -0.15], 0x9a5a3a);
    if (K('shop', 'market', 'restaurant')) for (let i = 0; i < 6; i++) P.b(0.22, 0.05, 0.3, [-0.55 + i * 0.22, -0.05, 0.62], i % 2 ? 0xffffff : COL.red, [0.4, 0, 0]);
    if (K('prison')) for (let i = 0; i < 4; i++) P.c(0.015, 0.25, [-0.47 + i * 0.06, -0.35, 0.53], COL.dark);
    if (K('smart home')) P.s(0.08, [0, 0.0, 0.52], 0x5ab8ff, null, { glow: true });
    return;
  }
  // default: little house
  P.b(1.2, 0.9, 1.0, [0, -0.45, 0], lt(c, 0.2)); P.add(PG.cone(4), dk(c, 0.1), [0, 0.35, 0], [1.0, 0.7, 0.85], [0, Math.PI / 4, 0]); P.b(0.3, 0.45, 0.04, [0, -0.67, 0.51], COL.darkwood); win(-0.35, -0.35, 0.51); win(0.35, -0.35, 0.51);
};

// ---- vehicles ---------------------------------------------------------------
BUILD.wheels = (P, pts, r = 0.22, w = 0.16, col = COL.dark) => { for (const [x, y, z] of pts) { P.c(r, w, [x, y, z], col, [0, 0, Math.PI / 2], { seg: 14 }); P.c(r * 0.5, w + 0.02, [x, y, z], COL.metal, [0, 0, Math.PI / 2], { seg: 10 }); } };
BUILD.vehicle = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('bicycle', 'motorcycle')) { for (const z of [-0.55, 0.55]) P.t(0.35, 0.08, [0, -0.35, z], COL.dark, [0, Math.PI / 2, 0]); P.seg([0, -0.35, -0.55], [0, 0.15, 0.05], 0.04, c); P.seg([0, 0.15, 0.05], [0, -0.35, 0.55], 0.04, c); P.seg([0, 0.15, 0.05], [0, 0.35, 0.45], 0.04, c); P.b(0.5, 0.04, 0.04, [0, 0.38, 0.45], COL.dark); P.b(0.16, 0.06, 0.3, [0, 0.22, -0.2], COL.dark); if (K('motorcycle')) P.b(0.3, 0.3, 0.5, [0, -0.05, 0], c, null, { round: true }); return; }
  if (K('skateboard', 'snowboard', 'sled', 'surfboard')) { P.b(0.45, 0.06, 1.6, [0, 0, 0], c, null, { round: true }); if (K('skate')) BUILD.wheels(P, [[0.15, -0.12, 0.55], [-0.15, -0.12, 0.55], [0.15, -0.12, -0.55], [-0.15, -0.12, -0.55]], 0.08, 0.06, 0xf8f8f8); if (K('sled')) for (const x of [-0.2, 0.2]) P.t(0.55, 0.03, [x, 0, 0.2], COL.metal, [0, Math.PI / 2, 0], { arc: Math.PI * 0.6 }); return; }
  if (K('tank')) { P.b(1.1, 0.35, 1.5, [0, -0.3, 0], c, null, { round: true }); for (const x of [-0.62, 0.62]) P.add(PG.capsule(), COL.dark, [x, -0.45, 0], [0.32, 1.25, 0.32], [Math.PI / 2, 0, 0]); P.b(0.7, 0.3, 0.7, [0, 0.05, -0.05], dk(c, 0.04), null, { round: true }); P.c(0.07, 0.9, [0, 0.08, 0.7], dk(c, 0.1), [Math.PI / 2, 0, 0]); return; }
  if (K('train', 'locomotive', 'magnet train', 'bullet train')) {
    if (K('bullet', 'magnet')) { P.add(PG.capsule(), c, [0, -0.1, 0], [0.7, 1.4, 0.65], [Math.PI / 2, 0, 0]); P.b(0.5, 0.12, 0.3, [0, 0.08, 0.85], 0x2a3a5a); P.b(0.75, 0.06, 2.0, [0, -0.25, 0], COL.blue); return; }
    P.c(0.38, 1.0, [0, 0.0, 0.2], c, [Math.PI / 2, 0, 0]); P.b(0.8, 0.8, 0.6, [0, 0.12, -0.45], dk(c, 0.04)); P.c(0.12, 0.35, [0, 0.5, 0.45], COL.dark); P.b(0.9, 0.15, 1.6, [0, -0.38, 0], COL.dark);
    BUILD.wheels(P, [[0.42, -0.5, 0.5], [-0.42, -0.5, 0.5], [0.42, -0.5, -0.0], [-0.42, -0.5, 0], [0.42, -0.5, -0.5], [-0.42, -0.5, -0.5]], 0.2, 0.08, COL.red); return;
  }
  if (K('cart', 'wagon', 'chariot')) { P.b(1.0, 0.45, 1.2, [0, -0.05, 0], c, null, { round: true }); P.b(0.9, 0.05, 1.1, [0, 0.18, 0], dk(c, 0.1)); BUILD.wheels(P, [[0.55, -0.35, 0.35], [-0.55, -0.35, 0.35], [0.55, -0.35, -0.35], [-0.55, -0.35, -0.35]], 0.3, 0.08, COL.darkwood); if (K('wagon')) P.add(PG.hemi(), 0xf8f4ea, [0, 0.2, 0], [0.55, 0.6, 0.65]); P.seg([0, -0.1, 0.6], [0, -0.2, 1.2], 0.03, COL.wood); return; }
  // cars & trucks
  const long = K('truck', 'bus', 'ambulance', 'fire truck', 'tractor');
  const L = K('bus') ? 2.0 : long ? 1.7 : 1.5, H = K('bus') ? 0.75 : 0.4;
  P.b(0.95, H, L, [0, -0.15 + (H - 0.4) / 2, 0], c, null, { round: true });
  if (!K('bus')) P.b(0.85, 0.38, K('race') ? 0.5 : L * 0.45, [0, 0.2, K('truck', 'fire truck', 'tractor') ? L * 0.25 : -0.05], K('police') ? 0xffffff : lt(c, 0.05), null, { round: true });
  const glass = 0x2a3a5a;
  if (K('bus')) for (let i = 0; i < 5; i++) { P.b(0.97, 0.25, 0.28, [0, 0.18, -0.75 + i * 0.37], glass); }
  else { P.b(0.87, 0.24, 0.05, [0, 0.22, (K('truck', 'fire truck', 'tractor') ? L * 0.25 : -0.05) + (K('race') ? 0.26 : L * 0.225)], glass); P.b(0.88, 0.2, 0.3, [0, 0.22, K('truck', 'fire truck', 'tractor') ? L * 0.25 : -0.05], glass); }
  if (K('truck', 'fire truck')) P.b(0.95, 0.65, L * 0.55, [0, 0.05, -L * 0.2], K('fire') ? COL.red : 0xf0f0f0, null, { round: true });
  if (K('ambulance', 'police', 'fire truck')) { P.b(0.5, 0.08, 0.15, [0, 0.43, 0.05], COL.red, null, { glow: true }); P.b(0.25, 0.08, 0.15, [0.12, 0.43, 0.05], COL.blue, null, { glow: true }); }
  if (K('race')) P.b(0.95, 0.05, 0.25, [0, 0.25, -L / 2 + 0.05], COL.dark);
  for (const x of [-0.3, 0.3]) P.s(0.07, [x, -0.05, L / 2 + 0.01], 0xfff6c0, [1, 0.8, 0.3], { glow: true });
  const wr = K('tractor') ? 0.3 : 0.22, cz = K('truck', 'fire truck', 'tractor') ? L * 0.25 : -0.05, cl = K('race') ? 0.5 : L * 0.45;
  for (const z of [L * 0.32, -L * 0.32]) for (const x of [-0.477, 0.477]) P.c(wr + 0.05, 0.012, [x, -0.33, z], 0x111116, [0, 0, Math.PI / 2], { seg: 18 });
  for (const z of [1, -1]) P.b(1.0, 0.11, 0.1, [0, -0.29, z * (L / 2 + 0.02)], 0x2a2a30, null, { round: true });
  P.b(0.42, 0.1, 0.03, [0, -0.13, L / 2 + 0.015], 0x1a1a20);
  for (const x of [-0.33, 0.33]) P.b(0.16, 0.07, 0.03, [x, -0.06, -L / 2 - 0.015], COL.red, null, { glow: true });
  if (!K('bus')) {
    P.b(0.89, 0.18, cl * 0.82, [0, 0.23, cz], glass);
    for (const s of [-1, 1]) P.s(0.055, [s * 0.5, 0.12, cz + cl * 0.5], c, [0.7, 0.8, 1]);
    P.b(0.965, 0.28, 0.012, [0, -0.1, cz], dk(c, 0.18));
    for (const s of [-1, 1]) P.b(0.08, 0.025, 0.012, [s * 0.485, -0.02, cz + 0.12], 0xc8c8d0);
  }
  BUILD.wheels(P, [[0.5, -0.35, L * 0.32], [-0.5, -0.35, L * 0.32], [0.5, -0.35 + (K('tractor') ? 0.1 : 0), -L * 0.32], [-0.5, -0.35 + (K('tractor') ? 0.1 : 0), -L * 0.32]], wr, 0.16);
};

BUILD.plane = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('ufo')) { P.s(1, [0, 0, 0], c, [1.1, 0.22, 1.1]); P.add(PG.hemi(), 0x9ae8ff, [0, 0.1, 0], [0.45, 0.4, 0.45]); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; P.s(0.07, [Math.cos(a) * 0.85, -0.05, Math.sin(a) * 0.85], 0x5aff8a, null, { glow: true }); } P.add(PG.cone(16), 0xb8ffb0, [0, -0.6, 0], [0.4, 0.7, 0.4], null, { glow: true }); return; }
  if (K('balloon')) { P.s(0.85, [0, 0.35, 0], c, [1, 1.1, 1], { colorFn: (x, y, z) => (Math.atan2(z, x) * 4 / Math.PI & 1) ? c : COL.yellow }); P.b(0.42, 0.3, 0.42, [0, -0.85, 0], 0xb08850, null, { round: true }); for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) P.seg([x, -0.7, z], [x * 2.2, -0.3, z * 2.2], 0.008, COL.dark); return; }
  if (K('paper plane')) { P.add(PG.cone(3), 0xf8f8f8, [0, 0, 0], [0.7, 1.6, 0.06], [Math.PI / 2, 0, 0]); P.add(PG.cone(3), 0xe8e8e8, [0, -0.05, 0], [0.06, 1.6, 0.25], [Math.PI / 2, 0, 0]); return; }
  if (K('drone')) { P.b(0.5, 0.18, 0.5, [0, 0, 0], c, null, { round: true }); for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) { P.seg([0, 0, 0], [x, 0.05, z], 0.03, COL.dark); P.c(0.3, 0.02, [x, 0.1, z], 0xd8e0e8); } P.s(0.06, [0, -0.08, 0.26], COL.red, null, { glow: true }); return; }
  P.add(PG.capsule(), c, [0, 0, 0], [0.42, 1.5, 0.42], [Math.PI / 2, 0, 0]);
  P.b(0.85, 0.15, 0.08, [0, 0.12, 0.7], 0x2a3a5a, null, { round: true });
  if (K('helicopter')) {
    P.c(0.05, 0.9, [0, 0, -0.9], c, [Math.PI / 2, 0, 0]); P.c(0.02, 0.2, [0, 0.32, 0], COL.dark);
    const sub = new Parts(I, P.rng), pv = new THREE.Vector3(0, 0.42, 0);
    sub.b(2.0, 0.02, 0.12, [0, 0.42, 0], COL.dark); sub.b(0.12, 0.02, 2.0, [0, 0.42, 0], COL.dark);
    for (const p of sub.list) { p.anim = 'spinY'; p.pivot = pv; P.list.push(p); }
    for (const x of [-0.3, 0.3]) P.b(0.04, 0.04, 1.0, [x, -0.42, 0], COL.dark);
    return;
  }
  P.b(2.0, 0.07, 0.42, [0, 0, 0.05], dk(c, 0.04), null, { round: true });
  P.b(0.75, 0.05, 0.22, [0, 0.05, -0.82], dk(c, 0.04));
  P.add(PG.cone(3), dk(c, 0.04), [0, 0.3, -0.82], [0.05, 0.45, 0.3]);
  for (const x of [-0.5, 0.5]) P.c(0.08, 0.3, [x, -0.1, 0.12], COL.metal, [Math.PI / 2, 0, 0]);
};

BUILD.boat = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('submarine')) { P.add(PG.capsule(), c, [0, 0, 0], [0.62, 1.4, 0.62], [Math.PI / 2, 0, 0]); P.b(0.3, 0.35, 0.5, [0, 0.42, 0.05], c, null, { round: true }); P.c(0.03, 0.3, [0, 0.72, 0.15], COL.dark); for (const z of [-0.3, 0, 0.3]) P.c(0.08, 0.02, [0.31, 0.05, z], 0x9ae8ff, [0, 0, Math.PI / 2], { glow: true }); P.add(PG.cone(3), dk(c, 0.1), [0, 0, -0.95], [0.3, 0.3, 0.05], [Math.PI / 2, 0, 0]); return; }
  if (K('raft')) { for (let i = 0; i < 5; i++) P.c(0.12, 1.5, [(i - 2) * 0.25, 0, 0], COL.wood, [Math.PI / 2, 0, 0]); P.c(0.03, 1.0, [0, 0.5, 0], COL.darkwood); P.b(0.5, 0.5, 0.02, [0.25, 0.65, 0], 0xf0f0e8); return; }
  const hullCol = K('pirate') ? 0x3a2a2a : K('yacht') ? 0xffffff : K('viking') ? 0x8a5a2a : c;
  P.add(PG.frustum(0.65, 4), hullCol, [0, -0.3, 0], [0.75, 0.42, 1.25], [Math.PI, Math.PI / 4, 0]);
  P.b(0.95, 0.06, 1.6, [0, -0.1, 0], dk(hullCol, 0.05));
  if (K('canoe')) return;
  if (K('ship', 'yacht')) { P.b(0.6, 0.35, 0.7, [0, 0.12, -0.1], 0xffffff, null, { round: true }); P.b(0.62, 0.08, 0.72, [0, 0.12, -0.1], 0x2a3a5a); if (!K('pirate', 'yacht')) { P.c(0.12, 0.45, [0, 0.5, -0.2], COL.red); } }
  if (K('sail', 'pirate', 'viking') || !K('ship', 'yacht')) {
    P.c(0.03, 1.5, [0, 0.55, 0], COL.darkwood);
    P.add(PG.cone(3), K('pirate') ? 0x2a2a2a : K('viking') ? 0xe83a3a : 0xf8f8f8, [0.0, 0.6, 0.25], [0.05, 1.1, 0.55], [0, Math.PI / 2, 0], { colorFn: K('viking') ? (x, y, z) => ((z * 6 | 0) % 2 ? 0xffffff : COL.red) : null });
    if (K('pirate')) { P.b(0.3, 0.2, 0.02, [0, 1.32, 0], COL.dark); P.s(0.05, [0, 1.32, 0.02], 0xffffff); }
  }
  if (K('viking')) { P.seg([0, -0.1, 0.8], [0, 0.4, 1.0], 0.06, 0x8a5a2a); P.s(0.1, [0, 0.45, 1.05], 0x8a5a2a); }
};

BUILD.rocket = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  const thin = K('firework');
  P.c(thin ? 0.18 : 0.33, 1.2, [0, 0, 0], thin ? c : 0xf4f4f8);
  P.k(thin ? 0.2 : 0.33, 0.55, [0, 0.88, 0], c);
  if (!thin) { P.c(0.12, 0.05, [0, 0.25, 0.32], 0x5ab8ff, [Math.PI / 2, 0, 0], { glow: true }); P.t(0.12, 0.025, [0, 0.25, 0.33], COL.metal); }
  for (let i = 0; i < (thin ? 0 : 3); i++) { const a = i / 3 * 6.28; P.add(PG.cone(3), c, [Math.cos(a) * 0.38, -0.45, Math.sin(a) * 0.38], [0.04, 0.5, 0.25], [0, -a, 0]); }
  if (thin) { P.c(0.015, 0.7, [0, -0.9, 0], COL.wood); P.c(0.01, 0.15, [0, 1.2, 0], COL.dark); }
  else { P.f(0.22, 0.3, 0.2, [0, -0.7, 0], COL.dark); P.k(0.22, 0.5, [0, -1.0, 0], 0xff9a3a, [Math.PI, 0, 0], { glow: true }); }
  if (K('spaceship', 'rocket ship')) P.b(1.4, 0.05, 0.4, [0, -0.2, 0], c, null, { round: true });
};

// ---- machines & devices -------------------------------------------------------
BUILD.machine = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  const screen = (x, y, z, w, h, col = 0x5ab8ff) => { P.b(w, h, 0.03, [x, y, z], col, null, { glow: true }); };
  if (K('computer', 'arcade', 'television', ' tv', 'server', 'game console', 'quantum')) {
    if (K('arcade')) { P.b(0.8, 1.7, 0.7, [0, 0, 0], c, null, { round: true }); screen(0, 0.4, 0.36, 0.55, 0.45, 0xff5ad8); P.b(0.75, 0.12, 0.35, [0, -0.05, 0.42], COL.dark); P.c(0.03, 0.12, [-0.15, 0.05, 0.45], COL.dark); P.s(0.05, [-0.15, 0.13, 0.45], COL.red); return; }
    if (K('server')) { P.b(0.9, 1.6, 0.8, [0, 0, 0], COL.dark, null, { round: true }); for (let i = 0; i < 6; i++) { P.b(0.8, 0.05, 0.02, [0, -0.6 + i * 0.24, 0.41], 0x3a3a44); P.s(0.025, [0.32, -0.6 + i * 0.24, 0.42], i % 2 ? 0x5aff8a : 0x5ab8ff, null, { glow: true }); } return; }
    if (K('quantum')) { for (let i = 0; i < 4; i++) P.c(0.55 - i * 0.12, 0.08, [0, 0.6 - i * 0.35, 0], COL.gold); for (let i = 0; i < 6; i++) P.c(0.02, 1.4, [Math.cos(i) * 0.3, 0.1, Math.sin(i) * 0.3], COL.gold); P.s(0.12, [0, -0.6, 0], 0x9a7aff, null, { glow: true }); return; }
    P.b(1.3, 0.9, 0.12, [0, 0.25, 0], COL.dark, null, { round: true });
    screen(0, 0.25, 0.07, 1.15, 0.75, K('television', ' tv') ? 0x7ac8ff : 0x5affb0);
    P.c(0.08, 0.35, [0, -0.35, -0.05], COL.dark); P.b(0.6, 0.05, 0.35, [0, -0.52, 0], COL.dark);
    if (K('computer')) P.b(1.0, 0.05, 0.35, [0, -0.5, 0.45], 0xd8d8dc);
    return;
  }
  if (K('radio', 'speaker')) { P.b(1.3, 0.85, 0.5, [0, 0, 0], c, null, { round: true }); P.c(0.28, 0.04, [-0.32, 0, 0.25], COL.dark, [Math.PI / 2, 0, 0]); P.c(0.15, 0.06, [-0.32, 0, 0.25], 0x3a3a44, [Math.PI / 2, 0, 0]); if (K('radio')) { P.b(0.4, 0.2, 0.02, [0.32, 0.15, 0.26], 0xfff2a0, null, { glow: true }); P.c(0.015, 0.8, [0.45, 0.75, 0], COL.metal, [0, 0, -0.3]); } else P.c(0.28, 0.04, [0.32, 0, 0.25], COL.dark, [Math.PI / 2, 0, 0]); return; }
  if (K('oven', 'stove', 'microwave', 'fridge', 'freezer', 'toaster', 'air conditioner', 'vacuum', '3d printer', 'printer', 'generator', 'loom', 'printing press', 'typewriter', 'barbecue')) {
    if (K('fridge', 'freezer')) { P.b(0.9, 1.7, 0.75, [0, 0, 0], c, null, { round: true }); P.b(0.92, 0.03, 0.77, [0, 0.35, 0], dk(c, 0.1)); P.c(0.03, 0.4, [0.35, 0.65, 0.4], COL.metal); P.c(0.03, 0.5, [0.35, -0.1, 0.4], COL.metal); return; }
    if (K('toaster')) { P.b(1.0, 0.7, 0.6, [0, 0, 0], c, null, { round: true }); for (const z of [-0.12, 0.12]) P.b(0.7, 0.05, 0.1, [0, 0.36, z], COL.dark); P.b(0.5, 0.3, 0.06, [0, 0.5, 0.12], 0xd8a050, null, { round: true }); return; }
    if (K('microwave')) { P.b(1.3, 0.75, 0.8, [0, 0, 0], c, null, { round: true }); P.b(0.8, 0.5, 0.02, [-0.15, 0, 0.41], 0x2a2a34); P.b(0.8, 0.5, 0.02, [-0.15, 0, 0.42], 0xfff2a0, null, { glow: true }); P.b(0.2, 0.5, 0.02, [0.45, 0, 0.41], COL.dark); return; }
    if (K('vacuum')) { P.s(0.5, [0, -0.3, 0], c, [1, 0.6, 1.2]); P.seg([0, -0.1, -0.3], [0, 0.9, -0.6], 0.05, COL.dark); P.b(0.4, 0.1, 0.2, [0, -0.62, 0.5], COL.dark); return; }
    if (K('barbecue')) { P.add(PG.bowl(), c, [0, 0.1, 0], [0.7, 0.45, 0.7]); for (let i = -3; i <= 3; i++) P.c(0.015, 1.3, [0, 0.12, i * 0.15], COL.metal, [0, 0, Math.PI / 2]); for (const a of [0, 2.1, 4.2]) P.seg([0, -0.2, 0], [Math.cos(a) * 0.5, -0.95, Math.sin(a) * 0.5], 0.03, COL.dark); P.s(0.15, [0.2, 0.2, 0.1], 0xc0504a, [1.4, 0.5, 1]); return; }
    P.b(1.3, 1.0, 0.85, [0, 0, 0], c, null, { round: true });
    if (K('oven', 'stove')) { P.b(0.9, 0.45, 0.02, [0, -0.1, 0.43], 0x2a2a34); P.b(0.8, 0.35, 0.02, [0, -0.1, 0.44], 0xff8a3a, null, { glow: true }); for (let i = 0; i < 4; i++) P.c(0.06, 0.04, [-0.45 + i * 0.3, 0.38, 0.43], COL.dark, [Math.PI / 2, 0, 0]); if (K('stove')) for (const [x, z] of [[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]]) P.t(0.15, 0.025, [x, 0.51, z], 0xff5a2a, [Math.PI / 2, 0, 0], { glow: true }); return; }
    if (K('printer')) { P.b(0.9, 0.05, 0.4, [0, 0.52, -0.1], 0xffffff); P.b(0.9, 0.04, 0.4, [0, -0.2, 0.55], 0xffffff); return; }
    if (K('generator')) { P.c(0.35, 1.1, [0, 0.1, 0], COL.metal, [0, 0, Math.PI / 2]); BUILD.boltParts(P, [0, 0.1, 0.45], 0.35, 0xfff36b); return; }
    screen(0, 0.15, 0.43, 0.5, 0.25);
    return;
  }
  if (K('steam engine', 'boiler', 'engine', 'motor')) { P.c(0.4, 1.2, [0, 0, 0], c, [0, 0, Math.PI / 2]); P.c(0.12, 0.55, [-0.4, 0.55, 0], COL.dark); BUILD.gearParts(P, [0.62, 0, 0.25], 0.32, COL.gold); P.b(1.2, 0.15, 0.6, [0, -0.45, 0], COL.dark); return; }
  if (K('satellite')) { P.b(0.5, 0.5, 0.5, [0, 0, 0], COL.gold, null, { round: true }); for (const x of [-0.85, 0.85]) P.b(1.0, 0.03, 0.5, [x, 0, 0], 0x2a4a9a); P.add(PG.bowl(), COL.white, [0, 0.45, 0], 0.3); P.c(0.015, 0.3, [0, 0.62, 0], COL.metal); return; }
  if (K('clock', 'clockwork')) { BUILD.clock(P, I, kw); return; }
  if (K('synthesizer', 'piano')) { BUILD.instrument(P, I, kw); return; }
  if (K('robot')) { BUILD.robot(P, I, kw); return; }
  // generic gadget
  P.b(1.2, 0.9, 0.8, [0, 0, 0], c, null, { round: true });
  screen(-0.15, 0.15, 0.41, 0.55, 0.35);
  for (let i = 0; i < 3; i++) P.s(0.06, [0.4, 0.25 - i * 0.18, 0.42], [COL.red, COL.yellow, 0x5aff8a][i], null, { glow: true });
  P.c(0.015, 0.4, [-0.4, 0.65, 0], COL.metal); P.s(0.05, [-0.4, 0.87, 0], COL.red, null, { glow: true });
  if (K('time machine')) { BUILD.gearParts(P, [0, 0.15, -0.45], 0.4, COL.gold); P.s(0.2, [0, 0.7, 0], 0xc87aff, null, { glow: true }); }
};

BUILD.device = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  const glowCol = K('neon') ? c : K('x-ray') ? 0x5ad8ff : K('video game') ? 0xa87aff : 0x5ab8ff;
  if (K('laptop')) { P.b(1.4, 0.06, 0.95, [0, -0.3, 0.1], c, null, { round: true }); P.b(1.4, 0.9, 0.05, [0, 0.15, -0.38], c, [-0.25, 0, 0], { round: true }); P.b(1.25, 0.75, 0.02, [0, 0.15, -0.35], glowCol, [-0.25, 0, 0], { glow: true }); return; }
  if (K('camera')) { P.b(1.2, 0.75, 0.45, [0, 0, 0], c, null, { round: true }); P.c(0.28, 0.35, [0, 0, 0.35], COL.dark, [Math.PI / 2, 0, 0]); P.c(0.2, 0.02, [0, 0, 0.53], 0x5a8ad8, [Math.PI / 2, 0, 0], { glow: true }); P.b(0.3, 0.15, 0.2, [-0.35, 0.42, 0], COL.dark); return; }
  if (K('video game', 'controller')) { P.add(PG.capsule(), c, [0, 0, 0], [0.55, 1.1, 0.3], [0, 0, Math.PI / 2]); P.s(0.07, [0.4, 0.05, 0.16], COL.red, null, { glow: true }); P.s(0.07, [0.52, -0.08, 0.16], 0x5aff8a, null, { glow: true }); P.b(0.22, 0.06, 0.05, [-0.4, 0, 0.16], COL.dark); P.b(0.06, 0.22, 0.05, [-0.4, 0, 0.16], COL.dark); return; }
  if (K('solar')) { P.b(1.4, 0.05, 1.0, [0, 0.1, 0], 0x1a2a5a, [-0.5, 0, 0]); for (let i = 0; i < 4; i++) P.b(0.02, 0.06, 1.0, [-0.52 + i * 0.35, 0.1, 0], 0xb8c8e8, [-0.5, 0, 0]); P.c(0.04, 0.7, [0, -0.4, 0], COL.metal); return; }
  if (K('virtual reality', 'goggles')) { P.b(1.2, 0.5, 0.4, [0, 0, 0], c, null, { round: true }); P.b(0.9, 0.3, 0.02, [0, 0, 0.2], glowCol, null, { glow: true }); P.t(0.62, 0.05, [0, 0, -0.1], COL.dark, [Math.PI / 2, 0, 0]); return; }
  if (K('neon sign')) { P.b(1.5, 0.9, 0.06, [0, 0, -0.05], 0x1a1a22, null, { round: true }); P.t(0.3, 0.04, [-0.35, 0, 0.02], glowCol, null, { glow: true }); P.c(0.04, 0.6, [0.35, 0, 0.02], 0x5affff, null, { glow: true }); return; }
  if (K('lighter')) { P.b(0.5, 0.9, 0.25, [0, -0.2, 0], c, null, { round: true }); P.b(0.5, 0.2, 0.25, [0, 0.35, 0], COL.metal); P.s(0.13, [0, 0.62, 0], 0xff9a3a, [1, 1.6, 1], { glow: true }); return; }
  if (K('keyboard', 'calculator')) { const kb = K('keyboard'); P.b(kb ? 1.6 : 0.9, 0.12, kb ? 0.6 : 1.3, [0, 0, 0], c, null, { round: true }); for (let i = 0; i < (kb ? 24 : 12); i++) P.b(0.1, 0.06, 0.1, [(i % (kb ? 8 : 3) - (kb ? 3.5 : 1)) * (kb ? 0.17 : 0.24), 0.08, (Math.floor(i / (kb ? 8 : 3)) - (kb ? 1 : 0.8)) * (kb ? 0.17 : 0.22)], kb ? 0xf0f0f4 : 0x3a3a44); if (!kb) P.b(0.7, 0.04, 0.25, [0, 0.08, -0.45], 0xb8e8b0, null, { glow: true }); return; }
  // phones, tablets, screens
  const tall = K('phone', 'smartphone');
  const w = K('watch') ? 0.55 : tall ? 0.7 : 1.4, h = K('watch') ? 0.65 : tall ? 1.4 : 0.95;
  P.b(w, h, 0.1, [0, 0, 0], K('smart') || tall ? 0x1a1a24 : c, null, { round: true });
  P.b(w * 0.86, h * 0.84, 0.02, [0, 0, 0.055], glowCol, null, { glow: true });
  if (K('watch')) { P.b(0.35, 0.5, 0.05, [0, 0.55, -0.02], COL.dark); P.b(0.35, 0.5, 0.05, [0, -0.55, -0.02], COL.dark); }
  if (K('screen') && !tall) { P.c(0.06, 0.35, [0, -0.62, -0.05], COL.dark); P.b(0.5, 0.05, 0.3, [0, -0.8, 0], COL.dark); }
  if (K('x-ray')) for (let i = 0; i < 4; i++) P.b(0.4, 0.04, 0.02, [0, 0.25 - i * 0.12, 0.07], 0xffffff, null, { glow: true });
};

// ---- sky & cosmos ------------------------------------------------------------
BUILD.celestial = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('comet')) { P.s(0.45, [0, 0, 0.55], c); P.k(0.42, 1.5, [0, 0, -0.4], lt(c, 0.12), [-Math.PI / 2, 0, 0], { glow: true }); return; }
  if (K('explosion', 'supernova', 'big bang', 'fireworks show')) { P.s(0.55, [0, 0, 0], lt(c, 0.2), null, { glow: true }); for (let i = 0; i < 14; i++) { const u = P.rng() * 2 - 1, a = P.rng() * 6.28, r = Math.sqrt(1 - u * u); const v = new THREE.Vector3(r * Math.cos(a), u, r * Math.sin(a)); P.add(PG.cone(6), i % 2 ? c : COL.yellow, [v.x * 0.7, v.y * 0.7, v.z * 0.7], [0.14, 0.7, 0.14], new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v), { glow: true }); } return; }
  P.s(0.82, [0, 0, 0], c, null, { glow: true, seg: 24 });
  P.s(1, [0, 0, 0], lt(c, 0.08), null, { glow: true });
  if (K(' sun', 'summer', 'star', 'fusion') && !K('neutron')) for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; P.add(PG.cone(6), lt(c, 0.12), [Math.cos(a) * 1.15, Math.sin(a) * 1.15, 0], [0.12, 0.45, 0.12], [0, 0, a - Math.PI / 2], { glow: true }); }
  if (K('pulsar')) { P.k(0.2, 1.6, [0, 1.3, 0], 0xb8f0ff, null, { glow: true }); P.k(0.2, 1.6, [0, -1.3, 0], 0xb8f0ff, [Math.PI, 0, 0], { glow: true }); }
};

BUILD.planet = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color, seed = hashStr(I.id);
  if (K('pizza')) { P.s(1, [0, 0, 0], 0xf0c050, null, { seg: 24 }); for (let i = 0; i < 12; i++) { const u = P.rng() * 2 - 1, a = P.rng() * 6.28, r = Math.sqrt(1 - u * u); P.s(0.14, [r * Math.cos(a), u, r * Math.sin(a)], 0xc0302a, [1, 1, 1]); } return; }
  const earthy = K('earth', 'world');
  const cf = earthy ? (x, y, z) => (Math.sin(x * 4 + seed) + Math.cos(z * 3 + y * 2)) > 0.6 ? 0x4cb84f : Math.abs(y) > 0.85 ? 0xffffff : 0x2f7ad8
    : (x, y, z) => shiftColor(c, 0, 0, Math.sin(y * 9 + Math.sin(x * 2) * 0.5) * 0.08);
  P.add(PG.sphere(28, 18), c, [0, 0, 0], 1, null, { colorFn: cf });
  if (K('saturn', 'solar system') || (!earthy && hash01(I.id, 3) < 0.35 && !K('mars', 'venus', 'jupiter'))) P.t(1.55, 0.18, [0, 0, 0], lt(c, 0.12), [Math.PI / 2 - 0.35, 0, 0.1], { rs: 40 }, PG);
  if (K('jupiter')) P.s(0.2, [0.45, -0.25, 0.82], 0xc8503a, [1.4, 0.8, 0.5]);
  if (K('solar system')) { P.list[0].glow = true; for (let i = 0; i < 3; i++) P.s(0.15, [Math.cos(i * 2) * 1.55, 0, Math.sin(i * 2) * 1.55], [0x5a8ad8, 0xd8503a, 0xe8c87a][i]); }
};

BUILD.moon = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), seed = hashStr(I.id);
  const c = K('eclipse') ? 0x1a1a24 : I.color;
  P.add(displacedIco(3, seed, 0.04), c, [0, 0, 0], 1, null, { colorFn: (x, y, z) => shiftColor(c, 0, 0, (Math.sin(x * 7 + seed) * Math.cos(y * 6) * Math.sin(z * 5)) * 0.15) });
  for (let i = 0; i < 6; i++) { const u = P.rng() * 2 - 1, a = P.rng() * 6.28, r = Math.sqrt(1 - u * u); P.s(0.15 + P.rng() * 0.12, [r * Math.cos(a) * 0.95, u * 0.95, r * Math.sin(a) * 0.95], dk(c, 0.12), [1, 1, 0.35], { rot: [Math.acos(u), 0, a] }); }
  if (K('eclipse')) P.t(1.05, 0.06, [0, 0, 0], 0xfff2b0, [0, 0, 0], { glow: true });
};

BUILD.galaxy = (P, I, kw) => {
  const c = I.color;
  P.s(0.32, [0, 0, 0], lt(c, 0.3), null, { glow: true });
  P.s(1, [0, 0, 0], dk(c, 0.15), [1, 0.08, 1]);
  const arms = 3;
  for (let a = 0; a < arms; a++) for (let i = 0; i < 16; i++) {
    const t = i / 16, ang = a * (Math.PI * 2 / arms) + t * 3.5, r = 0.2 + t * 0.85;
    P.add(PG.oct(), i % 3 ? lt(c, 0.25) : 0xffffff, [Math.cos(ang) * r, (P.rng() - 0.5) * 0.08, Math.sin(ang) * r], 0.045 + (1 - t) * 0.04, null, { glow: true });
  }
};

BUILD.blackhole = (P, I, kw) => {
  P.s(0.65, [0, 0, 0], 0x050508, null, { seg: 24 });
  P.t(1.05, 0.12, [0, 0, 0], hasKw(kw, 'abyss') ? 0x3a5aff : 0xffa83a, [Math.PI / 2 - 0.25, 0, 0], { glow: true, rs: 40 });
  P.t(0.78, 0.05, [0, 0, 0], 0xfff2c8, [Math.PI / 2 - 0.25, 0, 0], { glow: true, rs: 32 });
  if (hasKw(kw, 'singularity')) P.s(0.3, [0, 0, 0], 0xffffff, null, { glow: true });
};

BUILD.star5 = (P, I, kw) => {
  P.add(PG.star(5, 0.45, 0.34), I.color, [0, 0, 0], 1, [0, 0, 0], { glow: hasKw(kw, 'star', 'shooting', 'glory', 'fame', 'sparkle', 'inspiration', 'hope', 'wish') && !hasKw(kw, 'starfish', 'shuriken', 'origami', 'kite') });
  if (hasKw(kw, 'shooting', 'wish')) P.k(0.35, 1.4, [-0.9, -0.5, -0.3], lt(I.color, 0.1), [0, 0, 2.2], { glow: true });
  if (hasKw(kw, 'starfish')) { P.list[0].glow = false; P.eyes(0.15, 0.15, 0.25, 0.1); }
  if (hasKw(kw, 'snowflake')) { P.list.length = 0; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; P.b(0.12, 2, 0.08, [0, 0, 0], I.color, [0, 0, a]); P.b(0.08, 0.5, 0.06, [Math.sin(a) * 0.6, Math.cos(a) * 0.6, 0], I.color, [0, 0, a + 0.8]); P.b(0.08, 0.5, 0.06, [Math.sin(a) * 0.6, Math.cos(a) * 0.6, 0], I.color, [0, 0, a - 0.8]); } }
  if (hasKw(kw, 'kite')) { P.list.length = 0; P.add(PG.oct(), I.color, [0, 0, 0], [0.8, 1.1, 0.05]); P.c(0.01, 1.5, [0, -1.5, 0], 0xf0f0f0); for (let i = 0; i < 3; i++) P.b(0.15, 0.08, 0.02, [0, -1.0 - i * 0.3, 0], COL.red, [0, 0, 0.6]); }
};

BUILD.abstract = (P, I, kw) => {
  const c = I.color, K = (...w) => hasKw(kw, ...w);
  P.s(0.5, [0, 0, 0], lt(c, 0.25), null, { glow: true });
  P.s(0.82, [0, 0, 0], c, null, { seg: 20 });
  if (K('time', 'eternity', 'year', 'future', 'past', 'present', 'now', 'today', 'day', 'night', 'season', 'karma')) { P.t(1.05, 0.04, [0, 0, 0], COL.gold, [Math.PI / 2, 0, 0], { glow: true }); P.b(0.05, 0.45, 0.04, [0, 0.22, 0.85], COL.dark); P.b(0.04, 0.3, 0.04, [0.15, 0.08, 0.85], COL.dark, [0, 0, -1]); return; }
  if (K('music', 'melody', 'song', 'rhythm', 'sound', 'jazz', 'rock music', 'synthwave', 'lullaby', 'disco', 'dance')) { P.s(0.22, [-0.25, -0.6, 0.85], COL.dark, [1.2, 0.85, 0.6]); P.b(0.05, 0.75, 0.05, [-0.06, -0.25, 0.85], COL.dark); P.b(0.28, 0.08, 0.05, [0.06, 0.12, 0.85], COL.dark, [0, 0, -0.4]); return; }
  if (K('love', 'emotion', 'peace', 'friendship', 'trust', 'joy', 'happiness', 'kindness', 'courage', 'good', 'holy', 'blessing', 'healing')) { P.list.length = 0; P.add(PG.heart(), c, [0, 0, 0], 1); P.s(0.2, [-0.35, 0.3, 0.32], lt(c, 0.3)); if (K('peace', 'holy', 'good', 'blessing')) P.t(0.5, 0.05, [0, 1.05, 0], 0xfff2a0, [Math.PI / 2, 0, 0], { glow: true }); return; }
  if (K('idea', 'knowledge', 'science', 'logic', 'math', 'number', 'answer', 'question', 'truth', 'philosophy', 'information', 'code', 'ai')) {
    for (let i = 0; i < 3; i++) P.t(1.0, 0.025, [0, 0, 0], lt(c, 0.2), [i * 1.05, i * 0.7, 0], { glow: true });
    P.s(0.12, [1.0, 0, 0], 0xffffff, null, { glow: true }); P.s(0.12, [-0.5, 0.86, 0], 0xffffff, null, { glow: true });
    return;
  }
  if (K('death', 'evil', 'darkness', 'void', 'curse', 'chaos', 'fear', 'nightmare', 'secret', 'mystery', 'lie', 'shadow', 'dark matter')) { for (let i = 0; i < 5; i++) { const a = i * 1.25; P.k(0.15, 0.6, [Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0], dk(c, 0.1), [0, 0, a - Math.PI / 2]); } return; }
  if (K('energy', 'power', 'electric', 'super power', 'magnetism', 'heat', 'speed', 'strength', 'life')) { BUILD.boltParts(P, [0, 0, 0.85], 0.7, COL.yellow); return; }
  for (let i = 0; i < 2; i++) P.t(1.05, 0.03, [0, 0, 0], lt(c, 0.15), [Math.PI / 2 + i * 1.2, i * 0.8, 0], { glow: true });
  P.s(0.1, [1.05, 0, 0], 0xffffff, null, { glow: true });
};

BUILD.heart = (P, I, kw) => {
  P.add(PG.heart(), I.color, [0, 0, 0], 1);
  P.s(0.2, [-0.4, 0.35, 0.3], lt(I.color, 0.3));
  if (hasKw(kw, 'heartbreak')) { P.list.length = 0; P.add(PG.heart(), I.color, [-0.12, 0, 0], 1, [0, 0, 0.12]); P.add(PG.heart(), I.color, [0.12, -0.05, 0], 1, [0, 0, -0.12]); }
  if (hasKw(kw, 'kiss', 'lips')) { P.list.length = 0; P.s(0.6, [0, 0.15, 0], I.color, [1.4, 0.45, 0.5]); P.s(0.6, [0, -0.2, 0], I.color, [1.3, 0.5, 0.5]); }
  if (hasKw(kw, 'birthday', 'valentine')) P.add(PG.star(5, 0.45, 0.2), COL.yellow, [0.7, 0.75, 0.25], 0.25, null, { glow: true });
  if (hasKw(kw, 'health')) { P.b(0.5, 0.15, 0.1, [0, 0.05, 0.35], 0xffffff); P.b(0.15, 0.5, 0.1, [0, 0.05, 0.35], 0xffffff); }
};

// ---- food ---------------------------------------------------------------
BUILD.fruit = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('grape', 'berry')) { const n = K('grape') ? 10 : 6; for (let i = 0; i < n; i++) { const row = Math.floor(Math.sqrt(i * 2)); P.s(0.3, [(i % (row + 1) - row / 2) * 0.42, 0.5 - row * 0.38, (P.rng() - 0.5) * 0.2], shiftColor(c, 0, 0, (P.rng() - 0.5) * 0.1)); } P.c(0.03, 0.3, [0, 0.85, 0], 0x5a3a1a); return; }
  if (K('cherry')) { for (const x of [-0.35, 0.35]) { P.s(0.42, [x, -0.35, 0], c); P.seg([x, 0.0, 0], [0, 0.9, 0], 0.025, 0x4a8a2a); } P.s(0.2, [0.1, 0.9, 0], COL.leaf, [1.2, 0.3, 0.6]); return; }
  if (K('watermelon')) { P.s(1, [0, 0, 0], c, [1.15, 0.85, 0.85], { colorFn: (x, y, z) => ((Math.atan2(z, y) * 5 / Math.PI | 0) & 1) ? 0x2a7a3a : 0x4ab05a }); return; }
  if (K('pineapple')) { P.s(0.75, [0, -0.15, 0], c, [1, 1.25, 1], { colorFn: (x, y, z) => ((x * 6 + y * 6 | 0) + (z * 6 - y * 6 | 0)) & 1 ? c : dk(c, 0.15) }); for (let i = 0; i < 7; i++) { const a = i * 0.9; P.k(0.08, 0.6, [Math.cos(a) * 0.08, 0.95, Math.sin(a) * 0.08], 0x3aa84a, [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4]); } return; }
  if (K('lemon', 'lime', 'olive', 'mango', 'kiwi', 'eggplant', 'avocado', 'pepper', 'onion', 'garlic')) { P.s(0.8, [0, 0, 0], c, K('eggplant') ? [0.7, 1.25, 0.7] : K('avocado') ? [0.75, 1.0, 0.7] : [0.75, 0.95, 0.75]); if (K('onion', 'garlic')) P.k(0.15, 0.3, [0, 0.82, 0], dk(c, 0.05)); else P.c(0.05, 0.18, [0, 0.82, 0], K('eggplant', 'pepper') ? 0x3a8a2a : 0x5a3a1a); return; }
  if (K('star fruit')) { BUILD.star5(P, I, kw); return; }
  P.s(0.85, [0, 0, 0], c, K('strawberry') ? [0.85, 1, 0.85] : [1, 0.92, 1], { colorFn: K('peach') ? (x, y) => y > 0.2 ? shiftColor(c, -0.02, 0, -0.05) : c : null });
  if (K('strawberry')) { for (let i = 0; i < 12; i++) { const u = P.rng() * 1.4 - 0.9, a = P.rng() * 6.28, r = Math.sqrt(1 - u * u) * 0.86; P.s(0.04, [Math.cos(a) * r, u * 0.85, Math.sin(a) * r], 0xfff2a0); } for (let i = 0; i < 5; i++) { const a = i * 1.25; P.s(0.22, [Math.cos(a) * 0.2, 0.78, Math.sin(a) * 0.2], 0x3aa84a, [1, 0.25, 0.5], { rot: [0, -a, 0.3] }); } return; }
  if (K('coconut')) { for (const [x, y] of [[-0.15, 0.3], [0.15, 0.3], [0, 0.1]]) P.s(0.08, [x, y, 0.82], 0x3a2010); return; }
  if (K('pumpkin', 'halloween')) { P.list.length = 0; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; P.s(0.55, [Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35], shiftColor(c, 0, 0, (i % 2) * 0.03), [0.7, 0.9, 0.7]); } P.c(0.08, 0.3, [0, 0.75, 0], 0x5a7a2a); if (K('halloween')) { P.add(PG.cone(3), 0xffd23a, [-0.25, 0.15, 0.68], [0.12, 0.15, 0.05], null, { glow: true }); P.add(PG.cone(3), 0xffd23a, [0.25, 0.15, 0.68], [0.12, 0.15, 0.05], null, { glow: true }); P.b(0.45, 0.08, 0.05, [0, -0.2, 0.7], 0xffd23a, null, { glow: true }); } return; }
  P.c(0.05, 0.25, [0, 0.88, 0], 0x5a3a1a);
  P.s(0.25, [0.18, 0.92, 0], COL.leaf, [1, 0.22, 0.5], { rot: [0, 0, -0.4] });
};

BUILD.food = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('carrot')) { P.k(0.32, 1.6, [0, -0.1, 0], c, [Math.PI, 0, 0]); for (let i = 0; i < 4; i++) P.k(0.06, 0.6, [(i - 1.5) * 0.08, 0.95, 0], 0x3aa84a, [0, 0, (i - 1.5) * 0.3]); return; }
  if (K('corn')) { P.add(PG.capsule(), c, [0, 0, 0], [0.5, 1.2, 0.5], null, { colorFn: (x, y, z) => ((y * 14 | 0) + (Math.atan2(z, x) * 4 | 0)) & 1 ? c : dk(c, 0.08) }); for (const s of [-1, 1]) P.s(0.35, [s * 0.25, -0.35, 0], 0x7ac05a, [0.4, 1.3, 0.3], { rot: [0, 0, s * 0.35] }); return; }
  if (K('banana')) { P.t(0.7, 0.18, [0, 0.4, 0], c, [0, 0, Math.PI * 1.2], { arc: Math.PI * 0.75 }); P.c(0.05, 0.15, [0.48, 0.92, 0], 0x5a3a1a); return; }
  if (K('hot dog', 'sausage')) { if (K('hot dog')) P.add(PG.capsule(), 0xe0a050, [0, -0.15, 0], [0.55, 1.2, 0.4], [0, 0, Math.PI / 2]); P.add(PG.capsule(), 0xc04030, [0, 0.05, 0], [0.32, 1.5, 0.32], [0, 0, Math.PI / 2]); if (K('hot dog')) P.c(0.03, 1.2, [0, 0.22, 0], 0xffd23a, [0, 0, Math.PI / 2]); return; }
  if (K('sushi', 'rice ball')) { if (K('rice ball')) { P.add(PG.cone(3), 0xfbfbfb, [0, 0, 0], [0.8, 1.0, 0.8], [0, 0, 0]); P.b(0.5, 0.45, 0.5, [0, -0.3, 0.2], 0x1a3a2a); return; } P.b(1.1, 0.5, 0.6, [0, -0.15, 0], 0xfbfbfb, null, { round: true }); P.b(1.2, 0.2, 0.65, [0, 0.18, 0], c, null, { round: true }); P.b(0.25, 0.75, 0.68, [0, -0.05, 0], 0x1a3a2a); return; }
  if (K('taco')) { P.t(0.8, 0.12, [0, 0, 0], 0xf0c050, [0, Math.PI / 2, 0], { arc: Math.PI }); P.s(0.6, [0, 0.12, 0], 0x7a3a1a, [0.25, 0.6, 1]); P.s(0.4, [0, 0.4, 0], 0x6ad04a, [0.3, 0.3, 1.2]); return; }
  if (K('burrito', 'spring roll', 'pod')) { P.add(PG.capsule(), c, [0, 0, 0], [0.55, 1.4, 0.55], [0, 0, Math.PI / 2]); if (K('pod')) for (let i = 0; i < 3; i++) P.s(0.2, [(i - 1) * 0.3, 0.15, 0.1], 0x8ad05a); return; }
  if (K('dumpling')) { P.s(0.85, [0, -0.1, 0], c, [1.1, 0.7, 0.8]); P.t(0.5, 0.12, [0, 0.35, 0], c, [Math.PI / 2, 0, 0], { arc: Math.PI }); return; }
  if (K('fries')) { P.f(0.6, 0.45, 0.8, [0, -0.45, 0], COL.red); for (let i = 0; i < 8; i++) P.b(0.1, 0.9, 0.1, [(i % 4 - 1.5) * 0.17, 0.15, (Math.floor(i / 4) - 0.5) * 0.15], 0xf6c040, [(P.rng() - 0.5) * 0.4, 0, (P.rng() - 0.5) * 0.3]); return; }
  if (K('cheese', 'moon cheese')) { P.add(PG.cyl(3), c, [0, 0, 0], [1, 0.7, 1], [0, 0.3, 0]); for (let i = 0; i < 4; i++) P.s(0.1, [(P.rng() - 0.5) * 0.6, 0.36, (P.rng() - 0.5) * 0.4], dk(c, 0.1), [1, 0.4, 1]); return; }
  if (K('wasabi', 'spice', 'mustard')) { P.add(displacedIco(2, hashStr(I.id), 0.15), c, [0, -0.3, 0], [0.9, 0.6, 0.9]); return; }
  if (K('vegetable', 'lettuce')) { for (let i = 0; i < 6; i++) { const a = i * 1.05; P.s(0.5, [Math.cos(a) * 0.3, 0.1, Math.sin(a) * 0.3], shiftColor(c, 0, 0, (i % 2) * 0.05), [0.8, 1, 0.35], { rot: [0.3 * Math.sin(a), -a, 0.3 * Math.cos(a)] }); } P.s(0.4, [0, 0, 0], lt(c, 0.1)); return; }
  if (K('chili', 'cucumber')) { P.add(PG.capsule(), c, [0, 0, 0], [0.4, 1.4, 0.4], [0, 0, 0.3]); P.c(0.05, 0.25, [-0.25, 0.85, 0], 0x3a8a2a, [0, 0, 0.3]); return; }
  if (K('robot chef')) { BUILD.robot(P, I, kw); return; }
  // generic: plated food dome
  P.c(0.95, 0.06, [0, -0.45, 0], 0xf8f8f8, null, { seg: 24 });
  P.add(displacedIco(2, hashStr(I.id), 0.12), c, [0, -0.1, 0], [0.75, 0.45, 0.75]);
};

BUILD.disc = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('burger')) { P.add(PG.hemi(), 0xd89040, [0, 0.15, 0], [0.9, 0.55, 0.9]); for (let i = 0; i < 6; i++) P.s(0.04, [(P.rng() - 0.5) * 0.9, 0.55, (P.rng() - 0.5) * 0.9], 0xfff4d0, [1, 0.5, 1.6]); P.c(0.95, 0.1, [0, 0.08, 0], 0x5ac04a); if (K('cheese')) P.b(1.4, 0.04, 1.4, [0, 0.0, 0], 0xffcf3a, [0, 0.7, 0]); P.c(0.88, 0.22, [0, -0.1, 0], 0x6a3a20); P.c(0.9, 0.25, [0, -0.38, 0], 0xd89040); return; }
  if (K('pancake', 'breakfast')) { for (let i = 0; i < 4; i++) P.c(0.85 - i * 0.02, 0.15, [0, -0.45 + i * 0.16, 0], i % 2 ? c : dk(c, 0.05)); P.b(0.25, 0.12, 0.25, [0, 0.28, 0], 0xfff08a); P.c(0.6, 0.03, [0, 0.21, 0], 0xb5651d); return; }
  if (K('pizza')) { P.add(PG.cyl(3), c, [0, 0, 0], [1, 0.1, 1], [0, 0, 0]); P.add(PG.cyl(3), 0xd8302a, [0, 0.055, 0], [0.88, 0.02, 0.88]); for (let i = 0; i < 5; i++) { const a = P.rng() * 6.28, r = P.rng() * 0.35; P.c(0.1, 0.03, [Math.cos(a) * r - 0.1, 0.08, Math.sin(a) * r], 0xa8202a); } P.add(PG.capsule(), 0xe0a040, [0, 0, 0.45], [0.12, 1.5, 0.12], [0, 0, Math.PI / 2]); return; }
  if (K('mirror', 'mirror portal')) { P.c(0.9, 0.06, [0, 0, 0], 0xe8f6ff, [Math.PI / 2, 0, 0]); P.t(0.92, 0.07, [0, 0, 0], COL.gold); if (K('portal')) P.c(0.85, 0.02, [0, 0, 0.04], 0x9ae8ff, [Math.PI / 2, 0, 0], { glow: true }); return; }
  if (K('frying pan', 'pan')) { P.c(0.8, 0.12, [0, 0, 0], 0x2a2a30); P.c(0.07, 0.9, [1.2, 0.02, 0], 0x1a1a1a, [0, 0, Math.PI / 2]); return; }
  if (K('mask', 'eyepatch')) { P.s(0.9, [0, 0, 0], c, [1, 1.1, 0.35]); P.s(0.15, [-0.3, 0.15, 0.3], COL.dark, [1.2, 0.8, 0.3]); P.s(0.15, [0.3, 0.15, 0.3], COL.dark, [1.2, 0.8, 0.3]); return; }
  if (K('lens', 'plate', 'disc', 'tortilla', 'chips', 'omelette', 'fried egg', 'mud pie')) {
    P.c(0.9, K('plate') ? 0.06 : 0.1, [0, 0, 0], c, null, { seg: 24 });
    if (K('fried egg')) { P.s(0.32, [0, 0.08, 0], 0xffc81a, [1, 0.5, 1]); }
    if (K('plate')) P.t(0.82, 0.04, [0, 0.03, 0], lt(c, 0.04), [Math.PI / 2, 0, 0]);
    return;
  }
  // cookies, pies, tortillas
  P.c(0.9, 0.22, [0, 0, 0], c, null, { seg: 22 });
  if (K('cookie', 'fortune')) for (let i = 0; i < 7; i++) P.s(0.08, [(P.rng() - 0.5) * 1.2, 0.11, (P.rng() - 0.5) * 1.2], 0x4a2a1a, [1, 0.5, 1]);
  if (K('pie')) { P.t(0.85, 0.12, [0, 0.12, 0], dk(c, 0.04), [Math.PI / 2, 0, 0]); for (let i = 0; i < 4; i++) P.b(1.6, 0.05, 0.08, [0, 0.13, (i - 1.5) * 0.35], lt(c, 0.04)); }
};

BUILD.cake = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('cupcake')) { P.f(0.6, 0.45, 0.6, [0, -0.45, 0], 0xd8a060, null, { seg: 12 }); for (let i = 0; i < 3; i++) P.t(0.48 - i * 0.14, 0.18, [0, -0.08 + i * 0.18, 0], c, [Math.PI / 2, 0, 0]); P.s(0.12, [0, 0.42, 0], COL.red); return; }
  if (K('pudding')) { P.f(0.6, 0.85, 0.8, [0, -0.2, 0], c); P.c(0.62, 0.1, [0, 0.22, 0], 0x7a3a1a); P.s(0.12, [0, 0.35, 0], COL.red); return; }
  P.c(0.9, 0.55, [0, -0.4, 0], c); P.c(0.92, 0.08, [0, -0.1, 0], 0xfff4f8); P.c(0.65, 0.4, [0, 0.12, 0], lt(c, 0.04)); P.c(0.67, 0.06, [0, 0.33, 0], 0xfff4f8);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; P.s(0.08, [Math.cos(a) * 0.82, -0.07, Math.sin(a) * 0.82], 0xffffff); }
  if (K('birthday')) for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + 0.4; P.c(0.03, 0.3, [Math.cos(a) * 0.35, 0.5, Math.sin(a) * 0.35], [0x5ab8ff, 0xff5ab0, 0xffd23a, 0x5aff8a][i]); P.s(0.05, [Math.cos(a) * 0.35, 0.7, Math.sin(a) * 0.35], 0xffb03a, [1, 1.5, 1], { glow: true }); }
  else P.s(0.15, [0, 0.48, 0], COL.red);
};

BUILD.icecream = (P, I, kw) => {
  P.k(0.45, 1.2, [0, -0.45, 0], 0xd8a060, [Math.PI, 0, 0], { colorFn: (x, y, z) => ((y * 12 + Math.atan2(z, x) * 3 | 0) & 1) ? 0xd8a060 : 0xc08848 });
  P.s(0.5, [0, 0.25, 0], I.color); P.s(0.42, [0.12, 0.65, 0], lt(I.color, 0.05)); P.s(0.12, [0.1, 1.05, 0], COL.red);
  for (let i = 0; i < 6; i++) P.b(0.03, 0.08, 0.03, [(P.rng() - 0.5) * 0.7, 0.3 + P.rng() * 0.5, 0.42], [COL.yellow, 0x5ab8ff, 0xff5ab0][i % 3]);
};

BUILD.drink = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('wine')) { P.add(PG.bowl(), COL.glass, [0, 0.35, 0], [0.5, 0.6, 0.5]); P.s(0.42, [0, 0.25, 0], c, [1, 0.55, 1]); P.c(0.04, 0.6, [0, -0.25, 0], COL.glass); P.c(0.35, 0.03, [0, -0.55, 0], COL.glass); return; }
  if (K('juice', 'milk')) { P.b(0.7, 1.1, 0.5, [0, 0, 0], K('milk') ? 0xf8f8ff : c, null, { round: true }); P.add(PG.cyl(4), K('milk') ? 0x3a7ad8 : lt(c, 0.1), [0, 0.68, 0], [0.42, 0.25, 0.32], [0, Math.PI / 4, 0]); if (K('juice')) P.c(0.025, 0.4, [0.15, 0.75, 0], 0xffffff, [0, 0, -0.3]); return; }
  if (K('soda', 'energy drink')) { P.c(0.4, 1.1, [0, 0, 0], c); P.c(0.32, 0.06, [0, 0.58, 0], COL.metal); P.b(0.5, 0.35, 0.02, [0, 0, 0.4], 0xffffff); return; }
  if (K('coffee', 'tea', 'hot', 'mug', 'cup')) { P.f(0.42, 0.34, 0.7, [0, 0, 0], K('mug') ? c : 0xf4f0ea); P.c(0.38, 0.03, [0, 0.33, 0], c); P.t(0.18, 0.05, [0.45, 0.02, 0], K('mug') ? c : 0xf4f0ea, [0, 0, Math.PI / 2], { arc: Math.PI }); if (!K('mug')) P.c(0.6, 0.04, [0, -0.36, 0], 0xf4f0ea); return; }
  if (K('beer')) { P.c(0.4, 0.9, [0, 0, 0], c); P.s(0.42, [0, 0.45, 0], 0xfff8ea, [1, 0.4, 1]); P.t(0.22, 0.06, [0.5, 0.05, 0], COL.glass, [0, 0, Math.PI / 2], { arc: Math.PI }); return; }
  // tall glass with straw
  P.f(0.42, 0.32, 1.1, [0, 0, 0], c); P.s(0.42, [0, 0.55, 0], K('milkshake', 'bubble') ? 0xfff4f8 : lt(c, 0.15), [1, 0.4, 1]);
  P.c(0.035, 0.8, [0.12, 0.7, 0], COL.red, [0, 0, -0.25]);
  if (K('bubble')) for (let i = 0; i < 6; i++) P.s(0.07, [(P.rng() - 0.5) * 0.4, -0.45, (P.rng() - 0.5) * 0.4], 0x3a2010);
};

BUILD.bowl = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('nest')) { P.t(0.6, 0.25, [0, -0.2, 0], 0x9a7a4a, [Math.PI / 2, 0, 0]); for (let i = 0; i < 3; i++) P.s(0.2, [(i - 1) * 0.25, -0.1, 0], 0xb8e0ff, [0.8, 1, 0.8]); return; }
  if (K('helmet')) { P.add(PG.hemi(), c, [0, -0.3, 0], 0.85); P.b(0.12, 0.5, 0.8, [0, -0.15, 0], dk(c, 0.1)); return; }
  if (K('toilet')) { P.add(PG.bowl(), 0xf8f8f8, [0, 0, 0.15], [0.6, 0.55, 0.7]); P.b(0.9, 0.8, 0.35, [0, 0.2, -0.55], 0xf8f8f8, null, { round: true }); P.c(0.3, 0.5, [0, -0.6, 0.1], 0xf8f8f8); return; }
  const isPot = K(' pot', 'melting pot');
  P.add(PG.bowl(), K('bath', 'tub') ? 0xf8fbff : isPot ? COL.steel : K('basket') ? 0xc8a060 : 0xf4ead8, [0, 0.2, 0], [0.95, 0.75, 0.95]);
  P.c(0.85, 0.04, [0, 0.12, 0], K('bath') ? 0x8ad8ff : K('basket', 'picnic') ? 0xe05a5a : c);
  if (isPot) { P.t(0.15, 0.04, [-1.0, 0.12, 0], COL.dark, [0, 0, Math.PI / 2]); P.t(0.15, 0.04, [1.0, 0.12, 0], COL.dark, [0, 0, Math.PI / 2]); }
  if (K('ramen', 'noodles', 'spaghetti', 'pasta')) { for (let i = 0; i < 6; i++) P.t(0.3 + i * 0.07, 0.03, [0, 0.16, 0], 0xf0d070, [Math.PI / 2, 0, i]); if (K('ramen')) P.s(0.15, [0.3, 0.2, 0.2], 0xffffff, [1, 0.5, 1]); if (K('spaghetti')) P.s(0.12, [0, 0.25, 0], 0xa83a2a); }
  else if (K('salad', 'stew', 'soup', 'curry', 'feast', 'food', 'dinner', 'thanksgiving')) for (let i = 0; i < 6; i++) P.s(0.12, [(P.rng() - 0.5) * 1.1, 0.16, (P.rng() - 0.5) * 1.1], [0x6ad04a, 0xe83a2a, 0xffcf3a, 0xd08a4a][i % 4], [1, 0.5, 1]);
  else if (K('rice', 'yogurt')) P.s(0.7, [0, 0.12, 0], 0xfbfbf6, [1, 0.35, 1]);
  if (K('basket')) P.t(0.8, 0.05, [0, 0.2, 0], 0xa8803a, [0, 0, 0], { arc: Math.PI });
};

BUILD.bread = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('croissant')) { for (let i = 0; i < 5; i++) { const t = (i - 2) / 2; P.s(0.42 - Math.abs(t) * 0.15, [t * 0.6, -Math.abs(t) * 0.35, 0], shiftColor(c, 0, 0, (i % 2) * 0.05), [0.6, 0.55, 0.6]); } return; }
  const len = K('baguette') ? 2.1 : 1.3;
  P.add(PG.capsule(), c, [0, 0, 0], [0.75, len, 0.6], [0, 0, Math.PI / 2]);
  for (let i = 0; i < 3; i++) P.b(0.06, 0.04, 0.4, [(i - 1) * len * 0.25, 0.36, 0], lt(c, 0.12), [0, 0.5, 0]);
  if (K('toast')) { P.list.length = 0; P.b(1.1, 1.1, 0.25, [0, 0, 0], 0xf0d8a0, null, { round: true }); P.b(1.2, 1.2, 0.22, [0, 0, 0], c, null, { round: true }); }
};

BUILD.meat = (P, I, kw) => {
  const c = I.color;
  if (hasKw(kw, 'bacon')) { for (let i = 0; i < 5; i++) P.b(0.35, 0.08, 0.5, [-0.7 + i * 0.35, Math.sin(i * 1.6) * 0.12, 0], i % 2 ? c : 0xf0c8b0, [0, 0, Math.cos(i * 1.6) * 0.4]); return; }
  if (hasKw(kw, 'steak')) { P.add(displacedIco(2, hashStr(I.id), 0.1), c, [0, 0, 0], [1, 0.3, 0.75]); P.s(0.2, [0.4, 0.15, 0.1], 0xf8e0d0, [1, 0.3, 1]); return; }
  P.s(0.72, [0.25, 0, 0], c, [1.15, 0.9, 0.9]);
  P.c(0.1, 0.8, [-0.6, 0, 0], 0xf4ecd8, [0, 0, Math.PI / 2]);
  P.s(0.14, [-1.0, 0.08, 0], 0xf4ecd8); P.s(0.14, [-1.0, -0.08, 0], 0xf4ecd8);
};

BUILD.candy = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('lollipop')) { P.c(0.7, 0.18, [0, 0.35, 0], c, [Math.PI / 2, 0, 0], { colorFn: (x, y, z) => ((Math.atan2(x, z) * 2 + Math.hypot(x, z) * 8) | 0) & 1 ? c : 0xffffff }); P.c(0.04, 1.2, [0, -0.7, 0], 0xffffff); return; }
  if (K('pill')) { P.add(PG.capsule(), c, [0, 0.2, 0], [0.5, 0.7, 0.5], [0, 0, 0], { colorFn: (x, y) => y > 0 ? c : 0xffffff }); return; }
  if (K('pacifier')) { P.s(0.35, [0, 0, 0.3], 0xf0d8c0, [1, 1, 1.2]); P.c(0.6, 0.1, [0, 0, -0.05], c, [Math.PI / 2, 0, 0]); P.t(0.3, 0.07, [0, 0, -0.25], c); return; }
  P.s(0.6, [0, 0, 0], c, [1.15, 0.85, 0.85], { colorFn: (x, y, z) => ((x * 5 + y * 5) | 0) & 1 ? c : 0xffffff });
  P.k(0.32, 0.45, [0.75, 0, 0], lt(c, 0.1), [0, 0, Math.PI / 2], { seg: 8 });
  P.k(0.32, 0.45, [-0.75, 0, 0], lt(c, 0.1), [0, 0, -Math.PI / 2], { seg: 8 });
};

BUILD.egg = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('shell') && !K('sand')) { for (let i = 0; i < 6; i++) P.s(0.6 - i * 0.07, [0, -0.3 + i * 0.12, -i * 0.05], shiftColor(c, 0, 0, (i % 2) * 0.05), [1.2 - i * 0.1, 0.3, 1]); P.k(0.25, 0.4, [0, 0.45, -0.3], c, [-0.6, 0, 0]); return; }
  if (K('oyster')) { P.s(0.8, [0, -0.1, 0], c, [1, 0.3, 1]); P.s(0.75, [0, 0.12, -0.15], dk(c, 0.05), [1, 0.25, 0.95], { rot: [-0.4, 0, 0] }); P.s(0.18, [0, 0.05, 0.2], 0xfbf8f0); return; }
  if (K('acorn')) { P.s(0.65, [0, -0.1, 0], c, [0.85, 1.05, 0.85]); P.add(PG.hemi(), dk(c, 0.15), [0, 0.35, 0], [0.7, 0.45, 0.7]); P.c(0.05, 0.25, [0, 0.85, 0], dk(c, 0.2)); return; }
  if (K('bean', 'seed', 'cocoa', 'coffee', 'bullet')) { P.s(0.7, [0, 0, 0], c, [0.65, 1, 0.6]); if (K('coffee')) P.b(0.06, 1.4, 0.05, [0, 0, 0.42], dk(c, 0.2)); return; }
  P.s(0.75, [0, 0, 0], c, [0.82, 1.08, 0.82], { colorFn: K('dragon') ? (x, y, z) => ((x * 6 | 0) + (y * 6 | 0) + (z * 6 | 0)) % 3 === 0 ? dk(c, 0.2) : c : K('easter') ? (x, y) => ['#ff8ad8', '#8ad8ff', '#ffe85a'].map(h => parseInt(h.slice(1), 16))[((y + 1) * 3 | 0) % 3] : null });
  if (K('cosmic')) for (let i = 0; i < 10; i++) P.s(0.04, [(P.rng() - 0.5) * 1.2, (P.rng() - 0.5) * 1.6, 0.65], 0xffffff, null, { glow: true });
};

BUILD.potion = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('hourglass')) { P.k(0.55, 0.8, [0, 0.42, 0], COL.glass, [Math.PI, 0, 0]); P.k(0.55, 0.8, [0, -0.42, 0], COL.glass); P.k(0.4, 0.4, [0, -0.58, 0], 0xe8c87a); P.c(0.62, 0.08, [0, 0.85, 0], COL.darkwood); P.c(0.62, 0.08, [0, -0.85, 0], COL.darkwood); for (const a of [0.8, 2.9, 5]) P.c(0.03, 1.7, [Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55], COL.darkwood); return; }
  if (K('barrel', 'bucket', 'can', 'boiler', 'trophy', 'grail', 'relic', 'jar', 'honey', 'kettle', 'magic lamp', 'tube', 'experiment', 'ceramics', 'porcelain', 'syrup', 'sap', 'jam', 'ketchup', 'mustard', 'glue')) {
    if (K('trophy', 'grail')) { P.add(PG.bowl(), c, [0, 0.45, 0], [0.55, 0.6, 0.55]); P.t(0.22, 0.05, [-0.6, 0.35, 0], c, [0, 0, 0], { arc: Math.PI * 1.2 }); P.t(0.22, 0.05, [0.6, 0.35, 0], c, [0, 0, Math.PI], { arc: Math.PI * 1.2 }); P.c(0.07, 0.5, [0, -0.15, 0], c); P.c(0.38, 0.12, [0, -0.45, 0], c); P.b(0.5, 0.3, 0.5, [0, -0.62, 0], COL.darkwood); if (K('grail')) P.s(0.2, [0, 0.45, 0], 0xfff2a0, null, { glow: true }); return; }
    if (K('barrel')) { P.add(PG.lathe('barrel', [[0, -0.8], [0.55, -0.8], [0.68, 0], [0.55, 0.8], [0, 0.8]]), c, [0, 0, 0], 1); for (const y of [-0.5, 0.5]) P.t(0.64, 0.03, [0, y, 0], COL.steel, [Math.PI / 2, 0, 0]); return; }
    if (K('bucket')) { P.f(0.65, 0.48, 0.9, [0, 0, 0], c); P.t(0.6, 0.03, [0, 0.45, 0], COL.dark, [0, 0, 0], { arc: Math.PI }); P.c(0.6, 0.03, [0, 0.4, 0], 0x5ab8ff); return; }
    if (K('magic lamp')) { P.s(0.55, [0, 0, 0], c, [1.3, 0.6, 0.9]); P.seg([0.6, 0.05, 0], [1.1, 0.25, 0], 0.08, c, { cone: true, r2: 0.12 }); P.t(0.22, 0.05, [-0.7, 0.05, 0], c, [0, 0, 0]); P.c(0.25, 0.15, [0, 0.35, 0], c); P.s(0.1, [0, 0.5, 0], c); return; }
    if (K('kettle')) { P.s(0.6, [0, -0.1, 0], c, [1, 0.85, 1]); P.seg([0.45, -0.05, 0], [0.85, 0.35, 0], 0.07, c); P.t(0.35, 0.05, [0, 0.45, 0], COL.dark, [0, 0, 0], { arc: Math.PI }); return; }
    if (K('tube', 'experiment')) { P.c(0.22, 1.4, [0, 0, 0], COL.glass); P.c(0.2, 0.7, [0, -0.32, 0], c, null, { glow: true }); P.t(0.24, 0.04, [0, 0.7, 0], COL.glass, [Math.PI / 2, 0, 0]); return; }
    // jars, cans
    P.c(0.55, 1.0, [0, 0, 0], K('can') ? COL.metal : COL.glass); P.c(0.5, 0.75, [0, -0.1, 0], c); P.c(0.57, 0.15, [0, 0.55, 0], K('honey') ? 0xc89a3a : K('can') ? COL.steel : COL.red);
    if (K('honey')) P.s(0.15, [0.3, 0.52, 0.35], c, [1, 1.5, 1]);
    return;
  }
  // flasks & bottles
  const bottle = K('bottle', 'wine', 'beer', 'message', 'ink', 'oil', 'vinegar', 'holy water', 'poison', 'venom', 'acid', 'solvent', 'hot sauce', 'nectar', 'dye', 'paint');
  if (bottle) { P.c(0.42, 1.0, [0, -0.25, 0], COL.glass); P.c(0.38, 0.85, [0, -0.3, 0], c, null, { glow: K('poison', 'holy', 'venom', 'acid') }); P.f(0.15, 0.42, 0.3, [0, 0.4, 0], COL.glass); P.c(0.14, 0.35, [0, 0.7, 0], COL.glass); P.c(0.16, 0.12, [0, 0.9, 0], 0x8a5a2a); if (K('message')) P.b(0.18, 0.6, 0.02, [0, -0.2, 0], 0xf0e0b0, [0, 0, 0.3]); if (K('poison')) { P.s(0.12, [0, -0.2, 0.42], 0xffffff); } return; }
  P.s(0.65, [0, -0.25, 0], COL.glass, null, { seg: 20 });
  P.s(0.57, [0, -0.3, 0], c, [1, 0.85, 1], { glow: true });
  P.c(0.17, 0.55, [0, 0.55, 0], COL.glass);
  P.c(0.2, 0.18, [0, 0.88, 0], 0x8a5a2a);
  P.s(0.12, [-0.25, -0.05, 0.4], 0xffffff);
};

BUILD.book = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('scroll', 'papyrus', 'rules', 'legend', 'myth', 'treasure map')) { P.c(0.2, 1.4, [0, 0.35, 0], c, [0, 0, Math.PI / 2]); P.c(0.2, 1.4, [0, -0.45, 0.05], c, [0, 0, Math.PI / 2]); P.b(1.35, 0.8, 0.03, [0, -0.05, 0.1], lt(c, 0.05)); for (const x of [-0.75, 0.75]) { P.c(0.06, 0.18, [x, 0.35, 0], COL.darkwood, [0, 0, Math.PI / 2]); P.c(0.06, 0.18, [x, -0.45, 0.05], COL.darkwood, [0, 0, Math.PI / 2]); } if (K('treasure')) P.b(0.15, 0.04, 0.02, [0.3, -0.1, 0.12], COL.red, [0, 0, 0.785]); return; }
  if (K('money')) { for (let i = 0; i < 4; i++) P.b(1.4, 0.06, 0.65, [0, -0.15 + i * 0.07, 0], i % 2 ? c : lt(c, 0.06)); P.b(0.25, 0.32, 0.67, [0, -0.04, 0], 0xf0e8c0); return; }
  if (K('surfboard', 'snowboard')) { P.s(0.9, [0, 0, 0], c, [0.38, 1.4, 0.06]); P.b(0.06, 2.0, 0.07, [0, 0, 0], 0xffffff); return; }
  if (K('photo', 'picture')) { P.b(1.2, 1.0, 0.06, [0, 0, 0], 0xf8f4ea); P.b(1.0, 0.8, 0.02, [0, 0, 0.035], c, null, { colorFn: (x, y) => y > 0.1 ? 0x8ad0ff : 0x5ac05a }); return; }
  if (K('paper', 'page', 'letter', 'email', 'newspaper', 'news', 'map', 'calendar', 'cards', 'hieroglyph', 'sandpaper', 'origami')) {
    if (K('letter', 'email')) { P.b(1.3, 0.85, 0.05, [0, 0, 0], K('email') ? 0x5a8aff : 0xf8f4ea); P.add(PG.cone(3), dk(K('email') ? 0x5a8aff : 0xf0e8d8, 0.06), [0, 0.18, 0.03], [0.75, 0.45, 0.01], [0, 0, Math.PI]); P.s(0.1, [0, -0.02, 0.05], COL.red, [1, 1, 0.3]); return; }
    if (K('calendar')) { P.b(1.1, 1.2, 0.1, [0, 0, 0], 0xf8f8f8); P.b(1.1, 0.3, 0.12, [0, 0.45, 0], COL.red); for (let i = 0; i < 12; i++) P.b(0.15, 0.12, 0.02, [-0.36 + (i % 4) * 0.24, 0.1 - Math.floor(i / 4) * 0.22, 0.06], 0xd8d8e0); return; }
    if (K('cards')) { for (let i = 0; i < 3; i++) P.b(0.7, 1.0, 0.02, [i * 0.15 - 0.15, 0, i * 0.03], 0xffffff, [0, 0, (i - 1) * 0.25]); P.add(PG.heart(), COL.red, [0.15, 0, 0.1], 0.18, [0, 0, 0.25]); return; }
    if (K('hieroglyph')) { P.b(1.0, 1.3, 0.25, [0, 0, 0], 0xd8c08a, null, { round: true }); for (let i = 0; i < 6; i++) P.b(0.18, 0.18, 0.04, [-0.25 + (i % 2) * 0.5, 0.35 - Math.floor(i / 2) * 0.35, 0.13], 0x8a6a3a); return; }
    P.b(1.2, 1.5, 0.03, [0, 0, 0], c, [0, 0, 0.05]);
    if (K('map')) { P.b(0.4, 0.3, 0.02, [-0.2, 0.2, 0.02], 0x5ac05a); P.b(0.3, 0.4, 0.02, [0.25, -0.25, 0.02], 0x5ac05a); }
    else for (let i = 0; i < 6; i++) P.b(0.9, 0.05, 0.01, [0, 0.5 - i * 0.18, 0.02], 0x9aa0aa);
    return;
  }
  // books
  P.b(1.1, 1.45, 0.3, [0, 0, 0], c, null, { round: true });
  P.b(1.02, 1.38, 0.26, [0.06, 0, 0], 0xf8f4ea);
  P.b(0.1, 1.45, 0.32, [-0.52, 0, 0], dk(c, 0.1));
  if (K('spell', 'bible', 'knowledge', 'science fiction')) P.add(PG.star(K('bible') ? 4 : 5, 0.4, 0.05), COL.gold, [0, 0.15, 0.17], 0.25, null, { glow: K('spell') });
};

BUILD.coin = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('yin yang', 'karma')) { P.c(0.9, 0.15, [0, 0, 0], 0xffffff, [Math.PI / 2, 0, 0], { colorFn: (x, y, z) => (x + Math.sin(z * 3) * 0.3 > 0) ? 0x15151c : 0xffffff }); return; }
  if (K('vinyl')) { P.c(0.95, 0.04, [0, 0, 0], 0x15151c, [Math.PI / 2, 0, 0], { seg: 28 }); P.c(0.3, 0.05, [0, 0, 0], c, [Math.PI / 2, 0, 0]); return; }
  if (K('button')) { P.c(0.8, 0.15, [0, 0, 0], c, [Math.PI / 2, 0, 0]); for (const [x, y] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) P.c(0.08, 0.16, [x, y, 0.01], dk(c, 0.3), [Math.PI / 2, 0, 0]); return; }
  if (K('medal')) { P.add(PG.cone(3), COL.blue, [0, 0.75, 0], [0.4, 0.7, 0.05], [0, 0, Math.PI]); }
  P.c(0.85, 0.14, [0, 0, 0], c, [Math.PI / 2, 0, 0], { seg: 28 });
  P.t(0.82, 0.05, [0, 0, 0], lt(c, 0.08), null, { rs: 28 });
  if (K('coin', 'medal', 'sand dollar')) P.add(PG.star(5, 0.45, 0.06), dk(c, 0.08), [0, 0, 0.07], 0.35);
  if (K('rune', 'lucky charm')) P.b(0.1, 0.6, 0.04, [0, 0, 0.08], 0x7ae8ff, null, { glow: true });
};

BUILD.instrument = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('drum')) { P.c(0.75, 0.75, [0, 0, 0], c); P.c(0.76, 0.03, [0, 0.38, 0], 0xf8f4ea); P.t(0.76, 0.05, [0, 0.38, 0], COL.metal, [Math.PI / 2, 0, 0]); P.t(0.76, 0.05, [0, -0.38, 0], COL.metal, [Math.PI / 2, 0, 0]); P.c(0.03, 0.9, [0.2, 0.7, 0.2], COL.wood, [0.5, 0, 0.5]); P.c(0.03, 0.9, [-0.2, 0.7, 0.2], COL.wood, [0.5, 0, -0.5]); return; }
  if (K('piano', 'synthesizer')) { P.b(1.6, 0.35, 0.7, [0, 0, 0], c, null, { round: true }); for (let i = 0; i < 12; i++) P.b(0.11, 0.04, 0.3, [-0.66 + i * 0.12, 0.19, 0.2], 0xffffff); for (let i = 0; i < 8; i++) P.b(0.06, 0.06, 0.18, [-0.6 + i * 0.17, 0.22, 0.13], 0x15151c); if (K('synth')) for (let i = 0; i < 5; i++) P.c(0.04, 0.05, [-0.5 + i * 0.25, 0.2, -0.2], 0x5affff, null, { glow: true }); return; }
  if (K('trumpet', 'saxophone', 'horn', 'whistle')) { P.c(0.08, 1.2, [0, 0, 0], c, [0, 0, Math.PI / 2]); P.add(PG.frustum(0.2, 16), c, [0.75, 0, 0], [0.38, 0.4, 0.38], [0, 0, -Math.PI / 2]); for (let i = 0; i < 3; i++) P.c(0.04, 0.2, [-0.15 + i * 0.15, 0.12, 0], c); return; }
  if (K('flute')) { P.c(0.08, 2, [0, 0, 0], c, [0, 0, Math.PI / 2]); for (let i = 0; i < 6; i++) P.c(0.03, 0.02, [-0.5 + i * 0.2, 0.08, 0], COL.dark); return; }
  if (K('harp')) { P.t(0.85, 0.07, [0, 0, 0], c, [0, 0, 0.4], { arc: Math.PI * 1.1 }); P.c(0.05, 1.5, [-0.4, -0.1, 0], c, [0, 0, -0.2]); for (let i = 0; i < 6; i++) P.c(0.006, 1.2 - i * 0.12, [-0.25 + i * 0.12, -0.1, 0], 0xf8f4d0); return; }
  if (K('bell')) { BUILD.bell(P, I, kw); return; }
  // string instruments
  const cello = K('cello');
  P.s(0.55, [0, -0.35, 0], c, [1, 1, 0.35]); P.s(0.42, [0, 0.15, 0], c, [1, 1, 0.35]);
  P.c(0.1, 0.05, [0, -0.25, 0.18], COL.dark, [Math.PI / 2, 0, 0]);
  P.b(0.14, 1.2, 0.08, [0, 0.85, 0.05], COL.darkwood); P.b(0.22, 0.25, 0.08, [0, 1.5, 0.05], COL.darkwood);
  for (let i = 0; i < 4; i++) P.c(0.006, 1.7, [-0.04 + i * 0.027, 0.5, 0.13], 0xe8e8e8);
  if (cello) P.c(0.02, 0.4, [0, -1.0, 0], COL.metal);
};

BUILD.cloth = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('shirt', 'clothes', 'chainmail', 'camouflage')) { P.b(0.9, 1.0, 0.35, [0, 0, 0], c, null, { round: true }); P.b(0.35, 0.5, 0.3, [-0.6, 0.25, 0], c, [0, 0, 0.6], { round: true }); P.b(0.35, 0.5, 0.3, [0.6, 0.25, 0], c, [0, 0, -0.6], { round: true }); P.c(0.18, 0.05, [0, 0.5, 0.1], dk(c, 0.1)); return; }
  if (K('pants')) { P.b(0.9, 0.3, 0.35, [0, 0.55, 0], c, null, { round: true }); P.b(0.4, 1.1, 0.35, [-0.24, -0.15, 0], c, [0, 0, 0.05], { round: true }); P.b(0.4, 1.1, 0.35, [0.24, -0.15, 0], c, [0, 0, -0.05], { round: true }); return; }
  if (K('dress')) { P.f(0.35, 0.85, 1.2, [0, -0.3, 0], c); P.b(0.5, 0.5, 0.3, [0, 0.5, 0], c, null, { round: true }); return; }
  if (K('sock')) { P.b(0.4, 1.0, 0.35, [0, 0.25, 0], c, null, { round: true }); P.b(0.4, 0.35, 0.75, [0, -0.3, 0.2], c, null, { round: true }); P.b(0.42, 0.15, 0.37, [0, 0.7, 0], 0xffffff, null, { round: true }); return; }
  if (K('glove')) { P.b(0.75, 0.75, 0.3, [0, -0.15, 0], c, null, { round: true }); for (let i = 0; i < 4; i++) P.add(PG.capsule(), c, [-0.28 + i * 0.18, 0.45, 0], [0.15, 0.4, 0.15]); P.add(PG.capsule(), c, [0.5, 0.0, 0], [0.15, 0.35, 0.15], [0, 0, -0.8]); return; }
  if (K('scarf')) { P.t(0.45, 0.15, [0, 0.3, 0], c, [Math.PI / 2, 0, 0]); P.b(0.3, 1.0, 0.1, [0.3, -0.3, 0.4], c, null, { round: true }); return; }
  if (K('cape', 'cloak', 'sail', 'flag', 'carpet', 'rug', 'blanket', 'towel', 'bandage', 'diaper', 'ribbon', 'web', 'net')) {
    if (K('web', 'net')) { for (let i = 1; i < 4; i++) P.t(i * 0.3, 0.02, [0, 0, 0], c, null, { rs: 8 }); for (let i = 0; i < 8; i++) P.b(0.02, 1.8, 0.02, [0, 0, 0], c, [0, 0, i * Math.PI / 8]); return; }
    if (K('ribbon')) { P.t(0.3, 0.1, [-0.32, 0.1, 0], c, [0, 0, 0.6]); P.t(0.3, 0.1, [0.32, 0.1, 0], c, [0, 0, -0.6]); P.s(0.15, [0, 0.1, 0], c); P.b(0.15, 0.6, 0.04, [-0.15, -0.35, 0], c, [0, 0, 0.3]); P.b(0.15, 0.6, 0.04, [0.15, -0.35, 0], c, [0, 0, -0.3]); return; }
    if (K('diaper', 'bandage')) { P.b(1.2, 0.5, 0.7, [0, 0, 0], c, null, { round: true }); return; }
    const w = K('carpet', 'rug') ? 1.8 : 1.3, h = K('carpet', 'rug') ? 1.2 : 1.6;
    for (let i = 0; i < 5; i++) P.b(w / 5 + 0.02, h, 0.05, [-w / 2 + (i + 0.5) * w / 5, 0, Math.sin(i * 1.3) * 0.06], i % 2 ? c : dk(c, 0.05), [K('carpet', 'rug') ? Math.PI / 2 : 0, 0, 0]);
    if (K('flag')) { P.c(0.03, 2.2, [-w / 2 - 0.05, -0.3, 0], COL.steel); }
    if (K('magic carpet')) for (let i = 0; i < 5; i++) P.c(0.02, 0.15, [-w / 2 + i * w / 4, 0, h / 2 + 0.05], COL.gold, [Math.PI / 2, 0, 0]);
    return;
  }
  if (K('fur', 'hair', 'wig', 'beard', 'mustache', 'wool', 'cotton')) { for (let i = 0; i < 9; i++) P.s(0.38, [(P.rng() - 0.5) * 1.0, (P.rng() - 0.5) * 0.6, (P.rng() - 0.5) * 0.8], shiftColor(c, 0, 0, (P.rng() - 0.5) * 0.1)); return; }
  if (K('leather')) { P.b(1.4, 0.08, 1.0, [0, 0, 0], c, [0.1, 0, 0.05], { round: true }); return; }
  // pillow / generic soft
  P.b(1.4, 0.45, 1.0, [0, 0, 0], c, null, { round: true });
  P.s(0.5, [0, 0.08, 0], lt(c, 0.04), [1.3, 0.35, 0.9]);
};

BUILD.landform = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  const base = (col, r = 1, h = 0.22) => P.c(r, h, [0, -0.62, 0], col, null, { seg: 28 });
  const water = (col = 0x3a8ed8, r = 0.85) => P.c(r, 0.06, [0, -0.48, 0], col, null, { seg: 28 });
  const tree = (x, z, s = 1, col = COL.leaf) => { P.c(0.05 * s, 0.3 * s, [x, -0.38 + 0.15 * s, z], COL.wood); P.k(0.22 * s, 0.5 * s, [x, -0.15 + 0.35 * s, z], col, null, { seg: 8 }); };
  const ground = K('desert', 'dune', 'beach', 'egypt', 'sandcastle', 'canyon') ? COL.sand : K('arctic', 'tundra', 'antarctica', 'glacier', 'avalanche') ? 0xf0f8ff : K('hell', 'underworld') ? 0x3a0a0a : K('heaven', 'paradise') ? 0xfff8e0 : K('cave', 'mine', 'tunnel', 'underground', 'crystal cave') ? 0x6a6060 : 0x6fb15b;
  if (K('volcano', 'ice cream volcano')) { base(K('ice cream') ? 0xffd8e8 : 0x5a4a3a); P.f(0.35, 0.95, 1.1, [0, -0.0, 0], K('ice cream') ? 0xd8a060 : c); P.c(0.33, 0.05, [0, 0.56, 0], K('ice cream') ? 0xffb0d8 : 0xff5a10, null, { glow: !K('ice cream') }); if (!K('ice cream')) for (let i = 0; i < 3; i++) P.s(0.08, [Math.cos(i * 2) * 0.35, 0.3 - i * 0.15, Math.sin(i * 2) * 0.35 + 0.5], 0xff6a1a, [1, 2, 1], { glow: true }); else for (let i = 0; i < 3; i++) P.s(0.25, [(i - 1) * 0.15, 0.68 + (i % 2) * 0.1, 0], [0xffd8e8, 0x8a5a3a, 0xfff4d0][i]); return; }
  if (K('mountain', 'glacier', 'olympus', 'hill', 'plateau', 'cliff', 'avalanche')) {
    base(ground);
    if (K('hill')) { P.add(PG.hemi(), 0x7bbf5a, [0, -0.5, 0], [0.9, 0.6, 0.9]); return; }
    if (K('plateau', 'cliff')) { P.f(0.75, 0.95, 0.85, [0, -0.1, 0], c, null, { seg: 7 }); P.c(0.76, 0.05, [0, 0.33, 0], 0x7bbf5a, null, { seg: 7 }); return; }
    P.add(PG.cone(7), c, [0.1, 0.1, 0], [0.85, 1.4, 0.85]); P.add(PG.cone(7), dk(c, 0.05), [-0.45, -0.15, 0.2], [0.5, 0.9, 0.5]);
    P.add(PG.cone(7), 0xffffff, [0.1, 0.62, 0], [0.33, 0.4, 0.33]);
    if (K('olympus')) for (let i = 0; i < 4; i++) P.s(0.25, [(P.rng() - 0.5), 0.6, (P.rng() - 0.5)], 0xffffff);
    return;
  }
  if (K('island', 'beach', 'oasis', 'vacation', 'paradise', 'tidepool')) { water(); P.add(PG.hemi(), COL.sand, [0, -0.5, 0], [0.55, 0.25, 0.55]); if (!K('tidepool')) { P.seg([0, -0.4, 0], [0.12, 0.35, 0], 0.05, COL.wood); for (let i = 0; i < 5; i++) { const a = i * 1.25; P.s(0.28, [0.12 + Math.cos(a) * 0.25, 0.38, Math.sin(a) * 0.25], 0x3aa14a, [1, 0.15, 0.35], { rot: [0, -a, -0.4] }); } } return; }
  if (K('lake', 'pond', 'pool', 'moat', 'lava lake', 'hot spring', 'delta', 'river', 'swamp', 'marsh', 'valley', 'waterfall', 'sewer')) {
    base(K('swamp', 'marsh', 'sewer') ? 0x4a5a3a : ground);
    P.t(0.82, 0.12, [0, -0.5, 0], K('pool') ? 0xf8f8f8 : 0x8a7a6a, [Math.PI / 2, 0, 0], { rs: 28 });
    P.c(0.8, 0.06, [0, -0.5, 0], c, null, { seg: 28, glow: K('lava') });
    if (K('swamp', 'marsh')) for (let i = 0; i < 6; i++) P.c(0.02, 0.5, [Math.cos(i) * 0.7, -0.25, Math.sin(i) * 0.7], 0x8a9a4a);
    if (K('waterfall', 'valley')) { P.b(1.4, 0.9, 0.4, [0, 0, -0.7], 0x8a8a8a); P.b(0.4, 0.9, 0.05, [0, 0, -0.48], 0x8ad0ff, null, { glow: true }); }
    if (K('hot spring')) for (let i = 0; i < 3; i++) P.s(0.15, [(i - 1) * 0.3, -0.25, 0], 0xffffff, [1, 1.5, 1]);
    tree(0.75, 0.55, 0.8);
    return;
  }
  if (K('desert', 'dune', 'savanna', 'prairie', 'field', 'farm', 'land', 'continent', 'country', 'egypt', 'japan', 'china', 'india', 'france', 'italy', 'greece', 'america', 'canada', 'australia', 'africa', 'south america', 'new zealand', 'netherlands', 'europe', 'tundra', 'arctic', 'antarctica', 'canyon', 'court', 'road', 'rail', 'park', 'garden', 'graveyard')) {
    base(K('road', 'rail') ? 0x3a3a3a : ground);
    if (K('desert', 'dune', 'egypt')) { P.add(PG.hemi(), COL.sand, [-0.3, -0.5, 0.1], [0.5, 0.3, 0.5]); P.add(PG.hemi(), lt(COL.sand, 0.04), [0.35, -0.5, -0.2], [0.45, 0.22, 0.45]); if (K('egypt')) P.add(PG.cone(4), 0xe8c87a, [0.2, -0.15, 0.2], [0.35, 0.5, 0.35], [0, 0.785, 0]); else { P.add(PG.capsule(), 0x4c9a3a, [0.5, -0.25, 0.4], [0.12, 0.3, 0.12]); } return; }
    if (K('canyon')) { P.b(0.8, 0.8, 1.6, [-0.55, -0.15, 0], c); P.b(0.8, 0.7, 1.6, [0.55, -0.2, 0], dk(c, 0.04)); P.b(0.3, 0.05, 1.6, [0, -0.48, 0], 0x3a8ed8); return; }
    if (K('road', 'rail')) { for (let i = 0; i < 4; i++) P.b(0.08, 0.02, 0.25, [0, -0.5, -0.6 + i * 0.4], K('rail') ? COL.darkwood : 0xffffff); if (K('rail')) for (const x of [-0.2, 0.2]) P.b(0.04, 0.05, 1.6, [x, -0.48, 0], COL.steel); return; }
    if (K('graveyard')) { for (let i = 0; i < 4; i++) P.b(0.18, 0.3, 0.06, [(i % 2 - 0.5) * 0.7, -0.35, (Math.floor(i / 2) - 0.5) * 0.6], 0x9a9aa0, null, { round: true }); return; }
    if (K('court')) { P.b(1.4, 0.02, 0.02, [0, -0.5, 0], 0xffffff); P.b(0.02, 0.25, 1.5, [0, -0.4, 0], 0xf0f0f0); return; }
    if (K('field', 'farm', 'prairie', 'savanna')) { for (let i = 0; i < 4; i++) P.b(1.6, 0.06, 0.12, [0, -0.48, -0.5 + i * 0.33], K('savanna', 'prairie') ? 0xc8b050 : 0x9acf5a); if (K('savanna')) tree(0.4, 0.2, 1.1, 0x6a8a3a); return; }
    if (K('park', 'garden')) { tree(-0.4, 0.2); tree(0.45, -0.3, 1.2); for (let i = 0; i < 5; i++) P.s(0.06, [(P.rng() - 0.5) * 1.2, -0.45, (P.rng() - 0.5) * 1.2], [COL.red, COL.yellow, 0xff8ad8][i % 3]); return; }
    // countries, continents & land: patchwork
    for (let i = 0; i < 4; i++) P.add(PG.hemi(), shiftColor(c, 0, 0, (P.rng() - 0.5) * 0.15), [(P.rng() - 0.5) * 0.9, -0.5, (P.rng() - 0.5) * 0.9], [0.35, 0.12, 0.35]);
    tree(0.2, 0.3, 0.8);
    return;
  }
  if (K('forest', 'jungle', 'wilderness', 'kelp', 'rain forest', 'safari', 'nature')) { base(ground); for (let i = 0; i < 6; i++) tree((P.rng() - 0.5) * 1.3, (P.rng() - 0.5) * 1.3, 0.8 + P.rng() * 0.6, K('jungle', 'rain') ? 0x1f8a3c : K('kelp') ? 0x2a6b3f : COL.leaf); return; }
  if (K('cave', 'mine', 'tunnel', 'underground', 'crystal cave', 'hell', 'underworld')) {
    base(ground);
    P.add(displacedIco(1, hashStr(I.id), 0.15, 1, true), K('hell') ? 0x5a1a1a : 0x7a7070, [0, -0.25, 0], [0.9, 0.65, 0.8]);
    P.s(0.32, [0, -0.35, 0.65], 0x15151c, [1, 1.2, 0.3]);
    if (K('crystal')) for (let i = 0; i < 5; i++) P.add(PG.oct(), 0xc8a8ff, [(P.rng() - 0.5) * 1.2, -0.3 + P.rng() * 0.4, 0.5], 0.15, null, { glow: true });
    if (K('hell', 'underworld')) for (let i = 0; i < 5; i++) P.s(0.12, [(P.rng() - 0.5) * 1.2, -0.45, (P.rng() - 0.5) * 1.2], 0xff4a1a, null, { glow: true });
    if (K('mine')) { P.b(0.08, 0.6, 0.08, [-0.3, -0.3, 0.7], COL.wood); P.b(0.08, 0.6, 0.08, [0.3, -0.3, 0.7], COL.wood); P.b(0.75, 0.08, 0.1, [0, 0.0, 0.7], COL.wood); }
    return;
  }
  if (K('heaven', 'sunset', 'sunrise', 'horizon')) { base(K('heaven') ? 0xfff8e0 : 0x3a6ab8); P.add(PG.hemi(), K('sunset') ? 0xff8a3a : 0xffd23a, [0, -0.5, -0.3], 0.55, null, { glow: true }); return; }
  if (K('maze')) { base(0x6fb15b); for (let i = 0; i < 6; i++) P.b(i % 2 ? 1.2 : 0.12, 0.25, i % 2 ? 0.12 : 1.2, [(i % 3 - 1) * 0.45, -0.38, (Math.floor(i / 2) - 1) * 0.45], 0x3a8a3a); return; }
  if (K('coral reef')) { water(0x2a8ad8); for (let i = 0; i < 6; i++) P.seg([(i - 2.5) * 0.25, -0.45, (P.rng() - 0.5) * 0.6], [(i - 2.5) * 0.28, 0.0 + P.rng() * 0.3, (P.rng() - 0.5) * 0.6], 0.07, [0xff7f7f, 0xffb03a, 0xff5ad8][i % 3]); return; }
  if (K('fairy ring')) { base(0x6fb15b); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28; P.c(0.03, 0.15, [Math.cos(a) * 0.7, -0.42, Math.sin(a) * 0.7], 0xf4ecdc); P.add(PG.hemi(), 0xff5a8a, [Math.cos(a) * 0.7, -0.35, Math.sin(a) * 0.7], 0.1); } P.c(0.5, 0.02, [0, -0.49, 0], 0xff9aff, null, { glow: true }); return; }
  if (K('cosmic', 'pizza planet')) { BUILD.planet(P, I, kw); return; }
  base(ground); P.add(PG.hemi(), c, [0, -0.5, 0], [0.7, 0.45, 0.7]);
};

BUILD.gearParts = (P, pos, R, col) => {
  P.t(R, R * 0.22, pos, col, [0, 0, 0], { rs: 20 });
  P.c(R * 0.3, 0.08, pos, col, [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28; P.b(R * 0.28, R * 0.28, R * 0.28, [pos[0] + Math.cos(a) * R * 1.18, pos[1] + Math.sin(a) * R * 1.18, pos[2]], col, [0, 0, a]); }
};
BUILD.gear = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('propeller', 'fan', 'turbine', 'water wheel')) {
    P.c(0.18, 0.4, [0, 0, 0], COL.dark, [Math.PI / 2, 0, 0]);
    if (K('fan')) { P.t(0.95, 0.04, [0, 0, 0], COL.metal); P.c(0.06, 1.2, [0, -0.6, -0.2], COL.dark); P.c(0.4, 0.08, [0, -1.15, -0.2], COL.dark); }
    const sub = new Parts(I, P.rng), pv = new THREE.Vector3(0, 0, 0);
    const n = K('water wheel') ? 8 : K('turbine') ? 6 : 3;
    for (let i = 0; i < n; i++) { const a = i / n * 6.28; sub.b(0.22, 0.85, K('water wheel') ? 0.3 : 0.03, [Math.cos(a) * 0.48, Math.sin(a) * 0.48, 0.12], K('water wheel') ? COL.wood : c, [0, K('water wheel') ? 0 : 0.35, a - Math.PI / 2]); }
    if (K('water wheel')) sub.t(0.9, 0.05, [0, 0, 0.12], COL.darkwood);
    for (const p of sub.list) { p.anim = 'spinZ'; p.pivot = pv; P.list.push(p); }
    return;
  }
  if (K('engine', 'motor')) { P.b(1.0, 0.8, 0.8, [0, -0.2, 0], c, null, { round: true }); for (let i = 0; i < 3; i++) P.c(0.12, 0.45, [-0.3 + i * 0.3, 0.42, 0], COL.steel); BUILD.gearParts(P, [0.65, -0.2, 0], 0.3, COL.gold); return; }
  BUILD.gearParts(P, [0, 0, 0], 0.75, c);
  if (K('clockwork')) BUILD.gearParts(P, [0.75, 0.75, -0.2], 0.4, dk(c, 0.1));
};

BUILD.ring = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('rainbow')) { const cols = [0xff4a4a, 0xff9a3a, 0xffe14a, 0x5ad85a, 0x4a9aff, 0x9a5aff]; cols.forEach((col, i) => P.t(1.0 - i * 0.09, 0.05, [0, -0.35, 0], col, null, { arc: Math.PI, glow: true })); P.s(0.25, [-0.8, -0.4, 0], 0xffffff, [1.3, 0.7, 1]); P.s(0.25, [0.8, -0.4, 0], 0xffffff, [1.3, 0.7, 1]); return; }
  if (K('donut', 'bagel', 'pretzel')) { if (K('pretzel')) { P.add(PG.knot(), c, [0, 0, 0], 1); return; } P.t(0.65, 0.42, [0, 0, 0], c, [Math.PI / 2, 0, 0]); if (K('donut')) { P.t(0.65, 0.36, [0, 0.12, 0], 0xff8ac0, [Math.PI / 2, 0, 0], { arc: Math.PI * 2 }); for (let i = 0; i < 12; i++) { const a = P.rng() * 6.28; P.b(0.03, 0.03, 0.12, [Math.cos(a) * 0.65, 0.42, Math.sin(a) * 0.65], [COL.yellow, 0x5ab8ff, 0xffffff][i % 3], [0, a, 0]); } } return; }
  if (K('wheel', 'tire')) { P.t(0.72, 0.28, [0, 0, 0], 0x2a2a2a, null, { rs: 28 }); P.c(0.45, 0.3, [0, 0, 0], COL.metal, [Math.PI / 2, 0, 0]); for (let i = 0; i < 5; i++) P.b(0.06, 0.8, 0.1, [0, 0, 0], COL.steel, [0, 0, i * 0.628]); return; }
  if (K('chain')) { for (let i = 0; i < 4; i++) P.t(0.3, 0.08, [(i - 1.5) * 0.45, 0, 0], c, [i % 2 ? Math.PI / 2 : 0, 0, 0], { rs: 16 }); return; }
  if (K('olympics')) { [0x3a8aff, 0x15151c, 0xe83a3a, 0xffd23a, 0x3ac05a].forEach((col, i) => P.t(0.32, 0.05, [(i % 3 - 1) * 0.68 + (i > 2 ? 0.34 : 0), i > 2 ? -0.3 : 0, 0], col)); return; }
  if (K('headphones')) { P.t(0.7, 0.08, [0, 0.1, 0], c, null, { arc: Math.PI }); for (const x of [-0.7, 0.7]) P.c(0.3, 0.25, [x, -0.05, 0], COL.dark, [0, 0, Math.PI / 2]); return; }
  if (K('rope', 'thread', 'string', 'yarn', 'wire', 'coil', 'tape', 'spiral', 'spin', 'cable', 'necklace', 'bracelet', 'handle')) {
    if (K('necklace', 'bracelet')) { for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28; P.s(0.1, [Math.cos(a) * 0.75, Math.sin(a) * 0.75, 0], i % 4 ? c : 0xfff8f0); } return; }
    if (K('tape')) { P.t(0.6, 0.32, [0, 0, 0], c, null, { rs: 24 }); P.c(0.38, 0.6, [0, 0, 0], 0xc8a060, [Math.PI / 2, 0, 0]); return; }
    if (K('handle')) { P.t(0.6, 0.12, [0, 0, 0], c, null, { arc: Math.PI }); return; }
    for (let i = 0; i < 6; i++) P.t(0.55 - (K('spiral') ? i * 0.07 : 0), 0.1, [0, -0.5 + i * 0.2, 0], shiftColor(c, 0, 0, (i % 2) * 0.05), [Math.PI / 2 + 0.15, 0, 0], { rs: 18 });
    return;
  }
  if (K('portal', 'wormhole', 'time loop', 'teleporter', 'particle accelerator', 'orbit', 'halo', 'zero', 'circle', 'hoop')) {
    const glow = !K('zero', 'circle', 'hoop');
    P.t(0.9, K('orbit', 'halo') ? 0.06 : 0.14, [0, 0, 0], c, null, { glow, rs: 36 });
    if (K('portal', 'wormhole', 'teleporter')) P.c(0.82, 0.02, [0, 0, 0], lt(c, 0.25), [Math.PI / 2, 0, 0], { glow: true, seg: 28 });
    if (K('orbit')) P.s(0.15, [0.9, 0, 0], 0x5a8ad8);
    if (K('teleporter')) P.c(0.9, 0.15, [0, -0.1, 0], COL.steel, null, { seg: 28 });
    return;
  }
  // jewellery ring
  P.t(0.7, 0.12, [0, -0.15, 0], c, null, { rs: 28 });
  P.add(PG.oct(), 0xcff4ff, [0, 0.62, 0], [0.25, 0.3, 0.25]);
};

BUILD.skull = (P, I) => { const c = I.color; P.s(0.75, [0, 0.15, 0], c); P.b(0.75, 0.4, 0.6, [0, -0.45, 0.25], c, null, { round: true }); P.s(0.2, [-0.27, 0.12, 0.6], COL.dark, [1, 1.1, 0.6]); P.s(0.2, [0.27, 0.12, 0.6], COL.dark, [1, 1.1, 0.6]); P.add(PG.cone(3), COL.dark, [0, -0.15, 0.68], [0.08, 0.14, 0.05], [0, 0, Math.PI]); for (let i = 0; i < 5; i++) P.b(0.07, 0.12, 0.04, [-0.2 + i * 0.1, -0.55, 0.54], COL.dark); };
BUILD.bone = (P, I, kw) => {
  const c = I.color;
  if (hasKw(kw, 'fossil')) { P.add(displacedIco(1, hashStr(I.id), 0.15, 1, true), 0xb8a888, [0, 0, 0], [1, 0.4, 0.9]); for (let i = 0; i < 5; i++) P.b(0.5 - Math.abs(i - 2) * 0.1, 0.05, 0.06, [0, 0.35, -0.4 + i * 0.2], 0xf0e8d0); P.b(0.06, 0.05, 1.0, [0, 0.37, 0], 0xf0e8d0); return; }
  if (hasKw(kw, 'teeth', 'tooth')) { P.s(0.5, [0, 0.25, 0], c, [1, 0.8, 0.9]); P.k(0.18, 0.6, [-0.2, -0.3, 0], c, [Math.PI, 0, 0.15]); P.k(0.18, 0.6, [0.2, -0.3, 0], c, [Math.PI, 0, -0.15]); return; }
  P.c(0.16, 1.4, [0, 0, 0], c, [0, 0, Math.PI / 2]);
  for (const x of [-0.75, 0.75]) { P.s(0.24, [x, 0.15, 0], c); P.s(0.24, [x, -0.15, 0], c); }
};
BUILD.bomb = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('dynamite')) { for (const [x, z] of [[-0.25, 0], [0.25, 0], [0, 0.3]]) P.c(0.22, 1.3, [x, 0, z], c); P.b(0.8, 0.15, 0.7, [0, 0, 0.1], 0xd8b060); P.c(0.02, 0.45, [0, 0.85, 0.1], COL.dark); P.s(0.07, [0, 1.1, 0.1], 0xffb03a, null, { glow: true }); return; }
  if (K('atomic')) { P.add(PG.capsule(), c, [0, 0, 0], [0.7, 1.3, 0.7], [0, 0, Math.PI / 2]); for (let i = 0; i < 4; i++) P.add(PG.cone(3), c, [-0.95, 0, 0], [0.35, 0.5, 0.05], [0, i * Math.PI / 4, Math.PI / 2]); P.add(PG.star(3, 0.4, 0.05), COL.yellow, [0, 0, 0.36], 0.25); return; }
  P.s(0.78, [0, -0.1, 0], c, null, { seg: 20 });
  if (K('grenade')) for (let i = 0; i < 4; i++) P.t(0.76, 0.03, [0, -0.1, 0], dk(c, 0.1), [0, i * 0.785, 0]);
  P.c(0.2, 0.2, [0, 0.72, 0], COL.steel);
  P.seg([0, 0.82, 0], [0.18, 1.12, 0], 0.03, 0xd8b060);
  P.s(0.08, [0.2, 1.16, 0], 0xffd23a, null, { glow: true });
  P.s(0.18, [-0.3, 0.2, 0.55], lt(c, 0.35));
};
BUILD.lamp = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('candle')) { P.c(0.32, 1.1, [0, -0.3, 0], 0xfff2d8); P.c(0.02, 0.15, [0, 0.32, 0], COL.dark); P.s(0.12, [0, 0.48, 0], 0xffb03a, [1, 1.8, 1], { glow: true }); P.s(0.06, [0, 0.45, 0], 0xfff8c0, [1, 1.6, 1], { glow: true }); return; }
  if (K('lantern')) { P.c(0.5, 0.1, [0, 0.7, 0], COL.dark); P.c(0.5, 0.1, [0, -0.7, 0], COL.dark); P.c(0.42, 1.3, [0, 0, 0], 0xfff0c0, null, { glow: true }); for (let i = 0; i < 4; i++) P.c(0.03, 1.4, [Math.cos(i * 1.57) * 0.48, 0, Math.sin(i * 1.57) * 0.48], COL.dark); P.t(0.2, 0.04, [0, 0.9, 0], COL.dark); return; }
  if (K('siren')) { P.add(PG.hemi(), c, [0, -0.3, 0], 0.7, null, { glow: true }); P.c(0.75, 0.2, [0, -0.4, 0], COL.dark); return; }
  if (K('lava lamp')) { P.add(PG.frustum(0.5, 12), COL.glass, [0, 0, 0], [0.45, 1.3, 0.45]); for (let i = 0; i < 4; i++) P.s(0.13, [(P.rng() - 0.5) * 0.25, -0.4 + i * 0.25, 0], c, [1, 1.3, 1], { glow: true }); P.f(0.25, 0.45, 0.4, [0, -0.8, 0], COL.steel); P.k(0.25, 0.25, [0, 0.78, 0], COL.steel); return; }
  if (K('lamp') && !K('lava')) { P.f(0.35, 0.7, 0.6, [0, 0.45, 0], c); P.s(0.2, [0, 0.25, 0], 0xfff2a0, null, { glow: true }); P.c(0.04, 1.0, [0, -0.35, 0], COL.steel); P.c(0.4, 0.08, [0, -0.85, 0], COL.steel); return; }
  // light bulb / idea
  P.s(0.65, [0, 0.25, 0], 0xfff6c0, null, { glow: true, seg: 20 });
  P.c(0.3, 0.45, [0, -0.55, 0], COL.metal); for (let i = 0; i < 3; i++) P.t(0.3, 0.04, [0, -0.4 - i * 0.12, 0], COL.steel, [Math.PI / 2, 0, 0]);
  P.s(0.12, [0, -0.85, 0], COL.dark);
};
BUILD.shield = (P, I, kw) => { const c = I.color; P.s(0.9, [0, 0, 0], c, [1, 1.1, 0.28], { colorFn: hasKw(kw, 'dragon') ? (x, y, z) => ((x * 5 | 0) + (y * 5 | 0)) & 1 ? c : dk(c, 0.1) : null }); P.t(0.88, 0.06, [0, 0, 0.05], COL.steel, [0, 0, 0], { rs: 28 }); P.s(0.22, [0, 0, 0.22], COL.gold, [1, 1, 0.5]); };
BUILD.crown = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('hat') && !K('top')) { P.c(0.55, 0.5, [0, 0.1, 0], c); P.c(0.95, 0.06, [0, -0.15, 0], c); P.c(0.57, 0.12, [0, -0.05, 0], COL.red); return; }
  if (K('top hat')) { P.c(0.5, 0.9, [0, 0.2, 0], c); P.c(0.85, 0.06, [0, -0.25, 0], c); P.c(0.52, 0.12, [0, -0.15, 0], COL.red); return; }
  P.add(PG.tube(24), c, [0, -0.2, 0], [0.75, 0.45, 0.75]);
  P.t(0.75, 0.06, [0, -0.42, 0], c, [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; P.k(0.13, 0.4, [Math.cos(a) * 0.72, 0.18, Math.sin(a) * 0.72], c, null, { seg: 8 }); P.s(0.07, [Math.cos(a) * 0.72, 0.4, Math.sin(a) * 0.72], c); P.add(PG.oct(), [COL.red, 0x3a8aff, 0x3ac05a][i % 3], [Math.cos(a) * 0.76, -0.2, Math.sin(a) * 0.76], 0.09); }
};
BUILD.key = (P, I, kw) => { const c = I.color; P.t(0.32, 0.09, [-0.6, 0, 0], c, null, { rs: 20 }); P.c(0.07, 1.1, [0.2, 0, 0], c, [0, 0, Math.PI / 2]); for (let i = 0; i < 3; i++) P.b(0.08, 0.2 + (i % 2) * 0.1, 0.08, [0.45 + i * 0.13, -0.15, 0], c); if (hasKw(kw, 'password')) P.s(0.12, [-0.6, 0, 0], 0x5affff, null, { glow: true }); };
BUILD.clock = (P, I, kw) => {
  const K = (...w) => hasKw(kw, ...w), c = I.color;
  if (K('sundial')) { P.c(0.95, 0.15, [0, -0.3, 0], c); P.add(PG.cone(3), COL.steel, [0, 0.0, 0], [0.04, 0.5, 0.45], [0, 0, 0]); return; }
  P.c(0.85, 0.22, [0, 0, 0], K('compass') ? COL.gold : c, [Math.PI / 2, 0, 0], { seg: 28 });
  P.c(0.75, 0.02, [0, 0, 0.12], 0xfdfdf8, [Math.PI / 2, 0, 0], { seg: 28 });
  if (K('compass')) { P.add(PG.cone(4), COL.red, [0, 0.25, 0.15], [0.1, 0.5, 0.03]); P.add(PG.cone(4), 0xf8f8f8, [0, -0.25, 0.15], [0.1, 0.5, 0.03], [0, 0, Math.PI]); return; }
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; P.b(0.04, 0.1, 0.02, [Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0.13], COL.dark, [0, 0, a + Math.PI / 2]); }
  P.b(0.05, 0.45, 0.02, [0, 0.2, 0.14], COL.dark); P.b(0.05, 0.32, 0.02, [0.12, -0.1, 0.14], COL.dark, [0, 0, 1.1]);
  if (K('alarm')) { P.add(PG.hemi(), c, [-0.5, 0.75, 0], 0.25, [0, 0, 0.5]); P.add(PG.hemi(), c, [0.5, 0.75, 0], 0.25, [0, 0, -0.5]); P.c(0.04, 0.3, [-0.45, -0.85, 0], COL.dark, [0, 0, 0.4]); P.c(0.04, 0.3, [0.45, -0.85, 0], COL.dark, [0, 0, -0.4]); }
  if (K('watch')) { P.b(0.55, 0.9, 0.08, [0, 0.95, -0.04], COL.dark); P.b(0.55, 0.9, 0.08, [0, -0.95, -0.04], COL.dark); }
};
BUILD.magnet = (P, I) => { const c = I.color; P.t(0.55, 0.22, [0, 0.1, 0], c, null, { arc: Math.PI }); P.b(0.44, 0.7, 0.44, [-0.55, -0.25, 0], c); P.b(0.44, 0.7, 0.44, [0.55, -0.25, 0], c); P.b(0.45, 0.22, 0.45, [-0.55, -0.68, 0], 0xe8ecf0); P.b(0.45, 0.22, 0.45, [0.55, -0.68, 0], 0xe8ecf0); };
BUILD.bell = (P, I) => { const c = I.color; P.add(PG.lathe('bell', [[0, 0.75], [0.3, 0.72], [0.42, 0.4], [0.5, -0.2], [0.78, -0.6], [0.8, -0.68], [0, -0.68]]), c, [0, 0, 0], 1); P.s(0.15, [0, -0.75, 0], dk(c, 0.1)); P.t(0.15, 0.04, [0, 0.85, 0], c); };
BUILD.umbrella = (P, I, kw) => { const c = I.color; P.add(PG.hemi(), c, [0, 0.3, 0], [1.0, 0.55, 1.0], null, { colorFn: (x, y, z) => (Math.atan2(z, x) * 4 / Math.PI & 1) ? c : 0xffffff }); P.c(0.03, 1.4, [0, -0.3, 0], COL.dark); if (hasKw(kw, 'parachute')) { for (let i = 0; i < 4; i++) P.seg([Math.cos(i * 1.57) * 0.9, 0.3, Math.sin(i * 1.57) * 0.9], [0, -0.8, 0], 0.008, COL.dark); P.b(0.3, 0.3, 0.3, [0, -0.9, 0], COL.dark); } else P.t(0.1, 0.03, [0.1, -1.0, 0], COL.dark, null, { arc: Math.PI }); };
BUILD.flag = (P, I) => { const c = I.color; P.c(0.04, 2.2, [-0.6, -0.1, 0], COL.steel); for (let i = 0; i < 5; i++) P.b(0.25, 0.8, 0.04, [-0.45 + i * 0.24, 0.6, Math.sin(i * 1.4) * 0.06], i % 2 ? c : dk(c, 0.06)); };

// ---------------------------------------------------------------- modifier accessories
function applyModifierFx(P, info) {
  const fx = new Set(info.fx || []);
  if (!info.mods || !info.mods.length) return;
  const box = P.bbox(), top = box.max.y, sz = new THREE.Vector3(); box.getSize(sz);
  const w = Math.max(sz.x, sz.z) * 0.5;
  if (fx.has('crown')) { const r = w * 0.45; P.add(PG.tube(20), COL.gold, [0, top + 0.12, 0], [r, 0.25, r]); for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; P.k(0.07, 0.22, [Math.cos(a) * r, top + 0.32, Math.sin(a) * r], COL.gold, null, { seg: 6 }); } P.add(PG.oct(), COL.red, [0, top + 0.12, r], 0.07); }
  if (fx.has('tiara')) { P.t(w * 0.5, 0.04, [0, top + 0.05, 0], 0xffd8f0, [Math.PI / 2, 0, 0], { arc: Math.PI }); P.add(PG.oct(), 0xff8ad8, [0, top + 0.12, w * 0.5], 0.09); }
  if (fx.has('halo')) P.t(w * 0.5 + 0.1, 0.035, [0, top + 0.28, 0], 0xfff2a0, [Math.PI / 2, 0, 0], { glow: true });
  if (fx.has('horns')) { P.k(0.08, 0.35, [-w * 0.45, top + 0.1, 0], 0x2a0a0a, [0, 0, 0.4]); P.k(0.08, 0.35, [w * 0.45, top + 0.1, 0], 0x2a0a0a, [0, 0, -0.4]); }
  if (fx.has('piratehat')) { P.add(PG.cone(3), COL.dark, [0, top + 0.12, 0], [w * 0.7, 0.28, w * 0.7], [0, Math.PI / 6, 0]); P.s(0.06, [0, top + 0.12, w * 0.55], 0xffffff); }
  if (fx.has('headband')) P.t(w * 0.85, 0.05, [0, top - sz.y * 0.15, 0], COL.red, [Math.PI / 2, 0, 0]);
  if (fx.has('antenna')) { P.c(0.02, 0.35, [0, top + 0.17, 0], COL.steel); P.s(0.07, [0, top + 0.36, 0], 0xff3a3a, null, { glow: true }); }
  if (fx.has('glasses')) { const z = box.max.z; P.t(0.13, 0.025, [-0.15, top - sz.y * 0.25, z + 0.02], COL.dark); P.t(0.13, 0.025, [0.15, top - sz.y * 0.25, z + 0.02], COL.dark); P.b(0.08, 0.025, 0.02, [0, top - sz.y * 0.25, z + 0.02], COL.dark); }
  if (fx.has('fuse')) { P.seg([0, top, 0], [0.12, top + 0.25, 0], 0.025, 0xd8b060); P.s(0.06, [0.13, top + 0.28, 0], 0xffd23a, null, { glow: true }); }
  if (fx.has('gears')) BUILD.gearParts(P, [box.max.x, (box.min.y + top) / 2, 0], 0.22, 0xc8a060);
  if (fx.has('spikes')) for (let i = 0; i < 10; i++) { const u = P.rng() * 1.6 - 0.6, a = P.rng() * 6.28, r = Math.sqrt(Math.max(0, 1 - u * u)); const v = new THREE.Vector3(r * Math.cos(a), u, r * Math.sin(a)); P.add(PG.cone(6), 0xd8d0c0, [v.x * w * 0.95, v.y * sz.y * 0.5 + (box.min.y + top) / 2, v.z * w * 0.95], [0.06, 0.25, 0.06], new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v)); }
  if (fx.has('cape')) P.b(w * 1.1, sz.y * 0.75, 0.04, [0, (box.min.y + top) / 2, box.min.z - 0.04], info.mods.includes('vampire') ? 0x1a0a14 : COL.red, [-0.15, 0, 0]);
  if (fx.has('wings') && !info.tags.includes('flying')) {
    for (const s of [-1, 1]) { const sub = new Parts(info, P.rng), pv = new THREE.Vector3(s * w * 0.6, (box.min.y + top) / 2 + 0.1, 0); sub.s(0.45, [s * (w * 0.6 + 0.4), (box.min.y + top) / 2 + 0.15, -0.05], 0xffffff, [1, 0.1, 0.5]); for (const p of sub.list) { p.anim = s < 0 ? 'wingL' : 'wingR'; p.pivot = pv; P.list.push(p); } }
  }
}

// ---------------------------------------------------------------- build + cache
const ROUND_SHAPES = new Set(['orb', 'flame', 'rock', 'blob', 'liquid', 'gas', 'cloud', 'spike', 'celestial', 'planet', 'moon', 'abstract', 'fruit', 'egg', 'candy', 'bomb', 'galaxy', 'blackhole', 'mushroom']);
const VisualCache = new Map();

function buildVisual(info) {
  let v = VisualCache.get(info.id);
  if (v) return v;
  const rng = makeRng(hashStr(info.id, 99));
  const P = new Parts(info, rng);
  const kw = kwOf(info);
  const fn = BUILD[info.shape] || BUILD.blob;
  try { fn(P, info, kw, rng); } catch (e) { console.warn('shape build failed', info.id, e); P.list.length = 0; BUILD.blob(P, info, kw); }
  if (!P.list.length) BUILD.blob(P, info, kw);
  applyModifierFx(P, info);
  const box = P.bbox(), center = new THREE.Vector3(), size = new THREE.Vector3();
  box.getCenter(center); box.getSize(size);
  const half = Math.max(size.x, size.y, size.z) / 2 || 1;
  const real = realSize(info);
  const s = (real / 2) / half;
  const body = mergeParts(P.list.filter(p => !p.glow && !p.anim), center);
  const glow = mergeParts(P.list.filter(p => p.glow && !p.anim), center);
  const animGroups = new Map();
  for (const p of P.list) if (p.anim) { if (!animGroups.has(p.anim)) animGroups.set(p.anim, { name: p.anim, pivot: p.pivot.clone().sub(center), parts: [] }); animGroups.get(p.anim).parts.push(p); }
  const anims = [...animGroups.values()].map(g => {
    const off = g.pivot.clone().add(center);
    return { name: g.name, pivot: g.pivot, body: mergeParts(g.parts.filter(p => !p.glow), off), glow: mergeParts(g.parts.filter(p => p.glow), off) };
  });
  const he = size.clone().multiplyScalar(s * 0.5);
  // compound collider: one box per significant part, so a house collides with its walls and roof,
  // not with an oversized bounding box
  const tb = new THREE.Box3(), boxes = [];
  for (const p of P.list) {
    if (p.anim) continue;
    if (!p.geo.boundingBox) p.geo.computeBoundingBox();
    tb.copy(p.geo.boundingBox).applyMatrix4(p.matrix);
    const c = new THREE.Vector3(), z = new THREE.Vector3(); tb.getCenter(c); tb.getSize(z);
    c.sub(center).multiplyScalar(s); z.multiplyScalar(s * 0.5);
    boxes.push({ c, he: z, vol: Math.max(z.x, 0.01) * Math.max(z.y, 0.01) * Math.max(z.z, 0.01) });
  }
  boxes.sort((a, b2) => b2.vol - a.vol);
  const kept = [];
  for (const bx of boxes) {
    if (kept.length >= 12) break;
    const inside = kept.some(k => Math.abs(bx.c.x - k.c.x) + bx.he.x <= k.he.x + 1e-3 && Math.abs(bx.c.y - k.c.y) + bx.he.y <= k.he.y + 1e-3 && Math.abs(bx.c.z - k.c.z) + bx.he.z <= k.he.z + 1e-3);
    if (!inside && bx.vol > he.x * he.y * he.z * 0.002) kept.push(bx);
  }
  const round = ROUND_SHAPES.has(info.shape) && (Math.max(he.x, he.y, he.z) / Math.max(0.01, Math.min(he.x, he.y, he.z)) < 1.8);
  v = {
    body, glow, anims, scale: s, real, halfExtents: he, radius: he.length() * 0.92, top: he.y,
    collider: round ? { type: 'sphere', r: (he.x + he.y + he.z) / 3 * 0.95 } : { type: 'box', he: he.clone().multiplyScalar(0.92), boxes: kept },
  };
  if (VisualCache.size > 240) { const k = VisualCache.keys().next().value; const old = VisualCache.get(k); if (!old.refs) { old.body && old.body.dispose(); old.glow && old.glow.dispose(); } VisualCache.delete(k); }
  VisualCache.set(info.id, v);
  return v;
}
