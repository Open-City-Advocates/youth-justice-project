// Fail the build loudly and early if Hugo is too old for these templates.
// Version floor only -- see the note at the bottom on why Extended is not required.
//
// The templates use hugo.Data, which landed in Hugo v0.156.0 when site.Data was
// deprecated. Cloudflare's Workers Builds image ships an older Hugo by default
// (0.147.7 as of August 2026), which fails deep in template rendering with
// "can't evaluate field Data in type interface {}" -- an error that says nothing
// about versions. This turns that into a message that names the actual fix.
//
// hugo.toml also sets `locale`, which replaced `languageCode` in Hugo v0.158.0.
// An older Hugo ignores it silently and the RSS <language> element disappears,
// so the floor is 0.158.0.
//
// hugo.toml declares the same floor under [module.hugoVersion], but Hugo only
// emits a warning for it and still exits 0, so it cannot serve as the gate.

import { execFileSync } from "node:child_process";

const MIN = [0, 158, 0];
const MIN_STR = MIN.join(".");

function fail(message) {
  console.error(`\nBUILD STOPPED: ${message}\n`);
  console.error(`This site requires Hugo >= ${MIN_STR}.`);
  console.error(
    "On Cloudflare Workers Builds, set the build variable HUGO_VERSION",
  );
  console.error(
    "(Worker -> Settings -> Build -> Variables and Secrets) to a version at or",
  );
  console.error(`above ${MIN_STR}, then retry the deployment.\n`);
  process.exit(1);
}

let output;
try {
  output = execFileSync("hugo", ["version"], { encoding: "utf8" });
} catch (err) {
  fail(`could not run "hugo version" (${err.code ?? err.message}).`);
}

const match = output.match(/v(\d+)\.(\d+)\.(\d+)/);
if (!match) {
  fail(`could not parse a version out of "hugo version": ${output.trim()}`);
}

const found = match.slice(1, 4).map(Number);
const foundStr = found.join(".");

for (let i = 0; i < 3; i++) {
  if (found[i] > MIN[i]) break;
  if (found[i] < MIN[i]) {
    fail(`Hugo ${foundStr} is older than the required ${MIN_STR}.`);
  }
}

// Deliberately NOT requiring the Extended edition. Extended only adds SCSS/Sass
// transpilation and WebP encoding; this site has no assets/ pipeline, no .scss
// anywhere, and ships a plain static/site.css. Cloudflare's build image installs
// standard Hugo, and requiring Extended failed the build for a feature the site
// never uses. If an SCSS pipeline is ever added, reinstate the check here AND
// flip extended back to true in hugo.toml.

console.log(`Hugo ${foundStr} satisfies the >= ${MIN_STR} floor.`);
