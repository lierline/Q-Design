// Widget width names are renderer parameters, not CSS widths or business-data exemptions.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {PARTS} from './sync-parts.mjs';
import {centralOutputs,copyProblems} from './audit-coverage-core.mjs';

export function widgetWidthBoundary({ts,checker,node,sf,boardWidthDeclaration,isItemsSink}){
 let value=node.initializer;while(ts.isAsExpression(value)||ts.isParenthesizedExpression(value))value=value.expression;
 if(!ts.isStringLiteral(value)||!['full','half','quarter'].includes(value.text)||!ts.isObjectLiteralExpression(node.parent))return null;
 const type=checker.getContextualType(node.parent);
 const declarations=type?checker.getPropertyOfType(type,'width')?.declarations??[]:[];
 const exactType=declarations.includes(boardWidthDeclaration);
 let attribute=node.parent;
 while(attribute&&!ts.isJsxAttribute(attribute))attribute=attribute.parent;
 const directItems=attribute?.name.getText(sf)==='items'&&isItemsSink(attribute.parent.parent.tagName);
 // Array spreads can discard contextual type. They still need an exact symbol-
 // resolved items sink, with no nested callback or property container escape.
 let container=node.parent,validContainer=true;
 if(directItems)while(container!==attribute){
  if(![ts.SyntaxKind.ObjectLiteralExpression,ts.SyntaxKind.ArrayLiteralExpression,ts.SyntaxKind.ConditionalExpression,ts.SyntaxKind.ParenthesizedExpression,ts.SyntaxKind.SpreadElement,ts.SyntaxKind.JsxExpression].includes(container.kind)){validContainer=false;break;}
  container=container.parent;
 }
 if(!exactType&&!(directItems&&validContainer))return null;
 return {value:value.text,exactType,directItems:Boolean(directItems&&validContainer),itemsLine:directItems?sf.getLineAndCharacterOfPosition(attribute.getStart(sf)).line+1:null};
}

