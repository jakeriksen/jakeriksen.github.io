---
title: RegnskapGPT
summary: A summer project that started with Fiken, an API, and the annoyance of doing your own accounting.
date: 2026-09-18
status: Live
href: https://regnskapgpt.no
tags: [product, ai]
---

Before this I ran [Cadea](https://blogg.hallingplast.no/cadea-vil-automatisere-planlegging-vann-avlop),
a startup built out of my master's thesis on automating the design of water and
sewage infrastructure. After that, a few like-minded pals and I wanted a
summer project.

We did not have to look far for a problem. Being self-employed meant doing our
own accounting, which was none of our favourite parts of the month. We were
already using [Fiken](https://fiken.no), so the idea was not complicated: put an
AI in front of it and see what happened.

That was RegnskapGPT.

## What the testing taught us

The model was the easy part. Ask something general about accounting and it
answers well. Ask something specific about your own books, in Norwegian, under
Norwegian rules, and the gap shows up immediately.

The problem was never raw capability. It was everything around it: the harness,
and the domain knowledge the model does not have and cannot guess.

Our first answer was a knowledge base, built with RAG. That got us further, but
only as far as what someone had already written down.

So we started calling accountants. A lot of them. The goal was to get real
expertise into the system instead of hoping the model had absorbed enough of it
by accident.

## Where it led

Those conversations turned into a second product. Counted is a control layer
for accounting, built for firms rather than for the self-employed, and it
exists because of what the accountants told us while we were trying to make
RegnskapGPT good.

Counted did not replace it. We still maintain it.

If you want to test it out, or you have an idea you would like built into it,
get in touch at [aleksander@regnskapgpt.no](mailto:aleksander@regnskapgpt.no).
Happy to collaborate.
