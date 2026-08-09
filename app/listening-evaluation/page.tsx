import type { Metadata } from "next";
import Link from "next/link";
import Figure from "@/components/figures/Figure";
import PageHeader from "@/components/ui/PageHeader";
import { content, figureById } from "@/lib/data";

export const metadata: Metadata = {
  title: "Pilot exploratory listening analysis",
  description: "Evaluator profile, procedure, seven-criterion rubric, holistic Overall score and limitations for the 29-system pilot analysis.",
};

export default function ListeningEvaluationPage() {
  const analysis = content.listeningEvaluation;

  return (
    <article className="max-w-4xl">
      <PageHeader kicker="Findings" title={analysis.title} intro={analysis.intro} />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg">Evaluator profile</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{analysis.evaluatorProfile}</p>
        </section>
        <section className="rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg">Procedure and session record</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{analysis.procedure}</p>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-xl">Rubric and scale</h2>
        <p className="mt-2 max-w-prose leading-relaxed">
          Every rating uses a maximum of 5: 1 indicates clearly weak material, 3 adequate or mixed material, and 5 consistently strong material. Values of 2 and 4 indicate intermediate cases.
        </p>
        <div className="mt-5 overflow-hidden rounded-lg border border-line bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-forest-light text-left text-forest-ink">
                <th className="px-4 py-2 font-medium">Rating item</th>
                <th className="px-4 py-2 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {analysis.rubric.map((item) => (
                <tr key={item.key} className="border-t border-line align-top">
                  <td className="px-4 py-2 font-medium text-ink">
                    {item.label}{item.key === "overall" ? " (holistic)" : ""}
                  </td>
                  <td className="px-4 py-2 text-muted">{item.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl">How to read the results</h2>
        <p className="mt-2 max-w-prose leading-relaxed">{analysis.caveat}</p>
        <p className="mt-4 max-w-prose leading-relaxed">
          Each system page separates the evaluator’s ratings from the original authors’ evaluation design, reported metrics and headline result. It also states whether the assessed evidence was a public demonstration, a locally generated or rendered output, or paper-reported only.
        </p>
      </section>

      <Figure figure={figureById("heatmap")} maxWidth={760} />
      <Figure figure={figureById("overall-order")} maxWidth={720} />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/systems" className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white no-underline hover:no-underline">
          Explore all 29 systems
        </Link>
        <Link href="/featured-systems" className="rounded-md border border-forest px-4 py-2 text-sm font-medium text-forest no-underline hover:no-underline">
          View the featured set
        </Link>
      </div>
    </article>
  );
}
