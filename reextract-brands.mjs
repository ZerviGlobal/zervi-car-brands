import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://www.carlogos.org/car-brands/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150));} window.scrollTo(0,0); });
await page.waitForTimeout(2000);

// Read each card's structured elements - inspect the HTML of one card first
const cardHtml = await page.evaluate(() => {
  const a = document.querySelector('a[href*="-logo.html"]');
  return a ? a.outerHTML.slice(0, 800) : 'no card found';
});
console.log('CARD HTML SAMPLE:\n', cardHtml);

// Extract structured: brand name (from img alt or title attr), category, years
const brands = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('a[href*="-logo.html"]')).filter(a => {
    try { const u = new URL(a.href); const parts = u.pathname.split('/').filter(Boolean); return parts.length >= 2 && parts[0] === 'car-brands'; } catch { return false; }
  });
  const seen = new Set();
  return items.filter(a => { const k = a.href; if (seen.has(k)) return false; seen.add(k); return true; }).map(a => {
    const img = a.querySelector('img');
    const alt = img?.getAttribute('alt') || img?.getAttribute('title') || '';
    const title = a.getAttribute('title') || a.getAttribute('aria-label') || '';
    // The visible text often concatenates name+category+years. Try to read them from child spans if present
    const children = Array.from(a.querySelectorAll('*')).map(e => ({tag: e.tagName, text: e.textContent?.trim(), class: e.className?.toString?.()||''})).filter(c => c.text);
    return {
      href: a.href,
      imgSrc: img?.src || img?.getAttribute('data-src') || '',
      imgAlt: alt,
      linkTitle: title,
      fullText: a.textContent?.trim(),
      childElements: children.slice(0, 8),
    };
  });
});
console.log('\nFirst brand structured:', JSON.stringify(brands[0], null, 2));
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-dom.json', JSON.stringify(brands, null, 2));
console.log('\nTotal brands:', brands.length);
await browser.close();
