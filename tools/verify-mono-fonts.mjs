// Isolated browser fixture. Actual shipped CSS and whole font binaries only.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createMonoFonts,monoRoots,monoHash} from './mono-fonts-core.mjs';
import {loadIconRuntime,assertIconBrowserVersion} from './app-icon-runtime.mjs';
const root='D:/Claude/Q-Design',output=createMonoFonts(),read=p=>fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
const {chromium}=loadIconRuntime(monoRoots.atelier),browser=await chromium.launch({headless:true});
assertIconBrowserVersion(browser.version());
const records=[],sample='LOT-20261012 0123456789',resources=[];
function embed(css,repo){return css.replace(/url\(['"](\/fonts\/[^'"]+\.woff2)['"]\)/g,(_,url)=>{assert(!url.includes('..'));const bytes=fs.readFileSync(repo+'/public'+url);resources.push({repo,path:'public'+url,hash:monoHash(bytes)});return 'url(data:font/woff2;base64,'+bytes.toString('base64')+')';});}
try{
 for(const [product,repo] of Object.entries(monoRoots)){
  const baselineFonts=product==='maison'?'':read(repo+'/app/fonts.css');
  const addedFonts=product==='atelier'?'':read(repo+'/app/q-design.mono-fonts.css');
  const base=read(repo+'/app/q-design.foundation.css');
  const palette=read(root+`/dist/q-design.palette.${product}.css`);
  for(const theme of ['light','dark'])for(const width of [320,1280])for(const weight of [400,600,800]){
   const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage();
   await page.route('**/*',r=>r.abort());
   const cdp=await context.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
   async function measure(include=true,mutate=false){
    const fonts=embed(base+'\n'+baselineFonts+(include?addedFonts:''),repo);
    await page.setContent(`<html data-product="${product}" data-theme="${theme}" class="${theme}" ${mutate?'style="--qd-font-family-mono:monospace"':''}><head><style>${palette}\n${fonts}\nbody{margin:0;padding:16px}.sample{font-family:var(--qd-font-mono);font-size:16px;font-weight:${weight};overflow-wrap:anywhere}</style></head><body><main class="qd-workspace" data-product="${product}"><div id="sample" class="sample">${sample}</div></main></body></html>`);
    await page.evaluate(async()=>{document.querySelector('#sample').getBoundingClientRect();await document.fonts.ready;});
    const {root:documentNode}=await cdp.send('DOM.getDocument');
    const {nodeId}=await cdp.send('DOM.querySelector',{nodeId:documentNode.nodeId,selector:'#sample'});
    const {fonts:rendered}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId});
    const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,font:getComputedStyle(document.querySelector('#sample')).fontFamily,weight:getComputedStyle(document.querySelector('#sample')).fontWeight}));
    return {...layout,rendered};
   }
   const before=await measure(false),after=await measure(true),mutation=await measure(true,true);
   assert(after.rendered.some(f=>f.isCustomFont&&f.familyName==='JetBrains Mono'&&f.glyphCount>0),'The browser must draw actual JetBrains Mono glyphs: '+JSON.stringify({product,theme,width,weight,after}));
   assert(after.rendered.every(f=>f.familyName==='JetBrains Mono'),'No device-font fallback is allowed for this Latin/numeric sample');
   assert(!mutation.rendered.some(f=>f.familyName==='JetBrains Mono'),'Changing the central family must change actual glyph selection');
   if(product==='maison')assert(!before.rendered.some(f=>f.familyName==='JetBrains Mono'),'The old Maison registration must reproduce the missing face');
   assert.equal(after.weight,String(weight));assert(!after.overflow&&!mutation.overflow);
   records.push({product,theme,width,weight,before,after,mutation});await context.close();
  }
 }
}finally{await browser.close();}
fs.writeFileSync(root+'/reviews/mono-fonts-browser.json',JSON.stringify({scope:'36 isolated actual product CSS layouts. Actual shipped Latin/numeric glyphs are inspected with Chromium CSS.getPlatformFontsForNode. No operating session, Korean-font parity, business data, writes or external network is asserted.',resources:[...new Map(resources.map(r=>[r.repo+'/'+r.path,r])).values()],manifest:output.assets.map(({bytes,...asset})=>asset),records},null,2)+'\n');
console.log(JSON.stringify({cases:records.length,customGlyphCases:records.filter(r=>r.after.rendered.some(f=>f.isCustomFont)).length,overflowCases:records.filter(r=>r.after.overflow).length}));
