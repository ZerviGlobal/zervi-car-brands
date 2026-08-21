import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const allUrls = [];
const sitemapUrls = [
  'https://www.carlogos.org/sitemap.xml',
  'https://www.carlogos.org/sitemap_index.xml',
  'https://www.carlogos.org/sitemap-product.xml',
];
for (const sm of sitemapUrls) {
  const r = await page.goto(sm, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);
  if (!r || r.status() !== 200) { console.log('SITEMAP', sm, ': not accessible'); continue; }
  const text = await page.content();
  const re = /<loc>([^<]+)<\/loc>/g;
  const urls = [];
  let m;
  while ((m = re.exec(text)) !== null) urls.push(m[1]);
  console.log('SITEMAP', sm, ':', urls.length, 'urls');
  if (urls.length === 0) { console.log('  raw (first 300):', text.slice(0, 300)); continue; }
  const childSitemaps = urls.filter(u => u.endsWith('.xml'));
  const realPages = urls.filter(u => !u.endsWith('.xml'));
  console.log('  child sitemaps:', childSitemaps.length, '| real pages:', realPages.length);
  if (childSitemaps.length > 0) {
    console.log('  child sitemaps:', JSON.stringify(childSitemaps));
    for (const cs of childSitemaps) {
      const cr = await page.goto(cs, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => null);
      if (!cr || cr.status() !== 200) { console.log('  CHILD', cs, ': not accessible'); continue; }
      const ct = await page.content();
      const cre = /<loc>([^<]+)<\/loc>/g;
      const cu = [];
      let cm2;
      while ((cm2 = cre.exec(ct)) !== null) cu.push(cm2[1]);
      allUrls.push(...cu.filter(u => !u.endsWith('.xml')));
      const carBrand = cu.filter(u => u.includes('/car-brands/'));
      const tireBrand = cu.filter(u => u.includes('/tire-brands/'));
      const moto = cu.filter(u => u.includes('/motorcycle-brands/'));
      const reviews = cu.filter(u => u.includes('/reviews/'));
      const quizzes = cu.filter(u => u.includes('/quizzes/'));
      console.log('  CHILD', cs.split('/').pop(), ': total', cu.length, '| car', carBrand.length, '| tire', tireBrand.length, '| moto', moto.length, '| reviews', reviews.length, '| quizzes', quizzes.length);
    }
  } else {
    allUrls.push(...realPages);
  }
}

// Dedupe + categorize the final URL list
const deduped = [...new Set(allUrls)];
const carBrand = deduped.filter(u => u.includes('/car-brands/'));
const tireBrand = deduped.filter(u => u.includes('/tire-brands/'));
const moto = deduped.filter(u => u.includes('/motorcycle-brands/'));
const reviews = deduped.filter(u => u.includes('/reviews/'));
const quizzes = deduped.filter(u => u.includes('/quizzes/'));
console.log('\n=== TOTAL UNIQUE PAGES ===', deduped.length);
console.log('car-brands:', carBrand.length, '| tire-brands:', tireBrand.length, '| motorcycle:', moto.length, '| reviews:', reviews.length, '| quizzes:', quizzes.length);
console.log('sample car-brand:', carBrand.slice(0, 3));
console.log('sample tire-brand:', tireBrand.slice(0, 3));
console.log('sample motorcycle:', moto.slice(0, 3));
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/sitemap-urls.json', JSON.stringify(deduped, null, 2));
console.log('saved', deduped.length, 'urls to sitemap-urls.json');

await browser.close();
console.log('SCOPE RECON DONE');
