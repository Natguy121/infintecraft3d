// ============================================================================
//  ELEMENTAL LAB — 23 · Persistence: autosave to localStorage, plus a
//  portable export/import code (deflate-compressed when the browser supports it)
// ============================================================================

/** extension data for newer features (pets, base, collections, speedruns…) */
const Ext = {
  parts: {}, pending: {},
  register(key, dump) { this.parts[key] = dump; },
  dump() { const o = {}; for (const [k, f] of Object.entries(this.parts)) { try { o[k] = f(); } catch (e) { /* ignore */ } } return o; },
  take(key) { const v = this.pending[key]; delete this.pending[key]; return v; },
};

/** One-time cleanup after recipe fixes: drop recipes that now give something else, and the items
 *  that were only ever obtained through them (repeating the mix now gives the correct result). */
const PURGE_V = 6;
const Purge = {
  valid(res, key) {
    try {
      const parts = key.includes('+') ? key.split('+') : key.split('|');
      if (parts.some(p => !Universe.isValidId(p))) return false;
      const r = parts.length === 2 ? Universe.combine(parts[0], parts[1]) : Universe.fuseMany(parts);
      return !!r && (Universe.canon(r.id) === res || r.id === res || r.how === 'llm');
    } catch (e) { return false; }
  },
  run() {
    const base = new Set(['air', 'fire', 'earth', 'water']);
    let badRecipes = 0;
    // v6: Water + Earth is Plant now, and everything made with Mud is wiped once
    if ((Ext.pending.purge || 0) < 6) for (const [res, keys] of [...Progress.recipes]) {
      if (res === 'mud') { Progress.recipes.delete(res); continue; }
      for (const k of [...keys]) if ((k.includes('+') ? k.split('+') : k.split('|')).some(i => Universe.canon ? Universe.canon(i) === 'mud' || i === 'mud' : i === 'mud')) { keys.delete(k); badRecipes++; }
      if (!keys.size) Progress.recipes.delete(res);
    }
    for (const [res, keys] of Progress.recipes) {
      for (const k of [...keys]) if (!this.valid(res, k)) { keys.delete(k); badRecipes++; }
      if (!keys.size) Progress.recipes.delete(res);
    }
    // keep only items that are still reachable through the player's own valid recipes
    const keep = new Set(base);
    const ingredients = (k) => k.includes('+') ? k.split('+') : k.split('|');
    let grew = true;
    while (grew) {
      grew = false;
      for (const [res, keys] of Progress.recipes) {
        if (keep.has(res)) continue;
        for (const k of keys) if (ingredients(k).every(i => keep.has(i))) { keep.add(res); grew = true; break; }
      }
    }
    const hadRecipe = new Set(); for (const [res] of Progress.recipes) hadRecipe.add(res);
    const before = Progress.order.length;
    const order = Progress.order.filter(id => keep.has(id) || base.has(id));
    Progress.disc.clear(); Progress.order.length = 0;
    for (const id of order) { Progress.disc.set(id, Progress.order.length); Progress.order.push(id); }
    for (const [res, keys] of Progress.recipes) for (const k of [...keys]) if (!ingredients(k).every(i => Progress.disc.has(i)) || !Progress.disc.has(res)) keys.delete(k);
    let n = 0; for (const s of Progress.recipes.values()) n += s.size; Progress.stats.recipes = n;
    const removed = before - Progress.order.length;
    return { removed, badRecipes };
  },
};

