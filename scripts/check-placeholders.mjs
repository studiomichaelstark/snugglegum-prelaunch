/**
 * Lists everything that still blocks a production launch and fails if anything is left:
 *  1. variables not filled in `.env` (all placeholders live in src/config/placeholders.ts)
 *  2. hard-coded [[TODO: …]] markers in src/
 *  3. data-copy-review flags (copy or numbers that need your approval)
 *  4. the BUILT pages in dist/: does every value really show up, or did text vanish silently?
 *     (see scripts/lib/rendered-check.mjs)
 *
 * `pnpm build` runs this after the build with --require-build, so an unfinished site cannot ship by accident.
 * Run alone (`pnpm check:placeholders`), it checks dist/ only if a build exists.
 */
import { collectPlaceholderReport } from './lib/placeholder-report.mjs';
import { collectRenderedProblems, distIsStale } from './lib/rendered-check.mjs';

const requireBuild = process.argv.includes('--require-build');
const report = collectPlaceholderReport();

const groupTitles = {
  general: 'Site and MailerLite',
  contact: 'Contact',
  imprint: 'Imprint',
  privacy: 'Privacy policy',
  review: 'Review',
  offer: 'Offer (optional)',
};

const width = Math.max(...report.variables.map((v) => v.env.length));
const mark = { set: 'set    ', missing: 'MISSING', hidden: 'n/a    ' };

console.log("\nEnvironment variables (.env, or the host's environment)");
let lastGroup = '';
for (const item of report.variables) {
  if (item.group !== lastGroup) {
    console.log(`\n  ${groupTitles[item.group]}`);
    lastGroup = item.group;
  }
  const detail = item.status === 'missing' ? `  ${item.label}` : '';
  console.log(`    ${mark[item.status]}  ${item.env.padEnd(width)}${detail}`);
}

if (report.missing.length) {
  console.log('\nHow to fill them in');
  for (const item of report.missing) console.log(`    ${item.env}: ${item.hint}`);
}

const print = (title, rows) => {
  console.log(`\n${title} (${rows.length})`);
  for (const { where, what } of rows) console.log(`    ${where}\n      ${what}`);
};
print('Hard-coded [[TODO]] markers in src/', report.todos);
print('Copy needing your approval (data-copy-review)', report.reviews);

// ---- Rendered output ----
const rendered = collectRenderedProblems({ env: report.env });
const stale = distIsStale(process.cwd());
const renderedProblems = [...rendered.problems];

console.log('\nRendered output (dist/)');
if (rendered.skipped) {
  if (requireBuild) {
    renderedProblems.push({ kind: 'build', where: 'dist/', what: 'No build found. Run `pnpm build`.' });
    console.log('    No dist/ found.');
  } else {
    console.log('    Skipped: no build yet. Run `pnpm build:draft`, then this check again to verify the HTML.');
  }
} else {
  if (stale) {
    const what = '.env or src/ changed after the last build, so dist/ shows an old state. Run `pnpm build:draft` first.';
    console.log(`    WARNING: ${what}`);
    if (requireBuild) renderedProblems.push({ kind: 'stale', where: 'dist/', what });
  }
  for (const warning of rendered.warnings) console.log(`    WARNING: ${warning}`);
  if (rendered.problems.length === 0) {
    console.log(`    OK. ${rendered.checked} checks on ${rendered.pages.length} pages: every value is in the HTML, nothing vanished, no undefined or empty output.`);
  }
  for (const item of rendered.problems) console.log(`    [${item.kind}] ${item.where}\n      ${item.what}`);
}

const blocking = report.blocking + renderedProblems.length;
if (blocking > 0) {
  console.error(
    `\ncheck:placeholders FAILED. ${report.missing.length} variable(s) missing, ` +
      `${report.todos.length} hard-coded marker(s), ${report.reviews.length} copy review flag(s), ` +
      `${renderedProblems.length} problem(s) in the rendered output.`,
  );
  process.exit(1);
}
console.log('\ncheck:placeholders OK. Nothing left to resolve.');
