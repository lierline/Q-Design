import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import {createGlobalTypographyLedger,beforeGlobalTypographyLedger} from './global-typography-ledger.mjs';
import {beforeGlobalTypographyReview} from './global-typography-evidence.mjs';
import {hash} from './style-arguments-core.mjs';
import {ledgerLineMap} from './atelier-ledger-pattern-sources.mjs';
const root='D:/Claude/Q-Design',read=name=>JSON.parse(fs.readFileSync(root+'/reviews/'+name,'utf8')),serialize=j=>JSON.stringify(j,null,2)+'\n';
test('all old full arguments reverse exactly and only six complete new central copy arguments can be added',()=>{
  const current=read('atelier-style-decisions.json'),proof=read('global-typography-ledger.json');assert.deepEqual(createGlobalTypographyLedger(current),proof);
  const before=beforeGlobalTypographyLedger(current);assert.equal(hash(serialize(before)),proof.beforeReportHash);assert.equal(proof.unknown,before.counts.unknown);
  // The ledger pattern (2026-10-15) moved the copy lines below its new rules; the borrowed proof goes on the same argument at its current line.
  const first=proof.inserted[0],line=ledgerLineMap(proof.copyPath).toAfter(first.line);
  const borrowed=structuredClone(current);borrowed.records.find(r=>r.path===proof.copyPath&&r.line===line&&r.property===first.property).evidence=[{path:'patterns/foundation.css',line:1,hash:'f'.repeat(64)}];assert.throws(()=>createGlobalTypographyLedger(borrowed));
  const other=structuredClone(current);other.records.find(r=>r.decision==='unknown').decision='business-data';assert.throws(()=>createGlobalTypographyLedger(other));
});
test('all freshly revalidated renderer reports restore the exact committed reports and reject unrelated edits',()=>{
  const proof=read('global-typography-revalidation.json');assert.equal(proof.reports.length,3);assert.equal(proof.reports.reduce((n,p)=>n+p.changes.length,0),444);
  for(const p of proof.reports){const current=read(p.name),before=beforeGlobalTypographyReview(p.name,current);assert.equal(hash(serialize(before)),p.beforeHash);assert.deepEqual(before,JSON.parse(execFileSync('git',['show',proof.ref+':reviews/'+p.name],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024})));const changed=structuredClone(current);changed.scope='Unrelated approval';assert.throws(()=>beforeGlobalTypographyReview(p.name,changed));}
});