const Save = {
  get KEY() { return Accounts.key(Accounts.current()); }, dirty: false, timer: 0, warned: false,
  markDirty() { this.dirty = true; },

  data() {
    const rec = {};
    for (const [k, s] of Progress.recipes) rec[k] = [...s];
    return {
      v: 1, seed: GLOBAL_SEED, order: Progress.order, rec, stats: Progress.stats, ach: [...Progress.ach], wall: Progress.wallHue, daily: Progress.daily,
      shelf: G.trophies.map(t => t ? t.id : null), x: Ext.dump(),
      llm: { pairs: Object.fromEntries(Universe.llmPairs), items: Object.fromEntries(Universe.llmItems) },
      t: Date.now(),
    };
  },
  save() {
    if (this.saving || this.locked) return;
    this.dirty = false;
    const json = JSON.stringify(this.data());
    // big collections are stored deflate-compressed so they fit in localStorage
    if (json.length > 1500000 && typeof CompressionStream !== 'undefined') {
      this.saving = true;
      this.compress(json).then((code) => this.write(code)).finally(() => { this.saving = false; });
      return;
    }
    this.write(json);
  },
  write(str) {
    try { localStorage.setItem(this.KEY, str); Accounts.touch(Progress.order.length); Cloud.schedule(str); }
    catch (e) { if (!this.warned) { this.warned = true; UI.toast('⚠️', 'Could not save', 'Browser storage is full or disabled — use Save code in the menu.'); } }
  },
  async compress(json) {
    const cs = new Blob([new TextEncoder().encode(json)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return 'ELAB1:' + toB64(new Uint8Array(await new Response(cs).arrayBuffer()));
  },
  async decode(code) {
    const tag = code.slice(0, 6), body = code.slice(6).replace(/\s+/g, '');
    const bytes = fromB64(body);
    if (tag === 'ELAB1:') {
      if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot read compressed codes.');
      return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    }
    if (tag === 'ELAB0:') return new TextDecoder().decode(bytes);
    throw new Error('Unknown save format — codes start with ELAB.');
  },
  update(dt) {
    this.timer += dt;
    Progress.stats.playtime = (Progress.stats.playtime || 0) + dt;
    if (this.dirty && this.timer > 3) { this.timer = 0; this.save(); }
  },
  wipe() { try { localStorage.removeItem(this.KEY); } catch (e) { /* ignore */ } },

  /** Load progress (call after Universe.build, before Displays/Trophies). */
  /** Bump RESET_EPOCH to wipe everyone's progress once (accounts & settings are kept). */
  RESET_EPOCH: 2,
  resetIfNewEpoch() {
    try {
      const k = 'elementalLab.resetEpoch';
      const cur = +(localStorage.getItem(k) || 1);
      if (cur >= this.RESET_EPOCH) return false;
      const had = Object.keys(localStorage).some(key => key.startsWith('elementalLab.save.v1'));
      for (const key of Object.keys(localStorage)) if (key.startsWith('elementalLab.save.v1')) localStorage.removeItem(key);
      try { const a = JSON.parse(localStorage.getItem('elementalLab.accounts.v1') || '{}'); for (const u of Object.values(a)) u.disc = 4; localStorage.setItem('elementalLab.accounts.v1', JSON.stringify(a)); } catch (e) { /* ignore */ }
      localStorage.setItem(k, String(this.RESET_EPOCH));
      this.wasReset = had;
      return had;
    } catch (e) { return false; }
  },

  async load() {
    this.resetIfNewEpoch();
    Cloud.init(); await Cloud.pull();
    let d = null;
    try {
      let raw = localStorage.getItem(this.KEY) || 'null';
      if (raw.startsWith('ELAB')) raw = await this.decode(raw);
      d = JSON.parse(raw);
    } catch (e) { d = null; }
    if (d) this.apply(d);
    for (const id of ['air', 'fire', 'earth', 'water']) if (!Progress.disc.has(id)) { Progress.disc.set(id, Progress.order.length); Progress.order.push(id); }
    if (d && (Ext.pending.purge || 0) < PURGE_V) { this.purged = Purge.run(); this.dirty = true; }
    Ext.register('purge', () => PURGE_V);
    if (!this.purged) this.dirty = false;
    return !!d;
  },
  apply(d) {
    if (d.llm) {
      for (const [id, item] of Object.entries(d.llm.items || {})) { Universe.llmItems.set(id, item); }
      for (const [k, id] of Object.entries(d.llm.pairs || {})) Universe.llmPairs.set(k, id);
    }
    Progress.disc.clear(); Progress.order.length = 0;
    for (const id of d.order || []) if (!Progress.disc.has(id) && Universe.isValidId(id)) { Progress.disc.set(id, Progress.order.length); Progress.order.push(id); }
    Progress.recipes.clear();
    let n = 0;
    for (const [k, arr] of Object.entries(d.rec || {})) { Progress.recipes.set(k, new Set(arr)); n += arr.length; }
    Progress.stats = d.stats || {};
    Progress.stats.recipes = n;
    Progress.ach = new Set(d.ach || []);
    Progress.wallHue = d.wall ?? null;
    Progress.daily = d.daily || null;
    this.pendingShelf = d.shelf || [];
    Ext.pending = d.x || {};
  },
  restoreWorld() {
    if (Progress.wallHue != null) Room.setWallHue(Progress.wallHue);
    (this.pendingShelf || []).forEach((id, slot) => { if (id && Universe.isValidId(id) && slot < Room.shelfSlots.length) Trophies.place(id, slot); });
    this.pendingShelf = null;
    this.dirty = false;
  },

  // ---------------------------------------------------------- export / import
  async exportCode() {
    const json = JSON.stringify(this.data());
    if (typeof CompressionStream !== 'undefined') { try { return await this.compress(json); } catch (e) { /* fall through */ } }
    return 'ELAB0:' + toB64(new TextEncoder().encode(json));
  },
  async importCode(code) {
    if (!code) throw new Error('Paste a save code first.');
    let json;
    try { json = await this.decode(code.trim()); } catch (e) { throw new Error(e.message.startsWith('Unknown') || e.message.startsWith('This browser') ? e.message : 'That code is damaged or incomplete.'); }
    let d;
    try { d = JSON.parse(json); } catch (e) { throw new Error('The save data is corrupted.'); }
    if (!d || !Array.isArray(d.order)) throw new Error('The save data is missing discoveries.');
    this.write(json.length > 1500000 ? code.trim() : json);
    return d;
  },
};

function toB64(u8) {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(b64) {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}
