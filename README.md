# AI Music Review — companion website

Interactive companion to the MSc dissertation *A Systematic Overview on AI Music
Generation, Arrangement, and Orchestration* by
ZahraSadat Tahawori (IU International University of Applied Sciences).

Static Next.js site — calm, journal-like, data-driven. Every page renders from
generated JSON; no research content is hard-coded in components.

## Stack

Next.js (App Router) · TypeScript · TailwindCSS · Framer Motion (subtle) ·
static export → GitHub Pages. No runtime data dependencies.

## Data pipeline (M0)

All research content lives in `/data/*.json`, generated from the dissertation
sources by `scripts/build_data.py` (dev-time only, Python):

```
python scripts/build_data.py
```

Sources: `Master_Table_107.xlsx` (107 primary studies plus a separate five-item
reclassified-background sheet), `Listening_Analysis_27_Clean_Audit_FINAL.xlsx` (27 systems),
and `scripts/content_source.py` (narrative extracted from the thesis). Set
`MASTER_TABLE_XLSX` and `LISTENING_ANALYSIS_XLSX` when the workbooks live outside
the repository.

Generated files: `papers.json` (107), `systems.json` (27), `evaluation.json`
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
  CSV export, per-paper cite/DOI/repo actions, facet tooltips, active-filter count, table/card/timeline views) ✅
- **M4** — system detail, 27 selected, top systems, evidence/resource profiles ✅
- M5 — Compare page
- **M6** — figures, taxonomy, trends, listening-analysis charts ✅
- M7 — polish (subtle motion, responsive)
- M8 — accessibility & SEO
- M9 — final deployment
