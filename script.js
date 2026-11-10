const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* ---------- header ---------- */

const header = $('#header');
const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- mobile menu ---------- */

const menuBtn = $('#menuBtn');
const mobileMenu = $('#mobileMenu');

const setMenu = (open) => {
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'بستن منو' : 'باز کردن منو');
  mobileMenu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
};

menuBtn.addEventListener('click', () => {
  setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
});

$$('#mobileMenu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

/* ---------- reveal on scroll ---------- */

const revealEls = $$('[data-reveal]');

$$('.work-item').forEach((el, i) => {
  el.dataset.delay = String((i % 3) * 90);
});

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = Number(el.dataset.delay || 0);
        window.setTimeout(() => el.classList.add('is-visible'), delay);
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.06 }
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

/* ---------- category filter ---------- */

const chips = $$('.chip');
const items = $$('.work-item');

const visibleItems = () => items.filter((it) => !it.classList.contains('is-hidden'));

chips.forEach((chip) => {
  chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.toggle('is-active', c === chip));
    const filter = chip.dataset.filter;
    items.forEach((it) => {
      const show = filter === 'all' || it.dataset.cat === filter;
      it.classList.toggle('is-hidden', !show);
    });
  });
});

/* ---------- video cards ----------
   هر figure که صفت data-video داشته باشد، به‌جای عکس یک ویدیو نشان می‌دهد.
   عکسِ داخل img خودکار پوستر ویدیو می‌شود، پس هم فریم اول داری هم پخش. */

const canHover = window.matchMedia('(hover: hover)').matches;

$$('.work-item[data-video]').forEach((item) => {
  const btn = item.querySelector('.work-btn');
  const img = item.querySelector('img');
  if (!btn || !img) return;

  const video = document.createElement('video');
  video.src = item.dataset.video;
  video.poster = img.getAttribute('src') || '';
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');

  btn.replaceChild(video, img);

  video.addEventListener('playing', () => btn.classList.add('is-playing'));
  video.addEventListener('pause', () => btn.classList.remove('is-playing'));

  if (!btn.querySelector('.work-play')) {
    const badge = document.createElement('span');
    badge.className = 'work-play';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7V5z" fill="currentColor"/></svg>';
    btn.appendChild(badge);
  }

  if (!canHover) return;

  const play = () => {
    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };
  const stop = () => {
    video.pause();
    video.currentTime = 0;
  };

  btn.addEventListener('mouseenter', play);
  btn.addEventListener('mouseleave', stop);
  btn.addEventListener('focus', play);
  btn.addEventListener('blur', stop);
});

/* ---------- lightbox ---------- */

const lb = $('#lightbox');
const lbImg = $('#lbImg');
const lbVideo = $('#lbVideo');
const lbTitle = $('#lbTitle');
const lbMeta = $('#lbMeta');
const lbDesc = $('#lbDesc');

let current = 0;
let lastFocus = null;

const renderLb = () => {
  const list = visibleItems();
  const item = list[current];
  if (!item) return;

  const videoSrc = item.dataset.video;
  const cardVideo = item.querySelector('.work-btn video');
  const img = item.querySelector('img');

  if (videoSrc) {
    lbImg.hidden = true;
    lbImg.removeAttribute('src');

    lbVideo.hidden = false;
    lbVideo.poster = cardVideo ? cardVideo.getAttribute('poster') || '' : '';
    if (lbVideo.getAttribute('src') !== videoSrc) lbVideo.src = videoSrc;

    const p = lbVideo.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } else {
    lbVideo.pause();
    lbVideo.hidden = true;
    lbVideo.removeAttribute('src');

    lbImg.hidden = false;
    lbImg.style.opacity = '0';
    lbImg.src = img.getAttribute('src');
    lbImg.alt = img.alt;
    lbImg.onload = () => { lbImg.style.opacity = '1'; };
  }

  lbTitle.textContent = item.dataset.title || '';
  lbMeta.textContent = [item.dataset.catLabel, item.dataset.year].filter(Boolean).join(' — ');
  lbDesc.textContent = item.dataset.desc || '';
};

const openLb = (item) => {
  const list = visibleItems();
  const idx = list.indexOf(item);
  current = idx < 0 ? 0 : idx;
  lastFocus = document.activeElement;
  renderLb();
  lb.classList.add('is-open');
  document.body.classList.add('menu-open');
  $('#lbClose').focus();
};

const closeLb = () => {
  lbVideo.pause();
  lb.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
};

const stepLb = (delta) => {
  const list = visibleItems();
  if (!list.length) return;
  current = (current + delta + list.length) % list.length;
  renderLb();
};

items.forEach((item) => {
  const btn = item.querySelector('.work-btn');
  if (btn) btn.addEventListener('click', () => openLb(item));
});

$('#lbClose').addEventListener('click', closeLb);
$('#lbNext').addEventListener('click', () => stepLb(1));
$('#lbPrev').addEventListener('click', () => stepLb(-1));

lb.addEventListener('click', (e) => {
  if (e.target === lb) closeLb();
});

document.addEventListener('keydown', (e) => {
  if (mobileMenu.classList.contains('is-open') && e.key === 'Escape') {
    setMenu(false);
    return;
  }
  if (!lb.classList.contains('is-open')) return;

  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') stepLb(1);
  if (e.key === 'ArrowRight') stepLb(-1);
});

