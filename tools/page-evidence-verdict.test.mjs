import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reviewVerdict, needsVisualAttention } from './page-evidence-verdict.mjs';

test('all reviewer schemas preserve loading, partial and unresolved findings', () => {
  for (const key of ['outcome', 'decision', 'result', 'verdict']) {
    for (const value of ['recapture-loading-region', 'partial-obscured-content', 'needs-style-investigation', 'paint-incomplete-awaiting-recapture']) {
      const row = { [key]: value };
      assert.equal(reviewVerdict(row), value);
      assert.equal(needsVisualAttention(row), true);
    }
  }
});
test('missing verdicts and absent reviews fail closed', () => {
  for (const row of [undefined, {}, { verdict: null }, { verdict: '' }]) assert.equal(needsVisualAttention(row), true);
});
test('explicit completed visual observations remain usable', () => {
  for (const value of ['no-visible-layout-defect', 'visible-region-reviewed', 'readable-empty-state-reviewed']) assert.equal(needsVisualAttention({ verdict: value }), false);
});
