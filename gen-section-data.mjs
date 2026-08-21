import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

function loadSection(sectionDir, imgDir, sectionName) {
  const dir = '/home/ubuntu/hermes/zervi-car-brands/docs/research/' + sectionDir;
  const entries = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
    try {
      const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      if (!d.slug || d.slug === 'index') continue;
      // First content block that looks like a name; use h1 otherwise
      let name = d.name || (d.h1 ? d.h1.replace(/\s+Logo.*$/i, '').trim() : d.slug);
      if (name === d.slug) name = d.h1 ? d.h1.replace(/\s+Logo.*$/i, '').trim() : d.slug;
      // Find the primary logo image (first image or the local one matching slug)
      let logo = '/images/' + imgDir + '/' + d.slug + '.png';
      const imgFiles = readdirSync('/home/ubuntu/hermes/zervi-car-brands/public/images/' + imgDir).filter(f => /^[a-z0-9-]+\.(png|jpg|webp|svg)$/i.test(f));
      if (existsSync('/home/ubuntu/hermes/zervi-car-brands/public/images/' + imgDir + '/' + d.slug + '.png')) {
        logo = '/images/' + imgDir + '/' + d.slug + '.png';
      } else if (imgFiles.length > 0) {
        logo = '/images/' + imgDir + '/' + imgFiles[0];
      }
      entries.push({
        slug: d.slug,
        name: name,
        category: sectionName === 'tire-brands' ? 'Tire Brands' : 'Motorcycle Brands',
        years: '',
        logo,
        href: 'https://www.carlogos.org/' + sectionName + '/' + d.slug + '.html',
        metaDescription: d.facts ? Object.entries(d.facts).slice(0, 2).map(([k, v]) => k + ': ' + v).join('; ') : '',
        description: d.contentBlocks && d.contentBlocks[0] ? d.contentBlocks[0].text.slice(0, 200) : '',
        founded: (d.facts && d.facts['Founded']) || '',
        founders: (d.facts && d.facts['Founders']) || '',
        headquarters: (d.facts && d.facts['Headquarters']) || '',
        keyModels: (d.facts && d.facts['Key Models']) || '',
        officialSite: (d.facts && d.facts['Official Site']) || '',
      });
    } catch (e) { /* skip */ }
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return entries;
}

const tires = loadSection('tire-brand-content', 'tire-logos', 'tire-brands');
const motos = loadSection('motorcycle-brand-content', 'motorcycle-logos', 'motorcycle-brands');
console.log('Tire brands:', tires.length, '| Motorcycle brands:', motos.length);

// Generate the two data modules
function genModule(entries, exportName, typeName) {
  const data = JSON.stringify(entries, null, 2);
  return [
    'import type { CarBrand } from "@/types/car-brand";',
    '',
    'export const ' + exportName + ': CarBrand[] = ' + data + ';',
    '',
    'export const ' + exportName.replace(/s$/, 'BySlug') + ' = (slug: string): CarBrand | undefined =>',
    '  ' + exportName + '.find((b) => b.slug === slug);',
    '',
  ].join('\n');
}
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/src/data/tire-brands.ts', genModule(tires, 'tireBrands', 'CarBrand'));
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/src/data/motorcycle-brands.ts', genModule(motos, 'motorcycleBrands', 'CarBrand'));
console.log('Wrote src/data/tire-brands.ts (' + tires.length + ') + src/data/motorcycle-brands.ts (' + motos.length + ')');
