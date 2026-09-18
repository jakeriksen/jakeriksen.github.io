import Link from "next/link";

import { getEntries } from "@/lib/content";
import { site } from "@/site.config";

import EntryList from "./components/entry-list";
import Section from "./components/section";

export default async function Home() {
  const [writing, projects] = await Promise.all([
    getEntries("writing"),
    getEntries("projects"),
  ]);

  return (
    <>
      <section>
        <p className="font-mono text-[0.7rem] tracking-[0.14em] text-accent uppercase">
          {site.role}
        </p>
        <h1 className="font-display mt-5 text-4xl leading-[1.12] tracking-tight text-balance sm:text-5xl">
          {site.tagline}
        </h1>
        <p className="mt-6 max-w-xl leading-relaxed text-ink-dim">{site.bio}</p>
      </section>

      <Section
        title="Projects"
        action={
          <Link
            href="/projects"
            className="font-mono text-[0.7rem] tracking-[0.1em] text-ink-faint uppercase transition-colors hover:text-accent"
          >
            All
          </Link>
        }
      >
        <EntryList entries={projects.slice(0, 4)} basePath="/projects" showSummary />
      </Section>

      <Section
        title="Writing"
        action={
          <Link
            href="/writing"
            className="font-mono text-[0.7rem] tracking-[0.1em] text-ink-faint uppercase transition-colors hover:text-accent"
          >
            All
          </Link>
        }
      >
        <EntryList entries={writing.slice(0, 5)} basePath="/writing" />
      </Section>
    </>
  );
}
