import Link from "next/link";
import ScoreBadge from "@/components/ui/ScoreBadge";
import Tag from "@/components/ui/Tag";
import type { AudioDemo, Evaluation, Paper, System } from "@/lib/types";

export default function SystemCard({
  system,
  evaluation,
  paper,
  demo,
}: {
  system: System;
  evaluation: Evaluation;
  paper: Paper;
  demo: AudioDemo;
}) {
  const evidenceLabel = demo.note.toLowerCase().includes("locally")
    ? "Locally generated / rendered"
    : "Directly assessable output";

  return (
    <article className="flex h-full flex-col rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{system.year} · {system.batch.split(" — ")[0]}</p>
          <h3 className="mt-1 text-base leading-snug">
            <Link href={`/systems/${system.id}`} className="text-ink no-underline hover:underline">
              {system.name}
            </Link>
          </h3>
        </div>
        <ScoreBadge value={evaluation.scores.overall} />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag label={system.taskCategory} />
        {system.domain && <Tag label={system.domain} muted />}
        {system.paradigm && <Tag label={system.paradigm} muted />}
      </div>

      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted">Evidence</dt>
        <dd className="text-ink">{evidenceLabel}</dd>
        <dt className="text-muted">Code</dt>
        <dd className="text-ink">{paper.hasCode ? "Available" : "Not located / reported"}</dd>
        <dt className="text-muted">Paper metrics</dt>
        <dd className="text-ink">{evaluation.reportedMetrics ? "Reported" : "Not reported"}</dd>
      </dl>

      <Link href={`/systems/${system.id}`} className="mt-4 text-sm font-medium">
        View evidence and ratings
      </Link>
    </article>
  );
}
