import { pathToFileURL } from "node:url";
import path from "node:path";
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Testimony, letters, and memos published as HTML pages under /docs/.
// The Markdown files stay in content/docs/ so the editing workflow is the
// same as it was under Hugo. (glob's base must be a file URL on Windows.)
const docs = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: pathToFileURL(path.resolve("content/docs")),
  }),
  schema: z.object({
    title: z.string(),
    docdate: z.string(),
    by: z.string(),
    doctype: z.string(),
    tags: z.array(z.string()).default([]),
    description: z.string(),
  }),
});

export const collections = { docs };
