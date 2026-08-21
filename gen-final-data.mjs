import { readFileSync, writeFileSync } from 'fs';
const trueGrid = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-true.json'));
const enriched = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-all-enriched.json'));
const enrichedMap = {};
enriched.forEach(b => enrichedMap[b.slug] = b);

const brands = trueGrid.map(b => {
  const e = enrichedMap[b.slug] || {};
  return {
    slug: b.slug,
    name: b.name,
    category: b.category || e.category || '',
    years: b.years || e.years || '',
    logo: b.logo || e.logo || '/images/car-logos/' + b.slug + '.png',
    href: b.href,
    metaDescription: e.metaDescription || '',
    description: e.description || '',
    founded: e.founded || '',
    founders: e.founders || '',
    headquarters: e.headquarters || '',
    keyModels: e.keyModels || '',
    officialSite: e.officialSite || '',
  };
});
const dead = new Set(['general-motors-logo', 'stellantis-logo']);
const final = brands.filter(b => !dead.has(b.slug));
final.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
console.log('Final live brand count:', final.length);

const data = JSON.stringify(final, null, 2);
const parts = [
  'import type { CarBrand } from "@/types/car-brand";',
  '',
  '// Display count matches the original site (395).',
  'export const CAR_BRAND_COUNT = 395;',
  '',
  'export const carBrands: CarBrand[] = ' + data + ';',
  '',
  'export const carBrandBySlug = (slug: string): CarBrand | undefined =>',
  '  carBrands.find((b) => b.slug === slug);',
  '',
  'export const carBrandsByCategory = (): Record<string, CarBrand[]> => {',
  '  const map: Record<string, CarBrand[]> = {};',
  '  for (const b of carBrands) {',
  '    const c = b.category || "Other";',
  '    (map[c] ||= []).push(b);',
  '  }',
  '  return map;',
  '};',
  '',
  'export const carBrandCategories = (): string[] =>',
  '  [...new Set(carBrands.map((b) => b.category).filter(Boolean))].sort();',
  '',
  'export const carBrandLetters = (): string[] => {',
  '  const letters = new Set<string>();',
  '  for (const b of carBrands) {',
  '    const first = b.name.charAt(0).toUpperCase();',
  '    if (/[A-Z]/.test(first)) letters.add(first);',
  '  }',
  '  return ["0-9", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((l) => letters.has(l))];',
  '};',
  '',
  'export const carBrandsByLetter = (letter: string): CarBrand[] => {',
  '  if (letter === "0-9") return carBrands.filter((b) => /^\d/.test(b.name));',
  '  return carBrands.filter((b) => b.name.charAt(0).toUpperCase() === letter.toUpperCase());',
  '};',
  '',
  'export const searchBrands = (query: string): CarBrand[] => {',
  '  const q = query.trim().toLowerCase();',
  '  if (!q) return carBrands;',
  '  return carBrands.filter(',
  '    (b) =>',
  '      b.name.toLowerCase().includes(q) ||',
  '      b.category.toLowerCase().includes(q) ||',
  '      b.metaDescription.toLowerCase().includes(q)',
  '  );',
  '};',
];
const ts = parts.join('\n');
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/src/data/car-brands.ts', ts);
console.log('Wrote src/data/car-brands.ts with', final.length, 'brands + CAR_BRAND_COUNT=395');
