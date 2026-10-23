(() => {
  const FILM_FILTERS = {
    normal: 'sepia(0.055) saturate(0.91) contrast(1.02) brightness(0.94)',
    negative: 'sepia(0.055) saturate(0.91) contrast(1.02) brightness(0.94)',
    gold: 'sepia(0.12) saturate(1.08) hue-rotate(-6deg) contrast(1.04) brightness(0.98)',
    agfa: 'sepia(0.08) saturate(1.24) hue-rotate(-8deg) contrast(1.08) brightness(0.97)',
    fuji: 'sepia(0.02) saturate(1.08) hue-rotate(-10deg) contrast(1.01) brightness(1.01)',
    cinestill: 'sepia(0.04) saturate(1.08) hue-rotate(8deg) contrast(1.1) brightness(0.95)',
    trix: 'grayscale(1) contrast(1.18) brightness(0.96)',
    portra800: 'sepia(0.04) saturate(1.02) hue-rotate(-8deg) contrast(1.03) brightness(0.99)',
    velvia: 'sepia(0.02) saturate(1.34) contrast(1.1) brightness(0.99)',
    ektachrome: 'sepia(0.04) saturate(0.88) hue-rotate(18deg) contrast(0.98) brightness(1.01)',
    redscale: 'sepia(0.38) saturate(1.25) hue-rotate(-22deg) contrast(1.06) brightness(0.95)',
    purple: 'sepia(0.18) saturate(1.42) hue-rotate(238deg) contrast(1.08) brightness(0.96)',
    turquoise: 'sepia(0.08) saturate(1.28) hue-rotate(145deg) contrast(1.04) brightness(0.98)'
  };

  const FILM_PATTERNS = [
    ['portra800', /portra\s*800/i],
    ['cinestill', /cine\s*still|cinestill/i],
    ['ektachrome', /ektachrome/i],
    ['redscale', /redscale/i],
    ['purple', /purple/i],
    ['turquoise', /turquoise/i],
    ['velvia', /velvia/i],
    ['trix', /tri\s*-?x|trix/i],
    ['gold', /gold/i],
    ['agfa', /agfa/i],
    ['fuji', /fuji/i],
    ['negative', /negative|normal/i]
  ];

  function inAnalogCameraScreen() {
    return !!document.querySelector('.phone.analog.cameraScreenActive .cameraV12Stage');
  }

  function detectFilmId() {
    const root = document.querySelector('.phone.analog.cameraScreenActive') || document.body;
    const text = (root.innerText || '').replace(/\s+/g, ' ');
    for (const [id, pattern] of FILM_PATTERNS) {
      if (pattern.test(text)) return id;
    }
    return 'normal';
  }

  function applyPreviewFilter() {
    const video = document.querySelector('.phone.analog.cameraScreenActive .cameraV12Stage video');
    if (!video) return;
    const filmId = detectFilmId();
    const filter = FILM_FILTERS[filmId] || FILM_FILTERS.normal;
    video.style.setProperty('filter', filter, 'important');
    video.dataset.fxhPreviewFilm = filmId;
  }

  function cleanupIfNeeded() {
    if (inAnalogCameraScreen()) return;
    document.querySelectorAll('.cameraV12Stage video[data-fxh-preview-film]').forEach((video) => {
      video.style.removeProperty('filter');
      delete video.dataset.fxhPreviewFilm;
    });
  }

  function tick() {
    applyPreviewFilter();
    cleanupIfNeeded();
  }

  window.addEventListener('load', () => {
    tick();
    setTimeout(tick, 500);
    setTimeout(tick, 1500);
  });

  const observer = new MutationObserver(() => {
    clearTimeout(window.__fxhPreviewTimer);
    window.__fxhPreviewTimer = setTimeout(tick, 80);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
