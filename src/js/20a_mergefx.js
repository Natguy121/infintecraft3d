// ============================================================================
//  ELEMENTAL LAB — 20a · Combine animations: every fusion plays a little story
//  picked from what goes in and what comes out (Water + Earth sinks into mud and
//  a sprout pops up, an Engine revs up and burns a Plant into a Car, ...)
// ============================================================================

const MergeFX = {
  has(info, ...w) {
    const t = info.tags || [];
    for (const x of w) if (t.includes(x) || info.material === x || info.shape === x || info.state === x) return true;
    return false;
  },
  /** choose the story. Returns { style, lead, other } where lead is the "active" ingredient */
  pick(A, B, R) {
    const H = this.has.bind(this);
    const either = (...w) => H(A, ...w) ? 'a' : H(B, ...w) ? 'b' : null;
    let s;
    if (R && H(R, 'plant', 'tree', 'flower', 'grass')) return { style: 'grow' };
    if ((s = either('fire', 'lava', 'explosive', 'flame')) || (s = either('engine', 'hot', 'gear'))) return { style: 'burn', lead: s };
    if ((s = either('cold', 'ice', 'snow', 'frozen'))) return { style: 'freeze', lead: s };
    if ((s = either('electric', 'bolt', 'lightning'))) return { style: 'zap', lead: s };
    if ((s = either('liquid', 'water'))) return { style: 'soak', lead: s };
    if (R && H(R, 'living', 'animal', 'human', 'humanoid', 'creature')) return { style: 'hatch' };
    if (R && H(R, 'machine', 'vehicle', 'building', 'tool', 'metal', 'tech', 'robot')) return { style: 'build' };
    if (H(A, 'magic', 'mythical', 'holy', 'cosmic', 'evil') || H(B, 'magic', 'mythical', 'holy', 'cosmic', 'evil') || (R && H(R, 'magic', 'mythical'))) return { style: 'magic' };
    if (H(A, 'stone', 'hard', 'rock') && H(B, 'stone', 'hard', 'rock', 'earth')) return { style: 'smash' };
    return { style: 'swirl' };
  },
  DUR: { grow: 1.0, burn: 1.15, freeze: 0.95, zap: 0.85, soak: 0.95, hatch: 1.0, build: 1.0, magic: 1.1, smash: 0.75, swirl: 0.55 },

  /** recolour one entity (on private material copies, so shared materials are untouched) */
  tint(e, color, amt) {
    if (!e._tinted) {
      e._tinted = [];
      e.inner.traverse(o => { if (o.isMesh && o.material && o.material.color) { const m = o.material.clone(); m.userData.c0 = m.color.clone(); o.material = m; e._tinted.push(m); } });
    }
    const c = new THREE.Color(color);
    for (const m of e._tinted) m.color.copy(m.userData.c0).lerp(c, amt);
  },
  untint(e) { if (e._tinted) for (const m of e._tinted) m.dispose(); e._tinted = null; },

  /** play the story on entities a and b, then call done() (they are destroyed by the caller) */
  play(plan, a, b, mid, done) {
    const style = plan.style, D = this.DUR[style] || 0.6;
    const lead = plan.lead === 'b' ? b : a, other = lead === a ? b : a;
    const pa = a.root.position.clone(), pb = b.root.position.clone(), sa = a.root.scale.x, sb = b.root.scale.x;
    const pl = lead.root.position.clone(), po = other.root.position.clone(), sl = lead.root.scale.x, so = other.root.scale.x;
    const ground = new THREE.Vector3(mid.x, Math.min(mid.y, Math.min(pa.y, pb.y)) - 0.05, mid.z);
    const P = (o) => Particles.emit(o);
    let acc = 0, last = 0;
    const every = (k, step) => { acc += k - last; last = k; if (acc >= step) { acc = 0; return true; } return false; };
    const lerp = (x, y, t) => x + (y - x) * t;
    const v = new THREE.Vector3();
    const sound = {
      grow: () => Sound.tone(180, 0.5, { vol: 0.06, glide: 90 }),
      burn: () => { Sound.tone(70, 0.9, { vol: 0.09, glide: 140 }); Sound.noiseBurst(0.8, { vol: 0.08, freq: 500, sweep: 1600, verb: 0.3 }); },
      freeze: () => Sound.tone(1400, 0.6, { vol: 0.04, glide: 2200 }),
      zap: () => Sound.noiseBurst(0.6, { vol: 0.1, freq: 3000, sweep: 6000, verb: 0.2 }),
      soak: () => Sound.tone(320, 0.5, { vol: 0.06, glide: 120 }),
      hatch: () => Sound.tone(220, 0.25, { vol: 0.06, glide: 260 }),
      build: () => Sound.tone(900, 0.08, { vol: 0.05, glide: 700 }),
      magic: () => Sound.tone(520, 0.9, { vol: 0.05, glide: 1300 }),
      smash: () => Sound.tone(110, 0.3, { vol: 0.08, glide: 60 }),
      swirl: () => Sound.tone(260, 0.3, { vol: 0.08, glide: 700 }),
    };
    (sound[style] || sound.swirl)();
    let beat = 0;
    // Water + Earth style: a real mud puddle spreads under the ingredients and the sprout grows out of it
    let mud = null;
    if (style === 'grow') {
      const r = Math.max(0.22, Math.min(0.6, (a.vis.radius + b.vis.radius) * 0.6));
      mud = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 10), new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.25, metalness: 0 }));
      mud.position.copy(ground); mud.scale.set(0.001, 0.001, 0.001); mud.userData.r = r; G.scene.add(mud);
    }

    const step = (k) => {
      if (style === 'grow') {
        // both ingredients slump onto the table and melt into a mud puddle
        const e = ease.inOut(Math.min(1, k / 0.7));
        for (const [x, p0, s0] of [[a, pa, sa], [b, pb, sb]]) {
          x.root.position.lerpVectors(p0, ground, e);
          x.root.scale.set(s0 * lerp(1, 1.35, e), s0 * lerp(1, 0.12, e), s0 * lerp(1, 1.35, e));
          this.tint(x, 0x5a3c22, e * 0.85);
        }
        { const m = ease.outCubic(Math.min(1, k / 0.55)) * mud.userData.r; mud.scale.set(m, Math.min(0.05, m * 0.2), m); }
        for (const x of [a, b]) if (k > 0.45) x.root.scale.multiplyScalar(Math.max(0.02, 1 - (k - 0.45) / 0.35));
        if (every(k, 0.08)) P({ add: false, pos: ground, color: [0x5a3c22, 0x7a5a3a], count: 3, speed: 0.6, size: 0.05, life: 0.4, up: 0.9 });
        if (k > 0.72 && every(k, 0.05)) P({ pos: ground, color: [0x5ad85a, 0x9aff8a], count: 4, speed: 1.4, size: 0.04, life: 0.7, up: 1, gravity: 1 });
      } else if (style === 'burn') {
        // the hot one revs up and swells, the other is dragged in, chars and shrinks
        const e = ease.inOut(k);
        lead.root.position.lerpVectors(pl, mid, Math.min(1, k * 1.6));
        const rev = 1 + Math.min(1, k * 1.5) * 0.55;
        lead.root.scale.setScalar(sl * rev * (1 + Math.sin(k * 60) * 0.04 * k));
        lead.root.rotation.z = Math.sin(k * 80) * 0.06 * k;
        other.root.position.lerpVectors(po, mid, ease.inCubic(Math.min(1, k * 1.15)));
        other.root.scale.setScalar(so * lerp(1, 0.05, ease.inCubic(k)));
        this.tint(other, 0x1a1210, Math.min(1, k * 1.6));
        if (every(k, 0.04)) {
          v.copy(other.root.position);
          P({ pos: v, color: [0xffb03a, 0xff6a1a, 0xffe85a], count: 6, speed: 1.4, size: 0.06, life: 0.5, up: 0.9, gravity: 2 });
          P({ add: false, pos: v, color: [0x3a3a3a, 0x5a5a5a], count: 2, speed: 0.7, size: 0.1, sizeEnd: 0.4, life: 1, alpha: 0.5, up: 1, gravity: 1.5 });
        }
        if (k > 0.85) G.shake = Math.max(G.shake, 0.12);
      } else if (style === 'freeze') {
        const e = ease.inOut(k);
        a.root.position.lerpVectors(pa, mid, e); b.root.position.lerpVectors(pb, mid, e);
        for (const [x, s0] of [[a, sa], [b, sb]]) { this.tint(x, 0xe8f6ff, Math.min(1, k * 1.4)); x.root.scale.setScalar(s0 * lerp(1, 0.55, e)); }
        if (k > 0.75) { const j = (k - 0.75) * 0.05; a.root.position.x += (Math.random() - 0.5) * j; b.root.position.x += (Math.random() - 0.5) * j; }
        if (every(k, 0.05)) P({ pos: mid, color: [0xffffff, 0xbfeaff], count: 6, speed: 1.1, size: 0.035, life: 0.7, spread: 0.3 });
      } else if (style === 'zap') {
        const e = ease.inCubic(k);
        lead.root.position.lerpVectors(pl, mid, e * 0.8); other.root.position.lerpVectors(po, mid, e);
        for (const x of [a, b]) { x.root.position.x += (Math.random() - 0.5) * 0.04 * k; x.root.position.y += (Math.random() - 0.5) * 0.04 * k; }
        other.root.scale.setScalar(so * lerp(1, 0.4, e)); lead.root.scale.setScalar(sl * (1 + Math.random() * 0.15 * k));
        this.tint(other, 0xfff6a0, Math.random() * k);
        if (every(k, 0.06)) { Glows.flash(mid, 0xffe83a, 1.2 + k * 1.5, 0.12); P({ pos: other.root.position, color: [0xffe83a, 0xffffff, 0x8ad8ff], count: 8, speed: 3, size: 0.03, life: 0.25 }); }
      } else if (style === 'soak') {
        // the liquid spreads into a pool and the other sinks into it, bubbling
        const e = ease.inOut(Math.min(1, k * 1.3));
        lead.root.position.lerpVectors(pl, ground, e);
        lead.root.scale.set(sl * lerp(1, 1.6, e), sl * lerp(1, 0.2, e), sl * lerp(1, 1.6, e));
        const s2 = ease.inCubic(k);
        v.copy(ground); v.y += 0.35 * (1 - s2);
        other.root.position.lerpVectors(po, v, Math.min(1, k * 1.8));
        other.root.scale.setScalar(so * lerp(1, 0.2, s2));
        other.root.rotation.y += 0.08;
        if (every(k, 0.06)) P({ pos: ground, color: [0xbfe8ff, 0xffffff], count: 4, speed: 0.8, size: 0.04, life: 0.5, up: 1, spread: 0.2 });
      } else if (style === 'hatch') {
        // both squeeze into one glowing egg that throbs like a heartbeat
        const e = ease.inOut(Math.min(1, k * 1.8));
        a.root.position.lerpVectors(pa, mid, e); b.root.position.lerpVectors(pb, mid, e);
        const pulse = k > 0.45 ? 1 + Math.max(0, Math.sin((k - 0.45) * 30)) * 0.25 : 1;
        a.root.scale.setScalar(sa * lerp(1, 0.6, e) * pulse); b.root.scale.setScalar(sb * lerp(1, 0.6, e) * pulse);
        for (const x of [a, b]) this.tint(x, 0xfff4e0, e * 0.6);
        const nb = Math.floor(Math.max(0, k - 0.45) * 30 / Math.PI);
        if (nb > beat) { beat = nb; Glows.flash(mid, 0xffd0e0, 1.4, 0.25); Sound.tone(90, 0.12, { vol: 0.08, glide: 60 }); }
      } else if (style === 'build') {
        // the parts orbit each other and click together with sparks
        const ang = ease.inCubic(k) * Math.PI * 3, rad = (1 - ease.inCubic(k)) * Math.max(0.35, pa.distanceTo(pb) / 2);
        const up = Math.sin(k * Math.PI) * 0.25;
        a.root.position.set(mid.x + Math.cos(ang) * rad, mid.y + up, mid.z + Math.sin(ang) * rad);
        b.root.position.set(mid.x - Math.cos(ang) * rad, mid.y + up, mid.z - Math.sin(ang) * rad);
        a.root.rotation.y = ang; b.root.rotation.y = -ang;
        a.root.scale.setScalar(sa * lerp(1, 0.6, k)); b.root.scale.setScalar(sb * lerp(1, 0.6, k));
        if (every(k, 0.12)) { Sound.tone(700 + k * 900, 0.05, { vol: 0.04, glide: 500 }); P({ pos: mid, color: [0xffe85a, 0xffffff, 0xffb03a], count: 6, speed: 2.4, size: 0.025, life: 0.3 }); }
      } else if (style === 'magic') {
        // float up and spiral together in a shower of stars
        const ang = k * Math.PI * 4, rad = (1 - ease.inCubic(k)) * Math.max(0.3, pa.distanceTo(pb) / 2), up = Math.sin(k * Math.PI * 0.9) * 0.6;
        a.root.position.set(mid.x + Math.cos(ang) * rad, mid.y + up, mid.z + Math.sin(ang) * rad);
        b.root.position.set(mid.x - Math.cos(ang) * rad, mid.y + up, mid.z - Math.sin(ang) * rad);
        a.root.scale.setScalar(sa * lerp(1, 0.4, ease.inCubic(k))); b.root.scale.setScalar(sb * lerp(1, 0.4, ease.inCubic(k)));
        if (every(k, 0.04)) { v.set(mid.x, mid.y + up, mid.z); P({ pos: v, color: [0xb04dff, 0xff7ae0, 0xffffff, 0x8ad8ff], count: 5, speed: 1.6, size: 0.04, life: 0.8, spread: rad + 0.1, gravity: -1 }); }
      } else if (style === 'smash') {
        // pull back, then slam
        const back = k < 0.55 ? ease.outCubic(k / 0.55) : 1 - ease.inCubic((k - 0.55) / 0.45) * 1.0;
        const t = k < 0.55 ? -0.35 * back : -0.35 + ease.inCubic((k - 0.55) / 0.45) * 1.35;
        a.root.position.lerpVectors(pa, mid, t); b.root.position.lerpVectors(pb, mid, t);
        a.root.rotation.z = -back * 0.2; b.root.rotation.z = back * 0.2;
      } else {
        const e = ease.inCubic(k);
        a.root.position.lerpVectors(pa, mid, e); b.root.position.lerpVectors(pb, mid, e);
        a.root.scale.setScalar(sa * (1 - e * 0.5)); b.root.scale.setScalar(sb * (1 - e * 0.5));
        a.root.rotation.y += 0.25; b.root.rotation.y -= 0.25;
        if (every(k, 0.1)) P({ pos: mid, color: [0xffffff, a.info.color, b.info.color], count: 4, speed: 1, size: 0.04, life: 0.4 });
      }
    };
    Tweens.add(D, step, () => {
      if (style === 'smash') { Particles.emit({ add: false, pos: mid, color: [0x9a8a7a, 0xc8b8a8], count: 18, speed: 2, size: 0.1, sizeEnd: 0.3, life: 0.8, alpha: 0.5 }); G.shake = Math.max(G.shake, 0.3); Sound.tone(60, 0.3, { vol: 0.12, glide: 40 }); }
      if (style === 'freeze') Particles.burst(mid, [0xffffff, 0xbfeaff, 0x8ad8ff], 40, 3, 0.05);
      if (style === 'burn') Glows.flash(mid, 0xff8a3a, 3, 0.4);
      this.untint(a); this.untint(b);
      if (mud) { const m0 = mud.scale.x; Tweens.add(1.2, (t) => { const q = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4; mud.scale.set(m0 * Math.max(0.001, q), 0.05 * Math.max(0.001, q), m0 * Math.max(0.001, q)); }, () => { G.scene.remove(mud); mud.geometry.dispose(); mud.material.dispose(); }); }
      done(style === 'grow' || style === 'soak' ? ground.clone() : mid);
    });
  },

  /** the result's entrance, matched to the story */
  reveal(style, ent) {
    if (!ent || !ent.body) return;
    const b = ent.body, p = ent.root.position;
    if (style === 'grow') {           // sprout pops up out of the mud
      ent.popDur = 0.9; b.velocity.set(0, 2.6, 0);
      for (let i = 0; i < 4; i++) setTimeout(() => Particles.emit({ pos: p, color: [0x5ad85a, 0x9aff8a, 0xfff27a], count: 6, speed: 1.2, size: 0.045, life: 0.9, up: 1, gravity: -0.5 }), i * 120);
    } else if (style === 'burn') {    // drives out of the smoke
      b.velocity.set((Math.random() - 0.5) * 1.5, 2, (Math.random() - 0.5) * 1.5);
      Particles.emit({ add: false, pos: p, color: [0x4a4a4a, 0x6a6a6a], count: 14, speed: 1.2, size: 0.15, sizeEnd: 0.5, life: 1.4, alpha: 0.45, up: 1 });
    } else if (style === 'hatch') {   // bursts out of the egg
      ent.popDur = 0.7; b.velocity.set(0, 3, 0);
      Particles.burst(p, [0xfff4e0, 0xffffff, 0xffd0e0], 30, 2.2, 0.06);
    } else if (style === 'magic') {
      b.velocity.set(0, 0.5, 0); Rings.spawn(p, 0xb04dff, 0.8, 0.7, true);
    } else if (style === 'build') {
      ent.popDur = 0.35; Sound.tone(1200, 0.1, { vol: 0.06, glide: 1500 });
    } else if (style === 'soak') {
      b.velocity.set(0, 2.2, 0); Particles.emit({ pos: p, color: [0x8ad0ff, 0xffffff], count: 20, speed: 2, size: 0.05, life: 0.6, up: 0.8, gravity: -4 });
    }
  },
};
