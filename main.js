/* Taurus Tech — site interactions. No dependencies. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Hero: lit by Vancouver's time of day ---------- */

  const initHero = () => {
    const hero = $('[data-hero]');
    if (!hero) return;
    const clock = $('[data-clock]', hero);
    const sun = $('[data-sun]', hero);
    const buttons = $$('[data-mode-btn]', hero);
    // Sun (or moon) position per mode; the colours live in CSS.
    const SUN = { day: [120, 46], dusk: [330, 60], night: [110, 32] };
    let picked = null;
    let hour = null;

    const autoMode = () => {
      if (hour === null) return 'day';
      if (hour >= 7 && hour < 17) return 'day';
      if ((hour >= 17 && hour < 20) || (hour >= 5 && hour < 7)) return 'dusk';
      return 'night';
    };

    const render = () => {
      const mode = picked || autoMode();
      hero.dataset.mode = mode;
      sun.setAttribute('cy', SUN[mode][0]);
      sun.setAttribute('r', SUN[mode][1]);
      buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.modeBtn === mode)));
    };

    const tick = () => {
      try {
        const now = new Date();
        const tz = 'America/Vancouver';
        clock.textContent = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(now);
        const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(now), 10);
        hour = isNaN(h) ? null : h;
      } catch (e) { /* keep the daytime scene */ }
      render();
    };

    buttons.forEach(b => b.addEventListener('click', () => {
      picked = b.dataset.modeBtn;
      render();
    }));

    tick();
    setInterval(tick, 30000);
  };

  /* ---------- Problem picker ---------- */

  const initPicker = () => {
    const box = $('[data-picker]');
    if (!box) return;
    const pickers = $$('[data-pp]', box);
    const answers = $$('[data-pp-ans]', box);

    // Desktop rows and phone chips share one answer panel.
    pickers.forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.pp;
      pickers.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pp === id)));
      // Showing a hidden answer restarts its illustration's animation.
      answers.forEach(a => { a.hidden = a.dataset.ppAns !== id; });
    }));
  };

  /* ---------- FAQ (one open at a time; tap again to close) ---------- */

  const initFaq = () => {
    const items = $$('[data-faq] .faq__item');
    items.forEach(item => {
      $('.faq__q', item).addEventListener('click', () => {
        const opening = !item.classList.contains('is-open');
        items.forEach(i => {
          const on = opening && i === item;
          i.classList.toggle('is-open', on);
          $('.faq__q', i).setAttribute('aria-expanded', String(on));
          $('.faq__a', i).hidden = !on;
        });
      });
    });
  };

  /* ---------- Contact form ---------- */

  const initForm = () => {
    const form = $('[data-form]');
    if (!form) return;
    $$('.chip', form).forEach(chip => {
      chip.addEventListener('click', () => {
        chip.setAttribute('aria-pressed', String(chip.getAttribute('aria-pressed') !== 'true'));
      });
    });
    // No submission endpoint is configured yet; stop the page from reloading.
    form.addEventListener('submit', e => e.preventDefault());
  };

  /* ---------- Phone booking button: tucked away while the hero is on screen ---------- */

  const initDock = () => {
    const dock = $('.dock');
    const hero = $('[data-hero]');
    if (!dock || !hero || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(([e]) => dock.classList.toggle('is-tucked', e.isIntersecting), { threshold: 0.35 }).observe(hero);
  };

  initHero();
  initDock();
  initPicker();
  initFaq();
  initForm();
})();
