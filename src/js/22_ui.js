// ============================================================================
//  ELEMENTAL LAB — 22 · UI: menu, pointer lock, HUD, crosshair & tooltip,
//  banners, toasts, floating labels, hints, the virtualised Codex and the
//  Recipe Book
// ============================================================================

const TAG_PHRASE = { hot: 'hot', cold: 'cold', wet: 'wet', dry: 'dry', fire: 'fiery', water: 'watery', earth: 'earthy', air: 'airy', gas: 'gassy', liquid: 'liquid',
  energy: 'full of energy', living: 'alive', plant: 'leafy', animal: 'animal', human: 'human', flying: 'that flies', metal: 'metallic', stone: 'stony', wood: 'wooden',
  glass: 'glassy', crystal: 'crystalline', ice: 'icy', cloth: 'made of cloth', paper: 'papery', plastic: 'plastic', sharp: 'sharp', soft: 'soft', hard: 'hard', sticky: 'sticky',
  sweet: 'sweet', poison: 'poisonous', explosive: 'explosive', fast: 'fast', tiny: 'tiny', huge: 'huge', sky: 'from the sky', underground: 'from underground', sea: 'from the sea',
  cosmic: 'cosmic', weather: 'about the weather', tool: 'handy', machine: 'mechanical', weapon: 'dangerous', vehicle: 'that carries you', building: 'you can live in',
  edible: 'tasty', medicine: 'healing', music: 'musical', sport: 'sporty', money: 'valuable', digital: 'digital', electric: 'electric', light: 'bright', dark: 'dark',
  magic: 'magical', mythical: 'legendary', holy: 'holy', evil: 'evil', time: 'about time', abstract: 'abstract', emotion: 'emotional', knowledge: 'clever', death: 'deadly',
  ancient: 'ancient', sound: 'noisy' };

