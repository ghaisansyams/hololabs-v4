import * as THREE from "three";
import type { Ctx } from "./chapters";

/**
 * Hero object: a portal. A ring whose colour flows cyan → violet → magenta
 * frames the headline, and behind it a vortex of particles streams toward
 * the viewer. Scrolling flies the camera through the ring into the journey.
 * The vortex runs on the GPU (one shader, no per-frame CPU work).
 */
export function createPortal(ctx: Ctx, pixelRatio: number) {
  const group = new THREE.Group();

  // ---- vortex ---------------------------------------------------------
  const N = ctx.mobile ? 2600 : 6000;
  const angle = new Float32Array(N);
  const radius = new Float32Array(N);
  const depth = new Float32Array(N);
  const seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    angle[i] = Math.random() * Math.PI * 2;
    radius[i] = 1.15 + Math.pow(Math.random(), 0.7) * 1.6;
    depth[i] = Math.random();
    seed[i] = Math.random();
  }
  const vGeo = ctx.track(new THREE.BufferGeometry());
  vGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  vGeo.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
  vGeo.setAttribute("aRadius", new THREE.BufferAttribute(radius, 1));
  vGeo.setAttribute("aDepth", new THREE.BufferAttribute(depth, 1));
  vGeo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const vMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uFade: { value: 1 },
        uScale: { value: 1 },
        uPixel: { value: pixelRatio },
        uSwirl: { value: 0 },
      },
      vertexShader: `
        attribute float aAngle; attribute float aRadius; attribute float aDepth; attribute float aSeed;
        uniform float uTime; uniform float uFade; uniform float uScale; uniform float uPixel; uniform float uSwirl;
        varying vec3 vColor; varying float vAlpha;
        void main(){
          float z = fract(aDepth + uTime * (0.03 + aSeed * 0.025));
          float r = aRadius * uScale * (0.55 + 0.45 * z);
          float a = aAngle + uTime * (0.12 + 0.35 / aRadius) + uSwirl + z * 2.4;
          vec3 p = vec3(cos(a) * r, sin(a) * r, -34.0 * (1.0 - z));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (2.0 + aSeed * 5.0) * uPixel * (6.0 / -mv.z);
          vec3 cyan = vec3(0.13, 0.83, 0.93);
          vec3 violet = vec3(0.49, 0.36, 0.98);
          vec3 magenta = vec3(0.91, 0.47, 0.98);
          float t = 0.5 + 0.5 * sin(aAngle * 2.0 + z * 6.0);
          vColor = mix(mix(cyan, violet, t), magenta, smoothstep(0.7, 1.0, aSeed));
          vAlpha = smoothstep(0.0, 0.35, z) * smoothstep(1.0, 0.82, z) * uFade;
        }`,
      fragmentShader: `
        varying vec3 vColor; varying float vAlpha;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vColor, a * vAlpha);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const vortex = new THREE.Points(vGeo, vMat);
  vortex.frustumCulled = false;
  group.add(vortex);

  // ---- ring -----------------------------------------------------------
  const ringMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `
        uniform float uTime; uniform float uFade; varying vec2 vUv;
        vec3 pal(float t){
          vec3 c1 = vec3(0.13,0.83,0.93); vec3 c2 = vec3(0.49,0.36,0.98); vec3 c3 = vec3(0.91,0.36,0.85);
          t = fract(t) * 3.0;
          return t < 1.0 ? mix(c1,c2,t) : t < 2.0 ? mix(c2,c3,t-1.0) : mix(c3,c1,t-2.0);
        }
        void main(){
          vec3 c = pal(vUv.x - uTime * 0.06);
          float spark = pow(0.5 + 0.5 * sin((vUv.x * 6.2831 - uTime * 1.3) * 3.0), 14.0);
          gl_FragColor = vec4(c * (1.1 + spark * 1.6), uFade);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const ring = new THREE.Mesh(ctx.track(new THREE.TorusGeometry(1, 0.012, 16, 320)), ringMat);
  group.add(ring);

  const dashMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uFade: { value: 1 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform float uTime; uniform float uFade; varying vec2 vUv;
        void main(){ float d = step(0.55, fract(vUv.x * 90.0 + uTime * 0.4)); gl_FragColor = vec4(vec3(0.55,0.9,1.0), d * 0.55 * uFade); }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const dash = new THREE.Mesh(ctx.track(new THREE.TorusGeometry(1.075, 0.005, 8, 320)), dashMat);
  group.add(dash);

  // soft halo around the ring + a dark centre that keeps the headline legible
  const haloMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: { uFade: { value: 1 }, uTime: { value: 0 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform float uFade; uniform float uTime; varying vec2 vUv;
        void main(){
          float d = length(vUv - 0.5) * 2.0;
          float halo = exp(-pow((d - 0.5) * 9.0, 2.0)) * (0.55 + 0.1 * sin(uTime * 1.5));
          vec3 c = mix(vec3(0.13,0.6,0.95), vec3(0.62,0.3,0.98), vUv.y);
          gl_FragColor = vec4(c * halo, halo * uFade);
        }`,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  const halo = new THREE.Mesh(ctx.track(new THREE.PlaneGeometry(4, 4)), haloMat);
  halo.position.z = -0.05;
  group.add(halo);

  const coreMat = ctx.track(
    new THREE.ShaderMaterial({
      uniforms: { uFade: { value: 1 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: `uniform float uFade; varying vec2 vUv;
        void main(){ float d = length(vUv - 0.5) * 2.0; gl_FragColor = vec4(0.012, 0.008, 0.03, smoothstep(1.0, 0.2, d) * 0.72 * uFade); }`,
      transparent: true,
      depthWrite: false,
    }),
  );
  const core = new THREE.Mesh(ctx.track(new THREE.CircleGeometry(1, 64)), coreMat);
  core.position.z = -0.3;
  group.add(core);

  // a few orbiting satellites
  const sats: THREE.Sprite[] = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(
      ctx.track(new THREE.SpriteMaterial({ map: ctx.dot, color: [0x67e8f9, 0xc4b5fd, 0xf0abfc][i], transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })),
    );
    group.add(s);
    sats.push(s);
  }

  let R = 3.4;
  return {
    group,
    layout(portrait: boolean) {
      R = portrait ? 1.5 : 3.3;
      group.position.set(0, portrait ? 2.8 : 0.05, 0);
      ring.scale.setScalar(R);
      dash.scale.setScalar(R);
      halo.scale.setScalar(R * 0.72);
      core.scale.setScalar(R * 0.98);
      vMat.uniforms.uScale.value = R;
      sats.forEach((s, i) => s.scale.setScalar((portrait ? 0.35 : 0.5) * (1 - i * 0.2)));
    },
    update(time: number, fade: number, px: number, py: number) {
      const visible = fade > 0.01;
      group.visible = visible;
      if (!visible) return;
      vMat.uniforms.uTime.value = time;
      vMat.uniforms.uFade.value = fade;
      vMat.uniforms.uSwirl.value = px * 0.4;
      for (const m of [ringMat, dashMat, haloMat]) {
        m.uniforms.uTime.value = time;
        m.uniforms.uFade.value = fade;
      }
      coreMat.uniforms.uFade.value = fade;
      ring.rotation.set(py * 0.12, px * 0.18, 0);
      dash.rotation.set(py * 0.12, px * 0.18, -time * 0.05);
      sats.forEach((s, i) => {
        const a = time * (0.5 + i * 0.17) + i * 2.1;
        const r = R * (1.0 + i * 0.04);
        s.position.set(Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 2) * 0.3);
        (s.material as THREE.SpriteMaterial).opacity = fade;
      });
    },
  };
}
