const SYSTEM_DISPLAY_NAMES: Readonly<Record<string, string>> = {
  "329": "MusicGen",
  "313": "SymphonyNet",
  "327": "Whole-Song Hierarchical Generation",
};

export function systemDisplayName(id: string, fallbackName: string) {
  return SYSTEM_DISPLAY_NAMES[id] ?? fallbackName;
}
