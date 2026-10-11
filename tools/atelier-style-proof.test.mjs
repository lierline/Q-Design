import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { collectAdapterReferences, expressionProof, classExpressionProof, importedReference, localBindings, namedValueBoundary, primaryVariables, reviewedLeafProof, sourceImports } from './atelier-style-proof.mjs';
const ts = createRequire('D:/Claude/Q-Atelier/package.json')('typescript');
const hash = code => createHash('sha256').update(code).digest('hex');
const variables = new Map(['--qd-text', '--qd-radius', '--qd-space-2', '--qd-font-size-12', '--qd-leading-normal', '--qd-font-family-ui']
  .map(variable => [variable, { path: 'central.css', line: 2, variable, hash: 'verified-css' }]));
const source = code => ts.createSourceFile('components/example.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

test('exact reviewed leaves compose without authorizing sibling values or same-name references',()=>{
 const code='const target={height:height,color:"var(--qd-text)",width:height};',sf=source(code),obj=sf.statements[0].declarationList.declarations[0].initializer;
 const reviewedNodes=new WeakMap(),review={decision:'delegated-renderer-parameter',ruleId:'exact-dimension-forwarding',evidence:[{path:'current.tsx',line:1,hash:'current'}]};
 reviewedNodes.set(obj.properties[0].initializer,reviewedLeafProof({kind:'object-property'},review));
 const prove=node=>expressionProof({ts,node,sf,property:'style',imports:new Map(),file:sf.fileName,references:new Map(),variables,reviewedNodes,locals:localBindings(ts,sf,hash)});
 assert.equal(prove(obj),null);
 assert.equal(prove(obj.properties[0].initializer).evidence[0].delegatedReview,true);
 assert.equal(prove(obj.properties[2].initializer),null);
 assert.equal(reviewedLeafProof({kind:'object-property'},{...review,ruleId:'api-payload',decision:'business-data'}),null);
 assert.equal(reviewedLeafProof({kind:'object-property'},{...review,ruleId:'exact-measured-element-position',decision:'coordinate-boundary'}).evidence[0].dataGeometryReview,true);
});

test('numeric unit fragments require every conditional branch to be numeric while reset colors remain structural',()=>{
  const vars=new Map(variables);vars.set('--qd-border-width',{path:'central.css',line:3,hash:'css'});
  const refs=collectAdapterReferences({ts,variables:vars,hash,numericFiles:new Set(['lib/runtime.ts']),files:new Map([['lib/runtime.ts','export const N={small:1,large:2};export const S={length:"var(--qd-space-2)"};']])});
  const prove=(expr,property='border')=>{const sf=source('import {N,S} from "@/lib/runtime";const v='+expr+';');return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property,imports:sourceImports(ts,sf),file:sf.fileName,references:refs,variables:vars,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('`${on?N.small:N.large}px var(--qd-border-width) ${on?"var(--qd-text)":"transparent"}`')?.central);
  assert.equal(prove('`${on?N.small:S.length}px`','width'),null);
  assert.equal(prove('`${on?N.small:9}px`','width'),null);
  assert.equal(prove('`${N.small}px solid red`'),null);
  assert.ok(prove('`left ${"var(--qd-space-2)"}, stroke-dasharray ${"var(--qd-space-2)"}`','transition')?.central);
});

test('standalone canonical recipe functions prove each caller value and enforce declared arity',()=>{
 const code='export function divider(ink:string,faded:string){return `linear-gradient(90deg,${ink},${faded})`;}export const arrow=(ink:string)=>ink;';
 const refs=collectAdapterReferences({ts,files:new Map([['lib/central.ts',code]]),variables,hash,centralFiles:new Map([['lib/central.ts',{path:'source/central.ts',line:1,hash:hash(code)}]])});
 const prove=expr=>{const sf=source('import {divider,arrow}from "@/lib/central";const v='+expr+';');return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'background',imports:sourceImports(ts,sf),file:sf.fileName,references:refs,variables});};
 assert.ok(prove('divider("var(--qd-text)","var(--qd-text)")')?.central);
 assert.ok(prove('arrow("var(--qd-text)")')?.central);
 assert.equal(prove('divider("var(--qd-text)","red")'),null);
 assert.equal(prove('divider("var(--qd-text)")'),null);
 assert.equal(prove('arrow("var(--qd-text)","var(--qd-text)")'),null);
});

test('passing an immutable central scalar does not grant mutation authority, unlike object escapes',()=>{
  const refs=collectAdapterReferences({ts,variables,hash,files:new Map([['lib/palette.ts','export const T={ink:"var(--qd-text)"};export function color(on){return on?T.ink:T.ink;}export function object(){return {color:T.ink};}']])});
  const prove=body=>{const sf=source('import {T,color,object} from "@/lib/palette";'+body);return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'color',imports:sourceImports(ts,sf),file:sf.fileName,references:refs,variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('const ink=T.ink; consume(ink); const v=ink;')?.central);
  assert.ok(prove('const ink=color(state); consume(ink); const v=ink;')?.central);
  assert.ok(prove('const ink=state?T.ink:T.ink; consume(ink); const v=ink;')?.central);
  assert.equal(prove('const ink="red"; consume(ink); const v=ink;'),null);
  assert.equal(prove('const ink=T.ink; ink="red"; const v=ink;'),null);
  assert.equal(prove('const palette={color:T.ink}; consume(palette); const v=palette.color;'),null);
  assert.equal(prove('const palette=object(); consume(palette); const v=palette.color;'),null);
  assert.equal(prove('const palette=object();const alias=palette;consume(alias);const v=palette.color;'),null);
});

