import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='1e27ab26c9900690a1013d0f4b5bcb541341a7c4',reviewRef='712ccc1c47f21f803f969fedfdb0d816548cf4d0',tool='tools/maison-docx-values-review.mjs',ts=createRequire(repo+'/package.json')('typescript');
export const valuesPath='lib/documents/form-fill-changes.ts';
const consumers=['lib/documents/form-fill.ts','app/api/documents/form/route.ts'];
const sites=[260,378,380,386,391,397,402,407,412,419,424,427,526,532,537,542,547,553,571];
const read=f=>fs.readFileSync(repo+'/'+f,'utf8');
export function verifyTextSource(file,code){assert([valuesPath,...consumers,'tsconfig.json'].includes(file));assert.equal(hash(code),hash(execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024})),'Changed document-field pipeline requires a fresh review');}
export function inspectValueSite(sf,row,checker){
 const hits=[];const visit=n=>{if(ts.isSpreadAssignment(n)&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===row.line&&n.expression.getText(sf)===row.value)hits.push(n);ts.forEachChild(n,visit);};visit(sf);assert.equal(hits.length,1);const spread=hits[0],property=spread.parent.parent;assert(ts.isPropertyAssignment(property)&&property.name.getText(sf)==='values');assert(ts.isObjectLiteralExpression(property.parent)&&ts.isReturnStatement(property.parent.parent));
 let fn=property;while(fn&&!ts.isFunctionDeclaration(fn))fn=fn.parent;assert(fn&&['resolveChangeRequest','resolveChangeExamine','resolveChangeReport'].includes(fn.name?.text));assert.equal(fn.type.getText(sf),'Promise<ModuleFormResult | null>');
 let expr=spread.expression;while(ts.isParenthesizedExpression(expr)||ts.isAwaitExpression(expr))expr=expr.expression;assert(ts.isCallExpression(expr));const declaration=checker.getResolvedSignature(expr)?.declaration;assert(declaration&&ts.isFunctionDeclaration(declaration));assert.equal(path.resolve(declaration.getSourceFile().fileName),path.resolve(sf.fileName));assert(['numbered','parentValues'].includes(declaration.name?.text));
 if(declaration.name.text==='numbered'){assert.equal(expr.arguments.length,3);assert(ts.isStringLiteral(expr.arguments[1]));assert(['impact','impact_comment','doc_target','doc_action','review_dept','reviewer','review_opinion','action_needed','plan_owner','plan_due','plan_remark','plan','result','dept','done','check_detail','linkage_detail'].includes(expr.arguments[1].text));assert.equal(declaration.type.getText(sf),'Record<string, string>');}
 else{assert.equal(row.line===378||row.line===526,true);assert.equal(expr.arguments.length,2);assert.equal(declaration.type.getText(sf),'Promise<Record<string, string>>');}
 return declaration.name.text;
}
export function createTextValuesReview(){
 for(const f of[valuesPath,...consumers,'tsconfig.json'])verifyTextSource(f,read(f));
 const config=ts.readConfigFile(repo+'/tsconfig.json',ts.sys.readFile),opts=ts.parseJsonConfigFileContent(config.config,ts.sys,repo),program=ts.createProgram([valuesPath,...consumers].map(f=>repo+'/'+f),{...opts.options,noEmit:true,incremental:false}),checker=program.getTypeChecker(),sf=program.getSourceFile(repo+'/'+valuesPath);assert(sf);
 const route=program.getSourceFile(repo+'/'+consumers[1]),renders=[];const walk=n=>{if(ts.isCallExpression(n)&&n.expression.getText(route)==='doc.render')renders.push(n);ts.forEachChild(n,walk);};walk(route);assert.equal(renders.length,1);assert.equal(renders[0].arguments[0].getText(route),'{ ...data.values, ...data.rows }');
 const mod=program.getSourceFile(repo+'/'+consumers[0]);const type=mod.statements.find(n=>ts.isTypeAliasDeclaration(n)&&n.name.text==='ModuleFormResult');assert(type&&ts.isTypeLiteralNode(type.type));assert.equal(type.type.members.find(n=>n.name?.getText(mod)==='values').type.getText(mod),'Record<string, string>');assert(read(consumers[0]).includes('values: { ...common.values, ...mod.values }'));
 const rows=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')).records,records=[];
 for(const line of sites){const hits=rows.filter(r=>r.path===valuesPath&&r.line===line&&r.kind==='object-spread');assert.equal(hits.length,1);const row=hits[0],producer=inspectValueSite(sf,row,checker);assert.equal(row.sourceHash,hash(read(valuesPath)));records.push({path:row.path,line:row.line,value:row.value,sourceHash:row.sourceHash,argumentHash:row.argumentHash,decision:'business-content',ruleId:'symbol-resolved-docx-text-values',reason:'This exact spread is in the values field of a typed ModuleFormResult return. Its resolved local '+producer+' producer returns string document fields, using inspected numbered placeholder prefixes or six parent-record fields. The pinned assembly passes those values to doc.render as document content. No visual style object, font, box size, checkbox placement or caller appearance input is approved.',evidence:[...[valuesPath,...consumers,'tsconfig.json'].map(f=>({path:f,line:1,hash:hash(read(f))})),{path:tool,line:1,hash:hash(fs.readFileSync(root+'/'+tool,'utf8'))}]});}
 assert.equal(records.length,19);return{version:1,productRef:ref,scope:'Nineteen exact symbol-resolved document text-field spreads. All other spreads remain separately reviewed.',records};
}
export function beforeTextValuesReport(current){
 const before=JSON.parse(execFileSync('git',['show',reviewRef+':reviews/maison-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));if(JSON.stringify(current)===JSON.stringify(before))return current;
 if(!current.records.some(r=>r.ruleId==='symbol-resolved-docx-text-values')){const historical=JSON.parse(execFileSync('git',['show','f3511d9f1e5371084357672801576e3cfbdcd868:reviews/maison-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));assert.deepEqual(current,historical);return current;}
 const entries=new Map(createTextValuesReview().records.map(r=>[r.argumentHash,r]));assert.equal(current.records.length,before.records.length);let count=0;
 for(const[i,r]of current.records.entries()){const old=before.records[i],entry=entries.get(r.argumentHash);if(entry){assert.equal(old.decision,'unknown');for(const[k,v]of Object.entries(entry))assert.deepEqual(r[k],v);assert.deepEqual({...r,decision:old.decision,ruleId:old.ruleId,reason:old.reason,evidence:old.evidence},old);count++;}else assert.deepEqual(r,old);}
 assert.equal(count,19);assert.deepEqual(current.counts,{...before.counts,unknown:before.counts.unknown-19,'business-content':before.counts['business-content']+19});assert.equal(current.unknownCount,current.counts.unknown);const meta=r=>{const x=structuredClone(r);for(const k of['generatedAt','records','counts','unknownCount'])delete x[k];return x;};assert.deepEqual(meta(current),meta(before));return before;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){const report=createTextValuesReview(),file=root+'/reviews/maison-docx-values-review.json';if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),report);console.log(JSON.stringify({records:19,passed:true}));}
