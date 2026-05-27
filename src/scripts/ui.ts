// ui.ts — Global UI behaviours ported from legacy/index.html
// Each init is idempotent (dataset.bound guard) and no-ops when root node absent.
import { $, $$ } from './dom';
import { HERO_COPY, type Mode } from '../data/hero';
import { TOPBAR_MESSAGES } from '../data/site';

export function initUI(): void {
  initTopbar();
  initModeToggle();
  initSlider();
  initMobileMenu();
  initFooterAccordion();
  initReveal();
}

/* ---------- TopBar carousel (legacy 1371–1398) ---------- */
function initTopbar(): void {
  const topbar = $<HTMLElement>('#topbar');
  if (!topbar || topbar.dataset.bound) return;
  topbar.dataset.bound = '1';

  // If cookie set, remove immediately
  if (document.cookie.includes('ds_topbar_dismissed=1')) {
    topbar.remove();
    return;
  }

  const topbarText = $<HTMLElement>('#topbarText');
  const topbarMsg = $<HTMLElement>('#topbarMsg');
  const topbarDots = $$<HTMLElement>('.topbar__dot');
  let topbarIdx = 0;

  const interval = setInterval(() => {
    topbarIdx = (topbarIdx + 1) % TOPBAR_MESSAGES.length;
    if (topbarMsg) topbarMsg.style.opacity = '0';
    setTimeout(() => {
      if (topbarText) topbarText.textContent = TOPBAR_MESSAGES[topbarIdx];
      if (topbarMsg) topbarMsg.style.opacity = '1';
      topbarDots.forEach((d, i) => d.classList.toggle('active', i === topbarIdx));
    }, 200);
  }, 6000);

  const closeBtn = $<HTMLElement>('#topbarClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      topbar.remove();
      clearInterval(interval);
      try { document.cookie = 'ds_topbar_dismissed=1;path=/;max-age=86400'; } catch (_) {}
    });
  }
}

