import { fmtScore } from "@/lib/util";

// Score chip. Colour intensity encodes the value, but the number is always shown
// (never colour alone) for accessibility.
export default function ScoreBadge({
  value,
  label,
}: {
  value: number | null | undefined;
  label?: string;
}) {
  const v = value ?? null;
  const strong = v != null && v >= 4;
  return (
    <span
      className={`tnum inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
        v == null
          ? "bg-forest-light/40 text-muted"
          : strong
            ? "bg-forest text-white"
            : "bg-forest-light text-forest-ink"
      }`}
      title={label ? `${label}: ${fmtScore(v)}` : undefined}
    >
      {label && <span className="font-normal opacity-80">{label}</span>}
      {fmtScore(v)}
    </span>
  );
}
