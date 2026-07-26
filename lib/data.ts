// Typed accessors over the generated JSON. Components import from here only.
import papersJson from "@/data/papers.json";
import systemsJson from "@/data/systems.json";
import evaluationJson from "@/data/evaluation.json";
import demosJson from "@/data/audio-demos.json";
import taxonomyJson from "@/data/taxonomy.json";
import trendsJson from "@/data/trends.json";
import referencesJson from "@/data/references.json";
import contentJson from "@/data/content.json";
import metaJson from "@/data/meta.json";

import type {
  Paper, System, Evaluation, AudioDemo, TaxonomyDimension,
  Trend, Reference, Content, Meta,
} from "@/lib/types";

export const papers = papersJson as Paper[];
export const systems = systemsJson as System[];
export const evaluations = evaluationJson as Evaluation[];
export const demos = demosJson as AudioDemo[];
export const taxonomy = taxonomyJson as TaxonomyDimension[];
export const trends = trendsJson as Trend[];
export const references = referencesJson as Reference[];
export const content = contentJson as unknown as Content;
export const meta = metaJson as unknown as Meta;

export const evaluationById = (id: string) => evaluations.find((e) => e.id === id);
export const demoById = (id: string) => demos.find((d) => d.id === id);
export const paperById = (id: string) => papers.find((p) => p.id === id);
export const systemById = (id: string) => systems.find((s) => s.id === id);

// The Top 9: systems whose overall listening score is >= 4, ranked desc.
export const topSystems = () =>
  systems
    .map((s) => ({ system: s, evaluation: evaluationById(s.id)! }))
    .filter((x) => (x.evaluation?.scores.overall ?? 0) >= 4)
    .sort((a, b) => (b.evaluation.scores.overall ?? 0) - (a.evaluation.scores.overall ?? 0));

// Base path helper for public assets under GitHub Pages.
export const asset = (path: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${path.replace(/^\//, "")}`;
