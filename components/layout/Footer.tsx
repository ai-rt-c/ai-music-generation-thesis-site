import type { Meta } from "@/lib/types";

export default function Footer({ meta }: { meta: Meta }) {
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="mx-auto max-w-content px-5 py-10 text-sm text-muted">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="font-serif text-base text-ink">{meta.title}</p>
            <p className="mt-1">{meta.subtitle}</p>
            <p className="mt-3">
              {meta.author} · {meta.program}
              <br />
              Supervisor: {meta.supervisor}
              <br />
              {meta.university}
            </p>
          </div>
          <div>
            <p className="text-ink">Cite this work</p>
            <p className="mt-1">{meta.citations.apa}</p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <a href={meta.repoUrl}>GitHub repository</a>
              <a href="/references">References</a>
            </p>
            <p className="mt-3 text-xs text-muted">Last updated {meta.lastUpdated}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
