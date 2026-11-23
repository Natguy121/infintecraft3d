// ============================================================================
//  ELEMENTAL LAB — 20j · Creature AI, driveable vehicles, coins & shop,
//  prestige, emotes, Android install and Easter eggs
// ============================================================================

// ---------------------------------------------------------------- creature AI
const PREDATORS = ['lion', 'tiger', 'wolf', 'shark', 'dragon', 't-rex', 'bear', 'crocodile', 'alligator', 'monster', 'werewolf', 'eagle', 'snake', 'cat', 'fox', 'kraken', 'yeti', 'dinosaur', 'leopard', 'cheetah'];
const PREY = ['mouse', 'rabbit', 'chicken', 'fish', 'sheep', 'goat', 'deer', 'bird', 'chick', 'frog', 'insect', 'worm', 'duck', 'pig', 'lamb', 'hamster', 'penguin'];
const Creatures = {
  t: 0,
  isCreature(e) { const i = e.info; return (i.tags.includes('animal') || ['creature', 'bird', 'fish', 'snake', 'insect'].includes(i.shape)) && !['meat', 'food', 'egg', 'bowl'].includes(i.shape); },
  update(dt) {
    this.t += dt;
    const cam = G.camera.position;
    let n = 0;
    for (const e of G.entities) {
      if (n > 18) break;
      if (e.dead || e.merging || e.held || e.pet || e.placed || e.remote || !e.body || e.inRing || e.driven) continue;
      if (!this.isCreature(e) || e.root.position.distanceTo(cam) > 40) continue;
      n++;
      const b = e.body, p = e.root.position, i = e.info;
      const flyer = i.shape === 'bird' || i.tags.includes('flying') || i.shape === 'insect';
      const swimmer = i.shape === 'fish';
      const sp = clamp(1.2 + e.vis.real * 0.25, 1, 5);
      if (!e.ai) e.ai = { tx: p.x, tz: p.z, next: 0, chase: null };
      const ai = e.ai;
      // predators look for prey nearby
      if (kw(i, ...PREDATORS) && (!ai.chase || ai.chase.dead) && Math.random() < dt * 0.5) {
        ai.chase = G.entities.find(o => o !== e && !o.dead && !o.held && !o.pet && !o.placed && !o.remote && o.body && kw(o.info, ...PREY) && o.root.position.distanceTo(p) < 8) || null;
        if (ai.chase) Voices.play(Voices.kind(i), p);
      }
      if (ai.chase && !ai.chase.dead) {
        ai.tx = ai.chase.root.position.x; ai.tz = ai.chase.root.position.z;
        if (ai.chase.root.position.distanceTo(p) < e.vis.radius + ai.chase.vis.radius + 0.15) {
          Particles.emit({ pos: ai.chase.root.position, color: [0xffffff, 0xffd0d0], count: 14, speed: 1.4, size: 0.05, life: 0.5 });
          UI.toast(i.emoji, `${i.name} caught the ${ai.chase.info.name}!`, 'Nature is wild.');
          ai.chase.vanish(); ai.chase = null; Stats.add('hunts');
        }
      } else if (this.t > ai.next) {
        const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 5;
        ai.tx = p.x + Math.cos(a) * r; ai.tz = p.z + Math.sin(a) * r; ai.next = this.t + 3 + Math.random() * 6;
        // prey runs from predators
        const threat = G.entities.find(o => o !== e && o.ai && o.ai.chase === e);
        if (threat) { const d = p.clone().sub(threat.root.position).setY(0).normalize(); ai.tx = p.x + d.x * 6; ai.tz = p.z + d.z * 6; ai.next = this.t + 1; }
      }
      // stay in bounds of the room or the island
      const inIsland = p.x > LAYOUT.room.x1;
      ai.tx = clamp(ai.tx, LAYOUT.room.x0 + 2, inIsland ? Island.X1 - 2 : LAYOUT.room.x1 - 2); ai.tz = clamp(ai.tz, LAYOUT.room.z0 + 2, LAYOUT.room.z1 - 2);
      const dx = ai.tx - p.x, dz = ai.tz - p.z, d = Math.hypot(dx, dz);
      b.wakeUp();
      if (d > 0.3) {
        const s = ai.chase ? sp * 1.8 : sp * (Math.random() < 0.02 ? 0 : 1);
        b.velocity.x += (dx / d * s - b.velocity.x) * Math.min(1, dt * 3);
        b.velocity.z += (dz / d * s - b.velocity.z) * Math.min(1, dt * 3);
        if (!flyer && !swimmer && Math.abs(b.velocity.y) < 0.15 && Math.random() < dt * 1.5) b.velocity.y = 1.8 + Math.min(2, e.vis.real * 0.2);
        b.quaternion.setFromEuler(0, Math.atan2(dx, dz), 0); b.angularVelocity.set(0, 0, 0);
      }
      if (flyer) b.applyForce(new CANNON.Vec3(0, b.mass * (9.82 + (2.2 + Math.sin(this.t + e.phase) * 0.6 - p.y) * 3 - b.velocity.y * 1.5), 0));
      if (swimmer && Math.random() < dt * 0.4) Particles.emit({ add: false, pos: p, color: 0xcfefff, count: 2, up: 1, speed: 0.2, size: 0.04, life: 1.5, alpha: 0.6 });
    }
  },
};

