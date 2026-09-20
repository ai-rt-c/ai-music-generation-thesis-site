import "server-only";

import contentJson from "@/data/content.json";
import evaluationsJson from "@/data/evaluation.json";
import papersJson from "@/data/papers.json";
import systemsJson from "@/data/systems.json";
import type { AssistantSource, AssistantSourceLink } from "@/lib/assistant/types";
import type { Evaluation, Paper, Scores, System } from "@/lib/types";

const content = contentJson;
const papers = papersJson as Paper[];
const systems = systemsJson as System[];
const evaluations = evaluationsJson as Evaluation[];

const paperById = new Map(papers.map((paper) => [paper.id, paper]));
const systemById = new Map(systems.map((system) => [system.id, system]));
const evaluationById = new Map(evaluations.map((evaluation) => [evaluation.id, evaluation]));
const knownIds = new Set([...papers.map((paper) => paper.id), ...systems.map((system) => system.id)]);

export interface DeterministicAnswer {
  answer: string;
  sources: AssistantSource[];
}

type RecordFilter = {
  label: string;
  match: (paper: Paper) => boolean;
  query?: [string, string];
};

const SYSTEM_ALIASES: Record<string, string[]> = {
  "57": ["getmusic", "گت موزیک"],
  "316": ["chatmusician", "chat musician", "چت موزیسین"],
  "76": ["musiclm", "music lm", "موزیک ال ام"],
  "329": ["musicgen", "music gen", "simple and controllable music generation", "موزیک جن"],
  "313": ["symphonynet", "symphony net", "سیمفونی نت"],
  "357": ["orchidea"],
  "327": ["whole song hierarchical", "whole-song hierarchical"],
  "19": ["structured multi track", "structured multi-track"],
  "352": ["stemgen", "stem gen"],
  "346": ["accomontage"],
  "67": ["midi-gpt", "midi gpt"],
  "345": ["popmag"],
  "324": ["musecoco"],
  "315": ["figaro"],
  "312": ["museformer"],
  "171": ["theme transformer"],
  "309": ["compound word transformer"],
  "89": ["pop music transformer"],
  "92": ["jukebox"],
  "328": ["audiolm", "audio lm"],
  "58": ["noise2music", "noise 2 music"],
  "378": ["mustango"],
  "349": ["singsong", "sing song"],
  "259": ["meteor"],
  "74": ["mupt"],
};

const DISPLAY_NAMES: Record<string, string> = {
  "19": "Structured Multi-Track Arrangement",
  "327": "Whole-Song Hierarchical Generation",
  "313": "SymphonyNet",
  "329": "MusicGen",
  "357": "Orchidea",
};

