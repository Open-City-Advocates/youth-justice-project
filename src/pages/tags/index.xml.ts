import { allTags, rss } from "../../lib/feeds";

// One item per tag, linking to that tag's own feed (there are no HTML tag pages).
export async function GET() {
  const items = (await allTags()).map((tag) => ({
    title: tag.name,
    path: `/tags/${tag.slug}/index.xml`,
    description: `Recent content in ${tag.name}`,
  }));
  return rss("Tags", "/tags/index.xml", items);
}
