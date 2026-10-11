// Mount the exact Atelier knowledge-file input and its unchanged style helper.
// No file dialog, upload, account operation or service request is performed.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),product=path.resolve(root,'../Q-Atelier');
const req=createRequire(path.join(product,'package.json')),ts=req('typescript');
const {build}=await import(pathToFileURL(req.resolve('vite')).href),{chromium}=req('playwright');
const code=fs.readFileSync(path.join(product,'app/(app)/admin/knowledge/page.tsx'),'utf8');
const sf=ts.createSourceFile('knowledge.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const helper=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='inputStyle');
let input;
function visit(n){if(ts.isJsxSelfClosingElement(n)&&n.tagName.getText(sf)==='input'&&n.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.text==='id'&&a.initializer?.text==='knowledge-file'))input=n;ts.forEachChild(n,visit);}visit(sf);
assert(helper&&input,'Actual knowledge file control and style helper must exist');
const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'qd-native-file-')),entry=path.join(temporary,'fixture.tsx');
fs.writeFileSync(entry,`import React from 'react';import {createRoot} from 'react-dom/client';import {QDScale} from '@/lib/design/q-design-scale';import {T} from '@/lib/design/tokens';const setFile=()=>{};${helper.getText(sf)};function Fixture(){return <><label htmlFor="knowledge-file">파일 검수</label>${input.getText(sf)}<label className="qd-control-icon"><input type="file" className="sr-only" accept=".txt"/>숨김 파일</label></>};createRoot(document.getElementById('root')).render(<Fixture/>);`);
let browser;
try{
 const result=await build({configFile:false,root:product,logLevel:'error',plugins:[{name:'actual-tsx',enforce:'pre',transform(code,id){if(/\.[jt]sx$/.test(id))return{code:ts.transpileModule(code,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText,map:null};}}],resolve:{alias:{'@':product}},build:{write:false,minify:false,lib:{entry,formats:['iife'],name:'QdNativeFileFixture'},rolldownOptions:{resolve:{modules:[path.join(product,'node_modules'),'node_modules']}}},define:{'process.env.NODE_ENV':JSON.stringify('production')}});
 const bundle=(Array.isArray(result)?result[0]:result).output.find(a=>a.type==='chunk').code;
 browser=await chromium.launch({channel:'msedge',headless:true});const cases=[];
 for(const owner of ['atelier','maison','carnet'])for(const width of [320,375,1280])for(const fontSize of [13,24])for(const theme of ['dark','light']){
  const css=['patterns/foundation.css',`patterns/foundation/${owner}.css`,'patterns/foundation/atelier-values.css','patterns/foundation/atelier-core-values.css','patterns/components.css',`dist/q-design.palette.${owner}.css`].map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
  const page=await browser.newPage({viewport:{width,height:812}});await page.setContent(`<html data-theme="${theme}" class="${theme==='dark'?'dark':''}"><head><style>${css}\n:root{--qd-control-size:${fontSize}px}body{margin:0;padding:16px;box-sizing:border-box}#root{width:100%;min-width:0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}</style></head><body><div id="root"></div><script>${bundle.replaceAll('</script','<\\/script')}</script></body></html>`);
  await page.locator('#knowledge-file').waitFor();
  const measure=()=>page.locator('#knowledge-file').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),p=getComputedStyle(e,'::file-selector-button'),hidden=document.querySelector('.sr-only');return {height:r.height,width:r.width,radius:s.borderRadius,fontSize:s.fontSize,padding:s.padding,selectorHeight:p.minHeight,selectorRadius:p.borderRadius,selectorFont:p.fontSize,selectorBackground:p.backgroundColor,accept:e.accept,multiple:e.multiple,hiddenHeight:hidden.getBoundingClientRect().height,pageOverflow:document.documentElement.scrollWidth-innerWidth};});
  const before=await measure();assert(before.height>=44);assert.equal(before.radius,'10px');assert.equal(before.selectorRadius,'10px');assert.equal(parseFloat(before.fontSize),fontSize);assert.equal(before.selectorFont,before.fontSize);assert.equal(before.padding,'0px');assert.equal(before.pageOverflow,0);assert.equal(before.hiddenHeight,1);assert.equal(before.accept,'.pdf,.xlsx,.xls,.csv,.txt,.md');assert.equal(before.multiple,false);
  await page.keyboard.press('Tab');assert.equal(await page.locator('#knowledge-file').evaluate(e=>e===document.activeElement),true);assert.notEqual(await page.locator('#knowledge-file').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
  await page.evaluate(()=>{document.documentElement.style.setProperty('--qd-control-height','48px');document.documentElement.style.setProperty('--qd-radius','14px');});const changed=await measure();assert(changed.height>=48);assert.equal(changed.radius,'14px');assert.equal(changed.selectorRadius,'14px');assert.equal(changed.hiddenHeight,1);assert.equal(changed.pageOverflow,0);
  cases.push({owner,width,fontSize,theme,before,centralMutation:changed,keyboardFocus:true});if(owner==='atelier'&&width===375&&fontSize===13&&theme==='dark')await page.screenshot({path:path.join(root,'reviews/native-file-control-after.png')});await page.close();
 }
 fs.writeFileSync(path.join(root,'reviews/native-file-control-browser-results.json'),JSON.stringify({scope:'Exact source-extracted Atelier knowledge-file input and style helper, three canonical product styles, native selector typography/targets, keyboard focus, central height/radius mutation and sr-only isolation. No uploads or dialogs.',passed:cases.length,failures:0,cases},null,2)+'\n');console.log(JSON.stringify({cases:cases.length,failures:0}));
}finally{await browser?.close();fs.rmSync(temporary,{recursive:true,force:true});}
