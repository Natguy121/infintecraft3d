// ============================================================================
//  ELEMENTAL LAB — 20g · First-person hands, build mode, the island,
//  photo mode and sharing
// ============================================================================

const SITE_URL = 'https://natguy121.github.io/infintecraft3d/';

// ---------------------------------------------------------------- hands (drawn after post-fx so they stay sharp)
const Hands = {
  scene: null, cam: null, L: null, R: null, swing: 0, t: 0, reach: 0,
  init() {
    const s = this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 5);
    s.add(new THREE.HemisphereLight(0xffffff, 0x8a8a9a, 1.1));
    const d = new THREE.DirectionalLight(0xffffff, 1.4); d.position.set(1, 2, 1); s.add(d);
    this.L = this.arm(-1); this.R = this.arm(1);
    this.applyLook();
  },
  arm(side) {
    const g = new THREE.Group();
    this.sleeveMat = this.sleeveMat || new THREE.MeshStandardMaterial({ color: 0x3a6ea8, roughness: 0.85 });
    this.skinMat = this.skinMat || new THREE.MeshStandardMaterial({ color: 0xf1c9a5, roughness: 0.6 });
    const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.32, 6, 12), this.sleeveMat); sleeve.rotation.x = Math.PI / 2; sleeve.position.z = 0.1;
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.03, 14), this.sleeveMat); cuff.rotation.x = Math.PI / 2; cuff.position.z = -0.1;
    const wrist = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.06, 4, 10), this.skinMat); wrist.rotation.x = Math.PI / 2; wrist.position.z = -0.15;
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.03, 0.09), this.skinMat); palm.position.set(0, 0, -0.22);
    g.add(sleeve, cuff, wrist, palm);
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.05, 3, 6), this.skinMat); f.rotation.x = Math.PI / 2 + 0.25; f.position.set(-0.03 + i * 0.02, -0.006, -0.29); g.add(f); }
    const th = new THREE.Mesh(new THREE.CapsuleGeometry(0.013, 0.04, 3, 6), this.skinMat); th.rotation.set(Math.PI / 2, 0, side * 0.9); th.position.set(-side * 0.05, 0, -0.23); g.add(th);
    this.scene.add(g);
    g.userData.side = side;
    return g;
  },
  applyLook() { const L = Skins.look(); if (this.skinMat) { this.skinMat.color.setHex(L.skin); this.sleeveMat.color.setHex(L.shirt); } },
  update(dt) {
    if (!this.scene) return;
    const sp = Player.body ? Math.hypot(Player.body.velocity.x, Player.body.velocity.z) : 0;
    this.t += dt * (sp > 0.5 ? 2 + sp * 1.4 : 1);
    if (Input.mouse && Input.mouse.r && Player.held) this.swing = 1;
    this.swing = Math.max(0, this.swing - dt * 3.2);
    const held = Player.held && !Player.held.dead;
    this.reach += ((held ? 1 : 0) - this.reach) * Math.min(1, dt * 10);
    const bob = Math.sin(this.t * 2) * 0.012 * Math.min(1, sp / 3), sway = Math.cos(this.t) * 0.008 * Math.min(1, sp / 3);
    const idle = Math.sin(G.rtime * 1.3) * 0.004;
    for (const a of [this.L, this.R]) {
      const s = a.userData.side, isR = s > 0;
      const r = isR ? this.reach : this.reach * 0.6, sw = isR ? this.swing : 0;
      a.position.set(s * (0.21 - r * 0.03) + sway, -0.21 + bob + idle + r * 0.03 + sw * 0.06, -0.3 - r * 0.06 - sw * 0.16);
      a.rotation.set(-0.05 + r * 0.12 - sw * 0.5, s * (0.12 - r * 0.06), s * (-0.2 + r * 0.1));
      a.scale.setScalar(0.85);
    }
  },
  render(r) {
    if (!this.scene || !G.started || G.ui || Photo.active || Settings.hands === false) return;
    this.cam.aspect = innerWidth / innerHeight; this.cam.updateProjectionMatrix();
    const ac = r.autoClear; r.autoClear = false; r.clearDepth(); r.render(this.scene, this.cam); r.autoClear = ac;
  },
};

