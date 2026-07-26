// Pure helpers with no data imports — safe for any component to use.

// Prefix a public asset path with the GitHub Pages base path.
export const asset = (path: string) =>
  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/${path.replace(/^\//, "")}`;

// Round a score to at most one decimal for display, or an em dash for null.
export const fmtScore = (v: number | null | undefined) =>
  v == null ? "—" : Number.isInteger(v) ? String(v) : v.toFixed(1);

export const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