// ---------------------------------------------------------------- driveable vehicles
const Driving = {
  car: null, speed: 0,
  canDrive(e) { return e && !e.remote && !e.dead && e.body && (e.info.tags.includes('vehicle') || ['vehicle', 'plane', 'boat', 'rocket'].includes(e.info.shape)); },
  flies(e) { return ['plane', 'rocket'].includes(e.info.shape) || kw(e.info, 'helicopter', 'ufo', 'spaceship', 'balloon', 'jet', 'airship', 'blimp', 'broom', 'carpet'); },
  enter(e) {
    if (!this.canDrive(e)) { UI.toast('🚗', 'You can\'t drive that', 'Look at a car, boat, plane, rocket, bike… and press V.'); return; }
    if (Player.held) Player.drop(false);
    if (e.placed) Build.unpin(e);
    this.car = e; this.speed = 0; e.driven = true;
    Player.body.collisionResponse = false;
    e.body.angularDamping = 0.99; e.body.linearDamping = 0.05;
    UI.toast(e.info.emoji, `Driving: ${e.info.name}`, IS_TOUCH ? 'Joystick to drive, look to steer the camera. Tap 🚗 to get out.' : `W/S drive, A/D steer${this.flies(e) ? ', Space/Shift up/down' : ''}. Press V to get out.`);
    Sound.tone(110, 0.4, { type: 'sawtooth', vol: 0.15, glide: 220, filter: 600 });
  },
  exit() {
    const e = this.car; if (!e) return;
    this.car = null; e.driven = false; Player.body.collisionResponse = true;
    const p = e.root.position; Player.body.position.set(p.x + e.vis.radius + 1, p.y + 0.5, p.z); Player.body.velocity.set(0, 0, 0);
  },
  update(dt) {
    if (Input.pressed.has('KeyV') && G.locked && !G.ui) {
      if (this.car) this.exit();
      else this.enter(Player.held || (G.lookTarget && G.lookTarget.kind === 'entity' ? G.lookTarget.obj : null));
    }
    const e = this.car; if (!e) return;
    if (e.dead || e.merging || !e.body) { this.car = null; Player.body.collisionResponse = true; return; }
    const K = Input.keys, b = e.body, fly = this.flies(e);
    let thr = (K.has('KeyW') ? 1 : 0) - (K.has('KeyS') ? 1 : 0), steer = (K.has('KeyA') ? 1 : 0) - (K.has('KeyD') ? 1 : 0);
    if (Touch.move.x || Touch.move.y) { thr = Touch.move.y; steer = -Touch.move.x; }
    const top = clamp(8 + e.vis.real * 1.5, 8, fly ? 30 : 22);
    this.speed += (thr * top - this.speed) * Math.min(1, dt * (thr ? 1.2 : 2));
    e.ai = null;
    // heading from the body, steering turns it
    const eu = new THREE.Euler().setFromQuaternion(e.root.quaternion, 'YXZ');
    let yaw = eu.y + steer * dt * 1.8 * clamp(Math.abs(this.speed) / 4, 0.4, 1) * Math.sign(this.speed || 1);
    b.quaternion.setFromEuler(0, yaw, 0); b.angularVelocity.set(0, 0, 0);
    const longZ = e.vis.collider && e.vis.collider.he ? e.vis.collider.he.z >= e.vis.collider.he.x : true;
    const fwd = longZ ? new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)) : new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    b.velocity.x = fwd.x * this.speed; b.velocity.z = fwd.z * this.speed;
    if (fly) { const up = (K.has('Space') ? 1 : 0) - (K.has('ShiftLeft') || K.has('ShiftRight') ? 1 : 0); b.velocity.y += (up * 6 - b.velocity.y) * Math.min(1, dt * 3); b.applyForce(new CANNON.Vec3(0, b.mass * 9.82, 0)); }
    b.wakeUp(); e.touch(true);
    if (Math.abs(this.speed) > 3 && Math.random() < 0.4) Particles.emit({ add: false, pos: e.root.position.clone().addScaledVector(fwd, -e.vis.radius), color: 0xd8dce4, count: 1, speed: 0.4, size: 0.08, sizeEnd: 0.3, life: 0.8, alpha: 0.35 });
    // ride behind and above
    const p = e.root.position, back = e.vis.radius * 1.6 + 1.5;
    Player.body.position.set(p.x - Math.sin(Player.yaw) * -back * 0 - Math.sin(Player.yaw + Math.PI) * back, p.y + e.vis.radius * 0.9 - 0.6, p.z - Math.cos(Player.yaw + Math.PI) * back);
    Player.body.velocity.set(0, 0, 0);
  },
};

