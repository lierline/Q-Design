// Export centrally generated icon modules. Raw legacy imports require explicit migration review.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {runtimeFiles,hash} from './style-arguments-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const targets=[['Q-Atelier','Q-Atelier'],['Q-Works','Q-Works'],['Q-Forge','DHR']];
const ts=createRequire(root+'/../Q-Atelier/package.json')('typescript');
export function interfaceIconModules(file,code){
 const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 assert.equal(sf.parseDiagnostics.length,0,'Icon consumer must parse: '+file);
 const names=new Set();
 const inspect=n=>{
  let spec;
  if((ts.isImportDeclaration(n)||ts.isExportDeclaration(n))&&n.moduleSpecifier&&ts.isStringLiteral(n.moduleSpecifier))spec=n.moduleSpecifier.text;
  if(ts.isCallExpression(n)&&n.arguments.length===1&&ts.isStringLiteral(n.arguments[0])&&(n.expression.kind===ts.SyntaxKind.ImportKeyword||n.expression.getText(sf)==='require'))spec=n.arguments[0].text;
  if(spec){
   assert(spec!=='lucide-react'&&!spec.startsWith('lucide-react/'),'Legacy icon family needs migration review: '+file);
   if(spec.startsWith('@/components/q-design-icons/')){
    const name=spec.slice('@/components/q-design-icons/'.length);assert(/^(?:_icon|[A-Z][A-Za-z0-9]*)$/.test(name),'Invalid direct icon module');names.add(name);
   }
  }
  ts.forEachChild(n,inspect);
 };inspect(sf);return names;
}
export function syncReactIcons({write=false,only=null}={}){
 const mapping=JSON.parse(fs.readFileSync(root+'/patterns/react-icons.json','utf8')),prepared=[],reports=[];
 if(only)for(const key of only)assert(targets.some(([k])=>k===key),'Unknown icon product: '+key);
 for(const [key,repoName]of targets){
  if(only&&!only.has(key))continue;
  const repo=root+'/../'+repoName,names=new Set(['_icon']);let consumers=0;
  for(const file of runtimeFiles(repo).filter(f=>/\.tsx?$/.test(f))){
   const modules=interfaceIconModules(file,fs.readFileSync(repo+'/'+file,'utf8'));
   if(modules.size)consumers++;for(const name of modules)names.add(name);
  }
  for(const name of [...names].sort()){
   assert(name==='_icon'||Object.hasOwn(mapping,name),'Icon has no central mapping: '+name);
   const source=root+'/dist/react-icons/'+name+'.tsx',destination=repo+'/components/q-design-icons/'+name+'.tsx';
   assert(fs.existsSync(source),'Generate icon before export: '+name);
   const body=fs.readFileSync(source,'utf8');
   prepared.push({source,destination,body,drift:!fs.existsSync(destination)||hash(fs.readFileSync(destination,'utf8'))!==hash(body)});
  }
  const source=root+'/dist/react-icons/LICENSE',destination=repo+'/components/q-design-icons/LICENSE',body=fs.readFileSync(source,'utf8');
  prepared.push({source,destination,body,drift:!fs.existsSync(destination)||hash(fs.readFileSync(destination,'utf8'))!==hash(body)});
  reports.push({product:key,consumers,icons:names.size-1});
 }
 // Finish parsing all consumers and checking every mapping before writing anything.
 if(write)for(const p of prepared)if(p.drift)fs.writeFileSync(p.destination,p.body);
 for(const p of prepared)assert(fs.existsSync(p.destination)&&hash(fs.readFileSync(p.destination,'utf8'))===hash(p.body),'Shared icon drift: '+p.destination);
 return {products:reports,modules:prepared.length,updated:write?prepared.filter(p=>p.drift).length:0};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);assert(args.every(a=>['--write','--check'].includes(a)||a.startsWith('--only=')));
 assert(args.filter(a=>a.startsWith('--only=')).length<=1);
 const onlyArg=args.find(a=>a.startsWith('--only='));
 console.log(JSON.stringify(syncReactIcons({write:args.includes('--write'),only:onlyArg?new Set(onlyArg.slice(7).split(',')):null})));
}
