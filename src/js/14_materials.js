// ============================================================================
//  ELEMENTAL LAB — 14 · Item materials. One cached material pair per item:
//  metal (reflective), glass/ice (transparent + clearcoat), stone (rough,
//  faceted), fire/energy (emissive), living (soft), magic (glow) … plus shader
//  injections for wobbling liquids, glitches, pixel-snapping and rainbows.
// ============================================================================

const MatCache = new Map();
const FLAT_SHAPES = new Set(['rock', 'crystal']);

function injectItemShader(mat, flags) {
  const key = Object.keys(flags).filter(k => flags[k]).join(',');
  if (!key) return;
  mat.customProgramCacheKey = () => 'item:' + key;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = uTime;
    sh.uniforms.uWobble = { value: flags.wobble || 0 };
    let vHead = 'uniform float uTime;\nuniform float uWobble;\nvarying vec3 vObjPos;\n';
    let vBody = '#include <begin_vertex>\nvObjPos = position;\n';
    if (flags.wobble) vBody += 'transformed += normal * (sin(uTime*3.1 + position.y*7.0 + position.x*5.0) * 0.6 + sin(uTime*4.7 + position.z*6.0) * 0.4) * uWobble;\n';
    if (flags.glitch) vBody += '{ float gt = floor(uTime*11.0); float gr = fract(sin(gt*91.7 + floor(position.y*6.0)*13.1)*43758.5); if (gr > 0.84) transformed.x += (gr - 0.92) * 1.6; }\n';
    if (flags.pixel) vBody += 'transformed = floor(transformed / 0.22 + 0.5) * 0.22;\n';
    if (flags.breathe) vBody += 'transformed *= 1.0 + sin(uTime*2.2 + position.y*2.0)*0.015;\n';
    sh.vertexShader = vHead + sh.vertexShader.replace('#include <begin_vertex>', vBody);
    let fHead = 'uniform float uTime;\nvarying vec3 vObjPos;\n';
    let fBody = '#include <color_fragment>\n';
    if (flags.rainbow) fBody += '{ vec3 rb = 0.5 + 0.5*cos(6.2831*(vec3(0.0,0.33,0.67) + vObjPos.y*0.45 + vObjPos.x*0.2 + uTime*0.25)); diffuseColor.rgb = mix(diffuseColor.rgb, rb, 0.6); }\n';
    if (flags.glitch) fBody += '{ float gl = step(0.93, fract(sin(floor(uTime*9.0)*12.9898 + floor(vObjPos.y*8.0))*43758.5)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.2, 1.0), gl*0.7); }\n';
    if (flags.ghost) fBody += 'diffuseColor.a *= 0.75 + 0.25*sin(uTime*2.0 + vObjPos.y*3.0);\n';
    if (flags.scan) fBody += '{ float sc = smoothstep(0.92, 1.0, fract(vObjPos.y*1.5 - uTime*0.8)); diffuseColor.rgb += vec3(0.2,0.9,1.0)*sc*0.5; }\n';
    sh.fragmentShader = fHead + sh.fragmentShader.replace('#include <color_fragment>', fBody);
  };
}

function itemMaterials(info) {
  let m = MatCache.get(info.id);
  if (m) return m;
  const M = MATERIALS[info.material] || MATERIALS.clay;
  const fx = new Set(info.fx || []);
  const mat = info.material;
  const physical = ['glass', 'crystal', 'ice', 'liquid', 'candy', 'plastic', 'gold', 'metal'].includes(mat);
  const P = {
    color: 0xffffff, vertexColors: true, roughness: M.rough, metalness: M.metal,
    flatShading: FLAT_SHAPES.has(info.shape) || fx.has('pixel'), envMapIntensity: 1,
  };
  let opacity = info.opacity ?? 1;
  if (mat === 'metal' || mat === 'gold') { P.envMapIntensity = 1.35; P.roughness = mat === 'gold' ? 0.22 : 0.28; }
  if (mat === 'glass' || mat === 'crystal' || mat === 'ice') { Object.assign(P, { clearcoat: 1, clearcoatRoughness: 0.05, roughness: mat === 'ice' ? 0.12 : 0.04, envMapIntensity: 1.6, ior: 1.45, specularIntensity: 1 }); opacity = Math.min(opacity, mat === 'crystal' ? 0.82 : 0.68); }
  if (mat === 'liquid') { Object.assign(P, { clearcoat: 1, clearcoatRoughness: 0.03, roughness: 0.06, envMapIntensity: 1.3 }); opacity = Math.min(opacity, 0.9); }
  if (mat === 'candy' || mat === 'plastic') Object.assign(P, { clearcoat: 0.7, clearcoatRoughness: 0.15 });
  if (mat === 'gas') { P.roughness = 1; opacity = Math.min(opacity, 0.5); }
  const body = physical ? new THREE.MeshPhysicalMaterial(P) : new THREE.MeshStandardMaterial(P);
  // emissive response
  let emis = 0, emisColor = info.glowColor || info.color;
  if (mat === 'fire') emis = 0.9; else if (mat === 'energy') emis = 0.7; else if (mat === 'magic' || mat === 'ethereal') emis = 0.35;
  else if (info.glow) emis = info.glow * 0.18;
  if (mat === 'gas') emis = Math.max(emis, 0.12);
  if (emis) { body.emissive = new THREE.Color(emisColor); body.emissiveIntensity = emis; }
  if (opacity < 0.99) { body.transparent = true; body.opacity = opacity; body.depthWrite = opacity > 0.55; }
  const flags = {
    wobble: (info.state === 'liquid' || fx.has('wobble')) ? 0.045 : 0, glitch: fx.has('glitch'), pixel: fx.has('pixel'),
    rainbow: fx.has('rainbow'), ghost: fx.has('ghost'), scan: fx.has('scan'), breathe: info.state === 'living',
  };
  injectItemShader(body, flags);
  const glow = new THREE.MeshBasicMaterial({ vertexColors: true, color: new THREE.Color(1, 1, 1).multiplyScalar(mat === 'fire' ? 1.15 : 1.25), toneMapped: true });
  if (opacity < 0.5) { glow.transparent = true; glow.opacity = Math.max(0.3, opacity * 1.5); }
  m = { body, glow };
  if (MatCache.size > 300) { const k = MatCache.keys().next().value; const old = MatCache.get(k); if (!old.refs) { old.body.dispose(); old.glow.dispose(); } MatCache.delete(k); }
  MatCache.set(info.id, m);
  return m;
}
