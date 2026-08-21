import { readFileSync, writeFileSync } from 'fs';

const brands = JSON.parse(readFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-data.json'));

// Expanded category list (from the site)
const cats = [
  'Electric Vehicles', 'Mass-Market', 'Luxury Vehicles', 'Supercars', 'Muscle Cars',
  'Sports Cars', 'Compact Cars', 'Heavy-duty Trucks', 'Commercial Vehicles',
  'Luxury', 'Defunct', 'Microcars', 'Off-road Vehicles', 'Prestige Cars',
  'Tuning Company', 'Kit Cars', 'Trucks', 'Buses'
];

function parseCard(text) {
  let name = text, category = '', years = '';
  for (const c of cats) {
    const idx = text.indexOf(c);
    if (idx > 0) {
      name = text.slice(0, idx).trim();
      const rest = text.slice(idx + c.length);
      const ym = rest.match(/(\d{4}[-–](?:Present|\d{4}))/);
      if (ym) years = ym[1];
      category = c;
      break;
    }
  }
  // Fallback: if name still has trailing digits/words, try to split on first digit (year)
  if (!category) {
    const ym = name.match(/(\d{4}[-–](?:Present|\d{4}))/);
    if (ym) { years = ym[1]; name = name.slice(0, name.indexOf(ym[1])).trim(); }
  }
  return { name, category, years };
}

const cleaned = brands.map(b => {
  const card = parseCard(b.name);  // b.name here is actually the full raw card text
  // Prefer the h1 from the detail page if the parsed name looks wrong (contains digits or category words)
  let name = card.name;
  if (b.h1 && (!name || /\d/.test(name) || cats.some(c => name.includes(c)))) {
    name = b.h1.replace(/\s+Logo.*$/i, '').replace(/\s+Car Brand.*$/i, '').trim() || name;
  }
  // If still has category appended, strip it
  cats.forEach(c => { if (name.includes(c)) name = name.replace(c, '').trim(); });
  return {
    slug: b.slug,
    name: name,
    category: card.category || b.category || '',
    years: card.years || b.years || '',
    logo: b.logo,
    href: b.href,
    metaDescription: b.metaDescription || '',
    description: b.description || '',
    founded: b.fullMeta?.Founded || '',
    founders: b.fullMeta?.Founders || '',
    headquarters: b.fullMeta?.Headquarters || '',
    keyModels: b.fullMeta?.['Key Models'] || '',
    officialSite: b.fullMeta?.['Official Site'] || '',
    popularity: b.fullMeta?.['Most Popular'] || ''
  };
});

// Sort alphabetically by name
cleaned.sort((a, b) => a.name.localeCompare(b.name));
writeFileSync('/home/ubuntu/hermes/zervi-car-brands/docs/research/car-brands-clean.json', JSON.stringify(cleaned, null, 2));

// Show a few to verify
console.log('Cleaned brands:', cleaned.length);
['Tesla','BMW','Toyota','Dodge','Lamborghini','Ford'].forEach(n => {
  const b = cleaned.find(x => x.name === n);
  if (b) console.log(n + ':', JSON.stringify({category: b.category, years: b.years, founded: b.founded, headquarters: b.headquarters}));
});
// Show any with empty name or category
const noName = cleaned.filter(b => !b.name || /\d/.test(b.name));
console.log('Still-bad names:', noName.length, JSON.stringify(noName.slice(0,3), null, 2));
const noCat = cleaned.filter(b => !b.category);
console.log('No category:', noCat.length, noCat.slice(0,5).map(b => b.name));
