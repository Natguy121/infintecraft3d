// Generates src/js/05c_data_real.js: thousands of REAL things from WordNet 3.1 (Princeton, permissive license).
// Each real item inherits look/size/tags from its nearest in-game ancestor (Beagle → Dog) and gets recipes
// from its own name (Fire Engine = Fire + Truck) or from nouns in its dictionary definition.
//   node tools/gen-real-items.mjs
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'src/js'), WN = path.join(root, 'node_modules/wordnet-db/dict');

// ---- the current game universe (without previous real-item output)
const files = fs.readdirSync(dir).filter(f => /^0\d[a-z]?_.*\.js$/.test(f) && !f.startsWith('05c')).sort();
const ctx = { console: { log() {}, warn() {} }, performance, Math, Date, Map, Set, Uint32Array, JSON };
vm.createContext(ctx); vm.runInContext(files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n') + ';globalThis.U = Universe; globalThis.nn = normName;', ctx);
const U = ctx.U, normName = ctx.nn; U.build();
const core = new Map(U.items.map(it => [normName(it.name), it]));
const usedPairs = new Set();
const pk = (a, b) => a < b ? a + '|' + b : b + '|' + a;
for (const k of U.pairTable.keys()) usedPairs.add(k.split('|').map(id => normName(U.byId.get(id).name)).sort().join('|'));

// ---- WordNet
const idx = new Map();   // lemma -> { offs[], tag }
for (const line of fs.readFileSync(path.join(WN, 'index.noun'), 'utf8').split('\n')) {
  if (!line || line[0] === ' ') continue;
  const p = line.trim().split(' '), pc = +p[3], sc = +p[4 + pc], tag = +p[5 + pc];
  idx.set(p[0], { offs: p.slice(6 + pc, 6 + pc + sc), tag });
}
const syn = new Map();
for (const line of fs.readFileSync(path.join(WN, 'data.noun'), 'utf8').split('\n')) {
  if (!line || line[0] === ' ') continue;
  const [head, gloss = ''] = line.split(' | ');
  const p = head.split(' '); const off = p[0], lex = +p[1], wc = parseInt(p[3], 16);
  const words = []; for (let i = 0; i < wc; i++) words.push(p[4 + i * 2]);
  let j = 4 + wc * 2; const pcnt = +p[j++]; const hyper = [];
  for (let i = 0; i < pcnt; i++) { const sym = p[j], o = p[j + 1]; if (sym === '@' || sym === '@i') hyper.push(o); j += 4; }
  syn.set(off, { off, lex, words, hyper, gloss: gloss.split(';')[0].replace(/["(].*$/, '').trim() });
}
const KEEP = { 5: 'animal', 6: 'artifact', 8: 'body', 13: 'food', 15: 'location', 17: 'object', 18: 'person', 19: 'phenomenon', 20: 'plant', 27: 'substance' };
const ROOT = { animal: 'Animal', artifact: 'Tool', body: 'Human', food: 'Food', location: 'Land', object: 'Stone', person: 'Human', phenomenon: 'Weather', plant: 'Plant', substance: 'Stone' };
const BAD = /^(genus|family|order|class|phylum|subfamily|subclass|suborder|superfamily|division|kingdom|tribe) /;
const title = (w) => w.replace(/_/g, ' ').replace(/(^|[\s-])[a-z]/g, c => c.toUpperCase());

// choose a name for each kept synset
const chosen = new Map();   // off -> { name, rank, tag }
for (const s of syn.values()) {
  const cat = KEEP[s.lex]; if (!cat) continue;
  let best = null;
  for (const w of s.words) {
    const lw = w.toLowerCase().replace(/\(.*\)$/, '');
    const e = idx.get(lw); if (!e) continue;
    const rank = e.offs.indexOf(s.off);
    const clean = lw.replace(/_/g, ' ');
    const proper = /[A-Z]/.test(w);
    if (BAD.test(clean) || !/^[a-z][a-z' -]{1,24}$/.test(clean) || clean.split(' ').length > 3) continue;
    if (proper && cat !== 'location') continue;
    if (!proper && cat === 'location') continue;
    const score = (rank === 0 ? 10 : 0) + Math.min(e.tag, 20) - clean.split(' ').length;
    if (!best || score > best.score) best = { name: proper ? w.replace(/_/g, ' ') : title(clean), rank, tag: e.tag, score };
  }
  if (!best) continue;
  // frequency filter: common words always; taxonomy (animals, plants, food, things, materials, places) when concise
  const common = best.tag > 0 && best.rank < Math.max(1, best.tag);
  const taxo = ['animal', 'plant', 'food', 'location', 'artifact', 'substance', 'object', 'phenomenon'].includes(cat) && best.rank === 0 && best.name.split(' ').length <= 2;
  if (!common && !taxo) continue;
  chosen.set(s.off, { ...best, cat });
}
// dedupe names (keep primary sense)
const byName = new Map();
for (const [off, c] of chosen) { const k = normName(c.name); const o = byName.get(k); if (!o || c.score > chosen.get(o).score) byName.set(k, off); }

// resolve items in hypernym order
const item = new Map();     // off -> { name, core?: coreItem, gen?: rec }
const depthOf = new Map();
const depth = (off, seen = new Set()) => { if (depthOf.has(off)) return depthOf.get(off); if (seen.has(off)) return 0; seen.add(off); const s = syn.get(off); const d = s && s.hyper.length ? 1 + depth(s.hyper[0], seen) : 0; depthOf.set(off, d); return d; };
const offs = [...byName.values()].sort((a, b) => depth(a) - depth(b));
const gen = []; const genByNorm = new Map();
const STOP = new Set(['two', 'three', 'four', 'five', 'red', 'white', 'black', 'brown', 'green', 'blue', 'yellow', 'grey', 'gray', 'orange', 'pink', 'purple', 'explosion', 'thing', 'kind', 'type', 'any', 'form', 'part', 'one', 'small', 'large', 'used', 'usually', 'having', 'often', 'with', 'from', 'that', 'which', 'genus', 'family', 'species', 'member', 'object', 'person', 'something', 'body', 'unit', 'state', 'quality', 'piece', 'group', 'variety']);
const COLORS = { white: 0xf2f2ee, black: 0x2a2a2e, brown: 0x8a5a2a, red: 0xd83a2a, yellow: 0xf0c83a, green: 0x4aa83a, blue: 0x3a6ad8, grey: 0x8a8a92, gray: 0x8a8a92, orange: 0xf08a2a, pink: 0xf28ab0, purple: 0x8a4ab8, golden: 0xe8b83a, silver: 0xc8ccd4, spotted: null, striped: null };
const nearestCore = (off, seen = new Set()) => {
  const s = syn.get(off); if (!s || seen.has(off)) return null; seen.add(off);
  for (const h of s.hyper) { const it = item.get(h); if (it && it.core) return it.core; const c = nearestCore(h, seen); if (c) return c; }
  return null;
};
const nearestItemName = (off, seen = new Set()) => {
  const s = syn.get(off); if (!s || seen.has(off)) return null; seen.add(off);
  for (const h of s.hyper) { const it = item.get(h); if (it) return it.name; const n = nearestItemName(h, seen); if (n) return n; }
  return null;
};
const isItem = (n) => core.has(normName(n)) || genByNorm.has(normName(n));
const display = (n) => (core.get(normName(n)) || {}).name || (genByNorm.get(normName(n)) || {}).name || null;
for (const off of offs) {
  const c = chosen.get(off), k = normName(c.name);
  if (core.has(k)) { item.set(off, { name: core.get(k).name, core: core.get(k) }); continue; }
  const nc = nearestCore(off);
  if (!nc && c.cat !== 'location') continue;            // no real in-game ancestor → skip (no catch-all "Tool + X")
  const base = nc || core.get(normName(ROOT[c.cat]));
  if (!base) continue;
  const parentName = nearestItemName(off) || base.name;
  // obscure taxonomy: only keep animals/plants/food within two steps of a hand-made item
  const hops = (o, n = 0, seen = new Set()) => { const s = syn.get(o); if (!s || seen.has(o) || n > 6) return 9; seen.add(o); for (const h of s.hyper) { const it = item.get(h); if (it && it.core) return n + 1; if (it) return hops(h, n + 1, seen); } return 9; };
  const hp = hops(off);
  if (!(c.tag > 0) && hp > (['animal', 'plant', 'food'].includes(c.cat) ? 4 : 2)) continue;
  // recipe candidates
  const cands = [];
  const words = c.name.toLowerCase().split(/[\s-]+/);
  if (words.length > 1) {
    const items = words.map(w => display(w)).filter(Boolean);
    if (items.length >= 2) cands.push([items[0], items[items.length - 1]]);
    for (const it of items) if (normName(it) !== normName(parentName)) cands.push([parentName, it]);
  }
  const gl = syn.get(off).gloss.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  for (let i = 0; i < gl.length; i++) {
    const bi = i + 1 < gl.length ? display(gl[i] + ' ' + gl[i + 1]) : null;
    const d = bi || display(gl[i]) || (gl[i].endsWith('s') ? display(gl[i].slice(0, -1)) : null);
    if (d && normName(d) !== normName(parentName) && normName(d) !== k) cands.push([parentName, d]);
  }
  const recipes = [];
  for (const [a, b] of cands) {
    if (recipes.length >= 2) break;
    const key = [normName(a), normName(b)].sort().join('|');
    if (normName(a) === normName(b) || usedPairs.has(key)) continue;
    usedPairs.add(key); recipes.push(a + '+' + b);
  }
  if (!recipes.length) continue;     // unreachable → not added
  // look
  let color = base.color;
  for (const w of gl.slice(0, 12)) if (COLORS[w]) { color = COLORS[w]; break; }
  const tags = base.tags.slice(0, 6);
  const rec = { name: c.name, emoji: base.emoji, tags, shape: base.shape, color, material: base.material, like: base.name, recipes };
  item.set(off, { name: c.name, gen: rec }); gen.push(rec); genByNorm.set(k, rec);
}
const esc = (s) => s.replace(/[`|\\]/g, '');
// verify with the real engine: drop anything unreachable and repeat until stable
const allFiles = fs.readdirSync(dir).filter(f => /^0\d[a-z]?_.*\.js$/.test(f) && !f.startsWith('05c')).sort();
const engineSrc = allFiles.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n');
let list = gen;
for (let pass = 0; pass < 8; pass++) {
  const block = list.map(r => `${esc(r.name)}|${r.emoji}|${r.tags.join(',')},@${r.shape},#${(r.color >>> 0).toString(16).padStart(6, '0')},%${r.material},~${esc(r.like)}|${r.recipes.map(esc).join(';')}`).join('\n');
  const c2 = { console: { log() {}, warn() {} }, performance, Math, Date, Map, Set, Uint32Array, JSON };
  vm.createContext(c2); vm.runInContext(engineSrc + ';\nCORE_DATA.push(' + JSON.stringify('\n' + block + '\n') + ');\nUniverse.build(); globalThis.W = Universe.warnings;', c2);
  const bad = new Set(c2.W.filter(w => w.startsWith('unreachable: ')).map(w => normName(w.slice(13))));
  const before = list.length; list = list.filter(r => !bad.has(normName(r.name)));
  if (list.length === before) break;
}
gen.length = 0; gen.push(...list);
const lines = gen.map(r => `${esc(r.name)}|${r.emoji}|${r.tags.join(',')},@${r.shape},#${(r.color >>> 0).toString(16).padStart(6, '0')},%${r.material},~${esc(r.like)}|${r.recipes.map(esc).join(';')}`);
const out = `// ============================================================================
//  ELEMENTAL LAB — 05c · ${gen.length.toLocaleString()} REAL things from WordNet 3.1 (generated by tools/gen-real-items.mjs)
//  WordNet 3.1 © 2011 Princeton University. Used under the WordNet license
//  (permission to use, copy, modify and distribute without fee; see node_modules/wordnet-db/LICENSE).
// ============================================================================
CORE_DATA.push(\`
${lines.join('\n')}
\`);
`;
fs.writeFileSync(path.join(dir, '05c_data_real.js'), out);
const byCat = {}; for (const off of offs) { const c = chosen.get(off); if (item.get(off) && item.get(off).gen) byCat[c.cat] = (byCat[c.cat] || 0) + 1; }
console.log(`wrote ${gen.length} real items`, JSON.stringify(byCat), `${(out.length / 1024).toFixed(0)} KB`);
