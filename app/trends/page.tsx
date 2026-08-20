import type { Metadata } from "next";
import Figure from "@/components/figures/Figure";
import PageHeader from "@/components/ui/PageHeader";
import { figureById, paperById, trends } from "@/lib/data";

export const metadata: Metadata = {
  title: "Research trends",
  description: "Eight research trends synthesised from the 107-study primary corpus, with representative works for every trend.",
};

export default function TrendsPage() {
  return (
    <article className="max-w-4xl">
      <PageHeader
        kicker="The field"
        title="Eight research trends"
        intro="The trends are a single-reviewer qualitative synthesis of the 107 primary studies. Representative works are shown for traceability; the complete trend mapping is non-exclusive and retained in the master comparison table."
      />

      <Figure figure={figureById("trends-timeline")} maxWidth={780} />

      <div className="mt-10 space-y-5">
        {trends.map((trend) => (
          <section key={trend.id} className="rounded-xl border border-line bg-white p-5">
            <div className="flex items-start gap-4">
              <span className="tnum inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">
                {trend.number}
              </span>
              <div>
                <h2 className="text-xl">{trend.name}</h2>
                <p className="mt-1 text-sm font-medium text-forest">{trend.periodLabel}</p>
              </div>
            </div>
            <p className="mt-4 leading-relaxed">{trend.coreIdea}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted"><strong className="text-ink">Why it matters:</strong> {trend.whyItMatters}</p>

            <h3 className="mt-5 text-sm">Representative works (Appendix A IDs)</h3>
            <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              {trend.representativeIds.map((id) => {
                const paper = paperById(id);
                if (!paper) return <li key={id}>ID {id}</li>;
                const label = `${id} · ${paper.title}`;
                return (
                  <li key={id} className="leading-snug">
                    {paper.paperUrl ? (
                      <a href={paper.paperUrl} target="_blank" rel="noopener noreferrer">{label}</a>
                    ) : label}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </article>
  );
}
