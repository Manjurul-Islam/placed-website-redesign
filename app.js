/* Placed landing — behaviour */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- hero entrance ---------- */
  const start = () => requestAnimationFrame(() => requestAnimationFrame(() => doc.classList.add('is-loaded')));
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
  setTimeout(() => doc.classList.add('is-loaded'), 1200); // safety if a big image stalls load

  /* ---------- fit-to-width mockups ---------- */
  const fits = $$('.fit');
  fits.forEach(f => f.style.setProperty('--ar', `${f.dataset.w}/${f.dataset.h}`));
  const ro = new ResizeObserver(entries => {
    for (const e of entries) {
      const f = e.target;
      f.style.setProperty('--s', (e.contentRect.width / +f.dataset.w).toFixed(4));
    }
  });
  fits.forEach(f => ro.observe(f));

  /* ---------- scroll reveal with per-group stagger ---------- */
  const groups = new Map();
  $$('[data-reveal]').forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    groups.set(p, i + 1);
    if (!el.style.getPropertyValue('--rd')) el.style.setProperty('--rd', `${Math.min(i, 5) * 0.08}s`);
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
      e.target.dispatchEvent(new CustomEvent('reveal'));
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  $$('[data-reveal]').forEach(el => io.observe(el));
  // anchor jumps can skip elements entirely; settle anything already scrolled past
  addEventListener('scrollend', () => {
    $$('[data-reveal]:not(.is-in)').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) { el.classList.add('is-in'); io.unobserve(el); }
    });
  });

  /* ---------- count-up numbers ---------- */
  const countUp = el => {
    const end = +el.dataset.count;
    if (reduce) { el.textContent = end; return; }
    const dur = 1400, t0 = performance.now();
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * eased);
      if (k < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
  };
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- navbar: scrolled state, hide on scroll down (kept visible while the tool tabs are docked) ---------- */
  const nav = $('#nav');
  let lastY = scrollY;
  let tabsDocked = false;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 8);
    const menuOpen = nav.classList.contains('is-menu') || $('.nav__dd').classList.contains('is-open');
    if (tabsDocked) nav.classList.add('is-hidden');   // tab bar takes over the top while the cards stack
    else if (!menuOpen) {
      if (y > lastY + 6 && y > 400) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 400) nav.classList.remove('is-hidden');
    }
    lastY = y;
  };

  /* ---------- eased programmatic scrolling ---------- */
  let scrollAnim = 0;
  const stopScroll = () => { if (scrollAnim) { cancelAnimationFrame(scrollAnim); scrollAnim = 0; } };
  const smoothTo = target => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const y1 = Math.max(0, Math.min(Math.round(target), max));
    stopScroll();
    if (reduce) { scrollTo({ top: y1, behavior: 'instant' }); return; }
    const y0 = scrollY, d = y1 - y0;
    if (Math.abs(d) < 2) return;
    const dur = Math.min(1500, Math.max(700, Math.abs(d) * 0.5));
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / dur);
      scrollTo({ top: y0 + d * ease(k), behavior: 'instant' });
      scrollAnim = k < 1 ? requestAnimationFrame(step) : 0;
    };
    scrollAnim = requestAnimationFrame(step);
  };
  ['wheel', 'touchstart', 'pointerdown'].forEach(ev => addEventListener(ev, stopScroll, { passive: true }));
  addEventListener('keydown', e => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) stopScroll(); });
  const docTop = el => el.getBoundingClientRect().top + scrollY;

  /* AI Tools dropdown */
  const dd = $('.nav__dd'), ddBtn = $('.nav__ddbtn');
  const setDD = open => { dd.classList.toggle('is-open', open); ddBtn.setAttribute('aria-expanded', open); };
  ddBtn.addEventListener('click', e => { e.stopPropagation(); setDD(!dd.classList.contains('is-open')); });
  dd.addEventListener('mouseenter', () => matchMedia('(hover:hover)').matches && setDD(true));
  dd.addEventListener('mouseleave', () => matchMedia('(hover:hover)').matches && setDD(false));
  $$('.nav__ddmenu a').forEach(a => a.addEventListener('click', () => setDD(false)));
  document.addEventListener('click', e => { if (!dd.contains(e.target)) setDD(false); });

  /* mobile menu */
  const burger = $('.nav__burger'), mm = $('#mobileMenu');
  $$('a', mm).forEach((a, i) => a.style.setProperty('--i', i));
  const setMenu = open => {
    nav.classList.toggle('is-menu', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    open ? mm.removeAttribute('inert') : mm.setAttribute('inert', '');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-menu')));
  $$('a', mm).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') { setMenu(false); setDD(false); } });
  addEventListener('resize', () => { if (innerWidth > 1023) setMenu(false); });

  /* ---------- AI tools: docked tab bar + stacked sticky cards ---------- */
  const tabs = $$('.tab'), ink = $('.tabs__ink'), tabsBar = $('.tabs'), tabsIn = $('.tabs__in');
  const cards = $$('.feature'), anchors = $$('.stack-anchor'), features = $('#features');
  let current = 0, stTops = [], heights = [], cardFit = [], radius = 40, tabsTop = 0, stepLift = 10, tabsShift = 0, lead = 40;
  const clipCache = [], tfCache = [];
  const moveInk = () => {
    const t = tabs[current];
    ink.style.setProperty('--x', `${t.offsetLeft}px`);
    ink.style.setProperty('--w', `${t.offsetWidth}px`);
  };
  const activate = i => {
    if (i === current) return;
    current = i;
    tabs.forEach((t, k) => { t.classList.toggle('is-active', k === i); t.setAttribute('aria-selected', k === i); });
    moveInk();
    const t = tabs[i];
    if (tabsIn.scrollWidth > tabsIn.clientWidth) tabsIn.scrollTo({ left: t.offsetLeft - (tabsIn.clientWidth - t.offsetWidth) / 2 });
  };
  const tabsDockBottom = () => (tabsTop = parseFloat(getComputedStyle(tabsBar).top)) + tabsBar.offsetHeight;
  const layoutStack = () => {
    const small = innerWidth < 768;
    const gap = small ? 12 : 16;
    // keep the same tab-bar → card spacing as the resting layout (Figma: 40px)
    lead = parseFloat(getComputedStyle(features).marginTop) || 40;
    const base = tabsDockBottom() + lead;
    radius = parseFloat(getComputedStyle(cards[0]).borderTopLeftRadius) || 40;
    // all four cards share one height (the tallest), so the size never changes from card to card
    cards.forEach(c => (c.style.minHeight = ''));
    const tallest = Math.max(...cards.map(c => c.offsetHeight));
    cards.forEach(c => (c.style.minHeight = `${tallest}px`));
    const raw = cards.map(c => c.offsetHeight);
    // desktop: shrink a card slightly if it can't fit under the docked tab bar; small screens: let it slide up instead
    // one shared scale so every card keeps the same size
    const f = Math.min(...raw.map(h => (innerHeight - base - gap) / h));
    const fit = 1;   // cards always keep their design size (1280×702)
    cardFit = raw.map(() => fit);
    heights = raw.map((h, i) => h * cardFit[i]);
    // every card docks at the same spot, so the tab bar → card gap never changes
    // keep the 40px gap whenever the card (nearly) fits — at most its bottom padding runs past the fold;
    // only cards far taller than the screen (phones) slide up so their lower content stays reachable
    const pad = parseFloat(getComputedStyle(cards[0]).paddingBottom) || 40;
    stTops = cards.map((c, i) => Math.round(heights[i] <= innerHeight - base + pad ? base : Math.min(base, innerHeight - heights[i] - gap)));
    stepLift = Math.min(10, (lead - 6) / 3);
    cards.forEach((c, i) => c.style.setProperty('--st', `${stTops[i]}px`));
    $('#tools').style.setProperty('--card-h', `${raw[raw.length - 1]}px`);   // on the section so the spacer sees it too
  };
  const stackFrame = () => {
    const r0 = tabsBar.getBoundingClientRect();
    const fb = features.getBoundingClientRect().bottom;
    const aTop = anchors.map(a => a.getBoundingClientRect().top);
    // where each card currently sits (sticky maths, untransformed)
    const top = cards.map((c, i) => Math.min(Math.max(aTop[i], stTops[i]), fb - heights[i]));
    const tb = r0;   // tab bar is released natively together with the last card (see .tools__stick)
    const isDockedPos = r0.top <= tabsTop + 0.5;
    tabsDocked = isDockedPos && tb.bottom > 0 && fb > 0;
    let active = 0;
    // cover progress of card i by card i+1 (0 → 1)
    const prog = cards.map((c, i) => {
      if (i === cards.length - 1) return 0;
      const span = Math.max(1, heights[i] - (stTops[i + 1] - stTops[i]));
      return Math.min(1, Math.max(0, (top[i] + heights[i] - top[i + 1]) / span));
    });
    cards.forEach((c, i) => {
      const p = prog[i];
      // depth = how many cards now sit on top; deeper cards shrink more and peek higher inside the gap
      let depth = 0;
      for (let k = i; k < cards.length - 1 && prog[k] > 0; k++) depth += prog[k];
      const s = 1, lift = 0;   // covered cards stay exactly as designed — no shrink, no lift
      const tf = '';
      if (tfCache[i] !== tf) { c.style.transform = tf; tfCache[i] = tf; }
      // soft edge shadow only while a card is sliding over (gone once it has docked)
      if (i + 1 < cards.length) cards[i + 1].style.setProperty('--sh', (4 * p * (1 - p)).toFixed(3));
      // a card never shows inside the 40px gap under the tab bar: anything that scrolls higher is masked
      // (rounded, so the visible edge always looks like the card's own top edge)
      const visTop = top[i] - lift;
      const cut = Math.max(0, tb.bottom + lead - visTop) / s;
      const clip = cut > 0.5 ? `inset(${cut.toFixed(1)}px 0 0 0 round ${radius}px)` : '';
      if (clipCache[i] !== clip) { c.style.clipPath = clip; clipCache[i] = clip; }
      // run illustration loops only on the card that is actually visible
      const onScreen = top[i] < innerHeight && top[i] + heights[i] > 0;
      c.classList.toggle('is-live', onScreen && p < 0.97);
      if (i > 0 && aTop[i] < stTops[i] + heights[i - 1] * 0.5) active = i;
    });
    activate(active);
  };
  const scrollToCard = i => smoothTo(docTop(anchors[i]) - stTops[i]);
  layoutStack(); moveInk();
  addEventListener('resize', () => { layoutStack(); moveInk(); stackFrame(); });
  document.fonts && document.fonts.ready.then(() => { layoutStack(); moveInk(); stackFrame(); });
  new ResizeObserver(() => { layoutStack(); stackFrame(); }).observe(cards[0]);
  tabs.forEach((t, i) => t.addEventListener('click', e => {
    e.preventDefault();
    scrollToCard(i);
    history.replaceState(null, '', `#${t.dataset.target}`);
  }));
  tabs.forEach((t, i) => t.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[n].focus(); tabs[n].click();
  }));
  const spy = stackFrame;

  /* ---------- parallax (hero bg, CTA photo) ---------- */
  const heroImg = $('.hero__bg img'), ctaPhoto = $('.cta__photo img'), cta = $('#cta');
  const parallax = () => {
    if (reduce) return;
    const y = scrollY;
    if (y < 900) heroImg.style.setProperty('--py', `${y * 0.25}px`);
    const r = cta.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) {
      const k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      ctaPhoto.style.setProperty('--py', `${(k * -24).toFixed(1)}px`);
    }
  };

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { spy(); onScroll(); parallax(); ticking = false; });
  }, { passive: true });
  addEventListener('scrollend', () => { spy(); onScroll(); });
  spy(); onScroll(); parallax();
  addEventListener('load', () => { layoutStack(); stackFrame(); });

  /* ---------- trusted logos marquee: duplicate for seamless loop ---------- */
  const track = $('.logos__track');
  $$('.logo', track).forEach(l => { const c = l.cloneNode(true); c.classList.add('logo--clone'); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  const mq = matchMedia('(max-width:1023px)');
  const syncClones = () => $$('.logo--clone', track).forEach(c => (c.style.display = mq.matches ? '' : 'none'));
  mq.addEventListener('change', syncClones); syncClones();

  /* ---------- testimonials: collapsed with fade, expand on click ---------- */
  const testi = $('#testimonials'), wrap = $('#testiWrap'), grid = $('#testiGrid'), more = $('#testiMore');
  const tcards = $$('.tcard', grid);
  const collapsedHeight = () => {
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const fadeRow = tcards.slice(cols, cols * 2);       // second row is the faded one (as in the design)
    if (!fadeRow.length) return null;
    const bottom = Math.max(...fadeRow.map(c => c.offsetTop + c.offsetHeight));
    const h = Math.max(...fadeRow.map(c => c.offsetHeight));
    wrap.style.setProperty('--fade-h', `${h}px`);
    return bottom;
  };
  const layoutTesti = () => {
    if (testi.classList.contains('is-open')) { wrap.style.height = 'auto'; return; }
    const h = collapsedHeight();
    wrap.style.height = h ? `${h}px` : 'auto';
  };
  layoutTesti();
  addEventListener('resize', layoutTesti);
  document.fonts && document.fonts.ready.then(layoutTesti);
  more.addEventListener('click', () => {
    wrap.style.height = `${wrap.offsetHeight}px`;
    testi.classList.add('is-open');
    more.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      wrap.style.height = `${grid.offsetHeight}px`;
      const done = () => { wrap.style.height = 'auto'; wrap.removeEventListener('transitionend', done); };
      wrap.addEventListener('transitionend', done);
    });
  });

  /* ---------- FAQ accordion (one open at a time) ---------- */
  const qas = $$('.qa');
  qas.forEach(qa => {
    const btn = $('.qa__q', qa);
    btn.addEventListener('click', () => {
      const open = !qa.classList.contains('is-open');
      qas.forEach(o => { o.classList.remove('is-open'); $('.qa__q', o).setAttribute('aria-expanded', 'false'); });
      if (open) { qa.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- blog carousel: infinite, auto-advancing loop ---------- */
  {
    const vp = $('.blog__viewport'), bt = $('#blogTrack'), prev = $('#blogPrev'), next = $('#blogNext');
    const originals = $$('.post', bt), N = originals.length;
    const HOLD = 3200;                       // pause on each slide
    const mkClone = el => { const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; $$('a,button', c).forEach(x => (x.tabIndex = -1)); c.classList.add('is-clone'); return c; };
    originals.slice().reverse().forEach(p => bt.prepend(mkClone(p)));   // [clones][originals][clones]
    originals.forEach(p => bt.append(mkClone(p)));
    $$('img', bt).forEach(im => (im.loading = 'eager'));
    let idx = N, stepW = 435, x = 0, timer = 0, hover = false, inView = false, dragging = false, moving = false;
    const measure = () => { const p = $('.post', bt); stepW = p.getBoundingClientRect().width + parseFloat(getComputedStyle(bt).columnGap || 24); };
    const setX = (v, anim) => {
      x = v;
      bt.classList.toggle('is-anim', !!anim);
      bt.style.setProperty('--bx', `${v.toFixed(2)}px`);
    };
    const place = anim => setX(-idx * stepW, anim);
    const normalize = () => {
      let moved = false;
      while (idx >= 2 * N) { idx -= N; moved = true; }
      while (idx < N) { idx += N; moved = true; }
      if (moved) { place(false); void bt.offsetWidth; }
    };
    const go = d => {
      if (reduce) { idx += d; normalize(); place(false); return; }
      if (moving) normalize();
      idx += d; moving = true; place(true);
    };
    bt.addEventListener('transitionend', e => {
      if (e.target !== bt || e.propertyName !== 'transform') return;
      moving = false; bt.classList.remove('is-anim'); normalize();
    });
    const canRun = () => inView && !hover && !dragging && !document.hidden && !reduce;
    const schedule = () => { clearTimeout(timer); timer = setTimeout(tickAuto, HOLD); };
    const tickAuto = () => { if (canRun()) go(1); schedule(); };
    const restart = () => schedule();
    prev.addEventListener('click', () => { go(-1); restart(); });
    next.addEventListener('click', () => { go(1); restart(); });
    vp.addEventListener('mouseenter', () => (hover = true));
    vp.addEventListener('mouseleave', () => { hover = false; restart(); });
    vp.addEventListener('focusin', () => (hover = true));
    vp.addEventListener('focusout', () => (hover = false));
    new IntersectionObserver(es => es.forEach(e => (inView = e.isIntersecting)), { threshold: 0.25 }).observe(vp);
    addEventListener('resize', () => { measure(); normalize(); place(false); });
    document.fonts && document.fonts.ready.then(() => { measure(); place(false); });
    measure(); place(false); schedule();

    // drag / swipe with release velocity
    let sx = 0, sy = 0, x0 = 0, lastX = 0, lastT = 0, vx = 0, moved = false, axis = '';
    bt.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      if (moving) { const m = new DOMMatrix(getComputedStyle(bt).transform); setX(m.m41, false); moving = false; idx = Math.round(-x / stepW); }
      dragging = true; moved = false; axis = ''; sx = lastX = e.clientX; sy = e.clientY; x0 = x; lastT = performance.now(); vx = 0;
    });
    addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis !== 'x') return;
      moved = true; bt.classList.add('is-drag');
      const now = performance.now(); vx = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
      setX(x0 + dx, false);
    }, { passive: true });
    const end = () => {
      if (!dragging) return;
      dragging = false; bt.classList.remove('is-drag');
      if (!moved) return;
      const projected = x + vx * 220;                          // a flick carries a little further
      idx = Math.round(-projected / stepW);
      moving = true; place(true); restart();
    };
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    bt.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    bt.addEventListener('dragstart', e => e.preventDefault());
    addEventListener('keydown', e => {
      if (!vp.matches(':focus-within')) return;
      if (e.key === 'ArrowRight') { go(1); restart(); } else if (e.key === 'ArrowLeft') { go(-1); restart(); }
    });
  }

  /* ---------- newsletter ---------- */
  const form = $('#news'), email = $('#newsEmail'), msg = $('#newsMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    msg.classList.toggle('is-err', !ok);
    msg.textContent = ok ? 'Thanks! You’re subscribed.' : 'Please enter a valid email address.';
    if (ok) email.value = '';
  });

  /* ---------- in-page anchors: eased scroll, offset for fixed nav / stacked cards ---------- */
  $$('a[href^="#"]').forEach(a => {
    if (a.classList.contains('tab')) return;
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      if (!id) { e.preventDefault(); return; }
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      const k = anchors.indexOf(t);
      if (k > -1) scrollToCard(k);
      else smoothTo(id === 'top' ? 0 : docTop(t) - (parseFloat(getComputedStyle(t).scrollMarginTop) || 0));
    });
  });

  /* ---------- AI tools illustrations: looping, paused when off-screen ---------- */
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const wait = async (card, ms) => {
    let left = ms;
    while (left > 0) {
      if (document.hidden || !card.classList.contains('is-live')) { await sleep(150); continue; }
      const d = Math.min(left, 100); await sleep(d); left -= d;
    }
  };
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const tween = (el, from, to, dur) => new Promise(res => {
    const t0 = performance.now();
    const f = now => {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(from + (to - from) * easeIO(k));
      k < 1 ? requestAnimationFrame(f) : res();
    };
    requestAnimationFrame(f);
  });
  const reflow = el => void el.offsetWidth;
  const loops = {
    async jobs(mk, card) {
      const hl = $('.jobs__hl', mk), p = $('.jobs__hl-txt p', hl), b = $('b', p);
      const titles = ['Senior Product Designer', 'UX Researcher', 'Senior Data Scientist', 'Marketing Manager', 'Marketing Executive'];
      let n = 0;
      for (;;) {
        await wait(card, 1500);
        hl.classList.add('is-press'); await wait(card, 260);
        hl.classList.remove('is-press'); hl.classList.add('is-done');
        await wait(card, 1700);
        hl.classList.add('is-swap'); await wait(card, 600);
        n = (n + 1) % titles.length; b.textContent = titles[n];
        hl.classList.remove('is-done', 'is-swap'); hl.classList.add('is-pre'); reflow(p);
        hl.classList.remove('is-pre');
        await wait(card, 650);
      }
    },
    async resume(mk, card) {
      const score = $('[data-n="70"]', mk), issues = $('[data-n="12"]', mk);
      for (;;) {
        await wait(card, 2600);
        mk.classList.remove('is-run'); mk.classList.add('is-hide', 'is-reset');
        tween(score, 70, 0, 800); tween(issues, 12, 0, 800);
        await wait(card, 1000);
        mk.classList.remove('is-reset'); reflow(mk); mk.classList.add('is-run');
        tween(score, 0, 70, 1800); tween(issues, 0, 12, 1800);
        await wait(card, 1700);
        mk.classList.remove('is-hide');
        await wait(card, 1300);
        mk.classList.add('is-pulse'); await wait(card, 500); mk.classList.remove('is-pulse');
      }
    },
    async interview(mk, card) {
      const timer = $('[data-timer]', mk);
      let secs = 30 * 60 + 56;
      (async () => { for (;;) { await wait(card, 1000); secs++; timer.textContent = `${String(Math.floor(secs / 60) % 60).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`; } })();
      // split transcript into words (keeps the bold speaker label)
      let idx = 0;
      $$('.iv__t', mk).forEach((t, pi) => {
        const parts = [];
        t.childNodes.forEach(nd => {
          const bold = nd.nodeName === 'B';
          nd.textContent.split(/(\s+)/).forEach(w => {
            if (!w) return;
            if (/^\s+$/.test(w)) { parts.push(document.createTextNode(w)); return; }
            const s = document.createElement(bold ? 'b' : 'span');
            s.className = 'w'; s.textContent = w;
            s.style.transitionDelay = `${(idx++ * 0.06 + pi * 0.35).toFixed(2)}s`;
            parts.push(s);
          });
        });
        t.replaceChildren(...parts);
      });
      for (;;) {
        await wait(card, 3200);
        mk.classList.add('is-hide'); await wait(card, 700);
        mk.classList.remove('is-hide');
        await wait(card, idx * 60 + 1000);
      }
    },
    async quiz(mk, card) {
      const o = n => $(`[data-o="${n}"]`, mk), bar = $('.qz__bar', mk);
      for (;;) {
        await wait(card, 2600);
        mk.classList.add('is-hide'); await wait(card, 550);
        o(1).classList.remove('is-wrong'); o(2).classList.remove('is-right');
        bar.style.setProperty('--pr', '.42');
        mk.classList.remove('is-hide'); await wait(card, 1100);
        o(1).classList.add('is-pick'); await wait(card, 550);
        o(1).classList.remove('is-pick'); o(1).classList.add('is-wrong', 'is-shake');
        await wait(card, 900); o(1).classList.remove('is-shake');
        o(2).classList.add('is-pick'); await wait(card, 500);
        o(2).classList.remove('is-pick'); o(2).classList.add('is-right');
        bar.style.setProperty('--pr', '.5347');
      }
    }
  };
  if (!reduce) $$('[data-anim]').forEach(mk => loops[mk.dataset.anim](mk, mk.closest('.feature')));

  /* ---------- "Find your ideal opportunity" step illustrations: looping, paused off-screen ---------- */
  const steps = $$('.step');
  const sio = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-live', e.isIntersecting)), { rootMargin: '80px 0px' });
  steps.forEach(s => sio.observe(s));
  const stepLoops = {
    async resume(art, card) {
      // write order: top to bottom, left to right
      const bars = $$('.b', art).sort((a, b) => (parseFloat(a.style.top) - parseFloat(b.style.top)) || (parseFloat(a.style.left) - parseFloat(b.style.left)));
      bars.forEach((b, i) => b.style.setProperty('--i', i));
      const chips = $$('.chip', art).sort((a, b) => parseFloat(a.style.top) - parseFloat(b.style.top));
      chips.forEach((ch, i) => ch.style.setProperty('--ci', i));
      art.classList.add('is-anim', 'is-snap'); reflow(art); art.classList.remove('is-snap');
      for (;;) {
        await wait(card, 400);
        art.classList.add('is-fill');
        await wait(card, bars.length * 130 + 700 + 2600);   // write in, then hold
        art.classList.add('is-fade');
        await wait(card, 600);
        art.classList.add('is-snap'); art.classList.remove('is-fill', 'is-fade'); reflow(art); art.classList.remove('is-snap');
      }
    },
    async orbit() { /* pure CSS loop */ },
    async algo(art, card) {
      const rows = $$('.algo li', art);
      art.classList.add('is-anim');
      for (let n = 0; ; n = (n + 1) % rows.length) {
        rows.forEach((r, i) => r.classList.toggle('is-on', i === n));
        await wait(card, 1500);
      }
    }
  };
  if (!reduce) $$('[data-steps-anim]').forEach(art => stepLoops[art.dataset.stepsAnim](art, art.closest('.step')));

  /* ---------- How It Helps: progressive timeline driven by scroll (damped for smoothness) ---------- */
  const tl = $('#timeline');
  if (tl) {
    const items = $$('li', tl), fill = $('.timeline__fill', tl);
    let geo = null, cur = reduce ? 1 : 0, target = 0, raf = 0;
    const measure = () => {
      const base = tl.getBoundingClientRect().top;
      const dots = items.map(li => li.getBoundingClientRect().top - base + 12);   // dot centre (top 8 + 4)
      geo = { dots, first: dots[0], span: dots[dots.length - 1] - dots[0] };
      tl.style.setProperty('--ft', `${geo.first}px`);
      tl.style.setProperty('--fh', `${geo.span}px`);
    };
    const paint = p => {
      tl.style.setProperty('--tp', p.toFixed(4));
      const reach = geo.first + p * geo.span;
      items.forEach((li, i) => li.classList.toggle('is-on', geo.dots[i] <= reach + 0.5));
    };
    const readTarget = () => {
      // the line draws as the timeline crosses from 80% to 50% of the viewport height
      const r = tl.getBoundingClientRect();
      const startY = innerHeight * 0.8, endY = innerHeight * 0.5;
      const a = r.top + geo.first, b = r.top + geo.first + geo.span;
      const k = (startY - a) / ((startY - endY) + (b - a));
      target = Math.min(1, Math.max(0, k));
    };
    const tick = () => {
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.0005) cur = target;
      paint(cur);
      raf = cur === target ? 0 : requestAnimationFrame(tick);
    };
    const kick = () => { if (!geo) return; readTarget(); if (reduce) { cur = target; paint(cur); return; } if (!raf) raf = requestAnimationFrame(tick); };
    measure(); readTarget(); cur = reduce ? target : 0; paint(cur);
    addEventListener('scroll', kick, { passive: true });
    addEventListener('resize', () => { measure(); kick(); });
    document.fonts && document.fonts.ready.then(() => { measure(); kick(); });
    kick();
  }
})();
