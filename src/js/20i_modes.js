// ============================================================================
//  ELEMENTAL LAB — 20i · Speedrun, collections, first discoveries,
//  co-op challenges and the first-time tutorial
// ============================================================================

const fmtTime = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return `${m}:${r < 10 ? '0' : ''}${r.toFixed(1)}`; };

// ---------------------------------------------------------------- speedrun
const Speedrun = {
  active: false, target: null, t0: 0, made: new Set(), best: {},
  init() {
    this.best = Ext.take('runs') || {};
    Ext.register('runs', () => this.best);
    const btn = el('button'); btn.id = 'btn-run'; btn.textContent = '⏱️ Speedrun'; $('btn-mp').before(btn);
    btn.onclick = () => this.active ? this.stop(true) : this.start();
  },
  pick() {
    const pool = Universe.items.filter(it => !it.secret && !it.unreachable && it.depth >= 4 && it.depth <= 6);
    return pool[Math.floor(Math.random() * pool.length)];
  },
  start() {
    const t = this.pick(); if (!t) return;
    for (const e of [...G.entities]) if (!e.pet && !e.placed && !e.remote) e.destroy();
    this.active = true; this.target = t.id; this.t0 = G.rtime; this.made = new Set(['air', 'fire', 'earth', 'water']);
    $('btn-run').textContent = '⏹️ Stop speedrun';
    UI.start && UI.start();
    const b = this.best[t.id];
    UI.bigText(`⏱️ Make ${t.emoji} ${t.name}!`, '#ff9a3a');
    UI.toast('⏱️', `Speedrun: make ${t.name}`, `Start from the 4 elements. The Codex only spawns things you make during the run.${b ? ' Your best: ' + fmtTime(b) : ''}`);
    this.pill(true);
  },
  stop(manual) {
    this.active = false; $('btn-run').textContent = '⏱️ Speedrun'; this.pill(false);
    if (manual) UI.toast('⏹️', 'Speedrun stopped', '');
  },
  allowSpawn(id) {
    if (!this.active || this.made.has(id)) return true;
    UI.toast('⏱️', 'Not during a speedrun!', 'You can only spawn things you made in this run.');
    return false;
  },
  onCraft(info) {
    if (!this.active) return;
    this.made.add(info.id);
    if (info.id !== this.target && Universe.parse(info.id)?.base?.id !== this.target) return;
    const t = G.rtime - this.t0, prev = this.best[this.target];
    const rec = !prev || t < prev; if (rec) this.best[this.target] = +t.toFixed(2);
    UI.bigText(rec ? `🏆 NEW RECORD ${fmtTime(t)}` : `⏱️ ${fmtTime(t)}`, '#ffb020');
    UI.toast('🏁', `Made ${info.name} in ${fmtTime(t)}!`, rec ? (prev ? `Beat your old best of ${fmtTime(prev)}.` : 'First time — that\'s your record to beat.') : `Your best is ${fmtTime(prev)}.`);
    Fun.gain(rec ? 120 : 60, null);
    Stats.add('speedruns'); Save.markDirty();
    this.stop(false);
  },
  pill(on) {
    let p = $('hud-run');
    if (!p) { p = el('div'); p.id = 'hud-run'; p.className = 'pill'; $('hud-daily').after(p); }
    p.classList.toggle('hidden', !on);
  },
  update() {
    if (!this.active) return;
    const t = Universe.get(this.target);
    $('hud-run').textContent = `⏱️ ${fmtTime(G.rtime - this.t0)} → ${t.emoji} ${t.name}`;
  },
};

