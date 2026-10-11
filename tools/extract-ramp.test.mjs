import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
test('ramp reads committed imported palettes for the three selected products without writing', () => {
  const output = new URL('../dist/q-design.ramp.css', import.meta.url);
  const before = readFileSync(output, 'utf8');
  const run = spawnSync(process.execPath, ['tools/extract-ramp.mjs', '--only=Q-Atelier,Q-Works,Q-Forge'], {cwd:root, encoding:'utf8'});
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Q-Works/);
  assert.doesNotMatch(run.stdout, /Q-Sonar/);
  assert.equal(readFileSync(output, 'utf8'), before);
});
