// Read-only preview. No scanner, product, decision or release input is modified.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {PARTS} from './sync-parts.mjs';import {centralOutputs} from './audit-coverage-core.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier';
const before=fs.readFileSync(root+'/tools/style-arguments-core.mjs','utf8');
const old="'connectorColor', 'chipColor', 'iconColor', 'dotColor']);",next="'connectorColor', 'chipColor', 'iconColor', 'dotColor', 'tone']);";
assert.equal(before.split(old).length,2);
const after=before.replace(old,next);
const load=code=>import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const base=await load(before),proposed=await load(after),require=createRequire(product+'/package.json'),ts=require('typescript'),postcss=require('postcss');
const properties=base.cssProperties(ts,fs.readFileSync(path.join(path.dirname(require.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const copies=new Map(centralOutputs(PARTS,'Q-Atelier',product).map(p=>[p.path,p]));
const files=[],added=[];
for(const file of base.runtimeFiles(product)){
  const code=fs.readFileSync(product+'/'+file,'utf8'),options={ts,postcss,properties,owner:copies.get(file)?.src};
  const prior=base.scanArguments(file,code,options),current=proposed.scanArguments(file,code,options),keys=new Set(prior.map(a=>base.hash(JSON.stringify(a))));
  assert.deepEqual(current.filter(a=>keys.has(base.hash(JSON.stringify(a)))),prior,'No earlier source argument may change');
  const additions=current.filter(a=>!keys.has(base.hash(JSON.stringify(a))));
  if(additions.length){files.push({path:file,sourceHash:base.hash(code),beforeArguments:prior.length,afterArguments:current.length});added.push(...additions.map(a=>({path:file,sourceHash:base.hash(code),argumentHash:base.hash(JSON.stringify(a)),...a})));}
}
fs.writeFileSync(root+'/reviews/tone-inventory-preview.json',JSON.stringify({scope:'Uncommitted read-only proposed scanner coverage. These records are discovered candidates, not approvals or live inventory changes.',beforeScannerHash:base.hash(before),proposedScannerHash:base.hash(after),files,added},null,2)+'\n');
console.log(JSON.stringify({affectedFiles:files.length,newArguments:added.length,kinds:added.reduce((out,r)=>(out[r.kind]=(out[r.kind]??0)+1,out),{})}));
