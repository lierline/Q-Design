// Mount the actual DatePicker and the exact private FilePick function. No services or business data.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),product=path.resolve(root,'../Q-Works');
const req=createRequire(path.join(product,'package.json')),ts=req('typescript');
const {build}=await import(pathToFileURL(req.resolve('vite')).href),{chromium}=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('playwright');
const baseline=process.argv.includes('--baseline');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'qd-calendar-'));
const original=fs.readFileSync(path.join(product,'app/(app)/suppliers/new/new-supplier-form.tsx'),'utf8');
const source=ts.createSourceFile('supplier.tsx',original,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const pick=source.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='FilePick');
assert(pick,'actual FilePick function missing');
fs.writeFileSync(path.join(temporary,'file-pick.tsx'),`import React from 'react'; import {useFieldControl} from '@/components/ui/field'; import {Paperclip} from '@/components/q-design-icons/Paperclip';\n${pick.getText(source)}\nexport {FilePick};`);
const entry=path.join(temporary,'fixture.tsx');
fs.writeFileSync(entry,`import React from 'react'; import {createRoot} from 'react-dom/client'; import {DatePicker} from '@/components/ui/date-picker'; import {DateRangePicker} from '@/components/ui/date-range-picker'; import {FilePick} from './file-pick'; import {SaleItemsTable,emptySaleItem} from '@/app/(app)/store/sale-items-table'; import ${JSON.stringify(path.join(product,'app/globals.css').replaceAll('\\','/'))}; function Fixture(){const [value,setValue]=React.useState('2026-10-11'); const [rows,setRows]=React.useState(()=>[emptySaleItem(),emptySaleItem()]); return <main id="main-content" style={{height:'100dvh',overflow:'auto',padding:'36px',boxSizing:'border-box',scrollbarGutter:'stable'}}><FilePick file={null} onPick={()=>{}}/><div style={{height:320}}/><DatePicker aria-label="검수 날짜" value={value} min="2026-10-01" max="2026-10-31" onChange={e=>setValue(e.target.value)}/><output data-testid="picked">{value}</output><DateRangePicker value={{from:'',to:''}} onApply={()=>{}} label="기간 검수"/><SaleItemsTable rows={rows} onChange={setRows}/><div style={{height:800}}/></main>};createRoot(document.getElementById('root')).render(<Fixture/>);`);
let browser;
try{
 const config=req('tailwindcss/loadConfig')(path.join(product,'tailwind.config.ts'));
 config.content=[path.join(product,'app/**/*.{ts,tsx}').replaceAll('\\','/'),path.join(product,'components/**/*.{ts,tsx}').replaceAll('\\','/'),path.join(temporary,'*.tsx').replaceAll('\\','/')];
 const result=await build({configFile:false,root:product,logLevel:'error',plugins:[{name:'actual-tsx',enforce:'pre',transform(code,id){if(/\.[jt]sx$/.test(id))return {code:ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,map:null};}}],resolve:{alias:{'@':product}},css:{postcss:{plugins:[req('postcss-import')(),req('tailwindcss')(config)]}},build:{write:false,minify:false,lib:{entry,formats:['iife'],name:'QdCalendarFixture'},rolldownOptions:{resolve:{modules:[path.join(product,'node_modules'),'node_modules']}}},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const assets=(Array.isArray(result)?result[0]:result).output;
 const bundle=assets.find(a=>a.type==='chunk').code,css=assets.filter(a=>a.type==='asset'&&a.fileName.endsWith('.css')).map(a=>a.source).join('\n');
 browser=await chromium.launch({channel:'msedge',headless:true});
 const cases=[];
 for(const width of [320,375,1280])for(const fontSize of [13,24])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width,height:812}});
  await page.setContent(`<html data-theme="${theme}" class="${theme==='dark'?'dark':''}"><head><style>${css}\n:root{--qd-control-size:${fontSize}px}body{margin:0}#root{width:100%}</style></head><body><div id="root"></div><script>${bundle.replaceAll('</script','<\\/script')}</script></body></html>`);
  await page.getByRole('button',{name:'달력 열기',exact:true}).click();
  const measured=await page.evaluate(()=>{const m=document.querySelector('main'),d=document.querySelector('[role="dialog"]'),r=d.getBoundingClientRect(),p=document.querySelector('label:has(input[type="file"])');return {width:innerWidth,fontSize:parseFloat(getComputedStyle(d).fontSize),mainOverflow:m.scrollWidth-m.clientWidth,pageOverflow:document.documentElement.scrollWidth-innerWidth,dialog:{left:r.left,right:r.right,top:r.top,bottom:r.bottom,position:getComputedStyle(d).position,radius:getComputedStyle(d).borderRadius,internalOverflow:d.scrollWidth-d.clientWidth},fileHeight:p.getBoundingClientRect().height,fileRadius:getComputedStyle(p).borderRadius,firstWeek:[...d.querySelectorAll('.qd-calendar-day')].slice(0,7).map(e=>{const b=e.getBoundingClientRect();return {left:b.left,right:b.right,width:b.width,height:b.height};})};});
  cases.push({width,fontSize,theme,...measured});
  if(!baseline){const trash=await page.getByRole('button',{name:'1번 줄 지우기',exact:true}).evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,radius:getComputedStyle(e).borderRadius,glyph:e.querySelector('svg').getBoundingClientRect().width}));assert(trash.width>=44&&trash.height>=44);assert.equal(trash.radius,'10px');assert.equal(trash.glyph,20);cases.at(-1).saleDeleteControl=trash;}
  if(!baseline){assert.equal(measured.mainOverflow,0);assert.equal(measured.pageOverflow,0);assert(measured.fileHeight>=44);assert.equal(measured.fileRadius,'10px');assert.equal(measured.dialog.radius,'10px');if(width<=640){assert(measured.dialog.left>=0&&measured.dialog.right<=width);assert(measured.dialog.top>=0&&measured.dialog.bottom<=812);assert.equal(measured.dialog.internalOverflow,0);assert(measured.firstWeek.every(c=>c.left>=measured.dialog.left&&c.right<=measured.dialog.right&&c.height>=44&&c.width>=32));assert(measured.firstWeek.at(-1).right>=measured.dialog.right-20,'the seven calendar columns must fill the popup');}}
  if(width===375&&fontSize===13&&theme==='dark')await page.screenshot({path:path.join(root,'reviews',baseline?'calendar-layout-before.png':'calendar-layout-after.png')});
  if(!baseline){
   assert(await page.getByRole('button',{name:'2026-09-30',exact:true}).isDisabled());
   await page.getByRole('button',{name:'2026-10-12',exact:true}).click();
   assert.equal(await page.getByTestId('picked').innerText(),'2026-10-12');assert.equal(await page.getByRole('dialog').count(),0);
   await page.getByRole('button',{name:'달력 열기',exact:true}).click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
   await page.getByRole('button',{name:'달력 열기',exact:true}).click();await page.locator('main').click({position:{x:2,y:2}});assert.equal(await page.getByRole('dialog').count(),0);
   cases.at(-1).dateSelectionAndDismissal=true;
   await page.getByRole('button',{name:'기간 검수',exact:true}).click();
   const range=await page.getByRole('dialog',{name:'기간 선택'}).evaluate(e=>{const r=e.getBoundingClientRect(),m=document.querySelector('main');return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,days:e.querySelectorAll('.qd-calendar-day').length,dayWidth:e.querySelector('.qd-calendar-day').getBoundingClientRect().width,internalHorizontalScroll:e.scrollWidth>e.clientWidth,mainOverflow:m.scrollWidth-m.clientWidth};});
   assert.equal(range.days,126);assert(range.dayWidth>=44);if(width<=640){assert(range.left>=0&&range.right<=width&&range.top>=0&&range.bottom<=812);assert.equal(range.mainOverflow,0);assert(range.internalHorizontalScroll);}
   cases.at(-1).threeMonthRange=range;
   await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
   if(width<=640){
    await page.evaluate(()=>{document.documentElement.style.setProperty('--qd-control-height','48px');document.documentElement.style.setProperty('--qd-radius','14px');});
    await page.getByRole('button',{name:'달력 열기',exact:true}).click();
    const changed=await page.getByRole('dialog',{name:'날짜 선택'}).evaluate(e=>({radius:getComputedStyle(e).borderRadius,dayHeight:e.querySelector('.qd-calendar-day').getBoundingClientRect().height,fileHeight:document.querySelector('label:has(input[type="file"])').getBoundingClientRect().height,fileRadius:getComputedStyle(document.querySelector('label:has(input[type="file"])')).borderRadius}));
    assert.equal(changed.radius,'14px');assert.equal(changed.fileRadius,'14px');assert(changed.dayHeight>=48&&changed.fileHeight>=48);cases.at(-1).centralMutation=changed;
    await page.setViewportSize({width,height:480});const short=await page.getByRole('dialog',{name:'날짜 선택'}).evaluate(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,overflowX:e.scrollWidth-e.clientWidth,scrollHeight:e.scrollHeight,height:e.clientHeight}));assert(short.top>=0&&short.bottom<=480);assert.equal(short.overflowX,0);cases.at(-1).shortViewport=short;
   }
   await page.keyboard.press('Escape');await page.getByRole('button',{name:'1번 줄 지우기',exact:true}).click();assert.equal(await page.getByRole('button',{name:/번 줄 지우기/}).count(),1);assert(await page.getByRole('button',{name:'1번 줄 지우기',exact:true}).isDisabled());cases.at(-1).lastSaleRowGuard=true;
  }
  await page.close();
 }
 fs.writeFileSync(path.join(root,'reviews',baseline?'calendar-layout-baseline.json':'calendar-layout-browser-results.json'),JSON.stringify({scope:'Mounted actual Maison DatePicker, Calendar and source-extracted unchanged FilePick. Product CSS. No production data or submissions. Mobile popup geometry, file target size, date min/max, selection and dismissal.',cases,passed:baseline?null:cases.length,failures:baseline?null:0},null,2)+'\n');
 console.log(JSON.stringify({baseline,cases:cases.length,mainOverflow:cases.map(c=>c.mainOverflow),fileHeights:cases.map(c=>c.fileHeight)}));
}finally{await browser?.close();fs.rmSync(temporary,{recursive:true,force:true});}
