// ============================================================================
//  ELEMENTAL LAB — 20c · The fun loop: XP & levels, combo chains, "you can
//  make N new things right now" teaser, lucky crafts, and the Big Item Yard
//  behind the shelf wall where large creations are delivered.
// ============================================================================

const Fun = {
  combo: 0, comboT: 0, possible: 0,
  xpFor(level) { return Math.round(60 * Math.pow(level, 1.45)); },
  get level() { return Progress.stats.level || 1; },
  init() { this.updateHud(); this.recount(); },

  onCraft(info, isNew, recipeNew, pos) {
    const S = Progress.stats;
    // combo: chain discoveries/new recipes within 9 seconds
    if (isNew || recipeNew) { this.combo = this.comboT > 0 ? this.combo + 1 : 1; this.comboT = 9; }
    const mult = Math.min(5, Math.max(1, this.combo));
    let xp = isNew ? [10, 18, 30, 55, 100, 200][info.rarity] : recipeNew ? 4 : 1;
    // first discovery of the day is worth triple
    const today = Daily.today();
    if (isNew && S.lastDiscDay !== today) { S.lastDiscDay = today; xp *= 3; UI.toast('☀️', 'First discovery today!', 'Triple XP'); }
    // lucky craft: 6% of new discoveries pay out a jackpot
    if (isNew && Math.random() < 0.06) { xp *= 5; this.jackpot(pos); }
    this.gain(xp * mult, pos, mult);
    if (this.combo >= 2 && (isNew || recipeNew)) this.showCombo();
    if (isNew) this.recount(true);
  },

  gain(xp, pos, mult = 1) {
    const S = Progress.stats;
    S.xp = (S.xp || 0) + xp;
    if (pos) UI.xpPop(`+${xp} XP${mult > 1 ? ` ×${mult}` : ''}`, pos);
    while (S.xp >= this.xpFor(this.level)) { S.xp -= this.xpFor(this.level); S.level = this.level + 1; this.levelUp(); }
    this.updateHud();
  },

  levelUp() {
    const L = this.level;
    UI.bigText(`LEVEL ${L}!`, '#ffb703');
    Sound.achievement(); Sound.swell(4);
    UI.hintCooldown = 0;
    UI.toast('⭐', `Level ${L} reached`, 'Free hint recharged — press H!' , 'ach');
    if (G.camera) {
      const p = _v1.copy(G.camera.position).addScaledVector(Player.dir, 2);
      for (let i = 0; i < 5; i++) setTimeout(() => Particles.emit({ pos: p, color: [0xffe85a, 0xff5ad8, 0x5ab8ff, 0x5aff8a], count: 60, speed: 4, size: 0.06, life: 1.3, gravity: -2, up: 0.5 }), i * 120);
    }
    if (L % 5 === 0) { Progress.wallHue = Math.random(); Room.setWallHue(Progress.wallHue); UI.toast('🎨', 'New lab colour unlocked', `Level ${L} reward`); }
  },

  jackpot(pos) {
    UI.bigText('🍀 LUCKY CRAFT! ×5 XP', '#2fbf63');
    Sound.discovery(5);
    for (let i = 0; i < 6; i++) setTimeout(() => Particles.emit({ pos, color: [0xffd23a, 0xffffff, 0x3ae05a], count: 40, speed: 3.5, size: 0.06, life: 1.2, up: 0.8 }), i * 90);
  },

  showCombo() {
    const el2 = $('combo');
    el2.textContent = `COMBO ×${Math.min(5, this.combo)}`;
    el2.classList.remove('pop'); void el2.offsetWidth; el2.classList.add('pop');
    Sound.tone(500 + this.combo * 120, 0.15, { vol: 0.08, glide: 900 + this.combo * 150 });
  },

  /** how many new items can be made right now from what you already have — the "one more craft" hook */
  recount(announce) {
    const disc = Progress.disc;
    let n = 0;
    for (const it of Universe.items) {
      if (disc.has(it.id) || it.secret) continue;
      for (const k of Universe.reverse.get(it.id) || []) { const [a, b] = k.split('|'); if (disc.has(a) && disc.has(b)) { n++; break; } }
    }
    const before = this.possible;
    this.possible = n;
    $('hud-possible').textContent = `✨ ${n} new item${n === 1 ? '' : 's'} within reach`;
    if (announce && n > before) UI.toast('🔓', `${n - before} new combination${n - before > 1 ? 's' : ''} unlocked`, `${n} items are one craft away. Press H for a hint.`);
  },

  update(dt) {
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) { this.combo = 0; $('combo').classList.remove('pop'); } }
    $('combo-bar').style.width = `${Math.max(0, this.comboT / 9) * 100}%`;
    $('combo-wrap').classList.toggle('hidden', this.comboT <= 0 || this.combo < 2 || !!G.ui);
  },

  updateHud() {
    const S = Progress.stats, need = this.xpFor(this.level);
    $('lvl-num').textContent = this.level;
    $('lvl-bar').style.width = `${Math.min(100, ((S.xp || 0) / need) * 100)}%`;
    $('lvl-xp').textContent = `${fmtInt(S.xp || 0)} / ${fmtInt(need)} XP`;
  },

  // ---------------------------------------------------------- the Big Item Yard (behind the shelf wall)
  yardSlot: 0,
  yardPos(radius) {
    // lay big creations out in rows behind the partition, never on top of each other
    const z0 = LAYOUT.shelf.wallZ - 2.5;
    const i = this.yardSlot++ % 24;
    const col = i % 6, row = Math.floor(i / 6);
    return new THREE.Vector3(-20 + col * 8, radius + 0.4, z0 - radius - row * 12);
  },
  deliverBig(info, r) {
    const pos = this.yardPos(r);
    Rings.spawn(new THREE.Vector3(pos.x, 0.05, pos.z), 0x9a7aff, r * 1.6 + 1, 0.9, true);
    Glows.flash(pos, 0xffffff, r * 3, 0.6);
    UI.toast(info.emoji, `${info.name} is too big for the table!`, 'Delivered to the Big Item Yard behind the shelf wall.');
    return pos;
  },
};
