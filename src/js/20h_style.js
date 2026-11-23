// ============================================================================
//  ELEMENTAL LAB — 20h · Character skins and extra themes
// ============================================================================

// ---------------------------------------------------------------- skins
const SKIN_OPTS = {
  skin: [0xf6d8c0, 0xf1c9a5, 0xe0ac84, 0xc68863, 0x9c6644, 0x6e4a32, 0x8ad08a, 0x9ab8ff, 0xffc83a],
  hair: [0x1a1a1a, 0x4a2f1c, 0x8a5a2a, 0xd8b064, 0xa83a1c, 0xe8e8e8, 0xff5ab0, 0x3ab0ff],
  hairStyle: ['Short', 'Long', 'Bun', 'Buzz'],
  shirt: [0x3a6ea8, 0xb83a3a, 0x2f8a5a, 0xe8e8ea, 0x2a2a30, 0xe89a2a, 0x7a4ab8, 0xff7ab8],
  pants: [0x2a3a5a, 0x2a2a2e, 0x5a4a3a, 0x3a4a3a, 0x8a8a9a, 0x7a2a2a],
  hat: ['None', 'Cap', 'Top hat', 'Crown', 'Wizard', 'Beanie', 'Cowboy', '😇 Halo', '🏴‍☠️ Pirate', '⚔️ Viking', '🥳 Party'],
};
const Skins = {
  look() {
    const L = Settings.look || {};
    return { skin: L.skin ?? 0xf1c9a5, hair: L.hair ?? 0x4a2f1c, hairStyle: L.hairStyle ?? 0, shirt: L.shirt ?? 0x3a6ea8, pants: L.pants ?? 0x2a3a5a, hat: L.hat ?? 0 };
  },
  init() {
    const p = el('div'); p.id = 'skin-panel'; p.className = 'hidden';
    p.innerHTML = `<div class="acct-card"><button class="x" id="skin-close">✕</button><h2>🧍 Your character</h2>
      <p class="acct-note">This is how other players see you in multiplayer (and the colour of your hands).</p>
      <canvas id="skin-prev" width="300" height="300"></canvas><div id="skin-rows"></div></div>`;
    document.body.appendChild(p);
    $('skin-close').onclick = () => p.classList.add('hidden');
    const btn = el('button'); btn.id = 'btn-skin'; btn.textContent = '🧍 Character';
    $('btn-mp').after(btn);
    btn.onclick = () => { p.classList.remove('hidden'); this.renderRows(); this.preview(); };
  },
  set(k, v) { Settings.look = { ...this.look(), [k]: v }; saveSettings(); this.renderRows(); this.preview(); Hands.applyLook(); Net.sendLook && Net.sendLook(); },
  renderRows() {
    const L = this.look(), rows = $('skin-rows'); rows.innerHTML = '';
    const label = { skin: 'Skin', hair: 'Hair colour', hairStyle: 'Hairstyle', shirt: 'Shirt', pants: 'Trousers', hat: 'Hat' };
    for (const [k, opts] of Object.entries(SKIN_OPTS)) {
      const r = el('div'); r.className = 'skin-row'; r.innerHTML = `<b>${label[k]}</b><div class="sw"></div>`;
      opts.forEach((o, i) => {
        const b = el('button'); const isCol = typeof o === 'number';
        b.className = 'swatch' + ((isCol ? L[k] === o : L[k] === i) ? ' on' : '');
        if (isCol) { b.style.background = '#' + o.toString(16).padStart(6, '0'); b.title = label[k]; } else b.textContent = o;
        const lock = (k === 'hat' && i >= 7 && !Shop.has(SHOP.find(s => s.hat === i).id)) || (k === 'skin' && o === 0xffc83a && !Shop.has('skin-gold'));
        if (lock) { b.textContent = (isCol ? '' : o + ' ') + '🔒'; b.classList.add('locked'); }
        b.onclick = () => lock ? UI.toast('🔒', 'Buy it in the 🛒 Shop', '') : this.set(k, isCol ? o : i);
        r.querySelector('.sw').appendChild(b);
      });
      rows.appendChild(r);
    }
  },
  preview() {
    const cv = $('skin-prev');
    if (!this.pr) {
      this.pr = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true });
      this.ps = new THREE.Scene(); this.ps.add(new THREE.HemisphereLight(0xffffff, 0x888899, 1.2));
      const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(2, 3, 3); this.ps.add(d);
      this.pc = new THREE.PerspectiveCamera(30, 1, 0.1, 20); this.pc.position.set(0, 1.15, 4.2); this.pc.lookAt(0, 0.95, 0);
      const spin = () => { if (!$('skin-panel').classList.contains('hidden') && this.rig) { this.rig.root.rotation.y += 0.015; this.pr.render(this.ps, this.pc); } requestAnimationFrame(spin); };
      spin();
    }
    if (this.rig) this.ps.remove(this.rig.root);
    this.rig = buildPerson(1, this.look()); this.ps.add(this.rig.root);
  },
};

