// ============================================================================
//  ELEMENTAL LAB — 22b · Local accounts: sign up / log in so each player on
//  this device keeps their own discoveries. Passwords are salted + hashed
//  (SHA-256) and everything stays in this browser's localStorage.
// ============================================================================

const Accounts = {
  LS: 'elementalLab.accounts.v1', LS_USER: 'elementalLab.user.v1',
  list() { try { return JSON.parse(localStorage.getItem(this.LS) || '{}'); } catch (e) { return {}; } },
  store(a) { try { localStorage.setItem(this.LS, JSON.stringify(a)); } catch (e) { /* ignore */ } },
  current() { try { const u = localStorage.getItem(this.LS_USER); return u && (u.startsWith('c:') || this.list()[u]) ? u : null; } catch (e) { return null; } },
  key(name) { return name ? 'elementalLab.save.v1.u.' + name : 'elementalLab.save.v1'; },
  norm(n) { return String(n || '').trim().toLowerCase(); },

  async hash(pw, salt) {
    const txt = salt + ':' + pw;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(txt));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h = ''; for (let i = 0; i < 8; i++) h += (hashStr(txt + i, 7919 + i) >>> 0).toString(16).padStart(8, '0');
    return h;
  },

  validName(name) {
    const n = this.norm(name);
    if (!/^[a-z0-9_ .-]{3,20}$/.test(n)) throw new Error('Username must be 3–20 letters, numbers, spaces, _ . or -');
    return n;
  },
  /** online account: the new account starts with everything discovered so far */
  async signUp(name, pw) {
    this.validName(name);
    if (String(pw).length < 6) throw new Error('Password must be at least 6 characters');
    if (!Cloud.ok) throw new Error('Online accounts need the website version with internet.');
    let u; try { u = await Cloud.signUp(name, pw); } catch (e) { throw new Error(Cloud.msg(e)); }
    await this.adopt(u, String(name).trim(), JSON.stringify(Save.data()));
  },
  async adopt(u, display, raw) {
    const k = 'c:' + u.uid;
    try { localStorage.setItem('elementalLab.cloudName', display); if (raw) { localStorage.setItem(this.key(k), raw); localStorage.setItem(this.key(k) + '.t', String(Date.now())); } } catch (e) { /* */ }
    if (raw) { Cloud.pending = raw; try { await Cloud.push(); } catch (e) { /* retried later */ } }
    this.carried = true; this.switchTo(k);
  },

  async logIn(name, pw) {
    const n = this.norm(name);
    if (!n) throw new Error('Type your username first');
    if (!Cloud.ok) throw new Error('Online accounts need the website version with internet.');
    try {
      const u = await Cloud.logIn(name, pw);
      let display = String(name).trim();
      try { const s = await FB.getDoc(FB.doc(Cloud.db, 'users', u.uid)); if (s.exists() && s.data().name) display = s.data().name; } catch (e) { /* */ }
      await this.adopt(u, display, null);
    } catch (e) {
      // an old on-this-device account with the same name & password moves online automatically
      const old = this.list()[n];
      const c = (e && e.code) || '';
      if (old && (c.includes('invalid-credential') || c.includes('user-not-found') || c.includes('invalid-login')) && (await this.hash(String(pw), old.salt)) === old.hash) {
        if (String(pw).length < 6) throw new Error('Your old password is too short for online accounts. Create a new account with a 6+ character password.');
        let u; try { u = await Cloud.signUp(name, pw); } catch (e2) { throw new Error(Cloud.msg(e2)); }
        const raw = localStorage.getItem(this.key(n)) || JSON.stringify(Save.data());
        UI.toast('☁️', 'Account moved online!', 'Your old account and discoveries now work on every device.');
        await this.adopt(u, old.display || String(name).trim(), raw);
        return;
      }
      throw new Error(e && e.code ? Cloud.msg(e) : e.message);
    }
  },

  async logOut() { Cloud.flush(); await Cloud.logOut(); this.switchTo(null); },

  switchTo(n) {
    try { if (!this.carried && (Save.dirty || G.started)) Save.save(); } catch (e) { /* ignore */ }
    Save.dirty = false; Save.locked = true;   // nothing may write into the new account's save while we reload
    try { if (n) localStorage.setItem(this.LS_USER, n); else localStorage.removeItem(this.LS_USER); } catch (e) { /* ignore */ }
    location.reload();
  },

  /** called on every save: keep the player list's discovery count fresh */
  touch(count) {
    const n = this.current(); if (!n || n.startsWith('c:')) return;
    const a = this.list(); if (!a[n]) return;
    a[n].disc = count; a[n].last = Date.now(); this.store(a);
  },

  /** read the Guest save (raw or compressed) */
  async guestData() {
    try {
      let raw = localStorage.getItem(this.key(null)); if (!raw) return null;
      if (raw.startsWith('ELAB')) raw = await Save.decode(raw);
      return JSON.parse(raw);
    } catch (e) { return null; }
  },
  async guestExtra() {
    const d = await this.guestData(); if (!d) return 0;
    return (d.order || []).filter(id => !Progress.disc.has(id) && Universe.isValidId(id)).length;
  },
  /** merge the Guest's discoveries and recipes into the signed-in account */
  async mergeGuest() {
    const d = await this.guestData(); if (!d) return 0;
    if (d.llm) { for (const [id, it] of Object.entries(d.llm.items || {})) if (!Universe.llmItems.has(id)) Universe.llmItems.set(id, it); for (const [k, id] of Object.entries(d.llm.pairs || {})) if (!Universe.llmPairs.has(k)) Universe.llmPairs.set(k, id); }
    let added = 0;
    for (const id of d.order || []) if (!Progress.disc.has(id) && Universe.isValidId(id)) { Progress.disc.set(id, Progress.order.length); Progress.order.push(id); added++; }
    let rn = 0;
    for (const [k, arr] of Object.entries(d.rec || {})) { const s = Progress.recipes.get(k) || new Set(); for (const r of arr) s.add(r); Progress.recipes.set(k, s); }
    for (const s of Progress.recipes.values()) rn += s.size;
    Progress.stats.recipes = rn;
    for (const a of d.ach || []) Progress.ach.add(a);
    Codex.dirty = true; UI.updateHud(); Save.save();
    return added;
  },

  displayName() { const n = this.current(); if (!n) return null; if (n.startsWith('c:')) return localStorage.getItem('elementalLab.cloudName') || 'Player'; return this.list()[n].display; },

  // ---------------------------------------------------------------- UI
  init() {
    const row = $('acct-row'); if (!row) return;
    const who = this.displayName();
    row.innerHTML = who
      ? `<span>👤 Signed in as <b></b> · ${fmtInt(Progress.order.length)} discoveries</span> <button id="acct-switch">Switch</button> <button id="acct-out">Log out</button>`
      : `<span>👤 Playing as <b>Guest</b></span> <button id="acct-in" class="primary-s">Log in / Sign up</button>`;
    if (who) {
      row.querySelector('b').textContent = who;
      this.guestExtra().then((x) => {
        if (!x) return;
        const b = el('button'); b.className = 'primary-s'; b.textContent = `📥 Bring over ${fmtInt(x)} Guest discoveries`;
        b.onclick = async () => { b.disabled = true; const n = await this.mergeGuest(); b.textContent = `✅ Added ${fmtInt(n)} discoveries`; row.querySelector('span').lastChild.textContent = ` · ${fmtInt(Progress.order.length)} discoveries`; UI.toast('📥', 'Discoveries brought over', `${fmtInt(n)} items from Guest are now in your account.`); };
        row.appendChild(b);
      });
    }
    const open = () => this.openPanel();
    $('acct-in') && ($('acct-in').onclick = open);
    $('acct-switch') && ($('acct-switch').onclick = open);
    $('acct-out') && ($('acct-out').onclick = () => this.logOut());
    $('acct-close').onclick = () => $('acct-panel').classList.add('hidden');
    const go = (fn) => async () => {
      const m = $('acct-msg'); m.textContent = '';
      try { await fn($('acct-name').value, $('acct-pw').value); m.textContent = '✅ Loading your lab…'; }
      catch (e) { m.textContent = '❌ ' + e.message; }
    };
    $('acct-login').onclick = go((a, b) => this.logIn(a, b));
    $('acct-signup').onclick = go((a, b) => this.signUp(a, b));
    $('acct-pw').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('acct-login').click(); e.stopPropagation(); });
    $('acct-name').addEventListener('keydown', (e) => e.stopPropagation());
  },

  openPanel() {
    $('acct-panel').classList.remove('hidden'); $('acct-msg').textContent = '';
    const box = $('acct-players'); box.innerHTML = '<div class="acct-empty">Loading…</div>';
    const cur = this.current(), me = cur && cur.startsWith('c:') ? cur.slice(2) : null;
    Cloud.top().then(rows => {
      box.innerHTML = rows.length ? '' : '<div class="acct-empty">No players yet. Be the first!</div>';
      rows.forEach((u, i) => {
        const d = el('div'); d.className = 'acct-p' + (u.uid === me ? ' me' : '');
        d.innerHTML = `<span class="rk">${['🥇', '🥈', '🥉'][i] || '#' + (i + 1)}</span><span class="nm"></span><span class="ct">${fmtInt(u.disc || 0)} 🧪 · Lv ${u.level || 1}</span>`;
        d.querySelector('.nm').textContent = u.name || 'Player';
        box.appendChild(d);
      });
    }).catch(() => { box.innerHTML = '<div class="acct-empty">Leaderboard needs internet.</div>'; });
    setTimeout(() => $('acct-name').focus(), 50);
  },
};
