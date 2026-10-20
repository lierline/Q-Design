import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { createRequire } from 'node:module';

const ts = createRequire(import.meta.url)('typescript');
const portable = value => value.replaceAll('\\', '/');
const inside = value => value !== '..' && !value.startsWith('../') && !/^[A-Za-z]:/.test(value);

/** Static URL references are evidence of wiring, not proof that a route executes. */
export function referencesPublicAsset(code, sourcePath, assetPath, productRoot) {
  const publicRoot = resolve(productRoot, 'public');
  const asset = portable(relative(publicRoot, resolve(assetPath)));
  if (!inside(asset)) return false;
  // Most runtime files cannot mention this asset. Preserve escaped JS literals:
  // a backslash keeps the parser path even when the basename is not written out.
  if (!code.includes(asset.split('/').at(-1)) && !code.includes('\\')) return false;
  const source = portable(relative(publicRoot, resolve(sourcePath)));
  const basePath = inside(source) ? '/' + source : '/';
  const origin = 'https://q-design.invalid';
  const target = new URL('/' + asset, origin).pathname;
  function matches(value) {
    // Remote documents with the same basename are not consumers of this copy.
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return false;
    try { return new URL(value, origin + basePath).pathname === target; }
    catch { return false; }
  }
  if (/\.html?$/i.test(sourcePath)) {
    const markup = code.replace(/<!--[\s\S]*?-->/g, '');
    for (const tag of markup.matchAll(/<[a-z][^>]*>/gi)) {
      for (const attribute of tag[0].matchAll(/\s(?:href|src|data)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
        if (matches(attribute[1] ?? attribute[2] ?? attribute[3])) return true;
      }
    }
    return false;
  }
  if (!/\.[cm]?[jt]sx?$/i.test(sourcePath)) return false;
  const ast = ts.createSourceFile(sourcePath, code, ts.ScriptTarget.Latest, true,
    /\.[jt]sx$/i.test(sourcePath) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  let found = false;
  function visit(node) {
    // AST literals include service-worker precache arrays and cache.match calls;
    // comments and dynamically constructed paths cannot claim this evidence.
    if (ts.isStringLiteralLike(node) && matches(node.text)) found = true;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(ast);
  return found;
}

export function publicAssetConsumerFiles(assetPath, productRoot, files, readSource = path => readFileSync(path, 'utf8')) {
  return files.filter(path => resolve(path) !== resolve(assetPath)
    && referencesPublicAsset(readSource(path), path, assetPath, productRoot));
}
