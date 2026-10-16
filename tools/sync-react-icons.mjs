// Export centrally generated icon modules. Raw legacy imports require explicit migration review.
// 2026-10-16(군살 빼기 4단계): --copies 는 제품 코드를 훑지 않고, 제품에 이미 있는 아이콘 사본만
// dist/react-icons 와 대조합니다. 늘 초록이어야 하는 검사(check.mjs)가 이 모드를 씁니다.
// 어떤 아이콘이 필요한지 제품 코드에서 찾는 일은 --check(감사)와 --write(내보내기)에만 남깁니다.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {runtimeFiles,hash} from './style-arguments-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const targets=[['Q-Atelier','Q-Atelier'],['Q-Works','Q-Works'],['Q-Forge','DHR']];
let tsModule;const tsLib=()=>tsModule??=createRequire(root+'/../Q-Atelier/package.json')('typescript');
export function interfaceIconModules(file,code){
 const ts=tsLib();
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
export function syncReactIcons({write=false,only=null,copies=false}={}){
 assert(!(write&&copies),'--copies only compares existing copies');
 const mapping=JSON.parse(fs.readFileSync(root+'/patterns/react-icons.json','utf8')),prepared=[],reports=[];
 if(only)for(const key of only)assert(targets.some(([k])=>k===key),'Unknown icon product: '+key);
 for(const [key,repoName]of targets){
  if(only&&!only.has(key))continue;
  const repo=root+'/../'+repoName,names=new Set(['_icon']);let consumers=0;
  if(copies)for(const file of fs.readdirSync(repo+'/components/q-design-icons'))if(file.endsWith('.tsx'))names.add(file.slice(0,-4));
  for(const file of copies?[]:runtimeFiles(repo).filter(f=>/\.tsx?$/.test(f))){
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
  reports.push({product:key,...(copies?{}:{consumers}),icons:names.size-1});
 }
 // Finish parsing all consumers and checking every mapping before writing anything.
 if(write)for(const p of prepared)if(p.drift)fs.writeFileSync(p.destination,p.body);
 for(const p of prepared)assert(fs.existsSync(p.destination)&&hash(fs.readFileSync(p.destination,'utf8'))===hash(p.body),'Shared icon drift: '+p.destination);
 return {products:reports,modules:prepared.length,updated:write?prepared.filter(p=>p.drift).length:0};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);assert(args.every(a=>['--write','--check','--copies'].includes(a)||a.startsWith('--only=')));
 assert(args.filter(a=>a.startsWith('--only=')).length<=1);
 const onlyArg=args.find(a=>a.startsWith('--only='));
 console.log(JSON.stringify(syncReactIcons({write:args.includes('--write'),copies:args.includes('--copies'),only:onlyArg?new Set(onlyArg.slice(7).split(',')):null})));
}
