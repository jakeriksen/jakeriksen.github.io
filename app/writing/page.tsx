import type { Metadata } from "next";

import { getEntries } from "@/lib/content";

import EntryList from "../components/entry-list";

export const metadata: Metadata = {
  title: "Writing",
  description: "Notes on building software and the companies around it.",
};

export default async function WritingIndex() {
  const entries = await getEntries("writing");

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Writing</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-dim">
        Things that took me longer than they should have, written down so they
        take you less.
      </p>
      <div className="mt-14">
        <EntryList entries={entries} basePath="/writing" showSummary />
      </div>
    </>
  );
}
