import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import CopyField from "@/components/ui/CopyField";
import { meta, asset } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "Author, citation and downloads for the companion website.",
};

export default function AboutPage() {
  return (
    <article className="max-w-prose">
      <PageHeader kicker="Colophon" title="About this site" />

      <p className="leading-relaxed">
        This is the interactive companion to the master&rsquo;s dissertation{" "}
        <span className="italic">{meta.title}: {meta.subtitle}</span>. Every page is
        generated from structured data extracted from the dissertation, so the site can be
        read independently of the PDF.
      </p>

      <h2 className="mt-8 text-xl">Author</h2>
      <p className="mt-2 leading-relaxed">
        {meta.author}
        <br />
        {meta.program}, {meta.university}
        <br />
        Supervisor: {meta.supervisor}
      </p>

      <h2 className="mt-8 text-xl">How to cite</h2>
      <CopyField label="APA" value={meta.citations.apa} />
      <CopyField label="BibTeX" value={meta.citations.bibtex} />

      <h2 className="mt-8 text-xl">Downloads</h2>
      <ul className="mt-2 space-y-1.5">
        {meta.downloads.map((d) => (
          <li key={d.file}>
            <a href={asset(d.file)} className="inline-flex items-center gap-2">
              {d.label} <span className="text-xs uppercase text-muted">{d.kind}</span>
            </a>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl">Repository</h2>
      <p className="mt-2 leading-relaxed">
        Source and data: <a href={meta.repoUrl}>{meta.repoUrl}</a>
      </p>
      <p className="mt-4 text-sm text-muted">Last updated {meta.lastUpdated}.</p>
    </article>
  );
}
