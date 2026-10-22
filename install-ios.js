(() => {
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (!isIOS || isStandalone) return;

  const style = document.createElement('style');
  style.textContent = `
    #fxh-ios-install{position:fixed;right:14px;top:calc(14px + env(safe-area-inset-top));z-index:2147483000;border:0;border-radius:999px;padding:10px 14px;background:#f5c518;color:#11110f;font:700 14px/1.1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.28);cursor:pointer}
    #fxh-ios-install-modal{position:fixed;inset:0;z-index:2147483640;background:rgba(0,0,0,.62);display:grid;place-items:end center;padding:18px 18px calc(18px + env(safe-area-inset-bottom));font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #fxh-ios-install-card{width:min(100%,480px);background:#171510;color:#fff1d1;border:1px solid rgba(255,241,209,.16);border-radius:20px;padding:20px;box-shadow:0 16px 60px rgba(0,0,0,.5)}
    #fxh-ios-install-card h2{margin:0 0 10px;font-size:22px;color:#f5c518}
    #fxh-ios-install-card p{margin:8px 0;line-height:1.45;font-size:15px}
    #fxh-ios-install-card ol{margin:12px 0 18px;padding-left:22px;line-height:1.5}
    #fxh-ios-install-close{width:100%;border:0;border-radius:999px;padding:13px 16px;background:#f5c518;color:#11110f;font-weight:800;font-size:15px}
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.id = 'fxh-ios-install';
  button.type = 'button';
  button.textContent = 'Install App';
  button.setAttribute('aria-label', 'Install Analog Cam');

  const openGuide = () => {
    const modal = document.createElement('div');
    modal.id = 'fxh-ios-install-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div id="fxh-ios-install-card">
        <h2>Install Analog Cam</h2>
        <p>On iPhone or iPad, install it from Safari:</p>
        <ol>
          <li>Tap the <strong>Share</strong> button.</li>
          <li>Choose <strong>Add to Home Screen</strong>.</li>
          <li>Tap <strong>Add</strong>.</li>
        </ol>
        <button id="fxh-ios-install-close" type="button">Got it</button>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#fxh-ios-install-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  };

  button.addEventListener('click', openGuide);
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(button), { once: true });
})();
