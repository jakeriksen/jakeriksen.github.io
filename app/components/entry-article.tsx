import Link from "next/link";

import { type Entry, formatDate } from "@/lib/content";

export default function EntryArticle({
  entry,
  backHref,
  backLabel,
}: {
  entry: Entry;
  backHref: string;
  backLabel: string;
}) {
  return (
    <article>
      <Link
        href={backHref}
        className="font-mono text-[0.7rem] tracking-[0.1em] text-ink-faint uppercase transition-colors hover:text-accent"
      >
        ← {backLabel}
      </Link>

      <h1 className="font-display mt-8 text-3xl leading-[1.15] tracking-tight text-balance sm:text-[2.6rem]">
        {entry.title}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.7rem] tracking-[0.1em] text-ink-faint uppercase">
        <time dateTime={entry.date}>{formatDate(entry.date)}</time>
        <span aria-hidden>·</span>
        <span>{entry.readingMinutes} min</span>
        {entry.status ? (
          <>
            <span aria-hidden>·</span>
            <span>{entry.status}</span>
          </>
        ) : null}
        {entry.href ? (
          <>
            <span aria-hidden>·</span>
            <a
              href={entry.href}
              target="_blank"
              rel="noreferrer"
              className="text-accent transition-opacity hover:opacity-70"
            >
              Visit ↗
            </a>
          </>
        ) : null}
      </div>

      {entry.summary ? (
        <p className="mt-8 border-l border-accent pl-5 text-lg leading-relaxed text-ink-dim">
          {entry.summary}
        </p>
      ) : null}

      <div
        className="prose mt-12"
        dangerouslySetInnerHTML={{ __html: entry.body }}
      />

      {entry.tags.length > 0 ? (
        <ul className="mt-16 flex flex-wrap gap-2 border-t border-line pt-6">
          {entry.tags.map((tag) => (
            <li
              key={tag}
              className="font-mono text-[0.65rem] tracking-[0.1em] text-ink-faint uppercase"
            >
              #{tag}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
