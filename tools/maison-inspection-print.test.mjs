import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import test from 'node:test';
import assert from 'node:assert/strict';
import {planInspectionPrint,beforeInspectionPrint,inspectionPrintPath,inspectionPrintProof} from './maison-inspection-print-migration.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',req=createRequire(repo+'/package.json'),ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server'),{JSDOM,VirtualConsole}=req('jsdom');
// JSDOM does not implement the shipped page-margin CSS syntax. These tests compare
// complete markup and inline styles; the real Edge fixture separately parses CSS.
const parseMarkup=markup=>new JSDOM(markup,{virtualConsole:new VirtualConsole().on('jsdomError',error=>{if(error.type!=='css parsing')throw error;})});
function loader(mainSource,printOverride){
 const cache=new Map();const load=file=>{
  if(cache.has(file))return cache.get(file).exports;
  const code=file===repo+'/'+inspectionPrintPath?mainSource:fs.readFileSync(file,'utf8'),module={exports:{}};cache.set(file,module);
  const resolve=name=>{
   if(name==='@/lib/design/q-design-print'&&printOverride)return {qdPrint:printOverride};
   if(name==='next/link')return {__esModule:true,default:({children,href,...p})=>React.createElement('a',{...p,href},children)};
   if(name==='@/app/(app)/documents/[id]/print/print-button')return {PrintButton:()=>null};
   if(name==='@/components/print/sheet-pagination')return {SheetPagination:()=>null};
   assert(!name.includes('supabase')&&name!=='server-only','No database or service module may execute');
   if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?repo+'/'+name.slice(2):path.resolve(path.dirname(file),name),found=[base,base+'.ts',base+'.tsx'].find(f=>fs.existsSync(f)&&/\.tsx?$/.test(f));assert(found,name);return load(found);}return req(name);
  };
  new Function('require','module','exports',ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(resolve,module,module.exports);return module.exports;
 };return load;
}
const current=fs.readFileSync(repo+'/'+inspectionPrintPath,'utf8');
const baseLoad=loader(current),print=baseLoad(repo+'/lib/design/q-design-print.ts').qdPrint,specs=baseLoad(repo+'/lib/inspections/record-sheet.ts').RECORD_SHEET_SPECS;
const fixture=(spec,size,dims)=>({id:'local-paper-fixture',formKind:'fixture',spec,company:{name:'검수 회사',nameEn:'Review'},logoUrl:null,formNo:'FORM-LOCAL',formRevision:1,head:{docNo:'DOC-LOCAL',lotNo:'LOT-LOCAL',inspectedOn:'2026-10-13',temperature:'22',passQty:'48',itemName:'검수 품목'},approvals:[{label:'작성',name:'작성자',date:'2026-10-13',sign:null},{label:'검토',name:'검토자',date:'2026-10-13',sign:null,concurrent:true},{label:'승인',name:'승인자',date:'2026-10-13',sign:null}],level:{lines:['표본 크기 41'],samplingLevel:'G-II',severity:'normal',total:false},items:[{key:'visual',label:'육안 검사',kind:'visual',failed:[1,3],measurements:{}},{key:'measure',label:'치수 검사',kind:'measure',failed:[],dims,measurements:{'1':Object.fromEntries(dims.map(x=>[x,'12.34']))}}],sampleSize:size,equipment:[{name:'버니어 캘리퍼스',assetNo:'ASSET-LOCAL',calibratedOn:'2026-10-01'}],notes:'검수 문장\n두 번째 줄',printedAt:'2026-10-13',printedBy:'검수 담당자'});
function render(code,data,p=print){const View=loader(code,p)(repo+'/'+inspectionPrintPath).InspectionRecordSheet;return renderToStaticMarkup(React.createElement(View,{data,embedded:true}));}
test('five actual inspection forms preserve all rendered markup except the intended sample-number styles',async()=>{
 const plan=await planInspectionPrint();assert.equal(current,plan.after);let cases=0;
 for(const spec of Object.values(specs))for(const size of [0,1,41])for(const dims of [[],['길이'],['가로','세로','높이']]){const data=fixture(spec,size,dims),before=parseMarkup(render(plan.before,data)).window.document,after=parseMarkup(render(current,data)).window.document;
  const identifiers=[...after.querySelectorAll('th')].filter(el=>/^#\d{3}$/.test(el.textContent));for(const el of identifiers){assert.equal(el.style.whiteSpace,'nowrap');assert.equal(el.style.fontSize,'8.5pt');el.removeAttribute('style');}
  assert.equal(before.body.innerHTML,after.body.innerHTML);cases++;}
 assert.equal(cases,45);
});
test('changed central widths, heading type and table spacing reach actual inspection markup while record text and cells stay identical',()=>{
 const changed=structuredClone(print);changed.width.v75='70%';changed.height.v21mm='24mm';changed.fontSize.v12_5pt='13pt';changed.marginTop.v3mm='4mm';changed.inspectionMeasurements.groupValueWidthPercent=42;
 const data=fixture(specs.wire_bending,41,['가로','세로','높이']),before=parseMarkup(render(current,data)).window.document,after=parseMarkup(render(current,data,changed)).window.document;
 assert.equal(before.body.textContent,after.body.textContent);assert.equal(before.querySelectorAll('td,th').length,after.querySelectorAll('td,th').length);
 assert(before.querySelector('col[style="width:75%"]'));assert(after.querySelector('col[style="width:70%"]'));
 assert(after.querySelector('[style*="height:24mm"]'));assert(after.querySelector('[style*="font-size:13pt"]'));assert(after.querySelector('[style*="margin-top:4mm"]'));
 const beforeWidths=[...before.querySelectorAll('col')].map(el=>el.style.width),afterWidths=[...after.querySelectorAll('col')].map(el=>el.style.width);assert(beforeWidths.includes('14.466666666666667%'));assert(afterWidths.includes('14%'));
});
test('whole-source inspection inverse rejects changed measurement or submission behavior and reproduces the exact saved migration',async()=>{
 const plan=await planInspectionPrint();assert.equal(beforeInspectionPrint(inspectionPrintPath,plan.after),plan.before);
 for(const edit of [s=>s.replace('qdPrint.inspectionMeasurements.groupValueWidthPercent / dims.length','40 / dims.length'),s=>s+'\nsubmitBusinessRecord();\n'])assert.throws(()=>beforeInspectionPrint(inspectionPrintPath,edit(plan.after)));
 assert.deepEqual(JSON.parse(fs.readFileSync(root+'/reviews/maison-inspection-print-migration.json','utf8')),inspectionPrintProof(plan));assert.equal(plan.edits.length,62);assert.equal(plan.edits.filter(e=>e.sites===2).length,1);
});
export {fixture,render,current,specs};
