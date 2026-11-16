(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Scroll progress bar (transform only, rAF-throttled) */
  const bar = $('.progress span');
  let ticking = false;
  const paint = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();

  /* Staggered scroll-triggered reveals */
  const reveals = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('in');
        io.unobserve(el);
        setTimeout(() => el.style.setProperty('--d', '0ms'), 1500); /* keep hover instant */
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => {
      const i = [...el.parentElement.children].indexOf(el);
      el.style.setProperty('--d', `${(i % 4) * 90}ms`);
      io.observe(el);
    });
  }

  /* Scroll-spy for navigation */
  const links = $$('.nav-link');
  const setActive = id => links.forEach(a => {
    const on = a.getAttribute('href') === `#${id}`;
    a.classList.toggle('active', on);
    on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
  });
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => spy.observe(s));
  }

  /* Mobile menu */
  const toggle = $('.nav-toggle');
  const menu = $('#navLinks');
  const setMenu = open => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  links.forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* Experience filter tabs with fade show/hide */
  const tabs = $$('.filter-tab');
  const items = $$('.achievement-subsection');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => {
      t.classList.toggle('active', t === tab);
      t.setAttribute('aria-pressed', String(t === tab));
    });
    const f = tab.dataset.filter;
    items.forEach(it => {
      const show = f === 'all' || it.dataset.cat === f;
      if (show) {
        if (it.hidden) { it.classList.add('is-out'); it.hidden = false; void it.offsetWidth; }
        it.classList.remove('is-out');
      } else {
        it.classList.add('is-out');
        setTimeout(() => { if (it.classList.contains('is-out')) it.hidden = true; }, reduce ? 0 : 280);
      }
    });
  }));

  /* One-click email copy with feedback */
  const copyBtn = $('#copyEmail');
  const msg = $('#copyMsg');
  copyBtn.addEventListener('click', async () => {
    const text = copyBtn.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (__) { /* ignore */ }
      ta.remove();
    }
    msg.textContent = ok ? 'Email address copied to clipboard.' : 'Copy failed. Select the address and copy it manually.';
    copyBtn.classList.toggle('done', ok);
    copyBtn.textContent = ok ? 'Copied' : 'Copy email';
    clearTimeout(copyBtn._t);
    copyBtn._t = setTimeout(() => { msg.textContent = ''; copyBtn.classList.remove('done'); copyBtn.textContent = 'Copy email'; }, 2600);
  });

  /* Print / Save PDF and footer year */
  $('#printBtn').addEventListener('click', () => window.print());
  $('#year').textContent = new Date().getFullYear();
})();
