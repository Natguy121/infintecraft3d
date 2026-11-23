// ============================================================================
//  ELEMENTAL LAB — 18 · Item entities (physical copies), pedestal displays and
//  shelf trophies: creation, idle animation, particle emitters, removal.
// ============================================================================

function buildItemMeshes(info, vis) {
  const mats = itemMaterials(info);
  mats.refs = (mats.refs || 0) + 1;
  vis.refs = (vis.refs || 0) + 1;
  const inner = new THREE.Group();
  inner.scale.setScalar(vis.scale);
  const add = (geo, mat, parent, shadow = true) => {
    if (!geo) return null;
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = shadow && (info.opacity ?? 1) > 0.4; m.receiveShadow = shadow;
    parent.add(m); return m;
  };
  add(vis.body, mats.body, inner);
  add(vis.glow, mats.glow, inner, false);
  const animParts = [];
  for (const a of vis.anims) {
    const pivot = new THREE.Group();
    pivot.position.copy(a.pivot);
    add(a.body, mats.body, pivot); add(a.glow, mats.glow, pivot, false);
    inner.add(pivot);
    animParts.push({ name: a.name, pivot });
  }
  return { inner, animParts, mats };
}

function releaseItemMeshes(info, vis, mats) {
  vis.refs = Math.max(0, (vis.refs || 1) - 1);
  mats.refs = Math.max(0, (mats.refs || 1) - 1);
}

const HOPPERS = new Set(['creature', 'bird', 'insect', 'humanoid', 'snake', 'fish', 'robot']);

class Entity {
  constructor(id, pos, opts = {}) {
    this.id = id;
    this.info = Universe.get(id);
    this.vis = buildVisual(this.info);
    const built = buildItemMeshes(this.info, this.vis);
    this.inner = built.inner; this.animParts = built.animParts; this.mats = built.mats;
    this.root = new THREE.Group();
    this.root.add(this.inner);
    this.root.position.copy(pos);
    G.scene.add(this.root);
    this.body = Phys.createItemBody(this, pos);
    if (opts.vel) this.body.velocity.set(opts.vel.x, opts.vel.y, opts.vel.z);
    if (opts.angVel) this.body.angularVelocity.set(opts.angVel.x, opts.angVel.y, opts.angVel.z);
    this.labelCell = EmojiAtlas.acquire(this.info);
    this.phase = Math.random() * 100;
    this.spawnT = G.time; this.lastTouch = G.time; this.playerTouch = opts.touched ? G.time : -99;
    this.pop = opts.noPop ? 1 : 0; this.popScale = opts.noPop ? 1 : 0.01; this.popDur = opts.popDur || 0.5;
    this.hopT = 2 + Math.random() * 4; this.hop = 0;
    this.emit = 0; this.fade = 1;
    this.held = false; this.merging = false; this.dead = false;
    this.inRing = false;
    G.entities.push(this);
  }

  get pos() { return this.root.position; }
  touch(byPlayer = true) { this.lastTouch = G.time; if (byPlayer) this.playerTouch = G.time; if (this.body) this.body.wakeUp(); }

  sync() {
    const b = this.body;
    if (!b || this.merging || this.remote) return;
    this.root.position.copy(b.interpolatedPosition);
    this.root.quaternion.copy(b.interpolatedQuaternion);
  }

