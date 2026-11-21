// ============================================================================
//  ELEMENTAL LAB — 11 · Audio: fully synthesized (no files). Material-specific
//  impacts, rarity-scaled merge stingers, UI cues and generative ambient music.
// ============================================================================

const Sound = {
  ctx: null, master: null, sfx: null, music: null, verb: null, verbSend: null, noise: null, muted: false,
  lastImpact: 0, charge: null, musicTimer: null, nextChord: 0, chordIdx: 0, nextBell: 0, beatOn: false, nextBeat: 0,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    comp.connect(ctx.destination);
    this.master = ctx.createGain(); this.master.connect(comp);
    this.sfx = ctx.createGain(); this.sfx.connect(this.master);
    this.music = ctx.createGain(); this.music.connect(this.master);
    // reverb
    this.verb = ctx.createConvolver();
    this.verb.buffer = this.impulse(2.6, 2.4);
    const verbOut = ctx.createGain(); verbOut.gain.value = 0.55;
    this.verb.connect(verbOut); verbOut.connect(this.master);
    this.verbSend = ctx.createGain(); this.verbSend.gain.value = 1; this.verbSend.connect(this.verb);
    // shared noise buffer
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.applyVolumes();
    this.startMusic();
  },
  impulse(sec, decay) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * sec);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  },
  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.muted ? 0 : Settings.vol, t, 0.05);
    this.music.gain.setTargetAtTime(Settings.music * 0.32, t, 0.3);
  },
  toggleMute() { this.muted = !this.muted; this.applyVolumes(); return this.muted; },
  get now() { return this.ctx ? this.ctx.currentTime : 0; },

  // ---------------------------------------------------------- primitives
  out(pan = 0, verb = 0.15, dest) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    let node = g;
    if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); node = p; }
    node.connect(dest || this.sfx);
    if (verb > 0) { const s = ctx.createGain(); s.gain.value = verb; node.connect(s); s.connect(this.verbSend); }
    return g;
  },
  tone(freq, dur, { type = 'sine', vol = 0.2, attack = 0.005, glide = 0, delay = 0, pan = 0, verb = 0.15, filter = 0, q = 1, dest, detune = 0 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, glide), t + dur);
    const g = this.out(pan, verb, dest);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let src = o;
    if (filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; f.Q.value = q; o.connect(f); src = f; }
    src.connect(g);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noiseBurst(dur, { vol = 0.2, type = 'lowpass', freq = 800, q = 1, attack = 0.002, delay = 0, pan = 0, verb = 0.1, sweep = 0 } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = this.out(pan, verb);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  },
  bell(freq, { vol = 0.12, dur = 1.2, delay = 0, pan = 0, verb = 0.5, dest } = {}) {
    if (!this.ctx) return;
    const ctx = this.ctx, t = ctx.currentTime + delay;
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain();
    car.frequency.value = freq; mod.frequency.value = freq * 3.5;
    mg.gain.setValueAtTime(freq * 2.2, t); mg.gain.exponentialRampToValueAtTime(1, t + dur);
    mod.connect(mg); mg.connect(car.frequency);
    const g = this.out(pan, verb, dest);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    car.connect(g);
    car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
  },

  // pan + distance attenuation for a world position
  spatial(pos) {
    if (!pos || !G.camera) return { pan: 0, att: 1 };
    _v1.copy(pos).sub(G.camera.position);
    const dist = _v1.length();
    _v1.normalize();
    _v2.set(1, 0, 0).applyQuaternion(G.camera.quaternion);
    return { pan: _v1.dot(_v2) * 0.7, att: clamp(1.6 / (1 + dist * 0.45), 0.08, 1) };
  },

  // ---------------------------------------------------------- material impacts
  impact(material, strength, pos, size = 0.2) {
    if (!this.ctx || strength < 0.6) return;
    const now = performance.now();
    if (now - this.lastImpact < 18) return;
    this.lastImpact = now;
    const { pan, att } = this.spatial(pos);
    const v = clamp(strength / 7, 0.05, 1) * att;
    const pitch = clamp(0.2 / size, 0.6, 1.8) * (0.92 + Math.random() * 0.16);
    switch (material) {
      case 'stone': case 'soil': case 'clay':
        this.noiseBurst(0.12, { vol: 0.35 * v, freq: 700 * pitch, pan });
        this.tone(95 * pitch, 0.16, { vol: 0.4 * v, glide: 55, pan, verb: 0.05 });
        break;
      case 'metal': case 'gold': {
        const f = 420 * pitch;
        [1, 2.76, 5.4, 8.93].forEach((r, i) => this.tone(f * r, 0.9 / (1 + i * 0.6), { vol: 0.13 * v / (1 + i), pan, verb: 0.25 }));
        this.noiseBurst(0.03, { vol: 0.2 * v, type: 'highpass', freq: 3000, pan });
        break;
      }
      case 'glass': case 'crystal': case 'ice': case 'candy':
        this.tone(2200 * pitch, 0.32, { vol: 0.14 * v, pan, verb: 0.35 });
        this.tone(2200 * pitch * 2.13, 0.2, { vol: 0.07 * v, pan, verb: 0.35 });
        this.noiseBurst(0.02, { vol: 0.12 * v, type: 'highpass', freq: 5000, pan });
        break;
      case 'wood':
        this.noiseBurst(0.06, { vol: 0.3 * v, type: 'bandpass', freq: 950 * pitch, q: 3, pan });
        this.tone(190 * pitch, 0.09, { type: 'triangle', vol: 0.32 * v, pan, verb: 0.05 });
        break;
      case 'liquid':
        this.tone(260 * pitch, 0.11, { vol: 0.32 * v, glide: 760 * pitch, pan, verb: 0.2 });
        this.noiseBurst(0.08, { vol: 0.08 * v, freq: 1500, pan });
        break;
      case 'gas':
        this.noiseBurst(0.3, { vol: 0.12 * v, type: 'bandpass', freq: 1200, q: 0.6, attack: 0.06, pan, sweep: 500 });
        break;
      case 'fire':
        for (let i = 0; i < 5; i++) this.noiseBurst(0.025, { vol: 0.16 * v, type: 'highpass', freq: 1500 + Math.random() * 2500, delay: Math.random() * 0.18, pan });
        this.noiseBurst(0.25, { vol: 0.1 * v, freq: 500, attack: 0.03, pan });
        break;
      case 'energy':
        this.tone(700 * pitch, 0.16, { type: 'sawtooth', vol: 0.09 * v, glide: 140, filter: 2400, pan, verb: 0.3 });
        break;
      case 'magic':
        this.bell(1300 * pitch, { vol: 0.08 * v, dur: 0.7, pan });
        this.bell(1950 * pitch, { vol: 0.05 * v, dur: 0.5, delay: 0.05, pan });
        break;
      case 'cloth': case 'soft':
        this.noiseBurst(0.08, { vol: 0.16 * v, type: 'bandpass', freq: 1200, q: 0.8, pan });
        break;
      case 'paper':
        this.noiseBurst(0.07, { vol: 0.14 * v, type: 'bandpass', freq: 2600, q: 0.7, pan });
        break;
      case 'plastic':
        this.tone(560 * pitch, 0.07, { vol: 0.2 * v, glide: 380, pan });
        this.noiseBurst(0.02, { vol: 0.1 * v, type: 'highpass', freq: 2500, pan });
        break;
      default: // organic / food
        this.noiseBurst(0.09, { vol: 0.22 * v, freq: 600, pan });
        this.tone(150 * pitch, 0.11, { vol: 0.28 * v, glide: 90, pan, verb: 0.05 });
        if (material === 'organic' && Math.random() < 0.25) this.tone(950, 0.09, { vol: 0.06 * v, glide: 1500, pan, delay: 0.03 });
    }
  },

  // ---------------------------------------------------------- game cues
  grab(material) { this.tone(420, 0.08, { vol: 0.12, glide: 640 }); this.noiseBurst(0.05, { vol: 0.05, type: 'highpass', freq: 3000 }); },
  drop() { this.tone(520, 0.07, { vol: 0.07, glide: 330 }); },
  throw(power) { this.noiseBurst(0.22 + power * 0.1, { vol: 0.1 + power * 0.12, type: 'bandpass', freq: 600, q: 0.8, sweep: 2600, attack: 0.03 }); },
  spawn() { this.tone(660, 0.12, { vol: 0.09, glide: 990, verb: 0.3 }); this.bell(1320, { vol: 0.04, dur: 0.4, delay: 0.05 }); },
  ui() { this.tone(880, 0.05, { vol: 0.06, verb: 0.05 }); },
  error() { this.tone(220, 0.18, { type: 'square', vol: 0.05, glide: 150, filter: 900 }); },
  trash() { this.noiseBurst(0.5, { vol: 0.2, type: 'bandpass', freq: 400, q: 1.2, sweep: 3000, attack: 0.03 }); this.tone(300, 0.4, { type: 'sawtooth', vol: 0.05, glide: 60, filter: 1200 }); },
  split() { this.noiseBurst(0.18, { vol: 0.2, type: 'highpass', freq: 1800 }); this.tone(900, 0.25, { vol: 0.1, glide: 300, verb: 0.3 }); },
  shelf() { this.bell(784, { vol: 0.08, dur: 0.8 }); this.bell(1175, { vol: 0.06, dur: 0.8, delay: 0.08 }); },
  hint() { this.bell(988, { vol: 0.07, dur: 0.9 }); this.bell(1319, { vol: 0.05, dur: 0.9, delay: 0.1 }); },

  merge(rarity, pos) {
    if (!this.ctx) return;
    const { pan } = this.spatial(pos);
    this.noiseBurst(0.12, { vol: 0.25, freq: 1800, pan, sweep: 300 });
    this.tone(180, 0.2, { vol: 0.3, glide: 520, pan, verb: 0.1 });
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1568, 1760];
    const n = 2 + rarity;
    for (let i = 0; i < n; i++) this.bell(scale[Math.min(scale.length - 1, i * 2 - (i > 2 ? 1 : 0))] * (rarity >= 3 ? 1 : 0.5) * 2, { vol: 0.07, dur: 0.6 + rarity * 0.15, delay: 0.05 + i * 0.06, pan: pan * 0.5 });
    if (rarity >= 3) this.swell(rarity);
  },
  swell(rarity) {
    const ctx = this.ctx, t = ctx.currentTime;
    const notes = rarity >= 5 ? [261.6, 329.6, 392, 493.9, 587.3] : [261.6, 329.6, 392, 523.3];
    for (const f of notes) {
      for (const det of [-9, 9]) {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
        const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.setValueAtTime(300, t); flt.frequency.exponentialRampToValueAtTime(rarity >= 5 ? 4200 : 2600, t + 0.9);
        const g = this.out(0, 0.6);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
        o.connect(flt); flt.connect(g); o.start(t); o.stop(t + 2.3);
      }
    }
    for (let i = 0; i < 8; i++) this.bell(2093 + Math.random() * 1500, { vol: 0.025, dur: 0.5, delay: 0.3 + i * 0.09 });
  },
  discovery(rarity) {
    const base = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    base.forEach((f, i) => this.bell(f, { vol: 0.09, dur: 1.1, delay: 0.12 + i * 0.075 }));
    if (rarity >= 4) this.swell(rarity);
  },
  newRecipe() { this.bell(1046.5, { vol: 0.07, dur: 0.8 }); this.bell(1568, { vol: 0.06, dur: 0.8, delay: 0.09 }); },
  achievement() {
    [659.25, 830.6, 987.8, 1318.5].forEach((f, i) => this.bell(f, { vol: 0.09, dur: 1.2, delay: i * 0.1 }));
    this.tone(1975, 1.2, { vol: 0.03, delay: 0.4, verb: 0.6 });
  },
  bigBoom() {
    this.noiseBurst(2.4, { vol: 0.6, freq: 1200, sweep: 60, attack: 0.01, verb: 0.5 });
    this.tone(60, 2.2, { vol: 0.6, glide: 25, verb: 0.3 });
  },

  chargeStart() {
    if (!this.ctx || this.charge) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 220;
    const g = this.out(0, 0.3); g.gain.value = 0.0001; g.gain.setTargetAtTime(0.05, ctx.currentTime, 0.05);
    o.connect(g); o.start();
    this.charge = { o, g };
  },
  chargeUpdate(p) { if (this.charge) this.charge.o.frequency.setTargetAtTime(220 + p * 660, this.ctx.currentTime, 0.03); },
  chargeStop() {
    if (!this.charge) return;
    const { o, g } = this.charge; this.charge = null;
    g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.03);
    o.stop(this.ctx.currentTime + 0.2);
  },

  // ---------------------------------------------------------- generative music
  startMusic() {
    if (this.musicTimer) return;
    this.nextChord = this.ctx.currentTime + 0.5;
    this.nextBell = this.ctx.currentTime + 3;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 250);
  },
  cs() { return Horror.on ? this.darkChords : this.chords; },
  chords: [
    [130.81, 196.0, 246.94, 293.66, 329.63],   // Cmaj9
    [110.0, 164.81, 196.0, 246.94, 261.63],    // Am9
    [87.31, 174.61, 220.0, 261.63, 329.63],    // Fmaj9
    [98.0, 146.83, 196.0, 220.0, 293.66],      // G6/9
  ],
  darkChords: [
    [55.0, 82.41, 130.81, 155.56, 164.81],     // A minor, low, with a clashing E-flat
    [51.91, 77.78, 123.47, 138.59, 155.56],    // A-flat drone cluster
    [58.27, 87.31, 138.59, 146.83, 174.61],    // B-flat minor with a semitone rub
    [49.0, 73.42, 116.54, 146.83, 155.56],     // G diminished smear
  ],
  scheduleMusic() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const ahead = ctx.currentTime + 1.0;
    const speed = G.effects.slowmo > 0 ? 1.6 : 1;
    while (this.nextChord < ahead) {
      this.padChord(this.cs()[this.chordIdx % 4], this.nextChord, 8.5 * speed);
      this.chordIdx++;
      this.nextChord += 8 * speed;
    }
    while (this.nextBell < ahead) {
      const chord = this.cs()[(this.chordIdx + 3) % 4];
      const f = chord[1 + Math.floor(Math.random() * 4)] * (Math.random() < 0.5 ? 4 : 2) * (Horror.on ? 1 + (Math.random() - 0.5) * 0.03 : 1);
      const t = this.nextBell - ctx.currentTime;
      if (t >= 0) this.bell(f, { vol: 0.05 + Math.random() * 0.03, dur: 2.2, delay: t, pan: Math.random() * 1.2 - 0.6, verb: 0.9, dest: this.music });
      this.nextBell += (Horror.on ? 3 + Math.random() * 7 : 1.1 + Math.random() * 2.6) * speed;
    }
    if (G.effects.disco > 0) {
      if (this.nextBeat < ctx.currentTime) this.nextBeat = ctx.currentTime + 0.05;
      while (this.nextBeat < ahead) {
        const t = this.nextBeat - ctx.currentTime;
        this.tone(120, 0.18, { vol: 0.5, glide: 45, delay: t, verb: 0, dest: this.music });
        this.noiseBurst(0.05, { vol: 0.12, type: 'highpass', freq: 7000, delay: t + 0.25, verb: 0 });
        this.nextBeat += 0.5;
      }
    }
  },
  padChord(notes, when, dur) {
    const ctx = this.ctx;
    for (let i = 0; i < notes.length; i++) {
      const f = notes[i];
      const flt = ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 700 + i * 120; flt.Q.value = 0.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(i === 0 ? 0.11 : 0.06, when + 2.8);
      g.gain.setValueAtTime(i === 0 ? 0.11 : 0.06, when + dur - 3);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      flt.connect(g); g.connect(this.music);
      const send = ctx.createGain(); send.gain.value = 0.6; g.connect(send); send.connect(this.verbSend);
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = i === 0 ? 'sine' : 'triangle';
        o.frequency.value = f; o.detune.value = det;
        o.connect(flt); o.start(when); o.stop(when + dur + 0.1);
      }
    }
  },
};
