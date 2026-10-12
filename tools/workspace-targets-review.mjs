import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {PARTS} from './sync-parts.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
import {composeWorkspace,buildWorkspace} from './build-workspace.mjs';
import {beforeRemainingFields} from './maison-remaining-field-ledger.mjs';
import {beforeHeadingIconBoundaries} from './atelier-heading-icon-boundaries.mjs';
const root='D:/Claude/Q-Design',ref='99ca89e66f0505502d54f5937d175c85b377ece4';
const products={atelier:['Q-Atelier','Q-Atelier'],maison:['Q-Works','Q-Works'],carnet:['DHR','Q-Forge']};
const oldReport=product=>JSON.parse(execFileSync('git',['show',ref+':reviews/'+product+'-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));
const req=createRequire(root+'/../Q-Works/package.json'),ts=req('typescript'),postcss=req('postcss'),properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
import path from 'node:path';
export function inspectWorkspaceTargets(){
 const original=execFileSync('git',['show',ref+':patterns/workspace.css'],{cwd:root,encoding:'utf8'}),actual=fs.readFileSync(root+'/patterns/workspace.css','utf8');assert.equal(hash(actual),hash(original),'Existing workspace design changed');
 const targets=fs.readFileSync(root+'/patterns/action-targets.css','utf8');assert.equal(targets.replaceAll('\r\n','\n'),'/* Short text actions keep the shared control target, including cancel links. */\n.qd-text-action { min-width: var(--qd-control-height); }\n/* A legacy focus reset must not change the shared control shape. */\n.qd-text-action:focus-visible { border-radius: var(--qd-radius) !important; }\n','Only shared minimum-width and focused-radius rules are reviewed');
 const output=buildWorkspace({check:true});assert.equal(output,composeWorkspace(original,targets));const part=PARTS.find(p=>p.src==='dist/q-design.workspace.css');assert(part);
 const sources=[];for(const[product,[repo,key]]of Object.entries(products)){const file=part.to[key],copy=fs.readFileSync(file,'utf8');assert.equal(file,'D:/Claude/'+repo+'/app/q-design.workspace.css');assert.deepEqual(copyProblems(part,output,copy),[]);sources.push({product,path:file,hash:hash(copy)});}
 return {output,sources};
}
export function beforeWorkspaceTargets(current){
 current=beforeHeadingIconBoundaries(current);
 current=beforeRemainingFields(current);
 const product=current.product;assert(products[product]);const old=oldReport(product),file='app/q-design.workspace.css',oldHash=old.fileHashes.find(f=>f.path===file).hash;
 // Existing history layers still validate every older report independently.
 if(current.fileHashes.find(f=>f.path===file)?.hash===oldHash)return current;
 const {output,sources}=inspectWorkspaceTargets(),actualHash=sources.find(s=>s.product===product).hash,copy=fs.readFileSync(sources.find(s=>s.product===product).path,'utf8'),args=scanArguments(file,copy,{ts,postcss,properties,owner:'dist/q-design.workspace.css'}),oldRows=old.records.filter(r=>r.path===file),newRows=current.records.filter(r=>r.path===file);assert.equal(args.length,oldRows.length+2);assert.equal(newRows.length,args.length);
 for(const[i,r]of newRows.entries()){
  for(const[k,v]of Object.entries(args[i]))assert.deepEqual(r[k],v);assert.equal(r.sourceHash,actualHash);assert.equal(r.decision,'central-source-verified');assert.equal(r.ruleId,'central-copy');assert.deepEqual(r.evidence,[{path:'dist/q-design.workspace.css',line:1,...(product==='carnet'?{}:{hash:hash(output)})}]);
  const computed=product==='atelier'?hash(JSON.stringify(args[i])):hash(JSON.stringify([file,r.line,r.kind,r.property,r.value]));assert.equal(r.argumentHash,computed);
  if(i<oldRows.length){const prev=oldRows[i],restored={...r,sourceHash:prev.sourceHash,argumentHash:prev.argumentHash,owner:prev.owner,evidence:prev.evidence};assert.deepEqual(restored,prev,'Existing workspace argument changed');}
  else{assert.equal(r.kind,'css-declaration');if(i===oldRows.length){assert.equal(r.property,'min-width');assert.equal(r.value,'var(--qd-control-height)');assert.equal(r.context,'stylesheet .qd-text-action');}else{assert.equal(r.property,'border-radius');assert.equal(r.value,'var(--qd-radius)');assert.equal(r.context,'stylesheet .qd-text-action:focus-visible');}}
 }
 const inverse=structuredClone(current);let inserted=0,at=0;inverse.records=[];for(const r of current.records){if(r.path===file){if(at<oldRows.length)inverse.records.push(oldRows[at++]);else inserted++;}else inverse.records.push(r);}assert.equal(inserted,2);
 assert.equal(current.counts['central-source-verified'],old.counts['central-source-verified']+2);inverse.counts={...current.counts,'central-source-verified':old.counts['central-source-verified']};inverse.fileHashes=current.fileHashes.map(f=>f.path===file?(assert.equal(f.hash,actualHash),{...f,hash:oldHash}):f);if('generatedAt' in old)inverse.generatedAt=old.generatedAt;
 if(product==='atelier'){
  const at=inverse.records.findIndex(r=>r.path==='app/globals.css'&&r.line===3&&r.kind==='css-at-rule'&&r.value==="'./q-design.workspace.css'");assert(at>=0);const previous=old.records.find(r=>r.path==='app/globals.css'&&r.line===3&&r.kind==='css-at-rule');assert.deepEqual(inverse.records[at].evidence,[previous.evidence[0],{path:'dist/q-design.workspace.css',line:1,hash:hash(output)}]);assert.deepEqual({...inverse.records[at],evidence:previous.evidence},previous);inverse.records[at]=previous;
 }
 if(product==='carnet'){
  const glyph=JSON.parse(fs.readFileSync(root+'/reviews/choice-glyph-revalidation.json','utf8')).sources.find(s=>s.key==='Q-Forge'),part=PARTS.find(p=>p.src==='patterns/components.css'),code=fs.readFileSync(part.to['Q-Forge'],'utf8');assert.equal(hash(code),glyph.afterHash);assert.equal(old.fileHashes.find(f=>f.path==='app/q-design.components.css').hash,glyph.beforeHash);assert.deepEqual(copyProblems(part,fs.readFileSync(root+'/'+part.src,'utf8'),code),[]);
  assert.equal(inverse.records.length,old.records.length);let dimensions=0;for(const[i,row]of inverse.records.entries()){if(row.path!=='app/q-design.components.css')continue;const previous=old.records[i];assert.equal(row.sourceHash,glyph.afterHash);const restored={...row,sourceHash:previous.sourceHash};if(row.value!==previous.value){assert.equal(row.kind,'css-declaration');assert(['width','height'].includes(row.property));assert(['stylesheet .qd-checkbox','stylesheet .qd-checkbox-mark','stylesheet .qd-checkbox-icon'].includes(row.context));assert.equal(row.value,previous.value==='16px'?'var(--qd-choice-glyph-size)':'calc(var(--qd-choice-glyph-size) * .75)');assert(['16px','12px'].includes(previous.value));assert.equal(row.argumentHash,hash(JSON.stringify([row.path,row.line,row.kind,row.property,row.value])));restored.value=previous.value;restored.argumentHash=previous.argumentHash;dimensions++;}assert.deepEqual(restored,previous,'Unreviewed Carnet component change');inverse.records[i]=previous;}assert.equal(dimensions,6);inverse.fileHashes=inverse.fileHashes.map(f=>f.path==='app/q-design.components.css'?(assert.equal(f.hash,glyph.afterHash),{...f,hash:glyph.beforeHash}):f);
 }
 assert.deepEqual(inverse,old,'Unrelated source, decision, evidence or count changed');return old;
}
