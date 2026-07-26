import type { Metadata } from "next";
// Self-hosted fonts (bundled, no external CDN, works offline).
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { meta } from "@/lib/data";

export const metadata: Metadata = {
  title: {
    default: `${meta.title} — Companion`,
    template: `%s · AI Music Review`,
  },
  description: meta.subtitle + ". A PRISMA systematic review of AI music generation, arrangement and orchestration.",
  authors: [{ name: meta.author }],
  metadataBase: new URL("https://ai-rt-c.github.io"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <Navbar title={meta.title} />
        <div className="mx-auto flex max-w-content gap-8 px-5">
          <aside className="hidden w-56 shrink-0 py-8 md:block">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </aside>
          <main id="main" className="min-w-0 flex-1 py-8">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
