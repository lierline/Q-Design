// Isolated actual class/CSS fixture. No operating account or business submission.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {verifyMaisonCaptionRoles,maisonCaptionClass} from './maison-caption-roles.mjs';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works',req=createRequire(product+'/package.json'),ts=req('typescript');
const manifest=await verifyMaisonCaptionRoles(),sites=[];
for(const record of manifest.records){
 const code=fs.readFileSync(product+'/'+record.path,'utf8'),sf=ts.createSourceFile(record.path,code,99,true,4);
 for(const [index,change] of record.changes.entries()){
  const matches=[];const visit=n=>{
   if(ts.isJsxAttribute(n)&&n.name.text==='className'&&ts.isStringLiteral(n.initializer)&&n.initializer.text.split(/\s+/).includes(maisonCaptionClass))matches.push(n);
   ts.forEachChild(n,visit);
  };visit(sf);assert.equal(matches.length,record.changes.length,'Every exact rendered caption class must resolve');
  const n=matches[index],tag=n.parent.parent.tagName.getText(sf);assert(['span','div','p'].includes(tag),'Reviewed intrinsic caption element: '+record.path+':'+change.line+' '+tag);
  sites.push({path:record.path,line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,sourceHash:hash(code),tag,className:n.initializer.text});
 }
}
const postcss=req('postcss'),config=req('tailwindcss/loadConfig')(product+'/tailwind.config.ts');config.content=[{raw:sites.map(s=>s.className).join(' '),extension:'html'}];
let css=(await postcss([req('postcss-import')(),req('tailwindcss')(config)]).process(fs.readFileSync(product+'/app/globals.css','utf8'),{from:product+'/app/globals.css'})).css;
css=css.replace(/url\(['"]?(\/fonts\/[^'"\)]+\.woff2)['"]?\)/g,(_,url)=>'url(data:font/woff2;base64,'+fs.readFileSync(product+'/public'+url).toString('base64')+')');
const {chromium}=createRequire('D:/Claude/Q-Atelier/package.json')('playwright'),browser=await chromium.launch({channel:'msedge',headless:true}),cases=[];
try{
 for(const width of [320,390,1280])for(const size of [12,24])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width,height:844}});await page.route('**/*',r=>r.abort());
  const escape=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  const content=sites.map((s,i)=>'<section><'+s.tag+' data-caption="'+i+'" class="'+escape(s.className)+'">QMN-PR-261012-01 · 참조 번호</'+s.tag+'></section>').join('');
  await page.setContent('<html data-product="maison" data-theme="'+theme+'" class="'+theme+'"><head><style>'+css+'\nbody{margin:0;padding:16px}section{margin-bottom:16px}:root{--qd-caption-size:'+size+'px}</style></head><body>'+content+'</body></html>');
  const measure=()=>page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,captions:Array.from(document.querySelectorAll('[data-caption]')).map(e=>({size:getComputedStyle(e).fontSize,family:getComputedStyle(e).fontFamily,text:e.textContent}))}));
  const before=await measure();assert.equal(before.captions.length,sites.length);assert(before.captions.every(c=>c.size===size+'px'));assert.equal(before.overflow,0);
  await page.evaluate(()=>document.documentElement.style.setProperty('--qd-caption-size','18px'));const mutation=await measure();assert(mutation.captions.every(c=>c.size==='18px'));assert.equal(mutation.overflow,0);
  cases.push({width,size,theme,before,mutation});await page.close();
 }
}finally{await browser.close();}
fs.writeFileSync(root+'/reviews/maison-caption-browser.json',JSON.stringify({scope:'Eleven exact current intrinsic caption elements and actual product CSS. Twelve narrow/wide, dark/light and normal/enlarged font fixtures. Central caption mutation changes every element. No production data, page-wide workflow or submissions are claimed.',sites,cases,passed:cases.length,failures:0},null,2)+'\n');console.log(JSON.stringify({sites:sites.length,cases:cases.length,passed:true}));
