import * as THREE from 'three';

// Двумерная симуляция горячего газа на видеокарте (метод «стабильных жидкостей»).
// Поля: скорость, «краска» (r — температура пламени, g — дым), давление, вихри.
// Горячий газ поднимается (плавучесть), закручивается (сохранение вихрей),
// остывает и превращается в дым.

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

function target(w, h) {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
  });
}
function pingpong(w, h) {
  const a = target(w, h), b = target(w, h);
  return {
    read: a,
    write: b,
    swap() {
      const t = this.read;
      this.read = this.write;
      this.write = t;
    },
  };
}

export class Fluid {
  constructor(renderer, aspect, simH, dyeH, common) {
    this.r = renderer;
    this.simW = Math.round(simH * aspect);
    this.simH = simH;
    const dyeW = Math.round(dyeH * aspect);
    this.vel = pingpong(this.simW, simH);
    this.dye = pingpong(dyeW, dyeH);
    this.prs = pingpong(this.simW, simH);
    this.div = target(this.simW, simH);
    this.curl = target(this.simW, simH);
    this.texel = new THREE.Vector2(1 / this.simW, 1 / simH);
    this.dyeTexel = new THREE.Vector2(1 / dyeW, 1 / dyeH);
    this.scene = new THREE.Scene();
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    const mk = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
    const u = () => ({ uTexel: { value: this.texel } });

    this.mAdvect = mk(/* glsl */ `
      uniform sampler2D uVel, uSrc; uniform vec2 uTexel; uniform float uDt; uniform vec4 uDiss;
      varying vec2 vUv;
      void main() {
        vec2 coord = vUv - uDt * texture2D(uVel, vUv).xy * uTexel;
        gl_FragColor = uDiss * texture2D(uSrc, coord);
      }`, { ...u(), uVel: { value: null }, uSrc: { value: null }, uDt: { value: 0 }, uDiss: { value: new THREE.Vector4() } });

    // источники: кромка горящей бумаги и огненный шар взрыва розы
    this.mDyeSource = mk(/* glsl */ `
      ${common}
      uniform sampler2D uSrc; uniform float uTime, uAspect, uDt;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(uSrc, vUv);
        float T = uTime;
        float sm = ss(3.0, 4.0, T), fl = ss(4.0, 5.0, T), fx = clamp((T - 5.0) / 0.8, 0.0, 1.0);
        float d = burnDist(vUv, T, uAspect);
        float band = exp(-max(d, 0.0) / 0.012) * step(-0.004, d) * step(3.0, T) * (1.0 - ss(5.85, 6.0, T));
        vec2 p = vec2(vUv.x * uAspect, vUv.y);
        float patchy = 0.3 + 1.4 * noise(vec2(p.x * 9.0, T * 1.7)) * noise(vec2(p.x * 23.0 + 4.0, T * 3.1));
        float heat = (0.3 * sm + 2.2 * fl + 3.2 * fx) * patchy;
        c.r += band * heat * uDt * 9.0;
        c.g += band * (0.9 * sm + 0.35 * fl + 0.15 * fx) * uDt * 2.2;
        // взрыв розы — короткий огненный шар
        float boom = step(3.0, T) * exp(-(T - 3.0) * 9.0);
        vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
        float disk = exp(-dot(q, q) / 0.006) * (0.6 + 0.8 * noise(p * 18.0));
        c.r += boom * disk * uDt * 26.0;
        c.g += boom * disk * uDt * 5.0;
        // остывая, пламя превращается в дым
        c.g += c.r * 0.5 * uDt * (1.0 - fx);
        // там, где бумага уже сгорела, гореть нечему: огонь и дым быстро рассеиваются,
        // и под ними остаётся чистая основная страница
        float burnt = ss(-0.03, -0.12, d) * step(3.0, T);
        c.r *= mix(1.0, 0.84, burnt);
        c.g *= mix(1.0, 0.9, burnt);
        c.r = min(c.r, 5.0);
        c.g = min(c.g, 2.5);
        gl_FragColor = c;
      }`, { uSrc: { value: null }, uTime: { value: 0 }, uAspect: { value: aspect }, uDt: { value: 0 } });

    // силы: плавучесть горячего газа, тяга у кромки, разлёт взрыва, вихри
    this.mForce = mk(/* glsl */ `
      ${common}
      uniform sampler2D uVel, uDye, uCurl; uniform vec2 uTexel; uniform float uTime, uAspect, uDt;
      varying vec2 vUv;
      void main() {
        vec2 v = texture2D(uVel, vUv).xy;
        vec4 dye = texture2D(uDye, vUv);
        float T = uTime;
        float fx = clamp((T - 5.0) / 0.8, 0.0, 1.0), fl = ss(4.0, 5.0, T);
        v.y += uDt * (dye.r * 430.0 - dye.g * 14.0);
        float d = burnDist(vUv, T, uAspect);
        float band = exp(-max(d, 0.0) / 0.015) * step(-0.004, d) * step(3.0, T);
        vec2 p = vec2(vUv.x * uAspect, vUv.y);
        v.x += band * uDt * (noise(vec2(p.x * 6.0, T * 2.0)) - 0.5) * 900.0 * (0.3 + fl + fx);
        float boom = step(3.0, T) * exp(-(T - 3.0) * 9.0);
        vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
        v += boom * normalize(q + 1e-4) * exp(-dot(q, q) / 0.01) * uDt * 9000.0;
        // сохранение вихрей: подкручиваем поток там, где он уже вращается
        float L = abs(texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x);
        float R = abs(texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x);
        float B = abs(texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x);
        float Tt = abs(texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x);
        float C = texture2D(uCurl, vUv).x;
        vec2 f = vec2(Tt - B, R - L);
        f /= length(f) + 1e-4;
        f *= 32.0 * C * vec2(1.0, -1.0);
        v += f * uDt;
        gl_FragColor = vec4(clamp(v, vec2(-900.0), vec2(900.0)), 0.0, 1.0);
      }`, { ...u(), uVel: { value: null }, uDye: { value: null }, uCurl: { value: null }, uTime: { value: 0 }, uAspect: { value: aspect }, uDt: { value: 0 } });

    this.mCurl = mk(/* glsl */ `
      uniform sampler2D uVel; uniform vec2 uTexel; varying vec2 vUv;
      void main() {
        float L = texture2D(uVel, vUv - vec2(uTexel.x, 0.0)).y;
        float R = texture2D(uVel, vUv + vec2(uTexel.x, 0.0)).y;
        float B = texture2D(uVel, vUv - vec2(0.0, uTexel.y)).x;
        float T = texture2D(uVel, vUv + vec2(0.0, uTexel.y)).x;
        gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
      }`, { ...u(), uVel: { value: null } });

    this.mDiv = mk(/* glsl */ `
      uniform sampler2D uVel; uniform vec2 uTexel; varying vec2 vUv;
      void main() {
        float L = texture2D(uVel, vUv - vec2(uTexel.x, 0.0)).x;
        float R = texture2D(uVel, vUv + vec2(uTexel.x, 0.0)).x;
        float B = texture2D(uVel, vUv - vec2(0.0, uTexel.y)).y;
        float T = texture2D(uVel, vUv + vec2(0.0, uTexel.y)).y;
        gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
      }`, { ...u(), uVel: { value: null } });

    this.mPressure = mk(/* glsl */ `
      uniform sampler2D uPrs, uDiv; uniform vec2 uTexel; varying vec2 vUv;
      void main() {
        float L = texture2D(uPrs, vUv - vec2(uTexel.x, 0.0)).x;
        float R = texture2D(uPrs, vUv + vec2(uTexel.x, 0.0)).x;
        float B = texture2D(uPrs, vUv - vec2(0.0, uTexel.y)).x;
        float T = texture2D(uPrs, vUv + vec2(0.0, uTexel.y)).x;
        float d = texture2D(uDiv, vUv).x;
        gl_FragColor = vec4((L + R + B + T - d) * 0.25, 0.0, 0.0, 1.0);
      }`, { ...u(), uPrs: { value: null }, uDiv: { value: null } });

    this.mGrad = mk(/* glsl */ `
      uniform sampler2D uPrs, uVel; uniform vec2 uTexel; varying vec2 vUv;
      void main() {
        float L = texture2D(uPrs, vUv - vec2(uTexel.x, 0.0)).x;
        float R = texture2D(uPrs, vUv + vec2(uTexel.x, 0.0)).x;
        float B = texture2D(uPrs, vUv - vec2(0.0, uTexel.y)).x;
        float T = texture2D(uPrs, vUv + vec2(0.0, uTexel.y)).x;
        vec2 v = texture2D(uVel, vUv).xy - 0.5 * vec2(R - L, T - B);
        gl_FragColor = vec4(v, 0.0, 1.0);
      }`, { ...u(), uPrs: { value: null }, uVel: { value: null } });

    this.mFade = mk(/* glsl */ `
      uniform sampler2D uSrc; uniform float uK; varying vec2 vUv;
      void main() { gl_FragColor = texture2D(uSrc, vUv) * uK; }`, { uSrc: { value: null }, uK: { value: 0.8 } });

    this.clear();
  }