  animate(dt) {
    const I = this.info, t = G.time + this.phase;
    if (this.pop < 1) { this.pop = Math.min(1, this.pop + dt / this.popDur); this.popScale = Math.max(0.01, ease.outElastic(this.pop)); }
    let s = this.vis.scale * this.popScale * (this.gripK ?? 1), sy = 1, y = 0;
    if (I.state === 'energy' || I.fx.includes('pulse')) s *= 1 + Math.sin(t * 6) * 0.04;
    if (I.material === 'fire' || I.fx.includes('flames')) sy = 1 + Math.sin(t * 19) * 0.03 + Math.sin(t * 31) * 0.02;
    if (HOPPERS.has(I.shape) && I.state === 'living' && !this.held) {
      this.hopT -= dt;
      if (this.hopT <= 0) { this.hop = 0.001; this.hopT = (I.fx.includes('bounce') ? 1 : 3) + Math.random() * 4; }
      if (this.hop > 0) { this.hop += dt * 2.6; const k = Math.min(1, this.hop); y = Math.sin(k * Math.PI) * 0.07; sy *= 1 + Math.sin(k * Math.PI * 2) * 0.08; if (k >= 1) this.hop = 0; }
    }
    if (I.fx.includes('shake')) { this.inner.position.x = (Math.random() - 0.5) * 0.01; }
    this.inner.position.y = y;
    this.inner.scale.set(s, s * sy, s);
    if (I.state === 'gas' || I.shape === 'abstract' || I.shape === 'galaxy' || I.shape === 'celestial') this.inner.rotation.y += dt * (I.shape === 'galaxy' ? 0.5 : 0.35);
    const flapSpeed = this.held || (this.body && this.body.velocity.lengthSquared() > 1) ? 22 : 7;
    for (const a of this.animParts) {
      if (a.name === 'wingL') a.pivot.rotation.z = Math.sin(t * flapSpeed) * 0.55 + 0.1;
      else if (a.name === 'wingR') a.pivot.rotation.z = -Math.sin(t * flapSpeed) * 0.55 - 0.1;
      else if (a.name === 'spinY') a.pivot.rotation.y += dt * 18;
      else if (a.name === 'spinZ') a.pivot.rotation.z += dt * 3;
    }
    if (this.fade < 1) this.root.scale.setScalar(Math.max(0.001, this.fade));
    this.emitFx(dt);
  }

