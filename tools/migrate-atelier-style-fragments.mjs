// Close only proven CSS-property defaults and literal border-template fragments.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { codeFiles } from '../source/component-registry-core.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), product = resolve(ROOT, '../Q-Atelier');
const ts = createRequire(join(product, 'package.json'))('typescript');
const hash = code => createHash('sha256').update(code.replaceAll('\r\n', '\n')).digest('hex');
const properties = new Set('fontSize fontWeight fontFamily letterSpacing lineHeight color background backgroundColor backgroundImage border borderTop borderRight borderBottom borderLeft borderColor borderTopColor borderBottomColor borderWidth borderRadius boxShadow textShadow opacity padding paddingTop paddingBottom paddingLeft paddingRight paddingInline paddingBlock margin marginTop marginBottom marginLeft marginRight marginInline marginBlock gap rowGap columnGap width height minWidth maxWidth minHeight maxHeight top bottom left right inset zIndex transition transitionDuration animation animationDuration outline outlineColor outlineOffset outlineWidth stroke fill strokeWidth flex flexBasis scrollMargin scrollMarginTop scrollMarginBottom scrollPaddingTop'.split(' '));
const unitless = new Set('fontWeight lineHeight opacity zIndex strokeWidth flex'.split(' '));
const otherAgent = new Set(['lib/email.ts', 'lib/research/notify-doc-review.ts', 'lib/research/notify-license-change.ts', 'app/api/research/[code]/comments/route.ts', 'lib/export/org-export.ts']);
export function transformStyleFragments(file, code, definitions = new Map()) {
  const sf = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX), edits = [], parameters = new Map();
  const confirmed = node => {
    for (let current = node.parent; current; current = current.parent) {
      if (ts.isJsxAttribute(current)) return current.name.getText(sf) === 'style';
      if ((ts.isVariableDeclaration(current) || ts.isFunctionLike(current)) && current.type && /^(?:React\.)?CSSProperties$/.test(current.type.getText(sf))) return true;
      if ((ts.isAsExpression(current) || ts.isSatisfiesExpression(current)) && /^(?:React\.)?CSSProperties$/.test(current.type.getText(sf))) return true;
      if (ts.isFunctionLike(current) || ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) return false;
    }
    return false;
  };
  const tokenFor = (property, value) => {
    const common = property === 'border-width' ? { '1px': '--qd-border-width', '2px': '--qd-border-width-2' }[value] : undefined;
    const token = common ?? `--qd-atelier-${property.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase())}-${hash(property + ':' + value).slice(0, 10)}`;
    if (!definitions.has(token)) parameters.set(token, value);
    else if (definitions.get(token) !== value) throw new Error(`Non-equivalent default ${token}`);
    return token;
  };
  const record = (node, property, text, values) => edits.push({ start: node.getStart(sf), end: node.end, text, property,
    line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, values });
  function capture(node, property) {
    if (ts.isConditionalExpression(node)) { capture(node.whenTrue, property); capture(node.whenFalse, property); return; }
    if (ts.isTemplateExpression(node) && /^border(?:Top|Right|Bottom|Left)?$/.test(property)) {
      for (const fragment of [node.head, ...node.templateSpans.map(span => span.literal)]) {
        const values = [];
        let text = fragment.getText(sf).replace(/(?<![\w.-])(\d+(?:\.\d+)?px)(?=\s+(?:solid|dashed|dotted|double)\b)/g, value => {
          const token = tokenFor('border-width', value); values.push({ value, token }); return `var(${token})`;
        });
        text = text.replace(/\b(solid|dashed|dotted|double)\b/g, value => {
          const token = tokenFor('border-style', value); values.push({ value, token }); return `var(${token})`;
        });
        if (values.length) record(fragment, property, text, values);
      }
      return;
    }
    let value;
    if (ts.isStringLiteralLike(node)) value = node.text;
    else if (ts.isNumericLiteral(node)) value = Number(node.text);
    else if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) value = -Number(node.operand.text);
    if (value === undefined || value === 0 || value === '0' || typeof value === 'string' && (!value.trim() || /var\(|url\(|^(?:inherit|initial|unset|revert|currentColor|auto|none|transparent)$/.test(value))) return;
    const cssValue = typeof value === 'number' ? `${value}${unitless.has(property) ? '' : 'px'}` : value;
    const token = tokenFor(property, cssValue);
    record(node, property, JSON.stringify(`var(${token})`), [{ value: cssValue, token }]);
  }
  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const property = node.name.getText(sf).replace(/^['"]|['"]$/g, '');
      if (properties.has(property) && confirmed(node)) capture(node.initializer, property);
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  let output = code;
  for (const edit of edits.slice().sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  return { output, parameters, edits: edits.map(({ start, end, text, ...entry }) => entry) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const write = process.argv.includes('--write'), ledgerPath = join(ROOT, 'source/style-adapters/atelier-style-fragments.json');
  if (write && existsSync(ledgerPath)) throw new Error('Never overwrite an existing migration ledger');
  const definitions = new Map();
  for (const file of ['patterns/foundation.css', 'patterns/components.css', 'patterns/foundation/atelier-values.css', 'patterns/foundation/atelier-core-values.css']) {
    for (const match of readFileSync(join(ROOT, file), 'utf8').matchAll(/(--qd-[\w-]+)\s*:\s*([^;{}]+);/g)) if (!definitions.has(match[1])) definitions.set(match[1], match[2].trim());
  }
  const manifest = JSON.parse(readFileSync(join(product, 'lib/engine/validation-manifest.generated.json'), 'utf8'));
  const protectedFiles = new Set(Object.values(manifest).flatMap(engine => Object.keys(engine.dependencies)));
  const files = [], parameters = new Map();
  for (const file of codeFiles(product).filter(file => /\.tsx$/.test(file) && !protectedFiles.has(file) && !otherAgent.has(file))) {
    const code = readFileSync(join(product, file), 'utf8'); if (code.includes('q-design-header-end')) continue;
    const result = transformStyleFragments(file, code, definitions); if (!result.edits.length) continue;
    for (const [token, value] of result.parameters) parameters.set(token, value);
    files.push({ path: file, beforeHash: hash(code), afterHash: hash(result.output), conversions: result.edits });
    if (write) { const backup = join(ROOT, '../tmp/atelier-style-fragments-backup', file); mkdirSync(dirname(backup), { recursive: true }); writeFileSync(backup, code); writeFileSync(join(product, file), result.output); }
  }
  const ledger = { version: 1, scope: 'Literal defaults and border template fragments only in proven JSX style or explicitly typed CSSProperties. Conditions, interpolation expressions, business data, generated copies and engine dependencies are preserved.', files };
  writeFileSync(write ? ledgerPath : join(ROOT, '../tmp/atelier-style-fragments-dry.json'), JSON.stringify(ledger, null, 2) + '\n');
  if (write) { const css = join(ROOT, 'patterns/foundation/atelier-core-values.css'); writeFileSync(css, readFileSync(css, 'utf8').trimEnd() + '\n\n/* Reviewed literal style fragments. See source/style-adapters/atelier-style-fragments.json. */\n:root {\n' + [...parameters].sort(([a], [b]) => a.localeCompare(b)).map(([token, value]) => `  ${token}: ${value};`).join('\n') + '\n}\n'); }
  console.log(JSON.stringify({ write, files: files.length, conversions: files.reduce((sum, file) => sum + file.conversions.length, 0), newParameters: parameters.size }));
}
