import Link from "next/link";
import type { Paper } from "@/lib/types";
import type { SortKey, ScoreMap } from "@/lib/filters";
import ScoreBadge from "@/components/ui/ScoreBadge";
import PaperActions from "@/components/explorer/PaperActions";

function SortHeader({
  label, active, dir, onClick, align,
}: {
  label: string; active: boolean; dir?: "asc" | "desc"; onClick: () => void; align?: "right";
}) {
  return (
    <th
      scope="col"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-forest-ink hover:underline"
      >
        {label}
        {active && <span aria-hidden="true">{dir === "asc" ? "↑" : "↓"}</span>}
      </button>
    </th>
  );
}

export default function PaperTable({
  papers, scores, sort, onSort,
}: {
  papers: Paper[]; scores: ScoreMap; sort: SortKey; onSort: (s: SortKey) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-forest-light/60">
          <tr>
            <SortHeader label="Title" active={sort === "title-asc"} dir="asc" onClick={() => onSort("title-asc")} />
            <SortHeader
              label="Year"
              active={sort === "year-desc" || sort === "year-asc"}
              dir={sort === "year-asc" ? "asc" : "desc"}
              onClick={() => onSort(sort === "year-desc" ? "year-asc" : "year-desc")}
            />
            <th scope="col" className="px-3 py-2 text-left font-medium text-forest-ink">Task</th>
            <th scope="col" className="px-3 py-2 text-left font-medium text-forest-ink">Domain</th>
            <th scope="col" className="px-3 py-2 text-left font-medium text-forest-ink">Paradigm</th>
            <SortHeader label="Overall" active={sort === "overall-desc"} dir="desc" onClick={() => onSort("overall-desc")} align="right" />
            <th scope="col" className="px-3 py-2 text-left font-medium text-forest-ink">Links</th>
          </tr>
        </thead>
        <tbody>
          {papers.map((p) => (
            <tr key={p.id} className="border-t border-line hover:bg-forest-light/30">
              <td className="px-3 py-2 align-top">
                {p.inDepth ? (
                  <Link href={`/systems/${p.id}`} className="font-medium text-ink no-underline hover:underline">
                    {p.title}
                  </Link>
                ) : p.paperUrl ? (
                  <a href={p.paperUrl} target="_blank" rel="noopener noreferrer" className="text-ink no-underline hover:underline">
                    {p.title}
                  </a>
                ) : (
                  <span className="text-ink">{p.title}</span>
                )}
              </td>
              <td className="tnum px-3 py-2 align-top text-muted">{p.year ?? "—"}</td>
              <td className="px-3 py-2 align-top text-muted">{p.taskCategory}</td>
              <td className="px-3 py-2 align-top text-muted">{p.domain ?? "—"}</td>
              <td className="px-3 py-2 align-top text-muted">{p.paradigm ?? "—"}</td>
              <td className="px-3 py-2 text-right align-top">
                {p.inDepth ? <ScoreBadge value={scores[p.id]?.overall ?? null} /> : <span className="text-muted">—</span>}
              </td>
              <td className="px-3 py-2 align-top">
                <PaperActions paper={p} compact />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
