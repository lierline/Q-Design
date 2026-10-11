import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier';
export const ts=createRequire(repo+'/package.json')('typescript');
export function inspectWriteGuard(code,{allowModuleGate=false}={}){
 const sf=ts.createSourceFile('route.ts',code,ts.ScriptTarget.Latest,true);
 const imports=sf.statements.filter(ts.isImportDeclaration);
 const exactImport=(name,module)=>imports.some(i=>i.moduleSpecifier.text===module&&!i.importClause?.isTypeOnly&&i.importClause?.namedBindings&&ts.isNamedImports(i.importClause.namedBindings)&&i.importClause.namedBindings.elements.some(s=>!s.isTypeOnly&&s.name.text===name&&(s.propertyName??s.name).text===name));
 if(!exactImport('assertWriteRole','@/lib/permissions/create-access')||!exactImport('NextResponse','next/server'))return null;
 if(allowModuleGate&&!exactImport('moduleGate','@/lib/subscription/module-gate'))return null;
 const bindings=[],uses=[];
 const visit=n=>{if(ts.isIdentifier(n)&&n.text==='w'){
  if(ts.isVariableDeclaration(n.parent)&&n.parent.name===n)bindings.push(n.parent);else uses.push(n);
 }ts.forEachChild(n,visit);};visit(sf);
 if(bindings.length!==1)return null;
 const binding=bindings[0],init=binding.initializer;
 if(!(binding.parent.flags&ts.NodeFlags.Const)||!init||!ts.isAwaitExpression(init)||!ts.isCallExpression(init.expression)||!ts.isIdentifier(init.expression.expression)||init.expression.expression.text!=='assertWriteRole')return null;
 // No same-name declaration or import may shadow either inspected function.
 let shadow=false;const shadowVisit=n=>{
  if(ts.isIdentifier(n)&&['assertWriteRole','NextResponse',...(allowModuleGate?['moduleGate']:[])].includes(n.text)){
   const p=n.parent;
   if((ts.isVariableDeclaration(p)||ts.isBindingElement(p)||ts.isParameter(p)||ts.isFunctionDeclaration(p)||ts.isClassDeclaration(p))&&p.name===n)shadow=true;
  }ts.forEachChild(n,shadowVisit);
 };shadowVisit(sf);if(shadow)return null;
 const guarded=n=>{for(let p=n.parent;p;p=p.parent){if(ts.isIfStatement(p)&&p.expression.getText(sf)==='w instanceof NextResponse'&&n.getStart(sf)>=p.thenStatement.getStart(sf)&&n.end<=p.thenStatement.end)return true;}return false;};
 for(const n of uses){const p=n.parent;
  if(ts.isBinaryExpression(p)&&p.operatorToken.kind===ts.SyntaxKind.InstanceOfKeyword&&p.left===n&&p.right.getText(sf)==='NextResponse')continue;
  if(ts.isReturnStatement(p)&&p.expression===n&&guarded(n))continue;
  if(ts.isPropertyAssignment(p)&&p.name.getText(sf)==='fail'&&p.initializer===n&&guarded(n))continue;
  if(ts.isPropertyAccessExpression(p)&&p.expression===n&&p.name.text==='orgId'){
   const parent=p.parent;
   if(ts.isBinaryExpression(parent)&&[ts.SyntaxKind.ExclamationEqualsEqualsToken,ts.SyntaxKind.EqualsEqualsEqualsToken].includes(parent.operatorToken.kind))continue;
   if(ts.isPropertyAssignment(parent)&&['orgId','org_id'].includes(parent.name.getText(sf))&&parent.initializer===p)continue;
   if(ts.isCallExpression(parent)&&ts.isPropertyAccessExpression(parent.expression)&&parent.expression.name.text==='eq'&&parent.arguments.length===2&&ts.isStringLiteral(parent.arguments[0])&&parent.arguments[0].text==='org_id'&&parent.arguments[1]===p)continue;
   if(allowModuleGate&&ts.isCallExpression(parent)&&ts.isIdentifier(parent.expression)&&parent.expression.text==='moduleGate'&&parent.arguments.length===3&&parent.arguments[1]===p&&ts.isAwaitExpression(parent.parent))continue;
  }
  return null;
 }
 if(!uses.length)return null;
 return {line:sf.getLineAndCharacterOfPosition(binding.name.getStart(sf)).line+1,value:init.getText(sf),consumers:uses.map(n=>({line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,value:n.parent.getText(sf)}))};
}
export function createWriteGuardReview(){
 const producer='lib/permissions/create-access.ts',code=fs.readFileSync(repo+'/'+producer,'utf8'),sf=ts.createSourceFile(producer,code,99,true);
 const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='assertWriteRole');
 assert(fn);assert.equal(hash(fn.getText(sf)),'16940a19643f3bd53264e7f4a38026411a058ddaeec8b8100cfc4a192b1b89a3','Permission producer changed and needs review');
 const review=JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8')),records=[],unresolved=[];
 for(const row of review.records.filter(r=>r.kind==='named-style-value'&&r.property==='w'&&r.path.startsWith('app/api/')&&r.value.includes('assertWriteRole'))){
  const source=fs.readFileSync(repo+'/'+row.path,'utf8'),flow=inspectWriteGuard(source);
  if(!flow){unresolved.push({path:row.path,line:row.line,reason:'Additional consumers need separate review; no decision granted.'});continue;}
  assert.equal(row.sourceHash,hash(source));assert.equal(row.line,flow.line);assert.equal(row.value,flow.value);
  records.push({path:row.path,line:row.line,sourceHash:row.sourceHash,argumentHash:row.argumentHash,decision:'business-data',ruleId:'exact-server-write-guard-result',reason:'The exact w binding is an awaited permission result, not a width. The pinned producer returns organization identity or an HTTP response. Every reference is inspected: response guard/return, organization comparison, organization query constraint or organization data property. No style, component argument, arbitrary call, spread or alias consumer is admitted.',evidence:[{path:producer,line:sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line+1,hash:hash(code)},...flow.consumers.map(c=>({path:row.path,line:c.line,hash:row.sourceHash}))],consumers:flow.consumers});
 }
 assert.equal(records.length,29);assert.equal(unresolved.length,4);
 return {version:1,scope:'Exact server permission-result consumers only. Does not exempt API files or other variables named w.',records,unresolved};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createWriteGuardReview(),file=root+'/reviews/atelier-write-guard-review.json';
 if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
 else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),report);
 console.log('Exact permission-result bindings verified: '+report.records.length);
}
