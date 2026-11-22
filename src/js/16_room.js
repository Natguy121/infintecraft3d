// ============================================================================
//  ELEMENTAL LAB — 16 · The white lab: lighting, environment map, reflective
//  floor, crafting table, element pedestals, Fusion Ring, spawn pad, trash
//  bin and the Discovery Shelf.
// ============================================================================

const Reflector = {
  rt: null, cam: new THREE.PerspectiveCamera(), matrix: new THREE.Matrix4(),
  uniforms: { tReflect: { value: null }, uReflectMatrix: { value: new THREE.Matrix4() }, uReflectStrength: { value: 1 } },
  init() {
    this.rt = new THREE.WebGLRenderTarget(512, 512, { type: THREE.HalfFloatType, samples: 0 });
    this.uniforms.tReflect.value = this.rt.texture;
  },
  resize(w, h) { this.rt.setSize(Math.max(64, Math.floor(w * 0.5)), Math.max(64, Math.floor(h * 0.5))); },
  update(renderer, scene, camera) {
    const c = this.cam;
    c.position.set(camera.position.x, -camera.position.y, camera.position.z);
    _v1.set(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
    _v1.y = -_v1.y;
    _v2.set(0, 1, 0).applyQuaternion(camera.quaternion); _v2.y = -_v2.y;
    c.up.copy(_v2); c.lookAt(_v1);
    c.projectionMatrix.copy(camera.projectionMatrix);
    c.updateMatrixWorld();
    c.matrixWorldInverse.copy(c.matrixWorld).invert();
    this.matrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.matrix.multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
    this.uniforms.uReflectMatrix.value.copy(this.matrix);
    const hidden = [Room.floor, Labels.sys, ProgressRing.mesh];
    for (const h of hidden) if (h) h.visible = false;
    const prevRT = renderer.getRenderTarget(), shadowAuto = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(scene, c);
    renderer.setRenderTarget(prevRT);
    renderer.shadowMap.autoUpdate = shadowAuto;
    Room.floor.visible = true; Labels.sys.visible = true;
  },
};

function labelPlane(text, w, h, opts = {}) {
  const tex = Tex.text(text, { w: 1024, h: Math.round(1024 * h / w), font: opts.font || '900 70px', color: opts.color || '#2b3245', bg: opts.bg, glow: opts.glow, sub: opts.sub });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: opts.toneMapped ?? true, depthWrite: false }));
  if (opts.bright) m.material.color.setScalar(opts.bright);
  return m;
}

