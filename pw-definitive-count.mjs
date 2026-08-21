import { chromium } from 'playwright';
const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();

const all = new Set();
for (let p = 1; p <= 5; p++) {
  const url = p === 1 ? 'https://www.carlogos.org/car-brands/' : 'https://www.carlogos.org/car-brands/page-' + p + '.html';
  const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null);
  if (!r || r.status() !== 200) { console.log('page', p, 'FAILED', r ? r.status() : 'no resp'); continue; }
  await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=900){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,200));} window.scrollTo(0,0); });
  await page.waitForTimeout(800);
  const links = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a[href*="/car-brands/"][href*="-logo.html"]').forEach(a => {
      if (a.closest('.lcco, .sidebar, aside, .g3it')) return;
      out.push(a.href);
    });
    return out;
  });
  links.forEach(l => all.add(l));
  console.log('page', p, ':', links.length, 'grid links (unique so far:', all.size + ')');
}
console.log('\nTOTAL UNIQUE GRID BRANDS ACROSS LISTING:', all.size);

// Check GM / stellantis alternates
for (const slug of ['general-motors-logo', 'stellantis-logo']) {
  // try common alternates
  for (const alt of [slug, slug.replace('-logo',''), slug.replace('-logo','') + '-emblem', slug.replace('logo','brand')]) {
    const r = await page.goto('https://www.carlogos.org/car-brands/' + alt + '.html', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
    if (r && r.status() === 200) console.log('  ALTERNATE 200:', alt);
  }
}
await browser.close();
