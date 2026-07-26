// Accessible hover/focus tooltip. The trigger is keyboard-focusable and the
// tooltip is exposed to assistive tech via aria. Flat (no shadow), on-brand.
export default function Tooltip({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="group relative inline-flex items-center">
      <span
        tabIndex={0}
        className="cursor-help border-b border-dotted border-muted/70 outline-none"
        aria-describedby={undefined}
      >
        {label}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-30 mt-1 hidden w-56 rounded-md border border-line bg-white p-2 text-xs font-normal leading-snug text-ink group-hover:block group-focus-within:block"
      >
        {tip}
      </span>
    </span>
  );
}
