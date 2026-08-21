import { chromium } from 'playwright';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Enable request interception to download images directly
const logosDir = '/home/ubuntu/hermes/zervi-car-brands/public/images/car-logos';
mkdirSync(logosDir, { recursive: true });

// Go to brands page and collect all logo URLs (including from lazy-load)
await page.goto('https://www.carlogos.org/car-brands/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);
// Scroll to trigger lazy loading
await page.evaluate(async () => { 
  for (let y = 0; y < document.body.scrollHeight; y += 800) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); }
  window.scrollTo(0, 0);
});
await page.waitForTimeout(2000);

const brands = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('a[href*="/car-brands/"]')).filter(a => {
    try { const u = new URL(a.href); const parts = u.pathname.split('/').filter(Boolean); return parts.length >= 2 && parts[0] === 'car-brands' && parts[1].includes('-logo'); } catch { return false; }
  });
  const seen = new Set();
  return items.filter(a => { const k = a.href; if (seen.has(k)) return false; seen.add(k); return true; }).map(a => {
    const img = a.querySelector('img');
    const raw = img?.src || img?.getAttribute('data-src') || img?.getAttribute('data-lazy-src') || '';
    // Parse the card text: brand name + category + years (they're concatenated)
    const fullText = a.textContent?.trim() || '';
    return { text: fullText, href: a.href, imgSrc: raw };
  });
});
console.log('Brands to download:', brands.length);

// Download each logo via the browser (avoids needing curl; reuses session/cookies)
let okCount = 0;
for (const b of brands) {
  if (!b.imgSrc) continue;
  let url = b.imgSrc;
  if (url.startsWith('/')) url = 'https://www.carlogos.org' + url;
  try {
    const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 20000, referer: 'https://www.carlogos.org/car-brands/' });
    const buf = await resp.body();
    const name = url.split('/').pop().split('?')[0];
    writeFileSync(resolve(logosDir, name), buf);
    okCount++;
    if (okCount % 10 === 0) console.log('downloaded', okCount, '/', brands.length);
  } catch (e) {
    console.log('FAIL', b.imgSrc, e.message.slice(0, 80));
  }
}
console.log('Downloaded', okCount, 'logos to', logosDir);

// Save the full brand list with parsed metadata for phase 2b
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-raw.json', JSON.stringify(brands, null, 2));

await browser.close();
