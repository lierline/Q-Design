// Revalidate existing, unchanged foundation evidence after the reviewed control block.
// This does not approve new arguments or discard any unknown source records.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const designBeforeRef='83e00617f898b37dba3d584d93b5bd812c0e17f7',productBeforeRef='99bfeabfb129314b505c286167d1bb9ab69fc059';
const normalize=s=>s.replaceAll('\r\n','\n'),hash=s=>createHash('sha256').update(normalize(s)).digest('hex');
const before=normalize(execFileSync('git',['show',`${designBeforeRef}:patterns/foundation.css`],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}));
const after=normalize(fs.readFileSync(path.join(root,'patterns/foundation.css'),'utf8'));
const start=after.indexOf('/* Custom file triggers use the same target'),end=after.indexOf('/* Korean copy wraps between words.',start);
assert(start>=0&&end>start,'reviewed block boundaries missing');
assert.equal(after.slice(0,start)+after.slice(end),before,'an existing foundation statement changed');
const firstLine=after.slice(0,start).split('\n').length,addedLines=after.slice(start,end).split('\n').length-1;
const changes=[];
const canonicalCopies=new Map([['patterns/foundation.css',{before,after}]]);
for(const [file,repo,gitFile] of [['dist/q-design.foundation.atelier.css',root,'dist/q-design.foundation.atelier.css'],['app/q-design.foundation.css',path.resolve(root,'../Q-Atelier'),'app/q-design.foundation.css']]){
 const prior=normalize(execFileSync('git',['show',`${repo===root?designBeforeRef:productBeforeRef}:${gitFile}`],{cwd:repo,encoding:'utf8',maxBuffer:8*1024*1024}));
 const current=normalize(fs.readFileSync(path.join(repo,file),'utf8'));
 const block=current.indexOf('/* Custom file triggers use the same target'),next=current.indexOf('/* Korean copy wraps between words.',block);
 assert(block>=0&&next>block,'copy block missing');
 const restored=current.slice(0,block)+current.slice(next);
 const cleanHeader=s=>s.replace(/(q-design-nav-sha256: )[a-f0-9]{64}/,'$1<verified-origin>');
 if(file==='app/q-design.foundation.css'){
  const origin=canonicalCopies.get('dist/q-design.foundation.atelier.css');
  assert(prior.includes(`q-design-nav-sha256: ${hash(origin.before)}`),'old copy origin is invalid');
  assert(current.includes(`q-design-nav-sha256: ${hash(origin.after)}`),'current copy origin is invalid');
 }
 assert(cleanHeader(restored)===cleanHeader(prior),`pre-existing copy declarations changed: ${file}`);
 canonicalCopies.set(file,{before:prior,after:current,firstLine:current.slice(0,block).split('\n').length});
}
const names=['atelier-style-spread-review.json','atelier-style-bindings-review.json','atelier-style-consumer-review.json','atelier-style-prop-flow-review.json','atelier-fold-grid-review.json','atelier-widget-width-review.json','atelier-final-presentation-boundaries.json','atelier-renderer-enum-review.json','atelier-renderer-slot-review.json','atelier-html-content-review.json','atelier-dimension-flow-review.json','atelier-api-output-consumer-review.json','atelier-data-ratio-review.json','atelier-measured-coordinate-review.json','atelier-semantic-palette-review.json','atelier-color-flow-review.json','atelier-watermark-content-review.json'];
for(const name of names){
 const file=path.join(root,'reviews',name);if(!fs.existsSync(file))continue;
 const report=JSON.parse(fs.readFileSync(file,'utf8'));let changed=false;
 for(const record of report.records??[]){
  for(const evidence of record.evidence??[]){
   const copy=canonicalCopies.get(evidence.path);
   if(!copy||![hash(copy.before),hash(copy.after)].includes(evidence.hash))continue;
   assert.equal(hash(fs.readFileSync(path.resolve(root,'../Q-Atelier',record.path),'utf8')),record.sourceHash,`consumer changed: ${record.path}`);
   const alreadyCurrent=evidence.hash===hash(copy.after),insertion=copy.firstLine??firstLine;
   const previousLine=alreadyCurrent&&evidence.line>=insertion+addedLines?evidence.line-addedLines:evidence.line;
   if(Number.isInteger(previousLine)){const nextLine=previousLine>=insertion?previousLine+addedLines:previousLine;const oldText=copy.before.split('\n')[previousLine-1],newText=copy.after.split('\n')[nextLine-1];assert(oldText===newText,'foundation evidence line changed');evidence.line=nextLine;}
   evidence.hash=hash(copy.after);changed=true;
   changes.push({report:name,path:record.path,argumentHash:record.argumentHash,line:record.line,evidencePath:evidence.path,evidencePreviousLine:previousLine,evidenceLine:evidence.line});
  }
 }
 if(changed&&process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
}
const result={scope:'Exact unchanged consumer hashes and pre-existing foundation text. Only newly inserted calendar/file-control rules differ. Existing decisions are retained; no unknown is promoted.',designBeforeRef,productBeforeRef,beforeHash:hash(before),afterHash:hash(after),firstLine,addedLines,changes};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'reviews/foundation-control-evidence-revalidation.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({evidenceUpdates:changes.length,consumerArguments:new Set(changes.map(c=>c.path+':'+c.argumentHash)).size}));
