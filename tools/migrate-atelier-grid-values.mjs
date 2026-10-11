// Explicitly reviewed CSS grid tracks. Business widths and measured data are not inferred.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { codeFiles } from '../source/component-registry-core.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const product = resolve(ROOT, '../Q-Atelier');
const ts = createRequire(join(product, 'package.json'))('typescript');
const digest = value => createHash('sha256').update(value.replaceAll('\r\n', '\n')).digest('hex');

export function transformGridValues(path, code) {
  const source = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [], parameters = new Map();
  const name = node => node.getText(source);
  function contextOf(node, property) {
    for (let current = node.parent; current; current = current.parent) {
      if (ts.isJsxAttribute(current)) {
        if (name(current.name) === 'style') return 'React style object';
        const tag = current.parent.parent.tagName;
        if (property === 'width' && name(current.name) === 'columns' && tag && name(tag) === 'DataTable') return 'DataTable columns JSX';
        return null;
      }
      if (ts.isVariableDeclaration(current) && current.type) {
        const type = name(current.type);
        if (/(?:^|\.)CSSProperties\b/.test(type)) return 'Typed CSSProperties';
        if (property === 'width' && /^DataTableColumn</.test(type)) return 'Typed DataTableColumn width';
      }
      if (ts.isAsExpression(current) && /(?:^|\.)CSSProperties\b/.test(name(current.type))) return 'CSSProperties cast';
      if (ts.isFunctionLike(current) || ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) return null;
    }
    return null;
  }
  function capture(node, property, context) {
    if (ts.isConditionalExpression(node)) { capture(node.whenTrue, property, context); capture(node.whenFalse, property, context); return; }
    if (!ts.isStringLiteralLike(node) || !node.text.trim() || /var\(|^(?:inherit|initial|unset|revert|none|auto)$/.test(node.text)) return;
    const token = `--qd-atelier-${property.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}-${digest(property + ':' + node.text).slice(0, 10)}`;
    parameters.set(token, node.text);
    edits.push({ start: node.getStart(source), end: node.end, property, value: node.text, token, context,
      line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
  }
  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const property = name(node.name).replace(/^['"]|['"]$/g, '');
      if (['gridTemplateColumns', 'gridTemplateRows', 'width'].includes(property)) {
        const context = contextOf(node, property);
        if (context) capture(node.initializer, property, context);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  let output = code;
  for (const edit of edits.slice().sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + JSON.stringify(`var(${edit.token})`) + output.slice(edit.end);
  return { output, parameters, edits: edits.map(({ start, end, ...entry }) => entry) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const write = process.argv.includes('--write');
  const ledgerPath = join(ROOT, 'source/style-adapters/atelier-grid-values.json');
  if (write && existsSync(ledgerPath)) throw new Error('Existing grid migration must not be overwritten');
  const manifest = JSON.parse(readFileSync(join(product, 'lib/engine/validation-manifest.generated.json'), 'utf8'));
  const protectedFiles = new Set(Object.values(manifest).flatMap(engine => Object.keys(engine.dependencies)));
  const files = [], tokens = new Map();
  for (const path of codeFiles(product).filter(path => /\.tsx$/.test(path) && !protectedFiles.has(path))) {
    const code = readFileSync(join(product, path), 'utf8');
    if (code.includes('q-design-header-end')) continue; // Never rewrite generated copies.
    const result = transformGridValues(path, code);
    if (!result.edits.length) continue;
    for (const [token, value] of result.parameters) tokens.set(token, value);
    files.push({ path, beforeHash: digest(code), afterHash: digest(result.output), conversions: result.edits });
    if (write) {
      const backup = join(ROOT, '../tmp/atelier-grid-backup', path);
      mkdirSync(dirname(backup), { recursive: true }); writeFileSync(backup, code);
      writeFileSync(join(product, path), result.output);
    }
  }
  const ledger = { version: 1, scope: 'Literal branches of confirmed React grid/width styles and typed or direct DataTable column widths. Dynamic expressions, measured geometry and business data stay unchanged.', files };
  writeFileSync(write ? ledgerPath : join(ROOT, '../tmp/atelier-grid-values-dry.json'), JSON.stringify(ledger, null, 2) + '\n');
  if (write) {
    const cssPath = join(ROOT, 'patterns/foundation/atelier-core-values.css');
    const old = readFileSync(cssPath, 'utf8');
    const definitions = new Map();
    for (const css of [readFileSync(join(ROOT, 'patterns/foundation/atelier-values.css'), 'utf8'), old]) {
      for (const match of css.matchAll(/(--qd-[\w-]+)\s*:\s*([^;{}]+);/g)) definitions.set(match[1],match[2].trim());
    }
    for (const [token,value] of tokens) {
      if (definitions.has(token) && definitions.get(token) !== value) throw new Error(`Conflicting central grid default ${token}`);
      if (definitions.has(token)) tokens.delete(token);
    }
    writeFileSync(cssPath, old.trimEnd() + '\n\n/* Reviewed grid tracks: source/style-adapters/atelier-grid-values.json. */\n:root {\n'
      + [...tokens].sort(([a], [b]) => a.localeCompare(b)).map(([token, value]) => `  ${token}: ${value};`).join('\n') + '\n}\n');
  }
  console.log(JSON.stringify({ write, files: files.length, conversions: files.reduce((sum, file) => sum + file.conversions.length, 0), parameters: tokens.size }));
}
