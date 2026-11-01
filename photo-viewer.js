(() => {
  'use strict';

  const dialog = document.getElementById('photo-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const links = [...document.querySelectorAll('a[data-photo]')];
  const imageHost = document.getElementById('photo-viewer-image');
  const caption = document.getElementById('photo-caption');
  const count = document.getElementById('photo-count');
  const previous = document.getElementById('photo-prev');
  const next = document.getElementById('photo-next');
  const close = document.getElementById('photo-close');
  let index = 0;
  let opener = null;

  function showPhoto(nextIndex) {
    const activeControl = document.activeElement;
    index = Math.max(0, Math.min(links.length - 1, nextIndex));
    const link = links[index];
    const original = link.querySelector('img');
    const image = new Image();
    image.src = link.href;
    image.alt = original.alt;
    image.width = original.width;
    image.height = original.height;
    imageHost.replaceChildren(image);
    caption.textContent = link.dataset.caption;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(links.length).padStart(2, '0')}`;
    previous.disabled = index === 0;
    next.disabled = index === links.length - 1;
    // Do not leave keyboard focus on a control that has just become disabled.
    if (previous.disabled && activeControl === previous) next.focus();
    if (next.disabled && activeControl === next) previous.focus();
  }

  links.forEach((link, photoIndex) => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', 'photo-dialog');
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      showPhoto(photoIndex);
      dialog.showModal();
      document.documentElement.classList.add('photo-open-page');
      document.dispatchEvent(new Event('photo-viewer-change'));
      close.focus();
    });
  });
  close.addEventListener('click', () => dialog.close());
  previous.addEventListener('click', () => showPhoto(index - 1));
  next.addEventListener('click', () => showPhoto(index + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button:not(:disabled)')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(index + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('photo-open-page');
    document.dispatchEvent(new Event('photo-viewer-change'));
    opener?.focus({ preventScroll: true });
    imageHost.replaceChildren();
  });
})();
