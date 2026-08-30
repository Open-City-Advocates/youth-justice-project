# Cloudflare Workers deployment

**Live.** The apex and `www` are served by this Worker as of 2026-08-06. The
repository-local GitHub Pages rollback lane was retired on 2026-08-30 after the
cutover held and live routing was re-verified.

Repo side: `wrangler.jsonc`, `src/index.js`, `package.json`, and
`scripts/check-hugo-version.mjs`.

Note the repo now lives at `Open-City-Advocates/youth-justice-project`
(transferred from `anotherpanacea-eng`). Old remotes still redirect, but
`git remote set-url` to the new owner.

## Cloudflare dashboard settings

In the Worker → Settings → Build:

| Setting | Value | Why |
|---|---|---|
| Build command | `npm run build` | Runs the Hugo version gate, then `hugo --gc --minify`. |
| Deploy command | `npx wrangler deploy` (default) | Reads `wrangler.jsonc` from the repo root. |
| Root directory | *(leave blank)* | The config lives at the repo root. |
| Build watch paths | *(leave blank)* | **See below — this one silently breaks auto-deploy.** |
| Build variable | `HUGO_VERSION` = `0.164.0` | **Required.** See below. |

The Worker's name in the dashboard must match `"name": "youth-justice-project"`
in `wrangler.jsonc`, or the build fails before deploying.

### Do not set build watch paths to `./public`

This one cost real time. "Include paths" was set to `./public`, copied from the
`"directory": "./public"` in `wrangler.jsonc` — but those two fields mean
opposite things. Wrangler's `directory` is where the *built output* is read
from. The watch path is matched against the *source files in a push*, and
`/public/` is the first line of `.gitignore`, so no commit can ever touch it.

Every push therefore matched nothing and was skipped. Builds only ran when
triggered by hand, which looks exactly like a working pipeline until you notice
the live site is stale. It was: the site served the history section unstyled for
a while, because `site.css` had changed and no build had shipped it.

Leave include and exclude paths **empty**. If a build does not appear after a
push, check this field before anything else.

### HUGO_VERSION is not optional

The first build failed with:

```
executing "main" at <hugo>: can't evaluate field Data in type interface {}
```

That is a version error wearing a template error's clothes. Cloudflare's build
image ships **Hugo 0.147.7** by default; the templates use `hugo.Data`, which
landed in **0.156.0** when `site.Data` was deprecated. The former GitHub Pages
workflow never hit this because it installed a current Hugo.

`scripts/check-hugo-version.mjs` now runs before Hugo and fails with a message
that names `HUGO_VERSION`, so this cannot recur silently. Confirm in the build
log that the version you asked for is the version that ran.

### Hugo Extended is NOT required

An earlier version of the gate also demanded the Extended edition, which failed
the build with `not the Extended edition (found 0.164.0)` even though the
version floor was satisfied. Cloudflare's image installs standard Hugo.

Extended only adds SCSS/Sass transpilation and WebP encoding. This site has no
`assets/` pipeline, no `.scss` anywhere, and ships a plain `static/site.css`, so
the standard build is correct. If an SCSS pipeline is ever added, reinstate the
check in `scripts/check-hugo-version.mjs` and flip `extended` back to `true` in
`hugo.toml`.

### Harmless build-log noise

`npm warn allow-scripts` for `esbuild` and `workerd` (skipped postinstall
scripts) does not affect the deploy — `wrangler deploy` completes normally.
`Skipping build output cache as it's not supported for your project` is also
expected.

## Why the asset routing is set the way it is

`hugo.toml` sets `uglyURLs = true`, so the build emits flat files (`policy.html`,
`docs/2023-active-testimony.html`) and every internal link, every
`<link rel="canonical">`, and every published sitemap entry is a real `.html`
path. Published testimony URLs are also cited off-site.

Cloudflare's default asset routing (`auto-trailing-slash`) **307-redirects**
`/policy.html` → `/policy`, which would put a redirect in front of every one of
those URLs. So `wrangler.jsonc` sets `html_handling: "none"`, which serves them
verbatim at 200 exactly as GitHub Pages did.

