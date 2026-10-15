import { docItems, rss } from "../../lib/feeds";

export async function GET() {
  return rss("Docs", "/docs/index.xml", await docItems());
}
