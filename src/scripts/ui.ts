// ui.ts — Global UI behaviours ported from legacy/index.html
// Each init is idempotent (dataset.bound guard) and no-ops when root node absent.
import { $, $$ } from './dom';
import { HERO_COPY, type Mode } from '../data/hero';
import { TOPBAR_MESSAGES } from '../data/site';

// Module-level state for slider (window listeners attached only once)
let _dragging = false;
let _sliderEl: HTMLElement | null = null;

// Module-level singleton IntersectionObserver for reveal
let _revealIO: IntersectionObserver | null = null;

// Module-level guards for once-per-session document/window listeners.
// Use module state (persists across Astro View Transitions) rather than a
// `document.body.dataset.*` flag, because Astro replaces <body> on each swap.
let _menuKeyBound = false;
let _sliderWinBound = false;
let _topbarInterval: ReturnType<typeof setInterval> | null = null;

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

  // Clear any interval from a previous page (avoid orphaned timers across navigations)
  if (_topbarInterval) clearInterval(_topbarInterval);
  _topbarInterval = setInterval(() => {
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
      if (_topbarInterval) { clearInterval(_topbarInterval); _topbarInterval = null; }
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
  const el = $<HTMLElement>('#slider');
  if (!el || el.dataset.bound) return;
  el.dataset.bound = '1';
  _sliderEl = el;

  const sliderUpdate = (clientX: number) => {
    if (!_sliderEl) return;
    const r = _sliderEl.getBoundingClientRect();
    let p = ((clientX - r.left) / r.width) * 100;
    p = Math.max(2, Math.min(98, p));
    const before = $<HTMLElement>('#sliderBefore');
    const handle = $<HTMLElement>('#sliderHandle');
    const knob = $<HTMLElement>('#sliderKnob');
    if (before) {
      before.style.clipPath = `polygon(0 0,${p}% 0,${p}% 100%,0 100%)`;
      // @ts-ignore: vendor prefix
      before.style.webkitClipPath = `polygon(0 0,${p}% 0,${p}% 100%,0 100%)`;
    }
    if (handle) handle.style.left = p + '%';
    if (knob) knob.style.left = p + '%';
  };

  const onDown = (e: MouseEvent | TouchEvent) => {
    _dragging = true;
    document.body.style.userSelect = 'none';
    const cx = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
    sliderUpdate(cx);
  };

  // Attach start-drag listeners to the node (safe — node is fresh each page)
  el.addEventListener('mousedown', onDown as EventListener);
  el.addEventListener('touchstart', onDown as EventListener, { passive: true });

  // Attach window move/up/end listeners ONCE per session (module guard; handlers use module state)
  if (!_sliderWinBound) {
    _sliderWinBound = true;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!_dragging || !_sliderEl) return;
      if (e.cancelable) e.preventDefault();
      const cx = (e as TouchEvent).touches ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      sliderUpdate(cx);
    };
    const onUp = () => { _dragging = false; document.body.style.userSelect = ''; };

    window.addEventListener('mousemove', onMove as EventListener);
    window.addEventListener('touchmove', onMove as EventListener, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }
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
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeMenu = () => {
    menuDrawer?.classList.remove('open');
    menuBackdrop?.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  menuBtn.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  menuBackdrop?.addEventListener('click', closeMenu);
  $$('.menu-drawer__nav a').forEach(a => a.addEventListener('click', closeMenu));

  // Attach the Escape handler ONCE per session. Module guard (Astro replaces <body> on swap,
  // so a body dataset flag would reset and stack listeners). Query live nodes by id at call
  // time so it always acts on the current page's drawer, not a stale closure.
  if (!_menuKeyBound) {
    _menuKeyBound = true;
    document.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key !== 'Escape') return;
      document.getElementById('menuDrawer')?.classList.remove('open');
      document.getElementById('menuBackdrop')?.classList.remove('open');
      document.getElementById('menuBtn')?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  }
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
  // Lazily create the singleton observer once per session
  if (!_revealIO) {
    _revealIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); _revealIO!.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
  }
  $$<HTMLElement>('.reveal').forEach(el => {
    if (!el.dataset.revealBound) {
      el.dataset.revealBound = '1';
      _revealIO!.observe(el);
    }
  });
}
