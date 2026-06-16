/* ============================================================
   INSAT AI AUTOMATION — Main JavaScript v2
   ============================================================ */

(function () {
  'use strict';

  /* ── Nav scroll effect ── */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile menu ── */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    document.querySelectorAll('.mobile-nav a').forEach(a => {
      a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 88;
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
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
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
      tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(id)?.classList.add('active');
    });
  });

  /* ── Demo call form ── */
  const demoForm = document.getElementById('demoForm');
  const demoFormContent = document.querySelector('.demo-form-content');
  const demoSuccess = document.getElementById('demoSuccess');

  demoForm?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name = document.getElementById('demoName')?.value.trim();
    const phone = document.getElementById('demoPhone')?.value.trim();
    const business_type = document.getElementById('demoBusiness')?.value;
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
        if (demoFormContent) demoFormContent.style.display = 'none';
        demoSuccess?.classList.add('show');
      } else {
        alert(data.error || 'Error — please try again');
        btn.textContent = originalText;
        btn.disabled = false;
      }
    } catch {
      alert('Connection error — please try again');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });

  /* ── Revenue Calculator ── */
  const calcCalls = document.getElementById('calcCalls');
  const calcMiss = document.getElementById('calcMiss');
  const calcValue = document.getElementById('calcValue');

  function fmt(n) {
    if (n >= 10000) return (n / 1000).toFixed(0) + 'k';
    if (n >= 1000) {
      const s = n.toFixed(0);
      return s.slice(0, -3) + ',' + s.slice(-3);
    }
    return n.toFixed(0);
  }

  function updateCalc() {
    const calls = parseInt(calcCalls?.value || 60, 10);
    const missRate = parseInt(calcMiss?.value || 35, 10) / 100;
    const value = parseFloat(calcValue?.value || 150);

    const missed = Math.round(calls * missRate);
    const monthly = Math.round(missed * value * 0.5); // 50% call-to-booking assumption
    const annual = monthly * 12;
    const recover = Math.round(monthly * 0.8);

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('calcMonthlyMain', fmt(monthly));
    set('calcMissedCalls', missed);
    set('calcMonthly', fmt(monthly));
    set('calcMonthly2', fmt(monthly));
    set('calcAnnual', fmt(annual));
    set('calcRecoverAmount', fmt(recover));

    const display = document.getElementById('calcCallsDisplay');
    const missDisplay = document.getElementById('calcMissDisplay');
    const valueDisplay = document.getElementById('calcValueDisplay');
    if (display) display.textContent = calls + ' calls';
    if (missDisplay) missDisplay.textContent = Math.round(missRate * 100) + '%';
    if (valueDisplay) valueDisplay.textContent = '£' + value.toLocaleString('en-GB');

    // Update slider fill visual
    if (calcCalls) {
      const callPct = ((calls - 10) / (500 - 10)) * 100;
      calcCalls.style.background = `linear-gradient(to right, #6366F1 ${callPct}%, rgba(255,255,255,0.07) ${callPct}%)`;
    }
    if (calcMiss) {
      const missPct = ((missRate * 100 - 5) / (80 - 5)) * 100;
      calcMiss.style.background = `linear-gradient(to right, #6366F1 ${missPct}%, rgba(255,255,255,0.07) ${missPct}%)`;
    }

    const resultCard = document.querySelector('.calc-result-card');
    if (resultCard) resultCard.classList.toggle('has-value', monthly > 0);
  }

  if (calcCalls) {
    calcCalls.addEventListener('input', updateCalc);
    calcMiss?.addEventListener('input', updateCalc);
    calcValue?.addEventListener('input', updateCalc);
    calcValue?.addEventListener('change', updateCalc);

    // Preset buttons
    document.querySelectorAll('.calc-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.calc-preset').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (calcValue) calcValue.value = btn.dataset.val;
        updateCalc();
      });
    });

    updateCalc();

    // Active preset detection
    document.querySelectorAll('.calc-preset').forEach(btn => {
      if (btn.dataset.val === String(calcValue?.value)) btn.classList.add('active');
    });
  }

  /* ── FAQ Accordion ── */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all
      faqItems.forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
      });
      // Toggle clicked
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Ticker population ── */
  const tickerItems = [
    'AI Voice Agents',
    'Speed to Lead: 60s Response',
    'After Hours Coverage 24/7',
    'Database Reactivation',
    'Workflow Automation',
    'London Based AI Agency',
    'Zero Missed Calls',
    'Live in 48 Hours',
    'No Recurring Staff Costs',
    'Qualify Every Lead Instantly',
  ];
  const tickerTrack = document.querySelector('.ticker-track');
  if (tickerTrack) {
    const build = items => items.map(t =>
      `<span class="ticker-item"><span class="dot" aria-hidden="true"></span>${t}</span>`
    ).join('');
    tickerTrack.innerHTML = build(tickerItems) + build(tickerItems);
  }

  /* ── Spin helper ── */
  const style = document.createElement('style');
  style.textContent = `.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);

})();
