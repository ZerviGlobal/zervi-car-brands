import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const SOURCE_FILE = 'docs/research/tire-brands-list.json';
const OUTPUT_DIR = 'docs/research/tire-brand-content';
const IMAGE_DIR = 'public/images/tire-logos';
const BASE_URL = 'https://www.carlogos.org';
const CHROME_PATH = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';

// Ensure directories exist
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(IMAGE_DIR, { recursive: true });

// Load the list
const list = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
const tireBrands = list.filter(e => 
  e.href && 
  e.href.startsWith('https://www.carlogos.org/tire-brands/') && 
  e.href.endsWith('.html') && 
  e.slug && 
  e.name
);

console.log(`Processing ${tireBrands.length} tire brands...`);

// Download helper
function downloadImage(url, destPath) {
  return new Promise((resolve) => {
    // Make URL absolute if relative
    let fullUrl = url;
    if (url.startsWith('/')) {
      fullUrl = BASE_URL + url;
    }
    
    // Get filename from URL
    const filename = path.basename(fullUrl.split('?')[0]);
    const fullPath = path.join(destPath, filename);
    
    // Check if already downloaded
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 0) {
      resolve({ success: true, filename, fullPath, skipped: true });
      return;
    }
    
    const protocol = fullUrl.startsWith('https') ? https : http;
    const request = protocol.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.carlogos.org/'
      },
      timeout: 15000
    }, (response) => {
      // Handle redirects
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
      fileStream.on('finish', () => {
        fileStream.close();
        resolve({ success: true, filename, fullPath });
      });
      fileStream.on('error', (e) => {
        resolve({ success: false, filename, fullPath, error: e.message });
      });
    });
    
    request.on('error', (e) => {
      resolve({ success: false, filename, fullPath, error: e.message });
    });
    
    request.on('timeout', () => {
      request.destroy();
      resolve({ success: false, filename, fullPath, error: 'timeout' });
    });
  });
}

