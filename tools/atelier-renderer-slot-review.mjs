// Pagination data and renderer slots. Nested visual arguments retain independent review.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
export const reviewedSlotTargets=[
 ['lib/design/components.tsx','DataTable','columns','12be20a00007015db4df94338bd8a565b5361197868cdff4485b982ce24ace3a'],
 ['lib/design/components.tsx','EntityRow','right','b9a75ba584af6bace20ce504e7567910b0fc7988ec79cad9be045965d2e3b009'],
 ['components/ListPager.tsx','ListPager','page','77409781ff9a86ae779cf02c5fa5d8fd6bd7661baf8b508a10de2e8936813e18'],
 ['components/ListToolbar.tsx','ListToolbar','page','93059bfd7252340e1f4ccb3090a90bf78b1d08febdafa170aea2a3818939ced7'],
 ['components/TruncatedNote.tsx','TruncatedNote','page','5676cac4e3b491e1daa7fcf1d605697deded4c07bd85deafd7d8aee5e51f82be'],
];
export function slotBoundary(ts,checker,attribute,sf,targets){
 if(!ts.isJsxAttribute(attribute)||!attribute.initializer||!ts.isJsxExpression(attribute.initializer)||!attribute.initializer.expression)return null;
 let symbol=checker.getSymbolAtLocation(attribute.parent.parent.tagName);while(symbol?.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);
 const target=targets.get(symbol);if(!target||attribute.name.getText(sf)!==target.prop)return null;
 if(['ListPager','ListToolbar'].includes(target.name)){
  const type=checker.getTypeAtLocation(attribute.initializer.expression);
  if(!(type.flags&ts.TypeFlags.NumberLike))return null;
 }
 return target;
}
export function verifySlotBody(ts,fn,sf,expected){if(hash(ts.createPrinter({removeComments:true}).printNode(ts.EmitHint.Unspecified,fn,sf))!==expected)throw new Error('Renderer slot implementation requires renewed review '+fn.name.text);}
export function createRendererSlotReview(product=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../Q-Atelier')){
 const root=path.resolve(product,'../Q-Design'),ts=createRequire(path.join(product,'package.json'))('typescript');
 const files=runtimeFiles(product).filter(p=>/\.[jt]sx?$/.test(p)),texts=new Map(files.map(p=>[p,fs.readFileSync(path.join(product,p),'utf8')]));
 const cfg=ts.readConfigFile(path.join(product,'tsconfig.json'),ts.sys.readFile),opts=ts.parseJsonConfigFileContent(cfg.config,ts.sys,product),program=ts.createProgram(files.map(p=>path.join(product,p)),{...opts.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const rel=p=>path.relative(product,p).replaceAll('\\','/'),line=(sf,n)=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
 const evidence=(file,at)=>({path:file,line:at,hash:hash(texts.get(file))});
 const targets=new Map();
 for(const [file,name,prop,expected] of reviewedSlotTargets){const sf=program.getSourceFile(path.join(product,file)),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);if(!fn)throw new Error('Missing renderer '+name);verifySlotBody(ts,fn,sf,expected);targets.set(checker.getSymbolAtLocation(fn.name),{name,prop,file,line:line(sf,fn)});}
 const truncatedSF=program.getSourceFile(path.join(product,'components/TruncatedNote.tsx')),message=truncatedSF.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='truncatedMessage');
 verifySlotBody(ts,message,truncatedSF,'0fa6b4a117120358b4324018c95bed4bfa3314218082ffcad134cdb310a2a2fd');
 const main=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-style-decisions.json'),'utf8')),allByFile=new Map();for(const r of main.records){const rows=allByFile.get(r.path)??[];rows.push(r);allByFile.set(r.path,rows);}
 const records=[];
 for(const record of main.records.filter(r=>r.kind==='presentation-attribute'&&['page','columns','right'].includes(r.property))){
  const sf=program.getSourceFile(path.join(product,record.path));if(hash(texts.get(record.path))!==record.sourceHash)throw new Error('Caller source changed '+record.path);
  const matches=[];const visit=n=>{if(ts.isJsxAttribute(n)&&n.name.getText(sf)===record.property&&n.initializer?.getText(sf)===record.value&&line(sf,n)===record.line)matches.push(n);ts.forEachChild(n,visit);};visit(sf);
  const matched=matches.map(n=>slotBoundary(ts,checker,n,sf,targets));if(!matched.some(Boolean))continue;
  if(matches.length!==1||matched.some(x=>!x))throw new Error('Ambiguous exact slot '+record.path+':'+record.line);
  const node=matches[0],target=matched[0],own=[evidence(record.path,record.line),evidence(target.file,target.line)],definitions=[],ranges=[{path:record.path,first:record.line,last:sf.getLineAndCharacterOfPosition(node.end).line+1}];
  const expr=node.initializer.expression;
  if(ts.isIdentifier(expr)||ts.isCallExpression(expr)){
   const symbol=checker.getSymbolAtLocation(ts.isCallExpression(expr)?expr.expression:expr);
   for(const d of symbol?.declarations??[]){const dsf=d.getSourceFile(),file=rel(dsf.fileName);if(!texts.has(file))continue;const first=line(dsf,d),last=dsf.getLineAndCharacterOfPosition(d.end).line+1;definitions.push({path:file,line:first,sourceHash:hash(texts.get(file)),kind:ts.SyntaxKind[d.kind],source:d.getText(dsf)});own.push(evidence(file,first));ranges.push({path:file,first,last});}
  }
  let reason,decision;
  if(target.name==='DataTable'){decision='delegated-renderer-parameter';reason='The exact DataTable.columns prop is an array of column contracts. The renderer builds tracks from c.width, renders c.header and calls c.render(row,index). This approves the argument transport boundary only. Every column width/alignment, callback JSX style and renderer padding is independently reviewed and is not approved here.';}
  else if(target.name==='EntityRow'){decision='delegated-renderer-parameter';reason='The exact EntityRow.right prop is a ReactNode slot, inserted as children of the trailing wrapper. It is not CSS right positioning. Its nested JSX/style arguments remain independent ledger records and receive no approval from this boundary.';}
  else if(target.name==='TruncatedNote'){decision='business-data';reason='The exact TruncatedNote.page prop is the picker response metadata consumed by truncatedMessage(total,truncated,limit), selecting and formatting truncation text. It does not set a page dimension or CSS declaration.';own.push(evidence(target.file,line(truncatedSF,message)),evidence('lib/api/list-page.ts',60));}
  else{decision='structural-behavior';reason='The exact '+target.name+'.page prop is numeric pagination state. pageWindow derives record-range text and ListPager uses it for query-string page navigation. ListToolbar forwards the same page to ListPager. The number is not a CSS page, visual length or typography rule.';own.push(evidence('lib/api/list-page.ts',87),evidence('components/ListPager.tsx',54));}
  const independentArguments=ranges.flatMap(range=>(allByFile.get(range.path)??[]).filter(r=>r.line>=range.first&&r.line<=range.last&&r.argumentHash!==record.argumentHash).map(r=>({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,kind:r.kind,property:r.property})));
  records.push({path:record.path,line:record.line,sourceHash:record.sourceHash,argumentHash:record.argumentHash,value:record.value,decision,ruleId:'exact-renderer-slot',reason,evidence:[...new Map(own.map(e=>[JSON.stringify(e),e])).values()],renderer:target.name,prop:target.prop,definitions,independentArguments:[...new Map(independentArguments.map(e=>[JSON.stringify(e),e])).values()]});
 }
 return {version:1,scope:'Exact pagination data and renderer slot boundaries. Nested width/style/callback arguments remain independently reviewed; this catalog does not approve any renderer as a whole.',records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const report=createRendererSlotReview();fs.writeFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../reviews/atelier-renderer-slot-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({records:report.records.length,counts:report.records.reduce((a,r)=>(a[r.renderer+'.'+r.prop]=(a[r.renderer+'.'+r.prop]??0)+1,a),{})},null,2));}
