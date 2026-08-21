import { chromium } from 'playwright';
import fs from 'fs';

const CHROME = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', viewport: { width: 1280, height: 1800 } });
  const page = await ctx.newPage();
  const url = 'https://www.carlogos.org/car-brands/volkswagen-logo.html';
  console.log('Visiting:', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Dump structure of main content area
  const info = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const h2s = Array.from(document.querySelectorAll('h2')).map(e => (e.textContent||'').trim());
    const h3s = Array.from(document.querySelectorAll('h3')).map(e => (e.textContent||'').trim());
    const ps = Array.from(document.querySelectorAll('p')).map(e => (e.textContent||'').trim()).filter(t => t.length > 0);
    const imgs = Array.from(document.querySelectorAll('img')).map(e => ({ src: e.getAttribute('src') || e.getAttribute('data-src') || '', alt: e.getAttribute('alt') || '' })).filter(i => i.src);
    // Find main content container
    const main = document.querySelector('main, article, .content, .post, .entry, section.p-con');
    return {
      h1: h1 ? h1.textContent.trim() : null,
      h2s: h2s.slice(0, 20),
      h3s: h3s.slice(0, 20),
      pCount: ps.length,
      pSample: ps.slice(0, 3),
      imgCount: imgs.length,
      imgs: imgs.slice(0, 15),
      mainClass: main ? main.className : null
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
