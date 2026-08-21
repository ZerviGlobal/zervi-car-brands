import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();

const brands = [];
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
for (const L of letters) {
  await page.goto('https://www.carlogos.org/start-with-' + L.toLowerCase() + '/', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
  await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,80));} window.scrollTo(0,0); });
  await page.waitForTimeout(600);
  const b = await page.evaluate(() => {
    // Exclude sidebar widgets: .lcco (largest companies), sidebar, aside, and any element with class containing 'lcco'
    const results = [];
    const seen = new Set();
    document.querySelectorAll('a[href*="/car-brands/"][href*="-logo.html"]').forEach(a => {
      const inSidebar = a.closest('.lcco, .sidebar, aside, .g3it');
      if (inSidebar) return; // skip sidebar widget links
      const href = a.href;
      if (seen.has(href)) return;
      seen.add(href);
      const img = a.querySelector('img');
      const raw = img?.src || img?.getAttribute('data-src') || '';
      const name = a.querySelector('b')?.textContent?.trim() || img?.getAttribute('alt')?.replace(/\s+Logo.*$/i,'').trim() || '';
      const cat = a.querySelector('.ht-tag')?.textContent?.trim() || '';
      const yrs = a.querySelector('.ht-year')?.textContent?.trim() || '';
      let logo = raw;
      if (logo.startsWith('/')) logo = '/images/car-logos/' + logo.split('/').pop().split('?')[0];
      else if (logo.includes('/car-logos/')) logo = '/images/car-logos/' + logo.split('/').pop().split('?')[0];
      results.push({ slug: href.split('/').pop().replace('.html',''), name, category: cat, years: yrs, logo, href });
    });
    return results;
  });
  brands.push(...b);
  console.log(L, ':', b.length, '(cum', brands.length + ')');
}
// Dedupe by slug
const bySlug = new Map();
for (const b of brands) if (!bySlug.has(b.slug)) bySlug.set(b.slug, b);
const final = Array.from(bySlug.values());
final.sort((a, b) => a.name.localeCompare(b.name));
console.log('\n=== TRUE BRAND GRID COUNT:', final.length, '===');
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-true.json', JSON.stringify(final, null, 2));
await browser.close();
