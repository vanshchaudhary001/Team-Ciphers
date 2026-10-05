/*
 * "First Week" lobby scene (Three.js r169 via jsDelivr ESM builds).
 * Lazy-loaded by intro-lobby.js. Exports createLobbyScene({ canvas, text }).
 *
 * Timing lives in INTRO_TIMINGS in intro-lobby.js: this file only adds its tweens to the caller's
 * single GSAP master timeline (addToTimeline) and renders on gsap.ticker, so there is one clock.
 * Look (colours, camera path) is in CONFIG below.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/+esm';
import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/environments/RoomEnvironment.js/+esm';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/geometries/RoundedBoxGeometry.js/+esm';
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/utils/BufferGeometryUtils.js/+esm';
import { Reflector } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/objects/Reflector.js/+esm';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js/+esm';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/RenderPass.js/+esm';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/UnrealBloomPass.js/+esm';
import { OutputPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/OutputPass.js/+esm';

export const CONFIG = {
  colors: {
    void: 0x07090d,
    floor: 0x15181d,
    wall: 0xd8d4cd,
    featureWall: 0x29251f,
    ceiling: 0x0e1014,
    ceilingLight: 0xeef3ff,
    warm: 0xffbe86,
    sign: 0xeaf2ff,
    signOff: 0x2a2e35,
    metal: 0xc6c9ce,
    desk: 0x2b2420,
    deskTop: 0xe8e4dd,
    plant: 0x2e4636,
    pot: 0xb9b2a8,
    displayA: 0x0c2236,
    displayB: 0x2a3d55,
    displayC: 0xd9925b,
  },
  // Camera path: one smooth spline (position + look target), outside the glass doors -> through the
  // lobby -> stopped in front of the sign wall. The camera moves along it by arc length, so its speed
  // comes only from the timeline's ease: no speed changes between segments.
  camera: [
    { pos: [0.0, 1.65, 11.5], look: [0.0, 1.6, 0.0] },
    { pos: [0.0, 1.65, 8.6], look: [0.0, 1.6, -1.5] },
    { pos: [0.3, 1.7, 3.4], look: [-0.7, 1.55, -4.0] },
    { pos: [0.4, 1.8, -2.2], look: [0.4, 2.3, -10.0] },
    { pos: [0.15, 2.0, -5.6], look: [0.0, 2.6, -12.0] },
  ],
  pushDistance: 0.6, // metres the camera eases toward the sign during the cross-fade
};

export async function createLobbyScene({ canvas, text = 'FIRST WEEK' }) {
  const C = CONFIG.colors;
  // Phones/tablets (touch-first) or narrow windows get the lighter version.
  const isMobile = window.matchMedia('(hover: none) and (pointer: coarse)').matches || window.innerWidth < 700;

  // ---------- Renderer ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: 'high-performance' });
  let dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = isMobile ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // shadows are static: the map is rendered once during warm-up
  // Don't query link status after every compile: that call blocks the main thread until the GPU finishes
  // compiling (seconds on a cold cache). Shaders still compile in the background.
  renderer.debug.checkShaderErrors = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(C.void);
  scene.fog = new THREE.FogExp2(C.void, 0.045);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.6;

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.05, 80);
  const extraTextures = [];
  const lobby = new THREE.Group();       // lobby pieces (merged static meshes, flutes, displays)
  const staticLobby = new THREE.Group(); // static pieces, merged per material below
  scene.add(lobby);

  // Lobby materials render in the transparent pass (alpha stays 1), which keeps the draw order (and so
  // the look) exactly as before.
  function lobbyMat(material) {
    material.transparent = true;
    return material;
  }

  // ---------- Materials ----------
  const mats = {
    wall: lobbyMat(new THREE.MeshStandardMaterial({ color: C.wall, roughness: 0.85 })),
    feature: lobbyMat(new THREE.MeshStandardMaterial({ color: C.featureWall, roughness: 0.7 })),
    ceiling: lobbyMat(new THREE.MeshStandardMaterial({ color: C.ceiling, roughness: 0.9 })),
    ceilingLight: lobbyMat(new THREE.MeshBasicMaterial({ color: new THREE.Color(C.ceilingLight).multiplyScalar(3.0) })),
    warmLight: lobbyMat(new THREE.MeshBasicMaterial({ color: new THREE.Color(C.warm).multiplyScalar(1.6) })),
    metal: lobbyMat(new THREE.MeshStandardMaterial({ color: C.metal, metalness: 1, roughness: 0.3 })),
    darkMetal: lobbyMat(new THREE.MeshStandardMaterial({ color: 0x1b1d21, metalness: 0.6, roughness: 0.45 })),
    desk: lobbyMat(new THREE.MeshStandardMaterial({ color: C.desk, roughness: 0.4 })),
    deskTop: lobbyMat(new THREE.MeshStandardMaterial({ color: C.deskTop, roughness: 0.18 })),
    pool: lobbyMat(new THREE.MeshBasicMaterial({ map: poolTexture(70), color: new THREE.Color(C.warm).multiplyScalar(0.55), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })),
    floorPool: lobbyMat(new THREE.MeshBasicMaterial({ map: poolTexture(128), color: new THREE.Color(C.warm).multiplyScalar(0.35), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })),
    pot: lobbyMat(new THREE.MeshStandardMaterial({ color: C.pot, roughness: 0.9 })),
    soil: lobbyMat(new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 1 })),
    plant: lobbyMat(new THREE.MeshStandardMaterial({ color: C.plant, roughness: 0.65 })),
  };
  // Glass: clear, reflective and lightweight (no transmission pass).
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xe8f0f2, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.07, envMapIntensity: 0.7, depthWrite: false });

  const mesh = (geo, mat, x, y, z, parent = staticLobby, shadows = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = shadows;
    m.receiveShadow = shadows;
    parent.add(m);
    return m;
  };
  const box = (w, h, d, mat, x, y, z, r = 0, parent = staticLobby) =>
    mesh(r > 0 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d), mat, x, y, z, parent);

  // ---------- Floor: polished stone with a faint real reflection on desktop ----------
  let reflector = null;
  if (!isMobile) {
    reflector = new Reflector(new THREE.PlaneGeometry(40, 60), {
      clipBias: 0.003,
      textureWidth: Math.round(window.innerWidth * dpr * 0.5),
      textureHeight: Math.round(window.innerHeight * dpr * 0.5),
      color: 0xa9b0ba,
    });
    reflector.rotation.x = -Math.PI / 2;
    reflector.position.set(0, 0, -8);
    scene.add(reflector);
  }
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 60),
    new THREE.MeshPhysicalMaterial({
      color: C.floor, roughness: reflector ? 0.2 : 0.28, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.15,
      transparent: !!reflector, opacity: reflector ? 0.66 : 1,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.002, -8);
  floor.receiveShadow = true;
  scene.add(floor);

  // ---------- Facade + sliding glass doors (z = 6) ----------
  const FZ = 6;
  const facade = new THREE.Group();
  scene.add(facade);
  box(4.75, 4.6, 0.02, glassMat, -3.625, 2.3, FZ, 0, facade);
  box(4.75, 4.6, 0.02, glassMat, 3.625, 2.3, FZ, 0, facade);
  box(2.5, 1.55, 0.02, glassMat, 0, 3.825, FZ, 0, facade);
  for (const x of [-6, -3.6, -1.25, 1.25, 3.6, 6]) box(0.06, 4.6, 0.12, mats.metal, x, 2.3, FZ);
  box(2.56, 0.06, 0.12, mats.metal, 0, 3.05, FZ);
  const doorL = new THREE.Group(), doorR = new THREE.Group();
  for (const [g, side] of [[doorL, -1], [doorR, 1]]) {
    // Doors move, so they stay separate and don't cast (baked) shadows.
    box(1.22, 3.0, 0.025, glassMat, 0, 1.5, 0, 0, g).castShadow = false;
    box(0.04, 3.0, 0.05, mats.metal, side * -0.59, 1.5, 0, 0, g).castShadow = false;
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 12), mats.metal, side * -0.5, 1.1, 0.05, g, false);
    g.position.set(side * 0.61, 0, FZ);
    facade.add(g);
  }

  // ---------- Walls, ceiling, light slots ----------
  box(0.1, 4.6, 18, mats.wall, -6, 2.3, -3);
  box(0.1, 4.6, 18, mats.wall, 6, 2.3, -3);
  box(12.1, 4.6, 0.1, mats.feature, 0, 2.3, -12);
  const flutes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 4.5, 0.05), mats.feature, 64);
  for (let i = 0; i < 64; i++) {
    const d = new THREE.Object3D();
    d.position.set(-5.85 + i * 0.185, 2.3, -11.93);
    d.updateMatrix();
    flutes.setMatrixAt(i, d.matrix);
  }
  flutes.receiveShadow = true;
  lobby.add(flutes);
  for (const x of [-2.7, 2.7]) box(0.5, 4.6, 0.5, mats.wall, x, 2.3, -6.4, 0.03);
  box(12.1, 0.1, 18, mats.ceiling, 0, 4.65, -3);
  for (const x of [-2.2, 2.2]) box(0.08, 0.02, 16, mats.ceilingLight, x, 4.59, -3.5);
  for (const z of [2.5, -2.5, -7.5]) box(4.4, 0.02, 0.08, mats.ceilingLight, 0, 4.59, z);
  for (const x of [-5.92, 5.92]) box(0.02, 0.03, 17.5, mats.warmLight, x, 4.45, -3);

  // Warm wall-washer scallops: additive light-pool decals instead of six extra spotlights.
  for (const side of [-1, 1]) {
    for (const z of [3, -2, -7]) {
      const pool = mesh(new THREE.PlaneGeometry(2.6, 4.2), mats.pool, side * 5.93, 2.45, z, staticLobby, false);
      pool.rotation.y = -side * Math.PI / 2;
    }
  }
  const deskPool = mesh(new THREE.PlaneGeometry(1.6, 3.6), mats.floorPool, -2.25, 0.006, 0.2, staticLobby, false);
  deskPool.rotation.x = -Math.PI / 2;

  // ---------- Reception desk ----------
  box(1.0, 1.02, 3.2, mats.desk, -3.2, 0.51, 0.2, 0.04);
  box(1.18, 0.06, 3.36, mats.deskTop, -3.2, 1.05, 0.2, 0.02);
  box(0.02, 0.02, 3.0, mats.warmLight, -2.69, 0.95, 0.2);   // warm underglow on the aisle side

  // ---------- Plants ----------
  function plant(x, z, seed) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    staticLobby.add(g);
    mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.7, 32), mats.pot, 0, 0.35, 0, g);
    mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.02, 24), mats.soil, 0, 0.69, 0, g, false);
    const rand = mulberry32(seed);
    for (let i = 0; i < 11; i++) {
      const leaf = mesh(new THREE.CapsuleGeometry(0.05, 0.75 + rand() * 0.35, 4, 10), mats.plant, 0, 0, 0, g);
      leaf.scale.z = 0.35;
      const a = (i / 11) * Math.PI * 2 + rand() * 0.4;
      const tilt = 0.15 + rand() * 0.35;
      leaf.position.set(Math.cos(a) * 0.08, 1.15, Math.sin(a) * 0.08);
      leaf.rotation.set(Math.sin(a) * tilt, a, -Math.cos(a) * tilt);
    }
  }
  plant(-4.8, -4.2, 3);
  plant(4.9, 3.9, 5);
  plant(-4.9, 4.3, 9);

  // ---------- Elevators (right wall) ----------
  for (const zc of [-1.5, -4.5, -7.5]) {
    box(0.08, 2.75, 1.55, mats.darkMetal, 5.94, 1.375, zc);
    box(0.04, 2.5, 0.68, mats.metal, 5.89, 1.25, zc - 0.345);
    box(0.04, 2.5, 0.68, mats.metal, 5.89, 1.25, zc + 0.345);
    box(0.02, 0.05, 0.32, mats.warmLight, 5.88, 2.86, zc);
  }
  for (const zc of [-3.0, -6.0]) box(0.02, 0.05, 0.05, mats.warmLight, 5.9, 1.15, zc);

  // ---------- Wall displays (left wall) with soft animated content ----------
  const displays = [];
  for (const [i, zc] of [[0, -3.2], [1, -7.0]]) {
    box(0.06, 1.45, 2.5, mats.darkMetal, -5.93, 2.1, zc, 0.02);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uPower: { value: 0 },
        uA: { value: new THREE.Color(C.displayA) }, uB: { value: new THREE.Color(C.displayB) }, uC: { value: new THREE.Color(C.displayC) },
        uSeed: { value: i * 3.7 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime, uPower, uSeed; uniform vec3 uA, uB, uC;
        varying vec2 vUv;
        void main() {
          float t = uTime + uSeed;
          vec3 col = mix(uA, uB, smoothstep(0.0, 1.0, vUv.y + 0.25 * sin(t * 0.25 + vUv.x * 3.0)));
          col = mix(col, uC, 0.32 * (0.5 + 0.5 * sin(t * 0.35 + vUv.x * 2.2 + vUv.y * 1.3)) * smoothstep(0.2, 1.0, vUv.x));
          float lines = smoothstep(0.93, 1.0, fract(vUv.y * 14.0 - t * 0.22)) * 0.10;
          float scan = (1.0 - smoothstep(0.0, 0.006, abs(vUv.y - fract(t * 0.11)))) * 0.22;
          float vig = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x)) * smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.85, 1.0, vUv.y));
          col = (col * (0.55 + 0.45 * vig) + lines + scan) * uPower * 1.25;
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    mat.transparent = true;
    const screen = mesh(new THREE.PlaneGeometry(2.36, 1.32), mat, -5.89, 2.1, zc, lobby, false);
    screen.rotation.y = Math.PI / 2;
    screen.renderOrder = 1;
    displays.push({ mat });
  }

  // ---------- Merge the static lobby: one mesh per material (far fewer draw calls) ----------
  staticLobby.updateMatrixWorld(true);
  const buckets = new Map();
  staticLobby.traverse((o) => {
    if (!o.isMesh) return;
    // Rounded boxes are non-indexed, so make every piece non-indexed before merging.
    const src = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    const g = src.applyMatrix4(o.matrixWorld);
    o.geometry.dispose();
    if (!buckets.has(o.material)) buckets.set(o.material, { geos: [], cast: false });
    const b = buckets.get(o.material);
    b.geos.push(g);
    b.cast = b.cast || o.castShadow;
  });
  flutes.renderOrder = 1;
  for (const [material, b] of buckets) {
    const geometry = mergeGeometries(b.geos, false);
    if (!geometry) throw new Error('fw-intro: could not merge lobby geometry');
    const merged = new THREE.Mesh(geometry, material);
    b.geos.forEach((g) => g.dispose());
    merged.castShadow = b.cast;
    merged.receiveShadow = true;
    merged.renderOrder = 1;
    lobby.add(merged);
  }

  // ---------- "FIRST WEEK" sign on the feature wall ----------
  const fontReady = document.fonts && document.fonts.load
    ? Promise.race([document.fonts.load('500 200px Inter'), new Promise((r) => setTimeout(r, 700))]).catch(() => {})
    : Promise.resolve();
  await fontReady;
  const signOff = new THREE.Color(C.signOff);
  const signOn = new THREE.Color(C.sign).multiplyScalar(2.6);
  const letters = buildSign(text);
  const signLight = new THREE.PointLight(C.sign, 0, 9, 2);
  signLight.position.set(0, 2.9, -11.2);
  scene.add(signLight);

  function buildSign(str) {
    const H = 0.5, TRACK = 0.16, out = [];
    const ctx = document.createElement('canvas').getContext('2d');
    const font = "500 200px Inter, 'Helvetica Neue', 'Segoe UI', Arial, sans-serif";
    ctx.font = font;
    const glyphs = [...str].map((ch) => ({ ch, w: ch === ' ' ? 0.32 : (ctx.measureText(ch).width / 200) * H * 0.95 }));
    const total = glyphs.reduce((s, g) => s + g.w, 0) + TRACK * (glyphs.length - 1);
    let x = -total / 2;
    const group = new THREE.Group();
    group.position.set(0, 2.95, -11.86); // just in front of the wall flutes
    scene.add(group);
    for (const g of glyphs) {
      if (g.ch !== ' ') {
        const c = document.createElement('canvas');
        c.width = Math.max(32, Math.ceil(g.w / H * 256));
        c.height = 256;
        const gc = c.getContext('2d');
        gc.fillStyle = '#ffffff';
        gc.font = font;
        gc.textAlign = 'center';
        gc.textBaseline = 'middle';
        gc.fillText(g.ch, c.width / 2, 138);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        extraTextures.push(tex);
        const mat = new THREE.MeshBasicMaterial({ map: tex, color: signOff.clone(), transparent: true, depthWrite: false, fog: false });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(g.w, H), mat);
        m.position.x = x + g.w / 2;
        m.renderOrder = 3;
        group.add(m);
        out.push({ mat, x: m.position.x });
      }
      x += g.w + TRACK;
    }
    return out;
  }

  // ---------- Lights (a fixed set for the whole timeline; only intensities change) ----------
  const hemi = new THREE.HemisphereLight(0xdfe6f0, 0x1a1c20, 0.5);
  scene.add(hemi);
  const spot = new THREE.SpotLight(0xf3f1ec, 70, 14, 1.05, 1, 1.6); // the only shadow-casting light
  spot.position.set(0, 4.5, -1.5);
  spot.target.position.set(0, 0, -2.5);
  spot.castShadow = true;
  spot.shadow.mapSize.set(isMobile ? 512 : 1024, isMobile ? 512 : 1024);
  spot.shadow.bias = -0.0005;
  spot.shadow.normalBias = 0.02;
  scene.add(spot, spot.target);
  const addSpot = (color, intensity, pos, target, angle) => {
    const l = new THREE.SpotLight(color, intensity, 9, angle, 0.9, 1.6);
    l.position.set(...pos);
    l.target.position.set(...target);
    scene.add(l, l.target);
  };
  for (const x of [-3, 3]) addSpot(0xf2f4f8, 22, [x, 4.45, -10.9], [x, 0.9, -12], 0.62);

  // ---------- Post-processing (created once, never rebuilt; only values change) ----------
  let composer = null, bloom = null;
  if (!isMobile) {
    composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new RenderPass(scene, camera));
    // Bloom starts from a half-resolution mip; a wide smoothWidth lets glow fade instead of snapping off.
    bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), 0.55, 0.5, 0.82);
    bloom.highPassUniforms.smoothWidth.value = 0.45;
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }
  const render = () => (composer ? composer.render() : renderer.render(scene, camera));

  // ---------- Camera spline ----------
  const keys = CONFIG.camera;
  const posCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, 'centripetal');
  const tmpLook = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();

  function fit() {
    const w = window.innerWidth, h = window.innerHeight, aspect = w / h;
    camera.aspect = aspect;
    camera.fov = aspect < 0.8 ? 64 : aspect < 1.2 ? 54 : 45; // keep the lobby width in frame on portrait screens
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
  }
  fit();
  window.addEventListener('resize', fit);

  // ---------- Animated state: written only by tweens on the caller's master timeline ----------
  // Ramps (displays, letters) are linear 0..1 over their duration; the flicker is a function of that.
  const state = {
    cam: 0,   // 0..1 along the camera spline (arc length)
    door: 0,  // 0 closed .. 1 open
    push: 0,  // 0..1 of CONFIG.pushDistance toward the sign
    sweep: 0, // light sweep across the sign
    displays: displays.map(() => ({ p: 0 })),
    letters: letters.map(() => ({ p: 0 })),
  };
  let timeline = null;
  let displayRamp = 0.45, letterRamp = 0.22;

  function apply() {
    const u = state.cam;
    camera.position.copy(posCurve.getPointAt(u));
    lookCurve.getPoint(posCurve.getUtoTmapping(u), tmpLook);
    if (state.push > 0) {
      tmpDir.subVectors(tmpLook, camera.position).normalize().multiplyScalar(CONFIG.pushDistance * state.push);
      camera.position.add(tmpDir);
      tmpLook.add(tmpDir);
    }
    camera.lookAt(tmpLook);

    doorL.position.x = -0.61 - 1.25 * state.door;
    doorR.position.x = 0.61 + 1.25 * state.door;

    const time = timeline ? timeline.time() : 0;
    displays.forEach((d, i) => {
      const p = state.displays[i].p;
      d.mat.uniforms.uTime.value = time;
      d.mat.uniforms.uPower.value = p <= 0 ? 0 : p < 1 ? flicker(p * displayRamp) * smoothstep01(p) : 1;
    });

    // Sign: letters light in sequence, then a light sweep passes across them.
    const sweepX = THREE.MathUtils.lerp(-3.2, 3.2, state.sweep);
    const sweeping = state.sweep > 0 && state.sweep < 1;
    let lit = 0;
    letters.forEach((l, i) => {
      const p = state.letters[i].p;
      const on = p <= 0 ? 0 : p < 1 ? flicker(p * letterRamp * 1.6) * p : 1;
      const sweep = sweeping ? Math.exp(-Math.pow((l.x - sweepX) / 0.45, 2)) * 0.6 : 0;
      l.mat.color.copy(signOff).lerp(signOn, on).multiplyScalar(1 + sweep);
      lit += on;
    });
    const litK = lit / letters.length;
    signLight.intensity = 9 * litK;
    if (bloom) bloom.strength = 0.55 + 0.15 * litK;
  }

  // Adds every scene tween to the master timeline. T = INTRO_TIMINGS (seconds).
  function addToTimeline(tl, T) {
    timeline = tl;
    displayRamp = T.displayRamp;
    letterRamp = T.signLetterRamp;
    const len = ([a, b]) => b - a;
    tl.to(state, { cam: 1, duration: len(T.camera), ease: T.cameraEase }, T.camera[0]);
    tl.to(state, { door: 1, duration: len(T.doors), ease: 'power3.inOut' }, T.doors[0]);
    T.displays.forEach((start, i) => {
      if (state.displays[i]) tl.to(state.displays[i], { p: 1, duration: T.displayRamp, ease: 'none' }, start);
    });
    state.letters.forEach((l, i) => tl.to(l, { p: 1, duration: T.signLetterRamp, ease: 'none' }, T.sign + i * T.signLetterGap));
    tl.to(state, { sweep: 1, duration: len(T.sweep), ease: 'power3.inOut' }, T.sweep[0]);
    tl.to(state, { push: 1, duration: len(T.handoff), ease: 'power2.inOut' }, T.handoff[0]);
  }

  // ---------- Render loop on gsap.ticker (same tick that advances the timeline, after it) ----------
  const adaptive = { frames: 0, start: 0, checked: false };
  let onStarted = () => {};
  let ticking = false;
  function tick() {
    if (!adaptive.checked) {
      // Pre-roll behind the black screen: render frames to measure fps, then decide quality.
      render();
      adaptQuality(performance.now());
      return;
    }
    apply();
    render();
  }

  // Adaptive quality: if the pre-roll averages under ~50fps, drop resolution and the floor reflection.
  // It happens while the screen is still black, so the one-off render-target rebuild isn't seen.
  // (Shadows are baked once, so they cost nothing per frame; toggling them would force shader recompiles.)
  function adaptQuality(now) {
    if (!adaptive.start) { adaptive.start = now; return; }
    adaptive.frames++;
    const secs = (now - adaptive.start) / 1000;
    if (secs < 0.6) return;
    adaptive.checked = true;
    if (adaptive.frames / secs < 50) {
      dpr = 1;
      renderer.setPixelRatio(dpr);
      if (composer) composer.setPixelRatio(dpr);
      fit();
      if (reflector) reflector.visible = false;
      render(); // absorb the rebuild before the first visible frame
    }
    onStarted();
  }
  function stopTicker() {
    if (ticking) gsap.ticker.remove(tick);
    ticking = false;
  }

  // ---------- Warm-up: compile every program without blocking, then render representative frames ----------
  function setAll(cam, door, push, sweep, on) {
    Object.assign(state, { cam, door, push, sweep });
    state.displays.forEach((d) => { d.p = on; });
    state.letters.forEach((l) => { l.p = on; });
    apply();
  }
  setAll(0, 0, 0, 0, 0);
  // Compile for the target we actually draw into: with post-processing that's the composer's render
  // target (linear, no tone mapping), not the canvas. Compiling for the canvas would build unused variants
  // and leave the real ones to compile synchronously on the first frame.
  renderer.setRenderTarget(composer ? composer.renderTarget1 : null);
  await renderer.compileAsync(scene, camera); // parallel shader compile; the loading line keeps animating
  renderer.setRenderTarget(null);
  renderer.shadowMap.needsUpdate = true;      // bake the static shadow map once
  // Draw every object once (even off-screen ones) so each program's first use (uniform lookups are
  // synchronous GPU round-trips) happens here behind the loading line, not in the first animated frames.
  const culled = [];
  scene.traverse((o) => { if (o.isMesh && o.frustumCulled) { o.frustumCulled = false; culled.push(o); } });
  render();                                   // uploads + post-processing passes, opening state
  setAll(0.6, 1, 0, 0.5, 1);
  render();                                   // mid-lobby, displays on, sign lit (bloom levels)
  setAll(1, 1, 1, 1, 1);
  render();                                   // final framing on the sign
  culled.forEach((o) => { o.frustumCulled = true; });
  setAll(0, 0, 0, 0, 0);
  render();

  return {
    addToTimeline,
    // Starts rendering; onStart fires after the short quality pre-roll (still black), when the caller
    // should start the master timeline.
    play(onStart) {
      onStarted = onStart || (() => {});
      if (!ticking) gsap.ticker.add(tick);
      ticking = true;
    },
    stop: stopTicker,
    // GPU clean-up as many small steps, so the caller can spread them over idle time.
    // (Deleting everything in one go stalled the GPU process for ~1.7s and froze the page.)
    disposeSteps() {
      stopTicker();
      window.removeEventListener('resize', fit);
      const steps = [];
      const geometries = new Set(), materials = new Set(), textures = new Set(extraTextures);
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        for (const m of o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []) materials.add(m);
      });
      for (const m of materials) for (const v of Object.values(m)) if (v && v.isTexture) textures.add(v);
      geometries.forEach((g) => steps.push(() => g.dispose()));
      textures.forEach((t) => steps.push(() => t.dispose()));
      materials.forEach((m) => steps.push(() => m.dispose()));
      if (reflector) steps.push(() => reflector.dispose());
      if (bloom) steps.push(() => bloom.dispose());
      if (composer) steps.push(() => composer.dispose());
      steps.push(() => envRT.dispose(), () => pmrem.dispose());
      // No forceContextLoss(): it flushes the GPU synchronously. The canvas is detached, so the context
      // is released when it is garbage-collected.
      steps.push(() => renderer.dispose());
      return steps;
    },
    dispose() {
      for (const step of this.disposeSteps()) step();
    },
  };
}

// Soft elliptical light pool that fades to zero well inside the texture (no visible decal edges).
// centerY: 0..256 vertical centre of the pool (near the top for wall washers, middle for floor glows).
function poolTexture(centerY = 70) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  g.translate(64, centerY);
  g.scale(1, 2.0);
  const grad = g.createRadialGradient(0, 0, 0, 0, 0, 60);
  grad.addColorStop(0, 'rgba(255,255,255,0.85)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.32)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(-64, -centerY / 2, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------- Helpers ----------
function clamp01(x) { return Math.min(1, Math.max(0, x)); }
function smoothstep01(x) { const k = clamp01(x); return k * k * (3 - 2 * k); }
function flicker(k) { return Math.sin(k * 61.0) * Math.sin(k * 23.0 + 1.3) > -0.15 ? 1 : 0.25; }

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
