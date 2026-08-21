import { chromium } from 'playwright';
const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage();

// Check the A-Z index pages for general-motors and stellantis
for (const letter of ['g', 's']) {
  await page.goto('https://www.carlogos.org/start-with-' + letter + '/', { waitUntil: 'networkidle', timeout: 60000 });
  const found = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="-logo.html"]')).map(a => a.href);
    return {
      gm: links.filter(l => l.includes('general-motors')),
      stellantis: links.filter(l => l.includes('stellantis')),
      count: document.querySelectorAll('a[href*="/car-brands/"][href*="-logo.html"]').length,
      h1: document.querySelector('h1')?.innerText || '',
    };
  });
  console.log('letter ' + letter + ':', JSON.stringify(found));
}

// Also check the page-5 of car-brands listing to see how the count is presented
await page.goto('https://www.carlogos.org/car-brands/', { waitUntil: 'networkidle', timeout: 60000 });
const idx = await page.evaluate(() => {
  // find "A-Z" nav links or count labels
  const body = document.body.innerText;
  const azLines = body.split('\n').filter(l => /A-Z|\d{3} brands|Car Brands \(/.test(l));
  return { azLines: azLines.slice(0, 10) };
});
console.log('\ncar-brands page A-Z lines:', JSON.stringify(idx, null, 2));

await browser.close();
