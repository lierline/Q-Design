import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import os from 'node:os';

const root=path.resolve(import.meta.dirname,'..'),product=path.resolve(root,'../Q-Atelier');
const req=createRequire(path.join(product,'package.json'));
const {build}=await import(pathToFileURL(req.resolve('vite')).href);
const {chromium}=req('playwright');
const ts=req('typescript');
const baseline=process.argv.includes('--baseline');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'qd-chart-'));
const entry=path.join(temporary,'fixture.tsx');
fs.writeFileSync(entry,`import React from 'react';
import {createRoot} from 'react-dom/client';
import {TimeSeriesChart} from ${JSON.stringify(path.join(product,'components/TimeSeriesChart.tsx').replaceAll('\\','/'))};
const data=Array.from({length:30},(_,i)=>i+1);
const labels=data.map(i=>'2026-10-'+String(i).padStart(2,'0'));
const root=createRoot(document.getElementById('root'));
window.renderChartFixture=(mode='normal')=>root.render(<TimeSeriesChart labels={mode==='empty'?[]:mode==='single'?['2026-10-01']:mode==='long'?labels.map((l,i)=>i===29?'최종 검토 기록: 길이가 긴 날짜 설명과 업무 이름':l):labels} series={[{label:'실적',color:'var(--qa-blue)',data:mode==='single'?[1]:data},{label:'목표',color:'var(--qa-green)',data:mode==='single'?[20]:data.map(()=>20)}]} height={220} unit="건"/>);
window.renderChartFixture();
`);
let browser;
try{
 const result=await build({configFile:false,root:product,logLevel:'error',plugins:[{name:'actual-product-tsx',enforce:'pre',transform(code,id){if(/\.[jt]sx$/.test(id))return {code:ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,map:null};}}],resolve:{alias:{'@':product}},build:{write:false,minify:false,lib:{entry,formats:['iife'],name:'QdChartFixture'},rolldownOptions:{resolve:{modules:[path.join(product,'node_modules'),'node_modules']}}},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const bundle=(Array.isArray(result)?result[0]:result).output.find(item=>item.type==='chunk').code;
 const css=['patterns/foundation.css','patterns/foundation/atelier.css','patterns/foundation/atelier-values.css','patterns/foundation/atelier-core-values.css','patterns/components.css','dist/q-design.palette.atelier.css'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n');
 browser=await chromium.launch({channel:'msedge',headless:true});
 const cases=[];
 for(const width of [320,375,1280])for(const fontSize of [12,24])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width,height:812}});
  await page.setContent(`<html data-theme="${theme}"><head><style>${css}\n:root{--qd-font-size-12:${fontSize}px}body{margin:0;padding:16px;box-sizing:border-box}#root{width:100%;min-width:0}</style></head><body><div id="root"></div><script>${bundle.replaceAll('</script','<\\/script')}</script></body></html>`);
  await page.locator('svg text').first().waitFor();
  if(!baseline)await page.waitForFunction(()=>Math.abs(document.querySelector('svg').getScreenCTM().a-1)<.01);
  const measured=await page.evaluate(()=>{
   const svg=document.querySelector('svg'),texts=[...svg.querySelectorAll('text')];
   const xLabels=[...document.querySelectorAll('.qd-chart-axis-labels span')].concat(texts.filter(t=>/^2026-10-/.test(t.textContent))).map(t=>{const r=t.getBoundingClientRect(),align=getComputedStyle(t).textAlign;return{text:t.textContent,left:r.left,right:r.right,width:r.width,client:t.clientWidth,scroll:t.scrollWidth,height:r.height,anchor:align==='start'?r.left:align==='end'?r.right:(r.left+r.right)/2};});
   const ranges=xLabels.slice(1).map((t,i)=>t.left-xLabels[i].right),bounds=svg.getBoundingClientRect();
   return{viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,svgWidth:bounds.width,viewBox:svg.getAttribute('viewBox'),scaleX:svg.getScreenCTM().a,fontSize:parseFloat(getComputedStyle(texts[0]).fontSize),xLabels,gaps:ranges,points:svg.querySelectorAll('circle').length,hasInvalidGeometry:/NaN|undefined/.test(svg.outerHTML),clippedTickLabels:texts.filter(t=>{const r=t.getBoundingClientRect();return r.left<bounds.left-.5||r.right>bounds.right+.5||r.top<bounds.top-.5||r.bottom>bounds.bottom+.5;}).length,pointGeometry:[...svg.querySelectorAll('circle')].slice(0,30).map(p=>({x:parseFloat(p.getAttribute('cx')),y:parseFloat(p.getAttribute('cy'))}))};
  });
  if(!baseline){assert.equal(measured.pageWidth,width);assert(Math.abs(measured.scaleX-1)<.01,'SVG labels must retain their actual font width');assert.equal(measured.fontSize,fontSize);assert.equal(measured.clippedTickLabels,0);assert(measured.gaps.every(g=>g>=0),'date labels overlap');assert(measured.xLabels.every(t=>t.scroll<=t.client+1),'wrapped date label exceeds its cell');assert.equal(measured.xLabels[0].text,'2026-10-01');assert.equal(measured.xLabels.at(-1).text,'2026-10-30');assert.equal(measured.points,60);assert.equal(measured.hasInvalidGeometry,false);}
  cases.push({width,fontSize,theme,...measured});
  if(width===375&&fontSize===12&&theme==='dark')await page.screenshot({path:path.join(root,'reviews',baseline?'chart-responsive-before.png':'chart-responsive-after.png')});
  if(!baseline){
   const points=measured.pointGeometry;
   assert(points.every((p,i)=>i===0||p.x>points[i-1].x&&p.y<points[i-1].y),'the ascending data trend must remain ascending');
   const svgLeft=await page.locator('svg').evaluate(e=>e.getBoundingClientRect().left);
   assert(measured.xLabels.every(label=>Math.abs(label.anchor-svgLeft-points[Number(label.text.slice(-2))-1].x)<=1),'axis label does not anchor to its actual data point');
   await page.setViewportSize({width:640,height:812});
   await page.waitForFunction(()=>Math.abs(document.querySelector('svg').getScreenCTM().a-1)<.01);
   const resized=await page.evaluate(()=>({scaleX:document.querySelector('svg').getScreenCTM().a,points:document.querySelectorAll('svg circle').length}));
   assert.equal(resized.points,60);assert(Math.abs(resized.scaleX-1)<.01);cases.at(-1).resize=resized;
   await page.evaluate(()=>document.documentElement.style.setProperty('--qd-font-size-12','24px'));
   await page.waitForFunction(()=>parseFloat(document.querySelector('svg circle').getAttribute('cx'))===72);
   await page.evaluate(()=>window.renderChartFixture('single'));
   await page.waitForFunction(()=>document.querySelectorAll('svg circle').length===2);
   assert.equal(await page.locator('.qd-chart-axis-labels span').count(),1);
   await page.evaluate(()=>window.renderChartFixture('long'));
   await page.waitForFunction(()=>document.querySelector('.qd-chart-axis-labels').textContent.includes('최종 검토 기록'));
   const long=await page.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,overflows:[...document.querySelectorAll('.qd-chart-axis-labels span')].filter(s=>s.scrollWidth>s.clientWidth+1).length}));
   assert.equal(long.page,long.viewport);assert.equal(long.overflows,0);
   await page.evaluate(()=>window.renderChartFixture('empty'));
   await page.getByText('데이터 없음',{exact:true}).waitFor();
   assert.equal(await page.locator('svg').count(),0);
   cases.at(-1).additionalStates={dynamicFont:true,singlePoint:true,longLabel:true,empty:true};
  }
  await page.close();
 }
 fs.writeFileSync(path.join(root,'reviews',baseline?'chart-responsive-baseline.json':'chart-responsive-browser-results.json'),JSON.stringify({scope:'Actual mounted TimeSeriesChart from product source, bundled with installed Vite. Central CSS, mobile/desktop widths and normal/doubled font sizes. Not a full dashboard, role, production-data or physical-device certificate.',cases,passed:baseline?null:cases.length,failures:baseline?null:0},null,2)+'\n');
 console.log(JSON.stringify({baseline,cases:cases.length,scales:cases.map(c=>c.scaleX)}));
}finally{await browser?.close();fs.rmSync(temporary,{recursive:true,force:true});}
