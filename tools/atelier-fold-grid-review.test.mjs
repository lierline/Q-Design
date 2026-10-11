import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {proveFoldGridArguments,verifyFoldGridBody,createFoldGridReview} from './atelier-fold-grid-review.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ts=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('typescript');
const reference=value=>['QDScale.space[3]','QDScale.space[4]','QDPresentation.gridMinColumn[200]'].includes(value)?[{path:'source/design/example.ts',line:1,hash:'source-hash'}]:null;
function prove(source,ref=reference){const sf=ts.createSourceFile('case.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);const call=sf.statements[0].expression;return proveFoldGridArguments({ts,call,sf,reference:ref});}

test('foldGrid accepts reviewed structural counts plus independently proven central gap and minimum',()=>{
 const result=prove('foldGrid(2, QDScale.space[3], {min: QDPresentation.gridMinColumn[200], rowGap: QDScale.space[4]})');
 assert.deepEqual(result.inputs.map(item=>item.name),['columns','gap','min','rowGap']);
 assert.match(result.inputs[0].meaning,/Structural/);assert.equal(result.evidence.length,3);
});
test('raw visual inputs, unknown tokens, spreads and parameterized counts do not acquire approval',()=>{
 for(const source of ['foldGrid(2, 12)','foldGrid(2, QDScale.space[999])','foldGrid(2, QDScale.space[3], {min:200})','foldGrid(2, QDScale.space[3], {...extra})','foldGrid(2, QDScale.space[3], {rowGap:16})','foldGrid(columns, QDScale.space[3])','foldGrid(2, QDScale.space[3], {min: QDPresentation.gridMinColumn[200], color: "red"})'])assert.equal(prove(source),null,source);
 assert.equal(prove('foldGrid(2, QDScale.space[3])',()=>null),null,'A textual token name does not prove the import or canonical copy');
});
test('a changed helper body is rejected even when the function name and signature stay the same',()=>{
 const code=fs.readFileSync(path.resolve(root,'../Q-Atelier/lib/design/components.tsx'),'utf8'),sf=ts.createSourceFile('components.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const fn=sf.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='foldGrid');
 verifyFoldGridBody(ts,fn,sf);
 const changed=ts.createSourceFile('changed.tsx',fn.getText(sf).replace("display: 'grid'","display: 'block'"),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.throws(()=>verifyFoldGridBody(ts,changed.statements[0],changed),/renewed semantic review/);
});
test('all actual callers, exact arguments and central evidence match the reviewed foldGrid catalog',()=>{
 const actual=createFoldGridReview(),saved=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-fold-grid-review.json'),'utf8'));
 assert.deepEqual(actual,saved,'New or modified callers and changed source evidence need renewed review');
 assert.ok(actual.calls.length>0);assert.deepEqual(actual.rejected,[]);
 assert.ok(actual.records.every(record=>record.decision==='confirmed-style-composition'&&record.evidence.length>3));
});
