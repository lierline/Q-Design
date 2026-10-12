import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {planMaisonWorkflowCopy,beforeMaisonWorkflowCopy} from './maison-workflow-copy.mjs';
import {createWorkflowCopyBindings,beforeWorkflowCopyBindings} from './maison-workflow-copy-bindings.mjs';
import {applyBindings,termsForFile} from './copy-spacing.mjs';
import {createWorkflowStyleReview} from './maison-workflow-copy-style-review.mjs';
import {beforeMaisonProductionCopy} from './maison-production-copy.mjs';
import {beforeProductionCopyBindings} from './maison-production-copy-bindings.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works';
test('professional workflow copy preserves exact current code and rejects style or business mutations',async()=>{
 const {records,proof}=await planMaisonWorkflowCopy();assert.deepEqual(JSON.parse(fs.readFileSync(root+'/reviews/maison-workflow-copy.json','utf8')),proof);
 for(const r of records){assert.equal(beforeMaisonProductionCopy(r.path,fs.readFileSync(repo+'/'+r.path,'utf8')),r.after);assert.equal(beforeMaisonWorkflowCopy(r.path,r.after),r.before);assert.throws(()=>beforeMaisonWorkflowCopy(r.path,r.after+'\nsubmitRecord();\n'));}
 const row=records.find(r=>r.path==='components/inspections/inspection-overview.tsx');assert.throws(()=>beforeMaisonWorkflowCopy(row.path,row.after.replace('text-3xl','text-5xl')));
});
test('changing the central copy rule updates an existing bound literal while all other product bindings stay identical',async()=>{
 const {before,after,proof}=await createWorkflowCopyBindings();assert.deepEqual(beforeProductionCopyBindings(JSON.parse(fs.readFileSync(root+'/dist/q-design.copy-bindings.json','utf8'))),after);assert.deepEqual(beforeWorkflowCopyBindings(after),before);
 const changed=structuredClone(after);changed.files.find(f=>f.product==='carnet').bindings[0].emitted='"changed"';assert.throws(()=>beforeWorkflowCopyBindings(changed));
 const rules=JSON.parse(fs.readFileSync(root+'/patterns/professional-maison-workflow-copy.json','utf8')),file='components/inspections/inspection-overview.tsx',bindings=after.files.find(f=>f.product==='maison'&&f.path===file).bindings,terms=termsForFile(rules.terms,'maison',file),updated=terms.map(t=>t.from==='밀린 검사가 없습니다'?{...t,to:'검사 대기 없음'}:t),result=applyBindings(file,fs.readFileSync(repo+'/'+file,'utf8'),bindings,updated);
 assert.equal(result.changes.length,1);assert(result.after.includes('검사 대기 없음'));assert.equal(proof.changes.reduce((n,r)=>n+r.literals,0),19);
});
test('rebound style evidence still matches every exact current candidate and independent unchanged dependency',async()=>{
 assert.deepEqual(await createWorkflowStyleReview(),JSON.parse(fs.readFileSync(root+'/reviews/maison-workflow-copy-style-review.json','utf8')));
});