The catch, verified locally rather than assumed: with `"none"`, the bare `/` has
no matching asset and returns **404**. That is why `run_worker_first: ["/"]`
hands the root — and only the root — to `src/index.js`, which serves
`index.html` without a redirect. Every other path is served straight from assets
and never invokes Worker code.

Worth knowing: for the first few seconds after a deploy, a couple of assets 404
while the manifest propagates. Re-check before concluding a file failed to
upload.

`npx wrangler deploy` from a workstation is a usable fallback if Workers Builds
is ever wedged — it needs `CLOUDFLARE_API_TOKEN` with Account -> Workers Scripts
-> Edit, bypasses CI entirely, and does not need a git push. Use it sparingly:
a hand deploy is how the live site drifted out of sync with `main` once already.

Note that `workers_dev` is not set in `wrangler.jsonc`, so wrangler enables the
`*.workers.dev` URL by default. That was wanted during migration. Now that the
cutover is done, consider setting `"workers_dev": false` so the site is not also
served from a second public hostname.

## DNS cutover — done 2026-08-06

How it ended up, so the live config is written down:

- **Apex** `youthjusticeproject.org` — a **Custom Domain** on the Worker
  (Settings → Domains & Routes). Cloudflare wrote the DNS record and issued the
  certificate itself.
- **`www`** — a **proxied `AAAA` record pointing at `100::`** (a reserved
  discard address; nothing is ever actually sent there, the record only exists
  so Cloudflare will answer for the name), plus a route
  `*.youthjusticeproject.org/*` on the Worker.

So `www` **serves the site** rather than redirecting to the apex. That is fine:
`baseURL` is the apex, and every page emits `<link rel="canonical">` and
`og:url` pointing at the apex, so search engines and social cards consolidate
there. If one canonical hostname is ever wanted, add a Redirect Rule from
`www.youthjusticeproject.org` to the apex preserving path and query — Redirect
Rules run before Worker routes, so it takes precedence over the wildcard.

The wildcard route is broader than `www`: any future subdomain given a proxied
record will also be served by this Worker. Scope it to
`www.youthjusticeproject.org/*` if that is not wanted.

### Two traps hit during the cutover

**The site went down between steps.** Deleting the apex record stops GitHub
Pages instantly, and the Custom Domain has to be added before anything answers
again. Do those two steps back to back. If the Custom Domain refuses, the
one-record rollback is a **proxied CNAME** `@` → `anotherpanacea-eng.github.io`.

**A stale negative DNS cache outlives the fix.** With no records, the zone's SOA
sets a 30-minute negative TTL, so resolvers that queried during the outage keep
returning "does not exist" well after the record is live. Verify with
`dig +short @1.1.1.1 youthjusticeproject.org` or
`curl --resolve`, not the browser.

## Verification

Measured with `wrangler dev` against the real build output:

| Request | Result |
|---|---|
| `/` | 200 (homepage) |
| all 25 built `.html` pages | 200, no redirects |
| `/site.css`, `/site.js`, `/og-image.png`, `/favicon.svg` | 200 |
| `/robots.txt`, `/sitemap.xml`, `/index.xml`, both PDFs | 200 |
| a path that does not exist | 404 |

To re-run that check yourself: `npm run build`, then `npm run preview`.

Confirmed the same way against the live apex and `www` after cutover: 200 on the
homepage and deep `.html` paths with no redirects, a real 404 for missing paths,
and `server: cloudflare` with **no `x-github-request-id`** — that missing header
is the proof traffic is reaching the Worker and not GitHub Pages.

Nothing in the repo hardcodes the hostname except `baseURL`, which is already
`https://youthjusticeproject.org/` — no change needed there.

## Retired GitHub Pages rollback

The repository-local rollback lane was removed on 2026-08-30: the Pages workflow,
`static/CNAME`, and the obsolete Pages runbook are no longer present. This does
not change the repository's hosted Pages setting. If it is still enabled, an
owner can disable it in Repo Settings → Pages.

## Sitemap hygiene

Tags are display metadata on document cards, not navigable archive links, and
`/docs/` has no section landing page. `hugo.toml` therefore disables the
`taxonomy`, `term`, and `section` output kinds. The sitemap now advertises only
rendered pages instead of the former 14 taxonomy/section URLs that returned 404.
