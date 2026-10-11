// Keep whole-product completion distinct from copy synchronization and fixture parity.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
if(args.some(arg=>!['--check','--write'].includes(arg)))throw new Error('Use --write or --check');
const read=file=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
const styles=Object.fromEntries(['atelier','maison','carnet'].map(product=>[product,read(`reviews/${product}-style-decisions.json`)]));
const pages=read('reviews/page-evidence-summary.json');
const propagation=read('reviews/design-propagation-results.json');
const candidates=read('reviews/maison-choice-missing-base-candidates.json');
const normalize=value=>value.replaceAll('\r\n','\n');
const choices=candidates.map(candidate=>{
 const code=normalize(fs.readFileSync(path.resolve(root,'../Q-Works',candidate.path),'utf8'));
 const unchanged=code.includes(normalize(candidate.className));
 return{path:candidate.path,line:candidate.line,label:candidate.label,state:unchanged&&!/\bqd-choice\b(?!-)/.test(candidate.className)?'missing-base-confirmed':unchanged?'base-present':'requires-source-recheck'};
});
const blockers=[];
for(const [product,review]of Object.entries(styles))if(review.counts.unknown)blockers.push({product,kind:'unresolved-style-arguments',count:review.counts.unknown,note:'Unclassified source arguments are not automatically visual defects or approved exceptions.'});
for(const {product,summary}of pages.products){
 const remainingImages=summary.images-summary.reviewedImages;
 const remainingTargets=summary.targets-summary.targetsWithUsableVisualCapture-summary.targetsWithVerifiedBoundaryCapture;
 if(remainingImages||remainingTargets)blockers.push({product,kind:'incomplete-screen-evidence',remainingImages,remainingTargets,missingCaptureTargets:summary.targets-summary.capturedTargets});
}
if(choices.some(c=>c.state!=='base-present'))blockers.push({product:'maison',kind:'choice-base-followups',count:choices.filter(c=>c.state!=='base-present').length,files:new Set(choices.filter(c=>c.state!=='base-present').map(c=>c.path)).size,note:'Square scoring controls and long labels require role-specific review before migration.'});
if(propagation.failures.length)blockers.push({kind:'shared-parameter-propagation',count:propagation.failures.length});
const report={version:1,scope:'Audit closure guard. Passing source/copy tests does not certify all screens. Zero blockers still requires explicit visual and interaction review.',status:blockers.length?'not-certified':'evidence-ready-for-review',sharedParameters:{checks:propagation.checks,paletteChecks:propagation.paletteChecks,failures:propagation.failures.length},styleUnknowns:Object.fromEntries(Object.entries(styles).map(([product,review])=>[product,review.counts.unknown??0])),screenEvidence:pages.products.map(({product,summary})=>({product,...summary})),choices,blockers};
if(args.includes('--write'))fs.writeFileSync(path.join(root,'reviews/design-readiness.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,sharedParameters:report.sharedParameters,blockers},null,2));
if(args.includes('--check')&&blockers.length)process.exitCode=1;
