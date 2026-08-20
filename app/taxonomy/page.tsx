import type { Metadata } from "next";
import Figure from "@/components/figures/Figure";
import PageHeader from "@/components/ui/PageHeader";
import Tag from "@/components/ui/Tag";
import { figureById, paperById, taxonomy } from "@/lib/data";

export const metadata: Metadata = {
  title: "Extended taxonomy",
  description: "A four-dimension taxonomy of AI music generation, arrangement and orchestration systems.",
};

export default function TaxonomyPage() {
  return (
    <article className="max-w-4xl">
      <PageHeader
        kicker="The field"
        title="Extended taxonomy"
        intro="The taxonomy extends Zhu et al. (2023) across four dimensions: task, generative modelling paradigm, conditioning input modality and data representation."
      />

      <Figure figure={figureById("taxonomy")} maxWidth={820} />

      <div className="mt-10 space-y-8">
        {taxonomy.map((dimension) => (
          <section key={dimension.id}>
            <p className="text-xs font-medium uppercase tracking-wide text-forest">Dimension {dimension.number}</p>
            <h2 className="mt-1 text-xl">{dimension.name}</h2>
            <p className="mt-2 text-muted">{dimension.summary}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {dimension.categories.map((category) => (
                <div key={category.id} className="rounded-lg border border-line bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base">{category.name}</h3>
                    {category.status !== "base" && <Tag label={category.status === "new" ? "New" : "Expanded"} muted />}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{category.description}</p>
                  {category.exampleIds.length > 0 && (
                    <p className="mt-3 text-xs leading-relaxed text-muted">
                      Examples: {category.exampleIds.map((id) => paperById(id)?.title ?? `ID ${id}`).join("; ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}
