# AI Music Review — companion website

Interactive companion to the MSc dissertation *Artificial Intelligence for Music
Generation, Arrangement and Orchestration: A Systematic Review (2020–2025)* by
ZahraSadat Tahawori (IU International University of Applied Sciences).

Static Next.js site — calm, journal-like, data-driven. Every page renders from
generated JSON; no research content is hard-coded in components.

## Stack

Next.js (App Router) · TypeScript · TailwindCSS · Framer Motion (subtle) ·
static export → GitHub Pages. No runtime data dependencies.

## Data pipeline (M0)

The site uses generated `/data/*.json`. Private draft workbooks remain outside
this public repository and are supplied to `scripts/build_data.py` through local
environment variables:

```
THESIS_MASTER_XLSX=/private/path/to/master.xlsx
THESIS_LISTENING_XLSX=/private/path/to/listening.xlsx
python scripts/build_data.py
```

The generator rejects workbook paths inside the repository. Narrative content
is maintained in `scripts/content_source.py`.

Generated files: `papers.json` (107), `systems.json` (29), `evaluation.json`
(scores + derived strengths/weaknesses/best-use-case), `audio-demos.json`,
`taxonomy.json`, `trends.json`, `references.json` (120), `content.json`, `meta.json`.
Schemas are in `lib/types.ts`.

## Development

```
npm install
npm run dev      # local dev server
npm run build    # static export to ./out (GitHub Pages ready)
```

Fonts (Inter, Source Serif 4) are self-hosted via `@fontsource-variable/*` — no
external font CDN, works offline, and builds without network access to fonts.

Deployment is automated: pushing to `main` triggers `.github/workflows/deploy.yml`,
which runs `npm ci && npm run build`, adds `.nojekyll`, and publishes `out/` to
GitHub Pages. The site is served under `/ai-music-generation-thesis-site/`
(configured via `basePath` in `next.config.mjs`).

## Milestones

- **M0** — data pipeline & JSON generation ✅
- **M1** — Next.js scaffold & deployment setup ✅
- **M2** — static content pages (Home, About the thesis, Methodology, Discussion, Future directions, About) ✅
- **M3** — interactive Explorer (107 papers: filters, presets, search, sort, URL bookmarking, responsive;
  per-paper cite/DOI/repo actions, facet tooltips, active-filter count, table/card/timeline views) ✅
- M4 — system detail, 29 selected, Top 9
- M5 — Compare page
- M6 — figures (figure viewer, taxonomy, trends, listening-evaluation charts)
- M7 — polish (subtle motion, responsive)
- M8 — accessibility & SEO
- M9 — final deployment
