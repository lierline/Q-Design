// Independently reviewed residual CSS fragments in runtime template literals.
// Dynamic coordinates, data percentages and safe-area zero fallbacks stay in place.
import fs from 'node:fs';
import path from 'node:path';
import {hash} from './style-arguments-core.mjs';
const ROOT=path.resolve(import.meta.dirname,'..'),QA=path.resolve(ROOT,'../Q-Atelier');
const input=JSON.parse(fs.readFileSync(ROOT+'/reviews/atelier-style-decisions.json','utf8'));
const definitions={'--qd-atelier-shadow-ink':'#000000','--qd-atelier-shadow-small-geometry':'0 6px 20px','--qd-atelier-shadow-side-geometry':'-8px 0 24px','--qd-atelier-shadow-large-geometry':'0 12px 40px','--qd-atelier-shadow-menu-geometry':'0 8px 24px'};
const source=new Map(),records=new Map();
for(const r of input.records){
 if(r.decision!=='unknown'||r.kind!=='object-property'||!r.value.includes('`')||r.path==='lib/design/tokens.ts')continue;
 let after=r.value;
 if(['border','borderTop','borderBottom','outline'].includes(r.property))after=after.replace(/1px solid /g,'var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ');
 if(r.property==='padding'){
   const spacing={2:'0-5',6:'1-5',14:'3-5',18:'4-5',32:'8'};
   after=after.replace(/\b(2|6|14|18|32)px\b/g,(_,n)=>'var(--qd-space-'+spacing[n]+')');
   after=after.replace(/ \+ 1px\)/g,' + var(--qd-border-width))');
 }
 if(r.property==='boxShadow'){
   after=after.replace(/0 0 0 1px/g,'0 0 0 var(--qd-border-width)').replace(/0 0 0 2px/g,'0 0 0 var(--qd-border-width-2)').replace(/0 0 0 3px/g,'0 0 0 var(--qd-space-0-75)');
   for(const[before,token]of [['0 6px 20px','--qd-atelier-shadow-small-geometry'],['-8px 0 24px','--qd-atelier-shadow-side-geometry'],['0 12px 40px','--qd-atelier-shadow-large-geometry'],['0 8px 24px','--qd-atelier-shadow-menu-geometry']])after=after.replace(before,'var('+token+')');
   after=after.replace(/alpha\('#000',/g,"alpha('var(--qd-atelier-shadow-ink)',");
 }
 if(r.property==='fontSize')after=after.replace('clamp(20px, 16cqw,','clamp(var(--qd-kpi-min-size), var(--qd-kpi-fluid-size),');
 if(after===r.value)continue;
 const code=source.get(r.path)??fs.readFileSync(QA+'/'+r.path,'utf8'),start=code.indexOf(r.value);if(start<0)throw Error('stale fragment '+r.path+':'+r.line);
 if(!records.has(r.path))records.set(r.path,{path:r.path,beforeHash:hash(code),edits:[]});
 records.get(r.path).edits.push({start,before:r.value,after,role:r.property});source.set(r.path,code.slice(0,start)+after+code.slice(start+r.value.length));
}
const output=[...records.values()].map(r=>({...r,afterHash:hash(source.get(r.path))}));
console.log({files:output.length,edits:output.reduce((n,r)=>n+r.edits.length,0)});
if(process.argv.includes('--write')){
 const manifest=ROOT+'/reviews/atelier-template-fragments-migration.json';if(fs.existsSync(manifest))throw Error('Historical evidence already recorded');
 fs.writeFileSync(manifest,JSON.stringify({version:1,records:output,definitions},null,2)+'\n');
 fs.appendFileSync(ROOT+'/patterns/foundation/atelier-core-values.css','\n/* Reviewed runtime template fragments; data values remain caller-owned. */\n:root {\n'+Object.entries(definitions).map(([k,v])=>`  ${k}: ${v};`).join('\n')+'\n}\n');
 for(const[file,code]of source)fs.writeFileSync(QA+'/'+file,code);
}
