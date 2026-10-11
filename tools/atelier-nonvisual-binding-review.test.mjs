import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {verifiedConsumerReview} from './atelier-style-manual.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Atelier'),review=JSON.parse(fs.readFileSync(root+'/reviews/atelier-nonvisual-binding-review.json','utf8'));
const currentHash=file=>hash(fs.readFileSync(path.join(product,file),'utf8'));
test('only the six inspected lexical bindings match unchanged current consumers',()=>{
 assert.equal(review.records.length,6);
 assert.deepEqual(review.records.map(r=>r.inspectedConsumer),['cacheKeyFor','filenameFromDisposition','passkeyHostOk','engineContentFingerprint','parseIpv6','normalizeHost']);
 for(const record of review.records){
  assert.equal(record.property,'h');assert.equal(record.kind,'named-style-value');assert.equal(record.decision,'business-data');
  assert.equal(record.ruleId,'exact-nonvisual-local-binding');assert(verifiedConsumerReview(record,record,currentHash));
 }
});
test('changed consumers, another lexical location and visual arguments cannot inherit the data review',()=>{
 for(const record of review.records){
  for(const changed of [{...record,line:record.line+1},{...record,path:'unreviewed/consumer.ts'},{...record,argumentHash:'unreviewed-height-argument'},{...record,sourceHash:'changed-consumer-source'}])assert.equal(verifiedConsumerReview(changed,record,currentHash),null);
  assert.equal(verifiedConsumerReview(record,record,()=>'changed-consumer-source'),null);
 }
});
