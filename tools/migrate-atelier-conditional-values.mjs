// Static branch defaults in proven CSS style contexts. Conditions and runtime data stay intact.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { codeFiles } from '../source/component-registry-core.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..'), product = resolve(ROOT, '../Q-Atelier');
const ts = createRequire(join(product, 'package.json'))('typescript');
const digest = value => createHash('sha256').update(value.replaceAll('\r\n', '\n')).digest('hex');
const properties = new Set('fontSize fontWeight fontFamily letterSpacing lineHeight color background backgroundColor backgroundImage border borderTop borderRight borderBottom borderLeft borderColor borderTopColor borderBottomColor borderWidth borderRadius boxShadow textShadow opacity padding paddingTop paddingBottom paddingLeft paddingRight paddingInline paddingBlock margin marginTop marginBottom marginLeft marginRight marginInline marginBlock gap rowGap columnGap width height minWidth maxWidth minHeight maxHeight top bottom left right inset zIndex transition transitionDuration animation animationDuration outline outlineColor outlineOffset outlineWidth stroke fill strokeWidth'.split(' '));
const unitless = new Set('fontWeight lineHeight opacity zIndex strokeWidth'.split(' '));
const weights = {100:'thin',200:'extralight',300:'light',400:'normal',500:'medium',600:'semibold',700:'bold',800:'extrabold',900:'black'};

