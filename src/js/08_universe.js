// ============================================================================
//  ELEMENTAL LAB — 08 · The Universe: parses the core items, builds the
//  recipe tables and resolves ANY pair of the 300,000+ items deterministically.
//
//  Item id formats
//    core       "dragon"
//    modified   "dragon~frozen~golden"     (≤2 modifiers, canonical order)
//    composite  "x:fire:whale"              (adjective : head, both core)
//    llm        "l:<slug>"                  (optional AI-invented items)
//
//  Resolution order for A + B   (A+B === B+A, always)
//    1. hand-authored + substitution pair table            (core × core)
//    2. inheritance: base pair in table, modifiers carried  (Golden Water+Fire → Golden Steam)
//    3. twins: X + X → Giant X
//    4. modifier source: Ice + Dragon → Frozen Dragon
//    5. tag rules (Layer B) → core item / modifier / composite (Layer D)
//    (LLM fallback, if enabled, replaces stage 5 — see 19_llm.js)
// ============================================================================

const TAGS = [
  'hot', 'cold', 'wet', 'dry', 'fire', 'water', 'earth', 'air',
  'gas', 'liquid', 'energy', 'living', 'plant', 'animal', 'human', 'flying',
  'metal', 'stone', 'wood', 'glass', 'crystal', 'ice', 'cloth', 'paper',
  'plastic', 'sharp', 'soft', 'hard', 'sticky', 'sweet', 'poison', 'explosive',
  'fast', 'tiny', 'huge', 'sky', 'underground', 'sea', 'cosmic', 'weather',
  'tool', 'machine', 'weapon', 'vehicle', 'building', 'edible', 'medicine', 'music',
  'sport', 'money', 'digital', 'electric', 'light', 'dark', 'magic', 'mythical',
  'holy', 'evil', 'time', 'abstract', 'emotion', 'knowledge', 'death', 'ancient',
  'sound',
];
const TAG_INDEX = new Map(TAGS.map((t, i) => [t, i]));
const TAG_ALIASES = { furry: 'soft', heavy: 'hard', sand: 'earth', toy: 'emotion', luck: 'magic', dirty: 'poison', fruit: 'edible', round: null, wild: null, slow: null, sour: null };
const MASK_WORDS = 3;

const RARITIES = [
  { id: 'common', name: 'Common', color: '#9aa1ab' },
  { id: 'uncommon', name: 'Uncommon', color: '#2fbf63' },
  { id: 'rare', name: 'Rare', color: '#3b82f6' },
  { id: 'epic', name: 'Epic', color: '#a855f7' },
  { id: 'legendary', name: 'Legendary', color: '#f5b301' },
  { id: 'mythic', name: 'Mythic', color: '#ff4fd8' },
];
const RARITY_INDEX = new Map(RARITIES.map((r, i) => [r.id, i]));

// Tag → colour used when an item has no explicit colour.
const TAG_COLORS = [
  ['fire', 0xff6a1a], ['water', 0x2f8cff], ['ice', 0xbfeaff], ['plant', 0x3fb34f], ['metal', 0xb8bec8],
  ['crystal', 0xc49bff], ['glass', 0xd8f4ff], ['stone', 0x8d8d8d], ['wood', 0x9b6b3d], ['earth', 0x8a6a45],
  ['electric', 0xffe83a], ['cosmic', 0x4a3a9a], ['holy', 0xfff2a8], ['evil', 0x6a1030], ['magic', 0xb04dff],
  ['poison', 0x7ad13b], ['sweet', 0xff9ec7], ['money', 0xffcc33], ['digital', 0x33ffd0], ['dark', 0x2b2b3a],
  ['light', 0xfff6c0], ['sky', 0x8fd0ff], ['sea', 0x1f6fbf], ['cloth', 0xd87a7a], ['paper', 0xf2ead8],
  ['plastic', 0xff5a8a], ['animal', 0xc79a6b], ['human', 0xe8b090], ['edible', 0xe8a060], ['music', 0xb05cff],
  ['emotion', 0xff7aa8], ['knowledge', 0x5a7aff], ['time', 0xc8b8ff], ['death', 0x3a3a44], ['air', 0xd6ecff],
  ['gas', 0xcfd6dc], ['energy', 0xffe14d], ['machine', 0x8a94a0],
];
// Material → physical & audio properties
const MATERIALS = {
  metal: { density: 7, rough: 0.28, metal: 1, sound: 'metal', bounce: 0.25, friction: 0.35 },
  gold: { density: 9, rough: 0.22, metal: 1, sound: 'metal', bounce: 0.2, friction: 0.35 },
  stone: { density: 5, rough: 0.92, metal: 0, sound: 'stone', bounce: 0.12, friction: 0.7 },
  soil: { density: 3.5, rough: 1, metal: 0, sound: 'soil', bounce: 0.05, friction: 0.9 },
  clay: { density: 3, rough: 0.8, metal: 0, sound: 'soil', bounce: 0.08, friction: 0.8 },
  crystal: { density: 4, rough: 0.08, metal: 0.1, sound: 'glass', bounce: 0.3, friction: 0.3 },
  glass: { density: 3, rough: 0.05, metal: 0, sound: 'glass', bounce: 0.3, friction: 0.25 },
  ice: { density: 2, rough: 0.1, metal: 0, sound: 'glass', bounce: 0.2, friction: 0.04 },
  wood: { density: 1.5, rough: 0.75, metal: 0, sound: 'wood', bounce: 0.3, friction: 0.6 },
  cloth: { density: 0.5, rough: 1, metal: 0, sound: 'soft', bounce: 0.05, friction: 0.9 },
  paper: { density: 0.4, rough: 0.95, metal: 0, sound: 'paper', bounce: 0.1, friction: 0.7 },
  plastic: { density: 1, rough: 0.35, metal: 0, sound: 'plastic', bounce: 0.55, friction: 0.5 },
  fire: { density: 0.3, rough: 0.5, metal: 0, sound: 'fire', bounce: 0.1, friction: 0.3 },
  liquid: { density: 2.5, rough: 0.08, metal: 0, sound: 'liquid', bounce: 0.02, friction: 0.2 },
  gas: { density: 0.05, rough: 1, metal: 0, sound: 'gas', bounce: 0.3, friction: 0.1 },
  energy: { density: 0.15, rough: 0.4, metal: 0, sound: 'energy', bounce: 0.4, friction: 0.2 },
  magic: { density: 0.8, rough: 0.3, metal: 0.2, sound: 'magic', bounce: 0.4, friction: 0.3 },
  ethereal: { density: 0.3, rough: 0.4, metal: 0, sound: 'magic', bounce: 0.5, friction: 0.2 },
  organic: { density: 2.2, rough: 0.65, metal: 0, sound: 'organic', bounce: 0.35, friction: 0.6 },
  food: { density: 1.4, rough: 0.6, metal: 0, sound: 'food', bounce: 0.25, friction: 0.6 },
  candy: { density: 1.2, rough: 0.2, metal: 0, sound: 'glass', bounce: 0.35, friction: 0.4 },
};
const HEAD_SCORE = {
  creature: 6, humanoid: 6, robot: 6, bird: 6, fish: 6, snake: 6, insect: 6, building: 6, vehicle: 6, plane: 6, boat: 6,
  rocket: 6, landform: 5.5, tower: 6, tool: 5, blade: 5, machine: 5, device: 5, instrument: 5, tree: 4.5, plant: 4,
  mushroom: 4, food: 4, fruit: 4, disc: 4, cake: 4, icecream: 4, drink: 4, bowl: 4, bread: 4, meat: 4, candy: 4,
  potion: 3.5, book: 3.5, coin: 3.5, cube: 3, crown: 3.5, shield: 3.5, bomb: 3.5, lamp: 3.5, clock: 3.5, key: 3.5,
  magnet: 3.5, bell: 3.5, umbrella: 3.5, flag: 3.5, cloth: 3, egg: 3, bone: 3, skull: 3.5, gear: 3.5, ring: 3,
  heart: 2.5, star5: 3, planet: 3.5, moon: 3.5, celestial: 3, galaxy: 3, blackhole: 3, crystal: 2.5, rock: 2.5,
  spike: 2.5, blob: 2, cloud: 2, liquid: 1.5, gas: 1.2, flame: 1.5, orb: 2, bolt: 1.5, abstract: 0.5,
};

