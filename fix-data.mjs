import { readFileSync, writeFileSync } from 'fs';
const brands = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-final.json'));
// The "popularity" field captured the site-wide "Most Popular" sidebar, not per-brand data. Clear it.
brands.forEach(b => {
  b.popularity = '';
  // Clean description: strip newlines, trim
  if (b.description) b.description = b.description.replace(/\s+/g, ' ').trim();
  if (b.metaDescription) b.metaDescription = b.metaDescription.replace(/\s+/g, ' ').trim();
  // Clear empty-string category to "Other"
  if (!b.category) b.category = 'Other';
});
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-final.json', JSON.stringify(brands, null, 2));

// Regenerate the TS module
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

export const carBrandCategories = (): string[] =>
  [...new Set(carBrands.map((b) => b.category).filter(Boolean))];
`;
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/src/data/car-brands.ts', ts);
console.log('Fixed. Brands:', brands.length, '| With metaDescription:', brands.filter(b=>b.metaDescription).length, '| With description:', brands.filter(b=>b.description).length);
