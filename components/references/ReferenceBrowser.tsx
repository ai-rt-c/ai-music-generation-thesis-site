"use client";

import { useMemo, useState } from "react";
import type { ReferenceDisplay } from "@/lib/referenceDisplay";

function withPeriod(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

export function ReferenceBrowser({
  references,
}: {
  references: ReferenceDisplay[];
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const visibleReferences = useMemo(
    () =>
      normalizedQuery
        ? references.filter((reference) =>
            reference.searchText.includes(normalizedQuery),
          )
        : references,
    [normalizedQuery, references],
  );

  return (
    <section aria-labelledby="primary-study-references">
      <div className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor="reference-search"
        >
          Search primary-study references
        </label>
        <input
          className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition placeholder:text-muted focus:border-forest focus:ring-2 focus:ring-forest-light"
          id="reference-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search authors, title, year, or venue"
          type="search"
          value={query}
        />
        <p aria-live="polite" className="mt-2 text-sm text-muted">
          Showing {visibleReferences.length} of {references.length} primary
          studies
        </p>
      </div>

      <h2 className="sr-only" id="primary-study-references">
        Primary-study references
      </h2>

      {visibleReferences.length ? (
        <ol className="mt-6 divide-y divide-line border-y border-line">
          {visibleReferences.map((reference) => (
            <li
              className="py-4"
              data-reference-id={reference.id}
              key={reference.id}
            >
              <div className="min-w-0">
                <p className="prose-copy text-sm leading-6 text-ink sm:text-[0.95rem]">
                  <span className="font-medium text-ink">
                    {withPeriod(reference.authors)}
                  </span>{" "}
                  <span>({reference.year ?? "n.d."}).</span>{" "}
                  <span>{withPeriod(reference.title)}</span>{" "}
                  <span className="italic">{withPeriod(reference.venue)}</span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {reference.paperUrl ? (
                    <a
                      className="font-medium text-forest underline decoration-line underline-offset-4 hover:text-forest-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                      href={reference.paperUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Open publication
                    </a>
                  ) : null}
                  {reference.doi && reference.doiUrl ? (
                    <a
                      className="text-muted underline decoration-line underline-offset-4 hover:text-ink focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest"
                      href={reference.doiUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      DOI: {reference.doi}
                    </a>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 rounded-xl border border-line bg-white p-5 text-sm text-muted">
          No primary-study references match this search.
        </p>
      )}
    </section>
  );
}
