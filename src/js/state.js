// activeFlavor: the single source for label, indicator, background, scoop, particles and the
// active catalogue card. Everyone subscribes; nobody keeps a copy.
const listeners = new Set();
let active = 0;

export const flavorState = {
  get: () => active,
  set(index, source = 'manual') {
    if (index === active) return;
    active = index;
    listeners.forEach((fn) => fn(index, source));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export const media = {
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)'),
  wide: window.matchMedia('(min-width: 900px) and (min-height: 560px)'),
};

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const range = (v, a, b) => clamp01((v - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
