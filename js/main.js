/* Sebastian Strus — portfolio interactions (no dependencies) */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* ---------------------------------------------------------------------
     Languages
     Texts live in js/i18n/en.js, sv.js and pl.js. English is the default.
     --------------------------------------------------------------------- */
  var LANGS = ['en', 'sv', 'pl'];
  var dict = window.I18N || {};
  var current = 'en';

  function storedLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (LANGS.indexOf(q) > -1) return q;
      var s = localStorage.getItem('lang');
      if (LANGS.indexOf(s) > -1) return s;
    } catch (e) {}
    return 'en';
  }

  function tr(key) {
    var d = dict[current] || {};
    return key in d ? d[key] : (dict.en && dict.en[key]) || '';
  }

  function splitWords(el) {
    var text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(/\s+/).map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' +
        w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span></span>';
    }).join(' ');
  }

  function applyLang(lang) {
    current = lang;
    doc.lang = lang;
    $$('[data-i18n]').forEach(function (el) {
      var v = tr(el.getAttribute('data-i18n'));
      if (v) el.textContent = v;
    });
    $$('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var p = pair.split(':');
        var v = tr(p[1]);
        if (v) el.setAttribute(p[0], v);
      });
    });
    document.title = tr('meta.title');
    var md = $('meta[name="description"]');
    if (md) md.setAttribute('content', tr('meta.description'));
    $$('[data-split], [data-split-scroll]').forEach(splitWords);
    $$('.lang-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    syncMenuLabel();
    window.dispatchEvent(new Event('resize'));
  }

  function setLang(lang, animate) {
    if (LANGS.indexOf(lang) < 0 || lang === current) return;
    try { localStorage.setItem('lang', lang); } catch (e) {}
    try {
      var url = new URL(location.href);
      if (lang === 'en') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
      history.replaceState(null, '', url);
    } catch (e) {}
    if (!animate || reduceMotion.matches) { applyLang(lang); return; }
    doc.classList.add('i18n-swap', 'i18n-out');
    setTimeout(function () {
      applyLang(lang);
      // titles re-run their reveal in the new language
      $$('.hero-title .w > span').forEach(function (s) { s.style.animationDelay = 'calc(var(--i) * 40ms)'; });
      doc.classList.remove('i18n-out');
      setTimeout(function () { doc.classList.remove('i18n-swap'); }, 220);
    }, 180);
  }

  $$('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });

  /* ---------------------------------------------------------------------
     Header, mobile menu, scroll progress, current section
     --------------------------------------------------------------------- */
  var header = $('.site-header');
  var toggle = $('.menu-toggle');
  var menu = $('#menu');

  function syncMenuLabel() {
    if (!toggle) return;
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-label', tr(open ? 'a11y.menuClose' : 'a11y.menu'));
  }
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
    } else {
      menu.classList.remove('is-open');
      setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 360);
    }
    syncMenuLabel();
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });

  var navLinks = $$('.nav a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  var lastY = window.scrollY;

  function onScrollChrome(y, vh) {
    var max = doc.scrollHeight - vh;
    doc.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    header.classList.toggle('is-scrolled', y > 24);
    // hide on scroll down, show on scroll up (never while the menu is open)
    var down = y > lastY + 4, up = y < lastY - 4;
    if (document.body.classList.contains('menu-open') || y < 200) header.classList.remove('is-hidden');
    else if (down) header.classList.add('is-hidden');
    else if (up) header.classList.remove('is-hidden');
    lastY = y;

    var mid = y + vh * 0.4, cur = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= mid) cur = i; });
    navLinks.forEach(function (a, i) {
      if (i === cur) a.classList.add('is-current'); else a.classList.remove('is-current');
    });
  }

  /* ---------------------------------------------------------------------
     Platforms: one frame morphs through six Apple screens while scrolling
     [aspect ratio, share of stage height, corner radius, bezel]
     --------------------------------------------------------------------- */
  var PLATFORMS = [
    { id: 'watch', a: 0.84, h: 0.40, r: 0.27, b: 0.050, ring: 0.72 },
    { id: 'ios',   a: 0.485, h: 0.84, r: 0.150, b: 0.030, ring: 0.45 },
    { id: 'ipad',  a: 1.36, h: 0.74, r: 0.050, b: 0.026, ring: 0.60 },
    { id: 'mac',   a: 1.56, h: 0.70, r: 0.028, b: 0.016, ring: 0.30 },
    { id: 'car',   a: 2.45, h: 0.42, r: 0.090, b: 0.030, ring: 0.82 },
    { id: 'tv',    a: 1.78, h: 0.74, r: 0.012, b: 0.010, ring: 0.52 }
  ];
  var pScroll = $('.platforms-scroll');
  var pArea = $('.device-area');
  var device = $('.device');
  var pItems = $$('.platform');
  var areaW = 0, areaH = 0, pTop = 0, pLen = 1, activeP = -1;

  function boxFor(p) {
    var h = p.h * areaH, w = h * p.a;
    var maxW = areaW * 0.96;
    if (w > maxW) { w = maxW; h = w / p.a; }
    var m = Math.min(w, h);
    return { w: w, h: h, r: p.r * m, b: Math.max(5, p.b * m) };
  }
  function measurePlatforms() {
    var r = pArea.getBoundingClientRect();
    areaW = r.width; areaH = r.height;
    pTop = pScroll.getBoundingClientRect().top + window.scrollY;
    pLen = Math.max(1, pScroll.offsetHeight - window.innerHeight);
  }
  function updatePlatforms(y) {
    var prog = clamp((y - pTop) / pLen, 0, 1) * (PLATFORMS.length - 1);
    var i = Math.min(PLATFORMS.length - 2, Math.floor(prog));
    var f = prog - i;
    var t = clamp((f - 0.28) / 0.44, 0, 1);
    t = t * t * (3 - 2 * t);
    var A = boxFor(PLATFORMS[i]), B = boxFor(PLATFORMS[i + 1]);
    var w = lerp(A.w, B.w, t), h = lerp(A.h, B.h, t), rad = lerp(A.r, B.r, t), bez = lerp(A.b, B.b, t);
    var s = device.style;
    s.width = w.toFixed(1) + 'px';
    s.height = h.toFixed(1) + 'px';
    s.borderRadius = rad.toFixed(1) + 'px';
    s.setProperty('--bezel-w', bez.toFixed(1) + 'px');
    s.setProperty('--screen-r', Math.max(2, rad - bez).toFixed(1) + 'px');
    s.setProperty('--ui-o', clamp(Math.abs(1 - 2 * t) * 2.4 - 0.2, 0, 1).toFixed(3));
    var idx = t < 0.5 ? i : i + 1;
    var standA = (PLATFORMS[i].id === 'mac' || PLATFORMS[i].id === 'tv') ? 1 : 0;
    var standB = (PLATFORMS[i + 1].id === 'mac' || PLATFORMS[i + 1].id === 'tv') ? 1 : 0;
    s.setProperty('--stand', lerp(standA, standB, t).toFixed(3));
    s.setProperty('--ring', lerp(PLATFORMS[i].ring, PLATFORMS[i + 1].ring, t).toFixed(3));
    if (idx !== activeP) {
      activeP = idx;
      device.setAttribute('data-platform', PLATFORMS[idx].id);
      pItems.forEach(function (li, n) { li.classList.toggle('is-active', n === idx); });
    }
  }
  // clicking a platform name scrolls to it
  pItems.forEach(function (li, n) {
    li.addEventListener('click', function () {
      window.scrollTo({ top: pTop + pLen * (n / (PLATFORMS.length - 1)), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    });
  });

  /* ---------------------------------------------------------------------
     Client work: accordion rows + image that follows the pointer
     --------------------------------------------------------------------- */
  var workItems = $$('.work-item');
  workItems.forEach(function (item) {
    var row = $('.work-row', item);
    row.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      workItems.forEach(function (other) {
        other.classList.remove('is-open');
        $('.work-row', other).setAttribute('aria-expanded', 'false');
      });
      if (open) { item.classList.add('is-open'); row.setAttribute('aria-expanded', 'true'); }
      hidePreview();
      setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 600);
    });
  });

  var preview = $('.work-preview');
  var previewImg = $('img', preview);
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  var px = 0, py = 0, tx = 0, ty = 0, rot = 0, previewOn = false, previewRaf = 0;

  function hidePreview() { previewOn = false; preview.classList.remove('is-on'); }
  function previewLoop() {
    var dx = tx - px, dy = ty - py;
    px += dx * 0.16; py += dy * 0.16;
    rot = lerp(rot, clamp(dx * 0.06, -7, 7), 0.12);
    preview.style.setProperty('--x', px.toFixed(1) + 'px');
    preview.style.setProperty('--y', py.toFixed(1) + 'px');
    preview.style.setProperty('--r', rot.toFixed(2) + 'deg');
    if (previewOn || Math.abs(dx) + Math.abs(dy) > 0.5) previewRaf = requestAnimationFrame(previewLoop);
    else previewRaf = 0;
  }
  $$('.work-row').forEach(function (row) {
    row.addEventListener('pointerenter', function (e) {
      if (!finePointer.matches || row.getAttribute('aria-expanded') === 'true') return;
      previewImg.src = row.getAttribute('data-img');
      tx = e.clientX + 28; ty = e.clientY - 70;
      if (!previewOn) { px = tx; py = ty; }
      previewOn = true;
      preview.classList.add('is-on');
      if (!previewRaf) previewRaf = requestAnimationFrame(previewLoop);
    });
    row.addEventListener('pointermove', function (e) {
      tx = Math.min(e.clientX + 28, window.innerWidth - 250); ty = e.clientY - 70;
    });
    row.addEventListener('pointerleave', hidePreview);
  });

  /* ---------------------------------------------------------------------
     Own apps: vertical scroll drives a horizontal gallery on desktop;
     touch devices get a native swipe carousel instead
     --------------------------------------------------------------------- */
  var apps = $('.apps');
  var track = $('.apps-track');
  var pinQuery = window.matchMedia('(min-width: 960px) and (min-height: 620px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  var appsTop = 0, appsTravel = 0, pinned = false;

  function measureApps() {
    pinned = pinQuery.matches;
    apps.classList.toggle('is-pinned', pinned);
    if (!pinned) { apps.style.height = ''; track.style.removeProperty('--tx'); return; }
    apps.style.height = '';
    appsTravel = Math.max(0, track.scrollWidth - window.innerWidth);
    apps.style.height = (window.innerHeight + appsTravel) + 'px';
    appsTop = apps.getBoundingClientRect().top + window.scrollY;
  }
  function updateApps(y) {
    if (!pinned) return;
    var p = clamp((y - appsTop) / Math.max(1, appsTravel), 0, 1);
    track.style.setProperty('--tx', (-p * appsTravel).toFixed(1) + 'px');
  }

  // play each demo video only while it is on screen
  var videos = $$('.phone video');
  if ('IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting && !reduceMotion.matches) {
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else { v.pause(); }
      });
    }, { threshold: 0.35 });
    videos.forEach(function (v) { vio.observe(v); });
  }

  /* ---------------------------------------------------------------------
     Process: the line fills and steps light up as they pass mid-screen;
     toolbox tiles get a soft spotlight under the pointer
     --------------------------------------------------------------------- */
  var procList = $('.process-steps');
  var procSteps = $$('.pstep');
  var stepNow = $('[data-step-now]');
  var lastStep = -1;
  function updateProcess(vh) {
    if (!procList) return;
    var r = procList.getBoundingClientRect();
    var mark = vh * 0.55;
    var span = Math.max(1, r.height - 48);
    procList.style.setProperty('--lp', clamp((mark - r.top - 24) / span, 0, 1).toFixed(4));
    var cur = 0;
    procSteps.forEach(function (li, i) {
      var done = li.getBoundingClientRect().top + 24 <= mark;
      li.classList.toggle('is-done', done || i === 0);
      if (done) cur = i;
    });
    if (cur !== lastStep) { lastStep = cur; if (stepNow) stepNow.textContent = cur + 1; }
  }
  if (finePointer.matches) {
    $$('.tile').forEach(function (tile) {
      tile.addEventListener('pointermove', function (e) {
        var r = tile.getBoundingClientRect();
        tile.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        tile.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      });
    });
  }

  /* ---------------------------------------------------------------------
     Reveal on scroll, counters, copy email, year
     --------------------------------------------------------------------- */
  function countUp(el) {
    var end = parseInt(el.getAttribute('data-count'), 10);
    if (reduceMotion.matches || !end) { el.textContent = end; return; }
    var t0 = performance.now(), dur = 1300;
    (function tick(now) {
      var k = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  // live clock for Göteborg
  var clockEl = $('[data-clock]');
  function tickClock() {
    if (!clockEl) return;
    try {
      clockEl.textContent = new Intl.DateTimeFormat('sv-SE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Stockholm' }).format(new Date());
    } catch (e) {}
  }
  tickClock();
  setInterval(tickClock, 15000);

  var revealEls = $$('[data-reveal], [data-split-scroll]');
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        rio.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { rio.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  var copyBtn = $('.copy'), copied = $('.copied'), copiedTimer;
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var text = copyBtn.getAttribute('data-copy');
    var done = function () {
      copied.textContent = copied.getAttribute('data-copied-text');
      clearTimeout(copiedTimer);
      copiedTimer = setTimeout(function () { copied.textContent = ''; }, 2600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    else {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      ta.remove();
    }
  });

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------------------------------------------------------------
     One scroll/resize loop for everything above
     --------------------------------------------------------------------- */
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    onScrollChrome(y, vh);
    updatePlatforms(y);
    updateApps(y);
    updateProcess(vh);
  }
  function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  function measure() { measureApps(); measurePlatforms(); requestFrame(); }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  pinQuery.addEventListener('change', measure);

  applyLang(storedLang());
  measure();
})();
