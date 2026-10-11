// Exact symbol-based prop flow. This inventories delegation, never approves caller styles.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';

export const reviewedStyleProps=[
 ['components/Avatar.tsx','Avatar','style'],
 ['components/FormNote.tsx','FormNote','style'],
 ['components/Logo.tsx','Logo','style'],['components/Logo.tsx','LogoMark','style'],
 ['components/ResearchChangeRequestsPanel.tsx','SubLabel','style'],
 ['components/Skeleton.tsx','Skeleton','style'],
 ...['In','Btn','IconBtn','Bx','Collapse','Card','InfoBox','Alert','Skeleton','Grid','NextStep','LegalNote','KpiGrid'].map(name=>['lib/design/components.tsx',name,'style']),
 ['lib/design/segmented-choice.tsx','ChoiceChip','style'],
 ['lib/design/segmented-choice.tsx','SegmentedChoice','style'],
 ['lib/design/segmented-choice.tsx','SegmentedChoice','itemStyle'],
];

export function collectStylePropFlows({ts,program,root,files,targets,argumentsByPath=new Map(),sourceTexts=new Map()}){
 const checker=program.getTypeChecker(),selected=new Map(),flows=[];
 const relative=file=>path.relative(root,file).replaceAll('\\','/');
 const sourceHash=sf=>{
  const raw=sourceTexts.get(relative(sf.fileName));
  if(raw===undefined)return hash(sf.text);
  if(hash(raw.replace(/^\uFEFF/,''))!==hash(sf.text.replace(/^\uFEFF/,'')))throw new Error('Source changed while resolving prop flow '+relative(sf.fileName));
  return hash(raw);
 };
 const line=(sf,node)=>sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1;
 const resolve=node=>{let symbol=checker.getSymbolAtLocation(node);const seen=new Set();while(symbol?.flags&ts.SymbolFlags.Alias){if(seen.has(symbol))break;seen.add(symbol);symbol=checker.getAliasedSymbol(symbol);}return symbol;};
 for(const [file,name,prop] of targets){
  const sf=program.getSourceFile(path.join(root,file));if(!sf)throw new Error('Missing renderer '+file);
  const declarations=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  if(declarations.length!==1)throw new Error('Renderer identity is ambiguous '+file+'#'+name);
  const fn=declarations[0],bindings=fn.parameters.flatMap(p=>ts.isObjectBindingPattern(p.name)?p.name.elements:[]).filter(e=>(e.propertyName??e.name).getText(sf)===prop);
  if(bindings.length!==1||!ts.isIdentifier(bindings[0].name))throw new Error('Missing exact destructured prop '+file+'#'+name+'.'+prop);
  const binding=bindings[0],bindingSymbol=resolve(binding.name),spreads=[];
  const visit=n=>{if(ts.isSpreadAssignment(n)&&ts.isIdentifier(n.expression)&&resolve(n.expression)===bindingSymbol){let attribute=n.parent;while(attribute&&!ts.isJsxAttribute(attribute))attribute=attribute.parent;if(!attribute||attribute.name.getText(sf)!=='style')throw new Error('Prop spread has a non-style consumer');spreads.push({line:line(sf,n),value:n.expression.getText(sf),styleLine:line(sf,attribute),consumer:attribute.getText(sf)});}ts.forEachChild(n,visit);};visit(fn.body);
  if(!spreads.length)throw new Error('No exact style consumer '+file+'#'+name+'.'+prop);
  const flow={path:file,component:name,prop,sourceHash:sourceHash(sf),declarationLine:line(sf,fn),binding:binding.getText(sf),spreads,callers:[],otherReferences:[]};
  flows.push(flow);const symbol=resolve(fn.name),list=selected.get(symbol)??[];list.push(flow);selected.set(symbol,list);
 }
 for(const file of files){
  const sf=program.getSourceFile(path.join(root,file));if(!sf)continue;
  const fileHash=sourceHash(sf),sourceArguments=argumentsByPath.get(file)??[];
  const visit=n=>{
   if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
    const consumers=selected.get(resolve(n.tagName));
    for(const flow of consumers??[]){
     const props=n.attributes.properties,attr=props.filter(p=>ts.isJsxAttribute(p)&&p.name.getText(sf)===flow.prop),spreads=props.filter(ts.isJsxSpreadAttribute);
     if(attr.length>1)throw new Error('Duplicate style prop '+file+':'+line(sf,n));
     const value=attr[0]?.initializer?.getText(sf)??null,attributeLine=attr[0]?line(sf,attr[0]):null;
     const matches=attr[0]?sourceArguments.filter(r=>r.sourceHash===fileHash&&r.line===attributeLine&&r.property===flow.prop&&r.value===value):[];
     flow.callers.push({path:file,line:line(sf,n),sourceHash:fileHash,tag:n.tagName.getText(sf),attributeLine,value,argumentHashes:matches.map(r=>r.argumentHash),argumentKinds:matches.map(r=>r.kind),jsxSpreads:spreads.map(p=>({line:line(sf,p),value:p.expression.getText(sf)}))});
    }
   }
   if(ts.isIdentifier(n)){
    const consumers=selected.get(resolve(n));
    if(consumers){const p=n.parent;const ignored=(ts.isFunctionDeclaration(p)&&p.name===n)||ts.isImportSpecifier(p)||ts.isImportClause(p)||ts.isExportSpecifier(p)||ts.isJsxOpeningElement(p)||ts.isJsxSelfClosingElement(p)||ts.isJsxClosingElement(p)||ts.isImportEqualsDeclaration(p);if(!ignored)for(const flow of consumers)flow.otherReferences.push({path:file,line:line(sf,n),sourceHash:fileHash,consumer:p.getText(sf)});}
   }
   ts.forEachChild(n,visit);
  };visit(sf);
 }
 return flows;
}

