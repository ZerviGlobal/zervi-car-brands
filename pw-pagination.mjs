import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 1. Car-brands page - look for pagination, load-more, or "all" links
await page.goto('https://www.carlogos.org/car-brands/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150));} window.scrollTo(0,0); });
await page.waitForTimeout(2000);

// Count brand cards + look for pagination controls
const info = await page.evaluate(() => {
  const cards = document.querySelectorAll('a[href*="-logo.html"]');
  const pagLinks = Array.from(document.querySelectorAll('a')).filter(a => {
    const t = a.textContent?.trim() || '';
    return /^\d+$/.test(t) || a.getAttribute('rel') === 'next' || /next|prev|load more|show all|view all/i.test(t) || a.className.includes('next') || a.className.includes('page');
  }).map(a => ({text: a.textContent?.trim().slice(0,20), href: a.href, class: a.className, rel: a.getAttribute('rel')}));
  // Look for a "load more" button or infinite scroll trigger
  const loadMore = Array.from(document.querySelectorAll('button, a')).filter(b => /load more|show more|view all|see all|more/i.test(b.textContent || '')).map(b => ({tag: b.tagName, text: b.textContent?.trim().slice(0,30), href: b.href || ''}));
  return { cardCount: cards.length, pagLinks: pagLinks.slice(0, 15), loadMore: loadMore.slice(0, 5) };
});
console.log('CAR-BRANDS page:', JSON.stringify(info, null, 2));

// 2. Check the homepage - it claimed "300+". Look for the full count + any "all brands" link
await page.goto('https://www.carlogos.org/', { waitUntil: 'networkidle', timeout: 60000 });
const home = await page.evaluate(() => {
  // Find text mentioning a number of brands
  const text = document.body.textContent || '';
  const numMatch = text.match(/(\d+)\s*(?:car )?(?:logos?|brands?)/i);
  // Look for A-Z index or "all brands" links
  const azLinks = Array.from(document.querySelectorAll('a')).filter(a => {
    const t = a.textContent?.trim() || '';
    return /^[A-Z]$/i.test(t) || /all brands|a-z|browse all|view all/i.test(t);
  }).map(a => ({text: a.textContent?.trim().slice(0,20), href: a.href}));
  return { numMatch: numMatch?.[0], azLinks: azLinks.slice(0, 10) };
});
console.log('\nHOMEPAGE:', JSON.stringify(home, null, 2));

// 3. Check tire-brands page count
await page.goto('https://www.carlogos.org/tire-brands/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150));} window.scrollTo(0,0); });
await page.waitForTimeout(2000);
const tires = await page.evaluate(() => {
  const cards = document.querySelectorAll('a[href*="-logo.html"]');
  return { tireCardCount: cards.length, sample: Array.from(cards).slice(0,3).map(c => c.href) };
});
console.log('\nTIRE-BRANDS page:', JSON.stringify(tires, null, 2));

// 4. Check motorcycle-brands page count
await page.goto('https://www.carlogos.org/motorcycle-brands/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,150));} window.scrollTo(0,0); });
await page.waitForTimeout(2000);
const moto = await page.evaluate(() => {
  const cards = document.querySelectorAll('a[href*="-logo.html"]');
  return { motoCardCount: cards.length, sample: Array.from(cards).slice(0,3).map(c => c.href) };
});
console.log('\nMOTORCYCLE-BRANDS page:', JSON.stringify(moto, null, 2));

// 5. Check the brands page URL for pagination params (page/2, ?page=2, etc)
await page.goto('https://www.carlogos.org/car-brands/page/2/', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
const p2 = await page.evaluate(() => ({ url: location.href, title: document.title, cardCount: document.querySelectorAll('a[href*="-logo.html"]').length }));
console.log('\nPAGE 2 attempt:', JSON.stringify(p2, null, 2));

await browser.close();
console.log('\nDONE');
