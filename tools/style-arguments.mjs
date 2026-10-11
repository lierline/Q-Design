import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { PARTS } from './sync-parts.mjs';
import { centralOutputs } from './audit-coverage-core.mjs';
import { hash, runtimeFiles, cssProperties, scanArguments } from './style-arguments-core.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), WORKSPACE = resolve(ROOT, '..');
const req = createRequire(join(WORKSPACE, 'Q-Atelier/package.json'));
const ts = req('typescript');
const postcss = createRequire(join(WORKSPACE, 'Q-Works/package.json'))('postcss');
const properties = cssProperties(ts, readFileSync(join(dirname(req.resolve('typescript')), 'lib.dom.d.ts'), 'utf8'));
const args = process.argv.slice(2);
if (args.some(arg => !['--write', '--check', '--strict'].includes(arg))) throw new Error('Use --write, --check or --strict');
const products = [{ id: 'atelier', repo: 'Q-Atelier', syncKey: 'Q-Atelier' }, { id: 'maison', repo: 'Q-Works', syncKey: 'Q-Works' }, { id: 'carnet', repo: 'DHR', syncKey: 'Q-Forge' }];
const report = { version: 1, note: 'Exhaustive lexical/AST argument inventory. Token references are not proof of semantic correctness. Review-required findings are retained, never automatically exempted. CSS-like data objects are candidates. File hashes include files with zero findings.', products: [] };
let stale = false;
function emit(path, text) {
  const full = join(ROOT, path);
  if (args.includes('--write')) { mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, text); }
  else if (!existsSync(full) || readFileSync(full, 'utf8').replaceAll('\r\n', '\n') !== text) { console.error(`Stale style evidence: ${path}`); stale = true; }
}
for (const product of products) {
  const root = join(WORKSPACE, product.repo);
  const copies = new Map(centralOutputs(PARTS, product.syncKey, root).map(part => [part.path, part.src]));
  const counts = {}, families = {}, files = [];
  const evidence = [];
  for (const path of runtimeFiles(root)) {
    const code = readFileSync(join(root, path), 'utf8');
    const records = scanArguments(path, code, { ts, postcss, properties, owner: copies.get(path) });
    for (const record of records) { counts[record.status] = (counts[record.status] ?? 0) + 1; families[record.family] = (families[record.family] ?? 0) + 1; }
    files.push({ path, hash: hash(code), arguments: records.length });
    if (records.length) evidence.push(JSON.stringify({ path, hash: hash(code), arguments: records }));
  }
  emit(`dist/style-arguments/${product.id}.ndjson`, evidence.join('\n') + '\n');
  report.products.push({ id: product.id, files, counts, families, total: Object.values(counts).reduce((a, b) => a + b, 0) });
}
emit('dist/q-design.style-arguments.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.products.map(({ id, files, counts, total }) => ({ id, files: files.length, counts, total })), null, 2));
if (args.includes('--strict') && report.products.some(p => p.counts['review-required'])) { console.error('Unresolved styling arguments remain. Inventory is not full conformance.'); process.exitCode = 1; }
if (stale) process.exitCode = 1;
