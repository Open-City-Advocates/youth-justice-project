# Youth Justice Project — Hugo site

The <https://youthjusticeproject.org/> site, rebuilt with [Hugo](https://gohugo.io)
so the design is preserved but the shared chrome and the growing lists are no
longer hand-maintained HTML.

## Why Hugo (not Zensical)

Zensical / MkDocs are documentation frameworks: they impose a docs shell (sidebar,
TOC). This site is a designed editorial site, so it uses Hugo as a template-first
generator — your original `site.css` and markup are the source of truth, and Hugo
only adds shared layout + data-driven lists on top.

## What changed vs. the hand-built site

- **Header, nav, and footer are defined once** in `layouts/partials/`. Edit the nav
  in one place instead of six files.
- **The Policy/Research archive and the News feed are data-driven.** Items live in
  `data/policy.yaml` and `data/news.yaml`. Add an entry = add a small YAML block;
  the cards render themselves.
- **The design is byte-for-byte the same** — the bespoke page bodies (hero, stat
  cards, data cards, member grid, etc.) were ported verbatim into templates.
- URLs stay flat (`policy.html`, `data.html`, …) via `uglyURLs`, so nothing that's
  currently live breaks.

## Project layout

```
yjp-hugo/
├─ hugo.toml                 # config (baseURL, uglyURLs, site description)
├─ content/                  # one thin file per page (front matter only)
│  ├─ _index.md  members.md  data.md  policy.md  news.md  contact.md
├─ data/
│  ├─ policy.yaml            # the testimony/letters/reports archive (grouped by year)
│  └─ news.yaml              # the news feed
├─ layouts/
│  ├─ _default/baseof.html   # page skeleton
│  ├─ partials/              # head, header (nav), footer  <- shared chrome
│  ├─ index.html             # home body
│  └─ _default/*.html        # members, data, policy, news, contact bodies
├─ src/index.js              # Worker root-route handler
├─ wrangler.jsonc            # Cloudflare Workers static-assets config
├─ static/site.css           # your stylesheet
└─ public/                   # BUILD OUTPUT (generated; do not edit or commit)
```

## Install Hugo

- **Windows (PC):** `winget install Hugo.Hugo.Extended`  (or `choco install hugo-extended`)
- **Mac:** `brew install hugo`

## Build & preview

```bash
hugo server        # live preview at http://localhost:1313
hugo               # build static site into ./public
```

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

Push to `main`. Cloudflare Workers Builds is the deployment target. See
`DEPLOY-WORKERS.md` for the required `HUGO_VERSION` build variable, routing
details, and local fallback procedure.

> Note: this project supersedes the earlier `YJP-Zensical/` folder, which can be deleted.
