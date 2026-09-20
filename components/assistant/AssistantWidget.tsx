"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThesisAssistant from "@/components/assistant/ThesisAssistant";

function AssistantMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-7 w-7" fill="none">
      <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="3.5" />
      <path d="M27.5 27.5 36 36" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M29 10v12.5a4.5 4.5 0 1 1-3-4.24V12l10-2v9.5a4.5 4.5 0 1 1-3-4.24V9.2L29 10Z" fill="currentColor" />
    </svg>
  );
}

export default function AssistantWidget({ preview = false }: { preview?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (pathname.replace(/\/+$/, "") === "/assistant") return null;

  return (
    <>
      {open && (
        <aside
          id="thesis-assistant-panel"
          aria-label="Thesis assistant panel"
          className={`pointer-events-auto fixed inset-x-3 top-20 z-[2147483000] sm:inset-auto sm:top-auto sm:h-[min(43rem,calc(100vh-8rem))] sm:w-[26rem] ${preview ? "bottom-24 sm:left-6" : "bottom-24 sm:right-6"}`}
        >
          <ThesisAssistant variant="panel" onClose={() => setOpen(false)} />
        </aside>
      )}
      <a
        href="/assistant/"
        role="button"
        onClick={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
        aria-label={open ? "Close thesis assistant" : "Open thesis assistant"}
        aria-expanded={open}
        aria-controls="thesis-assistant-panel"
        className={`pointer-events-auto fixed z-[2147483001] grid h-14 w-14 touch-manipulation place-items-center rounded-full bg-forest text-white no-underline shadow-lg ring-4 ring-white transition-transform hover:scale-105 hover:no-underline focus:outline-none focus:ring-4 focus:ring-forest-light ${preview ? "bottom-6 left-6" : "bottom-6 right-6"}`}
      >
        {open ? <span className="text-3xl font-light leading-none">×</span> : <AssistantMark />}
      </a>
    </>
  );
}
