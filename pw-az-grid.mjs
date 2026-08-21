import { chromium } from 'playwright';
const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();

await page.goto('https://www.carlogos.org/start-with-g/', { waitUntil: 'networkidle', timeout: 60000 });
const g = await page.evaluate(() => {
  // Find the main brand grid container
  const grid = document.querySelector('main .m-left, main .brand-list, main .grid, main .cards, main .az-grid, main .brand-grid');
  const gridLinks = grid ? Array.from(grid.querySelectorAll('a[href*="-logo.html"]')).map(a => a.href) : [];
  // All links on page matching -logo.html with their container context
  const allLinks = Array.from(document.querySelectorAll('a[href*="-logo.html"]'));
  const contexts = allLinks.map(a => {
    const container = a.closest('div, section, aside, nav');
    return { href: a.href, containerClass: container ? (container.className || '').toString().slice(0, 60) : 'none', containerId: container ? container.id : 'none' };
  });
  return {
    gridFound: !!grid,
    gridClass: grid ? (grid.className || '').toString().slice(0, 80) : null,
    gridLinkCount: gridLinks.length,
    gmInGrid: gridLinks.some(h => h.includes('general-motors')),
    allLinkContexts: contexts.filter(c => c.href.includes('general-motors') || c.href.includes('stellantis')),
  };
});
console.log('LETTER G:', JSON.stringify(g, null, 2));

await browser.close();
