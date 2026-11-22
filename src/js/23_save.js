// ============================================================================
//  ELEMENTAL LAB — 23 · Persistence: autosave to localStorage, plus a
//  portable export/import code (deflate-compressed when the browser supports it)
// ============================================================================

const Save = {
  get KEY() { return Accounts.key(Accounts.current()); }, dirty: false, timer: 0, warned: false,
  markDirty() { this.dirty = true; },

  data() {
    const rec = {};
    for (const [k, s] of Progress.recipes) rec[k] = [...s];
    return {
      v: 1, seed: GLOBAL_SEED, order: Progress.order, rec, stats: Progress.stats, ach: [...Progress.ach], wall: Progress.wallHue, daily: Progress.daily,
      shelf: G.trophies.map(t => t ? t.id : null),
      llm: { pairs: Object.fromEntries(Universe.llmPairs), items: Object.fromEntries(Universe.llmItems) },
      t: Date.now(),
    };
  },
  save() {
    if (this.saving) return;
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
    try { localStorage.setItem(this.KEY, str); Accounts.touch(Progress.order.length); }
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
    let d = null;
    try {
      let raw = localStorage.getItem(this.KEY) || 'null';
      if (raw.startsWith('ELAB')) raw = await this.decode(raw);
      d = JSON.parse(raw);
    } catch (e) { d = null; }
    if (d) this.apply(d);
    for (const id of ['air', 'fire', 'earth', 'water']) if (!Progress.disc.has(id)) { Progress.disc.set(id, Progress.order.length); Progress.order.push(id); }
    this.dirty = false;
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
