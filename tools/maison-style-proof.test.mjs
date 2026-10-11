import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { embeddedStyleSheets, predicateClassTokens, utilityBase, inlineStyleDependencies, canResolveInlineStyle, importedAttributeTargets, typedStyleDependencies, businessResultBindings, ignoresObjectParameter, explicitlyDiscardedBinding, uniqueConstScalars, conditionalScalarLeaves, importedValueBindings, exportedMemberPaths } from './maison-style-proof.mjs';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const require = createRequire(resolve(root, '../Q-Works/package.json'));
const ts = require('typescript'), postcss = require('postcss');

test('central print stylesheet conditional variants are parsed without evaluating product code', () => {
  const source = readFileSync(resolve(root, 'patterns/foundation/maison-print-styles.tsx'), 'utf8');
  const sheets = embeddedStyleSheets(source, ts, 'print.tsx');
  assert.equal(sheets.length, 8);
  assert.ok(sheets.some(sheet => sheet.css.includes('width:297mm;')));
  assert.ok(sheets.some(sheet => sheet.css.includes('width:210mm;')));
  for (const sheet of sheets) assert.doesNotThrow(() => postcss.parse(sheet.css));
});
test('unknown dynamic CSS and unrelated text are not accepted as selector evidence', () => {
  const source = 'const text=".invented { color: red }"; function X(){return <style>{`.x { color: ${untrusted()} }`}</style>}';
  assert.deepEqual(embeddedStyleSheets(source, ts, 'x.tsx'), []);
});
test('ternary predicates are distinguished from returned classes', () => {
  const sf = ts.createSourceFile('x.tsx', 'const x=<div className={cn(kind === "red" ? "bg-red-500" : "bg-blue-500")} />;', ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const proof = predicateClassTokens(sf, ts);
  assert.ok(proof.has('1:red'));
  assert.ok(!proof.has('1:bg-red-500'));
  assert.ok(!proof.has('1:bg-blue-500'));
});
test('same-line predicate and returned class collisions remain unresolved', () => {
  const sf = ts.createSourceFile('x.tsx', 'const x=<div className={cn(kind === "red" ? "bg-red-500" : "bg-blue-500", active && "red")} />;', ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  assert.ok(!predicateClassTokens(sf, ts).has('1:red'));
});
test('arbitrary state variants do not make a named utility an arbitrary style value', () => {
  assert.equal(utilityBase('data-[state=open]:animate-in'), 'animate-in');
  assert.equal(utilityBase('lg:grid-cols-[10rem_minmax(0,1fr)]'), 'grid-cols-[10rem_minmax(0,1fr)]');
  assert.equal(utilityBase('[&:hover]:w-[var(--qd-width)]'), 'w-[var(--qd-width)]');
});
test('style container evidence requires every property, including spreads, to be adjudicated', () => {
  const source='const x=<div style={{color: "var(--qd-text)", padding: 9, ...other}} />;';
  const sf=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const deps=[...inlineStyleDependencies(sf,ts).values()][0];
  assert.deepEqual(deps.map(x=>x.property),['color','padding','...']);
  assert.equal(canResolveInlineStyle(deps,d=>({decision:d.property==='color'?'token-reference-verified':'unknown'})),false);
  assert.equal(canResolveInlineStyle(deps,()=>({decision:'token-reference-verified'})),true);
});
test('style identifiers and shorthand objects are not silently approved by container analysis', () => {
  const source='const a=<div style={unresolved}/>; const b=<div style={{color}} />;';
  const sf=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.equal(inlineStyleDependencies(sf,ts).size,0);
});
test('JSX parameter evidence follows the exact named import including aliases, not an apparent renderer name',()=>{
  const source='import {Button as Action} from "@/components/ui/button";\nimport {Button} from "other";\nconst x=<><Action size="sm"/><Button size="sm"/></>;';
  const sf=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  // Same-line key collisions must remain unresolved in the line-based ledger.
  assert.equal(importedAttributeTargets(sf,ts).get('3:size:"sm"'),null);
  const separate=ts.createSourceFile('x.tsx',source.replace('/><Button','/>\n<Button'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.deepEqual(importedAttributeTargets(separate,ts).get('3:size:"sm"'),{module:'@/components/ui/button',exported:'Button',tag:'Action'});
  assert.equal(importedAttributeTargets(separate,ts).get('4:size:"sm"').module,'other');
});
test('a local binding shadowing the imported renderer is not accepted as a central component parameter',()=>{
  const sf=ts.createSourceFile('x.tsx','import {Button} from "@/components/ui/button"; function View({Button}){return <Button size="sm"/>}',ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.equal(importedAttributeTargets(sf,ts).size,0);
});
test('typed CSS object dependencies expose every member and do not approve an unowned member',()=>{
  const sf=ts.createSourceFile('x.tsx','const CELL: React.CSSProperties={color:"var(--qd-text)",padding:9}; const HEAD: React.CSSProperties={...CELL,textAlign:"center"}; const data={color:"red"};',ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const bindings=typedStyleDependencies(sf,ts);
  assert.deepEqual([...bindings.keys()],['CELL','HEAD']);
  assert.deepEqual(bindings.get('HEAD').map(item=>item.property),['...','textAlign']);
  assert.equal(canResolveInlineStyle(bindings.get('CELL'),item=>({decision:item.property==='color'?'token-reference-verified':'unknown'})),false);
});
test('mutable, shadowed and explicitly mutated style objects cannot serve as dependency proof',()=>{
  for(const source of ['let CELL: React.CSSProperties={color:"red"};','const CELL: React.CSSProperties={color:"red"}; function x(CELL){}','const CELL: React.CSSProperties={color:"red"}; CELL.color="blue";','const CELL: React.CSSProperties={color:"red"}; Object.assign(CELL,other);','const CELL: React.CSSProperties={color:"red"}; unknown(CELL);','export const CELL: React.CSSProperties={color:"red"};']){
    const sf=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    assert.equal(typedStyleDependencies(sf,ts).size,0,source);
  }
});
test('awaited result envelopes are distinguished from an actual SVG radius or escaped style value',()=>{
  const good=ts.createSourceFile('x.tsx','async function save(){const r=await updateRecord(); if(r.error)notify(r.error.message); return r.data.id;}',ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.ok(businessResultBindings(good,ts).has('1:r:await updateRecord()'));
  for(const source of ['async function x(){const r=await radius();return <circle r={r}/>;}','async function x(){const r=await styles(); return <div style={r}/>;}','async function x(){const r=await result();if(r.error)notify(r.error); consume(r);}','async function x(){const r=await result();if(r.error)notify(r.error); function child(r){return r.data}}']){
    const sf=ts.createSourceFile('x.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    assert.equal(businessResultBindings(sf,ts).size,0,source);
  }
});
test('ignored-prop proof fails when a renderer starts consuming or forwarding the value',()=>{
  const sf=code=>ts.createSourceFile('x.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  assert.equal(ignoresObjectParameter(sf('export function PageHelp({helpKey}){return <div>{helpKey}</div>}'),ts,'PageHelp','size'),true);
  for(const code of ['export function PageHelp({helpKey,size}){return <div>{size}</div>}','export function PageHelp({...props}){return <div {...props}/>}','export function PageHelp({helpKey}){return arguments[0].size}'])assert.equal(ignoresObjectParameter(sf(code),ts,'PageHelp','size'),false);
  assert.equal(explicitlyDiscardedBinding(sf('function Icon({strokeWidth,...props}){void strokeWidth; return <svg {...props}/>}'),ts,'strokeWidth'),true);
  assert.equal(explicitlyDiscardedBinding(sf('function Icon({strokeWidth,...props}){void strokeWidth; return <svg strokeWidth={strokeWidth} {...props}/>}'),ts,'strokeWidth'),false);
});
test('conditional scalar proof retains every branch and resolves only unambiguous const aliases',()=>{
  const sf=ts.createSourceFile('x.tsx','const LINE=qdPrint.ink; const ambiguous=1; function x(ambiguous){}',ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const aliases=uniqueConstScalars(sf,ts);
  assert.deepEqual(conditionalScalarLeaves('selected ? LINE : "red"',ts,aliases),['qdPrint.ink','red']);
  assert.equal(aliases.has('ambiguous'),false);
  assert.equal(conditionalScalarLeaves('a',ts,new Map([['a','b'],['b','a']])),null);
  assert.equal(conditionalScalarLeaves('calculate()',ts,aliases),null);
});
test('adapter member proof requires an existing export path and preserves exact import aliases',()=>{
  const sf=code=>ts.createSourceFile('x.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const members=exportedMemberPaths(sf('export const qdPrint={ink:"#000",size:{small:12}} as const; const privateValue={red:1};'),ts);
  assert.ok(members.has('qdPrint.size.small'));
  assert.ok(!members.has('qdPrint.size.nonexistent'));
  assert.ok(!members.has('privateValue.red'));
  const imports=importedValueBindings(sf('import {qdPrint as paper, other as qdPrint} from "@/lib/design/q-design-print";'),ts);
  assert.equal(imports.get('paper').exported,'qdPrint');
  assert.equal(imports.get('qdPrint').exported,'other');
  assert.equal(importedValueBindings(sf('import {qdPrint} from "@/lib/design/q-design-print"; function View({qdPrint}){return qdPrint.ink}'),ts).size,0);
});
test('adapter member proof does not guess dynamic spreads, multiple return shapes or unknown factory calls',()=>{
  const sf=code=>ts.createSourceFile('x.ts',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  for(const code of ['export const palette={size:12,...other};','export const palette={size:12,[key]:7};','export const palette=unknown();','function build(){if(flag)return {size:12};return {color:"red"}} export const palette=build();'])assert.ok(!exportedMemberPaths(sf(code),ts).has('palette.size'),code);
  const known=exportedMemberPaths(sf('function build(p){return {size:12,color:p.color}} export const palette=build(input);'),ts);
  assert.ok(known.has('palette.size'));
  assert.ok(known.has('palette.color'));
  for(const [file,member]of [['patterns/foundation/maison-runtime.ts','qdMaison.chart.period.barMaxWidth'],['patterns/foundation/maison-print.ts','qdPrint.companyMark.maxHeightMm'],['patterns/foundation/maison-email.ts','EMAIL_STYLES.body']])assert.ok(exportedMemberPaths(sf(readFileSync(resolve(root,file),'utf8')),ts).has(member),member);
});