// ---------------------------------------------------------------- coins & shop
const SHOP = [
  { id: 'hat-halo', name: 'Halo', icon: '😇', price: 1500, kind: 'hat', hat: 7 },
  { id: 'hat-pirate', name: 'Pirate hat', icon: '🏴‍☠️', price: 500, kind: 'hat', hat: 8 },
  { id: 'hat-viking', name: 'Viking helmet', icon: '⚔️', price: 700, kind: 'hat', hat: 9 },
  { id: 'hat-party', name: 'Party hat', icon: '🥳', price: 800, kind: 'hat', hat: 10 },
  { id: 'skin-gold', name: 'Golden skin', icon: '🟡', price: 1200, kind: 'skin', color: 0xffc83a },
  { id: 'trail', name: 'Rainbow trail', icon: '🌈', price: 3000, kind: 'perk' },
  { id: 'boost', name: 'XP booster ×2 (20 min)', icon: '🚀', price: 90, kind: 'use' },
  { id: 'party', name: 'Party time (disco!)', icon: '🪩', price: 40, kind: 'use' },
  { id: 'hint5', name: 'Hint refill', icon: '💡', price: 25, kind: 'use' },
];
const Shop = {
  coins: 0, owned: [], boostUntil: 0,
  init() {
    const d = Ext.take('shop') || {}; this.coins = d.coins || 0; this.owned = d.owned || []; this.boostUntil = d.boost || 0;
    Ext.register('shop', () => ({ coins: this.coins, owned: this.owned, boost: this.boostUntil }));
    const pill = el('div'); pill.className = 'pill'; pill.id = 'hud-coins'; $('hud-tl').appendChild(pill);
    const p = el('div'); p.id = 'shop-panel'; p.className = 'hidden';
    p.innerHTML = `<div class="acct-card soc-card"><button class="x" id="shop-x">✕</button><h2>🛒 Shop</h2><p class="acct-note">Earn 🪙 coins from new discoveries (+2), new recipes (+1), levelling up (+10), finishing all daily challenges (+30) and Easter eggs (+15).</p><div id="shop-coins" class="mp-codebox"></div><div id="shop-list" class="shop-grid"></div></div>`;
    document.body.appendChild(p);
    $('shop-x').onclick = () => p.classList.add('hidden');
    const btn = el('button'); btn.id = 'btn-shop'; btn.textContent = '🛒 Shop'; $('btn-mp').before(btn);
    btn.onclick = () => { p.classList.remove('hidden'); this.render(); };
    this.hud();
  },
  add(n, why) { this.coins += n; this.hud(); Save.markDirty(); if (why) UI.xpPop && G.camera && UI.xpPop(`+${n} 🪙`, G.camera.position.clone().addScaledVector(Player.dir, 2).add(new THREE.Vector3(0.4, -0.2, 0))); },
  hud() { const p = $('hud-coins'); if (p) p.textContent = `🪙 ${fmtInt(this.coins)}${this.boostUntil > Date.now() ? ' · 🚀×2' : ''}`; },
  has(id) { return this.owned.includes(id); },
  xpMult() { return (this.boostUntil > Date.now() ? 2 : 1) * (1 + 0.1 * (Progress.stats.prestige || 0)); },
  onCraft(isNew, recNew) { const n = isNew ? 2 : recNew ? 1 : 0; if (n) this.add(n, true); },
  render() {
    $('shop-coins').innerHTML = `You have<b>🪙 ${fmtInt(this.coins)}</b>`;
    const list = $('shop-list'); list.innerHTML = '';
    for (const it of SHOP) {
      const own = it.kind !== 'use' && this.has(it.id);
      const b = el('button'); b.className = 'shop-it' + (own ? ' own' : '');
      b.innerHTML = `<span class="si">${it.icon}</span><b>${escHtml(it.name)}</b><small>${own ? '✅ Owned' : '🪙 ' + it.price}</small>`;
      b.onclick = () => this.buy(it);
      list.appendChild(b);
    }
  },
  buy(it) {
    if (it.kind !== 'use' && this.has(it.id)) { this.equip(it); return; }
    if (this.coins < it.price) { UI.toast('🪙', 'Not enough coins', `You need ${it.price - this.coins} more. Keep crafting!`); return; }
    this.coins -= it.price;
    if (it.kind === 'use') {
      if (it.id === 'boost') this.boostUntil = Math.max(Date.now(), this.boostUntil) + 20 * 60000;
      if (it.id === 'party') { G.effects.disco = 30; }
      if (it.id === 'hint5') UI.hintCooldown = 0;
      UI.toast(it.icon, `${it.name}!`, 'Enjoy!');
    } else { this.owned.push(it.id); this.equip(it); UI.toast(it.icon, `Bought ${it.name}!`, it.kind === 'hat' || it.kind === 'skin' ? 'You\'re wearing it now. Change it in 🧍 Character.' : 'It\'s on!'); }
    Sound.achievement(); this.hud(); Save.markDirty(); this.render();
  },
  equip(it) { if (it.kind === 'hat') Skins.set('hat', it.hat); if (it.kind === 'skin') Skins.set('skin', it.color); },
  update(dt) {
    if (this.has('trail') && Player.body && Math.hypot(Player.body.velocity.x, Player.body.velocity.z) > 1 && Math.random() < 0.6) {
      const p = Player.body.position; Particles.emit({ pos: new THREE.Vector3(p.x, p.y + 0.15, p.z), color: [0xff5a5a, 0xffb03a, 0xffe85a, 0x5aff8a, 0x5ab8ff, 0xb05aff], count: 2, speed: 0.3, size: 0.07, life: 0.9 });
    }
    if (this.boostUntil && this.boostUntil < Date.now() && this.boostUntil > 1) { this.boostUntil = 0; this.hud(); UI.toast('🚀', 'XP booster finished', ''); }
  },
};

