import { findColorLiterals } from './lib/find-color-literals.mjs';

const hits = findColorLiterals();
if (hits.length === 0) {
  console.log('check:colors OK. No color literals outside src/styles/colors.css.');
} else {
  console.error(`check:colors FAILED. ${hits.length} color literal(s) outside src/styles/colors.css:`);
  for (const { file, line, value } of hits) console.error(`  ${file}:${line}  ${value}`);
  process.exit(1);
}
