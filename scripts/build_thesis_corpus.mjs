/** Build the assistant's private, page-cited corpus from the public thesis PDF. */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PDF_PATH = path.join(ROOT, "public", "thesis", "AI_Music_Thesis_Public_Edition.pdf");
const OUTPUT_PATH = path.join(ROOT, "data", "thesis-corpus.json");
const MAX_CHARS = 2_200;
const MIN_CHARS = 1_150;
const OVERLAP_CHARS = 260;

const SYSTEM_LINKS = [
  [["pop music transformer"], "Pop Music Transformer", "/systems/89"],
  [["compound word transformer", "compound word"], "Compound Word Transformer", "/systems/309"],
  [["museformer"], "Museformer", "/systems/312"],
  [["theme transformer"], "Theme Transformer", "/systems/171"],
  [["whole-song hierarchical", "whole song hierarchical"], "Whole-Song Hierarchical Generation", "/systems/327"],
  [["symbolic music generation with diffusion"], "Symbolic diffusion", "/systems/62"],
  [["figaro"], "FIGARO", "/systems/315"],
  [["getmusic"], "GETMusic", "/systems/57"],
  [["musecoco"], "MuseCoco", "/systems/324"],
  [["chatmusician"], "ChatMusician", "/systems/316"],
  [["mupt"], "MuPT", "/systems/74"],
  [["midi-gpt", "midi gpt"], "MIDI-GPT", "/systems/67"],
  [["jukebox"], "Jukebox", "/systems/92"],
  [["audiolm"], "AudioLM", "/systems/328"],
  [["musiclm"], "MusicLM", "/systems/76"],
  [["noise2music"], "Noise2Music", "/systems/58"],
  [["musicgen"], "MusicGen", "/systems/329"],
  [["fast timing-conditioned"], "Fast Timing-Conditioned Diffusion", "/systems/334"],
  [["mustango"], "Mustango", "/systems/378"],
  [["popmag"], "PopMAG", "/systems/345"],
  [["accomontage"], "AccoMontage", "/systems/346"],
  [["structured multi-track"], "Structured Multi-Track Arrangement", "/systems/19"],
  [["singsong"], "SingSong", "/systems/349"],
  [["stemgen"], "StemGen", "/systems/352"],
  [["orchidea"], "Orchidea", "/systems/357"],
  [["symphonynet"], "SymphonyNet", "/systems/313"],
  [["meteor"], "METEOR", "/systems/259"],
];

function roman(number) {
  const values = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let result = "";
  for (const [value, glyph] of values) {
    while (number >= value) {
      result += glyph;
      number -= value;
    }
  }
  return result;
}

function pageLabel(pdfPage) {
  if (pdfPage === 1) return "Cover";
  if (pdfPage <= 8) return roman(pdfPage);
  return String(pdfPage - 8);
}

function sectionFor(pdfPage) {
  if (pdfPage === 1) return ["Title page", "/about-thesis", "About the thesis"];
  if (pdfPage === 2) return ["Abstract", "/about-thesis", "About the thesis"];
  if (pdfPage <= 8) return ["Front matter", "/about-thesis", "About the thesis"];

  const thesisPage = pdfPage - 8;
  if (thesisPage <= 3) return ["1 Introduction", "/about-thesis", "About the thesis"];
  if (thesisPage <= 11) return ["2 Theoretical Background and Literature Review", "/taxonomy", "Taxonomy"];
  if (thesisPage <= 26) return ["3 Methodology", "/methodology", "Methodology"];
  if (thesisPage <= 28) return ["4.1 Extended Taxonomy", "/taxonomy", "Taxonomy"];
  if (thesisPage <= 32) return ["4.2 Corpus-Level Analysis", "/explorer", "Interactive explorer"];
  if (thesisPage <= 41) return ["4.3 Research Trends", "/trends", "Research trends"];
  if (thesisPage <= 44) return ["4.4 Most Promising Systems", "/top-systems", "Top systems"];
  if (thesisPage <= 53) return ["4.5 Pilot Exploratory Listening Analysis", "/listening-evaluation", "Listening evaluation"];
  if (thesisPage <= 72) return ["4.6 Reported Evaluation Evidence", "/listening-evaluation", "Evaluation evidence"];
  if (thesisPage <= 77) return ["5 Discussion and Limitations", "/discussion", "Discussion"];
  if (thesisPage <= 79) return ["5.6 Future Directions", "/future-directions", "Future directions"];
  if (thesisPage <= 82) return ["6 Conclusion", "/about-thesis", "About the thesis"];
  if (thesisPage <= 93) return ["References", "/references", "References"];
  if (thesisPage === 94) return ["List of Appendices", "/about-thesis", "About the thesis"];
  if (thesisPage === 95) return ["Appendix A - Master Comparison Table", "/explorer", "Interactive explorer"];
  if (thesisPage <= 124) return ["Appendix B - In-Depth Listening Analyses", "/systems", "27 selected systems"];
  if (thesisPage <= 126) return ["Appendix C - Research Timeline", "/about-thesis", "About the thesis"];
  return ["Declaration of Authenticity", "/about-thesis", "About the thesis"];
}

