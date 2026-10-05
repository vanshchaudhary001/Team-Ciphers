/*
 * Dancing 3D chat robot (Three.js r169 via jsDelivr ESM builds). Lazy-loaded by chat-robot.js.
 * createRobot({ canvas, reducedMotion }) -> controller.
 *
 * Tweak points: COLORS, BPM, DANCES (keyframes in beats), and the idle values in idlePose().
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/+esm';
import { RoomEnvironment } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/environments/RoomEnvironment.js/+esm';
import { RoundedBoxGeometry } from 'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/geometries/RoundedBoxGeometry.js/+esm';

export const COLORS = {
  body: 0xff7a1a,       // glossy orange
  joint: 0xe85d00,      // darker orange for joints, rings, soles
  screen: 0x0b0b0d,     // glossy black face screen
  limb: 0x3a3d43,       // dark grey limbs and neck
  eye: '#ffb347',       // warm orange-amber eye glow (canvas colour)
  eyeCore: '#fff3d6',   // bright eye core
};
export const BPM = 120;
const BEAT = 60 / BPM;

// ---------- Dance routines: keyframes in beats; tracks are joint channels (radians / units) ----------
// Each routine loops. 'snap' tracks move fast then hold (robot style); others ease smoothly.
const beats = (n, fn) => Array.from({ length: n + 1 }, (_, b) => fn(b)).flat();
export const DANCES = {
  groove: {
    beats: 8,
    tracks: {
      rootY: beats(8, (b) => [[b, 0], [b + 0.5, -0.09]]).filter(([b]) => b <= 8),
      lKnX: beats(8, (b) => [[b, 0.05], [b + 0.5, 0.38]]).filter(([b]) => b <= 8),
      rKnX: beats(8, (b) => [[b, 0.05], [b + 0.5, 0.38]]).filter(([b]) => b <= 8),
      lThX: beats(8, (b) => [[b, 0], [b + 0.5, -0.2]]).filter(([b]) => b <= 8),
      rThX: beats(8, (b) => [[b, 0], [b + 0.5, -0.2]]).filter(([b]) => b <= 8),
      hipsZ: [[0, 0.12], [2, -0.12], [4, 0.12], [6, -0.12], [8, 0.12]],
      lShX: beats(8, (b) => [[b, b % 2 ? 0.25 : -0.95]]),
      rShX: beats(8, (b) => [[b, b % 2 ? -0.95 : 0.25]]),
      lElX: [[0, -1.25], [8, -1.25]],
      rElX: [[0, -1.25], [8, -1.25]],
      headZ: [[0, 0.1], [2, -0.1], [4, 0.1], [6, -0.1], [8, 0.1]],
      headX: beats(8, (b) => [[b, 0.06], [b + 0.5, -0.03]]).filter(([b]) => b <= 8),
    },
  },
  robot: {
    beats: 8,
    snap: true,
    tracks: {
      lShX: [[0, -1.57], [1, 0], [2, 0], [3, -1.57], [4, 0], [5, -1.57], [6, -1.57], [7, 0], [8, -1.57]],
      rShX: [[0, 0], [1, -1.57], [2, 0], [3, -1.57], [4, -1.57], [5, 0], [6, -1.57], [7, 0], [8, 0]],
      lShZ: [[0, 0.1], [1, 0.1], [2, 1.57], [3, 0.1], [4, 1.57], [5, 0.1], [6, 0.1], [7, 1.57], [8, 0.1]],
      rShZ: [[0, 0.1], [1, 0.1], [2, 1.57], [3, 0.1], [4, 0.1], [5, 1.57], [6, 0.1], [7, 1.57], [8, 0.1]],
      lElX: [[0, -1.57], [1, -0.2], [2, -1.57], [3, -1.57], [4, -1.57], [5, -1.57], [6, -1.57], [7, -1.57], [8, -1.57]],
      rElX: [[0, -0.2], [1, -1.57], [2, -1.57], [3, -1.57], [4, -1.57], [5, -0.2], [6, -1.57], [7, -1.57], [8, -0.2]],
      headY: [[0, 0.45], [1, -0.45], [2, 0], [3, 0.45], [4, -0.45], [5, 0.45], [6, 0], [7, -0.45], [8, 0.45]],
      headZ: [[0, 0], [2, 0.15], [3, 0], [6, -0.15], [7, 0], [8, 0]],
      torsoY: [[0, 0.25], [1, -0.25], [2, 0], [3, 0.25], [4, -0.25], [5, 0.25], [6, 0], [7, -0.25], [8, 0.25]],
      rootY: [[0, 0], [8, 0]],
    },
  },
  spin: {
    beats: 8,
    tracks: {
      rootY: [[0, 0], [1, -0.09], [1.5, 0.05], [4.6, 0.05], [5, 0], [8, 0]],
      squash: [[0, 0], [4.9, 0], [5.05, 0.16], [5.5, 0], [8, 0]],
      rootRotY: [[0, 0], [1.5, 0], [4.6, Math.PI * 2], [8, Math.PI * 2]],
      rThX: [[0, 0], [1.5, -0.7], [4.5, -0.7], [5, 0], [8, 0]],
      rKnX: [[0, 0.05], [1, 0.3], [1.5, 1.0], [4.5, 1.0], [5, 0.05], [8, 0.05]],
      lKnX: [[0, 0.05], [1, 0.3], [1.5, 0.08], [8, 0.05]],
      lShZ: [[0, 0.12], [1, 0.4], [1.5, 0.25], [4.6, 0.25], [5.1, 2.55], [7.6, 2.55], [8, 0.12]],
      rShZ: [[0, 0.12], [1, 0.4], [1.5, 0.25], [4.6, 0.25], [5.1, 2.55], [7.6, 2.55], [8, 0.12]],
      lElX: [[0, -0.25], [1.5, -1.4], [4.6, -1.4], [5.1, -0.1], [8, -0.25]],
      rElX: [[0, -0.25], [1.5, -1.4], [4.6, -1.4], [5.1, -0.1], [8, -0.25]],
      headX: [[0, 0], [5.1, -0.22], [7.6, -0.22], [8, 0]],
    },
  },
  hop: {
    beats: 8,
    tracks: {
      rootY: beats(8, (b) => [[b, 0], [b + 0.25, 0.24], [b + 0.5, 0]]).filter(([b]) => b <= 8),
      squash: beats(8, (b) => [[b, 0], [b + 0.5, 0], [b + 0.6, 0.18], [b + 0.85, 0]]).filter(([b]) => b <= 8),
      lShZ: beats(8, (b) => [[b, b % 2 ? 2.2 : 2.7]]),
      rShZ: beats(8, (b) => [[b, b % 2 ? 2.7 : 2.2]]),
      lElZ: beats(8, (b) => [[b, b % 2 ? 0.5 : -0.4]]),
      rElZ: beats(8, (b) => [[b, b % 2 ? -0.4 : 0.5]]),
      lKnX: beats(8, (b) => [[b, 0.3], [b + 0.25, 0.05], [b + 0.5, 0.3]]).filter(([b]) => b <= 8),
      rKnX: beats(8, (b) => [[b, 0.3], [b + 0.25, 0.05], [b + 0.5, 0.3]]).filter(([b]) => b <= 8),
      headX: beats(8, (b) => [[b, 0.12], [b + 0.5, -0.05]]).filter(([b]) => b <= 8),
    },
  },
  concert: {
    beats: 8,
    tracks: {
      lShZ: [[0, 2.6], [8, 2.6]],
      rShZ: [[0, 2.6], [8, 2.6]],
      lElZ: [[0, 0.35], [2, -0.35], [4, 0.35], [6, -0.35], [8, 0.35]],
      rElZ: [[0, 0.35], [2, -0.35], [4, 0.35], [6, -0.35], [8, 0.35]],
      rootRotZ: [[0, 0.16], [2, -0.16], [4, 0.16], [6, -0.16], [8, 0.16]],
      hipsZ: [[0, -0.1], [2, 0.1], [4, -0.1], [6, 0.1], [8, -0.1]],
      headZ: [[0, 0.14], [2, -0.14], [4, 0.14], [6, -0.14], [8, 0.14]],
      rootY: beats(8, (b) => [[b, 0], [b + 0.5, -0.05]]).filter(([b]) => b <= 8),
    },
  },
};
const WIGGLE = {
  beats: 2,
  tracks: {
    hipsZ: [[0, 0], [0.25, 0.16], [0.5, -0.16], [0.75, 0.16], [1, -0.16], [1.25, 0.16], [1.5, -0.16], [2, 0]],
    headZ: [[0, 0], [0.5, 0.12], [1, -0.12], [1.5, 0.12], [2, 0]],
    lShZ: [[0, 0.12], [0.5, 0.7], [1.5, 0.7], [2, 0.12]],
    rShZ: [[0, 0.12], [0.5, 0.7], [1.5, 0.7], [2, 0.12]],
  },
};

const CHANNELS = ['rootY', 'rootRotY', 'rootRotZ', 'squash', 'hipsZ', 'hipsY', 'torsoY', 'torsoX', 'headX', 'headY', 'headZ',
  'lShX', 'lShZ', 'lElX', 'lElZ', 'rShX', 'rShZ', 'rElX', 'rElZ', 'lThX', 'lThZ', 'lKnX', 'rThX', 'rThZ', 'rKnX'];
const REST = { lShZ: 0.12, rShZ: 0.12, lElX: -0.25, rElX: -0.25, lKnX: 0.05, rKnX: 0.05 };

export async function createRobot({ canvas, reducedMotion = false }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power', premultipliedAlpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  renderer.debug.checkShaderErrors = false;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.9;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x404858, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2.5, 4, 5);
  const rim = new THREE.DirectionalLight(0xffd2a8, 1.0);
  rim.position.set(-3, 3, -3);
  scene.add(key, rim);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 1.45, 7.2);
  camera.lookAt(0, 1.3, 0);

  // ---------- Materials ----------
  const plastic = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.28, clearcoat: 1.0, clearcoatRoughness: 0.08 });
  const M = {
    body: plastic(COLORS.body),
    joint: plastic(COLORS.joint),
    screen: new THREE.MeshPhysicalMaterial({ color: COLORS.screen, roughness: 0.12, clearcoat: 1.0, clearcoatRoughness: 0.04, metalness: 0.2 }),
    limb: new THREE.MeshStandardMaterial({ color: COLORS.limb, roughness: 0.42, metalness: 0.35 }),
  };
  const add = (parent, geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const rod = (parent, len, r) => add(parent, new THREE.CylinderGeometry(r, r, len, 12), M.limb, 0, -len / 2, 0);

  // ---------- Rig: root → hips → torso → neck → head; shoulders → upper arm → forearm → hand; hips → thigh → shin → boot ----------
  const root = new THREE.Group();
  scene.add(root);
  const squashG = new THREE.Group(); // squash & stretch around the feet
  root.add(squashG);
  const hips = new THREE.Group();
  hips.position.y = 0.6;
  squashG.add(hips);
  add(hips, new THREE.SphereGeometry(0.17, 20, 14), M.limb).scale.set(1.3, 0.6, 1);

  const torso = new THREE.Group();
  torso.position.y = 0.05;
  hips.add(torso);
  add(torso, new RoundedBoxGeometry(0.66, 0.5, 0.5, 4, 0.2), M.body, 0, 0.22, 0);
  add(torso, new RoundedBoxGeometry(0.3, 0.035, 0.02, 2, 0.012), M.screen, 0, 0.27, 0.25); // chest slot

  const neck = new THREE.Group();
  neck.position.y = 0.47;
  torso.add(neck);
  add(neck, new THREE.CylinderGeometry(0.09, 0.1, 0.16, 14), M.limb, 0, 0.08, 0);

  const head = new THREE.Group();
  head.position.y = 0.15;
  neck.add(head);
  const HEAD_H = 1.32;
  add(head, new RoundedBoxGeometry(1.42, HEAD_H, 1.1, 6, 0.42), M.body, 0, HEAD_H / 2, 0);
  add(head, new RoundedBoxGeometry(1.18, 0.8, 0.06, 5, 0.22), M.screen, 0, HEAD_H / 2 - 0.02, 0.535);
  for (const side of [-1, 1]) {
    const pod = add(head, new THREE.CylinderGeometry(0.2, 0.2, 0.14, 24), M.body, side * 0.74, HEAD_H / 2, 0);
    pod.rotation.z = Math.PI / 2;
    const ring = add(head, new THREE.TorusGeometry(0.16, 0.035, 10, 24), M.joint, side * 0.815, HEAD_H / 2, 0);
    ring.rotation.y = Math.PI / 2;
    add(head, new THREE.SphereGeometry(0.035, 10, 8), M.limb, side * 0.13, HEAD_H - 0.01, 0.05);
  }

  // Eyes: a small canvas texture on the face screen (emissive look, drawn glow; no post-processing).
  const eyeCanvas = document.createElement('canvas');
  eyeCanvas.width = 256; eyeCanvas.height = 128;
  const eyeCtx = eyeCanvas.getContext('2d');
  const eyeTex = new THREE.CanvasTexture(eyeCanvas);
  eyeTex.colorSpace = THREE.SRGBColorSpace;
  const eyeMat = new THREE.MeshBasicMaterial({ map: eyeTex, transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending });
  add(head, new THREE.PlaneGeometry(1.06, 0.53), eyeMat, 0, HEAD_H / 2 - 0.02, 0.57);

  // Arms
  const arms = {};
  for (const [side, s] of [['l', 1], ['r', -1]]) {
    const sh = new THREE.Group();
    sh.position.set(s * 0.39, 0.38, 0);
    torso.add(sh);
    add(sh, new THREE.SphereGeometry(0.085, 16, 12), M.joint);
    rod(sh, 0.3, 0.035);
    const el = new THREE.Group();
    el.position.y = -0.3;
    sh.add(el);
    add(el, new THREE.SphereGeometry(0.068, 14, 10), M.joint);
    rod(el, 0.26, 0.032);
    const hand = new THREE.Group();
    hand.position.y = -0.3;
    el.add(hand);
    add(hand, new THREE.SphereGeometry(0.1, 16, 12), M.body).scale.set(1, 0.85, 0.75);
    for (let i = 0; i < 4; i++) {
      const f = add(hand, new THREE.CapsuleGeometry(0.026, 0.07, 4, 8), M.body, (i - 1.5) * 0.045, -0.1, 0.01);
      f.rotation.z = (i - 1.5) * 0.12;
    }
    const thumb = add(hand, new THREE.CapsuleGeometry(0.028, 0.05, 4, 8), M.body, s * -0.09, -0.02, 0.03);
    thumb.rotation.z = s * 0.9;
    arms[side] = { sh, el, hand, s };
  }

  // Legs
  const legs = {};
  for (const [side, s] of [['l', 1], ['r', -1]]) {
    const th = new THREE.Group();
    th.position.set(s * 0.15, -0.04, 0);
    hips.add(th);
    rod(th, 0.2, 0.038);
    const kn = new THREE.Group();
    kn.position.y = -0.2;
    th.add(kn);
    add(kn, new THREE.SphereGeometry(0.075, 14, 10), M.joint);
    rod(kn, 0.18, 0.034);
    const boot = new THREE.Group();
    boot.position.y = -0.2;
    kn.add(boot);
    add(boot, new RoundedBoxGeometry(0.3, 0.17, 0.42, 4, 0.08), M.body, 0, -0.03, 0.06);
    add(boot, new RoundedBoxGeometry(0.31, 0.04, 0.43, 2, 0.015), M.joint, 0, -0.11, 0.06);
    legs[side] = { th, kn, boot, s };
  }

  // Soft contact shadow
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const sg = shadowCanvas.getContext('2d');
  const grad = sg.createRadialGradient(32, 32, 2, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,0.45)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = grad;
  sg.fillRect(0, 0, 64, 64);
  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadow = add(scene, new THREE.PlaneGeometry(1.2, 0.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }), 0, 0.005, 0.05);
  shadow.rotation.x = -Math.PI / 2;

  // ---------- Eye drawing (expressions) ----------
  const eyes = { expr: 'normal', until: 0, blink: 0, lookX: 0, lookY: 0, spin: 0, dirty: true };
  function glowDisc(x, y, r, sy = 1) {
    const g = eyeCtx.createRadialGradient(x, y, 0, x, y, r * 1.9);
    g.addColorStop(0, 'rgba(255,190,90,0.55)');
    g.addColorStop(1, 'rgba(255,140,40,0)');
    eyeCtx.fillStyle = g;
    eyeCtx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
    eyeCtx.save();
    eyeCtx.translate(x, y);
    eyeCtx.scale(1, Math.max(0.08, sy));
    eyeCtx.beginPath(); eyeCtx.arc(0, 0, r, 0, Math.PI * 2);
    eyeCtx.fillStyle = COLORS.eye; eyeCtx.fill();
    eyeCtx.beginPath(); eyeCtx.arc(r * 0.15, -r * 0.15, r * 0.48, 0, Math.PI * 2);
    eyeCtx.fillStyle = COLORS.eyeCore; eyeCtx.fill();
    eyeCtx.restore();
  }
  function strokeEye(path) {
    eyeCtx.save();
    eyeCtx.lineCap = 'round'; eyeCtx.lineJoin = 'round';
    eyeCtx.shadowColor = 'rgba(255,160,60,0.9)'; eyeCtx.shadowBlur = 14;
    eyeCtx.strokeStyle = COLORS.eye; eyeCtx.lineWidth = 9;
    path(); eyeCtx.stroke();
    eyeCtx.restore();
  }
  function fillShape(path, color = COLORS.eye) {
    eyeCtx.save();
    eyeCtx.shadowColor = 'rgba(255,160,60,0.9)'; eyeCtx.shadowBlur = 16;
    eyeCtx.fillStyle = color;
    path(); eyeCtx.fill();
    eyeCtx.restore();
  }
  function drawEye(x, y, expr, idx) {
    const r = 24;
    switch (expr) {
      case 'happy':
        strokeEye(() => { eyeCtx.beginPath(); eyeCtx.arc(x, y + 8, 17, Math.PI * 1.1, Math.PI * 1.9); });
        break;
      case 'wink':
        if (idx === 1) strokeEye(() => { eyeCtx.beginPath(); eyeCtx.moveTo(x - 16, y); eyeCtx.lineTo(x + 16, y); });
        else glowDisc(x, y, r);
        break;
      case 'heart':
        fillShape(() => {
          eyeCtx.beginPath();
          eyeCtx.moveTo(x, y + 20);
          eyeCtx.bezierCurveTo(x - 32, y, x - 20, y - 26, x, y - 10);
          eyeCtx.bezierCurveTo(x + 20, y - 26, x + 32, y, x, y + 20);
        }, '#ff6a3d');
        break;
      case 'star':
        fillShape(() => {
          eyeCtx.beginPath();
          for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? 10 : 26;
            eyeCtx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
          }
          eyeCtx.closePath();
        });
        break;
      case 'spiral':
        strokeEye(() => {
          eyeCtx.beginPath();
          for (let a = 0; a < Math.PI * 5; a += 0.2) {
            const rr = 2 + a * 1.4;
            eyeCtx.lineTo(x + Math.cos(a + eyes.spin) * rr, y + Math.sin(a + eyes.spin) * rr);
          }
        });
        break;
      case 'surprised':
        glowDisc(x, y, 31);
        break;
      default:
        glowDisc(x + eyes.lookX * 9, y + eyes.lookY * 6, r, 1 - eyes.blink);
    }
  }
  function drawEyes() {
    eyeCtx.clearRect(0, 0, 256, 128);
    drawEye(80, 64, eyes.expr, 0);
    drawEye(176, 64, eyes.expr, 1);
    eyeTex.needsUpdate = true;
  }

  // ---------- Animation state ----------
  const pose = {};
  const st = {
    t: 0,
    clip: null, clipT: 0, clipW: 0, clipLoops: 1, clipOneShot: false,
    actions: [],             // short overlays: wave, jumpSpin, dropIn, land, dizzy
    drag: { on: false, w: 0, vx: 0, vy: 0, tilt: 0, tiltV: 0, tiltX: 0, tiltXV: 0 },
    look: { x: 0, y: 0, w: 0 },
    nextBlink: 2 + Math.random() * 3,
    curious: 0, nextCurious: 4 + Math.random() * 4,
    revolveSpin: 0, nextSpin: 25 + Math.random() * 20,
    visible: false,
  };

  function sampleTrack(keys, b, snap) {
    if (b <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [b0, v0] = keys[i], [b1, v1] = keys[i + 1];
      if (b <= b1) {
        let k = (b - b0) / Math.max(1e-6, b1 - b0);
        k = snap ? Math.min(1, k / Math.min(1, 0.15 / Math.max(1e-6, b1 - b0))) : k;
        k = snap ? 1 - Math.pow(1 - k, 3) : k * k * (3 - 2 * k);
        return v0 + (v1 - v0) * k;
      }
    }
    return keys[keys.length - 1][1];
  }
  function clipPose(clip, tSec, out) {
    const b = (tSec / BEAT) % clip.beats;
    for (const [ch, keys] of Object.entries(clip.tracks)) out[ch] = sampleTrack(keys, b, clip.snap);
  }

  function idlePose(t, out) {
    for (const c of CHANNELS) out[c] = REST[c] || 0;
    if (reducedMotion) return;
    out.rootY = Math.sin(t * 2.1) * 0.035;
    out.hipsZ = Math.sin(t * 0.9) * 0.04;
    out.torsoX = Math.sin(t * 2.1 + 0.6) * 0.02;
    out.lShX = Math.sin(t * 2.1) * 0.06;
    out.rShX = -Math.sin(t * 2.1) * 0.06;
    out.rootRotY = Math.sin(t * 0.25) * 0.61 + st.revolveSpin; // ±35° revolve (+ occasional full spin)
    out.headZ = Math.sin(t * 0.7) * 0.04 + st.curious * 0.22;
  }

  // Actions: { name, t0, dur, apply(k, out, w) }
  function addAction(name, dur, apply) {
    st.actions = st.actions.filter((a) => a.name !== name);
    st.actions.push({ name, t0: st.t, dur, apply });
    return dur;
  }
  const easeOutBounce = (k) => {
    const n = 7.5625, d = 2.75;
    if (k < 1 / d) return n * k * k;
    if (k < 2 / d) return n * (k -= 1.5 / d) * k + 0.75;
    if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + 0.9375;
    return n * (k -= 2.625 / d) * k + 0.984375;
  };
  const bump = (k) => Math.sin(Math.PI * Math.min(1, Math.max(0, k)));

  const api = {
    wave() {
      if (reducedMotion) return 0;
      return addAction('wave', 1.7, (k, o) => {
        const w = bump(k * 1.0) > 0 ? Math.min(1, Math.min(k, 1 - k) * 6) : 0;
        o.rShZ += (2.35 - o.rShZ) * w;
        o.rElZ += (Math.sin(k * Math.PI * 7) * 0.55) * w;
        o.rElX += (-0.2 - o.rElX) * w;
        o.headZ += -0.12 * w;
      });
    },
    dropIn() {
      if (reducedMotion) return 0;
      return addAction('dropIn', 1.0, (k, o) => {
        const fall = Math.min(1, k / 0.45);
        o.rootY += (1 - easeOutBounce(fall)) * 1.6;
        const land = Math.max(0, k - 0.36);
        o.squash += Math.exp(-land * 9) * Math.sin(land * 22) * 0.16 * (land > 0 ? 1 : 0);
        o.lShZ += (1 - fall) * 1.4; o.rShZ += (1 - fall) * 1.4;
      });
    },
    land() {
      if (reducedMotion) return 0;
      return addAction('land', 0.7, (k, o) => {
        const fall = Math.min(1, k / 0.3);
        o.rootY += (1 - easeOutBounce(fall)) * 0.45;
        const land = Math.max(0, k - 0.25);
        o.squash += Math.exp(-land * 9) * Math.sin(land * 24) * 0.14 * (land > 0 ? 1 : 0);
      });
    },
    jumpSpin() {
      if (reducedMotion) return 0.25;
      return addAction('jumpSpin', 0.75, (k, o) => {
        o.rootY += bump(k / 0.85) * 0.45;
        o.rootRotY += easeInOut(Math.min(1, k / 0.85)) * Math.PI * 2;
        o.lShZ += (2.5 - o.lShZ) * bump(k); o.rShZ += (2.5 - o.rShZ) * bump(k);
        o.squash += k > 0.85 ? Math.sin((k - 0.85) / 0.15 * Math.PI) * 0.15 : 0;
      });
    },
    dizzy() {
      setExpression('spiral', 1300);
      if (reducedMotion) return 0;
      return addAction('dizzy', 1.2, (k, o) => {
        const a = (1 - k);
        o.rootRotZ += Math.sin(k * 26) * 0.16 * a;
        o.headZ += Math.sin(k * 26 + 1) * 0.2 * a;
        o.headX += Math.sin(k * 19) * 0.08 * a;
      });
    },
    dance(name) {
      if (reducedMotion) return 0;
      const names = Object.keys(DANCES);
      const clip = DANCES[name] || DANCES[names[Math.floor(Math.random() * names.length)]];
      st.clip = clip; st.clipT = 0; st.clipOneShot = false;
      st.clipLoops = clip === DANCES.spin ? 1 : 1 + Math.floor(Math.random() * 2); // 4–8s
      setExpression(Math.random() < 0.5 ? 'happy' : 'star', clip.beats * BEAT * st.clipLoops * 1000);
      return clip.beats * BEAT * st.clipLoops;
    },
    wiggle() {
      if (reducedMotion) return 0;
      st.clip = WIGGLE; st.clipT = 0; st.clipLoops = 1; st.clipOneShot = true;
      setExpression('happy', 1100);
      return WIGGLE.beats * BEAT;
    },
    isDancing: () => !!st.clip && st.clip !== WIGGLE && st.clipW > 0.5,
    isBusy: () => !!st.clip || st.actions.length > 0 || st.drag.on,
    setExpression: (e, ms) => setExpression(e, ms),
    setLook(x, y, near) { st.look.x = x; st.look.y = y; st.look.near = near; },
    setDrag(on, vx = 0, vy = 0) {
      st.drag.on = on; st.drag.vx = vx; st.drag.vy = vy;
      if (on) setExpression('surprised', 0);
      else if (eyes.expr === 'surprised') setExpression('normal', 0);
    },
    setVisible(v) {
      if (v === st.visible) return;
      st.visible = v;
      if (v && !document.hidden) start(); else stop();
    },
    resize(w, h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    },
    dispose() {
      stop();
      document.removeEventListener('visibilitychange', onVis);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      });
      envRT.dispose(); pmrem.dispose(); renderer.dispose();
    },
  };

  function setExpression(e, ms) {
    eyes.expr = e;
    eyes.until = ms ? st.t + ms / 1000 : 0;
    eyes.dirty = true;
  }

  // ---------- Per-frame update ----------
  const tmp = {}, clipOut = {};
  function update(dt) {
    st.t += dt;
    const t = st.t;
    idlePose(t, pose);

    // Occasional curious head tilt and full spin (idle only)
    if (!reducedMotion) {
      if (t > st.nextCurious) { st.curiousTarget = (Math.random() < 0.5 ? -1 : 1); st.nextCurious = t + 5 + Math.random() * 5; st.curiousEnd = t + 1.6; }
      const want = st.curiousEnd && t < st.curiousEnd ? st.curiousTarget : 0;
      st.curious += (want - st.curious) * Math.min(1, dt * 4);
      if (t > st.nextSpin && !st.clip) { st.spinFrom = t; st.nextSpin = t + 30 + Math.random() * 25; }
      if (st.spinFrom) {
        const k = Math.min(1, (t - st.spinFrom) / 1.4);
        st.revolveSpin = easeInOut(k) * Math.PI * 2;
        if (k >= 1) { st.spinFrom = 0; st.revolveSpin = 0; }
      }
    }

    // Dance / wiggle clip with a 0.3s crossfade in and out
    if (st.clip) {
      st.clipT += dt;
      const len = st.clip.beats * BEAT * st.clipLoops;
      const fadeOut = st.clipT > len - 0.3;
      st.clipW = Math.min(1, st.clipW + dt / 0.3);
      if (fadeOut) st.clipW = Math.max(0, Math.min(st.clipW, (len - st.clipT) / 0.3));
      for (const c of CHANNELS) clipOut[c] = pose[c];
      clipPose(st.clip, st.clipT, clipOut);
      for (const c of CHANNELS) pose[c] += (clipOut[c] - pose[c]) * st.clipW;
      if (st.clipT >= len) { st.clip = null; st.clipW = 0; }
    }

    // Look at the cursor when it's near (head + eyes)
    const lw = st.look.near ? 1 : 0;
    st.look.w += (lw - st.look.w) * Math.min(1, dt * 5);
    pose.headY += st.look.x * 0.55 * st.look.w;
    pose.headX += -st.look.y * 0.3 * st.look.w;
    const ex = THREE.MathUtils.clamp(st.look.x * st.look.w, -1, 1), ey = THREE.MathUtils.clamp(st.look.y * st.look.w, -1, 1);
    if (Math.abs(ex - eyes.lookX) > 0.02 || Math.abs(ey - eyes.lookY) > 0.02) { eyes.lookX = ex; eyes.lookY = ey; eyes.dirty = true; }

    // Overlay actions
    st.actions = st.actions.filter((a) => {
      const k = (t - a.t0) / a.dur;
      if (k >= 1) return false;
      a.apply(Math.max(0, k), pose);
      return true;
    });

    // Drag: dangle with a damped spring — body tilts against the motion, legs swing, arms flail
    const d = st.drag;
    d.w += ((d.on ? 1 : 0) - d.w) * Math.min(1, dt * 8);
    const targetTilt = THREE.MathUtils.clamp(-d.vx * 0.0016, -0.8, 0.8) * (d.on ? 1 : 0);
    const targetTiltX = THREE.MathUtils.clamp(d.vy * 0.0008, -0.4, 0.4) * (d.on ? 1 : 0);
    d.tiltV += (targetTilt - d.tilt) * 90 * dt; d.tiltV *= Math.exp(-6 * dt); d.tilt += d.tiltV * dt;
    d.tiltXV += (targetTiltX - d.tiltX) * 90 * dt; d.tiltXV *= Math.exp(-6 * dt); d.tiltX += d.tiltXV * dt;
    pose.rootRotZ += d.tilt;
    pose.torsoX += d.tiltX;
    if (d.w > 0.001) {
      const w = d.w;
      pose.lShZ += (2.3 + Math.sin(t * 13) * 0.35 - pose.lShZ) * w;
      pose.rShZ += (2.3 + Math.sin(t * 13 + 1.7) * 0.35 - pose.rShZ) * w;
      pose.lElX += (-0.6 - pose.lElX) * w; pose.rElX += (-0.6 - pose.rElX) * w;
      pose.lThX += (Math.sin(t * 7) * 0.45 - d.tilt * 0.6) * w;
      pose.rThX += (Math.sin(t * 7 + Math.PI) * 0.45 - d.tilt * 0.6) * w;
      pose.lKnX += 0.35 * w; pose.rKnX += 0.35 * w;
      pose.rootY += 0.12 * w;
    }

    // Blink (random 3–6s), timed expressions, spiral spin
    if (eyes.until && t > eyes.until) { eyes.expr = 'normal'; eyes.until = 0; eyes.dirty = true; }
    if (t > st.nextBlink && eyes.expr === 'normal') { st.blinkFrom = t; st.nextBlink = t + 3 + Math.random() * 3; }
    if (st.blinkFrom) {
      const k = (t - st.blinkFrom) / 0.16;
      eyes.blink = k < 1 ? Math.sin(Math.PI * k) * 0.92 : 0;
      if (k >= 1) st.blinkFrom = 0;
      eyes.dirty = true;
    }
    if (eyes.expr === 'spiral') { eyes.spin += dt * 9; eyes.dirty = true; }
    if (eyes.dirty) { drawEyes(); eyes.dirty = false; }

    applyPose(pose);
  }

  function applyPose(p) {
    root.position.y = Math.max(-0.12, p.rootY);
    root.rotation.set(0, p.rootRotY, p.rootRotZ);
    const sq = p.squash;
    squashG.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
    hips.rotation.set(0, p.hipsY, p.hipsZ);
    torso.rotation.set(p.torsoX, p.torsoY, -p.hipsZ * 0.5);
    head.rotation.set(p.headX, p.headY, p.headZ);
    for (const side of ['l', 'r']) {
      const a = arms[side], s = a.s;
      a.sh.rotation.set(p[side + 'ShX'], 0, s * p[side + 'ShZ']);
      a.el.rotation.set(p[side + 'ElX'], 0, s * (p[side + 'ElZ'] || 0));
      const l = legs[side];
      l.th.rotation.set(p[side + 'ThX'], 0, s * (p[side + 'ThZ'] || 0));
      l.kn.rotation.x = p[side + 'KnX'];
      l.boot.rotation.x = -(p[side + 'ThX'] + p[side + 'KnX']) * 0.7;
    }
    const lift = Math.max(0, root.position.y);
    shadow.scale.setScalar(Math.max(0.45, 1 - lift * 0.8));
    shadow.material.opacity = Math.max(0.25, 1 - lift * 1.2);
  }

  // ---------- Loop (runs only while visible and the tab is visible) ----------
  let raf = 0, last = 0;
  function render() { renderer.render(scene, camera); }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    update(dt);
    render();
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function onVis() { if (document.hidden) stop(); else if (st.visible) start(); }
  document.addEventListener('visibilitychange', onVis);

  // Precompile + first frame up front so the robot never stutters when it first appears.
  renderer.setSize(canvas.clientWidth || 150, canvas.clientHeight || 170, false);
  update(0);
  await renderer.compileAsync(scene, camera);
  render();

  return api;
}

function easeInOut(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
