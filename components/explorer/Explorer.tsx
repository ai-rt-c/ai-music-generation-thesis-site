"use client";

import { useEffect, useMemo, useState } from "react";
import type { Paper } from "@/lib/types";
import {
  type Facets, type FilterState, type ScoreMap,
  PRESETS, defaultState, filterPapers, sortPapers,
} from "@/lib/filters";
import { queryToState, stateToQuery } from "@/lib/url-state";
import SearchBox from "@/components/ui/SearchBox";
import PresetChips from "@/components/explorer/PresetChips";
import FilterPanel from "@/components/explorer/FilterPanel";
import SortControl from "@/components/explorer/SortControl";
import ActiveFilters from "@/components/explorer/ActiveFilters";
import PaperTable from "@/components/explorer/PaperTable";
import PaperCard from "@/components/cards/PaperCard";

export default function Explorer({
  papers, scores, facets,
}: {
  papers: Paper[]; scores: ScoreMap; facets: Facets;
}) {
  // Local state so the default list renders on the server (SEO / no-JS),
  // while the URL still carries bookmarkable filters via history.replaceState.
  const [state, setState] = useState<FilterState>(() => defaultState(facets));

  useEffect(() => {
    const fromUrl = queryToState(new URLSearchParams(window.location.search), facets);
    setState(fromUrl);
  }, [facets]);

  const commit = (next: FilterState) => {
    setState(next);
    const qs = stateToQuery(next, facets);
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  };
  const update = (patch: Partial<FilterState>) => commit({ ...state, ...patch });
  const reset = () => commit(defaultState(facets));

  const results = useMemo(
    () => sortPapers(filterPapers(papers, scores, state), scores, state.sort),
    [papers, scores, state],
  );

  const filters = <FilterPanel facets={facets} state={state} onChange={update} />;

  return (
    <div>
      <div className="mb-4">
        <SearchBox
          value={state.q}
          onChange={(q) => update({ q })}
          label="Search papers by title, author, model, dataset, task, paradigm or year"
          placeholder="Search title, author, model, dataset, task, paradigm, year…"
        />
      </div>
      <div className="mb-6">
        <PresetChips presets={PRESETS} onApply={update} />
      </div>

      <div className="gap-8 md:grid md:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="mb-6 md:mb-0">
          <details className="rounded-lg border border-line p-3 md:hidden" open={false}>
            <summary className="cursor-pointer text-sm font-medium text-ink">Filters</summary>
            <div className="mt-3">{filters}</div>
          </details>
          <div className="sticky top-20 hidden md:block">{filters}</div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <ActiveFilters state={state} facets={facets} count={results.length} onChange={update} onReset={reset} />
            <div className="flex items-center gap-3">
              <SortControl value={state.sort} onChange={(sort) => update({ sort })} />
              <div className="flex rounded-md border border-line" role="group" aria-label="View">
                {(["table", "grid"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => update({ view: v })}
                    aria-pressed={state.view === v}
                    className={`px-3 py-1 text-sm capitalize ${
                      state.view === v ? "bg-forest-light text-forest-ink" : "text-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {results.length === 0 ? (
            <p className="rounded-lg border border-line bg-white px-4 py-10 text-center text-sm text-muted">
              No papers match these filters. Try clearing a filter.
            </p>
          ) : state.view === "table" ? (
            <PaperTable papers={results} scores={scores} sort={state.sort} onSort={(sort) => update({ sort })} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {results.map((p) => (
                <PaperCard key={p.id} paper={p} overall={scores[p.id]?.overall ?? null} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