function addHat(head, hatIdx, mesh) {
  const M = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 });
  switch (hatIdx) {
    case 1: mesh(new THREE.SphereGeometry(0.125, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(0xd83a3a), 0, 0.05, 0, head); mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 18), M(0xd83a3a), 0, 0.05, 0.1, head).scale.set(1, 1, 0.9); break;
    case 2: mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.012, 20), M(0x1a1a1e), 0, 0.1, 0, head); mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 20), M(0x1a1a1e), 0, 0.2, 0, head); break;
    case 3: { const g = M(0xffc83a); g.metalness = 0.8; g.roughness = 0.25; mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 16, 1, true), g, 0, 0.13, 0, head); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; mesh(new THREE.ConeGeometry(0.02, 0.06, 6), g, Math.cos(a) * 0.1, 0.19, Math.sin(a) * 0.1, head); } break; }
    case 4: mesh(new THREE.ConeGeometry(0.14, 0.38, 18), M(0x4a3ab8), 0, 0.25, 0, head).rotation.z = 0.12; mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.012, 20), M(0x4a3ab8), 0, 0.07, 0, head); break;
    case 5: mesh(new THREE.SphereGeometry(0.128, 18, 10, 0, Math.PI * 2, 0, Math.PI / 1.9), M(0x2a8ad8), 0, 0.03, 0, head); mesh(new THREE.SphereGeometry(0.035, 10, 8), M(0xffffff), 0, 0.17, 0, head); break;
    case 6: mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.012, 22), M(0x8a5a2a), 0, 0.08, 0, head).scale.set(1, 1, 0.8); mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.12, 18), M(0x8a5a2a), 0, 0.15, 0, head); break;
    case 7: { const g = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.9, 0.8) }); mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 28), g, 0, 0.24, 0, head).rotation.x = Math.PI / 2; break; }
    case 8: mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 3), M(0x1a1a1e), 0, 0.1, 0, head); mesh(new THREE.SphereGeometry(0.11, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), M(0x1a1a1e), 0, 0.1, 0, head); mesh(new THREE.SphereGeometry(0.025, 8, 6), M(0xffffff), 0, 0.16, 0.1, head); break;
    case 9: mesh(new THREE.SphereGeometry(0.13, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), M(0x9a9aa4), 0, 0.04, 0, head).material.metalness = 0.7; for (const s of [-1, 1]) mesh(new THREE.ConeGeometry(0.03, 0.14, 8), M(0xf2ead8), s * 0.13, 0.12, 0, head).rotation.z = -s * 0.9; break;
    case 10: mesh(new THREE.ConeGeometry(0.08, 0.22, 16), M(0xff5ab0), 0, 0.2, 0, head); mesh(new THREE.SphereGeometry(0.025, 8, 6), M(0xffe85a), 0, 0.32, 0, head); break;
  }
}

