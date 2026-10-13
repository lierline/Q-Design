import {execFileSync} from 'node:child_process';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {deriveHonorific,inspectHonorific,beforeHonorificBindings,beforeHonorificReport} from './carnet-honorific-review.mjs';
import {applyBindings} from './copy-spacing.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/DHR',file='app/(admin)/page.tsx',ts=createRequire('D:/Claude/Q-Atelier/package.json')('typescript'),read=p=>fs.readFileSync(p,'utf8');
test('actual homepage title preserves user-name whitespace and removes only the honorific separator',()=>{
 const result=inspectHonorific(),sf=ts.createSourceFile(file,result.after,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),hits=[];
 const visit=n=>{if(ts.isJsxAttribute(n)&&n.name.text==='title'&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===465)hits.push(n);ts.forEachChild(n,visit);};visit(sf);assert.equal(hits.length,1);
 const expression=hits[0].initializer.expression.getText(sf),render=vm.runInNewContext('(greeting,user)=>'+expression);assert.equal(render('아침',{full_name:'개발 계정'}),'아침 인사드립니다, 개발 계정님');assert.equal(render('저녁',{full_name:'김 민수'}),'저녁 인사드립니다, 김 민수님');assert.throws(()=>inspectHonorific(result.after+'\n'));
});
test('a future central rule changes the already bound title and leaves every other authored phrase intact',()=>{
 const result=deriveHonorific(),row=result.bindings.files.find(r=>r.product==='carnet'&&r.path===file),binding=row.bindings.find(r=>r.line===465),term=JSON.parse(read(root+'/patterns/professional-carnet-copy.json')).terms.find(t=>t.id==='carnet-user-honorific-spacing');
 const changed=applyBindings(file,result.after,[binding],[{...term,to:'님께'}]);assert.equal(changed.changes.length,1);assert.equal(changed.after,result.after.replace('${user.full_name}님','${user.full_name}님께'));
});
test('whole copy-binding and style ledgers reject unrelated changes while restoring the exact previous homepage hash',()=>{
 const bindings=JSON.parse(read(root+'/dist/q-design.copy-bindings.current.json'));const inverse=beforeHonorificBindings(bindings);assert.deepEqual(inverse.files.filter(r=>r.product==='carnet'),deriveHonorific().prior.files.filter(r=>r.product==='carnet'));assert.deepEqual(inverse.files.filter(r=>r.product!=='carnet'),bindings.files.filter(r=>r.product!=='carnet'));assert.equal(inverse.rules,bindings.rules);const borrowed=structuredClone(bindings);borrowed.files.find(r=>r.product==='carnet'&&r.path===file).bindings[0].emitted='unreviewed';assert.throws(()=>beforeHonorificBindings(borrowed));
 const current=JSON.parse(read(root+'/reviews/carnet-style-decisions.json')),old=beforeHonorificReport(current);assert.equal(current.unknownCount,0);assert.deepEqual(current.counts,old.counts);assert.notEqual(current.fileHashes.find(r=>r.path===file).hash,old.fileHashes.find(r=>r.path===file).hash);
 const wrong=structuredClone(current);wrong.records[0].decision='invented';assert.throws(()=>beforeHonorificReport(wrong));
});

test('honorific regeneration preserves every other product and the current rule index',()=>{const path=root+'/dist/q-design.copy-bindings.current.json',before=read(path);execFileSync(process.execPath,['tools/carnet-honorific-review.mjs','--write'],{cwd:root,encoding:'utf8'});assert.equal(read(path),before);});