function compact(value) {
  return value
    .replaceAll("\u00ad", "")
    .replaceAll("\ufb01", "fi")
    .replaceAll("\ufb02", "fl")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractPageText(page, label) {
  const content = await page.getTextContent({ disableNormalization: false });
  const lines = new Map();

  for (const item of content.items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const x = item.transform?.[4] ?? 0;
    const y = item.transform?.[5] ?? 0;
    const lineKey = Math.round(y * 2) / 2;
    const entries = lines.get(lineKey) ?? [];
    entries.push({ x, value: item.str });
    lines.set(lineKey, entries);
  }

  const pieces = [...lines.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, entries]) => compact(entries.sort((a, b) => a.x - b.x).map((entry) => entry.value).join(" ")))
    .filter((value) => value && value !== label)
    .filter((value) => !(value.length <= 5 && /^(?:[IVXLCDM]+|\d+)$/.test(value)));

  return compact(pieces.join(" "));
}

function chunkText(text) {
  if (text.length <= MAX_CHARS) return text ? [text] : [];

  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const desiredEnd = Math.min(text.length, start + MAX_CHARS);
    let end = desiredEnd;
    if (desiredEnd < text.length) {
      const searchStart = Math.min(text.length, start + MIN_CHARS);
      const boundary = Math.max(
        text.lastIndexOf(". ", desiredEnd),
        text.lastIndexOf("; ", desiredEnd),
        text.lastIndexOf(": ", desiredEnd),
      );
      if (boundary >= searchStart) end = boundary + 1;
    }

    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= text.length) break;

    const nextStart = Math.max(start + 1, end - OVERLAP_CHARS);
    const space = text.indexOf(" ", nextStart);
    start = space !== -1 && space < end ? space + 1 : nextStart;
  }
  return chunks;
}

function siteLinksFor(text, defaultHref, defaultLabel) {
  const links = [{ label: defaultLabel, href: defaultHref }];
  const lowered = text.toLocaleLowerCase("en-US");
  for (const [aliases, label, href] of SYSTEM_LINKS) {
    if (aliases.some((alias) => lowered.includes(alias))) links.push({ label, href });
    if (links.length === 4) break;
  }

  const seen = new Set();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

async function main() {
  const pdfBytes = await readFile(PDF_PATH);
  const loadingTask = getDocument({ data: new Uint8Array(pdfBytes), disableWorker: true, isEvalSupported: false });
  const document = await loadingTask.promise;
  if (document.numPages !== 135) throw new Error(`Expected 135 pages, found ${document.numPages}`);

  const chunks = [];
  const allText = [];
  for (let pdfPage = 1; pdfPage <= document.numPages; pdfPage += 1) {
    const page = await document.getPage(pdfPage);
    const label = pageLabel(pdfPage);
    const [section, siteHref, siteLabel] = sectionFor(pdfPage);
    const text = await extractPageText(page, label);
    allText.push(text);
    chunkText(text).forEach((chunk, index) => {
      chunks.push({
        id: `pdf-p${String(pdfPage).padStart(3, "0")}-c${String(index + 1).padStart(2, "0")}`,
        pdfPage,
        thesisPage: label,
        section,
        text: chunk,
        siteLinks: siteLinksFor(chunk, siteHref, siteLabel),
      });
    });
    page.cleanup();
  }

  if (/(?:student|matriculation)\s*(?:number|no\.?)/i.test(allText[0])) {
    throw new Error("A student-number field remains on the public cover");
  }
  if (!allText.join(" ").toLowerCase().includes("signed declaration and matriculation number have been omitted")) {
    throw new Error("Public-edition declaration note is missing");
  }

  const payload = {
    source: {
      file: path.basename(PDF_PATH),
      sha256: createHash("sha256").update(pdfBytes).digest("hex"),
      totalPages: document.numPages,
      title: "A Systematic Overview on AI Music Generation, Arrangement, and Orchestration",
    },
    chunks,
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(payload), "utf8");
  await loadingTask.destroy();
  console.log(`Wrote ${chunks.length} page-cited chunks to ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
