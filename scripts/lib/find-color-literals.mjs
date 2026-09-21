/**
 * Finds color literals outside src/styles/colors.css. Shared by `npm run check:colors`
 * and the Playwright unit test, so both enforce the same rule.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

const ROOTS = ['src', 'public'];
const EXTENSIONS = new Set(['.astro', '.ts', '.mjs', '.js', '.css', '.svg', '.json', '.webmanifest', '.txt', '.html']);
const ALLOWED_FILE = join('src', 'styles', 'colors.css');

// "#" not preceded by a word char, "&" (HTML entity), "/" or "-" (URL fragments and ids),
// followed by exactly 3, 4, 6 or 8 hex digits and then a non-word char.
const HEX = /(?<![\w&/-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![\w-])/g;
// Not preceded by a letter, so Tailwind arbitrary values like shadow-[0_0_4px_rgba(...)] are caught too.
const FUNCTIONS = /(?<![A-Za-z-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXTENSIONS.has(extname(name))) yield path;
  }
}

export function findColorLiterals(root = process.cwd()) {
  const hits = [];
  for (const base of ROOTS) {
    let files;
    try {
      files = [...walk(join(root, base))];
    } catch {
      continue;
    }
    for (const file of files) {
      const rel = relative(root, file);
      if (rel.split(sep).join('/') === ALLOWED_FILE.split(sep).join('/')) continue;
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, index) => {
        for (const pattern of [HEX, FUNCTIONS]) {
          pattern.lastIndex = 0;
          for (const match of line.matchAll(pattern)) {
            hits.push({ file: rel, line: index + 1, value: match[0] });
          }
        }
      });
    }
  }
  return hits;
}
