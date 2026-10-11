// An exact human-reviewed source snapshot is evidence for that snapshot only.
// A new candidate or changed source/evidence must never inherit an old decision.
export const manualDecisions = new Set(['business-data','business-content','structural-behavior','coordinate-boundary','delegated-renderer-parameter','confirmed-style-composition','token-reference-verified','compatibility-noop','platform-metadata']);
export function verifiedManualReview(record, review, currentHash) {
  if(!review||!manualDecisions.has(review.decision)||!review.reason||!review.ruleId)return null;
  for(const key of ['argumentHash','sourceHash','path','line'])if(record[key]!==review[key])return null;
  if(currentHash(review.path)!==review.sourceHash)return null;
  if(!review.evidence?.length||review.evidence.some(item=>!item.path||!item.hash||currentHash(item.path)!==item.hash))return null;
  return {decision:review.decision,ruleId:review.ruleId,reason:review.reason,evidence:review.evidence};
}
