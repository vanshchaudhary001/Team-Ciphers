/*
 * Ivory Ink — effect utilities (no app logic lives here).
 *   .sheen      radial highlight follows the cursor (--x / --y)
 *   .tilt       slight 3D tilt toward the cursor (max 8°), eases back on leave
 *   .magnetic   primary CTA drifts toward the cursor
 *   [data-reveal]  staggered fade-up when a screen is shown or scrolled into view
 *   Lenis smooth scrolling, the mobile menu (focus trap, Esc) and the active nav state.
 * Everything visual is skipped under prefers-reduced-motion.
 */
(function () {
  const doc = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionOK = () => !reduced.matches;

  // Cards that get sheen + tilt even when rendered later by the app (event delegation).
  const SHEEN = '.sheen, .card, .company-card, .department-card, .team-item-card, .role-level-selection-card, .contact-card-pro, .signin-card, .dept-auth-card, .hr-kpi-card';
  const TILT = '.tilt, .company-card, .department-card, .team-item-card, .role-level-selection-card';
  const MAX_TILT = 8;

  if (motionOK()) doc.classList.add('ii-motion');

  // ---------- sheen + tilt ----------
  let raf = 0, lastEvt = null;
  function onMove(e) {
    lastEvt = e;
    if (!raf) raf = requestAnimationFrame(applyMove);
  }
  function applyMove() {
    raf = 0;
    const e = lastEvt;
    if (!e || !motionOK() || !finePointer.matches) return;
    const target = e.target instanceof Element ? e.target : null;
    if (!target) return;
    const sheen = target.closest(SHEEN);
    if (sheen) {
      const r = sheen.getBoundingClientRect();
      sheen.style.setProperty('--x', `${e.clientX - r.left}px`);
      sheen.style.setProperty('--y', `${e.clientY - r.top}px`);
    }
    const tilt = target.closest(TILT);
    if (tilt) {
      const r = tilt.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const max = tilt.offsetWidth > 520 ? MAX_TILT / 2 : MAX_TILT; // big panels tilt less
      tilt.classList.add('tilt');
      tilt.style.setProperty('--ry', `${(px * max).toFixed(2)}deg`);
      tilt.style.setProperty('--rx', `${(-py * max).toFixed(2)}deg`);
      tilt.style.transition = 'transform 120ms ease-out, box-shadow 250ms ease';
    }
  }
  function onLeave(e) {
    const t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    if (t.matches && t.matches(TILT)) {
      t.style.transition = 'transform 450ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 250ms ease';
      t.style.setProperty('--rx', '0deg');
      t.style.setProperty('--ry', '0deg');
    }
    if (t.matches && t.matches(SHEEN)) { t.style.removeProperty('--x'); t.style.removeProperty('--y'); }
  }
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerout', onLeave, true);

  // ---------- magnetic CTA ----------
  document.addEventListener('pointermove', (e) => {
    if (!motionOK() || !finePointer.matches) return;
    document.querySelectorAll('.magnetic').forEach((el) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const near = Math.abs(dx) < r.width / 2 + 40 && Math.abs(dy) < r.height / 2 + 40;
      el.style.transition = near ? 'transform 150ms ease-out' : 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)';
      el.style.setProperty('--mx', near ? `${(dx * 0.18).toFixed(1)}px` : '0px');
      el.style.setProperty('--my', near ? `${(dy * 0.25).toFixed(1)}px` : '0px');
    });
  }, { passive: true });

  // ---------- reveals ----------
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  function prepareReveals(root) {
    if (!root) return;
    // Mark the main blocks of a screen for a staggered fade-up (the app renders many screens dynamically).
    const blocks = root.querySelectorAll(':scope [data-reveal], :scope > *:not(script):not(style), :scope > div > *:not(script):not(style)');
    let i = 0;
    blocks.forEach((el) => {
      if (el.closest('#copilot-persistent-panel') || el.matches('.enterprise-modal-overlay, .hr-modal-overlay, .inapp-modal-overlay')) return;
      if (el.classList.contains('is-in')) return; // Never hide elements that are already revealed
      if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
      el.style.setProperty('--reveal-delay', `${Math.min(i, 8) * 70}ms`);
      i++;
      if (!io || !motionOK()) { el.classList.add('is-in'); return; }
      // Above the fold: animate in right away (don't depend on the observer firing).
      const top = el.getBoundingClientRect().top;
      if (top < window.innerHeight) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
      else io.observe(el);
    });
  }

  // ---------- active screen: nav state, reveals, scroll reset ----------
  let lenis = null;
  let lastActiveStepId = null;
  function currentStep() { return [...document.querySelectorAll('.step-view')].find((s) => s.style.display !== 'none' && getComputedStyle(s).display !== 'none'); }
  function onStepChange() {
    const step = currentStep();
    if (!step) return;
    if (step.id === lastActiveStepId) return;
    lastActiveStepId = step.id;
    document.querySelectorAll('.nav-link[data-nav-step]').forEach((a) => {
      if (a.dataset.navStep === step.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    prepareReveals(step);
    if (lenis) lenis.scrollTo(0, { immediate: true });
  }
  const stepObserver = new MutationObserver((muts) => {
    if (muts.some((m) => m.target.classList && m.target.classList.contains('step-view'))) onStepChange();
  });
  document.querySelectorAll('.step-view').forEach((s) => stepObserver.observe(s, { attributes: true, attributeFilter: ['style'] }));
  onStepChange();

  // ---------- Lenis smooth scrolling ----------
  function startLenis() {
    if (!motionOK() || !window.Lenis || lenis) return;
    lenis = new window.Lenis({
      duration: 1.05,
      smoothWheel: true,
      // Let nested scrollers (chat feed, modals, menus, tables) scroll natively.
      prevent: (node) => !!node.closest('#copilot-persistent-panel, .enterprise-modal-overlay, .hr-modal-overlay, .inapp-modal-overlay, .mobile-menu, [data-lenis-prevent], select, textarea'),
    });
    const loop = (t) => { lenis.raf(t); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  if (motionOK()) {
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/lenis@1.1.13/dist/lenis.min.js';
    s.async = true;
    s.onload = startLenis;
    document.head.appendChild(s);
  }

  // ---------- mobile menu ----------
  const menu = document.getElementById('mobile-menu');
  const openBtn = document.querySelector('.nav-menu-btn');
  const closeBtn = menu && menu.querySelector('.mobile-menu-close');
  function focusables() { return [...menu.querySelectorAll('a, button')].filter((el) => !el.hasAttribute('disabled')); }
  function openMenu() {
    menu.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    (focusables()[1] || closeBtn).focus();
  }
  function closeMenu(returnFocus = true) {
    if (menu.hidden) return;
    menu.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lenis) lenis.start();
    if (returnFocus) openBtn.focus();
  }
  if (menu && openBtn && closeBtn) {
    openBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', () => closeMenu());
    menu.addEventListener('click', (e) => { if (e.target.closest('.mobile-menu-links a')) closeMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (menu.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); }
      if (e.key === 'Tab') {
        const f = focusables(); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 960) closeMenu(false); });
  }

  // ---------- layout: keep the docked Copilot inside the viewport ----------
  // The panel is sticky below the header; its height tracks the visible space so the message input is
  // reachable as soon as the dashboard opens, and stays reachable while the task column scrolls.
  const HEADER_GAP = 88;
  let fitRaf = 0;
  function fitCopilot() {
    fitRaf = 0;
    const p = document.getElementById('copilot-persistent-panel');
    if (!p) return;
    const docked = p.classList.contains('copilot-state-medium') && window.innerWidth > 1180 && p.getClientRects().length > 0;
    if (!docked) { p.style.removeProperty('height'); p.style.removeProperty('max-height'); return; }
    const top = Math.max(p.getBoundingClientRect().top, HEADER_GAP);
    const h = Math.max(420, Math.round(window.innerHeight - top - 16));
    p.style.setProperty('height', `${h}px`, 'important');
    p.style.setProperty('max-height', `${h}px`, 'important');
  }
  const queueFit = () => { if (!fitRaf) fitRaf = requestAnimationFrame(fitCopilot); };
  window.addEventListener('scroll', queueFit, { passive: true });
  window.addEventListener('resize', queueFit);
  const panelEl = document.getElementById('copilot-persistent-panel');
  if (panelEl) new MutationObserver(queueFit).observe(panelEl, { attributes: true, attributeFilter: ['class'] });
  document.querySelectorAll('.step-view').forEach((s) => new MutationObserver(queueFit).observe(s, { attributes: true, attributeFilter: ['style'] }));
  queueFit();

  reduced.addEventListener('change', () => doc.classList.toggle('ii-motion', motionOK()));
})();
