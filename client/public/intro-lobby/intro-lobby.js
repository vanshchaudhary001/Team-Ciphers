/*
 * "First Week" lobby intro: loader and hand-off.
 *
 * Mounted by a small script in the <head> of index.html, which adds the
 * `fw-intro-pending` class to <html> (hiding the page) and loads this module.
 * Everything renders inside a shadow root, so no styles leak in or out.
 *
 * Tweak points:
 *   SIGN_TEXT        – the sign text (also used for the reduced-motion version)
 *   FADE_MS          – hand-off fade into the site
 *   lobby-scene.js   – CONFIG at the top: timing, colours, camera path
 */

const SIGN_TEXT = 'FIRST WEEK';
const FADE_MS = 800;          // cross-fade from the intro into the site
const SKIP_FADE_MS = 450;     // faster fade when skipped
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
    background: #05070B;
    /* While loading: 0.999 so Chrome paints the site underneath now (an opaque overlay lets it skip
       that, and the whole site would then paint at once during the hand-off). */
    opacity: 0.999;
    transition: opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
    contain: strict;
  }
  /* While the 3D plays: fully opaque, so the site isn't composited under every frame. */
  :host(.fw-intro-playing) { opacity: 1; }
  /* About a second before the hand-off: back to 0.999 so the (already painted) site is ready to show. */
  :host(.fw-intro-playing.fw-intro-prepare) { opacity: 0.999; }
  :host(.fw-intro-leaving) { opacity: 0 !important; pointer-events: none; } /* wins over playing/prepare */
  :host(.fw-intro-leaving-fast) { transition-duration: ${SKIP_FADE_MS}ms; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .fw-intro-stage { position: absolute; inset: 0; overflow: hidden; }
  .fw-intro-canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  .fw-intro-vignette {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 75% 70% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%);
  }
  .fw-intro-black {
    position: absolute; inset: 0; background: #000; pointer-events: none;
    transition: opacity 1000ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  .fw-intro-black.fw-intro-gone { opacity: 0; }
  .fw-intro-loader {
    position: absolute; left: 50%; top: 50%; width: 140px; height: 1px; margin-left: -70px;
    background: rgba(235, 240, 248, 0.12); overflow: hidden; transition: opacity 400ms ease;
  }
  .fw-intro-loader::after {
    content: ''; position: absolute; top: 0; bottom: 0; left: 0; width: 40%;
    background: linear-gradient(90deg, rgba(235,240,248,0), rgba(235,240,248,0.85), rgba(235,240,248,0));
    animation: fw-intro-load 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  .fw-intro-loader.fw-intro-gone { opacity: 0; }
  @keyframes fw-intro-load { from { transform: translateX(-100%); } to { transform: translateX(260%); } }
  .fw-intro-static {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    font: 500 clamp(26px, 5.5vw, 60px)/1 Inter, -apple-system, 'Helvetica Neue', 'Segoe UI', Roboto, Arial, sans-serif;
    letter-spacing: 0.32em; text-indent: 0.32em; color: #EAF2FF;
    text-shadow: 0 0 28px rgba(168, 200, 255, 0.45);
    opacity: 0; transition: opacity 700ms ease;
  }
  .fw-intro-static.fw-intro-show { opacity: 1; }
  .fw-intro-skip {
    position: absolute; right: 20px; bottom: 20px; padding: 8px 15px;
    font: 500 12px/1 Inter, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; letter-spacing: 0.06em;
    color: rgba(235, 240, 248, 0.82); background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 999px; cursor: pointer;
    opacity: 0; pointer-events: none; transition: opacity 600ms ease, background 200ms ease, color 200ms ease;
  }
  .fw-intro-skip.fw-intro-show { opacity: 1; pointer-events: auto; }
  .fw-intro-skip:hover { color: #FFFFFF; background: rgba(255, 255, 255, 0.12); }
  .fw-intro-skip:focus-visible { outline: 2px solid rgba(235, 240, 248, 0.85); outline-offset: 2px; }
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
    <button class="fw-intro-skip" type="button" aria-label="Skip intro">Skip</button>
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
  try { sessionStorage.setItem(SESSION_KEY, '1'); } catch (e) { /* storage unavailable */ }

  let finished = false;
  let controller = null;
  const timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function onKey(e) {
    if (e.key === 'Escape') finish(true);
  }
  window.addEventListener('keydown', onKey);
  skip.addEventListener('click', () => finish(true));

  function showSkip() {
    later(() => skip.classList.add('fw-intro-show'), 1000);
  }

  function finish(fast) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    window.removeEventListener('keydown', onKey);
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
    showSkip();
    later(() => finish(false), 1900);
    return;
  }

  // No separate WebGL probe: creating the renderer fails (and we skip to the site) if WebGL is unavailable.
  later(() => { if (!controller) finish(true); }, LOAD_TIMEOUT_MS);

  import('./lobby-scene.js')
    .then((mod) => mod.createLobbyScene({
      canvas,
      text: SIGN_TEXT,
      onPrepareHandoff: () => host.classList.add('fw-intro-prepare'),
      onHandoff: () => finish(false),
    }))
    .then((ctrl) => {
      if (finished) { ctrl.dispose(); return; }
      controller = ctrl;
      loader.classList.add('fw-intro-gone');
      host.classList.add('fw-intro-playing');
      controller.play(() => {
        // Timeline starts: fade in from black and offer Skip shortly after.
        black.classList.add('fw-intro-gone');
        showSkip();
      });
    })
    .catch(() => finish(true));
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
