import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {formatProductCopy} from './copy-spacing.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',productRef='82ecf5576f81c9b1cf922620a3a6d0a3e16b3415',designRef='b456d17d667c8b9654a4c70dcb7fbcce8781283b',manifest=root+'/reviews/maison-batch-print-migration.json';
export const batchPrintPath='app/(app)/production/print/batch-record-sheet.tsx';
const ts=createRequire(repo+'/package.json')('typescript');
const git=(base,ref,file)=>execFileSync('git',['show',ref+':'+file],{cwd:base,encoding:'utf8'});
export async function planBatchPrint(){
 const before=git(repo,productRef,batchPrintPath),canonical=git(root,designRef,'patterns/foundation/maison-print.ts'),sf=ts.createSourceFile(batchPrintPath,before,99,true,4),csf=ts.createSourceFile('print.ts',canonical,99,true,3);
 let data;const find=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(csf)==='qdPrint')data=n.initializer.expression;ts.forEachChild(n,find);};find(csf);assert(ts.isObjectLiteralExpression(data));
 const maps=new Map();for(const p of data.properties)if(ts.isPropertyAssignment(p)&&ts.isObjectLiteralExpression(p.initializer)){const name=p.name.getText(csf).replaceAll('"',''),m=new Map();for(const q of p.initializer.properties)if(ts.isPropertyAssignment(q)&&(ts.isStringLiteral(q.initializer)||ts.isNumericLiteral(q.initializer)))m.set(q.initializer.getText(csf),q.name.getText(csf).replaceAll('"',''));maps.set(name,m);}
 const edits=[],columns={},roles=['stageHeading','pairHeading','materials','pairedMaterials','semiProducts','quantity','identity','documentHeader','bending','processConditions','polishingAgency','polishingQuantity','storage','disposal','confirmation','polishingLots'];let columnIndex=0,style;
 const add=(n,text)=>edits.push({start:n.getStart(sf),end:n.end,from:n.getText(sf),text});
 const walk=n=>{
  if(ts.isPropertyAssignment(n)&&maps.has(n.name.getText(sf))){let p=n.parent,inline=false;while(p){if(ts.isJsxAttribute(p)){inline=p.name.text==='style';break;}if(ts.isStatement(p))break;p=p.parent;}if(inline){const key=maps.get(n.name.getText(sf)).get(n.initializer.getText(sf));if(key)add(n.initializer,'qdPrint.'+n.name.getText(sf)+'.'+key);}}
  if(ts.isJsxAttribute(n)&&n.name.text==='cols'&&n.parent.parent.tagName.getText(sf)==='Grid'){
   const role=roles[columnIndex++],expr=n.initializer.expression;assert(role);const values=a=>{assert(ts.isArrayLiteralExpression(a)&&a.elements.every(ts.isNumericLiteral));const v=a.elements.map(e=>Number(e.text));assert.equal(v.reduce((a,b)=>a+b,0),100);return v;};
   if(ts.isConditionalExpression(expr)){assert.equal(role,'disposal');columns.disposalWithLot=values(expr.whenTrue);columns.disposalWithoutLot=values(expr.whenFalse);add(expr,expr.condition.getText(sf)+' ? qdPrint.batchColumns.disposalWithLot : qdPrint.batchColumns.disposalWithoutLot');}else{columns[role]=values(expr);add(expr,'qdPrint.batchColumns.'+role);}
  }
  if(ts.isJsxAttribute(n)&&n.name.text==='stroke'&&ts.isStringLiteral(n.initializer)&&n.initializer.text==='#000')add(n.initializer,'{qdPrint.ink}');
  if(ts.isJsxAttribute(n)&&n.name.text==='box'&&n.initializer?.getText(sf).replace(/\s/g,'')==='{{w:26,h:12}}')add(n.initializer,'{qdPrint.signatures.batch}');
  if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(sf)==='style')for(const child of n.children)if(ts.isJsxExpression(child)&&child.expression&&ts.isNoSubstitutionTemplateLiteral(child.expression)){assert(!style);style=child.expression.text;add(child.expression,'qdPrintBatchCss');}
  ts.forEachChild(n,walk);
 };walk(sf);assert.equal(columnIndex,16);assert.equal(Object.keys(columns).length,17);assert(style);
 let after=before;for(const e of edits.sort((a,b)=>b.start-a.start))after=after.slice(0,e.start)+e.text+after.slice(e.end);assert.equal(after.split('import { qdPrint }').length,2);after=after.replace('import { qdPrint }','import { qdPrint, qdPrintBatchCss }');after=await formatProductCopy(repo,batchPrintPath,after);
 let afterCanon=canonical.slice(0,data.getStart(csf)+1)+'\n  batchColumns: '+JSON.stringify(columns,null,2)+','+canonical.slice(data.getStart(csf)+1);
 assert.equal(afterCanon.split('signatures: { approval:').length,2);afterCanon=afterCanon.replace('signatures: { approval:','signatures: { batch: { w: 26, h: 12 }, approval:');afterCanon+='\n/** Manufacturing sheet styles retain their original paper-only scope. */\nexport const qdPrintBatchCss = '+JSON.stringify(style)+';\n';
 const proof={version:1,productRef,designRef,path:batchPrintPath,beforeHash:hash(before),afterHash:hash(after),canonical:{path:'patterns/foundation/maison-print.ts',beforeHash:hash(canonical),afterHash:hash(afterCanon)},scope:'Exact existing manufacturing paper appearance values, sixteen Grid calls selecting seventeen original percentage layouts, one signature box, paper stroke and scoped stylesheet. Defaults, text, checked marks, form structure, data and workflows remain unchanged. No code executes during planning.',sites:edits,columns};
 return {before,after,canonical,afterCanon,proof};
}
export function beforeBatchPrintSource(file,code){
 if(file!==batchPrintPath||!fs.existsSync(manifest))return code;const p=JSON.parse(fs.readFileSync(manifest,'utf8'));if(hash(code)===p.beforeHash)return code;assert.equal(hash(code),p.afterHash,'Unreviewed manufacturing source');return git(repo,productRef,file);
}
export function beforeBatchPrintCanon(code){
 if(!fs.existsSync(manifest))return code;const p=JSON.parse(fs.readFileSync(manifest,'utf8'));if(hash(code)===p.canonical.beforeHash)return code;assert.equal(hash(code),p.canonical.afterHash,'Unreviewed manufacturing canon');return git(root,designRef,p.canonical.path);
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const plan=await planBatchPrint();if(process.argv.includes('--write')){assert(!fs.existsSync(manifest));assert.equal(hash(fs.readFileSync(repo+'/'+batchPrintPath,'utf8')),plan.proof.beforeHash);assert.equal(hash(fs.readFileSync(root+'/'+plan.proof.canonical.path,'utf8')),plan.proof.canonical.beforeHash);fs.writeFileSync(repo+'/'+batchPrintPath,plan.after);fs.writeFileSync(root+'/'+plan.proof.canonical.path,plan.afterCanon);fs.writeFileSync(manifest,JSON.stringify(plan.proof,null,2)+'\n');}else{assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),plan.proof);assert.equal(hash(fs.readFileSync(repo+'/'+batchPrintPath,'utf8')),plan.proof.afterHash);assert.equal(hash(fs.readFileSync(root+'/'+plan.proof.canonical.path,'utf8')),plan.proof.canonical.afterHash);}console.log(JSON.stringify({sites:plan.proof.sites.length,layouts:Object.keys(plan.proof.columns).length,passed:true}));
}
