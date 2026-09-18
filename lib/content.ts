import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

export type Collection = "writing" | "projects";

export type Entry = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  /** Projects only: what the thing is, shown next to the title in listings. */
  status?: string;
  href?: string;
  tags: string[];
  draft: boolean;
  readingMinutes: number;
  body: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

const PLATE_MARKER = "#plate";

/**
 * Lazy-loads images, and promotes a paragraph that holds nothing but an image
 * to a <figure>, reusing the alt text as the caption. A "#plate" suffix on the
 * src asks for a light backing panel: logos and diagrams are usually dark
 * artwork on transparency, which vanishes against the dark surface at night.
 *
 * Written by hand rather than with unist-util-visit: the tree walk is short
 * and it saves a dependency.
 */
function rehypeFigures() {
  const srcOf = (node: HastNode) => String(node.properties?.src ?? "");

  return (tree: HastNode) => {
    const walk = (node: HastNode) => {
      const children = node.children;
      if (!children) return;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];

        if (child.tagName === "img") {
          const src = srcOf(child);
          child.properties = {
            ...child.properties,
            src: src.endsWith(PLATE_MARKER)
              ? src.slice(0, -PLATE_MARKER.length)
              : src,
            loading: "lazy",
            decoding: "async",
          };
        }

        const inner = child.children?.filter(
          (grandchild) =>
            grandchild.type !== "text" || (grandchild.value ?? "").trim() !== ""
        );

        if (child.tagName === "p" && inner?.length === 1 && inner[0].tagName === "img") {
          const image = inner[0];
          const alt = String(image.properties?.alt ?? "");
          // Read the marker here rather than when the image itself is visited:
          // the containing paragraph is reached first.
          const framed: HastNode = srcOf(image).endsWith(PLATE_MARKER)
            ? {
                type: "element",
                tagName: "div",
                // The plate wraps only the image, so the caption stays on the
                // page background instead of sitting on a white panel.
                properties: { className: ["plate"] },
                children: [image],
              }
            : image;

          children[i] = {
            type: "element",
            tagName: "figure",
            properties: {},
            children: alt
              ? [
                  framed,
                  {
                    type: "element",
                    tagName: "figcaption",
                    properties: {},
                    children: [{ type: "text", value: alt }],
                  },
                ]
              : [framed],
          };
        }

        walk(children[i]);
      }
    };

    walk(tree);
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeFigures)
  .use(rehypeHighlight, { detect: true })
  .use(rehypeStringify);

function readCollection(collection: Collection): string[] {
  const dir = path.join(CONTENT_DIR, collection);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith(".md"));
}

async function parse(collection: Collection, file: string): Promise<Entry> {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, collection, file), "utf8");
  const { data, content } = matter(raw);
  const html = await processor.process(content);

  const words = content.trim().split(/\s+/).length;

  return {
    slug: file.replace(/\.md$/, ""),
    title: String(data.title ?? file.replace(/\.md$/, "")),
    summary: String(data.summary ?? ""),
    // Frontmatter dates parse to Date objects; normalise to an ISO day so the
    // value is stable regardless of the reader's timezone.
    date: new Date(data.date ?? Date.now()).toISOString().slice(0, 10),
    status: data.status ? String(data.status) : undefined,
    href: data.href ? String(data.href) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    draft: Boolean(data.draft),
    readingMinutes: Math.max(1, Math.round(words / 220)),
    body: String(html),
  };
}

/** Newest first, drafts excluded outside development. */
export async function getEntries(collection: Collection): Promise<Entry[]> {
  const entries = await Promise.all(
    readCollection(collection).map((file) => parse(collection, file))
  );
  return entries
    .filter((entry) => !entry.draft || process.env.NODE_ENV === "development")
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getEntry(
  collection: Collection,
  slug: string
): Promise<Entry | null> {
  const entries = await getEntries(collection);
  return entries.find((entry) => entry.slug === slug) ?? null;
}

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
