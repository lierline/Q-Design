import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyRuntimeBindings} from './atelier-runtime-binding-review.mjs';
import {inspectDomainBinding,inspectRuntimeBinding,verifyDomainBindings} from './atelier-domain-binding-review.mjs';
const product=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../Q-Atelier');
test('seven exact runtime-data references use their own scope and preserve the fourteen earlier bindings',()=>{
 const review=verifyRuntimeBindings();assert.equal(review.records.length,7);
 for(const r of review.records)assert.throws(()=>inspectDomainBinding(r,fs.readFileSync(product+'/'+r.path,'utf8')));
 for(const r of verifyDomainBindings().records)assert.throws(()=>inspectRuntimeBinding(r,fs.readFileSync(product+'/'+r.path,'utf8')));
});
test('changed code, reference location or argument cannot inherit a runtime-data decision',()=>{
 for(const r of verifyRuntimeBindings().records){
  const code=fs.readFileSync(product+'/'+r.path,'utf8');assert.throws(()=>inspectRuntimeBinding(r,code+'\nconst changed=1;\n'));
  for(const altered of [{...r,argumentHash:'unreviewed'},{...r,line:r.line+1},{...r,property:'width'},{...r,consumerUses:[]}])assert.throws(()=>inspectRuntimeBinding(altered,code));
 }
});
