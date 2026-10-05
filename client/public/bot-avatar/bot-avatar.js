/*
 * Robot-face avatar for the onboarding assistant (inline SVG, matches the orange 3D robot).
 *
 * botAvatarHTML({ header }) returns the markup. This script fills the two existing avatar spots:
 *   - the header mark  (#copilot-persistent-panel .copilot-mark)
 *   - each assistant message avatar (.chat-avatar.ai)
 * Their containers keep their exact size and position; only the "S" inside is replaced.
 * User avatars are untouched. Styles are prefixed .fwb- so nothing leaks.
 */
(function () {
  var uid = 0;

  function botAvatarHTML(opts) {
    var header = !!(opts && opts.header);
    var p = 'fwb' + (++uid) + '-';
    var blink = (4 + Math.random() * 2).toFixed(2) + 's';
    var delay = (-Math.random() * 5).toFixed(2) + 's';
    var a11y = header ? 'role="img" aria-label="Onboarding assistant"' : 'aria-hidden="true"';
    return '' +
      '<svg class="fwb-avatar' + (header ? ' fwb-header' : '') + '" viewBox="0 0 64 64" ' + a11y + ' focusable="false">' +
      '<defs>' +
      '<radialGradient id="' + p + 'bg" cx="30%" cy="24%" r="85%">' +
      '<stop offset="0" stop-color="#3A3631"/><stop offset=".55" stop-color="#2B2824"/><stop offset="1" stop-color="#141210"/>' +
      '</radialGradient>' +
      '<linearGradient id="' + p + 'head" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FAF8F3"/><stop offset="1" stop-color="#E2DACB"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + p + 'eye" cx="42%" cy="40%" r="60%">' +
      '<stop offset="0" stop-color="#FFFFFF"/><stop offset=".7" stop-color="#FFF6EA"/><stop offset="1" stop-color="#FFE9CC"/>' +
      '</radialGradient>' +
      '<radialGradient id="' + p + 'glow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="#FFF1DE" stop-opacity=".5"/><stop offset="1" stop-color="#FFF1DE" stop-opacity="0"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<circle cx="32" cy="32" r="32" fill="url(#' + p + 'bg)"/>' +
      '<ellipse cx="32" cy="50" rx="17" ry="4" fill="#000000" opacity=".3"/>' +                       // soft shadow under the head
      '<rect x="7.5" y="27" width="6.5" height="12" rx="3.2" class="fwb-accent" fill="#C9A24A" stroke="rgba(0,0,0,.18)" stroke-width=".9"/>' +
      '<rect x="50" y="27" width="6.5" height="12" rx="3.2" class="fwb-accent" fill="#C9A24A" stroke="rgba(0,0,0,.18)" stroke-width=".9"/>' +
      '<circle class="fwb-accent" cx="27" cy="13.5" r="1.7" fill="#C9A24A"/><circle class="fwb-accent" cx="37" cy="13.5" r="1.7" fill="#C9A24A"/>' +
      '<rect x="12" y="15.5" width="40" height="33" rx="11" fill="url(#' + p + 'head)" stroke="#D8D0C1" stroke-width=".8"/>' +
      '<rect x="16" y="22.5" width="32" height="20" rx="7" fill="#141210"/>' +
      '<path d="M22 22.5h6l-8 20h-4z" fill="#FFFFFF" opacity=".10"/>' +                                 // visor reflection streak
      '<g class="fwb-eyes" style="animation-duration:' + blink + ';animation-delay:' + delay + '">' +
      '<circle class="fwb-glow" cx="26" cy="32.5" r="6.4" fill="url(#' + p + 'glow)"/>' +
      '<circle class="fwb-glow" cx="38" cy="32.5" r="6.4" fill="url(#' + p + 'glow)"/>' +
      '<circle cx="26" cy="32.5" r="3.7" fill="url(#' + p + 'eye)"/>' +
      '<circle cx="38" cy="32.5" r="3.7" fill="url(#' + p + 'eye)"/>' +
      '<circle cx="27.2" cy="31.3" r="1" fill="#FFFFFF"/><circle cx="39.2" cy="31.3" r="1" fill="#FFFFFF"/>' +
      '</g>' +
      '<ellipse cx="25" cy="18.5" rx="10" ry="3.2" fill="#FFFFFF" opacity=".38"/>' +                      // glossy top highlight
      '<circle class="fwb-accent-ring" cx="32" cy="32" r="30.7" fill="none" stroke="#C9A24A" stroke-width="1.5"/>' +
      '</svg>';
  }
  window.botAvatarHTML = botAvatarHTML;

  var style = document.createElement('style');
  style.id = 'fwb-avatar-style';
  style.textContent =
    '.fwb-avatar{display:block;width:100%;height:100%;border-radius:50%;overflow:visible}' +
    '.fwb-eyes{transform-box:fill-box;transform-origin:center;animation:fwb-blink 5s infinite}' +
    '@keyframes fwb-blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.12)}}' +
    '.fwb-header .fwb-glow{animation:fwb-pulse 2.6s ease-in-out infinite}' +
    '@keyframes fwb-pulse{0%,100%{opacity:.7}50%{opacity:1}}' +
    '.fwb-header.fwb-thinking .fwb-glow{animation-duration:.9s}' +
    '.fwb-header.fwb-thinking .fwb-eyes{animation:fwb-look 1.4s ease-in-out infinite}' +
    '@keyframes fwb-look{0%,100%{transform:translateX(0)}25%{transform:translateX(-2.2px)}75%{transform:translateX(2.2px)}}' +
    '.fwb-accent{animation:fwb-accent 8s ease-in-out infinite}' +
    '.fwb-accent-ring{animation:fwb-accent-ring 8s ease-in-out infinite}' +
    '.fwb-header{transform-origin:50% 88%;animation:fwb-dance 2s ease-in-out infinite}' +
    '@keyframes fwb-dance{0%,100%{transform:translateY(0) rotate(0)}20%{transform:translateY(-1.5px) rotate(-6deg)}45%{transform:translateY(0) rotate(0)}70%{transform:translateY(-1.5px) rotate(6deg)}}' +
    '@keyframes fwb-accent{0%,19%{fill:#C9A24A}25%,44%{fill:#C46A4E}50%,69%{fill:#7F9E7C}75%,94%{fill:#6F8BA8}100%{fill:#C9A24A}}' +
    '@keyframes fwb-accent-ring{0%,19%{stroke:#C9A24A}25%,44%{stroke:#C46A4E}50%,69%{stroke:#7F9E7C}75%,94%{stroke:#6F8BA8}100%{stroke:#C9A24A}}' +
    '@media (prefers-reduced-motion:reduce){.fwb-eyes,.fwb-header,.fwb-header .fwb-glow,.fwb-accent,.fwb-accent-ring{animation:none!important}}';
  document.head.appendChild(style);

  // Header avatar
  var mark = document.querySelector('#copilot-persistent-panel .copilot-mark');
  var headerSvg = null;
  if (mark) {
    mark.removeAttribute('aria-hidden'); // the avatar itself is labelled now
    mark.innerHTML = botAvatarHTML({ header: true });
    headerSvg = mark.firstChild;
  }

  // Assistant message avatars (existing and future), plus the header's "thinking" state
  var feed = document.getElementById('chatbot-messages-feed');
  function upgrade(root) {
    var list = root.querySelectorAll ? root.querySelectorAll('.chat-avatar.ai') : [];
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el.getAttribute('data-fwb') === '1') continue;
      el.setAttribute('data-fwb', '1');
      el.innerHTML = botAvatarHTML();
    }
  }
  function syncThinking() {
    if (headerSvg) headerSvg.classList.toggle('fwb-thinking', !!document.getElementById('copilot-thinking-bubble'));
  }
  if (feed) {
    upgrade(feed);
    new MutationObserver(function () { upgrade(feed); syncThinking(); }).observe(feed, { childList: true, subtree: true });
  }
})();
