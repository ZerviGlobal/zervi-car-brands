import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const CHROME = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const BASE = '/home/ubuntu/hermes/zervi-car-brands';
const IMG_DIR = path.join(BASE, 'public/images/motorcycle-logos');
const CONTENT_DIR = path.join(BASE, 'docs/research/motorcycle-brand-content');
const LIST_FILE = path.join(BASE, 'docs/research/motorcycle-brands-list.json');
const INDEX_OUT = path.join(BASE, 'docs/research/motorcycle-brands-content-index.json');
const ORIGIN = 'https://www.carlogos.org';

fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(CONTENT_DIR, { recursive: true });

function absUrl(src, base) {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('//')) return 'https:' + src;
  if (src.startsWith('/')) return ORIGIN + src;
  try { return new URL(src, base).href; } catch { return null; }
}

function basenameFromUrl(url) {
  try {
    const u = new URL(url);
    const segs = u.pathname.split('/');
    let name = segs[segs.length - 1];
    if (!name) name = 'image_' + Math.random().toString(36).slice(2, 8);
    return name;
  } catch {
    return 'image_' + Math.random().toString(36).slice(2, 8);
  }
}

function downloadFile(url, destPath) {
  return new Promise((resolve) => {
    const proto = url.startsWith('https') ? https : http;
    const req = proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'image/*,*/*;q=0.8' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const next = loc.startsWith('http') ? loc : new URL(loc, url).href;
        return downloadFile(next, destPath).then(resolve, () => resolve(null));
      }
      if (res.statusCode !== 200) { res.resume(); return resolve(null); }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          fs.writeFileSync(destPath, Buffer.concat(chunks));
          resolve(destPath);
        } catch (e) { resolve(null); }
      });
      res.on('error', () => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(60000, () => { req.destroy(); resolve(null); });
  });
}

function slugify(s) {
  return String(s || '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function extractBrand(page, url) {
  // Returns structured content for a brand detail page
  return await page.evaluate((pageUrl) => {
    const ogGet = (sel) => {
      const m = document.querySelector(sel);
      return m ? m.getAttribute('content') : null;
    };
    const h1 = document.querySelector('h1');
    const pTit = document.querySelector('section.p-tit');
    const introP = pTit ? pTit.querySelector('p') : null;
    const lgMain = document.querySelector('.lg-main');
    const mLeft = lgMain ? lgMain.querySelector('.m-left, .lg-main > div.m-left') : null;
    
    // h2s and h3s within the main content (m-left or p-tit)
    const contentRoot = mLeft || pTit || document.body;
    
    // Collect all h2 in m-left + p-tit
    const h2s = [];
    const h3s = [];
    const paragraphs = [];
    
    // From p-tit
    if (pTit) {
      pTit.querySelectorAll('h2').forEach(e => { const t = (e.textContent||'').trim(); if (t) h2s.push(t); });
      pTit.querySelectorAll('p').forEach(e => { const t = (e.textContent||'').trim(); if (t) paragraphs.push(t); });
    }
    // From m-left
    if (mLeft) {
      mLeft.querySelectorAll('h2').forEach(e => { const t = (e.textContent||'').trim(); if (t) h2s.push(t); });
      mLeft.querySelectorAll('h3').forEach(e => { const t = (e.textContent||'').trim(); if (t) h3s.push(t); });
      mLeft.querySelectorAll('p').forEach(e => { const t = (e.textContent||'').trim(); if (t) paragraphs.push(t); });
    }
    
    // Timeline items
    const timeline = [];
    const tmItems = (mLeft ? mLeft.querySelectorAll('.tm-item') : []);
    tmItems.forEach(item => {
      const id = item.querySelector('.lt-id');
      const year = item.querySelector('h3');
      const img = item.querySelector('img');
      timeline.push({
        index: id ? (id.textContent||'').trim() : '',
        year: year ? (year.textContent||'').trim() : '',
        image: img ? { src: img.getAttribute('src') || img.getAttribute('data-src') || '', alt: img.getAttribute('alt') || '' } : null
      });
    });
    
    // Tags
    const tags = [];
    const tagsEl = mLeft ? mLeft.querySelector('.tags') : null;
    if (tagsEl) {
      tagsEl.querySelectorAll('a').forEach(a => { const t = (a.textContent||'').trim(); if (t) tags.push(t); });
    }
    
    // ALL images on the page (for like-for-like download)
    const allImgs = [];
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      const alt = img.getAttribute('alt') || '';
      const srcset = img.getAttribute('srcset') || '';
      if (src) allImgs.push({ src, alt, srcset });
    });
    
    // Main logo image (the big one in p-tit / header)
    const mainLogo = pTit ? pTit.querySelector('img') : null;
    
    return {
      url: pageUrl,
      title: document.title,
      metaDescription: ogGet('meta[name="description"]'),
      canonical: ogGet('link[rel="canonical"]'),
      h1: h1 ? h1.textContent.trim() : null,
      introParagraph: introP ? introP.textContent.trim() : null,
      h2s,
      h3s,
      paragraphs,
      timeline,
      tags,
      mainLogo: mainLogo ? { src: mainLogo.getAttribute('src') || '', alt: mainLogo.getAttribute('alt') || '' } : null,
      allImages: allImgs
    };
  }, url);
}

