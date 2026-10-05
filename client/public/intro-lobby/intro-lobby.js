/*
 * "First Week" lobby intro: loader and hand-off.
 *
 * Mounted by a small script in the <head> of index.html, which adds the
 * `fw-intro-pending` class to <html> (hiding the page) and loads this module.
 * Everything renders inside a shadow root, so no styles leak in or out.
 *
 * Tweak points:
 *   INTRO_TIMINGS    – every duration of the intro, in one place (seconds)
 *   SIGN_TEXT        – the sign text (also used for the reduced-motion version)
 *   lobby-scene.js   – CONFIG at the top: colours, camera path, CONFIG.sign = sign lighting
 *
 * The whole sequence is ONE paused GSAP master timeline (built in run() once the scene is ready);
 * the scene renders on gsap.ticker, so there is a single clock and no setTimeout chain.
 */

// All times in seconds from the first visible frame. The master timeline ends at handoff[1] = total.
export const INTRO_TIMINGS = {
  total: 5.5,
  fadeIn: [0.0, 0.5],        // fade in from black, already outside the glass doors
  camera: [0.0, 3.2],        // one continuous spline move: through the doors, across the lobby, stop at the sign wall
  cameraEase: 'power2.inOut',
  doors: [0.5, 1.7],         // glass doors slide open as the camera passes through
  displays: [1.85, 2.3],     // the two wall displays flicker on (during the glide)
  displayRamp: 0.45,         // flicker-on length of each display
  sign: 3.0,                 // first letter warms up (~0.2s before the camera stops, so it feels continuous)
  signLetterGap: 0.08,       // delay between letters
  signLetterRamp: 0.36,      // dim copper -> full amber, per letter
  signLetterEase: 'power2.out',
  sweep: [3.45, 4.0],        // soft light sweep across the sign; the sign is fully lit by 4.0
  hold: [4.0, 4.7],          // hold on the glowing sign (with the slow drift below)
  push: [4.0, 5.5],          // slow drift toward the sign through the hold, continuing as a slight push in the fade
  pushEase: 'power2.in',     // starts from rest, so there is no jump after the camera stops
  prepare: 3.7,              // let the site underneath paint ahead of the cross-fade
  handoff: [4.7, 5.5],       // cross-fade into the website
  skipButton: 0.6,           // Skip button appears
  skipFade: 0.45,            // faster fade when skipped
  reducedMotion: { signIn: 0.5, hold: 0.3, fade: 0.7 }, // static sign fade, then the site (1.5s)
};

const SIGN_TEXT = 'FIRST WEEK';
const T = INTRO_TIMINGS;
const FADE_MS = T.reducedMotion.fade * 1000; // CSS hand-off fade (reduced-motion version)
const SKIP_FADE_MS = T.skipFade * 1000;
const GSAP_URL = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/+esm';
const LOAD_TIMEOUT_MS = 12000; // give up on the 3D scene if it can't load in time
const SESSION_KEY = 'fw_intro_seen';
const PENDING_CLASS = 'fw-intro-pending'; // scroll lock (+ stable scrollbar gutter) while the intro runs
const COVER_CLASS = 'fw-intro-cover';     // boot cover + loading line until the overlay is mounted

