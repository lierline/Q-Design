// Narrow, auditable migration of confirmed React inline presentation literals.
// Runtime expressions, business objects, print generation and engine dependencies
// are deliberately not guessed. Each conversion records its exact old value.
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { codeFiles } from '../source/component-registry-core.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const product = join(ROOT, '../Q-Atelier');
const ts = createRequire(join(product, 'package.json'))('typescript');
const write = process.argv.includes('--write');
const cssPath = join(ROOT, 'patterns/foundation/atelier-values.css');
if (write && existsSync(cssPath)) throw new Error('Existing central values must not be overwritten. Review additional migrations explicitly.');
const props = new Set('fontSize fontWeight fontFamily letterSpacing lineHeight color background backgroundColor backgroundImage border borderTop borderRight borderBottom borderLeft borderColor borderTopColor borderBottomColor borderWidth borderRadius boxShadow textShadow opacity padding paddingTop paddingBottom paddingLeft paddingRight paddingInline paddingBlock margin marginTop marginBottom marginLeft marginRight marginInline marginBlock gap rowGap columnGap width height minWidth maxWidth minHeight maxHeight top bottom left right inset zIndex transition transitionDuration animation animationDuration outline outlineColor outlineOffset outlineWidth stroke fill strokeWidth'.split(' '));
const unitless = new Set('fontWeight lineHeight opacity zIndex strokeWidth'.split(' '));
const lengths = /^(?:padding|margin|gap|rowGap|columnGap)/;
const weights = {100:'thin',200:'extralight',300:'light',400:'normal',500:'medium',600:'semibold',700:'bold',800:'extrabold',900:'black'};
const manifest = JSON.parse(readFileSync(join(product, 'lib/engine/validation-manifest.generated.json'), 'utf8'));
const protectedFiles = new Set(Object.values(manifest).flatMap(engine => Object.keys(engine.dependencies)));
const extractorNames = new Set(readdirSync(join(ROOT, 'source/components')).map(name => name));
const shared = readFileSync(join(ROOT, 'patterns/foundation.css'), 'utf8') + readFileSync(join(ROOT, 'patterns/components.css'), 'utf8');
const variables = new Set([...shared.matchAll(/(--qd-[\w-]+)\s*:/g)].map(m => m[1]));
const tokens = new Map(), changed = [], skipped = [];
function alias(property, value, cssValue) {
  let name;
  if (property === 'fontSize' && typeof value === 'number') name = `--qd-font-size-${value}`;
  if (property === 'fontWeight' && weights[value]) name = `--qd-font-weight-${weights[value]}`;
  if (lengths.test(property) && typeof value === 'number') name = `--qd-space-${String(value / 4).replace('.', '-')}`;
  if (property === 'borderRadius' && value === 10) name = '--qd-radius';
  if (name && variables.has(name)) return name;
  const digest = createHash('sha256').update(property + ':' + cssValue).digest('hex').slice(0, 10);
  name = `--qd-atelier-${property.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}-${digest}`;
  tokens.set(name, { property, value: cssValue });
  return name;
}
for (const path of codeFiles(product).filter(path => /\.tsx$/.test(path))) {
  if (protectedFiles.has(path) || extractorNames.has(basename(path)) || path.startsWith('lib/design/') || path === 'app/(app)/layout.tsx' || path === 'app/(app)/audit/page.tsx' || /(?:^|\/)(?:print|q-design-icons)(?:\/|$)/.test(path)) continue;
  const code = readFileSync(join(product, path), 'utf8');
  const sf = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  function confirmedStyle(node) {
    for (let current = node.parent, depth = 0; current && depth < 9; current = current.parent, depth++) {
      if (ts.isJsxAttribute(current)) return current.name.getText(sf) === 'style';
      if ((ts.isVariableDeclaration(current) || ts.isPropertyDeclaration(current)) && current.type && /(?:^|\.)CSSProperties\b/.test(current.type.getText(sf))) return true;
      if (ts.isAsExpression(current) && /(?:^|\.)CSSProperties\b/.test(current.type.getText(sf))) return true;
      if (ts.isFunctionLike(current) || ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) break;
    }
    return false;
  }
  function visit(node) {
    if (ts.isPropertyAssignment(node) && props.has(node.name.getText(sf)) && confirmedStyle(node)) {
      const property = node.name.getText(sf), init = node.initializer;
      let value;
      if (ts.isStringLiteral(init)) value = init.text;
      else if (ts.isNumericLiteral(init)) value = Number(init.text);
      else if (ts.isPrefixUnaryExpression(init) && init.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(init.operand)) value = -Number(init.operand.text);
      if (value !== undefined && !(typeof value === 'string' && (!value.trim() || /var\(|url\(|^(?:inherit|initial|unset|revert|currentColor|auto|none|transparent)$/.test(value)))) {
        const cssValue = typeof value === 'number' ? `${value}${unitless.has(property) ? '' : 'px'}` : value;
        const name = alias(property, value, cssValue);
        edits.push({ start: init.getStart(sf), end: init.end, next: JSON.stringify(`var(${name})`), property, old: init.getText(sf), token: name, line: sf.getLineAndCharacterOfPosition(init.getStart(sf)).line + 1 });
      } else if (value === undefined) skipped.push({ path, line: sf.getLineAndCharacterOfPosition(init.getStart(sf)).line + 1, property, expression: init.getText(sf), reason: 'Existing token or dynamic expression; not a literal migration target.' });
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (!edits.length) continue;
  let output = code;
  for (const edit of [...edits].sort((a,b) => b.start-a.start)) output = output.slice(0,edit.start)+edit.next+output.slice(edit.end);
  if (write) {
    const backup=join(ROOT,'../tmp/atelier-literal-backup',path);
    mkdirSync(dirname(backup),{recursive:true}); writeFileSync(backup,code);
    writeFileSync(join(product, path), output);
  }
  changed.push({ path, beforeHash: createHash('sha256').update(code).digest('hex'), conversions: edits.map(({ start, end, next, ...record }) => record) });
}
const ledger = { version: 1, scope: 'Confirmed inline JSX style and explicitly typed CSSProperties only, including static presentation dimensions. Dynamic geometry, engine files, extractor source components, print and calculated expressions are not automatically altered.', files: changed, skipped };
const prefix = write ? 'source/style-adapters' : '../tmp';
mkdirSync(join(ROOT, prefix), { recursive: true });
writeFileSync(join(ROOT, prefix, 'atelier-literal-values.json'), JSON.stringify(ledger, null, 2) + '\n');
if (write) {
  const css = '/* Q-Design owns remaining reviewed Atelier presentation values.\n   Original sites and values: source/style-adapters/atelier-literal-values.json.\n   Edit values here; source code reads these stable parameter names. */\n:root {\n' + [...tokens].sort(([a],[b])=>a.localeCompare(b)).map(([name,{value}])=>`  ${name}: ${value};`).join('\n') + '\n}\n';
  writeFileSync(cssPath, css);
}
console.log(JSON.stringify({ write, files: changed.length, conversions: changed.reduce((n,file)=>n+file.conversions.length,0), parameters: tokens.size, dynamicOrExisting: skipped.length }));