const UI = {
  tooltipKey: '', hintKey: '', fpsT: 0, fpsN: 0, banners: null, labels: [], hintCooldown: 0, lastHint: null, chargeEl: null,
  init() {
    this.banners = $('banner');
    this.chargeEl = document.querySelector('#crosshair .prog');
    $('btn-play').onclick = () => { Sound.init(); Sound.ui(); this.start(); };
    $('btn-codex').onclick = () => { Sound.init(); this.hideMenu(); Codex.open(); };
    $('btn-settings').onclick = () => { $('settings').classList.toggle('hidden'); $('savebox').classList.add('hidden'); $('help').classList.add('hidden'); };
    $('btn-share').onclick = () => Share.progress();
    $('btn-help').onclick = () => { $('help').classList.toggle('hidden'); $('settings').classList.add('hidden'); $('savebox').classList.add('hidden'); };
    $('btn-save').onclick = async () => {
      $('savebox').classList.toggle('hidden'); $('settings').classList.add('hidden'); $('help').classList.add('hidden');
      if (!$('savebox').classList.contains('hidden')) { $('save-out').value = 'Generating…'; $('save-out').value = await Save.exportCode(); }
    };
    $('btn-copy').onclick = () => { navigator.clipboard?.writeText($('save-out').value).then(() => this.status('Save code copied to the clipboard.')).catch(() => { $('save-out').select(); document.execCommand('copy'); }); };
    $('btn-dl').onclick = () => { const a = el('a'); a.href = URL.createObjectURL(new Blob([$('save-out').value], { type: 'text/plain' })); a.download = 'elemental-lab-save.txt'; a.click(); };
    $('btn-import').onclick = async () => {
      try { await Save.importCode($('save-in').value.trim()); $('import-msg').textContent = 'Imported! Reloading…'; setTimeout(() => location.reload(), 600); }
      catch (e) { $('import-msg').textContent = '❌ ' + e.message; }
    };
    $('btn-reset').onclick = () => { if (confirm('Reset ALL progress? Discoveries, recipes, trophies and achievements will be erased.')) { Save.wipe(); location.reload(); } };
    $('btn-walls').onclick = () => { Progress.wallHue = null; Room.setWallHue(null); Save.markDirty(); this.status('Walls reset to white.'); };
    const bind = (id, key, fn, prop = 'value') => {
      const n = $(id);
      n[prop] = Settings[key];
      n.addEventListener(prop === 'checked' ? 'change' : 'input', () => { Settings[key] = prop === 'checked' ? n.checked : (n.type === 'range' ? parseFloat(n.value) : n.value); saveSettings(); fn && fn(); });
    };
    bind('set-theme', 'theme', () => Themes.apply(Settings.theme));
    bind('set-quality', 'quality', () => this.status('Quality saved — reload the page to fully apply reflections and shadows.'));
    bind('set-sens', 'sens'); bind('set-vol', 'vol', () => Sound.applyVolumes()); bind('set-music', 'music', () => Sound.applyVolumes());
    bind('set-invert', 'invert', null, 'checked'); bind('set-bob', 'bob', null, 'checked'); bind('set-dof', 'dof', null, 'checked');
    bind('set-fps', 'fps', () => $('fps-pill').classList.toggle('hidden', !Settings.fps), 'checked');
    bind('set-ai', 'ai', () => this.status(Settings.ai ? (Settings.key ? 'Creative AI on.' : 'Add your API key to enable the creative AI.') : 'Creative AI off — using the procedural generator.'), 'checked');
    bind('set-key', 'key'); bind('set-model', 'model');
    $('fps-pill').classList.toggle('hidden', !Settings.fps);
    document.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { if (b.dataset.close === 'codex') Codex.close(); else Book.close(); });
    document.addEventListener('pointerlockchange', () => this.onLockChange());
    document.addEventListener('pointerlockerror', () => { G.locked = false; if (!G.ui) this.showMenu(true); this.status('Click "Resume" to capture the mouse again.'); });
    this.updateHud();
  },

  status(msg) { $('menu-status').textContent = msg; },

  start() {
    G.started = true;
    this.hideMenu();
    $('crosshair').classList.remove('hidden'); $('hud-tl').classList.remove('hidden'); $('hud-tr').classList.remove('hidden'); $('hint-bar').classList.remove('hidden');
    this.requestLock();
    if (!Progress.stats.welcomed) { Progress.stats.welcomed = 1; setTimeout(() => this.toast('👋', 'Welcome to the lab!', 'Grab an element from a pedestal and smash it into another.'), 900); }
  },
  requestLock() {
    if (G.debugNoLock || IS_TOUCH) { G.locked = true; this.hideMenu(); if (G.ui === 'menu') G.ui = null; return; }
    const c = G.canvas;
    try { const p = c.requestPointerLock({ unadjustedMovement: false }); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignored */ }
  },
  onLockChange() {
    G.locked = document.pointerLockElement === G.canvas;
    if (G.locked) { this.hideMenu(); G.ui = null; }
    else if (G.started && !G.ui) { if (Player.held) Player.drop(); this.showMenu(true); }
  },
  showMenu(paused) {
    G.ui = 'menu';
    $('menu').classList.remove('hidden');
    $('btn-play').textContent = paused ? 'Resume' : 'Enter the Lab';
    this.status(`Progress saves automatically · ${fmtInt(Progress.order.length)} discoveries · ${fmtInt(Progress.recipeCount())} recipes`);
  },
  hideMenu() { $('menu').classList.add('hidden'); if (G.ui === 'menu') G.ui = null; },

  onKey(e) {
    if (!G.started && e.code !== 'Escape') return;
    switch (e.code) {
      case 'Tab': e.preventDefault(); if (G.ui === 'codex') Codex.close(); else if (!G.ui || G.ui === 'book') { Book.close('switch'); Codex.open(); } break;
      case 'KeyC': if (document.activeElement === $('cx-search')) break; if (G.ui === 'book') Book.close(); else if (!G.ui || G.ui === 'codex') { const id = Codex.selected && G.ui === 'codex' ? Codex.selected : this.currentItemId(); if (G.ui === 'codex') Codex.close('switch'); Book.open(id); } break;
      case 'KeyH': if (!G.ui) Hints.show(); break;
      case 'KeyM': if (!G.ui || G.ui === 'menu') { const m = Sound.toggleMute(); this.toast(m ? '🔇' : '🔊', m ? 'Muted' : 'Sound on', ''); } break;
      case 'Escape': if (G.ui === 'codex') Codex.close('esc'); else if (G.ui === 'book') Book.close('esc'); break;
    }
  },
  currentItemId() {
    if (Player.held) return Player.held.id;
    const t = G.lookTarget;
    if (t) return t.obj.id;
    return G.selected || 'fire';
  },

  // ---------------------------------------------------------- per-frame HUD
  update(dt) {
    this.fpsT += dt; this.fpsN++;
    if (this.fpsT > 0.5) { $('fps').textContent = Math.round(this.fpsN / this.fpsT); this.fpsT = 0; this.fpsN = 0; }
    if (this.hintCooldown > 0) { this.hintCooldown -= dt; $('hint-cd').textContent = this.hintCooldown > 0 ? `${Math.ceil(this.hintCooldown)}s` : ''; }
    const t = G.lookTarget, held = Player.held;
    const ch = $('crosshair');
    ch.classList.toggle('target', !!t && !held);
    ch.classList.toggle('holding', !!held);
    // tooltip
    let info = null, action = '';
    if (held && t && (t.kind === 'entity' || t.kind === 'display')) { info = t.obj.info; action = '<kbd>Hold E</kbd> fuse with held item'; }
    else if (!held && t) {
      info = t.obj.info;
      action = t.kind === 'display' ? '<kbd>LMB</kbd> take a copy' : t.kind === 'trophy' ? '<kbd>LMB</kbd> take off the shelf' : (t.obj.inRing ? '<kbd>Hold LMB</kbd> grab · <kbd>Alt+click</kbd> split' : '<kbd>Hold LMB</kbd> grab · <kbd>F</kbd> shelf');
    } else if (held) { info = held.info; action = '<kbd>RMB</kbd> throw · <kbd>Wheel</kbd> distance · <kbd>R</kbd> rotate'; }
    const key = info ? info.id + '|' + action : '';
    if (key !== this.tooltipKey) {
      this.tooltipKey = key;
      const tt = $('tooltip');
      if (!info || G.ui) tt.classList.add('hidden');
      else {
        tt.classList.remove('hidden');
        tt.className = 'b' + info.rarity;
        tt.innerHTML = `<div class="tt-name"><span class="tt-emo">${itemLabel(info)}</span>${escHtml(info.name)}</div>
          <div class="tt-meta"><span class="rar r${info.rarity}">${rarityName(info.rarity)}</span> · Tier ${info.tier}${Progress.has(info.id) ? '' : ' · <b>undiscovered</b>'}</div>
          <div class="tt-tags">${fmtTags(info.tags, 6).map(x => `<span class="tag">${x}</span>`).join('')}</div>
          <div class="tt-act">${action}</div>`;
      }
    }
    if (G.ui && !$('tooltip').classList.contains('hidden')) { $('tooltip').classList.add('hidden'); this.tooltipKey = ''; }
    // context hint bar
    const hb = held ? 'hold' : t ? t.kind : 'none';
    if (hb !== this.hintKey) {
      this.hintKey = hb;
      const H = {
        none: '<span><kbd>WASD</kbd> move</span><span><kbd>Shift</kbd> sprint</span><span><kbd>Space</kbd> jump</span><span><kbd>Tab</kbd> Codex</span><span><kbd>H</kbd> hint</span>',
        display: '<span><kbd>LMB</kbd> take an element</span><span>Pedestals never run out</span>',
        entity: '<span><kbd>Hold LMB</kbd> grab</span><span><kbd>F</kbd> put on shelf</span><span><kbd>C</kbd> recipes</span>',
        trophy: '<span><kbd>LMB</kbd> take the trophy back</span>',
        hold: '<span><kbd>RMB</kbd> throw</span><span><kbd>Wheel</kbd> push/pull</span><span><kbd>Hold R</kbd> rotate</span><span><kbd>Hold E</kbd> fuse</span><span>Touch items to fuse</span>',
      };
      $('hint-bar').innerHTML = H[hb];
    }
    // floating labels
    for (let i = this.labels.length - 1; i >= 0; i--) {
      const L = this.labels[i];
      L.t += dt;
      const p = (L.ent && !L.ent.dead) ? L.ent.root.position : L.pos;
      L.pos.copy(p);
      _v1.copy(p); _v1.y += 0.32 + L.t * 0.22;
      _v1.project(G.camera);
      const on = _v1.z < 1 && Math.abs(_v1.x) < 1.2 && Math.abs(_v1.y) < 1.2;
      const x = (_v1.x * 0.5 + 0.5) * innerWidth, y = (-_v1.y * 0.5 + 0.5) * innerHeight;
      const a = L.t < 0.15 ? L.t / 0.15 : L.t > 1.6 ? Math.max(0, 1 - (L.t - 1.6) / 0.4) : 1;
      const s = L.t < 0.25 ? ease.outBack(L.t / 0.25, 2.5) : 1;
      L.el.style.opacity = on ? a : 0;
      L.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
      if (L.t > 2) { L.el.remove(); this.labels.splice(i, 1); }
    }
  },
  setCharge(p) { if (this.chargeEl) this.chargeEl.style.strokeDashoffset = String(113 * (1 - clamp(p, 0, 1))); },
  updateHud() {
    $('disc-count').textContent = fmtInt(Progress.order.length);
    $('hud-recipes').textContent = `📜 ${fmtInt(Progress.recipeCount())} recipes found`;
  },

  // ---------------------------------------------------------- notifications
  banner(kicker, info, small) {
    const b = el('div', `ban b${info.rarity}${small ? ' small' : ''}`);
    b.innerHTML = `<div class="kicker">${kicker}</div><div class="bname"><span class="bemo">${itemLabel(info)}</span>${escHtml(info.name)}</div>
      ${small ? '' : `<div class="bmeta"><span class="rar r${info.rarity}">${rarityName(info.rarity)}</span> · Tier ${info.tier} · #${fmtInt(Progress.order.length)} discovered</div>`}`;
    this.banners.innerHTML = '';
    this.banners.appendChild(b);
    clearTimeout(this.banTimer);
    this.banTimer = setTimeout(() => { b.classList.add('out'); setTimeout(() => b.remove(), 400); }, small ? 1500 : 2300);
  },
  toast(icon, title, desc, cls = '') {
    const t = el('div', 'toast ' + cls, `<div class="ti">${icon}</div><div><b>${escHtml(title)}</b><small>${escHtml(desc || '')}</small></div>`);
    $('toasts').appendChild(t);
    while ($('toasts').children.length > 4) $('toasts').firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, cls === 'ach' ? 4200 : 3200);
  },
  floatLabel(ent, info, isNew) {
    const L = { ent, pos: ent.root.position.clone(), t: 0, el: el('div', `flabel b${info.rarity}`, `<span class="fe">${itemLabel(info)}</span><span class="${info.rarity >= 5 ? 'r5' : ''}">${escHtml(info.name)}</span>`) };
    L.el.style.opacity = 0;
    $('labels').appendChild(L.el);
    this.labels.push(L);
    if (this.labels.length > 8) { this.labels[0].el.remove(); this.labels.shift(); }
  },
  bigText(text, color) {
    const b = el('div', 'bigtext', escHtml(text)); b.style.color = color;
    $('ui').appendChild(b); setTimeout(() => b.remove(), 1900);
  },
  xpPop(text, pos) {
    _v1.copy(pos).project(G.camera);
    if (_v1.z > 1) return;
    const e = el('div', 'xppop', escHtml(text));
    e.style.left = (_v1.x * 0.5 + 0.5) * innerWidth + 'px'; e.style.top = (-_v1.y * 0.5 + 0.5) * innerHeight + 'px';
    $('ui').appendChild(e); setTimeout(() => e.remove(), 1400);
  },
  flash(a = 1) {
    const f = $('flash');
    f.style.transition = 'none'; f.style.opacity = a;
    requestAnimationFrame(() => { f.style.transition = 'opacity 1.4s ease-out'; f.style.opacity = 0; });
  },
  closeAllForPanel() { if (Player.held) Player.drop(); if (document.pointerLockElement) document.exitPointerLock(); },
};

