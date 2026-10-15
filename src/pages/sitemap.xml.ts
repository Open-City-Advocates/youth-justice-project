import { PAGES, SITE_URL, docs, permalink } from "../lib/site";

// The canonical home URL plus every HTML page. Feeds stay out of the sitemap.
export async function GET() {
  const paths = [...Object.values(PAGES).map((page) => page.path), ...(await docs()).map((doc) => `/docs/${doc.id}.html`)];
  const urls = [SITE_URL, ...paths.sort().map(permalink)];
  const xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
