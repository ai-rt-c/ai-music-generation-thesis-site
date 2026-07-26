import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { content } from "@/lib/data";

export const metadata: Metadata = {
  title: "Discussion",
  description: content.discussion.intro,
};

export default function DiscussionPage() {
  const d = content.discussion;
  return (
    <article className="max-w-prose">
      <PageHeader kicker="Findings" title="Discussion" intro={d.intro} />

      <h2 className="mt-8 text-xl">Answering the research questions</h2>
      {d.rq.map((item, i) => (
        <section key={i} className="mt-6">
          <h3 className="text-base font-medium text-forest-ink">{item.q}</h3>
          <p className="mt-2 leading-relaxed">{item.a}</p>
        </section>
      ))}

      <h2 className="mt-10 text-xl">Limitations of the review</h2>
      <p className="mt-2 leading-relaxed">{d.limitationsReview}</p>

      <h2 className="mt-8 text-xl">Limitations of the field</h2>
      <p className="mt-2 leading-relaxed">{d.limitationsField}</p>
    </article>
  );
}
