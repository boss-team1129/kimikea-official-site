const DEFAULT_STATS = {
  shops: 5,
  trainings: 0,
  events: 0,
  colors: 76
};

function animateNumber(element, value) {
  const target = Number(value || 0);
  const duration = 900;
  const start = performance.now();
  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased).toLocaleString('ja-JP');
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

async function loadStats() {
  let stats = DEFAULT_STATS;
  try {
    const response = await fetch('./data/stats.json', { cache: 'no-store' });
    if (response.ok) stats = { ...stats, ...(await response.json()) };
  } catch (_) {
    stats = DEFAULT_STATS;
  }
  document.querySelectorAll('[data-stat]').forEach((element) => {
    animateNumber(element, stats[element.dataset.stat]);
  });
}

async function loadNotices() {
  const list = document.getElementById('noticeList');
  if (!list) return;
  try {
    const response = await fetch('./data/notices.json', { cache: 'no-store' });
    if (!response.ok) return;
    const notices = await response.json();
    if (!Array.isArray(notices) || !notices.length) return;
    list.innerHTML = notices.slice(0, 4).map((notice) => `
      <article>
        <time datetime="${String(notice.date || '')}">${String(notice.dateLabel || notice.date || '')}</time>
        <strong>${String(notice.title || '')}</strong>
        <p>${String(notice.body || '')}</p>
      </article>
    `).join('');
  } catch (_) {
    // Keep the static fallback notice.
  }
}

function initReveal() {
  const elements = Array.from(document.querySelectorAll('.reveal'));
  if (!elements.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: '0px 0px -8% 0px',
    threshold: 0.12
  });

  elements.forEach((element) => observer.observe(element));
}

loadStats();
loadNotices();
initReveal();
