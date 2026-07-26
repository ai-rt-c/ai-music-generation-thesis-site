import Link from "next/link";
import { content, meta } from "@/lib/data";

export default function HomePage() {
  const c = content.home;
  const stats = [
    { n: meta.counts.included, label: "studies reviewed" },
    { n: meta.counts.inDepth, label: "systems evaluated" },
    { n: meta.counts.trends, label: "research trends" },
    { n: meta.counts.topSystems, label: "most promising" },
  ];
  return (
    <div className="max-w-prose">
      <p className="text-xs font-medium uppercase tracking-wide text-forest">
        Systematic review · 2020–2025
      </p>
      <h1 className="mt-2 text-3xl leading-tight">{meta.title}</h1>
      <p className="mt-3 text-lg text-muted">{c.tagline}</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-forest-light px-4 py-3">
            <div className="tnum text-2xl font-semibold text-forest-ink">{s.n}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="mt-8 leading-relaxed">{c.summary}</p>

      <h2 className="mt-10 text-lg">Start here</h2>
      <ol className="mt-3 space-y-1.5">
        {c.readingPath.map((step, i) => (
          <li key={step.href} className="flex gap-3">
            <span className="tnum text-sm text-muted">{i + 1}.</span>
            <Link href={step.href}>{step.label}</Link>
          </li>
        ))}
      </ol>

      <h2 className="mt-10 text-lg">Contributions</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed marker:text-forest">
        {content.aboutThesis.contributions.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