test('escaping a proven primitive projection does not invalidate its map, while object projections remain unsafe',()=>{
  const refs=collectAdapterReferences({ts,variables,hash,files:new Map([['lib/palette.ts','export const T={ink:"var(--qd-text)"};']])});
  const prove=body=>{const sf=source('import {T} from "@/lib/palette";'+body);return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'color',imports:sourceImports(ts,sf),file:sf.fileName,references:refs,variables,locals:localBindings(ts,sf,hash,refs)});};
  assert.ok(prove('const palette={ink:T.ink};const color=palette[key];consume(color);const v=palette.ink;')?.central);
  assert.ok(prove('const palette={ink:T.ink};const color=palette.ink;consume(color);const v=color;')?.central);
  assert.equal(prove('const palette={child:{color:T.ink}};const child=palette.child;mutate(child);const v=palette.child.color;'),null);
  assert.equal(prove('const palette={ink:T.ink};consume(palette);const v=palette.ink;'),null);
  assert.equal(prove('const palette={ink:T.ink,other:{color:T.ink}};const color=palette[key];mutate(color);const v=palette.ink;'),null);
  assert.equal(prove('const palette={ink:"red"};const color=palette[key];consume(color);const v=color;'),null);
});

test('finite destructured map colors prove every source element and reject mutable or open data',()=>{
  const prove=code=>{const sf=source(code);let node;const walk=n=>{if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='color')node=n.initializer;ts.forEachChild(n,walk);};walk(sf);return expressionProof({ts,node,sf,property:'color',imports:sourceImports(ts,sf),file:sf.fileName,references:new Map(),variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('const rows=[{ink:"var(--qd-text)"},{ink:"var(--qd-text)"}];rows.map(({ink:c})=>({color:c}));')?.central);
  assert.ok(prove('const palette={ink:"var(--qd-text)"};const {ink:c}=palette;const v={color:c};')?.central);
  assert.equal(prove('const rows=[{ink:"var(--qd-text)"},{ink:"red"}];rows.map(({ink:c})=>({color:c}));'),null);
  assert.equal(prove('const rows=[{ink:"var(--qd-text)"},...data];rows.map(({ink:c})=>({color:c}));'),null);
  assert.equal(prove('const rows=[{ink:"var(--qd-text)"}];mutate(rows);rows.map(({ink:c})=>({color:c}));'),null);
  assert.equal(prove('const palette={ink:"var(--qd-text)"};mutate(palette);const {ink:c}=palette;const v={color:c};'),null);
  assert.equal(prove('const rows=[{ink:"var(--qd-text)"}];rows.map(({ink:c})=>{c="red";return {color:c};});'),null);
  assert.equal(prove('remoteRows.map(({ink:c})=>({color:c}));'),null);
});

test('CSS composition syntax admits no hidden nonzero lengths, color literals or tint percentages',()=>{
  const prove=(value,property)=>{const sf=source('const value='+value+';');return expressionProof({ts,node:sf.statements[0].declarationList.declarations[0].initializer,sf,property,imports:new Map(),file:sf.fileName,references:new Map(),variables});};
  assert.ok(prove('`calc(-1 * ${"var(--qd-space-2)"})`','marginTop')?.central);
  assert.ok(prove('`${"var(--qd-radius)"} 0 0 ${"var(--qd-radius)"}`','borderRadius')?.central);
  assert.ok(prove('`color-mix(in srgb, ${"var(--qd-text)"} var(--qd-space-2), transparent)`','background')?.central);
  assert.equal(prove('`calc(-2 * ${"var(--qd-space-2)"})`','marginTop'),null);
  assert.equal(prove('`${"var(--qd-radius)"} 8px`','borderRadius'),null);
  assert.equal(prove('`color-mix(in srgb, ${"var(--qd-text)"} 25%, transparent)`','background'),null);
  assert.equal(prove('`color-mix(in srgb, ${"var(--qd-text)"}, red)`','background'),null);
});

test('local style helpers prove every return branch and substitute only consumed visual parameters', () => {
  function prove(code) {
    const sf = source(code);
    return expressionProof({ ts, node: sf.statements.at(-1).declarationList.declarations[0].initializer,
      sf, property: 'style', imports: sourceImports(ts, sf), file: sf.fileName,
      references: new Map(), variables, locals: localBindings(ts, sf, hash) });
  }
  assert.ok(prove('function look(active) { return active ? { color: "var(--qd-text)" } : { display: "none" }; } const v=look(apiState);')?.central);
  assert.ok(prove('const look=(text, color="var(--qd-text)")=>({color}); const v=look(userText);')?.central);
  assert.ok(prove('function look(color) { return {color}; } const v=look("var(--qd-text)");')?.central);
  assert.equal(prove('function look(color) { return {color}; } const v=look("red");'), null);
  assert.equal(prove('function look(active) { if(active)return {color:"red"}; return {color:"var(--qd-text)"}; } const v=look(apiState);'), null);
  assert.equal(prove('function look(color) { color="red"; return {color}; } const v=look("var(--qd-text)");'), null);
  assert.equal(prove('function look(color) { change(color); return {color}; } const v=look("var(--qd-text)");'), null);
  assert.equal(prove('function look(color) { return {color}; } const v=look(unknownColor);'), null);
  assert.equal(prove('const look=()=>look(); const v=look();'), null);
});

test('imported selectors prove their actual returned values; returned caller styles and raw branches cannot inherit trust',()=>{
  const palette='export const T={text:"var(--qd-text)"}; export const riskColor=(risk)=>risk>1?T.text:T.text;';
  const selector='import {T} from "./tokens"; export function choice(on){return on?{color:T.text}:{display:"none"};} export const unsafe=(color)=>({color}); export const raw=(active)=>active?{color:T.text}:{color:"red"};';
  const refs=collectAdapterReferences({ts,files:new Map([['lib/design/tokens.ts',palette],['lib/design/choices.tsx',selector]]),variables,hash});
  const prove=expr=>{const sf=source('import {choice,unsafe,raw} from "@/lib/design/choices"; import {riskColor} from "@/lib/design/tokens"; const v='+expr+';');return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'style',imports:sourceImports(ts,sf),file:sf.fileName,references:refs,variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('choice(serverState)')?.central);assert.ok(prove('riskColor(serverRisk)')?.central);
  assert.equal(prove('unsafe(callerColor)'),null);assert.equal(prove('raw(active)'),null);
});
test('nested immutable lookup properties require every indexed visual branch and reject mutation or open spreads',()=>{
  const prove=code=>{const sf=source(code);return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'color',imports:sourceImports(ts,sf),file:sf.fileName,references:new Map(),variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('const states={open:{label:"열림",color:"var(--qd-text)"},closed:{label:"닫힘",color:"var(--qd-text)"}}; const v=states[state].color;')?.central);
  assert.ok(prove('const states=[{label:"열림",color:"var(--qd-text)"},{label:"닫힘",color:"var(--qd-text)"}]; const v=states[index].color;')?.central);
  assert.equal(prove('const states={open:{color:"var(--qd-text)"},closed:{color:"red"}}; const v=states[state].color;'),null);
  assert.equal(prove('const states={open:{color:"var(--qd-text)"},...remote}; const v=states[state].color;'),null);
  assert.equal(prove('const states={open:{color:"var(--qd-text)"}}; states.open.color="red"; const v=states[state].color;'),null);
});

test('complete var sequences are proven; mixed literals, missing declarations and invalid var syntax remain unknown', () => {
  assert.deepEqual(primaryVariables('var(--qd-text, rgb(1, 2, 3)) var(--qd-radius, 10px)', variables), ['--qd-text', '--qd-radius']);
  for (const value of ['1px var(--qd-text)', 'var(--qd-text) red', 'var(--missing, 2px)', 'var(--qd-text', 'var(--qd-text;)']) assert.equal(primaryVariables(value, variables), null);
});

test('exact imports and exported members resolve, while wrong modules and local shadowing fail closed', () => {
  const files = new Map([['lib/design/tokens.ts', 'export const T = { text: "var(--qd-text)", hardcoded: "red" };']]);
  const refs = collectAdapterReferences({ ts, files, variables, hash });
  const imports = sourceImports(ts, source('import { T as Ink } from "@/lib/design/tokens"; const value = Ink.text;'));
  assert.ok(importedReference('Ink.text', imports, 'components/example.tsx', refs)?.some(item => item.variable === '--qd-text'));
  assert.equal(importedReference('Ink.hardcoded', imports, 'components/example.tsx', refs), null);
  assert.equal(importedReference('Ink.missing', imports, 'components/example.tsx', refs), null);
  const shadowed = sourceImports(ts, source('import { T } from "@/lib/design/tokens"; function local(T) { return T.text; }'));
  assert.equal(importedReference('T.text', shadowed, 'components/example.tsx', refs), null);
  const unrelated = sourceImports(ts, source('import { T } from "./business-data"; const color = T.text;'));
  assert.equal(importedReference('T.text', unrelated, 'components/example.tsx', refs), null);
  const changed = collectAdapterReferences({ ts, variables, hash, files: new Map([['lib/design/tokens.ts', 'export const T = { text: "red" };']]) });
  assert.equal(importedReference('Ink.text', imports, 'components/example.tsx', changed), null);
});

test('template fallbacks may be dynamic only inside a declared primary variable', () => {
  const files = new Map([['lib/design/q-design-contract.ts', 'export const QD = { radius: `var(--qd-radius, ${RADIUS.md}px)`, mixed: `${raw} var(--qd-text)` } as const;']]);
  const refs = collectAdapterReferences({ ts, variables, hash, files });
  assert.ok(refs.has('lib/design/q-design-contract.ts::QD.radius'));
  assert.equal(refs.has('lib/design/q-design-contract.ts::QD.mixed'), false);
});

test('actual reviewed scale helper propagates exact declaration proof and rejects semantic mutation', () => {
  const file = 'lib/design/q-design-scale.ts';
  const code = fs.readFileSync('D:/Claude/Q-Atelier/' + file, 'utf8');
  const refs = collectAdapterReferences({ ts, variables, hash, files: new Map([[file, code]]) });
  for (const member of ['QDScale.space.2', 'QDScale.font.12', 'QDScale.leading.normal', 'QDScale.family.ui', 'QDScale.radius']) assert.ok(refs.has(`${file}::${member}`), member);
  const changed = code.replace('Object.fromEntries(', 'Object.fromEntriesBroken(');
  const broken = collectAdapterReferences({ ts, variables, hash, files: new Map([[file, changed]]) });
  assert.equal(broken.has(`${file}::QDScale.space.2`), false);
  assert.ok(broken.has(`${file}::QDScale.radius`));
  const undeclared = new Map(variables); undeclared.delete('--qd-font-size-12');
  assert.equal(collectAdapterReferences({ ts, variables: undeclared, hash, files: new Map([[file, code]]) }).has(`${file}::QDScale.font.12`), false);
});

test('compound proof requires every conditional branch, template fragment and object property', () => {
  const refs = collectAdapterReferences({ ts, variables, hash, files: new Map([
    ['lib/design/tokens.ts', 'export const T = { text: "var(--qd-text)" };'],
    ['lib/design/q-design-contract.ts', 'export const QD = { radius: "var(--qd-radius)" };'],
  ]) });
  const prove = expression => {
    const sf = source('import { T } from "@/lib/design/tokens"; import { QD } from "@/lib/design/q-design-contract"; const value = ' + expression + ';');
    return expressionProof({ ts, node: sf.statements.at(-1).declarationList.declarations[0].initializer, sf,
      property: 'padding', imports: sourceImports(ts, sf), file: 'components/example.tsx', references: refs, variables });
  };
  assert.ok(prove('active ? T.text : T.text')?.central);
  assert.equal(prove('active ? T.text : "red"'), null);
  assert.ok(prove('`0 ${QD.radius} ${QD.radius}`')?.central);
  assert.equal(prove('`12px ${QD.radius}`'), null);
  assert.equal(prove('`1px solid ${T.text}`'), null);
  assert.ok(prove('{ display: "flex", color: T.text, borderRadius: QD.radius }')?.central);
  assert.equal(prove('{ display: "flex", color: T.text, fontSize: 99 }'), null);
  assert.equal(prove('{ color: T.text, ...unknown }'), null);
  assert.equal(prove('{ color: T.text, background: "pink" }'), null);
  assert.ok(prove('`var(--qd-radius) ${T.text}`')?.central);
  assert.equal(prove('`var(--missing) ${T.text}`'), null);
});

test('reviewed alpha only proves colors and ratios independently sourced from central adapters', () => {
  const tokenFile = 'lib/design/tokens.ts', runtimeFile = 'lib/design/q-design-runtime.ts';
  const tokenSource = fs.readFileSync('D:/Claude/Q-Atelier/' + tokenFile, 'utf8');
  const vars = new Map(variables); vars.set('--qa-text', { path: 'central.css', line: 1, variable: '--qa-text' });
  const files = new Map([[tokenFile, tokenSource], [runtimeFile, 'export const QDRuntime = { alpha: { tint: 0.1 } } as const;']]);
  const refs = collectAdapterReferences({ ts, variables: vars, hash, files, numericFiles: new Set([runtimeFile]) });
  const prove = (expression, references = refs) => {
    const sf = source('import { T, alpha } from "@/lib/design/tokens"; import { QDRuntime } from "@/lib/design/q-design-runtime"; const value = ' + expression + ';');
    return expressionProof({ ts, node: sf.statements.at(-1).declarationList.declarations[0].initializer, sf,
      property: 'background', imports: sourceImports(ts, sf), file: 'components/example.tsx', references, variables: vars });
  };
  assert.ok(prove('alpha(T.text, QDRuntime.alpha.tint)')?.central);
  assert.equal(prove('alpha(T.text, 0.1)'), null);
  assert.equal(prove('alpha("red", QDRuntime.alpha.tint)'), null);
  const changedFiles = new Map(files); changedFiles.set(tokenFile, tokenSource.replace('const clampedA = Math.max(0, Math.min(1, a));', 'const clampedA = 0.5;'));
  assert.equal(prove('alpha(T.text, QDRuntime.alpha.tint)', collectAdapterReferences({ ts, variables: vars, hash, files: changedFiles, numericFiles: new Set([runtimeFile]) })), null);
});

test('fingerprint-verified central recipes support direct constant references without approving caller fragments', () => {
  const file = 'lib/design/q-design-email.ts', code = 'export const EMAIL = { title: "font-size:14px;color:#333" };';
  const files = new Map([[file, code]]);
  const refs = collectAdapterReferences({ ts, variables, hash, files, centralFiles: new Map([[file, { path: 'patterns/email.ts', line: 1, hash: hash(code) }]]) });
  const sf = source('import { EMAIL } from "@/lib/design/q-design-email"; const value = EMAIL.title;');
  assert.ok(importedReference('EMAIL.title', sourceImports(ts, sf), 'components/example.tsx', refs));
  assert.ok(importedReference('EMAIL', sourceImports(ts, sf), 'components/example.tsx', refs));
  assert.equal(importedReference('EMAIL.title', sourceImports(ts, sf), 'components/example.tsx', collectAdapterReferences({ ts, variables, hash, files })), null);
});

test('verified central HTML builders expose only explicit recipe members without trusting arbitrary calls', () => {
  const file = 'lib/design/q-design-html.ts';
  const code = 'export function build(p) { return { body: `color:${p.text}`, nested: { title: "font-size:14px" } }; } export const HTML_STYLE = build(PALETTE);';
  const files = new Map([[file, code]]);
  const centralFiles = new Map([[file, { path: 'patterns/html.ts', hash: hash(code), line: 1 }]]);
  const refs = collectAdapterReferences({ ts, variables, hash, files, centralFiles });
  const sf = source('import { HTML_STYLE } from "@/lib/design/q-design-html"; const x = HTML_STYLE.body;');
  const imports = sourceImports(ts, sf);
  assert.ok(importedReference('HTML_STYLE.body', imports, sf.fileName, refs));
  assert.ok(importedReference('HTML_STYLE.nested.title', imports, sf.fileName, refs));
  assert.equal(importedReference('HTML_STYLE.missing', imports, sf.fileName, refs), null);
  assert.equal(importedReference('HTML_STYLE.body', imports, sf.fileName, collectAdapterReferences({ ts, variables, hash, files })), null);
  assert.equal(importedReference('HTML_STYLE.body(unknown)', imports, sf.fileName, refs), null);
});

test('local immutable style maps and spreads resolve by lexical identity and fail closed on writes, escapes and unknown members', () => {
  const refs = collectAdapterReferences({ ts, variables, hash, files: new Map([
    ['lib/design/tokens.ts', 'export const T = { text: "var(--qd-text)" };'],
  ]) });
  const prove = (preamble, value, property = 'style') => {
    const sf = source('import { T } from "@/lib/design/tokens"; ' + preamble + '; const target = ' + value + ';');
    return expressionProof({ ts, node: sf.statements.at(-1).declarationList.declarations[0].initializer, sf,
      property, imports: sourceImports(ts, sf), file: sf.fileName, references: refs, variables, locals: localBindings(ts, sf, hash) });
  };
  assert.ok(prove('const base = { color: T.text, display: "flex" }', '{ ...base, padding: "var(--qd-space-2)" }')?.central);
  assert.ok(prove('const tones = { ok: T.text, fail: T.text }', 'tones[state]', 'color')?.central);
  assert.equal(prove('const tones = { ok: T.text, fail: "pink" }', 'tones[state]', 'color'), null);
  assert.equal(prove('const tones = { ok: T.text, fail: "pink" }', 'tones.fail', 'color'), null);
  assert.ok(prove('const tones = { ok: T.text, fail: "pink" }', 'tones.ok', 'color')?.central);
  for (const mutation of ['base.color = "pink"', 'Object.assign(base, { color: "pink" })', 'mutate(base)', 'const alias = base; alias.color = "pink"']) {
    assert.equal(prove('const base = { color: T.text }; ' + mutation, '{ ...base }'), null, mutation);
  }
  assert.equal(prove('let base = { color: T.text }', '{ ...base }'), null);
  assert.equal(prove('const base = { color: T.text }; function f(base) { return base; }', '{ ...base, fontSize: 99 }'), null);
  assert.equal(prove('const unknown = { fontSize: 99 }', '{ color: T.text, ...unknown }'), null);
  assert.equal(prove('const a = b; const b = a', '{ ...a }'), null);
});

test('unset branches and transition target keywords add no independent visual defaults', () => {
  const prove = (value, property) => {
    const sf = source('const target = ' + value + ';');
    return expressionProof({ ts, node: sf.statements[0].declarationList.declarations[0].initializer, sf,
      property, imports: new Map(), file: sf.fileName, references: new Map(), variables, locals: localBindings(ts, sf, hash) });
  };
  assert.ok(prove('active ? "var(--qd-text)" : undefined', 'color')?.central);
  assert.ok(prove('active ? "var(--qd-text)" : null', 'color')?.central);
  assert.ok(prove('active ? "var(--qd-radius)" : "none"', 'borderBottom')?.central);
  assert.ok(prove('`background ${"var(--qd-text)"}, color ${"var(--qd-text)"}`', 'transition')?.central);
  assert.equal(prove('`background 200ms ${"var(--qd-text)"}`', 'transition'), null);
});

test('only complete native and reviewed HTTP/date bindings are data boundaries; nested CSS and fake helpers remain unknown', () => {
  const file = 'lib/api/fetch-json.ts', code = fs.readFileSync('D:/Claude/Q-Atelier/' + file, 'utf8');
  const refs = collectAdapterReferences({ ts, variables, hash, files: new Map([[file, code]]) });
  const prove = (value, preamble = 'import { fetchJson } from "@/lib/api/fetch-json";', references = refs) => {
    const sf = source(preamble + '; const r = ' + value + ';');
    return namedValueBoundary({ ts, node: sf.statements.at(-1).declarationList.declarations[0].initializer,
      sf, imports: sourceImports(ts, sf), file: sf.fileName, references, locals: localBindings(ts, sf, hash) });
  };
  assert.ok(prove('await fetchJson("/api/items")'));
  assert.ok(prove('await fetch("/api/items")'));
  assert.ok(prove('new Date(iso)'));
  assert.equal(prove('await fetchJson("/api/items")', 'import { fetchJson } from "./fake";'), null);
  assert.equal(prove('await fetch("/api/items")', 'const fetch = () => "red";'), null);
  assert.equal(prove('new Date(iso)', 'const Date = class Fake {};'), null);
  assert.equal(prove('(await fetchJson("/api/items")).data.color'), null);
  assert.equal(prove('await arbitrary("/api/items")'), null);
  const changed = collectAdapterReferences({ ts, variables, hash, files: new Map([[file, code.replace('data: body as T', 'data: "red" as T')]]) });
  assert.equal(prove('await fetchJson("/api/items")', undefined, changed), null);
});

test('central language helpers treat text as a branch condition while proving every explicit visual argument', () => {
  const file = 'lib/design/q-design-labels.ts', code = fs.readFileSync('D:/Claude/Q-Atelier/' + file, 'utf8');
  const refsFor = source => collectAdapterReferences({ ts, variables, hash, files: new Map([[file, source]]), centralFiles: new Map([[file, { path: 'patterns/foundation/atelier-labels.ts', line: 1, hash: hash(source) }]]) });
  const refs = refsFor(code);
  const prove = (value, references = refs) => {
    const sf = source('import { QDText, labelCase, labelTracking, labelWordSpacing } from "@/lib/design/q-design-labels"; const target = ' + value + ';');
    return expressionProof({ ts, node: sf.statements.at(-1).declarationList.declarations[0].initializer, sf,
      property: 'letterSpacing', imports: sourceImports(ts, sf), file: sf.fileName, references, variables, locals: localBindings(ts, sf, hash) });
  };
  assert.ok(prove('labelCase(untrustedText)')?.central);
  assert.ok(prove('labelWordSpacing(untrustedText)')?.central);
  assert.ok(prove('labelTracking(untrustedText)')?.central);
  const key = [...refs.keys()].find(key => /::QDText\.tracking\./.test(key)).split('::')[1];
  assert.ok(prove(`labelTracking(untrustedText, ${key})`)?.central);
  assert.equal(prove('labelTracking(untrustedText, 1.5)'), null);
  assert.equal(prove('labelTracking(untrustedText, arbitraryCallerValue)'), null);
  assert.equal(prove('labelCase(untrustedText)', refsFor(code.replace('return hasHangul(node) ? LABEL.hangulCase : LABEL.latinCase;', 'return node as never;'))), null);
});

test('reviewed grain helpers require central width/style, alpha semantics, ratio and caller color', () => {
  const paths = ['lib/design/grain.ts', 'lib/design/tokens.ts', 'lib/design/q-design-runtime.ts'];
  const files = new Map(paths.map(file => [file, fs.readFileSync('D:/Claude/Q-Atelier/' + file, 'utf8')]));
  const vars = new Map(variables);
  for (const variable of ['--qa-text', '--qd-border-width', '--qd-atelier-border-style-5ed175bd8d']) vars.set(variable, { path: 'central.css', variable, line: 1 });
  const refsFor = (sources = files, declarations = vars) => collectAdapterReferences({ ts, files: sources, variables: declarations, hash, numericFiles: new Set(['lib/design/q-design-runtime.ts']) });
  const prove = (expression, references = refsFor()) => {
    const sf = source('import { T } from "@/lib/design/tokens"; import { ruleBand, tintBorder } from "@/lib/design/grain"; const value = ' + expression + ';');
    return expressionProof({ ts, node: sf.statements.at(-1).declarationList.declarations[0].initializer, sf, property: 'style', imports: sourceImports(ts, sf), file: sf.fileName, references, variables: vars });
  };
  assert.ok(prove('ruleBand(T.text)')?.central);
  assert.ok(prove('tintBorder(T.text)')?.central);
  assert.equal(prove('ruleBand("red")'), null);
  assert.equal(prove('ruleBand(unknownColor)'), null);
  const changed = new Map(files); changed.set(paths[0], files.get(paths[0]).replace('QDRuntime.grain.tint', '0.5'));
  assert.equal(prove('ruleBand(T.text)', refsFor(changed)), null);
  const missing = new Map(vars); missing.delete('--qd-border-width');
  assert.equal(prove('ruleBand(T.text)', refsFor(files, missing)), null);
});

test('structural text flow, fill and grid syntax do not admit independent visual dimensions', () => {
  const prove = (value, property) => {
    const sf=source('const target = '+value+';');
    return expressionProof({ts,node:sf.statements[0].declarationList.declarations[0].initializer,sf,property,
      imports:new Map(),file:sf.fileName,references:new Map(),variables,locals:localBindings(ts,sf,hash)});
  };
  assert.ok(prove('{ overflow: "hidden", textOverflow: "ellipsis", width: "100%", minWidth: 0 }','style'));
  assert.ok(prove('`minmax(0, 1fr) ${"var(--qd-space-2)"}`','gridTemplateColumns')?.central);
  assert.ok(prove('`calc(100% - ${"var(--qd-space-2)"})`','width')?.central);
  assert.equal(prove('`minmax(220px, 1fr) ${"var(--qd-space-2)"}`','gridTemplateColumns'),null);
  assert.equal(prove('`repeat(3, 1fr) ${"var(--qd-space-2)"}`','gridTemplateColumns'),null);
  assert.equal(prove('{textOverflow:"ellipsis", width:"50%"}','style'),null);
  assert.equal(prove('{textOverflow:"ellipsis", minWidth:99}','style'),null);
});

test('exported immutable style objects and alias members prove their complete values, with mutation rejected',()=>{
  const base='import { T } from "./tokens"; export const ROW={display:"flex",color:T.text}; export const COLOR={ink:T.text};';
  const refsFor=code=>collectAdapterReferences({ts,variables,hash,files:new Map([['lib/design/components.tsx',code],['lib/design/tokens.ts','export const T={text:"var(--qd-text)"};']])});
  const sf=source('import { ROW,COLOR } from "@/lib/design/components"; const target=ROW;');
  const imports=sourceImports(ts,sf);
  assert.ok(importedReference('ROW',imports,sf.fileName,refsFor(base)));
  assert.ok(importedReference('COLOR.ink',imports,sf.fileName,refsFor(base)));
  assert.equal(importedReference('ROW',imports,sf.fileName,refsFor(base+' ROW.color="pink";')),null);
  assert.equal(importedReference('ROW',imports,sf.fileName,refsFor(base.replace('display:"flex"','fontSize:19'))),null);
});

test('the actual Hangul font adapter proves its two central branches and explicit tracking independently',()=>{
  const paths=['lib/design/hangul-text.tsx','lib/design/q-design-scale.ts','lib/design/q-design-labels.ts'];
  const files=new Map(paths.map(file=>[file,fs.readFileSync('D:/Claude/Q-Atelier/'+file,'utf8')]));
  const vars=new Map(variables);for(const variable of ['--qd-font-family-ui','--qd-font-family-mono','--qd-atelier-letter-spacing-1029873b1c'])vars.set(variable,{path:'patterns/test.css',line:1,variable});
  const refsFor=sources=>collectAdapterReferences({ts,variables:vars,hash,files:sources,centralFiles:new Map([[paths[2],{path:'patterns/foundation/atelier-labels.ts',line:1,hash:hash(files.get(paths[2]))}]])});
  const prove=(value,references=refsFor(files))=>{const sf=source('import { codeOrTextFont } from "@/lib/design/hangul-text"; import { QDText } from "@/lib/design/q-design-labels"; const target='+value+';');return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'style',imports:sourceImports(ts,sf),file:sf.fileName,references,variables:vars,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('codeOrTextFont(text)')?.central);
  assert.ok(prove('codeOrTextFont(text,QDText.tracking.codeMeta)')?.central);
  assert.equal(prove('codeOrTextFont(text,3)'),null);
  const changed=new Map(files);changed.set(paths[0],files.get(paths[0]).replace('QDScale.family.mono','"arbitrary font"'));
  assert.equal(prove('codeOrTextFont(text)',refsFor(changed)),null);
});

test('direct imported object aliases retain declared member evidence and never invent descendants',()=>{
  const central='export const DOC_FONT={sans:"Example UI",mono:"Example Mono"};';
  const files=new Map([['lib/design/q-design.doc.ts',central],['lib/export/brand.ts','import { DOC_FONT } from "@/lib/design/q-design.doc"; export const FONT=DOC_FONT;']]);
  const refs=collectAdapterReferences({ts,variables,hash,files,centralFiles:new Map([['lib/design/q-design.doc.ts',{path:'source/design/doc.ts',line:1,hash:hash(central)}]])});
  const sf=source('import { FONT } from "@/lib/export/brand"; const target=FONT.sans;'),imports=sourceImports(ts,sf);
  assert.ok(importedReference('FONT.sans',imports,sf.fileName,refs));assert.ok(importedReference('FONT.mono',imports,sf.fileName,refs));
  assert.equal(importedReference('FONT.unreviewed',imports,sf.fileName,refs),null);
});

test('finite map callback member reads prove every array candidate and reject mutation, escape, spreads and arbitrary map objects',()=>{
  const prove=(code)=>{
    const sf=source(code);let target;
    const visit=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(sf)==='target')target=node.initializer;ts.forEachChild(node,visit);};visit(sf);
    return expressionProof({ts,node:target,sf,property:'color',imports:sourceImports(ts,sf),file:sf.fileName,references:new Map(),variables,locals:localBindings(ts,sf,hash)});
  };
  const base='const cards=[{label:unknownBusinessText,color:"var(--qd-text)"},{label:"B",color:"var(--qd-space-2)"}]; cards.map(k=>{const target=k.color;return target;});';
  assert.ok(prove(base)?.central);
  assert.equal(prove(base.replace('color:"var(--qd-space-2)"','color:"red"')),null);
  assert.equal(prove(base.replace('cards.map','cards.push(external); cards.map')),null);
  assert.equal(prove(base.replace('const target=k.color','k.color="red"; const target=k.color')),null);
  assert.equal(prove(base.replace('const target=k.color','mutate(k); const target=k.color')),null);
  assert.equal(prove(base.replace('cards.map','const alias=cards; alias[0].color="red"; cards.map')),null);
  assert.equal(prove('const cards=[...external];cards.map(k=>{const target=k.color;});'),null);
  assert.equal(prove('const cards={map:fake};cards.map(k=>{const target=k.color;});'),null);
  assert.equal(prove(base.replace('const target=k.color;return target;','{const k={color:"red"}; const target=k.color;return target;}')),null);
  assert.equal(prove(base.replace('cards.map(k','cards.map((ignored,k)')),null);
});

