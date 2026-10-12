import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {copyNodes,jsxDisplayText} from './copy-spacing.mjs';
import {hash} from './style-arguments-core.mjs';
import {planMaisonWorkflowCopy} from './maison-workflow-copy.mjs';
import {beforeProductionCopyBindings} from './maison-production-copy-bindings.mjs';
const root='D:/Claude/Q-Design',ref='bfcc8e680c8ad9838b2161eed1912b5faea773ac',file='dist/q-design.copy-bindings.json',manifest=root+'/reviews/maison-workflow-copy-bindings.json';
const serialize=j=>JSON.stringify(j,null,2)+'\n',norm=s=>s.replaceAll('\r\n','\n');
export async function createWorkflowCopyBindings(){
 const {records}=await planMaisonWorkflowCopy(),before=JSON.parse(execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024})),after=structuredClone(before),changes=[];
 for(const r of records){
  const oldNodes=copyNodes(r.path,r.before),newNodes=copyNodes(r.path,r.after);assert.equal(oldNodes.length,newNodes.length);for(const [i,n]of oldNodes.entries())assert.equal(n.kind,newNodes[i].kind);
  const old=before.files.find(f=>f.product==='maison'&&f.path===r.path),bindings=(old?.bindings??[]).map(b=>{
   const i=oldNodes.findIndex(n=>n.line===b.line&&n.kind===b.kind&&n.ordinal===b.ordinal&&norm(n.raw)===norm(b.emitted));assert(i>=0,'Every prior binding remains exact');const next=newNodes[i];return {...b,line:next.line,ordinal:next.ordinal,emitted:next.raw};
  });
  for(const c of r.changes){
   const i=oldNodes.findIndex(n=>n.line===c.line&&n.kind===c.kind&&norm(n.raw)===norm(c.from));assert(i>=0);const n=newNodes[i];assert(norm(n.raw)===norm(c.to)||n.kind==='JsxText'&&jsxDisplayText(n.raw)===jsxDisplayText(c.to));
   const binding={line:n.line,kind:n.kind,ordinal:n.ordinal,original:c.from,emitted:n.raw},existing=bindings.findIndex(b=>b.line===n.line&&b.kind===n.kind&&b.ordinal===n.ordinal);if(existing<0)bindings.push(binding);else bindings[existing]=binding;
  }
  const row={...(old??{product:'maison',path:r.path}),bindings},index=after.files.findIndex(f=>f.product==='maison'&&f.path===r.path);if(index<0)after.files.push(row);else after.files[index]=row;changes.push({path:r.path,literals:r.literals});
 }
 assert.deepEqual(after.files.filter(f=>f.product!=='maison'),before.files.filter(f=>f.product!=='maison'));
 return {before,after,proof:{version:1,reviewRef:ref,scope:'Nineteen professional interface literals are bound to their original strings and exact formatted source positions. Existing bindings move only by verified literal ordinal. All other product bindings are unchanged.',beforeHash:hash(serialize(before)),afterHash:hash(serialize(after)),changes}};
}
export function beforeWorkflowCopyBindings(current){
 current=beforeProductionCopyBindings(current);
 if(!fs.existsSync(manifest))return current;
 const proof=JSON.parse(fs.readFileSync(manifest,'utf8')),before=JSON.parse(execFileSync('git',['show',ref+':'+file],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}));assert.equal(hash(serialize(before)),proof.beforeHash);if(hash(serialize(current))===proof.beforeHash)return current;assert.equal(hash(serialize(current)),proof.afterHash,'Unreviewed interface binding changes');return before;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const {after,proof}=await createWorkflowCopyBindings();if(process.argv.includes('--write')){fs.writeFileSync(root+'/'+file,serialize(after));fs.writeFileSync(manifest,serialize(proof));}else{assert.deepEqual(beforeProductionCopyBindings(JSON.parse(fs.readFileSync(root+'/'+file,'utf8'))),after);assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),proof);}console.log(JSON.stringify({files:proof.changes.length,literals:proof.changes.reduce((n,c)=>n+c.literals,0),passed:true}));
}
