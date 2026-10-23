
(() => {
  let deferredPrompt = null;
  let button = null;
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function createButton() {
    if (button) return button;
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'fxh-floating-install';
    button.setAttribute('aria-label', 'Install FXH CAM app');
    button.innerHTML = '<span class="fxh-install-dot" aria-hidden="true"></span><span>Install App</span>';
    button.addEventListener('click', async () => {
      if (isStandalone()) {
        hideButton();
        return;
      }
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice.catch(() => null);
          if (choice && choice.outcome === 'accepted') {
            hideButton();
          }
        } catch (err) {
          console.warn('Install prompt failed', err);
        }
        return;
      }
      const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
      const msg = isiOS
        ? 'To install FXH CAM: tap Share in Safari, then choose “Add to Home Screen”.'
        : 'To install FXH CAM: open your browser menu and choose “Install app” or “Add to Home screen”.';
      window.alert(msg);
    });
    document.body.appendChild(button);
    return button;
  }

  function showButton() {
    if (isStandalone()) return hideButton();
    createButton().classList.add('is-visible');
  }

  function hideButton() {
    if (button) button.classList.remove('is-visible');
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hideButton();
  });

  window.addEventListener('load', () => {
    createButton();
    if (!isStandalone()) {
      setTimeout(showButton, 1600);
    }
  });
})();
