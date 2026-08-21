import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const allBrands = [];
const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
for (const L of letters) {
  await page.goto('https://www.carlogos.org/start-with-' + L.toLowerCase() + '/', { waitUntil: 'networkidle', timeout: 30000 }).catch(async () => { 
    // some letters may 404 if no brands start with them; skip
    return;
  });
  await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));} window.scrollTo(0,0); });
  await page.waitForTimeout(1000);
  const brands = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('a[href*="-logo.html"]')).filter(a => {
      try { const u = new URL(a.href); return u.pathname.includes('/car-brands/'); } catch { return false; }
    });
    const seen = new Set();
    return cards.filter(a => { const k = a.href; if (seen.has(k)) return false; seen.add(k); return true; }).map(a => {
      const img = a.querySelector('img');
      const raw = img?.src || img?.getAttribute('data-src') || '';
      const name = a.querySelector('b')?.textContent?.trim() || img?.getAttribute('alt')?.replace(/\s+Logo.*$/i, '').trim() || '';
      const category = a.querySelector('.ht-tag')?.textContent?.trim() || '';
      const years = a.querySelector('.ht-year')?.textContent?.trim() || '';
      let logo = raw;
      if (logo.startsWith('/')) logo = '/images/car-logos/' + logo.split('/').pop().split('?')[0];
      else if (logo.includes('/car-logos/')) logo = '/images/car-logos/' + logo.split('/').pop().split('?')[0];
      const slug = a.href.split('/').pop().replace('.html', '');
      return { slug, name, category, years, logo, href: a.href };
    });
  });
  allBrands.push(...brands);
  console.log(L, ':', brands.length, 'brands (cumulative:', allBrands.length + ')');
}
// Dedupe by slug (some may appear in multiple letters)
const bySlug = new Map();
for (const b of allBrands) if (!bySlug.has(b.slug)) bySlug.set(b.slug, b);
const final = Array.from(bySlug.values());
final.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-all.json', JSON.stringify(final, null, 2));
console.log('\n=== TOTAL UNIQUE BRANDS:', final.length, '===');
console.log('sample:', JSON.stringify(final.slice(0, 3), null, 2));
await browser.close();
