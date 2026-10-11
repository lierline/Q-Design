// An exact append may retain prior source ownership; it never approves new rules.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {PARTS} from './sync-parts.mjs';
import {copyProblems,canonicalBody} from './audit-coverage-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',ref='882bdb38d01572b657edacba8f4343159b967dea';
const normalized=s=>s.replaceAll('\r\n','\n');
const marker='/* Boxed expert form controls use one explicit density.';
const canonical='patterns/foundation/atelier.css';
const before=normalized(execFileSync('git',['show','c6592704870b6bc4d1fe0b68a1436075d23dbc73:'+canonical],{cwd:root,encoding:'utf8'}));
const after=normalized(fs.readFileSync(root+'/'+canonical,'utf8'));
const at=after.indexOf(marker);assert(at>=0);assert.equal(after.slice(0,at).trimEnd(),before.trimEnd());
assert.equal(after.slice(at).trim(),`/* Boxed expert form controls use one explicit density. Native input and select
   intrinsic line boxes previously produced different 49 px and 51 px heights.
   Editorial auth fields keep their separate, centrally defined luxe recipe. */
.expert-portal-root form :is(input[type='text'], input[type='email'], input[type='password'], input[type='number'], input[type='date'], select):not(.luxe-input) {
  box-sizing: border-box;
  height: var(--qd-control-height);
  min-height: var(--qd-control-height);
  padding: var(--qd-control-pad-y) var(--qd-control-pad-x);
  font-size: var(--qd-control-size);
  line-height: var(--qd-line-height-normal);
  border-radius: var(--qd-radius-control);
}

.expert-portal-root form textarea:not(.luxe-input) {
  font-size: var(--qd-control-size);
  line-height: var(--qd-line-height-normal);
  padding: var(--qd-control-pad-y) var(--qd-control-pad-x);
  border-radius: var(--qd-radius-control);
}`);
const part=PARTS.find(p=>p.src==='dist/q-design.foundation.atelier.css'),copy='app/q-design.foundation.css';
const oldCopy=normalized(execFileSync('git',['show',ref+':'+copy],{cwd:repo,encoding:'utf8',maxBuffer:4e6}));
const newCopy=normalized(fs.readFileSync(repo+'/'+copy,'utf8'));
const oldDist=normalized(execFileSync('git',['show','c6592704870b6bc4d1fe0b68a1436075d23dbc73:dist/q-design.foundation.atelier.css'],{cwd:root,encoding:'utf8',maxBuffer:4e6}));
const newDist=normalized(fs.readFileSync(root+'/'+part.src,'utf8'));
assert.deepEqual(copyProblems(part,oldDist,oldCopy),[]);assert.deepEqual(copyProblems(part,newDist,newCopy),[]);
const addition='\n\n'+after.slice(at).trimEnd();
assert.equal(newDist.replace(addition,''),oldDist);
const deltas=new Map([[canonical,{before,after}],[part.src,{before:oldDist,after:newDist}],[copy,{before:oldCopy,after:newCopy}]]),changes=[];
// The intermediate density rule was independently generated and reviewed before
// adding textarea typography. Reconstruct that exact variant, verify its copy,
// and retain only unchanged dependency lines. New declarations are never approved.
const textareaRule=after.slice(after.indexOf('.expert-portal-root form textarea:not(.luxe-input)')).trimEnd();
const textareaAddition='\n\n'+textareaRule;
const firstCanonical=after.replace(textareaAddition,''),firstDist=newDist.replace(textareaAddition,'');
const firstCopy=newCopy.replace(textareaAddition,'').replace(/(q-design-nav-sha256:\s*)[a-f0-9]{64}/,(_,prefix)=>prefix+hash(canonicalBody(part,firstDist)));
assert.deepEqual(copyProblems(part,firstDist,firstCopy),[]);
for(const [path,prior] of [[canonical,firstCanonical],[part.src,firstDist],[copy,firstCopy]]) {
 const d=deltas.get(path);assert.equal(d.after.replace(textareaAddition,'').replace(/(q-design-nav-sha256:\s*)[a-f0-9]{64}/,(_,prefix)=>prefix+hash(canonicalBody(part,firstDist))),path===copy?prior:d.after.replace(textareaAddition,''));
 d.priors=[{before:prior,after:d.after,addition:textareaAddition}];
}
for(const name of fs.readdirSync(root+'/reviews').filter(n=>/^atelier-.*\.json$/.test(n)&&!['atelier-style-decisions.json','atelier-route-boundaries.json'].includes(n))){
 const full=root+'/reviews/'+name;let report;try{report=JSON.parse(fs.readFileSync(full,'utf8'));}catch{continue;}if(!Array.isArray(report.records))continue;let dirty=false;
 for(const r of report.records){
  // Only dependency fingerprints are retained. A record on changed CSS stays stale.
  const own=fs.existsSync(repo+'/'+r.path)?fs.readFileSync(repo+'/'+r.path,'utf8'):null;
  if(!own||hash(own)!==r.sourceHash)continue;
  for(const e of r.evidence??[]){const candidate=deltas.get(e.path),d=candidate&&[candidate,...(candidate.priors??[])].find(v=>e.hash===hash(v.before));if(!d)continue;
   assert(Number.isInteger(e.line)&&e.line>0);
   const append=d.addition??addition,insertion=d.after.indexOf(append),insertionLine=insertion<0?Infinity:d.after.slice(0,insertion).split('\n').length;
   const line=e.line>=insertionLine?e.line+append.split('\n').length-1:e.line;
   const oldLine=d.before.split('\n')[e.line-1],newLine=d.after.split('\n')[line-1];
   // Generated copy fingerprint headers are independently verified above.
   if(oldLine!==newLine&&!(/^\/\*.*q-design-nav-sha256:/.test(oldLine)&&/^\/\*.*q-design-nav-sha256:/.test(newLine)))continue;
   e.line=line;e.hash=hash(d.after);dirty=true;changes.push({report:name,path:r.path,evidencePath:e.path,line});
  }
 }
 if(dirty)fs.writeFileSync(full,JSON.stringify(report,null,2)+'\n');
}
fs.writeFileSync(root+'/reviews/followup-expert-density-evidence.json',JSON.stringify({scope:'Exact central expert boxed-form density append. Existing recipe prefix and generated copy fingerprints verified. Prior dependency references only; no new argument, changed source line, auth field or workflow is approved.',deltas:[...deltas].map(([path,d])=>({path,beforeHash:hash(d.before),afterHash:hash(d.after)})),retained:changes},null,2)+'\n');
console.log(JSON.stringify({verifiedFiles:deltas.size,retained:changes.length}));
