import test from 'node:test';
import assert from 'node:assert/strict';
import {createModuleGuardReview} from './atelier-module-guard-review.mjs';
import {inspectWriteGuard} from './atelier-write-guard-review.mjs';
const source=`import {assertWriteRole} from '@/lib/permissions/create-access';import {NextResponse} from 'next/server';import {moduleGate} from '@/lib/subscription/module-gate';async function guard(){const w=await assertWriteRole(db,id,roles);if(w instanceof NextResponse)return {fail:w};const block=await moduleGate(db,w.orgId,modules);if(block)return {fail:block};query.eq('org_id',w.orgId);return {orgId:w.orgId};}`;
test('the three actual additional module consumers have complete unchanged-producer evidence',()=>{
 assert.equal(createModuleGuardReview().records.length,3);
 assert.equal(inspectWriteGuard(source),null);
 assert(inspectWriteGuard(source,{allowModuleGate:true}));
});
test('additional visual uses, unreviewed calls, argument positions, imports and shadowing cannot pass',()=>{
 for(const invalid of [
  source.replace('query.eq','paint(w);query.eq'),
  source.replace('query.eq','const alias=w;query.eq'),
  source.replace('moduleGate(db,w.orgId,modules)','moduleGate(w.orgId,db,modules)'),
  source.replace('moduleGate(db,w.orgId,modules)','moduleGate(db,w.orgId,modules,extra)'),
  source.replace('await moduleGate','moduleGate'),
  source.replace('subscription/module-gate','subscription/unknown'),
  source.replace('import {moduleGate}','import type {moduleGate}'),
  source.replace('const w=','const {moduleGate}=fake;const w='),
  source.replace('async function guard()','async function guard(moduleGate)'),
  source.replace('moduleGate(db,w.orgId,modules)','loadSheets(w.orgId,modules)'),
 ])assert.equal(inspectWriteGuard(invalid,{allowModuleGate:true}),null);
});
