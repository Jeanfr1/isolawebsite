import { STORE } from '../data/store.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Fills "Find os" and the footer from src/data/store.js. Fields left as null keep the
// neutral text already in the HTML.
export function initStore() {
  if (STORE.address) {
    document.querySelectorAll('[data-store-address]').forEach((el) => (el.textContent = STORE.address));
  }

  document.querySelectorAll('[data-store-route]').forEach((a) => (a.href = STORE.routeUrl));

  if (STORE.hours?.length) {
    const rows = STORE.hours.map((h) => `<li><span>${esc(h.days)}</span><span>${esc(h.time)}</span></li>`).join('');
    const note = STORE.hoursNote ? `<p class="hours-note">${esc(STORE.hoursNote)}</p>` : '';
    document.querySelectorAll('[data-store-hours]').forEach((el) => (el.innerHTML = `<ul class="hours">${rows}</ul>${note}`));
    document.querySelectorAll('[data-store-hours-compact]').forEach((el) => {
      el.textContent = STORE.hours.map((h) => `${h.days} ${h.time}`).join(' · ');
      el.hidden = false;
    });
  }

  const contacts = [
    STORE.phone && { href: `tel:${STORE.phone.replace(/\s+/g, '')}`, label: STORE.phone, icon: 'i-phone' },
    STORE.email && { href: `mailto:${STORE.email}`, label: STORE.email, icon: 'i-mail' },
    STORE.instagram && { href: STORE.instagram, label: 'Instagram', external: true },
    STORE.facebook && { href: STORE.facebook, label: 'Facebook', external: true },
  ].filter(Boolean);

  if (contacts.length) {
    const box = document.querySelector('[data-store-contact]');
    const list = document.querySelector('[data-store-contact-list]');
    list.innerHTML = contacts
      .map(
        (c) =>
          `<li><a href="${esc(c.href)}"${c.external ? ' target="_blank" rel="noopener"' : ''}>${c.icon ? `<svg class="icon" aria-hidden="true"><use href="#${c.icon}" /></svg> ` : ''}${esc(c.label)}${c.external ? '<span class="sr-only"> (åbner i en ny fane)</span>' : ''}</a></li>`,
      )
      .join('');
    box.hidden = false;
  }

  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
}
