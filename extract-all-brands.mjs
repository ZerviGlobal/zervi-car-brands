import { chromium } from 'playwright';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
const page = await ctx.newPage();

const brands = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-all-enriched.json','utf8'));
const contentDir = '/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brand-content';
const imgDir = '/home/ubuntu/hermes/zervi-car-brands/public/images/car-logos';
if (!existsSync(contentDir)) mkdirSync(contentDir, { recursive: true });
if (!existsSync(imgDir)) mkdirSync(imgDir, { recursive: true });

// Deep-extract: walk .m-left in document order, capturing h2/h3/h4/p and imgs (inline + li-img + tm-item imgs)
function extractBlocks(doc) {
  const main = doc.querySelector('main');
  if (!main) return { blocks: [], imgs: [] };
  const left = main.querySelector('.m-left') || main;
  const blocks = [];
  const imgs = [];
  const seenImg = new Set();
  const walk = (el) => {
    for (const c of el.children) {
      const tag = c.tagName.toLowerCase();
      if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
        const t = c.textContent.trim();
        if (t) blocks.push({ tag, text: t });
        // headings may contain no imgs; continue walking? No - skip into headings
        continue;
      } else if (tag === 'p') {
        const t = c.textContent.trim();
        if (t) blocks.push({ tag, text: t });
        // p may contain imgs (inline) - capture them
        for (const im of c.querySelectorAll('img')) {
          const src = im.currentSrc || im.src || im.getAttribute('data-src') || '';
          if (src && !seenImg.has(src)) { seenImg.add(src); imgs.push({ src, alt: im.alt || '' }); }
        }
        continue;
      } else if (tag === 'img') {
        const src = c.currentSrc || c.src || c.getAttribute('data-src') || '';
        if (src && !seenImg.has(src)) { seenImg.add(src); imgs.push({ src, alt: c.alt || '' }); }
        continue;
      } else if (tag === 'li') {
        const im = c.querySelector('img');
        if (im) {
          const src = im.currentSrc || im.src || im.getAttribute('data-src') || '';
          if (src && !seenImg.has(src)) { seenImg.add(src); imgs.push({ src, alt: im.alt || '' }); }
        }
        continue;
      } else if (tag === 'ul' || tag === 'div' || tag === 'span' || tag === 'a' || tag === 'section' || tag === 'article' || tag === 'figure' || tag === 'figcaption') {
        // skip share/quiz/tags/nav but walk into content divs
        const cls = (c.className || '').toString();
        if (cls.includes('shlk') || cls.includes('svsh') || cls.includes('quiz') || c.id === 'quiz-app' || cls.includes('tags')) continue;
        walk(c);
        continue;
      } else {
        continue;
      }
    }
  };
  walk(left);
  return { blocks, imgs };
}

// Facts: parse the Brand Profile section if present (dt/dd pairs or table or labeled divs)
function extractFacts(doc) {
  const facts = {};
  const main = doc.querySelector('main');
  if (!main) return facts;
  // Look for definition lists
  const dts = main.querySelectorAll('dt');
  for (let i = 0; i < dts.length; i++) {
    const dt = dts[i].textContent.trim();
    const dd = dts[i].nextElementSibling;
    if (dd && dd.tagName.toLowerCase() === 'dd') facts[dt] = dd.textContent.trim();
  }
  // Look for tables
  const tables = main.querySelectorAll('table');
  for (const t of tables) {
    const rows = t.querySelectorAll('tr');
    for (const r of rows) {
      const cells = r.querySelectorAll('th, td');
      if (cells.length >= 2) {
        const k = cells[0].textContent.trim();
        const v = cells[1].textContent.trim();
        if (k && v && !facts[k]) facts[k] = v;
      }
    }
  }
  // Look for labeled divs in Brand Profile (common pattern: .bp-row with label + value)
  const bpRows = main.querySelectorAll('.bp-row, .brand-info tr, .info-row, .fact');
  for (const r of bpRows) {
    const label = r.querySelector('.bp-label, .label, th, .info-label');
    const value = r.querySelector('.bp-value, .value, td, .info-value');
    if (label && value) {
      const k = label.textContent.trim();
      const v = value.textContent.trim();
      if (k && v && !facts[k]) facts[k] = v;
    }
  }
  return facts;
}

