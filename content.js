/* ============================================================
   محتوای سایت از content.json خوانده می‌شود (همان فایلی که پنل ادمین ویرایش می‌کند).
   اگر فایل در دسترس نباشد (مثلاً باز کردن مستقیم index.html از روی کامپیوتر)،
   همان متن‌های داخل index.html نمایش داده می‌شود.
   ============================================================ */

(() => {
  const ICONS = {
    layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
    film: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9.5h4M3 14.5h4M17 9.5h4M17 14.5h4"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    spark: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><path d="M12 8l1.2 2.8L16 12l-2.8 1.2L12 16l-1.2-2.8L8 12l2.8-1.2Z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    pen: '<path d="M4 20l4-1L19 8l-3-3L5 16l-1 4Z"/><path d="m14 7 3 3"/>',
    music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    cube: '<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    type: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  };
  window.SITE_ICONS = ICONS;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const faDigits = (s) => String(s ?? '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);

  const phoneDisplay = (p) => {
    const d = String(p || '').replace(/\D/g, '');
    if (d.length === 11) return faDigits(`${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`);
    return faDigits(p);
  };
  const phoneHref = (p) => {
    const d = String(p || '').replace(/\D/g, '');
    return d.startsWith('0') ? `tel:+98${d.slice(1)}` : `tel:+${d}`;
  };

  const apply = (c) => {
    // simple text fields
    document.querySelectorAll('[data-c]').forEach((el) => {
      const v = get(c, el.dataset.c);
      if (typeof v === 'string') el.textContent = v;
    });
    document.querySelectorAll('[data-c-src]').forEach((el) => {
      const v = get(c, el.dataset.cSrc);
      if (v) el.setAttribute('src', v);
    });
    document.querySelectorAll('[data-c-poster]').forEach((el) => {
      const v = get(c, el.dataset.cPoster);
      if (v) el.setAttribute('poster', v);
    });
    document.querySelectorAll('[data-c-alt]').forEach((el) => {
      const v = get(c, el.dataset.cAlt);
      if (typeof v === 'string') el.setAttribute('alt', v);
    });

    // meta
    if (c.meta) {
      if (c.meta.title) document.title = c.meta.title;
      const d = document.querySelector('meta[name="description"]');
      if (d && c.meta.description) d.setAttribute('content', c.meta.description);
    }

    // paragraphs (blank line = new paragraph)
    document.querySelectorAll('[data-c-paras]').forEach((el) => {
      const v = get(c, el.dataset.cParas);
      if (typeof v !== 'string') return;
      el.innerHTML = v.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
        .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
    });

    // contact
    const ct = c.contact || {};
    document.querySelectorAll('[data-c-email]').forEach((el) => {
      el.href = `mailto:${ct.email || ''}`;
      el.textContent = ct.email || '';
      el.hidden = !ct.email;
    });
    document.querySelectorAll('[data-c-telegram]').forEach((el) => {
      el.href = ct.telegram || '#';
      el.hidden = !ct.telegram;
    });
    document.querySelectorAll('[data-c-phone]').forEach((el) => {
      el.href = phoneHref(ct.phone);
      const s = el.querySelector('.phone');
      if (s) s.textContent = phoneDisplay(ct.phone);
      el.hidden = !ct.phone;
    });

    // marquee
    const mq = document.querySelector('.marquee-track');
    if (mq && Array.isArray(c.marquee) && c.marquee.length) {
      const one = c.marquee.map((t) => `<span>${esc(t)}</span><i></i>`).join('');
      mq.innerHTML = one + one;
    }

    // filters
    const work = c.work || {};
    const filters = document.querySelector('.filters');
    if (filters && Array.isArray(work.categories)) {
      filters.innerHTML = '<button class="chip is-active" data-filter="all">همه</button>' +
        work.categories.map((k) => `<button class="chip" data-filter="${esc(k.id)}">${esc(k.label)}</button>`).join('');
    }

    // works
    const grid = document.getElementById('workGrid');
    if (grid && Array.isArray(work.items)) {
      const catLabel = (id) => (work.categories || []).find((k) => k.id === id)?.label || '';
      grid.innerHTML = work.items.map((w) => {
        const lab = catLabel(w.cat);
        const wide = w.shape === 'horizontal' ? ' work-item--wide' : '';
        return `
        <figure class="work-item${wide}" data-cat="${esc(w.cat)}" data-reveal
          ${w.video ? `data-video="${esc(w.video)}"` : ''}
          data-title="${esc(w.title)}" data-cat-label="${esc(lab)}" data-year="${esc(w.year)}"
          data-desc="${esc(w.desc)}">
          <button class="work-btn" type="button" aria-label="${w.video ? 'پخش' : 'نمایش'} ${esc(w.title)}">
            <img src="${esc(w.cover)}" alt="${esc(w.alt || w.title)}" loading="lazy">
          </button>
          <figcaption>
            <h3>${esc(w.title)}</h3>
            <p>${esc(lab)} ${w.year ? `<span>${esc(w.year)}</span>` : ''}</p>
          </figcaption>
        </figure>`;
      }).join('');
    }

    // tools
    const tools = document.querySelector('.tools');
    const tl = get(c, 'about.tools');
    if (tools && Array.isArray(tl)) {
      tools.innerHTML = tl.map((t) => `<li><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${ICONS[t.icon] || ICONS.spark}</svg><span><b>${esc(t.name)}</b><small>${esc(t.desc)}</small></span></li>`).join('');
    }
  };

  const start = () => {
    document.documentElement.classList.remove('cms-wait');
    const s = document.createElement('script');
    s.src = 'script.js?v=4';
    document.body.appendChild(s);
  };

  const fallback = setTimeout(start, 2500);
  let started = false;
  const go = () => { if (started) return; started = true; clearTimeout(fallback); start(); };

  fetch(`content.json?t=${Date.now()}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
    .then((c) => { if (!started) apply(c); })
    .catch(() => {})
    .finally(go);
})();
