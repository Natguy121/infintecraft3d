// ============================================================================
//  ELEMENTAL LAB — 19z · Mobile / touch controls
//  Left thumb: virtual joystick (push to the edge to sprint).
//  Right side: drag to look, quick tap to grab / drop what's under the crosshair.
//  Buttons: Grab (hold), Throw, Fuse (hold = E), Rotate (toggle = R),
//  push/pull, Jump, Shelf, Split mode, Codex, Recipes, Hint, Pause.
// ============================================================================

const IS_TOUCH = (typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);

const Touch = {
  move: { x: 0, y: 0 }, sprint: false, split: false, rotate: false, root: null,
  init() {
    if (!IS_TOUCH) return;
    document.body.classList.add('touch');
    const root = this.root = el('div', 'touch-ui hidden');
    root.innerHTML = `
      <div class="t-look" id="t-look"></div>
      <div class="t-stick" id="t-stick"><div class="t-knob" id="t-knob"></div></div>
      <div class="t-top">
        <button data-a="pause">⏸</button><button data-a="codex">📖</button><button data-a="book">📜</button><button data-a="hint">💡</button><button data-a="pet">🐾</button><button data-a="build">📌</button><button data-a="photo">📷</button>
      </div>
      <div class="t-right">
        <button class="t-big" data-a="grab">✋<small>Grab</small></button>
        <button class="t-mid" data-a="throw">🎯<small>Throw</small></button>
        <button class="t-mid" data-a="fuse">⚗️<small>Fuse</small></button>
        <button class="t-mid" data-a="rotate">🔄<small>Rotate</small></button>
        <button class="t-sm" data-a="far">➕</button><button class="t-sm" data-a="near">➖</button>
        <button class="t-sm" data-a="jump">⤒</button><button class="t-sm" data-a="shelf">🏺</button><button class="t-sm" data-a="split">✂️</button>
      </div>`;
    $('ui').appendChild(root);
    const opt = { passive: false };
    // ---- joystick
    const stick = $('t-stick'), knob = $('t-knob');
    let sid = null, sx = 0, sy = 0;
    stick.addEventListener('touchstart', (e) => { e.preventDefault(); const t = e.changedTouches[0]; sid = t.identifier; const r = stick.getBoundingClientRect(); sx = r.left + r.width / 2; sy = r.top + r.height / 2; this.stickMove(t, sx, sy, knob); }, opt);
    stick.addEventListener('touchmove', (e) => { e.preventDefault(); for (const t of e.changedTouches) if (t.identifier === sid) this.stickMove(t, sx, sy, knob); }, opt);
    const endStick = (e) => { for (const t of e.changedTouches) if (t.identifier === sid) { sid = null; this.move.x = this.move.y = 0; this.sprint = false; knob.style.transform = ''; } };
    stick.addEventListener('touchend', endStick); stick.addEventListener('touchcancel', endStick);
    // ---- look pad: drag to look, quick tap to grab/drop
    const look = $('t-look');
    let lid = null, lx = 0, ly = 0, l0 = 0, moved = 0;
    look.addEventListener('touchstart', (e) => { e.preventDefault(); if (lid !== null) return; const t = e.changedTouches[0]; lid = t.identifier; lx = t.clientX; ly = t.clientY; l0 = performance.now(); moved = 0; }, opt);
    look.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === lid) {
        const dx = (t.clientX - lx) * 1.8, dy = (t.clientY - ly) * 1.8;
        lx = t.clientX; ly = t.clientY; moved += Math.abs(dx) + Math.abs(dy);
        Input.dx += dx; Input.dy += dy;
        Input.samples.push({ t: performance.now(), x: dx, y: dy }); if (Input.samples.length > 40) Input.samples.shift();
      }
    }, opt);
    const endLook = (e) => {
      for (const t of e.changedTouches) if (t.identifier === lid) {
        lid = null;
        if (moved < 14 && performance.now() - l0 < 280 && this.active()) this.tapGrab();
      }
    };
    look.addEventListener('touchend', endLook); look.addEventListener('touchcancel', endLook);
    // ---- buttons
    for (const b of root.querySelectorAll('button')) {
      const a = b.dataset.a;
      b.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); b.classList.add('on'); this.press(a, true, b); }, opt);
      const up = (e) => { e.preventDefault(); if (!['rotate', 'split'].includes(a)) b.classList.remove('on'); this.press(a, false, b); };
      b.addEventListener('touchend', up, opt); b.addEventListener('touchcancel', up, opt);
      b.addEventListener('click', (e) => e.preventDefault());
    }
    // menu text for touch players
    $('help').innerHTML = `<div>🕹️ Left stick: move (push to the edge to sprint)</div><div>👆 Drag right side: look · tap: grab / drop</div>
      <div>✋ Hold Grab: carry · 🎯 Throw (swipe first for power)</div><div>⚗️ Hold Fuse while looking at another item</div>
      <div>🔄 Rotate: then drag to spin the held item</div><div>➕ ➖ push / pull · ⤒ jump · 🏺 shelf</div>
      <div>✂️ Split mode, then tap an item in the Fusion Ring</div><div>📖 Codex · 📜 recipes · 💡 hint · ⏸ menu</div>`;
    $('help').classList.add('hidden');
  },
  active() { return G.started && G.locked && !G.ui; },
  update() { if (this.root) this.root.classList.toggle('hidden', !this.active()); },
  stickMove(t, cx, cy, knob) {
    const R = 52;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.move.x = dx / R; this.move.y = -dy / R;
    this.sprint = d > R * 1.25;
  },
  tapGrab() {
    if (Player.held) { Player.drop(); return; }
    Player.onPrimaryDown({ altKey: this.split });
    if (this.split) this.setSplit(false);
  },
  setSplit(v) { this.split = v; this.root.querySelector('[data-a=split]').classList.toggle('on', v); },
  press(a, down, btn) {
    const K = Input.keys;
    const key = (code, d) => { if (d) { K.add(code); Input.pressed.add(code); } else K.delete(code); };
    const fake = (code) => UI.onKey({ code, preventDefault() {} });
    switch (a) {
      case 'grab':
        if (down) { Input.mouse.l = true; if (!Player.held) Player.onPrimaryDown({ altKey: this.split }); if (this.split) this.setSplit(false); }
        else { Input.mouse.l = false; Player.onPrimaryUp(); }
        break;
      case 'throw': if (down && Player.held) Player.onSecondaryDown(); break;
      case 'fuse': key('KeyE', down); break;
      case 'rotate': if (down) { this.rotate = !this.rotate; btn.classList.toggle('on', this.rotate); key('KeyR', this.rotate); } break;
      case 'far': if (down) Input.wheel -= 2; break;
      case 'near': if (down) Input.wheel += 2; break;
      case 'jump': if (down) Input.pressed.add('Space'); break;
      case 'shelf': if (down) Input.pressed.add('KeyF'); break;
      case 'pet': if (down) Input.pressed.add('KeyG'); break;
      case 'build': if (down) Input.pressed.add('KeyB'); break;
      case 'photo': if (down) Input.pressed.add('KeyP'); break;
      case 'split': if (down) this.setSplit(!this.split); break;
      case 'codex': if (down) fake('Tab'); break;
      case 'book': if (down) fake('KeyC'); break;
      case 'hint': if (down) fake('KeyH'); break;
      case 'pause': if (down) { if (Player.held) Player.drop(); G.locked = false; UI.showMenu(true); } break;
    }
  },
};
