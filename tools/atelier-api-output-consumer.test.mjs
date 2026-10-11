import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash, scanArguments, cssProperties} from './style-arguments-core.mjs';
import {verifiedConsumerReview} from './atelier-style-manual.mjs';

const qd=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const product=path.resolve(qd,'../Q-Atelier');
const req=createRequire(path.join(product,'package.json')),ts=req('typescript'),postcss=req('postcss');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const review=JSON.parse(fs.readFileSync(path.join(qd,'reviews/atelier-api-output-consumer-review.json'),'utf8'));
const cache=new Map();
function source(file){
 if(!cache.has(file)){
  const root=/^(source|patterns|dist)\//.test(file)?qd:product;
  const code=fs.readFileSync(path.join(root,file),'utf8');
  cache.set(file,{code,hash:hash(code)});
 }
 return cache.get(file);
}

test('every API/output consumer decision matches the exact current AST argument and all evidence',()=>{
 assert.ok(review.records.length>0);
 const seen=new Set();
 for(const record of review.records){
  const s=source(record.path);
  s.arguments??=scanArguments(record.path,s.code,{ts,postcss,properties});
  assert.equal(record.sourceHash,s.hash,record.path+': stale source');
  const matches=s.arguments.filter(a=>a.kind===record.reviewedKind&&a.property===record.reviewedProperty&&a.line===record.line&&a.value.replaceAll('\r\n','\n')===record.reviewedExpression.replaceAll('\r\n','\n'));
  assert.equal(matches.length,1,record.path+':'+record.line+' exact AST binding');
  const argumentHash=hash(JSON.stringify(matches[0]));
  assert.equal(record.argumentHash,argumentHash,record.path+':'+record.line+' scanner hash');
  const key=record.path+':'+argumentHash;
  assert.equal(seen.has(key),false,'duplicate '+key);seen.add(key);
  assert.ok(record.consumerContext.length>0,record.path+': actual consumers');
  assert.ok(verifiedConsumerReview({path:record.path,line:record.line,sourceHash:s.hash,argumentHash},record,file=>source(file).hash),record.path+': current source evidence');
 }
});

test('stale consumers, wrong identities and changed canonical output fail closed',()=>{
 const r=review.records.find(x=>x.evidence.some(e=>/^(source|patterns|dist)\//.test(e.path)));
 assert.ok(r);
 const actual={path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash};
 const current=file=>source(file).hash;
 assert.equal(verifiedConsumerReview({...actual,sourceHash:hash('changed runtime source')},r,current),null);
 assert.equal(verifiedConsumerReview({...actual,argumentHash:hash(JSON.stringify([r.path,r.line,r.reviewedExpression]))},r,current),null);
 const central=r.evidence.find(e=>/^(source|patterns|dist)\//.test(e.path)).path;
 assert.equal(verifiedConsumerReview(actual,r,file=>file===central?hash('changed canonical evidence'):current(file)),null);
});

test('unresolved exported renderer inputs remain explicit and do not get approved by their directory',()=>{
 assert.equal(review.reported.length,4);
 const accepted=new Set(review.records.map(r=>r.argumentHash));
 for(const record of review.reported){
  assert.equal(accepted.has(record.argumentHash),false);
  assert.equal(record.path,'lib/export/docx-builder/utils.ts');
  assert.match(record.reason,/no production caller/);
 }
 const r=review.records.find(r=>r.ruleId==='atelier-docx-normalized-organization-accent');
 assert.ok(r.evidence.some(e=>e.path==='lib/export/docx-builder/brand.ts'));
 assert.ok(r.evidence.some(e=>e.path==='lib/export/docx-builder/index.ts'));
 assert.ok(r.evidence.some(e=>e.path==='source/design/atelier-output.ts'));
 assert.ok(r.evidence.some(e=>e.path==='lib/design/q-design-output.ts'));
 const data=review.records.find(r=>r.path==='lib/engine/fingerprint.ts');
 assert.equal(data.decision,'business-data');
 assert.match(data.consumerContext,/JSON.stringify/);
});
