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

  if (pathname === "/assistant") return null;

  return (
    <>
      {open && (
        <aside aria-label="Thesis assistant panel" className={`fixed inset-x-3 top-20 z-[70] sm:inset-auto sm:right-6 sm:top-auto sm:h-[min(43rem,calc(100vh-8rem))] sm:w-[26rem] ${preview ? "bottom-40" : "bottom-24"}`}>
          <ThesisAssistant variant="panel" onClose={() => setOpen(false)} />
        </aside>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close thesis assistant" : "Open thesis assistant"}
        aria-expanded={open}
        className={`fixed right-6 z-[71] grid h-14 w-14 place-items-center rounded-full bg-forest text-white shadow-lg ring-4 ring-white transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-forest-light ${preview ? "bottom-20" : "bottom-6"}`}
      >
        {open ? <span className="text-3xl font-light leading-none">×</span> : <AssistantMark />}
      </button>
    </>
  );
}
