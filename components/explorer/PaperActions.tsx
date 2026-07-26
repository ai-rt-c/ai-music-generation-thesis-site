"use client";

import { useState } from "react";
import type { Paper } from "@/lib/types";

function doiHref(doi: string) {
  return doi.startsWith("http") ? doi : `https://doi.org/${doi}`;
}

export default function PaperActions({ paper, compact }: { paper: Paper; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copyCite = async () => {
    if (!paper.citation) return;
    try {
      await navigator.clipboard.writeText(paper.citation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };
  const linkCls = "text-xs text-forest hover:underline";
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${compact ? "" : "mt-3 border-t border-line pt-3"}`}>
      {paper.doi && (
        <a href={doiHref(paper.doi)} target="_blank" rel="noopener noreferrer" className={linkCls} title="Open the paper DOI">
          DOI
        </a>
      )}
      {paper.paperUrl && !paper.doi && (
        <a href={paper.paperUrl} target="_blank" rel="noopener noreferrer" className={linkCls} title="Open the paper">
          Paper
        </a>
      )}
      {paper.codeUrl && (
        <a href={paper.codeUrl} target="_blank" rel="noopener noreferrer" className={linkCls} title="Open the code repository">
          Code
        </a>
      )}
      {paper.citation && (
        <button type="button" onClick={copyCite} className={linkCls} title="Copy an APA citation">
          {copied ? "Copied" : "Cite"}
        </button>
      )}
    </div>
  );
}
