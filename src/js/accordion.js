// "Godt at vide": one question open at a time, full keyboard support
// (Enter/Space toggles, ↑/↓ move between questions, Home/End jump).
export function initAccordion() {
  document.querySelectorAll('[data-accordion]').forEach((acc) => {
    const triggers = [...acc.querySelectorAll('.acc-trigger')];
    acc.classList.add('acc-ready'); // answers collapse only when the accordion actually works
    const itemOf = (btn) => btn.closest('.acc-item');

    const set = (btn, open) => {
      btn.setAttribute('aria-expanded', String(open));
      itemOf(btn).classList.toggle('is-open', open);
    };

    triggers.forEach((btn, i) => {
      set(btn, false);
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        triggers.forEach((other) => other !== btn && set(other, false));
        set(btn, open);
      });
      btn.addEventListener('keydown', (e) => {
        const move = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: triggers.length - 1 }[e.key];
        if (move === undefined) return;
        e.preventDefault();
        triggers[(move + triggers.length) % triggers.length].focus();
      });
    });
  });
}
