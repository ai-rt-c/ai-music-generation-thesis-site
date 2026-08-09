import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import SystemCard from "@/components/cards/SystemCard";
import { content, demoById, featuredSystems, paperById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Featured systems",
  description: "Nine systems with a holistic Overall score of 4.0/5 or above in the pilot exploratory analysis.",
};

export default function FeaturedSystemsPage() {
  const featured = featuredSystems();

  return (
    <article>
      <PageHeader
        kicker="Systems"
        title="Featured systems"
        intro="Nine systems received a holistic Overall score of 4.0/5 or above in the pilot analysis. They are featured for closer discussion; the threshold does not create a definitive leaderboard, and ties are not internally ranked."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {featured.map(({ system, evaluation }) => {
          const paper = paperById(system.paperId);
          const demo = demoById(system.id);
          if (!paper || !demo) return null;
          return (
            <SystemCard
              key={system.id}
              system={system}
              evaluation={evaluation}
              paper={paper}
              demo={demo}
            />
          );
        })}
      </div>

      <p className="mt-8 max-w-prose text-sm leading-relaxed text-muted">
        {content.listeningEvaluation.caveat}
      </p>
    </article>
  );
}
