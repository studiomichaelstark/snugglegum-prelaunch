/**
 * Collects everything that still blocks a production launch. Shared by
 * `scripts/check-placeholders.mjs` and the Playwright unit test.
 *
 *  1. Values missing in the environment (`.env` or host variables), from src/config/placeholders.ts
 *  2. Hard-coded [[TODO: …]] markers left in src/ (there should be none, values belong in .env)
 *  3. data-copy-review flags: copy or numbers that need your approval
 *
 * The TypeScript registry is imported directly. Node strips the types, so no build step is needed.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { loadEnv } from 'vite';
import { placeholderSpecs, resolvePlaceholders } from '../../src/config/placeholders.ts';

const EXTENSIONS = new Set(['.astro', '.ts', '.css', '.md']);
const REGISTRY_FILE = join('src', 'config', 'placeholders.ts');
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

/**
 * @param {{ root?: string, env?: Record<string, string | undefined> }} [options]
 *   `env` replaces the real environment (used by the tests). By default: .env files in production mode
 *   plus process.env, the same as `astro build`.
 */
export function collectPlaceholderReport({ root = process.cwd(), env } = {}) {
  const source = env ?? { ...loadEnv('production', root, 'PUBLIC_'), ...process.env };
  const resolved = resolvePlaceholders(source);

  const variables = placeholderSpecs.map((spec) => {
    const item = resolved[spec.id];
    return { env: spec.env, group: spec.group, label: spec.label, hint: spec.hint, status: item.status };
  });

  const todos = [];
  const reviews = [];
  for (const file of walk(join(root, 'src'))) {
    const rel = relative(root, file);
    if (rel === REGISTRY_FILE) continue;
    const text = readFileSync(file, 'utf8');
    for (const match of text.matchAll(TODO)) {
      todos.push({ where: `${rel}:${lineOf(text, match.index)}`, what: clean(match[0]) });
    }
    for (const match of text.matchAll(REVIEW)) {
      reviews.push({ where: `${rel}:${lineOf(text, match.index)}`, what: match[1] ?? 'needs review' });
    }
  }

  const missing = variables.filter((v) => v.status === 'missing');
  return { env: source, variables, missing, todos, reviews, blocking: missing.length + todos.length + reviews.length };
}
