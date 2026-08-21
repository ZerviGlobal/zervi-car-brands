import { readFileSync, writeFileSync } from 'fs';
const brands = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-all-enriched.json'));
brands.forEach(b => {
  if (b.metaDescription) b.metaDescription = b.metaDescription.replace(/\s+/g, ' ').trim();
  if (b.description) b.description = b.description.replace(/\s+/g, ' ').trim();
  if (!b.category) b.category = 'Other';
});
brands.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

const data = JSON.stringify(brands, null, 2);
const parts = [
  'import type { CarBrand } from "@/types/car-brand";',
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
console.log('Wrote src/data/car-brands.ts with', brands.length, 'brands');
console.log('Categories:', [...new Set(brands.map(b => b.category))].length);
