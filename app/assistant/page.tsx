import type { Metadata } from "next";
import ThesisAssistant from "@/components/assistant/ThesisAssistant";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Ask the thesis",
  description: "Ask questions answered only from the full public thesis PDF, with page citations.",
};

export default function AssistantPage() {
  return (
    <article className="max-w-5xl">
      <PageHeader
        kicker="Research assistant · preview"
        title="Ask the thesis"
        intro="Explore the review through answers grounded only in the full public thesis PDF. Every answer shows the exact thesis pages used; related website pages are linked only for easier exploration."
      />
      <ThesisAssistant />
    </article>
  );
}
