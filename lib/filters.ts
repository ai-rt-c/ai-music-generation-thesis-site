// Pure filtering / sorting logic for the Explorer. Operates on data passed in;
// imports no JSON. Fully typed.
import type { Paper, Scores, TaskCategory, Domain, Paradigm } from "@/lib/types";

export type SortKey =
  | "year-desc"
  | "year-asc"
  | "title-asc"
  | "overall-desc";

export type View = "table" | "grid" | "timeline";

export interface FilterState {
  q: string;
  yearMin: number;
  yearMax: number;
  tasks: TaskCategory[];
  domains: Domain[];
  paradigms: Paradigm[];
  minOverall: number;
  minControl: number;
  minStructure: number;
  sort: SortKey;
  view: View;
}

export interface Facets {
  yearRange: [number, number];
  tasks: TaskCategory[];
  domains: Domain[];
  paradigms: Paradigm[];
}

export type ScoreMap = Record<string, Scores>;

const TASK_ORDER: TaskCategory[] = [
  "Symbolic generation", "Audio generation", "Arrangement", "Orchestration",
];
const PARADIGM_ORDER: Paradigm[] = [
  "Transformer", "Diffusion", "VAE", "LLM", "Foundation model",
  "Flow matching", "State-space", "GAN", "RNN", "Hybrid", "Non-neural",
];

export function buildFacets(papers: Paper[]): Facets {
  const years = papers.map((p) => p.year ?? 0).filter(Boolean);
  const tasks = new Set<TaskCategory>();
  const domains = new Set<Domain>();
  const paradigms = new Set<Paradigm>();
  for (const p of papers) {
    tasks.add(p.taskCategory);
    if (p.domain) domains.add(p.domain);
    p.paradigmTags.forEach((t) => paradigms.add(t));
  }
  return {
    yearRange: [Math.min(...years), Math.max(...years)],
    tasks: TASK_ORDER.filter((t) => tasks.has(t)),
    domains: (["Symbolic", "Audio", "Mixed"] as Domain[]).filter((d) => domains.has(d)),
    paradigms: PARADIGM_ORDER.filter((p) => paradigms.has(p)),
  };
}

export function defaultState(facets: Facets): FilterState {
  return {
    q: "",
    yearMin: facets.yearRange[0],
    yearMax: facets.yearRange[1],
    tasks: [],
    domains: [],
    paradigms: [],
    minOverall: 0,
    minControl: 0,
    minStructure: 0,
    sort: "year-desc",
    view: "table",
  };
}

export const scoreFilterActive = (s: FilterState) =>
  s.minOverall > 0 || s.minControl > 0 || s.minStructure > 0;

function matchesText(p: Paper, q: string): boolean {
  if (!q) return true;
  const hay = [
    p.title, p.authors, p.method, p.dataset, p.taskCategory,
    p.paradigm ?? "", p.paradigmTags.join(" "), String(p.year ?? ""),
  ].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((tok) => hay.includes(tok));
}

export function filterPapers(papers: Paper[], scores: ScoreMap, s: FilterState): Paper[] {
  const scoped = scoreFilterActive(s);
  return papers.filter((p) => {
    if (!matchesText(p, s.q)) return false;
    if (p.year != null && (p.year < s.yearMin || p.year > s.yearMax)) return false;
    if (s.tasks.length && !s.tasks.includes(p.taskCategory)) return false;
    if (s.domains.length && !(p.domain && s.domains.includes(p.domain))) return false;
    if (
      s.paradigms.length &&
      !p.paradigmTags.some((t) => s.paradigms.includes(t)) &&
      !(p.paradigm && s.paradigms.includes(p.paradigm))
    )
      return false;
    if (scoped) {
      const sc = scores[p.id];
      if (!sc) return false;
      if ((sc.overall ?? -1) < s.minOverall) return false;
      if ((sc.control ?? -1) < s.minControl) return false;
      if ((sc.structure ?? -1) < s.minStructure) return false;
    }
    return true;
  });
}

export function sortPapers(papers: Paper[], scores: ScoreMap, sort: SortKey): Paper[] {
  const out = [...papers];
  out.sort((a, b) => {
    switch (sort) {
      case "year-asc":
        return (a.year ?? 0) - (b.year ?? 0) || a.title.localeCompare(b.title);
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "overall-desc":
        return (
          (scores[b.id]?.overall ?? -1) - (scores[a.id]?.overall ?? -1) ||
          (b.year ?? 0) - (a.year ?? 0)
        );
      case "year-desc":
      default:
        return (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title);
    }
  });
  return out;
}

export interface Preset {
  id: string;
  label: string;
  patch: Partial<FilterState>;
}

export const PRESETS: Preset[] = [
  { id: "top", label: "Top rated", patch: { minOverall: 4, sort: "overall-desc" } },
  { id: "latest", label: "Latest (2025)", patch: { yearMin: 2025, yearMax: 2025 } },
  { id: "transformer", label: "Transformer", patch: { paradigms: ["Transformer"] } },
  { id: "diffusion", label: "Diffusion", patch: { paradigms: ["Diffusion"] } },
  { id: "symbolic", label: "Symbolic", patch: { domains: ["Symbolic"] } },
  { id: "audio", label: "Audio", patch: { domains: ["Audio"] } },
  { id: "arrangement", label: "Arrangement", patch: { tasks: ["Arrangement"] } },
  { id: "orchestration", label: "Orchestration", patch: { tasks: ["Orchestration"] } },
  { id: "structure", label: "Best structure", patch: { minStructure: 4, sort: "overall-desc" } },
  { id: "control", label: "Best control", patch: { minControl: 4, sort: "overall-desc" } },
];
