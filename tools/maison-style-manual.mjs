import fs from 'node:fs';
import path from 'node:path';
// An exact human-reviewed source snapshot is evidence for that snapshot only.
// A new candidate or changed source/evidence must never inherit an old decision.
// Evidence paths resolve against normalized roots. A root given as an unnormalized string
// (for example 'D:/Claude/Q-Design' on Windows) once failed the boundary test for every
// design-side file and silently turned 747 reviewed decisions unknown (2026-10-16).
export function manualHashReader({root,product,hash,seed=[]}){
  const design=path.resolve(root),app=path.resolve(product),cache=new Map(seed);
  return file=>{
    if(cache.has(file))return cache.get(file);
    const base=/^(?:source|patterns|dist|tools)\//.test(file)?design:app,full=path.resolve(base,file);
    if(!full.startsWith(base+path.sep)||!fs.existsSync(full))return null;
    const value=hash(fs.readFileSync(full,'utf8'));cache.set(file,value);return value;
  };
}
export const manualDecisions = new Set(['business-data','business-content','structural-behavior','coordinate-boundary','delegated-renderer-parameter','confirmed-style-composition','token-reference-verified','compatibility-noop','platform-metadata']);
export function verifiedManualReview(record, review, currentHash) {
  if(!review||!manualDecisions.has(review.decision)||!review.reason||!review.ruleId)return null;
  for(const key of ['argumentHash','sourceHash','path','line'])if(record[key]!==review[key])return null;
  if(currentHash(review.path)!==review.sourceHash)return null;
  if(!review.evidence?.length||review.evidence.some(item=>!item.path||!item.hash||currentHash(item.path)!==item.hash))return null;
  return {decision:review.decision,ruleId:review.ruleId,reason:review.reason,evidence:review.evidence};
}
