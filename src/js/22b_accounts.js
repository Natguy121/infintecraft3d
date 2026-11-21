// ============================================================================
//  ELEMENTAL LAB — 22b · Local accounts: sign up / log in so each player on
//  this device keeps their own discoveries. Passwords are salted + hashed
//  (SHA-256) and everything stays in this browser's localStorage.
// ============================================================================

const Accounts = {
  LS: 'elementalLab.accounts.v1', LS_USER: 'elementalLab.user.v1',
  list() { try { return JSON.parse(localStorage.getItem(this.LS) || '{}'); } catch (e) { return {}; } },
  store(a) { try { localStorage.setItem(this.LS, JSON.stringify(a)); } catch (e) { /* ignore */ } },
  current() { try { const u = localStorage.getItem(this.LS_USER); return u && this.list()[u] ? u : null; } catch (e) { return null; } },
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

  async signUp(name, pw) {
    const n = this.norm(name), a = this.list();
    if (!/^[a-z0-9_ .-]{3,20}$/.test(n)) throw new Error('Username must be 3–20 letters, numbers, spaces, _ . or -');
    if (String(pw).length < 4) throw new Error('Password must be at least 4 characters');
    if (a[n]) throw new Error('That username is taken on this device');
    const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    a[n] = { display: String(name).trim(), salt, hash: await this.hash(pw, salt), created: Date.now(), disc: 4 };
    this.store(a);
    this.switchTo(n);
  },

  async logIn(name, pw) {
    const n = this.norm(name), u = this.list()[n];
    if (!u || (await this.hash(pw, u.salt)) !== u.hash) throw new Error('Wrong username or password');
    this.switchTo(n);
  },

  logOut() { this.switchTo(null); },

  switchTo(n) {
    try { if (Save.dirty || G.started) Save.save(); } catch (e) { /* ignore */ }
    try { if (n) localStorage.setItem(this.LS_USER, n); else localStorage.removeItem(this.LS_USER); } catch (e) { /* ignore */ }
    location.reload();
  },

  /** called on every save: keep the player list's discovery count fresh */
  touch(count) {
    const n = this.current(); if (!n) return;
    const a = this.list(); if (!a[n]) return;
    a[n].disc = count; a[n].last = Date.now(); this.store(a);
  },

  displayName() { const n = this.current(); return n ? this.list()[n].display : null; },

  // ---------------------------------------------------------------- UI
  init() {
    const row = $('acct-row'); if (!row) return;
    const who = this.displayName();
    row.innerHTML = who
      ? `<span>👤 Signed in as <b></b> · ${fmtInt(Progress.order.length)} discoveries</span> <button id="acct-switch">Switch</button> <button id="acct-out">Log out</button>`
      : `<span>👤 Playing as <b>Guest</b></span> <button id="acct-in" class="primary-s">Log in / Sign up</button>`;
    if (who) row.querySelector('b').textContent = who;
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
    const a = this.list(), cur = this.current();
    const rows = Object.entries(a).sort((x, y) => (y[1].disc || 0) - (x[1].disc || 0));
    const box = $('acct-players'); box.innerHTML = '';
    if (!rows.length) { box.innerHTML = '<div class="acct-empty">No accounts on this device yet. Create one above!</div>'; }
    rows.forEach(([n, u], i) => {
      const d = el('div'); d.className = 'acct-p' + (n === cur ? ' me' : '');
      d.innerHTML = `<span class="rk">#${i + 1}</span><span class="nm"></span><span class="ct">${fmtInt(u.disc || 0)} 🧪</span>`;
      d.querySelector('.nm').textContent = u.display;
      d.onclick = () => { $('acct-name').value = u.display; $('acct-pw').focus(); };
      box.appendChild(d);
    });
    setTimeout(() => $('acct-name').focus(), 50);
  },
};
