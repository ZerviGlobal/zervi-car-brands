import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const exec = '/home/ubuntu/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome';
const browser = await chromium.launch({ headless: true, executablePath: exec, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logosDir = '/home/ubuntu/hermes/zervi-car-brands/public/images/car-logos';

const all = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-all.json'));
console.log('Total brands:', all.length);

let needed = 0, downloaded = 0, failed = 0, already = 0;
// We need the actual remote URL for each logo. The logo path is local (/images/...), 
// but the original filename is the slug + '-logo.png'. Reconstruct remote URL.
for (const b of all) {
  const localPath = resolve(logosDir, b.logo.split('/').pop());
  if (existsSync(localPath)) { already++; continue; }
  needed++;
  const remoteUrl = 'https://www.carlogos.org/car-logos/' + b.logo.split('/').pop();
  try {
    const resp = await page.goto(remoteUrl, { waitUntil: 'networkidle', timeout: 15000, referer: 'https://www.carlogos.org/' }).catch(() => null);
    if (resp && resp.status() === 200) {
      const buf = await resp.body();
      writeFileSync(localPath, buf);
      downloaded++;
    } else {
      // Try the brand's own detail page to find the logo src (some use different filenames)
      const dr = await page.goto(b.href, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
      if (dr) {
        const realSrc = await page.evaluate(() => {
          const img = document.querySelector('img[src*="/car-logos/"]');
          return img ? img.src : null;
        });
        if (realSrc) {
          const r2 = await page.goto(realSrc, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null);
          if (r2 && r2.status() === 200) { const buf = await r2.body(); writeFileSync(localPath, buf); downloaded++; }
          else { failed++; }
        } else { failed++; }
      } else { failed++; }
    }
    if (downloaded % 25 === 0 && downloaded > 0) console.log('downloaded', downloaded, '/', needed, '(failed:', failed + ')');
  } catch (e) { failed++; }
}
console.log('\n=== LOGOS ===');
console.log('already had:', already, '| newly downloaded:', downloaded, '| failed:', failed, '| total now:', already + downloaded);
const totalFiles = await import('fs').then(fs => fs.readdirSync(logosDir).length);
console.log('files in logos dir:', totalFiles);
await browser.close();
