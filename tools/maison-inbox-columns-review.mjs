import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {runtimeFiles,hash} from './style-arguments-core.mjs';
const repo='D:/Claude/Q-Works',root='D:/Claude/Q-Design',file='lib/approvals/inbox-kinds.ts',ts=createRequire(repo+'/package.json')('typescript');
const ref='28ccbd4edb8f006ceaa722b21006fee31dea3bb8',tool='tools/maison-inbox-columns-review.mjs',manifest=root+'/reviews/maison-inbox-columns-review.json';
export function inspectColumnLiteral(x,sf){
 if(ts.isAsExpression(x))return inspectColumnLiteral(x.expression,sf);
 if(x.kind===ts.SyntaxKind.NullKeyword)return;
 if(ts.isStringLiteral(x)){assert(/^[a-z][a-z0-9_]*$/.test(x.text),'Only database column names, never CSS values');return;}
 if(ts.isArrayLiteralExpression(x)){for(const e of x.elements){assert(ts.isStringLiteral(e));inspectColumnLiteral(e,sf);}return;}
 throw Error('Column values must be database field literals');
}
export function verifyInboxConsumerSource(pathname,code){
 assert([file,'lib/approvals/inbox.ts'].includes(pathname));
 const pinned=execFileSync('git',['show',ref+':'+pathname],{cwd:repo,encoding:'utf8'});assert.equal(hash(code),hash(pinned),'Changed workflow or style consumer requires a fresh review');
}
export function createInboxColumnsReview(){
for(const f of [file,'lib/approvals/inbox.ts'])verifyInboxConsumerSource(f,fs.readFileSync(repo+'/'+f,'utf8'));
const config=ts.readConfigFile(repo+'/tsconfig.json',ts.sys.readFile),options=ts.parseJsonConfigFileContent(config.config,ts.sys,repo),files=runtimeFiles(repo).filter(f=>/\.[jt]sx?$/.test(f));
const program=ts.createProgram(files.map(f=>repo+'/'+f),{...options.options,noEmit:true,incremental:false}),checker=program.getTypeChecker(),sf=program.getSourceFile(repo+'/'+file);
const expected=['no','title','writer','department','status','submittedAt','reviewedAt','approvedAt','rejectedAt','rejectReason','reviewedBy','approvedBy','involved'].sort();
const decls=sf.statements.flatMap(n=>ts.isVariableStatement(n)?[...n.declarationList.declarations]:[]),owner=decls.find(n=>n.name.getText(sf)==='RULE_KINDS');assert(owner&&owner.type?.getText(sf)==='Readonly<Record<RuleKind, RuleSpec>>');
const ownerSymbol=checker.getSymbolAtLocation(owner.name),readers=[];
for(const source of program.getSourceFiles().filter(s=>s.fileName.replaceAll('\\','/').startsWith(repo+'/')&&!s.isDeclarationFile)){
 const visit=n=>{if(ts.isIdentifier(n)){let sym=checker.getSymbolAtLocation(n);if(sym?.flags&ts.SymbolFlags.Alias)sym=checker.getAliasedSymbol(sym);if(sym===ownerSymbol&&n!==owner.name&&!ts.isImportSpecifier(n.parent)){
  const reader=path.relative(repo,source.fileName).replaceAll('\\','/');assert([file,'lib/approvals/inbox.ts'].includes(reader),'New registry consumer requires review');
  const p=n.parent;assert(ts.isElementAccessExpression(p)&&p.expression===n||ts.isCallExpression(p)&&p.expression.getText(source)==='Object.keys'&&p.arguments[0]===n,'Whole registry cannot escape');readers.push({path:reader,line:source.getLineAndCharacterOfPosition(n.getStart(source)).line+1,expression:p.getText(source)});
 }}ts.forEachChild(n,visit);};visit(source);
}
const candidates=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')).records.filter(r=>r.path===file&&(r.kind==='object-property'&&r.property==='cols'||r.kind==='object-spread'&&r.value==='APPROVAL_COLS')),records=[];
for(const row of candidates){const matches=[];const visit=n=>{if(sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===row.line&&(ts.isPropertyAssignment(n)&&n.name.getText(sf)===row.property&&n.initializer.getText(sf)===row.value||ts.isSpreadAssignment(n)&&n.expression.getText(sf)===row.value))matches.push(n);ts.forEachChild(n,visit);};visit(sf);assert.equal(matches.length,1);const n=matches[0],cols=ts.isSpreadAssignment(n)?n.parent:n.initializer;assert(ts.isObjectLiteralExpression(cols));assert(ts.isPropertyAssignment(cols.parent)&&cols.parent.name.getText(sf)==='cols');
 let top=cols;while(top&&!ts.isVariableDeclaration(top))top=top.parent;assert(top===owner,'Only exact registry fields may be data');
 const type=checker.getContextualType(cols);assert(type&&!(type.flags&ts.TypeFlags.Any));assert.deepEqual(type.getProperties().map(p=>p.name).sort(),expected,'Column schema cannot contain appearance properties');
 const literal=x=>inspectColumnLiteral(x,sf);
 const checkObject=obj=>{assert(ts.isObjectLiteralExpression(obj));for(const m of obj.properties){if(ts.isSpreadAssignment(m)){const sym=checker.getSymbolAtLocation(m.expression),d=sym?.valueDeclaration;assert(d&&ts.isVariableDeclaration(d)&&d===decls.find(d=>d.name.getText(sf)==='APPROVAL_COLS'));let value=d.initializer;while(ts.isAsExpression(value))value=value.expression;checkObject(value);}else{assert(ts.isPropertyAssignment(m));assert(expected.includes(m.name.getText(sf)));literal(m.initializer);}}};checkObject(cols);
 assert.equal(hash(fs.readFileSync(repo+'/'+file,'utf8')),row.sourceHash);records.push({path:file,line:row.line,sourceHash:row.sourceHash,argumentHash:row.argumentHash,value:row.value,decision:'business-data',ruleId:'typed-inbox-database-column-map',reason:'This exact cols object or APPROVAL_COLS spread is under the typed RULE_KINDS registry and has precisely the thirteen readonly RuleColumns fields. Its values are column-name strings, null or readonly lists of column names. Every registry symbol reference in the complete runtime program is inventoried. The two exact inspected consumers use these names for database projection, raw document-field lookup and workflow filters, never grid/CSS widths. Changed consumers, escaped registry values and additional appearance fields are rejected. No business record or permission is changed.',evidence:[...[file,'lib/approvals/inbox.ts','tsconfig.json'].map(f=>({path:f,line:1,hash:hash(fs.readFileSync(repo+'/'+f,'utf8'))})),{path:tool,line:1,hash:hash(fs.readFileSync(root+'/'+tool,'utf8'))}]});
}
assert.equal(records.length,26);assert.equal(readers.length,13);
return {version:1,productRef:ref,scope:'Twenty-six exact typed database-column candidates and thirteen current symbol-resolved registry reads. The named d/all candidates and all other arguments remain independently reviewed. This is not a filename, property-name or renderer-wide exemption.',readers,records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const result=createInboxColumnsReview();if(process.argv.includes('--write'))fs.writeFileSync(manifest,JSON.stringify(result,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),result);console.log(JSON.stringify({records:result.records.length,readerSites:result.readers.length,passed:true}));
}
