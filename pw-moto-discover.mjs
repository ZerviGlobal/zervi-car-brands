import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const CHROME = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const BASE = '/home/ubuntu/hermes/zervi-car-brands';
const INDEX_URL = 'https://www.carlogos.org/motorcycle-brands/';
const IMG_DIR = path.join(BASE, 'public/images/motorcycle-logos');
const CONTENT_DIR = path.join(BASE, 'docs/research/motorcycle-brand-content');
const LIST_FILE = path.join(BASE, 'docs/research/motorcycle-brands-list.json');
const INDEX_OUT = path.join(BASE, 'docs/research/motorcycle-brands-content-index.json');

fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(CONTENT_DIR, { recursive: true });

function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
        return downloadFile(next, destPath).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(destPath, Buffer.concat(chunks));
        resolve(destPath);
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(new Error('timeout')); });
  });
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', viewport: { width: 1280, height: 1800 } });
  const page = await ctx.newPage();

  // Step 1: Scrape the index page for the real list of motorcycle brands
  console.log('Visiting index:', INDEX_URL);
  await page.goto(INDEX_URL, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);

  // Extract brand links from the index page. Each brand entry is typically an <a> with an <img> + brand name.
  const brands = await page.evaluate(() => {
    const baseUrl = location.origin;
    const seen = new Map();
    // Look for anchor links that point to motorcycle brand detail pages
    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const text = (a.textContent || '').trim();
      // We want links that look like detail pages under motorcycle-brands
      const fullHref = href.startsWith('http') ? href : (href.startsWith('/') ? baseUrl + href : new URL(href, baseUrl).href);
      // Try to capture name from heading or alt
      const img = a.querySelector('img');
      const alt = img ? (img.getAttribute('alt') || '') : '';
      const name = text || alt;
      if (fullHref.includes('/motorcycle-brands/') && fullHref.endsWith('.html') && name) {
        if (!seen.has(fullHref)) {
          seen.set(fullHref, { name: name.replace(/\s+/g, ' ').trim(), href: fullHref, alt });
        }
      }
    });
    return Array.from(seen.entries()).map(([href, v]) => ({ href, name: v.name, alt: v.alt }));
  });

  console.log('Found', brands.length, 'brand links on index page');
  console.log(JSON.stringify(brands.slice(0, 20), null, 2));

  await browser.close();
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
