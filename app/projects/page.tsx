import type { Metadata } from "next";

import { getEntries } from "@/lib/content";

import EntryList from "../components/entry-list";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I have built, shipped, or am still arguing with.",
};

export default async function ProjectsIndex() {
  const entries = await getEntries("projects");

  return (
    <>
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Projects</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-ink-dim">
        Things I have built, shipped, or am still arguing with.
      </p>
      <div className="mt-14">
        <EntryList entries={entries} basePath="/projects" showSummary />
      </div>
    </>
  );
}
