// RSS feeds kept at the paths the Hugo build published (index.xml,
// docs/index.xml, tags/<tag>/index.xml, ...). The site never linked them,
// but they are public URLs, so they stay for route compatibility.
// Items are listed alphabetically by title, as Hugo listed them (no item had
// a date). Hugo's pubDate of "0001-01-01" is dropped rather than reproduced;
// RSS 2.0 makes it optional.
import { SITE_TITLE, docs, permalink, tagSlug } from "./site";

export interface FeedItem {
  title: string;
  path: string;
  description: string;
}

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// channelLink defaults to the feed itself: only the home feed has an HTML page.
export function rss(name: string, feedPath: string, items: FeedItem[], channelLink?: string): Response {
  const self = permalink(feedPath);
  const sorted = [...items].sort((a, b) => a.title.localeCompare(b.title) || a.path.localeCompare(b.path));
  const body = sorted
    .map((item) => {
      const link = escape(permalink(item.path));
      return `    <item>
      <title>${escape(item.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${escape(item.description)}</description>
    </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(name)} on ${SITE_TITLE}</title>
    <link>${channelLink ?? self}</link>
    <description>Recent content in ${escape(name)} on ${SITE_TITLE}</description>
    <language>en-us</language>
    <atom:link href="${self}" rel="self" type="application/rss+xml" />
${body}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}

export async function docItems(): Promise<(FeedItem & { tags: string[] })[]> {
  return (await docs()).map((doc) => ({
    title: doc.data.title,
    path: `/docs/${doc.id}.html`,
    description: doc.data.description,
    tags: doc.data.tags,
  }));
}

export async function allTags(): Promise<{ name: string; slug: string }[]> {
  const names = new Set((await docItems()).flatMap((item) => item.tags));
  return [...names].map((name) => ({ name, slug: tagSlug(name) }));
}
