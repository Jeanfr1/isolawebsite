import { FEATURED, ALL_FLAVORS, TYPE_LABEL } from '../data/flavors.js';
import { flavorState } from './state.js';

const IMG = import.meta.glob('../assets/img/scoop-*.webp', { eager: true, query: '?url', import: 'default' });
const url = (name) => IMG[`../assets/img/${name}.webp`];

export function initCatalog() {
  const cards = [...document.querySelectorAll('[data-card]')];
  const list = document.querySelector('[data-featured-list]');
  if (!cards.length) return;

  // ---------- active card follows activeFlavor ----------
  const markActive = (i) => cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
  markActive(flavorState.get());
  flavorState.subscribe(markActive);

  // ---------- flavour panel ----------
  const dialog = document.querySelector('[data-dialog]');
  const dlg = dialog && {
    media: dialog.querySelector('[data-dlg-media]'),
    img: dialog.querySelector('[data-dlg-img]'),
    kicker: dialog.querySelector('[data-dlg-kicker]'),
    title: dialog.querySelector('[data-dlg-title]'),
    desc: dialog.querySelector('[data-dlg-desc]'),
  };
  let current = 0;
  let opener = null;

  function fill(i) {
    const f = FEATURED[i];
    current = i;
    dlg.media.style.setProperty('--blob', f.blob);
    dlg.img.srcset = `${url(`scoop-${f.id}-480`)} 480w, ${url(`scoop-${f.id}-900`)} 900w`;
    dlg.img.sizes = '(min-width: 760px) 360px, 70vw';
    dlg.img.src = url(`scoop-${f.id}-900`);
    dlg.img.alt = `En kugle ${f.name.toLowerCase()}`;
    dlg.kicker.textContent = `${String(i + 1).padStart(2, '0')} / ${String(FEATURED.length).padStart(2, '0')} · ${TYPE_LABEL[f.type]}`;
    dlg.title.textContent = f.name;
    // Only a description approved by the shop (src/data/flavors.js).
    dlg.desc.textContent = f.description || '';
    dlg.desc.hidden = !f.description;
    dialog.style.setProperty('--dlg-bg', f.bg);
    // same selection as the hero selector
    flavorState.set(i, 'catalog');
  }

  function open(i, from) {
    if (!dialog) return;
    opener = from;
    fill(i);
    if (!dialog.open) dialog.showModal();
  }

  function close() {
    if (dialog?.open) dialog.close();
  }

  if (dialog) {
    cards.forEach((card, i) => card.addEventListener('click', () => open(i, card)));
    dialog.querySelector('[data-dlg-close]').addEventListener('click', close);
    dialog.querySelectorAll('[data-dlg-step]').forEach((btn) =>
      btn.addEventListener('click', () => fill((current + Number(btn.dataset.dlgStep) + FEATURED.length) % FEATURED.length)),
    );
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') fill((current + 1) % FEATURED.length);
      if (e.key === 'ArrowLeft') fill((current - 1 + FEATURED.length) % FEATURED.length);
    });
    // click on the backdrop closes
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) close();
    });
    dialog.querySelector('[data-dlg-visit]').addEventListener('click', close);
    dialog.addEventListener('close', () => {
      (cards[current] || opener)?.focus({ preventScroll: true });
    });
  }

  // ---------- small screens: horizontal strip with buttons ----------
  document.querySelectorAll('[data-strip]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const step = list.firstElementChild?.getBoundingClientRect().width || 240;
      list.scrollBy({ left: Number(btn.dataset.strip) * (step + 16), behavior: 'smooth' });
    }),
  );
  const updateStrip = () => {
    const [prev, next] = document.querySelectorAll('[data-strip]');
    if (!prev) return;
    prev.disabled = list.scrollLeft < 8;
    next.disabled = list.scrollLeft + list.clientWidth > list.scrollWidth - 8;
  };
  list.addEventListener('scroll', updateStrip, { passive: true });
  window.addEventListener('resize', updateStrip);
  updateStrip();

  // ---------- "Se alle smage": expanded grid with filters ----------
  const toggle = document.querySelector('[data-all-toggle]');
  const panel = document.querySelector('[data-all-panel]');
  const grid = document.querySelector('[data-all-list]');
  const count = document.querySelector('[data-all-count]');
  if (!toggle || !panel || !grid) return;

  grid.innerHTML = ALL_FLAVORS.map(
    (f) => `<li class="all-item" data-type="${f.type}"${f.featured !== undefined ? ` data-featured="${f.featured}"` : ''}>
      <span class="all-name">${f.name}</span>
      <span class="all-type">${TYPE_LABEL[f.type]}</span>
    </li>`,
  ).join('');
  const items = [...grid.children];

  const label = toggle.querySelector('[data-all-label]');
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    panel.hidden = expanded;
    label.textContent = expanded ? 'Se alle smage' : 'Vis færre';
    if (!expanded) panel.querySelector('[data-filter][aria-pressed="true"]')?.focus({ preventScroll: true });
  });

  const filters = [...panel.querySelectorAll('[data-filter]')];
  function applyFilter(type) {
    filters.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === type)));
    let n = 0;
    items.forEach((li) => {
      const show = type === 'alle' || li.dataset.type === type;
      li.hidden = !show;
      if (show) n++;
    });
    count.textContent = `${n} ${n === 1 ? 'smag' : 'smage'}`;
  }
  filters.forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
  applyFilter('alle');
}
