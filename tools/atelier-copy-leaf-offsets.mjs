// Text-only copy changes may move byte offsets while preserving a style parameter.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {applyBindings,termsForFile} from './copy-spacing.mjs';
import {createParameterLeafReview} from './atelier-parameter-leaves-review.mjs';
import {beforeLedgerReview} from './atelier-ledger-pattern-review.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',ref='e6df209',reportName='atelier-parameter-leaves-review.json',manifest=root+'/reviews/atelier-copy-leaf-offsets.json',serialize=j=>JSON.stringify(j,null,2)+'\n';
export function beforeCopyLeafOffsets(name,current){
 // The ledger pattern layer (2026-10-15) is the newest; it reverses only its exact reviewed reports.
 current=beforeLedgerReview(name,current);
 if(name!==reportName||!fs.existsSync(manifest))return current;
 const p=JSON.parse(fs.readFileSync(manifest,'utf8'));if(hash(serialize(current))===p.beforeHash)return current;
 assert.equal(hash(serialize(current)),p.afterHash,'Unreviewed leaf offset report');
 const before=structuredClone(current);for(const c of p.changes){const leaf=before.flows[c.flow].leaves[c.leaf];assert.deepEqual(leaf,c.after);before.flows[c.flow].leaves[c.leaf]=c.before;}
 assert.equal(hash(serialize(before)),p.beforeHash);return before;
}
export function createCopyLeafOffsetReview(){
 // Later layers rebuild the leaf report; their exact reviewed rebuild reverses first to the report this proof was written on.
 const before=JSON.parse(execFileSync('git',['show',ref+':reviews/'+reportName],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024})),after=beforeLedgerReview(reportName,createParameterLeafReview()),restored=structuredClone(after),changes=[];
 const copy=JSON.parse(fs.readFileSync(root+'/reviews/atelier-professional-copy-revalidation.json','utf8')),terms=JSON.parse(fs.readFileSync(root+'/patterns/professional-atelier-copy.json','utf8')).terms,sources=new Map();
 for(const [i,flow]of before.flows.entries())for(const [j,leaf]of flow.leaves.entries()){
  const current=after.flows[i]?.leaves[j];assert(current);
  if(serialize(leaf)===serialize(current))continue;
  assert.deepEqual({...current,start:leaf.start,end:leaf.end},leaf,'Only exact offsets may change');
  const source=copy.sources.find(r=>r.path===flow.path);assert(source,'Only a reviewed text-only source may move leaf offsets');
  if(!sources.has(flow.path)){
   const code=fs.readFileSync(repo+'/'+flow.path,'utf8'),raw=execFileSync('git',['show',copy.productRef+':'+flow.path],{cwd:repo,encoding:'utf8'}),newline=code.includes('\r\n')?'\r\n':'\n',baseline=raw.replaceAll('\r\n','\n').replaceAll('\n',newline);
   assert.equal(hash(code),source.afterHash);assert.equal(hash(baseline),source.beforeHash);
   const result=applyBindings(flow.path,baseline,[],termsForFile(terms,'atelier',flow.path));assert.equal(hash(result.after),hash(code));sources.set(flow.path,{baseline,code,edits:result.changes});
  }
  const {baseline,code,edits}=sources.get(flow.path);const mapOffset=offset=>{let delta=0;for(const e of edits){assert(!(offset>e.start&&offset<e.end),'A changed display literal cannot be a style leaf');if(e.end<=offset)delta+=e.emitted.length-(e.end-e.start);}return offset+delta;};
  assert.equal(current.start,mapOffset(leaf.start));assert.equal(current.end,mapOffset(leaf.end));assert.equal(baseline.slice(leaf.start,leaf.end),leaf.text);assert.equal(code.slice(current.start,current.end),leaf.text);
  changes.push({flow:i,leaf:j,path:flow.path,before:leaf,after:current});restored.flows[i].leaves[j]=leaf;
 }
 assert.deepEqual(restored,before,'Other callers, values, defaults, sources and complete metadata must remain exact');assert(changes.length>0);
 return {after,proof:{version:1,reviewRef:ref,scope:'Only lexical byte offsets moved by separately verified display-copy literals. Exact leaf text, line, callers, values, defaults and every other report field are unchanged. No new leaf or caller is approved.',beforeHash:hash(serialize(before)),afterHash:hash(serialize(after)),changes}};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const {after,proof}=createCopyLeafOffsetReview();if(process.argv.includes('--write')){assert(!fs.existsSync(manifest));fs.writeFileSync(root+'/reviews/'+reportName,serialize(after));fs.writeFileSync(manifest,serialize(proof));}else{assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),proof);assert.deepEqual(beforeLedgerReview(reportName,JSON.parse(fs.readFileSync(root+'/reviews/'+reportName,'utf8'))),after);}
 console.log(JSON.stringify({offsets:proof.changes.length,flows:after.flows.length,passed:true}));
}
