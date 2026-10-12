// Symbol-bound forwarding boundaries only. Defaults and caller values remain independent.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';

export const dimensionTargets=[
 ['components/Avatar.tsx','Avatar','size',['width','height']],
 ['components/Logo.tsx','Logo','size',['width','height']],
 ['components/Logo.tsx','LogoMark','size',['width','height']],
 ['components/Sidebar.tsx','ChevronIcon','size',['size']],
 ['components/Sidebar.tsx','MenuIcon','size',['size']],
 ['components/Skeleton.tsx','SkeletonRow','lastWidth',['width'],'Skeleton.Row'],
 ['components/Skeleton.tsx','SkeletonCard','height',['height'],'Skeleton.Card'],
 ['lib/design/components.tsx','Panel','height',['height']],
 ['lib/design/components.tsx','DataTable','minWidth',['minWidth']],
 ['lib/design/components.tsx','ProgressRing','size',['width','height']],
 ['lib/design/components.tsx','ProgressRing','stroke',['strokeWidth']],
 ['components/ListToolbar.tsx','ListToolbar','size',['size']],
];

export function dimensionForward(ts,checker,attribute,sf,binding,component){
 if(!ts.isJsxAttribute(attribute)||!ts.isJsxExpression(attribute.initializer)||!attribute.initializer.expression)return false;
 const expr=attribute.initializer.expression;
 const exact=n=>ts.isIdentifier(n)&&checker.getSymbolAtLocation(n)===checker.getSymbolAtLocation(binding.name);
 if(exact(expr))return true;
 // Only this inspected line/last-line selection is a forwarding boundary. The
 // condition and fallback have independent records; this does not approve them.
 return component==='SkeletonRow'&&ts.isConditionalExpression(expr)&&exact(expr.whenTrue)&&
   ts.isStringLiteral(expr.whenFalse)&&expr.whenFalse.text==='var(--qd-atelier-skeleton-width-100)'&&
   expr.condition.getText(sf)==='i === count - 1 && count > 1';
}

