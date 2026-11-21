// ============================================================================
//  ELEMENTAL LAB — 20 · Crafting: impact / touch / force merges, the Fusion
//  Ring (multi-input + Alt-click split), trash bin, Discovery Shelf, secrets,
//  plus progress tracking (discoveries, recipes, stats, achievements)
// ============================================================================

const Progress = {
  disc: new Map(), order: [], recipes: new Map(), stats: {}, ach: new Set(), wallHue: null, startedAt: Date.now(),
  has(id) { return this.disc.has(id); },
  discover(id) {
    if (this.disc.has(id)) return false;
    this.disc.set(id, this.order.length);
    this.order.push(id);
    Codex.onDiscover(id);
    Save.markDirty();
    return true;
  },
  addRecipe(resultId, key) {
    if (!key) return false;
    let s = this.recipes.get(resultId);
    if (!s) { s = new Set(); this.recipes.set(resultId, s); }
    if (s.has(key)) return false;
    s.add(key);
    this.stats.recipes = (this.stats.recipes || 0) + 1;
    Save.markDirty();
    return true;
  },
  recipeCount() { return this.stats.recipes || 0; },
};
const Stats = { add(k, n = 1) { Progress.stats[k] = (Progress.stats[k] || 0) + n; Save.markDirty(); if (k !== 'merges') Daily.count(k, n); } };

const ACHIEVEMENTS = [
  { id: 'd10', icon: '🔟', name: 'Curious Mind', desc: 'Discover 10 items' },
  { id: 'd100', icon: '💯', name: 'Lab Regular', desc: 'Discover 100 items' },
  { id: 'd1000', icon: '🏆', name: 'Grand Alchemist', desc: 'Discover 1,000 items' },
  { id: 'living', icon: '🌱', name: "It's Alive!", desc: 'Create your first living thing' },
  { id: 'machine', icon: '⚙️', name: 'Industrious', desc: 'Build your first machine' },
  { id: 'mythical', icon: '🐉', name: 'Here Be Dragons', desc: 'Create your first mythical creature' },
  { id: 'star', icon: '⭐', name: 'Stargazer', desc: 'Create a star or a galaxy' },
  { id: 'secret', icon: '🤫', name: 'Found the Secret', desc: 'Trigger a secret recipe' },
  { id: 'mod', icon: '✨', name: 'Remix', desc: 'Discover a modified item, like a Frozen Dragon' },
  { id: 'comp', icon: '🧩', name: 'Mad Science', desc: 'Create a composite, like a Fire Whale' },
  { id: 'legend', icon: '🌟', name: 'Legendary', desc: 'Discover a legendary item' },
  { id: 'mythic', icon: '🌈', name: 'Beyond Myth', desc: 'Discover a mythic item' },
  { id: 'fusion', icon: '🔮', name: 'Ring Leader', desc: 'Fuse 3 or more items in the Fusion Ring' },
  { id: 'split', icon: '🪓', name: 'Reverse Engineer', desc: 'Split an item back into its ingredients' },
  { id: 'r50', icon: '📜', name: 'Cookbook', desc: 'Find 50 recipes' },
  { id: 'shelf', icon: '🏺', name: 'Curator', desc: 'Display 5 trophies on the Discovery Shelf' },
  { id: 'throw', icon: '🎯', name: 'Pitcher', desc: 'Throw 25 items' },
  { id: 'trash', icon: '🗑️', name: 'Tidy Lab', desc: 'Trash 10 items' },
];
const STAR_IDS = new Set(['star', 'galaxy', 'shooting-star', 'neutron-star', 'milky-way', 'supernova', 'pulsar', 'quasar', 'sun', 'constellation', 'stardust', 'star-fruit']);

function unlock(id) {
  if (Progress.ach.has(id)) return;
  const a = ACHIEVEMENTS.find(x => x.id === id);
  if (!a) return;
  Progress.ach.add(id);
  UI.toast(a.icon, `Achievement: ${a.name}`, a.desc, 'ach');
  Sound.achievement();
  Save.markDirty();
}
function checkAchievements(info) {
  const n = Progress.order.length;
  if (n >= 10) unlock('d10'); if (n >= 100) unlock('d100'); if (n >= 1000) unlock('d1000');
  if (Progress.recipeCount() >= 50) unlock('r50');
  if (!info) return;
  const t = info.tags;
  const baseId = info.kind === 'core' ? info.id : info.base ? info.base.id : info.headItem ? info.headItem.id : null;
  if (t.includes('living') && !['life', 'bacteria'].includes(baseId) || ['plant', 'animal', 'human'].some(x => t.includes(x))) unlock('living');
  if (t.includes('machine')) unlock('machine');
  if (t.includes('mythical') && (t.includes('animal') || t.includes('human'))) unlock('mythical');
  if (STAR_IDS.has(baseId) || info.shape === 'galaxy') unlock('star');
  if (info.kind === 'mod') unlock('mod');
  if (info.kind === 'comp') unlock('comp');
  if (info.rarity >= 4) unlock('legend');
  if (info.rarity >= 5) unlock('mythic');
}

