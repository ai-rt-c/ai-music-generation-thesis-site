import type { FilterState, Preset } from "@/lib/filters";

export default function PresetChips({
  presets,
  onApply,
}: {
  presets: Preset[];
  onApply: (patch: Partial<FilterState>) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick filters">
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onApply(p.patch)}
          className="rounded-full border border-line px-3 py-1 text-sm text-ink transition-colors hover:border-forest hover:bg-forest-light"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
