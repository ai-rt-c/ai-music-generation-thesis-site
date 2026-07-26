import type { FigureItem } from "@/lib/types";
import { asset } from "@/lib/util";

// Basic figure (image + numbered caption). Receives a typed FigureItem prop;
// the page resolves it from the meta.figures manifest. Upgraded to a
// zoom/download FigureViewer in the Figures milestone.
export default function Figure({ figure, maxWidth }: { figure?: FigureItem; maxWidth?: number }) {
  if (!figure) return null;
  return (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={asset(figure.png)}
        alt={figure.alt}
        className="mx-auto block h-auto w-full rounded-lg border border-line bg-white"
        style={maxWidth ? { maxWidth } : undefined}
        loading="lazy"
      />
      <figcaption className="mx-auto mt-3 max-w-prose text-center text-sm text-muted">
        <span className="font-medium text-ink">Fig. {figure.number}.</span> {figure.caption}
      </figcaption>
    </figure>
  );
}
