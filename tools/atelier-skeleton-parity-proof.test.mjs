import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifySkeletonBodies,skeletonBodies,retainSkeletonEvidence} from './atelier-skeleton-parity-proof.mjs';
import {skeletonRenderers} from './skeleton-runtime-fixture.mjs';
test('unrelated edits and changed arguments cannot retain old review evidence',()=>{
 const bodies=skeletonBodies();assert.throws(()=>verifySkeletonBodies(bodies.before,bodies.after+'\n'));
 assert.throws(()=>verifySkeletonBodies(bodies.before,bodies.after.replace("label = '로드 중'","label = '기다려 주세요'")));
 const proof=JSON.parse(fs.readFileSync(new URL('../reviews/atelier-style-consumer-review-skeleton-revalidation.json',import.meta.url),'utf8'));
 const original={records:proof.records.map(r=>r.before)};assert.equal(retainSkeletonEvidence(original,bodies).records.length,1);
 assert.throws(()=>retainSkeletonEvidence({records:[{...original.records[0],argumentHash:'stale'}]},bodies));
 assert.throws(()=>retainSkeletonEvidence({records:[{...original.records[0],consumerContext:[{line:2114,text:'unrelated'}]}]},bodies));
});
test('both actual APIs follow shared height mutations and preserve caller overrides',()=>{
 const f=skeletonRenderers(r=>{r.QDPresentation.skeletonHeight[14]=19;r.QDPresentation.skeletonHeight[12]=17;});
 for(const api of [f.core.Skeleton,f.standalone])assert.match(f.render(api),/height:19px/);
 assert.match(f.render(f.core.SkeletonPanel,{lines:2}),/height:17px/);assert.match(f.render(f.standalone.Row,{count:2}),/height:17px/);
 assert.match(f.render(f.core.Skeleton,{w:'37%',h:31}),/width:37%;height:31px/);
 assert.match(f.render(f.standalone,{width:'37%',height:31}),/width:37%;height:31px/);
 for(const api of [f.core.Skeleton,f.standalone])assert.match(f.render(api,{style:{height:29}}),/height:29px/);
 assert.match(f.render(f.core.SkeletonPanel,{height:180,label:'목록 로드 중'}),/aria-busy="true" aria-label="목록 로드 중"/);
 assert.match(f.render(f.core.SkeletonPanel,{height:180}),/min-height:180px/);
});
