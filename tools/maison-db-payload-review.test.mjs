import fs from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectInsertConsumer,verifyPayloadSource,resolvePayloadSite,createDbPayloadReview} from './maison-db-payload-review.mjs';
const repo='D:/Claude/Q-Works',root='D:/Claude/Q-Design',ts=createRequire(repo+'/package.json')('typescript');
test('payload consumer rejects visual escapes, extra payload reads and changed database chains',()=>{
 const source=fs.readFileSync(repo+'/lib/actions/db.ts','utf8');inspectInsertConsumer(source);
 for(const changed of [source.replace('.insert(payload)','.update(payload)'),source.replace('return await (','Object.assign(document.body.style, payload);\n  return await ('),source.replace('.insert(payload)','.insert({...payload})')])assert.throws(()=>inspectInsertConsumer(changed));
 assert.throws(()=>verifyPayloadSource('lib/actions/db.ts',source+'\n'));
});
test('resolved signature and argument position reject shadowed or unrelated functions',()=>{
 const code='function insertOne(a:unknown,b:unknown,payload:Record<string,unknown>){return payload;}\nconst value=insertOne(1,2,{...fields});';
 const sf=ts.createSourceFile(repo+'/fixture.ts',code,99,true,3),call=sf.statements[1].declarationList.declarations[0].initializer,checker={getResolvedSignature:()=>({declaration:sf.statements[0]})};
 assert.throws(()=>resolvePayloadSite(sf,{line:2,value:'fields'},checker));
 const wrong=ts.createSourceFile(repo+'/fixture.ts','const value=insertOne({...fields},2,3);',99,true,3);assert.throws(()=>resolvePayloadSite(wrong,{line:1,value:'fields'},checker));
});
test('all twenty-eight individually pinned payload sites reproduce saved current evidence',()=>{
 const current=createDbPayloadReview(),saved=JSON.parse(fs.readFileSync(root+'/reviews/maison-db-payload-review.json','utf8'));assert.deepEqual(current,saved);assert.equal(current.records.length,28);assert.equal(new Set(current.records.map(r=>r.argumentHash)).size,28);
});
