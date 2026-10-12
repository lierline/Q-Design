// Actual SocialLinks JSX in a local, network-disabled geometry fixture.
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {ts,glyphPath,inspectSocialGlyphs} from './atelier-social-glyph-review.mjs';
import {hash} from './style-arguments-core.mjs';import {loadIconRuntime,assertIconBrowserVersion} from './app-icon-runtime.mjs';
import {beforeSocialDist} from './atelier-social-touch-foundation.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',req=createRequire(repo+'/package.json'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
const source=fs.readFileSync(repo+'/'+glyphPath,'utf8'),{sf,fn}=inspectSocialGlyphs(source);
function load(code,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:req,...globals});return exports;}
const runtime=load(fs.readFileSync(root+'/source/design/atelier-runtime.ts','utf8'));
const baseline=process.argv.includes('--baseline'),records=[];
const iconFiles=['components/q-design-icons/_icon.tsx','components/q-design-icons/Globe.tsx'];
for(const p of iconFiles)assert.equal(hash(fs.readFileSync(repo+'/'+p,'utf8')),hash(fs.readFileSync(root+'/dist/react-icons/'+path.basename(p),'utf8')));
const factory=load(fs.readFileSync(repo+'/'+iconFiles[0],'utf8'));
const {Globe}=load(fs.readFileSync(repo+'/'+iconFiles[1],'utf8'),{require:n=>n==='./_icon'?factory:req(n)});
const {SocialLinks}=load('export '+fn.getText(sf),{QDPresentation:runtime.QDPresentation,QDScale:{radius:'var(--qd-radius)',space:{2:'var(--qd-space-2)',3:'var(--qd-space-3)'}},QDText:{textDecoration:{v30a0924a33:'none'}},T:{border:'var(--qd-border)',muted:'var(--qd-muted)',champagne:'var(--qd-accent)'},Globe});
const cssFiles=['dist/q-design.foundation.atelier.css','patterns/components.css','dist/q-design.palette.atelier.css'],cssSources=cssFiles.map(f=>{const s=fs.readFileSync(root+'/'+f,'utf8');return {path:f,code:baseline&&f===cssFiles[0]?beforeSocialDist(s):s};}),css=cssSources.map(s=>s.code).join('\n');
const {chromium}=loadIconRuntime(repo),browser=await chromium.launch({headless:true});assertIconBrowserVersion(browser.version());
try{for(const theme of ['dark','light'])for(const width of [375,390,767,768,1280])for(const touch of [false,true]){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:touch});const page=await context.newPage();await page.route('**/*',r=>r.abort());
 await page.setContent(`<html data-product="atelier" data-theme="${theme}" class="${theme}"><head><style>*,::before,::after{box-sizing:border-box}body{margin:0;padding:20px}${css}</style></head><body><div class="qa-auth-form-wrap">${renderToStaticMarkup(React.createElement(SocialLinks))}</div></body></html>`);
 const measure=()=>page.evaluate(()=>{
  const links=Array.from(document.querySelectorAll('a.qa-social-link'));
  const boxes=links.map(a=>{const r=a.getBoundingClientRect(),s=getComputedStyle(a),p=getComputedStyle(a,'::after'),active=p.content!=='none',n=v=>parseFloat(v)||0;return {width:r.width,height:r.height,radius:s.borderRadius,afterContent:p.content,afterInset:p.inset,hit:{left:r.left+(active?n(p.left):0),right:r.right-(active?n(p.right):0),top:r.top+(active?n(p.top):0),bottom:r.bottom-(active?n(p.bottom):0)}};});
  const overlaps=boxes.slice(1).map((b,i)=>Math.max(0,Math.min(b.hit.right,boxes[i].hit.right)-Math.max(b.hit.left,boxes[i].hit.left)));
  return {touch:matchMedia('(hover: none) and (pointer: coarse)').matches,boxes,overlaps,scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};
 });
 const before=await measure();assert.equal(before.touch,touch);assert.equal(before.boxes.length,3);assert(before.scrollWidth<=width+1);
 const expected=baseline?32:touch||width<768?44:32;for(const b of before.boxes){assert.equal(b.width,expected);assert.equal(b.height,expected);assert.equal(b.radius,'10px');if(touch&&!baseline){assert.equal(b.hit.right-b.hit.left,44);assert.equal(b.hit.bottom-b.hit.top,44);}}
 if(!baseline)assert(before.overlaps.every(n=>n===0),'Adjacent targets overlap');
 if(theme==='dark'&&width===390&&touch){const center=await page.locator('a.qa-social-link').evaluateAll(links=>{const a=links[0].getBoundingClientRect(),b=links.at(-1).getBoundingClientRect();return {x:(a.left+b.right)/2,y:(a.top+a.bottom)/2};});await page.screenshot({path:root+'/reviews/phase70-social-touch-'+(baseline?'before':'after')+'.png',clip:{x:center.x-100,y:center.y-40,width:200,height:80}});}
 await page.addStyleTag({content:'html { --qd-control-height:48px !important; --qd-radius:6px !important; }'});const mutation=await measure();for(const b of mutation.boxes){assert.equal(b.radius,'6px');if(!baseline&&(touch||width<768)){assert.equal(b.width,48);assert.equal(b.height,48);}}
 if(!baseline)assert(mutation.overlaps.every(n=>n===0));
 records.push({theme,width,touch,before,mutation});await context.close();
}}finally{await browser.close();}
fs.writeFileSync(root+'/reviews/social-link-touch-'+(baseline?'baseline':'browser')+'.json',JSON.stringify({scope:'20 local static geometry cases. Actual SocialLinks JSX and actual canonical Globe, real fine/coarse pointer contexts, two themes and shared control-height/radius mutations. No authentication or external navigation is executed.',sourceHash:hash(source),icons:iconFiles.map(p=>({path:p,hash:hash(fs.readFileSync(repo+'/'+p,'utf8'))})),css:cssSources.map(s=>({path:s.path,hash:hash(s.code)})),records},null,2)+'\n');
console.log(JSON.stringify({cases:records.length,baseline,overlappingCases:records.filter(r=>r.before.overlaps.some(n=>n>0)).length}));
