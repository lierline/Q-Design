// A leaf transport proof never approves its parent expression or a fallback.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {dimensionTargets} from './atelier-dimension-flow-review.mjs';
import {colorTargets} from './atelier-color-flow-review.mjs';

const core='lib/design/components.tsx';
export const parameterTargets=[...dimensionTargets.filter(t=>t[1]!=='ListToolbar').map(t=>t.slice(0,3)),...colorTargets,
 ...[['IconBtn','size'],['ProgressBar','height'],['ProgressBar','trackColor'],['Checkbox','size'],['Skeleton','w'],['Skeleton','h'],['Skeleton','radius'],['SkeletonPanel','height'],['Card','minHeight'],['Tag','color'],['Grid','gap'],['Grid','minCol'],['Grid','cols']].map(t=>[core,...t]),
 ['components/Skeleton.tsx','Skeleton','width'],['components/Skeleton.tsx','Skeleton','height'],
 [core,'Reveal','style'],[core,'Panel','style'],
 ['components/TimeSeriesChart.tsx','TimeSeriesChart','height'],
 // These exact renderers and consumers were inspected together. Every caller
 // value is still independently inventoried, and any escape invalidates proof.
 ...[['Collapse','durationMs'],['Collapse','style'],['IconBtn','style'],['Bx','style'],['Card','style'],['InfoBox','style'],['InfoBox','color'],['Alert','style'],['NextStep','style'],['LegalNote','style'],['KpiGrid','style'],['Modal','maxWidth'],['StatGrid','minCol']].map(t=>[core,...t])];

