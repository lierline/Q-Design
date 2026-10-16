import fs from 'node:fs';
import path from 'node:path';

export function reviewMode(args) {
  if (args.length === 0 || (args.length === 1 && args[0] === '--write')) return 'write';
  if (args.length === 1 && args[0] === '--check') return 'check';
  if (args.length === 1 && args[0] === '--fresh') return 'fresh';
  throw new Error('Usage: node tools/maison-style-review.mjs [--write|--check|--fresh]');
}

const serialize = value => JSON.stringify(value, null, 2) + '\n';
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// The saved report is fresh only when the newly computed report, carrying the saved
// generatedAt, serializes to the exact saved bytes and the saved unknown list does too.
// The differences only explain a failure; the byte comparison is the verdict.
export function compareSaved(report, directory, limit = 10) {
  const reportFile = path.join(directory, 'maison-style-decisions.json'), unknownFile = path.join(directory, 'maison-style-unknowns.json');
  if (!fs.existsSync(reportFile) || !fs.existsSync(unknownFile)) return { fresh: false, changedRecords: null, differences: [{ kind: 'missing-saved-report' }] };
  const savedText = fs.readFileSync(reportFile, 'utf8'), saved = JSON.parse(savedText);
  const reportMatches = serialize({ ...report, generatedAt: saved.generatedAt }) === savedText;
  const unknownMatches = serialize(report.records.filter(record => record.decision === 'unknown')) === fs.readFileSync(unknownFile, 'utf8');
  if (reportMatches && unknownMatches) return { fresh: true, changedRecords: 0, differences: [] };
  const differences = [], note = difference => { if (differences.length < limit) differences.push(difference); };
  for (const key of new Set([...Object.keys(saved), ...Object.keys(report)]))
    if (!['generatedAt', 'fileHashes', 'records'].includes(key) && !same(saved[key], report[key])) note({ kind: 'header', key });
  const savedFiles = new Map((saved.fileHashes ?? []).map(row => [row.path, row.hash])), freshFiles = new Map((report.fileHashes ?? []).map(row => [row.path, row.hash]));
  for (const file of new Set([...savedFiles.keys(), ...freshFiles.keys()]))
    if (savedFiles.get(file) !== freshFiles.get(file)) note({ kind: 'source', path: file, saved: savedFiles.get(file) ?? null, fresh: freshFiles.get(file) ?? null });
  const savedRecords = saved.records ?? [];
  let changedRecords = 0;
  for (let index = 0; index < Math.max(savedRecords.length, report.records.length); index++) {
    const before = savedRecords[index], after = report.records[index];
    if (same(before, after)) continue;
    changedRecords++;
    note({ kind: 'record', index, path: (after ?? before).path, line: (after ?? before).line, fields: [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].filter(key => !same(before?.[key], after?.[key])) });
  }
  if (!unknownMatches) note({ kind: 'unknown-list' });
  if (!differences.length) note({ kind: 'serialization' });
  return { fresh: false, changedRecords, differences };
}

// Check and fresh modes consume the freshly computed report, never a saved approval count.
// Check requires both zero unknowns and an exactly fresh saved report; fresh requires only the latter.
export function finishReview(report, directory, mode) {
  if (!['write', 'check', 'fresh'].includes(mode)) throw new Error('Invalid review mode');
  const unknowns = report.records.filter(record => record.decision === 'unknown');
  if (report.unknownCount !== unknowns.length) throw new Error('Review unknown count does not match its records');
  if (mode === 'write') {
    fs.writeFileSync(path.join(directory, 'maison-style-decisions.json'), serialize(report));
    fs.writeFileSync(path.join(directory, 'maison-style-unknowns.json'), serialize(unknowns));
    return { ok: unknowns.length === 0, unknownCount: unknowns.length };
  }
  const saved = compareSaved(report, directory);
  return { ok: saved.fresh && (mode === 'fresh' || unknowns.length === 0), unknownCount: unknowns.length, ...saved };
}