  emitFx(dt) {
    const fx = this.info.fx;
    if (!fx.length || this.merging) return;
    const p = this.root.position;
    if (p.distanceToSquared(G.camera.position) > 70) return;
    this.emit += dt;
    if (this.emit < 0.045) return;
    const k = this.emit; this.emit = 0;
    const r = this.vis.radius, col = this.info.color, R = Math.random;
    for (const f of fx) {
      const chance = (rate) => R() < rate * k * Q().particles;
      switch (f) {
        case 'flames': if (chance(22)) Particles.emit({ pos: _v3.set(p.x + (R() - 0.5) * r, p.y + r * 0.4, p.z + (R() - 0.5) * r), vel: { x: 0, y: 0.6, z: 0 }, color: [0xff7a2a, 0xffb03a, 0xff4a1a], size: r * 0.55, sizeEnd: 0.01, life: 0.55, gravity: 1.6, drag: 1, speed: 0.15 }); break;
        case 'sparkle': if (chance(6)) Particles.emit({ pos: _v3.set(p.x + (R() - 0.5) * r * 2.4, p.y + (R() - 0.3) * r * 2, p.z + (R() - 0.5) * r * 2.4), color: [0xffffff, this.info.glowColor || col], size: 0.06, sizeEnd: 0, life: 0.7, speed: 0.05 }); break;
        case 'stars': if (chance(5)) Particles.emit({ pos: _v3.set(p.x + (R() - 0.5) * r * 2.6, p.y + (R() - 0.3) * r * 2.4, p.z + (R() - 0.5) * r * 2.6), color: [0xffffff, 0xc8b8ff, 0x8ab8ff], size: 0.05, sizeEnd: 0, life: 1.1, speed: 0.02 }); break;
        case 'sparks': if (chance(3)) Particles.emit({ pos: p, color: [0xfff36b, 0xffffff, 0x8ae8ff], count: 4, size: 0.035, life: 0.35, gravity: -6, speed: 2.2, spread: r * 0.8 }); break;
        case 'smoke': if (chance(7)) Particles.emit({ add: false, pos: _v3.set(p.x, p.y + r * 0.5, p.z), vel: { x: 0, y: 0.35, z: 0 }, color: [0x2a2430, 0x4a3a5a], size: r * 0.8, sizeEnd: r * 1.6, life: 1.3, alpha: 0.35, gravity: 0.3, speed: 0.08, spread: r * 0.5 }); break;
        case 'puffs': if (chance(4)) Particles.emit({ add: false, pos: _v3.set(p.x, p.y, p.z), color: col, size: r * 0.9, sizeEnd: r * 1.8, life: 1.6, alpha: 0.28, speed: 0.12, spread: r * 0.6 }); break;
        case 'frost': if (chance(4)) Particles.emit({ pos: _v3.set(p.x + (R() - 0.5) * r * 2, p.y + r, p.z + (R() - 0.5) * r * 2), color: [0xd8f4ff, 0xffffff], size: 0.04, life: 1, gravity: -0.4, speed: 0.05 }); break;
        case 'steam': if (chance(5)) Particles.emit({ add: false, pos: _v3.set(p.x, p.y + r * 0.6, p.z), vel: { x: 0, y: 0.5, z: 0 }, color: 0xffffff, size: r * 0.5, sizeEnd: r * 1.4, life: 1.1, alpha: 0.4, speed: 0.05, spread: r * 0.3 }); break;
        case 'bubbles': if (chance(4)) Particles.emit({ add: false, pos: _v3.set(p.x + (R() - 0.5) * r, p.y + r * 0.6, p.z + (R() - 0.5) * r), vel: { x: 0, y: 0.4, z: 0 }, color: [0xbfefff, 0x9affc8], size: 0.05, sizeEnd: 0.07, life: 1, alpha: 0.6, speed: 0.04 }); break;
        case 'drip': if (chance(1.6)) Particles.emit({ add: false, pos: _v3.set(p.x + (R() - 0.5) * r, p.y - r * 0.6, p.z + (R() - 0.5) * r), color: col, size: 0.06, sizeEnd: 0.04, life: 0.6, gravity: -9, alpha: 0.9, speed: 0.02 }); break;
        case 'hearts': if (chance(2.5)) Particles.emit({ pos: _v3.set(p.x, p.y + r, p.z), vel: { x: 0, y: 0.4, z: 0 }, color: [0xff5aa8, 0xff8ac8], size: 0.07, sizeEnd: 0.02, life: 1.1, speed: 0.1 }); break;
        case 'notes': if (chance(2.5)) Particles.emit({ pos: _v3.set(p.x, p.y + r, p.z), vel: { x: (R() - 0.5) * 0.4, y: 0.4, z: 0 }, color: [0xb05cff, 0x5ab8ff], size: 0.07, sizeEnd: 0.02, life: 1.2, speed: 0.05 }); break;
        case 'zzz': if (chance(1.5)) Particles.emit({ add: false, pos: _v3.set(p.x + r * 0.5, p.y + r, p.z), vel: { x: 0.1, y: 0.25, z: 0 }, color: 0xc8b8ff, size: 0.06, sizeEnd: 0.12, life: 1.6, alpha: 0.7, speed: 0.02 }); break;
        case 'rainy': if (chance(5)) Particles.emit({ add: false, pos: _v3.set(p.x + (R() - 0.5) * r * 1.5, p.y + r * 1.5, p.z + (R() - 0.5) * r * 1.5), color: 0x5a9aff, size: 0.035, life: 0.5, gravity: -6, alpha: 0.8, speed: 0.01 }); break;
        case 'orbit': if (chance(14)) { const a = G.time * 4 + this.phase; Particles.emit({ pos: _v3.set(p.x + Math.cos(a) * r * 1.4, p.y + Math.sin(a * 0.7) * r * 0.4, p.z + Math.sin(a) * r * 1.4), color: this.info.glowColor || 0xc8a8ff, size: 0.05, sizeEnd: 0, life: 0.5, speed: 0.01 }); } break;
        case 'scan': case 'shine': if (chance(1.2)) Particles.emit({ pos: _v3.set(p.x + (R() - 0.5) * r * 1.6, p.y + (R() - 0.5) * r * 1.6, p.z + (R() - 0.5) * r * 1.6), color: 0xffffff, size: 0.09, sizeEnd: 0, life: 0.4, speed: 0.01 }); break;
      }
    }
  }

  setHeld(h) {
    this.held = h;
    const b = this.body;
    if (!b) return;
    b.collisionFilterGroup = h ? GROUP.HELD : GROUP.ITEM;
    b.collisionFilterMask = h ? (GROUP.STATIC | GROUP.ITEM) : (GROUP.STATIC | GROUP.ITEM | GROUP.PLAYER | GROUP.HELD);
    b.wakeUp();
    this.touch();
  }

  removeBody() {
    if (this.body) { Phys.world.removeBody(this.body); this.body.entity = null; this.body = null; }
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    this.removeBody();
    G.scene.remove(this.root);
    EmojiAtlas.release(this.labelCell && this.labelCell.key);
    releaseItemMeshes(this.info, this.vis, this.mats);
    const i = G.entities.indexOf(this);
    if (i >= 0) G.entities.splice(i, 1);
    if (Player.held === this) Player.drop(false);
  }

