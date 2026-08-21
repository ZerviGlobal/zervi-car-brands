import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();

// Collect ALL brand hrefs from the car-brands listing pages (1-5)
const hrefs = new Set();
for (let p = 1; p <= 5; p++) {
  const url = p === 1 ? 'https://www.carlogos.org/car-brands/' : 'https://www.carlogos.org/car-brands/page-' + p + '.html';
  const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null);
  if (!r || r.status() !== 200) { console.log('page', p, 'failed'); continue; }
  await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} window.scrollTo(0,0); });
  const h = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href*="/car-brands/"][href*="-logo.html"]').forEach(a => out.push(a.href));
    return out;
  });
  h.forEach(x => hrefs.add(x));
  console.log('page', p, ':', h.length, 'links (cumulative', hrefs.size + ')');
}
console.log('TOTAL from listing pages:', hrefs.size);

// Our data slugs
const our = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-all-enriched.json'));
const ourHrefs = new Set(our.map(b => 'https://www.carlogos.org/car-brands/' + b.slug + '.html'));
const listingSlugs = new Set(Array.from(hrefs).map(h => h.split('/').pop().replace('.html','')));

// Find what we have that's NOT in the listing (extra) and what's in listing but not ours
const extra = [...ourHrefs].filter(h => !hrefs.has(h));
const missing = [...hrefs].filter(h => !ourHrefs.has(h));
console.log('OURS but NOT in listing (extras):', extra.length);
extra.slice(0, 10).forEach(h => console.log('  EXTRA:', h));
console.log('In listing but NOT ours (missing):', missing.length);
missing.slice(0, 10).forEach(h => console.log('  MISSING:', h));

// The site title says 395 - likely one of our 396 is a duplicate display or the site counts one less.
// Compare our A-Z scrape vs the paginated listing
const azSlugs = new Set(our.map(b => b.slug));
const onlyAZ = [...azSlugs].filter(s => !listingSlugs.has(s));
const onlyList = [...listingSlugs].filter(s => !azSlugs.has(s));
console.log('\nOnly in A-Z scrape (not listing):', onlyAZ.length, JSON.stringify(onlyAZ.slice(0,10)));
console.log('Only in listing (not A-Z):', onlyList.length, JSON.stringify(onlyList.slice(0,10)));

writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/listing-slugs.json', JSON.stringify(Array.from(listingSlugs), null, 2));
await browser.close();
