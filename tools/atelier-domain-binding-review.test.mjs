import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {inspectDomainBinding,verifyDomainBindings} from './atelier-domain-binding-review.mjs';
import {verifiedConsumerReview} from './atelier-style-manual.mjs';
import {hash} from './style-arguments-core.mjs';
const product=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../Q-Atelier');
test('fourteen exact inspected data bindings resolve to their real lexical consumers',()=>{
 const review=verifyDomainBindings();assert.equal(review.records.length,14);
 for(const record of review.records)assert(verifiedConsumerReview(record,record,file=>hash(fs.readFileSync(product+'/'+file,'utf8'))));
});
test('source edits, another binding, visual properties and shifted reference evidence invalidate the review',()=>{
 for(const record of verifyDomainBindings().records){
  const code=fs.readFileSync(product+'/'+record.path,'utf8');
  assert.throws(()=>inspectDomainBinding(record,code+'\nconst changedSource=1;\n'));
  for(const changed of [{...record,line:record.line+1},{...record,argumentHash:'unreviewed-binding'},{...record,property:'height'},{...record,kind:'style-expression'},{...record,consumerUses:[record.consumerUses[0]+1]}])assert.throws(()=>inspectDomainBinding(changed,code));
  assert.equal(verifiedConsumerReview({...record,argumentHash:'another-argument'},record,()=>record.sourceHash),null);
 }
});
