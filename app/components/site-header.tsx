"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { site } from "@/site.config";

import { ThemeToggle } from "./preferences";

const NAV = [
  { href: "/writing", label: "Writing" },
  { href: "/projects", label: "Projects" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="mx-auto w-full max-w-2xl px-6 pt-10 pb-16 sm:pt-14">
      <div className="flex items-baseline justify-between gap-6">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-ink transition-colors hover:text-accent"
        >
          {site.name}
        </Link>
        <nav className="flex items-center gap-5 font-mono text-[0.7rem] tracking-[0.12em] uppercase">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "text-accent"
                    : "text-ink-dim transition-colors hover:text-ink"
                }
              >
                {item.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
