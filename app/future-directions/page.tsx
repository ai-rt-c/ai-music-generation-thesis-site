import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { content } from "@/lib/data";

export const metadata: Metadata = {
  title: "Future directions",
  description: content.futureDirections.intro,
};

export default function FutureDirectionsPage() {
  const f = content.futureDirections;
  return (
    <article className="max-w-prose">
      <PageHeader kicker="Findings" title={f.title} intro={f.intro} />
      {f.blocks.map((b, i) => (
        <section key={i} className="mt-7">
          {b.heading && <h2 className="text-lg">{b.heading}</h2>}
          <p className="mt-2 leading-relaxed">{b.body}</p>
        </section>
      ))}
    </article>
  );
}
