import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {copyNodes,jsxDisplayText} from './copy-spacing.mjs';
import {hash} from './style-arguments-core.mjs';
import {iconHandoffRef,beforeMaisonIconSource} from './maison-icon-handoff.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='f83d383',ts=createRequire(repo+'/package.json')('typescript');
export function relocateIconCopyBindings(file,before,after,bindings){
 const norm=s=>s.replaceAll('\r\n','\n');
 const literals=code=>{
  const sf=ts.createSourceFile(file,code,99,true,file.endsWith('x')?4:3);
  const imports=sf.statements.filter(ts.isImportDeclaration).map(n=>[n.getStart(sf),n.end]);
  return copyNodes(file,code).filter(n=>!imports.some(([start,end])=>n.start>=start&&n.end<=end));
 };
 const oldNodes=literals(before),newNodes=literals(after);
 assert.equal(oldNodes.length,newNodes.length,'Every non-import literal must remain');
 for(const [i,node]of oldNodes.entries()){const next=newNodes[i];assert.equal(node.kind,next.kind);assert(norm(node.raw)===norm(next.raw)||(node.kind==='JsxText'&&jsxDisplayText(node.raw)===jsxDisplayText(next.raw)),'Non-import authored text changed');}
 return bindings.map(b=>{const index=oldNodes.findIndex(n=>n.line===b.line&&n.kind===b.kind&&n.ordinal===b.ordinal&&norm(n.raw)===norm(b.emitted));assert(index>=0,'Exact existing copy binding must remain: '+file+':'+b.line+':'+b.kind+':'+b.ordinal);const n=newNodes[index];return {...b,line:n.line,ordinal:n.ordinal,emitted:n.raw};});
}
export function createIconCopyBindings(){
 const relative='dist/q-design.copy-bindings.json',before=JSON.parse(execFileSync('git',['show',ref+':'+relative],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024})),after=structuredClone(before);
 const migration=JSON.parse(fs.readFileSync(root+'/reviews/maison-icon-handoff-migration.json','utf8')),records=[];
 for(const row of after.files){
  if(row.product!=='maison'||!migration.records.some(r=>r.path===row.path))continue;
  const source=fs.readFileSync(repo+'/'+row.path,'utf8'),baseline=beforeMaisonIconSource(row.path,source);
  const bindings=relocateIconCopyBindings(row.path,baseline,source,row.bindings);
  records.push({path:row.path,beforeHash:hash(baseline),afterHash:hash(source),before:row.bindings,after:bindings});row.bindings=bindings;
 }
 assert.deepEqual(after.files.filter(r=>r.product!=='maison'),before.files.filter(r=>r.product!=='maison'));
 return {after,proof:{version:1,reviewRef:ref,productRef:iconHandoffRef,scope:'Exact display binding locations after the reviewed icon import migration. Every non-import literal and rendered JSX text is unchanged; no product copy, business data or other product binding is edited.',beforeHash:hash(JSON.stringify(before,null,2)+'\n'),afterHash:hash(JSON.stringify(after,null,2)+'\n'),records}};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const {after,proof}=createIconCopyBindings(),output=root+'/dist/q-design.copy-bindings.json',review=root+'/reviews/maison-icon-copy-bindings.json';
 if(process.argv.includes('--write')){fs.writeFileSync(output,JSON.stringify(after,null,2)+'\n');fs.writeFileSync(review,JSON.stringify(proof,null,2)+'\n');}
 else{assert.deepEqual(JSON.parse(fs.readFileSync(output,'utf8')),after);assert.deepEqual(JSON.parse(fs.readFileSync(review,'utf8')),proof);}
 console.log(JSON.stringify({files:proof.records.length,bindings:proof.records.reduce((n,r)=>n+r.after.length,0),passed:true}));
}
