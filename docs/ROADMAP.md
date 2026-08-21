# Roadmap

## Future ideas (not started)

### Zervi Wiki (proposed)
Build an internal wiki for Zervi Group using the same pattern as this repo:
the ai-website-cloner-template + the extraction pipeline (Playwright content +
asset extraction, typed data modules, SSG detail pages, filtering UI).

Useful for:
- Company knowledge base (processes, SOPs, decisions)
- Product / brand documentation (Odoo modules, Saki, agents)
- Reference catalogs like this car-brands encyclopedia

The reusable pieces from this repo:
- Playwright extraction scripts (content blocks + images + facts)
- `BrandHistory` / article rendering components
- Data-module generation pattern (JSON -> typed TS)
- Filtering UI (search + A-Z + category)
- Coolify hosting pattern (docker-compose + healthcheck + API deploy)

## Done
- [x] Full carlogos.org clone: 396 car brands, 77 tire, 11 motorcycle,
      20 reviews, 11 quizzes with full history content + all digital assets
- [x] Filtering system (search + A-Z + category) on /car-brands/
- [x] Hosted on ZBOX via Coolify at http://100.74.72.109:3085/