const CSS = `
  :host {
    all: initial;
    position: fixed;
    inset: 0;
    z-index: 2147483000;
    display: block;
    visibility: visible;
    background: #F3EFE7; /* ivory paper */
    /* While loading: 0.999 so Chrome paints the site underneath now (an opaque overlay lets it skip
       that, and the whole site would then paint at once during the hand-off). */
    opacity: 0.999;
    transition: opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
    contain: strict;
  }
  /* While the 3D plays: fully opaque, so the site isn't composited under every frame. */
  :host(.fw-intro-playing) { opacity: 1; }
  :host(.fw-intro-leaving) { opacity: 0 !important; pointer-events: none; } /* wins over playing/prepare */
  :host(.fw-intro-leaving-fast) { transition-duration: ${SKIP_FADE_MS}ms; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .fw-intro-stage { position: absolute; inset: 0; overflow: hidden; }
  .fw-intro-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .fw-intro-vignette {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 75% 70% at 50% 48%, rgba(20,18,16,0) 60%, rgba(20,18,16,0.10) 100%);
  }
  .fw-intro-black { position: absolute; inset: 0; background: #F3EFE7; pointer-events: none; } /* fades in from paper */
  .fw-intro-black.fw-intro-gone { opacity: 0; }
  .fw-intro-loader {
    position: absolute; left: 50%; top: 50%; width: 140px; height: 1px; margin-left: -70px;
    background: rgba(20, 18, 16, 0.10); overflow: hidden; transition: opacity 400ms ease;
  }
  .fw-intro-loader::after {
    content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 40%;
    background: linear-gradient(90deg, rgba(20,18,16,0), rgba(20,18,16,0.6), rgba(20,18,16,0));
    animation: fw-intro-load 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  .fw-intro-loader.fw-intro-gone { opacity: 0; }
  @keyframes fw-intro-load { from { transform: translateX(-100%); } to { transform: translateX(260%); } }
  .fw-intro-static {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font: 500 clamp(26px, 5.5vw, 60px)/1 'Inter Tight', Inter, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
    letter-spacing: 0.32em; text-indent: 0.32em; color: #141210;
    opacity: 0; transition: opacity ${T.reducedMotion.signIn * 1000}ms ease;
  }
  .fw-intro-static.fw-intro-show { opacity: 1; }
  .fw-intro-skip {
    position: absolute; right: 20px; bottom: 20px; padding: 8px 15px;
    font: 500 12px/1 'Inter Tight', Inter, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; letter-spacing: 0.02em;
    color: #141210; background: #FAF8F3;
    border: 1px solid rgba(20, 18, 16, 0.12); border-radius: 999px; cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 6px 18px -8px rgba(20, 18, 16, 0.25);
    opacity: 0; pointer-events: none; transition: opacity 600ms ease, background 200ms ease, color 200ms ease;
  }
  .fw-intro-skip.fw-intro-show { opacity: 1; pointer-events: auto; }
  .fw-intro-skip:hover { background: #FFFFFF; border-color: rgba(20, 18, 16, 0.3); }
  .fw-intro-skip:focus-visible { outline: none; box-shadow: 0 0 0 2px #FAF8F3, 0 0 0 4px #141210; }
  @media (max-width: 600px) { .fw-intro-skip { right: 16px; bottom: 16px; } }
`;

const html = document.documentElement;
if (html.classList.contains(PENDING_CLASS)) {
  // This module can run while <head> is still parsing; mount once <body> exists.
  if (document.body) run();
  else document.addEventListener('DOMContentLoaded', run, { once: true });
}

