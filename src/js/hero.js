// Hero: one stable layout, four flavour universes (roteiro da animação).
//
// Layers on a square, transparent stage, back to front:
//   back particles / cone / scoop / front particles
// Modes (picked in index.html before first paint, kept in sync here):
//   scroll  – desktop: sticky scene over ~200vh, flavour zones, docking, hand-off to #smage
//   compact – small screens: no pinned section, flavours by buttons, fewer particles
//   static  – prefers-reduced-motion: no orbit, no big moves, flavours switch by crossfade
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FEATURED } from '../data/flavors.js';
import meta from '../data/asset-meta.json';
import { flavorState, media, lerp, range, smooth } from './state.js';
import { scroller } from './scroll.js';

gsap.registerPlugin(ScrollTrigger);

const IMG = import.meta.glob('../assets/img/*.webp', { eager: true, query: '?url', import: 'default' });
const url = (name) => IMG[`../assets/img/${name}.webp`];

// Stage geometry in fractions of the stage side. Scoops and cone are trimmed to their visible
// area by scripts/optimize-images.mjs, so these numbers describe what you actually see.
const GEO = {
  scoop: { w: 0.5, cx: 0.47, cy: 0.275 },
  cone: { w: 0.3, left: 0.47, top: 0.43, ratio: meta.cone.ratio, rim: meta.cone.rim },
  // Docking: final scoop scale, how much of its height overlaps the rim, x nudge, cone tilt (deg).
  dock: { scale: 0.74, overlap: 0.12, dx: -0.012, rotate: 5 },
};

// Scroll script, in fractions of the pinned distance.
const ZONES = [0.29, 0.47, 0.65]; // middle of each 6 % change window (26–32, 44–50, 62–68)
const DOCK = [0.8, 0.94];

// Particle slots around the scoop (x/y = centre, s = width, r = rotation; fractions of the stage).
// Kept clear of the title and the buttons on the left. `m` = also used on small screens.
const SLOTS = [
  { x: 0.76, y: 0.06, s: 0.1, r: 18, z: 'front', m: true },
  { x: 0.88, y: 0.53, s: 0.09, r: -24, z: 'front', m: true },
  { x: 0.33, y: 0.68, s: 0.085, r: 32, z: 'front', m: true },
  { x: 0.16, y: 0.19, s: 0.08, r: -14, z: 'front', m: false },
  { x: 0.56, y: -0.03, s: 0.065, r: 40, z: 'back', m: false },
  { x: 0.07, y: 0.06, s: 0.058, r: -35, z: 'back', m: true },
  { x: 0.86, y: 0.8, s: 0.065, r: 12, z: 'back', m: false },
];

const root = document.documentElement;

// deterministic jitter so every flavour gets its own arrangement
function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function decoded(img) {
  if (img.complete && img.naturalWidth) return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  return new Promise((resolve) => {
    img.addEventListener('load', () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(resolve), { once: true });
    img.addEventListener('error', resolve, { once: true });
  });
}

function docOffset(el) {
  let x = 0;
  let y = 0;
  for (let n = el; n; n = n.offsetParent) {
    x += n.offsetLeft;
    y += n.offsetTop;
  }
  return { x, y };
}

