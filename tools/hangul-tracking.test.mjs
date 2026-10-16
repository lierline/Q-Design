import test from 'node:test';
import assert from 'node:assert/strict';
import { cssRules, resolveValues, trackingOf, releasesTracking } from './hangul-tracking.mjs';

const defs = new Map([
  ['--wide', new Set(['2.5px'])],
  ['--chain', new Set(['var(--wide)'])],
  ['--theme', new Set(['0', '0.08em'])],
  ['--zero', new Set(['0'])],
]);

test('var() tracking resolves through chains and fallbacks instead of reading as no tracking', () => {
  assert.deepEqual(resolveValues('var(--chain)', defs), ['2.5px']);
  assert.equal(trackingOf('var(--chain)', defs).visible, true);
  assert.deepEqual(resolveValues('var(--missing, 0.3px)', defs), ['0.3px']);
  assert.equal(trackingOf('var(--missing, 0.3px)', defs).visible, true);
  // 테마마다 값이 다르면 하나라도 보이면 보이는 자간입니다
  assert.equal(trackingOf('var(--theme)', defs).visible, true);
  assert.equal(trackingOf('0.2px', defs).visible, false);
  assert.equal(trackingOf('0.05em', defs).visible, true);
  assert.equal(trackingOf('0.04em', defs).visible, false);
});

test('a value that cannot be resolved is reported, not treated as zero', () => {
  const missing = trackingOf('var(--missing)', defs);
  assert.equal(missing.unresolved, true);
  assert.equal(missing.visible, false);
  assert.equal(trackingOf('theme("letterSpacing.wide")', defs).unresolved, true);
});

test('release detection accepts zero and normal only', () => {
  assert.equal(releasesTracking('0', defs), true);
  assert.equal(releasesTracking('normal', defs), true);
  assert.equal(releasesTracking('var(--zero)', defs), true);
  assert.equal(releasesTracking('var(--theme)', defs), false);
  assert.equal(releasesTracking('var(--missing)', defs), false);
});

test('rules inside media blocks come out with their own selector and comments are ignored', () => {
  const rules = cssRules('/* .x { letter-spacing: 9px } */\n@media (min-width: 1px) { .a { letter-spacing: 1px; } }\n.b { color: red; }');
  assert.deepEqual(rules.map((rule) => rule.sel), ['.a', '.b']);
});
