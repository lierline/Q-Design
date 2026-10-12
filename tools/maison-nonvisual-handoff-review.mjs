// Exact current consumers. No name-wide or filename-wide styling exemption.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works',req=createRequire(product+'/package.json'),ts=req('typescript');
export function inspectPermissionActorConsumer(sf,name){
 const declarations=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert.equal(declarations.length,1);
 const fn=declarations[0];assert.equal(fn.type?.kind,ts.SyntaxKind.BooleanKeyword);
 const fields={line:new Set(['reviewOmitted','reviewerId','approveOmitted','approverId']),me:new Set(['id','isReviewer','isCeo'])};
 const visit=n=>{
  assert(!ts.isCallExpression(n)&&!ts.isNewExpression(n)&&!ts.isElementAccessExpression(n)&&!ts.isJsxElement(n)&&!ts.isJsxSelfClosingElement(n),'Permission predicate must remain a pure nonvisual comparison');
  if(ts.isPropertyAccessExpression(n))assert(fields[n.expression.getText(sf)]?.has(n.name.text),'Unreviewed actor consumer field');
  if(ts.isBinaryExpression(n))assert(![ts.SyntaxKind.EqualsToken,ts.SyntaxKind.PlusEqualsToken,ts.SyntaxKind.MinusEqualsToken].includes(n.operatorToken.kind),'Actor data cannot be assigned to a renderer');
  ts.forEachChild(n,visit);
 };visit(fn.body);return fn;
}
export function inspectHelpContentConsumer(sf){
 const functions=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='HelpBlock');assert.equal(functions.length,1);
 let reads=0;const visit=n=>{
  if(ts.isPropertyAccessExpression(n)&&n.expression.getText(sf)==='block'&&n.name.text==='content'){
   assert(ts.isCallExpression(n.parent)&&n.parent.expression.getText(sf)==='renderInline'&&n.parent.arguments[0]===n,'Help content must remain text, not a style input');reads++;
  }ts.forEachChild(n,visit);
 };visit(functions[0]);assert.equal(reads,3);
 const renderer=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='renderInline');assert(renderer&&renderer.parameters[0].type?.kind===ts.SyntaxKind.StringKeyword);
 let dynamicStyle=false;const check=n=>{
  if(ts.isJsxAttribute(n)&&(['style','dangerouslySetInnerHTML'].includes(n.name.getText(sf))||(n.name.getText(sf)==='className'&&!ts.isStringLiteral(n.initializer))))dynamicStyle=true;
  if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&!['strong','code'].includes(n.tagName.getText(sf)))dynamicStyle=true;
  ts.forEachChild(n,check);
 };check(renderer);assert(!dynamicStyle);
}
export function createMaisonNonvisualHandoffReview(){
 const config=ts.readConfigFile(product+'/tsconfig.json',ts.sys.readFile),options=ts.parseJsonConfigFileContent(config.config,ts.sys,product);
 const files=runtimeFiles(product).filter(f=>/\.[jt]sx?$/.test(f)),program=ts.createProgram(files.map(f=>product+'/'+f),{...options.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const main=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),records=[];
 const relative=sf=>path.relative(product,sf.fileName).replaceAll('\\','/'),evidence=(file,line=1)=>({path:file,line,hash:hash(fs.readFileSync(product+'/'+file,'utf8'))});
 const consumers=new Map([['lib/approvals/assignment.ts#canReviewNow',true],['lib/approvals/assignment.ts#canApproveNow',true]]);
 const helpPage='app/(app)/help/page.tsx';inspectHelpContentConsumer(program.getSourceFile(product+'/'+helpPage));
 for(const row of main.records){
  if((row.decision!=='unknown'&&row.ruleId!=='exact-handoff-nonvisual-consumer')||!['object-spread','object-property','named-style-value'].includes(row.kind))continue;
  const sf=program.getSourceFile(product+'/'+row.path);if(!sf)continue;
  const nodes=[];const visit=n=>{const line=sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
   if(line===row.line&&((row.kind==='object-spread'&&ts.isSpreadAssignment(n)&&n.expression.getText(sf)===row.value)||(row.kind==='object-property'&&ts.isPropertyAssignment(n)&&n.name.getText(sf)==='content'&&n.initializer.getText(sf)===row.value)||(row.kind==='named-style-value'&&ts.isVariableDeclaration(n)&&n.name.getText(sf)===row.property&&n.initializer?.getText(sf)===row.value)))nodes.push(n);ts.forEachChild(n,visit);};visit(sf);
  if(nodes.length!==1)continue;const n=nodes[0];assert.equal(hash(fs.readFileSync(product+'/'+row.path,'utf8')),row.sourceHash);
  let reason,consumer,proof=[evidence(row.path,row.line)];
  if(ts.isSpreadAssignment(n)&&ts.isObjectLiteralExpression(n.parent)&&ts.isCallExpression(n.parent.parent)&&n.parent.parent.arguments[2]===n.parent){
   const call=n.parent.parent,decl=checker.getResolvedSignature(call)?.declaration;
   const key=decl&&ts.isFunctionDeclaration(decl)&&decl.name?relative(decl.getSourceFile())+'#'+decl.name.text:null;
   const type=checker.getTypeAtLocation(n.parent),fields=type.getProperties().map(p=>p.name).sort();
   if(consumers.has(key)&&!(type.flags&ts.TypeFlags.Any)&&JSON.stringify(fields)===JSON.stringify(['id','isCeo','isReviewer'])){
    inspectPermissionActorConsumer(decl.getSourceFile(),decl.name.text);
    consumer=key+' argument 3: permission actor';proof.push(evidence(relative(decl.getSourceFile()),decl.getSourceFile().getLineAndCharacterOfPosition(decl.getStart()).line+1));
    reason='Exact symbol-resolved boolean permission predicate receives only id/isCeo/isReviewer actor fields. This composition determines workflow eligibility; it is not a CSS style object. No permission or business behavior is changed.';
   }
  }
  if(!reason&&row.path==='app/(app)/help/content.ts'&&ts.isPropertyAssignment(n)&&ts.isStringLiteral(n.initializer)&&ts.isObjectLiteralExpression(n.parent)){
   const kind=n.parent.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(sf)==='kind');let owner=n.parent;
   while(owner&&!ts.isVariableDeclaration(owner))owner=owner.parent;
   if(kind&&ts.isStringLiteral(kind.initializer)&&['text','tip','warn'].includes(kind.initializer.text)&&owner?.name.getText(sf)==='HELP_SECTIONS'&&owner.type?.getText(sf)==='HelpSection[]'){
    consumer='HELP_SECTIONS -> HelpBlock -> renderInline text child';proof.push(evidence(helpPage,225));reason='This exact content literal is a typed text/tip/warn help block under HELP_SECTIONS. Every HelpBlock content read is an argument to the inspected string-to-React-text renderer. Styling and markup classes are independently inventoried.';
   }
  }
  if(!reason&&ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)){
   const symbol=checker.getSymbolAtLocation(n.name),references=[];let escaped=false;
   const inspect=id=>{if(ts.isIdentifier(id)&&id!==n.name&&checker.getSymbolAtLocation(id)===symbol){
    const call=id.parent,decl=ts.isCallExpression(call)&&call.arguments[0]===id?checker.getResolvedSignature(call)?.declaration:null;
    const filename=decl?.getSourceFile().fileName.replaceAll('\\','/');
    if(decl?.name?.getText()==='select'&&filename&&/node_modules\/.*(?:@supabase\/postgrest-js|@supabase\+postgrest-js@)/.test(filename))references.push({call,decl});else escaped=true;
   }ts.forEachChild(id,inspect);};inspect(sf);
   if(!escaped&&references.length){consumer='Postgrest select column projection';reason='Every use of this exact local symbol is the first argument of the installed Postgrest select method. It supplies database column projection, not grid or CSS columns. Unresolved methods and any escaped or style use prevent acceptance.';
    for(const ref of references){const file=relative(ref.decl.getSourceFile());proof.push(evidence(file,ref.decl.getSourceFile().getLineAndCharacterOfPosition(ref.decl.getStart()).line+1));}
   }
  }
  if(reason)records.push({path:row.path,line:row.line,sourceHash:row.sourceHash,argumentHash:row.argumentHash,value:row.value,decision:consumer.startsWith('HELP_SECTIONS')?'business-content':'business-data',ruleId:'exact-handoff-nonvisual-consumer',consumer,reason,evidence:[...new Map(proof.map(e=>[JSON.stringify(e),e])).values()]});
 }
 return {version:1,scope:'Current exact permission actor, typed help text and installed database projection consumers only. All other candidates remain separate and unresolved. No program evaluation or business writes.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const report=createMaisonNonvisualHandoffReview(),file=root+'/reviews/maison-nonvisual-handoff-review.json';
 if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),report);
 console.log(JSON.stringify({records:report.records.length,consumers:[...new Set(report.records.map(r=>r.consumer))]}));
}
