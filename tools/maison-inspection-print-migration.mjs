import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {formatProductCopy} from './copy-spacing.mjs';
import {beforeBatchPrintCanon} from './maison-batch-print-migration.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works';
export const inspectionProductRef='854d0bf3c65940853c624fed48afe0b74a9a5242',inspectionDesignRef='78b978664582369de850f1335bb824278ca3aad7';
export const inspectionPrintPath='app/(app)/inspections/[id]/record-sheet.tsx';
const manifest=root+'/reviews/maison-inspection-print-migration.json';
const ts=createRequire(repo+'/package.json')('typescript');
export async function planInspectionPrint(){
const canonical=execFileSync('git',['show',inspectionDesignRef+':patterns/foundation/maison-print.ts'],{cwd:root,encoding:'utf8'});
const sf=ts.createSourceFile('print.ts',canonical,99,true,3);
const additions={width:{v75:'75%',v14_5:'14.5%',v14_8:'14.8%',v14_9:'14.9%',v26_7:'26.7%',v24_2:'24.2%',v24_1:'24.1%',v6_6:'6.6%',v18_4:'18.4%'},height:{v21mm:'21mm',v26mm:'26mm',v15mm:'15mm',v30mm:'30mm'},fontSize:{v10_5pt:'10.5pt'},paddingLeft:{v6mm:'6mm'},gridTemplateColumns:{v1fr:'1fr'}};
const maps=new Map(),changes=[];let canonNode;
const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='qdPrint')canonNode=n.initializer.expression;ts.forEachChild(n,visit);};visit(sf);assert(ts.isObjectLiteralExpression(canonNode));
for(const prop of canonNode.properties){if(!ts.isPropertyAssignment(prop)||!ts.isObjectLiteralExpression(prop.initializer))continue;const name=prop.name.getText(sf).replaceAll('"','');const map=new Map();for(const m of prop.initializer.properties)if(ts.isPropertyAssignment(m)&&(ts.isStringLiteral(m.initializer)||ts.isNumericLiteral(m.initializer)))map.set(m.initializer.getText(sf),m.name.getText(sf).replaceAll('"',''));maps.set(name,map);if(additions[name]){const entries=Object.entries(additions[name]);for(const [key,value]of entries){assert(!map.has(JSON.stringify(value)));map.set(JSON.stringify(value),key);}changes.push({start:prop.initializer.getStart(sf)+1,end:prop.initializer.getStart(sf)+1,text:'\n'+entries.map(([key,v])=>'    '+JSON.stringify(key)+': '+JSON.stringify(v)+',').join('\n')+'\n'});}}
let afterCanon=canonical;for(const c of changes.sort((a,b)=>b.start-a.start))afterCanon=afterCanon.slice(0,c.start)+c.text+afterCanon.slice(c.end);
afterCanon=afterCanon.slice(0,canonNode.getStart(sf)+1)+'\n  inspectionMeasurements: { groupValueWidthPercent: 43.4 },'+afterCanon.slice(canonNode.getStart(sf)+1);
const file=inspectionPrintPath,before=execFileSync('git',['show',inspectionProductRef+':'+file],{cwd:repo,encoding:'utf8'}),source=ts.createSourceFile(file,before,99,true,4),edits=[];
const add=n=>{if(!ts.isPropertyAssignment(n)||!maps.has(n.name.getText(source)))return;let parent=n.parent,inline=false;while(parent){if(ts.isJsxAttribute(parent)){inline=parent.name.getText(source)==='style';break;}if(ts.isStatement(parent))break;parent=parent.parent;}if(!inline)return;
 const map=maps.get(n.name.getText(source));const leaves=x=>{const key=map.get(x.getText(source));if(key)edits.push({start:x.getStart(source),end:x.end,from:x.getText(source),text:'qdPrint.'+n.name.getText(source)+'.'+key});else if(ts.isConditionalExpression(x)){leaves(x.whenTrue);leaves(x.whenFalse);}};leaves(n.initializer);
};const walk=n=>{add(n);ts.forEachChild(n,walk);};walk(source);assert(edits.length>40);
const measurement=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ItemResult');assert(measurement);
const measured=[];const find=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(source)==='dimW'&&n.initializer?.getText(source)==='43.4 / dims.length')measured.push(n.initializer.left);ts.forEachChild(n,find);};find(measurement);assert.equal(measured.length,1);const factor=measured[0];edits.push({start:factor.getStart(source),end:factor.end,from:'43.4',text:'qdPrint.inspectionMeasurements.groupValueWidthPercent'});
let after=before;for(const e of edits.sort((a,b)=>b.start-a.start))after=after.slice(0,e.start)+e.text+after.slice(e.end);
const numberFrom='<th key={`n${ci}`}>{sampleLabel(no)}</th>',numberTo='<th key={`n${ci}`} style={{ whiteSpace: "nowrap", fontSize: qdPrint.fontSize.v8_5pt }}>{sampleLabel(no)}</th>';
assert.equal(after.split(numberFrom).length,3,'Exactly the PF and measurement sample-number headings');after=after.replaceAll(numberFrom,numberTo);
edits.push({from:numberFrom,text:numberTo,sites:2,reason:'Prevent sample identifiers from wrapping within the existing narrow printed number columns.'});
after=await formatProductCopy(repo,file,after);
return {file,edits,canonical:{path:'patterns/foundation/maison-print.ts',before:canonical,after:afterCanon},before,after};
}
export function beforeInspectionPrint(file,code){
 if(file!==inspectionPrintPath||!fs.existsSync(manifest))return code;
 const proof=JSON.parse(fs.readFileSync(manifest,'utf8'));
 if(hash(code)===proof.beforeHash)return code;
 assert.equal(hash(code),proof.afterHash,'Unreviewed inspection print source');
 const before=execFileSync('git',['show',inspectionProductRef+':'+file],{cwd:repo,encoding:'utf8'});assert.equal(hash(before),proof.beforeHash);return before;
}
export function inspectionPrintProof(plan){return {version:1,productRef:inspectionProductRef,designRef:inspectionDesignRef,path:plan.file,beforeHash:hash(plan.before),afterHash:hash(plan.after),scope:'Sixty inline appearance leaves, the measurement group width factor and the two PF/measurement sample-number heading sites. Existing dimensions, text, marks, sample order, approval cells, handlers and form structure retain their defaults. Seventeen missing appearance values enter the existing central paper canon. Sample identifiers additionally gain nowrap and the central 8.5pt font so #001 stays on one line in narrow columns.',canonical:{path:plan.canonical.path,beforeHash:hash(plan.canonical.before),afterHash:hash(plan.canonical.after)},sites:plan.edits};}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const plan=await planInspectionPrint(),proof=inspectionPrintProof(plan);
 if(process.argv.includes('--write')){
  if(fs.existsSync(manifest)){
   const previous=JSON.parse(fs.readFileSync(manifest,'utf8'));assert.equal(previous.productRef,inspectionProductRef);assert.equal(previous.designRef,inspectionDesignRef);assert.equal(previous.beforeHash,hash(plan.before));assert.equal(previous.sites.length,61,'Only the verified 61-leaf precursor may gain its sample-number wrap fix');
   assert.equal(hash(fs.readFileSync(repo+'/'+plan.file,'utf8')),previous.afterHash);assert.equal(hash(fs.readFileSync(root+'/'+plan.canonical.path,'utf8')),previous.canonical.afterHash);
  }else{assert.equal(hash(fs.readFileSync(repo+'/'+plan.file,'utf8')),hash(plan.before));assert.equal(hash(fs.readFileSync(root+'/'+plan.canonical.path,'utf8')),hash(plan.canonical.before));}
  fs.writeFileSync(root+'/'+plan.canonical.path,plan.canonical.after);fs.writeFileSync(repo+'/'+plan.file,plan.after);fs.writeFileSync(manifest,JSON.stringify(proof,null,2)+'\n');
 }else{
  assert.deepEqual(JSON.parse(fs.readFileSync(manifest,'utf8')),proof);assert.equal(hash(fs.readFileSync(repo+'/'+plan.file,'utf8')),hash(plan.after));assert.equal(hash(beforeBatchPrintCanon(fs.readFileSync(root+'/'+plan.canonical.path,'utf8'))),hash(plan.canonical.after));
 }
 console.log(JSON.stringify({sites:plan.edits.length,passed:true}));
}