  /** shrink-and-poof removal */
  vanish(color, dur = 0.35, onDone) {
    if (this.merging) return;
    this.merging = true;
    this.removeBody();
    const s0 = this.root.scale.x;
    Tweens.add(dur, (k) => { this.root.scale.setScalar(Math.max(0.001, s0 * (1 - ease.inCubic(k)))); this.root.rotation.y += 0.2; }, () => {
      Particles.emit({ add: false, pos: this.root.position, color: color ?? 0xd8dce4, count: 10, size: 0.12, sizeEnd: 0.3, life: 0.7, alpha: 0.5, speed: 0.6 });
      this.destroy(); onDone && onDone();
    });
  }
}

function spawnItem(id, pos, opts = {}) {
  if (!Universe.isValidId(id)) return null;
  enforceBodyCap();
  const e = new Entity(id, pos, opts);
  return e;
}

function enforceBodyCap() {
  const loose = G.entities.filter(e => !e.merging && !e.dead);
  if (loose.length < MAX_BODIES) return;
  const victims = loose.filter(e => !e.held && !e.remote && !e.pet && !e.placed).sort((a, b) => a.lastTouch - b.lastTouch);
  const n = loose.length - MAX_BODIES + 1;
  for (let i = 0; i < n && i < victims.length; i++) victims[i].vanish();
}

function despawnIdle() {
  if (G.entities.length <= DESPAWN_THRESHOLD) return;
  for (const e of [...G.entities]) {
    if (e.held || e.merging || e.remote || e.pet || e.placed) continue;
    if (G.time - e.lastTouch > DESPAWN_IDLE) e.vanish();
    if (G.entities.length <= DESPAWN_THRESHOLD) break;
  }
}

// ---------------------------------------------------------------- pedestal displays
const Displays = {
  init() {
    for (const P of LAYOUT.pedestals) {
      const info = Universe.get(P.id);
      const vis = buildVisual(info);
      const built = buildItemMeshes(info, vis);
      const root = new THREE.Group();
      root.add(built.inner);
      const fit = Math.min(1, 0.17 / vis.radius); // pedestal copies are shown at a handy size
      built.inner.scale.setScalar(vis.scale * fit);
      const pos = new THREE.Vector3(P.x, LAYOUT.table.top + 0.12 + vis.radius * fit * 0.9, LAYOUT.pedZ);
      root.position.copy(pos);
      G.scene.add(root);
      G.displays.push({ id: P.id, info, vis, root, inner: built.inner, animParts: built.animParts, pos, base: pos.clone(), visible: true, regrow: 1, labelCell: EmojiAtlas.acquire(info), ped: P, phase: Math.random() * 6, fit });
    }
  },
  update(dt) {
    for (const d of G.displays) {
      if (d.regrow < 1) {
        d.regrow = Math.min(1, d.regrow + dt / 0.55);
        const k = d.regrow < 0.35 ? 0 : (d.regrow - 0.35) / 0.65;
        d.inner.scale.setScalar(d.vis.scale * d.fit * Math.max(0.001, ease.outBack(k, 2.2)));
        d.visible = k > 0;
        if (k > 0 && !d.sparked) { d.sparked = true; Particles.emit({ pos: d.base, color: d.ped.color, count: 14, size: 0.06, speed: 0.8, life: 0.5 }); }
      }
      d.pos.copy(d.base); d.pos.y += Math.sin(G.time * 1.7 + d.phase) * 0.03;
      d.root.position.copy(d.pos);
      d.root.rotation.y += dt * 0.6;
      d.root.visible = d.visible;
      const t = G.time + d.phase;
      for (const a of d.animParts) { if (a.name === 'wingL') a.pivot.rotation.z = Math.sin(t * 7) * 0.5; if (a.name === 'wingR') a.pivot.rotation.z = -Math.sin(t * 7) * 0.5; }
      if (d.visible && d.info.fx.length && Math.random() < dt * 14) {
        if (d.info.material === 'fire') Particles.emit({ pos: _v3.set(d.pos.x + (Math.random() - 0.5) * 0.1, d.pos.y + 0.05, d.pos.z), vel: { x: 0, y: 0.5, z: 0 }, color: [0xff7a2a, 0xffb03a], size: 0.09, sizeEnd: 0, life: 0.5, gravity: 1.5, speed: 0.1 });
        else if (d.info.state === 'gas') Particles.emit({ add: false, pos: d.pos, color: 0xe8f4ff, size: 0.12, sizeEnd: 0.25, life: 1.2, alpha: 0.25, speed: 0.15 });
      }
    }
  },
  take(d) {
    d.visible = false; d.regrow = 0; d.sparked = false;
    d.inner.scale.setScalar(0.001);
  },
};