test('direct exported scalar members never bypass mutation or escape guards',()=>{
  const code='export const PALETTE={color:"var(--qd-text)"};';
  const refs=sourceCode=>collectAdapterReferences({ts,variables,hash,files:new Map([['lib/palette.ts',sourceCode]])});
  assert.ok(refs(code).has('lib/palette.ts::PALETTE.color'));
  assert.equal(refs(code+'PALETTE.color="pink";').has('lib/palette.ts::PALETTE.color'),false);
  assert.equal(refs(code+'mutate(PALETTE);').has('lib/palette.ts::PALETTE.color'),false);
});

test('canonical object recipe calls require declared callable members, correct arity and every caller style argument',()=>{
  const file='lib/design/recipe.ts',code='export const STYLE={line:(color:string)=>`color:${color}`,static:"color:red"};';
  const refs=collectAdapterReferences({ts,variables,hash,files:new Map([[file,code]]),centralFiles:new Map([[file,{path:'patterns/recipe.ts',line:1,hash:hash(code)}]])});
  const prove=value=>{const sf=source('import {STYLE} from "@/lib/design/recipe";const target='+value+';');return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'embedded-interpolation',imports:sourceImports(ts,sf),file:sf.fileName,references:refs,variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('STYLE.line("var(--qd-text)")')?.central);
  assert.equal(prove('STYLE.line("red")'),null);assert.equal(prove('STYLE.line(unreviewedCaller)'),null);
  assert.equal(prove('STYLE.line()'),null);assert.equal(prove('STYLE.line("var(--qd-text)","var(--qd-text)")'),null);
  assert.equal(prove('STYLE.static("var(--qd-text)")'),null);assert.equal(prove('STYLE.missing("var(--qd-text)")'),null);
});

