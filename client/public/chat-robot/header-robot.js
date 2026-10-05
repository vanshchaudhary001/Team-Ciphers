/*
 * Header robot: the same 3D robot as the minimized launcher, small, in front of "Onboarding assistant".
 * It dances on a loop (arms, legs, hips, head), its accent colour steps every second, it waves when an
 * answer arrives and does a jump-spin when clicked. The SVG avatar stays underneath as the fallback
 * (no WebGL, or reduced motion).
 */
const ACCENT_PERIOD = 1;    // seconds per accent colour
const NEXT_DANCE_MS = 600;  // pause between routines

const panel = document.getElementById('copilot-persistent-panel');
const mark = panel && panel.querySelector('.copilot-mark');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (mark && !reducedMotion) init();

function init() {
  const canvas = document.createElement('canvas');
  canvas.className = 'copilot-mark-robot';
  canvas.setAttribute('aria-hidden', 'true');
  mark.appendChild(canvas);

  let robot = null, loading = null, visible = false, danceTimer = 0;
  const panelShown = () => panel.style.display !== 'none' && getComputedStyle(panel).display !== 'none';

  function size() {
    if (!robot) return;
    const r = canvas.getBoundingClientRect();
    if (r.width && r.height) robot.resize(Math.round(r.width), Math.round(r.height));
  }

  function ensureRobot() {
    if (robot || loading) return;
    loading = import('./chat-robot-scene.js')
      .then((m) => m.createRobot({ canvas, reducedMotion, accentPeriod: ACCENT_PERIOD, accentLimbs: true, tight: true }))
      .then((r) => {
        robot = r;
        mark.classList.add('has-robot');
        size();
        sync();
      })
      .catch(() => { canvas.remove(); }); // keep the SVG avatar
  }

  function keepDancing() {
    clearTimeout(danceTimer);
    if (!visible || !robot) return;
    const secs = robot.isBusy() ? 0.4 : robot.dance();
    danceTimer = setTimeout(keepDancing, secs * 1000 + NEXT_DANCE_MS);
  }

  function sync() {
    if (!panelShown()) { if (robot && visible) { visible = false; robot.setVisible(false); clearTimeout(danceTimer); } return; }
    ensureRobot();
    if (robot && !visible) {
      visible = true;
      size();
      robot.setVisible(true);
      robot.wave();
      danceTimer = setTimeout(keepDancing, 1800);
    }
  }
  new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['style', 'class'] });
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(canvas);
  sync();

  // Wave when a new answer lands; jump-spin on click.
  const feed = document.getElementById('chatbot-messages-feed');
  if (feed) {
    new MutationObserver((muts) => {
      if (!robot || !visible) return;
      const answered = muts.some((m) => [...m.addedNodes].some((n) => n.classList && n.classList.contains('assistant') && !n.classList.contains('thinking')));
      if (answered) { robot.setExpression('happy', 1200); robot.wave(); }
    }).observe(feed, { childList: true });
  }
  mark.addEventListener('click', () => {
    if (!robot) return;
    robot.setExpression(Math.random() < 0.5 ? 'heart' : 'star', 900);
    robot.jumpSpin();
  });

  window.addEventListener('pagehide', () => { if (robot) robot.dispose(); }, { once: true });
}
