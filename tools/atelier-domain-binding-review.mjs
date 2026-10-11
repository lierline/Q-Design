// Exact lexical data bindings. No application functions are executed.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Atelier'),ts=createRequire(product+'/package.json')('typescript');
const postcss=createRequire(path.resolve(root,'../Q-Works/package.json'))('postcss'),qaRequire=createRequire(product+'/package.json');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(qaRequire.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
export const expectedBindings=[
 ['app/(app)/products/client.tsx',310,'h','fillFromMfds'],
 ['app/api/admin/mfds-probe/route.ts',658,'h','echoOnce'],
 ['app/api/cron/stale-reviews/route.ts',178,'h','POST'],
 ['components/AssessmentDocApprovalPanel.tsx',111,'h','anonymous'],
 ['components/DocumentApprovalPanel.tsx',149,'h','anonymous'],
 ['components/ProductProfileWizard.tsx',205,'h','fillFromMfds'],
 ['lib/export/docx-builder/body.ts',193,'h','buildBodySection'],
 ['lib/export/merge-into-template.ts',152,'h','buildOoxmlBlock'],
 ['lib/rule-override-pure.ts',428,'h','includesAny'],
 ['lib/rules/actions.ts',135,'w','canDo'],
 ['lib/medical-items/grade-resolve.ts',82,'w','resolveActualGrade'],
 ['lib/judgment-synthesizer.ts',143,'w','buildUserPrompt'],
 ['lib/compliance/scoring.ts',147,'w','scoreAssessment'],
 ['lib/engine/paraphrase.ts',109,'h','estimateDeriveCostUsd'],
];
export const runtimeBindings=[
 ['app/(app)/research/[code]/page.tsx',791,'w','computeNextAction'],
 ['app/api/admin/mfds-changes/route.ts',44,'w','GET'],
 ['app/api/sheets/[kind]/[parentId]/route.ts',110,'w','guardWrite'],
 ['components/admin/DocsetActivateSheet.tsx',147,'w','DocsetActivateSheet'],
 ['components/SessionExpiryGate.tsx',54,'w','anonymous'],
 ['lib/crypto/vault-enroll.ts',440,'w','buildRecoveryCode'],
 ['lib/crypto/vault.ts',459,'h','keyFingerprint'],
];
function inspectExactBinding(record,code,bindings){
 assert.equal(hash(code),record.sourceHash,'Complete current consumer source must match');
 assert.equal(record.kind,'named-style-value');assert.equal(record.decision,'business-data');assert.equal(record.ruleId,'exact-domain-data-binding');
 assert(bindings.some(b=>JSON.stringify(b)===JSON.stringify([record.path,record.line,record.property,record.inspectedConsumer])));
 const actual=scanArguments(record.path,code,{ts,postcss,properties}).filter(argument=>hash(JSON.stringify(argument))===record.argumentHash);
 assert.equal(actual.length,1,'Exact fresh lexical argument must match its pinned fingerprint');
 assert.deepEqual([actual[0].line,actual[0].kind,actual[0].property,actual[0].value],[record.line,record.kind,record.property,record.reviewedExpression]);
 const options={noLib:true,noResolve:true,target:ts.ScriptTarget.Latest,jsx:ts.JsxEmit.Preserve},sf=ts.createSourceFile(record.path,code,ts.ScriptTarget.Latest,true,record.path.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 assert.equal(sf.parseDiagnostics.length,0);
 const host=ts.createCompilerHost(options);host.getSourceFile=file=>file===record.path?sf:undefined;host.fileExists=file=>file===record.path;host.readFile=file=>file===record.path?code:undefined;
 const program=ts.createProgram([record.path],options,host),checker=program.getTypeChecker();
 const line=n=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;let declaration;
 const visit=n=>{if(ts.isVariableDeclaration(n)&&line(n)===record.line&&n.name.getText(sf)===record.property){assert(!declaration);declaration=n;}ts.forEachChild(n,visit);};visit(sf);
 assert(declaration);assert.equal(declaration.initializer.getText(sf),record.reviewedExpression);
 let fn=declaration.parent;while(fn&&!ts.isFunctionLike(fn))fn=fn.parent;assert(fn);assert.equal(line(fn),record.consumerLine);
 assert.equal(fn.name?.getText(sf)||(ts.isVariableDeclaration(fn.parent)?fn.parent.name.getText(sf):'anonymous'),record.inspectedConsumer);
 const symbol=checker.getSymbolAtLocation(declaration.name);assert(symbol);const uses=[];
 const scan=n=>{if(ts.isIdentifier(n)&&n!==declaration.name&&checker.getSymbolAtLocation(n)===symbol)uses.push(line(n));ts.forEachChild(n,scan);};scan(fn);
 assert.deepEqual([...new Set(uses)],record.consumerUses,'Only actual references to this binding are counted');
 assert.deepEqual(record.evidence,[{path:record.path,line:record.line,hash:record.sourceHash},{path:record.path,line:record.consumerLine,hash:record.sourceHash}]);
 return true;
}
export const inspectDomainBinding=(record,code)=>inspectExactBinding(record,code,expectedBindings);
export const inspectRuntimeBinding=(record,code)=>inspectExactBinding(record,code,runtimeBindings);
export function verifyDomainBindings(){
 const review=JSON.parse(fs.readFileSync(root+'/reviews/atelier-domain-binding-review.json','utf8'));
 assert.equal(review.version,1);assert.deepEqual(review.records.map(r=>[r.path,r.line,r.property,r.inspectedConsumer]),expectedBindings);
 for(const record of review.records)inspectDomainBinding(record,fs.readFileSync(product+'/'+record.path,'utf8'));
 return review;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.deepEqual(process.argv.slice(2),['--check']);console.log('Exact lexical domain-data consumers verified: '+verifyDomainBindings().records.length);
}
