// ============================================================================
//  ELEMENTAL LAB — 12 · Procedural canvas textures + the emoji label atlas
// ============================================================================

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';

function canvasTex(w, h, draw, { srgb = true, repeat = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
}

const Tex = {
  glow: null, spark: null, soft: null, ring: null,
  init() {
    this.glow = canvasTex(128, 128, (g, w) => {
      const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.18, 'rgba(255,255,255,0.75)');
      r.addColorStop(0.45, 'rgba(255,255,255,0.22)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, w);
    }, { srgb: false });
    this.spark = canvasTex(128, 128, (g, w) => {
      const c = w / 2;
      const r = g.createRadialGradient(c, c, 0, c, c, c * 0.5);
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, w);
      g.globalCompositeOperation = 'lighter';
      for (const [sx, sy] of [[1, 0.09], [0.09, 1]]) {
        const lg = g.createRadialGradient(c, c, 0, c, c, c);
        lg.addColorStop(0, 'rgba(255,255,255,0.9)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        g.save(); g.translate(c, c); g.scale(sx, sy); g.fillStyle = lg; g.beginPath(); g.arc(0, 0, c, 0, Math.PI * 2); g.fill(); g.restore();
      }
    }, { srgb: false });
    this.soft = canvasTex(64, 64, (g, w) => {
      const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      r.addColorStop(0, 'rgba(255,255,255,0.9)'); r.addColorStop(0.6, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r; g.fillRect(0, 0, w, w);
    }, { srgb: false });
  },

  floor() {
    return canvasTex(1024, 1024, (g, w) => {
      g.fillStyle = '#f4f5f7'; g.fillRect(0, 0, w, w);
      const rng = makeRng(7);
      for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(120,130,150,${rng() * 0.025})`; g.fillRect(rng() * w, rng() * w, 2, 2); }
      g.strokeStyle = 'rgba(140,150,170,0.22)'; g.lineWidth = 3;
      for (let i = 0; i <= 4; i++) { const p = i * w / 4; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, w); g.stroke(); g.beginPath(); g.moveTo(0, p); g.lineTo(w, p); g.stroke(); }
    }, { repeat: true });
  },
  wall() {
    return canvasTex(512, 512, (g, w) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, w);
      g.strokeStyle = 'rgba(150,160,180,0.16)'; g.lineWidth = 2;
      g.strokeRect(1, 1, w - 2, w - 2);
      g.strokeStyle = 'rgba(150,160,180,0.07)';
      g.beginPath(); g.moveTo(0, w / 2); g.lineTo(w, w / 2); g.stroke();
    }, { repeat: true });
  },
  text(text, { w = 1024, h = 256, font = '800 64px', color = '#1d2230', bg = null, glow = null, sub = null } = {}) {
    return canvasTex(w, h, (g) => {
      if (bg) { g.fillStyle = bg; roundRect(g, 4, 4, w - 8, h - 8, h * 0.28); g.fill(); }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      const weight = font.split(' ')[0];
      let px = Math.floor(h * (sub ? 0.5 : 0.72));
      g.font = `${weight} ${px}px ui-rounded, system-ui, sans-serif`;
      const tw = g.measureText(text).width;
      if (tw > w * 0.92) { px = Math.floor(px * w * 0.92 / tw); g.font = `${weight} ${px}px ui-rounded, system-ui, sans-serif`; }
      if (glow) { g.shadowColor = glow; g.shadowBlur = 18; }
      g.fillStyle = color;
      g.fillText(text, w / 2, sub ? h * 0.42 : h / 2);
      if (sub) { g.shadowBlur = 0; g.font = `600 ${Math.round(h * 0.18)}px ui-rounded, system-ui, sans-serif`; g.globalAlpha = 0.7; g.fillText(sub, w / 2, h * 0.76); }
    });
  },
};

function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

// ---------------------------------------------------------------- emoji atlas
// One texture holds every floating emoji label, so all labels render in a
// single draw call (see Labels in 15_particles.js).
const EmojiAtlas = {
  W: 2048, H: 1024, CELL: 128, cols: 16, rows: 8,
  canvas: null, g: null, texture: null, cells: new Map(), lru: [], refs: new Map(), dirty: false,
  init() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.g = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.generateMipmaps = true;
    this.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.free = Array.from({ length: this.cols * this.rows }, (_, i) => i);
  },
  key(info) { return info.kind === 'comp' ? `c:${info.emojis[0]}|${info.emojis[1]}` : (info.emojis || [info.emoji]).join('|'); },
  acquire(info) {
    const k = this.key(info);
    let cell = this.cells.get(k);
    if (cell === undefined) {
      if (!this.free.length) this.evict();
      cell = this.free.length ? this.free.pop() : 0;
      this.cells.set(k, cell);
      this.draw(cell, info);
    }
    this.refs.set(k, (this.refs.get(k) || 0) + 1);
    const i = this.lru.indexOf(k); if (i >= 0) this.lru.splice(i, 1); this.lru.push(k);
    return { key: k, cell };
  },
  release(k) { if (!k) return; this.refs.set(k, Math.max(0, (this.refs.get(k) || 1) - 1)); },
  evict() {
    for (let i = 0; i < this.lru.length; i++) {
      const k = this.lru[i];
      if (!this.refs.get(k)) { this.free.push(this.cells.get(k)); this.cells.delete(k); this.lru.splice(i, 1); this.refs.delete(k); return; }
    }
  },
  draw(cell, info) {
    const g = this.g, C = this.CELL;
    const x = (cell % this.cols) * C, y = Math.floor(cell / this.cols) * C;
    g.clearRect(x, y, C, C);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    const ems = info.emojis || [info.emoji];
    g.save();
    g.shadowColor = 'rgba(0,0,0,0.25)'; g.shadowBlur = 6; g.shadowOffsetY = 3;
    if (info.kind === 'comp') {
      g.font = `${C * 0.5}px ${EMOJI_FONT}`; g.fillText(ems[1], x + C * 0.58, y + C * 0.56);
      g.font = `${C * 0.36}px ${EMOJI_FONT}`; g.fillText(ems[0], x + C * 0.27, y + C * 0.33);
    } else {
      g.font = `${C * 0.62}px ${EMOJI_FONT}`; g.fillText(ems[0], x + C * 0.5, y + C * 0.53);
      const badges = ems.slice(1);
      const spots = [[0.82, 0.8], [0.18, 0.8]];
      badges.forEach((b, i) => {
        const [bx, by] = spots[i] || spots[0];
        g.shadowBlur = 0; g.shadowOffsetY = 0;
        g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(x + C * bx, y + C * by, C * 0.17, 0, Math.PI * 2); g.fill();
        g.font = `${C * 0.24}px ${EMOJI_FONT}`; g.fillText(b, x + C * bx, y + C * by + 1);
      });
    }
    g.restore();
    this.dirty = true;
  },
  uv(cell) { return [(cell % this.cols) / this.cols, 1 - (Math.floor(cell / this.cols) + 1) / this.rows]; },
  flush() { if (this.dirty) { this.texture.needsUpdate = true; this.dirty = false; } },
};
