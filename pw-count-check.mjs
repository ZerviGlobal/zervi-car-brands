import { chromium } from 'playwright';
const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('https://www.carlogos.org/car-brands/', { waitUntil: 'networkidle', timeout: 60000 });
const text = await page.evaluate(() => {
  const body = document.body.innerText;
  const titleMatches = body.match(/Car Brands[^\n]*/g) || [];
  const az = body.match(/A-Z[^\n]*/g) || [];
  const counts = body.match(/\d{2,4}\s*(?:car)?\s*(?:logos?|brands?)/gi) || [];
  const h1 = document.querySelector('h1')?.innerText || '';
  return { titleMatches: titleMatches.slice(0, 10), az: az.slice(0, 10), counts: counts.slice(0, 10), h1 };
});
console.log('ORIGINAL SITE /car-brands/:');
console.log(JSON.stringify(text, null, 2));
console.log('page title:', await page.title());
await browser.close();
