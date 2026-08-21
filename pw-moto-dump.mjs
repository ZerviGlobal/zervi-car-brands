import { chromium } from 'playwright';
import fs from 'fs';

const CHROME = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const INDEX_URL = 'https://www.carlogos.org/motorcycle-brands/';

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', viewport: { width: 1280, height: 1800 } });
  const page = await ctx.newPage();
  console.log('Visiting:', INDEX_URL);
  await page.goto(INDEX_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  const url = page.url();
  console.log('Final URL:', url);
  const title = await page.title();
  console.log('Title:', title);

  // Dump all anchor hrefs
  const allLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a')).map(a => ({
      href: a.getAttribute('href'),
      text: (a.textContent || '').trim().slice(0, 80),
      alt: a.querySelector('img') ? (a.querySelector('img').getAttribute('alt') || '') : ''
    })).filter(l => l.href);
  });
  console.log('Total links:', allLinks.length);
  // Print links that contain 'logo' or 'brand' or 'motorcycle' to find brand pages
  const brandish = allLinks.filter(l => /logo|brand|motorcycle/i.test(l.href + ' ' + l.text));
  console.log('Brand-ish links:', JSON.stringify(brandish.slice(0, 40), null, 2));

  // Dump headings and structure to understand layout
  const structure = await page.evaluate(() => {
    const out = [];
    document.body.querySelectorAll('h1,h2,h3,h4,div,section,ul,li,article').forEach(el => {
      const tag = el.tagName.toLowerCase();
      const cls = (el.className || '').toString().slice(0, 60);
      const id = el.id || '';
      // Only surface containers that have class/id to keep noise down
      if (tag === 'div' || tag === 'section' || tag === 'ul' || tag === 'article') {
        if (cls || id) {
          const txt = (el.textContent || '').trim().slice(0, 80).replace(/\n/g, ' ');
          out.push({ tag, cls, id, txt });
        }
      } else {
        const txt = (el.textContent || '').trim().slice(0, 120).replace(/\n/g, ' ');
        out.push({ tag, cls, id, txt });
      }
    });
    return out.slice(0, 80);
  });
  console.log('STRUCTURE:', JSON.stringify(structure, null, 2));

  // Save full HTML for inspection
  const html = await page.content();
  fs.writeFileSync('/tmp/moto-index.html', html);
  console.log('Saved HTML to /tmp/moto-index.html size:', html.length);

  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
