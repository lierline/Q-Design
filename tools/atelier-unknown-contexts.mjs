import fs from 'node:fs';
import { createRequire } from 'node:module';
import { hash } from './style-arguments-core.mjs';

const ROOT = 'D:/Claude/Q-Design', PRODUCT = 'D:/Claude/Q-Atelier';
const ts = createRequire(PRODUCT + '/package.json')('typescript');
const review = JSON.parse(fs.readFileSync(ROOT + '/reviews/atelier-style-decisions.json', 'utf8'));
const groups = new Map();
for (const record of review.records.filter(row => row.decision === 'unknown')) {
  if (!groups.has(record.path)) groups.set(record.path, []);
  groups.get(record.path).push(record);
}
const records = [];
for (const [file, rows] of groups) {
  const code = fs.readFileSync(PRODUCT + '/' + file, 'utf8'), currentHash = hash(code);
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const confirmed = new Set();
  function isStyle(node) {
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (ts.isJsxAttribute(parent)) return parent.name.getText(sf) === 'style';
      if ((ts.isVariableDeclaration(parent) || ts.isAsExpression(parent) || ts.isSatisfiesExpression(parent) || ts.isFunctionLike(parent))
        && parent.type && /CSSProperties\b/.test(parent.type.getText(sf))) return true;
      if (ts.isFunctionLike(parent) || ts.isJsxElement(parent) || ts.isJsxSelfClosingElement(parent)) return false;
    }
    return false;
  }
  function walk(node) {
    if ((ts.isPropertyAssignment(node) || ts.isSpreadAssignment(node)) && isStyle(node)) {
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      const property = ts.isSpreadAssignment(node) ? '...' : node.name.getText(sf).replace(/^['"]|['"]$/g, '');
      const value = (ts.isSpreadAssignment(node) ? node.expression : node.initializer).getText(sf);
      confirmed.add(JSON.stringify([line, property, value]));
    }
    ts.forEachChild(node, walk);
  }
  if (/\.[jt]sx?$/.test(file)) walk(sf);
  for (const row of rows) {
    let context = 'unresolved-consumer';
    if (currentHash !== row.sourceHash) context = 'source-changed-rescan-required';
    else if (row.kind === 'style-expression') context = 'direct-jsx-style';
    else if (confirmed.has(JSON.stringify([row.line, row.property, row.value]))) context = 'confirmed-style-object';
    else if (['css-declaration', 'css-at-rule'].includes(row.kind)) context = 'authored-css';
    else if (row.kind === 'dynamic-style' && !['embedded-interpolation', 'embedded-script'].includes(row.property)) context = 'dom-style-write';
    else if (row.kind === 'svg-geometry') context = 'svg-artwork-or-data-geometry';
    else if (['class-utility', 'class-expression'].includes(row.kind)) context = 'selector-or-variant';
    else if (row.kind === 'presentation-attribute') context = 'component-prop-needs-consumer-trace';
    records.push({ path: file, line: row.line, argumentHash: row.argumentHash, sourceHash: row.sourceHash, currentHash,
      kind: row.kind, property: row.property, value: row.value, context });
  }
}
const counts = {}, kinds = {};
for (const row of records) { counts[row.context] = (counts[row.context] ?? 0) + 1; kinds[row.kind] = (kinds[row.kind] ?? 0) + 1; }
const confirmedStyleArguments = records.filter(row => ['direct-jsx-style', 'confirmed-style-object', 'authored-css', 'dom-style-write'].includes(row.context)).length;
const report = { createdAt: new Date().toISOString(), sourceReview: 'reviews/atelier-style-decisions.json',
  note: 'Context inventory only, not adjudication. Confirmed styles can contain central runtime compositions; counts do not equal remaining hardcoded defaults. Unresolved consumers and changed sources are never exempt.',
  unknown: records.length, confirmedStyleArguments, confirmedStylePercent: Math.round(confirmedStyleArguments / records.length * 1000) / 10,
  kinds, counts, records };
fs.writeFileSync(ROOT + '/reviews/atelier-unknown-contexts.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, records: undefined }, null, 2));
