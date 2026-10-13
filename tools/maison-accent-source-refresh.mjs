import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createAccentReview} from './maison-accent-review.mjs';
const root='D:/Claude/Q-Design';
const transitions=new Map([
 ['app/(app)/purchasing/analysis/delivery-tab.tsx',['bbd1ace6280a869141a7d70c254ceb67e7954910113e5582dbf0788775019456','ed5a1cbb350ac3088e142c7e4a5c234a97d203971ea6d0851649788c3cab3c28']],
 ['components/inspections/inspection-overview.tsx',['9db0b581a2a1b91aef49bc7232256034cc396d4d49682b532b2f120e50c28ea3','f454c8d19c12b49d1f14c29edb6a437d337ae465e492058177c3687723ef6a99']],
 ['components/shared/list-stats.tsx',['a3781f13018cdf2b71d8af14f78b9a8c0f122c121749b863041653e81b8f58d9','6b68b19589871562b18abcdba8f86a3b41a2214b6c906a0fdb0afa92cfd16bf5']]
]);
export function beforeAccentSourceRefresh(current){
 const old=JSON.parse(execFileSync('git',['show','9d0a1cf:reviews/maison-accent-review.json'],{cwd:root,encoding:'utf8'}));
 if(JSON.stringify(current)===JSON.stringify(old))return current;
 const historical=JSON.parse(execFileSync('git',['show','63372ef3622c9ae2eb7f2584fc058f0d0167704b:reviews/maison-accent-review.json'],{cwd:root,encoding:'utf8'}));
 if(JSON.stringify(current)===JSON.stringify(historical))return current;
 assert.deepEqual(current,createAccentReview(),'Fresh symbol-resolved accent proof required');
 const inverse=structuredClone(current);
 assert.equal(current.records.length,old.records.length);
 for(const [i,row] of inverse.records.entries()){
  const prior=old.records[i];
  const own=transitions.get(row.path);
  if(own&&row.sourceHash!==prior.sourceHash){assert.equal(prior.sourceHash,own[0]);assert.equal(row.sourceHash,own[1]);row.sourceHash=prior.sourceHash;}
  for(const [j,e] of row.evidence.entries()){
   const transition=transitions.get(e.path),previous=prior.evidence[j];
   if(transition&&e.hash!==previous.hash){assert.equal(previous.hash,transition[0]);assert.equal(e.hash,transition[1]);e.hash=previous.hash;}
  }
 }
 assert.deepEqual(inverse,old,'Only three exact reviewed source fingerprint pairs may change; arguments, consumers and palette remain exact');
 return old;
}
