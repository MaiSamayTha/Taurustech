/* Taurus Tech — site interactions. No dependencies. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Problem picker ---------- */

  const initPicker = () => {
    const box = $('[data-picker]');
    if (!box) return;
    const items = $$('.pp__item', box);
    const panel = $('.pp__panel', box);
    const desktop = window.matchMedia('(min-width: 861px)');

    // The desktop panel mirrors the picked item's inline answer.
    const fillPanel = item => {
      $('[data-pp-svc]', panel).textContent = $('.pp__svc', item).textContent;
      $('[data-pp-what]', panel).textContent = $('.pp__what', item).textContent;
      $('[data-pp-get]', panel).innerHTML = $('.pp__get', item).innerHTML;
      panel.classList.remove('is-swapping');
      void panel.offsetWidth;
      panel.classList.add('is-swapping');
    };

    items.forEach(item => {
      const btn = $('.pp__q', item);
      btn.addEventListener('click', () => {
        if (item.classList.contains('is-active')) return;
        // On mobile, keep the tapped row where it was when the answer above it closes.
        const before = desktop.matches ? null : btn.getBoundingClientRect().top;
        items.forEach(i => {
          const on = i === item;
          i.classList.toggle('is-active', on);
          $('.pp__q', i).setAttribute('aria-pressed', String(on));
        });
        fillPanel(item);
        if (before !== null) {
          const delta = btn.getBoundingClientRect().top - before;
          if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
        }
      });
    });
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

  initPicker();
  initFaq();
  initForm();
})();
