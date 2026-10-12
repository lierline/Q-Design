import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {safetyPlan} from './maison-safety-print-migration.mjs';
import {incidentPath,incidentFixture,monthFixture,renderSafety} from './maison-safety-print-fixture.mjs';
import {hash} from './style-arguments-core.mjs';
const repo='D:/Claude/Q-Works',req=createRequire(repo+'/package.json'),sheets=[];
for(const f of safetyPlan())for(const mode of['before','after'])sheets.push({kind:f.file===incidentPath?'incident':'month',mode,markup:await renderSafety(f.file,f[mode],f.file===incidentPath?incidentFixture(7,true):monthFixture())});
const config=req('tailwindcss/loadConfig')(repo+'/tailwind.config.ts');config.content=[{raw:sheets.map(s=>s.markup).join(' '),extension:'html'}];
let css=(await req('postcss')([req('postcss-import')(),req('tailwindcss')(config)]).process(fs.readFileSync(repo+'/app/globals.css','utf8'),{from:repo+'/app/globals.css'})).css;
css=css.replace(/url\(['"]?(\/fonts\/[^'"\)]+\.woff2)['"]?\)/g,(_,url)=>'url(data:font/woff2;base64,'+fs.readFileSync(repo+'/public'+url).toString('base64')+')');
const {chromium}=createRequire('D:/Claude/Q-Atelier/package.json')('playwright'),browser=await chromium.launch({channel:'msedge',headless:true}),cases=[];
try{for(const width of[390,1280])for(const theme of['light','dark'])for(const sheet of sheets){
 const page=await browser.newPage({viewport:{width,height:900}});await page.route('**/*',r=>r.abort());await page.setContent('<html data-product="maison" data-theme="'+theme+'" class="'+theme+'"><head><style>'+css+'</style></head><body>'+sheet.markup+'</body></html>');await page.evaluate(()=>document.fonts.ready);
 const result=await page.evaluate(()=>{const paper=document.querySelector('article.print-paper'),style=getComputedStyle(paper);return {paperWidth:paper.getBoundingClientRect().width,background:style.backgroundColor,color:style.color,cells:paper.querySelectorAll('td,th').length,clipped:[...paper.querySelectorAll('td,th')].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent.slice(0,40),client:e.clientWidth,scroll:e.scrollWidth}))};});assert.equal(result.background,'rgb(255, 255, 255)');assert.equal(result.color,'rgb(0, 0, 0)');assert.equal(result.clipped.length,0,sheet.kind+' '+sheet.mode);
 cases.push({kind:sheet.kind,mode:sheet.mode,width,theme,...result});if(width===1280&&theme==='light'&&sheet.mode==='after')await page.screenshot({path:'D:/Claude/tmp/qd-phase90-'+sheet.kind+'-paper-preview.png',fullPage:true});await page.close();
}}finally{await browser.close();}
fs.writeFileSync('D:/Claude/Q-Design/reviews/maison-safety-print-browser.json',JSON.stringify({scope:'Actual safety components and product CSS with isolated synthetic records. Physical A4 canvas, not mobile page fit, live database record or pagination proof.',sourceHashes:safetyPlan().map(f=>({path:f.file,hash:hash(fs.readFileSync(repo+'/'+f.file,'utf8'))})),canonicalHash:hash(fs.readFileSync('D:/Claude/Q-Design/patterns/foundation/maison-safety-print.ts','utf8')),cases},null,2)+'\n');console.log(JSON.stringify({cases:cases.length,clipped:cases.reduce((n,c)=>n+c.clipped.length,0)}));
