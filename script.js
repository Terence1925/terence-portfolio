document.getElementById('year').textContent = new Date().getFullYear();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- loader ---------- */
function initLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;
  const hide = () => loader.classList.add('is-hidden');
  const minDelay = prefersReducedMotion ? 0 : 500;
  window.addEventListener('load', () => setTimeout(hide, minDelay));
  setTimeout(hide, 3000); // safety fallback
}
initLoader();

/* ---------- theme toggle ---------- */
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  const root = document.documentElement;
  const stored = localStorage.getItem('tt-theme');
  if (stored) root.setAttribute('data-theme', stored);
  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('tt-theme', next);
  });
}
initTheme();

/* ---------- mobile nav ---------- */
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');
navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', open);
});
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', false);
  });
});

/* ---------- scroll progress bar ---------- */
const progressBar = document.getElementById('progressBar');
function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}
window.addEventListener('scroll', () => requestAnimationFrame(updateProgress), { passive: true });
updateProgress();

/* ---------- header border on scroll ---------- */
const header = document.getElementById('siteHeader');
function updateHeader() {
  header.style.borderBottomColor = window.scrollY > 12 ? 'var(--line)' : 'var(--line-soft)';
}
window.addEventListener('scroll', () => requestAnimationFrame(updateHeader), { passive: true });

/* ---------- section scrollspy: nav links + side dots ---------- */
function initScrollspy() {
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const indicator = document.getElementById('navIndicator');
  const dotBtns = Array.from(document.querySelectorAll('.dot-btn'));
  const sections = Array.from(document.querySelectorAll('.snap-section'));

  function moveIndicator(link) {
    if (!link || link.classList.contains('nav-cta')) { indicator.classList.remove('is-active'); return; }
    const navRect = nav.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    indicator.style.width = rect.width + 'px';
    indicator.style.transform = `translateX(${rect.left - navRect.left}px)`;
    indicator.classList.add('is-active');
  }

  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = '#' + entry.target.id;
      const link = navLinks.find(l => l.getAttribute('href') === id);
      navLinks.forEach(l => l.classList.remove('is-active'));
      if (link) { link.classList.add('is-active'); moveIndicator(link); }

      const dot = dotBtns.find(d => d.dataset.goto === id);
      dotBtns.forEach(d => d.classList.remove('is-active'));
      if (dot) dot.classList.add('is-active');

      if (entry.target.classList.contains('contact')) entry.target.classList.add('is-inview');
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach(s => spy.observe(s));
  window.addEventListener('resize', () => {
    const active = navLinks.find(l => l.classList.contains('is-active'));
    if (active) moveIndicator(active);
  });

  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.dataset.goto);
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
}
initScrollspy();

/* ---------- reveal on scroll ---------- */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

const staggerCounts = new Map();
document.querySelectorAll('[data-reveal]').forEach(el => {
  const parent = el.parentElement;
  const idx = staggerCounts.get(parent) || 0;
  staggerCounts.set(parent, idx + 1);
  if (!prefersReducedMotion) {
    el.style.transitionDelay = Math.min(idx, 5) * 80 + 'ms';
  }
  observer.observe(el);
});

// safety net: never let content stay permanently hidden if the observer
// misses an element for any reason (fast scroll-snap jumps, edge cases, etc.)
function revealAnyOnscreen() {
  document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-visible');
    }
  });
}
window.addEventListener('scroll', () => requestAnimationFrame(revealAnyOnscreen), { passive: true });
setTimeout(revealAnyOnscreen, 1200);
setTimeout(() => {
  // final hard guarantee: after 6s, reveal everything outright regardless of position
  document.querySelectorAll('[data-reveal]:not(.is-visible)').forEach(el => el.classList.add('is-visible'));
}, 6000);

/* ---------- animated counters ---------- */
function initCounters() {
  const stats = document.querySelectorAll('.hero-stats strong');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || '';
      if (prefersReducedMotion) {
        el.textContent = target + suffix;
      } else {
        const duration = 1100;
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  stats.forEach(el => counterObserver.observe(el));
}
initCounters();

/* ---------- tilt ---------- */
function initTilt() {
  if (!supportsHover || prefersReducedMotion) return;
  document.querySelectorAll('.tilt').forEach(el => {
    const max = parseFloat(el.dataset.tiltMax) || 8;
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * max * 2;
      const rotateX = (0.5 - py) * max * 2;
      el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}
initTilt();

/* ---------- magnetic buttons ---------- */
function initMagneticButtons() {
  if (!supportsHover || prefersReducedMotion) return;
  document.querySelectorAll('.magnetic').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}
initMagneticButtons();

/* ---------- hero glow parallax ---------- */
function initHeroParallax() {
  if (!supportsHover || prefersReducedMotion) return;
  const hero = document.querySelector('.hero');
  const glow1 = document.querySelector('.hero-glow-1');
  const glow2 = document.querySelector('.hero-glow-2');
  if (!hero || !glow1 || !glow2) return;
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    glow1.style.setProperty('--px', px * -40 + 'px');
    glow1.style.setProperty('--py', py * -40 + 'px');
    glow2.style.setProperty('--px', px * 40 + 'px');
    glow2.style.setProperty('--py', py * 40 + 'px');
  });
  hero.addEventListener('mouseleave', () => {
    [glow1, glow2].forEach(el => { el.style.removeProperty('--px'); el.style.removeProperty('--py'); });
  });
}
initHeroParallax();

/* ---------- spotlight cursor glow ---------- */
function initSpotlight() {
  if (!supportsHover || prefersReducedMotion) return;
  document.querySelectorAll('.spotlight').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width) * 100 + '%');
      el.style.setProperty('--my', ((e.clientY - rect.top) / rect.height) * 100 + '%');
    });
  });
}
initSpotlight();

