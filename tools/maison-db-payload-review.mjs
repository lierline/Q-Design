import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runtimeFiles,hash} from './style-arguments-core.mjs';
const repo='D:/Claude/Q-Works',root='D:/Claude/Q-Design',ts=createRequire(repo+'/package.json')('typescript');
const ref='7e5bd9be53fb61bb15fca676fde3e9400fdd377a',tool='tools/maison-db-payload-review.mjs',consumer='lib/actions/db.ts';
const targets=[
  {
    "path": "app/(app)/audits/sheet-actions.ts",
    "line": 442,
    "value": "base"
  },
  {
    "path": "app/(app)/audits/sheet-actions.ts",
    "line": 448,
    "value": "base"
  },
  {
    "path": "app/(app)/capa/sheet-actions.ts",
    "line": 98,
    "value": "planColumns(input, user.id)"
  },
  {
    "path": "app/(app)/capa/sheet-actions.ts",
    "line": 433,
    "value": "header"
  },
  {
    "path": "app/(app)/capa/sheet-actions.ts",
    "line": 482,
    "value": "header"
  },
  {
    "path": "app/(app)/concessions/actions.ts",
    "line": 416,
    "value": "fields"
  },
  {
    "path": "app/(app)/concessions/actions.ts",
    "line": 1063,
    "value": "fields"
  },
  {
    "path": "app/(app)/dashboard/calendar-actions.ts",
    "line": 100,
    "value": "toRow(input)"
  },
  {
    "path": "app/(app)/document-dispatch/actions.ts",
    "line": 246,
    "value": "fields"
  },
  {
    "path": "app/(app)/document-dispatch/ledger-actions.ts",
    "line": 347,
    "value": "fields"
  },
  {
    "path": "app/(app)/improvements/actions.ts",
    "line": 100,
    "value": "proposalFields(input)"
  },
  {
    "path": "app/(app)/improvements/actions.ts",
    "line": 416,
    "value": "fields"
  },
  {
    "path": "app/(app)/kpi/evaluations/actions.ts",
    "line": 484,
    "value": "header"
  },
  {
    "path": "app/(app)/kpi/evaluations/actions.ts",
    "line": 563,
    "value": "header"
  },
  {
    "path": "app/(app)/nc/report-actions.ts",
    "line": 236,
    "value": "fields"
  },
  {
    "path": "app/(app)/purchasing/actions.ts",
    "line": 482,
    "value": "specFields(input, item, user.id)"
  },
  {
    "path": "app/(app)/purchasing/order-actions.ts",
    "line": 302,
    "value": "fields"
  },
  {
    "path": "app/(app)/purchasing/quote-actions.ts",
    "line": 220,
    "value": "fields"
  },
  {
    "path": "app/(app)/recalls/actions.ts",
    "line": 331,
    "value": "fields"
  },
  {
    "path": "app/(app)/recalls/actions.ts",
    "line": 493,
    "value": "fields"
  },
  {
    "path": "app/(app)/recalls/actions.ts",
    "line": 633,
    "value": "fields"
  },
  {
    "path": "app/(app)/reviews/sheet-actions.ts",
    "line": 220,
    "value": "agendaColumns(input, user.id)"
  },
  {
    "path": "app/(app)/reviews/sheet-actions.ts",
    "line": 478,
    "value": "base"
  },
  {
    "path": "app/(app)/reviews/sheet-actions.ts",
    "line": 485,
    "value": "base"
  },
  {
    "path": "app/(app)/safety/actions.ts",
    "line": 407,
    "value": "payload"
  },
  {
    "path": "app/(app)/safety/incidents/incident-actions.ts",
    "line": 148,
    "value": "head"
  },
  {
    "path": "app/(app)/specs/actions.ts",
    "line": 157,
    "value": "payload"
  },
  {
    "path": "lib/items/barcode-link.ts",
    "line": 244,
    "value": "fields"
  }
];
export function inspectInsertConsumer(code){
 const sf=ts.createSourceFile(consumer,code,99,true,3),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='insertOne');assert(fn);assert.equal(fn.parameters[2].name.getText(sf),'payload');assert.equal(fn.parameters[2].type.getText(sf),'Record<string, unknown>');
 const references=[];const visit=n=>{if(ts.isIdentifier(n)&&n.text==='payload'&&n!==fn.parameters[2].name)references.push(n);ts.forEachChild(n,visit);};visit(fn.body);assert.equal(references.length,1);const node=references[0];assert(ts.isCallExpression(node.parent)&&ts.isPropertyAccessExpression(node.parent.expression)&&node.parent.expression.name.text==='insert'&&node.parent.arguments[0]===node);assert.equal(node.parent.arguments.length,1);assert.equal(fn.body.statements.length,1);assert(ts.isReturnStatement(fn.body.statements[0]));
 let expr=fn.body.statements[0].expression;assert(ts.isAwaitExpression(expr));expr=expr.expression;for(const name of ['single','select','insert']){assert(ts.isCallExpression(expr)&&ts.isPropertyAccessExpression(expr.expression)&&expr.expression.name.text===name);expr=expr.expression.expression;}while(ts.isParenthesizedExpression(expr)||ts.isAsExpression(expr))expr=expr.expression;assert(ts.isCallExpression(expr)&&expr.expression.getText(sf)==='supabase.from'&&expr.arguments[0].getText(sf)==='table');
 return sf;
}
export function verifyPayloadSource(file,code){
 assert([consumer,...targets.map(t=>t.path)].includes(file));
 assert.equal(hash(code),hash(execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'})),'Changed caller or consumer needs a fresh exact review');
}
export function resolvePayloadSite(sf,row,checker){
 const matches=[];const visit=n=>{if(ts.isSpreadAssignment(n)&&n.expression.getText(sf)===row.value&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===row.line)matches.push(n);ts.forEachChild(n,visit);};visit(sf);assert.equal(matches.length,1);
 let obj=matches[0].parent,call=obj.parent;assert(ts.isObjectLiteralExpression(obj));while(ts.isParenthesizedExpression(call)||ts.isAsExpression(call)){obj=call;call=call.parent;}assert(ts.isCallExpression(call));assert.equal(call.arguments.indexOf(obj),2);
 const decl=checker.getResolvedSignature(call)?.declaration;assert(decl&&ts.isFunctionDeclaration(decl));assert.equal(path.relative(repo,decl.getSourceFile().fileName).replaceAll('\\','/'),consumer);assert.equal(decl.name?.text,'insertOne');assert.equal(decl.parameters[2].name.getText(decl.getSourceFile()),'payload');return call;
}
export function createDbPayloadReview(){
 const files=[consumer,...new Set(targets.map(t=>t.path))];for(const file of files)verifyPayloadSource(file,fs.readFileSync(repo+'/'+file,'utf8'));inspectInsertConsumer(fs.readFileSync(repo+'/'+consumer,'utf8'));
 const config=ts.readConfigFile(repo+'/tsconfig.json',ts.sys.readFile),opts=ts.parseJsonConfigFileContent(config.config,ts.sys,repo),program=ts.createProgram(runtimeFiles(repo).filter(f=>/\.[jt]sx?$/.test(f)).map(f=>repo+'/'+f),{...opts.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const rows=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')).records,records=[];
 for(const target of targets){const hits=rows.filter(r=>r.path===target.path&&r.line===target.line&&r.kind==='object-spread'&&r.value===target.value);assert.equal(hits.length,1);const row=hits[0],sf=program.getSourceFile(repo+'/'+row.path);assert(sf);resolvePayloadSite(sf,row,checker);assert.equal(hash(fs.readFileSync(repo+'/'+row.path,'utf8')),row.sourceHash);
 records.push({path:row.path,line:row.line,value:row.value,sourceHash:row.sourceHash,argumentHash:row.argumentHash,decision:'business-data',ruleId:'symbol-resolved-insert-payload',reason:'This exact spread is inside the third argument object of a TypeScript-resolved insertOne call. Its pinned consumer passes payload once and only to supabase.from(table).insert(payload).select(columns).single(). The complete caller and consumer hashes are checked; changed sources, shadowed consumers and other argument positions are rejected. This is data persistence evidence, not a renderer or filename exemption. No database operation is executed.',evidence:[...[row.path,consumer,'tsconfig.json'].map(f=>({path:f,line:1,hash:hash(fs.readFileSync(repo+'/'+f,'utf8'))})),{path:tool,line:1,hash:hash(fs.readFileSync(root+'/'+tool,'utf8'))}]});}
 assert.equal(records.length,28);assert.equal(new Set(records.map(r=>r.argumentHash)).size,28);return {version:1,productRef:ref,scope:'Twenty-eight individually pinned object spreads with resolved database payload consumers. All other object spreads remain independently reviewed.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const result=createDbPayloadReview(),manifest=root+'/reviews/maison-db-payload-review.json';if(process.argv.includes('--write'))fs.writeFileSync(manifest,JSON.stringify(result,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),result);console.log(JSON.stringify({records:result.records.length,passed:true}));
}
