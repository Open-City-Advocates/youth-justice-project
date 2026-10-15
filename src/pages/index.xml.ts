import { PAGES, SITE_URL } from "../lib/site";
import { docItems, rss } from "../lib/feeds";

export async function GET() {
  return rss("Home", "/index.xml", [...(await docItems()), ...Object.values(PAGES)], SITE_URL);
}
