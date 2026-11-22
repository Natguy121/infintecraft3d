// Validates the procedural item universe in Node (no browser needed).
//   node tools/test-engine.mjs          → summary + warnings
//   node tools/test-engine.mjs --deep   → also random-pair fuzzing & inverse checks
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'src/js');
const files = fs.readdirSync(dir).filter(f => /^0\d[a-z]?_.*\.js$/.test(f)).sort();
const code = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n;\n') +
  '\n;globalThis.__U = { Universe, MODIFIER_DEFS, makeRng, pairKey, hashStr };';
const ctx = { console, performance, Math, Date, Map, Set, Uint32Array, JSON };
vm.createContext(ctx);
vm.runInContext(code, ctx, { filename: 'engine.js' });
const { Universe: U, MODIFIER_DEFS, makeRng } = ctx.__U;

U.build();
const deep = process.argv.includes('--deep');
let failures = 0;
const fail = (m) => { failures++; console.log('  ✗ ' + m); };

console.log(`Built universe in ${U.buildMs.toFixed(0)} ms`);
console.log(`Core items: ${U.items.length}   modifiers: ${MODIFIER_DEFS.length}   rules: ${U.rules.length}   multi: ${U.multiTable.size}`);
console.log(`Pair table: ${U.pairTable.size} pairs`);
const b = U.countBreakdown;
console.log(`Universe: ${U.totalCount.toLocaleString()} items  (core ${b.core}, 1-mod ${b.oneMod.toLocaleString()}, 2-mod ${b.twoMods.toLocaleString()}, composites ${b.composites.toLocaleString()})`);

if (U.warnings.length) {
  console.log(`\nWarnings (${U.warnings.length}):`);
  const show = process.argv.includes('--all') ? U.warnings : U.warnings.slice(0, 400);
  for (const w of show) console.log('  ! ' + w);
}

// tiers / rarity distribution
const tiers = new Array(11).fill(0), rar = new Array(6).fill(0);
for (const it of U.items) { tiers[it.tier]++; rar[it.rarity]++; }
console.log('\nTier distribution :', tiers.join(' '));
console.log('Rarity distribution:', rar.join(' '), '  maxDepth', U.maxDepth);

// recipe counts per core item
let under5 = [], under20common = 0, total = 0, commonN = 0;
for (const it of U.items) {
  if (it.depth === 0) continue;
  const n = (U.reverse.get(it.id) || []).length + U.multiRecipesFor(it.id).length;
  total += n;
  if (n < 5) under5.push(`${it.name}(${n})`);
  if (it.rarity === 0) { commonN++; if (n < 20) under20common++; }
}
console.log(`Avg recipes / core item: ${(total / (U.items.length - 4)).toFixed(1)}   under 5: ${under5.length}   common under 20: ${under20common}/${commonN}`);
if (under5.length) console.log('  under 5:', under5.slice(0, 80).join(', '));

// sample recipes
for (const name of ['steam', 'mud', 'tree', 'human', 'dragon', 'robot', 'galaxy']) {
  const r = U.reverse.get(name) || [];
  console.log(`  ${name.padEnd(8)} ${r.length.toString().padStart(3)}: ${r.slice(0, 12).map(k => k.replace('|', '+')).join(', ')}`);
}

// secrets
for (const it of U.items.filter(i => i.secret)) {
  console.log(`  secret ${it.name} (${it.secret}) tier ${it.tier}: ${(U.reverse.get(it.id) || []).slice(0, 4).join(', ')}`);
}

// examples of the forward engine
const ex = [['water', 'fire'], ['ice', 'dragon'], ['dragon', 'gold'], ['lava', 'lake'], ['fire', 'whale'], ['ice-cream', 'volcano'],
  ['zombie', 'pizza'], ['cosmic-egg', 'whale'], ['dragon', 'dragon'], ['dragon~frozen', 'gold'], ['water~golden', 'fire'],
  ['robot', 'love'], ['time', 'sword'], ['pizza', 'burger'], ['cat', 'shark'], ['galaxy', 'god']];
console.log('\nExamples:');
for (const [x, y] of ex) {
  const r = U.combine(x, y);
  const nm = (id) => U.get(id) ? U.get(id).name : '??' + id;
  console.log(`  ${nm(x)} + ${nm(y)} = ${r ? nm(r.id) + '  [' + r.how + ']  ' + r.id : 'null'}`);
}

if (deep) {
  console.log('\nFuzzing random pairs…');
  const rng = makeRng(12345);
  const hows = {};
  const t0 = performance.now();
  const N = 30000;
  const results = [];
  for (let i = 0; i < N; i++) {
    const a = U.randomId(rng), bb = U.randomId(rng);
    if (!U.isValidId(a)) { fail('randomId invalid ' + a); continue; }
    const r = U.combine(a, bb);
    if (!r) { fail(`null result ${a}+${bb}`); continue; }
    if (!U.isValidId(r.id)) { fail(`invalid result id ${r.id} from ${a}+${bb}`); continue; }
    const r2 = U.combine(bb, a);
    if (r2.id !== r.id) fail(`asymmetric ${a}+${bb}`);
    hows[r.how] = (hows[r.how] || 0) + 1;
    if (i < 40) results.push(`${U.get(a).name} + ${U.get(bb).name} = ${U.get(r.id).name} [${r.how}]`);
    const info = U.get(r.id);
    if (!info || !info.name || !info.emoji) fail('bad info ' + r.id);
  }
  console.log(`  ${N} combos in ${(performance.now() - t0).toFixed(0)} ms`, JSON.stringify(hows));
  for (const s of results) console.log('   ' + s);

  console.log('\nInverse checks on random items…');
  const rng2 = makeRng(999);
  let few = 0, checked = 0, totalR = 0;
  const t1 = performance.now();
  for (let i = 0; i < 400; i++) {
    const id = U.randomId(rng2);
    const recs = U.recipesFor(id);
    checked++; totalR += recs.length;
    for (const k of recs.slice(0, 6)) {
      const [x, y] = k.split('|');
      const r = U.combine(x, y);
      if (!r || r.id !== id) fail(`inverse mismatch ${k} -> ${r && r.id} expected ${id}`);
    }
    if (recs.length < 5) { few++; if (few < 12) console.log(`   few recipes (${recs.length}): ${U.get(id).name} [${id}]`); }
  }
  console.log(`  ${checked} items, avg ${(totalR / checked).toFixed(1)} recipes, ${few} with <5, ${(performance.now() - t1).toFixed(0)} ms`);
}

console.log(failures ? `\n${failures} FAILURES` : '\nOK');
process.exit(failures ? 1 : 0);
