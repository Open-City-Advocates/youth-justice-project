# Cloudflare Workers deployment

Migration target, replacing GitHub Pages. `DEPLOY-PAGES.md` documents the old
path, which stays live as the rollback until the cutover is confirmed.

The repo side of this is already committed: `wrangler.jsonc`, `src/index.js`,
`package.json`, and `scripts/check-hugo-version.mjs`. What remains is dashboard
and DNS configuration.

## Cloudflare dashboard settings

In the Worker → Settings → Build:

| Setting | Value | Why |
|---|---|---|
| Build command | `npm run build` | Runs the Hugo version gate, then `hugo --gc --minify`. |
| Deploy command | `npx wrangler deploy` (default) | Reads `wrangler.jsonc` from the repo root. |
| Root directory | *(leave blank)* | The config lives at the repo root. |
| Build variable | `HUGO_VERSION` = `0.164.0` | **Required.** See below. |

The Worker's name in the dashboard must match `"name": "youth-justice-project"`
in `wrangler.jsonc`, or the build fails before deploying.

### HUGO_VERSION is not optional

The first build failed with:

```
executing "main" at <hugo>: can't evaluate field Data in type interface {}
```

That is a version error wearing a template error's clothes. Cloudflare's build
image ships **Hugo 0.147.7** by default; the templates use `hugo.Data`, which
landed in **0.156.0** when `site.Data` was deprecated. The GitHub Pages workflow
never hit this because it installed a current Hugo.

`scripts/check-hugo-version.mjs` now runs before Hugo and fails with a message
that names `HUGO_VERSION`, so this cannot recur silently. Confirm in the build
log that the version you asked for is the version that ran.

## Why the asset routing is set the way it is

`hugo.toml` sets `uglyURLs = true`, so the build emits flat files (`policy.html`,
`docs/2023-active-testimony.html`) and every internal link, every
`<link rel="canonical">`, and all 39 sitemap entries are real `.html` paths.
Published testimony URLs are also cited off-site.

Cloudflare's default asset routing (`auto-trailing-slash`) **307-redirects**
`/policy.html` → `/policy`, which would put a redirect in front of every one of
those URLs. So `wrangler.jsonc` sets `html_handling: "none"`, which serves them
verbatim at 200 exactly as GitHub Pages did.

The catch, verified locally rather than assumed: with `"none"`, the bare `/` has
no matching asset and returns **404**. That is why `run_worker_first: ["/"]`
hands the root — and only the root — to `src/index.js`, which serves
`index.html` without a redirect. Every other path is served straight from assets
and never invokes Worker code.

Measured with `wrangler dev` against the real build output:

| Request | Result |
|---|---|
| `/` | 200 (homepage) |
| all 25 built `.html` pages | 200, no redirects |
| `/site.css`, `/site.js`, `/og-image.png`, `/favicon.svg` | 200 |
| `/robots.txt`, `/sitemap.xml`, `/index.xml`, both PDFs | 200 |
| a path that does not exist | 404 |

To re-run that check yourself: `npm run build`, then `npm run preview`.

## DNS cutover

Nameservers are already Cloudflare, so DNS changes take effect in seconds — you
are not waiting on propagation again. Right now the apex and `www` are
**proxied records pointing at GitHub Pages** (confirmed live: responses carry
both `server: cloudflare` and `x-github-request-id`).

1. **Verify on the `*.workers.dev` URL first.** Click through the homepage,
   Policy, News, Members, Contact, and a few `docs/` pages. GitHub Pages keeps
   serving production the whole time, so there is no time pressure.
2. **Delete the existing apex and `www` records** in the Cloudflare DNS panel.
   Whatever their type, a Custom Domain cannot be created on a hostname that
   already has a record. (Do not go looking for the GitHub IPs
   `185.199.108–111.153` specifically — because the records are proxied, the
   panel may show either those or a CNAME to `anotherpanacea-eng.github.io`.)
3. **Add the Custom Domain.** Worker → Settings → Domains & Routes → Add →
   Custom domain → `youthjusticeproject.org`. Cloudflare creates the record and
   issues the certificate, pointing straight at the Worker with no origin.
   **This is the cutover.** Check the site over `https://` immediately after —
   certificate issuance is quick but there can be a brief SSL-error window.
4. **Handle `www`.** Custom Domains match hostnames exactly, so a Worker on the
   apex will not receive `www` requests. Keep the apex canonical (it is what
   `baseURL` and every canonical tag already say), then redirect `www` to it:
   add a **proxied** `AAAA` record for `www` pointing at `100::` (a reserved
   originless placeholder — requests never reach it), plus a Redirect Rule from
   `www.youthjusticeproject.org` to the apex, preserving path and query.

Nothing in the repo hardcodes the hostname except `baseURL`, which is already
`https://youthjusticeproject.org/` — no change needed there.

## After the cutover holds

Leave GitHub Pages enabled for a few days as the rollback. Once you are
confident:

- Disable Pages in repo Settings → Pages.
- Delete `.github/workflows/pages.yml` so it stops building for no reason.
- Delete `static/CNAME` (a GitHub Pages marker; harmless on Workers, where it
  just serves a stray `/CNAME` file).
- Delete `DEPLOY-PAGES.md`.

## Known issue, pre-existing and unrelated to this migration

The sitemap advertises 39 URLs but the build produces 25 pages. The other 14 are
taxonomy and section pages (`/tags/*.html`, `/tags/index.html`,
`/categories/index.html`, `/docs/index.html`) that have no layout, so Hugo lists
them without rendering them — the source of the `found no layout file for "html"
for kind "taxonomy"/"section"/"term"` build warnings.

**These already 404 on GitHub Pages today**, so Workers changes nothing here.
Worth fixing separately, and it is a real either/or: add the missing layouts so
the pages exist, or exclude those kinds from the build so the sitemap stops
telling search engines about URLs that do not resolve.
