import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const product = resolve(root, '../Q-Works');
const require = createRequire(join(product, 'package.json'));
const ts = require('typescript');
const slash = value => value.replaceAll('\\', '/');
function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out); else out.push(path);
  }
  return out;
}
const appFiles = walk(join(product, 'app'));
const pages = appFiles.filter(path => /[\\/]page\.tsx$/.test(path));
const cache = new Map();
function parse(path) {
  if (cache.has(path)) return cache.get(path);
  const text = readFileSync(path, 'utf8');
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const imports = [], tables = new Set(), permissions = new Set(), literals = [];
  const visit = node => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node)) {
      const name = node.expression.getText(source);
      if (name.endsWith('.from') && ts.isStringLiteral(node.arguments[0])) tables.add(node.arguments[0].text);
      if (/(?:hasPermissions?|requirePermission|canAccessDocumentLibrary)$/.test(name)) {
        for (const arg of node.arguments) {
          if (ts.isStringLiteral(arg)) permissions.add(arg.text);
          if (ts.isArrayLiteralExpression(arg)) arg.elements.filter(ts.isStringLiteral).forEach(value => permissions.add(value.text));
        }
      }
    }
    if (ts.isStringLiteralLike(node)) literals.push(node.text);
    ts.forEachChild(node, visit);
  };
  visit(source);
  const dependencies = imports.flatMap(value => {
    const stem = value.startsWith('@/') ? join(product, value.slice(2)) : value.startsWith('.') ? resolve(dirname(path), value) : null;
    if (!stem) return [];
    return [stem, stem + '.tsx', stem + '.ts', join(stem, 'index.tsx'), join(stem, 'index.ts')]
      .filter(candidate => existsSync(candidate) && statSync(candidate).isFile() && /\.[jt]sx?$/.test(candidate)).slice(0, 1);
  });
  const info = { text, dependencies, tables: [...tables], permissions: [...permissions], literals };
  cache.set(path, info);
  return info;
}
function closure(path, seen = new Set()) {
  if (seen.has(path)) return seen;
  seen.add(path);
  parse(path).dependencies.forEach(dependency => closure(dependency, seen));
  return seen;
}
function inherited(path, name) {
  const list = [];
  for (let dir = dirname(path); dir.startsWith(join(product, 'app')); dir = dirname(dir)) {
    const candidate = join(dir, name + '.tsx');
    if (existsSync(candidate)) list.push(slash(relative(product, candidate)));
  }
  return list;
}
const routes = pages.map(path => {
  const file = slash(relative(product, path));
  const segments = file.split('/').slice(1, -1);
  const route = '/' + segments.filter(segment => !/^\(.*\)$/.test(segment)).join('/');
  const direct = parse(path);
  const dependencyFiles = [...closure(path)];
  const sourceInfos = dependencyFiles.map(parse);
  const dynamicParameters = [...route.matchAll(/\[([^\]]+)\]/g)].map(match => match[1]);
  return {
    route, file, group: segments.find(segment => /^\(/.test(segment)) ?? 'root', domain: route.split('/')[1] || 'root',
    kind: /\/print(?:\/|$)/.test(route) ? 'print' : /\/edit$/.test(route) ? 'edit' : /\/new$/.test(route) ? 'create' : dynamicParameters.length ? 'detail' : 'index-or-static',
    dynamicParameters, layouts: inherited(path, 'layout'), loading: inherited(path, 'loading'), errors: inherited(path, 'error'),
    directTables: direct.tables, dependencyTables: [...new Set(sourceInfos.flatMap(info => info.tables))].sort(),
    permissions: [...new Set(sourceInfos.flatMap(info => info.permissions))].sort(),
    localDependencies: dependencyFiles.map(value => slash(relative(product, value))).sort(),
    candidateStates: {
      empty: sourceInfos.some(info => /EmptyState|TableEmpty|emptyText|데이터가 없|없습니다/.test(info.text)),
      dialog: sourceInfos.some(info => /DialogContent|SheetContent|ConfirmDialog/.test(info.text)),
      form: sourceInfos.some(info => /<form\b|useActionState|FormField/.test(info.text)),
      table: sourceInfos.some(info => /<Table\b|<table\b|DataTable/.test(info.text)),
    },
    verification: { status: 'pending-real-browser', renderedUrls: [], evidence: [] },
  };
}).sort((a, b) => a.route.localeCompare(b.route));
const ledger = readFileSync(join(root, 'dist/style-arguments/maison.ndjson'), 'utf8').trim().split('\n').map(line => JSON.parse(line));
const counts = {};
for (const record of ledger) for (const item of record.arguments ?? []) {
  const key = `${item.status}:${item.kind}:${item.family}`;
  counts[key] = (counts[key] ?? 0) + 1;
}
const result = {
  product: 'Q-Maison', source: product, generatedAt: new Date().toISOString(),
  summary: { pages: routes.length, dynamic: routes.filter(route => route.dynamicParameters.length).length, states: appFiles.filter(path => /[\\/](loading|error|not-found)\.tsx$/.test(path)).length,
    groups: Object.fromEntries([...new Set(routes.map(route => route.group))].map(group => [group, routes.filter(route => route.group === group).length])),
    domains: [...new Set(routes.filter(route => route.group === '(app)').map(route => route.domain))].sort(), styleArguments: counts },
  interpretation: 'Route and state candidates are static inventory only. A login redirect, missing record, denied menu or empty dataset does not verify the corresponding business screen.',
  routes,
};
mkdirSync(join(root, 'reviews'), { recursive: true });
writeFileSync(join(root, 'reviews/maison-pages-inventory.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result.summary, null, 2));
