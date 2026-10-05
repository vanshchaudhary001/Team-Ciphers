/*
 * "First Week" lobby → maze scene (Three.js r169 via jsDelivr ESM builds).
 * Lazy-loaded by intro-lobby.js. Exports createLobbyScene({ canvas, text, onHandoff }).
 *
 * Everything you might want to tweak is in CONFIG below.
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/+esm';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/environments/RoomEnvironment.js/+esm';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/geometries/RoundedBoxGeometry.js/+esm';
import { mergeGeometries } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/utils/BufferGeometryUtils.js/+esm';
import { Reflector } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/objects/Reflector.js/+esm';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/EffectComposer.js/+esm';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/RenderPass.js/+esm';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/UnrealBloomPass.js/+esm';
import { OutputPass } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/postprocessing/OutputPass.js/+esm';

export const CONFIG = {
  // Timeline, in seconds from the first frame. Every change below is a tween: [start, end].
  time: {
    doors: [0.9, 2.1],          // glass doors slide open
    displays: 2.6,              // first display flickers on (others follow)
    sign: 4.0,                  // first letter lights
    signLetterGap: 0.075,       // delay between letters
    sweep: [4.6, 5.3],          // light sweep across the sign
    reveal: [5.0, 6.7],         // floor lines spread out from beneath the camera
    wipe: [5.0, 6.4],           // lobby wipes away on the same centre (slower, wider feather)
    lobbyLights: [5.2, 6.3],    // lobby lights fade down
    signGlow: [5.05, 5.9],      // sign glow fades down before the wipe reaches the wall
    mazeLight: [5.4, 6.6],      // maze light fades up
    walls: 5.45,                // maze walls start rising (nearest first)
    prepare: 6.4,               // let the site underneath paint ahead of the cross-fade
    handoff: 7.4,               // cross-fade into the website starts
  },
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
    maze: 0xa8c8ff,
    mazeWall: 0x1d2128,
    metal: 0xc6c9ce,
    desk: 0x2b2420,
    deskTop: 0xe8e4dd,
    plant: 0x2e4636,
    pot: 0xb9b2a8,
    displayA: 0x0c2236,
    displayB: 0x2a3d55,
    displayC: 0xd9925b,
    wipeGlow: 0xbcd6ff,
  },
  // Camera path: smooth splines through these keys (position + look target)
  camera: [
    { t: 0.0, pos: [0.0, 1.65, 11.5], look: [0.0, 1.6, 0.0] },
    { t: 1.0, pos: [0.0, 1.65, 10.1], look: [0.0, 1.6, -1.0] },
    { t: 2.5, pos: [0.35, 1.7, 3.4], look: [-0.7, 1.55, -4.0] },
    { t: 4.0, pos: [0.45, 1.75, -3.3], look: [0.5, 2.25, -10.0] },
    { t: 5.0, pos: [0.15, 2.0, -5.6], look: [0.0, 2.6, -12.0] },
    { t: 6.4, pos: [0.0, 3.7, -7.8], look: [0.0, 0.2, -13.8] },
    { t: 8.2, pos: [0.0, 0.85, -15.2], look: [0.0, 0.75, -25.0] },
  ],
};

const MAZE = { cols: 17, rows: 27, cell: 1.0, zNear: 3.0, wallHeight: 1.3, thickness: 0.08, seed: 7 };
const REVEAL_MAX = 24;      // metres the floor-line reveal radius grows to
const WIPE_MAX = 12;        // metres the lobby wipe radius grows to
const WIPE_FEATHER = 5.0;   // soft width of the lobby wipe (metres)
const LINES_FEATHER = 3.0;  // soft width of the floor-line reveal (metres)

export async function createLobbyScene({ canvas, text = 'FIRST WEEK', onPrepareHandoff = () => {}, onHandoff = () => {} }) {
  const C = CONFIG.colors;
  const T = CONFIG.time;
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
  const lobby = new THREE.Group();       // everything that wipes away
  const staticLobby = new THREE.Group(); // static pieces, merged per material below
  scene.add(lobby);

  // ---------- Lobby wipe: soft radial opacity fade with a faint glowing front ----------
  // Shares its centre and start time with the floor-line reveal, so the change reads as one motion.
  const startCenter = new THREE.Vector2(0.15, -5.6);
  const wipe = {
    uWipeCenter: { value: startCenter },
    uWipeRadius: { value: 0 },
    uWipeFeather: { value: WIPE_FEATHER },
    uWipeGlow: { value: new THREE.Color(C.wipeGlow).multiplyScalar(isMobile ? 0.5 : 0.28) },
  };
  const WIPE_PARS = `
    varying vec3 vFwPos;
    uniform vec2 uWipeCenter; uniform float uWipeRadius, uWipeFeather; uniform vec3 uWipeGlow;`;
  const WIPE_APPLY = `
    float fwD = distance(vFwPos.xz, uWipeCenter);
    float fwKeep = smoothstep(uWipeRadius - uWipeFeather, uWipeRadius, fwD);   // 0 = wiped, 1 = untouched
    float fwBand = (1.0 - abs(fwKeep * 2.0 - 1.0)) * step(0.001, uWipeRadius); // soft glow inside the feather
    gl_FragColor.rgb += uWipeGlow * fwBand;
    gl_FragColor.a *= fwKeep;`;
  const lobbyMaterials = [];
  function withWipe(material) {
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, wipe);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vFwPos;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvFwPos = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;\n#else\nvFwPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#endif');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${WIPE_PARS}`)
        .replace('#include <tonemapping_fragment>', `${WIPE_APPLY}\n#include <tonemapping_fragment>`);
    };
    material.customProgramCacheKey = () => 'fw-wipe';
    material.transparent = true;
    lobbyMaterials.push(material);
    return material;
  }
  // Lobby materials are transparent from the start (alpha stays 1 until the wipe), so the wipe never
  // swaps shader programs. Only depthWrite changes when it begins — render state, no recompile.
  function setFadeMode(on) {
    for (const m of lobbyMaterials) if (m.blending !== THREE.AdditiveBlending) m.depthWrite = !on;
  }

  // ---------- Materials ----------
  const mats = {
    wall: withWipe(new THREE.MeshStandardMaterial({ color: C.wall, roughness: 0.85 })),
    feature: withWipe(new THREE.MeshStandardMaterial({ color: C.featureWall, roughness: 0.7 })),
    ceiling: withWipe(new THREE.MeshStandardMaterial({ color: C.ceiling, roughness: 0.9 })),
    ceilingLight: withWipe(new THREE.MeshBasicMaterial({ color: new THREE.Color(C.ceilingLight).multiplyScalar(3.0) })),
    warmLight: withWipe(new THREE.MeshBasicMaterial({ color: new THREE.Color(C.warm).multiplyScalar(1.6) })),
    metal: withWipe(new THREE.MeshStandardMaterial({ color: C.metal, metalness: 1, roughness: 0.3 })),
    darkMetal: withWipe(new THREE.MeshStandardMaterial({ color: 0x1b1d21, metalness: 0.6, roughness: 0.45 })),
    desk: withWipe(new THREE.MeshStandardMaterial({ color: C.desk, roughness: 0.4 })),
    deskTop: withWipe(new THREE.MeshStandardMaterial({ color: C.deskTop, roughness: 0.18 })),
    pool: withWipe(new THREE.MeshBasicMaterial({ map: poolTexture(70), color: new THREE.Color(C.warm).multiplyScalar(0.55), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })),
    floorPool: withWipe(new THREE.MeshBasicMaterial({ map: poolTexture(128), color: new THREE.Color(C.warm).multiplyScalar(0.35), blending: THREE.AdditiveBlending, depthWrite: false, fog: false })),
    pot: withWipe(new THREE.MeshStandardMaterial({ color: C.pot, roughness: 0.9 })),
    soil: withWipe(new THREE.MeshStandardMaterial({ color: 0x1a1512, roughness: 1 })),
    plant: withWipe(new THREE.MeshStandardMaterial({ color: C.plant, roughness: 0.65 })),
  };
  // Glass: clear, reflective and lightweight (no transmission pass). It is behind the camera before the wipe.
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
        ...wipe,
        uTime: { value: 0 }, uPower: { value: 0 },
        uA: { value: new THREE.Color(C.displayA) }, uB: { value: new THREE.Color(C.displayB) }, uC: { value: new THREE.Color(C.displayC) },
        uSeed: { value: i * 3.7 },
      },
      vertexShader: `
        varying vec2 vUv; varying vec3 vFwPos;
        void main() { vUv = uv; vFwPos = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float uTime, uPower, uSeed; uniform vec3 uA, uB, uC;
        varying vec2 vUv;
        ${WIPE_PARS}
        void main() {
          float t = uTime + uSeed;
          vec3 col = mix(uA, uB, smoothstep(0.0, 1.0, vUv.y + 0.25 * sin(t * 0.25 + vUv.x * 3.0)));
          col = mix(col, uC, 0.32 * (0.5 + 0.5 * sin(t * 0.35 + vUv.x * 2.2 + vUv.y * 1.3)) * smoothstep(0.2, 1.0, vUv.x));
          float lines = smoothstep(0.93, 1.0, fract(vUv.y * 14.0 - t * 0.22)) * 0.10;
          float scan = (1.0 - smoothstep(0.0, 0.006, abs(vUv.y - fract(t * 0.11)))) * 0.22;
          float vig = smoothstep(0.0, 0.15, vUv.x) * (1.0 - smoothstep(0.85, 1.0, vUv.x)) * smoothstep(0.0, 0.15, vUv.y) * (1.0 - smoothstep(0.85, 1.0, vUv.y));
          col = (col * (0.55 + 0.45 * vig) + lines + scan) * uPower * 1.25;
          gl_FragColor = vec4(col, 1.0);
          ${WIPE_APPLY}
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    mat.transparent = true;
    lobbyMaterials.push(mat);
    const screen = mesh(new THREE.PlaneGeometry(2.36, 1.32), mat, -5.89, 2.1, zc, lobby, false);
    screen.rotation.y = Math.PI / 2;
    screen.renderOrder = 1;
    displays.push({ mat, start: T.displays + i * 0.35 });
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
  // While fading, lobby pieces don't write depth, so they draw after the (transparent) floor.
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
  const SIGN_DIST = Math.hypot(0 - startCenter.x, -11.86 - startCenter.y); // sign distance from the wipe centre
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
    let index = 0;
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
        out.push({ mat, x: m.position.x, start: T.sign + index * T.signLetterGap });
        index++;
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
  const fills = [];
  const addSpot = (color, intensity, pos, target, angle) => {
    const l = new THREE.SpotLight(color, intensity, 9, angle, 0.9, 1.6);
    l.position.set(...pos);
    l.target.position.set(...target);
    l.userData.base = intensity;
    scene.add(l, l.target);
    fills.push(l);
  };
  for (const x of [-3, 3]) addSpot(0xf2f4f8, 22, [x, 4.45, -10.9], [x, 0.9, -12], 0.62);
  const mazeLight = new THREE.DirectionalLight(0xdbe6ff, 0);
  mazeLight.position.set(-3, 8, 2);
  scene.add(mazeLight);

  // ---------- Maze: glowing floor lines + rising walls (one InstancedMesh each) ----------
  const maze = generateMaze(MAZE.cols, MAZE.rows, MAZE.seed);
  const zFar = MAZE.zNear - MAZE.rows * MAZE.cell;

  const linesTex = drawMazeLines(maze);
  extraTextures.push(linesTex);
  const linesMat = new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: linesTex }, uRadius: { value: 0 }, uCenter: { value: startCenter }, uFeather: { value: LINES_FEATHER },
      uColor: { value: new THREE.Color(C.maze) }, uOpacity: { value: isMobile ? 1 : 0.55 },
    },
    vertexShader: `
      varying vec2 vUv; varying vec3 vW;
      void main() { vUv = uv; vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform float uRadius, uOpacity, uFeather; uniform vec2 uCenter; uniform vec3 uColor;
      varying vec2 vUv; varying vec3 vW;
      void main() {
        float line = texture2D(uTex, vUv).r;
        float d = distance(vW.xz, uCenter);
        float on = step(0.001, uRadius);
        float reveal = (1.0 - smoothstep(uRadius - uFeather, uRadius, d)) * on;          // soft, wide falloff
        float front = exp(-pow((d - uRadius + uFeather * 0.5) / uFeather, 2.0)) * on;  // gentle leading glow
        vec3 col = uColor * line * (reveal * 1.6 + front * 0.9);
        gl_FragColor = vec4(col * uOpacity, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const linesPlane = new THREE.Mesh(new THREE.PlaneGeometry(MAZE.cols * MAZE.cell, MAZE.rows * MAZE.cell), linesMat);
  linesPlane.rotation.x = -Math.PI / 2;
  linesPlane.position.set(0, 0.005, (MAZE.zNear + zFar) / 2);
  linesPlane.renderOrder = 2;
  scene.add(linesPlane);

  const segments = mazeSegments(maze);
  const wallMat = new THREE.MeshStandardMaterial({ color: C.mazeWall, roughness: 0.38, metalness: 0.25 });
  const capMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.maze).multiplyScalar(isMobile ? 3.2 : 1.9), transparent: true, opacity: 0 });
  const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), wallMat, segments.length);
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), capMat, segments.length);
  walls.receiveShadow = true;
  walls.frustumCulled = false;
  caps.frustumCulled = false;
  scene.add(walls, caps);
  let wallsDoneAt = 0;
  for (const s of segments) {
    s.delay = Math.hypot(s.x - startCenter.x, s.z - startCenter.y) * 0.045;
    wallsDoneAt = Math.max(wallsDoneAt, s.delay);
  }
  wallsDoneAt += T.walls + 0.8;
  const dummy = new THREE.Object3D();
  function updateWalls(t) {
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const k = easeOutCubic(clamp01((t - T.walls - s.delay) / 0.75));
      const h = Math.max(0.0005, MAZE.wallHeight * k);
      dummy.position.set(s.x, h / 2, s.z);
      dummy.rotation.set(0, s.alongZ ? Math.PI / 2 : 0, 0);
      dummy.scale.set(MAZE.cell + MAZE.thickness, h, MAZE.thickness);
      dummy.updateMatrix();
      walls.setMatrixAt(i, dummy.matrix);
      dummy.position.y = h + 0.006;
      dummy.scale.set(MAZE.cell + MAZE.thickness, 0.012, MAZE.thickness + 0.006);
      dummy.updateMatrix();
      caps.setMatrixAt(i, dummy.matrix);
    }
    walls.instanceMatrix.needsUpdate = true;
    caps.instanceMatrix.needsUpdate = true;
  }

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

  // ---------- Camera splines with eased, C1-continuous timing ----------
  const keys = CONFIG.camera;
  const posCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, 'centripetal');
  const lookCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, 'centripetal');
  const uAt = monotoneCubic(keys.map((k) => k.t), keys.map((_, i) => i / (keys.length - 1)));
  const tmpLook = new THREE.Vector3();

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

  // ---------- One timeline: every value is a pure function of t ----------
  let rafId = 0, handedOff = false, prepared = false, elapsed = 0, fadeMode = false, lastNow = 0, warming = true;
  const adaptive = { frames: 0, start: 0, checked: false };

  function update(t) {
    const u = uAt(t);
    camera.position.copy(posCurve.getPoint(u));
    camera.lookAt(lookCurve.getPoint(u, tmpLook));

    const door = power3InOut(span(t, T.doors));
    doorL.position.x = -0.61 - 1.25 * door;
    doorR.position.x = 0.61 + 1.25 * door;

    for (const d of displays) {
      d.mat.uniforms.uTime.value = t;
      const k = t - d.start;
      d.mat.uniforms.uPower.value = k <= 0 ? 0 : k < 0.45 ? flicker(k) * smoothstep01(k / 0.45) : 1;
    }

    // Sign: letters light in sequence, a light sweep passes, then the glow tweens down and the letters fade.
    const sweepT = span(t, T.sweep);
    const sweepX = THREE.MathUtils.lerp(-3.2, 3.2, power3InOut(sweepT));
    const glow = 1 - power2InOut(span(t, T.signGlow));
    // Letters fade exactly as the wall behind them is wiped (same formula as the wipe shader).
    const wipeR = WIPE_MAX * power2InOut(span(t, T.wipe));
    const letterAlpha = wipeR > 0 ? smoothstep01((SIGN_DIST - (wipeR - WIPE_FEATHER)) / WIPE_FEATHER) : 1;
    let lit = 0;
    for (const l of letters) {
      const k = t - l.start;
      const on = k <= 0 ? 0 : k < 0.22 ? flicker(k * 1.6) * (k / 0.22) : 1;
      const sweep = sweepT > 0 && sweepT < 1 ? Math.exp(-Math.pow((l.x - sweepX) / 0.45, 2)) * 0.6 : 0;
      l.mat.color.copy(signOff).lerp(signOn, on * glow).multiplyScalar(1 + sweep * glow);
      l.mat.opacity = letterAlpha;
      lit += on;
    }
    const litK = lit / letters.length;
    signLight.intensity = 9 * litK * glow;

    // Floor lines and the lobby wipe start together from beneath the camera.
    linesMat.uniforms.uRadius.value = REVEAL_MAX * power2InOut(span(t, T.reveal));
    wipe.uWipeRadius.value = wipeR;
    if (!fadeMode && t >= T.wipe[0]) {
      fadeMode = true;
      setFadeMode(true);
      facade.visible = false; // behind the camera by now
    }
    lobby.visible = t < T.wipe[1]; // fully transparent by the time it's hidden

    const lobbyLights = 1 - power2InOut(span(t, T.lobbyLights));
    spot.intensity = 70 * lobbyLights;
    for (const l of fills) l.intensity = l.userData.base * lobbyLights;
    const mazeK = power2InOut(span(t, T.mazeLight));
    mazeLight.intensity = 0.8 * mazeK;

    walls.visible = caps.visible = t >= T.walls; // flat walls would show through the glossy floor
    if (t >= T.walls && t <= wallsDoneAt) updateWalls(t);
    capMat.opacity = power2InOut(clamp01((t - T.walls - 0.2) / 0.9));

    if (bloom) bloom.strength = (0.55 + 0.15 * litK * glow) * (1 - 0.4 * mazeK);
    if (warming) return; // warm-up frames never fire the hand-off callbacks
    if (!prepared && t >= T.prepare) {
      prepared = true;
      onPrepareHandoff();
    }
    if (!handedOff && t >= T.handoff) {
      handedOff = true;
      onHandoff();
    }
  }

  let onStarted = () => {};
  function tick(now) {
    rafId = requestAnimationFrame(tick);
    if (!adaptive.checked) {
      // Pre-roll behind the black screen: render the first frame to measure fps, then decide quality.
      render();
      adaptQuality(now);
      return;
    }
    // Advance only on drawn frames (capped), so a backgrounded tab resumes where it left off.
    const dt = lastNow ? Math.min((now - lastNow) / 1000, 0.05) : 0;
    lastNow = now;
    elapsed += dt;
    update(elapsed);
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

  // ---------- Warm-up: compile every program without blocking, then render representative frames ----------
  update(0);
  updateWalls(T.walls + 10);           // full-height walls so the maze programs compile too
  walls.visible = caps.visible = true;
  facade.visible = lobby.visible = true;
  // Compile for the target we actually draw into: with post-processing that's the composer's render
  // target (linear, no tone mapping), not the canvas. Compiling for the canvas would build unused variants
  // and leave the real ones to compile synchronously on the first frame.
  renderer.setRenderTarget(composer ? composer.renderTarget1 : null);
  await renderer.compileAsync(scene, camera); // parallel shader compile; the loading line keeps animating
  renderer.setRenderTarget(null);
  renderer.shadowMap.needsUpdate = true;      // bake the static shadow map once
  // Draw every object once (even off-screen ones) so each program's first use — uniform lookups are
  // synchronous GPU round-trips — happens here behind the loading line, not in the first animated frames.
  const culled = [];
  scene.traverse((o) => { if (o.isMesh && o.frustumCulled) { o.frustumCulled = false; culled.push(o); } });
  render();                                   // uploads + post-processing passes, lobby state
  update(6.6);
  render();                                   // maze state (walls, caps, lines, bloom levels)
  culled.forEach((o) => { o.frustumCulled = true; });
  updateWalls(0);
  fadeMode = false;
  setFadeMode(false);
  facade.visible = true;
  handedOff = false;
  prepared = false;
  warming = false;
  update(0);
  render();

  return {
    // onStart fires after the short quality pre-roll, when the timeline actually begins.
    play(onStart) {
      onStarted = onStart || (() => {});
      rafId = requestAnimationFrame(tick);
    },
    stop() {
      cancelAnimationFrame(rafId);
      rafId = 0;
    },
    // GPU clean-up as many small steps, so the caller can spread them over idle time.
    // (Deleting everything in one go stalled the GPU process for ~1.7s and froze the page.)
    disposeSteps() {
      cancelAnimationFrame(rafId);
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

// ---------- Maze helpers ----------
function generateMaze(cols, rows, seed) {
  const rand = mulberry32(seed);
  // east[r][c]: wall between (c,r) and (c+1,r); south[r][c]: wall between (c,r) and (c,r+1)
  const east = Array.from({ length: rows }, () => Array(cols).fill(true));
  const south = Array.from({ length: rows }, () => Array(cols).fill(true));
  const seen = Array.from({ length: rows }, () => Array(cols).fill(false));
  const mid = Math.floor(cols / 2);
  const stack = [[mid, 8]];
  seen[8][mid] = true;
  while (stack.length) {
    const [c, r] = stack[stack.length - 1];
    const options = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dc, dr]) => [c + dc, r + dr, dc, dr])
      .filter(([nc, nr]) => nc >= 0 && nc < cols && nr >= 0 && nr < rows && !seen[nr][nc]);
    if (!options.length) { stack.pop(); continue; }
    const [nc, nr, dc, dr] = options[Math.floor(rand() * options.length)];
    if (dc === 1) east[r][c] = false;
    if (dc === -1) east[r][nc] = false;
    if (dr === 1) south[r][c] = false;
    if (dr === -1) south[nr][c] = false;
    seen[nr][nc] = true;
    stack.push([nc, nr]);
  }
  // A straight corridor down the middle for the camera to fly into.
  for (let r = 7; r < rows - 1; r++) south[r][mid] = false;
  return { cols, rows, east, south };
}

function mazeSegments({ cols, rows, east, south }) {
  const out = [];
  const cx = (c) => -((cols * MAZE.cell) / 2) + (c + 0.5) * MAZE.cell;
  const cz = (r) => MAZE.zNear - (r + 0.5) * MAZE.cell;
  for (let r = 0; r < rows; r++) {
    out.push({ x: cx(0) - MAZE.cell / 2, z: cz(r), alongZ: true });        // left boundary
    for (let c = 0; c < cols; c++) {
      if (east[r][c]) out.push({ x: cx(c) + MAZE.cell / 2, z: cz(r), alongZ: true });
      if (r === 0) out.push({ x: cx(c), z: cz(0) + MAZE.cell / 2, alongZ: false }); // near boundary
      if (south[r][c]) out.push({ x: cx(c), z: cz(r) - MAZE.cell / 2, alongZ: false });
    }
  }
  return out;
}

function drawMazeLines(maze) {
  const S = 60; // px per metre
  const c = document.createElement('canvas');
  c.width = maze.cols * S;
  c.height = maze.rows * S;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#fff';
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.shadowColor = '#fff';
  g.shadowBlur = 18;
  const zFar = MAZE.zNear - maze.rows * MAZE.cell;
  const left = -(maze.cols * MAZE.cell) / 2;
  const px = (x) => (x - left) * S;
  const py = (z) => (z - zFar) * S; // canvas top = far end (v = 1 after flipY)
  g.beginPath();
  for (const s of mazeSegments(maze)) {
    const half = MAZE.cell / 2;
    if (s.alongZ) { g.moveTo(px(s.x), py(s.z - half)); g.lineTo(px(s.x), py(s.z + half)); }
    else { g.moveTo(px(s.x - half), py(s.z)); g.lineTo(px(s.x + half), py(s.z)); }
  }
  g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  return tex;
}

// ---------- Timing helpers (power2/power3 in-out are the same curves as GSAP's) ----------
function clamp01(x) { return Math.min(1, Math.max(0, x)); }
function span(t, [a, b]) { return clamp01((t - a) / (b - a)); }
function smoothstep01(x) { const k = clamp01(x); return k * k * (3 - 2 * k); }
function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function power2InOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function power3InOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function flicker(k) { return Math.sin(k * 61.0) * Math.sin(k * 23.0 + 1.3) > -0.15 ? 1 : 0.25; }

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Monotone cubic (Fritsch–Carlson) through (xs, ys): smooth, no overshoot, starts from rest.
function monotoneCubic(xs, ys) {
  const n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = 0;
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const tau = 3 / Math.sqrt(s); m[i] = tau * a * d[i]; m[i + 1] = tau * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
