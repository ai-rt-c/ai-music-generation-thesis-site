export default function Tag({ label, muted }: { label: string; muted?: boolean }) {
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-xs ${
        muted
          ? "border-line text-muted"
          : "border-line bg-forest-light/50 text-forest-ink"
      }`}
    >
      {label}
    </span>
  );
}
