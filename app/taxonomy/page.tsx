import type { Metadata } from "next";
import Figure from "@/components/figures/Figure";
import PageHeader from "@/components/ui/PageHeader";
import { figureById, taxonomy } from "@/lib/data";
import type { TaxonomyCategory, TaxonomyDimension } from "@/lib/types";

export const metadata: Metadata = {
  title: "Taxonomy",
  description:
    "The approved four-dimension taxonomy of AI music generation, arrangement and orchestration.",
};

const STATUS_ORDER: TaxonomyCategory["status"][] = ["base", "expanded", "new"];

function categoryGridClass(count: number) {
  if (count === 1) return "mt-3 grid gap-3 sm:max-w-sm";
  if (count === 2) return "mt-3 grid gap-3 sm:grid-cols-2";
  if (count === 3) return "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3";
  if (count === 4) return "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4";
  return "mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3";
}

function statusLabel(dimension: TaxonomyDimension, status: TaxonomyCategory["status"]) {
  if (status === "base") {
    return dimension.id === "paradigm" ? "Established / base" : "Base";
  }
  return status === "expanded" ? "Expanded" : "New";
}

function CategoryCard({ category }: { category: TaxonomyCategory }) {
  return (
    <article className="rounded-lg border border-line bg-white p-4">
      <h4 className="text-base">{category.name}</h4>
      <p className="mt-1 text-sm leading-relaxed text-muted">{category.description}</p>
    </article>
  );
}

function DimensionSection({ dimension }: { dimension: TaxonomyDimension }) {
  const grouped = dimension.id === "paradigm" || dimension.id === "conditioning";

  return (
    <section aria-labelledby={`taxonomy-${dimension.id}`} className="mt-10">
      <div className="border-b border-line pb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-forest">
          Dimension {dimension.number}
        </p>
        <h2 id={`taxonomy-${dimension.id}`} className="mt-1 text-2xl">
          {dimension.name}
        </h2>
        <p className="prose-copy mt-2 max-w-prose text-sm leading-relaxed text-muted">
          {dimension.summary}
        </p>
      </div>

      {grouped ? (
        <div className="mt-5 space-y-6">
          {STATUS_ORDER.map((status) => {
            const categories = dimension.categories.filter(
              (category) => category.status === status,
            );
            if (categories.length === 0) return null;
            return (
              <section key={status} aria-labelledby={`${dimension.id}-${status}`}>
                <h3 id={`${dimension.id}-${status}`} className="text-sm font-semibold text-forest-ink">
                  {statusLabel(dimension, status)}
                </h3>
                <div className={categoryGridClass(categories.length)}>
                  {categories.map((category) => (
                    <CategoryCard key={category.id} category={category} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className={categoryGridClass(dimension.categories.length).replace("mt-3", "mt-5")}>
          {dimension.categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}

      {dimension.id === "conditioning" && (
        <p className="prose-copy mt-4 max-w-prose text-sm leading-relaxed text-muted">
          Visual conditioning is retained for compatibility with Zhu et al. (2023), but it is
          outside the scope of this review.
        </p>
      )}
    </section>
  );
}

export default function TaxonomyPage() {
  return (
    <article>
      <PageHeader
        kicker="Conceptual framework"
        title="Taxonomy"
        intro="A four-dimension framework for classifying AI music generation, arrangement and orchestration systems."
      />

      <p className="prose-copy max-w-prose leading-relaxed">
        The taxonomy extends the framework of Zhu et al. (2023) to cover developments
        represented in this 2020–2025 review. Base categories are retained from the earlier
        framework; expanded and new categories identify areas that developed substantially or
        emerged in the later literature.
      </p>

      <Figure figure={figureById("taxonomy")} />

      <aside className="max-w-prose rounded-lg border border-line bg-forest-light/35 p-4 text-sm text-muted">
        <h2 className="text-base">Classification notes</h2>
        <p className="prose-copy mt-2 leading-relaxed">
          Multi-stage systems are classified by their principal generator. Agentic LLM
          pipelines remain within the LLM-based family rather than forming a separate
          generative paradigm.
        </p>
      </aside>

      <div className="mt-12">
        <h2 className="text-2xl">Structured breakdown</h2>
        {taxonomy.map((dimension) => (
          <DimensionSection key={dimension.id} dimension={dimension} />
        ))}
      </div>
    </article>
  );
}
