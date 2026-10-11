import test from 'node:test';
import assert from 'node:assert/strict';
import { verifiedConsumerReview } from './atelier-style-manual.mjs';
const record = { path: 'components/A.tsx', sourceHash: 'source', argumentHash: 'argument', line: 4 };
const review = { ...record, decision: 'business-data', ruleId: 'exact-consumer', reason: 'Actual DB writer consumes the object.',
  evidence: [{ path: 'lib/writer.ts', line: 7, hash: 'writer' }, { path: 'patterns/design.ts', line: 2, hash: 'canonical' }] };
const hashes = new Map([['components/A.tsx', 'source'], ['lib/writer.ts', 'writer'], ['patterns/design.ts', 'canonical']]);
const currentHash = path => hashes.get(path);
test('exact source, argument and consumer evidence are all required', () => {
  assert.equal(verifiedConsumerReview(record, review, currentHash)?.decision, 'business-data');
  for (const key of ['path', 'sourceHash', 'argumentHash', 'line']) assert.equal(verifiedConsumerReview({ ...record, [key]: 'changed' }, review, currentHash), null);
  assert.equal(verifiedConsumerReview(record, review, path => path === 'lib/writer.ts' ? 'changed' : currentHash(path)), null);
  assert.equal(verifiedConsumerReview(record, review, path => path === 'patterns/design.ts' ? 'changed' : currentHash(path)), null);
});
test('missing evidence, invented decisions and absent files cannot approve an argument', () => {
  for (const patch of [{ evidence: [] }, { reason: '' }, { decision: 'pass' }, { evidence: [{ path: 'missing', line: 1, hash: 'old' }] },
    { evidence: [{ path: 'lib/writer.ts', line: 0, hash: 'writer' }] }]) {
    assert.equal(verifiedConsumerReview(record, { ...review, ...patch }, currentHash), null);
  }
});
