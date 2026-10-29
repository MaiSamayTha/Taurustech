/* Taurus Tech — site interactions. No dependencies. */
(() => {
  'use strict';

  window.TT_READY = true;

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Restart a CSS animation from 0.
  const restart = el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; };

  // Freeze auto-advancing progress bars while their section is off-screen.
  const pauseOffscreen = el => {
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(([e]) => el.classList.toggle('is-paused', !e.isIntersecting)).observe(el);
  };

  /* ---------- Header height (anchor offset + hero height) ---------- */

  const header = $('.site-header');
  const syncHeader = () => root.style.setProperty('--header-h', header.offsetHeight + 'px');
  syncHeader();
  if ('ResizeObserver' in window) new ResizeObserver(syncHeader).observe(header);
  else window.addEventListener('resize', syncHeader);

  /* ---------- Clocks ---------- */

  const formatters = {};
  const fmt = tz => {
    try {
      formatters[tz] = formatters[tz] || new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz });
      return formatters[tz].format(new Date());
    } catch (e) { return '--:--'; }
  };
  const tick = () => $$('[data-tz]').forEach(el => { el.textContent = fmt(el.dataset.tz); });
  tick();
  setInterval(tick, 15000);

  /* ---------- Headline: scale each line to span the full width ---------- */

  const title = $('.hero__title');
  const fitHeadline = () => {
    $$('[data-fit]', title).forEach(el => {
      const W = el.parentElement.clientWidth;
      if (!W) return; // variant hidden at this breakpoint
      const { fontStretch, transition } = el.style;
      el.style.transition = 'none';
      el.style.fontStretch = '72%'; // measure at the resting width, even mid-animation
      el.style.fontSize = '100px';
      const w = el.offsetWidth;
      if (w) el.style.fontSize = (100 * W / w * 0.997) + 'px';
      el.style.fontStretch = fontStretch;
      void el.offsetWidth;
      el.style.transition = transition;
    });
  };
  fitHeadline();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeadline);
  if ('ResizeObserver' in window) {
    let raf;
    new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fitHeadline); }).observe(title);
  } else {
    window.addEventListener('resize', fitHeadline);
  }

  /* ---------- Hero entrance + loader ---------- */

  const hero = $('.hero');
  const playHero = () => {
    fitHeadline();
    $$('.hero__lines', hero).forEach(group => $$('.hline', group).forEach((el, i) => el.style.setProperty('--d', i * 120 + 'ms')));
    $$('[data-hero]', hero).forEach((el, i) => el.style.setProperty('--d', 400 + i * 140 + 'ms'));
    hero.classList.add('is-in');
  };

  const runLoader = () => {
    const loader = $('[data-loader]');
    if (!loader || reduced || getComputedStyle(loader).display === 'none') {
      if (loader) loader.remove();
      playHero();
      return;
    }
    root.classList.add('is-loading');
    requestAnimationFrame(() => requestAnimationFrame(() => loader.classList.add('is-run')));

    const count = $('[data-lcount]', loader);
    const city = $('[data-lcity]', loader);
    const cities = ['Vancouver', 'Toronto', 'New York', 'Dubai'];
    const start = performance.now();
    const dur = 1800;
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      const p = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      count.textContent = String(Math.round(p * 100)).padStart(3, '0');
      city.textContent = cities[Math.min(3, Math.floor(t * 4))];
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);

    setTimeout(() => loader.classList.add('is-out'), 1950);
    setTimeout(() => { loader.classList.add('is-lift'); root.classList.remove('is-loading'); }, 2200);
    setTimeout(playHero, 2450);
    setTimeout(() => loader.remove(), 3500);
  };

  /* ---------- Mobile menu ---------- */

  const initMenu = () => {
    const menu = $('#menu');
    const openBtn = $('[data-menu-open]');
    const closeBtn = $('[data-menu-close]');
    if (!menu || !openBtn) return;

    const setMenu = (open, restoreFocus) => {
      if (open === !menu.hidden) return;
      menu.hidden = !open;
      openBtn.setAttribute('aria-expanded', String(open));
      root.classList.toggle('menu-open', open);
      if (open) closeBtn.focus();
      else if (restoreFocus) openBtn.focus();
    };

    openBtn.addEventListener('click', () => setMenu(true));
    closeBtn.addEventListener('click', () => setMenu(false, true));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));

    menu.addEventListener('keydown', e => {
      if (e.key === 'Escape') { setMenu(false, true); return; }
      if (e.key !== 'Tab') return;
      const items = $$('a, button', menu);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    const desktop = window.matchMedia('(min-width: 900px)');
    const onChange = () => { if (desktop.matches) setMenu(false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onChange);
    else desktop.addListener(onChange);
  };

  /* ---------- Services (side panel on desktop, accordion below 960px) ---------- */

  const initServices = () => {
    const box = $('[data-svc]');
    if (!box) return;
    const rows = $$('.svc__row', box);
    const panels = $$('.svc__panel', box);
    const wide = window.matchMedia('(min-width: 960px)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let cur = 0;

    const select = (i, anchor) => {
      if (i === cur) return;
      // In accordion mode, keep the tapped row under the finger when the panel above it collapses.
      const before = anchor && !wide.matches ? anchor.getBoundingClientRect().top : null;
      rows.forEach((r, j) => { r.classList.toggle('is-active', j === i); r.setAttribute('aria-expanded', String(j === i)); });
      panels.forEach((p, j) => p.classList.toggle('is-active', j === i));
      cur = i;
      if (before !== null) {
        const delta = anchor.getBoundingClientRect().top - before;
        if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
      }
    };

    rows.forEach((r, i) => {
      r.addEventListener('click', () => select(i, r));
      r.addEventListener('mouseenter', () => { if (wide.matches && finePointer.matches) select(i); });
    });
  };

  /* ---------- Process steps (tabs, auto-advance every 6s) ---------- */

  const initSteps = () => {
    const box = $('[data-steps]');
    if (!box) return;
    const list = $('[role="tablist"]', box);
    const tabs = $$('[role="tab"]', box);
    const panels = $$('[role="tabpanel"]', box);
    let cur = 0;

    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        const on = j === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach((p, j) => p.classList.toggle('is-active', j === i));
      restart($('.step-tab__bar', tabs[i]));
      cur = i;
      if (focus) tabs[i].focus();
    };

    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      $('.step-tab__bar', t).addEventListener('animationend', () => select((cur + 1) % tabs.length));
    });

    list.addEventListener('keydown', e => {
      const n = tabs.length;
      const next = { ArrowRight: cur + 1, ArrowDown: cur + 1, ArrowLeft: cur - 1, ArrowUp: cur - 1, Home: 0, End: n - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select((next + n) % n, true);
    });

    pauseOffscreen(box);
  };

  /* ---------- Founder quotes (auto-advance every 8s) ---------- */

  const initQuotes = () => {
    const box = $('[data-quotes]');
    if (!box) return;
    const quotes = $$('.quote', box);
    const bar = $('.quote-bar', box);
    const num = $('[data-quote-num]', box);
    let cur = 0;

    const go = d => {
      cur = (cur + d + quotes.length) % quotes.length;
      quotes.forEach((q, j) => q.classList.toggle('is-active', j === cur));
      num.textContent = String(cur + 1).padStart(2, '0');
      restart(bar);
    };

    bar.addEventListener('animationend', () => go(1));
    $('[data-quote-prev]', box).addEventListener('click', () => go(-1));
    $('[data-quote-next]', box).addEventListener('click', () => go(1));
    pauseOffscreen(box);
  };

  initMenu();
  initServices();
  initSteps();
  initQuotes();
  runLoader();
})();
