// Q-Design component discovery. Read-only product audit for the central registry.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, relative, dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

export const digest = text => createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex');
const posix = path => path.replaceAll('\\', '/');
const sorted = values => [...new Set(values)].sort();
const ignored = new Set(['node_modules', '.next', '.git', '__tests__', 'tests', 'test', '__fixtures__']);
export function codeFiles(root) {
  const files = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory() && !ignored.has(entry.name)) walk(full);
      else if (entry.isFile() && /\.(?:[cm]?[jt]sx?|css)$/.test(entry.name) && !/\.(?:test|spec|stories|d)\.[cm]?[jt]sx?$/.test(entry.name)) files.push(posix(relative(root, full)));
    }
  }
  for (const dir of ['app', 'components', 'lib', 'src']) walk(join(root, dir));
  return sorted(files);
}

export function scanProduct(root, catalog, options = {}) {
  const require = createRequire(join(root, 'package.json'));
  const ts = options.typescript ?? require('typescript');
  if (!ts.ScriptTarget || typeof ts.createSourceFile !== 'function') throw new Error('The inventory needs the TypeScript compiler API. Supply the Q-Design audit compiler, not the TypeScript 7 native CLI package.');
  const paths = codeFiles(root);
  const pathSet = new Set(paths);
  const modules = new Map();
  const files = [];
  const families = catalog.families.map(family => ({ ...family, re: new RegExp(family.match, 'i') }));
  if (!families.length || new Set(families.map(f => f.id)).size !== families.length) throw new Error('Invalid component rule families');
  function familyFor(path, name) {
    const family = families.find(item => item.re.test(`${path}#${name}`));
    if (!family) throw new Error(`No rule family: ${path}#${name}`);
    return family.id;
  }
  function localImport(path, spec) {
    const base = spec.startsWith('@/') ? spec.slice(2) : spec.startsWith('.') ? posix(relative(root, resolve(root, dirname(path), spec))) : null;
    if (!base) return null;
    return [base, ...['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'].map(ext => base + ext)].find(candidate => pathSet.has(candidate)) ?? null;
  }
  for (const path of paths) {
    const text = readFileSync(join(root, path), 'utf8');
    const imports = [];
    const classes = [];
    const tokens = [];
    const nativeControls = [];
    const components = [];
    let inlineStyles = 0;
    if (path.endsWith('.css')) {
      const css = text.replace(/\/\*[\s\S]*?\*\//g, '');
      for (const match of css.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)) imports.push(match[1]);
      modules.set(path, { imports: sorted(imports.map(spec => localImport(path, spec)).filter(Boolean)), classes: [] });
      files.push({ path, kind: 'stylesheet', family: 'foundation', components: [], classes: sorted([...css.matchAll(/\.((?:qd|qa)-[\w-]+)/g)].map(m => m[1])), tokens: sorted([...css.matchAll(/var\((--[\w-]+)/g)].map(m => m[1])), nativeControls: [], inlineStyles: 0 });
      continue;
    }
    const sf = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, /\.[jt]sx$/.test(path) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    if (sf.parseDiagnostics.length) throw new Error(`Cannot parse ${path}: ${ts.flattenDiagnosticMessageText(sf.parseDiagnostics[0].messageText, ' ')}`);
    const componentImports = new Set();
    const aliases = [];
    const objectAliases = new Map();
    for (const statement of sf.statements) {
      if (!ts.isImportDeclaration(statement) || !statement.importClause || statement.importClause.isTypeOnly) continue;
      const spec = statement.moduleSpecifier.text;
      const target = localImport(path, spec);
      if (!/\.[jt]sx$/.test(target ?? '') && !/^(?:react$|@radix-ui\/react-)/.test(spec)) continue;
      if (statement.importClause.name) componentImports.add(statement.importClause.name.text);
      const bindings = statement.importClause.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings)) componentImports.add(bindings.name.text);
      else if (bindings) for (const binding of bindings.elements) if (!binding.isTypeOnly) componentImports.add(binding.name.text);
    }
    const containsRender = node => {
      let found = false;
      const visit = child => {
        if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child) || (ts.isCallExpression(child) && /(?:^|\.)createElement$/.test(child.expression.getText(sf)))) found = true;
        if (!found) ts.forEachChild(child, visit);
      };
      visit(node);
      return found;
    };
    const add = (name, node, kind) => {
      if (!components.some(item => item.name === name)) components.push({ name, family: familyFor(path, name), kind });
    };
    const returnsNull = node => {
      if (ts.isArrowFunction(node) && node.body.kind === ts.SyntaxKind.NullKeyword) return true;
      let found = false;
      const visitReturn = child => {
        if (ts.isReturnStatement(child) && child.expression?.kind === ts.SyntaxKind.NullKeyword) found = true;
        if (!found) ts.forEachChild(child, visitReturn);
      };
      visitReturn(node);
      return found;
    };
    const visit = node => {
      const importTypesOnly = ts.isImportDeclaration(node) && (node.importClause?.isTypeOnly || !node.importClause?.name && node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings) && node.importClause.namedBindings.elements.length > 0 && node.importClause.namedBindings.elements.every(item => item.isTypeOnly));
      const exportTypesOnly = ts.isExportDeclaration(node) && (node.isTypeOnly || node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements.length > 0 && node.exportClause.elements.every(item => item.isTypeOnly));
      if ((ts.isImportDeclaration(node) && !importTypesOnly) || ts.isExportDeclaration(node) && !exportTypesOnly) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
      if (ts.isFunctionDeclaration(node) && node.body) {
        const name = node.name?.text;
        const isDefault = node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
        if (name && containsRender(node.body)) add(name, node, /^[A-Z]/.test(name) ? 'function' : 'render-helper');
        else if (isDefault && /\.[jt]sx$/.test(path) || name && /^[A-Z]/.test(name) && /\.[jt]sx$/.test(path) && returnsNull(node.body)) add(name || 'default', node, 'function');
      }
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        const init = node.initializer;
        const capitalized = /^[A-Z]/.test(node.name.text);
        const isWrapper = ts.isCallExpression(init) && /(?:^|\.)(?:forwardRef|memo|dynamic)$/.test(init.expression.getText(sf));
        const isAlias = ts.isPropertyAccessExpression(init) && /^[A-Z]/.test(init.name.text) && componentImports.has(init.expression.getText(sf));
        if (capitalized && (ts.isIdentifier(init) || ts.isPropertyAccessExpression(init))) aliases.push({ name: node.name.text, target: init.getText(sf), node });
        if (ts.isObjectLiteralExpression(init)) for (const property of init.properties) {
          if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.initializer)) objectAliases.set(`${node.name.text}.${property.name.getText(sf)}`, property.initializer.text);
          if (ts.isShorthandPropertyAssignment(property)) objectAliases.set(`${node.name.text}.${property.name.text}`, property.name.text);
        }
        if (containsRender(init) && (ts.isArrowFunction(init) || ts.isFunctionExpression(init) || capitalized && ts.isCallExpression(init)) || capitalized && (isWrapper || isAlias || (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) && returnsNull(init))) add(node.name.text, node, isAlias ? 'alias' : capitalized ? 'component' : 'render-helper');
      }
      if (ts.isClassDeclaration(node) && node.name && node.heritageClauses?.some(h => /(?:Pure)?Component/.test(h.getText(sf)))) add(node.name.text, node, 'class');
      if (ts.isExportAssignment(node) && containsRender(node.expression)) add('default', node, 'default');
      if (ts.isJsxAttribute(node) && node.name.getText(sf) === 'style') inlineStyles++;
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName.getText(sf);
        if (/^(?:button|input|select|textarea|table|dialog)$/.test(tag)) nativeControls.push(tag);
      }
      if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
        classes.push(...[...node.text.matchAll(/(?<![\w-])((?:qd|qa)-[\w-]+)/g)].map(m => m[1]));
        tokens.push(...[...node.text.matchAll(/var\((--[\w-]+)/g)].map(m => m[1]));
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
    // Resolve local aliases after declarations, including aliases of aliases.
    for (let pass = 0; pass < aliases.length; pass++) for (const alias of aliases) {
      const target = objectAliases.get(alias.target) ?? alias.target;
      if (componentImports.has(target) || components.some(component => component.name === target)) add(alias.name, alias.node, 'alias');
    }
    const exported = new Set();
    for (const statement of sf.statements) {
      const publicStatement = statement.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      if (publicStatement && statement.name && ts.isIdentifier(statement.name)) exported.add(statement.name.text);
      if (publicStatement && !statement.name && ts.isFunctionDeclaration(statement) && statement.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) exported.add('default');
      if (publicStatement && ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) exported.add(declaration.name.text);
      if (ts.isExportAssignment(statement)) exported.add(ts.isIdentifier(statement.expression) ? statement.expression.text : 'default');
      if (ts.isExportDeclaration(statement) && !statement.isTypeOnly && statement.exportClause && ts.isNamedExports(statement.exportClause)) for (const element of statement.exportClause.elements) if (!element.isTypeOnly) exported.add((element.propertyName ?? element.name).text);
    }
    for (const component of components) component.exported = exported.has(component.name);
    const edges = sorted(imports.map(spec => localImport(path, spec)).filter(Boolean));
    modules.set(path, { imports: edges, classes: sorted(classes) });
    if (/\.[jt]sx$/.test(path) || components.length) files.push({ path, kind: /q-design-icons\//.test(path) ? 'generated-icon' : 'component-module', components: components.sort((a, b) => a.name.localeCompare(b.name, 'en')), classes: sorted(classes), tokens: sorted(tokens), nativeControls: sorted(nativeControls), inlineStyles });
  }
  const entrypoints = paths.filter(path => /^(?:src\/)?app\/(?:.*\/)?(?:page|layout|template|loading|error|global-error|not-found|default)\.[jt]sx$/.test(path));
  const closure = starts => {
    const seen = new Set();
    const visit = path => { if (seen.has(path)) return; seen.add(path); for (const next of modules.get(path)?.imports ?? []) visit(next); };
    starts.forEach(visit);
    return seen;
  };
  const reachable = closure(entrypoints);
  for (const file of files) {
    file.imports = modules.get(file.path)?.imports ?? [];
    file.reachable = reachable.has(file.path);
    file.ruleAssignment = 'name-and-path-inference';
  }
  return { files, modules, reachable, entrypoints };
}

// Only registration identity is locked. Business logic and source line shifts do not require a registry release.
export const identities = files => files.map(file => ({ path: file.path, kind: file.kind, components: file.components.map(({ name, family, kind }) => ({ name, family, kind })) }));

// A reviewed public API scope is independent of the role table. Deleting the last
// role for a file must not silently delete the file from this coverage gate.
export function exportedPublicCoverage(scan, registry, scope, product) {
  const failures = [];
  const validPath = path => typeof path === 'string' && path.length > 0 && !path.includes('\\') && !path.startsWith('/') && !path.includes(':') && !/[\*?#[\]]/.test(path) && !path.split('/').some(part => part === '.' || part === '..');
  if (!scope || !Array.isArray(scope.files) || !Array.isArray(scope.prefixes) || !Array.isArray(scope.exemptions)) {
    return { failures: [`${product}: missing or invalid public API coverage scope`], required: 0, mapped: 0, exempted: 0, unmapped: [] };
  }
  for (const path of scope.files) if (!validPath(path) || !/\.[jt]sx?$/.test(path)) failures.push(`${product}: invalid public API file scope ${path}`);
  for (const prefix of scope.prefixes) if (!validPath(prefix) || !prefix.endsWith('/') || prefix.split('/').filter(Boolean).length < 2) failures.push(`${product}: invalid public API directory scope ${prefix}`);
  if (!scope.files.length && !scope.prefixes.length) failures.push(`${product}: public API coverage scope is empty`);
  if (new Set(scope.files).size !== scope.files.length || new Set(scope.prefixes).size !== scope.prefixes.length) failures.push(`${product}: duplicate public API scope`);
  if (failures.length) return { failures, required: 0, mapped: 0, exempted: 0, unmapped: [] };
  const selected = file => scope.files.includes(file.path) || scope.prefixes.some(prefix => file.path.startsWith(prefix));
  for (const path of scope.files) if (!scan.files.some(file => file.path === path)) failures.push(`${product}: public API scope file missing ${path}`);
  for (const prefix of scope.prefixes) if (!scan.files.some(file => file.path.startsWith(prefix))) failures.push(`${product}: public API scope directory has no scanned files ${prefix}`);
  const candidates = new Set();
  for (const file of scan.files.filter(selected)) for (const component of file.components) {
    if (typeof component.exported !== 'boolean') failures.push(`${product}: public export metadata missing ${file.path}#${component.name}`);
    if (component.exported) candidates.add(`${file.path}#${component.name}`);
  }
  const mapped = new Set(registry.roles.flatMap(role => role.implementations.filter(item => item.product === product && item.kind === 'component').flatMap(item => item.symbols.map(symbol => `${item.file}#${symbol}`))));
  const exemptions = new Set();
  for (const exemption of scope.exemptions) {
    const key = `${exemption.file}#${exemption.symbol}`;
    if (!validPath(exemption.file) || typeof exemption.symbol !== 'string' || !/^(?:[A-Za-z_$][\w$]*|default)$/.test(exemption.symbol) || typeof exemption.reason !== 'string' || !exemption.reason.trim()) {
      failures.push(`${product}: invalid public API exemption ${key}; require an exact file, symbol and reason`);
      continue;
    }
    if (exemptions.has(key)) failures.push(`${product}: duplicate public API exemption ${key}`);
    exemptions.add(key);
    if (!candidates.has(key)) failures.push(`${product}: stale or out-of-scope public API exemption ${key}`);
    if (mapped.has(key)) failures.push(`${product}: registered public API no longer needs exemption ${key}`);
  }
  const unmapped = [...candidates].filter(key => !mapped.has(key) && !exemptions.has(key)).sort();
  for (const key of unmapped) failures.push(`${product}: unregistered public renderer ${key}; assign a reviewed component role before regenerating`);
  return { failures, required: candidates.size, mapped: [...candidates].filter(key => mapped.has(key)).length, exempted: [...candidates].filter(key => exemptions.has(key)).length, unmapped };
}

export function checkProduct(root, lock) {
  const failures = [];
  const current = scanProduct(root, lock.catalog);
  const old = new Map(lock.files.map(file => [file.path, file]));
  const now = new Map(identities(current.files).map(file => [file.path, file]));
  for (const [path, entry] of now) if (JSON.stringify(old.get(path)) !== JSON.stringify(entry)) failures.push(`Component registration changed: ${path}`);
  for (const path of old.keys()) if (!now.has(path)) failures.push(`Registered file missing: ${path}`);
  if (!current.entrypoints.length) failures.push('No application entrypoints found');
  for (const copy of lock.copies) {
    const full = join(root, copy.path);
    if (!existsSync(full)) failures.push(`Canonical copy missing: ${copy.path}`);
    else if (digest(readFileSync(full, 'utf8')) !== copy.sha256) failures.push(`Canonical copy changed: ${copy.path}`);
    if (copy.runtime && !current.reachable.has(copy.path)) failures.push(`Canonical copy is not imported from an application entrypoint: ${copy.path}`);
  }
  return failures;
}
