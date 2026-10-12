import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {verifyIdentityHandoffSite} from './maison-handoff-roles.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),product=resolve(root,'../Q-Works');
const require=createRequire(join(product,'package.json')),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{JSDOM}=require('jsdom'),postcss=require('postcss');
function loader(overrides={}){
  const cache=new Map();
  const load=file=>{
    if(cache.has(file))return cache.get(file).exports;
    const source=readFileSync(file,'utf8'),js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
    const module={exports:{}};cache.set(file,module);
    const localRequire=name=>{
      if(name in overrides)return overrides[name];
      if(name==='server-only')return {};
      if(name.startsWith('@/')||name.startsWith('.')){
        const base=name.startsWith('@/')?join(product,name.slice(2)):resolve(dirname(file),name);
        const found=[base,base+'.ts',base+'.tsx',join(base,'index.ts')].find(candidate=>existsSync(candidate)&&/\.[jt]sx?$/.test(candidate));
        if(!found)throw new Error(`Missing test dependency ${name} from ${file}`);
        return load(found);
      }return require(name);
    };
    new Function('require','module','exports',js)(localRequire,module,module.exports);
    return module.exports;
  };return load;
}
const documentFor=node=>new JSDOM(renderToStaticMarkup(node)).window.document;
const runtime=loader()(join(product,'lib/design/q-design-runtime.ts')).qdMaison;
const print=loader()(join(product,'lib/design/q-design-print.ts')).qdPrint;
const declarations=css=>{const values={};postcss.parse(css).walkDecls(decl=>{if(decl.prop.startsWith('--'))values[decl.prop]=decl.value;});return values;};
const css=readFileSync(join(root,'patterns/foundation/maison.css'),'utf8');
const resolveScalar=(value,values)=>value.replace(/var\((--[\w-]+)\)/g,(_,name)=>{assert.ok(name in values,name);return values[name];});

test('KPI classification row count follows a mutated central layout setting without changing cards or data',()=>{
  const props={counts:{},active:null,all:{total:12,short:2,unmeasured:3,evalTotal:9,evalApproved:7}};
  const baseline=loader()(join(product,'components/kpi/classification-summary.tsx')).ClassificationSummary;
  const changed={...runtime,statRowColumns:{...runtime.statRowColumns,kpiClassification:2}};
  const modified=loader({'@/lib/design/q-design-runtime':{qdMaison:changed}})(join(product,'components/kpi/classification-summary.tsx')).ClassificationSummary;
  const before=documentFor(React.createElement(baseline,props)),after=documentFor(React.createElement(modified,props));
  assert.equal(before.querySelector('.qd-grid-kpi').style.getPropertyValue('--stat-cols'),'4');
  assert.equal(after.querySelector('.qd-grid-kpi').style.getPropertyValue('--stat-cols'),'2');
  assert.deepEqual([...before.querySelectorAll('.qd-kpi-value')].map(x=>x.textContent),[...after.querySelectorAll('.qd-kpi-value')].map(x=>x.textContent));
  assert.equal(runtime.statRowColumns.purchasingAnalysis,4);
  for(const file of ['savings-tab.tsx','delivery-tab.tsx'])assert.match(readFileSync(join(product,'app/(app)/purchasing/analysis',file),'utf8'),/<StatRow cols=\{qdMaison\.statRowColumns\.purchasingAnalysis\}>/);
});

test('real RowsEditor emits a token reference and a changed central width resolves through that actual table style',()=>{
  const {RowsEditor}=loader()(join(product,'components/shared/rows-editor.tsx'));
  const doc=documentFor(React.createElement(RowsEditor,{columns:[{key:'name',label:'항목'}],rows:[],onChange(){},empty:()=>({name:''}),minWidth:'var(--qd-maison-min-width-900px)',addLabel:'추가'}));
  const style=doc.querySelector('table').style.minWidth,values=declarations(css);
  assert.equal(resolveScalar(style,values),'900px');
  assert.equal(resolveScalar(style,{...values,'--qd-maison-min-width-900px':'1024px'}),'1024px');
  assert.ok(doc.querySelector('button'));
});

