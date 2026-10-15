import { rss } from "../../lib/feeds";

// No page has categories; Hugo still published this (empty) feed.
export async function GET() {
  return rss("Categories", "/categories/index.xml", []);
}
