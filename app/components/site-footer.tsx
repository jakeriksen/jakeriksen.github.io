import { site } from "@/site.config";

import { MotionToggle } from "./preferences";

export default function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-2xl px-6 pt-24 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-6 font-mono text-[0.7rem] tracking-[0.1em] uppercase">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {site.links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="text-ink-dim transition-colors hover:text-accent"
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noreferrer" : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-5">
          <MotionToggle />
          <a
            href="/writing/rss.xml"
            className="text-ink-faint transition-colors hover:text-accent"
          >
            RSS
          </a>
        </div>
      </div>
    </footer>
  );
}
