import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const repo='D:/Claude/Q-Works',req=createRequire(repo+'/package.json'),ts=req('typescript'),React=req('react'),render=req('react-dom/server').renderToStaticMarkup;
export const incidentPath='app/(app)/safety/incidents/incident-sheet.tsx',monthPath='app/(app)/safety/monthly/month-sheet.tsx';
export function safetyDesignExports(){const m={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync(repo+'/lib/design/q-design-print.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(req,m,m.exports);const safety={exports:{}};new Function('require','module','exports',ts.transpileModule(fs.readFileSync('D:/Claude/Q-Works/lib/design/q-design-safety-print.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(req,safety,safety.exports);return {...m.exports,...safety.exports};}
const stamp={created_by:null,submitted_at:null,reviewed_by:null,reviewed_at:null,review_concurrent:false,approved_by:null,approved_at:null,approve_omitted:false};
export function incidentFixture(count=1,long=false){return {head:{...stamp,id:'LOCAL',incident_no:'LOCAL-001',subject:'검수 대상',created_at:'2026-10-13'},departmentName:'검수 부서',entries:Array.from({length:count},(_,i)=>({id:'LOCAL-'+i,recorded_on:'2026-10-13',symptom:long?'긴문구줄바꿈검수'.repeat(20):'첫째 줄\n둘째 줄',work_stopped:true,first_aid:false,medical_referral:false,action_taken:'조치 내용\n확인 내용',handler_id:'LOCAL',notes:'검수 비고'})),nameOf:()=> '검수 담당자'};}
export function monthFixture(areas=7,lastDay=31){return {sheet:{...stamp,id:'LOCAL'},lastDay,areas:Array.from({length:areas},(_,i)=>({id:'AREA-'+i,name:'원/부자재 보관실 '+(i+1),temp_min:1,temp_max:30,humidity_min:null,humidity_max:null})),values:new Map([['morning:AREA-0:1',{t:22,h:43}]]),skips:new Set(['afternoon:1'])};}
export async function renderSafety(file,source,data,override){
 const cache=new Map();const load=file=>{if(cache.has(file))return cache.get(file).exports;const code=file===repo+'/'+incidentPath||file===repo+'/'+monthPath?source:fs.readFileSync(file,'utf8'),m={exports:{}};cache.set(file,m);
  const resolve=name=>{
   if(name==='@/lib/print/sheet-chrome')return {loadSheetChrome:async()=>({company:{name:'검수 회사',name_en:'Review',logoUrl:null},approvals:['작성','검토','승인'].map(label=>({label,name:'검수 담당자',date:'2026-10-13',signUrl:null})),printedBy:'검수 담당자'})};
   if(name==='@/lib/safety/env-month-sheet')return {loadEnvMonthSheet:async()=>data};
   if(name==='@/lib/design/q-design-print'&&override)return override;
   if(name==='@/lib/design/q-design-safety-print')return override?.qdSafetyPrint?{qdSafetyPrint:override.qdSafetyPrint}:load('D:/Claude/Q-Works/lib/design/q-design-safety-print.ts');
   if(name==='next/link')return {__esModule:true,default:({children,href,...props})=>React.createElement('a',{...props,href},children)};
   if(name==='@/app/(app)/documents/[id]/print/print-button')return {PrintButton:()=>null};
   if(name==='@/components/print/sheet-pagination')return {SheetPagination:()=>null};
   assert(!name.includes('supabase')&&name!=='server-only','No real business service executes in this fixture');
   if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?repo+'/'+name.slice(2):path.resolve(path.dirname(file),name),found=[base,base+'.ts',base+'.tsx'].find(f=>fs.existsSync(f)&&/\.tsx?$/.test(f));assert(found,name);const mod=load(found);if(name==='@/components/print/format')return {...mod,printStamp:()=> '2026-10-13'};return mod;}return req(name);
  };
  new Function('require','module','exports',ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(resolve,m,m.exports);return m.exports;
 };
 const mod=load(repo+'/'+file),node=file===incidentPath?await mod.IncidentSheet({tenantId:'LOCAL',data,embedded:true}):await mod.EnvMonthSheet({tenantId:'LOCAL',month:'2026-10',embedded:true});return node?render(node):'';
}
