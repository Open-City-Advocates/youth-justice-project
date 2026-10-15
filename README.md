# Youth Justice Project — Astro site

The <https://youthjusticeproject.org/> site, built with [Astro](https://astro.build)
and served by a Cloudflare Worker.

The site was built with Hugo until October 2026. The move to Astro kept every
published URL, the design, and the editing workflow below: the built HTML
pages match the Hugo build tag for tag.

## Project layout

```
youth-justice-project/
├─ astro.config.mjs          # site URL, flat .html output, folder names
├─ content/docs/*.md         # testimony, letters, memos -> /docs/<name>.html
├─ data/
│  ├─ policy.yaml            # the testimony/letters/reports archive (grouped by year)
│  └─ news.yaml              # the news feed
├─ src/
│  ├─ layouts/Base.astro     # page skeleton and <head> (title, description, social cards)
│  ├─ components/            # Header (nav) and Footer  <- shared chrome
│  ├─ pages/                 # one file per page; docs/[slug].astro renders content/docs
│  ├─ lib/site.ts            # page titles + descriptions, YAML loading
│  ├─ lib/feeds.ts           # the RSS feeds kept from the Hugo site
│  ├─ content.config.ts      # front matter fields for content/docs
│  └─ index.js               # Worker root-route handler
├─ static/                   # copied to the site as-is: site.css, site.js, images, PDFs
├─ wrangler.jsonc            # Cloudflare Workers static-assets config
└─ public/                   # BUILD OUTPUT (generated; do not edit or commit)
```

`static/` and `public/` keep their Hugo-era meanings (Astro's defaults are the
other way round; `astro.config.mjs` sets them), so the Worker config did not
have to change.

## Setup

Node 22.22 or newer (`.node-version` pins 24 for Cloudflare's build). Then:

```bash
npm install
```

## Build & preview

```bash
npm run dev        # live preview at http://localhost:4321
npm run build      # build into ./public, then check the sitemap and feeds
npm run preview    # serve ./public through the Worker config (wrangler dev)
```

`npm run preview` is the closest match to production: it serves real `.html`
paths with no redirects, the way the live site does.

## Add a testimony / letter / report

Open `data/policy.yaml`. It's a list of year groups; add an item under the right
year (or add a new year group at the top). Fields:

```yaml
- year: "2026"
  count: "9 items"          # the little counter shown next to the year
  items:
    - date: "Jul 1, 2026"
      title: "Your document title"
      by: "Author · Organization"
      type: "Testimony"      # the highlighted tag (Testimony, Report, Letter…)
      tags: ["Budget", "DYRS oversight"]
      url: "https://link-to-the-pdf"   # or "#" if not posted yet
      external: true          # true opens in a new tab (use for offsite PDFs)
```

To publish the full text on the site, add `content/docs/<name>.md` with this
front matter and point the archive item's `url` at `docs/<name>.html`:

```yaml
---
title: "B26-0526, the LEARNS Act"
docdate: "May 6, 2026"
by: "Joshua Miller · Open City Advocates"
doctype: "Testimony"
tags: ["Legislation", "Education in custody"]
description: "One or two sentences for search results and social cards."
---
```

The build fails with a clear message if one of those fields is missing.

## Add a news item

Open `data/news.yaml` and add a block at the top:

```yaml
- date: "Jul 2026"
  title: "Headline"
  summary: "One or two sentences."
  type: "Coalition letter"
  tags: ["Budget"]
  url: "#"
```

## Deploy

Push to `main`. Cloudflare Workers Builds runs `npm run build` and deploys
`./public`. See `DEPLOY-WORKERS.md` for the dashboard settings, routing
details, and local fallback procedure.
