// One explicit optional presentation parameter. Caller styles retain their own decisions.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {inspectPurchasingDocsRole} from './maison-purchasing-docs-role.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',file='components/shared/list-stats.tsx',renderer='components/shared/stat-block.tsx',ts=createRequire(repo+'/package.json')('typescript');
export function inspectOptionalStatsColumns(code){
 const sf=ts.createSourceFile(file,code,99,true,4),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ListStats');assert(fn);
 const parameter=fn.parameters[0];assert(ts.isObjectBindingPattern(parameter.name));assert(parameter.name.elements.some(n=>n.name.getText(sf)==='cols'));
 const type=parameter.type;assert(ts.isTypeLiteralNode(type));const member=type.members.find(n=>n.name?.getText(sf)==='cols');assert(member?.questionToken&&member.type.kind===ts.SyntaxKind.NumberKeyword);
 const imports=sf.statements.filter(ts.isImportDeclaration);assert(imports.some(n=>n.moduleSpecifier.text==='@/components/shared/stat-block'&&n.importClause.namedBindings.elements.some(s=>s.name.text==='StatRow'&&!s.propertyName)));
 const uses=[],attrs=[];const visit=n=>{if(ts.isIdentifier(n)&&n.text==='cols'&&n!==member.name&&!ts.isBindingElement(n.parent))uses.push(n);if(ts.isJsxAttribute(n)&&n.name.text==='cols')attrs.push(n);ts.forEachChild(n,visit);};visit(fn.body);
 assert.equal(attrs.length,1);const attr=attrs[0];assert(ts.isJsxExpression(attr.initializer)&&attr.initializer.expression?.getText(sf)==='cols');assert.equal(attr.parent.parent.tagName.getText(sf),'StatRow');
 assert.equal(uses.length,2);assert(uses.includes(attr.name)&&uses.includes(attr.initializer.expression),'Only one exact forwarding use is accepted');
 return {line:sf.getLineAndCharacterOfPosition(attr.getStart(sf)).line+1,value:attr.initializer.getText(sf)};
}
export async function createStatsColumnsReview(){
 const migration=await inspectPurchasingDocsRole(),record=migration.records.find(r=>r.path===file),code=fs.readFileSync(repo+'/'+file,'utf8');assert.equal(hash(code),record.afterHash);
 const slot=inspectOptionalStatsColumns(code),target=fs.readFileSync(repo+'/'+renderer,'utf8');assert(target.includes('const count = cols ?? Math.max(1, React.Children.toArray(children).length)')&&target.includes('"--stat-cols": count')&&target.includes('lg:[grid-template-columns:repeat(var(--stat-cols),minmax(0,1fr))]'));
 const main=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),rows=main.records.filter(r=>r.path===file&&r.kind==='presentation-attribute'&&r.property==='cols'&&r.line===slot.line&&r.value===slot.value);assert.equal(rows.length,1);assert.equal(rows[0].sourceHash,hash(code));
 return {version:1,scope:'One exact optional ListStats.cols forwarding site to the actual StatRow CSS column renderer. Counts, queries and other caller appearance inputs are separate.',records:rows.map(row=>({path:file,line:row.line,sourceHash:row.sourceHash,argumentHash:row.argumentHash,value:row.value,decision:'delegated-renderer-parameter',ruleId:'exact-optional-list-stats-columns',reason:'The optional numeric presentation parameter has exactly one forwarding use, the named imported StatRow.cols argument. The actual renderer uses it only as --stat-cols and retains automatic child count when omitted. Runtime tests compare all database count inputs and card text before/after the column mutation; caller values retain their own argument records.',evidence:[{path:file,line:row.line,hash:hash(code)},{path:renderer,line:1,hash:hash(target)},{path:'tools/maison-list-stats-columns-review.mjs',line:1,hash:hash(fs.readFileSync(root+'/tools/maison-list-stats-columns-review.mjs','utf8'))}]}))};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const report=await createStatsColumnsReview(),target=root+'/reviews/maison-list-stats-columns-review.json';if(process.argv.includes('--write'))fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),report);
 console.log(JSON.stringify({records:report.records.length,passed:true}));
}
