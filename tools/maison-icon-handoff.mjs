import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runtimeFiles,hash} from './style-arguments-core.mjs';
import {implementationOwners} from './build-component-implementations.mjs';
import {formatProductCopy} from './copy-spacing.mjs';
import {beforeMaisonHandoffRoles} from './maison-handoff-roles.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works';
const ts=createRequire(repo+'/package.json')('typescript');
const proofPath=root+'/reviews/maison-icon-handoff-migration.json';
export const iconHandoffRef='d5a9c06a6b972cefffe3992b0a1f04000b2b0c7d';
export function migrateIconImports(file,code,mapping){
 const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 assert.equal(sf.parseDiagnostics.length,0,'Icon consumer must parse: '+file);
 const edits=[];
 for(const node of sf.statements){
  if(!ts.isImportDeclaration(node)||!ts.isStringLiteral(node.moduleSpecifier)||node.moduleSpecifier.text!=='lucide-react')continue;
  const clause=node.importClause;
  assert(clause&&!clause.name&&clause.namedBindings&&ts.isNamedImports(clause.namedBindings),'Only explicit named icon imports are reviewed');
  assert(!node.attributes,'Import attributes require separate review');
  const names=[],lines=[];
  for(const spec of clause.namedBindings.elements){
   const name=(spec.propertyName??spec.name).text;
   assert(name==='LucideIcon'||Object.hasOwn(mapping,name),'Unmapped icon '+name);
   const typeOnly=clause.isTypeOnly||spec.isTypeOnly;
   assert(name!=='LucideIcon'||typeOnly,'Icon slot must be imported as a type');
   const imported=(spec.propertyName?name+' as ':'')+spec.name.text;
   lines.push(`import ${typeOnly?'type ':''}{ ${imported} } from '@/components/q-design-icons/${name==='LucideIcon'?'_icon':name}';`);
   names.push({name,local:spec.name.text,typeOnly});
  }
  edits.push({start:node.getStart(sf),end:node.end,before:code.slice(node.getStart(sf),node.end),after:lines.join('\n'),names});
 }
 let after=code;
 for(const edit of [...edits].reverse())after=after.slice(0,edit.start)+edit.after+after.slice(edit.end);
 return {after,edits};
}
export function beforeMaisonIconSource(file,code){
 code=beforeMaisonHandoffRoles(file,code);
 if(!fs.existsSync(proofPath))return code;
 const record=JSON.parse(fs.readFileSync(proofPath,'utf8')).records.find(r=>r.path===file);
 if(!record||hash(code)===record.beforeHash)return code;
 assert.equal(hash(code),record.afterHash,'Icon migration source differs: '+file);
 const before=execFileSync('git',['show',iconHandoffRef+':'+file],{cwd:repo,encoding:'utf8'});
 assert.equal(hash(before),record.beforeHash,'Icon migration baseline differs');
 return before;
}
export async function syncMaisonIconHandoff({write=false,check=false}={}){
 assert(!(write&&check));
 if(write&&fs.existsSync(proofPath))return syncMaisonIconHandoff({check:true});
 const mapping=JSON.parse(fs.readFileSync(root+'/patterns/react-icons.json','utf8')),owners=implementationOwners(root);
 const files=runtimeFiles(repo).filter(f=>/\.tsx?$/.test(f)),prepared=[],used=new Set();
 for(const file of files){
  const current=fs.readFileSync(repo+'/'+file,'utf8');
  const baseline=check?beforeMaisonIconSource(file,current):current;
  const migrated=migrateIconImports(file,baseline,mapping);
  for(const match of migrated.after.matchAll(/@\/components\/q-design-icons\/([A-Z][A-Za-z0-9]*)/g))used.add(match[1]);
  if(!migrated.edits.length)continue;
  const before=execFileSync('git',['show',iconHandoffRef+':'+file],{cwd:repo,encoding:'utf8'});
  assert.equal(hash(baseline),hash(before),'Only pinned clean handoff source may be migrated: '+file);
  const after=await formatProductCopy(repo,file,migrated.after);
  const canonical=owners.get('maison:'+file);
  if(canonical)assert.equal(hash(fs.readFileSync(root+'/'+canonical,'utf8')),hash(check?after:before),'Owned primitive differs before icon sync');
  prepared.push({file,before,after,canonical,imports:migrated.edits.flatMap(e=>e.names)});
 }
 // Validate the entire plan and all generated modules before the first write.
 const modules=[...used].sort().map(name=>{
  assert(Object.hasOwn(mapping,name),'Unmapped existing product icon '+name);
  const source=root+'/dist/react-icons/'+name+'.tsx';assert(fs.existsSync(source),'Generate icon before sync: '+name);
  return {name,source,destination:repo+'/components/q-design-icons/'+name+'.tsx'};
 });
 const report={version:1,productRef:iconHandoffRef,scope:'Exact import-only migration to centrally generated Phosphor Regular icons. Local JSX identifiers, callback logic, business data and native icon props are preserved. No style argument is automatically approved.',records:prepared.map(p=>({path:p.file,beforeHash:hash(p.before),afterHash:hash(p.after),...(p.canonical?{canonical:p.canonical}:{}),imports:p.imports})),modules:modules.map(m=>({name:m.name,sourceHash:hash(fs.readFileSync(m.source,'utf8'))}))};
 if(check){
  assert.deepEqual(JSON.parse(fs.readFileSync(proofPath,'utf8')),report,'Icon migration evidence is stale');
  for(const p of prepared)assert.equal(hash(beforeMaisonHandoffRoles(p.file,fs.readFileSync(repo+'/'+p.file,'utf8'))),hash(p.after));
  for(const m of modules)assert.equal(hash(fs.readFileSync(m.destination,'utf8')),hash(fs.readFileSync(m.source,'utf8')),'Product icon differs from generated module: '+m.name);
 }else if(write){
  for(const p of prepared){if(p.canonical)fs.writeFileSync(root+'/'+p.canonical,p.after);fs.writeFileSync(repo+'/'+p.file,p.after);}
  for(const m of modules)if(!fs.existsSync(m.destination)||hash(fs.readFileSync(m.destination,'utf8'))!==hash(fs.readFileSync(m.source,'utf8')))fs.copyFileSync(m.source,m.destination);
  fs.writeFileSync(proofPath,JSON.stringify(report,null,2)+'\n');
 }
 return report;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);assert(args.every(a=>['--write','--check'].includes(a)));
 const result=await syncMaisonIconHandoff({write:args.includes('--write'),check:args.includes('--check')});
 console.log(JSON.stringify({files:result.records.length,imports:result.records.reduce((n,r)=>n+r.imports.length,0),modules:result.modules.length,mode:args[0]??'plan'}));
}
