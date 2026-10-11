// Different reviewers use explicit schema keys. Missing decisions must never pass.
export function reviewVerdict(row) {
  return row?.outcome ?? row?.decision ?? row?.result ?? row?.verdict ?? 'pending-image-review';
}

export function needsVisualAttention(row) {
  const verdict = reviewVerdict(row);
  return !row || !verdict || verdict === 'pending-image-review' || /recapture|invalid|loading|needs-|partial-|role-flow-pending|finding-present|^finding$|minor-label|header-overlap|development-diagnostic/.test(verdict);
}
