import Link from "next/link";

import { type Entry, formatDate } from "@/lib/content";

type Props = {
  entries: Entry[];
  basePath: string;
  /** Listings on the home page stay terse; index pages show the summary. */
  showSummary?: boolean;
};

export default function EntryList({ entries, basePath, showSummary }: Props) {
  if (entries.length === 0) {
    return (
      <p className="font-mono text-sm text-ink-faint">Nothing published yet.</p>
    );
  }

  return (
    <ul>
      {entries.map((entry) => (
        // The divider belongs to the whole item: on the link alone it cuts
        // between the title and its own summary.
        <li key={entry.slug} className="border-b border-line py-4">
          <Link href={`${basePath}/${entry.slug}`} className="group block">
            <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
              <span className="flex items-baseline gap-3">
                <span className="text-ink transition-colors group-hover:text-accent">
                  {entry.title}
                </span>
                {entry.status ? (
                  <span className="font-mono text-[0.65rem] tracking-[0.1em] whitespace-nowrap text-ink-faint uppercase">
                    {entry.status}
                  </span>
                ) : null}
                {entry.draft ? (
                  <span className="font-mono text-[0.65rem] tracking-[0.1em] whitespace-nowrap text-accent uppercase">
                    Draft
                  </span>
                ) : null}
              </span>
              <time
                dateTime={entry.date}
                className="font-mono text-[0.7rem] whitespace-nowrap text-ink-faint tabular-nums"
              >
                {formatDate(entry.date)}
              </time>
            </span>
            {showSummary && entry.summary ? (
              <span className="mt-1.5 block max-w-xl text-sm leading-relaxed text-ink-dim">
                {entry.summary}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
