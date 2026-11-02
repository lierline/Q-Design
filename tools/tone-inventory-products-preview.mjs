// Discovery only. Live scanners, source files and decisions remain untouched.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {PARTS} from './sync-parts.mjs';
import {centralOutputs} from './audit-coverage-core.mjs';
const root='D:/Claude/Q-Design';
const before=fs.readFileSync(root+'/tools/style-arguments-core.mjs','utf8');
const needle="'connectorColor', 'chipColor', 'iconColor', 'dotColor']);";
assert.equal(before.split(needle).length,2);
const proposed=before.replace(needle,"'connectorColor', 'chipColor', 'iconColor', 'dotColor', 'tone']);");
const load=code=>import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const base=await load(before),next=await load(proposed),products=[];
const require=createRequire('D:/Claude/Q-Atelier/package.json'),ts=require('typescript'),postcss=require('postcss');
for(const [name,folder] of [['atelier','Q-Atelier'],['maison','Q-Works'],['carnet','DHR']]){
 const product='D:/Claude/'+folder;
 const properties=base.cssProperties(ts,fs.readFileSync(path.join(path.dirname(require.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
 const copies=new Map(centralOutputs(PARTS,name==='atelier'?'Q-Atelier':name==='maison'?'Q-Works':'Q-Forge',product).map(p=>[p.path,p]));
 const files=[],added=[];
 for(const file of base.runtimeFiles(product)){
  const code=fs.readFileSync(product+'/'+file,'utf8'),options={ts,postcss,properties,owner:copies.get(file)?.src};
  const prior=base.scanArguments(file,code,options),current=next.scanArguments(file,code,options),keys=new Set(prior.map(a=>base.hash(JSON.stringify(a))));
  assert.deepEqual(current.filter(a=>keys.has(base.hash(JSON.stringify(a)))),prior,'Earlier complete arguments must remain unchanged: '+name+'/'+file);
  const additions=current.filter(a=>!keys.has(base.hash(JSON.stringify(a))));
  if(additions.length){files.push({path:file,sourceHash:base.hash(code),before:prior.length,after:current.length});added.push(...additions.map(a=>({path:file,sourceHash:base.hash(code),argumentHash:base.hash(JSON.stringify(a)),...a})));}
 }
 products.push({name,files,added});
}
const result={scope:'Proposed missing tone coverage only. Added candidates are neither accepted decisions nor changes to the live inventory.',beforeScannerHash:base.hash(before),proposedScannerHash:base.hash(proposed),products};
fs.writeFileSync(root+'/reviews/tone-inventory-products-preview.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(products.map(p=>({product:p.name,files:p.files.length,newArguments:p.added.length}))));
