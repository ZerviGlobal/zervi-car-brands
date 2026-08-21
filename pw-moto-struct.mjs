import { chromium } from 'playwright';
import fs from 'fs';

const CHROME = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', viewport: { width: 1280, height: 1800 } });
  const page = await ctx.newPage();
  const url = 'https://www.carlogos.org/car-brands/volkswagen-logo.html';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Dump the main content container's children in order
  const structure = await page.evaluate(() => {
    const main = document.querySelector('.lg-main.m1100') || document.querySelector('.lg-main') || document.body;
    const out = [];
    function walk(el, depth) {
      if (depth > 3) return;
      for (const child of el.children) {
        const tag = child.tagName.toLowerCase();
        const cls = (child.className || '').toString();
        // Only surface meaningful elements
        if (['h1','h2','h3','h4','p','img','ul','ol','li','a','span','div','section','figure','figcaption','time','blockquote'].includes(tag)) {
          const txt = (child.textContent || '').trim().slice(0, 100).replace(/\s+/g, ' ');
          const src = child.tagName === 'IMG' ? (child.getAttribute('src') || '') : '';
          const alt = child.tagName === 'IMG' ? (child.getAttribute('alt') || '') : '';
          if (tag === 'img' || txt) {
            out.push({ depth, tag, cls: cls.slice(0, 40), src, alt, txt });
          }
        }
        walk(child, depth + 1);
      }
    }
    walk(main, 0);
    return out.slice(0, 120);
  });
  console.log(JSON.stringify(structure, null, 2));

  // Also list all sections within main
  const sections = await page.evaluate(() => {
    const main = document.querySelector('.lg-main.m1100') || document.querySelector('.lg-main') || document.body;
    return Array.from(main.children).map(c => ({ tag: c.tagName.toLowerCase(), cls: (c.className||'').toString(), id: c.id, txt: (c.textContent||'').trim().slice(0,80).replace(/\s+/g,' ') }));
  });
  console.log('\n=== TOP-LEVEL CHILDREN OF MAIN ===');
  console.log(JSON.stringify(sections, null, 2));

  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
