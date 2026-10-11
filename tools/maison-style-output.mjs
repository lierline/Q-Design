import fs from 'node:fs';
import path from 'node:path';

export function reviewMode(args) {
  if (args.length === 0 || (args.length === 1 && args[0] === '--write')) return 'write';
  if (args.length === 1 && args[0] === '--check') return 'check';
  throw new Error('Usage: node tools/maison-style-review.mjs [--write|--check]');
}

// Check mode consumes the freshly computed report, never a saved approval count.
export function finishReview(report, directory, mode) {
  if (!['write', 'check'].includes(mode)) throw new Error('Invalid review mode');
  const unknowns = report.records.filter(record => record.decision === 'unknown');
  if (report.unknownCount !== unknowns.length) throw new Error('Review unknown count does not match its records');
  if (mode === 'write') {
    fs.writeFileSync(path.join(directory, 'maison-style-decisions.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(directory, 'maison-style-unknowns.json'), JSON.stringify(unknowns, null, 2) + '\n');
  }
  return { ok: unknowns.length === 0, unknownCount: unknowns.length };
}
