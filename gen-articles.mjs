import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

function loadArticles(dir, type) {
  const full = '/home/ubuntu/hermes/zervi-car-brands/docs/research/' + dir;
  const articles = [];
  for (const f of readdirSync(full).filter(f => f.endsWith('.json'))) {
    try {
      const d = JSON.parse(readFileSync(join(full, f), 'utf8'));
      if (!d.slug) continue;
      const title = d.title ? d.title.replace(/^[^A-Za-z0-9]*/, '').slice(0, 100) : d.h1;
      // first image as thumbnail
      let thumb = '';
      const img = d.images && d.images.find(i => i.localPath);
      if (img) thumb = img.localPath;
      articles.push({
        slug: d.slug,
        title: title,
        h1: d.h1 || title,
        href: d.href || 'https://www.carlogos.org/' + (type === 'reviews' ? 'reviews' : 'quizzes') + '/' + d.slug + '.html',
        thumb,
        blockCount: d.contentBlocks ? d.contentBlocks.length : 0,
        imageCount: d.images ? d.images.length : 0,
      });
    } catch (e) {}
  }
  articles.sort((a, b) => a.title.localeCompare(b.title));
  return articles;
}

const reviews = loadArticles('review-content', 'reviews');
const quizzes = loadArticles('quiz-content', 'quizzes');
console.log('Reviews:', reviews.length, '| Quizzes:', quizzes.length);

function genModule(entries, exportName) {
  const data = JSON.stringify(entries, null, 2);
  return [
    'export interface Article {',
    '  slug: string;',
    '  title: string;',
    '  h1: string;',
    '  href: string;',
    '  thumb: string;',
    '  blockCount: number;',
    '  imageCount: number;',
    '}',
    '',
    'export const ' + exportName + ': Article[] = ' + data + ';',
    '',
    'export const ' + exportName.replace(/s$/, 'BySlug') + ' = (slug: string): Article | undefined =>',
    '  ' + exportName + '.find((a) => a.slug === slug);',
    '',
  ].join('\n');
}
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/src/data/reviews.ts', genModule(reviews, 'reviews'));
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/src/data/quizzes.ts', genModule(quizzes, 'quizzes'));
console.log('Wrote src/data/reviews.ts + src/data/quizzes.ts');
