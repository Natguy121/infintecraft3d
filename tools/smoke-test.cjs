// Headless smoke test: loads the built game, plays a few scripted actions and
// writes screenshots.  Usage:  node tools/smoke-test.cjs [outDir]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const out = process.argv[2] || path.join(__dirname, '..', 'screenshots');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  const file = 'file://' + path.join(__dirname, '..', 'elemental-lab.html');
  const t0 = Date.now();
  await page.goto(file);
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('hidden'), null, { timeout: 120000 });
  console.log('loaded in', Date.now() - t0, 'ms');
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, '01-menu.png') });
  await page.evaluate(() => { lab.play(); });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(out, '02-lab.png') });
  const info = await page.evaluate(async () => {
    const r = {};
    r.examples = [['water', 'fire'], ['earth', 'fire'], ['ice', 'dragon'], ['zombie', 'pizza']].map(([a, b]) => lab.combine(a, b));
    // spawn a bunch of varied items in front of the player
    const ids = ['dragon', 'robot', 'galaxy', 'pizza', 'castle', 'car', 'tree', 'whale', 'sword', 'potion~cosmic', 'x:fire:whale', 'dragon~frozen~golden', 'phoenix', 'unicorn', 'volcano', 'computer', 'wizard', 'cake'];
    ids.forEach((id, i) => lab.spawn(id, -2.2 + (i % 9) * 0.55, i < 9 ? 0.05 : 0.42));
    await new Promise(r => setTimeout(r, 1200));
    // force a merge between the starter water and fire
    const w = lab.G.entities.find(e => e.id === 'water'), f = lab.G.entities.find(e => e.id === 'fire');
    if (w && f) lab.merge(w, f);
    await new Promise(r => setTimeout(r, 900));
    r.entities = lab.G.entities.length;
    r.discovered = lab.Progress.order.length;
    return r;
  });
  console.log(JSON.stringify(info, null, 1));
  await page.screenshot({ path: path.join(out, '03-items.png') });
  await page.evaluate(() => { lab.look(Math.PI, -0.05); lab.teleport(0, -1.8); });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, '04-shelf.png') });
  await page.evaluate(() => { lab.look(0, -0.1); lab.teleport(0, 2.1); lab.discoverRandom(5000); lab.Codex.open(); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(out, '05-codex.png') });
  const fps = await page.evaluate(() => document.getElementById('fps').textContent);
  console.log('fps (swiftshader):', fps);
  console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].slice(0, 30).join('\n') : 'no console errors');
  await browser.close();
})();
