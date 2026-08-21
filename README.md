# Zervi Car Brands

A reverse-engineered clone of [carlogos.org](https://www.carlogos.org/) — the car logo and brand encyclopedia — rebuilt as a clean, modern Next.js codebase.

This project serves as a **support resource for all Zervi Group projects**: a local, self-hosted, controllable reference for car brand logos, names, and metadata that other Zervi services (sites, catalogs, AI assistants) can draw from without depending on the live third-party site.

Built on the [AI Website Cloner Template](https://github.com/sakimotto/ai-website-cloner-template) (originally by JCodesMore).

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Radix primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React (default — replaced/supplemented by extracted SVGs during cloning)
- **Styling:** Tailwind CSS v4 with oklch design tokens
- **Deployment:** Vercel

## Purpose

```
Live site (carlogos.org)  ──clone──▶  zervi-car-brands (this repo)
                                         │
                                         ├── public/images/   → car logos, brand assets
                                         ├── src/              → Next.js app
                                         └── docs/research/    → extraction artifacts
                                         │
                                         ▼
                              Reusable support resource for all Zervi projects
```

Carlogos.org is a well-structured directory of car brand logos, histories, and metadata.
Having a local clone means Zervi projects can reference car brand assets and data
without network calls to a third-party site, with full control over layout, styling,
and data shape.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 24+
- An AI coding agent (Claude Code recommended, with Chrome MCP for the cloning phase)

### Install

```bash
git clone https://github.com/zervi-group/zervi-car-brands.git
cd zervi-car-brands
npm install
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Clone / refresh the source site

This repo is scaffolded from the AI Website Cloner Template. To (re-)clone
carlogos.org or pull in updates, run the clone-website skill from an AI agent
that has browser automation (Chrome MCP / Playwright MCP):

```
/clone-website https://www.carlogos.org/
```

The skill inspects the live site, extracts design tokens and assets, writes
component specs to `docs/research/`, and dispatches parallel builder agents to
reconstruct every section pixel-perfect. See
`.claude/skills/clone-website/SKILL.md` for the full pipeline.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript check |
| `npm run check` | Lint + typecheck + build |

## Project Structure

```
src/
  app/              # Next.js routes
  components/       # React components
    ui/             # shadcn/ui primitives
    icons.tsx       # Extracted SVG icons as React components
  lib/
    utils.ts        # cn() utility (shadcn)
  types/            # TypeScript interfaces
  hooks/            # Custom React hooks
public/
  images/           # Downloaded car logos and brand assets
  videos/           # Downloaded videos from target site
  seo/              # Favicons, OG images, webmanifest
docs/
  research/         # Inspection output (design tokens, components, layout)
  design-references/ # Screenshots and visual references
scripts/            # Asset download scripts
```

## Design Principles

- **Pixel-perfect emulation** — match the target's spacing, colors, typography exactly
- **No personal aesthetic changes during emulation phase** — match 1:1 first, customize later
- **Real content** — use actual text and assets from the target site, not placeholders
- **Beauty-first** — every pixel matters

## License

MIT — see [LICENSE](LICENSE).

The original [AI Website Cloner Template](https://github.com/sakimotto/ai-website-cloner-template)
is MIT-licensed. Cloned content from carlogos.org is for internal Zervi support use.
