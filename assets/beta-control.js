(function () {
  'use strict';

  const BETA_END = Date.parse('2027-01-01T00:00:00+01:00');
  const STATUS_URL = '/beta-status.json';
  const INSTALL_KEY = 'fxhcam:betaIntroSeen:v2';
  const FEEDBACK_EMAIL = 'fitim@xharra.com';
  let remoteStatus = null;
  let deferredInstallPrompt = null;
  let originalGetUserMedia = null;
  let uiReady = false;

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  }

  function isExpiredByDate() {
    return Date.now() >= BETA_END;
  }

  function isBlocked() {
    if (isExpiredByDate()) return true;
    if (remoteStatus && remoteStatus.active === false) return true;
    if (remoteStatus && remoteStatus.expires_at) {
      const t = Date.parse(remoteStatus.expires_at);
      if (Number.isFinite(t) && Date.now() >= t) return true;
    }
    return false;
  }

  function stopCameraStreams() {
    document.querySelectorAll('video').forEach((video) => {
      try {
        const stream = video.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch (_) {}
    });
  }

  function patchCameraAccess() {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') return;
    originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const guarded = function (constraints) {
      if (isBlocked()) {
        showEndedModal();
        return Promise.reject(new DOMException('FXH CAM Public Beta has ended.', 'NotAllowedError'));
      }
      return originalGetUserMedia(constraints);
    };
    try {
      navigator.mediaDevices.getUserMedia = guarded;
    } catch (_) {
      try {
        Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: guarded });
      } catch (_) {}
    }
  }

  function styles() {
    const style = document.createElement('style');
    style.id = 'fxh-beta-styles';
    style.textContent = `
      #fxhBetaDock{position:fixed;right:12px;bottom:78px;z-index:5000;display:none;align-items:center;gap:7px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
      #fxhBetaDock .fxh-beta-pill,#fxhBetaDock button{border:1px solid rgba(255,198,83,.48);background:rgba(5,7,6,.88);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:#ffc653;border-radius:999px;min-height:38px;padding:8px 11px;font-weight:800;font-size:10px;letter-spacing:.055em;box-shadow:0 5px 18px rgba(0,0,0,.24)}
      #fxhBetaDock button{cursor:pointer}
      #fxhBetaDock button.fxh-install{background:#ffc653;color:#15130d;border-color:#ffc653}
      #fxhBetaDock button.fxh-feedback{color:#f0f2ef;border-color:rgba(240,242,239,.25)}
      .fxh-beta-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.78);display:grid;place-items:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
      .fxh-beta-modal{width:min(430px,100%);max-height:calc(100% - 24px);overflow:auto;background:#0b100e;color:#f4f1e8;border:1px solid rgba(255,198,83,.42);border-radius:20px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.5)}
      .fxh-beta-kicker{display:inline-flex;align-items:center;gap:7px;color:#ffc653;font-size:11px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
      .fxh-beta-dot{width:7px;height:7px;border-radius:50%;background:#ef4c3a;box-shadow:0 0 0 4px rgba(239,76,58,.12)}
      .fxh-beta-modal h2{margin:12px 0 9px;font-size:25px;line-height:1.08;letter-spacing:-.02em}
      .fxh-beta-modal p{margin:0 0 11px;color:#c8ceca;font-size:14px;line-height:1.52}
      .fxh-beta-note{margin:15px 0;padding:12px 13px;border-radius:13px;background:#111a17;border:1px solid #23312c;color:#d8dedb;font-size:12.5px;line-height:1.45}
      .fxh-feedback-card{margin:15px 0 0;padding:14px;border-radius:14px;background:linear-gradient(135deg,#17170f,#0f1714);border:1px solid rgba(255,198,83,.32)}
      .fxh-feedback-card h3{margin:0 0 6px;color:#ffc653;font-size:15px;letter-spacing:.01em}
      .fxh-feedback-card p{margin:0!important;font-size:12.5px!important;line-height:1.45!important}
      .fxh-beta-actions{display:grid;gap:9px;margin-top:17px}
      .fxh-beta-actions button,.fxh-beta-actions a{display:flex;align-items:center;justify-content:center;min-height:46px;border-radius:12px;border:1px solid #31423b;text-decoration:none;font-size:13px;font-weight:900;letter-spacing:.035em;cursor:pointer;box-sizing:border-box}
      .fxh-beta-primary{background:#ffc653!important;border-color:#ffc653!important;color:#16130b!important}
      .fxh-beta-secondary{background:#111916!important;color:#f0f2ef!important}
      .fxh-beta-ghost{background:transparent!important;color:#9fa9a5!important}
      .fxh-beta-modal small{display:block;margin-top:14px;color:#7f8985;font-size:11px;line-height:1.4;text-align:center}
      @media(max-width:420px){#fxhBetaDock{left:10px;right:10px;justify-content:flex-end;bottom:72px}#fxhBetaDock .fxh-beta-pill{max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#fxhBetaDock button{padding:8px 10px}.fxh-beta-modal{padding:19px;border-radius:18px}.fxh-beta-modal h2{font-size:23px}}
      @media(display-mode:standalone){#fxhBetaDock .fxh-install{display:none}}
    `;
    document.head.appendChild(style);
  }

  function makeButton(text, cls, handler) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = cls || '';
    b.textContent = text;
    b.addEventListener('click', handler);
    return b;
  }

  function installApp() {
    if (isStandalone()) {
      alert('FXH CAM is already installed on this device.');
      return;
    }
    if (deferredInstallPrompt) {
      const p = deferredInstallPrompt;
      deferredInstallPrompt = null;
      p.prompt();
      p.userChoice.finally(updateDock);
      return;
    }
    if (isIOS()) {
      alert('To install FXH CAM on iPhone/iPad: open this page in Safari, tap Share, then choose “Add to Home Screen”.');
    } else {
      alert('To install FXH CAM: open your browser menu and choose “Install app” or “Add to Home screen”. If the option is not shown yet, make sure the site is using HTTPS.');
    }
  }

  function feedbackHref() {
    const subject = encodeURIComponent('FXH CAM Public Beta — Feedback');
    const body = encodeURIComponent('Hi Fitim,\n\nI tested FXH CAM Public Beta.\n\nWhat I liked:\n\nWhat could be improved:\n\nDevice / browser (optional):\n\nThanks!');
    return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
  }

  function openFeedback() {
    window.location.href = feedbackHref();
  }

  function closeModal() {
    const el = document.getElementById('fxhBetaModal');
    if (el) el.remove();
  }

  function openGallery() {
    closeModal();
    const btn = document.querySelector('button[aria-label="GALLERY"]');
    if (btn) {
      btn.click();
      return;
    }
    const candidates = Array.from(document.querySelectorAll('button'));
    const gallery = candidates.find((b) => /gallery/i.test((b.textContent || '').trim()));
    if (gallery) gallery.click();
  }

  function showInfoModal(force) {
    if (document.getElementById('fxhBetaModal')) return;
    if (!force) {
      try {
        if (localStorage.getItem(INSTALL_KEY)) return;
        localStorage.setItem(INSTALL_KEY, '1');
      } catch (_) {}
    }
    const wrap = document.createElement('div');
    wrap.id = 'fxhBetaModal';
    wrap.className = 'fxh-beta-backdrop';
    const box = document.createElement('div');
    box.className = 'fxh-beta-modal';
    box.innerHTML = `
      <div class="fxh-beta-kicker"><span class="fxh-beta-dot"></span> PUBLIC BETA · FREE</div>
      <h2>Shoot the moment. Keep the feeling.</h2>
      <p>Explore 35mm film, instant Polaroid-style photography and VHS-inspired video in one camera experience.</p>
      <div class="fxh-beta-note"><b>Free Public Beta until 31 December 2026.</b><br>The beta camera features will deactivate on 1 January 2027 as FXH CAM prepares to move to its permanent domain.</div>
      <p>Your photos and videos stay on <b>your device</b> in this beta. They are not uploaded to a cloud account. Gallery access will remain available after the beta ends so you can download your media.</p>
      <div class="fxh-feedback-card"><h3>Help us improve FXH CAM</h3><p>This is a testing release. Please share what worked, what didn’t, and what you would love to see next. Your feedback helps us build a better final version.</p></div>
    `;
    const actions = document.createElement('div');
    actions.className = 'fxh-beta-actions';
    actions.appendChild(makeButton(isStandalone() ? 'APP INSTALLED' : 'INSTALL FXH CAM', 'fxh-beta-primary', installApp));
    const feedback = document.createElement('a');
    feedback.className = 'fxh-beta-secondary';
    feedback.href = feedbackHref();
    feedback.textContent = 'SEND FEEDBACK';
    actions.appendChild(feedback);
    actions.appendChild(makeButton('CONTINUE TESTING', 'fxh-beta-ghost', closeModal));
    box.appendChild(actions);
    const small = document.createElement('small');
    small.textContent = 'Public Beta • app.fitimxharra.com • no cloud backup in this test version';
    box.appendChild(small);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
  }

  function showEndedModal() {
    stopCameraStreams();
    const old = document.getElementById('fxhBetaModal');
    if (old) old.remove();
    const wrap = document.createElement('div');
    wrap.id = 'fxhBetaModal';
    wrap.className = 'fxh-beta-backdrop';
    const box = document.createElement('div');
    box.className = 'fxh-beta-modal';
    box.innerHTML = `
      <div class="fxh-beta-kicker"><span class="fxh-beta-dot"></span> PUBLIC BETA ENDED</div>
      <h2>Thank you for testing FXH CAM.</h2>
      <p>The Public Beta ended on <b>31 December 2026</b>. Camera, Polaroid and VHS capture are no longer active in this test version.</p>
      <div class="fxh-beta-note"><b>Your media is still yours.</b><br>Gallery remains available on this device so you can open and download the photos or videos you created during the beta.</div>
      <p>The official FXH CAM will continue on its permanent domain. This screen can be updated with the new address when the final release is ready.</p>
    `;
    const actions = document.createElement('div');
    actions.className = 'fxh-beta-actions';
    actions.appendChild(makeButton('OPEN MY GALLERY', 'fxh-beta-primary', openGallery));
    const endedFeedback = document.createElement('a');
    endedFeedback.className = 'fxh-beta-secondary';
    endedFeedback.href = feedbackHref();
    endedFeedback.textContent = 'SEND FEEDBACK';
    actions.appendChild(endedFeedback);
    if (remoteStatus && remoteStatus.next_url) {
      const a = document.createElement('a');
      a.className = 'fxh-beta-secondary';
      a.href = remoteStatus.next_url;
      a.textContent = 'OPEN THE NEW FXH CAM';
      actions.appendChild(a);
    }
    actions.appendChild(makeButton('CLOSE', 'fxh-beta-ghost', closeModal));
    box.appendChild(actions);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
  }

  function updateDock() {
    const dock = document.getElementById('fxhBetaDock');
    if (!dock) return;
    const install = dock.querySelector('.fxh-install');
    if (install) {
      install.textContent = isStandalone() ? 'INSTALLED' : 'INSTALL APP';
      install.style.display = isStandalone() ? 'none' : '';
    }
  }

  function createDock() {
    if (document.getElementById('fxhBetaDock')) return;
    const dock = document.createElement('div');
    dock.id = 'fxhBetaDock';
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'fxh-beta-pill';
    pill.textContent = 'PUBLIC BETA · FREE UNTIL 31 DEC';
    pill.addEventListener('click', () => showInfoModal(true));
    dock.appendChild(pill);
    dock.appendChild(makeButton('FEEDBACK', 'fxh-feedback', openFeedback));
    dock.appendChild(makeButton('INSTALL APP', 'fxh-install', installApp));
    document.body.appendChild(dock);
    updateDock();

    const visibility = () => {
      const home = document.querySelector('.homeScreen');
      dock.style.display = home && !isBlocked() ? 'flex' : 'none';
    };
    visibility();
    new MutationObserver(visibility).observe(document.getElementById('root') || document.body, { childList: true, subtree: true, attributes: true });
  }

  function blockExpiredActions() {
    document.addEventListener('click', (event) => {
      if (!isBlocked()) return;
      const btn = event.target && event.target.closest ? event.target.closest('button') : null;
      if (!btn) return;
      const label = `${btn.getAttribute('aria-label') || ''} ${btn.textContent || ''}`.trim().toUpperCase();
      const blocked = label.includes('START SHOOTING') || label === '35MM' || label.includes('POLAROID') || label === 'VHS' || label.includes('SHUTTER') || label.includes('RECORD');
      if (!blocked) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      showEndedModal();
    }, true);
  }

  async function loadRemoteStatus() {
    try {
      const res = await fetch(`${STATUS_URL}?v=${Date.now()}`, { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return;
      remoteStatus = await res.json();
      if (isBlocked()) showEndedModal();
    } catch (_) {
      // Offline is allowed during the beta. The hard expiry date still applies.
    }
  }

  function initUI() {
    if (uiReady) return;
    uiReady = true;
    styles();
    createDock();
    if (isBlocked()) showEndedModal();
    else showInfoModal(false);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateDock();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateDock();
    closeModal();
  });

  patchCameraAccess();
  blockExpiredActions();
  loadRemoteStatus();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI, { once: true });
  } else {
    initUI();
  }

  setInterval(() => {
    if (isBlocked()) {
      stopCameraStreams();
      if (!document.getElementById('fxhBetaModal')) showEndedModal();
    }
  }, 60000);
})();
