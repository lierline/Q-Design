import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {planMaisonProductionCopy,beforeMaisonProductionCopy} from './maison-production-copy.mjs';
import {createProductionCopyBindings,beforeProductionCopyBindings} from './maison-production-copy-bindings.mjs';
import {createProductionStyleReview,beforeProductionStyleReport} from './maison-production-copy-style-review.mjs';
import {applyBindings,termsForFile} from './copy-spacing.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works';
test('fifteen professional production literals preserve every complete style argument and reject business or visual edits',async()=>{
 const {records,proof}=await planMaisonProductionCopy();assert.deepEqual(proof,JSON.parse(fs.readFileSync(root+'/reviews/maison-production-copy.json','utf8')));assert.equal(records.length,7);assert.equal(records.reduce((n,r)=>n+r.literals,0),15);
 for(const r of records){assert.equal(fs.readFileSync(repo+'/'+r.path,'utf8'),r.after);assert.equal(beforeMaisonProductionCopy(r.path,r.after),r.before);assert.throws(()=>beforeMaisonProductionCopy(r.path,r.after+'\nwriteBusinessRecord();\n'));}
 const view=records.find(r=>r.path==='app/(app)/production/page.tsx');assert(view.after.includes('className='));assert.throws(()=>beforeMaisonProductionCopy(view.path,view.after.replace('className=','style={{width:913}} className=')));
});
test('a changed central status-label rule updates the existing bound literal while other products stay exact',async()=>{
 const {before,after,proof}=await createProductionCopyBindings();assert.deepEqual(after,JSON.parse(fs.readFileSync(root+'/dist/q-design.copy-bindings.json','utf8')));assert.deepEqual(beforeProductionCopyBindings(after),before);assert.equal(proof.changes.reduce((n,c)=>n+c.literals,0),15);
 const altered=structuredClone(after);altered.files.find(f=>f.product==='carnet').bindings[0].emitted='"unrelated"';assert.throws(()=>beforeProductionCopyBindings(altered));
 const file='lib/supabase/types.ts',rules=JSON.parse(fs.readFileSync(root+'/patterns/copy-rules.json','utf8')),all=[...rules.terms,...rules.additionalRuleFiles.flatMap(p=>JSON.parse(fs.readFileSync(root+'/'+p,'utf8')).terms)],terms=termsForFile(all,'maison',file).map(t=>t.id==='maison-production-professional-5'?{...t,to:'작업 진행 중'}:t),bindings=after.files.find(f=>f.product==='maison'&&f.path===file).bindings,result=applyBindings(file,fs.readFileSync(repo+'/'+file,'utf8'),bindings,terms);assert.equal(result.changes.length,1);assert(result.after.includes('code: "in_progress", label: "작업 진행 중"'));
});
test('all exact prior styling obligations reproduce their saved revalidated source and tool evidence',async()=>{
 const result=await createProductionStyleReview();assert.deepEqual(result,JSON.parse(fs.readFileSync(root+'/reviews/maison-production-copy-style-review.json','utf8')));assert.equal(result.records.length,157);
});
test('whole-report projection preserves all unrelated decisions and rejects borrowed evidence or approvals',async()=>{
 const current=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),before=await beforeProductionStyleReport(current);assert.equal(before.counts.unknown,652);
 const bad=structuredClone(current);bad.records.find(r=>r.decision==='unknown').decision='business-data';await assert.rejects(()=>beforeProductionStyleReport(bad));
 const borrowed=structuredClone(current);borrowed.records.find(r=>r.ruleId!=='professional-production-copy-evidence'&&r.evidence.length).evidence[0].hash='borrowed';await assert.rejects(()=>beforeProductionStyleReport(borrowed));
});
