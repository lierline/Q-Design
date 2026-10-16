// Rebind unchanged evidence only after verifying the exact new CSS appendix.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {beforeSocialFoundation,beforeSocialDist,beforeSocialCopy,socialTouchAppendix} from './atelier-social-touch-foundation.mjs';
import {readRuntimeValues,resolveAtelierMedia} from './atelier-runtime-values.mjs';
import {beforeProfileGridReview} from './atelier-profile-grid-review-inverse.mjs';
import {beforeGlobalTypographySource} from './global-typography-evidence.mjs';
import {beforeLedgerSourceIfLater} from './atelier-ledger-pattern-sources.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',ref='12a8e0dfbc52455b360f7025d7b8a5860d0e72d8';
const normalize=s=>s.replaceAll('\r\n','\n'),serialize=j=>JSON.stringify(j,null,2)+'\n',read=p=>normalize(fs.readFileSync(p,'utf8'));
const names=['atelier-color-flow-review.json','atelier-fold-grid-review.json','atelier-renderer-enum-review.json','atelier-size-renderer-review.json','atelier-style-bindings-review.json','atelier-widget-width-review.json'];
const compiled=resolveAtelierMedia(socialTouchAppendix,readRuntimeValues(root));
const definitions=[['patterns/foundation/atelier.css',root,beforeSocialFoundation,socialTouchAppendix],['dist/q-design.foundation.atelier.css',root,beforeSocialDist,compiled],['app/q-design.foundation.css',repo,beforeSocialCopy,compiled]].map(([path,cwd,reverse,addition])=>{
 const after=beforeGlobalTypographySource(path,beforeLedgerSourceIfLater(path,read(cwd+'/'+path),cwd===root?'design':'product')),before=reverse(after),at=after.indexOf(addition);assert(at>=0);assert.equal(after.split(addition).length,2);
 const insertionLine=after.slice(0,at).split('\n').length,addedLines=addition.split('\n').length-1;
 return {path,before,after,beforeHash:hash(before),afterHash:hash(after),insertionLine,addedLines};
});
const prepared=[],proofs=[];let total=0;
for(const name of names){
 const before=JSON.parse(execFileSync('git',['show',ref+':reviews/'+name],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024})),after=structuredClone(before),changes=[],flowChanges=[];
 for(const record of after.records){
  const matching=(record.evidence??[]).filter(e=>definitions.some(d=>d.path===e.path&&d.beforeHash===e.hash));if(!matching.length)continue;
  // Like the CSS sources above, a consumer the newer ledger pattern layer edited is read back to its exact earlier source.
  assert.equal(hash(beforeLedgerSourceIfLater(record.path,read(repo+'/'+record.path))),record.sourceHash,'Changed consumer cannot inherit evidence');
  for(const e of matching){const d=definitions.find(d=>d.path===e.path&&d.beforeHash===e.hash),oldLine=e.line,nextLine=oldLine>d.insertionLine?oldLine+d.addedLines:oldLine;
   assert(Number.isInteger(oldLine)&&oldLine>0);const oldText=d.before.split('\n')[oldLine-1],newText=d.after.split('\n')[nextLine-1];assert(oldText!==undefined&&oldText===newText,'Changed declaration cannot inherit evidence');
   changes.push({recordIndex:after.records.indexOf(record),argumentHash:record.argumentHash,path:e.path,beforeLine:oldLine,afterLine:nextLine,beforeHash:e.hash,afterHash:d.afterHash});e.hash=d.afterHash;e.line=nextLine;
  }
 }
 // A flow output repeats the same verified dependency in its transport metadata.
 // Verify its unchanged source and declaration before changing that exact JSON location.
 for(const [flowIndex,flow] of (after.flows??[]).entries()){
  const consumer=after.records.find(r=>r.path===flow.path);assert(consumer,'Flow must have an independently verified consumer');
  assert.equal(hash(beforeLedgerSourceIfLater(flow.path,read(repo+'/'+flow.path))),consumer.sourceHash);
  function visit(value,location){
   if(!value||typeof value!=='object')return;
   const d=definitions.find(d=>value.path===d.path&&value.hash===d.beforeHash);
   if(d){const oldLine=value.line,nextLine=oldLine>d.insertionLine?oldLine+d.addedLines:oldLine;
    assert(Number.isInteger(oldLine)&&oldLine>0);assert.equal(d.before.split('\n')[oldLine-1],d.after.split('\n')[nextLine-1]);
    flowChanges.push({location,path:value.path,beforeLine:oldLine,afterLine:nextLine,beforeHash:value.hash,afterHash:d.afterHash});value.hash=d.afterHash;value.line=nextLine;return;
   }
   for(const [key,item] of Object.entries(value))visit(item,[...location,key]);
  }
  visit(flow,['flows',flowIndex]);
 }
 assert(changes.length>0);total+=changes.length;prepared.push({name,before,after});proofs.push({name,beforeHash:hash(serialize(before)),afterHash:hash(serialize(after)),changes,flowChanges});
}
assert.equal(total,458,'236 central CSS references and 222 generated product-copy references only');
const proof={version:2,ref,scope:'458 unchanged record declaration references across six current review reports, including 222 product-copy references, plus exact repeated flow-output dependencies. Whole consumers and every prior review field remain unchanged except these exact dependency hashes and the eight-line compiled insertion offset. No new argument or decision is approved.',dependencies:definitions.map(({before,after,...d})=>d),reports:proofs};
if(process.argv.includes('--write')){const prior=JSON.parse(read(root+'/reviews/atelier-social-touch-revalidation.json'));for(const p of prepared){const original=prior.reports.find(r=>r.name===p.name);assert.equal(prior.ref,ref);assert.equal(original.beforeHash,hash(serialize(p.before)));const currentHash=hash(read(root+'/reviews/'+p.name));assert(currentHash===original.beforeHash||currentHash===original.afterHash,'Write requires the whole previously verified report');}for(const p of prepared)fs.writeFileSync(root+'/reviews/'+p.name,serialize(p.after));fs.writeFileSync(root+'/reviews/atelier-social-touch-revalidation.json',serialize(proof));}
else{for(const p of prepared)assert(hash(serialize(beforeProfileGridReview(p.name,JSON.parse(read(root+'/reviews/'+p.name)))))===hash(serialize(p.after)),'Current report differs outside reviewed evidence: '+p.name);assert.deepEqual(JSON.parse(read(root+'/reviews/atelier-social-touch-revalidation.json')),proof);}
console.log(JSON.stringify({reports:prepared.length,references:total,flowReferences:proofs.reduce((n,p)=>n+p.flowChanges.length,0)}));
