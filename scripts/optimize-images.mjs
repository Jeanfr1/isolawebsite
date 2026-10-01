// Generates the web versions (WebP) from the original PNGs in design/source/images.
// The PNGs stay the source of truth; run `npm run images` whenever one of them changes.
//
// Cutouts (scoops, ingredients, cone, logo, static hero) are trimmed to their visible
// area first. That way every layer is positioned by what you actually see, not by the
// transparent padding, which varies from file to file (see manifest.json).
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'design/source/images';
const OUT = 'src/assets/img';
const PUBLIC = 'public';

const webp = { quality: 82, alphaQuality: 92, effort: 6, smartSubsample: true };
const photo = { quality: 78, effort: 6, smartSubsample: true };

await mkdir(OUT, { recursive: true });

const report = [];
const meta = {};

async function trimmed(file) {
  // threshold on the alpha channel only: keeps the soft anti-aliased edge
  const { data, info } = await sharp(path.join(SRC, file))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 2 })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

async function write(input, name, width, options = webp) {
  const info = await sharp(input).resize({ width, withoutEnlargement: true }).webp(options).toFile(path.join(OUT, name));
  report.push(`${name.padEnd(30)} ${String(info.width).padStart(4)}x${String(info.height).padEnd(5)} ${(info.size / 1024).toFixed(0).padStart(4)} KB`);
  return info;
}

// Scoops: hero (big) + catalog / dialog.
for (const id of ['01-scoop-pistacie', '02-scoop-saltkaramel', '03-scoop-mango', '04-scoop-hindbaer']) {
  const t = await trimmed(`${id}.png`);
  const slug = id.replace(/^\d+-scoop-/, '');
  await write(t.buffer, `scoop-${slug}-900.webp`, 900);
  await write(t.buffer, `scoop-${slug}-480.webp`, 480);
  meta[`scoop-${slug}`] = { ratio: +(t.height / t.width).toFixed(4) };
}

// Ingredients: small particles, several instances each.
for (const id of ['05-orbit-pistacie', '06-orbit-karamel', '07-orbit-mango', '08-orbit-hindbaer']) {
  const t = await trimmed(`${id}.png`);
  const slug = id.replace(/^\d+-orbit-/, '');
  await write(t.buffer, `ingredient-${slug}.webp`, 260);
  meta[`ingredient-${slug}`] = { ratio: +(t.height / t.width).toFixed(4) };
}

// Cone. The opening (rim) centre is measured on the source and re-expressed
// relative to the trimmed box, so the scoop can dock onto it.
{
  const t = await trimmed('09-casquinha.png');
  await write(t.buffer, 'cone-560.webp', 560);
  await write(t.buffer, 'cone-320.webp', 320);
  // source bounds (alpha > 2): x 325..900, y 101..1168 — rim centre ≈ (600, 224)
  meta.cone = { ratio: +(t.height / t.width).toFixed(4), rim: { x: +((600 - 325) / t.width).toFixed(4), y: +((224 - 101) / t.height).toFixed(4) } };
}

// Static pistachio composition: poster before the layered scene is ready.
{
  const t = await trimmed('11-hero-pistacie.png');
  await write(t.buffer, 'hero-static-900.webp', 900);
  await write(t.buffer, 'hero-static-560.webp', 560);
  meta['hero-static'] = { ratio: +(t.height / t.width).toFixed(4) };
}

// Logo (header and footer on light backgrounds).
{
  const t = await trimmed('10-logo-isola.png');
  await write(t.buffer, 'logo-isola.webp', 480);
  meta.logo = { ratio: +(t.height / t.width).toFixed(4) };
}

// Editorial photos.
const store = path.join(SRC, '12-loja-interior.png');
for (const w of [1600, 1000, 640]) await write(store, `store-${w}.webp`, w, photo);
const affogato = path.join(SRC, '13-affogato.png');
for (const w of [1400, 760]) await write(affogato, `affogato-${w}.webp`, w, photo);
const sign = path.join(SRC, '14-placa-original.png');
for (const w of [800, 480]) await write(sign, `sign-${w}.webp`, w, photo);

await writeFile('src/data/asset-meta.json', JSON.stringify(meta, null, 2) + '\n');

// Favicon + touch icon + social preview.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#FCF9F2"/>
  <path d="M19 40V33a13 13 0 0 1 26 0v7" fill="none" stroke="#082A32" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M15 45h34" stroke="#00A99B" stroke-width="5" stroke-linecap="round"/>
</svg>
`;
await writeFile(path.join(PUBLIC, 'favicon.svg'), favicon);
await sharp(Buffer.from(favicon)).resize(180, 180).png().toFile(path.join(PUBLIC, 'apple-touch-icon.png'));

{
  const W = 1200;
  const H = 630;
  const hero = await sharp((await trimmed('11-hero-pistacie.png')).buffer).resize({ height: 590 }).toBuffer();
  const logo = await sharp((await trimmed('10-logo-isola.png')).buffer).resize({ width: 420 }).toBuffer();
  const heroMeta = await sharp(hero).metadata();
  await sharp({ create: { width: W, height: H, channels: 4, background: '#E8EED4' } })
    .composite([
      { input: logo, left: 96, top: 250 },
      { input: hero, left: W - heroMeta.width - 90, top: 30 },
    ])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(path.join(PUBLIC, 'og-image.jpg'));
  report.push('public/og-image.jpg           1200x630');
}

console.log(report.join('\n'));
