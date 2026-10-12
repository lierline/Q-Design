import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {planInspectionPrint,inspectionPrintPath,inspectionDesignRef,inspectionProductRef} from './maison-inspection-print-migration.mjs';
import {beforeBatchPrintCanon} from './maison-batch-print-migration.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',name='reviews/maison-inspection-print-review.json',tool='tools/maison-inspection-print-review.mjs',ts=createRequire(repo+'/package.json')('typescript');
const currentHash=file=>{const base=/^(?:source|patterns|dist|tools)\//.test(file)?root:repo;return fs.existsSync(base+'/'+file)?hash(fs.readFileSync(base+'/'+file,'utf8')):null;};
export function inspectMeasurementConsumer(code){
 const sf=ts.createSourceFile(inspectionPrintPath,code,99,true,4),functions=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ItemResult');assert.equal(functions.length,1);
 const dims=[],widths=[],headers=[];const visit=n=>{
  if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='dims')dims.push(n.initializer?.getText(sf));
  if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='dimW')widths.push(n.initializer?.getText(sf).replace(/\s+/g,''));
  if(ts.isJsxAttribute(n)&&n.name.text==='style'&&n.initializer?.getText(sf).replace(/\s+/g,'')==='{spec.headerStrip?{marginTop:qdPrint.marginTop.v3mm}:undefined}')headers.push(n);
  ts.forEachChild(n,visit);
 };visit(sf);
 assert.deepEqual(dims,['item.dims && item.dims.length > 0 ? item.dims : ["측정값"]']);
 assert.deepEqual(widths,['qdPrint.inspectionMeasurements.groupValueWidthPercent/dims.length']);assert.equal(headers.length,1);
 const data=fs.readFileSync(repo+'/lib/inspections/record-sheet.ts','utf8'),items=fs.readFileSync(repo+'/lib/inspections/form-items.ts','utf8');assert(/export type SheetItem = InspectionFormItem &/.test(data),'SheetItem must preserve its inspected parent type');assert(/dims\?:\s*readonly string\[\]/.test(items),'Measurement labels must remain a readonly string array');
 const rowWidth=[];const search=n=>{if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='width'&&n.initializer.getText(sf)==='`${dimW}%`')rowWidth.push(n);ts.forEachChild(n,search);};search(functions[0]);assert.equal(rowWidth.length,1);
 assert.match(rowWidth[0].parent.parent.parent.getText(sf),/^style=\{/);return {sf,headers:headers.map(n=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1),widthLine:sf.getLineAndCharacterOfPosition(rowWidth[0].getStart(sf)).line+1};
}
export async function createInspectionPrintReview(){
 const plan=await planInspectionPrint(),currentCanon=fs.readFileSync(root+'/'+plan.canonical.path,'utf8');assert.equal(currentHash(inspectionPrintPath),hash(plan.after));assert.equal(hash(beforeBatchPrintCanon(currentCanon)),hash(plan.canonical.after));
 const program=source=>{const module={exports:{}};new Function('exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(module.exports,module);return module.exports;};
 const old=program(plan.canonical.before),next=program(currentCanon);
 const subset=(before,after)=>{for(const [key,value]of Object.entries(before))if(value&&typeof value==='object')subset(value,after[key]);else assert.deepEqual(after[key],value,'Existing central print member changed');};subset(old,next);
 const copy='lib/design/q-design-print.ts',copyBefore=execFileSync('git',['show',inspectionProductRef+':'+copy],{cwd:repo,encoding:'utf8'}),copyAfter=fs.readFileSync(repo+'/'+copy,'utf8');assert(copyAfter.includes(currentCanon.trim()));
 const changes=new Map([[plan.canonical.path,{before:hash(plan.canonical.before),after:hash(currentCanon)}],[copy,{before:hash(copyBefore),after:hash(copyAfter)}]]);
 const previous=JSON.parse(execFileSync('git',['show',inspectionDesignRef+':reviews/maison-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024})),prior=new Map(previous.records.map(r=>[r.argumentHash,r]));
 const main=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),records=[];
 for(const r of main.records){
  if(r.path===inspectionPrintPath||r.decision!=='unknown'&&r.ruleId!=='unchanged-print-member-evidence')continue;
  const old=prior.get(r.argumentHash);if(!old||old.decision==='unknown'||old.sourceHash!==r.sourceHash||!old.evidence?.some(e=>changes.has(e.path)))continue;
  const evidence=[];let valid=true;for(const e of old.evidence){const changed=changes.get(e.path);if(changed){if(e.hash!==changed.before){valid=false;break;}evidence.push({...e,hash:changed.after});}else{if(currentHash(e.path)!==e.hash){valid=false;break;}evidence.push(e);}}if(!valid)continue;
  records.push({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,value:r.value,decision:old.decision,ruleId:'unchanged-print-member-evidence',reason:'Exact unchanged candidate, complete consumer and all other evidence. The verified central change adds paper values only; every pre-existing exported member remains identical. Changed inspection candidates are excluded. Prior consumer proof: '+old.reason,evidence:[...evidence,{path:tool,line:1,hash:currentHash(tool)}]});
 }
 const consumer=inspectMeasurementConsumer(plan.after);
 for(const r of main.records.filter(r=>r.path===inspectionPrintPath&&['style','width'].includes(r.property))){
  const conditional=r.property==='style'&&consumer.headers.includes(r.line)&&r.value.replace(/\s+/g,'')==='{spec.headerStrip?{marginTop:qdPrint.marginTop.v3mm}:undefined}';
  const measured=r.line===consumer.widthLine&&(r.property==='width'&&r.value==='`${dimW}%`'||r.property==='style'&&r.value.replace(/\s+/g,'')==='{{width:`${dimW}%`}}');
  if(!conditional&&!measured)continue;
  records.push({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,value:r.value,decision:conditional?'confirmed-style-composition':'token-reference-verified',ruleId:'exact-inspection-print-expression',reason:conditional?'The exact boolean headerStrip condition chooses either the independently central marginTop role or no style. No new appearance literal or data mutation.':'The actual measurement column width divides the central groupValueWidthPercent by the number of typed string measurement labels. The empty-label fallback guarantees a positive divisor. Actual render mutation tests verify this role changes columns while all record values, sample order and cells stay unchanged.',evidence:[{path:inspectionPrintPath,line:r.line,hash:hash(plan.after)},{path:plan.canonical.path,line:1,hash:hash(currentCanon)},{path:copy,line:1,hash:hash(copyAfter)},{path:'lib/inspections/record-sheet.ts',line:1,hash:currentHash('lib/inspections/record-sheet.ts')},{path:'lib/inspections/form-items.ts',line:1,hash:currentHash('lib/inspections/form-items.ts')},{path:tool,line:1,hash:currentHash(tool)},{path:'tools/maison-inspection-print.test.mjs',line:1,hash:currentHash('tools/maison-inspection-print.test.mjs')}]});
 }
 return {version:1,scope:'Exact unchanged print evidence plus three inspected conditional/measurement expressions. No whole file, whole renderer or numeric coincidence approval.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const result=await createInspectionPrintReview();if(process.argv.includes('--write'))fs.writeFileSync(root+'/'+name,JSON.stringify(result,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(root+'/'+name,'utf8')),result);
 console.log(JSON.stringify({records:result.records.length,expressions:result.records.filter(r=>r.path===inspectionPrintPath).length,passed:true}));
}
