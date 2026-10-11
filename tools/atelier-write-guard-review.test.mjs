import test from 'node:test';import assert from 'node:assert/strict';
import {inspectWriteGuard,createWriteGuardReview} from './atelier-write-guard-review.mjs';
const source=`import {assertWriteRole} from '@/lib/permissions/create-access';import {NextResponse} from 'next/server';async function guard(){const w=await assertWriteRole(db,id,roles);if(w instanceof NextResponse)return {fail:w};query.eq('org_id',w.orgId);return {orgId:w.orgId};}`;
test('reviewed permission-result consumers retain their data role and extra calls stay unresolved',()=>{const r=createWriteGuardReview();assert.equal(r.records.length,29);assert.equal(r.unresolved.length,4);});
test('visual consumers, aliases, wrong imports, shadowing and unguarded response escape invalidate the proof',()=>{
 assert(inspectWriteGuard(source));
 for(const value of [source.replace('query.eq', 'paint(w);query.eq'),source.replace('query.eq', 'const alias=w;query.eq'),source.replace('create-access','wrong-module'),source.replace('const w=', 'const assertWriteRole=fake;const w='),source.replace('w.orgId);','w.color);'),source.replace('if(w instanceof NextResponse)return {fail:w};','return w;')])assert.equal(inspectWriteGuard(value),null);
});
