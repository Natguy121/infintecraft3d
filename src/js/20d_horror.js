// ============================================================================
//  ELEMENTAL LAB — 20d · Horror atmosphere: flashlight, flickering lights,
//  blackouts, a watcher in the dark, whispers, heartbeat and wall messages
// ============================================================================

const Horror = {
  on: false, hemi: 0.62, sun: 2.7, light: null, figure: null, next: 8, fig: 0, black: 0, beat: 0,
  msgs: ['IT SEES YOU', 'DON\'T TURN AROUND', 'KEEP CRAFTING', 'YOU ARE NOT ALONE', 'LOOK BEHIND THE WALL', 'IT IS CLOSER'],

  init() {
    const L = this.light = new THREE.SpotLight(0xfff1d6, 26, 38, 0.42, 0.55, 1.6);
    G.scene.add(L, L.target);
    const am = new THREE.PointLight(0xffd9b0, 0.9, 4, 2); G.scene.add(am); this.aura = am;
    // the watcher: a tall, thin silhouette with two red eyes
    const g = this.figure = new THREE.Group();
    const dark = new THREE.MeshBasicMaterial({ color: 0x000000, fog: false });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 2.3, 8), dark); body.position.y = 1.15;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), dark); head.position.y = 2.5; head.scale.y = 1.25;
    const eyeM = new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.1, 0.05), fog: false });
    for (const x of [-0.08, 0.08]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), eyeM); e.position.set(x, 2.55, 0.19); g.add(e); }
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.9, 5), dark); a.position.set(0.3 * s, 1.35, 0); a.rotation.z = 0.08 * s; g.add(a); }
    g.add(body, head); g.visible = false; G.scene.add(g);
    this.apply(Settings.theme === 'horror');
  },

  apply(on) {
    this.on = on;
    document.body.classList.toggle('horror', on);
    const S = G.scene, Rm = Room;
    if (!this.env) this.env = S.environment;
    S.environment = on ? null : this.env;
    S.background = new THREE.Color(on ? 0x030305 : 0xeef0f4);
    S.fog = on ? new THREE.FogExp2(0x050407, 0.045) : new THREE.Fog(0xeef0f4, 45, 150);
    Rm.hemi.color.setHex(on ? 0x6a7090 : 0xf4f7ff); Rm.hemi.groundColor.setHex(on ? 0x1a0e0e : 0xc9ced8);
    Rm.sun.color.setHex(on ? 0x9aa6ff : 0xfffaf2);
    this.hemi = on ? 0.12 : 0.62; this.sun = on ? 0.35 : 2.7;
    Rm.floorMat.color.setHex(on ? 0x3a3a40 : 0xe4e8ee); Rm.floorMat.envMapIntensity = on ? 0.05 : 0.35;
    Rm.wallMat.color.setHex(on ? 0x4a4440 : 0xf3f5f9); Rm.wallMat.envMapIntensity = on ? 0.05 : 0.35;
    if (Progress.wallHue != null) Rm.setWallHue(Progress.wallHue);
    const cm = Rm.ceil.material; cm.color.setHex(on ? 0x1a1a1e : 0xf2f4f8); cm.emissive.setHex(on ? 0x000000 : 0xc8ccd6);
    Rm.board.material.color.setScalar(on ? 0.22 : 1);
    Rm.group.traverse(o => { if (o.userData.panel) o.visible = !on; });
    this.light.visible = this.aura.visible = on;
    this.black = 0; this.figure.visible = false;
    if (!on) { const m = $('horror-msg'); m && m.classList.remove('on'); }
  },

  sound(kind) {
    const S = typeof Sound !== 'undefined' ? Sound : null;
    if (!S || !S.ctx || S.muted) return;
    try {
      if (kind === 'whisper') for (let i = 0; i < 6; i++) S.noiseBurst(0.12 + Math.random() * 0.2, { vol: 0.05, type: 'bandpass', freq: 1800 + Math.random() * 2500, delay: i * 0.18, verb: 0.9 });
      else if (kind === 'beat') { S.tone(52, 0.18, { vol: 0.5, glide: 38, verb: 0.1 }); S.tone(48, 0.2, { vol: 0.4, glide: 35, delay: 0.24, verb: 0.1 }); }
      else if (kind === 'sting') { S.tone(1244, 1.2, { type: 'sawtooth', vol: 0.06, glide: 1180, verb: 0.8 }); S.tone(1318, 1.2, { type: 'sawtooth', vol: 0.06, verb: 0.8 }); S.noiseBurst(0.6, { vol: 0.12, type: 'lowpass', freq: 400, verb: 0.6 }); }
      else if (kind === 'buzz') S.tone(120, 0.08, { type: 'square', vol: 0.03, verb: 0.2 });
    } catch (e) { /* audio optional */ }
  },

  say(text) {
    const m = $('horror-msg'); if (!m) return;
    m.textContent = text; m.classList.add('on');
    clearTimeout(this._mt); this._mt = setTimeout(() => m.classList.remove('on'), 2600);
  },

  scare() {
    const v = $('horror-vig'); if (v) { v.classList.remove('pulse'); void v.offsetWidth; v.classList.add('pulse'); }
    this.sound('sting');
  },

  event() {
    const r = Math.random();
    if (r < 0.35) { this.black = 1.2 + Math.random() * 1.8; this.sound('buzz'); }
    else if (r < 0.7) this.showFigure();
    else if (r < 0.88) this.sound('whisper');
    else this.say(this.msgs[Math.floor(Math.random() * this.msgs.length)]);
  },

  showFigure() {
    const cam = G.camera, yaw = Player.yaw || 0;
    // appear somewhere in front-ish, out at the edge of the flashlight
    const a = yaw + Math.PI + (Math.random() - 0.5) * 1.6, d = 14 + Math.random() * 10;
    const x = clamp(cam.position.x - Math.sin(a + Math.PI) * d, LAYOUT.room.x0 + 2, LAYOUT.room.x1 - 2);
    const z = clamp(cam.position.z - Math.cos(a + Math.PI) * d, LAYOUT.room.z0 + 2, LAYOUT.room.z1 - 2);
    this.figure.position.set(x, 0, z); this.figure.visible = true; this.fig = 6; this.seen = 0;
  },

  update(dt) {
    if (!this.light || !G.camera || !this.on) return;
    const cam = G.camera, L = this.light;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    L.position.copy(cam.position).addScaledVector(fwd, 0.2).y -= 0.15;
    L.target.position.copy(cam.position).addScaledVector(fwd, 10);
    this.aura.position.copy(cam.position);
    // flicker + blackouts
    const flick = Math.random() < 0.02 ? 0.25 : 1;
    if (this.black > 0) { this.black -= dt; L.intensity = Math.random() < 0.06 ? 10 : 0; this.hemi = 0.0; this.sun = 0.0; }
    else { L.intensity = 26 * flick; this.hemi = 0.12 * (Math.random() < 0.03 ? 0.2 : 1); this.sun = 0.35; }
    if (!G.started || G.ui) return;
    this.next -= dt;
    if (this.next <= 0) { this.event(); this.next = 14 + Math.random() * 26; }
    // heartbeat speeds up while the watcher is out there
    this.beat -= dt;
    if (this.figure.visible && this.beat <= 0) { this.sound('beat'); this.beat = 0.8; }
    if (this.figure.visible) {
      const f = this.figure; f.lookAt(cam.position.x, 0, cam.position.z);
      this.fig -= dt;
      const to = new THREE.Vector3().subVectors(f.position, cam.position); to.y += 1.4;
      const dist = to.length(); to.normalize();
      if (to.dot(fwd) > 0.93) this.seen += dt;
      // stare at it and it vanishes… or it rushes you
      if (this.seen > 0.7) {
        if (Math.random() < 0.3) { f.position.lerp(cam.position, 0.75); f.position.y = 0; this.scare(); this.black = 0.6; }
        f.visible = false;
      } else if (this.fig <= 0 || dist < 4) f.visible = false;
    }
  },
};
