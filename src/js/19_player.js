// ============================================================================
//  ELEMENTAL LAB — 19 · First-person player: WASD + mouse look, sprint & jump,
//  R.E.P.O.-style spring grab (sway, lag, push/pull, rotate), throwing with
//  mouse-flick power, force-combine (E) and touch-to-fuse.
// ============================================================================

const Input = {
  keys: new Set(), pressed: new Set(), mouse: { l: false, r: false }, alt: false, wheel: 0,
  dx: 0, dy: 0, samples: [],
  init(canvas) {
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        if (e.code === 'Tab' || e.code === 'Escape') { if (e.code === 'Tab') e.preventDefault(); UI.onKey(e); }
        return;
      }
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code); this.alt = e.altKey;
      if (['Tab', 'Space', 'AltLeft', 'AltRight'].includes(e.code) || (G.locked && ['KeyE', 'KeyR', 'KeyF', 'KeyC', 'KeyH'].includes(e.code))) e.preventDefault();
      UI.onKey(e);
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); this.alt = e.altKey; });
    window.addEventListener('blur', () => { this.keys.clear(); this.mouse.l = this.mouse.r = false; if (Player.held) Player.drop(); });
    canvas.addEventListener('mousedown', (e) => {
      this.alt = e.altKey;
      if (!G.locked) { if (G.started && !G.ui) UI.requestLock(); return; }
      if (e.button === 0) { this.mouse.l = true; Player.onPrimaryDown(e); }
      if (e.button === 2) { this.mouse.r = true; Player.onSecondaryDown(); }
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0 && this.mouse.l) { this.mouse.l = false; Player.onPrimaryUp(); } if (e.button === 2) this.mouse.r = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!G.locked) return;
      const mx = clamp(e.movementX || 0, -300, 300), my = clamp(e.movementY || 0, -300, 300);
      this.dx += mx; this.dy += my;
      this.samples.push({ t: performance.now(), x: mx, y: my });
      if (this.samples.length > 40) this.samples.shift();
    });
    window.addEventListener('wheel', (e) => { if (G.locked) { this.wheel += Math.sign(e.deltaY); e.preventDefault(); } }, { passive: false });
  },
  /** recent mouse velocity in px/s and direction */
  flick() {
    const now = performance.now();
    let sx = 0, sy = 0;
    for (const s of this.samples) if (now - s.t < 130) { sx += s.x; sy += s.y; }
    return { speed: Math.hypot(sx, sy) / 0.13, x: sx, y: sy };
  },
  endFrame() { this.pressed.clear(); this.dx = 0; this.dy = 0; this.wheel = 0; },
};