export function transformConditionalValues(path, code, definitions = new Map(), { functionReturnsOnly = false } = {}) {
  const source = ts.createSourceFile(path, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [], parameters = new Map();
  function resolved(value, trail = []) {
    const expanded = value.replace(/var\((--qd-[\w-]+)\)/g, (_match, token) => {
      if (trail.includes(token) || !definitions.has(token)) throw new Error(`Unresolved canonical default ${token}`);
      return resolved(definitions.get(token), [...trail, token]);
    });
    return expanded.replace(/calc\((-?[\d.]+)(px)?\s*\*\s*(-?[\d.]+)\)/g,
      (_match, amount, unit, factor) => `${Number(amount) * Number(factor)}${unit ?? ''}`);
  }
  function confirmedStyle(node) {
    for (let current = node.parent; current; current = current.parent) {
      if (functionReturnsOnly) {
        if (ts.isFunctionLike(current)) return !!current.type && /^(?:React\.)?CSSProperties$/.test(current.type.getText(source));
        if (ts.isJsxAttribute(current) || ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) return false;
        continue;
      }
      if (ts.isJsxAttribute(current)) return current.name.getText(source) === 'style';
      if (ts.isVariableDeclaration(current) && current.type && /(?:^|\.)CSSProperties\b/.test(current.type.getText(source))) return true;
      if (ts.isAsExpression(current) && /(?:^|\.)CSSProperties\b/.test(current.type.getText(source))) return true;
      if (ts.isFunctionLike(current) || ts.isJsxElement(current) || ts.isJsxSelfClosingElement(current)) return false;
    }
    return false;
  }
  function capture(node, property) {
    if (ts.isConditionalExpression(node)) { capture(node.whenTrue, property); capture(node.whenFalse, property); return; }
    let value;
    if (ts.isStringLiteralLike(node)) value = node.text;
    else if (ts.isNumericLiteral(node)) value = Number(node.text);
    else if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) value = -Number(node.operand.text);
    if (value === undefined || (typeof value === 'string' && (!value.trim() || /var\(|url\(|^(?:inherit|initial|unset|revert|currentColor|auto|none|transparent)$/.test(value)))) return;
    const cssValue = typeof value === 'number' ? `${value}${unitless.has(property) ? '' : 'px'}` : value;
    let token;
    if (property === 'fontSize' && typeof value === 'number') token = `--qd-font-size-${value}`;
    else if (property === 'fontWeight' && weights[value]) token = `--qd-font-weight-${weights[value]}`;
    else if (/^(?:padding|margin|gap|rowGap|columnGap)/.test(property) && typeof value === 'number') token = `--qd-space-${String(value / 4).replace('.', '-')}`;
    else if (property === 'borderRadius' && value === 10) token = '--qd-radius';
    if (!token || !definitions.has(token)) token = `--qd-atelier-${property.replace(/[A-Z]/g, c => '-' + c.toLowerCase())}-${digest(property + ':' + cssValue).slice(0, 10)}`;
    if (definitions.has(token) && resolved(definitions.get(token)) !== cssValue) throw new Error(`Conflicting central default ${token}: ${definitions.get(token)} vs ${cssValue}`);
    if (!definitions.has(token)) parameters.set(token, cssValue);
    edits.push({ start: node.getStart(source), end: node.end, property, value: cssValue, token,
      line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
  }
  function visit(node) {
    if (ts.isPropertyAssignment(node)) {
      const property = node.name.getText(source).replace(/^['"]|['"]$/g, '');
      if (properties.has(property) && (functionReturnsOnly || ts.isConditionalExpression(node.initializer)) && confirmedStyle(node)) capture(node.initializer, property);
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
  const functionReturnsOnly = process.argv.includes('--function-returns');
  const section = functionReturnsOnly ? 'function' : 'conditional';
  const ledgerPath = join(ROOT, `source/style-adapters/atelier-${section}-values.json`);
  if (write && existsSync(ledgerPath)) throw new Error('Existing conditional migration must not be overwritten');
  const definitions = new Map();
  for (const file of ['patterns/foundation.css','patterns/components.css','patterns/foundation/atelier-values.css','patterns/foundation/atelier-core-values.css']) {
    for (const match of readFileSync(join(ROOT,file),'utf8').matchAll(/(--qd-[\w-]+)\s*:\s*([^;{}]+);/g)) if (!definitions.has(match[1])) definitions.set(match[1],match[2].trim());
  }
  const manifest = JSON.parse(readFileSync(join(product, 'lib/engine/validation-manifest.generated.json'), 'utf8'));
  const protectedFiles = new Set(Object.values(manifest).flatMap(engine => Object.keys(engine.dependencies)));
  const files = [], tokens = new Map();
  for (const path of codeFiles(product).filter(path => /\.tsx$/.test(path) && !protectedFiles.has(path))) {
    const code = readFileSync(join(product, path), 'utf8');
    if (code.includes('q-design-header-end')) continue; // Canonical copies already have an owning source.
    const result = transformConditionalValues(path,code,definitions,{functionReturnsOnly});
    if (!result.edits.length) continue;
    for (const [token,value] of result.parameters) tokens.set(token,value);
    files.push({ path,beforeHash:digest(code),afterHash:digest(result.output),conversions:result.edits });
    if (write) {
      const backup = join(ROOT,`../tmp/atelier-${section}-backup`,path);
      mkdirSync(dirname(backup),{recursive:true});writeFileSync(backup,code);writeFileSync(join(product,path),result.output);
    }
  }
  const ledger = {version:1,scope:functionReturnsOnly ? 'Only literal presentation values in functions explicitly returning CSSProperties. Data and nested callback functions excluded.' : 'Only literal branches of conditional CSS property values in proven JSX style/CSSProperties contexts; conditions and calculated expressions remain identical.',files};
  writeFileSync(write ? ledgerPath : join(ROOT,`../tmp/atelier-${section}-values-dry.json`),JSON.stringify(ledger,null,2)+'\n');
  if (write) {
    const cssPath=join(ROOT,'patterns/foundation/atelier-core-values.css');
    writeFileSync(cssPath,readFileSync(cssPath,'utf8').trimEnd()+`\n\n/* Reviewed ${section} defaults: source/style-adapters/atelier-${section}-values.json. */\n:root {\n`
      +[...tokens].sort(([a],[b])=>a.localeCompare(b)).map(([token,value])=>`  ${token}: ${value};`).join('\n')+'\n}\n');
  }
  console.log(JSON.stringify({write,files:files.length,conversions:files.reduce((sum,file)=>sum+file.conversions.length,0),newParameters:tokens.size}));
}
