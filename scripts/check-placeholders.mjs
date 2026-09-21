/**
 * Lists everything that still blocks a production launch and fails if anything is left:
 *  - [[TODO: ...]] markers (missing data, for example legal details)
 *  - data-copy-review attributes (copy or numbers that need your approval)
 * `npm run build` runs this after the build, so an unfinished site cannot ship by accident.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const EXTENSIONS = new Set(['.astro', '.ts', '.css', '.md']);
const TODO = /\[\[TODO[\s\S]*?\]\]/g;
const REVIEW = /data-copy-review(?:="([^"]*)")?/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXTENSIONS.has(extname(name))) yield path;
  }
}

const lineOf = (text, index) => text.slice(0, index).split('\n').length;
const clean = (value) => value.replace(/\s+/g, ' ').trim();

const todos = [];
const reviews = [];

for (const file of walk(join(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);
  for (const match of text.matchAll(TODO)) {
    todos.push({ where: `${rel}:${lineOf(text, match.index)}`, what: clean(match[0]) });
  }
  for (const match of text.matchAll(REVIEW)) {
    reviews.push({ where: `${rel}:${lineOf(text, match.index)}`, what: match[1] ?? 'needs review' });
  }
}

const print = (title, rows) => {
  console.log(`\n${title} (${rows.length})`);
  for (const { where, what } of rows) console.log(`  ${where}\n    ${what}`);
};

print('[[TODO]] markers', todos);
print('Copy needing your approval (data-copy-review)', reviews);

if (todos.length + reviews.length > 0) {
  console.error(`\ncheck:placeholders FAILED. ${todos.length} TODO marker(s), ${reviews.length} copy review flag(s) remain.`);
  process.exit(1);
}
console.log('\ncheck:placeholders OK. Nothing left to resolve.');
