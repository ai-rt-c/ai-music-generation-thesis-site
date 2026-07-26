// Serialise Explorer filter state to/from the URL query string, so any view is
// bookmarkable and shareable. Pure; no data imports.
import type { FilterState, Facets, SortKey, View } from "@/lib/filters";
import { defaultState } from "@/lib/filters";
import type { TaskCategory, Domain, Paradigm } from "@/lib/types";

const SORTS: SortKey[] = ["year-desc", "year-asc", "title-asc", "overall-desc"];

export function stateToQuery(s: FilterState, facets: Facets): string {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.yearMin !== facets.yearRange[0] || s.yearMax !== facets.yearRange[1])
    p.set("year", `${s.yearMin}-${s.yearMax}`);
  if (s.tasks.length) p.set("task", s.tasks.join(","));
  if (s.domains.length) p.set("domain", s.domains.join(","));
  if (s.paradigms.length) p.set("paradigm", s.paradigms.join(","));
  if (s.minOverall) p.set("overall", String(s.minOverall));
  if (s.minControl) p.set("control", String(s.minControl));
  if (s.minStructure) p.set("structure", String(s.minStructure));
  if (s.sort !== "year-desc") p.set("sort", s.sort);
  if (s.view !== "table") p.set("view", s.view);
  return p.toString();
}

const num = (v: string | null, fallback: number) => {
  const n = Number(v);
  return v != null && Number.isFinite(n) ? n : fallback;
};
const csv = (v: string | null): string[] => (v ? v.split(",").filter(Boolean) : []);

export function queryToState(params: URLSearchParams, facets: Facets): FilterState {
  const base = defaultState(facets);
  const year = params.get("year");
  let yearMin = base.yearMin;
  let yearMax = base.yearMax;
  if (year && /^\d{4}-\d{4}$/.test(year)) {
    const [a, b] = year.split("-").map(Number);
    yearMin = Math.max(facets.yearRange[0], Math.min(a, b));
    yearMax = Math.min(facets.yearRange[1], Math.max(a, b));
  }
  const sort = params.get("sort");
  const view = params.get("view");
  return {
    q: params.get("q") ?? "",
    yearMin,
    yearMax,
    tasks: csv(params.get("task")) as TaskCategory[],
    domains: csv(params.get("domain")) as Domain[],
    paradigms: csv(params.get("paradigm")) as Paradigm[],
    minOverall: num(params.get("overall"), 0),
    minControl: num(params.get("control"), 0),
    minStructure: num(params.get("structure"), 0),
    sort: (sort && SORTS.includes(sort as SortKey) ? sort : "year-desc") as SortKey,
    view: (view === "grid" ? "grid" : "table") as View,
  };
}
