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
const report = records => ({ version: 1, records, unknownCount: records.filter(record => record.decision === 'unknown').length });

test('check rejects a newly unresolved argument without overwriting previously clean artifacts', () => fixture(directory => {
  const clean = report([{ argumentHash: 'old', decision: 'token-reference-verified' }]);
  finishReview(clean, directory, 'write');
  const before = new Map(fs.readdirSync(directory).map(file => [file, fs.readFileSync(path.join(directory, file))]));
  const changed = report([...clean.records, { argumentHash: 'new-literal', decision: 'unknown' }]);
  assert.deepEqual(finishReview(changed, directory, 'check'), { ok: false, unknownCount: 1 });
  for (const [file, bytes] of before) assert.deepEqual(fs.readFileSync(path.join(directory, file)), bytes);
}));

test('clean check is read-only even when no stored review artifacts exist', () => fixture(directory => {
  assert.deepEqual(finishReview(report([{ decision: 'structural-behavior' }]), directory, 'check'), { ok: true, unknownCount: 0 });
  assert.deepEqual(fs.readdirSync(directory), []);
  assert.throws(() => finishReview({ records: [{ decision: 'unknown' }], unknownCount: 0 }, directory, 'check'), /does not match/);
}));

test('review mode is explicit and rejects combined or unsupported arguments', () => {
  assert.equal(reviewMode([]), 'write');
  assert.equal(reviewMode(['--write']), 'write');
  assert.equal(reviewMode(['--check']), 'check');
  assert.throws(() => reviewMode(['--write', '--check']), /Usage/);
  assert.throws(() => reviewMode(['--strict']), /Usage/);
});