const Room = {
  group: null, floor: null, wallMat: null, glowSpots: [], pedLights: [], ringParts: null, discoLights: [], shelfSlots: [],
  build(scene, renderer) {
    const g = this.group = new THREE.Group();
    scene.add(g);
    const R = LAYOUT.room;
    const W = R.x1 - R.x0, D = R.z1 - R.z0, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
    scene.background = new THREE.Color(0xeef0f4);
    scene.fog = new THREE.Fog(0xeef0f4, 45, 150);

    // ---- environment map (soft studio box) for reflections on metal/glass
    const env = new THREE.Scene();
    const envBox = new THREE.Mesh(new THREE.BoxGeometry(W, R.h, D), new THREE.MeshBasicMaterial({ color: 0xdfe3ea, side: THREE.BackSide }));
    envBox.position.set(cx, R.h / 2, cz); env.add(envBox);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5, 5.2), side: THREE.DoubleSide }));
      p.rotation.x = Math.PI / 2; p.position.set(-45 + i * 30, R.h - 0.05, -45 + j * 30); env.add(p);
    }
    const envFloor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ color: 0x9aa0aa }));
    envFloor.rotation.x = -Math.PI / 2; envFloor.position.set(cx, 0.01, cz); env.add(envFloor);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(env, 0.03).texture;
    pmrem.dispose();

    // ---- lights
    const hemi = new THREE.HemisphereLight(0xf4f7ff, 0xc9ced8, 0.62);
    scene.add(hemi);
    const sun = this.sun = new THREE.DirectionalLight(0xfffaf2, 2.7);
    sun.position.set(13, 37, 17);
    sun.target.position.set(0, 0, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(Q().shadow, Q().shadow);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 70 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025; sun.shadow.radius = 3;
    scene.add(sun, sun.target);
    this.hemi = hemi;

    // ---- floor with planar reflection
    const floorTex = Tex.floor(); floorTex.repeat.set(W / 4, D / 4);
    const floorMat = this.floorMat = new THREE.MeshStandardMaterial({ map: floorTex, color: 0xe4e8ee, roughness: 0.34, metalness: 0, envMapIntensity: 0.35 });
    if (Q().reflection) {
      floorMat.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, Reflector.uniforms);
        sh.vertexShader = 'uniform mat4 uReflectMatrix;\nvarying vec4 vReflUv;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvReflUv = uReflectMatrix * (modelMatrix * vec4(transformed, 1.0));');
        sh.fragmentShader = 'uniform sampler2D tReflect;\nuniform float uReflectStrength;\nvarying vec4 vReflUv;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
          { vec2 ruv = vReflUv.xy / vReflUv.w; vec2 px = vec2(0.0025, 0.0035);
            vec3 rc = texture2D(tReflect, ruv).rgb * 0.4 + (texture2D(tReflect, ruv + px).rgb + texture2D(tReflect, ruv - px).rgb + texture2D(tReflect, ruv + vec2(px.x, -px.y)).rgb) * 0.2;
            float fr = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.5);
            outgoingLight = mix(outgoingLight, rc, (0.07 + 0.3 * fr) * uReflectStrength); }
          #include <opaque_fragment>`);
      };
    }
    const floor = this.floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(cx, 0, cz); floor.receiveShadow = true;
    g.add(floor);

    // ---- walls & ceiling
    const wallTex = Tex.wall(); wallTex.repeat.set(4, 1.4);
    this.wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.92, color: 0xf3f5f9, envMapIntensity: 0.35 });
    const wall = (w, h, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.wallMat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); return m; };
    wall(W, R.h, cx, R.h / 2, R.z0, 0);
    wall(W, R.h, cx, R.h / 2, R.z1, Math.PI);
    wall(D, R.h, R.x0, R.h / 2, cz, Math.PI / 2);
    // east wall has a big doorway out to the island
    const DW = 8, DH = 7;
    wall((D - DW) / 2, R.h, R.x1, R.h / 2, R.z0 + (D - DW) / 4, -Math.PI / 2);
    wall((D - DW) / 2, R.h, R.x1, R.h / 2, R.z1 - (D - DW) / 4, -Math.PI / 2);
    wall(DW, R.h - DH, R.x1, DH + (R.h - DH) / 2, cz, -Math.PI / 2);
    for (const s of [1, -1]) { const sign = labelPlane('🏝️ ISLAND', 8, 1.6, { font: '900 90px', color: '#1aa08a' }); sign.position.set(R.x1 - 0.05 * s, DH + 1.4, cz); sign.rotation.y = -Math.PI / 2 * s; g.add(sign); }
    const ceil = this.ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 1, emissive: 0xc8ccd6, emissiveIntensity: 0.55 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.set(cx, R.h, cz); g.add(ceil);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.6, 1.65), fog: false }));
      p.rotation.x = Math.PI / 2; p.position.set(-45 + i * 30, R.h - 0.02, -45 + j * 30); p.userData.panel = true; g.add(p);
    }
    // freestanding partition behind the Discovery Shelf (the room walls are far away now)
    const part = new THREE.Mesh(new THREE.BoxGeometry(14, 4.2, 0.2), this.wallMat);
    part.position.set(0, 2.1, LAYOUT.shelf.wallZ - 0.1); part.castShadow = part.receiveShadow = true; g.add(part);
    Phys.addStaticBox([0, 2.1, LAYOUT.shelf.wallZ - 0.1], [14, 4.2, 0.2]);
    const yard = labelPlane('BIG ITEM YARD', 9, 1.3, { font: '900 90px', color: '#7a5cff' });
    yard.position.set(0, 3.2, LAYOUT.shelf.wallZ - 0.21); yard.rotation.y = Math.PI; g.add(yard);
    const yard2 = labelPlane('← walk around the wall to see your big creations →', 12, 0.8, { font: '700 60px', color: '#6b7388' });
    yard2.position.set(0, 4.6, LAYOUT.shelf.wallZ + 0.02); g.add(yard2);
    // baseboards
    const bb = new THREE.MeshStandardMaterial({ color: 0xe3e7ee, roughness: 0.6 });
    for (const [w, x, z, ry] of [[W, cx, R.z0 + 0.01, 0], [W, cx, R.z1 - 0.01, Math.PI], [D, R.x0 + 0.01, cz, Math.PI / 2], [D, R.x1 - 0.01, cz, -Math.PI / 2]]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.02), bb); m.position.set(x, 0.06, z); m.rotation.y = ry; g.add(m);
    }
    // static colliders
    Phys.addStaticBox([cx, -0.5, cz], [W, 1, D]);
    Phys.addStaticBox([cx, R.h + 0.5, cz], [W, 1, D]);
    Phys.addStaticBox([cx, R.h / 2, R.z0 - 0.5], [W + 2, R.h, 1]);
    Phys.addStaticBox([cx, R.h / 2, R.z1 + 0.5], [W + 2, R.h, 1]);
    Phys.addStaticBox([R.x0 - 0.5, R.h / 2, cz], [1, R.h, D + 2]);
    Phys.addStaticBox([R.x1 + 0.5, R.h / 2, R.z0 + (D - 8) / 4 - 0.5], [1, R.h, (D - 8) / 2 + 1]);
    Phys.addStaticBox([R.x1 + 0.5, R.h / 2, R.z1 - (D - 8) / 4 + 0.5], [1, R.h, (D - 8) / 2 + 1]);
    Phys.addStaticBox([R.x1 + 0.5, 7 + (R.h - 7) / 2, cz], [1, R.h - 7, 8]);
    Island.build(g);

    // wall decor: title + "periodic" board
    const title = labelPlane('ELEMENTAL LAB', 40, 6.1, { font: '900 86px', color: '#4a3fd6', glow: 'rgba(122,107,255,0.6)' });
    title.position.set(R.x0 + 0.05, 26, 0); title.rotation.y = Math.PI / 2; g.add(title);
    const sub = labelPlane('Combine · Discover · Repeat', 30, 3, { font: '700 54px', color: '#6b7388' });
    sub.position.set(R.x0 + 0.05, 20, 0); sub.rotation.y = Math.PI / 2; g.add(sub);
    const board = this.board = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 512, (c, w, h) => {
      c.fillStyle = '#fbfcfe'; roundRect(c, 4, 4, w - 8, h - 8, 30); c.fill(); c.strokeStyle = '#dfe3ea'; c.lineWidth = 6; c.stroke();
      c.fillStyle = '#2b3245'; c.font = '900 44px ui-rounded, system-ui'; c.fillText('THE FOUR ELEMENTS', 50, 80);
      const els = [['💨', 'Air', '#9fd8ff'], ['🔥', 'Fire', '#ff7a2a'], ['🌍', 'Earth', '#b08850'], ['💧', 'Water', '#2f8cff']];
      els.forEach(([e, n, col], i) => { const x = 50 + i * 235; c.fillStyle = col; c.globalAlpha = 0.18; roundRect(c, x, 120, 210, 230, 24); c.fill(); c.globalAlpha = 1; c.font = `110px ${EMOJI_FONT}`; c.fillText(e, x + 45, 270); c.fillStyle = '#2b3245'; c.font = '800 38px ui-rounded, system-ui'; c.fillText(n, x + 60, 335); });
      c.fillStyle = '#6b7388'; c.font = '600 30px ui-rounded, system-ui'; c.fillText('Smash two things together, hold them touching, or press E.', 50, 430);
      c.fillText('3+ items? Drop them in the Fusion Ring.', 50, 475);
    }) }));
    board.position.set(5.1, 2.0, LAYOUT.shelf.wallZ + 0.01); board.rotation.y = 0; g.add(board);

    this.buildTable(g);
    this.buildPedestals(g, scene);
    this.buildRing(g, scene);
    this.buildPad(g);
    this.buildTrash(g);
    this.buildShelf(g);
    this.buildDisco(scene);
  },

  buildTable(g) {
    const T = LAYOUT.table;
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xfbfcfd, roughness: 0.25, clearcoat: 0.5, clearcoatRoughness: 0.2 });
    const top = new THREE.Mesh(roundedBoxGeo(0.12, 3), mat);
    top.scale.set(T.w, 0.08, T.d); top.position.set(0, T.top - 0.04, T.z); top.castShadow = top.receiveShadow = true; g.add(top);
    const legMat = new THREE.MeshStandardMaterial({ color: 0xd9dee7, roughness: 0.5 });
    for (const x of [-T.w / 2 + 0.25, T.w / 2 - 0.25]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, T.top - 0.08, T.d - 0.2), legMat);
      leg.position.set(x, (T.top - 0.08) / 2, T.z); leg.castShadow = leg.receiveShadow = true; g.add(leg);
      Phys.addStaticBox([x, (T.top - 0.08) / 2, T.z], [0.1, T.top - 0.08, T.d - 0.2]);
    }
    const strip = new THREE.Mesh(new THREE.BoxGeometry(T.w - 0.2, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 1.6, 2.2) }));
    strip.position.set(0, T.top - 0.05, T.z + T.d / 2 + 0.002); g.add(strip);
    Phys.addStaticBox([0, T.top - 0.16, T.z], [T.w, 0.32, T.d]); // thick so fast throws can't tunnel
  },

  buildPedestals(g, scene) {
    const baseMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, clearcoat: 1 });
    for (const P of LAYOUT.pedestals) {
      const x = P.x, z = LAYOUT.pedZ, y0 = LAYOUT.table.top;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.1, 32), baseMat);
      base.position.set(x, y0 + 0.05, z); base.castShadow = base.receiveShadow = true; g.add(base);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.color).multiplyScalar(2.2) }));
      ring.rotation.x = Math.PI / 2; ring.position.set(x, y0 + 0.102, z); g.add(ring);
      const holo = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.004, 6, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(P.color).multiplyScalar(1.4), transparent: true, opacity: 0.35, depthWrite: false }));
      holo.position.set(x, y0 + 0.36, z); g.add(holo);
      P.holo = holo;
      const lbl = labelPlane(P.label, 0.36, 0.09, { font: '900 80px', color: '#' + P.color.toString(16).padStart(6, '0'), toneMapped: false });
      lbl.position.set(x, y0 + 0.05, z + 0.185); g.add(lbl);
      Phys.addStaticBox([x, y0 + 0.05, z], [0.34, 0.1, 0.34]);
      this.glowSpots.push({ pos: new THREE.Vector3(x, y0 + 0.11, z), color: P.color, size: 0.6, alpha: 0.45, pulse: 2 + Math.random() });
      if (Q().pointLights) {
        const L = new THREE.PointLight(P.color, 0.9, 1.6, 2);
        L.position.set(x, y0 + 0.45, z); scene.add(L); this.pedLights.push(L);
      }
    }
  },

  buildRing(g, scene) {
    const { x, z, r } = LAYOUT.ring, y0 = LAYOUT.table.top;
    const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8a6aff).multiplyScalar(2.2) });
    const torus = new THREE.Mesh(new THREE.TorusGeometry(r, 0.022, 10, 72), ringMat);
    torus.rotation.x = Math.PI / 2; torus.position.set(x, y0 + 0.02, z); g.add(torus);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r - 0.01, 64), new THREE.MeshBasicMaterial({ color: 0x8a6aff, transparent: true, opacity: 0.12, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.set(x, y0 + 0.003, z); g.add(disc);
    const beamMat = new THREE.ShaderMaterial({
      uniforms: { uA: { value: 0.15 }, uTime, uC: { value: new THREE.Color(0x9a7aff) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform float uA; uniform float uTime; uniform vec3 uC; varying vec2 vUv; void main(){ float s = 0.6 + 0.4*sin(vUv.x*40.0 + uTime*3.0 + vUv.y*6.0); gl_FragColor = vec4(uC*1.6, (1.0 - vUv.y) * uA * s); }',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.9, 48, 1, true), beamMat);
    beam.position.set(x, y0 + 0.45, z); g.add(beam);
    const runes = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.022), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xc8a8ff).multiplyScalar(2) }));
      m.position.set(Math.cos(a) * (r + 0.06), 0, Math.sin(a) * (r + 0.06)); runes.add(m);
    }
    runes.position.set(x, y0 + 0.06, z); g.add(runes);
    const lbl = labelPlane('FUSION RING', 0.62, 0.1, { font: '900 74px', color: '#7a5cff', toneMapped: false });
    lbl.rotation.x = -Math.PI / 2; lbl.position.set(x, y0 + 0.004, z + r + 0.1); g.add(lbl);
    this.ringParts = { torus, beam, runes, ringMat };
    this.glowSpots.push(this.ringGlow = { pos: new THREE.Vector3(x, y0 + 0.05, z), color: 0x8a6aff, size: 1.6, alpha: 0.25, pulse: 1.5, mul: 1 });
    if (Q().pointLights) { const L = new THREE.PointLight(0x9a7aff, 0.8, 2, 2); L.position.set(x, y0 + 0.5, z); scene.add(L); this.ringLight = L; }
  },

  buildPad(g) {
    const P = LAYOUT.pad;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, P.top, 40), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, clearcoat: 0.6 }));
    pillar.position.set(P.x, P.top / 2, P.z); pillar.castShadow = pillar.receiveShadow = true; g.add(pillar);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.29, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x22c7e8).multiplyScalar(1.1) }));
    disc.rotation.x = -Math.PI / 2; disc.position.set(P.x, P.top + 0.002, P.z); g.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x22c7e8).multiplyScalar(2.2) }));
    ring.rotation.x = Math.PI / 2; ring.position.set(P.x, P.top + 0.01, P.z); g.add(ring);
    const lbl = labelPlane('CODEX PAD', 0.5, 0.12, { font: '900 80px', color: '#1aa8c8', toneMapped: false });
    lbl.position.set(P.x, P.top - 0.12, P.z + 0.345); g.add(lbl);
    Phys.addStaticCylinder([P.x, P.top / 2, P.z], 0.34, P.top);
    this.glowSpots.push(this.padGlow = { pos: new THREE.Vector3(P.x, P.top + 0.05, P.z), color: 0x22c7e8, size: 1.0, alpha: 0.35, pulse: 2.5, mul: 1 });
  },

  buildTrash(g) {
    const T = LAYOUT.trash;
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(T.r, T.r * 0.85, T.h, 40, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xf6f7f9, roughness: 0.3, clearcoat: 0.5, side: THREE.FrontSide }));
    outer.position.set(T.x, T.h / 2, T.z); outer.castShadow = true; g.add(outer);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(T.r - 0.015, T.r * 0.85 - 0.015, T.h, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a2630, roughness: 0.8, side: THREE.BackSide }));
    inner.position.copy(outer.position); g.add(inner);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(T.r * 0.84, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5a2a).multiplyScalar(1.4) }));
    bottom.rotation.x = -Math.PI / 2; bottom.position.set(T.x, 0.05, T.z); g.add(bottom);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(T.r, 0.02, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff6a3a).multiplyScalar(2.2) }));
    rim.rotation.x = Math.PI / 2; rim.position.set(T.x, T.h, T.z); g.add(rim);
    const lbl = labelPlane('TRASH', 0.4, 0.11, { font: '900 86px', color: '#ff5a2a', toneMapped: false });
    lbl.position.set(T.x, T.h * 0.55, T.z + T.r + 0.005); g.add(lbl);
    // walls as a ring of thin boxes so items fall inside
    for (let i = 0; i < 12; i++) {
      const a = i / 12 * Math.PI * 2;
      Phys.addStaticBox([T.x + Math.cos(a) * T.r * 0.95, T.h / 2, T.z + Math.sin(a) * T.r * 0.95], [0.04, T.h, T.r * 0.55], a);
    }
    Phys.addStaticBox([T.x, 0.03, T.z], [T.r * 1.6, 0.06, T.r * 1.6]);
    this.glowSpots.push({ pos: new THREE.Vector3(T.x, 0.3, T.z), color: 0xff5a2a, size: 0.9, alpha: 0.35, pulse: 3 });
  },

  buildShelf(g) {
    const S = LAYOUT.shelf, R = LAYOUT.room;
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 0.4, emissive: 0xb8bfcc, emissiveIntensity: 0.35 });
    const plinthMat = new THREE.MeshStandardMaterial({ color: 0xeef1f6, roughness: 0.4 });
    const width = S.cols * S.dx + 0.3;
    for (const y of S.rows) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(width, 0.05, 0.34), mat);
      board.position.set(0, y, S.wallZ + 0.17); board.castShadow = board.receiveShadow = true; g.add(board);
      Phys.addStaticBox([0, y - 0.05, S.wallZ + 0.17], [width, 0.15, 0.34]);
      const glow = new THREE.Mesh(new THREE.BoxGeometry(width - 0.1, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.3, 2.0) }));
      glow.position.set(0, y - 0.03, S.wallZ + 0.335); g.add(glow);
      for (let i = 0; i < S.cols; i++) {
        const x = S.x0 + i * S.dx;
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.03, 24), plinthMat);
        p.position.set(x, y + 0.04, S.z); p.receiveShadow = true; g.add(p);
        this.shelfSlots.push(new THREE.Vector3(x, y + 0.055, S.z));
      }
    }
    for (const x of [-width / 2, width / 2]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, S.rows[2] - S.rows[0] + 0.5, 0.34), mat);
      side.position.set(x, (S.rows[0] + S.rows[2]) / 2 + 0.05, S.wallZ + 0.17); side.castShadow = true; g.add(side);
    }
    const sign = labelPlane('DISCOVERY SHELF', 2.6, 0.32, { font: '900 74px', color: '#3a3f55', sub: 'drop or press F to display a trophy' });
    sign.position.set(0, S.rows[2] + 0.55, S.wallZ + 0.01); g.add(sign);
  },

  buildDisco(scene) {
    const cols = [0xff3ad8, 0x3ad8ff, 0xffe03a, 0x7aff5a];
    for (const c of cols) { const L = new THREE.PointLight(c, 0, 9, 1.5); L.position.set(0, 3, 0); scene.add(L); this.discoLights.push(L); }
  },

  update(dt) {
    // the sun's shadow box follows the player around the huge room
    if (G.camera) { const px = Math.round(G.camera.position.x), pz = Math.round(G.camera.position.z); this.sun.position.set(px + 13, 37, pz + 17); this.sun.target.position.set(px, 0, pz); }
    for (const P of LAYOUT.pedestals) if (P.holo) { P.holo.rotation.x = Math.PI / 2 + Math.sin(G.time * 0.8 + P.x) * 0.25; P.holo.rotation.z += dt * 0.8; P.holo.position.y = LAYOUT.table.top + 0.34 + Math.sin(G.time * 1.6 + P.x) * 0.02; }
    const rp = this.ringParts;
    if (rp) {
      const act = Crafting.ringActivity || 0;
      rp.runes.rotation.y += dt * (0.4 + act * 3);
      rp.beam.material.uniforms.uA.value = lerp(rp.beam.material.uniforms.uA.value, 0.12 + act * 0.6, 1 - Math.exp(-dt * 6));
      rp.ringMat.color.setHex(0x8a6aff).multiplyScalar(2.2 + act * 2 + Math.sin(G.time * 3) * 0.2);
      this.ringGlow.mul = 1 + act * 2.5;
      if (this.ringLight) this.ringLight.intensity = 0.8 + act * 2.5;
    }
    if (this.padGlow) this.padGlow.mul = lerp(this.padGlow.mul, 1, 1 - Math.exp(-dt * 3));
    // disco secret
    const d = G.effects.disco;
    this.discoLights.forEach((L, i) => {
      L.intensity = d > 0 ? 6 * Math.min(1, d) : 0;
      const a = G.time * (1.3 + i * 0.3) + i * 1.6;
      L.position.set(Math.cos(a) * 3.5, 2.2 + Math.sin(a * 1.7) * 0.8, 1 + Math.sin(a) * 3);
    });
    this.hemi.intensity = d > 0 ? 0.25 : lerp(this.hemi.intensity, G.effects.starfield > 0 ? 0.12 : Horror.hemi, 1 - Math.exp(-dt * (Horror.on ? 8 : 2)));
    this.sun.intensity = d > 0 ? 0.5 : lerp(this.sun.intensity, G.effects.starfield > 0 ? 0.25 : Horror.sun, 1 - Math.exp(-dt * (Horror.on ? 8 : 2)));
  },

  setWallHue(hue) {
    const target = hue == null ? new THREE.Color(Horror.on ? 0x4a4440 : 0xffffff) : new THREE.Color().setHSL(hue, 0.55, Horror.on ? 0.3 : 0.82);
    const from = this.wallMat.color.clone();
    Tweens.add(1.6, (k) => this.wallMat.color.copy(from).lerp(target, ease.inOut(k)));
  },
};
