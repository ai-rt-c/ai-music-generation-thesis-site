import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import ScoreBadge from "@/components/ui/ScoreBadge";
import Tag from "@/components/ui/Tag";
import {
  content,
  demoById,
  evaluationById,
  paperById,
  systemById,
  systems,
} from "@/lib/data";
import { CRITERION_KEYS, DIMENSION_LABELS } from "@/lib/types";
import { fmtScore } from "@/lib/util";

export function generateStaticParams() {
  return systems.map((system) => ({ id: system.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const system = systemById(params.id);
  return {
    title: system?.name ?? "System",
    description: system ? `Evidence profile and pilot evaluator ratings for ${system.name}.` : undefined,
  };
}

function EvidenceRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-line py-3 first:border-t-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-ink">{children}</dd>
    </div>
  );
}

export default function SystemDetailPage({ params }: { params: { id: string } }) {
  const system = systemById(params.id);
  const evaluation = evaluationById(params.id);
  const paper = paperById(params.id);
  const demo = demoById(params.id);
  if (!system || !evaluation || !paper || !demo) notFound();

  const evidenceType = demo.note.toLowerCase().includes("locally")
      ? "Generated or rendered locally from released project resources."
      : "Direct assessment of an official author or project demonstration.";

  return (
    <article className="max-w-4xl">
      <PageHeader
        kicker={`${system.batch} · ${system.year ?? "Year not recorded"}`}
        title={system.name}
        intro={system.title !== system.name ? system.title : undefined}
      />

      <div className="flex flex-wrap items-center gap-2">
        <ScoreBadge value={evaluation.scores.overall} label="Evaluator’s score" />
        <Tag label={system.taskCategory} />
        {system.domain && <Tag label={system.domain} muted />}
        {system.paradigm && <Tag label={system.paradigm} muted />}
      </div>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
        The Overall score is one of the eight rubric dimensions and is a separate holistic judgement on a maximum of 5. It is not calculated as the mean of the other seven rubric dimensions.
      </p>

      <section className="mt-9">
        <h2 className="text-xl">Seven criterion ratings</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-forest-light text-left text-forest-ink">
                <th className="px-4 py-2 font-medium">Criterion</th>
                <th className="px-4 py-2 text-right font-medium">Evaluator’s rating</th>
              </tr>
            </thead>
            <tbody>
              {CRITERION_KEYS.map((key) => (
                <tr key={key} className="border-t border-line">
                  <td className="px-4 py-2">{DIMENSION_LABELS[key]}</td>
                  <td className="tnum px-4 py-2 text-right font-medium text-forest-ink">
                    {evaluation.scores[key] == null ? "N/A" : `${fmtScore(evaluation.scores[key])}/5`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-9 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h2 className="text-xl">Pilot analysis notes</h2>
          {evaluation.technicalContribution && (
            <>
              <h3 className="mt-5 text-base">Technical contribution</h3>
              <p className="mt-2 leading-relaxed">{evaluation.technicalContribution}</p>
            </>
          )}
          <p className="mt-4 leading-relaxed">{evaluation.criticalListening}</p>

          {evaluation.strengths.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-forest-light/50 p-4">
                <h3 className="text-sm">Observed strengths</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted marker:text-forest">
                  {evaluation.strengths.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="rounded-lg border border-line bg-white p-4">
                <h3 className="text-sm">Observed limitations</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted marker:text-forest">
                  {evaluation.weaknesses.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

        <aside>
          <h2 className="text-xl">Evidence and resource profile</h2>
          <dl className="mt-4 rounded-lg border border-line bg-white px-4">
            <EvidenceRow label="Assessment evidence">{evidenceType}</EvidenceRow>
            <EvidenceRow label="Specific material examined">
              {demo.url ? (
                <a href={demo.url} target="_blank" rel="noopener noreferrer">{demo.label}</a>
              ) : demo.label}
              <span className="mt-1 block text-muted">{demo.note}</span>
            </EvidenceRow>
            <EvidenceRow label="Code availability">
              {paper.hasCode ? (
                paper.codeUrl ? <a href={paper.codeUrl} target="_blank" rel="noopener noreferrer">Available repository</a> : "Reported as available"
              ) : "No code repository was located or reported in the extracted record."}
            </EvidenceRow>
            <EvidenceRow label="Original authors’ evaluation criteria and design">
              {paper.evaluation || "Not reported in the extracted record."}
            </EvidenceRow>
            <EvidenceRow label="Original authors’ metrics">
              {evaluation.reportedMetrics || paper.metrics || "Not reported in the extracted record."}
            </EvidenceRow>
            <EvidenceRow label="Original authors’ headline result">
              {evaluation.reportedResult || "No concise headline result was recorded."}
            </EvidenceRow>
            <EvidenceRow label="Paper">
              {paper.paperUrl ? (
                <a href={paper.paperUrl} target="_blank" rel="noopener noreferrer">Open publication</a>
              ) : "No publication URL was recorded."}
              <span className="mt-1 block text-muted">{paper.authors} ({paper.year}). {paper.source}</span>
            </EvidenceRow>
          </dl>
        </aside>
      </section>

      <div className="mt-10 rounded-lg border border-line bg-forest-light/40 p-4 text-sm leading-relaxed text-muted">
        {content.listeningEvaluation.caveat}
      </div>

      <p className="mt-8 text-sm">
        <Link href="/systems">← Back to all 27 systems</Link>
      </p>
    </article>
  );
}
