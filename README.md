# AI Music Review — companion website

Interactive companion to the MSc dissertation *A Systematic Overview on AI Music
Generation, Arrangement, and Orchestration* by
ZahraSadat Tahawori (IU International University of Applied Sciences).

Calm, journal-like, data-driven Next.js site. Every research page renders from
generated JSON; no research content is hard-coded in components. The Vercel
deployment also exposes an evidence-grounded thesis assistant through a
server-side route so model credentials never reach the browser.

## Stack

Next.js (App Router) · TypeScript · TailwindCSS · Framer Motion (subtle) ·
AI SDK + Vercel AI Gateway. Research pages are statically rendered; Vercel runs
the assistant endpoint. GitHub Pages remains a static mirror whose assistant UI
calls the Vercel endpoint.

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
npm run build    # Vercel-ready build, including /api/assistant
```

The assistant authenticates with Vercel OIDC on a linked deployment or with an
`AI_GATEWAY_API_KEY` in `.env.local`. Its default model is
`google/gemini-2.5-flash`; override it with `THESIS_ASSISTANT_MODEL`. Never expose
either credential through a `NEXT_PUBLIC_*` variable.

Fonts (Inter, Source Serif 4) are self-hosted via `@fontsource-variable/*` — no
external font CDN, works offline, and builds without network access to fonts.

Deployment is automated: Vercel builds the complete site and server-side
assistant. Pushing to `main` also triggers `.github/workflows/deploy.yml`, which
temporarily excludes the server route, creates a static export, and publishes
the mirror to GitHub Pages under `/ai-music-generation-thesis-site/`. The mirror
uses `NEXT_PUBLIC_ASSISTANT_API_URL` to call the Vercel endpoint.

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
- M10 — evidence-grounded thesis assistant (local preview complete; live Gateway authentication pending)