// ---------------------------------------------------------------- collections
const COLLECTIONS = [
  { id: 'animals', name: 'Animal Kingdom', icon: '🦁', tag: 'animal' },
  { id: 'plants', name: 'Green Thumb', icon: '🌿', tag: 'plant' },
  { id: 'food', name: 'Master Chef', icon: '🍕', tag: 'edible' },
  { id: 'myth', name: 'Mythology', icon: '🐉', tag: 'mythical' },
  { id: 'space', name: 'Space Explorer', icon: '🪐', tag: 'cosmic' },
  { id: 'sea', name: 'Deep Sea', icon: '🐙', tag: 'sea' },
  { id: 'build', name: 'Architect', icon: '🏰', tag: 'building' },
  { id: 'machines', name: 'Inventor', icon: '⚙️', tag: 'machine' },
  { id: 'vehicles', name: 'Garage', icon: '🚗', tag: 'vehicle' },
  { id: 'weather', name: 'Storm Chaser', icon: '⛈️', tag: 'weather' },
  { id: 'music', name: 'Band Leader', icon: '🎸', tag: 'music' },
  { id: 'people', name: 'People Person', icon: '🧑', tag: 'human' },
];
const Collections = {
  sets: null, got: {},
  init() {
    this.sets = COLLECTIONS.map(c => ({ ...c, items: Universe.items.filter(it => it.tags.includes(c.tag) && !it.secret).map(it => it.id) }));
    this.got = Ext.take('coll') || {};
    Ext.register('coll', () => this.got);
    const tabs = $('cx-tabs'); const b = el('button'); b.dataset.tab = 'coll'; b.textContent = 'Collections'; tabs.appendChild(b);
    b.addEventListener('click', () => Codex.setTab('coll'));
    const box = el('div'); box.id = 'cx-coll'; box.className = 'ach-grid hidden'; box.style.cssText = 'grid-template-columns:1fr;max-width:640px;margin:0 auto;width:100%';
    $('cx-daily').after(box);
  },
  count(set) { let n = 0; for (const id of set.items) if (Progress.disc.has(id)) n++; return n; },
  tiers(set) { const N = set.items.length; return [10, 25, Math.ceil(N / 2), N].filter((v, i, a) => v <= N && a.indexOf(v) === i); },
  onCraft(info, isNew) {
    if (!isNew || info.kind !== 'core') return;
    for (const s of this.sets) {
      if (!s.items.includes(info.id)) continue;
      const n = this.count(s), tiers = this.tiers(s), had = this.got[s.id] || 0;
      const reached = tiers.filter(t => n >= t).length;
      if (reached > had) {
        this.got[s.id] = reached;
        const t = tiers[reached - 1], all = t === s.items.length;
        UI.bigText(`${s.icon} ${s.name} ${all ? 'COMPLETE!' : t + '/' + s.items.length}`, all ? '#ffb020' : '#7a5cff');
        UI.toast(s.icon, `Collection badge: ${s.name}`, all ? 'You found every single one!' : `${n} of ${s.items.length} found. Next badge at ${tiers[reached] || s.items.length}.`);
        Fun.gain(all ? 500 : 40 * reached, null); Save.markDirty();
      }
    }
  },
  render() {
    const medal = ['', '🥉', '🥈', '🥇', '🏆'];
    $('cx-coll').innerHTML = `<div class="daily-head"><b>Collections</b><small>Earn badges by finding every item of a kind.</small></div>` + this.sets.map(s => {
      const n = this.count(s), N = s.items.length, g = this.got[s.id] || 0, next = this.tiers(s).find(t => t > n) || N;
      return `<div class="ach ${n >= N ? 'done' : ''}"><div class="ai">${s.icon}</div><div style="flex:1"><b>${escHtml(s.name)} ${medal[g] || ''}</b><small>${n} / ${N} found${n < N ? ` · next badge at ${next}` : ' · complete!'}</small>
        <div class="meter"><i style="width:${Math.round(n / N * 100)}%"></i></div></div></div>`;
    }).join('');
  },
};

// ---------------------------------------------------------------- firsts: when you found it + first in the room
const Firsts = {
  when: {}, room: new Map(),
  init() { this.when = Ext.take('when') || {}; Ext.register('when', () => this.when); },
  onCraft(info, isNew) {
    if (!isNew) return;
    this.when[info.id] = Math.floor(Date.now() / 1000);
    if (Net.on && !this.room.has(info.id)) {
      this.room.set(info.id, 'you');
      UI.toast('🥇', `First in the room: ${info.name}!`, 'Nobody else here has made this yet. +25 XP');
      Fun.gain(25, null);
    }
  },
  onRemote(id, name) { if (!this.room.has(id)) this.room.set(id, name); },
  label(id) {
    const t = this.when[id]; const r = this.room.get(id);
    return (t ? `First made ${new Date(t * 1000).toLocaleDateString()}` : '') + (r ? ` · 🥇 first in room: ${r === 'you' ? 'you!' : escHtml(r)}` : '');
  },
};

