// ============================================================================
//  ELEMENTAL LAB — 20b · Daily challenges
//  Three challenges per calendar day, picked deterministically from the date
//  (so everyone gets the same ones): craft a target item, give anything a
//  specific modifier, and hit an activity goal. Completing all three keeps a
//  streak going.
// ============================================================================

const DAILY_MODS = ['frozen', 'golden', 'burning', 'electric', 'cosmic', 'giant', 'tiny', 'crystal', 'ancient', 'robotic', 'zombie', 'holy', 'cursed', 'shadow', 'rainbow', 'enchanted', 'sticky', 'spicy', 'king', 'baby'];
const DAILY_GOALS = [
  { stat: 'merges', n: 15, icon: '⚗️', text: 'Perform {n} fusions' },
  { stat: 'newItems', n: 8, icon: '🧪', text: 'Discover {n} new items' },
  { stat: 'fusions', n: 2, icon: '🔮', text: 'Use the Fusion Ring {n} times' },
  { stat: 'thrown', n: 15, icon: '🎯', text: 'Throw {n} items' },
  { stat: 'newRecipes', n: 10, icon: '📜', text: 'Find {n} new recipes' },
  { stat: 'splits', n: 2, icon: '✂️', text: 'Split {n} items in the Fusion Ring' },
];

const Daily = {
  list: [],
  today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
  state() {
    const s = Progress.daily || (Progress.daily = { date: '', done: [], counts: {}, streak: 0, lastFull: '' });
    const t = this.today();
    if (s.date !== t) { s.date = t; s.done = []; s.counts = {}; s.target = null; }
    return s;
  },
  init() { this.build(); this.builtFor = this.state().date; this.updateHud(); },
  build() {
    const date = this.state().date;
    const rng = makeRng(hashStr('daily:' + date));
    // 1. craft a target: a reachable mid-tier core item, ideally one the player hasn't found
    const pool = Universe.items.filter(it => it.tier >= 2 && it.tier <= 7 && !it.secret && !it.unreachable && it.recipes.length);
    const st = this.state();
    let target = st.target && Universe.byId.get(st.target);
    if (!target) {
      target = pool[Math.floor(rng() * pool.length)];
      for (let i = 0; i < 12 && Progress.has(target.id); i++) target = pool[Math.floor(rng() * pool.length)];
      st.target = target.id;
    }
    const mod = MOD_BY_ID.get(DAILY_MODS[Math.floor(rng() * DAILY_MODS.length)]);
    const src = Universe.get((Universe.modSources.get(mod.id) || [])[0]);
    const goal = DAILY_GOALS[Math.floor(rng() * DAILY_GOALS.length)];
    this.list = [
      { id: 'craft', icon: target.emoji, title: `Craft ${target.name}`, desc: `Tier ${target.tier} · try things that are ${(TAG_PHRASE[target.primaryTag] || 'related')}`, target: target.id },
      { id: 'mod', icon: mod.emoji, title: `Make anything ${mod.name}`, desc: src ? `Hint: combine something with ${src.emoji} ${src.name}` : '', mod: mod.id },
      { id: 'goal', icon: goal.icon, title: goal.text.replace('{n}', goal.n), desc: 'Today', stat: goal.stat, n: goal.n },
    ];
  },
  progress(c) {
    const s = this.state();
    if (s.done.includes(c.id)) return 1;
    if (c.id === 'goal') return Math.min(1, (s.counts[c.stat] || 0) / c.n);
    return 0;
  },
  /** called after every craft */
  onCraft(info, isNew, recipeNew) {
    const s = this.state();
    if (s.date !== this.builtFor) { this.builtFor = s.date; this.build(); }
    if (isNew) this.count('newItems');
    if (recipeNew) this.count('newRecipes');
    const base = info.base ? info.base.id : info.id;
    if (info.id === this.list[0].target || base === this.list[0].target) this.complete('craft');
    if (info.mods && info.mods.includes(this.list[1].mod)) this.complete('mod');
  },
  count(stat, n = 1) {
    const s = this.state();
    s.counts[stat] = (s.counts[stat] || 0) + n;
    const g = this.list[2];
    if (g && g.stat === stat && s.counts[stat] >= g.n) this.complete('goal');
    this.updateHud();
  },
  complete(id) {
    const s = this.state();
    if (s.done.includes(id)) return;
    s.done.push(id);
    const c = this.list.find(x => x.id === id);
    UI.toast(c.icon, 'Daily challenge complete!', c.title, 'ach');
    Sound.achievement();
    if (s.done.length === 3) {
      const y = new Date(Date.now() - 86400000);
      const yest = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
      s.streak = s.lastFull === yest ? s.streak + 1 : 1;
      s.lastFull = s.date;
      Shop.add(30); setTimeout(() => { UI.toast('🔥', `All dailies done! Streak: ${s.streak} day${s.streak > 1 ? 's' : ''}`, 'New challenges tomorrow. +30 🪙', 'ach'); UI.flash(0.35); }, 900);
      if (G.camera) Particles.emit({ pos: _v1.copy(G.camera.position).addScaledVector(Player.dir, 1.5), color: [0xffe85a, 0xff5ad8, 0x5ab8ff], count: 120, speed: 3, size: 0.06, life: 1.2, gravity: -2 });
    }
    Save.markDirty();
    this.updateHud();
  },
  updateHud() {
    const s = this.state(), el2 = $('hud-daily');
    if (el2) el2.textContent = `📅 Daily ${s.done.length}/3${s.streak ? ` · 🔥${s.streak}` : ''}`;
    if (G.ui === 'codex' && Codex.tab === 'daily') this.render();
  },
  render() {
    const s = this.state();
    const left = new Date(); left.setHours(24, 0, 0, 0);
    const hrs = Math.max(0, Math.round((left - Date.now()) / 3600000));
    $('cx-daily').innerHTML = `<div class="daily-head"><b>Daily challenges · ${s.date}</b><small>Streak 🔥 ${s.streak || 0} · new challenges in ~${hrs}h</small></div>` +
      this.list.map(c => {
        const p = this.progress(c), done = s.done.includes(c.id);
        const extra = c.id === 'goal' ? ` (${Math.min(c.n, s.counts[c.stat] || 0)}/${c.n})` : '';
        return `<div class="ach ${done ? 'done' : ''}"><div class="ai">${done ? '✅' : c.icon}</div><div style="flex:1"><b>${escHtml(c.title)}${extra}</b><small>${escHtml(c.desc)}</small>
          <div class="meter"><i style="width:${Math.round(p * 100)}%"></i></div></div></div>`;
      }).join('');
  },
};
