import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { transformStyleFragments } from './migrate-atelier-style-fragments.mjs';
import { beforeLedgerSource } from './atelier-ledger-pattern-sources.mjs';
const defaults = new Map([['--qd-border-width', '1px'], ['--qd-border-width-2', '2px']]);

test('border templates centralize only literal fragments, preserving conditions and runtime color', () => {
  const source = 'const view = <div style={{border: active ? `1px solid ${color}` : `2px dashed ${other}`, flex: "0 1 300px", scrollMarginTop: 72}} />;';
  const result = transformStyleFragments('view.tsx', source, defaults);
  assert.match(result.output, /active \? `var\(--qd-border-width\)/);
  assert.match(result.output, /: `var\(--qd-border-width-2\)/);
  assert.match(result.output, /\$\{color\}/); assert.match(result.output, /\$\{other\}/);
  assert.ok([...result.parameters.values()].includes('solid'));
  assert.ok([...result.parameters.values()].includes('dashed'));
  assert.ok([...result.parameters.values()].includes('0 1 300px'));
  assert.ok([...result.parameters.values()].includes('72px'));
});

test('business objects, nested callbacks and measured geometry are unchanged', () => {
  const source = 'const data = { width: 300, flex: "0 1 300px" }; const view = <div style={{width: measured, border: `${measured}px solid ${color}`, padding: 0, ...rows.map(() => ({width: 300}))}} />;';
  const result = transformStyleFragments('view.tsx', source, defaults);
  assert.match(result.output, /const data = \{ width: 300, flex: "0 1 300px" \}/);
  assert.match(result.output, /width: measured/); assert.match(result.output, /\$\{measured\}px/);
  assert.match(result.output, /padding: 0/); assert.match(result.output, /rows\.map\(\(\) => \(\{width: 300\}\)\)/);
  assert.equal(result.edits.length, 1);
});

test('typed return styles preserve numeric flex semantics and literal reset values', () => {
  const result = transformStyleFragments('view.tsx', 'function make(): CSSProperties { return { flex: 1, margin: 0, border: "none" }; }', defaults);
  assert.ok([...result.parameters.values()].includes('1'));
  assert.ok(![...result.parameters.values()].includes('1px'));
  assert.match(result.output, /margin: 0, border: "none"/);
});

test('every recorded migrated fragment still has the exact central default and a source reference', () => {
  const ledgerPath = new URL('../source/style-adapters/atelier-style-fragments.json', import.meta.url);
  if (!existsSync(ledgerPath)) return;
  const definitions = new Map(defaults);
  for (const file of ['foundation/atelier-values.css', 'foundation/atelier-core-values.css']) for (const match of readFileSync(new URL('../patterns/' + file, import.meta.url), 'utf8').matchAll(/(--qd-[\w-]+)\s*:\s*([^;{}]+);/g)) definitions.set(match[1], match[2].trim());
  const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
  for (const file of ledger.files) {
    // The ledger pattern layer (2026-10-15) later replaced some migrated boxes with shared parts.
    // This migration record is checked on the exact earlier source; later code has its own decisions.
    const code = beforeLedgerSource(file.path, readFileSync('D:/Claude/Q-Atelier/' + file.path, 'utf8'));
    for (const edit of file.conversions) for (const value of edit.values) {
      assert.equal(definitions.get(value.token), value.value, file.path + ':' + edit.line);
      assert.ok(code.includes(`var(${value.token})`), file.path + ':' + edit.line);
    }
  }
});
