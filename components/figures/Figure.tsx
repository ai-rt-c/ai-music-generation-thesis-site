import { meta, asset } from "@/lib/data";

// Basic figure (image + numbered caption) rendered from the meta.figures manifest.
// Upgraded to a zoom/download FigureViewer in the Figures milestone.
export default function Figure({ id, maxWidth }: { id: string; maxWidth?: number }) {
  const f = meta.figures.find((x) => x.id === id);
  if (!f) return null;
  return (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(f.png)}
        alt={f.alt}
        className="mx-auto block h-auto w-full rounded-lg border border-line bg-white"
        style={maxWidth ? { maxWidth } : undefined}
        loading="lazy"
      />
      <figcaption className="mx-auto mt-3 max-w-prose text-center text-sm text-muted">
        <span className="font-medium text-ink">Fig. {f.number}.</span> {f.caption}
      </figcaption>
    </figure>
  );
}
