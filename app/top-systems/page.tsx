import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { SystemCard } from "@/components/systems/SystemsBrowser";
import { demos, papers, topSystems } from "@/lib/data";
import { systemDisplayName } from "@/lib/systemDisplayName";

export const metadata: Metadata = {
  title: "Top 9 systems",
  description:
    "The nine systems scoring 4.0 or above in the thesis's descriptive 29-system listening evaluation.",
};

export default function TopSystemsPage() {
  const paperMap = new Map(papers.map((paper) => [paper.id, paper]));
  const demoMap = new Map(demos.map((demo) => [demo.id, demo]));
  const records = topSystems()
    .map(({ system, evaluation }) => {
      const paper = paperMap.get(system.paperId);
      const demo = demoMap.get(system.id);
      if (!paper || !demo) {
        throw new Error(`Incomplete Top 9 data for system ${system.id}`);
      }
      return { system, evaluation, paper, demo };
    })
    .sort(
      (a, b) =>
        (b.evaluation.scores.overall ?? 0) - (a.evaluation.scores.overall ?? 0) ||
        a.system.name.localeCompare(b.system.name),
    );

  if (records.length !== 9) {
    throw new Error(`Expected 9 systems with Overall >= 4.0; found ${records.length}`);
  }

  return (
    <div>
      <PageHeader
        kicker="Listening subset"
        title="Top 9 systems"
        intro="Nine systems reached an Overall score of 4.0 or above in the post-inclusion 29-system listening subset."
      />

      <p className="prose-copy mb-8 rounded-lg border border-line bg-forest-light/35 p-4 text-sm leading-relaxed text-muted">
        “Top 9” refers only to the systems meeting this threshold within the structured
        listening subset. It is not a ranking of all 107 primary studies. Scores are
        descriptive single-listener judgements, not objective benchmark results.
      </p>

      <section aria-labelledby="top-system-cards">
        <h2 id="top-system-cards" className="sr-only">
          Systems with Overall scores of 4.0 or above
        </h2>
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {records.map((record) => (
            <SystemCard
              key={record.system.id}
              record={record}
              displayName={systemDisplayName(record.system.id, record.system.name)}
            />
          ))}
        </div>
      </section>

      <aside className="mt-10 rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg">Explore the full listening analysis</h2>
        <p className="prose-copy mt-2 text-sm leading-relaxed text-muted">
          Browse all selected systems and their available demos, or review the rubric,
          batch summaries, yearly summaries and interpretation of the listening exercise.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
          <Link href="/systems">Browse all 29 systems and demos</Link>
          <Link href="/listening-evaluation">Read the listening evaluation</Link>
        </div>
      </aside>
    </div>
  );
}
