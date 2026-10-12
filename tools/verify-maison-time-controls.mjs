// Mount current production adapters with product CSS. No services, accounts or submissions.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {hash} from './style-arguments-core.mjs';
const root=path.resolve(import.meta.dirname,'..'),product=path.resolve(root,'../Q-Works'),req=createRequire(product+'/package.json'),ts=req('typescript');
const {build}=await import(pathToFileURL(req.resolve('vite')).href),{chromium}=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('playwright');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'qd-time-controls-')),entry=path.join(temporary,'fixture.tsx');
fs.writeFileSync(entry,`import React from 'react'; import {createRoot} from 'react-dom/client'; import {Input} from '@/components/ui/input'; import ${JSON.stringify(product+'/app/globals.css')}; function Fixture(){const [value,setValue]=React.useState('08:07'); return <main style={{padding:24,boxSizing:'border-box',height:'100dvh'}}><h1>날짜 및 시각 입력 검수</h1><div style={{marginLeft:'auto',maxWidth:400}}><Input aria-label="검수 날짜" type="date" value="2026-10-12" onChange={()=>{}}/><Input aria-label="검수 시각" type="time" value={value} onChange={e=>setValue(e.target.value)}/><output data-testid="time">{value}</output><Input aria-label="잠긴 시각" type="time" value="09:00" disabled/></div></main>};createRoot(document.getElementById('root')).render(<Fixture/>);`);
let browser;
try{
 const config=req('tailwindcss/loadConfig')(product+'/tailwind.config.ts');
 config.content=[product+'/app/**/*.{ts,tsx}',product+'/components/**/*.{ts,tsx}',temporary+'/*.tsx'];
 const result=await build({configFile:false,root:product,logLevel:'error',plugins:[{name:'actual-tsx',enforce:'pre',transform(code,id){if(/\.[jt]sx$/.test(id))return{code:ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,map:null};}}],resolve:{alias:{'@':product}},css:{postcss:{plugins:[req('postcss-import')(),req('tailwindcss')(config)]}},build:{write:false,minify:false,lib:{entry,formats:['iife'],name:'QdTimeControls'},rolldownOptions:{resolve:{modules:[product+'/node_modules','node_modules']}}},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const assets=(Array.isArray(result)?result[0]:result).output,bundle=assets.find(a=>a.type==='chunk').code,css=assets.filter(a=>a.type==='asset'&&a.fileName.endsWith('.css')).map(a=>a.source).join('\n');
 browser=await chromium.launch({channel:'msedge',headless:true});const cases=[];
 for(const width of [320,390,1280])for(const fontSize of [13,24])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width,height:812}});await page.route('**/*',route=>route.abort());
  await page.setContent(`<html data-product="maison" data-theme="${theme}" class="${theme}"><head><style>${css}\n:root{--qd-control-size:${fontSize}px}body{margin:0}</style></head><body><div id="root"></div><script>${bundle.replaceAll('</script','<\\/script')}</script></body></html>`);
  assert(await page.getByLabel('잠긴 시각',{exact:true}).isDisabled());
  await page.getByRole('button',{name:'시각 선택 열기',exact:true}).first().click();
  const measure=()=>page.evaluate(()=>{
   const d=document.querySelector('[aria-label="시각 선택"]'),r=d.getBoundingClientRect(),inputs=Array.from(document.querySelectorAll('input')).slice(0,2),trigger=document.querySelector('[aria-label="시각 선택 열기"]');
   const props=e=>({height:e.getBoundingClientRect().height,radius:getComputedStyle(e).borderRadius,fontFamily:getComputedStyle(e).fontFamily,fontSize:getComputedStyle(e).fontSize});
   return {controlHeight:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--qd-control-height')),compactHeight:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--qd-control-height-sm')),pageOverflow:document.documentElement.scrollWidth-innerWidth,dialog:{...props(d),left:r.left,right:r.right,top:r.top,bottom:r.bottom,overflow:d.scrollWidth-d.clientWidth},inputs:inputs.map(props),trigger:props(trigger),options:Array.from(d.querySelectorAll('[role="option"]')).map(props)};
  });
  const before=await measure();assert.equal(before.pageOverflow,0);assert.equal(before.dialog.overflow,0);assert(before.dialog.left>=0&&before.dialog.right<=width);assert(before.dialog.top>=0&&before.dialog.bottom<=812);
  assert.equal(before.inputs[0].height,before.inputs[1].height);assert.equal(before.inputs[0].fontFamily,before.inputs[1].fontFamily);assert.equal(before.inputs[0].fontSize,before.inputs[1].fontSize);
  assert.equal(before.dialog.radius,'10px');for(const control of [...before.inputs,before.trigger]){assert.equal(control.radius,'10px');assert(control.height>=before.controlHeight);}for(const control of before.options){assert.equal(control.radius,'10px');assert(control.height>=(width<=640?before.controlHeight:before.compactHeight));}
  assert(await page.getByRole('listbox',{name:'분',exact:true}).getByRole('option',{name:'07',exact:true}).getAttribute('aria-selected')==='true');
  await page.getByRole('listbox',{name:'오전 · 오후',exact:true}).getByRole('option',{name:'오후',exact:true}).click();assert.equal(await page.getByTestId('time').innerText(),'20:07');
  await page.getByRole('listbox',{name:'분',exact:true}).getByRole('option',{name:'30',exact:true}).click();assert.equal(await page.getByTestId('time').innerText(),'20:30');
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
  await page.getByLabel('검수 시각',{exact:true}).fill('오전 9:15');await page.getByLabel('검수 시각',{exact:true}).press('Tab');assert.equal(await page.getByTestId('time').innerText(),'09:15');
  await page.evaluate(()=>{document.documentElement.style.setProperty('--qd-radius','14px');document.documentElement.style.setProperty('--qd-control-height','48px');document.documentElement.style.setProperty('--qd-control-height-sm','48px');});
  await page.getByRole('button',{name:'시각 선택 열기',exact:true}).first().click();const mutation=await measure();assert.equal(mutation.dialog.radius,'14px');for(const c of [...mutation.inputs,mutation.trigger,...mutation.options]){assert.equal(c.radius,'14px');assert(c.height>=48);}assert.equal(mutation.pageOverflow,0);
  if(width===390&&fontSize===13&&theme==='dark')await page.screenshot({path:root+'/reviews/maison-time-controls.png'});
  cases.push({width,fontSize,theme,before,mutation,selectionAndDismissal:true});await page.close();
 }
 const sources=['components/ui/input.tsx','components/ui/time-picker.tsx','components/ui/date-picker.tsx','lib/ui/choice.ts','app/globals.css','app/q-design.components.css','app/q-design.foundation.css','lib/design/q-design-tailwind.ts'].map(file=>({path:file,sourceHash:hash(fs.readFileSync(product+'/'+file,'utf8'))}));
 fs.writeFileSync(root+'/reviews/maison-time-controls-browser.json',JSON.stringify({scope:'Actual current Input dispatch, DatePicker and TimePicker. Product CSS and installed build tools. Twelve viewport/font/theme cases with shared radius/height mutation, preserved non-five-minute value, AM/PM and minute selection, typed normalization, Escape and disabled state. No production data or submission.',sources,cases,passed:cases.length,failures:0},null,2)+'\n');
 console.log(JSON.stringify({cases:cases.length,states:cases.length*2,passed:true}));
}finally{await browser?.close();fs.rmSync(temporary,{recursive:true,force:true});}
