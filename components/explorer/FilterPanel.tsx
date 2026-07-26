import type { FilterState, Facets } from "@/lib/filters";
import { scoreFilterActive } from "@/lib/filters";
import type { TaskCategory, Domain, Paradigm } from "@/lib/types";

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

function CheckGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: T[];
  selected: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        {legend}
      </legend>
      <div className="space-y-1">
        {options.map((o) => (
          <label key={o} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(o)}
              onChange={() => onToggle(o)}
              className="accent-forest"
            />
            <span className="text-ink">{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-4 block text-sm">
      <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-muted">
        {label} <span className="tnum text-forest-ink">{value ? `≥ ${value}` : "any"}</span>
      </span>
      <input
        type="range"
        min={0}
        max={5}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-forest"
        aria-label={`${label} minimum score`}
      />
    </label>
  );
}

export default function FilterPanel({
  facets,
  state,
  onChange,
}: {
  facets: Facets;
  state: FilterState;
  onChange: (patch: Partial<FilterState>) => void;
}) {
  return (
    <div className="text-sm">
      <fieldset className="mb-5">
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
          Year
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number" min={facets.yearRange[0]} max={state.yearMax} value={state.yearMin}
            onChange={(e) => onChange({ yearMin: Number(e.target.value) })}
            aria-label="From year"
            className="tnum w-20 rounded-md border border-line bg-white px-2 py-1"
          />
          <span className="text-muted">–</span>
          <input
            type="number" min={state.yearMin} max={facets.yearRange[1]} value={state.yearMax}
            onChange={(e) => onChange({ yearMax: Number(e.target.value) })}
            aria-label="To year"
            className="tnum w-20 rounded-md border border-line bg-white px-2 py-1"
          />
        </div>
      </fieldset>

      <CheckGroup<TaskCategory>
        legend="Task" options={facets.tasks} selected={state.tasks}
        onToggle={(v) => onChange({ tasks: toggle(state.tasks, v) })}
      />
      <CheckGroup<Domain>
        legend="Domain" options={facets.domains} selected={state.domains}
        onToggle={(v) => onChange({ domains: toggle(state.domains, v) })}
      />
      <CheckGroup<Paradigm>
        legend="Paradigm" options={facets.paradigms} selected={state.paradigms}
        onToggle={(v) => onChange({ paradigms: toggle(state.paradigms, v) })}
      />

      <div className="mb-3 border-t border-line pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Evaluation score
        </p>
        <Slider label="Overall" value={state.minOverall} onChange={(v) => onChange({ minOverall: v })} />
        <Slider label="Control" value={state.minControl} onChange={(v) => onChange({ minControl: v })} />
        <Slider label="Structure" value={state.minStructure} onChange={(v) => onChange({ minStructure: v })} />
        {scoreFilterActive(state) && (
          <p className="text-xs italic text-muted">
            Score filters apply to the 29 evaluated systems only.
          </p>
        )}
      </div>
    </div>
  );
}
