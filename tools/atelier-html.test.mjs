import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { resolve } from 'node:path';
import { resolveHtmlPalette, resolveHtmlMetrics, buildHtmlPalette } from './build-atelier-html.mjs';
import { readInputs } from './build-palette.mjs';
const ROOT = resolve(import.meta.dirname, '..');
const ts = createRequire(import.meta.url)('typescript');
// 업무 템플릿은 커밋본에서 떠 온 고정 사본을 읽습니다(fixtures/atelier-html/SOURCE.md).
const FIXTURES = resolve(ROOT, 'tools/fixtures/atelier-html');
const read = file => readFileSync(resolve(ROOT, file), 'utf8');
function load(file, dependencies) {
  const module = { exports: {} };
  const output = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  runInNewContext(output, { module, exports: module.exports, process: { env: { NEXT_PUBLIC_APP_URL: 'https://www.qatelier.co.kr' } }, console, URL,
    require: name => { if (!(name in dependencies)) throw new Error(`Unstubbed import ${name}`); return dependencies[name]; } }, { filename: file });
  return module.exports;
}
const generated = load(resolve(ROOT, 'dist/q-design.html-palette.atelier.ts'), {});
const canon = load(resolve(ROOT, 'patterns/foundation/atelier-html.ts'), { './q-design-html-palette': generated });
function templates(palette = generated.HTML_PALETTE, metrics = generated.HTML_METRICS) {
  const styles = { HTML_STYLE: canon.buildHtmlStyles(palette, metrics), EXPORT_STYLE: canon.buildExportStyles(palette, metrics) };
  const shared = { '@/lib/design/q-design-html': styles, '@/lib/design/q-design-html-palette': { HTML_PALETTE: palette } };
  return {
    email: load(resolve(FIXTURES, 'email.ts'), { ...shared,
      '@/lib/reviews/due': { describeDue: () => ({ has: true, tone: 'urgent', label: '3일' }) },
      '@/lib/date': { dateOnly: value => value }, '@/lib/observability/external-fetch': {}, '@/lib/observability/service-failure': {},
    }),
    export: load(resolve(FIXTURES, 'org-export.ts'), { ...shared, pizzip: {}, '@/lib/supabase/fetch-all-pages': {}, '@/lib/audit/retention': { AUDIT_RETENTION_YEARS: 10 } }),
  };
}
const request = { assessmentCode: '<CODE>', assessmentTitle: '<script>alert(1)</script>', requesterName: 'A & "B"', notes: '<img src=x onerror=bad()>', assignmentId: 'fixture', dueAt: '2026-10-13' };
const exportArgs = [{ orgName: '<script>bad()</script>', requesterName: 'A & B', requesterEmail: 'fixture@example.test' },
  { tables: [{ table: '<table>', rows: 2 }], excluded: [{ table: 'private', why: '<img src=x>' }], files: [], missingFiles: [] },
  { dbStartedAt: '2026-10-10', dbEndedAt: '2026-10-10', filesStartedAt: '2026-10-10', filesEndedAt: '2026-10-10' },
  { tables: 1, rows: 2, files: 0, bytes: 0 }];

test('actual email and export retain escaped content and concrete client-compatible CSS', () => {
  const t = templates();
  const html = t.email.reviewRequestEmail(request);
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(html.includes('A &amp; &quot;B&quot;'));
  assert.ok(html.includes('&lt;img src=x onerror=bad()&gt;'));
  assert.doesNotMatch(html, /<script>|<img src=x|var\(--|linear-gradient|border-left|box-shadow/);
  assert.match(html, /border-radius:10px/); assert.match(html, /min-height:44px/);
  assert.doesNotMatch(html, /font-size:(?:10|11)px/);
  const exported = t.export.renderReadme(...exportArgs);
  assert.ok(exported.includes('&lt;script&gt;bad()&lt;/script&gt;'));
  assert.ok(exported.includes('&lt;table&gt;'));
  assert.ok(exported.includes('ISO 13485'));
  assert.doesNotMatch(exported, /<script>|var\(--/);
});

test('shared palette override mutation reaches actual email and export output', () => {
  const inputs = structuredClone(readInputs(ROOT));
  inputs[2].shared.light['--qa-text'] = '#111111';
  const mappings = JSON.parse(read('patterns/foundation/atelier-html-palette.json'));
  const palette = resolveHtmlPalette(inputs, mappings);
  assert.equal(palette.text, '#111111');
  const t = templates(palette);
  assert.match(t.email.reviewRequestEmail(request), /color:#111111/);
  assert.match(t.export.renderReadme(...exportArgs), /color:#111111/);
});

test('shared radius, control, typography and font changes reach actual HTML without CSS variables', () => {
  const components = read('patterns/components.css').replace('--qd-radius: 10px', '--qd-radius: 14px').replace('--qd-control-height: 44px', '--qd-control-height: 48px').replace('--qd-caption-size: 12px', '--qd-caption-size: 15px');
  const foundation = read('patterns/foundation.css').replace(/--qd-font-family-mono:[^;]+;/, "--qd-font-family-mono: 'Example Mono', monospace;");
  const metrics = resolveHtmlMetrics(components, foundation);
  const t = templates(generated.HTML_PALETTE, metrics);
  const html = t.email.reviewRequestEmail(request);
  for (const value of ['border-radius:14px', 'min-height:48px', 'font-size:15px', "font-family:'Example Mono'"]) assert.ok(html.includes(value), value);
  assert.match(t.export.renderReadme(...exportArgs), /border-radius:14px/);
});

test('dynamic style colors reject HTML/CSS injection and stale output is detectable', () => {
  assert.throws(() => canon.HTML_STYLE.deadlinePanel('#ffffff', 'red;" onmouseover="bad()'), /canonical six-digit hex/);
  assert.throws(() => resolveHtmlPalette(readInputs(ROOT), { bad: { value: 'red;position:absolute', reason: 'invalid' } }), /Invalid concrete/);
  buildHtmlPalette(ROOT, { check: true });
});

test('quoted canonical font names remain safe in inline attributes and raw in export stylesheets', () => {
  const metrics = { ...generated.HTML_METRICS, fontUI: '"Example & Sons", sans-serif' };
  const t = templates(generated.HTML_PALETTE, metrics);
  assert.match(t.email.reviewRequestEmail(request), /font-family:&quot;Example &amp; Sons&quot;, sans-serif/);
  assert.match(t.export.renderReadme(...exportArgs), /font-family:"Example & Sons", sans-serif/);
});
