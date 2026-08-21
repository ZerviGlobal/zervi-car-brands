import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const BASE_DIR = '/home/ubuntu/hermes/zervi-car-brands';
const CHROME_PATH = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const IMG_DIR = path.join(BASE_DIR, 'public/images/reviews');
const CONTENT_DIR = path.join(BASE_DIR, 'docs/research/review-content');
const INDEX_PATH = path.join(BASE_DIR, 'docs/research/reviews-content-index.json');

function slugify(href) {
  const u = new URL(href);
  let s = u.pathname.split('/').filter(Boolean).pop() || 'unknown';
  s = s.replace(/\.html$/, '');
  return s;
}

function downloadImage(url, destDir) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const filename = path.basename(parsed.pathname) || 'image';
      const dest = path.join(destDir, filename);
      const lib = parsed.protocol === 'https:' ? https : http;
      
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
        resolve({ src: url, localPath: '/images/reviews/' + filename, status: 'exists' });
        return;
      }
      
      const file = fs.createWriteStream(dest);
      const req = lib.get(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36', 'Referer': 'https://www.carlogos.org/' },
        timeout: 30000
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          try { fs.unlinkSync(dest); } catch(e) {}
          downloadImage(res.headers.location, destDir).then(resolve);
          return;
        }
        if (res.statusCode !== 200) {
          file.close();
          try { fs.unlinkSync(dest); } catch(e) {}
          resolve({ src: url, localPath: null, status: 'error_' + res.statusCode });
          return;
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve({ src: url, localPath: '/images/reviews/' + filename, status: 'ok' });
        });
      });
      req.on('error', (e) => {
        file.close();
        try { fs.unlinkSync(dest); } catch(e2) {}
        resolve({ src: url, localPath: null, status: 'error: ' + e.message });
      });
      req.on('timeout', () => {
        req.destroy();
        file.close();
        try { fs.unlinkSync(dest); } catch(e) {}
        resolve({ src: url, localPath: null, status: 'timeout' });
      });
    } catch(e) {
      resolve({ src: url, localPath: null, status: 'error: ' + e.message });
    }
  });
}

async function extractArticle(page, entry) {
  const url = entry.href;
  const slug = slugify(url);
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  
  const data = await page.evaluate(() => {
    const contentBlocks = [];
    const images = [];
    
    let main = document.querySelector('.article-content') || 
               document.querySelector('article') || 
               document.querySelector('main') ||
               document.querySelector('.content') ||
               document.querySelector('.post') ||
               document.querySelector('#content') ||
               document.body;
    
    const h1 = document.querySelector('h1');
    const h1Text = h1 ? h1.textContent.trim() : '';
    
    const articleBody = document.querySelector('.article-content') ||
                        document.querySelector('.post-content') ||
                        document.querySelector('.entry-content') ||
                        document.querySelector('article .content') ||
                        document.querySelector('article') ||
                        main;
    
    const elements = articleBody.querySelectorAll('h1, h2, h3, h4, h5, p, ul, ol, li, blockquote, table, figure');
    
    for (const el of elements) {
      if (el.closest('figure') && el.tagName !== 'FIGURE') continue;
      
      const tag = el.tagName.toLowerCase();
      const text = el.textContent.trim();
      
      if (!text && tag !== 'figure') continue;
      
      const imgs = el.querySelectorAll('img');
      
      if (tag === 'figure') {
        const figImg = el.querySelector('img');
        const figCap = el.querySelector('figcaption');
        if (figImg) {
          const src = figImg.src || figImg.getAttribute('data-src') || figImg.getAttribute('data-lazy-src') || '';
          const alt = figImg.alt || (figCap ? figCap.textContent.trim() : '') || '';
          if (src) images.push({ src, alt, tag: 'figure' });
        }
      } else if (imgs.length > 0 && tag === 'p') {
        contentBlocks.push({ tag, text });
        for (const img of imgs) {
          const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
          const alt = img.alt || '';
          if (src) images.push({ src, alt, tag: 'inline' });
        }
      } else if (tag === 'ul' || tag === 'ol') {
        const items = el.querySelectorAll('li');
        for (const li of items) {
          const liText = li.textContent.trim();
          if (liText) {
            contentBlocks.push({ tag: 'li', text: liText });
            const liImgs = li.querySelectorAll('img');
            for (const img of liImgs) {
              const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
              const alt = img.alt || '';
              if (src) images.push({ src, alt, tag: 'inline' });
            }
          }
        }
      } else if (tag === 'table') {
        contentBlocks.push({ tag: 'table', text: text });
      } else if (tag === 'blockquote') {
        contentBlocks.push({ tag, text });
      } else if (tag !== 'li') {
        contentBlocks.push({ tag, text });
      }
    }
    
    const allImgs = articleBody.querySelectorAll('img');
    for (const img of allImgs) {
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
      const alt = img.alt || '';
      if (src && !images.find(i => i.src === src)) {
        images.push({ src, alt, tag: 'standalone' });
      }
    }
    
    return { h1: h1Text, contentBlocks, images };
  });
  
  const downloadedImages = [];
  let imageErrors = 0;
  for (const img of data.images) {
    const result = await downloadImage(img.src, IMG_DIR);
    downloadedImages.push({
      src: img.src,
      localPath: result.localPath,
      alt: img.alt || ''
    });
    if (!result.localPath) imageErrors++;
  }
  
  const article = {
    slug: slug,
    title: entry.title,
    h1: data.h1,
    href: entry.href,
    contentBlocks: data.contentBlocks,
    images: downloadedImages
  };
  
  const outPath = path.join(CONTENT_DIR, slug + '.json');
  fs.writeFileSync(outPath, JSON.stringify(article, null, 2));
  
  return { slug, imageCount: downloadedImages.length, imageErrors, contentBlocks: data.contentBlocks.length, outPath };
}

async function main() {
  const listRaw = fs.readFileSync(path.join(BASE_DIR, 'docs/research/reviews-list.json'), 'utf-8');
  const list = JSON.parse(listRaw);
  console.log('Total entries:', list.length);
  
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });
  
  const page = await context.newPage();
  
  const results = [];
  let totalImages = 0;
  let totalErrors = 0;
  
  for (let i = 0; i < list.length; i++) {
    const entry = list[i];
    console.log('[' + (i+1) + '/' + list.length + '] Processing: ' + entry.href);
    try {
      const r = await extractArticle(page, entry);
      totalImages += r.imageCount;
      totalErrors += r.imageErrors;
      results.push({ slug: r.slug, href: entry.href, imageCount: r.imageCount, contentBlocks: r.contentBlocks, errors: r.imageErrors });
      console.log('   -> slug=' + r.slug + ', images=' + r.imageCount + ', blocks=' + r.contentBlocks);
    } catch(e) {
      console.error('   ERROR: ' + e.message);
      totalErrors++;
      results.push({ slug: slugify(entry.href), href: entry.href, imageCount: 0, contentBlocks: 0, errors: 1, error: e.message });
    }
  }
  
  await browser.close();
  
  const index = {
    section: 'reviews',
    entriesProcessed: results.length,
    imagesDownloaded: totalImages,
    contentFilesWritten: results.filter(r => !r.error).length,
    errors: totalErrors,
    entries: results
  };
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log('Entries processed:', results.length);
  console.log('Images downloaded:', totalImages);
  console.log('Content files written:', results.filter(r => !r.error).length);
  console.log('Errors:', totalErrors);
  console.log('Index written to:', INDEX_PATH);
  
  console.log('JSON_RESULT:' + JSON.stringify(index));
}

main().catch(e => { console.error(e); process.exit(1); });