test('both actual purchasing tabs consume a changed central column role while preserving their four cards and values',async()=>{
 const common={
  'next/link':{__esModule:true,default:({href,children,...props})=>React.createElement('a',{href:typeof href==='string'?href:'#',...props},children)},
  '@/lib/purchasing/savings-data':{loadSavingRows:async()=>[],loadQuoteVariance:async()=>[]},
  '@/lib/purchasing/analysis-data':{PURCHASE_ROW_CAP:1000,loadPurchaseAnalysis:async()=>({rows:[],suppliers:[],truncated:false,error:null})},
  '@/components/shared/list-filter-select':{ListFilterSelect:()=>null},
  '@/components/shared/pagination':{ListPagination:()=>null,PageSizeSelect:()=>null},
  '@/lib/supabase/server':{createClient:()=>{throw Error('No business-service calls allowed in the layout fixture');}},
  './saving-row-actions':{SavingRowActions:()=>null},
 };
 const props={sp:{},p:{page:1,size:20},tenantId:'local-fixture',thisYear:'2026',tabs:null,lines:[],claimable:[],docs:[],userId:'local-fixture',canWrite:false};
 for(const [file,name]of [['savings-tab.tsx','SavingsTab'],['delivery-tab.tsx','DeliveryTab']]){
  const render=async count=>{const View=loader({...common,'@/lib/design/q-design-runtime':{qdMaison:{...runtime,statRowColumns:{...runtime.statRowColumns,purchasingAnalysis:count}}}})(join(product,'app/(app)/purchasing/analysis',file))[name];return documentFor(await View(props));};
  const before=await render(4),after=await render(2);
  assert.equal(before.querySelector('.qd-grid-kpi').style.getPropertyValue('--stat-cols'),'4');assert.equal(after.querySelector('.qd-grid-kpi').style.getPropertyValue('--stat-cols'),'2');
  assert.equal(before.querySelectorAll('.qd-kpi').length,4);assert.equal(after.querySelectorAll('.qd-kpi').length,4);
  assert.deepEqual([...before.querySelectorAll('.qd-kpi')].map(e=>e.textContent),[...after.querySelectorAll('.qd-kpi')].map(e=>e.textContent));
 }
});

