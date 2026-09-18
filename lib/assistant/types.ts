export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
}

export interface AssistantSourceLink {
  label: string;
  href: string;
}

export interface AssistantSource {
  id: string;
  label: string;
  href: string;
  excerpt: string;
  thesisPage: string;
  pdfPage: number;
  siteLinks: AssistantSourceLink[];
}

export interface AssistantAnswer {
  answer: string;
  sources: AssistantSource[];
}
