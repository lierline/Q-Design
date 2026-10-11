// Exact color transport. Every supplied value and default remains a separate candidate.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {collectAdapterReferences,importedReference,sourceImports} from './atelier-style-proof.mjs';

export const colorTargets=[
 ['lib/design/components.tsx','ProgressBar','color'],
 ['lib/design/components.tsx','Switch','color'],
 ['lib/design/components.tsx','Checkbox','accent'],
 ['lib/design/components.tsx','EntityCardHeader','badgeColor'],
 ['lib/design/components.tsx','Card','color'],
 ['lib/design/components.tsx','KPI','color'],
 ['lib/design/components.tsx','TooltipRow','dotColor'],
 ['lib/design/components.tsx','CardFigure','color'],
 ['lib/design/components.tsx','ProgressRing','trackColor'],
 ['lib/design/components.tsx','Stat','color'],
 ['lib/design/segmented-choice.tsx','ChoiceCheck','color'],
 ['lib/design/segmented-choice.tsx','ChoiceChip','color'],
];
const colorProperties=new Set(['color','background','backgroundColor','borderColor','accentColor','fill','stroke']);

export function proveColorTransport({ts,checker,node,sf,binding,central,seen=new Set()}){
 const target=checker.getSymbolAtLocation(binding.name);
 const walk=(n,visited)=>{
  if(ts.isParenthesizedExpression(n)||ts.isAsExpression(n))return walk(n.expression,visited);
  if(ts.isIdentifier(n)){
   const symbol=checker.getSymbolAtLocation(n);
   if(symbol===target)return {delegated:true,evidence:[]};
   const decls=symbol?.declarations??[];
   if(decls.length!==1||!ts.isVariableDeclaration(decls[0])||!ts.isVariableDeclarationList(decls[0].parent)||!(decls[0].parent.flags&ts.NodeFlags.Const)||!decls[0].initializer||visited.has(decls[0]))return null;
   const next=new Set(visited);next.add(decls[0]);return walk(decls[0].initializer,next);
  }
  if(ts.isPropertyAccessExpression(n)){
   const evidence=central(n);return evidence?{delegated:false,evidence}:null;
  }
  if(ts.isConditionalExpression(n)){
   const a=walk(n.whenTrue,visited),b=walk(n.whenFalse,visited);
   return a&&b?{delegated:a.delegated||b.delegated,evidence:[...a.evidence,...b.evidence]}:null;
  }
  if(ts.isBinaryExpression(n)&&[ts.SyntaxKind.QuestionQuestionToken,ts.SyntaxKind.BarBarToken].includes(n.operatorToken.kind)){
   const a=walk(n.left,visited),b=walk(n.right,visited);
   return a&&b?{delegated:a.delegated||b.delegated,evidence:[...a.evidence,...b.evidence]}:null;
  }
  // Raw colors, string templates, transformations and fallback functions need
  // their own proof. A delegated branch never hides an unverified other branch.
  return null;
 };
 const proof=walk(node,seen);return proof?.delegated?proof:null;
}

