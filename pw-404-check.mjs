import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();

const our = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-all-enriched.json'));
console.log('Our count:', our.length);

// Check each brand page status in batches
let ok = 0, notFound = [];
for (let i = 0; i < our.length; i++) {
  const b = our[i];
  const r = await page.goto(b.href, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);
  if (r && r.status() === 200) ok++;
  else notFound.push({ slug: b.slug, status: r ? r.status() : 'error' });
  if (i % 50 === 0 && i > 0) console.log('checked', i, '/', our.length, '| 404s so far:', notFound.length);
}
console.log('OK:', ok, '| Not 200:', notFound.length);
notFound.forEach(n => console.log('  NOT-200:', n.slug, n.status));

// Also list entries that look like non-brands (names with odd chars, page refs)
const suspicious = our.filter(b => !b.name || /page-\d|mailto|index/i.test(b.slug) || b.name.length < 2);
console.log('\nSuspicious entries:', suspicious.length);
suspicious.slice(0, 10).forEach(s => console.log('  ', s.slug, '|', s.name));

await browser.close();
