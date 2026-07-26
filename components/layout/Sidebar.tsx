"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { navGroups } from "@/lib/nav";

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav aria-label="Primary" className="text-sm">
      {navGroups.map((group) => (
        <div key={group.title} className="mb-6">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-3 py-1.5 transition-colors ${
                      active
                        ? "bg-forest-light font-medium text-forest-ink"
                        : "text-ink hover:bg-forest-light/60"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
