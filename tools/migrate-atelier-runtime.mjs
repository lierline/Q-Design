import ts from '../../Q-Atelier/node_modules/typescript/lib/typescript.js';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const qa = resolve(root, '../Q-Atelier');
const write = process.argv.includes('--write');
const ledgerPath = join(root, 'source/style-adapters/atelier-runtime-migration.json');
if (write && existsSync(ledgerPath)) throw new Error('Runtime migration already has a ledger; do not overwrite historical evidence.');
const protectedFiles = new Set(Object.values(JSON.parse(readFileSync(join(qa, 'lib/engine/validation-manifest.generated.json'), 'utf8'))).flatMap(entry => Object.keys(entry.dependencies)));
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : /\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name) ? [join(dir, entry.name)] : []);
const edits = [], factors = new Set(), changes = [];
for (const full of ['app', 'components', 'lib/design', 'lib/hooks'].flatMap(dir => walk(join(qa, dir)))) {
  const path = relative(qa, full).replaceAll('\\', '/');
  if (protectedFiles.has(path) || /(?:tokens|q-design[^/]*)\.tsx?$/.test(path) || /(?:^|\/)(?:print|[^/]*Print[^/]*)\.tsx?$/.test(path)) continue;
  const before = readFileSync(full, 'utf8');
  const sf = ts.createSourceFile(path, before, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const replacements = [], imports = [], alphaNames = new Set();
  for (const node of sf.statements) {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier) || !/(?:^|\/)tokens$/.test(node.moduleSpecifier.text)) continue;
    const clause = node.importClause, named = clause?.namedBindings;
    if (!named || !ts.isNamedImports(named)) continue;
    for (const spec of named.elements) if ((spec.propertyName ?? spec.name).text === 'alpha') alphaNames.add(spec.name.text);
    const move = named.elements.filter(spec => ['BP', 'LAYOUT', 'ICON'].includes((spec.propertyName ?? spec.name).text));
    if (!move.length) continue;
    imports.push(...move.map(spec => spec.getText(sf)));
    const keep = named.elements.filter(spec => !move.includes(spec));
    const next = keep.length || clause.name ? `import ${clause.name ? clause.name.getText(sf) + (keep.length ? ', ' : '') : ''}${keep.length ? `{ ${keep.map(spec => spec.getText(sf)).join(', ')} }` : ''} from ${node.moduleSpecifier.getText(sf)};` : '';
    replacements.push({ from: node.getStart(sf), to: node.end, text: next });
    edits.push({ path, kind: 'numeric-ui-import', names: move.map(spec => spec.getText(sf)) });
  }
  let alphaChanged = false;
  const visit = node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && alphaNames.has(node.expression.text) && node.arguments.length === 2 && ts.isNumericLiteral(node.arguments[1])) {
      const arg = node.arguments[1], value = Number(arg.text);
      if (value < 0 || value > 1) throw new Error(`Unexpected fixed alpha ${path}:${arg.getStart(sf)}`);
      const key = `tint${String(value).replace('.', '_')}`;
      factors.add(value);
      replacements.push({ from: arg.getStart(sf), to: arg.end, text: `QDRuntime.alpha.${key}` });
      edits.push({ path, kind: 'fixed-alpha', value, binding: `QDRuntime.alpha.${key}`, line: sf.getLineAndCharacterOfPosition(arg.getStart(sf)).line + 1 });
      alphaChanged = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!replacements.length) continue;
  if (alphaChanged) imports.push('QDRuntime');
  const importStatement = `\nimport { ${[...new Set(imports)].join(', ')} } from '@/lib/design/q-design-runtime';`;
  const at = [...sf.statements].reverse().find(ts.isImportDeclaration)?.end ?? 0;
  replacements.push({ from: at, to: at, text: importStatement });
  let after = before;
  for (const edit of replacements.sort((a, b) => b.from - a.from || b.to - a.to)) after = after.slice(0, edit.from) + edit.text + after.slice(edit.to);
  changes.push({ full, after });
}
const runtime = {
  BP: { sm: 480, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
  LAYOUT: { mobile: 520, form: 720, detail: 820, wide: 1140 },
  ICON: { strokeWidth: 1.5, strokeWidthThin: 1.25, sizeXs: 14, sizeSm: 16, sizeMd: 20, sizeLg: 24, sizeXl: 32, size2xl: 48 },
  QDRuntime: {
    switch: { sm: { w: 40, h: 22, knob: 16 }, md: { w: 52, h: 28, knob: 22 }, inset: 3 },
    grid: { minColumn: 240, foldMinColumn: 150, roundingAllowance: 1 },
    ribbon: { durationSeconds: 1.7 },
    grain: { tint: 0.55 },
    alpha: Object.fromEntries([...factors].sort((a,b) => a-b).map(value => [`tint${String(value).replace('.', '_')}`, value])),
  },
};
if (write) {
  const central = join(root, 'source/design/atelier-runtime.ts');
  mkdirSync(dirname(central), { recursive: true });
  writeFileSync(central, '// Q-Design owns numeric presentation inputs required by JavaScript, SVG and media queries.\n// Measured coordinates, application data and locked engine tokens do not belong here.\n// Update this source and sync; do not edit the product copy.\n\n' + Object.entries(runtime).map(([name, value]) => `export const ${name} = ${JSON.stringify(value, null, 2)} as const;\n`).join('\n'));
  for (const {full, after} of changes) writeFileSync(full, after);
  writeFileSync(ledgerPath, JSON.stringify({ version: 1, files: changes.length, edits, excluded: 'Locked engine dependencies, test files, print-specific modules and generated adapters. Only named token imports and fixed numeric second arguments to imported alpha are transformed; measured and data-derived expressions are untouched.' }, null, 2) + '\n');
}
console.log(JSON.stringify({ write, files: changes.length, imports: edits.filter(e => e.kind === 'numeric-ui-import').length, alphaArguments: edits.filter(e => e.kind === 'fixed-alpha').length, alphaValues: [...factors].sort((a,b) => a-b) }, null, 2));
