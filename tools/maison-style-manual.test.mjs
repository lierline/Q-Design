import test from 'node:test';
import assert from 'node:assert/strict';
import {verifiedManualReview} from './maison-style-manual.mjs';
const record={argumentHash:'argument-a',sourceHash:'source-a',path:'app/data.ts',line:4};
const review={...record,decision:'business-data',ruleId:'exact-data-consumer',reason:'This reviewed argument is the record payload of the named data operation.',evidence:[{path:'app/data.ts',line:4,hash:'source-a'},{path:'lib/data.ts',line:10,hash:'data-a'}]};
const hashes=new Map([['app/data.ts','source-a'],['lib/data.ts','data-a']]);
test('a manual decision applies only to its exact candidate and complete source evidence',()=>{
  assert.equal(verifiedManualReview(record,review,path=>hashes.get(path)).decision,'business-data');
  for(const changed of [{argumentHash:'new-candidate'},{sourceHash:'new-source'},{path:'app/other.ts'},{line:5}])assert.equal(verifiedManualReview({...record,...changed},review,path=>hashes.get(path)),null);
  assert.equal(verifiedManualReview(record,review,path=>path==='lib/data.ts'?'mutated':hashes.get(path)),null);
});
test('manual review cannot silently assert runtime approval or omit evidence',()=>{
  for(const changed of [{decision:'browser-pass'},{reason:''},{evidence:[]},{evidence:[{path:'missing',hash:'x'}]}])assert.equal(verifiedManualReview(record,{...review,...changed},path=>hashes.get(path)),null);
});
