import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getEntries, getEntry } from "@/lib/content";

import EntryArticle from "../../components/entry-article";

export async function generateStaticParams() {
  const entries = await getEntries("projects");
  return entries.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEntry("projects", slug);
  if (!entry) return {};
  return {
    title: entry.title,
    description: entry.summary,
    openGraph: { title: entry.title, description: entry.summary, type: "article" },
  };
}

export default async function ProjectEntry({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const entry = await getEntry("projects", slug);
  if (!entry) notFound();

  return <EntryArticle entry={entry} backHref="/projects" backLabel="Projects" />;
}
