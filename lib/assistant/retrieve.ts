import "server-only";

import thesisCorpusJson from "@/data/thesis-corpus.json";
import type { AssistantSource, AssistantSourceLink } from "@/lib/assistant/types";

interface ThesisChunk {
  id: string;
  pdfPage: number;
  thesisPage: string;
  section: string;
  text: string;
  siteLinks: AssistantSourceLink[];
}

interface ThesisCorpus {
  source: {
    file: string;
    sha256: string;
    totalPages: number;
    title: string;
  };
  chunks: ThesisChunk[];
}

interface IndexedChunk extends ThesisChunk {
  normalizedText: string;
  normalizedSection: string;
  termCounts: Map<string, number>;
  length: number;
}

export interface RetrievedSource extends AssistantSource {
  context: string;
}

const PUBLIC_PDF_PATH = "/thesis/AI_Music_Thesis_Public_Edition.pdf";
const corpus = thesisCorpusJson as ThesisCorpus;

const STOP_WORDS = new Set([
  "a", "about", "an", "and", "are", "as", "at", "be", "been", "being", "by",
  "can", "could", "did", "do", "does", "for", "from", "had", "has", "have",
  "how", "i", "if", "in", "into", "is", "it", "its", "may", "more", "most",
  "of", "on", "or", "our", "should", "than", "that", "the", "their", "them",
  "there", "these", "they", "this", "to", "was", "were", "what", "when",
  "where", "which", "who", "why", "with", "would", "you", "your",
]);

