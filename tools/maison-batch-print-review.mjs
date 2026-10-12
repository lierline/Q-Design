import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {planBatchPrint,batchPrintPath} from './maison-batch-print-migration.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',tool='tools/maison-batch-print-review.mjs',manifest=root+'/reviews/maison-batch-print-review.json',ts=createRequire(repo+'/package.json')('typescript');
export function inspectBatchColumns(code){
 const sf=ts.createSourceFile(batchPrintPath,code,99,true,4),grid=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='Grid');assert(grid);const params=grid.parameters[0].type;assert(ts.isTypeLiteralNode(params));assert.equal(params.members.find(n=>n.name?.getText(sf)==='cols').type.getText(sf),'readonly number[]');
 let calls=0,reads=0;const visit=n=>{
  if(ts.isIdentifier(n)&&n.text==='Grid'&&n!==grid.name)assert(ts.isJsxSelfClosingElement(n.parent)||ts.isJsxOpeningElement(n.parent)||ts.isJsxClosingElement(n.parent),'Local Grid must not escape');
  if(ts.isJsxAttribute(n)&&n.name.text==='cols'&&n.parent.parent.tagName.getText(sf)==='Grid'){
   const expr=n.initializer.expression,values=ts.isConditionalExpression(expr)?[expr.whenTrue,expr.whenFalse]:[expr];if(ts.isConditionalExpression(expr))assert.equal(expr.condition.getText(sf),'spec.waste.lotColumn');for(const v of values)assert(/^qdPrint\.batchColumns\.[A-Za-z]+$/.test(v.getText(sf)));calls++;
  }
  if(ts.isIdentifier(n)&&n.text==='cols'&&n.pos>=grid.body.pos&&n.end<=grid.body.end){assert(ts.isPropertyAccessExpression(n.parent)&&n.parent.expression===n&&n.parent.name.text==='map');reads++;}
  ts.forEachChild(n,visit);
 };visit(sf);assert.equal(calls,16);assert.equal(reads,1);assert(grid.body.getText(sf).includes('style={{ width: `${w}%` }}'));assert(grid.body.getText(sf).includes('first ? undefined : { marginTop: qdPrint.marginTop.v3mm }'));
 return sf;
}
export async function createBatchPrintReview(){
 const plan=await planBatchPrint(),code=fs.readFileSync(repo+'/'+batchPrintPath,'utf8');assert.equal(hash(code),plan.proof.afterHash);const sf=inspectBatchColumns(code),main=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),records=[];
 const lines=new Map();const visit=n=>{if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='length'&&ts.isObjectLiteralExpression(n.parent)&&ts.isCallExpression(n.parent.parent)&&n.parent.parent.expression.getText(sf)==='Array.from'&&n.parent.parent.arguments[0]===n.parent)lines.set(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,n.initializer.getText(sf));ts.forEachChild(n,visit);};visit(sf);
 const normal=s=>s.replace(/\s+/g,'');
 for(const r of main.records.filter(r=>r.path===batchPrintPath)){
  let decision,reason;
  if(r.property==='style'&&normal(r.value)==='{first?undefined:{marginTop:qdPrint.marginTop.v3mm}}'){decision='confirmed-style-composition';reason='Exact first-table flag selects no style or the central table spacing. No unreviewed appearance leaf.';}
  if(r.property==='width'&&r.value==='`${w}%`'||r.property==='style'&&normal(r.value)==='{{width:`${w}%`}}'){decision='token-reference-verified';reason='The private Grid consumes its readonly numeric columns only through this percentage renderer. Every one of its sixteen call sites supplies central batchColumns layouts; no escaped helper, map or extra width fallback is accepted. Actual render mutation tests preserve cell values and form content.';}
  if(r.property==='cols'&&normal(r.value)==='{spec.waste.lotColumn?qdPrint.batchColumns.disposalWithLot:qdPrint.batchColumns.disposalWithoutLot}'){decision='token-reference-verified';reason='The existing waste-sheet boolean selects one of two central original column layouts, both totaling 100 percent. The data condition and column structure are unchanged.';}
  if(r.property==='length'&&lines.get(r.line)===r.value&&['lines','spec.waste.rows','left'].includes(r.value)){decision='structural-behavior';reason='Exact first argument of builtin Array.from sets generated record rows from the existing material, waste or lot row count. Row appearance and paper packing columns are separate central arguments. It is not a CSS length.';}
  if(r.kind==='named-style-value'&&r.property==='left'&&r.value==='Math.ceil(total / 2)'){const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='PolishingLots');assert(fn?.body.getText(sf).includes('const total = Math.max(15, lots.length)'));assert(fn.body.getText(sf).includes('Array.from({ length: left }'));decision='structural-behavior';reason='The exact local variable counts paired lot rows from the existing lots list with the original fifteen-slot blank-form minimum and is consumed as Array.from row count and avoid-break predicate. It never supplies CSS left positioning. The original pairing structure and paper columns remain unchanged.';}
  if(decision)records.push({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,value:r.value,decision,ruleId:'exact-manufacturing-paper-consumer',reason,evidence:[{path:batchPrintPath,line:r.line,hash:hash(code)},{path:plan.proof.canonical.path,line:1,hash:hash(plan.afterCanon)},{path:'lib/design/q-design-print.ts',line:1,hash:hash(fs.readFileSync(repo+'/lib/design/q-design-print.ts','utf8'))},{path:tool,line:1,hash:hash(fs.readFileSync(root+'/'+tool,'utf8'))},{path:'tools/maison-batch-print.test.mjs',line:1,hash:hash(fs.readFileSync(root+'/tools/maison-batch-print.test.mjs','utf8'))}]});
 }
 assert.equal(records.length,8);return {version:1,scope:'Eight exact manufacturing Grid/row expressions. All sixteen current Grid callers and the original data row generators are inspected. Other arguments remain independently inventoried.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const result=await createBatchPrintReview();if(process.argv.includes('--write'))fs.writeFileSync(manifest,JSON.stringify(result,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),result);console.log(JSON.stringify({records:result.records.length,passed:true}));
}
