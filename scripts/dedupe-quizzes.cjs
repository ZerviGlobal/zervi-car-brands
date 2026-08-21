const fs = require('fs');
const path = require('path');
const DIR = '/home/ubuntu/hermes/zervi-car-brands/docs/research/quiz-content';
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.json'));
const index = [];
let totalImages = 0;
for (const f of files) {
  const p = path.join(DIR, f);
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  // dedupe images by src (keep first occurrence)
  const seen = new Set();
  const dedup = [];
  for (const im of d.images) {
    if (!seen.has(im.src)) { seen.add(im.src); dedup.push(im); }
  }
  d.images = dedup;
  fs.writeFileSync(p, JSON.stringify(d, null, 2));
  totalImages += dedup.length;
  index.push({ slug: d.slug, title: d.title, h1: d.h1, imageCount: dedup.length, contentBlocks: d.contentBlocks.length, images: dedup.map(i => ({ src: i.src, localPath: i.localPath, alt: i.alt })) });
}
fs.writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/quizzes-content-index.json', JSON.stringify({ section: 'quizzes', entries: index, totalImages, totalEntries: files.length }, null, 2));
console.log('Deduped. totalImages=' + totalImages + ' entries=' + files.length);
