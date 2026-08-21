import { chromium } from 'playwright';
// Use the cached chromium-1208 browser (avoids a fresh ~150MB download)
const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox','--disable-setuid-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://www.carlogos.org/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
const title = await page.title();
const h1 = await page.locator('h1').first().textContent().catch(() => 'no h1');
console.log('TITLE:', title);
console.log('H1:', h1);
console.log('URL:', page.url());
const imgs = await page.locator('img').count();
console.log('IMG count:', imgs);
const links = await page.locator('a').evaluateAll(els => els.slice(0,40).map(e => ({text: (e.textContent||'').trim().slice(0,30), href: e.href})).filter(l => l.text && l.href));
console.log('LINKS (first 15):');
console.log(JSON.stringify(links.slice(0,15), null, 2));
await browser.close();
