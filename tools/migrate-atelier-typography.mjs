import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { codeFiles } from '../source/component-registry-core.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), PRODUCT = resolve(ROOT, '../Q-Atelier');
const ts = createRequire(join(PRODUCT, 'package.json'))('typescript');
const hash = value => createHash('sha256').update(value).digest('hex');
const HELPERS = new Set(['labelTracking', 'labelWordSpacing', 'labelCase']);
const PROPERTIES = new Set(['fontStyle', 'textTransform', 'textDecoration', 'wordSpacing']);
const keyFor = value => 'v' + hash(JSON.stringify(value)).slice(0, 10);

export function transformTypography(file, code) {
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [], tracking = new Map(), styles = new Map(), moved = [], helperNames = new Map();
  let needsText = false;
  const record = (node, text, reason, value) => edits.push({ start: node.getStart(sf), end: node.end, text,
    line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, reason, value });
  for (const statement of sf.statements) if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)
    && /(?:^@\/lib\/design\/tokens$|^\.\/tokens$|\/design\/tokens$)/.test(statement.moduleSpecifier.text)) {
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    const selected = bindings.elements.filter(spec => HELPERS.has(spec.propertyName?.text ?? spec.name.text));
    if (!selected.length) continue;
    const kept = bindings.elements.filter(spec => !selected.includes(spec));
    for (const spec of selected) { moved.push(spec.getText(sf)); helperNames.set(spec.name.text, spec.propertyName?.text ?? spec.name.text); }
    record(statement, kept.length ? `import { ${kept.map(spec => spec.getText(sf)).join(', ')} } from ${statement.moduleSpecifier.getText(sf)};` : '', 'central-label-import', selected.map(spec => spec.getText(sf)));
  }
  const confirmed = node => {
    for (let current = node.parent; current; current = current.parent) {
      if (ts.isJsxAttribute(current)) return current.name.getText(sf) === 'style';
      if ((ts.isVariableDeclaration(current) || ts.isFunctionLike(current)) && current.type && /^(?:React\.)?CSSProperties$/.test(current.type.getText(sf))) return true;
      if ((ts.isAsExpression(current) || ts.isSatisfiesExpression(current)) && /^(?:React\.)?CSSProperties$/.test(current.type.getText(sf))) return true;
      if (ts.isFunctionLike(current) || ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) return false;
    }
    return false;
  };
  const captureStyle = (node, property) => {
    if (ts.isConditionalExpression(node)) { captureStyle(node.whenTrue, property); captureStyle(node.whenFalse, property); return; }
    if (!ts.isStringLiteralLike(node) || /var\(/.test(node.text) || !node.text) return;
    const key = keyFor(node.text); styles.set(`${property}.${key}`, node.text); needsText = true;
    record(node, `QDText.${property}.${key}`, 'central-typography-value', { property, value: node.text, key });
  };
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && helperNames.get(node.expression.text) === 'labelTracking' && node.arguments.length > 1) {
      const value = node.arguments[1];
      if (ts.isNumericLiteral(value) || ts.isStringLiteralLike(value) && !/var\(/.test(value.text)) {
        const original = ts.isNumericLiteral(value) ? Number(value.text) : value.text;
        const key = keyFor(original); tracking.set(key, original); needsText = true;
        record(value, `QDText.tracking.${key}`, 'central-latin-label-tracking', { value: original, key });
      }
    }
    if (ts.isPropertyAssignment(node) && confirmed(node)) {
      const property = node.name.getText(sf).replace(/^['"]|['"]$/g, '');
      if (PROPERTIES.has(property)) captureStyle(node.initializer, property);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (needsText && /\b(?:const|let|function|class|import)\s+QDText\b/.test(code)) throw new Error(`QDText collision in ${file}`);
  const imports = [...moved, ...(needsText ? ['QDText'] : [])];
  if (imports.length) {
    const first = sf.statements.find(statement => ts.isImportDeclaration(statement));
    const at = first?.getStart(sf) ?? sf.statements.find(statement => !ts.isExpressionStatement(statement))?.getStart(sf) ?? 0;
    edits.push({ start: at, end: at, text: `import { ${imports.join(', ')} } from '@/lib/design/q-design-labels';\n`, reason: 'central-typography-module', line: sf.getLineAndCharacterOfPosition(at).line + 1 });
  }
  let output = code;
  for (const edit of edits.slice().sort((a, b) => b.start - a.start || b.end - a.end)) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  return { output, tracking, styles, edits: edits.map(({ start, end, text, ...entry }) => entry) };
}

export function typographySource(tracking, styles) {
  const grouped = {};
  for (const [path, value] of [...styles].sort(([a], [b]) => a.localeCompare(b))) { const [property, key] = path.split('.'); (grouped[property] ??= {})[key] = value; }
  const values = { tracking: Object.fromEntries([...tracking].sort(([a], [b]) => a.localeCompare(b))), ...grouped };
  return `// Q-Design owns UI label typography. Language detection remains in the locked pure helper.\nimport { hasHangul } from '@/lib/design/tokens';\n\nexport const QDText = ${JSON.stringify(values, null, 2)} as const;\n\nexport const LABEL = {\n  defaultTracking: '0.08em',\n  hangulTracking: 0,\n  hangulWordSpacing: '-0.35em',\n  hangulCase: 'none',\n  latinCase: 'uppercase',\n} as const;\n\nexport function labelTracking(node: unknown, value: number | string = LABEL.defaultTracking): number | string {\n  return hasHangul(node) ? LABEL.hangulTracking : value;\n}\n\nexport function labelWordSpacing(node: unknown): string | undefined {\n  return hasHangul(node) ? LABEL.hangulWordSpacing : undefined;\n}\n\nexport function labelCase(node: unknown): typeof LABEL.hangulCase | typeof LABEL.latinCase {\n  return hasHangul(node) ? LABEL.hangulCase : LABEL.latinCase;\n}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const write = process.argv.includes('--write'), ledgerPath = join(ROOT, 'source/style-adapters/atelier-typography.json');
  if (write && existsSync(ledgerPath)) throw new Error('Never replace historical migration evidence');
  const manifest = JSON.parse(readFileSync(join(PRODUCT, 'lib/engine/validation-manifest.generated.json'), 'utf8'));
  const protectedFiles = new Set(Object.values(manifest).flatMap(engine => Object.keys(engine.dependencies)));
  const tracking = new Map(), styles = new Map(), files = [];
  for (const file of codeFiles(PRODUCT).filter(file => file.endsWith('.tsx') && !protectedFiles.has(file))) {
    const before = readFileSync(join(PRODUCT, file), 'utf8'); if (before.includes('q-design-header-end')) continue;
    const transformed = transformTypography(file, before); if (!transformed.edits.length) continue;
    for (const [key, value] of transformed.tracking) tracking.set(key, value);
    for (const [key, value] of transformed.styles) styles.set(key, value);
    files.push({ path: file, beforeHash: hash(before), afterHash: hash(transformed.output), conversions: transformed.edits });
    if (write) {
      const backup = join(ROOT, '../tmp/atelier-typography-backup', file); mkdirSync(dirname(backup), { recursive: true });
      writeFileSync(backup, before); writeFileSync(join(PRODUCT, file), transformed.output);
    }
  }
  const canonical = typographySource(tracking, styles);
  const ledger = { version: 1, scope: 'UI-only label imports and proven CSSProperties typography. Locked helpers, engine dependencies, business data and dynamic caller values remain unchanged.', canonical: 'patterns/foundation/atelier-labels.ts', files };
  writeFileSync(write ? ledgerPath : join(ROOT, '../tmp/atelier-typography-dry.json'), JSON.stringify(ledger, null, 2) + '\n');
  writeFileSync(write ? join(ROOT, ledger.canonical) : join(ROOT, '../tmp/atelier-labels-dry.ts'), canonical);
  console.log(JSON.stringify({ write, files: files.length, conversions: files.reduce((n, file) => n + file.conversions.length, 0), tracking: tracking.size, styles: styles.size }));
}
