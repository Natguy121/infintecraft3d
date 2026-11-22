// ============================================================================
//  ELEMENTAL LAB — 20e · Things come alive: item powers, creature sounds, pets
// ============================================================================

const kw = (info, ...words) => { const n = ' ' + info.name.toLowerCase() + ' '; return words.some(w => n.includes(w)); };

// ---------------------------------------------------------------- item powers
const Powers = {
  lights: [],
  kind(e) {
    if (e._pk !== undefined) return e._pk;
    const i = e.info, t = i.tags, mods = i.mods || [];
    let k = null;
    if (kw(i, 'bomb', 'dynamite', 'tnt', 'grenade', 'nuke', 'explosive') || mods.includes('explosive')) k = 'bomb';
    else if (kw(i, 'black hole', 'vortex', 'singularity', 'wormhole')) k = 'hole';
    else if (kw(i, 'magnet', 'lodestone')) k = 'magnet';
    else if (kw(i, ' fan ', 'tornado', 'hurricane', 'wind turbine', 'leaf blower')) k = 'fan';
    else if (kw(i, 'rocket', 'jetpack', 'spaceship', 'missile', 'firework')) k = 'rocket';
    else if (kw(i, 'balloon', 'helium', 'blimp', 'zeppelin')) k = 'float';
    else if (kw(i, 'lamp', 'light bulb', 'lightbulb', 'lantern', 'torch', 'candle', 'campfire', 'fireplace')) k = 'light';
    else if (kw(i, 'trampoline', 'spring', 'bouncy')) k = 'bouncy';
    return (e._pk = k);
  },
  update(dt) {
    const P = G.camera.position;
    let lightsUsed = 0;
    for (const e of [...G.entities]) {
      if (e.dead || e.merging || !e.body || e.remote) continue;
      const k = this.kind(e); if (!k) continue;
      const b = e.body, p = e.root.position, v = b.velocity.length();
      if (k === 'bomb') {
        const thrown = G.time - e.playerTouch < 4 && !e.held;
        if (thrown && (e._pv || 0) > 5 && v < (e._pv || 0) * 0.45) { this.explode(e); continue; }
        e._pv = v;
        if (thrown && Math.random() < 0.3) Particles.emit({ pos: p.clone().add(new THREE.Vector3(0, e.vis.radius, 0)), color: [0xffd24a, 0xff7a2a], count: 1, speed: 0.6, size: 0.04, life: 0.3 });
      } else if (k === 'hole') {
        const R = 7 + e.vis.radius * 3;
        for (const o of G.entities) {
          if (o === e || o.dead || o.merging || !o.body || o.held || o.remote || o.pet || o.placed) continue;
          const d = o.root.position.distanceTo(p); if (d > R) continue;
          if (d < e.vis.radius + 0.25) { o.vanish(0x6a3aff, 0.25); Particles.emit({ pos: o.root.position, color: [0x8a5aff, 0x000000], count: 12, speed: 1.5, size: 0.05, life: 0.4 }); continue; }
          const f = (1 - d / R) * 22 * o.body.mass / Math.max(0.6, d);
          o.body.applyForce(new CANNON.Vec3((p.x - o.root.position.x) * f / d, (p.y - o.root.position.y) * f / d + o.body.mass * 4, (p.z - o.root.position.z) * f / d)); o.body.wakeUp();
        }
        if (Math.random() < 0.5) Particles.emit({ pos: p, color: [0x8a5aff, 0x2a1a5a], count: 2, speed: -1.5, size: 0.06, life: 0.6 });
      } else if (k === 'magnet') {
        for (const o of G.entities) {
          if (o === e || o.dead || !o.body || o.held || o.remote || o.placed || !(o.info.tags.includes('metal') || o.info.material === 'metal')) continue;
          const d = o.root.position.distanceTo(p); if (d > 5 || d < 0.05) continue;
          const f = 30 * o.body.mass / (d * d + 0.5);
          o.body.applyForce(new CANNON.Vec3((p.x - o.root.position.x) * f / d, (p.y - o.root.position.y) * f / d, (p.z - o.root.position.z) * f / d)); o.body.wakeUp();
        }
      } else if (k === 'fan') {
        const swirl = kw(e.info, 'tornado', 'hurricane');
        const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(e.root.quaternion);
        for (const o of G.entities) {
          if (o === e || o.dead || !o.body || o.held || o.remote || o.placed) continue;
          const rel = o.root.position.clone().sub(p), d = rel.length(); if (d > 6 || d < 0.05) continue;
          const m = o.body.mass * (1 - d / 6);
          if (swirl) o.body.applyForce(new CANNON.Vec3(-rel.z * 9 * m / d + -rel.x * 3 * m / d, 14 * m, rel.x * 9 * m / d - rel.z * 3 * m / d));
          else if (rel.dot(fwd) > 0) o.body.applyForce(new CANNON.Vec3(fwd.x * 25 * m, 2 * m, fwd.z * 25 * m));
          o.body.wakeUp();
        }
        if (Math.random() < 0.3) Particles.emit({ add: false, pos: p, color: 0xe8ecf2, count: 1, speed: 2, size: 0.05, sizeEnd: 0.2, life: 0.6, alpha: 0.3 });
      } else if (k === 'rocket') {
        if (!e.held && G.time - e.playerTouch < 2.2 && v > 2) {
          const dir = b.velocity.clone(); dir.normalize();
          b.applyForce(dir.scale(b.mass * 30)); b.applyForce(new CANNON.Vec3(0, b.mass * 9.8, 0));
          Particles.emit({ pos: p, color: [0xffb03a, 0xff5a1a, 0xffffff], count: 3, speed: 1, size: 0.07, life: 0.35 });
        }
      } else if (k === 'float') {
        if (!e.held) { b.applyForce(new CANNON.Vec3(0, b.mass * (9.82 + (p.y < 8 ? 1.2 : -1)), 0)); b.linearDamping = 0.4; b.wakeUp(); }
      } else if (k === 'bouncy') {
        b.material = Phys.mats.bouncy;
        for (const o of G.entities) {
          if (o === e || !o.body || o.held || o.placed) continue;
          const dx = o.root.position.x - p.x, dz = o.root.position.z - p.z, dy = o.root.position.y - p.y;
          if (Math.hypot(dx, dz) < e.vis.radius && dy > 0 && dy < e.vis.radius + o.vis.radius + 0.1 && o.body.velocity.y <= 0.2) o.body.velocity.y = 7;
        }
      } else if (k === 'light' && lightsUsed < 6 && p.distanceTo(P) < 25) {
        if (!this.lights[lightsUsed]) { const L = new THREE.PointLight(0xffc878, 0, 7, 1.6); G.scene.add(L); this.lights[lightsUsed] = L; }
        const L = this.lights[lightsUsed++]; L.position.copy(p).y += e.vis.radius; L.intensity = (Horror.on ? 4 : 1.6) * (0.9 + Math.random() * 0.1);
      }
    }
    for (let i = lightsUsed; i < this.lights.length; i++) this.lights[i].intensity = 0;
  },
  explode(e) {
    const p = e.root.position.clone(), R = 4.5 + e.vis.radius * 2;
    e.vanish(0xff7a2a, 0.05);
    Particles.emit({ pos: p, color: [0xffd24a, 0xff7a2a, 0xff3a1a, 0xffffff], count: 70, speed: 7, size: 0.12, sizeEnd: 0.02, life: 0.8, up: 1 });
    Particles.emit({ add: false, pos: p, color: 0x5a5a60, count: 25, speed: 2, size: 0.3, sizeEnd: 0.9, life: 1.6, alpha: 0.5, up: 1.2 });
    Glows.flash(p, 0xffa040, 4, 0.5); UI.flash(0.35);
    if (p.distanceTo(G.camera.position) < 14) G.shake = Math.max(G.shake, 0.8);
    try { Sound.noiseBurst(0.9, { vol: 0.7, type: 'lowpass', freq: 600, sweep: -500, verb: 0.5 }); Sound.tone(55, 0.6, { vol: 0.5, glide: 30 }); } catch (err) { /* audio */ }
    for (const o of G.entities) {
      if (o === e || o.dead || !o.body || o.remote) continue;
      const rel = o.root.position.clone().sub(p), d = rel.length(); if (d > R) continue;
      const s = (1 - d / R) * 14 * Math.min(o.body.mass, 60) / Math.max(1, Math.sqrt(o.body.mass));
      rel.normalize(); o.body.applyImpulse(new CANNON.Vec3(rel.x * s, (rel.y + 0.8) * s, rel.z * s)); o.body.wakeUp(); o.touch(true);
      if (this.kind(o) === 'bomb' && !o.dead) setTimeout(() => { if (!o.dead && !o.merging) this.explode(o); }, 140 + d * 40);
    }
    const pd = G.camera.position.distanceTo(p);
    if (pd < R && Player.body) { const r = G.camera.position.clone().sub(p).normalize(); Player.body.velocity.x += r.x * 8 * (1 - pd / R); Player.body.velocity.y += 4 * (1 - pd / R); Player.body.velocity.z += r.z * 8 * (1 - pd / R); }
    Stats.add('explosions');
  },
};