test('an exact separately verified style spread can compose only when all sibling authored values are proven',()=>{
  const prove=(tail,attach=true)=>{const sf=source('const target={...style,'+tail+'};'),node=sf.statements[0].declarationList.declarations[0].initializer,reviewedNodes=new WeakMap();
    if(attach)reviewedNodes.set(node.properties[0].expression,{central:false,evidence:[{path:'consumer.tsx',line:1,hash:'exact-source',delegatedReview:true}]});
    return expressionProof({ts,node,sf,property:'style',imports:new Map(),file:sf.fileName,references:new Map(),variables,locals:localBindings(ts,sf,hash),reviewedNodes});};
  assert.ok(prove('color:"var(--qd-text)"')?.evidence.some(item=>item.delegatedReview));
  assert.equal(prove('fontSize:19'),null);assert.equal(prove('color:"var(--qd-text)"',false),null);
  assert.equal(prove('color:"var(--qd-text)",...otherStyle'),null);
});

test('imported finite indexed maps require evidence for every selected leaf and reject unknown branches or mutation',()=>{
  const code='export const STATES={a:{label:"A",color:"var(--qd-text)"},b:{label:"B",color:"var(--qd-text)"}};';
  const prove=sourceCode=>{const references=collectAdapterReferences({ts,variables,hash,files:new Map([['lib/states.ts',sourceCode]])});const sf=source('import {STATES} from "@/lib/states"; const target=STATES[businessState].color;');return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'color',imports:sourceImports(ts,sf),file:sf.fileName,references,variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove(code)?.central);
  assert.equal(prove(code.replace('label:"B",color:"var(--qd-text)"','label:"B",color:"red"')),null);
  assert.equal(prove(code+'STATES.b.color="red";'),null);
  assert.equal(prove(code.replace('a:{label','...external,a:{label')),null);
  assert.equal(prove(code+'mutate(STATES);'),null);
});

