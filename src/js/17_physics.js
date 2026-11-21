// ============================================================================
//  ELEMENTAL LAB — 17 · Physics (cannon-es): world, materials, colliders,
//  buoyancy for gases / floaty concepts, collision → impact & merge events
// ============================================================================

const GROUP = { STATIC: 1, ITEM: 2, PLAYER: 4, HELD: 8 };

const Phys = {
  world: null, mats: {}, impacts: [], statics: [],
  init() {
    const w = this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    w.broadphase = new CANNON.SAPBroadphase(w);
    w.allowSleep = true;
    w.solver.iterations = 10;
    w.solver.tolerance = 0.0008;
    w.defaultContactMaterial.friction = 0.42;
    w.defaultContactMaterial.restitution = 0.18;
    w.defaultContactMaterial.contactEquationStiffness = 5e6;
    w.defaultContactMaterial.contactEquationRelaxation = 3;
    const M = (n) => (this.mats[n] = new CANNON.Material(n));
    ['static', 'default', 'bouncy', 'heavy', 'slippery', 'soft', 'player'].forEach(M);
    const cm = (a, b, friction, restitution) => w.addContactMaterial(new CANNON.ContactMaterial(this.mats[a], this.mats[b], { friction, restitution, contactEquationStiffness: 5e6, contactEquationRelaxation: 3 }));
    cm('static', 'default', 0.45, 0.2); cm('static', 'bouncy', 0.4, 0.62); cm('static', 'heavy', 0.6, 0.08);
    cm('static', 'slippery', 0.03, 0.15); cm('static', 'soft', 0.8, 0.02); cm('static', 'player', 0.0, 0);
    for (const m of ['default', 'bouncy', 'heavy', 'slippery', 'soft']) cm('player', m, 0.1, 0.05);
    cm('bouncy', 'bouncy', 0.3, 0.7); cm('heavy', 'heavy', 0.5, 0.05); cm('soft', 'soft', 0.8, 0.0);
    w.addEventListener('preStep', () => this.preStep());
  },

  addStaticBox(pos, size, rotY = 0) {
    const b = new CANNON.Body({ mass: 0, material: this.mats.static, collisionFilterGroup: GROUP.STATIC, collisionFilterMask: GROUP.ITEM | GROUP.PLAYER | GROUP.HELD });
    b.addShape(new CANNON.Box(new CANNON.Vec3(size[0] / 2, size[1] / 2, size[2] / 2)));
    b.position.set(pos[0], pos[1], pos[2]);
    if (rotY) b.quaternion.setFromEuler(0, -rotY, 0);
    this.world.addBody(b); this.statics.push(b);
    return b;
  },
  addStaticCylinder(pos, r, h) {
    for (const a of [0, Math.PI / 4]) this.addStaticBox(pos, [r * 1.7, h, r * 1.7], a);
  },

  physClass(info) {
    const m = info.material;
    if (m === 'stone' || m === 'metal' || m === 'gold' || m === 'soil') return 'heavy';
    if (m === 'plastic' || (info.tags.includes('sport') && info.shape === 'orb')) return 'bouncy';
    if (m === 'ice') return 'slippery';
    if (m === 'liquid' || m === 'cloth' || m === 'food' || m === 'clay') return 'soft';
    return 'default';
  },

  createItemBody(ent, pos) {
    const info = ent.info, col = ent.vis.collider;
    const body = new CANNON.Body({
      mass: clamp(info.mass, 0.05, 25), material: this.mats[this.physClass(info)],
      collisionFilterGroup: GROUP.ITEM, collisionFilterMask: GROUP.STATIC | GROUP.ITEM | GROUP.PLAYER | GROUP.HELD,
      allowSleep: true, sleepSpeedLimit: 0.12, sleepTimeLimit: 0.9,
    });
    if (col.type === 'sphere') body.addShape(new CANNON.Sphere(Math.max(0.04, col.r)));
    else body.addShape(new CANNON.Box(new CANNON.Vec3(Math.max(0.03, col.he.x), Math.max(0.03, col.he.y), Math.max(0.03, col.he.z))));
    const st = info.state;
    body.linearDamping = st === 'gas' ? 0.75 : st === 'abstract' ? 0.55 : st === 'energy' ? 0.45 : st === 'plasma' ? 0.3 : st === 'liquid' ? 0.2 : 0.06;
    body.angularDamping = st === 'liquid' ? 0.7 : st === 'gas' ? 0.8 : 0.28;
    body.position.set(pos.x, pos.y, pos.z);
    body.quaternion.setFromEuler(0, Math.random() * Math.PI * 2, 0);
    body.entity = ent;
    body.addEventListener('collide', (e) => this.onCollide(body, e));
    this.world.addBody(body);
    return body;
  },

  onCollide(body, e) {
    const other = e.body;
    let v = 0;
    try { v = Math.abs(e.contact.getImpactVelocityAlongNormal()); } catch (err) { return; }
    if (v < 0.5) return;
    // each pair reports twice (once per body) — keep the one with the lower id
    if (other.entity && other.id < body.id) return;
    this.impacts.push({ a: body.entity, b: other.entity || null, v, pos: body.position });
  },

  preStep() {
    Player.holdForces();
    const g = this.world.gravity.y;
    for (const e of G.entities) {
      const b = e.body;
      if (!b || e.held || e.merging || b.sleepState === CANNON.Body.SLEEPING && e.info.state !== 'gas') continue;
      const st = e.info.state, m = b.mass;
      if (e.inRing) {
        // the Fusion Ring's containment field: gently centres items and holds floaty ones down
        const R = LAYOUT.ring;
        b.force.x += m * (-(b.position.x - R.x) * 5 - b.velocity.x * 1.5);
        b.force.z += m * (-(b.position.z - R.z) * 5 - b.velocity.z * 1.5);
        if (st === 'gas' || st === 'abstract' || st === 'energy' || st === 'plasma') {
          b.force.y += -g * m + m * (5 * (LAYOUT.table.top + 0.35 - b.position.y) - 2.5 * b.velocity.y);
          continue;
        }
      }
      if (st === 'gas') {
        const hover = 1.9 + Math.sin(e.phase) * 0.35;
        b.force.y += -g * m + m * (2.2 * (hover - b.position.y) - 1.4 * b.velocity.y);
        b.force.x += m * Math.sin(G.time * 0.4 + e.phase) * 0.25;
        b.force.z += m * Math.cos(G.time * 0.35 + e.phase * 1.3) * 0.25;
        if (b.sleepState === CANNON.Body.SLEEPING) b.wakeUp();
      } else if (st === 'abstract' || st === 'energy') {
        b.force.y += -g * m * 0.84;
      } else if (st === 'plasma') {
        b.force.y += -g * m * 0.35;
      }
    }
  },

  step(dt) {
    this.world.step(1 / 60, dt, 4);
  },
};
