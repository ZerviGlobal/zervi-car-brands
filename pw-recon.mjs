import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('https://www.carlogos.org/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);

mkdirSync('/home/ubuntu/hermes/zervi-car-brands/docs/research', { recursive: true });
mkdirSync('/home/ubuntu/hermes/zervi-car-brands/docs/design-references', { recursive: true });
mkdirSync('/home/ubuntu/hermes/zervi-car-brands/public/images', { recursive: true });

// 1. Screenshot homepage
await page.screenshot({ path: '/home/ubuntu/hermes/zervi-car-brands/docs/design-references/home-full.png', fullPage: true });
console.log('screenshot: home-full.png');

// 2. Design tokens: computed styles from body + key elements
const tokens = await page.evaluate(() => {
  const body = getComputedStyle(document.body);
  const h1 = document.querySelector('h1');
  const h1Style = h1 ? getComputedStyle(h1) : null;
  const a = document.querySelector('a');
  const aStyle = a ? getComputedStyle(a) : null;
  const nav = document.querySelector('nav, header');
  const navStyle = nav ? getComputedStyle(nav) : null;
  // Extract all unique colors and font-families used
  const colors = new Set();
  const fonts = new Set();
  const all = document.querySelectorAll('body, body *');
  const sample = Array.from(all).slice(0, 200);
  sample.forEach(el => {
    const cs = getComputedStyle(el);
    colors.add(cs.color);
    colors.add(cs.backgroundColor);
    fonts.add(cs.fontFamily);
  });
  return {
    body: {
      bg: body.backgroundColor,
      color: body.color,
      fontFamily: body.fontFamily,
      fontSize: body.fontSize,
      lineHeight: body.lineHeight,
    },
    h1: h1Style ? { color: h1Style.color, fontFamily: h1Style.fontFamily, fontSize: h1Style.fontSize, fontWeight: h1Style.fontWeight } : null,
    link: aStyle ? { color: aStyle.color, fontFamily: aStyle.fontFamily } : null,
    nav: navStyle ? { bg: navStyle.backgroundColor, color: navStyle.color } : null,
    allColors: Array.from(colors).filter(c => c && c !== 'rgba(0, 0, 0, 0)').slice(0, 30),
    allFonts: Array.from(fonts).slice(0, 10),
  };
});
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/design-tokens.json', JSON.stringify(tokens, null, 2));
console.log('design tokens extracted:', JSON.stringify(tokens.allColors.length, null, 2), 'colors,', tokens.allFonts.length, 'fonts');

// 3. Homepage structure: sections + the car brand grid
const structure = await page.evaluate(() => {
  const sections = Array.from(document.querySelectorAll('section, .section, [class*=section], main > div, main > section')).map(s => ({
    tag: s.tagName,
    class: s.className?.toString().slice(0, 80),
    childCount: s.children.length,
    text: s.textContent?.trim().slice(0, 100),
  }));
  // Find the car brand listing (likely a grid of logos)
  const brandLinks = Array.from(document.querySelectorAll('a')).filter(a => a.href.includes('/car-brands/')).map(a => ({
    text: a.textContent?.trim().slice(0, 40),
    href: a.href,
  }));
  return { sections: sections.slice(0, 20), brandLinks: brandLinks.slice(0, 30) };
});
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/home-structure.json', JSON.stringify(structure, null, 2));
console.log('structure:', structure.sections.length, 'sections,', structure.brandLinks.length, 'brand links');

// 4. Fonts: extract @font-face / link hrefs
const fonts = await page.evaluate(() => {
  const links = Array.from(document.querySelectorAll('link[rel=stylesheet]')).map(l => l.href);
  const fontFaces = Array.from(document.querySelectorAll('link[href*=fonts.googleapis]')).map(l => l.href);
  return { stylesheets: links.slice(0, 10), googleFonts: fontFaces };
});
console.log('fonts:', JSON.stringify(fonts, null, 2));

// 5. Scope: visit /car-brands/ to see how many brands exist
await page.goto('https://www.carlogos.org/car-brands/', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2000);
const brands = await page.evaluate(() => {
  // Each brand is likely a card with a link + logo img
  const items = Array.from(document.querySelectorAll('a[href*="/car-brands/"]')).filter(a => {
    const u = new URL(a.href);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.length >= 2 && parts[0] === 'car-brands' && parts[1]; // has a brand slug
  });
  const seen = new Set();
  const unique = items.filter(a => { const k = a.href; if (seen.has(k)) return false; seen.add(k); return true; });
  return unique.slice(0, 50).map(a => ({ text: a.textContent?.trim().slice(0, 40), href: a.href, img: a.querySelector('img')?.src || null }));
});
console.log('CAR BRANDS FOUND:', brands.length, '(showing first 10)');
console.log(JSON.stringify(brands.slice(0, 10), null, 2));
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-list.json', JSON.stringify(brands, null, 2));

await page.screenshot({ path: '/home/ubuntu/hermes/zervi-car-brands/docs/design-references/brands-page.png', fullPage: false });
console.log('screenshot: brands-page.png');

await browser.close();
console.log('RECON DONE');
