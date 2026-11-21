// ============================================================================
//  ELEMENTAL LAB — 25 · Boot & main loop (+ a small debug API on window.lab)
// ============================================================================

async function boot() {
  const msg = $('load-msg');
  const frame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
  msg.textContent = 'Generating 300,000+ items…';
  await frame();
  Universe.build();
  msg.textContent = `Universe ready: ${fmtInt(Universe.totalCount)} items. Building the lab…`;
  await frame();

  const canvas = G.canvas = $('c');
  const renderer = G.renderer = new THREE.WebGLRenderer({ canvas, antialias: !Q().post, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q().pixelRatio));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = G.scene = new THREE.Scene();
  const camera = G.camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.05, 400);
  camera.rotation.order = 'YXZ';

  Tex.init(); EmojiAtlas.init();
  Phys.init();
  Reflector.init();
  Room.build(scene, renderer);
  Particles.init(scene); Labels.init(scene); Glows.init(scene); Rings.init(scene); ProgressRing.init(scene);
  Player.init();
  Post.init(renderer);
  await Save.load();
  Displays.init();
  Save.restoreWorld();
  UI.init(); Codex.init(); Input.init(canvas); Touch.init(); Daily.init(); Fun.init(); Horror.init();
  // a few starter elements on the table so the first smash is one grab away
  if (Progress.order.length <= 4) {
    [['water', -0.55], ['fire', 0.55]].forEach(([id, x]) => spawnItem(id, new THREE.Vector3(x, LAYOUT.table.top + 0.3, 0.25), { noPop: true }));
  }
  const resize = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    const s = renderer.getDrawingBufferSize(new THREE.Vector2());
    Reflector.resize(s.x, s.y);
    Post.resize(renderer);
  };
  window.addEventListener('resize', resize);
  window.addEventListener('pagehide', () => { if (Save.dirty) Save.save(); });
  G.onResize = resize;
  resize();
  Player.update(0);
  // warm up shaders so the first frames don't hitch
  renderer.compile(scene, camera);
  $('loading').classList.add('hidden');
  UI.showMenu(false);
  if (Progress.order.length > 4) $('btn-play').textContent = 'Continue';
  let last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    const rdt = Math.min(0.05, Math.max(0.0005, (now - last) / 1000));
    last = now;
    try { tick(rdt); } catch (e) { showError(e.stack || e.message); throw e; }
  };
  requestAnimationFrame(loop);
}

const DynRes = {
  acc: 0, n: 0, scale: 1,
  update(rdt) {
    this.acc += rdt; this.n++;
    if (this.acc < 1.5) return;
    const avg = this.acc / this.n; this.acc = 0; this.n = 0;
    const max = Math.min(window.devicePixelRatio || 1, Q().pixelRatio);
    let pr = G.renderer.getPixelRatio();
    if (avg > 1 / 50 && pr > 0.7) pr = Math.max(0.7, pr - 0.15);
    else if (avg < 1 / 70 && pr < max) pr = Math.min(max, pr + 0.1);
    else return;
    G.renderer.setPixelRatio(pr);
    G.onResize && G.onResize();
  },
};

function tick(rdt, render = true) {
  const dt = rdt * G.timeScale;
  G.rtime += rdt; G.time += dt; G.frame++;
  uTime.value = G.time;
  Player.update(rdt);
  Phys.step(dt);
  for (const e of G.entities) { e.sync(); e.animate(dt); }
  Crafting.update(dt);
  Displays.update(dt); Trophies.update(dt); Room.update(dt);
  Tweens.update(dt);
  Particles.update(dt); Glows.update(rdt); Rings.update(rdt);
  G.lookTarget = G.locked && !G.ui ? pickTarget(REACH, Player.held) : null;
  Labels.update();
  UI.update(rdt);
  Touch.update();
  Fun.update(rdt); Horror.update(rdt);
  EmojiAtlas.flush();
  if (!render) { Save.update(rdt); Input.endFrame(); return; }
  const r = G.renderer, cam = G.camera;
  pointUniforms.uScale.value = r.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
  if (Q().reflection && (Settings.quality === 'high' || G.frame % 2 === 0)) Reflector.update(r, G.scene, cam);
  Post.render(r, G.scene, cam, rdt);
  Save.update(rdt);
  if (G.started && !document.hidden) DynRes.update(rdt);
  Input.endFrame();
}

// ---------------------------------------------------------------- debug / automation API
window.lab = {
  THREE, G, Universe, Progress, Settings, Codex, UI, Crafting, Player, Book, Hints, Save, Daily, Horror,
  spawn(id, x = 0, z = 0.2) { return spawnItem(id, new THREE.Vector3(x, LAYOUT.table.top + 0.4, z), { touched: true }); },
  combine(a, b) { const r = Universe.combine(a, b); return r && { ...r, name: Universe.get(r.id).name }; },
  merge(a, b) { Crafting.merge(a, b, 'force'); },
  look(yaw, pitch) { Player.yaw = yaw; Player.pitch = pitch; },
  teleport(x, z) { Player.body.position.set(x, 0.05, z); Player.body.velocity.set(0, 0, 0); },
  /** advance the simulation by n fixed 60 Hz frames without rendering (for automated tests) */
  step(n = 60) { for (let i = 0; i < n; i++) tick(1 / 60, false); },
  play() { G.debugNoLock = true; Sound.init(); UI.start(); G.locked = true; G.ui = null; },
  discoverRandom(n = 1000) {
    const rng = makeRng(42);
    let added = 0;
    for (let i = 0; i < n * 3 && added < n; i++) {
      const base = Universe.items[Math.floor(rng() * Universe.items.length)];
      let id = base.id;
      const r = rng();
      if (r < 0.8 && base.applicableMods.length) {
        const m1 = MODIFIER_DEFS[base.applicableMods[Math.floor(rng() * base.applicableMods.length)]].id;
        const m2 = MODIFIER_DEFS[base.applicableMods[Math.floor(rng() * base.applicableMods.length)]].id;
        id = Universe.makeModId(base.id, r < 0.35 && Universe.modsValid(base, [m1, m2]) ? [m1, m2] : [m1]);
      } else if (r < 0.95) { const o = Universe.items[Math.floor(rng() * Universe.items.length)]; if (o !== base) id = `x:${o.id}:${base.id}`; }
      if (!Universe.isValidId(id) || Progress.disc.has(id)) continue;
      Progress.disc.set(id, Progress.order.length); Progress.order.push(id); added++;
    }
    Codex.dirty = true; UI.updateHud(); Save.markDirty();
    return added;
  },
};

boot();
