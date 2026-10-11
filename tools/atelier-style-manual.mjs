// A consumer review applies only to its exact argument and every hashed source.
export const manualDecisions = new Set(['business-data', 'business-content', 'structural-behavior',
  'coordinate-boundary', 'physical-artifact', 'delegated-renderer-parameter',
  'confirmed-style-composition', 'token-reference-verified', 'compatibility-noop', 'platform-metadata']);

export function verifiedConsumerReview(record, review, currentHash) {
  if (!review || !manualDecisions.has(review.decision) || !review.reason || !review.ruleId) return null;
  for (const key of ['argumentHash', 'sourceHash', 'path', 'line']) if (record[key] !== review[key]) return null;
  if (currentHash(review.path) !== review.sourceHash) return null;
  if (!review.evidence?.length || review.evidence.some(item => !item.path || !item.hash || !Number.isInteger(item.line)
    || item.line < 1 || currentHash(item.path) !== item.hash)) return null;
  return { decision: review.decision, ruleId: review.ruleId, reason: review.reason, evidence: review.evidence };
}
