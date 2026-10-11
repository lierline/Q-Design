import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {reverseFiniteThird,reversePostFinalPresentation} from './atelier-migration-inverse.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier';
const require=createRequire(product+'/package.json'),postcss=require('postcss'),ts=require('typescript');
const read=p=>fs.readFileSync(p,'utf8');
const manifest=JSON.parse(read(root+'/reviews/atelier-trace-layout-migration.json'));
test('traceability adaptation changes only container presentation and preserves every handler',()=>{
 for(const file of manifest.files){let source=reverseFiniteThird(file.path,read(product+'/'+file.path));
  const sf=ts.createSourceFile(file.path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),classes=[];
  const walk=n=>{if(ts.isJsxAttribute(n)&&n.name.text==='className'&&n.initializer&&ts.isStringLiteral(n.initializer))classes.push(n.initializer.text);ts.forEachChild(n,walk);};walk(sf);
  assert.equal(classes.filter(c=>c==='qa-trace-status-controls').length,2);assert.equal(classes.filter(c=>c==='qa-trace-row-actions').length,1);
  assert.ok(source.includes('minWidth={QDPresentation.tableMinWidth[900]}'));assert.ok(source.includes('stickyHeader'));
  for(const change of manifest.changes.filter(c=>c.path===file.path).reverse()){assert.equal(source.split(change.after).length-1,change.count);source=source.replaceAll(change.after,change.before);}
  assert.equal(createHash('sha256').update(source.replaceAll('\r\n','\n')).digest('hex'),file.beforeHash);
 }
});
test('central trace recipe wraps complete buttons without hiding content and retains internal scrolling',()=>{
 const ast=postcss.parse(read(root+'/patterns/foundation/atelier.css'));
 function props(selector){const rule=ast.nodes.find(n=>n.type==='rule'&&n.selector===selector);assert.ok(rule,selector);return Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));}
 const group=props('.qa-trace-status-controls, .qa-trace-row-actions');assert.equal(group['flex-wrap'],'wrap');assert.equal(group['min-width'],'0');assert.equal(group['max-width'],'100%');assert.equal(group.gap,'var(--qd-space-1)');assert.equal(group.overflow,undefined);
 const controls=props('.qa-trace-status-controls > button, .qa-trace-row-actions > button');assert.equal(controls.flex,'0 0 auto');assert.equal(controls['white-space'],'nowrap');
 assert.equal(props('.qa-scroll-table')['overflow-x'],'auto');assert.equal(props('.qa-trace-table')['max-width'],'100%');
 const shared=postcss.parse(read(root+'/patterns/components.css'));let original;shared.walkDecls('--qd-space-1',d=>original=d.value);assert.match(original,/var\(--qd-space-unit, 4px\)/);
 const gap=value=>group.gap.replace('var(--qd-space-1)',value);assert.equal(gap('8px'),'8px');
 const copy=read(product+'/app/q-design.foundation.css');assert.ok(copy.includes('.qa-trace-status-controls, .qa-trace-row-actions'));assert.ok(copy.includes('flex-wrap: wrap;'));
});

test('trace connection actions span existing responsive tracks without creating an implicit column',()=>{
 const path='app/(app)/design-trace/client.tsx',source=reversePostFinalPresentation(path,read(product+'/'+path));
 const ledger=JSON.parse(read(root+'/reviews/atelier-trace-grid-migration.json')).records[0];
 const hash=s=>createHash('sha256').update(s.replaceAll('\r\n','\n')).digest('hex');
 assert.equal(hash(source),ledger.afterHash);
 const edit=ledger.edits[0];assert.equal(source.slice(edit.start,edit.start+edit.after.length),edit.after);
 const before=source.slice(0,edit.start)+edit.before+source.slice(edit.start+edit.after.length);assert.equal(hash(before),ledger.beforeHash);
 const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let found=false;
 function walk(n){if(ts.isJsxElement(n)&&n.openingElement.attributes.properties.some(p=>ts.isJsxAttribute(p)&&p.name.text==='style'&&p.initializer?.getText(sf).includes('foldGrid(2,'))){const child=n.children.find(c=>ts.isJsxElement(c)&&c.openingElement.tagName.getText(sf)==='div');assert.ok(child);const style=child.openingElement.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.text==='style');const column=style.initializer.expression.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='gridColumn');assert.equal(column.initializer.text,'1 / -1');found=true;}ts.forEachChild(n,walk);}walk(sf);assert.ok(found);
 // The negative final grid line resolves to the last explicit track for both layouts.
 const endLine=(columns,line)=>line<0?columns+2+line:line;
 for(const columns of [1,2])assert.equal(endLine(columns,-1)-1,columns);
});
