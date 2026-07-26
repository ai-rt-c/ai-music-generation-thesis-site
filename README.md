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

All research content lives in `/data/*.json`, generated from the dissertation
sources by `scripts/build_data.py` (dev-time only, Python):

```
python scripts/build_data.py
```

Sources: `Master_Table_112.xlsx` (112 studies), `Listening_Analysis_29_batched.xlsx`
(29 systems), and `scripts/content_source.py` (narrative extracted from the thesis).

Generated files: `papers.json` (112), `systems.json` (29), `evaluation.json`
(scores + derived strengths/weaknesses/best-use-case), `audio-demos.json`,
`taxonomy.json`, `trends.json`, `references.json` (120), `content.json`, `meta.json`.
Schemas are in `lib/types.ts`.

## Development (from M1 onward)

```
npm install
npm run dev      # local
npm run build    # static export to ./out
```

## Milestones

- **M0** — data pipeline & JSON generation ✅
- M1 — Next.js scaffold & deploy setup
- M2 — static content pages
- M3 — interactive Explorer
- M4 — system detail, 29 selected, Top 9
- M5 — Compare page
- M6 — accessibility, SEO, performance, deploy
