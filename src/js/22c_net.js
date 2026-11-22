// ============================================================================
//  ELEMENTAL LAB — 22c · Multiplayer (peer-to-peer WebRTC via PeerJS)
//  One player creates a room and gets a short code; friends join with it.
//  Every player keeps their OWN discoveries. You see each other walking
//  around and each other's items, and you can fuse your item with theirs:
//  whoever does the fusing gets the discovery.
//  Topology: star — the host relays messages between guests.
// ============================================================================

const Net = {
  peer: null, conns: new Map(), isHost: false, code: null, myId: null,
  avatars: new Map(), remote: new Map(), nidN: 0, sendT: 0, pT: 0,
  ALPH: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',

  get on() { return this.conns.size > 0; },
  myName() { return (typeof Accounts !== 'undefined' && Accounts.displayName()) || this.guestName || (this.guestName = 'Player ' + Math.floor(100 + Math.random() * 900)); },
  opts() { return Object.assign({ debug: 0 }, window.ELAB_PEER || {}); },
  status(t) { const s = $('mp-status'); if (s) s.innerHTML = t; },

  init() {
    $('btn-mp').onclick = () => { $('mp-panel').classList.remove('hidden'); this.refresh(); };
    $('mp-close').onclick = () => $('mp-panel').classList.add('hidden');
    $('mp-host').onclick = () => this.host();
    $('mp-join').onclick = () => this.join($('mp-code').value);
    $('mp-leave').onclick = () => this.leave();
    $('mp-code').addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') $('mp-join').click(); });
    window.addEventListener('pagehide', () => this.leave(true));
  },

  refresh() {
    const inRoom = !!this.peer;
    $('mp-start').classList.toggle('hidden', inRoom);
    $('mp-room').classList.toggle('hidden', !inRoom);
    if (inRoom && this.code) $('mp-bigcode').textContent = this.code;
    const list = $('mp-players'); if (!list) return;
    list.innerHTML = '';
    const row = (n, me) => { const d = el('div'); d.className = 'acct-p' + (me ? ' me' : ''); d.innerHTML = '<span class="nm"></span>'; d.querySelector('.nm').textContent = n + (me ? ' (you)' : ''); list.appendChild(d); };
    if (inRoom) { row(this.myName(), true); for (const a of this.avatars.values()) row(a.name, false); }
    const pill = $('hud-mp');
    if (pill) { pill.classList.toggle('hidden', !inRoom); pill.textContent = `👥 ${this.code || ''} · ${this.avatars.size + 1} player${this.avatars.size ? 's' : ''}`; }
  },

  // ---------------------------------------------------------------- connect
  host() {
    if (this.peer) return;
    let code = ''; for (let i = 0; i < 5; i++) code += this.ALPH[Math.floor(Math.random() * this.ALPH.length)];
    this.isHost = true; this.code = code;
    this.status('Creating room…');
    const p = this.peer = new Peer('elab-' + code, this.opts());
    p.on('open', (id) => { this.myId = id; this.status('Room ready! Tell your friends the code.'); this.refresh(); });
    p.on('connection', (c) => this.addConn(c));
    p.on('error', (e) => this.fail(e));
    this.refresh();
  },

  join(raw) {
    const code = String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4) { this.status('❌ Type the room code first.'); return; }
    if (this.peer) this.leave(true);
    this.isHost = false; this.code = code;
    this.status('Connecting to room ' + code + '…');
    const p = this.peer = new Peer(undefined, this.opts());
    p.on('open', (id) => {
      this.myId = id;
      const c = p.connect('elab-' + code, { reliable: true });
      this.addConn(c);
      setTimeout(() => { if (this.peer === p && !this.conns.size) this.fail({ type: 'timeout' }); }, 12000);
    });
    p.on('error', (e) => this.fail(e));
    this.refresh();
  },

  fail(e) {
    const t = e && e.type;
    const msg = t === 'peer-unavailable' || t === 'timeout' ? 'No room with that code (or it closed).'
      : t === 'unavailable-id' ? 'That code is busy, try again.'
      : t === 'network' || t === 'server-error' || t === 'socket-error' ? 'Can\'t reach the multiplayer server. Check your internet connection.'
      : 'Connection problem: ' + (t || (e && e.message) || 'unknown');
    this.leave(true);
    this.status('❌ ' + msg);
  },

  leave(quiet) {
    if (this.peer) { try { this.send({ t: 'bye' }); } catch (e) { /* ignore */ } try { this.peer.destroy(); } catch (e) { /* ignore */ } }
    this.peer = null; this.conns.clear(); this.code = null;
    for (const id of [...this.avatars.keys()]) this.dropPlayer(id, true);
    for (const e of [...this.remote.values()]) e.destroy();
    this.remote.clear();
    if (!quiet) this.status('You left the room.');
    if (G.scene) this.refresh();
  },

  addConn(c) {
    c.on('open', () => {
      this.conns.set(c.peer, c);
      c.send({ t: 'hello', name: this.myName(), look: Skins.look() });
      if (this.isHost) for (const [id, a] of this.avatars) c.send({ t: 'hello', name: a.name, from: id });
      this.status(this.isHost ? 'Room ready! Tell your friends the code.' : '✅ Connected!');
      this.refresh();
    });
    c.on('data', (d) => { try { this.onData(c.peer, d); } catch (e) { console.warn('net', e); } });
    c.on('close', () => { this.conns.delete(c.peer); this.dropPlayer(c.peer); if (!this.isHost && this.peer) { this.leave(true); this.status('❌ The host closed the room.'); } });
    c.on('error', () => {});
  },

  send(m, except) { for (const [id, c] of this.conns) if (id !== except && c.open) { try { c.send(m); } catch (e) { /* ignore */ } } },

  // ---------------------------------------------------------------- messages
  onData(conn, m) {
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
    const src = this.isHost ? conn : (typeof m.from === 'string' ? m.from : conn);
    if (this.isHost) this.send({ ...m, from: conn }, conn);  // relay to the other guests
    if (src === this.myId) return;
    switch (m.t) {
      case 'hello': {
        const a = this.avatar(src); a.name = String(m.name || 'Player').slice(0, 24); this.setLabel(a);
        if (m.look && typeof m.look === 'object') this.setLook(a, src, m.look);
        if (m.re) break;
        UI.toast('👋', `${a.name} joined`, 'Mix your items with theirs. Each of you keeps your own discoveries.');
        this.refresh(); break;
      }
      case 'p': { const a = this.avatar(src); if (Array.isArray(m.p)) { a.tx = +m.p[0] || 0; a.ty = +m.p[1] || 0; a.tz = +m.p[2] || 0; a.tyaw = +m.p[3] || 0; } break; }
      case 'items': this.syncItems(src, Array.isArray(m.l) ? m.l : []); break;
      case 'consume': {
        if (typeof m.nid !== 'string') break;
        const mine = G.entities.find(e => e.nid === m.nid && !e.remote);
        if (mine && !mine.merging && !mine.dead) { if (Player.held === mine) Player.drop(false); mine.vanish(0xb8a8ff, 0.2); }
        const r = this.remote.get(m.nid); if (r) { this.remote.delete(m.nid); r.vanish(0xb8a8ff, 0.2); }
        break;
      }
      case 'disc': {
        const a = this.avatars.get(src), info = typeof m.id === 'string' && Universe.isValidId(m.id) ? Universe.get(m.id) : null;
        if (a && info) UI.toast(info.emoji || '✨', `${a.name} discovered ${info.name}`, Progress.disc.has(m.id) ? 'You already have it.' : 'You haven\'t found that one yet!');
        break;
      }
      case 'bye': this.dropPlayer(src); break;
    }
  },

  syncItems(owner, list) {
    const seen = new Set();
    for (const r of list.slice(0, 90)) {
      if (!Array.isArray(r) || r.length < 9) continue;
      const [nid, id] = r;
      if (typeof nid !== 'string' || typeof id !== 'string' || !Universe.isValidId(id)) continue;
      seen.add(nid);
      let e = this.remote.get(nid);
      if (e && (e.dead || e.id !== id)) { if (!e.dead) e.destroy(); e = null; this.remote.delete(nid); }
      if (!e) {
        if (this.consumed && this.consumed.has(nid)) continue;
        e = spawnItem(id, new THREE.Vector3(+r[2] || 0, +r[3] || 0, +r[4] || 0), { noPop: false });
        if (!e) continue;
        e.remote = owner; e.nid = nid;
        const b = e.body;
        b.type = CANNON.Body.KINEMATIC; b.mass = 0; b.updateMassProperties(); b.allowSleep = false;
        e.tp = new THREE.Vector3(); e.tq = new THREE.Quaternion();
        this.remote.set(nid, e);
      }
      e.tp.set(+r[2] || 0, +r[3] || 0, +r[4] || 0); e.tq.set(+r[5] || 0, +r[6] || 0, +r[7] || 0, +r[8] || 1).normalize();
      e.lastTouch = G.time;
    }
    for (const [nid, e] of this.remote) if (e.remote === owner && !seen.has(nid)) { this.remote.delete(nid); if (!e.merging && !e.dead) e.vanish(undefined, 0.25); }
  },

  /** called by Crafting.merge for each input: fusing someone else's item takes it from them */
  consume(e) {
    if (!e.remote || !e.nid) return;
    (this.consumed || (this.consumed = new Set())).add(e.nid);
    this.remote.delete(e.nid);
    this.send({ t: 'consume', nid: e.nid });
  },
  announce(info) { if (this.on) this.send({ t: 'disc', id: info.id }); },

  // ---------------------------------------------------------------- avatars
  avatar(id) {
    let a = this.avatars.get(id);
    if (a) return a;
    const g = new THREE.Group(), rig = buildPerson(hashStr(id));
    g.add(rig.root);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    label.position.y = 2.05; label.scale.set(1.1, 0.275, 1); g.add(label);
    G.scene.add(g);
    a = { g, rig, label, name: 'Player', x: 0, y: 0, z: 0, yaw: 0, tx: 0, ty: 0, tz: 0, tyaw: 0, walk: 0, speed: 0 };
    this.avatars.set(id, a); this.setLabel(a);
    return a;
  },
  setLook(a, id, look) {
    const L = {}; for (const k of ['skin', 'hair', 'shirt', 'pants']) if (Number.isFinite(look[k])) L[k] = look[k] & 0xffffff;
    for (const [k, n] of [['hairStyle', 4], ['hat', 7]]) if (Number.isInteger(look[k]) && look[k] >= 0 && look[k] < n) L[k] = look[k];
    a.g.remove(a.rig.root); a.rig = buildPerson(hashStr(id), L); a.g.add(a.rig.root);
  },
  sendLook() { if (this.on) this.send({ t: 'hello', name: this.myName(), look: Skins.look(), re: 1 }); },
  setLabel(a) {
    const tex = canvasTex(512, 128, (c, w, h) => {
      c.fillStyle = 'rgba(15,18,30,.7)'; roundRect(c, 8, 18, w - 16, h - 36, 40); c.fill();
      c.fillStyle = '#fff'; c.font = '800 54px ui-rounded, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(a.name, w / 2, h / 2 + 2);
    });
    if (a.label.material.map) a.label.material.map.dispose();
    a.label.material.map = tex; a.label.material.needsUpdate = true;
  },
  dropPlayer(id, quiet) {
    const a = this.avatars.get(id);
    if (a) { G.scene.remove(a.g); this.avatars.delete(id); if (!quiet) UI.toast('👋', `${a.name} left`, ''); }
    for (const [nid, e] of this.remote) if (e.remote === id) { this.remote.delete(nid); e.vanish(undefined, 0.25); }
    if (G.scene) this.refresh();
  },

  // ---------------------------------------------------------------- per frame
  update(rdt) {
    if (!this.peer) return;
    const k = 1 - Math.exp(-rdt * 12);
    for (const a of this.avatars.values()) {
      a.x += (a.tx - a.x) * k; a.y += (a.ty - a.y) * k; a.z += (a.tz - a.z) * k;
      let d = a.tyaw - a.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); a.yaw += d * k;
      const px = a.g.position.x, pz = a.g.position.z;
      a.g.position.set(a.x, a.y, a.z); a.g.rotation.y = a.yaw + Math.PI;
      const sp = Math.hypot(a.x - px, a.z - pz) / Math.max(rdt, 1e-3);
      a.speed += (Math.min(sp, 7) - a.speed) * (1 - Math.exp(-rdt * 8));
      animatePerson(a.rig, a.speed, rdt);
    }
    for (const e of this.remote.values()) {
      if (e.dead || e.merging || !e.body) continue;
      const b = e.body, p = e.root.position;
      const nx = p.x + (e.tp.x - p.x) * k, ny = p.y + (e.tp.y - p.y) * k, nz = p.z + (e.tp.z - p.z) * k;
      b.velocity.set((nx - p.x) / Math.max(rdt, 1e-3), (ny - p.y) / Math.max(rdt, 1e-3), (nz - p.z) / Math.max(rdt, 1e-3));
      p.set(nx, ny, nz); e.root.quaternion.slerp(e.tq, k);
      b.position.set(nx, ny, nz); b.quaternion.set(e.root.quaternion.x, e.root.quaternion.y, e.root.quaternion.z, e.root.quaternion.w);
    }
    if (!this.on) return;
    this.pT -= rdt; this.sendT -= rdt;
    if (this.pT <= 0) {
      this.pT = 1 / 15;
      const c = G.camera.position;
      this.send({ t: 'p', p: [+c.x.toFixed(2), +(c.y - 1.65).toFixed(2), +c.z.toFixed(2), +Player.yaw.toFixed(3)] });
    }
    if (this.sendT <= 0) {
      this.sendT = 0.1;
      const l = [];
      for (const e of G.entities) {
        if (e.remote || e.dead || e.merging || l.length >= 80) continue;
        if (!e.nid) e.nid = this.myId + ':' + (++this.nidN);
        const p = e.root.position, q = e.root.quaternion, f = (v) => +v.toFixed(3);
        l.push([e.nid, e.id, f(p.x), f(p.y), f(p.z), f(q.x), f(q.y), f(q.z), f(q.w)]);
      }
      this.send({ t: 'items', l });
    }
  },
};

