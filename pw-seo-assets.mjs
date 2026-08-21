import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('https://www.carlogos.org/', { waitUntil: 'networkidle', timeout: 60000 });

const seoDir = '/home/ubuntu/hermes/zervi-car-brands/public/seo';
mkdirSync(seoDir, { recursive: true });

// Collect all favicon/icon/manifest URLs
const assetUrls = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"], link[rel="manifest"], link[rel="shortcut icon"]'));
  return links.map(l => l.href);
});
console.log('SEO asset links:', JSON.stringify(assetUrls, null, 2));

// Download each
for (const url of assetUrls) {
  try {
    const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    if (r && r.status() === 200) {
      const buf = await r.body();
      const name = url.split('/').pop().split('?')[0];
      writeFileSync(seoDir + '/' + name, buf);
      console.log('downloaded:', name, '(' + buf.length + ' bytes)');
    }
  } catch (e) { console.log('fail:', url); }
}

// Also grab the OG image
await page.goto('https://www.carlogos.org/', { waitUntil: 'networkidle', timeout: 60000 });
const og = await page.evaluate(() => document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '');
console.log('og:image:', og);
if (og) {
  const r = await page.goto(og, { waitUntil: 'networkidle', timeout: 15000 });
  if (r && r.status() === 200) { const buf = await r.body(); writeFileSync(seoDir + '/og-image' + og.match(/\.[^.]+$|[?]/)?.[0]?.replace('?','') || '.png', buf); console.log('downloaded og image'); }
}

await browser.close();
console.log('SEO ASSETS DONE');
