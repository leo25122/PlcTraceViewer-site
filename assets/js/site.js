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