// ---------------------------------------------------------------- build mode: pin items in place (saved)
const Build = {
  init() {
    Ext.register('base', () => G.entities.filter(e => e.placed && !e.dead && !e.merging).slice(0, 250).map(e => {
      const p = e.root.position, q = e.root.quaternion, f = (v) => +v.toFixed(3);
      return [e.id, f(p.x), f(p.y), f(p.z), f(q.x), f(q.y), f(q.z), f(q.w)];
    }));
    const list = Ext.take('base') || [];
    setTimeout(() => { for (const r of list) if (Array.isArray(r) && Universe.isValidId(r[0])) { const e = spawnItem(r[0], new THREE.Vector3(r[1], r[2], r[3]), { noPop: true }); if (e) { e.body.quaternion.set(r[4], r[5], r[6], r[7]); e.root.quaternion.set(r[4], r[5], r[6], r[7]); this.pin(e, true); } } }, 200);
  },
  pin(e, quiet) {
    if (!e || !e.body || e.remote || e.pet) return;
    const b = e.body;
    e._mass = e._mass || b.mass; e.placed = true;
    if (Player.held === e) Player.drop(false);
    b.type = CANNON.Body.STATIC; b.mass = 0; b.updateMassProperties(); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0);
    if (!quiet) {
      // tidy: snap the yaw to 45° steps
      const eu = new THREE.Euler().setFromQuaternion(e.root.quaternion, 'YXZ');
      const yaw = Math.round(eu.y / (Math.PI / 4)) * (Math.PI / 4);
      b.quaternion.setFromEuler(0, yaw, 0); e.root.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
      Particles.emit({ pos: e.root.position, color: [0x7a5cff, 0xffffff], count: 14, speed: 1, size: 0.05, life: 0.5 });
      Sound.tone(660, 0.1, { vol: 0.12, glide: 880 });
      UI.toast('📌', `${e.info.name} placed`, 'It stays exactly here, even after you reload. Press B on it again (or grab it) to unpin.');
      Save.markDirty();
    }
  },
  unpin(e) {
    if (!e || !e.placed || !e.body) return;
    const b = e.body; e.placed = false;
    b.type = CANNON.Body.DYNAMIC; b.mass = e._mass || 1; b.updateMassProperties(); b.wakeUp();
    Sound.tone(520, 0.1, { vol: 0.1, glide: 360 });
    Save.markDirty();
  },
  update() {
    if (!Input.pressed.has('KeyB') || !G.locked || G.ui) return;
    const t = Player.held || (G.lookTarget && G.lookTarget.kind === 'entity' ? G.lookTarget.obj : null);
    if (!t) { UI.toast('📌', 'Build mode', 'Hold an item where you want it and press B to pin it there. Build towers, houses, a whole base!'); return; }
    if (t.placed) { this.unpin(t); UI.toast('📌', `${t.info.name} unpinned`, ''); } else this.pin(t);
  },
};

// ---------------------------------------------------------------- the island outside the east door
const Island = {
  X0: 60, X1: 150, Z0: -45, Z1: 45,
  build(g) {
    const { X0, X1, Z0, Z1 } = this, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2, W = X1 - X0, D = Z1 - Z0;
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(W - 8, D - 8, 30, 30), new THREE.MeshStandardMaterial({ color: 0x6ab04a, roughness: 0.95 }));
    const pos = grass.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, (Math.abs(x) < W / 2 - 6 && Math.abs(y) < D / 2 - 6) ? Math.sin(x * 0.15) * Math.cos(y * 0.13) * 0.12 : 0); }
    grass.geometry.computeVertexNormals();
    grass.rotation.x = -Math.PI / 2; grass.position.set(cx + 4, 0.02, cz); grass.receiveShadow = true; g.add(grass);
    const sand = new THREE.Mesh(new THREE.PlaneGeometry(W + 4, D + 6), new THREE.MeshStandardMaterial({ color: 0xead9a8, roughness: 1 }));
    sand.rotation.x = -Math.PI / 2; sand.position.set(cx + 2, 0.005, cz); sand.receiveShadow = true; g.add(sand);
    const sea = this.sea = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), new THREE.MeshStandardMaterial({ color: 0x2a9ad0, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.92 }));
    sea.rotation.x = -Math.PI / 2; sea.position.set(cx + 150, -0.35, cz); g.add(sea);
    // ground + invisible shoreline walls
    Phys.addStaticBox([cx + 2, -0.5, cz], [W + 4, 1, D + 6]);
    Phys.addStaticBox([X1 + 4.5, 5, cz], [1, 10, D + 8]);
    Phys.addStaticBox([cx + 2, 5, Z0 - 3.5], [W + 6, 10, 1]);
    Phys.addStaticBox([cx + 2, 5, Z1 + 3.5], [W + 6, 10, 1]);
    // decor: palms, trees, rocks, a pond, flowers (visual meshes + simple colliders)
    const rng = makeRng(777);
    const deco = (id, x, z, rot = 0) => {
      const info = Universe.get(id); if (!info) return;
      const vis = buildVisual(info), built = buildItemMeshes(info, vis);
      const holder = new THREE.Group(); holder.add(built.inner); holder.rotation.y = rot;
      const bb = new THREE.Box3().setFromObject(holder); holder.position.set(x, -bb.min.y + 0.02, z);
      holder.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      g.add(holder);
      if (vis.radius > 0.5) Phys.addStaticBox([x, vis.radius, z], [Math.min(vis.radius * 0.5, 1.2), vis.radius * 2, Math.min(vis.radius * 0.5, 1.2)]);
    };
    for (let i = 0; i < 22; i++) { const a = rng() * Math.PI * 2, r = 0.82 + rng() * 0.1; deco(rng() < 0.7 ? 'palm-tree' : 'coconut', cx + 2 + Math.cos(a) * (W / 2) * r, cz + Math.sin(a) * (D / 2) * r, rng() * 6); }
    for (let i = 0; i < 16; i++) deco(['tree', 'oak', 'pine-tree', 'bush', 'flower', 'rock', 'boulder', 'mushroom', 'sunflower'][Math.floor(rng() * 9)], cx - 10 + rng() * 50, cz - 30 + rng() * 60, rng() * 6);
    for (const id of ['pond', 'campfire', 'tent']) deco(id, cx + 5 + rng() * 20, cz - 10 + rng() * 20, rng() * 6);
  },
  update(dt) { if (this.sea) this.sea.position.y = -0.35 + Math.sin(G.time * 0.6) * 0.04; },
};

