import type { Paper } from "@/lib/types";

export interface ReferenceDisplay {
  id: string;
  authors: string;
  year: number | null;
  title: string;
  venue: string;
  doi: string | null;
  doiUrl: string | null;
  paperUrl: string | null;
  searchText: string;
}

function cleanWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function formatInitials(givenNames: string): string {
  return givenNames
    .split(/\s+/)
    .filter(Boolean)
    .map((name) =>
      name
        .split("-")
        .map((part) => {
          const letters = part.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "");
          return letters ? `${letters[0].toUpperCase()}.` : "";
        })
        .filter(Boolean)
        .join("-"),
    )
    .filter(Boolean)
    .join(" ");
}

function formatOneAuthor(author: string): string {
  const cleaned = cleanWhitespace(author);
  if (!cleaned) return "";

  if (cleaned.includes(",")) {
    const [surname, ...givenParts] = cleaned.split(",");
    const given = givenParts.join(",").trim();
    const formattedInitials = formatInitials(given);
    return formattedInitials
      ? `${surname.trim()}, ${formattedInitials}`
      : surname.trim();
  }

  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0];

  const [surname, ...givenParts] = parts;
  const formattedInitials = formatInitials(givenParts.join(" "));
  return formattedInitials ? `${surname}, ${formattedInitials}` : surname;
}

function formatAuthors(rawAuthors: string): string {
  const cleaned = cleanWhitespace(rawAuthors);
  if (/^multiple authors$/i.test(cleaned)) return "Multiple authors";

  const abbreviated = /\bet\s+al\.?$/i.test(cleaned);
  const withoutAbbreviation = cleaned.replace(/[,;\s]*et\s+al\.?$/i, "");
  const formatted = withoutAbbreviation
    .split(";")
    .map(formatOneAuthor)
    .filter(Boolean)
    .join("; ");

  if (!formatted) return cleaned;
  return abbreviated ? `${formatted} et al.` : formatted;
}

export function formatReferenceDisplay(paper: Paper): ReferenceDisplay {
  const authors = formatAuthors(paper.authors);
  const title = cleanWhitespace(paper.title);
  const venue = cleanWhitespace(paper.source);
  const rawDoi = cleanWhitespace(paper.doi ?? "");
  const doi = /^10\.\S+$/i.test(rawDoi) ? rawDoi : null;
  const paperUrl = paper.paperUrl ? cleanWhitespace(paper.paperUrl) : null;

  return {
    id: paper.id,
    authors,
    year: paper.year,
    title,
    venue,
    doi,
    doiUrl: doi ? `https://doi.org/${doi}` : null,
    paperUrl,
    searchText: [authors, title, paper.year === null ? "" : String(paper.year), venue]
      .join(" ")
      .toLocaleLowerCase(),
  };
}

export function compareReferenceDisplays(
  left: ReferenceDisplay,
  right: ReferenceDisplay,
): number {
  return (
    left.authors.localeCompare(right.authors, "en", { sensitivity: "base" }) ||
    (left.year ?? Number.MAX_SAFE_INTEGER) -
      (right.year ?? Number.MAX_SAFE_INTEGER) ||
    left.title.localeCompare(right.title, "en", { sensitivity: "base" })
  );
}