  pass(mat, rt) {
    this.quad.material = mat;
    this.r.setRenderTarget(rt);
    this.r.render(this.scene, this.cam);
  }

  clear() {
    const c = new THREE.Color(0, 0, 0);
    [this.vel, this.dye, this.prs].forEach((pp) => [pp.read, pp.write].forEach((t) => {
      this.r.setRenderTarget(t);
      this.r.setClearColor(c, 0);
      this.r.clear();
    }));
    this.r.setRenderTarget(null);
  }

  step(time, dt) {
    const { vel, dye, prs } = this;
    // 1. перенос скорости
    Object.assign(this.mAdvect.uniforms, {});
    this.mAdvect.uniforms.uTexel.value = this.texel;
    this.mAdvect.uniforms.uVel.value = vel.read.texture;
    this.mAdvect.uniforms.uSrc.value = vel.read.texture;
    this.mAdvect.uniforms.uDt.value = dt;
    this.mAdvect.uniforms.uDiss.value.set(0.992, 0.992, 1, 1);
    this.pass(this.mAdvect, vel.write);
    vel.swap();
    // 2. вихри и силы
    this.mCurl.uniforms.uVel.value = vel.read.texture;
    this.pass(this.mCurl, this.curl);
    const f = this.mForce.uniforms;
    f.uVel.value = vel.read.texture;
    f.uDye.value = dye.read.texture;
    f.uCurl.value = this.curl.texture;
    f.uTime.value = time;
    f.uDt.value = dt;
    this.pass(this.mForce, vel.write);
    vel.swap();
    // 3. несжимаемость: давление и вычитание градиента
    this.mDiv.uniforms.uVel.value = vel.read.texture;
    this.pass(this.mDiv, this.div);
    this.mFade.uniforms.uSrc.value = prs.read.texture;
    this.pass(this.mFade, prs.write);
    prs.swap();
    this.mPressure.uniforms.uDiv.value = this.div.texture;
    for (let i = 0; i < 22; i++) {
      this.mPressure.uniforms.uPrs.value = prs.read.texture;
      this.pass(this.mPressure, prs.write);
      prs.swap();
    }
    this.mGrad.uniforms.uPrs.value = prs.read.texture;
    this.mGrad.uniforms.uVel.value = vel.read.texture;
    this.pass(this.mGrad, vel.write);
    vel.swap();
    // 4. перенос температуры и дыма; пламя остывает быстрее, чем рассеивается дым
    this.mAdvect.uniforms.uTexel.value = this.texel;
    this.mAdvect.uniforms.uVel.value = vel.read.texture;
    this.mAdvect.uniforms.uSrc.value = dye.read.texture;
    this.mAdvect.uniforms.uDiss.value.set(0.976, 0.986, 1, 1);
    this.pass(this.mAdvect, dye.write);
    dye.swap();
    const s = this.mDyeSource.uniforms;
    s.uSrc.value = dye.read.texture;
    s.uTime.value = time;
    s.uDt.value = dt;
    this.pass(this.mDyeSource, dye.write);
    dye.swap();
    this.r.setRenderTarget(null);
  }
}
