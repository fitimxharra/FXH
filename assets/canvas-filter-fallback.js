/* FXH CAM — canvas filter fallback.
   iPhone/iPad browsers (Safari and every other iOS browser) do not apply
   CanvasRenderingContext2D.filter, so the film look was missing from saved
   photos and recorded video there. Where the browser lacks it, this file adds
   the property and applies the same CSS filter functions by hand each time an
   image or video frame is drawn. Browsers that support it natively are left alone. */
(function () {
  'use strict';
  var proto = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
  if (!proto) return;

  var force = false;
  try { force = window.__fxhForceFilterFallback === true; } catch (_) {}

  var native = false;
  try {
    var probe = document.createElement('canvas').getContext('2d');
    native = !!probe && typeof probe.filter === 'string';
  } catch (_) {}
  if (native && !force) return;

  var originalDrawImage = proto.drawImage;
  var store = typeof WeakMap === 'function' ? new WeakMap() : null;
  var parsed = {};
  var scratch = null;

  // Per-context state: the current filter and the save()/restore() stack, because the
  // real property is part of the drawing state and is put back by restore().
  function stateOf(ctx) {
    var st = store ? store.get(ctx) : ctx.__fxhFilterState;
    if (!st) {
      st = { filter: 'none', stack: [] };
      if (store) store.set(ctx, st); else ctx.__fxhFilterState = st;
    }
    return st;
  }
  function getFilter(ctx) { return stateOf(ctx).filter; }

  try {
    Object.defineProperty(proto, 'filter', {
      configurable: true,
      enumerable: true,
      get: function () { return getFilter(this); },
      set: function (value) {
        stateOf(this).filter = typeof value === 'string' && value.trim() ? value.trim() : 'none';
      }
    });
  } catch (_) { return; }

  var originalSave = proto.save, originalRestore = proto.restore, originalReset = proto.reset;
  proto.save = function () {
    var st = stateOf(this);
    st.stack.push(st.filter);
    return originalSave.apply(this, arguments);
  };
  proto.restore = function () {
    var st = stateOf(this);
    if (st.stack.length) st.filter = st.stack.pop();
    return originalRestore.apply(this, arguments);
  };
  if (typeof originalReset === 'function') {
    proto.reset = function () {
      var st = stateOf(this);
      st.filter = 'none';
      st.stack.length = 0;
      return originalReset.apply(this, arguments);
    };
  }

  function multiply(a, b) {
    // a and b are 3x4 affine colour matrices (rows r,g,b; columns r,g,b,offset). Returns a∘b (b first).
    var out = new Array(12);
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        out[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c];
      }
      out[r * 4 + 3] = a[r * 4] * b[3] + a[r * 4 + 1] * b[7] + a[r * 4 + 2] * b[11] + a[r * 4 + 3];
    }
    return out;
  }

  function amount(text, fallback) {
    var n = parseFloat(text);
    if (!isFinite(n)) return fallback;
    return /%\s*$/.test(text) ? n / 100 : n;
  }

  function parse(filter) {
    if (parsed[filter]) return parsed[filter];
    var m = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
    var blur = 0;
    var re = /([a-z-]+)\(([^)]*)\)/gi, hit;
    while ((hit = re.exec(filter))) {
      var name = hit[1].toLowerCase(), arg = hit[2].trim(), a, s, f = null;
      if (name === 'brightness') {
        a = Math.max(0, amount(arg, 1));
        f = [a, 0, 0, 0, 0, a, 0, 0, 0, 0, a, 0];
      } else if (name === 'contrast') {
        a = Math.max(0, amount(arg, 1));
        var o = 127.5 * (1 - a);
        f = [a, 0, 0, o, 0, a, 0, o, 0, 0, a, o];
      } else if (name === 'saturate' || name === 'grayscale') {
        s = name === 'saturate' ? Math.max(0, amount(arg, 1)) : 1 - Math.min(1, Math.max(0, amount(arg, 1)));
        f = [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0,
             0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0,
             0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0];
      } else if (name === 'sepia') {
        s = 1 - Math.min(1, Math.max(0, amount(arg, 1)));
        f = [0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s, 0,
             0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s, 0,
             0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s, 0];
      } else if (name === 'hue-rotate') {
        var deg = parseFloat(arg) || 0;
        if (/rad\s*$/.test(arg)) deg = deg * 180 / Math.PI;
        else if (/turn\s*$/.test(arg)) deg = deg * 360;
        var c = Math.cos(deg * Math.PI / 180), n = Math.sin(deg * Math.PI / 180);
        f = [0.213 + c * 0.787 - n * 0.213, 0.715 - c * 0.715 - n * 0.715, 0.072 - c * 0.072 + n * 0.928, 0,
             0.213 - c * 0.213 + n * 0.143, 0.715 + c * 0.285 + n * 0.140, 0.072 - c * 0.072 - n * 0.283, 0,
             0.213 - c * 0.213 - n * 0.787, 0.715 - c * 0.715 + n * 0.715, 0.072 + c * 0.928 + n * 0.072, 0];
      } else if (name === 'invert') {
        a = Math.min(1, Math.max(0, amount(arg, 1)));
        f = [1 - 2 * a, 0, 0, 255 * a, 0, 1 - 2 * a, 0, 255 * a, 0, 0, 1 - 2 * a, 255 * a];
      } else if (name === 'blur') {
        blur += Math.max(0, parseFloat(arg) || 0);
      }
      if (f) m = multiply(f, m);
    }
    var identity = true;
    var id = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
    for (var i = 0; i < 12; i++) if (Math.abs(m[i] - id[i]) > 1e-4) { identity = false; break; }
    return (parsed[filter] = { matrix: identity ? null : m, blur: blur });
  }

  function canvasOf(holder, w, h) {
    if (!holder.c) {
      holder.c = document.createElement('canvas');
      holder.x = holder.c.getContext('2d', { willReadFrequently: true });
    }
    if (holder.c.width !== w || holder.c.height !== h) { holder.c.width = w; holder.c.height = h; }
    else holder.x.clearRect(0, 0, w, h);
    return holder;
  }

  proto.drawImage = function (source) {
    var filter = getFilter(this);
    if (filter === 'none') return originalDrawImage.apply(this, arguments);

    try {
      var spec = parse(filter);
      if (!spec.matrix && !spec.blur) return originalDrawImage.apply(this, arguments);

      var n = arguments.length;
      var iw = source.videoWidth || source.naturalWidth || source.width || 0;
      var ih = source.videoHeight || source.naturalHeight || source.height || 0;
      var sx = 0, sy = 0, sw = iw, sh = ih, dx, dy, dw, dh;
      if (n >= 9) {
        sx = arguments[1]; sy = arguments[2]; sw = arguments[3]; sh = arguments[4];
        dx = arguments[5]; dy = arguments[6]; dw = arguments[7]; dh = arguments[8];
      } else if (n >= 5) {
        dx = arguments[1]; dy = arguments[2]; dw = arguments[3]; dh = arguments[4];
      } else {
        dx = arguments[1]; dy = arguments[2]; dw = iw; dh = ih;
      }
      var w = Math.max(1, Math.round(Math.abs(dw))), h = Math.max(1, Math.round(Math.abs(dh)));
      if (!iw || !ih || !isFinite(w) || !isFinite(h) || w * h > 20000000) return originalDrawImage.apply(this, arguments);

      scratch = scratch || {};
      var t = canvasOf(scratch, w, h);
      t.x.imageSmoothingEnabled = true;
      try { t.x.imageSmoothingQuality = 'high'; } catch (_) {}
      originalDrawImage.call(t.x, source, sx, sy, sw, sh, 0, 0, w, h);

      if (spec.blur > 0.3) {
        // Approximate a gaussian blur: halve the picture step by step, then double it back.
        var k = Math.max(1, spec.blur * 1.5);
        var tw = Math.max(1, Math.round(w / k)), th = Math.max(1, Math.round(h / k));
        var cur = t.c, cw = w, ch = h, step, sx2;
        while (cw > tw || ch > th) {
          var nw = Math.max(tw, Math.ceil(cw / 2)), nh = Math.max(th, Math.ceil(ch / 2));
          step = document.createElement('canvas'); step.width = nw; step.height = nh;
          sx2 = step.getContext('2d'); sx2.imageSmoothingEnabled = true;
          originalDrawImage.call(sx2, cur, 0, 0, cw, ch, 0, 0, nw, nh);
          cur = step; cw = nw; ch = nh;
        }
        while (cw * 2 < w || ch * 2 < h) {
          var uw = Math.min(w, cw * 2), uh = Math.min(h, ch * 2);
          step = document.createElement('canvas'); step.width = uw; step.height = uh;
          sx2 = step.getContext('2d'); sx2.imageSmoothingEnabled = true;
          originalDrawImage.call(sx2, cur, 0, 0, cw, ch, 0, 0, uw, uh);
          cur = step; cw = uw; ch = uh;
        }
        if (cur !== t.c) {
          t.x.clearRect(0, 0, w, h);
          originalDrawImage.call(t.x, cur, 0, 0, cw, ch, 0, 0, w, h);
        }
      }

      if (spec.matrix) {
        var m = spec.matrix;
        var img = t.x.getImageData(0, 0, w, h), d = img.data;
        var m0 = m[0], m1 = m[1], m2 = m[2], m3 = m[3], m4 = m[4], m5 = m[5], m6 = m[6], m7 = m[7], m8 = m[8], m9 = m[9], m10 = m[10], m11 = m[11];
        for (var i = 0, len = d.length; i < len; i += 4) {
          var r = d[i], g = d[i + 1], bl = d[i + 2];
          // Uint8ClampedArray clamps and rounds for us.
          d[i]     = m0 * r + m1 * g + m2 * bl + m3;
          d[i + 1] = m4 * r + m5 * g + m6 * bl + m7;
          d[i + 2] = m8 * r + m9 * g + m10 * bl + m11;
        }
        t.x.putImageData(img, 0, 0);
      }

      return originalDrawImage.call(this, t.c, 0, 0, w, h, dx, dy, dw, dh);
    } catch (err) {
      // e.g. a tainted source: draw it unfiltered rather than not at all.
      return originalDrawImage.apply(this, arguments);
    }
  };

  try { window.__fxhFilterFallbackActive = true; } catch (_) {}
})();
