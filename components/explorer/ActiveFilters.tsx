import type { FilterState, Facets } from "@/lib/filters";

interface Chip {
  label: string;
  clear: Partial<FilterState>;
}

export default function ActiveFilters({
  state,
  facets,
  count,
  onChange,
  onReset,
}: {
  state: FilterState;
  facets: Facets;
  count: number;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
}) {
  const chips: Chip[] = [];
  if (state.q) chips.push({ label: `“${state.q}”`, clear: { q: "" } });
  if (state.yearMin !== facets.yearRange[0] || state.yearMax !== facets.yearRange[1])
    chips.push({
      label: `${state.yearMin}–${state.yearMax}`,
      clear: { yearMin: facets.yearRange[0], yearMax: facets.yearRange[1] },
    });
  state.tasks.forEach((t) => chips.push({ label: t, clear: { tasks: state.tasks.filter((x) => x !== t) } }));
  state.domains.forEach((d) => chips.push({ label: d, clear: { domains: state.domains.filter((x) => x !== d) } }));
  state.paradigms.forEach((p) => chips.push({ label: p, clear: { paradigms: state.paradigms.filter((x) => x !== p) } }));
  if (state.minOverall) chips.push({ label: `overall ≥ ${state.minOverall}`, clear: { minOverall: 0 } });
  if (state.minControl) chips.push({ label: `control ≥ ${state.minControl}`, clear: { minControl: 0 } });
  if (state.minStructure) chips.push({ label: `structure ≥ ${state.minStructure}`, clear: { minStructure: 0 } });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="tnum text-sm text-muted">
        {count} {count === 1 ? "result" : "results"}
      </span>
      {chips.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(c.clear)}
          className="inline-flex items-center gap-1 rounded-full bg-forest-light px-2.5 py-0.5 text-xs text-forest-ink hover:bg-forest-light/70"
          aria-label={`Remove filter ${c.label}`}
        >
          {c.label} <span aria-hidden="true">×</span>
        </button>
      ))}
      {chips.length > 0 && (
        <button type="button" onClick={onReset} className="text-xs text-forest underline">
          Clear all
        </button>
      )}
    </div>
  );
}
