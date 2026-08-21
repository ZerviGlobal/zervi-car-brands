import { chromium } from 'playwright';
const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('https://www.carlogos.org/', { waitUntil: 'networkidle', timeout: 60000 });

// Find links/labels containing "A-Z" or "Car Brands" with a count
const labels = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('a, h2, h3, span, div').forEach(el => {
    const t = (el.textContent || '').trim();
    if (/A-Z/i.test(t) && /\d{3}/.test(t)) out.push({ tag: el.tagName, text: t.slice(0, 60), href: el.href || '' });
  });
  return out.slice(0, 10);
});
console.log('A-Z labels with count on homepage:', JSON.stringify(labels, null, 2));

// Check the start-with pages nav/heading
await page.goto('https://www.carlogos.org/start-with-a/', { waitUntil: 'networkidle', timeout: 60000 });
const azPage = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll('a, h1, h2, h3, span, div').forEach(el => {
    const t = (el.textContent || '').trim();
    if (/A-Z/i.test(t)) out.push({ tag: el.tagName, text: t.slice(0, 70), href: el.href || '' });
  });
  return out.slice(0, 10);
});
console.log('\nA-Z labels on start-with-a:', JSON.stringify(azPage, null, 2));
await browser.close();
