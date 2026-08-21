import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import SystemCard from "@/components/cards/SystemCard";
import { content, demoById, evaluationById, paperById, systems } from "@/lib/data";

export const metadata: Metadata = {
  title: "27 selected systems",
  description: "The 27 systems examined in the pilot exploratory listening analysis, organised in seven comparable batches.",
};

export default function SystemsPage() {
  const batches = Array.from(new Set(systems.map((system) => system.batch)));
  const evidenceOverview = systems.reduce(
    (counts, system) => {
      const demo = demoById(system.id);
      const paper = paperById(system.paperId);
      const evaluation = evaluationById(system.id);
      if (demo?.note.toLowerCase().includes("locally")) {
        counts.local += 1;
      } else if (demo?.url) {
        counts.official += 1;
      }
      if (paper?.hasCode) counts.code += 1;
      if (evaluation?.reportedMetrics || paper?.metrics) counts.metrics += 1;
      return counts;
    },
    { official: 0, local: 0, code: 0, metrics: 0 },
  );

  return (
    <article>
      <PageHeader
        kicker="Systems"
        title="27 selected systems"
        intro="The systems are organised in seven batches so that comparisons stay close to task, domain and modelling context. Their order within each batch is descriptive, not a ranking."
      />

      <div className="max-w-prose rounded-lg border border-line bg-forest-light/40 p-4 text-sm leading-relaxed text-muted">
        {content.listeningEvaluation.caveat}
      </div>

      <section className="mt-8" aria-labelledby="evidence-resource-overview">
        <h2 id="evidence-resource-overview" className="text-xl">
          Evidence and resource overview
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          The final pilot set combines directly assessable project resources with locally
          generated or rendered outputs, alongside the code and evaluation evidence recorded
          for each study.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-line bg-white p-4">
            <dt className="text-sm text-muted">Official/project demos</dt>
            <dd className="tnum mt-1 text-2xl font-semibold text-forest-ink">
              {evidenceOverview.official}
            </dd>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <dt className="text-sm text-muted">Local rendering/generation</dt>
            <dd className="tnum mt-1 text-2xl font-semibold text-forest-ink">
              {evidenceOverview.local}
            </dd>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <dt className="text-sm text-muted">Code located or reported</dt>
            <dd className="tnum mt-1 text-2xl font-semibold text-forest-ink">
              {evidenceOverview.code}
            </dd>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <dt className="text-sm text-muted">Author metrics reported</dt>
            <dd className="tnum mt-1 text-2xl font-semibold text-forest-ink">
              {evidenceOverview.metrics}
            </dd>
          </div>
        </dl>
      </section>

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