export function createDimensionFlowReview(product=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../Q-Atelier')){
 const root=path.resolve(product,'../Q-Design'),ts=createRequire(path.join(product,'package.json'))('typescript');
 const files=runtimeFiles(product).filter(p=>/\.[jt]sx?$/.test(p)),texts=new Map(files.map(p=>[p,fs.readFileSync(path.join(product,p),'utf8')]));
 const cfg=ts.readConfigFile(path.join(product,'tsconfig.json'),ts.sys.readFile),opts=ts.parseJsonConfigFileContent(cfg.config,ts.sys,product);
 const program=ts.createProgram(files.map(p=>path.join(product,p)),{...opts.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const main=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-style-decisions.json'),'utf8')),byFile=new Map();
 for(const r of main.records){const a=byFile.get(r.path)??[];a.push(r);byFile.set(r.path,a);}
 const line=(sf,n)=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
 const resolved=n=>{let s=checker.getSymbolAtLocation(n);while(s?.flags&ts.SymbolFlags.Alias)s=checker.getAliasedSymbol(s);return s;};
 const ev=(file,at)=>({path:file,line:at,hash:hash(texts.get(file))});
 const flows=[],symbols=new Map();
 for(const [file,name,prop,attributes,assignment] of dimensionTargets){
  const sf=program.getSourceFile(path.join(product,file)),functions=[];
  const seek=n=>{if((ts.isFunctionDeclaration(n)||ts.isFunctionExpression(n))&&n.name?.text===name)functions.push(n);ts.forEachChild(n,seek);};seek(sf);
  if(functions.length!==1)throw Error('Exact function missing '+file+'#'+name);
  const fn=functions[0],binding=fn.parameters.flatMap(p=>ts.isObjectBindingPattern(p.name)?p.name.elements:[]).find(e=>(e.propertyName??e.name).getText(sf)===prop);
  if(!binding||!ts.isIdentifier(binding.name))throw Error('Missing destructured prop '+name+'.'+prop);
  const outputs=[];
  const visit=n=>{if(ts.isJsxAttribute(n)&&attributes.includes(n.name.getText(sf))&&dimensionForward(ts,checker,n,sf,binding,name))outputs.push({line:line(sf,n),property:n.name.getText(sf),value:n.initializer.getText(sf),consumer:n.parent.parent.tagName.getText(sf)});ts.forEachChild(n,visit);};visit(fn.body);
  if(!outputs.length)throw Error('No reviewed dimension forwarding '+name);
  let symbol=resolved(fn.name);
  if(assignment){if(!ts.isBinaryExpression(fn.parent)||fn.parent.left.getText(sf)!==assignment)throw Error('Missing member assignment '+assignment);symbol=resolved(fn.parent.left);}
  const first=line(sf,fn),last=sf.getLineAndCharacterOfPosition(fn.end).line+1;
  const flow={path:file,component:name,prop,sourceHash:hash(texts.get(file)),declarationLine:first,binding:binding.getText(sf),outputs,callers:[],otherReferences:[],independentBodyArguments:(byFile.get(file)??[]).filter(r=>r.line>=first&&r.line<=last).map(r=>({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,kind:r.kind,property:r.property}))};
  flows.push(flow);const known=symbols.get(symbol)??[];known.push(flow);symbols.set(symbol,known);
 }
 for(const file of files){const sf=program.getSourceFile(path.join(product,file)),fileHash=hash(texts.get(file));
  const visit=n=>{
   if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
    for(const flow of symbols.get(resolved(n.tagName))??[]){const attrs=n.attributes.properties.filter(p=>ts.isJsxAttribute(p)&&p.name.getText(sf)===flow.prop),spreads=n.attributes.properties.filter(ts.isJsxSpreadAttribute);
     if(attrs.length>1)throw Error('Duplicate dimension prop');
     const attr=attrs[0],at=attr?line(sf,attr):null,value=attr?.initializer?.getText(sf)??null;
     const matches=attr?(byFile.get(file)??[]).filter(r=>r.sourceHash===fileHash&&r.line===at&&r.property===flow.prop&&r.value===value):[];
     flow.callers.push({path:file,line:line(sf,n),sourceHash:fileHash,tag:n.tagName.getText(sf),attributeLine:at,value,argumentHashes:matches.map(r=>r.argumentHash),jsxSpreads:spreads.map(p=>({line:line(sf,p),value:p.expression.getText(sf)}))});
    }
   }
   if(ts.isIdentifier(n)||ts.isPropertyAccessExpression(n)){
    for(const flow of symbols.get(resolved(n))??[]){const p=n.parent;const ignored=((ts.isFunctionDeclaration(p)||ts.isFunctionExpression(p))&&p.name===n)||ts.isImportSpecifier(p)||ts.isImportClause(p)||ts.isExportSpecifier(p)||ts.isJsxOpeningElement(p)||ts.isJsxSelfClosingElement(p)||ts.isJsxClosingElement(p)||(ts.isBinaryExpression(p)&&p.left===n)||(ts.isPropertyAccessExpression(p)&&p.name===n);
     if(!ignored)flow.otherReferences.push({path:file,line:line(sf,n),sourceHash:fileHash,consumer:p.getText(sf)});
    }
   }
   ts.forEachChild(n,visit);
  };visit(sf);
 }
 const records=[];
 for(const flow of flows)for(const output of flow.outputs){
  const matches=(byFile.get(flow.path)??[]).filter(r=>r.kind==='presentation-attribute'&&r.sourceHash===flow.sourceHash&&r.line===output.line&&r.property===output.property&&r.value===output.value);
  if(matches.length!==1)throw Error('Missing current exact dimension argument '+flow.path+':'+output.line);
  const r=matches[0],pagination=flow.component==='ListToolbar';
  const evidence=[ev(flow.path,flow.declarationLine),...flow.callers.map(c=>ev(c.path,c.attributeLine??c.line)),...flow.otherReferences.map(c=>ev(c.path,c.line))];
  if(pagination){evidence.push(ev('components/ListPager.tsx',60),ev('lib/api/list-page.ts',87));}
  records.push({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,value:r.value,decision:pagination?'structural-behavior':'delegated-renderer-parameter',ruleId:'exact-dimension-forwarding',reason:pagination?'ListToolbar.size forwards the numeric records-per-page value to ListPager. pageCount and pageWindow use it for query pagination and range labels, not a CSS dimension.':'This exact lexical component parameter is forwarded to the shown native/renderer dimension attribute. Current symbol-resolved JSX callers, explicit argument hashes, defaults and the renderer body arguments remain independently inventoried. This approves transport only, not the central ownership of any default, caller value, conditional fallback or resulting style.',evidence:[...new Map(evidence.map(e=>[JSON.stringify(e),e])).values()],component:flow.component,prop:flow.prop,consumer:output.consumer});
 }
 return{version:1,scope:'Exact dimension transport boundaries only. Caller and default values are independent style candidates; no function-name, filename, numeric-value, or parameter-wide visual exemption.',records,flows};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const report=createDimensionFlowReview();fs.writeFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../reviews/atelier-dimension-flow-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({records:report.records.length,flows:report.flows.length,callers:report.flows.reduce((n,f)=>n+f.callers.length,0),unindexed:report.flows.flatMap(f=>f.callers.filter(c=>c.value&&!c.argumentHashes.length).map(c=>({component:f.component,...c}))),spreads:report.flows.flatMap(f=>f.callers.filter(c=>c.jsxSpreads.length).map(c=>({component:f.component,...c})))},null,2));}
