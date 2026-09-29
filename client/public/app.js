/**
 * Enterprise Onboarding Portal - Gateway Routing & Interactive Handlers
 */

document.addEventListener('DOMContentLoaded', () => {
  // Select all role cards
  const roleCards = document.querySelectorAll('.role-card[data-route]');

  // Define route mapping
  const routeMap = {
    'new-joiner': 'new-joiner.html',
    'existing-company': 'existing-company.html',
    'register-company': 'register.html',
    'buddy-admin': 'buddy.html'
  };

  roleCards.forEach(card => {
    const roleKey = card.getAttribute('data-role');
    const targetUrl = card.getAttribute('data-route') || routeMap[roleKey];

    // Click handler for card
    card.addEventListener('click', (e) => {
      // Add quick press animation
      card.style.transform = 'scale(0.98)';
      
      setTimeout(() => {
        if (targetUrl) {
          window.location.href = targetUrl;
        }
      }, 120);
    });

    // Keyboard accessibility: Enter or Space triggers routing
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    // Hover sound/animation visual feedback
    card.addEventListener('mouseenter', () => {
      card.setAttribute('aria-selected', 'true');
    });

    card.addEventListener('mouseleave', () => {
      card.setAttribute('aria-selected', 'false');
    });
  });

  // Track portal visits in sessionStorage for seamless multi-page state
  try {
    sessionStorage.setItem('onboarding_gateway_visited', new Date().toISOString());
  } catch (err) {
    console.debug('Storage not enabled:', err);
  }
});
