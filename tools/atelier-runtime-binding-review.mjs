import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {runtimeBindings,inspectRuntimeBinding} from './atelier-domain-binding-review.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Atelier');
export function verifyRuntimeBindings(){
 const review=JSON.parse(fs.readFileSync(root+'/reviews/atelier-runtime-binding-review.json','utf8'));
 assert.equal(review.version,1);assert.deepEqual(review.records.map(r=>[r.path,r.line,r.property,r.inspectedConsumer]),runtimeBindings);
 for(const record of review.records)inspectRuntimeBinding(record,fs.readFileSync(product+'/'+record.path,'utf8'));
 return review;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.deepEqual(process.argv.slice(2),['--check']);console.log('Exact runtime-data bindings verified: '+verifyRuntimeBindings().records.length);
}
