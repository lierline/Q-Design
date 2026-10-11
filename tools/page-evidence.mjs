// Summarize independently captured and visually inspected page evidence.
// A screenshot, HTTP 200, or source scan alone never grants visual approval.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { reviewVerdict, needsVisualAttention } from './page-evidence-verdict.mjs';
import { verifiedRouteBoundary, captureDecision, scrollCoverageComplete } from './page-evidence-boundaries.mjs';
import { publishedPageEvidence } from './page-evidence-publication.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some(arg => !['--write', '--check'].includes(arg))) throw new Error('Use --write or --check.');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'reviews', name), 'utf8'));
const digest = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const canonical = file => path.resolve(root, file).replaceAll('\\', '/').toLowerCase();
const reviewPath = (product, file) => path.isAbsolute(file) ? file : file.startsWith('reviews/') ? path.join(root, file) : path.join(root, 'reviews', file);
const all = [];
for (const product of ['atelier', 'maison', 'carnet']) {
  const boundaryFile=path.join(root,'reviews',`${product}-route-boundaries.json`);
  const boundaries=fs.existsSync(boundaryFile)?JSON.parse(fs.readFileSync(boundaryFile,'utf8')).records:[];
  const productRoot=path.resolve(root,'..',{atelier:'Q-Atelier',maison:'Q-Works',carnet:'DHR'}[product]);
  const readBoundarySource=file=>{const target=path.resolve(productRoot,file);return target.startsWith(productRoot+path.sep)&&fs.existsSync(target)?fs.readFileSync(target,'utf8'):null;};
  const folder = path.join(root, 'reviews', `${product}-pages/screens`);
  const captures = fs.readdirSync(folder).filter(file => file.endsWith('.json')).map(file => ({ ...JSON.parse(fs.readFileSync(path.join(folder, file), 'utf8')), metadata: `reviews/${product}-pages/screens/${file}` }));
  const ledger = read(`${product}-pages-visual-review.json`);
  const supportingPaths = ['carnet-review', 'root-review', 'settings-visual-review', 'contiguous-visual-review'].map(reviewer => path.join(root, 'reviews', `${product}-pages-${reviewer}.json`));
  const ledgers = [ledger, ...supportingPaths.filter(file => fs.existsSync(file)).map(file => JSON.parse(fs.readFileSync(file, 'utf8')))];
  const visual = new Map();
  for (const row of ledgers.flatMap(item => item.records ?? item.reviews ?? [])) {
    const images = row.images ?? [{ path: row.image, sha256: row.imageSHA256 ?? row.sha256 }];
    for (const image of images) {
      if (!image.path || !image.sha256) continue;
      const file = reviewPath(product, image.path);
      const entry = { ...row, path: file, hash: image.sha256, verdict: reviewVerdict(row) };
      const key = `${canonical(file)}:${image.sha256}`;
      visual.set(key, entry);
    }
  }
  const evidence = captures.map(capture => {
    const images = (capture.screenshots ?? []).map(file => {
      const exists = fs.existsSync(file), hash = exists ? digest(file) : null;
      const reviewed = hash ? visual.get(`${canonical(file)}:${hash}`) : null;
      const verdict = reviewed?.verdict ?? 'pending-image-review';
      const needsAttention = needsVisualAttention(reviewed);
      return { path: file, hash, exists, reviewed: Boolean(reviewed), verdict, needsAttention };
    });
    const scrollComplete = scrollCoverageComplete(capture);
    const routeBoundary=verifiedRouteBoundary(capture,boundaries,readBoundarySource);
    return { metadata: capture.metadata, route: capture.route, url: capture.url, actualURL: capture.actualURL, role: capture.role, theme: capture.theme, viewport: capture.viewport, capturedAt: capture.capturedAt, mode: capture.captureMode ?? 'legacy', scrollComplete, images, routeBoundary, ...captureDecision(capture,images,scrollComplete,routeBoundary) };
  });
  let targets;
  if (product === 'atelier') targets = read('atelier-pages-inventory.json').flatMap(row => (row.urls ?? [row.route]).map(url => ({ route: row.route, url: `http://localhost:3600${url}`, role: row.role })));
  if (product === 'maison') targets = read('maison-pages-targets.json').targets.map(row => ({ route: row.route, url: row.url, role: row.role }));
  if (product === 'carnet') targets = read('carnet-pages-manifest.json').pages.map(row => ({ route: row.route, url: row.url, role: row.role }));
  const coverage = targets.map(target => {
    const found = evidence.filter(row => row.url === target.url && (row.role === target.role || row.role.startsWith(`${target.role}-`) || (target.role === 'anonymous' && row.role.startsWith('public-'))));
    return { ...target, captures: found.map(row => row.metadata), hasCapture: found.length > 0, hasReviewedCapture: found.some(row => row.allImagesReviewed), hasUsableVisualCapture: found.some(row => row.usableVisualCapture), hasVerifiedBoundaryCapture:found.some(row=>row.verifiedBoundaryCapture) };
  });
  const images = evidence.flatMap(row => row.images);
  all.push({ product, summary: { targets: targets.length, capturedTargets: coverage.filter(row => row.hasCapture).length, targetsWithReviewedCapture: coverage.filter(row => row.hasReviewedCapture).length, targetsWithUsableVisualCapture: coverage.filter(row => row.hasUsableVisualCapture).length, targetsWithVerifiedBoundaryCapture:coverage.filter(row=>row.hasVerifiedBoundaryCapture).length,captureRecords: evidence.length, images: images.length, reviewedImages: images.filter(row => row.reviewed).length, missingImages: images.filter(row => !row.exists).length }, missingTargets: coverage.filter(row => !row.hasCapture), pendingReviewTargets: coverage.filter(row => row.hasCapture && !row.hasReviewedCapture), attentionTargets: coverage.filter(row => row.hasReviewedCapture && !row.hasUsableVisualCapture&&!row.hasVerifiedBoundaryCapture), boundaryTargets:coverage.filter(row=>row.hasVerifiedBoundaryCapture), coverage, evidence });
}
const report = { version: 1, scope: 'Exact image-hash review coverage. Reviewed images can contain findings or incomplete paint. Coverage never implies layout, interaction, role, theme or responsive conformance; read each recorded verdict and finding.', products: all };
if (args.includes('--write')) fs.writeFileSync(path.join(root, 'reviews/page-evidence-summary.json'), JSON.stringify(publishedPageEvidence(report), null, 2) + '\n');
console.log(JSON.stringify(all.map(({ product, summary }) => ({ product, ...summary })), null, 2));
if (args.includes('--check') && all.some(p => p.missingTargets.length || p.pendingReviewTargets.length || p.attentionTargets.length || p.summary.missingImages)) process.exitCode = 1;