// ---------------------------------------------------------------- shelf trophies
const Trophies = {
  place(id, slot, animateFrom) {
    if (slot == null) slot = this.freeSlot();
    if (slot == null) slot = this.oldestSlot();
    if (G.trophies[slot]) this.remove(slot, false);
    const info = Universe.get(id);
    if (!info) return null;
    const vis = buildVisual(info);
    const built = buildItemMeshes(info, vis);
    const root = new THREE.Group(); root.add(built.inner);
    const fit = Math.min(1, 0.16 / Math.max(0.05, vis.radius * 0.8));
    built.inner.scale.setScalar(vis.scale * fit);
    const base = Room.shelfSlots[slot];
    const pos = new THREE.Vector3(base.x, base.y + vis.halfExtents.y * fit + 0.005, base.z);
    root.position.copy(animateFrom || pos);
    G.scene.add(root);
    const t = { id, info, vis: { radius: vis.radius * fit }, root, inner: built.inner, built, pos, slot, labelCell: EmojiAtlas.acquire(info), placedAt: Date.now(), fullVis: vis };
    G.trophies[slot] = t;
    if (animateFrom) { const from = animateFrom.clone(); Tweens.add(0.5, (k) => root.position.lerpVectors(from, pos, ease.outBack(k, 1.4))); }
    Save.markDirty();
    return t;
  },
  freeSlot() { for (let i = 0; i < Room.shelfSlots.length; i++) if (!G.trophies[i]) return i; return null; },
  oldestSlot() { let best = 0, bt = Infinity; G.trophies.forEach((t, i) => { if (t && t.placedAt < bt) { bt = t.placedAt; best = i; } }); return best; },
  remove(slot, save = true) {
    const t = G.trophies[slot];
    if (!t) return;
    G.scene.remove(t.root);
    EmojiAtlas.release(t.labelCell.key);
    releaseItemMeshes(t.info, t.fullVis, t.built.mats);
    G.trophies[slot] = null;
    if (save) Save.markDirty();
  },
  nearestFree(pos, maxD = 0.4) {
    let best = null, bd = maxD;
    Room.shelfSlots.forEach((s, i) => { if (G.trophies[i]) return; const d = Math.hypot(s.x - pos.x, (s.y + 0.15) - pos.y, s.z - pos.z); if (d < bd) { bd = d; best = i; } });
    return best;
  },
  update(dt) { for (const t of G.trophies) if (t) { t.root.rotation.y += dt * 0.5; } },
};

// ---------------------------------------------------------------- targeting (ray vs bounding spheres)
const _ray = new THREE.Ray();
function pickTarget(maxDist = REACH, exclude = null) {
  _ray.origin.copy(G.camera.position);
  G.camera.getWorldDirection(_ray.direction);
  let best = null, bd = maxDist;
  const test = (center, r, obj, kind) => {
    _v1.copy(center).sub(_ray.origin);
    const tca = _v1.dot(_ray.direction);
    if (tca < 0) return;
    const d2 = _v1.lengthSq() - tca * tca;
    const rr = r * r;
    if (d2 > rr) return;
    const t = tca - Math.sqrt(rr - d2);
    if (t < bd) { bd = t; best = { obj, kind, dist: Math.max(0, t) }; }
  };
  for (const e of G.entities) if (e !== exclude && !e.merging && !e.dead) test(e.root.position, Math.max(0.25, (e.heldR || e.vis.radius) * 0.95 + 0.1), e, 'entity');
  // aim assist: if nothing is under the crosshair, take the item closest to it (within ~7°)
  if (!best) {
    let ba = 0.12;
    for (const e of G.entities) {
      if (e === exclude || e.merging || e.dead) continue;
      _v1.copy(e.root.position).sub(_ray.origin); const d = _v1.length(); if (d > maxDist + e.vis.radius || d < 0.05) continue;
      const a = Math.acos(clamp(_v1.dot(_ray.direction) / d, -1, 1));
      if (a < ba) { ba = a; best = { obj: e, kind: 'entity', dist: Math.max(0, d - e.vis.radius) }; }
    }
  }
  for (const d of G.displays) if (d.visible) test(d.pos, Math.max(0.14, d.vis.radius), d, 'display');
  for (const t of G.trophies) if (t) test(t.root.position, Math.max(0.12, t.vis.radius * 1.1), t, 'trophy');
  return best;
}
