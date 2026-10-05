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
      '<stop offset="0" stop-color="#FF9A3D"/><stop offset=".55" stop-color="#FF7A1A"/><stop offset="1" stop-color="#E05A00"/>' +
      '</radialGradient>' +
      '<linearGradient id="' + p + 'head" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#FF9440"/><stop offset="1" stop-color="#F06A0C"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + p + 'eye" cx="42%" cy="40%" r="60%">' +
      '<stop offset="0" stop-color="#FFD27A"/><stop offset=".7" stop-color="#FF8A1F"/><stop offset="1" stop-color="#FF7A1A"/>' +
      '</radialGradient>' +
      '<radialGradient id="' + p + 'glow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="#FFB347" stop-opacity=".75"/><stop offset="1" stop-color="#FF8A1F" stop-opacity="0"/>' +
      '</radialGradient>' +
      '</defs>' +
      '<circle cx="32" cy="32" r="32" fill="url(#' + p + 'bg)"/>' +
      '<ellipse cx="32" cy="50" rx="17" ry="4" fill="#7A2E00" opacity=".28"/>' +                       // soft shadow under the head
      '<rect x="7.5" y="27" width="6.5" height="12" rx="3.2" fill="#E05A00" stroke="#B84A00" stroke-width=".9"/>' +
      '<rect x="50" y="27" width="6.5" height="12" rx="3.2" fill="#E05A00" stroke="#B84A00" stroke-width=".9"/>' +
      '<circle cx="27" cy="13.5" r="1.7" fill="#3A3D43"/><circle cx="37" cy="13.5" r="1.7" fill="#3A3D43"/>' +
      '<rect x="12" y="15.5" width="40" height="33" rx="11" fill="url(#' + p + 'head)" stroke="#D85500" stroke-width=".8"/>' +
      '<rect x="16" y="22.5" width="32" height="20" rx="7" fill="#0F0F12"/>' +
      '<path d="M22 22.5h6l-8 20h-4z" fill="#FFFFFF" opacity=".10"/>' +                                 // visor reflection streak
      '<g class="fwb-eyes" style="animation-duration:' + blink + ';animation-delay:' + delay + '">' +
      '<circle class="fwb-glow" cx="26" cy="32.5" r="6.4" fill="url(#' + p + 'glow)"/>' +
      '<circle class="fwb-glow" cx="38" cy="32.5" r="6.4" fill="url(#' + p + 'glow)"/>' +
      '<circle cx="26" cy="32.5" r="3.7" fill="url(#' + p + 'eye)"/>' +
      '<circle cx="38" cy="32.5" r="3.7" fill="url(#' + p + 'eye)"/>' +
      '<circle cx="27.2" cy="31.3" r="1" fill="#FFFFFF"/><circle cx="39.2" cy="31.3" r="1" fill="#FFFFFF"/>' +
      '</g>' +
      '<ellipse cx="25" cy="18.5" rx="10" ry="3.2" fill="#FFFFFF" opacity=".38"/>' +                      // glossy top highlight
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
    '@media (prefers-reduced-motion:reduce){.fwb-eyes,.fwb-header .fwb-glow{animation:none!important}}';
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
