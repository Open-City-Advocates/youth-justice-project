import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { getCollection } from "astro:content";

export const SITE_URL = "https://youthjusticeproject.org/";
export const SITE_TITLE = "Youth Justice Project";
export const SITE_DESCRIPTION =
  "The Youth Justice Project unites DC's youth defenders, legal advocates, and allied organizations to confront racial injustice in the city's juvenile legal system and build a system rooted in young people's families and communities.";

// Title, meta description, and built path of each top-level page. The pages
// pass these to the Base layout; the home feed lists them too.
export const PAGES = {
  contact: {
    title: "Contact",
    path: "/contact.html",
    description: "Contact the Youth Justice Project. The coalition has no office; all correspondence is received through Open City Advocates.",
  },
  data: {
    title: "Data",
    path: "/data.html",
    description: "DC's juvenile legal system, in numbers. Every figure is sourced to a primary government, auditor, court, or peer-reviewed source.",
  },
  members: {
    title: "Members",
    path: "/members.html",
    description: "The Youth Justice Project is a voluntary alliance of DC youth defenders, legal advocates, and allied organizations. Meet the member organizations.",
  },
  news: {
    title: "News",
    path: "/news.html",
    description: "What the coalition is filing, signing, and testifying on. The latest from the Youth Justice Project.",
  },
  policy: {
    title: "Policy & Research",
    path: "/policy.html",
    description: "The coalition's shared positions on DC youth justice policy and the testimony, letters, and research behind them. Read, cite, and share.",
  },
};

export interface PolicyItem {
  date: string;
  title: string;
  by: string;
  type: string;
  tags: string[];
  url: string;
  external?: boolean;
}

export interface PolicyYear {
  year: string;
  count: string;
  items: PolicyItem[];
}

export interface NewsItem {
  date: string;
  title: string;
  summary: string;
  type: string;
  tags: string[];
  url: string;
}

// The archive and news feed are edited as YAML in data/ (see README).
// Resolved from the project root: import.meta.url points into the bundled
// build output, not src/, at build time.
function readYaml<T>(file: string): T {
  return parse(readFileSync(path.resolve("data", file), "utf8")) as T;
}

export const policy = (): PolicyYear[] => readYaml<PolicyYear[]>("policy.yaml");
export const news = (): NewsItem[] => readYaml<NewsItem[]>("news.yaml");

// Hugo's urlize, for the tag feed paths (e.g. "DYRS oversight" -> "dyrs-oversight").
export function tagSlug(tag: string): string {
  return tag.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function docs() {
  return getCollection("docs");
}

// Absolute URL of a built page, matching the .html paths Hugo published.
export function permalink(path: string): string {
  return new URL(path.replace(/^\//, ""), SITE_URL).href;
}
