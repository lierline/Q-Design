import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createPrepDataReview} from './maison-prep-data-review.mjs';
import {createBoxAliasReview} from './maison-docx-box-alias-review.mjs';
import {beforeRemainingFields} from './maison-remaining-field-ledger.mjs';
const root='D:/Claude/Q-Design';
test('preparation fields and DOCX aliases reproduce exact independently verified evidence',()=>{
 for(const [name,factory,count] of [['maison-prep-data-review',createPrepDataReview,17],['maison-docx-box-alias-review',createBoxAliasReview,4]]){
  const saved=JSON.parse(fs.readFileSync(root+'/reviews/'+name+'.json','utf8'));
  assert.deepEqual(factory(),saved);assert.equal(saved.records.length,count);
 }
});
test('only twenty-one reviewed decisions reduce the whole Maison ledger',()=>{
 const current=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8'));
 const old=beforeRemainingFields(current);assert.equal(old.counts.unknown,607);assert.equal(current.counts.unknown,586);
 for(const field of ['value','decision','sourceHash']){
  const wrong=structuredClone(current);wrong.records[0][field]='unreviewed';assert.throws(()=>beforeRemainingFields(wrong));
 }
 const borrowed=structuredClone(current),record=borrowed.records.find(r=>r.ruleId==='symbol-resolved-docx-box-alias');record.evidence[0].hash='borrowed';assert.throws(()=>beforeRemainingFields(borrowed));
 const changed=structuredClone(current);changed.counts.unknown--;assert.throws(()=>beforeRemainingFields(changed));
});
