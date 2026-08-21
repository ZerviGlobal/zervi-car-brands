import { chromium } from 'playwright';
const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();

// Check listing page 1 grid for gm/stellantis
await page.goto('https://www.carlogos.org/car-brands/', { waitUntil: 'networkidle', timeout: 60000 });
const r = await page.evaluate(() => {
  const gridLinks = [];
  document.querySelectorAll('a[href*="/car-brands/"][href*="-logo.html"]').forEach(a => {
    const inSidebar = a.closest('.lcco, .sidebar, aside, .g3it');
    if (inSidebar) return;
    gridLinks.push(a.href);
  });
  return {
    gridCount: gridLinks.length,
    hasGM: gridLinks.some(h => h.includes('general-motors')),
    hasStellantis: gridLinks.some(h => h.includes('stellantis')),
    // Also count ALL unique hrefs on page (grid + sidebar) to see the discrepancy
    allUnique: [...new Set(gridLinks)].length,
  };
});
console.log('LISTING PAGE 1 GRID:', JSON.stringify(r));

// What does the page title / heading claim?
const title = await page.title();
const h1 = await page.evaluate(() => document.querySelector('h1')?.innerText || '');
console.log('title:', title, '| h1:', h1);

await browser.close();
