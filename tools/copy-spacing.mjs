import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ts=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('typescript');
export function copyNodes(file,code){
 const scriptKind=/\.tsx$/.test(file)?ts.ScriptKind.TSX:/\.jsx$/.test(file)?ts.ScriptKind.JSX:/\.js$/.test(file)?ts.ScriptKind.JS:ts.ScriptKind.TS;
 const ast=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,scriptKind),nodes=[],ordinals=new Map();
 const visit=node=>{
  if(ts.isJsxText(node)||ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node)){
   const start=node.getStart(ast),end=node.getEnd(),line=ast.getLineAndCharacterOfPosition(start).line+1,kind=ts.SyntaxKind[node.kind];
   const key=line+':'+kind,ordinal=ordinals.get(key)||0;ordinals.set(key,ordinal+1);
   nodes.push({start,end,line,kind,ordinal,raw:code.slice(start,end)});
  }
  ts.forEachChild(node,visit);
 };visit(ast);return nodes;
}
export function normalizeCopy(raw,terms){return terms.reduce((text,{from,to})=>text.replaceAll(from,to),raw);}
export function termsForFile(terms,product,file){return terms.filter(term=>(!term.products||term.products.includes(product))&&(!term.paths||term.paths.includes(file)));}
export async function formatProductCopy(base,file,code){
 const require=createRequire(path.join(base,'package.json')),prettier=require('prettier'),full=path.join(base,file);
 const config=await prettier.resolveConfig(full)??{};
 const plugins=config.plugins?.map(plugin=>typeof plugin==='string'?require.resolve(plugin):plugin);
 return prettier.format(code,{...config,...(plugins?{plugins}:{}),filepath:full});
}
export function relocateCopyBindings(file,before,after,bindings){
 const oldNodes=copyNodes(file,before),newNodes=copyNodes(file,after);
 if(oldNodes.length!==newNodes.length||oldNodes.some((node,i)=>node.kind!==newNodes[i].kind||node.raw!==newNodes[i].raw))throw Error('Formatting changed authored literal content: '+file);
 return bindings.map(binding=>{
  const index=oldNodes.findIndex(node=>node.line===binding.line&&node.kind===binding.kind&&node.ordinal===binding.ordinal&&node.raw===binding.emitted);
  if(index<0)throw Error('Cannot relocate changed copy binding: '+file+':'+binding.line);
  const node=newNodes[index];return {...binding,line:node.line,kind:node.kind,ordinal:node.ordinal};
 });
}
export function applyBindings(file,code,bindings,terms){
 const nodes=copyNodes(file,code),changes=[],used=new Set();
 for(const binding of bindings){
  const node=nodes.find(n=>n.line===binding.line&&n.kind===binding.kind&&n.ordinal===binding.ordinal);
  if(!node||node.raw!==binding.emitted)throw Error('Copy binding changed outside Q-Design: '+file+':'+binding.line);
  used.add(node.start);const emitted=normalizeCopy(binding.original,terms);
  if(node.raw!==emitted)changes.push({...node,emitted,original:binding.original});
 }
 for(const node of nodes)if(!used.has(node.start)){
  const emitted=normalizeCopy(node.raw,terms);
  if(emitted!==node.raw)changes.push({...node,emitted,original:node.raw});
 }
 let after=code;
 for(const change of [...changes].sort((a,b)=>b.start-a.start))after=after.slice(0,change.start)+change.emitted+after.slice(change.end);
 return {after,changes};
}
function files(dir){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(['engine','__tests__','__fixtures__'].includes(e.name)||(e.name==='design'&&/(?:^|[\\/])lib$/.test(dir))?[]:files(path.join(dir,e.name))):/\.[jt]sx?$/.test(e.name)&&! /\.(?:test|spec)\./.test(e.name)?[path.join(dir,e.name)]:[]);}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);if(args.length!==1||!['--write','--check'].includes(args[0]))throw Error('Use --write or --check.');
 const rules=JSON.parse(fs.readFileSync(root+'/patterns/copy-rules.json','utf8'));
 for(const term of rules.terms)if(!term.from||!term.to||/[\r\n"'`$\\]/.test(term.to))throw Error('Copy terms must be plain single-line text.');
 const out=root+'/dist/q-design.copy-bindings.json';
 const prior=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')).files:[],records=[],baselines=[],pending=[];
 for(const [product,repo] of [['atelier','Q-Atelier'],['maison','Q-Works'],['carnet','DHR']]){
  const base=path.resolve(root,'..',repo);
  for(const full of ['app','components','lib'].flatMap(dir=>files(path.join(base,dir)))){
   const file=path.relative(base,full).replaceAll('\\','/'),before=fs.readFileSync(full,'utf8'),old=prior.find(row=>row.product===product&&row.path===file);
   let {after,changes}=applyBindings(file,before,old?.bindings??[],termsForFile(rules.terms,product,file));
   if(!changes.length&&!old)continue;
   const bindings=[...(old?.bindings??[])];
   for(const change of changes){
    const binding={line:change.line,kind:change.kind,ordinal:change.ordinal,original:change.original,emitted:change.emitted};
    const index=bindings.findIndex(row=>row.line===binding.line&&row.kind===binding.kind&&row.ordinal===binding.ordinal);
    if(index<0)bindings.push(binding);else bindings[index]=binding;
   }
   if(changes.length){
    const formatted=await formatProductCopy(base,file,after);
    bindings.splice(0,bindings.length,...relocateCopyBindings(file,after,formatted,bindings));
    after=formatted;
   }
   records.push({product,path:file,bindings});
   if(changes.length){pending.push({product,path:file,count:changes.length});baselines.push({product,repo,path:file,before,after,beforeHash:hash(before),afterHash:hash(after),changes});}
  }
 }
 if(args[0]==='--check'){
  if(pending.length)throw Error('Unsynchronized authored copy: '+JSON.stringify(pending));
  console.log('Authored copy rules passed: '+records.length+' files.');
 }else{
  for(const record of baselines)fs.writeFileSync(path.resolve(root,'..',record.repo,record.path),record.after);
  fs.writeFileSync(out,JSON.stringify({version:1,rules:'patterns/copy-rules.json',files:records},null,2)+'\n');
  if(baselines.length){
   fs.writeFileSync(path.resolve(root,'../tmp/qd-copy-spacing-baselines.json'),JSON.stringify(baselines,null,2)+'\n');
   fs.writeFileSync(root+'/reviews/copy-spacing-migration.json',JSON.stringify({scope:rules.scope,files:baselines.map(({before,after,changes,...record})=>({...record,changes:changes.map(({start,end,...change})=>change)}))},null,2)+'\n');
  }
  console.log(JSON.stringify({files:baselines.length,phrases:baselines.reduce((sum,row)=>sum+row.changes.length,0)}));
 }
}
