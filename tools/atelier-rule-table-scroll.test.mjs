import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ts=createRequire(new URL('../../Q-Atelier/package.json',import.meta.url))('typescript');
const ledger=JSON.parse(read('../reviews/atelier-rule-table-scroll-migration.json'));
const path=ledger.records[0].path;
const source=read('../../Q-Atelier/'+path);
test('long-rule-table changes preserve exact original rules, editor, events and client directive',()=>{
 const row=ledger.records[0];
 assert.equal(hash(source),row.afterHash);
 let original=source;
 for(const edit of [...row.edits].reverse()){
  assert.equal(original.slice(edit.start,edit.start+edit.after.length),edit.after);
  original=original.slice(0,edit.start)+edit.before+original.slice(edit.start+edit.after.length);
 }
 assert.equal(hash(original),row.beforeHash);
 assert.equal(row.edits.length,2);
 for(const edit of row.edits)assert.equal(edit.after,edit.before.replace(' columns=',' stickyHeader columns='));
 const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.equal(ast.statements[0].expression.text,'use client');
});
test('only long risk and dynamic tables opt into existing bounded sticky contract; mobile cards remain',()=>{
 const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const tables=[];
 function visit(n){if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(ast)==='DataTable')tables.push(n);ts.forEachChild(n,visit);}
 visit(ast);assert.equal(tables.length,3);
 for(const table of tables){
  const type=table.typeArguments[0].getText(ast);
  const attrs=table.attributes.properties;
  const sticky=attrs.some(a=>a.name?.getText(ast)==='stickyHeader'&&!a.initializer);
  assert.equal(sticky,type==='RiskCellRow'||type==='DynamicRuleRow');
  assert.ok(attrs.some(a=>a.name?.getText(ast)==='phoneRow'));
 }
 const common=read('../../Q-Atelier/lib/design/components.tsx');
 assert.match(common,/<ScrollTable[^>]*tall=\{stickyHeader\}/);
 assert.match(common,/stickyHeader\s*\?\s*\{[^}]*position:\s*'sticky'[^}]*background:\s*T.surface/);
 const css=read('../patterns/foundation/atelier.css');
 assert.match(css,/\.qa-scroll-table--tall\s*\{[^}]*max-height:\s*var\(--qd-table-scroll-max-height\)[^}]*overflow-y:\s*auto/);
});