// ---------------------------------------------------------------- co-op room challenges
const Coop = {
  goals: [], counts: {}, done: new Set(),
  TEMPL: [
    { k: 'craft', n: 15, t: 'Team: craft 15 things', icon: '⚗️' },
    { k: 'disc', n: 6, t: 'Team: make 6 new discoveries', icon: '✨' },
    { k: 'cross', n: 3, t: 'Fuse your item with a friend\'s 3 times', icon: '🤝' },
    { k: 'animal', n: 4, t: 'Team: create 4 animals', icon: '🐾' },
    { k: 'big', n: 2, t: 'Team: build 2 big things for the yard', icon: '🏗️' },
    { k: 'boom', n: 3, t: 'Team: set off 3 explosions', icon: '💣' },
  ],
  setup(code) {
    const rng = makeRng(hashStr('coop' + code));
    const pool = [...this.TEMPL]; this.goals = [];
    for (let i = 0; i < 3; i++) this.goals.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    this.counts = {}; this.done = new Set();
    this.render();
  },
  bump(k, local = true) {
    if (!Net.on || !this.goals.some(g => g.k === k)) return;
    this.counts[k] = (this.counts[k] || 0) + 1;
    if (local) Net.send({ t: 'coop', k });
    for (const g of this.goals) if (g.k === k && !this.done.has(k) && this.counts[k] >= g.n) {
      this.done.add(k); UI.bigText(`🤝 TEAM GOAL: ${g.t.replace('Team: ', '')}`, '#2fbf63'); UI.toast(g.icon, 'Team goal complete!', `${g.t} · +80 XP for everyone`); Fun.gain(80, null);
    }
    this.render();
  },
  onCraft(info, isNew, big) {
    this.bump('craft'); if (isNew) this.bump('disc');
    if (info.tags.includes('animal')) this.bump('animal'); if (big) this.bump('big');
  },
  render() {
    let box = $('mp-coop');
    if (!box) { box = el('div'); box.id = 'mp-coop'; $('mp-players').after(box); }
    box.innerHTML = Net.peer && this.goals.length ? '<h3>Team goals</h3>' + this.goals.map(g => `<div class="acct-p">${this.done.has(g.k) ? '✅' : g.icon}<span class="nm">${escHtml(g.t)}</span><span class="ct">${Math.min(g.n, this.counts[g.k] || 0)}/${g.n}</span></div>`).join('') : '';
  },
};

// ---------------------------------------------------------------- tutorial
const Tutorial = {
  step: -1, box: null,
  STEPS: [
    { t: 'Grab an element', d: () => IS_TOUCH ? 'Look at a glowing element on a pedestal and tap ✋ Grab.' : 'Look at a glowing element on a pedestal and hold the left mouse button.', ok: () => !!Player.held },
    { t: 'Smash two things together', d: () => IS_TOUCH ? 'Hold it against another element, or swipe and tap 🎯 Throw at it.' : 'Hold it against another element for a moment, or throw it at one with right click.', ok: () => (Progress.stats.merges || 0) > 0 },
    { t: 'Make Steam', d: () => 'Combine 💧 Water + 🔥 Fire.', ok: () => Progress.disc.has('steam') },
    { t: 'Open the Codex', d: () => IS_TOUCH ? 'Tap 📖 to see everything you\'ve found and spawn more.' : 'Press Tab to see everything you\'ve found and spawn more.', ok: () => G.ui === 'codex' },
    { t: 'Ask for a hint', d: () => IS_TOUCH ? 'Stuck? Tap 💡 for a hint.' : 'Stuck? Press H for a hint.', ok: () => (Hints.used || 0) > 0 },
  ],
  init() {
    if (Settings.tutDone || Progress.order.length > 12) return;
    const b = this.box = el('div'); b.id = 'tut'; b.className = 'hidden';
    b.innerHTML = '<div class="tut-k" id="tut-k"></div><b id="tut-t"></b><div id="tut-d"></div><button id="tut-skip">Skip tutorial</button>';
    document.body.appendChild(b);
    $('tut-skip').onclick = () => this.finish(true);
    this.step = 0;
  },
  update() {
    if (this.step < 0 || !this.box) return;
    const show = G.started && (!G.ui || G.ui === 'codex');
    this.box.classList.toggle('hidden', !show);
    if (!show && G.ui !== 'codex') return;
    const S = this.STEPS[this.step];
    if (S.ok()) {
      Sound.tone(880, 0.12, { vol: 0.12, glide: 1320 });
      this.step++;
      if (this.step >= this.STEPS.length) { this.finish(false); return; }
    }
    const C = this.STEPS[this.step];
    $('tut-k').textContent = `Tutorial ${this.step + 1}/${this.STEPS.length}`; $('tut-t').textContent = C.t; $('tut-d').textContent = C.d();
  },
  finish(skipped) {
    this.step = -1; if (this.box) this.box.remove(); Settings.tutDone = true; saveSettings();
    if (!skipped) { UI.bigText('🎓 You\'re ready!', '#2fbf63'); UI.toast('🎓', 'Tutorial complete! +50 XP', 'Try making Life, walk out the east door to the 🏝️ Island, adopt a pet with G, and pin builds with B.'); Fun.gain(50, null); }
  },
};
