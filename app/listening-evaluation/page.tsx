import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { content, evaluations, systems } from "@/lib/data";
import { DIMENSION_KEYS, DIMENSION_LABELS } from "@/lib/types";
import type { Scores } from "@/lib/types";

export const metadata: Metadata = {
  title: "Listening Evaluation",
  description: "Descriptive results from the structured listening evaluation of the 29-system in-depth subset.",
};

type ScoreKey = keyof Scores;
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const displayMean = (value: number) => value.toFixed(2);
const displayThesisMean = (value: number) => {
  const scaled = value * 10;
  const lower = Math.floor(scaled);
  const fraction = scaled - lower;
  const rounded = Math.abs(fraction - 0.5) < Number.EPSILON * 10
    ? (lower % 2 === 0 ? lower : lower + 1)
    : Math.round(scaled);
  return (rounded / 10).toFixed(1);
};

export default function ListeningEvaluationPage() {
  const evaluationMap = new Map(evaluations.map((evaluation) => [evaluation.id, evaluation]));
  const records = systems.map((system) => {
    const evaluation = evaluationMap.get(system.id);
    if (!evaluation) throw new Error(`Missing listening evaluation for system ${system.id}`);
    return { system, evaluation };
  });
  const batches = [...new Set(systems.map((system) => system.batchIndex))].sort().map((index) => {
    const members = records.filter(({ system }) => system.batchIndex === index);
    const dimensions = Object.fromEntries(DIMENSION_KEYS.map((key) => {
      const values = members.map(({ evaluation }) => evaluation.scores[key])
        .filter((value): value is number => value != null);
      return [key, { mean: mean(values), applicable: values.length }];
    })) as Record<ScoreKey, { mean: number; applicable: number }>;
    return { index, label: members[0].system.batch, count: members.length, dimensions };
  });
  const years = [...new Set(systems.map((system) => system.year))]
    .filter((year): year is number => year != null).sort().map((year) => {
      const values = records.filter(({ system }) => system.year === year)
        .map(({ evaluation }) => evaluation.scores.overall)
        .filter((value): value is number => value != null);
      return { year, count: values.length, mean: mean(values) };
    });
  const topCount = records.filter(({ evaluation }) => (evaluation.scores.overall ?? 0) >= 4).length;
  const musicFlow = records.find(({ system }) => system.name === "MusicFlow");
  const rubric = content.listeningEvaluation;

  return (
    <article>
      <PageHeader kicker="Structured listening" title="Listening Evaluation"
        intro={`${records.length} selected systems were organized into ${batches.length} listening batches and assessed across ${DIMENSION_KEYS.length} dimensions.`} />
      <section aria-labelledby="scope" className="max-w-prose">
        <h2 id="scope" className="text-xl">Scope and interpretation</h2>
        <p className="mt-2 leading-relaxed">This was a single-listener structured listening exercise. The scores are descriptive aids for qualitative comparison within the thesis, not objective benchmark scores, and should not be generalized beyond this evaluation. Overall is a holistic judgement; it is not the arithmetic mean of the other dimensions. N/A means that a dimension was not applicable and is excluded from that dimension&apos;s summary.</p>
        {musicFlow?.evaluation.paperBased && <p className="prose-copy mt-3 rounded-lg border border-line bg-forest-light/35 px-4 py-3 text-sm text-muted"><strong className="text-ink">MusicFlow:</strong> paper-reported because no usable direct listening demo was available for this analysis.</p>}
      </section>

      <section aria-labelledby="dimensions" className="mt-10">
        <h2 id="dimensions" className="text-xl">Eight evaluation dimensions</h2>
        <p className="mt-2 max-w-prose leading-relaxed">{rubric.intro}</p>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <thead><tr className="bg-forest-light text-left text-forest-ink"><th scope="col" className="px-4 py-2">Dimension</th><th scope="col" className="px-4 py-2">Interpretation</th></tr></thead>
            <tbody>{rubric.rubric.map((item) => <tr key={item.key} className="border-t border-line align-top"><th scope="row" className="px-4 py-2 text-left font-medium">{item.label}</th><td className="px-4 py-2 text-muted">{item.meaning}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="batches" className="mt-12">
        <h2 id="batches" className="text-xl">Results by listening batch</h2>
        <p className="mt-2 max-w-prose leading-relaxed">Means are calculated directly from the current evaluation records.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{batches.map((batch) => <div key={batch.index} className="rounded-lg border border-line bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-forest">B{batch.index} · {batch.count} systems</p><h3 className="mt-1 text-lg">{batch.label.replace(/^B\d+\s+—\s+/, "")}</h3><p className="tnum mt-3 text-2xl font-semibold text-forest-ink">{displayThesisMean(batch.dimensions.overall.mean)}</p><p className="text-xs text-muted">Mean Overall</p></div>)}</div>
        <p className="prose-copy mt-5 rounded-lg border border-line bg-forest-light/35 px-4 py-3 text-sm leading-relaxed text-muted">
          <strong className="text-ink">Reading note:</strong> Values are batch means. <em>n</em> indicates the number of systems included in the calculation for that dimension.
        </p>
        <div className="mt-5 overflow-x-auto rounded-lg border border-line">
          <table className="w-full min-w-[72rem] border-collapse text-sm">
            <caption className="sr-only">Per-dimension means and applicable counts for the seven listening batches</caption>
            <thead><tr className="bg-forest-light text-left text-forest-ink"><th scope="col" className="sticky left-0 bg-forest-light px-3 py-2">Batch</th>{DIMENSION_KEYS.map((key) => <th scope="col" key={key} className="px-3 py-2">{DIMENSION_LABELS[key]}</th>)}</tr></thead>
            <tbody>{batches.map((batch) => <tr key={batch.index} className="border-t border-line"><th scope="row" className="sticky left-0 bg-white px-3 py-2 text-left">B{batch.index}</th>{DIMENSION_KEYS.map((key) => <td key={key} className="tnum px-3 py-2"><span className="font-medium">{displayMean(batch.dimensions[key].mean)}</span> <span className="text-xs text-muted">(n={batch.dimensions[key].applicable})</span></td>)}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="years" className="mt-12 max-w-3xl">
        <h2 id="years" className="text-xl">Overall scores by analytical year</h2>
        <p className="prose-copy mt-2 leading-relaxed">The mean Overall score is approximately 2.8 in 2020 and approximately 3.9 in 2024. Annual means fluctuate, however, so this is not a monotonic year-by-year increase.</p>
        <div className="mt-5 overflow-hidden rounded-lg border border-line"><table className="w-full border-collapse text-sm"><thead><tr className="bg-forest-light text-left text-forest-ink"><th scope="col" className="px-4 py-2">Year</th><th scope="col" className="px-4 py-2">Systems</th><th scope="col" className="px-4 py-2">Mean Overall</th></tr></thead><tbody>{years.map((item) => <tr key={item.year} className="border-t border-line"><th scope="row" className="px-4 py-2 text-left">{item.year}</th><td className="tnum px-4 py-2">{item.count}</td><td className="tnum px-4 py-2 font-medium">{displayMean(item.mean)}</td></tr>)}</tbody></table></div>
      </section>

      <section aria-labelledby="continue" className="mt-12 max-w-prose rounded-lg border border-line bg-forest-light/35 p-5">
        <h2 id="continue" className="text-xl">Continue to the systems</h2>
        <p className="mt-2 text-muted">{topCount} systems have an Overall score of 4.0 or above. Explore their full descriptive score profiles and available author-hosted demonstrations.</p>
        <Link href="/systems" className="mt-4 inline-flex rounded-md bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">Browse systems and listening demos</Link>
      </section>
    </article>
  );
}
