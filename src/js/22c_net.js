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
      c.send({ t: 'hello', name: this.myName() });
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
    const hue = (hashStr(id) % 360) / 360, col = new THREE.Color().setHSL(hue, 0.6, 0.55);
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.85, 6, 12), mat); body.position.y = 0.85; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: 0xf2d4b8, roughness: 0.6 })); head.position.y = 1.6;
    g.add(body, head);
    for (const x of [-0.08, 0.08]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1a1a24 })); eye.position.set(x, 1.64, 0.2); g.add(eye); }
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    label.position.y = 2.15; label.scale.set(1.6, 0.4, 1); g.add(label);
    G.scene.add(g);
    a = { g, label, name: 'Player', x: 0, y: 0, z: 0, yaw: 0, tx: 0, ty: 0, tz: 0, tyaw: 0, col };
    this.avatars.set(id, a); this.setLabel(a);
    return a;
  },
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
      a.g.position.set(a.x, a.y, a.z); a.g.rotation.y = a.yaw + Math.PI;
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
