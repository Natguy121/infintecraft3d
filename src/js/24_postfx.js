// ============================================================================
//  ELEMENTAL LAB — 24 · Post-processing: HDR scene target (MSAA) → composite
//  with depth-of-field that focuses on the held item, plus a soft vignette.
//  Tone mapping + sRGB output happen in the composite pass.
// ============================================================================

const Post = {
  enabled: false, rt: null, scene: null, cam: null, mat: null, amount: 0, focus: 1.5,
  init(renderer) {
    this.enabled = Q().post && renderer.capabilities.isWebGL2;
    if (!this.enabled) return;
    const s = renderer.getDrawingBufferSize(new THREE.Vector2());
    this.rt = new THREE.WebGLRenderTarget(s.x, s.y, { type: THREE.HalfFloatType, samples: 4 });
    this.rt.depthTexture = new THREE.DepthTexture(s.x, s.y);
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.rt.texture }, tDepth: { value: this.rt.depthTexture }, uFocus: { value: 1.5 }, uAmount: { value: 0 },
        uNear: { value: 0.05 }, uFar: { value: 400 }, uRes: { value: new THREE.Vector2(s.x, s.y) }, uVig: { value: 0.35 }, tBloom: { value: null }, uBloom: { value: 0.55 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        #include <packing>
        uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tBloom; uniform float uBloom;
        uniform float uFocus, uAmount, uNear, uFar, uVig; uniform vec2 uRes;
        varying vec2 vUv;
        float vz(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).x, uNear, uFar); }
        const vec2 P[12] = vec2[](vec2(-0.326,-0.406), vec2(-0.840,-0.074), vec2(-0.696,0.457), vec2(-0.203,0.621), vec2(0.962,-0.195), vec2(0.473,-0.480),
                                  vec2(0.519,0.767), vec2(0.185,-0.893), vec2(0.507,0.064), vec2(0.896,0.412), vec2(-0.322,-0.933), vec2(-0.792,-0.598));
        void main() {
          vec3 col = texture2D(tColor, vUv).rgb;
          if (uAmount > 0.002) {
            float z = vz(vUv);
            float coc = clamp((z - uFocus * 1.08) / (uFocus * 1.2 + 0.4), 0.0, 1.0) * uAmount;
            coc = max(coc, clamp((uFocus * 0.55 - z) / (uFocus * 0.55), 0.0, 1.0) * uAmount * 0.5);
            if (coc > 0.01) {
              vec3 acc = col; float ws = 1.0;
              for (int i = 0; i < 12; i++) {
                vec2 o = P[i] * coc * 10.0 / uRes * (uRes.y / 900.0);
                float sz = vz(vUv + o);
                float w = sz > uFocus * 0.9 ? 1.0 : 0.15;
                acc += texture2D(tColor, vUv + o).rgb * w; ws += w;
              }
              col = acc / ws;
            }
          }
          col += texture2D(tBloom, vUv).rgb * uBloom;
          vec2 q = vUv - 0.5;
          col *= 1.0 - dot(q, q) * uVig;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      depthTest: false, depthWrite: false,
    });
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    tri.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    const quad = new THREE.Mesh(tri, this.mat);
    quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = quad;
    // bloom: bright pass → two separable blurs at quarter resolution
    const opt = { type: THREE.HalfFloatType, depthBuffer: false };
    this.bA = new THREE.WebGLRenderTarget(Math.max(8, s.x >> 2), Math.max(8, s.y >> 2), opt);
    this.bB = this.bA.clone();
    const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    this.brightMat = new THREE.ShaderMaterial({ uniforms: { tColor: { value: this.rt.texture } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: 'uniform sampler2D tColor; varying vec2 vUv; void main(){ vec3 c = texture2D(tColor, vUv).rgb; float l = dot(c, vec3(0.2126,0.7152,0.0722)); gl_FragColor = vec4(c * smoothstep(0.85, 1.6, l), 1.0); }' });
    this.blurMat = new THREE.ShaderMaterial({ uniforms: { tColor: { value: null }, uDir: { value: new THREE.Vector2() } }, vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: 'uniform sampler2D tColor; uniform vec2 uDir; varying vec2 vUv; void main(){ vec3 c = texture2D(tColor, vUv).rgb * 0.227; c += (texture2D(tColor, vUv + uDir*1.385).rgb + texture2D(tColor, vUv - uDir*1.385).rgb) * 0.316; c += (texture2D(tColor, vUv + uDir*3.23).rgb + texture2D(tColor, vUv - uDir*3.23).rgb) * 0.07; gl_FragColor = vec4(c, 1.0); }' });
    this.mat.uniforms.tBloom.value = this.bA.texture;
  },
  pass(renderer, mat, target) { this.quad.material = mat; renderer.setRenderTarget(target); renderer.render(this.scene, this.cam); },
  bloom(renderer) {
    const w = this.bA.width, h = this.bA.height;
    this.pass(renderer, this.brightMat, this.bA);
    for (let i = 0; i < 2; i++) {
      this.blurMat.uniforms.tColor.value = this.bA.texture; this.blurMat.uniforms.uDir.value.set((1 + i) / w, 0); this.pass(renderer, this.blurMat, this.bB);
      this.blurMat.uniforms.tColor.value = this.bB.texture; this.blurMat.uniforms.uDir.value.set(0, (1 + i) / h); this.pass(renderer, this.blurMat, this.bA);
    }
    this.quad.material = this.mat;
  },
  resize(renderer) {
    if (!this.enabled) return;
    const s = renderer.getDrawingBufferSize(new THREE.Vector2());
    this.rt.depthTexture.dispose();
    this.rt.depthTexture = new THREE.DepthTexture(s.x, s.y);
    this.rt.setSize(s.x, s.y);
    this.mat.uniforms.tDepth.value = this.rt.depthTexture;
    this.mat.uniforms.uRes.value.set(s.x, s.y);
    this.bA.setSize(Math.max(8, s.x >> 2), Math.max(8, s.y >> 2)); this.bB.setSize(Math.max(8, s.x >> 2), Math.max(8, s.y >> 2));
  },
  render(renderer, scene, camera, dt) {
    if (!this.enabled) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
    const held = Player.held;
    const want = 0;  // depth-of-field blur removed
    this.amount = lerp(this.amount, want, 1 - Math.exp(-dt * 6));
    if (held && !held.dead) this.focus = lerp(this.focus, Math.max(0.4, held.root.position.distanceTo(camera.position)), 1 - Math.exp(-dt * 12));
    const U = this.mat.uniforms;
    U.uAmount.value = this.amount; U.uFocus.value = this.focus; U.uNear.value = camera.near; U.uFar.value = camera.far;
    renderer.setRenderTarget(this.rt);
    renderer.render(scene, camera);
    this.bloom(renderer);
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.cam);
  },
};
