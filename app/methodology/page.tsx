import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Figure from "@/components/figures/Figure";
import { content, meta, figureById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Methodology",
  description: content.systematicReview.intro,
};

export default function MethodologyPage() {
  const sr = content.systematicReview;
  const le = content.listeningEvaluation;
  const p = meta.prisma;
  const funnel = [
    { n: p.identified, label: "records identified (6 databases)" },
    { n: p.afterDedup, label: "after de-duplication / export" },
    { n: p.titleScreened, label: "after title screening" },
    { n: p.fullText, label: "full-text assessed" },
    { n: p.included, label: "included in the review" },
    { n: p.inDepth, label: "selected for in-depth listening" },
  ];
  return (
    <article className="max-w-prose">
      <PageHeader kicker="Method" title={sr.title} intro={sr.intro} />

      <div className="not-prose my-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {funnel.map((f) => (
          <div key={f.label} className="rounded-lg bg-forest-light px-3 py-2">
            <div className="tnum text-lg font-semibold text-forest-ink">{f.n.toLocaleString()}</div>
            <div className="text-xs leading-snug text-muted">{f.label}</div>
          </div>
        ))}
      </div>

      <Figure figure={figureById("prisma")} maxWidth={620} />

      {sr.blocks.map((b, i) => (
        <section key={i} className="mt-8">
          {b.heading && <h2 className="text-xl">{b.heading}</h2>}
          <p className="mt-2 leading-relaxed">{b.body}</p>
        </section>
      ))}

      <h2 className="mt-12 text-xl">Listening evaluation rubric</h2>
      <p className="mt-2 leading-relaxed">{le.intro}</p>

      <div className="mt-5 overflow-hidden rounded-lg border border-line">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-forest-light text-left text-forest-ink">
              <th className="px-4 py-2 font-medium">Criterion</th>
              <th className="px-4 py-2 font-medium">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {le.rubric.map((r) => (
              <tr key={r.key} className="border-t border-line align-top">
                <td className="px-4 py-2 font-medium text-ink">{r.label}</td>
                <td className="px-4 py-2 text-muted">{r.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm italic text-muted">{le.caveat}</p>
    </article>
  );
}
