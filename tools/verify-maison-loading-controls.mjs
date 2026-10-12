// Actual React controls and loading recipes, compiled from current product CSS.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {loadIconRuntime,assertIconBrowserVersion} from './app-icon-runtime.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Works'),require=createRequire(product+'/package.json'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const sources=new Map(),read=file=>{const code=fs.readFileSync(product+'/'+file,'utf8');sources.set(file,hash(code));return code;};
const load=(file,deps={})=>{const exports={};vm.runInNewContext(ts.transpileModule(read(file),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>Object.hasOwn(deps,name)?deps[name]:require(name)});return exports;};
const cn=load('lib/utils/cn.ts'),hangul=load('lib/ui/has-hangul.ts'),label=load('components/ui/label.tsx',{'@/lib/utils/cn':cn,'@/lib/ui/has-hangul':hangul}),field=load('components/ui/field.tsx',{'@/components/ui/label':label});
const {Input}=load('components/ui/input.tsx',{'@/lib/utils/cn':cn,'@/components/ui/field':field,'@/components/ui/date-picker':{DatePicker(){throw Error('Date controls are outside this text-input probe');}},'@/components/ui/time-picker':{TimePicker(){throw Error('Time controls are outside this text-input probe');}}});
const {Button}=load('components/ui/button.tsx',{'@/lib/utils/cn':cn}),{SkeletonHead,ListSkeleton,FormSkeleton}=load('components/shared/page-skeleton.tsx');
const render=(C,p={})=>renderToStaticMarkup(React.createElement(C,p));
const markup=`<main style="padding:20px;max-width:720px"><section data-probe="input">${render(Input,{type:'text',placeholder:'입력칸'})}</section><section data-probe="button">${render(Button,{children:'기본 버튼'})}</section><section data-probe="compact">${render(Button,{size:'sm',children:'작은 버튼'})}</section><section data-probe="loading">${render(SkeletonHead)}${render(ListSkeleton,{rows:0})}${render(FormSkeleton,{fields:1})}</section></main>`;
function inlineCss(file,seen=new Set()){
 assert(!seen.has(file),'CSS import cycle');const next=new Set(seen);next.add(file);
 return read(file).replace(/@import\s+url\("https:\/\/cdn\.jsdelivr\.net\/gh\/orioncactus\/pretendard@v1\.3\.9\/dist\/web\/variable\/pretendardvariable-dynamic-subset\.css"\);/g,'').replace(/@import\s+"(\.\/[^"]+\.css)";/g,(_,relative)=>{
  const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),relative));assert(target.startsWith('app/')&&!target.includes('..'));return inlineCss(target,next);
 });
}
const postcss=require('postcss'),tailwind=require('tailwindcss'),loadConfig=require('tailwindcss/loadConfig');
const config=loadConfig(product+'/tailwind.config.ts'),css=(await postcss([tailwind({...config,content:[{raw:markup,extension:'html'}]}),require('autoprefixer')]).process(inlineCss('app/globals.css'),{from:product+'/app/globals.css'})).css;
const pendingImports=[];postcss.parse(css).walkAtRules('import',rule=>pendingImports.push(rule.params));assert.deepEqual(pendingImports,[],'Every local stylesheet must be included');
const {chromium}=loadIconRuntime(path.resolve(root,'../Q-Atelier')),browser=await chromium.launch({headless:true}),records=[];
assertIconBrowserVersion(browser.version());
try{
 for(const theme of ['dark','light'])for(const width of [1280,390,375,640,641])for(const hasTouch of [false,true]){
  const page=await browser.newPage({viewport:{width,height:844},hasTouch,reducedMotion:'reduce'});await page.route('**/*',route=>route.abort());
  await page.setContent(`<html class="${theme}" data-theme="${theme}" data-product="maison"><head><style>${css}</style></head><body>${markup}</body></html>`);
  const measure=()=>page.evaluate(()=>{
   const root=getComputedStyle(document.documentElement),height=selector=>getComputedStyle(document.querySelector(selector)).height;
   const all=[...document.querySelectorAll('[data-probe="loading"] .qd-skeleton')],group=token=>all.filter(e=>e.classList.contains('h-[var('+token+')]')).map(e=>getComputedStyle(e).height);
   return {regularToken:root.getPropertyValue('--qd-control-height').trim(),compactToken:root.getPropertyValue('--qd-control-height-sm').trim(),input:height('[data-probe="input"] input'),button:height('[data-probe="button"] button'),compactButton:height('[data-probe="compact"] button'),regularLoading:group('--qd-control-height'),compactLoading:group('--qd-control-height-sm'),title:height('[data-probe="loading"] .h-9.w-52')};
  });
  const verify=m=>{assert.equal(m.input,m.regularToken);assert.equal(m.button,m.regularToken);assert([m.regularToken,m.compactToken].includes(m.compactButton));assert.equal(m.regularLoading.length,6);assert.equal(m.compactLoading.length,2);for(const h of m.regularLoading)assert.equal(h,m.regularToken);for(const h of m.compactLoading)assert.equal(h,m.compactButton);};
  const before=await measure();try{verify(before);}catch(error){console.log(JSON.stringify({theme,width,hasTouch,before}));throw error;}
  if(width===390&&hasTouch)await page.screenshot({path:path.resolve(root,'../tmp/qd-maison-loading-final-'+theme+'.png')});
  await page.addStyleTag({content:'html { --qd-control-height: 48px !important; --qd-control-height-sm: 40px !important; }'});
  const after=await measure();verify(after);assert.equal(after.regularToken,'48px');assert.equal(after.compactToken,'40px');assert.equal(after.title,before.title);
  records.push({theme,width,hasTouch,before,mutation:after});await page.close();
 }
}finally{await browser.close();}
const report={scope:'Actual current product text Input, default/compact Button and Head/List/Form loading renderers. Current local stylesheets and installed Tailwind are compiled together. Twenty viewport/theme/pointer combinations plus central height mutations, reduced motion, no credentials, business data, date-control invocation or network requests. Fixed control geometry only, not typography or business-screen visual certification.',renderer:browser.version(),sources:[...sources].map(([path,sourceHash])=>({path,sourceHash})),records};
if(process.argv.includes('--write'))fs.writeFileSync(root+'/reviews/maison-loading-control-probe.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({cases:records.length,states:records.length*2,loadingMeasurements:records.length*2*8,controlMeasurements:records.length*2*3,passed:true}));
