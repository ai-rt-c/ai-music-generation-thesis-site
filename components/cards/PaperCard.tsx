import Link from "next/link";
import type { Paper } from "@/lib/types";
import Tag from "@/components/ui/Tag";
import ScoreBadge from "@/components/ui/ScoreBadge";

export default function PaperCard({
  paper,
  overall,
}: {
  paper: Paper;
  overall?: number | null;
}) {
  const cls = "font-medium text-ink no-underline hover:underline";
  const title = paper.inDepth ? (
    <Link href={`/systems/${paper.id}`} className={cls}>{paper.title}</Link>
  ) : paper.paperUrl ? (
    <a href={paper.paperUrl} target="_blank" rel="noopener noreferrer" className={cls}>{paper.title}</a>
  ) : (
    <span className="font-medium text-ink">{paper.title}</span>
  );

  return (
    <article className="flex flex-col rounded-xl border border-line bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] leading-snug">{title}</h3>
        {paper.inDepth && <ScoreBadge value={overall ?? null} />}
      </div>
      <p className="mt-1 text-xs text-muted">
        {paper.authors ? paper.authors.split(";")[0].trim() + (paper.authors.includes(";") ? " et al." : "") : ""}
        {paper.year ? ` · ${paper.year}` : ""}
        {paper.source ? ` · ${paper.source}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Tag label={paper.taskCategory} />
        {paper.domain && <Tag label={paper.domain} muted />}
        {paper.paradigm && <Tag label={paper.paradigm} muted />}
      </div>
    </article>
  );
}
