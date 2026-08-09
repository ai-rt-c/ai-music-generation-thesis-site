import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import SystemCard from "@/components/cards/SystemCard";
import { content, demoById, evaluationById, paperById, systems } from "@/lib/data";

export const metadata: Metadata = {
  title: "29 selected systems",
  description: "The 29 systems examined in the pilot exploratory listening analysis, organised in seven comparable batches.",
};

export default function SystemsPage() {
  const batches = Array.from(new Set(systems.map((system) => system.batch)));

  return (
    <article>
      <PageHeader
        kicker="Systems"
        title="29 selected systems"
        intro="The systems are organised in seven batches so that comparisons stay close to task, domain and modelling context. Their order within each batch is descriptive, not a ranking."
      />

      <div className="max-w-prose rounded-lg border border-line bg-forest-light/40 p-4 text-sm leading-relaxed text-muted">
        {content.listeningEvaluation.caveat}
      </div>

      {batches.map((batch) => {
        const batchSystems = systems.filter((system) => system.batch === batch);
        return (
          <section key={batch} className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
              <h2 className="text-xl">{batch}</h2>
              <p className="text-sm text-muted">{batchSystems.length} systems</p>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {batchSystems.map((system) => {
                const evaluation = evaluationById(system.id);
                const paper = paperById(system.paperId);
                const demo = demoById(system.id);
                if (!evaluation || !paper || !demo) return null;
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
          </section>
        );
      })}
    </article>
  );
}
