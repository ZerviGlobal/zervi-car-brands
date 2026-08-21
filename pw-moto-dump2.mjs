import { chromium } from 'playwright';
import fs from 'fs';

const CHROME = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const INDEX_URL = 'https://www.carlogos.org/motorcycle-brands/';

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', viewport: { width: 1280, height: 1800 } });
  const page = await ctx.newPage();
  
  // Capture network requests to find the data source
  const apiCalls = [];
  page.on('response', resp => {
    const url = resp.url();
    if (url.includes('motorcycle') || url.includes('logo') || url.includes('brand') || url.endsWith('.json') || url.includes('api') || url.includes('ajax')) {
      apiCalls.push({ url, status: resp.status(), type: resp.request().resourceType() });
    }
  });

  console.log('Visiting:', INDEX_URL);
  await page.goto(INDEX_URL, { waitUntil: 'networkidle', timeout: 60000 });
  
  // Wait for the sav-list to populate
  await page.waitForTimeout(3000);
  
  // Try scrolling to trigger lazy loading
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);

  // Check sav-list content
  const savListInfo = await page.evaluate(() => {
    const ul = document.querySelector('ul.sav-list');
    const items = ul ? ul.querySelectorAll('li') : [];
    const alli = document.querySelector('section.alli');
    return {
      savListExists: !!ul,
      savListHTML: ul ? ul.innerHTML.slice(0, 2000) : '',
      itemCount: items.length,
      alliExists: !!alli,
      alliHTML: alli ? alli.innerHTML.slice(0, 2000) : '',
      pagesText: document.querySelector('.pages') ? document.querySelector('.pages').textContent : ''
    };
  });
  console.log('SAV-LIST info:', JSON.stringify(savListInfo, null, 2));

  // Check for any data attributes or script vars
  const dataInfo = await page.evaluate(() => {
    // Look for pagination links
    const pageLinks = Array.from(document.querySelectorAll('.pages a, .pages span, .p-info')).map(e => ({ tag: e.tagName, text: (e.textContent||'').trim().slice(0,30), href: e.getAttribute('href') }));
    return { pageLinks };
  });
  console.log('PAGES info:', JSON.stringify(dataInfo, null, 2));

  console.log('API/brand calls:', JSON.stringify(apiCalls.slice(0, 30), null, 2));

  // Save full HTML
  const html = await page.content();
  fs.writeFileSync('/tmp/moto-index2.html', html);
  console.log('Saved HTML size:', html.length);

  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