// ---------------------------------------------------------------- prestige (max level 50)
const MAX_LEVEL = 50;
const Prestige = {
  can() { return (Progress.stats.level || 1) >= MAX_LEVEL; },
  go() {
    if (!this.can()) return;
    if (!confirm(`Prestige? Your level goes back to 1, but you keep every discovery, get a ⭐ badge, +10% XP forever and 200 coins.`)) return;
    const S = Progress.stats; S.prestige = (S.prestige || 0) + 1; S.level = 1; S.xp = 0;
    Shop.add(200); Fun.updateHud();
    UI.bigText(`⭐ PRESTIGE ${S.prestige}!`, '#ffb020'); Sound.achievement();
    Save.markDirty(); Cloud.setProfile({});
    this.button();
  },
  button() {
    let b = $('btn-prestige');
    if (!b) { b = el('button'); b.id = 'btn-prestige'; b.className = 'primary'; b.onclick = () => this.go(); $('btn-play').after(b); }
    b.textContent = `⭐ Prestige (level ${MAX_LEVEL} reached!)`;
    b.style.display = this.can() ? '' : 'none';
  },
};

// ---------------------------------------------------------------- emotes & quick chat (multiplayer)
const EMOTES = [['wave', '👋', 'Wave'], ['dance', '💃', 'Dance'], ['clap', '👏', 'Clap'], ['thumbs', '👍', 'Nice!'], ['laugh', '😂', 'LOL'], ['help', '🆘', 'Help!'], ['look', '👀', 'Look!'], ['gg', '🏆', 'GG!']];
const Emotes = {
  init() {
    const bar = el('div'); bar.id = 'emote-bar'; bar.className = 'hidden';
    bar.innerHTML = EMOTES.map(([k, i, t]) => `<button data-e="${k}">${i}<small>${t}</small></button>`).join('');
    document.body.appendChild(bar);
    bar.querySelectorAll('button').forEach(b => b.onclick = () => { this.send(b.dataset.e); bar.classList.add('hidden'); });
    if (Touch.root) { const b = el('button'); b.dataset.a = 'emote'; b.textContent = '💬'; Touch.root.querySelector('.t-top').prepend(b); b.addEventListener('touchstart', (e) => { e.preventDefault(); bar.classList.toggle('hidden'); }, { passive: false }); }
  },
  update() {
    if (Input.pressed.has('KeyT') && G.started && !G.ui) $('emote-bar').classList.toggle('hidden');
    const n = +([...Input.pressed].find(c => /^Digit[1-8]$/.test(c)) || '').slice(5);
    if (n && !$('emote-bar').classList.contains('hidden')) { this.send(EMOTES[n - 1][0]); $('emote-bar').classList.add('hidden'); }
  },
  send(k) {
    const E = EMOTES.find(x => x[0] === k); if (!E) return;
    UI.toast(E[1], `You: ${E[2]}`, Net.on ? '' : 'Emotes are seen by other players in multiplayer.');
    if (Net.on) Net.send({ t: 'emote', e: k });
  },
  show(a, k) {
    const E = EMOTES.find(x => x[0] === k); if (!E || !a) return;
    a.emote = { k, t: 3 };
    if (!a.bubble) { a.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false })); a.bubble.scale.set(0.9, 0.45, 1); a.bubble.position.y = 2.6; a.g.add(a.bubble); }
    a.bubble.material.map = canvasTex(256, 128, (c, w, h) => { c.fillStyle = 'rgba(255,255,255,.95)'; roundRect(c, 6, 6, w - 12, h - 30, 30); c.fill(); c.beginPath(); c.moveTo(w / 2 - 14, h - 26); c.lineTo(w / 2, h - 6); c.lineTo(w / 2 + 14, h - 26); c.fill(); c.font = '56px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(E[1], 60, (h - 24) / 2 + 4); c.fillStyle = '#1d2230'; c.font = '800 38px ui-rounded, system-ui'; c.fillText(E[2], 160, (h - 24) / 2 + 4); });
    a.bubble.material.needsUpdate = true; a.bubble.visible = true;
  },
  animate(a, dt) {
    const m = a.emote; if (!m) return;
    m.t -= dt; const r = a.rig;
    if (m.k === 'wave') { r.arms[1].sh.rotation.z = -2.6; r.arms[1].el.rotation.z = Math.sin(G.rtime * 12) * 0.5; }
    if (m.k === 'dance') { r.root.rotation.y += dt * 6; r.hips.position.y += Math.abs(Math.sin(G.rtime * 10)) * 0.08; }
    if (m.k === 'clap') { for (const A of r.arms) { A.sh.rotation.x = -1.3; A.sh.rotation.z = -A.s * (0.5 + Math.sin(G.rtime * 18) * 0.25); } }
    if (m.k === 'thumbs' || m.k === 'gg') { r.arms[1].sh.rotation.x = -1.5; }
    if (m.k === 'help') { for (const A of r.arms) A.sh.rotation.z = -A.s * (2.6 + Math.sin(G.rtime * 10) * 0.3); }
    if (m.t <= 0) { a.emote = null; r.root.rotation.y = 0; if (a.bubble) a.bubble.visible = false; }
  },
};

