// Verify the intentional route split: rendered HTML pages belong in the sitemap,
// while the formerly public section/taxonomy RSS feeds remain available without
// advertising empty HTML archive pages.

import { existsSync, readFileSync } from "node:fs";

const PUBLIC = "public";
const canonicalHome = "https://youthjusticeproject.org/";
const retainedFeeds = [
  "index.xml",
  "docs/index.xml",
  "categories/index.xml",
  "tags/index.xml",
  "tags/behavioral-health/index.xml",
  "tags/budget/index.xml",
  "tags/credible-messengers/index.xml",
  "tags/crossover-youth/index.xml",
  "tags/dyrs-oversight/index.xml",
  "tags/education-in-custody/index.xml",
  "tags/family/index.xml",
  "tags/legislation/index.xml",
  "tags/oversight/index.xml",
  "tags/public-safety/index.xml",
  "tags/right-to-counsel/index.xml",
];

function fail(message) {
  console.error(`ROUTE INVENTORY FAILED: ${message}`);
  process.exit(1);
}

const sitemapPath = `${PUBLIC}/sitemap.xml`;
if (!existsSync(sitemapPath)) fail(`missing ${sitemapPath}; run npm run build first.`);

const sitemap = readFileSync(sitemapPath, "utf8");
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (locations.length === 0) fail("sitemap contains no URLs.");
if (!locations.includes(canonicalHome)) fail(`missing canonical home URL: ${canonicalHome}`);
if (locations.includes(`${canonicalHome}index.html`)) {
  fail(`sitemap must use canonical home URL, not ${canonicalHome}index.html`);
}

for (const location of locations) {
  const pathname = new URL(location).pathname;
  if (pathname === "/docs/" || /^\/(?:tags|categories)(?:\/|$)/.test(pathname)) {
    fail(`sitemap advertises a disabled archive route: ${pathname}`);
  }
  const output = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  if (!existsSync(`${PUBLIC}/${output}`)) {
    fail(`sitemap URL has no generated asset: ${pathname}`);
  }
}

for (const feed of retainedFeeds) {
  if (!existsSync(`${PUBLIC}/${feed}`)) fail(`missing retained feed: /${feed}`);
}

console.log(`Route inventory OK: ${locations.length} sitemap URLs and ${retainedFeeds.length} retained XML feeds.`);
