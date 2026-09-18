"""Build the assistant's page-cited corpus from the public thesis PDF.

The generated JSON contains only text extracted from the PDF. Site routes are
navigation targets and are never included in the evidentiary context sent to
the language model.
"""

from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

import fitz


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "public" / "thesis" / "AI_Music_Thesis_Public_Edition.pdf"
OUTPUT_PATH = ROOT / "data" / "thesis-corpus.json"
MAX_CHARS = 2_200
MIN_CHARS = 1_150
OVERLAP_CHARS = 260


SYSTEM_LINKS = (
    (("pop music transformer",), "Pop Music Transformer", "/systems/89"),
    (("compound word transformer", "compound word"), "Compound Word Transformer", "/systems/309"),
    (("museformer",), "Museformer", "/systems/312"),
    (("theme transformer",), "Theme Transformer", "/systems/171"),
    (("whole-song hierarchical", "whole song hierarchical"), "Whole-Song Hierarchical Generation", "/systems/327"),
    (("symbolic music generation with diffusion",), "Symbolic diffusion", "/systems/62"),
    (("figaro",), "FIGARO", "/systems/315"),
    (("getmusic",), "GETMusic", "/systems/57"),
    (("musecoco",), "MuseCoco", "/systems/324"),
    (("chatmusician",), "ChatMusician", "/systems/316"),
    (("mupt",), "MuPT", "/systems/74"),
    (("midi-gpt", "midi gpt"), "MIDI-GPT", "/systems/67"),
    (("jukebox",), "Jukebox", "/systems/92"),
    (("audiolm",), "AudioLM", "/systems/328"),
    (("musiclm",), "MusicLM", "/systems/76"),
    (("noise2music",), "Noise2Music", "/systems/58"),
    (("musicgen",), "MusicGen", "/systems/329"),
    (("fast timing-conditioned",), "Fast Timing-Conditioned Diffusion", "/systems/334"),
    (("mustango",), "Mustango", "/systems/378"),
    (("popmag",), "PopMAG", "/systems/345"),
    (("accomontage",), "AccoMontage", "/systems/346"),
    (("structured multi-track",), "Structured Multi-Track Arrangement", "/systems/19"),
    (("singsong",), "SingSong", "/systems/349"),
    (("stemgen",), "StemGen", "/systems/352"),
    (("orchidea",), "Orchidea", "/systems/357"),
    (("symphonynet",), "SymphonyNet", "/systems/313"),
    (("meteor",), "METEOR", "/systems/259"),
)


