// Navigation model — grouped, docs-style. Labels are UI chrome (not research content).
export interface NavItem {
  label: string;
  href: string;
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Home", href: "/" },
      { label: "About the thesis", href: "/about-thesis" },
    ],
  },
  {
    title: "Method",
    items: [
      { label: "Systematic review", href: "/systematic-review" },
      { label: "Listening evaluation", href: "/listening-evaluation" },
    ],
  },
  {
    title: "The field",
    items: [
      { label: "Taxonomy", href: "/taxonomy" },
      { label: "Research trends", href: "/trends" },
    ],
  },
  {
    title: "Systems",
    items: [
      { label: "29 selected systems", href: "/systems" },
      { label: "Top 9 systems", href: "/top-systems" },
      { label: "Interactive explorer", href: "/explorer" },
    ],
  },
  {
    title: "Findings",
    items: [
      { label: "Discussion", href: "/discussion" },
      { label: "Future directions", href: "/future-directions" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "References", href: "/references" },
      { label: "Downloads", href: "/downloads" },
      { label: "About", href: "/about" },
    ],
  },
];

export const flatNav: NavItem[] = navGroups.flatMap((g) => g.items);
