import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {readRuntimeValues} from './atelier-runtime-values.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier',req=createRequire(product+'/package.json');
const ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
function fixture(mutate=()=>{}){
 const read=file=>fs.readFileSync(product+'/'+file,'utf8');
 const load=(code,deps={})=>{const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>Object.hasOwn(deps,name)?deps[name]:req(name)});return exports;};
 const runtime=readRuntimeValues(root);mutate(runtime);
 const tokens=load(read('lib/design/tokens.ts')),grain=load(read('lib/design/grain.ts'),{'./tokens':tokens,'./q-design-runtime':runtime});
 const contract=load(read('lib/design/q-design-contract.ts'),{'./tokens':tokens,'./grain':grain}),scale=load(read('lib/design/q-design-scale.ts'),{'./tokens':tokens});
 const source=read('lib/design/components.tsx'),sf=ts.createSourceFile('components.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const names=['ProgressRing','Collapse','usePrefersReducedMotion'],functions=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text));assert.equal(functions.length,names.length);
 const core=load("import {useState,useEffect} from 'react';import {QDPresentation} from '@/lib/design/q-design-runtime';import {QDScale} from '@/lib/design/q-design-scale';import {QD} from '@/lib/design/q-design-contract';import {T} from '@/lib/design/tokens';\n"+functions.map(n=>n.getText(sf)).join('\n'),{'@/lib/design/q-design-runtime':runtime,'@/lib/design/tokens':tokens,'@/lib/design/q-design-contract':contract,'@/lib/design/q-design-scale':scale});
 return {render:(name,props)=>renderToStaticMarkup(React.createElement(core[name],props)),runtime};
}
function circles(html){return [...html.matchAll(/<circle\b([^>]+)>/g)].map(m=>Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));}
test('real ProgressRing defaults follow central size and stroke while caller overrides and business percent remain distinct',()=>{
 for(const mutation of [false,true]){
  const f=fixture(r=>{if(mutation){r.QDPresentation.progressSize[56]=70;r.QDPresentation.progressStroke[5]=7;}}),size=mutation?70:56,stroke=mutation?7:5;
  for(const pct of [-20,0,50,100,140]){
   const html=f.render('ProgressRing',{pct,children:'업무 진행률'}),[track,ring]=circles(html);assert(track&&ring);
   for(const c of [track,ring]){assert.equal(+c.cx,size/2);assert.equal(+c.cy,size/2);assert.equal(+c.r,(size-stroke)/2);assert.equal(+c['stroke-width'],stroke);}
   const [dash,rest]=ring['stroke-dasharray'].split(' ').map(Number),circumference=2*Math.PI*((size-stroke)/2);
   assert.ok(Math.abs(dash-Math.max(0,Math.min(100,pct))/100*circumference)<1e-8);assert.ok(Math.abs(dash+rest-circumference)<1e-8);
   assert.equal(track.stroke,'var(--qa-border)');assert.equal(ring.stroke,'var(--qa-champagne)');assert.ok(html.includes('업무 진행률'));
  }
  const [track,ring]=circles(f.render('ProgressRing',{pct:50,size:88,stroke:9,color:'var(--c-green)',trackColor:'var(--c-muted)'}));
  assert.equal(+ring.cx,44);assert.equal(+ring.r,39.5);assert.equal(+ring['stroke-width'],9);assert.equal(track.stroke,'var(--c-muted)');assert.equal(ring.stroke,'var(--c-green)');
 }
});
test('real Collapse initial rendering uses central open and close durations, retaining explicit override and closed access guards',()=>{
 for(const mutation of [false,true]){
  const f=fixture(r=>{if(mutation){r.QDPresentation.motionDefaults.foldOpen=610;r.QDPresentation.motionDefaults.foldClose=430;}});
  for(const open of [true,false]){
   const html=f.render('Collapse',{open,children:'내용'}),duration=open?f.runtime.QDPresentation.motionDefaults.foldOpen:f.runtime.QDPresentation.motionDefaults.foldClose;
   assert.ok(html.includes('grid-template-rows '+duration+'ms'));assert.ok(html.includes('opacity '+duration+'ms'));assert.ok(html.includes('aria-hidden="'+!open+'"'));
   assert.equal(html.includes('inert=""'),!open);assert.ok(html.includes('내용'));
   for(const durationMs of [0,148])assert.ok(f.render('Collapse',{open,durationMs}).includes('grid-template-rows '+durationMs+'ms'));
  }
 }
});
