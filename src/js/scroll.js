import { media } from './state.js';

// In-page navigation. While a jump is running (e.g. "Se smagene" skipping the hero), the hero
// must not switch flavours as it scrolls past its zones; it resyncs when the jump ends.
let programmatic = false;
let endTimer = 0;
const endListeners = new Set();

export const scroller = {
  isProgrammatic: () => programmatic,
  onEnd(fn) {
    endListeners.add(fn);
  },
  to(target, { focus = true } = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const top = el.id === 'top' ? 0 : Math.round(el.getBoundingClientRect().top + window.scrollY - margin);
    const distance = Math.abs(top - window.scrollY);
    if (focus) el.focus({ preventScroll: true });
    if (distance < 1) return;

    programmatic = true;
    window.scrollTo({ top, behavior: !media.reduced.matches && distance > 4 ? 'smooth' : 'auto' });
    waitForEnd();
  },
};

function finish() {
  if (!programmatic) return;
  programmatic = false;
  endListeners.forEach((fn) => fn());
}

let job = 0;
function waitForEnd() {
  const id = ++job;
  const done = () => {
    if (id === job) finish();
  };
  window.clearTimeout(endTimer);
  // `scrollend` where supported; otherwise "no scroll event for 160 ms".
  if ('onscrollend' in window) {
    window.addEventListener('scrollend', done, { once: true });
    endTimer = window.setTimeout(done, 3000); // safety net
    return;
  }
  const idle = () => {
    window.clearTimeout(endTimer);
    endTimer = window.setTimeout(() => {
      window.removeEventListener('scroll', idle);
      done();
    }, 160);
  };
  window.addEventListener('scroll', idle, { passive: true });
  idle();
}

export function initAnchors() {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const hash = link.getAttribute('href');
    if (hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    if (history.replaceState) history.replaceState(null, '', hash);
    scroller.to(target);
  });

  // Arriving with a hash (#smage, #find-os …): the hero track only gets its final height once
  // the stylesheet is applied, so jump again after load.
  if (location.hash.length > 1) {
    const target = document.querySelector(location.hash);
    if (target) window.addEventListener('load', () => scroller.to(target, { focus: false }), { once: true });
  }
}
