import '@fontsource-variable/schibsted-grotesk';
import './styles/main.css';

import { initAnchors } from './js/scroll.js';
import { initHeader } from './js/header.js';
import { initHero } from './js/hero.js';
import { initCatalog } from './js/catalog.js';
import { initAccordion } from './js/accordion.js';
import { initReveal } from './js/reveal.js';
import { initStore } from './js/store.js';

initStore();
initAnchors();
initHeader();
initCatalog();
initAccordion();
initReveal();
initHero();