export function createColorFlowReview(product=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../Q-Atelier')){
 const root=path.resolve(product,'../Q-Design'),req=createRequire(path.join(product,'package.json')),ts=req('typescript'),postcss=req('postcss');
 const files=runtimeFiles(product).filter(p=>/\.[jt]sx?$/.test(p)),texts=new Map(files.map(p=>[p,fs.readFileSync(path.join(product,p),'utf8')]));
 const cfg=ts.readConfigFile(path.join(product,'tsconfig.json'),ts.sys.readFile),opts=ts.parseJsonConfigFileContent(cfg.config,ts.sys,product);
 const program=ts.createProgram(files.map(p=>path.join(product,p)),{...opts.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const main=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-style-decisions.json'),'utf8')),byFile=new Map();
 for(const record of main.records){const rows=byFile.get(record.path)??[];rows.push(record);byFile.set(record.path,rows);}
 const variables=new Map();
 for(const file of ['patterns/foundation.css','patterns/foundation/atelier.css','patterns/foundation/atelier-values.css','patterns/foundation/atelier-core-values.css','patterns/components.css','dist/q-design.palette.atelier.css']){
  const code=fs.readFileSync(path.join(root,file),'utf8');postcss.parse(code).walkDecls(d=>{if(d.prop.startsWith('--')&&!variables.has(d.prop))variables.set(d.prop,{path:file,line:d.source.start.line,hash:hash(code),variable:d.prop});});
 }
 const refs=collectAdapterReferences({ts,files:new Map([['lib/design/tokens.ts',texts.get('lib/design/tokens.ts')]]),variables,hash});
 const line=(sf,n)=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
 const resolved=n=>{let symbol=checker.getSymbolAtLocation(n);while(symbol?.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);return symbol;};
 const ev=(file,at)=>({path:file,line:at,hash:hash(texts.get(file))});
 const flows=[],symbols=new Map();
 for(const [file,name,prop] of colorTargets){
  const sf=program.getSourceFile(path.join(product,file)),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  if(!fn)throw Error('Missing exact renderer '+file+'#'+name);
  const binding=fn.parameters.flatMap(p=>ts.isObjectBindingPattern(p.name)?p.name.elements:[]).find(e=>(e.propertyName??e.name).getText(sf)===prop);
  if(!binding||!ts.isIdentifier(binding.name))throw Error('Missing color prop '+name+'.'+prop);
  const imports=sourceImports(ts,sf),outputs=[];
  const central=n=>{
   if(!ts.isIdentifier(n.expression))return null;
   const symbol=checker.getSymbolAtLocation(n.expression),declarations=symbol?.declarations??[];
   if(declarations.length!==1||!ts.isImportSpecifier(declarations[0]))return null;
   return importedReference(n.getText(sf),imports,file,refs);
  };
  const visit=n=>{
   let value,kind,property;
   if(ts.isJsxAttribute(n)&&colorProperties.has(n.name.getText(sf))&&n.initializer&&ts.isJsxExpression(n.initializer)&&n.initializer.expression){value=n.initializer.expression;kind='presentation-attribute';property=n.name.getText(sf);}
   if(ts.isPropertyAssignment(n)&&colorProperties.has(n.name.getText(sf))){
    let parent=n.parent;while(parent&&!ts.isJsxAttribute(parent)&&!ts.isStatement(parent))parent=parent.parent;
    if(parent&&ts.isJsxAttribute(parent)&&parent.name.getText(sf)==='style'){value=n.initializer;kind='object-property';property=n.name.getText(sf);}
   }
   if(value){const proof=proveColorTransport({ts,checker,node:value,sf,binding,central});if(proof)outputs.push({line:line(sf,n),kind,property,value:kind==='presentation-attribute'?n.initializer.getText(sf):value.getText(sf),evidence:proof.evidence});}
   ts.forEachChild(n,visit);
  };visit(fn.body);
  if(!outputs.length)throw Error('No reviewed color transport '+name+'.'+prop);
  const first=line(sf,fn),last=sf.getLineAndCharacterOfPosition(fn.end).line+1;
  const flow={path:file,component:name,prop,sourceHash:hash(texts.get(file)),declarationLine:first,binding:binding.getText(sf),outputs,callers:[],otherReferences:[],independentBodyArguments:(byFile.get(file)??[]).filter(r=>r.line>=first&&r.line<=last).map(r=>({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,kind:r.kind,property:r.property}))};
  flows.push(flow);const known=symbols.get(resolved(fn.name))??[];known.push(flow);symbols.set(resolved(fn.name),known);
 }
 for(const file of files){const sf=program.getSourceFile(path.join(product,file)),fileHash=hash(texts.get(file));
  const visit=n=>{
   if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))for(const flow of symbols.get(resolved(n.tagName))??[]){
    const attrs=n.attributes.properties.filter(p=>ts.isJsxAttribute(p)&&p.name.getText(sf)===flow.prop),spreads=n.attributes.properties.filter(ts.isJsxSpreadAttribute);
    if(attrs.length>1)throw Error('Duplicate color prop');const attr=attrs[0],at=attr?line(sf,attr):null,value=attr?.initializer?.getText(sf)??null;
    const matches=attr?(byFile.get(file)??[]).filter(r=>r.sourceHash===fileHash&&r.line===at&&r.property===flow.prop&&r.value===value):[];
    flow.callers.push({path:file,line:line(sf,n),sourceHash:fileHash,tag:n.tagName.getText(sf),attributeLine:at,value,argumentHashes:matches.map(r=>r.argumentHash),jsxSpreads:spreads.map(p=>({line:line(sf,p),value:p.expression.getText(sf)}))});
   }
   if(ts.isIdentifier(n))for(const flow of symbols.get(resolved(n))??[]){
    const p=n.parent,ignored=(ts.isFunctionDeclaration(p)&&p.name===n)||ts.isImportSpecifier(p)||ts.isImportClause(p)||ts.isExportSpecifier(p)||ts.isJsxOpeningElement(p)||ts.isJsxSelfClosingElement(p)||ts.isJsxClosingElement(p);
    if(!ignored)flow.otherReferences.push({path:file,line:line(sf,n),sourceHash:fileHash,consumer:p.getText(sf)});
   }
   ts.forEachChild(n,visit);
  };visit(sf);
 }
 const records=[];
 for(const flow of flows)for(const output of flow.outputs){
  const matches=(byFile.get(flow.path)??[]).filter(r=>r.kind===output.kind&&r.sourceHash===flow.sourceHash&&r.line===output.line&&r.property===output.property&&r.value===output.value);
  if(matches.length!==1)throw Error('Missing current exact color argument '+flow.path+':'+output.line);
  const r=matches[0],evidence=[ev(flow.path,flow.declarationLine),...output.evidence,...flow.callers.map(c=>ev(c.path,c.attributeLine??c.line)),...flow.otherReferences.map(c=>ev(c.path,c.line))];
  records.push({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,value:r.value,decision:'delegated-renderer-parameter',ruleId:'exact-color-forwarding',reason:'The exact lexical color parameter reaches this rendered color property. Any alternative branch is a verified central token. All actual symbol-resolved callers, defaults and remaining renderer arguments are separately inventoried; this record does not approve caller colors or full styles. Raw fallback colors and unverified transformations are rejected.',evidence:[...new Map(evidence.map(e=>[JSON.stringify(e),e])).values()],component:flow.component,prop:flow.prop});
 }
 return{version:1,scope:'Exact color transport plus verified central fallback only. No caller-value approval, property-name exemption or renderer-wide conformance claim.',records,flows};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createColorFlowReview();fs.writeFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../reviews/atelier-color-flow-review.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({records:report.records.length,flows:report.flows.length,callers:report.flows.reduce((n,f)=>n+f.callers.length,0),unindexed:report.flows.flatMap(f=>f.callers.filter(c=>c.value&&!c.argumentHashes.length).map(c=>({component:f.component,...c}))),spreads:report.flows.flatMap(f=>f.callers.filter(c=>c.jsxSpreads.length).map(c=>({component:f.component,...c}))),other:report.flows.flatMap(f=>f.otherReferences)},null,2));
}
