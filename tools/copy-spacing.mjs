import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {implementationOwners} from './build-component-implementations.mjs';
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
export function jsxDisplayText(raw){
 const code=ts.transpileModule('const view=<p>'+raw+'</p>;',{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const sf=ts.createSourceFile('jsx.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),values=[];
 const visit=n=>{if(ts.isCallExpression(n)&&n.expression.getText(sf)==='React.createElement'){
  if(n.arguments.length!==3||!ts.isStringLiteral(n.arguments[2]))throw Error('Expected one literal JSX text child');
  values.push(n.arguments[2].text);
 }ts.forEachChild(n,visit);};visit(sf);
 if(values.length!==1)throw Error('Expected one JSX text element');return values[0];
}
export function termsForFile(terms,product,file){return terms.filter(term=>(!term.products||term.products.includes(product))&&(!term.paths||term.paths.includes(file)));}
// moduleBase: prettier 와 그 플러그인을 빌려 올 폴더(기본은 제품 자신). 설정 파일은 base 쪽에서 찾습니다.
// 시험은 설정을 고정 자료(tools/fixtures/copy-spacing)에서 읽고 모듈만 제품에서 빌립니다.
export async function formatProductCopy(base,file,code,moduleBase=base){
 const require=createRequire(path.join(moduleBase,'package.json')),full=path.join(base,file);
 let formatter;
 try{formatter=require.resolve('prettier');}catch(error){
  // A product without this formatter keeps its existing source layout. Only
  // reviewed AST literals are replaced; plugin/configuration errors still fail.
  if(error.code==='MODULE_NOT_FOUND')return code;
  throw error;
 }
 const prettier=require(formatter);
 const config=await prettier.resolveConfig(full)??{};
 const plugins=config.plugins?.map(plugin=>typeof plugin==='string'?require.resolve(plugin):plugin);
 return prettier.format(code,{...config,...(plugins?{plugins}:{}),filepath:full});
}
export function relocateCopyBindings(file,before,after,bindings){
 const oldNodes=copyNodes(file,before),newNodes=copyNodes(file,after);
 if(oldNodes.length!==newNodes.length||oldNodes.some((node,i)=>node.kind!==newNodes[i].kind||(node.raw!==newNodes[i].raw&&(node.kind!=='JsxText'||jsxDisplayText(node.raw)!==jsxDisplayText(newNodes[i].raw)))))throw Error('Formatting changed authored literal content: '+file);
 return bindings.map(binding=>{
  const index=oldNodes.findIndex(node=>node.line===binding.line&&node.kind===binding.kind&&node.ordinal===binding.ordinal&&node.raw===binding.emitted);
  if(index<0)throw Error('Cannot relocate changed copy binding: '+file+':'+binding.line);
  const node=newNodes[index];return {...binding,line:node.line,kind:node.kind,ordinal:node.ordinal,emitted:node.raw};
 });
}
export function applyBindings(file,code,bindings,terms){
 const nodes=copyNodes(file,code),changes=[],used=new Set();
 for(const binding of bindings){
  const node=nodes.find(n=>n.line===binding.line&&n.kind===binding.kind&&n.ordinal===binding.ordinal);
  if(!node||node.raw!==binding.emitted)throw Error('Copy binding changed outside Q-Design: '+file+':'+binding.line);
  used.add(node.start);const emitted=normalizeCopy(binding.original,terms);
  if(node.raw!==emitted&&(node.kind!=='JsxText'||jsxDisplayText(node.raw)!==jsxDisplayText(emitted)))changes.push({...node,emitted,original:binding.original});
 }
 for(const node of nodes)if(!used.has(node.start)){
  const emitted=normalizeCopy(node.raw,terms);
  if(emitted!==node.raw)changes.push({...node,emitted,original:node.raw});
 }
 let after=code;
 for(const change of [...changes].sort((a,b)=>b.start-a.start))after=after.slice(0,change.start)+change.emitted+after.slice(change.end);
 return {after,changes};
}
// kind 를 주면 그 갈래의 줄만 바꿉니다. 'canonical' 은 Q-Design 정본 파일, 'product' 는 제품 파일입니다.
// 다른 갈래의 줄은 앞 기록 그대로 둡니다(그 파일은 아직 쓰지 않았으므로 연결도 옛 값이 맞습니다).
export function mergeCopyBindings(prior,records,selected,kind){
 const ofKind=row=>!kind||(kind==='canonical')===Boolean(row.canonical);
 const byKey=new Map(records.filter(ofKind).map(r=>[r.product+':'+r.path,r])),merged=[],seen=new Set();
 for(const row of prior){
  const key=row.product+':'+row.path;
  if(byKey.has(key)){if(!seen.has(key)){merged.push(byKey.get(key));seen.add(key);}}
  else if(!selected.includes(row.product)||!ofKind(row))merged.push(row);
 }
 for(const [key,row] of byKey)if(!seen.has(key))merged.push(row);
 return merged;
}
function files(dir){if(!fs.existsSync(dir))return [];return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?(['engine','__tests__','__fixtures__'].includes(e.name)||(e.name==='design'&&/(?:^|[\\/])lib$/.test(dir))?[]:files(path.join(dir,e.name))):/\.[jt]sx?$/.test(e.name)&&! /\.(?:test|spec)\./.test(e.name)?[path.join(dir,e.name)]:[]);}
export function copySourceFiles(base,product,owners=new Map()){
 const explicit=[...owners.keys()].filter(key=>key.startsWith(product+':')).map(key=>path.join(base,key.slice(product.length+1)));
 return [...new Set([...['app','components','lib'].flatMap(dir=>files(path.join(base,dir))),...explicit])];
}
// 2026-10-16(군살 빼기 결정 3): 제품 파일은 동기화(extract-all --sync)에서만 씁니다.
//   --write           Q-Design 정본 파일과 그 연결만 씁니다(만들기 걸음). 제품에 갈 문구는 세어 알리기만 합니다
//   --write-products  제품 파일과 그 연결만 씁니다(extract-all --sync 의 내보내기 걸음)
//   --check           둘 다 보고, 맞추지 않은 문구가 있으면 실패합니다(제품 코드 전체를 훑는 감사)
//   --check-canon     Q-Design 이 가진 정본 구현 파일만 봅니다. 제품 저장소를 읽지 않습니다.
//                     늘 초록이어야 하는 검사(check.mjs)가 씁니다(2026-10-16 · 군살 빼기 4단계)
// 예전 --write 는 만들기만 돌려도 제품 저장소 파일을 직접 고쳐, 사본 동기화와 다른 두 번째 내보내기 길이었습니다.
const MODES=['--write','--write-products','--check','--check-canon'];
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),mode=args.filter(a=>MODES.includes(a)),filters=args.filter(a=>a.startsWith('--only='));
 if(mode.length!==1||filters.length>1||args.some(a=>!MODES.includes(a)&&!a.startsWith('--only=')))throw Error('Use --write, --write-products, --check or --check-canon and optional --only=atelier,maison,carnet.');
 const selected=filters.length?filters[0].slice(7).split(','):['atelier','maison','carnet'];
 if(!selected.length||new Set(selected).size!==selected.length||selected.some(p=>!['atelier','maison','carnet'].includes(p)))throw Error('Unknown or duplicate product scope.');
 const rules=JSON.parse(fs.readFileSync(root+'/patterns/copy-rules.current.json','utf8'));
 const terms=[...rules.terms];
 for(const file of rules.additionalRuleFiles??[]){
  if(!/^patterns\/[a-z0-9-]+\.json$/.test(file))throw Error('Invalid copy rule file: '+file);
  const extra=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  if(extra.version!==1||!Array.isArray(extra.terms))throw Error('Invalid additional copy rules: '+file);
  terms.push(...extra.terms);
 }
 const owners=fs.existsSync(root+'/patterns/component-implementations.json')?implementationOwners(root):new Map();
 for(const term of terms)if(!term.from||!term.to||/[\r\n"'`$\\]/.test(term.to))throw Error('Copy terms must be plain single-line text.');
 const out=root+'/dist/q-design.copy-bindings.current.json';
 const prior=fs.existsSync(out)?JSON.parse(fs.readFileSync(out,'utf8')).files:[],records=[],baselines=[],pending=[];let scanned=0;
 for(const [product,repo] of [['atelier','Q-Atelier'],['maison','Q-Works'],['carnet','DHR']]){
  if(!selected.includes(product))continue;
  const base=path.resolve(root,'..',repo);
  const canonOnly=mode[0]==='--check-canon';
  for(const full of canonOnly?[...owners.keys()].filter(key=>key.startsWith(product+':')).map(key=>path.join(base,key.slice(product.length+1))):copySourceFiles(base,product,owners)){
   scanned++;
   const file=path.relative(base,full).replaceAll('\\','/'),canonical=owners.get(product+':'+file),before=fs.readFileSync(canonical?path.join(root,canonical):full,'utf8'),old=prior.find(row=>row.product===product&&row.path===file);
   let {after,changes}=applyBindings(file,before,old?.bindings??[],termsForFile(terms,product,file));
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
   records.push({product,path:file,bindings,...(canonical?{canonical}:{})});
   if(changes.length){pending.push({product,path:file,count:changes.length,...(canonical?{canonical}:{})});baselines.push({product,repo,path:file,before,after,beforeHash:hash(before),afterHash:hash(after),changes,...(canonical?{canonical}:{})});}
  }
 }
 if(mode[0]==='--check'||mode[0]==='--check-canon'){
  if(pending.length)throw Error('Unsynchronized authored copy: '+JSON.stringify(pending));
  console.log((mode[0]==='--check-canon'?'정본 구현 파일 ':'')+'Authored copy rules passed: '+records.length+' bound / '+scanned+' scanned files. Scope: '+selected.join(', '));
 }else{
  const kind=mode[0]==='--write'?'canonical':'product';
  const mine=baselines.filter(row=>(kind==='canonical')===Boolean(row.canonical));
  for(const record of mine)fs.writeFileSync(record.canonical?path.join(root,record.canonical):path.resolve(root,'..',record.repo,record.path),record.after);
  const merged=mergeCopyBindings(prior,records,selected,kind);
  fs.writeFileSync(out,JSON.stringify({version:1,rules:'patterns/copy-rules.current.json',files:merged},null,2)+'\n');
  // 2026-10-16: 옮기기 기록(reviews/ · ../tmp) 쓰기를 뺐습니다. 아무도 읽지 않았습니다.
  const waiting=kind==='canonical'?baselines.length-mine.length:0;
  console.log(JSON.stringify({files:mine.length,phrases:mine.reduce((sum,row)=>sum+row.changes.length,0),...(waiting?{productFilesForSync:waiting}:{})}));
 }
}
