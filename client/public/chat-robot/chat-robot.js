/*
 * Minimized-chat robot: replaces what shows while the onboarding assistant is minimized.
 *
 * It never changes the chat's own logic. The existing pill (#copilot-compact-trigger) stays the source
 * of truth: when the page shows the pill, the robot shows instead (the pill is only hidden by a scoped
 * rule); opening the chat from the robot simply clicks the pill. If WebGL fails, the pill stays.
 *
 * Tweak points: SIZES, TIMINGS and EMOJI below; colours/dances/BPM in chat-robot-scene.js.
 */

const SIZES = { desktop: { w: 150, h: 170 }, mobile: { w: 106, h: 120 }, margin: 16 };
const TIMINGS = {
  clickDelay: 250,                // wait for a possible double-click before opening
  dragThreshold: 5,               // px of movement before a press becomes a drag
  wave: [15000, 20000],           // idle wave interval
  autoDance: [20000, 30000],      // idle auto-dance interval
  typing: [9000, 16000],          // idle "• • • •" typing bubble interval
  helpBubble: 45000,              // "Need help? 👋" interval
  hoverWiggle: 2000,              // hover this long for a little wiggle
  danceEmoji: 500, dragEmoji: 400,
};
const EMOJI = {
  click: ['😊', '👋', '🧡', '✨', '😄'],
  dance: ['🎵', '🎶', '💃', '🕺', '🎉', '✨'],
  drag: ['😮', '😆', '🤸', '🌀'],
  dizzy: ['😵‍💫'],
  drop: ['😌', '👍'],
  hover: ['👀'],
};
const POS_KEY = 'cr_robot_pos';

const pill = document.getElementById('copilot-compact-trigger');
const panel = document.getElementById('copilot-persistent-panel');
if (pill && panel) init();