// ---------------------------------------------------------------- a realistic-ish person
const SKIN = [0xf1c9a5, 0xe0ac84, 0xc68863, 0x9c6644, 0x6e4a32, 0xf6d8c0];
const HAIR = [0x2a1d14, 0x4a2f1c, 0x8a5a2a, 0xd8b064, 0x1a1a1a, 0xa83a1c, 0x6a6a6a];
const SHIRT = [0x3a6ea8, 0xb83a3a, 0x2f8a5a, 0xe8e8ea, 0x2a2a30, 0xe89a2a, 0x7a4ab8, 0x3aa8b8];
const PANTS = [0x2a3a5a, 0x2a2a2e, 0x5a4a3a, 0x3a4a3a, 0x6a7a8a];

function buildPerson(seed, look) {
  const rnd = makeRng(seed >>> 0 || 1), pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const LK = look || {};
  const M = (c, r = 0.75, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r }, extra));
  const skin = M(LK.skin ?? pick(SKIN), 0.6), hair = M(LK.hair ?? pick(HAIR), 0.85), shirt = M(LK.shirt ?? pick(SHIRT), 0.85), pants = M(LK.pants ?? pick(PANTS), 0.9);
  const shoe = M(0x1e1e22, 0.5), white = M(0xf8f8f8, 0.3), iris = M(pick([0x3a5a8a, 0x4a3a2a, 0x3a6a4a, 0x5a4a3a]), 0.2), lip = M(0xb06a62, 0.6);
  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; (parent || root).add(m); return m; };
  const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 14);
  const pivot = (x, y, z, parent) => { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; };
  const root = new THREE.Group();
  const h = 0.94 + rnd() * 0.12, w = 0.92 + rnd() * 0.18;   // height & build variety
  root.scale.set(w, h, w);
  // hips + torso (slightly tapered, chest wider than waist)
  const hips = pivot(0, 0.95, 0, root);
  mesh(cap(0.15, 0.12), pants, 0, 0.02, 0, hips).scale.set(1.25, 1, 0.8);
  const spine = pivot(0, 0.08, 0, hips);
  mesh(cap(0.16, 0.28), shirt, 0, 0.24, 0, spine).scale.set(1.25, 1, 0.75);     // belly/chest
  mesh(cap(0.12, 0.24), shirt, 0, 0.44, 0, spine).rotation.z = Math.PI / 2;     // shoulders
  // neck + head
  mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.12, 12), skin, 0, 0.58, 0, spine);
  const head = pivot(0, 0.72, 0, spine);
  mesh(new THREE.SphereGeometry(0.115, 24, 18), skin, 0, 0, 0, head).scale.set(0.92, 1.12, 1);
  mesh(new THREE.SphereGeometry(0.085, 16, 12), skin, 0, -0.07, 0.025, head).scale.set(1, 0.8, 1.05); // jaw
  mesh(new THREE.ConeGeometry(0.022, 0.06, 10), skin, 0, -0.005, 0.115, head).rotation.x = Math.PI / 2 + 0.25; // nose
  for (const s of [-1, 1]) {
    mesh(new THREE.SphereGeometry(0.026, 10, 8), skin, s * 0.108, 0, 0, head).scale.set(0.5, 1, 0.8);     // ears
    mesh(new THREE.SphereGeometry(0.019, 12, 10), white, s * 0.04, 0.025, 0.097, head);                   // eye whites
    mesh(new THREE.SphereGeometry(0.0105, 10, 8), iris, s * 0.04, 0.025, 0.112, head);                    // irises
    mesh(new THREE.BoxGeometry(0.045, 0.009, 0.012), hair, s * 0.042, 0.058, 0.103, head).rotation.z = -s * 0.12; // brows
  }
  mesh(new THREE.BoxGeometry(0.05, 0.012, 0.012), lip, 0, -0.062, 0.1, head);                              // mouth
  // hair: one of a few styles
  const style = LK.hairStyle ?? Math.floor(rnd() * 4);
  const cap1 = mesh(new THREE.SphereGeometry(0.122, 24, 14, 0, Math.PI * 2, 0, Math.PI * (style === 3 ? 0.36 : 0.45)), hair, 0, 0.022, -0.012, head);
  cap1.scale.set(0.97, 1.12, 1.06);
  if (style === 1) mesh(cap(0.1, 0.18), hair, 0, -0.1, -0.06, head).scale.set(1.1, 1, 0.6);                 // long
  if (style === 2) mesh(new THREE.SphereGeometry(0.05, 12, 10), hair, 0, 0.06, -0.12, head);                // bun
  if (LK.hat) addHat(head, LK.hat, mesh);
  // arms (shoulder → elbow → hand)
  const arms = [], legs = [];
  for (const s of [-1, 1]) {
    const sh = pivot(s * 0.21, 0.44, 0, spine);
    mesh(cap(0.048, 0.2), shirt, 0, -0.13, 0, sh);
    const el = pivot(0, -0.27, 0, sh);
    mesh(cap(0.04, 0.2), skin, 0, -0.12, 0, el);
    mesh(new THREE.SphereGeometry(0.045, 12, 10), skin, 0, -0.27, 0.01, el).scale.set(0.75, 1.15, 0.5);   // hand
    sh.rotation.z = s * 0.08;
    arms.push({ sh, el, s });
    // legs (hip → knee → foot)
    const hp = pivot(s * 0.095, -0.02, 0, hips);
    mesh(cap(0.07, 0.3), pants, 0, -0.2, 0, hp);
    const kn = pivot(0, -0.43, 0, hp);
    mesh(cap(0.058, 0.3), pants, 0, -0.2, 0, kn);
    const ft = pivot(0, -0.43, 0, kn);
    mesh(new THREE.BoxGeometry(0.1, 0.07, 0.24), shoe, 0, -0.02, 0.05, ft);
    legs.push({ hp, kn, ft, s });
  }
  return { root, hips, spine, head, arms, legs, t: rnd() * 10 };
}

