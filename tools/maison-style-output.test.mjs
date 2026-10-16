import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { finishReview, reviewMode } from './maison-style-output.mjs';

const taskTmp = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../tmp/maison-style-output-tests');
fs.mkdirSync(taskTmp, { recursive: true });
function fixture(run) {
  const directory = fs.mkdtempSync(path.join(taskTmp, 'case-'));
  try { run(directory); }
  finally {
    const target = fs.realpathSync(directory), boundary = fs.realpathSync(taskTmp);
    assert.ok(target.startsWith(boundary + path.sep), 'Cleanup stays inside this task fixture directory');
    fs.rmSync(target, { recursive: true });
  }
}
// Same key order as the generated report, so a fresh comparison is byte for byte.
const report = (records, { generatedAt = '2026-10-16T00:00:00.000Z', fileHashes = [{ path: 'app/page.tsx', hash: 'source-a' }] } = {}) =>
  ({ version: 1, generatedAt, product: 'maison', fileHashes, unknownCount: records.filter(record => record.decision === 'unknown').length, records });
const snapshot = directory => new Map(fs.readdirSync(directory).map(file => [file, fs.readFileSync(path.join(directory, file))]));
const unchanged = (directory, before) => { for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(directory, file)), bytes); assert.equal(fs.readdirSync(directory).length, before.size); };

test('check rejects a newly unresolved argument and the stale saved report without overwriting either', () => fixture(directory => {
  const clean = report([{ argumentHash: 'old', decision: 'token-reference-verified' }]);
  finishReview(clean, directory, 'write');
  const before = snapshot(directory);
  const changed = report([...clean.records, { argumentHash: 'new-literal', decision: 'unknown' }]);
  const outcome = finishReview(changed, directory, 'check');
  assert.equal(outcome.ok, false);
  assert.equal(outcome.unknownCount, 1);
  assert.equal(outcome.fresh, false);
  assert.equal(outcome.changedRecords, 1);
  assert.deepEqual(outcome.differences, [{ kind: 'header', key: 'unknownCount' }, { kind: 'record', index: 1, path: undefined, line: undefined, fields: ['argumentHash', 'decision'] }, { kind: 'unknown-list' }]);
  unchanged(directory, before);
}));

test('check and fresh fail read-only when no saved report exists', () => fixture(directory => {
  for (const mode of ['check', 'fresh']) assert.deepEqual(finishReview(report([{ decision: 'structural-behavior' }]), directory, mode), { ok: false, unknownCount: 0, fresh: false, changedRecords: null, differences: [{ kind: 'missing-saved-report' }] });
  assert.deepEqual(fs.readdirSync(directory), []);
  assert.throws(() => finishReview({ records: [{ decision: 'unknown' }], unknownCount: 0 }, directory, 'check'), /does not match/);
}));

test('a fresh saved report differs only in its generation time; check still requires zero unknowns', () => fixture(directory => {
  const records = [{ path: 'app/page.tsx', line: 4, argumentHash: 'a', decision: 'business-data' }, { path: 'app/page.tsx', line: 9, argumentHash: 'b', decision: 'unknown' }];
  finishReview(report(records), directory, 'write');
  const before = snapshot(directory), later = report(structuredClone(records), { generatedAt: '2026-10-17T09:30:00.000Z' });
  assert.deepEqual(finishReview(later, directory, 'fresh'), { ok: true, unknownCount: 1, fresh: true, changedRecords: 0, differences: [] });
  assert.deepEqual(finishReview(later, directory, 'check'), { ok: false, unknownCount: 1, fresh: true, changedRecords: 0, differences: [] });
  unchanged(directory, before);
}));

test('fresh names a changed decision, a changed source fingerprint and an edited unknown list', () => fixture(directory => {
  const records = [{ path: 'app/page.tsx', line: 4, argumentHash: 'a', decision: 'business-data' }, { path: 'app/page.tsx', line: 9, argumentHash: 'b', decision: 'unknown' }];
  finishReview(report(records), directory, 'write');
  const decision = finishReview(report([{ ...records[0], decision: 'unknown' }, records[1]]), directory, 'fresh');
  assert.equal(decision.ok, false);
  assert.deepEqual(decision.differences.filter(row => row.kind === 'record'), [{ kind: 'record', index: 0, path: 'app/page.tsx', line: 4, fields: ['decision'] }]);
  const source = finishReview(report(structuredClone(records), { fileHashes: [{ path: 'app/page.tsx', hash: 'source-b' }] }), directory, 'fresh');
  assert.deepEqual(source.differences, [{ kind: 'source', path: 'app/page.tsx', saved: 'source-a', fresh: 'source-b' }]);
  fs.writeFileSync(path.join(directory, 'maison-style-unknowns.json'), '[]\n');
  assert.deepEqual(finishReview(report(structuredClone(records)), directory, 'fresh'), { ok: false, unknownCount: 1, fresh: false, changedRecords: 0, differences: [{ kind: 'unknown-list' }] });
}));

test('fresh compares bytes, so a hand-reformatted saved report is not fresh', () => fixture(directory => {
  const records = [{ path: 'app/page.tsx', line: 4, argumentHash: 'a', decision: 'business-data' }];
  finishReview(report(records), directory, 'write');
  const file = path.join(directory, 'maison-style-decisions.json');
  fs.writeFileSync(file, JSON.stringify(JSON.parse(fs.readFileSync(file, 'utf8'))) + '\n');
  assert.deepEqual(finishReview(report(structuredClone(records)), directory, 'fresh').differences, [{ kind: 'serialization' }]);
}));

test('review mode is explicit and rejects combined or unsupported arguments', () => {
  assert.equal(reviewMode([]), 'write');
  assert.equal(reviewMode(['--write']), 'write');
  assert.equal(reviewMode(['--check']), 'check');
  assert.equal(reviewMode(['--fresh']), 'fresh');
  assert.throws(() => reviewMode(['--write', '--check']), /Usage/);
  assert.throws(() => reviewMode(['--fresh', '--check']), /Usage/);
  assert.throws(() => reviewMode(['--strict']), /Usage/);
  assert.throws(() => finishReview(report([]), taskTmp, 'strict'), /Invalid review mode/);
});
