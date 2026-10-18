import * as THREE from 'three';

// Свечение (bloom) для HDR-кадра с прозрачностью.
// Кадр рисуется в буфер с плавающей точкой, яркие места (> порога)
// размываются цепочкой уменьшений/увеличений и добавляются обратно.
// Прозрачность сохраняется, поэтому сквозь прогоревшую бумагу видна страница.

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function rt(w, h) {
  return new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: false,
  });
}

export class Bloom {
  constructor(renderer, w, h, levels = 6) {
    this.r = renderer;
    this.scene = rt(w, h);
    this.down = [];
    this.up = [];
    let cw = w >> 1, ch = h >> 1;
    for (let i = 0; i < levels; i++) {
      this.down.push(rt(cw, ch));
      this.up.push(rt(cw, ch));
      cw >>= 1;
      ch >>= 1;
    }
    this.q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.q.frustumCulled = false;
    this.s = new THREE.Scene();
    this.s.add(this.q);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mk = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });

    this.mPrefilter = mk(/* glsl */ `
      uniform sampler2D uSrc; uniform vec2 uTexel; uniform float uThreshold; varying vec2 vUv;
      void main() {
        vec3 c = vec3(0.0);
        c += texture2D(uSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb;
        c += texture2D(uSrc, vUv + uTexel * vec2( 1.0, -1.0)).rgb;
        c += texture2D(uSrc, vUv + uTexel * vec2(-1.0,  1.0)).rgb;
        c += texture2D(uSrc, vUv + uTexel * vec2( 1.0,  1.0)).rgb;
        c *= 0.25;
        float br = max(c.r, max(c.g, c.b));
        float soft = clamp(br - uThreshold + 0.4, 0.0, 0.8);
        soft = soft * soft / 3.2;
        float k = max(soft, br - uThreshold) / max(br, 1e-4);
        gl_FragColor = vec4(c * k, 1.0);
      }`, { uSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 0.85 } });

    // уменьшение: 13 выборок (как в Call of Duty: Advanced Warfare) — без мерцания
    this.mDown = mk(/* glsl */ `
      uniform sampler2D uSrc; uniform vec2 uTexel; varying vec2 vUv;
      vec3 s(vec2 o) { return texture2D(uSrc, vUv + o * uTexel).rgb; }
      void main() {
        vec3 a = s(vec2(-2.0, 2.0)), b = s(vec2(0.0, 2.0)), c = s(vec2(2.0, 2.0));
        vec3 d = s(vec2(-2.0, 0.0)), e = s(vec2(0.0, 0.0)), f = s(vec2(2.0, 0.0));
        vec3 g = s(vec2(-2.0, -2.0)), h = s(vec2(0.0, -2.0)), i = s(vec2(2.0, -2.0));
        vec3 j = s(vec2(-1.0, 1.0)), k = s(vec2(1.0, 1.0)), l = s(vec2(-1.0, -1.0)), m = s(vec2(1.0, -1.0));
        vec3 col = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
        gl_FragColor = vec4(col, 1.0);
      }`, { uSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });

    // увеличение: «шатровый» фильтр 3×3 + текущий уровень
    this.mUp = mk(/* glsl */ `
      uniform sampler2D uSrc, uCur; uniform vec2 uTexel; uniform float uMix; varying vec2 vUv;
      vec3 s(vec2 o) { return texture2D(uSrc, vUv + o * uTexel).rgb; }
      void main() {
        vec3 c = s(vec2(0.0)) * 4.0;
        c += (s(vec2(-1.0, 0.0)) + s(vec2(1.0, 0.0)) + s(vec2(0.0, -1.0)) + s(vec2(0.0, 1.0))) * 2.0;
        c += s(vec2(-1.0, -1.0)) + s(vec2(1.0, -1.0)) + s(vec2(-1.0, 1.0)) + s(vec2(1.0, 1.0));
        c /= 16.0;
        gl_FragColor = vec4(texture2D(uCur, vUv).rgb + c * uMix, 1.0);
      }`, { uSrc: { value: null }, uCur: { value: null }, uTexel: { value: new THREE.Vector2() }, uMix: { value: 1 } });

    // итог: кадр + свечение, мягкая компрессия бликов, прозрачность от яркости свечения
    this.mComposite = mk(/* glsl */ `
      uniform sampler2D uScene, uBloom; uniform float uStrength; varying vec2 vUv;
      vec3 shoulder(vec3 c) {
        // до 0.75 цвет не трогаем, выше — плавно уводим в белый, как плёнка
        vec3 over = max(c - 0.75, 0.0);
        vec3 lo = min(c, 0.75);
        vec3 hi = 0.25 * (1.0 - exp(-over / 0.25));
        float peak = max(c.r, max(c.g, c.b));
        vec3 res = lo + hi;
        return mix(res, vec3(max(res.r, max(res.g, res.b))), clamp((peak - 4.0) / 8.0, 0.0, 0.35));
      }
      void main() {
        vec4 sc = texture2D(uScene, vUv);
        vec3 bl = texture2D(uBloom, vUv).rgb * uStrength;
        vec3 c = shoulder(sc.rgb + bl);
        float a = clamp(max(sc.a, max(bl.r, max(bl.g, bl.b)) * 0.9), 0.0, 1.0);
        // зерно, чтобы градиенты не «полосили»
        float g = fract(sin(dot(vUv * 913.7, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
        // свет может быть ярче своей прозрачности — так свечение складывается со страницей под ним
        gl_FragColor = vec4(clamp(c + g * 0.012 * a, 0.0, 1.0), a);
      }`, { uScene: { value: null }, uBloom: { value: null }, uStrength: { value: 0.7 } });
  }

  pass(mat, target) {
    this.q.material = mat;
    this.r.setRenderTarget(target);
    this.r.render(this.s, this.cam);
  }

  // drawScene рисует сцену в this.scene
  render(drawScene) {
    this.r.setRenderTarget(this.scene);
    this.r.setClearColor(0x000000, 0);
    this.r.clear();
    drawScene();

    const src = this.scene.texture;
    this.mPrefilter.uniforms.uSrc.value = src;
    this.mPrefilter.uniforms.uTexel.value.set(1 / this.scene.width, 1 / this.scene.height);
    this.pass(this.mPrefilter, this.down[0]);
    for (let i = 1; i < this.down.length; i++) {
      this.mDown.uniforms.uSrc.value = this.down[i - 1].texture;
      this.mDown.uniforms.uTexel.value.set(1 / this.down[i - 1].width, 1 / this.down[i - 1].height);
      this.pass(this.mDown, this.down[i]);
    }
    const last = this.down.length - 1;
    let acc = this.down[last];
    for (let i = last - 1; i >= 0; i--) {
      this.mUp.uniforms.uSrc.value = acc.texture;
      this.mUp.uniforms.uCur.value = this.down[i].texture;
      this.mUp.uniforms.uTexel.value.set(1 / acc.width, 1 / acc.height);
      this.mUp.uniforms.uMix.value = 1.0;
      this.pass(this.mUp, this.up[i]);
      acc = this.up[i];
    }
    this.mComposite.uniforms.uScene.value = src;
    this.mComposite.uniforms.uBloom.value = acc.texture;
    this.pass(this.mComposite, null);
  }

  dispose() {
    [this.scene, ...this.down, ...this.up].forEach((t) => t.dispose());
  }
}
