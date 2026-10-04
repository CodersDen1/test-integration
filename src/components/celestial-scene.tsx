"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/** A real, depth-based WebGL sky. The HTML/SVG sky remains its graceful fallback. */
export default function CelestialScene({ calm, galaxy = false }: { calm: boolean; galaxy?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const calmRef = useRef(calm);
  const galaxyRef = useRef(galaxy);
  useEffect(() => { galaxyRef.current = galaxy; }, [galaxy]);
  useEffect(() => { calmRef.current = calm; }, [calm]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch { return; }

    const small = window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;
    // Retina tablets need the same GPU budget as phones, regardless of width.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? .85 : 1.5));
    renderer.setClearColor(0x000000, 0);
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 9;
    const group = new THREE.Group();
    scene.add(group);
    const count = small ? 140 : 620;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const palette = [new THREE.Color("#efd4af"), new THREE.Color("#bda8ef"), new THREE.Color("#f2abc9")];
    for (let i = 0; i < count; i++) {
      // Deterministic placement keeps the scene stable across reloads.
      const a = Math.sin(i * 127.1 + 1) * 43758.5453;
      const b = Math.sin(i * 269.5 + 2) * 43758.5453;
      const c = Math.sin(i * 419.2 + 3) * 43758.5453;
      positions[i * 3] = ((a - Math.floor(a)) - .5) * 28;
      positions[i * 3 + 1] = ((b - Math.floor(b)) - .5) * 18;
      positions[i * 3 + 2] = -((c - Math.floor(c)) * 15);
      sizes[i] = i % 19 === 0 ? 5 : 1.3 + (i % 4) * .45;
      phases[i] = i * 1.37;
      palette[i % 3].toArray(colors, i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uBurst: { value: 0 }, uGalaxy: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
      vertexShader: `
        attribute float aSize; attribute float aPhase; attribute vec3 aColor;
        uniform float uTime; uniform float uGalaxy; uniform float uBurst; uniform float uPixelRatio;
        varying vec3 vColor; varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * .12 + aPhase) * .12;
          p.y += cos(uTime * .1 + aPhase) * .10;
          float radius = fract(sin(aPhase * 17.13) * 43758.54) * 8.5;
          float angle = aPhase * 2.399 + radius * .57 + uTime * .045;
          vec3 spiral = vec3(cos(angle) * radius, sin(angle) * radius * .58, sin(aPhase) * 2.0 - 3.0);
          p = mix(p, spiral, uGalaxy);
          p.xy *= 1.0 + uBurst * .65;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = min(24.0, aSize * uPixelRatio * (11.0 / -mv.z) * (1.0 + uBurst * 1.8));
          vColor = mix(aColor, aColor * 1.6, uGalaxy); vAlpha = .28 + .38 * (.5 + .5 * sin(uTime * .65 + aPhase));
        }`,
      fragmentShader: `
        varying vec3 vColor; varying float vAlpha;
        void main() {
          vec2 p = gl_PointCoord - .5;
          float d = length(p);
          float glow = exp(-d * 9.0);
          float core = 1.0 - smoothstep(.02, .17, d);
          float cross = exp(-abs(p.x) * 70.0) * exp(-abs(p.y) * 10.0) + exp(-abs(p.y) * 70.0) * exp(-abs(p.x) * 10.0);
          gl_FragColor = vec4(vColor, (glow * .45 + core * .65 + cross * .2) * vAlpha);
        }`,
    });
    const points = new THREE.Points(geometry, material);
    group.add(points);

    // A flowing rose/lilac nebula, rendered in a lightweight fullscreen shader.
    const nebulaGeometry = new THREE.PlaneGeometry(2, 2);
    const nebulaMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: false,
      uniforms: { uTime: { value: 0 }, uAspect: { value: 1 }, uChapter: { value: 0 }, uGalaxy: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, .999, 1.); }`,
      fragmentShader: `
        varying vec2 vUv; uniform float uTime; uniform float uAspect; uniform float uChapter; uniform float uGalaxy;
        void main() {
          vec2 uv = vUv; uv.x *= uAspect;
          float t = uTime * .045;
          vec2 center = vec2(uAspect * (.72 - uChapter * .22), .55);
          vec2 p = uv - center;
          float wave = sin(p.x * 4. + t) * .14 + cos(p.y * 3. - t) * .09;
          float cloud = exp(-length(p * vec2(1.0, 1.9) + wave) * 2.8);
          float ribbon = exp(-abs(p.y + sin(p.x * 2.2 + t) * .26) * 12.) * exp(-abs(p.x) * 1.7);
          vec3 color = mix(vec3(.39,.23,.55), vec3(.62,.28,.40), .5 + sin(p.x + t) * .5);
          vec2 g = (vUv - vec2(.5, .48)) * vec2(uAspect, 1.0);
          float radius = length(g);
          float angle = atan(g.y, g.x);
          float arms = pow(.5 + .5 * sin(angle * 3.0 - radius * 17.0 + t), 3.0);
          float galaxyCloud = exp(-radius * 2.6) * (.3 + arms * .6);
          vec3 galaxyColor = mix(vec3(.3,.2,.7), vec3(.88,.32,.55), .5 + .5 * sin(angle + radius * 6.0));
          galaxyColor += vec3(.4,.35,.28) * exp(-radius * 11.0);
          gl_FragColor = vec4(mix(color, galaxyColor, uGalaxy), cloud * .10 + ribbon * .055 + galaxyCloud * uGalaxy * .86);
        }`,
    });
    const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
    nebula.renderOrder = -1;
    scene.add(nebula);
    const target = new THREE.Vector2();
    let chapter = 0;
    let burst = 0;
    let elapsed = 0;
    let last = 0;
    let lastFrame = 0;
    let previousCalm = false;
    let previousGalaxy = false;
    let galaxyMix = 0;
    let disposed = false;
    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      nebulaMaterial.uniforms.uAspect.value = camera.aspect;
      renderer.render(scene, camera);
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      target.set((event.clientX / window.innerWidth - .5) * .65, -(event.clientY / window.innerHeight - .5) * .35);
    };
    const scroll = () => { chapter = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight); };
    const celebrate = () => { if (!calmRef.current) burst = 1; };
    const render = (time: number) => {
      if (disposed || document.hidden) { last = time; return; }
      // Ambient sky can run at 30fps while the scroll/couple stays at full rate.
      if (small && time - lastFrame < 1000 / 30) return;
      lastFrame = time;
      const isCalm = calmRef.current;
      if (isCalm && previousCalm && previousGalaxy === galaxyRef.current) { last = time; return; }
      const dt = Math.min((time - last) / 1000 || 0, .05);
      last = time;
      if (!isCalm) elapsed += dt;
      previousCalm = isCalm;
      previousGalaxy = galaxyRef.current;
      galaxyMix = isCalm ? (galaxyRef.current ? 1 : 0) : THREE.MathUtils.damp(galaxyMix, galaxyRef.current ? 1 : 0, 1.1, dt);
      material.uniforms.uGalaxy.value = galaxyMix;
      nebulaMaterial.uniforms.uGalaxy.value = galaxyMix;
      if (isCalm) { camera.position.x = 0; camera.position.y = 0; burst = 0; }
      else {
        camera.position.x += (target.x - camera.position.x) * .025;
        camera.position.y += (target.y - camera.position.y) * .025;
        group.rotation.z = Math.sin(elapsed * .025) * .035;
      }
      burst = Math.max(0, burst - dt * .45);
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uBurst.value = Math.sin(burst * Math.PI);
      nebulaMaterial.uniforms.uTime.value = elapsed;
      nebulaMaterial.uniforms.uChapter.value += (chapter - nebulaMaterial.uniforms.uChapter.value) * .03;
      renderer.render(scene, camera);
    };
    const contextLost = (event: Event) => { event.preventDefault(); renderer.setAnimationLoop(null); element.style.opacity = "0"; };
    resize();
    scroll();
    renderer.setAnimationLoop(render);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("ayla-celebrate", celebrate);
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("ayla-celebrate", celebrate);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      geometry.dispose(); material.dispose(); nebulaGeometry.dispose(); nebulaMaterial.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return <div className={`celestial-canvas ${galaxy ? "galaxy-sky" : ""}`} ref={host} aria-hidden="true" />;
}
