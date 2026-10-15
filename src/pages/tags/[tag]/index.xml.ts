import { allTags, docItems, rss } from "../../../lib/feeds";

export async function getStaticPaths() {
  return (await allTags()).map((tag) => ({ params: { tag: tag.slug }, props: { name: tag.name } }));
}

export async function GET({ params, props }: { params: { tag: string }; props: { name: string } }) {
  const items = (await docItems()).filter((item) => item.tags.includes(props.name));
  return rss(props.name, `/tags/${params.tag}/index.xml`, items);
}
