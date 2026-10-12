import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {safetyPlan,beforeSafetyPrint,safetyMigrationProof,safetyCanonicalPath} from './maison-safety-print-migration.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',tool='tools/maison-safety-print-review.mjs',ts=createRequire(repo+'/package.json')('typescript');
export function createSafetyPrintReview(){
 const plan=safetyPlan();safetyMigrationProof();const rows=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')).records,records=[];
 for(const f of plan){const code=fs.readFileSync(repo+'/'+f.file,'utf8');beforeSafetyPrint(f.file,code);const sf=ts.createSourceFile(f.file,code,99,true,4),lengths=new Map(),bindings=new Map();
  const walk=n=>{if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name))bindings.set(n.name.text,n.initializer?.getText(sf));if(ts.isCallExpression(n)&&n.expression.getText(sf)==='Array.from'&&n.arguments[0]&&ts.isObjectLiteralExpression(n.arguments[0]))for(const p of n.arguments[0].properties)if(ts.isPropertyAssignment(p)&&p.name.getText(sf)==='length')lengths.set(sf.getLineAndCharacterOfPosition(p.getStart(sf)).line+1,p.initializer.getText(sf));ts.forEachChild(n,walk);};walk(sf);
  const relevant=rows.filter(r=>r.path===f.file);for(const r of relevant){let decision,reason;
   if(r.kind==='object-property'&&r.property==='length'&&lengths.get(r.line)===r.value&&['blanks','data.lastDay'].includes(r.value)){
    if(r.value==='blanks')assert.equal(bindings.get('blanks'),'Math.max(INCIDENT_PRINT_ROWS - data.entries.length, 0)');decision='structural-behavior';reason='This exact builtin Array.from first argument generates the original blank incident rows or calendar day rows. It is a record count, not CSS length. The whole pinned source inverse preserves the original seven-slot minimum and lastDay input.';
   }
   if(r.kind==='style-expression'&&r.value==='{SLASH}'){
    assert.equal(bindings.get('SLASH'),'qdSafetyPrint.unmeasured');decision='token-reference-verified';reason='This exact td style reads the local immutable alias of the synchronized central unmeasured-cell recipe. Whole-source verification rejects other alias initializers or changed consumers. The physical slash, black ink and exact print color behavior remain owned by the central safety adapter.';
   }
   if(r.kind==='object-property'&&r.property==='width'&&r.value==='areaWidth'||r.kind==='style-expression'&&r.value==='{{ width: areaWidth }}'){
    assert.equal(bindings.get('areaWidth'),'`${qdSafetyPrint.areaWidthPercent / Math.max(data.areas.length, 1)}%`');decision='token-reference-verified';reason='The exact month-table col width divides the central area-width share by the original area count with the original minimum-one denominator. The enclosing style object contains only this width. Changed source, fallback values or additional style members cannot inherit the proof. Actual central mutation tests preserve all recorded text and cell counts.';
   }
   if(decision)records.push({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,value:r.value,decision,ruleId:'exact-safety-paper-consumer',reason,evidence:[...[{path:f.file,line:r.line,hash:hash(code)},{path:safetyCanonicalPath,line:1,hash:hash(fs.readFileSync(root+'/'+safetyCanonicalPath,'utf8'))}],...['lib/design/q-design-safety-print.ts','lib/design/q-design-print.ts'].map(p=>({path:p,line:1,hash:hash(fs.readFileSync(repo+'/'+p,'utf8'))})),... [tool,'tools/maison-safety-print-migration.mjs','tools/maison-safety-print.test.mjs'].map(p=>({path:p,line:1,hash:hash(fs.readFileSync(root+'/'+p,'utf8'))}))]});
  }
 }
 assert.equal(records.length,5);assert.equal(new Set(records.map(r=>r.argumentHash)).size,5);return {version:1,scope:'Only five exact safety-paper compositions and row counts. All source bytes are constrained by the independently reviewed migration inverse; other arguments remain independently indexed.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){const result=createSafetyPrintReview(),manifest=root+'/reviews/maison-safety-print-review.json';if(process.argv.includes('--write'))fs.writeFileSync(manifest,JSON.stringify(result,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),result);console.log(JSON.stringify({records:result.records.length,passed:true}));}