// Download an image (skip emojis, twemoji, and non-carlogos/non-logo images)
async function downloadImage(src, slug) {
  if (!src) return null;
  let url = src;
  // resolve relative
  if (src.startsWith('//')) url = 'https:' + src;
  else if (src.startsWith('/')) url = 'https://www.carlogos.org' + src;
  // skip non-content images
  if (url.includes('twemoji') || url.includes('emoji') || url.includes('google') || url.includes('gstatic') || url.includes('facebook') || url.includes('pinterest') || url.includes('instagram') || url.includes('twitter')) return null;
  // Only download carlogos images (logos + uploads)
  if (!url.includes('carlogos.org')) return null;
  const fn = basename(new URL(url).pathname);
  if (!fn || !/\.(png|jpg|jpeg|webp|gif|svg)$/i.test(fn)) return null;
  const localPath = '/images/car-logos/' + fn;
  const fullPath = join(imgDir, fn);
  if (!existsSync(fullPath)) {
    try {
      const resp = await page.request.get(url, { timeout: 30000 });
      const buf = await resp.body();
      writeFileSync(fullPath, buf);
    } catch (e) {
      return null;
    }
  }
  return localPath;
}

let processed = 0, imagesDownloaded = 0, filesWritten = 0, errors = 0;
const indexEntries = [];