// ---------------------------------------------------------------- creature voices
const Voices = {
  t: 3,
  kind(info) {
    if (!(info.tags.includes('animal') || info.tags.includes('human') || ['creature', 'bird', 'fish', 'snake', 'insect', 'humanoid'].includes(info.shape))) return null;
    if (kw(info, 'dog', 'puppy', 'wolf', 'husky', 'fox', 'cerberus')) return 'bark';
    if (kw(info, 'cat', 'kitten', 'lynx')) return 'meow';
    if (kw(info, 'cow', 'bull', 'ox ', 'bison', 'minotaur')) return 'moo';
    if (kw(info, 'pig', 'boar')) return 'oink';
    if (kw(info, 'sheep', 'lamb', 'goat', 'llama')) return 'baa';
    if (kw(info, 'horse', 'pony', 'donkey', 'zebra', 'unicorn', 'pegasus', 'centaur')) return 'neigh';
    if (kw(info, 'frog', 'toad')) return 'ribbit';
    if (kw(info, 'snake', 'cobra', 'python', 'serpent', 'basilisk', 'medusa')) return 'hiss';
    if (kw(info, 'duck', 'goose')) return 'quack';
    if (kw(info, 'owl')) return 'hoot';
    if (kw(info, 'lion', 'tiger', 'bear', 'dragon', 'monster', 'dinosaur', 't-rex', 'yeti', 'bigfoot', 'demon', 'kraken', 'wyvern', 'hydra', 'leviathan', 'troll', 'ogre', 'golem', 'gorilla', 'werewolf', 'godzilla')) return 'roar';
    if (info.shape === 'bird' || kw(info, 'bird', 'chicken', 'chick', 'parrot', 'eagle', 'crow', 'penguin', 'phoenix')) return 'chirp';
    if (info.shape === 'insect' || kw(info, 'bee', 'fly', 'mosquito')) return 'buzz';
    if (info.shape === 'fish' || kw(info, 'whale', 'dolphin')) return 'blub';
    if (info.tags.includes('human') || info.shape === 'humanoid') return 'hum';
    return 'grunt';
  },
  play(kind, pos) {
    if (!Sound.ctx || Sound.muted || !kind) return;
    const d = pos ? pos.distanceTo(G.camera.position) : 2, vol = clamp(1.2 / (1 + d * 0.35), 0.02, 0.5);
    const cam = G.camera, right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const pan = pos ? clamp(pos.clone().sub(cam.position).normalize().dot(right), -0.9, 0.9) : 0;
    const T = (f, dur, o = {}) => Sound.tone(f, dur, { vol, pan, verb: 0.25, ...o, vol: (o.v || 1) * vol });
    const N = (dur, o = {}) => Sound.noiseBurst(dur, { vol, pan, verb: 0.2, ...o, vol: (o.v || 1) * vol });
    try {
      switch (kind) {
        case 'bark': for (const t of [0, 0.22]) { T(520, 0.09, { type: 'sawtooth', glide: 300, delay: t, filter: 1400 }); N(0.08, { delay: t, type: 'bandpass', freq: 900, v: 0.6 }); } break;
        case 'meow': T(560, 0.45, { type: 'triangle', glide: 780, filter: 2400 }); T(780, 0.3, { type: 'triangle', glide: 480, delay: 0.25, filter: 2000, v: 0.7 }); break;
        case 'moo': T(120, 0.9, { type: 'sawtooth', glide: 95, filter: 700, v: 1.2 }); T(240, 0.9, { type: 'sawtooth', glide: 190, filter: 600, v: 0.4 }); break;
        case 'oink': for (const t of [0, 0.18]) T(240, 0.12, { type: 'square', glide: 180, delay: t, filter: 900 }); break;
        case 'baa': T(330, 0.6, { type: 'sawtooth', filter: 1200, detune: 30 }); T(334, 0.6, { type: 'sawtooth', filter: 1200, v: 0.6 }); break;
        case 'neigh': T(700, 0.7, { type: 'sawtooth', glide: 300, filter: 1800 }); break;
        case 'ribbit': for (const t of [0, 0.14]) T(180, 0.1, { type: 'square', glide: 260, delay: t, filter: 800 }); break;
        case 'hiss': N(0.7, { type: 'highpass', freq: 4000, v: 0.8 }); break;
        case 'quack': for (const t of [0, 0.2]) T(420, 0.12, { type: 'sawtooth', glide: 300, delay: t, filter: 1100, q: 4 }); break;
        case 'hoot': for (const t of [0, 0.4]) T(380, 0.3, { type: 'sine', glide: 340, delay: t }); break;
        case 'roar': T(90, 1.1, { type: 'sawtooth', glide: 60, filter: 500, v: 1.4 }); N(1.0, { type: 'lowpass', freq: 500, v: 1.2 }); break;
        case 'chirp': for (let i = 0; i < 3; i++) T(2400 + Math.random() * 800, 0.06, { glide: 3400, delay: i * 0.09, v: 0.5 }); break;
        case 'buzz': T(220, 0.6, { type: 'sawtooth', filter: 900, detune: 15, v: 0.4 }); break;
        case 'blub': for (const t of [0, 0.12, 0.3]) T(300 + Math.random() * 200, 0.08, { glide: 700, delay: t, v: 0.5 }); break;
        case 'hum': T(180, 0.5, { type: 'triangle', glide: 200, filter: 900, v: 0.5 }); break;
        default: T(150, 0.35, { type: 'sawtooth', glide: 110, filter: 600 }); N(0.2, { type: 'lowpass', freq: 400, v: 0.6 });
      }
    } catch (err) { /* audio optional */ }
  },
  update(dt) {
    this.t -= dt;
    if (this.t > 0) return;
    this.t = 2.5 + Math.random() * 5;
    const near = G.entities.filter(e => !e.dead && !e.merging && e.root.position.distanceTo(G.camera.position) < 12 && this.kind(e.info));
    if (!near.length) return;
    const e = near[Math.floor(Math.random() * near.length)];
    this.play(this.kind(e.info), e.root.position);
  },
};