async function extractIndex(page, url) {
  // Extract content for the motorcycle-brands index page
  return await page.evaluate((pageUrl) => {
    const h1 = document.querySelector('h1');
    const pTit = document.querySelector('section.p-tit');
    const introP = pTit ? pTit.querySelector('p') : null;
    const paragraphs = [];
    document.querySelectorAll('p').forEach(e => { const t = (e.textContent||'').trim(); if (t.length > 0) paragraphs.push(t); });
    const h2s = Array.from(document.querySelectorAll('h2')).map(e => (e.textContent||'').trim()).filter(Boolean);
    const h3s = Array.from(document.querySelectorAll('h3')).map(e => (e.textContent||'').trim()).filter(Boolean);
    const allImgs = [];
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      const alt = img.getAttribute('alt') || '';
      if (src) allImgs.push({ src, alt });
    });
    return {
      url: pageUrl,
      title: document.title,
      metaDescription: document.querySelector('meta[name="description"]') ? document.querySelector('meta[name="description"]').getAttribute('content') : null,
      h1: h1 ? h1.textContent.trim() : null,
      introParagraph: introP ? introP.textContent.trim() : null,
      h2s, h3s, paragraphs,
      allImages: allImgs
    };
  }, url);
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(LIST_FILE, 'utf8'));
  console.log('Loaded', raw.length, 'entries from list file');
  
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox','--disable-gpu'] });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', viewport: { width: 1280, height: 1800 } });
  const page = await ctx.newPage();

  const summary = [];
  let totalImagesDownloaded = 0;
  let errors = 0;
  let contentFiles = 0;

  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i];
    const href = entry.href;
    let slug = entry.slug && entry.slug.trim() ? entry.slug.trim() : slugify(entry.name);
    if (!slug) {
      // First entry: index page
      slug = 'motorcycle-brands-index';
    }
    console.log('\n[' + (i+1) + '/' + raw.length + '] Processing slug=' + slug + ' href=' + href);
    
    let content;
    try {
      await page.goto(href, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(1500);
      const isIndex = href.endsWith('/motorcycle-brands/') || href.endsWith('/motorcycle-brands');
      content = isIndex ? await extractIndex(page, href) : await extractBrand(page, href);
    } catch (e) {
      console.error('  ERROR visiting/extracting ' + href + ': ' + e.message);
      errors++;
      content = { url: href, error: e.message, h1: entry.name };
    }
    
    // Download all images
    const downloadedImages = [];
    const seenSrcs = new Set();
    const allImgs = content.allImages || [];
    for (const img of allImgs) {
      const abs = absUrl(img.src, href);
      if (!abs || seenSrcs.has(abs)) continue;
      seenSrcs.add(abs);
      // Skip ad/tracking images and google ads
      if (/doubleclick|google|googlesyndication|cloudflare|adservice|/i.test(abs) && !/carlogos\.org/i.test(abs)) {
        if (!/carlogos\.org/i.test(abs)) continue;
      }
      // Only download images from carlogos.org (the actual content images)
      if (!/carlogos\.org/i.test(abs)) continue;
      const fname = basenameFromUrl(abs);
      const dest = path.join(IMG_DIR, fname);
      const ok = await downloadFile(abs, dest);
      if (ok) {
        downloadedImages.push({ originalSrc: img.src, absoluteUrl: abs, localPath: path.relative(BASE, dest), alt: img.alt || '', filename: fname });
        totalImagesDownloaded++;
      } else {
        downloadedImages.push({ originalSrc: img.src, absoluteUrl: abs, localPath: null, alt: img.alt || '', filename: fname, error: 'download failed' });
      }
    }
    content.downloadedImages = downloadedImages;
    content.imageCount = downloadedImages.length;
    content.slug = slug;
    content.brandName = entry.name;
    content.sourceHref = href;
    
    // Write per-brand JSON
    const outFile = path.join(CONTENT_DIR, slug + '.json');
    fs.writeFileSync(outFile, JSON.stringify(content, null, 2));
    contentFiles++;
    console.log('  Wrote ' + outFile + ' | images downloaded: ' + downloadedImages.length);
    
    summary.push({
      slug,
      name: entry.name || content.h1 || slug,
      href,
      contentFile: path.relative(BASE, outFile),
      imageCount: downloadedImages.length,
      error: content.error || null
    });
  }

  // Write summary index
  const indexData = {
    section: 'motorcycle-brands',
    generatedAt: new Date().toISOString(),
    source: 'https://www.carlogos.org/motorcycle-brands/',
    entries: summary,
    totals: {
      entriesProcessed: summary.length,
      imagesDownloaded: totalImagesDownloaded,
      contentFilesWritten: contentFiles,
      errors
    }
  };
  fs.writeFileSync(INDEX_OUT, JSON.stringify(indexData, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(indexData.totals, null, 2));
  console.log('Index written to: ' + INDEX_OUT);
  
  await browser.close();
}
main().catch(e => { console.error('FATAL', e); process.exit(1); });