def roman(number: int) -> str:
    values = ((10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I"))
    result = []
    for value, glyph in values:
        while number >= value:
            result.append(glyph)
            number -= value
    return "".join(result)


def page_label(pdf_page: int) -> str:
    if pdf_page == 1:
        return "Cover"
    if pdf_page <= 8:
        return roman(pdf_page)
    return str(pdf_page - 8)


def section_for(pdf_page: int) -> tuple[str, str, str]:
    if pdf_page == 1:
        return "Title page", "/about-thesis", "About the thesis"
    if pdf_page == 2:
        return "Abstract", "/about-thesis", "About the thesis"
    if pdf_page <= 8:
        return "Front matter", "/about-thesis", "About the thesis"

    thesis_page = pdf_page - 8
    if thesis_page <= 3:
        return "1 Introduction", "/about-thesis", "About the thesis"
    if thesis_page <= 11:
        return "2 Theoretical Background and Literature Review", "/taxonomy", "Taxonomy"
    if thesis_page <= 26:
        return "3 Methodology", "/methodology", "Methodology"
    if thesis_page <= 28:
        return "4.1 Extended Taxonomy", "/taxonomy", "Taxonomy"
    if thesis_page <= 32:
        return "4.2 Corpus-Level Analysis", "/explorer", "Interactive explorer"
    if thesis_page <= 41:
        return "4.3 Research Trends", "/trends", "Research trends"
    if thesis_page <= 44:
        return "4.4 Most Promising Systems", "/top-systems", "Top systems"
    if thesis_page <= 53:
        return "4.5 Pilot Exploratory Listening Analysis", "/listening-evaluation", "Listening evaluation"
    if thesis_page <= 72:
        return "4.6 Reported Evaluation Evidence", "/listening-evaluation", "Evaluation evidence"
    if thesis_page <= 77:
        return "5 Discussion and Limitations", "/discussion", "Discussion"
    if thesis_page <= 79:
        return "5.6 Future Directions", "/future-directions", "Future directions"
    if thesis_page <= 82:
        return "6 Conclusion", "/about-thesis", "About the thesis"
    if thesis_page <= 93:
        return "References", "/references", "References"
    if thesis_page == 94:
        return "List of Appendices", "/about-thesis", "About the thesis"
    if thesis_page == 95:
        return "Appendix A - Master Comparison Table", "/explorer", "Interactive explorer"
    if thesis_page <= 124:
        return "Appendix B - In-Depth Listening Analyses", "/systems", "27 selected systems"
    if thesis_page <= 126:
        return "Appendix C - Research Timeline", "/about-thesis", "About the thesis"
    return "Declaration of Authenticity", "/about-thesis", "About the thesis"


def compact(value: str) -> str:
    value = value.replace("\u00ad", "").replace("\ufb01", "fi").replace("\ufb02", "fl")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def extract_page_text(page: fitz.Page, label: str) -> str:
    pieces: list[str] = []
    for block in page.get_text("blocks", sort=True):
        value = compact(block[4])
        if not value or value == label:
            continue
        if re.fullmatch(r"[IVXLCDM]+|\d+", value) and len(value) <= 5:
            continue
        pieces.append(value)
    return compact(" ".join(pieces))


def chunk_text(text: str) -> list[str]:
    if len(text) <= MAX_CHARS:
        return [text] if text else []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        desired_end = min(len(text), start + MAX_CHARS)
        if desired_end < len(text):
            search_start = min(len(text), start + MIN_CHARS)
            boundary = max(
                text.rfind(". ", search_start, desired_end),
                text.rfind("; ", search_start, desired_end),
                text.rfind(": ", search_start, desired_end),
            )
            end = boundary + 1 if boundary >= search_start else desired_end
        else:
            end = desired_end

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(text):
            break

        next_start = max(start + 1, end - OVERLAP_CHARS)
        space = text.find(" ", next_start)
        start = space + 1 if space != -1 and space < end else next_start

    return chunks


def site_links_for(text: str, default_href: str, default_label: str) -> list[dict[str, str]]:
    links = [{"label": default_label, "href": default_href}]
    lowered = text.casefold()
    for aliases, label, href in SYSTEM_LINKS:
        if any(alias in lowered for alias in aliases):
            links.append({"label": label, "href": href})
        if len(links) == 4:
            break

    deduplicated: list[dict[str, str]] = []
    seen: set[str] = set()
    for link in links:
        if link["href"] not in seen:
            seen.add(link["href"])
            deduplicated.append(link)
    return deduplicated


def main() -> None:
    if not PDF_PATH.exists():
        raise FileNotFoundError(PDF_PATH)

    pdf_bytes = PDF_PATH.read_bytes()
    document = fitz.open(PDF_PATH)
    if document.page_count != 135:
        raise RuntimeError(f"Expected 135 pages, found {document.page_count}")

    chunks: list[dict[str, object]] = []
    all_text: list[str] = []
    for index, page in enumerate(document):
        pdf_page = index + 1
        label = page_label(pdf_page)
        section, site_href, site_label = section_for(pdf_page)
        text = extract_page_text(page, label)
        all_text.append(text)
        for chunk_index, chunk in enumerate(chunk_text(text), start=1):
            chunks.append(
                {
                    "id": f"pdf-p{pdf_page:03d}-c{chunk_index:02d}",
                    "pdfPage": pdf_page,
                    "thesisPage": label,
                    "section": section,
                    "text": chunk,
                    "siteLinks": site_links_for(chunk, site_href, site_label),
                }
            )

    joined_text = " ".join(all_text)
    if re.search(r"(?:student|matriculation)\s*(?:number|no\.?)", all_text[0], re.IGNORECASE):
        raise RuntimeError("A student-number field remains on the public cover")
    if "signed declaration and matriculation number have been omitted" not in joined_text.lower():
        raise RuntimeError("Public-edition declaration note is missing")

    payload = {
        "source": {
            "file": PDF_PATH.name,
            "sha256": hashlib.sha256(pdf_bytes).hexdigest(),
            "totalPages": document.page_count,
            "title": "A Systematic Overview on AI Music Generation, Arrangement, and Orchestration",
        },
        "chunks": chunks,
    }
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(chunks)} page-cited chunks to {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
