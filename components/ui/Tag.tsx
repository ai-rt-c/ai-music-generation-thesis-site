export default function Tag({
  label,
  muted,
  tip,
}: {
  label: string;
  muted?: boolean;
  tip?: string;
}) {
  return (
    <span
      title={tip}
      className={`inline-block rounded-md border px-2 py-0.5 text-xs ${
        tip ? "cursor-help" : ""
      } ${muted ? "border-line text-muted" : "border-line bg-forest-light/50 text-forest-ink"}`}
    >
      {label}
    </span>
  );
}
