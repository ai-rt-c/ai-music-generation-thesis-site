import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import SystemsBrowser from "@/components/systems/SystemsBrowser";
import { demos, evaluations, papers, systems } from "@/lib/data";

export const metadata: Metadata = {
  title: "Systems & Listening Demos",
  description:
    "Browse the 29 systems selected for in-depth synthesis and listening analysis, including public demos and descriptive listening scores.",
};

export default function SystemsPage() {
  const paperMap = new Map(papers.map((paper) => [paper.id, paper]));
  const evaluationMap = new Map(evaluations.map((evaluation) => [evaluation.id, evaluation]));
  const demoMap = new Map(demos.map((demo) => [demo.id, demo]));

  const records = systems.map((system) => {
    const paper = paperMap.get(system.paperId);
    const evaluation = evaluationMap.get(system.id);
    const demo = demoMap.get(system.id);

    if (!paper || !evaluation || !demo) {
      throw new Error(`Incomplete systems-page data for system ${system.id}`);
    }

    return { system, paper, evaluation, demo };
  });

  return (
    <div>
      <PageHeader
        kicker="In-depth subset"
        title="Systems & Listening Demos"
        intro="Browse the 29 systems selected after inclusion for closer synthesis and structured listening analysis. Open available author-hosted demos, compare descriptive scores and follow the original paper or code links."
      />

      <div className="mb-8 max-w-prose rounded-lg border border-line bg-forest-light/35 p-4 text-sm text-muted">
        <p>
          These scores support qualitative comparison within this thesis; they are not an
          objective benchmark. Overall is a holistic judgement and is not calculated as the
          arithmetic mean of the other dimensions. A dash means that a dimension was not
          applicable.
        </p>
      </div>

      <SystemsBrowser records={records} />
    </div>
  );
}
