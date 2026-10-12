// Isolated actual paper component and product CSS. All values are local fixtures.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fixture,render,current,specs} from './maison-inspection-print.test.mjs';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',req=createRequire(repo+'/package.json'),postcss=req('postcss');
const sheets=Object.entries(specs).map(([kind,spec])=>({kind,markup:render(current,fixture(spec,41,['가로','세로','높이']))}));
const config=req('tailwindcss/loadConfig')(repo+'/tailwind.config.ts');config.content=[{raw:sheets.map(s=>s.markup).join(' '),extension:'html'}];
let css=(await postcss([req('postcss-import')(),req('tailwindcss')(config)]).process(fs.readFileSync(repo+'/app/globals.css','utf8'),{from:repo+'/app/globals.css'})).css;
css=css.replace(/url\(['"]?(\/fonts\/[^'"\)]+\.woff2)['"]?\)/g,(_,url)=>'url(data:font/woff2;base64,'+fs.readFileSync(repo+'/public'+url).toString('base64')+')');
const {chromium}=createRequire('D:/Claude/Q-Atelier/package.json')('playwright'),browser=await chromium.launch({channel:'msedge',headless:true}),cases=[];
try{
 for(const width of [390,1280])for(const sheet of sheets){
  const page=await browser.newPage({viewport:{width,height:900}});await page.route('**/*',r=>r.abort());
  await page.setContent('<html data-product="maison" data-theme="light" class="light"><head><style>'+css+'</style></head><body>'+sheet.markup+'</body></html>');await page.evaluate(()=>document.fonts.ready);
  const result=await page.evaluate(()=>({width:innerWidth,paperWidth:document.querySelector('.print-paper').getBoundingClientRect().width,font:getComputedStyle(document.querySelector('.print-paper')).fontFamily,headingSize:[...document.querySelectorAll('td')].find(e=>e.style.fontSize==='12.5pt')?.style.fontSize,cells:document.querySelectorAll('td,th').length,columns:[...document.querySelectorAll('col')].map(e=>e.style.width),clipped:[...document.querySelectorAll('.print-paper th,.print-paper td')].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent.trim().slice(0,50),width:e.clientWidth,scroll:e.scrollWidth})),text:document.querySelector('.print-paper').textContent}));
  assert(result.cells>50);assert(result.columns.includes('75%'));assert.equal(result.headingSize,'12.5pt');
  const sampleNumbers=await page.evaluate(()=>[...document.querySelectorAll('th')].filter(e=>/^#\d{3}$/.test(e.textContent)).map(e=>{const range=document.createRange();range.selectNodeContents(e);return {text:e.textContent,whiteSpace:getComputedStyle(e).whiteSpace,lines:range.getClientRects().length};}));assert(sampleNumbers.length>0);assert(sampleNumbers.every(e=>e.whiteSpace==='nowrap'&&e.lines===1),'Each sample identifier must remain on one line');result.sampleNumbers=sampleNumbers;
  cases.push({kind:sheet.kind,...result});
  if(width===1280&&sheet.kind==='wire_bending')await page.screenshot({path:'D:/Claude/tmp/qd-phase87-inspection-print-fixture.png',fullPage:true});await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync(root+'/reviews/maison-inspection-print-browser.json',JSON.stringify({scope:'Five real inspection paper components at 390 and 1280 CSS pixels. Actual product styles and locally embedded shipped font bytes; 41-sample PF and measurement local fixtures. No operating record, browser account, print-dialog pagination or database workflow is claimed. Clipping is reported independently of central token linkage.',sourceHash:hash(current),cases,passed:cases.length,failures:0},null,2)+'\n');console.log(JSON.stringify({cases:cases.length,clipped:cases.map(c=>({kind:c.kind,width:c.width,count:c.clipped.length})),passed:true}));
