// Actual current shared selection renderers, isolated from accounts and services.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works',req=createRequire(product+'/package.json'),ts=req('typescript');
const {build}=await import(pathToFileURL(req.resolve('vite')).href),{chromium}=createRequire('D:/Claude/Q-Atelier/package.json')('playwright');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'qd-selections-')),entry=temporary+'/fixture.tsx';
fs.writeFileSync(entry,`import React from 'react';import {createRoot} from 'react-dom/client';import {ChoiceBoxes,ChoiceGrid} from '@/components/shared/choice-boxes';import {CheckChip} from '@/components/shared/check-chip';import ${JSON.stringify(product+'/app/globals.css')};const options=[{code:'a',label:'선택 항목 A'},{code:'b',label:'길이가 긴 선택 항목도 화면 안에서 읽을 수 있습니다'},{code:'c',label:'선택 항목 C'}];const days=['월요일','화요일','수요일','목요일','금요일','토요일','일요일'];function Fixture(){const[value,setValue]=React.useState('a');const[checked,setChecked]=React.useState<string[]>([]);return <main style={{padding:16,boxSizing:'border-box'}}><section data-testid="single"><ChoiceBoxes name="sample" value={value} options={options} onChange={setValue} cols="grid-cols-3" clearable/><output data-testid="value">{value}</output></section><section data-testid="multiple"><ChoiceGrid cols="grid-cols-7" labels={days}>{days.map(label=><CheckChip key={label} label={label} on={checked.includes(label)} onClick={()=>setChecked(old=>old.includes(label)?old.filter(d=>d!==label):[...old,label])}/>)}</ChoiceGrid><output data-testid="checked">{checked.join(',')}</output></section><section data-testid="disabled"><ChoiceBoxes name="locked" value="a" options={options} onChange={()=>{}} disabled/><CheckChip label="잠긴 선택" on disabled onClick={()=>{}}/></section></main>};createRoot(document.getElementById('root')).render(<Fixture/>);`);
let browser;
try{
 const config=req('tailwindcss/loadConfig')(product+'/tailwind.config.ts');config.content=[product+'/app/**/*.{ts,tsx}',product+'/components/**/*.{ts,tsx}',temporary+'/*.tsx'];
 const result=await build({configFile:false,root:product,logLevel:'error',plugins:[{name:'actual-tsx',enforce:'pre',transform(code,id){if(/\.[jt]sx$/.test(id))return{code:ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,map:null};}}],resolve:{alias:{'@':product}},css:{postcss:{plugins:[req('postcss-import')(),req('tailwindcss')(config)]}},build:{write:false,minify:false,lib:{entry,formats:['iife'],name:'QdSelections'},rolldownOptions:{resolve:{modules:[product+'/node_modules','node_modules']}}},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const assets=(Array.isArray(result)?result[0]:result).output,bundle=assets.find(a=>a.type==='chunk').code;let css=assets.filter(a=>a.type==='asset'&&a.fileName.endsWith('.css')).map(a=>a.source).join('\n');
 css=css.replace(/url\(['"]?(\/fonts\/[^'"\)]+\.woff2)['"]?\)/g,(_,url)=>'url(data:font/woff2;base64,'+fs.readFileSync(product+'/public'+url).toString('base64')+')');
 browser=await chromium.launch({channel:'msedge',headless:true});const cases=[];
 for(const width of [320,390,1280])for(const size of [13,24])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width,height:844}});await page.route('**/*',r=>r.abort());
  await page.setContent('<html data-product="maison" data-theme="'+theme+'" class="'+theme+'"><head><style>'+css+'\nbody{margin:0}section{margin-bottom:16px}:root{--qd-control-size:'+size+'px}</style></head><body><div id="root"></div><script>'+bundle.replaceAll('</script','<\\/script')+'</script></body></html>');
  const measure=()=>page.evaluate(()=>{
   const props=e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width,radius:getComputedStyle(e).borderRadius,size:getComputedStyle(e).fontSize,background:getComputedStyle(e).backgroundColor,accent:getComputedStyle(e).accentColor});
   return {overflow:document.documentElement.scrollWidth-innerWidth,labels:Array.from(document.querySelectorAll('label.qd-choice')).map(props),radios:Array.from(document.querySelectorAll('.qd-radio')).map(props),marks:Array.from(document.querySelectorAll('.qd-checkbox-mark')).map(props),selected:Array.from(document.querySelectorAll('.qd-choice--selected')).map(props)};
  });
  const before=await measure();assert.equal(before.overflow,0);assert(before.labels.every(p=>p.height>=44&&p.radius==='10px'&&p.size===size+'px'));assert(before.radios.every(p=>p.width===16&&p.height===16));assert(before.marks.every(p=>p.width===16&&p.height===16));assert(before.selected.length>=2);assert.equal(new Set(before.selected.map(p=>p.background)).size,1);
  const single=page.getByTestId('single'),multiple=page.getByTestId('multiple'),disabled=page.getByTestId('disabled');
  await single.getByRole('radio',{name:'선택 항목 A',exact:true}).click();assert.equal(await page.getByTestId('value').innerText(),'');
  await single.getByRole('radio',{name:'선택 항목 C',exact:true}).check();assert.equal(await page.getByTestId('value').innerText(),'c');
  await multiple.getByRole('checkbox',{name:'월요일',exact:true}).check();assert.equal(await page.getByTestId('checked').innerText(),'월요일');
  await multiple.getByRole('checkbox',{name:'월요일',exact:true}).uncheck();assert.equal(await page.getByTestId('checked').innerText(),'');
  assert(await disabled.getByRole('radio').first().isDisabled());assert(await disabled.getByRole('checkbox').isDisabled());
  await page.evaluate(()=>{document.documentElement.style.setProperty('--qd-control-height','48px');document.documentElement.style.setProperty('--qd-radius','14px');document.documentElement.style.setProperty('--qd-choice-glyph-size','20px');});
  const mutation=await measure();assert.equal(mutation.overflow,0);assert(mutation.labels.every(p=>p.height>=48&&p.radius==='14px'));assert(mutation.radios.every(p=>p.width===20&&p.height===20));assert(mutation.marks.every(p=>p.width===20&&p.height===20));
  if(width===390&&size===13&&theme==='dark')await page.screenshot({path:root+'/reviews/maison-selection-controls.png'});
  cases.push({width,size,theme,before,mutation,selectionAndDisabledSemantics:true});await page.close();
 }
 const files=['components/shared/choice-boxes.tsx','components/shared/check-chip.tsx','components/ui/checkbox.tsx','lib/ui/choice-grid.ts','lib/ui/choice.ts','app/q-design.components.css','app/q-design.foundation.css'];
 fs.writeFileSync(root+'/reviews/maison-selection-controls-browser.json',JSON.stringify({scope:'Actual single and multiple selection renderers and product CSS. Twelve screen/font/theme fixtures, including a seven-column caller on narrow screens. Shared radius, hit height, glyph size and selected surface are measured. Native selection, deselection, clearable and disabled semantics remain. No operating data or submission.',sources:files.map(file=>({path:file,sourceHash:hash(fs.readFileSync(product+'/'+file,'utf8'))})),cases,passed:cases.length,failures:0},null,2)+'\n');console.log(JSON.stringify({cases:cases.length,passed:true}));
}finally{await browser?.close();fs.rmSync(temporary,{recursive:true,force:true});}
