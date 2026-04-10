/* ============================================================
   INSAT AI AUTOMATION — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Nav scroll effect ── */
  const nav = document.getElementById('nav');
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Mobile menu ── */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav?.classList.toggle('open');
    document.body.style.overflow = mobileNav?.classList.contains('open') ? 'hidden' : '';
  });
  document.querySelectorAll('.mobile-nav a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      mobileNav?.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Scroll reveal (IntersectionObserver) ── */
  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('v');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );
  document.querySelectorAll('.rv').forEach(el => revealObserver.observe(el));

  /* ── Counter animation ── */
  const counterObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        const duration = 1800;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(ease * target) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

  /* ── Product tabs ── */
  const tabBtns = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.product-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(id)?.classList.add('active');
    });
  });

  /* ── Demo call form ── */
  const demoForm = document.getElementById('demoForm');
  const demoFormWrap = document.querySelector('.demo-form-content');
  const demoSuccess = document.getElementById('demoSuccess');

  demoForm?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('demoName').value.trim();
    const phone = document.getElementById('demoPhone').value.trim();
    const business_type = document.getElementById('demoBusiness').value;

    // Validate all fields are filled
    if (!name || !phone || !business_type) {
      alert('Please fill in all fields before submitting.');
      return;
    }

    const btn = demoForm.querySelector('.form-submit');
    const originalText = btn.textContent;

    btn.textContent = 'Calling you now...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/demo-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, business_type }),
      });
      const data = await res.json();
      if (data.success) {
        demoFormWrap.style.display = 'none';
        demoSuccess.classList.add('show');
      } else {
        alert(data.error || 'Error — please try again');
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch (err) {
      alert('Connection error — please try again');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  /* ── Ticker population ── */
  const tickerItems = [
    'AI Voice Agents',
    'Speed to Lead: 60s Response',
    'After Hours Coverage',
    'Database Reactivation',
    'Workflow Automation',
    'London Based Agency',
    '24/7 AI Receptionist',
    'Zero Missed Calls',
    'Live in 48 Hours',
    'No Recurring Staff Costs',
  ];

  const tickerTrack = document.querySelector('.ticker-track');
  if (tickerTrack) {
    const build = items => items.map(t =>
      `<span class="ticker-item"><span class="dot"></span>${t}</span>`
    ).join('');
    tickerTrack.innerHTML = build(tickerItems) + build(tickerItems);
  }

  /* ── Spin CSS helper (for loading button) ── */
  const style = document.createElement('style');
  style.textContent = `.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);

})();