/* ---------- ambient orb parallax (about, skills, contact) ---------- */
function initOrbParallax() {
  if (!supportsHover || prefersReducedMotion) return;
  document.querySelectorAll('.about, .skills, .stack').forEach(section => {
    const orbs = section.querySelectorAll('.stack-orb');
    if (!orbs.length) return;
    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      orbs.forEach((orb, i) => {
        const strength = 22 + i * 10;
        orb.style.setProperty('--px', px * strength + 'px');
        orb.style.setProperty('--py', py * strength + 'px');
      });
    });
    section.addEventListener('mouseleave', () => {
      orbs.forEach(orb => { orb.style.removeProperty('--px'); orb.style.removeProperty('--py'); });
    });
  });
}
initOrbParallax();

/* ---------- cursor glow ---------- */
function initCursorGlow() {
  if (!supportsHover || prefersReducedMotion) return;
  const glow = document.getElementById('cursorGlow');
  let active = false;
  window.addEventListener('mousemove', (e) => {
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    if (!active) { glow.classList.add('is-active'); active = true; }
  });
  document.addEventListener('mouseleave', () => glow.classList.remove('is-active'));
}
initCursorGlow();

/* ---------- experience horizontal timeline fill ---------- */
function initTimelineFill() {
  const track = document.getElementById('timeline');
  const fill = document.getElementById('timelineFill');
  if (!track || !fill) return;
  const fillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        fill.style.width = prefersReducedMotion ? '100%' : '100%';
        fillObserver.unobserve(track);
      }
    });
  }, { threshold: 0.4 });
  fillObserver.observe(track);
}
initTimelineFill();

/* ---------- work carousel ---------- */
function initCarousel() {
  const root = document.getElementById('workCarousel');
  if (!root) return;
  const slides = Array.from(root.querySelectorAll('.carousel-slide'));
  const dots = Array.from(root.querySelectorAll('.cdot'));
  const progressFill = document.getElementById('carouselProgressFill');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  let index = 0;

  function goTo(next) {
    next = (next + slides.length) % slides.length;
    if (next === index) return;
    slides[index].classList.remove('is-active');
    dots[index].classList.remove('is-active');
    index = next;
    const el = slides[index];
    el.classList.remove('is-active');
    void el.offsetWidth; // restart reveal animation
    el.classList.add('is-active');
    dots[index].classList.add('is-active');
    root.dataset.index = index;
    if (progressFill) progressFill.style.width = ((index + 1) / slides.length) * 100 + '%';
  }

  function manualGoTo(next) {
    goTo(next);
    stopAutoplay();
    startAutoplay();
  }

  prevBtn.addEventListener('click', () => manualGoTo(index - 1));
  nextBtn.addEventListener('click', () => manualGoTo(index + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => manualGoTo(i)));

  // keyboard left/right when the work section is in view
  const workSection = document.getElementById('work');
  let inView = false;
  new IntersectionObserver((entries) => {
    entries.forEach(entry => { inView = entry.isIntersecting; });
  }, { threshold: 0.5 }).observe(workSection);

  document.addEventListener('keydown', (e) => {
    if (!inView) return;
    if (e.key === 'ArrowRight') manualGoTo(index + 1);
    if (e.key === 'ArrowLeft') manualGoTo(index - 1);
  });

  // touch swipe
  let touchStartX = null;
  root.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  root.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) manualGoTo(dx < 0 ? index + 1 : index - 1);
    touchStartX = null;
  }, { passive: true });

  // details accordion per slide
  root.querySelectorAll('.details-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const details = btn.nextElementSibling;
      const open = details.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open);
      btn.querySelector('span') && (btn.firstChild.textContent = open ? 'Hide details ' : 'Show full case study ');
    });
  });

  // autoplay: advances every 6s while the section is in view, pauses on hover/manual nav
  let autoplayTimer = null;
  function startAutoplay() {
    if (prefersReducedMotion) return;
    stopAutoplay();
    autoplayTimer = setInterval(() => { if (inView) goTo(index + 1); }, 6000);
  }
  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }
  root.addEventListener('mouseenter', stopAutoplay);
  root.addEventListener('mouseleave', startAutoplay);
  startAutoplay();
}
initCarousel();

/* ---------- image fallbacks ---------- */
function wireImageFallback(img, containerSelector, activeClass) {
  const container = document.querySelector(containerSelector);
  if (!img || !container) return;
  if (img.complete && img.naturalWidth > 0) {
    container.classList.add(activeClass);
  } else {
    img.addEventListener('load', () => container.classList.add(activeClass));
    img.addEventListener('error', () => container.classList.remove(activeClass));
  }
}
wireImageFallback(document.getElementById('avatarPhoto'), '.avatar-frame', 'has-photo');
wireImageFallback(document.getElementById('screenshotImg'), '#screenshotBody', 'has-shot');
