import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {fileURLToPath} from 'node:url';
import {profileGridPath,profileGridSources,normalizeProfileGrid} from './atelier-profile-grid-source.mjs';import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {readRuntimeValues} from './atelier-runtime-values.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',req=createRequire(repo+'/package.json');export const profileTs=req('typescript');const ts=profileTs,postcss=req('postcss'),read=p=>normalizeProfileGrid(fs.readFileSync(p,'utf8')),properties=cssProperties(ts,read(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts')));
export function inspectProfileGrid(code){
 const bodies=profileGridSources();assert(code===bodies.after,'Only the exact nine-input migration qualifies');
 const sf=ts.createSourceFile(profileGridPath,code,99,true,4);assert.equal(sf.parseDiagnostics.length,0);
 const options={noLib:true,noResolve:true,jsx:ts.JsxEmit.Preserve},host=ts.createCompilerHost(options);host.getSourceFile=p=>p===profileGridPath?sf:undefined;host.fileExists=p=>p===profileGridPath;host.readFile=p=>p===profileGridPath?code:undefined;
 const checker=ts.createProgram([profileGridPath],options,host).getTypeChecker(),renderer=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='RadioGrid');assert(renderer);
 const rendererSymbol=checker.getSymbolAtLocation(renderer.name),centralImport=sf.statements.filter(ts.isImportDeclaration).flatMap(n=>n.moduleSpecifier.text==='@/lib/design/q-design-runtime'?(n.importClause?.namedBindings?.elements??[]):[]).find(n=>n.name.text==='QDPresentation');assert(centralImport);assert.equal((centralImport.propertyName??centralImport.name).text,'QDPresentation');const centralSymbol=checker.getSymbolAtLocation(centralImport.name),calls=[];
 function visit(n){if((ts.isJsxSelfClosingElement(n)||ts.isJsxOpeningElement(n))&&n.tagName.getText(sf)==='RadioGrid'){
  assert(checker.getSymbolAtLocation(n.tagName)===rendererSymbol);const cols=n.attributes.properties.filter(a=>ts.isJsxAttribute(a)&&a.name.text==='cols');assert.equal(cols.length,1);const a=cols[0];assert(ts.isJsxExpression(a.initializer));const expr=a.initializer.expression;assert(/^QDPresentation\.rendererInputs\.gridColumns\[[234]\]$/.test(expr.getText(sf)));
  let base=expr;while(ts.isPropertyAccessExpression(base)||ts.isElementAccessExpression(base))base=base.expression;assert(checker.getSymbolAtLocation(base)===centralSymbol,'No shadowed central input');calls.push(a);
 }ts.forEachChild(n,visit);}visit(sf);assert.equal(calls.length,9);
 const old=ts.createSourceFile(profileGridPath,bodies.before,99,true,4).statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='RadioGrid');assert.equal(renderer.getText(sf),old.getText(),'Choice behavior and renderer styles must remain unchanged');
 assert.equal(renderer.getText(sf).split('gridTemplateColumns: `repeat(${cols}, 1fr)`').length,2);
 return {sf,renderer,calls};
}
export function createProfileGridReview(){
 const code=read(repo+'/'+profileGridPath),inspection=inspectProfileGrid(code),runtime=read(root+'/source/design/atelier-runtime.ts'),copy=read(repo+'/lib/design/q-design-runtime.ts');assert(copy.endsWith(runtime));
 assert.deepEqual(readRuntimeValues(root).QDPresentation.rendererInputs.gridColumns,{'2':2,'3':3,'4':4});
 const raw=scanArguments(profileGridPath,code,{ts,postcss,properties}),line=n=>inspection.sf.getLineAndCharacterOfPosition(n.getStart(inspection.sf)).line+1,evidence=[{path:profileGridPath,line:line(inspection.renderer),hash:hash(code)},{path:'source/design/atelier-runtime.ts',line:104,hash:hash(runtime)},{path:'lib/design/q-design-runtime.ts',line:1,hash:hash(copy)}];
 const records=inspection.calls.map(a=>{const matches=raw.filter(r=>r.line===line(a)&&r.property==='cols'&&r.value===a.initializer.getText(inspection.sf));assert.equal(matches.length,1);const r=matches[0];return {path:profileGridPath,line:r.line,sourceHash:hash(code),argumentHash:hash(JSON.stringify(r)),property:r.property,value:r.value,decision:'token-reference-verified',ruleId:'exact-profile-choice-columns',reason:'This exact numeric input imports QDPresentation.rendererInputs.gridColumns and reaches the same local RadioGrid renderer. Only nine reviewed inputs changed; all options, callback expressions, selected states and renderer source remain byte-identical. No other columns, complete style objects or business option values are approved.',evidence};});
 return {version:1,scope:'Nine exact ProductProfileWizard RadioGrid column inputs only. The renderer and every other source expression retain their prior behavior.',records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const report=createProfileGridReview(),file=root+'/reviews/atelier-profile-grid-review.json';if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(read(file)),report);console.log(JSON.stringify({inputs:report.records.length}));}
