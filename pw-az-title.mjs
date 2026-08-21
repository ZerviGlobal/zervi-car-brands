import { chromium } from 'playwright';
const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();

// Check the start-with index page (maybe there's a /car-brands/a-z page or the nav has it)
for (const url of ['https://www.carlogos.org/car-brands/', 'https://www.carlogos.org/start-with-a/', 'https://www.carlogos.org/']) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  const found = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('a, h1, h2, h3, h4, span, title, meta[property="og:title"]').forEach(el => {
      const t = (el.textContent || el.getAttribute('content') || '').trim();
      if (/Car Brands.*A-Z|A-Z.*Car Brands|Car Brand.*\(\d{3}\)/i.test(t)) {
        out.push({ tag: el.tagName, text: t.slice(0, 80), href: el.href || '' });
      }
    });
    return out;
  });
  console.log('URL:', url);
  console.log(JSON.stringify(found.slice(0, 8), null, 2));
}
await browser.close();
