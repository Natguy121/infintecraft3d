// ============================================================================
//  ELEMENTAL LAB — 22a · Online accounts (Firebase): one login everywhere,
//  cloud saves, worldwide "first discoverer" and a global leaderboard.
//  Usernames map to hidden e-mails (name@players.elemental-lab.app) so
//  players only ever type a username and a password.
// ============================================================================

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyB9ObS61D0PrXFCN__Uz2iUppQowqRGSPs',
  authDomain: 'element-lab-f972b.firebaseapp.com',
  projectId: 'element-lab-f972b',
  storageBucket: 'element-lab-f972b.firebasestorage.app',
  messagingSenderId: '745387597734',
  appId: '1:745387597734:web:f83916c727d71fb3a3f967',
};

const Cloud = {
  app: null, auth: null, db: null, user: null, readyP: null, upT: null, ok: false,
  init() {
    if (this.app || location.protocol === 'file:') return;
    try {
      this.app = FB.initializeApp(FIREBASE_CONFIG);
      this.auth = FB.getAuth(this.app); this.db = FB.getFirestore(this.app);
      this.readyP = new Promise((res) => {
        const t = setTimeout(() => res(null), 6000);
        FB.onAuthStateChanged(this.auth, (u) => { this.user = u; clearTimeout(t); res(u); });
      });
      this.ok = true;
    } catch (e) { console.warn('cloud off', e); }
  },
  email(name) { return Accounts.norm(name).replace(/[^a-z0-9_.-]/g, '_') + '@players.elemental-lab.app'; },
  msg(e) {
    const c = (e && e.code) || '';
    if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-login')) return 'Wrong username or password';
    if (c.includes('email-already-in-use')) return 'That username is taken. Pick another, or tap Log in if it\'s yours.';
    if (c.includes('weak-password')) return 'Password must be at least 6 characters';
    if (c.includes('network')) return 'No internet connection. Online accounts need internet.';
    if (c.includes('too-many-requests')) return 'Too many tries. Wait a minute and try again.';
    if (c.includes('unauthorized-domain')) return 'This website isn\'t allowed in Firebase yet (Authentication → Settings → Authorized domains).';
    if (c.includes('operation-not-allowed')) return 'Email/Password sign-in isn\'t turned on in Firebase yet.';
    if (c.includes('permission-denied')) return 'The online database refused the request (check the Firestore rules).';
    return (e && e.message) || 'Something went wrong';
  },
  async signUp(name, pw) {
    const cred = await FB.createUserWithEmailAndPassword(this.auth, this.email(name), pw);
    this.user = cred.user;
    await FB.setDoc(FB.doc(this.db, 'users', cred.user.uid), { name: String(name).trim().slice(0, 20), disc: Progress.order.length, level: Progress.stats.level || 1, t: Date.now() });
    return cred.user;
  },
  async logIn(name, pw) { const cred = await FB.signInWithEmailAndPassword(this.auth, this.email(name), pw); this.user = cred.user; return cred.user; },
  async logOut() { try { await FB.signOut(this.auth); } catch (e) { /* */ } },

  /** before the local save is read: pull the cloud copy if it's newer */
  async pull() {
    const cur = Accounts.current();
    if (!cur || !cur.startsWith('c:') || !this.ok) return;
    const u = await this.readyP;
    if (!u || 'c:' + u.uid !== cur) return;
    try {
      const snap = await FB.getDoc(FB.doc(this.db, 'saves', u.uid));
      if (!snap.exists()) return;
      const d = snap.data();
      const local = localStorage.getItem(Accounts.key(cur));
      let lt = 0; try { if (local && !local.startsWith('ELAB')) lt = JSON.parse(local).t || 0; else lt = +localStorage.getItem(Accounts.key(cur) + '.t') || 0; } catch (e) { /* */ }
      if ((d.t || 0) > lt && typeof d.data === 'string') { localStorage.setItem(Accounts.key(cur), d.data); localStorage.setItem(Accounts.key(cur) + '.t', String(d.t)); }
    } catch (e) { console.warn('pull failed', e); }
  },
  /** after every local save, upload (debounced) */
  schedule(raw) {
    const cur = Accounts.current();
    if (!cur || !cur.startsWith('c:') || !this.user) return;
    this.pending = raw;
    clearTimeout(this.upT); this.upT = setTimeout(() => this.push(), 8000);
  },
  async push() {
    const raw = this.pending; if (!raw || !this.user) return; this.pending = null;
    if (raw.length > 950000) { if (!this.warned) { this.warned = true; UI.toast('☁️', 'Save too big for the cloud', 'Your progress is still saved on this device.'); } return; }
    const t = Date.now();
    try {
      localStorage.setItem(Accounts.key('c:' + this.user.uid) + '.t', String(t));
      await FB.setDoc(FB.doc(this.db, 'saves', this.user.uid), { data: raw, t });
      await FB.setDoc(FB.doc(this.db, 'users', this.user.uid), { ...this.profile(), disc: this.discOf(raw), t }, { merge: true });
    } catch (e) { console.warn('push failed', e); this.pending = this.pending || raw; }
  },
  OWNER: 'natguy121',
  isOwner() { return !!(this.user && this.user.email === this.email(this.OWNER)); },
  profile() {
    const name = localStorage.getItem('elementalLab.cloudName') || Accounts.displayName() || 'Player';
    return { name, nameLower: name.toLowerCase(), level: Progress.stats.level || 1, prestige: Progress.stats.prestige || 0, runs: Object.keys(Speedrun.best || {}).length, firsts: Progress.stats.worldFirsts || 0, recent: Progress.order.slice(-20).map(id => { try { const i = Universe.get(id); return (i.emoji || '') + ' ' + i.name; } catch (e) { return null; } }).filter(Boolean) };
  },
  async setProfile(extra) { if (!this.user) return; try { await FB.setDoc(FB.doc(this.db, 'users', this.user.uid), { ...this.profile(), ...extra, t: Date.now() }, { merge: true }); } catch (e) { console.warn('profile', e); } },
  discOf(raw) { try { if (!raw.startsWith('ELAB')) return (JSON.parse(raw).order || []).length; } catch (e) { /* */ } return Progress.order.length; },
  flush() { if (this.pending) { clearTimeout(this.upT); this.push(); } },

  /** worldwide first discoverer: claim it if nobody has */
  async claimFirst(info) {
    if (!this.user || info.kind === 'llm') return;
    const ref = FB.doc(this.db, 'firsts', info.id.replace(/\//g, '_').slice(0, 1400));
    try {
      const won = await FB.runTransaction(this.db, async (tx) => {
        const s = await tx.get(ref); if (s.exists()) return false;
        tx.set(ref, { name: localStorage.getItem('elementalLab.cloudName') || 'Player', uid: this.user.uid, t: Date.now(), item: info.name, emoji: info.emoji || '' }); return true;
      });
      if (won) { Progress.stats.worldFirsts = (Progress.stats.worldFirsts || 0) + 1; Save.markDirty(); UI.toast('🌍', `WORLD FIRST: ${info.name}!`, 'Nobody in the world had made this before you. Your name is on it! +50 XP'); Fun.gain(50, null); }
    } catch (e) { /* offline or rules */ }
  },
  async firstOf(id) {
    if (!this.ok) return null;
    try { const s = await FB.getDoc(FB.doc(this.db, 'firsts', id.replace(/\//g, '_').slice(0, 1400))); return s.exists() ? s.data() : null; } catch (e) { return null; }
  },
  async top(field = 'disc', n = 15) {
    if (!this.ok) return [];
    const q = FB.query(FB.collection(this.db, 'users'), FB.orderBy(field, 'desc'), FB.limit(n));
    const s = await FB.getDocs(q); return s.docs.map(d => ({ uid: d.id, ...d.data() }));
  },
};
