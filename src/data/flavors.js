// The four highlighted flavours (hero + catalogue), in the order of the approved script.
// `description` stays null until the shop approves a text: never derive ingredients or
// allergens from the renders.
export const FEATURED = [
  { id: 'pistacie', name: 'Pistacie', type: 'klassiker', bg: '#E8EED4', blob: '#DBE5B8', ingredient: 'pistacie', description: null },
  { id: 'saltkaramel', name: 'Saltkaramel', type: 'klassiker', bg: '#F3E1CA', blob: '#F1D2AE', ingredient: 'karamel', description: null },
  { id: 'mango', name: 'Mango-sorbet', type: 'sorbet', bg: '#FFF0BD', blob: '#FFE49B', ingredient: 'mango', description: null },
  { id: 'hindbaer', name: 'Hindbær-sorbet', type: 'sorbet', bg: '#F9DDE2', blob: '#F8C8D2', ingredient: 'hindbaer', description: null },
];

export const TYPE_LABEL = { klassiker: 'Klassiker', sorbet: 'Sorbet' };

// "Se alle smage". Names as written on the shop's menu boards (reference photos).
// TODO(isola): confirm the current list and the spelling with the shop before launch.
export const ALL_FLAVORS = [
  { name: 'Pistacie', type: 'klassiker', featured: 0 },
  { name: 'Saltkaramel', type: 'klassiker', featured: 1 },
  { name: 'Chokolade', type: 'klassiker' },
  { name: 'Vanilje', type: 'klassiker' },
  { name: 'Hvid chokolade', type: 'klassiker' },
  { name: 'Mynte chokolade', type: 'klassiker' },
  { name: 'Chokolade solbær', type: 'klassiker' },
  { name: 'Stracciatella', type: 'klassiker' },
  { name: 'Rom rosin', type: 'klassiker' },
  { name: 'Amarena kirsebær', type: 'klassiker' },
  { name: 'Lakrids', type: 'klassiker' },
  { name: 'Nougat honning', type: 'klassiker' },
  { name: 'Bananasplit', type: 'klassiker' },
  { name: 'Cookie dough / karamel / choko', type: 'klassiker' },
  { name: 'Jordnød / karamel / choko', type: 'klassiker' },
  { name: 'Hvid chokolade / citron / lakrids', type: 'klassiker' },
  { name: 'Mango-sorbet', type: 'sorbet', featured: 2 },
  { name: 'Hindbær-sorbet', type: 'sorbet', featured: 3 },
  { name: 'Jordbær-sorbet', type: 'sorbet' },
  { name: 'Kokos-sorbet', type: 'sorbet' },
  { name: 'Passion-sorbet', type: 'sorbet' },
  { name: 'Rabarber-sorbet', type: 'sorbet' },
  { name: 'Havtorn-sorbet', type: 'sorbet' },
];
