import { readFileSync, writeFileSync } from 'fs';
const brands = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-final.json'));

// Type definition
const typeDef = `export interface CarBrand {
  slug: string;
  name: string;
  category: string;
  years: string;
  logo: string;
  href: string;
  metaDescription: string;
  description: string;
  founded: string;
  founders: string;
  headquarters: string;
  keyModels: string;
  officialSite: string;
  popularity: string;
}
`;
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/src/types/car-brand.ts', typeDef);

// Data module
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

console.log('Wrote src/types/car-brand.ts and src/data/car-brands.ts');
console.log('Brand count:', brands.length);
console.log('Categories:', JSON.stringify([...new Set(brands.map(b => b.category))]));
console.log('With description:', brands.filter(b => b.description).length);
console.log('With founded fact:', brands.filter(b => b.founded).length);
