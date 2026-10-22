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
  let inlineObserver = null;

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
    if (document.getElementById('fxh-beta-styles')) return;
    const style = document.createElement('style');
    style.id = 'fxh-beta-styles';
    style.textContent = `
      .fxh-beta-inline{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;margin:12px auto 2px;max-width:360px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;position:relative;z-index:2}
      .fxh-beta-inline .fxh-beta-label{font-size:9px;font-weight:900;letter-spacing:.09em;color:#d1a833;text-transform:uppercase;opacity:.86;white-space:nowrap}
      .fxh-beta-inline button{min-height:34px;border-radius:999px;padding:7px 13px;border:1px solid rgba(255,198,83,.38);background:rgba(5,7,6,.72);color:#f2eee1;font-size:10px;font-weight:900;letter-spacing:.055em;cursor:pointer;backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)}
      .fxh-beta-inline button.fxh-install{background:#ffc653;color:#17130a;border-color:#ffc653}
      .fxh-beta-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.80);display:grid;place-items:center;padding:20px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
      .fxh-beta-modal{width:min(430px,100%);max-height:calc(100% - 24px);overflow:auto;background:#0b100e;color:#f4f1e8;border:1px solid rgba(255,198,83,.42);border-radius:20px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.5);box-sizing:border-box}
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
      .fxh-feedback-stars{display:flex;justify-content:center;gap:7px;margin:16px 0 5px}
      .fxh-feedback-star{appearance:none;border:0;background:transparent!important;color:#59625f;font-size:37px;line-height:1;padding:2px;min-width:38px;min-height:42px;cursor:pointer;transition:transform .12s ease,color .12s ease}
      .fxh-feedback-star.is-active{color:#ffc653}
      .fxh-feedback-star:focus-visible{outline:2px solid #ffc653;outline-offset:3px;border-radius:8px}
      .fxh-feedback-rating-label{text-align:center;color:#b9c0bd;font-size:12px;min-height:18px;margin-bottom:12px}
      .fxh-feedback-textarea{width:100%;min-height:128px;resize:vertical;box-sizing:border-box;border-radius:13px;border:1px solid #2b3934;background:#0f1714;color:#f4f1e8;padding:13px 14px;font:inherit;font-size:14px;line-height:1.45;outline:none}
      .fxh-feedback-textarea:focus{border-color:#ffc653;box-shadow:0 0 0 2px rgba(255,198,83,.12)}
      .fxh-feedback-textarea::placeholder{color:#737e79}
      .fxh-feedback-submit[disabled]{opacity:.45;cursor:not-allowed}
      .fxh-feedback-email-note{margin-top:9px!important;text-align:center;font-size:11px!important;color:#87918d!important}
      @media(max-width:420px){.fxh-beta-modal{padding:19px;border-radius:18px}.fxh-beta-modal h2{font-size:23px}.fxh-feedback-star{font-size:34px;min-width:34px}.fxh-beta-inline{gap:7px;margin-top:10px}}
      @media(display-mode:standalone){.fxh-beta-inline .fxh-install{display:none}}
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
      p.userChoice.finally(mountInlineControls);
      return;
    }
    if (isIOS()) {
      alert('To install FXH CAM on iPhone/iPad: open this page in Safari, tap Share, then choose “Add to Home Screen”.');
    } else {
      alert('To install FXH CAM: open your browser menu and choose “Install app” or “Add to Home screen”. If the option is not shown yet, make sure the site is using HTTPS.');
    }
  }

  function closeModal() {
    const el = document.getElementById('fxhBetaModal');
    if (el) el.remove();
  }

  function openFeedback() {
    closeModal();
    const wrap = document.createElement('div');
    wrap.id = 'fxhBetaModal';
    wrap.className = 'fxh-beta-backdrop';
    const box = document.createElement('div');
    box.className = 'fxh-beta-modal';
    box.innerHTML = `
      <div class="fxh-beta-kicker"><span class="fxh-beta-dot"></span> PUBLIC BETA FEEDBACK</div>
      <h2>Rate your FXH CAM experience</h2>
      <p>Your feedback helps us improve the final version.</p>
    `;

    let rating = 0;
    const stars = document.createElement('div');
    stars.className = 'fxh-feedback-stars';
    stars.setAttribute('role', 'radiogroup');
    stars.setAttribute('aria-label', 'Rate FXH CAM from 1 to 5 stars');

    const ratingLabel = document.createElement('div');
    ratingLabel.className = 'fxh-feedback-rating-label';
    ratingLabel.textContent = 'Tap a star to rate';

    const textarea = document.createElement('textarea');
    textarea.className = 'fxh-feedback-textarea';
    textarea.placeholder = 'Tell us what you liked, what did not work, or what you would improve…';
    textarea.setAttribute('aria-label', 'Feedback comment');

    const actions = document.createElement('div');
    actions.className = 'fxh-beta-actions';
    const submit = makeButton('SUBMIT FEEDBACK', 'fxh-beta-primary fxh-feedback-submit', () => {
      if (!rating) return;
      const comment = textarea.value.trim();
      const subject = encodeURIComponent(`FXH CAM Public Beta — ${rating}/5 stars`);
      const body = encodeURIComponent(
        `Hi Fitim,\n\nI rated FXH CAM Public Beta ${rating}/5 stars.\n\nComment:\n${comment || '(No additional comment)'}\n\nDevice / browser:\n${navigator.userAgent}\n\nThanks!`
      );
      window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    });
    submit.disabled = true;

    function setRating(value) {
      rating = value;
      Array.from(stars.children).forEach((star, index) => {
        const active = index < rating;
        star.classList.toggle('is-active', active);
        star.textContent = active ? '★' : '☆';
        star.setAttribute('aria-checked', index + 1 === rating ? 'true' : 'false');
      });
      ratingLabel.textContent = `${rating} out of 5 stars`;
      submit.disabled = false;
    }

    for (let i = 1; i <= 5; i += 1) {
      const star = document.createElement('button');
      star.type = 'button';
      star.className = 'fxh-feedback-star';
      star.textContent = '☆';
      star.setAttribute('role', 'radio');
      star.setAttribute('aria-label', `${i} star${i === 1 ? '' : 's'}`);
      star.setAttribute('aria-checked', 'false');
      star.addEventListener('click', () => setRating(i));
      stars.appendChild(star);
    }

    actions.appendChild(submit);
    actions.appendChild(makeButton('CANCEL', 'fxh-beta-ghost', closeModal));
    box.appendChild(stars);
    box.appendChild(ratingLabel);
    box.appendChild(textarea);
    box.appendChild(actions);
    const note = document.createElement('p');
    note.className = 'fxh-feedback-email-note';
    note.textContent = 'Submit opens your email app and sends the feedback to fitim@xharra.com.';
    box.appendChild(note);
    wrap.appendChild(box);
    document.body.appendChild(wrap);
    setTimeout(() => stars.querySelector('button')?.focus(), 0);
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
      <div class="fxh-feedback-card"><h3>Help us improve FXH CAM</h3><p>Rate the beta and tell us what you would improve for the final release.</p></div>
    `;
    const actions = document.createElement('div');
    actions.className = 'fxh-beta-actions';
    actions.appendChild(makeButton(isStandalone() ? 'APP INSTALLED' : 'INSTALL FXH CAM', 'fxh-beta-primary', installApp));
    actions.appendChild(makeButton('RATE & COMMENT', 'fxh-beta-secondary', openFeedback));
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
    actions.appendChild(makeButton('RATE & COMMENT', 'fxh-beta-secondary', openFeedback));
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

  function mountInlineControls() {
    document.getElementById('fxhBetaDock')?.remove();
    const old = document.getElementById('fxhBetaInline');
    const home = document.querySelector('.homeScreen');
    if (!home || isBlocked()) {
      if (old) old.remove();
      return;
    }

    const target = home.querySelector('.analog-camera-info') || home.querySelector('.homeSharedIntro') || home;
    if (old && old.parentElement === target) {
      const install = old.querySelector('.fxh-install');
      if (install) install.style.display = isStandalone() ? 'none' : '';
      return;
    }
    if (old) old.remove();

    const row = document.createElement('div');
    row.id = 'fxhBetaInline';
    row.className = 'fxh-beta-inline';
    const label = document.createElement('span');
    label.className = 'fxh-beta-label';
    label.textContent = 'PUBLIC BETA · FREE UNTIL 31 DEC';
    row.appendChild(label);
    row.appendChild(makeButton('RATE BETA', 'fxh-feedback', openFeedback));
    if (!isStandalone()) row.appendChild(makeButton('INSTALL APP', 'fxh-install', installApp));
    target.appendChild(row);
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
    mountInlineControls();
    inlineObserver = new MutationObserver(mountInlineControls);
    inlineObserver.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    if (isBlocked()) showEndedModal();
    else showInfoModal(false);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    mountInlineControls();
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    mountInlineControls();
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
