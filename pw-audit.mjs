import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// 1. Inspect a full brand detail page (Tesla) - what assets does it have?
await page.goto('https://www.carlogos.org/car-brands/tesla-logo.html', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);
const teslaAudit = await page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight }));
  const h1 = document.querySelector('h1')?.textContent?.trim();
  // Full content structure
  const main = document.querySelector('main, article, .content, .brand-info, .entry-content, #content, .content-area');
  const paras = main ? Array.from(main.querySelectorAll('p, h2, h3, li')).map(e => ({ tag: e.tagName, text: e.textContent?.trim().slice(0, 120) })).slice(0, 30) : [];
  // structured facts table
  const facts = Array.from(document.querySelectorAll('dl dt, .brand-meta dt, table th, strong')).slice(0, 15).map(d => ({ label: d.textContent?.trim().replace(':',''), val: d.nextElementSibling?.textContent?.trim() || d.closest('tr')?.querySelector('td:nth-child(2)')?.textContent?.trim() || '' }));
  // og:image
  const og = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
  return { h1, imgCount: imgs.length, imgs: imgs.slice(0, 10), paras, facts, og };
});
console.log('=== TESLA DETAIL PAGE AUDIT ===');
console.log('h1:', teslaAudit.h1);
console.log('img count:', teslaAudit.imgCount);
console.log('imgs:', JSON.stringify(teslaAudit.imgs.slice(0,5), null, 2));
console.log('content paras:', teslaAudit.paras.length);
console.log('sample paras:', JSON.stringify(teslaAudit.paras.slice(0, 6), null, 2));
console.log('facts:', JSON.stringify(teslaAudit.facts.filter(f => f.val).slice(0, 8), null, 2));
console.log('og:image:', teslaAudit.og);

// 2. Tire brands scope
await page.goto('https://www.carlogos.org/tire-brands/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));} window.scrollTo(0,0); });
await page.waitForTimeout(1500);
const tires = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('a[href*="-logo.html"]')).filter(a => { try { return new URL(a.href).pathname.includes('/tire-brands/'); } catch { return false; }});
  const seen = new Set(); const unique = cards.filter(a => { const k=a.href; if(seen.has(k))return false; seen.add(k); return true;});
  // pagination?
  const pag = Array.from(document.querySelectorAll('a')).filter(a => /^\d+$/.test(a.textContent?.trim()||'')).map(a => a.href).filter(h => h.includes('page'));
  return { count: unique.length, sample: unique.slice(0,3).map(a => a.href), pagination: pag.slice(0,3) };
});
console.log('\n=== TIRE BRANDS ===', JSON.stringify(tires, null, 2));

// 3. Motorcycle brands scope
await page.goto('https://www.carlogos.org/motorcycle-brands/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120));} window.scrollTo(0,0); });
await page.waitForTimeout(1500);
const moto = await page.evaluate(() => {
  const cards = Array.from(document.querySelectorAll('a[href*="-logo.html"]')).filter(a => { try { return new URL(a.href).pathname.includes('/motorcycle-brands/'); } catch { return false; }});
  const seen = new Set(); const unique = cards.filter(a => { const k=a.href; if(seen.has(k))return false; seen.add(k); return true;});
  return { count: unique.length, sample: unique.slice(0,3).map(a => a.href) };
});
console.log('\n=== MOTORCYCLE BRANDS ===', JSON.stringify(moto, null, 2));

// 4. Homepage assets (favicons, og, hero)
await page.goto('https://www.carlogos.org/', { waitUntil: 'networkidle', timeout: 60000 });
const homeAssets = await page.evaluate(() => {
  const favicons = Array.from(document.querySelectorAll('link[rel*=icon], link[rel="apple-touch-icon"], link[rel="manifest"]')).map(l => l.href);
  const og = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
  const heroImgs = Array.from(document.querySelectorAll('header img, .hero img, main img')).slice(0,5).map(i => i.src);
  return { favicons, og, heroImgs };
});
console.log('\n=== HOMEPAGE ASSETS ===', JSON.stringify(homeAssets, null, 2));

await browser.close();
console.log('\nAUDIT DONE');
