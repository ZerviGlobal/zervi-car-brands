import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const IMAGE_DIR = 'public/images/tire-logos';
const OUTPUT_DIR = 'docs/research/tire-brand-content';
const BASE_URL = 'https://www.carlogos.org';
const CHROME_PATH = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';

function downloadImage(url, destPath) {
  return new Promise((resolve) => {
    let fullUrl = url;
    if (url.startsWith('/')) fullUrl = BASE_URL + url;
    const filename = path.basename(fullUrl.split('?')[0]);
    const fullPath = path.join(destPath, filename);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 0) {
      resolve({ success: true, filename, fullPath, skipped: true });
      return;
    }
    const protocol = fullUrl.startsWith('https') ? https : http;
    const request = protocol.get(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'Referer': 'https://www.carlogos.org/' },
      timeout: 15000
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadImage(response.headers.location, destPath).then(resolve);
        return;
      }
      if (response.statusCode !== 200) {
        resolve({ success: false, filename, fullPath, error: `HTTP ${response.statusCode}` });
        return;
      }
      const fileStream = fs.createWriteStream(fullPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => { fileStream.close(); resolve({ success: true, filename, fullPath }); });
      fileStream.on('error', (e) => resolve({ success: false, filename, fullPath, error: e.message }));
    });
    request.on('error', (e) => resolve({ success: false, filename, fullPath, error: e.message }));
    request.on('timeout', () => { request.destroy(); resolve({ success: false, filename, fullPath, error: 'timeout' }); });
  });
}

const entry = { slug: 'linglong-logo', name: 'Linglong', category: 'China', years: '1975-Present', logo: 'https://www.carlogos.org/tire-logos/linglong-logo.png', href: 'https://www.carlogos.org/tire-brands/linglong-logo.html' };

const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();

// Retry with retries
let success = false;
for (let attempt = 1; attempt <= 3 && !success; attempt++) {
  try {
    await page.goto(entry.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);
    success = true;
  } catch(e) {
    console.log(`Attempt ${attempt} failed: ${e.message.split('\n')[0]}`);
    if (attempt < 3) await page.waitForTimeout(5000);
  }
}

if (!success) {
  console.log('All retries failed for Linglong');
  await browser.close();
  process.exit(1);
}

const data = await page.evaluate(() => {
  const h1 = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : null;
  const timelineItems = [];
  document.querySelectorAll('.tm-item').forEach(item => {
    const year = item.querySelector('h3') ? item.querySelector('h3').textContent.trim() : '';
    const ltId = item.querySelector('.lt-id') ? item.querySelector('.lt-id').textContent.trim() : '';
    const imgs = Array.from(item.querySelectorAll('img')).map(img => ({
      src: img.getAttribute('src') || img.getAttribute('data-src') || '',
      alt: img.getAttribute('alt') || ''
    })).filter(i => i.src && !i.src.includes('twemoji') && !i.src.includes('emoji'));
    if (imgs.length > 0) timelineItems.push({ year, ltId, imgs });
  });
  
  const mainImages = [];
  const seen = new Set();
  document.querySelectorAll('.p-tit img, .p-tit-l img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    const alt = img.getAttribute('alt') || '';
    if (src && !src.includes('twemoji') && !src.includes('emoji') && !seen.has(src)) { seen.add(src); mainImages.push({ src, alt, type: 'main-logo' }); }
  });
  document.querySelectorAll('.cur-lg img, .cur-lg-l img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    const alt = img.getAttribute('alt') || '';
    if (src && !src.includes('twemoji') && !src.includes('emoji') && !seen.has(src)) { seen.add(src); mainImages.push({ src, alt, type: 'current-logo' }); }
  });
  document.querySelectorAll('.tm-item img, .src-dl img, .li-dl img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    const alt = img.getAttribute('alt') || '';
    if (src && !src.includes('twemoji') && !src.includes('emoji') && !seen.has(src)) { seen.add(src); mainImages.push({ src, alt, type: 'timeline' }); }
  });
  document.querySelectorAll('.m-left img').forEach(img => {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
    const alt = img.getAttribute('alt') || '';
    if (src && !src.includes('twemoji') && !src.includes('emoji') && !src.includes('adsbygoogle') && !src.includes('googlesyndication') && !seen.has(src)) { seen.add(src); mainImages.push({ src, alt, type: 'content' }); }
  });
  
  const contentBlocks = [];
  const blockEls = document.querySelectorAll('.m-left h2, .m-left h3, .m-left h4, .m-left p, .m-left .tm-item, .m-left .desc, .m-left .intro');
  blockEls.forEach(el => {
    const tag = el.tagName ? el.tagName.toLowerCase() : el.className;
    const text = el.textContent.trim();
    if (el.closest('.shlk, .svsh, .ad-300, .mp-1')) return;
    if (text.length === 0) return;
    if (text.includes('document.write') || text.includes('©') || text.includes('carlogos.org')) return;
    if (text === 'Share this:') return;
    contentBlocks.push({ type: tag === 'tm-item' ? 'timeline-item' : tag, text });
  });
  document.querySelectorAll('p').forEach(p => {
    if (p.closest('.shlk, .svsh, .ad-300, .mp-1, footer, header, .m-right')) return;
    const t = p.textContent.trim();
    if (t.length > 20 && !t.includes('document.write') && !t.includes('©') && !contentBlocks.find(c => c.text === t)) {
      contentBlocks.unshift({ type: 'paragraph', text: t });
    }
  });
  
  return { h1, contentBlocks, mainImages };
});

const imagesDownloaded = [];
for (const img of data.mainImages) {
  const result = await downloadImage(img.src, IMAGE_DIR);
  if (result.success) imagesDownloaded.push({ src: img.src, localPath: `/images/tire-logos/${result.filename}`, alt: img.alt, type: img.type });
  else console.log(`Image download failed: ${img.src} - ${result.error}`);
}
if (entry.logo && entry.logo.startsWith('https://')) {
  const already = imagesDownloaded.find(i => i.src.includes(path.basename(entry.logo.split('?')[0])));
  if (!already) {
    const result = await downloadImage(entry.logo, IMAGE_DIR);
    if (result.success) imagesDownloaded.push({ src: entry.logo, localPath: `/images/tire-logos/${result.filename}`, alt: entry.name + ' logo', type: 'list-logo' });
  }
}

const brandData = {
  slug: entry.slug, name: entry.name, h1: data.h1,
  contentBlocks: data.contentBlocks, images: imagesDownloaded,
  facts: { name: entry.name, category: entry.category, years: entry.years, sourceUrl: entry.href }
};
fs.writeFileSync(path.join(OUTPUT_DIR, `${entry.slug}.json`), JSON.stringify(brandData, null, 2));
console.log(`Linglong: ${imagesDownloaded.length} images, ${data.contentBlocks.length} content blocks`);
await browser.close();