test('zero visibility/reset syntax is structural but nonzero offsets, colored borders and timing stay unknown',()=>{
  const prove=(value)=>{const sf=source('const target='+value+';');return expressionProof({ts,node:sf.statements[0].declarationList.declarations[0].initializer,sf,property:'style',imports:new Map(),file:sf.fileName,references:new Map(),variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('{clip:"rect(0 0 0 0)",transform:"translateY(0)",borderRightColor:"transparent",wordSpacing:0}'));
  for(const value of ['{clip:"rect(0 0 1px 0)"}','{transform:"translateY(4px)"}','{borderRightColor:"red"}','{wordSpacing:1}','{transition:200}'])assert.equal(prove(value),null);
});

test('complete primary-variable templates require declared names and every dynamic fallback proof',()=>{
  const prove=(value)=>{const sf=source('const target='+value+';');return expressionProof({ts,node:sf.statements[0].declarationList.declarations[0].initializer,sf,property:'borderRadius',imports:new Map(),file:sf.fileName,references:new Map(),variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('`var(--qd-radius, var(--legacy-radius, ${"var(--qd-radius)"}))`')?.central);
  assert.equal(prove('`var(--missing, ${"var(--qd-radius)"})`'),null);
  assert.equal(prove('`var(--qd-radius, ${rawFallback})`'),null);
  assert.equal(prove('`var(--qd-radius, ${"var(--qd-radius)"}) 3px`'),null);
});

test('class expressions require each complete selector branch and reject partial names, unknown callers and mutated bindings',()=>{
  const classes=new Map(['qd-btn','qd-secondary','qa-btn'].map(name=>[name,{path:'central.css',hash:'actual',line:1}]));
  const prove=code=>{const sf=source(code);return classExpressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,classes,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('const target=active?"qd-btn qa-btn":"qd-btn qd-secondary";'));
  assert.ok(prove('const target=`qd-btn ${active?"qd-secondary":""}`;'));
  assert.ok(prove('const target=active&&"qd-btn";'));
  assert.equal(prove('const target=active?"qd-btn":"missing";'),null);
  assert.equal(prove('const target=`qd-${active?"btn":"secondary"}`;'),null);
  assert.equal(prove('const target=`qd-btn ${className}`;'),null);
  assert.equal(prove('let name="qd-btn";name="missing";const target=name;'),null);
});

test('local object-returning helpers prove selected fields across all returns and substitute exact consumed parameters',()=>{
  const prove=code=>{const sf=source(code);return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'color',imports:new Map(),file:sf.fileName,references:new Map(),variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('function state(data){return data?{label:unknownText,color:"var(--qd-text)"}:{label:other,color:"var(--qd-text)"};}const v=state(remote).color;')?.central);
  assert.ok(prove('const state=(color)=>({label:remoteText,color});const v=state("var(--qd-text)").color;')?.central);
  assert.equal(prove('const state=(color)=>({label:remoteText,color});const v=state("red").color;'),null);
  assert.equal(prove('function state(data){if(data)return {color:"red"};return {color:"var(--qd-text)"};}const v=state(remote).color;'),null);
  assert.equal(prove('function state(color){mutate(color);return {color};}const v=state("var(--qd-text)").color;'),null);
  assert.equal(prove('function state(color){return {...external,color};}const v=state("var(--qd-text)").color;'),null);
});

test('imported object selectors prove visual fields independently of labels and never trust caller colors',()=>{
  const code='export function status(data){return data?{label:data.title,color:"var(--qd-text)"}:{label:"Other",color:"var(--qd-text)"};}';
  const prove=definition=>{const references=collectAdapterReferences({ts,files:new Map([['lib/status.ts',definition]]),variables,hash});const sf=source('import {status}from "@/lib/status"; const target=status(remote).color;');return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'color',imports:sourceImports(ts,sf),file:sf.fileName,references,variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove(code)?.central);
  assert.equal(prove(code.replace('color:"var(--qd-text)"','color:data.color')),null);
  assert.equal(prove(code.replace('color:"var(--qd-text)"','color:"red"')),null);
  assert.equal(prove('export function status(color="var(--qd-text)"){return {color};}'),null);
});

test('central subobject aliases expose exact numeric members, allowing CSS units only on numeric values',()=>{
  const central='export const QD={main:{top:32},space:{top:"var(--qd-space-2)"}};';
  const files=new Map([['lib/central.ts',central],['lib/alias.ts','import {QD}from "./central";export const MAIN=QD.main;export const SPACE=QD.space;']]);
  const references=collectAdapterReferences({ts,files,variables,hash,centralFiles:new Map([['lib/central.ts',{path:'source/central.ts',line:1,hash:hash(central)}]])});
  const prove=value=>{const sf=source('import {MAIN,SPACE}from "@/lib/alias";const target='+value+';');return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'padding',imports:sourceImports(ts,sf),file:sf.fileName,references,variables,locals:localBindings(ts,sf,hash)});};
  assert.ok(prove('`${MAIN.top}px ${MAIN.top}px`')?.central);
  assert.equal(prove('`${MAIN.unknown}px`'),null);
  assert.equal(prove('`${SPACE.top}px`'),null);
  assert.equal(prove('`${MAIN.top}px 9px`'),null);
});

test('local aliases of closed central variants prove each branch and numeric arithmetic without admitting raw dimensions',()=>{
 const central='export const QD={sizes:{sm:{width:28,knob:12},md:{width:36,knob:16}},inset:2,css:"var(--qd-space-2)"};';
 const references=collectAdapterReferences({ts,files:new Map([['lib/central.ts',central]]),variables,hash,centralFiles:new Map([['lib/central.ts',{path:'source/central.ts',line:1,hash:hash(central)}]])});
 const prove=code=>{const sf=source('import {QD}from "@/lib/central";'+code);return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'width',imports:sourceImports(ts,sf),file:sf.fileName,references,variables,locals:localBindings(ts,sf,hash,references)});};
 assert.ok(prove('const dims=QD.sizes[size];const v=dims.width;')?.central);
 assert.ok(prove('const dims=QD.sizes[size];const offset=dims.width-dims.knob-QD.inset;const v=`${offset}px`;')?.central);
 assert.equal(prove('const dims=QD.sizes[size];const v=dims.width+5;'),null);
 assert.equal(prove('const dims=QD.sizes[size];const v=`${dims.width+QD.css}px`;'),null);
 assert.equal(prove('const dims=QD.sizes[size];mutate(dims);const v=dims.width;'),null);
 assert.equal(prove('const dims=QD.sizes[size];const v=dims.unknown;'),null);
});