// ---------------------------------------------------------------- pets
const PET_NAMES = ['Buddy', 'Pip', 'Mochi', 'Ziggy', 'Nugget', 'Bean', 'Sparky', 'Pickle', 'Waffles', 'Biscuit', 'Noodle', 'Luna', 'Rex', 'Coco', 'Bubbles'];
const Pets = {
  pet: null, data: null,
  init() {
    Ext.register('pet', () => this.data);
    const d = Ext.take('pet');
    if (d && Universe.isValidId(d.id)) { this.data = d; setTimeout(() => this.spawn(), 300); }
  },
  canAdopt(e) { return e && !e.remote && !e.dead && (e.info.tags.includes('animal') || ['creature', 'bird', 'fish', 'snake', 'insect'].includes(e.info.shape)); },
  adopt(e) {
    if (!this.canAdopt(e)) { UI.toast('🐾', 'Only animals can be pets', 'Look at or hold an animal and press G.'); return; }
    if (this.pet && this.pet !== e) { this.pet.pet = false; }
    const name = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
    this.data = { id: e.id, name, lvl: 1, xp: 0 };
    this.attach(e);
    UI.toast(e.info.emoji, `Meet ${name}, your pet ${e.info.name}!`, 'It follows you around and levels up as you craft.');
    Voices.play(Voices.kind(e.info), e.root.position);
    Particles.emit({ pos: e.root.position, color: [0xff6aa8, 0xffffff], count: 20, speed: 1.5, size: 0.06, life: 0.8, up: 0.8 });
    Save.markDirty();
  },
  attach(e) {
    this.pet = e; e.pet = true;
    e.root.scale.setScalar(1 + (this.data.lvl - 1) * 0.04);
    this.labelT = 0;
  },
  spawn() {
    if (!this.data || (this.pet && !this.pet.dead)) return;
    const c = G.camera.position, f = new THREE.Vector3(0, 0, -2).applyAxisAngle(new THREE.Vector3(0, 1, 0), Player.yaw || 0);
    const e = spawnItem(this.data.id, new THREE.Vector3(c.x + f.x, 1, c.z + f.z), { touched: true });
    if (e) this.attach(e);
  },
  onCraft() {
    if (!this.data) return;
    this.data.xp++;
    const need = 6 + this.data.lvl * 4;
    if (this.data.xp >= need) {
      this.data.xp -= need; this.data.lvl++;
      if (this.pet && !this.pet.dead) { this.pet.root.scale.setScalar(Math.min(1.6, 1 + (this.data.lvl - 1) * 0.04)); Particles.emit({ pos: this.pet.root.position, color: [0xffd24a, 0xffffff], count: 25, speed: 2, size: 0.06, life: 0.8, up: 1 }); Voices.play(Voices.kind(this.pet.info), this.pet.root.position); }
      UI.toast('🐾', `${this.data.name} reached level ${this.data.lvl}!`, 'Your pet grows a little each level.');
    }
    Save.markDirty();
  },
  update(dt) {
    if (Input.pressed.has('KeyG') && G.locked && !G.ui) {
      const t = Player.held || (G.lookTarget && G.lookTarget.kind === 'entity' ? G.lookTarget.obj : null);
      if (t) this.adopt(t); else if (this.data) { if (!this.pet || this.pet.dead) this.spawn(); else this.call(); } else UI.toast('🐾', 'No pet yet', 'Look at or hold an animal and press G to adopt it.');
    }
    const e = this.pet;
    if (!e) return;
    if (e.dead) { this.pet = null; if (this.data) setTimeout(() => this.spawn(), 2500); return; }
    if (e.held || e.merging || !e.body) return;
    const b = e.body, p = e.root.position, c = G.camera.position;
    const dx = c.x - p.x, dz = c.z - p.z, d = Math.hypot(dx, dz);
    if (d > 40) { b.position.set(c.x - dx / d * 2, 2, c.z - dz / d * 2); b.velocity.set(0, 0, 0); return; }
    e.lastTouch = G.time;
    const flyer = e.info.shape === 'bird' || e.info.tags.includes('flying') || e.info.shape === 'insect';
    const want = 1.6 + e.vis.radius * 1.5;
    b.wakeUp();
    if (d > want) {
      const sp = Math.min(6, (d - want) * 2.2);
      b.velocity.x += (dx / d * sp - b.velocity.x) * Math.min(1, dt * 4);
      b.velocity.z += (dz / d * sp - b.velocity.z) * Math.min(1, dt * 4);
      if (!flyer && Math.abs(b.velocity.y) < 0.2 && Math.random() < dt * 2.5) b.velocity.y = 2.6;   // hop along
    } else { b.velocity.x *= 0.9; b.velocity.z *= 0.9; }
    if (flyer) b.applyForce(new CANNON.Vec3(0, b.mass * (9.82 + (1.7 - p.y) * 3 - b.velocity.y * 1.5), 0));
    // face the player
    const yaw = Math.atan2(dx, dz);
    b.quaternion.setFromEuler(0, yaw, 0); b.angularVelocity.set(0, 0, 0);
  },
  call() { if (this.pet) { Voices.play(Voices.kind(this.pet.info), this.pet.root.position); UI.toast('🐾', `${this.data.name} (Lv ${this.data.lvl})`, `${this.data.xp}/${6 + this.data.lvl * 4} XP to next level. Adopt another animal with G to switch.`); } },
};
