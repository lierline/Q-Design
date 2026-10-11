import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {verifiedConsumerReview} from './atelier-style-manual.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Atelier');
const req=createRequire(path.join(product,'package.json')),ts=req('typescript'),postcss=req('postcss');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const review=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-data-ratio-review.json'),'utf8'));
const read=file=>fs.readFileSync(path.join(file.startsWith('patterns/')?root:product,file),'utf8');
const currentHash=file=>hash(read(file));
test('all approved ratios have current exact AST arguments and independently hashed definitions',()=>{
 assert.equal(review.records.length,37);const scans=new Map();
 for(const r of review.records){
  if(!scans.has(r.path))scans.set(r.path,scanArguments(r.path,read(r.path),{ts,postcss,properties}));
  const matches=scans.get(r.path).filter(a=>a.line===r.line&&a.kind===r.kind&&a.property===r.property&&a.value===r.reviewedExpression);
  assert.equal(matches.length,1,r.path+':'+r.line);assert.equal(r.argumentHash,hash(JSON.stringify(matches[0])));
  assert.ok(verifiedConsumerReview(r,r,currentHash));
  for(const ev of r.evidence)assert.equal(read(ev.path).split(/\r?\n/)[ev.line-1],ev.inspectedLine);
 }
});
test('a changed formula, source or domain definition cannot inherit a prior data decision',()=>{
 const row=review.records[0];
 assert.equal(verifiedConsumerReview({...row,argumentHash:hash('Math.max(2, percentage)')},row,currentHash),null);
 assert.equal(verifiedConsumerReview(row,row,file=>file===row.path?hash('changed'):currentHash(file)),null);
 const linked=review.records.find(r=>r.evidence.some(e=>e.path!==r.path));
 const definition=linked.evidence.find(e=>e.path!==linked.path).path;
 assert.equal(verifiedConsumerReview(linked,linked,file=>file===definition?hash('changed definition'):currentHash(file)),null);
 assert.equal(review.reported.length,2);
 for(const r of review.reported)assert.ok(!review.records.some(a=>a.argumentHash===r.argumentHash));
});
test('inspected score and usage formulas represent data changes, including zero and capped usage',()=>{
 const score=review.records.find(r=>r.path==='app/(app)/admin/experts/page.tsx');
 assert.equal(vm.runInNewContext('('+score.reviewedExpression+')',{value:8}),'80%');
 assert.equal(vm.runInNewContext('('+score.reviewedExpression+')',{value:null}),'var(--qd-atelier-width-90cbec82bc)');
 const usage=review.records.find(r=>r.path==='app/(app)/admin/subscriptions/page.tsx'&&r.property==='width');
 assert.equal(vm.runInNewContext('('+usage.reviewedExpression+')',{data:{pct:0}}),'0%');
 assert.equal(vm.runInNewContext('('+usage.reviewedExpression+')',{data:{pct:.45}}),'45%');
 assert.equal(vm.runInNewContext('('+usage.reviewedExpression+')',{data:{pct:1.4}}),'100%');
});
