"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";

export default function Navbar({ title }: { title: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/90 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between px-5 py-3">
        <Link href="/" className="font-serif text-[15px] font-semibold text-ink no-underline hover:no-underline">
          AI Music Review <span className="font-sans text-xs font-normal text-muted">· 2020–2025</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Toggle navigation menu"
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink md:hidden"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <div id="mobile-nav" className="border-t border-line bg-white px-4 py-4 md:hidden">
          <Sidebar onNavigate={() => setOpen(false)} />
        </div>
      )}
    </header>
  );
}
