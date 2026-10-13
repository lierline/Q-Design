import {beforeAtelierProfessionalReview} from './atelier-professional-copy-revalidation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAtelierProofContext} from './atelier-proof-context.mjs';
import {verifiedChoiceColumns} from './atelier-choice-columns-review.mjs';
import {inspectChoiceLedger,beforeChoiceColumnsLedger} from './atelier-choice-columns-ledger.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier',file='app/(app)/m/field-ui.tsx';
const read=p=>JSON.parse(fs.readFileSync(root+'/reviews/'+p,'utf8'));
test('the exact numeric choice parameter needs complete caller coverage and a separately proven default',()=>{
 const review=read('atelier-choice-columns-review.json'),{ts}=createAtelierProofContext(),sf=ts.createSourceFile(file,fs.readFileSync(product+'/'+file,'utf8'),99,true,4);
 assert.equal(verifiedChoiceColumns(ts,sf,review).length,1);
 for(const mutate of [r=>r.inventoryHash='0'.repeat(64),r=>r.flows[0].unindexed.push({path:'missing.tsx'}),r=>r.flows[0].callers.pop(),r=>r.flows[0].defaultValue='2',r=>r.flows[0].binding='columns = 2',r=>r.flows[0].prop='tone']){
  const changed=structuredClone(review);mutate(changed);assert.throws(()=>verifiedChoiceColumns(ts,sf,changed));
 }
});
test('only the two complete grid expressions change disposition, with every previous source argument preserved',()=>{
 const current=beforeAtelierProfessionalReview('atelier-style-decisions.json',read('atelier-style-decisions.json')),proof=read('atelier-choice-columns-ledger.json');
 assert.deepEqual(inspectChoiceLedger(current),proof);
 const before=beforeChoiceColumnsLedger(current);assert.equal(current.counts.unknown,580);assert.equal(before.counts.unknown,582);assert.equal(current.records.length,53997);
 const borrowed=structuredClone(current);borrowed.records[proof.changes[0].index].evidence=[{path:'patterns/foundation.css',line:1,hash:'f'.repeat(64)}];assert.throws(()=>inspectChoiceLedger(borrowed));
 const other=structuredClone(current);other.records.find(r=>r.decision==='unknown').decision='business-data';assert.throws(()=>inspectChoiceLedger(other));
});
