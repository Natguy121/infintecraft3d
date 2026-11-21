// ============================================================================
//  ELEMENTAL LAB — 10 · Core runtime state, settings, layout & helpers
//  (THREE and CANNON are provided by the bundled libraries above this code)
// ============================================================================

const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

const LS_SETTINGS = 'elementalLab.settings.v1';
const DEFAULT_SETTINGS = {
  quality: 'high', sens: 1, vol: 0.8, music: 0.45, invert: false, bob: true, dof: true, fps: false,
  ai: false, key: '', model: 'claude-opus-5-5',
};
const Settings = { ...DEFAULT_SETTINGS };
try { Object.assign(Settings, JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}')); } catch (e) { /* private mode */ }
function saveSettings() { try { localStorage.setItem(LS_SETTINGS, JSON.stringify(Settings)); } catch (e) { /* ignore */ } }

const QUALITY = {
  high: { pixelRatio: 1.5, shadow: 2048, reflection: true, post: true, pointLights: true, particles: 1 },
  medium: { pixelRatio: 1.25, shadow: 1536, reflection: true, post: false, pointLights: true, particles: 0.8 },
  low: { pixelRatio: 1, shadow: 1024, reflection: false, post: false, pointLights: false, particles: 0.5 },
};
const Q = () => QUALITY[Settings.quality] || QUALITY.high;

// ---------------------------------------------------------------- layout (metres)
const LAYOUT = {
  room: { x0: -6, x1: 6, z0: -3.6, z1: 6, h: 4.2 },
  table: { w: 5.2, d: 1.3, top: 0.9, z: 0 },
  pedestals: [
    { id: 'air', label: 'AIR', x: -2.15, color: 0x9fd8ff },
    { id: 'fire', label: 'FIRE', x: -1.5, color: 0xff7a2a },
    { id: 'earth', label: 'EARTH', x: 1.5, color: 0xb08850 },
    { id: 'water', label: 'WATER', x: 2.15, color: 0x2f8cff },
  ],
  pedZ: -0.36,
  ring: { x: 0, z: -0.12, r: 0.44 },
  pad: { x: -3.3, z: -0.05, top: 1.0, r: 0.36 },
  trash: { x: 3.3, z: 0.2, r: 0.36, h: 0.82 },
  shelf: { z: -3.36, rows: [1.28, 1.88, 2.48], cols: 10, x0: -2.61, dx: 0.58 },
  start: { x: 0, z: 2.15 },
};

const MAX_BODIES = 80;           // physics body cap for loose items
const DESPAWN_THRESHOLD = 60;    // items despawn after 5 min idle once the lab holds more than this
const DESPAWN_IDLE = 300;        // seconds
const REACH = 3.6;               // grab distance

// ---------------------------------------------------------------- shared state
const G = {
  renderer: null, scene: null, camera: null, canvas: null,
  time: 0, rtime: 0, dt: 1 / 60, timeScale: 1, frame: 0,
  started: false, locked: false, ui: null,          // ui: null | 'codex' | 'book' | 'menu'
  entities: [], displays: [], trophies: [],
  world: null, player: null,
  effects: { slowmo: 0, zerog: 0, disco: 0, snow: 0, fireworks: 0, starfield: 0 },
  shake: 0, flash: 0,
  selected: null,        // item id selected for the recipe book
  lookTarget: null,      // entity or display under the crosshair
};
const uTime = { value: 0 };   // shared shader clock

const V3 = () => new THREE.Vector3();
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
const _m1 = new THREE.Matrix4();
const _color = new THREE.Color();

const ease = {
  outBack: (t, s = 1.70158) => { t -= 1; return t * t * ((s + 1) * t + s) + 1; },
  outElastic: (t) => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  inOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

function rarityName(r) { return RARITIES[r]?.name || 'Common'; }
function rarityHex(r) { return RARITIES[r]?.color || '#999'; }
function itemLabel(info) { return (info.emojis || [info.emoji]).join(''); }
function fmtTags(tags, max = 6) { return tags.filter(t => t !== 'living' || tags.length < 4).slice(0, max); }

// Simple tween list (used for UI-ish 3D animations)
const Tweens = {
  list: [],
  add(dur, fn, done) { const t = { t: 0, dur, fn, done }; this.list.push(t); return t; },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      t.t += dt;
      const k = Math.min(1, t.t / t.dur);
      t.fn(k);
      if (k >= 1) { this.list.splice(i, 1); t.done && t.done(); }
    }
  },
};

// Error surface so problems are visible rather than a silent black screen
window.addEventListener('error', (e) => showError(e.message + (e.filename ? `\n${e.filename.split('/').pop()}:${e.lineno}` : '')));
window.addEventListener('unhandledrejection', (e) => showError(String(e.reason && e.reason.message || e.reason)));
function showError(msg) {
  let box = $('err');
  if (!box) { box = el('div'); box.id = 'err'; $('ui').appendChild(box); }
  box.textContent = '⚠️ ' + msg;
  console.error(msg);
}
