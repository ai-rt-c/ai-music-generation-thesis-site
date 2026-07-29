"use client";

import { useMemo, useState } from "react";
import ScoreBadge from "@/components/ui/ScoreBadge";
import Tag from "@/components/ui/Tag";
import { DIMENSION_KEYS, DIMENSION_LABELS } from "@/lib/types";
import type { AudioDemo, Evaluation, Paper, System } from "@/lib/types";
import { fmtScore } from "@/lib/util";

interface SystemRecord {
  system: System;
  paper: Paper;
  evaluation: Evaluation;
  demo: AudioDemo;
}

type SortOption = "overall" | "year" | "name";

const selectClass =
  "mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-forest";

function externalPaperUrl(paper: Paper) {
  if (paper.doi) {
    return paper.doi.startsWith("http") ? paper.doi : `https://doi.org/${paper.doi}`;
  }
  return paper.paperUrl;
}

function uniqueValues<T extends string | number>(values: (T | null)[]) {
  return Array.from(new Set(values.filter((value): value is T => value != null))).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true }),
  );
}

function ListeningDetails({ evaluation }: { evaluation: Evaluation }) {
  return (
    <details className="group mt-5 border-t border-line pt-4">
      <summary className="cursor-pointer text-sm font-medium text-forest hover:underline">
        Listening and reported evaluation details
      </summary>

      <div className="mt-4 space-y-4 text-sm">
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {DIMENSION_KEYS.map((key) => (
            <div key={key} className="rounded-md bg-forest-light/45 px-2.5 py-2">
              <dt className="text-xs leading-snug text-muted">{DIMENSION_LABELS[key]}</dt>
              <dd className="tnum mt-1 font-medium text-ink">
                {evaluation.scores[key] == null ? "N/A" : fmtScore(evaluation.scores[key])}
              </dd>
            </div>
          ))}
        </dl>

        {(evaluation.strengths.length > 0 || evaluation.weaknesses.length > 0) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {evaluation.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold">Listening strengths</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                  {evaluation.strengths.map((strength) => (
                    <li key={strength}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            {evaluation.weaknesses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold">Listening limitations</h4>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                  {evaluation.weaknesses.map((weakness) => (
                    <li key={weakness}>{weakness}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {evaluation.bestUseCase && (
          <p>
            <span className="font-medium text-ink">Best suited to: </span>
            <span className="text-muted">{evaluation.bestUseCase}</span>
          </p>
        )}

        {(evaluation.reportedMetrics || evaluation.reportedResult) && (
          <div className="rounded-md border border-line px-3 py-2.5 text-muted">
            <h4 className="text-sm font-semibold">Reported evaluation</h4>
            {evaluation.reportedMetrics && (
              <p className="mt-1">
                <span className="font-medium text-ink">Metrics: </span>
                {evaluation.reportedMetrics}
              </p>
            )}
            {evaluation.reportedResult && (
              <p className="mt-1">
                <span className="font-medium text-ink">Result: </span>
                {evaluation.reportedResult}
              </p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}

function SystemCard({ record }: { record: SystemRecord }) {
  const { system, paper, evaluation, demo } = record;
  const overall = evaluation.scores.overall;
  const isTopSystem = overall != null && overall >= 4;
  const paperUrl = externalPaperUrl(paper);
  const hasDemo = Boolean(demo.url);

  return (
    <article className="flex h-full flex-col rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {system.year ?? "Year unavailable"}
          </p>
          <h3 className="mt-1 text-xl">{system.name}</h3>
        </div>
        <ScoreBadge value={overall} label="Overall" />
      </div>

      {system.title !== system.name && (
        <p className="mt-2 text-sm leading-relaxed text-muted">{system.title}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Tag label={system.taskCategory} />
        {system.paradigm && <Tag label={system.paradigm} muted />}
        {system.domain && <Tag label={system.domain} muted />}
      </div>

      {isTopSystem && (
        <p className="mt-4 rounded-md border border-forest/30 bg-forest-light px-3 py-2 text-sm font-medium text-forest-ink">
          Top-scoring system in this analysis (Overall ≥ 4.0)
        </p>
      )}

      {evaluation.paperBased && (
        <p className="mt-4 rounded-md border border-line bg-canvas px-3 py-2 text-sm text-muted">
          Paper-reported entry: no independent listening demo was available for this analysis.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {hasDemo ? (
          <a
            href={demo.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center rounded-md bg-forest px-4 py-2 text-sm font-medium text-white no-underline hover:bg-forest-ink hover:no-underline"
            aria-label={`Open demo for ${system.name} in a new tab`}
          >
            Open demo
          </a>
        ) : (
          <span
            className="inline-flex min-h-10 items-center rounded-md border border-line px-4 py-2 text-sm text-muted"
            aria-label={`No direct demo available for ${system.name}`}
          >
            No direct demo available
          </span>
        )}

        {paperUrl && (
          <a
            href={paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium"
            aria-label={`Open paper for ${system.name} in a new tab`}
          >
            Open paper
          </a>
        )}

        {paper.codeUrl && (
          <a
            href={paper.codeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium"
            aria-label={`Open code for ${system.name} in a new tab`}
          >
            Open code
          </a>
        )}
      </div>

      {demo.note && <p className="mt-2 text-xs text-muted">{demo.note}</p>}

      <ListeningDetails evaluation={evaluation} />
    </article>
  );
}

export default function SystemsBrowser({ records }: { records: SystemRecord[] }) {
  const [batch, setBatch] = useState("all");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("all");
  const [paradigm, setParadigm] = useState("all");
  const [sort, setSort] = useState<SortOption>("overall");

  const batches = useMemo(() => {
    const byIndex = new Map<number, { index: number; label: string; count: number }>();
    records.forEach(({ system }) => {
      const existing = byIndex.get(system.batchIndex);
      if (existing) {
        existing.count += 1;
      } else {
        byIndex.set(system.batchIndex, {
          index: system.batchIndex,
          label: system.batch,
          count: 1,
        });
      }
    });
    return Array.from(byIndex.values()).sort((a, b) => a.index - b.index);
  }, [records]);

  const years = useMemo(
    () => uniqueValues(records.map(({ system }) => system.year)).sort((a, b) => b - a),
    [records],
  );
  const categories = useMemo(
    () => uniqueValues(records.map(({ system }) => system.taskCategory)),
    [records],
  );
  const paradigms = useMemo(
    () => uniqueValues(records.map(({ system }) => system.paradigm)),
    [records],
  );

  const visibleRecords = useMemo(() => {
    const filtered = records.filter(({ system }) => {
      return (
        (batch === "all" || String(system.batchIndex) === batch) &&
        (year === "all" || String(system.year) === year) &&
        (category === "all" || system.taskCategory === category) &&
        (paradigm === "all" || system.paradigm === paradigm)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sort === "year") {
        return (b.system.year ?? 0) - (a.system.year ?? 0) || a.system.name.localeCompare(b.system.name);
      }
      if (sort === "name") {
        return a.system.name.localeCompare(b.system.name);
      }
      return (
        (b.evaluation.scores.overall ?? -1) - (a.evaluation.scores.overall ?? -1) ||
        a.system.name.localeCompare(b.system.name)
      );
    });
  }, [batch, category, paradigm, records, sort, year]);

  const visibleGroups = useMemo(() => {
    return batches
      .filter(({ index }) => batch === "all" || String(index) === batch)
      .map((batchInfo) => ({
        ...batchInfo,
        records: visibleRecords.filter(
          ({ system }) => system.batchIndex === batchInfo.index,
        ),
      }));
  }, [batch, batches, visibleRecords]);

  const hasFilters =
    batch !== "all" || year !== "all" || category !== "all" || paradigm !== "all";

  return (
    <section aria-labelledby="systems-browser-heading">
      <h2 id="systems-browser-heading" className="sr-only">
        Browse selected systems
      </h2>

      <div className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="rounded-lg border border-forest/25 bg-forest-light/40 p-3">
          <label className="block text-sm font-medium text-ink sm:max-w-xl">
            Listening batch
            <select
              value={batch}
              onChange={(event) => setBatch(event.target.value)}
              className={selectClass}
            >
              <option value="all">All batches</option>
              {batches.map(({ index, label }) => (
                <option key={index} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs text-muted">
            The seven batches are the thesis listening-analysis groups. Year, category and
            paradigm below are separate analytical attributes.
          </p>
        </div>

        <p className="mb-2 mt-5 text-xs font-medium uppercase tracking-wide text-muted">
          Secondary filters
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-medium text-ink">
            Year
            <select value={year} onChange={(event) => setYear(event.target.value)} className={selectClass}>
              <option value="all">All years</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-ink">
            Task or category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={selectClass}
            >
              <option value="all">All categories</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-ink">
            Paradigm
            <select
              value={paradigm}
              onChange={(event) => setParadigm(event.target.value)}
              className={selectClass}
            >
              <option value="all">All paradigms</option>
              {paradigms.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-ink">
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className={selectClass}
            >
              <option value="overall">Overall score (high to low)</option>
              <option value="year">Year (newest first)</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-sm text-muted" aria-live="polite">
            Showing <span className="tnum font-medium text-ink">{visibleRecords.length}</span> of{" "}
            <span className="tnum font-medium text-ink">{records.length}</span> systems
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setBatch("all");
                setYear("all");
                setCategory("all");
                setParadigm("all");
              }}
              className="text-sm font-medium text-forest hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {visibleRecords.length > 0 ? (
        <div className="mt-8 space-y-10">
          {visibleGroups.map((group) => (
            <section key={group.index} aria-labelledby={`batch-${group.index}-heading`}>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
                <h2 id={`batch-${group.index}-heading`} className="text-2xl">
                  {group.label}
                </h2>
                <p className="text-sm text-muted">
                  {group.records.length === group.count
                    ? `${group.count} ${group.count === 1 ? "system" : "systems"}`
                    : `${group.records.length} of ${group.count} systems shown`}
                </p>
              </div>
              {group.records.length > 0 ? (
                <div className="grid items-start gap-5 lg:grid-cols-2">
                  {group.records.map((record) => (
                    <SystemCard key={record.system.id} record={record} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-line bg-white p-5 text-sm text-muted">
                  No systems in this batch match the secondary filters.
                </p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-line bg-white p-6 text-center text-muted">
          No systems match these filters.
        </p>
      )}
    </section>
  );
}