/* ---------- Mode toggle (legacy 1507–1525) ---------- */
function initModeToggle(): void {
  const btns = $$<HTMLButtonElement>('.mode-toggle__btn');
  if (!btns.length) return;
  // Guard with the first button
  if (btns[0].dataset.bound) return;
  btns.forEach(b => { b.dataset.bound = '1'; });

  let currentMode: Mode = (localStorage.getItem('ds_mode') as Mode) || 'user';

  const applyMode = (m: Mode) => {
    currentMode = m;
    localStorage.setItem('ds_mode', m);
    const c = HERO_COPY[m];

    // Hero nodes (may not exist yet — null-guard each)
    const heroKicker = $<HTMLElement>('#heroKicker');
    const heroH1A = $<HTMLElement>('#heroH1A');
    const heroH1B = $<HTMLElement>('#heroH1B');
    const heroSub = $<HTMLElement>('#heroSub');
    const heroCtaPrimary = $<HTMLElement>('#heroCtaPrimary');
    const heroCtaSecondary = $<HTMLElement>('#heroCtaSecondary');
    if (heroKicker) heroKicker.textContent = c.kicker;
    if (heroH1A) heroH1A.textContent = c.h1A;
    if (heroH1B) heroH1B.textContent = c.h1B;
    if (heroSub) heroSub.textContent = c.sub;
    if (heroCtaPrimary) { const sp = heroCtaPrimary.querySelector('span'); if (sp) sp.textContent = c.primary; }
    if (heroCtaSecondary) { const sp = heroCtaSecondary.querySelector('span'); if (sp) sp.textContent = c.secondary; }

    // Prefooter nodes (data-pf attrs)
    const pfKicker = $<HTMLElement>('[data-pf="kicker"]');
    const pfH2 = $<HTMLElement>('[data-pf="h2"]');
    const pfSub = $<HTMLElement>('[data-pf="sub"]');
    if (pfKicker) pfKicker.textContent = c.pfKicker;
    if (pfH2) pfH2.textContent = c.pfH2;
    if (pfSub) pfSub.textContent = c.pfSub;

    // Sync all mode-toggle buttons across header + mobile drawer
    $$<HTMLButtonElement>('.mode-toggle__btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
  };

  btns.forEach(btn => btn.addEventListener('click', () => applyMode(btn.dataset.mode as Mode)));
  applyMode(currentMode);
}

/* ---------- Before/After slider (legacy 1527–1562) ---------- */
function initSlider(): void {
  const slider = $<HTMLElement>('#slider');
  if (!slider) return;
  if (slider.dataset.bound) return;
  slider.dataset.bound = '1';

  const before = $<HTMLElement>('#sliderBefore');
  const handle = $<HTMLElement>('#sliderHandle');
  const knob = $<HTMLElement>('#sliderKnob');
  let dragging = false;

  const update = (clientX: number) => {
    const r = slider.getBoundingClientRect();
    let p = ((clientX - r.left) / r.width) * 100;
    p = Math.max(2, Math.min(98, p));
    if (before) {
      before.style.clipPath = `polygon(0 0,${p}% 0,${p}% 100%,0 100%)`;
      // @ts-ignore: vendor prefix
      before.style.webkitClipPath = `polygon(0 0,${p}% 0,${p}% 100%,0 100%)`;
    }
    if (handle) handle.style.left = p + '%';
    if (knob) knob.style.left = p + '%';
  };

  const onDown = (e: MouseEvent | TouchEvent) => {
    dragging = true;
    document.body.style.userSelect = 'none';
    const cx = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    update(cx);
  };
  const onMove = (e: MouseEvent | TouchEvent) => {
    if (!dragging) return;
    if (e.cancelable) e.preventDefault();
    const cx = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    update(cx);
  };
  const onUp = () => { dragging = false; document.body.style.userSelect = ''; };

  slider.addEventListener('mousedown', onDown as EventListener);
  slider.addEventListener('touchstart', onDown as EventListener, { passive: true });
  window.addEventListener('mousemove', onMove as EventListener);
  window.addEventListener('touchmove', onMove as EventListener, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
}

/* ---------- Mobile menu (legacy 1816–1828) ---------- */
function initMobileMenu(): void {
  const menuBtn = $<HTMLElement>('#menuBtn');
  if (!menuBtn || menuBtn.dataset.bound) return;
  menuBtn.dataset.bound = '1';

  const menuDrawer = $<HTMLElement>('#menuDrawer');
  const menuBackdrop = $<HTMLElement>('#menuBackdrop');
  const menuClose = $<HTMLElement>('#menuClose');

  const openMenu = () => {
    menuDrawer?.classList.add('open');
    menuBackdrop?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeMenu = () => {
    menuDrawer?.classList.remove('open');
    menuBackdrop?.classList.remove('open');
    document.body.style.overflow = '';
  };

  menuBtn.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  menuBackdrop?.addEventListener('click', closeMenu);
  $$('.menu-drawer__nav a').forEach(a => a.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeMenu();
  });
}

/* ---------- Footer accordion (mobile, legacy 1854–1865) ---------- */
function initFooterAccordion(): void {
  const heads = $$<HTMLElement>('[data-accordion] .footer__col-head');
  if (!heads.length) return;
  if (heads[0].dataset.bound) return;
  heads.forEach(head => {
    head.dataset.bound = '1';
    head.addEventListener('click', () => {
      if (window.innerWidth > 1024) return;
      const col = head.parentElement!;
      const wasOpen = col.classList.contains('open');
      $$('[data-accordion]').forEach(c => c.classList.remove('open'));
      if (!wasOpen) col.classList.add('open');
      const icon = head.querySelector('use');
      if (icon) icon.setAttribute('href', col.classList.contains('open') ? '#i-minus' : '#i-plus');
    });
  });
}

/* ---------- Scroll reveal (legacy 1909–1917) ---------- */
function initReveal(): void {
  if (typeof IntersectionObserver === 'undefined') {
    $$('.reveal').forEach(el => el.classList.add('in'));
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
    $$('.reveal').forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  $$<HTMLElement>('.reveal').forEach(el => {
    if (!el.dataset.revealBound) {
      el.dataset.revealBound = '1';
      io.observe(el);
    }
  });
}
