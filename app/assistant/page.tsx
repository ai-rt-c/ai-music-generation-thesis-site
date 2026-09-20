import type { Metadata } from "next";
import ThesisAssistant from "@/components/assistant/ThesisAssistant";
import PageHeader from "@/components/ui/PageHeader";

export const metadata: Metadata = {
  title: "Ask the thesis",
  description: "Ask concise questions grounded in the public thesis and verified study data.",
};

export default function AssistantPage() {
  return (
    <article className="max-w-5xl">
      <PageHeader
        kicker="Research assistant"
        title="Ask the thesis"
        intro="Ask concise questions about the review, its findings and the selected systems. The assistant answers in English from verified thesis evidence and links only to relevant detail."
      />
      <ThesisAssistant />
    </article>
  );
}
