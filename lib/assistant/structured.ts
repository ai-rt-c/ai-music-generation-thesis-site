import "server-only";

import papersJson from "@/data/papers.json";
import systemsJson from "@/data/systems.json";
import evaluationsJson from "@/data/evaluation.json";
import type { AssistantEvidenceSource, AssistantSourceLink } from "@/lib/assistant/types";
import type { Evaluation, Paper, Scores, System } from "@/lib/types";

const papers = papersJson as Paper[];
const systems = systemsJson as System[];
const evaluations = evaluationsJson as Evaluation[];

const systemById = new Map(systems.map((system) => [system.id, system]));
const evaluationById = new Map(evaluations.map((evaluation) => [evaluation.id, evaluation]));
const paperById = new Map(papers.map((paper) => [paper.id, paper]));

const QUERY_STOP_WORDS = new Set([
  "about", "all", "and", "are", "did", "from", "have", "into", "least", "list", "main", "music",
  "paper", "papers", "show", "study", "studies", "system", "systems", "that",
  "the", "their", "them", "these", "this", "used", "using", "what", "which", "with",
  "receive", "received", "score", "scored", "scores", "rating", "ratings",
  "generation", "مقاله", "مقالات", "سیستم", "سیستمها", "کدام", "چی", "چه",
]);

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[–—−/]/g, " ")
    .replace(/[^\p{L}\p{N}.+\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryTokens(query: string) {
  return normalize(query)
    .split(/[\s-]+/)
    .filter((token) => token.length > 2 && !QUERY_STOP_WORDS.has(token));
}

function truncate(value: string, length = 190) {
  if (value.length <= length) return value;
  const clipped = value.slice(0, length);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > length * 0.65 ? boundary : length).trimEnd()}…`;
}

function countBy<T>(values: T[], key: (value: T) => string) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    const item = key(value);
    counts.set(item, (counts.get(item) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function exactIds(query: string, availableIds: Set<string>) {
  const ids = new Set<string>();
  for (const match of query.matchAll(/\b(?:id|paper|study|system)\s*#?\s*(\d{1,3})\b/gi)) {
    if (availableIds.has(match[1])) ids.add(match[1]);
  }
  return ids;
}

function lexicalPaperMatches(query: string, limit = 10) {
  const tokens = queryTokens(query);
  if (!tokens.length) return [];
  return papers
    .map((paper) => {
      const words = (value: string) => new Set(normalize(value).split(/[\s-]+/).filter(Boolean));
      const title = words(paper.title);
      const authors = words(paper.authors);
      const method = words(paper.method);
      const dataset = words(`${paper.dataset} ${paper.datasetTags.join(" ")}`);
      const task = words(`${paper.task} ${paper.taskCategory}`);
      const architecture = words(`${paper.architectureFamily} ${paper.paradigmTags.join(" ")}`);
      const score = tokens.reduce((total, token) => total
        + (title.has(token) ? 5 : 0)
        + (architecture.has(token) ? 4 : 0)
        + (method.has(token) ? 3 : 0)
        + (dataset.has(token) ? 2 : 0)
        + (task.has(token) ? 2 : 0)
        + (authors.has(token) ? 1 : 0), 0);
      return { paper, score };
    })
    .filter(({ score }) => score >= 4)
    .sort((a, b) => b.score - a.score || (b.paper.year ?? 0) - (a.paper.year ?? 0))
    .slice(0, limit)
    .map(({ paper }) => paper);
}

type PaperFilter = {
  label: string;
  match: (paper: Paper) => boolean;
  explorerQuery?: string;
};

function architectureFilters(query: string): PaperFilter[] {
  const filters: PaperFilter[] = [];
  const options: Array<[RegExp, string, (paper: Paper) => boolean, string]> = [
    [/\btransformers?\b|\bllms?\b|large language model|ترنسفورمر|مدل زبانی بزرگ/i, "Architecture Family = Transformer / LLM", (paper) => /transformer|llm/i.test(paper.architectureFamily), "q=Transformer%20LLM"],
    [/\bdiffusion\b|دیفیوژن|انتشار/i, "Architecture Family = Diffusion", (paper) => paper.architectureFamily === "Diffusion", "paradigm=Diffusion"],
    [/\bvae\b|variational autoencoder/i, "Architecture Family = VAE", (paper) => paper.architectureFamily === "VAE", "paradigm=VAE"],
    [/\bgan\b|generative adversarial/i, "Architecture Family = GAN", (paper) => paper.architectureFamily === "GAN", "paradigm=GAN"],
    [/\brnn\b|\blstm\b|recurrent neural/i, "Architecture Family = RNN / LSTM", (paper) => paper.architectureFamily === "RNN / LSTM", "paradigm=RNN"],
    [/flow matching|\bflow\b/i, "Architecture Family = Flow matching", (paper) => paper.architectureFamily === "Flow matching", "paradigm=Flow%20matching"],
    [/hybrid|other architecture|هیبرید/i, "Architecture Family = Other / Hybrid", (paper) => paper.architectureFamily === "Other / Hybrid", "q=Other%20Hybrid"],
  ];
  options.forEach(([pattern, label, match, explorerQuery]) => {
    if (pattern.test(query)) filters.push({ label, match, explorerQuery });
  });
  return filters;
}

function taskFilters(query: string): PaperFilter[] {
  const filters: PaperFilter[] = [];
  const options: Array<[RegExp, Paper["taskCategory"]]> = [
    [/\barrangement\b|تنظیم/i, "Arrangement"],
    [/\borchestration\b|ارکستراسیون/i, "Orchestration"],
    [/audio generation|تولید صوت|تولید صدا/i, "Audio generation"],
    [/symbolic generation|تولید سمبولیک|تولید نمادین/i, "Symbolic generation"],
  ];
  options.forEach(([pattern, category]) => {
    if (pattern.test(query)) {
      filters.push({
        label: `Task = ${category}`,
        match: (paper) => paper.taskCategory === category,
        explorerQuery: `task=${encodeURIComponent(category)}`,
      });
    }
  });
  return filters;
}

function evaluationFilter(query: string): PaperFilter | null {
  if (/objective\s*(?:\+|and|&)\s*subjective|عینی.*ذهنی|ذهنی.*عینی/i.test(query)) {
    return { label: "Evaluation = Objective + subjective", match: (paper) => paper.evaluationCategory === "Objective + subjective" };
  }
  if (/subjective only|فقط ذهنی/i.test(query)) {
    return { label: "Evaluation = Subjective only", match: (paper) => paper.evaluationCategory === "Subjective only" };
  }
  if (/objective only|فقط عینی/i.test(query)) {
    return { label: "Evaluation = Objective only", match: (paper) => paper.evaluationCategory === "Objective only" };
  }
  if (/demonstration|qualitative only|demo only|نمایشی|فقط کیفی/i.test(query)) {
    return { label: "Evaluation = Demonstration / qualitative only", match: (paper) => paper.evaluationCategory === "Demonstration / qualitative only" };
  }
  return null;
}

const DATASET_ALIASES: Array<[RegExp, string]> = [
  [/\blakh\b/i, "Lakh MIDI"],
  [/\bpop909\b/i, "POP909"],
  [/\bmusiccaps\b/i, "MusicCaps"],
  [/\bslakh\b/i, "Slakh"],
  [/\bmaestro\b/i, "MAESTRO"],
  [/\bmusdb18\b/i, "MUSDB18"],
  [/\bfma\b/i, "FMA"],
  [/\bnsynth\b/i, "NSynth"],
];

function buildMasterSource(query: string): AssistantEvidenceSource | null {
  const normalizedQuery = normalize(query);
  const masterIntent = /\b(papers?|stud(?:y|ies)|corpus|dataset|architecture|method|evaluation|code|demo|doi|authors?)\b|مقاله|مطالعه|پژوهش|دیتاست|معماری|روش|ارزیابی|کد/i.test(query);
  const listeningOnlyIntent = /\b(listening|listener|rating|ratings|scor(?:e|ed|es|ing)|rubric|evaluator)\b|شنیدار|شنونده|امتیاز|ارزیاب/i.test(query);
  const filters: PaperFilter[] = [];
  const criteria: string[] = [];

  const ids = exactIds(query, new Set(papers.map((paper) => paper.id)));
  if (ids.size) {
    filters.push({ label: `ID = ${[...ids].join(", ")}`, match: (paper) => ids.has(paper.id) });
  }

  const architectures = architectureFilters(query);
  if (architectures.length) {
    filters.push({
      label: architectures.map((filter) => filter.label).join(" OR "),
      match: (paper) => architectures.some((filter) => filter.match(paper)),
      explorerQuery: architectures.length === 1 ? architectures[0].explorerQuery : undefined,
    });
  }

  const tasks = taskFilters(query);
  if (tasks.length) {
    filters.push({
      label: tasks.map((filter) => filter.label).join(" OR "),
      match: (paper) => tasks.some((filter) => filter.match(paper)),
      explorerQuery: tasks.length === 1 ? tasks[0].explorerQuery : undefined,
    });
  }

  const evaluation = evaluationFilter(query);
  if (evaluation) filters.push(evaluation);

  const years = [...new Set([...query.matchAll(/\b(20(?:20|21|22|23|24|25))\b/g)].map((match) => Number(match[1])))];
  if (years.length) filters.push({ label: `Year = ${years.join(" OR ")}`, match: (paper) => paper.year != null && years.includes(paper.year) });

  DATASET_ALIASES.forEach(([pattern, tag]) => {
    if (pattern.test(query)) {
      filters.push({
        label: `Dataset tag = ${tag}`,
        match: (paper) => paper.datasetTags.includes(tag),
        explorerQuery: `q=${encodeURIComponent(tag)}`,
      });
    }
  });

  if (/\b(?:with|had|has|have|provided|released) (?:available )?code\b|\b(?:available|provided|released|open[- ]source).{0,18}\bcode\b|\bcode\b.{0,18}(?:available|provided|released)|کد.*موجود|دارای کد/i.test(query)) {
    filters.push({ label: "Code available", match: (paper) => paper.hasCode });
  } else if (/\bwithout code\b|no code|بدون کد/i.test(query)) {
    filters.push({ label: "Code unavailable", match: (paper) => !paper.hasCode });
  }

  if (/\b(?:with|had|has|have|provided) (?:an? |available )?demo\b|demo available|دارای دمو|دموی موجود/i.test(query)) {
    filters.push({ label: "Demo available", match: (paper) => paper.hasDemo });
  } else if (/\bwithout (?:a )?demo\b|no demo|بدون دمو/i.test(query)) {
    filters.push({ label: "Demo unavailable", match: (paper) => !paper.hasDemo });
  }

  if (/in[- ]depth|27[- ]system|27 systems|زیرمجموعه.*27|۲۷ سیستم/i.test(query)) {
    filters.push({ label: "In-depth subset = Yes", match: (paper) => paper.inDepth, explorerQuery: "" });
  }

  let matches: Paper[] = [];
  if (filters.length) {
    matches = papers.filter((paper) => filters.every((filter) => filter.match(paper)));
    criteria.push(...filters.map((filter) => filter.label));
  } else {
    matches = lexicalPaperMatches(query);
  }

  const namedTitleMatch = matches.some((paper) => normalize(paper.title)
    .split(/[\s-]+/)
    .some((token) => token.length >= 4 && normalizedQuery.split(/[\s-]+/).includes(token)));
  if (listeningOnlyIntent && !masterIntent && !ids.size && filters.length === 0) return null;
  if (!masterIntent && !ids.size && !architectures.length && !tasks.length && !namedTitleMatch) {
    return null;
  }

  const architectureCounts = countBy(papers, (paper) => paper.architectureFamily)
    .map(([label, count]) => `${label}: ${count}`)
    .join("; ");
  const taskCounts = countBy(papers, (paper) => paper.taskCategory)
    .map(([label, count]) => `${label}: ${count}`)
    .join("; ");
  const evaluationCounts = countBy(papers, (paper) => paper.evaluationCategory)
    .map(([label, count]) => `${label}: ${count}`)
    .join("; ");

  const rowLines = matches.map((paper) => {
    const system = systemById.get(paper.id);
    const extra = [
      `architecture=${paper.architectureFamily}`,
      `task=${paper.taskCategory}`,
      `evaluation=${paper.evaluationCategory}`,
      `code=${paper.hasCode ? "yes" : "no"}`,
      `in-depth=${paper.inDepth ? "yes" : "no"}`,
    ];
    if (filters.some((filter) => filter.label.startsWith("Dataset"))) extra.push(`dataset=${truncate(paper.dataset, 120)}`);
    if (system) extra.push(`system=${system.name}`);
    return `ID ${paper.id} | ${paper.year ?? "year n/a"} | ${paper.title.replace(/\s+/g, " ")} | ${extra.join(" | ")}`;
  });

  const explorerQuery = filters.find((filter) => filter.explorerQuery !== undefined)?.explorerQuery;
  const exactSingle = matches.length === 1 && matches[0].inDepth;
  const href = exactSingle
    ? `/systems/${matches[0].id}`
    : explorerQuery
      ? `/explorer?${explorerQuery}&view=table`
      : matches.length === 27 && filters.some((filter) => filter.label.includes("In-depth"))
        ? "/systems"
        : "/explorer";
  const siteLinks: AssistantSourceLink[] = [{
    label: exactSingle ? `Open ${systemById.get(matches[0].id)?.name ?? "system"}` : "Explore the study records",
    href,
  }];

  const matchSummary = filters.length
    ? `${matches.length} of 107 rows match: ${criteria.join(" AND ")}.`
    : matches.length
      ? `${matches.length} most relevant rows were retrieved by title and field matching.`
      : "No individual row filter was requested; aggregate counts are supplied.";

  return {
    id: "master-dataset",
    citation: "M1",
    kind: "master",
    label: filters.length ? `107-study master table · ${matches.length} matched` : "107-study master table",
    href,
    excerpt: `${matchSummary} Exact row fields and counts are validated against the final 107-study workbook; the workbook itself is not published.`,
    siteLinks,
    context: [
      "AUTHORITATIVE STRUCTURED SOURCE: final 107-study master table.",
      "Use this source for exact study IDs, titles, years, architecture families, tasks, datasets, evaluation categories, code/demo availability, and counts.",
      matchSummary,
      `Architecture-family totals — ${architectureCounts}.`,
      `Task totals — ${taskCounts}.`,
      `Evaluation totals — ${evaluationCounts}.`,
      `Other totals — code available: ${papers.filter((paper) => paper.hasCode).length}; demo available: ${papers.filter((paper) => paper.hasDemo).length}; in-depth subset: ${papers.filter((paper) => paper.inDepth).length}.`,
      rowLines.length ? "Matching rows:\n" + rowLines.join("\n") : "",
    ].filter(Boolean).join("\n"),
  };
}

type ListeningRecord = {
  system: System;
  evaluation: Evaluation;
  paper: Paper;
};

const listeningRecords: ListeningRecord[] = systems.flatMap((system) => {
  const evaluation = evaluationById.get(system.id);
  const paper = paperById.get(system.paperId);
  return evaluation && paper ? [{ system, evaluation, paper }] : [];
});

const DIMENSION_PATTERNS: Array<[RegExp, keyof Scores, string]> = [
  [/\boverall\b|holistic|کل[یی]/i, "overall", "Overall"],
  [/\bquality\b|rendering|کیفیت/i, "quality", "Audio / rendering quality"],
  [/\bmelod(?:y|ic)\b|ملود/i, "melody", "Melodic coherence"],
  [/\bharmon(?:y|ic)\b|هارمون/i, "harmony", "Harmonic coherence"],
  [/\brhythm(?:ic)?\b|ریتم/i, "rhythm", "Rhythmic stability"],
  [/long[- ]term structure|\bstructure\b|ساختار/i, "structure", "Long-term structure"],
  [/\bcontrol\b|adherence|کنترل/i, "control", "Condition / control adherence"],
  [/naturalness|musicality|طبیعی|موسیقایی/i, "naturalness", "Naturalness / musicality"],
];

function meanScore(key: keyof Scores) {
  const values = evaluations.map((evaluation) => evaluation.scores[key]).filter((value): value is number => typeof value === "number");
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildListeningSource(query: string): AssistantEvidenceSource | null {
  const listeningIntent = /\b(listening|listener|rating|ratings|scor(?:e|ed|es|ing)|rubric|evaluator|pilot|top|best|leader)\b|شنیدار|شنونده|امتیاز|ارزیاب|برتر|بهترین/i.test(query);
  const normalizedQuery = normalize(query);
  const ids = exactIds(query, new Set(systems.map((system) => system.id)));
  const namedRecords = listeningRecords.filter(({ system }) => {
    const name = normalize(system.name);
    return name.length >= 4 && normalizedQuery.includes(name);
  });

  const dimensionMatch = DIMENSION_PATTERNS.find(([pattern]) => pattern.test(query));
  const dimension: keyof Scores = dimensionMatch?.[1] ?? "overall";
  const dimensionLabel = dimensionMatch?.[2] ?? "Overall";
  const thresholdMatch = query.match(/(?:at least|minimum|>=|≥|over|above|بیشتر از|حداقل)\s*(\d(?:\.\d+)?)/i)
    ?? query.match(/(\d(?:\.\d+)?)\s*\/\s*5/i);
  const threshold = thresholdMatch ? Number(thresholdMatch[1]) : null;
  const asksForTop = /\b(top|best|leader|leaders|highest)\b|بهترین|برتر|بالاترین/i.test(query);

  let matches = [...listeningRecords];
  const criteria: string[] = [];
  if (ids.size) {
    matches = matches.filter(({ system }) => ids.has(system.id));
    criteria.push(`ID = ${[...ids].join(", ")}`);
  }
  if (namedRecords.length) {
    const namedIds = new Set(namedRecords.map(({ system }) => system.id));
    matches = matches.filter(({ system }) => namedIds.has(system.id));
    criteria.push(`System = ${namedRecords.map(({ system }) => system.name).join(" OR ")}`);
  }

  const architectures = architectureFilters(query);
  if (architectures.length) {
    matches = matches.filter(({ paper }) => architectures.some((filter) => filter.match(paper)));
    criteria.push(architectures.map((filter) => filter.label).join(" OR "));
  }

  if (threshold != null && /score|scored|rating|rated|\/\s*5|امتیاز|نمره/i.test(query)) {
    matches = matches.filter(({ evaluation }) => (evaluation.scores[dimension] ?? -Infinity) >= threshold);
    criteria.push(`${dimensionLabel} >= ${threshold}/5`);
  } else if (asksForTop) {
    matches = matches.filter(({ evaluation }) => (evaluation.scores.overall ?? -Infinity) >= 4);
    criteria.push("Overall >= 4/5");
  }

  if (!listeningIntent && !ids.size && !namedRecords.length) return null;

  matches.sort((a, b) =>
    (b.evaluation.scores[dimension] ?? -Infinity) - (a.evaluation.scores[dimension] ?? -Infinity)
    || (b.evaluation.scores.overall ?? -Infinity) - (a.evaluation.scores.overall ?? -Infinity)
    || a.system.name.localeCompare(b.system.name));

  const shouldIncludeRows = criteria.length > 0 || asksForTop || namedRecords.length > 0;
  const selectedRows = shouldIncludeRows ? matches : [];
  const rowLines = selectedRows.map(({ system, evaluation, paper }) => {
    const scores = Object.entries(evaluation.scores)
      .map(([key, value]) => `${key}=${value == null ? "N/A" : value}`)
      .join(", ");
    return [
      `ID ${system.id} | ${system.name} | ${system.year ?? "year n/a"} | ${paper.architectureFamily} | ${system.taskCategory}`,
      `ratings: ${scores}`,
      `observed strengths: ${evaluation.strengths.join("; ") || "none recorded"}`,
      `observed limitations: ${evaluation.weaknesses.join("; ") || "none recorded"}`,
      `listening note: ${truncate(evaluation.criticalListening, namedRecords.length === 1 ? 620 : 260)}`,
      evaluation.reportedMetrics ? `paper-reported metrics: ${truncate(evaluation.reportedMetrics, 240)}` : "",
      evaluation.reportedResult ? `paper-reported headline: ${truncate(evaluation.reportedResult, 220)}` : "",
    ].filter(Boolean).join(" | ");
  });

  const exactSingle = selectedRows.length === 1;
  const isFeatured = criteria.some((criterion) => criterion === "Overall >= 4/5");
  const href = exactSingle ? `/systems/${selectedRows[0].system.id}` : isFeatured ? "/top-systems" : "/systems";
  const matchSummary = criteria.length
    ? `${selectedRows.length} of 27 systems match: ${criteria.join(" AND ")}.`
    : "The source contains all 27 systems; no row-level score filter was requested.";

  return {
    id: "listening-dataset",
    citation: "L1",
    kind: "listening",
    label: criteria.length ? `27-system listening analysis · ${selectedRows.length} matched` : "27-system listening analysis",
    href,
    excerpt: `${matchSummary} Scores and IDs are validated against the final 27-system workbook; the workbook itself is not published.`,
    siteLinks: [{
      label: exactSingle ? `Open ${selectedRows[0].system.name}` : isFeatured ? "Open the top-systems view" : "Browse the 27 systems",
      href,
    }],
    context: [
      "AUTHORITATIVE STRUCTURED SOURCE: final 27-system pilot exploratory listening analysis.",
      "Use this source for exact system IDs, eight evaluator ratings, selected-system comparisons, listening notes, and concise paper-evidence summaries.",
      "Caution: these are ratings by one non-musician evaluator on a common 1–5 rubric, not a population-level listening experiment. Overall is a separate holistic rating, not a calculated mean.",
      matchSummary,
      `Dimension means across available ratings — quality ${meanScore("quality").toFixed(2)}; melody ${meanScore("melody").toFixed(2)}; harmony ${meanScore("harmony").toFixed(2)}; rhythm ${meanScore("rhythm").toFixed(2)}; structure ${meanScore("structure").toFixed(2)}; control ${meanScore("control").toFixed(2)}; naturalness ${meanScore("naturalness").toFixed(2)}; overall ${meanScore("overall").toFixed(2)}.`,
      rowLines.length ? "Matching rows:\n" + rowLines.join("\n") : "",
    ].filter(Boolean).join("\n"),
  };
}

export function retrieveStructuredContext(query: string): AssistantEvidenceSource[] {
  return [buildMasterSource(query), buildListeningSource(query)]
    .filter((source): source is AssistantEvidenceSource => source !== null);
}

export function wantsExpandedAnswer(query: string) {
  return /\b(list all|full list|every paper|every study|in detail|detailed|elaborate)\b|همه.*(?:مقاله|مطالعه|سیستم)|فهرست کامل|با جزئیات|کامل توضیح/i.test(query);
}
