import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readRuntimeValues} from './atelier-runtime-values.mjs';
import {buildComponentImplementations,checkedImplementationPath,implementationOwners} from './build-component-implementations.mjs';
import {applyBindings,copySourceFiles} from './copy-spacing.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),manifest=JSON.parse(fs.readFileSync(root+'/patterns/component-implementations.json','utf8'));
function fixture(){
 const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'qd-ui-ownership-')),fixtureRoot=path.join(workspace,'Q-Design'),files=[],dirs=new Set([workspace]);
 const write=(file,content)=>{const resolved=path.resolve(file);assert(resolved.startsWith(path.resolve(workspace)+path.sep));let dir=path.dirname(resolved);while(dir!==workspace){dirs.add(dir);dir=path.dirname(dir);}fs.mkdirSync(path.dirname(resolved),{recursive:true});fs.writeFileSync(resolved,content);files.push(resolved);};
 write(fixtureRoot+'/patterns/component-implementations.json',JSON.stringify(manifest,null,2)+'\n');
 for(const config of manifest.products)for(const file of config.files){
  const canonical=`patterns/component-implementations/${config.product}/${file}`,source=fs.readFileSync(root+'/'+canonical,'utf8');
  write(fixtureRoot+'/'+canonical,source);write(workspace+'/'+config.repo+'/'+file,source);
 }
 const dist=fixtureRoot+'/dist/q-design.component-implementations.json';
 write(dist,'');buildComponentImplementations(fixtureRoot);
 return {workspace,root:fixtureRoot,write,dispose(){for(const file of new Set(files))if(fs.existsSync(file))fs.unlinkSync(file);for(const dir of [...dirs].sort((a,b)=>b.length-a.length))if(fs.existsSync(dir))fs.rmdirSync(dir);}};
}
const toastTargets=[['atelier','Q-Atelier','components/Toast.tsx'],['maison','Q-Works','components/ui/sonner.tsx'],['carnet','DHR','components/toast.tsx']];
test('all five attached Skeleton renderers are explicit and changes cannot escape the public API review',()=>{
 const f=fixture();try{
  const file=f.root+'/patterns/component-implementations/atelier/components/Skeleton.tsx',before=fs.readFileSync(file,'utf8');
  const record=buildComponentImplementations(f.root,{check:true}).records.find(r=>r.path==='components/Skeleton.tsx');
  assert.deepEqual(record.attachedRenderers.map(r=>r.member),['Row','Card','KPIGrid','PageHd','Table']);
  const target=f.workspace+'/Q-Atelier/components/Toast.tsx',toastBefore=fs.readFileSync(target,'utf8');
  f.write(f.root+'/patterns/component-implementations/atelier/components/Toast.tsx',toastBefore.replace('var(--qd-toast-width)','calc(var(--qd-toast-width) - 1px)'));
  for(const after of [
   before.replace('Skeleton.Row =','Skeleton.Unreviewed ='),
   before.replace('Skeleton.Row =','Skeleton["Row"] ='),
   before.replace('function SkeletonRow(','function OtherRow('),
   before+'\nSkeleton.New = function New(){ return <div/>; };\n',
   before+'\nif (true) { Skeleton.New = function New(){ return <div/>; }; }\n',
   before+'\nSkeleton.displayName = function New(){ return <div/>; };\n',
  ]){
   f.write(file,after);assert.throws(()=>buildComponentImplementations(f.root,{write:true}));assert.equal(fs.readFileSync(target,'utf8'),toastBefore);
  }
 }finally{f.dispose();}
});
test('Skeleton implementation changes propagate only through the reviewed canonical copy',()=>{
 const f=fixture();try{
  const file='components/Skeleton.tsx',canonical=f.root+'/patterns/component-implementations/atelier/'+file,actual=f.workspace+'/Q-Atelier/'+file,before=fs.readFileSync(canonical,'utf8');
  const after=before.replace("width = 'var(--qd-atelier-skeleton-width-100)'","width = 'calc(var(--qd-atelier-skeleton-width-100) - 1px)'");assert.notEqual(after,before);
  f.write(canonical,after);buildComponentImplementations(f.root);assert.throws(()=>buildComponentImplementations(f.root,{check:true}));assert.equal(fs.readFileSync(actual,'utf8'),before);
  buildComponentImplementations(f.root,{write:true,only:new Set(['Q-Atelier'])});assert.equal(fs.readFileSync(actual,'utf8'),after);buildComponentImplementations(f.root,{check:true});
 }finally{f.dispose();}
});
test('actual Skeleton variants render their central defaults and preserve explicit caller dimensions',()=>{
 const product=path.resolve(root,'../Q-Atelier'),require=createRequire(product+'/package.json'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const read=file=>fs.readFileSync(product+'/'+file,'utf8');
 const load=(code,deps={})=>{const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>Object.hasOwn(deps,name)?deps[name]:require(name)});return exports;};
 const tokens=load(read('lib/design/tokens.ts')),runtime=readRuntimeValues(root);
 const grain=load(read('lib/design/grain.ts'),{'./tokens':tokens,'./q-design-runtime':runtime});
 const contract=load(read('lib/design/q-design-contract.ts'),{'./tokens':tokens,'./grain':grain}),scale=load(read('lib/design/q-design-scale.ts'),{'./tokens':tokens});
 const make=config=>load(read('components/Skeleton.tsx'),{'@/lib/design/tokens':tokens,'@/lib/design/q-design-runtime':config,'@/lib/design/q-design-contract':contract,'@/lib/design/q-design-scale':scale}).Skeleton;
 const render=(Component,props={})=>renderToStaticMarkup(React.createElement(Component,props)),count=html=>(html.match(/qa-skeleton qd-skeleton/g)??[]).length;
 const original=make(runtime);
 assert.equal(count(render(original)),1);assert(render(original).includes('height:'+runtime.QDPresentation.skeletonHeight[14]+'px'));assert.match(render(original),/border-radius:var\(--qd-radius/);
 assert.equal(count(render(original.Row)),runtime.QDPresentation.commonDefaults.skeletonCount);
 assert.equal(count(render(original.KPIGrid)),runtime.QDPresentation.commonDefaults.skeletonColumns*3);
 assert.equal(count(render(original.Table)),runtime.QDPresentation.commonDefaults.skeletonRows*runtime.QDPresentation.commonDefaults.skeletonColumns);
 assert.equal(count(render(original.PageHd)),2);assert.equal(count(render(original.PageHd,{sub:true})),3);assert.equal(count(render(original.PageHd,{desc:false})),1);
 const changed=structuredClone(runtime);changed.QDPresentation.commonDefaults.skeletonCount=2;changed.QDPresentation.commonDefaults.skeletonColumns=2;changed.QDPresentation.commonDefaults.skeletonRows=2;
 changed.QDPresentation.skeletonHeight[14]=19;changed.QDPresentation.skeletonHeight[120]=133;changed.QDPresentation.skeletonHeight[124]=173;changed.QDPresentation.skeletonGap[8]=17;
 const current=make(changed);
 assert.match(render(current),/height:19px/);assert.equal(count(render(current.Row)),2);assert.match(render(current.Row),/gap:17px/);
 assert.match(render(current.Card),/height:133px/);assert.match(render(current.KPIGrid),/min-height:173px/);assert.equal(count(render(current.KPIGrid)),6);assert.equal(count(render(current.Table)),4);
 assert.match(render(current,{width:'37%',height:31}),/width:37%;height:31px/);
 assert.equal(count(render(current.Row,{count:4,gap:8})),4);assert.match(render(current.Row,{count:4,gap:8}),/gap:8px/);
 assert.match(render(current.Card,{height:121}),/height:121px/);assert.equal(count(render(current.Table,{rows:3,cols:4})),12);
});
test('all reviewed actual primitive bodies and export catalogs match, including partial selection',()=>{
 const report=buildComponentImplementations(root,{check:true});assert.equal(report.records.length,28);assert.equal(new Set(report.records.map(r=>r.product)).size,3);
 assert.equal(buildComponentImplementations(root,{check:true,only:new Set(['Q-Atelier'])}).records.length,28);
 assert.equal(buildComponentImplementations(root,{check:true,only:new Set(['Q-Sonar'])}).records.length,28);
 for(const invalid of ['../outside.tsx','components/../outside.tsx','C:/outside.tsx','components\\wrong.tsx'])assert.throws(()=>checkedImplementationPath(invalid));
 assert.throws(()=>buildComponentImplementations(root,{check:true,only:new Set(['unknown'])}));
});
test('actual toast width recipe edits reach each selected source and unsynchronized siblings still fail',()=>{
 const f=fixture();try{
  const changed=new Map();
  for(const [product,repo,file]of toastTargets){
   const canonical=f.root+`/patterns/component-implementations/${product}/${file}`,before=fs.readFileSync(canonical,'utf8');assert(before.includes('var(--qd-toast-width)'));
   const after=before.replace('var(--qd-toast-width)','calc(var(--qd-toast-width) - 1px)');f.write(canonical,after);changed.set(repo+'/'+file,after);
  }
  buildComponentImplementations(f.root);assert.throws(()=>buildComponentImplementations(f.root,{check:true}));
  buildComponentImplementations(f.root,{write:true,only:new Set(['Q-Atelier'])});
  assert.equal(fs.readFileSync(f.workspace+'/Q-Atelier/components/Toast.tsx','utf8'),changed.get('Q-Atelier/components/Toast.tsx'));
  assert(!fs.readFileSync(f.workspace+'/Q-Works/components/ui/sonner.tsx','utf8').includes('calc(var(--qd-toast-width) - 1px)'));
  assert.throws(()=>buildComponentImplementations(f.root,{check:true}));
  buildComponentImplementations(f.root,{write:true});buildComponentImplementations(f.root,{check:true});
  for(const [file,expected]of changed)assert.equal(fs.readFileSync(f.workspace+'/'+file,'utf8'),expected);
 }finally{f.dispose();}
});
test('syntax errors, unowned UI files and unreviewed re-exports fail before any product source changes',()=>{
 const f=fixture();try{
  const target=f.workspace+'/Q-Atelier/components/Toast.tsx',before=fs.readFileSync(target,'utf8'),canonical=f.root+'/patterns/component-implementations/atelier/components/Toast.tsx';
  f.write(canonical,before.replace('var(--qd-toast-width)','calc(var(--qd-toast-width) - 1px)'));
  const last=f.root+'/patterns/component-implementations/carnet/components/row-link.tsx',lastBefore=fs.readFileSync(last,'utf8');
  f.write(last,'export const = ;');assert.throws(()=>buildComponentImplementations(f.root,{write:true}));assert.equal(fs.readFileSync(target,'utf8'),before);f.write(last,lastBefore);
  f.write(last,'export default 1;');assert.throws(()=>buildComponentImplementations(f.root,{write:true}));assert.equal(fs.readFileSync(target,'utf8'),before);f.write(last,lastBefore);
  const unowned=f.workspace+'/Q-Works/components/ui/unowned.tsx';f.write(unowned,'export const unowned=1;');assert.throws(()=>buildComponentImplementations(f.root,{write:true}));assert.equal(fs.readFileSync(target,'utf8'),before);fs.unlinkSync(unowned);
  const table=f.root+'/patterns/component-implementations/carnet/components/table.tsx',tableBefore=fs.readFileSync(table,'utf8');
  f.write(table,tableBefore.replace("from './row-link'","from './unreviewed'"));assert.throws(()=>buildComponentImplementations(f.root,{write:true}));assert.equal(fs.readFileSync(target,'utf8'),before);f.write(table,tableBefore);
  const orphan=f.root+'/patterns/component-implementations/maison/components/ui/orphan.tsx';f.write(orphan,'export const orphan=1;');assert.throws(()=>buildComponentImplementations(f.root,{write:true}));assert.equal(fs.readFileSync(target,'utf8'),before);
 }finally{f.dispose();}
});
test('copy normalization edits the owned recipe and reaches the product through generation',()=>{
 const f=fixture();try{
  const file='lib/design/components.tsx',owners=implementationOwners(f.root),canonical=owners.get('atelier:'+file);assert(canonical);
  assert(copySourceFiles(f.workspace+'/Q-Atelier','atelier',owners).includes(path.join(f.workspace,'Q-Atelier',file)));
  const actual=f.workspace+'/Q-Atelier/'+file,before=fs.readFileSync(actual,'utf8'),source=before+'\nconst qdCopyProbe = "검토중";\n';
  f.write(f.root+'/'+canonical,source);
  const normalized=applyBindings(file,source,[],[{from:'검토중',to:'검토 중'}]);assert.equal(normalized.changes.length,1);
  f.write(f.root+'/'+canonical,normalized.after);assert.equal(fs.readFileSync(actual,'utf8'),before);
  buildComponentImplementations(f.root,{write:true});assert.equal(fs.readFileSync(actual,'utf8'),normalized.after);buildComponentImplementations(f.root,{check:true});
 }finally{f.dispose();}
});
