// ============================================================================
//  ELEMENTAL LAB — 22e · Online hub: leaderboards, world-first hall of fame,
//  friends and public multiplayer rooms (all on Firebase)
// ============================================================================

const Social = {
  tab: 'top', sub: 'disc', friends: [], pubT: 0,
  init() {
    const p = el('div'); p.id = 'soc-panel'; p.className = 'hidden';
    p.innerHTML = `<div class="acct-card soc-card"><button class="x" id="soc-x">✕</button><h2>🌍 Online</h2>
      <div class="tabs soc-tabs"><button data-t="top" class="on">🏆 Leaderboard</button><button data-t="firsts">🌍 World firsts</button><button data-t="friends">👫 Friends</button><button data-t="rooms">🚪 Public rooms</button></div>
      <div id="soc-body"></div></div>`;
    document.body.appendChild(p);
    $('soc-x').onclick = () => p.classList.add('hidden');
    p.querySelectorAll('.soc-tabs button').forEach(b => b.onclick = () => { this.tab = b.dataset.t; p.querySelectorAll('.soc-tabs button').forEach(x => x.classList.toggle('on', x === b)); this.render(); });
    const btn = el('button'); btn.id = 'btn-online'; btn.textContent = '🌍 Online'; $('btn-mp').before(btn);
    btn.onclick = () => this.open();
    const mp = $('mp-start'); if (mp) { const b = el('button'); b.id = 'mp-public'; b.style.width = '100%'; b.style.marginTop = '8px'; b.textContent = '🚪 Join any public game'; mp.appendChild(b); b.onclick = () => { $('mp-panel').classList.add('hidden'); this.open('rooms'); }; }
  },
  me() { return Cloud.user ? Cloud.user.uid : null; },
  open(tab) {
    if (tab) { this.tab = tab; document.querySelectorAll('.soc-tabs button').forEach(x => x.classList.toggle('on', x.dataset.t === tab)); }
    $('soc-panel').classList.remove('hidden'); this.render();
  },
  needLogin(box) { box.innerHTML = `<p class="acct-note">Log in to use this. Tap <b>Log in / Sign up</b> on the main menu.</p>`; },
  async render() {
    const box = $('soc-body'); box.innerHTML = '<div class="acct-empty">Loading…</div>';
    if (!Cloud.ok) { box.innerHTML = '<p class="acct-note">The online hub needs the website version with internet.</p>'; return; }
    try {
      if (this.tab === 'top') await this.renderTop(box);
      else if (this.tab === 'firsts') await this.renderFirsts(box);
      else if (this.tab === 'friends') await this.renderFriends(box);
      else await this.renderRooms(box);
    } catch (e) { box.innerHTML = `<p class="acct-note">❌ ${escHtml(Cloud.msg(e))}</p>`; }
  },
  row(i, name, right, me, extra = '') {
    const d = el('div'); d.className = 'acct-p' + (me ? ' me' : '');
    d.innerHTML = `<span class="rk">${i < 3 ? ['🥇', '🥈', '🥉'][i] : '#' + (i + 1)}</span><span class="nm"></span><span class="ct">${right}</span>${extra}`;
    d.querySelector('.nm').textContent = name; return d;
  },
  stars(u) { return u.prestige ? ' ' + '⭐'.repeat(Math.min(5, u.prestige)) : ''; },
  async renderTop(box) {
    const subs = { disc: '🧪 Discoveries', level: '⭐ Level', runs: '⏱️ Speedruns', firsts: '🌍 World firsts' };
    const rows = await Cloud.top(this.sub, 25);
    box.innerHTML = `<div class="soc-sub">${Object.entries(subs).map(([k, v]) => `<button data-s="${k}" class="${k === this.sub ? 'on' : ''}">${v}</button>`).join('')}</div><div id="soc-list"></div>`;
    box.querySelectorAll('.soc-sub button').forEach(b => b.onclick = () => { this.sub = b.dataset.s; this.render(); });
    const list = $('soc-list');
    if (!rows.length) list.innerHTML = '<div class="acct-empty">No players yet. Be the first!</div>';
    rows.forEach((u, i) => {
      const v = this.sub === 'disc' ? `${fmtInt(u.disc || 0)} 🧪` : this.sub === 'level' ? `Lv ${u.level || 1}${this.stars(u)}` : this.sub === 'runs' ? `${u.runs || 0} ⏱️` : `${u.firsts || 0} 🌍`;
      list.appendChild(this.row(i, (u.name || 'Player') + this.stars(u), v, u.uid === this.me()));
    });
  },
  async renderFirsts(box) {
    const q = FB.query(FB.collection(Cloud.db, 'firsts'), FB.orderBy('t', 'desc'), FB.limit(40));
    const s = await FB.getDocs(q);
    const mine = Progress.stats.worldFirsts || 0;
    box.innerHTML = `<p class="acct-note">The first person in the world to make an item gets their name on it forever. ${this.me() ? `You have <b>${mine}</b> world first${mine === 1 ? '' : 's'}.` : ''}</p><div id="soc-list"></div>`;
    const list = $('soc-list');
    if (s.empty) list.innerHTML = '<div class="acct-empty">Nothing yet. Discover something new while logged in!</div>';
    s.docs.forEach((d) => {
      const f = d.data(), r = el('div'); r.className = 'acct-p' + (f.uid === this.me() ? ' me' : '');
      r.innerHTML = `<span class="rk">${escHtml(f.emoji || '✨')}</span><span class="nm"></span><span class="ct"></span>`;
      r.querySelector('.nm').textContent = f.item || d.id; r.querySelector('.ct').textContent = `by ${f.name} · ${new Date(f.t).toLocaleDateString()}`;
      list.appendChild(r);
    });
  },
  async loadFriends() {
    if (!this.me()) return [];
    const s = await FB.getDoc(FB.doc(Cloud.db, 'users', this.me()));
    const ids = (s.exists() && s.data().friends) || [];
    const out = [];
    for (const id of ids.slice(0, 50)) { try { const d = await FB.getDoc(FB.doc(Cloud.db, 'users', id)); if (d.exists()) out.push({ uid: id, ...d.data() }); } catch (e) { /* */ } }
    return (this.friends = out);
  },
  async renderFriends(box) {
    if (!this.me()) return this.needLogin(box);
    const fr = await this.loadFriends();
    box.innerHTML = `<div class="acct-btns"><input id="fr-name" placeholder="Friend's username" maxlength="20" style="margin:0"><button id="fr-add">➕ Add</button></div><div id="fr-msg" class="acct-note"></div><div id="soc-list"></div>`;
    $('fr-name').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') $('fr-add').click(); });
    $('fr-add').onclick = () => this.addFriend($('fr-name').value);
    const list = $('soc-list');
    if (!fr.length) list.innerHTML = '<div class="acct-empty">No friends yet. Add someone by their username!</div>';
    const now = Date.now();
    fr.sort((a, b) => (b.disc || 0) - (a.disc || 0)).forEach((u, i) => {
      const live = u.room && now - (u.roomT || 0) < 90000;
      const r = this.row(i, (u.name || 'Player') + this.stars(u), `Lv ${u.level || 1} · ${fmtInt(u.disc || 0)} 🧪`, false, live ? `<button class="fr-join">Join</button>` : '');
      r.title = live ? 'Playing in a room right now' : '';
      if (live) r.querySelector('.fr-join').onclick = () => { $('soc-panel').classList.add('hidden'); Net.join(u.room); $('mp-panel').classList.remove('hidden'); };
      const rm = el('button'); rm.textContent = '✕'; rm.className = 'fr-rm'; rm.title = 'Remove friend'; rm.onclick = () => this.removeFriend(u.uid); r.appendChild(rm);
      list.appendChild(r);
    });
  },
  async addFriend(name) {
    const m = $('fr-msg'); const n = String(name || '').trim().toLowerCase();
    if (!n) { m.textContent = 'Type a username.'; return; }
    const s = await FB.getDocs(FB.query(FB.collection(Cloud.db, 'users'), FB.where('nameLower', '==', n), FB.limit(1)));
    if (s.empty) { m.textContent = `❌ No player called "${name}".`; return; }
    const id = s.docs[0].id; if (id === this.me()) { m.textContent = 'That\'s you! 😄'; return; }
    const ids = [...new Set([...this.friends.map(f => f.uid), id])];
    await Cloud.setProfile({ friends: ids });
    m.textContent = `✅ Added ${s.docs[0].data().name}!`; this.render();
  },
  async removeFriend(id) { await Cloud.setProfile({ friends: this.friends.map(f => f.uid).filter(x => x !== id) }); this.render(); },
  async renderRooms(box) {
    if (!this.me()) return this.needLogin(box);
    const since = Date.now() - 90000;
    const s = await FB.getDocs(FB.query(FB.collection(Cloud.db, 'rooms'), FB.where('t', '>', since), FB.orderBy('t', 'desc'), FB.limit(20)));
    const rooms = s.docs.map(d => ({ code: d.id, ...d.data() })).filter(r => r.open && r.uid !== this.me());
    box.innerHTML = `<p class="acct-note">Jump into someone's lab, no code needed. Hosting? Tick "Public" in Multiplayer so others can find you.</p><button class="primary" id="room-host" style="width:100%">➕ Host a public game</button><div id="soc-list" style="margin-top:10px"></div>`;
    $('room-host').onclick = () => { $('soc-panel').classList.add('hidden'); Net.isPublic = true; Net.host(); $('mp-panel').classList.remove('hidden'); };
    const list = $('soc-list');
    if (!rooms.length) list.innerHTML = '<div class="acct-empty">No public games right now. Host one!</div>';
    rooms.forEach((r, i) => {
      const d = this.row(i, `${r.name || 'Player'}'s lab`, `${r.players || 1} 👤`, false, '<button class="fr-join">Join</button>');
      d.querySelector('.rk').textContent = '🚪';
      d.querySelector('.fr-join').onclick = () => { $('soc-panel').classList.add('hidden'); Net.join(r.code); $('mp-panel').classList.remove('hidden'); };
      list.appendChild(d);
    });
  },
  // heartbeat for a hosted public room + "friend is in a room" status
  async beat(force) {
    if (!Cloud.user || !Net.peer || !Net.code) return;
    if (!force && G.rtime - this.pubT < 30) return; this.pubT = G.rtime;
    const t = Date.now();
    try {
      if (Net.isHost && Net.isPublic) await FB.setDoc(FB.doc(Cloud.db, 'rooms', Net.code), { uid: Cloud.user.uid, name: localStorage.getItem('elementalLab.cloudName') || 'Player', players: Net.avatars.size + 1, t, open: true });
      await FB.setDoc(FB.doc(Cloud.db, 'users', Cloud.user.uid), { room: Net.code, roomT: t }, { merge: true });
    } catch (e) { /* offline */ }
  },
  async closeRoom(code) {
    if (!Cloud.user) return;
    try { if (code) await FB.deleteDoc(FB.doc(Cloud.db, 'rooms', code)); } catch (e) { /* not ours */ }
    try { await FB.setDoc(FB.doc(Cloud.db, 'users', Cloud.user.uid), { room: null }, { merge: true }); } catch (e) { /* */ }
  },
  update() { if (Net.peer) this.beat(false); },
};