const DIMENSIONS: Array<[RegExp, keyof Scores, string]> = [
  [/\boverall\b|holistic|کلی/i, "overall", "Overall"],
  [/\bquality\b|rendering|fidelity|کیفیت/i, "quality", "audio / rendering quality"],
  [/\bmelod(?:y|ic)\b|ملود/i, "melody", "melodic coherence"],
  [/\bharmon(?:y|ic)\b|هارمون/i, "harmony", "harmonic coherence"],
  [/\brhythm(?:ic)?\b|ریتم/i, "rhythm", "rhythmic stability"],
  [/long[- ]term structure|\bstructure\b|ساختار/i, "structure", "long-term structure"],
  [/\bcontrol\b|adherence|کنترل/i, "control", "condition / control adherence"],
  [/naturalness|musicality|طبیعی|موسیقایی/i, "naturalness", "naturalness / musicality"],
];

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[–—−_/]/g, " ")
    .replace(/[^\p{L}\p{N}.+\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatScore(value: number | null | undefined) {
  return typeof value === "number" ? `${value.toFixed(1)}/5` : "not rated";
}

function cleanTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function withIndefiniteArticle(value: string) {
  return `${/^[aeiou]/i.test(value) ? "an" : "a"} ${value}`;
}

function readableList(values: string[]) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function source(
  id: string,
  kind: AssistantSource["kind"],
  label: string,
  excerpt: string,
  href?: string,
  siteLinks: AssistantSourceLink[] = [],
): AssistantSource {
  return { id, citation: label, kind, label, href, excerpt, siteLinks };
}

function thesisSource(id: string, label: string, excerpt: string, href: string) {
  return source(id, "thesis", label, excerpt, href, [{ label: `Open ${label}`, href }]);
}

function masterSource(label: string, excerpt: string, href?: string) {
  return source(
    `master-${normalize(label).replace(/\s+/g, "-")}`,
    "master",
    label,
    excerpt,
    href,
    href ? [{ label: "View the matching study records", href }] : [],
  );
}

function listeningSource(label: string, excerpt: string, href?: string) {
  return source(
    `listening-${normalize(label).replace(/\s+/g, "-")}`,
    "listening",
    label,
    excerpt,
    href,
    href ? [{ label: "Open the relevant listening results", href }] : [],
  );
}

function requestedLimit(query: string) {
  const numeric = query.match(/(?:only|just|give|show|list|example(?:s)?)[^\d]{0,12}(\d{1,2})/i)
    ?? query.match(/(\d{1,2})\s+(?:example|paper|study|system)/i);
  if (numeric) return Math.max(1, Math.min(10, Number(numeric[1])));
  const normalized = normalize(query);
  for (const [word, value] of Object.entries(NUMBER_WORDS)) {
    if (new RegExp(`\\b(?:only |just |give |show |list )?(?:${word})\\s+(?:example|paper|study|system)`).test(normalized)) {
      return value;
    }
  }
  return null;
}

function isCountQuestion(query: string) {
  return /\bhow many\b|\bnumber of\b|\bcount\b|چند|تعداد/i.test(query);
}

function explicitIds(query: string) {
  return [...query.matchAll(/\b(?:id|study|paper|system)\s*#?\s*(\d{1,4})\b/gi)].map((match) => match[1]);
}

function mentionedSystems(query: string) {
  const normalized = normalize(query);
  return systems.filter((system) => {
    const aliases = [normalize(system.name), ...(SYSTEM_ALIASES[system.id] ?? []).map(normalize)];
    return aliases.some((alias) => alias.length >= 4 && normalized.includes(alias));
  });
}

function mentionedPaper(query: string) {
  const generic = new Set([
    "about", "music", "generation", "system", "paper", "study", "model", "transformer",
    "diffusion", "method", "which", "what", "tell", "using", "based",
  ]);
  const tokens = normalize(query).split(/\s+/).filter((token) => token.length >= 5 && !generic.has(token));
  if (!tokens.length) return null;
  const matches = papers
    .map((paper) => {
      const titleTokens = new Set(normalize(paper.title).split(/\s+/));
      return { paper, score: tokens.filter((token) => titleTokens.has(token)).length };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
  if (!matches.length || (matches[1] && matches[1].score === matches[0].score)) return null;
  return matches[0].paper;
}

function clearOutOfScope(query: string) {
  return /\b(food|eat|recipe|meal|weather|temperature|forecast|football|soccer|politics|president|stock|currency|horoscope|joke)\b|غذا|بخورم|هوا|آب.?وهوا|فوتبال|سیاست|جوک/i.test(query);
}

function hasThesisSignal(query: string) {
  return /\b(thesis|review|paper|study|studies|corpus|system|dataset|music|ai|generation|arrangement|orchestration|transformer|diffusion|vae|gan|evaluation|score|rating|control|structure|method|methodology|contribution|limitation|prisma|listener|rubric|architecture|code|demo|midi|audio)\b|تز|پایان.?نامه|مقاله|مطالعه|سیستم|دیتاست|موسیقی|هوش مصنوعی|تولید|تنظیم|ارکستراسیون|ترنسفورمر|دیفیوژن|ارزیابی|امتیاز|کنترل|ساختار|روش|محدودیت|دستاورد|شنیدار/i.test(query);
}

function outOfScopeAnswer(): DeterministicAnswer {
  return {
    answer: "I can answer only questions about this thesis, its 107-study review, and the 27-system listening analysis.",
    sources: [],
  };
}

function idAnswer(query: string): DeterministicAnswer | null {
  const ids = explicitIds(query);
  if (!ids.length) return null;
  const missing = ids.filter((id) => !knownIds.has(id));
  if (missing.length) {
    return {
      answer: `No study or system with ID ${readableList(missing)} appears in the verified thesis datasets.`,
      sources: [],
    };
  }
  if (ids.length !== 1) return null;
  const id = ids[0];
  const paper = paperById.get(id);
  const system = systemById.get(id);
  const evaluation = evaluationById.get(id);
  if (!paper) return null;
  const facts = [
    `${cleanTitle(paper.title)} (ID ${id}, ${paper.year ?? "year not reported"})`,
    `${paper.taskCategory}; ${paper.architectureFamily}`,
    `evaluation: ${paper.evaluationCategory}`,
    `code ${paper.hasCode ? "available" : "not reported as available"}`,
  ];
  if (system && evaluation) {
    facts.push(`pilot Overall ${formatScore(evaluation.scores.overall)}`);
  }
  const href = system ? `/systems/${system.id}` : `/explorer?q=${encodeURIComponent(paper.title)}&view=table`;
  return {
    answer: `${facts.join("; ")}.`,
    sources: [masterSource("Verified study record", `Exact row for study ID ${id}.`, href)],
  };
}

function specialNarrativeAnswer(query: string): DeterministicAnswer | null {
  if (/what is (?:the |this )?thesis about|(?:overview|summary) of (?:the |this )?thesis|tell me about (?:the |this )?thesis|main aim|research aim|موضوع.*تز|هدف.*تز/i.test(query)) {
    return {
      answer: "The thesis is a PRISMA-guided systematic review of AI methods for music generation, arrangement, and orchestration from 2020–2025. It organises 107 primary studies into an extended taxonomy, synthesises research trends, and examines a purposive 27-system subset through a pilot exploratory listening analysis.",
      sources: [thesisSource("thesis-overview", "About the thesis", content.aboutThesis.abstract, "/about-thesis")],
    };
  }

  if (/difference|distinction|differ|فرق|تفاوت/i.test(query)
      && /107|primary corpus|full corpus|۱۰۷/i.test(query)
      && /27|subset|۲۷/i.test(query)) {
    return {
      answer: "The 107-study corpus is the complete set of primary studies that passed the PRISMA eligibility process. The 27-system set is a purposive subset chosen from that corpus for deeper, output-based analysis using task coverage, influence, architectural diversity, assessable demonstrations, and temporal spread. It is neither a second eligibility stage nor a representative sample of all 107 studies.",
      sources: [
        thesisSource("method-107-27", "Methodology", content.systematicReview.blocks[2].body, "/methodology"),
        thesisSource("listening-27", "Listening evaluation", content.listeningEvaluation.caveat, "/listening-evaluation"),
      ],
    };
  }

  if (/why|reason|underrepresented|least[- ]served|چرا|دلیل/i.test(query) && /orchestration|ارکستراسیون/i.test(query)) {
    return {
      answer: "Orchestration is the least-represented task: 6 of 107 studies. The thesis treats two explanations as plausible rather than proven: scarce large paired datasets, and the difficulty of modelling instrument interdependence and timbre with simple tokenisations. That combination makes orchestration harder to scale than general music generation.",
      sources: [thesisSource(
        "orchestration-gap",
        "Future directions: the orchestration gap",
        content.futureDirections.blocks[0].body,
        "/future-directions",
      )],
    };
  }

  if (/\bcontribution|\bcontributions|novelty|دستاورد|نوآوری|سهم/i.test(query)) {
    return {
      answer: `The thesis makes four main contributions:\n• ${content.aboutThesis.contributions.join("\n• ")}`,
      sources: [thesisSource("contributions", "About the thesis", content.aboutThesis.contributions.join(" "), "/about-thesis")],
    };
  }

  if (/objective.*subjective|subjective.*objective|عینی.*ذهنی|ذهنی.*عینی/i.test(query)
      && /distinguish|difference|classified|counted|rule|فرق|تفاوت|تشخیص/i.test(query)) {
    return {
      answer: "Objective evidence consists of computed metrics or measurable task results. Subjective evidence requires listeners to provide scores or structured judgements. A demonstration, audio example, or qualitative author description alone was not counted as subjective evaluation. Using that rule, the 107 studies divide into 67 objective + subjective, 32 objective only, 3 subjective only, and 5 demonstration / qualitative only.",
      sources: [thesisSource("evaluation-rule", "Reported evaluation evidence", content.discussion.rq[1].a, "/discussion")],
    };
  }

  if (/how (?:were|was).*(?:107|stud)|selection process|selected.*(?:stud|paper)|prisma|غربال|چطور.*انتخاب|روش.*انتخاب/i.test(query)) {
    return {
      answer: "The search identified 4,521 records across six sources; 1,083 were exportable to Zotero. After 300 duplicates, 783 unique records remained. Title screening retained 383, abstract screening 146, and full-text review 113. One duplicate publication was consolidated and five ineligible representation-learning studies were moved to background literature, leaving 107 primary studies.",
      sources: [thesisSource("study-selection", "Methodology: study selection", content.systematicReview.blocks[1].body, "/methodology")],
    };
  }

  if (/limitation|limitations|weakness|bias|محدودیت/i.test(query) && /listening|listener|27|pilot|شنیدار|شنونده|۲۷/i.test(query)) {
    return {
      answer: "The listening analysis is exploratory, not a generalisable user study. Its main limitations are one informed author-evaluator, no blinding or randomisation, author-curated outputs, a non-standardised playback setting, incomplete session-level logging, and a purposive 27-system sample. The scores therefore describe the examined examples, not typical system performance or listener preferences.",
      sources: [
        thesisSource("listening-limitations", "Listening evaluation", content.listeningEvaluation.caveat, "/listening-evaluation"),
        thesisSource("review-limitations", "Discussion and limitations", content.discussion.limitationsReview, "/discussion"),
      ],
    };
  }

  if (/limitation|limitations|weakness|bias|محدودیت/i.test(query)) {
    return {
      answer: "The main review limitations are single-reviewer screening and synthesis, export restrictions that reduced 4,521 identified records to 1,083 managed records, heavy manual synchronisation across the 107-study and 27-system materials, and a residual risk of minor coding or transcription errors. The review is broad but not exhaustive, and the 27-system subset is purposive rather than representative.",
      sources: [thesisSource("review-limitations", "Discussion and limitations", content.discussion.limitationsReview, "/discussion")],
    };
  }

  if (/weakest|lowest.*dimension|dimension.*lowest|ضعیف.?ترین|کمترین.*بعد/i.test(query)) {
    const structureMean = meanScore("structure");
    return {
      answer: `Long-term structure was the weakest listening dimension, with a mean of ${structureMean.toFixed(2)}/5 across the available ratings. This supports the thesis's conclusion that explicit planning and hierarchical structure remain important differentiators.`,
      sources: [listeningSource("Verified 27-system listening data", "Mean calculated from the final long-term-structure ratings.", "/listening-evaluation")],
    };
  }

  if (/dominant trend|main trend|dominant method|research trend|روند|روش.*غالب/i.test(query)) {
    return {
      answer: "The corpus shows a shift from representation engineering (2020–2022), through competition between Transformers and diffusion plus text interfaces (2023), to controllable diffusion, foundation models, and stronger evaluation focus (2024–2025). Transformers/LLMs are the largest architecture family (41 studies), followed by diffusion (32).",
      sources: [thesisSource("research-trends", "Research trends", content.discussion.rq[0].a, "/trends")],
    };
  }

  if (/future direction|future work|what next|recommendation|آینده|پیشنهاد/i.test(query)) {
    return {
      answer: "The thesis prioritises five directions:\n• better orchestration datasets and models\n• controllable long-form structure\n• preference-aligned objectives\n• standardised, culturally broader evaluation\n• more convincing and intelligible sung vocals",
      sources: [thesisSource("future-directions", "Future directions", content.futureDirections.intro, "/future-directions")],
    };
  }

  if (/\bmidi\b|میدی/i.test(query)) {
    return {
      answer: "Yes. MIDI and other symbolic representations are a major part of the review: 59 of the 107 studies are classified in the Symbolic domain. They cover symbolic generation, arrangement, control, and structural evaluation; the 27-system subset also includes multiple MIDI-based systems.",
      sources: [masterSource("Verified 107-study data", "59 studies are classified in the Symbolic domain.", "/explorer?domain=Symbolic&view=table")],
    };
  }

  if (/most promising|what distinguished|distinguish.*top|why.*top|factors?.*effective|امیدبخش|متمایز/i.test(query)) {
    return {
      answer: "The thesis identifies nine systems at Overall ≥ 4.0/5, but treats this as an exploratory group rather than a definitive leaderboard. Two recurring factors distinguished them: verifiable adherence to the requested control and explicit long-term structural planning. Audio quality was generally high and therefore less discriminating.",
      sources: [thesisSource("promising-systems", "Discussion: promising approaches", content.discussion.rq[2].a, "/top-systems")],
    };
  }

  if (/\b[t m l]\s*\d+\b|\b[tml]\d+\b/i.test(query) && /what|mean|چی|یعنی/i.test(query)) {
    return {
      answer: "Those were internal retrieval labels used by an earlier preview. They were not study IDs and should not have appeared in the interface. The revised assistant uses plain evidence names such as “Verified 107-study data” and “Thesis p. 77” instead.",
      sources: [],
    };
  }

  return null;
}

function meanScore(key: keyof Scores) {
  const values = evaluations
    .map((evaluation) => evaluation.scores[key])
    .filter((value): value is number => typeof value === "number");
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function scoreAnswer(query: string): DeterministicAnswer | null {
  const dimensionEntry = DIMENSIONS.find(([pattern]) => pattern.test(query));
  const dimension = dimensionEntry?.[1] ?? "overall";
  const dimensionLabel = dimensionEntry?.[2] ?? "Overall";
  const thresholdMatch = query.match(/(?:at least|minimum|>=|≥|over|above|حداقل|بیشتر از)\s*(\d(?:\.\d+)?)/i)
    ?? query.match(/(\d(?:\.\d+)?)\s*\/\s*5/i);
  const highest = /\bhighest\b|\bbest\b|بالاترین|بهترین/i.test(query);
  const scoreIntent = /score|scored|rating|rated|overall|highest|best|top|امتیاز|نمره|برتر|بهترین/i.test(query);
  if (!scoreIntent || (!thresholdMatch && !highest)) return null;

  let matches = systems.flatMap((system) => {
    const evaluation = evaluationById.get(system.id);
    return evaluation ? [{ system, evaluation }] : [];
  });
  let criterion: string;
  if (highest) {
    const max = Math.max(...matches.map(({ evaluation }) => evaluation.scores[dimension] ?? -Infinity));
    matches = matches.filter(({ evaluation }) => evaluation.scores[dimension] === max);
    criterion = `the highest ${dimensionLabel} score (${max.toFixed(1)}/5)`;
  } else {
    const threshold = Number(thresholdMatch![1]);
    matches = matches.filter(({ evaluation }) => (evaluation.scores[dimension] ?? -Infinity) >= threshold);
    criterion = `${dimensionLabel} ≥ ${threshold.toFixed(1)}/5`;
  }
  matches.sort((a, b) =>
    (b.evaluation.scores[dimension] ?? -Infinity) - (a.evaluation.scores[dimension] ?? -Infinity)
    || a.system.name.localeCompare(b.system.name));

  if (isCountQuestion(query)) {
    return {
      answer: `${matches.length} of the 27 systems meet ${criterion}.`,
      sources: [listeningSource("Verified 27-system listening data", `Exact count for ${criterion}.`, "/top-systems")],
    };
  }
  const list = matches.map(({ system, evaluation }) => `${displayName(system)} (${formatScore(evaluation.scores[dimension])})`);
  return {
    answer: `${matches.length} systems meet ${criterion}: ${readableList(list)}.`,
    sources: [listeningSource("Verified 27-system listening data", `Exact systems and ${dimensionLabel} ratings.`, "/top-systems")],
  };
}

function displayName(system: System) {
  if (DISPLAY_NAMES[system.id]) return DISPLAY_NAMES[system.id];
  const parenthetical = system.name.match(/\(([^)]+)\)\s*$/)?.[1];
  return parenthetical && parenthetical.length < system.name.length / 2 ? parenthetical : system.name;
}

function comparisonAnswer(query: string): DeterministicAnswer | null {
  const mentioned = mentionedSystems(query);
  const comparisonIntent = /compare|comparison|versus|\bvs\.?\b|difference between|مقایسه|تفاوت/i.test(query);
  if (!comparisonIntent || mentioned.length < 2) return null;

  const requestedDimensions = DIMENSIONS.filter(([pattern]) => pattern.test(query));
  const dimensions = requestedDimensions.length
    ? requestedDimensions.map(([, key, label]) => [key, label] as const)
    : [["overall", "Overall"], ["control", "control"], ["structure", "long-term structure"]] as const;

  const lines = mentioned.slice(0, 4).flatMap((system) => {
    const evaluation = evaluationById.get(system.id);
    if (!evaluation) return [];
    const values = dimensions.map(([key, label]) => `${label} ${formatScore(evaluation.scores[key])}`);
    return [`• ${displayName(system)} — ${values.join("; ")}.`];
  });
  const links = mentioned.slice(0, 4).map((system) => ({ label: `Open ${displayName(system)}`, href: `/systems/${system.id}` }));
  return {
    answer: `${lines.join("\n")}\nThese are exploratory single-evaluator ratings, not definitive performance rankings.`,
    sources: [source(
      "listening-comparison",
      "listening",
      "Verified system comparison",
      "Exact ratings from the final 27-system analysis.",
      undefined,
      links,
    )],
  };
}

function namedRecordAnswer(query: string): DeterministicAnswer | null {
  const mentioned = mentionedSystems(query);
  if (mentioned.length === 1) {
    const system = mentioned[0];
    const paper = paperById.get(system.paperId);
    const evaluation = evaluationById.get(system.id);
    if (!paper || !evaluation) return null;
    return {
      answer: `${displayName(system)} (ID ${system.id}, ${system.year ?? "year not reported"}) is ${withIndefiniteArticle(system.taskCategory.toLowerCase())} system using a ${system.paradigm ?? paper.architectureFamily} approach. In the pilot analysis it received Overall ${formatScore(evaluation.scores.overall)}, control ${formatScore(evaluation.scores.control)}, and long-term structure ${formatScore(evaluation.scores.structure)}. These ratings describe the examined output, not universal performance.`,
      sources: [listeningSource(`Verified record: ${displayName(system)}`, "System metadata and pilot listening ratings.", `/systems/${system.id}`)],
    };
  }

  const paper = mentionedPaper(query);
  if (!paper) {
    const explicitlyNamed = query.match(
      /\b(?:system|model|paper|study)\s+(?:called|named)\s+["“”']?([A-Za-z][A-Za-z0-9-]{2,})/,
    )?.[1];
    if (explicitlyNamed) {
      return {
        answer: `${explicitlyNamed} does not match a named study or system in the verified thesis datasets.`,
        sources: [],
      };
    }
    const modelLike = query.match(/\b[A-Za-z][A-Za-z0-9-]*(?:GPT|LM|Gen|Net|former)\b/g)
      ?.filter((name) => !/^(transformer|llm)$/i.test(name));
    if (modelLike?.length) {
      return {
        answer: `${readableList(modelLike)} does not match a named study or system in the verified thesis datasets.`,
        sources: [],
      };
    }
    return null;
  }
  const href = `/explorer?q=${encodeURIComponent(paper.title)}&view=table`;
  return {
    answer: `${cleanTitle(paper.title)} (ID ${paper.id}, ${paper.year ?? "year not reported"}) is classified as ${paper.taskCategory}, with architecture family ${paper.architectureFamily}. Its evaluation category is ${paper.evaluationCategory}, and code is ${paper.hasCode ? "available" : "not reported as available"}.`,
    sources: [masterSource("Verified study record", `Exact row for ${paper.title}.`, href)],
  };
}

function buildMasterFilters(query: string) {
  const filters: RecordFilter[] = [];
  const add = (pattern: RegExp, filter: RecordFilter) => {
    if (pattern.test(query)) filters.push(filter);
  };

  add(/\btransformers?\b|\bllms?\b|large language model|ترنسفورمر/i, {
    label: "Transformer / LLM architecture",
    match: (paper) => /transformer|llm/i.test(paper.architectureFamily),
    query: ["paradigm", "Transformer"],
  });
  add(/\bdiffusion\b|دیفیوژن|انتشار/i, {
    label: "Diffusion architecture", match: (paper) => paper.architectureFamily === "Diffusion", query: ["paradigm", "Diffusion"],
  });
  add(/\bvae\b|variational autoencoder/i, {
    label: "VAE architecture", match: (paper) => paper.architectureFamily === "VAE", query: ["paradigm", "VAE"],
  });
  add(/\bgan\b|generative adversarial/i, {
    label: "GAN architecture", match: (paper) => paper.architectureFamily === "GAN", query: ["paradigm", "GAN"],
  });
  add(/\barrangement\b|تنظیم/i, {
    label: "arrangement task", match: (paper) => paper.taskCategory === "Arrangement", query: ["task", "Arrangement"],
  });
  add(/\borchestration\b|ارکستراسیون/i, {
    label: "orchestration task", match: (paper) => paper.taskCategory === "Orchestration", query: ["task", "Orchestration"],
  });
  add(/audio generation|تولید صوت|تولید صدا/i, {
    label: "audio-generation task", match: (paper) => paper.taskCategory === "Audio generation", query: ["task", "Audio generation"],
  });
  add(/symbolic generation|تولید نمادین|تولید سمبولیک/i, {
    label: "symbolic-generation task", match: (paper) => paper.taskCategory === "Symbolic generation", query: ["task", "Symbolic generation"],
  });

  const datasets: Array<[RegExp, string]> = [
    [/\blakh\b/i, "Lakh MIDI"], [/\bpop909\b/i, "POP909"], [/\bmusiccaps\b/i, "MusicCaps"],
    [/\bslakh\b/i, "Slakh"], [/\bmaestro\b/i, "MAESTRO"], [/\bmusdb18\b/i, "MUSDB18"],
    [/\bnsynth\b/i, "NSynth"],
  ];
  datasets.forEach(([pattern, tag]) => add(pattern, {
    label: `${tag} dataset`, match: (paper) => paper.datasetTags.includes(tag), query: ["q", tag],
  }));

  add(/(?:available|provided|released|open[- ]source).{0,20}\bcode\b|\bcode\b.{0,20}(?:available|provided|released)|دارای کد|کد.*موجود/i, {
    label: "available code", match: (paper) => paper.hasCode,
  });
  add(/\bwithout code\b|\bno code\b|بدون کد/i, {
    label: "no available code", match: (paper) => !paper.hasCode,
  });
  add(/objective\s*(?:\+|and|&)\s*subjective|عینی.*ذهنی|ذهنی.*عینی/i, {
    label: "objective + subjective evaluation", match: (paper) => paper.evaluationCategory === "Objective + subjective", query: ["q", "Objective + subjective"],
  });
  add(/objective only|فقط عینی/i, {
    label: "objective-only evaluation", match: (paper) => paper.evaluationCategory === "Objective only", query: ["q", "Objective only"],
  });
  add(/subjective only|فقط ذهنی/i, {
    label: "subjective-only evaluation", match: (paper) => paper.evaluationCategory === "Subjective only", query: ["q", "Subjective only"],
  });
  add(/demonstration|qualitative only|demo only|فقط کیفی/i, {
    label: "demonstration / qualitative-only evaluation", match: (paper) => paper.evaluationCategory === "Demonstration / qualitative only", query: ["q", "Demonstration qualitative only"],
  });

  return filters;
}

function masterFilterAnswer(query: string): DeterministicAnswer | null {
  const filters = buildMasterFilters(query);
  if (!filters.length) return null;
  const matches = papers.filter((paper) => filters.every((filter) => filter.match(paper)));
  const criterion = filters.map((filter) => filter.label).join(" and ");
  const params = new URLSearchParams();
  filters.forEach((filter) => {
    if (filter.query) params.set(filter.query[0], filter.query[1]);
  });
  params.set("view", "table");
  const href = filters.every((filter) => filter.query) ? `/explorer?${params.toString()}` : undefined;
  const evidence = masterSource(
    "Verified 107-study data",
    `${matches.length} exact rows match ${criterion}.`,
    href,
  );

  if (isCountQuestion(query)) {
    const countAnswer = criterion === "available code"
      ? `${matches.length} of the 107 studies report available code.`
      : criterion === "no available code"
        ? `${matches.length} of the 107 studies do not report available code.`
        : `${matches.length} of the 107 studies match ${criterion}.`;
    return { answer: countAnswer, sources: [evidence] };
  }
  if (!matches.length) {
    return { answer: `No study in the verified 107-study dataset matches ${criterion}.`, sources: [evidence] };
  }
  const requested = requestedLimit(query);
  const limit = requested ?? (matches.length <= 10 ? matches.length : 5);
  const selected = matches.slice(0, limit);
  const list = selected.map((paper) => `${cleanTitle(paper.title)} (ID ${paper.id})`);
  const prefix = selected.length === matches.length ? `${matches.length} studies match` : `${matches.length} studies match; ${selected.length} examples are`;
  return { answer: `${prefix} ${criterion}: ${readableList(list)}.`, sources: [evidence] };
}

/**
 * Answers questions whose facts or interpretation can be resolved exactly from
 * the verified datasets and curated thesis summaries. Returning null delegates
 * the remaining in-scope question to PDF retrieval plus the language model.
 */
export function answerDeterministically(query: string): DeterministicAnswer | null {
  const id = idAnswer(query);
  if (id) return id;
  if (clearOutOfScope(query)) return outOfScopeAnswer();

  const narrative = specialNarrativeAnswer(query);
  if (narrative) return narrative;

  const comparison = comparisonAnswer(query);
  if (comparison) return comparison;

  const scores = scoreAnswer(query);
  if (scores) return scores;

  // A named system is more specific than an architecture or task word that
  // may appear alongside it (for example, "Is MusicGen a Transformer?").
  if (mentionedSystems(query).length) {
    const systemRecord = namedRecordAnswer(query);
    if (systemRecord) return systemRecord;
  }

  const master = masterFilterAnswer(query);
  if (master) return master;

  const record = namedRecordAnswer(query);
  if (record) return record;

  if (!hasThesisSignal(query)) return outOfScopeAnswer();
  return null;
}

export function answerScopeOnly(): DeterministicAnswer {
  return outOfScopeAnswer();
}

export function containsUnknownId(answer: string) {
  return [...answer.matchAll(/\bID\s*#?\s*(\d{1,4})\b/gi)]
    .some((match) => !knownIds.has(match[1]));
}