// ---------------------------------------------------------------- install as an app (Android/desktop Chrome)
const Install = {
  evt: null,
  init() {
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this.evt = e; this.button(); });
    window.addEventListener('appinstalled', () => { const b = $('btn-install'); if (b) b.remove(); UI.toast('📲', 'Installed!', 'Open Elemental Lab from your home screen.'); });
    if (IS_IOS && !STANDALONE) { this.button(); }
  },
  button() {
    if ($('btn-install') || STANDALONE) return;
    const b = el('button'); b.id = 'btn-install'; b.textContent = '📲 Install app'; $('btn-share').after(b);
    b.onclick = async () => { if (this.evt) { this.evt.prompt(); const r = await this.evt.userChoice; if (r.outcome === 'accepted') b.remove(); this.evt = null; } else FullScreen.iosTip(true); };
  },
};

// ---------------------------------------------------------------- Easter eggs 🥚
const EGGS = {
  konami: ['🌈', 'Konami code!', 'Rainbow lab for 30 seconds.'],
  logo: ['⚗️', 'Secret alchemist', 'You poked the flask 7 times.'],
  fly: ['🕊️', 'I believe I can fly', 'Hold Space to rise for 20 seconds.'],
  hello: ['👋', 'Hello there!', 'The Codex says hi back.'],
  chicken: ['🐔', 'Which came first?', 'You made both the Chicken and the Egg.'],
  duck: ['🦆', 'Golden rubber duck', 'You found the duck hiding on the island.'],
  sky: ['🛸', 'Something up there…', 'You stared at the ceiling long enough.'],
  tidy: ['🧹', 'Clean freak', '10 things in the trash in 20 seconds.'],
  jumper: ['🦘', 'Table dancer', '15 jumps on the crafting table.'],
  midnight: ['🌙', 'Night owl', 'Crafting at midnight. Go to sleep!'],
  bhop: ['🐇', 'Bhop god', 'You bunny hopped past 480 u/s.'],
};
const Eggs = {
  found: [], seq: [], flyT: 0, upT: 0, trashT: [], jumps: 0,
  init() {
    this.found = Ext.take('eggs') || []; Ext.register('eggs', () => this.found);
    window.addEventListener('keydown', (e) => {
      this.seq.push(e.key.toLowerCase()); this.seq = this.seq.slice(-10);
      const s = this.seq.join(',');
      if (s.endsWith('arrowup,arrowup,arrowdown,arrowdown,arrowleft,arrowright,arrowleft,arrowright,b,a')) { this.find('konami'); this.rainbow(); }
      if (s.endsWith('f,l,y') && G.started) { this.find('fly'); this.flyT = 20; UI.toast('🕊️', 'Flight mode for 20 s', 'Hold Space to fly up.'); }
    });
    let n = 0; const logo = document.querySelector('.menu-card .logo');
    if (logo) logo.addEventListener('click', () => { if (++n === 7) { this.find('logo'); logo.style.transition = 'transform 1s'; logo.style.transform = 'rotate(720deg) scale(1.4)'; setTimeout(() => logo.style.transform = '', 1100); } });
    const cs = $('cx-search'); if (cs) cs.addEventListener('input', () => { if (/^hello$/i.test(cs.value.trim())) this.find('hello'); });
    // the hidden golden duck
    setTimeout(() => { try { const info = Universe.get('duck~golden') || Universe.get('duck'); const vis = buildVisual(info), m = buildItemMeshes(info, vis); m.inner.scale.setScalar(0.6); m.inner.position.set(Island.X1 - 3, 0.25, Island.Z0 + 2); Room.group.add(m.inner); this.duck = m.inner; } catch (e) { /* */ } }, 500);
  },
  find(k) {
    if (this.found.includes(k)) return;
    this.found.push(k); const E = EGGS[k];
    UI.bigText(`🥚 EASTER EGG!`, '#ff9ad8'); UI.toast(E[0], `Easter egg: ${E[1]}`, `${E[2]} (${this.found.length}/${Object.keys(EGGS).length} found) +15 🪙`);
    Shop.add(15); Sound.achievement(); Save.markDirty();
  },
  rainbow() { let t = 0; const iv = setInterval(() => { Room.wallMat.color.setHSL((t++ * 0.02) % 1, 0.7, 0.6); if (t > 300) { clearInterval(iv); Room.setWallHue(Progress.wallHue); } }, 100); },
  onCraft(info) {
    if (Progress.disc.has('chicken') && Progress.disc.has('egg') && (info.id === 'chicken' || info.id === 'egg')) this.find('chicken');
    const h = new Date().getHours(); if (h === 0) this.find('midnight');
  },
  onTrash() { const now = G.rtime; this.trashT = this.trashT.filter(t => now - t < 20); this.trashT.push(now); if (this.trashT.length >= 10) this.find('tidy'); },
  update(dt) {
    if (!G.started) return;
    if (this.flyT > 0) { this.flyT -= dt; if (Input.keys.has('Space')) Player.body.velocity.y = 4; }
    if (Player.pitch > 1.35 && G.camera.position.x < LAYOUT.room.x1) { this.upT += dt; if (this.upT > 5) { this.find('sky'); this.upT = -999; const u = spawnItem('ufo', new THREE.Vector3(G.camera.position.x, 12, G.camera.position.z - 3)); if (u) setTimeout(() => u.vanish(), 5000); } } else if (this.upT > 0) this.upT = 0;
    if (this.duck && G.camera.position.distanceTo(this.duck.position) < 2.5) this.find('duck');
    if (Input.pressed.has('Space') && Player.grounded && Player.body.position.y > LAYOUT.table.top - 0.2 && Math.abs(Player.body.position.x) < LAYOUT.table.w / 2) { if (++this.jumps >= 15) this.find('jumper'); }
  },
};

