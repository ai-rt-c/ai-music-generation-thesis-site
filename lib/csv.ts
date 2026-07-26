// Pure CSV builder + a client-side download helper for the current filtered list.
import type { Paper } from "@/lib/types";
import type { ScoreMap } from "@/lib/filters";

const HEADERS = [
  "id", "title", "authors", "year", "task", "domain", "paradigm",
  "source", "doi", "paperUrl", "codeUrl", "overall",
];

const esc = (v: unknown) => {
  const str = v == null ? "" : String(v);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

export function papersToCsv(papers: Paper[], scores: ScoreMap): string {
  const rows = papers.map((p) =>
    [
      p.id, p.title, p.authors, p.year ?? "", p.taskCategory, p.domain ?? "",
      p.paradigm ?? "", p.source, p.doi ?? "", p.paperUrl ?? "", p.codeUrl ?? "",
      scores[p.id]?.overall ?? "",
    ]
      .map(esc)
      .join(","),
  );
  return [HEADERS.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