function animatePerson(r, speed, dt) {
  const run = clamp(speed / 6, 0, 1), walk = clamp(speed / 1.4, 0, 1);
  r.t += dt * (2.2 + speed * 1.25);
  const ph = r.t * 2, sw = Math.sin(ph), amp = 0.55 * walk + 0.35 * run;
  for (const L of r.legs) {
    const k = Math.sin(ph + (L.s > 0 ? Math.PI : 0));
    L.hp.rotation.x = k * amp;
    L.kn.rotation.x = Math.max(0, -Math.cos(ph + (L.s > 0 ? Math.PI : 0))) * (0.9 * walk + 0.6 * run);
    L.ft.rotation.x = -L.hp.rotation.x * 0.3;
  }
  for (const A of r.arms) {
    const k = Math.sin(ph + (A.s > 0 ? 0 : Math.PI));
    A.sh.rotation.x = k * amp * 0.8;
    A.el.rotation.x = -0.15 - (0.3 * walk + 0.8 * run);
  }
  // body bob, lean into running, idle breathing
  const idle = Math.sin(r.t * 0.6) * 0.008 * (1 - walk);
  r.hips.position.y = 0.95 - Math.abs(Math.cos(ph)) * 0.035 * walk + idle;
  r.spine.rotation.x = 0.12 * run;
  r.spine.rotation.y = sw * 0.08 * walk;
  r.head.rotation.y = -sw * 0.05 * walk;
  r.head.rotation.x = Math.sin(r.t * 0.35) * 0.04 * (1 - walk);
}
