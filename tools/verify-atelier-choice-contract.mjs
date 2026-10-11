// Dedicated component regression. The desktop application is separately
// exercised through CUA. This fixture does not certify a physical touch device.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const qa='D:/Claude/Q-Atelier',qd='D:/Claude/Q-Design';
const require=createRequire(qa+'/package.json'),ts=require('typescript');
const cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 const module={exports:{}};cache.set(file,module.exports);
 const localRequire=name=>{
  if(!name.startsWith('.')&&!name.startsWith('@/'))return require(name);
  const base=name.startsWith('@/')?path.join(qa,name.slice(2)):path.resolve(path.dirname(file),name);
  const found=[base,base+'.ts',base+'.tsx'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  assert.ok(found,'Missing actual fixture dependency '+name);return load(found);
 };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:localRequire,process},{filename:file});
 cache.set(file,module.exports);return module.exports;
}
const file=qa+'/app/(app)/assessments/new/page.tsx',source=fs.readFileSync(file,'utf8');
const sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),buttons=[];
const visit=n=>{if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(sf)==='button'&&n.openingElement.attributes.getText(sf).includes('...choiceLook(val ==='))buttons.push(n.getText(sf));ts.forEachChild(n,visit);};visit(sf);assert.equal(buttons.length,2);
const exports={};
const globals={...load(qa+'/lib/design/segmented-choice.tsx'),...load(qa+'/lib/design/tokens.ts'),...load(qa+'/lib/design/q-design-scale.ts'),setImpactChecks:()=>{},ic:{id:'safety'}};
vm.runInNewContext(ts.transpileModule('export function Impact({val}){return <>'+buttons.join('\n')+'</>}',{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require,...globals});
const {renderToStaticMarkup}=require('react-dom/server');
const css=fs.readFileSync(qd+'/dist/q-design.foundation.atelier.css','utf8')+'\n'+fs.readFileSync(qd+'/patterns/components.css','utf8');
const {chromium}=require('playwright'),browser=await chromium.launch({channel:'msedge',headless:true});
const findings=[];
try{
 for(const touch of [false,true]){
  const context=await browser.newContext({viewport:{width:touch?412:1280,height:900},isMobile:touch,hasTouch:touch});
  const page=await context.newPage();
  for(const val of [null,'none','has']){
   const html=renderToStaticMarkup(exports.Impact({val}));
   await page.setContent('<html data-theme="dark"><head><style>'+css+'</style></head><body><main style="display:flex;gap:6px;width:90%;margin:20px">'+html+'</main></body></html>');
   const read=()=>page.locator('main button').evaluateAll(es=>es.map(e=>({height:e.getBoundingClientRect().height,minHeight:getComputedStyle(e).minHeight,pressed:e.getAttribute('aria-pressed')})));
   const measured=await read();assert.equal(measured.length,2);
   for(const m of measured)assert.equal(m.height,touch?44:36,`Actual impact choice ${val}, touch=${touch}`);
   await page.addStyleTag({content:':root { --qd-control-height: 48px; --qd-control-height-sm: 40px; }'});
   const changed=await read();for(const m of changed)assert.equal(m.height,touch?48:40,'Central size mutation reaches actual consumer');
   findings.push({touch,val,measured,changed});
  }
  await context.close();
 }
}finally{await browser.close();}
fs.writeFileSync(qd+'/reviews/atelier-choice-contract-browser.json',JSON.stringify({scope:'Actual button JSX, actual choiceLook/ChoiceCheck helpers and live Q-Design CSS in an isolated regression fixture. Desktop live-app CUA verification recorded separately.',findings},null,2)+'\n');
console.log('Impact choice regression: 6 state/device scenarios, stable 36/44px and central 40/48px mutation passed.');
