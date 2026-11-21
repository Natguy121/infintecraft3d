// ============================================================================
//  ELEMENTAL LAB — 15 · GPU-friendly effects: pooled point-sprite particles,
//  the emoji label layer, glow halos and shockwave rings (one draw call each)
// ============================================================================

const POINT_VS = `
  attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
  varying vec3 vColor; varying float vAlpha;
  uniform float uScale;
  void main() {
    vColor = aColor; vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.05, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const POINT_FS = `
  uniform sampler2D map;
  varying vec3 vColor; varying float vAlpha;
  void main() {
    vec4 t = texture2D(map, gl_PointCoord);
    gl_FragColor = vec4(vColor * t.rgb, t.a * vAlpha);
    if (gl_FragColor.a < 0.003) discard;
  }`;
const pointUniforms = { uScale: { value: 500 } };

class PointSystem {
  constructor(n, tex, additive) {
    this.n = n;
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3);
    this.size = new Float32Array(n); this.alpha = new Float32Array(n);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    this.geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uScale: pointUniforms.uScale },
      vertexShader: POINT_VS, fragmentShader: POINT_FS, transparent: true, depthWrite: false,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = additive ? 20 : 19;
  }
  commit(count) {
    this.geo.setDrawRange(0, count);
    for (const k of ['position', 'aColor', 'aSize', 'aAlpha']) {
      this.geo.attributes[k].needsUpdate = true;
    }
  }
}

// ---------------------------------------------------------------- particles
const Particles = {
  sys: [], // [additive, alpha]
  init(scene) {
    const N = Math.round(2600 * Q().particles);
    for (const [tex, add] of [[Tex.spark, true], [Tex.soft, false]]) {
      const s = new PointSystem(N, tex, add);
      s.p = { vel: new Float32Array(N * 3), life: new Float32Array(N), max: new Float32Array(N), s0: new Float32Array(N), s1: new Float32Array(N), a0: new Float32Array(N), g: new Float32Array(N), d: new Float32Array(N), c: new Float32Array(N * 3), next: 0, alive: 0 };
      scene.add(s.points);
      this.sys.push(s);
    }
  },
  /** opts: pos, vel, spread, speed, color(s), size, sizeEnd, life, gravity, drag, count, add(bool), alpha, cone(dir) */
  emit(o) {
    const s = this.sys[o.add === false ? 1 : 0], p = s.p, N = s.n;
    const count = Math.max(1, Math.round((o.count || 1) * (o.add === false ? 1 : Q().particles)));
    const cols = Array.isArray(o.color) ? o.color : [o.color ?? 0xffffff];
    for (let k = 0; k < count; k++) {
      const i = p.next; p.next = (p.next + 1) % N;
      const sp = o.spread ?? 0.05, spd = (o.speed ?? 1) * (0.4 + Math.random() * 0.8);
      let dx = Math.random() * 2 - 1, dy = Math.random() * 2 - 1, dz = Math.random() * 2 - 1;
      const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      if (o.up) dy = Math.abs(dy) * o.up + (1 - o.up) * dy;
      s.pos[i * 3] = o.pos.x + dx * sp; s.pos[i * 3 + 1] = o.pos.y + dy * sp; s.pos[i * 3 + 2] = o.pos.z + dz * sp;
      p.vel[i * 3] = (o.vel?.x || 0) + dx * spd; p.vel[i * 3 + 1] = (o.vel?.y || 0) + dy * spd; p.vel[i * 3 + 2] = (o.vel?.z || 0) + dz * spd;
      const life = (o.life ?? 0.8) * (0.6 + Math.random() * 0.7);
      p.life[i] = life; p.max[i] = life;
      p.s0[i] = (o.size ?? 0.08) * (0.6 + Math.random() * 0.8); p.s1[i] = o.sizeEnd ?? p.s0[i] * 0.2;
      p.a0[i] = o.alpha ?? 1; p.g[i] = o.gravity ?? 0; p.d[i] = o.drag ?? 1.5;
      _color.setHex(cols[Math.floor(Math.random() * cols.length)]);
      const bright = o.add === false ? 1 : (o.bright ?? 1.6);
      p.c[i * 3] = _color.r * bright; p.c[i * 3 + 1] = _color.g * bright; p.c[i * 3 + 2] = _color.b * bright;
    }
  },
  burst(pos, color, n = 60, speed = 3, size = 0.09) {
    this.emit({ pos, color, count: n, speed, size, sizeEnd: 0.0, life: 0.9, gravity: -3, drag: 2.2, spread: 0.05 });
    this.emit({ pos, color: 0xffffff, count: Math.round(n * 0.3), speed: speed * 1.4, size: size * 0.6, life: 0.5, drag: 3 });
  },
  update(dt) {
    for (const s of this.sys) {
      const p = s.p, N = s.n;
      let maxI = 0;
      for (let i = 0; i < N; i++) {
        if (p.life[i] <= 0) { if (s.alpha[i] !== 0) { s.alpha[i] = 0; s.size[i] = 0; } continue; }
        p.life[i] -= dt;
        const t = 1 - Math.max(0, p.life[i]) / p.max[i];
        const damp = Math.exp(-p.d[i] * dt);
        p.vel[i * 3] *= damp; p.vel[i * 3 + 1] = p.vel[i * 3 + 1] * damp + p.g[i] * dt; p.vel[i * 3 + 2] *= damp;
        s.pos[i * 3] += p.vel[i * 3] * dt; s.pos[i * 3 + 1] += p.vel[i * 3 + 1] * dt; s.pos[i * 3 + 2] += p.vel[i * 3 + 2] * dt;
        s.size[i] = lerp(p.s0[i], p.s1[i], t);
        s.alpha[i] = p.a0[i] * Math.min(1, t * 8) * (1 - t * t);
        s.col[i * 3] = p.c[i * 3]; s.col[i * 3 + 1] = p.c[i * 3 + 1]; s.col[i * 3 + 2] = p.c[i * 3 + 2];
        maxI = i + 1;
      }
      s.commit(N);
    }
  },
};

// ---------------------------------------------------------------- emoji labels
const Labels = {
  N: 200, sys: null, uvs: null,
  init(scene) {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(this.N * 3); this.uv = new Float32Array(this.N * 2); this.size = new Float32Array(this.N); this.alpha = new Float32Array(this.N);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aUv', new THREE.BufferAttribute(this.uv, 2).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: EmojiAtlas.texture }, uScale: pointUniforms.uScale, uCell: { value: new THREE.Vector2(1 / EmojiAtlas.cols, 1 / EmojiAtlas.rows) } },
      vertexShader: `attribute vec2 aUv; attribute float aSize; attribute float aAlpha; varying vec2 vUv0; varying float vA; uniform float uScale;
        void main(){ vUv0 = aUv; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = aSize * uScale / max(0.05,-mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; uniform vec2 uCell; varying vec2 vUv0; varying float vA;
        void main(){ vec2 uv = vUv0 + vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y) * uCell; vec4 t = texture2D(map, uv); gl_FragColor = vec4(t.rgb, t.a * vA); if (gl_FragColor.a < 0.02) discard; }`,
      transparent: true, depthWrite: false,
    });
    this.sys = new THREE.Points(g, mat);
    this.sys.frustumCulled = false; this.sys.renderOrder = 30;
    this.geo = g;
    scene.add(this.sys);
  },
  update() {
    let n = 0;
    const cam = G.camera.position;
    const put = (x, y, z, cell, size, alpha) => {
      if (n >= this.N || cell == null) return;
      this.pos[n * 3] = x; this.pos[n * 3 + 1] = y; this.pos[n * 3 + 2] = z;
      const [u, v] = EmojiAtlas.uv(cell); this.uv[n * 2] = u; this.uv[n * 2 + 1] = v;
      this.size[n] = size; this.alpha[n] = alpha; n++;
    };
    for (const e of G.entities) {
      if (!e.labelCell || e.dead) continue;
      const p = e.root.position;
      const d = Math.hypot(p.x - cam.x, p.y - cam.y, p.z - cam.z);
      const a = clamp(1.3 - d / 9, 0, 1) * (e.held ? 0.5 : 1) * (e.fade ?? 1);
      if (a <= 0.01) continue;
      put(p.x, p.y + e.vis.radius * 0.95 + 0.12 + Math.sin(G.time * 2 + e.phase) * 0.012, p.z, e.labelCell.cell, 0.17 * (e.popScale ?? 1), a);
    }
    for (const d of G.displays) if (d.labelCell && d.visible) put(d.pos.x, d.pos.y + d.vis.radius + 0.14, d.pos.z, d.labelCell.cell, 0.16, 1);
    for (const t of G.trophies) if (t && t.labelCell) put(t.pos.x, t.pos.y + t.vis.radius + 0.08, t.pos.z, t.labelCell.cell, 0.12, 0.95);
    this.geo.setDrawRange(0, n);
    for (const k of ['position', 'aUv', 'aSize', 'aAlpha']) this.geo.attributes[k].needsUpdate = true;
  },
};

// ---------------------------------------------------------------- glow halos & flashes
const Glows = {
  sys: null, flashes: [],
  init(scene) { this.sys = new PointSystem(260, Tex.glow, true); scene.add(this.sys.points); },
  flash(pos, color, size = 1.5, life = 0.35) { this.flashes.push({ pos: pos.clone(), color, size, life, max: life }); },
  update(dt) {
    const s = this.sys; let n = 0;
    const put = (p, color, size, a) => {
      if (n >= s.n) return;
      s.pos[n * 3] = p.x; s.pos[n * 3 + 1] = p.y; s.pos[n * 3 + 2] = p.z;
      _color.setHex(color); s.col[n * 3] = _color.r; s.col[n * 3 + 1] = _color.g; s.col[n * 3 + 2] = _color.b;
      s.size[n] = size; s.alpha[n] = a; n++;
    };
    for (const e of G.entities) {
      if (e.dead || !e.info.glow) continue;
      let f = 1;
      if (e.info.material === 'fire' || e.info.fx.includes('flames')) f = 0.85 + Math.sin(G.time * 17 + e.phase) * 0.08 + Math.sin(G.time * 29 + e.phase * 2) * 0.07;
      else if (e.info.state === 'energy' || e.info.fx.includes('pulse')) f = 0.8 + Math.sin(G.time * 4 + e.phase) * 0.2;
      const fire = e.info.material === 'fire';
      put(e.root.position, fire ? e.info.color : (e.info.glowColor || e.info.color), e.vis.radius * (2.2 + e.info.glow * 2.2) * (e.popScale ?? 1), (fire ? 0.36 : 0.5) * e.info.glow * f * (e.fade ?? 1));
    }
    for (const d of G.displays) if (d.visible && d.info.glow) put(d.pos, d.info.color, d.vis.radius * 4, 0.32);
    for (const g of Room.glowSpots || []) put(g.pos, g.color, g.size * (g.pulse ? (0.85 + Math.sin(G.time * g.pulse) * 0.15) : 1), g.alpha * (g.mul ?? 1));
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const fl = this.flashes[i];
      fl.life -= dt;
      if (fl.life <= 0) { this.flashes.splice(i, 1); continue; }
      const t = 1 - fl.life / fl.max;
      put(fl.pos, fl.color, fl.size * (0.4 + ease.outCubic(t) * 0.9), (1 - t) * 1.2);
    }
    s.commit(n);
  },
};

// ---------------------------------------------------------------- shockwave rings
const Rings = {
  pool: [], active: [],
  init(scene) {
    const geo = new THREE.RingGeometry(0.93, 1, 64);
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      m.visible = false; m.renderOrder = 21; scene.add(m); this.pool.push(m);
    }
  },
  spawn(pos, color, size = 1.4, life = 0.55, flat = false) {
    const m = this.pool.find(x => !x.visible) || this.pool[0];
    m.visible = true; m.position.copy(pos); m.material.color.setHex(color).multiplyScalar(1.6);
    this.active = this.active.filter(a => a.m !== m);
    this.active.push({ m, t: 0, life, size, flat });
  },
  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const a = this.active[i];
      a.t += dt;
      const k = a.t / a.life;
      if (k >= 1) { a.m.visible = false; this.active.splice(i, 1); continue; }
      if (a.flat) a.m.rotation.set(-Math.PI / 2, 0, 0); else a.m.quaternion.copy(G.camera.quaternion);
      a.m.scale.setScalar(0.05 + ease.outCubic(k) * a.size);
      a.m.material.opacity = (1 - k) * 0.9;
    }
  },
};

// ---------------------------------------------------------------- merge-progress ring around two items
const ProgressRing = {
  mesh: null,
  init(scene) {
    const mat = new THREE.ShaderMaterial({
      uniforms: { uP: { value: 0 }, uColor: { value: new THREE.Color(0x8a7aff) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform float uP; uniform vec3 uColor; varying vec2 vUv;
        void main(){ vec2 d = vUv - 0.5; float a = atan(d.x, d.y) / 6.28318 + 0.5; float on = step(a, uP);
          vec3 c = mix(vec3(1.0), uColor * 2.0, on); gl_FragColor = vec4(c, 0.25 + on * 0.75); }`,
      transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64, 1), mat);
    this.mesh.visible = false; this.mesh.renderOrder = 40;
    scene.add(this.mesh);
  },
  show(a, b, p) {
    const m = this.mesh; m.visible = true;
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.scale.setScalar(a.distanceTo(b) * 0.5 + 0.28);
    m.quaternion.copy(G.camera.quaternion);
    m.material.uniforms.uP.value = p;
  },
  hide() { this.mesh.visible = false; },
};
