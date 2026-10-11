import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { canonicalBody, centralOutputs, copyProblems, isCompiledWorkbench, isTestSource, keyframesIn } from './audit-coverage-core.mjs';

const css = '@keyframes qd-pulse { to { opacity: .6 } }\n';
const part = { src: 'patterns/components.css', to: { Atelier: 'D:/product/app/q-design.components.css' } };
const stamped = (item, source) => {
  const body = canonicalBody(item, source);
  const fingerprint = createHash('sha256').update(body).digest('hex');
  return item.lang === 'ts'
    ? `// q-design-nav-sha256: ${fingerprint}\n// q-design-header-end\n${body}`
    : `/* q-design-nav-sha256: ${fingerprint} */\n${body}`;
};

test('only explicit test artifacts leave runtime coverage', () => {
  for (const path of ['lib/design/modal-focus.test.ts', 'lib/design/q-design-adapter.test.tsx', 'lib/__tests__/dialog.tsx', 'app/widget.spec.tsx']) assert.equal(isTestSource(path), true, path);
  for (const path of ['lib/design/modal-focus.ts', 'lib/design/q-design-contract.ts', 'app/test/page.tsx', 'components/TestButton.tsx']) assert.equal(isTestSource(path), false, path);
});

test('central ownership uses exact destinations and does not hide similarly named native files', () => {
  const outputs = centralOutputs([part], 'Atelier', 'D:/product');
  assert.deepEqual(outputs.map(item => item.path), ['app/q-design.components.css']);
  const known = new Set(outputs.map(item => item.path));
  assert.equal(known.has('app/q-design.local.css'), false);
  assert.equal(known.has('lib/design/q-design-contract.ts'), false);
  assert.throws(() => centralOutputs([part], 'Atelier', 'D:/elsewhere'), /outside product root/);
});

test('canonical CSS, raw palette and TS copies are checked separately with their real wrapping', () => {
  for (const item of [part, { ...part, layer: false }, { ...part, lang: 'ts' }]) {
    const source = item.lang === 'ts' ? '// public helper\nexport const ready = true;\n' : css;
    assert.deepEqual(copyProblems(item, source, stamped(item, source)), []);
    assert.deepEqual(copyProblems(item, source, stamped(item, source).replace(/\n/g, '\r\n')), []);
    assert.deepEqual(copyProblems(item, source.replace(/\n/g, '\r\n'), stamped(item, source)), []);
  }
});

test('missing copies, modified body and forged fingerprint each fail', () => {
  assert.deepEqual(copyProblems(part, null, ''), ['canonical source missing']);
  assert.deepEqual(copyProblems(part, css, null), ['product copy missing']);
  assert.ok(copyProblems(part, css, stamped(part, css).replace('opacity: .6', 'opacity: .9')).includes('canonical body differs'));
  assert.ok(copyProblems(part, css, stamped(part, css).replace(/sha256: [a-f0-9]{64}/, `sha256: ${'0'.repeat(64)}`)).includes('canonical fingerprint differs'));
  assert.ok(copyProblems(part, css, canonicalBody(part, css)).includes('canonical fingerprint differs'));
});

test('standalone offline HTML keeps a real HTML stamp and verifies the complete bundled page', () => {
  const item={...part,lang:'html',layer:false};
  const source='<!doctype html><html><style>:root{--qd-bg:#fff}</style><body>Offline</body></html>\n';
  const fingerprint=createHash('sha256').update(source).digest('hex');
  const copy=`<!-- Q-Design source: offline.html\nq-design-nav-sha256: ${fingerprint}\n-->\n${source}`;
  assert.equal(canonicalBody(item,source),source);
  assert.deepEqual(copyProblems(item,source,copy),[]);
  assert.ok(copyProblems(item,source,copy.replace('Offline','Untracked edit')).includes('canonical body differs'));
});

test('commented keyframes cannot make the source inventory appear complete', () => {
  assert.deepEqual(keyframesIn(`/* @keyframes invented {} */\n${css}`), ['qd-pulse']);
});

test('compiled workbench exclusion cannot suppress its authored fixtures or similarly named paths', () => {
  for (const path of ['preview/components', 'preview/components/atelier/assets/index.js', 'preview\\components\\maison\\index.html']) assert.equal(isCompiledWorkbench(path), true, path);
  for (const path of ['preview/fixtures/atelier.tsx', 'preview/components.html', 'preview/components-other/file.js', 'tools/preview/components/file.js', 'preview/screens/components/report.json']) assert.equal(isCompiledWorkbench(path), false, path);
});