export function parameterLeaves(ts,checker,fn,binding,sf){
 const symbol=checker.getSymbolAtLocation(binding.name),leaves=[];
 const visit=n=>{if(ts.isIdentifier(n)&&checker.getSymbolAtLocation(n)===symbol){
  const p=n.parent;if((ts.isPropertyAccessExpression(p)&&p.name===n)||(ts.isPropertyAssignment(p)&&p.name===n)||ts.isBindingElement(p))return;
  leaves.push({start:n.getStart(sf),end:n.end,text:n.text,line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1});
 }ts.forEachChild(n,visit);};visit(fn.body);return leaves;
}
export function createParameterLeafReview(product='D:/Claude/Q-Atelier'){
 const root=path.resolve(product,'../Q-Design'),ts=createRequire(path.join(product,'package.json'))('typescript');
 const files=runtimeFiles(product).filter(p=>/\.[jt]sx?$/.test(p)),texts=new Map(files.map(p=>[p,fs.readFileSync(path.join(product,p),'utf8')]));
 const cfg=ts.readConfigFile(path.join(product,'tsconfig.json'),ts.sys.readFile),opts=ts.parseJsonConfigFileContent(cfg.config,ts.sys,product);
 const program=ts.createProgram(files.map(p=>path.join(product,p)),{...opts.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const main=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-style-decisions.json'),'utf8')),byFile=new Map();
 for(const row of main.records){const a=byFile.get(row.path)??[];a.push(row);byFile.set(row.path,a);}
 const line=(sf,n)=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
 const resolved=n=>{let s=checker.getSymbolAtLocation(n);while(s?.flags&ts.SymbolFlags.Alias)s=checker.getAliasedSymbol(s);return s;};
 const evidence=(file,at)=>({path:file,line:at,hash:hash(texts.get(file))});
 const flows=[],symbols=new Map();
 for(const [file,name,prop] of parameterTargets){
  const sf=program.getSourceFile(path.join(product,file)),functions=[];
  const seek=n=>{if((ts.isFunctionDeclaration(n)||ts.isFunctionExpression(n))&&n.name?.text===name)functions.push(n);ts.forEachChild(n,seek);};seek(sf);
  if(functions.length!==1)throw Error('Exact renderer missing '+file+'#'+name);
  const fn=functions[0],binding=fn.parameters.flatMap(p=>ts.isObjectBindingPattern(p.name)?p.name.elements:[]).find(e=>(e.propertyName??e.name).getText(sf)===prop);
  if(!binding||!ts.isIdentifier(binding.name))throw Error('Exact prop missing '+name+'.'+prop);
  let symbol=resolved(fn.name);
  if(ts.isFunctionExpression(fn)){if(!ts.isBinaryExpression(fn.parent))throw Error('Unknown namespace assignment');symbol=resolved(fn.parent.left);}
  const offset=texts.get(file).length-sf.text.length;if(offset!==0&&!(offset===1&&texts.get(file).charCodeAt(0)===65279))throw Error('Unexpected source normalization');
  const flow={path:file,component:name,prop,sourceHash:hash(texts.get(file)),declarationLine:line(sf,fn),binding:binding.getText(sf),defaultValue:binding.initializer?.getText(sf)??null,
   leaves:parameterLeaves(ts,checker,fn,binding,sf).map(n=>({...n,start:n.start+offset,end:n.end+offset})),callers:[],otherReferences:[]};
  flows.push(flow);const list=symbols.get(symbol)??[];list.push(flow);symbols.set(symbol,list);
 }
 for(const file of files){const sf=program.getSourceFile(path.join(product,file)),sourceHash=hash(texts.get(file));
  const visit=n=>{
   if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))for(const flow of symbols.get(resolved(n.tagName))??[]){
    const attrs=n.attributes.properties.filter(p=>ts.isJsxAttribute(p)&&p.name.getText(sf)===flow.prop),spreads=n.attributes.properties.filter(ts.isJsxSpreadAttribute);
    if(attrs.length>1)throw Error('Duplicate prop');const attr=attrs[0],at=attr?line(sf,attr):null,value=attr?.initializer?.getText(sf)??null;
    const matches=attr?(byFile.get(file)??[]).filter(r=>r.sourceHash===sourceHash&&r.line===at&&r.property===flow.prop&&r.value===value):[];
    flow.callers.push({path:file,line:line(sf,n),sourceHash,attributeLine:at,value,argumentHashes:matches.map(r=>r.argumentHash),jsxSpreads:spreads.map(p=>p.expression.getText(sf))});
   }
   if(ts.isIdentifier(n)||ts.isPropertyAccessExpression(n))for(const flow of symbols.get(resolved(n))??[]){const p=n.parent;
    const ignored=((ts.isFunctionDeclaration(p)||ts.isFunctionExpression(p))&&p.name===n)||ts.isImportSpecifier(p)||ts.isImportClause(p)||ts.isExportSpecifier(p)||ts.isJsxOpeningElement(p)||ts.isJsxSelfClosingElement(p)||ts.isJsxClosingElement(p)||(ts.isBinaryExpression(p)&&p.left===n)||(ts.isPropertyAccessExpression(p)&&p.name===n);
    if(!ignored)flow.otherReferences.push({path:file,line:line(sf,n),consumer:p.getText(sf)});
   }ts.forEachChild(n,visit);
  };visit(sf);
 }
 for(const flow of flows){
  flow.evidence=[...new Map([evidence(flow.path,flow.declarationLine),...flow.callers.map(c=>evidence(c.path,c.attributeLine??c.line)),...flow.otherReferences.map(c=>evidence(c.path,c.line))].map(e=>[JSON.stringify(e),e])).values()];
  flow.unindexed=flow.callers.filter(c=>c.value&&!c.argumentHashes.length);
  flow.unresolvedSpreads=flow.callers.filter(c=>c.jsxSpreads.length);
  // A namespace reference is a symbol container, not a direct invocation. All
  // other non-JSX consumers must be inspected before transport can be proven.
  flow.unresolvedReferences=flow.otherReferences.filter(c=>!/^Skeleton\.(?:Row|Card|KPIGrid|PageHd|Table)$/.test(c.consumer));
 }
 return {version:1,scope:'Only exact lexical prop leaves are delegated. Every fallback, arithmetic factor, default and caller value remains an independent candidate; this is not a renderer-wide approval.',flows};
}
export function verifiedParameterLeaves(flow,currentHash){
 if(!flow?.leaves?.length||currentHash(flow.path)!==flow.sourceHash||flow.unindexed?.length||flow.unresolvedSpreads?.length||flow.unresolvedReferences?.length)return null;
 if(!flow.evidence?.length||flow.evidence.some(e=>currentHash(e.path)!==e.hash||!Number.isInteger(e.line)))return null;
 return flow.leaves.map(leaf=>({...leaf,proof:{central:false,evidence:flow.evidence.map(e=>({...e,delegatedReview:true}))}}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createParameterLeafReview();fs.writeFileSync('D:/Claude/Q-Design/reviews/atelier-parameter-leaves-review.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({flows:report.flows.length,leaves:report.flows.reduce((n,f)=>n+f.leaves.length,0),problems:report.flows.filter(f=>f.unindexed.length||f.unresolvedSpreads.length||f.unresolvedReferences.length).map(f=>({component:f.component,prop:f.prop,unindexed:f.unindexed,spreads:f.unresolvedSpreads,references:f.unresolvedReferences}))},null,2));
}
