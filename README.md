# AI Music Review — companion website

Interactive companion to the MSc dissertation *A Systematic Overview on AI Music
Generation, Arrangement, and Orchestration* by
Zahra Tahawori (IU International University of Applied Sciences).

**Published thesis and 107-study comparison data:** [Zenodo DOI 10.5281/zenodo.23249905](https://doi.org/10.5281/zenodo.23249905)

**Interactive companion:** https://ai-music-generation-thesis-review.vercel.app/

Calm, journal-like, data-driven Next.js site. Every research page renders from
generated JSON; no research content is hard-coded in components. The Vercel
deployment also exposes an evidence-grounded thesis assistant through a
server-side route so model credentials never reach the browser.

## Stack

Next.js (App Router) · TypeScript · TailwindCSS · Framer Motion (subtle) ·
AI SDK + Google Gemini Developer API. Research pages are statically rendered; Vercel runs
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

## Thesis assistant: evidence and testing

The website includes a question-answering assistant that helps readers explore the
thesis and its associated research data. It uses the Google Gemini API, with
evidence from the public thesis and structured data derived from the 107-study
comparison table and the 27-system listening analysis.

The public thesis PDF is processed page by page into overlapping text chunks that
retain page references. A BM25-style lexical ranking method selects relevant
passages. Structured research data is generated from the source spreadsheets at
build time; for supported questions, the assistant can use deterministic
filtering and calculations to answer directly from these records.

The assistant is instructed to stay within the supplied evidence and the scope
of the thesis. Additional checks cover unknown study IDs and some unsupported
numeric claims; when relevant evidence is insufficient, the assistant can
decline to answer. These safeguards help reduce unsupported responses, but they
do not guarantee that every answer is correct.

Before publication, the assistant was tested iteratively using questions about
the thesis and out-of-scope prompts. For example, early versions gave irrelevant
responses to a question about what was for dinner, and some answers about
research trends mixed up information. Testing and review against the thesis and
research data informed subsequent improvements, including the use of structured
data from the research spreadsheets alongside the thesis text.

### My role and AI-assisted development

I defined the research content and the assistant's purpose, tested responses
against my thesis and datasets, identified errors and directed improvements.
I used Codex to support the website and assistant's development.

### Limitations

The assistant is designed for the thesis and associated research data. Lexical
retrieval can miss relevant material when questions use different wording, and
responses may still contain errors. Gemini API availability, usage limits and
any charges depend on the configured account and provider terms.

## Development

```
npm install
npm run dev      # local dev server
npm run build    # Vercel-ready build, including /api/assistant
```

The assistant uses the server-only `GOOGLE_GENERATIVE_AI_API_KEY` environment
variable; copy `.env.example` to `.env.local` for local development or add the
secret in the Vercel project settings. Set `THESIS_ASSISTANT_MODEL` to override the model configured in the assistant
route. Never expose the credential through a `NEXT_PUBLIC_*` variable.

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
- M10 — evidence-grounded thesis assistant (preview implementation complete; server-side Gemini key required)
