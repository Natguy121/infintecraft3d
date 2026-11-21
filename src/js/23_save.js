// ============================================================================
//  ELEMENTAL LAB — 23 · Persistence: autosave to localStorage, plus a
//  portable export/import code (deflate-compressed when the browser supports it)
// ============================================================================

const Save = {
  KEY: 'elementalLab.save.v1', dirty: false, timer: 0, warned: false,
  markDirty() { this.dirty = true; },

  data() {
    const rec = {};
    for (const [k, s] of Progress.recipes) rec[k] = [...s];
    return {
      v: 1, seed: GLOBAL_SEED, order: Progress.order, rec, stats: Progress.stats, ach: [...Progress.ach], wall: Progress.wallHue,
      shelf: G.trophies.map(t => t ? t.id : null),
      llm: { pairs: Object.fromEntries(Universe.llmPairs), items: Object.fromEntries(Universe.llmItems) },
      t: Date.now(),
    };
  },
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data())); this.dirty = false; }
    catch (e) { this.dirty = false; if (!this.warned) { this.warned = true; UI.toast('⚠️', 'Could not save', 'Browser storage is full or disabled — use Save code in the menu.'); } }
  },
  update(dt) {
    this.timer += dt;
    Progress.stats.playtime = (Progress.stats.playtime || 0) + dt;
    if (this.dirty && this.timer > 3) { this.timer = 0; this.save(); }
  },
  wipe() { try { localStorage.removeItem(this.KEY); } catch (e) { /* ignore */ } },

  /** Load progress (call after Universe.build, before Displays/Trophies). */
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.KEY) || 'null'); } catch (e) { d = null; }
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
    const bytes = new TextEncoder().encode(json);
    if (typeof CompressionStream !== 'undefined') {
      try {
        const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
        const buf = new Uint8Array(await new Response(cs).arrayBuffer());
        return 'ELAB1:' + toB64(buf);
      } catch (e) { /* fall through */ }
    }
    return 'ELAB0:' + toB64(bytes);
  },
  async importCode(code) {
    if (!code) throw new Error('Paste a save code first.');
    const [tag, body] = [code.slice(0, 6), code.slice(6).replace(/\s+/g, '')];
    let bytes;
    try { bytes = fromB64(body); } catch (e) { throw new Error('That code is not valid base64.'); }
    let json;
    if (tag === 'ELAB1:') {
      if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot read compressed codes.');
      const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      json = await new Response(ds).text();
    } else if (tag === 'ELAB0:') json = new TextDecoder().decode(bytes);
    else throw new Error('Unknown save format — codes start with ELAB.');
    let d;
    try { d = JSON.parse(json); } catch (e) { throw new Error('The save data is corrupted.'); }
    if (!d || !Array.isArray(d.order)) throw new Error('The save data is missing discoveries.');
    localStorage.setItem(this.KEY, JSON.stringify(d));
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
