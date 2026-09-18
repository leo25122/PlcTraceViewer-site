/* ═══════════════════════════════════════════════════════════════════════════
   PlcTraceViewer — site behaviour
   ───────────────────────────────────────────────────────────────────────────
   No framework, no dependency. Every module is optional: if its markup is not
   on the page, it simply does nothing. Anything that moves checks
   prefers-reduced-motion first and stops when off-screen or in a hidden tab.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  };

  /* ── language ─────────────────────────────────────────────────────────── */
  var META = {
    it: {
      title: 'PlcTraceViewer — registra i segnali del tuo PLC Siemens, al millisecondo',
      desc: 'Registratore e analizzatore di segnali per PLC Siemens S7-300/400/1200/1500. ' +
            'Acquisizione in un processo dedicato, tempo reale di ogni campione, nessun dato inventato.'
    },
    en: {
      title: 'PlcTraceViewer — record your Siemens PLC signals, to the millisecond',
      desc: 'Signal recorder and analyser for Siemens S7-300/400/1200/1500 PLCs. ' +
            'Acquisition in a dedicated process, the real time of every sample, nothing invented.'
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
    window.dispatchEvent(new CustomEvent('ptv:lang', { detail: l }));
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

  /* ── theme ────────────────────────────────────────────────────────────── */
  function setTheme(t, remember) {
    document.documentElement.setAttribute('data-theme', t);
    var m = $('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#090c10' : '#f6f5f2');
    if (remember) store.set('ptv-theme', t);
  }
  (function () {
    var saved = store.get('ptv-theme');
    if (saved !== 'dark' && saved !== 'light') {
      saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    setTheme(saved, false);
  })();
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark', true);
    });
  });

  /* ── nav: stuck state, drawer, scroll-spy, progress fallback ──────────── */
  var nav = $('.nav');
  var bar = $('.progress');
  var hasScrollTimeline = CSS && CSS.supports && CSS.supports('animation-timeline', 'scroll()');

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    if (nav) nav.classList.toggle('stuck', y > 8);
    if (bar && !hasScrollTimeline) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var burger = $('[data-burger]'), drawer = $('.drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () {
        drawer.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  var spyLinks = $$('[data-spy] a');
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    spyLinks.forEach(function (a) {
      var id = a.getAttribute('href');
      if (id && id.charAt(0) === '#') { var el = $(id); if (el) map[id.slice(1)] = a; }
    });
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        spyLinks.forEach(function (a) { a.classList.remove('active'); });
        var a = map[e.target.id];
        if (a) a.classList.add('active');
      });
    }, { rootMargin: '-25% 0px -68% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ── reveal on scroll ─────────────────────────────────────────────────── */
  (function () {
    var items = $$('[data-r], .stagger, .draw');
    if (!items.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    $$('.draw').forEach(function (svg) {
      $$('path, line, circle, rect', svg).forEach(function (p) {
        var len = p.getTotalLength ? p.getTotalLength() : 600;
        p.style.setProperty('--len', Math.ceil(len) + '');
        p.style.strokeDasharray = Math.ceil(len);
        p.style.strokeDashoffset = Math.ceil(len);
      });
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ── number counters ──────────────────────────────────────────────────── */
  (function () {
    var els = $$('[data-count]');
    if (!els.length) return;
    if (REDUCED || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        var el = e.target;
        var raw = el.getAttribute('data-count');
        var dec = (raw.split('.')[1] || '').length;
        var to = parseFloat(raw), t0 = 0;
        function step(t) {
          if (!t0) t0 = t;
          var k = Math.min(1, (t - t0) / 1100);
          var v = to * (1 - Math.pow(1 - k, 3));
          el.textContent = dec ? v.toFixed(dec).replace('.', ',') : Math.round(v).toLocaleString('it-IT');
          if (k < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ── canvas helper: DPR sizing + run only when visible ─────────────────── */
  /// A canvas that draws only when it is worth it: capped pixel ratio, capped frame
  /// rate, stopped when off-screen or in a hidden tab. Four of these run on the page,
  /// and at full speed on a high-DPI monitor they were the reason scrolling stuttered.
  function liveCanvas(cv, draw, fps) {
    var ctx = cv.getContext('2d', { alpha: true, desynchronized: true });
    var w = 0, h = 0, run = false, raf = 0, last = 0;
    var minDelta = 1000 / (fps || 30);
    function size() {
      var dpr = Math.min(1.5, window.devicePixelRatio || 1);
      var r = cv.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function frame(t) {
      if (!run) return;
      t = t || 0;
      if (t - last >= minDelta) { last = t; draw(ctx, w, h, t); }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (run) return; run = true; raf = requestAnimationFrame(frame); }
    function stop() { run = false; cancelAnimationFrame(raf); }
    size();
    window.addEventListener('resize', function () { size(); if (!run) draw(ctx, w, h, performance.now()); });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting && !document.hidden ? start() : stop(); });
      }, { threshold: 0.05 }).observe(cv);
    } else start();
    if (REDUCED) { stop(); draw(ctx, w, h, 1200); }
    return { redraw: function () { draw(ctx, w, h, performance.now()); } };
  }

  function cssVar(n, fb) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    return v || fb;
  }

  /* ── hero: the scope ──────────────────────────────────────────────────── */
  (function () {
    var cv = $('#scope');
    if (!cv) return;

    // Five traces that behave like real plant signals: a pulse train, a saw
    // (axis position), a noisy analog, a staircase counter and a smooth speed.
    var T = [
      { c: '--c4', f: function (t) { return (t % 1.6) < 0.55 ? 1 : 0; }, step: true },
      { c: '--c5', f: function (t) { return (t % 2.4) / 2.4; } },
      { c: '--c2', f: function (t) { return 0.5 + 0.34 * Math.sin(t * 1.9) + 0.06 * Math.sin(t * 11.3) + 0.03 * Math.sin(t * 27.1); } },
      { c: '--c1', f: function (t) { return Math.min(1, (Math.floor(t * 1.4) % 7) / 6); }, step: true },
      { c: '--c3', f: function (t) { return 0.5 + 0.4 * Math.sin(t * 0.8 + 1.1) * Math.cos(t * 0.31); } }
    ];
    var SPAN = 6.2;             // seconds visible
    var t0 = performance.now() / 1000;

    liveCanvas(cv, function (ctx, w, h, ms) {
      var now = REDUCED ? 12 : (ms / 1000 - t0);
      ctx.clearRect(0, 0, w, h);

      var line = cssVar('--panel-line', '#1e2732');
      ctx.strokeStyle = line; ctx.lineWidth = 1;
      ctx.beginPath();
      for (var gx = 0; gx <= w; gx += 56) { ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, h); }
      for (var gy = 0; gy <= h; gy += 40) { ctx.moveTo(0, gy + .5); ctx.lineTo(w, gy + .5); }
      ctx.stroke();

      var padL = 8, padR = 16, padT = 12, padB = 12;
      var iw = w - padL - padR, ih = h - padT - padB;
      var lane = ih / T.length;

      T.forEach(function (tr, i) {
        var col = cssVar(tr.c, '#4da3ff');
        var top = padT + i * lane + 4, hh = lane - 12;
        ctx.strokeStyle = col; ctx.lineWidth = 1.6;
        ctx.shadowColor = col; ctx.shadowBlur = 7; ctx.globalAlpha = .95;
        ctx.beginPath();
        var N = Math.max(60, Math.round(iw / 2));
        for (var k = 0; k <= N; k++) {
          var x = padL + iw * k / N;
          var tt = now - SPAN * (1 - k / N);
          var v = Math.max(0, Math.min(1, tr.f(tt)));
          var y = top + hh - v * hh;
          if (k === 0) ctx.moveTo(x, y);
          else if (tr.step) { ctx.lineTo(x, ctx._ly === undefined ? y : ctx._ly); ctx.lineTo(x, y); }
          else ctx.lineTo(x, y);
          ctx._ly = y;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        // head dot
        var vEnd = Math.max(0, Math.min(1, tr.f(now)));
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(padL + iw, top + hh - vEnd * hh, 2.6, 0, 6.3); ctx.fill();
      });

      // "now" edge
      var g = ctx.createLinearGradient(w - 90, 0, w, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.05)');
      ctx.fillStyle = g; ctx.fillRect(w - 90, 0, 90, h);
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(w - padR + .5, 0); ctx.lineTo(w - padR + .5, h); ctx.stroke();
    }, 30);

    // the little readout under the scope: a sample counter that advances at 1 kHz
    var cnt = $('#scope-samples');
    if (cnt && !REDUCED) {
      var base = 0, last = performance.now();
      setInterval(function () {
        var n = performance.now();
        base += Math.round(n - last); last = n;
        cnt.textContent = base.toLocaleString('it-IT');
      }, 120);
    } else if (cnt) cnt.textContent = '65.466';
  })();

  /* ── the two lanes: window process vs acquisition process ─────────────── */
  (function () {
    $$('[data-lane]').forEach(function (cv) {
      var jittery = cv.getAttribute('data-lane') === 'window';
      var seed = 1;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var pts = [], t = 0;
      // 1 ms nominal; the window lane picks up occasional long pauses (what a
      // garbage collection does to a process that is also drawing).
      for (var i = 0; i < 240; i++) {
        var d = 1;
        if (jittery) {
          d = 1 + rnd() * 2.2;
          if (i % 37 === 0) d += 12 + rnd() * 16;
        } else {
          d = 0.97 + rnd() * 0.09;
        }
        t += d; pts.push({ t: t, d: d });
      }
      var total = t;
      liveCanvas(cv, function (ctx, w, h, ms) {
        ctx.clearRect(0, 0, w, h);
        var prog = REDUCED ? 1 : Math.min(1, ((ms / 1000) % 7) / 4.6);
        var mid = h / 2;
        ctx.strokeStyle = cssVar('--panel-line', '#1e2732');
        ctx.beginPath(); ctx.moveTo(0, mid + .5); ctx.lineTo(w, mid + .5); ctx.stroke();
        var col = jittery ? cssVar('--live', '#ff5a5f') : cssVar('--brand', '#33c9ab');
        pts.forEach(function (p) {
          var x = (p.t / total) * (w - 16) + 8;
          if (p.t / total > prog) return;
          var late = Math.min(1, (p.d - 1) / 14);
          var hgt = 6 + late * (h / 2 - 10);
          ctx.strokeStyle = col;
          ctx.globalAlpha = late > 0.02 ? 1 : .8;
          ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(x, mid - hgt); ctx.lineTo(x, mid + hgt); ctx.stroke();
        });
        ctx.globalAlpha = 1;
      }, 24);
    });
  })();

  /* ── formula editor demo ──────────────────────────────────────────────── */
  (function () {
    var box = $('#fx-code'), cv = $('#fx-plot'), lbl = $('#fx-label');
    if (!box || !cv) return;

    var DEMOS = [
      { code: 'DIFF(LPF(Pressure, 8))', it: 'derivata di una pressione filtrata a 8 Hz', en: 'derivative of a pressure low-passed at 8 Hz',
        f: function (x, i, n) { var s = smooth(i, n); return 0.5 + (s - smooth(i - 3, n)) * 5.5; } },
      { code: 'P2P(AxisSpeed, 0.5)', it: 'picco-picco su una finestra di 0,5 s', en: 'peak-to-peak over a 0.5 s window',
        f: function (x, i, n) { return 0.28 + 0.34 * Math.abs(Math.sin(i / n * 5.1)) + 0.05 * Math.sin(i / 3); } },
      { code: 'TON(I.PR_Line, 0.25)', it: 'ritardo all\'inserzione di 250 ms', en: 'a 250 ms on-delay',
        f: function (x, i, n) { return ((i % 40) > 16 && (i % 40) < 34) ? 0.8 : 0.16; } },
      { code: 'RMSW(Current, 1)', it: 'valore efficace su 1 secondo', en: 'RMS value over 1 second',
        f: function (x, i, n) { return 0.3 + 0.4 * (1 - Math.exp(-i / (n * 0.22))) + 0.03 * Math.sin(i / 2.2); } }
    ];
    function smooth(i, n) { return 0.5 + 0.33 * Math.sin(i / n * 7.4) + 0.08 * Math.sin(i / n * 21.5); }

    var di = 0, shown = 0, phase = 'type', t0 = performance.now();

    function paintCode(txt, caret) {
      var html = txt
        .replace(/([A-Z][A-Z0-9]*)\(/g, '<span class="fn">$1</span>(')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="num">$1</span>');
      box.innerHTML = html + (caret ? '<span class="cur"></span>' : '');
    }

    var plot = liveCanvas(cv, function (ctx, w, h, ms) {
      var d = DEMOS[di];
      // Once the curve is complete there is nothing to animate: redraw once and stop
      // burning frames behind a static picture.
      var done = !REDUCED && (ms - t0 - 700) > 1400;
      if (done && ctx._settled === di) return;
      ctx._settled = done ? di : -1;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = cssVar('--line', '#e3e0d9'); ctx.lineWidth = 1;
      ctx.beginPath();
      for (var gy = 0; gy <= h; gy += h / 4) { ctx.moveTo(0, gy + .5); ctx.lineTo(w, gy + .5); }
      for (var gx = 0; gx <= w; gx += w / 8) { ctx.moveTo(gx + .5, 0); ctx.lineTo(gx + .5, h); }
      ctx.stroke();

      var n = 150, pad = 12, iw = w - pad * 2, ih = h - pad * 2;
      var k = REDUCED ? 1 : Math.min(1, Math.max(0, (ms - t0 - 700) / 1400));

      // raw signal, faint
      ctx.strokeStyle = cssVar('--muted', '#6d7680'); ctx.globalAlpha = .28; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var i = 0; i <= n; i++) {
        var y = pad + ih - smooth(i, n) * ih;
        i ? ctx.lineTo(pad + iw * i / n, y) : ctx.moveTo(pad, y);
      }
      ctx.stroke(); ctx.globalAlpha = 1;

      // result
      ctx.strokeStyle = cssVar('--brand', '#0b5c52'); ctx.lineWidth = 2;
      ctx.beginPath();
      var lim = Math.round(n * k);
      for (var j = 0; j <= lim; j++) {
        var v = Math.max(0.02, Math.min(.98, d.f(0, j, n)));
        var yy = pad + ih - v * ih;
        j ? ctx.lineTo(pad + iw * j / n, yy) : ctx.moveTo(pad, yy);
      }
      ctx.stroke();
    });

    function tick() {
      var d = DEMOS[di], now = performance.now();
      if (phase === 'type') {
        if (shown <= d.code.length) { paintCode(d.code.slice(0, shown), true); shown++; setTimeout(tick, 42); }
        else { phase = 'hold'; t0 = now; setLabel(); setTimeout(tick, 2600); }
      } else {
        di = (di + 1) % DEMOS.length; shown = 0; phase = 'type'; t0 = now;
        setTimeout(tick, 220);
      }
    }
    function setLabel() {
      if (!lbl) return;
      var d = DEMOS[di];
      lbl.innerHTML = '<span data-it>' + d.it + '</span><span data-en>' + d.en + '</span>';
    }
    if (REDUCED) { paintCode(DEMOS[0].code, false); setLabel(); }
    else setTimeout(tick, 600);
  })();

  /* ── terminal typewriter ──────────────────────────────────────────────── */
  (function () {
    var t = $('#term-body');
    if (!t) return;
    var LINES = t.getAttribute('data-lines');
    if (!LINES) return;
    var rows = JSON.parse(LINES);
    function render(upto, partial) {
      var out = '';
      for (var i = 0; i < upto; i++) out += '<div>' + rows[i] + '</div>';
      if (partial !== null && partial !== undefined) out += '<div>' + partial + '<span class="cur"></span></div>';
      t.innerHTML = out;
    }
    if (REDUCED || !('IntersectionObserver' in window)) { render(rows.length, null); return; }
    var started = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting || started) return;
        started = true;
        var i = 0, c = 0;
        (function step() {
          if (i >= rows.length) { render(rows.length, null); return; }
          var plain = rows[i].replace(/<[^>]*>/g, '');
          if (c <= plain.length) {
            // keep the markup: type the plain text, then swap in the styled row
            render(i, plain.slice(0, c));
            c++; setTimeout(step, 9);
          } else { i++; c = 0; render(i, ''); setTimeout(step, 190); }
        })();
      });
    }, { threshold: 0.3 }).observe(t);
  })();

  /* ── sticky showcase ──────────────────────────────────────────────────── */
  (function () {
    var wrap = $('[data-showcase]');
    if (!wrap) return;
    var steps = $$('.sc-step', wrap), imgs = $$('.frame img', wrap);
    if (!steps.length || !imgs.length) return;
    function show(i) {
      steps.forEach(function (s, k) { s.classList.toggle('on', k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle('on', k === i); });
    }
    show(0);
    if (!('IntersectionObserver' in window)) { steps.forEach(function (s) { s.classList.add('on'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) show(steps.indexOf(e.target));
      });
    }, { rootMargin: '-42% 0px -42% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  })();

  /* ── lightbox ─────────────────────────────────────────────────────────── */
  (function () {
    var dlg = $('#lightbox');
    if (!dlg || !dlg.showModal) return;
    var img = $('img', dlg), cap = $('.cap', dlg);
    $$('[data-zoom]').forEach(function (el) {
      el.addEventListener('click', function () {
        var src = el.getAttribute('data-zoom') || ($('img', el) && $('img', el).src);
        if (!src) return;
        img.src = src;
        img.alt = ($('img', el) && $('img', el).alt) || '';
        if (cap) cap.textContent = img.alt;
        dlg.showModal();
      });
    });
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.classList.contains('x')) dlg.close(); });
  })();

  /* ── function wall ────────────────────────────────────────────────────── */
  (function () {
    var wall = $('#fnwall');
    if (!wall || !window.PTV_FUNCTIONS) return;
    var data = window.PTV_FUNCTIONS, cat = 'all', q = '';
    var cats = [];
    data.forEach(function (f) { if (cats.indexOf(f.c) < 0) cats.push(f.c); });

    var tools = $('#fnwall-tools');
    if (tools) {
      var mk = function (label, value) {
        var b = document.createElement('button');
        b.className = 'chip'; b.textContent = label; b.setAttribute('aria-pressed', value === 'all' ? 'true' : 'false');
        b.addEventListener('click', function () {
          cat = value;
          $$('.chip', tools).forEach(function (c) { c.setAttribute('aria-pressed', c === b ? 'true' : 'false'); });
          draw();
        });
        return b;
      };
      tools.insertBefore(mk('' + data.length, 'all'), tools.firstChild);
      cats.forEach(function (c) { tools.insertBefore(mk(c, c), $('#fnwall-search')); });
    }
    var input = $('#fnwall-q');
    if (input) input.addEventListener('input', function () { q = input.value.trim().toUpperCase(); draw(); });

    function draw() {
      var list = data.filter(function (f) {
        return (cat === 'all' || f.c === cat) &&
               (!q || f.n.indexOf(q) > -1 || f.d.toUpperCase().indexOf(q) > -1);
      });
      if (!list.length) {
        wall.innerHTML = '<div class="fw-empty"><span data-it>Nessuna funzione con questo nome.</span>' +
                         '<span data-en>No function by that name.</span></div>';
        return;
      }
      wall.innerHTML = list.map(function (f) {
        return '<div class="fw-i"><b>' + f.s + '</b><span>' + f.d + '</span></div>';
      }).join('');
    }
    draw();
    var n = $('#fnwall-count');
    if (n) n.textContent = data.length;
  })();

  /* ── magnetic buttons (pointer only) ──────────────────────────────────── */
  (function () {
    if (REDUCED || !window.matchMedia || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    $$('.btn, .btn-2').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        b.style.transform = 'translate(' + (dx * 5).toFixed(2) + 'px,' + (dy * 4).toFixed(2) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  })();

  /* ── parallax on the full-bleed bands ─────────────────────────────────── */
  (function () {
    var bands = $$('.band');
    if (!bands.length || REDUCED) return;
    var ticking = false;
    function place() {
      ticking = false;
      var vh = window.innerHeight;
      bands.forEach(function (b) {
        var r = b.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var k = (r.top + r.height / 2 - vh / 2) / vh;   // -1 … 1 across the screen
        var img = $('img', b);
        if (img) img.style.setProperty('--py', (k * 34).toFixed(1) + 'px');
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(place); }
    }, { passive: true });
    window.addEventListener('resize', place);
    place();
  })();

  /* ── safety net: nothing may stay invisible ───────────────────────────── */
  setTimeout(function () {
    $$('[data-r]:not(.in), .stagger:not(.in)').forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 1.5) el.classList.add('in');
    });
  }, 2500);

  /* ── year ─────────────────────────────────────────────────────────────── */
  $$('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
