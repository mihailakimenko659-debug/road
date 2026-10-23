import * as THREE from 'three';
import { GTAOPass } from '../vendor/addons/postprocessing/GTAOPass.js';
import { FullScreenQuad } from '../vendor/addons/postprocessing/Pass.js';

// Постобработка «как в кино»:
//   сцена (MSAA, HDR) → мягкие тени в стыках (GTAO по глубине того же кадра,
//   поэтому разрез учитывается) → глубина резкости, зерно, виньетка → экран.

const FINAL_FRAG = /* glsl */`
  uniform sampler2D tColor, tDepth;
  uniform vec2 resolution;
  uniform float cameraNear, cameraFar, focus, band, aperture, maxBlur, time, grain, vignette;
  varying vec2 vUv;
  float viewZ(float d) { return (cameraNear * cameraFar) / ((cameraFar - cameraNear) * d - cameraFar); }
  float coc(vec2 uv) {
    float z = -viewZ(texture2D(tDepth, uv).x);
    float dz = max(0.0, abs(z - focus) - band);
    return clamp(dz * aperture / max(z, 0.5), 0.0, 1.0) * maxBlur;
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + time) * 43758.5453); }
  void main() {
    float c0 = coc(vUv);
    vec3 acc = texture2D(tColor, vUv).rgb;
    float wsum = 1.0;
    if (c0 > 0.6) {
      const float GA = 2.39996323;
      for (int i = 1; i < 28; i++) {
        float fi = float(i);
        float r = sqrt(fi / 28.0) * c0;
        vec2 o = vec2(cos(fi * GA), sin(fi * GA)) * r / resolution;
        vec2 uv = vUv + o;
        float cs = coc(uv);
        // резкий передний план не должен «расплываться» по размытому фону и наоборот
        float w = smoothstep(r - 1.5, r + 0.5, cs) + 0.02;
        vec3 s = texture2D(tColor, uv).rgb;
        // яркие точки дают боке
        w *= 1.0 + 2.0 * smoothstep(1.4, 4.0, max(s.r, max(s.g, s.b)));
        acc += s * w; wsum += w;
      }
    }
    vec3 col = acc / wsum;
    // виньетка
    vec2 q = vUv - 0.5;
    col *= 1.0 - vignette * dot(q, q) * 1.6;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    // плёночное зерно поверх готового кадра
    gl_FragColor.rgb += (hash(vUv * resolution) - 0.5) * grain;
  }`;

export class Post {
  constructor(renderer, scene, camera) {
    this.r = renderer; this.scene = scene; this.camera = camera;
    this.enabled = true;
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    this.depth = new THREE.DepthTexture(size.x, size.y);
    this.depth.type = THREE.UnsignedIntType;
    this.rtScene = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4, depthTexture: this.depth });
    this.rtLit = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, depthBuffer: false });
    this.gtao = new GTAOPass(scene, camera, Math.round(size.x / 2), Math.round(size.y / 2));
    this.gtao.setGBuffer(this.depth);
    this.gtao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 2.2, scale: 1.25, samples: 14, distanceFallOff: 1 });
    this.gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    this.gtao.blendIntensity = 0.95;
    this.final = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.rtLit.texture }, tDepth: { value: this.depth }, resolution: { value: new THREE.Vector2(size.x, size.y) },
        cameraNear: { value: camera.near }, cameraFar: { value: camera.far }, focus: { value: 10 }, band: { value: 2.6 },
        aperture: { value: 0.9 }, maxBlur: { value: 14 }, time: { value: 0 }, grain: { value: 0.022 }, vignette: { value: 0.55 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: FINAL_FRAG, depthTest: false, depthWrite: false,
    });
    this.quad = new FullScreenQuad(this.final);
  }

  setSize() {
    const s = this.r.getDrawingBufferSize(new THREE.Vector2());
    this.rtScene.setSize(s.x, s.y);
    this.rtLit.setSize(s.x, s.y);
    this.gtao.setSize(Math.round(s.x / 2), Math.round(s.y / 2));
    this.gtao.setGBuffer(this.depth);
    this.final.uniforms.resolution.value.set(s.x, s.y);
    this.final.uniforms.maxBlur.value = Math.max(6, s.y / 64);
  }

  render(focusDist, t) {
    if (!this.enabled) { this.r.setRenderTarget(null); this.r.render(this.scene, this.camera); return; }
    const r = this.r;
    r.setRenderTarget(this.rtScene);
    r.render(this.scene, this.camera);
    this.gtao.render(r, this.rtLit, this.rtScene);
    const u = this.final.uniforms;
    u.focus.value = focusDist;
    u.cameraNear.value = this.camera.near; u.cameraFar.value = this.camera.far;
    u.time.value = t % 100;
    r.setRenderTarget(null);
    this.quad.render(r);
  }
}
