import { chromium } from 'playwright';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function scopeSection(url, sectionName) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null);
  await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=800){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} window.scrollTo(0,0); });
  await page.waitForTimeout(1500);
  const data = await page.evaluate(() => {
    // brand cards (have -logo.html in href)
    const brandCards = Array.from(document.querySelectorAll('a[href*="-logo.html"]'));
    const seen = new Set();
    const unique = brandCards.filter(a => { const k=a.href; if(seen.has(k))return false; seen.add(k); return true;});
    // article cards (reviews/quizzes - have different href patterns)
    const articles = Array.from(document.querySelectorAll('a')).filter(a => {
      const h = a.href; const t = a.textContent?.trim()||'';
      return t.length > 5 && !h.includes('-logo.html') && !h.includes('/car-brands/') && !h.includes('/tire-brands/') && !h.includes('/motorcycle-brands/') && !h.includes('#') && !h.includes('javascript');
    });
    const artSeen = new Set();
    const artUnique = articles.filter(a => { const k=a.href; if(artSeen.has(k))return false; artSeen.add(k); return true;}).slice(0, 50);
    // pagination links
    const pag = Array.from(document.querySelectorAll('a')).filter(a => /^\d+$/.test(a.textContent?.trim()||'')).map(a => a.href).filter(h => h.includes('page')).slice(0,5);
    return { brandCardCount: unique.length, brandSample: unique.slice(0,3).map(a=>a.href), articleCount: artUnique.length, articleSample: artUnique.slice(0,5).map(a => ({text: a.textContent?.trim().slice(0,40), href: a.href})), pagination: pag };
  });
  console.log('=== ' + sectionName + ' ===');
  console.log(JSON.stringify(data, null, 2));
  return data;
}

await scopeSection('https://www.carlogos.org/tire-brands/', 'TIRE BRANDS');
await scopeSection('https://www.carlogos.org/motorcycle-brands/', 'MOTORCYCLE BRANDS');
await scopeSection('https://www.carlogos.org/reviews/', 'REVIEWS');
await scopeSection('https://www.carlogos.org/quizzes/', 'QUIZZES');

await browser.close();
console.log('\nDONE');
