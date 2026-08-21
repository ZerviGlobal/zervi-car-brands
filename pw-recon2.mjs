import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Fonts on homepage
await page.goto('https://www.carlogos.org/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(2000);
const fonts = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(l => l.href);
  const gf = Array.from(document.querySelectorAll('link[href*="fonts.googleapis"]')).map(l => l.href);
  const preconnect = Array.from(document.querySelectorAll('link[rel=preconnect]')).map(l => l.href);
  return { stylesheets: links.slice(0, 10), googleFonts: gf, preconnect };
});
console.log('FONTS:', JSON.stringify(fonts, null, 2));

// Scope: car-brands listing page
await page.goto('https://www.carlogos.org/car-brands/', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);
const brands = await page.evaluate(() => {
  const items = Array.from(document.querySelectorAll('a[href*="/car-brands/"]')).filter(a => {
    try { const u = new URL(a.href); const parts = u.pathname.split('/').filter(Boolean); return parts.length >= 2 && parts[0] === 'car-brands' && parts[1]; } catch { return false; }
  });
  const seen = new Set();
  const unique = items.filter(a => { const k = a.href; if (seen.has(k)) return false; seen.add(k); return true; });
  return unique.map(a => ({ text: a.textContent?.trim().slice(0, 40), href: a.href, img: a.querySelector('img')?.src || a.querySelector('img')?.getAttribute('data-src') || null }));
});
console.log('CAR BRANDS FOUND:', brands.length);
console.log('First 15:', JSON.stringify(brands.slice(0, 15), null, 2));
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-list.json', JSON.stringify(brands, null, 2));

// Screenshot the brands page
await page.screenshot({ path: '/home/ubuntu/hermes/zervi-car-brands/docs/design-references/brands-page.png', fullPage: true });
console.log('screenshot: brands-page.png (full)');

// Check pagination / total count
const pagination = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a')).filter(a => a.textContent.match(/\d+/) && (a.href.includes('page/') || a.href.includes('?page='))).map(a => ({text: a.textContent.trim(), href: a.href}));
  const next = Array.from(document.querySelectorAll('a.next, a[rel=next], .pagination a')).map(a => ({text: a.textContent.trim(), href: a.href}));
  return { paginationLinks: links.slice(0, 15), nextLinks: next.slice(0, 5) };
});
console.log('PAGINATION:', JSON.stringify(pagination, null, 2));

await browser.close();
console.log('RECON2 DONE');