async function extractBrand(browser, entry, index) {
  const page = await browser.newPage();
  const errors = [];
  const imagesDownloaded = [];
  
  try {
    await page.goto(entry.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const data = await page.evaluate(() => {
      // h1
      const h1 = document.querySelector('h1') ? document.querySelector('h1').textContent.trim() : null;
      
      // Breadcrumb for location/category
      let breadcrumb = '';
      const crumb = document.querySelector('.breadcrumb, nav ol, .crumb');
      if (crumb) breadcrumb = crumb.textContent.trim();
      
      // All content blocks from the main content area (m-left + main + article)
      const contentBlocks = [];
      
      // Get the main content area - m-left contains timeline + share
      // Also get description paragraph which might be in a different container
      const mainContent = document.querySelector('.m-left') || document.querySelector('main') || document.querySelector('article') || document.body;
      
      // Collect h2, h3, p from the main content (exclude sidebar/footer/header)
      const allEls = document.querySelectorAll('h2, h3, h4, p, .tm-item, .cur-lg');
      
      // Get timeline items
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
      
      // Get all main content images (exclude sidebar, ads, emoji, share)
      const mainImages = [];
      const seen = new Set();
      
      // Main logo image (p-tit)
      document.querySelectorAll('.p-tit img, .p-tit-l img').forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        const alt = img.getAttribute('alt') || '';
        if (src && !src.includes('twemoji') && !src.includes('emoji') && !seen.has(src)) {
          seen.add(src);
          mainImages.push({ src, alt, type: 'main-logo' });
        }
      });
      
      // Current display logo (cur-lg)
      document.querySelectorAll('.cur-lg img, .cur-lg-l img').forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        const alt = img.getAttribute('alt') || '';
        if (src && !src.includes('twemoji') && !src.includes('emoji') && !seen.has(src)) {
          seen.add(src);
          mainImages.push({ src, alt, type: 'current-logo' });
        }
      });
      
      // Timeline/evolution images
      document.querySelectorAll('.tm-item img, .src-dl img, .li-dl img').forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        const alt = img.getAttribute('alt') || '';
        if (src && !src.includes('twemoji') && !src.includes('emoji') && !seen.has(src)) {
          seen.add(src);
          mainImages.push({ src, alt, type: 'timeline' });
        }
      });
      
      // All images in m-left that are content images (not share/emoji)
      document.querySelectorAll('.m-left img').forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        const alt = img.getAttribute('alt') || '';
        if (src && !src.includes('twemoji') && !src.includes('emoji') && !src.includes('adsbygoogle') && !src.includes('googlesyndication') && !seen.has(src)) {
          seen.add(src);
          mainImages.push({ src, alt, type: 'content' });
        }
      });
      
      // Build content blocks in order: h2, h3, p (from main content area)
      const blockEls = document.querySelectorAll('.m-left h2, .m-left h3, .m-left h4, .m-left p, .m-left .tm-item, .m-left .desc, .m-left .intro');
      blockEls.forEach(el => {
        const tag = el.tagName ? el.tagName.toLowerCase() : el.className;
        const text = el.textContent.trim();
        // Skip share section, footer, etc.
        if (el.closest('.shlk, .svsh, .ad-300, .mp-1')) return;
        if (text.length === 0) return;
        // Skip "document.write" copyright text
        if (text.includes('document.write') || text.includes('©') || text.includes('carlogos.org')) return;
        // Skip share text
        if (text === 'Share this:') return;
        contentBlocks.push({ type: tag === 'tm-item' ? 'timeline-item' : tag, text });
      });
      
      // Also get description paragraph that might be outside m-left
      document.querySelectorAll('p').forEach(p => {
        if (p.closest('.shlk, .svsh, .ad-300, .mp-1, footer, header, .m-right')) return;
        const t = p.textContent.trim();
        if (t.length > 20 && !t.includes('document.write') && !t.includes('©') && !contentBlocks.find(c => c.text === t)) {
          contentBlocks.unshift({ type: 'paragraph', text: t });
        }
      });
      
      return { h1, breadcrumb, contentBlocks, timelineItems, mainImages };
    });
    
    // Download all images
    for (const img of data.mainImages) {
      const result = await downloadImage(img.src, IMAGE_DIR);
      if (result.success) {
        imagesDownloaded.push({
          src: img.src,
          localPath: `/images/tire-logos/${result.filename}`,
          alt: img.alt,
          type: img.type
        });
      } else {
        errors.push(`Image download failed: ${img.src} - ${result.error}`);
      }
    }
    
    // Also download the entry's logo from the list if not already captured
    if (entry.logo && entry.logo.startsWith('https://')) {
      const alreadyDownloaded = imagesDownloaded.find(i => i.src.includes(path.basename(entry.logo.split('?')[0])));
      if (!alreadyDownloaded) {
        const result = await downloadImage(entry.logo, IMAGE_DIR);
        if (result.success) {
          imagesDownloaded.push({
            src: entry.logo,
            localPath: `/images/tire-logos/${result.filename}`,
            alt: entry.name + ' logo',
            type: 'list-logo'
          });
        } else {
          errors.push(`List logo download failed: ${entry.logo} - ${result.error}`);
        }
      }
    }
    
    // Build facts
    const facts = {
      name: entry.name,
      category: entry.category || null,
      years: entry.years || null,
      sourceUrl: entry.href
    };
    
    // Build the final JSON object
    const brandData = {
      slug: entry.slug,
      name: entry.name,
      h1: data.h1,
      contentBlocks: data.contentBlocks,
      images: imagesDownloaded,
      facts: facts
    };
    
    // Write the per-brand JSON file
    const outputPath = path.join(OUTPUT_DIR, `${entry.slug}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(brandData, null, 2));
    
    console.log(`[${index + 1}/${tireBrands.length}] ${entry.name}: ${imagesDownloaded.length} images, ${data.contentBlocks.length} content blocks`);
    
    return { slug: entry.slug, name: entry.name, imagesCount: imagesDownloaded.length, contentBlocks: data.contentBlocks.length, errors };
  } catch (err) {
    errors.push(`Extraction error: ${err.message}`);
    console.error(`[${index + 1}/${tireBrands.length}] ERROR ${entry.name}: ${err.message}`);
    return { slug: entry.slug, name: entry.name, imagesCount: 0, contentBlocks: 0, errors };
  } finally {
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  for (let i = 0; i < tireBrands.length; i++) {
    const result = await extractBrand(browser, tireBrands[i], i);
    results.push(result);
  }
  
  await browser.close();
  
  // Write summary index
  const index = {
    section: 'tire-brands',
    totalEntries: results.length,
    totalImages: results.reduce((sum, r) => sum + r.imagesCount, 0),
    totalContentBlocks: results.reduce((sum, r) => sum + r.contentBlocks, 0),
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
    entries: results.map(r => ({
      slug: r.slug,
      name: r.name,
      imagesCount: r.imagesCount,
      contentBlocks: r.contentBlocks,
      errorCount: r.errors.length
    }))
  };
  
  fs.writeFileSync('docs/research/tire-brands-content-index.json', JSON.stringify(index, null, 2));
  
  console.log('\n=== SUMMARY ===');
  console.log(`Entries processed: ${results.length}`);
  console.log(`Total images downloaded: ${index.totalImages}`);
  console.log(`Total content blocks: ${index.totalContentBlocks}`);
  console.log(`Total errors: ${index.totalErrors}`);
  
  // Print any errors
  const allErrors = results.filter(r => r.errors.length > 0);
  if (allErrors.length > 0) {
    console.log('\n=== ERRORS ===');
    allErrors.forEach(r => {
      console.log(`${r.name} (${r.slug}):`);
      r.errors.forEach(e => console.log(`  - ${e}`));
    });
  }
  
  // Output final JSON summary
  console.log('\n=== JSON SUMMARY ===');
  console.log(JSON.stringify({
    section: 'tire-brands',
    entriesProcessed: results.length,
    imagesDownloaded: index.totalImages,
    contentFilesWritten: results.length,
    errors: index.totalErrors
  }));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
