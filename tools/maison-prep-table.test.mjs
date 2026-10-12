import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {prepTablePlan,prepTableMigrationProof,beforePrepTableSource,prepCanonicalPath} from './maison-prep-table-migration.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',req=createRequire(repo+'/package.json'),ts=req('typescript');
function handlers(file,code){const sf=ts.createSourceFile(file,code,99,true,4),result=[];const walk=n=>{if(ts.isJsxAttribute(n)&&/^on[A-Z]/.test(n.name.getText(sf)))result.push([n.name.getText(sf),n.initializer?.getText(sf)]);if(ts.isVariableDeclaration(n)&&['check','setRow','addRow','removeRow'].includes(n.name.getText(sf)))result.push([n.name.getText(sf),n.initializer.getText(sf)]);ts.forEachChild(n,walk);};walk(sf);return result;}
test('preparation adaptation preserves every actual handler and local business update function',async()=>{
 const [view]=await prepTablePlan();assert.deepEqual(handlers(view.path,view.before),handlers(view.path,view.after));assert(handlers(view.path,view.after).length>30);
});
test('exact source inverse rejects changed reset behavior, extra styles and unrelated import changes',async()=>{
 for(const f of await prepTablePlan()){assert.equal(beforePrepTableSource(f.path,f.after),f.before);assert.throws(()=>beforePrepTableSource(f.path,f.after+'\nwriteBusinessRecord();\n'));}
 const [view]=await prepTablePlan();assert.throws(()=>beforePrepTableSource(view.path,view.after.replace('uncheckRow(row)','row')));assert.throws(()=>beforePrepTableSource(view.path,view.after.replace('qd-prep-table-grid text-sm','qd-prep-table-grid text-sm min-w-[913px]')));
 assert.deepEqual(await prepTableMigrationProof(),JSON.parse(fs.readFileSync(root+'/reviews/maison-prep-table-migration.json','utf8')));
});
test('central preparation recipe has complete existing variable definitions and only equipment gets stacked',()=>{
 const postcss=req('postcss'),code=fs.readFileSync(root+'/'+prepCanonicalPath,'utf8'),ast=postcss.parse(code),definitions=new Set();for(const file of[prepCanonicalPath,'patterns/foundation.css','patterns/components.css','patterns/foundation/maison.css'])postcss.parse(fs.readFileSync(root+'/'+file,'utf8')).walkDecls(d=>{if(d.prop.startsWith('--'))definitions.add(d.prop);});
 ast.walkDecls(d=>{for(const match of d.value.matchAll(/var\((--[\w-]+)/g))assert(definitions.has(match[1]),match[1]);if(d.prop==='display'&&d.value==='none'&&d.parent.selector.endsWith('thead'))assert.equal(d.parent.selector,'.qd-prep-table--equipment thead');});assert(!/overflow[^;]*:\s*hidden/.test(code),'Wrapping and responsive structure must solve overflow without hiding it');
});