// ============================================================================
const Hints = {
  recent: [],
  show() {
    if (UI.hintCooldown > 0) { UI.toast('⏳', 'Hint recharging', `Next hint in ${Math.ceil(UI.hintCooldown)}s.`); return; }
    const disc = new Set(Progress.order);
    let text, again = false;
    const last = UI.lastHint;
    if (last && !Progress.has(last.target) && Date.now() - last.t < 90000 && !last.revealed) {
      const ia = Universe.get(last.a), ib = Universe.get(last.b);
      text = `Try combining <b>${ia.emoji} ${escHtml(ia.name)}</b> with something <b>${TAG_PHRASE[ib.primaryTag] || 'else'}</b>.`;
      last.revealed = true; again = true;
    } else {
      const h = Universe.hintFor(disc, new Set(this.recent));
      if (!h) { text = 'Try combining anything with <b>🧊 Ice</b>, <b>🥇 Gold</b> or <b>✨ Magic</b> — modifiers work on almost everything!'; }
      else {
        const [target, a, b] = h;
        const ia = Universe.get(a), ib = Universe.get(b);
        const pa = TAG_PHRASE[ia.primaryTag] || 'interesting', pb = TAG_PHRASE[ib.primaryTag] || 'else';
        text = pa === pb ? `Try combining two things that are <b>${pa}</b>.` : `Try combining something <b>${pa}</b> with something <b>${pb}</b>.`;
        UI.lastHint = { target: target.id, a, b, t: Date.now(), revealed: false };
        this.recent.push(target.id); if (this.recent.length > 6) this.recent.shift();
      }
    }
    const box = $('hintbox');
    box.innerHTML = `<span class="hk">${again ? 'BIGGER HINT' : 'HINT'}</span>${text}`;
    box.classList.remove('hidden');
    box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
    clearTimeout(this.timer); this.timer = setTimeout(() => box.classList.add('hidden'), 7000);
    UI.hintCooldown = again ? 30 : 20;
    Sound.hint();
    Stats.add('hints');
  },
};

