import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createAtelierCopyRevalidation,beforeAtelierProfessionalReview} from './atelier-professional-copy-revalidation.mjs';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design';
test('professional copy keeps every complete styling argument and only rebinds exact reviewed source fingerprints',()=>{
 const result=createAtelierCopyRevalidation();
 assert.equal(result.sources.length,9);
 assert.equal(result.sources.reduce((n,s)=>n+s.literalChanges,0),11);
 for(const r of result.reports){
  const before=beforeAtelierProfessionalReview(r.name,r.current);
  assert.equal(hash(JSON.stringify(before,null,2)+'\n'),r.beforeHash);
 }
});
test('copy revalidation rejects an unrelated argument or decision change instead of inheriting historical approval',()=>{
 const current=JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8'));
 for(const field of ['value','decision','sourceHash']){
  const wrong=structuredClone(current);wrong.records[0][field]='unreviewed';
  assert.throws(()=>beforeAtelierProfessionalReview('atelier-style-decisions.json',wrong),/Unexpected report content/);
 }
});
