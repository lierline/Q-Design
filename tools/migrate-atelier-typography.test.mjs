import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { transformTypography, typographySource } from './migrate-atelier-typography.mjs';
import { normalizeTypographyReferences } from './atelier-runtime-values.mjs';
const ROOT = 'D:/Claude/Q-Design', PRODUCT = 'D:/Claude/Q-Atelier';
const require = createRequire(PRODUCT + '/package.json'), ts = require('typescript');
const hash = value => createHash('sha256').update(value).digest('hex');
function load(code, dependencies = {}) {
  const module = { exports: {} }, compiled = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('require', 'exports', 'module', compiled)(name => dependencies[name] ?? require(name), module.exports, module);
  return module.exports;
}
function semantic(code) {
  const sf = ts.createSourceFile('x.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const serialize = node => ({ kind: node.kind,
    ...(ts.isIdentifier(node) || ts.isStringLiteralLike(node) ? { text: node.text } : {}),
    ...(ts.isNumericLiteral(node) ? { number: Number(node.text) } : {}),
    children: children(node).map(serialize) });
  const children = node => { const result = []; ts.forEachChild(node, child => { if (!ts.isImportDeclaration(child)) result.push(child); }); return result; };
  return serialize(sf);
}

test('only imported UI label helpers and proven style objects migrate; data and arbitrary helpers remain intact', () => {
  const code = `import { T, labelTracking as tracking } from '@/lib/design/tokens';
    const business = { fontStyle: 'italic' }; function f() { return <label style={{ letterSpacing: tracking('EN', 1.5), textTransform: active ? 'uppercase' : 'none' }} />; }`;
  const result = transformTypography('components/Foo.tsx', code);
  assert.match(result.output, /labelTracking as tracking.*QDText.*q-design-labels/);
  assert.match(result.output, /letterSpacing: tracking\('EN', QDText\.tracking\./);
  assert.match(result.output, /const business = \{ fontStyle: 'italic' \}/);
  assert.match(result.output, /active \? QDText\.textTransform\./);
  assert.equal(result.tracking.size, 1); assert.equal(result.styles.size, 2);
  assert.equal(transformTypography('x.tsx', `import { labelTracking } from './unrelated'; const x = labelTracking('EN', 12);`).output,
    `import { labelTracking } from './unrelated'; const x = labelTracking('EN', 12);`);
});

test('migration preserves executable data and conditions when its exact central values are substituted', () => {
  const before = `import { T, labelTracking, labelCase } from '@/lib/design/tokens';
    const record = { textTransform: 'business-enum', fontStyle: 'source-document-metadata' };
    function Field({ active, text }) {
      return <label style={{ color: T.text, fontStyle: active ? 'italic' : 'normal',
        letterSpacing: labelTracking(text, 1.5), textTransform: labelCase(text) }} onClick={() => save(record)}>{text}</label>;
    }`;
  const result = transformTypography('components/Field.tsx', before);
  const values = load(typographySource(result.tracking, result.styles), { '@/lib/design/tokens': { hasHangul: () => false } }).QDText;
  const restored = result.output.replace(/QDText\.([a-zA-Z]+)\.([a-zA-Z0-9]+)/g, (_, property, key) => JSON.stringify(values[property][key]));
  assert.deepEqual(semantic(restored), semantic(before));
  const changed = restored.replace('save(record)', 'save({ changed: true })');
  assert.notDeepEqual(semantic(changed), semantic(before));
});

test('central label adapter preserves Hangul/reset behavior and central mutations propagate', () => {
  const tokens = load(fs.readFileSync(PRODUCT + '/lib/design/tokens.ts', 'utf8'));
  const source = fs.readFileSync(ROOT + '/patterns/foundation/atelier-labels.ts', 'utf8');
  const helpers = load(source, { '@/lib/design/tokens': tokens });
  for (const label of ['한글', '한글 EN', 'Latin', '', 123, null, ['EN', '한국'], { props: { children: '한글' } }]) {
    assert.equal(helpers.labelTracking(label), tokens.labelTracking(label));
    assert.equal(helpers.labelTracking(label, 1.5), tokens.labelTracking(label, 1.5));
    assert.equal(helpers.labelWordSpacing(label), tokens.labelWordSpacing(label));
    assert.equal(helpers.labelCase(label), tokens.labelCase(label));
  }
  const changed = source.replace("defaultTracking: '0.08em'", "defaultTracking: '0.2em'").replace("hangulWordSpacing: '-0.35em'", "hangulWordSpacing: '-0.25em'");
  assert.notEqual(changed, source);
  const updated = load(changed, { '@/lib/design/tokens': tokens });
  assert.equal(updated.labelTracking('English'), '0.2em');
  assert.equal(updated.labelTracking('한글'), 0);
  assert.equal(updated.labelWordSpacing('한글'), '-0.25em');
  assert.throws(() => normalizeTypographyReferences('QDText.tracking.missing', ROOT), /Unknown typography adapter/);
  assert.match(typographySource(new Map([['example', 1.5]]), new Map([['fontStyle.example', 'italic']])), /"example": 1.5/);
});
