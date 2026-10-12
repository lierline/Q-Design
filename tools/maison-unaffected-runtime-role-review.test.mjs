import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectStatRowReads,createUnaffectedRuntimeRoleReview} from './maison-unaffected-runtime-role-review.mjs';
test('runtime column readers reject computed access, escaped maps and escaped runtime objects',()=>{
 const head=`import {qdMaison as Q} from '@/lib/design/q-design-runtime';`;
 assert.deepEqual(inspectStatRowReads('fixture.tsx',head+'const count=Q.statRowColumns.kpiClassification;'),['kpiClassification']);
 for(const code of ['const count=Q.statRowColumns[key];','paint(Q.statRowColumns);','paint(Q);','const count=Q.statRowColumns.future;'])assert.throws(()=>inspectStatRowReads('fixture.tsx',head+code));
});
test('unaffected evidence is reproduced from exact unchanged consumers and current canonical role source',async()=>{
 const saved=JSON.parse(fs.readFileSync('D:/Claude/Q-Design/reviews/maison-unaffected-runtime-role-review.json','utf8'));
 assert.deepEqual(await createUnaffectedRuntimeRoleReview(),saved);assert.equal(saved.records.length,53);assert(saved.records.every(r=>!r.value.includes('purchasingAnalysis')));
 assert.equal(saved.readers.filter(r=>r.reads.includes('purchasingAnalysis')).length,3);
});
