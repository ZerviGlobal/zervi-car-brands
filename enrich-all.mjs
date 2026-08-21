import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const all = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-all.json'));
// Load the 62 already-enriched brands as a base
const enriched62 = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-data.json'));
const enrichedMap = {};
enriched62.forEach(b => { enrichedMap[b.slug] = b; });

// Start from the full 396 list, pull enrichment from enrichedMap where available
const brands = all.map(b => {
  const e = enrichedMap[b.slug];
  return {
    ...b,
    metaDescription: e?.metaDescription || '',
    description: e?.description || '',
    founded: e?.fullMeta?.Founded || '',
    founders: e?.fullMeta?.Founders || '',
    headquarters: e?.fullMeta?.Headquarters || '',
    keyModels: e?.fullMeta?.['Key Models'] || '',
    officialSite: e?.fullMeta?.['Official Site'] || '',
  };
});

// For brands missing metaDescription, fetch it from the detail page (just the meta tag - fast)
const missing = brands.filter(b => !b.metaDescription);
console.log('Already enriched:', brands.length - missing.length, '| need metaDescription:', missing.length);

let done = 0, fail = 0;
for (const b of missing) {
  try {
    await page.goto(b.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
    // The meta description is in the <head>, available immediately
    const meta = await page.evaluate(() => document.querySelector('meta[name=description]')?.getAttribute('content') || '');
    if (meta) b.metaDescription = meta.replace(/\s+/g, ' ').trim();
    // Also try to grab the first content paragraph for a fuller description
    const desc = await page.evaluate(() => {
      const main = document.querySelector('main, article, .content, .brand-info, .entry-content');
      if (!main) return '';
      const p = main.querySelector('p');
      return p ? p.textContent?.trim().slice(0, 600) : '';
    }).catch(() => '');
    if (desc) b.description = desc;
    done++;
    if (done % 25 === 0) console.log('enriched', done, '/', missing.length);
  } catch (e) { fail++; }
}
console.log('Enriched:', done, '| failed:', fail);
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-all-enriched.json', JSON.stringify(brands, null, 2));

// Stats
const withMeta = brands.filter(b => b.metaDescription).length;
const withDesc = brands.filter(b => b.description).length;
const cats = [...new Set(brands.map(b => b.category).filter(Boolean))];
console.log('\n=== FINAL ===');
console.log('Total brands:', brands.length);
console.log('With metaDescription:', withMeta, '| with description:', withDesc);
console.log('Categories (' + cats.length + '):', JSON.stringify(cats));
await browser.close();