export function createProductFlowReport(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../Q-Atelier')){
 const qd=path.resolve(root,'../Q-Design'),ts=createRequire(path.join(root,'package.json'))('typescript');
 const config=ts.readConfigFile(path.join(root,'tsconfig.json'),ts.sys.readFile);if(config.error)throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText,' '));
 const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
 const files=runtimeFiles(root).filter(file=>/\.[jt]sx?$/.test(file));
 const program=ts.createProgram(files.map(file=>path.join(root,file)),{...parsed.options,noEmit:true,incremental:false});
 const review=JSON.parse(fs.readFileSync(path.join(qd,'reviews/atelier-style-decisions.json'),'utf8'));
 const argumentsByPath=new Map();for(const r of review.records){const a=argumentsByPath.get(r.path)??[];a.push(r);argumentsByPath.set(r.path,a);}
 const sourceTexts=new Map(files.map(file=>[file,fs.readFileSync(path.join(root,file),'utf8')]));
 const flows=collectStylePropFlows({ts,program,root,files,targets:reviewedStyleProps,argumentsByPath,sourceTexts});
 const records=[];
 for(const flow of flows)for(const spread of flow.spreads){
  const args=(argumentsByPath.get(flow.path)??[]).filter(r=>r.kind==='object-spread'&&r.line===spread.line&&r.value===spread.value&&r.sourceHash===flow.sourceHash);
  if(args.length!==1)throw new Error('Current argument ledger must include exact spread '+flow.path+':'+spread.line);
  const evidence=[{path:flow.path,line:flow.declarationLine,hash:flow.sourceHash},...flow.callers.map(c=>({path:c.path,line:c.attributeLine??c.line,hash:c.sourceHash})),...flow.otherReferences.map(c=>({path:c.path,line:c.line,hash:c.sourceHash}))];
  records.push({path:flow.path,line:spread.line,sourceHash:flow.sourceHash,argumentHash:args[0].argumentHash,value:spread.value,decision:'delegated-renderer-parameter',ruleId:'exact-style-prop-flow',reason:'Exact destructured CSS style prop is consumed by a JSX style object. All current symbol-resolved JSX callers and other value references are separately inventoried. This classifies delegation only; caller expressions and any spread-prop payload require independent review and are not approved by this record.',evidence:[...new Map(evidence.map(e=>[JSON.stringify(e),e])).values()],component:flow.component,prop:flow.prop,consumer:spread.consumer});
 }
 return {version:1,scope:'Exact current symbol-based renderer prop delegation. No caller expression is approved by this catalog. New/changed caller inventories must be revalidated by the flow regression gate.',files:files.map(file=>({path:file,sourceHash:hash(fs.readFileSync(path.join(root,file),'utf8'))})),records,flows};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createProductFlowReport(),output=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../reviews/atelier-style-prop-flow-review.json');
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({renderers:report.flows.length,records:report.records.length,callers:report.flows.reduce((n,f)=>n+f.callers.length,0),styleValues:report.flows.reduce((n,f)=>n+f.callers.filter(c=>c.value).length,0),unindexedStyleValues:report.flows.flatMap(f=>f.callers.filter(c=>c.value&&!c.argumentHashes.length).map(c=>({component:f.component,prop:f.prop,...c}))),spreadProps:report.flows.flatMap(f=>f.callers.filter(c=>c.jsxSpreads.length).map(c=>({component:f.component,prop:f.prop,...c}))),otherReferences:report.flows.flatMap(f=>f.otherReferences.map(r=>({component:f.component,...r})))},null,2));
}