test('actual docs ListStats forwards the central column override without altering database count inputs or default callers',async()=>{
 const calls=[];
 const {ListStats}=loader({'@/lib/ui/stat-counts':{countStats:async(...args)=>{calls.push(args);return [0,0,0,0];},statValue:v=>v}})(join(product,'components/shared/list-stats.tsx'));
 const base={menu:'/purchasing/analysis#docs',tenantId:'local-fixture'};
 const before=documentFor(await ListStats({...base,cols:4})),after=documentFor(await ListStats({...base,cols:2})),automatic=documentFor(await ListStats(base));
 assert.equal(before.querySelector('.qd-grid-kpi').style.getPropertyValue('--stat-cols'),'4');assert.equal(after.querySelector('.qd-grid-kpi').style.getPropertyValue('--stat-cols'),'2');assert.equal(automatic.querySelector('.qd-grid-kpi').style.getPropertyValue('--stat-cols'),'4');
 assert.equal(before.querySelectorAll('.qd-kpi').length,4);assert.deepEqual([...before.querySelectorAll('.qd-kpi')].map(e=>e.textContent),[...after.querySelectorAll('.qd-kpi')].map(e=>e.textContent));
 assert.deepEqual(calls[0],calls[1]);assert.deepEqual(calls[0],calls[2]);
});
test('real KPI chart shape changes from a mutated central numeric adapter while target dash stays token-bound',()=>{
  const props={points:[{label:'1월',value:20},{label:'2월',value:40}],target:50,yMin:0,yMax:100,unit:'점',direction:'higher_better'};
  const baseline=loader()(join(product,'app/(app)/kpi/[id]/trend-chart.tsx')).KpiTrendChart;
  const changed=structuredClone(runtime);changed.chart.trend.width=720;changed.chart.trend.height=240;
  const mutated=loader({'@/lib/design/q-design-runtime':{qdMaison:changed}})(join(product,'app/(app)/kpi/[id]/trend-chart.tsx')).KpiTrendChart;
  const before=documentFor(React.createElement(baseline,props)),after=documentFor(React.createElement(mutated,props));
  assert.equal(before.querySelector('svg').getAttribute('viewBox'),'0 0 600 180');
  assert.equal(after.querySelector('svg').getAttribute('viewBox'),'0 0 720 240');
  const target=[...after.querySelectorAll('line')].find(line=>line.style.strokeDasharray);
  assert.equal(resolveScalar(target.style.strokeDasharray,declarations(css)),'4 3');
  assert.equal(resolveScalar(target.style.strokeDasharray,{...declarations(css),'--qd-chart-target-dash':'8 2'}),'8 2');
  assert.notEqual(before.querySelector('path[fill="none"]').getAttribute('d'),after.querySelector('path[fill="none"]').getAttribute('d'));
});
test('paper ink mutation reaches real ConcurrentSlash without changing line geometry',()=>{
  const mutated={...print,ink:'#123456'};
  const {ConcurrentSlash}=loader({'@/lib/design/q-design-print':{qdPrint:mutated}})(join(product,'components/print/concurrent-slash.tsx'));
  const line=documentFor(React.createElement(ConcurrentSlash)).querySelector('line');
  assert.equal(line.getAttribute('stroke'),'#123456');
  assert.equal(line.getAttribute('x1'),'0');assert.equal(line.getAttribute('y1'),'100%');
  assert.equal(line.style.strokeWidth,print.strokeWidth.v0_2mm);
});
test('mutating the central QR default changes actual canvas dimensions without altering payload',()=>{
  const {QrCode}=loader({'@/lib/design/q-design-runtime':{qdMaison:{...runtime,qrSize:128}}})(join(product,'components/shared/qr-code.tsx'));
  const canvas=documentFor(React.createElement(QrCode,{value:'QD-LOCAL-TEST'})).querySelector('canvas');
  assert.equal(canvas.width,128);assert.equal(canvas.height,128);
  assert.equal(canvas.getAttribute('aria-label'),'QR 코드: QD-LOCAL-TEST');
});
test('Excel width mapping and conditional paper dimensions preserve original defaults in the canon',()=>{
  assert.deepEqual([...Object.values(print.worksheetWidths)],[20,28,14,14,18,12,26,16,36,18,76]);
  assert.deepEqual(print.attachmentHeight,{single:'205mm',paired:'102mm'});
  const source=readFileSync(join(product,'lib/import/suppliers-xlsx.ts'),'utf8');
  assert.equal([...source.matchAll(/width: qdPrint\.worksheetWidths\./g)].length,11);
  assert.ok(!/width:\s*\d/.test(source));
});
test('real Maison empty state follows the current glyph-free canon even with a legacy icon prop',()=>{
  const {EmptyState}=loader()(join(product,'components/shared/empty-state.tsx'));
  const icon=()=>React.createElement('svg',{'data-legacy-icon':true});
  const doc=documentFor(React.createElement(EmptyState,{icon,title:'기록 없음',description:'새 기록을 등록하세요.',action:React.createElement('button',null,'추가')}));
  assert.equal(doc.querySelector('.qd-empty-title').textContent,'기록 없음');
  assert.equal(doc.querySelectorAll('svg,.qd-empty-icon').length,0);
  assert.equal(doc.querySelector('.qd-empty-actions button').textContent,'추가');
});
test('company mark maximum height follows a changed paper canon, and reviewed explicit identity sizes stay connected',()=>{
  const changed={...print,companyMark:{...print.companyMark,maxHeightMm:19}};
  const {CompanyMark}=loader({'@/lib/design/q-design-print':{qdPrint:changed}})(join(product,'components/print/company-mark.tsx'));
  const img=documentFor(React.createElement(CompanyMark,{name:'로컬 검증',logoUrl:'/local-logo.png'})).querySelector('img');
  assert.equal(img.style.maxHeight,'19mm');
  const migration=JSON.parse(readFileSync(join(root,'reviews/maison-identity-size-migration.json'),'utf8'));
  assert.equal(migration.sites.length,24);
  for(const site of migration.sites){
    if(verifyIdentityHandoffSite(site))continue;
    const source=readFileSync(join(product,site.path),'utf8');
    assert.ok(source.includes(`${site.property}={${site.replacement}}`),site.path);
    const [owner,...keys]=site.replacement.split('.');
    const value=keys.reduce((entry,key)=>entry[key],owner==='qdPrint'?print:runtime);
    assert.equal(value,Number(site.original),site.path);
  }
});
test('actual period-chart bar width, axis labels and target endpoint follow changed central geometry settings',()=>{
  const props={values:[{period_date:'2026-01-01',value:20},{period_date:'2026-02-01',value:40}],target:50,unit:'점',direction:'higher_better',isCumulative:false,frequency:'monthly'};
  const baseline=loader()(join(product,'app/(app)/kpi/[id]/period-chart.tsx')).KpiPeriodChart;
  const changed=structuredClone(runtime);
  changed.chart.period.barMaxWidth=24;changed.chart.period.lineEndInset=18;changed.chart.axisLabelGap=7;
  const modified=loader({'@/lib/design/q-design-runtime':{qdMaison:changed}})(join(product,'app/(app)/kpi/[id]/period-chart.tsx')).KpiPeriodChart;
  const before=documentFor(React.createElement(baseline,props)),after=documentFor(React.createElement(modified,props));
  assert.equal(before.querySelector('rect:not([fill="transparent"])').getAttribute('width'),'36');
  assert.equal(after.querySelector('rect:not([fill="transparent"])').getAttribute('width'),'24');
  assert.equal(before.querySelector('line').getAttribute('x2'),'594');
  assert.equal(after.querySelector('line').getAttribute('x2'),'582');
  assert.equal(before.querySelector('text').getAttribute('x'),'40');
  assert.equal(after.querySelector('text').getAttribute('x'),'37');
  assert.deepEqual([...before.querySelectorAll('[role="button"]')].map(x=>x.getAttribute('aria-label')),[...after.querySelectorAll('[role="button"]')].map(x=>x.getAttribute('aria-label')));
});
test('the real specification sheet distributes a changed central value-area share across its six columns',async()=>{
  const row={label_items:[],initial_docs:[],spec_options:[],receiving_methods:[],quality_docs:[]};
  const render=async percentage=>{
    const {SpecSheet}=loader({
      '@/lib/design/q-design-print':{qdPrint:{...print,specificationValueAreaPercent:percentage}},
      '@/lib/print/sheet-chrome':{loadSheetChrome:async()=>({})},
      '@/lib/attachments/load':{loadSheetAttachmentNames:async()=>[]},
      '@/components/print/report-sheet':{ReportSheet:({extra})=>React.createElement('section',null,extra)},
    })(join(product,'app/(app)/purchasing/specs/spec-sheet.tsx'));
    return documentFor(await SpecSheet({row,tenantId:'local-test'}));
  };
  const before=await render(66),after=await render(60);
  const widths=doc=>[...doc.querySelectorAll('colgroup:first-of-type col')].map(col=>col.style.width);
  assert.ok(widths(before).includes('11%'));
  assert.ok(widths(after).includes('10%'));
  assert.equal(before.querySelector('col').style.width,after.querySelector('col').style.width);
});
test('one changed paper signature canon reaches both actual SignatureMark and DOCX common image slots',async()=>{
  const changed=structuredClone(print);changed.signatures.approval={w:35,h:21};changed.signatures.attendee={w:38,h:19};changed.docxBoxes.logo={w:40,h:20};
  const query={select(){return this},eq(){return this},in(){return this},returns:async()=>({data:[],error:null})};
  const bytes=new Uint8Array([1,2,3]);
  const load=loader({
    '@/lib/design/q-design-print':{qdPrint:changed},
    '@/lib/supabase/server':{createClient:async()=>({from:()=>query,storage:{from:()=>({download:async()=>({data:new Blob([bytes],{type:'image/png'}),error:null})})}})},
    '@/lib/tenant/company':{loadCompany:async()=>({name:'LOCAL',logo_path:'local-test.png'})},
    '@/lib/users/signature':{loadSignatureBytes:async()=>new Map([['writer',{bytes,contentType:'image/png'}]])},
  });
  const {SignatureMark,ATTENDEE_SIGN_BOX}=load(join(product,'components/print/signature-mark.tsx'));
  const approval=documentFor(React.createElement(SignatureMark,{src:'/local.png',alt:'서명'})).querySelector('img');
  const attendee=documentFor(React.createElement(SignatureMark,{src:'/local.png',alt:'서명',box:ATTENDEE_SIGN_BOX})).querySelector('img');
  assert.equal(approval.style.maxWidth,'35mm');assert.equal(approval.style.maxHeight,'21mm');
  assert.equal(attendee.style.maxWidth,'38mm');assert.equal(attendee.style.maxHeight,'19mm');
  const {resolveCommonForm}=load(join(product,'lib/documents/form-common.ts'));
  const result=await resolveCommonForm('local-tenant',null,{recordNo:'LOCAL',writtenOn:null,writingDept:null,approvals:{writer:{userId:'writer',at:null},reviewer:{userId:null,at:null},approver:{userId:null,at:null}}});
  const signature=(await result.images.find(slot=>slot.key==='writer_sign').load())[0];
  const logo=(await result.images.find(slot=>slot.key==='logo').load())[0];
  assert.equal(signature.maxWidthMm,35);assert.equal(signature.maxHeightMm,21);
  assert.equal(logo.maxWidthMm,40);assert.equal(logo.maxHeightMm,20);
  assert.deepEqual(signature.bytes,bytes);
});
test('actual private DOCX photo loader uses central box dimensions without changing image payload or budget',async()=>{
  const file=join(product,'lib/documents/form-fill.ts'),source=readFileSync(file,'utf8'),sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  // Execute the unchanged private helper body with inert storage. Its actual
  // declarations are extracted so the test cannot substitute a parallel formula.
  const needed=new Set(['PHOTO_BOX','PHOTO_EMBED_BUDGET','loadComplaintPhotoImages']);
  const selected=sf.statements.filter(node=>ts.isFunctionDeclaration(node)?needed.has(node.name?.text):ts.isVariableStatement(node)&&node.declarationList.declarations.some(decl=>needed.has(decl.name.getText(sf))));
  assert.equal(selected.length,3);
  const js=ts.transpileModule(selected.map(node=>node.getText(sf)).join('\n')+'\nexports.load=loadComplaintPhotoImages;',{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;
  const changed=structuredClone(print);changed.docxBoxes.photo={w:72,h:54};
  const bytes=new Uint8Array([9,8,7]);const createClient=async()=>({storage:{from:()=>({download:async()=>({data:new Blob([bytes],{type:'image/png'}),error:null})})}});
  const exports={};new Function('qdPrint','createClient','COMPLAINT_ATTACHMENT_BUCKET','exports',js)(changed,createClient,'local-only',exports);
  const images=await exports.load('local-record',[{storage_path:'local.png',file_name:'photo.png'}]);
  assert.equal(images[0].maxWidthMm,72);assert.equal(images[0].maxHeightMm,54);assert.deepEqual(images[0].bytes,bytes);assert.equal(images[0].alt,'photo.png');
});
test('ribbon gradient opacity and line cap follow the shared numeric recipe in actual SVG markup',()=>{
  const changed=structuredClone(runtime);changed.ribbon.edgeOpacity=0.1;changed.ribbon.midpointOpacity=0.7;changed.ribbon.lineCap='butt';
  const {RibbonBackground}=loader({'@/lib/design/q-design-runtime':{qdMaison:changed}})(join(product,'components/auth/ribbon-background.tsx'));
  const doc=documentFor(React.createElement(RibbonBackground));
  assert.deepEqual([...doc.querySelectorAll('stop')].map(stop=>stop.style.stopOpacity),['0.1','0.7','0.1','0.1','0.7','0.1']);
  assert.deepEqual([...doc.querySelectorAll('path')].map(node=>node.getAttribute('stroke-linecap')),['butt','butt']);
  assert.equal(doc.querySelector('stop').style.stopColor,'var(--qd-accent)');
});
test('JPEG fallback uses the central matte in the actual image-preparation canvas pipeline',async()=>{
  const changed={...print,markJpegMatte:'#123456'},fills=[];
  const ctx={clearRect(){},fillRect(){},drawImage(){},set fillStyle(value){fills.push(value)}};
  const canvas={width:0,height:0,getContext:()=>ctx,toBlob(callback,type){callback(new Blob([new Uint8Array(type==='image/png'?20:2)],{type}))}};
  const previous={document:globalThis.document,Image:globalThis.Image};
  globalThis.document={createElement:()=>canvas};
  globalThis.Image=class{width=1600;height=800;set src(value){this.onload()}};
  try{
    const {prepareMarkImage}=loader({'@/lib/design/q-design-print':{qdPrint:changed}})(join(product,'lib/images/prepare-mark.ts'));
    const output=await prepareMarkImage(new File([new Uint8Array(30)],'local.jpg',{type:'image/jpeg'}),10);
    assert.deepEqual(fills,['#123456']);assert.equal(output.file.type,'image/jpeg');assert.equal(output.originalBytes,30);
  }finally{for(const key of ['document','Image'])if(previous[key]===undefined)delete globalThis[key];else globalThis[key]=previous[key];}
});
test('the actual root-layout toaster argument resolves to a changed canonical placement',()=>{
  const file=join(product,'app/layout.tsx'),source=readFileSync(file,'utf8'),sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  let argument;
  const visit=node=>{if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(sf)==='Toaster')argument=node.attributes.properties.find(attr=>attr.name?.getText(sf)==='position')?.initializer?.expression;ts.forEachChild(node,visit)};visit(sf);
  assert.ok(argument);
  assert.equal(argument.getText(sf),'qdMaison.toastPosition');
  const evaluate=new Function('qdMaison','return '+argument.getText(sf));
  assert.equal(evaluate(runtime),'top-right');assert.equal(evaluate({...runtime,toastPosition:'bottom-center'}),'bottom-center');
});