function run() {
  if (!html.classList.contains(PENDING_CLASS)) return; // the <head> failsafe already revealed the site
  const host = document.createElement('div');
  host.className = 'fw-intro-host';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>${CSS}</style>
    <div class="fw-intro-stage" aria-hidden="true">
      <canvas class="fw-intro-canvas"></canvas>
      <div class="fw-intro-static" hidden></div>
      <div class="fw-intro-vignette"></div>
      <div class="fw-intro-black"></div>
      <div class="fw-intro-loader"></div>
    </div>
    <button class="fw-intro-skip" type="button" aria-label="Skip intro">Skip intro</button>
  `;
  const $ = (sel) => shadow.querySelector(sel);
  const canvas = $('.fw-intro-canvas');
  const black = $('.fw-intro-black');
  const loader = $('.fw-intro-loader');
  const skip = $('.fw-intro-skip');
  const staticSign = $('.fw-intro-static');

  document.body.appendChild(host);
  // The overlay now covers the page, so drop the boot cover. The site stays rendered underneath
  // the whole time (never display:none / visibility:hidden), so nothing has to paint at hand-off.
  html.classList.remove(COVER_CLASS);
  window.__fwIntroStarted = true; // tells the <head> failsafe the intro is in charge
  const heroImages = decodeHeroImages();
  const eyebrow = document.getElementById('hero-eyebrow');
  if (eyebrow) eyebrow.classList.add('ii-awaiting-letters');
  let flying = null;
  const releaseEyebrow = () => { if (eyebrow) eyebrow.classList.remove('ii-awaiting-letters'); if (flying) { flying.remove(); flying = null; } };
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) { /* storage unavailable */ }

  let finished = false;
  let controller = null;
  let master = null;
  let firstFrameAt = 0;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function onKey(e) {
    if (e.key === 'Escape') finish(true);
  }
  window.addEventListener('keydown', onKey);
  skip.addEventListener('click', () => finish(true));

  const showSkip = () => skip.classList.add('fw-intro-show');

  // Skip / Esc, errors and the reduced-motion version: CSS fade of the overlay, then clean up.
  function finish(fast) {
    if (finished) return;
    finished = true;
    if (master) master.pause();
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
    host.style.transition = ''; // hand the opacity back to the CSS fade (it continues from the current value)
    // GPU-composited cross-fade of the overlay; the 3D scene keeps rendering until it completes.
    host.classList.add('fw-intro-leaving');
    if (fast) host.classList.add('fw-intro-leaving-fast');
    let done = false;
    const end = () => { if (!done) { done = true; cleanup(); } };
    host.addEventListener('transitionend', (e) => { if (e.target === host) end(); });
    setTimeout(end, (fast ? SKIP_FADE_MS : FADE_MS) + 120); // fallback if transitionend doesn't fire
  }

  function cleanup() {
    const ctrl = controller;
    controller = null;
    if (ctrl) ctrl.stop();
    host.remove();
    releaseEyebrow();
    // The scrollbar gutter was reserved during the intro, so releasing the lock doesn't change the layout width.
    html.classList.remove(PENDING_CLASS, COVER_CLASS);
    const boot = document.getElementById('fw-intro-boot-style');
    if (boot) boot.remove();
    delete window.__fwIntroStarted;
    heroImages.length = 0;
    // Free GPU resources after the fade, a few at a time in idle periods (never in the transition frame).
    if (ctrl) disposeGradually(ctrl.disposeSteps());
  }

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    // Short static fade of the sign instead of the camera flythrough.
    loader.classList.add('fw-intro-gone');
    black.classList.add('fw-intro-gone');
    staticSign.textContent = SIGN_TEXT;
    staticSign.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => staticSign.classList.add('fw-intro-show')));
    later(showSkip, 0);
    later(() => finish(false), (T.reducedMotion.signIn + T.reducedMotion.hold) * 1000);
    return;
  }

  // No separate WebGL probe: creating the renderer fails (and we skip to the site) if WebGL is unavailable.
  later(() => { if (!controller) finish(true); }, LOAD_TIMEOUT_MS);

  Promise.all([import(GSAP_URL), import('./lobby-scene.js')])
    .then(([{ gsap }, mod]) => Promise.all([gsap, mod.createLobbyScene({ canvas, text: SIGN_TEXT })]))
    .then(([gsap, ctrl]) => {
      if (finished) { ctrl.dispose(); return; }
      controller = ctrl;
      master = buildMasterTimeline(gsap, ctrl);
      loader.classList.add('fw-intro-gone');
      host.classList.add('fw-intro-playing');
      host.style.transition = 'none'; // the overlay's opacity is on the timeline now
      // Black at 0.999 (still looks black): Chrome then composites the WebGL canvas during the hidden
      // pre-roll, so its first-composite GPU stall happens here and not in the first visible frames.
      black.style.opacity = '0.999';
      // Rendering starts behind the black screen (quality pre-roll); the timeline starts after it.
      controller.play(() => {
        if (!finished) master.play(0);
      });
    })
    .catch(() => finish(true));

  // The whole sequence on one master timeline; its duration is exactly INTRO_TIMINGS.total.
  function buildMasterTimeline(gsap, ctrl) {
    const len = ([a, b]) => b - a;
    // onStart runs on the first frame the timeline renders (the first non-black frame).
    const tl = gsap.timeline({ paused: true, onStart: () => { firstFrameAt = performance.now(); }, onComplete: complete });
    tl.fromTo(black, { opacity: 0.999 }, { opacity: 0, duration: len(T.fadeIn), ease: 'power2.inOut', immediateRender: false }, T.fadeIn[0]);
    ctrl.addToTimeline(tl, T);
    tl.call(showSkip, null, T.skipButton);
    // ~1s before the fade: 0.999 lets Chrome paint the site underneath ahead of time.
    tl.set(host, { opacity: 0.999 }, T.prepare);
    tl.fromTo(host, { opacity: 0.999 }, { opacity: 0, duration: len(T.handoff), ease: 'power2.inOut', immediateRender: false }, T.handoff[0]);
    // The FIRST WEEK letters lift off the wall and settle into the hero eyebrow while the page fades in.
    tl.call(() => flyLetters(gsap, ctrl, len(T.handoff)), null, T.handoff[0]);
    if (Math.abs(tl.duration() - T.total) > 1e-6) console.warn(`[fw-intro] timeline is ${tl.duration()}s, expected ${T.total}s`);
    return tl;
  }

  function flyLetters(gsap, ctrl, duration) {
    const target = eyebrow && eyebrow.querySelector('.eyebrow-lead');
    const from = ctrl.signScreenRect && ctrl.signScreenRect();
    if (!target || !from || !(from.width > 0)) { releaseEyebrow(); return; }
    const cs = getComputedStyle(target);
    const el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    el.textContent = target.textContent;
    Object.assign(el.style, {
      position: 'fixed', left: '0', top: '0', zIndex: '2147483001', pointerEvents: 'none', whiteSpace: 'nowrap',
      font: cs.font, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform, color: '#141210',
      transformOrigin: '0 0', willChange: 'transform',
    });
    document.body.appendChild(el);
    flying = el;
    const r0 = el.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const s0 = from.width / r0.width;
    gsap.set(el, { x: from.left, y: from.top + (from.height - r0.height * s0) / 2, scale: s0 });
    ctrl.hideSign();
    gsap.to(el, { x: to.left, y: to.top, scale: 1, color: cs.color, duration, ease: 'power3.inOut', onComplete: releaseEyebrow });
  }

  // Natural end: the timeline's cross-fade has already revealed the site.
  function complete() {
    if (finished) return;
    finished = true;
    const ms = performance.now() - firstFrameAt;
    console.info(`[fw-intro] first frame -> site fully visible: ${(ms / 1000).toFixed(3)}s (timeline ${master.duration()}s)`);
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
    cleanup();
  }
}

// Runs disposal steps only while the browser is idle, a small batch per callback.
function disposeGradually(steps) {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(() => fn({ timeRemaining: () => 4 }), 50));
  const run = (deadline) => {
    let n = 0;
    while (steps.length && (n < 1 || deadline.timeRemaining() > 4) && n < 6) {
      try { steps.shift()(); } catch (e) { /* already gone */ }
      n++;
    }
    if (steps.length) idle(run, { timeout: 1000 });
  };
  idle(run, { timeout: 1000 });
}

// Decode the home page's hero background images during the intro, so they don't decode at hand-off.
function decodeHeroImages() {
  const out = [];
  try {
    const seen = new Set();
    for (const el of document.querySelectorAll('[style*="background-image"]')) {
      const m = /url\(['"]?([^'")]+)['"]?\)/.exec(el.getAttribute('style') || '');
      if (!m || seen.has(m[1])) continue;
      seen.add(m[1]);
      const img = new Image();
      img.decoding = 'async';
      img.src = m[1];
      if (img.decode) img.decode().catch(() => { /* decoded lazily by the page instead */ });
      out.push(img);
      if (out.length >= 3) break; // the first slides are the ones visible at hand-off
    }
  } catch (e) { /* non-critical */ }
  return out;
}
