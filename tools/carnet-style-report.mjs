import fs from 'node:fs';

// Check mode evaluates the newly computed report, never a saved count.
export function publishCarnetStyleReport(report, destination, { check = false } = {}) {
  const unknownCount = report.records.filter(record => record.decision === 'unknown').length;
  if (!check) fs.writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
  return { unknownCount, exitCode: check && unknownCount > 0 ? 1 : 0 };
}