function init() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const docStyle = document.createElement('style');
  docStyle.id = 'cr-robot-doc-style';
  // Hide the pill only while the robot is active (it stays the fallback otherwise).
  docStyle.textContent = 'html.cr-robot-active #copilot-compact-trigger{visibility:hidden!important;pointer-events:none!important}';
  document.head.appendChild(docStyle);

  let robot = null, loading = null, failed = false, active = false;
  let lastPanelRect = null, minimizedAt = 0;
  const pillShown = () => pill.style.display !== 'none' && getComputedStyle(pill).display !== 'none';
  const panelShown = () => panel.style.display !== 'none' && getComputedStyle(panel).display !== 'none';

  // ---------- Overlay layer (shadow DOM: nothing leaks either way) ----------
  const layer = document.createElement('div');
  layer.className = 'cr-robot-layer';
  const shadow = layer.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; position: fixed; inset: 0; z-index: 99990; pointer-events: none; display: block; }
      * { box-sizing: border-box; }
      .stage { position: absolute; left: 0; top: 0; visibility: hidden; opacity: 0; transition: opacity .25s ease, transform .3s cubic-bezier(.2,.8,.2,1); }
      .stage.on { visibility: visible; opacity: 1; }
      .stage.out { opacity: 0; transform: scale(.4); }
      .robot { all: unset; display: block; position: relative; width: 100%; height: 100%; cursor: grab; pointer-events: auto;
               touch-action: none; -webkit-tap-highlight-color: transparent; border-radius: 24px; }
      .robot.dragging { cursor: grabbing; }
      .robot:focus-visible { outline: 2px solid #ff7a1a; outline-offset: 2px; }
      canvas { display: block; width: 100%; height: 100%; pointer-events: none; }
      .bubble { position: absolute; left: 4%; top: 2%; padding: 5px 10px; border-radius: 12px 12px 12px 4px;
                background: #ff7a1a; color: #fff; font: 600 12px/1.2 Inter, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
                box-shadow: 0 4px 12px rgba(0,0,0,.18); white-space: nowrap; opacity: 0; transform: translateY(6px) scale(.9);
                transition: opacity .25s ease, transform .25s ease; pointer-events: none; }
      .bubble.show { opacity: 1; transform: none; }
      .dots { display: inline-flex; gap: 3px; }
      .dots i { width: 4px; height: 4px; border-radius: 50%; background: #fff; display: block; animation: cr-dot 1s infinite ease-in-out; }
      .dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; } .dots i:nth-child(4) { animation-delay: .45s; }
      @keyframes cr-dot { 0%, 60%, 100% { opacity: .35; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
      .emoji { position: absolute; left: 50%; top: 4%; font-size: 20px; line-height: 1; pointer-events: none; will-change: transform, opacity;
               animation: cr-pop 1.2s ease-out forwards; }
      @keyframes cr-pop {
        0%   { opacity: 0; transform: translate(var(--x0), 0) scale(.3) rotate(0deg); }
        15%  { opacity: 1; transform: translate(var(--x0), -8px) scale(1.15) rotate(var(--r1)); }
        55%  { opacity: 1; transform: translate(var(--x1), -40px) scale(1) rotate(var(--r2)); }
        100% { opacity: 0; transform: translate(var(--x2), -78px) scale(.9) rotate(var(--r1)); }
      }
      .ghost { position: absolute; left: 0; top: 0; background: #161616; border: 1px solid #262626; border-radius: 12px;
               opacity: 0; pointer-events: none; transform-origin: 0 0; will-change: transform, opacity; }
      @media (prefers-reduced-motion: reduce) { .stage { transition: opacity .2s ease; } .stage.out { transform: none; } }
    </style>
    <div class="ghost"></div>
    <div class="stage">
      <button class="robot" type="button" aria-label="Open onboarding assistant"><canvas></canvas></button>
      <div class="bubble" aria-hidden="true"></div>
    </div>
  `;
  const stage = shadow.querySelector('.stage');
  const btn = shadow.querySelector('.robot');
  const canvas = shadow.querySelector('canvas');
  const bubble = shadow.querySelector('.bubble');
  const ghost = shadow.querySelector('.ghost');
  document.body.appendChild(layer);

  // ---------- Size + position (clamped, remembered for the session) ----------
  let size = currentSize();
  let pos = loadPos();
  function currentSize() { return window.innerWidth < 600 ? SIZES.mobile : SIZES.desktop; }
  function defaultPos() { return { x: window.innerWidth - size.w - SIZES.margin, y: window.innerHeight - size.h - SIZES.margin }; }
  function loadPos() { try { const p = JSON.parse(sessionStorage.getItem(POS_KEY)); if (p && isFinite(p.x) && isFinite(p.y)) return p; } catch (e) { /* storage unavailable */ } return null; }
  function savePos() { try { sessionStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch (e) { /* storage unavailable */ } }
  function clampPos(p) {
    const m = SIZES.margin;
    return { x: Math.min(Math.max(m, p.x), window.innerWidth - size.w - m), y: Math.min(Math.max(m, p.y), window.innerHeight - size.h - m) };
  }
  function place() {
    pos = clampPos(pos || defaultPos());
    stage.style.width = size.w + 'px';
    stage.style.height = size.h + 'px';
    stage.style.left = pos.x + 'px';
    stage.style.top = pos.y + 'px';
  }
  place();
  // Re-clamp whenever the viewport changes (resize events, and viewport changes that don't fire one).
  const onViewport = () => {
    const s = currentSize();
    if (s !== size) { size = s; if (robot) robot.resize(size.w, size.h); }
    place();
  };
  window.addEventListener('resize', onViewport);
  if ('ResizeObserver' in window) new ResizeObserver(onViewport).observe(document.documentElement);

  // ---------- Lazy-load the 3D robot (first time the chat is used, or if it starts minimized) ----------
  function ensureRobot() {
    if (robot || loading || failed) return loading;
    loading = import('./chat-robot-scene.js')
      .then((m) => m.createRobot({ canvas, reducedMotion }))
      .then((r) => { robot = r; robot.resize(size.w, size.h); sync(); return r; })
      .catch(() => { failed = true; loading = null; deactivate(); }); // no WebGL → keep the existing pill
    return loading;
  }

  // ---------- Follow the existing open/minimized state ----------
  function sync() {
    if (panelShown()) ensureRobot();
    const want = pillShown();
    if (want && robot && !active) activate();
    else if (!want && active) deactivate();
    else if (want && !robot) ensureRobot();
  }
  new MutationObserver(sync).observe(pill, { attributes: true, attributeFilter: ['style', 'class'] });
  new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['style', 'class'] });
  // Remember where the panel was when it gets minimized (for the shrink/expand transitions).
  // (Capture phase on document runs before the button's own inline onclick hides the panel.)
  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('#copilot-minimize-btn') && panelShown()) {
      lastPanelRect = panel.getBoundingClientRect();
      minimizedAt = performance.now();
    }
  }, true);
  sync();

  function activate() {
    active = true;
    document.documentElement.classList.add('cr-robot-active');
    place();
    const fromPanel = lastPanelRect && performance.now() - minimizedAt < 1500;
    const show = () => {
      stage.classList.remove('out');
      stage.classList.add('on');
      robot.setVisible(true);
      const t = robot.dropIn();
      setTimeout(() => { if (active) { robot.wave(); say('Hi! 👋', 2000); } }, t * 1000);
      scheduleIdle();
    };
    if (fromPanel && !reducedMotion) animateGhost(lastPanelRect, robotRect(), 'shrink').then(show);
    else show();
  }

  function deactivate() {
    active = false;
    document.documentElement.classList.remove('cr-robot-active');
    stage.classList.remove('on');
    hideBubble();
    clearIdle();
    if (robot) robot.setVisible(false);
  }

  function robotRect() { return { left: pos.x, top: pos.y, width: size.w, height: size.h }; }

  // Panel-shaped ghost that shrinks into / grows out of the robot (the real panel is untouched).
  function animateGhost(from, to, mode) {
    const target = mode === 'shrink' ? from : to;
    ghost.style.width = target.width + 'px';
    ghost.style.height = target.height + 'px';
    ghost.style.left = target.left + 'px';
    ghost.style.top = target.top + 'px';
    const other = mode === 'shrink' ? to : from;
    const sx = other.width / target.width, sy = other.height / target.height;
    const dx = other.left - target.left, dy = other.top - target.top;
    const small = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
    const frames = mode === 'shrink'
      ? [{ transform: 'none', opacity: 0.95 }, { transform: small, opacity: 0 }]
      : [{ transform: small, opacity: 0 }, { transform: 'none', opacity: 0.95 }];
    return ghost.animate(frames, { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).finished
      .then(() => { if (mode === 'shrink') ghost.style.opacity = 0; })
      .catch(() => {});
  }

  // ---------- Opening the chat (exactly as today: click the existing pill) ----------
  let opening = false;
  function openChat() {
    if (opening || !active) return;
    opening = true;
    clearIdle();
    hideBubble();
    robot.setExpression(Math.random() < 0.5 ? 'heart' : 'wink', 900);
    burst(EMOJI.click, 1 + Math.round(Math.random()));
    const t = robot.jumpSpin();
    setTimeout(() => {
      const target = lastPanelRect || defaultPanelRect();
      const grow = reducedMotion ? Promise.resolve() : animateGhost(robotRect(), target, 'grow');
      stage.classList.add('out');
      grow.then(() => {
        pill.click(); // the page's own handler: setCopilotState('medium')
        ghost.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
        opening = false;
      });
    }, Math.max(200, t * 1000 - 150));
  }
  function defaultPanelRect() {
    const w = Math.min(440, window.innerWidth - 32), h = Math.min(window.innerHeight - 120, 720);
    return { left: window.innerWidth - w - 24, top: 96, width: w, height: h };
  }

  // ---------- Pointer: click vs double-click vs drag ----------
  let press = null, clickTimer = 0, lastShake = [];
  btn.addEventListener('pointerdown', (e) => {
    if (!robot || e.button > 0) return;
    btn.setPointerCapture(e.pointerId);
    press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: e.clientX - pos.x, oy: e.clientY - pos.y,
      dragging: false, lastX: e.clientX, lastY: e.clientY, lastT: performance.now(), vx: 0, vy: 0, dizzy: false, lastEmoji: 0 };
  });
  btn.addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const now = performance.now();
    if (!press.dragging && Math.hypot(e.clientX - press.x0, e.clientY - press.y0) > TIMINGS.dragThreshold) {
      press.dragging = true;
      btn.classList.add('dragging');
      clearTimeout(clickTimer); clickTimer = 0;
      hideBubble();
    }
    if (!press.dragging) return;
    const dt = Math.max(1, now - press.lastT) / 1000;
    const ivx = (e.clientX - press.lastX) / dt, ivy = (e.clientY - press.lastY) / dt;
    press.vx += (ivx - press.vx) * 0.35; press.vy += (ivy - press.vy) * 0.35;
    press.lastX = e.clientX; press.lastY = e.clientY; press.lastT = now;
    pos = clampPos({ x: e.clientX - press.ox, y: e.clientY - press.oy });
    stage.style.left = pos.x + 'px'; stage.style.top = pos.y + 'px';
    robot.setDrag(true, press.vx, press.vy);
    if (now - press.lastEmoji > TIMINGS.dragEmoji) { press.lastEmoji = now; spawn(pick(EMOJI.drag)); }
    // Fast shake → dizzy: several quick direction reversals within ~1s
    const speed = Math.hypot(press.vx, press.vy);
    lastShake = lastShake.filter((s) => now - s.t < 1000);
    if (speed > 900) {
      const dir = Math.sign(press.vx) || Math.sign(press.vy);
      const prev = lastShake[lastShake.length - 1];
      if (!prev || prev.dir !== dir) lastShake.push({ t: now, dir });
    }
    if (!press.dizzy && (lastShake.length >= 4 || speed > 3200)) { press.dizzy = true; spawn(EMOJI.dizzy[0]); robot.setExpression('spiral', 0); }
  });
  const endPress = (e) => {
    if (!press || e.pointerId !== press.id) return;
    const p = press;
    press = null;
    btn.classList.remove('dragging');
    if (p.dragging) {
      robot.setDrag(false);
      savePos();
      if (p.dizzy) { robot.dizzy(); spawn(EMOJI.dizzy[0]); }
      else { robot.land(); spawn(pick(EMOJI.drop)); robot.setExpression('happy', 700); }
      return;
    }
    if (e.type === 'pointercancel') return;
    // Single click opens after a short wait; a second click within that window dances instead.
    if (clickTimer) {
      clearTimeout(clickTimer); clickTimer = 0;
      startDance();
    } else {
      clickTimer = setTimeout(() => { clickTimer = 0; openChat(); }, TIMINGS.clickDelay);
    }
  };
  btn.addEventListener('pointerup', endPress);
  btn.addEventListener('pointercancel', endPress);
  btn.addEventListener('click', (e) => { if (e.detail === 0) { e.preventDefault(); openChat(); } }); // keyboard-activated click
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat(); } });

  // Hover: first-time 👀, and a little wiggle after 2s
  let hoverTimer = 0, hoveredOnce = false;
  btn.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !robot) return;
    if (!hoveredOnce) { hoveredOnce = true; spawn(EMOJI.hover[0]); }
    hoverTimer = setTimeout(() => { if (active && !robot.isBusy()) robot.wiggle(); }, TIMINGS.hoverWiggle);
  });
  btn.addEventListener('pointerleave', () => clearTimeout(hoverTimer));

  // Head and eyes follow the cursor when it's near
  let lookRaf = 0, lookEv = null;
  window.addEventListener('pointermove', (e) => {
    lookEv = e;
    if (lookRaf || !active || !robot) return;
    lookRaf = requestAnimationFrame(() => {
      lookRaf = 0;
      const cx = pos.x + size.w / 2, cy = pos.y + size.h * 0.35;
      const dx = lookEv.clientX - cx, dy = lookEv.clientY - cy;
      const near = Math.hypot(dx, dy) < 420;
      robot.setLook(Math.max(-1, Math.min(1, dx / 260)), Math.max(-1, Math.min(1, dy / 260)), near);
    });
  }, { passive: true });

  // ---------- Dancing ----------
  let danceTimer = 0;
  function startDance(name) {
    if (!robot || reducedMotion) return;
    const secs = robot.dance(name);
    clearInterval(danceTimer);
    const until = performance.now() + secs * 1000;
    danceTimer = setInterval(() => {
      if (performance.now() > until || !active) { clearInterval(danceTimer); return; }
      spawn(pick(EMOJI.dance));
    }, TIMINGS.danceEmoji);
  }

  // ---------- Idle schedule: wave, auto-dance, typing bubble, "Need help?" ----------
  const idleTimers = [];
  const rand = ([a, b]) => a + Math.random() * (b - a);
  function every(range, fn) {
    const tick = () => { idleTimers.push(setTimeout(() => { if (active && !press && !opening) fn(); tick(); }, typeof range === 'number' ? range : rand(range))); };
    tick();
  }
  function scheduleIdle() {
    clearIdle();
    if (!reducedMotion) {
      every(TIMINGS.wave, () => { if (!robot.isBusy()) robot.wave(); });
      every(TIMINGS.autoDance, () => { if (!robot.isBusy()) startDance(); });
    }
    every(TIMINGS.typing, () => { if (!bubbleBusy) typing(2500); });
    every(TIMINGS.helpBubble, () => say('Need help? 👋', 3000));
  }
  function clearIdle() { idleTimers.forEach(clearTimeout); idleTimers.length = 0; clearInterval(danceTimer); }

  // ---------- Speech bubble ----------
  let bubbleTimer = 0, bubbleBusy = false;
  function say(text, ms) {
    bubble.textContent = text;
    showBubble(ms);
  }
  function typing(ms) {
    bubble.innerHTML = '<span class="dots"><i></i><i></i><i></i><i></i></span>';
    showBubble(ms);
  }
  function showBubble(ms) {
    bubbleBusy = true;
    clearTimeout(bubbleTimer);
    bubble.classList.add('show');
    bubbleTimer = setTimeout(hideBubble, ms);
  }
  function hideBubble() { clearTimeout(bubbleTimer); bubble.classList.remove('show'); bubbleBusy = false; }

  // ---------- Emoji (DOM; transform/opacity only; removed when done) ----------
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function burst(list, n) { for (let i = 0; i < n; i++) setTimeout(() => spawn(pick(list)), i * 120); }
  function spawn(ch) {
    if (stage.querySelectorAll('.emoji').length > 8) return;
    const el = document.createElement('span');
    el.className = 'emoji';
    el.textContent = ch;
    const side = Math.random() < 0.5 ? -1 : 1;
    el.style.setProperty('--x0', `${-10 + side * 10}px`);
    el.style.setProperty('--x1', `${-10 + side * (24 + Math.random() * 14)}px`);
    el.style.setProperty('--x2', `${-10 + side * (30 + Math.random() * 20)}px`);
    el.style.setProperty('--r1', `${side * 12}deg`);
    el.style.setProperty('--r2', `${-side * 10}deg`);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    stage.appendChild(el);
  }

  window.addEventListener('pagehide', () => { if (robot) robot.dispose(); }, { once: true });
}
