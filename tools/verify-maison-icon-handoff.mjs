// Render actual product modules. No substitute SVG geometry or operating-account writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
import {syncMaisonIconHandoff} from './maison-icon-handoff.mjs';
await syncMaisonIconHandoff({check:true});
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',req=createRequire(repo+'/package.json'),ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
function load(file,imports){
 const module={exports:{}},js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('require','module','exports',js)(name=>Object.hasOwn(imports,name)?imports[name]:req(name),module,module.exports);return module.exports;
}
const factory=load(repo+'/components/q-design-icons/_icon.tsx',{}),names=['BadgePercent','CalendarCheck','CalendarMinus','Coins','Repeat','Clock','FileWarning','RefreshCw'];
const icons=names.map(name=>({name,Icon:load(repo+'/components/q-design-icons/'+name+'.tsx',{'./_icon':factory})[name]}));
const html=renderToStaticMarkup(React.createElement('main',null,icons.map(({name,Icon})=>React.createElement('section',{key:name},React.createElement('span',null,name),React.createElement(Icon,{'data-case':'default','aria-label':name,strokeWidth:9}),React.createElement(Icon,{'data-case':'explicit',size:16}),React.createElement(Icon,{'data-case':'small',className:'qd-icon--sm'})))));
const {chromium}=createRequire('D:/Claude/Q-Atelier/package.json')('playwright'),browser=await chromium.launch({channel:'msedge',headless:true}),cases=[];
try{
 for(const [product,folder]of [['atelier','Q-Atelier'],['maison','Q-Works'],['carnet','DHR']])for(const theme of ['dark','light']){
  const page=await browser.newPage({viewport:{width:390,height:844}});await page.route('**/*',r=>r.abort());
  const css=fs.readFileSync('D:/Claude/'+folder+'/app/q-design.components.css','utf8')+'\n'+fs.readFileSync('D:/Claude/'+folder+'/app/q-design.foundation.css','utf8')+'\n'+fs.readFileSync(root+'/dist/q-design.palette.'+product+'.css','utf8');
  await page.setContent('<html data-product="'+product+'" data-theme="'+theme+'" class="'+theme+'"><head><style>'+css+'\nbody{margin:0;padding:16px}main{display:grid;gap:12px}section{display:flex;align-items:center;gap:20px;padding:12px;border:1px solid #777;border-radius:var(--qd-radius);font:13px sans-serif}section span{flex:1;min-width:0}</style></head><body>'+html+'</body></html>');
  const measure=()=>page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,icons:[...document.querySelectorAll('svg')].map(e=>({case:e.dataset.case,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,viewBox:e.getAttribute('viewBox'),fill:getComputedStyle(e).fill,stroke:getComputedStyle(e).stroke,paths:e.querySelectorAll('path').length,hidden:e.getAttribute('aria-hidden'),name:e.getAttribute('aria-label'),family:e.dataset.qdIcon}))}));
  const before=await measure();assert.equal(before.overflow,0);assert.equal(before.icons.length,24);
  for(const icon of before.icons){assert.equal(icon.width,icon.case==='default'?20:16);assert.equal(icon.height,icon.width);assert.equal(icon.viewBox,'0 0 256 256');assert.equal(icon.stroke,'none');assert(icon.paths>0);assert(icon.family);assert(icon.case==='default'?icon.name&&!icon.hidden:icon.hidden==='true');}
  await page.evaluate(()=>{document.documentElement.style.setProperty('--qd-icon-size','28px');document.documentElement.style.setProperty('--qd-icon-size-sm','18px');});
  const mutation=await measure();assert.equal(mutation.overflow,0);
  for(const icon of mutation.icons){assert.equal(icon.width,icon.case==='default'?28:icon.case==='small'?18:16);assert.equal(icon.height,icon.width);}
  if(product==='maison'&&theme==='dark')await page.screenshot({path:root+'/reviews/maison-icon-handoff.png'});
  cases.push({product,theme,width:390,before,mutation});await page.close();
 }
}finally{await browser.close();}
const files=['components/q-design-icons/_icon.tsx',...names.map(n=>'components/q-design-icons/'+n+'.tsx')];
fs.writeFileSync(root+'/reviews/maison-icon-handoff-browser.json',JSON.stringify({scope:'Eight actual Maison product icon modules across the three shipped CSS families and two themes. Narrow 390px fixtures, central default/small-size mutation, explicit size preservation, Regular paths, legacy stroke suppression and accessibility semantics. This is an isolated component check, not evidence of authenticated business screens.',sources:files.map(file=>({path:file,hash:hash(fs.readFileSync(repo+'/'+file,'utf8'))})),cases,passed:cases.length,failures:0},null,2)+'\n');
console.log(JSON.stringify({cases:cases.length,iconsPerCase:24,passed:true}));