const Player = {
  body: null, yaw: 0, pitch: -0.12, grounded: false, bob: 0, bobAmt: 0, fov: 72,
  camPos: new THREE.Vector3(), held: null, holdDist: 1.4, holdRot: new THREE.Quaternion(), rotating: false,
  eTarget: null, eCharge: 0, touchPartner: null, touchT: 0, touchGrace: 0, holdTarget: new THREE.Vector3(),
  init() {
    const b = this.body = new CANNON.Body({ mass: 70, fixedRotation: true, material: Phys.mats.player, linearDamping: 0, allowSleep: false,
      collisionFilterGroup: GROUP.PLAYER, collisionFilterMask: GROUP.STATIC | GROUP.ITEM });
    for (const y of [0.3, 0.85, 1.4]) b.addShape(new CANNON.Sphere(0.3), new CANNON.Vec3(0, y, 0));
    b.position.set(LAYOUT.start.x, 0.02, LAYOUT.start.z);
    b.updateMassProperties();
    Phys.world.addBody(b);
    this.camPos.set(b.position.x, 1.62, b.position.z);
  },
  reset() { this.body.position.set(LAYOUT.start.x, 0.05, LAYOUT.start.z); this.body.velocity.set(0, 0, 0); this.yaw = 0; this.pitch = -0.12; },

  get dir() { return _v3.set(0, 0, -1).applyQuaternion(G.camera.quaternion); },
  yawQuat(q = _q1) { return q.setFromAxisAngle(_v2.set(0, 1, 0), this.yaw); },

  update(dt) {
    const K = Input.keys, sens = Settings.sens;
    // ---- look / rotate held
    this.rotating = !!(this.held && K.has('KeyR'));
    if (this.rotating) {
      _q2.setFromAxisAngle(_v1.set(0, 1, 0), Input.dx * 0.01);
      this.holdRot.premultiply(_q2);
      _q2.setFromAxisAngle(_v1.set(1, 0, 0), Input.dy * 0.01);
      this.holdRot.premultiply(_q2);
    } else if (G.locked) {
      this.yaw -= Input.dx * 0.0022 * sens;
      this.pitch -= Input.dy * 0.0022 * sens * (Settings.invert ? -1 : 1);
    }
    if (G.locked && !G.ui) {
      if (K.has('ArrowLeft')) this.yaw += dt * 2.2; if (K.has('ArrowRight')) this.yaw -= dt * 2.2;
      if (K.has('ArrowUp')) this.pitch += dt * 1.6; if (K.has('ArrowDown')) this.pitch -= dt * 1.6;
    }
    this.pitch = clamp(this.pitch, -1.45, 1.45);
    // ---- movement
    const b = this.body;
    const canMove = G.locked && !G.ui && !Driving.car;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw), rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let mx = 0, mz = 0;
    if (canMove) {
      const f = (K.has('KeyW') ? 1 : 0) - (K.has('KeyS') ? 1 : 0), s = (K.has('KeyD') ? 1 : 0) - (K.has('KeyA') ? 1 : 0);
      mx = fx * f + rx * s; mz = fz * f + rz * s;
      const l = Math.hypot(mx, mz); if (l > 0) { mx /= l; mz /= l; }
      if (!l && (Touch.move.x || Touch.move.y)) { mx = fx * Touch.move.y + rx * Touch.move.x; mz = fz * Touch.move.y + rz * Touch.move.x; }
    }
    const sprint = K.has('ShiftLeft') || K.has('ShiftRight') || Touch.sprint;
    const speed = sprint ? 6.2 : 3.6;
    const wasGrounded = this.grounded;
    this.grounded = this.checkGround();
    if (this.grounded && !wasGrounded) this.landT = G.rtime;
    // jump: Space, or the scroll wheel when you're not holding anything (CS-style "jump on mousewheel")
    const wantJump = canMove && (Input.pressed.has('Space') || (!this.held && Input.wheel !== 0) || (this.autoHop && K.has('Space')));
    const hs0 = Math.hypot(b.velocity.x, b.velocity.z);
    if (this.grounded) {
      // bhop: jumping within a few frames of landing skips ground friction entirely, so speed carries over
      const justLanded = G.rtime - (this.landT || 0) < 0.1;
      if (!justLanded || hs0 <= speed) {
        const k = Math.min(1, 14 * dt);
        b.velocity.x += (mx * speed - b.velocity.x) * k;
        b.velocity.z += (mz * speed - b.velocity.z) * k;
      }
    } else {
      // air strafing (Quake/Source style): you only gain speed by turning into the strafe direction,
      // because the cap applies to speed ALONG the wish direction, not total speed
      const l = Math.hypot(mx, mz);
      if (l > 0) {
        const wx = mx / l, wz = mz / l;
        const cur = b.velocity.x * wx + b.velocity.z * wz;
        const add = 0.9 - cur;                       // tiny air speed cap → gains come from turning
        if (add > 0) { const a = Math.min(add, 40 * speed * dt); b.velocity.x += a * wx; b.velocity.z += a * wz; }
      }
      const hs = Math.hypot(b.velocity.x, b.velocity.z);
      if (hs > 24) { b.velocity.x *= 24 / hs; b.velocity.z *= 24 / hs; }   // sanity cap
    }
    if (wantJump && this.grounded && b.velocity.y < 2) {
      b.velocity.y = 4.9; this.grounded = false; this.landT = -1;
      Sound.tone(300, 0.08, { vol: 0.05, glide: 420 });
      if (hs0 > speed + 0.5) Bhop.hop(hs0);
    }
    if (b.position.y < -2) this.reset();
    // ---- camera
    const eye = _v1.set(b.position.x, b.position.y + 1.62, b.position.z);
    this.camPos.lerp(eye, 1 - Math.exp(-dt * 28));
    const hs = Math.hypot(b.velocity.x, b.velocity.z);
    this.bobAmt = lerp(this.bobAmt, this.grounded && Settings.bob ? Math.min(1, hs / 4) : 0, 1 - Math.exp(-dt * 8));
    this.bob += hs * dt * 1.9;
    const cam = G.camera;
    cam.position.copy(this.camPos);
    cam.position.y += Math.sin(this.bob * 2) * 0.03 * this.bobAmt;
    cam.position.x += Math.cos(this.bob) * 0.018 * this.bobAmt * rx;
    cam.position.z += Math.cos(this.bob) * 0.018 * this.bobAmt * rz;
    if (G.shake > 0) { cam.position.x += (Math.random() - 0.5) * G.shake * 0.08; cam.position.y += (Math.random() - 0.5) * G.shake * 0.08; G.shake = Math.max(0, G.shake - dt * 3); }
    cam.rotation.set(this.pitch, this.yaw, Math.sin(this.bob) * 0.004 * this.bobAmt, 'YXZ');
    this.fov = lerp(this.fov, sprint && hs > 4 ? 78 : 72, 1 - Math.exp(-dt * 6));
    if (Math.abs(cam.fov - this.fov) > 0.01) { cam.fov = this.fov; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld();
    // ---- held item interactions
    if (this.held) {
      if (this.held.dead || this.held.merging) { this.held = null; }
      else {
        if (Input.wheel && this.held) this.holdDist = clamp(this.holdDist - Input.wheel * 0.22 * Math.max(1, this.held.vis.radius), this.minHold(), this.minHold() + 3.4);
        this.updateForceCombine(dt);
        if (this.held) this.updateTouchMerge(dt);
        if (this.held && canMove && Input.pressed.has('KeyF')) Crafting.toShelf(this.held);
      }
    } else {
      this.resetCharge(); ProgressRing.hide();
      if (canMove && Input.pressed.has('KeyF')) { const t = pickTarget(); if (t && t.kind === 'entity') Crafting.toShelf(t.obj); }
    }
  },

  checkGround() {
    const b = this.body;
    const from = new CANNON.Vec3(b.position.x, b.position.y + 0.32, b.position.z);
    const to = new CANNON.Vec3(b.position.x, b.position.y - 0.08, b.position.z);
    const res = new CANNON.RaycastResult();
    Phys.world.raycastClosest(from, to, { collisionFilterMask: GROUP.STATIC | GROUP.ITEM, skipBackfaces: true }, res);
    return res.hasHit && b.velocity.y < 1.5;
  },

  /** spring forces — called from the physics preStep every substep */
  holdForces() {
    const e = this.held;
    if (!e || !e.body) return;
    const b = e.body, cam = G.camera, m = b.mass;
    const dir = _v1.set(0, 0, -1).applyQuaternion(cam.quaternion);
    const up = _v2.set(0, 1, 0).applyQuaternion(cam.quaternion);
    const T = this.holdTarget.copy(cam.position).addScaledVector(dir, this.holdDist).addScaledVector(up, -0.11 * this.holdDist);
    const dx = T.x - b.position.x, dy = T.y - b.position.y, dz = T.z - b.position.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 3.2 + e.vis.radius) { this.drop(); return; }
    const stiff = 13 / (1 + m * 0.05);
    let vx = dx * stiff, vy = dy * stiff, vz = dz * stiff;
    const vl = Math.hypot(vx, vy, vz); if (vl > 15) { vx *= 15 / vl; vy *= 15 / vl; vz *= 15 / vl; }
    const gain = 15;
    let Fx = (vx - b.velocity.x) * gain * m, Fy = (vy - b.velocity.y) * gain * m - Phys.world.gravity.y * m, Fz = (vz - b.velocity.z) * gain * m;
    if (e.info.state === 'gas') Fy += Phys.world.gravity.y * m * 0; // gas buoyancy is skipped while held
    const Fl = Math.hypot(Fx, Fy, Fz), Fmax = 320 + m * 95;
    if (Fl > Fmax) { Fx *= Fmax / Fl; Fy *= Fmax / Fl; Fz *= Fmax / Fl; }
    b.force.x += Fx; b.force.y += Fy; b.force.z += Fz;
    // orientation spring
    const want = this.yawQuat(_q1).multiply(this.holdRot);
    const cur = _q2.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
    const diff = want.multiply(cur.invert());
    if (diff.w < 0) { diff.x = -diff.x; diff.y = -diff.y; diff.z = -diff.z; diff.w = -diff.w; }
    const ang = 2 * Math.acos(clamp(diff.w, -1, 1));
    const s = Math.sqrt(Math.max(1e-8, 1 - diff.w * diff.w));
    const rate = Math.min(14, ang * 9);
    const tx = diff.x / s * rate, ty = diff.y / s * rate, tz = diff.z / s * rate;
    const av = b.angularVelocity;
    av.x += (tx - av.x) * 0.35; av.y += (ty - av.y) * 0.35; av.z += (tz - av.z) * 0.35;
  },

  onPrimaryDown(e) {
    if (this.held) return;
    const t = pickTarget();
    if (!t) return;
    if (t.kind === 'entity') {
      if (Input.alt || e.altKey) { Crafting.tryBreakdown(t.obj); return; }
      this.grab(t.obj, t.dist);
    } else if (t.kind === 'display') {
      const d = t.obj;
      const ent = spawnItem(d.id, d.pos.clone(), { noPop: true, touched: true });
      if (!ent) return;
      Displays.take(d);
      Sound.spawn();
      Particles.emit({ pos: d.pos, color: d.ped.color, count: 18, size: 0.07, speed: 1.2, life: 0.5 });
      this.grab(ent, t.dist);
    } else if (t.kind === 'trophy') {
      const tr = t.obj, pos = tr.root.position.clone();
      Trophies.remove(tr.slot);
      const ent = spawnItem(tr.id, pos, { noPop: true, touched: true });
      if (ent) this.grab(ent, t.dist);
    }
  },
  onPrimaryUp() { if (this.held) this.drop(); },
  onSecondaryDown() {
    if (!this.held) return;
    const e = this.held, b = e.body;
    const f = Input.flick();
    const power = clamp(5 + f.speed / 170, 5, 21) / Math.pow(Math.max(0.6, b.mass), 0.12);
    const dir = _v1.set(0, 0, -1).applyQuaternion(G.camera.quaternion);
    if (f.speed > 200) {
      const right = _v2.set(1, 0, 0).applyQuaternion(G.camera.quaternion), up = _v3.set(0, 1, 0).applyQuaternion(G.camera.quaternion);
      const l = Math.hypot(f.x, f.y) || 1;
      dir.addScaledVector(right, (f.x / l) * 0.35).addScaledVector(up, (-f.y / l) * 0.35).normalize();
    }
    this.drop(false);
    b.velocity.set(dir.x * power, dir.y * power + 1.2, dir.z * power);
    b.angularVelocity.set((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
    e.touch(); e.thrownAt = G.time;
    Sound.throw(power / 21);
    Stats.add('thrown');
    Particles.emit({ add: false, pos: e.root.position, color: 0xffffff, count: 6, size: 0.08, sizeEnd: 0.2, life: 0.4, alpha: 0.4, speed: 0.6 });
  },

  grab(ent, dist) {
    if (ent.placed) Build.unpin(ent);
    if (ent.remote) { const a = Net.avatars.get(ent.remote); UI.toast('🤝', `That's ${a ? a.name : 'another player'}'s item`, 'Hold yours against it to fuse them!'); return; }
    this.held = ent;
    ent.setHeld(true);
    this.holdDist = clamp((dist ?? ent.root.position.distanceTo(G.camera.position)) + ent.vis.radius * 0.5, this.minHold(ent), this.minHold(ent) + 1.8);
    const q = _q2.set(ent.body.quaternion.x, ent.body.quaternion.y, ent.body.quaternion.z, ent.body.quaternion.w);
    this.holdRot.copy(this.yawQuat(_q1).invert().multiply(q));
    Sound.grab(ent.info.material);
    G.selected = ent.id;
  },
  minHold(e = this.held) { return e ? Math.max(0.75, e.vis.radius + 0.6) : 0.75; },
  drop(sound = true) {
    const e = this.held;
    this.held = null;
    this.resetCharge(); ProgressRing.hide(); this.touchPartner = null; this.touchT = 0;
    if (!e || e.dead) return;
    e.setHeld(false);
    if (e.body) { const v = e.body.velocity, l = v.length(); if (l > 9) v.scale(9 / l, v); }
    if (sound) Sound.drop();
  },
  resetCharge() { if (this.eCharge > 0) Sound.chargeStop(); this.eCharge = 0; this.eTarget = null; UI.setCharge(0); },

  updateForceCombine(dt) {
    if (!Input.keys.has('KeyE') || !G.locked) { this.resetCharge(); return; }
    const t = pickTarget(REACH + 0.5, this.held);
    const target = t && (t.kind === 'entity' || t.kind === 'display') ? t.obj : null;
    if (!target) { if (this.eCharge > 0) this.resetCharge(); return; }
    if (target !== this.eTarget) { this.eTarget = target; this.eCharge = 0; Sound.chargeStart(); }
    this.eCharge += dt / 0.45;
    Sound.chargeUpdate(this.eCharge);
    UI.setCharge(this.eCharge);
    if (this.eCharge >= 1) {
      let other = target;
      if (t.kind === 'display') { other = spawnItem(target.id, target.pos.clone(), { noPop: true }); Displays.take(target); }
      const held = this.held;
      this.resetCharge();
      if (other) Crafting.merge(held, other, 'force');
    }
  },

  updateTouchMerge(dt) {
    const h = this.held;
    if (!h || h.dead) return;
    let best = null, bd = Infinity;
    for (const e of G.entities) {
      if (e === h || e.merging || e.dead) continue;
      const d = e.root.position.distanceTo(h.root.position);
      const lim = (e.vis.radius + h.vis.radius) * 0.82 + 0.03;
      if (d < lim && d < bd) { bd = d; best = e; }
    }
    if (best) {
      this.touchGrace = 0.12;
      if (best !== this.touchPartner) { this.touchPartner = best; this.touchT = 0; }
      this.touchT += dt;
      const p = this.touchT / 0.8;
      ProgressRing.show(h.root.position, best.root.position, Math.min(1, p));
      if (this.eCharge <= 0) { if (this.touchT < dt * 1.5) Sound.chargeStart(); Sound.chargeUpdate(p); }
      if (p >= 1) { const other = best; this.touchPartner = null; this.touchT = 0; ProgressRing.hide(); Sound.chargeStop(); Crafting.merge(h, other, 'touch'); }
    } else if (this.touchPartner) {
      this.touchGrace -= dt;
      if (this.touchGrace <= 0) { this.touchPartner = null; this.touchT = 0; ProgressRing.hide(); if (this.eCharge <= 0) Sound.chargeStop(); }
    }
  },
};
