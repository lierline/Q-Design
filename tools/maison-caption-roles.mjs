import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {replaceClassLiterals,compile} from './maison-layout-tokens.mjs';
import {formatProductCopy} from './copy-spacing.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works',manifest=root+'/reviews/maison-caption-migration.json';
const files=[
 'app/(app)/inspections/receipt-dialog.tsx',
 'app/(app)/purchasing/analysis/delivery-tab.tsx',
 'app/(app)/purchasing/analysis/saving-register-dialog.tsx',
 'app/(app)/purchasing/analysis/savings-tab.tsx',
 'app/(app)/purchasing/specs/[id]/page.tsx',
 'app/(app)/safety/incidents/[id]/page.tsx',
 'app/(app)/specs/page.tsx',
 'app/(app)/traceability/[id]/page.tsx'
];
export const maisonCaptionClass='text-[length:var(--qd-caption-size)]';
export function beforeMaisonCaptionRoles(file,code){
 if(!fs.existsSync(manifest))return code;
 const record=JSON.parse(fs.readFileSync(manifest,'utf8')).records.find(r=>r.path===file);
 if(!record||hash(code)===record.beforeHash)return code;
 assert.equal(hash(code),record.afterHash,'Unreviewed change after caption migration: '+file);
 if(record.formatted){
  const before=execFileSync('git',['show','ba541d440070bec81b6bc92cfe44215b196ce3ce:'+file],{cwd:product,encoding:'utf8'});
  assert.equal(hash(before),record.beforeHash,'Pinned caption source must remain exact');return before;
 }
 const inverse=replaceClassLiterals(code,file,record.changes.map(c=>[c.after,c.before,record.afterHash,c.line]));
 assert.equal(inverse.count,record.literalCount);assert.equal(hash(inverse.code),record.beforeHash,'Only the reviewed caption literals may be restored');
 return inverse.code;
}
export async function verifyMaisonCaptionRoles(){
 const saved=JSON.parse(fs.readFileSync(manifest,'utf8'));
 assert.deepEqual(saved.paths,files);assert.equal(saved.role,'--qd-caption-size');
 const css=fs.readFileSync(root+'/patterns/components.css','utf8');assert.match(css,/--qd-caption-size:\s*[^;]+;/);
 const compiled=await compile([maisonCaptionClass]);assert.deepEqual(compiled.get(maisonCaptionClass),[['font-size','var(--qd-caption-size)']]);
 for(const record of saved.records){
  assert(files.includes(record.path));const code=fs.readFileSync(product+'/'+record.path,'utf8');
  const before=beforeMaisonCaptionRoles(record.path,code);
  const next=replaceClassLiterals(before,record.path,record.changes.map(c=>[c.before,c.after,record.beforeHash,c.line]));
  const expected=record.formatted?await formatProductCopy(product,record.path,next.code):next.code;
  assert.equal(hash(expected),hash(code));assert.equal(next.count,record.literalCount);
  assert(record.changes.every(c=>['text-[10px]','text-[11px]'].includes(c.before)&&c.after===maisonCaptionClass));
 }
 return saved;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 if(process.argv.includes('--format')){
  const saved=await verifyMaisonCaptionRoles(),writes=[];
  for(const record of saved.records){const code=fs.readFileSync(product+'/'+record.path,'utf8'),formatted=await formatProductCopy(product,record.path,code);writes.push([product+'/'+record.path,formatted]);record.literalAfterHash=record.afterHash;record.afterHash=hash(formatted);record.formatted=true;}
  for(const [file,code]of writes)fs.writeFileSync(file,code);fs.writeFileSync(manifest,JSON.stringify(saved,null,2)+'\n');
 }
 if(process.argv.includes('--write')){
  assert(!fs.existsSync(manifest),'Do not overwrite the reviewed source baseline');
  const report=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),records=[],writes=[];
  for(const file of files){
   const code=fs.readFileSync(product+'/'+file,'utf8'),sites=report.records.filter(r=>r.path===file&&r.kind==='class-utility'&&['text-[10px]','text-[11px]'].includes(r.value));
   assert(sites.length,'Reviewed caption site is absent: '+file);assert(sites.every(r=>r.sourceHash===hash(code)),'Stale caption source');
   const changes=sites.map(r=>({line:r.line,before:r.value,after:maisonCaptionClass}));
   const next=replaceClassLiterals(code,file,changes.map(c=>[c.before,c.after,hash(code),c.line]));
   records.push({path:file,beforeHash:hash(code),afterHash:hash(next.code),literalCount:next.count,changes});writes.push([product+'/'+file,next.code]);
  }
  const saved={version:1,role:'--qd-caption-size',paths:files,scope:'Reviewed secondary metadata, identifiers, hints and urgency captions share the central 12px caption role. Other font classes, data and business conditions are unchanged.',records};
  for(const [file,code]of writes)fs.writeFileSync(file,code);fs.writeFileSync(manifest,JSON.stringify(saved,null,2)+'\n');
 }
 const saved=await verifyMaisonCaptionRoles();console.log(JSON.stringify({files:saved.records.length,literals:saved.records.reduce((n,r)=>n+r.changes.length,0),role:saved.role}));
}
