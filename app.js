(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Share one event-updated preference between the animation and its control.
  let prefersReducedMotion = reducedMotion.matches;
  const mobile = window.matchMedia('(max-width: 720px)');
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Preferences remain session-local. */ } }
  };

  // The content is complete and readable without JavaScript. Enhance controls only.
  document.body.classList.add('enhanced');
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('site-navigation');
  function setMenu(open, restoreFocus = false) {
    menu.setAttribute('aria-expanded', String(open));
    menu.innerHTML = `Menu <span aria-hidden="true">${open ? '−' : '+'}</span>`;
    navigation.hidden = mobile.matches && !open;
    if (restoreFocus) menu.focus();
  }
  setMenu(false);
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  mobile.addEventListener('change', () => setMenu(false));
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', event => {
    if (mobile.matches && !event.target.closest('.navigation')) setMenu(false);
  });

  const navLinks = [...navigation.querySelectorAll('a[href^="#"]')];
  const sections = [...document.querySelectorAll('main > section')];
  const header = document.querySelector('.site-header');
  let navFrame = 0;
  function updateNavigation() {
    navFrame = 0;
    const marker = header.getBoundingClientRect().height + 45;
    const section = sections.find(section => {
      const rect = section.getBoundingClientRect();
      return rect.top <= marker && rect.bottom > marker;
    });
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 4;
    const activeId = atBottom ? 'contact' : section?.id;
    navLinks.forEach(link => {
      if (activeId && link.hash === `#${activeId}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function queueNavigation() { if (!navFrame) navFrame = requestAnimationFrame(updateNavigation); }
  window.addEventListener('scroll', queueNavigation, { passive: true });
  window.addEventListener('resize', queueNavigation);
  window.addEventListener('load', queueNavigation);
  document.fonts?.ready.then(queueNavigation);
  queueNavigation();

  const copyButton = document.getElementById('copy-email');
  const copyStatus = document.getElementById('copy-status');
  if (navigator.clipboard?.writeText) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('piyushmedikeri1997@gmail.com');
        copyStatus.textContent = 'Email copied.';
      } catch {
        copyStatus.textContent = 'Copy unavailable. Use the email link above.';
      }
    });
  }
  document.getElementById('year').textContent = String(new Date().getFullYear());

  // A decorative light field, not telemetry. No requests leave the browser.
  const canvas = document.getElementById('afterglow');
  const context = canvas.getContext('2d');
  if (!context) return;
  const motionButton = document.getElementById('motion-toggle');
  let userPaused = storage.get('afterglow-motion') === 'paused';
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let phase = 0;
  let width = 0;
  let height = 0;
  let density = 1;
  const theme = getComputedStyle(document.documentElement);
  const baseColor = theme.getPropertyValue('--bg').trim();
  const glowCore = theme.getPropertyValue('--glow-core').trim();
  const glowEdge = theme.getPropertyValue('--glow-edge').trim();
  const canAnimate = () => !userPaused && !prefersReducedMotion && visible && !document.hidden && !document.querySelector('.photo-dialog[open]');

  function paint() {
    if (!width || !height) return;
    context.setTransform(density, 0, 0, density, 0, 0);
    context.fillStyle = baseColor;
    context.fillRect(0, 0, width, height);
    const glow = context.createRadialGradient(width * .58, height * .61, 0, width * .58, height * .61, width * .58);
    glow.addColorStop(0, glowCore); glow.addColorStop(.4, glowEdge); glow.addColorStop(1, '#ff945600');
    context.fillStyle = glow; context.fillRect(0, 0, width, height);
    const rows = width < 600 ? 44 : 72;
    const samples = width < 600 ? 90 : 140;
    for (let row = 0; row < rows; row++) {
      const t = row / (rows - 1);
      context.beginPath();
      for (let point = 0; point <= samples; point++) {
        const u = point / samples;
        const x = width * (u * 1.32 - .16);
        const fold = Math.sin(u * 6.2 + Math.sin(phase) * .19) * .10 + Math.sin(u * 3.1 + 1) * .14;
        const y = height * (.74 - t * .24 + fold * (.25 + t) + Math.sin(t * 3.3 + u * 5 + Math.sin(phase * .6) * .12) * .08);
        if (!point) context.moveTo(x, y); else context.lineTo(x, y);
      }
      context.strokeStyle = `rgba(255,${Math.round(130 + 18 * t)},${Math.round(68 + 18 * t)},${.1 + .46 * t * t})`;
      context.lineWidth = row % 5 === 0 ? .85 : .4;
      context.stroke();
    }
    const dots = width < 600 ? 600 : 1400;
    for (let i = 0; i < dots; i++) {
      const u = ((i * 7919) % 2137) / 2137;
      const t = ((i * 3571) % 2099) / 2099;
      const fold = Math.sin(u * 6.2 + Math.sin(phase) * .19) * .10 + Math.sin(u * 3.1 + 1) * .14;
      const y = height * (.74 - t * .24 + fold * (.25 + t) + Math.sin(t * 3.3 + u * 5 + Math.sin(phase * .6) * .12) * .08);
      context.fillStyle = `rgba(255,195,159,${.06 + t * .3})`;
      context.fillRect(width * (u * 1.32 - .16), y, t > .88 ? 1.3 : .6, t > .88 ? 1.3 : .6);
    }
  }
  function tick(now) {
    frame = 0;
    if (!canAnimate()) { lastTime = 0; return; }
    const elapsed = now - lastTime;
    if (!lastTime || elapsed >= 50) {
      phase += lastTime ? Math.min(elapsed, 100) * .00008 : 0;
      lastTime = now;
      paint();
    }
    frame = requestAnimationFrame(tick);
  }
  function syncMotion() {
    cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    const paused = prefersReducedMotion || userPaused;
    motionButton.hidden = false;
    motionButton.disabled = prefersReducedMotion;
    motionButton.setAttribute('aria-pressed', String(!paused));
    motionButton.innerHTML = `Background animation <span aria-hidden="true">${paused ? 'Off' : 'On'}</span>`;
    motionButton.title = prefersReducedMotion
      ? 'The orange background animation is off to respect your reduced-motion setting.'
      : `${paused ? 'Turn on' : 'Pause'} the decorative orange waves behind my name. No video or audio.`;
    paint();
    if (canAnimate()) frame = requestAnimationFrame(tick);
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    density = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * density); canvas.height = Math.round(height * density);
    paint();
  }
  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    storage.set('afterglow-motion', userPaused ? 'paused' : 'playing');
    syncMotion();
  });
  reducedMotion.addEventListener('change', event => {
    prefersReducedMotion = event.matches;
    syncMotion();
  });
  document.addEventListener('visibilitychange', syncMotion);
  document.addEventListener('photo-viewer-change', syncMotion);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas.parentElement);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncMotion();
    }, { rootMargin: '80px' }).observe(document.querySelector('.hero'));
  }
  resize();
  syncMotion();
})();