test('imported size aliases preserve the finite key set and reject mutation or independent fallback metrics',()=>{
 const central='export const QD={sizes:{sm:{width:28},md:{width:36}}};';
 const alias='import {QD}from "./central";export const DIMS=QD.sizes;';
 const refs=body=>collectAdapterReferences({ts,files:new Map([['lib/central.ts',central],['lib/metrics.ts',body]]),variables,hash,centralFiles:new Map([['lib/central.ts',{path:'source/central.ts',line:1,hash:hash(central)}]])});
 const prove=(body,value)=>{const sf=source('import {DIMS}from "@/lib/metrics";const dims=DIMS[size];const v='+value+';');return expressionProof({ts,node:sf.statements.at(-1).declarationList.declarations[0].initializer,sf,property:'width',imports:sourceImports(ts,sf),file:sf.fileName,references:refs(body),variables,locals:localBindings(ts,sf,hash,refs(body))});};
 assert.ok(prove(alias,'dims.width')?.central);
 assert.equal(prove(alias,'dims.missing'),null);
 assert.equal(prove(alias,'dims.width+5'),null);
 assert.equal(prove(alias+'DIMS.sm.width=19;','dims.width'),null);
 assert.equal(prove(alias+'consume(DIMS);','dims.width'),null);
 assert.equal(prove('export const DIMS={sm:{width:28},md:{width:36}};','dims.width'),null);
});
