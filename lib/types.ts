// Content contract for the thesis companion site.
// Every JSON file in /data conforms to one of these types.
// Components consume these types only — no research content is hard-coded.

export type Domain = "Symbolic" | "Audio";
export type TaskCategory =
  | "Generation"
  | "Arrangement"
  | "Orchestration"
  | "Evaluation"
  | "Representation"
  | "Other";

export type Paradigm =
  | "Transformer"
  | "LLM"
  | "Foundation model"
  | "Diffusion"
  | "VAE"
  | "GAN"
  | "Flow matching"
  | "State-space"
  | "RNN"
  | "Hybrid"
  | "Non-neural";

// The eight listening-evaluation dimensions.
export interface Scores {
  quality: number | null;
  melody: number | null;
  harmony: number | null;
  rhythm: number | null;
  structure: number | null;
  control: number | null;
  naturalness: number | null;
  overall: number | null;
}

export const DIMENSION_KEYS: (keyof Scores)[] = [
  "quality",
  "melody",
  "harmony",
  "rhythm",
  "structure",
  "control",
  "naturalness",
  "overall",
];

export const DIMENSION_LABELS: Record<keyof Scores, string> = {
  quality: "Audio / rendering quality",
  melody: "Melodic coherence",
  harmony: "Harmonic coherence",
  rhythm: "Rhythmic stability",
  structure: "Long-term structure",
  control: "Control adherence",
  naturalness: "Naturalness / musicality",
  overall: "Overall",
};

// ---- papers.json : the 112 reviewed studies (the corpus) ----
export interface Paper {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  source: string;
  task: string; // raw task text from the master table
  taskCategory: TaskCategory; // normalised
  domain: Domain | null;
  method: string;
  architectureFamily: string; // raw
  paradigm: Paradigm | null; // normalised
  paradigmTags: Paradigm[]; // e.g. ["Transformer","LLM"]
  dataRepresentation: string;
  dataset: string;
  evaluation: string;
  metrics: string;
  musicLength: string;
  code: string;
  hasCode: boolean;
  codeUrl: string | null;
  hasDemo: boolean;
  doi: string | null;
  paperUrl: string | null;
  inDepth: boolean; // is it one of the 29 evaluated systems?
  notes: string;
  citation: string; // APA (same generator as references.json)
}

// ---- systems.json : the 29 in-depth systems ----
export interface System {
  id: string; // same id as its paper
  paperId: string;
  name: string; // short display name
  title: string;
  year: number | null;
  batch: string; // e.g. "B4 — Audio: foundational & token-based"
  batchIndex: number; // 1..7
  taskCategory: TaskCategory;
  domain: Domain | null;
  paradigm: Paradigm | null;
}

// ---- evaluation.json : listening scores + notes, keyed by system id ----
export interface Evaluation {
  id: string;
  scores: Scores;
  technicalContribution: string;
  criticalListening: string;
  takeaway: string;
  paperBased: boolean; // no public demo — scores from reported results
  // Derived (in the build script, from scores + notes) — never hand-written in a component:
  strengths: string[];
  weaknesses: string[];
  bestUseCase: string;
  reportedMetrics: string;
  reportedResult: string;
}

// ---- audio-demos.json : demo references, keyed by system id ----
export type DemoType = "hosted" | "link" | "interactive" | "paper-only";
export interface AudioDemo {
  id: string;
  label: string;
  url: string | null;
  type: DemoType;
  note: string;
}

// ---- taxonomy.json ----
export interface TaxonomyCategory {
  id: string;
  name: string;
  status: "base" | "expanded" | "new"; // relative to Zhu et al. (2023)
  description: string;
  exampleIds: string[];
}
export interface TaxonomyDimension {
  id: string;
  number: number;
  name: string;
  summary: string;
  categories: TaxonomyCategory[];
}

// ---- trends.json ----
export interface Trend {
  id: string;
  number: number;
  name: string;
  periodLabel: string;
  span: { start: number; end: number; seedStart?: number };
  coreIdea: string;
  whyItMatters: string;
  representativeIds: string[];
}

// ---- references.json ----
export interface Reference {
  key: string; // sort key (first author surname, lowercased)
  text: string; // full APA entry
  included: boolean; // true = one of the 112 included studies
}

// ---- content.json : narrative page copy, extracted from the dissertation ----
export interface Block {
  heading?: string;
  body: string;
}
export interface RichSection {
  title: string;
  intro?: string;
  blocks: Block[];
}
export interface Content {
  home: { tagline: string; summary: string; readingPath: { label: string; href: string }[] };
  aboutThesis: {
    abstract: string;
    aim: string;
    researchQuestions: string[];
    contributions: string[];
    objectives: string[];
  };
  systematicReview: RichSection;
  listeningEvaluation: {
    intro: string;
    rubric: { key: keyof Scores; label: string; meaning: string }[];
    caveat: string;
  };
  discussion: {
    intro: string;
    rq: { q: string; a: string }[];
    limitationsReview: string;
    limitationsField: string;
  };
  futureDirections: RichSection;
  glossary: { term: string; definition: string }[];
  tips: {
    domain: Record<string, string>;
    task: Record<string, string>;
    paradigm: Record<string, string>;
  };
}

// ---- meta.json : study-level facts, figures, citations ----
export interface FigureItem {
  id: string;
  number: number;
  title: string;
  caption: string;
  png: string;
  svg?: string;
  alt: string;
}
export interface Meta {
  title: string;
  subtitle: string;
  author: string;
  supervisor: string;
  university: string;
  program: string;
  year: number;
  lastUpdated: string;
  repoUrl: string;
  prisma: {
    identified: number;
    afterDedup: number;
    titleScreened: number;
    fullText: number;
    included: number;
    inDepth: number;
  };
  counts: {
    included: number;
    inDepth: number;
    topSystems: number;
    trends: number;
    taxonomyDimensions: number;
  };
  batchAverages: { batch: string; quality: number; overall: number; leading: string }[];
  citations: { apa: string; bibtex: string };
  downloads: { label: string; file: string; kind: string }[];
  figures: FigureItem[];
}
