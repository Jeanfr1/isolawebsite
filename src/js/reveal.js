// Small entrances for the sections after the hero (photo and text with a discreet offset).
// Styles only apply with .motion-ok, so content is always visible without JS or with reduced motion.
export function initReveal() {
  const els = document.querySelectorAll('[data-reveal], [data-catalog-head]');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  // hide-then-reveal only once this module runs, so a failed script never hides content
  document.documentElement.classList.add('reveal-on');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-visible');
        io.unobserve(en.target);
      });
    },
    { threshold: 0.18, rootMargin: '0px 0px -6% 0px' },
  );
  els.forEach((el) => io.observe(el));
}