export function initHero() {
  const track = document.querySelector('[data-hero-track]');
  const hero = document.querySelector('[data-hero]');
  const stage = document.querySelector('[data-stage]');
  if (!track || !hero || !stage) return;

  const scene = stage.querySelector('[data-scene]');
  const scoopsEl = stage.querySelector('[data-scoops]');
  const cone = stage.querySelector('[data-cone]');
  const coneImg = stage.querySelector('[data-cone-img]');
  const layers = { back: stage.querySelector('[data-particles="back"]'), front: stage.querySelector('[data-particles="front"]') };
  const picks = [...document.querySelectorAll('[data-pick]')];
  const indNum = document.querySelector('[data-ind-num]');
  const indName = document.querySelector('[data-ind-name]');
  const indDots = [...document.querySelectorAll('.ind-dots li')];
  const catalog = document.querySelector('[data-catalog]');
  const cardImgs = [...document.querySelectorAll('[data-card-img]')];
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  stage.style.setProperty('--scoop-w', GEO.scoop.w);
  stage.style.setProperty('--scoop-cx', GEO.scoop.cx);
  stage.style.setProperty('--scoop-cy', GEO.scoop.cy);
  stage.style.setProperty('--cone-w', GEO.cone.w);
  stage.style.setProperty('--cone-left', GEO.cone.left);
  stage.style.setProperty('--cone-top', GEO.cone.top);
  stage.style.setProperty('--rim-x', GEO.cone.rim.x);
  stage.style.setProperty('--rim-y', GEO.cone.rim.y);

  // ---------- layers ----------
  const scoops = FEATURED.map((f, i) => {
    let img = scoopsEl.querySelector(`[data-scoop="${i}"]`);
    if (!img) {
      img = document.createElement('img');
      img.className = 'scoop';
      img.alt = '';
      img.decoding = 'async';
      img.width = 900;
      img.height = Math.round(900 * meta[`scoop-${f.id}`].ratio);
      img.dataset.scoop = i;
      scoopsEl.append(img);
    }
    img.style.setProperty('--ratio', meta[`scoop-${f.id}`].ratio);
    gsap.set(img, { opacity: 0 });
    return img;
  });

  const sets = FEATURED.map((f, fi) => {
    const ratio = meta[`ingredient-${f.ingredient}`].ratio;
    return SLOTS.map((slot, k) => {
      const rnd = seeded(fi * 97 + k * 13 + 7);
      const el = document.createElement('img');
      el.className = `particle particle--${slot.z}`;
      el.alt = '';
      el.decoding = 'async';
      layers[slot.z].append(el);
      return {
        el,
        slot,
        ratio,
        base: {
          x: slot.x + (rnd() - 0.5) * 0.045,
          y: slot.y + (rnd() - 0.5) * 0.045,
          s: slot.s * (0.9 + rnd() * 0.22),
          r: slot.r + (rnd() - 0.5) * 50,
          flip: rnd() > 0.5 ? -1 : 1,
        },
        orbit: {
          rx: 0.012 + rnd() * 0.012,
          ry: 0.009 + rnd() * 0.01,
          speed: (0.16 + rnd() * 0.18) * (k % 2 ? -1 : 1),
          phase: rnd() * Math.PI * 2,
          rot: 6 + rnd() * 9,
        },
        depth: slot.z === 'front' ? 1 : 0.45,
        enabled: true,
        w: 0,
        h: 0,
        push: 1, // 0 = in place, 1 = pushed ~34px away from the scoop
        alpha: 0,
      };
    });
  });
  const particles = sets.flat();

  // ---------- assets (assetsReady) ----------
  // Pistachio scoop + cone come with the HTML; the other three are fetched right after and a
  // flavour change only starts once its scoop and ingredient are decoded.
  const ready = [];
  function load(i) {
    if (ready[i]) return ready[i];
    const f = FEATURED[i];
    const img = scoops[i];
    if (!img.getAttribute('src')) {
      img.sizes = '(min-width: 900px) 28vw, 50vw';
      img.srcset = `${url(`scoop-${f.id}-480`)} 480w, ${url(`scoop-${f.id}-900`)} 900w`;
      img.src = url(`scoop-${f.id}-900`);
    }
    const ingredient = url(`ingredient-${f.ingredient}`);
    sets[i].forEach((p) => {
      if (!p.el.getAttribute('src')) p.el.src = ingredient;
    });
    ready[i] = Promise.all([decoded(img), decoded(sets[i][0].el)]);
    return ready[i];
  }

  // ---------- state ----------
  let mode = '';
  const st = { p: 0, entry: 0, dock: 0, hand: 0 };
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  let S = stage.clientWidth || 1;
  let lastZone = 0;
  let shown = -1;
  let token = 0;
  let tl = null;
  let live = false;
  let H = { dx: 0, dy: 0, s: 1 };
  let triggers = [];

  const zoneOf = (p) => (p < ZONES[0] ? 0 : p < ZONES[1] ? 1 : p < ZONES[2] ? 2 : 3);

  function dockTarget() {
    const { scoop, cone, dock } = GEO;
    const rimX = cone.left + cone.rim.x * cone.w;
    const rimY = cone.top + cone.rim.y * cone.w * cone.ratio;
    const w = scoop.w * dock.scale;
    return { rimX, rimY, w, cx: rimX + dock.dx, cy: rimY - (0.5 - dock.overlap) * w };
  }

  // ---------- UI sync ----------
  function syncUi(i) {
    const f = FEATURED[i];
    picks.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    indDots.forEach((d, k) => d.classList.toggle('is-active', k === i));
    if (indNum) indNum.textContent = String(i + 1).padStart(2, '0');
    if (indName) {
      indName.textContent = f.name;
      indName.classList.remove('is-swapping');
      void indName.offsetWidth;
      indName.classList.add('is-swapping');
    }
    stage.setAttribute('aria-label', `${f.name}: en kugle ${f.type === 'sorbet' ? 'sorbet' : 'is'} over en vaffel`);
  }

  // ---------- flavour transition ----------
  function transitionTo(to) {
    if (tl) tl.kill();
    const calm = mode === 'static';
    shown = to;
    tl = gsap.timeline({ onUpdate: requestRender, onComplete: () => themeMeta?.setAttribute('content', FEATURED[to].bg) });

    scoops.forEach((el, i) => {
      const visible = +gsap.getProperty(el, 'opacity');
      if (i === to) {
        if (visible < 0.05) gsap.set(el, { y: 0, scale: calm ? 1 : 0.96, '--reveal': calm ? 1 : 0 });
        if (!calm) el.classList.add('is-masked');
        // 100–450 ms: the new scoop takes the same centre, 0.96 → 1, behind a soft mask
        tl.to(el, { opacity: 1, y: 0, scale: 1, '--reveal': 1, duration: calm ? 0.25 : 0.45, ease: 'power3.out', onComplete: () => el.classList.remove('is-masked') }, calm ? 0 : 0.1);
      } else if (visible > 0) {
        // 100–450 ms: the old scoop leaves 32 px upwards
        tl.to(el, { opacity: 0, y: calm ? 0 : -32, duration: calm ? 0.2 : 0.35, ease: 'power2.in' }, calm ? 0 : 0.1);
      }
    });

    sets.forEach((set, fi) => {
      if (fi === to) {
        if (calm) {
          set.forEach((p) => (p.push = 0));
          tl.to(set, { alpha: 1, duration: 0.25, ease: 'power1.out' }, 0);
        } else {
          set.forEach((p) => {
            if (p.alpha < 0.02) p.push = 1;
          });
          // 150–650 ms: the new ingredients arrive
          tl.to(set, { push: 0, duration: 0.5, ease: 'power3.out', stagger: 0.04 }, 0.15);
          tl.to(set, { alpha: 1, duration: 0.3, ease: 'power1.out', stagger: 0.04 }, 0.15);
        }
      } else if (calm) {
        tl.to(set, { alpha: 0, duration: 0.2 }, 0);
      } else {
        // 0–150 ms: current ingredients move away and start to fade
        tl.to(set, { push: 1, duration: 0.15, ease: 'power2.out' }, 0);
        tl.to(set, { alpha: 0, duration: 0.3, ease: 'power1.in' }, 0.05);
      }
    });

    tl.to(root, { '--hero-bg': FEATURED[to].bg, duration: calm ? 0.25 : 0.5, ease: 'power1.inOut' }, calm ? 0 : 0.15);
  }

  function show(i) {
    const my = ++token;
    load(i).then(() => {
      if (my !== token || !live) return;
      if (shown !== i) transitionTo(i);
    });
  }

  flavorState.subscribe((i) => {
    syncUi(i);
    show(i);
    measure();
    requestRender();
  });

  picks.forEach((b) => b.addEventListener('click', () => flavorState.set(Number(b.dataset.pick), 'manual')));

  // ---------- render ----------
  let looping = false;
  let pending = false;
  let heroVisible = true;

  function render(now = performance.now()) {
    pending = false;
    const t = mode === 'static' ? 0 : now / 1000;
    const isScroll = mode === 'scroll';
    const dock = isScroll ? st.dock : 0;
    const hand = isScroll ? st.hand : 0;
    const settle = isScroll ? range(st.p, 0, 0.12) : 1; // 0–12 %: entrance
    const e = st.entry;

    ptr.x += (ptr.tx - ptr.x) * 0.06;
    ptr.y += (ptr.ty - ptr.y) * 0.06;
    const px = ptr.x * (1 - dock);
    const py = ptr.y * (1 - dock);

    // scoop: vertical distance first, then scale (encaixe)
    const d = dockTarget();
    const e1 = smooth(range(dock, 0, 0.65));
    const e2 = smooth(range(dock, 0.35, 1));
    const y1 = d.rimY - (0.5 - GEO.dock.overlap) * GEO.scoop.w;
    const w = lerp(GEO.scoop.w, d.w, e2);
    const cx = lerp(GEO.scoop.cx, d.cx, e1);
    const cy = lerp(GEO.scoop.cy, y1, e1) + (d.cy - y1) * e2;
    const bob = Math.sin(t * 1.05) * 0.006 * S * (1 - dock);
    const sx = (cx - GEO.scoop.cx) * S + px * 6;
    const sy = (cy - GEO.scoop.cy) * S + bob + (1 - e) * 26 + py * 4;
    scoopsEl.style.transform = `translate3d(${sx.toFixed(2)}px, ${sy.toFixed(2)}px, 0) scale(${(w / GEO.scoop.w).toFixed(4)})`;

    const coneBob = Math.sin(t * 1.05 + 1.3) * 0.004 * S * (1 - dock);
    const coneY = (1 - e) * 44 + (1 - settle) * 12 + coneBob + py * 2.5;
    cone.style.transform = `translate3d(${(px * 3).toFixed(2)}px, ${coneY.toFixed(2)}px, 0) rotate(${(GEO.dock.rotate * dock).toFixed(3)}deg)`;
    cone.style.opacity = String(1 - range(hand, 0.15, 0.6));

    // particles: short, slow orbit; radius shrinks while docking; fade during the hand-off
    const orbitK = mode === 'static' ? 0 : lerp(0.75, 1, settle) * (1 - 0.6 * dock);
    const pull = dock * 0.22;
    const fade = 1 - range(hand, 0, 0.45);
    for (const p of particles) {
      if (!p.enabled) continue;
      const a = p.alpha * fade;
      if (a < 0.003) {
        if (p.el.style.opacity !== '0') p.el.style.opacity = '0';
        continue;
      }
      const th = p.orbit.phase + t * p.orbit.speed;
      let x = p.base.x + Math.cos(th) * p.orbit.rx * orbitK;
      let y = p.base.y + Math.sin(th) * p.orbit.ry * orbitK;
      x = lerp(x, d.cx, pull);
      y = lerp(y, d.cy, pull);
      const vx = p.base.x - GEO.scoop.cx;
      const vy = p.base.y - GEO.scoop.cy;
      const len = Math.hypot(vx, vy) || 1;
      const push = p.push * 34;
      const X = x * S + (vx / len) * push + px * 14 * p.depth - p.w / 2;
      const Y = y * S + (vy / len) * push + py * 10 * p.depth - p.h / 2;
      const rot = p.base.r + Math.sin(th * 1.3) * p.orbit.rot * (orbitK ? 1 : 0);
      const sc = 1 + Math.sin(th + 1.7) * 0.04 * (orbitK ? 1 : 0);
      p.el.style.transform = `translate3d(${X.toFixed(2)}px, ${Y.toFixed(2)}px, 0) rotate(${rot.toFixed(2)}deg) scale(${(p.base.flip * sc).toFixed(4)}, ${sc.toFixed(4)})`;
      p.el.style.opacity = (a * (p.slot.z === 'back' ? 0.85 : 1)).toFixed(3);
    }

    // hand-off: the whole group travels to the active card and swaps with its image
    if (isScroll) {
      scene.style.transform = hand > 0 ? `translate3d(${(H.dx * hand).toFixed(2)}px, ${(H.dy * hand).toFixed(2)}px, 0) scale(${lerp(1, H.s, hand).toFixed(4)})` : '';
      scene.style.opacity = String(1 - range(hand, 0.82, 1));
      const active = flavorState.get();
      cardImgs.forEach((img, i) => {
        if (i === active) {
          img.style.opacity = String(range(hand, 0.82, 1));
          img.style.transform = '';
        } else {
          const k = smooth(range(hand, 0.35 + i * 0.05, 0.85 + i * 0.03));
          img.style.opacity = String(lerp(0.4, 1, k));
          img.style.transform = `translateY(${((1 - k) * 18).toFixed(2)}px) scale(${lerp(0.94, 1, k).toFixed(4)})`;
        }
      });
    }
  }

  function shouldLoop() {
    return live && mode !== 'static' && !document.hidden && (heroVisible || (st.hand > 0 && st.hand < 1));
  }
  function loop(now) {
    render(now);
    if (shouldLoop()) requestAnimationFrame(loop);
    else looping = false;
  }
  function kick() {
    if (!looping && shouldLoop()) {
      looping = true;
      requestAnimationFrame(loop);
    }
  }
  function requestRender() {
    if (looping || pending) return;
    pending = true;
    requestAnimationFrame(render);
  }

  new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      kick();
    },
    { rootMargin: '200px 0px' },
  ).observe(track);
  document.addEventListener('visibilitychange', kick);

  hero.addEventListener('pointermove', (ev) => {
    if (mode !== 'scroll' || ev.pointerType !== 'mouse') return;
    ptr.tx = (ev.clientX / window.innerWidth - 0.5) * 2;
    ptr.ty = (ev.clientY / window.innerHeight - 0.5) * 2;
  });
  hero.addEventListener('pointerleave', () => {
    ptr.tx = 0;
    ptr.ty = 0;
  });

  // ---------- measurements ----------
  function measure() {
    S = stage.clientWidth || S;
    for (const p of particles) {
      p.w = p.base.s * S;
      p.h = p.w * p.ratio;
      p.el.style.width = `${p.w.toFixed(1)}px`;
    }
    if (mode !== 'scroll' || !catalog) return;

    // Hero position at the moment it stops being sticky; from then on hero and catalogue scroll
    // together, so the distance between the docked scoop and the card is constant.
    const trackRect = track.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const heroDocTopAtRelease = trackRect.top + window.scrollY + track.offsetHeight - hero.offsetHeight;
    const stageDocTop = heroDocTopAtRelease + (stageRect.top - heroRect.top);
    const stageDocLeft = stageRect.left + window.scrollX;
    const d = dockTarget();
    const from = { x: stageDocLeft + d.cx * S, y: stageDocTop + d.cy * S };

    const img = cardImgs[flavorState.get()];
    if (!img) return;
    const o = docOffset(img);
    const to = { x: o.x + img.offsetWidth / 2, y: o.y + img.offsetHeight / 2 };
    H = { dx: to.x - from.x, dy: to.y - from.y, s: img.offsetWidth / (d.w * S) };
    scene.style.transformOrigin = `${(d.cx * S).toFixed(1)}px ${(d.cy * S).toFixed(1)}px`;
  }

  new ResizeObserver(() => {
    measure();
    requestRender();
  }).observe(stage);

  // ---------- modes ----------
  function clearScrollStyles() {
    scene.style.transform = '';
    scene.style.opacity = '';
    scene.style.transformOrigin = '';
    cone.style.opacity = '';
    cardImgs.forEach((img) => {
      img.style.opacity = '';
      img.style.transform = '';
    });
  }

  function applyMode() {
    const next = media.reduced.matches ? 'static' : media.wide.matches ? 'scroll' : 'compact';
    if (next === mode) return;
    mode = next;
    root.classList.remove('hero-static', 'hero-scroll', 'hero-compact');
    root.classList.add(`hero-${mode}`);
    root.classList.toggle('motion-ok', mode !== 'static');

    triggers.forEach((tr) => tr.kill());
    triggers = [];
    clearScrollStyles();
    st.dock = 0;
    st.hand = 0;
    ptr.tx = ptr.ty = 0;

    for (const p of particles) {
      p.enabled = mode === 'scroll' || p.slot.m;
      p.el.style.display = p.enabled ? '' : 'none';
    }
    if (mode === 'static') {
      sets.forEach((set) => set.forEach((p) => (p.push = 0)));
      st.entry = 1;
    }

    if (mode === 'scroll') {
      triggers.push(
        ScrollTrigger.create({
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate(self) {
            st.p = self.progress;
            st.dock = smooth(range(st.p, DOCK[0], DOCK[1]));
            const zone = zoneOf(st.p);
            if (zone !== lastZone) {
              lastZone = zone;
              // a manual choice stays until the next zone boundary; never overwrite it per frame
              if (!scroller.isProgrammatic()) flavorState.set(zone, 'scroll');
            }
            requestRender();
          },
        }),
      );
      if (catalog) {
        triggers.push(
          ScrollTrigger.create({
            trigger: catalog,
            start: 'top bottom',
            end: () => `top ${document.querySelector('[data-header]')?.offsetHeight || 0}px`,
            onUpdate(self) {
              st.hand = self.progress;
              kick();
              requestRender();
            },
            onRefresh(self) {
              st.hand = self.progress;
              measure();
            },
          }),
        );
      }
      ScrollTrigger.refresh();
      st.p = triggers[0].progress;
      st.dock = smooth(range(st.p, DOCK[0], DOCK[1]));
      lastZone = zoneOf(st.p);
    }

    measure();
    kick();
    requestRender();
  }

  scroller.onEnd(() => {
    lastZone = zoneOf(st.p);
  });

  media.reduced.addEventListener('change', applyMode);
  media.wide.addEventListener('change', applyMode);
  applyMode();

  // ---------- start ----------
  // If the page opens mid-track (restored scroll), start on that zone's flavour.
  if (mode === 'scroll' && lastZone !== flavorState.get()) flavorState.set(lastZone, 'scroll');
  else syncUi(flavorState.get());

  const first = flavorState.get();
  root.style.setProperty('--hero-bg', FEATURED[first].bg);
  Promise.all([load(first), decoded(coneImg)]).then(() => {
    live = true;
    shown = first;
    stage.classList.add('is-live');
    const calm = mode === 'static';
    gsap.set(scoops[first], { opacity: 1 });
    if (calm) {
      sets[first].forEach((p) => {
        p.push = 0;
        p.alpha = 1;
      });
    } else {
      gsap.fromTo(st, { entry: 0 }, { entry: 1, duration: 1.2, ease: 'power3.out', onUpdate: requestRender });
      gsap.fromTo(scoops[first], { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo(coneImg, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' });
      gsap.to(sets[first], { push: 0, alpha: 1, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.25 });
    }
    kick();
    requestRender();
    // then anticipate the other three flavours
    const rest = () => FEATURED.forEach((_, i) => load(i));
    if ('requestIdleCallback' in window) window.requestIdleCallback(rest, { timeout: 1500 });
    else window.setTimeout(rest, 400);
    // if the flavour changed while loading, follow it
    if (flavorState.get() !== first) show(flavorState.get());
  });
}
