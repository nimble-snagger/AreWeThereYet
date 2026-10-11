// Builds routes/routes.json from every .gpx file in routes/.
// Run by the GitHub Action on push; can also be run by hand: node scripts/build-routes.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = new URL('../routes/', import.meta.url);
const R = 6371008.8;
const rad = x => x * Math.PI / 180;
const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&').trim();

function hav(a, b) {
  const dl = rad(b[0] - a[0]), dn = rad(b[1] - a[1]);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function points(xml, tag) {
  const out = [];
  const re = new RegExp('<' + tag + '\\b([^>]*)>', 'g');
  let m;
  while ((m = re.exec(xml))) {
    const lat = /\blat="([^"]+)"/.exec(m[1]), lon = /\blon="([^"]+)"/.exec(m[1]);
    if (lat && lon) out.push([parseFloat(lat[1]), parseFloat(lon[1])]);
  }
  return out;
}

const routes = [];
const files = readdirSync(DIR).filter(f => f.toLowerCase().endsWith('.gpx')).sort((a, b) => a.localeCompare(b));
for (const file of files) {
  const xml = readFileSync(new URL(file, DIR), 'utf8');
  let p = points(xml, 'trkpt');
  if (!p.length) p = points(xml, 'rtept');
  if (p.length < 2) { console.warn('Skipping ' + file + ': fewer than 2 points'); continue; }
  let m = 0;
  for (let i = 1; i < p.length; i++) m += hav(p[i - 1], p[i]);
  const meta = /<metadata>[\s\S]*?<name>([\s\S]*?)<\/name>/.exec(xml) || /<(?:trk|rte)>[\s\S]*?<name>([\s\S]*?)<\/name>/.exec(xml);
  const name = (meta && decode(meta[1])) || file.replace(/\.gpx$/i, '');
  routes.push({ file, name, m: Math.round(m) });
}
writeFileSync(new URL('routes.json', DIR), JSON.stringify(routes, null, 1) + '\n');
console.log('routes.json: ' + routes.length + ' route(s)');