// ---------------------------------------------------------------- themes beyond normal / horror
const THEMES = {
  underwater: { bg: 0x0a3a5a, fog: [0x0e4a6a, 0.028], wall: 0x2a6a8a, floor: 0xd8c890, hemi: [0x7ad0ff, 0x1a4a5a, 0.7], sun: [0x9ae0ff, 1.4], grav: -5.5, cls: 'underwater' },
  space: { bg: 0x02030a, fog: null, wall: 0x2a2e3a, floor: 0x3a3e4a, hemi: [0x8a9aff, 0x1a1a2a, 0.35], sun: [0xffffff, 2.2], grav: -2.4, cls: 'space' },
  candy: { bg: 0xffe4f2, fog: [0xffe4f2, 0.006], wall: 0xffb8dc, floor: 0xfff0a8, hemi: [0xfff0ff, 0xffc8e0, 0.8], sun: [0xfff4fa, 2.4], grav: -9.82, cls: 'candy' },
  blocky: { bg: 0x8ac8ff, fog: [0x9ad0ff, 0.008], wall: 0x8a6a4a, floor: 0x6ab04a, hemi: [0xffffff, 0x8a8a8a, 0.8], sun: [0xffffff, 2.4], grav: -9.82, cls: 'blocky', pixel: true },
};
const Themes = {
  cur: 'normal', stars: null,
  apply(name) {
    Horror.apply(name === 'horror');
    for (const t of Object.values(THEMES)) document.body.classList.remove('th-' + t.cls);
    const T = THEMES[name];
    Phys.world.gravity.set(0, T ? T.grav : -9.82, 0);
    if (this.stars) this.stars.visible = false;
    if (G.renderer) G.renderer.domElement.style.imageRendering = T && T.pixel ? 'pixelated' : '';
    if (G.renderer) G.renderer.setPixelRatio(T && T.pixel ? 0.28 : Math.min(window.devicePixelRatio || 1, Q().pixelRatio));
    this.cur = name;
    if (T) {
      document.body.classList.add('th-' + T.cls);
      const S = G.scene, Rm = Room;
      S.background = new THREE.Color(T.bg);
      S.fog = T.fog ? new THREE.FogExp2(T.fog[0], T.fog[1]) : null;
      Rm.wallMat.color.setHex(T.wall); Rm.floorMat.color.setHex(T.floor);
      Rm.hemi.color.setHex(T.hemi[0]); Rm.hemi.groundColor.setHex(T.hemi[1]); Horror.hemi = T.hemi[2];
      Rm.sun.color.setHex(T.sun[0]); Horror.sun = T.sun[1];
      Rm.ceil.visible = name !== 'space'; Rm.group.traverse(o => { if (o.userData.panel) o.visible = name !== 'space'; });
      if (name === 'space') this.starfield();
    } else { Room.ceil.visible = true; }
    if (G.onResize) G.onResize();
  },
  starfield() {
    if (!this.stars) {
      const n = 3000, pos = new Float32Array(n * 3), rng = makeRng(5);
      for (let i = 0; i < n; i++) { const u = rng() * 2 - 1, a = rng() * Math.PI * 2, r = 300; pos[i * 3] = Math.sqrt(1 - u * u) * Math.cos(a) * r; pos[i * 3 + 1] = Math.abs(u) * r; pos[i * 3 + 2] = Math.sqrt(1 - u * u) * Math.sin(a) * r; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this.stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, fog: false }));
      G.scene.add(this.stars);
    }
    this.stars.visible = true;
  },
  update(dt) {
    if (this.cur === 'underwater' && Math.random() < dt * 14) {
      const c = G.camera.position;
      Particles.emit({ add: false, pos: new THREE.Vector3(c.x + (Math.random() - 0.5) * 16, 0.2, c.z + (Math.random() - 0.5) * 16), color: 0xcfefff, count: 1, speed: 0.2, up: 1.6, size: 0.05, sizeEnd: 0.09, life: 4, alpha: 0.6 });
      Room.sun.intensity = 1.3 + Math.sin(G.time * 3) * 0.15;
    }
    if (this.cur === 'space' && this.stars) this.stars.position.copy(G.camera.position);
  },
};
