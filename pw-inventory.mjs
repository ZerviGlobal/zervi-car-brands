import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function scrapeListingPages(baseSectionUrl, cardSelector) {
  // Visit page 1, find max page number, visit all pages, collect cards
  const all = [];
  let maxPage = 1;
  for (let p = 1; p <= maxPage; p++) {
    const url = p === 1 ? baseSectionUrl : baseSectionUrl + 'page-' + p + '.html';
    const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null);
    if (!r || r.status() !== 200) break;
    await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} window.scrollTo(0,0); });
    await page.waitForTimeout(1000);
    // find pagination links on this page to discover maxPage
    if (p === 1) {
      const pagNums = await page.evaluate(() => Array.from(document.querySelectorAll('a')).filter(a => /^\d+$/.test(a.textContent?.trim()||'')).map(a => parseInt(a.textContent.trim())).filter(n => !isNaN(n)));
      maxPage = Math.max(...pagNums, 1);
    }
    const cards = await page.evaluate((sel) => {
      const links = Array.from(document.querySelectorAll('a[href*="-logo.html"], a[href*="' + sel + '"]'));
      const seen = new Set();
      return links.filter(a => { const k=a.href; if(seen.has(k))return false; seen.add(k); return true;}).map(a => {
        const img = a.querySelector('img');
        const raw = img?.src || img?.getAttribute('data-src') || '';
        const name = a.querySelector('b')?.textContent?.trim() || img?.getAttribute('alt')?.replace(/\s+Logo.*$/i,'').trim() || '';
        const cat = a.querySelector('.ht-tag')?.textContent?.trim() || '';
        const yrs = a.querySelector('.ht-year')?.textContent?.trim() || '';
        let logo = raw;
        if (logo.startsWith('/')) logo = '/images/car-logos/' + logo.split('/').pop().split('?')[0];
        else if (logo.includes('/car-logos/')) logo = '/images/car-logos/' + logo.split('/').pop().split('?')[0];
        return { slug: a.href.split('/').pop().replace('.html',''), name, category: cat, years: yrs, logo, href: a.href };
      });
    }, cardSelector);
    all.push(...cards);
    console.log('  page', p, ':', cards.length, 'cards (max discovered:', maxPage + ')');
  }
  // dedupe
  const seen = new Set(); const unique = all.filter(b => { const k=b.slug; if(seen.has(k))return false; seen.add(k); return true;});
  return unique;
}

// Tire brands - scrape all pages
console.log('=== TIRE BRANDS ===');
const tires = await scrapeListingPages('https://www.carlogos.org/tire-brands/', 'tire-brands');
console.log('TOTAL unique tire brands:', tires.length);
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/tire-brands-list.json', JSON.stringify(tires, null, 2));

// Motorcycle brands - the page uses the same card pattern
console.log('\n=== MOTORCYCLE BRANDS ===');
const moto = await scrapeListingPages('https://www.carlogos.org/motorcycle-brands/', 'motorcycle-brands');
console.log('TOTAL unique motorcycle brands:', moto.length);
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/motorcycle-brands-list.json', JSON.stringify(moto, null, 2));

// Reviews articles
console.log('\n=== REVIEWS ===');
await page.goto('https://www.carlogos.org/reviews/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} window.scrollTo(0,0); });
const reviews = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/reviews/"]')).filter(a => {
    const u = new URL(a.href); const parts = u.pathname.split('/').filter(Boolean);
    return parts.length >= 2 && parts[0] === 'reviews' && !parts[1].endsWith('.html') === false;
  });
  const seen = new Set();
  return links.filter(a => { const k=a.href; if(seen.has(k))return false; seen.add(k); return true;}).map(a => ({ href: a.href, title: a.textContent?.trim().slice(0,80), img: a.querySelector('img')?.src || '' }));
});
console.log('TOTAL review articles:', reviews.length);
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/reviews-list.json', JSON.stringify(reviews, null, 2));

// Quizzes
console.log('\n=== QUIZZES ===');
await page.goto('https://www.carlogos.org/quizzes/', { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} window.scrollTo(0,0); });
const quizzes = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('a[href*="/quizzes/"]')).filter(a => {
    const u = new URL(a.href); const parts = u.pathname.split('/').filter(Boolean);
    return parts.length >= 2 && parts[0] === 'quizzes';
  });
  const seen = new Set();
  return links.filter(a => { const k=a.href; if(seen.has(k))return false; seen.add(k); return true;}).map(a => ({ href: a.href, title: a.textContent?.trim().slice(0,80), img: a.querySelector('img')?.src || '' }));
});
console.log('TOTAL quiz articles:', quizzes.length);
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/quizzes-list.json', JSON.stringify(quizzes, null, 2));

await browser.close();
console.log('\nINVENTORY DONE');
