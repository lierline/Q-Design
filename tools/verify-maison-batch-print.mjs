// Isolated actual manufacturing paper components, product CSS and shipped fonts.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {renderBatch,batchFixture,currentBatch,batchSpecs} from './maison-batch-print-fixture.mjs';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',req=createRequire(repo+'/package.json'),postcss=req('postcss'),sheets=Object.entries(batchSpecs).map(([kind,spec])=>({kind,markup:renderBatch(currentBatch,batchFixture(spec,true))}));
const config=req('tailwindcss/loadConfig')(repo+'/tailwind.config.ts');config.content=[{raw:sheets.map(s=>s.markup).join(' '),extension:'html'}];
let css=(await postcss([req('postcss-import')(),req('tailwindcss')(config)]).process(fs.readFileSync(repo+'/app/globals.css','utf8'),{from:repo+'/app/globals.css'})).css;
css=css.replace(/url\(['"]?(\/fonts\/[^'"\)]+\.woff2)['"]?\)/g,(_,url)=>'url(data:font/woff2;base64,'+fs.readFileSync(repo+'/public'+url).toString('base64')+')');
const {chromium}=createRequire('D:/Claude/Q-Atelier/package.json')('playwright'),browser=await chromium.launch({channel:'msedge',headless:true}),cases=[];
try{
 for(const width of [390,1280])for(const theme of ['light','dark'])for(const sheet of sheets){const page=await browser.newPage({viewport:{width,height:900}});await page.route('**/*',r=>r.abort());await page.setContent('<html data-product="maison" data-theme="'+theme+'" class="'+theme+'"><head><style>'+css+'</style></head><body>'+sheet.markup+'</body></html>');await page.evaluate(()=>document.fonts.ready);
  const result=await page.evaluate(()=>{const p=document.querySelector('article.print-paper'),s=getComputedStyle(p);return {width:innerWidth,paperWidth:p.getBoundingClientRect().width,background:s.backgroundColor,color:s.color,font:s.fontFamily,cells:p.querySelectorAll('td,th').length,clipped:[...p.querySelectorAll('td,th')].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent.trim().slice(0,60),width:e.clientWidth,scroll:e.scrollWidth}))};});assert.equal(result.background,'rgb(255, 255, 255)');assert.equal(result.color,'rgb(0, 0, 0)');assert(result.cells>50);
  cases.push({kind:sheet.kind,theme,...result});if(width===1280&&theme==='light'&&sheet.kind==='forming')await page.screenshot({path:'D:/Claude/tmp/qd-phase89-batch-print-fixture.png',fullPage:true});await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync(root+'/reviews/maison-batch-print-browser.json',JSON.stringify({scope:'Four real manufacturing forms at 390/1280 pixels in dark/light themes, local populated record fixtures and actual product CSS/font bytes. A4 canvas remains physical width; cell clipping is reported separately. No operating record or print-dialog pagination is claimed.',sourceHash:hash(currentBatch),cases,passed:cases.length,failures:0},null,2)+'\n');console.log(JSON.stringify({cases:cases.length,clipped:cases.map(c=>({kind:c.kind,width:c.width,theme:c.theme,count:c.clipped.length})),passed:true}));
