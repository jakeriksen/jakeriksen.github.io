# Personal site

Next.js, Tailwind, and a WebGL cloud background. Content is markdown in this
repo, so there is no database and no CMS.

```bash
pnpm dev     # http://localhost:3000
pnpm build
pnpm lint
```

Site-wide details — name, tagline, links — live in `site.config.ts`.
Set `url` there before deploying: it is the base for every RSS link and OG tag.

There is no CMS here. A post is a markdown file, a deploy is a `git push`, and
the hosting bill is whatever your static host charges for HTML, which is
usually nothing.

## Adding a post

Drop a file into `content/writing/`. The filename becomes the URL, so
`content/writing/shipping-fast.md` is served at `/writing/shipping-fast`.

```markdown
---
title: Shipping fast without breaking things
summary: One line that shows up in listings and in the RSS feed.
date: 2026-09-18
tags: [engineering]
draft: false
---

Your words go here.
```

## Adding a project

Same idea, in `content/projects/`. Projects take two extra fields:

| Field    | What it does                                       |
| -------- | -------------------------------------------------- |
| `status` | Short label in listings, e.g. `Live` or `Archived`  |
| `href`   | Optional external link, shown as a *Visit* action   |

## Images

Put the file in `public/` and reference it from the root:

```markdown
![A caption, which is also the alt text.](/diagram.png)
```

An image on its own line becomes a figure, and the alt text is used as the
caption. Dark artwork on a transparent background needs a light panel behind
it or it vanishes in night mode — add `#plate` to ask for one:

```markdown
![The counted wordmark.](/counted-no-bg.png#plate)
```

## The fields

- `title` and `date` are the only ones that really matter. Everything else has
  a sensible fallback.
- `summary` feeds the listing pages, the page description, and RSS.
- `draft: true` hides an entry in production but keeps it visible in
  `next dev`, so you can work on a post without publishing it.
- Reading time is counted from the file, not stored in it.

## What you get for free

Code blocks are highlighted, headings get anchor ids, tables and task lists
work, and `/writing/rss.xml` is generated from the same files. Nothing to
configure.
