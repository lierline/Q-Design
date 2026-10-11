import { hash } from './style-arguments-core.mjs';

// A review only applies to the exact source and argument that was inspected.
// File movement, source edits, line changes or expression edits reopen review.
export function reviewedScriptBoundary(file, sourceHash, argument, review) {
  if (argument.kind !== 'dynamic-style' || argument.property !== 'embedded-script') return null;
  const argumentHash = hash(JSON.stringify([file, argument.line, argument.kind, argument.property, argument.value]));
  const match = review.records.find(record => record.path === file && record.sourceHash === sourceHash && record.argumentHash === argumentHash);
  return match ? {decision:match.decision,ruleId:match.ruleId,reason:match.reason,evidence:match.evidence} : null;
}
