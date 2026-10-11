/* Generated from patterns/copy-rules.json. Display text only; never persist this result. */
const terms = [
  {
    "from": "최종확정",
    "to": "최종 확정"
  },
  {
    "from": "경영검토",
    "to": "경영 검토"
  }
] as const;

export function formatPermissionDescription(value: string): string {
  let result = value;
  for (const term of terms) result = result.replaceAll(term.from, term.to);
  return result;
}
