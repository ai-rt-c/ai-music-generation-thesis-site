import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import Explorer from "@/components/explorer/Explorer";
import { papers, evaluations, meta, content } from "@/lib/data";
import { buildFacets, type ScoreMap } from "@/lib/filters";

export const metadata: Metadata = {
  title: "Interactive explorer",
  description: `Filter, search and sort all ${meta.counts.included} reviewed studies of AI music generation, arrangement and orchestration.`,
};

export default function ExplorerPage() {
  const facets = buildFacets(papers);
  const scores: ScoreMap = Object.fromEntries(evaluations.map((e) => [e.id, e.scores]));

  return (
    <div>
      <PageHeader
        kicker="Systems"
        title="Interactive explorer"
        intro={`Browse all ${meta.counts.included} reviewed studies. Filter, search and sort; the ${meta.counts.inDepth} evaluated systems additionally carry listening scores.`}
      />
      <Explorer papers={papers} scores={scores} facets={facets} tips={content.tips} />
    </div>
  );
}