// ---------------------------------------------------------------- bitmasks
function newMask() { return new Uint32Array(MASK_WORDS); }
function maskFromTags(tags) { const m = newMask(); for (const t of tags) { const i = TAG_INDEX.get(t); if (i !== undefined) m[i >> 5] |= (1 << (i & 31)); } return m; }
function maskHas(m, i) { return (m[i >> 5] & (1 << (i & 31))) !== 0; }
function maskHasAll(m, req) { for (let w = 0; w < MASK_WORDS; w++) if ((m[w] & req[w]) !== req[w]) return false; return true; }
function popcount32(x) { x -= (x >>> 1) & 0x55555555; x = (x & 0x33333333) + ((x >>> 2) & 0x33333333); return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24; }
function maskJaccard(a, b) {
  let inter = 0, uni = 0;
  for (let w = 0; w < MASK_WORDS; w++) { inter += popcount32(a[w] & b[w]); uni += popcount32(a[w] | b[w]); }
  return uni ? inter / uni : 0;
}
function pairKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }
function normName(s) { return slugify(s).replace(/-/g, ''); }

// ============================================================================
const Universe = {
  items: [], byId: new Map(), byNorm: new Map(), pairTable: new Map(), reverse: new Map(),
  multiTable: new Map(), multiReverse: new Map(), sourceMod: new Map(), modSources: new Map(),
  rules: [], warnings: [], infoCache: new Map(), parseCache: new Map(), combineCache: new Map(),
  llmItems: new Map(), llmPairs: new Map(), canonCache: new Map(), totalCount: 0, coreCount: 0, ready: false,

  // ------------------------------------------------------------ build
  build() {
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    const now = () => (typeof performance !== 'undefined' ? performance : Date).now();
    this.phaseMs = {};
    for (const ph of ['parseCore', 'computeDepths', 'deriveAttributes', 'setupModifiers', 'parseRules', 'parseMulti', 'buildPairTable', 'countUniverse']) {
      const t = now(); this[ph](); this.phaseMs[ph] = Math.round(now() - t);
    }
    this.ready = true;
    this.buildMs = (typeof performance !== 'undefined' ? performance : Date).now() - t0;
    return this;
  },

  warn(msg) { this.warnings.push(msg); },

  parseCore() {
    const seen = new Set();
    for (const block of CORE_DATA) {
      for (let raw of block.split('\n')) {
        raw = raw.trim();
        if (!raw || raw.startsWith('//')) continue;
        const parts = raw.split('|');
        if (parts.length < 3) { this.warn('bad line: ' + raw); continue; }
        const [name, emoji, tagStr, recStr = ''] = parts.map(s => s.trim());
        const id = slugify(name);
        if (seen.has(id)) { this.warn('duplicate item: ' + name); continue; }
        seen.add(id);
        const item = {
          kind: 'core', id, name, emoji, tags: [], shape: null, material: null, color: null, rarityOverride: null,
          secret: null, adj: null, rawRecipes: recStr, recipes: [], index: this.items.length, primaryTag: null,
        };
        for (let tok of tagStr.split(',')) {
          tok = tok.trim(); if (!tok) continue;
          const c = tok[0];
          if (c === '@') item.shape = tok.slice(1);
          else if (c === '#') item.color = parseInt(tok.slice(1), 16);
          else if (c === '%') item.material = tok.slice(1);
          else if (c === '!') item.rarityOverride = tok.slice(1);
          else if (c === '^') item.secret = tok.slice(1);
          else if (c === '=') item.adj = tok.slice(1);
          else {
            let t = tok;
            if (!TAG_INDEX.has(t)) {
              if (t in TAG_ALIASES) { t = TAG_ALIASES[t]; if (!t) continue; }
              else { this.warn(`unknown tag "${tok}" on ${name}`); continue; }
            }
            if (!item.tags.includes(t)) item.tags.push(t);
            if (!item.primaryTag) item.primaryTag = t;
          }
        }
        if (['plant', 'animal', 'human'].some(t => item.tags.includes(t)) && !item.tags.includes('living')) item.tags.push('living');
        this.items.push(item);
        this.byId.set(id, item);
        this.byNorm.set(normName(name), item);
      }
    }
    // resolve recipes
    for (const item of this.items) {
      if (!item.rawRecipes) continue;
      for (const r of item.rawRecipes.split(';')) {
        const names = r.split('+').map(s => s.trim()).filter(Boolean);
        if (names.length < 2) continue;
        const ids = [];
        let ok = true;
        for (const n of names) {
          const ing = this.byNorm.get(normName(n));
          if (!ing) {
            // adjective-style ingredients ("Tiny", "Huge") are tags, not items: skip that recipe quietly
            const low = n.toLowerCase();
            if (!TAG_INDEX.has(low) && !(low in TAG_ALIASES)) this.warn(`missing ingredient "${n}" in ${item.name}`);
            ok = false; break;
          }
          ids.push(ing.id);
        }
        if (ok) item.recipes.push(ids);
      }
    }
    this.coreCount = this.items.length;
    this.elements = ['air', 'fire', 'earth', 'water'].map(id => this.byId.get(id));
  },

  computeDepths() {
    for (const it of this.items) it.depth = Infinity;
    for (const e of this.elements) e.depth = 0;
    let changed = true, guard = 0;
    while (changed && guard++ < 100) {
      changed = false;
      for (const it of this.items) {
        for (const r of it.recipes) {
          let d = 0;
          for (const id of r) { const dd = this.byId.get(id).depth; if (dd > d) d = dd; }
          if (d + 1 < it.depth) { it.depth = d + 1; changed = true; }
        }
      }
    }
    const finite = this.items.filter(i => i.depth !== Infinity).map(i => i.depth).sort((a, b) => a - b);
    this.maxDepth = finite[finite.length - 1] || 1;
    const p98 = finite[Math.floor(finite.length * 0.985)] || this.maxDepth;
    // cumulative depth distribution → rarity percentiles
    const cdf = new Map();
    finite.forEach((d, i) => cdf.set(d, (i + 1) / finite.length));
    for (const it of this.items) {
      if (it.depth === Infinity) { this.warn('unreachable: ' + it.name); it.depth = this.maxDepth; it.unreachable = true; }
      it.tier = it.depth === 0 ? 0 : clamp(Math.round(it.depth * 10 / p98), 1, 10);
      const p = cdf.get(it.depth) ?? 1;
      it.baseRarity = it.depth <= 2 ? 0 : p <= 0.3 ? 0 : p <= 0.67 ? 1 : p <= 0.86 ? 2 : p <= 0.96 ? 3 : p <= 0.993 ? 4 : 5;
    }
  },

  deriveAttributes() {
    for (const it of this.items) {
      const has = (t) => it.tags.includes(t);
      it.mask = maskFromTags(it.tags);
      if (!it.shape) it.shape = this.deriveShape(it, has);
      if (!it.material) it.material = this.deriveMaterial(it, has);
      if (!MATERIALS[it.material]) { this.warn(`unknown material ${it.material} on ${it.name}`); it.material = 'clay'; }
      it.state = this.deriveState(it, has);
      if (it.color == null) {
        const tc = TAG_COLORS.find(([t]) => has(t));
        it.color = tc ? shiftColor(tc[1], (hash01(it.id) - 0.5) * 0.05, 0, (hash01(it.id, 7) - 0.5) * 0.1) : 0xc8c8c8;
      }
      it.glow = has('fire') && !has('living') ? 0.9 : has('energy') && !has('living') ? 0.75 : has('light') && !has('dark') ? 0.6 :
        has('electric') ? 0.5 : (has('magic') || has('holy')) ? 0.4 : it.shape === 'celestial' ? 0.8 : has('crystal') ? 0.2 : 0;
      it.glowColor = it.glow ? shiftColor(it.color, 0, 0.1, 0.12) : 0;
      it.opacity = it.material === 'gas' ? 0.6 : (it.material === 'glass' || it.material === 'ice') ? 0.65 : it.shape === 'abstract' ? 0.62 : 1;
      let size = 0.2;
      if (has('tiny')) size *= 0.72;
      if (has('huge')) size *= 1.3;
      if (['building', 'vehicle', 'landform', 'tree', 'celestial', 'planet', 'galaxy', 'boat', 'plane', 'rocket', 'tower'].includes(it.shape)) size *= 1.12;
      it.size = size;
      const mat = MATERIALS[it.material];
      it.mass = clamp(mat.density * Math.pow(size / 0.2, 3), 0.03, 25);
      it.sound = mat.sound;
      it.scale = 1;
      it.fx = [];
      if (it.material === 'fire') it.fx.push('flames');
      if (it.material === 'magic' || (has('magic') && !has('living'))) it.fx.push('sparkle');
      if (it.state === 'gas') it.fx.push('puffs');
      if (has('electric') && !has('living')) it.fx.push('sparks');
      let r = it.baseRarity;
      if (has('mythical')) r = Math.min(5, r + 1);
      if (it.rarityOverride && RARITY_INDEX.has(it.rarityOverride)) r = Math.max(r, RARITY_INDEX.get(it.rarityOverride));
      it.rarity = r;
      it.emojis = [it.emoji];
      it.isAbstract = it.shape === 'abstract' || has('abstract');
      it.headScore = HEAD_SCORE[it.shape] ?? 3;
    }
  },

  deriveShape(it, has) {
    if (has('human')) return 'humanoid';
    if (has('animal')) return has('flying') ? 'bird' : has('sea') ? 'fish' : 'creature';
    if (has('plant')) return has('wood') && has('huge') ? 'tree' : 'plant';
    if (has('vehicle')) return has('flying') ? 'plane' : has('sea') ? 'boat' : has('cosmic') ? 'rocket' : 'vehicle';
    if (has('building')) return 'building';
    if (has('weapon') && has('sharp')) return 'blade';
    if (has('tool') || has('weapon')) return 'tool';
    if (has('machine') || has('digital')) return 'machine';
    if (has('crystal')) return 'crystal';
    if (has('liquid')) return 'liquid';
    if (has('gas')) return 'gas';
    if (has('fire')) return 'flame';
    if (has('cosmic')) return 'celestial';
    if (has('energy') || has('electric') || has('abstract') || has('emotion') || has('knowledge') || has('time')) return 'abstract';
    if (has('edible')) return 'food';
    if (has('stone') || has('earth')) return 'rock';
    if (has('metal')) return 'cube';
    if (has('cloth')) return 'cloth';
    if (has('paper')) return 'book';
    return 'blob';
  },

  deriveMaterial(it, has) {
    if (has('robot') || (has('machine') && has('metal'))) return 'metal';
    if (has('living') && !has('machine')) return 'organic';
    for (const m of ['metal', 'crystal', 'glass', 'ice', 'stone', 'wood', 'cloth', 'paper', 'plastic']) if (has(m)) return m;
    const fiery = ['flame', 'bolt', 'celestial', 'abstract', 'gas', 'orb', 'liquid', 'star5'].includes(it.shape);
    if (has('fire') && fiery && !has('building')) return 'fire';
    if ((has('energy') || has('electric')) && fiery) return 'energy';
    if (has('liquid')) return 'liquid';
    if (has('gas')) return 'gas';
    if (has('abstract') || has('emotion') || has('knowledge') || has('time')) return 'ethereal';
    if (has('magic')) return 'magic';
    if (has('edible')) return 'food';
    if (has('machine')) return 'metal';
    if (has('earth')) return 'soil';
    if (has('fire')) return it.shape === 'landform' ? 'soil' : 'clay';
    return 'clay';
  },

  deriveState(it, has) {
    if (it.material === 'gas' || (has('gas') && !has('living'))) return 'gas';
    if (has('living') && !has('machine')) return 'living';
    if (it.material === 'liquid' || (has('liquid') && !has('building'))) return 'liquid';
    if (it.material === 'fire' || (has('fire') && has('energy') && !has('building'))) return 'plasma';
    if ((it.material === 'energy') || (has('energy') && !has('machine') && !has('building'))) return 'energy';
    if (it.material === 'ethereal' || (has('abstract') && !has('edible'))) return 'abstract';
    return 'solid';
  },

  setupModifiers() {
    for (const m of MODIFIER_DEFS) {
      m.addMask = maskFromTags(m.add || []);
      m.addIdx = (m.add || []).map(t => TAG_INDEX.get(t)).filter(i => i !== undefined);
      m.removeSet = new Set(m.remove || []);
      m.reqIdx = (m.requires || []).map(t => TAG_INDEX.get(t));
      const srcIds = [];
      for (const s of m.sources) {
        const it = this.byNorm.get(normName(s));
        if (!it) { this.warn(`modifier ${m.id}: missing source "${s}"`); continue; }
        if (this.sourceMod.has(it.id)) { this.warn(`${s} is a source of two modifiers (${this.sourceMod.get(it.id)}, ${m.id})`); continue; }
        this.sourceMod.set(it.id, m.id);
        srcIds.push(it.id);
      }
      this.modSources.set(m.id, srcIds);
    }
    // applicable single modifiers for each core item (for counting & random picks)
    for (const it of this.items) {
      it.applicableMods = [];
      for (const m of MODIFIER_DEFS) if (this.modApplicable(it, m)) it.applicableMods.push(m.index);
    }
  },

  modApplicable(base, m) {
    if (this.sourceMod.get(base.id) === m.id) return false;
    if (m.reqIdx.length && !m.reqIdx.some(i => maskHas(base.mask, i))) return false;
    if (m.addIdx.length && m.addIdx.every(i => maskHas(base.mask, i))) return false;
    return true;
  },

  modsValid(base, modIds) {
    if (!base || base.kind !== 'core') return false;
    if (modIds.length > 2) return false;
    if (modIds.length === 2) {
      const a = MOD_BY_ID.get(modIds[0]), b = MOD_BY_ID.get(modIds[1]);
      if (!a || !b || a === b || a.group === b.group) return false;
    }
    for (const id of modIds) { const m = MOD_BY_ID.get(id); if (!m || !this.modApplicable(base, m)) return false; }
    return true;
  },

  makeModId(baseId, modIds) {
    if (!modIds.length) return baseId;
    const sorted = [...new Set(modIds)].sort((x, y) => MOD_BY_ID.get(x).index - MOD_BY_ID.get(y).index);
    return baseId + '~' + sorted.join('~');
  },

  parseRules() {
    const parseSide = (s) => s.trim() === 'any' ? [] : s.split('&').map(t => t.trim());
    for (let line of RULE_TEXT.split('\n')) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;
      const [a, b, out] = line.split('|').map(s => s.trim());
      const ta = parseSide(a), tb = parseSide(b);
      for (const t of [...ta, ...tb]) if (!TAG_INDEX.has(t)) this.warn(`rule uses unknown tag ${t}: ${line}`);
      const outs = [];
      for (let o of out.split(',')) {
        o = o.trim(); if (!o) continue;
        const ci = o.lastIndexOf(':');
        let what = o, w = 1;
        if (ci > 0 && /^\d+(\.\d+)?$/.test(o.slice(ci + 1))) { what = o.slice(0, ci); w = parseFloat(o.slice(ci + 1)); }
        const parsed = this.parseOutcome(what, line);
        if (parsed) outs.push([parsed, w]);
      }
      this.rules.push({ a: maskFromTags(ta), b: maskFromTags(tb), spec: ta.length + tb.length, out: outs, text: line, sym: a === b });
    }
    this.legendaryPool = LEGENDARY_POOL.map(([w, wt]) => [this.parseOutcome(w, 'legendary'), wt]).filter(x => x[0]);
  },

  parseOutcome(what, ctx) {
    if (what === 'comp') return { type: 'comp' };
    if (what === 'comp@a') return { type: 'comp', adj: 'a' };
    if (what === 'comp@b') return { type: 'comp', adj: 'b' };
    if (what.startsWith('mod:')) {
      const [mid, side] = what.slice(4).split('@');
      if (!MOD_BY_ID.has(mid)) { this.warn(`rule outcome unknown modifier ${mid} (${ctx})`); return null; }
      return { type: 'mod', mod: mid, side: side || 'b' };
    }
    const it = this.byNorm.get(normName(what));
    if (!it) { this.warn(`rule outcome unknown item "${what}" (${ctx})`); return null; }
    return { type: 'item', id: it.id };
  },

  parseMulti() {
    for (let line of MULTI_TEXT.split('\n')) {
      line = line.trim();
      if (!line || line.startsWith('//')) continue;
      const [lhs, rhs] = line.split('=').map(s => s.trim());
      const res = this.byNorm.get(normName(rhs));
      const ids = lhs.split('+').map(n => this.byNorm.get(normName(n.trim())));
      if (!res || ids.some(x => !x)) { this.warn('bad multi recipe: ' + line); continue; }
      this.addMulti(ids.map(x => x.id), res.id);
    }
    // 3+ ingredient canonical recipes from the item data also count as Fusion Ring recipes
    for (const it of this.items) for (const r of it.recipes) if (r.length >= 3) this.addMulti(r, it.id);
  },
  addMulti(ids, resId) {
    const key = [...ids].sort().join('+');
    if (this.multiTable.has(key)) return;
    this.multiTable.set(key, resId);
    if (!this.multiReverse.has(resId)) this.multiReverse.set(resId, []);
    this.multiReverse.get(resId).push(key);
  },

  // ---------------------------------------------- pair table + substitution
  buildPairTable() {
    const table = this.pairTable;
    const put = (a, b, res) => {
      if (a === res || b === res) return false;
      const k = pairKey(a, b);
      if (table.has(k)) return false;
      table.set(k, res);
      if (!this.reverse.has(res)) this.reverse.set(res, []);
      this.reverse.get(res).push(k);
      return true;
    };
    // 1. canonical recipes — secrets first so their triggers are guaranteed
    const order = [...this.items].sort((x, y) => (y.secret ? 1 : 0) - (x.secret ? 1 : 0));
    for (const it of order) {
      for (const r of it.recipes) {
        if (r.length !== 2) continue;
        const k = pairKey(r[0], r[1]);
        const prev = table.get(k);
        if (prev && prev !== it.id) this.warn(`recipe conflict: ${r.join('+')} → ${prev} vs ${it.id}`);
        else if (!prev) put(r[0], r[1], it.id);
      }
    }
    // 2. substitution expansion: similar ingredients make the same result
    const n = this.items.length;
    const M = new Uint32Array(n * MASK_WORDS), pop = new Uint8Array(n);
    this.items.forEach((it, i) => { for (let w = 0; w < MASK_WORDS; w++) { M[i * MASK_WORDS + w] = it.mask[w]; pop[i] += popcount32(it.mask[w]); } });
    const primIdx = this.items.map(it => it.primaryTag ? TAG_INDEX.get(it.primaryTag) : -1);
    const neighborCache = new Map();
    const neighbors = (srcId, k) => {
      let list = neighborCache.get(srcId);
      if (!list) {
        const src = this.byId.get(srcId), si = src.index, pi = primIdx[si];
        const top = []; // [score, idx] kept sorted desc, max 12
        for (let j = 0; j < n; j++) {
          if (j === si) continue;
          const it = this.items[j];
          if (it.secret || it.unreachable) continue;
          let inter = 0;
          for (let w = 0; w < MASK_WORDS; w++) inter += popcount32(M[si * MASK_WORDS + w] & M[j * MASK_WORDS + w]);
          if (!inter) continue;
          let s = inter / (pop[si] + pop[j] - inter);
          if (s < 0.2) continue;
          s += (pi >= 0 && (M[j * MASK_WORDS + (pi >> 5)] & (1 << (pi & 31)))) ? 0.18 : -0.12;
          if (it.shape === src.shape) s += 0.05;
          s -= 0.025 * Math.abs(it.depth - src.depth);
          if (top.length === 12 && s <= top[11][0]) continue;
          let p = top.length < 12 ? top.length : 11;
          if (top.length < 12) top.push(null);
          while (p > 0 && top[p - 1][0] < s) { top[p] = top[p - 1]; p--; }
          top[p] = [s, j];
        }
        list = top.map(x => this.items[x[1]].id);
        neighborCache.set(srcId, list);
      }
      return list.slice(0, k);
    };
    const want = (it) => it.rarity === 0 ? 24 : it.rarity === 1 ? 12 : it.rarity === 2 ? 8 : 6;
    const runPass = (kOf, maxRank) => {
      const cands = [];
      for (const it of this.items) {
        const k = kOf(it);
        if (!k) continue;
        for (const r of it.recipes) {
          if (r.length !== 2) continue;
          const [A, B] = r;
          const ok = (id) => id !== it.id && this.byId.get(id).depth <= Math.max(it.depth, this.byId.get(r[0]).depth, this.byId.get(r[1]).depth) + 3;
          const sa = neighbors(A, k).filter(id => id !== B && ok(id));
          const sb = neighbors(B, k).filter(id => id !== A && ok(id));
          sa.forEach((a2, i) => cands.push([it.id, a2, B, i + 1]));
          sb.forEach((b2, j) => cands.push([it.id, A, b2, j + 1]));
          for (let i = 0; i < Math.min(3, sa.length); i++)
            for (let j = 0; j < Math.min(3, sb.length); j++) cands.push([it.id, sa[i], sb[j], i + j + 3]);
        }
      }
      cands.sort((x, y) => x[3] - y[3]);
      const count = (id) => (this.reverse.get(id) || []).length;
      for (const [res, a, b, rank] of cands) {
        if (rank > maxRank) break;
        const it = this.byId.get(res);
        if (count(res) >= want(it)) continue;
        put(a, b, res);
      }
    };
    runPass((it) => it.rarity === 0 ? 8 : it.rarity === 1 ? 5 : it.rarity === 2 ? 4 : 3, 99);
    // top-up pass for anything still under 5 recipes
    runPass((it) => ((this.reverse.get(it.id) || []).length < 5 && it.recipes.length) ? 12 : 0, 99);
  },

  countUniverse() {
    let single = 0, double = 0;
    for (const it of this.items) {
      const mods = it.applicableMods;
      single += mods.length;
      for (let i = 0; i < mods.length; i++)
        for (let j = i + 1; j < mods.length; j++)
          if (MODIFIER_DEFS[mods[i]].group !== MODIFIER_DEFS[mods[j]].group) double++;
    }
    const n = this.items.length;
    this.countBreakdown = { core: n, oneMod: single, twoMods: double, composites: n * (n - 1) / 2 };
    this.totalCount = n + single + double + this.countBreakdown.composites;
  },

  // ------------------------------------------------------------ id parsing
  parse(id) {
    if (!id) return null;
    let p = this.parseCache.get(id);
    if (p !== undefined) return p;
    p = null;
    if (id.startsWith('x:')) {
      const [, a, h] = id.split(':');
      const adj = this.byId.get(a), head = this.byId.get(h);
      if (adj && head && adj !== head) p = { kind: 'comp', id, adj, head, base: null, mods: [] };
    } else if (id.startsWith('l:')) {
      const data = this.llmItems.get(id);
      if (data) p = { kind: 'llm', id, data, base: null, mods: [] };
    } else if (id.includes('~')) {
      const [b, ...mods] = id.split('~');
      const base = this.byId.get(b);
      if (base && this.modsValid(base, mods) && this.makeModId(b, mods) === id) p = { kind: 'mod', id, base, mods };
    } else {
      const base = this.byId.get(id);
      if (base) p = { kind: 'core', id, base, mods: [] };
    }
    if (this.parseCache.size > 50000) this.parseCache.clear();
    this.parseCache.set(id, p);
    return p;
  },
  isValidId(id) { return !!this.parse(id); },

  // ------------------------------------------------------------ item info
  get(id) {
    let info = this.infoCache.get(id);
    if (info) return info;
    const p = this.parse(id);
    if (!p) return null;
    if (p.kind === 'core') info = p.base;
    else if (p.kind === 'mod') info = this.buildModInfo(p);
    else if (p.kind === 'comp') info = this.buildCompInfo(p);
    else info = this.buildLlmInfo(p);
    if (this.infoCache.size > 30000) this.infoCache.clear();
    this.infoCache.set(id, info);
    return info;
  },

  modName(baseName, modIds) {
    const mods = modIds.map(m => MOD_BY_ID.get(m));
    const pre = mods.filter(m => m.pos === 'pre').sort((a, b) => a.ord - b.ord || a.index - b.index).map(m => m.name);
    const suf = mods.filter(m => m.pos === 'suf').map(m => m.name);
    return [...pre, baseName, ...suf].join(' ');
  },

  buildModInfo(p) {
    const b = p.base;
    const mods = p.mods.map(m => MOD_BY_ID.get(m));
    const tags = new Set(b.tags);
    let color = b.color, glow = b.glow, glowColor = b.glowColor, opacity = b.opacity, scale = 1, massMul = 1, material = b.material, bump = 0;
    const fx = new Set(b.fx);
    for (const m of mods) {
      for (const t of m.removeSet) tags.delete(t);
      for (const t of m.add || []) tags.add(t);
      if (m.tint != null) color = mixColor(color, m.tint, m.tintAmt ?? 0.5);
      if (m.glow && m.glow > glow) { glow = m.glow; glowColor = m.glowColor ?? shiftColor(color, 0, 0.1, 0.15); }
      if (m.opacity != null) opacity = Math.min(opacity, m.opacity);
      if (m.scale) scale *= m.scale;
      if (m.mass) massMul *= m.mass;
      if (m.mat) material = m.mat;
      for (const f of m.fx || []) fx.add(f);
      bump += m.bump || 0;
    }
    const tagArr = [...tags];
    const mat = MATERIALS[material] || MATERIALS.clay;
    const has = (t) => tags.has(t);
    const fake = { tags: tagArr, material };
    return {
      kind: 'mod', id: p.id, base: b, mods: p.mods, name: this.modName(b.name, p.mods), emoji: b.emoji,
      emojis: [b.emoji, ...mods.map(m => m.emoji)], tags: tagArr, mask: maskFromTags(tagArr), shape: b.shape, material,
      state: this.deriveState(fake, has), color, glow, glowColor, opacity, scale, size: b.size * scale,
      mass: clamp(b.mass * massMul * (mat.density / (MATERIALS[b.material] || mat).density) ** 0.5, 0.03, 30),
      sound: mat.sound, fx: [...fx], tier: Math.min(10, b.tier + mods.length + Math.floor(bump / 2)),
      rarity: Math.min(5, b.rarity + Math.round(bump * 0.6) + (mods.length === 2 ? 1 : 0) - (bump === 0 && mods.length === 1 ? 0 : 0)),
      isAbstract: b.isAbstract, headScore: b.headScore, primaryTag: b.primaryTag,
    };
  },

  compositeName(adj, head) {
    const h = hashStr(adj.id + '>' + head.id);
    const word = adj.adj || adj.name;
    if (adj.isAbstract && (h % 3) !== 0) return `${head.name} of ${adj.name}`;
    if (adj.tags.includes('human') && !head.tags.includes('living') && (h % 4) === 0) return `${adj.name}'s ${head.name}`;
    if (head.name.toLowerCase().includes(word.toLowerCase())) return `${word}-${head.name}`;
    return `${word} ${head.name}`;
  },

  buildCompInfo(p) {
    const { adj, head } = p;
    const TRANSFER = ['hot', 'cold', 'wet', 'dry', 'fire', 'water', 'earth', 'air', 'electric', 'magic', 'holy', 'evil', 'dark', 'light',
      'cosmic', 'poison', 'sweet', 'sticky', 'metal', 'stone', 'wood', 'glass', 'crystal', 'ice', 'explosive', 'digital', 'mythical',
      'time', 'death', 'music', 'sound', 'money', 'sharp', 'soft', 'hard', 'fast', 'tiny', 'huge', 'flying', 'sea', 'sky', 'underground', 'edible', 'emotion'];
    const tags = new Set(head.tags);
    for (const t of adj.tags) if (TRANSFER.includes(t)) tags.add(t);
    if (tags.has('hot') && tags.has('cold')) tags.delete(adj.tags.includes('hot') ? 'cold' : 'hot');
    const tagArr = [...tags];
    const matFromAdj = ['fire', 'ice', 'metal', 'gold', 'crystal', 'stone', 'wood', 'glass', 'liquid', 'energy', 'magic', 'candy', 'paper', 'plastic'];
    const material = matFromAdj.includes(adj.material) && !head.tags.includes('living') ? adj.material : head.material;
    const has = (t) => tags.has(t);
    const tier = Math.min(10, Math.max(adj.tier, head.tier) + 1);
    let rarity = tier <= 2 ? 0 : tier <= 4 ? 1 : tier <= 6 ? 2 : tier <= 8 ? 3 : tier === 9 ? 4 : 5;
    rarity = Math.min(5, Math.max(rarity, Math.max(adj.rarity, head.rarity)));
    const fx = new Set(head.fx);
    for (const f of adj.fx) fx.add(f);
    const glow = Math.max(head.glow, adj.glow * 0.8);
    return {
      kind: 'comp', id: p.id, adjItem: adj, headItem: head, name: this.compositeName(adj, head), emoji: head.emoji,
      emojis: [adj.emoji, head.emoji], tags: tagArr, mask: maskFromTags(tagArr), shape: head.shape, material,
      state: this.deriveState({ tags: tagArr, material }, has), color: mixColor(head.color, adj.color, 0.42),
      glow, glowColor: glow ? (adj.glow >= head.glow ? adj.glowColor : head.glowColor) : 0, opacity: Math.min(head.opacity, adj.opacity < 1 ? 0.8 : 1),
      scale: 1, size: head.size, mass: clamp(head.mass * Math.pow((MATERIALS[material].density + 0.1) / (MATERIALS[head.material].density + 0.1), 0.4), 0.03, 30),
      sound: MATERIALS[material].sound, fx: [...fx], tier, rarity, isAbstract: head.isAbstract, headScore: head.headScore, primaryTag: head.primaryTag,
    };
  },

  buildLlmInfo(p) {
    const d = p.data;
    const tags = (d.tags || []).filter(t => TAG_INDEX.has(t));
    const has = (t) => tags.includes(t);
    const fake = { tags, material: null };
    const material = MATERIALS[d.material] ? d.material : this.deriveMaterial(fake, has);
    fake.material = material;
    const shape = HEAD_SCORE[d.shape] !== undefined ? d.shape : this.deriveShape(fake, has);
    const tc = TAG_COLORS.find(([t]) => has(t));
    const color = d.color != null ? d.color : (tc ? tc[1] : 0xc8c8c8);
    const tier = clamp(d.tier ?? 5, 1, 10);
    const glow = has('fire') || has('energy') || has('light') ? 0.6 : has('magic') ? 0.4 : 0;
    return {
      kind: 'llm', id: p.id, name: d.name, emoji: d.emoji || '✨', emojis: [d.emoji || '✨'], tags, mask: maskFromTags(tags), shape, material,
      state: this.deriveState(fake, has), color, glow, glowColor: glow ? shiftColor(color, 0, 0.1, 0.15) : 0, opacity: material === 'gas' ? 0.6 : 1,
      scale: 1, size: has('tiny') ? 0.15 : has('huge') ? 0.26 : 0.2, mass: clamp(MATERIALS[material].density, 0.05, 20), sound: MATERIALS[material].sound,
      fx: material === 'magic' ? ['sparkle'] : [], tier, rarity: clamp(d.rarity ?? 2, 0, 5), isAbstract: shape === 'abstract', headScore: HEAD_SCORE[shape] ?? 3,
      primaryTag: tags[0] || null, llm: true,
    };
  },

  registerLlmItem(data) {
    const id = 'l:' + slugify(data.name).slice(0, 48);
    this.llmItems.set(id, data);
    this.parseCache.delete(id);
    this.infoCache.delete(id);
    return id;
  },

  /** Map a free-text name onto the procedural universe when possible. */
  idFromName(name) {
    const n = normName(name);
    const core = this.byNorm.get(n);
    if (core) return core.id;
    const words = name.trim().split(/\s+/);
    // try "Mod Mod Base" / "Base King"
    for (let cut = 1; cut <= Math.min(2, words.length - 1); cut++) {
      const modWords = words.slice(0, cut), baseName = words.slice(cut).join(' ');
      const mods = modWords.map(w => MODIFIER_DEFS.find(m => m.pos === 'pre' && m.name.toLowerCase() === w.toLowerCase()));
      const base = this.byNorm.get(normName(baseName));
      if (base && mods.every(Boolean)) {
        const ids = mods.map(m => m.id);
        if (this.modsValid(base, ids)) return this.makeModId(base.id, ids);
      }
    }
    if (words.length > 1) {
      const last = words[words.length - 1];
      const suf = MODIFIER_DEFS.find(m => m.pos === 'suf' && m.name.toLowerCase() === last.toLowerCase());
      const base = this.byNorm.get(normName(words.slice(0, -1).join(' ')));
      if (suf && base && this.modsValid(base, [suf.id])) return this.makeModId(base.id, [suf.id]);
    }
    return null;
  },

  // ------------------------------------------------------------ combine
  combine(a, b) {
    if (!a || !b) return null;
    const key = pairKey(a, b);
    let r = this.combineCache.get(key);
    if (r !== undefined) return r;
    r = this.combineUncached(a, b, key);
    if (this.combineCache.size > 40000) this.combineCache.clear();
    this.combineCache.set(key, r);
    return r;
  },

  baseOf(p) { return p.kind === 'core' || p.kind === 'mod' ? p.base : p.kind === 'comp' ? p.head : null; },

  /** A modified item whose generated name equals a hand-authored item IS that item ("Baby" + "Dragon"). */
  canon(id) {
    if (!id.includes('~')) return id;
    let c = this.canonCache.get(id);
    if (c === undefined) {
      const [b, ...mods] = id.split('~');
      const core = this.byNorm.get(normName(this.modName(this.byId.get(b).name, mods)));
      c = core ? core.id : id;
      this.canonCache.set(id, c);
    }
    return c;
  },

  combineUncached(a, b, key) {
    const A = this.parse(a), B = this.parse(b);
    if (!A || !B) return null;
    const llmPair = this.llmPairs.get(key);
    const coreLike = (P) => P.kind === 'core' || P.kind === 'mod';
    // 1. table
    if (A.kind === 'core' && B.kind === 'core') {
      const t = this.pairTable.get(key);
      if (t) return { id: t, how: 'table' };
    }
    const baseKey = coreLike(A) && coreLike(B) ? pairKey(A.base.id, B.base.id) : null;
    const anyMod = A.kind === 'mod' || B.kind === 'mod';
    // 2. inheritance
    if (baseKey && anyMod) {
      const t = this.pairTable.get(baseKey);
      if (t) {
        const mods = [...new Set([...A.mods, ...B.mods])];
        if (this.modsValid(this.byId.get(t), mods)) return { id: this.canon(this.makeModId(t, mods)), how: 'inherit' };
      }
    }
    // 2b. modifiers burn off when the bases fuse into a named composite
    if (baseKey && anyMod && A.base !== B.base && !this.pairTable.has(baseKey)) {
      const br = this.combine(A.base.id, B.base.id);
      if (br && br.id.startsWith('x:')) return { id: br.id, how: 'comp' };
    }
    // 3. twins → giant (or baby, for living things already huge)
    if (baseKey && A.base === B.base && !this.pairTable.has(baseKey)) {
      const mods = [...new Set([...A.mods, ...B.mods])];
      for (const extra of ['giant', 'baby']) {
        if (extra === 'baby' && !A.base.tags.includes('living')) continue;
        if (!mods.includes(extra) && this.modsValid(A.base, [...mods, extra])) return { id: this.canon(this.makeModId(A.base.id, [...mods, extra])), how: 'twin' };
      }
    }
    // 4. modifier sources
    const opts = [];
    const tryApply = (target, src) => {
      if (src.kind !== 'core' || !coreLike(target)) return;
      const m = this.sourceMod.get(src.base.id);
      if (!m || target.mods.includes(m)) return;
      const mods = [...target.mods, m];
      if (this.modsValid(target.base, mods)) opts.push(this.canon(this.makeModId(target.base.id, mods)));
    };
    tryApply(A, B); tryApply(B, A);
    if (opts.length) return { id: opts.length === 1 ? opts[0] : opts[hashStr(key + '#src') & 1], how: 'mod' };
    // 5. LLM cache (only consulted where no deterministic rule above applies)
    if (llmPair && this.isValidId(llmPair)) return { id: llmPair, how: 'llm' };
    // 6. tag rules
    return this.ruleResolve(A, B, key);
  },

  ruleResolve(A, B, key) {
    const IA = this.get(A.id), IB = this.get(B.id);
    const mA = IA.mask, mB = IB.mask;
    const matches = [];
    let maxSpec = -1;
    for (const r of this.rules) {
      const ab = maskHasAll(mA, r.a) && maskHasAll(mB, r.b);
      const ba = !r.sym && maskHasAll(mB, r.a) && maskHasAll(mA, r.b);
      if (ab) matches.push([r, false]);
      if (ba) matches.push([r, true]);
      if ((ab || ba) && r.spec > maxSpec) maxSpec = r.spec;
    }
    const pool = new Map();
    const add = (id, w) => { if (id && w > 0) pool.set(id, (pool.get(id) || 0) + w); };
    const maxTier = Math.max(IA.tier, IB.tier);
    const resolveOutcome = (o, X, Y) => {
      if (o.type === 'item') {
        if (o.id === A.id || o.id === B.id) return [null, 0];
        const bA = this.baseOf(A), bB = this.baseOf(B);
        if ((bA && o.id === bA.id) || (bB && o.id === bB.id)) return [null, 0];
        const it = this.byId.get(o.id);
        return [o.id, it.tier < maxTier - 3 ? 0.35 : 1];
      }
      if (o.type === 'mod') {
        const target = o.side === 'a' ? X : Y;
        if (target.kind !== 'core' && target.kind !== 'mod') return [null, 0];
        if (target.mods.includes(o.mod)) return [null, 0];
        const mods = [...target.mods, o.mod];
        return this.modsValid(target.base, mods) ? [this.canon(this.makeModId(target.base.id, mods)), 1] : [null, 0];
      }
      // composite
      return [this.makeComposite(X, Y, o.adj ? (o.adj === 'a' ? X : Y) : null), 1];
    };
    for (const [r, flipped] of matches) {
      const level = maxSpec - r.spec;
      const mul = level === 0 ? 1 : level === 1 ? 0.22 : level === 2 ? 0.05 : 0.01;
      const X = flipped ? B : A, Y = flipped ? A : B;
      for (const [o, w] of r.out) { const [id, f] = resolveOutcome(o, X, Y); add(id, w * mul * f); }
    }
    const mystic = (I) => ['magic', 'mythical', 'cosmic', 'holy', 'time'].some(t => I.tags.includes(t));
    if ((IA.rarity >= 4 && IB.rarity >= 4) || (IA.rarity >= 3 && IB.rarity >= 3 && mystic(IA) && mystic(IB))) {
      let total = 0; for (const v of pool.values()) total += v;
      let lw = 0; for (const [, w] of this.legendaryPool) lw += w;
      const scale = (total || 1) * 0.45 / lw;
      for (const [o, w] of this.legendaryPool) { const [id, f] = resolveOutcome(o, A, B); add(id, w * scale * f); }
    }
    if (pool.size) {
      const entries = [...pool.entries()].sort((x, y) => (x[0] < y[0] ? -1 : 1));
      return { id: weightedPick(entries, hash01(key, GLOBAL_SEED ^ 0x77)), how: 'rule' };
    }
    const comp = this.makeComposite(A, B, null);
    if (comp) return { id: comp, how: 'comp' };
    // final procedural fallback: hash the pair into a tier-appropriate core item
    const pool2 = this.items.filter(it => Math.abs(it.tier - maxTier) <= 1 && !it.secret);
    const pick = pool2[hashStr(key, GLOBAL_SEED ^ 0x1234) % pool2.length];
    return { id: pick.id, how: 'fallback' };
  },

  makeComposite(X, Y, adjSide) {
    const bx = this.baseOf(X), by = this.baseOf(Y);
    if (!bx || !by || bx === by) return null;
    let adj, head;
    if (adjSide) { adj = adjSide === X ? bx : by; head = adj === bx ? by : bx; }
    else {
      if (bx.headScore !== by.headScore) head = bx.headScore > by.headScore ? bx : by;
      else if (bx.tier !== by.tier) head = bx.tier > by.tier ? bx : by;
      else head = (hashStr(pairKey(bx.id, by.id)) & 1) ? bx : by;
      adj = head === bx ? by : bx;
    }
    const name = this.compositeName(adj, head);
    const core = this.byNorm.get(normName(name));
    if (core) return core.id;
    return `x:${adj.id}:${head.id}`;
  },

  // ------------------------------------------------------------ multi fuse
  fuseMany(ids) {
    if (ids.length === 1) return { id: ids[0], how: 'single' };
    const coreIds = ids.map(id => { const p = this.parse(id); return p && p.kind === 'core' ? id : null; });
    if (coreIds.every(Boolean)) {
      const key = [...coreIds].sort().join('+');
      const r = this.multiTable.get(key);
      if (r) return { id: r, how: 'multi', key };
    }
    const sorted = [...ids].sort();
    let cur = sorted[0];
    for (let i = 1; i < sorted.length; i++) { const r = this.combine(cur, sorted[i]); if (!r) return null; cur = r.id; }
    return { id: cur, how: 'fold' };
  },

  // ------------------------------------------------------------ inverse
  /** All structured recipes that produce id (each verified by combine). Returns array of pair keys. */
  recipesFor(id) {
    const p = this.parse(id);
    if (!p) return [];
    const out = new Set();
    const verify = (a, b) => { if (!a || !b || !this.isValidId(a) || !this.isValidId(b)) return; const r = this.combine(a, b); if (r && r.id === id) out.add(pairKey(a, b)); };
    if (p.kind === 'core') {
      for (const k of this.reverse.get(id) || []) out.add(k);
    } else if (p.kind === 'mod') {
      const M = p.mods;
      for (const m of M) {
        const rest = M.filter(x => x !== m);
        const restId = this.modsValid(p.base, rest) ? this.makeModId(p.base.id, rest) : null;
        if (!restId) continue;
        for (const s of this.modSources.get(m) || []) verify(restId, s);
        if (m === 'giant') verify(restId, restId);
      }
      const subsets = M.length === 1 ? [[], M] : [[], [M[0]], [M[1]], M];
      for (const k of this.reverse.get(p.base.id) || []) {
        const [P, Q] = k.split('|');
        const bp = this.byId.get(P), bq = this.byId.get(Q);
        for (const m1 of subsets) for (const m2 of subsets) {
          if (new Set([...m1, ...m2]).size !== M.length) continue;
          if (!this.modsValid(bp, m1) && m1.length) continue;
          if (!this.modsValid(bq, m2) && m2.length) continue;
          verify(this.makeModId(P, m1), this.makeModId(Q, m2));
        }
      }
    } else if (p.kind === 'comp') {
      verify(p.adj.id, p.head.id);
      for (const m of MODIFIER_DEFS) {
        if (this.modsValid(p.adj, [m.id])) verify(this.makeModId(p.adj.id, [m.id]), p.head.id);
        if (this.modsValid(p.head, [m.id])) verify(p.adj.id, this.makeModId(p.head.id, [m.id]));
      }
    } else if (p.kind === 'llm') {
      for (const [k, v] of this.llmPairs) if (v === id) out.add(k);
    }
    return [...out];
  },
  multiRecipesFor(id) { return this.multiReverse.get(id) || []; },

  /** Most likely ingredients of an item (used by the Fusion Ring break-down). */
  breakdown(id) {
    const p = this.parse(id);
    if (!p) return null;
    if (p.kind === 'core') {
      const r = p.base.recipes.find(r => r.length === 2) || (this.reverse.get(id) || [])[0]?.split('|');
      return r ? [...r] : null;
    }
    if (p.kind === 'mod') {
      const m = p.mods[p.mods.length - 1];
      const rest = p.mods.slice(0, -1);
      const src = (this.modSources.get(m) || [])[0];
      if (m === 'giant') { const r = this.makeModId(p.base.id, rest); return [r, r]; }
      return src ? [this.makeModId(p.base.id, rest), src] : [p.base.id];
    }
    if (p.kind === 'comp') return [p.adj.id, p.head.id];
    if (p.kind === 'llm') { for (const [k, v] of this.llmPairs) if (v === id) return k.split('|'); }
    return null;
  },

  // ------------------------------------------------------------ hints
  hintFor(discovered, exclude) {
    const cands = [];
    for (const it of this.items) {
      if (discovered.has(it.id) || it.secret || (exclude && exclude.has(it.id))) continue;
      for (const k of this.reverse.get(it.id) || []) {
        const [a, b] = k.split('|');
        if (discovered.has(a) && discovered.has(b)) { cands.push([it, a, b]); break; }
      }
    }
    if (!cands.length) return null;
    cands.sort((x, y) => x[0].tier - y[0].tier || x[0].index - y[0].index);
    const pickFrom = cands.slice(0, Math.min(6, cands.length));
    return pickFrom[Math.floor(Math.random() * pickFrom.length)];
  },

  randomId(rng) {
    const base = this.items[Math.floor(rng() * this.items.length)];
    const r = rng();
    if (r < 0.12) return base.id;
    if (r < 0.55 || base.applicableMods.length < 2) {
      if (!base.applicableMods.length) return base.id;
      return this.makeModId(base.id, [MODIFIER_DEFS[base.applicableMods[Math.floor(rng() * base.applicableMods.length)]].id]);
    }
    if (r < 0.85) {
      for (let tries = 0; tries < 8; tries++) {
        const m1 = MODIFIER_DEFS[base.applicableMods[Math.floor(rng() * base.applicableMods.length)]];
        const m2 = MODIFIER_DEFS[base.applicableMods[Math.floor(rng() * base.applicableMods.length)]];
        if (this.modsValid(base, [m1.id, m2.id])) return this.makeModId(base.id, [m1.id, m2.id]);
      }
      return base.id;
    }
    // composites only exist where a real fusion produces them
    for (let tries = 0; tries < 6; tries++) {
      const other = this.items[Math.floor(rng() * this.items.length)];
      if (other === base) continue;
      const r = this.combine(base.id, other.id);
      if (r && r.id.startsWith('x:')) return r.id;
    }
    return base.id;
  },
};
