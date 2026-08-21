const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const CHROME = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const ROOT = '/home/ubuntu/hermes/zervi-car-brands';
const OUT_DIR = path.join(ROOT, 'docs/research/quiz-content');
const IMG_DIR = path.join(ROOT, 'public/images/quizzes');
const LIST_FILE = path.join(ROOT, 'docs/research/quizzes-list.json');

const entries = JSON.parse(fs.readFileSync(LIST_FILE, 'utf8'));
console.log('Entries:', entries.length);

function slugify(href) {
  const u = new URL(href);
  return path.basename(u.pathname, '.html');
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }, timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
        return resolve(download(next, dest));
      }
      if (res.statusCode !== 200) { return reject(new Error('HTTP ' + res.statusCode + ' for ' + url)); }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(dest, buf);
        resolve(dest);
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
  const results = [];
  let totalImages = 0;
  let errors = 0;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const slug = slugify(e.href);
    console.log('[' + (i+1) + '/' + entries.length + '] ' + slug + ' -> ' + e.href);
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    const page = await context.newPage();
    try {
      await page.goto(e.href, { waitUntil: 'domcontentloaded', timeout: 45000 });
      // wait a bit for images to register
      await page.waitForTimeout(1500);
      const data = await page.evaluate(() => {
        const contentBlocks = [];
        const imgs = [];
        // Determine main content container
        const root = document.querySelector('main') || document.querySelector('article') || document.querySelector('.content') || document.body;
        // h1
        const h1 = document.querySelector('h1');
        const h1Text = h1 ? h1.textContent.trim() : '';
        // Walk through all elements in DOM order inside main/article
        function walk(node) {
          if (!node) return;
          const children = node.children;
          for (let i = 0; i < children.length; i++) {
            const el = children[i];
            const tag = el.tagName.toLowerCase();
            // skip script/style/nav/footer/header nav junk but keep article content
            if (['script','style','noscript'].includes(tag)) continue;
            // if it's a block-level content tag, capture text
            if (['p','h2','h3','h4','h5','h6','li','blockquote','figcaption'].includes(tag)) {
              const text = el.textContent.trim();
              if (text) contentBlocks.push({ tag, text });
            } else if (tag === 'img') {
              const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
              const alt = el.getAttribute('alt') || '';
              const titleAttr = el.getAttribute('title') || '';
              if (src) imgs.push({ src, alt: alt || titleAttr });
            } else if (tag === 'source') {
              // skip
            } else if (['figure','picture','div','section','article','ul','ol','table'].includes(tag)) {
              // dive deeper but also capture any direct img
              const subImgs = el.querySelectorAll('img');
              subImgs.forEach(im => {
                const src = im.getAttribute('src') || im.getAttribute('data-src') || '';
                const alt = im.getAttribute('alt') || im.getAttribute('title') || '';
                if (src && !imgs.find(x => x.src === src)) imgs.push({ src, alt: alt });
              });
              // recurse into div/section/figure to find nested p/h2 etc, but avoid double-counting imgs
              // Only recurse for div/section/figure/article - for ul/ol capture li already
              if (['div','section','figure','article','table','td','th','tr','tbody','thead'].includes(tag)) {
                walk(el);
              } else if (['ul','ol'].includes(tag)) {
                // li already captured above via children loop? No - children are li, so they'll be captured in main loop
                walk(el);
              }
            }
          }
        }
        walk(root);
        // Also collect images from the whole document in order to not miss any
        const allImgs = document.querySelectorAll('img');
        allImgs.forEach(im => {
          const src = im.getAttribute('src') || im.getAttribute('data-src') || '';
          const alt = im.getAttribute('alt') || im.getAttribute('title') || '';
          if (src && !imgs.find(x => x.src === src)) imgs.push({ src, alt });
        });
        return { h1Text, contentBlocks, imgs };
      });

      // Resolve image srcs to absolute and download
      const base = new URL(e.href);
      const downloadedImages = [];
      for (const im of data.imgs) {
        try {
          const abs = im.src.startsWith('//') ? (base.protocol + im.src) : (im.src.startsWith('http') ? im.src : new URL(im.src, base).href);
          // determine extension
          let ext = 'png';
          const urlPath = new URL(abs).pathname;
          const m = urlPath.match(/\.(png|jpe?g|webp|gif|svg)$/i);
          if (m) ext = m[1].toLowerCase().replace('jpeg','jpg');
          const fname = slug + '-' + (path.basename(urlPath).replace(/\.(png|jpe?g|webp|gif|svg)$/i,'') || ('img-'+downloadedImages.length)) + '.' + ext;
          const dest = path.join(IMG_DIR, fname);
          await download(abs, dest);
          downloadedImages.push({ src: abs, localPath: '/images/quizzes/' + fname, alt: im.alt || '' });
          totalImages++;
        } catch (err) {
          console.log('  img FAIL ' + im.src + ': ' + err.message);
          downloadedImages.push({ src: im.src, localPath: null, alt: im.alt || '' });
          errors++;
        }
      }

      const out = {
        slug,
        title: e.title || '',
        h1: data.h1Text,
        contentBlocks: data.contentBlocks,
        images: downloadedImages
      };
      fs.writeFileSync(path.join(OUT_DIR, slug + '.json'), JSON.stringify(out, null, 2));
      results.push({ slug, title: out.title, imageCount: downloadedImages.length, contentBlocks: out.contentBlocks.length });
      console.log('  OK: ' + out.contentBlocks.length + ' blocks, ' + downloadedImages.length + ' images, h1="' + out.h1 + '"');
    } catch (err) {
      console.log('  PAGE FAIL ' + slug + ': ' + err.message);
      errors++;
      // still write a stub
      fs.writeFileSync(path.join(OUT_DIR, slug + '.json'), JSON.stringify({ slug, title: e.title || '', h1: '', contentBlocks: [], images: [], error: err.message }, null, 2));
      results.push({ slug, title: e.title || '', imageCount: 0, contentBlocks: 0, error: err.message });
    } finally {
      await context.close();
    }
  }
  await browser.close();
  // index
  fs.writeFileSync(path.join(ROOT, 'docs/research/quizzes-content-index.json'), JSON.stringify({ section: 'quizzes', entries: results, totalImages, totalEntries: entries.length }, null, 2));
  console.log('\nDONE: ' + results.length + ' entries, ' + totalImages + ' images, ' + errors + ' errors');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
