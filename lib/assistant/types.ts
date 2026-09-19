export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  role: AssistantRole;
  content: string;
}

export interface AssistantSourceLink {
  label: string;
  href: string;
}

export type AssistantSourceKind = "thesis" | "master" | "listening";

export interface AssistantSource {
  id: string;
  citation: string;
  kind: AssistantSourceKind;
  label: string;
  href: string;
  excerpt: string;
  thesisPage?: string;
  pdfPage?: number;
  siteLinks: AssistantSourceLink[];
}

export interface AssistantEvidenceSource extends AssistantSource {
  context: string;
}

export interface AssistantAnswer {
  answer: string;
  sources: AssistantSource[];
}