// ---------------------------------------------------------------- photo mode
const Photo = {
  active: false,
  init() {
    const box = el('div'); box.id = 'photo-box'; box.className = 'hidden';
    box.innerHTML = `<div class="photo-card"><img id="photo-img" alt="Your Elemental Lab photo"><div class="acct-btns"><button id="photo-dl" class="primary">💾 Save</button><button id="photo-share">📤 Share</button><button id="photo-close">✕ Close</button></div></div>`;
    document.body.appendChild(box);
    $('photo-close').onclick = () => { box.classList.add('hidden'); this.active = false; };
    $('photo-dl').onclick = () => { const a = el('a'); a.href = this.url; a.download = `elemental-lab-${Date.now()}.jpg`; a.click(); };
    $('photo-share').onclick = () => this.share();
  },
  update() {
    if (Input.pressed.has('KeyP') && G.started && !G.ui) this.capture();
  },
  capture() {
    this.active = true;
    const r = G.renderer;
    Post.render(r, G.scene, G.camera, 0);
    const src = r.domElement, c = el('canvas'); c.width = src.width; c.height = src.height;
    const x = c.getContext('2d'); x.drawImage(src, 0, 0);
    const s = Math.max(14, c.height / 28);
    x.font = `800 ${s}px ui-rounded, system-ui, sans-serif`; x.fillStyle = 'rgba(255,255,255,.85)'; x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 6;
    x.fillText('⚗️ Elemental Lab', s * 0.8, c.height - s * 0.9);
    this.url = c.toDataURL('image/jpeg', 0.9);
    $('photo-img').src = this.url;
    $('photo-box').classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
    UI.flash(0.6); try { Sound.noiseBurst(0.08, { vol: 0.2, type: 'highpass', freq: 3000 }); } catch (e) { /* */ }
  },
  async share() {
    try {
      const blob = await (await fetch(this.url)).blob();
      const file = new File([blob], 'elemental-lab.jpg', { type: 'image/jpeg' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Elemental Lab', text: `Look at my lab! Play free: ${SITE_URL}` }); return; }
    } catch (e) { /* fall through */ }
    Share.text(`Look at my lab in Elemental Lab! Play free: ${SITE_URL}`);
  },
};

// ---------------------------------------------------------------- sharing
const Share = {
  async text(t) {
    try { if (navigator.share) { await navigator.share({ title: 'Elemental Lab', text: t, url: SITE_URL }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(t); UI.toast('📋', 'Copied!', 'Paste it anywhere to share.'); } catch (e) { prompt('Copy this to share:', t); }
  },
  item(id) { const I = Universe.get(id); if (I) this.text(`I discovered ${I.emoji} ${I.name} in Elemental Lab (Infinite Craft in 3D)! Can you make it? ${SITE_URL}`); },
  progress() { this.text(`I've discovered ${fmtInt(Progress.order.length)} items in Elemental Lab (Infinite Craft in 3D) and I'm level ${Progress.stats.level || 1}! Can you beat me? ${SITE_URL}`); },
};
