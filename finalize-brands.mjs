import { readFileSync, writeFileSync } from 'fs';

const dom = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-dom.json'));
const detail = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-data.json'));

// Build a lookup of detail data by slug
const detailMap = {};
detail.forEach(d => { detailMap[d.slug] = d; });

const brands = dom.map(card => {
  const slug = card.href.split('/').pop().replace('.html', '');
  const name = card.childElements.find(c => c.tag === 'B')?.text || card.imgAlt.replace(' Logo', '') || slug;
  const category = card.childElements.find(c => c.class === 'ht-tag')?.text || '';
  const years = card.childElements.find(c => c.class === 'ht-year')?.text || '';
  const countryFlag = card.childElements.find(c => c.tag === 'I') ? card.childElements.find(c => c.tag === 'I') : null;
  // logo filename
  let logo = card.imgSrc;
  if (logo.startsWith('/')) logo = '/images/car-logos/' + logo.split('/').pop().split('?')[0];
  else if (logo.includes('/car-logos/')) logo = '/images/car-logos/' + logo.split('/').pop().split('?')[0];
  
  const d = detailMap[slug] || {};
  return {
    slug,
    name,
    category,
    years,
    logo,
    href: card.href,
    metaDescription: d.metaDescription || '',
    description: d.description || '',
    founded: d.fullMeta?.Founded || '',
    founders: d.fullMeta?.Founders || '',
    headquarters: d.fullMeta?.Headquarters || '',
    keyModels: d.fullMeta?.['Key Models'] || '',
    officialSite: d.fullMeta?.['Official Site'] || '',
    popularity: d.fullMeta?.['Most Popular'] || ''
  };
});

brands.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-final.json', JSON.stringify(brands, null, 2));

// Stats
const withDesc = brands.filter(b => b.description).length;
const withMeta = brands.filter(b => b.metaDescription).length;
const withFacts = brands.filter(b => b.founded).length;
console.log('FINAL brand count:', brands.length);
console.log('With description:', withDesc, '/ With metaDescription:', withMeta, '/ With founded fact:', withFacts);
console.log('Categories:', JSON.stringify([...new Set(brands.map(b => b.category))]));
console.log('\nSample 3:', JSON.stringify(brands.slice(0, 3).map(({slug,name,category,years,founded,headquarters}) => ({slug,name,category,years,founded,headquarters})), null, 2));

// Generate the TypeScript data module
const ts = `import type { CarBrand } from "@/types/car-brand";

export const carBrands: CarBrand[] = ${JSON.stringify(brands, null, 2)};

export const carBrandBySlug = (slug: string): CarBrand | undefined =>
  carBrands.find((b) => b.slug === slug);

export const carBrandsByCategory = (): Record<string, CarBrand[]> => {
  const map: Record<string, CarBrand[]> = {};
  for (const b of carBrands) {
    const c = b.category || "Other";
    (map[c] ||= []).push(b);
  }
  return map;
};
`;
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/src/data/car-brands.ts', ts);
console.log('\nWrote src/data/car-brands.ts');