export function createWidgetWidthReview(product=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../Q-Atelier')){
 const root=path.resolve(product,'../Q-Design'),req=createRequire(path.join(product,'package.json')),ts=req('typescript'),postcss=req('postcss');
 const files=runtimeFiles(product).filter(file=>/\.[jt]sx?$/.test(file)),raw=new Map(files.map(file=>[file,fs.readFileSync(path.join(product,file),'utf8')]));
 const config=ts.readConfigFile(path.join(product,'tsconfig.json'),ts.sys.readFile),parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,product);
 const program=ts.createProgram(files.map(file=>path.join(product,file)),{...parsed.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const resolve=node=>{let symbol=checker.getSymbolAtLocation(node);while(symbol?.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);return symbol;};
 const relative=file=>path.relative(product,file).replaceAll('\\','/');
 const line=(sf,node)=>sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1;
 const evidence=(file,at=1)=>({path:file,line:at,hash:hash(raw.get(file))});
 const boardFile='components/dashboard/CustomizableWidgetBoard.tsx',wrapperFile='components/PageWidgetBoard.tsx',dashboardFile='app/(app)/dashboard/page.tsx';
 const boardSF=program.getSourceFile(path.join(product,boardFile)),wrapperSF=program.getSourceFile(path.join(product,wrapperFile));
 const board=boardSF.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='CustomizableWidgetBoard'),wrapper=wrapperSF.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='PageWidgetBoard');
 const type=boardSF.statements.find(node=>ts.isInterfaceDeclaration(node)&&node.name.text==='BoardItem'),width=type?.members.find(node=>node.name?.getText(boardSF)==='width');
 if(!board||!wrapper||!width)throw new Error('Widget renderer contract changed');
 const sinks=new Set([resolve(board.name),resolve(wrapper.name)]),isItemsSink=name=>sinks.has(resolve(name));
 const central=[];const expected=new Map([
  ['--qd-atelier-widget-edit-quarter','calc(25% - var(--qd-space-4) * 3 / 4)'],
  ['--qd-atelier-widget-edit-half','calc(50% - var(--qd-space-4) / 2)'],
  ['--qd-atelier-widget-quarter','calc(25% - var(--qd-space-3) * 3 / 4)'],
  ['--qd-atelier-widget-half','calc(50% - var(--qd-space-3) / 2)'],
 ]);
 for(const file of ['patterns/foundation.css','patterns/foundation/atelier-core-values.css']){
  const code=fs.readFileSync(path.join(root,file),'utf8');postcss.parse(code).walkDecls(decl=>{
   if(expected.has(decl.prop)){if(decl.value!==expected.get(decl.prop))throw new Error('Widget basis formula requires renewed review '+decl.prop);central.push({path:file,line:decl.source.start.line,hash:hash(code),variable:decl.prop,value:decl.value});expected.delete(decl.prop);}
   else if(['--qd-space-3','--qd-space-4','--qd-space-unit'].includes(decl.prop))central.push({path:file,line:decl.source.start.line,hash:hash(code),variable:decl.prop,value:decl.value});
  });
 }
 if(expected.size)throw new Error('Missing central widget basis declarations '+[...expected.keys()].join(','));
 const foundation=centralOutputs(PARTS,'Q-Atelier',product).find(part=>part.path==='app/q-design.foundation.css');
 if(!foundation)throw new Error('Missing shared foundation copy contract');
 const canonical=fs.readFileSync(path.join(root,foundation.src),'utf8'),actual=fs.readFileSync(path.join(product,foundation.path),'utf8');
 if(copyProblems(foundation,canonical,actual).length)throw new Error('Shared foundation copy does not match central distribution');
 central.push({path:foundation.src,line:1,hash:hash(canonical)},{path:foundation.path,line:1,hash:hash(actual)});
 const basis=[];const visitBasis=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(boardSF)==='basis')basis.push({line:line(boardSF,node),value:node.initializer.getText(boardSF)});ts.forEachChild(node,visitBasis);};visitBasis(board);
 const expectedBasis=["w === 'quarter' ? 'var(--qd-atelier-widget-edit-quarter)' : w === 'half' ? 'var(--qd-atelier-widget-edit-half)' : '100%'","w === 'quarter' ? 'var(--qd-atelier-widget-quarter)' : w === 'half' ? 'var(--qd-atelier-widget-half)' : '100%'"];
 if(JSON.stringify(basis.map(item=>item.value))!==JSON.stringify(expectedBasis))throw new Error('Widget width mapping requires renewed review');
 const main=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-style-decisions.json'),'utf8'));
 const candidates=main.records.filter(record=>record.kind==='object-property'&&record.property==='width'&&/^'(?:full|half|quarter)'(?: as const)?$/.test(record.value));
 const entries=[],records=[];
 for(const record of candidates){
  const sf=program.getSourceFile(path.join(product,record.path));if(hash(raw.get(record.path))!==record.sourceHash)throw new Error('Main review is stale '+record.path);
  const matches=[];const visit=node=>{if(ts.isPropertyAssignment(node)&&node.name.getText(sf)==='width'&&line(sf,node)===record.line&&node.initializer.getText(sf)===record.value)matches.push(node);ts.forEachChild(node,visit);};visit(sf);
  if(matches.length!==1)throw new Error('Exact widget width argument missing '+record.path+':'+record.line);
  const node=matches[0],boundary=widgetWidthBoundary({ts,checker,node,sf,boardWidthDeclaration:width,isItemsSink});
  if(!boundary)throw new Error('Width enum has no exact BoardItem consumer '+record.path+':'+record.line);
  const object=node.parent,id=object.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='id')?.initializer.getText(sf);
  let owner=node.parent;while(owner&&!ts.isFunctionDeclaration(owner))owner=owner.parent;
  let arrayBinding=node.parent;while(arrayBinding&&!ts.isVariableDeclaration(arrayBinding)&&!ts.isFunctionLike(arrayBinding))arrayBinding=arrayBinding.parent;
  const namedItemsLines=[];
  if(arrayBinding&&ts.isVariableDeclaration(arrayBinding)&&ts.isIdentifier(arrayBinding.name)){
   const symbol=resolve(arrayBinding.name);
   const findItems=child=>{if(ts.isJsxAttribute(child)&&child.name.getText(sf)==='items'&&child.initializer&&ts.isJsxExpression(child.initializer)&&child.initializer.expression&&ts.isIdentifier(child.initializer.expression)&&resolve(child.initializer.expression)===symbol&&isItemsSink(child.parent.parent.tagName))namedItemsLines.push(line(sf,child));ts.forEachChild(child,findItems);};findItems(sf);
  }
  const ownEvidence=[evidence(record.path,record.line),evidence(boardFile,line(boardSF,width)),...basis.map(item=>evidence(boardFile,item.line)),...central];
  let route;
  if(boundary.directItems){route='Exact JSX items prop on PageWidgetBoard/CustomizableWidgetBoard. PageWidgetBoard forwards the same items array to the shared renderer.';ownEvidence.push(evidence(wrapperFile,line(wrapperSF,wrapper)));}
  else if(namedItemsLines.length){route='The exact typed local array '+arrayBinding.name.text+' is passed unchanged to the symbol-resolved PageWidgetBoard/CustomizableWidgetBoard items prop.';ownEvidence.push(evidence(record.path,line(sf,arrayBinding)),...namedItemsLines.map(at=>evidence(record.path,at)),evidence(wrapperFile,line(wrapperSF,wrapper)));}
  else{
   if(!owner?.name||!record.path.startsWith('components/dashboard/'))throw new Error('Typed BoardItem requires actual renderer path '+record.path+':'+record.line);
   const ownerSymbol=resolve(owner.name),dashboardSF=program.getSourceFile(path.join(product,dashboardFile)),callerLines=[];
   const find=node=>{if(ts.isCallExpression(node)&&resolve(node.expression)===ownerSymbol)callerLines.push(line(dashboardSF,node));ts.forEachChild(node,find);};find(dashboardSF);
   if(!callerLines.length)throw new Error('Dashboard builder has no real caller '+record.path);
   route='Typed role builder '+owner.name.text+' appends BoardItem objects and returns blocks. The dashboard composes these exact builder results into roleBlocks and passes them to CustomizableWidgetBoard.items.';
   ownEvidence.push(evidence(dashboardFile,460),...callerLines.map(at=>evidence(dashboardFile,at)));
  }
  entries.push({path:record.path,line:record.line,sourceHash:record.sourceHash,argumentHash:record.argumentHash,value:record.value,id,...boundary,namedItemsLines,route});
  records.push({path:record.path,line:record.line,sourceHash:record.sourceHash,argumentHash:record.argumentHash,value:record.value,decision:'delegated-renderer-parameter',ruleId:'exact-widget-width-enum',reason:'This exact full/half/quarter value selects a BoardItem layout variant. '+route+' Both normal and edit-mode width calculations reference the matching central parent gap. This boundary proof does not approve the widget node contents or other renderer styles.',evidence:[...new Map(ownEvidence.map(item=>[JSON.stringify(item),item])).values()]});
 }
 return {version:1,scope:'Exact width variant arguments and reviewed real renderer flow. No filename-wide metadata exemption, arbitrary width literal approval or widget-content conformance claim.',renderer:{path:boardFile,sourceHash:hash(raw.get(boardFile)),basis},entries,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createWidgetWidthReview(),file=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../reviews/atelier-widget-width-review.json');fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({records:report.records.length,exactType:report.entries.filter(x=>x.exactType).length,directItems:report.entries.filter(x=>x.directItems).length},null,2));
}