/* ---------- footer year (Jalali) ---------- */

const faDigits = (n) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

const jalaliYear = () => {
  const now = new Date();
  let gy = now.getFullYear();
  const gm = now.getMonth() + 1;
  const gd = now.getDate();
  const gDayMonth = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];

  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;

  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    gDayMonth[gm - 1];

  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;

  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }

  return jy;
};

const yearEl = $('#year');
if (yearEl) yearEl.textContent = faDigits(jalaliYear());

/* ---------- showreel ---------- */
(() => {
  const v = document.getElementById('reelVideo');
  const b = document.getElementById('reelPlay');
  if (!v || !b) return;
  const frame = v.parentElement;
  v.controls = false;
  b.addEventListener('click', () => { v.controls = true; v.play().catch(() => {}); });
  v.addEventListener('play', () => frame.classList.add('is-playing'));
  v.addEventListener('pause', () => { if (v.currentTime === 0) frame.classList.remove('is-playing'); });
})();

/* ================= hover details ================= */
(() => {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // small meta line on each work card
  document.querySelectorAll('.work-item').forEach((it) => {
    const btn = it.querySelector('.work-btn');
    if (!btn || btn.querySelector('.work-hover')) return;
    const h = document.createElement('span');
    h.className = 'work-hover';
    h.setAttribute('aria-hidden', 'true');
    h.innerHTML = `<span>${it.dataset.catLabel || ''}</span><i>مشاهده ←</i>`;
    btn.appendChild(h);
  });

  // spotlight on tool cards
  document.querySelectorAll('.tools li').forEach((li) => {
    li.addEventListener('pointermove', (e) => {
      const r = li.getBoundingClientRect();
      li.style.setProperty('--mx', `${e.clientX - r.left}px`);
      li.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  if (!fine || calm) return;

  // custom cursor
  const c = document.createElement('div');
  c.className = 'cursor is-hidden';
  c.innerHTML = '<span>پخش</span>';
  document.body.appendChild(c);
  document.body.classList.add('has-cursor');

  let x = -100, y = -100, cx = x, cy = y;
  window.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; c.classList.remove('is-hidden'); }, { passive: true });
  document.addEventListener('pointerleave', () => c.classList.add('is-hidden'));
  const loop = () => {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();

  const setState = (t) => {
    const media = t.closest('.work-btn, .reel-frame:not(.is-playing)');
    const link = !media && t.closest('a, button, .chip');
    c.classList.toggle('is-media', !!media);
    c.classList.toggle('is-link', !!link);
  };
  document.addEventListener('pointerover', (e) => setState(e.target));

  // hide the custom cursor inside the open lightbox
  const lbEl = document.getElementById('lightbox');
  if (lbEl) new MutationObserver(() => {
    c.style.display = lbEl.classList.contains('is-open') ? 'none' : '';
  }).observe(lbEl, { attributes: true, attributeFilter: ['class'] });

  // magnetic buttons
  document.querySelectorAll('.cta, .cta-ghost').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.25;
      const dy = (e.clientY - r.top - r.height / 2) * 0.35;
      b.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
})();

/* ================= mobile: swipe row ================= */
(() => {
  const grid = document.getElementById('workGrid');
  if (!grid) return;
  const mq = window.matchMedia('(max-width: 760px)');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dots = document.createElement('div');
  dots.className = 'work-dots';
  dots.setAttribute('aria-hidden', 'true');
  grid.after(dots);

  const shown = () => Array.from(grid.querySelectorAll('.work-item')).filter((it) => !it.classList.contains('is-hidden'));

  let cur = -1;
  const setCurrent = (i) => {
    const list = shown();
    if (i === cur) return;
    cur = i;
    list.forEach((it, k) => {
      const btn = it.querySelector('.work-btn');
      const v = btn && btn.querySelector('video');
      const on = k === i && mq.matches;
      if (btn) btn.classList.toggle('is-current', on);
      if (!v) return;
      if (on && !calm) { v.preload = 'auto'; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
      else { v.pause(); }
    });
    Array.from(dots.children).forEach((d, k) => d.classList.toggle('on', k === i));
  };

  const build = () => {
    const n = shown().length;
    dots.innerHTML = mq.matches && n > 1 ? '<i></i>'.repeat(n) : '';
    cur = -1;
    grid.scrollTo({ left: 0 });
    pick();
  };

  const pick = () => {
    if (!mq.matches) { shown().forEach((it) => it.querySelector('.work-btn')?.classList.remove('is-current')); return; }
    const r = grid.getBoundingClientRect();
    const inView = r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.15;
    if (!inView) { setCurrent(-2); return; }
    const anchor = r.right - 20; // RTL: cards start from the right edge
    let best = 0, bestD = Infinity;
    shown().forEach((it, k) => {
      const d = Math.abs(it.getBoundingClientRect().right - anchor);
      if (d < bestD) { bestD = d; best = k; }
    });
    setCurrent(best);
  };

  let t;
  const later = () => { clearTimeout(t); t = setTimeout(pick, 90); };
  grid.addEventListener('scroll', later, { passive: true });
  window.addEventListener('scroll', later, { passive: true });
  document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => setTimeout(build, 30)));
  (mq.addEventListener ? mq.addEventListener('change', build) : mq.addListener(build));
  build();
})();