// ---------------------------------------------------------------- bunny hopping: speed meter + records
const Bhop = {
  chain: 0, best: 0, t: 0,
  init() {
    const m = el('div'); m.id = 'speedo'; m.className = 'hidden'; document.body.appendChild(m); this.el = m;
    this.best = Progress.stats.bhopBest || 0;
  },
  hop(speed) {
    this.chain++; this.t = 1.2;
    if (speed > this.best + 0.05) { this.best = speed; Progress.stats.bhopBest = +speed.toFixed(2); Save.markDirty(); }
    if (speed > 12) Eggs.find('bhop');
    if (this.chain === 10) UI.toast('🐇', 'Bunny hopper!', '10 hops in a row without losing speed.');
  },
  update(dt) {
    if (!Player.body || !G.started) return;
    const v = Player.body.velocity, hs = Math.hypot(v.x, v.z);
    this.t -= dt;
    if (Player.grounded && G.rtime - (Player.landT || 0) > 0.25) this.chain = 0;
    const show = hs > 6.6 || this.t > 0;
    this.el.classList.toggle('hidden', !show);
    if (show) { this.el.innerHTML = `<b>${Math.round(hs * 40)}</b><small>u/s${this.chain > 1 ? ` · 🐇×${this.chain}` : ''}</small>`; this.el.style.color = hs > 12 ? '#ff5ab0' : hs > 9 ? '#ffb020' : ''; }
  },
};

// ---------------------------------------------------------------- 🤖 AI code: your inventory, encoded so AI assistants can read it
const AICode = {
  init() {
    const b = el('button'); b.id = 'btn-aicode'; b.textContent = '🤖 AI code'; $('btn-share').after(b);
    b.onclick = () => this.copy();
  },
  make() {
    const names = Progress.order.map(id => { const I = Universe.get(id); return I ? I.name : null; }).filter(Boolean);
    const max = 1500;   // keep it short enough to paste into an AI chat
    const list = names.length > max ? names.slice(-max) : names;
    const body = `Elemental Lab v1|count=${names.length}|level=${Progress.stats.level || 1}|items=${list.join(';')}`;
    const b64 = btoa(unescape(encodeURIComponent(body)));
    return `[Elemental Lab AI code: decode the Base64 below to see every item this player has, then help them with recipe ideas]\nELAI1:${b64}`;
  },
  async copy() {
    const code = this.make();
    try { await navigator.clipboard.writeText(code); UI.toast('🤖', 'AI code copied!', `Paste it into an AI chat (like Claude) and ask "what should I make next?" (${fmtInt(Progress.order.length)} items)`); }
    catch (e) { prompt('Copy your AI code:', code); }
  },
};