for (let i = 0; i < brands.length; i++) {
  const b = brands[i];
  const url = b.href;
  // RESUMABLE: skip brands already extracted (content file exists + non-empty)
  const existingFile = join(contentDir, b.slug + '.json');
  if (existsSync(existingFile)) {
    try {
      const existing = JSON.parse(readFileSync(existingFile, 'utf8'));
      if (existing && existing.contentBlocks && existing.contentBlocks.length > 0) {
        processed++;
        indexEntries.push({ slug: b.slug, name: b.name, imageCount: existing.images?.length || 0, blockCount: existing.contentBlocks.length });
        continue;
      }
    } catch (e) { /* corrupt - reprocess */ }
  }
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(()=>{});
    await page.waitForTimeout(1200);
    // lazy-load: scroll to bottom
    await page.evaluate(async () => { for (let y=0; y<document.body.scrollHeight; y+=900){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));} window.scrollTo(0,0); });
    await page.waitForTimeout(600);

    const data = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return { h1Text: h1 ? h1.textContent.trim() : '', doc: document };
    });
    // page.evaluate can't return DOM; re-extract in browser
    const extracted = await page.evaluate(() => {
      const doc = document;
      function extractBlocks() {
        const main = doc.querySelector('main');
        if (!main) return { blocks: [], imgs: [] };
        const left = main.querySelector('.m-left') || main;
        const blocks = [];
        const imgs = [];
        const seenImg = new Set();
        const walk = (el) => {
          for (const c of el.children) {
            const tag = c.tagName.toLowerCase();
            if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
              const t = c.textContent.trim();
              if (t) blocks.push({ tag, text: t });
              continue;
            } else if (tag === 'p') {
              const t = c.textContent.trim();
              if (t) blocks.push({ tag, text: t });
              for (const im of c.querySelectorAll('img')) {
                const src = im.currentSrc || im.src || im.getAttribute('data-src') || '';
                if (src && !seenImg.has(src)) { seenImg.add(src); imgs.push({ src, alt: im.alt || '' }); }
              }
              continue;
            } else if (tag === 'img') {
              const src = c.currentSrc || c.src || c.getAttribute('data-src') || '';
              if (src && !seenImg.has(src)) { seenImg.add(src); imgs.push({ src, alt: c.alt || '' }); }
              continue;
            } else if (tag === 'li') {
              const im = c.querySelector('img');
              if (im) {
                const src = im.currentSrc || im.src || im.getAttribute('data-src') || '';
                if (src && !seenImg.has(src)) { seenImg.add(src); imgs.push({ src, alt: im.alt || '' }); }
              }
              continue;
            } else if (['ul','div','span','a','section','article','figure','figcaption'].includes(tag)) {
              const cls = (c.className || '').toString();
              if (cls.includes('shlk') || cls.includes('svsh') || cls.includes('quiz') || c.id === 'quiz-app' || cls.includes('tags')) continue;
              walk(c);
              continue;
            } else { continue; }
          }
        };
        walk(left);
        return { blocks, imgs };
      }
      function extractFacts() {
        const facts = {};
        const main = doc.querySelector('main .m-left') || doc.querySelector('main');
        if (!main) return facts;
        const dts = main.querySelectorAll('dt');
        for (let i = 0; i < dts.length; i++) {
          const dt = dts[i].textContent.trim();
          const dd = dts[i].nextElementSibling;
          if (dd && dd.tagName.toLowerCase() === 'dd') facts[dt] = dd.textContent.trim();
        }
        const tables = main.querySelectorAll('table');
        for (const t of tables) {
          const rows = t.querySelectorAll('tr');
          for (const r of rows) {
            const cells = r.querySelectorAll('th, td');
            if (cells.length >= 2) {
              const k = cells[0].textContent.trim();
              const v = cells[1].textContent.trim();
              if (k && v && !facts[k]) facts[k] = v;
            }
          }
        }
        const bpRows = main.querySelectorAll('.bp-row, .brand-info tr, .info-row, .fact, .pf-item');
        for (const r of bpRows) {
          const label = r.querySelector('.bp-label, .label, th, .info-label, .pf-label');
          const value = r.querySelector('.bp-value, .value, td, .info-value, .pf-value');
          if (label && value) {
            const k = label.textContent.trim();
            const v = value.textContent.trim();
            if (k && v && !facts[k]) facts[k] = v;
          }
        }
        return facts;
      }
      const h1 = doc.querySelector('h1');
      return { h1Text: h1 ? h1.textContent.trim() : '', ...extractBlocks(), facts: extractFacts() };
    });

    // Download images
    const imageRecords = [];
    for (const im of extracted.imgs) {
      const local = await downloadImage(im.src, b.slug);
      if (local) { imageRecords.push({ src: im.src, localPath: local, alt: im.alt }); imagesDownloaded++; }
      else if (im.src && (im.src.includes('carlogos.org') || im.src.startsWith('/') || im.src.startsWith('https://www.carlogos'))) {
        // record even if download failed? task says download every image. record with localPath null if failed
        imageRecords.push({ src: im.src, localPath: local || null, alt: im.alt });
      }
    }

    const out = {
      slug: b.slug,
      name: b.name,
      h1: extracted.h1Text,
      contentBlocks: extracted.blocks,
      images: imageRecords,
      facts: extracted.facts
    };
    writeFileSync(join(contentDir, b.slug + '.json'), JSON.stringify(out, null, 2));
    filesWritten++;
    indexEntries.push({ slug: b.slug, name: b.name, imageCount: imageRecords.length, blockCount: extracted.blocks.length });
    processed++;
    if (processed % 25 === 0) console.error('progress ' + processed + '/' + brands.length + ' imgs=' + imagesDownloaded);
  } catch (e) {
    errors++;
    console.error('ERR ' + b.slug + ': ' + e.message);
  }
}

// Write index
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-content-index.json', JSON.stringify({ section: 'car-brands', totalBrands: indexEntries.length, entries: indexEntries }, null, 2));
await browser.close();
console.log(JSON.stringify({ section: 'car-brands', entriesProcessed: processed, imagesDownloaded, contentFilesWritten: filesWritten, errors }));