// ============================================================================
//  Codex: virtualised grid that stays smooth at 300,000+ entries
// ============================================================================
const Codex = {
  meta: new Map(), list: [], selected: null, tab: 'items', pool: [], tileW: 118, tileH: 86, gap: 8, dirty: true, recipeCache: new Map(),
  init() {
    const sel = $('cx-tag');
    for (const t of [...TAGS].sort()) { const o = el('option'); o.value = t; o.textContent = t; sel.appendChild(o); }
    let deb;
    $('cx-search').addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(() => this.refresh(true), 110); });
    $('cx-sort').onchange = () => this.refresh(true);
    $('cx-tag').onchange = () => this.refresh(true);
    $('cx-wrap').addEventListener('scroll', () => this.render());
    window.addEventListener('resize', () => { if (G.ui === 'codex') this.render(); });
    document.querySelectorAll('#cx-tabs button').forEach(b => b.onclick = () => this.setTab(b.dataset.tab));
    $('cx-grid').addEventListener('click', (e) => {
      const tile = e.target.closest('.tile');
      if (!tile) return;
      this.select(tile.dataset.id);
      Spawner.spawn(tile.dataset.id);
    });
    const b = Universe.countBreakdown;
    $('cx-universe').textContent = `Universe: ${fmtInt(Universe.totalCount)} nameable items (${fmtInt(b.core)} core · ${fmtInt(b.oneMod + b.twoMods)} modified · ${fmtInt(b.composites)} composites)`;
  },
  metaOf(id) {
    let m = this.meta.get(id);
    if (!m) {
      const I = Universe.get(id);
      if (!I) return null;
      m = { id, name: I.name, lname: I.name.toLowerCase(), rarity: I.rarity, tier: I.tier, emo: itemLabel(I), tags: I.tags };
      this.meta.set(id, m);
    }
    return m;
  },
  onDiscover(id) { this.dirty = true; if (G.ui === 'codex') this.refresh(false); UI.updateHud(); },
  open() {
    UI.closeAllForPanel();
    G.ui = 'codex';
    $('codex').classList.remove('hidden');
    $('tooltip').classList.add('hidden');
    this.setTab(this.tab);
    if (!this.selected) this.selected = G.selected || Progress.order[Progress.order.length - 1];
    this.refresh(true);
    this.showDetail(this.selected);
    setTimeout(() => $('cx-search').focus(), 30);
    Sound.ui();
  },
  close(mode) {
    $('codex').classList.add('hidden');
    $('cx-search').blur();
    if (G.ui === 'codex') G.ui = null;
    Sound.ui();
    if (!G.started || mode === 'switch') return;
    if (mode === 'esc') UI.showMenu(true); else UI.requestLock();
  },
  setTab(t) {
    this.tab = t;
    document.querySelectorAll('#cx-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    $('cx-items').classList.toggle('hidden', t !== 'items');
    $('cx-ach').classList.toggle('hidden', t !== 'ach');
    $('cx-stats').classList.toggle('hidden', t !== 'stats');
    $('cx-daily').classList.toggle('hidden', t !== 'daily');
    if (t === 'daily') Daily.render();
    if (t === 'ach') this.renderAch();
    if (t === 'stats') this.renderStats();
    if (t === 'items') this.render();
  },
  refresh(resetScroll) {
    const q = $('cx-search').value.trim().toLowerCase();
    const tag = $('cx-tag').value, sort = $('cx-sort').value;
    let L = [];
    for (const id of Progress.order) {
      const m = this.metaOf(id);
      if (!m) continue;
      if (q && !m.lname.includes(q)) continue;
      if (tag && !m.tags.includes(tag)) continue;
      L.push(m);
    }
    if (sort === 'name') L.sort((a, b) => a.lname < b.lname ? -1 : a.lname > b.lname ? 1 : 0);
    else if (sort === 'rarity') L.sort((a, b) => b.rarity - a.rarity || b.tier - a.tier || (a.lname < b.lname ? -1 : 1));
    else if (sort === 'tier') L.sort((a, b) => b.tier - a.tier || b.rarity - a.rarity || (a.lname < b.lname ? -1 : 1));
    else L.reverse();
    this.list = L;
    $('cx-count').textContent = `${fmtInt(Progress.order.length)} / 300,000+ discovered${L.length !== Progress.order.length ? ` · ${fmtInt(L.length)} shown` : ''}`;
    $('cx-empty').classList.toggle('hidden', L.length > 0);
    if (resetScroll) $('cx-wrap').scrollTop = 0;
    this.render(true);
  },
  render(force) {
    if (G.ui !== 'codex' || this.tab !== 'items') return;
    const wrap = $('cx-wrap'), grid = $('cx-grid');
    const W = wrap.clientWidth - 28;
    const cw = this.tileW + this.gap, chh = this.tileH + this.gap;
    const cols = Math.max(1, Math.floor((W + this.gap) / cw));
    const tw = Math.floor((W - (cols - 1) * this.gap) / cols);
    const rows = Math.ceil(this.list.length / cols);
    $('cx-spacer').style.height = rows * chh + 'px';
    const first = Math.max(0, Math.floor(wrap.scrollTop / chh) - 2);
    const last = Math.min(rows, Math.ceil((wrap.scrollTop + wrap.clientHeight) / chh) + 2);
    let k = 0;
    for (let r = first; r < last; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (i >= this.list.length) break;
      const m = this.list[i];
      let tile = this.pool[k];
      if (!tile) { tile = el('div', 'tile'); grid.appendChild(tile); this.pool.push(tile); }
      tile.style.display = '';
      tile.style.width = tw + 'px';
      tile.style.transform = `translate(${c * (tw + this.gap)}px, ${r * chh}px)`;
      if (tile.dataset.id !== m.id || force) {
        tile.dataset.id = m.id;
        tile.className = `tile b${m.rarity}${m.id === this.selected ? ' sel' : ''}`;
        tile.innerHTML = `<div class="te">${m.emo}</div><div class="tn">${escHtml(m.name)}</div><div class="tt">T${m.tier}</div>`;
        tile.title = `${m.name} — ${rarityName(m.rarity)} · tier ${m.tier}`;
      }
      k++;
    }
    for (; k < this.pool.length; k++) this.pool[k].style.display = 'none';
  },
  select(id) {
    this.selected = id; G.selected = id;
    for (const t of this.pool) t.classList.toggle('sel', t.dataset.id === id);
    this.showDetail(id);
  },
  recipeInfo(id) {
    let all = this.recipeCache.get(id);
    if (!all) {
      all = [...Universe.recipesFor(id), ...Universe.multiRecipesFor(id)];
      this.recipeCache.set(id, all);
      if (this.recipeCache.size > 400) this.recipeCache.delete(this.recipeCache.keys().next().value);
    }
    const found = Progress.recipes.get(id) || new Set();
    const known = all.filter(k => found.has(k));
    const wild = [...found].filter(k => !all.includes(k));
    return { total: all.length + wild.length, known, wild, unknown: all.length - known.length };
  },
  recipeRow(key, wild) {
    const ids = key.includes('|') ? key.split('|') : key.split('+');
    const parts = ids.map(i => { const I = Universe.get(i); return I ? `<span class="ing">${itemLabel(I)} ${escHtml(I.name)}</span>` : '?'; });
    return `<div class="recipe">${parts.join('<span class="plus">+</span>')}${wild ? '<span class="wild">WILD</span>' : ''}</div>`;
  },
  recipeBlock(id, maxUnknown = 6) {
    const r = this.recipeInfo(id);
    if (!r.total) return `<div class="sec-h">Recipes</div><div class="recipe unk">One of the four primal elements — it can't be crafted.</div>`;
    const found = r.known.length + r.wild.length;
    let h = `<div class="sec-h">Known recipes: ${found} of ${r.total} found</div><div class="meter"><i style="width:${Math.round(found / r.total * 100)}%"></i></div>`;
    h += r.known.map(k => this.recipeRow(k)).join('') + r.wild.map(k => this.recipeRow(k, true)).join('');
    const unk = Math.min(r.unknown, maxUnknown);
    for (let i = 0; i < unk; i++) h += `<div class="recipe unk">??? <span class="plus">+</span> ???</div>`;
    if (r.unknown > unk) h += `<div class="recipe unk">…and ${fmtInt(r.unknown - unk)} more undiscovered</div>`;
    return h;
  },
  showDetail(id) {
    const box = $('cx-detail');
    const I = id && Universe.get(id);
    if (!I) { box.innerHTML = '<div class="det-meta">Select an item</div>'; return; }
    const kind = { core: 'Core item', mod: 'Modified item', comp: 'Composite', llm: 'AI-invented' }[I.kind];
    box.innerHTML = `<div class="det-emo">${itemLabel(I)}</div><div class="det-name ${I.rarity >= 5 ? 'r5' : ''}">${escHtml(I.name)}</div>
      <div class="det-meta"><span class="rar r${I.rarity}">${rarityName(I.rarity)}</span> · Tier ${I.tier} · ${kind}</div>
      <div class="det-meta">${I.material === I.state ? I.material : I.material + ' · ' + I.state} · discovered #${fmtInt((Progress.disc.get(id) ?? -1) + 1)}</div>
      <div class="det-tags">${I.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      <div class="det-btns"><button id="d-spawn">✨ Spawn</button><button id="d-book">📜 Recipe book</button><button id="d-shelf">🏺 Display on shelf</button><button id="d-hint">🔍 Use as hint</button><button id="d-share">📤 Share</button></div>
      ${this.recipeBlock(id, 5)}`;
    $('d-spawn').onclick = () => Spawner.spawn(id);
    $('d-share').onclick = () => Share.item(id);
    $('d-book').onclick = () => { Codex.close('switch'); Book.open(id); };
    $('d-shelf').onclick = () => { Trophies.place(id, null); Sound.shelf(); UI.toast(I.emoji, 'On display', `${I.name} was added to the Discovery Shelf.`); if (G.trophies.filter(Boolean).length >= 5) unlock('shelf'); };
    $('d-hint').onclick = () => { const r = this.recipeInfo(id); UI.toast('🔍', `${I.name}`, r.unknown ? `${r.unknown} recipe(s) still hidden. Its tags: ${I.tags.slice(0, 4).join(', ')}.` : 'You know every recipe for this item!'); };
  },
  renderAch() {
    $('cx-ach').innerHTML = ACHIEVEMENTS.map(a => `<div class="ach ${Progress.ach.has(a.id) ? '' : 'locked'}"><div class="ai">${a.icon}</div><div><b>${a.name}</b><small>${a.desc}</small></div></div>`).join('');
  },
  renderStats() {
    const s = Progress.stats, b = Universe.countBreakdown;
    const cells = [
      [fmtInt(Progress.order.length), 'items discovered'], [fmtInt(Progress.recipeCount()), 'recipes found'], [fmtInt(s.merges || 0), 'fusions performed'],
      [fmtInt(s.fusions || 0), 'Fusion Ring uses'], [fmtInt(s.thrown || 0), 'items thrown'], [fmtInt(s.trashed || 0), 'items trashed'],
      [fmtInt(s.splits || 0), 'items split'], [fmtInt(s.spawned || 0), 'Codex spawns'], [`${Math.round((s.playtime || 0) / 60)} min`, 'time in the lab'],
      [`${Progress.ach.size} / ${ACHIEVEMENTS.length}`, 'achievements'], [fmtInt(Universe.llmItems.size), 'AI-invented items'],
      [fmtInt(Universe.totalCount), 'items in this universe'], [fmtInt(b.core), 'hand-authored core items'], [fmtInt(MODIFIER_DEFS.length), 'modifiers'], [fmtInt(Universe.rules.length), 'tag rules'],
    ];
    $('cx-stats').innerHTML = cells.map(([v, l]) => `<div class="stat"><b>${v}</b><small>${l}</small></div>`).join('');
  },
};

