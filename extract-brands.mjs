import { chromium } from 'playwright';
import { writeFileSync, readFileSync, mkdirSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Load the brand list
const raw = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-raw.json'));
console.log('Brand detail pages to extract:', raw.length);

// Parse the card text into name + category + years
// Format observed: "TeslaElectric Vehicles2003-Present"
function parseCard(text) {
  // Brand name is at the start. Category keywords we know: Electric Vehicles, Mass-Market, Luxury Vehicles, Supercars, etc.
  const cats = ['Electric Vehicles', 'Mass-Market', 'Luxury Vehicles', 'Supercars', 'Luxury', 'Sports Cars', 'Commercial Vehicles', 'Defunct'];
  let category = '', years = '', name = text;
  for (const c of cats) {
    if (text.includes(c)) {
      const idx = text.indexOf(c);
      name = text.slice(0, idx);
      const rest = text.slice(idx + c.length);
      // years is the trailing part
      const yearMatch = rest.match(/(\d{4}-Present|\d{4}-\d{4}|\d{4}-)/);
      if (yearMatch) { years = yearMatch[1]; category = c; }
      else { category = c; }
      break;
    }
  }
  return { name: name.trim(), category, years };
}

const brands = [];
for (let i = 0; i < raw.length; i++) {
  const b = raw[i];
  const card = parseCard(b.text);
  let detail = { ...card, slug: b.href.split('/').pop().replace('.html', ''), href: b.href, logo: '/images/car-logos/' + (b.imgSrc.split('/').pop().split('?')[0]) };
  try {
    await page.goto(b.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    // Extract the brand description / about text + any other metadata
    const data = await page.evaluate(() => {
      // The brand detail page typically has an h1 with the brand name, then description paragraphs
      const h1 = document.querySelector('h1')?.textContent?.trim();
      // Get the main content paragraphs (skip nav/footer)
      const content = document.querySelector('main, article, .content, .brand-info, .entry-content');
      const paras = content ? Array.from(content.querySelectorAll('p')).map(p => p.textContent?.trim()).filter(Boolean).slice(0, 5) : [];
      // Look for structured meta (founded, headquarters, etc.)
      const meta = {};
      const defItems = document.querySelectorAll('dt, .brand-meta dt, .info dt, strong');
      defItems.forEach(d => {
        const label = d.textContent?.trim().replace(':', '');
        const val = d.nextElementSibling?.textContent?.trim() || d.closest('tr')?.querySelector('td:nth-child(2)')?.textContent?.trim() || '';
        if (label && val && label.length < 40) meta[label] = val;
      });
      // meta description
      const metaDesc = document.querySelector('meta[name=description]')?.getAttribute('content') || '';
      return { h1, paras, meta, metaDesc };
    });
    detail.description = data.paras.join(' ').slice(0, 600);
    detail.metaDescription = data.metaDesc;
    detail.fullMeta = data.meta;
    brands.push(detail);
    if ((i+1) % 10 === 0) console.log('extracted', i+1, '/', raw.length, '-', detail.name);
  } catch (e) {
    console.log('FAIL', b.href, e.message.slice(0, 60));
    brands.push(detail);
  }
}
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-data.json', JSON.stringify(brands, null, 2));
console.log('TOTAL extracted:', brands.length);
console.log('Sample:', JSON.stringify(brands[0], null, 2));
await browser.close();