const QUERY_EXPANSIONS: Array<[RegExp, string[]]> = [
  [/\b(contribution|contributions|novelty|original)\b|دستاورد|نوآوری|سهم/i, ["objectives", "taxonomy", "comparison", "trend", "recommendations"]],
  [/\b(limit|limits|limitation|limitations|weakness|bias)\b|محدودیت|ضعف|سوگیری/i, ["single", "reviewer", "generalisable", "curated", "coverage"]],
  [/\b(top|best|leader|leaders|promising|4\/5)\b|بهترین|برتر|امیدبخش/i, ["top-scoring", "overall", "controllability", "long-term", "structure"]],
  [/\b(prisma|screening|eligibility|selection)\b|پریسما|غربال|انتخاب/i, ["identification", "deduplication", "inclusion", "full-text"]],
  [/\b(objective|subjective|qualitative|evaluation evidence)\b|عینی|ذهنی|کیفی/i, ["evaluation", "listeners", "metrics", "demonstration", "judgements"]],
  [/\b(listening|listener|scores|rubric)\b|شنیداری|شنونده|امتیاز/i, ["exploratory", "eight", "dimensions", "single", "evaluator"]],
  [/\b(dataset|datasets|corpus|corpora)\b|دیتاست|مجموعه.?داده|داده/i, ["data", "lakh", "pop909", "musiccaps", "slakh", "maestro"]],
  [/\b(method|methods|methodology|procedure)\b|روش|متدولوژی/i, ["research", "design", "extraction", "verification", "synthesis"]],
  [/\b(future|recommendation|recommendations)\b|آینده|پیشنهاد/i, ["directions", "standardised", "benchmarks", "controllability", "structure"]],
  [/\b(overview|summary|thesis about)\b|خلاصه|موضوع تز|موضوع پایان.?نامه/i, ["systematic", "review", "aim", "research", "questions", "contributions"]],
];

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[–—−/]/g, " ")
    .replace(/[^a-z0-9.+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalize(value)
    .split(/[\s-]+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function countTerms(terms: string[]) {
  const counts = new Map<string, number>();
  terms.forEach((term) => counts.set(term, (counts.get(term) ?? 0) + 1));
  return counts;
}

const INDEX: IndexedChunk[] = corpus.chunks.map((chunk) => {
  const normalizedText = normalize(chunk.text);
  const normalizedSection = normalize(chunk.section);
  const terms = tokenize(`${chunk.section} ${chunk.text}`);
  return {
    ...chunk,
    normalizedText,
    normalizedSection,
    termCounts: countTerms(terms),
    length: terms.length,
  };
});

const averageLength = INDEX.reduce((sum, chunk) => sum + chunk.length, 0) / INDEX.length;
const documentFrequency = new Map<string, number>();
INDEX.forEach((chunk) => {
  chunk.termCounts.forEach((_count, term) => {
    documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  });
});

function idf(term: string) {
  const frequency = documentFrequency.get(term) ?? 0;
  return Math.log(1 + (INDEX.length - frequency + 0.5) / (frequency + 0.5));
}

function expandedQueryTerms(query: string) {
  const terms = tokenize(query);
  QUERY_EXPANSIONS.forEach(([pattern, additions]) => {
    if (pattern.test(query)) terms.push(...additions.flatMap(tokenize));
  });
  return [...new Set(terms)];
}

function scoreChunk(chunk: IndexedChunk, query: string, queryTerms: string[]) {
  const normalizedQuery = normalize(query);
  const k1 = 1.25;
  const b = 0.72;
  let score = 0;

  queryTerms.forEach((term) => {
    const tf = chunk.termCounts.get(term) ?? 0;
    if (!tf) return;
    const denominator = tf + k1 * (1 - b + b * (chunk.length / averageLength));
    score += idf(term) * ((tf * (k1 + 1)) / denominator);
    if (chunk.normalizedSection.includes(term)) score += idf(term) * 0.9;
  });

  if (normalizedQuery.length >= 5 && chunk.normalizedText.includes(normalizedQuery)) score += 18;
  for (let index = 0; index < queryTerms.length - 1; index += 1) {
    const phrase = `${queryTerms[index]} ${queryTerms[index + 1]}`;
    if (chunk.normalizedText.includes(phrase)) score += 3.5;
  }

  const pageMatch = query.match(/(?:page|p\.?)[\s:]*(\d{1,3}|[ivxlcdm]+)/i);
  if (pageMatch && chunk.thesisPage.toLowerCase() === pageMatch[1].toLowerCase()) score += 80;

  const thesisPage = Number(chunk.thesisPage);
  if (/\b(contribution|contributions|novelty)\b|دستاورد|نوآوری|سهم/i.test(query)) {
    if (chunk.thesisPage === "II" || thesisPage === 3) score += 18;
    if (thesisPage === 81) score += 42;
  }
  if (/\b(top|best|leader|leaders|promising|4\/5)\b|بهترین|برتر|امیدبخش/i.test(query) && thesisPage === 44) {
    score += 55;
  }
  if (/\b(limit|limits|limitation|limitations|weakness|bias)\b|محدودیت|ضعف|سوگیری/i.test(query)) {
    if (thesisPage === 26) score += 24;
    if (thesisPage === 77) score += 50;
  }
  if ((/\bobjective\b|عینی/i.test(query)) && (/\bsubjective\b|ذهنی/i.test(query))) {
    if ([9, 19, 31, 32, 33].includes(thesisPage)) score += 42;
  }
  if (/\bprisma\b|پریسما/i.test(query) && thesisPage >= 12 && thesisPage <= 18) score += 32;
  return score;
}

function shortExcerpt(text: string, length = 260) {
  if (text.length <= length) return text;
  const clipped = text.slice(0, length);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > 160 ? boundary : length).trimEnd()}…`;
}

function toRetrievedSource(chunk: IndexedChunk): RetrievedSource {
  const pageName = chunk.thesisPage === "Cover" ? "cover" : `p. ${chunk.thesisPage}`;
  return {
    id: chunk.id,
    label: `${chunk.section} · Thesis ${pageName}`,
    href: `${PUBLIC_PDF_PATH}#page=${chunk.pdfPage}`,
    excerpt: shortExcerpt(chunk.text),
    thesisPage: chunk.thesisPage,
    pdfPage: chunk.pdfPage,
    siteLinks: chunk.siteLinks,
    context: chunk.text,
  };
}

export function retrieveThesisContext(query: string, limit = 7): RetrievedSource[] {
  const queryTerms = expandedQueryTerms(query);
  const ranked = INDEX
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, query, queryTerms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.chunk.pdfPage - b.chunk.pdfPage);

  const selected: IndexedChunk[] = [];
  const usedPages = new Set<number>();
  for (const item of ranked) {
    if (usedPages.has(item.chunk.pdfPage)) continue;
    selected.push(item.chunk);
    usedPages.add(item.chunk.pdfPage);
    if (selected.length === limit) break;
  }

  if (selected.length === 0) {
    const fallbackPages = new Set([2, 11, 12]);
    INDEX.forEach((chunk) => {
      if (fallbackPages.has(chunk.pdfPage) && !usedPages.has(chunk.pdfPage)) {
        selected.push(chunk);
        usedPages.add(chunk.pdfPage);
      }
    });
  }

  return selected.slice(0, limit).map(toRetrievedSource);
}

export const thesisCorpusSource = corpus.source;
