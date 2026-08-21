import { chromium } from 'playwright';

const CHROME = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox','--disable-gpu'] });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', viewport: { width: 1280, height: 1800 } });
  const page = await ctx.newPage();
  const url = 'https://www.carlogos.org/car-brands/volkswagen-logo.html';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Find where h1 and intro paragraph live
  const headerInfo = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const pTit = document.querySelector('.p-tit');
    const pCon = document.querySelector('.p-con, .p-cont, .pdesc, .lg-desc');
    // Walk up from h1
    const h1Parent = h1 ? h1.parentElement : null;
    // Find the intro paragraph (the one with the brand description, near h1)
    let introP = null;
    if (h1) {
      let el = h1;
      for (let i = 0; i < 6 && el; i++) {
        el = el.parentElement;
        if (!el) break;
        const p = el.querySelector('p');
        if (p && p.textContent.trim().length > 20) { introP = p; break; }
      }
    }
    // Get the main logo image (large brand logo near top)
    const mainImgs = Array.from(document.querySelectorAll('img')).filter(i => {
      const src = i.getAttribute('src') || '';
      return src.includes('volkswagen-logo') && !src.includes('logo-20') && !src.includes('logo-19');
    }).map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt') }));
    return {
      h1Text: h1 ? h1.textContent.trim() : null,
      h1ParentClass: h1Parent ? h1Parent.className : null,
      h1ParentTag: h1Parent ? h1Parent.tagName.toLowerCase() : null,
      pTitText: pTit ? pTit.textContent.trim().slice(0,200) : null,
      pTitClass: pTit ? pTit.className : null,
      introP: introP ? introP.textContent.trim().slice(0,300) : null,
      introPClass: introP ? introP.className : null,
      mainImgs
    };
  });
  console.log(JSON.stringify(headerInfo, null, 2));

  // Dump the section containing h1 fully
  const headerHTML = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    if (!h1) return null;
    let el = h1;
    for (let i = 0; i < 4; i++) {
      if (el.parentElement) el = el.parentElement;
    }
    return el.outerHTML.slice(0, 3000);
  });
  console.log('\n=== HEADER SECTION HTML ===');
  console.log(headerHTML);

  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
