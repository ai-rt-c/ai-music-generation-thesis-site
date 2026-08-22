import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import { ReferenceBrowser } from "@/components/references/ReferenceBrowser";
import { papers, references } from "@/lib/data";
import { formatReferenceDisplay } from "@/lib/referenceDisplay";

export const metadata: Metadata = {
  title: "References",
  description: "References for the 107-study primary corpus and the background and enabling literature.",
};

export default function ReferencesPage() {
  const primary = references.filter((reference) => reference.included);
  const background = references.filter((reference) => !reference.included);
  const primaryDisplays = papers.map(formatReferenceDisplay);

  const list = (items: typeof references) => (
    <ol className="mt-4 space-y-3 text-sm leading-relaxed">
      {items.map((reference, index) => (
        <li key={`${reference.key}-${index}`} className="pl-6 -indent-6">{reference.text}</li>
      ))}
    </ol>
  );

  return (
    <article className="max-w-prose">
      <PageHeader
        kicker="Reference"
        title="References"
        intro="The 107 primary studies are listed separately from 13 background and enabling sources, including the five records reclassified during the final E1 eligibility-consistency audit."
      />

      <section>
        <h2 className="text-xl">Primary corpus ({primary.length})</h2>
        <ReferenceBrowser references={primaryDisplays} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl">Background and enabling literature ({background.length})</h2>
        {list(background)}
      </section>
    </article>
  );
}
