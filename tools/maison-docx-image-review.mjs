import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {PARTS} from './sync-parts.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='1e27ab26c9900690a1013d0f4b5bcb541341a7c4',reviewRef='f3511d9f1e5371084357672801576e3cfbdcd868',tool='tools/maison-docx-image-review.mjs';
const ts=createRequire(repo+'/package.json')('typescript');
export const imagePath='lib/documents/docx-images.ts';
const callers=['lib/documents/form-common.ts','lib/documents/form-fill.ts','app/api/documents/form/route.ts'];
const read=f=>fs.readFileSync(repo+'/'+f,'utf8');
const old=f=>execFileSync('git',['show',ref+':'+f],{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024});
export function verifyImageSource(file,code){assert([imagePath,...callers,'lib/design/q-design-print.ts'].includes(file));assert.equal(hash(code),hash(old(file)),'Changed image pipeline requires a fresh review');}
const ast=(file,code)=>ts.createSourceFile(file,code,99,true,ts.ScriptKind.TS);
export function inspectImageBounds(overrides=new Map()){
 for(const f of[imagePath,...callers,'lib/design/q-design-print.ts'])verifyImageSource(f,overrides.get(f)??read(f));
 const part=PARTS.find(p=>p.to?.['Q-Works']===repo+'/lib/design/q-design-print.ts');
 // The canonical body and actual generated copy must remain identical.
 const primary=fs.readFileSync(root+'/patterns/foundation/maison-print.ts','utf8'),copy=overrides.get('lib/design/q-design-print.ts')??read('lib/design/q-design-print.ts');
 assert(part);assert.deepEqual(copyProblems(part,primary,copy),[],'DOCX box adapter must match the exact canonical body and fingerprint');
 const boxes=[];
 for(const file of runtimeFiles(repo).filter(f=>/\.[jt]sx?$/.test(f))){
  const code=overrides.get(file)??read(file),sf=ast(file,code);
  const visit=n=>{if(ts.isObjectLiteralExpression(n)){const bounds=n.properties.filter(p=>ts.isPropertyAssignment(p)&&['maxWidthMm','maxHeightMm'].includes(p.name.getText(sf)));if(bounds.length&&file!=='lib/design/q-design-print.ts'){assert.equal(bounds.length,2, file+': unexpected image-box producer');assert(['lib/documents/form-common.ts','lib/documents/form-fill.ts'].includes(file),'Unreviewed image-box producer');const w=bounds.find(p=>p.name.getText(sf)==='maxWidthMm'),h=bounds.find(p=>p.name.getText(sf)==='maxHeightMm');assert(w&&h);const expression=w.initializer.getText(sf);assert.equal(h.initializer.getText(sf),expression.replace(/\.w$/,'.h'));assert(['LOGO_BOX.w','SIGN_BOX.w','PHOTO_BOX.w'].includes(expression));boxes.push({file,line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,alias:expression.slice(0,-2)});} }ts.forEachChild(n,visit);};visit(sf);
 }
 assert.equal(boxes.length,4);assert.deepEqual(boxes.map(b=>b.alias).sort(),['LOGO_BOX','PHOTO_BOX','SIGN_BOX','SIGN_BOX']);
 const common=ast(callers[0],overrides.get(callers[0])??read(callers[0])),fill=ast(callers[1],overrides.get(callers[1])??read(callers[1]));
 const initializer=(sf,name)=>{const hits=[];const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(sf)===name)hits.push(n.initializer?.getText(sf));ts.forEachChild(n,visit);};visit(sf);assert.equal(hits.length,1);return hits[0];};
 assert.equal(initializer(common,'LOGO_BOX'),'qdPrint.docxBoxes.logo');assert.equal(initializer(common,'SIGN_BOX'),'qdPrint.signatures.approval');assert.equal(initializer(fill,'PHOTO_BOX'),'qdPrint.docxBoxes.photo');
 const imports=(sf,name,module)=>sf.statements.some(n=>ts.isImportDeclaration(n)&&n.moduleSpecifier.text===module&&n.importClause?.namedBindings?.elements?.some(e=>e.name.text===name));
 assert(imports(common,'qdPrint','@/lib/design/q-design-print'));assert(imports(fill,'qdPrint','@/lib/design/q-design-print'));assert(imports(fill,'SIGN_BOX','@/lib/documents/form-common'));
 const route=ast(callers[2],overrides.get(callers[2])??read(callers[2]));assert(imports(route,'DocxImageSink','@/lib/documents/docx-images'));
 const additions=[];const visit=n=>{if(ts.isCallExpression(n)&&n.expression.getText(route)==='sink.add')additions.push(n);ts.forEachChild(n,visit);};visit(route);assert.equal(additions.length,1);assert.equal(additions[0].arguments.length,1);assert.equal(additions[0].arguments[0].getText(route),'img');
 return boxes;
}
const targets=[
 [61,'object-property','height','view.getUint32(20)','coordinate-boundary'],[61,'object-property','width','view.getUint32(16)','coordinate-boundary'],
 [87,'object-property','height','view.getUint16(i + 5)','coordinate-boundary'],[87,'object-property','width','view.getUint16(i + 7)','coordinate-boundary'],
 [108,'object-property','cx','Math.max(cx, 1)','confirmed-style-composition'],[108,'object-property','cy','Math.max(cy, 1)','confirmed-style-composition'],
 ...[132,141].flatMap(line=>['cx','cy'].flatMap(p=>[[line,'dynamic-style','embedded-interpolation',p,'confirmed-style-composition'],[line,'html-attribute',p,'/*QD_DYNAMIC*/','confirmed-style-composition']])),
 [133,'html-attribute','r','0','structural-behavior'],[141,'html-attribute','x','0','structural-behavior'],[141,'html-attribute','y','0','structural-behavior'],
];
export function createImageReview(){
 const boxes=inspectImageBounds(),rows=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')).records,records=[];
 for(const[line,kind,property,value,decision]of targets){const hits=rows.filter(r=>r.path===imagePath&&r.line===line&&r.kind===kind&&r.property===property&&r.value===value);assert.equal(hits.length,1);const r=hits[0];assert.equal(r.sourceHash,hash(read(imagePath)));
 const reason=decision==='coordinate-boundary'?'This exact property reads an intrinsic PNG/JPEG dimension from image bytes. It is input geometry, not an authored layout size. Complete parser and caller sources are pinned.':decision==='structural-behavior'?'This exact zero is the drawing origin or effect extent in the pinned XML emitter. It does not introduce a visible box size. The complete image pipeline is pinned.':'This exact extent is derived by aspect-preserving fitting into the four inspected image-box producers. Logo, approval signature and photo bounds are direct qdPrint members from the verified canonical body. No authored replacement dimensions are approved. The separate 4:3 fallback remains unresolved.';
 records.push({path:r.path,line:r.line,value:r.value,sourceHash:r.sourceHash,argumentHash:r.argumentHash,decision,ruleId:'exact-docx-image-geometry',reason,evidence:[...[imagePath,...callers,'lib/design/q-design-print.ts'].map(f=>({path:f,line:1,hash:hash(read(f))})),...['patterns/foundation/maison-print.ts',tool].map(f=>({path:f,line:1,hash:hash(fs.readFileSync(root+'/'+f,'utf8'))}))]});
 }
 assert.equal(records.length,17);return{version:1,productRef:ref,scope:'Seventeen exact intrinsic dimensions, fitted extents and XML origins. Two authored fallback aspect-ratio leaves remain unknown.',boxes,records};
}
export function beforeImageStyleReport(current){
 const before=JSON.parse(execFileSync('git',['show',reviewRef+':reviews/maison-style-decisions.json'],{cwd:root,encoding:'utf8',maxBuffer:128*1024*1024}));if(JSON.stringify(current)===JSON.stringify(before))return current;
 const entries=new Map(createImageReview().records.map(r=>[r.argumentHash,r]));assert.equal(current.records.length,before.records.length);let changes=0;
 for(const[i,r]of current.records.entries()){const b=before.records[i],e=entries.get(r.argumentHash);if(e){assert.equal(b.decision,'unknown');for(const[k,v]of Object.entries(e))assert.deepEqual(r[k],v);assert.deepEqual({...r,decision:b.decision,ruleId:b.ruleId,reason:b.reason,evidence:b.evidence},b);changes++;}else assert.deepEqual(r,b);}
 assert.equal(changes,17);assert.deepEqual(current.counts,{...before.counts,unknown:before.counts.unknown-17,'coordinate-boundary':before.counts['coordinate-boundary']+4,'confirmed-style-composition':before.counts['confirmed-style-composition']+10,'structural-behavior':before.counts['structural-behavior']+3});assert.equal(current.unknownCount,current.counts.unknown);
 const meta=r=>{const v=structuredClone(r);for(const k of['generatedAt','records','counts','unknownCount'])delete v[k];return v;};assert.deepEqual(meta(current),meta(before));return before;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){const result=createImageReview(),file=root+'/reviews/maison-docx-image-review.json';if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),result);console.log(JSON.stringify({records:result.records.length,boxProducers:result.boxes.length,passed:true}));}
