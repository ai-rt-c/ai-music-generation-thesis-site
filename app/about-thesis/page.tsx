import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { content, meta } from "@/lib/data";

export const metadata: Metadata = {
  title: "About the thesis",
  description: content.aboutThesis.abstract.slice(0, 160),
};

export default function AboutThesisPage() {
  const a = content.aboutThesis;
  return (
    <article className="max-w-prose">
      <PageHeader kicker="Master thesis" title="About the thesis" />

      <h2 className="mt-8 text-xl">Abstract</h2>
      <p className="mt-2 leading-relaxed">{a.abstract}</p>

      <h2 className="mt-8 text-xl">Aim</h2>
      <p className="mt-2 leading-relaxed">{a.aim}</p>

      <h2 className="mt-8 text-xl">Research questions</h2>
      <ol className="prose-copy mt-2 list-decimal space-y-2 pl-5 leading-relaxed marker:text-forest">
        {a.researchQuestions.map((q, i) => (
          <li key={i}>{q}</li>
        ))}
      </ol>

      <h2 className="mt-8 text-xl">Objectives</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed marker:text-forest">
        {a.objectives.map((o, i) => (
          <li key={i}>{o}</li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl">Contributions</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed marker:text-forest">
        {a.contributions.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>

      <div className="mt-10 rounded-lg border border-line bg-white p-5 text-sm">
        <p className="text-ink">{meta.author}</p>
        <p className="mt-1 text-muted">
          {meta.program} · {meta.university}
          <br />
          Supervisor: {meta.supervisor}
        </p>
        <span
          className="mt-3 inline-block rounded-md border border-line px-3 py-1.5 text-muted"
          aria-disabled="true"
          title="The full dissertation will be released after final submission"
        >
          Thesis available after final submission
        </span>
      </div>
    </article>
  );
}
