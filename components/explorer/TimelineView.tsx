import Link from "next/link";
import type { Paper } from "@/lib/types";
import type { ScoreMap } from "@/lib/filters";
import ScoreBadge from "@/components/ui/ScoreBadge";

// Groups the filtered papers by year across the full 2020–2025 axis so the
// growth of the field is visible even as filters change.
export default function TimelineView({
  papers,
  scores,
  yearRange,
}: {
  papers: Paper[];
  scores: ScoreMap;
  yearRange: [number, number];
}) {
  const byYear = new Map<number, Paper[]>();
  for (const p of papers) {
    const y = p.year ?? 0;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y)!.push(p);
  }
  const years: number[] = [];
  for (let y = yearRange[0]; y <= yearRange[1]; y++) years.push(y);
  const max = Math.max(1, ...years.map((y) => byYear.get(y)?.length ?? 0));

  return (
    <div className="space-y-6">
      {years.map((y) => {
        const list = byYear.get(y) ?? [];
        return (
          <section key={y}>
            <div className="mb-2 flex items-center gap-3">
              <h3 className="tnum w-12 shrink-0 text-lg font-semibold text-forest-ink">{y}</h3>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-forest-light">
                <div className="h-2 rounded-full bg-forest" style={{ width: `${(list.length / max) * 100}%` }} />
              </div>
              <span className="tnum w-6 shrink-0 text-right text-sm text-muted">{list.length}</span>
            </div>
            {list.length > 0 && (
              <ul className="ml-12 divide-y divide-line rounded-lg border border-line bg-white">
                {list.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {p.inDepth ? (
                        <Link href={`/systems/${p.id}`} className="text-ink no-underline hover:underline">
                          {p.title}
                        </Link>
                      ) : (
                        <span className="text-ink">{p.title}</span>
                      )}
                      <span className="ml-2 text-xs text-muted">
                        {p.taskCategory} · {p.paradigm ?? "—"}
                      </span>
                    </span>
                    {p.inDepth && <ScoreBadge value={scores[p.id]?.overall ?? null} />}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
