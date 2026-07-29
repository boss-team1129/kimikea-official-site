const DEFAULT_STATS = {
  shops: 5,
  trainings: 0,
  events: 0,
  colors: 76
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
    list.innerHTML = notices.slice(0, 3).map((notice) => `
      <article>
        <time datetime="${escapeHtml(notice.date || '')}">${escapeHtml(notice.dateLabel || notice.date || '')}</time>
        <strong>${escapeHtml(notice.title || '')}</strong>
        <p>${escapeHtml(notice.body || '')}</p>
      </article>
    `).join('');
  } catch (_) {
    // Keep the static fallback notice visible.
  }
}

function buildShopLink(url, label, extra = '') {
  const href = String(url || '').trim();
  if (!href) return '';
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener"${extra}>${escapeHtml(label)}</a>`;
}

function normalizePhone(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

async function loadShops() {
  const carousel = document.getElementById('shopCarousel');
  if (!carousel) return;

  try {
    const response = await fetch('./data/shops.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('shops.json not found');
    const shops = await response.json();
    if (!Array.isArray(shops) || !shops.length) throw new Error('empty shops');

    carousel.innerHTML = shops.map((shop) => {
      const phoneNumber = normalizePhone(shop.phone);
      const location = [shop.prefecture, shop.city].filter(Boolean).join(' ');
      const actions = [
        buildShopLink(shop.detailUrl || shop.connectUrl, '詳しく見る'),
        buildShopLink(shop.mapUrl, '地図を見る'),
        buildShopLink(shop.instagramUrl, 'Instagram'),
        buildShopLink(shop.homepageUrl || shop.websiteUrl, 'ホームページ'),
        buildShopLink(shop.hotPepperUrl, 'Hot Pepper'),
        phoneNumber ? buildShopLink(`tel:${phoneNumber}`, '電話する') : ''
      ].filter(Boolean).join('');

      return `
        <article class="shop-card">
          <img src="${escapeHtml(shop.imageUrl || './assets/shop-team-hair.jpg')}" alt="${escapeHtml(shop.name || '加盟店')}の店舗イメージ" width="900" height="563" loading="lazy">
          <div class="shop-card-body">
            <span>${escapeHtml(shop.type || '加盟店')}</span>
            <h3>${escapeHtml(shop.name || '')}</h3>
            <p class="shop-meta">${escapeHtml(location)}</p>
            <p>${escapeHtml(shop.description || '')}</p>
            ${actions ? `<div class="shop-actions">${actions}</div>` : ''}
          </div>
        </article>
      `;
    }).join('');
  } catch (_) {
    carousel.innerHTML = `
      <article class="shop-card shop-card-fallback">
        <div class="shop-card-body">
          <span>Partner Salons</span>
          <h3>加盟店情報を準備中です</h3>
          <p>公開できる店舗情報から順番に掲載します。</p>
        </div>
      </article>
    `;
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

function initMenu() {
  const button = document.querySelector('.menu-toggle');
  const nav = document.getElementById('siteNav');
  if (!button || !nav) return;

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('is-menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Close' : 'Menu';
  }

  button.addEventListener('click', () => {
    setOpen(!nav.classList.contains('is-open'));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });
}

function initFaqMore() {
  const list = document.getElementById('faqList');
  const button = document.getElementById('faqMoreButton');
  if (!list || !button) return;

  button.addEventListener('click', () => {
    const isCollapsed = list.dataset.collapsed !== 'false';
    list.dataset.collapsed = isCollapsed ? 'false' : 'true';
    button.setAttribute('aria-expanded', String(isCollapsed));
    button.textContent = isCollapsed ? '閉じる' : 'もっと見る';
  });
}

loadStats();
loadNotices();
loadShops();
initReveal();
initMenu();
initFaqMore();
