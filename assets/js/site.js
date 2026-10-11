/* PlcTraceViewer site: language switch, small-screen menu, image viewer,
   function list. No framework, no animation. */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  };

  /* ── language ─────────────────────────────────────────────────────────── */
  var META = {
    it: {
      title: 'PlcTraceViewer · registrazione e analisi di segnali per PLC S7',
      desc: 'Registratore e analizzatore di segnali per PLC S7-300, 400, 1200 e 1500. Acquisizione in un ' +
            'processo separato, ora di lettura reale per ogni campione, valori mancanti mai sostituiti con zero.'
    },
    en: {
      title: 'PlcTraceViewer · signal recording and analysis for S7 PLCs',
      desc: 'Signal recorder and analyser for S7-300, 400, 1200 and 1500 PLCs. Acquisition in a separate ' +
            'process, the real read time of every sample, missing values never replaced with zero.'
    }
  };

  function setLang(l, remember) {
    if (l !== 'it' && l !== 'en') l = 'it';
    document.documentElement.lang = l;
    // A page may carry its own title/description per language on <body>;
    // otherwise the home page's pair is used.
    var m = META[l] || {};
    var t = document.body.getAttribute('data-title-' + l) || m.title;
    var dsc = document.body.getAttribute('data-desc-' + l) || m.desc;
    if (t) document.title = t;
    var d = $('meta[name="description"]');
    if (d && dsc) d.setAttribute('content', dsc);
    $$('[data-lang-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang-btn') === l ? 'true' : 'false');
    });
    if (remember) store.set('ptv-lang', l);
  }

  $$('[data-lang-btn]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang-btn'), true); });
  });

  (function () {
    var saved = store.get('ptv-lang');
    if (saved !== 'it' && saved !== 'en') {
      var nav = (navigator.language || 'it').toLowerCase();
      saved = nav.indexOf('it') === 0 ? 'it' : 'en';
    }
    setLang(saved, false);
  })();

  /* ── small-screen menu ────────────────────────────────────────────────── */
  var menuBtn = $('[data-menu]'), menu = $('.menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── print ────────────────────────────────────────────────────────────── */
  $$('[data-print]').forEach(function (b) {
    b.addEventListener('click', function (e) { e.preventDefault(); window.print(); });
  });

  /* ── image viewer ─────────────────────────────────────────────────────── */
  (function () {
    var dlg = $('#lightbox');
    if (!dlg || !dlg.showModal) return;
    var img = $('img', dlg), cap = $('.cap', dlg);
    $$('[data-zoom]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        // the numbered call-outs on a screenshot have their own job: explain, not zoom
        if (e.target.closest('.pin, .pin-tip')) return;
        var src = el.getAttribute('data-zoom') || ($('img', el) && $('img', el).src);
        if (!src) return;
        img.src = src;
        img.alt = ($('img', el) && $('img', el).alt) || '';
        var fc = el.closest('figure') && $('figcaption', el.closest('figure'));
        if (cap) cap.innerHTML = fc ? fc.innerHTML : '';
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('x')) dlg.close(); });
  })();

  /* ── numbered call-outs ───────────────────────────────────────────────── */
  /// A number on a screenshot opens a note with the matching line of the legend below
  /// and marks that line; a line of the legend does the same for its number.
  (function () {
    var pins = $$('.pin[data-pin]');
    if (!pins.length) return;
    var tip = document.createElement('div');
    tip.className = 'pin-tip'; tip.setAttribute('role', 'note'); tip.hidden = true;
    var open = null;
    function close() {
      tip.hidden = true; open = null;
      pins.forEach(function (p) { p.classList.remove('on'); p.setAttribute('aria-expanded', 'false'); });
      $$('.legend li[data-n]').forEach(function (li) { li.classList.remove('on'); });
    }
    function show(n) {
      var pin = $('.pin[data-pin="' + n + '"]'), li = $('.legend li[data-n="' + n + '"]');
      if (!pin || !li) return;
      if (open === n) { close(); return; }
      close();
      var lang = document.documentElement.lang === 'en' ? 'en' : 'it';
      var txt = $('span[data-' + lang + ']', li) || $('span', li);
      tip.textContent = txt ? txt.textContent : '';
      pin.parentNode.appendChild(tip);
      var left = parseFloat(pin.style.left) || 0, top = parseFloat(pin.style.top) || 0;
      tip.classList.toggle('to-left', left > 55);
      tip.style.left = pin.style.left; tip.style.top = pin.style.top;
      tip.hidden = false; open = n;
      pin.classList.add('on'); pin.setAttribute('aria-expanded', 'true');
      li.classList.add('on');
    }
    pins.forEach(function (p) {
      p.setAttribute('aria-expanded', 'false');
      p.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); show(p.getAttribute('data-pin')); });
    });
    $$('.legend li[data-n]').forEach(function (li) {
      li.addEventListener('click', function () {
        var n = li.getAttribute('data-n');
        show(n);
        var pin = $('.pin[data-pin="' + n + '"]');
        if (open === n && pin && pin.getBoundingClientRect().top < 70) pin.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
    });
    tip.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    document.addEventListener('click', function (e) { if (open && !e.target.closest('.pin, .pin-tip, .legend li')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    $$('[data-lang-btn]').forEach(function (b) { b.addEventListener('click', close); });
  })();

  /* ── expression editor: typed examples with their curve ───────────────── */
  /// Four example expressions typed one after the other. Each time the expression changes the
  /// preview starts empty: the input signal (grey) is drawn from left to right while the
  /// expression is typed, as if it were being recorded, then the result (blue) is drawn over
  /// it. A dot marks the point being drawn. It only runs while it is on screen.
  (function () {
    var box = $('#fx-code'), cv = $('#fx-plot'), lbl = $('#fx-label');
    if (!box || !cv || !cv.getContext) return;
    // It runs even when Windows has its animation effects switched off: many plant PCs, virtual
    // machines and remote sessions do, and the owner wants the preview to move (11/10/2026).
    var ctx = cv.getContext('2d');

    function smooth(i, n) { return 0.5 + 0.33 * Math.sin(i / n * 7.4) + 0.08 * Math.sin(i / n * 21.5); }
    function speed(i, n) { return 0.5 + 0.3 * Math.sin(i / n * 30) * (0.55 + 0.45 * Math.sin(i / n * 5.1)); }
    function bit(i) { return ((i % 40) > 10 && (i % 40) < 34) ? 1 : 0; }
    function current(i, n) { return 0.5 + 0.36 * Math.sin(i / 1.6) * (1 - Math.exp(-i / (n * 0.22))); }

    var DEMOS = [
      { code: 'DIFF(LPF(Pressure, 8))', it: 'derivata di una pressione filtrata a 8 Hz', en: 'derivative of a pressure filtered at 8 Hz',
        raw: smooth, f: function (i, n) { return 0.5 + (smooth(i, n) - smooth(i - 3, n)) * 5.5; } },
      { code: 'P2P(AxisSpeed, 0.5)', it: 'picco-picco su una finestra di 0,5 s', en: 'peak-to-peak over a 0.5 s window',
        raw: speed, f: function (i, n) { return 0.2 + 0.57 * (0.55 + 0.45 * Math.sin(i / n * 5.1)); } },
      { code: 'TON(I.PR_Line, 0.25)', it: 'ritardo all’inserzione di 250 ms', en: 'a 250 ms on-delay',
        raw: function (i) { return bit(i) ? 0.62 : 0.2; }, f: function (i) { return (bit(i) && bit(i - 8)) ? 0.84 : 0.12; } },
      { code: 'RMSW(Current, 1)', it: 'valore efficace su 1 secondo', en: 'RMS value over 1 second',
        raw: current, f: function (i, n) { return 0.5 + 0.26 * (1 - Math.exp(-i / (n * 0.22))); } }
    ];

    var TYPE_MS = 45, RES_MS = 1500, HOLD_MS = 2600;
    var di = 0, shown = 0, w = 0, h = 0, visible = false, timer = 0, raf = 0;
    var tStart = 0, rawMs = 1000, resStart = 0, lastRaw = 1, lastRes = 1;

    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    function paint(txt, caret) {
      var out = '', re = /([A-Za-z_][\w.]*)(\()?|(\d+(?:\.\d+)?)|([^A-Za-z_\d]+)/g, m;
      while ((m = re.exec(txt))) {
        if (m[1] && m[2]) out += '<span class="f">' + esc(m[1]) + '</span>(';
        else if (m[1]) out += '<span class="s">' + esc(m[1]) + '</span>';
        else if (m[3]) out += '<span class="n">' + m[3] + '</span>';
        else out += esc(m[4]);
      }
      box.innerHTML = out + (caret ? '<span class="cur"></span>' : '');
    }
    function label() {
      var d = DEMOS[di];
      if (lbl) lbl.innerHTML = '<span data-it>' + d.it + '</span><span data-en>' + d.en + '</span>';
    }
    function size() {
      var dpr = Math.min(2, window.devicePixelRatio || 1), r = cv.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function css(n, fb) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim() || fb; }
    function clamp(v) { return Math.max(0, Math.min(1, v)); }

    /// One series up to fraction k of its length; returns the last point drawn.
    function series(fn, k, n, px, py, iw, ih, lo, hi) {
      var lim = Math.round(n * k), x = px, y = 0;
      ctx.beginPath();
      for (var i = 0; i <= lim; i++) {
        x = px + iw * i / n;
        y = py + ih - Math.max(lo, Math.min(hi, fn(i, n))) * ih;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.stroke();
      return { x: x, y: y };
    }
    function dot(p, color) {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    function draw(kRaw, kRes) {
      var d = DEMOS[di], n = 160, px = 16, py = 14, iw = w - px * 2, ih = h - py * 2;
      lastRaw = kRaw; lastRes = kRes;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#e9edf2'; ctx.lineWidth = 1; ctx.beginPath();
      for (var gy = 0; gy <= 4; gy++) { var y0 = Math.round(py + ih * gy / 4) + .5; ctx.moveTo(px, y0); ctx.lineTo(w - px, y0); }
      for (var gx = 0; gx <= 8; gx++) { var x0 = Math.round(px + iw * gx / 8) + .5; ctx.moveTo(x0, py); ctx.lineTo(x0, h - py); }
      ctx.stroke();
      ctx.lineJoin = 'round';
      if (kRaw > 0) {
        ctx.strokeStyle = '#a9b4c0'; ctx.lineWidth = 1.3;
        var pr = series(d.raw, kRaw, n, px, py, iw, ih, 0, 1);
        if (kRaw < 1) dot(pr, '#8795a5');
      }
      if (kRes > 0) {
        var blue = css('--azure', '#1e6fc7');
        ctx.strokeStyle = blue; ctx.lineWidth = 2.2;
        var pb = series(d.f, kRes, n, px, py, iw, ih, 0.02, 0.98);
        if (kRes < 1) dot(pb, blue);
      }
    }
    function loop() {
      var now = performance.now();
      var kRaw = clamp((now - tStart) / rawMs), kRes = clamp((now - resStart) / RES_MS);
      draw(kRaw, kRes);
      if (kRes < 1 && visible) raf = requestAnimationFrame(loop);
    }
    function start() {
      // a new expression: empty preview, its description, the input signal starts being drawn
      var d = DEMOS[di];
      shown = 0; label();
      tStart = performance.now();
      rawMs = Math.max(1100, (d.code.length + 1) * TYPE_MS + 200);
      resStart = tStart + rawMs + 120;
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
      type();
    }
    function type() {
      if (!visible) return;
      var d = DEMOS[di];
      if (shown <= d.code.length) { paint(d.code.slice(0, shown), true); shown++; timer = setTimeout(type, TYPE_MS); return; }
      var wait = Math.max(0, resStart + RES_MS - performance.now()) + HOLD_MS;
      timer = setTimeout(function () { di = (di + 1) % DEMOS.length; start(); }, wait);
    }

    size(); paint(DEMOS[0].code, false); label(); draw(1, 1);
    window.addEventListener('resize', function () { size(); draw(lastRaw, lastRes); });
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var was = visible;
        visible = e.isIntersecting && !document.hidden;
        if (visible && !was) { clearTimeout(timer); start(); }
        if (!visible) { clearTimeout(timer); cancelAnimationFrame(raf); }
      });
    }, { threshold: 0.3 }).observe(cv);
  })();

  /* ── function list ────────────────────────────────────────────────────── */
  (function () {
    var wall = $('#fnwall');
    if (!wall || !window.PTV_FUNCTIONS) return;
    var data = window.PTV_FUNCTIONS, cat = 'all', q = '';
    var cats = [];
    data.forEach(function (f) { if (cats.indexOf(f.c) < 0) cats.push(f.c); });
    // Family names as the Italian page shows them; the English ones come from the data.
    var CAT_IT = {
      'Math': 'Matematica', 'Trigonometry': 'Trigonometria', 'Logic': 'Logica',
      'Derivatives': 'Derivate e integrali', 'Filters': 'Filtri',
      'Windowed statistics': 'Statistiche su finestra', 'Global statistics': 'Statistiche globali',
      'Edges and timing': 'Fronti e temporizzazioni', 'Time and frequency': 'Tempo e frequenza',
      'Compatibility': 'Compatibilità'
    };
    var both = function (it, en) {
      return it === en ? en : '<span data-it>' + it + '</span><span data-en>' + en + '</span>';
    };

    var tools = $('#fnwall-tools');
    if (tools) {
      var mk = function (label, value) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip'; b.innerHTML = label; b.setAttribute('aria-pressed', value === 'all' ? 'true' : 'false');
        b.addEventListener('click', function () {
          cat = value;
          $$('.chip', tools).forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
          draw();
        });
        return b;
      };
      tools.insertBefore(mk(both('Tutte (' + data.length + ')', 'All (' + data.length + ')'), 'all'), tools.firstChild);
      cats.forEach(function (c) { tools.insertBefore(mk(both(CAT_IT[c] || c, c), c), $('#fnwall-search')); });
    }
    var input = $('#fnwall-q');
    if (input) input.addEventListener('input', function () { q = input.value.trim().toUpperCase(); draw(); });

    function draw() {
      var list = data.filter(function (f) {
        return (cat === 'all' || f.c === cat) &&
               (!q || f.n.indexOf(q) > -1 || f.d.toUpperCase().indexOf(q) > -1 ||
                (f.i || '').toUpperCase().indexOf(q) > -1);
      });
      if (!list.length) {
        wall.innerHTML = '<div class="fw-empty"><span data-it>Nessuna funzione con questo nome.</span>' +
                         '<span data-en>No function by that name.</span></div>';
        return;
      }
      wall.innerHTML = list.map(function (f) {
        return '<div class="fw-i"><b>' + f.s + '</b>' +
               (f.i ? both(f.i, f.d) : '<span>' + f.d + '</span>') + '</div>';
      }).join('');
    }
    draw();
  })();

  /* ── year ─────────────────────────────────────────────────────────────── */
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