const Spawner = {
  spawn(id) {
    if (!Progress.has(id)) return;
    const P = LAYOUT.pad;
    const r = buildVisual(Universe.get(id)).radius;
    // big things are delivered onto the floor beside the pad instead of on top of it
    const pos = r < 0.5 ? new THREE.Vector3(P.x + (Math.random() - 0.5) * 0.1, P.top + 0.45, P.z + (Math.random() - 0.5) * 0.1)
      : r < 0.9 ? new THREE.Vector3(P.x - 0.8 - r, r + 0.3, P.z + 1) : Fun.deliverBig(Universe.get(id), r);
    const e = spawnItem(id, pos, { popDur: 0.45, touched: false, vel: new THREE.Vector3(0, 0.5, 0) });
    if (!e) return;
    Particles.emit({ pos, color: [0x22c7e8, 0xffffff], count: 26, size: 0.06, speed: 1.4, life: 0.6 });
    Rings.spawn(new THREE.Vector3(P.x, P.top + 0.02, P.z), 0x22c7e8, 0.6, 0.5, true);
    Room.padGlow.mul = 3;
    Sound.spawn();
    Stats.add('spawned');
  },
};

// ============================================================================
const Book = {
  id: null,
  open(id) {
    if (!id || !Universe.get(id)) return;
    UI.closeAllForPanel();
    this.id = id; G.ui = 'book';
    $('codex').classList.add('hidden');
    $('book').classList.remove('hidden');
    const I = Universe.get(id);
    const usedIn = [];
    for (const [res, keys] of Progress.recipes) for (const k of keys) if (k.split(/[|+]/).includes(id)) usedIn.push([res, k]);
    $('book-body').innerHTML = `<div class="det-emo">${itemLabel(I)}</div><div class="det-name ${I.rarity >= 5 ? 'r5' : ''}">${escHtml(I.name)}</div>
      <div class="det-meta"><span class="rar r${I.rarity}">${rarityName(I.rarity)}</span> · Tier ${I.tier} · ${Progress.has(id) ? 'discovered' : 'not discovered yet'}</div>
      <div class="det-tags">${I.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      ${Codex.recipeBlock(id, 14)}
      <div class="sec-h">Used in (${usedIn.length})</div>
      ${usedIn.slice(0, 30).map(([res, k]) => { const R = Universe.get(res); return `<div class="recipe">${Codex.recipeRow(k).replace(/^<div class="recipe">|<\/div>$/g, '')}<span class="plus">=</span><span class="ing">${itemLabel(R)} ${escHtml(R.name)}</span></div>`; }).join('') || '<div class="recipe unk">Not used in any recipe you have found yet.</div>'}`;
    Sound.ui();
  },
  close(mode) {
    const wasOpen = G.ui === 'book';
    $('book').classList.add('hidden');
    if (G.ui === 'book') G.ui = null;
    if (!G.started || mode === 'switch' || !wasOpen) return;
    if (mode === 'esc') UI.showMenu(true); else UI.requestLock();
  },
};
