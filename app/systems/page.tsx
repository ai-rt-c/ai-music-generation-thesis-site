import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import SystemsBrowser from "@/components/systems/SystemsBrowser";
import { content, demoById, evaluationById, paperById, systems } from "@/lib/data";

export const metadata: Metadata = {
  title: "27 selected systems",
  description: "The 27 systems examined in the pilot exploratory listening analysis, organised in seven comparable batches.",
};

export default function SystemsPage() {
  const records = systems.flatMap((system) => {
    const evaluation = evaluationById(system.id);
    const paper = paperById(system.paperId);
    const demo = demoById(system.id);
    return evaluation && paper && demo ? [{ system, evaluation, paper, demo }] : [];
  });
  const evidenceRows = systems.map((system) => {
    const evaluation = evaluationById(system.id);
    const paper = paperById(system.paperId);
    const demo = demoById(system.id);
    return {
      evidence:
        evaluation?.paperBased ? "paper" : demo?.note.toLowerCase().includes("locally") ? "local" : "direct",
      hasCode: Boolean(paper?.hasCode),
      hasMetrics: Boolean(evaluation?.reportedMetrics || paper?.metrics),
    };
  });
  const directCount = evidenceRows.filter((row) => row.evidence === "direct").length;
  const localCount = evidenceRows.filter((row) => row.evidence === "local").length;
  const codeCount = evidenceRows.filter((row) => row.hasCode).length;
  const metricsCount = evidenceRows.filter((row) => row.hasMetrics).length;

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

      <section className="mt-8 rounded-lg border border-line bg-white p-5">
        <h2 className="text-lg">Evidence and resource overview</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          All 27 systems have a traceable listening source. The system detail pages separate the
          pilot evaluator ratings from the original authors' evaluation design, reported metrics,
          headline result, code availability and the specific demonstration or output examined.
        </p>
        <p className="mt-2 max-w-prose text-xs leading-relaxed text-muted">
          These indicators are not mutually exclusive. The first two describe the provenance of
          the material examined; the latter two describe code and author-reported evaluation
          evidence.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md bg-forest-light/45 px-3 py-2">
            <dt className="text-xs text-muted">Official or project demos</dt>
            <dd className="tnum mt-1 text-lg font-medium text-forest-ink">{directCount}</dd>
          </div>
          <div className="rounded-md bg-forest-light/45 px-3 py-2">
            <dt className="text-xs text-muted">Local rendering/generation</dt>
            <dd className="tnum mt-1 text-lg font-medium text-forest-ink">{localCount}</dd>
          </div>
          <div className="rounded-md bg-forest-light/45 px-3 py-2">
            <dt className="text-xs text-muted">Code located or reported</dt>
            <dd className="tnum mt-1 text-lg font-medium text-forest-ink">{codeCount}</dd>
          </div>
          <div className="rounded-md bg-forest-light/45 px-3 py-2">
            <dt className="text-xs text-muted">Author metrics reported</dt>
            <dd className="tnum mt-1 text-lg font-medium text-forest-ink">{metricsCount}</dd>
          </div>
        </dl>
      </section>

      <SystemsBrowser records={records} />
    </article>
  );
}