// ============================================================================
const Crafting = {
  ringActivity: 0, ringKey: '', ringTimer: 0, ringFusing: false, tick: 0,

  // ---------------------------------------------------------- pair merges
  merge(a, b, reason) {
    if (!a || !b || a === b || a.merging || b.merging || a.dead || b.dead) return;
    const keepHeld = (Player.held === a || Player.held === b) && reason !== 'impact';
    if (Player.held === a || Player.held === b) Player.drop(false);
    for (const e of [a, b]) { e.merging = true; e.removeBody(); }
    const mid = a.root.position.clone().add(b.root.position).multiplyScalar(0.5);
    mid.y += 0.05;
    const pa = a.root.position.clone(), pb = b.root.position.clone(), sa = a.root.scale.x, sb = b.root.scale.x;
    const key = pairKey(a.id, b.id);
    const pending = this.resolve(a.id, b.id);
    Sound.tone(260, 0.16, { vol: 0.08, glide: 700 });
    Tweens.add(0.17, (k) => {
      const e = ease.inCubic(k);
      a.root.position.lerpVectors(pa, mid, e); b.root.position.lerpVectors(pb, mid, e);
      a.root.scale.setScalar(sa * (1 - e * 0.5)); b.root.scale.setScalar(sb * (1 - e * 0.5));
      a.root.rotation.y += 0.25; b.root.rotation.y -= 0.25;
    }, () => {
      a.destroy(); b.destroy();
      const done = (res) => this.finish(res, mid, { key, keepHeld, inputs: [a.info, b.info] });
      if (pending.then) { const stop = this.thinking(mid); pending.then((r) => { stop(); done(r); }); } else done(pending);
    });
  },

  /** deterministic result, or a Promise when the optional LLM is consulted */
  resolve(idA, idB) {
    const r = Universe.combine(idA, idB) || { id: idA, how: 'fallback' };
    if (LLM.enabled() && ['rule', 'comp', 'fallback'].includes(r.how)) {
      return LLM.combine(idA, idB).then((llmId) => llmId ? { id: llmId, how: 'llm' } : r).catch(() => r);
    }
    return r;
  },

  thinking(pos) {
    let alive = true;
    const loop = () => { if (!alive) return; Glows.flash(pos, 0xb8a8ff, 0.9, 0.4); Particles.emit({ pos, color: [0xc8b8ff, 0xffffff], count: 8, speed: 1.2, size: 0.05, life: 0.4 }); setTimeout(loop, 160); };
    loop();
    return () => { alive = false; };
  },

  finish(res, pos, { key, keepHeld, inputs, multiKey }) {
    const id = res.id;
    const info = Universe.get(id);
    if (!info) return;
    const ent = spawnItem(id, pos, { popDur: 0.55, touched: true, vel: new THREE.Vector3(0, 1.4, 0) });
    this.fx(pos, info);
    const isNew = Progress.discover(id);
    const recNew = Progress.addRecipe(id, multiKey || key);
    if (ent) UI.floatLabel(ent, info, isNew);
    if (isNew) { UI.banner('NEW DISCOVERY!', info, false); Sound.discovery(info.rarity); }
    else if (recNew) { UI.banner('NEW RECIPE!', info, true); Sound.newRecipe(); }
    checkAchievements(info);
    Stats.add('merges');
    Daily.count('merges');
    Daily.onCraft(info, isNew, recNew);
    G.selected = id;
    if (info.secret) this.secret(info.secret, pos);
    if (keepHeld && ent && !Player.held) setTimeout(() => { if (!ent.dead && !ent.merging && !Player.held && Input.mouse.l) Player.grab(ent); }, 60);
    UI.updateHud();
  },

  fx(pos, info) {
    const r = info.rarity, c = info.color, lc = shiftColor(c, 0, 0.1, 0.2);
    Glows.flash(pos, 0xffffff, 1.3, 0.28);
    Glows.flash(pos, info.glowColor || c, 2.4 + r * 0.4, 0.55);
    Rings.spawn(pos, lc, 0.45 + r * 0.12, 0.5);
    Rings.spawn(pos, 0xffffff, 0.3, 0.3);
    Particles.burst(pos, [c, lc, 0xffffff], 45 + r * 25, 2.4 + r * 0.45, 0.07 + r * 0.008);
    Particles.emit({ add: false, pos, color: lt(c, 0.1), count: 10, size: 0.12, sizeEnd: 0.35, life: 0.8, alpha: 0.35, speed: 1 });
    if (r >= 3) { Rings.spawn(pos, parseInt(rarityHex(r).slice(1), 16), 1.2, 0.8, true); Particles.emit({ pos, color: [0xffe85a, 0xffffff, parseInt(rarityHex(r).slice(1), 16)], count: 40 + r * 15, speed: 4, size: 0.05, life: 1.4, gravity: -2, up: 0.7 }); }
    if (r >= 5) for (let i = 0; i < 6; i++) setTimeout(() => Particles.emit({ pos, color: [0xff4fd8, 0x3ab8ff, 0xffe14a, 0x3ae07a], count: 25, speed: 3.5, size: 0.06, life: 1, up: 0.5 }), i * 110);
    Sound.merge(r, pos);
    if (r >= 4) G.shake = Math.max(G.shake, 0.25);
  },

  // ---------------------------------------------------------- collisions
  processImpacts() {
    const list = Phys.impacts; Phys.impacts = [];
    for (const imp of list) {
      const a = imp.a, b = imp.b;
      if (!a || a.dead) continue;
      const heavier = b && b.body && b.body.mass > a.body?.mass ? b : a;
      Sound.impact(heavier.info.sound, imp.v, a.root.position, heavier.vis.radius);
      const m = Math.max(a.body ? a.body.mass : 0, b && b.body ? b.body.mass : 0);
      if (imp.v > 4.5 && m > 3 && a.root.position.distanceTo(G.camera.position) < 5) G.shake = Math.max(G.shake, Math.min(0.9, imp.v * m / 70));
      if (imp.v > 3 && Math.random() < 0.5) Particles.emit({ add: false, pos: a.root.position, color: 0xe8ecf2, count: 3, size: 0.06, sizeEnd: 0.14, life: 0.4, alpha: 0.4, speed: 0.5 });
      if (!b || b.dead || a.merging || b.merging) continue;
      const recent = (G.time - a.playerTouch < 2.5) || (G.time - b.playerTouch < 2.5);
      if (imp.v >= 4.2 && recent && G.time - a.spawnT > 0.6 && G.time - b.spawnT > 0.6) this.merge(a, b, 'impact');
    }
  },

  // ---------------------------------------------------------- fusion ring
  updateRing(dt) {
    const R = LAYOUT.ring, top = LAYOUT.table.top;
    const inside = [];
    for (const e of G.entities) {
      e.inRing = false;
      if (e.held || e.merging || e.dead) continue;
      const p = e.root.position;
      if (Math.hypot(p.x - R.x, p.z - R.z) < R.r - 0.02 && p.y > top - 0.05 && p.y < top + 1.5) { e.inRing = true; inside.push(e); }
    }
    if (this.ringFusing) { this.ringActivity = 1; return; }
    const key = inside.map(e => e.id).sort().join('+') + '#' + inside.length;
    if (key !== this.ringKey) { this.ringKey = key; this.ringTimer = 0; }
    const need = inside.length >= 3 ? 1.4 : 2.6;
    const settled = inside.every(e => !e.body || e.body.velocity.lengthSquared() < 2.5);
    if (inside.length >= 2) { this.ringTimer += dt * (settled ? 1 : 0.4); this.ringActivity = Math.min(1, 0.3 + this.ringTimer / need * 0.7); }
    else this.ringActivity = inside.length ? 0.2 : 0;
    if (inside.length >= 2 && this.ringTimer >= need) this.fuseRing(inside);
  },

  fuseRing(items) {
    this.ringFusing = true;
    const R = LAYOUT.ring, center = new THREE.Vector3(R.x, LAYOUT.table.top + 0.42, R.z);
    for (const e of items) { e.merging = true; e.removeBody(); }
    const starts = items.map(e => ({ e, p: e.root.position.clone(), a: Math.atan2(e.root.position.z - R.z, e.root.position.x - R.x), r: Math.hypot(e.root.position.x - R.x, e.root.position.z - R.z), s: e.root.scale.x }));
    Sound.chargeStart();
    Tweens.add(0.85, (k) => {
      Sound.chargeUpdate(k);
      for (const st of starts) {
        const a = st.a + k * k * 7, r = st.r * (1 - ease.inCubic(k));
        st.e.root.position.set(R.x + Math.cos(a) * r, lerp(st.p.y, center.y, ease.outCubic(k)), R.z + Math.sin(a) * r);
        st.e.root.scale.setScalar(st.s * (1 - k * 0.6));
        if (Math.random() < 0.5) Particles.emit({ pos: st.e.root.position, color: [0xb8a8ff, st.e.info.color], size: 0.05, life: 0.4, speed: 0.3 });
      }
    }, () => {
      Sound.chargeStop();
      const ids = items.map(e => e.id);
      for (const e of items) e.destroy();
      const res = Universe.fuseMany(ids) || { id: ids[0], how: 'fold' };
      const multiKey = ids.length >= 3 ? [...ids].sort().join('+') : pairKey(ids[0], ids[1]);
      this.finish(res, center, { key: multiKey, multiKey, keepHeld: false, inputs: [] });
      Rings.spawn(center, 0x9a7aff, 1.6, 0.6, true);
      if (ids.length >= 3) unlock('fusion');
      Stats.add('fusions');
      this.ringFusing = false; this.ringKey = ''; this.ringTimer = 0;
    });
  },

  tryBreakdown(e) {
    if (!e.inRing) { UI.toast('🔮', 'Split in the Fusion Ring', 'Put the item in the glowing ring on the table, then Alt + click it.'); Sound.error(); return; }
    const parts = Universe.breakdown(e.id);
    if (!parts || !parts.length) { UI.toast('🧱', "Can't split this", `${e.info.name} is as simple as it gets.`); Sound.error(); return; }
    const pos = e.root.position.clone();
    const key = parts.length === 2 ? pairKey(parts[0], parts[1]) : null;
    e.vanish(e.info.color, 0.25, () => {
      Sound.split();
      Rings.spawn(pos, e.info.color, 1.0, 0.45);
      Particles.burst(pos, [e.info.color, 0xffffff], 40, 2.5);
      parts.forEach((pid, i) => {
        const a = i / parts.length * Math.PI * 2;
        const ent = spawnItem(pid, pos.clone().add(new THREE.Vector3(Math.cos(a) * 0.12, 0.12, Math.sin(a) * 0.12)), { vel: new THREE.Vector3(Math.cos(a) * 1.6, 2.6, Math.sin(a) * 1.6), touched: true });
        if (Progress.discover(pid)) { const inf = Universe.get(pid); UI.toast(inf.emoji, `Recovered ${inf.name}`, 'Found by splitting'); checkAchievements(inf); }
        if (ent) ent.spawnT = G.time + 0.6;
      });
      if (key) Progress.addRecipe(e.id, key);
      unlock('split'); Stats.add('splits');
      UI.updateHud();
    });
  },

  // ---------------------------------------------------------- trash + shelf
  updateZones() {
    const T = LAYOUT.trash, S = LAYOUT.shelf;
    for (const e of [...G.entities]) {
      if (e.held || e.merging || e.dead) continue;
      const p = e.root.position;
      if (Math.hypot(p.x - T.x, p.z - T.z) < T.r * 0.9 && p.y < T.h + 0.08) {
        e.vanish(0xff6a3a, 0.3);
        Particles.emit({ pos: p, color: [0xff6a3a, 0xffb03a, 0xffffff], count: 30, speed: 2, size: 0.06, life: 0.6, up: 0.8 });
        Glows.flash(new THREE.Vector3(T.x, T.h, T.z), 0xff5a2a, 1.4, 0.4);
        Sound.trash(); Stats.add('trashed');
        if ((Progress.stats.trashed || 0) >= 10) unlock('trash');
        continue;
      }
      if (p.z < S.z + 0.42 && e.body && e.body.velocity.lengthSquared() < 6) {
        const slot = Trophies.nearestFree(p, 0.36);
        if (slot != null) this.toShelf(e, slot);
      }
    }
  },
  toShelf(e, slot = null) {
    if (!e || e.merging || e.dead) return;
    if (slot == null && Trophies.freeSlot() == null) UI.toast('🏺', 'Shelf full', 'The oldest trophy was replaced.');
    if (Player.held === e) Player.drop(false);
    const from = e.root.position.clone();
    Trophies.place(e.id, slot, from);
    e.destroy();
    Sound.shelf();
    Particles.emit({ pos: from, color: [0xffe85a, 0xffffff], count: 20, speed: 1.2, size: 0.05, life: 0.6 });
    if (G.trophies.filter(Boolean).length >= 5) unlock('shelf');
  },

  // ---------------------------------------------------------- secrets
  secret(kind, pos) {
    unlock('secret');
    const E = G.effects;
    const toast = { disco: ['🪩', 'DANCE PARTY!', 'The lab is now a club.'], chroma: ['🎨', 'CHROMA!', 'The walls changed colour.'], slowmo: ['⏱️', 'BULLET TIME', 'Time slows to a crawl…'],
      zerog: ['🪶', 'ZERO GRAVITY', 'Everything floats!'], bigbang: ['💥', 'THE BIG BANG', 'A new universe begins.'], fireworks: ['🎆', 'FIREWORKS!', 'Look up!'], snowfall: ['🌨️', 'SNOWFALL', "It's snowing indoors."] }[kind];
    if (toast) UI.toast(toast[0], toast[1], toast[2], 'ach');
    if (kind === 'disco') E.disco = 22;
    if (kind === 'chroma') { Progress.wallHue = Math.random(); Room.setWallHue(Progress.wallHue); Save.markDirty(); }
    if (kind === 'slowmo') E.slowmo = 10;
    if (kind === 'zerog') { E.zerog = 15; Phys.world.gravity.set(0, -0.7, 0); for (const e of G.entities) if (e.body) { e.body.wakeUp(); e.body.velocity.y += 1 + Math.random(); } }
    if (kind === 'bigbang') {
      UI.flash(1); Sound.bigBoom(); G.shake = 1.2; E.starfield = 9;
      for (const e of G.entities) if (e.body) { _v1.copy(e.root.position).sub(pos); const d = Math.max(0.3, _v1.length()); _v1.normalize().multiplyScalar(9 / d); e.body.wakeUp(); e.body.velocity.set(_v1.x, _v1.y + 4, _v1.z); }
      for (let i = 0; i < 4; i++) setTimeout(() => Rings.spawn(pos, [0xffffff, 0xffd8ff, 0x8ab8ff, 0xffe85a][i], 3 + i, 1.0), i * 120);
    }
    if (kind === 'fireworks') E.fireworks = 12;
    if (kind === 'snowfall') E.snow = 26;
  },
  updateEffects(dt) {
    const E = G.effects, R = LAYOUT.room;
    for (const k in E) if (E[k] > 0) E[k] = Math.max(0, E[k] - dt);
    G.timeScale = E.slowmo > 0 ? (E.slowmo > 9.5 ? lerp(1, 0.25, (10 - E.slowmo) * 2) : E.slowmo < 0.5 ? lerp(1, 0.25, E.slowmo * 2) : 0.25) : 1;
    if (E.zerog <= 0 && Phys.world.gravity.y > -9) Phys.world.gravity.set(0, -9.82, 0);
    if (E.snow > 0) for (let i = 0; i < 3; i++) Particles.emit({ add: false, pos: _v1.set(lerp(R.x0, R.x1, Math.random()), R.h - 0.1, lerp(R.z0, 3.5, Math.random())), vel: { x: 0, y: -0.6, z: 0 }, color: 0xffffff, size: 0.05, sizeEnd: 0.05, life: 6, alpha: 0.9, drag: 0, speed: 0.05 });
    if (E.fireworks > 0 && Math.random() < dt * 3) {
      const p = new THREE.Vector3(lerp(-4, 4, Math.random()), 2.6 + Math.random() * 1.2, lerp(-3, 2, Math.random()));
      const col = [0xff3ad8, 0x3ad8ff, 0xffe03a, 0x7aff5a, 0xff6a3a][Math.floor(Math.random() * 5)];
      Particles.emit({ pos: p, color: [col, 0xffffff], count: 70, speed: 3.2, size: 0.07, life: 1.3, gravity: -1.5, drag: 1.6 });
      Glows.flash(p, col, 2.5, 0.5);
      Sound.noiseBurst(0.3, { vol: 0.2, freq: 900, sweep: 200, verb: 0.6 });
    }
    if (E.starfield > 0 && Math.random() < dt * 30) Particles.emit({ pos: _v1.set(lerp(R.x0, R.x1, Math.random()), Math.random() * R.h, lerp(R.z0, R.z1, Math.random())), color: [0xffffff, 0xc8b8ff, 0x8ab8ff], size: 0.06, life: 2.5, speed: 0.02, drag: 0 });
    if (E.disco > 0 && Math.random() < dt * 20) Particles.emit({ pos: _v1.set(lerp(-4, 4, Math.random()), 3.8, lerp(-3, 3, Math.random())), color: [0xff3ad8, 0x3ad8ff, 0xffe03a], size: 0.05, life: 1.5, gravity: -1.5, speed: 0.2 });
  },

  update(dt) {
    this.processImpacts();
    this.updateRing(dt);
    if (++this.tick % 3 === 0) this.updateZones();
    if (this.tick % 300 === 0) despawnIdle();
    this.updateEffects(dt);
  },
};
