import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {batchPrintPath} from './maison-batch-print-migration.mjs';
const repo='D:/Claude/Q-Works',req=createRequire(repo+'/package.json'),ts=req('typescript');
export const React=req('react'),renderToStaticMarkup=req('react-dom/server').renderToStaticMarkup;
export function batchLoader(code,printOverride){
 const cache=new Map();const load=file=>{if(cache.has(file))return cache.get(file).exports;const source=file===repo+'/'+batchPrintPath?code:fs.readFileSync(file,'utf8'),m={exports:{}};cache.set(file,m);
  const resolve=name=>{if(name==='@/lib/design/q-design-print'&&printOverride)return printOverride;assert(!name.includes('supabase')&&name!=='server-only','No business service executes in paper fixtures');if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?repo+'/'+name.slice(2):path.resolve(path.dirname(file),name),found=[base,base+'.ts',base+'.tsx'].find(f=>fs.existsSync(f)&&/\.tsx?$/.test(f));assert(found,name);return load(found);}return req(name);};
  new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(resolve,m,m.exports);return m.exports;};return load;
}
export const currentBatch=fs.readFileSync(repo+'/'+batchPrintPath,'utf8'),batchSpecs=batchLoader(currentBatch)(repo+'/lib/production/batch-record.ts').BATCH_SPECS,printExports=batchLoader(currentBatch)(repo+'/lib/design/q-design-print.ts');
export function batchFixture(spec,populated=false){
 const item={name:'검수 자재',no:'MAT-LOCAL-001',lot:'LOT-LOCAL-001',checked:true},semi={name:'검수 반제품',serial:'LOCAL-001',full:'LOT-LOCAL-001',expiry:'2027-10-13',qty:12,checked:true};
 const data={recordNo:'BATCH-LOCAL',lotNo:'LOT-LOCAL',mfgDate:'2026-10-13',prodQty:48,worker:{name:'작업자',signUrl:null,date:'2026-10-13'},manager:{name:'확인자',signUrl:null,date:'2026-10-13'},workRoom:'검수 작업실',prep:{worker:'준비 담당자',date:'2026-10-13'},process:{workers:'공정 담당자',date:'2026-10-13'},semi:populated?[semi]:[],raw:populated?[item]:[],equipment:populated?[item]:[],sub:populated?[item,item]:[],consumable:populated?[item]:[],semiCode:'LOCAL',modelName:'검수 모델',qty:{total:48,pass:47,fail:1},polishing:{agency:'검수 기관',outQty:48,inQty:48,lots:populated?[{serial:'LOCAL-001',full:'LOT-LOCAL-001',qty:48}]:[]},storage:{date:'2026-10-13',qty:48}};
 return {spec,data,company:{name:'검수 회사',nameEn:'Review'},logoUrl:null,formNo:'FORM-LOCAL',formRevision:1,printedAt:'2026-10-13',printedBy:'검수 담당자'};
}
export function renderBatch(code,props,override){const load=batchLoader(code,override),mod=load(repo+'/'+batchPrintPath);return renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(load(repo+'/components/print/print-styles.tsx').PrintStyles),React.createElement(mod.BatchSheetStyles),React.createElement(mod.BatchRecordSheet,props)));}
