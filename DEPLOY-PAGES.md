# GitHub Pages deployment (being replaced — rollback only)

> **Superseded by `DEPLOY-WORKERS.md`.** The site is migrating to Cloudflare
> Workers. This path stays live and unchanged as the rollback until that cutover
> is confirmed, then gets deleted along with the workflow and `static/CNAME`.


Push to `main` → GitHub Actions builds with Hugo and publishes to Pages.
Workflow: `.github/workflows/pages.yml`. No SSH key, no secrets.

**Status: fully cut over (July 2026).** The site is live at
`https://youthjusticeproject.org/` served by GitHub Pages:

- `static/CNAME` contains `youthjusticeproject.org` (Hugo copies it into every build).
- DNS at the registrar points the apex at GitHub's Pages IPs
  (`185.199.108.153`, `.109.153`, `.110.153`, `.111.153`, plus AAAA records)
  and `www` at `anotherpanacea-eng.github.io`.
- The former Dreamhost hosting is retired; Dreamhost serves DNS only.
  Dreamhost **email is unaffected** — that's the MX records, which stay as they are.

## Editing from now on

Edit files (add testimony to `data/policy.yaml`, a page under `content/docs/`, etc.),
commit, push to `main`. The Action rebuilds and redeploys automatically — watch the
run in the repo's Actions tab. The site is also reachable at
`https://anotherpanacea-eng.github.io/youth-justice-project/`.

## If the custom domain ever breaks

Repo → Settings → Pages: re-save the custom domain to force GitHub to re-verify DNS,
then re-tick **Enforce HTTPS** once the certificate is issued.
