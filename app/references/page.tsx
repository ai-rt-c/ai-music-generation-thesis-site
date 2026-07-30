import type { Metadata } from "next";
import papers from "@/data/papers.json";
import { ReferenceBrowser } from "@/components/references/ReferenceBrowser";
import PageHeader from "@/components/ui/PageHeader";
import {
  compareReferenceDisplays,
  formatReferenceDisplay,
} from "@/lib/referenceDisplay";
import type { Paper } from "@/lib/types";

export const metadata: Metadata = {
  title: "References",
  description:
    "References for the 107 primary studies included in the systematic review.",
};

const excludedBackgroundIds = new Set(["321", "365", "362", "310", "311"]);
const references = (papers as Paper[])
  .map(formatReferenceDisplay)
  .sort(compareReferenceDisplays);

if (
  references.length !== 107 ||
  references.some((reference) => excludedBackgroundIds.has(reference.id))
) {
  throw new Error(
    "The primary-study reference page must contain exactly the verified 107-study corpus.",
  );
}

export default function ReferencesPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Systematic review corpus"
        title="References"
        intro="References for the 107 primary studies included in the systematic review."
      />

      <div className="prose-copy max-w-prose space-y-3 text-muted">
        <p>
          This list documents the final primary corpus used for the review and
          its corpus-level analyses. It is not the complete bibliography of
          every source cited in the thesis.
        </p>
        <p>
          Entries use a consistent presentation format based only on verified
          metadata already held by the website. The format is intended for
          readable browsing and is not presented as a complete implementation
          of a named citation style.
        </p>
      </div>

      <ReferenceBrowser references={references} />
    </div>
  );
}
