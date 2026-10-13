import fs from 'node:fs';
import assert from 'node:assert/strict';
const paths = ['components','app'].flatMap(dir => fs.readdirSync(dir,{ recursive: true }).filter(f => /\.(tsx|css)$/.test(f)).map(f => `${dir}/${f}`));
const rules = { blockingDialogs: /\b(?:alert|confirm|prompt)\s*\(/g, arbitraryTextSizes: /text-\[[\d.]+(?:px|rem)\]/g, rawExceptionUI: /alert\(String\(|setError\(String\(/g };
const baseline = { blockingDialogs: 0, arbitraryTextSizes: 0, rawExceptionUI: 0 };
for (const [name, regex] of Object.entries(rules)) {
  const violations = paths.flatMap(path => [...fs.readFileSync(path,'utf8').matchAll(regex)].map(() => path));
  assert(violations.length <= baseline[name], `${name}: ${violations.join(', ')}`);
}
// Prove the static matchers reject representative regressions.
assert('alert("oops")'.match(rules.blockingDialogs));
assert('text-[13px]'.match(rules.arbitraryTextSizes));
assert('setError(String(e))'.match(rules.rawExceptionUI));
const css=fs.readFileSync('app/globals.css','utf8');
for (const token of [':focus-visible','prefers-reduced-motion','::backdrop']) assert(css.includes(token), `Missing ${token}`);
console.log('UI gate passed: no new baseline violations; focus, motion, and dialog rules present.');
