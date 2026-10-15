import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://youthjusticeproject.org",
  output: "static",

  // Keep the Hugo-era folder names so nothing else has to move:
  // static/ holds files copied as-is, public/ is the build output that
  // wrangler.jsonc serves.
  publicDir: "./static",
  outDir: "./public",

  // Emit flat .html files (policy.html, docs/<slug>.html) to match the URLs
  // the Hugo build published with uglyURLs. Testimony URLs are cited
  // off-site, so they must not change.
  build: {
    format: "file",
  },
});
